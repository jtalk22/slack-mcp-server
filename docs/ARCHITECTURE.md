# Architecture

## Two Access Models

### Cloud (OAuth 2.1)

Standard authorization code flow with PKCE S256. User authorizes via browser. Encrypted token storage on Cloudflare's global edge (300+ PoPs). AES-256-GCM at rest.

- Dynamic client registration (RFC 7591)
- RFC 8414 metadata discovery
- 24-hour token TTL with refresh

### Self-Hosted (Session Tokens)

Uses your existing Chrome browser session credentials (`xoxc-` + `xoxd-`). Mirrors your user access exactly — if you can see it in Slack, Claude can see it too.

Session tokens expire every 1-2 weeks. Auto-refresh (macOS) or manual update keeps things running.

## Token Persistence (4 Layers)

```
Priority 1: Environment Variables (SLACK_TOKEN, SLACK_COOKIE)
    ↓ fallback
Priority 2: Token File (~/.slack-mcp-tokens.json)
    ↓ fallback
Priority 3: macOS Keychain (encrypted)
    ↓ fallback
Priority 4: Chrome Auto-Extraction (macOS only)
```

## Stability Features

### Atomic Writes
All file operations (tokens, DM cache) use atomic writes:
```
Write to temp file → chmod 600 → rename to target
```
This prevents JSON corruption if the process is killed mid-write.

### Zombie Process Protection
Background refresh timers use `unref()`:
```javascript
const timer = setInterval(refreshTokens, 4 * 60 * 60 * 1000);
timer.unref(); // Process can exit even if timer is pending
```
When Claude closes the MCP connection, the server exits cleanly.

### Race Condition Prevention
A mutex lock prevents concurrent Chrome extractions:
```javascript
if (refreshInProgress) return null;
refreshInProgress = true;
try { return extractFromChromeInternal(); }
finally { refreshInProgress = false; }
```

## Project Structure

```
slack-mcp-server/
├── src/
│   ├── server.js         # MCP server (stdio transport)
│   └── web-server.js     # REST API + Web UI
├── lib/
│   ├── token-store.js    # 4-layer persistence + atomic writes
│   ├── slack-client.js   # API client, LRU cache, retry logic
│   ├── tools.js          # MCP tool definitions + safety annotations
│   └── handlers.js       # Tool implementations
├── public/
│   ├── index.html        # Web UI
│   └── demo.html         # Interactive demo
└── scripts/
    └── token-cli.js      # Token management CLI
```

## Platform Support

| Feature | macOS | Linux | Windows |
|---------|-------|-------|---------|
| MCP Server | Yes | Yes | Yes |
| Token File | Yes | Yes | Yes |
| Auto-Refresh from Chrome | Yes | No | No |
| Keychain Storage | Yes | No | No |
| Web UI | Yes | Yes | Yes |
