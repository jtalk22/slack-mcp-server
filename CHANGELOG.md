# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.1.2] - 2026-04-12

### Fixed
- **LevelDB token extraction** — Reads session tokens directly from Chrome's LevelDB store (`{ChromeProfile}/Local Storage/leveldb/*.{ldb,log}`). Pure Node.js implementation, no AppleScript, no live Slack tab required. AppleScript path demoted to fallback.
- **Multi-profile Chrome enumeration** — Walks `Local State` → `profile.info_cache`, ranks candidate profiles by Cookies file mtime (freshest wins). Three new env vars for explicit override: `SLACK_MCP_CHROME_USER_DATA_DIR`, `SLACK_MCP_CHROME_PROFILE`, `SLACK_MCP_EXTRACTION_MODE`.
- **Explicit shutdown handlers** — SIGTERM, SIGINT, SIGHUP, stdin EOF, and stdin error all trigger clean exit. Closes the 53-orphan zombie-process bug where `unref()` on the background timer failed to exit because `StdioServerTransport` held the event loop open.

## [4.1.1] - 2026-04-12

### Added
- **Auto-heal telemetry** — Token store now persists `last_auto_heal_attempt`, `last_auto_heal_error`, and `stuck_since` fields. Surfaces via `slack_token_status`.
- **Structured `token_auth_failed` error code** — Auth failure response includes `next_action` route-to-fix payload so callers know exactly what to do (re-extract vs re-paste vs re-auth).

### Fixed
- **Error surface hardening** — Auth failures no longer swallowed as generic MCP errors; structured codes propagate to the client.

## [4.1.0] - 2026-04-01

### Highlights
- **Chrome DB decryption** — Session cookie extracted directly from Chrome's encrypted SQLite store (PBKDF2 + AES-128-CBC from macOS Keychain). No DevTools, no manual copy-paste.
- **Stealth Mode** — Session-token auth leaves zero footprint in workspace admin settings. No app install, no bot user, no audit trail.
- **Codex CLI support** — Config examples and confirmed compatibility.

### Changed
- README: Stealth Mode framing, Codex CLI quick start, expanded comparison table
- Diagram: Updated to show Chrome DB decryption flow, dark theme, attribution updated (version number dropped to prevent staleness)
- Landing page: Cloud messaging updated for hosted product direction
- Launch posts: Rewritten to lead with Chrome DB decryption (technical hook)
- Docs: Stale Cloud pricing removed from SETUP, TROUBLESHOOTING, DEPLOYMENT-MODES, ARCHITECTURE
- Demo assets rebranded: `demo-claude-*` → `demo-slack-mcp-*` (files, URLs, OG tags, scripts, templates) — client-agnostic naming
- Video polish: color grade, contrast +12%, sharpen, vignette, CRF 18 encode (2.5× bitrate) across all 5 video assets
- First 2s trimmed from recordings (stale badge eliminated)
- Old `demo-claude.html` preserved as redirect to canonical URL

### Removed
- 13 hash-named `.webm` iteration recordings (80.7MB) — stale pipeline artifacts, preserved in git history

### Fixed
- HttpOnly cookie extraction — The `d` cookie was always HttpOnly; `document.cookie` never worked for extraction. Now reads Chrome's encrypted SQLite DB directly.

## [4.0.0] - 2026-03-30

### Highlights
- **Monday Morning demo** — 7-scenario interactive narrative: triage 47 unreads, find a lost printer PIN, reply to incidents, export for post-mortems — without opening Slack once.
- **H.264 video pipeline** — `npm run record-demo` auto-encodes MP4 from Playwright recordings. Demo video page serves MP4 first with WebM fallback.
- **16 tools, one command** — `npx -y @jtalk22/slack-mcp --setup` gets you running with any MCP client: Claude, Cursor, Copilot, Gemini, Windsurf.
- **Schema.org SEO** — VideoObject markup on demo-video.html for Google rich results.
- **Play button poster** — README poster image composites a play button overlay for click-through.

