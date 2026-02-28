# Prepublish Dry Run

- Generated: 2026-02-28T03:51:28.825Z
- Expected owner: `jtalk22 <james@revasser.nyc>`
- Owner range: `origin/main..HEAD`

## Step Matrix

| Step | Status | Command | Details |
|---|---|---|---|
| Git identity | pass | `git config --get user.name && git config --get user.email` | Configured as jtalk22 <james@revasser.nyc> |
| Owner attribution | pass | `bash scripts/check-owner-attribution.sh origin/main..HEAD` | All commits in range are owner-attributed. |
| Public language | pass | `bash scripts/check-public-language.sh` | Public wording guardrail passed. |
| Public attribution markers | pass | `marker-scan` | No non-owner attribution markers found in public surfaces. |
| Core verification | pass | `node scripts/verify-core.js` | Passed. |
| Web verification | pass | `node scripts/verify-web.js` | Passed. |
| Install-flow verification | pass | `node scripts/verify-install-flow.js` | Passed. |
| Version parity | pass | `node scripts/check-version-parity.js --allow-propagation` | Passed. |

## npm Pack Snapshot

- Status: pass
- Details: package size 3232532 bytes, unpacked 3730874 bytes, files 65

## Result

Prepublish dry run passed.

## Command Output (Truncated)

### Git identity

```text
jtalk22
james@revasser.nyc
```

### Owner attribution

```text
No commits to validate in range 'origin/main..HEAD'.
```

### Public language

```text
Scanning public-facing text for disallowed wording...
Public wording check passed.
```

### Public attribution markers

```text
(no output)
```

### Core verification

```text
╔════════════════════════════════════════╗
║  Core Stability Verification Tests     ║
╚════════════════════════════════════════╝

[TEST 1] Atomic Write
────────────────────────────────────────
  PASS: Atomic write completed, no .tmp artifacts

[TEST 2] Server Clean Exit (No Zombie)
────────────────────────────────────────
  PASS: Server exited cleanly (code: 0)

════════════════════════════════════════

✓ ALL TESTS PASSED (2/2)

Core stability features verified
```

### Web verification

```text
╔════════════════════════════════════════╗
║  Web UI Verification Tests             ║
╚════════════════════════════════════════╝

[TEST 1] Server Startup & Magic Link
────────────────────────────────────────
  Magic Link: http://localhost:3456/?key=smcp_AuFKnmHJz24t3eBr80vJmwzjwpib60Re
  API Key: smcp_AuFKnmHJz24t3eB...
  PASS: Server started with magic link

[TEST 2] Demo Page (/demo.html)
────────────────────────────────────────
  PASS: Demo page serves correctly with STATIC PREVIEW banner

[TEST 3] Dashboard (/?key=...)
────────────────────────────────────────
  PASS: Dashboard serves with auth modal

[TEST 4] API Authentication
────────────────────────────────────────
  PASS: API correctly rejects bad keys

[TEST 5] Demo Video Media Reachability
────────────────────────────────────────
  PASS: demo-video media assets are reachable

════════════════════════════════════════

✓ ALL TESTS PASSED (5/5)

Web UI features verified
```

### Install-flow verification

```text
[version] npx -y @jtalk22/slack-mcp@latest --version
exit=0
stdout:
slack-mcp-server v2.0.0
warning: npx resolved slack-mcp-server v2.0.0 while local version is 3.0.0; strict published checks are deferred until publish.

[help] npx -y @jtalk22/slack-mcp@latest --help
exit=0
stdout:
[1mslack-mcp-server v2.0.0[0m

Full Slack access for Claude via MCP. Session mirroring bypasses OAuth.

[1mUsage:[0m
  npx -y @jtalk22/slack-mcp             Start MCP server (stdio)
  npx -y @jtalk22/slack-mcp --setup     Interactive token setup wizard
  npx -y @jtalk22/slack-mcp --status    Check token health
  npx -y @jtalk22/slack-mcp --doctor    Run runtime and auth diagnostics
  npx -y @jtalk22/slack-mcp --version   Print version
  npx -y @jtalk22/slack-mcp --help      Show this help

[1mnpm scripts:[0m
  npm start              Start MCP server
  npm run web            Start REST API + Web UI (port 3000)
  npm run tokens:auto    Auto-extract from Chrome (macOS)
  npm run tokens:status  Check token health

[1mMore info:[0m
  https://github.com/jtalk22/slack-mcp-server

[status] npx -y @jtalk22/slack-mcp@latest --status
exit=1
stdout:
[31m✗[0m No tokens found
Code: missing_credentials
Messag... [truncated]
```

### Version parity

