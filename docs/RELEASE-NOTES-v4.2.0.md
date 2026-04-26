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

**What self-host (free) owns:** Workflow profile primitives (`slack_workflow_save`, `slack_workflows`), 6 packaged templates, all 16 read/write Slack tools, LevelDB token extraction, multi-profile Chrome enumeration, zombie-free process lifecycle, structured error codes, auto-heal telemetry. MIT licensed. The 3 discoverable upgrade stubs ship in OSS as honest signposts to the hosted brain.

**What hosted owns that self-host structurally cannot:**

- The AI brain (`slack_smart_search`, `slack_catch_me_up`, `slack_triage`) — Vectorize semantic search, structured workflow_kind output, multi-channel triage scoring. Stateful. Hosted-only.
- Managed MCP endpoint on the public internet — required for Claude.ai web users.
- OAuth 2.1 bridge into the Anthropic MCP Directory.
- Encrypted credential storage (AES-256-GCM in Cloudflare D1) — credentials never touch your filesystem.
- Permanent OAuth (no 2-week token rotation).
- Stripe subscription billing + SLA guarantees on Team and Ops tiers.
- Structural absence of the zombie-process class.

**What's coming in v4.3.0 (Q2 2026):**

- Scheduled morning catch-up DM at 8am workspace time (Pro+).
- Scheduled catch-up to a team Slack channel (Team).
- Cron handler in `slack-mcp-hosted` that reads active Pro/Team tenants from D1, runs structured catch-ups against each tenant's primary workflow profile, posts the brief via `chat.postMessage`, and records the run in `scheduled_catchup_runs`.

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
