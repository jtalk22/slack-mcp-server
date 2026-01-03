/**
 * Tool Handlers
 *
 * Implementation of all MCP tool handlers.
 */

import { writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { loadTokens, saveTokens, extractFromChrome } from "./token-store.js";
import { slackAPI, resolveUser, formatTimestamp, sleep } from "./slack-client.js";

/**
 * Health check handler
 */
export async function handleHealthCheck() {
  const creds = loadTokens();
  if (!creds) {
    return {
      content: [{
        type: "text",
        text: "NO CREDENTIALS\n\nOptions:\n1. Open Slack in Chrome, then use slack_refresh_tokens\n2. Run: ~/slack-mcp-server/scripts/refresh-tokens.sh"
      }],
      isError: true
    };
  }

  try {
    const result = await slackAPI("auth.test", {});
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          status: "OK",
          user: result.user,
          user_id: result.user_id,
          team: result.team,
          team_id: result.team_id,
          token_source: creds.source,
          token_updated: creds.updatedAt || "unknown"
        }, null, 2)
      }]
    };
  } catch (e) {
    return {
      content: [{ type: "text", text: `AUTH FAILED: ${e.message}` }],
      isError: true
    };
  }
}

/**
 * Refresh tokens handler
 */
export async function handleRefreshTokens() {
  const chromeTokens = extractFromChrome();
  if (chromeTokens) {
    saveTokens(chromeTokens.token, chromeTokens.cookie);
    try {
      const result = await slackAPI("auth.test", {}, { retryOnAuthFail: false });
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            status: "SUCCESS",
            message: "Tokens refreshed from Chrome!",
            user: result.user,
            team: result.team
          }, null, 2)
        }]
      };
    } catch (e) {
      return {
        content: [{ type: "text", text: `Extracted but invalid: ${e.message}` }],
        isError: true
      };
    }
  }
  return {
    content: [{
      type: "text",
      text: "Could not extract from Chrome.\n\nMake sure:\n1. Chrome is running\n2. Slack tab is open (app.slack.com)\n3. You're logged into Slack"
    }],
    isError: true
  };
}

/**
 * List conversations handler
 */
export async function handleListConversations(args) {
  const types = args.types || "im,mpim";
  const wantsDMs = types.includes("im") || types.includes("mpim");

  const result = await slackAPI("conversations.list", {
    types: types,
    limit: args.limit || 100,
    exclude_archived: true
  });

  const conversations = await Promise.all((result.channels || []).map(async (c) => {
    let displayName = c.name;
    if (c.is_im && c.user) {
      displayName = await resolveUser(c.user);
    }
    return {
      id: c.id,
      name: displayName,
      type: c.is_im ? "dm" : c.is_mpim ? "group_dm" : c.is_private ? "private_channel" : "public_channel",
      user_id: c.user
    };
  }));

  // xoxc tokens often don't return IMs via conversations.list
  // So we manually add DMs by opening them with known users
  if (wantsDMs) {
    try {
      const usersResult = await slackAPI("users.list", { limit: 100 });
      for (const user of (usersResult.members || [])) {
        if (user.is_bot || user.id === "USLACKBOT" || user.deleted) continue;

        // Try to open DM with each user to get channel ID
        try {
          const dmResult = await slackAPI("conversations.open", { users: user.id });
          if (dmResult.channel && dmResult.channel.id) {
            const channelId = dmResult.channel.id;
            // Only add if not already in list
            if (!conversations.find(c => c.id === channelId)) {
              conversations.push({
                id: channelId,
                name: user.real_name || user.name,
                type: "dm",
                user_id: user.id
              });
            }
          }
        } catch (e) {
          // Skip users we can't DM
        }
      }
    } catch (e) {
      // If users.list fails, continue with what we have
    }
  }

  return {
    content: [{
      type: "text",
      text: JSON.stringify({ count: conversations.length, conversations }, null, 2)
    }]
  };
}

/**
 * Conversations history handler
 */
export async function handleConversationsHistory(args) {
  const resolveUsers = args.resolve_users !== false;
  const result = await slackAPI("conversations.history", {
    channel: args.channel_id,
    limit: args.limit || 50,
    oldest: args.oldest,
    latest: args.latest,
    inclusive: true
  });

  const messages = await Promise.all((result.messages || []).map(async (msg) => {
    const userName = resolveUsers ? await resolveUser(msg.user) : msg.user;
    return {
      ts: msg.ts,
      user: userName,
      user_id: msg.user,
      text: msg.text || "",
      datetime: formatTimestamp(msg.ts),
      has_thread: !!msg.thread_ts && msg.reply_count > 0,
      reply_count: msg.reply_count
    };
  }));

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        channel: args.channel_id,
        message_count: messages.length,
        has_more: result.has_more,
        messages
      }, null, 2)
    }]
  };
}

/**
 * Full conversation export handler
 */
