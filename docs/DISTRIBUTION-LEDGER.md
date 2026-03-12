# Distribution Ledger

Checked: March 11, 2026

This ledger tracks the current public discovery surfaces for Slack MCP and the next corrective action for each one.

## Canonical Source of Truth

- Public package and self-host docs: this repo
- Canonical homepage: `https://mcp.revasserlabs.com`
- Canonical package metadata: `package.json`, `server.json`, `glama.json`
- Next metadata-bearing public release: `3.2.5`

## Current External Surface

| Surface | Current state | Evidence (March 11, 2026) | Owner | Next action |
|---|---|---|---|---|
| MCP Registry | Version and homepage aligned; description still stale | Registry API returns `3.2.4`, `websiteUrl=https://mcp.revasserlabs.com`, description still says `Session-based Slack MCP for Claude and MCP clients: local-first workflows, secure-default HTTP.` | Revasser / jtalk22 | Publish `3.2.5` so the new canonical description can propagate |
| Glama | Metadata prepared locally; public correction still pending | `glama.json` is updated for `3.2.5`; public ticket already opened; stable public listing not yet confirmed in search | Revasser / jtalk22 | Re-check after `3.2.5` publish and after the Glama correction closes |
| mcp.so | Listing reachable, but copy is stale and self-host-only | Browser fetch returns title `Slack Mcp Server MCP Server` and meta description focused on browser token auth and Claude-only setup | Third-party index | Monitor next crawl after `3.2.5`; request correction if description remains stale |
| PulseMCP | Indexed listing appears stale or removed | Direct request to `https://www.pulsemcp.com/servers/jtalk22-slack-mcp-server` returns `404` | Third-party index | Treat as stale index drift; re-check after `3.2.5` and remove from active acquisition assumptions until it resolves |
| Smithery | Endpoint/listing surface exists but is not easy to validate from unattended scripts | Public CLI check currently hits rate-limit/challenge behavior; version parity script still treats endpoint reachability as manual | Third-party index | Do manual browser verification after `3.2.5`; keep as secondary monitoring surface, not a primary acquisition bet |

## Release Discipline

For any metadata-bearing release:

1. update `package.json`, `package-lock.json`, `server.json`, and `glama.json`
2. publish npm and verify `npx --version`
3. verify MCP Registry version and homepage
4. re-check this ledger for description drift, stale links, and removed listings
5. capture follow-up actions in the release health snapshot

## Current Risk Read

- The biggest live mismatch is descriptive, not structural: MCP Registry is pointing at the correct homepage but still carrying older description text until `3.2.5` ships.
- Secondary directories are less reliable than GitHub, npm, the hosted site, and MCP Registry.
- Treat Google, GitHub, and MCP Registry as the primary acquisition stack; treat the rest as parity surfaces that still need periodic hygiene.
