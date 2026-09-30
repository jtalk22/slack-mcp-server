import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

// Fixtures only: no live credentials, Slack requests, or browser extraction.
process.env.SLACK_TOKEN = "xoxc-1111-2222-3333-aaaaaaaaaaaaaaaaaaaaaaaa";
process.env.SLACK_COOKIE = "xoxd-fixture-cookie";
process.env.SLACK_MCP_MIN_REQUEST_INTERVAL_MS = "0";
const { resolveUser, clearUserCache } = await import("../lib/slack-client.js");
const originalFetch = globalThis.fetch;

function response(user, realName = `Name ${user}`) {
  return new Response(JSON.stringify({ ok: true, user: { id: user, real_name: realName } }));
}

beforeEach(() => clearUserCache());
afterEach(() => { globalThis.fetch = originalFetch; clearUserCache(); });

test("100 concurrent messages from four authors make only four user lookups", async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://slack.com/api/users.info");
    const user = new URLSearchParams(options.body).get("user");
    calls.push(user);
    return response(user);
  };
  const ids = Array.from({ length: 100 }, (_, i) => `U${i % 4 + 1}`);
  const names = await Promise.all(ids.map((id) => resolveUser(id)));
  assert.deepEqual(names, ids.map((id) => `Name ${id}`));
  assert.deepEqual(calls.sort(), ["U1", "U2", "U3", "U4"]);
  assert.equal(await resolveUser("U1"), "Name U1");
  assert.equal(calls.length, 4, "the completed lookup remains cached");
});

test("a failed shared lookup falls back to the ID and can recover after clearing", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return new Response(JSON.stringify({ ok: false, error: "user_not_found" }));
  };
  assert.deepEqual(await Promise.all(Array.from({ length: 20 }, () => resolveUser("U1"))), Array(20).fill("U1"));
  assert.equal(calls, 1);
  assert.equal(await resolveUser("U1"), "U1");
  assert.equal(calls, 1);
  clearUserCache();
  globalThis.fetch = async () => { calls++; return response("U1", "Recovered name"); };
  assert.equal(await resolveUser("U1"), "Recovered name");
  assert.equal(calls, 2);
});

test("an old in-flight lookup cannot overwrite a fresh lookup after clearing", async () => {
  const pending = [];
  globalThis.fetch = async () => new Promise((resolve) => pending.push(resolve));
  const old = resolveUser("U1");
  clearUserCache();
  const fresh = resolveUser("U1");
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(pending.length, 2);
  pending[1](response("U1", "Fresh name"));
  assert.equal(await fresh, "Fresh name");
  pending[0](response("U1", "Old name"));
  assert.equal(await old, "Old name");
  assert.equal(await resolveUser("U1"), "Fresh name");
  assert.equal(pending.length, 2);
});

test("missing user IDs require no Slack lookup", async () => {
  globalThis.fetch = async () => { throw new Error("unexpected network request"); };
  assert.equal(await resolveUser(null), "unknown");
  assert.equal(await resolveUser(undefined), "unknown");
});
