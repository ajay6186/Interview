# Objects in JavaScript

## What is it?
Objects are the fundamental data structure in JavaScript — they are collections of key-value pairs where keys are strings (or Symbols) and values can be anything. Almost everything in JavaScript is an object or behaves like one. Understanding objects means understanding property access, mutation, copying, iteration, and the prototype system.

## Key Concepts
- **Object literals**: `{ key: value }` — the most common way to create objects
- **Property access**: dot notation (`obj.key`) or bracket notation (`obj["key"]`)
- **Shorthand**: `{ name, age }` when variable name matches key name
- **Computed keys**: `{ [expr]: value }` — key determined at runtime
- **Destructuring**: extracting properties into variables
- **Spread**: `{ ...obj }` — shallow copy / merge
- **Optional chaining**: `obj?.prop?.nested` — safe access
- **Object methods**: `Object.keys()`, `Object.values()`, `Object.entries()`, `Object.assign()`, `Object.freeze()`

## Syntax / Patterns

```js
// Object literal
const user = {
  name: "Alice",
  age: 30,
  greet() { return `Hi, I'm ${this.name}`; } // method shorthand
};

// Property shorthand (ES6)
const name = "Bob";
const age = 25;
const person = { name, age }; // same as { name: name, age: age }

// Computed property keys
const key = "dynamic";
const obj = { [key]: 42, [`${key}2`]: 99 };
obj.dynamic; // 42

// Property access
user.name;        // dot notation
user["name"];     // bracket notation (needed for dynamic keys, hyphens, reserved words)

// Optional chaining
const city = user?.address?.city; // undefined instead of TypeError

// Destructuring
const { name, age, address: { city = "Unknown" } = {} } = user;

// Destructuring with rename
const { name: userName, age: userAge } = user;

// Rest in destructuring
const { name: n, ...rest } = user; // rest contains everything except name

// Spread (shallow merge)
const updated = { ...user, age: 31 };        // new obj with overridden age
const merged  = { ...defaults, ...overrides }; // rightmost wins

// Object.keys / values / entries
Object.keys(user);    // ["name", "age"]
Object.values(user);  // ["Alice", 30]
Object.entries(user); // [["name","Alice"], ["age",30]]

// Object.assign (shallow copy / merge)
const copy = Object.assign({}, user);
Object.assign(target, source1, source2); // merges into target

// Object.freeze — prevents mutations
const config = Object.freeze({ port: 3000, host: "localhost" });
config.port = 8080; // silently ignored (TypeError in strict mode)

// Check property existence
"name" in user;                 // true (checks prototype chain too)
user.hasOwnProperty("name");    // true (own properties only)
Object.hasOwn(user, "name");    // true (modern, safer than hasOwnProperty)

// Iterating
for (const [key, value] of Object.entries(user)) {
  console.log(key, value);
}
```

## How It Works Internally
JavaScript objects are implemented as hash maps. Each property has a **property descriptor** with attributes:
- `value` — the stored value
- `writable` — can the value be changed?
- `enumerable` — shows in `for...in` and `Object.keys()`?
- `configurable` — can the descriptor itself be changed?

```js
Object.getOwnPropertyDescriptor(obj, "name");
// { value: "Alice", writable: true, enumerable: true, configurable: true }

// Create non-writable property
Object.defineProperty(obj, "id", {
  value: 1,
  writable: false,
  enumerable: true,
  configurable: false
});
```

Every object also has a **prototype** (`[[Prototype]]`) — a link to another object from which it inherits properties. `Object.create(proto)` creates an object with a specific prototype.

## Common Use Cases

```js
// Grouping / accumulator pattern
const grouped = items.reduce((acc, item) => {
  (acc[item.category] ??= []).push(item);
  return acc;
}, {});

// Default values with destructuring
function connect({ host = "localhost", port = 3000, ssl = false } = {}) {
  return `${ssl ? "https" : "http"}://${host}:${port}`;
}

// Deep clone (modern)
const deep = structuredClone(original);

// Transform object entries
const doubled = Object.fromEntries(
  Object.entries(prices).map(([k, v]) => [k, v * 2])
);

