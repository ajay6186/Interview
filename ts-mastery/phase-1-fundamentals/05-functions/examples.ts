// ============================================================================
// Examples 1.5 — Functions  (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================================

// ============================================================================
// BASIC — typed params/returns, optional/default, rest, void/never (1–13)
// ============================================================================

// 1. function with typed parameters and return
function add(a: number, b: number): number {
  return a + b;
}

// 2. arrow function with typed params
const subtract = (a: number, b: number): number => a - b;

// 3. function with string return
function greet(name: string): string {
  return `Hello, ${name}!`;
}

// 4. void return type
function printLine(msg: string): void {
  console.log(msg);
}

// 5. never — function that always throws
function fail(msg: string): never {
  throw new Error(msg);
}

// 6. optional parameter
function greetOptional(name: string, greeting?: string): string {
  return `${greeting ?? "Hello"}, ${name}!`;
}

// 7. default parameter
function greetDefault(name: string, greeting: string = "Hello"): string {
  return `${greeting}, ${name}!`;
}

// 8. rest parameters
function sum(...nums: number[]): number {
  return nums.reduce((acc, n) => acc + n, 0);
}

// 9. function type alias
type MathOp = (a: number, b: number) => number;
const multiply: MathOp = (a, b) => a * b;
const divide: MathOp = (a, b) => a / b;

// 10. function accepting a callback
function applyTwice(fn: (n: number) => number, x: number): number {
  return fn(fn(x));
}

// 11. function returning a function
function makeAdder(n: number): (x: number) => number {
  return (x) => x + n;
}

// 12. function with boolean return
function isEven(n: number): boolean {
  return n % 2 === 0;
}

// 13. function with union return
function toStringOrNumber(v: string | number): string | number {
  if (typeof v === "string") return v.length;
  return String(v);
}

// ============================================================================
// INTERMEDIATE — generics, overloads, destructured params, async (14–26)
// ============================================================================

// 14. generic identity function
function identity<T>(value: T): T {
  return value;
}

// 15. generic function with constraint
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// 16. generic array mapper
function mapArray<T, U>(arr: T[], fn: (item: T) => U): U[] {
  return arr.map(fn);
}

// 17. function overloads — 2 signatures
function format(value: string): string;
function format(value: number): string;
function format(value: string | number): string {
  return typeof value === "string" ? value.toUpperCase() : value.toFixed(2);
}

// 18. function overloads — 3 signatures
function process(value: string): number;
function process(value: number): string;
function process(value: string[], sep: string): string;
function process(value: string | number | string[], sep?: string): number | string {
  if (Array.isArray(value)) return value.join(sep);
  if (typeof value === "string") return value.length;
  return String(value);
}

// 19. object destructuring parameter
function displayUser({ name, age }: { name: string; age: number }): string {
  return `${name} (${age})`;
}

// 20. array destructuring parameter
function head([first]: number[]): number | undefined {
  return first;
}

// 21. default object parameter
function createTag(
  { tag, content }: { tag: string; content: string } = { tag: "div", content: "" }
): string {
  return `<${tag}>${content}</${tag}>`;
}

// 22. this parameter typing
interface Timer {
  delay: number;
  start(this: Timer): string;
}
const timer: Timer = { delay: 1000, start() { return `Starting in ${this.delay}ms`; } };

// 23. callback with typed index parameter
function mapWithIndex<T, U>(arr: T[], fn: (item: T, index: number) => U): U[] {
  return arr.map(fn);
}

// 24. predicate function (type guard)
function isString(v: unknown): v is string {
  return typeof v === "string";
}

// 25. async function return type
async function fetchData(url: string): Promise<string> {
  return `fetched: ${url}`;
}

// 26. function with optional callback
function forEach<T>(arr: T[], callback?: (item: T) => void): void {
  if (callback) arr.forEach(callback);
}

// ============================================================================
// NESTED — higher-order, currying, function-returning-function chains (27–38)
// ============================================================================

// 27. curried function (manual)
function curriedAdd(a: number): (b: number) => (c: number) => number {
  return (b) => (c) => a + b + c;
}

// 28. function accepting and returning a function
function compose<A, B, C>(f: (b: B) => C, g: (a: A) => B): (a: A) => C {
  return (a) => f(g(a));
}

// 29. higher-order function returning predicate
function greaterThan(threshold: number): (n: number) => boolean {
  return (n) => n > threshold;
}

// 30. function accepting array of functions
function pipeline<T>(fns: Array<(v: T) => T>, initial: T): T {
  return fns.reduce((acc, fn) => fn(acc), initial);
}

