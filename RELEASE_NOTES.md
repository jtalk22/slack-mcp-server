# Release Notes: v1.1.2 "The Hacker Edition"

---

## GitHub Release Description

```markdown
# v1.1.2 - The Hacker Edition

**Full Slack access for Claude. No OAuth. No approval. Just works.**

## What's New

### Magic Link Dashboard
One-click authentication for the Web UI. No more copy-pasting API keys.
```
npm run web
> Dashboard: http://localhost:3000/?key=smcp_xxxx  ← Click it!
```

### Interactive Simulator
[**Try it live**](https://jtalk22.github.io/slack-mcp-server/public/demo.html) - See Claude search your DMs, list channels, and look up users. No install required.

### Stability Hardening (v1.0.6+)
- Zombie process protection (`unref()` timers)
- Atomic file writes (no JSON corruption)
- Race condition prevention (mutex locks)
- Platform-safe code (macOS/Linux/Windows)

## Install

```bash
npm install -g @jtalk22/slack-mcp
```

## Links
- [Live Demo](https://jtalk22.github.io/slack-mcp-server/public/demo.html)
- [Documentation](https://github.com/jtalk22/slack-mcp-server#readme)
- [Sponsor](https://github.com/sponsors/jtalk22)

---

**Full Changelog**: https://github.com/jtalk22/slack-mcp-server/commits/main
```

---

## Twitter/X Thread

```
🚀 Shipped: Slack MCP Server v1.1 "The Hacker Edition"

Give Claude FULL access to your Slack workspace. DMs, private channels, message history. No OAuth hell.

🔗 Try it NOW (no install): https://jtalk22.github.io/slack-mcp-server/public/demo.html

🧵 Thread ↓
```

```
1/ The problem: Slack's OAuth requires admin approval, per-conversation consent, and still blocks DM access.

The solution: Use your existing browser session. You're already logged in. We just give Claude the same access.
```

```
2/ What can Claude do with this?

✅ Search all your DMs: "Find the API key Sarah sent me"
✅ List channels: "What channels am I in?"
✅ User lookup: "Who is Alex and what does he do?"
✅ Send messages: "Tell Mike I'll be 5 min late"
```

```
3/ New in v1.1 "Hacker Edition":

🔗 Magic Link - One-click dashboard auth
🎮 Interactive Simulator - Try before install
🛡️ Stability fixes - No more zombie processes
🔒 Atomic writes - No corrupted configs
```

```
4/ Install in 30 seconds:

npm install -g @jtalk22/slack-mcp

Then add to Claude Desktop config. Done.

Docs: https://github.com/jtalk22/slack-mcp-server
```

```
5/ Open source. MIT license. Runs locally.

Your tokens never leave your machine. No cloud. No tracking.

⭐ Star if useful: https://github.com/jtalk22/slack-mcp-server
💖 Sponsor: https://github.com/sponsors/jtalk22
```

---

## LinkedIn Post

```
🚀 Just shipped Slack MCP Server v1.1 "The Hacker Edition"

The problem I solved: Getting Claude to access Slack data without the OAuth nightmare.

Traditional Slack apps require:
❌ Admin approval
❌ Per-conversation consent
❌ Still no DM access

My approach: Use your existing browser session. You're already authenticated.

What Claude can now do:
• Search across all DMs and channels
• Look up user profiles and activity
• Send messages on your behalf
• Export full conversation history

New in this release:
• One-click "Magic Link" authentication
• Interactive demo (try before install)
• Stability hardening for production use

Try the live demo: https://jtalk22.github.io/slack-mcp-server/public/demo.html

Open source on GitHub: https://github.com/jtalk22/slack-mcp-server

#opensource #ai #slack #claude #mcp #automation
```

---

## Product Hunt Tagline Options

**Short (60 char)**
```
Give Claude full access to your Slack. No OAuth required.
```

**Medium (140 char)**
```
Slack MCP Server - Full DM, channel, and message access for Claude. Uses browser tokens instead of OAuth. Open source, runs locally.
```

**Description (260 char)**
```
Stop fighting Slack's OAuth. This MCP server gives Claude unrestricted access to your workspace - DMs, private channels, search, everything. Uses your existing browser session. No admin approval. No per-conversation consent. Just install and go.
```

---

## Hacker News Title Options

```
Show HN: I gave Claude full access to my Slack (no OAuth)
```

```
Show HN: Slack MCP Server – Browser token auth for Claude
```

```
Show HN: Bypass Slack OAuth – Give Claude access to your DMs
```

---

## README Badge Block (copy-paste ready)

```markdown
[![Live Demo](https://img.shields.io/badge/Demo-Try%20Simulator-blue?style=for-the-badge)](https://jtalk22.github.io/slack-mcp-server/public/demo.html)
[![npm](https://img.shields.io/npm/v/@jtalk22/slack-mcp?style=flat-square)](https://www.npmjs.com/package/@jtalk22/slack-mcp)
[![GitHub Sponsors](https://img.shields.io/github/sponsors/jtalk22?style=flat-square)](https://github.com/sponsors/jtalk22)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
```

---

## Changelog Entry

```markdown
## [1.1.2] - 2025-01-08

### Added
- Magic Link: One-click dashboard URL with embedded API key
- Interactive Simulator: Split-screen Claude + Slack demo
- Auth Modal: Secure key entry with localStorage persistence
- Reset Demo button for simulator
- `scripts/verify-web.js` for Web UI testing

### Changed
- Homepage now points to live demo for npm discoverability
- Faster animation timings (~40% snappier)
- Anonymized mock data (no PII)

### Fixed
- User profile card now renders correctly in "Who is Alex?" scenario
- Zombie process prevention with `unref()` timers
- Atomic file writes prevent JSON corruption
- Race condition prevention with mutex locks

## [1.0.6] - 2025-01-08

### Added
- Background token health monitoring
- LRU user cache with TTL
- Network retry with exponential backoff
- Platform detection for macOS-only features

### Fixed
- Zombie process on MCP disconnect
- File corruption on concurrent writes
- Boolean parsing for LLM inputs
```

---

## Quick Links Summary

| Purpose | URL |
|---------|-----|
| **Live Demo** | https://jtalk22.github.io/slack-mcp-server/public/demo.html |
| **npm** | https://www.npmjs.com/package/@jtalk22/slack-mcp |
| **GitHub** | https://github.com/jtalk22/slack-mcp-server |
| **Sponsor** | https://github.com/sponsors/jtalk22 |
| **Ko-fi** | https://ko-fi.com/jtalk22 |
| **Buy Me a Coffee** | https://buymeacoffee.com/jtalk22 |
