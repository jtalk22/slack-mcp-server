import { test } from "node:test";
import assert from "node:assert/strict";
import {
  classifyMessageOrigin,
  isTrustedOrigin,
  withProvenance,
  summarizeProvenance,
  resolveProvenanceMode,
  isProvenanceEnabled,
  MESSAGE_ORIGINS,
  PROVENANCE_MODES,
} from "../lib/message-provenance.js";

const HOME = { homeTeamId: "T_HOME", selfUserId: "U_ME" };

test("own message is self, and self is trusted", () => {
  const origin = classifyMessageOrigin({ user: "U_ME", team: "T_HOME" }, HOME);
  assert.equal(origin, MESSAGE_ORIGINS.SELF);
  assert.equal(isTrustedOrigin(origin), true);
});

test("same-team author is internal and trusted", () => {
  const origin = classifyMessageOrigin({ user: "U_COLLEAGUE", team: "T_HOME" }, HOME);
  assert.equal(origin, MESSAGE_ORIGINS.INTERNAL);
  assert.equal(isTrustedOrigin(origin), true);
});

test("a different team id is external and untrusted (Slack Connect author)", () => {
  const origin = classifyMessageOrigin({ user: "U_OUTSIDE", team: "T_OTHER" }, HOME);
  assert.equal(origin, MESSAGE_ORIGINS.EXTERNAL);
  assert.equal(isTrustedOrigin(origin), false);
});

test("bot outranks workspace membership: an in-workspace app relays outside text", () => {
  for (const msg of [
    { user: "U_BOT", team: "T_HOME", bot_id: "B1" },
    { user: "U_BOT", team: "T_HOME", app_id: "A1" },
    { user: "U_BOT", team: "T_HOME", subtype: "bot_message" },
  ]) {
    const origin = classifyMessageOrigin(msg, HOME);
    assert.equal(origin, MESSAGE_ORIGINS.BOT, JSON.stringify(msg));
    assert.equal(isTrustedOrigin(origin), false);
  }
});

test("fails closed: no team field, no identity, or a junk message is untrusted", () => {
  assert.equal(classifyMessageOrigin({ user: "U_X" }, HOME), MESSAGE_ORIGINS.UNKNOWN);
  assert.equal(classifyMessageOrigin({ user: "U_X", team: "T_HOME" }, {}), MESSAGE_ORIGINS.UNKNOWN);
  assert.equal(classifyMessageOrigin(null, HOME), MESSAGE_ORIGINS.UNKNOWN);
  assert.equal(classifyMessageOrigin("nope", HOME), MESSAGE_ORIGINS.UNKNOWN);
  assert.equal(isTrustedOrigin(MESSAGE_ORIGINS.UNKNOWN), false);
});

test("self wins over bot when the signed-in user is the author", () => {
  // A user posting via an app they own is still the operator's own text.
  const origin = classifyMessageOrigin({ user: "U_ME", team: "T_HOME", bot_id: "B1" }, HOME);
  assert.equal(origin, MESSAGE_ORIGINS.SELF);
});

test("withProvenance mutates in place and returns the same reference", () => {
  const base = { ts: "1", text: "hi" };
  const out = withProvenance(base, { user: "U_ME", team: "T_HOME" }, HOME);
  assert.equal(out, base);
  assert.equal(out.origin, MESSAGE_ORIGINS.SELF);
  assert.equal(out.author_trusted, true);
});

test("mode off leaves the output shape untouched", () => {
  const out = withProvenance({ ts: "1" }, { user: "U_OUTSIDE", team: "T_OTHER" }, {
    ...HOME,
    mode: PROVENANCE_MODES.OFF,
  });
  assert.deepEqual(out, { ts: "1" });
  assert.ok(!("origin" in out));
  assert.ok(!("author_trusted" in out));
});

test("summarizeProvenance stays quiet when everything is trusted", () => {
  const messages = [
    { origin: MESSAGE_ORIGINS.SELF, author_trusted: true },
    { origin: MESSAGE_ORIGINS.INTERNAL, author_trusted: true },
  ];
  assert.equal(summarizeProvenance(messages), null);
});

test("summarizeProvenance counts untrusted messages and nested replies", () => {
  const summary = summarizeProvenance([
    { origin: MESSAGE_ORIGINS.INTERNAL, author_trusted: true, replies: [
      { origin: MESSAGE_ORIGINS.EXTERNAL, author_trusted: false },
    ] },
    { origin: MESSAGE_ORIGINS.BOT, author_trusted: false },
  ]);
  assert.equal(summary.untrusted_message_count, 2);
  assert.equal(summary.origins[MESSAGE_ORIGINS.EXTERNAL], 1);
  assert.equal(summary.origins[MESSAGE_ORIGINS.BOT], 1);
  assert.equal(summary.origins[MESSAGE_ORIGINS.INTERNAL], 1);
  assert.match(summary.notice, /never as instructions/);
});

test("summarizeProvenance tolerates empty, null and junk entries", () => {
  assert.equal(summarizeProvenance([]), null);
  assert.equal(summarizeProvenance(null), null);
  assert.equal(summarizeProvenance([null, "x", 7]), null);
});

test("mode resolution: request argument beats env, env beats default", () => {
  assert.equal(resolveProvenanceMode("strict", {}), PROVENANCE_MODES.STRICT);
  assert.equal(resolveProvenanceMode(" OFF ", {}), PROVENANCE_MODES.OFF);
  assert.equal(resolveProvenanceMode(null, { SLACK_MCP_PROVENANCE: "off" }), PROVENANCE_MODES.OFF);
  assert.equal(resolveProvenanceMode("strict", { SLACK_MCP_PROVENANCE: "off" }), PROVENANCE_MODES.STRICT);
  assert.equal(resolveProvenanceMode(null, {}), PROVENANCE_MODES.LABEL);
});

test("a typo cannot silently disable the labels", () => {
  assert.equal(resolveProvenanceMode("offf", {}), PROVENANCE_MODES.LABEL);
  assert.equal(resolveProvenanceMode(null, { SLACK_MCP_PROVENANCE: "disabled" }), PROVENANCE_MODES.LABEL);
  assert.equal(isProvenanceEnabled(resolveProvenanceMode("disabled", {})), true);
});

test("isProvenanceEnabled is false only for off", () => {
  assert.equal(isProvenanceEnabled(PROVENANCE_MODES.OFF), false);
  assert.equal(isProvenanceEnabled(PROVENANCE_MODES.LABEL), true);
  assert.equal(isProvenanceEnabled(PROVENANCE_MODES.STRICT), true);
});
