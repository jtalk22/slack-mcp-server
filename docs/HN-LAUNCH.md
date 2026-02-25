# HN Launch Kit

Use this file as copy/paste launch material with no extra edits.

## Launch Post Draft

Title idea: `Show HN: Slack MCP Server (local-first, session-based Slack access for Claude)`

Post body:

```md
Built a local-first Slack MCP server so Claude can use the same Slack access already available in your browser session.

What it does:
- DMs/channels/thread reads
- workspace search
- message send + user lookups
- local web mode when MCP is unavailable

Quick check:
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
- Tokens are your Slack session credentials and are stored locally by default.
- macOS supports automatic Chrome extraction; Linux/Windows use guided manual setup.
- Current docs include deployment modes, support boundaries, and troubleshooting.

If install fails, include OS, Node version, runtime mode (`stdio|web|http|worker`), and exact error output.
```

## Rebuttal Mini-FAQ

### Is this bypassing Slack app scopes?
It does not use Slack app OAuth scopes. It uses your existing signed-in session permissions.

### What about token expiry?
Session tokens expire. `--setup` refreshes credentials, and macOS supports automatic extraction from Chrome.

### Is this intended as a stealth hosted proxy?
No. The free path is local/self-hosted first. Deployment docs describe tradeoffs and support boundaries before team rollout.

### Is this safe for production teams?
Treat as operator-managed infrastructure. Validate with your own risk/compliance controls before broader rollout.

## Install Check Block

```bash
npx -y @jtalk22/slack-mcp --version
npx -y @jtalk22/slack-mcp --status
npx -y @jtalk22/slack-mcp --setup
```
