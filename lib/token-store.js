/**
 * Token Storage Module
 *
 * Multi-layer token persistence:
 * 1. Environment variables (highest priority)
 * 2. Token file (~/.slack-mcp-tokens.json)
 * 3. macOS Keychain (most secure)
 * 4. Chrome auto-extraction (fallback)
 */

import { readFileSync, writeFileSync, existsSync, renameSync, unlinkSync, chmodSync, copyFileSync, mkdtempSync, statSync, readdirSync } from "fs";
import { homedir, platform, tmpdir } from "os";
import { join } from "path";
import { execFileSync } from "child_process";
import { pbkdf2Sync, createDecipheriv } from "crypto";

const TOKEN_FILE = join(homedir(), ".slack-mcp-tokens.json");
const KEYCHAIN_SERVICE = "slack-mcp-server";

// Platform detection
const IS_MACOS = platform() === 'darwin';

// Default Chrome user-data dir on macOS
const DEFAULT_CHROME_BASE = join(homedir(), 'Library', 'Application Support', 'Google', 'Chrome');

// Slack xoxc- token regex: 3 numeric segments then a hex signature
const XOXC_TOKEN_RE = /xoxc-[0-9]+-[0-9]+-[0-9]+-[a-f0-9]{20,}/g;

// Refresh lock to prevent concurrent extraction attempts
let refreshInProgress = null;
let lastExtractionError = null;

// ============ Keychain Storage (macOS only) ============

