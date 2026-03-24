// ============================================================================
// Solution 4.1 — Higher-Order Functions
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Core array HOFs from scratch
// ---------------------------------------------------------------------------

// Implement myMap(arr, fn) — same as Array.prototype.map
function myMap(arr, fn) {
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    result.push(fn(arr[i], i, arr));
  }
  return result;
}

// Implement myFilter(arr, pred) — same as Array.prototype.filter
function myFilter(arr, pred) {
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    if (pred(arr[i], i, arr)) result.push(arr[i]);
  }
  return result;
}

// Implement myReduce(arr, fn, initial) — same as Array.prototype.reduce
function myReduce(arr, fn, initial) {
  let acc = initial;
  for (let i = 0; i < arr.length; i++) {
    acc = fn(acc, arr[i], i, arr);
  }
  return acc;
}

// ---------------------------------------------------------------------------
// 2. HOF combinators
// ---------------------------------------------------------------------------

// flatMap(arr, fn) using map + flat
function flatMap(arr, fn) {
  return arr.map(fn).flat();
}

// groupBy(arr, keyFn) — groups items by the key returned by keyFn
function groupBy(arr, keyFn) {
  return myReduce(arr, (acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

// countBy(arr, keyFn) — like groupBy but counts occurrences
function countBy(arr, keyFn) {
  return myReduce(arr, (acc, item) => {
    const key = keyFn(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

// partition(arr, pred) — returns [truthy, falsy] arrays
function partition(arr, pred) {
  return myReduce(arr, ([pass, fail], item) => {
    if (pred(item)) pass.push(item);
    else fail.push(item);
    return [pass, fail];
  }, [[], []]);
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

console.log("Solution 4.1 — All assertions passed!");
