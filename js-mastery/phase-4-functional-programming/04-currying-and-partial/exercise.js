// ============================================================================
// Exercise 4.4 — Currying & Partial Application
// ============================================================================
// Transform multi-argument functions into chains of single-argument functions.
// Understand the difference between currying and partial application.
//
// Instructions: Fill in every TODO so the file runs and all assertions pass.
// Run with: node exercise.js
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Binary curry
// ---------------------------------------------------------------------------

// TODO: Write curry(fn) for a binary (2-argument) function
//       Returns a => b => fn(a, b)
function curry(fn) {
  // TODO: implement
}

// ---------------------------------------------------------------------------
// 2. Auto-curry for any arity
// ---------------------------------------------------------------------------

// TODO: Write curryN(fn) that auto-curries based on fn.length
//       curryN(fn)(1)(2)(3) and curryN(fn)(1, 2)(3) must both work
//       Hint: if args.length >= fn.length, call fn; otherwise return a new
//       curried function that accumulates more args
function curryN(fn) {
  // TODO: implement recursively
}

// ---------------------------------------------------------------------------
// 3. Partial application
// ---------------------------------------------------------------------------

// TODO: Write partial(fn, ...preArgs) — pre-applies the FIRST arguments
//       partial(fn, 1, 2)(3) === fn(1, 2, 3)
function partial(fn, ...preArgs) {
  // TODO: implement
}

// TODO: Write partialRight(fn, ...laterArgs) — pre-applies the LAST arguments
//       partialRight(fn, 2)(10) === fn(10, 2)
function partialRight(fn, ...laterArgs) {
  // TODO: implement
}

// ---------------------------------------------------------------------------
// 4. Point-free style
// ---------------------------------------------------------------------------

// Point-free add using curry (already defined — just make it work)
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

console.log("Exercise 4.4 — All assertions passed!");
