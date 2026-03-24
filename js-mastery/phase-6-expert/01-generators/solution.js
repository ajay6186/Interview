// ============================================================================
// Solution 6.1 — Generators
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Infinite sequence generators
// ---------------------------------------------------------------------------

// counter — yields start, start+step, start+2*step, ... indefinitely
function* counter(start = 0, step = 1) {
  while (true) {
    yield start;
    start += step;
  }
}

// range — yields from start up to (not including) end
function* range(start, end, step = 1) {
  for (let i = start; i < end; i += step) {
    yield i;
  }
}

// ---------------------------------------------------------------------------
// 2. Consuming generators
// ---------------------------------------------------------------------------

// take — collects first n values from any iterable into an array
function take(gen, n) {
  const result = [];
  for (const val of gen) {
    result.push(val);
    if (result.length === n) break;
  }
  return result;
}

// ---------------------------------------------------------------------------
// 3. Lazy pipeline generators
// ---------------------------------------------------------------------------

// map — lazily yields fn(x) for each x in iterable
function* map(iterable, fn) {
  for (const x of iterable) {
    yield fn(x);
  }
}

// filter — lazily yields x only when pred(x) is true
function* filter(iterable, pred) {
  for (const x of iterable) {
    if (pred(x)) yield x;
  }
}

// zip — yields [a_val, b_val] pairs until the shorter iterable is exhausted
function* zip(a, b) {
  const iterA = a[Symbol.iterator]();
  const iterB = b[Symbol.iterator]();
  while (true) {
    const { value: va, done: da } = iterA.next();
    const { value: vb, done: db } = iterB.next();
    if (da || db) return;
    yield [va, vb];
  }
}

// ---------------------------------------------------------------------------
// 4. Two-way communication
// ---------------------------------------------------------------------------

// accumulator — accepts values via next(value) and yields running total
function* accumulator() {
  let total = 0;
  while (true) {
    const value = yield total;
    if (value !== undefined) total += value;
  }
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
acc.next();        // initialise
acc.next(5);
acc.next(3);
const total = acc.next(2).value;
console.assert(total === 10, "accumulator: 5 + 3 + 2 = 10");

console.log("Solution 6.1 — All assertions passed!");
