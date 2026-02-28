#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const CONFIG = {
  owner: "jtalk22",
  repo: "slack-mcp-server",
  releaseTag: "v3.0.0",
  discussionAnnouncement: 12,
  discussionSupport: 13,
  awesomeOwner: "punkpeye",
  awesomeRepo: "awesome-mcp-servers",
  awesomePrNumber: 2511,
  mcpServerName: "io.github.jtalk22/slack-mcp-server",
  mcpRegistryUrl:
    "https://registry.modelcontextprotocol.io/v0/servers/io.github.jtalk22%2Fslack-mcp-server/versions/latest",
  smitheryApiUrl: "https://server.smithery.ai/jtalk22/slack-mcp-server",
  smitheryListingUrl: "https://smithery.ai/server/jtalk22/slack-mcp-server",
  glamaServerUrl: "https://glama.ai/mcp/servers/jtalk22/slack-mcp-server",
  glamaApiUrl: "https://glama.ai/mcp/api",
  launchLogPath: join(ROOT, "docs", "release-health", "launch-log-2026-02-28.md"),
};

const HOOK_LINE =
  "`v3.0.0` flips hosted `/mcp` from permissive to secure-default without breaking local workflows.";

const VERIFY_BLOCK = [
  "```bash",
  "npx -y @jtalk22/slack-mcp@latest --version",
  "npx -y @jtalk22/slack-mcp@latest --doctor",
  "npx -y @jtalk22/slack-mcp@latest --status",
  "```",
].join("\n");

const SUPPORT_LINE =
  "Support ongoing maintenance: https://github.com/sponsors/jtalk22, https://ko-fi.com/jtalk22, https://buymeacoffee.com/jtalk22";

const MIGRATION_BLOCK = [
  "```bash",
  "export SLACK_TOKEN=xoxc-...",
  "export SLACK_COOKIE=xoxd-...",
  "export SLACK_MCP_HTTP_AUTH_TOKEN=change-this",
  "export SLACK_MCP_HTTP_ALLOWED_ORIGINS=https://claude.ai",
  "node src/server-http.js",
  "```",
].join("\n");

const DISCUSSION_ANNOUNCEMENT_BODY = [
  HOOK_LINE,
  "",
  VERIFY_BLOCK,
  "",
  "60-second hosted migration:",
  MIGRATION_BLOCK,
  "",
  "Hosted-only breaking scope:",
  "- hosted `/mcp` now requires `SLACK_MCP_HTTP_AUTH_TOKEN` and bearer headers",
  "- browser-origin calls now require `SLACK_MCP_HTTP_ALLOWED_ORIGINS`",
  "- local paths (`stdio`, `web`) remain unchanged",
  "",
  "Deployment intake: https://github.com/jtalk22/slack-mcp-server/issues/new?template=deployment-intake.md",
  "Discussions: https://github.com/jtalk22/slack-mcp-server/discussions",
  SUPPORT_LINE,
].join("\n");

const DISCUSSION_SUPPORT_BODY = [
  HOOK_LINE,
  "",
  "Use this thread for `v3.0.0` migration and install blockers.",
  "",
  VERIFY_BLOCK,
  "",
  "60-second hosted migration:",
  MIGRATION_BLOCK,
  "",
  "When reporting an issue include:",
  "- OS + Node version",
  "- runtime mode (`stdio|web|http|worker`)",
  "- exact command + full output",
  "",
  "Deployment intake: https://github.com/jtalk22/slack-mcp-server/issues/new?template=deployment-intake.md",
  SUPPORT_LINE,
].join("\n");

const COMMENT_12_MARKER = "<!-- impact-push-v3-discussion-12 -->";
const COMMENT_13_MARKER = "<!-- impact-push-v3-discussion-13 -->";
const COMMENT_AWESOME_MARKER = "<!-- impact-push-v3-awesome -->";

const QUICK_PROOF_COMMENT_BODY = [
  "Maintainer update:",
  HOOK_LINE,
  "",
  VERIFY_BLOCK,
  "",
  "60-second hosted migration:",
  MIGRATION_BLOCK,
].join("\n");

