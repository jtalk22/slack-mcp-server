import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AUTH_DEATH_SLACK_CODES,
  isAuthDeath,
  authDeathCode,
  buildLifeboatPayload,
  resetLifeboatThrottle,
  lifeboatResponse,
} from "../lib/lifeboat.js";

const AUTH_CODES = ["invalid_auth", "not_authed", "token_expired", "token_revoked", "account_inactive"];

test("every documented auth-death code is classified as AUTH-DEATH", () => {
  for (const code of AUTH_CODES) {
    // As the structured slack_error on a thrown error.
    assert.equal(isAuthDeath({ slack_error: code }), true, `${code} via slack_error`);
    // As a bare `throw new Error(data.error)` where message IS the code.
    assert.equal(isAuthDeath(new Error(code)), true, `${code} via Error message`);
    // As a raw string.
    assert.equal(isAuthDeath(code), true, `${code} via string`);
  }
});

test("the code set matches the documented contract exactly", () => {
  assert.deepEqual([...AUTH_DEATH_SLACK_CODES].sort(), [...AUTH_CODES].sort());
});

test("non-auth errors are NOT flagged as AUTH-DEATH", () => {
  const notAuth = [
    new Error("channel_not_found"),
    new Error("ratelimited"),
    new Error("not_in_channel"),
    new Error("msg_too_long"),
    new Error("Slack API error"),
    { slack_error: "channel_not_found" },
    "channel_not_found",
    "",
    null,
    undefined,
  ];
  for (const err of notAuth) {
    assert.equal(isAuthDeath(err), false, `${JSON.stringify(err)} must not be auth-death`);
  }
});

test("the wrapped token_auth_failed error is classified as AUTH-DEATH", () => {
  const err = new Error("Slack auth failed (invalid_auth) and auto-heal could not refresh tokens");
  err.code = "token_auth_failed";
  err.slack_error = "invalid_auth";
  assert.equal(isAuthDeath(err), true);
});

test("HTTP 401 responses are classified as AUTH-DEATH", () => {
  assert.equal(isAuthDeath({ status: 401 }), true, "status field");
  assert.equal(isAuthDeath({ httpStatus: 401 }), true, "httpStatus field");
  assert.equal(isAuthDeath(new Error("Slack API users.info returned non-JSON (HTTP 401): ...")), true, "message");
  assert.equal(isAuthDeath("401"), true, "bare 401 string");
  assert.equal(isAuthDeath({ status: 500 }), false, "HTTP 500 is not auth-death");
});

test("authDeathCode extracts the specific Slack code (or null)", () => {
  assert.equal(authDeathCode({ slack_error: "token_revoked" }), "token_revoked");
  assert.equal(authDeathCode(new Error("account_inactive")), "account_inactive");
  assert.equal(authDeathCode("not_authed"), "not_authed");
  assert.equal(authDeathCode(new Error("channel_not_found")), null);
  assert.equal(authDeathCode({ status: 401 }), null, "HTTP 401 carries no Slack code");
});

test("first message in the window is long-form; subsequent ones are throttled one-liners", () => {
  resetLifeboatThrottle();
  const t0 = 1_000_000;

  const first = buildLifeboatPayload({ slack_error: "invalid_auth" }, { now: t0 });
  assert.equal(first.throttled, false);
  assert.equal(first.code, "slack_auth_expired");
  assert.ok(first.self_fix, "long-form carries self_fix");
  assert.ok(first.self_fix.includes("npx -y @jtalk22/slack-mcp --setup"), "self_fix names the setup command");

  const second = buildLifeboatPayload({ slack_error: "invalid_auth" }, { now: t0 + 60_000 });
  assert.equal(second.throttled, true, "second call within the hour is throttled");
  assert.equal(second.self_fix, undefined, "throttled form drops the long self_fix block");
  assert.ok(second.message.length < first.message.length + first.self_fix.length, "throttled form is shorter");
  assert.ok(second.message.includes("--setup"), "throttled form still names the fix");

  // After the throttle window elapses, the long form returns.
  const third = buildLifeboatPayload({ slack_error: "invalid_auth" }, { now: t0 + 60 * 60 * 1000 + 1 });
  assert.equal(third.throttled, false, "long form returns after the window elapses");
  assert.ok(third.self_fix, "long form again carries self_fix");
});

test("self-fix is listed FIRST and the hosted option is separate (helpful-first ordering)", () => {
  resetLifeboatThrottle();
  const p = buildLifeboatPayload({ slack_error: "token_expired" }, { now: 5_000_000 });
  assert.ok(p.self_fix, "self_fix present");
  assert.ok(p.hosted_option, "hosted_option present by default");
  // Ordering contract: the self-fix key precedes hosted_option in the payload.
  const keys = Object.keys(p);
  assert.ok(keys.indexOf("self_fix") < keys.indexOf("hosted_option"), "self_fix comes before hosted_option");
  assert.ok(p.hosted_option.includes("utm_campaign=token_death"), "hosted link carries the campaign tag");
  assert.ok(p.hosted_option.toLowerCase().includes("free tier"), "hosted copy stays honest — names the free tier");
});

test("SLACK_MCP_NO_UPSELL=1 drops the hosted option but keeps the self-fix", () => {
  resetLifeboatThrottle();
  const prev = process.env.SLACK_MCP_NO_UPSELL;
  process.env.SLACK_MCP_NO_UPSELL = "1";
  try {
    const long = buildLifeboatPayload({ slack_error: "invalid_auth" }, { now: 7_000_000 });
    assert.equal(long.hosted_option, undefined, "no hosted paragraph when opted out");
    assert.ok(long.self_fix, "self-fix guidance still shown when opted out");
    assert.ok(!long.next_action.toLowerCase().includes("hosted"), "next_action drops the hosted mention");

    resetLifeboatThrottle();
    const short = buildLifeboatPayload({ slack_error: "invalid_auth" }, { now: 7_000_000 });
    // (reset above forces long-form; now trigger the throttled form)
    const throttled = buildLifeboatPayload({ slack_error: "invalid_auth" }, { now: 7_000_100 });
    assert.equal(throttled.throttled, true);
    assert.ok(!throttled.message.includes("mcp.revasserlabs.com"), "throttled form hides hosted URL when opted out");
    assert.ok(short.self_fix, "opted-out long form still carries self_fix");
  } finally {
    if (prev === undefined) delete process.env.SLACK_MCP_NO_UPSELL;
    else process.env.SLACK_MCP_NO_UPSELL = prev;
  }
});

test("lifeboatResponse wraps the payload as an MCP tool error", () => {
  resetLifeboatThrottle();
  const res = lifeboatResponse({ slack_error: "token_revoked" });
  assert.equal(res.isError, true);
  assert.equal(res.content[0].type, "text");
  const parsed = JSON.parse(res.content[0].text);
  assert.equal(parsed.code, "slack_auth_expired");
  assert.equal(parsed.slack_error, "token_revoked");
});

test("the extraction_error diagnostic is preserved when the error carries one", () => {
  resetLifeboatThrottle();
  const err = new Error("Slack auth failed (invalid_auth)");
  err.code = "token_auth_failed";
  err.slack_error = "invalid_auth";
  err.extraction_error = { code: "apple_events_javascript_disabled", message: "blocked" };
  const p = buildLifeboatPayload(err, { now: 9_000_000 });
  assert.deepEqual(p.extraction_error, { code: "apple_events_javascript_disabled", message: "blocked" });
});
