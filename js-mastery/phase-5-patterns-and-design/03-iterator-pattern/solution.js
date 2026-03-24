// ============================================================================
// Solution 5.3 — Iterator Pattern
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Custom iterable
// ---------------------------------------------------------------------------

// range — returns an iterable object using Symbol.iterator
function range(from, to) {
  return {
    from,
    to,
    [Symbol.iterator]() {
      let current = this.from;
      const last = this.to;
      return {
        next() {
          if (current <= last) return { value: current++, done: false };
          return { value: undefined, done: true };
        },
      };
    },
  };
}

// ---------------------------------------------------------------------------
// 2. Infinite generators
// ---------------------------------------------------------------------------

// fibonacci — yields 0, 1, 1, 2, 3, 5, 8, 13, ...
function* fibonacci() {
  let a = 0, b = 1;
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}

// ---------------------------------------------------------------------------
// 3. Iterable utilities
// ---------------------------------------------------------------------------

// take — collects first n values from any iterable into an array
function take(iterable, n) {
  const result = [];
  for (const item of iterable) {
    result.push(item);
    if (result.length >= n) break;
  }
  return result;
}

// mapIterable — lazy generator applying fn to each value
function* mapIterable(iterable, fn) {
  for (const item of iterable) {
    yield fn(item);
  }
}

// filterIterable — lazy generator yielding items where pred is true
function* filterIterable(iterable, pred) {
  for (const item of iterable) {
    if (pred(item)) yield item;
  }
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

console.log("Solution 5.3 — All assertions passed!");
