# Slack MCP — launch and distribution kit

## 5.1.0 — the splash, in posting order

Recheck live numbers before posting: `npm view @jtalk22/slack-mcp version` must say 5.1.0, and the weekly download badge is the figure to quote. Post in this order on the same morning, Tuesday to Thursday, 9–10 AM US Eastern: the GitHub release, then Hacker News, then X with the hero GIF, then LinkedIn. Reddit the next morning. The awesome-list pull request any day.

### Hacker News (Show HN)

**Title (78 characters):** Show HN: Slack MCP – an agent reads your Slack via your browser session, no app

**Body:**

I built this because Slack's own AI search needs a Business+ plan, and a free or Pro workspace gets none of it. This is an MCP server that gives Claude Code, Cursor or any stdio client your Slack — unreads, threads, search, catch-up — through the session you already have in Chrome. No Slack app, no bot token, no admin approval. It runs locally and talks to Slack and nowhere else.

5.1.0 is out today. What changed, measured on a real workspace:

- The catch-up could not see mentions or thread replies. It filtered on `unread_count_display` from `conversations.list`, which is zero the moment a channel has been opened. Before: 0 conversations reported while 10 mentions waited. It now also reads `client.counts`, the endpoint Slack's own web client uses for its sidebar badges. After: 7 conversations, 10 mentions.
- Every message now says who wrote it: self, internal, external (Slack Connect), bot, or unknown. Building it found that Slack omits `team` for authors inside your own workspace, so a naive classifier calls half your colleagues unknown. A conversation Slack reports as not shared cannot hold an outside author, so those are internal. On a 20-message channel: 11 unknown before, 0 after.
- `--read-only`: the four write tools are not registered, and refused if a client calls one anyway. The one guarantee that does not depend on the model behaving.
- `--doctor --security`: six checks of your own setup, each with the command that tightens it.
- Commitments, owner gaps and open questions from the catch-up, each row with the text that matched and a permalink. The rules are shallow and the output says so.
- A published prompt-injection corpus — bidi overrides, zero-width splits, tool-call mimicry, bot relays — so other MCP authors can test their servers.

Limits, stated plainly: `client.counts` is undocumented and can change without notice. A provenance label is advice to the model, not a control. The credential is your Chrome session, decrypted on your Mac with Chrome's Safe Storage key from your Keychain — the same read infostealers do, except you run it and nothing leaves the host. The source is plain JavaScript; audit it before handing it a session.

    npx -y @jtalk22/slack-mcp --setup

https://github.com/jtalk22/slack-mcp-server

**First comment, posted right after:** The thing I expect to be asked about: yes, this is session-cookie automation, and Enterprise Grid's anomaly detection can flag it. Requests are paced to stay under burst thresholds, and on Grid I say use the official Slack MCP or the hosted OAuth route instead. The README says so in the same words.

### X — a thread of six, the hero GIF on the first

1. It's Tuesday, 9:07 AM. A jammed printer. Nobody knows the PIN. The guy who did left five months ago. Your agent finds it in one Slack search — signed in as you, no Slack app, no admin queue. slack-mcp 5.1 is out. 🧵

2. The catch-up could not see mentions. It read conversations.list, which reports zero unread the moment a channel has been opened. Measured: 0 conversations while 10 mentions waited. 5.1 reads the endpoint Slack's own sidebar badges use. After: 7 conversations, 10 mentions.

3. Every message now says who wrote it: self, internal, external, bot. Slack Connect text and relay bots reach your model labelled, not removed. Found on the way: Slack omits `team` for your own colleagues, so a naive classifier calls half of them unknown. 11 → 0.

4. --read-only. The write tools are never registered, and refused if called. The one guarantee that does not depend on the model behaving. --doctor --security runs six checks of your own setup, each with the command that tightens it.

5. Slack's own AI search is a Business+ feature, about $1,500 a year for ten people. A free workspace gets none of it. This runs on the model subscription you already pay for, and installs no Slack app, so it uses none of a free plan's ten app slots.

6. npx -y @jtalk22/slack-mcp --setup · MIT · 20+ tools · signed releases · github.com/jtalk22/slack-mcp-server

### LinkedIn

slack-mcp 5.1.0 is out. It gives an AI agent — Claude Code, Cursor, any MCP client — your Slack through the browser session you already have: unreads, threads, search, catch-up. No Slack app, no bot token, no admin approval.

Why it exists: Slack's own AI search needs a Business+ plan. A free or Pro workspace gets none of it. This runs locally, on the model subscription you already pay for.

What 5.1 fixes, measured on a real workspace: the catch-up could not see mentions or thread replies — 0 reported while 10 waited; now 7 conversations and 10 mentions. Every message now says who wrote it, so text from outside your workspace reaches the model labelled. A read-only mode removes the write tools entirely. A security doctor checks your own setup and prints the command that tightens each warning.

