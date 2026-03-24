// ============================================================================
// Solution 1.2 — Functions
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Function declaration vs expression vs arrow
// ---------------------------------------------------------------------------

function square(n) {
  return n * n;
}

const cube = function(n) {
  return n * n * n;
};

const double = (n) => n * 2;

const negate = (b) => !b;

// ---------------------------------------------------------------------------
// 2. Default parameters
// ---------------------------------------------------------------------------

function greetUser(name, greeting = "Hello") {
  return `${greeting}, ${name}!`;
}

function power(base, exp = 2) {
  return base ** exp;
}

// ---------------------------------------------------------------------------
// 3. Rest parameters
// ---------------------------------------------------------------------------

function sum(...numbers) {
  return numbers.reduce((acc, n) => acc + n, 0);
}

function first(arr, n = 1) {
  return arr.slice(0, n);
}

// ---------------------------------------------------------------------------
// 4. Higher-order functions
// ---------------------------------------------------------------------------

function applyTwice(fn, x) {
  return fn(fn(x));
}

function makeAdder(n) {
  return (x) => x + n;
}

function compose(f, g) {
  return (x) => f(g(x));
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
console.assert(addOneThenDouble(4) === 10, "compose failed");

console.log("Solution 1.2 — All assertions passed!");
