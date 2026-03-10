# CLAUDE.md

This file provides maintainer-oriented context for automated edits in this repository.

## Project Scope

Session-based Slack MCP server for local and hosted runtimes.

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

## MCP Tools

| Tool | Purpose |
|------|---------|
| `slack_health_check` | Verify token validity and show workspace info |
| `slack_token_status` | Check current token health |
| `slack_refresh_tokens` | Auto-extract fresh tokens from Chrome |
| `slack_list_conversations` | List DMs and channels with resolved names |
| `slack_conversations_history` | Get messages from a channel or DM |
| `slack_get_full_conversation` | Export full history with threads |
| `slack_search_messages` | Search across workspace |
| `slack_send_message` | Send a message |
| `slack_get_thread` | Get thread replies |
| `slack_users_info` | Get user details |
| `slack_list_users` | List workspace users |
| `slack_add_reaction` | Add emoji reaction to a message |
| `slack_remove_reaction` | Remove emoji reaction from a message |

## Token Persistence Layers

1. Environment variables
2. Token file (`~/.slack-mcp-tokens.json`)
3. macOS Keychain
4. Chrome auto-extraction (macOS only)

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
