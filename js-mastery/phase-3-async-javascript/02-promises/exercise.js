// ============================================================================
// Exercise 3.2 — Promises
// ============================================================================
// Master Promise creation, chaining, error handling, and combinators.
// Run with: node exercise.js
// ============================================================================

"use strict";

// 1. Create a Promise
// TODO: Write `resolveAfter(ms, value)` returning a Promise that resolves with value after ms
function resolveAfter(ms, value) { /* TODO: return new Promise */ }

// 2. Promise chaining
// TODO: Write `double(promise)` returning a promise that doubles the resolved value
function double(promise) { /* TODO: return promise.then(x => x * 2) */ }

// 3. Error handling
// TODO: Write `safeDiv(a, b)` returning a Promise that rejects with Error if b===0
function safeDiv(a, b) { /* TODO */ }

// 4. Promise.all
// TODO: Write `fetchAll(promises)` returning Promise.all of the array
function fetchAll(promises) { /* TODO */ }

// 5. Promise.race
// TODO: Write `timeout(promise, ms)` that races promise against a timeout rejection
function timeout(promise, ms) { /* TODO */ }

// 6. Promise.allSettled
// TODO: Write `settleAll(promises)` returning Promise.allSettled
function settleAll(promises) { /* TODO */ }

// --- Run ---
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
  .then(() => console.log("Exercise 3.2 — All assertions passed!"))
  .catch(e => console.error("FAIL:", e));
