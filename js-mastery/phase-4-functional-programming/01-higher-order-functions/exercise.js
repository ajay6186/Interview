// ============================================================================
// Exercise 4.1 — Higher-Order Functions
// ============================================================================
// Build the core array HOFs from scratch and explore advanced applications
// like groupBy, countBy, and partition using only reduce.
//
// Instructions: Fill in every TODO so the file runs and all assertions pass.
// Run with: node exercise.js
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Core array HOFs from scratch
// ---------------------------------------------------------------------------

// TODO: Implement myMap(arr, fn) — same as Array.prototype.map
//       Calls fn(item, index, arr) for each element, returns new array
function myMap(arr, fn) {
  // TODO: implement
}

// TODO: Implement myFilter(arr, pred) — same as Array.prototype.filter
//       Returns new array of items where pred(item, index, arr) is truthy
function myFilter(arr, pred) {
  // TODO: implement
}

// TODO: Implement myReduce(arr, fn, initial) — same as Array.prototype.reduce
//       fn(accumulator, currentValue, index, arr)
function myReduce(arr, fn, initial) {
  // TODO: implement
}

// ---------------------------------------------------------------------------
// 2. HOF combinators
// ---------------------------------------------------------------------------

// TODO: Write flatMap(arr, fn) using map + flat
//       Same as arr.flatMap(fn)
function flatMap(arr, fn) {
  // TODO: implement
}

// TODO: Write groupBy(arr, keyFn) — groups items by the key returned by keyFn
//       Returns an object: { key: [items with that key], ... }
//       Use myReduce
function groupBy(arr, keyFn) {
  // TODO: implement
}

// TODO: Write countBy(arr, keyFn) — like groupBy but counts occurrences
//       Returns an object: { key: count, ... }
function countBy(arr, keyFn) {
  // TODO: implement
}

// TODO: Write partition(arr, pred) — splits into two arrays
//       Returns [itemsWherePredIsTrue, itemsWherePredIsFalse]
function partition(arr, pred) {
  // TODO: implement
}

// ---------------------------------------------------------------------------
// Runtime assertions
// ---------------------------------------------------------------------------

console.assert(JSON.stringify(myMap([1, 2, 3], x => x * 2)) === "[2,4,6]", "myMap");
console.assert(JSON.stringify(myFilter([1, 2, 3, 4], x => x % 2 === 0)) === "[2,4]", "myFilter");
console.assert(myReduce([1, 2, 3, 4, 5], (a, b) => a + b, 0) === 15, "myReduce");
console.assert(JSON.stringify(flatMap([1, 2, 3], x => [x, x * 2])) === "[1,2,2,4,3,6]", "flatMap");

const g = groupBy([{ t: "a" }, { t: "b" }, { t: "a" }], x => x.t);
console.assert(g.a.length === 2 && g.b.length === 1, "groupBy");

console.assert(JSON.stringify(partition([1, 2, 3, 4, 5, 6], x => x % 2 === 0)) === "[[2,4,6],[1,3,5]]", "partition");

console.log("Exercise 4.1 — All assertions passed!");
