# Troubleshooting Guide

Common issues and their solutions.

---

## DMs Not Showing Up

**Symptom:** `slack_list_conversations` returns channels but no DMs.

**Cause:** Slack's `conversations.list` API doesn't return IMs when using xoxc browser tokens.

**Solution:** This is handled automatically. The server discovers DMs by calling `conversations.open` for each user in your workspace. This happens in `lib/handlers.js`.

If DMs still don't appear:
1. Check you're requesting the right types: `slack_list_conversations types=im,mpim`
2. Verify the user exists: `slack_list_users`

---

## Rate Limiting Errors

**Symptom:** `{"error":"ratelimited"}` in API responses.

**Cause:** Slack limits API calls, especially when listing many users/DMs.

**Solution:** The client (`lib/slack-client.js`) implements automatic retry with exponential backoff:
- First retry: Wait 5 seconds
- Second retry: Wait 10 seconds
- Third retry: Wait 15 seconds

If you still hit limits, reduce batch sizes:
```
slack_list_conversations limit=50
```

---

## Token Expiration

**Symptom:** `invalid_auth` or `token_expired` errors.

**Cause:** Browser tokens (xoxc/xoxd) expire after 1-2 weeks.

**Solution:** The server has 4 layers of token recovery:

1. **Environment variables** - From MCP config (Claude Desktop)
2. **Token file** - `~/.slack-mcp-tokens.json`
3. **macOS Keychain** - Encrypted persistent storage
4. **Chrome auto-extraction** - Fallback when all else fails

**To refresh tokens:**
```bash
# Option 1: In Claude Code/Desktop
slack_refresh_tokens

# Option 2: CLI
npm run tokens:auto

# Option 3: Manual
npm run tokens:refresh
```

---

## Web Server Issues

### Server Stops When Terminal Closes

**Solution:** Use LaunchAgent for persistence:

```bash
# Create LaunchAgent
cat > ~/Library/LaunchAgents/com.slack-web-api.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.slack-web-api</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/node</string>
        <string>/Users/YOUR_USERNAME/slack-mcp-server/src/web-server.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/YOUR_USERNAME/slack-mcp-server</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
EOF

launchctl load ~/Library/LaunchAgents/com.slack-web-api.plist
```

### API Key Invalid

The web server generates a unique API key on first run, stored in `~/.slack-mcp-api-key`.

The key is printed to the console when you start the server:
```
Dashboard: http://localhost:3000/?key=smcp_xxxxxxxxxxxx
API Key:   smcp_xxxxxxxxxxxx
```

You can also set a custom key:
```bash
SLACK_API_KEY=your-custom-key npm run web
```

### Can't Connect to localhost:3000

Check if the server is running:
```bash
# Get your API key from ~/.slack-mcp-api-key
curl http://localhost:3000/health -H "Authorization: Bearer $(cat ~/.slack-mcp-api-key)"
```

Check LaunchAgent status:
```bash
launchctl list | grep slack-web-api
```

Check logs:
```bash
cat /tmp/slack-web-api.log
cat /tmp/slack-web-api.error.log
```

---

## Claude Desktop Issues

### Slack Tools Not Appearing

**Symptom:** Claude Desktop doesn't show Slack tools after adding config.

**Solutions:**

1. **Fully restart Claude Desktop:**
   - Cmd+Q (don't just close window)
   - Reopen the app

2. **Check config syntax:**
   ```bash
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | python -m json.tool
   ```

3. **Check MCP logs:**
   ```bash
   cat ~/Library/Logs/Claude/mcp-server-slack.log
   ```

4. **Verify node path:**
   ```bash
   which node
   # Use this full path in config
   ```

### MCP Server Crashes on Start

**Check the log:**
```bash
tail -50 ~/Library/Logs/Claude/mcp-server-slack.log
```

**Common causes:**
- Node.js not found (use full path like `/opt/homebrew/bin/node`)
- Missing tokens in env section
- Invalid JSON syntax in config

---

## Chrome Extraction Fails

**Symptom:** `slack_refresh_tokens` returns "Could not extract from Chrome"

**Requirements:**
1. Google Chrome must be running (not just in Dock)
2. Have a Slack tab open at `app.slack.com` (not desktop app)
3. Be logged into Slack in that tab
4. Grant accessibility permissions to Terminal/Claude

**Check permissions:**
System Preferences → Privacy & Security → Accessibility → Ensure Terminal is enabled

---

## Why Browser Tokens Instead of Slack App?

**Question:** Why not just create a Slack app with proper OAuth?

**Answer:** Slack apps cannot access DMs without explicit OAuth authorization for each conversation. This is by design for privacy.

Browser tokens (xoxc/xoxd) provide the same access you have in Slack's web interface - everything you can see, Claude can see.

**Trade-offs:**
- ✅ Full access to all your conversations
- ✅ No per-conversation authorization needed
- ❌ Tokens expire every 1-2 weeks
- ❌ Requires Chrome for token extraction

---

## Getting Help

1. Check logs:
   - MCP: `~/Library/Logs/Claude/mcp-server-slack.log`
   - Web: `/tmp/slack-web-api.log`

2. Test manually:
   ```bash
   cd ~/slack-mcp-server
   node src/server.js  # Should say "running"
   ```

3. Verify tokens:
   ```bash
   npm run tokens:status
   ```
