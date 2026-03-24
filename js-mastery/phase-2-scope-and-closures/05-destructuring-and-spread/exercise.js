// ============================================================================
// Exercise 2.5 — Destructuring & Spread
// ============================================================================
// Master array/object destructuring, renaming, defaults, nested destructuring,
// and spread/rest in various contexts.
//
// Instructions: Fill in every TODO so the file runs and all assertions pass.
// Run with: node exercise.js
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Array destructuring
// ---------------------------------------------------------------------------

// TODO: Write `head(arr)` returning the first element using destructuring
function head(arr) {
  // TODO: const [first] = arr; return first;
}

// TODO: Write `tail(arr)` returning all elements except the first using rest
function tail(arr) {
  // TODO: const [, ...rest] = arr; return rest;
}

// TODO: Write `swapPair([a, b])` taking a two-element array and returning [b, a]
function swapPair([a, b]) {
  // TODO: implement
}

// ---------------------------------------------------------------------------
// 2. Object destructuring
// ---------------------------------------------------------------------------

// TODO: Write `getName({ name })` extracting just the name property
function getName({ name }) {
  // TODO: return name
}

// TODO: Write `getNameAndAge({ name, age = 0 })` with age defaulting to 0
function getNameAndAge({ name, age = 0 }) {
  // TODO: return { name, age }
}

// TODO: Write `renameProps(obj)` extracting `firstName` as `first`, `lastName` as `last`
function renameProps({ firstName: first, lastName: last }) {
  // TODO: return { first, last }
}

// ---------------------------------------------------------------------------
// 3. Nested destructuring
// ---------------------------------------------------------------------------

// TODO: Write `getCity(user)` extracting user.address.city using nested destructuring
function getCity({ address: { city } }) {
  // TODO: return city
}

// TODO: Write `getFirstScore(data)` extracting data.scores[0]
function getFirstScore({ scores: [first] }) {
  // TODO: return first
}

// ---------------------------------------------------------------------------
// 4. Spread
// ---------------------------------------------------------------------------

// TODO: Write `mergeArrays(a, b)` returning [...a, ...b]
function mergeArrays(a, b) {
  // TODO: implement
}

// TODO: Write `cloneAndAdd(obj, extra)` returning { ...obj, ...extra }
function cloneAndAdd(obj, extra) {
  // TODO: implement
}

// TODO: Write `spreadCall(fn, args)` calling fn with spread of args array
function spreadCall(fn, args) {
  // TODO: use fn(...args) or fn.apply
}

// ---------------------------------------------------------------------------
// Runtime assertions
// ---------------------------------------------------------------------------

console.assert(head([1,2,3]) === 1, "head failed");
console.assert(JSON.stringify(tail([1,2,3,4])) === "[2,3,4]", "tail failed");
console.assert(JSON.stringify(swapPair([1,2])) === "[2,1]", "swapPair failed");

console.assert(getName({ name: "Alice", age: 30 }) === "Alice", "getName failed");

const na = getNameAndAge({ name: "Bob" });
console.assert(na.name === "Bob" && na.age === 0, "getNameAndAge default failed");

const rp = renameProps({ firstName: "John", lastName: "Doe" });
console.assert(rp.first === "John" && rp.last === "Doe", "renameProps failed");

const user = { name: "Alice", address: { city: "NYC", zip: "10001" } };
console.assert(getCity(user) === "NYC", "getCity failed");

const data = { name: "Bob", scores: [95, 87, 73] };
console.assert(getFirstScore(data) === 95, "getFirstScore failed");

console.assert(JSON.stringify(mergeArrays([1,2],[3,4])) === "[1,2,3,4]", "mergeArrays failed");

const cloned = cloneAndAdd({ a: 1, b: 2 }, { b: 99, c: 3 });
console.assert(cloned.a === 1 && cloned.b === 99 && cloned.c === 3, "cloneAndAdd failed");

const sum3 = (a, b, c) => a + b + c;
console.assert(spreadCall(sum3, [1, 2, 3]) === 6, "spreadCall failed");

console.log("Exercise 2.5 — All assertions passed!");
