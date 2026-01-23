/**
 * Slack MCP Server - Cloudflare Worker
 *
 * Exposes MCP tools via Streamable HTTP transport for Smithery/hosted deployments.
 * User credentials passed via headers or session.
 */

const TOOLS = [
  {
    name: "slack_health_check",
    description: "Check if Slack API connection is working",
    inputSchema: { type: "object", properties: {} }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
  },
  {
    name: "slack_list_users",
    description: "List workspace users",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max results" }
      }
    }
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
          capabilities: { tools: {} },
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
