// ============================================================================
// Solution 3.4 — Event Loop
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. getOrder — demonstrates sync → microtask → macrotask
// ---------------------------------------------------------------------------

function getOrder() {
  return new Promise(resolve => {
    const order = [];
    // Runs synchronously first
    order.push("sync");
    // Queued as a microtask — runs before any macrotask
    Promise.resolve().then(() => { order.push("microtask"); });
    // Queued as a macrotask — runs after microtasks are drained
    setTimeout(() => { order.push("macrotask"); resolve(order); }, 0);
  });
}

// ---------------------------------------------------------------------------
// 2. runMicrotask — queueMicrotask
// ---------------------------------------------------------------------------

function runMicrotask(fn) {
  queueMicrotask(fn);
}

// ---------------------------------------------------------------------------
// 3. runNextTick — process.nextTick (Node.js; runs before other microtasks)
// ---------------------------------------------------------------------------

function runNextTick(fn) {
  process.nextTick(fn);
}

// ---------------------------------------------------------------------------
// 4. processChunks — yields to event loop between chunks
// ---------------------------------------------------------------------------

async function processChunks(items, processItem, chunkSize = 10) {
  const results = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    for (const item of chunk) {
      results.push(processItem(item));
    }
    // Yield to event loop between chunks so other tasks can run
    if (i + chunkSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Bonus: demonstrate nextTick vs Promise microtask ordering in Node.js
// NOTE: When scheduled inside an async context (microtask), Promise microtasks
// and queueMicrotask run before nextTick. nextTick is only "first" when
// scheduled from synchronous / top-level code.
// ---------------------------------------------------------------------------

function demonstrateOrder() {
  return new Promise(resolve => {
    const log = [];
    process.nextTick(() => log.push("nextTick"));
    Promise.resolve().then(() => log.push("promise microtask"));
    queueMicrotask(() => log.push("queueMicrotask"));
    setTimeout(() => { log.push("setTimeout"); resolve(log); }, 0);
  });
}

// ---------------------------------------------------------------------------
// Run assertions
// ---------------------------------------------------------------------------

(async () => {
  // Test 1: basic ordering
  const order = await getOrder();
  console.assert(order[0] === "sync", "sync first failed");
  console.assert(order[1] === "microtask", "microtask second failed");
  console.assert(order[2] === "macrotask", "macrotask third failed");

  // Test 2: runMicrotask
  let microtaskRan = false;
  runMicrotask(() => { microtaskRan = true; });
  await Promise.resolve(); // drain microtask queue
  console.assert(microtaskRan, "runMicrotask failed");

  // Test 3: runNextTick — use a macrotask boundary so nextTick definitely fires before the continuation
  let nextTickRan = false;
  runNextTick(() => { nextTickRan = true; });
  await new Promise(resolve => setTimeout(resolve, 0));
  console.assert(nextTickRan, "runNextTick failed");

  // Test 4: processChunks
  const items = Array.from({ length: 25 }, (_, i) => i + 1);
  const results = await processChunks(items, x => x * 2, 10);
  console.assert(results.length === 25, "processChunks length failed");
  console.assert(results[0] === 2 && results[24] === 50, "processChunks values failed");

  // Test 5: Node.js ordering — when scheduled inside an async context,
  // Promise microtasks run before nextTick (nextTick is "first" only at top level)
  const nodeOrder = await demonstrateOrder();
  console.assert(nodeOrder[0] === "promise microtask", "promise microtask first in async context");
  console.assert(nodeOrder[nodeOrder.length - 1] === "setTimeout", "setTimeout should be last");
  console.assert(nodeOrder.includes("nextTick"), "nextTick should appear before setTimeout");

  console.log("Exercise 3.4 — All assertions passed!");
})();
