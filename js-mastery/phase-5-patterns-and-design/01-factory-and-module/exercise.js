// ============================================================================
// Exercise 5.1 — Factory & Module Pattern
// ============================================================================
// Create objects without using `new` (factory functions) and encapsulate
// private state using IIFEs (module pattern).
//
// Instructions: Fill in every TODO so the file runs and all assertions pass.
// Run with: node exercise.js
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Factory functions
// ---------------------------------------------------------------------------

// TODO: Write factory function createUser(name, role)
//       Returns an object with: name, role, createdAt (Date.now()), greet()
//       greet() returns "Hello, I'm {name} ({role})"
function createUser(name, role = "user") {
  // TODO: implement
}

// TODO: Write factory function createStack()
//       Returns an object with: push(v), pop(), peek(), isEmpty(),
//       and a getter `size` returning the number of items
function createStack() {
  // TODO: implement using a private items array
}

// ---------------------------------------------------------------------------
// 2. Module pattern (IIFE with private state)
// ---------------------------------------------------------------------------

// TODO: Implement Counter module with private state
//       Expose: increment(), decrement(), reset(), and getter `value`
const Counter = (() => {
  // TODO: private let count = 0; return public API
})();

// TODO: Implement Config singleton with private storage
//       Expose: get(key), set(key, val), getAll()
const Config = (() => {
  // TODO: private const store = {}; return public API
})();

// ---------------------------------------------------------------------------
// Runtime assertions
// ---------------------------------------------------------------------------

const u = createUser("Alice", "admin");
console.assert(u.name === "Alice" && u.role === "admin", "createUser name/role");
console.assert(typeof u.greet === "function", "createUser has greet method");
console.assert(typeof u.createdAt === "number", "createUser has createdAt timestamp");

Counter.increment(); Counter.increment(); Counter.decrement();
console.assert(Counter.value === 1, "Counter value after inc/inc/dec");
Counter.reset();
console.assert(Counter.value === 0, "Counter value after reset");

const stack = createStack();
stack.push(1); stack.push(2); stack.push(3);
console.assert(stack.size === 3 && stack.peek() === 3, "stack: size and peek");
console.assert(stack.pop() === 3 && stack.size === 2, "stack: pop removes top");

Config.set("host", "localhost");
Config.set("port", 3000);
console.assert(Config.get("host") === "localhost", "Config: get");
console.assert(Object.keys(Config.getAll()).length === 2, "Config: getAll");

console.log("Exercise 5.1 — All assertions passed!");
