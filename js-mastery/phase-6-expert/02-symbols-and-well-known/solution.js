// ============================================================================
// Solution 6.2 — Symbols & Well-Known Symbols
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Symbol as a property key
// ---------------------------------------------------------------------------

const USER_ID = Symbol("userId");

// ---------------------------------------------------------------------------
// 2. Symbol.iterator — custom iterable
// ---------------------------------------------------------------------------

// createRange — iterable object via Symbol.iterator
function createRange(from, to) {
  return {
    [Symbol.iterator]() {
      let current = from;
      return {
        next() {
          if (current <= to) return { value: current++, done: false };
          return { value: undefined, done: true };
        },
      };
    },
  };
}

// ---------------------------------------------------------------------------
// 3. Symbol.toPrimitive — custom type coercion
// ---------------------------------------------------------------------------

class Temperature {
  constructor(celsius) {
    this.celsius = celsius;
  }
  [Symbol.toPrimitive](hint) {
    if (hint === "number") return this.celsius;
    if (hint === "string") return `${this.celsius}°C`;
    return this.celsius; // default
  }
}

// ---------------------------------------------------------------------------
// 4. Symbol.toStringTag — custom toString tag
// ---------------------------------------------------------------------------

class Collection {
  constructor(items) {
    this.items = [...items];
  }
  get [Symbol.toStringTag]() {
    return "Collection";
  }
}

// ---------------------------------------------------------------------------
// 5. Symbol.hasInstance — custom instanceof
// ---------------------------------------------------------------------------

class Even {
  static [Symbol.hasInstance](n) {
    return typeof n === "number" && n % 2 === 0;
  }
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

console.log("Solution 6.2 — All assertions passed!");
