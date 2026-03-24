// ============================================================================
// Solution 5.5 — Proxy & Reflect
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Enforcement proxies
// ---------------------------------------------------------------------------

// readOnly — throws TypeError on any set or delete attempt
function readOnly(obj) {
  return new Proxy(obj, {
    set(target, key) {
      throw new TypeError(`Cannot set property "${String(key)}" — object is read-only`);
    },
    deleteProperty(target, key) {
      throw new TypeError(`Cannot delete property "${String(key)}" — object is read-only`);
    },
  });
}

// withDefaults — falls back to defaults[key] when key is absent from obj
function withDefaults(defaults, obj) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      if (Reflect.has(target, key)) return Reflect.get(target, key, receiver);
      if (Reflect.has(defaults, key)) return Reflect.get(defaults, key);
      return undefined;
    },
  });
}

// ---------------------------------------------------------------------------
// 2. Utility proxies
// ---------------------------------------------------------------------------

// negativeIndex — converts negative numeric keys to arr.length + index
function negativeIndex(arr) {
  return new Proxy(arr, {
    get(target, key, receiver) {
      const index = typeof key === "string" ? Number(key) : key;
      if (Number.isInteger(index) && index < 0) {
        return Reflect.get(target, target.length + index, receiver);
      }
      return Reflect.get(target, key, receiver);
    },
  });
}

// observable — calls onChange(key, value) after each successful set
function observable(obj, onChange) {
  return new Proxy(obj, {
    set(target, key, value, receiver) {
      const result = Reflect.set(target, key, value, receiver);
      if (result) onChange(key, value);
      return result;
    },
  });
}

// ---------------------------------------------------------------------------
// 3. Validation proxy
// ---------------------------------------------------------------------------

// validated — validates values against schema on set; throws TypeError on failure
function validated(obj, schema) {
  return new Proxy(obj, {
    set(target, key, value, receiver) {
      if (schema[key] && !schema[key](value)) {
        throw new TypeError(`Invalid value for property "${String(key)}": ${value}`);
      }
      return Reflect.set(target, key, value, receiver);
    },
  });
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

console.log("Solution 5.5 — All assertions passed!");
