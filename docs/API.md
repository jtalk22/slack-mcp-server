# API Reference

## Tools

### slack_health_check

Check if Slack tokens are valid.

**Parameters:** None

**Returns:**
```json
{
  "status": "OK",
  "user": "james",
  "team": "Rêvasser",
  "token_source": "environment",
  "token_updated": "2026-01-03T00:00:00Z"
}
```

---

### slack_token_status

Get detailed token health, age, and cache statistics.

**Parameters:** None

**Returns:**
```json
{
  "token": {
    "status": "healthy",
    "age_hours": 2.5,
    "source": "file",
    "updated_at": "2026-01-08T12:00:00Z",
    "message": "Token is healthy"
  },
  "auto_refresh": {
    "enabled": true,
    "interval": "4 hours",
    "requires": "Slack tab open in Chrome"
  },
  "cache": {
    "users": { "size": 25, "maxSize": 500, "ttlMs": 3600000 },
    "dms": { "count": 10, "age_hours": 1.2 }
  }
}
```

---

### slack_refresh_tokens

Force refresh tokens from Chrome.

**Prerequisites:** Chrome must be running with a Slack tab open (app.slack.com).

**Parameters:** None

**Returns:**
```json
{
  "status": "SUCCESS",
  "user": "james",
  "team": "Rêvasser"
}
```

---

### slack_list_conversations

List all DMs and channels.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| types | string | "im,mpim" | Conversation types to include |
| limit | number | 100 | Maximum results |

**Types:**
- `im` - Direct messages
- `mpim` - Group DMs
- `public_channel` - Public channels
- `private_channel` - Private channels

**Returns:**
```json
{
  "count": 5,
  "conversations": [
    {
      "id": "D063M4403MW",
      "name": "Gwen Santos",
      "type": "dm",
      "user_id": "U05GPEVH7J9"
    }
  ]
}
```

---

### slack_conversations_history

Get messages from a channel or DM.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| channel_id | string | *required* | Channel or DM ID |
| limit | number | 50 | Messages to fetch (max 100) |
| oldest | string | - | Unix timestamp, get messages after |
| latest | string | - | Unix timestamp, get messages before |
| resolve_users | boolean | true | Convert user IDs to names |

**Returns:**
```json
{
  "channel": "D063M4403MW",
  "message_count": 50,
  "has_more": true,
  "messages": [
    {
      "ts": "1767368030.607599",
      "user": "Gwen Santos",
      "user_id": "U05GPEVH7J9",
      "text": "Hello!",
      "datetime": "2026-01-02T15:33:50.000Z",
      "has_thread": false
    }
  ]
}
```

---

### slack_get_full_conversation

Export full conversation with threads.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| channel_id | string | *required* | Channel or DM ID |
| oldest | string | - | Unix timestamp start |
| latest | string | - | Unix timestamp end |
| max_messages | number | 2000 | Max messages (up to 10000) |
| include_threads | boolean | true | Fetch thread replies |
| output_file | string | - | Filename (saved to ~/.slack-mcp-exports/) |

**Timestamps:**
- Dec 1, 2025 = `1733011200`
- Jan 1, 2026 = `1735689600`

**Returns:**
```json
{
  "channel": "D063M4403MW",
  "exported_at": "2026-01-03T16:00:00Z",
  "total_messages": 150,
  "date_range": {
    "oldest": "2025-12-01T00:00:00Z",
    "latest": "now"
  },
  "saved_to": "/Users/james/export.json",
  "messages": [...]
}
```

---

### slack_search_messages

Search messages across the workspace.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| query | string | *required* | Search query |
| count | number | 20 | Number of results (max 100) |

**Query Syntax:**
- `from:@username` - From specific user
- `in:#channel` - In specific channel
- `has:link` - Has links
- `before:2026-01-01` - Before date
- `after:2025-12-01` - After date

**Returns:**
```json
{
  "query": "project update",
  "total": 25,
  "matches": [
    {
      "ts": "1767368030.607599",
      "channel": "general",
      "channel_id": "C05GPEVH7J9",
      "user": "Example User",
      "text": "Here's the project update...",
      "datetime": "2026-01-02T15:33:50.000Z",
      "permalink": "https://..."
    }
  ]
}
```

---

### slack_send_message

Send a message.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| channel_id | string | *required* | Channel or DM ID |
| text | string | *required* | Message text |
| thread_ts | string | - | Thread to reply to |

**Returns:**
```json
{
  "status": "sent",
  "channel": "D063M4403MW",
  "ts": "1767368030.607599",
  "message": "Hello!"
}
```

---

### slack_get_thread

Get all replies in a thread.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| channel_id | string | *required* | Channel or DM ID |
| thread_ts | string | *required* | Thread parent timestamp |

**Returns:**
```json
{
  "channel": "D063M4403MW",
  "thread_ts": "1767368030.607599",
  "message_count": 5,
  "messages": [
    {
      "ts": "1767368030.607599",
      "user": "James Lambert",
      "text": "Original message",
      "datetime": "2026-01-02T15:33:50.000Z",
      "is_parent": true
    }
  ]
}
```

---

### slack_users_info

Get user details.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| user_id | string | *required* | Slack user ID |

**Returns:**
```json
{
  "id": "U05GPEVH7J9",
  "name": "gwen",
  "real_name": "Gwen Santos",
  "display_name": "Gwen",
  "email": "gwen@example.com",
  "title": "Assistant",
  "timezone": "America/New_York",
  "is_bot": false,
  "is_admin": false
}
```

---

### slack_list_users

List all workspace users.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| limit | number | 100 | Maximum users to return |

**Returns:**
```json
{
  "count": 10,
  "users": [
    {
      "id": "U05GPEVH7J9",
      "name": "gwen",
      "real_name": "Gwen Santos",
      "display_name": "Gwen",
      "email": "gwen@example.com",
      "is_admin": false
    }
  ]
}
```
