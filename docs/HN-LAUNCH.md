# HN Launch Kit (v3.0.0)

Use this for Show HN and follow-up comments.

## Title Options

- `Show HN: Slack MCP Server v3.0.0 (secure-default hosted mode, local-first unchanged)`
- `Show HN: Slack MCP Server v3.0.0 (session-based Slack access for MCP clients)`
- `Show HN: Slack MCP Server v3.0.0 (hosted HTTP now auth-by-default)`

## Main Post Draft

```md
Released `@jtalk22/slack-mcp@3.0.0`.

This release keeps local session-mirroring intact (`stdio`, `web`) and hardens hosted HTTP defaults:
- `/mcp` requires bearer auth by default
- CORS requires explicit origin allowlisting
- no MCP tool renames/removals
- `--doctor` stays deterministic (`0/1/2/3`)
- `--status` stays read-only

Verify in 30 seconds:
- `npx -y @jtalk22/slack-mcp@latest --version`
- `npx -y @jtalk22/slack-mcp@latest --doctor`
- `npx -y @jtalk22/slack-mcp@latest --status`

Repo: https://github.com/jtalk22/slack-mcp-server
npm: https://www.npmjs.com/package/@jtalk22/slack-mcp
Release notes: https://github.com/jtalk22/slack-mcp-server/blob/main/.github/v3.0.0-release-notes.md
Maintainer/operator: `jtalk22` (`james@revasser.nyc`)
```

## First Comment Draft

```md
Additional operator notes:
- Local users (`stdio`, `web`) do not need migration.
- Hosted users need `SLACK_MCP_HTTP_AUTH_TOKEN` and `SLACK_MCP_HTTP_ALLOWED_ORIGINS` configured.
- Emergency local fallback is available via `SLACK_MCP_HTTP_INSECURE=1`.

If something fails, include:
- OS + Node version
- runtime mode (`stdio|web|http|worker`)
- exact command + output
```

## Reply Macros

### Why not Slack OAuth?

Session mirroring uses the access already present in the signed-in Slack web session, which is useful for operator workflows where a bot scope model is too limiting.

### Is hosted required?

No. Local-first use is still the default and fully supported.

### Did the tool API change?

No MCP tool names were removed or renamed in `v3.0.0`.

### Why a major version?

Hosted HTTP defaults changed to auth-by-default behavior, which can change existing hosted deployments.

### What should users run first?

```bash
npx -y @jtalk22/slack-mcp@latest --version
npx -y @jtalk22/slack-mcp@latest --doctor
npx -y @jtalk22/slack-mcp@latest --status
```
