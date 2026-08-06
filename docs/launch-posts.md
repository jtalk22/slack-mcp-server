# Slack MCP v4.6.2 — launch and distribution kit

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

`21 tools` is the current inventory, not the category. Say **“21 tools today”** when the count matters. The durable promise is that Slack becomes usable operating context and approved action for an agent.

---

## Show HN

**Title:** Show HN: Give a local AI agent your Slack context without registering an app

**Body:**

It’s Monday, 9:07 AM. You ask: “What blew up overnight?”

The useful answer is not a generic summary. It is: the P1 started at 02:14, Kai owned it, it resolved at 03:47, step 4 in the runbook is still wrong, and your CTO is also waiting for the printer PIN someone buried in `#facilities` five months ago.

I built an open-source Slack MCP server for that workflow:

```bash
npx -y @jtalk22/slack-mcp --setup
```

The local path uses the Slack identity Chrome already has, so there is no Slack app to register, no OAuth scope review, and no admin queue. It ships 21 tools today: DMs, channels, unread inventory, search, full histories and threads, users, rich message fields, exports, replies, reactions, read-state changes, and typed workflow profiles.

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

**Title:** Slack for local AI agents — no app registration, Keychain-only storage, 21 tools today

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

The current local surface is 21 tools. The count will change. The job does not: turn Slack into context, decisions, and approved action without making someone live in Slack.

The new 42-second cut starts where work actually starts: Monday, 9:07 AM, a database outage, a lying runbook, and a printer PIN that has been waiting in `#facilities` for five months.

Watch: https://jtalk22.github.io/slack-mcp-server/public/demo-video.html

GitHub: https://github.com/jtalk22/slack-mcp-server

Hosted: https://mcp.revasserlabs.com

---

## Short post / X / Bluesky

It’s Monday, 9:07 AM.

A database fell over. The runbook lied. The printer PIN has been sitting in `#facilities` for five months.

Slack MCP turns that mess into a brief with receipts, then closes only the loops you approve.

Local: no Slack app/admin queue.

Hosted: permanent OAuth + indexing + schedules.

21 tools today. One command.

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
- “The current local surface ships 21 tools today.”
- “Local gives control now; hosted gives unattended continuity.”
- “Hosted adds permanent OAuth, indexing, scheduled intelligence, shared profiles, and managed workspaces.”
- “Session credentials carry the same effective access as the signed-in browser user.”
- “Check your workspace acceptable-use policy.”

**Do not say:**

- “20k+ downloads” before the public count reaches it.
- “Invisible to admins” or “no audit trail.”
- “Steals,” “captures,” “hack,” or “exploit.”
- “Unlimited” without the live fair-use qualifier.
- “Hosted fixes token refresh.” Hosted replaces browser-session rotation with permanent OAuth; that distinction matters.
- “Any MCP client” in a business headline. Name the job first; keep `stdio` in the compatibility proof.

**Voice:**

Technically exact, dryly human, founder-built. One nerd joke is memorable. Five become copywriting.
