# HN Launch Kit (v2.0.0)

Use this file for Show HN posting and first-comment follow-up within the trust-and-infra fanout path.

## Title Options

- `Show HN: Slack MCP Server v2.0.0 (deterministic Slack MCP diagnostics)`
- `Show HN: Slack MCP Server v2.0.0 (session-based Slack access, stable contracts)`
- `Show HN: Slack MCP Server v2.0.0 (local-first Slack context for Claude)`

## Launch Post Template

```md
Released `@jtalk22/slack-mcp@2.0.0` today.

This release focuses on install reliability and deterministic diagnostics:
- read-only `--status` behavior enforced in install-path verification
- deterministic `--doctor` exits (`0/1/2/3`)
- structured MCP/web error payloads for triage consistency
- token health handles missing timestamp as unknown age, not false critical
- no MCP tool renames or removals

Verify:
- `npx -y @jtalk22/slack-mcp@latest --version`
- `npx -y @jtalk22/slack-mcp@latest --doctor`
- `npx -y @jtalk22/slack-mcp@latest --status`

Repo: https://github.com/jtalk22/slack-mcp-server
npm: https://www.npmjs.com/package/@jtalk22/slack-mcp
Maintainer/operator: `jtalk22` (`james@revasser.nyc`)
```

## First Comment Draft

```md
Quick notes:
- Default path is local-first (`stdio`) and remains fully supported.
- `--status` is read-only by design in this release.
- `--doctor` has deterministic exit codes for automation and triage.
- If registry pages lag, metadata is propagating; npm and GitHub release are authoritative first.

If anything fails, include OS, Node version, runtime mode (`stdio|web|http|worker`), and exact output.
```

## Pairing Sequence (Trust + Infra)

After the HN post goes live, pair with:

1. GitHub Discussion announcement update
2. GitHub Discussion support-intake thread refresh
3. Registry/listing parity checks (MCP registry, Smithery, Glama)
4. `awesome-mcp-servers` listing PR/update

## FAQ Macro

### Why session-based instead of OAuth app scopes?
Session mirroring provides the same access visible in the signed-in Slack web session.

### Is hosted deployment required?
No. Local operator path is primary. Hosted paths are optional.

### Are tool contracts changed in v2.0.0?
No. This release keeps existing MCP tool names.

### What should I run first?
Use:
```bash
npx -y @jtalk22/slack-mcp@latest --version
npx -y @jtalk22/slack-mcp@latest --doctor
npx -y @jtalk22/slack-mcp@latest --status
```
