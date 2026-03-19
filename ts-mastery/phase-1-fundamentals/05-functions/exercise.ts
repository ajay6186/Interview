// ============================================================================
// Exercise 1.5 — Functions
// ============================================================================
// Learn function types, overloads, rest params, and callback signatures.
//
// Instructions: Fill in every TODO so the file compiles and all assertions pass.
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// 1. Function type expressions
// ---------------------------------------------------------------------------

// TODO: Define a type `MathOp` for a function (a: number, b: number) => number
type MathOp = any;

const multiply: MathOp = (a, b) => a * b;
const divide: MathOp = (a, b) => a / b;

type Test1 = Expect<Equal<MathOp, (a: number, b: number) => number>>;

// ---------------------------------------------------------------------------
// 2. Optional and default parameters
// ---------------------------------------------------------------------------

// TODO: Implement — `greeting` defaults to "Hello"
function greet(name: string, greeting?: string): string {
  // TODO: implement (use greeting or default to "Hello")
  return null as any;
}

// ---------------------------------------------------------------------------
// 3. Rest parameters
// ---------------------------------------------------------------------------

// TODO: Implement — sum all numbers using rest params
function sum(...numbers: number[]): number {
  // TODO: implement
  return null as any;
}

// ---------------------------------------------------------------------------
// 4. Callback functions
// ---------------------------------------------------------------------------

// TODO: Implement — apply a transform function to each element
function mapArray(arr: number[], transform: (n: number) => number): number[] {
  // TODO: implement without using Array.map (use a for loop)
  return null as any;
}

// ---------------------------------------------------------------------------
// 5. Function overloads
// ---------------------------------------------------------------------------

// TODO: Add overload signatures:
//   - (value: string): number       → returns string length
//   - (value: number): string       → returns number as string
//   - (value: string[], sep: string): string → returns joined string
function process(value: string): number;
function process(value: number): string;
function process(value: string[], sep: string): string;
function process(value: any, sep?: any): any {
  // TODO: implement all three overloads
  return null as any;
}

// ---------------------------------------------------------------------------
// Runtime tests
// ---------------------------------------------------------------------------
console.assert(multiply(3, 4) === 12, "multiply");
console.assert(divide(10, 2) === 5, "divide");
console.assert(greet("Alice") === "Hello, Alice!", "greet default");
console.assert(greet("Alice", "Hi") === "Hi, Alice!", "greet custom");
console.assert(sum(1, 2, 3, 4) === 10, "sum");
console.assert(sum() === 0, "sum empty");
console.assert(JSON.stringify(mapArray([1, 2, 3], (n) => n * 2)) === "[2,4,6]", "mapArray");
console.assert(process("hello") === 5, "process string");
console.assert(process(42) === "42", "process number");
console.assert(process(["a", "b", "c"], "-") === "a-b-c", "process array");

console.log("Exercise 1.5 — All assertions passed!");

export {};
