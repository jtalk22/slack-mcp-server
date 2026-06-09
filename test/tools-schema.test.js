import { test } from "node:test";
import assert from "node:assert/strict";
import { TOOLS } from "../lib/tools.js";

const byName = Object.fromEntries(TOOLS.map((t) => [t.name, t]));
function props(name) {
  const t = byName[name] || {};
  const s = t.inputSchema || t.parameters || t.input_schema || t;
  return s.properties || {};
}

test("include_rich_message_fields is exposed on the four read tools", () => {
  for (const name of ["slack_conversations_history", "slack_get_full_conversation", "slack_search_messages", "slack_get_thread"]) {
    assert.ok(byName[name], `tool ${name} exists`);
    assert.equal(props(name).include_rich_message_fields?.type, "boolean", `${name} exposes include_rich_message_fields`);
  }
});

test("include_all_metadata is on history/replies tools but NOT on search (orthogonality guard)", () => {
  for (const name of ["slack_conversations_history", "slack_get_full_conversation", "slack_get_thread"]) {
    assert.equal(props(name).include_all_metadata?.type, "boolean", `${name} exposes include_all_metadata`);
  }
  assert.equal(props("slack_search_messages").include_all_metadata, undefined,
    "search.messages must NOT expose include_all_metadata (Slack search has no such option)");
});
