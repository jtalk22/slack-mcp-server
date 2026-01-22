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
import { loadTokens, saveTokens, extractFromChrome, isAutoRefreshAvailable, TOKEN_FILE } from "../lib/token-store.js";
import { slackAPI } from "../lib/slack-client.js";

const IS_MACOS = platform() === 'darwin';
const VERSION = "1.2.0";

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
    // Temporarily set env vars for validation
    const oldToken = process.env.SLACK_TOKEN;
    const oldCookie = process.env.SLACK_COOKIE;
    process.env.SLACK_TOKEN = token;
    process.env.SLACK_COOKIE = cookie;

    const result = await slackAPI("auth.test", {});

    // Restore env vars
    if (oldToken) process.env.SLACK_TOKEN = oldToken;
    else delete process.env.SLACK_TOKEN;
    if (oldCookie) process.env.SLACK_COOKIE = oldCookie;
    else delete process.env.SLACK_COOKIE;

    return { valid: true, user: result.user, team: result.team };
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
    print();
    error("Could not extract tokens from Chrome.");
    print();
    print("Make sure:");
    print("  1. Chrome is running");
    print("  2. You have a Slack tab open (app.slack.com)");
    print("  3. You're logged into that workspace");
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
  print("         Copy the token (starts with ${colors.cyan}xoxc-${colors.reset})");
  print();

  const token = await question(rl, `${colors.bold}Paste your token:${colors.reset} `);

  if (!token.startsWith('xoxc-')) {
    error("Invalid token. Token should start with 'xoxc-'");
    return false;
  }

  print();
  print(`${colors.bold}Step 4:${colors.reset} Go to ${colors.cyan}Application${colors.reset} tab → ${colors.cyan}Cookies${colors.reset} → slack.com`);
  print("         Find the '${colors.cyan}d${colors.reset}' cookie and copy its value");
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
  const creds = loadTokens();

  if (!creds) {
    error("No tokens found");
    print();
    print("Run setup wizard: npx @jtalk22/slack-mcp --setup");
    process.exit(1);
  }

  print(`Token source: ${creds.source}`);
  print(`Token file: ${TOKEN_FILE}`);
  if (creds.updatedAt) {
    print(`Last updated: ${creds.updatedAt}`);
  }
  print();

  try {
    // Need to set env vars for slackAPI to work
    process.env.SLACK_TOKEN = creds.token;
    process.env.SLACK_COOKIE = creds.cookie;

    const result = await slackAPI("auth.test", {});
    success("Status: VALID");
    print(`User: ${result.user}`);
    print(`Team: ${result.team}`);
    print(`User ID: ${result.user_id}`);
  } catch (e) {
    error("Status: INVALID");
    print(`Error: ${e.message}`);
    print();
    print("Run setup wizard to refresh: npx @jtalk22/slack-mcp --setup");
    process.exit(1);
  }
}

async function showHelp() {
  print(`${colors.bold}slack-mcp-server v${VERSION}${colors.reset}`);
  print();
  print("Full Slack access for Claude via MCP. Session mirroring bypasses OAuth.");
  print();
  print(`${colors.bold}Usage:${colors.reset}`);
  print("  npx @jtalk22/slack-mcp             Start MCP server (stdio)");
  print("  npx @jtalk22/slack-mcp --setup     Interactive token setup wizard");
  print("  npx @jtalk22/slack-mcp --status    Check token health");
  print("  npx @jtalk22/slack-mcp --version   Print version");
  print("  npx @jtalk22/slack-mcp --help      Show this help");
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
      print("  • Verify: npx @jtalk22/slack-mcp --status");
      print("  • Start server: npx @jtalk22/slack-mcp");
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
