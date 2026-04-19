# Destructuring & Spread in JavaScript

## What is it?
Destructuring is a syntax for **unpacking values from arrays or properties from objects** into distinct variables. The spread operator (`...`) **expands** iterables/objects into individual elements. The rest operator (same `...` syntax) **collects** remaining elements into an array or object. These ES6 features dramatically reduce boilerplate and are used throughout modern JavaScript.

## Key Concepts
- **Array destructuring**: positional extraction — order matters
- **Object destructuring**: name-based extraction — order doesn't matter
- **Default values**: provide fallbacks for `undefined` values
- **Renaming**: extract with a different variable name (`{ key: alias }`)
- **Nested destructuring**: destructure inside destructuring
- **Rest in destructuring**: collect remaining items into an array/object
- **Spread in arrays**: copy/merge arrays, pass as function args
- **Spread in objects**: copy/merge objects (shallow)
- **Rest in function params**: collect extra arguments into an array

## Syntax / Patterns

```js
// ─── ARRAY DESTRUCTURING ──────────────────────────────────────────────────────
const [first, second, third] = [1, 2, 3];

// Skip elements
const [, , third2] = [1, 2, 3];    // third2 = 3

// Default values (only when undefined)
const [a = 10, b = 20] = [5];      // a=5, b=20

// Rest element (must be last)
const [head, ...tail] = [1, 2, 3, 4]; // head=1, tail=[2,3,4]

// Swap variables (no temp variable needed)
let x = 1, y = 2;
[x, y] = [y, x];  // x=2, y=1

// From function return
const [min, max] = getMinMax(arr);

// ─── OBJECT DESTRUCTURING ─────────────────────────────────────────────────────
const { name, age } = user;

// Rename (key: alias)
const { name: userName, age: userAge } = user;

// Default values
const { role = "guest", level = 1 } = user;

// Rename + default
const { name: n = "Anonymous" } = user;

// Rest in object destructuring
const { name: n2, age: a2, ...rest } = user; // rest = everything except name and age

// ─── NESTED DESTRUCTURING ─────────────────────────────────────────────────────
const { address: { city, zip = "N/A" } } = user;
const [[r1c1, r1c2], [r2c1, r2c2]] = matrix;

// ─── IN FUNCTION PARAMETERS ───────────────────────────────────────────────────
function greet({ name, age = 0, role = "guest" } = {}) {
  return `${name} (${role}, age ${age})`;
}
greet({ name: "Alice", role: "admin" });

function first2([head, ...tail]) {
  return head;
}

// ─── SPREAD OPERATOR ──────────────────────────────────────────────────────────
// Arrays
const merged = [...arr1, ...arr2];
const copy   = [...original];
const prepend = [0, ...arr];
const append  = [...arr, 99];

// In function calls
Math.max(...[1, 5, 3, 9]); // same as Math.max(1, 5, 3, 9)
console.log(...arr);

// Objects (ES2018)
const merged2 = { ...obj1, ...obj2 }; // rightmost wins on conflict
const overridden = { ...defaults, timeout: 5000 }; // override specific key

// ─── REST PARAMETERS ──────────────────────────────────────────────────────────
function sum(first, ...rest) {
  return rest.reduce((a, b) => a + b, first);
}
sum(1, 2, 3, 4); // 10

// Collect all args
const logAll = (...args) => console.log(...args);
```

## How It Works Internally
Destructuring is **syntactic sugar** — the JavaScript engine compiles it to multiple variable assignments. No new runtime mechanism; just shorthand that the parser transforms.

```js
// This:
const { a, b } = obj;
// Is compiled to:
const a = obj.a;
const b = obj.b;

// This:
const [x, y] = arr;
// Is compiled to:
const x = arr[0];
const y = arr[1];
```

Spread for arrays works on any **iterable** (anything with `[Symbol.iterator]`). Object spread uses `Object.assign`-like semantics (own enumerable properties only).

## Common Use Cases

```js
// 1. Function returning multiple values
function parseCoord(str) {
  const parts = str.split(",");
  return { lat: parseFloat(parts[0]), lng: parseFloat(parts[1]) };
}
const { lat, lng } = parseCoord("51.5,-0.1");

// 2. API response handling
const { data: { users, total }, status } = await fetchUsers();

// 3. Event handling
document.addEventListener("click", ({ target, clientX, clientY }) => {
  console.log(target, clientX, clientY);
});

// 4. React props
function Button({ label, onClick, disabled = false, className = "" }) {
  return <button onClick={onClick} disabled={disabled}>{label}</button>;
}

// 5. Array operations (functional style)
const [first3, ...withoutFirst] = arr; // remove first element immutably
const withoutLast = arr.slice(0, -1);   // remove last immutably

// 6. Clone and override
const updatedUser = { ...user, lastLogin: Date.now() };

// 7. Merge with priority
const config = { ...defaultConfig, ...envConfig, ...runtimeConfig };

// 8. Spread to pass array as arguments
const dates = ["2024-01-01", "2024-06-15", "2024-12-31"];
const earliest = new Date(Math.min(...dates.map(d => new Date(d))));

// 9. Pick/Omit pattern
const { password, __v, ...publicUser } = userFromDB; // omit sensitive fields
```

