/**
 * Workflow Profile Store (local JSON, OSS-only)
 *
 * Stores user-defined workflow profiles that bind a workflow_kind
 * (support_inbox | incident_room | exec_brief | product_launch_watch | custom)
 * to a set of channels, priority people, retention mode, and summary cadence.
 *
 * The hosted AI brain (smart_search, catch_me_up, triage) consumes these
 * profiles and returns structured JSON per the workflow_kind. The OSS
 * package ships the profile primitives but not the AI brain — it's
 * hosted-only because it needs Vectorize + Workers AI.
 *
 * File: ~/.slack-mcp-workflows.json (chmod 600)
 * Atomic write pattern (temp → chmod → rename) prevents corruption from
 * concurrent writes by multiple slack-mcp-server instances.
 */

import { writeFileSync, readFileSync, existsSync, renameSync, unlinkSync } from "fs";
import { execSync } from "child_process";
import { homedir, platform } from "os";
import { join } from "path";

const STORE_FILE = join(homedir(), ".slack-mcp-workflows.json");
const STORE_VERSION = 1;

const ALLOWED_WORKFLOW_KINDS = new Set([
  "support_inbox",
  "incident_room",
  "exec_brief",
  "product_launch_watch",
  "custom",
]);

const ALLOWED_RETENTION_MODES = new Set(["ephemeral", "persistent"]);
const ALLOWED_SUMMARY_CADENCES = new Set(["on_demand", "daily_8am", "weekly_monday"]);

const STRUCTURED_KEYS_BY_KIND = {
  support_inbox: ["open_threads", "ack_lag", "owner_gaps", "escalations", "next_actions"],
  incident_room: ["incident_summary", "timeline", "open_risks", "owner_gaps", "next_actions"],
  exec_brief: ["summary", "decisions", "risks", "asks", "action_items"],
  product_launch_watch: ["launch_signals", "feedback_themes", "blockers", "metrics", "next_actions"],
  custom: ["summary", "highlights", "open_questions", "next_actions"],
};

function emptyStore() {
  return { version: STORE_VERSION, profiles: {} };
}

function atomicWriteSync(filePath, content) {
  const tempPath = `${filePath}.${process.pid}.tmp`;
  try {
    writeFileSync(tempPath, content);
    if (platform() === "darwin" || platform() === "linux") {
      try { execSync(`chmod 600 "${tempPath}"`); } catch {}
    }
    renameSync(tempPath, filePath);
  } catch (e) {
    try { unlinkSync(tempPath); } catch {}
    throw e;
  }
}

export function loadStore() {
  if (!existsSync(STORE_FILE)) return emptyStore();
  try {
    const data = JSON.parse(readFileSync(STORE_FILE, "utf-8"));
    if (!data || typeof data !== "object" || !data.profiles) return emptyStore();
    if (data.version !== STORE_VERSION) {
      // Future: migration logic. For now, treat unknown versions as empty.
      return emptyStore();
    }
    return data;
  } catch {
    return emptyStore();
  }
}

export function saveStore(store) {
  atomicWriteSync(STORE_FILE, JSON.stringify(store, null, 2));
}

export function structuredKeysFor(workflowKind) {
  return STRUCTURED_KEYS_BY_KIND[workflowKind] || STRUCTURED_KEYS_BY_KIND.custom;
}

export function validateProfile(input) {
  const errors = [];
  if (!input || typeof input !== "object") {
    return { valid: false, errors: ["profile must be an object"] };
  }
  if (!input.profile_name || typeof input.profile_name !== "string" || !input.profile_name.trim()) {
    errors.push("profile_name is required (non-empty string)");
  }
  if (!input.workflow_kind || !ALLOWED_WORKFLOW_KINDS.has(input.workflow_kind)) {
    errors.push(`workflow_kind must be one of: ${Array.from(ALLOWED_WORKFLOW_KINDS).join(", ")}`);
  }
  if (input.channels && (!Array.isArray(input.channels) || input.channels.some((c) => typeof c !== "string"))) {
    errors.push("channels must be an array of strings (Slack channel IDs)");
  }
  if (input.priority_people && (!Array.isArray(input.priority_people) || input.priority_people.some((p) => typeof p !== "string"))) {
    errors.push("priority_people must be an array of strings (Slack user IDs)");
  }
  if (input.retention_mode && !ALLOWED_RETENTION_MODES.has(input.retention_mode)) {
    errors.push(`retention_mode must be one of: ${Array.from(ALLOWED_RETENTION_MODES).join(", ")}`);
  }
  if (input.summary_cadence && !ALLOWED_SUMMARY_CADENCES.has(input.summary_cadence)) {
    errors.push(`summary_cadence must be one of: ${Array.from(ALLOWED_SUMMARY_CADENCES).join(", ")}`);
  }
  return { valid: errors.length === 0, errors };
}

export function saveProfile(input) {
  const { valid, errors } = validateProfile(input);
  if (!valid) {
    return { ok: false, errors };
  }
  const store = loadStore();
  const now = new Date().toISOString();
  const existing = store.profiles[input.profile_name];
  const profile = {
    workflow_kind: input.workflow_kind,
    channels: Array.isArray(input.channels) ? [...input.channels] : [],
    priority_people: Array.isArray(input.priority_people) ? [...input.priority_people] : [],
    retention_mode: input.retention_mode || "ephemeral",
    summary_cadence: input.summary_cadence || "on_demand",
    structured_keys: structuredKeysFor(input.workflow_kind),
    created_at: existing && existing.created_at ? existing.created_at : now,
    updated_at: now,
  };
  store.profiles[input.profile_name] = profile;
  saveStore(store);
  return { ok: true, profile_name: input.profile_name, profile };
}

export function listProfiles({ workflow_kind } = {}) {
  const store = loadStore();
  const entries = Object.entries(store.profiles).map(([name, profile]) => ({ profile_name: name, ...profile }));
  if (workflow_kind) {
    if (!ALLOWED_WORKFLOW_KINDS.has(workflow_kind)) {
      return { ok: false, errors: [`workflow_kind filter must be one of: ${Array.from(ALLOWED_WORKFLOW_KINDS).join(", ")}`] };
    }
    return { ok: true, profiles: entries.filter((p) => p.workflow_kind === workflow_kind) };
  }
  return { ok: true, profiles: entries };
}

export function deleteProfile(profile_name) {
  const store = loadStore();
  if (!store.profiles[profile_name]) {
    return { ok: false, errors: [`profile_name "${profile_name}" not found`] };
  }
  delete store.profiles[profile_name];
  saveStore(store);
  return { ok: true, profile_name };
}

export function getProfile(profile_name) {
  const store = loadStore();
  const profile = store.profiles[profile_name];
  if (!profile) return null;
  return { profile_name, ...profile };
}

export const ALLOWED_WORKFLOW_KINDS_LIST = Array.from(ALLOWED_WORKFLOW_KINDS);
