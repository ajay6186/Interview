// ============================================================================
// Exercise 6.2 — Symbols & Well-Known Symbols
// ============================================================================
// Use Symbols as unique keys and customise built-in JavaScript behaviours
// via well-known symbols: Symbol.iterator, Symbol.toPrimitive,
// Symbol.toStringTag, and Symbol.hasInstance.
//
// Instructions: Fill in every TODO so the file runs and all assertions pass.
// Run with: node exercise.js
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Symbol as a property key
// ---------------------------------------------------------------------------

// TODO: Create a Symbol('userId') and use it as a non-enumerable-like key
const USER_ID = Symbol("userId");

// ---------------------------------------------------------------------------
// 2. Symbol.iterator — custom iterable
// ---------------------------------------------------------------------------

// TODO: Write createRange(from, to) returning an object that is iterable
//       using Symbol.iterator. Yields integers from `from` to `to` inclusive.
function createRange(from, to) {
  // TODO: return { [Symbol.iterator]() { ... } }
}

// ---------------------------------------------------------------------------
// 3. Symbol.toPrimitive — custom type coercion
// ---------------------------------------------------------------------------

// TODO: Implement Symbol.toPrimitive on Temperature so that:
//       +t   → celsius as a number   (hint === "number")
//       `${t}` → "100°C"            (hint === "string")
class Temperature {
  constructor(celsius) {
    this.celsius = celsius;
  }
  // TODO: [Symbol.toPrimitive](hint) { ... }
}

// ---------------------------------------------------------------------------
// 4. Symbol.toStringTag — custom toString tag
// ---------------------------------------------------------------------------

// TODO: Add a Symbol.toStringTag getter to Collection so that
//       Object.prototype.toString.call(new Collection([])) === "[object Collection]"
class Collection {
  constructor(items) {
    this.items = [...items];
  }
  // TODO: get [Symbol.toStringTag]() { ... }
}

// ---------------------------------------------------------------------------
// 5. Symbol.hasInstance — custom instanceof
// ---------------------------------------------------------------------------

// TODO: Add a static Symbol.hasInstance to Even so that:
//       4 instanceof Even === true   (even numbers)
//       3 instanceof Even === false  (odd numbers)
class Even {
  // TODO: static [Symbol.hasInstance](n) { ... }
}

// ---------------------------------------------------------------------------
// Runtime assertions
// ---------------------------------------------------------------------------

const obj = { name: "Alice", [USER_ID]: 42 };
console.assert(!Object.keys(obj).includes(USER_ID.toString()), "Symbol: not in Object.keys");
console.assert(obj[USER_ID] === 42, "Symbol: accessible via symbol key");

console.assert(JSON.stringify([...createRange(1, 5)]) === "[1,2,3,4,5]", "Symbol.iterator");

const t = new Temperature(100);
console.assert(+t === 100, "Symbol.toPrimitive: number hint");
console.assert(`${t}` === "100°C", "Symbol.toPrimitive: string hint");

const c = new Collection([1, 2, 3]);
console.assert(Object.prototype.toString.call(c) === "[object Collection]", "Symbol.toStringTag");

console.assert(4 instanceof Even === true, "Symbol.hasInstance: even");
console.assert(3 instanceof Even === false, "Symbol.hasInstance: odd");

console.log("Exercise 6.2 — All assertions passed!");
