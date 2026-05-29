export {};

// ============================================================
// BASIC EXAMPLES — Functions (50 Examples)
// ============================================================

// 1. Function declaration with typed params and return
function add(a: number, b: number): number {
  return a + b;
}

// 2. Function returning string
function greet(name: string): string {
  return `Hello, ${name}!`;
}

// 3. Function returning boolean
function isEven(n: number): boolean {
  return n % 2 === 0;
}

// 4. Void return type
function logValue(val: unknown): void {
  console.log(val);
}

// 5. Never return type — always throws
function fail(msg: string): never {
  throw new Error(msg);
}

// 6. Optional parameter
function repeat(str: string, times?: number): string {
  return str.repeat(times ?? 1);
}

// 7. Default parameter value
function power(base: number, exp: number = 2): number {
  return Math.pow(base, exp);
}

// 8. Rest parameters
function sum(...nums: number[]): number {
  return nums.reduce((acc, n) => acc + n, 0);
}

// 9. Rest parameters with leading fixed params
function tag(label: string, ...values: number[]): string {
  return `${label}: ${values.join(", ")}`;
}

// 10. Arrow function with return type
const square = (n: number): number => n * n;

// 11. Arrow function — expression body
const double = (n: number): number => n * 2;

// 12. Arrow function — block body
const abs = (n: number): number => {
  return n < 0 ? -n : n;
};

// 13. Function type alias
type StringTransformer = (input: string) => string;
const toUpper: StringTransformer = (s) => s.toUpperCase();
const toLower: StringTransformer = (s) => s.toLowerCase();

// 14. Function as object property
const math = {
  add: (a: number, b: number): number => a + b,
  sub: (a: number, b: number): number => a - b,
};

// 15. Function with object parameter
function formatUser(user: { name: string; age: number }): string {
  return `${user.name} (${user.age})`;
}

// 16. Destructured object parameter with types
function formatCoord({ x, y }: { x: number; y: number }): string {
  return `(${x}, ${y})`;
}

// 17. Destructured array parameter
function firstAndLast([first, , last]: number[]): [number, number] {
  return [first, last];
}

// 18. Function returning array
function range(start: number, end: number): number[] {
  return Array.from({ length: end - start }, (_, i) => start + i);
}

// 19. Function returning object
function makePoint(x: number, y: number): { x: number; y: number } {
  return { x, y };
}

// 20. Callback parameter
function transform(arr: number[], fn: (n: number) => number): number[] {
  return arr.map(fn);
}

// 21. Predicate callback
function findFirst(arr: string[], pred: (s: string) => boolean): string | undefined {
  return arr.find(pred);
}

// 22. Function returning function
function multiplier(factor: number): (n: number) => number {
  return (n) => n * factor;
}
const triple = multiplier(3);

// 23. Callback with index
function mapIndexed<T, U>(arr: T[], fn: (item: T, index: number) => U): U[] {
  return arr.map(fn);
}

// 24. Higher-order function — filter
function filter<T>(arr: T[], pred: (item: T) => boolean): T[] {
  return arr.filter(pred);
}

// 25. Higher-order function — reduce
function reduce<T, U>(arr: T[], fn: (acc: U, item: T) => U, init: U): U {
  return arr.reduce(fn, init);
}

// 26. Method shorthand in object literal
const calculator = {
  value: 0,
  add(n: number): typeof calculator {
    this.value += n;
    return this;
  },
  result(): number {
    return this.value;
  },
};

// 27. Async function returning Promise
async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  return res.text();
}

// 28. Async function with error handling
async function safeFetch(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    return await res.text();
  } catch {
    return null;
  }
}

// 29. Generator function
function* counter(start: number, end: number): Generator<number> {
  for (let i = start; i <= end; i++) yield i;
}
const nums = [...counter(1, 5)]; // [1, 2, 3, 4, 5]

// 30. Typed generator
function* fibonacci(): Generator<number> {
  let [a, b] = [0, 1];
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}

// 31. Function with union parameter
function padStart(val: string | number, size: number): string {
  return String(val).padStart(size, "0");
}

// 32. Function with union return type
function divide(a: number, b: number): number | null {
  return b === 0 ? null : a / b;
}

// 33. Function accepting any (escape hatch)
function printAny(val: any): void {
  console.log(val);
}

// 34. Function accepting unknown (safer)
function printUnknown(val: unknown): void {
  console.log(String(val));
}

// 35. Function with typed this parameter (method context)
interface Counter { count: number; increment(this: Counter): void }
const counter2: Counter = {
  count: 0,
  increment() { this.count++; },
};

// 36. Immediately invoked function expression (IIFE)
const result = (function (x: number, y: number): number {
  return x + y;
})(10, 20);

// 37. Function returning void used as callback
const actions: Array<() => void> = [
  () => console.log("action 1"),
  () => console.log("action 2"),
];
actions.forEach((fn) => fn());

// 38. Function parameter with default destructure
function createUser({ name = "Anonymous", role = "user" }: { name?: string; role?: string } = {}): { name: string; role: string } {
  return { name, role };
}

// 39. Function that narrows its return
function parseNumber(s: string): number | null {
  const n = Number(s);
  return isNaN(n) ? null : n;
}

// 40. Typed setTimeout callback
function delay(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// 41. Function with overloads (declaration)
function format(val: string): string;
function format(val: number): string;
function format(val: string | number): string {
  return String(val);
}

// 42. Callback that returns void (used for side-effects)
function each<T>(arr: T[], fn: (item: T) => void): void {
  arr.forEach(fn);
}

// 43. Function composing other functions
function compose<A, B, C>(f: (b: B) => C, g: (a: A) => B): (a: A) => C {
  return (a) => f(g(a));
}
const addThenDouble = compose(double, add.bind(null, 1));

// 44. Function accepting readonly array
function sumReadonly(arr: readonly number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

// 45. Function returning readonly array
function freeze(arr: number[]): readonly number[] {
  return Object.freeze([...arr]);
}

// 46. Typed event listener callback
function addEventListener(
  event: string,
  handler: (event: { type: string; target: unknown }) => void
): void {
  // register handler
}

// 47. Function with numeric enum-like literal union param
function setLogLevel(level: "debug" | "info" | "warn" | "error"): void {
  console.log(`Log level set to: ${level}`);
}

// 48. Function with multiple return paths
function classify(n: number): "negative" | "zero" | "positive" {
  if (n < 0) return "negative";
  if (n === 0) return "zero";
  return "positive";
}

// 49. Self-referential function type (recursive)
type RecursiveFn = (depth: number) => string | RecursiveFn;
const echo: RecursiveFn = (d) => d <= 0 ? "done" : echo;

// 50. Function signature stored in variable — no body needed
declare function loadModule(name: string): Promise<unknown>;
