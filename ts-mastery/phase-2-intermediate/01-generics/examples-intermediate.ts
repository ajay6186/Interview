export {};

// ============================================================
// INTERMEDIATE EXAMPLES — Generics (50 Examples)
// ============================================================

// 1. Generic with multiple constraints via intersection
function cloneAndLog<T extends object & { toString(): string }>(val: T): T {
  console.log(val.toString());
  return { ...val };
}

// 2. Conditional generic — different return based on input
function parseOrDefault<T>(raw: string, parse: (s: string) => T, fallback: T): T {
  try { return parse(raw); }
  catch { return fallback; }
}

// 3. Generic with infer from return
type ReturnOf<F extends (...args: any[]) => any> = F extends (...args: any[]) => infer R ? R : never;
function getUser() { return { id: 1, name: "Alice" }; }
type UserShape = ReturnOf<typeof getUser>; // { id: number; name: string }

// 4. Generic class with method inference
class Repository<T extends { id: number }> {
  private store: Map<number, T> = new Map();
  save(item: T): void { this.store.set(item.id, item); }
  findById(id: number): T | undefined { return this.store.get(id); }
  findAll(): T[] { return [...this.store.values()]; }
  delete(id: number): boolean { return this.store.delete(id); }
}
interface User { id: number; name: string; email: string }
const userRepo = new Repository<User>();
userRepo.save({ id: 1, name: "Alice", email: "a@b.com" });

// 5. Generic class with static factory
class Result<T> {
  private constructor(private readonly val: T | Error) {}
  static ok<T>(val: T): Result<T> { return new Result(val); }
  static fail<T>(err: Error): Result<T> { return new Result<T>(err); }
  isOk(): this is Result<T> & { val: T } { return !(this.val instanceof Error); }
  getOrThrow(): T {
    if (this.val instanceof Error) throw this.val;
    return this.val;
  }
  map<U>(fn: (v: T) => U): Result<U> {
    if (this.val instanceof Error) return Result.fail<U>(this.val);
    return Result.ok(fn(this.val as T));
  }
}

// 6. Generic class that extends another generic
class SortedArray<T> extends Array<T> {
  constructor(private compare: (a: T, b: T) => number, ...items: T[]) {
    super(...items.sort(compare));
  }
  insert(item: T): void {
    const index = this.findIndex((el) => this.compare(item, el) < 0);
    this.splice(index === -1 ? this.length : index, 0, item);
  }
}

// 7. Generic interface extending another
interface Readable<T> { read(): T }
interface Writable<T> { write(val: T): void }
interface ReadWritable<T> extends Readable<T>, Writable<T> {
  readAll(): T[];
}

// 8. Generic with default and constraint
interface Cache<T = string, K extends string = string> {
  get(key: K): T | undefined;
  set(key: K, val: T, ttl?: number): void;
  delete(key: K): void;
}

// 9. Generic mapped type from class keys
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};
interface Profile { name: string; age: number }
type ProfileGetters = Getters<Profile>;
// { getName: () => string; getAge: () => number }

// 10. Generic mapped type — setters
type Setters<T> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: (val: T[K]) => void;
};
type ProfileSetters = Setters<Profile>;

// 11. Generic conditional — unwrap Promise
type Awaited2<T> = T extends Promise<infer U> ? Awaited2<U> : T;
type Unwrapped = Awaited2<Promise<Promise<string>>>; // string

// 12. Generic conditional — extract array element
type ElementOf<T> = T extends (infer E)[] ? E : never;
type StrEl = ElementOf<string[]>; // string

// 13. Generic conditional — function return extraction
type FnReturn<F> = F extends (...args: any[]) => infer R ? R : never;
type NumFnReturn = FnReturn<() => number>; // number

// 14. Generic — infer first tuple element
type Head<T extends unknown[]> = T extends [infer H, ...unknown[]] ? H : never;
type First = Head<[string, number, boolean]>; // string

// 15. Generic — infer tail of tuple
type Tail<T extends unknown[]> = T extends [unknown, ...infer R] ? R : never;
type Rest = Tail<[string, number, boolean]>; // [number, boolean]

// 16. Generic — builder with type state
class TypedBuilder<State extends object> {
  constructor(private state: State) {}
  with<K extends string, V>(key: K, val: V): TypedBuilder<State & Record<K, V>> {
    return new TypedBuilder({ ...this.state, [key]: val } as State & Record<K, V>);
  }
  build(): State { return { ...this.state }; }
}
const built = new TypedBuilder({})
  .with("name", "Alice")
  .with("age", 30)
  .build(); // { name: string; age: number }

// 17. Generic recursive type — deep partial
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

// 18. Generic recursive type — deep readonly
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

// 19. Generic recursive type — deep required
type DeepRequired<T> = {
  [K in keyof T]-?: T[K] extends object ? DeepRequired<T[K]> : T[K];
};

// 20. Generic with variadics — concat
type Concat<A extends unknown[], B extends unknown[]> = [...A, ...B];
type AB = Concat<[string, number], [boolean, null]>;
const ab: AB = ["hello", 42, true, null];