const COMMENT_12_BODY = [
  COMMENT_12_MARKER,
  "",
  QUICK_PROOF_COMMENT_BODY,
  "",
  "If you hit a blocker, post runtime mode + exact output.",
].join("\n");

const COMMENT_13_BODY = [
  COMMENT_13_MARKER,
  "",
  QUICK_PROOF_COMMENT_BODY,
  "",
  "Migration scope:",
  "- local `stdio`/`web` users do not need migration",
  "- hosted users need bearer token + CORS allowlist",
  "",
  SUPPORT_LINE,
].join("\n");

const COMMENT_AWESOME_BODY = [
  COMMENT_AWESOME_MARKER,
  "",
  "Status refresh for `v3.0.0`:",
  "- npm latest: `3.0.0`",
  "- GitHub release: https://github.com/jtalk22/slack-mcp-server/releases/tag/v3.0.0",
  "- release notes include hosted-only breaking scope + verify block",
  "",
  "If maintainers prefer listing text updates, I can adjust immediately.",
].join("\n");

function parseArgs(argv) {
  const hasApply = argv.includes("--apply");
  const hasDry = argv.includes("--dry-run");
  const timeoutIdx = argv.indexOf("--timeout-seconds");
  const intervalIdx = argv.indexOf("--poll-interval-seconds");

  return {
    mode: hasApply ? "apply" : "dry-run",
    timeoutSeconds: timeoutIdx > -1 ? Number(argv[timeoutIdx + 1]) : 240,
    pollIntervalSeconds: intervalIdx > -1 ? Number(argv[intervalIdx + 1]) : 20,
    explicitDryRun: hasDry,
  };
}

