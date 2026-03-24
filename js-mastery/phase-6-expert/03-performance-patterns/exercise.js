// ============================================================================
// Exercise 6.3 — Performance Patterns
// ============================================================================
// Implement caching and throttling patterns used in real-world applications:
// memoize, debounce, throttle, LRU cache, and lazy evaluation.
//
// Instructions: Fill in every TODO so the file runs and all assertions pass.
// Run with: node exercise.js
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Memoization
// ---------------------------------------------------------------------------

// TODO: Write memoize(fn) — caches results keyed by serialized arguments
//       Use JSON.stringify(args) as the cache key (Map-based cache)
//       The memoized function must work for any number of arguments
function memoize(fn) {
  // TODO: const cache = new Map(); return function(...args) { ... }
}

// ---------------------------------------------------------------------------
// 2. Debounce & Throttle
// ---------------------------------------------------------------------------

// TODO: Write debounce(fn, ms) — delays fn until ms have passed since the
//       last call. Uses setTimeout internally.
function debounce(fn, ms) {
  // TODO: let timer = null; return function(...args) { clearTimeout; setTimeout }
}

// TODO: Write throttle(fn, ms) — leading-edge throttle:
//       The first call executes immediately; subsequent calls within ms are blocked.
//       Returns undefined for blocked calls.
function throttle(fn, ms) {
  // TODO: let lastCall = 0; compare Date.now() - lastCall >= ms
}

// ---------------------------------------------------------------------------
// 3. LRU Cache
// ---------------------------------------------------------------------------

// TODO: Write LRUCache(capacity) using a Map (insertion order = LRU order)
//       - get(key) → value, or -1 if absent. Move accessed key to end (MRU).
//       - put(key, value) → adds/updates entry. If at capacity, evict the LRU
//         (first entry in the Map).
function LRUCache(capacity) {
  // TODO: const cache = new Map(); return { get(key) {...}, put(key, value) {...} }
}

// ---------------------------------------------------------------------------
// 4. Lazy evaluation
// ---------------------------------------------------------------------------

// TODO: Write lazy(fn) — returns a thunk that calls fn() only on the first
//       invocation, caches the result, and returns it on every subsequent call
function lazy(fn) {
  // TODO: let computed = false; let value; return function() { ... }
}

// ---------------------------------------------------------------------------
// Runtime assertions
// ---------------------------------------------------------------------------

let calls = 0;
const expensiveFn = n => { calls++; return n * n; };
const memoFn = memoize(expensiveFn);
console.assert(memoFn(5) === 25, "memoize: correct result");
console.assert(memoFn(5) === 25, "memoize: returns cached result");
console.assert(calls === 1, "memoize: fn called only once for same args");

const db = debounce(x => x, 100);
console.assert(typeof db === "function", "debounce: returns a function");

const th = throttle(x => x, 100);
console.assert(th("first") === "first", "throttle: first call passes through");
console.assert(th("second") === undefined, "throttle: second call blocked");

const cache = LRUCache(2);
cache.put("a", 1);
cache.put("b", 2);
console.assert(cache.get("a") === 1, "LRU: get existing key");
cache.put("c", 3); // "b" is now LRU since "a" was accessed most recently
console.assert(cache.get("b") === -1, "LRU: evicted key returns -1");
console.assert(cache.get("c") === 3, "LRU: newest key accessible");

let computeCalls = 0;
const heavy = lazy(() => { computeCalls++; return 42; });
heavy(); heavy(); heavy();
console.assert(computeCalls === 1, "lazy: computed only once");
console.assert(heavy() === 42, "lazy: returns correct value");

console.log("Exercise 6.3 — All assertions passed!");
