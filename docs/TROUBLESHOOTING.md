# Troubleshooting Guide

Common issues and their solutions.

---

## Install Flow Sanity Check

If first-run setup is failing, validate command resolution in a clean directory:

```bash
tmpdir="$(mktemp -d)"
cd "$tmpdir"
npx -y @jtalk22/slack-mcp --version
npx -y @jtalk22/slack-mcp --help
npx -y @jtalk22/slack-mcp --doctor
```

Expected:
- `--version` and `--help` exit `0`
- `--doctor` exits with one of:
  - `0` ready
  - `1` missing credentials
  - `2` invalid/expired credentials
  - `3` connectivity/runtime issue
- `--status` is read-only and never attempts Chrome extraction.

If `--version` fails here, the issue is install/runtime path, not Slack credentials.

---

## Hosted Version

The hosted version is live at [mcp.revasserlabs.com](https://mcp.revasserlabs.com). Free tier (no card) ships 2,000 requests/mo + 25 AI tool calls/mo + all 5 workflow profile types. Pro at $19/mo (or $190/yr) unlocks unlimited requests and AI tool calls, permanent OAuth (no 2-week token rotation), email support, and 2 workspaces. Team at $49/mo flat (or $490/yr) covers 5 workspaces with shared workflow profiles and 24h support. Safeguard at $199/mo (waitlist only) adds agent approval gates, the scheduled morning catch-up DM at 8am workspace time, and workspace memory — all *(in development)*.

The OSS package keeps the local-machine path and ships no placeholder tools: every tool it advertises runs on your machine.

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

**Cause:** Slack rotated or revoked the browser session. How long one lasts varies; on one real workspace a credential stayed valid for over 90 days, and yours may rotate sooner.

**Solution:** The server has 4 layers of token recovery:

1. **Environment variables** - From MCP config (Claude Desktop)
2. **Token file** - `~/.slack-mcp-tokens.json`
3. **macOS Keychain** - Encrypted persistent storage
4. **Chrome auto-extraction** - Fallback when all else fails

**To refresh tokens:**
```bash
# Option 1: In Claude Code/Desktop
slack_refresh_tokens

# Option 2: Package setup wizard
npx -y @jtalk22/slack-mcp --setup

# Option 3: Diagnostics check
npx -y @jtalk22/slack-mcp --doctor

# Option 4: Chrome extraction only, no prompts
npx -y @jtalk22/slack-mcp --refresh-tokens

# Option 5: Read-only credential check (never extracts from Chrome)
npx -y @jtalk22/slack-mcp --status
```

`--setup` extracts from Chrome and falls back to manual entry if that finds nothing. `--refresh-tokens` does the extraction alone and prints the reason code when it fails.

From a git checkout the same work is `npm run tokens:auto`, `npm run tokens:refresh`, and `npm run tokens:status`. Those scripts do not exist for an `npx` install.

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
SLACK_API_KEY=your-custom-key npx -y @jtalk22/slack-mcp web
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

### Hosted HTTP `/mcp` Returns 503 or 401

If you run `node src/server-http.js`, `/mcp` is protected by default.

`503 http_auth_token_missing` means you did not set:

```bash
SLACK_MCP_HTTP_AUTH_TOKEN=change-this
```

`401 unauthorized` means your request is missing or using the wrong bearer token.

Example request:

```bash
curl http://localhost:3000/mcp \
  -H "Authorization: Bearer $SLACK_MCP_HTTP_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}'
```

For local-only testing (not remote exposure), you can opt out:

```bash
SLACK_MCP_HTTP_INSECURE=1 node src/server-http.js
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

**Requirements for the default path** (LevelDB — no AppleScript, no live tab):

1. Google Chrome installed
2. Signed into Slack at `app.slack.com` in a Chrome profile at least once

Chrome does not need to be running and no Slack tab needs to be open. The token is read from Chrome's on-disk Local Storage and the cookie from its cookie database.

**Additional requirements for the AppleScript fallback**, used only when no profile has a cached token on disk, or when forced with `SLACK_MCP_EXTRACTION_MODE=applescript`:

3. Chrome running with a live Slack tab at `app.slack.com` (not the desktop app)
4. In the Chrome menu, enable `View > Developer > Allow JavaScript from Apple Events`
5. Automation permission granted to the terminal running the command

Set `SLACK_MCP_EXTRACTION_MODE=leveldb` to skip the AppleScript fallback entirely.

**Read the reason code.** Every extraction failure names its stage. Find the `code` in the error and take that row — the instruction for one code never applies to another:

| Code | Meaning | Fix |
|------|---------|-----|
| `extraction_failed_all_paths` | No Chrome profile yielded both a cookie and a token | Sign in to Slack at app.slack.com in Chrome once, then retry |
| `leveldb_no_matching_profile` | Same, with `SLACK_MCP_EXTRACTION_MODE=leveldb` | Sign in to Slack at app.slack.com in Chrome once, then retry. `SLACK_MCP_CHROME_PROFILE` pins one profile |
| `no_chrome_profiles` | No Chrome profile directories found | Set `SLACK_MCP_CHROME_USER_DATA_DIR` to the Chrome user-data directory on this machine |
| `apple_events_javascript_disabled` | The AppleScript fallback ran and Chrome refused it | In Chrome: `View > Developer > Allow JavaScript from Apple Events`, then retry. Or set `SLACK_MCP_EXTRACTION_MODE=leveldb` to skip AppleScript |
| `chrome_not_ready` | AppleScript found Chrome not running or with no windows | Open Google Chrome with a Slack tab at app.slack.com, then retry |
| `chrome_extraction_timeout` | The AppleScript token read timed out | Open Slack in Chrome, then retry |
| `keychain_access_denied` | Chrome's Safe Storage key was refused | Grant this terminal Full Disk Access in System Settings → Privacy & Security, then retry |
| `keychain_timeout` | The Safe Storage key lookup exceeded the timeout | Unlock the macOS Keychain and retry, or raise `SLACK_MCP_KEYCHAIN_TIMEOUT_MS` (default 15000) |
| `keychain_lookup_failed` | The Keychain refused the Safe Storage key | Unlock the macOS Keychain and allow this terminal Keychain access in System Settings → Privacy & Security |
| `unsupported_platform` | Not macOS | Enter the token manually, or set `SLACK_TOKEN` and `SLACK_COOKIE` in the environment |
| `chrome_extraction_failed` | Chrome returned an error that fits no case above | Read the `detail` field for the underlying Chrome error, then retry |

The `detail` field of `extraction_failed_all_paths` and `leveldb_no_matching_profile` breaks the failure down per Chrome profile. Those per-profile reasons are:

| Reason | Meaning | Fix |
|--------|---------|-----|
| `no_cookie_db` | Profile has no Cookies database | Point `SLACK_MCP_CHROME_USER_DATA_DIR` / `SLACK_MCP_CHROME_PROFILE` at the right Chrome |
| `no_slack_cookie_row` | No Slack `d` cookie in that profile | Sign into app.slack.com in that Chrome profile |
| `no_xoxd_in_cookie` | The `d` cookie decrypted but holds no `xoxd-` value | Sign in to Slack again in that profile so a `xoxd-` cookie is issued |
| `cookie_query_timeout` | The `sqlite3` query exceeded its 5s timeout | Retry. The query runs against a copy in the temp directory, so Chrome being open is not the cause |
| `cookie_query_failed` | The `sqlite3` query returned an error | Confirm `sqlite3` is on `PATH`; the query reads a copy of the profile's Cookies database |
| `cookie_value_malformed` | The stored cookie value is under 4 bytes | Sign in to Slack again in that profile so the `d` cookie is written in full |
| `unsupported_cookie_format` | The cookie lacks Chrome's `v10` prefix | Only `v10` (AES-128-CBC) is decrypted — use manual token entry for that profile |
| `cookie_decrypt_failed` | Cookie wouldn't decrypt with the Safe Storage key | Chrome may have re-keyed — restart Chrome, sign into Slack again, retry |
| `cookie_extraction_failed` | The cookie read failed for an unclassified reason | Retry; if it persists, use manual token entry |
| `cookie ok, no cached xoxc token in LevelDB` | Cookie found but no cached token on disk | Open Slack in Chrome once so the token gets cached, or use AppleScript mode |

The Safe Storage key is looked up once per run and cached, so a failing Keychain produces one clear error — not a password prompt per profile.

---

## Why Browser Tokens Instead of Slack App?

**Question:** Why not just create a Slack app with proper OAuth?

**Answer:** Slack apps cannot access DMs without explicit OAuth authorization for each conversation. This is by design for privacy.

Browser tokens (xoxc/xoxd) provide the same access you have in Slack's web interface - everything you can see, Claude can see.

**Trade-offs:**
- ✅ Full access to all your conversations
- ✅ No per-conversation authorization needed
- ❌ Session credentials rotate on Slack's schedule, not yours
- ❌ Requires Chrome for token extraction

---

## Getting Help

1. Check logs:
   - MCP: `~/Library/Logs/Claude/mcp-server-slack.log`
   - Web: `/tmp/slack-web-api.log`

2. Check the runtime and the credential in one pass:
   ```bash
   npx -y @jtalk22/slack-mcp --doctor
   ```

3. Verify the credential without touching Chrome:
   ```bash
   npx -y @jtalk22/slack-mcp --status
   ```

4. Start the server by hand. On stderr it prints the credential source, the
   active tool profile, and a `slack-mcp-server v… running` line; it then waits
   on stdin for an MCP client:
   ```bash
   npx -y @jtalk22/slack-mcp
   ```
