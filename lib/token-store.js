/**
 * Token Storage Module
 *
 * Multi-layer token persistence:
 * 1. Environment variables (highest priority)
 * 2. Token file (~/.slack-mcp-tokens.json)
 * 3. macOS Keychain (most secure)
 * 4. Chrome auto-extraction (fallback)
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { execSync } from "child_process";

const TOKEN_FILE = join(homedir(), ".slack-mcp-tokens.json");
const KEYCHAIN_SERVICE = "slack-mcp-server";

// ============ Keychain Storage ============

export function getFromKeychain(key) {
  try {
    const result = execSync(
      `security find-generic-password -s "${KEYCHAIN_SERVICE}" -a "${key}" -w 2>/dev/null`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    return result.trim();
  } catch (e) {
    return null;
  }
}

export function saveToKeychain(key, value) {
  try {
    // Delete existing entry
    try {
      execSync(`security delete-generic-password -s "${KEYCHAIN_SERVICE}" -a "${key}" 2>/dev/null`, { stdio: 'pipe' });
    } catch (e) { /* ignore */ }

    // Add new entry
    execSync(`security add-generic-password -s "${KEYCHAIN_SERVICE}" -a "${key}" -w "${value}"`, { stdio: 'pipe' });
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
      updatedAt: data.updated_at
    };
  } catch (e) {
    return null;
  }
}

export function saveToFile(token, cookie) {
  const data = {
    SLACK_TOKEN: token,
    SLACK_COOKIE: cookie,
    updated_at: new Date().toISOString()
  };
  writeFileSync(TOKEN_FILE, JSON.stringify(data, null, 2));
  try {
    execSync(`chmod 600 "${TOKEN_FILE}"`);
  } catch (e) { /* ignore on non-unix */ }
}

// ============ Chrome Extraction ============

// Multiple localStorage paths Slack might use (for robustness)
const SLACK_TOKEN_PATHS = [
  // Current known path
  `JSON.parse(localStorage.localConfig_v2).teams[Object.keys(JSON.parse(localStorage.localConfig_v2).teams)[0]].token`,
  // Potential future paths
  `JSON.parse(localStorage.localConfig_v3).teams[Object.keys(JSON.parse(localStorage.localConfig_v3).teams)[0]].token`,
  // Redux store path (older Slack)
  `JSON.parse(localStorage.getItem('reduxPersist:localConfig'))?.teams?.[Object.keys(JSON.parse(localStorage.getItem('reduxPersist:localConfig'))?.teams || {})[0]]?.token`,
  // Direct boot data
  `window.boot_data?.api_token`,
];

export function extractFromChrome() {
  try {
    // Extract cookie
    const cookieScript = `
      tell application "Google Chrome"
        repeat with w in windows
          repeat with t in tabs of w
            if URL of t contains "slack.com" then
              return execute t javascript "document.cookie.split('; ').find(c => c.startsWith('d='))?.split('=')[1] || ''"
            end if
          end repeat
        end repeat
        return ""
      end tell
    `;
    const cookie = execSync(`osascript -e '${cookieScript.replace(/'/g, "'\"'\"'")}'`, {
      encoding: 'utf-8', timeout: 5000
    }).trim();

    if (!cookie || !cookie.startsWith('xoxd-')) return null;

    // Try multiple token extraction paths
    const tokenPathsJS = SLACK_TOKEN_PATHS.map((path, i) =>
      `try { var t${i} = ${path}; if (t${i}?.startsWith('xoxc-')) return t${i}; } catch(e) {}`
    ).join(' ');

    const tokenScript = `
      tell application "Google Chrome"
        repeat with w in windows
          repeat with t in tabs of w
            if URL of t contains "slack.com" then
              return execute t javascript "(function() { ${tokenPathsJS} return ''; })()"
            end if
          end repeat
        end repeat
        return ""
      end tell
    `;
    const token = execSync(`osascript -e '${tokenScript.replace(/'/g, "'\"'\"'")}'`, {
      encoding: 'utf-8', timeout: 5000
    }).trim();

    if (!token || !token.startsWith('xoxc-')) return null;

    return { token, cookie };
  } catch (e) {
    return null;
  }
}

// ============ Main Token Loader ============

export function loadTokens(forceRefresh = false, logger = console) {
  // Priority 1: Environment variables
  if (!forceRefresh && process.env.SLACK_TOKEN && process.env.SLACK_COOKIE) {
    return {
      token: process.env.SLACK_TOKEN,
      cookie: process.env.SLACK_COOKIE,
      source: "environment"
    };
  }

  // Priority 2: Token file
  if (!forceRefresh) {
    const fileTokens = getFromFile();
    if (fileTokens?.token && fileTokens?.cookie) {
      return {
        token: fileTokens.token,
        cookie: fileTokens.cookie,
        source: "file",
        updatedAt: fileTokens.updatedAt
      };
    }
  }

  // Priority 3: Keychain
  if (!forceRefresh) {
    const keychainToken = getFromKeychain("token");
    const keychainCookie = getFromKeychain("cookie");
    if (keychainToken && keychainCookie) {
      return {
        token: keychainToken,
        cookie: keychainCookie,
        source: "keychain"
      };
    }
  }

  // Priority 4: Chrome auto-extract
  logger.error("Attempting Chrome auto-extraction...");
  const chromeTokens = extractFromChrome();
  if (chromeTokens) {
    logger.error("Successfully extracted tokens from Chrome!");
    saveTokens(chromeTokens.token, chromeTokens.cookie);
    return {
      token: chromeTokens.token,
      cookie: chromeTokens.cookie,
      source: "chrome-auto"
    };
  }

  return null;
}

export function saveTokens(token, cookie) {
  saveToFile(token, cookie);
  saveToKeychain("token", token);
  saveToKeychain("cookie", cookie);
}

export { TOKEN_FILE, KEYCHAIN_SERVICE };
