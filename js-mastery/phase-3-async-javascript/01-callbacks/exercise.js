// ============================================================================
// Exercise 3.1 — Callbacks
// ============================================================================
// Master the callback pattern: sync callbacks, error-first callbacks,
// async simulation, and avoiding callback hell.
//
// Run with: node exercise.js
// ============================================================================

"use strict";

// 1. Sync callbacks
// TODO: Write `myForEach(arr, fn)` calling fn(item, index) for each element
function myForEach(arr, fn) { /* TODO */ }

// TODO: Write `myMap(arr, fn)` returning transformed array
function myMap(arr, fn) { /* TODO */ }

// 2. Error-first callback convention
// TODO: Write `parseJSON(str, callback)` — calls callback(null, parsed) on success,
//       callback(error) on failure
function parseJSON(str, callback) { /* TODO */ }

// 3. Async simulation
// TODO: Write `delay(ms, value, callback)` that calls callback(null, value) after ms
function delay(ms, value, callback) { /* TODO: use setTimeout */ }

// 4. Callback composition
// TODO: Write `waterfall(tasks, done)` where tasks = [fn(next), fn(result,next), ...]
//       Each task passes its result to the next via next(null, result)
function waterfall(tasks, done) { /* TODO */ }

// 5. Promisify
// TODO: Write `promisify(fn)` converting an error-first callback fn to a Promise-returning fn
function promisify(fn) { /* TODO */ }

// --- Assertions ---
const collected = [];
myForEach([1,2,3], (x,i) => collected.push(`${i}:${x}`));
console.assert(collected.join(",") === "0:1,1:2,2:3", "myForEach failed");

const doubled = myMap([1,2,3], x => x*2);
console.assert(JSON.stringify(doubled) === "[2,4,6]", "myMap failed");

parseJSON('{"a":1}', (err, result) => {
  console.assert(!err && result.a === 1, "parseJSON success failed");
});
parseJSON('invalid', (err) => {
  console.assert(err instanceof Error, "parseJSON error failed");
});

delay(0, 42, (err, val) => {
  console.assert(!err && val === 42, "delay failed");
  console.log("Exercise 3.1 — All assertions passed!");
});