function nowIso() {
  return new Date().toISOString();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isObject(value) {
  return value !== null && typeof value === "object";
}

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function escapeCell(value) {
  return String(value ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\n/g, "<br>")
    .trim();
}

async function request(url, { method = "GET", token = null, body = null, headers = {} } = {}) {
  const requestHeaders = {
    Accept: "application/vnd.github+json",
    "User-Agent": "slack-mcp-impact-push-v3",
    ...headers,
  };

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const json = safeParseJson(text);
  return {
    ok: response.ok,
    status: response.status,
    text,
    json,
    headers: response.headers,
  };
}

async function gh(path, { method = "GET", token = null, body = null } = {}) {
  return request(`https://api.github.com${path}`, {
    method,
    token,
    body,
    headers: { "Content-Type": "application/json" },
  });
}

async function ghGraphql({ token, query, variables = {} }) {
  return request("https://api.github.com/graphql", {
    method: "POST",
    token,
    body: { query, variables },
    headers: { "Content-Type": "application/json" },
  });
}

async function getDiscussionGraphql({ token, number }) {
  const query = `
    query($owner:String!, $repo:String!, $number:Int!) {
      repository(owner:$owner, name:$repo) {
        discussion(number:$number) {
          id
          title
          body
          url
          comments(first:100) {
            nodes {
              id
              body
              url
              author {
                login
              }
            }
          }
        }
      }
    }
  `;

  const res = await ghGraphql({
    token,
    query,
    variables: { owner: CONFIG.owner, repo: CONFIG.repo, number },
  });

  const discussion = res.json?.data?.repository?.discussion || null;
  return { ...res, discussion };
}

function loadReleaseBody() {
  const path = join(ROOT, ".github", "v3.0.0-release-notes.md");
  return readFileSync(path, "utf8").trim();
}

function buildLogRow(entry) {
  return `| ${escapeCell(entry.timestamp)} | ${escapeCell(entry.channel)} | ${escapeCell(entry.action)} | ${escapeCell(entry.evidence)} | ${escapeCell(entry.outcome)} | ${escapeCell(entry.notes)} |`;
}

function appendLaunchLog(entries) {
  if (!entries.length) return;

  const filePath = CONFIG.launchLogPath;
  const header = [
    "# Launch Log — 2026-02-28",
    "",
    "| UTC Timestamp | Channel | Action | Evidence | Outcome | Notes |",
    "|---|---|---|---|---|---|",
  ].join("\n");

  let existing = existsSync(filePath) ? readFileSync(filePath, "utf8") : `${header}\n`;

  for (const entry of entries) {
    existing = `${existing.trimEnd()}\n${buildLogRow(entry)}\n`;
  }

  writeFileSync(filePath, existing);
}

function addEntry(entries, { channel, action, evidence, outcome, notes }) {
  entries.push({
    timestamp: nowIso(),
    channel,
    action,
    evidence,
    outcome,
    notes,
  });
}

async function syncReleaseBody({ apply, token, entries, releaseBody }) {
  const releaseRes = await gh(`/repos/${CONFIG.owner}/${CONFIG.repo}/releases/tags/${CONFIG.releaseTag}`, { token });
  if (!releaseRes.ok || !isObject(releaseRes.json)) {
    addEntry(entries, {
      channel: "GitHub Release",
      action: `Fetch ${CONFIG.releaseTag}`,
      evidence: `https://github.com/${CONFIG.owner}/${CONFIG.repo}/releases/tag/${CONFIG.releaseTag}`,
      outcome: "blocked",
      notes: `HTTP ${releaseRes.status}`,
    });
    return false;
  }

  const release = releaseRes.json;
  const currentBody = String(release.body || "").trim();
  const targetBody = releaseBody.trim();

  if (apply && currentBody !== targetBody) {
    const patchRes = await gh(`/repos/${CONFIG.owner}/${CONFIG.repo}/releases/${release.id}`, {
      method: "PATCH",
      token,
      body: { body: targetBody },
    });

    addEntry(entries, {
      channel: "GitHub Release",
      action: `Sync ${CONFIG.releaseTag} body`,
      evidence: release.html_url,
      outcome: patchRes.ok ? "success" : "blocked",
      notes: patchRes.ok ? "Release body updated from local v3 notes." : `HTTP ${patchRes.status}`,
    });

    return patchRes.ok;
  }

  addEntry(entries, {
    channel: "GitHub Release",
    action: `Sync ${CONFIG.releaseTag} body`,
    evidence: release.html_url,
    outcome: "success",
    notes: apply
      ? "Release body already aligned."
      : "Dry-run: release body update would be skipped (already aligned).",
  });

  return true;
}

async function syncDiscussion({ apply, token, entries, number, title, body }) {
  const getRes = await getDiscussionGraphql({ token, number });
  if (!getRes.ok || !getRes.discussion) {
    const detail = getRes.json?.errors?.[0]?.message;
    addEntry(entries, {
      channel: "GitHub Discussions",
      action: `Sync discussion #${number}`,
      evidence: `https://github.com/${CONFIG.owner}/${CONFIG.repo}/discussions/${number}`,
      outcome: "blocked",
      notes: detail ? `GraphQL error: ${detail}` : `HTTP ${getRes.status}`,
    });
    return false;
  }

  const discussion = getRes.discussion;
  const needsUpdate =
    String(discussion.title || "") !== title || String(discussion.body || "").trim() !== body.trim();

  if (apply && needsUpdate) {
    const mutation = `
      mutation($discussionId:ID!, $title:String!, $body:String!) {
        updateDiscussion(input:{discussionId:$discussionId, title:$title, body:$body}) {
          discussion {
            url
          }
        }
      }
    `;
    const patchRes = await ghGraphql({
      token,
      query: mutation,
      variables: { discussionId: discussion.id, title, body },
    });
    const updatedUrl = patchRes.json?.data?.updateDiscussion?.discussion?.url || discussion.url;
    const detail = patchRes.json?.errors?.[0]?.message;

    addEntry(entries, {
      channel: "GitHub Discussions",
      action: `Sync discussion #${number}`,
      evidence: updatedUrl,
      outcome: patchRes.ok ? "success" : "blocked",
      notes: patchRes.ok
        ? "Title/body updated to v3 hook+proof format."
        : detail
        ? `GraphQL error: ${detail}`
        : `HTTP ${patchRes.status}`,
    });

    return patchRes.ok;
  }

  addEntry(entries, {
    channel: "GitHub Discussions",
    action: `Sync discussion #${number}`,
    evidence: discussion.url,
    outcome: "success",
    notes: needsUpdate
      ? "Dry-run: discussion would be updated."
      : apply
      ? "Discussion already aligned."
      : "Dry-run: discussion already aligned.",
  });

  return true;
}

async function upsertDiscussionComment({ apply, token, entries, number, marker, commentBody, label }) {
  const listRes = await getDiscussionGraphql({ token, number });
  const nodes = listRes.discussion?.comments?.nodes;
  if (!listRes.ok || !Array.isArray(nodes)) {
    const detail = listRes.json?.errors?.[0]?.message;
    addEntry(entries, {
      channel: "GitHub Discussions",
      action: `Upsert ${label}`,
      evidence: `https://github.com/${CONFIG.owner}/${CONFIG.repo}/discussions/${number}`,
      outcome: "blocked",
      notes: detail ? `GraphQL error: ${detail}` : `HTTP ${listRes.status}`,
    });
    return false;
  }

  const existing = nodes.find(
    (comment) => comment?.body?.includes(marker) && comment?.author?.login === CONFIG.owner
  );
  const discussion = listRes.discussion;

  if (!apply) {
    addEntry(entries, {
      channel: "GitHub Discussions",
      action: `Upsert ${label}`,
      evidence: existing?.url || discussion?.url || `https://github.com/${CONFIG.owner}/${CONFIG.repo}/discussions/${number}`,
      outcome: "success",
      notes: existing ? "Dry-run: comment would be updated." : "Dry-run: comment would be created.",
    });
    return true;
  }

  if (existing) {
    const mutation = `
      mutation($commentId:ID!, $body:String!) {
        updateDiscussionComment(input:{commentId:$commentId, body:$body}) {
          comment {
            id
            url
          }
        }
      }
    `;
    const patchRes = await ghGraphql({
      token,
      query: mutation,
      variables: { commentId: existing.id, body: commentBody },
    });
    const detail = patchRes.json?.errors?.[0]?.message;
    const updatedUrl = patchRes.json?.data?.updateDiscussionComment?.comment?.url || existing.url;

    addEntry(entries, {
      channel: "GitHub Discussions",
      action: `Upsert ${label}`,
      evidence: updatedUrl,
      outcome: patchRes.ok ? "success" : "blocked",
      notes: patchRes.ok
        ? "Existing maintainer comment updated."
        : detail
        ? `GraphQL error: ${detail}`
        : `HTTP ${patchRes.status}`,
    });

    return patchRes.ok;
  }

  const mutation = `
    mutation($discussionId:ID!, $body:String!) {
      addDiscussionComment(input:{discussionId:$discussionId, body:$body}) {
        comment {
          id
          url
        }
      }
    }
  `;
  const postRes = await ghGraphql({
    token,
    query: mutation,
    variables: { discussionId: discussion.id, body: commentBody },
  });
  const detail = postRes.json?.errors?.[0]?.message;
  const createdUrl = postRes.json?.data?.addDiscussionComment?.comment?.url;

  addEntry(entries, {
    channel: "GitHub Discussions",
    action: `Upsert ${label}`,
    evidence: createdUrl || discussion?.url || `https://github.com/${CONFIG.owner}/${CONFIG.repo}/discussions/${number}`,
    outcome: postRes.ok ? "success" : "blocked",
    notes: postRes.ok ? "Maintainer comment created." : detail ? `GraphQL error: ${detail}` : `HTTP ${postRes.status}`,
  });

  return postRes.ok;
}

async function upsertAwesomePrComment({ apply, token, entries }) {
  const listRes = await gh(
    `/repos/${CONFIG.awesomeOwner}/${CONFIG.awesomeRepo}/issues/${CONFIG.awesomePrNumber}/comments?per_page=100`,
    { token }
  );

  const prUrl = `https://github.com/${CONFIG.awesomeOwner}/${CONFIG.awesomeRepo}/pull/${CONFIG.awesomePrNumber}`;

  if (!listRes.ok || !Array.isArray(listRes.json)) {
    addEntry(entries, {
      channel: "awesome-mcp-servers",
      action: `Upsert PR #${CONFIG.awesomePrNumber} status comment`,
      evidence: prUrl,
      outcome: "blocked",
      notes: `HTTP ${listRes.status}`,
    });
    return false;
  }

  const existing = listRes.json.find(
    (comment) => comment?.body?.includes(COMMENT_AWESOME_MARKER) && comment?.user?.login === CONFIG.owner
  );

  if (!apply) {
    addEntry(entries, {
      channel: "awesome-mcp-servers",
      action: `Upsert PR #${CONFIG.awesomePrNumber} status comment`,
      evidence: existing?.html_url || prUrl,
      outcome: "success",
      notes: existing ? "Dry-run: status comment would be updated." : "Dry-run: status comment would be created.",
    });
    return true;
  }

  if (existing) {
    const patchRes = await gh(
      `/repos/${CONFIG.awesomeOwner}/${CONFIG.awesomeRepo}/issues/comments/${existing.id}`,
      {
        method: "PATCH",
        token,
        body: { body: COMMENT_AWESOME_BODY },
      }
    );

    addEntry(entries, {
      channel: "awesome-mcp-servers",
      action: `Upsert PR #${CONFIG.awesomePrNumber} status comment`,
      evidence: existing.html_url,
      outcome: patchRes.ok ? "success" : "blocked",
      notes: patchRes.ok ? "Existing status comment updated." : `HTTP ${patchRes.status}`,
    });

    return patchRes.ok;
  }

  const postRes = await gh(
    `/repos/${CONFIG.awesomeOwner}/${CONFIG.awesomeRepo}/issues/${CONFIG.awesomePrNumber}/comments`,
    {
      method: "POST",
      token,
      body: { body: COMMENT_AWESOME_BODY },
    }
  );

  addEntry(entries, {
    channel: "awesome-mcp-servers",
    action: `Upsert PR #${CONFIG.awesomePrNumber} status comment`,
    evidence: postRes.json?.html_url || prUrl,
    outcome: postRes.ok ? "success" : "blocked",
    notes: postRes.ok ? "Status comment created." : `HTTP ${postRes.status}`,
  });

  return postRes.ok;
}

function getMcpRegistryVersion(payload) {
  if (!isObject(payload)) return null;
  return payload?.server?.version || payload?.version || null;
}

async function pollMcpRegistry({ apply, entries, timeoutSeconds, pollIntervalSeconds }) {
  const started = Date.now();
  let lastVersion = null;
  let lastStatus = null;

  do {
    const res = await request(CONFIG.mcpRegistryUrl, {
      headers: { Accept: "application/json", "User-Agent": "slack-mcp-impact-push-v3" },
    });

    lastStatus = res.status;
    lastVersion = getMcpRegistryVersion(res.json);

    if (lastVersion === "3.0.0") {
      addEntry(entries, {
        channel: "MCP Registry",
        action: "Parity poll",
        evidence: CONFIG.mcpRegistryUrl,
        outcome: "success",
        notes: "Registry resolves 3.0.0.",
      });
      return true;
    }

    if (!apply) break;
    if (Date.now() - started >= timeoutSeconds * 1000) break;
    await sleep(pollIntervalSeconds * 1000);
  } while (true);

  addEntry(entries, {
    channel: "MCP Registry",
    action: "Parity poll",
    evidence: CONFIG.mcpRegistryUrl,
    outcome: "partial",
    notes: `Latest is ${lastVersion || "unknown"} (HTTP ${lastStatus || "n/a"}); propagation still pending at ${nowIso()}.`,
  });

  return false;
}

async function checkReachability({ entries, channel, action, url, expected = "any" }) {
  const res = await request(url, {
    headers: { Accept: "text/html,application/json;q=0.9,*/*;q=0.8", "User-Agent": "slack-mcp-impact-push-v3" },
  });

  let outcome = "blocked";
  if (res.ok) {
    outcome = "success";
  } else if (res.status === 401 || res.status === 403 || res.status === 429) {
    outcome = "partial";
  }

  addEntry(entries, {
    channel,
    action,
    evidence: url,
    outcome,
    notes: `HTTP ${res.status}${expected !== "any" ? `; expected ${expected}` : ""}`,
  });

  return res;
}

function printEntries(entries) {
  console.log("\nImpact push actions:\n");
  for (const entry of entries) {
    console.log(
      `[${entry.outcome.toUpperCase()}] ${entry.channel} :: ${entry.action}\n  evidence: ${entry.evidence}\n  notes: ${entry.notes}`
    );
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const apply = args.mode === "apply";
  const token = process.env.GITHUB_PAT || "";

  if (apply && !token) {
    console.error("GITHUB_PAT is required for --apply mode.");
    process.exit(1);
  }

  const releaseBody = loadReleaseBody();
  const entries = [];
  const failures = [];

  console.log(`Running impact push (${apply ? "apply" : "dry-run"})...`);

  if (!(await syncReleaseBody({ apply, token, entries, releaseBody }))) failures.push("release");

  if (
    !(await syncDiscussion({
      apply,
      token,
      entries,
      number: CONFIG.discussionAnnouncement,
      title: "Slack MCP Server v3.0.0 is live (secure-default hosted HTTP + local-first unchanged)",
      body: DISCUSSION_ANNOUNCEMENT_BODY,
    }))
  ) {
    failures.push("discussion-12");
  }

  if (
    !(await syncDiscussion({
      apply,
      token,
      entries,
      number: CONFIG.discussionSupport,
      title: "v3.0.0 support + migration Q&A",
      body: DISCUSSION_SUPPORT_BODY,
    }))
  ) {
    failures.push("discussion-13");
  }

  if (
    !(await upsertDiscussionComment({
      apply,
      token,
      entries,
      number: CONFIG.discussionAnnouncement,
      marker: COMMENT_12_MARKER,
      commentBody: COMMENT_12_BODY,
      label: "discussion #12 maintainer comment",
    }))
  ) {
    failures.push("discussion-comment-12");
  }

  if (
    !(await upsertDiscussionComment({
      apply,
      token,
      entries,
      number: CONFIG.discussionSupport,
      marker: COMMENT_13_MARKER,
      commentBody: COMMENT_13_BODY,
      label: "discussion #13 maintainer comment",
    }))
  ) {
    failures.push("discussion-comment-13");
  }

  if (!(await upsertAwesomePrComment({ apply, token, entries }))) failures.push("awesome-pr-comment");

  await pollMcpRegistry({
    apply,
    entries,
    timeoutSeconds: args.timeoutSeconds,
    pollIntervalSeconds: args.pollIntervalSeconds,
  });

  await checkReachability({
    entries,
    channel: "Smithery",
    action: "Reachability check (API)",
    url: CONFIG.smitheryApiUrl,
  });

  await checkReachability({
    entries,
    channel: "Smithery",
    action: "Reachability check (listing)",
    url: CONFIG.smitheryListingUrl,
  });

  await checkReachability({
    entries,
    channel: "Glama",
    action: "Reachability check (server)",
    url: CONFIG.glamaServerUrl,
  });

  await checkReachability({
    entries,
    channel: "Glama",
    action: "Reachability check (api)",
    url: CONFIG.glamaApiUrl,
  });

  if (apply) {
    appendLaunchLog(entries);
    console.log(`\nLaunch log updated: ${CONFIG.launchLogPath}`);
  }

  printEntries(entries);

  if (apply && failures.length > 0) {
    console.error(`\nCompleted with blocked actions: ${failures.join(", ")}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
