// ============================================================================
// Exercise 1.2 — Functions
// ============================================================================
// Master function declarations, expressions, arrow functions, default params,
// rest parameters, and higher-order functions.
//
// Instructions: Fill in every TODO so the file runs and all assertions pass.
// Run with: node exercise.js
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Function declaration vs expression vs arrow
// ---------------------------------------------------------------------------

// TODO: Write a function DECLARATION `square(n)` returning n * n
function square(n) {
  // TODO: implement
}

// TODO: Write a function EXPRESSION `cube` returning n * n * n
const cube = function(n) {
  // TODO: implement
};

// TODO: Write an ARROW function `double` returning n * 2
const double = (n) => {
  // TODO: implement
};

// TODO: Write a concise arrow `negate` returning the negation of a boolean
const negate = (b) => {
  // TODO: implement
};

// ---------------------------------------------------------------------------
// 2. Default parameters
// ---------------------------------------------------------------------------

// TODO: Write `greetUser(name, greeting)` where greeting defaults to "Hello"
//       Returns: "{greeting}, {name}!"
function greetUser(name, greeting) {
  // TODO: add default for greeting, then implement
}

// TODO: Write `power(base, exp)` where exp defaults to 2
function power(base, exp) {
  // TODO: add default for exp, then implement
}

// ---------------------------------------------------------------------------
// 3. Rest parameters
// ---------------------------------------------------------------------------

// TODO: Write `sum(...numbers)` returning the sum of all arguments
function sum(...numbers) {
  // TODO: implement
}

// TODO: Write `first(arr, n)` returning the first n elements (default n = 1)
function first(arr, n) {
  // TODO: implement
}

// ---------------------------------------------------------------------------
// 4. Higher-order functions
// ---------------------------------------------------------------------------

// TODO: Write `applyTwice(fn, x)` applying fn to x twice: fn(fn(x))
function applyTwice(fn, x) {
  // TODO: implement
}

// TODO: Write `makeAdder(n)` returning a function that adds n to its argument
function makeAdder(n) {
  // TODO: implement
}

// TODO: Write `compose(f, g)` returning x => f(g(x))
function compose(f, g) {
  // TODO: implement
}

// ---------------------------------------------------------------------------
// Runtime assertions
// ---------------------------------------------------------------------------

console.assert(square(4) === 16, "square(4) should be 16");
console.assert(cube(3) === 27, "cube(3) should be 27");
console.assert(double(5) === 10, "double(5) should be 10");
console.assert(negate(true) === false, "negate(true) should be false");

console.assert(greetUser("Alice") === "Hello, Alice!", "greetUser default failed");
console.assert(greetUser("Alice", "Hi") === "Hi, Alice!", "greetUser custom failed");
console.assert(power(3) === 9, "power(3) default exp failed");
console.assert(power(2, 10) === 1024, "power(2,10) failed");

console.assert(sum(1, 2, 3, 4) === 10, "sum failed");
console.assert(sum() === 0, "sum() should be 0");

console.assert(JSON.stringify(first([1,2,3,4])) === "[1]", "first default failed");
console.assert(JSON.stringify(first([1,2,3,4], 3)) === "[1,2,3]", "first(3) failed");

console.assert(applyTwice(double, 3) === 12, "applyTwice failed");

const add5 = makeAdder(5);
console.assert(add5(3) === 8, "makeAdder failed");

const addOneThenDouble = compose(double, makeAdder(1));
console.assert(addOneThenDouble(4) === 10, "compose failed");  // double(add1(4)) = double(5) = 10

console.log("Exercise 1.2 — All assertions passed!");
