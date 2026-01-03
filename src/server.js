#!/usr/bin/env node
/**
 * Slack MCP Server
 *
 * A Model Context Protocol server for Slack integration.
 * Provides read/write access to Slack messages, channels, and users.
 *
 * @version 1.0.0
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { loadTokens } from "../lib/token-store.js";
import { TOOLS } from "../lib/tools.js";
import {
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

// Package info
const SERVER_NAME = "slack-mcp-server";
const SERVER_VERSION = "1.0.0";

// Initialize server
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

// Main entry point
async function main() {
  // Check for credentials at startup
  const credentials = loadTokens();
  if (!credentials) {
    console.error("WARNING: No Slack credentials found at startup");
    console.error("Will attempt Chrome auto-extraction on first API call");
  } else {
    console.error(`Credentials loaded from: ${credentials.source}`);
  }

  // Start server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`${SERVER_NAME} v${SERVER_VERSION} running`);
}

main().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});