// 31. function that returns an object of functions
function createCounter(start: number = 0): {
  increment: () => number;
  decrement: () => number;
  value: () => number;
} {
  let count = start;
  return {
    increment: () => ++count,
    decrement: () => --count,
    value: () => count,
  };
}

// 32. callback returning callback
function onEvent(
  handler: (event: string) => (data: unknown) => void
): void {
  handler("click")(42);
}

// 33. generic function with multiple constraints
function merge<T extends object, U extends object>(a: T, b: U): T & U {
  return { ...a, ...b };
}

// 34. function with nested object parameter
function formatAddress(
  address: { street: { number: number; name: string }; city: string }
): string {
  return `${address.street.number} ${address.street.name}, ${address.city}`;
}

// 35. function returning deeply nested object
function buildConfig(host: string, port: number): {
  server: { host: string; port: number };
  meta: { createdAt: string };
} {
  return { server: { host, port }, meta: { createdAt: new Date().toISOString() } };
}

// 36. memoize wrapper (generic)
function memoize<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult
): (...args: TArgs) => TResult {
  const cache = new Map<string, TResult>();
  return (...args) => {
    const key = JSON.stringify(args);
    if (!cache.has(key)) cache.set(key, fn(...args));
    return cache.get(key)!;
  };
}
const memoAdd = memoize(add);

// 37. partial application
function partial<A, B, C>(fn: (a: A, b: B) => C, a: A): (b: B) => C {
  return (b) => fn(a, b);
}
const add5 = partial(add, 5);

// 38. function accepting a record of callbacks
type Handlers = { [event: string]: (data: unknown) => void };
function dispatch(event: string, data: unknown, handlers: Handlers): void {
  handlers[event]?.(data);
}

// ============================================================================
// ADVANCED — variadic tuples, conditional returns, generic overloads (39–50)
// ============================================================================

// 39. variadic tuple parameters
function zip<T extends unknown[][]>(...arrays: T): { [K in keyof T]: T[K] extends (infer U)[] ? U : never }[] {
  const len = Math.min(...arrays.map((a) => a.length));
  return Array.from({ length: len }, (_, i) =>
    arrays.map((a) => a[i])
  ) as never;
}

// 40. conditional return type
type ReturnFor<T> = T extends string ? number : string;
function transform<T extends string | number>(v: T): ReturnFor<T> {
  if (typeof v === "string") return v.length as ReturnFor<T>;
  return String(v) as ReturnFor<T>;
}

// 41. function with infer in return (utility-style)
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

// 42. generic overload — different return types per arg type
function wrap(value: string): string[];
function wrap(value: number): number[];
function wrap<T>(value: T): T[] {
  return [value];
}

// 43. function pipeline type (typed compose)
type Pipe<T, U, V> = (fn1: (a: T) => U, fn2: (a: U) => V) => (a: T) => V;
const pipe: Pipe<string, number, boolean> = (f1, f2) => (a) => f2(f1(a));
const hasDigits = pipe((s: string) => s.length, (n: number) => n > 3);

// 44. builder pattern using chained return types
function selectBuilder() {
  const fields: string[] = [];
  let cond = "";
  let lim = Infinity;
  return {
    select(...cols: string[]) { fields.push(...cols); return this; },
    where(condition: string) { cond = condition; return this; },
    limit(n: number)         { lim = n;          return this; },
    build(): string {
      return `SELECT ${fields.join(",")} WHERE ${cond} LIMIT ${lim}`;
    },
  };
}

// 45. function with rest + typed callback
function withRetry<T>(
  fn: (...args: unknown[]) => T,
  retries: number,
  onFail: (attempt: number, err: Error) => void
): (...args: unknown[]) => T {
  return (...args) => {
    let last!: Error;
    for (let i = 0; i <= retries; i++) {
      try { return fn(...args); }
      catch (e) { last = e as Error; onFail(i, last); }
    }
    throw last;
  };
}

// 46. function with generic default type param
function createList<T = string>(...items: T[]): T[] {
  return items;
}
const strList = createList("a", "b"); // T inferred as string
const numList = createList<number>(1, 2); // T explicit

// 47. function type with this binding
type EventMap = { click: MouseEvent; keydown: KeyboardEvent };
type TypedListener<K extends keyof EventMap> = (this: Element, ev: EventMap[K]) => void;

// 48. infer-based return extractor
type ReturnType2<T> = T extends (...args: unknown[]) => infer R ? R : never;
type AddReturn = ReturnType2<typeof add>; // number

