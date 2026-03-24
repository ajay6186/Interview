// ============================================================================
// Solution 2.1 — Closures
// ============================================================================

"use strict";

function makeCounter(start = 0) {
  let count = start;
  return {
    inc() { return ++count; },
    dec() { return --count; },
    reset() { count = start; return count; },
    get() { return count; },
  };
}

function makeAdders(n) {
  return Array.from({ length: n }, (_, i) => x => x + i);
}

function createAccount(initialBalance = 0) {
  let balance = initialBalance;
  return {
    deposit(amount) { balance += amount; return balance; },
    withdraw(amount) {
      if (amount > balance) throw new Error("Insufficient funds");
      balance -= amount;
      return balance;
    },
    get balance() { return balance; },
  };
}

function memoize(fn) {
  const cache = new Map();
  return function(arg) {
    if (cache.has(arg)) return cache.get(arg);
    const result = fn(arg);
    cache.set(arg, result);
    return result;
  };
}

function once(fn) {
  let called = false, result;
  return function(...args) {
    if (!called) { called = true; result = fn(...args); }
    return result;
  };
}

// Assertions
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
} catch (e) {
  console.assert(e.message.includes("Insufficient"), "withdraw error message failed");
}

let callCount = 0;
const memoSquare = memoize(n => { callCount++; return n * n; });
console.assert(memoSquare(5) === 25 && memoSquare(5) === 25, "memoize failed");
console.assert(callCount === 1, "fn should only be called once");

let initCount = 0;
const init = once(() => { initCount++; return "ready"; });
console.assert(init() === "ready" && init() === "ready", "once failed");
console.assert(initCount === 1, "fn should only execute once");

console.log("Solution 2.1 — All assertions passed!");
