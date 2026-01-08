#!/usr/bin/env node
/**
 * Slack Web API Server
 *
 * Exposes Slack MCP tools as REST endpoints for browser access.
 * Run alongside or instead of the MCP server for web-based access.
 *
 * @version 1.0.5
 */

import express from "express";
import { randomBytes } from "crypto";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { homedir } from "os";
import { loadTokens } from "../lib/token-store.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
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

const app = express();
const PORT = process.env.PORT || 3000;

// Secure API key management
const API_KEY_FILE = join(homedir(), ".slack-mcp-api-key");

function getOrCreateAPIKey() {
  // Priority 1: Environment variable
  if (process.env.SLACK_API_KEY) {
    return process.env.SLACK_API_KEY;
  }

  // Priority 2: Key file
  if (existsSync(API_KEY_FILE)) {
    try {
      return readFileSync(API_KEY_FILE, "utf-8").trim();
    } catch {}
  }

  // Priority 3: Generate new secure key
  const newKey = `smcp_${randomBytes(24).toString('base64url')}`;
  try {
    writeFileSync(API_KEY_FILE, newKey);
    execSync(`chmod 600 "${API_KEY_FILE}"`);
  } catch {}

  return newKey;
}

const API_KEY = getOrCreateAPIKey();

// Middleware
app.use(express.json());
app.use(express.static(join(__dirname, "../public")));

// CORS for local development
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// API Key authentication
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const providedKey = authHeader?.replace("Bearer ", "");

  if (providedKey !== API_KEY) {
    return res.status(401).json({ error: "Invalid API key" });
  }
  next();
}

// Helper to extract response content
function extractContent(result) {
  if (result.content && result.content[0] && result.content[0].text) {
    try {
      return JSON.parse(result.content[0].text);
    } catch {
      return { text: result.content[0].text };
    }
  }
  return result;
}

// Root endpoint (no auth required)
app.get("/", (req, res) => {
  res.json({
    name: "Slack Web API Server",
    version: "1.0.0",
    status: "running",
    endpoints: [
      "GET  /health",
      "POST /refresh",
      "GET  /conversations",
      "GET  /conversations/:id/history",
      "GET  /conversations/:id/full",
      "GET  /conversations/:id/thread/:ts",
      "GET  /search",
      "POST /messages",
      "GET  /users",
      "GET  /users/:id",
    ],
    docs: "Add Authorization: Bearer <api-key> header to all requests"
  });
});

// Token status (detailed health + cache info)
app.get("/token-status", authenticate, async (req, res) => {
  try {
    const result = await handleTokenStatus();
    res.json(extractContent(result));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Health check
app.get("/health", authenticate, async (req, res) => {
  try {
    const result = await handleHealthCheck();
    res.json(extractContent(result));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Refresh tokens
app.post("/refresh", authenticate, async (req, res) => {
  try {
    const result = await handleRefreshTokens();
    res.json(extractContent(result));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// List conversations
app.get("/conversations", authenticate, async (req, res) => {
  try {
    const result = await handleListConversations({
      types: req.query.types || "im,mpim",
      limit: parseInt(req.query.limit) || 100
    });
    res.json(extractContent(result));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get conversation history
app.get("/conversations/:id/history", authenticate, async (req, res) => {
  try {
    const result = await handleConversationsHistory({
      channel_id: req.params.id,
      limit: parseInt(req.query.limit) || 50,
      oldest: req.query.oldest,
      latest: req.query.latest,
      resolve_users: req.query.resolve_users !== "false"
    });
    res.json(extractContent(result));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get full conversation with threads
app.get("/conversations/:id/full", authenticate, async (req, res) => {
  try {
    const result = await handleGetFullConversation({
      channel_id: req.params.id,
      oldest: req.query.oldest,
      latest: req.query.latest,
      max_messages: parseInt(req.query.max_messages) || 2000,
      include_threads: req.query.include_threads !== "false",
      output_file: req.query.output_file
    });
    res.json(extractContent(result));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get thread
app.get("/conversations/:id/thread/:ts", authenticate, async (req, res) => {
  try {
    const result = await handleGetThread({
      channel_id: req.params.id,
      thread_ts: req.params.ts
    });
    res.json(extractContent(result));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Search messages
app.get("/search", authenticate, async (req, res) => {
  try {
    if (!req.query.q) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }
    const result = await handleSearchMessages({
      query: req.query.q,
      count: parseInt(req.query.count) || 20
    });
    res.json(extractContent(result));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Send message
app.post("/messages", authenticate, async (req, res) => {
  try {
    if (!req.body.channel_id || !req.body.text) {
      return res.status(400).json({ error: "channel_id and text are required" });
    }
    const result = await handleSendMessage({
      channel_id: req.body.channel_id,
      text: req.body.text,
      thread_ts: req.body.thread_ts
    });
    res.json(extractContent(result));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// List users
app.get("/users", authenticate, async (req, res) => {
  try {
    const result = await handleListUsers({
      limit: parseInt(req.query.limit) || 100
    });
    res.json(extractContent(result));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get user info
app.get("/users/:id", authenticate, async (req, res) => {
  try {
    const result = await handleUsersInfo({
      user_id: req.params.id
    });
    res.json(extractContent(result));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Start server
async function main() {
  // Check for credentials
  const credentials = loadTokens();
  if (!credentials) {
    console.error("WARNING: No Slack credentials found");
    console.error("Run: npm run tokens:auto");
  } else {
    console.log(`Credentials loaded from: ${credentials.source}`);
  }

  app.listen(PORT, () => {
    console.log(`\n🚀 Slack Web API Server running at http://localhost:${PORT}`);
    console.log(`\n🔑 API Key: ${API_KEY}`);
    console.log(`\nExample usage:`);
    console.log(`  curl -H "Authorization: Bearer ${API_KEY}" http://localhost:${PORT}/health`);
    console.log(`  curl -H "Authorization: Bearer ${API_KEY}" http://localhost:${PORT}/conversations`);
  });
}

main().catch(e => {
  console.error("Fatal error:", e);
  process.exit(1);
});
