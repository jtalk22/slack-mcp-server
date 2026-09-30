import test from "node:test";
import assert from "node:assert/strict";
import worker from "../workers/mcp-worker.js";

const maxBytes = 1024 * 1024;
const requestBody = (body, headers = {}) => new Request("https://worker.test/mcp", {
  method: "POST", body, headers, duplex: "half"
});
const call = request => worker.fetch(request, {});
const initialize = extra => JSON.stringify({
  jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", ...extra }
});

test("normal initialization and small batches still work", async () => {
  const response = await call(requestBody(initialize()));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).result.protocolVersion, "2025-06-18");
  const batch = await call(requestBody(`[${initialize()},${initialize()}]`));
  assert.equal((await batch.json()).length, 2);
});

test("declared oversized body is cancelled without consuming it", async () => {
  let cancelled = false;
  let pulled = false;
  const body = new ReadableStream({
    pull() { pulled = true; },
    cancel() { cancelled = true; }
  }, { highWaterMark: 0 });
  const response = await call(requestBody(body, { "content-length": String(maxBytes + 1) }));
  assert.equal(response.status, 413);
  assert.equal((await response.json()).error.code, -32600);
  assert.equal(cancelled, true);
  assert.equal(pulled, false);
});

test("chunked body without a size header stops at the limit", async () => {
  let reads = 0;
  let cancelled = false;
  const body = new ReadableStream({
    pull(controller) {
      reads++;
      controller.enqueue(new Uint8Array(256 * 1024).fill(32));
    },
    cancel() { cancelled = true; }
  }, { highWaterMark: 0 });
  const response = await call(requestBody(body));
  assert.equal(response.status, 413);
  assert.equal(reads, 5);
  assert.equal(cancelled, true);
});

test("UTF-8 bytes count even when the declared length is small", async () => {
  const body = initialize({ label: "😀".repeat(270000) });
  assert.ok(body.length < maxBytes);
  assert.ok(new TextEncoder().encode(body).byteLength > maxBytes);
  const response = await call(requestBody(body, { "content-length": "1" }));
  assert.equal(response.status, 413);
});

test("exactly 1 MiB is accepted and one extra byte is rejected", async () => {
  const body = initialize();
  const padded = body + " ".repeat(maxBytes - body.length);
  assert.equal((await call(requestBody(padded))).status, 200);
  assert.equal((await call(requestBody(padded + " "))).status, 413);
});

test("UTF-8 split across stream chunks is decoded correctly", async () => {
  const bytes = new TextEncoder().encode(initialize({ label: "😀" }));
  const emojiStart = bytes.indexOf(0xf0);
  const body = new ReadableStream({ start(controller) {
    controller.enqueue(bytes.slice(0, emojiStart + 1));
    controller.enqueue(bytes.slice(emojiStart + 1));
    controller.close();
  } });
  assert.equal((await call(requestBody(body))).status, 200);
});

test("deep nesting is rejected before dispatch, string braces are allowed", async () => {
  const nested = '['.repeat(65) + '0' + ']'.repeat(65);
  const response = await call(requestBody(nested));
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.message, "Request nesting too deep");
  const quoted = initialize({ label: '[{'.repeat(200) + '\\"' });
  assert.equal((await call(requestBody(quoted))).status, 200);
});

test("batch size is bounded independently of body bytes", async () => {
  const valid = `[${Array(100).fill(initialize()).join(",")}]`;
  const invalid = `[${Array(101).fill(initialize()).join(",")}]`;
  assert.equal((await call(requestBody(valid))).status, 200);
  assert.equal((await call(requestBody(invalid))).status, 400);
  assert.equal((await call(requestBody("[]"))).status, 400);
});

test("malformed JSON and invalid request entries have JSON-RPC errors", async () => {
  const malformed = await call(requestBody("{"));
  assert.equal(malformed.status, 400);
  assert.equal((await malformed.json()).error.code, -32700);
  const invalid = await call(requestBody("[null,42]"));
  assert.deepEqual((await invalid.json()).map(entry => entry.error.code), [-32600, -32600]);
});
