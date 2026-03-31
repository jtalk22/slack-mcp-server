# Launch Posts

## Show HN

**Title:** Show HN: I rebuilt Slack's MCP server because theirs doesn't work with Claude Code

**Body:**

Hey HN,

Slack shipped an official MCP server, but it requires OAuth app registration, admin approval, and is broken with Claude Code and GitHub Copilot due to an OAuth/DCR incompatibility. I built an alternative that uses your browser session instead — one command, zero config, works with every MCP client.

    npx -y @jtalk22/slack-mcp --setup

On Mac, it auto-extracts tokens from Chrome (no DevTools needed). On other platforms, a Console one-liner copies both tokens to clipboard in one paste.

**What you can do with it:**

- "What did I miss overnight?" — triages 47 unreads across channels and DMs
- "Find the printer admin PIN that IT shared 5 months ago" — searches your entire workspace history
- "Reply to the incidents thread with a fix update" — reads context, composes a reply
- "Export #architecture-decisions with all threads" — full JSON export for post-mortems

16 tools total. Read-only by default, write actions require confirmation.

**The demo tells a story:** A developer handles their entire Monday morning Slack — from 47 unreads to inbox zero — without opening Slack once. The printer PIN that nobody could find? It was in #facilities from 5 months ago with zero reactions. Nobody read it. Until now. https://jtalk22.github.io/slack-mcp-server/public/demo-claude.html

**Works with:** Claude Desktop, Claude Code, Cursor, GitHub Copilot, Gemini CLI, Windsurf — config snippets for each in the README.