// 49. function accepting mapped type
type Setters<T> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: (value: T[K]) => void;
};
function buildSetters<T extends object>(obj: T): Setters<T> {
  const result: Record<string, (v: unknown) => void> = {};
  for (const key of Object.keys(obj) as (keyof T)[]) {
    const setterKey = `set${String(key).charAt(0).toUpperCase()}${String(key).slice(1)}`;
    result[setterKey] = (value) => { (obj[key] as unknown) = value; };
  }
  return result as Setters<T>;
}

// 50. generic function for safely accessing deep path
function get<T, K1 extends keyof T>(obj: T, k1: K1): T[K1];
function get<T, K1 extends keyof T, K2 extends keyof T[K1]>(obj: T, k1: K1, k2: K2): T[K1][K2];
function get(obj: unknown, ...keys: string[]): unknown {
  return keys.reduce((acc: unknown, k) => {
    if (acc === null || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[k];
  }, obj);
}

// ============================================================================
// Runtime tests
// ============================================================================
console.assert(add(3, 4) === 7, "add");
console.assert(subtract(10, 3) === 7, "subtract");
console.assert(greet("World") === "Hello, World!", "greet");
console.assert(greetOptional("Alice") === "Hello, Alice!", "greetOptional default");
console.assert(greetOptional("Alice", "Hi") === "Hi, Alice!", "greetOptional custom");
console.assert(greetDefault("Alice") === "Hello, Alice!", "greetDefault");
console.assert(sum(1, 2, 3, 4) === 10, "sum");
console.assert(sum() === 0, "sum empty");
console.assert(multiply(3, 4) === 12, "multiply");
console.assert(divide(10, 2) === 5, "divide");
console.assert(applyTwice((x) => x + 1, 5) === 7, "applyTwice");
console.assert(makeAdder(3)(7) === 10, "makeAdder");
console.assert(isEven(4) === true, "isEven");
console.assert(identity("hello") === "hello", "identity");
console.assert(getProperty({ a: 1, b: "x" }, "b") === "x", "getProperty");
console.assert(JSON.stringify(mapArray([1, 2, 3], (n) => n * 2)) === "[2,4,6]", "mapArray");
console.assert(format("hello") === "HELLO", "format str");
console.assert(format(3.14159) === "3.14", "format num");
console.assert(process("hello") === 5, "process str");
console.assert(process(42) === "42", "process num");
console.assert(process(["a", "b", "c"], "-") === "a-b-c", "process arr");
console.assert(displayUser({ name: "Alice", age: 30 }) === "Alice (30)", "displayUser");
console.assert(head([1, 2, 3]) === 1, "head");
console.assert(createTag({ tag: "p", content: "hi" }) === "<p>hi</p>", "createTag");
console.assert(timer.start() === "Starting in 1000ms", "timer.start");
console.assert(curriedAdd(1)(2)(3) === 6, "curriedAdd");
const double = compose((n: number) => n * 2, (s: string) => s.length);
console.assert(double("hello") === 10, "compose");
const gt3 = greaterThan(3);
console.assert(gt3(4) === true, "greaterThan");
console.assert(gt3(2) === false, "greaterThan false");
const counter = createCounter(0);
console.assert(counter.increment() === 1, "counter inc");
console.assert(counter.increment() === 2, "counter inc2");
console.assert(counter.decrement() === 1, "counter dec");
console.assert(merge({ a: 1 }, { b: "x" }).b === "x", "merge");
console.assert(formatAddress({ street: { number: 42, name: "Main St" }, city: "NYC" }) === "42 Main St, NYC", "formatAddress");
console.assert(memoAdd(2, 3) === 5, "memoize");
console.assert(add5(10) === 15, "partial add5");
const pipeResult = pipeline([(n: number) => n + 1, (n) => n * 2, (n) => n - 3], 5);
console.assert(pipeResult === 9, "pipeline");
console.assert(hasDigits("hello") === false, "pipe false");
console.assert(hasDigits("hello!") === true, "pipe true");
const query = selectBuilder().select("id", "name").where("id = 1").limit(10).build();
console.assert(query === "SELECT id,name WHERE id = 1 LIMIT 10", "builder");
console.assert(JSON.stringify(wrap("x")) === '["x"]', "wrap str");
console.assert(JSON.stringify(wrap(1)) === "[1]", "wrap num");
const user = { name: "Alice", age: 30 };
console.assert(get(user, "name") === "Alice", "get k1");
console.log("Examples 1.5 — All assertions passed!");

export {};
