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

// console.assert(typeof userName === "string", "userName should be a string");
// console.assert(typeof userAge === "number", "userAge should be a number");
// console.assert(typeof isActive === "boolean", "isActive should be a boolean");
// console.assert(nothing === null, "nothing should be null");

// console.assert(getType(42) === "number", "getType(42) should be 'number'");
// console.assert(getType("hi") === "string", "getType('hi') should be 'string'");
// console.assert(isString("test") === true, "isString('test') should be true");
// console.assert(isString(42) === false, "isString(42) should be false");
// console.assert(isNullOrUndefined(null) === true, "isNullOrUndefined(null)");
// console.assert(isNullOrUndefined(undefined) === true, "isNullOrUndefined(undefined)");
// console.assert(isNullOrUndefined(0) === false, "isNullOrUndefined(0)");

// console.assert(toNumber("42") === 42, "toNumber('42') should be 42");
// console.assert(toStr(42) === "42", "toStr(42) should be '42'");
// console.assert(toBool(0) === false, "toBool(0) should be false");
// console.assert(toBool(1) === true, "toBool(1) should be true");

// console.assert(greet("World") === "Hello, World!", "greet failed");
// console.assert(fullName("John", "Doe") === "John Doe", "fullName failed");

// console.log("Exercise 1.1 — All assertions passed!");

"use-strict";

/**String primitive */
function ex01() {
  const name = "Alice";
  console.log("Ex01 --", name, typeof name);
}

// ex01()

/** Number primitive */
function ex02(){
  const age = 30;
  console.log("Ex02 --", age, typeof age)
}

// ex02()
function ex03() {
  const active = true;
  console.log("Ex03 --", active, typeof active);
}

// ex03()

function ex04() {
  const nothing = null;
  console.log("Ex04 --", nothing, typeof nothing); // "object" -- famous JS quirk
}

// ex04()

function ex05(){
  let x;
  console.log("Ex05 --", x, typeof x);
}

// ex05()

function ex06(){
  const big = 9007199254740991n;
  console.log("Ex06 --", big, typeof big);
}

// ex06()

function ex07() {
  const sym =Symbol("id")
  console.log("Ex07 --", sym.toString(), typeof sym);
}

// ex07()

function ex08(){
  const PI = 3.14159;
  let count = 0;
   count += 1;
   console.log("Ex08 — PI: ", PI, "count:", count)
}

// ex08()

function ex09() {
  const result = Number("abc");
  console.log("Ex09 — NaN:", result,  "isNaN:", isNaN(result), "Number.isNaN:", Number.isNaN(result));
}

// ex09()

function ex10(){
  console.log("Ex10 — Infinity:", Infinity, "neg:", -Infinity, "1/0:", 1 / 0);
}

// ex10()

function ex11() {
  console.log("Ex11 --",
    typeof 42,
    typeof "hello",
    typeof true,
    typeof undefined,
    typeof null,
    typeof {},
    typeof []
  )
}

// ex11()

function ex12(){
  console.log("Ex12 — isArray([]): ", Array.isArray([]), "isArray({}):", Array.isArray({}));
}

// ex12()

function ex13() {
  console.log("Ex13 — 0 == false:", 0 == false, "0 === false:", 0 === false);
  console.log("Ex13 — null == undefined:", null == undefined, "null === undefined:", null === undefined);
}

// ex13()

