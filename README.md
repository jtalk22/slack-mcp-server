# Slack MCP Server

[![npm version](https://img.shields.io/npm/v/@jtalk22/slack-mcp)](https://www.npmjs.com/package/@jtalk22/slack-mcp)
[![MCP Registry](https://img.shields.io/badge/MCP_Registry-listed-blue)](https://registry.modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

Give your AI agent full Slack access. No app registration, no admin approval, no OAuth. One command, 16 tools, works with any MCP client.

```bash
npx -y @jtalk22/slack-mcp --setup
```

[![Slack MCP Server Demo](docs/images/demo-poster.png)](https://jtalk22.github.io/slack-mcp-server/public/demo-video.html)

**[▶ Watch the demo](https://jtalk22.github.io/slack-mcp-server/public/demo-video.html)** — 7 scenarios, from 47 unreads to inbox zero, without opening Slack.

> **Ask your AI to catch you up on #engineering from the last 24 hours.** Search for that deployment thread from last week. Find the printer admin PIN nobody can remember. Send a reply. All from your editor.

[Interactive demo](https://jtalk22.github.io/slack-mcp-server/public/demo-slack-mcp.html) · [Latest release](https://github.com/jtalk22/slack-mcp-server/releases/latest)

## Why This Exists

Slack's official MCP server requires a registered app, admin approval, and [doesn't work with Claude Code or GitHub Copilot](https://github.com/anthropics/claude-code/issues/30564) due to OAuth/DCR incompatibility. Screenshotting messages is not a workflow.

This server uses your browser's session tokens instead. If you can see it in Slack, your AI agent can see it too. No app install, no scopes, no admin.

**Session-token transport:** No bot user appears in the workspace admin panel, no app install shows up, no audit trail entry is created. Your AI agent operates with the same workspace footprint as your browser tab — nothing more, nothing less.

![OAuth vs Chrome DB Decryption](docs/images/diagram-oauth-comparison.svg)

|  | Slack Official MCP | This Server |
|---|---|---|
| OAuth app required | Yes | **No** |
| Admin approval | Yes | **No** |
| Works with Claude Code | No (DCR incompatible) | **Yes** |
| Works with Cursor | No | **Yes** |
| Works with Copilot | No | **Yes** |
| Works with Windsurf | No | **Yes** |
| Works with Gemini CLI | No | **Yes** |
| Works with Codex CLI | No | **Yes** |
| Setup time | ~30 min | **~2 min** |
| Tools | Limited | **16** |
| Visible to admins | Yes | **No — session-token transport** |

## Quick Start per Client

<details>
<summary><strong>Claude Desktop / Claude Code</strong></summary>

Add to `~/.claude.json` or Claude Desktop settings:
```json
{
  "mcpServers": {
    "slack": { "command": "npx", "args": ["-y", "@jtalk22/slack-mcp"] }
  }
}
```
</details>

<details>
<summary><strong>Cursor</strong></summary>

Add to `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "slack": { "command": "npx", "args": ["-y", "@jtalk22/slack-mcp"] }
  }
}
```
</details>

<details>
<summary><strong>Windsurf</strong></summary>

Add to `~/.codeium/windsurf/mcp_config.json`:
```json
{
  "mcpServers": {
    "slack": { "command": "npx", "args": ["-y", "@jtalk22/slack-mcp"] }
  }
}
```
</details>

<details>
<summary><strong>Gemini CLI</strong></summary>

Add to `~/.gemini/settings.json`:
```json
{
  "mcpServers": {
    "slack": { "command": "npx", "args": ["-y", "@jtalk22/slack-mcp"] }
  }
}
```
</details>

<details>
<summary><strong>Codex CLI</strong></summary>

Add to `~/.codex/config.toml`:
```toml
[mcp_servers.slack]
command = "npx"
args = ["-y", "@jtalk22/slack-mcp"]
```

Or via CLI: `codex mcp add slack -- npx -y @jtalk22/slack-mcp`
</details>

## Tools

| Tool | Description | Safety |
|------|-------------|--------|
| `slack_health_check` | Verify token validity and workspace info | read-only |
| `slack_token_status` | Token age, health, and cache stats | read-only |
| `slack_refresh_tokens` | Auto-extract fresh tokens from Chrome | read-only* |
| `slack_list_conversations` | List DMs and channels | read-only |
| `slack_conversations_history` | Get messages from a channel or DM | read-only |
| `slack_get_full_conversation` | Export full history with threads | read-only |
| `slack_search_messages` | Search across workspace | read-only |
| `slack_get_thread` | Get thread replies | read-only |
| `slack_users_info` | Get user details | read-only |
| `slack_list_users` | List workspace users (paginated, 500+) | read-only |
| `slack_users_search` | Search users by name, display name, or email | read-only |
| `slack_conversations_unreads` | Get channels/DMs with unread messages | read-only |
| `slack_send_message` | Send a message to any conversation | **destructive** |
| `slack_add_reaction` | Add an emoji reaction to a message | **destructive** |
| `slack_remove_reaction` | Remove an emoji reaction from a message | **destructive** |
| `slack_conversations_mark` | Mark a conversation as read | **destructive** |

12 read-only, 4 write-path. All carry [MCP safety annotations](https://modelcontextprotocol.io/specification/2025-03-26/server/tools#annotations).

\* `slack_refresh_tokens` modifies local token file only.

## Install

**Node.js 20+**

```bash
npx -y @jtalk22/slack-mcp --setup
```

The setup wizard handles token extraction and validation.

<details>
<summary><strong>Claude Desktop (macOS)</strong></summary>

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

</details>

<details>
<summary><strong>Claude Desktop (Windows/Linux)</strong></summary>

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

> Windows/Linux users must provide tokens via `env` since auto-refresh is macOS-only.

</details>

<details>
<summary><strong>Claude Code</strong></summary>

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

</details>

<details>
<summary><strong>Cursor / Copilot / Other MCP clients</strong></summary>

Any client that supports stdio MCP servers works. Add to your client's MCP config:

```json
{
  "slack": {
    "command": "npx",
    "args": ["-y", "@jtalk22/slack-mcp"],
    "env": {
      "SLACK_TOKEN": "xoxc-your-token",
      "SLACK_COOKIE": "xoxd-your-cookie"
    }
  }
}
```

On macOS, tokens are auto-extracted from Chrome — `env` block is optional.

</details>

<details>
<summary><strong>Claude Web / Remote MCP</strong></summary>

Hosted tiers at [mcp.revasserlabs.com](https://mcp.revasserlabs.com):

| Tier | Price | What it owns |
|------|-------|-------------|
| Self-host | Free (MIT) | Local stdio, all 21 tools (16 read/write Slack + 2 workflow profile primitives + 3 discoverable upgrade stubs to hosted brain) |
| Hosted Free | $0 (no card) | Email signup, 1 workspace, 10 smart_search/mo + 3 catch_me_up/mo + 5 triage/day. All 5 workflow profile types. 7-day index retention. |
| Pro | $9/mo | Unlimited AI tools, **scheduled morning catch-up DM (8am workspace tz)**, permanent OAuth, 90-day Vectorize, 2 workspaces |
| Team | $49/mo flat | Pro + shared workflow profiles + audit log + 24h support + scheduled catch-up to channel + 5 workspaces |
| Ops | from $199/mo (custom) | SLA, custom retention, SOC2 evidence path, multi-tenant isolation, 10+ workspaces, dedicated workflow tuning |

</details>

<details>
<summary><strong>Docker</strong></summary>

```bash
docker pull ghcr.io/jtalk22/slack-mcp-server:latest
```

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

</details>

Restart your client after configuration. Full setup: [docs/SETUP.md](docs/SETUP.md)

## How It Works

Session tokens (`xoxc-` + `xoxd-`) from your browser. If you can see it in Slack, this server can see it too.

**Token persistence** — four-layer fallback:
1. Environment variables (`SLACK_TOKEN`, `SLACK_COOKIE`)
2. Token file (`~/.slack-mcp-tokens.json`, chmod 600)
3. macOS Keychain (encrypted)
4. Chrome auto-extraction (macOS)

Tokens expire. The server notices before you do — proactive health monitoring, automatic refresh on macOS, warnings when tokens age out. File writes are atomic (temp file → chmod → rename) to prevent corruption. Concurrent refresh attempts are mutex-locked.

## What's New in 4.1.2

- **LevelDB extraction** — reads tokens directly from Chrome's LevelDB store. No live Slack tab required, no AppleScript flag dependency.
- **Multi-profile enumeration** — automatically picks the freshest Chrome profile. Override with `SLACK_MCP_CHROME_USER_DATA_DIR`, `SLACK_MCP_CHROME_PROFILE`, or `SLACK_MCP_EXTRACTION_MODE`.
- **Explicit shutdown handlers** — SIGTERM/SIGINT/SIGHUP/stdin EOF/stdin error all exit cleanly. Zero zombie processes.

Full release notes in [docs/INDEX.md](docs/INDEX.md) and on [GitHub releases/latest](https://github.com/jtalk22/slack-mcp-server/releases/latest).

## Hosted HTTP Mode

For remote MCP endpoints (Cloudflare Worker, VPS, etc.):

```bash
SLACK_TOKEN=xoxc-... \
SLACK_COOKIE=xoxd-... \
SLACK_MCP_HTTP_AUTH_TOKEN=change-this \
SLACK_MCP_HTTP_ALLOWED_ORIGINS=https://claude.ai \
node src/server-http.js
```

Details: [docs/DEPLOYMENT-MODES.md](docs/DEPLOYMENT-MODES.md)

## Troubleshooting

**Tokens expired:** Run `npx -y @jtalk22/slack-mcp --setup` or use `slack_refresh_tokens` (macOS).

**DMs not showing:** Use `slack_list_conversations` with `discover_dms=true`.

**Client not seeing tools:** Check JSON syntax in config, restart client fully.

More: [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

## Docs

- [Setup Guide](docs/SETUP.md)
- [API Reference](docs/API.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Deployment Modes](docs/DEPLOYMENT-MODES.md)
- [Use Case Recipes](docs/USE_CASE_RECIPES.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Compatibility](docs/COMPATIBILITY.md)

## Security

- Token files: `chmod 600` (owner-only)
- macOS Keychain encrypted backup
- Web server binds to localhost only
- API keys: `crypto.randomBytes`
- See [SECURITY.md](SECURITY.md)

## Contributing

PRs welcome. Run `node --check` on modified files before submitting.

## License

MIT — See [LICENSE](LICENSE)

## Disclaimer

Not affiliated with Slack Technologies, Inc. Uses browser session credentials — check your workspace's acceptable use policy.

---

Hosted version live at [mcp.revasserlabs.com](https://mcp.revasserlabs.com): Free tier (no card), $9/mo Pro, $49/mo Team flat, Ops from $199/mo. Hosted owns the AI brain (smart_search, catch_me_up, triage), the scheduled morning catch-up DM at 8am workspace time, permanent OAuth (no 2-week token rotation), 90-day Vectorize retention, and shared workflow profiles. The OSS package owns local stdio + all 16 read/write Slack tools + workflow profile primitives (slack_workflow_save, slack_workflows). The 3 paid stubs (slack_smart_search, slack_catch_me_up, slack_triage) appear in OSS as discoverable upgrade prompts.
