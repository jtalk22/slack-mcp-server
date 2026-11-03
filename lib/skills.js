/**
 * MCP Skills (SEP-2640) served by this server.
 *
 * A skill is a folder holding a `SKILL.md`: instructions an agent loads when a
 * task matches the skill's description. This server ships playbooks for its own
 * tools under `skills/`. A client that speaks the Skills extension finds them
 * through `skills/list`; any client that reads resources finds the same
 * `SKILL.md` files in `resources/list` as `skill://` URIs.
 *
 * Two things set this apart from pointing the SDK's `loadSkills()` at a folder:
 *
 *   - A skill is served only when the tools it cannot work without are on the
 *     advertised surface. Each bundled skill declares them in its frontmatter
 *     (`metadata.requires-tools`). A `--read-only` run never hands out the
 *     sending playbook, and the `essentials` profile never describes profile
 *     tools it does not offer. A skill that declares no requirement is always
 *     served.
 *   - An operator can add a team's own playbooks with SLACK_MCP_SKILLS_DIR (a
 *     folder of skill folders). Bundled names win a collision, so a local
 *     folder can add playbooks but cannot silently replace a shipped one.
 *
 * Files are read once, at startup, and served from memory. SLACK_MCP_SKILLS=off
 * serves none. A skill that fails the SDK's checks (frontmatter, name,
 * description, size limits, symlinks) is skipped with a line on stderr, and the
 * server keeps running.
 */

import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { SkillsExtension, skillEntry } from "@modelcontextprotocol/server/ext/skills";
import { nodeSkillFiles } from "@modelcontextprotocol/server/ext/skills/node";

export const BUNDLED_SKILLS_DIR = fileURLToPath(new URL("../skills/", import.meta.url));

// Skill content is fixed for the life of a process, like tools/list, so the
// 2026-07-28 cache hint can say so. 2025-era responses never carry it.
export const SKILLS_CACHE_HINT = Object.freeze({ ttlMs: 60_000, cacheScope: "public" });

const BASE_URI = "skill://";
const REQUIRES_KEY = "requires-tools";
const UTF8 = new TextDecoder("utf-8", { fatal: true });

const MIME_BY_EXTENSION = {
  md: "text/markdown",
  json: "application/json",
  txt: "text/plain",
  yaml: "application/yaml",
  yml: "application/yaml",
};

function warn(message) {
  // stderr: on stdio, stdout is the protocol channel.
  console.error(`skills: ${message}`);
}

function mimeTypeFor(path) {
  const extension = path.includes(".") ? path.split(".").pop().toLowerCase() : "";
  return MIME_BY_EXTENSION[extension] || "application/octet-stream";
}

/** The tool names a skill declares it cannot work without. */
export function requiredToolsOf(entry) {
  const raw = entry?.frontmatter?.metadata?.[REQUIRES_KEY];
  return typeof raw === "string" ? raw.split(/\s+/).filter(Boolean) : [];
}

async function collectFiles(files, dir, prefixLength, out) {
  for (const item of await files.list(dir)) {
    const path = `${dir}/${item.name}`;
    if (item.kind === "unsupported") {
      throw new Error(`${path} is a symlink or special file; skills are served from regular files only`);
    }
    if (item.kind === "directory") {
      await collectFiles(files, path, prefixLength, out);
    } else {
      out[path.slice(prefixLength)] = await files.read(path);
    }
  }
}

/**
 * Read every skill folder under `root` into memory and build its entry with
 * the SDK's own checks (`skillEntry`: frontmatter, name rules, digests).
 */
export async function loadSkillFolder(root, { origin = "bundled" } = {}) {
  const files = nodeSkillFiles(root);
  let top;
  try {
    top = await files.list("");
  } catch (error) {
    warn(`${origin} folder ${root} was not read (${error?.code || error?.message || error})`);
    return [];
  }

  const skills = [];
  for (const item of top) {
    if (item.kind !== "directory") continue;
    try {
      const record = {};
      await collectFiles(files, item.name, item.name.length + 1, record);
      if (!record["SKILL.md"]) {
        warn(`${origin} ${item.name}/ has no SKILL.md; skipped`);
        continue;
      }
      const entry = await skillEntry(item.name, record, { baseUri: BASE_URI });
      const byPath = new Map(Object.entries(record));
      skills.push({ name: entry.frontmatter.name, origin, entry, files: byPath, requires: requiredToolsOf(entry) });
    } catch (error) {
      warn(`${origin} ${item.name}/ skipped: ${error?.message || error}`);
    }
  }
  return skills;
}

/** Bundled skills first, then the operator's, with bundled names winning. */
export function mergeSkillSets(bundled, local) {
  const merged = [...bundled];
  const taken = new Set(bundled.map((skill) => skill.name));
  for (const skill of local) {
    if (taken.has(skill.name)) {
      warn(`${skill.origin} ${skill.name} has the name of a bundled skill; the bundled one is served`);
      continue;
    }
    taken.add(skill.name);
    merged.push(skill);
  }
  return merged;
}

function skillsDisabled(env) {
  return ["off", "0", "false", "no", "none"].includes(String(env.SLACK_MCP_SKILLS ?? "").trim().toLowerCase());
}

