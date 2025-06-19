import { createHash } from "crypto";
import type { BuildOptions } from "esbuild";
import esbuild from "esbuild";
import { readFile } from "node:fs/promises";

import { PLUGIN_NAME } from "./constants.js";

const hashes: Record<string, string> = {};

async function hashFile(path: string) {
  return createHash("sha1")
    .update(await readFile(path))
    .digest("hex");
}

function logInfo(logLevel: string | undefined, message: string) {
  if (logLevel === "info" || logLevel === "debug" || logLevel === "verbose") {
    console.log(`[${PLUGIN_NAME}] ${message}`);
  }
}

export async function buildWorker(
  buildOptions: BuildOptions,
  resolvedWorkerPath: string,
  relativeWorkerPath: string,
) {
  const sourceHash = await hashFile(resolvedWorkerPath);
  if (hashes[resolvedWorkerPath] === sourceHash) {
    logInfo(
      buildOptions.logLevel,
      `${relativeWorkerPath} has not changed, building skipped`,
    );
    return;
  }

  logInfo(buildOptions.logLevel, `Building ${relativeWorkerPath}`);
  await esbuild.build(buildOptions);

  hashes[resolvedWorkerPath] = sourceHash;
}
