# Roadmap

Next-feature priorities for slack-mcp-server, ranked by (value × differentiation) ÷ effort. The OSS package is a funnel toward the hosted brain at [mcp.revasserlabs.com](https://mcp.revasserlabs.com), so cheap, funnel-feeding moves are weighted highest.

## Next up — 4.5.0 candidate

**`slack_update_message` + `slack_delete_message`** (effort: S)

Wraps `chat.update` and `chat.delete`. The server can post via `chat.postMessage` but cannot edit or delete — the most-felt gap for any agent that writes to Slack. The handlers are structurally identical to the existing send path; a session token can only edit or delete the user's own messages, so the blast radius is contained, and both reuse the `destructive` annotation already in place. No new auth, transport, or dependency. Maximum user-pain relief for near-zero investment.

## Runners-up (all cheap, all funnel-feeding)

| Feature | Effort | Why |
|---|---|---|
| `slack_schedule_message` | S–M | Wraps `chat.scheduleMessage`. An OSS teaser for the hosted Safeguard "scheduled morning catch-up DM" *(in development)* — proves cadence value before the upsell. |
| Complete pagination / cursor passthrough | S | Correctness fix across `conversations_history` / `replies` / `search` / `unreads`, not a new tool. Makes every read complete and every corpus indexed for `smart_search` complete — the cheapest thing that raises hosted quality. |
| `slack_upload_file` | M | `files.getUploadURLExternal` → `completeUploadExternal` (legacy `files.upload` is deprecated). Indexed file content feeds `smart_search`. Heaviest of the cheap tier; defer behind the two above. |

## Deferred (real competitor gaps, wrong investment for a maybe-retired OSS copy)

Read-state-preserving fetches (no read-receipts), OAuth `xoxp`/`xoxb` token modes, canvas CRUD, SSE/proxy transport, usergroups CRUD, `conversations.create`/`invite`/`join`. Note: `reminders.*` and `canvases.*` are increasingly bot-token gated — verify session-token support before touching.

---

Generated 2026-06-09 from a competitive scan + feature-gap audit. Backlog tracked locally via beads (`bd list`).
