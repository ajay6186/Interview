// ============================================================================
// Exercise 1.3 — Arrays
// ============================================================================
// Master array creation, mutation, transformation, search, and iteration.
//
// Instructions: Fill in every TODO so the file runs and all assertions pass.
// Run with: node exercise.js
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Array creation and access
// ---------------------------------------------------------------------------

// TODO: Create a const array `fruits` with: "apple", "banana", "cherry"

// TODO: Write `getFirst(arr)` returning the first element
function getFirst(arr) {
  // TODO: implement
}

// TODO: Write `getLast(arr)` returning the last element (use arr.at(-1) or length-1)
function getLast(arr) {
  // TODO: implement
}

// ---------------------------------------------------------------------------
// 2. Array mutation methods
// ---------------------------------------------------------------------------

// TODO: Write `addToEnd(arr, item)` that pushes item and returns the new array
//       Note: return a COPY — do not mutate the original
function addToEnd(arr, item) {
  // TODO: implement (use spread to avoid mutation)
}

// TODO: Write `removeFromEnd(arr)` returning a new array without the last item
function removeFromEnd(arr) {
  // TODO: implement (use slice, do not mutate)
}

// TODO: Write `addToFront(arr, item)` returning a new array with item prepended
function addToFront(arr, item) {
  // TODO: implement
}

// ---------------------------------------------------------------------------
// 3. Array transformation
// ---------------------------------------------------------------------------

// TODO: Write `doubleAll(arr)` using .map() to double each number
function doubleAll(arr) {
  // TODO: implement
}

// TODO: Write `onlyEven(arr)` using .filter() to keep only even numbers
function onlyEven(arr) {
  // TODO: implement
}

// TODO: Write `total(arr)` using .reduce() to sum all numbers
function total(arr) {
  // TODO: implement
}

// TODO: Write `flattenOne(arr)` flattening one level using .flat()
function flattenOne(arr) {
  // TODO: implement
}

// ---------------------------------------------------------------------------
// 4. Array search and test
// ---------------------------------------------------------------------------

// TODO: Write `contains(arr, item)` using .includes()
function contains(arr, item) {
  // TODO: implement
}

// TODO: Write `findFirst(arr, fn)` using .find() returning first match
function findFirst(arr, fn) {
  // TODO: implement
}

// TODO: Write `allPositive(arr)` returning true if every element > 0
function allPositive(arr) {
  // TODO: implement
}

// TODO: Write `anyNegative(arr)` returning true if any element < 0
function anyNegative(arr) {
  // TODO: implement
}

// ---------------------------------------------------------------------------
// Runtime assertions
// ---------------------------------------------------------------------------

console.assert(Array.isArray(fruits), "fruits should be an array");
console.assert(fruits.length === 3, "fruits should have 3 elements");
console.assert(getFirst([10, 20, 30]) === 10, "getFirst failed");
console.assert(getLast([10, 20, 30]) === 30, "getLast failed");

const arr1 = [1, 2, 3];
const afterAdd = addToEnd(arr1, 4);
console.assert(afterAdd.length === 4 && afterAdd[3] === 4, "addToEnd failed");
console.assert(arr1.length === 3, "addToEnd should not mutate original");

const afterRemove = removeFromEnd([1, 2, 3]);
console.assert(afterRemove.length === 2 && afterRemove[1] === 2, "removeFromEnd failed");

const afterFront = addToFront([2, 3], 1);
console.assert(afterFront[0] === 1 && afterFront.length === 3, "addToFront failed");

console.assert(JSON.stringify(doubleAll([1,2,3])) === "[2,4,6]", "doubleAll failed");
console.assert(JSON.stringify(onlyEven([1,2,3,4,5,6])) === "[2,4,6]", "onlyEven failed");
console.assert(total([1,2,3,4,5]) === 15, "total failed");
console.assert(JSON.stringify(flattenOne([[1,2],[3,4]])) === "[1,2,3,4]", "flattenOne failed");

console.assert(contains([1,2,3], 2) === true, "contains true failed");
console.assert(contains([1,2,3], 5) === false, "contains false failed");
console.assert(findFirst([1,2,3,4], x => x > 2) === 3, "findFirst failed");
console.assert(allPositive([1,2,3]) === true, "allPositive true failed");
console.assert(allPositive([1,-1,3]) === false, "allPositive false failed");
console.assert(anyNegative([1,-1,3]) === true, "anyNegative true failed");
console.assert(anyNegative([1,2,3]) === false, "anyNegative false failed");

console.log("Exercise 1.3 — All assertions passed!");
