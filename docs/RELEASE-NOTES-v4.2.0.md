# Release Notes — v4.2.0

**Workflow primitives + paid stubs + 6 templates. Structured JSON, not message dumps.**

---

## The axiom

A Slack catch-up that returns a wall of recent messages is a transcript, not an answer. Operators don't ask "what was said in #incident-room?" — they ask "what is open, who owns it, what's the next action?" Two different shapes. The first is what the MCP returned for a year. The second is what every actual workflow needs.

The bug class: tools that hand back narrative when the workflow needs structure. A support inbox catch-up should return `{open_threads, ack_lag, owner_gaps, escalations, next_actions}` — not paragraphs that the operator then has to re-parse into the same shape. The workflow_kind taxonomy makes the structure explicit, so the AI returns it instead of the operator extracting it.

v4.2.0 is the structural fix. v4.2 reorchestrates the hosted tier model around it. v4.3 (Q2 2026) adds the scheduled morning catch-up DM that turns this into a daily habit.

---

## What's new — v4.2.0

Three structural shifts. The OSS package gets new primitives that work standalone and gracefully degrade into discoverable upgrade stubs when the AI brain isn't reachable.

### 1. Workflow profile primitives (free in OSS)

Two new tools ship in the OSS package:

- `slack_workflow_save` — define a named profile bound to a `workflow_kind` (`support_inbox`, `incident_room`, `exec_brief`, `product_launch_watch`, or `custom`), a list of channels, optional priority people, retention mode, and summary cadence. Stored at `~/.slack-mcp-workflows.json`. Local. Yours.
- `slack_workflows` — list saved profiles.

Profiles are the routing surface. Once a profile is saved, paid tools (`slack_catch_me_up`, `slack_smart_search`, `slack_triage`) target it by name and return JSON shaped to the `workflow_kind`. The shape contract is part of the tool description, so MCP clients can present structured output directly.

### 2. Six packaged templates

Apply with one command at install time:

```
npx -y @jtalk22/slack-mcp --apply-template <template-name> --channels C012,C067
```

| Template | workflow_kind | Use case |
|---|---|---|
| `oncall-handoff` | `incident_room` | Engineering handoffs, on-call queue, postmortems |
| `support-triage` | `support_inbox` | CX/support backlog, ack lag, owner gaps |
| `exec-monday` | `exec_brief` | Weekly exec brief, decisions, risks, asks |
| `sprint-tracker` | `product_launch_watch` | Launch readiness, blockers, metrics |
| `customer-feedback` | `custom` | Voice-of-customer rollups |
| `incident-room` | `incident_room` | Live incidents, timeline, owner gaps |

Templates set sensible defaults. Channels are bound at apply time. Profile name can be overridden via `--profile-name`.

### 3. Three discoverable upgrade stubs

The AI brain (`slack_smart_search`, `slack_catch_me_up`, `slack_triage`) is hosted-only — semantic search over a Vectorize index, structured catch-up output, multi-channel triage scoring. In OSS, these tools surface as discoverable stubs that return a structured `tool_requires_hosted` payload with the signup URL, free quota details, and Pro value prop. No silent failure. The MCP client sees the stub, knows the upgrade path, and the operator can route to `mcp.revasserlabs.com` to enable the full surface.

This is the right shape for OSS↔hosted boundaries: the OSS package is honest about what it can and can't do; the upgrade is one click away; the hosted tier delivers what self-host structurally cannot.

### Total tool surface

**21 tools.** 16 read/write Slack tools (the existing surface from v4.1.x) + 2 workflow profile primitives (new, free) + 3 discoverable upgrade stubs (new, free OSS, paid hosted).

---

## v4.2 hosted tier reorchestration

This release ships alongside the v5 hosted pricing model that went live on `mcp.revasserlabs.com` this week.

| Tier | Price | What it covers |
|---|---|---|
| Self-host (OSS) | Free (MIT) | Local stdio, all 21 tools (16 read/write + 2 primitives + 3 discoverable stubs) |
| Hosted Free | $0 (no card) | Email signup, 1 workspace, 10 smart_search/mo + 3 catch_me_up/mo + 5 triage/day. All 5 workflow profile types. 7-day index retention. |
| Hosted Pro | $9/mo | Unlimited AI tools, permanent OAuth (no 2-week token rotation), 90-day Vectorize retention, 2 workspaces. Scheduled morning catch-up DM at 8am workspace tz **rolling out Q2 2026**. |
| Hosted Team | $49/mo flat | Pro + shared workflow profiles + audit log + 24h support + scheduled catch-up to channel + 5 workspaces |
| Ops engagement | from $199/mo (custom) | SLA, custom retention, SOC2 evidence path, multi-tenant isolation, 10+ workspaces, dedicated workflow tuning |

