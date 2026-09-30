#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { TOOLS } from "../lib/tools.js";

const target = new URL("../docs/API.md", import.meta.url);
const notes = {
  slack_refresh_tokens: "Automatic extraction uses Slack credentials already stored in a macOS Chrome profile. A live Slack tab and browser scripting permission are not required. On Windows or Linux, refresh your manually supplied session credentials.",
  slack_list_conversations: "DM discovery is opt-in with `discover_dms`. Leave it off for the fastest listing; enable it when you need to find DM conversations not already cached.",
  slack_conversations_history: "For larger exports, use `slack_get_full_conversation`. Set `resolve_users=false` when user IDs are enough and you want to avoid name-lookup requests.",
  slack_get_full_conversation: "The export reads history up to `max_messages` and can include thread replies. `output_file` writes a JSON export under `~/.slack-mcp-exports/`.",
  slack_workflow_save: "Saves a local workflow profile in `~/.slack-mcp-workflows.json`. Cadence selects the default catch-up window; scheduling is provided separately by hosted. This tool does not post to Slack.",
  slack_catch_me_up: "Reads a saved profile and returns `scope`, `signals`, `conversations`, `output_contract`, and `truncation`. Your calling agent composes the brief from this evidence and cites the source messages. Defaults to 24 hours, or 7 days for a weekly profile. A missing profile returns `profile_not_found` with available profiles and a next action. No hosted account or server-side model is needed.",
};

function cell(value) {
  return String(value ?? "").replaceAll("|", "\\|").replace(/\s+/g, " ").trim();
}

function typeOf(schema) {
  return schema.type === "array" ? `array<${schema.items?.type || "unknown"}>` : schema.type;
}

const sections = TOOLS.map((tool) => {
  const required = new Set(tool.inputSchema.required || []);
  const parameters = Object.entries(tool.inputSchema.properties || {});
  const lines = [`### ${tool.name}`, "", tool.description, ""];
  if (tool.annotations.destructiveHint) {
    lines.push("**Writes to Slack.** Ask your client to require approval before executing this tool.", "");
  }
  if (parameters.length) {
    lines.push("| Parameter | Type | Required | Description |", "|---|---|---|---|");
    for (const [name, schema] of parameters) {
      const choices = schema.enum || schema.items?.enum;
      const extra = choices ? ` Values: ${choices.map((value) => `\`${value}\``).join(", ")}.` : "";
      lines.push(`| \`${name}\` | ${cell(typeOf(schema))} | ${required.has(name) ? "yes" : "no"} | ${cell(schema.description)}${cell(extra) ? " " + cell(extra) : ""} |`);
    }
    lines.push("");
  } else {
    lines.push("**Parameters:** None.", "");
  }
  if (notes[tool.name]) lines.push(notes[tool.name], "");
  return lines.join("\n");
});

const result = [
  "# API Reference", "",
  "<!-- Generated from lib/tools.js by scripts/generate-api-docs.js. -->", "",
  `The local package exposes ${TOOLS.length} tools. Parameter names, required fields, and descriptions below are generated from the same schemas your MCP client receives.`, "",
  "## Reading results", "",
  "Tools return MCP text content containing JSON. Parse `result.content[0].text` to read the payload; tool errors may set `isError`. The protocol layer adds the metadata required by the negotiated MCP revision.", "",
  "Slack timestamps such as `oldest`, `latest`, and `thread_ts` are Unix seconds in string form. The catch-up tool's `since` accepts ISO 8601. Opt into `include_rich_message_fields` to retain attachments, blocks, metadata, files, and reactions on supported reads.", "",
  "## Choosing a tool profile", "",
  "`SLACK_MCP_TOOLS=all` advertises the full surface. `essentials` advertises six common tools; `read` advertises twelve Slack read tools. Run `npm run measure:tools` to compare estimated schema tokens. These profiles narrow discovery; use your client's approval controls to govern writes.", "",
  "## First useful workflow", "",
  "1. Run `slack_health_check` to verify the connection.",
  "2. Save a profile with `slack_workflow_save`, for example:", "",
  "```json", '{"profile_name":"morning","workflow_kind":"exec_brief","channels":["C012345"]}', "```", "",
  "3. Call `slack_catch_me_up` with `profile_name=\"morning\"`, then ask your agent to compose the brief with links to the evidence. Use `slack_workflows` to find saved profiles.", "",
  "## Tools", "",
  sections.join("\n---\n\n"), "",
  "## Maintaining this reference", "",
  "Edit tool schemas in `lib/tools.js`, then run `npm run build:api-docs`. CI checks the generated reference with `npm run verify:api-docs`.", "",
].join("\n");

if (process.argv.includes("--check")) {
  if (readFileSync(target, "utf8") !== result) {
    console.error("API reference is out of date. Run npm run build:api-docs.");
    process.exitCode = 1;
  } else console.log(`API reference matches all ${TOOLS.length} tool schemas.`);
} else {
  writeFileSync(target, result);
  console.log(`Generated API reference for ${TOOLS.length} tools.`);
}
