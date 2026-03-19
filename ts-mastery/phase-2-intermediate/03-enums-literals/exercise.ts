// ============================================================================
// Exercise 2.3 — Enums & Literal Types
// ============================================================================
// Learn enums, const enums, literal types, and const assertions.
//
// Instructions: Fill in every TODO so the file compiles and all assertions pass.
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// 1. Numeric enum
// ---------------------------------------------------------------------------

// TODO: Define an enum `Direction` with North=0, East=1, South=2, West=3

// ---------------------------------------------------------------------------
// 2. String enum
// ---------------------------------------------------------------------------

// TODO: Define a string enum `Color` with Red="RED", Green="GREEN", Blue="BLUE"

// ---------------------------------------------------------------------------
// 3. Const assertion
// ---------------------------------------------------------------------------

// TODO: Use `as const` to make this a readonly tuple of literal types
const ROLES = ["admin", "editor", "viewer"];

// TODO: Derive a union type from ROLES: "admin" | "editor" | "viewer"
type Role = any;

type TestRole = Expect<Equal<Role, "admin" | "editor" | "viewer">>;

// ---------------------------------------------------------------------------
// 4. Literal types in functions
// ---------------------------------------------------------------------------

// TODO: Implement — only accepts "asc" or "desc", returns sorted copy
function sortNumbers(arr: number[], order: "asc" | "desc"): number[] {
  // TODO: implement
  return null as any;
}

// ---------------------------------------------------------------------------
// 5. Exhaustive checking with never
// ---------------------------------------------------------------------------

type Fruit = "apple" | "banana" | "cherry";

// TODO: Implement — return the color of each fruit, use exhaustive check
function getFruitColor(fruit: Fruit): string {
  // apple → "red", banana → "yellow", cherry → "dark red"
  // Use a default case with `never` to ensure exhaustiveness
  return null as any;
}

// ---------------------------------------------------------------------------
// Runtime tests
// ---------------------------------------------------------------------------

// Uncomment after implementing enums:
/*
console.assert(Direction.North === 0, "Direction.North");
console.assert(Direction.West === 3, "Direction.West");
console.assert(Color.Red === "RED", "Color.Red");
console.assert(Color.Blue === "BLUE", "Color.Blue");
*/

console.assert(JSON.stringify(sortNumbers([3, 1, 2], "asc")) === "[1,2,3]", "sort asc");
console.assert(JSON.stringify(sortNumbers([3, 1, 2], "desc")) === "[3,2,1]", "sort desc");
console.assert(getFruitColor("apple") === "red", "apple color");
console.assert(getFruitColor("banana") === "yellow", "banana color");
console.assert(getFruitColor("cherry") === "dark red", "cherry color");

console.log("Exercise 2.3 — All assertions passed!");

export {};
