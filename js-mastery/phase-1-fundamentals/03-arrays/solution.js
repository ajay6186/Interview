// ============================================================================
// Solution 1.3 — Arrays
// ============================================================================

"use strict";

const fruits = ["apple", "banana", "cherry"];

function getFirst(arr) { return arr[0]; }
function getLast(arr) { return arr.at(-1); }
function addToEnd(arr, item) { return [...arr, item]; }
function removeFromEnd(arr) { return arr.slice(0, -1); }
function addToFront(arr, item) { return [item, ...arr]; }
function doubleAll(arr) { return arr.map(n => n * 2); }
function onlyEven(arr) { return arr.filter(n => n % 2 === 0); }
function total(arr) { return arr.reduce((acc, n) => acc + n, 0); }
function flattenOne(arr) { return arr.flat(); }
function contains(arr, item) { return arr.includes(item); }
function findFirst(arr, fn) { return arr.find(fn); }
function allPositive(arr) { return arr.every(n => n > 0); }
function anyNegative(arr) { return arr.some(n => n < 0); }

// Assertions
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

console.log("Solution 1.3 — All assertions passed!");
