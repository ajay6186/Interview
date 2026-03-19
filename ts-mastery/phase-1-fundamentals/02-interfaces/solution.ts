// ============================================================================
// Solution 1.2 — Interfaces
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// 1. Define a basic interface
// ---------------------------------------------------------------------------

interface Product {
  name: string;
  price: number;
  inStock: boolean;
}

const laptop: Product = { name: "Laptop", price: 999, inStock: true };
const phone: Product = { name: "Phone", price: 699, inStock: false };

// ---------------------------------------------------------------------------
// 2. Optional and readonly properties
// ---------------------------------------------------------------------------

interface Config {
  readonly host: string;
  readonly port: number;
  debug?: boolean;
}

const config: Config = { host: "localhost", port: 3000 };

// ---------------------------------------------------------------------------
// 3. Extending interfaces
// ---------------------------------------------------------------------------

interface Animal {
  name: string;
  sound: string;
}

interface Pet extends Animal {
  owner: string;
}

const myPet: Pet = { name: "Rex", sound: "Woof", owner: "Alice" };

// ---------------------------------------------------------------------------
// 4. Index signatures
// ---------------------------------------------------------------------------

interface Dictionary {
  [key: string]: string;
}

const dict: Dictionary = {};
dict["hello"] = "world";
dict["foo"] = "bar";

// ---------------------------------------------------------------------------
// 5. Interface with methods
// ---------------------------------------------------------------------------

interface Calculator {
  add(a: number, b: number): number;
  subtract(a: number, b: number): number;
}

const calc: Calculator = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
};

// ---------------------------------------------------------------------------
// Runtime tests
// ---------------------------------------------------------------------------
console.assert(laptop.price === 999, "laptop.price should be 999");
console.assert(phone.inStock === false, "phone.inStock should be false");
console.assert(config.port === 3000, "config.port should be 3000");
console.assert(myPet.owner === "Alice", "myPet.owner should be Alice");
console.assert(dict["hello"] === "world", 'dict["hello"] should be "world"');
console.assert(calc.add(2, 3) === 5, "calc.add(2,3) should be 5");
console.assert(calc.subtract(10, 4) === 6, "calc.subtract(10,4) should be 6");

console.log("Solution 1.2 — All assertions passed!");

export {};
