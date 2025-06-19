[![github actions](https://github.com/s-h-a-d-o-w/esbuild-plugin-node-worker/actions/workflows/ci.yaml/badge.svg)](https://github.com/s-h-a-d-o-w/esbuild-plugin-node-worker/actions/workflows/ci.yaml)
[![npm version](https://img.shields.io/npm/v/esbuild-plugin-node-worker)](https://www.npmjs.com/package/esbuild-plugin-node-worker)

# esbuild-plugin-node-worker

This esbuild plugin automatically bundles Node.js workers that are used in the source code that you are building.

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
new Worker(new URL("./worker.mjs", import.meta.url), /* ... */);
new Worker(path.join(__dirname, "worker.cjs"), /* ... */);
```

```typescript
// ❌
new Worker(require("path").join(__dirname, "./worker.js"), /* ... */);
new Worker(new URL(workerPath, import.meta.url), /* ... */);
new Worker(path.join(__dirname, `workers/${name}.mjs`), /* ... */);
```