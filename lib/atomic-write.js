/**
 * Atomic file replacement for every local store: the token file, the
 * metadata sidecar, the DM cache and the workflow profiles.
 *
 * Write a temp file next to the target, then rename it over the target, so a
 * reader sees either the old file or the new one and never a partial write.
 *
 * On Windows an antivirus scanner, the search indexer or a concurrent reader
 * can hold the target or the temp file open for a few milliseconds, and the
 * rename then fails with EPERM, EACCES or EBUSY although nothing is wrong.
 * Those three codes are retried with a short exponential backoff; any other
 * error, and the last failed attempt, is rethrown unchanged.
 */

import { writeFileSync, renameSync, unlinkSync, chmodSync } from "fs";
import { platform } from "os";

const TRANSIENT_RENAME_CODES = new Set(["EPERM", "EACCES", "EBUSY"]);
const RENAME_RETRIES = 5;
const RENAME_BACKOFF_MS = 10; // 10, 20, 40, 80, 160: at most 310 ms in all

export function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

export function renameSyncWithRetry(fromPath, toPath) {
  for (let attempt = 0; ; attempt++) {
    try {
      renameSync(fromPath, toPath);
      return;
    } catch (e) {
      if (attempt >= RENAME_RETRIES || !TRANSIENT_RENAME_CODES.has(e?.code)) throw e;
      sleepSync(RENAME_BACKOFF_MS * 2 ** attempt);
    }
  }
}

export function atomicWriteSync(filePath, content) {
  const tempPath = `${filePath}.${process.pid}.tmp`;
  try {
    writeFileSync(tempPath, content);
    if (platform() === "darwin" || platform() === "linux") {
      try { chmodSync(tempPath, 0o600); } catch {}
    }
    renameSyncWithRetry(tempPath, filePath); // Atomic on POSIX systems
  } catch (e) {
    // Clean up temp file on error
    try { unlinkSync(tempPath); } catch {}
    throw e;
  }
}
