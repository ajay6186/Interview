// ============================================================================
// Exercise 5.3 — Iterator Pattern
// ============================================================================
// Make custom data structures iterable using Symbol.iterator. Build lazy
// generators for infinite sequences and iterable combinators.
//
// Instructions: Fill in every TODO so the file runs and all assertions pass.
// Run with: node exercise.js
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Custom iterable
// ---------------------------------------------------------------------------

// TODO: Write range(from, to) returning an iterable object using Symbol.iterator
//       It should work with for...of and the spread operator [...]
//       Yields integers from `from` to `to` inclusive
function range(from, to) {
  return {
    from,
    to,
    [Symbol.iterator]() {
      // TODO: return an iterator object with a next() method
    },
  };
}

// ---------------------------------------------------------------------------
// 2. Infinite generators
// ---------------------------------------------------------------------------

// TODO: Write generator fibonacci() yielding 0, 1, 1, 2, 3, 5, 8, 13, ...
//       It must be infinite (use while(true))
function* fibonacci() {
  // TODO: implement
}

// ---------------------------------------------------------------------------
// 3. Iterable utilities
// ---------------------------------------------------------------------------

// TODO: Write take(iterable, n) — collects first n values into an array
function take(iterable, n) {
  // TODO: use for...of with a break
}

// TODO: Write generator mapIterable(iterable, fn) — lazily applies fn to each value
function* mapIterable(iterable, fn) {
  // TODO: implement
}

// TODO: Write generator filterIterable(iterable, pred) — lazily yields items where pred is true
function* filterIterable(iterable, pred) {
  // TODO: implement
}

// ---------------------------------------------------------------------------
// Runtime assertions
// ---------------------------------------------------------------------------

console.assert(JSON.stringify([...range(1, 5)]) === "[1,2,3,4,5]", "range: spread");

const r = [];
for (const x of range(3, 7)) r.push(x);
console.assert(JSON.stringify(r) === "[3,4,5,6,7]", "range: for...of");

const fibs = take(fibonacci(), 8);
console.assert(JSON.stringify(fibs) === "[0,1,1,2,3,5,8,13]", "fibonacci: first 8");

const doubled = [...take(mapIterable([1, 2, 3, 4, 5], x => x * 2), 5)];
console.assert(JSON.stringify(doubled) === "[2,4,6,8,10]", "mapIterable");

const evens = [...take(filterIterable([1, 2, 3, 4, 5, 6, 7, 8], x => x % 2 === 0), 4)];
console.assert(JSON.stringify(evens) === "[2,4,6,8]", "filterIterable");

console.log("Exercise 5.3 — All assertions passed!");
