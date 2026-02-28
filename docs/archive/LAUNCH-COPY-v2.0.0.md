# Launch Copy (v2.0.0)

Use this file for technical channel distribution with consistent operational claims.

## Short Release Summary (150 words)

`@jtalk22/slack-mcp v2.0.0` is live as a reliability-focused release. This wave is about install confidence and deterministic behavior: `--status` is enforced as read-only in install-path checks, `--doctor` exits are standardized to `0/1/2/3`, and MCP/web error payloads use a shared structure for faster triage (`status`, `code`, `message`, `next_action`). Token health now handles missing timestamps as explicit `unknown_age` semantics to avoid false critical warnings. Tool compatibility is preserved: no MCP tool names were renamed or removed. Distribution checks were tightened with version parity reporting (`npm run verify:version-parity`) across local metadata, npm, and registry surfaces. For Claude Desktop, Claude Code, and web mode operators, this is a drop-in upgrade designed to reduce setup friction and operational noise while preserving the existing integration contract. Maintainer/operator: `jtalk22` (`james@revasser.nyc`).

## GitHub Release Refresh Block

```md
`v2.0.0` stays focused on reliability and install clarity:
- `--status` is read-only in install-path checks
- `--doctor` exits are deterministic (`0/1/2/3`)
- MCP/web diagnostics are structured consistently
- no MCP tool renames/removals

Install proof:
`npx -y @jtalk22/slack-mcp@latest --version`
`npx -y @jtalk22/slack-mcp@latest --doctor`
`npx -y @jtalk22/slack-mcp@latest --status`
```

## HN Follow-Up Comment Block

```md
Operator update for `v2.0.0`:
- install checks now enforce read-only `--status`
- `--doctor` is deterministic (`0/1/2/3`)
- compatibility is preserved (no tool rename/removal)

Fast verify:
`npx -y @jtalk22/slack-mcp@latest --version`
`npx -y @jtalk22/slack-mcp@latest --doctor`
`npx -y @jtalk22/slack-mcp@latest --status`

If setup fails, include OS + Node version + runtime mode (`stdio|web|http|worker`) and exact output.
```

## GitHub Discussion Update Block

```md
Public polish wave is live on top of `v2.0.0` (no new tag):
- mobile/web demo UX tightened
- stale media/version artifacts removed from public demo surfaces
- docs index curated for high-signal operator guidance

Core runtime contract is unchanged.
```

## Listing/Registry Update Snippets

### awesome-mcp-servers PR description

```md
Session-based Slack MCP server for local-first operators. Maintains deterministic install diagnostics (`--doctor 0/1/2/3`, read-only `--status`) and stable tool contracts in `v2.0.0`.
```

### Smithery/Glama parity note

```md
Metadata refreshed to match `v2.0.0` release surfaces. If listing caches lag, parity is propagating; npm + GitHub release remain authoritative.
```

## Propagation Note Template

Use when any external listing lags:

`Release is published. Registry/listing metadata is propagating as of <UTC timestamp>.`