**Rolling out Q2 2026 — explicit caveat:** the scheduled morning catch-up DM at 8am workspace time is named in the Pro tier description because it is the daily-habit lever the architecture is designed around. The Cloudflare Cron handler that posts the structured brief to your Slack DM ships in **v4.3.0 (Q2 2026)**. Until then, Pro at $9/mo unlocks unlimited AI tools (the differentiator from Free); the morning DM is forward-looking. Free $0 is fully functional today. Pro is a real upgrade today (unlimited credits, permanent OAuth, 90-day retention, 2 workspaces). The morning DM joins in v4.3.0.

We chose to ship v4.2.0 today rather than wait for the morning DM build because the workflow primitives are the structural foundation everything else depends on. Operators using Free or Pro today get real value; the morning DM lands when it lands.

---

## Honest tradeoff

The v4.2.0 release widens the OSS surface (16 → 21 tools) without widening what self-host can structurally do. The 3 new tools that ship paid-only as hosted features (`slack_smart_search`, `slack_catch_me_up`, `slack_triage`) land in OSS as discoverable stubs that return a `tool_requires_hosted` payload pointing at signup. No silent failure. No bait-and-switch. The reader's MCP client sees the stub, knows the upgrade path, and routes the operator to mcp.revasserlabs.com when the AI brain is the right move.

**What v4.2.0 adds to self-host (free, MIT):**

- 2 new workflow profile primitives — `slack_workflow_save`, `slack_workflows`. 5 named workflow_kind shapes, each returning a 4–5-key JSON contract.
- 6 packaged templates that bind a `workflow_kind` to a channel set in 30 seconds: `npx -y @jtalk22/slack-mcp --apply-template exec-monday --channels C012,C067`.
- 3 discoverable upgrade stubs that surface the hosted brain at the tool-list level instead of in marketing copy.

The v4.1.x carry-over (LevelDB token extraction, multi-profile Chrome enumeration, explicit shutdown handlers — all detailed in [v4.1.2 notes](RELEASE-NOTES-v4.1.2.md)) ships unchanged.

**What self-host structurally cannot do — and where hosted picks up:**

- Semantic search across Slack history. Vectorize is stateful and hosted-only.
- Connect Claude.ai web users. Their MCP transport is HTTP; self-host is stdio. This is a transport contract difference, not a configuration issue.
- Live in the Anthropic MCP Directory. The Directory's OAuth 2.1 bridge is a hosted-side surface; an npm package can't satisfy it.
- Persist credentials in encrypted at-rest storage that the operator never touches. Self-host writes tokens to `~/.slack-mcp-tokens.json` with `chmod 600`; hosted writes to AES-256-GCM-encrypted Cloudflare D1.
- Eliminate the 2-week token rotation cycle. Self-host re-pastes when Slack rotates the session; hosted holds an OAuth grant.

**What hosted does NOT own yet:** server-side OAuth refresh for tokens that pre-date the OAuth grant — operators connecting via session paste still re-paste on rotation, just like self-host. v4.1.3 territory.

**What v4.3.0 closes (Q2 2026):** the daily-habit lever. Pro tier names "scheduled morning catch-up DM at 8am workspace time" today; the Cloudflare Cron handler that posts the brief lands in v4.3.0. Until then, Pro $9/mo is real (unlimited AI tools, permanent OAuth, 90-day Vectorize, 2 workspaces) and the morning DM is forward-looking — same shape v4.1.2 used for the `last_verified_with_slack_at` field.

---

## Install

```bash
npx -y @jtalk22/slack-mcp
```

### Apply a template at install time

```bash
npx -y @jtalk22/slack-mcp --apply-template support-triage --channels C012345,C067890
```

### Claude Code

```json
{
  "mcpServers": {
    "slack": {
      "command": "npx",
      "args": ["-y", "@jtalk22/slack-mcp"]
    }
  }
}
```

### Cursor / Copilot / Codex CLI / Windsurf / Gemini / ChatGPT

Same config block — all support stdio MCP.

---

## Links

- GitHub: https://github.com/jtalk22/slack-mcp-server
- Hosted: https://mcp.revasserlabs.com
- Pricing: https://mcp.revasserlabs.com/pricing
- Full changelog: [CHANGELOG.md](../CHANGELOG.md)
- Previous release: [v4.1.2](RELEASE-NOTES-v4.1.2.md)
