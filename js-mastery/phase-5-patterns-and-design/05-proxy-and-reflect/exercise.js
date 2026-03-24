// ============================================================================
// Exercise 5.5 — Proxy & Reflect
// ============================================================================
// Use Proxy to intercept and customise object behaviour. Use Reflect to
// forward operations to the real target safely.
//
// Instructions: Fill in every TODO so the file runs and all assertions pass.
// Run with: node exercise.js
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Enforcement proxies
// ---------------------------------------------------------------------------

// TODO: Write readOnly(obj) — returns a Proxy that throws TypeError on any set
//       or deleteProperty trap; reads pass through normally
function readOnly(obj) {
  // TODO: new Proxy(obj, { set(target, key) { throw new TypeError(...) } })
}

// TODO: Write withDefaults(defaults, obj) — returns a Proxy where
//       get falls back to defaults[key] when key is absent from obj
function withDefaults(defaults, obj) {
  // TODO: use Reflect.has and Reflect.get in the get trap
}

// ---------------------------------------------------------------------------
// 2. Utility proxies
// ---------------------------------------------------------------------------

// TODO: Write negativeIndex(arr) — Proxy that allows negative indices
//       arr[-1] === arr[arr.length - 1], etc.
function negativeIndex(arr) {
  // TODO: convert negative numeric keys in the get trap
}

// TODO: Write observable(obj, onChange) — Proxy that calls onChange(key, value)
//       every time a property is set
function observable(obj, onChange) {
  // TODO: set trap calls Reflect.set then invokes onChange
}

// ---------------------------------------------------------------------------
// 3. Validation proxy
// ---------------------------------------------------------------------------

// TODO: Write validated(obj, schema) — Proxy that validates values on set
//       schema = { key: (value) => boolean }
//       Throw TypeError if schema[key] exists and returns false for the value
function validated(obj, schema) {
  // TODO: implement
}

// ---------------------------------------------------------------------------
// Runtime assertions
// ---------------------------------------------------------------------------

const ro = readOnly({ x: 1, y: 2 });
console.assert(ro.x === 1, "readOnly: get works");
try {
  ro.x = 99;
  console.assert(false, "should have thrown");
} catch (e) {
  console.assert(e.message.includes("read"), "readOnly: throws on set");
}

const cfg = withDefaults({ timeout: 5000, retries: 3 }, { timeout: 1000 });
console.assert(cfg.timeout === 1000, "withDefaults: own property overrides default");
console.assert(cfg.retries === 3, "withDefaults: missing key falls back to default");

const arr = negativeIndex([1, 2, 3, 4, 5]);
console.assert(arr[-1] === 5, "negativeIndex: arr[-1]");
console.assert(arr[-2] === 4, "negativeIndex: arr[-2]");
console.assert(arr[0] === 1, "negativeIndex: arr[0] unchanged");

const changes = [];
const obs = observable({}, (k, v) => changes.push({ k, v }));
obs.name = "Alice";
obs.age = 30;
console.assert(changes.length === 2 && changes[0].k === "name", "observable");

const schema = { age: v => typeof v === "number" && v >= 0 };
const v2 = validated({}, schema);
try { v2.age = -1; console.assert(false, "validated should throw"); } catch (e) {}
v2.age = 25;
console.assert(v2.age === 25, "validated: valid value accepted");

console.log("Exercise 5.5 — All assertions passed!");