```text
Wrote docs/release-health/version-parity.md
```

### npm Pack Snapshot

```text
[
  {
    "id": "@jtalk22/slack-mcp@3.0.0",
    "name": "@jtalk22/slack-mcp",
    "version": "3.0.0",
    "size": 3232532,
    "unpackedSize": 3730874,
    "shasum": "507b96ede8a9f6a51349a93907f7b5e2d7a81799",
    "integrity": "sha512-j8+NlM4tNIJTNBnDdzKxCqlraGD/bjPL3bL+SQA2/qzMfnJKkEm3tDU12HlK8mmeEeOx7DArFpTkuyqrlbr86w==",
    "filename": "jtalk22-slack-mcp-3.0.0.tgz",
    "files": [
      {
        "path": "LICENSE",
        "size": 1064,
        "mode": 420
      },
      {
        "path": "README.md",
        "size": 15975,
        "mode": 420
      },
      {
        "path": "docs/API.md",
        "size": 6209,
        "mode": 420
      },
      {
        "path": "docs/assets/icon-512.png",
        "size": 26165,
        "mode": 420
      },
      {
        "path": "docs/assets/icon.svg",
        "size": 1075,
        "mode": 420
      },
      {
        "path": "docs/CLOUDFLARE-BROWSER-TOOLKIT.md",
        "size": 1441,
        "mode": 420
      },
      {
        "path": "docs/COMMUNICATION-STYLE.md",
        "size": 1215,
        "mode": 420
      },
      {
        "path": "docs/COMPATIBILITY.md",
        "size": 1490,
        "mode": 420
      },
      {
        "path": "docs/DEPLOYMENT-MODES.md",
        "size": 2599,
        "mode": 420
      },
      {
        "path": "docs/HN-LAUNCH.md",
        "size": 2206,
        "mode": 420
      },
      {
        "path": "docs/images/demo-channel-messages.png",
        "size": 364330,
        "mode": 420
      },
      {
        "path": "docs/images/demo-channels.png",
        "size": 363862,
        "mode": 420
      },
      {
        "path": "docs/images/demo-claude-mobile-360x800.png",
        "size": 412834,
        "mode": 420
      },
      {
        "path": "docs/images/demo-claude-mobile-390x844.png",
        "size": 435408,
        "mode": 420
      },
      {
        "path": "docs/images/demo-main-mobile-360x800.png",
        "size": 153943,
        "mode": 420
      },
      {
        "path": "docs/images/demo-main-mobile-390x844.png",
        "size": 160100,
        "mode": 420
      },
      {
        "path": "docs/images/demo-main.png",
        "size": 324296,
        "mode": 420
      },
      {
        "path": "docs/images/demo-messages.png",
        "size": 163409,
        "mode": 420
      },
      {
        "path": "docs/images/demo-poster.png",
        "size": 779512,
        "mode": 420
      },
      {
        "path": "docs/images/demo-sidebar.png",
        "size": 50643,
        "mode": 420
      },
      {
        "path": "docs/images/diagram-oauth-comparison.svg",
        "size": 5637,
        "mode": 420
      },
      {
        "path": "docs/images/diagram-session-flow.svg",
        "size": 6338,
        "mode": 420
      },
      {
        "path": "docs/images/web-api-mobile-360x800.png",
        "size": 68502,
        "mode": 420
      },
      {
        "path": "docs/images/web-api-mobile-390x844.png",
        "size": 70161,
        "mode": 420
      },
      {
        "path": "docs/INDEX.md",
        "size": 1384,
        "mode": 420
      },
      {
        "path": "docs/INSTALL-PROOF.md",
        "size": 524,
        "mode": 420
      },
      {
        "path": "docs/LAUNCH-COPY-v3.0.0.md",
        "size": 2692,
        "mode": 420
      },
      {
        "path": "docs/LAUNCH-MATRIX.md",
        "size": 1357,
        "mode": 420
      },
      {
        "path": "docs/LAUNCH-OPS.md",
        "size": 1913,
        "mode": 420
      },
      {
        "path": "docs/RELEASE-HEALTH.md",
        "size": 2208,
        "mode": 420
      },
      {
        "path": "docs/SETUP.md",
        "size": 3671,
        "mode": 420
      },
      {
        "path": "docs/SUPPORT-BOUNDARIES.md",
        "size": 1751,
        "mode": 420
      },
      {
        "path": "docs/TROUBLESHOOTING.md",
        "size": 6972,
        "mode": 420
      },
      {
        "path": "docs/USE_CASE_RECIPES.md",
        "size": 2168,
        "mode": 420
      },
      {
    ... [truncated]
```