## Gotchas & Traps

```js
// 1. Destructuring undefined throws
const { name } = null;      // ❌ TypeError: Cannot destructure null
const { name2 } = undefined; // ❌ TypeError
// Fix: default the whole object
const { name3 } = user ?? {};
function fn({ x } = {}) {}  // safe: defaults to {} if no arg

// 2. Spread is SHALLOW — nested objects are shared
const a = { nested: { x: 1 } };
const b = { ...a };
b.nested.x = 99;
a.nested.x; // 99 — same reference

// 3. Object spread order matters — last wins
const merged = { x: 1, ...{ x: 2, y: 3 } }; // { x: 2, y: 3 }
const merged2 = { ...{ x: 2, y: 3 }, x: 1 }; // { x: 1, y: 3 }

// 4. Array destructuring doesn't work on non-iterables
const { 0: first4 } = [1, 2, 3]; // ✅ object destructuring on array
const [f] = { 0: 1, length: 1 }; // ❌ plain object is not iterable

// 5. Rest must be last
const { a2, ...rest, b2 } = obj; // ❌ SyntaxError — rest must be last
const [first5, ...rest2, last] = arr; // ❌ SyntaxError

// 6. Default values only trigger on undefined (not null)
const { x = 10 } = { x: null };
x; // null — default didn't trigger! null !== undefined

// 7. Renaming syntax confusion
const { name: myName } = user; // myName = user.name (NOT name = myName)
// Reading: "take 'name', put it in 'myName'"

// 8. Spread of non-iterables in array context
[...null]    // ❌ TypeError — null is not iterable
[...{}]      // ❌ TypeError — plain object is not iterable
[...new Map()] // ✅ [key, value] pairs — Map is iterable
```

## Interview Questions

**Q1: What is the difference between destructuring and spread?**
> Destructuring **extracts** values from arrays/objects into named variables at the left side of assignment. Spread **expands** an iterable or object's contents into individual elements — used on the right side (or in function calls/array/object literals). Rest (same `...` syntax) appears in function params and destructuring targets to **collect** remaining items.

**Q2: How do default values work in destructuring?**
> Default values in destructuring only apply when the extracted value is `undefined` — not `null`, not `0`, not `""`. Example: `const { x = 10 } = { x: null }` gives `x = null`, not `10`. You can use defaults for both array (`[a = 1, b = 2]`) and object (`{ name = "Anonymous" }`) destructuring.

**Q3: How does object spread differ from `Object.assign`?**
> `{ ...source }` (spread) and `Object.assign({}, source)` both do a shallow copy of own enumerable properties. Key differences: spread is an expression (can inline), `Object.assign` also sets properties via setters (spread doesn't trigger setters), and `Object.assign` returns the target while spread creates a new object literal. In practice, they're equivalent for simple merges.

**Q4: What happens when you spread an array into function arguments?**
> `fn(...arr)` is equivalent to `fn(arr[0], arr[1], arr[2], ...)`. This is the modern replacement for `fn.apply(null, arr)`. It's commonly used: `Math.max(...nums)`, `console.log(...messages)`, `new Date(...parts)`. Note: spreading into `new` requires the constructor to accept individual args.

**Q5: How do you safely destructure a potentially `null`/`undefined` value?**
> Use nullish coalescing before destructuring: `const { name } = user ?? {}`. Or give the entire destructuring a default: in function params `function fn({ x } = {}) {}`. You can also use optional chaining before accessing: `const name = user?.name`.

**Q6: What is the rest operator in destructuring used for?**
> The rest operator in destructuring collects all remaining items that haven't been extracted: `const [head, ...tail] = arr` or `const { id, ...rest } = obj`. It's useful for omitting specific properties from an object (like removing sensitive fields before sending to client), or for "peel off first item" array patterns.

**Q7: Can you destructure nested objects? What's the syntax?**
> Yes. `const { address: { city, zip } } = user` extracts `city` and `zip` from `user.address`. Note: `address` itself is not created as a variable — only `city` and `zip` are. To also capture `address`: `const { address, address: { city } } = user`. Nested destructuring with defaults: `const { address: { city = "Unknown" } = {} } = user` (the `= {}` prevents errors if `address` is undefined).
