# slack-mcp-server

**Platform:** Commercial (awareness tier)
**Status:** Active
**Role:** Public npm [`@jtalk22/slack-mcp`](https://www.npmjs.com/package/@jtalk22/slack-mcp). Session-based Slack MCP for Claude Code and MCP clients. Free tier that drives awareness for hosted commercial tier.

## Consumers (what uses this)
- Claude Code, Cursor, any MCP client — local-first Slack MCP
- `revereveal/slack-mcp-dev` — private dev fork upstream ref
- `revereveal/slack-mcp-hosted` — commercial tier derives from this
- npm users (22 stars, downloads)

## Producers (what this uses)
- Slack API — OAuth + socket mode
- Anthropic's MCP protocol spec

## Live surfaces
| Surface | URL | What |
|---|---|---|
| npm package | [npmjs.com/package/@jtalk22/slack-mcp](https://www.npmjs.com/package/@jtalk22/slack-mcp) | v3.1.0 |
| GitHub repo | public | README + docs |

## Key contacts / entry points
- README.md — public-facing docs
- `src/` — TypeScript source
- Release branches as cut by `release/v*.*.*` convention

## Status notes
- 235 commits, 1d since last push. 22 stars.
- Stays in `jtalk22/` (NOT moving to revereveal) because npm package scope is `@jtalk22/*` — namespace matches repo owner.
- Open PR #117 `release/v4.1.2` — unshipped, 4 commits. Audit flagged for ship-or-abandon decision.
- Uses LFS? No
