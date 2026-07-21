# Setup Guide

## Hosted (Coming Soon)

A hosted version with permanent OAuth tokens, semantic search, and AI summaries is in development at [mcp.revasserlabs.com](https://mcp.revasserlabs.com). The current release is self-hosted only — continue below.

---

## Self-Hosted Setup

### Prerequisites

- Node.js 20+
- Google Chrome (for token extraction on macOS)
- macOS (for Keychain storage - other platforms use file storage only)

### 1. Install via npm

```bash
npm install -g @jtalk22/slack-mcp
# or use npx (no install):
npx -y @jtalk22/slack-mcp --version
```

### 1b. Or Clone the Repository

```bash
git clone https://github.com/jtalk22/slack-mcp-server.git
cd slack-mcp-server
npm install
```

### 2. Verify Installation

```bash
tmpdir="$(mktemp -d)"
cd "$tmpdir"
npx -y @jtalk22/slack-mcp --version
npx -y @jtalk22/slack-mcp --help
npx -y @jtalk22/slack-mcp --doctor
```

Expected:
- `--version` and `--help` succeed.
- `--doctor` exits with one clear status:
  - `0` ready
  - `1` missing credentials
  - `2` invalid/expired credentials
  - `3` connectivity/runtime issue
- `--status` is read-only and never performs Chrome extraction.

### 3. Get Slack Tokens

**Option A: Setup Wizard**

1. Open Chrome
2. Navigate to https://app.slack.com and log in
3. Run:
   ```bash
   npx -y @jtalk22/slack-mcp --setup
   ```

**Option B: Automatic Extraction (repo clone workflow)**

```bash
npm run tokens:auto
```

**Option C: Manual Extraction**

1. Open https://app.slack.com in Chrome
2. Press F12 to open DevTools
3. Go to **Application** → **Cookies** → **https://app.slack.com**
4. Find the cookie named `d` and copy its value (starts with `xoxd-`)
5. Go to **Console** and paste:
   ```javascript
   JSON.parse(localStorage.localConfig_v2).teams[Object.keys(JSON.parse(localStorage.localConfig_v2).teams)[0]].token
   ```
6. Copy the result (starts with `xoxc-`)
7. Run:
   ```bash
   npm run tokens:refresh
   ```
   And paste both values when prompted.

### 4. Configure Claude Desktop

**macOS:** Edit `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** Edit `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "slack": {
      "command": "npx",
      "args": ["-y", "@jtalk22/slack-mcp"]
    }
  }
}
```

Fully restart Claude Desktop (Cmd+Q on macOS, then reopen).

**Verify it's working:** Check `~/Library/Logs/Claude/mcp-server-slack.log` (macOS)

### 5. Configure Claude Code (CLI)

```bash
claude mcp add slack npx -y @jtalk22/slack-mcp
```

Or manually edit `~/.claude.json`:

```json
{
  "mcpServers": {
    "slack": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@jtalk22/slack-mcp"]
    }
  }
}
```

Claude Code reads tokens from `~/.slack-mcp-tokens.json` automatically.

### Optional: Keychain-Only Credential Storage (macOS)

By default, tokens are written to `~/.slack-mcp-tokens.json` (chmod 600) with the macOS Keychain as an encrypted backup. If you don't want plaintext credentials on disk at all, pick **Keychain only** when `--setup` asks where to store tokens — the choice is remembered (in `~/.slack-mcp-meta.json`), so the server, the CLI, and any LaunchAgent all follow it automatically. Already set up? Re-run `npx -y @jtalk22/slack-mcp --setup` and pick option 2; your existing token file is imported into the Keychain, then deleted once both entries verify by read-back. If that deletion ever fails (e.g. a permissions problem), nothing is silent about it: the operation reports `plaintext_removal_failed` with the exact `rm` command to run, and the file is flagged as `plaintext_file_present` in `slack_token_status` until it is gone.

In this mode credentials live exclusively in the macOS Keychain. `--setup`, `slack_refresh_tokens`, and automatic refresh all work unchanged, and non-secret bookkeeping (token timestamp, auto-heal telemetry) moves to `~/.slack-mcp-meta.json` so `slack_token_status` age reporting keeps working.

The `SLACK_MCP_TOKEN_STORAGE` env var overrides the setup choice when set (`auto`, `keychain-only`, or `file`) — useful for forcing a mode per client config:

```json
"env": {
  "SLACK_MCP_TOKEN_STORAGE": "keychain-only"
}
```

Two things to know:

- The Keychain must be unlocked for writes. A background refresh against a locked Keychain fails with a clear error and retries on the next cycle — your existing Keychain credentials are untouched.
- Unrecognized mode values fail at startup with a clear error rather than silently falling back to plaintext.

`SLACK_MCP_TOKEN_STORAGE=file` is the third mode: token file only, Keychain never touched (no Keychain prompts — useful on shared machines and in CI).

### 6. Restart Claude

The Slack tools will now be available in both Claude Desktop and Claude Code.

## Verification

In Claude Code, try:
```
slack_health_check
```

You should see your username and team name.

## Keep Tokens Fresh While Claude Is Closed (macOS, Optional)

The MCP server auto-refreshes tokens every 4 hours while Claude is running. But if you keep Claude closed for a couple weeks, tokens expire silently — your next session opens with `invalid_auth`.

A LaunchAgent fixes this. It runs token refresh twice a day regardless of whether Claude is open, as long as Chrome is running with a Slack tab somewhere.

Create `~/Library/LaunchAgents/com.yourname.slack-token-refresh.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.yourname.slack-token-refresh</string>
    <!-- The storage mode chosen in the setup wizard is followed automatically.
         To force one for this agent only, uncomment this block:
    <key>EnvironmentVariables</key>
    <dict>
        <key>SLACK_MCP_TOKEN_STORAGE</key>
        <string>keychain-only</string>
    </dict>
    -->
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>-c</string>
        <string>export NVM_DIR="$HOME/.nvm" &amp;&amp; [ -s "$NVM_DIR/nvm.sh" ] &amp;&amp; \. "$NVM_DIR/nvm.sh" &amp;&amp; exec npx -y @jtalk22/slack-mcp --refresh-tokens</string>
    </array>
    <key>StartCalendarInterval</key>
    <array>
        <dict><key>Hour</key><integer>6</integer><key>Minute</key><integer>17</integer></dict>
        <dict><key>Hour</key><integer>18</integer><key>Minute</key><integer>17</integer></dict>
    </array>
    <key>RunAtLoad</key><true/>
    <key>StandardErrorPath</key><string>/tmp/slack-token-refresh.log</string>
