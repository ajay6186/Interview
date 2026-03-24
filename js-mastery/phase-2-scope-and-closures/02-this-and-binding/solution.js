// ============================================================================
// Solution 2.2 — This & Binding
// ============================================================================

"use strict";

const calculator = {
  value: 0,
  add(n) { this.value += n; return this; },
  multiply(n) { this.value *= n; return this; },
  result() { return this.value; },
};

function callWithContext(fn, ctx, ...args) { return fn.call(ctx, ...args); }
function applyWithContext(fn, ctx, argsArray) { return fn.apply(ctx, argsArray); }
function bindFirst(fn, ctx) { return fn.bind(ctx); }

function makeTimer() {
  const timer = {
    count: 0,
    tick: function() { this.count++; return this; },
  };
  return timer;
}

function toArray() { return Array.prototype.slice.call(arguments); }

// Assertions
calculator.value = 0;
const result = calculator.add(5).multiply(3).add(2).result();
console.assert(result === 17, `calculator chain failed: ${result}`);

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
console.assert(timer.count === 3, "timer failed");

const arr = toArray(1, 2, 3, 4);
console.assert(Array.isArray(arr) && arr.length === 4, "toArray failed");

console.log("Solution 2.2 — All assertions passed!");
