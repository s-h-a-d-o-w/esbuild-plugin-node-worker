[![github actions](https://github.com/s-h-a-d-o-w/esbuild-plugin-node-worker/actions/workflows/ci.yaml/badge.svg)](https://github.com/s-h-a-d-o-w/esbuild-plugin-node-worker/actions/workflows/ci.yaml)
[![npm version](https://img.shields.io/npm/v/esbuild-plugin-node-worker)](https://www.npmjs.com/package/esbuild-plugin-node-worker)

# esbuild-plugin-node-worker

> [!WARNING]  
> Make sure that you've considered simply using multiple entry points (and if using Typescript - replacing the file extension of the relative path you're using in the worker constructor with `esbuild-plugin-replace`) before using this plugin.

This esbuild plugin automatically bundles Node.js workers that are used in the source code that you are building.

They are emitted as separate chunks in a `workers` directory, hashed to prevent name collisions.

## Usage

```typescript
import { nodeWorker } from "esbuild-plugin-node-worker";

esbuild.build({
  // ...
  plugins: [nodeWorker],
});
```

The plugin assumes that the **first string literal** that is found in the first constructor argument **is a relative path to the worker**.

### Example source code

```typescript
// ✅
// ESM
new Worker(new URL("./worker.mjs", import.meta.url));
// CJS
new Worker(path.join(__dirname, "worker.cjs"));
// Additional arguments
new Worker(new URL("./worker.mjs", import.meta.url), {
  workerData: "foo",
});
// Extended workers
new MyWorker(new URL(".worker.mjs", import.meta.url));
// Above the entry point or a sibling
new Worker(new URL("../../whatever/path/worker.mjs", import.meta.url));
```

```typescript
// ❌
// First string literal is not the relative path
new Worker(require("path").join(__dirname, "./worker.js"));
// No string literal
new Worker(new URL(workerPath, import.meta.url));
// Dynamic path
new Worker(path.join(__dirname, `workers/${name}.mjs`));
```