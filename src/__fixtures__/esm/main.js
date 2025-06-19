import { Worker } from "node:worker_threads";

new Worker(new URL("./worker.js", import.meta.url), {
  workerData: "foo",
});

// Comments should not be processed
// new Worker(new URL("./ignored-worker.js", import.meta.url));
