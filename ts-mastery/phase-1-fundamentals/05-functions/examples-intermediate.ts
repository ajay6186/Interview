export {};

// ============================================================
// INTERMEDIATE EXAMPLES — Functions (50 Examples)
// ============================================================

// 1. Generic function — identity
function identity<T>(val: T): T { return val; }
const s = identity("hello"); // string
const n = identity(42);      // number

// 2. Generic function — first element
function first<T>(arr: T[]): T | undefined { return arr[0]; }

// 3. Generic function — last element
function last<T>(arr: T[]): T | undefined { return arr[arr.length - 1]; }

// 4. Generic function with constraint
function getLength<T extends { length: number }>(val: T): number { return val.length; }
getLength("hello");   // 5
getLength([1, 2, 3]); // 3

// 5. Generic function — pick property
function pluck<T extends object, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
const nameVal = pluck({ name: "Alice", age: 30 }, "name"); // string

// 6. Generic map function
function map<T, U>(arr: T[], fn: (item: T) => U): U[] {
  return arr.map(fn);
}

// 7. Generic filter function
function filter<T>(arr: T[], pred: (item: T) => boolean): T[] {
  return arr.filter(pred);
}

// 8. Generic reduce function
function reduce<T, U>(arr: T[], fn: (acc: U, item: T) => U, init: U): U {
  return arr.reduce(fn, init);
}

// 9. Generic zip function
function zip<A, B>(a: A[], b: B[]): [A, B][] {
  return a.map((item, i) => [item, b[i]] as [A, B]);
}

// 10. Overloaded function — different arg counts
function createElement(tag: string): HTMLElement;
function createElement(tag: string, text: string): HTMLElement;
function createElement(tag: string, text?: string): HTMLElement {
  const el = document.createElement(tag);
  if (text) el.textContent = text;
  return el;
}

// 11. Overloaded function — different arg types
function padValue(val: string, width: number): string;
function padValue(val: number, width: number): string;
function padValue(val: string | number, width: number): string {
  return String(val).padStart(width, "0");
}

// 12. Overloaded function — return type depends on arg
function parse(input: "true" | "false"): boolean;
function parse(input: `${number}`): number;
function parse(input: string): boolean | number;
function parse(input: string): boolean | number {
  if (input === "true" || input === "false") return input === "true";
  return Number(input);
}

// 13. Function with this parameter
function createGreeter(greeting: string) {
  return function(this: { name: string }): string {
    return `${greeting}, ${this.name}!`;
  };
}

// 14. Curried function
function add(a: number): (b: number) => number {
  return (b) => a + b;
}
const add5 = add(5);
const nine = add5(4); // 9

// 15. Partial application helper
function partial<A, B, C>(fn: (a: A, b: B) => C, a: A): (b: B) => C {
  return (b) => fn(a, b);
}
const double = partial((n: number, factor: number) => n * factor, 2);

// 16. Memoization with generic
function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    if (!cache.has(key)) cache.set(key, fn(...args));
    return cache.get(key)!;
  }) as T;
}

// 17. Once — execute function only once
function once<T extends (...args: any[]) => any>(fn: T): T {
  let called = false;
  let result: ReturnType<T>;
  return ((...args: Parameters<T>): ReturnType<T> => {
    if (!called) { called = true; result = fn(...args); }
    return result;
  }) as T;
}

// 18. Pipe — compose left to right
function pipe<A, B>(fn1: (a: A) => B): (a: A) => B;
function pipe<A, B, C>(fn1: (a: A) => B, fn2: (b: B) => C): (a: A) => C;
function pipe<A, B, C, D>(fn1: (a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D): (a: A) => D;
function pipe(...fns: Function[]): Function {
  return (input: unknown) => fns.reduce((acc, fn) => fn(acc), input);
}

// 19. Compose — compose right to left
function compose<A, B, C>(f: (b: B) => C, g: (a: A) => B): (a: A) => C {
  return (a) => f(g(a));
}

// 20. Debounce
function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// 21. Throttle
function throttle<T extends (...args: any[]) => void>(fn: T, ms: number): (...args: Parameters<T>) => void {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= ms) { last = now; fn(...args); }
  };
}

// 22. ReturnType<F> utility usage
function getUser(): { id: number; name: string } {
  return { id: 1, name: "Alice" };
}
type UserResult = ReturnType<typeof getUser>; // { id: number; name: string }

// 23. Parameters<F> utility
function connect(host: string, port: number, ssl: boolean): void {}
type ConnectArgs = Parameters<typeof connect>; // [string, number, boolean]

// 24. Awaited<Promise<T>>
async function fetchData(): Promise<{ items: string[] }> {
  return { items: ["a", "b"] };
}
type FetchReturn = Awaited<ReturnType<typeof fetchData>>; // { items: string[] }

// 25. ConstructorParameters<C>
class Server { constructor(public host: string, public port: number) {} }
type ServerParams = ConstructorParameters<typeof Server>; // [string, number]

// 26. InstanceType<C>
type ServerInstance = InstanceType<typeof Server>; // Server

