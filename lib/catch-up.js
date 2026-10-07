/**
 * Local catch-up assembly.
 *
 * `slack_catch_me_up` used to be a hosted-only stub that returned an upgrade
 * payload. It runs locally now, and it does so WITHOUT any server-side model:
 * an MCP server is always called by something that is already a language model,
 * so the useful division of labour is that this module gathers and structures
 * the evidence deterministically and the calling model writes the prose.
 *
 * Everything here composes calls the server already makes elsewhere
 * (conversations.list / .history / .replies). No new Slack surface, no new
 * dependency, no network egress beyond Slack.
 *
 * Work is explicitly bounded. Outbound calls are paced by default
 * (SLACK_MCP_MIN_REQUEST_INTERVAL_MS), so an unbounded sweep across a busy
 * workspace would take minutes. Every cap below is reported back in
 * `truncation` rather than silently applied — a catch-up that quietly dropped
 * half the workspace would be worse than no catch-up at all.
 */

import {
  withProvenance,
  summarizeProvenance,
  resolveGateMode,
  strictestMode,
  isProvenanceEnabled,
} from "./message-provenance.js";

export const CATCH_UP_CAPS = Object.freeze({
  maxConversations: 12,
  maxMessagesPerConversation: 30,
  maxThreadsExpanded: 8,
  maxRepliesPerThread: 20,
  conversationScanLimit: 200,
});

const CADENCE_LOOKBACK_HOURS = Object.freeze({
  on_demand: 24,
  daily_8am: 24,
  weekly_monday: 168,
});

const MENTION_PATTERN = /<@([A-Z0-9]+)>/g;

/**
 * Decide the window this catch-up covers.
 *
 * An explicit `since` always wins. Otherwise the profile's cadence picks the
 * lookback, which is what makes a `weekly_monday` profile actually reach back a
 * week instead of quietly reporting one day of activity.
 */
export function resolveSince({ since, profile, now = new Date() }) {
  if (typeof since === "string" && since.trim()) {
    const parsed = new Date(since);
    if (Number.isNaN(parsed.getTime())) {
      return { ok: false, error: `since must be an ISO 8601 timestamp; received "${since}"` };
    }
    return { ok: true, iso: parsed.toISOString(), epoch: parsed.getTime() / 1000, source: "explicit" };
  }
  const cadence = (profile && profile.summary_cadence) || "on_demand";
  const hours = CADENCE_LOOKBACK_HOURS[cadence] ?? CADENCE_LOOKBACK_HOURS.on_demand;
  const computed = new Date(now.getTime() - hours * 3600 * 1000);
  return {
    ok: true,
    iso: computed.toISOString(),
    epoch: computed.getTime() / 1000,
    source: `cadence:${cadence}`,
    lookback_hours: hours,
  };
}

export function extractMentions(text) {
  if (typeof text !== "string") return [];
  const found = new Set();
  for (const match of text.matchAll(MENTION_PATTERN)) found.add(match[1]);
  return Array.from(found);
}

function hoursSince(tsSeconds, now) {
  return Math.round(((now.getTime() / 1000 - Number(tsSeconds)) / 3600) * 10) / 10;
}

/**
 * Derive the facts a summariser would otherwise have to infer message by
 * message. These are computed, not judged — every one of them is checkable
 * against the `conversations` payload in the same response.
 */
