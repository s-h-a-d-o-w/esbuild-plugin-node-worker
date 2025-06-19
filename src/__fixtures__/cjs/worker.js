/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */
const path = require("path");
const { Worker } = require("worker_threads");

class NestedWorker extends Worker {
  constructor(path, options) {
    super(path, options);
  }
}

const nestedWorker =     new   NestedWorker(path.join(__dirname, "./nested-worker.js"), {
  workerData: "foo",
});const nestedWorker2 =   new         Worker(path.join(__dirname, "nested-worker.js"), {
  workerData: "foo",
})

console.log("Worker says hi");