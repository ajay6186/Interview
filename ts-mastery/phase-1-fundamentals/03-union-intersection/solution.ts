// ============================================================================
// Solution 1.3 — Union & Intersection Types
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// 1. Basic union types
// ---------------------------------------------------------------------------

type StringOrNumber = string | number;

const val1: StringOrNumber = "hello";
const val2: StringOrNumber = 42;

type Test1 = Expect<Equal<StringOrNumber, string | number>>;

// ---------------------------------------------------------------------------
// 2. Literal union types
// ---------------------------------------------------------------------------

type Direction = "north" | "south" | "east" | "west";
type HttpStatus = 200 | 301 | 404 | 500;

const dir: Direction = "north";
const status: HttpStatus = 200;

type Test2 = Expect<Equal<Direction, "north" | "south" | "east" | "west">>;
type Test3 = Expect<Equal<HttpStatus, 200 | 301 | 404 | 500>>;

// ---------------------------------------------------------------------------
// 3. Intersection types
// ---------------------------------------------------------------------------

type HasName = { name: string };
type HasAge = { age: number };
type HasEmail = { email: string };

type Person = HasName & HasAge & HasEmail;

const person: Person = { name: "Alice", age: 30, email: "a@b.com" };

type Test4 = Expect<Equal<Person, HasName & HasAge & HasEmail>>;

// ---------------------------------------------------------------------------
// 4. Union with common fields
// ---------------------------------------------------------------------------

type Cat = { kind: "cat"; purrs: boolean };
type Dog = { kind: "dog"; barks: boolean };

type Animal = Cat | Dog;

function getAnimalKind(animal: Animal): string {
  return animal.kind;
}

// ---------------------------------------------------------------------------
// 5. Discriminated union function
// ---------------------------------------------------------------------------

type Circle = { shape: "circle"; radius: number };
type Rectangle = { shape: "rectangle"; width: number; height: number };
type Shape = Circle | Rectangle;

function getArea(shape: Shape): number {
  switch (shape.shape) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      return shape.width * shape.height;
  }
}

// ---------------------------------------------------------------------------
// Runtime tests
// ---------------------------------------------------------------------------
console.assert(getAnimalKind({ kind: "cat", purrs: true }) === "cat", "cat kind");
console.assert(getAnimalKind({ kind: "dog", barks: true }) === "dog", "dog kind");
console.assert(Math.abs(getArea({ shape: "circle", radius: 5 }) - 78.539) < 0.01, "circle area");
console.assert(getArea({ shape: "rectangle", width: 4, height: 5 }) === 20, "rect area");

console.log("Solution 1.3 — All assertions passed!");

export {};
