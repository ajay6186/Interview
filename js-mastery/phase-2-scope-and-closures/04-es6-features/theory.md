# ES6+ Features in JavaScript

## What is it?
ES6 (ECMAScript 2015) was the largest update to JavaScript since its creation, introducing over 30 new features. Subsequent yearly releases (ES2017, ES2018, ES2019, etc.) added more. These features dramatically modernized the language — making it more expressive, safer, and more concise. Interviewers frequently test knowledge of these features as they're now the baseline for modern JS.

## Key Concepts
- **`let` / `const`**: block-scoped variable declarations replacing `var`
- **Arrow functions**: concise syntax with lexical `this`
- **Template literals**: string interpolation with backticks
- **Destructuring**: extract values from arrays/objects concisely
- **Spread / Rest**: `...` operator for copying and collecting
- **Default parameters**: parameter fallback values
- **Modules**: `import` / `export` for code organization
- **Promises**: built-in async handling
- **Classes**: OOP syntax over prototypes
- **`for...of`**: iterate over iterables
- **Map, Set, WeakMap, WeakSet**: new collection types
- **Symbol**: new unique primitive type
- **Generators**: pausable functions

## Syntax / Patterns

```js
// ─── let / const ─────────────────────────────────────────────────────────────
let count = 0;        // block-scoped, reassignable
const PI = 3.14159;   // block-scoped, not reassignable

// ─── Template Literals ────────────────────────────────────────────────────────
const name = "World";
const msg = `Hello, ${name}! 2 + 2 = ${2 + 2}`;
const multiline = `
  Line 1
  Line 2
`;

// Tagged template
function highlight(strings, ...values) {
  return strings.reduce((result, str, i) =>
    result + str + (values[i] !== undefined ? `<b>${values[i]}</b>` : ""), "");
}
highlight`Hello ${name}, you have ${5} messages`; // "Hello <b>World</b>, you have <b>5</b> messages"

// ─── Destructuring ────────────────────────────────────────────────────────────
// Array
const [a, b, ...rest] = [1, 2, 3, 4, 5];  // a=1, b=2, rest=[3,4,5]
const [,, third] = [1, 2, 3];              // skip elements

// Object
const { x, y = 10, label: name2 } = { x: 5, label: "point" }; // x=5, y=10, name2="point"

// Nested
const { address: { city, zip = "00000" } } = user;

// In function params
function connect({ host = "localhost", port = 3000 } = {}) { }

// ─── Spread / Rest ────────────────────────────────────────────────────────────
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];
const merged = [...arr1, ...arr2]; // [1,2,3,4,5,6]
const copy   = [...arr1];

const obj1 = { a: 1 };
const obj2 = { b: 2, a: 99 };     // a: 99 overrides
const merged2 = { ...obj1, ...obj2 }; // { a: 99, b: 2 }

function sum(...nums) { return nums.reduce((a, b) => a + b, 0); }

// ─── Modules ──────────────────────────────────────────────────────────────────
// math.js
export const PI = 3.14;
export function add(a, b) { return a + b; }
export default class Calculator { }

// main.js
import Calculator, { PI, add } from "./math.js";
import * as math from "./math.js"; // namespace import

// ─── Promise ──────────────────────────────────────────────────────────────────
const p = new Promise((resolve, reject) => {
  setTimeout(() => resolve("done"), 1000);
});
p.then(v => console.log(v)).catch(e => console.error(e));

// ─── Map and Set ──────────────────────────────────────────────────────────────
const map = new Map();
map.set("key", "value");
map.get("key");   // "value"
map.has("key");   // true
map.size;         // 1

const set = new Set([1, 2, 2, 3]); // {1, 2, 3} — deduped
set.add(4);
set.has(2);  // true
[...set];    // [1, 2, 3, 4]

// ─── Symbol ───────────────────────────────────────────────────────────────────
const id = Symbol("id"); // unique, no two Symbols are equal
const obj = { [id]: 42 };
obj[id]; // 42

// ─── Optional chaining & Nullish coalescing (ES2020) ─────────────────────────
const city = user?.address?.city ?? "Unknown";
```

## How It Works Internally
- **`let`/`const`** use block scoping via lexical environments — each `{}` block creates a new scope. The Temporal Dead Zone (TDZ) means the binding exists but throws if accessed before the declaration line.
- **Template literals** are compiled to string concatenation under the hood.
- **Destructuring** is syntactic sugar for multiple variable assignments.
- **`import`/`export`** (ESM) are statically analyzed at parse time — unlike CommonJS `require()` which is dynamic. This enables tree-shaking.
- **`Map`** vs plain object: Map keys can be any type (not just strings), maintains insertion order, has a `.size` property, and performs better for frequent add/remove.

## Common Use Cases

