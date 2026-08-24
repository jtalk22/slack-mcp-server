# CLAUDE.md

This file provides maintainer-oriented context for automated edits in this repository.

## Project Scope

Session-based Slack MCP server. Works with any MCP client via stdio transport,
or via hosted HTTP for browser-based clients.

## Build and Run

```bash
npm install
npm start                      # MCP server on stdio
npm run web                    # REST API + Web UI (localhost:3000)
npm run tokens:auto            # Auto-extract from Chrome (macOS)
npm run tokens:status          # Check token health
```

## Installation Paths

```bash
npx -y @jtalk22/slack-mcp      # package entrypoint
docker pull ghcr.io/jtalk22/slack-mcp-server:latest
```

## MCP Tools (19 total)

**Slack reads (12):**

| Tool | Purpose |
|------|---------|
| `slack_health_check` | Verify token validity and show workspace info |
| `slack_token_status` | Token age, health, cache stats |
| `slack_refresh_tokens` | Auto-extract fresh tokens from Chrome (macOS) |
| `slack_list_conversations` | List DMs and channels with resolved names |
| `slack_conversations_history` | Get messages from a channel or DM |
| `slack_get_full_conversation` | Export full history with threads |
| `slack_search_messages` | Search across workspace |
| `slack_get_thread` | Get thread replies |
| `slack_users_info` | Get user details |
| `slack_list_users` | List workspace users (paginated, 500+) |
| `slack_users_search` | Search by name, display name, or email |
| `slack_conversations_unreads` | Channels/DMs with unread messages |

**Slack writes (4):** `slack_send_message`, `slack_add_reaction`, `slack_remove_reaction`, `slack_conversations_mark` — all carry MCP `destructive` safety annotation.

**Workflow primitives (2):** `slack_workflow_save`, `slack_workflows` — bind a `workflow_kind` (`incident_room`, `exec_brief`, `support_inbox`, `product_launch_watch`, `custom`) to channels + priority people + retention + cadence. Stored locally at `~/.slack-mcp-workflows.json`.

**Local catch-up (1):** `slack_catch_me_up` — reads a saved profile's scope and returns structured evidence (`lib/catch-up.js`). There are no hosted upgrade stubs in the package since 5.0.0; every advertised tool runs locally.

## Token Persistence Layers

1. Environment variables
2. Token file (`~/.slack-mcp-tokens.json`)
3. macOS Keychain
4. Chrome auto-extraction (macOS only)

Storage backend: `auto` (file + Keychain, default), `keychain-only` (Keychain
exclusively, no plaintext file, verified writes, legacy file migrated in and
removed after verification — a removal failure throws `plaintext_removal_failed`
rather than passing silently — bookkeeping in `~/.slack-mcp-meta.json`), or
`file` (Keychain never touched). On macOS, `--setup` asks and persists the
choice in the meta file; the `SLACK_MCP_TOKEN_STORAGE` env var overrides.
Unrecognized values from either source fail closed at startup. Sidecar writes
are serialized across processes via an `O_EXCL` lock file; a failed persist
keeps fresh tokens in memory (`storage.unpersisted_fresh_tokens`) so the
auth-retry path never reuses stale credentials.

## Architecture Notes

- Session-based access uses browser tokens (`xoxc-` + `xoxd-`).
- Token lifecycle is time-bounded and may require refresh.
- Reliability controls include atomic file writes, mutex locking, and cached lookups.

## Structure

```text
src/
  server.js        MCP server entry point (stdio, era-negotiated via serveStdio)
  server-http.js   Streamable HTTP entry (stateless per request, MCP 2026-07-28)
  web-server.js    REST API + Web UI
lib/
  mcp-server.js    shared protocol-server factory both transports build from
  token-store.js   token persistence
  slack-client.js  Slack API client and retry logic
  tools.js         MCP tool definitions
  handlers.js      MCP tool handlers
```

## Claude Code Integration

The repo includes `.claude/settings.json` for local MCP server registration.
Tokens load from `~/.slack-mcp-tokens.json` or `SLACK_TOKEN`/`SLACK_COOKIE` env vars.

## Gotchas

- **`main` is branch-protected.** Direct pushes are rejected
  (`remote rejected ... protected branch hook declined`) regardless of what a
  generic "push straight to main" doctrine says. Every change goes through a PR,
  including one-line doc fixes. Squash-merge means the feature branch is not an
  ancestor of `main` afterwards, so `git branch -d` refuses it — use `-D` once
  the PR is merged.