### Changed
- **README rewritten** — Leads with the problem (Slack's OAuth is broken with Claude Code). Multi-client positioning, comparison diagram, demo video above the fold.
- **Landing page** — Hero rewritten to lead with differentiation, not features. Demo is the primary CTA.
- **Version bumped to 4.0.0** across package.json, server.json, glama.json

### Security
- **File permissions** — `fs.chmodSync` added to token file writes
- **API key redaction** — Dashboard URL prints truncated key
- **Integer validation** — `safeParseInt` guards numeric API parameters

### Compatibility
- No MCP tool names were removed or renamed. All 16 tools unchanged.
- All CLI entry points unchanged (`--setup`, `--status`, `--doctor`, `web`, `http`).

## [3.2.4] - 2026-03-11

### Fixed
- **Release integrity** — Runtime version emitters now resolve from `package.json`, restoring parity for CLI output, Docker smoke tests, and hosted runtime metadata.
- **Public surface drift** — Current README, marketing pages, setup docs, and hosted offering claims were aligned so self-hosted and managed offerings no longer contradict each other.

### Added
- **Public surface integrity gate** — CI and release preflight now validate current-version surfaces, hosted tool-count claims, and core metadata parity before release.
- **Attribution guardrail regression check** — CI and release preflight now verify the Dependabot skip conditions and main-branch owner enforcement remain intact.
- **Current release docs** — Added a `v3.2.4` release-note block and a same-day release runbook covering the Docker tag push vs GitHub Release sequencing.
- **Support routing visibility** — Deployment intake and support-boundary guidance are now elevated across the current repo trust surfaces.

## [3.2.1] - 2026-03-10

### Fixed
- **Safety annotations** — `destructiveHint: true` on 4 write-path tools (send_message, add_reaction, remove_reaction, conversations_mark). MCP clients now prompt for confirmation before write operations.

### Changed
- **README restructured** — 571 → ~180 lines. Annotation table, collapsible install configs, modern MCP patterns. Architecture and internals moved to docs/ARCHITECTURE.md.
- **SECURITY.md updated** — Version table current (3.x), professional language throughout.
- **Setup wizard tagline** — Removed "bypasses OAuth" phrasing.
- **Disclaimer reframed** — Professional language replacing "unofficial APIs."

## [3.2.0] - 2026-03-10

### Added
- **`slack_add_reaction`** — Add emoji reactions to messages
- **`slack_remove_reaction`** — Remove emoji reactions from messages
- **`slack_conversations_mark`** — Mark a conversation as read up to a timestamp
- **`slack_conversations_unreads`** — Priority-sorted unread inbox across all channels and DMs
- **`slack_users_search`** — Search workspace users by name, display name, or email
- REST endpoints: `POST /reactions`, `DELETE /reactions`, `POST /conversations/:id/mark`, `GET /conversations/unreads`, `GET /users/search`

### Fixed
- **server-http.js tool parity** — Hosted HTTP transport now dispatches all 16 tools (was missing reactions, mark, unreads, search)
- **Background timer crash** — `setInterval` callback in server.js wrapped in try/catch to prevent unhandled rejection
- **Express route ordering** — `/users/search` registered before `/users/:id` to prevent "search" matching as user ID

### Changed
- Tool count: 11 → 16 across all three transports (stdio, web, hosted HTTP)
- Hosted endpoint docs added to SETUP.md, DEPLOYMENT-MODES.md, and TROUBLESHOOTING.md

### Compatibility
- No MCP tool renames or removals. Fully backwards compatible.

## [3.1.0] - 2026-03-10

### Added
- **Hosted endpoint surface** — landing page with hosted endpoint and post-checkout key delivery
- **Homepage hosted CTA** — `index.html` links to hosted page
- **README hosted section** — link to hosted endpoint
- **Revenue Protection** — plan-based tool gating, D1 rate limit persistence, timing-safe admin auth
- **OAuth 2.1 + PKCE S256** — MCP Registry remote endpoint at `mcp.revasserlabs.com/oauth/mcp`
- **MCP Registry v3.1.0 published** with `remotes` section

### Security
- XSS fix: conversation names, user names, and channel names now escaped in web dashboard
- Shell injection fix: Keychain functions use `execFileSync` with array args instead of string interpolation
- Undefined param fix: `null`/`undefined` values no longer sent as literal `"undefined"` to Slack API
- JSON parse guard: non-JSON Slack responses now throw descriptive error instead of crashing
- `formatTimestamp` guards against NaN/undefined input

### Compatibility
- No MCP tool renames or removals. All 11 local tools unchanged.
- Hosted endpoint adds compound workflow tools for team deployments.

## [3.0.0] - 2026-02-28

### Changed
- **Hosted `/mcp` now requires auth** — `Authorization: Bearer` header mandatory for HTTP transport
- **CORS allowlisting** — hosted endpoint requires `SLACK_MCP_HTTP_ALLOWED_ORIGINS`
- Structured auth/CORS error responses for missing token config, invalid bearer, and denied origin
- Publish payload reduced by curating packaged files

### Added
- Web verification checks demo media reachability
- Worker compatibility for tool-facing contracts (`channel_id|channel`, `user_id|user`)

### Breaking (Hosted Only)
- Existing hosted deployments must set `SLACK_MCP_HTTP_AUTH_TOKEN` and `SLACK_MCP_HTTP_ALLOWED_ORIGINS` before upgrade
- Local `stdio` and `web` paths unchanged — no migration required

### Compatibility
- No MCP tool renames or removals

## [2.0.0] - 2026-02-26

### Fixed
- Enforced read-only `--status` behavior in install-flow verification for both local and published `npx` paths.
- Added deterministic `--doctor` runtime failure coverage (`exit 3`) using explicit connectivity test wiring.
- Standardized MCP transport tool-call failures with structured error payloads (`status`, `code`, `message`, `next_action`).

### Improved
- Added explicit `unknown_age` token-state semantics when credential timestamps are unavailable.
- Normalized web API error responses to structured diagnostics for auth, validation, and runtime failures.
- Added `verify:version-parity` script and report generation for npm/MCP registry/local metadata parity checks.
- Updated public metadata surface for distribution (`server.json` title, website URL, icon metadata).

### Compatibility
- No MCP tool renames or removals.

## [1.2.4] - 2026-02-26

### Fixed
- Made `--status` deterministic and read-only (no Chrome extraction side effects).
- Standardized `--doctor` behavior with explicit missing/invalid/runtime exit-code coverage in install-flow verification.
- Corrected token-age handling so missing timestamps report unknown age instead of false critical warnings.
- Added explicit Apple Events remediation guidance for Chrome extraction failures.

### Improved
- Unified health/status JSON shape across CLI handlers and web endpoints (`status`, `code`, `message`, `next_action`).
- Kept MCP tool contracts stable while improving runtime diagnostics and operator guidance.

### Compatibility
- No MCP tool renames or removals.

## [1.2.3] - 2026-02-25

### Improved
- Added concise issue/release follow-up templates and communication style guidance for faster post-publish bug handling.
- Added free local-first proof surfaces: README 30-second proof, HN launch kit, docs index, and demo CTA alignment.
- Added clean-room install verifier script (`scripts/verify-install-flow.js`) and CI coverage on Node 20.
- Added `--doctor` CLI diagnostics with deterministic exit codes and next-step guidance.

### Compatibility
- No API or MCP tool schema changes.

## [1.2.2] - 2026-02-25

### Improved
- Aligned CLI/setup guidance to `npx -y @jtalk22/slack-mcp` across docs and runtime messaging
- Removed stale token refresh command references
- Added deployment mode, support boundary, and use case recipe docs
- Added demo CTA strip and deployment intake issue template for qualified team rollout requests

### Compatibility
- No API or MCP tool schema changes

## [1.2.1] - 2026-02-24

### Fixed
- Form-encoded params for Slack endpoints that reject JSON (`conversations.replies`, `search.messages`, `search.all`, `search.files`, `users.info`) with server + worker parity
- Default package CLI entrypoint so `npx @jtalk22/slack-mcp` resolves consistently
- Unified CLI dispatch for stdio default plus `web`, `http`, `--setup`, `--status`, `--version`
- Setup wizard now reliably restores environment state after token validation and renders color interpolation correctly

### Security / Runtime
- Upgraded `@modelcontextprotocol/sdk` to `1.27.0`
- Docker base image updated to Node 20
- Setup/README runtime baseline aligned to Node 20+

## [1.2.0] - 2026-01-17

### Added
- **Interactive Setup Wizard** (`npx @jtalk22/slack-mcp --setup`)
  - Platform detection (macOS vs Linux/Windows)
  - macOS: Auto-extracts tokens from Chrome via AppleScript
  - Linux/Windows: Guided step-by-step manual entry
  - Token validation against Slack API before saving
  - Visual feedback with colored output
- New CLI commands: `--setup`, `--status`, `--version`, `--help`
- New bin entry: `slack-mcp-setup`
- New npm script: `npm run setup`

### Changed
- **Node.js 20+ required** (Node 18 EOL October 2025)
- Version bump across all files (package.json, server.json, server-http.js)

### Developer Experience
- Single-command setup replaces multi-step manual token extraction
- Consistent CLI interface for common operations

## [1.1.7] - 2026-01-08

### Fixed
- Version numbers now consistent across all files
- Error messages reference correct commands (`npm run tokens:auto`)
- Documentation updated with correct setup instructions
- `output_file` description reflects security-restricted path

### Changed
- Verification scripts use generic messages (not version-specific)
- `token-cli.js` uses shared `KEYCHAIN_SERVICE` constant
- `handlers.js` uses ES module import for `execSync`

### Documentation
- Added `slack_token_status` to API reference
- Fixed clone URL in SETUP.md
- Updated TROUBLESHOOTING.md with current API key behavior

## [1.1.6] - 2026-01-08

### Changed
- Web server binds to `127.0.0.1` (localhost only)
- CORS accepts localhost origins only
- File exports write to `~/.slack-mcp-exports/`

## [1.1.5] - 2026-01-08

### Changed
- README badges use pure markdown for mobile compatibility
- Simplified glama.json configuration

## [1.1.4] - 2026-01-08

### Changed
- Expanded npm keywords for discoverability
- Added Open Graph meta tags to demo page
- Enhanced Dockerfile with OCI labels

## [1.1.2] - 2026-01-08

### Changed
- Homepage in package.json now points to live demo for npm discoverability

## [1.1.1] - 2025-01-08

### Fixed
- User profile card now renders correctly in "Who is Alex?" scenario
- `showUserCard()` dynamically renders card instead of manipulating hidden element

## [1.1.0] - 2025-01-08

### Added
- **Magic Link**: One-click dashboard URL with embedded API key
- **Interactive Simulator**: Split-screen MCP client + Slack demo with 3 scenarios
- **Auth Modal**: Secure key entry with localStorage persistence
- **Reset Demo** button for simulator restart
- `scripts/verify-web.js` for automated Web UI testing
- URL parameter detection (`?key=`) with auto-save to localStorage
- Key stripped from URL after save (security polish)
- 401/403 handling clears invalid keys and re-prompts

### Changed
- Faster animation timings (~40% snappier scenarios)
- Anonymized mock data (replaced PII with generic names)
- Web server prints Magic Link to stderr for clean output
- Demo scenarios: "Find API Key", "List Channels", "Who is Alex?"

## [1.0.6] - 2025-01-08

### Added
- **Zombie Process Protection**: `unref()` on background timers
- **Atomic File Writes**: temp-file-then-rename pattern
- **Mutex Lock**: Prevents concurrent Chrome token extraction
- **Platform Detection**: `IS_MACOS` check for osascript features
- **Robust Boolean Parsing**: `parseBool()` handles LLM input variations
- `isAutoRefreshAvailable()` export for platform checks
- `scripts/verify-v106.js` verification script
- Background token health monitoring (every 4 hours)

### Changed
- DM cache uses atomic writes
- `handleRefreshTokens` returns helpful message on non-macOS

### Fixed
- Process no longer hangs after MCP transport closes
- No more `.tmp` file artifacts on crash
- Race conditions in token refresh eliminated

## [1.0.5] - 2025-01-07

### Added
- LRU user cache with TTL (500 users, 1-hour expiry)
- Network error retry with exponential backoff + jitter
- Token health monitoring with age warnings
- `slack_token_status` tool for detailed diagnostics
- `slack_list_users` with pagination (500+ users supported)

### Changed
- Improved error messages for token expiration
- Better rate limit handling

## [1.0.0] - 2025-01-06

### Added
- Initial release
- MCP server with stdio transport
- Web UI with REST API
- 10 Slack tools:
  - `slack_health_check`
  - `slack_refresh_tokens`
  - `slack_list_conversations`
  - `slack_conversations_history`
  - `slack_get_full_conversation`
  - `slack_search_messages`
  - `slack_send_message`
  - `slack_get_thread`
  - `slack_users_info`
  - `slack_list_users`
- Browser token extraction (macOS)
- Multi-layer token persistence (env, file, keychain)
- Auto-refresh from Chrome

[1.2.4]: https://github.com/jtalk22/slack-mcp-server/compare/v1.2.3...v1.2.4
[1.2.3]: https://github.com/jtalk22/slack-mcp-server/compare/v1.2.2...v1.2.3
[1.2.2]: https://github.com/jtalk22/slack-mcp-server/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/jtalk22/slack-mcp-server/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/jtalk22/slack-mcp-server/compare/v1.1.9...v1.2.0
[1.1.7]: https://github.com/jtalk22/slack-mcp-server/compare/v1.1.6...v1.1.7
[1.1.6]: https://github.com/jtalk22/slack-mcp-server/compare/v1.1.5...v1.1.6
[1.1.5]: https://github.com/jtalk22/slack-mcp-server/compare/v1.1.4...v1.1.5
[1.1.4]: https://github.com/jtalk22/slack-mcp-server/compare/v1.1.2...v1.1.4
[1.1.2]: https://github.com/jtalk22/slack-mcp-server/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/jtalk22/slack-mcp-server/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/jtalk22/slack-mcp-server/compare/v1.0.6...v1.1.0
[1.0.6]: https://github.com/jtalk22/slack-mcp-server/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/jtalk22/slack-mcp-server/compare/v1.0.0...v1.0.5
[1.0.0]: https://github.com/jtalk22/slack-mcp-server/releases/tag/v1.0.0
[4.1.2]: https://github.com/jtalk22/slack-mcp-server/compare/v4.1.1...v4.1.2
[4.1.1]: https://github.com/jtalk22/slack-mcp-server/compare/v4.1.0...v4.1.1
[4.1.0]: https://github.com/jtalk22/slack-mcp-server/compare/v4.0.0...v4.1.0
[4.0.0]: https://github.com/jtalk22/slack-mcp-server/compare/v3.2.5...v4.0.0
[3.2.4]: https://github.com/jtalk22/slack-mcp-server/compare/v3.2.3...v3.2.4
[3.2.0]: https://github.com/jtalk22/slack-mcp-server/compare/v3.1.0...v3.2.0
[3.1.0]: https://github.com/jtalk22/slack-mcp-server/compare/v3.0.0...v3.1.0
[3.0.0]: https://github.com/jtalk22/slack-mcp-server/compare/v2.0.0...v3.0.0
[2.0.0]: https://github.com/jtalk22/slack-mcp-server/compare/v1.2.4...v2.0.0
