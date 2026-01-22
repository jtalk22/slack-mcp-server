# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- **Interactive Simulator**: Split-screen Claude + Slack demo with 3 scenarios
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
