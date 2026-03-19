// ============================================================================
// Exercise 2.2 — Classes
// ============================================================================
// Learn TypeScript class features: access modifiers, abstract classes,
// implements, and parameter properties.
//
// Instructions: Fill in every TODO so the file compiles and all assertions pass.
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// 1. Basic class with access modifiers
// ---------------------------------------------------------------------------

// TODO: Implement a `BankAccount` class with:
//   - private `balance` property (number, starts at 0)
//   - public `owner` (string, set via constructor)
//   - deposit(amount: number): void
//   - withdraw(amount: number): boolean (false if insufficient funds)
//   - getBalance(): number

// ---------------------------------------------------------------------------
// 2. Interface implementation
// ---------------------------------------------------------------------------

interface Serializable {
  serialize(): string;
  deserialize(data: string): void;
}

// TODO: Implement a `UserProfile` class that implements Serializable
// Properties: name (string), age (number)
// serialize() returns JSON string of { name, age }
// deserialize(data) parses JSON and updates name and age

// ---------------------------------------------------------------------------
// 3. Abstract class
// ---------------------------------------------------------------------------

// TODO: Create an abstract class `Shape` with:
//   - abstract getArea(): number
//   - abstract getPerimeter(): number
//   - describe(): string  →  returns "Area: X, Perimeter: Y"

// TODO: Implement `CircleShape` extending Shape (takes radius in constructor)
// TODO: Implement `RectangleShape` extending Shape (takes width, height)

// ---------------------------------------------------------------------------
// 4. Parameter properties (shorthand)
// ---------------------------------------------------------------------------

// TODO: Implement using parameter properties (shorthand constructor syntax)
// class Point { constructor(public readonly x: number, ...) }
// Methods: distanceTo(other: Point): number

// ---------------------------------------------------------------------------
// Runtime tests
// ---------------------------------------------------------------------------

// Uncomment these after implementing:
/*
const account = new BankAccount("Alice");
account.deposit(100);
console.assert(account.getBalance() === 100, "balance after deposit");
console.assert(account.withdraw(30) === true, "withdraw 30");
console.assert(account.getBalance() === 70, "balance after withdraw");
console.assert(account.withdraw(100) === false, "withdraw too much");
console.assert(account.getBalance() === 70, "balance unchanged");

const profile = new UserProfile("Alice", 30);
const serialized = profile.serialize();
console.assert(serialized === '{"name":"Alice","age":30}', "serialize");
profile.deserialize('{"name":"Bob","age":25}');
console.assert(profile.name === "Bob", "deserialize name");

const circle = new CircleShape(5);
console.assert(Math.abs(circle.getArea() - 78.539) < 0.01, "circle area");
const rect = new RectangleShape(4, 5);
console.assert(rect.getArea() === 20, "rect area");
console.assert(rect.getPerimeter() === 18, "rect perimeter");

const p1 = new Point(0, 0);
const p2 = new Point(3, 4);
console.assert(p1.distanceTo(p2) === 5, "distance");
*/

console.log("Exercise 2.2 — All assertions passed!");

export {};
