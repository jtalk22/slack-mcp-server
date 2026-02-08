/**
 * Slack API Client
 *
 * Handles all Slack API communication with:
 * - Automatic token refresh on auth failure
 * - User name caching with LRU + TTL
 * - Rate limiting
 * - Network error retry with exponential backoff
 * - Proactive token health checking
 */

import { loadTokens, saveTokens, extractFromChrome } from "./token-store.js";

// ============ Configuration ============

const TOKEN_WARNING_AGE = 6 * 60 * 60 * 1000;  // 6 hours
const TOKEN_CRITICAL_AGE = 10 * 60 * 60 * 1000; // 10 hours
const REFRESH_COOLDOWN = 60 * 60 * 1000;        // 1 hour between refresh attempts
const USER_CACHE_MAX_SIZE = 500;
const USER_CACHE_TTL = 60 * 60 * 1000;          // 1 hour

const RETRYABLE_NETWORK_ERRORS = [
  'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN',
  'ECONNREFUSED', 'EPIPE', 'UND_ERR_CONNECT_TIMEOUT'
];

// Slack API methods that require form-encoded params instead of JSON
const FORM_ENCODED_METHODS = new Set([
  "conversations.replies",
  "search.messages",
  "search.all",
  "search.files",
]);

let lastRefreshAttempt = 0;

// ============ LRU Cache with TTL ============

class LRUCache {
  constructor(maxSize = 500, ttlMs = 60 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.cache = new Map();
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key, value) {
    // Delete if exists (to update position)
    this.cache.delete(key);
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttlMs
    });
  }

  has(key) {
    return this.get(key) !== null;
  }

  get size() { return this.cache.size; }

  clear() { this.cache.clear(); }

  stats() {
    return { size: this.cache.size, maxSize: this.maxSize, ttlMs: this.ttlMs };
  }
}

// User cache with LRU + TTL
const userCache = new LRUCache(USER_CACHE_MAX_SIZE, USER_CACHE_TTL);

// ============ Token Health ============

/**
 * Check token health and attempt proactive refresh if needed
 */
export async function checkTokenHealth(logger = console) {
  const silentLogger = { error: () => {}, warn: () => {}, log: () => {} };
  const creds = loadTokens(false, silentLogger);

  if (!creds) {
    return { healthy: false, reason: 'no_tokens', message: 'No credentials found' };
  }

  const tokenAge = creds.updatedAt
    ? Date.now() - new Date(creds.updatedAt).getTime()
    : Infinity;
  const ageHours = Math.round(tokenAge / (60 * 60 * 1000) * 10) / 10;

  // Attempt proactive refresh if token is getting old
  if (tokenAge > TOKEN_WARNING_AGE && Date.now() - lastRefreshAttempt > REFRESH_COOLDOWN) {
    lastRefreshAttempt = Date.now();
    logger.error?.(`Token is ${ageHours}h old, attempting proactive refresh...`);

    const newTokens = extractFromChrome();
    if (newTokens) {
      saveTokens(newTokens.token, newTokens.cookie);
      logger.error?.('Proactively refreshed tokens from Chrome');
      return {
        healthy: true,
        refreshed: true,
        age_hours: 0,
        source: 'chrome-auto',
        message: 'Tokens refreshed successfully'
      };
    } else {
      logger.error?.('Could not refresh from Chrome (is Slack tab open?)');
    }
  }

  return {
    healthy: tokenAge < TOKEN_CRITICAL_AGE,
    age_hours: ageHours,
    warning: tokenAge > TOKEN_WARNING_AGE,
    critical: tokenAge > TOKEN_CRITICAL_AGE,
    source: creds.source,
    updated_at: creds.updatedAt,
    message: tokenAge > TOKEN_CRITICAL_AGE
      ? 'Token may expire soon - open Slack in Chrome'
      : tokenAge > TOKEN_WARNING_AGE
        ? 'Token is getting old - will auto-refresh if Slack tab is open'
        : 'Token is healthy'
  };
}

