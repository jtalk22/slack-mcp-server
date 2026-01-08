/**
 * MCP Tool Definitions
 *
 * All Slack MCP tools in one place for easy maintenance.
 */

export const TOOLS = [
  {
    name: "slack_token_status",
    description: "Check token health, age, auto-refresh status, and cache stats",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "slack_health_check",
    description: "Check if Slack tokens are valid and show authentication status",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "slack_refresh_tokens",
    description: "Force refresh tokens by extracting from Chrome (requires Slack tab open in Chrome)",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "slack_list_conversations",
    description: "List all DMs and channels with user names resolved. Uses cached DMs by default for speed.",
    inputSchema: {
      type: "object",
      properties: {
        types: {
          type: "string",
          description: "Comma-separated types: im, mpim, public_channel, private_channel",
          default: "im,mpim"
        },
        limit: {
          type: "number",
          description: "Maximum results (default 100)"
        },
        discover_dms: {
          type: "boolean",
          description: "If true, actively discover all DMs (slower, may hit rate limits on large workspaces). Default false uses cached DMs."
        }
      }
    }
  },
  {
    name: "slack_conversations_history",
    description: "Get messages from a channel or DM with user names resolved",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          description: "Channel or DM ID (e.g., D063M4403MW)"
        },
        limit: {
          type: "number",
          description: "Messages to fetch (max 100, default 50)"
        },
        oldest: {
          type: "string",
          description: "Unix timestamp - get messages after this time"
        },
        latest: {
          type: "string",
          description: "Unix timestamp - get messages before this time"
        },
        resolve_users: {
          type: "boolean",
          description: "Convert user IDs to names (default true)"
        }
      },
      required: ["channel_id"]
    }
  },
  {
    name: "slack_get_full_conversation",
    description: "Export FULL conversation history with all messages, threads, and user names. Can save to file.",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          description: "Channel or DM ID"
        },
        oldest: {
          type: "string",
          description: "Unix timestamp start (e.g., 1733011200 = Dec 1, 2025)"
        },
        latest: {
          type: "string",
          description: "Unix timestamp end"
        },
        max_messages: {
          type: "number",
          description: "Maximum messages to retrieve (default 2000, max 10000)"
        },
        include_threads: {
          type: "boolean",
          description: "Fetch thread replies (default true)"
        },
        output_file: {
          type: "string",
          description: "Filename to save export (saved to ~/.slack-mcp-exports/)"
        }
      },
      required: ["channel_id"]
    }
  },
  {
    name: "slack_search_messages",
    description: "Search messages across the Slack workspace",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query (supports Slack syntax like from:@user, in:#channel)"
        },
        count: {
          type: "number",
          description: "Number of results (max 100, default 20)"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "slack_users_info",
    description: "Get detailed information about a Slack user",
    inputSchema: {
      type: "object",
      properties: {
        user_id: {
          type: "string",
          description: "Slack user ID"
        }
      },
      required: ["user_id"]
    }
  },
  {
    name: "slack_send_message",
    description: "Send a message to a channel or DM",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          description: "Channel or DM ID to send to"
        },
        text: {
          type: "string",
          description: "Message text (supports Slack markdown)"
        },
        thread_ts: {
          type: "string",
          description: "Thread timestamp to reply to (optional)"
        }
      },
      required: ["channel_id", "text"]
    }
  },
  {
    name: "slack_get_thread",
    description: "Get all replies in a message thread",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          description: "Channel or DM ID"
        },
        thread_ts: {
          type: "string",
          description: "Thread parent message timestamp"
        }
      },
      required: ["channel_id", "thread_ts"]
    }
  },
  {
    name: "slack_list_users",
    description: "List all users in the workspace",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum users to return (default 500, supports pagination)"
        }
      }
    }
  }
];
