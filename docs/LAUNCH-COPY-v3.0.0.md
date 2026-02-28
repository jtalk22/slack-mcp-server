# Launch Copy (v3.0.0)

Canonical text blocks for GitHub release surfaces, listings, and operator updates.

## Short Summary (Public)

`@jtalk22/slack-mcp v3.0.0` is live. This release keeps local-first operation unchanged (`stdio`, `web`) and hardens hosted HTTP mode with secure defaults. Hosted `/mcp` now requires bearer authentication using `SLACK_MCP_HTTP_AUTH_TOKEN`, and browser-origin access now uses explicit allowlisting via `SLACK_MCP_HTTP_ALLOWED_ORIGINS`. The major version reflects this hosted behavior change; local workflows and MCP tool names remain stable. Diagnostics remain deterministic (`--doctor` returns `0|1|2|3`), and `--status` remains read-only for safe checks. Public demo/media checks are now included in web verification so broken assets are caught before publish. Maintainer/operator: `jtalk22` (`james@revasser.nyc`).

## GitHub Release Block

```md
`v3.0.0` secures hosted HTTP defaults while keeping local-first workflows stable.

What changed:
- `/mcp` requires bearer auth by default
- CORS is origin-allowlist driven (`SLACK_MCP_HTTP_ALLOWED_ORIGINS`)
- no MCP tool renames/removals
- deterministic diagnostics are preserved

Verify:
`npx -y @jtalk22/slack-mcp@latest --version`
`npx -y @jtalk22/slack-mcp@latest --doctor`
`npx -y @jtalk22/slack-mcp@latest --status`
```

## Hosted Migration Block

```md
Hosted migration in under a minute:
`SLACK_TOKEN=xoxc-...`
`SLACK_COOKIE=xoxd-...`
`SLACK_MCP_HTTP_AUTH_TOKEN=change-this`
`SLACK_MCP_HTTP_ALLOWED_ORIGINS=https://claude.ai`
`node src/server-http.js`

Requests must include:
`Authorization: Bearer <SLACK_MCP_HTTP_AUTH_TOKEN>`

Emergency local fallback only:
`SLACK_MCP_HTTP_INSECURE=1 node src/server-http.js`
```

## GitHub Discussion Announcement

```md
`v3.0.0` is published.

- Hosted HTTP now enforces auth-by-default and explicit CORS policy.
- Local-first paths (`stdio`, `web`) remain unchanged.
- MCP tool names remain unchanged.

If you hit a deployment blocker, open deployment intake and include runtime mode + exact output.
```

## Listing Snippet (awesome-mcp-servers / registries)

```md
Session-based Slack MCP server for local-first operators. `v3.0.0` hardens hosted HTTP defaults (bearer auth + origin allowlist) while keeping local tool contracts stable.
```

## Support Intake Snippet

```md
Need guided hosted deployment help?
- Open deployment intake: `https://github.com/jtalk22/slack-mcp-server/issues/new?template=deployment-intake.md`
- Continue in Discussions: `https://github.com/jtalk22/slack-mcp-server/discussions`
```

## Propagation Note

Use when listing or registry caches lag:

`Release is published. Metadata propagation is in progress as of <UTC timestamp>.`
