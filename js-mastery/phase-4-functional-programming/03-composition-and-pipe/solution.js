// ============================================================================
// Solution 4.3 — Composition & Pipe
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Binary compose and pipe
// ---------------------------------------------------------------------------

// compose(f, g) — right-to-left: f(g(x))
const compose = (f, g) => x => f(g(x));

// pipe(f, g) — left-to-right: g(f(x))
const pipe = (f, g) => x => g(f(x));

// ---------------------------------------------------------------------------
// 2. N-ary compose and pipe
// ---------------------------------------------------------------------------

// composeN(...fns) — right-to-left reduction over any number of functions
function composeN(...fns) {
  return x => fns.reduceRight((acc, fn) => fn(acc), x);
}

// pipeN(...fns) — left-to-right reduction over any number of functions
function pipeN(...fns) {
  return x => fns.reduce((acc, fn) => fn(acc), x);
}

// ---------------------------------------------------------------------------
// 3. Practical pipeline
// ---------------------------------------------------------------------------

// Data-cleaning pipeline: trim → uppercase → replace spaces → wrap brackets
function buildPipeline() {
  return pipeN(
    s => s.trim(),
    s => s.toUpperCase(),
    s => s.replace(/ /g, "_"),
    s => `[${s}]`
  );
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

console.log("Solution 4.3 — All assertions passed!");
