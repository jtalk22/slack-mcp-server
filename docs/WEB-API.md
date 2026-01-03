# Web API Reference

The Slack Web Server exposes all MCP tools as REST endpoints, accessible from any browser or HTTP client. This is useful for accessing Slack from claude.ai (which doesn't support MCP).

## Starting the Server

```bash
cd ~/slack-mcp-server
npm run web
```

The server will:
1. Start on port 3000
2. Serve the web UI at http://localhost:3000
3. Use the hardcoded API key: `slack-web-api-2026`

## Auto-Start on Login (Recommended)

Create a LaunchAgent to auto-start the web server on login:

```bash
cat > ~/Library/LaunchAgents/com.slack-web-api.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.slack-web-api</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/node</string>
        <string>/Users/YOUR_USERNAME/slack-mcp-server/src/web-server.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/YOUR_USERNAME/slack-mcp-server</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/slack-web-api.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/slack-web-api.error.log</string>
</dict>
</plist>
EOF

# Load it
launchctl load ~/Library/LaunchAgents/com.slack-web-api.plist
```

**Manage the service:**
```bash
# Check status
launchctl list | grep slack-web-api

# Restart
launchctl kickstart -k gui/$(id -u)/com.slack-web-api

# Stop
launchctl unload ~/Library/LaunchAgents/com.slack-web-api.plist
```

## Authentication

All API requests require the API key in the Authorization header:

```
Authorization: Bearer slack-web-api-2026
```

**Default API Key:** `slack-web-api-2026`

To use a custom key:
```bash
SLACK_API_KEY=your-custom-key npm run web
```

---

## Endpoints

### GET /
Server info and available endpoints (no auth required).

### GET /health
Check Slack connection status.

```bash
curl -H "Authorization: Bearer $API_KEY" http://localhost:3000/health
```

**Response:**
```json
{
  "status": "OK",
  "user": "james",
  "team": "Rêvasser"
}
```

---

### POST /refresh
Force token refresh from Chrome.

```bash
curl -X POST -H "Authorization: Bearer $API_KEY" http://localhost:3000/refresh
```

---

### GET /conversations
List conversations (DMs/channels).

**Query Parameters:**
| Param | Default | Description |
|-------|---------|-------------|
| types | im,mpim | Conversation types |
| limit | 100 | Max results |

**Types:** `im`, `mpim`, `public_channel`, `private_channel`

```bash
curl -H "Authorization: Bearer $API_KEY" "http://localhost:3000/conversations?types=im"
```

**Response:**
```json
{
  "count": 5,
  "conversations": [
    { "id": "D063M4403MW", "name": "Gwen Santos", "type": "dm" }
  ]
}
```

---

### GET /conversations/:id/history
Get messages from a conversation.

**Query Parameters:**
| Param | Default | Description |
|-------|---------|-------------|
| limit | 50 | Messages to fetch |
| oldest | - | Unix timestamp start |
| latest | - | Unix timestamp end |
| resolve_users | true | Convert user IDs to names |

```bash
curl -H "Authorization: Bearer $API_KEY" "http://localhost:3000/conversations/D063M4403MW/history?limit=10"
```

---

### GET /conversations/:id/full
Export full conversation with threads.

**Query Parameters:**
| Param | Default | Description |
|-------|---------|-------------|
| max_messages | 2000 | Max messages |
| include_threads | true | Fetch replies |
| oldest | - | Unix timestamp start |
| latest | - | Unix timestamp end |
| output_file | - | Save to file path |

```bash
curl -H "Authorization: Bearer $API_KEY" "http://localhost:3000/conversations/D063M4403MW/full?max_messages=500"
```

---

### GET /conversations/:id/thread/:ts
Get thread replies.

```bash
curl -H "Authorization: Bearer $API_KEY" "http://localhost:3000/conversations/D063M4403MW/thread/1767368030.607599"
```

---

### GET /search
Search messages across workspace.

**Query Parameters:**
| Param | Default | Description |
|-------|---------|-------------|
| q | *required* | Search query |
| count | 20 | Max results |

**Query Syntax:**
- `from:@username` - From specific user
- `in:#channel` - In specific channel
- `before:2026-01-01` - Before date
- `after:2025-12-01` - After date

```bash
curl -H "Authorization: Bearer $API_KEY" "http://localhost:3000/search?q=from:@gwen%20meeting"
```

---

### POST /messages
Send a message.

**Body:**
```json
{
  "channel_id": "D063M4403MW",
  "text": "Hello!",
  "thread_ts": "1767368030.607599"  // optional, for replies
}
```

```bash
curl -X POST -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"channel_id":"D063M4403MW","text":"Hello!"}' \
  http://localhost:3000/messages
```

---

### GET /users
List all workspace users.

```bash
curl -H "Authorization: Bearer $API_KEY" "http://localhost:3000/users?limit=50"
```

---

### GET /users/:id
Get user details.

```bash
curl -H "Authorization: Bearer $API_KEY" http://localhost:3000/users/U05GPEVH7J9
```

---

## Web UI

Open http://localhost:3000 in your browser for a visual interface.

The UI auto-connects with the hardcoded API key (`slack-web-api-2026`):
1. Select a conversation from the sidebar
2. View messages, threads, and user info
3. Search messages across the workspace
4. Send messages directly from the browser

**Using with claude.ai:**
1. Open the web UI alongside claude.ai
2. Browse/search for relevant conversations
3. Copy-paste message content into claude.ai as needed

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Server port |
| SLACK_API_KEY | (generated) | API key for authentication |
| SLACK_TOKEN | - | Slack xoxc token |
| SLACK_COOKIE | - | Slack xoxd cookie |

---

## Security Notes

1. **API Key**: Keep it secret. Anyone with the key can access your Slack.
2. **Local Only**: By default, only accessible from localhost.
3. **HTTPS**: For remote access, put behind a reverse proxy with HTTPS.
4. **Token Storage**: Slack tokens are stored in keychain and token file.
