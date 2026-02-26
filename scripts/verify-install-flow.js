#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PKG = "@jtalk22/slack-mcp";
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const strictPublished = process.argv.includes("--strict-published");
const PUBLISHED_SPEC = `${PKG}@latest`;
const localVersion = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")).version;

function runNpx(args, options = {}) {
  const cmdArgs = ["-y", PUBLISHED_SPEC, ...args];
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

function runLocalSetupStatus(options = {}) {
  const result = spawnSync("node", [join(repoRoot, "scripts/setup-wizard.js"), "--status"], {
    cwd: repoRoot,
    env: options.env,
    encoding: "utf8",
    timeout: 120000,
  });

  return {
    args: "node scripts/setup-wizard.js --status",
    status: result.status,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim(),
    error: result.error,
  };
}

function runLocalDoctor(options = {}) {
  const result = spawnSync("node", [join(repoRoot, "scripts/setup-wizard.js"), "--doctor"], {
    cwd: repoRoot,
    env: options.env,
    encoding: "utf8",
    timeout: 120000,
  });

  return {
    args: "node scripts/setup-wizard.js --doctor",
    status: result.status,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim(),
    error: result.error,
  };
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
    const publishedMatchesLocal = versionResult.stdout.includes(localVersion);
    if (strictPublished) {
      assert(
        publishedMatchesLocal,
        `Expected published npx version to match local ${localVersion}`,
        versionResult.stdout,
      );
    } else if (!publishedMatchesLocal) {
      console.log(
        `warning: npx resolved ${versionResult.stdout || "unknown"} while local version is ${localVersion}; strict published checks are deferred until publish.`
      );
    }

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
    if (strictPublished) {
      assert(
        !statusResult.stderr.includes("Attempting Chrome auto-extraction"),
        "Expected npx --status to be read-only without auto-extraction side effects",
        statusResult.stderr,
      );
    } else if (statusResult.stderr.includes("Attempting Chrome auto-extraction")) {
      console.log("warning: published npx --status still has extraction side effects; re-run with --strict-published after publish.");
    }

    const localStatusResult = runLocalSetupStatus({ env });
    printResult("local-status", localStatusResult);
    assert(
      localStatusResult.status !== 0,
      "Expected local --status to exit non-zero when credentials are missing",
      localStatusResult.stderr || localStatusResult.stdout,
    );
    assert(
      !localStatusResult.stderr.includes("Attempting Chrome auto-extraction"),
      "Expected local --status to be read-only without auto-extraction side effects",
      localStatusResult.stderr,
    );

    const localDoctorMissingResult = runLocalDoctor({ env });
    printResult("local-doctor-missing", localDoctorMissingResult);
    assert(
      localDoctorMissingResult.status === 1,
      "Expected local --doctor to exit 1 when credentials are missing",
      localDoctorMissingResult.stderr || localDoctorMissingResult.stdout,
    );

    const invalidEnv = {
      ...env,
      SLACK_TOKEN: "xoxc-invalid-token",
      SLACK_COOKIE: "xoxd-invalid-cookie",
    };
    const localDoctorInvalidResult = runLocalDoctor({ env: invalidEnv });
    printResult("local-doctor-invalid", localDoctorInvalidResult);
    assert(
      localDoctorInvalidResult.status === 2,
      "Expected local --doctor to exit 2 when credentials are invalid",
      localDoctorInvalidResult.stderr || localDoctorInvalidResult.stdout,
    );

    const runtimeEnv = {
      ...invalidEnv,
      SLACK_MCP_AUTH_TEST_URL: "http://127.0.0.1:9/auth.test"
    };
    const localDoctorRuntimeResult = runLocalDoctor({ env: runtimeEnv });
    printResult("local-doctor-runtime", localDoctorRuntimeResult);
    assert(
      localDoctorRuntimeResult.status === 3,
      "Expected local --doctor to exit 3 when runtime connectivity fails",
      localDoctorRuntimeResult.stderr || localDoctorRuntimeResult.stdout,
    );

    console.log("\nInstall flow verification passed.");
  } finally {
    rmSync(testHome, { recursive: true, force: true });
  }
}

main();
