import test from "node:test";
import assert from "node:assert/strict";
import { timingSafeEqual } from "node:crypto";

// Node's WebCrypto lacks the Workers-only crypto.subtle.timingSafeEqual;
// supply it from node:crypto (same contract: equal-length buffers, throws otherwise).
if (typeof crypto.subtle.timingSafeEqual !== "function") {
  crypto.subtle.timingSafeEqual = (a, b) => timingSafeEqual(a, b);
}

const { keyMatches, checkKey } = await import("../workers/browser-ops/auth.js");
const { default: worker } = await import("../workers/browser-ops/index.js");

// A browser binding that fails the test if the handler ever reaches it.
const browserNeverCalled = {
  fetch() { throw new Error("browser binding was reached"); },
};
const request = (headers = {}, query = "") =>
  new Request(`https://browser-ops.test/${query}`, { headers });

test("keyMatches: equal, different, shorter, longer, empty", () => {
  assert.equal(keyMatches("s3cret-key", "s3cret-key"), true);
  assert.equal(keyMatches("s3cret-kez", "s3cret-key"), false);
  assert.equal(keyMatches("s3cret", "s3cret-key"), false);
  assert.equal(keyMatches("s3cret-key-and-more", "s3cret-key"), false);
  assert.equal(keyMatches("", "s3cret-key"), false);
  assert.equal(keyMatches(null, "s3cret-key"), false);
});

test("unset key refuses every request, even one carrying a header", async () => {
  for (const env of [{}, { BROWSER_OPS_KEY: "" }, undefined]) {
    const res = await worker.fetch(
      request({ "x-browser-key": "anything" }, "?url=http://169.254.169.254/"),
      { ...env, BROWSER: browserNeverCalled },
    );
    assert.equal(res.status, 503);
    assert.equal((await res.json()).code, "not_configured");
  }
});

test("set key: missing or wrong header is 401 and never reaches the browser", async () => {
  const env = { BROWSER_OPS_KEY: "s3cret-key", BROWSER: browserNeverCalled };
  const missing = await worker.fetch(request({}, "?url=https://example.com"), env);
  assert.equal(missing.status, 401);
  const wrong = await worker.fetch(request({ "x-browser-key": "s3cret-kez" }, "?url=https://example.com"), env);
  assert.equal(wrong.status, 401);
  assert.equal((await wrong.json()).code, "unauthorized");
});

test("set key: the right header passes the check (400 for no url, before any browser launch)", async () => {
  const env = { BROWSER_OPS_KEY: "s3cret-key", BROWSER: browserNeverCalled };
  const res = await worker.fetch(request({ "x-browser-key": "s3cret-key" }), env);
  assert.equal(res.status, 400);
  assert.equal((await res.json()).code, "bad_request");
  assert.equal(checkKey(request({ "x-browser-key": "s3cret-key" }), env), null);
});
