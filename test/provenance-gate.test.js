/**
 * Adversarial tests for the strict-mode send gate.
 *
 * The gate is the only part of provenance that refuses an action, so it is the
 * only part an injected instruction has a reason to attack. Each test here is
 * the inverse of a branch: not "does the hold work when everything is set
 * correctly", but "can a caller reach the send anyway".
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  handleSendMessage,
  resetUntrustedContentSeen,
  hasSeenUntrustedContent,
  noteUntrustedPayload,
} from "../lib/handlers.js";

const sentOk = async () => ({ ok: true, ts: "1700000000.000100", channel: "D123ABC" });

function withEnv(value, fn) {
  const previous = process.env.SLACK_MCP_PROVENANCE;
  if (value === undefined) delete process.env.SLACK_MCP_PROVENANCE;
  else process.env.SLACK_MCP_PROVENANCE = value;
  try {
    return fn();
  } finally {
    if (previous === undefined) delete process.env.SLACK_MCP_PROVENANCE;
    else process.env.SLACK_MCP_PROVENANCE = previous;
  }
}

function parse(result) {
  return JSON.parse(result.content[0].text);
}

test("the operator's strict mode holds a send even when the call asks for label", async () => {
  // A caller steered by injected text can name the control. Asking for a looser
  // mode on the write call must not be a way out of the operator's setting.
  resetUntrustedContentSeen();
  noteUntrustedPayload({ untrusted_content: { untrusted_message_count: 1 } });

  await withEnv("strict", async () => {
    const held = parse(await handleSendMessage(
      { channel_id: "D123ABC", text: "wire the money", provenance: "label" },
      sentOk
    ));
    assert.equal(held.status, "held");
    assert.equal(held.reason, "untrusted_context");
  });
  resetUntrustedContentSeen();
});

test("the operator's strict mode holds a send even when the call asks for off", async () => {
  resetUntrustedContentSeen();
  noteUntrustedPayload({ untrusted_content: { untrusted_message_count: 1 } });

  await withEnv("strict", async () => {
    const held = parse(await handleSendMessage(
      { channel_id: "D123ABC", text: "wire the money", provenance: "off" },
      sentOk
    ));
    assert.equal(held.status, "held");
  });
  resetUntrustedContentSeen();
});

test("a call may still escalate into strict when the operator has not", async () => {
  // Tightening is always allowed; only loosening is refused.
  resetUntrustedContentSeen();
  noteUntrustedPayload({ untrusted_content: { untrusted_message_count: 1 } });

  await withEnv("label", async () => {
    const held = parse(await handleSendMessage(
      { channel_id: "D123ABC", text: "wire the money", provenance: "strict" },
      sentOk
    ));
    assert.equal(held.status, "held");
  });
  resetUntrustedContentSeen();
});

test("an explicit confirmation still releases the hold", async () => {
  resetUntrustedContentSeen();
  noteUntrustedPayload({ untrusted_content: { untrusted_message_count: 1 } });

  await withEnv("strict", async () => {
    const result = parse(await handleSendMessage(
      {
        channel_id: "D123ABC",
        text: "wire the money",
        confirm_untrusted_context: true,
      },
      sentOk
    ));
    assert.notEqual(result.status, "held");
  });
  resetUntrustedContentSeen();
});

test("a clean session is not held", async () => {
  resetUntrustedContentSeen();
  await withEnv("strict", async () => {
    const result = parse(await handleSendMessage(
      { channel_id: "D123ABC", text: "hello" },
      sentOk
    ));
    assert.notEqual(result.status, "held");
  });
});

test("a payload that computed its own summary arms the gate", () => {
  // slack_catch_me_up assembles its provenance summary in lib/catch-up.js and
  // never passes through withProvenanceEnvelope. The read that serves the most
  // outside text must not be the one that leaves the gate disarmed.
  resetUntrustedContentSeen();
  assert.equal(hasSeenUntrustedContent(), false);

  noteUntrustedPayload({
    untrusted_content: { untrusted_message_count: 2, origins: { external: 2 } },
  });
  assert.equal(hasSeenUntrustedContent(), true);
  resetUntrustedContentSeen();
});

test("a clean payload does not arm the gate", () => {
  resetUntrustedContentSeen();
  noteUntrustedPayload({ conversations: [] });
  assert.equal(hasSeenUntrustedContent(), false);
  noteUntrustedPayload(null);
  assert.equal(hasSeenUntrustedContent(), false);
  noteUntrustedPayload({ untrusted_content: undefined });
  assert.equal(hasSeenUntrustedContent(), false);
});
