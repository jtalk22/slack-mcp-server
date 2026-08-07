#!/usr/bin/env node
/**
 * Slack MCP Server
 *
 * A Model Context Protocol server for Slack integration.
 * Provides read/write access to Slack messages, channels, and users.
 *
 * Features:
 * - Automatic token refresh from Chrome
 * - LRU user cache with TTL
 * - Network error retry with exponential backoff
 * - Background token health monitoring
 *
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { pathToFileURL } from "node:url";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { loadTokensReadOnly } from "../lib/token-store.js";
import { RELEASE_VERSION } from "../lib/public-metadata.js";
import { checkTokenHealth } from "../lib/slack-client.js";
import { getActiveToolProfile } from "../lib/tools.js";
import {
  TOOL_HANDLERS,
  handleHealthCheck,
  handleListConversations,
} from "../lib/handlers.js";
import { isAuthDeath, lifeboatResponse } from "../lib/lifeboat.js";

// Background refresh interval (4 hours)
const BACKGROUND_REFRESH_INTERVAL = 4 * 60 * 60 * 1000;

// Package info
const SERVER_NAME = "slack-mcp-server";
const SERVER_VERSION = RELEASE_VERSION;

// MCP Prompts - predefined prompt templates for common Slack operations
const PROMPTS = [
  {
    name: "search-recent",
    description: "Search workspace for messages from the past week",
    arguments: [
      {
        name: "query",
        description: "Search terms to look for",
        required: true
      }
    ]
  },
  {
    name: "summarize-channel",
    description: "Get recent activity from a channel for summarization",
    arguments: [
      {
        name: "channel_id",
        description: "Channel ID to summarize",
        required: true
      },
      {
        name: "days",
        description: "Number of days to look back (default 7)",
        required: false
      }
    ]
  },
  {
    name: "find-messages-from",
    description: "Find all messages from a specific user",
    arguments: [
      {
        name: "username",
        description: "Username or display name to search for",
        required: true
      }
    ]
  }
];

// MCP Resources - data sources the server provides
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

// Resolve the advertised tool surface once per process. SLACK_MCP_TOOLS (or
// --tools=…) can narrow it to cut per-turn schema cost; the default is the full
// surface. Handlers stay fully wired regardless of what is advertised.
const ACTIVE_TOOLS = getActiveToolProfile();

// Initialize server
const server = new Server(
  { name: SERVER_NAME, version: SERVER_VERSION },
  { capabilities: { tools: {}, prompts: {}, resources: {} } }
);

// Register tool list handler
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: ACTIVE_TOOLS.tools
}));

// Register prompts handlers
server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: PROMPTS
}));

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "search-recent": {
      const query = args?.query || "";
      const oneWeekAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Search Slack for "${query}" from the past week. Use the slack_search_messages tool with query: "${query} after:${new Date(oneWeekAgo * 1000).toISOString().split('T')[0]}"`
            }
          }
        ]
      };
    }
    case "summarize-channel": {
      const channelId = args?.channel_id || "";
      const days = parseInt(args?.days, 10) || 7;
      const since = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Get the last ${days} days of messages from channel ${channelId} and provide a summary. Use slack_conversations_history with channel_id: "${channelId}" and oldest: "${since}"`
            }
          }
        ]
      };
    }
    case "find-messages-from": {
      const username = args?.username || "";
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Find messages from ${username}. Use slack_search_messages with query: "from:@${username}"`
            }
          }
        ]
      };
    }
    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
});

// Register resources handlers
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: RESOURCES
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  switch (uri) {
    case "slack://workspace/info": {
      const result = await handleHealthCheck();
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: result.content[0].text
          }
        ]
      };
    }
    case "slack://conversations/list": {
      const result = await handleListConversations({ types: "im,mpim,public_channel,private_channel", limit: 50 });
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: result.content[0].text
          }
        ]
      };
    }
    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
});

// Register tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Shared dispatch map (lib/handlers.js) keeps this transport in lockstep
    // with the HTTP server and the advertised TOOLS list.
    const handler = TOOL_HANDLERS[name];
    if (!handler) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            status: "error",
            code: "unknown_tool",
            message: `Unknown tool: ${name}`,
            next_action: "Use tools/list to discover available tools."
          }, null, 2)
        }],
        isError: true
      };
    }
    return await handler(args);
  } catch (error) {
    // OAuth Lifeboat: dead session token → recovery guidance, not a raw error.
    if (isAuthDeath(error)) {
      return lifeboatResponse(error);
    }
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          status: "error",
          code: "tool_call_failed",
          message: String(error?.message || error),
          next_action: "Retry the call and include full arguments."
        }, null, 2)
      }],
      isError: true
    };
  }
});

// Main entry point
async function main() {
  // Check for credentials at startup
  const credentials = loadTokensReadOnly();
  if (!credentials) {
    console.error("WARNING: No Slack credentials found at startup");
    console.error("Use npx -y @jtalk22/slack-mcp --setup to configure credentials");
  } else {
    console.error(`Credentials loaded from: ${credentials.source}`);

    // Check token health on startup
    const health = await checkTokenHealth({ error: () => {} });
    if (health.warning) {
      console.error(`Token age: ${health.age_hours}h - ${health.message}`);
    }
  }

  // Background token health check (every 4 hours)
  // unref() alone doesn't prevent StdioServerTransport from keeping the event
  // loop alive after the MCP client disconnects — we add explicit shutdown
  // handlers below to kill zombie processes on stdin EOF and signals.
  const backgroundTimer = setInterval(async () => {
    try {
      const health = await checkTokenHealth(console);
      if (health.refreshed) {
        console.error("Background: tokens refreshed successfully");
      } else if (health.critical) {
        console.error("Background: tokens critical - open Slack in Chrome");
      }
    } catch (err) {
      console.error(`Background health check failed: ${err.message}`);
    }
  }, BACKGROUND_REFRESH_INTERVAL);
  backgroundTimer.unref();

  // Explicit shutdown path prevents the zombie-process pileup we were seeing
  // when Claude Code or another MCP client disconnected without signalling.
  // StdioServerTransport doesn't exit the event loop on its own when stdin EOFs.
  let shuttingDown = false;
  const shutdown = (reason) => {
    if (shuttingDown) return;
    shuttingDown = true;
    try { clearInterval(backgroundTimer); } catch {}
    console.error(`slack-mcp-server exiting: ${reason}`);
    process.exit(0);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGHUP", () => shutdown("SIGHUP"));
  process.stdin.on("end", () => shutdown("stdin end (MCP client disconnected)"));
  process.stdin.on("error", (err) => shutdown(`stdin error: ${err?.message || err}`));

  // Surface which tool profile is active so a narrowed surface is never a
  // silent surprise (and a mistyped SLACK_MCP_TOOLS says so out loud).
  if (ACTIVE_TOOLS.warning) console.error(`Tool profile: ${ACTIVE_TOOLS.warning}`);
  console.error(
    `Tool profile: ${ACTIVE_TOOLS.profile} (${ACTIVE_TOOLS.tools.length} tools, source: ${ACTIVE_TOOLS.source})`
  );

  // Start server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`${SERVER_NAME} v${SERVER_VERSION} running`);
}

function isDirectExecution() {
  if (!process.argv[1]) return false;
  try {
    return import.meta.url === pathToFileURL(process.argv[1]).href;
  } catch {
    return false;
  }
}

if (isDirectExecution()) {
  main().catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

/**
 * Smithery sandbox server for capability scanning
 * Returns a server instance with mock config for tool discovery
 */
export function createSandboxServer() {
  return server;
}
