import esbuild from "esbuild";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { execa } from "execa";
import { beforeEach, describe, expect, it } from "vitest";

import { nodeWorker } from "./index.js";

const outdir = path.join(import.meta.dirname, "__test-output__");
const fixturesDir = path.join(import.meta.dirname, "__fixtures__");

async function matchSnapshot(relativePath: string) {
  const content = await readFile(path.join(outdir, relativePath), "utf8");
  expect(content).toMatchSnapshot();
}

async function runAndCaptureOutput(targetPath: string): Promise<string> {
  const { stdout } = await execa("node", [targetPath]);
  return stdout;
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
    await matchSnapshot("workers/worker-VJ7KZKI3.mjs");
    await matchSnapshot("workers/worker-KR7U4LDZ.mjs");
    await matchSnapshot("workers/workers/nested-worker-DKYGNA4W.mjs");

    const output = await runAndCaptureOutput(path.join(outdir, "main.js"));
    expect(output).toMatchInlineSnapshot(`
      "Sibling worker says hi
      Worker says hi
      Nested worker says hi
      Nested worker says hi"
    `);
  });

  it("CJS works", async () => {
    await esbuild.build({
      entryPoints: [path.join(fixturesDir, "cjs/main.js")],
      outdir,
      format: "cjs",
      outExtension: { ".js": ".cjs" },
      plugins: [nodeWorker],
    });

    await matchSnapshot("main.cjs");
    await matchSnapshot("workers/worker-W3OA5ZW4.cjs");
    await matchSnapshot("workers/workers/nested-worker-KDZIPHJV.cjs");

    const output = await runAndCaptureOutput(path.join(outdir, "main.cjs"));
    expect(output).toMatchInlineSnapshot(`
      "Worker says hi
      Nested worker says hi
      Nested worker says hi"
    `);
  });
});
