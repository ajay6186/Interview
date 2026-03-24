// ============================================================================
// Solution 3.1 — Callbacks
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Sync callbacks
// ---------------------------------------------------------------------------

function myForEach(arr, fn) {
  for (let i = 0; i < arr.length; i++) {
    fn(arr[i], i);
  }
}

function myMap(arr, fn) {
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    result.push(fn(arr[i], i));
  }
  return result;
}

// ---------------------------------------------------------------------------
// 2. Error-first callback convention
// ---------------------------------------------------------------------------

function parseJSON(str, callback) {
  try {
    const parsed = JSON.parse(str);
    callback(null, parsed);
  } catch (err) {
    callback(err instanceof Error ? err : new Error(String(err)));
  }
}

// ---------------------------------------------------------------------------
// 3. Async simulation
// ---------------------------------------------------------------------------

function delay(ms, value, callback) {
  setTimeout(() => callback(null, value), ms);
}

// ---------------------------------------------------------------------------
// 4. Callback composition — waterfall
// ---------------------------------------------------------------------------

function waterfall(tasks, done) {
  if (!tasks || tasks.length === 0) return done(null);

  function runTask(index, prevResult) {
    if (index >= tasks.length) return done(null, prevResult);

    const task = tasks[index];

    // Build the "next" callback for this task
    function next(err, result) {
      if (err) return done(err);
      runTask(index + 1, result);
    }

    // First task takes only next; subsequent tasks take (result, next)
    if (index === 0) {
      task(next);
    } else {
      task(prevResult, next);
    }
  }

  runTask(0, undefined);
}

// ---------------------------------------------------------------------------
// 5. Promisify
// ---------------------------------------------------------------------------

function promisify(fn) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      fn(...args, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  };
}

// ---------------------------------------------------------------------------
// Assertions
// ---------------------------------------------------------------------------

const collected = [];
myForEach([1, 2, 3], (x, i) => collected.push(`${i}:${x}`));
console.assert(collected.join(",") === "0:1,1:2,2:3", "myForEach failed");

const doubled = myMap([1, 2, 3], x => x * 2);
console.assert(JSON.stringify(doubled) === "[2,4,6]", "myMap failed");

parseJSON('{"a":1}', (err, result) => {
  console.assert(!err && result.a === 1, "parseJSON success failed");
});
parseJSON('invalid', (err) => {
  console.assert(err instanceof Error, "parseJSON error failed");
});

// Test waterfall
waterfall([
  (next) => delay(0, 1, next),
  (val, next) => next(null, val + 1),
  (val, next) => next(null, val * 10),
], (err, result) => {
  console.assert(!err && result === 20, "waterfall failed");
});

// Test promisify
const delayP = promisify(delay);
delayP(0, 99)
  .then(val => console.assert(val === 99, "promisify failed"));

delay(0, 42, (err, val) => {
  console.assert(!err && val === 42, "delay failed");
  console.log("Exercise 3.1 — All assertions passed!");
});
