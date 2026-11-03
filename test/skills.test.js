/**
 * MCP Skills (SEP-2640): what this server hands out, proven with the SDK's own
 * SkillsClient, which checks every file's size and digest and that the
 * frontmatter it reads matches the frontmatter it was listed with.
 *
 * Also the drift guards. The skills are prose about this server's tools, so
 * every tool name they mention must be a real one, and every key table they
 * print must match what lib/workflow-store.js and the shipped templates say.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { loadSkills } from "@modelcontextprotocol/server/ext/skills/node";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { SkillsClient } from "@modelcontextprotocol/client/ext/skills";

import { createSlackMcpServer } from "../lib/mcp-server.js";
import {
  BUNDLED_SKILLS_DIR,
  SKILLS_CACHE_HINT,
  loadServedSkills,
  loadSkillFolder,
  servableSkills,
  skillsExtensionFor,
} from "../lib/skills.js";
import { PROMPTS } from "../lib/mcp-server.js";
import { ESSENTIALS_TOOLS, READ_TOOLS, TOOLS, WRITE_PATH_TOOLS } from "../lib/tools.js";
import { structuredKeysFor } from "../lib/workflow-store.js";

const MODERN = "2026-07-28";
const URL_ = "http://slack-mcp.test/mcp";
const TOOL_NAMES = new Set(TOOLS.map((tool) => tool.name));
const BUNDLED = readdirSync(BUNDLED_SKILLS_DIR).sort();

async function connect(serverOptions, clientOptions = {}) {
  const handler = createMcpHandler(() => createSlackMcpServer(serverOptions));
  const client = new Client({ name: "skills-test", version: "0.0.0" }, clientOptions);
  await client.connect(new StreamableHTTPClientTransport(new URL(URL_), {
    fetch: async (input, init) => handler.fetch(input instanceof Request ? input : new Request(input, init)),
  }));
  return { client, handler, skills: new SkillsClient(client) };
}

function skillText(name) {
  return readFileSync(join(BUNDLED_SKILLS_DIR, name, "SKILL.md"), "utf8");
}

test("every bundled skill passes the SDK's strict catalog checks", async () => {
  const warnings = [];
  const catalog = await loadSkills(BUNDLED_SKILLS_DIR, { strict: true, onWarning: (w) => warnings.push(w) });
  assert.deepEqual(warnings, []);
  assert.deepEqual(catalog.entries.map((entry) => entry.frontmatter.name).sort(), BUNDLED);
  assert.equal(BUNDLED.length, 3);
});

test("skills name only real tools, and declare only real requirements", async () => {
  for (const name of BUNDLED) {
    const mentioned = new Set(skillText(name).match(/\bslack_[a-z_]+\b/g) || []);
    for (const tool of mentioned) {
      assert.ok(TOOL_NAMES.has(tool), `${name} mentions ${tool}, which is not a tool`);
    }
  }
  const loaded = await loadSkillFolder(BUNDLED_SKILLS_DIR);
  for (const skill of loaded) {
    assert.ok(skill.requires.length > 0, `${skill.name} declares no requires-tools`);
    for (const tool of skill.requires) {
      assert.ok(TOOL_NAMES.has(tool), `${skill.name} requires ${tool}, which is not a tool`);
    }
  }
});

test("the key tables in the skills match lib/workflow-store.js", () => {
  for (const name of ["slack-catch-up", "slack-workflow-profiles"]) {
    const rows = [...skillText(name).matchAll(/^\| `([a-z_]+)` \|(.*)\|\s*$/gm)]
      .filter(([, kind]) => ["support_inbox", "incident_room", "exec_brief", "product_launch_watch", "custom"].includes(kind));
    assert.equal(rows.length, 5, `${name} lists every workflow_kind`);
    for (const [, kind, rest] of rows) {
      const lastCell = rest.split("|").pop();
      const keys = [...lastCell.matchAll(/`([a-z_]+)`/g)].map((m) => m[1]);
      assert.deepEqual(keys, structuredKeysFor(kind), `${name}: keys for ${kind}`);
    }
  }
});

test("the template table matches the shipped templates", () => {
  const dir = new URL("../templates/workflow-profiles/", import.meta.url);
  const shipped = Object.fromEntries(readdirSync(dir).map((file) => {
    const t = JSON.parse(readFileSync(new URL(file, dir), "utf8"));
    return [t.profile_name, [t.workflow_kind, t.summary_cadence]];
  }));
  const listed = Object.fromEntries(
    [...skillText("slack-workflow-profiles").matchAll(/^\| `([a-z-]+)` \| `([a-z_]+)` \| `([a-z_0-9]+)` \|$/gm)]
      .map(([, template, kind, cadence]) => [template, [kind, cadence]])
  );
  assert.deepEqual(listed, shipped);
});

test("a skill is served only when its required tools are advertised", async () => {
  const skills = await loadSkillFolder(BUNDLED_SKILLS_DIR);
  const names = (tools) => servableSkills(skills, tools).map((skill) => skill.name).sort();
  assert.deepEqual(names(TOOLS.map((t) => t.name)), BUNDLED);
  assert.deepEqual(names(ESSENTIALS_TOOLS), ["slack-catch-up", "slack-send-safely"]);
  assert.deepEqual(names(READ_TOOLS), ["slack-catch-up"]);
  const readOnly = TOOLS.map((t) => t.name).filter((n) => !WRITE_PATH_TOOLS.includes(n));
  assert.deepEqual(names(readOnly), ["slack-catch-up", "slack-workflow-profiles"]);
  assert.deepEqual(names([]), []);
});

for (const era of ["legacy", "modern"]) {
  test(`${era} client lists, fetches and verifies every skill`, async () => {
    const options = era === "modern" ? { versionNegotiation: { mode: { pin: MODERN } } } : {};
    const { client, handler, skills } = await connect({ tools: TOOLS }, options);
    try {
      assert.equal(client.getProtocolEra(), era);
      assert.equal(skills.supported, true);
      const listing = await skills.list();
      assert.deepEqual(listing.invalid, []);
      assert.deepEqual(listing.skills.map((s) => s.frontmatter.name).sort(), BUNDLED);
      if (era === "modern") {
        assert.equal(listing.ttlMs, SKILLS_CACHE_HINT.ttlMs);
        assert.equal(listing.cacheScope, SKILLS_CACHE_HINT.cacheScope);
      } else {
        assert.equal(listing.ttlMs, undefined, "2025-era results never carry cache fields");
      }
      for (const skill of listing.skills) {
        const file = await skills.read(skill);
        assert.equal(file.verified, true);
        assert.equal(file.text, skillText(skill.frontmatter.name));
        const got = await skills.get(skill.uri);
        assert.equal(got.skill.uri, skill.uri);
      }

      // A resource-only client sees the same files, next to the slack:// ones.
      const resources = (await client.listResources()).resources.map((r) => r.uri);
      for (const uri of ["slack://workspace/info", "slack://conversations/list"]) assert.ok(resources.includes(uri));
      for (const name of BUNDLED) assert.ok(resources.includes(`skill://${name}/SKILL.md`), `${name} in resources/list`);
      const templates = (await client.listResourceTemplates()).resourceTemplates.map((t) => t.uriTemplate);
      assert.ok(templates.includes("skill://{+path}"));
      const read = await client.readResource({ uri: "skill://slack-send-safely/SKILL.md" });
      assert.equal(read.contents[0].text, skillText("slack-send-safely"));
    } finally {
      await client.close();
      await handler.close();
    }
  });
}

test("a read-only surface withholds the sending playbook end to end", async () => {
  const readOnly = TOOLS.filter((tool) => !WRITE_PATH_TOOLS.includes(tool.name));
  const { client, handler, skills } = await connect({ tools: readOnly });
  try {
    const names = (await skills.list()).skills.map((s) => s.frontmatter.name).sort();
    assert.deepEqual(names, ["slack-catch-up", "slack-workflow-profiles"]);
    await assert.rejects(skills.get("skill://slack-send-safely/SKILL.md"));
    await assert.rejects(client.readResource({ uri: "skill://slack-send-safely/SKILL.md" }));
  } finally {
    await client.close();
    await handler.close();
  }
});

function bodyOf(name) {
  const text = skillText(name);
  return text.slice(text.indexOf("\n---", 3) + 5).trim();
}

test("each served skill is also a prompt whose message is the skill's own text", async () => {
  const { client, handler } = await connect({ tools: TOOLS });
  try {
    const prompts = (await client.listPrompts()).prompts;
    assert.deepEqual(prompts.map((p) => p.name), [...PROMPTS.map((p) => p.name), ...BUNDLED]);
    const catchUp = prompts.find((p) => p.name === "slack-catch-up");
    assert.match(catchUp.description, /Catch someone up on Slack/);
    assert.deepEqual(catchUp.arguments.map((a) => [a.name, a.required]), [["request", false]]);

    const plain = await client.getPrompt({ name: "slack-catch-up" });
    assert.equal(plain.messages.length, 1);
    assert.equal(plain.messages[0].role, "user");
    assert.ok(plain.messages[0].content.text.startsWith(bodyOf("slack-catch-up")));
    assert.ok(!plain.messages[0].content.text.includes("requires-tools"), "frontmatter is not sent");

    const asked = await client.getPrompt({ name: "slack-catch-up", arguments: { request: "the incident channel since Friday" } });
    assert.match(asked.messages[0].content.text, /for this request: the incident channel since Friday$/);

    const builtIn = await client.getPrompt({ name: "search-recent", arguments: { query: "deploy" } });
    assert.match(builtIn.messages[0].content.text, /slack_search_messages/);
  } finally {
    await client.close();
    await handler.close();
  }
});

test("skill prompts follow the surface: read-only has no sending prompt", async () => {
  const readOnly = TOOLS.filter((tool) => !WRITE_PATH_TOOLS.includes(tool.name));
  const { client, handler } = await connect({ tools: readOnly });
  try {
    const names = (await client.listPrompts()).prompts.map((p) => p.name);
    assert.ok(names.includes("slack-catch-up"));
    assert.ok(!names.includes("slack-send-safely"));
    await assert.rejects(client.getPrompt({ name: "slack-send-safely" }));
  } finally {
    await client.close();
    await handler.close();
  }
});

test("one extension is shared by every server on the same surface", async () => {
  const skills = await loadSkillFolder(BUNDLED_SKILLS_DIR);
  const all = servableSkills(skills, TOOLS.map((t) => t.name));
  assert.equal(skillsExtensionFor(all), skillsExtensionFor(servableSkills(skills, TOOLS.map((t) => t.name))));
  assert.notEqual(skillsExtensionFor(all), skillsExtensionFor(servableSkills(skills, READ_TOOLS)));
  assert.equal(skillsExtensionFor([]), null);
});

test("skills: null serves no skills and declares no extension", async () => {
  const { client, handler, skills } = await connect({ tools: TOOLS, skills: null });
  try {
    assert.equal(skills.supported, false);
    const resources = (await client.listResources()).resources.map((r) => r.uri);
    assert.deepEqual(resources.sort(), ["slack://conversations/list", "slack://workspace/info"]);
  } finally {
    await client.close();
    await handler.close();
  }
});

test("SLACK_MCP_SKILLS_DIR adds a team's skills; broken, colliding and symlinked ones are skipped", async () => {
  const dir = mkdtempSync(join(tmpdir(), "slack-mcp-skills-"));
  const write = (name, frontmatterName, body = "Body.") => {
    mkdirSync(join(dir, name), { recursive: true });
    writeFileSync(join(dir, name, "SKILL.md"), `---\nname: ${frontmatterName}\ndescription: A team playbook for tests.\n---\n\n${body}\n`);
  };
  write("team-incident-process", "team-incident-process", "Page the on-call lead first.");
  mkdirSync(join(dir, "team-incident-process", "references"));
  writeFileSync(join(dir, "team-incident-process", "references", "severity.md"), "SEV1 means customers are down.\n");
  write("Bad_Name", "Bad_Name");
  write("slack-catch-up", "slack-catch-up", "An attempt to replace the bundled skill.");
  write("linked", "linked");
  symlinkSync(join(dir, "team-incident-process", "SKILL.md"), join(dir, "linked", "extra.md"));

  const errors = [];
  const original = console.error;
  console.error = (line) => errors.push(String(line));
  let served;
  try {
    served = await loadServedSkills({ SLACK_MCP_SKILLS_DIR: dir });
  } finally {
    console.error = original;
  }

  assert.deepEqual(served.map((s) => s.name).sort(), [...BUNDLED, "team-incident-process"].sort());
  assert.equal(served.find((s) => s.name === "slack-catch-up").origin, "bundled");
  assert.ok(errors.some((line) => line.includes("Bad_Name")), "invalid name reported");
  assert.ok(errors.some((line) => line.includes("slack-catch-up") && line.includes("bundled one is served")), "collision reported");
  assert.ok(errors.some((line) => line.includes("linked") && line.includes("symlink")), "symlink reported");

  // A skill with no requires-tools is served on every surface, and its
  // reference file is fetched and verified like SKILL.md.
  const { client, handler, skills } = await connect({ tools: [], skills: served });
  try {
    const listing = await skills.list();
    assert.deepEqual(listing.skills.map((s) => s.frontmatter.name), ["team-incident-process"]);
    const reference = await skills.read(listing.skills[0], "references/severity.md");
    assert.equal(reference.verified, true);
    assert.equal(reference.text, "SEV1 means customers are down.\n");
  } finally {
    await client.close();
    await handler.close();
  }
});

test("SLACK_MCP_SKILLS=off serves nothing; a missing folder is reported, not fatal", async () => {
  assert.deepEqual(await loadServedSkills({ SLACK_MCP_SKILLS: "off" }), []);
  const errors = [];
  const original = console.error;
  console.error = (line) => errors.push(String(line));
  let served;
  try {
    served = await loadServedSkills({ SLACK_MCP_SKILLS_DIR: join(tmpdir(), "slack-mcp-no-such-skills-dir") });
  } finally {
    console.error = original;
  }
  assert.deepEqual(served.map((s) => s.name).sort(), BUNDLED);
  assert.ok(errors.some((line) => line.includes("was not read")));
});
