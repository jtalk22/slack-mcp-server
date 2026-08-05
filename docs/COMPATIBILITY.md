# Compatibility Matrix

The local package is a stdio MCP server. Client support is classified by the evidence maintained in this repository rather than by logo availability.

| Client | Transport | Configuration | Evidence level |
|---|---|---|---|
| Claude Desktop | stdio | Desktop MCP JSON | Verified |
| Claude Code | stdio | `claude mcp add` or `~/.claude.json` | Documented |
| Cursor | stdio | `.cursor/mcp.json` | Documented |
| GitHub Copilot in VS Code | stdio | `.vscode/mcp.json` | Documented |
| Windsurf | stdio | `~/.codeium/windsurf/mcp_config.json` | Documented |
| Gemini CLI | stdio | `~/.gemini/settings.json` | Documented |
| Codex CLI | stdio | `codex mcp add` or `~/.codex/config.toml` | Documented |
| Other stdio MCP clients | stdio | command + args | Protocol-compatible |
| Local browser UI | local web | `npx -y @jtalk22/slack-mcp web` | Verified |
| Self-hosted HTTP | Streamable HTTP | `node src/server-http.js` | Verified with operator configuration |
| Hosted | Streamable HTTP | OAuth connection | Managed service |

## Runtime support

| Runtime | Posture |
|---|---|
| Node 20 | Supported for the v4 line; upstream end-of-life |
| Node 22 | Recommended and CI-tested |
| Node 24 | Recommended and CI-tested |
| Node 26 | CI-tested current release line |

## Credential support

| Platform | Automatic local extraction | Storage |
|---|---|---|
| macOS + Chrome | Yes | `auto`, `keychain-only`, or `file` |
| Windows | No | environment or file |
| Linux | No | environment or file |
| Docker/CI | No | mounted file or environment |

## Verification contract

For every client:

1. `npx -y @jtalk22/slack-mcp --version` succeeds in the same environment the client launches.
2. The MCP configuration starts `npx -y @jtalk22/slack-mcp` through stdio.
3. The client is fully restarted after configuration.
4. `slack_health_check` returns the expected Slack workspace and user.
5. `slack_list_conversations` returns readable workspace data.

A new named client should not be promoted in the README hero until a configuration recipe and working receipt exist.

See [SETUP.md](SETUP.md) for copy-paste configurations and [DEPLOYMENT-MODES.md](DEPLOYMENT-MODES.md) for web, HTTP, Docker, and hosted transports.
