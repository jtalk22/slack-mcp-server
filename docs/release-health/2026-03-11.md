# Release Health Snapshot

- Generated: 2026-03-12T00:09:37.669Z
- Repo: `jtalk22/slack-mcp-server`
- Package: `@jtalk22/slack-mcp`

## Install Signals

- npm downloads (last week): 195
- npm downloads (last month): 1611
- npm latest version: 3.2.4

## GitHub Reach

- stars: 14
- forks: 10
- open issues: 0
- 14d views: 475
- 14d unique visitors: 192
- 14d clones: 2161
- 14d unique cloners: 404
- hosted deployment review submits: unavailable

## 14-Day Reliability Targets

- weekly downloads: >= 180
- qualified hosted deployment review requests: unavailable
- maintainer support load: <= 2 hours/week

## Same-Day Operator Checks

- hosted deployment review requests: unavailable
- GitHub Release page: verify current release notes, verify commands, support path, and Cloud vs self-hosted split.
- npm / npx / GHCR parity: verify after release using `npm view`, `npx --version`, and Docker `--version`.
- MCP Registry / Glama / Smithery: confirm latest version and canonical homepage, or record propagation lag.
- Cloudflare sessions since release: unavailable.
- Checkout starts and provisioned keys since release: unavailable.
- Support load for the release window: unavailable.

## Hosted Funnel

- unavailable: HOSTED_ADMIN_TOKEN not set

## Search Ops

- Submit or refresh `https://mcp.revasserlabs.com/sitemap.xml` in Google Search Console and Bing Webmaster Tools.
- Inspect `/`, `/pricing`, `/security`, `/gemini-cli`, `/workflows`, and `/use-cases/support-triage`.
- Compare Search Console clicks with hosted first-touch source mix weekly.
- Use `docs/DISTRIBUTION-LEDGER.md` as the manual follow-up ledger for MCP Registry, Glama, mcp.so, PulseMCP, and Smithery.

## Notes

- Update this snapshot daily during active release windows, then weekly.
- GitHub traffic is an awareness signal, not the sole demand KPI, now that canonical onboarding lives at mcp.revasserlabs.com.
- Track off-GitHub funnel metrics with the hosted summary when admin auth is available, then reconcile against Cloudflare sessions, Search Console/Bing, and support load.
- Use the distribution ledger to record directory drift that cannot be read from GitHub traffic alone.
