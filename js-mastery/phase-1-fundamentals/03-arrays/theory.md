# Arrays in JavaScript

## What is it?
Arrays in JavaScript are ordered, zero-indexed collections that can hold any mix of types. They are objects under the hood (`typeof [] === "object"`) with numeric keys and a `length` property. JavaScript arrays are dynamic — they can grow and shrink, and have a rich built-in API for transformation, searching, and iteration.

## Key Concepts
- **Mutable methods**: `push`, `pop`, `shift`, `unshift`, `splice`, `sort`, `reverse` — modify the original array
- **Immutable methods**: `map`, `filter`, `reduce`, `slice`, `concat`, `flat`, `flatMap` — return new arrays
- **Iteration**: `forEach`, `for...of`, `for` loop, `entries()`, `keys()`, `values()`
- **Search**: `find`, `findIndex`, `indexOf`, `includes`, `some`, `every`
- **Array.from**: converts iterables/array-likes to real arrays
- **Spread**: `[...arr]` creates a shallow copy

## Syntax / Patterns

```js
// Creation
const arr = [1, 2, 3];
const arr2 = new Array(3);          // [empty × 3]
const arr3 = Array.from({length: 3}, (_, i) => i); // [0, 1, 2]
const arr4 = Array.of(1, 2, 3);    // [1, 2, 3]

// Mutating methods (change original)
arr.push(4);          // add to end   → returns new length
arr.pop();            // remove from end → returns removed element
arr.unshift(0);       // add to start  → returns new length
arr.shift();          // remove from start → returns removed element
arr.splice(1, 2, 'a', 'b'); // splice(start, deleteCount, ...items)
arr.sort((a, b) => a - b);  // sort in place (numeric ascending)
arr.reverse();        // reverse in place

// Non-mutating methods (return new array)
const doubled = arr.map(x => x * 2);
const evens   = arr.filter(x => x % 2 === 0);
const sum     = arr.reduce((acc, x) => acc + x, 0);
const copy    = arr.slice(1, 3);   // [index 1, 2] (end exclusive)
const merged  = arr.concat([4, 5]);
const flat1   = [[1,2],[3,4]].flat();         // [1,2,3,4]
const flat2   = [1,2,3].flatMap(x => [x, x*2]); // [1,2,2,4,3,6]

// Search
arr.find(x => x > 2);         // first match value
arr.findIndex(x => x > 2);    // first match index
arr.indexOf(3);                // index of value (or -1)
arr.includes(3);               // boolean
arr.some(x => x > 5);         // true if ANY match
arr.every(x => x > 0);        // true if ALL match

// Iteration
arr.forEach((val, i) => console.log(i, val));
for (const val of arr) { /* ... */ }
for (const [i, val] of arr.entries()) { /* ... */ }

// Spread and destructuring
const [first, second, ...rest] = arr;
const copy2 = [...arr];
const combined = [...arr, ...arr2];

// Sorting strings
['banana', 'apple', 'cherry'].sort(); // alphabetical (default)
// Sorting numbers (MUST use comparator)
[10, 2, 21].sort();          // ❌ ["10", "2", "21"] — wrong!
[10, 2, 21].sort((a,b) => a - b); // ✅ [2, 10, 21]
```

## How It Works Internally
JavaScript arrays are objects with integer-indexed properties. The engine optimizes "dense" arrays (contiguous numeric keys) using actual C arrays for performance. "Sparse" arrays (with holes) fall back to hash map storage. `length` is always `max_index + 1` — it doesn't count elements, it tracks the highest index.

`sort()` uses an algorithm that is not guaranteed to be stable in older engines, but ES2019 mandates a stable sort (TimSort in V8).

`reduce()` calls `callback(accumulator, currentValue, currentIndex, array)` for each element. The accumulator starts as the `initialValue` (or the first element if no initialValue given).

## Common Use Cases

