export {};

// ============================================================
// BASIC EXAMPLES — Generics (50 Examples)
// ============================================================

// 1. Generic identity function
function identity<T>(val: T): T { return val; }
const s = identity("hello"); // string
const n = identity(42);      // number

// 2. Generic array wrapper
function wrapInArray<T>(val: T): T[] { return [val]; }
const strArr = wrapInArray("a"); // string[]

// 3. Generic first-element function
function first<T>(arr: T[]): T | undefined { return arr[0]; }

// 4. Generic last-element function
function last<T>(arr: T[]): T | undefined { return arr[arr.length - 1]; }

// 5. Generic pair
function pair<A, B>(a: A, b: B): [A, B] { return [a, b]; }
const p = pair("name", 42); // [string, number]

// 6. Generic swap
function swap<A, B>(pair: [A, B]): [B, A] { return [pair[1], pair[0]]; }
const swapped = swap([1, "a"]); // [string, number]

// 7. Generic interface
interface Box<T> {
  value: T;
  isEmpty: boolean;
}
const strBox: Box<string> = { value: "hello", isEmpty: false };
const numBox: Box<number> = { value: 0, isEmpty: true };

// 8. Generic interface with method
interface Container<T> {
  get(): T;
  set(val: T): void;
}

// 9. Generic class
class Stack<T> {
  private items: T[] = [];
  push(item: T): void { this.items.push(item); }
  pop(): T | undefined { return this.items.pop(); }
  peek(): T | undefined { return this.items[this.items.length - 1]; }
  get size(): number { return this.items.length; }
}
const numStack = new Stack<number>();
numStack.push(1); numStack.push(2);

// 10. Generic class — Queue
class Queue<T> {
  private items: T[] = [];
  enqueue(item: T): void { this.items.push(item); }
  dequeue(): T | undefined { return this.items.shift(); }
  get length(): number { return this.items.length; }
}

// 11. Generic constraint — extends object
function getKeys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

// 12. Generic constraint — extends { length: number }
function getLength<T extends { length: number }>(val: T): number {
  return val.length;
}
getLength("hello");  // 5
getLength([1, 2, 3]); // 3

// 13. Generic constraint — keyof
function pluck<T extends object, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
const name = pluck({ name: "Alice", age: 30 }, "name"); // string

// 14. Multiple type parameters
function merge<A, B>(a: A, b: B): A & B {
  return { ...a as any, ...b as any };
}
const merged = merge({ x: 1 }, { y: 2 }); // { x: number; y: number }

// 15. Generic type alias
type Nullable<T> = T | null;
const maybeStr: Nullable<string> = null;

// 16. Generic type alias — Maybe
type Maybe<T> = T | undefined;
const maybeNum: Maybe<number> = undefined;

// 17. Generic type alias — Pair
type Pair2<A, B> = { first: A; second: B };
const kv: Pair2<string, number> = { first: "score", second: 100 };

// 18. Generic function — map
function map<T, U>(arr: T[], fn: (item: T) => U): U[] {
  return arr.map(fn);
}
const lengths = map(["hello", "world"], (s) => s.length); // number[]

// 19. Generic function — filter
function filter<T>(arr: T[], pred: (item: T) => boolean): T[] {
  return arr.filter(pred);
}
const evens = filter([1, 2, 3, 4, 5], (n) => n % 2 === 0); // number[]

// 20. Generic function — reduce
function reduce<T, U>(arr: T[], fn: (acc: U, item: T) => U, init: U): U {
  return arr.reduce(fn, init);
}
const total = reduce([1, 2, 3], (acc, n) => acc + n, 0); // 6

// 21. Generic function — find
function find<T>(arr: T[], pred: (item: T) => boolean): T | undefined {
  return arr.find(pred);
}

// 22. Generic function — some/any
function some<T>(arr: T[], pred: (item: T) => boolean): boolean {
  return arr.some(pred);
}

// 23. Generic function — every/all
function every<T>(arr: T[], pred: (item: T) => boolean): boolean {
  return arr.every(pred);
}

// 24. Generic function — chunk
function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

// 25. Generic function — flatten (one level)
function flatten<T>(arr: T[][]): T[] {
  return arr.flat();
}

// 26. Generic function — unique
function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

// 27. Generic function — zip
function zip<A, B>(a: A[], b: B[]): [A, B][] {
  return a.map((item, i) => [item, b[i]] as [A, B]);
}

