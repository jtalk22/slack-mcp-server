# Launch Posts — v4.1.0

## Show HN

**Title:** Show HN: Slack MCP that auto-extracts tokens from Chrome's encrypted cookie DB

**Body:**

Hey HN,

I maintain an MCP server for Slack — the session-based kind that uses your existing browser credentials instead of registering an OAuth app.

The core problem with every session-based Slack tool: the `d` cookie is HttpOnly. Always has been. That means `document.cookie` can't touch it. Every other tool (including some popular MCP servers with 9K+ users) tells you to open DevTools, navigate to Application > Cookies, manually copy the value, and paste it into a config file. Every time it expires, you do it again.

We read Chrome's encrypted cookie database directly instead. One command:

    npx -y @jtalk22/slack-mcp --setup

What happens: the setup wizard queries Chrome's SQLite cookie store, pulls the encryption key from macOS Keychain (`Chrome Safe Storage`), decrypts with PBKDF2 + AES-128-CBC, and extracts both the session cookie and API token. No DevTools, no copy-paste, no manual steps. Tokens persist to a local file (chmod 600) and macOS Keychain. When they age out, the server refreshes automatically from Chrome — you never touch it again.

16 tools: search, threads, DMs, reactions, unread triage, full conversation export (up to 10K messages with recursive thread fetching), user search. 12 read-only, 4 write-path with MCP safety annotations.

Works with Claude Code, Claude Desktop, Cursor, Copilot, Codex CLI, Gemini CLI, and Windsurf. Slack's official MCP server requires OAuth app registration + admin approval and only supports Streamable HTTP — no stdio, which means it doesn't work with most local-first AI clients.

Trade-off: session tokens give full account access. Same access your browser has. For personal use and small teams, it's the difference between 30 seconds of setup and 30 minutes of OAuth/admin bureaucracy.

Technical details:
- Pure Node.js, two runtime dependencies (@modelcontextprotocol/sdk + Express)
- 4-layer token persistence: env vars > file > macOS Keychain > Chrome auto-extraction
- Atomic file writes, mutex locking, LRU user cache
- MIT licensed

GitHub: https://github.com/jtalk22/slack-mcp-server
npm: https://www.npmjs.com/package/@jtalk22/slack-mcp

---

## r/ClaudeAI

**Title:** Slack in Claude Code without any bot install — auto-extracts tokens from Chrome, 16 tools, one command

**Body:**

Built an MCP server that lets Claude read and write to Slack using your existing browser session. No OAuth app, no admin approval, no token copy-pasting.

The setup:
```
npx -y @jtalk22/slack-mcp --setup
```

It reads Chrome's encrypted cookie database directly (the session cookie is HttpOnly — JavaScript can't access it, so we decrypt it from Chrome's SQLite store using your Keychain). 30 seconds, fully automatic on macOS.

16 tools: search messages, read threads, list channels/DMs, send messages, add reactions, export full conversations (up to 10K messages), unread triage, user lookup.

The "catch me up" workflow is the one I use daily — ask Claude "what did I miss overnight in #engineering?" and it checks your unreads, pulls the important threads, and gives you a summary. I haven't opened Slack first thing in the morning since I built this.

Also works with Cursor, Copilot, Codex CLI, Gemini CLI, and Windsurf.

GitHub: https://github.com/jtalk22/slack-mcp-server

Open source, MIT licensed.

---

## r/selfhosted

**Title:** Self-hosted Slack MCP — AI reads your Slack without any cloud dependency or admin approval

**Body:**

Built a self-hosted MCP server that connects AI assistants to Slack. Uses your browser session instead of OAuth, so there's zero cloud dependency.

What makes it different from other Slack MCP tools: it reads Chrome's encrypted cookie database directly on macOS. The Slack session cookie is HttpOnly (JavaScript can't read it), so we query Chrome's SQLite store, pull the encryption key from Keychain, and decrypt locally. No tokens leave your machine, no third-party server ever sees them.

```
npx -y @jtalk22/slack-mcp --setup
# or
docker pull ghcr.io/jtalk22/slack-mcp-server:latest
```

Token persistence: env vars, JSON file (chmod 600), or macOS Keychain. Auto-refresh from Chrome when tokens age out. No cloud, no phone-home, no telemetry.

16 tools. MIT licensed.

GitHub: https://github.com/jtalk22/slack-mcp-server

---

## Messaging Notes

**Do say:**
- "Auto-extracts tokens from Chrome's encrypted cookie database"
- "Session-token transport — no admin approval, no app install, no audit trail"
- "The `d` cookie is HttpOnly by design — we decrypt it from Chrome's SQLite store"
- "One command. 30 seconds. Works with Claude Code, Cursor, Codex, Gemini."

