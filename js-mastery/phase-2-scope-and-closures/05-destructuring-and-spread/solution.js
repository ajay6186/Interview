// ============================================================================
// Solution 2.5 — Destructuring & Spread
// ============================================================================

"use strict";

function head(arr) { const [first] = arr; return first; }
function tail(arr) { const [, ...rest] = arr; return rest; }
function swapPair([a, b]) { return [b, a]; }
function getName({ name }) { return name; }
function getNameAndAge({ name, age = 0 }) { return { name, age }; }
function renameProps({ firstName: first, lastName: last }) { return { first, last }; }
function getCity({ address: { city } }) { return city; }
function getFirstScore({ scores: [first] }) { return first; }
function mergeArrays(a, b) { return [...a, ...b]; }
function cloneAndAdd(obj, extra) { return { ...obj, ...extra }; }
function spreadCall(fn, args) { return fn(...args); }

// Assertions
console.assert(head([1,2,3]) === 1, "head failed");
console.assert(JSON.stringify(tail([1,2,3,4])) === "[2,3,4]", "tail failed");
console.assert(JSON.stringify(swapPair([1,2])) === "[2,1]", "swapPair failed");
console.assert(getName({ name: "Alice", age: 30 }) === "Alice", "getName failed");
const na = getNameAndAge({ name: "Bob" });
console.assert(na.name === "Bob" && na.age === 0, "getNameAndAge default failed");
const rp = renameProps({ firstName: "John", lastName: "Doe" });
console.assert(rp.first === "John" && rp.last === "Doe", "renameProps failed");
const user = { name: "Alice", address: { city: "NYC", zip: "10001" } };
console.assert(getCity(user) === "NYC", "getCity failed");
const data = { name: "Bob", scores: [95, 87, 73] };
console.assert(getFirstScore(data) === 95, "getFirstScore failed");
console.assert(JSON.stringify(mergeArrays([1,2],[3,4])) === "[1,2,3,4]", "mergeArrays failed");
const cloned = cloneAndAdd({ a: 1, b: 2 }, { b: 99, c: 3 });
console.assert(cloned.a === 1 && cloned.b === 99 && cloned.c === 3, "cloneAndAdd failed");
console.assert(spreadCall((a,b,c) => a+b+c, [1,2,3]) === 6, "spreadCall failed");

console.log("Solution 2.5 — All assertions passed!");
