# Launch Copy (v3.0.0)

Canonical text blocks for GitHub release surfaces, listings, and operator updates.

## Short Summary (Public)

`@jtalk22/slack-mcp v3.0.0` is live. `v3.0.0` flips hosted `/mcp` from permissive to secure-default without breaking local workflows. Local-first operation stays unchanged (`stdio`, `web`) while hosted HTTP now requires bearer authentication (`SLACK_MCP_HTTP_AUTH_TOKEN`) and explicit origin allowlisting (`SLACK_MCP_HTTP_ALLOWED_ORIGINS`). The major version reflects this hosted behavior shift; MCP tool names remain stable. Diagnostics remain deterministic (`--doctor` returns `0|1|2|3`), and `--status` remains read-only. Public demo/media checks are now included in web verification so broken assets are caught before publish. Maintainer/operator: `jtalk22` (`james@revasser.nyc`).

## GitHub Release Block

````md
`v3.0.0` flips hosted `/mcp` from permissive to secure-default without breaking local workflows.

```bash
npx -y @jtalk22/slack-mcp@latest --version
npx -y @jtalk22/slack-mcp@latest --doctor
npx -y @jtalk22/slack-mcp@latest --status
```

What changed:
- `/mcp` requires bearer auth by default
- CORS is origin-allowlist driven (`SLACK_MCP_HTTP_ALLOWED_ORIGINS`)
- no MCP tool renames/removals
- deterministic diagnostics are preserved
````

## Hosted Migration Block

````md
Hosted migration in under a minute:
```bash
export SLACK_TOKEN=xoxc-...
export SLACK_COOKIE=xoxd-...
export SLACK_MCP_HTTP_AUTH_TOKEN=change-this
export SLACK_MCP_HTTP_ALLOWED_ORIGINS=https://claude.ai
node src/server-http.js
```

Requests must include:
`Authorization: Bearer <SLACK_MCP_HTTP_AUTH_TOKEN>`

Emergency local fallback only:
`SLACK_MCP_HTTP_INSECURE=1 node src/server-http.js`
````

## v3 Quick Proof Maintainer Comment

````md
Maintainer update:
`v3.0.0` flips hosted `/mcp` from permissive to secure-default without breaking local workflows.

```bash
npx -y @jtalk22/slack-mcp@latest --version
npx -y @jtalk22/slack-mcp@latest --doctor
npx -y @jtalk22/slack-mcp@latest --status
```

Hosted migration in under a minute:
```bash
export SLACK_TOKEN=xoxc-...
export SLACK_COOKIE=xoxd-...
export SLACK_MCP_HTTP_AUTH_TOKEN=change-this
export SLACK_MCP_HTTP_ALLOWED_ORIGINS=https://claude.ai
node src/server-http.js
```

If you hit a blocker, include runtime mode + exact output.
````

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
- Support ongoing maintenance: `https://github.com/sponsors/jtalk22`, `https://ko-fi.com/jtalk22`, `https://buymeacoffee.com/jtalk22`
```

## Propagation Note

Use when listing or registry caches lag:

`Release is published. Metadata propagation is in progress as of <UTC timestamp>.`
