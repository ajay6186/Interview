// ============================================================================
// Exercise 2.1 — Generics
// ============================================================================
// Learn to write reusable, type-safe code with generic type parameters.
//
// Instructions: Fill in every TODO so the file compiles and all assertions pass.
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// 1. Generic identity function
// ---------------------------------------------------------------------------

// TODO: Make this function generic so it preserves the input type
function identity(value: any): any {
  return value;
}

// These should preserve their types:
const str = identity("hello");    // should be string
const num = identity(42);         // should be number

// ---------------------------------------------------------------------------
// 2. Generic interface
// ---------------------------------------------------------------------------

// TODO: Define a generic interface `Box<T>` with a single property `value: T`

// const stringBox: Box<string> = { value: "hello" };
// const numberBox: Box<number> = { value: 42 };

// ---------------------------------------------------------------------------
// 3. Generic constraints
// ---------------------------------------------------------------------------

// TODO: Implement a function `getLength` that accepts any value with a `.length` property
// Hint: use `extends { length: number }`
function getLength(value: any): number {
  return value.length;
}

// ---------------------------------------------------------------------------
// 4. Generic function: first element
// ---------------------------------------------------------------------------

// TODO: Implement a generic function that returns the first element of an array
// It should return T | undefined for an array of T
function first<T>(arr: T[]): T | undefined {
  // TODO: implement
  return null as any;
}

// ---------------------------------------------------------------------------
// 5. Generic Map/Transform
// ---------------------------------------------------------------------------

// TODO: Implement a generic map function
function genericMap<T, U>(arr: T[], fn: (item: T) => U): U[] {
  // TODO: implement
  return null as any;
}

// ---------------------------------------------------------------------------
// 6. Multiple type parameters
// ---------------------------------------------------------------------------

// TODO: Implement a generic `pair` function that creates a tuple [A, B]
function pair(a: any, b: any): any {
  // TODO: make generic and implement
  return null as any;
}

// ---------------------------------------------------------------------------
// 7. Generic class
// ---------------------------------------------------------------------------

// TODO: Implement a generic Stack<T> class with:
//   - push(item: T): void
//   - pop(): T | undefined
//   - peek(): T | undefined
//   - get size(): number

// ---------------------------------------------------------------------------
// Runtime tests
// ---------------------------------------------------------------------------
console.assert(identity("hello") === "hello", "identity string");
console.assert(identity(42) === 42, "identity number");
console.assert(getLength("hello") === 5, "getLength string");
console.assert(getLength([1, 2, 3]) === 3, "getLength array");
console.assert(first([10, 20, 30]) === 10, "first");
console.assert(first([]) === undefined, "first empty");
console.assert(JSON.stringify(genericMap([1, 2, 3], (n) => n * 2)) === "[2,4,6]", "genericMap");
console.assert(JSON.stringify(genericMap(["a", "b"], (s) => s.toUpperCase())) === '["A","B"]', "genericMap strings");

console.log("Exercise 2.1 — All assertions passed!");

export {};
