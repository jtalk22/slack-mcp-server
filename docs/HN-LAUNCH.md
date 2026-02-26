# HN Launch Kit

Use this file as copy/paste launch material with no extra edits.

## Distribution Variants

### Variant A: Clinical

Title idea: `Show HN: Slack MCP Server (session-based Slack access for Claude)`

```md
Built a session-based Slack MCP server so Claude can use the same access already available in your Slack web session.

What it supports:
- DM/channel/thread reads
- workspace search
- message send + user lookups
- local web mode when MCP is unavailable

Verify:
- `npx -y @jtalk22/slack-mcp --version`
- `npx -y @jtalk22/slack-mcp --status`
- `npx -y @jtalk22/slack-mcp --setup`

Repo: https://github.com/jtalk22/slack-mcp-server
npm: https://www.npmjs.com/package/@jtalk22/slack-mcp
```

### Variant B: Technical + Light Edge

Title idea: `Show HN: Slack MCP Server (local-first Slack context for Claude)`

```md
Wanted reliable Slack context in Claude without app-scope bottlenecks, so I built a local-first MCP server around session credentials.

Current scope:
- search + thread retrieval
- conversation export with usernames
- message send flows
- hosted transport options for operator-managed deployments

Verify:
- `npx -y @jtalk22/slack-mcp --version`
- `npx -y @jtalk22/slack-mcp --status`
- `npx -y @jtalk22/slack-mcp --setup`

Repo: https://github.com/jtalk22/slack-mcp-server
npm: https://www.npmjs.com/package/@jtalk22/slack-mcp
```

### Variant C: Strong Edge + Receipts

Title idea: `Show HN: Slack MCP Server (operator-grade Slack workflows for Claude)`

```md
If you already have Slack access, your assistant should have that same operational context.

This MCP server is built for that exact path, with local-first defaults and explicit deployment tradeoffs.

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

### Is this intended as a hosted proxy pattern?
No. The free path is local/self-hosted first. Deployment docs describe tradeoffs and support boundaries before team rollout.

### Is this safe for production teams?
Treat as operator-managed infrastructure. Validate with your own risk/compliance controls before broader rollout.

## Install Check Block

```bash
npx -y @jtalk22/slack-mcp --version
npx -y @jtalk22/slack-mcp --status
npx -y @jtalk22/slack-mcp --setup
```
