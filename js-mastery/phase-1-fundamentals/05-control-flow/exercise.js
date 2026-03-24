// ============================================================================
// Exercise 1.5 — Control Flow
// ============================================================================
// Master if/else, switch, ternary, loops (for, while, for...of, for...in),
// break/continue, and short-circuit evaluation.
//
// Instructions: Fill in every TODO so the file runs and all assertions pass.
// Run with: node exercise.js
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Conditionals
// ---------------------------------------------------------------------------

// TODO: Write `classify(n)` returning "positive", "negative", or "zero"
function classify(n) {
  // TODO: implement
}

// TODO: Write `grade(score)` returning "A"(>=90), "B"(>=80), "C"(>=70), "F"
function grade(score) {
  // TODO: implement (use if/else if chain)
}

// TODO: Write `dayType(day)` using switch returning "weekday" or "weekend"
//       day is a lowercase string: "monday", ..., "sunday"
function dayType(day) {
  // TODO: implement
}

// TODO: Write `fizzbuzz(n)` returning "FizzBuzz" if divisible by 15,
//       "Fizz" if by 3, "Buzz" if by 5, else the number as a string
function fizzbuzz(n) {
  // TODO: implement
}

// ---------------------------------------------------------------------------
// 2. Loops
// ---------------------------------------------------------------------------

// TODO: Write `range(start, end)` using a for loop returning [start,...,end-1]
function range(start, end) {
  // TODO: implement
}

// TODO: Write `sumWhile(arr)` using a while loop to sum array elements
function sumWhile(arr) {
  // TODO: implement
}

// TODO: Write `flatten(arr)` using for...of to flatten one level
function flatten(arr) {
  // TODO: implement
}

// TODO: Write `countKeys(obj)` using for...in counting own properties
function countKeys(obj) {
  // TODO: implement
}

// ---------------------------------------------------------------------------
// 3. Short-circuit and ternary
// ---------------------------------------------------------------------------

// TODO: Write `defaultTo(value, fallback)` returning value if truthy, else fallback
function defaultTo(value, fallback) {
  // TODO: implement (use ||)
}

// TODO: Write `nullishTo(value, fallback)` returning value unless null/undefined
function nullishTo(value, fallback) {
  // TODO: implement (use ??)
}

// TODO: Write `clamp(n, min, max)` returning n clamped to [min, max]
function clamp(n, min, max) {
  // TODO: implement (use Math.min/Math.max or ternary)
}

// ---------------------------------------------------------------------------
// Runtime assertions
// ---------------------------------------------------------------------------

console.assert(classify(5) === "positive", "classify positive failed");
console.assert(classify(-3) === "negative", "classify negative failed");
console.assert(classify(0) === "zero", "classify zero failed");

console.assert(grade(95) === "A", "grade A failed");
console.assert(grade(85) === "B", "grade B failed");
console.assert(grade(75) === "C", "grade C failed");
console.assert(grade(60) === "F", "grade F failed");

console.assert(dayType("saturday") === "weekend", "dayType weekend failed");
console.assert(dayType("sunday") === "weekend", "dayType sunday failed");
console.assert(dayType("monday") === "weekday", "dayType weekday failed");

console.assert(fizzbuzz(15) === "FizzBuzz", "fizzbuzz 15 failed");
console.assert(fizzbuzz(9) === "Fizz", "fizzbuzz 9 failed");
console.assert(fizzbuzz(10) === "Buzz", "fizzbuzz 10 failed");
console.assert(fizzbuzz(7) === "7", "fizzbuzz 7 failed");

console.assert(JSON.stringify(range(0, 5)) === "[0,1,2,3,4]", "range failed");
console.assert(JSON.stringify(range(3, 7)) === "[3,4,5,6]", "range(3,7) failed");
console.assert(sumWhile([1,2,3,4,5]) === 15, "sumWhile failed");
console.assert(JSON.stringify(flatten([[1,2],[3,4],[5]])) === "[1,2,3,4,5]", "flatten failed");
console.assert(countKeys({a:1,b:2,c:3}) === 3, "countKeys failed");

console.assert(defaultTo(null, "default") === "default", "defaultTo null failed");
console.assert(defaultTo(0, "default") === "default", "defaultTo 0 is falsy");
console.assert(defaultTo("val", "default") === "val", "defaultTo value failed");

console.assert(nullishTo(null, "fallback") === "fallback", "nullishTo null failed");
console.assert(nullishTo(0, "fallback") === 0, "nullishTo 0 should keep 0");
console.assert(nullishTo("hi", "fallback") === "hi", "nullishTo hi failed");

console.assert(clamp(5, 0, 10) === 5, "clamp in range failed");
console.assert(clamp(-5, 0, 10) === 0, "clamp below min failed");
console.assert(clamp(15, 0, 10) === 10, "clamp above max failed");

console.log("Exercise 1.5 — All assertions passed!");
