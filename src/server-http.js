#!/usr/bin/env node
/**
 * Slack MCP Server - HTTP Transport
 *
 * Streamable HTTP version for hosted deployments (Smithery, etc.)
 * Tokens provided via environment variables.
 */

import http from 'node:http';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { TOOLS } from "../lib/tools.js";
import {
  handleTokenStatus,
  handleHealthCheck,
  handleRefreshTokens,
  handleListConversations,
  handleConversationsHistory,
  handleGetFullConversation,
  handleSearchMessages,
  handleUsersInfo,
  handleSendMessage,
  handleGetThread,
  handleListUsers,
} from "../lib/handlers.js";

const SERVER_NAME = "slack-mcp-server";
const SERVER_VERSION = "1.2.0";
const PORT = process.env.PORT || 3000;

// Create MCP server
const server = new Server(
  { name: SERVER_NAME, version: SERVER_VERSION },
  { capabilities: { tools: {} } }
);

// Register tool list handler
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS
}));

// Register tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "slack_token_status":
        return await handleTokenStatus();
      case "slack_health_check":
        return await handleHealthCheck();
      case "slack_refresh_tokens":
        return await handleRefreshTokens();
      case "slack_list_conversations":
        return await handleListConversations(args);
      case "slack_conversations_history":
        return await handleConversationsHistory(args);
      case "slack_get_full_conversation":
        return await handleGetFullConversation(args);
      case "slack_search_messages":
        return await handleSearchMessages(args);
      case "slack_users_info":
        return await handleUsersInfo(args);
      case "slack_send_message":
        return await handleSendMessage(args);
      case "slack_get_thread":
        return await handleGetThread(args);
      case "slack_list_users":
        return await handleListUsers(args);
      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true
        };
    }
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true
    };
  }
});

// Create HTTP transport
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => crypto.randomUUID(),
});

// Connect server to transport
await server.connect(transport);

// Create HTTP server
const httpServer = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', server: SERVER_NAME, version: SERVER_VERSION }));
    return;
  }

  // MCP endpoint
  if (req.url === '/mcp' || req.url === '/') {
    await transport.handleRequest(req, res);
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

httpServer.listen(PORT, () => {
  console.log(`${SERVER_NAME} v${SERVER_VERSION} HTTP server running on port ${PORT}`);
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
});
