# Slack MCP Server

Session-based Slack MCP for Claude and MCP clients. Local-first `stdio`/`web` with secure-default hosted HTTP in v3.

## Install + Verify

```bash
npx -y @jtalk22/slack-mcp --setup
npx -y @jtalk22/slack-mcp@latest --version
npx -y @jtalk22/slack-mcp@latest --doctor
npx -y @jtalk22/slack-mcp@latest --status
```

[Setup guide](https://github.com/jtalk22/slack-mcp-server/blob/main/docs/SETUP.md) · [30-second verify reference](https://github.com/jtalk22/slack-mcp-server/blob/main/README.md#install--verify) · [Autoplay demo landing](https://jtalk22.github.io/slack-mcp-server/) · [Latest release](https://github.com/jtalk22/slack-mcp-server/releases/latest) · [npm package](https://www.npmjs.com/package/@jtalk22/slack-mcp)

[![Live demo poster](https://jtalk22.github.io/slack-mcp-server/docs/images/demo-poster.png)](https://jtalk22.github.io/slack-mcp-server/public/demo-video.html)

Motion proof: [20-second mobile clip](https://jtalk22.github.io/slack-mcp-server/docs/videos/demo-claude-mobile-20s.mp4) · [Live demo walkthrough](https://jtalk22.github.io/slack-mcp-server/public/demo-video.html) · [Share card](https://jtalk22.github.io/slack-mcp-server/public/share.html)

Hosted migration note: `v3.0.0` keeps local `stdio`/`web` flows unchanged; hosted `/mcp` requires `SLACK_MCP_HTTP_AUTH_TOKEN` and `SLACK_MCP_HTTP_ALLOWED_ORIGINS`.

Maintainer/operator: `jtalk22` (`james@revasser.nyc`)  
Release: [`v3.0.0`](https://github.com/jtalk22/slack-mcp-server/releases/tag/v3.0.0) · Notes: [v3.0.0 notes](https://github.com/jtalk22/slack-mcp-server/blob/main/.github/v3.0.0-release-notes.md) · Support: [deployment intake](https://github.com/jtalk22/slack-mcp-server/issues/new?template=deployment-intake.md)

If this saved you setup time, consider starring the repo. Maintenance support: [GitHub Sponsors](https://github.com/sponsors/jtalk22) · [Ko-fi](https://ko-fi.com/jtalk22) · [Buy Me a Coffee](https://buymeacoffee.com/jtalk22)

## v3.0.0 at a Glance

- Hosted HTTP `/mcp` now requires bearer auth by default (`SLACK_MCP_HTTP_AUTH_TOKEN`).
- Hosted HTTP CORS now uses explicit allowlisting (`SLACK_MCP_HTTP_ALLOWED_ORIGINS`).
- Local-first paths (`stdio`, `web`) stay compatible.
- MCP tool names stay stable (no renames/removals).

## 60-Second Hosted Migration

```bash
export SLACK_TOKEN=xoxc-...
export SLACK_COOKIE=xoxd-...
export SLACK_MCP_HTTP_AUTH_TOKEN=change-this
export SLACK_MCP_HTTP_ALLOWED_ORIGINS=https://claude.ai
node src/server-http.js
```

Request with:

```bash
Authorization: Bearer <SLACK_MCP_HTTP_AUTH_TOKEN>
```

Emergency local fallback only:

```bash
SLACK_MCP_HTTP_INSECURE=1 node src/server-http.js
```

For guided hosted rollout requirements, open: [deployment intake](https://github.com/jtalk22/slack-mcp-server/issues/new?template=deployment-intake.md)

### Why This Exists

I built this because I was working with someone to help me manage a complex workload, and we kept hitting walls. They needed context from my messages—"what did X say about Y?"—and standard app/OAuth flows were too constrained for that workflow.

Screenshotting messages is not a workflow.

This server bridges the gap. It creates a secure, local bridge between Claude and your Slack web session. It gives your MCP client the same access **you** already have in the browser—search history, summarize threads, and retrieve prior context—without fighting the platform.

![Slack MCP Server Web UI](https://jtalk22.github.io/slack-mcp-server/docs/images/demo-main.png)

---

## Architecture: Local Session Mirroring

Instead of authenticating as a bot, this server leverages your existing Chrome session credentials (macOS) or manual token injection (Linux/Windows). It mirrors your user access exactly—if you can see it in Slack, Claude can see it too.

![Session Mirroring Flow](https://jtalk22.github.io/slack-mcp-server/docs/images/diagram-session-flow.svg)

### Why Not OAuth?

![OAuth vs Session Mirroring](https://jtalk22.github.io/slack-mcp-server/docs/images/diagram-oauth-comparison.svg)

**Trade-off:** Session tokens expire every 1-2 weeks. Auto-refresh (macOS) or manual update keeps things running.

---

## Features

### Core Capabilities
- **Read Any Message** - DMs, private channels, public channels
- **Full Export** - Conversations with threads and resolved usernames
- **Search** - Query across your entire workspace
- **Send Messages** - DMs or channels, with thread support
- **User Directory** - List and search 500+ users with pagination

### Stability
- **Auto Token Refresh** - Extracts fresh tokens from Chrome automatically *(macOS only)*
- **Atomic Writes** - File operations use temp-file-then-rename to prevent corruption
- **Zombie Protection** - Background timers use `unref()` for clean process exit
- **Race Condition Safety** - Mutex locks prevent concurrent token extraction
- **Rate Limit Handling** - Exponential backoff with jitter

### Tools
| Tool | Description |
|------|-------------|
| `slack_health_check` | Verify token validity and workspace info |
| `slack_token_status` | Detailed token age, health, and cache stats |
| `slack_refresh_tokens` | Auto-extract fresh tokens from Chrome |
| `slack_list_conversations` | List DMs/channels (with lazy discovery cache) |
| `slack_conversations_history` | Get messages from a channel or DM |
| `slack_get_full_conversation` | Export full history with threads |
| `slack_search_messages` | Search across workspace |
| `slack_send_message` | Send a message to any conversation |
| `slack_get_thread` | Get thread replies |
| `slack_users_info` | Get user details |
| `slack_list_users` | List workspace users (paginated, 500+ supported) |

---

## Quick Start

**Runtime:** Node.js 20+

### 30-Second Compatibility Check

```bash
npx -y @jtalk22/slack-mcp --setup
npx -y @jtalk22/slack-mcp --doctor
npx -y @jtalk22/slack-mcp --status
```

Expected:
- `--setup` launches the interactive wizard
- `--doctor` returns one clear next action with exit code:
  - `0` ready
  - `1` missing credentials
  - `2` invalid/expired credentials
  - `3` connectivity/runtime issue
- `--status` is read-only and non-mutating

Command reference: [HN launch kit](https://github.com/jtalk22/slack-mcp-server/blob/main/docs/HN-LAUNCH.md)

### Known Working Clients

- Claude Desktop (macOS/Windows/Linux)
- Claude Code CLI
- Local browser mode (`web`)
- Hosted Node runtime (`http`)
- Cloudflare Worker / Smithery transport

Compatibility matrix: [compatibility matrix](https://github.com/jtalk22/slack-mcp-server/blob/main/docs/COMPATIBILITY.md)

### Option A: npm (Recommended)

```bash
npm install -g @jtalk22/slack-mcp
```

### Option B: Clone Repository

```bash
git clone https://github.com/jtalk22/slack-mcp-server.git
cd slack-mcp-server
npm install
```

### Option C: Docker

```bash
docker pull ghcr.io/jtalk22/slack-mcp-server:latest
```

### Install Sanity (Clean Temp Directory)

```bash
tmpdir="$(mktemp -d)"
cd "$tmpdir"
npx -y @jtalk22/slack-mcp --version
npx -y @jtalk22/slack-mcp --help
npx -y @jtalk22/slack-mcp --status
```

Expected:
- `--version` and `--help` exit `0`
- `--status` exits non-zero until credentials are configured
- `--status` is read-only and never attempts Chrome extraction

---

## Configuration

### Step 1: Get Your Tokens

#### Setup Wizard (Recommended)

The interactive setup wizard handles token extraction and validation automatically:

```bash
npx -y @jtalk22/slack-mcp --setup
```

- **macOS**: Auto-extracts tokens from Chrome (have Slack open in a tab)
- **Linux/Windows**: Guides you through manual extraction step-by-step
- Validates tokens against Slack API before saving
- Stores tokens securely at `~/.slack-mcp-tokens.json`

#### Check Token Status

```bash
npx -y @jtalk22/slack-mcp --status
```

#### Alternative: Manual Token Scripts

```bash
# macOS auto-extraction
npm run tokens:auto

# Manual entry (all platforms)
npm run tokens:refresh

# Check health
npm run tokens:status
```

### Step 2: Configure Claude

#### Claude Desktop (macOS)

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

#### Claude Desktop (Windows)

Edit `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "slack": {
      "command": "npx",
      "args": ["-y", "@jtalk22/slack-mcp"],
      "env": {
        "SLACK_TOKEN": "xoxc-your-token",
        "SLACK_COOKIE": "xoxd-your-cookie"
      }
    }
  }
}
```

> **Note:** Windows/Linux users must provide tokens via `env` since auto-refresh is macOS-only.

#### Claude Code (CLI)

Add to `~/.claude.json`:

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

#### Docker Configuration

```json
{
  "mcpServers": {
    "slack": {
      "command": "docker",
      "args": ["run", "-i", "--rm",
               "-v", "~/.slack-mcp-tokens.json:/root/.slack-mcp-tokens.json",
               "ghcr.io/jtalk22/slack-mcp-server"]
    }
  }
}
```

### Step 3: Restart Claude

Fully quit and reopen Claude. The Slack tools will appear.

---

## Architecture

### Token Persistence (4 Layers)

```
Priority 1: Environment Variables (SLACK_TOKEN, SLACK_COOKIE)
    ↓ fallback
Priority 2: Token File (~/.slack-mcp-tokens.json)
    ↓ fallback
Priority 3: macOS Keychain (encrypted)
    ↓ fallback
Priority 4: Chrome Auto-Extraction (macOS only)
```

### Stability Features

#### Atomic Writes
All file operations (tokens, DM cache) use atomic writes:
```
Write to temp file → chmod 600 → rename to target
```
This prevents JSON corruption if the process is killed mid-write.

#### Zombie Process Protection
Background refresh timers use `unref()`:
```javascript
const timer = setInterval(refreshTokens, 4 * 60 * 60 * 1000);
timer.unref(); // Process can exit even if timer is pending
```
When Claude closes the MCP connection, the server exits cleanly.

#### Race Condition Prevention
A mutex lock prevents concurrent Chrome extractions:
```javascript
if (refreshInProgress) return null; // Skip if already refreshing
refreshInProgress = true;
try { return extractFromChromeInternal(); }
finally { refreshInProgress = false; }
```

---

## Web UI (optional browser/local fallback)

Claude now supports remote MCP connectors on paid plans. For claude.ai, the preferred path is adding a remote connector in Settings -> Connectors.

Reference:
- https://support.anthropic.com/en/articles/11995447-connectors-in-claude
- https://support.anthropic.com/en/articles/11175166-about-custom-integrations-using-remote-mcp

Use this Web UI when you want a local localhost dashboard, REST access, or a fallback workflow without remote connector hosting:

```bash
npm run web
# Or: npx -y @jtalk22/slack-mcp web
```

**Magic Link:** The console prints a one-click URL with the API key embedded:

```
════════════════════════════════════════════════════════════
  Slack Web API Server v3.0.0
════════════════════════════════════════════════════════════

  Dashboard: http://localhost:3000/?key=smcp_xxxxxxxxxxxx
```

Just click the link - no copy-paste needed. The key is saved to your browser and stripped from the URL for security.

<details>
<summary><strong>Screenshots</strong></summary>

| DMs View | Channels View |
|----------|---------------|
| ![DMs](https://jtalk22.github.io/slack-mcp-server/docs/images/demo-main.png) | ![Channels](https://jtalk22.github.io/slack-mcp-server/docs/images/demo-channels.png) |

</details>

---

## Hosted HTTP Mode (Secure Defaults)

Use this mode only when you need a remote MCP endpoint:

```bash
SLACK_TOKEN=xoxc-...
SLACK_COOKIE=xoxd-...
SLACK_MCP_HTTP_AUTH_TOKEN=change-this
SLACK_MCP_HTTP_ALLOWED_ORIGINS=https://claude.ai
node src/server-http.js
```

Behavior:
- `/mcp` requires `Authorization: Bearer <SLACK_MCP_HTTP_AUTH_TOKEN>` by default.
- Cross-origin browser calls are denied unless origin is listed in `SLACK_MCP_HTTP_ALLOWED_ORIGINS`.
- For local testing only, you can opt out with `SLACK_MCP_HTTP_INSECURE=1`.

---

## Operations Guides

- [Docs Index](https://github.com/jtalk22/slack-mcp-server/blob/main/docs/INDEX.md) - One-click index for setup, API, troubleshooting, deployment, and support docs
- [Deployment Modes](https://github.com/jtalk22/slack-mcp-server/blob/main/docs/DEPLOYMENT-MODES.md) - Choose the right operating model (`stdio`, `web`, hosted HTTP, Smithery/Worker)
- [Use Case Recipes](https://github.com/jtalk22/slack-mcp-server/blob/main/docs/USE_CASE_RECIPES.md) - 12 copy/paste prompts mapped to current tool contracts
- [Support Boundaries](https://github.com/jtalk22/slack-mcp-server/blob/main/docs/SUPPORT-BOUNDARIES.md) - Scope, response targets, and solo-maintainer capacity limits
- [Release Health](https://github.com/jtalk22/slack-mcp-server/blob/main/docs/RELEASE-HEALTH.md) - Track setup reliability and support-load targets through this release cycle

If you're evaluating team rollout, start with [Deployment Modes](https://github.com/jtalk22/slack-mcp-server/blob/main/docs/DEPLOYMENT-MODES.md) before exposing remote endpoints.

---

## Getting Help Fast

1. Run:
   ```bash
   npx -y @jtalk22/slack-mcp --version
   npx -y @jtalk22/slack-mcp --doctor
   ```
2. If setup fails, run:
   ```bash
   npx -y @jtalk22/slack-mcp --setup
   ```
3. Open an issue with full environment details:
   - [Bug Report Template](https://github.com/jtalk22/slack-mcp-server/issues/new?template=bug_report.md)
   - [Deployment Intake Template](https://github.com/jtalk22/slack-mcp-server/issues/new?template=deployment-intake.md)
4. For guided hosted rollout support:
   - [GitHub Discussions](https://github.com/jtalk22/slack-mcp-server/discussions)
5. Check scope and response targets:
   - [Support Boundaries](https://github.com/jtalk22/slack-mcp-server/blob/main/docs/SUPPORT-BOUNDARIES.md)
   - [Troubleshooting Guide](https://github.com/jtalk22/slack-mcp-server/blob/main/docs/TROUBLESHOOTING.md)

---

## Troubleshooting

### Tokens Expired
```bash
# macOS: Auto-refresh from Chrome
slack_refresh_tokens  # In Claude
# Or: npm run tokens:auto

# Package setup wizard
npx -y @jtalk22/slack-mcp --setup

# Linux/Windows: Manual update
# Edit ~/.slack-mcp-tokens.json with fresh values
```

### DMs Not Showing
Use `discover_dms: true` to force discovery:
```
slack_list_conversations with discover_dms=true
```
This caches DM channel IDs for 24 hours.

### Chrome Extraction Fails
- Chrome must be **running** (not minimized to Dock)
- Slack tab must be open at `app.slack.com`
- You must be logged in
- In Chrome menu, enable `View > Developer > Allow JavaScript from Apple Events`

### Claude Desktop Not Seeing Tools
1. Verify JSON syntax in config file
2. Check logs: `~/Library/Logs/Claude/mcp*.log`
3. Fully restart Claude (Cmd+Q, then reopen)

---

## Project Structure

```
slack-mcp-server/
├── src/
│   ├── server.js         # MCP server (stdio transport)
│   └── web-server.js     # REST API + Web UI
├── lib/
│   ├── token-store.js    # 4-layer persistence + atomic writes
│   ├── slack-client.js   # API client, LRU cache, retry logic
│   ├── tools.js          # MCP tool definitions
│   └── handlers.js       # Tool implementations
├── public/
│   ├── index.html        # Web UI
│   └── demo.html         # Interactive demo
└── scripts/
    └── token-cli.js      # Token management CLI
```

---

## Security

- Token files stored with `chmod 600` (owner-only)
- macOS Keychain provides encrypted backup
- Web server binds to localhost only
- Never commit tokens to version control
- API keys are cryptographically random (`crypto.randomBytes`)

---

## Platform Support

| Feature | macOS | Linux | Windows |
|---------|-------|-------|---------|
| MCP Server | Yes | Yes | Yes |
| Token File | Yes | Yes | Yes |
| Auto-Refresh from Chrome | Yes | No | No |
| Keychain Storage | Yes | No | No |
| Web UI | Yes | Yes | Yes |

---

## Contributing

PRs welcome. Run `node --check` on modified files before submitting.

If this project saves you setup time, consider starring the repository.

---

## License

MIT - See LICENSE

---

## Disclaimer

This project uses unofficial Slack APIs. Use at your own risk. Not affiliated with or endorsed by Slack Technologies.
