/**
 * Slack MCP Server - Cloudflare Worker
 *
 * Exposes MCP tools via Streamable HTTP transport for Smithery/hosted deployments.
 * User credentials passed via headers or session.
 */

// MCP Prompts
const PROMPTS = [
  {
    name: "search-recent",
    description: "Search workspace for messages from the past week",
    arguments: [{ name: "query", description: "Search terms to look for", required: true }]
  },
  {
    name: "summarize-channel",
    description: "Get recent activity from a channel for summarization",
    arguments: [
      { name: "channel_id", description: "Channel ID to summarize", required: true },
      { name: "days", description: "Number of days to look back (default 7)", required: false }
    ]
  },
  {
    name: "find-messages-from",
    description: "Find all messages from a specific user",
    arguments: [{ name: "username", description: "Username or display name to search for", required: true }]
  }
];

// MCP Resources
const RESOURCES = [
  {
    uri: "slack://workspace/info",
    name: "Workspace Info",
    description: "Current workspace name, team, and authenticated user",
    mimeType: "application/json"
  },
  {
    uri: "slack://conversations/list",
    name: "Conversations",
    description: "List of available channels and DMs",
    mimeType: "application/json"
  }
];

const TOOLS = [
  {
    name: "slack_health_check",
    description: "Check if Slack API connection is working",
    inputSchema: { type: "object", properties: {} },
    annotations: { title: "Health Check", readOnlyHint: true, idempotentHint: true, openWorldHint: true }
  },
  {
    name: "slack_list_conversations",
    description: "List Slack conversations (channels and DMs)",
    inputSchema: {
      type: "object",
      properties: {
        types: { type: "string", description: "Comma-separated: public_channel,private_channel,mpim,im" },
        limit: { type: "number", description: "Max results (default 100)" }
      }
    },
    annotations: { title: "List Conversations", readOnlyHint: true, idempotentHint: true, openWorldHint: true }
  },
  {
    name: "slack_conversations_history",
    description: "Get messages from a channel or DM",
    inputSchema: {
      type: "object",
      properties: {
        channel: { type: "string", description: "Channel ID" },
        limit: { type: "number", description: "Max messages" }
      },
      required: ["channel"]
    },
    annotations: { title: "Conversation History", readOnlyHint: true, idempotentHint: true, openWorldHint: true }
  },
  {
    name: "slack_search_messages",
    description: "Search messages across workspace",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        count: { type: "number", description: "Max results" }
      },
      required: ["query"]
    },
    annotations: { title: "Search Messages", readOnlyHint: true, idempotentHint: true, openWorldHint: true }
  },
  {
    name: "slack_send_message",
    description: "Send a message to a channel or DM",
    inputSchema: {
      type: "object",
      properties: {
        channel: { type: "string", description: "Channel ID" },
        text: { type: "string", description: "Message text" },
        thread_ts: { type: "string", description: "Thread timestamp for replies" }
      },
      required: ["channel", "text"]
    },
    annotations: { title: "Send Message", readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
  },
  {
    name: "slack_get_thread",
    description: "Get replies in a thread",
    inputSchema: {
      type: "object",
      properties: {
        channel: { type: "string", description: "Channel ID" },
        thread_ts: { type: "string", description: "Thread timestamp" }
      },
      required: ["channel", "thread_ts"]
    },
    annotations: { title: "Get Thread", readOnlyHint: true, idempotentHint: true, openWorldHint: true }
  },
  {
    name: "slack_users_info",
    description: "Get user profile information",
    inputSchema: {
      type: "object",
      properties: {
        user: { type: "string", description: "User ID" }
      },
      required: ["user"]
    },
    annotations: { title: "User Info", readOnlyHint: true, idempotentHint: true, openWorldHint: true }
  },
  {
    name: "slack_list_users",
    description: "List workspace users",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max results" }
      }
    },
    annotations: { title: "List Users", readOnlyHint: true, idempotentHint: true, openWorldHint: true }
  }
];

