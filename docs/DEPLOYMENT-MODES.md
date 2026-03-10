# Deployment Modes

Use this guide to choose the right operating mode before rollout.

## Quick Chooser

- Choose **Cloud** if you want zero setup — one URL, managed tokens, encrypted storage.
- Choose `stdio` for personal self-hosted use in Claude Desktop/Claude Code.
- Choose local `web` for browser workflows and manual Slack browsing.
- Choose hosted HTTP only when you need remote execution and can handle token operations.
- Choose Smithery/Worker only when your consumers require registry-hosted MCP transport.

## Mode Matrix

| Mode | Start Command | Best For | Auth Material | Exposure | Notes |
|------|---------------|----------|---------------|----------|-------|
| **Cloud** | N/A — managed | Teams, non-technical users, zero-ops | API key from checkout | `mcp.revasserlabs.com` | $19/mo Solo, $49/mo Team. 13 tools incl. AI compound tools. No Docker, no token mgmt. |
| Local MCP (`stdio`) | `npx -y @jtalk22/slack-mcp` | Individual daily usage in Claude | `SLACK_TOKEN` + `SLACK_COOKIE` via token file/env | Local process | Lowest ops burden. Free. 11 tools. |
| Local Web UI (`web`) | `npx -y @jtalk22/slack-mcp web` | Browser-first usage, manual search/send | Same as above + generated API key | `localhost` by default | Useful when MCP is not available |
| Hosted MCP (`http`) | `node src/server-http.js` | Controlled hosted integration | Env-injected Slack token/cookie + HTTP bearer token | Remote endpoint | `/mcp` is bearer-protected by default; configure CORS allowlist |
| Smithery/Worker | `wrangler deploy` + Smithery publish flow | Registry distribution for hosted consumers | Query/env token handoff | Remote endpoint | Keep worker version parity with npm release |

## Cloud Deployment

No local setup required:

1. Purchase a plan at [cloud.html](https://jtalk22.github.io/slack-mcp-server/cloud.html)
2. Receive API key and config snippets on the success page
3. Paste config into Claude Desktop or Claude Code
4. All 13 tools available immediately (including AI compound tools on Team plan)

Cloud handles token refresh, encryption (AES-256-GCM), and rate limiting automatically.

## Team Deployment Guidance

If you are deploying for more than one operator:

1. Start with one maintainer on local `stdio`.
2. Document token lifecycle and rotation ownership.
3. Define support window and incident contact before enabling hosted mode.
4. Validate `/health` and MCP initialize responses on every release.

## Release Checklist by Mode

### Local `stdio`

1. `npx -y @jtalk22/slack-mcp --status`
2. `npx -y @jtalk22/slack-mcp --help`
3. Confirm tool list in Claude client.

### Local `web`

1. `npx -y @jtalk22/slack-mcp web`
2. Verify API key generation at `~/.slack-mcp-api-key`.
3. Verify `/health`, `/conversations`, and `/search` endpoints.

### Hosted (`http` or Worker)

1. Verify `version` parity across `package.json`, server metadata, and health responses.
2. Verify HTTP auth behavior:
   - missing `SLACK_MCP_HTTP_AUTH_TOKEN` returns `503`
   - bad bearer token returns `401`
   - valid bearer token succeeds
3. Verify CORS behavior:
   - denied by default
   - allowed origins work when listed in `SLACK_MCP_HTTP_ALLOWED_ORIGINS`
4. Confirm `slack_get_thread`, `slack_search_messages`, and `slack_users_info` behavior.
5. Confirm token handling mode (ephemeral vs env persistence) is documented.
