// ============================================================================
// Solution 1.1 — Variables & Types
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Variable declarations
// ---------------------------------------------------------------------------

const userName = "Alice";
let userAge = 30;
const isActive = true;
const nothing = null;

// ---------------------------------------------------------------------------
// 2. Type checking
// ---------------------------------------------------------------------------

function getType(value) {
  return typeof value;
}

function isString(value) {
  return typeof value === "string";
}

function isNullOrUndefined(value) {
  return value === null || value === undefined;
}

// ---------------------------------------------------------------------------
// 3. Type coercion
// ---------------------------------------------------------------------------

function toNumber(str) {
  return Number(str);
}

function toStr(val) {
  return String(val);
}

function toBool(value) {
  return Boolean(value);
}

// ---------------------------------------------------------------------------
// 4. String operations
// ---------------------------------------------------------------------------

function greet(name) {
  return `Hello, ${name}!`;
}

function fullName(first, last) {
  return `${first} ${last}`;
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

console.log("Solution 1.1 — All assertions passed!");
