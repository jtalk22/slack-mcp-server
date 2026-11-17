/**
 * The hosted notice
 *
 * One plain statement that a hosted version exists, in two places: a line on
 * stderr when a server starts, and a hosted_tier field in the
 * slack_health_check result.
 *
 * Rules:
 * - No network call and no telemetry. The URL is text; nothing here fetches it.
 * - Nothing on stdout. On the stdio server stdout is the MCP channel.
 * - One line per process, however many times it is asked for.
 * - The same switch the OAuth Lifeboat honours: SLACK_MCP_NO_UPSELL=1 hides it.
 * - It says what the hosted tier does and what it costs. It says nothing about
 *   how the hosted tier connects to Slack, so it stays true while that changes.
 */

export const HOSTED_URL = "https://mcp.revasserlabs.com";
export const HOSTED_NOTICE_SWITCH = "SLACK_MCP_NO_UPSELL";

const SUMMARY =
  "Runs your saved catch-up on a schedule while your laptop is closed. " +
  "There is a free tier; scheduled delivery is on the paid plans.";

let printed = false;

/**
 * Tests only: forget that the line was printed.
 */
export function resetHostedNotice() {
  printed = false;
}

export function hostedNoticeEnabled(env = process.env) {
  return env[HOSTED_NOTICE_SWITCH] !== "1";
}

/**
 * The line a server prints at start.
 */
export function hostedNoticeLine() {
  return `Hosted tier: ${SUMMARY} ${HOSTED_URL} (hide this line with ${HOSTED_NOTICE_SWITCH}=1)`;
}

/**
 * Print the line to stderr, once per process, unless it is switched off.
 * Returns true when it wrote.
 */
export function printHostedNoticeOnce({ stream = process.stderr, env = process.env } = {}) {
  if (printed || !hostedNoticeEnabled(env)) return false;
  printed = true;
  stream.write(`${hostedNoticeLine()}\n`);
  return true;
}

/**
 * The hosted_tier field for a status result, or undefined when switched off.
 */
export function hostedVersionField(env = process.env) {
  if (!hostedNoticeEnabled(env)) return undefined;
  return {
    summary: SUMMARY,
    url: HOSTED_URL,
    hide_with: `${HOSTED_NOTICE_SWITCH}=1`,
  };
}
