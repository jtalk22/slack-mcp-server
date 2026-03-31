/**
 * Token Storage Module
 *
 * Multi-layer token persistence:
 * 1. Environment variables (highest priority)
 * 2. Token file (~/.slack-mcp-tokens.json)
 * 3. macOS Keychain (most secure)
 * 4. Chrome auto-extraction (fallback)
 */

import { readFileSync, writeFileSync, existsSync, renameSync, unlinkSync, chmodSync, copyFileSync, mkdtempSync } from "fs";
import { homedir, platform, tmpdir } from "os";
import { join } from "path";
import { execFileSync } from "child_process";
import { pbkdf2Sync, createDecipheriv } from "crypto";

const TOKEN_FILE = join(homedir(), ".slack-mcp-tokens.json");
const KEYCHAIN_SERVICE = "slack-mcp-server";

// Platform detection
const IS_MACOS = platform() === 'darwin';

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
      updatedAt: data.updated_at || data.UPDATED_AT || null
    };
  } catch (e) {
    return null;
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

// Chrome profile directories to search (in priority order)
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
 * Extract the Slack session cookie from Chrome's encrypted cookie database.
 * The `d` cookie is HttpOnly — JavaScript cannot access it via document.cookie.
 * This reads Chrome's SQLite cookie store and decrypts using the Keychain-stored key.
 */
function extractCookieFromChromeDB() {
  const chromeBase = join(homedir(), 'Library', 'Application Support', 'Google', 'Chrome');

  // Find the first profile with a Slack d cookie
  for (const profile of CHROME_PROFILES) {
    const cookiesPath = join(chromeBase, profile, 'Cookies');
    if (!existsSync(cookiesPath)) continue;

    // Copy DB to temp location (Chrome holds a WAL lock on the original)
    const tmpDir = mkdtempSync(join(tmpdir(), 'slack-mcp-'));
    const tmpDb = join(tmpDir, 'Cookies');
    try {
      copyFileSync(cookiesPath, tmpDb);

      // Query for the encrypted d cookie
      const queryResult = execFileSync('sqlite3', [
        tmpDb,
        "SELECT hex(encrypted_value) FROM cookies WHERE host_key LIKE '%.slack.com%' AND name = 'd' LIMIT 1;"
      ], { encoding: 'utf-8', timeout: 5000 }).trim();

      // Clean up temp files
      try { unlinkSync(tmpDb); unlinkSync(tmpDir); } catch {}

      if (!queryResult) continue;

      // Convert hex back to buffer
      const encrypted = Buffer.from(queryResult, 'hex');
      if (encrypted.length < 4) continue;

      // Get Chrome Safe Storage password from Keychain
      const safeStoragePassword = execFileSync('security', [
        'find-generic-password', '-s', 'Chrome Safe Storage', '-w'
      ], { encoding: 'utf-8', timeout: 5000 }).trim();

      // Chrome macOS cookies: v10 prefix + AES-128-CBC
      const prefix = encrypted.subarray(0, 3).toString('utf-8');
      if (prefix !== 'v10') continue;

      const ciphertext = encrypted.subarray(3);

      // Derive key: PBKDF2-SHA1, 1003 iterations, salt 'saltysalt', 16-byte key
      const key = pbkdf2Sync(safeStoragePassword, 'saltysalt', 1003, 16, 'sha1');
      const iv = Buffer.alloc(16, ' '); // 16 space characters

      const decipher = createDecipheriv('aes-128-cbc', key, iv);
      let decrypted;
      try {
        decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      } catch {
        continue; // Decryption failed for this profile, try next
      }

      // Find xoxd- in decrypted data (Chrome prepends internal metadata bytes)
      const text = decrypted.toString('utf-8');
      const xoxdIndex = text.indexOf('xoxd-');
      if (xoxdIndex < 0) continue;

      return text.substring(xoxdIndex);
    } catch (e) {
      // Clean up on error and try next profile
      try { unlinkSync(tmpDb); } catch {}
      try { unlinkSync(tmpDir); } catch {}
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
 * Token: AppleScript executes JS in Chrome to read localStorage (requires
 *   "Allow JavaScript from Apple Events" in Chrome > View > Developer).
 * Cookie: Reads Chrome's encrypted SQLite cookie database directly. The `d`
 *   session cookie is HttpOnly and cannot be accessed via document.cookie.
 *   Decryption uses the Chrome Safe Storage key from macOS Keychain.
 */
function extractFromChromeInternal() {
  lastExtractionError = null;

  if (!IS_MACOS) {
    lastExtractionError = {
      code: "unsupported_platform",
      message: "Chrome auto-extraction is only available on macOS.",
      detail: "Use manual token setup on this platform."
    };
    return null;
  }

  // Extract cookie from Chrome's encrypted cookie database
  let cookie;
  try {
    cookie = extractCookieFromChromeDB();
  } catch (e) {
    lastExtractionError = normalizeExtractionError(e);
    return null;
  }

  if (!cookie) {
    lastExtractionError = {
      code: "cookie_not_found",
      message: "Could not extract Slack session cookie from Chrome.",
      detail: "Ensure you are logged into Slack at app.slack.com in Chrome."
    };
    return null;
  }

  // Extract token via AppleScript (localStorage)
  let token;
  try {
    token = extractTokenFromChrome();
  } catch (e) {
    lastExtractionError = normalizeExtractionError(e);
    // If we got the cookie but not the token, give a specific error
    if (cookie && !token) {
      lastExtractionError = {
        code: "apple_events_javascript_disabled",
        message: "Cookie extracted, but token extraction requires a Chrome setting.",
        detail: "In Chrome: View > Developer > Allow JavaScript from Apple Events. Then retry."
      };
    }
    return null;
  }

  if (!token) {
    lastExtractionError = {
      code: "token_not_found",
      message: "Could not extract Slack token from Chrome.",
      detail: "Ensure a Slack workspace is open in Chrome (not just the landing page). If Chrome blocks AppleScript, enable View > Developer > Allow JavaScript from Apple Events."
    };
    return null;
  }

  return { token, cookie };
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
      updatedAt: fileTokens.updatedAt
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
