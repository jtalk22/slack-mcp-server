import { test, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir, platform } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// End-to-end coverage of the storage backends: each test boots the real MCP
// server (src/server.js) over stdio in a sandboxed HOME and drives it with
// raw JSON-RPC, asserting on what an MCP client would actually observe.

const SERVER = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "server.js");
const E2E_TIMEOUT_MS = 15000;

const sandboxHomes = [];

after(() => {
  for (const home of sandboxHomes) {
    try { rmSync(home, { recursive: true, force: true }); } catch {}
  }
});

function sandboxHome() {
  const home = mkdtempSync(join(tmpdir(), "slack-mcp-e2e-"));
  sandboxHomes.push(home);
  return home;
}

function spawnServer(home, extraEnv = {}) {
  return spawn(process.execPath, [SERVER], {
    env: {
      ...process.env,
      HOME: home,
      USERPROFILE: home,
      SLACK_TOKEN: "",
      SLACK_COOKIE: "",
      // The child must not inherit a storage mode or profile from the
      // environment running the tests; each test opts in via extraEnv.
      SLACK_MCP_TOKEN_STORAGE: "",
      SLACK_MCP_PROFILE: "",
      ...extraEnv,
    },
    stdio: ["pipe", "pipe", "pipe"],
  });
}

/**
 * Boot the server, run the MCP handshake, call one tool, and return the
 * parsed tool payload. MCP stdio framing is newline-delimited JSON-RPC.
 */
function callTool(home, extraEnv, toolName) {
  return new Promise((resolve, reject) => {
    const proc = spawnServer(home, extraEnv);
    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      proc.kill();
      fn(value);
    };

    const timer = setTimeout(
      () => finish(reject, new Error(`E2E timeout after ${E2E_TIMEOUT_MS}ms. stderr:\n${stderr}`)),
      E2E_TIMEOUT_MS
    );

    proc.stderr.on("data", (d) => { stderr += d; });
    proc.on("error", (e) => finish(reject, e));
    proc.on("exit", (code) => {
      if (!settled) finish(reject, new Error(`Server exited early (code ${code}). stderr:\n${stderr}`));
    });

    const send = (msg) => proc.stdin.write(JSON.stringify(msg) + "\n");

    proc.stdout.on("data", (chunk) => {
      stdout += chunk;
      let newlineIndex;
      while ((newlineIndex = stdout.indexOf("\n")) >= 0) {
        const line = stdout.slice(0, newlineIndex).trim();
        stdout = stdout.slice(newlineIndex + 1);
        if (!line) continue;
        let msg;
        try { msg = JSON.parse(line); } catch { continue; }

        if (msg.id === 1) {
          send({ jsonrpc: "2.0", method: "notifications/initialized" });
          send({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: toolName, arguments: {} } });
        } else if (msg.id === 2) {
          if (msg.error) return finish(reject, new Error(`tools/call error: ${JSON.stringify(msg.error)}`));
          try {
            finish(resolve, JSON.parse(msg.result.content[0].text));
          } catch (e) {
            finish(reject, e);
          }
        }
      }
    });

    send({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "e2e-storage-modes", version: "0.0.0" },
      },
    });
  });
}

/** Boot the server and expect it to die at startup; resolve with {code, stderr}. */
function expectStartupFailure(home, extraEnv) {
  return new Promise((resolve, reject) => {
    const proc = spawnServer(home, extraEnv);
    let stderr = "";
    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error(`Server did not exit within ${E2E_TIMEOUT_MS}ms. stderr:\n${stderr}`));
    }, E2E_TIMEOUT_MS);
    proc.stderr.on("data", (d) => { stderr += d; });
    proc.on("exit", (code) => {
      clearTimeout(timer);
      resolve({ code, stderr });
    });
  });
}

