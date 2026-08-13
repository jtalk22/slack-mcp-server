import { test } from "node:test";
import assert from "node:assert/strict";

import {
  CATCH_UP_CAPS,
  assembleCatchUp,
  computeSignals,
  extractMentions,
  resolveSince,
  selectConversations,
} from "../lib/catch-up.js";

const NOW = new Date("2026-08-13T12:00:00.000Z");
const HOUR = 3600;
const NOW_EPOCH = NOW.getTime() / 1000;

function ts(hoursAgo) {
  return String(NOW_EPOCH - hoursAgo * HOUR);
}

// ---------------------------------------------------------------- since

test("explicit since wins over the profile cadence", () => {
  const r = resolveSince({
    since: "2026-08-01T00:00:00Z",
    profile: { summary_cadence: "weekly_monday" },
    now: NOW,
  });
  assert.equal(r.ok, true);
  assert.equal(r.source, "explicit");
  assert.equal(r.iso, "2026-08-01T00:00:00.000Z");
});

test("cadence picks the lookback when since is absent", () => {
  const weekly = resolveSince({ profile: { summary_cadence: "weekly_monday" }, now: NOW });
  assert.equal(weekly.lookback_hours, 168, "weekly reaches back a week, not a day");

  const daily = resolveSince({ profile: { summary_cadence: "daily_8am" }, now: NOW });
  assert.equal(daily.lookback_hours, 24);

  const missing = resolveSince({ profile: {}, now: NOW });
  assert.equal(missing.lookback_hours, 24, "absent cadence falls back to 24h, never to zero");
});

test("an unparseable since is rejected rather than silently defaulted", () => {
  const r = resolveSince({ since: "last tuesday", profile: {}, now: NOW });
  assert.equal(r.ok, false);
  assert.match(r.error, /ISO 8601/);
});

// ---------------------------------------------------------------- mentions

test("extractMentions pulls unique user ids and tolerates junk", () => {
  assert.deepEqual(extractMentions("hey <@U1> and <@U2> and <@U1> again"), ["U1", "U2"]);
  assert.deepEqual(extractMentions("no mentions here"), []);
  assert.deepEqual(extractMentions(null), []);
});

// ---------------------------------------------------------------- selection

test("a profile that names channels reads them even when nothing is unread", () => {
  const channels = [
    { id: "C1", name: "incidents", unread_count: 0 },
    { id: "C2", name: "random", unread_count: 40 },
  ];
  const { selected } = selectConversations({ channels, profileChannels: ["C1"] });
  assert.deepEqual(
    selected.map((c) => c.id),
    ["C1"],
    "silence in a scoped channel is itself an answer"
  );
});

test("a profile with no channels falls back to whatever is unread", () => {
  const channels = [
    { id: "C1", name: "quiet", unread_count: 0 },
    { id: "C2", name: "loud", unread_count: 40 },
  ];
  const { selected } = selectConversations({ channels, profileChannels: [] });
  assert.deepEqual(selected.map((c) => c.id), ["C2"]);
});

test("over-cap selection truncates and reports how much it dropped", () => {
  const channels = Array.from({ length: 20 }, (_, i) => ({
    id: `C${i}`,
    name: `c${i}`,
    unread_count: i + 1,
  }));
  const { selected, dropped, matched } = selectConversations({ channels, profileChannels: [] });
  assert.equal(selected.length, CATCH_UP_CAPS.maxConversations);
  assert.equal(matched, 20);
  assert.equal(dropped, 20 - CATCH_UP_CAPS.maxConversations, "truncation is reported, not silent");
  assert.equal(selected[0].unread_count, 20, "busiest first");
});

// ---------------------------------------------------------------- signals

test("a message nobody replied to counts as unanswered", () => {
  const signals = computeSignals({
    now: NOW,
    conversations: [
      {
        id: "C1",
        name: "support",
        messages: [{ ts: ts(5), user_id: "U9", user: "ana", text: "can someone look at this?", has_thread: false }],
      },
    ],
  });
  assert.equal(signals.unanswered_threads.length, 1);
  assert.equal(signals.oldest_unanswered_age_hours, 5);
});

