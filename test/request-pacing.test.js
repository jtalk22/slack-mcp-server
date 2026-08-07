import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequestPacer, REQUEST_PACING } from "../lib/slack-client.js";

test("caps concurrent in-flight tasks at maxConcurrency", async () => {
  const pacer = createRequestPacer({ minIntervalMs: 0, maxConcurrency: 2 });
  let active = 0;
  let peak = 0;
  const run = () =>
    pacer(async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 25));
      active -= 1;
    });
  await Promise.all(Array.from({ length: 8 }, run));
  assert.ok(peak <= 2, `peak concurrency ${peak} must be <= 2`);
  assert.equal(active, 0, "all slots released");
});

test("spaces request starts by at least minIntervalMs even under concurrency", async () => {
  const interval = 40;
  const pacer = createRequestPacer({ minIntervalMs: interval, maxConcurrency: Infinity });
  const starts = [];
  await Promise.all(
    Array.from({ length: 5 }, () => pacer(async () => { starts.push(Date.now()); }))
  );
  starts.sort((a, b) => a - b);
  for (let i = 1; i < starts.length; i++) {
    const gap = starts[i] - starts[i - 1];
    // Small tolerance for timer/Date.now coarseness; starts are reserved
    // monotonically so the true gap is >= interval.
    assert.ok(gap >= interval - 8, `gap ${gap}ms (index ${i}) must be ~>= ${interval}ms`);
  }
});

test("an event-loop stall does not bunch the queued starts", async () => {
  // Reserving nominal wake times lets several sleeps expire together after a
  // stall and fire at once — the exact burst pacing exists to prevent, and
  // synchronous PBKDF2 during Chrome token extraction can stall this long.
  // Spacing must be measured against ACTUAL previous starts.
  const interval = 50;
  const pacer = createRequestPacer({ minIntervalMs: interval, maxConcurrency: Infinity });
  const starts = [];
  const runs = Array.from({ length: 4 }, () => pacer(async () => { starts.push(Date.now()); }));

  // Let every task claim its place and begin waiting BEFORE the stall — that
  // ordering is what reproduces the bug. Stalling first would simply delay all
  // four equally and prove nothing.
  await new Promise((resolve) => setImmediate(resolve));

  // Now stall past several pending wake times, so their timers all come due at
  // once. Nominal-time reservation fires them together here; actual-time gating
  // re-spaces them.
  const blockUntil = Date.now() + interval * 3.5;
  while (Date.now() < blockUntil) { /* deliberate synchronous stall */ }

  await Promise.all(runs);
  starts.sort((a, b) => a - b);
  for (let i = 1; i < starts.length; i++) {
    const gap = starts[i] - starts[i - 1];
    assert.ok(gap >= interval - 8, `start ${i} came ${gap}ms after the previous (need ~>=${interval}ms)`);
  }
});

test("interval of 0 disables spacing (near-instant)", async () => {
  const pacer = createRequestPacer({ minIntervalMs: 0, maxConcurrency: Infinity });
  const t0 = Date.now();
  await Promise.all(Array.from({ length: 20 }, () => pacer(async () => {})));
  assert.ok(Date.now() - t0 < 100, "no interval → no meaningful delay");
});

test("a rejecting task releases its slot (no deadlock)", async () => {
  const pacer = createRequestPacer({ minIntervalMs: 0, maxConcurrency: 1 });
  await assert.rejects(pacer(async () => { throw new Error("boom"); }), /boom/);
  // If the slot leaked, this second call would hang forever.
  const result = await pacer(async () => "ok");
  assert.equal(result, "ok");
});

test("default pacing is conservative and on by default", (t) => {
  // REQUEST_PACING reads the environment at module load, and disabling pacing
  // is a supported configuration — so only assert the defaults when neither
  // override is set.
  const overridden = ["SLACK_MCP_MIN_REQUEST_INTERVAL_MS", "SLACK_MCP_MAX_CONCURRENCY"]
    .some((name) => process.env[name] !== undefined && process.env[name] !== "");
  if (overridden) {
    t.skip("pacing overridden in this environment");
    return;
  }
  assert.ok(REQUEST_PACING.minIntervalMs > 0, "spacing is on by default");
  assert.ok(REQUEST_PACING.maxConcurrency >= 1, "concurrency cap is set");
});
