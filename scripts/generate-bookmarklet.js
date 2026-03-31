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

const oneLiner = `copy(JSON.stringify({token:JSON.parse(localStorage.localConfig_v2).teams[Object.keys(JSON.parse(localStorage.localConfig_v2).teams)[0]].token,cookie:document.cookie.split('; ').find(c=>c.startsWith('d=')).slice(2)}))`;

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
console.log(`4. Your tokens are now on the clipboard`);
console.log(`5. Run: npx -y @jtalk22/slack-mcp --setup`);
console.log(`6. Paste when prompted`);
console.log();