**The trust tradeoff:** Session tokens = full account access, same as your browser. Fine for personal use (you're already trusting these tools with your codebase). For teams, there's a managed Cloud version with audit logs.

**Technical stack:** Node.js, zero heavy dependencies, 4-layer token persistence (env → file → macOS Keychain → Chrome auto-extraction), atomic writes, mutex locking, stdio + HTTP transports. MIT licensed.

| | Slack Official | This Server |
|---|---|---|
| OAuth required | Yes | No |
| Admin approval | Yes | No |
| Works with Claude Code | No | Yes |
| Works with Copilot | No | Yes |
| Setup time | ~30 min | ~2 min |
| Tools | Limited | 16 |

GitHub: https://github.com/jtalk22/slack-mcp-server
npm: https://www.npmjs.com/package/@jtalk22/slack-mcp
Interactive demo: https://jtalk22.github.io/slack-mcp-server/public/demo-claude.html

---

## r/ClaudeAI

**Title:** I built a Slack MCP server that actually works with Claude Code (Slack's official one doesn't)

**Body:**

Slack's official MCP server uses OAuth, which is fundamentally broken with Claude Code due to the OAuth/DCR handshake issue. If you've tried to set it up, you know the pain.

I built an alternative that uses your browser session tokens instead. One command:

```
npx -y @jtalk22/slack-mcp --setup
```

It walks you through extracting your session cookie from Chrome, then gives you 16 tools: search, threads, DMs, reactions, message sending, full conversation export, user lookup.

Works with Claude Desktop, Claude Code, Cursor, Copilot, Gemini CLI, and Windsurf.

The "catch me up" workflow is the killer feature — ask Claude "what did I miss overnight?" and it checks your unreads, pulls the important channels, and gives you a summary. I haven't opened Slack first thing in the morning in weeks.

Interactive demo: https://jtalk22.github.io/slack-mcp-server/public/demo-claude.html

GitHub: https://github.com/jtalk22/slack-mcp-server

Open source, MIT licensed, self-hosted. There's also a managed Cloud option if you want it hosted.

---

## r/selfhosted

**Title:** Self-hosted Slack MCP server — let AI assistants search and read your Slack without OAuth or cloud dependency

**Body:**

Built a self-hosted MCP server that connects AI assistants (Claude, Cursor, etc.) to your Slack workspace. Uses browser session tokens instead of OAuth, so there's zero cloud dependency and no admin approval needed.

**Why self-hosted matters here:** Your Slack session tokens stay on your machine. No third-party server ever sees them. Token persistence is local: env vars, a JSON file in your home directory, or macOS Keychain.

```
npx -y @jtalk22/slack-mcp --setup
# or
docker pull ghcr.io/jtalk22/slack-mcp-server:latest
```

**What it does:** 16 tools — search messages, read threads, list channels, send messages, add reactions, export full conversations with threads, user lookup. All via the MCP protocol over stdio.

**Stack:** Node.js, zero heavy dependencies, works on any machine with Node 20+. Docker image available. MIT licensed.

GitHub: https://github.com/jtalk22/slack-mcp-server

The main tradeoff: session tokens = full account access. Same as your browser has, but now accessible to whatever MCP client you're using. For personal use on your own machine, I think that's fine. For teams, there's a managed version with audit controls.

---

## dev.to

**Title:** I Spent 3 Months Building a Slack MCP Server Because Slack's Official One Doesn't Work

**Body:**

Three months ago I tried to connect Claude to my Slack workspace using the official Slack MCP server. It requires OAuth app registration, workspace admin approval, and redirect URI configuration. I'm a solo developer — I am the admin — and it still took me 45 minutes of debugging before I hit the real wall: it doesn't work with Claude Code at all. The OAuth/DCR handshake fails silently.

So I built my own.

### The Approach: Browser Session Tokens

Instead of OAuth, my server uses the same session tokens your browser already has when you're logged into Slack. Two tokens:
- `xoxc-` — the API token
- `xoxd-` — the session cookie

You extract them once (the setup wizard walks you through it), and then any MCP client can use them to interact with your Slack workspace.

```bash
npx -y @jtalk22/slack-mcp --setup
```

### What You Can Do With It

16 tools, organized by what engineers actually need:

**Morning triage:** "What did I miss overnight?" — checks all your unreads, pulls the important channels, summarizes the key messages.

**Search:** "Find the runbook link Kai shared during the incident" — full-text search across your workspace with Slack's native search syntax.

**Thread context:** "What was decided about the Postgres migration?" — pulls a thread and summarizes decisions, action items, and owners.

**Reply without context-switching:** "Post an update to the incidents thread that I've pushed a fix" — reads the thread for context, composes an appropriate reply.

**Quick actions:** "React to Kai's message with a checkmark and mark the channel as read" — Slack busywork without opening Slack.

**Full export:** "Export #architecture-decisions with all threads for the design review" — saves to a local JSON file.

### The Trust Tradeoff

I want to be honest about this: session tokens give full account access. That's the same access your browser has, but now an AI assistant has it too.

For personal use — searching your own Slack, reading your own messages — I think this is fine. You're already trusting Claude/Cursor with your entire codebase. Trusting it with your Slack is the same category of risk.

For teams, it's a different story. That's why we also offer a managed Cloud version with audit logs, per-user access controls, and token rotation.

### Technical Decisions

- **Zero runtime dependencies** beyond @modelcontextprotocol/sdk and Express. No Slack SDK — just raw HTTP to the Slack API with retry logic and rate limiting.
- **4-layer token persistence:** Environment variables → JSON file → macOS Keychain → Chrome auto-extraction. Tokens are checked in this order, so you can use whatever fits your workflow.
- **Atomic file writes** for token storage. Mutex locking for concurrent access. LRU cache for user resolution.
- **Works with everything:** Claude Desktop, Claude Code, Cursor, GitHub Copilot, Gemini CLI, Windsurf. Any MCP client that supports stdio transport.

### Try It

Interactive demo: https://jtalk22.github.io/slack-mcp-server/public/demo-claude.html

The demo shows a connected narrative — a developer handling their Monday morning Slack entirely through Claude, going from 47 unreads to inbox zero without opening Slack once.

```bash
npx -y @jtalk22/slack-mcp --setup
```

GitHub: https://github.com/jtalk22/slack-mcp-server
MIT licensed.
