import { test } from "node:test";
import assert from "node:assert/strict";
import { handleSendMessage } from "../lib/handlers.js";

test("send message posts directly to an existing conversation ID", async () => {
  const calls = [];
  const api = async (method, params) => {
    calls.push({ method, params });
    return { channel: params.channel, ts: "1700000000.000001", message: { text: params.text } };
  };

  await handleSendMessage({ channel_id: "D123ABC", text: "Hello" }, api);

  assert.deepEqual(calls, [{
    method: "chat.postMessage",
    params: { channel: "D123ABC", text: "Hello", thread_ts: undefined }
  }]);
});

test("send message resolves a user ID to a DM before posting", async () => {
  const calls = [];
  const api = async (method, params) => {
    calls.push({ method, params });
    if (method === "conversations.open") return { channel: { id: "D456DEF" } };
    return { channel: params.channel, ts: "1700000000.000002", message: { text: params.text } };
  };

  const result = await handleSendMessage({
    channel_id: "U123ABC",
    text: "Hello",
    thread_ts: "1699999999.000001"
  }, api);

  assert.deepEqual(calls, [
    { method: "conversations.open", params: { users: "U123ABC" } },
    {
      method: "chat.postMessage",
      params: {
        channel: "D456DEF",
        text: "Hello",
        thread_ts: "1699999999.000001"
      }
    }
  ]);
  assert.equal(JSON.parse(result.content[0].text).channel, "D456DEF");
});

test("send message fails clearly when Slack does not return a DM channel", async () => {
  const api = async () => ({ channel: {} });

  await assert.rejects(
    handleSendMessage({ channel_id: "U123ABC", text: "Hello" }, api),
    /did not return a DM channel/
  );
});
