// ============================================================================
// Solution 3.2 — Promises
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Create a Promise
// ---------------------------------------------------------------------------

function resolveAfter(ms, value) {
  return new Promise(resolve => setTimeout(() => resolve(value), ms));
}

// ---------------------------------------------------------------------------
// 2. Promise chaining
// ---------------------------------------------------------------------------

function double(promise) {
  return promise.then(x => x * 2);
}

// ---------------------------------------------------------------------------
// 3. Error handling
// ---------------------------------------------------------------------------

function safeDiv(a, b) {
  return new Promise((resolve, reject) => {
    if (b === 0) reject(new Error("division by zero"));
    else resolve(a / b);
  });
}

// ---------------------------------------------------------------------------
// 4. Promise.all
// ---------------------------------------------------------------------------

function fetchAll(promises) {
  return Promise.all(promises);
}

// ---------------------------------------------------------------------------
// 5. Promise.race — timeout
// ---------------------------------------------------------------------------

function timeout(promise, ms) {
  const timer = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("timeout after " + ms + "ms")), ms)
  );
  return Promise.race([promise, timer]);
}

// ---------------------------------------------------------------------------
// 6. Promise.allSettled
// ---------------------------------------------------------------------------

function settleAll(promises) {
  return Promise.allSettled(promises);
}

// ---------------------------------------------------------------------------
// Run assertions
// ---------------------------------------------------------------------------

resolveAfter(0, 21)
  .then(v => { console.assert(v === 21, "resolveAfter failed"); return v; })
  .then(v => double(Promise.resolve(v)))
  .then(v => { console.assert(v === 42, "double failed"); })
  .then(() => safeDiv(10, 2))
  .then(v => { console.assert(v === 5, "safeDiv ok failed"); })
  .then(() => safeDiv(10, 0))
  .catch(e => { console.assert(e.message.includes("zero"), "safeDiv reject failed"); })
  .then(() => fetchAll([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)]))
  .then(r => { console.assert(JSON.stringify(r) === "[1,2,3]", "fetchAll failed"); })
  .then(() => timeout(resolveAfter(0, "fast"), 100))
  .then(v => { console.assert(v === "fast", "timeout ok failed"); })
  .then(() => settleAll([Promise.resolve(1), Promise.reject(new Error("x")), Promise.resolve(3)]))
  .then(results => {
    console.assert(results[0].status === "fulfilled", "allSettled[0] failed");
    console.assert(results[1].status === "rejected", "allSettled[1] failed");
    console.assert(results[2].status === "fulfilled", "allSettled[2] failed");
  })
  .then(() => console.log("Exercise 3.2 — All assertions passed!"))
  .catch(e => console.error("FAIL:", e));
