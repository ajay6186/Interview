// ============================================================================
// Solution 2.3 — Enums & Literal Types
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// 1. Numeric enum
// ---------------------------------------------------------------------------

enum Direction {
  North = 0,
  East = 1,
  South = 2,
  West = 3,
}

// ---------------------------------------------------------------------------
// 2. String enum
// ---------------------------------------------------------------------------

enum Color {
  Red = "RED",
  Green = "GREEN",
  Blue = "BLUE",
}

// ---------------------------------------------------------------------------
// 3. Const assertion
// ---------------------------------------------------------------------------

const ROLES = ["admin", "editor", "viewer"] as const;

type Role = (typeof ROLES)[number];

type TestRole = Expect<Equal<Role, "admin" | "editor" | "viewer">>;

// ---------------------------------------------------------------------------
// 4. Literal types in functions
// ---------------------------------------------------------------------------

function sortNumbers(arr: number[], order: "asc" | "desc"): number[] {
  const copy = [...arr];
  return copy.sort((a, b) => (order === "asc" ? a - b : b - a));
}

// ---------------------------------------------------------------------------
// 5. Exhaustive checking with never
// ---------------------------------------------------------------------------

type Fruit = "apple" | "banana" | "cherry";

function getFruitColor(fruit: Fruit): string {
  switch (fruit) {
    case "apple":
      return "red";
    case "banana":
      return "yellow";
    case "cherry":
      return "dark red";
    default: {
      const _exhaustive: never = fruit;
      return _exhaustive;
    }
  }
}

// ---------------------------------------------------------------------------
// Runtime tests
// ---------------------------------------------------------------------------
console.assert(Direction.North === 0, "Direction.North");
console.assert(Direction.West === 3, "Direction.West");
console.assert(Color.Red === "RED", "Color.Red");
console.assert(Color.Blue === "BLUE", "Color.Blue");
console.assert(JSON.stringify(sortNumbers([3, 1, 2], "asc")) === "[1,2,3]", "sort asc");
console.assert(JSON.stringify(sortNumbers([3, 1, 2], "desc")) === "[3,2,1]", "sort desc");
console.assert(getFruitColor("apple") === "red", "apple color");
console.assert(getFruitColor("banana") === "yellow", "banana color");
console.assert(getFruitColor("cherry") === "dark red", "cherry color");

console.log("Solution 2.3 — All assertions passed!");

export {};
