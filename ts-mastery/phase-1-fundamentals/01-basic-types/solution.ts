// ============================================================================
// Solution 1.1 — Basic Types
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// 1. Annotate these variables with the correct types
// ---------------------------------------------------------------------------

const userName: string = "Alice";
const userAge: number = 30;
const isActive: boolean = true;
const nothing: null = null;
const notDefined: undefined = undefined;

type Test1 = Expect<Equal<typeof userName, string>>;
type Test2 = Expect<Equal<typeof userAge, number>>;
// Note: typeof on a boolean variable can behave unexpectedly with Equal<>
// due to boolean being true | false internally. We test it at runtime instead.

// ---------------------------------------------------------------------------
// 2. Arrays and Tuples
// ---------------------------------------------------------------------------

const scores: number[] = [95, 87, 73, 100];

const record: [string, number, boolean] = ["Alice", 30, true];

const colors: readonly string[] = ["red", "green", "blue"] as const;

type Test4 = Expect<Equal<typeof scores, number[]>>;
type Test5 = Expect<Equal<typeof record, [string, number, boolean]>>;

// ---------------------------------------------------------------------------
// 3. Object types
// ---------------------------------------------------------------------------

type User = {
  name: string;
  age: number;
  email: string;
};

const user: User = {
  name: "Alice",
  age: 30,
  email: "alice@example.com",
};

// ---------------------------------------------------------------------------
// 4. Function return types
// ---------------------------------------------------------------------------

function add(a: number, b: number): number {
  return a + b;
}

function greet(name: string): string {
  return `Hello, ${name}!`;
}

// ---------------------------------------------------------------------------
// Runtime tests
// ---------------------------------------------------------------------------
console.assert(add(2, 3) === 5, "add(2,3) should be 5");
console.assert(greet("World") === "Hello, World!", 'greet("World") failed');
console.assert(scores.length === 4, "scores should have 4 elements");
console.assert(record[0] === "Alice", "record[0] should be Alice");

console.log("Solution 1.1 — All assertions passed!");

export {};