/** Load what this process serves: bundled skills plus SLACK_MCP_SKILLS_DIR. */
export async function loadServedSkills(env = process.env) {
  if (skillsDisabled(env)) return [];
  const bundled = await loadSkillFolder(BUNDLED_SKILLS_DIR, { origin: "bundled" });
  const localDir = String(env.SLACK_MCP_SKILLS_DIR ?? "").trim();
  const local = localDir ? await loadSkillFolder(resolve(localDir), { origin: "SLACK_MCP_SKILLS_DIR" }) : [];
  return mergeSkillSets(bundled, local);
}

/** The skills whose required tools are all on the advertised surface. */
export function servableSkills(skills, advertisedToolNames) {
  const advertised = new Set(advertisedToolNames);
  return skills.filter((skill) => skill.requires.every((tool) => advertised.has(tool)));
}

/** Split `skill://<skill>/<path>` into the skill name and the file path. */
function locate(uri) {
  if (typeof uri !== "string" || !uri.startsWith(BASE_URI)) return null;
  const rest = uri.slice(BASE_URI.length).split("#")[0];
  const slash = rest.indexOf("/");
  if (slash <= 0) return null;
  try {
    return {
      name: decodeURIComponent(rest.slice(0, slash)),
      path: rest.slice(slash + 1).split("/").map(decodeURIComponent).join("/"),
    };
  } catch {
    return null;
  }
}

/** A SkillSource over skills already in memory. */
export function memorySkillSource(skills) {
  const byName = new Map(skills.map((skill) => [skill.name, skill]));
  return {
    async list() {
      return { skills: skills.map((skill) => skill.entry) };
    },
    async get(uri) {
      const at = locate(uri);
      if (!at || at.path !== "SKILL.md") return undefined;
      return byName.get(at.name)?.entry;
    },
    async read(uri) {
      const at = locate(uri);
      const bytes = at ? byName.get(at.name)?.files.get(at.path) : undefined;
      if (!bytes) return undefined;
      const mimeType = mimeTypeFor(at.path);
      try {
        return { text: UTF8.decode(bytes), mimeType };
      } catch {
        return { bytes, mimeType };
      }
    },
    async listResources() {
      return skills.map((skill) => ({
        uri: skill.entry.uri,
        name: skill.name,
        description: skill.entry.frontmatter.description,
        mimeType: "text/markdown",
      }));
    },
  };
}

/** Everything this process serves, loaded once. */
export const SERVED_SKILLS = await loadServedSkills();

const extensionsByLoad = new WeakMap();

/**
 * The Skills extension for skills already filtered to one surface, or null
 * when there are none. One extension serves any number of servers (it holds
 * them weakly), so the per-request HTTP servers share one per surface instead
 * of building one each time.
 */
export function skillsExtensionFor(served) {
  if (served.length === 0) return null;
  const key = served.map((skill) => skill.name).join("\n");
  // Cache per loaded set (the process's own, or one a test built) and surface.
  const owner = served[0];
  let bySurface = extensionsByLoad.get(owner);
  if (!bySurface) extensionsByLoad.set(owner, (bySurface = new Map()));
  if (bySurface.has(key)) return bySurface.get(key);
  const extension = new SkillsExtension({
    source: memorySkillSource(served),
    baseUri: BASE_URI,
    cacheHint: SKILLS_CACHE_HINT,
    onWarning: ({ path, message }) => warn(`${path}: ${message}`),
  });
  bySurface.set(key, extension);
  return extension;
}

// ============ Skills as prompts ============
//
// Most MCP clients list prompts as slash commands and do not speak the Skills
// extension yet. Each served skill is also offered as a prompt of the same
// name whose message is the skill's own SKILL.md body, so a client without
// Skills support still gets the playbook, and the two can never disagree:
// both are read from the same bytes.

const SKILL_PROMPT_ARGUMENTS = Object.freeze([
  Object.freeze({
    name: "request",
    description: "What to do or focus on, in your words (optional)",
    required: false,
  }),
]);

function skillBody(skill) {
  const text = UTF8.decode(skill.files.get("SKILL.md"));
  const close = text.indexOf("\n---", 3);
  return (close === -1 ? text : text.slice(text.indexOf("\n", close + 1) + 1)).trim();
}

/** The prompt definitions for skills already filtered to one surface. */
export function skillPrompts(served, reservedNames = []) {
  const reserved = new Set(reservedNames);
  return served
    .filter((skill) => !reserved.has(skill.name))
    .map((skill) => ({
      name: skill.name,
      description: skill.entry.frontmatter.description,
      arguments: SKILL_PROMPT_ARGUMENTS,
    }));
}

/** The prompts/get messages for one skill prompt, or null when it is not one. */
export function skillPromptMessages(served, name, args) {
  const skill = served.find((candidate) => candidate.name === name);
  if (!skill) return null;
  const request = typeof args?.request === "string" ? args.request.trim() : "";
  const text = request
    ? `${skillBody(skill)}\n\n---\n\nFollow the playbook above for this request: ${request}`
    : `${skillBody(skill)}\n\n---\n\nFollow the playbook above.`;
  return [{ role: "user", content: { type: "text", text } }];
}
