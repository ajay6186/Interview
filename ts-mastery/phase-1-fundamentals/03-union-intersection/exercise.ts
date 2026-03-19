// ============================================================================
// Exercise 1.3 — Union & Intersection Types
// ============================================================================
// Learn to combine types with union (|) and intersection (&) operators.
//
// Instructions: Fill in every TODO so the file compiles and all assertions pass.
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// 1. Basic union types
// ---------------------------------------------------------------------------

// TODO: Define a type `StringOrNumber` that accepts string or number
type StringOrNumber = any;

const val1: StringOrNumber = "hello";
const val2: StringOrNumber = 42;

type Test1 = Expect<Equal<StringOrNumber, string | number>>;

// ---------------------------------------------------------------------------
// 2. Literal union types
// ---------------------------------------------------------------------------

// TODO: Define a type `Direction` that only allows "north" | "south" | "east" | "west"
type Direction = any;

// TODO: Define a type `HttpStatus` that only allows 200 | 301 | 404 | 500
type HttpStatus = any;

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

// TODO: Define `Person` as the intersection of HasName & HasAge & HasEmail
type Person = any;

const person: Person = { name: "Alice", age: 30, email: "a@b.com" };

type Test4 = Expect<Equal<Person, HasName & HasAge & HasEmail>>;

// ---------------------------------------------------------------------------
// 4. Union with common fields
// ---------------------------------------------------------------------------

type Cat = { kind: "cat"; purrs: boolean };
type Dog = { kind: "dog"; barks: boolean };

// TODO: Define `Animal` as a union of Cat | Dog
type Animal = any;

// TODO: Write a function that takes an Animal and returns its kind
function getAnimalKind(animal: any): any {
  // TODO: implement
  return animal.kind;
}

// ---------------------------------------------------------------------------
// 5. Discriminated union function
// ---------------------------------------------------------------------------

type Circle = { shape: "circle"; radius: number };
type Rectangle = { shape: "rectangle"; width: number; height: number };
type Shape = Circle | Rectangle;

// TODO: Implement this function to calculate area
function getArea(shape: Shape): number {
  // TODO: use shape.shape to discriminate and calculate area
  return 0; // replace this
}

// ---------------------------------------------------------------------------
// Runtime tests
// ---------------------------------------------------------------------------
console.assert(getAnimalKind({ kind: "cat", purrs: true }) === "cat", "cat kind");
console.assert(getAnimalKind({ kind: "dog", barks: true }) === "dog", "dog kind");
console.assert(Math.abs(getArea({ shape: "circle", radius: 5 }) - 78.539) < 0.01, "circle area");
console.assert(getArea({ shape: "rectangle", width: 4, height: 5 }) === 20, "rect area");

console.log("Exercise 1.3 — All assertions passed!");

export {};
