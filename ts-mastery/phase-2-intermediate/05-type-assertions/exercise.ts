// ============================================================================
// Exercise 2.5 — Type Assertions & Casting
// ============================================================================
// Learn when and how to use `as`, `satisfies`, and the `!` non-null assertion.
//
// Instructions: Fill in every TODO so the file compiles and all assertions pass.
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// 1. Basic type assertion
// ---------------------------------------------------------------------------

// Suppose we get data from an external source (typed as unknown)
const rawData: unknown = { name: "Alice", age: 30 };

// TODO: Assert rawData as the correct type to access its properties
interface PersonData {
  name: string;
  age: number;
}

// TODO: use `as` to assert the type
const person: any = rawData;

// ---------------------------------------------------------------------------
// 2. `satisfies` keyword (TS 4.9+)
// ---------------------------------------------------------------------------

type ColorMap = Record<string, [number, number, number] | string>;

// TODO: Use `satisfies` to validate this object matches ColorMap
// while preserving the literal types for autocomplete
const palette = {
  red: [255, 0, 0],
  green: "#00ff00",
  blue: [0, 0, 255],
};
// Hint: add `satisfies ColorMap` after the object

// ---------------------------------------------------------------------------
// 3. Non-null assertion
// ---------------------------------------------------------------------------

function getFirstChar(value: string | null): string {
  // TODO: Use non-null assertion (!) to tell TS that value is not null
  // In real code you'd check first, but this exercises the syntax
  return value!.charAt(0);
}

// ---------------------------------------------------------------------------
// 4. Const assertion for immutable data
// ---------------------------------------------------------------------------

// TODO: Add `as const` to make this deeply readonly with literal types
const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
};

// After adding `as const`, this type should work:
// type Method = typeof HTTP_METHODS[keyof typeof HTTP_METHODS];
// type TestMethod = Expect<Equal<Method, "GET" | "POST" | "PUT" | "DELETE">>;

// ---------------------------------------------------------------------------
// 5. Type assertion function
// ---------------------------------------------------------------------------

// TODO: Implement an assertion function that asserts a value is a string
function assertIsString(value: unknown): asserts value is string {
  // TODO: throw TypeError if not a string
}

function processValue(value: unknown): string {
  assertIsString(value);
  // After assertion, value is narrowed to string
  return value.toUpperCase();
}

// ---------------------------------------------------------------------------
// Runtime tests
// ---------------------------------------------------------------------------
console.assert((person as PersonData).name === "Alice", "person name");
console.assert((person as PersonData).age === 30, "person age");
console.assert(getFirstChar("hello") === "h", "first char");
console.assert(processValue("hello") === "HELLO", "process string");

let threw = false;
try { processValue(42); } catch { threw = true; }
console.assert(threw, "should throw for non-string");

console.log("Exercise 2.5 — All assertions passed!");

export {};
