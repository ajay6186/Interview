// ============================================================================
// Solution 4.5 — Immutability
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Deep freeze
// ---------------------------------------------------------------------------

// deepFreeze — recursively freezes all nested objects
function deepFreeze(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  Object.getOwnPropertyNames(obj).forEach(name => deepFreeze(obj[name]));
  return Object.freeze(obj);
}

// ---------------------------------------------------------------------------
// 2. Immutable todo-list operations
// ---------------------------------------------------------------------------

// addTodo — returns new array with new todo appended
function addTodo(todos, text) {
  return [...todos, { id: todos.length + 1, text, done: false }];
}

// toggleTodo — returns new array with matching todo's done flag flipped
function toggleTodo(todos, id) {
  return todos.map(t => t.id === id ? { ...t, done: !t.done } : t);
}

// removeTodo — returns new array without the todo matching id
function removeTodo(todos, id) {
  return todos.filter(t => t.id !== id);
}

// ---------------------------------------------------------------------------
// 3. Deep immutable update
// ---------------------------------------------------------------------------

// updateNested — recursively spreads objects along the path to avoid mutation
function updateNested(obj, path, value) {
  if (path.length === 0) return value;
  const [head, ...tail] = path;
  return {
    ...obj,
    [head]: updateNested(obj[head], tail, value)
  };
}

// ---------------------------------------------------------------------------
// Runtime assertions
// ---------------------------------------------------------------------------

const config = deepFreeze({ db: { host: "localhost", port: 5432 } });
try { config.db.port = 9999; } catch (e) {}
console.assert(config.db.port === 5432, "deepFreeze prevents mutation");

let todos = [];
todos = addTodo(todos, "Buy milk");
todos = addTodo(todos, "Read book");
console.assert(todos.length === 2, "addTodo count");
console.assert(todos[0].done === false, "addTodo done starts false");

todos = toggleTodo(todos, 1);
console.assert(todos[0].done === true, "toggleTodo flips done");
console.assert(todos[1].done === false, "toggleTodo leaves others unchanged");

todos = removeTodo(todos, 2);
console.assert(todos.length === 1, "removeTodo");

const state = { user: { name: "Alice", prefs: { theme: "dark" } } };
const next = updateNested(state, ["user", "prefs", "theme"], "light");
console.assert(state.user.prefs.theme === "dark", "updateNested: original unchanged");
console.assert(next.user.prefs.theme === "light", "updateNested: result correct");

console.log("Solution 4.5 — All assertions passed!");
