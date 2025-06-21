import { type BuildOptions, type Plugin } from "esbuild";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { buildWorker } from "./buildWorker.js";
import { PLUGIN_NAME } from "./constants.js";
import { findWorkers } from "./findWorkers.js";

function createErrorObject(message: string, error: unknown) {
  return {
    errors: [
      {
        pluginName: PLUGIN_NAME,
        text: `${message}:
-------------------------------------------------------
${error instanceof Error ? error.stack : String(error)}
-------------------------------------------------------`,
      },
    ],
  };
}

async function getIsEsm(format: BuildOptions["format"]) {
  if (format) {
    return format === "esm";
  }

  const packageJson = JSON.parse(
    await readFile(path.resolve(process.cwd(), "package.json"), "utf8"),
  ) as {
    type?: string;
  };
  return packageJson.type === "module";
}

export const nodeWorker: Plugin = {
  name: PLUGIN_NAME,

  async setup(build) {
    const { outfile, outdir, format } = build.initialOptions;
    const isTargetingEsm = await getIsEsm(format);
    const outputDirectory = path.join(
      outdir || (outfile ? path.dirname(outfile) : "dist"),
      "workers",
    );
    const initialWithoutOutputOptions = {
      ...build.initialOptions,
      outdir: undefined,
      outfile: undefined,
    } satisfies BuildOptions;

    build.onLoad({ filter: /(ts|js)$/ }, async (args) => {
      try {
        const source = await readFile(args.path, "utf8");
        if (!source.includes("Worker")) {
          return null;
        }

        const workerInfos = findWorkers(args.path, source);
        if (workerInfos.length === 0) {
          return null;
        }

        // Process sequentially in reverse so that replacing source code fragments is straightforward. (Otherwise, pretty complex file position juggling would be necessary.)
        let transformedSource = source;
        for (const {
          workerName,
          relativeWorkerPath,
          sourceTail,
          start,
          end,
        } of workerInfos.reverse()) {
          const resolvedWorkerPath = path.resolve(
            path.dirname(args.path),
            relativeWorkerPath,
          );

          const outputExtension = isTargetingEsm ? ".mjs" : ".cjs";
          const outputPath = await buildWorker(
            {
              ...initialWithoutOutputOptions,
              entryPoints: [resolvedWorkerPath],
              outdir: outputDirectory,
              entryNames: "[name]-[hash]",
              outExtension: { ".js": outputExtension },
            } satisfies BuildOptions,
            resolvedWorkerPath,
            relativeWorkerPath,
          );
          transformedSource =
            transformedSource.slice(0, start) +
            (isTargetingEsm
              ? ` new ${workerName}(new URL("workers/${outputPath}", import.meta.url)${sourceTail}`
              : ` new ${workerName}(require("path").join(__dirname, "workers/${outputPath}")${sourceTail}`) +
            transformedSource.slice(end);
        }

        if (transformedSource !== source) {
          return {
            contents: transformedSource,
            loader: "ts",
          };
        }

        return null;
      } catch (error) {
        return createErrorObject(`Failed to process ${args.path}`, error);
      }
    });
  },
};
