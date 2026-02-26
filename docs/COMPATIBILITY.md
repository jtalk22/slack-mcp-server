# Compatibility Matrix

Use this matrix to choose a known working client/runtime path before rollout.

| Client | Mode | Token path | Status | Quick verify command |
|---|---|---|---|---|
| Claude Desktop (macOS) | `stdio` | `~/.slack-mcp-tokens.json` via `--setup` auto-extract | Supported | `npx -y @jtalk22/slack-mcp --setup && npx -y @jtalk22/slack-mcp --status` |
| Claude Desktop (Windows) | `stdio` | `env` (`SLACK_TOKEN`, `SLACK_COOKIE`) in config | Supported | `npx -y @jtalk22/slack-mcp --status` |
| Claude Desktop (Linux) | `stdio` | `env` or token file via guided setup | Supported | `npx -y @jtalk22/slack-mcp --status` |
| Claude Code CLI | `stdio` | `~/.slack-mcp-tokens.json` or `env` | Supported | `npx -y @jtalk22/slack-mcp --version && npx -y @jtalk22/slack-mcp --status` |
| Local Browser UI | `web` | token file or `env` | Supported | `npx -y @jtalk22/slack-mcp web` |
| Hosted Node Runtime | `http` | `env` in host runtime | Supported with operator controls | `node src/server-http.js` then `curl -s http://localhost:8080/health` |
| Cloudflare Worker / Smithery transport | `worker` | runtime env/query handoff per deployment config | Supported with deployment validation | `wrangler deploy --config workers/wrangler.toml` and verify `/health` |

## Notes

1. Runtime baseline is Node 20+.
2. `--doctor` is the fastest first check when setup status is unknown.
3. For hosted/team deployment, use [DEPLOYMENT-MODES.md](DEPLOYMENT-MODES.md) before production rollout.
