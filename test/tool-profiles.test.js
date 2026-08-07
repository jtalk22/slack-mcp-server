import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  TOOLS,
  ESSENTIALS_TOOLS,
  readOnlyToolNames,
  resolveToolProfile,
  getActiveToolProfile,
} from "../lib/tools.js";

test("default (empty / 'all') advertises the full canonical surface", () => {
  for (const value of ["", "all", "  ALL ", undefined, null]) {
    const r = resolveToolProfile(value);
    assert.equal(r.profile, "all", `value ${JSON.stringify(value)} → all`);
    assert.equal(r.tools.length, TOOLS.length);
    assert.equal(r.tools, TOOLS, "returns the canonical array by reference for 'all'");
  }
});

test("essentials is the six-tool common-case slice", () => {
  const r = resolveToolProfile("essentials");
  assert.equal(r.profile, "essentials");
  assert.deepEqual(r.tools.map((t) => t.name).sort(), [...ESSENTIALS_TOOLS].sort());
  assert.ok(r.tools.length < TOOLS.length, "essentials is a strict subset");
  const names = new Set(r.tools.map((t) => t.name));
  assert.ok(names.has("slack_send_message"), "the one JTBD write is present");
  assert.ok(!names.has("slack_add_reaction"), "non-core writes are excluded");
});

test("read profile is exactly the read-only annotated tools", () => {
  const r = resolveToolProfile("read");
  assert.equal(r.profile, "read");
  assert.deepEqual(r.tools.map((t) => t.name).sort(), readOnlyToolNames().sort());
  assert.ok(r.tools.every((t) => t.annotations?.readOnlyHint === true));
  assert.ok(!r.tools.some((t) => t.name === "slack_send_message"), "no write tools in read profile");
});

test("custom comma list keeps known tools in canonical order and drops unknown", () => {
  const r = resolveToolProfile("slack_get_thread, slack_send_message, not_a_tool");
  assert.equal(r.profile, "custom");
  // Canonical order: send_message precedes get_thread in TOOLS.
  assert.deepEqual(r.tools.map((t) => t.name), ["slack_send_message", "slack_get_thread"]);
  assert.deepEqual(r.dropped, ["not_a_tool"]);
  assert.match(r.warning, /dropped unknown tool/);
});

test("a value that matches nothing falls back to all, never to zero", () => {
  const r = resolveToolProfile("totally_unknown_value");
  assert.equal(r.profile, "all");
  assert.equal(r.tools.length, TOOLS.length);
  assert.ok(r.warning, "the fallback is surfaced, not silent");
});

test("getActiveToolProfile: cli --tools beats env, env beats default", () => {
  const viaCli = getActiveToolProfile(["node", "server.js", "--tools=essentials"], { SLACK_MCP_TOOLS: "read" });
  assert.equal(viaCli.profile, "essentials");
  assert.equal(viaCli.source, "cli");

  const viaCliSpace = getActiveToolProfile(["node", "server.js", "--tools", "read"], {});
  assert.equal(viaCliSpace.profile, "read");
  assert.equal(viaCliSpace.source, "cli");

  const viaEnv = getActiveToolProfile(["node", "server.js"], { SLACK_MCP_TOOLS: "read" });
  assert.equal(viaEnv.profile, "read");
  assert.equal(viaEnv.source, "env");

  const dflt = getActiveToolProfile(["node", "server.js"], {});
  assert.equal(dflt.profile, "all");
  assert.equal(dflt.source, "default");
});

test("--tools with a missing operand never swallows the following option", () => {
  for (const trailing of ["--setup", "--profile=work", "--doctor"]) {
    const r = getActiveToolProfile(["node", "server.js", "--tools", trailing], {});
    assert.equal(r.profile, "all", `--tools ${trailing} must not resolve a profile`);
    assert.equal(r.source, "default", `--tools ${trailing} must not count as a cli value`);
  }
  // Trailing --tools with nothing after it is equally a missing operand.
  const bare = getActiveToolProfile(["node", "server.js", "--tools"], {});
  assert.equal(bare.source, "default");
});

test("cli rejects --tools/--profile with a missing operand instead of eating the next flag", () => {
  const cli = fileURLToPath(new URL("../src/cli.js", import.meta.url));
  for (const argv of [["--tools", "--setup"], ["--profile", "--setup"], ["--tools"]]) {
    const r = spawnSync(process.execPath, [cli, ...argv], { encoding: "utf8", timeout: 20000 });
    assert.equal(r.status, 1, `${argv.join(" ")} must exit 1`);
    assert.match(r.stderr, /requires a value/, `${argv.join(" ")} must explain the missing value`);
  }
});

test("essentials tool names all exist in the canonical surface (no rot)", () => {
  const known = new Set(TOOLS.map((t) => t.name));
  for (const name of ESSENTIALS_TOOLS) {
    assert.ok(known.has(name), `${name} must exist in TOOLS`);
  }
});
