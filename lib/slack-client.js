/**
 * Slack API Client
 *
 * Handles all Slack API communication with:
 * - Automatic token refresh on auth failure
 * - User name caching
 * - Rate limiting
 */

import { loadTokens, saveTokens, extractFromChrome } from "./token-store.js";

// User cache to avoid repeated API calls
const userCache = new Map();

/**
 * Make an authenticated Slack API call
 */
export async function slackAPI(method, params = {}, options = {}) {
  const { retryOnAuthFail = true, retryCount = 0, maxRetries = 3, logger = console } = options;

  const creds = loadTokens(false, logger);
  if (!creds) {
    throw new Error("No credentials available. Run refresh-tokens.sh or open Slack in Chrome.");
  }

  const response = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${creds.token}`,
      "Cookie": `d=${creds.cookie}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(params),
  });

  const data = await response.json();

  if (!data.ok) {
    // Handle rate limiting with exponential backoff
    if (data.error === "ratelimited" && retryCount < maxRetries) {
      const retryAfter = parseInt(response.headers.get("Retry-After") || "5", 10);
      const backoff = Math.min(retryAfter * 1000, 30000) * (retryCount + 1);
      logger.error(`Rate limited on ${method}, waiting ${backoff}ms before retry ${retryCount + 1}/${maxRetries}`);
      await sleep(backoff);
      return slackAPI(method, params, { ...options, retryCount: retryCount + 1 });
    }

    // Handle auth errors with auto-retry
    if ((data.error === "invalid_auth" || data.error === "token_expired") && retryOnAuthFail) {
      logger.error("Token expired, attempting Chrome auto-extraction...");
      const chromeTokens = extractFromChrome();
      if (chromeTokens) {
        saveTokens(chromeTokens.token, chromeTokens.cookie);
        // Retry the request
        return slackAPI(method, params, { ...options, retryOnAuthFail: false });
      }
      throw new Error(`${data.error} - Tokens expired. Open Slack in Chrome and use slack_refresh_tokens.`);
    }
    throw new Error(data.error || "Slack API error");
  }

  return data;
}

/**
 * Resolve user ID to real name (with caching)
 */
export async function resolveUser(userId, options = {}) {
  if (!userId) return "unknown";
  if (userCache.has(userId)) return userCache.get(userId);

  try {
    const result = await slackAPI("users.info", { user: userId }, options);
    const name = result.user?.real_name || result.user?.name || userId;
    userCache.set(userId, name);
    return name;
  } catch (e) {
    userCache.set(userId, userId);
    return userId;
  }
}

/**
 * Clear the user cache
 */
export function clearUserCache() {
  userCache.clear();
}

/**
 * Get user cache stats
 */
export function getUserCacheStats() {
  return {
    size: userCache.size,
    entries: Array.from(userCache.entries())
  };
}

/**
 * Format a Slack timestamp to ISO string
 */
export function formatTimestamp(ts) {
  return new Date(parseFloat(ts) * 1000).toISOString();
}

/**
 * Convert ISO date to Slack timestamp
 */
export function toSlackTimestamp(isoDate) {
  return (new Date(isoDate).getTime() / 1000).toString();
}

/**
 * Sleep for rate limiting
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