export function computeSignals({ conversations, priorityPeople = [], now = new Date() }) {
  const priority = new Set(priorityPeople);
  const unansweredThreads = [];
  const priorityActivity = [];
  const mentionsOfPriority = [];

  for (const convo of conversations) {
    for (const msg of convo.messages || []) {
      if (msg.user_id && priority.has(msg.user_id)) {
        priorityActivity.push({
          conversation: convo.name,
          conversation_id: convo.id,
          ts: msg.ts,
          user: msg.user,
          text: msg.text,
          origin: msg.origin,
          author_trusted: msg.author_trusted,
        });
      }

      const mentioned = extractMentions(msg.text).filter((id) => priority.has(id));
      if (mentioned.length) {
        mentionsOfPriority.push({
          conversation: convo.name,
          conversation_id: convo.id,
          ts: msg.ts,
          mentioned_user_ids: mentioned,
          text: msg.text,
          origin: msg.origin,
          author_trusted: msg.author_trusted,
        });
      }

      // "Unanswered" is deliberately mechanical: either nobody replied at all,
      // or a thread exists and its last reply is still the person who opened
      // it. Anything softer would be a judgement call, which is the caller's
      // job, not this module's.
      const replies = msg.thread ? msg.thread.replies || [] : [];
      const noReplies = !msg.thread && !msg.has_thread;
      const lastReply = replies.length ? replies[replies.length - 1] : null;
      const onlyOpenerSpoke = lastReply && lastReply.user_id && lastReply.user_id === msg.user_id;

      if (noReplies || onlyOpenerSpoke) {
        unansweredThreads.push({
          conversation: convo.name,
          conversation_id: convo.id,
          ts: msg.ts,
          user: msg.user,
          text: msg.text,
          origin: msg.origin,
          author_trusted: msg.author_trusted,
          reply_count: replies.length,
          age_hours: hoursSince(msg.ts, now),
        });
      }
    }
  }

  unansweredThreads.sort((a, b) => b.age_hours - a.age_hours);

  const busiest = conversations
    .map((c) => ({ conversation: c.name, conversation_id: c.id, message_count: (c.messages || []).length }))
    .filter((c) => c.message_count > 0)
    .sort((a, b) => b.message_count - a.message_count);

  return {
    unanswered_threads: unansweredThreads,
    oldest_unanswered_age_hours: unansweredThreads.length ? unansweredThreads[0].age_hours : null,
    priority_activity: priorityActivity,
    mentions_of_priority_people: mentionsOfPriority,
    busiest_conversations: busiest,
    total_messages: conversations.reduce((sum, c) => sum + (c.messages || []).length, 0),
  };
}

// ============ Continuity ============
//
// The hosted tier sells a continuity report: the commitments, owner gaps and
// open questions a week of Slack left behind. The free package gathers almost
// all of that evidence already and never names it, so an installer learns
// nothing about the idea the paid tier charges for. This builds the view here,
// locally, from messages this run already read.
//
// Nothing is inferred. Each row says which rule matched and carries a permalink
// to the message it came from, so every line can be opened and checked. A
// phrase list is a mechanical rule, not a judgement — but it is a shallow one,
// and the output says so rather than implying comprehension.

