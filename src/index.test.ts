import esbuild from "esbuild";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";

import { nodeWorker } from "./index.js";

const outdir = path.join(import.meta.dirname, "__test-output__");
const fixturesDir = path.join(import.meta.dirname, "__fixtures__");

async function matchSnapshot(relativePath: string) {
  const content = await readFile(path.join(outdir, relativePath), "utf8");
  expect(content).toMatchSnapshot();
}

describe("esbuild-plugin-node-worker", () => {
  beforeEach(async () => {
    if (existsSync(outdir)) {
      await rm(outdir, { recursive: true });
    }
    await mkdir(outdir, { recursive: true });
  });

  it("ESM works", async () => {
    await esbuild.build({
      entryPoints: [path.join(fixturesDir, "esm/main.js")],
      outdir,
      format: "esm",
      plugins: [nodeWorker],
    });

    await matchSnapshot("main.js");
    await matchSnapshot("worker.mjs");
    await matchSnapshot("nested/nested-worker.mjs");
  });

  it("CJS works", async () => {
    await esbuild.build({
      entryPoints: [path.join(fixturesDir, "cjs/main.js")],
      outdir,
      format: "cjs",
      plugins: [nodeWorker],
    });

    await matchSnapshot("main.js");
    await matchSnapshot("worker.cjs");
    await matchSnapshot("nested-worker.cjs");
  });
});
