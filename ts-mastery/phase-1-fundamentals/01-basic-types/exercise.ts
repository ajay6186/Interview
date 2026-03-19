// ============================================================================
// Exercise 1.1 — Basic Types
// ============================================================================
// Learn to annotate variables with TypeScript's primitive and compound types.
//
// Instructions: Replace every `any` and fill in every TODO so the file compiles
// and all assertions pass.
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// 1. Annotate these variables with the correct types
// ---------------------------------------------------------------------------

// TODO: Replace `any` with the correct type
const userName: any = "Alice";
const userAge: any = 30;
const isActive: any = true;
const nothing: any = null;
const notDefined: any = undefined;

// Type-level tests (these should compile without errors when done)
type Test1 = Expect<Equal<typeof userName, string>>;
type Test2 = Expect<Equal<typeof userAge, number>>;

// ---------------------------------------------------------------------------
// 2. Arrays and Tuples
// ---------------------------------------------------------------------------

// TODO: Type this as an array of numbers
const scores: any = [95, 87, 73, 100];

// TODO: Type this as a tuple of [string, number, boolean]
const record: any = ["Alice", 30, true];

// TODO: Type this as a readonly array of strings
const colors: any = ["red", "green", "blue"] as const;

// Type-level tests
type Test4 = Expect<Equal<typeof scores, number[]>>;
type Test5 = Expect<Equal<typeof record, [string, number, boolean]>>;

// ---------------------------------------------------------------------------
// 3. Object types
// ---------------------------------------------------------------------------

// TODO: Define a type for this object and annotate the variable
const user: any = {
  name: "Alice",
  age: 30,
  email: "alice@example.com",
};

// ---------------------------------------------------------------------------
// 4. Function return types
// ---------------------------------------------------------------------------

// TODO: Add parameter types and return type annotation
function add(a: any, b: any): any {
  return a + b;
}

// TODO: Add the correct types
function greet(name: any): any {
  return `Hello, ${name}!`;
}

// ---------------------------------------------------------------------------
// Runtime tests
// ---------------------------------------------------------------------------
console.assert(add(2, 3) === 5, "add(2,3) should be 5");
console.assert(greet("World") === "Hello, World!", 'greet("World") failed');
console.assert(scores.length === 4, "scores should have 4 elements");
console.assert(record[0] === "Alice", "record[0] should be Alice");

console.log("Exercise 1.1 — All assertions passed!");

export {};
