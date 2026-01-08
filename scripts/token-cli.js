#!/usr/bin/env node
/**
 * Token CLI - Manage Slack tokens
 */

import { loadTokens, saveTokens, extractFromChrome, getFromFile, TOKEN_FILE, KEYCHAIN_SERVICE } from "../lib/token-store.js";
import { slackAPI } from "../lib/slack-client.js";
import * as readline from "readline";

const command = process.argv[2];

async function main() {
  switch (command) {
    case "status":
      await showStatus();
      break;
    case "refresh":
      await manualRefresh();
      break;
    case "auto":
      await autoExtract();
      break;
    case "clear":
      await clearTokens();
      break;
    default:
      console.log("Usage: token-cli.js <command>");
      console.log("");
      console.log("Commands:");
      console.log("  status   Check current token status");
      console.log("  refresh  Manually enter new tokens");
      console.log("  auto     Auto-extract from Chrome");
      console.log("  clear    Remove all stored tokens");
  }
}

async function showStatus() {
  const creds = loadTokens();
  if (!creds) {
    console.log("No tokens found");
    console.log("");
    console.log("Run one of:");
    console.log("  npm run tokens:auto    (with Slack open in Chrome)");
    console.log("  npm run tokens:refresh (manual entry)");
    return;
  }

  console.log("Token source:", creds.source);
  console.log("Token file:", TOKEN_FILE);
  console.log("");

  try {
    const result = await slackAPI("auth.test", {});
    console.log("Status: VALID");
    console.log("User:", result.user);
    console.log("Team:", result.team);
    console.log("User ID:", result.user_id);
  } catch (e) {
    console.log("Status: INVALID");
    console.log("Error:", e.message);
  }
}

async function manualRefresh() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log("Manual Token Entry");
  console.log("==================");
  console.log("");
  console.log("Get tokens from Chrome DevTools:");
  console.log("1. Open https://app.slack.com");
  console.log("2. F12 → Application → Cookies → find 'd' cookie");
  console.log("3. F12 → Console → run:");
  console.log("   JSON.parse(localStorage.localConfig_v2).teams[Object.keys(JSON.parse(localStorage.localConfig_v2).teams)[0]].token");
  console.log("");

  const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

  const token = await question("Enter XOXC token: ");
  const cookie = await question("Enter XOXD cookie: ");

  rl.close();

  if (!token.startsWith("xoxc-") || !cookie.startsWith("xoxd-")) {
    console.log("");
    console.log("Invalid tokens. Token should start with xoxc-, cookie with xoxd-");
    process.exit(1);
  }

  saveTokens(token, cookie);
  console.log("");
  console.log("Tokens saved!");

  try {
    const result = await slackAPI("auth.test", {});
    console.log("Verified as:", result.user, "@", result.team);
  } catch (e) {
    console.log("Warning: Tokens may be invalid:", e.message);
  }
}

async function autoExtract() {
  console.log("Attempting Chrome auto-extraction...");
  console.log("");
  console.log("Make sure:");
  console.log("  - Chrome is running");
  console.log("  - Slack tab is open (app.slack.com)");
  console.log("  - You're logged in");
  console.log("");

  const tokens = extractFromChrome();
  if (!tokens) {
    console.log("Failed to extract tokens from Chrome.");
    console.log("Try manual entry: npm run tokens:refresh");
    process.exit(1);
  }

  saveTokens(tokens.token, tokens.cookie);
  console.log("Tokens extracted and saved!");

  try {
    const result = await slackAPI("auth.test", {});
    console.log("Verified as:", result.user, "@", result.team);
  } catch (e) {
    console.log("Warning: Tokens may be invalid:", e.message);
  }
}

async function clearTokens() {
  const fs = await import("fs");
  const { execSync } = await import("child_process");

  try {
    fs.unlinkSync(TOKEN_FILE);
    console.log("Deleted token file");
  } catch (e) {
    console.log("No token file to delete");
  }

  try {
    execSync(`security delete-generic-password -s "${KEYCHAIN_SERVICE}" -a "token" 2>/dev/null`);
    execSync(`security delete-generic-password -s "${KEYCHAIN_SERVICE}" -a "cookie" 2>/dev/null`);
    console.log("Deleted keychain entries");
  } catch (e) {
    console.log("No keychain entries to delete");
  }

  console.log("All tokens cleared");
}

main().catch(e => {
  console.error("Error:", e.message);
  process.exit(1);
});