test("e2e: keychain-only server reports its backend through slack_token_status", async () => {
  const payload = await callTool(sandboxHome(), { SLACK_MCP_TOKEN_STORAGE: "keychain-only" }, "slack_token_status");
  assert.equal(payload.status, "missing");
  assert.equal(payload.storage.mode, "keychain-only");
  assert.equal(payload.storage.mode_source, "env");
  assert.equal(payload.storage.plaintext_file_present, false);
});

test("e2e: a persisted setup choice reaches the server with no env var set", async () => {
  const home = sandboxHome();
  writeFileSync(join(home, ".slack-mcp-meta.json"), JSON.stringify({ storage_mode: "keychain-only" }));

  const payload = await callTool(home, {}, "slack_token_status");
  assert.equal(payload.storage.mode, "keychain-only");
  assert.equal(payload.storage.mode_source, "persisted");
});

test("e2e: file mode serves tokens from the file and reports the backend", async () => {
  const home = sandboxHome();
  writeFileSync(join(home, ".slack-mcp-tokens.json"), JSON.stringify({
    SLACK_TOKEN: "xoxc-1111-2222-3333-aaaaaaaaaaaaaaaaaaaaaaaa",
    SLACK_COOKIE: "xoxd-e2e-cookie",
    updated_at: new Date().toISOString(),
  }));

  const payload = await callTool(home, { SLACK_MCP_TOKEN_STORAGE: "file" }, "slack_token_status");
  assert.equal(payload.status, "healthy");
  assert.equal(payload.token.source, "file");
  assert.equal(payload.storage.mode, "file");
  assert.equal(payload.storage.plaintext_file_present, true);
});

test("e2e: a typo'd storage mode kills the server at startup with a clear error", async () => {
  const { code, stderr } = await expectStartupFailure(sandboxHome(), { SLACK_MCP_TOKEN_STORAGE: "keychian-only" });
  assert.equal(code, 1);
  assert.match(stderr, /Unrecognized SLACK_MCP_TOKEN_STORAGE value "keychian-only"/);
});

test(
  "e2e: keychain-only with a legacy file fails clearly where no Keychain exists, leaving the file intact",
  { skip: platform() === "darwin" },
  async () => {
    const home = sandboxHome();
    const tokenPath = join(home, ".slack-mcp-tokens.json");
    writeFileSync(tokenPath, JSON.stringify({
      SLACK_TOKEN: "xoxc-1111-2222-3333-aaaaaaaaaaaaaaaaaaaaaaaa",
      SLACK_COOKIE: "xoxd-e2e-cookie",
      updated_at: new Date().toISOString(),
    }));

    const { code, stderr } = await expectStartupFailure(home, { SLACK_MCP_TOKEN_STORAGE: "keychain-only" });
    assert.equal(code, 1);
    assert.match(stderr, /could not migrate/);
    assert.equal(existsSync(tokenPath), true, "a failed migration must not delete the plaintext file");
  }
);

test("e2e: a profile serves tokens from its own namespace and reports it", async () => {
  const home = sandboxHome();
  writeFileSync(join(home, ".slack-mcp-tokens-work.json"), JSON.stringify({
    SLACK_TOKEN: "xoxc-1111-2222-3333-aaaaaaaaaaaaaaaaaaaaaaaa",
    SLACK_COOKIE: "xoxd-e2e-work-cookie",
    updated_at: new Date().toISOString(),
  }));

  const payload = await callTool(home, { SLACK_MCP_TOKEN_STORAGE: "file", SLACK_MCP_PROFILE: "work" }, "slack_token_status");
  assert.equal(payload.status, "healthy");
  assert.equal(payload.token.source, "file");
  assert.equal(payload.storage.profile, "work");
});

test("e2e: an invalid profile kills the server at startup with a clear error", async () => {
  const { code, stderr } = await expectStartupFailure(sandboxHome(), { SLACK_MCP_PROFILE: "Bad Name!" });
  assert.equal(code, 1);
  assert.match(stderr, /Invalid SLACK_MCP_PROFILE/);
});
