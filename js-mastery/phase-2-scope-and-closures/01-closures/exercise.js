// ============================================================================
// Exercise 2.1 — Closures
// ============================================================================
// Understand lexical scope and closures: functions that remember their
// creation environment even after the outer function has returned.
//
// Instructions: Fill in every TODO so the file runs and all assertions pass.
// Run with: node exercise.js
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Basic closure — counter factory
// ---------------------------------------------------------------------------

// TODO: Write `makeCounter(start)` returning an object with:
//       - inc(): increments and returns the new count
//       - dec(): decrements and returns the new count
//       - reset(): resets to start and returns start
//       - get(): returns current count
function makeCounter(start = 0) {
  // TODO: implement
}

// ---------------------------------------------------------------------------
// 2. Closure over loop variable
// ---------------------------------------------------------------------------

// TODO: Write `makeAdders(n)` returning an array of n functions where
//       adders[i] adds i to its argument. Each must capture its own i.
function makeAdders(n) {
  // TODO: implement (use let in the loop, or Array.from)
}

// ---------------------------------------------------------------------------
// 3. Private state — bank account
// ---------------------------------------------------------------------------

// TODO: Write `createAccount(initialBalance)` returning { deposit, withdraw, balance }
//       - deposit(amount): adds amount, returns new balance
//       - withdraw(amount): subtracts amount (reject if insufficient), returns new balance or throws
//       - balance: getter returning current balance
function createAccount(initialBalance = 0) {
  // TODO: implement
}

// ---------------------------------------------------------------------------
// 4. Memoization using closure
// ---------------------------------------------------------------------------

// TODO: Write `memoize(fn)` returning a memoized version of fn (single arg)
function memoize(fn) {
  // TODO: implement using a Map
}

// ---------------------------------------------------------------------------
// 5. Once — call only once
// ---------------------------------------------------------------------------

// TODO: Write `once(fn)` returning a wrapper that calls fn at most once
//       Subsequent calls return the result of the first call
function once(fn) {
  // TODO: implement
}

// ---------------------------------------------------------------------------
// Runtime assertions
// ---------------------------------------------------------------------------

const counter = makeCounter(10);
console.assert(counter.inc() === 11, "inc failed");
console.assert(counter.inc() === 12, "second inc failed");
console.assert(counter.dec() === 11, "dec failed");
console.assert(counter.get() === 11, "get failed");
console.assert(counter.reset() === 10, "reset failed");
console.assert(counter.get() === 10, "get after reset failed");

const adders = makeAdders(5);
console.assert(adders[0](10) === 10, "adders[0] failed");
console.assert(adders[3](10) === 13, "adders[3] failed");
console.assert(adders[4](10) === 14, "adders[4] failed");

const account = createAccount(100);
console.assert(account.balance === 100, "initial balance failed");
console.assert(account.deposit(50) === 150, "deposit failed");
console.assert(account.withdraw(30) === 120, "withdraw failed");
try {
  account.withdraw(200);
  console.assert(false, "should have thrown");
} catch (e) {
  console.assert(e.message.includes("Insufficient"), "withdraw error message failed");
}

let callCount = 0;
const memoSquare = memoize(n => { callCount++; return n * n; });
console.assert(memoSquare(5) === 25, "memoize 1st call failed");
console.assert(memoSquare(5) === 25, "memoize 2nd call failed");
console.assert(callCount === 1, "fn should only be called once");

let initCount = 0;
const init = once(() => { initCount++; return "ready"; });
console.assert(init() === "ready", "once 1st call failed");
console.assert(init() === "ready", "once 2nd call failed");
console.assert(initCount === 1, "fn should only execute once");

console.log("Exercise 2.1 — All assertions passed!");
