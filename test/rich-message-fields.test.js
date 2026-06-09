import { test } from "node:test";
import assert from "node:assert/strict";
import { withRichMessageFields, RICH_MESSAGE_KEYS } from "../lib/rich-message-fields.js";

test("disabled: base output is returned unchanged (no rich keys added)", () => {
  const base = { ts: "1", text: "hi" };
  const msg = { attachments: [{ text: "x" }], blocks: [{}], subtype: "bot_message" };
  const out = withRichMessageFields(base, msg, false);
  assert.equal(out, base); // same ref; mutate-in-place contract
  assert.deepEqual(out, { ts: "1", text: "hi" });
});

test("enabled: only the rich keys present on the message are merged", () => {
  const base = { ts: "1", text: "" };
  const msg = { attachments: [{ text: "alert body" }], bot_id: "B1", app_id: "A1" };
  const out = withRichMessageFields(base, msg, true);
  assert.deepEqual(out.attachments, [{ text: "alert body" }]);
  assert.equal(out.bot_id, "B1");
  assert.equal(out.app_id, "A1");
  assert.equal(out.ts, "1"); // base fields preserved
  for (const k of ["blocks", "metadata", "files", "reactions", "subtype", "team"]) {
    assert.ok(!(k in out), `${k} should be skipped when absent`);
  }
});

test("enabled but msg falsy: base returned unchanged", () => {
  const base = { ts: "1" };
  assert.equal(withRichMessageFields(base, null, true), base);
  assert.deepEqual(base, { ts: "1" });
});

test("present-but-falsy value is copied; only undefined is skipped", () => {
  const out = withRichMessageFields({}, { attachments: [], reactions: undefined }, true);
  assert.ok("attachments" in out);
  assert.deepEqual(out.attachments, []);
  assert.ok(!("reactions" in out), "undefined value must be skipped");
});

test("RICH_MESSAGE_KEYS covers documented fields + bot/app markers", () => {
  for (const k of ["attachments","blocks","metadata","files","reactions","subtype","bot_id","app_id","team"]) {
    assert.ok(RICH_MESSAGE_KEYS.includes(k), `missing ${k}`);
  }
});
