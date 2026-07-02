import { test } from "node:test";
import assert from "node:assert/strict";
import { TOOLS } from "../lib/tools.js";
import { TOOL_HANDLERS } from "../lib/handlers.js";

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

test("every advertised tool has a dispatch handler and vice versa (drift guard, #30/#123)", () => {
  const advertised = TOOLS.map((t) => t.name).sort();
  const dispatchable = Object.keys(TOOL_HANDLERS).sort();
  assert.deepEqual(dispatchable, advertised,
    "TOOLS (lib/tools.js) and TOOL_HANDLERS (lib/handlers.js) must list the same tool names");
  for (const name of advertised) {
    assert.equal(typeof TOOL_HANDLERS[name], "function", `${name} handler is a function`);
  }
});

test("include_all_metadata is on history/replies tools but NOT on search (orthogonality guard)", () => {
  for (const name of ["slack_conversations_history", "slack_get_full_conversation", "slack_get_thread"]) {
    assert.equal(props(name).include_all_metadata?.type, "boolean", `${name} exposes include_all_metadata`);
  }
  assert.equal(props("slack_search_messages").include_all_metadata, undefined,
    "search.messages must NOT expose include_all_metadata (Slack search has no such option)");
});