// Pick specific keys
function pick(obj, keys) {
  return Object.fromEntries(keys.map(k => [k, obj[k]]));
}
pick(user, ["name", "email"]); // { name: "Alice", email: "..." }

// Omit specific keys
function omit(obj, keys) {
  return Object.fromEntries(
    Object.entries(obj).filter(([k]) => !keys.includes(k))
  );
}
```

## Gotchas & Traps

```js
// 1. Spread is SHALLOW — nested objects share references
const a = { nested: { x: 1 } };
const b = { ...a };
b.nested.x = 99;
a.nested.x; // 99 ← shared reference!

// Fix: deep clone with structuredClone(a)

// 2. for...in iterates prototype chain
const obj = Object.create({ inherited: true });
obj.own = true;
for (const k in obj) console.log(k); // "own", "inherited"
// Use Object.keys() or Object.hasOwn() check

// 3. Property order is mostly insertion order, but integers sort first
const o = { b: 2, a: 1, 0: 0, 1: 1 };
Object.keys(o); // ["0", "1", "b", "a"] — integers first!

// 4. Object.freeze is shallow
const config = Object.freeze({ db: { port: 5432 } });
config.db.port = 9999; // ✅ no error — nested object is NOT frozen
config.newProp = "x"; // ❌ silently fails (TypeError in strict mode)

// 5. JSON.parse/stringify strips functions, symbols, undefined
const obj2 = { fn: () => {}, sym: Symbol(), undef: undefined, date: new Date() };
JSON.parse(JSON.stringify(obj2));
// { date: "2024-01-01T..." } — fn, sym, undef are gone! date is a string!

// 6. Computed key with Symbol
const id = Symbol("id");
const user = { [id]: 123 };
Object.keys(user);  // [] — Symbol keys are not enumerable in Object.keys
user[id];           // 123
```

## Interview Questions

**Q1: What is the difference between dot notation and bracket notation?**
> Dot notation (`obj.name`) is cleaner but only works with valid identifier keys (no spaces, hyphens, or reserved words). Bracket notation (`obj["name"]`) accepts any string (or expression), enabling dynamic property access, accessing keys with special characters, and using variables as keys.

**Q2: How do you clone an object in JavaScript?**
> Shallow clone: `{ ...obj }` or `Object.assign({}, obj)`. Deep clone: `structuredClone(obj)` (modern, handles most types) or `JSON.parse(JSON.stringify(obj))` (loses functions, undefined, symbols, and converts Dates to strings). For complex nested structures, use `structuredClone`.

**Q3: What's the difference between `in` and `hasOwnProperty`?**
> `"key" in obj` returns true if the property exists anywhere in the prototype chain (inherited or own). `obj.hasOwnProperty("key")` returns true only for own (directly defined) properties. Prefer `Object.hasOwn(obj, "key")` — it's the modern standard and doesn't break if `hasOwnProperty` is overridden.

**Q4: What does `Object.freeze()` do and what are its limitations?**
> `Object.freeze()` prevents adding, removing, or modifying properties on an object. However, it is **shallow** — nested objects are not frozen and can still be mutated. To deeply freeze, you'd need to recursively freeze all nested objects.

**Q5: How does object destructuring work with defaults and renaming?**
> `const { name: alias = "default" } = obj` — renames `name` to `alias` and falls back to `"default"` if `name` is `undefined`. Default values only trigger on `undefined`, not `null`. Nested destructuring: `const { address: { city } } = user`.

**Q6: What is `Object.entries()` and how do you use it?**
> `Object.entries(obj)` returns an array of `[key, value]` pairs for own enumerable properties. Useful for iterating with `for...of`, transforming with `map/filter`, and converting back with `Object.fromEntries()`. Combined: `Object.fromEntries(Object.entries(obj).map(...))` is a clean way to transform object values.

**Q7: What is a property descriptor?**
> Every property has a descriptor with 4 attributes: `value`, `writable` (can it be reassigned?), `enumerable` (does it show in for...in / Object.keys?), and `configurable` (can the descriptor be changed?). `Object.defineProperty()` lets you control these. `Object.freeze()` sets `writable: false` and `configurable: false` on all properties.
