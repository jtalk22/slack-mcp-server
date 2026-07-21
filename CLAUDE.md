# CLAUDE.md

This file provides maintainer-oriented context for automated edits in this repository.

## Project Scope

Session-based Slack MCP server. Works with any MCP client via stdio transport,
or via hosted HTTP for browser-based clients.

## Build and Run

```bash
npm install
npm start                      # MCP server on stdio
npm run web                    # REST API + Web UI (localhost:3000)
npm run tokens:auto            # Auto-extract from Chrome (macOS)
npm run tokens:status          # Check token health
```

## Installation Paths

```bash
npx -y @jtalk22/slack-mcp      # package entrypoint
docker pull ghcr.io/jtalk22/slack-mcp-server:latest
```

## MCP Tools (21 total)

**Slack reads (12):**

| Tool | Purpose |
|------|---------|
| `slack_health_check` | Verify token validity and show workspace info |
| `slack_token_status` | Token age, health, cache stats |
| `slack_refresh_tokens` | Auto-extract fresh tokens from Chrome (macOS) |
| `slack_list_conversations` | List DMs and channels with resolved names |
| `slack_conversations_history` | Get messages from a channel or DM |
| `slack_get_full_conversation` | Export full history with threads |
| `slack_search_messages` | Search across workspace |
| `slack_get_thread` | Get thread replies |
| `slack_users_info` | Get user details |
| `slack_list_users` | List workspace users (paginated, 500+) |
| `slack_users_search` | Search by name, display name, or email |
| `slack_conversations_unreads` | Channels/DMs with unread messages |

**Slack writes (4):** `slack_send_message`, `slack_add_reaction`, `slack_remove_reaction`, `slack_conversations_mark` — all carry MCP `destructive` safety annotation.

**Workflow primitives (2):** `slack_workflow_save`, `slack_workflows` — bind a `workflow_kind` (`incident_room`, `exec_brief`, `support_inbox`, `product_launch_watch`, `custom`) to channels + priority people + retention + cadence. Stored locally at `~/.slack-mcp-workflows.json`.

**Hosted-brain upgrade stubs (3):** `slack_smart_search`, `slack_catch_me_up`, `slack_triage` — return `{signup_url, free_tier_quota, pro_value_prop}` payloads pointing at `mcp.revasserlabs.com`. No Slack write occurs from OSS.

## Token Persistence Layers

1. Environment variables
2. Token file (`~/.slack-mcp-tokens.json`)
3. macOS Keychain
4. Chrome auto-extraction (macOS only)

Storage backend: `auto` (file + Keychain, default), `keychain-only` (Keychain
exclusively, no plaintext file, verified writes, legacy file migrated in and
removed after verification — a removal failure throws `plaintext_removal_failed`
rather than passing silently — bookkeeping in `~/.slack-mcp-meta.json`), or
`file` (Keychain never touched). On macOS, `--setup` asks and persists the
choice in the meta file; the `SLACK_MCP_TOKEN_STORAGE` env var overrides.
Unrecognized values from either source fail closed at startup. Sidecar writes
are serialized across processes via an `O_EXCL` lock file; a failed persist
keeps fresh tokens in memory (`storage.unpersisted_fresh_tokens`) so the
auth-retry path never reuses stale credentials.

## Architecture Notes

- Session-based access uses browser tokens (`xoxc-` + `xoxd-`).
- Token lifecycle is time-bounded and may require refresh.
- Reliability controls include atomic file writes, mutex locking, and cached lookups.

## Structure

```text
src/
  server.js        MCP server entry point
  web-server.js    REST API + Web UI
lib/
  token-store.js   token persistence
  slack-client.js  Slack API client and retry logic
  tools.js         MCP tool definitions
  handlers.js      MCP tool handlers
```

## Claude Code Integration

The repo includes `.claude/settings.json` for local MCP server registration.
Tokens load from `~/.slack-mcp-tokens.json` or `SLACK_TOKEN`/`SLACK_COOKIE` env vars.
