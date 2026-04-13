# Release Notes — v4.1.2

**LevelDB extraction, multi-profile enumeration, zero zombies.**

---

## The axiom

A status channel that reports without verifying against ground truth is a zombie signal. It can report green forever after the underlying reality has stopped.

The bug class: status systems track `last_attempt_at`, not `last_verified_ground_truth_at`. The two are not the same. An attempt succeeds when the status update writes; ground truth changes only when the underlying action observably affects the world. When those decouple, the status layer becomes fiction with a timestamp.

Three concurrent instances landed the same week: a pharmacy delivery system that "confirmed delivery with signature" for medication that was never in inventory; a Slack token-refresh loop that ran every four hours for 12 days without ever talking to Slack; and a Node process tree that grew to 53 zombie children because `unref()` was the documented exit path but `StdioServerTransport` kept the event loop open.

One bug class, three skins. The fix: persist `last_verified_ground_truth_at` separately from `last_attempt_at`. Escalate when the gap crosses a threshold.

---

## The empirical proof — v4.1.2

Three structural fixes, each mapped to a status-channel divergence the maintainer hit and traced.

### 1. LevelDB token extraction

**What broke:** AppleScript-based extraction required a live Slack tab open in Chrome and the `Allow JavaScript from Apple Events` flag enabled. Neither of those is guaranteed — and neither shows up in `slack_token_status`. The refresh loop ran. Tokens didn't change. Status said green.

**What changed:** The server now reads tokens directly from Chrome's LevelDB store (`{ChromeProfile}/Local Storage/leveldb/*.{ldb,log}`) using a pure Node.js implementation. No live tab, no AppleScript flag, no platform restriction. AppleScript is demoted to fallback for cases where LevelDB is locked.

### 2. Multi-profile Chrome enumeration

**What broke:** Single-profile extraction picked the wrong Chrome profile on machines with multiple profiles (work + personal). Wrong profile = stale or absent tokens.

**What changed:** The server now walks `Local State` → `profile.info_cache`, ranks all candidate profiles by Cookies file mtime, and selects the freshest. Three env vars for explicit override:

```
SLACK_MCP_CHROME_USER_DATA_DIR   # path to Chrome user data dir
SLACK_MCP_CHROME_PROFILE         # profile folder name (e.g. "Profile 1")
SLACK_MCP_EXTRACTION_MODE        # leveldb | applescript | auto (default: auto)
```

### 3. Explicit shutdown handlers

**What broke:** The background timer used `unref()` so Node would exit when nothing else was running. `StdioServerTransport` kept the event loop alive. Exit never happened. Restart accumulated 53 orphaned Node processes, oldest running for 2+ days.

**What changed:** Explicit handlers registered for SIGTERM, SIGINT, SIGHUP, stdin EOF, and stdin error. Each calls `process.exit(0)`. The process exits within milliseconds of receiving any shutdown signal. Zero zombies.

### Also in v4.1.1 (shipped same release cycle)

- `last_auto_heal_attempt`, `last_auto_heal_error`, `stuck_since` fields in token store — surfaced by `slack_token_status`
- Structured `token_auth_failed` error code with `next_action` route-to-fix payload — no more swallowed generic errors

---

## Honest tradeoff

This release fixes the local-machine pain points the maintainer can reach into and fix directly.

**What self-host (free) owns:** LevelDB extraction (no AppleScript dependency), multi-profile enumeration, zombie-free process lifecycle, structured error codes, auto-heal telemetry. Full 16-tool surface. MIT licensed.

**What hosted owns that self-host structurally cannot:**

- Managed MCP endpoint on the public internet — required for Claude.ai web users. The stdio transport that self-host uses cannot satisfy Claude.ai's HTTP transport contract. This is not a configuration issue; it is a transport contract difference.
- OAuth 2.1 bridge into the Anthropic MCP Directory — the only path for Claude.ai web users to connect without running a local server.
- Encrypted credential storage (AES-256-GCM in Cloudflare D1) — credentials never touch your filesystem.
- Stripe subscription billing and SLA guarantees.
- Structural absence of the zombie-process class — Cloudflare Workers are stateless per-request isolates. The `unref()` race condition is impossible by construction, not because we fixed it.

**What hosted does NOT own (yet):**

- Token acquisition — the user still pastes `xoxc-`/`xoxd-` from DevTools Console at setup time. Same browser dependency as self-host.
- Server-side token refresh — when Slack rotates your session, you re-paste. This is v4.1.3 territory.

---

## Tier mapping

| Tier | Who it serves | What hosted actually owns for them |
|------|--------------|-------------------------------------|
| Self-host (free) | Developers, power users, local-first setups | Nothing — self-host is self-contained |
| Solo — $19/mo | Individual knowledge workers who need Claude.ai web access | Managed endpoint + OAuth 2.1 bridge + encrypted storage |
| Team — $49/mo | Small teams sharing a workspace connection | All Solo features + multi-seat routing + shared token management |
| Turnkey Team Launch — from $2,500+ | Teams who want setup done for them | Dedicated instance + configuration + 30-day onboarding support |
| Managed Reliability — from $800/mo+ | Teams with uptime requirements | SLA-backed managed instance + incident response |

---

## What's next — v4.1.3

The axiom fix lands in both self-host and hosted. The missing field is `last_verified_with_slack_at` — a real Slack API call timestamp, not a refresh-function-returned timestamp.

- **Self-host:** Auto-heal loop re-verifies against a live Slack API call before marking tokens healthy. `slack_token_status` reports both `last_auto_heal_attempt` and `last_verified_with_slack_at`.
- **Hosted:** Status API exposes drift between last refresh attempt and last verified ground truth. Dashboard flags when the gap crosses threshold.

This closes the feedback loop that v4.1.1 instrumented but didn't complete.

---

## Install

```bash
npx @jtalk22/slack-mcp
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

### Cursor / Copilot / Codex CLI

Same config block — all three support stdio MCP.

### Explicit Chrome profile override

```bash
SLACK_MCP_CHROME_USER_DATA_DIR="$HOME/Library/Application Support/Google/Chrome" \
SLACK_MCP_CHROME_PROFILE="Profile 1" \
SLACK_MCP_EXTRACTION_MODE="leveldb" \
npx @jtalk22/slack-mcp
```

---

## Links

- GitHub: https://github.com/jtalk22/slack-mcp-server
- Hosted tiers and releases: https://mcp.revasserlabs.com/releases
- Full changelog: [CHANGELOG.md](../CHANGELOG.md)
