// ============================================================================
// Solution 1.5 — Functions
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// 1. Function type expressions
// ---------------------------------------------------------------------------

type MathOp = (a: number, b: number) => number;

const multiply: MathOp = (a, b) => a * b;
const divide: MathOp = (a, b) => a / b;

type Test1 = Expect<Equal<MathOp, (a: number, b: number) => number>>;

// ---------------------------------------------------------------------------
// 2. Optional and default parameters
// ---------------------------------------------------------------------------

function greet(name: string, greeting: string = "Hello"): string {
  return `${greeting}, ${name}!`;
}

// ---------------------------------------------------------------------------
// 3. Rest parameters
// ---------------------------------------------------------------------------

function sum(...numbers: number[]): number {
  return numbers.reduce((acc, n) => acc + n, 0);
}

// ---------------------------------------------------------------------------
// 4. Callback functions
// ---------------------------------------------------------------------------

function mapArray(arr: number[], transform: (n: number) => number): number[] {
  const result: number[] = [];
  for (const item of arr) {
    result.push(transform(item));
  }
  return result;
}

// ---------------------------------------------------------------------------
// 5. Function overloads
// ---------------------------------------------------------------------------

function process(value: string): number;
function process(value: number): string;
function process(value: string[], sep: string): string;
function process(value: string | number | string[], sep?: string): number | string {
  if (Array.isArray(value)) {
    return value.join(sep);
  }
  if (typeof value === "string") {
    return value.length;
  }
  return String(value);
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

console.log("Solution 1.5 — All assertions passed!");

export {};
