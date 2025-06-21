import { createHash } from "crypto";
import type { BuildOptions } from "esbuild";
import esbuild from "esbuild";
import { readFile } from "node:fs/promises";
import path from "path";

import { PLUGIN_NAME } from "./constants.js";

const hashes: Record<
  string,
  {
    hash: string;
    outputPath: string;
  }
> = {};

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
): Promise<string> {
  const sourceHash = await hashFile(resolvedWorkerPath);
  if (hashes[resolvedWorkerPath]?.hash === sourceHash) {
    logInfo(
      buildOptions.logLevel,
      `${relativeWorkerPath} has not changed, building skipped`,
    );
    return hashes[resolvedWorkerPath].outputPath;
  }

  logInfo(buildOptions.logLevel, `Building ${relativeWorkerPath}`);

  const result = await esbuild.build({
    ...buildOptions,
    metafile: true,
  });

  // Path is relative to cwd
  const outputPath = path.basename(Object.keys(result.metafile.outputs)[0]!);

  hashes[resolvedWorkerPath] = {
    hash: sourceHash,
    outputPath,
  };

  return outputPath;
}