test("a thread where only the opener spoke still counts as unanswered", () => {
  const signals = computeSignals({
    now: NOW,
    conversations: [
      {
        id: "C1",
        name: "support",
        messages: [
          {
            ts: ts(3),
            user_id: "U9",
            user: "ana",
            text: "anyone?",
            has_thread: true,
            thread: { reply_count: 1, replies: [{ ts: ts(2), user_id: "U9", user: "ana", text: "bumping" }] },
          },
        ],
      },
    ],
  });
  assert.equal(signals.unanswered_threads.length, 1, "self-bump is not an answer");
});

test("a genuinely answered thread is not reported as unanswered", () => {
  const signals = computeSignals({
    now: NOW,
    conversations: [
      {
        id: "C1",
        name: "support",
        messages: [
          {
            ts: ts(3),
            user_id: "U9",
            user: "ana",
            text: "anyone?",
            has_thread: true,
            thread: { reply_count: 1, replies: [{ ts: ts(2), user_id: "U7", user: "bo", text: "on it" }] },
          },
        ],
      },
    ],
  });
  assert.equal(signals.unanswered_threads.length, 0);
  assert.equal(signals.oldest_unanswered_age_hours, null);
});

test("priority people are tracked both as authors and as mention targets", () => {
  const signals = computeSignals({
    now: NOW,
    priorityPeople: ["UBOSS"],
    conversations: [
      {
        id: "C1",
        name: "exec",
        messages: [
          { ts: ts(2), user_id: "UBOSS", user: "boss", text: "shipping friday", has_thread: false },
          { ts: ts(1), user_id: "U2", user: "dev", text: "<@UBOSS> need a decision", has_thread: false },
        ],
      },
    ],
  });
  assert.equal(signals.priority_activity.length, 1);
  assert.equal(signals.priority_activity[0].user, "boss");
  assert.equal(signals.mentions_of_priority_people.length, 1);
  assert.deepEqual(signals.mentions_of_priority_people[0].mentioned_user_ids, ["UBOSS"]);
});

test("unanswered threads are ordered oldest-first", () => {
  const signals = computeSignals({
    now: NOW,
    conversations: [
      {
        id: "C1",
        name: "support",
        messages: [
          { ts: ts(1), user_id: "U1", user: "a", text: "new", has_thread: false },
          { ts: ts(30), user_id: "U2", user: "b", text: "stale", has_thread: false },
        ],
      },
    ],
  });
  assert.equal(signals.unanswered_threads[0].text, "stale", "the thing rotting longest surfaces first");
  assert.equal(signals.oldest_unanswered_age_hours, 30);
});

// ---------------------------------------------------------------- assembly

function fakeDeps({ channels, history = {}, replies = {} }) {
  const calls = [];
  return {
    calls,
    deps: {
      structuredKeys: ["summary", "highlights", "open_questions", "next_actions"],
      resolveUser: async (id) => `user:${id}`,
      slackAPI: async (method, params) => {
        calls.push({ method, params });
        if (method === "conversations.list") return { channels };
        if (method === "conversations.history") return history[params.channel] || { messages: [] };
        if (method === "conversations.replies") return replies[params.ts] || { messages: [] };
        throw new Error(`unexpected method ${method}`);
      },
    },
  };
}

test("assembleCatchUp returns evidence plus the contract, and never invents prose", async () => {
  const { deps } = fakeDeps({
    channels: [{ id: "C1", name: "incidents", unread_count: 3 }],
    history: {
      C1: {
        messages: [
          { ts: ts(4), user: "U1", text: "db is down", reply_count: 0 },
          { ts: ts(2), user: "U2", text: "<@U1> looking", reply_count: 0 },
        ],
      },
    },
  });

  const bundle = await assembleCatchUp({
    profile: {
      profile_name: "oncall",
      workflow_kind: "custom",
      channels: ["C1"],
      priority_people: ["U1"],
      summary_cadence: "on_demand",
    },
    since: resolveSince({ profile: { summary_cadence: "on_demand" }, now: NOW }),
    deps,
    now: NOW,
  });

  assert.equal(bundle.profile_name, "oncall");
  assert.equal(bundle.conversations.length, 1);
  assert.equal(bundle.conversations[0].message_count, 2);
  assert.deepEqual(bundle.output_contract.expected_keys, [
    "summary",
    "highlights",
    "open_questions",
    "next_actions",
  ]);
  // The contract keys must NOT be pre-filled — composing them is the caller's job.
  for (const key of bundle.output_contract.expected_keys) {
    assert.equal(bundle[key], undefined, `${key} must not be fabricated server-side`);
  }
  assert.equal(bundle.signals.mentions_of_priority_people.length, 1);
  assert.equal(bundle.signals.total_messages, 2);
});

