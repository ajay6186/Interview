// ============================================================================
// Exercise 4.3 — Composition & Pipe
// ============================================================================
// Master function composition: combining simple functions into powerful
// pipelines. Understand both right-to-left (compose) and left-to-right (pipe).
//
// Instructions: Fill in every TODO so the file runs and all assertions pass.
// Run with: node exercise.js
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Binary compose and pipe
// ---------------------------------------------------------------------------

// TODO: compose(f, g) returns a function x => f(g(x))  (right-to-left)
const compose = (f, g) => {
  // TODO: implement
};

// TODO: pipe(f, g) returns a function x => g(f(x))  (left-to-right)
const pipe = (f, g) => {
  // TODO: implement
};

// ---------------------------------------------------------------------------
// 2. N-ary compose and pipe
// ---------------------------------------------------------------------------

// TODO: composeN(...fns) — right-to-left composition of any number of functions
//       composeN(f, g, h)(x) === f(g(h(x)))
//       Hint: use fns.reduceRight
function composeN(...fns) {
  // TODO: implement
}

// TODO: pipeN(...fns) — left-to-right composition of any number of functions
//       pipeN(f, g, h)(x) === h(g(f(x)))
//       Hint: use fns.reduce
function pipeN(...fns) {
  // TODO: implement
}

// ---------------------------------------------------------------------------
// 3. Practical pipeline
// ---------------------------------------------------------------------------

// TODO: Build a data-cleaning pipeline using pipeN that:
//       1. Trims whitespace from both ends
//       2. Converts to UPPERCASE
//       3. Replaces all spaces with underscores
//       4. Wraps the result in square brackets  → "[RESULT]"
function buildPipeline() {
  // TODO: return pipeN(trim, toUpper, replaceSpaces, wrapBrackets)
}

// ---------------------------------------------------------------------------
// Runtime assertions
// ---------------------------------------------------------------------------

const double = x => x * 2;
const addOne = x => x + 1;
const square = x => x * x;

console.assert(compose(addOne, double)(5) === 11, "compose: addOne(double(5))");
console.assert(pipe(double, addOne)(5) === 11, "pipe: addOne(double(5))");
console.assert(composeN(square, addOne, double)(3) === 49, "composeN: square(addOne(double(3)))");
console.assert(pipeN(double, addOne, square)(3) === 49, "pipeN: square(addOne(double(3)))");

const pipeline = buildPipeline();
console.assert(pipeline("  hello world  ") === "[HELLO_WORLD]", "buildPipeline");

console.log("Exercise 4.3 — All assertions passed!");
