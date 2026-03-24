// ============================================================================
// Solution 6.5 — Meta-Programming
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Property descriptors
// ---------------------------------------------------------------------------

// defineHidden — adds non-enumerable, non-writable, non-configurable property
function defineHidden(obj, name, value) {
  Object.defineProperty(obj, name, {
    value,
    enumerable: false,
    writable: false,
    configurable: false,
  });
}

// addGetter — defines a computed getter using Object.defineProperty
function addGetter(obj, name, getFn) {
  Object.defineProperty(obj, name, {
    get: getFn,
    enumerable: true,
    configurable: true,
  });
}

// ---------------------------------------------------------------------------
// 2. Reflect API
// ---------------------------------------------------------------------------

// cloneWithReflect — clones preserving all own property descriptors
function cloneWithReflect(obj) {
  const clone = Object.create(Object.getPrototypeOf(obj));
  for (const key of Reflect.ownKeys(obj)) {
    const descriptor = Object.getOwnPropertyDescriptor(obj, key);
    Object.defineProperty(clone, key, descriptor);
  }
  return clone;
}

// ---------------------------------------------------------------------------
// 3. Proxy traps
// ---------------------------------------------------------------------------

// intercept — Proxy that logs every property get and set
function intercept(obj) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      console.log(`[GET] ${String(key)}`);
      return Reflect.get(target, key, receiver);
    },
    set(target, key, value, receiver) {
      console.log(`[SET] ${String(key)} = ${JSON.stringify(value)}`);
      return Reflect.set(target, key, value, receiver);
    },
  });
}

// autoProxy — returns a Proxy that auto-generates stub functions for missing keys
function autoProxy(proto) {
  return new Proxy(proto, {
    get(target, key, receiver) {
      if (key in target) return Reflect.get(target, key, receiver);
      if (typeof key === "string") {
        return function() {
          return `not implemented: ${key}`;
        };
      }
      return Reflect.get(target, key, receiver);
    },
  });
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

console.log("Solution 6.5 — All assertions passed!");