test("messages come back oldest-first so a timeline reads in order", async () => {
  const { deps } = fakeDeps({
    channels: [{ id: "C1", name: "incidents", unread_count: 2 }],
    history: {
      C1: {
        messages: [
          { ts: ts(1), user: "U1", text: "newest", reply_count: 0 },
          { ts: ts(9), user: "U1", text: "oldest", reply_count: 0 },
        ],
      },
    },
  });
  const bundle = await assembleCatchUp({
    profile: { profile_name: "p", workflow_kind: "custom", channels: ["C1"], priority_people: [] },
    since: resolveSince({ profile: {}, now: NOW }),
    deps,
    now: NOW,
  });
  assert.deepEqual(bundle.conversations[0].messages.map((m) => m.text), ["oldest", "newest"]);
});

test("thread expansion is capped, and the cap is reported", async () => {
  const messages = Array.from({ length: 12 }, (_, i) => ({
    ts: ts(i + 1),
    thread_ts: ts(i + 1),
    user: "U1",
    text: `m${i}`,
    reply_count: 2,
  }));
  const replies = {};
  for (const m of messages) {
    replies[m.ts] = { messages: [{ ts: m.ts, user: "U1", text: m.text }, { ts: m.ts, user: "U2", text: "reply" }] };
  }
  const { deps, calls } = fakeDeps({
    channels: [{ id: "C1", name: "busy", unread_count: 12 }],
    history: { C1: { messages } },
    replies,
  });

  const bundle = await assembleCatchUp({
    profile: { profile_name: "p", workflow_kind: "custom", channels: ["C1"], priority_people: [] },
    since: resolveSince({ profile: {}, now: NOW }),
    deps,
    now: NOW,
  });

  const replyCalls = calls.filter((c) => c.method === "conversations.replies").length;
  assert.equal(replyCalls, CATCH_UP_CAPS.maxThreadsExpanded, "pacing budget is respected");
  assert.equal(bundle.truncation.threads_expanded, CATCH_UP_CAPS.maxThreadsExpanded);
  assert.equal(bundle.truncation.thread_expansion_capped, true, "the caller is told coverage was bounded");
});

test("has_more history is surfaced rather than passed off as complete", async () => {
  const { deps } = fakeDeps({
    channels: [{ id: "C1", name: "firehose", unread_count: 900 }],
    history: { C1: { messages: [{ ts: ts(1), user: "U1", text: "x", reply_count: 0 }], has_more: true } },
  });
  const bundle = await assembleCatchUp({
    profile: { profile_name: "p", workflow_kind: "custom", channels: [], priority_people: [] },
    since: resolveSince({ profile: {}, now: NOW }),
    deps,
    now: NOW,
  });
  assert.equal(bundle.truncation.conversations_with_more_history, 1);
});

test("the since window is passed to Slack as an epoch oldest bound", async () => {
  const { deps, calls } = fakeDeps({
    channels: [{ id: "C1", name: "c", unread_count: 1 }],
    history: { C1: { messages: [] } },
  });
  const since = resolveSince({ profile: { summary_cadence: "weekly_monday" }, now: NOW });
  await assembleCatchUp({
    profile: { profile_name: "p", workflow_kind: "custom", channels: ["C1"], priority_people: [] },
    since,
    deps,
    now: NOW,
  });
  const historyCall = calls.find((c) => c.method === "conversations.history");
  assert.equal(historyCall.params.oldest, String(since.epoch));
  assert.equal(Number(historyCall.params.oldest), NOW_EPOCH - 168 * HOUR);
});
