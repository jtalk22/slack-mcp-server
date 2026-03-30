# Launch Posts

## Show HN

**Title:** Show HN: Slack MCP server that uses your browser session instead of OAuth

**Body:**

Hey HN,

I built an MCP server that lets AI assistants (Claude, Cursor, Copilot, Gemini) read and write to Slack using your existing browser session — no OAuth app, no admin approval, no scopes to configure.

**Why this exists:** Slack's official MCP server requires you to register an OAuth app, get workspace admin approval, and configure redirect URIs. That process is broken with Claude Code and GitHub Copilot due to OAuth/DCR incompatibility. For a tool that's supposed to reduce friction, it creates a lot of it.

This server takes a different approach: it uses the same session tokens your browser already has (xoxc- + xoxd-). One command to set up:

    npx -y @jtalk22/slack-mcp --setup

16 tools: search messages, read threads, list channels/DMs, send messages, add reactions, export conversations, look up users. Read-only by default — write tools require explicit confirmation.

**The trust tradeoff:** Session tokens give full account access. This is the same access your browser has, but now an AI assistant has it too. I think that's an acceptable tradeoff for personal use — you're trusting the MCP client (Claude, Cursor) to behave, which you're already doing for your codebase. For teams, we offer a managed Cloud version with audit logs and access controls.

**Technical details:**
- Pure Node.js, zero runtime dependencies beyond @modelcontextprotocol/sdk and Express
- 4-layer token persistence: env vars → token file → macOS Keychain → Chrome auto-extraction
- Atomic file writes, mutex locking, LRU user cache
- Works over stdio (local) or HTTP (hosted)
- MIT licensed

Interactive demo: https://jtalk22.github.io/slack-mcp-server/public/demo-claude.html
GitHub: https://github.com/jtalk22/slack-mcp-server
npm: https://www.npmjs.com/package/@jtalk22/slack-mcp

I'd love feedback on the approach. The session-token model isn't for everyone, but for the "I just want to search my own Slack from Claude" use case, it's hard to beat zero-config.

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
