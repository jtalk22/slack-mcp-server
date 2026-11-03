/**
 * Reading Slack's conversation list and its unread badges, in one place.
 *
 * `conversations.list` is the only source of names and of a per-conversation
 * unread number, and it answers in pages. Reading one page and stopping is how
 * a catch-up once missed every conversation past the first 200: a profile
 * channel on page two was never read, and nothing said so.
 *
 * `client.counts` is what Slack's own web client asks for its sidebar badges.
 * It returns every conversation's `has_unreads` and `mention_count` in one
 * call, and a `threads` block, but no names and no unread number. It is
 * undocumented (verified against a live workspace on 2026-10-07), so every read
 * of it is guarded and reports what happened in `stage`.
 */

export const SCAN_PAGE_SIZE = 200;
// 10 pages is 2,000 conversations. At the default pacing (350 ms between
// requests) the whole scan costs about 3.5 seconds.
export const SCAN_MAX_PAGES = 10;

const CONVERSATION_TYPES = "im,mpim,public_channel,private_channel";

/**
 * Page through conversations.list.
 *
 * `until(channelsSoFar)` stops early once it returns true. A profile that names
 * its channels stops as soon as every one has been seen.
 *
 * @returns {Promise<{ channels: object[], pages: number, stopped: "end_of_list"|"found_what_was_needed"|"page_cap" }>}
 */
export async function scanConversations(api, {
  types = CONVERSATION_TYPES,
  maxPages = SCAN_MAX_PAGES,
  pageSize = SCAN_PAGE_SIZE,
  until,
} = {}) {
  const channels = [];
  let cursor;
  let pages = 0;
  while (pages < maxPages) {
    const page = await api("conversations.list", {
      types,
      limit: pageSize,
      exclude_archived: true,
      ...(cursor ? { cursor } : {}),
    });
    pages += 1;
    channels.push(...(page?.channels || []));
    cursor = page?.response_metadata?.next_cursor || "";
    if (!cursor) return { channels, pages, stopped: "end_of_list" };
    if (until && until(channels)) return { channels, pages, stopped: "found_what_was_needed" };
  }
  return { channels, pages, stopped: "page_cap" };
}

/**
 * Read client.counts and index it by conversation id.
 *
 * A thrown call, an `ok: false` answer, or an answer with none of the expected
 * groups all count as no answer, and `stage` says which. A group that is not an
 * array (the likeliest way an undocumented shape changes) is treated as absent
 * rather than iterated.
 *
 * @returns {Promise<{ counts: object|null, countsById: Map<string, object>, stage: string }>}
 */
export async function readClientCounts(api) {
  let counts = null;
  let stage = "ok";
  try {
    counts = await api("client.counts", { thread_counts_by_channel: true }, { retryOnAuthFail: false });
    if (!counts || counts.ok === false) {
      stage = "client.counts_returned_not_ok";
      counts = null;
    }
  } catch (error) {
    stage = `client.counts_failed: ${error?.message || error}`;
    counts = null;
  }

  // mpims and ims carry the same item shape as channels, so one index covers all three.
  const countsById = new Map();
  let groupsSeen = 0;
  for (const group of ["channels", "mpims", "ims"]) {
    const list = Array.isArray(counts?.[group]) ? counts[group] : null;
    if (!list) continue;
    groupsSeen += 1;
    for (const entry of list) {
      if (entry?.id) countsById.set(entry.id, entry);
    }
  }
  if (counts && groupsSeen === 0) {
    stage = "client.counts_missing_groups";
    counts = null;
  }

  return { counts, countsById, stage };
}

/** The four conversation types as this server names them. */
export function conversationType(c) {
  return c?.is_im ? "dm" : c?.is_mpim ? "group_dm" : c?.is_private ? "private_channel" : "public_channel";
}