</dict>
</plist>
```

Load it:

```bash
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.yourname.slack-token-refresh.plist
```

Check it ran:

```bash
tail /tmp/slack-token-refresh.log
```

**Why the `bash -c` wrapper:** LaunchAgents start without a TTY, so a bare `node` won't be on PATH if you use nvm. The wrapper sources `nvm.sh` first, then runs the refresher. (If you installed node via Homebrew, replace the whole inner command with `/opt/homebrew/bin/node /opt/homebrew/bin/npx -y @jtalk22/slack-mcp --refresh-tokens`.)

**Trade-off:** Chrome must be running for extraction to succeed. If it's not, the LaunchAgent logs "Failed to extract" and tokens stay where they are — which is fine for another 12 hours.

## Troubleshooting

### "No credentials found"

Run `npx -y @jtalk22/slack-mcp --doctor` to confirm diagnostic code, then `npx -y @jtalk22/slack-mcp --setup` with Slack open in Chrome.

### "invalid_auth" Error

Tokens have expired. Run `npx -y @jtalk22/slack-mcp --doctor` and follow the suggested next action.

### MCP Server Not Loading

1. Check `~/.claude.json` syntax
2. Verify JSON syntax in your client's MCP config
3. Restart Claude Code

### Chrome Extraction Fails

Make sure:
- Chrome is running (not just in dock)
- You have a Slack tab open (not the desktop app)
- You're logged into Slack in that tab
- In Chrome menu, enable `View > Developer > Allow JavaScript from Apple Events`