```js
// Sum of numbers
const total = [1, 2, 3, 4, 5].reduce((sum, n) => sum + n, 0); // 15

// Group by property
const grouped = users.reduce((acc, user) => {
  (acc[user.role] ??= []).push(user);
  return acc;
}, {});

// Unique values (deduplication)
const unique = [...new Set(arr)];

// Flatten deeply nested
const deep = [1, [2, [3, [4]]]].flat(Infinity); // [1, 2, 3, 4]

// Array of N items
const zeros = Array(5).fill(0);
const range = Array.from({length: 5}, (_, i) => i + 1); // [1,2,3,4,5]

// Remove item by value (non-mutating)
const without = arr.filter(x => x !== valueToRemove);

// Insert at index (non-mutating)
const inserted = [...arr.slice(0, i), newItem, ...arr.slice(i)];
```

## Gotchas & Traps

```js
// 1. sort() coerces to strings by default
[10, 2, 100].sort()           // [10, 100, 2] — wrong for numbers!
[10, 2, 100].sort((a,b) => a-b) // [2, 10, 100] ✅

// 2. splice vs slice
arr.splice(1, 2) // MUTATES original, removes 2 items at index 1
arr.slice(1, 3)  // does NOT mutate, returns items at index 1 and 2

// 3. indexOf uses strict equality — won't find NaN
[NaN].indexOf(NaN)    // -1 (broken)
[NaN].includes(NaN)   // true ✅

// 4. forEach cannot be broken with break/continue
// Use for...of, or find/some instead

// 5. Array holes behave unexpectedly
const sparse = [1, , 3]; // hole at index 1
sparse.length; // 3
sparse.map(x => x * 2); // [2, empty, 6] — skips holes!

// 6. Shallow copy — nested objects still share reference
const original = [{ x: 1 }];
const copy = [...original];
copy[0].x = 99;
original[0].x; // 99 ← they share the same object!
// For deep clone: structuredClone(original)

// 7. Array.from vs spread — Array.from handles non-iterables
Array.from({ length: 3 }, (_, i) => i); // [0, 1, 2]
[...{length: 3}]; // TypeError — plain objects aren't iterable
```

## Interview Questions

**Q1: What's the difference between `map`, `filter`, and `reduce`?**
> `map` transforms each element and returns a new array of the same length. `filter` returns a new array containing only elements that pass a test (shorter or equal length). `reduce` accumulates all elements into a single value (can be any type — number, object, array). All three return new arrays/values without mutating the original.

**Q2: What's the difference between `splice` and `slice`?**
> `splice(start, deleteCount, ...items)` modifies the original array by removing elements and optionally inserting new ones — it's destructive. `slice(start, end)` returns a shallow copy of a portion of the array without modifying the original.

**Q3: How do you remove duplicates from an array?**
> The cleanest way: `[...new Set(array)]`. A Set only stores unique values, and the spread converts it back to an array. For objects (by reference), use filter + indexOf or Map-based deduplication by a specific property.

**Q4: Why should you always pass a comparator to `.sort()`?**
> Without a comparator, `.sort()` converts elements to strings and compares their Unicode code points. This means `[10, 2, 100].sort()` gives `[10, 100, 2]` instead of `[2, 10, 100]`. Always pass `(a, b) => a - b` for ascending numeric sort.

**Q5: What is `Array.from` used for?**
> `Array.from` converts array-like objects (NodeList, arguments, strings) and iterables into real Arrays. It also accepts a mapping function as second argument: `Array.from({length: 5}, (_, i) => i)` creates `[0,1,2,3,4]`. Unlike the spread operator, it can handle array-likes that aren't iterable.

**Q6: What is the difference between `find` and `filter`?**
> `find` returns the first matching element (or `undefined`) and stops searching. `filter` iterates the entire array and returns all matching elements as a new array. Use `find` for single lookups (more efficient), `filter` for collecting all matches.

**Q7: How do you create a deep copy of an array?**
> For simple arrays: `structuredClone(arr)` (modern, handles nested objects). `JSON.parse(JSON.stringify(arr))` also works but breaks on `undefined`, functions, symbols, Dates (converts to strings), and circular references. Spread `[...arr]` and `Array.from(arr)` are only shallow copies.
