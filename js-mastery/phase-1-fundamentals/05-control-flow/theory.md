# Control Flow in JavaScript

## What is it?
Control flow determines the order in which statements execute. JavaScript provides conditionals (`if/else`, `switch`, ternary), loops (`for`, `while`, `do-while`, `for...of`, `for...in`), and early exit mechanisms (`break`, `continue`, `return`). Modern additions like optional chaining (`?.`) and nullish coalescing (`??`) handle common conditional patterns more elegantly.

## Key Concepts
- **Truthy/Falsy**: `if` checks truthiness, not strict boolean
- **`switch`**: uses `===` (strict equality) for case matching
- **`for...of`**: iterates over values of iterables (arrays, strings, Maps, Sets)
- **`for...in`**: iterates over enumerable keys — avoid on arrays
- **Short-circuit evaluation**: `&&` and `||` stop early when result is determined
- **Nullish coalescing (`??`)**: only triggers on `null`/`undefined`
- **Optional chaining (`?.`)**: safe property access without null checks

## Syntax / Patterns

```js
// if / else if / else
if (score >= 90) {
  grade = "A";
} else if (score >= 80) {
  grade = "B";
} else {
  grade = "F";
}

// Ternary operator (single expression)
const label = isActive ? "Active" : "Inactive";

// Nested ternary (use sparingly — hard to read)
const msg = score >= 90 ? "A" : score >= 80 ? "B" : "F";

// switch (uses === comparison)
switch (status) {
  case "pending":
    return "Waiting...";
  case "active":
  case "running":     // fall-through — both match same handler
    return "Running";
  case "done":
    return "Complete";
  default:
    return "Unknown";
}

// Classic for loop
for (let i = 0; i < arr.length; i++) {
  if (arr[i] === target) break;      // exit loop
  if (arr[i] < 0) continue;         // skip iteration
}

// for...of — iterates VALUES of any iterable
for (const item of array) { }
for (const char of "hello") { }
for (const [key, val] of map) { }
for (const [i, val] of array.entries()) { } // with index

// for...in — iterates enumerable KEYS (avoid for arrays)
for (const key in obj) {
  if (Object.hasOwn(obj, key)) { // skip inherited props
    console.log(key, obj[key]);
  }
}

// while loop
while (queue.length > 0) {
  process(queue.shift());
}

// do...while (runs at least once)
do {
  input = prompt("Enter number:");
} while (isNaN(input));

// Short-circuit patterns
const name = user && user.name;          // name if user exists
const result = value || "default";       // fallback for falsy
const safe = value ?? "default";         // fallback only for null/undefined

// Optional chaining
const city = user?.address?.city;
const len  = arr?.length;
const result2 = obj?.method?.();          // safe method call
const val = arr?.[0];                    // safe index access

// Nullish assignment
user.name ??= "Anonymous"; // only assigns if name is null/undefined
count ||= 0;               // assigns if falsy
obj.settings &&= validate(obj.settings); // assigns if truthy
```

## How It Works Internally
JavaScript evaluates conditions using the **ToBoolean** abstract operation. Falsy values are: `false`, `0`, `-0`, `0n`, `""`, `null`, `undefined`, `NaN`. Everything else is truthy.

**Short-circuit evaluation** means `&&` returns the first falsy value (or the last value if all truthy). `||` returns the first truthy value (or the last value if all falsy). `??` returns the first non-null/undefined value.

```js
// && returns first falsy or last truthy
null && "hello"   // null
"hi" && "hello"   // "hello"
0    && "hello"   // 0

// || returns first truthy or last falsy
null || "hello"   // "hello"
"hi" || "hello"   // "hi"
0    || "hello"   // "hello"

// ?? returns first non-null/undefined
null ?? "hello"   // "hello"
0    ?? "hello"   // 0    ← key difference from ||
""   ?? "hello"   // ""   ← key difference from ||
```

## Common Use Cases

