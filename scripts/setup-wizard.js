#!/usr/bin/env node
/**
 * slack-mcp-server Setup Wizard
 *
 * Interactive setup that:
 * - Detects platform
 * - Auto-extracts tokens on macOS
 * - Guides manual entry on Linux/Windows
 * - Validates tokens against Slack API
 * - Saves to ~/.slack-mcp-tokens.json
 */

import { platform } from "os";
import * as readline from "readline";
import {
  saveTokens,
  extractFromChrome,
  getLastExtractionError,
  isAutoRefreshAvailable,
  TOKEN_FILE,
  getFromFile,
  getFromKeychain,
} from "../lib/token-store.js";

const IS_MACOS = platform() === 'darwin';
const VERSION = "3.0.0";
const MIN_NODE_MAJOR = 20;
const AUTH_TEST_URL = process.env.SLACK_MCP_AUTH_TEST_URL || "https://slack.com/api/auth.test";

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function print(msg = '') {
  console.log(msg);
}

function printBox(lines, width = 60) {
  const border = '─'.repeat(width);
  print(`┌${border}┐`);
  for (const line of lines) {
    const padding = ' '.repeat(Math.max(0, width - line.length));
    print(`│ ${line}${padding}│`);
  }
  print(`└${border}┘`);
}

function success(msg) {
  print(`${colors.green}✓${colors.reset} ${msg}`);
}

function warn(msg) {
  print(`${colors.yellow}⚠${colors.reset} ${msg}`);
}

function error(msg) {
  print(`${colors.red}✗${colors.reset} ${msg}`);
}

function info(msg) {
  print(`${colors.blue}ℹ${colors.reset} ${msg}`);
}

async function question(rl, prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

async function pressEnterToContinue(rl) {
  await question(rl, `\n${colors.dim}[Press Enter to continue, Ctrl+C to cancel]${colors.reset}`);
}

async function validateTokens(token, cookie) {
  try {
    const response = await fetch(AUTH_TEST_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Cookie": `d=${cookie}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({}),
    });

    const result = await response.json();
    if (!result.ok) {
      return { valid: false, error: result.error || "auth.test_failed" };
    }

    return { valid: true, user: result.user, team: result.team, userId: result.user_id };
  } catch (e) {
    return { valid: false, error: e.message };
  }
}

async function runMacOSSetup(rl) {
  print();
  info("Detected platform: macOS");
  info("Auto-extraction available via AppleScript");
  print();
  print("Requirements:");
  print("  • Chrome browser installed");
  print("  • Logged into Slack in a Chrome tab");
  print("  • That Slack tab currently open");

  await pressEnterToContinue(rl);

  print();
  print("Checking for Chrome...");

  // Check if Chrome is running with a Slack tab
  const tokens = extractFromChrome();

  if (!tokens) {
    const extractionError = getLastExtractionError();
    print();
    error("Could not extract tokens from Chrome.");
    if (extractionError) {
      print(`Reason: ${extractionError.message}`);
      if (extractionError.detail) {
        print(`Detail: ${extractionError.detail}`);
      }
    }
    print();
    if (extractionError?.code === "apple_events_javascript_disabled") {
      print("Fix and retry:");
      print("  1. In Chrome menu: View > Developer > Allow JavaScript from Apple Events");
      print("  2. Keep Slack open in a Chrome tab (app.slack.com)");
      print("  3. Re-run: npx -y @jtalk22/slack-mcp --setup");
    } else {
      print("Make sure:");
      print("  1. Chrome is running");
      print("  2. You have a Slack tab open (app.slack.com)");
      print("  3. You're logged into that workspace");
    }
    print();

    const retry = await question(rl, "Try manual entry instead? (y/n): ");
    if (retry.toLowerCase() === 'y') {
      return await runManualSetup(rl);
    }
    return false;
  }

  success(`Extracted token: ${tokens.token.substring(0, 20)}...`);
  success(`Extracted cookie: ${tokens.cookie.substring(0, 20)}...`);

  print();
  print("Validating against Slack API...");

  const validation = await validateTokens(tokens.token, tokens.cookie);

  if (!validation.valid) {
    error(`Token validation failed: ${validation.error}`);
    print();
    print("Try refreshing your Slack tab and running again.");
    return false;
  }

  success(`Workspace: ${validation.team}`);
  success(`User: ${validation.user}`);

  print();
  print(`Writing to ${TOKEN_FILE}...`);
  saveTokens(tokens.token, tokens.cookie);
  success("Tokens saved with chmod 600");

  return true;
}