// 21. Generic variadic — prepend
type Prepend<T, Arr extends unknown[]> = [T, ...Arr];
type WithStr = Prepend<string, [number, boolean]>; // [string, number, boolean]

// 22. Generic variadic — append
type Append<Arr extends unknown[], T> = [...Arr, T];
type WithBool = Append<[string, number], boolean>; // [string, number, boolean]

// 23. Generic — tuple length as number literal
type TupleLength<T extends unknown[]> = T["length"];
type Len3 = TupleLength<[1, 2, 3]>; // 3

// 24. Generic type guard with constraint
function isInstanceOf<T>(constructor: new (...args: any[]) => T): (val: unknown) => val is T {
  return (val): val is T => val instanceof constructor;
}
const isDate = isInstanceOf(Date);
const isError = isInstanceOf(Error);

// 25. Generic class — typed event emitter
class EventEmitter<Events extends Record<string, unknown>> {
  private listeners: { [K in keyof Events]?: Array<(data: Events[K]) => void> } = {};
  on<K extends keyof Events>(event: K, fn: (data: Events[K]) => void): this {
    (this.listeners[event] ??= []).push(fn);
    return this;
  }
  emit<K extends keyof Events>(event: K, data: Events[K]): this {
    this.listeners[event]?.forEach((fn) => fn(data));
    return this;
  }
  off<K extends keyof Events>(event: K, fn: (data: Events[K]) => void): this {
    this.listeners[event] = this.listeners[event]?.filter((l) => l !== fn);
    return this;
  }
}

// 26. Generic — typed fetch with schema
async function fetchTyped<T>(url: string, validate: (data: unknown) => T): Promise<T> {
  const res = await fetch(url);
  return validate(await res.json());
}

// 27. Generic — observer pattern
function createObservable<T>(initial: T) {
  let value = initial;
  const subs = new Set<(v: T) => void>();
  return {
    get(): T { return value; },
    set(v: T): void { value = v; subs.forEach((fn) => fn(v)); },
    subscribe(fn: (v: T) => void): () => void {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}

// 28. Generic — lazy singleton
function lazy<T>(factory: () => T): () => T {
  let cached: { value: T } | undefined;
  return () => (cached ??= { value: factory() }).value;
}

// 29. Generic — typed Map wrapper
class TypedMap<K, V> {
  private map = new Map<K, V>();
  set(key: K, value: V): this { this.map.set(key, value); return this; }
  get(key: K): V | undefined { return this.map.get(key); }
  has(key: K): boolean { return this.map.has(key); }
  getOrDefault(key: K, def: V): V { return this.map.get(key) ?? def; }
  entries(): [K, V][] { return [...this.map.entries()]; }
}

// 30. Generic — typed Set wrapper
class TypedSet<T> {
  private set = new Set<T>();
  add(val: T): this { this.set.add(val); return this; }
  has(val: T): boolean { return this.set.has(val); }
  toArray(): T[] { return [...this.set]; }
  union(other: TypedSet<T>): TypedSet<T> {
    return other.toArray().reduce((s, v) => s.add(v), this);
  }
}

// 31. Generic infer — constructor params
type CtorParams<T extends new (...args: any[]) => any> =
  T extends new (...args: infer P) => any ? P : never;
class Db { constructor(public host: string, public port: number) {} }
type DbParams = CtorParams<typeof Db>; // [string, number]

// 32. Generic infer — instance type from constructor
type InstanceOf<T extends new (...args: any[]) => any> =
  T extends new (...args: any[]) => infer I ? I : never;
type DbInstance = InstanceOf<typeof Db>; // Db

// 33. Generic — record factory
function makeRecord<K extends string, V>(keys: K[], makeVal: (k: K) => V): Record<K, V> {
  return keys.reduce<Record<K, V>>((acc, k) => { acc[k] = makeVal(k); return acc; }, {} as Record<K, V>);
}
const weights = makeRecord(["a", "b", "c"], (k) => k.charCodeAt(0));

// 34. Generic — deep merge
function deepMerge<T extends object, U extends object>(a: T, b: U): T & U {
  const result: any = { ...a };
  for (const [k, v] of Object.entries(b)) {
    if (typeof v === "object" && v !== null && typeof result[k] === "object") {
      result[k] = deepMerge(result[k], v);
    } else {
      result[k] = v;
    }
  }
  return result;
}

// 35. Generic — typed environment config
function getEnv<T extends Record<string, string>>(
  schema: T
): { [K in keyof T]: string } {
  return Object.fromEntries(
    Object.keys(schema).map((k) => [k, process.env[k] ?? schema[k as keyof T]])
  ) as { [K in keyof T]: string };
}

// 36. Generic with constraint on method return
function createChain<T extends object>(initial: T) {
  const state = { ...initial };
  const chain = new Proxy(state, {
    get(target: any, prop: string) {
      if (prop === "value") return target;
      return (fn: (v: any) => any) => {
        target[prop] = fn(target[prop]);
        return chain;
      };
    },
  });
  return chain as T & { value: T };
}

// 37. Generic — typed validation schema
type Validator<T> = (val: unknown) => val is T;
function createSchema<T>(fields: { [K in keyof T]: Validator<T[K]> }): Validator<T> {
  return (val): val is T => {
    if (typeof val !== "object" || val === null) return false;
    return (Object.keys(fields) as (keyof T)[]).every(
      (k) => fields[k]((val as any)[k])
    );
  };
}

// 38. Generic — typed reducer with discriminated actions
type Reducer2<S, A extends { type: string }> = (state: S, action: A) => S;
function combineReducers<State extends Record<string, unknown>>(
  reducers: { [K in keyof State]: Reducer2<State[K], any> }
): Reducer2<State, any> {
  return (state, action) =>
    Object.fromEntries(
      Object.entries(reducers).map(([k, r]) => [k, r(state[k as keyof State], action)])
    ) as State;
}

// 39. Generic — immutable update helper
function update<T extends object, K extends keyof T>(obj: T, key: K, val: T[K]): T {
  return { ...obj, [key]: val };
}
const user = { name: "Alice", age: 30 };
const updated = update(user, "age", 31); // { name: string; age: number }

// 40. Generic — typed middleware chain
type Next = () => Promise<void>;
type Middleware2<Ctx> = (ctx: Ctx, next: Next) => Promise<void>;
function createMiddlewareChain<Ctx>() {
  const stack: Middleware2<Ctx>[] = [];
  return {
    use(mw: Middleware2<Ctx>): void { stack.push(mw); },
    async run(ctx: Ctx): Promise<void> {
      let index = 0;
      const next: Next = async () => {
        const fn = stack[index++];
        if (fn) await fn(ctx, next);
      };
      await next();
    },
  };
}

// 41. Generic — function transformer
type Transform<F extends (...args: any[]) => any, R> =
  (...args: Parameters<F>) => R;
function transformReturn<F extends (...args: any[]) => any, R>(
  fn: F,
  transformer: (result: ReturnType<F>) => R
): Transform<F, R> {
  return (...args) => transformer(fn(...args));
}

// 42. Generic — typed paginator
interface Page<T> { items: T[]; page: number; perPage: number; total: number }
function paginate<T>(arr: T[], page: number, perPage: number): Page<T> {
  const start = (page - 1) * perPage;
  return { items: arr.slice(start, start + perPage), page, perPage, total: arr.length };
}

// 43. Generic — type-safe interpolation
function interpolate<T extends Record<string, string | number>>(
  template: string,
  vars: T
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key as keyof T] ?? ""));
}
const msg = interpolate("Hello {name}, you are {age}!", { name: "Alice", age: 30 });

