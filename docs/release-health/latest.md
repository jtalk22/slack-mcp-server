# Release Health Snapshot

- Generated: 2026-03-11T16:07:16.139Z
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
- hosted deployment review requests: manual tracking

## 14-Day Reliability Targets

- weekly downloads: >= 180
- qualified hosted deployment review requests: manual
- maintainer support load: <= 2 hours/week

## Same-Day Operator Checks

- hosted deployment review requests: manual
- GitHub Release page: verify current release notes, verify commands, support path, and Cloud vs self-hosted split.
- npm / npx / GHCR parity: verify after release using `npm view`, `npx --version`, and Docker `--version`.
- MCP Registry / Glama / Smithery: confirm latest version and canonical homepage, or record propagation lag.
- Cloudflare sessions since release: manual.
- Checkout starts and provisioned keys since release: manual.
- Support load for the release window: manual.

## Hosted Funnel

- unavailable: HOSTED_ADMIN_TOKEN not set

## Notes

- Update this snapshot daily during active release windows, then weekly.
- GitHub traffic is an awareness signal, not the sole demand KPI, now that canonical onboarding lives at mcp.revasserlabs.com.
- Track off-GitHub funnel metrics with the hosted summary when admin auth is available, then reconcile against Cloudflare sessions and support load.
- Track hosted deployment review volume and support load manually.