- **The protocol claim is CI-gated.** `README.md` may say "2026-07-28" only
  while `test/mcp-era.test.js` exists and passes; `src/server-http.js` must not
  contain `sessionIdGenerator` (there is no session to mint) and nothing under
  `src/` or `lib/` may import the retired `@modelcontextprotocol/sdk` v1
  package. The SDK is v2 (`@modelcontextprotocol/server` + `/node`; `/client`
  is a devDependency for the era test).
- **Tool profiles must agree with the README's counts.** `SLACK_MCP_TOOLS`
  selects `all` (19) / `read` (12) / `essentials` (6) or a custom list.
  `READ_TOOLS` is an explicit list, deliberately NOT derived from the
  `readOnlyHint` annotation — that annotation is a safety signal, and deriving
  the surface from it once shipped tools that made no Slack call to users who
  narrowed their surface to save schema cost. `check-public-surface-integrity.js`
  gates counts, name rot, and the absence of any paid-tier tool;
  `npm run measure:tools` prints the schema cost per profile.
- **Branch names must not contain "claude"** (or other AI-tool markers). The
  attribution guardrail scans commit messages; `gh pr update-branch` writes
  "Merge branch 'main' into <branch>", so a marker in the branch name fails CI
  on the merge commit. Rebase instead of merge-updating if it happens.
- **Public pages are generated.** Never edit root `index.html` or `public/*.html`
  directly — edit `templates/public-pages/*.tpl` + `lib/public-pages.js`, run
  `node scripts/generate-public-pages.js`, commit templates and outputs together.
- **README claims are CI-gated.** `check-public-surface-integrity.js` greps for
  literal "19 tools", "12 read-only", "4 write-path"; `check-public-language.sh`
  bans hype words. Run both before pushing copy changes.
- **Demo video is reproducible.** `scripts/record-demo.js` re-captures the whole
  demo deterministically (webm master → renditions). Chapter `data-t` values in
  `demo-video.html.tpl` and `.vtt` cue times are hand-mapped to real scene
  boundaries — re-verify both against extracted frames after any re-capture.
- **Never `gh pr merge --delete-branch` a PR whose branch is the BASE of a
  stacked PR.** GitHub closes the child PR unrecoverably (a closed PR whose base
  branch died cannot be retargeted or reopened). Recover with
  `git rebase --onto origin/main <old-base-tip-sha> <child-branch>` (use the old
  base's tip COMMIT SHA — the deleted branch name may no longer resolve; find it
  via the local branch, reflog, or the merged PR's head SHA), force-push-with-lease,
  and open a replacement PR. Merge stacked chains bottom-up without `--delete-branch`,
  or let the child auto-retarget first.
- **Glama builds are not our Dockerfile.** The glama.ai listing generates its own
  image (debian + Node, `git clone` + `pnpm install`) from settings in the claimed
  admin panel — repo `.dockerignore`/Dockerfile changes don't affect it. Build
  failures there are usually their builder's infra; re-run via admin → Dockerfile
  → Build & Release.
- **`workers/browser-ops/` is NOT dead code — do not delete it.** It looks
  abandoned from inside this repo: no workflow references it, nothing runs
  `wrangler deploy`, and the only commits since it was added are Dependabot
  bumps. It is nevertheless **deployed** as the `slack-browser-ops` Worker and
  consumed **cross-repo** by `revereveal/portfolio` → `grant-brief`, which binds
  it as a service (`BROWSER_OPS_KEY`, header `x-browser-key`) and budgets
  "5–20 browser-ops calls" per agent run for portal status checks. Deleting it
  breaks the grant pipeline. Its `@cloudflare/puppeteer` → `extract-zip` alert
  (#51, CVE-2026-56876) was dismissed as `not_used`, not fixed: `extract-zip`
  only loads via puppeteer's Node launcher classes, while `index.js` calls
  `puppeteer.launch(env.BROWSER)` through the Workers entry point to remote
  Browser Rendering, and `workerd` cannot spawn processes or unzip anyway.
  `workers/` is absent from the npm `files` whitelist, so it never ships to
  package consumers. Re-open the alert if this ever runs under Node.
  (`scripts/cloudflare-browser-tool.js` is a separate path — it calls
  Cloudflare's REST Browser Rendering API directly and is unaffected.)
