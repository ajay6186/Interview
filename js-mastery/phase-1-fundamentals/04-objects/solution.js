// ============================================================================
// Solution 1.4 — Objects
// ============================================================================

"use strict";

const person = { name: "Alice", age: 30, city: "NYC" };

function createPoint(x, y) { return { x, y }; }
function getProp(obj, key) { return obj[key]; }
function setProp(obj, key, value) { return { ...obj, [key]: value }; }
function deleteProp(obj, key) {
  const { [key]: _, ...rest } = obj;
  return rest;
}
function merge(a, b) { return { ...a, ...b }; }
function getKeys(obj) { return Object.keys(obj); }
function getValues(obj) { return Object.values(obj); }
function getEntries(obj) { return Object.entries(obj); }
function pick(obj, keys) {
  return Object.fromEntries(keys.filter(k => k in obj).map(k => [k, obj[k]]));
}
function omit(obj, keys) {
  const keySet = new Set(keys);
  return Object.fromEntries(Object.entries(obj).filter(([k]) => !keySet.has(k)));
}
function mapValues(obj, fn) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v, k)]));
}

// Assertions
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

console.log("Solution 1.4 — All assertions passed!");
