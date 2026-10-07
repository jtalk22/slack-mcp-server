/**
 * Read-only mode: the write tools are withheld and cannot be reached.
 *
 * The claim this mode makes is absolute, not advisory — unlike the strict
 * provenance hold, which interrupts a send but cannot prove a human approved
 * it. So each test here is the inverse of a branch: not "does read-only hide
 * the tools", but "can anything get them back".
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  TOOLS,
  WRITE_PATH_TOOLS,
  isReadOnlyRun,
  isWritePathTool,
  getActiveToolProfile,
} from "../lib/tools.js";
import { dispatchToolCall } from "../lib/mcp-server.js";

const NO_ARGV = [];
const NO_ENV = {};

function names(profile) {
  return profile.tools.map((tool) => tool.name);
}

test("the write-path list matches the tools that actually change Slack", () => {
  // Guards against a tool being added to TOOLS and quietly escaping the list.
  // Read-only is a promise; a new write tool that nobody adds here breaks it
  // silently, so this test exists to break loudly instead.
  const destructive = TOOLS
    .filter((tool) => tool.annotations?.destructiveHint === true)
    .map((tool) => tool.name)
    .sort();
  assert.deepEqual([...WRITE_PATH_TOOLS].sort(), destructive);
});

test("a default run advertises every tool and withholds nothing", () => {
  const profile = getActiveToolProfile(NO_ARGV, NO_ENV);
  assert.equal(profile.readOnly, false);
  assert.deepEqual(profile.withheld, []);
  assert.equal(profile.tools.length, TOOLS.length);
});

test("--read-only withholds exactly the write tools", () => {
  const profile = getActiveToolProfile(["node", "server.js", "--read-only"], NO_ENV);
  assert.equal(profile.readOnly, true);
  assert.deepEqual([...profile.withheld].sort(), [...WRITE_PATH_TOOLS].sort());
  assert.equal(profile.tools.length, TOOLS.length - WRITE_PATH_TOOLS.length);
  for (const write of WRITE_PATH_TOOLS) {
    assert.equal(names(profile).includes(write), false, write);
  }
});

test("SLACK_MCP_READ_ONLY does the same as the flag", () => {
  for (const value of ["1", "true", "TRUE", " yes ", "on"]) {
    const profile = getActiveToolProfile(NO_ARGV, { SLACK_MCP_READ_ONLY: value });
    assert.equal(profile.readOnly, true, `value ${JSON.stringify(value)}`);
  }
});

test("a value that is not an opt-in does not enable read-only", () => {
  for (const value of ["", "0", "no", "off", "false", "maybe"]) {
    const profile = getActiveToolProfile(NO_ARGV, { SLACK_MCP_READ_ONLY: value });
    assert.equal(profile.readOnly, false, `value ${JSON.stringify(value)}`);
    assert.equal(profile.tools.length, TOOLS.length);
  }
});

test("a custom tool list naming a write tool cannot get it back", () => {
  // The floor is applied after the profile resolves, so no combination of
  // flags widens it.
  const profile = getActiveToolProfile(
    ["node", "server.js", "--read-only"],
    { SLACK_MCP_TOOLS: "slack_send_message,slack_add_reaction,slack_search_messages" }
  );
  assert.equal(profile.readOnly, true);
  assert.deepEqual(names(profile), ["slack_search_messages"]);
});

test("the all profile cannot get them back either", () => {
  const profile = getActiveToolProfile(["node", "server.js", "--read-only"], { SLACK_MCP_TOOLS: "all" });
  assert.equal(names(profile).includes("slack_send_message"), false);
});

test("a write tool called anyway is refused at dispatch, not just hidden", async () => {
  // A client may call a name it was never offered. tools/list is advertising;
  // dispatch is the only place the promise can actually be kept.
  const previous = process.env.SLACK_MCP_READ_ONLY;
  process.env.SLACK_MCP_READ_ONLY = "1";
  try {
    for (const name of WRITE_PATH_TOOLS) {
      const result = await dispatchToolCall(name, { channel_id: "D1", text: "hi", reaction: "x", timestamp: "1" });
      assert.equal(result.isError, true, name);
      const body = JSON.parse(result.content[0].text);
      assert.equal(body.code, "read_only", name);
    }
  } finally {
    if (previous === undefined) delete process.env.SLACK_MCP_READ_ONLY;
    else process.env.SLACK_MCP_READ_ONLY = previous;
  }
});

test("read-only does not refuse the read tools", async () => {
  const previous = process.env.SLACK_MCP_READ_ONLY;
  process.env.SLACK_MCP_READ_ONLY = "1";
  try {
    // An unknown name still reports unknown_tool, which proves the read-only
    // branch is not swallowing everything on its way past.
    const result = await dispatchToolCall("slack_not_a_tool", {});
    const body = JSON.parse(result.content[0].text);
    assert.equal(body.code, "unknown_tool");
  } finally {
    if (previous === undefined) delete process.env.SLACK_MCP_READ_ONLY;
    else process.env.SLACK_MCP_READ_ONLY = previous;
  }
});

test("isWritePathTool and isReadOnlyRun agree with the lists they are built from", () => {
  for (const name of WRITE_PATH_TOOLS) assert.equal(isWritePathTool(name), true, name);
  assert.equal(isWritePathTool("slack_search_messages"), false);
  assert.equal(isWritePathTool(""), false);
  assert.equal(isReadOnlyRun(NO_ARGV, NO_ENV), false);
  assert.equal(isReadOnlyRun(["--readonly"], NO_ENV), true);
});
