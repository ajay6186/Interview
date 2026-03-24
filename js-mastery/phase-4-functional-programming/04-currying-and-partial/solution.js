// ============================================================================
// Solution 4.4 — Currying & Partial Application
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Binary curry
// ---------------------------------------------------------------------------

// curry(fn) for binary fn — returns a => b => fn(a, b)
function curry(fn) {
  return a => b => fn(a, b);
}

// ---------------------------------------------------------------------------
// 2. Auto-curry for any arity
// ---------------------------------------------------------------------------

// curryN(fn) — recursively accumulates args until fn.length is satisfied
function curryN(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return function(...moreArgs) {
      return curried.apply(this, args.concat(moreArgs));
    };
  };
}

// ---------------------------------------------------------------------------
// 3. Partial application
// ---------------------------------------------------------------------------

// partial(fn, ...preArgs) — pre-applies the FIRST arguments
function partial(fn, ...preArgs) {
  return (...restArgs) => fn(...preArgs, ...restArgs);
}

// partialRight(fn, ...laterArgs) — pre-applies the LAST arguments
function partialRight(fn, ...laterArgs) {
  return (...earlyArgs) => fn(...earlyArgs, ...laterArgs);
}

// ---------------------------------------------------------------------------
// 4. Point-free style
// ---------------------------------------------------------------------------

const add = curry((a, b) => a + b);

const double = x => x * 2;
const compose = (f, g) => x => f(g(x));

// ---------------------------------------------------------------------------
// Runtime assertions
// ---------------------------------------------------------------------------

console.assert(add(3)(4) === 7, "curry: add(3)(4)");

const add10 = add(10);
console.assert(add10(5) === 15, "curry partial application: add10(5)");
console.assert(add10(20) === 30, "curry partial application: add10(20)");

const curriedAdd3 = curryN((a, b, c) => a + b + c);
console.assert(curriedAdd3(1)(2)(3) === 6, "curryN: one-at-a-time");
console.assert(curriedAdd3(1, 2)(3) === 6, "curryN: multi-arg first call");

const addTo100 = partial((a, b) => a + b, 100);
console.assert(addTo100(5) === 105, "partial");

const divBy = partialRight((a, b) => a / b, 2);
console.assert(divBy(10) === 5, "partialRight");

console.log("Solution 4.4 — All assertions passed!");
