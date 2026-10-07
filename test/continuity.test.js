/**
 * The continuity view: commitments, owner gaps, open questions.
 *
 * This is the hosted tier's own thesis, computed locally. Its whole claim is
 * that nothing is inferred — so the tests are about what it refuses to claim as
 * much as what it finds.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { computeContinuity, buildPermalink } from "../lib/catch-up.js";

const NOW = new Date("2026-10-07T12:00:00Z");
const TS = (hoursAgo) => String(Math.floor(NOW.getTime() / 1000 - hoursAgo * 3600)) + ".000100";

const CONVERSATIONS = [
  {
    id: "C_INC",
    name: "incidents",
    messages: [
      {
        ts: TS(30), user: "Dana", user_id: "U_DANA",
        text: "I'll take the rollback and report back by five.",
        origin: "internal", author_trusted: true,
      },
      {
        ts: TS(20), user: "Sam", user_id: "U_SAM",
        text: "Can someone pick up the customer comms?",
        origin: "internal", author_trusted: true,
      },
      {
        ts: TS(10), user: "Rae", user_id: "U_RAE",
        text: "Did the migration finish?",
        origin: "internal", author_trusted: true,
      },
      {
        ts: TS(5), user: "Lee", user_id: "U_LEE",
        text: "Can someone look at the dashboard?",
        origin: "internal", author_trusted: true,
        thread: { replies: [{ ts: TS(4), user: "Mo", user_id: "U_MO", text: "I've got it" }] },
      },
      {
        ts: TS(2), user: "Kit", user_id: "U_KIT",
        text: "you should take the on-call page",
        origin: "internal", author_trusted: true,
      },
    ],
  },
];

const WORKSPACE = "https://general-provision.slack.com/";

function run(extra = {}) {
  return computeContinuity({ conversations: CONVERSATIONS, workspaceUrl: WORKSPACE, now: NOW, ...extra });
}

test("a first-person promise is a commitment and says what matched", () => {
  const { commitments } = run();
  const dana = commitments.find((c) => c.user_id === "U_DANA");
  assert.ok(dana, "the rollback promise must be found");
  assert.match(dana.matched_on, /I'll/i);
  assert.equal(dana.answered, false);
});

test("telling someone else to do it is not a commitment", () => {
  // "you should take the on-call page" assigns work; reading it as a promise
  // is how a report like this starts lying.
  const { commitments } = run();
  assert.equal(commitments.some((c) => c.user_id === "U_KIT"), false);
});

test("an unclaimed ask is an owner gap, and a claimed one is not", () => {
  const { owner_gaps: gaps } = run();
  assert.equal(gaps.some((g) => g.user_id === "U_SAM"), true, "nobody replied to Sam");
  assert.equal(gaps.some((g) => g.user_id === "U_LEE"), false, "Mo answered Lee");
});

test("a question with no reply is open; a question someone answered is not", () => {
  const { open_questions: open } = run();
  assert.equal(open.some((q) => q.user_id === "U_RAE"), true);
  assert.equal(open.some((q) => q.user_id === "U_LEE"), false);
});

test("a reply from the asker alone does not count as answered", () => {
  const conversations = [{
    id: "C_X", name: "x",
    messages: [{
      ts: TS(8), user: "Ana", user_id: "U_ANA", text: "Can someone own the release?",
      thread: { replies: [{ ts: TS(7), user: "Ana", user_id: "U_ANA", text: "bumping this" }] },
    }],
  }];
  const { owner_gaps: gaps } = computeContinuity({ conversations, workspaceUrl: WORKSPACE, now: NOW });
  assert.equal(gaps.length, 1);
  assert.equal(gaps[0].answered, false);
});

test("every row carries a permalink that opens the message it came from", () => {
  const { commitments, owner_gaps: gaps, open_questions: open } = run();
  for (const row of [...commitments, ...gaps, ...open]) {
    assert.ok(row.permalink, `${row.user} row has no permalink`);
    assert.match(row.permalink, /^https:\/\/general-provision\.slack\.com\/archives\/C_[A-Z]+\/p\d+$/);
    assert.equal(row.permalink.includes("."), true);
    assert.equal(row.permalink.split("/p")[1].includes("."), false, "the ts dot must be stripped");
  }
});

test("without a workspace url a row carries no link rather than a broken one", () => {
  const { commitments } = run({ workspaceUrl: null });
  assert.ok(commitments.length > 0);
  for (const row of commitments) assert.equal(row.permalink, null);
  assert.equal(buildPermalink(null, "C1", "1.2"), null);
  assert.equal(buildPermalink("https://x.slack.com", null, "1.2"), null);
  assert.equal(buildPermalink("https://x.slack.com", "C1", null), null);
});

test("a workspace url without a trailing slash still builds a valid link", () => {
  assert.equal(
    buildPermalink("https://x.slack.com", "C1", "1700000000.000100"),
    "https://x.slack.com/archives/C1/p1700000000000100"
  );
});

test("rows are ordered oldest first, because age is the point", () => {
  const { open_questions: open } = run();
  for (let i = 1; i < open.length; i++) {
    assert.ok(open[i - 1].age_hours >= open[i].age_hours, "open questions must run oldest first");
  }
});

test("the counts agree with the rows, and say how many commitments are still open", () => {
  const result = run();
  assert.equal(result.counts.commitments, result.commitments.length);
  assert.equal(result.counts.owner_gaps, result.owner_gaps.length);
  assert.equal(result.counts.open_questions, result.open_questions.length);
  assert.equal(
    result.counts.commitments_still_unanswered,
    result.commitments.filter((c) => !c.answered).length
  );
});

test("the output states its own shallowness rather than implying comprehension", () => {
  const { how_this_was_built: note } = run();
  assert.match(note, /nothing inferred/i);
  assert.match(note, /shallow/i);
  assert.match(note, /not as a count you can report/i);
});

test("empty and malformed input produce empty lists, not a throw", () => {
  for (const conversations of [[], [{ id: "C", name: "c" }], [{ id: "C", name: "c", messages: [] }]]) {
    const result = computeContinuity({ conversations, workspaceUrl: WORKSPACE, now: NOW });
    assert.deepEqual(result.commitments, []);
    assert.deepEqual(result.owner_gaps, []);
    assert.deepEqual(result.open_questions, []);
  }
  const noText = computeContinuity({
    conversations: [{ id: "C", name: "c", messages: [{ ts: TS(1), user: "X" }] }],
    workspaceUrl: WORKSPACE, now: NOW,
  });
  assert.deepEqual(noText.open_questions, []);
});
