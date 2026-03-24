// ============================================================================
// Exercise 4.5 — Immutability
// ============================================================================
// Learn to write code that never mutates state. Practice deep freezing,
// pure todo-list operations, and recursive immutable updates.
//
// Instructions: Fill in every TODO so the file runs and all assertions pass.
// Run with: node exercise.js
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Deep freeze
// ---------------------------------------------------------------------------

// TODO: Write deepFreeze(obj) — recursively freezes all nested objects so
//       that no property can be changed even deep inside the tree
//       Returns the frozen object (use Object.freeze)
function deepFreeze(obj) {
  // TODO: implement recursively
}

// ---------------------------------------------------------------------------
// 2. Immutable todo-list operations
// ---------------------------------------------------------------------------

// TODO: Write pure addTodo(todos, text) — returns a new array with a new todo
//       appended: { id: todos.length + 1, text, done: false }
function addTodo(todos, text) {
  // TODO: implement using spread
}

// TODO: Write pure toggleTodo(todos, id) — returns new array with the todo
//       matching `id` having its `done` flag flipped; others unchanged
function toggleTodo(todos, id) {
  // TODO: implement using map + spread
}

// TODO: Write pure removeTodo(todos, id) — returns new array without the todo
//       matching `id`
function removeTodo(todos, id) {
  // TODO: implement using filter
}

// ---------------------------------------------------------------------------
// 3. Deep immutable update
// ---------------------------------------------------------------------------

// TODO: Write pure updateNested(obj, path, value) — returns a new object tree
//       with the value at the given key-path replaced.
//       path is an array of keys, e.g. ["user", "prefs", "theme"]
//       Every object along the path must be new (spread, not mutate)
function updateNested(obj, path, value) {
  // TODO: implement recursively
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

console.log("Exercise 4.5 — All assertions passed!");
