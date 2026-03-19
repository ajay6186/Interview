// ============================================================================
// Solution 2.5 — Type Assertions & Casting
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// 1. Basic type assertion
// ---------------------------------------------------------------------------

const rawData: unknown = { name: "Alice", age: 30 };

interface PersonData {
  name: string;
  age: number;
}

const person = rawData as PersonData;

// ---------------------------------------------------------------------------
// 2. `satisfies` keyword
// ---------------------------------------------------------------------------

type ColorMap = Record<string, [number, number, number] | string>;

const palette = {
  red: [255, 0, 0],
  green: "#00ff00",
  blue: [0, 0, 255],
} satisfies ColorMap;

// ---------------------------------------------------------------------------
// 3. Non-null assertion
// ---------------------------------------------------------------------------

function getFirstChar(value: string | null): string {
  return value!.charAt(0);
}

// ---------------------------------------------------------------------------
// 4. Const assertion
// ---------------------------------------------------------------------------

const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
} as const;

type Method = (typeof HTTP_METHODS)[keyof typeof HTTP_METHODS];
type TestMethod = Expect<Equal<Method, "GET" | "POST" | "PUT" | "DELETE">>;

// ---------------------------------------------------------------------------
// 5. Type assertion function
// ---------------------------------------------------------------------------

function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== "string") {
    throw new TypeError(`Expected string, got ${typeof value}`);
  }
}

function processValue(value: unknown): string {
  assertIsString(value);
  return value.toUpperCase();
}

// ---------------------------------------------------------------------------
// Runtime tests
// ---------------------------------------------------------------------------
console.assert(person.name === "Alice", "person name");
console.assert(person.age === 30, "person age");
console.assert(getFirstChar("hello") === "h", "first char");
console.assert(processValue("hello") === "HELLO", "process string");

let threw = false;
try { processValue(42); } catch { threw = true; }
console.assert(threw, "should throw for non-string");

console.log("Solution 2.5 — All assertions passed!");

export {};