// 44. Generic — typed filter map (filter + transform)
function filterMap<T, U>(arr: T[], fn: (item: T) => U | null | undefined): U[] {
  const result: U[] = [];
  for (const item of arr) {
    const val = fn(item);
    if (val != null) result.push(val);
  }
  return result;
}

// 45. Generic — typed retry
async function retryTyped<T>(
  fn: () => Promise<T>,
  attempts: number,
  shouldRetry: (err: Error) => boolean = () => true
): Promise<T> {
  let last: Error = new Error();
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); }
    catch (e) {
      last = e instanceof Error ? e : new Error(String(e));
      if (!shouldRetry(last)) break;
    }
  }
  throw last;
}

// 46. Generic — typed value transformer chain
class Chain2<T> {
  constructor(private val: T) {}
  map<U>(fn: (v: T) => U): Chain2<U> { return new Chain2(fn(this.val)); }
  tap(fn: (v: T) => void): Chain2<T> { fn(this.val); return this; }
  value(): T { return this.val; }
}
const result = new Chain2(1)
  .map((n) => n * 2)
  .map((n) => `Result: ${n}`)
  .value(); // "Result: 2"

// 47. Generic — typed deepFreeze
function deepFreeze<T extends object>(obj: T): Readonly<T> {
  Object.getOwnPropertyNames(obj).forEach((k) => {
    const val = (obj as any)[k];
    if (typeof val === "object" && val !== null) deepFreeze(val);
  });
  return Object.freeze(obj);
}

// 48. Generic — typed diff
function diff<T extends Record<string, unknown>>(
  a: T,
  b: Partial<T>
): Partial<T> {
  const changes: Partial<T> = {};
  for (const key of Object.keys(b) as (keyof T)[]) {
    if (a[key] !== b[key]) changes[key] = b[key];
  }
  return changes;
}

// 49. Generic — typed tree node with depth
interface DeepTree<T> {
  value: T;
  depth: number;
  children: DeepTree<T>[];
}
function buildTree<T>(value: T, depth = 0): DeepTree<T> {
  return { value, depth, children: [] };
}

// 50. Generic — typed index accessor
function getAt<T extends unknown[], I extends number>(
  arr: T,
  index: I
): T[I] {
  return arr[index] as T[I];
}
const triple = tuple(1, "two", true);
const first2 = getAt(triple, 0); // number
const second2 = getAt(triple, 1); // string

function tuple<T extends unknown[]>(...items: T): T { return items; }
