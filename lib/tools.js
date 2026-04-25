/**
 * MCP Tool Definitions
 *
 * All Slack MCP tools in one place for easy maintenance.
 * Includes MCP annotations for better tool discovery and safety hints.
 */

export const TOOLS = [
  {
    name: "slack_token_status",
    description: "Check token health, age, auto-refresh status, and cache stats",
    inputSchema: {
      type: "object",
      properties: {}
    },
    annotations: {
      title: "Token Status",
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  {
    name: "slack_health_check",
    description: "Check if Slack tokens are valid and show authentication status",
    inputSchema: {
      type: "object",
      properties: {}
    },
    annotations: {
      title: "Health Check",
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: "slack_refresh_tokens",
    description: "Force refresh tokens by extracting from Chrome (requires Slack tab open in Chrome)",
    inputSchema: {
      type: "object",
      properties: {}
    },
    annotations: {
      title: "Refresh Tokens",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
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
    },
    annotations: {
      title: "List Conversations",
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: true
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
    },
    annotations: {
      title: "Conversation History",
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: true
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
    },
    annotations: {
      title: "Full Conversation Export",
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: true
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
    },
    annotations: {
      title: "Search Messages",
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: true
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
    },
    annotations: {
      title: "User Info",
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: true
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
    },
    annotations: {
      title: "Send Message",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true
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
    },
    annotations: {
      title: "Get Thread",
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: true
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
    },
    annotations: {
      title: "List Users",
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: "slack_add_reaction",
    description: "Add an emoji reaction to a message",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          description: "Channel or DM ID containing the message"
        },
        timestamp: {
          type: "string",
          description: "Message timestamp to react to"
        },
        reaction: {
          type: "string",
          description: "Emoji name without colons (e.g., 'thumbsup', 'eyes', 'white_check_mark')"
        }
      },
      required: ["channel_id", "timestamp", "reaction"]
    },
    annotations: {
      title: "Add Reaction",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: "slack_remove_reaction",
    description: "Remove an emoji reaction from a message",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          description: "Channel or DM ID containing the message"
        },
        timestamp: {
          type: "string",
          description: "Message timestamp to remove reaction from"
        },
        reaction: {
          type: "string",
          description: "Emoji name without colons (e.g., 'thumbsup', 'eyes')"
        }
      },
      required: ["channel_id", "timestamp", "reaction"]
    },
    annotations: {
      title: "Remove Reaction",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: "slack_conversations_mark",
    description: "Mark a conversation as read up to a specific message timestamp",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          description: "Channel or DM ID to mark as read"
        },
        timestamp: {
          type: "string",
          description: "Message timestamp to mark as read up to (all messages at or before this are marked read)"
        }
      },
      required: ["channel_id", "timestamp"]
    },
    annotations: {
      title: "Mark as Read",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: "slack_conversations_unreads",
    description: "Get channels and DMs with unread messages, sorted by unread count (highest first)",
    inputSchema: {
      type: "object",
      properties: {
        types: {
          type: "string",
          description: "Comma-separated types: im, mpim, public_channel, private_channel (default all)",
          default: "im,mpim,public_channel,private_channel"
        },
        limit: {
          type: "number",
          description: "Maximum conversations to return (default 50)"
        }
      }
    },
    annotations: {
      title: "Unread Conversations",
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: "slack_users_search",
    description: "Search workspace users by name, display name, or email. Case-insensitive partial match.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search term to match against name, display name, real name, or email"
        },
        limit: {
          type: "number",
          description: "Maximum results to return (default 20)"
        }
      },
      required: ["query"]
    },
    annotations: {
      title: "Search Users",
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  // ============ Workflow Profile Primitives (OSS) ============
  // Local JSON storage at ~/.slack-mcp-workflows.json. Defines the
  // structural primitive that the hosted AI brain (smart_search,
  // catch_me_up, triage) consumes to return structured JSON.
  {
    name: "slack_workflow_save",
    description: "Save or update a workflow profile that binds a workflow_kind (support_inbox | incident_room | exec_brief | product_launch_watch | custom) to channels, priority people, retention mode, and summary cadence. Stored locally at ~/.slack-mcp-workflows.json. Hosted brain reads these to return structured JSON per the workflow_kind.",
    inputSchema: {
      type: "object",
      properties: {
        profile_name: {
          type: "string",
          description: "Unique name for this workflow profile (e.g. 'morning-exec-brief', 'on-call-rotation')"
        },
        workflow_kind: {
          type: "string",
          enum: ["support_inbox", "incident_room", "exec_brief", "product_launch_watch", "custom"],
          description: "Workflow kind. Determines structured JSON output shape from the hosted AI brain."
        },
        channels: {
          type: "array",
          items: { type: "string" },
          description: "Slack channel IDs to read (e.g. ['C012345', 'C067890'])"
        },
        priority_people: {
          type: "array",
          items: { type: "string" },
          description: "Slack user IDs whose messages get extra weight in summaries"
        },
        retention_mode: {
          type: "string",
          enum: ["ephemeral", "persistent"],
          description: "Token retention mode for hosted execution. Default ephemeral."
        },
        summary_cadence: {
          type: "string",
          enum: ["on_demand", "daily_8am", "weekly_monday"],
          description: "When the hosted brain auto-runs slack_catch_me_up against this profile. on_demand only on hosted free; daily_8am and weekly_monday require Pro or Team."
        }
      },
      required: ["profile_name", "workflow_kind"]
    },
    annotations: {
      title: "Save Workflow Profile",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  {
    name: "slack_workflows",
    description: "List all saved workflow profiles from ~/.slack-mcp-workflows.json. Optionally filter by workflow_kind. Returns profile_name, channels, priority_people, retention_mode, summary_cadence, structured_keys, created_at, updated_at.",
    inputSchema: {
      type: "object",
      properties: {
        workflow_kind: {
          type: "string",
          enum: ["support_inbox", "incident_room", "exec_brief", "product_launch_watch", "custom"],
          description: "Optional filter — return only profiles of this workflow_kind"
        }
      }
    },
    annotations: {
      title: "List Workflow Profiles",
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  // ============ Hosted-Only AI Tools (OSS = upgrade stubs) ============
  // These tool definitions appear in every MCP client's tool list so users
  // discover them. The OSS handlers return a structured upgrade message
  // pointing at mcp.revasserlabs.com — the hosted worker actually runs them.
  {
    name: "slack_smart_search",
    description: "Semantic + lexical hybrid search across your indexed Slack history. Returns ranked results with relevance scores, channel context, thread context, and matched terms. Hosted-only (requires Vectorize + Workers AI). Free tier ships 10 calls/month; upgrade to Pro $9/mo for unlimited at mcp.revasserlabs.com/pricing.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Natural language or keyword query (semantic + lexical hybrid)"
        },
        channel_ids: {
          type: "array",
          items: { type: "string" },
          description: "Optional — restrict search to these channel IDs"
        },
        days_back: {
          type: "number",
          description: "Optional — restrict search to the last N days (max 90 on Pro+, 7 on Free)"
        },
        limit: {
          type: "number",
          description: "Maximum results to return (default 10, max 50)"
        }
      },
      required: ["query"]
    },
    annotations: {
      title: "Smart Search (hosted)",
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: "slack_catch_me_up",
    description: "Run a structured catch-up against a saved workflow profile. Returns structured JSON per the profile's workflow_kind: support_inbox returns {open_threads, ack_lag, owner_gaps, escalations, next_actions}; incident_room returns {incident_summary, timeline, open_risks, owner_gaps, next_actions}; exec_brief returns {summary, decisions, risks, asks, action_items}; product_launch_watch returns {launch_signals, feedback_themes, blockers, metrics, next_actions}; custom returns {summary, highlights, open_questions, next_actions}. Hosted-only. Free tier ships 3 calls/month; Pro $9/mo unlocks unlimited + scheduled morning DM at 8am workspace tz.",
    inputSchema: {
      type: "object",
      properties: {
        profile_name: {
          type: "string",
          description: "Name of a workflow profile saved via slack_workflow_save (or use --apply-template at install time to seed one)"
        },
        since: {
          type: "string",
          description: "Optional ISO8601 timestamp — only consider Slack messages newer than this. Default: 24 hours ago for daily-cadence profiles, 7 days for weekly."
        }
      },
      required: ["profile_name"]
    },
    annotations: {
      title: "Catch Me Up (hosted)",
      readOnlyHint: true,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  {
    name: "slack_triage",
    description: "Classify and route Slack threads against a workflow profile. Returns triage decisions per thread: priority (low|medium|high|urgent), suggested owner, escalation flag, time-sensitivity, and a routing recommendation. Hosted-only. Free tier ships 5 triage runs per day; Pro $9/mo unlocks unlimited.",
    inputSchema: {
      type: "object",
      properties: {
        profile_name: {
          type: "string",
          description: "Name of a workflow profile saved via slack_workflow_save"
        },
        channel_ids: {
          type: "array",
          items: { type: "string" },
          description: "Optional — restrict triage to these channels (defaults to profile's channels)"
        },
        thread_ts: {
          type: "string",
          description: "Optional — triage a specific thread instead of the full inbox"
        }
      },
      required: ["profile_name"]
    },
    annotations: {
      title: "Triage (hosted)",
      readOnlyHint: true,
      idempotentHint: false,
      openWorldHint: true
    }
  }
];
