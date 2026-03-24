// ============================================================================
// Exercise 2.4 — ES6+ Features
// ============================================================================
// Master let/const, template literals, symbols, Map, Set, and modern JS.
//
// Instructions: Fill in every TODO so the file runs and all assertions pass.
// Run with: node exercise.js
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. let/const block scoping
// ---------------------------------------------------------------------------

// TODO: Write `blockScopeDemo()` showing that let is block-scoped:
//       Create a variable inside an if block and try to access it outside.
//       Return { inside: true, outside: null }
function blockScopeDemo() {
  // TODO: implement
}

// ---------------------------------------------------------------------------
// 2. Template literals
// ---------------------------------------------------------------------------

// TODO: Write `format(name, score, total)` returning:
//       "Name: {name} | Score: {score}/{total} ({percent}%)"
//       where percent = Math.round(score/total * 100)
function format(name, score, total) {
  // TODO: implement using template literal
}

// TODO: Write `multiLine(lines)` taking an array of strings and returning
//       them joined by newline using a template literal
function multiLine(lines) {
  // TODO: implement
}

// ---------------------------------------------------------------------------
// 3. Map
// ---------------------------------------------------------------------------

// TODO: Write `wordCount(str)` returning a Map of word → count
function wordCount(str) {
  // TODO: implement using a Map
}

// ---------------------------------------------------------------------------
// 4. Set
// ---------------------------------------------------------------------------

// TODO: Write `uniqueValues(arr)` returning an array of unique values using Set
function uniqueValues(arr) {
  // TODO: implement
}

// TODO: Write `setIntersection(a, b)` returning elements in both arrays
function setIntersection(a, b) {
  // TODO: implement using Set
}

// TODO: Write `setUnion(a, b)` returning all unique elements from both
function setUnion(a, b) {
  // TODO: implement
}

// ---------------------------------------------------------------------------
// 5. Symbol
// ---------------------------------------------------------------------------

// TODO: Create a const `ID_SYMBOL` as a Symbol with description "id"
// TODO: Create an object `item` with [ID_SYMBOL]: 42, name: "Widget"
// (Symbol key should not appear in Object.keys)

// ---------------------------------------------------------------------------
// Runtime assertions
// ---------------------------------------------------------------------------

const demo = blockScopeDemo();
console.assert(demo.inside === true, "blockScopeDemo.inside failed");
console.assert(demo.outside === null, "blockScopeDemo.outside failed");

console.assert(format("Alice", 45, 50) === "Name: Alice | Score: 45/50 (90%)", "format failed");

const ml = multiLine(["line1", "line2", "line3"]);
console.assert(ml.includes("\n"), "multiLine should have newlines");

const wc = wordCount("the cat sat on the mat");
console.assert(wc.get("the") === 2, "wordCount 'the' failed");
console.assert(wc.get("cat") === 1, "wordCount 'cat' failed");
console.assert(wc instanceof Map, "wordCount should return Map");

console.assert(JSON.stringify(uniqueValues([1,2,2,3,3,3])) === "[1,2,3]", "uniqueValues failed");

const inter = setIntersection([1,2,3,4], [2,4,6]);
console.assert(inter.includes(2) && inter.includes(4) && inter.length === 2, "intersection failed");

const union = setUnion([1,2,3], [2,3,4,5]);
console.assert(union.length === 5, "union failed");

// Symbol tests
const ID_SYMBOL = Symbol("id");
const item = { [ID_SYMBOL]: 42, name: "Widget" };
console.assert(!Object.keys(item).includes("Symbol(id)"), "Symbol should not be in Object.keys");
console.assert(item[ID_SYMBOL] === 42, "Symbol key access failed");

console.log("Exercise 2.4 — All assertions passed!");
