#!/usr/bin/env node
/**
 * Prints a Chrome DevTools Console one-liner that extracts
 * Slack session tokens and copies them to clipboard as JSON.
 *
 * Usage: npm run bookmarklet
 *
 * The output is designed to be pasted into the Chrome Console
 * while on app.slack.com, then the result pasted into --setup.
 */

// Token-only extraction (cookie is HttpOnly — extracted from Chrome's cookie DB on macOS)
const oneLiner = `copy(JSON.parse(localStorage.localConfig_v2).teams[Object.keys(JSON.parse(localStorage.localConfig_v2).teams)[0]].token)`;

const isMac = process.platform === 'darwin';
const hotkey = isMac ? 'Cmd+Option+J' : 'Ctrl+Shift+J';

console.log();
console.log('Slack MCP — Token Extractor');
console.log('===========================');
console.log();
console.log(`1. Open Chrome → app.slack.com (must be logged in)`);
console.log(`2. Press ${hotkey} to open the Console`);
console.log(`3. Paste this and press Enter:`);
console.log();
console.log(`   ${oneLiner}`);
console.log();
console.log(`4. Your token is now on the clipboard`);
if (isMac) {
  console.log(`5. Run: npx -y @jtalk22/slack-mcp --setup`);
  console.log(`6. Paste when prompted (cookie is extracted automatically)`);
} else {
  console.log(`5. You'll also need the 'd' cookie from Chrome DevTools > Application > Cookies`);
  console.log(`6. Run: npx -y @jtalk22/slack-mcp --setup`);
  console.log(`7. Paste both when prompted`);
}
console.log();