/**
 * Make an authenticated Slack API call
 * Features: auth retry, rate limit handling, network error retry
 */
export async function slackAPI(method, params = {}, options = {}) {
  const { retryOnAuthFail = true, retryCount = 0, maxRetries = 3, logger = console } = options;

  const creds = loadTokens(false, logger);
  if (!creds) {
    throw new Error("No credentials available. Run refresh-tokens.sh or open Slack in Chrome.");
  }

  // Proactive token health check (non-blocking, only on first attempt)
  if (retryCount === 0) {
    checkTokenHealth({ error: () => {} }).catch(() => {});
  }

  const useForm = FORM_ENCODED_METHODS.has(method);

  let response;
  try {
    const headers = {
      "Authorization": `Bearer ${creds.token}`,
      "Cookie": `d=${creds.cookie}`,
    };

    let body;
    if (useForm) {
      // URLSearchParams coerces non-primitives to "[object Object]",
      // so stringify any arrays/objects before encoding.
      const safeParams = {};
      for (const [key, value] of Object.entries(params)) {
        safeParams[key] = (typeof value === "object" && value !== null)
          ? JSON.stringify(value)
          : String(value);
      }
      headers["Content-Type"] = "application/x-www-form-urlencoded; charset=utf-8";
      body = new URLSearchParams(safeParams).toString();
    } else {
      headers["Content-Type"] = "application/json; charset=utf-8";
      body = JSON.stringify(params);
    }

    response = await fetch(`https://slack.com/api/${method}`, {
      method: "POST",
      headers,
      body,
    });
  } catch (networkError) {
    // Retry on network errors with exponential backoff + jitter
    if (retryCount < maxRetries) {
      const isRetryable = RETRYABLE_NETWORK_ERRORS.some(e =>
        networkError.message?.includes(e) ||
        networkError.code === e ||
        networkError.cause?.code === e
      );
      if (isRetryable || networkError.message?.includes('fetch')) {
        const backoff = Math.min(1000 * Math.pow(2, retryCount), 10000);
        const jitter = Math.random() * 1000;
        logger.error?.(`Network error on ${method}: ${networkError.message}, retry ${retryCount + 1}/${maxRetries} in ${Math.round(backoff + jitter)}ms`);
        await sleep(backoff + jitter);
        return slackAPI(method, params, { ...options, retryCount: retryCount + 1 });
      }
    }
    throw networkError;
  }

  const data = await response.json();

  if (!data.ok) {
    // Handle rate limiting with exponential backoff
    if (data.error === "ratelimited" && retryCount < maxRetries) {
      const retryAfter = parseInt(response.headers.get("Retry-After") || "5", 10);
      const backoff = Math.min(retryAfter * 1000, 30000) * (retryCount + 1);
      const jitter = Math.random() * 1000;
      logger.error?.(`Rate limited on ${method}, waiting ${Math.round(backoff + jitter)}ms before retry ${retryCount + 1}/${maxRetries}`);
      await sleep(backoff + jitter);
      return slackAPI(method, params, { ...options, retryCount: retryCount + 1 });
    }

    // Handle auth errors with auto-retry
    if ((data.error === "invalid_auth" || data.error === "token_expired") && retryOnAuthFail) {
      logger.error?.("Token expired, attempting Chrome auto-extraction...");
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
 * Resolve user ID to real name (with LRU caching)
 */
export async function resolveUser(userId, options = {}) {
  if (!userId) return "unknown";

  const cached = userCache.get(userId);
  if (cached) return cached;

  try {
    const result = await slackAPI("users.info", { user: userId }, options);
    const name = result.user?.real_name || result.user?.name || userId;
    userCache.set(userId, name);
    return name;
  } catch (e) {
    // Cache the ID itself to avoid repeated failed lookups
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
  return userCache.stats();
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
