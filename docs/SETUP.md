# Setup Guide

## Prerequisites

- Node.js 18+
- Google Chrome (for token extraction)
- macOS (for Keychain storage - other platforms use file storage only)

## Installation

### 1. Clone or Copy the Project

```bash
cd ~
git clone https://github.com/jtalk22/slack-mcp-server.git
# or if already exists:
cd ~/slack-mcp-server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Get Slack Tokens

**Option A: Automatic Extraction**

1. Open Chrome
2. Navigate to https://app.slack.com and log in
3. Run:
   ```bash
   npm run tokens:auto
   ```

**Option B: Manual Extraction**

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

### 4. Configure Claude Desktop (GUI App)

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "slack": {
      "command": "/opt/homebrew/bin/node",
      "args": ["/Users/YOUR_USERNAME/slack-mcp-server/src/server.js"],
      "env": {
        "SLACK_TOKEN": "xoxc-your-token-here",
        "SLACK_COOKIE": "xoxd-your-cookie-here",
        "PATH": "/opt/homebrew/bin:/usr/bin:/bin"
      }
    }
  }
}
```

**Important:**
- Replace `YOUR_USERNAME` with your actual username
- Copy tokens from `~/.slack-mcp-tokens.json` into the env section
- Fully restart Claude Desktop (Cmd+Q, then reopen)

**Verify it's working:** Check `~/Library/Logs/Claude/mcp-server-slack.log`

### 5. Configure Claude Code (CLI)

Edit `~/.claude.json` and add under `mcpServers`:

```json
{
  "mcpServers": {
    "slack": {
      "type": "stdio",
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/slack-mcp-server/src/server.js"],
      "env": {}
    }
  }
}
```

Claude Code reads tokens from `~/.slack-mcp-tokens.json` automatically.

### 6. Restart Claude

The Slack tools will now be available in both Claude Desktop and Claude Code.

## Verification

In Claude Code, try:
```
slack_health_check
```

You should see your username and team name.

## Troubleshooting

### "No credentials found"

Run `npm run tokens:auto` with Slack open in Chrome, or `npm run tokens:refresh` to enter manually.

### "invalid_auth" Error

Tokens have expired. Open Slack in Chrome and use `slack_refresh_tokens` in Claude Code.

### MCP Server Not Loading

1. Check `~/.claude.json` syntax
2. Verify the path to server.js is correct
3. Restart Claude Code

### Chrome Extraction Fails

Make sure:
- Chrome is running (not just in dock)
- You have a Slack tab open (not the desktop app)
- You're logged into Slack in that tab