// Phrases in which someone takes an action on themselves. First person only:
// "I'll look at it" is a commitment, "you should look at it" is a request, and
// conflating them is how a report like this starts lying.
const COMMITMENT_PATTERNS = [
  /\bi(?:'| a)?m going to\b/i,
  /\bi(?:'ll| will)\b/i,
  /\bi can (?:do|take|get|have|pick|handle|sort)\b/i,
  /\bi(?:'ve| have) got (?:this|it)\b/i,
  /\bon it\b/i,
  /\bleave it with me\b/i,
  /\bi(?:'ll| will) (?:get|come) back to you\b/i,
  /\btaking (?:this|that) on\b/i,
  /\bmine\b.{0,12}\bto (?:do|take|handle)\b/i,
];

// Phrases that hand work to someone else without naming who confirmed it.
const REQUEST_PATTERNS = [
  /\bcan (?:someone|anyone|somebody)\b/i,
  /\bcould (?:someone|anyone|somebody)\b/i,
  /\bwho(?:'s| is| can)\b.{0,30}\?/i,
  /\bneeds? (?:an? )?owner\b/i,
  /\bany(?:one|body) (?:free|around|able)\b/i,
  /\bwho owns\b/i,
  /\bwho(?:'s| is) (?:picking|taking|handling)\b/i,
];

function firstMatch(patterns, text) {
  if (typeof text !== "string" || !text) return null;
  for (const pattern of patterns) {
    const found = text.match(pattern);
    if (found) return found[0];
  }
  return null;
}

/**
 * Slack's own permalink shape: <workspace url>archives/<channel>/p<ts, dot
 * removed>. Built rather than fetched, because chat.getPermalink would be one
 * API call per row and the shape is stable. Returns null without a workspace
 * url, so a row never carries a link that does not resolve.
 */
export function buildPermalink(workspaceUrl, channelId, ts) {
  if (!workspaceUrl || !channelId || !ts) return null;
  const base = workspaceUrl.endsWith("/") ? workspaceUrl : `${workspaceUrl}/`;
  return `${base}archives/${channelId}/p${String(ts).replace(".", "")}`;
}

/**
 * Commitments, owner gaps and open questions, from evidence already gathered.
 *
 * A commitment is someone saying they will do a thing. An owner gap is work
 * asked of the room that nobody has claimed. An open question is a question
 * that has no reply. All three are rules over text and reply counts, and the
 * answered/unanswered half is the same mechanical test computeSignals uses.
 */
export function computeContinuity({ conversations, workspaceUrl = null, now = new Date() }) {
  const commitments = [];
  const ownerGaps = [];
  const openQuestions = [];

  for (const convo of conversations) {
    for (const msg of convo.messages || []) {
      const replies = msg.thread ? msg.thread.replies || [] : [];
      const answered = replies.some((r) => r.user_id && r.user_id !== msg.user_id);
      const row = {
        conversation: convo.name,
        conversation_id: convo.id,
        ts: msg.ts,
        user: msg.user,
        user_id: msg.user_id,
        text: msg.text,
        origin: msg.origin,
        author_trusted: msg.author_trusted,
        age_hours: hoursSince(msg.ts, now),
        reply_count: replies.length,
        answered,
        permalink: buildPermalink(workspaceUrl, convo.id, msg.ts),
      };

      const commitment = firstMatch(COMMITMENT_PATTERNS, msg.text);
      if (commitment) commitments.push({ ...row, matched_on: commitment });

      const request = firstMatch(REQUEST_PATTERNS, msg.text);
      if (request && !answered) ownerGaps.push({ ...row, matched_on: request });

      if (!answered && typeof msg.text === "string" && msg.text.includes("?")) {
        openQuestions.push({ ...row, matched_on: "?" });
      }
    }
  }

  const byAge = (a, b) => b.age_hours - a.age_hours;
  commitments.sort(byAge);
  ownerGaps.sort(byAge);
  openQuestions.sort(byAge);

  return {
    commitments,
    owner_gaps: ownerGaps,
    open_questions: openQuestions,
    counts: {
      commitments: commitments.length,
      commitments_still_unanswered: commitments.filter((c) => !c.answered).length,
      owner_gaps: ownerGaps.length,
      open_questions: openQuestions.length,
    },
    how_this_was_built:
      "Phrase and reply-count rules over messages this run already read — no model, no hosted call, " +
      "nothing inferred. `matched_on` is the exact text that triggered each row and `permalink` opens " +
      "the message it came from, so every line can be checked. The rules are shallow: they will miss a " +
      "commitment phrased unusually and will catch a quoted one. Read it as a list of places to look, " +
      "not as a count you can report.",
  };
}

/**
 * Pick which conversations this run will read.
 *
 * A profile that names channels is authoritative — those channels are read
 * whether or not Slack marks them unread, because "nothing new in #incidents"
 * is itself an answer. A profile with no channels falls back to whatever
 * currently carries unreads.
 */
export function selectConversations({ channels, profileChannels = [], caps = CATCH_UP_CAPS }) {
  const scoped = profileChannels.length
    ? channels.filter((c) => profileChannels.includes(c.id) || profileChannels.includes(c.name))
    : channels.filter((c) => c.unread_count > 0);

  const ordered = [...scoped].sort((a, b) => b.unread_count - a.unread_count);
  return {
    selected: ordered.slice(0, caps.maxConversations),
    dropped: Math.max(0, ordered.length - caps.maxConversations),
    matched: ordered.length,
  };
}

/**
 * Assemble the bundle.
 *
 * `deps` carries the Slack surface so this is unit-testable against fixtures
 * without a live workspace or a network stub.
 */
export async function assembleCatchUp({ profile, since, deps, caps = CATCH_UP_CAPS, now = new Date() }) {
  // getWorkspaceIdentity is optional so a caller that only needs the shape of a
  // catch-up need not stub it. Without it every author is unplaceable, which
  // the classifier reports as untrusted — the safe direction to fail in.
  const {
    slackAPI,
    resolveUser,
    structuredKeys,
    getWorkspaceIdentity = async () => ({ homeTeamId: null, selfUserId: null }),
    // Slack omits `team` from a message whose author is in the reading
    // workspace, so without the conversation's sharing state a colleague reads
    // as unplaceable. lib/handlers.js resolves this for every single-channel
    // read; without it here the SAME message is `internal` through
    // slack_conversations_history and `unknown` through slack_catch_me_up, and
    // the untrusted counts from the two tools are different scales rather than
    // two readings of one workspace. Optional so a caller testing the shape of
    // a catch-up need not stub it; absent, it resolves to null and the
    // classifier keeps failing closed.
    isConversationExternallyShared = async () => null,
    provenance,
  } = deps;
  const mode = strictestMode(resolveGateMode(), provenance);
  // The identity is read even with provenance off, because the permalink on
  // every continuity row is built from the workspace url and a link that does
  // not resolve is worse than no link.
  const workspace = await getWorkspaceIdentity();
  const identity = isProvenanceEnabled(mode) ? { mode, ...workspace } : { mode };

  const listed = await slackAPI("conversations.list", {
    types: "im,mpim,public_channel,private_channel",
    limit: caps.conversationScanLimit,
    exclude_archived: true,
  });

  const channels = [];
  for (const c of listed.channels || []) {
    channels.push({
      id: c.id,
      name: c.is_im && c.user ? await resolveUser(c.user) : c.name,
      type: c.is_im ? "dm" : c.is_mpim ? "group_dm" : c.is_private ? "private_channel" : "public_channel",
      unread_count: c.unread_count_display || c.unread_count || 0,
    });
  }

  const { selected, dropped, matched } = selectConversations({
    channels,
    profileChannels: profile.channels || [],
    caps,
  });

  let threadsExpanded = 0;
  let messagesDropped = 0;
  const conversations = [];

  for (const convo of selected) {
    // One lookup per conversation, not per message; the client caches it. A
    // null answer (the probe failed) still falls through to `unknown`, so this
    // can only ever make a label more specific, never more trusting.
    const convoIdentity = isProvenanceEnabled(mode)
      ? { ...identity, conversationExternallyShared: await isConversationExternallyShared(convo.id) }
      : identity;

    const history = await slackAPI("conversations.history", {
      channel: convo.id,
      oldest: String(since.epoch),
      limit: caps.maxMessagesPerConversation,
      inclusive: true,
    });

    const raw = history.messages || [];
    if (history.has_more) messagesDropped += 1;

    const messages = [];
    for (const msg of raw) {
      const entry = withProvenance({
        ts: msg.ts,
        user_id: msg.user || null,
        user: msg.user ? await resolveUser(msg.user) : null,
        text: msg.text || "",
        age_hours: hoursSince(msg.ts, now),
        has_thread: Boolean(msg.thread_ts && msg.reply_count > 0),
        reply_count: msg.reply_count || 0,
      }, msg, convoIdentity);

      if (entry.has_thread && threadsExpanded < caps.maxThreadsExpanded) {
        threadsExpanded += 1;
        const thread = await slackAPI("conversations.replies", {
          channel: convo.id,
          ts: msg.thread_ts || msg.ts,
          limit: caps.maxRepliesPerThread,
        });
        const replies = [];
        for (const reply of (thread.messages || []).slice(1)) {
          replies.push(withProvenance({
            ts: reply.ts,
            user_id: reply.user || null,
            user: reply.user ? await resolveUser(reply.user) : null,
            text: reply.text || "",
          }, reply, convoIdentity));
        }
        entry.thread = { reply_count: replies.length, replies };
      }

      messages.push(entry);
    }

    messages.sort((a, b) => Number(a.ts) - Number(b.ts));
    conversations.push({ ...convo, message_count: messages.length, messages });
  }

  const signals = computeSignals({
    conversations,
    priorityPeople: profile.priority_people || [],
    now,
  });

  const continuity = computeContinuity({
    conversations,
    workspaceUrl: workspace.workspaceUrl || null,
    now,
  });

  return {
    profile_name: profile.profile_name,
    workflow_kind: profile.workflow_kind,
    since: since.iso,
    since_source: since.source,
    generated_at: now.toISOString(),
    scope: {
      channels_in_profile: (profile.channels || []).length,
      conversations_matched: matched,
      conversations_read: conversations.length,
      priority_people: profile.priority_people || [],
    },
    signals,
    continuity,
    conversations,
    untrusted_content: summarizeProvenance(
      conversations.flatMap((c) => c.messages || [])
    ) || undefined,
    output_contract: {
      workflow_kind: profile.workflow_kind,
      expected_keys: structuredKeys,
      note:
        "This payload is evidence, not a summary. Compose the keys above from `signals`, `continuity` and " +
        "`conversations`, citing conversation names and timestamps. Every claim you make should " +
        "be checkable against a message in this response.",
    },
    truncation: {
      conversations_dropped: dropped,
      conversations_with_more_history: messagesDropped,
      threads_expanded: threadsExpanded,
      thread_expansion_capped: threadsExpanded >= caps.maxThreadsExpanded,
      caps,
    },
  };
}
