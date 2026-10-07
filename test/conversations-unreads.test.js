/**
 * slack_conversations_unreads merges two endpoints.
 *
 * conversations.list carries the unread NUMBER and the names. client.counts
 * carries the mention counts, the thread block, and conversations past the
 * listing page. Shapes here are taken from a real workspace on 2026-10-07:
 * client.counts items carry has_unreads / mention_count / last_read / latest /
 * updated / id — and NOT unread_count_display — while `threads` is an object,
 * not an array.
 *
 * client.counts is undocumented, so the tests that matter most are the ones
 * where it is missing or lying.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { handleConversationsUnreads } from "../lib/handlers.js";

const LISTING = {
  channels: [
    { id: "C_MENTIONS", name: "incidents", is_private: false, latest: { ts: "1700000000.000100" } },
    { id: "C_BUSY", name: "general", is_private: false, latest: { ts: "1700000000.000200" }, unread_count_display: 23 },
    { id: "C_QUIET", name: "random", is_private: false, latest: { ts: "1700000000.000300" } },
    { id: "D_DM", name: null, is_im: true, user: "U_FRIEND", latest: { ts: "1700000000.000400" }, unread_count_display: 2 },
  ],
};

const COUNTS = {
  ok: true,
  channels: [
    { id: "C_MENTIONS", has_unreads: true, mention_count: 8, last_read: "1699999999.000000", latest: "1700000000.000100" },
    { id: "C_BUSY", has_unreads: true, mention_count: 0, last_read: "1699999998.000000", latest: "1700000000.000200" },
    { id: "C_QUIET", has_unreads: false, mention_count: 0, last_read: "1700000000.000300", latest: "1700000000.000300" },
    { id: "C_BEYOND_PAGE", has_unreads: true, mention_count: 3, last_read: "1699999990.000000", latest: "1700000000.000900" },
  ],
  mpims: [],
  ims: [{ id: "D_DM", has_unreads: true, mention_count: 0, last_read: "1699999997.000000", latest: "1700000000.000400" }],
  threads: {
    has_unreads: true,
    mention_count: 2,
    unread_count_by_channel: { C_MENTIONS: 14 },
    mention_count_by_channel: { C_MENTIONS: 2 },
  },
};

function apiReturning({ listing = LISTING, counts = COUNTS, countsError = null } = {}) {
  return async (method) => {
    if (method === "conversations.list") return listing;
    if (method === "client.counts") {
      if (countsError) throw countsError;
      return counts;
    }
    throw new Error(`unexpected method ${method}`);
  };
}

const resolveStub = async (userId) => (userId === "U_FRIEND" ? "A Colleague" : userId);

async function run(args, api) {
  const result = await handleConversationsUnreads(args, api, resolveStub);
  return JSON.parse(result.content[0].text);
}

test("a channel with mentions and zero unread messages is reported", async () => {
  // The case that made the old handler useless: it filtered on unread_count
  // alone, so being named eight times in a channel you have read showed as
  // nothing waiting. Measured on a real workspace, the old path returned 0
  // conversations while 10 mentions were outstanding.
  const body = await run({}, apiReturning());
  const mentions = body.conversations.find((c) => c.id === "C_MENTIONS");
  assert.ok(mentions, "channel with mentions must be present");
  assert.equal(mentions.unread_count, 0);
  assert.equal(mentions.mention_count, 8);
});

test("mentions outrank unread volume in the ordering", async () => {
  const body = await run({}, apiReturning());
  assert.equal(body.conversations[0].id, "C_MENTIONS");
  assert.equal(body.conversations[1].id, "C_BUSY");
  assert.equal(body.total_mentions, 8);
});

test("a conversation with neither unreads nor mentions is left out", async () => {
  const body = await run({}, apiReturning());
  assert.equal(body.conversations.some((c) => c.id === "C_QUIET"), false);
});

test("the thread block passes through, including the per-channel breakdown", async () => {
  const body = await run({}, apiReturning());
  assert.equal(body.threads.has_unreads, true);
  assert.equal(body.threads.mention_count, 2);
  assert.deepEqual(body.threads.unread_count_by_channel, { C_MENTIONS: 14 });
  assert.deepEqual(body.threads.mention_count_by_channel, { C_MENTIONS: 2 });
});

test("a conversation the listing page never reached is reported, not dropped", async () => {
  const body = await run({}, apiReturning());
  assert.equal(body.unreachable_from_listing.length, 1);
  assert.equal(body.unreachable_from_listing[0].id, "C_BEYOND_PAGE");
  assert.equal(body.unreachable_from_listing[0].mention_count, 3);
});

test("a thrown client.counts falls back and names the stage", async () => {
  const body = await run({}, apiReturning({ countsError: new Error("ratelimited") }));
  assert.match(body.sources["client.counts"], /^client\.counts_failed: ratelimited$/);
  assert.equal(body.sources["conversations.list"], "ok");
  assert.equal(body.threads, null);
  assert.match(body.sources.note, /did not answer/);
  // The old view still works: the conversations with real unread counts survive.
  assert.deepEqual(body.conversations.map((c) => c.id).sort(), ["C_BUSY", "D_DM"]);
  assert.equal(body.total_mentions, 0);
  assert.equal(body.unreachable_from_listing, undefined);
});

test("client.counts answering ok:false is treated as no answer, not as empty", async () => {
  // An endpoint that returns {ok:false} must not read as "nothing is waiting".
  const body = await run({}, apiReturning({ counts: { ok: false, error: "invalid_auth" } }));
  assert.equal(body.sources["client.counts"], "client.counts_returned_not_ok");
  assert.equal(body.threads, null);
  assert.deepEqual(body.conversations.map((c) => c.id).sort(), ["C_BUSY", "D_DM"]);
});

test("a counts response missing its groups entirely degrades and says so", async () => {
  const body = await run({}, apiReturning({ counts: { ok: true } }));
  assert.equal(body.sources["client.counts"], "client.counts_missing_groups");
  assert.equal(body.threads, null);
  assert.deepEqual(body.conversations.map((c) => c.id).sort(), ["C_BUSY", "D_DM"]);
});

test("a DM resolves its counterpart's name", async () => {
  const body = await run({}, apiReturning());
  const dm = body.conversations.find((c) => c.id === "D_DM");
  assert.equal(dm.type, "dm");
  assert.equal(dm.name, "A Colleague");
});

test("limit caps the conversations returned but not the totals", async () => {
  const body = await run({ limit: 1 }, apiReturning());
  assert.equal(body.conversations.length, 1);
  assert.equal(body.total_unread_conversations, 3);
});
