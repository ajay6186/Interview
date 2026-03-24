// ============================================================================
// Exercise 6.5 — Meta-Programming
// ============================================================================
// Control JavaScript's object model directly: property descriptors,
// Reflect API, and dynamic Proxy traps for advanced runtime behaviour.
//
// Instructions: Fill in every TODO so the file runs and all assertions pass.
// Run with: node exercise.js
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Property descriptors
// ---------------------------------------------------------------------------

// TODO: Write defineHidden(obj, name, value) using Object.defineProperty
//       The property must be: non-enumerable, non-writable, non-configurable
function defineHidden(obj, name, value) {
  // TODO: Object.defineProperty(obj, name, { value, enumerable: false, writable: false, configurable: false })
}

// TODO: Write addGetter(obj, name, getFn) — adds a computed getter property
//       The getter must use `this` so it can reference the object's other properties
function addGetter(obj, name, getFn) {
  // TODO: Object.defineProperty(obj, name, { get: getFn, enumerable: true, configurable: true })
}

// ---------------------------------------------------------------------------
// 2. Reflect API
// ---------------------------------------------------------------------------

// TODO: Write cloneWithReflect(obj) — clones obj preserving ALL own property
//       descriptors (including non-enumerable, getters, Symbols)
//       Use Reflect.ownKeys and Object.getOwnPropertyDescriptor
function cloneWithReflect(obj) {
  // TODO: create empty clone with same prototype; copy each descriptor
}

// ---------------------------------------------------------------------------
// 3. Proxy traps
// ---------------------------------------------------------------------------

// TODO: Write intercept(obj) — returns a Proxy that logs every get and set
//       get trap: console.log(`[GET] ${key}`)
//       set trap: console.log(`[SET] ${key} = ${JSON.stringify(value)}`)
//       Use Reflect.get / Reflect.set to forward the actual operations
function intercept(obj) {
  // TODO: new Proxy(obj, { get(...) {...}, set(...) {...} })
}

// TODO: Write autoProxy(proto) — returns a Proxy over a prototype (or plain object)
//       When a property does NOT exist, return a function that returns
//       "not implemented: {propertyName}"
function autoProxy(proto) {
  // TODO: get trap — if key in target, Reflect.get; else return () => `not implemented: ${key}`
}

// ---------------------------------------------------------------------------
// Runtime assertions
// ---------------------------------------------------------------------------

const obj = {};
defineHidden(obj, "secret", 42);
console.assert(obj.secret === 42, "defineHidden: value readable");
console.assert(!Object.keys(obj).includes("secret"), "defineHidden: not enumerable");

const rect = { width: 5, height: 3 };
addGetter(rect, "area", function() { return this.width * this.height; });
console.assert(rect.area === 15, "addGetter: computed value");

const original = { a: 1, b: 2 };
const cloned = cloneWithReflect(original);
console.assert(cloned.a === 1 && cloned.b === 2, "cloneWithReflect: values");
console.assert(cloned !== original, "cloneWithReflect: different reference");

const proxied = intercept({ x: 1 });
console.assert(proxied.x === 1, "intercept: get works transparently");

const auto = autoProxy({});
console.assert(typeof auto.nonExistentMethod === "function", "autoProxy: returns function for missing keys");
console.assert(auto.nonExistentMethod() === "not implemented: nonExistentMethod", "autoProxy: stub message");

console.log("Exercise 6.5 — All assertions passed!");
