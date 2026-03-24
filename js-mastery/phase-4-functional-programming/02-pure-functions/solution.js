// ============================================================================
// Solution 4.2 — Pure Functions & Immutability
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Pure array operations (no mutation)
// ---------------------------------------------------------------------------

// Pure addItem — returns new array with item appended
function addItem(arr, item) {
  return [...arr, item];
}

// Pure removeItem — returns new array without element at index
function removeItem(arr, index) {
  return [...arr.slice(0, index), ...arr.slice(index + 1)];
}

// Pure updateItem — returns new array with element replaced at index
function updateItem(arr, index, val) {
  return arr.map((item, i) => i === index ? val : item);
}

// ---------------------------------------------------------------------------
// 2. Pure object operations (no mutation)
// ---------------------------------------------------------------------------

// Pure updateUser — returns new user with changes merged via spread
function updateUser(user, changes) {
  return { ...user, ...changes };
}

// Pure sortBy — copies array first to avoid mutating original
function sortBy(arr, keyFn) {
  return [...arr].sort((a, b) => {
    const ka = keyFn(a);
    const kb = keyFn(b);
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
}

// ---------------------------------------------------------------------------
// 3. Purity checking
// ---------------------------------------------------------------------------

// isPure: calls fn with same args three times; returns true if results match
function isPure(fn, ...testCases) {
  return testCases.every(args => {
    const r1 = JSON.stringify(fn(...args));
    const r2 = JSON.stringify(fn(...args));
    const r3 = JSON.stringify(fn(...args));
    return r1 === r2 && r2 === r3;
  });
}

// ---------------------------------------------------------------------------
// Runtime assertions
// ---------------------------------------------------------------------------

const arr = [1, 2, 3];
const added = addItem(arr, 4);
console.assert(arr.length === 3, "addItem must not mutate original");
console.assert(JSON.stringify(added) === "[1,2,3,4]", "addItem result");

const removed = removeItem([1, 2, 3, 4], 1);
console.assert(JSON.stringify(removed) === "[1,3,4]", "removeItem");

const updated = updateItem([1, 2, 3], 1, 99);
console.assert(JSON.stringify(updated) === "[1,99,3]", "updateItem");

const user = { name: "Alice", age: 30 };
const newUser = updateUser(user, { age: 31 });
console.assert(user.age === 30, "updateUser must not mutate original");
console.assert(newUser.age === 31, "updateUser result");

const sorted = sortBy([{ n: 3 }, { n: 1 }, { n: 2 }], x => x.n);
console.assert(sorted[0].n === 1 && sorted[2].n === 3, "sortBy");

console.log("Solution 4.2 — All assertions passed!");
