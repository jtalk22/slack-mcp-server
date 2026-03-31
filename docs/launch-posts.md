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
- "Stealth mode — no admin approval, no app install, no audit trail"
- "The `d` cookie is HttpOnly by design — we decrypt it from Chrome's SQLite store"
- "One command. 30 seconds. Works with Claude Code, Cursor, Codex, Gemini."

**Don't say:**
- "We fixed what Slack broke" (the cookie was always HttpOnly)
- "Unofficial" (say "independent" or nothing)
- "Hack" or "exploit" (it's standard cookie store access, same as any password manager)
- "Steals" or "captures" (it reads your own authenticated session)

**Tone:** Technical, understated, engineer-to-engineer.
