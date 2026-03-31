#!/usr/bin/env node
/**
 * Generates a bookmarklet for one-click Slack token extraction.
 *
 * Usage: node scripts/generate-bookmarklet.js
 * Output: Prints the bookmarklet URL to stdout.
 *
 * How it works:
 *   1. User drags the bookmarklet to their Chrome toolbar
 *   2. Navigates to app.slack.com (must be logged in)
 *   3. Clicks the bookmarklet
 *   4. Token + cookie are copied to clipboard as JSON
 *   5. User pastes into `npx -y @jtalk22/slack-mcp --setup`
 */

const js = `
(function(){
  try {
    var c = document.cookie.split('; ').find(function(x){return x.startsWith('d=')});
    if (!c) throw new Error('No session cookie found. Are you on app.slack.com?');
    var cookie = c.split('=').slice(1).join('=');
    var token = null;
    try {
      var cfg = JSON.parse(localStorage.localConfig_v2 || '{}');
      var tid = Object.keys(cfg.teams || {})[0];
      if (tid) token = cfg.teams[tid].token;
    } catch(e){}
    if (!token) {
      try { token = window.boot_data && window.boot_data.api_token; } catch(e){}
    }
    if (!token) throw new Error('Token not found in localStorage. Try refreshing Slack first.');
    var payload = JSON.stringify({token: token, cookie: cookie});
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(payload).then(function(){
        alert('Tokens copied to clipboard.\\n\\nPaste into: npx -y @jtalk22/slack-mcp --setup');
      });
    } else {
      window.prompt('Copy this (Cmd+A, Cmd+C):', payload);
    }
  } catch(e) {
    alert('Token extraction failed: ' + e.message);
  }
})();
`.replace(/\n/g, '').replace(/  +/g, ' ').trim();

const bookmarklet = `javascript:${encodeURIComponent(js)}`;

console.log('Slack MCP Token Bookmarklet');
console.log('==========================');
console.log();
console.log('Drag this URL to your Chrome bookmarks bar:');
console.log();
console.log(bookmarklet);
console.log();
console.log('Then:');
console.log('  1. Go to app.slack.com (must be logged in)');
console.log('  2. Click the bookmarklet');
console.log('  3. Tokens are copied to clipboard');
console.log('  4. Run: npx -y @jtalk22/slack-mcp --setup');
console.log('  5. Paste when prompted');
