// ============================================================================
// Exercise 6.1 — Generators
// ============================================================================
// Master generator functions: infinite sequences, lazy pipelines, and
// two-way communication between the caller and the generator.
//
// Instructions: Fill in every TODO so the file runs and all assertions pass.
// Run with: node exercise.js
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Infinite sequence generators
// ---------------------------------------------------------------------------

// TODO: Write generator counter(start, step) that yields an infinite sequence:
//       start, start+step, start+2*step, ...
function* counter(start = 0, step = 1) {
  // TODO: while(true) { yield start; start += step; }
}

// TODO: Write generator range(start, end, step) that yields from start up to
//       (but NOT including) end, incrementing by step each time
function* range(start, end, step = 1) {
  // TODO: for loop with yield
}

// ---------------------------------------------------------------------------
// 2. Consuming generators
// ---------------------------------------------------------------------------

// TODO: Write take(gen, n) — consumes n values from any iterable/generator
//       Returns them as an array; stops early if the source is exhausted
function take(gen, n) {
  // TODO: for...of with break when result.length === n
}

// ---------------------------------------------------------------------------
// 3. Lazy pipeline generators
// ---------------------------------------------------------------------------

// TODO: Write generator map(iterable, fn) — yields fn(x) for each x
function* map(iterable, fn) {
  // TODO: for...of, yield fn(x)
}

// TODO: Write generator filter(iterable, pred) — yields x only when pred(x) is true
function* filter(iterable, pred) {
  // TODO: for...of, yield if pred(x)
}

// TODO: Write generator zip(a, b) — yields [a_val, b_val] pairs until either ends
function* zip(a, b) {
  // TODO: get iterators manually with [Symbol.iterator](); loop with .next()
}

// ---------------------------------------------------------------------------
// 4. Two-way communication
// ---------------------------------------------------------------------------

// TODO: Write generator accumulator() that accepts values via next(value) and
//       yields the running total after each call.
//       First next() call (to start the generator) sends undefined — handle that.
function* accumulator() {
  // TODO: let total = 0; while(true) { const value = yield total; ... }
}

// ---------------------------------------------------------------------------
// Runtime assertions
// ---------------------------------------------------------------------------

console.assert(JSON.stringify(take(counter(0, 2), 5)) === "[0,2,4,6,8]", "counter");
console.assert(JSON.stringify([...range(1, 6)]) === "[1,2,3,4,5]", "range");
console.assert(JSON.stringify(take(map([1, 2, 3, 4, 5], x => x ** 2), 5)) === "[1,4,9,16,25]", "map");
console.assert(JSON.stringify(take(filter([1, 2, 3, 4, 5, 6], x => x % 2 === 0), 3)) === "[2,4,6]", "filter");
console.assert(
  JSON.stringify([...zip([1, 2, 3], ["a", "b", "c"])]) === '[[1,"a"],[2,"b"],[3,"c"]]',
  "zip"
);

const acc = accumulator();
acc.next();        // initialise — primes the generator
acc.next(5);
acc.next(3);
const total = acc.next(2).value;
console.assert(total === 10, "accumulator: 5 + 3 + 2 = 10");

console.log("Exercise 6.1 — All assertions passed!");
