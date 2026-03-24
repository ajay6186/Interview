// ============================================================================
// Exercise 1.4 — Objects
// ============================================================================
// Master object creation, property access, shorthand syntax, computed
// properties, Object utilities, and common object patterns.
//
// Instructions: Fill in every TODO so the file runs and all assertions pass.
// Run with: node exercise.js
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Object creation and access
// ---------------------------------------------------------------------------

// TODO: Create a const object `person` with: name "Alice", age 30, city "NYC"

// TODO: Write `createPoint(x, y)` returning {x, y} using property shorthand
function createPoint(x, y) {
  // TODO: implement
}

// TODO: Write `getProp(obj, key)` returning obj[key] (bracket notation)
function getProp(obj, key) {
  // TODO: implement
}

// ---------------------------------------------------------------------------
// 2. Immutable object operations (return new objects, don't mutate)
// ---------------------------------------------------------------------------

// TODO: Write `setProp(obj, key, value)` returning a new object with the property added/updated
function setProp(obj, key, value) {
  // TODO: implement (use spread)
}

// TODO: Write `deleteProp(obj, key)` returning a new object without that key
function deleteProp(obj, key) {
  // TODO: use rest destructuring or Object.fromEntries
}

// TODO: Write `merge(a, b)` returning a new merged object (b overrides a)
function merge(a, b) {
  // TODO: implement
}

// ---------------------------------------------------------------------------
// 3. Object utility methods
// ---------------------------------------------------------------------------

// TODO: Write `getKeys(obj)` returning Object.keys(obj)
function getKeys(obj) {
  // TODO: implement
}

// TODO: Write `getValues(obj)` returning Object.values(obj)
function getValues(obj) {
  // TODO: implement
}

// TODO: Write `getEntries(obj)` returning Object.entries(obj)
function getEntries(obj) {
  // TODO: implement
}

// ---------------------------------------------------------------------------
// 4. Object patterns
// ---------------------------------------------------------------------------

// TODO: Write `pick(obj, keys)` returning a new object with only those keys
function pick(obj, keys) {
  // TODO: implement
}

// TODO: Write `omit(obj, keys)` returning a new object without those keys
function omit(obj, keys) {
  // TODO: implement
}

// TODO: Write `mapValues(obj, fn)` returning a new object with fn applied to each value
function mapValues(obj, fn) {
  // TODO: implement
}

// ---------------------------------------------------------------------------
// Runtime assertions
// ---------------------------------------------------------------------------

console.assert(person.name === "Alice", "person.name failed");
console.assert(person.age === 30, "person.age failed");
console.assert(person.city === "NYC", "person.city failed");

const pt = createPoint(3, 4);
console.assert(pt.x === 3 && pt.y === 4, "createPoint failed");

const obj = { a: 1, b: 2, c: 3 };
console.assert(getProp(obj, "b") === 2, "getProp failed");

const newObj = setProp(obj, "d", 4);
console.assert(newObj.d === 4, "setProp add failed");
console.assert(!obj.d, "setProp should not mutate original");

const updatedObj = setProp(obj, "a", 99);
console.assert(updatedObj.a === 99 && obj.a === 1, "setProp update failed");

const deleted = deleteProp(obj, "b");
console.assert(!("b" in deleted) && "a" in deleted && "c" in deleted, "deleteProp failed");

const merged = merge({ a: 1, b: 2 }, { b: 99, c: 3 });
console.assert(merged.a === 1 && merged.b === 99 && merged.c === 3, "merge failed");

console.assert(JSON.stringify(getKeys({ a: 1, b: 2 })) === '["a","b"]', "getKeys failed");
console.assert(JSON.stringify(getValues({ a: 1, b: 2 })) === "[1,2]", "getValues failed");
console.assert(getEntries({ a: 1 })[0][0] === "a", "getEntries failed");

const picked = pick({ a: 1, b: 2, c: 3 }, ["a", "c"]);
console.assert(picked.a === 1 && picked.c === 3 && !picked.b, "pick failed");

const omitted = omit({ a: 1, b: 2, c: 3 }, ["b"]);
console.assert(omitted.a === 1 && omitted.c === 3 && !omitted.b, "omit failed");

const doubled = mapValues({ x: 1, y: 2, z: 3 }, v => v * 2);
console.assert(doubled.x === 2 && doubled.y === 4 && doubled.z === 6, "mapValues failed");

console.log("Exercise 1.4 — All assertions passed!");
