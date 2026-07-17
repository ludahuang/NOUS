import "./load-env.mjs";

import { getNextQueuedAiRunId, processAiRun } from "../lib/ai";
import { getWorkerPollIntervalMs } from "../lib/env";
import { getNextQueuedExportRunId, processExportRun } from "../lib/export";
import { getNextQueuedImportRunId, processImportRun } from "../lib/import";

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function runOnce() {
  const importRunId = await getNextQueuedImportRunId();

  if (importRunId) {
    console.log(`[worker] processing import run ${importRunId}`);

    try {
      const summary = await processImportRun(importRunId);
      if (summary) {
        console.log(
          `[worker] import ${summary.id} ${summary.status}: +${summary.addedCount} updated=${summary.updatedCount} skipped=${summary.skippedCount}`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[worker] import ${importRunId} failed: ${message}`);
    }

    return true;
  }

  const exportRunId = await getNextQueuedExportRunId();

  if (exportRunId) {
    console.log(`[worker] processing export run ${exportRunId}`);

    try {
      const summary = await processExportRun(exportRunId);
      if (summary) {
        console.log(
          `[worker] export ${summary.id} ${summary.status}: notes=${summary.noteCount} files=${summary.fileCount}`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[worker] export ${exportRunId} failed: ${message}`);
    }

    return true;
  }

  const aiRunId = await getNextQueuedAiRunId();

  if (aiRunId) {
    console.log(`[worker] processing ai run ${aiRunId}`);

    try {
      const summary = await processAiRun(aiRunId);
      if (summary) {
        console.log(
          `[worker] ai ${summary.id} ${summary.status}: review=${summary.reviewStatus} provider=${summary.provider || "pending"}`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[worker] ai ${aiRunId} failed: ${message}`);
    }

    return true;
  }

  return false;
}

async function main() {
  const pollIntervalMs = getWorkerPollIntervalMs();
  console.log(`[worker] The Vault worker started. Poll interval ${pollIntervalMs}ms`);

  while (true) {
    const didWork = await runOnce();
    if (!didWork) {
      await sleep(pollIntervalMs);
    }
  }
}

main().catch((error) => {
  console.error("[worker] fatal error", error);
  process.exit(1);
});