It is MIT, the releases are signed, and the limits are written down in SECURITY.md.

npx -y @jtalk22/slack-mcp --setup
github.com/jtalk22/slack-mcp-server

### Reddit — r/ClaudeAI, then r/mcp

**Title:** Slack MCP server that needs no Slack app — 5.1 adds mention-aware catch-up, author labels on every message, and a read-only mode

**Body:** the Hacker News body, with the first line changed to "I built this because Slack's own AI search needs a Business+ plan, and the Claude Code I already pay for can do the job."

### awesome-mcp-servers — the one line for the pull request

- [jtalk22/slack-mcp-server](https://github.com/jtalk22/slack-mcp-server) 📇 🍎 🏠 - Slack through your own browser session: unreads, threads, search, catch-up and guarded writes, with no Slack app or admin approval. Every message labelled by author; a read-only mode.

### The GitHub social card

`docs/images/social-preview-v4.png` is the hero's hook frame at GitHub's card size, 1280 × 640. Upload it once at Settings → General → Social preview; every link to the repository on X, LinkedIn, Slack and HN then shows it.

---

This is a copy bank, not canonical product documentation. Recheck live pricing, version, and download numbers immediately before publishing.

## The positioning in one sentence

Slack’s operating layer for AI agents: ask what happened, get the receipts, and close the approved loop—locally through the browser session you already have or hosted through permanent OAuth.

## The audience split

| Audience | Lead with | Do not lead with |
|---|---|---|
| Developers blocked by app governance | One command, no Slack app/admin queue, real local tool surface | Hosted pricing |
| Security-conscious self-hosters | Local credentials, Keychain-only mode, readable implementation, provenance | “AI brain” language |
| Engineering and operations leads | Incident reconstruction, unread triage, owners, risks, decisions, approved actions | Protocol transport |
| Support, product, and executive teams | Typed workflows, indexing, schedules, shared profiles, continuity | A fixed tool count |
| Business buyers | Slack as operating memory; permanent OAuth; unattended workflows | `stdio` |

`20 tools` is the current inventory, not the category. Say **“20 tools today”** when the count matters. The durable promise is that Slack becomes usable operating context and approved action for an agent.

---

## Show HN

**Title:** Show HN: Give a local AI agent your Slack context without registering an app

**Body:**

It’s Tuesday, 9:07 AM. You ask: “What blew up overnight?”

The useful answer is not a generic summary. It is: the P1 started at 02:14, Kai owned it, it resolved at 03:47, step 4 in the runbook is still wrong, and your CTO is also waiting for the printer PIN someone buried in `#facilities` five months ago.

I built an open-source Slack MCP server for that workflow:

```bash
npx -y @jtalk22/slack-mcp --setup
```

The local path uses the Slack identity Chrome already has, so there is no Slack app to register, no OAuth scope review, and no admin queue. It ships 20 tools today: DMs, channels, unread inventory, search, full histories and threads, users, rich message fields, exports, replies, reactions, read-state changes, and typed workflow profiles.

The part I spent most of the time on is underneath the demo:

- newest-token extraction from Chrome LevelDB;
- cookie SQLite snapshots with WAL sidecars;
- Chrome Safe Storage through macOS Keychain;
- PBKDF2 + AES-128-CBC decryption locally;
- Keychain-only storage, atomic writes, and cross-process locks;
- token health, automatic refresh, structured failure codes, and isolated workspace profiles;
- destructive MCP annotations on every workspace write path;
- npm provenance so the published package traces to the repository commit and CI run.

The honest trade-off: browser-session credentials rotate. Local is best when a person is driving the workflow and wants control now. The optional hosted path uses permanent OAuth and adds indexing, AI retrieval/triage, scheduled briefs, shared profiles, and managed continuity for work that must run unattended. The open-source package is complete; hosted sells continuity and intelligence, not ordinary Slack access.

The proof reel is intentionally less corporate than that paragraph: a database outage, a runbook with a creative relationship to truth, and a five-month printer mystery—all through the shipped tool names.

GitHub: https://github.com/jtalk22/slack-mcp-server

npm: https://www.npmjs.com/package/@jtalk22/slack-mcp

42-second proof: https://jtalk22.github.io/slack-mcp-server/public/demo-video.html

---

## r/selfhosted

**Title:** Slack for local AI agents — no app registration, Keychain-only storage, 20 tools today

**Body:**

I built a local-first MCP server that turns the Slack session already in Chrome into agent-readable context and approved actions.

```bash
npx -y @jtalk22/slack-mcp --setup
```

No Slack app registration or admin approval on the local path. The server can search messages, read DMs/channels/full threads, inventory unreads, recover rich attachment-only alerts, export histories, look up users, reply, react, mark handled conversations read, and save typed workflow profiles.

Credential handling is local and auditable: Chrome LevelDB + cookie SQLite/WAL → macOS Keychain → PBKDF2/AES decryption. Storage can be Keychain-only, file-only, or automatic. Writes are atomic, shared state is process-locked, refresh is mutexed, and extraction failures identify the actual failed stage.

The browser-session trade-off is real: Slack rotates those credentials. The server monitors health and refreshes automatically on macOS, but a long-running unattended workflow is better served by the optional hosted permanent-OAuth path. Local stays MIT-licensed and complete.

Works with Claude Code/Desktop, Cursor, Copilot, Windsurf, Gemini CLI, Codex CLI, and other stdio MCP clients. Also ships Docker and self-hosted HTTP modes.

GitHub: https://github.com/jtalk22/slack-mcp-server

Setup: https://github.com/jtalk22/slack-mcp-server/blob/main/docs/SETUP.md

---

## Business / LinkedIn founder post

Most companies do not need another Slack bot. They need Slack to stop being an interruption stream and start behaving like operating memory.

That means an agent should be able to answer:

- What actually happened overnight?
- Who owns the open risk?
- What did we decide, and where is the receipt?
- Which support threads are unowned?
- What changed in the launch channels?
- Which approved loop can I close now?

Slack MCP now handles that as a real operating layer. The free open-source path gives a developer or solo operator control immediately through the Slack session already in Chrome—no app-registration project and no admin queue. The hosted path exists for the business case: permanent OAuth, indexed retrieval, scheduled incident/support/exec briefs, shared workflow profiles, and continuity across workspaces.

The current local surface is 20 tools. The count will change. The job does not: turn Slack into context, decisions, and approved action without making someone live in Slack.

The new 42-second cut starts where work actually starts: Tuesday, 9:07 AM, a database outage, a lying runbook, and a printer PIN that has been waiting in `#facilities` for five months.

Watch: https://jtalk22.github.io/slack-mcp-server/public/demo-video.html

GitHub: https://github.com/jtalk22/slack-mcp-server

Hosted: https://mcp.revasserlabs.com

---

## Short post / X / Bluesky

It’s Tuesday, 9:07 AM.

A database fell over. The runbook lied. The printer PIN has been sitting in `#facilities` for five months.

Slack MCP turns that mess into a brief with receipts, then closes only the loops you approve.

Local: no Slack app/admin queue.

Hosted: permanent OAuth + indexing + schedules.

20 tools today. One command.

`npx -y @jtalk22/slack-mcp --setup`

https://github.com/jtalk22/slack-mcp-server

---

## Dated traction option

Use this only in a founder-progress post, not as evergreen hero copy:

> As of August 5, 2026: 17,908 npm downloads since January 3. GitHub’s private traffic view shows 1,011 clones from 224 unique cloners in the last 14 days.

Why: npm downloads are publicly queryable and belong in the dynamic README/site proof. GitHub clone traffic is strong founder evidence but private, volatile, and not independently reproducible by a reader.

Do not publish “20k+ downloads” until the public npm API crosses 20,000.

---

## Messaging guardrails

**Say:**

- “Slack’s operating layer for AI agents.”
- “Ask what happened. Get receipts. Close the loop.”
- “No Slack app or admin queue on the local path.”
- “The current local surface ships 20 tools today.”
- “Local gives control now; hosted gives unattended continuity.”
- “Hosted adds permanent OAuth, indexing, scheduled intelligence, shared profiles, and managed workspaces.”
- “Session credentials carry the same effective access as the signed-in browser user.”
- “Check your workspace acceptable-use policy.”

**Do not say:**

- “20k+ downloads” before the public count reaches it.
- Any claim that the local path is unseen by a workspace or leaves no record. It calls Slack as the
  signed-in user with that user’s own session, so a workspace sees the same API activity it would see
  from any client signed in as that person. `check-public-language.sh` blocks the three usual phrasings
  by pattern, which is why they are described here rather than quoted.
- **“Stealth” is allowed and is the right word** for what is true: no app to install, no bot identity,
  nothing in the workspace app directory, no admin queue. Say that; never say unseen.
- “Steals,” “captures,” “hack,” or “exploit.”
- “Unlimited” without the live fair-use qualifier.
- “Hosted fixes token refresh.” Hosted replaces browser-session rotation with permanent OAuth; that distinction matters.
- “Any MCP client” in a business headline. Name the job first; keep `stdio` in the compatibility proof.

**Voice:**

Technically exact, dryly human, founder-built. One nerd joke is memorable. Five become copywriting.