// 27. Function with inferred generic from callback
function useCallback<T>(fn: () => T): T {
  return fn();
}
const val = useCallback(() => 42); // number

// 28. Typed event emitter
type EventMap = {
  data: { payload: string };
  error: { message: string };
  close: void;
};
function createEmitter<T extends Record<string, any>>() {
  const listeners: Partial<{ [K in keyof T]: Array<(data: T[K]) => void> }> = {};
  return {
    on<K extends keyof T>(event: K, fn: (data: T[K]) => void): void {
      (listeners[event] ??= []).push(fn);
    },
    emit<K extends keyof T>(event: K, data: T[K]): void {
      listeners[event]?.forEach((fn) => fn(data));
    },
  };
}

// 29. Generic swap
function swap<T, U>(pair: [T, U]): [U, T] {
  return [pair[1], pair[0]];
}
const swapped = swap(["hello", 42]); // [number, string]

// 30. Generic flatten (one level)
function flatten<T>(arr: T[][]): T[] {
  return arr.flat();
}

// 31. Generic groupBy
function groupBy<T, K extends string>(arr: T[], keyFn: (item: T) => K): Record<K, T[]> {
  const result = {} as Record<K, T[]>;
  for (const item of arr) {
    const key = keyFn(item);
    (result[key] ??= []).push(item);
  }
  return result;
}

// 32. Generic keyBy
function keyBy<T, K extends string>(arr: T[], keyFn: (item: T) => K): Record<K, T> {
  const result = {} as Record<K, T>;
  for (const item of arr) result[keyFn(item)] = item;
  return result;
}

// 33. Generic chunk array
function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

// 34. Generic deep clone (simplified)
function deepClone<T>(val: T): T {
  return JSON.parse(JSON.stringify(val));
}

// 35. Generic pick utility function
function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach((k) => { result[k] = obj[k]; });
  return result;
}

// 36. Generic omit utility function
function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((k) => { delete result[k]; });
  return result as Omit<T, K>;
}

// 37. Generic merge utility
function merge<T extends object, U extends object>(a: T, b: U): T & U {
  return { ...a, ...b } as T & U;
}

// 38. Typed assertion with generic
function ensureType<T>(val: unknown, check: (v: unknown) => v is T): T {
  if (!check(val)) throw new TypeError("Type assertion failed");
  return val;
}

// 39. Function decorator pattern (wraps function)
function withLogging<T extends (...args: any[]) => any>(
  fn: T,
  label: string
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    console.log(`[${label}] called with`, args);
    const result = fn(...args);
    console.log(`[${label}] returned`, result);
    return result;
  }) as T;
}

// 40. Retry utility function
async function retry<T>(
  fn: () => Promise<T>,
  times: number,
  delayMs = 0
): Promise<T> {
  let lastError: Error = new Error("retry failed");
  for (let i = 0; i < times; i++) {
    try { return await fn(); }
    catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastError;
}

// 41. Timeout wrapper
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms)),
  ]);
}

// 42. Generic tap (side-effect without changing value)
function tap<T>(val: T, fn: (v: T) => void): T {
  fn(val);
  return val;
}

// 43. Function returning typed record
function makeMap<K extends string, V>(keys: K[], val: V): Record<K, V> {
  const result = {} as Record<K, V>;
  keys.forEach((k) => { result[k] = val; });
  return result;
}

// 44. Generic singleton
function createSingleton<T>(factory: () => T): () => T {
  let instance: T | undefined;
  return () => instance ??= factory();
}

// 45. Function overloads — argument count variation
function createArr(): never[];
function createArr<T>(item: T): [T];
function createArr<T>(item: T, item2: T): [T, T];
function createArr<T>(...items: T[]): T[] {
  return items;
}

// 46. Type-safe event dispatcher
function dispatch<T extends Record<string, any>, K extends keyof T>(
  handlers: Partial<{ [E in K]: (payload: T[E]) => void }>,
  event: K,
  payload: T[K]
): void {
  handlers[event]?.(payload);
}

// 47. Recursive function type alias
type JsonReplacer = (key: string, value: unknown) => unknown;
const replacer: JsonReplacer = (k, v) => typeof v === "bigint" ? String(v) : v;

// 48. Function with infer-based return shaping
function transform2<T, U extends Record<keyof T, unknown>>(
  val: T,
  transformers: { [K in keyof T]: (v: T[K]) => U[K] }
): U {
  const result = {} as U;
  for (const key of Object.keys(transformers) as (keyof T)[]) {
    result[key as keyof U] = transformers[key](val[key]) as U[keyof U];
  }
  return result;
}

// 49. Self-currying via overloads
function multiply(a: number, b: number): number;
function multiply(a: number): (b: number) => number;
function multiply(a: number, b?: number): number | ((b: number) => number) {
  if (b !== undefined) return a * b;
  return (b2) => a * b2;
}

// 50. Factory function with generic constraint
function createFactory<T extends { id: number }>(
  defaults: Omit<T, "id">
): (id: number) => T {
  return (id) => ({ id, ...defaults } as T);
}
