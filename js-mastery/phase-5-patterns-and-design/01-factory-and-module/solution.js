// ============================================================================
// Solution 5.1 — Factory & Module Pattern
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Factory functions
// ---------------------------------------------------------------------------

// createUser — factory producing user objects with private-feeling state
function createUser(name, role = "user") {
  return {
    name,
    role,
    createdAt: Date.now(),
    greet() {
      return `Hello, I'm ${this.name} (${this.role})`;
    },
  };
}

// createStack — factory producing a stack with private `items` array
function createStack() {
  const items = [];
  return {
    push(v) { items.push(v); },
    pop() { return items.pop(); },
    peek() { return items[items.length - 1]; },
    get size() { return items.length; },
    isEmpty() { return items.length === 0; },
  };
}

// ---------------------------------------------------------------------------
// 2. Module pattern (IIFE with private state)
// ---------------------------------------------------------------------------

// Counter — IIFE with private count variable
const Counter = (() => {
  let count = 0;
  return {
    increment() { count++; },
    decrement() { count--; },
    reset() { count = 0; },
    get value() { return count; },
  };
})();

// Config singleton — IIFE with private store object
const Config = (() => {
  const store = {};
  return {
    get(key) { return store[key]; },
    set(key, val) { store[key] = val; },
    getAll() { return Object.assign({}, store); },
  };
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

console.log("Solution 5.1 — All assertions passed!");
