// ============================================================================
// Exercise 4.2 — Pure Functions & Immutability
// ============================================================================
// Write functions that never mutate their inputs and always return the same
// output given the same inputs.
//
// Instructions: Fill in every TODO so the file runs and all assertions pass.
// Run with: node exercise.js
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Pure array operations (no mutation)
// ---------------------------------------------------------------------------

// TODO: Write pure addItem(arr, item) — returns new array with item appended
//       Original array must remain unchanged
function addItem(arr, item) {
  // TODO: implement using spread
}

// TODO: Write pure removeItem(arr, index) — returns new array without element at index
function removeItem(arr, index) {
  // TODO: implement using slice
}

// TODO: Write pure updateItem(arr, index, val) — returns new array with element replaced
function updateItem(arr, index, val) {
  // TODO: implement using map
}

// ---------------------------------------------------------------------------
// 2. Pure object operations (no mutation)
// ---------------------------------------------------------------------------

// TODO: Write pure updateUser(user, changes) — returns new user with changes merged
//       Original object must remain unchanged
function updateUser(user, changes) {
  // TODO: implement using spread
}

// TODO: Write pure sortBy(arr, keyFn) — returns new sorted array (no mutation)
//       Compare by the values returned by keyFn(item)
function sortBy(arr, keyFn) {
  // TODO: spread to copy first, then sort
}

// ---------------------------------------------------------------------------
// 3. Purity checking
// ---------------------------------------------------------------------------

// TODO: Write isPure(fn, ...testCases) — returns true if calling fn with the
//       same args always produces the same (JSON-equal) result
//       testCases is an array of argument-arrays, e.g. [[1,2], [3,4]]
function isPure(fn, ...testCases) {
  // TODO: implement — call fn(...args) three times per testCase and compare
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

console.log("Exercise 4.2 — All assertions passed!");