```js
// Swap variables
let x = 1, y = 2;
[x, y] = [y, x]; // swap!

// Function returning multiple values
function minMax(arr) {
  return { min: Math.min(...arr), max: Math.max(...arr) };
}
const { min, max } = minMax([3, 1, 4, 1, 5]);

// Clone with override
const updated = { ...original, timestamp: Date.now() };

// Unique values
const unique = [...new Set(duplicates)];

// Frequency counter with Map
const freq = new Map();
for (const item of items) {
  freq.set(item, (freq.get(item) ?? 0) + 1);
}

// Default argument object
function api({ url, method = "GET", timeout = 5000 } = {}) {
  return fetch(url, { method });
}

// Rest to collect variadic args
function log(level, ...messages) {
  console[level](messages.join(" "));
}
log("warn", "Something", "went", "wrong"); // console.warn("Something went wrong")
```

## Gotchas & Traps

```js
// 1. Temporal Dead Zone (TDZ) — let/const before declaration
console.log(x); // ❌ ReferenceError — TDZ
let x = 5;

// 2. const doesn't mean immutable — objects can be mutated
const obj = { a: 1 };
obj.a = 2;  // ✅ mutation is fine
obj = {};   // ❌ reassignment throws TypeError

// 3. Default export vs named export confusion
// Only ONE default export per module
export default function foo() {} // import foo from './f'
export function bar() {}         // import { bar } from './f'

// 4. Spread is shallow
const a = { nested: { x: 1 } };
const b = { ...a };
b.nested === a.nested; // true — same reference!

// 5. Map vs Object for keys
const map = new Map();
map.set(42, "number key");     // ✅
map.set({}, "object key");     // ✅
map.set(null, "null key");     // ✅
// Plain objects stringify all keys: obj[42] → obj["42"]

// 6. Set stores by reference for objects
const set = new Set();
set.add({ x: 1 });
set.add({ x: 1 }); // ← different reference — both added!
set.size; // 2 (not 1!)

// 7. Dynamic import (ES2020) is async
const module = await import("./module.js");
// Regular import is static and synchronous at module load time
```

## Interview Questions

**Q1: What are the key differences between `var`, `let`, and `const` introduced in ES6?**
> `let` and `const` are block-scoped (within `{}`), not hoisted to the function top, exist in a TDZ before their declaration, and cannot be re-declared in the same scope. `const` additionally cannot be reassigned after initialization. `var` is function-scoped, hoisted (initialized to `undefined`), and can be re-declared — leading to common bugs.

**Q2: What's the difference between `Map` and a regular object?**
> `Map` keys can be any type (including objects, functions, `null`); object keys are always strings/symbols. `Map` maintains insertion order; object integer keys sort first. `Map` has a `.size` property; objects need `Object.keys().length`. `Map` has better performance for frequent insertions/deletions. Use `Map` for dynamic key-value collections; use objects for structured data with known keys.

**Q3: What are template literal tags?**
> A tagged template is a function call where the first argument is an array of string parts and remaining arguments are the interpolated values. `tag\`Hello ${name}\`` calls `tag(["Hello ", ""], name)`. Used by: CSS-in-JS (styled-components), SQL injection prevention (sql`SELECT...`), i18n, and highlight libraries.

**Q4: What is the difference between named and default exports?**
> A module can have multiple named exports (`export const x = ...`) but only one default export (`export default ...`). Named imports must match the export name (or be aliased with `as`). Default imports can use any name. Mixing: `import React, { useState } from "react"` — `React` is default, `useState` is named.

**Q5: What is a `Symbol` used for?**
> Symbols are unique, immutable primitive values used as guaranteed-unique property keys (no collisions). Common uses: (1) Property keys that won't clash with other code: `obj[Symbol("id")] = 123`. (2) Well-known symbols to customize object behavior: `Symbol.iterator`, `Symbol.toPrimitive`. (3) Constants that are guaranteed unique even with the same description.

**Q6: What's the difference between `Set` and `Array`?**
> `Set` stores only unique values (using SameValueZero equality), while arrays allow duplicates. `Set.has()` is O(1), `Array.includes()` is O(n). `Set` has no index access — use `[...set]` to convert to array. Sets are ideal for uniqueness checks and deduplication: `[...new Set(array)]`.

**Q7: How do ES modules (`import`/`export`) differ from CommonJS (`require`)?**
> ES modules (ESM) are **static** — imports are analyzed at parse time, enabling tree-shaking and circular dependency detection. CommonJS `require()` is **dynamic** — can be called conditionally at runtime. ESM uses `import`/`export` keywords, is the browser standard, and runs in strict mode. CommonJS uses `require()`/`module.exports`, is Node.js's original system. Modern Node.js supports both (`.mjs` for ESM, `.cjs` for CJS, or `"type": "module"` in package.json).
