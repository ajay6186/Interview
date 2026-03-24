// ============================================================================
// Exercise 2.2 — This & Binding
// ============================================================================
// Understand `this` in different contexts, and explicit binding with
// call(), apply(), bind().
//
// Instructions: Fill in every TODO so the file runs and all assertions pass.
// Run with: node exercise.js
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. `this` in object methods
// ---------------------------------------------------------------------------

// TODO: Create an object `calculator` with:
//       - value: 0
//       - add(n): adds n to value, returns `this` for chaining
//       - multiply(n): multiplies value by n, returns `this`
//       - result(): returns the current value
const calculator = {
  // TODO: implement
};

// ---------------------------------------------------------------------------
// 2. Explicit binding with call and apply
// ---------------------------------------------------------------------------

// TODO: Write `callWithContext(fn, ctx, ...args)` that calls fn with ctx as `this`
function callWithContext(fn, ctx, ...args) {
  // TODO: implement using .call()
}

// TODO: Write `applyWithContext(fn, ctx, argsArray)` using .apply()
function applyWithContext(fn, ctx, argsArray) {
  // TODO: implement
}

// ---------------------------------------------------------------------------
// 3. Bind
// ---------------------------------------------------------------------------

// TODO: Write `bindFirst(fn, ctx)` returning fn bound to ctx
function bindFirst(fn, ctx) {
  // TODO: implement using .bind()
}

// ---------------------------------------------------------------------------
// 4. Arrow functions and `this`
// ---------------------------------------------------------------------------

// TODO: Create `makeTimer()` returning an object with:
//       - count: 0
//       - tick(): increments count by 1 and returns `this`
//       Tick must work when called via setTimeout (use arrow or bind)
function makeTimer() {
  // TODO: implement (make tick an arrow function so `this` is captured)
}

// ---------------------------------------------------------------------------
// 5. Method borrowing
// ---------------------------------------------------------------------------

// TODO: Use Array.prototype.slice.call to convert arguments to an array
//       Write `toArray()` that returns its arguments as an array (using borrow)
function toArray() {
  // TODO: use Array.prototype.slice.call(arguments)
}

// ---------------------------------------------------------------------------
// Runtime assertions
// ---------------------------------------------------------------------------

calculator.value = 0;
const result = calculator.add(5).multiply(3).add(2).result();
console.assert(result === 17, `calculator chain: expected 17 got ${result}`);

const obj = { x: 10 };
function getX() { return this.x; }
console.assert(callWithContext(getX, obj) === 10, "callWithContext failed");

function sum(a, b, c) { return (this.base || 0) + a + b + c; }
const base5 = { base: 5 };
console.assert(applyWithContext(sum, base5, [1, 2, 3]) === 11, "applyWithContext failed");

const bound = bindFirst(getX, obj);
console.assert(bound() === 10, "bindFirst failed");

const timer = makeTimer();
timer.tick().tick().tick();
console.assert(timer.count === 3, "timer.count should be 3");

const arr = toArray(1, 2, 3, 4);
console.assert(Array.isArray(arr) && arr.length === 4, "toArray failed");

console.log("Exercise 2.2 — All assertions passed!");