export function getFromKeychain(key) {
  if (!IS_MACOS) return null; // Keychain is macOS-only
  try {
    const result = execFileSync(
      "security",
      ["find-generic-password", "-s", KEYCHAIN_SERVICE, "-a", key, "-w"],
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    return result.trim();
  } catch (e) {
    return null;
  }
}

export function saveToKeychain(key, value) {
  if (!IS_MACOS) return false; // Keychain is macOS-only
  try {
    // Delete existing entry
    try {
      execFileSync("security", ["delete-generic-password", "-s", KEYCHAIN_SERVICE, "-a", key], { stdio: 'pipe' });
    } catch (e) { /* ignore */ }

    // Add new entry
    execFileSync("security", ["add-generic-password", "-s", KEYCHAIN_SERVICE, "-a", key, "-w", value], { stdio: 'pipe' });
    return true;
  } catch (e) {
    return false;
  }
}

// ============ File Storage ============

export function getFromFile() {
  if (!existsSync(TOKEN_FILE)) return null;
  try {
    const data = JSON.parse(readFileSync(TOKEN_FILE, "utf-8"));
    return {
      token: data.SLACK_TOKEN,
      cookie: data.SLACK_COOKIE,
      updatedAt: data.updated_at || data.UPDATED_AT || null,
      lastAutoHealAttempt: data.last_auto_heal_attempt || null,
      lastAutoHealError: data.last_auto_heal_error || null,
      stuckSince: data.stuck_since || null
    };
  } catch (e) {
    return null;
  }
}

/**
 * Persist auto-heal telemetry into the token file.
 * Best-effort: silent on failure (tokens are more important than metadata).
 * error === null indicates a successful auto-heal; any non-null string is an
 * error code (e.g. "apple_events_javascript_disabled"). When the error code
 * changes, stuck_since is reset; when it stays the same across attempts,
 * stuck_since is preserved so downstream consumers can detect a long-running
 * stuck state.
 */
export function saveAutoHealTelemetry({ attemptAt, error }) {
  if (!existsSync(TOKEN_FILE)) return;
  try {
    const data = JSON.parse(readFileSync(TOKEN_FILE, "utf-8"));
    data.last_auto_heal_attempt = attemptAt;
    if (error) {
      if (data.last_auto_heal_error !== error) {
        data.stuck_since = attemptAt;
      }
      data.last_auto_heal_error = error;
    } else {
      data.last_auto_heal_error = null;
      data.stuck_since = null;
    }
    atomicWriteSync(TOKEN_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    // Silent: telemetry must never break the auto-heal hot path.
  }
}

/**
 * Atomic write to prevent file corruption from concurrent writes
 */
function atomicWriteSync(filePath, content) {
  const tempPath = `${filePath}.${process.pid}.tmp`;
  try {
    writeFileSync(tempPath, content);
    if (IS_MACOS || platform() === 'linux') {
      try { chmodSync(tempPath, 0o600); } catch {}
    }
    renameSync(tempPath, filePath); // Atomic on POSIX systems
  } catch (e) {
    // Clean up temp file on error
    try { unlinkSync(tempPath); } catch {}
    throw e;
  }
}

export function saveToFile(token, cookie) {
  const data = {
    SLACK_TOKEN: token,
    SLACK_COOKIE: cookie,
    updated_at: new Date().toISOString()
  };
  atomicWriteSync(TOKEN_FILE, JSON.stringify(data, null, 2));
}

// ============ Chrome Extraction ============

// Multiple localStorage paths Slack might use (for robustness)
const SLACK_TOKEN_PATHS = [
  `JSON.parse(localStorage.localConfig_v2).teams[Object.keys(JSON.parse(localStorage.localConfig_v2).teams)[0]].token`,
  `JSON.parse(localStorage.localConfig_v3).teams[Object.keys(JSON.parse(localStorage.localConfig_v3).teams)[0]].token`,
  `JSON.parse(localStorage.getItem('reduxPersist:localConfig'))?.teams?.[Object.keys(JSON.parse(localStorage.getItem('reduxPersist:localConfig'))?.teams || {})[0]]?.token`,
  `window.boot_data?.api_token`,
];

// Fallback profile list used when Local State JSON can't be read
const FALLBACK_CHROME_PROFILES = ['Default', 'Profile 1', 'Profile 2', 'Profile 3', 'Profile 4', 'Profile 5'];

// ============ Chrome profile discovery ============

/**
 * Resolve the Chrome user-data directory.
 * Override with SLACK_MCP_CHROME_USER_DATA_DIR for non-standard installations
 * (e.g. a portable Chrome, a test profile, or a Chrome Canary layout).
 */
function getChromeBase() {
  return process.env.SLACK_MCP_CHROME_USER_DATA_DIR || DEFAULT_CHROME_BASE;
}

/**
 * Extraction mode config:
 *   "auto"       - LevelDB first, AppleScript fallback (default)
 *   "leveldb"    - On-disk only, never touch AppleScript (CI-safe, headless-safe)
 *   "applescript"- Legacy AppleScript-only path
 */
function getExtractionMode() {
  const mode = (process.env.SLACK_MCP_EXTRACTION_MODE || 'auto').toLowerCase();
  return ['auto', 'leveldb', 'applescript'].includes(mode) ? mode : 'auto';
}

/**
 * Enumerate all Chrome profiles present on this machine, newest cookie DB first.
 * SLACK_MCP_CHROME_PROFILE can pin a single profile (exact directory name).
 * Falls back to the legacy hardcoded list if Local State is unreadable.
 */
function enumerateChromeProfiles() {
  const envProfile = process.env.SLACK_MCP_CHROME_PROFILE;
  if (envProfile) return [envProfile];

  const base = getChromeBase();
  const localStatePath = join(base, 'Local State');

  let profiles = [];
  try {
    const localState = JSON.parse(readFileSync(localStatePath, 'utf-8'));
    profiles = Object.keys(localState.profile?.info_cache || {});
  } catch {
    profiles = [...FALLBACK_CHROME_PROFILES];
  }

  if (profiles.length === 0) profiles = [...FALLBACK_CHROME_PROFILES];

  // Rank profiles by cookie-db mtime descending so the freshest Slack session wins.
  const ranked = profiles.map(p => {
    const cookiePath = join(base, p, 'Cookies');
    let mtime = 0;
    try { mtime = statSync(cookiePath).mtimeMs; } catch {}
    return { name: p, mtime };
  });
  ranked.sort((a, b) => b.mtime - a.mtime);
  return ranked.map(x => x.name);
}

// Chrome profile directories to search (legacy helper retained for back-compat)
const CHROME_PROFILES = ['Default', 'Profile 1', 'Profile 2', 'Profile 3'];

function normalizeExtractionError(error) {
  const raw = String(error?.message || error || "");

  if (raw.includes("Executing JavaScript through AppleScript is turned off")) {
    return {
      code: "apple_events_javascript_disabled",
      message: "Chrome needs one setting enabled for token extraction.",
      detail: "In Chrome: View > Developer > Allow JavaScript from Apple Events. Cookie extraction works without this — only the token needs it."
    };
  }

  if (raw.includes("Application isn't running") || raw.includes("Google Chrome got an error")) {
    return {
      code: "chrome_not_ready",
      message: "Chrome is not running or has no windows open.",
      detail: "Open Google Chrome with a Slack tab at app.slack.com."
    };
  }

  if (raw.toLowerCase().includes("timed out")) {
    return {
      code: "chrome_extraction_timeout",
      message: "Chrome token extraction timed out.",
      detail: "Ensure Slack is open in Chrome and retry."
    };
  }

  if (raw.includes("Chrome Safe Storage")) {
    return {
      code: "keychain_access_denied",
      message: "Could not access Chrome's encryption key in Keychain.",
      detail: "You may need to allow terminal access in System Settings > Privacy > Full Disk Access."
    };
  }

  return {
    code: "chrome_extraction_failed",
    message: "Chrome token extraction failed.",
    detail: raw || "Unknown extraction error."
  };
}

/**
 * Extract the Slack `d` cookie from a specific Chrome profile's cookie DB.
 * Returns the decrypted xoxd- cookie string or null if this profile has no
 * Slack session or decryption fails.
 *
 * Chrome holds a WAL lock on the live DB; we copy-then-query for safety.
 */
function extractCookieForProfile(profileDir) {
  const cookiesPath = join(profileDir, 'Cookies');
  if (!existsSync(cookiesPath)) return null;

  const tmpDir = mkdtempSync(join(tmpdir(), 'slack-mcp-'));
  const tmpDb = join(tmpDir, 'Cookies');
  try {
    copyFileSync(cookiesPath, tmpDb);

    const queryResult = execFileSync('sqlite3', [
      tmpDb,
      "SELECT hex(encrypted_value) FROM cookies WHERE host_key LIKE '%.slack.com%' AND name = 'd' LIMIT 1;"
    ], { encoding: 'utf-8', timeout: 5000 }).trim();

    try { unlinkSync(tmpDb); unlinkSync(tmpDir); } catch {}

    if (!queryResult) return null;

    const encrypted = Buffer.from(queryResult, 'hex');
    if (encrypted.length < 4) return null;

    // Chrome Safe Storage password (per-machine, stored in macOS Keychain)
    const safeStoragePassword = execFileSync('security', [
      'find-generic-password', '-s', 'Chrome Safe Storage', '-w'
    ], { encoding: 'utf-8', timeout: 5000 }).trim();

    // macOS Chrome cookies: v10 prefix + AES-128-CBC
    const prefix = encrypted.subarray(0, 3).toString('utf-8');
    if (prefix !== 'v10') return null;

    const ciphertext = encrypted.subarray(3);
    const key = pbkdf2Sync(safeStoragePassword, 'saltysalt', 1003, 16, 'sha1');
    const iv = Buffer.alloc(16, ' ');

    const decipher = createDecipheriv('aes-128-cbc', key, iv);
    let decrypted;
    try {
      decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    } catch {
      return null;
    }

    const text = decrypted.toString('utf-8');
    const xoxdIndex = text.indexOf('xoxd-');
    if (xoxdIndex < 0) return null;
    return text.substring(xoxdIndex);
  } catch {
    try { unlinkSync(tmpDb); unlinkSync(tmpDir); } catch {}
    return null;
  }
}

/**
 * Legacy helper: walk CHROME_PROFILES and return the first cookie found.
 * Retained so existing callers that only want a cookie string keep working.
 */
function extractCookieFromChromeDB() {
  const base = getChromeBase();
  for (const profile of enumerateChromeProfiles()) {
    const cookie = extractCookieForProfile(join(base, profile));
    if (cookie) return cookie;
  }
  return null;
}

/**
 * Extract a Slack xoxc- token by reading the on-disk LevelDB for a profile.
 * This is the preferred path:
 *   - No AppleScript required
 *   - No "Allow JavaScript from Apple Events" Chrome dev flag required
 *   - No live Slack tab required — the token just has to have been cached
 *     at some point during normal use
 *   - Works headlessly, works in CI, works when Chrome is closed
 *
 * We scan .ldb and .log files newest-first so the freshest cached token wins.
 */
function extractTokenFromLevelDB(profileDir) {
  const ldbDir = join(profileDir, 'Local Storage', 'leveldb');
  if (!existsSync(ldbDir)) return null;

  let files;
  try {
    files = readdirSync(ldbDir)
      .filter(f => /\.(ldb|log)$/.test(f))
      .map(f => {
        const p = join(ldbDir, f);
        let mtime = 0;
        try { mtime = statSync(p).mtimeMs; } catch {}
        return { path: p, mtime };
      })
      .sort((a, b) => b.mtime - a.mtime);
  } catch {
    return null;
  }

  for (const f of files) {
    try {
      // Binary encoding avoids UTF-8 re-interpretation of snappy-compressed blocks
      const txt = readFileSync(f.path).toString('binary');
      XOXC_TOKEN_RE.lastIndex = 0;
      const matches = txt.match(XOXC_TOKEN_RE);
      if (matches && matches.length) return matches[0];
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Extract Slack token from Chrome via AppleScript (reads localStorage).
 * Uses strict URL matching to avoid hitting non-Slack tabs.
 */
function extractTokenFromChrome() {
  // Prefer /client URLs (active workspace), fall back to any app.slack.com
  const urlChecks = [
    'URL of t starts with "https://app.slack.com/client"',
    'URL of t starts with "https://app.slack.com"',
  ];

  const tokenPathsJS = SLACK_TOKEN_PATHS.map((path, i) =>
    `try { var t${i} = ${path}; if (t${i} && t${i}.startsWith('xoxc-')) return t${i}; } catch(e) {}`
  ).join(' ');

  for (const urlCheck of urlChecks) {
    try {
      const script = `tell application "Google Chrome"
  repeat with w in windows
    repeat with t in tabs of w
      if ${urlCheck} then
        return execute t javascript "(function() { ${tokenPathsJS} return ''; })()"
      end if
    end repeat
  end repeat
  return ""
end tell`;

      const token = execFileSync('osascript', ['-e', script], {
        encoding: 'utf-8', timeout: 8000
      }).trim();

      if (token && token.startsWith('xoxc-')) return token;
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Extract tokens from Chrome (macOS only).
 *
 * Two extraction paths:
 *
 *   1. LevelDB (preferred, default "auto" mode tries this first):
 *      Cookie: Reads the encrypted SQLite cookie DB and decrypts with the
 *              Chrome Safe Storage key from macOS Keychain.
 *      Token:  Reads the on-disk LevelDB under Local Storage and regex-matches
 *              any cached xoxc- token. Works without a live Slack tab, without
 *              the AppleScript dev flag, and works when Chrome is closed.
 *
 *   2. AppleScript (legacy fallback, or forced with SLACK_MCP_EXTRACTION_MODE=applescript):
 *      Cookie: Same SQLite-backed path.
 *      Token:  Drives Chrome via AppleScript to run JS against localStorage.
 *              Requires Chrome > View > Developer > "Allow JavaScript from
 *              Apple Events" AND a live app.slack.com tab. Kept because it
 *              grabs the token from whichever workspace is actually active
 *              right now, which can differ from what's cached on disk.
 *
 * Environment overrides:
 *   SLACK_MCP_CHROME_USER_DATA_DIR  - base Chrome dir (default ~/Library/Application Support/Google/Chrome)
 *   SLACK_MCP_CHROME_PROFILE        - pin a single profile directory name
 *   SLACK_MCP_EXTRACTION_MODE       - auto | leveldb | applescript
 */
function extractFromChromeInternal() {
  lastExtractionError = null;

  if (!IS_MACOS) {
    lastExtractionError = {
      code: "unsupported_platform",
      message: "Chrome auto-extraction is only available on macOS.",
      detail: "Use manual token setup on this platform, or set SLACK_TOKEN and SLACK_COOKIE env vars."
    };
    return null;
  }

  const mode = getExtractionMode();
  const base = getChromeBase();
  const profiles = enumerateChromeProfiles();

  if (profiles.length === 0) {
    lastExtractionError = {
      code: "no_chrome_profiles",
      message: "No Chrome profiles found.",
      detail: `Looked under ${base}. Set SLACK_MCP_CHROME_USER_DATA_DIR if Chrome is installed elsewhere.`
    };
    return null;
  }

  // --- Path 1: LevelDB (no AppleScript, no live tab needed) ---
  if (mode === 'leveldb' || mode === 'auto') {
    for (const profileName of profiles) {
      const profileDir = join(base, profileName);
      const cookie = extractCookieForProfile(profileDir);
      if (!cookie) continue;
      const token = extractTokenFromLevelDB(profileDir);
      if (!token) continue;
      return { token, cookie, profile: profileName, extraction_mode: 'leveldb' };
    }

    if (mode === 'leveldb') {
      lastExtractionError = {
        code: "leveldb_no_matching_profile",
        message: "No Chrome profile had both a Slack cookie and a cached xoxc- token on disk.",
        detail: `Profiles checked: ${profiles.join(', ')}. Open Slack in Chrome and sign in once, then retry. SLACK_MCP_CHROME_PROFILE can pin a specific profile.`
      };
      return null;
    }
    // Fall through to AppleScript
  }

  // --- Path 2: AppleScript + SQLite (legacy, requires live tab + dev flag) ---
  if (mode === 'applescript' || mode === 'auto') {
    let cookieSeen = null;
    for (const profileName of profiles) {
      const profileDir = join(base, profileName);
      const cookie = extractCookieForProfile(profileDir);
      if (!cookie) continue;
      cookieSeen = cookie;

      let token;
      try {
        token = extractTokenFromChrome();
      } catch (e) {
        lastExtractionError = normalizeExtractionError(e);
        continue;
      }
      if (token) {
        return { token, cookie, profile: profileName, extraction_mode: 'applescript' };
      }
    }

    if (cookieSeen && !lastExtractionError) {
      lastExtractionError = {
        code: "apple_events_javascript_disabled",
        message: "Cookie extracted, but AppleScript could not read the Slack token from localStorage.",
        detail: "Enable Chrome > View > Developer > Allow JavaScript from Apple Events, then retry. Or set SLACK_MCP_EXTRACTION_MODE=leveldb to skip AppleScript entirely."
      };
      return null;
    }
  }

  if (!lastExtractionError) {
    lastExtractionError = {
      code: "extraction_failed_all_paths",
      message: "Could not extract Slack credentials via LevelDB or AppleScript.",
      detail: `Profiles checked: ${profiles.join(', ')}. Ensure you are logged into Slack at app.slack.com in Chrome at least once.`
    };
  }
  return null;
}

/**
 * Extract tokens from Chrome with mutex lock
 * Prevents concurrent extraction attempts (race condition fix)
 */
export function extractFromChrome() {
  // Simple mutex: if another extraction is running, skip this one
  // This prevents race conditions from background + foreground refresh
  if (refreshInProgress) {
    return null; // Let the in-progress extraction complete
  }

  try {
    refreshInProgress = true;
    return extractFromChromeInternal();
  } finally {
    refreshInProgress = false;
  }
}

export function getLastExtractionError() {
  return lastExtractionError;
}

/**
 * Check if auto-refresh is available on this platform
 */
export function isAutoRefreshAvailable() {
  return IS_MACOS;
}

// ============ Main Token Loader ============

function getStoredTokens() {
  if (process.env.SLACK_TOKEN && process.env.SLACK_COOKIE) {
    return {
      token: process.env.SLACK_TOKEN,
      cookie: process.env.SLACK_COOKIE,
      source: "environment"
    };
  }

  const fileTokens = getFromFile();
  if (fileTokens?.token && fileTokens?.cookie) {
    return {
      token: fileTokens.token,
      cookie: fileTokens.cookie,
      source: "file",
      updatedAt: fileTokens.updatedAt,
      lastAutoHealAttempt: fileTokens.lastAutoHealAttempt,
      lastAutoHealError: fileTokens.lastAutoHealError,
      stuckSince: fileTokens.stuckSince
    };
  }

  const keychainToken = getFromKeychain("token");
  const keychainCookie = getFromKeychain("cookie");
  if (keychainToken && keychainCookie) {
    return {
      token: keychainToken,
      cookie: keychainCookie,
      source: "keychain"
    };
  }

  return null;
}

export function loadTokensReadOnly() {
  return getStoredTokens();
}

export function loadTokens(forceRefresh = false, logger = console, options = {}) {
  const { autoExtract = true } = options;
  if (!forceRefresh) {
    const storedTokens = getStoredTokens();
    if (storedTokens) return storedTokens;
  }

  if (!autoExtract) return null;

  logger.error?.("Attempting Chrome auto-extraction...");
  const chromeTokens = extractFromChrome();
  if (chromeTokens) {
    logger.error?.("Successfully extracted tokens from Chrome!");
    saveTokens(chromeTokens.token, chromeTokens.cookie);
    return {
      token: chromeTokens.token,
      cookie: chromeTokens.cookie,
      source: "chrome-auto"
    };
  }

  if (lastExtractionError?.code === "apple_events_javascript_disabled") {
    logger.error?.(lastExtractionError.message);
    logger.error?.(lastExtractionError.detail);
  }

  return null;
}

export function saveTokens(token, cookie) {
  saveToFile(token, cookie);
  saveToKeychain("token", token);
  saveToKeychain("cookie", cookie);
}

export { TOKEN_FILE, KEYCHAIN_SERVICE };
