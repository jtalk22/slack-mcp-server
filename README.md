# Slack MCP Server

[![npm version](https://img.shields.io/npm/v/@jtalk22/slack-mcp)](https://www.npmjs.com/package/@jtalk22/slack-mcp)
[![npm downloads](https://img.shields.io/npm/dm/@jtalk22/slack-mcp)](https://www.npmjs.com/package/@jtalk22/slack-mcp)
[![MCP Registry](https://img.shields.io/badge/MCP_Registry-v3.2.0-blue)](https://registry.modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

Give Claude your Slack. 16 tools — read channels, search messages, send replies, react, manage unreads. Self-host free or Cloud from $19/mo.

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

All tools carry [MCP safety annotations](https://modelcontextprotocol.io/specification/2025-03-26/server/tools#annotations): 12 read-only (`readOnlyHint: true`), 4 write-path (`destructiveHint: true`). Only `slack_send_message` is non-idempotent.

\* `slack_refresh_tokens` modifies local token file only — no external Slack state.

## Cloud (Recommended)

Skip all local setup. Paste one URL into Claude and get 16 Slack tools in 60 seconds. Encrypted token storage on Cloudflare's edge (300+ PoPs). OAuth 2.1 with PKCE S256.

| Plan | Price | Includes |
|------|-------|----------|
| Solo | $19/mo | 15 standard tools, AES-256-GCM encrypted storage, 5K requests/mo |
| Team | $49/mo | 15 standard + 3 AI compound tools, 3 workspaces, 25K requests/mo |

[Get Started](https://mcp.revasserlabs.com) · [Privacy Policy](https://mcp.revasserlabs.com/privacy)

## Install (Self-Hosted)

**Runtime:** Node.js 20+

```bash
npx -y @jtalk22/slack-mcp --setup
```

The setup wizard handles token extraction and validation automatically.

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
<summary><strong>Claude Code CLI</strong></summary>

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

Restart Claude after configuration. Full setup guide: [docs/SETUP.md](docs/SETUP.md)

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

**Tokens expired:** Run `npx -y @jtalk22/slack-mcp --setup` or use `slack_refresh_tokens` in Claude (macOS).

**DMs not showing:** Use `slack_list_conversations` with `discover_dms=true` to force discovery.

**Claude not seeing tools:** Verify JSON syntax in config, check logs at `~/Library/Logs/Claude/mcp*.log`, fully restart Claude (Cmd+Q).

More: [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

## Docs

- [Setup Guide](docs/SETUP.md) — Token extraction and configuration
- [API Reference](docs/API.md) — All 16 tools with parameters and examples
- [Deployment Modes](docs/DEPLOYMENT-MODES.md) — stdio, web, hosted HTTP, Cloudflare Worker
- [Use Case Recipes](docs/USE_CASE_RECIPES.md) — 12 copy-paste prompts
- [Troubleshooting](docs/TROUBLESHOOTING.md) — Common issues and fixes
- [Compatibility](docs/COMPATIBILITY.md) — Client compatibility matrix
- [Support Boundaries](docs/SUPPORT-BOUNDARIES.md) — Scope and response targets
- [Docs Index](docs/INDEX.md) — Full documentation index

## Security

- Token files stored with `chmod 600` (owner-only)
- macOS Keychain provides encrypted backup
- Web server binds to localhost only
- API keys are cryptographically random (`crypto.randomBytes`)
- See [SECURITY.md](SECURITY.md) for vulnerability reporting

## Contributing

PRs welcome. Run `node --check` on modified files before submitting.

## License

MIT — See [LICENSE](LICENSE)

## Disclaimer

This project accesses Slack's Web API using browser session credentials. It is not affiliated with or endorsed by Slack Technologies, Inc. Slack workspace administrators should review their acceptable use policies.