async function runManualSetup(rl) {
  print();
  if (IS_MACOS) {
    info("Switching to manual token entry...");
  } else {
    info(`Detected platform: ${platform()}`);
    warn("Auto-extraction not available on this platform.");
  }
  print();
  print("Follow these steps to extract tokens from Chrome:");
  print();
  print(`${colors.bold}Step 1:${colors.reset} Open Chrome and navigate to your Slack workspace`);
  print("         https://app.slack.com");
  print();
  print(`${colors.bold}Step 2:${colors.reset} Press F12 to open DevTools`);
  print();
  print(`${colors.bold}Step 3:${colors.reset} Go to the ${colors.cyan}Console${colors.reset} tab and paste this:`);
  print();
  printBox([
    "JSON.parse(localStorage.localConfig_v2).teams[",
    "  Object.keys(JSON.parse(localStorage.localConfig_v2)",
    "  .teams)[0]].token",
  ], 55);
  print();
  print(`         Copy the token (starts with ${colors.cyan}xoxc-${colors.reset})`);
  print();

  const token = await question(rl, `${colors.bold}Paste your token:${colors.reset} `);

  if (!token.startsWith('xoxc-')) {
    error("Invalid token. Token should start with 'xoxc-'");
    return false;
  }

  print();
  print(`${colors.bold}Step 4:${colors.reset} Go to ${colors.cyan}Application${colors.reset} tab → ${colors.cyan}Cookies${colors.reset} → slack.com`);
  print(`         Find the '${colors.cyan}d${colors.reset}' cookie and copy its value`);
  print();

  const cookie = await question(rl, `${colors.bold}Paste your cookie:${colors.reset} `);

  if (!cookie.startsWith('xoxd-')) {
    error("Invalid cookie. Cookie should start with 'xoxd-'");
    return false;
  }

  print();
  print("Validating against Slack API...");

  const validation = await validateTokens(token, cookie);

  if (!validation.valid) {
    error(`Token validation failed: ${validation.error}`);
    print();
    print("Common issues:");
    print("  • Tokens expired - try refreshing Slack and copying again");
    print("  • Wrong workspace - make sure you copied from the right tab");
    print("  • Incomplete copy - ensure you got the full token/cookie");
    return false;
  }

  success(`Workspace: ${validation.team}`);
  success(`User: ${validation.user}`);

  print();
  print(`Writing to ${TOKEN_FILE}...`);
  saveTokens(token, cookie);
  success("Tokens saved with chmod 600");

  return true;
}

async function showStatus() {
  const creds = getDoctorCredentials();

  if (!creds) {
    error("No tokens found");
    print("Code: missing_credentials");
    print("Message: No credentials available from environment, file, or keychain.");
    print();
    print("Run setup wizard: npx -y @jtalk22/slack-mcp --setup");
    process.exit(1);
  }

  print(`Token source: ${creds.source}`);
  if (creds.path) {
    print(`Token file: ${creds.path}`);
  }
  if (creds.updatedAt) {
    print(`Last updated: ${creds.updatedAt}`);
  }
  print();

  const result = await validateTokens(creds.token, creds.cookie);
  if (!result.valid) {
    error("Status: INVALID");
    print("Code: auth_failed");
    print(`Error: ${result.error}`);
    print();
    print("Run setup wizard to refresh: npx -y @jtalk22/slack-mcp --setup");
    process.exit(1);
  }

  success("Status: VALID");
  print("Code: ok");
  print("Message: Slack auth valid.");
  print(`User: ${result.user}`);
  print(`Team: ${result.team}`);
  print(`User ID: ${result.userId}`);
}

function getDoctorCredentials() {
  if (process.env.SLACK_TOKEN && process.env.SLACK_COOKIE) {
    return { token: process.env.SLACK_TOKEN, cookie: process.env.SLACK_COOKIE, source: "environment" };
  }

  const fileTokens = getFromFile();
  if (fileTokens?.token && fileTokens?.cookie) {
    return {
      token: fileTokens.token,
      cookie: fileTokens.cookie,
      source: "file",
      path: TOKEN_FILE,
      updatedAt: fileTokens.updatedAt,
    };
  }

  if (IS_MACOS) {
    const keychainToken = getFromKeychain("token");
    const keychainCookie = getFromKeychain("cookie");
    if (keychainToken && keychainCookie) {
      return { token: keychainToken, cookie: keychainCookie, source: "keychain" };
    }
  }

  return null;
}

function classifyAuthError(rawError) {
  const msg = String(rawError || "").toLowerCase();
  if (
    msg.includes("invalid_auth") ||
    msg.includes("token_expired") ||
    msg.includes("not_authed") ||
    msg.includes("account_inactive")
  ) {
    return 2;
  }
  return 3;
}

function parseNodeMajor() {
  return Number.parseInt(process.versions.node.split(".")[0], 10);
}

