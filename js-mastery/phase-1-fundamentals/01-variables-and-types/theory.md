# Variables & Types in JavaScript

## What is it?
JavaScript is a dynamically typed language — variables don't have fixed types; types are determined at runtime. Every value in JavaScript belongs to one of the 8 primitive types or is an object. Understanding how JS stores, coerces, and compares types is foundational for writing correct code and acing interviews.

## Key Concepts
- **8 primitive types**: `string`, `number`, `boolean`, `null`, `undefined`, `bigint`, `symbol`, and `object` (non-primitive)
- **`var` / `let` / `const`**: scoping and hoisting differ significantly
- **Type coercion**: JS automatically converts types in certain operations (implicit) — a frequent bug source
- **`typeof` quirk**: `typeof null === "object"` is a historical bug, not a feature
- **`NaN`**: "Not a Number" is ironically of type `number`; use `Number.isNaN()` not `isNaN()`
- **Loose vs strict equality**: `==` coerces, `===` does not

## Syntax / Patterns

```js
// Variable declarations
var   x = 1;   // function-scoped, hoisted, re-declarable
let   y = 2;   // block-scoped, not hoisted (TDZ), not re-declarable
const z = 3;   // block-scoped, must be initialized, not re-assignable

// Primitives
const str  = "hello";          // string
const num  = 42;               // number
const bool = true;             // boolean
const nil  = null;             // null  (intentional absence)
let   undef;                   // undefined (unassigned)
const big  = 9007199254740991n; // bigint
const sym  = Symbol("id");     // symbol (always unique)

// typeof
typeof "hi"        // "string"
typeof 42          // "number"
typeof true        // "boolean"
typeof undefined   // "undefined"
typeof null        // "object"  ← famous bug
typeof {}          // "object"
typeof []          // "object"  ← use Array.isArray()
typeof function(){} // "function"

// Strict vs loose equality
0   == false   // true  (coercion)
0   === false  // false (no coercion)
null == undefined  // true
null === undefined // false

// Nullish coalescing
const val = null ?? "default"; // "default"
const val2 = 0   ?? "default"; // 0  (0 is NOT nullish)

// Optional chaining
const city = user?.address?.city; // undefined instead of throwing
```

## How It Works Internally
JavaScript engines (V8, SpiderMonkey) store primitives **by value** — each variable holds the actual data. Objects are stored **by reference** — variables hold a pointer to a heap location. When you do `let a = b` for primitives, you copy the value; for objects, you copy the reference.

The **Type Coercion** algorithm follows ToPrimitive → ToNumber / ToString rules:
- `"5" + 3` → `"53"` (+ with a string triggers string concatenation)
- `"5" - 3` → `2` (- always coerces both to numbers)
- `"5" * "2"` → `10` (arithmetic operators coerce to numbers)

## Common Use Cases

```js
// Safe null check pattern
const name = user?.profile?.name ?? "Guest";

// Type-safe number check
if (Number.isNaN(value)) { /* handle NaN */ }
if (Number.isFinite(value)) { /* safe to use */ }

// Deep clone (modern)
const clone = structuredClone(original);

// Array check
if (Array.isArray(value)) { /* it's an array */ }

// Exact type detection
Object.prototype.toString.call([])       // "[object Array]"
Object.prototype.toString.call(new Date()) // "[object Date]"
Object.prototype.toString.call(null)     // "[object Null]"
```

## Gotchas & Traps

| Trap | Explanation |
|------|-------------|
| `typeof null === "object"` | Historical bug — null is NOT an object |
| `NaN !== NaN` | NaN is the only value not equal to itself; use `Number.isNaN()` |
| `0.1 + 0.2 !== 0.3` | Floating-point precision issue; compare with epsilon |
| `[] == false` | `[]` coerces to `""`, then `0`, which equals `false` |
| `const obj = {}` is mutable | `const` prevents reassignment, not mutation |
| `var` inside loops | `var` is function-scoped — loop variable leaks out |
| `isNaN("abc")` → `true` | Global `isNaN` coerces to number first; use `Number.isNaN` |
| `typeof undeclaredVar` doesn't throw | Returns `"undefined"` safely |

```js
// Floating point fix
Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON // true

// const trap — object properties ARE mutable
const obj = { x: 1 };
obj.x = 2;     // ✅ works
obj = {};      // ❌ TypeError

// var scope leak
for (var i = 0; i < 3; i++) {}
console.log(i); // 3 — i leaked out!

for (let j = 0; j < 3; j++) {}
console.log(j); // ReferenceError — j is block-scoped
```

## Interview Questions

**Q1: What's the difference between `null` and `undefined`?**
> `undefined` means a variable has been declared but not assigned a value. `null` is an intentional empty/absent value that a developer explicitly sets. `typeof undefined === "undefined"`, while `typeof null === "object"` (a bug). `null == undefined` is `true` but `null === undefined` is `false`.

**Q2: Why does `typeof null` return `"object"`?**
> It's a historical bug from JavaScript's first implementation. In the original engine, values were stored with a type tag — the tag for objects was `000`, and null was represented as a null pointer (`0x00`), which matched the object tag. It was never fixed to preserve backward compatibility.

**Q3: What is the difference between `==` and `===`?**
> `===` (strict equality) compares both value and type without coercion. `==` (loose equality) performs type coercion before comparing. For example, `"5" == 5` is `true` but `"5" === 5` is `false`. Always prefer `===` to avoid unexpected coercion bugs.

**Q4: What are "falsy" values in JavaScript?**
> There are exactly 8 falsy values: `false`, `0`, `-0`, `0n` (BigInt zero), `""` (empty string), `null`, `undefined`, and `NaN`. Everything else is truthy — including `[]`, `{}`, and `"false"`.

**Q5: What's the difference between `var`, `let`, and `const`?**
> `var` is function-scoped, hoisted to the top of its function (initialized as `undefined`), and can be re-declared. `let` and `const` are block-scoped, are in a Temporal Dead Zone (TDZ) before declaration (accessing them throws ReferenceError), and cannot be re-declared. `const` additionally cannot be reassigned — but object/array properties can still be mutated.

**Q6: What is the Nullish Coalescing operator (`??`) and how does it differ from `||`?**
> `??` returns the right-hand side only when the left is `null` or `undefined`. `||` returns the right-hand side for ANY falsy value (including `0`, `""`, `false`). So `0 ?? "default"` returns `0`, but `0 || "default"` returns `"default"` — a crucial difference when `0` or empty string are valid values.

**Q7: How do you reliably check the type of a value?**
> `typeof` works for primitives except `null`. For comprehensive type checking, use `Object.prototype.toString.call(value)` which returns strings like `"[object Array]"`, `"[object Date]"`, `"[object Null]"`. For arrays specifically, use `Array.isArray()`. For instances of classes, use `instanceof`.
