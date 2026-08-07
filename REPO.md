# slack-mcp-server

**Platform:** Commercial (awareness tier)
**Status:** Active
**Role:** Public npm [`@jtalk22/slack-mcp`](https://www.npmjs.com/package/@jtalk22/slack-mcp). Session-based Slack MCP for any stdio MCP client. Free tier that drives awareness for hosted commercial tier.

## Consumers (what uses this)
- Claude Code, Cursor, any stdio MCP client — local-first Slack MCP
- `revereveal/slack-mcp-dev` — private dev fork upstream ref
- `revereveal/slack-mcp-hosted` — commercial tier derives from this
- npm users (live downloads: https://www.npmjs.com/package/@jtalk22/slack-mcp)

## Producers (what this uses)
- Slack API — browser-session auth (local) / OAuth (hosted)
- Anthropic's MCP protocol spec

## Live surfaces
| Surface | URL | What |
|---|---|---|
| npm package | [npmjs.com/package/@jtalk22/slack-mcp](https://www.npmjs.com/package/@jtalk22/slack-mcp) | current release (see repo tags) |
| GitHub Pages | [jtalk22.github.io/slack-mcp-server](https://jtalk22.github.io/slack-mcp-server/) | landing + proof reel + walkthrough |
| GitHub repo | public | README + docs |
| MCP registry | `io.github.jtalk22/slack-mcp-server` | registry listing |
| GHCR | `ghcr.io/jtalk22/slack-mcp-server` | container image |

## Key contacts / entry points
- README.md — public-facing docs
- `src/` + `lib/` — JavaScript source (ESM)
- `templates/public-pages/` → `lib/public-pages.js` — generated public surface
- Releases cut from tags `v*.*.*`; publish.yml handles npm + MCP registry

## Status notes
- Stays in `jtalk22/` (NOT moving to revereveal) because npm package scope is `@jtalk22/*` — namespace matches repo owner.
- Star/download counts: read them live; never pin them here.
- Uses LFS? No
