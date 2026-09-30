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
  const calls = [];
  const api = async (method) => {
    calls.push(method);
    return { channel: {} };
  };

  await assert.rejects(
    handleSendMessage({ channel_id: "U123ABC", text: "Hello" }, api),
    /did not return a DM channel/
  );
  assert.deepEqual(calls, ["conversations.open"], "must never post without a resolved DM");
});

for (const channelId of ["C123ABC", "G123ABC"]) {
  test(`send message posts directly to ${channelId} without opening a DM`, async () => {
    const calls = [];
    const api = async (method, params) => {
      calls.push({ method, params });
      return { channel: params.channel, ts: "1700000000.000003", message: { text: params.text } };
    };
    const result = await handleSendMessage({ channel_id: channelId, text: "Hello" }, api);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].method, "chat.postMessage");
    assert.equal(calls[0].params.channel, channelId);
    assert.equal(JSON.parse(result.content[0].text).status, "sent");
  });
}

test("send message resolves a legacy workspace user ID", async () => {
  const calls = [];
  const api = async (method, params) => {
    calls.push({ method, params });
    return method === "conversations.open"
      ? { channel: { id: "D456DEF" } }
      : { channel: params.channel, ts: "1700000000.000004" };
  };
  await handleSendMessage({ channel_id: "W123ABC", text: "Hello" }, api);
  assert.deepEqual(calls.map(({ method }) => method), ["conversations.open", "chat.postMessage"]);
  assert.equal(calls[0].params.users, "W123ABC");
  assert.equal(calls[1].params.channel, "D456DEF");
});

test("send message does not post after Slack refuses to open a DM", async () => {
  const calls = [];
  const error = new Error("cannot_dm_user");
  const api = async (method) => {
    calls.push(method);
    throw error;
  };
  await assert.rejects(handleSendMessage({ channel_id: "U123ABC", text: "Hello" }, api), error);
  assert.deepEqual(calls, ["conversations.open"]);
});

test("send message propagates a posting failure after resolving the DM", async () => {
  const calls = [];
  const error = new Error("restricted_action");
  const api = async (method) => {
    calls.push(method);
    if (method === "conversations.open") return { channel: { id: "D456DEF" } };
    throw error;
  };
  await assert.rejects(handleSendMessage({ channel_id: "U123ABC", text: "Hello" }, api), error);
  assert.deepEqual(calls, ["conversations.open", "chat.postMessage"]);
});