// 28. Generic function — groupBy
function groupBy<T>(arr: T[], fn: (item: T) => string): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const key = fn(item);
    (acc[key] ??= []).push(item);
    return acc;
  }, {});
}

// 29. Generic function — keyBy
function keyBy<T>(arr: T[], fn: (item: T) => string): Record<string, T> {
  return arr.reduce<Record<string, T>>((acc, item) => {
    acc[fn(item)] = item;
    return acc;
  }, {});
}

// 30. Generic function — partition
function partition<T>(arr: T[], pred: (item: T) => boolean): [T[], T[]] {
  const a: T[] = [], b: T[] = [];
  arr.forEach((item) => (pred(item) ? a : b).push(item));
  return [a, b];
}

// 31. Generic class — Pair
class ValuePair<A, B> {
  constructor(public readonly first: A, public readonly second: B) {}
  swap(): ValuePair<B, A> { return new ValuePair(this.second, this.first); }
  toArray(): [A, B] { return [this.first, this.second]; }
}

// 32. Generic class — Optional (Maybe monad lite)
class Optional<T> {
  private constructor(private readonly _value: T | null) {}
  static of<T>(val: T | null | undefined): Optional<T> {
    return new Optional(val ?? null);
  }
  static empty<T>(): Optional<T> { return new Optional<T>(null); }
  map<U>(fn: (v: T) => U): Optional<U> {
    return this._value === null ? Optional.empty<U>() : Optional.of(fn(this._value));
  }
  getOrElse(fallback: T): T { return this._value ?? fallback; }
  isPresent(): boolean { return this._value !== null; }
}

// 33. Generic class — LinkedList node
class ListNode<T> {
  constructor(public value: T, public next: ListNode<T> | null = null) {}
}

// 34. Generic class — BinaryTree node
class TreeNode<T> {
  constructor(
    public value: T,
    public left: TreeNode<T> | null = null,
    public right: TreeNode<T> | null = null
  ) {}
}

// 35. Generic interface with default
interface Response<T = unknown> {
  status: number;
  data: T;
}
const numRes: Response<number> = { status: 200, data: 42 };
const anyRes: Response = { status: 200, data: "anything" };

// 36. Generic type with default
type WithDefault<T = string> = { value: T };
const d1: WithDefault = { value: "hello" };       // string
const d2: WithDefault<number> = { value: 42 };    // number

// 37. Generic extends constraint — object with id
function findById<T extends { id: number }>(arr: T[], id: number): T | undefined {
  return arr.find((item) => item.id === id);
}

// 38. Generic constraint — union
function maxOf<T extends string | number>(a: T, b: T): T {
  return a > b ? a : b;
}

// 39. Generic function — pick by keys
function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach((k) => { result[k] = obj[k]; });
  return result;
}

// 40. Generic function — omit by keys
function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((k) => delete result[k]);
  return result as Omit<T, K>;
}

// 41. Generic function — defaults (Object.assign-like)
function defaults<T extends object>(target: Partial<T>, def: T): T {
  return { ...def, ...target } as T;
}

// 42. Generic infer from return — typed useRef
function useRef<T>(initial: T): { current: T } {
  return { current: initial };
}
const numRef = useRef(0); // { current: number }

// 43. Generic tuple factory
function tuple<T extends unknown[]>(...items: T): T { return items; }
const t = tuple(1, "two", true); // [number, string, boolean]

// 44. Generic function returning const
function constant<T>(val: T): () => T {
  return () => val;
}
const always42 = constant(42);

// 45. Generic function — memoize
function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    if (!cache.has(key)) cache.set(key, fn(...args));
    return cache.get(key)!;
  }) as T;
}

// 46. Generic function — tap
function tap<T>(val: T, fn: (v: T) => void): T {
  fn(val);
  return val;
}

// 47. Generic spread merge
function spread<T extends object, U extends object>(base: T, extra: U): T & U {
  return { ...base, ...extra } as T & U;
}

// 48. Generic async wrapper
async function wrapAsync<T>(fn: () => T): Promise<T> {
  return fn();
}

// 49. Generic type guard factory
function makeGuard<T>(check: (val: unknown) => boolean): (val: unknown) => val is T {
  return (val): val is T => check(val);
}
const isNumber = makeGuard<number>((v) => typeof v === "number");

// 50. Generic singleton factory
function createSingleton<T>(factory: () => T): () => T {
  let instance: T | undefined;
  return () => instance ??= factory();
}
const getDb = createSingleton(() => ({ connected: true }));