// Slack API wrapper
async function slackApi(method, params, token, cookie) {
  const url = `https://slack.com/api/${method}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Cookie': `d=${cookie}`,
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify(params)
  });
  return response.json();
}

// Handle tool calls
async function handleToolCall(name, args, env, queryParams) {
  // Accept tokens from query params (Smithery) or env vars
  const token = queryParams?.slackToken || env.SLACK_TOKEN;
  const cookie = queryParams?.slackCookie || env.SLACK_COOKIE;

  if (!token || !cookie) {
    return { content: [{ type: "text", text: "Missing SLACK_TOKEN or SLACK_COOKIE" }], isError: true };
  }

  try {
    switch (name) {
      case "slack_health_check": {
        const result = await slackApi('auth.test', {}, token, cookie);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "slack_list_conversations": {
        const result = await slackApi('conversations.list', {
          types: args.types || 'public_channel,private_channel,mpim,im',
          limit: args.limit || 100
        }, token, cookie);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "slack_conversations_history": {
        const result = await slackApi('conversations.history', {
          channel: args.channel,
          limit: args.limit || 50
        }, token, cookie);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "slack_search_messages": {
        const result = await slackApi('search.messages', {
          query: args.query,
          count: args.count || 20
        }, token, cookie);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "slack_send_message": {
        const result = await slackApi('chat.postMessage', {
          channel: args.channel,
          text: args.text,
          thread_ts: args.thread_ts
        }, token, cookie);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "slack_get_thread": {
        const result = await slackApi('conversations.replies', {
          channel: args.channel,
          ts: args.thread_ts
        }, token, cookie);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "slack_users_info": {
        const result = await slackApi('users.info', { user: args.user }, token, cookie);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "slack_list_users": {
        const result = await slackApi('users.list', { limit: args.limit || 100 }, token, cookie);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      default:
        return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (error) {
    return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
  }
}

// Handle MCP JSON-RPC requests
async function handleMcpRequest(request, env, queryParams) {
  const body = await request.json();

  // JSON-RPC 2.0 response helper
  const jsonRpcResponse = (id, result) => ({
    jsonrpc: "2.0",
    id,
    result
  });

  const jsonRpcError = (id, code, message) => ({
    jsonrpc: "2.0",
    id,
    error: { code, message }
  });

  // Handle batch or single request
  const requests = Array.isArray(body) ? body : [body];
  const responses = [];

  for (const req of requests) {
    const { method, params, id } = req;

    switch (method) {
      case "initialize":
        responses.push(jsonRpcResponse(id, {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {}, prompts: {}, resources: {} },
          serverInfo: { name: "slack-mcp-server", version: "1.2.0" }
        }));
        break;

      case "tools/list":
        responses.push(jsonRpcResponse(id, { tools: TOOLS }));
        break;

      case "tools/call":
        const result = await handleToolCall(params.name, params.arguments || {}, env, queryParams);
        responses.push(jsonRpcResponse(id, result));
        break;

      case "prompts/list":
        responses.push(jsonRpcResponse(id, { prompts: PROMPTS }));
        break;

      case "prompts/get": {
        const promptName = params.name;
        const promptArgs = params.arguments || {};
        let messages = [];
        if (promptName === "search-recent") {
          const query = promptArgs.query || "";
          messages = [{ role: "user", content: { type: "text", text: `Search Slack for "${query}" from the past week.` }}];
        } else if (promptName === "summarize-channel") {
          messages = [{ role: "user", content: { type: "text", text: `Get recent messages from channel ${promptArgs.channel_id} and summarize.` }}];
        } else if (promptName === "find-messages-from") {
          messages = [{ role: "user", content: { type: "text", text: `Find messages from ${promptArgs.username}.` }}];
        }
        responses.push(jsonRpcResponse(id, { messages }));
        break;
      }

      case "resources/list":
        responses.push(jsonRpcResponse(id, { resources: RESOURCES }));
        break;

      case "resources/read": {
        const uri = params.uri;
        let contents = [];
        if (uri === "slack://workspace/info") {
          contents = [{ uri, mimeType: "application/json", text: JSON.stringify({ note: "Use slack_health_check tool for live data" }) }];
        } else if (uri === "slack://conversations/list") {
          contents = [{ uri, mimeType: "application/json", text: JSON.stringify({ note: "Use slack_list_conversations tool for live data" }) }];
        }
        responses.push(jsonRpcResponse(id, { contents }));
        break;
      }

      case "notifications/initialized":
        // No response needed for notifications
        break;

      default:
        responses.push(jsonRpcError(id, -32601, `Method not found: ${method}`));
    }
  }

  return Array.isArray(body) ? responses : responses[0];
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, mcp-session-id, Authorization'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Health check
    if (url.pathname === '/health') {
      return Response.json(
        { status: 'ok', server: 'slack-mcp-server', version: '1.2.0' },
        { headers: corsHeaders }
      );
    }

    // MCP endpoint
    if ((url.pathname === '/mcp' || url.pathname === '/') && request.method === 'POST') {
      try {
        // Extract query params for Smithery-style token passing
        const queryParams = {
          slackToken: url.searchParams.get('slackToken'),
          slackCookie: url.searchParams.get('slackCookie')
        };
        const result = await handleMcpRequest(request, env, queryParams);
        return Response.json(result, { headers: corsHeaders });
      } catch (error) {
        return Response.json(
          { jsonrpc: "2.0", error: { code: -32700, message: error.message } },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });
  }
};
