// ============================================================================
// Exercise 1.1 — Variables & Types
// ============================================================================
// Learn JavaScript's primitive types, variable declarations, and type coercion.
//
// Instructions: Fill in every TODO so the file runs and all assertions pass.
// Run with: node exercise.js
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Variable declarations
// ---------------------------------------------------------------------------

// TODO: Declare a const string variable `userName` with value "Alice"

// TODO: Declare a let number variable `userAge` with value 30

// TODO: Declare a const boolean variable `isActive` with value true

// TODO: Declare a const variable `nothing` with value null

// ---------------------------------------------------------------------------
// 2. Type checking
// ---------------------------------------------------------------------------

// TODO: Write a function `getType(value)` that returns typeof value
function getType(value) {
  // TODO: implement
}

// TODO: Write a function `isString(value)` that returns true if value is a string
function isString(value) {
  // TODO: implement
}

// TODO: Write a function `isNullOrUndefined(value)` that returns true for null or undefined
function isNullOrUndefined(value) {
  // TODO: implement
}

// ---------------------------------------------------------------------------
// 3. Type coercion
// ---------------------------------------------------------------------------

// TODO: Write `toNumber(str)` converting a string to a number using Number()
function toNumber(str) {
  // TODO: implement
}

// TODO: Write `toStr(val)` converting any value to a string using String()
function toStr(val) {
  // TODO: implement
}

// TODO: Write `toBool(value)` converting value to boolean using Boolean()
function toBool(value) {
  // TODO: implement
}

// ---------------------------------------------------------------------------
// 4. String operations
// ---------------------------------------------------------------------------

// TODO: Write `greet(name)` returning "Hello, {name}!" using a template literal
function greet(name) {
  // TODO: implement
}

// TODO: Write `fullName(first, last)` returning "{first} {last}"
function fullName(first, last) {
  // TODO: implement
}

// ---------------------------------------------------------------------------
// Runtime assertions
// ---------------------------------------------------------------------------

console.assert(typeof userName === "string", "userName should be a string");
console.assert(typeof userAge === "number", "userAge should be a number");
console.assert(typeof isActive === "boolean", "isActive should be a boolean");
console.assert(nothing === null, "nothing should be null");

console.assert(getType(42) === "number", "getType(42) should be 'number'");
console.assert(getType("hi") === "string", "getType('hi') should be 'string'");
console.assert(isString("test") === true, "isString('test') should be true");
console.assert(isString(42) === false, "isString(42) should be false");
console.assert(isNullOrUndefined(null) === true, "isNullOrUndefined(null)");
console.assert(isNullOrUndefined(undefined) === true, "isNullOrUndefined(undefined)");
console.assert(isNullOrUndefined(0) === false, "isNullOrUndefined(0)");

console.assert(toNumber("42") === 42, "toNumber('42') should be 42");
console.assert(toStr(42) === "42", "toStr(42) should be '42'");
console.assert(toBool(0) === false, "toBool(0) should be false");
console.assert(toBool(1) === true, "toBool(1) should be true");

console.assert(greet("World") === "Hello, World!", "greet failed");
console.assert(fullName("John", "Doe") === "John Doe", "fullName failed");

console.log("Exercise 1.1 — All assertions passed!");