**Don't say:**
- "We fixed what Slack broke" (the cookie was always HttpOnly)
- "Unofficial" (say "independent" or nothing)
- "Hack" or "exploit" (it's standard cookie store access, same as any password manager)
- "Steals" or "captures" (it reads your own authenticated session)

**Tone:** Technical, understated, engineer-to-engineer.

---
---

# Launch Posts — v4.1.2

## Show HN

**Title:** Show HN: Slack MCP — reads session tokens from Chrome's LevelDB directly, no live Slack tab required

**Body:**

A user reported a stale-token failure: `slack_token_status` said "refreshed 14 minutes ago", but every tool call returned `token_auth_failed`. Tracing it revealed three things — each a structural fix in v4.1.2.

**1. LevelDB extraction.** The previous extraction path used AppleScript to read tokens from a live Slack tab. This required (a) a Slack tab open in Chrome, (b) the `Allow JavaScript from Apple Events` flag enabled in Chrome's Developer menu, (c) macOS, (d) no AppleScript permission dialog pending. When any of those four were false, the refresh loop ran and returned a cached token that was already invalidated. The fix reads tokens directly from Chrome's LevelDB store (`{Profile}/Local Storage/leveldb/*.{ldb,log}`) in pure Node.js. No tab, no flag, no dialog. AppleScript is now a fallback for cases where LevelDB is locked.

**2. Multi-profile enumeration.** Machines with multiple Chrome profiles (work + personal) hit the wrong profile about half the time. Fix walks `Local State` → `profile.info_cache`, ranks profiles by Cookies file mtime, picks the freshest. Three env vars for explicit override:

    SLACK_MCP_CHROME_USER_DATA_DIR
    SLACK_MCP_CHROME_PROFILE
    SLACK_MCP_EXTRACTION_MODE

**3. Zombie shutdown handlers.** The background timer used `unref()` so Node would exit when the event loop was empty. `StdioServerTransport` kept the event loop alive. Exit never happened. Accumulated 53 orphaned Node processes across one machine, oldest running 2+ days. Fix registers explicit handlers for SIGTERM, SIGINT, SIGHUP, stdin EOF, and stdin error — all call `process.exit(0)` and the process dies within milliseconds.

Hosted exists for teams that want the MCP endpoint + OAuth 2.1 bridge for Claude.ai web + encrypted credential storage without running the Node process themselves. It does not eliminate the Chrome dependency — the user still pastes `xoxc-`/`xoxd-` from DevTools Console at setup time, same as a self-host operator would. What hosted does own structurally: the managed endpoint, the Claude.ai web path (stdio transport can't satisfy Anthropic's HTTP contract), and the structural absence of the zombie-process class (Cloudflare Workers are stateless per-request isolates — the `unref()` race cannot exist by construction). Token acquisition is still user-side on both paths. That's honest.

Technical:
- Pure Node.js, two runtime dependencies
- 4-layer token persistence: env vars > file > macOS Keychain > Chrome auto-extraction
- Atomic file writes, mutex locking, structured error codes
- MIT licensed

GitHub: https://github.com/jtalk22/slack-mcp-server
npm: https://www.npmjs.com/package/@jtalk22/slack-mcp
Release notes: https://github.com/jtalk22/slack-mcp-server/blob/main/docs/RELEASE-NOTES-v4.1.2.md
Hosted tiers: https://mcp.revasserlabs.com/releases

---

## r/ClaudeAI

**Title:** Claude Code users on macOS hit this stale-token failure mode — here's why and what v4.1.2 changes

**Body:**

If you're running `@jtalk22/slack-mcp` with Claude Code or Claude Desktop and `slack_token_status` reports "refreshed N minutes ago" but every tool call returns `token_auth_failed`, you've hit the bug class v4.1.2 fixes.

What was happening: the refresh loop was calling an AppleScript path that required a live Slack tab in Chrome and the `Allow JavaScript from Apple Events` Developer flag. Neither is guaranteed. When the AppleScript call succeeded (because the function returned without error), it wrote "refreshed N minutes ago" — even when the tokens it produced were cached from a stale read. `last_attempt_at` got updated. Ground truth didn't.

v4.1.2 replaces that path with direct LevelDB extraction from Chrome's Local Storage. No Slack tab, no Developer flag, no AppleScript. The server reads `{Profile}/Local Storage/leveldb/*.{ldb,log}` in pure Node and pulls the `xoxc-` token out directly. AppleScript is now a fallback for the rare case where LevelDB is locked by an active Chrome process.

Two other fixes landed the same release:

- Multi-profile enumeration: if you run both work and personal Chrome profiles, the server now picks the freshest automatically. Override with `SLACK_MCP_CHROME_USER_DATA_DIR`, `SLACK_MCP_CHROME_PROFILE`, and `SLACK_MCP_EXTRACTION_MODE`.
- Shutdown handler: previously the server leaked Node processes on Claude Code restart because `unref()` didn't actually cause exit (stdio transport kept the loop alive). Fixed — SIGTERM/SIGINT/SIGHUP/stdin EOF all exit the process within ms.

If you're on Claude.ai web (the browser app, not Claude Code), the stdio transport that `@jtalk22/slack-mcp` uses can't connect at all — Anthropic's MCP Directory only speaks HTTP. That's what `mcp.revasserlabs.com` exists for. Self-host is free and stays free for everyone running a local MCP client.

Upgrade: `npm install -g @jtalk22/slack-mcp@latest` or rerun `npx -y @jtalk22/slack-mcp --setup`.

GitHub: https://github.com/jtalk22/slack-mcp-server
Release notes: https://github.com/jtalk22/slack-mcp-server/blob/main/docs/RELEASE-NOTES-v4.1.2.md

---

## r/selfhosted

**Title:** Slack MCP v4.1.2 — LevelDB token extraction, multi-profile support, zero zombies

**Body:**

Self-hosted MCP server for Slack. Uses browser session credentials (xoxc cookie + xoxd API token) instead of OAuth — no app registration, no admin approval, no cloud dependency.

v4.1.2 ships three structural fixes worth knowing about if you're running this:

**1. LevelDB token extraction.** Previous extraction used AppleScript against a live Slack tab, which required the `Allow JavaScript from Apple Events` flag in Chrome's Developer menu and a tab open at the time of refresh. v4.1.2 reads tokens directly from Chrome's LevelDB store (`~/Library/Application Support/Google/Chrome/{Profile}/Local Storage/leveldb/*.{ldb,log}`) in pure Node. No AppleScript, no tab, no flag. AppleScript is now fallback for cases where LevelDB is locked.

**2. Multi-profile enumeration.** If you have multiple Chrome profiles (work + personal), the server now walks `Local State` → `profile.info_cache`, ranks by Cookies file mtime, and picks the freshest. Three env vars for explicit override:

    SLACK_MCP_CHROME_USER_DATA_DIR   # path to Chrome user data dir
    SLACK_MCP_CHROME_PROFILE         # folder name, e.g. "Profile 1"
    SLACK_MCP_EXTRACTION_MODE        # leveldb | applescript | auto

**3. Explicit shutdown handlers.** Previous releases leaked Node processes because `unref()` was the documented exit path but `StdioServerTransport` kept the event loop open. Accumulated 53 orphaned processes across one machine, oldest 2+ days. Fix registers handlers for SIGTERM, SIGINT, SIGHUP, stdin EOF, and stdin error — each calls `process.exit(0)` synchronously.

Install:
```
npx -y @jtalk22/slack-mcp --setup
# or
docker pull ghcr.io/jtalk22/slack-mcp-server:latest
```

16 tools: search, threads, DMs, reactions, unreads, full conversation export (up to 10K messages with recursive thread fetching). Works with Claude Code, Claude Desktop, Cursor, Copilot, Codex CLI, Gemini CLI, Windsurf.

4-layer token persistence: env vars > file (chmod 600) > macOS Keychain > Chrome auto-extraction. No cloud, no phone-home, no telemetry. MIT licensed.

GitHub: https://github.com/jtalk22/slack-mcp-server
Release notes: https://github.com/jtalk22/slack-mcp-server/blob/main/docs/RELEASE-NOTES-v4.1.2.md

---

## Messaging Notes — v4.1.2

**Do say:**
- "LevelDB extraction — no Slack tab, no AppleScript flag, no platform restriction"
- "Multi-profile enumeration — freshest Chrome profile wins automatically"
- "Zero zombie processes — SIGTERM/SIGINT/SIGHUP/stdin EOF all exit within ms"
- "Token acquisition is user-side on both self-host and hosted — Chrome dependency is identical"

**Don't say:**
- "Hosted eliminates the browser dependency" (it doesn't — setup still pastes from DevTools Console)
- "Token rotation runs server-side on hosted" (doesn't exist — v4.1.3 territory)
- "We solved an axiom" (the axiom is inline in release notes for readers who click through; it is not the HN lede)
- "Silent stale token bug" (name the fix, not the apology)

**Tone:** Technical, understated, engineer-to-engineer. Same voice as v4.1.0.
