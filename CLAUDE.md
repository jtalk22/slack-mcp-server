# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Full Slack access for Claude via MCP. Session mirroring (not OAuth) bypasses admin approval. First open-source project under jtalk22.

## Build & Run

```bash
npm install
npm start                      # MCP server on stdio
npm run web                    # REST API + Web UI (localhost:3000)
npm run tokens:auto            # Auto-extract from Chrome (macOS)
npm run tokens:status          # Check token health
```

## Installation Options

```bash
npx @jtalk22/slack-mcp         # npm global
docker pull ghcr.io/jtalk22/slack-mcp-server:latest
```

## 11 MCP Tools

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

## Token Persistence (4-layer)

1. Environment variables
2. Token file (`~/.slack-mcp-tokens.json`)
3. macOS Keychain
4. Chrome auto-extraction (macOS only)

## Architecture

- **Session mirroring:** Uses browser tokens (xoxc- + xoxd-) for user-level access
- **Token lifecycle:** Expires 1-2 weeks but auto-refresh from Chrome
- **Reliability:** Atomic file writes, mutex lock, LRU cache

## Project Structure

```
src/
├── server.js         # MCP server entry point
└── web-server.js     # REST API + Web UI
lib/
├── token-store.js    # 4-layer token persistence
├── slack-client.js   # API client with retry logic
├── tools.js          # MCP tool definitions
└── handlers.js       # Tool implementations
```

## Ecosystem Role

Enables Claude to access full Slack context (DMs, channels, search) without OAuth admin approval. Part of the MCP perceptual capabilities that feed into the larger orchestration vision.
