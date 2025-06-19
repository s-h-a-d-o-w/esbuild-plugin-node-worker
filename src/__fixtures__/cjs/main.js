/* eslint-disable @typescript-eslint/no-require-imports */
const { Worker } = require("worker_threads");

new Worker("./worker.js", {
  workerData: "foo",
});
