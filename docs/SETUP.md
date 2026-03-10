# Setup Guide

## Cloud (Fastest — No Local Setup)

If you want to skip local setup entirely, use **Slack MCP Cloud**:

1. Go to [cloud.html](https://jtalk22.github.io/slack-mcp-server/cloud.html) and purchase a plan ($19/mo Solo, $49/mo Team)
2. After checkout, you'll receive an API key and ready-to-paste config for Claude Desktop / Claude Code
3. No Node.js, no Docker, no token management — one URL, 13 tools

**Claude Desktop config (Cloud):**
```json
{
  "mcpServers": {
    "slack": {
      "url": "https://mcp.revasserlabs.com/oauth/mcp"
    }
  }
}
```

**Claude Code config (Cloud):**
```json
{
  "mcpServers": {
    "slack": {
      "type": "sse",
      "url": "https://mcp.revasserlabs.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

If you prefer self-hosting (free), continue below.

---

## Self-Hosted Setup

### Prerequisites

- Node.js 20+
- Google Chrome (for token extraction on macOS)
- macOS (for Keychain storage - other platforms use file storage only)

### 1. Install via npm (Recommended)

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

**Option A: Setup Wizard (recommended)**

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

Run `npx -y @jtalk22/slack-mcp --doctor` to confirm diagnostic code, then `npx -y @jtalk22/slack-mcp --setup` with Slack open in Chrome.

### "invalid_auth" Error

Tokens have expired. Run `npx -y @jtalk22/slack-mcp --doctor` and follow the suggested next action.

### MCP Server Not Loading

1. Check `~/.claude.json` syntax
2. Verify the path to server.js is correct
3. Restart Claude Code

### Chrome Extraction Fails

Make sure:
- Chrome is running (not just in dock)
- You have a Slack tab open (not the desktop app)
- You're logged into Slack in that tab
- In Chrome menu, enable `View > Developer > Allow JavaScript from Apple Events`
