# HN Launch Kit

Use this file as copy/paste launch material with minimal edits.

## Title Options

- `Show HN: Slack MCP Server (session-based Slack access for Claude)`
- `Show HN: Slack MCP Server (local-first Slack context for Claude)`
- `Show HN: Slack MCP Server (Slack MCP for local and hosted runtimes)`

## Launch Post Template

```md
Built a session-based Slack MCP server so Claude can use the same access already available in your Slack web session.

Current scope:
- DM/channel/thread reads
- workspace search
- message sends and user lookups
- local web mode when MCP is unavailable

Verify:
- `npx -y @jtalk22/slack-mcp --version`
- `npx -y @jtalk22/slack-mcp --status`
- `npx -y @jtalk22/slack-mcp --setup`

Repo: https://github.com/jtalk22/slack-mcp-server
npm: https://www.npmjs.com/package/@jtalk22/slack-mcp
```

## First Comment Draft

```md
Notes up front:
- Local-first usage is fully supported.
- Tokens are Slack session credentials and are stored locally by default.
- macOS supports automatic Chrome extraction; Linux/Windows use guided manual setup.
- Current docs include deployment modes, support boundaries, and troubleshooting.

If install fails, include OS, Node version, runtime mode (`stdio|web|http|worker`), and exact error output.
```

## FAQ

### Is this using Slack app OAuth scopes?
No. It uses existing signed-in session permissions.

### What about token expiry?
Session tokens expire. `--setup` refreshes credentials, and macOS supports automatic extraction from Chrome.

### Is hosted deployment required?
No. The default path is local/self-hosted first. Deployment docs describe hosted tradeoffs.

### Is this suitable for production teams?
Treat as operator-managed infrastructure and validate against your own security and compliance requirements.

## Install Check Block

```bash
npx -y @jtalk22/slack-mcp --version
npx -y @jtalk22/slack-mcp --status
npx -y @jtalk22/slack-mcp --setup
```
