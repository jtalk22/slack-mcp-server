#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PKG = "@jtalk22/slack-mcp";

function runNpx(args, options = {}) {
  const cmdArgs = ["-y", PKG, ...args];
  const result = spawnSync("npx", cmdArgs, {
    cwd: options.cwd,
    env: options.env,
    encoding: "utf8",
    timeout: 120000,
  });

  return {
    args: cmdArgs.join(" "),
    status: result.status,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim(),
    error: result.error,
  };
}

function assert(condition, message, details = "") {
  if (!condition) {
    const suffix = details ? `\n${details}` : "";
    throw new Error(`${message}${suffix}`);
  }
}

function printResult(label, result) {
  console.log(`\n[${label}] npx ${result.args}`);
  console.log(`exit=${result.status}`);
  if (result.stdout) {
    console.log("stdout:");
    console.log(result.stdout);
  }
  if (result.stderr) {
    console.log("stderr:");
    console.log(result.stderr);
  }
}

function main() {
  const testHome = mkdtempSync(join(tmpdir(), "slack-mcp-install-check-"));

  // Force a clean environment so --status reflects missing credentials.
  const env = { ...process.env, HOME: testHome, USERPROFILE: testHome };
  delete env.SLACK_TOKEN;
  delete env.SLACK_COOKIE;

  try {
    const versionResult = runNpx(["--version"], { cwd: testHome, env });
    printResult("version", versionResult);
    assert(
      versionResult.status === 0,
      "Expected --version to exit 0",
      versionResult.stderr || versionResult.stdout,
    );

    const helpResult = runNpx(["--help"], { cwd: testHome, env });
    printResult("help", helpResult);
    assert(
      helpResult.status === 0,
      "Expected --help to exit 0",
      helpResult.stderr || helpResult.stdout,
    );

    const statusResult = runNpx(["--status"], { cwd: testHome, env });
    printResult("status", statusResult);
    assert(
      statusResult.status !== 0,
      "Expected --status to exit non-zero when credentials are missing",
      statusResult.stderr || statusResult.stdout,
    );

    console.log("\nInstall flow verification passed.");
  } finally {
    rmSync(testHome, { recursive: true, force: true });
  }
}

main();
