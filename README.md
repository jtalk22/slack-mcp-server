<div align="center">

[![npm version](https://img.shields.io/npm/v/@jtalk22/slack-mcp?style=flat-square&logo=npm&logoColor=white&label=npm&labelColor=0b0b0c&color=e5482f)](https://www.npmjs.com/package/@jtalk22/slack-mcp)&nbsp;[![downloads per year](https://img.shields.io/npm/dy/%40jtalk22%2Fslack-mcp?style=flat-square&logo=npm&logoColor=white&label=downloads&labelColor=0b0b0c&color=ffb224)](https://npm-stat.com/charts.html?package=%40jtalk22%2Fslack-mcp)&nbsp;[![weekly downloads](https://img.shields.io/npm/dw/%40jtalk22%2Fslack-mcp?style=flat-square&label=weekly&labelColor=0b0b0c&color=ffb224)](https://www.npmjs.com/package/@jtalk22/slack-mcp)&nbsp;[![Node](https://img.shields.io/node/v/%40jtalk22%2Fslack-mcp?style=flat-square&logo=nodedotjs&logoColor=white&labelColor=0b0b0c&color=28c840)](https://nodejs.org)&nbsp;[![License: MIT](https://img.shields.io/badge/license-MIT-e5482f?style=flat-square&labelColor=0b0b0c)](LICENSE)

[![Docker image](https://img.shields.io/badge/ghcr.io-published-2496ed?style=flat-square&logo=docker&logoColor=white&labelColor=0b0b0c)](https://github.com/jtalk22/slack-mcp-server/pkgs/container/slack-mcp-server)&nbsp;[![MCP Registry](https://img.shields.io/badge/MCP_Registry-listed-ffb224?style=flat-square&labelColor=0b0b0c)](https://registry.modelcontextprotocol.io/v0/servers/io.github.jtalk22%2Fslack-mcp-server/versions/latest)&nbsp;[![CI](https://img.shields.io/github/actions/workflow/status/jtalk22/slack-mcp-server/ci.yml?style=flat-square&logo=githubactions&logoColor=white&label=CI&labelColor=0b0b0c&color=28c840)](https://github.com/jtalk22/slack-mcp-server/actions/workflows/ci.yml)&nbsp;[![npm provenance signed](https://img.shields.io/badge/provenance-signed-28c840?style=flat-square&labelColor=0b0b0c)](#provenance-dont-take-my-word-for-it)

<img src="docs/assets/icon.svg" width="88" alt="Slack MCP channel mark">

<h1>Slack MCP Server</h1>

<p><strong>Catch up on Slack without reading it.</strong></p>

<p>Unreads, threads, and search — in your agent’s context, from the session you already have.</p>

<p><kbd>Claude Code</kbd> <kbd>Claude Desktop</kbd> <kbd>Cursor</kbd> <kbd>Copilot</kbd> <kbd>Windsurf</kbd> <kbd>Gemini CLI</kbd> <kbd>Codex CLI</kbd> <kbd>any stdio MCP client</kbd></p>

<a href="https://jtalk22.github.io/slack-mcp-server/public/demo-video.html">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/hero-v2-dark.gif">
    <source media="(prefers-color-scheme: light)" srcset="docs/images/hero-v2-light.gif">
    <img src="docs/images/hero-v2-light.gif" width="900" alt="Split screen. On the left, on purple: It’s Tuesday, 9:07 AM. A jammed printer, nobody knows the PIN, and the guy who did left five months ago. On the right, in the workspace, two people asked the same question and got zero replies. One search, slack_search_messages, scrolls five months back to Dave’s post in #facilities from 12 October, and a yellow band joins the PIN, 4729, on the left to his message on the right. Zero reactions. Five months. Three people. One printer. Tape it to the printer.">
  </picture>
</a>

</div>

```bash
# set up once, then register it with your client
npx -y @jtalk22/slack-mcp --setup
claude mcp add slack -- npx -y @jtalk22/slack-mcp

# check your own setup
npx -y @jtalk22/slack-mcp --doctor --security

# read Slack, never write to it
npx -y @jtalk22/slack-mcp --read-only
```

<p align="center"><strong><a href="https://jtalk22.github.io/slack-mcp-server/public/demo-video.html">▶ The whole morning in three minutes — the outage, the migration, the new hire, and the printer</a></strong> · <a href="https://jtalk22.github.io/slack-mcp-server/public/demo-slack-mcp.html">interactive walkthrough</a> · <a href="docs/SETUP.md">setup guide</a></p>

<p align="center">
  <a href="#new-in-51">New in 5.1</a> ·
  <a href="#if-your-workspace-is-on-slacks-free-plan">Free Slack</a> ·
  <a href="#two-ways-into-slack">Why session auth</a> ·
  <a href="#install">Install</a> ·
  <a href="#20-tools-read-act-automate">20 tools</a> ·
  <a href="#typed-workflows-slack-in-json-out">Workflows</a> ·
  <a href="#security-and-provenance">Security</a> ·
  <a href="#built-past-the-demo">How it works</a> ·
  <a href="#free-local-when-youre-driving-hosted-when-it-must-drive-itself">Local vs hosted</a>
</p>

---

## Slack has already formed opinions.

You ask “what blew up overnight?” and the agent reads the workspace instead of you. It reconstructs the 2 AM P1 from `#incidents`—owner, resolution, and the runbook step that is still wrong. It finds the printer PIN that has been waiting in `#facilities` for five months. Then it closes the handled loops—replies, reactions, read-state changes—only where you approve.

This is not screenshot automation. The agent calls Slack through a real MCP tool surface and receives typed results it can search, summarize, export, or act on.

---

## New in 5.1

- **Catch-up sees mentions and thread replies.** It reads the counts Slack’s own sidebar uses. On a real workspace that moved the answer from zero conversations to seven, with ten mentions waiting.
- **Commitments, owner gaps and open questions — free and local.** `slack_catch_me_up` returns who said they would do what, the requests nobody answered and the questions left open, each with the text that matched and a link to the message.
- **Every message says who wrote it.** `self`, `internal`, `external` or `bot`, so text written outside your workspace reaches the model labelled. An author the server cannot place says `unknown` rather than guessing.
- **`--read-only`.** The write tools are never registered, and a call to one is refused. The one guarantee that does not depend on the model behaving.
- **`--doctor --security`.** Six checks of your own setup, each with the one command that tightens it.
- **A session receipt and signed releases.** `slack_session_report` counts what this process read and tried to send — never the text. Releases publish from CI through npm trusted publishing with signed provenance, and CodeQL and OSV-Scanner run on every change.

---

## If your workspace is on Slack's free plan

Checked against Slack's published plans and pricing on 2026-10-07.

A free workspace keeps 90 days of message history, allows 10 app integrations, and gets only Slack's basic AI. The AI people actually want — AI search across the workspace, channel recaps, Slackbot acting as an agent, AI workflow generation — starts on Business+ at $12.50 per user per month on annual billing. Pro, at $7.25, buys unlimited history and unlimited apps, not the advanced AI. So a ten-person free workspace that wants an AI it can ask about its own Slack is looking at roughly $1,500 a year, and the cheaper upgrade does not get them there.

This package gives that workspace an agent over the same Slack for nothing, running on the AI subscription its people already pay for. Three things follow from how it works:

- **It installs no Slack app, so it uses none of your 10 app slots.** If your workspace is already at the cap, this is the only way left to add an integration at all.
- **It needs no admin approval**, because it is not an app anyone has to approve. It reads Slack through your own browser session, with exactly the access you already have and nothing more.
- **It can export what you can still see.** On a free plan, history older than 90 days stops being reachable — Slack's own free export covers public channels only and is admin-only, so DMs and private channels are not in it. `slack_get_full_conversation` writes them out with their threads while they are still inside the window. It cannot retrieve anything already past the line; nothing can.

The browser-session route is not a workaround to apologise for. For a workspace Slack's own AI does not serve, it is the only route there is.

---

## Two ways into Slack

Slack already knows who you are. The official path is a Slack-managed remote integration governed by workspace policy—a strong fit for organization-sanctioned deployments, documented by [Slack](https://docs.slack.dev/ai/slack-mcp-server/) with integration settings under [admin control](https://docs.slack.dev/ai/slackbot-mcp-client/admin-approval/). This project is the direct local path: session-based auth from the browser session already in Chrome, local stdio, any stdio MCP client, and no Slack app or admin request. Same Slack identity. Same underlying permissions. A radically shorter path from your workspace to your agent.

<details>
<summary><strong>Side by side: the managed integration path vs. the local session path</strong></summary>
<br>

| | Slack official MCP | **Slack MCP Server — local** |
|---|---|---|
| Starting point | A Slack-managed remote integration | The Slack session already in Chrome |
| Workspace control | Governed by workspace integration settings | **No Slack app or admin request for the local path** |
| Transport | Streamable HTTP | **Local stdio** |
| Client surface | Slack's supported partner integrations | **Any stdio MCP client** |
| Authentication | OAuth | **Existing browser session** |
| Credential lifetime | Managed OAuth | Rotating session with health checks and refresh |
| Product surface | Broad Slack-native capabilities | **19 focused tools across read, act, and automate** |
| Protocol | Slack-managed | **MCP 2026-07-28 and every 2025 revision, from the same binary** |
| Runtime | Slack-managed | **MIT code on your machine** |

</details>

<details>
<summary><strong>Is the local path against Slack's terms?</strong></summary>
<br>

Treat browser-session automation as an acceptable-use decision for you and your workspace. The server acts as your signed-in Slack identity and cannot read a channel you cannot read or act as another user. It does not evade server-side retention, DLP, compliance exports, or audit controls.

"No admin request" means there is no Slack app installation to approve. It does not mean workspace activity disappears from Slack's systems. If your policy requires a sanctioned OAuth integration, use the official MCP or the optional [hosted OAuth path](https://mcp.revasserlabs.com).
</details>

---

## Install

**Node 22 or 24 recommended. Node 20+ is supported and CI-tested.**

```bash
npx -y @jtalk22/slack-mcp --setup
```

Prefer a persistent CLI: `npm install -g @jtalk22/slack-mcp` then `slack-mcp --setup`.

Then:

1. Copy the stdio command `--setup` prints when it finishes.
2. Paste it into your client, or run the `claude mcp add` line it prints.
3. Fully restart the client.
4. Ask the agent to run `slack_health_check`.
5. A workspace name in the response means the connection is live.

Per-client configuration keys are in the [setup guide](docs/SETUP.md).

Use the same server command everywhere:

```json
{
  "command": "npx",
  "args": ["-y", "@jtalk22/slack-mcp"]
}
```

On macOS, setup can extract from Chrome and persist the selected storage backend. On other platforms, provide `SLACK_TOKEN` and `SLACK_COOKIE` through the client's environment configuration. Docker, HTTP, and detailed client examples live in [docs/SETUP.md](docs/SETUP.md) and [docs/DEPLOYMENT-MODES.md](docs/DEPLOYMENT-MODES.md).

<details>
<summary><strong>Client configuration matrix</strong></summary>
<br>

| Client | Configuration surface | Status |
|---|---|---|
| Claude Code | `claude mcp add` or `~/.claude.json` | Documented |
| Claude Desktop | Desktop MCP configuration | Verified |
| Cursor | `.cursor/mcp.json` | Documented |
| GitHub Copilot | `.vscode/mcp.json` | Documented |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` | Documented |
| Gemini CLI | `~/.gemini/settings.json` | Documented |
| Codex CLI | `codex mcp add` or `~/.codex/config.toml` | Documented |
| Other clients | Any stdio MCP configuration | Protocol-compatible |

</details>

---

## 20 tools: read, act, automate

The local surface ships **20 tools** today: **13 read-only** operations, **4 write-path** tools that each carry an MCP destructive annotation so clients can gate workspace writes, and 3 local workflow tools including the catch-up itself. One of the reads is `slack_session_report`, which reads nothing from Slack: it returns what this process has done, as counts. Every tool does its work here — reads Slack or local state — and none is a placeholder for something you would have to pay for. Four read tools accept `include_rich_message_fields: true` to surface attachments, blocks, files, reactions, and metadata—complete inputs and response contracts live in [docs/API.md](docs/API.md).

Speaks MCP **2026-07-28** and every 2025 revision from the same binary — era-negotiated over stdio, stateless per request over HTTP (no `Mcp-Session-Id`; `GET`/`DELETE` answer 405). The claim is a test, not a sentence: [`test/mcp-era.test.js`](test/mcp-era.test.js) drives the real SDK client at both eras against the real entry points.

<p align="center">
  <img src="docs/images/diagram-schema-budget.svg" width="900" alt="Estimated schema tokens per turn by profile: essentials 6 tools at about 1,474 tokens or 37 percent, read 13 tools at about 2,359 or 59 percent, all 20 tools at about 4,008 or 100 percent">
</p>

**Advertising fewer tools.** A client pays for the tool schema on every turn that carries it. `SLACK_MCP_TOOLS=essentials` advertises six tools — unread, history, search, thread, user lookup, send — costing roughly **1,474 estimated tokens** of schema per turn against about **4,008** for all 20. `SLACK_MCP_TOOLS=read` advertises the 13 read-only operations listed below, near 2,359. `--tools=slack_x,slack_y` takes an explicit set. The default stays all 20. Filtering changes what is advertised, not what is callable. Reproduce the numbers with `node scripts/measure-tool-schema.js` (a ~4-chars-per-token estimate).

<details>
<summary><strong>The full tool inventory</strong></summary>
<br>

### 13 read-only operations

| Tool | Purpose |
|---|---|
| `slack_health_check` | Verify credentials and workspace identity |
| `slack_token_status` | Inspect credential age, health, cache, profile, and storage state |
| `slack_refresh_tokens` | Refresh local credentials from the browser session on macOS—reads Slack, writes only local state |
| `slack_list_conversations` | List channels and DMs |
| `slack_conversations_history` | Read channel or DM history with optional rich fields |
| `slack_get_full_conversation` | Export complete history and threads |
| `slack_search_messages` | Search across the workspace |
| `slack_get_thread` | Read all replies in a thread |
| `slack_users_info` | Resolve a user |
| `slack_list_users` | Page through large workspace directories |
| `slack_users_search` | Search users by name, display name, or email |
| `slack_conversations_unreads` | Prioritize conversations with unread messages |

### Act in the workspace — 4 write-path tools

| Tool | Purpose | MCP safety |
|---|---|---|
| `slack_send_message` | Send to a channel or DM | destructive |
| `slack_add_reaction` | Add an emoji reaction | destructive |
| `slack_remove_reaction` | Remove an emoji reaction | destructive |
| `slack_conversations_mark` | Mark a conversation read | destructive |

### Automate locally — 3 workflow tools

| Tool | Purpose |
|---|---|
| `slack_workflow_save` | Save a typed workflow profile to `~/.slack-mcp-workflows.json` |
| `slack_workflows` | List saved workflow profiles |
| `slack_catch_me_up` | Read a profile's channels since its cadence window and return structured catch-up evidence |

`slack_refresh_tokens` reads Slack and writes only local credential state.

</details>

---

## Typed workflows: Slack in, JSON out

Bind a workflow kind to channels, priority people, retention, and cadence. `slack_catch_me_up` then reads that scope locally and hands your agent the evidence: which threads went unanswered and for how long, what your priority people said or were pinned on, which conversations actually moved. It does the gathering; your agent writes the summary against the contract below.

There is no server-side model in that path, because there does not need to be one — the client calling this server is already a language model. Hosted adds what genuinely needs infrastructure: running the same catch-up on a schedule while your laptop is shut, on an OAuth token that does not rotate.

```bash
npx -y @jtalk22/slack-mcp --apply-template oncall-handoff --channels C012345,C067890
```

<details>
<summary><strong>Workflow contracts and shipped templates</strong></summary>
<br>

| Workflow kind | Contract |
|---|---|
| `incident_room` | `{incident_summary, timeline, open_risks, owner_gaps, next_actions}` |
| `exec_brief` | `{summary, decisions, risks, asks, action_items}` |
| `support_inbox` | `{open_threads, ack_lag, owner_gaps, escalations, next_actions}` |
| `product_launch_watch` | `{launch_signals, feedback_themes, blockers, metrics, next_actions}` |
| `custom` | `{summary, highlights, open_questions, next_actions}` |

Six editable templates ship in the package: `oncall-handoff`, `support-triage`, `exec-monday`, `sprint-tracker`, `customer-feedback`, and `incident-room`.

</details>

---

## Security and provenance

Every message this server returns becomes text in a model's context, next to your own instructions. Slack is a shared bus: a channel can hold Slack Connect participants from another workspace, guests, and apps relaying content from outside Slack entirely — and the same toolset that reads also writes. That adjacency is the risk worth naming.

- Credential files are owner-only; Keychain-only mode keeps plaintext credentials off disk.
- Configuration fails closed for unknown storage modes and invalid profiles.
- Writes are atomic and shared credential state is process-locked.
- The local web server binds to localhost; workspace write tools carry destructive annotations.
- Every release publishes from CI with npm provenance.

<p align="center">
  <img src="docs/images/diagram-trust-boundary.svg" width="900" alt="Four authors — you, a colleague, a Slack Connect participant and a relay app — each cross the server’s trust boundary on their own track and are stamped self, internal, external or bot. All four land in one model context beside your own instructions. On the way back out, strict mode holds a send and read-only never registers the write tool.">
</p>

<details>
<summary><strong>Author labels on every message</strong></summary>

Each message carries `origin` (`self`, `internal`, `external`, `bot`, `unknown`) and `author_trusted`, derived from fields Slack already returns, so it costs no extra API call. `bot` outranks workspace membership, because an app inside your workspace routinely relays words written outside it. A batch containing outside authors carries an `untrusted_content` envelope naming the count.

It fails closed: an author this server cannot positively place inside your workspace is reported untrusted. The exception is a conversation Slack reports as not shared with any other workspace — one of those structurally cannot hold an outside author, so a colleague with no team id on their message is called internal rather than unknown. When that lookup fails, the label stays unknown.

`SLACK_MCP_PROVENANCE=off|label|strict`. `label` is the default and only adds keys. A per-call `provenance` argument may tighten the mode and never loosen it, because a caller asking for fewer labels may be repeating something it read.

</details>

<details>
<summary><strong>What the labels cannot do</strong></summary>

A label is advice to the model reading it. It is unsigned, it can be stripped by anything downstream, and it raises the cost of an injected instruction without making one impossible.

`strict` mode additionally holds `slack_send_message` once the session has read outside-authored text. The hold is released by `confirm_untrusted_context`, which the caller sets — so it interrupts the send and puts it on the record, but it cannot prove a human approved it.

Two surfaces are still unlabelled, and knowing that is better than assuming otherwise: user display names, real names and titles from the user tools, and channel topics and purposes from `slack_list_conversations`, are attacker-settable free text that reaches the model without an origin stamp.

</details>

<details>
<summary><strong>Read-only mode, for when a label is not enough</strong></summary>

```bash
npx -y @jtalk22/slack-mcp --read-only          # or SLACK_MCP_READ_ONLY=1
```

The four write-path tools are withheld from `tools/list` *and* refused at dispatch, because a client can call a name it was never offered. The filter is applied after the tool profile resolves, so no profile or custom tool list widens it back. An absent tool needs no trust in the model that would have called it.

</details>

<details>
<summary><strong>The receipt</strong></summary>

`slack_session_report` returns what this process actually did: messages read, how many were outside-authored and by which origin, writes attempted, writes held. Counts only — no message text, no channel name, no user id. A label is a claim about one message; this is the claim about the session, and it is how you check afterwards whether outside text reached the model and whether anything tried to send on the back of it.

</details>

### Provenance: don't take my word for it

```bash
npm audit signatures
```

A clean result verifies that the package signatures and attestations trace back through the published release chain. Inspect the package before handing it a live Slack session. Full policy: [SECURITY.md](SECURITY.md).

---

## Built past the demo

The difficult part is not another chat tool. It is the operating layer underneath: browser-session extraction that names its failure stages, a credential lifecycle built for rotation, full-fidelity reads, guarded writes, and typed workflow output. The code is plain JavaScript in this repository—audit it before trusting it with a session.

<details>
<summary><strong>The engineering underneath — extraction, credential lifecycle, reads, guarded writes, typed output</strong></summary>
<br>

### 1. The browser-session engine

`--setup` turns the Slack identity Chrome already holds into a local MCP server:

- finds the newest `xoxc-` token in Chrome's on-disk LevelDB;
- snapshots the cookie SQLite database with its WAL sidecars;
- retrieves Chrome Safe Storage from the macOS Keychain;
- runs Chrome-compatible PBKDF2 + AES-128-CBC decryption locally;
- requires no DevTools, clipboard step, browser flag, or live Slack tab;
- names the failed extraction stage—`keychain_timeout`, `no_slack_cookie_row`, `cookie_decrypt_failed`, and more—instead of returning one opaque error.

### 2. Credential lifecycle, not credential paste

Session credentials rotate. The server is built around that reality:

- `auto`, `keychain-only`, and `file` storage backends;
- owner-only token files and a Keychain-only path with no plaintext credentials on disk;
- atomic file writes, verified Keychain migration, cross-process locks, and refresh mutexes;
- proactive health checks and automatic macOS refresh;
- last-known-good in-memory credentials when persistence is temporarily unavailable;
- isolated profiles for work and personal Slack;
- fail-closed handling for invalid storage or profile configuration.

### 3. Full-fidelity Slack reads

Read DMs and channels, search the workspace, export complete histories with threads, inspect unread state, and resolve users. Opt into blocks, attachments, files, reactions, metadata, and bot/app markers when text alone is not the real message.

### 4. The agent can finish the job

Send a reply, add or remove a reaction, and mark a conversation read. Every workspace write path carries an MCP destructive annotation so compatible clients can put approval where it belongs.

### 5. Slack in, typed JSON out

Save workflow profiles for incident rooms, executive briefs, support inboxes, launch watches, and custom operations. The OSS primitives are local JSON; the optional hosted brain renders them into contract-shaped briefs.

</details>

---

## Grid, credentials, and caching

**Enterprise Grid.** Grid runs aggressive session-anomaly detection. Browser-session automation can trip it, which flags the session and kills it, regardless of which tool drives the traffic. Outbound calls are paced by default to stay under burst thresholds (`SLACK_MCP_MIN_REQUEST_INTERVAL_MS`, default 350; `SLACK_MCP_MAX_CONCURRENCY`, default 3). Pacing lowers that risk; it does not remove it. On Grid, use the [hosted OAuth tier](https://mcp.revasserlabs.com) or Slack's official MCP instead.

**Credential extraction.** `--setup` reads the newest `xoxc-` token from Chrome's on-disk LevelDB, snapshots the cookie SQLite database, retrieves Chrome Safe Storage from the macOS Keychain, and runs PBKDF2 + AES-128-CBC decryption locally. It writes the token file, Keychain entries, and non-secret metadata. It transmits nothing — the server talks to Slack and nowhere else.

**This is the same access pattern credential stealers use.** Chrome App-Bound Encryption exists to make this class of read harder, and infostealer families (Lumma, Vidar, Meduza) bypass it to lift live sessions. The mechanism here is comparable. What differs is that you run it, on your own machine, against your own session, and nothing leaves the host. The source is plain JavaScript in this repository; audit it before handing it a live session.

**User cache.** One cache exists: user-name lookups, populated on demand, 500 entries maximum, one-hour TTL. No message content, no channel history, and no persistent copy of the workspace is stored.

---

## Where credentials live

Resolution is deterministic; first hit wins:

1. `SLACK_TOKEN` + `SLACK_COOKIE`
2. token file (`chmod 600`)
3. macOS Keychain
4. Chrome extraction on macOS

How long a session credential lasts is worth measuring rather than assuming. The two halves have different lifetimes — the `d` cookie is long-lived, the `xoxc` token is the volatile one — and this project previously quoted one or two weeks for both. On one real workspace a credential written on 2026-07-04 still authenticated on 2026-10-07, 94 days later. One credential is not a distribution, so treat that as an existence proof rather than a promise: yours may rotate sooner. `slack_token_status` reports the age of what you actually have. When Slack returns `invalid_auth`, `not_authed`, `token_expired`, `token_revoked`, `account_inactive`, or HTTP 401, run `npx -y @jtalk22/slack-mcp --setup` to recover locally. On macOS, `slack_refresh_tokens` or `--refresh-tokens` refreshes without leaving the client; the optional LaunchAgent in [docs/SETUP.md](docs/SETUP.md) keeps long-idle installations healthy.

<details>
<summary><strong>Storage modes and multi-workspace profiles</strong></summary>
<br>

| Mode | Behavior |
|---|---|
| `auto` | Token file plus Keychain backup |
| `keychain-only` | Keychain only; verified writes and no plaintext credential file |
| `file` | Owner-only token file; Keychain is never touched |

The selected backend is remembered in non-secret metadata and used by the server, CLI, and optional refresh job. An unrecognized mode fails at startup instead of silently downgrading storage.

```json
{
  "mcpServers": {
    "slack-work": {
      "command": "npx",
      "args": ["-y", "@jtalk22/slack-mcp"],
      "env": { "SLACK_MCP_PROFILE": "work" }
    },
    "slack-personal": {
      "command": "npx",
      "args": ["-y", "@jtalk22/slack-mcp"],
      "env": { "SLACK_MCP_PROFILE": "personal" }
    }
  }
}
```

Each profile gets its own token file, Keychain entries, metadata, and lock. Add `SLACK_MCP_CHROME_PROFILE` when the workspaces live in different Chrome profiles.

</details>

---

## Free local when you’re driving. Hosted when it must drive itself.

The local package puts Slack in your agent's context: read, search, follow threads, and act from your desktop. Hosted keeps the recurring brief arriving when your laptop is closed:

- managed Slack OAuth;
- scheduled catch-up in your timezone;
- contract-validated workflow briefs;
- shared workflow profiles;
- signed webhook delivery.

Local mode runs on your machine and talks only to Slack. The hosted OAuth connection supports unattended schedules and Enterprise Grid. The local package is MIT-licensed and works independently of hosted.

[See live hosted pricing →](https://mcp.revasserlabs.com/pricing)

---

## Documentation

[Setup](docs/SETUP.md) · [API](docs/API.md) · [Architecture](docs/ARCHITECTURE.md) · [Compatibility](docs/COMPATIBILITY.md) · [Deployment modes](docs/DEPLOYMENT-MODES.md) · [Recipes](docs/USE_CASE_RECIPES.md) · [Troubleshooting](docs/TROUBLESHOOTING.md) · [Roadmap](docs/ROADMAP.md)

## Contributing

PRs are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) and run `node --check` on touched JavaScript before submitting.

## License

MIT — see [LICENSE](LICENSE).

## Disclaimer

Not affiliated with Slack Technologies, Inc. This server uses browser-session credentials. Review your workspace's acceptable-use policy before running it.

---

<div align="center">

### Your Slack. Your agent. One command.

```bash
npx -y @jtalk22/slack-mcp --setup
```

If this removes a Slack tab from your day, [star the repository](https://github.com/jtalk22/slack-mcp-server). Stars are how the next admin-blocked developer finds the local path.

</div>
