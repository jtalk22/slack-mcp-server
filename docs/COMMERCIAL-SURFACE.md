# Commercial Surface Map

This repo is the public self-host and release-trust surface for Slack MCP. It is not the entire product. The hosted commercial surface lives at [mcp.revasserlabs.com](https://mcp.revasserlabs.com), and the current external directory state is tracked in [Distribution Ledger](DISTRIBUTION-LEDGER.md).

## Current System

```mermaid
flowchart LR
    A["GitHub repo"] --> B["README + docs + release health"]
    A --> C["GitHub Pages proof surface"]
    A --> D["npm package / GHCR image"]
    A --> E["MCP Registry metadata"]
    B --> F["Hosted pricing/docs/security/support/deployment"]
    C --> F
    D --> G["Self-host users"]
    E --> H["Remote MCP discovery"]
    F --> I["Cloud buyers / rollout review"]
```

## Repo Job Definition

This public repo should do five things well:

1. establish self-host trust
2. prove release integrity
3. route Cloud buyers to the hosted surface
4. keep registry/npm/runtime parity visible
5. avoid looking noisy, abandoned, or bot-led

## What Changed

The repo is no longer just a launch artifact for an OSS tool. It now acts as:

- the public proof surface for self-host
- the distribution root for npm / Docker / MCP Registry
- the trust bridge into the hosted paid product
- the metadata bridge into secondary directories that often lag behind the real product surface

## Current Cloud Positioning

- Cloud is Claude-first
- Gemini CLI is supported as the second client path
- Solo is the feeder plan
- Team is the shared product plan
- Turnkey Team Launch and Managed Reliability are the premium motions

## Current Pain Points

### 1. Public repo can still over-rotate into OSS-only reading

The repo now routes well into Cloud, but some visitors will still read it as “just the package” unless the Pages proof surface and README stay current.

### 2. External listing drift is always a risk

npm, GHCR, MCP Registry, secondary directories, and hosted surfaces can drift if release discipline slips.

### 3. Hosted funnel visibility is only partly wired into public reporting

The public release-health script can read hosted funnel summaries, but only when hosted admin auth is provided.

### 4. The public repo still cannot carry the full buyer conversation

That is intentional, but it means the handoff to hosted pricing/docs/deployment must remain obvious and current.

## Current Strengths

- release-preflight is strong again
- public Pages are generated from shared metadata
- live Cloud status is read from hosted `/status`
- hosted security/procurement now has a dedicated route instead of being implied across other pages
- README now carries the self-host versus Cloud split credibly
- MCP Registry and homepage metadata are aligned with the hosted surface
- a checked distribution ledger now records the real state of MCP Registry, Glama, mcp.so, PulseMCP, and Smithery

## Next Opportunities

```mermaid
flowchart TD
    A["Public trust"] --> B["More buyer confidence"]
    B --> C["More pricing and deployment clicks"]
    C --> D["More checkouts and rollout reviews"]

    A --> E["Better parity automation"]
    E --> F["Fewer visible release mistakes"]

    B --> G["More workflow proof"]
    G --> H["Higher Team / premium conversion"]
```

- Add more named workflow proof to the public Pages surface.
- Keep public buyer-trust links routed to hosted `/security`, `/deployment`, and `/support`.
- Pull hosted funnel summary into release-health whenever admin auth is available.
- Ship `3.2.5` specifically to close MCP Registry description drift and refresh downstream crawlers.
- Keep README and Pages focused on trust, not feature bloat.
- Continue reducing GitHub-side noise so public history looks operator-led.
