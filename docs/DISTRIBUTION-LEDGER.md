# Distribution Ledger

Checked: March 12, 2026

This ledger tracks the current public discovery surfaces for Slack MCP and the next corrective action for each one.

## Canonical Source of Truth

- Public package and self-host docs: this repo
- Canonical homepage: `https://mcp.revasserlabs.com`
- Canonical package metadata: `package.json`, `server.json`, `glama.json`
- Next metadata-bearing public release: `3.2.6+` if metadata drifts again or a listing-facing fix requires republish

## Current External Surface

| Surface | Current state | Evidence (March 11, 2026) | Owner | Next action |
|---|---|---|---|---|
| MCP Registry | Fully aligned on version, homepage, and canonical short description | Registry API returns `3.2.5`, `websiteUrl=https://mcp.revasserlabs.com`, description `Slack MCP for self-host or managed Cloud, with Gemini CLI and secure-default HTTP.` | Revasser / jtalk22 | No immediate action; keep parity checks in release cadence |
| Glama | Local metadata is current; public correction still pending external follow-through | March 12, 2026 public fetch still surfaced a different Slack MCP server page (`cnye36/slack-mcp-server`) instead of a corrected `jtalk22` result | Revasser / jtalk22 | Re-check after the Glama correction closes, record the final live title/description/homepage, and keep the hosted comparison, checkout, workflows, and readiness pages in the owned-link mix |
| mcp.so | Listing reachable, but copy is still stale and Claude/browser-token-heavy | March 12, 2026 fetch returns title `Slack Mcp Server MCP Server`, a Claude/browser-token description, and `github.com/jtalk22/slack-mcp-server` as the primary visit target instead of `https://mcp.revasserlabs.com` | Third-party index | Submit a correction using the canonical short description, hosted homepage, company-led Cloud wording, and the new official-vs-managed comparison page, then re-check after the next crawl |
| PulseMCP | Indexed listing appears stale or removed | Direct request to `https://www.pulsemcp.com/servers/jtalk22-slack-mcp-server` still returns `404` | Third-party index | Treat as stale index drift; remove from active acquisition assumptions until it resolves |
| Smithery | Endpoint/listing surface exists but is still awkward to validate from unattended scripts | Public CLI/browser checks still hit rate-limit or challenge behavior; parity script treats endpoint reachability as manual | Third-party index | Keep as secondary monitoring surface and do periodic manual verification |

## Release Discipline

For any metadata-bearing release:

1. update `package.json`, `package-lock.json`, `server.json`, and `glama.json`
2. publish npm and verify `npx --version`
3. verify MCP Registry version and homepage
4. re-check this ledger for description drift, stale links, and removed listings
5. capture follow-up actions in the release health snapshot

## Current Risk Read

- MCP Registry is now aligned; the remaining discovery drift is mostly in secondary directories.
- Secondary directories are still less reliable than GitHub, npm, the hosted site, and MCP Registry.
- Treat Google, GitHub, the hosted site, and MCP Registry as the primary acquisition stack; treat the rest as parity surfaces that still need periodic hygiene.
- The owned revenue path is now `README / Pages / docs -> hosted pricing or /checkout -> success/setup/account`, so listing corrections should preserve that path instead of routing buyers back into generic GitHub pages.
- The owned fit/distribution path is now `README / Pages / docs -> hosted official-vs-managed or marketplace-readiness -> deployment/pricing/checkout`, so secondary directories should send evaluation traffic to hosted comparison and procurement surfaces instead of generic GitHub pages.
- Hosted-admin funnel summaries now expose deployment-review verification and delivery state. When `HOSTED_ADMIN_TOKEN` is available, fold that data into release-health so acquisition discussions stay tied to verified leads and not just raw page views.
