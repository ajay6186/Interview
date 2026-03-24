// ============================================================================
// Solution 6.3 — Performance Patterns
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Memoization
// ---------------------------------------------------------------------------

// memoize — caches results keyed by JSON-serialized arguments
function memoize(fn) {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

// ---------------------------------------------------------------------------
// 2. Debounce & Throttle
// ---------------------------------------------------------------------------

// debounce — delays fn until ms have passed since the last call
function debounce(fn, ms) {
  let timer = null;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, ms);
  };
}

// throttle — leading-edge: executes on first call; blocks further calls for ms
function throttle(fn, ms) {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= ms) {
      lastCall = now;
      return fn.apply(this, args);
    }
    return undefined;
  };
}

// ---------------------------------------------------------------------------
// 3. LRU Cache
// ---------------------------------------------------------------------------

// LRUCache — Map-based O(1) LRU with get and put
function LRUCache(capacity) {
  const cache = new Map();
  return {
    get(key) {
      if (!cache.has(key)) return -1;
      // Move to end (most recently used)
      const value = cache.get(key);
      cache.delete(key);
      cache.set(key, value);
      return value;
    },
    put(key, value) {
      if (cache.has(key)) cache.delete(key);
      else if (cache.size >= capacity) {
        // Evict least recently used (first entry in insertion order)
        cache.delete(cache.keys().next().value);
      }
      cache.set(key, value);
    },
  };
}

// ---------------------------------------------------------------------------
// 4. Lazy evaluation
// ---------------------------------------------------------------------------

// lazy — computes the thunk only once, caches and returns the result
function lazy(fn) {
  let computed = false;
  let value;
  return function() {
    if (!computed) {
      value = fn();
      computed = true;
    }
    return value;
  };
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
cache.put("c", 3);
console.assert(cache.get("b") === -1, "LRU: evicted key returns -1");
console.assert(cache.get("c") === 3, "LRU: newest key accessible");

let computeCalls = 0;
const heavy = lazy(() => { computeCalls++; return 42; });
heavy(); heavy(); heavy();
console.assert(computeCalls === 1, "lazy: computed only once");
console.assert(heavy() === 42, "lazy: returns correct value");

console.log("Solution 6.3 — All assertions passed!");