async function runDoctor() {
  print(`${colors.bold}slack-mcp-server doctor${colors.reset}`);
  print();

  const nodeMajor = parseNodeMajor();
  if (Number.isNaN(nodeMajor) || nodeMajor < MIN_NODE_MAJOR) {
    error(`Node.js ${process.versions.node} detected (requires Node ${MIN_NODE_MAJOR}+)`);
    print("Code: runtime_node_unsupported");
    print();
    print("Next action:");
    print(`  npx -y @jtalk22/slack-mcp --doctor  # rerun after upgrading Node ${MIN_NODE_MAJOR}+`);
    process.exit(3);
  }
  success(`Node.js ${process.versions.node} (supported)`);

  const creds = getDoctorCredentials();
  if (!creds) {
    error("Credentials: not found");
    print("Code: missing_credentials");
    print();
    print("Next action:");
    print("  npx -y @jtalk22/slack-mcp --setup");
    process.exit(1);
  }

  success(`Credentials loaded from: ${creds.source}`);
  if (creds.path) {
    print(`Path: ${creds.path}`);
  }
  if (creds.updatedAt) {
    print(`Last updated: ${creds.updatedAt}`);
  }

  print();
  print("Validating Slack auth...");
  const validation = await validateTokens(creds.token, creds.cookie);
  if (!validation.valid) {
    const exitCode = classifyAuthError(validation.error);
    error(`Slack auth failed: ${validation.error}`);
    print(`Code: ${exitCode === 2 ? "auth_invalid" : "runtime_auth_check_failed"}`);
    print();
    print("Next action:");
    if (exitCode === 2) {
      print("  npx -y @jtalk22/slack-mcp --setup");
    } else {
      print("  Check network connectivity and retry:");
      print("  npx -y @jtalk22/slack-mcp --doctor");
    }
    process.exit(exitCode);
  }

  success(`Slack auth valid for ${validation.user} @ ${validation.team}`);
  print("Code: ok");
  print();
  print("Ready. Next command:");
  print("  npx -y @jtalk22/slack-mcp");
  process.exit(0);
}

async function showHelp() {
  print(`${colors.bold}slack-mcp-server v${VERSION}${colors.reset}`);
  print();
  print("Full Slack access for Claude via MCP. Session mirroring bypasses OAuth.");
  print();
  print(`${colors.bold}Usage:${colors.reset}`);
  print("  npx -y @jtalk22/slack-mcp             Start MCP server (stdio)");
  print("  npx -y @jtalk22/slack-mcp --setup     Interactive token setup wizard");
  print("  npx -y @jtalk22/slack-mcp --status    Check token health");
  print("  npx -y @jtalk22/slack-mcp --doctor    Run runtime and auth diagnostics");
  print("  npx -y @jtalk22/slack-mcp --version   Print version");
  print("  npx -y @jtalk22/slack-mcp --help      Show this help");
  print();
  print(`${colors.bold}npm scripts:${colors.reset}`);
  print("  npm start              Start MCP server");
  print("  npm run web            Start REST API + Web UI (port 3000)");
  print("  npm run tokens:auto    Auto-extract from Chrome (macOS)");
  print("  npm run tokens:status  Check token health");
  print();
  print(`${colors.bold}More info:${colors.reset}`);
  print("  https://github.com/jtalk22/slack-mcp-server");
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case '--setup':
    case 'setup':
      break; // Continue to wizard
    case '--status':
    case 'status':
      await showStatus();
      return;
    case '--doctor':
    case 'doctor':
      await runDoctor();
      return;
    case '--version':
    case '-v':
      print(`slack-mcp-server v${VERSION}`);
      return;
    case '--help':
    case '-h':
    case 'help':
      await showHelp();
      return;
    default:
      if (command) {
        error(`Unknown command: ${command}`);
        print();
      }
      await showHelp();
      return;
  }

  // Run setup wizard
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  print();
  printBox([
    `🔧 slack-mcp-server Setup Wizard v${VERSION}`,
    '',
    'This wizard will extract your Slack session tokens',
    'from Chrome and configure slack-mcp-server.',
    '',
    'Your tokens will be stored locally at:',
    `  ${TOKEN_FILE}`,
  ], 58);

  try {
    let success;

    if (IS_MACOS && isAutoRefreshAvailable()) {
      success = await runMacOSSetup(rl);
    } else {
      success = await runManualSetup(rl);
    }

    print();
    if (success) {
      print(`${colors.green}${colors.bold}Setup complete!${colors.reset}`);
      print();
      print("Next steps:");
      print("  • Verify: npx -y @jtalk22/slack-mcp --status");
      print("  • Start server: npx -y @jtalk22/slack-mcp");
      print("  • Or add to Claude Desktop config");
    } else {
      print(`${colors.red}Setup failed.${colors.reset} See errors above.`);
      process.exit(1);
    }
  } finally {
    rl.close();
  }
}

main().catch(e => {
  error(`Error: ${e.message}`);
  process.exit(1);
});
