// ============================================================================
// Exercise 3.4 — Event Loop
// ============================================================================
// Understand execution order: sync → microtasks → macrotasks.
// Run with: node exercise.js
// ============================================================================

"use strict";

// 1. Predict execution order
// TODO: Write `getOrder()` returning a Promise that resolves with an array
//       showing the order of: "sync", "microtask", "macrotask"
function getOrder() {
  return new Promise(resolve => {
    const order = [];
    order.push("sync");
    Promise.resolve().then(() => { order.push("microtask"); });
    setTimeout(() => { order.push("macrotask"); resolve(order); }, 0);
  });
}

// 2. queueMicrotask
// TODO: Write `runMicrotask(fn)` that queues fn as a microtask using queueMicrotask
function runMicrotask(fn) {
  // TODO: queueMicrotask(fn)
}

// 3. Process.nextTick (Node.js)
// TODO: Write `runNextTick(fn)` that runs fn via process.nextTick
function runNextTick(fn) {
  // TODO: process.nextTick(fn)
}

// 4. Chunked processing (yield to event loop)
// TODO: Write `processChunks(items, processItem, chunkSize)` that processes items
//       in chunks, yielding between chunks via setTimeout(0)
//       Returns a Promise resolving with all results
async function processChunks(items, processItem, chunkSize = 10) {
  // TODO: implement
}

// --- Run ---
getOrder().then(order => {
  console.assert(order[0] === "sync", "sync first failed");
  console.assert(order[1] === "microtask", "microtask second failed");
  console.assert(order[2] === "macrotask", "macrotask third failed");
  console.log("Exercise 3.4 — All assertions passed!");
});