```js
// Guard clause pattern (early return)
function process(user) {
  if (!user) return null;
  if (!user.isActive) return null;
  // main logic here
  return user.data;
}

// Default config with nullish coalescing
const config = {
  timeout: options.timeout ?? 5000,
  retries: options.retries ?? 3,
};

// Safe nested access
const zipCode = order?.customer?.address?.zip ?? "N/A";

// Loop with early exit (prefer find/some for arrays)
const found = arr.find(x => x.id === targetId);

// Labeled break (for nested loops)
outer: for (const row of matrix) {
  for (const cell of row) {
    if (cell === target) {
      console.log("Found!");
      break outer; // breaks both loops
    }
  }
}

// Switch with objects (often cleaner)
const handlers = {
  pending: () => "Waiting",
  active: () => "Running",
  done: () => "Complete",
};
const result = (handlers[status] ?? (() => "Unknown"))();
```

## Gotchas & Traps

```js
// 1. switch uses === — type matters
switch ("1") {
  case 1: console.log("number"); break;  // ❌ won't match
  case "1": console.log("string"); break; // ✅
}

// 2. Missing break causes fall-through
switch (x) {
  case 1:
    console.log("one");
    // no break! falls through to case 2
  case 2:
    console.log("two"); // runs for BOTH case 1 and case 2
}

// 3. for...in on arrays includes prototype props
Array.prototype.custom = "oops";
const arr = [1, 2, 3];
for (const k in arr) console.log(k); // "0", "1", "2", "custom"
// Always use for...of for arrays!

// 4. || vs ?? for default values
const port = options.port || 3000;  // ❌ 0 would use 3000 (0 is falsy!)
const port2 = options.port ?? 3000; // ✅ 0 stays 0; only null/undefined → 3000

// 5. while(true) without break → infinite loop
// 6. Off-by-one errors in for loops
for (let i = 0; i <= arr.length; i++) { // ❌ arr[arr.length] is undefined
  console.log(arr[i]);
}
for (let i = 0; i < arr.length; i++) { // ✅

// 7. Ternary returns a value — cannot use statements
const x = condition ? doSomething() : doOther(); // ✅
// Can't put if/else inside ternary — it's an expression context
```

## Interview Questions

**Q1: What values are falsy in JavaScript?**
> Exactly 8 falsy values: `false`, `0`, `-0`, `0n` (BigInt zero), `""` (empty string), `null`, `undefined`, and `NaN`. Everything else is truthy — including `[]`, `{}`, `"false"`, and `new Boolean(false)`.

**Q2: What is the difference between `for...of` and `for...in`?**
> `for...of` iterates over **values** of iterables (arrays, strings, Maps, Sets, generators). `for...in` iterates over **enumerable keys** (property names) of objects, including inherited ones from the prototype chain. Never use `for...in` on arrays — it can pick up prototype properties and returns keys as strings.

**Q3: What is short-circuit evaluation?**
> Logical operators `&&` and `||` evaluate operands left-to-right and stop as soon as the result is determined. `&&` stops at the first falsy value; `||` stops at the first truthy value. This is commonly used for conditional rendering (`isLoggedIn && <Profile />`) and default values (`value || "default"`).

**Q4: What is the difference between `||` and `??`?**
> `||` returns the right side for any **falsy** left value (`false`, `0`, `""`, `null`, `undefined`, `NaN`). `??` (nullish coalescing) returns the right side only when the left is `null` or `undefined`. Use `??` when `0` or empty string are valid values that shouldn't trigger the fallback.

**Q5: How does optional chaining (`?.`) work?**
> `obj?.prop` returns `undefined` instead of throwing `TypeError` if `obj` is `null` or `undefined`. It short-circuits — if the left side is nullish, evaluation stops and returns `undefined`. Works for: property access (`obj?.prop`), method calls (`obj?.method()`), and index access (`arr?.[0]`).

**Q6: What is a guard clause and why is it preferred?**
> A guard clause is an early `return` (or `throw`) that handles edge cases at the top of a function, allowing the main logic to be written without deep nesting. Instead of wrapping the main logic in a big `if` block, guards exit early: `if (!user) return null;`. This reduces nesting, improves readability, and is often called the "fail fast" pattern.

**Q7: How does `switch` compare to `if/else if`?**
> `switch` uses strict equality (`===`) for case matching and is best for comparing a single value against multiple constants. `if/else if` can test any boolean expression. `switch` can be more readable for many discrete cases, but missing `break` causes fall-through bugs. An alternative is an object dispatch table: `const action = handlers[type]?.() ?? defaultFn()`.