export async function handleGetFullConversation(args) {
  const maxMessages = Math.min(args.max_messages || 2000, 10000);
  const includeThreads = args.include_threads !== false;
  const allMessages = [];
  let cursor;
  let hasMore = true;

  // Fetch all messages with pagination
  while (hasMore && allMessages.length < maxMessages) {
    const result = await slackAPI("conversations.history", {
      channel: args.channel_id,
      limit: Math.min(100, maxMessages - allMessages.length),
      oldest: args.oldest,
      latest: args.latest,
      cursor,
      inclusive: true
    });

    for (const msg of result.messages || []) {
      const userName = await resolveUser(msg.user);
      const message = {
        ts: msg.ts,
        user: userName,
        user_id: msg.user,
        text: msg.text || "",
        datetime: formatTimestamp(msg.ts),
        replies: []
      };

      // Fetch thread replies if present
      if (includeThreads && msg.reply_count > 0) {
        try {
          const threadResult = await slackAPI("conversations.replies", {
            channel: args.channel_id,
            ts: msg.ts
          });
          // Skip first message (parent)
          for (const reply of (threadResult.messages || []).slice(1)) {
            const replyUserName = await resolveUser(reply.user);
            message.replies.push({
              ts: reply.ts,
              user: replyUserName,
              text: reply.text || "",
              datetime: formatTimestamp(reply.ts)
            });
          }
          await sleep(50); // Rate limit
        } catch (e) {
          // Skip thread on error
        }
      }

      allMessages.push(message);
    }

    hasMore = result.has_more && result.response_metadata?.next_cursor;
    cursor = result.response_metadata?.next_cursor;
    if (hasMore) await sleep(100);
  }

  // Sort chronologically
  allMessages.sort((a, b) => parseFloat(a.ts) - parseFloat(b.ts));

  const output = {
    channel: args.channel_id,
    exported_at: new Date().toISOString(),
    total_messages: allMessages.length,
    date_range: {
      oldest: args.oldest ? formatTimestamp(args.oldest) : "beginning",
      latest: args.latest ? formatTimestamp(args.latest) : "now"
    },
    messages: allMessages
  };

  // Save to file if requested
  if (args.output_file) {
    const outputPath = args.output_file.startsWith('/')
      ? args.output_file
      : join(homedir(), args.output_file);
    writeFileSync(outputPath, JSON.stringify(output, null, 2));
    output.saved_to = outputPath;
  }

  return { content: [{ type: "text", text: JSON.stringify(output, null, 2) }] };
}

/**
 * Search messages handler
 */
export async function handleSearchMessages(args) {
  const result = await slackAPI("search.messages", {
    query: args.query,
    count: args.count || 20,
    sort: "timestamp",
    sort_dir: "desc"
  });

  const matches = await Promise.all((result.messages?.matches || []).map(async (m) => ({
    ts: m.ts,
    channel: m.channel?.name || m.channel?.id,
    channel_id: m.channel?.id,
    user: await resolveUser(m.user),
    text: m.text,
    datetime: formatTimestamp(m.ts),
    permalink: m.permalink
  })));

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        query: args.query,
        total: result.messages?.total || 0,
        matches
      }, null, 2)
    }]
  };
}

/**
 * User info handler
 */
export async function handleUsersInfo(args) {
  const result = await slackAPI("users.info", { user: args.user_id });
  const user = result.user;
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        id: user.id,
        name: user.name,
        real_name: user.real_name,
        display_name: user.profile?.display_name,
        email: user.profile?.email,
        title: user.profile?.title,
        status_text: user.profile?.status_text,
        status_emoji: user.profile?.status_emoji,
        timezone: user.tz,
        is_bot: user.is_bot,
        is_admin: user.is_admin
      }, null, 2)
    }]
  };
}

/**
 * Send message handler
 */
export async function handleSendMessage(args) {
  const result = await slackAPI("chat.postMessage", {
    channel: args.channel_id,
    text: args.text,
    thread_ts: args.thread_ts
  });

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        status: "sent",
        channel: result.channel,
        ts: result.ts,
        thread_ts: args.thread_ts,
        message: result.message?.text
      }, null, 2)
    }]
  };
}

/**
 * Get thread handler
 */
export async function handleGetThread(args) {
  const result = await slackAPI("conversations.replies", {
    channel: args.channel_id,
    ts: args.thread_ts
  });

  const messages = await Promise.all((result.messages || []).map(async (msg) => ({
    ts: msg.ts,
    user: await resolveUser(msg.user),
    user_id: msg.user,
    text: msg.text || "",
    datetime: formatTimestamp(msg.ts),
    is_parent: msg.ts === args.thread_ts
  })));

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        channel: args.channel_id,
        thread_ts: args.thread_ts,
        message_count: messages.length,
        messages
      }, null, 2)
    }]
  };
}

/**
 * List users handler
 */
export async function handleListUsers(args) {
  const result = await slackAPI("users.list", {
    limit: args.limit || 100
  });

  const users = (result.members || [])
    .filter(u => !u.deleted && !u.is_bot)
    .map(u => ({
      id: u.id,
      name: u.name,
      real_name: u.real_name,
      display_name: u.profile?.display_name,
      email: u.profile?.email,
      is_admin: u.is_admin
    }));

  return {
    content: [{
      type: "text",
      text: JSON.stringify({ count: users.length, users }, null, 2)
    }]
  };
}
