export {};

// ============================================================
// NESTED EXAMPLES — Functions (50 Examples)
// ============================================================

// 1. Function returning function returning function (triple curry)
const addThree =
  (a: number) =>
  (b: number) =>
  (c: number): number =>
    a + b + c;
const result1 = addThree(1)(2)(3); // 6

// 2. Nested callbacks
function doAsync(
  work: (done: (err: null | Error, result: string) => void) => void
): Promise<string> {
  return new Promise((res, rej) =>
    work((err, r) => (err ? rej(err) : res(r)))
  );
}

// 3. Higher-order function returning typed HOF
function withRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  times: number
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    let lastErr: Error = new Error();
    for (let i = 0; i < times; i++) {
      try { return await fn(...args); }
      catch (e) { lastErr = e as Error; }
    }
    throw lastErr;
  }) as T;
}

// 4. Nested generic constraints
function transform<
  T extends object,
  K extends keyof T,
  V extends T[K]
>(obj: T, key: K, mapper: (val: T[K]) => V): T {
  return { ...obj, [key]: mapper(obj[key]) };
}
const updated = transform({ name: "alice", age: 30 }, "name", (n) => n.toUpperCase());

// 5. Function returning object with methods
function createCounter(initial: number = 0) {
  let count = initial;
  return {
    increment(): void { count++; },
    decrement(): void { count--; },
    reset(): void { count = initial; },
    get value(): number { return count; },
  };
}
const c = createCounter(10);
c.increment(); c.increment();
console.log(c.value); // 12

// 6. Nested typed callbacks in pipeline
type Middleware<Ctx> = (ctx: Ctx, next: () => Promise<void>) => Promise<void>;
function compose2<Ctx>(middlewares: Middleware<Ctx>[]): Middleware<Ctx> {
  return async (ctx, next) => {
    let index = -1;
    const dispatch = async (i: number): Promise<void> => {
      if (i <= index) throw new Error("next() called multiple times");
      index = i;
      const fn = i === middlewares.length ? next : middlewares[i];
      if (fn) await fn(ctx, () => dispatch(i + 1));
    };
    await dispatch(0);
  };
}

// 7. Generic function returning discriminated union
function attempt<T>(fn: () => T): { ok: true; value: T } | { ok: false; error: Error } {
  try {
    return { ok: true, value: fn() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e : new Error(String(e)) };
  }
}

// 8. Nested generic constraint — tree walker
type Tree<T> = { value: T; children: Tree<T>[] };
function walkTree<T>(tree: Tree<T>, visitor: (node: T, depth: number) => void, depth = 0): void {
  visitor(tree.value, depth);
  tree.children.forEach((child) => walkTree(child, visitor, depth + 1));
}

// 9. Function returning typed builder
function createQueryBuilder<T extends object>() {
  const conditions: string[] = [];
  const builder = {
    where(field: keyof T, value: T[keyof T]): typeof builder {
      conditions.push(`${String(field)} = ${JSON.stringify(value)}`);
      return builder;
    },
    build(): string {
      return conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    },
  };
  return builder;
}

// 10. Nested callbacks with type threading
function pipeline<A, B, C>(
  input: A,
  step1: (a: A, cb: (b: B) => void) => void,
  step2: (b: B, cb: (c: C) => void) => void,
  done: (c: C) => void
): void {
  step1(input, (b) => step2(b, done));
}

// 11. Function with complex nested return type
function parseConfig(raw: string): {
  valid: boolean;
  config: { server: { host: string; port: number }; debug: boolean } | null;
  errors: string[];
} {
  try {
    const parsed = JSON.parse(raw);
    return { valid: true, config: parsed, errors: [] };
  } catch (e) {
    return { valid: false, config: null, errors: [(e as Error).message] };
  }
}

// 12. Function with callback that returns a function
function onEach<T>(arr: T[], setup: (item: T) => () => void): void {
  const cleanups = arr.map(setup);
  // cleanups holds teardown functions
}

// 13. Nested generic function composition
function composeN<A, B, C, D>(
  f: (c: C) => D,
  g: (b: B) => C,
  h: (a: A) => B
): (a: A) => D {
  return (a) => f(g(h(a)));
}
const process = composeN(
  (n: number) => n.toFixed(2),
  (s: string) => parseInt(s, 10),
  (n: number) => String(n * 2)
);

// 14. Higher-order function returning observer
function observable<T>(initial: T) {
  let value = initial;
  const subscribers = new Set<(v: T) => void>();
  return {
    get(): T { return value; },
    set(v: T): void {
      value = v;
      subscribers.forEach((fn) => fn(v));
    },
    subscribe(fn: (v: T) => void): () => void {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
  };
}

// 15. Function with nested overloads (implementation)
function query<T>(sql: string): T[];
function query<T>(sql: string, params: unknown[]): T[];
function query<T>(sql: string, params?: unknown[]): T[] {
  console.log(sql, params);
  return [];
}

// 16. Generic function chains via builder
function builder<T extends object>(defaults: T) {
  type Builder = {
    set<K extends keyof T>(key: K, value: T[K]): Builder;
    build(): T;
  };
  const data = { ...defaults };
  const b: Builder = {
    set(k, v) { (data as any)[k] = v; return b; },
    build() { return { ...data }; },
  };
  return b;
}

// 17. Nested function capturing enclosing generic
function createPairFactory<T>() {
  return function makePair(a: T, b: T): [T, T] {
    return [a, b];
  };
}
const makeNumPair = createPairFactory<number>();
const pair = makeNumPair(1, 2);

// 18. Function returning async generator
async function* paginate<T>(
  fetchPage: (page: number) => Promise<{ items: T[]; hasNext: boolean }>
): AsyncGenerator<T> {
  let page = 1;
  while (true) {
    const { items, hasNext } = await fetchPage(page++);
    for (const item of items) yield item;
    if (!hasNext) break;
  }
}

// 19. Nested callbacks with type-safe unsubscribe
type Listener<T> = (data: T) => void;
function createEventBus<EventMap extends Record<string, unknown>>() {
  const listeners: { [K in keyof EventMap]?: Set<Listener<EventMap[K]>> } = {};
  return {
    on<K extends keyof EventMap>(event: K, fn: Listener<EventMap[K]>): () => void {
      (listeners[event] ??= new Set<Listener<EventMap[K]>>()).add(fn);
      return () => listeners[event]?.delete(fn);
    },
    emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
      listeners[event]?.forEach((fn) => fn(data));
    },
  };
}

// 20. Function with dependent types via overloads
function getDefault<T extends "string" | "number" | "boolean">(
  type: T
): T extends "string" ? string : T extends "number" ? number : boolean {
  if (type === "string") return "" as any;
  if (type === "number") return 0 as any;
  return false as any;
}
const defStr = getDefault("string"); // string
const defNum = getDefault("number"); // number

// 21. Nested destructuring in function params
function processOrder({
  id,
  customer: { name, address: { city, country } },
  items,
}: {
  id: number;
  customer: { name: string; address: { city: string; country: string } };
  items: Array<{ sku: string; qty: number }>;
}): string {
  return `Order #${id} for ${name} in ${city}, ${country}: ${items.length} items`;
}

// 22. Function that curries itself
function curriedAdd(a: number): (b: number) => (c: number) => number;
function curriedAdd(a: number, b: number): (c: number) => number;
function curriedAdd(a: number, b: number, c: number): number;
function curriedAdd(a: number, b?: number, c?: number): any {
  if (b === undefined) return (b2: number) => (c2: number) => a + b2 + c2;
  if (c === undefined) return (c2: number) => a + b + c2;
  return a + b + c;
}

// 23. Recursive HOF — flatten with depth
function flattenWith<T>(fn: (item: T) => T[], depth: number): (arr: T[]) => T[] {
  if (depth <= 0) return (arr) => arr;
  const inner = flattenWith(fn, depth - 1);
  return (arr) => arr.flatMap((item) => inner(fn(item)));
}

// 24. Continuation passing style (CPS)
function addCPS<T>(
  a: number,
  b: number,
  cont: (result: number) => T
): T {
  return cont(a + b);
}
const doubled = addCPS(3, 4, (n) => n * 2); // 14

// 25. Function with nested generics and conditional
function maybeApply<T, U>(
  val: T | null,
  fn: (v: T) => U,
  fallback: U
): U {
  return val !== null ? fn(val) : fallback;
}

// 26. Nested async callbacks
async function withTransaction<T>(
  begin: () => Promise<void>,
  work: () => Promise<T>,
  commit: () => Promise<void>,
  rollback: () => Promise<void>
): Promise<T> {
  await begin();
  try {
    const result = await work();
    await commit();
    return result;
  } catch (e) {
    await rollback();
    throw e;
  }
}

// 27. Generic function with nested constraint
function zipWith<A, B, C>(
  a: A[],
  b: B[],
  fn: (av: A, bv: B) => C
): C[] {
  return a.map((av, i) => fn(av, b[i]));
}
const sums = zipWith([1, 2, 3], [10, 20, 30], (a, b) => a + b);

// 28. Nested function type — middleware with error handler
type Handler2<Ctx> = (ctx: Ctx) => Promise<void>;
type ErrorHandler<Ctx> = (err: Error, ctx: Ctx) => Promise<void>;
function withErrorHandler<Ctx>(
  handler: Handler2<Ctx>,
  onError: ErrorHandler<Ctx>
): Handler2<Ctx> {
  return async (ctx) => {
    try { await handler(ctx); }
    catch (e) { await onError(e instanceof Error ? e : new Error(String(e)), ctx); }
  };
}

// 29. Generator that yields transformed values
function* mapGen<T, U>(
  source: Iterable<T>,
  fn: (val: T) => U
): Generator<U> {
  for (const item of source) yield fn(item);
}
const doubled2 = [...mapGen([1, 2, 3], (n) => n * 2)]; // [2, 4, 6]

// 30. Nested typed callbacks — event subscription
type Unsubscribe = () => void;
type Subscribe<T> = (handler: (event: T) => void) => Unsubscribe;
function filterSubscription<T>(
  source: Subscribe<T>,
  predicate: (event: T) => boolean
): Subscribe<T> {
  return (handler) =>
    source((event) => {
      if (predicate(event)) handler(event);
    });
}

// 31. Function that creates typed store
function createStore<State, Actions extends Record<string, (...args: any[]) => State>>(
  initial: State,
  actions: { [K in keyof Actions]: (state: State, ...args: Parameters<Actions[K]>) => State }
) {
  let state = initial;
  const listeners = new Set<(s: State) => void>();
  type Dispatch = { [K in keyof Actions]: (...args: Parameters<Actions[K]>) => void };
  const dispatch = Object.fromEntries(
    Object.entries(actions).map(([key, fn]) => [
      key,
      (...args: any[]) => {
        state = fn(state, ...args);
        listeners.forEach((l) => l(state));
      },
    ])
  ) as Dispatch;
  return { getState: () => state, dispatch, subscribe: (fn: (s: State) => void) => { listeners.add(fn); return () => listeners.delete(fn); } };
}

// 32. Function with nested function parameter constraint
function applyToAll<T extends object, K extends keyof T>(
  arr: T[],
  key: K,
  fn: T[K] extends (...args: any[]) => infer R ? () => R : never
): void {
  arr.forEach((item) => {
    if (typeof item[key] === "function") (item[key] as Function).call(item);
  });
}

// 33. Multi-level callback inversion
function asyncMap<T, U>(
  arr: T[],
  asyncFn: (item: T) => Promise<U>
): Promise<U[]> {
  return Promise.all(arr.map(asyncFn));
}

// 34. Function returning typed tuple of functions
function createPair<A, B>(
  fnA: () => A,
  fnB: () => B
): [() => A, () => B] {
  return [fnA, fnB];
}

// 35. Nested conditional types in function return
function branch<A, B, Flag extends boolean>(
  flag: Flag,
  ifTrue: () => A,
  ifFalse: () => B
): Flag extends true ? A : B {
  return (flag ? ifTrue() : ifFalse()) as Flag extends true ? A : B;
}

// 36. Nested iterator protocol
function* range2(start: number, end: number, step = 1): Generator<number> {
  for (let i = start; i < end; i += step) yield i;
}
function* map2<T, U>(iter: Iterable<T>, fn: (v: T) => U): Generator<U> {
  for (const v of iter) yield fn(v);
}
const evens = [...map2(range2(0, 10, 2), (n) => n * n)]; // [0, 4, 16, 36, 64]

// 37. Function closures with shared state
function createAccumulator(initial: number = 0) {
  let value = initial;
  return {
    add: (n: number) => { value += n; return value; },
    subtract: (n: number) => { value -= n; return value; },
    multiply: (n: number) => { value *= n; return value; },
    valueOf: () => value,
  };
}

// 38. Nested promise chaining with types
async function chain2<A, B, C>(
  start: A,
  step1: (a: A) => Promise<B>,
  step2: (b: B) => Promise<C>
): Promise<C> {
  return step2(await step1(start));
}

// 39. Bidirectional mapper
function createMapper<A, B>(
  forward: (a: A) => B,
  backward: (b: B) => A
): { to(a: A): B; from(b: B): A } {
  return { to: forward, from: backward };
}
const numStrMapper = createMapper(
  (n: number) => String(n),
  (s: string) => parseInt(s)
);

// 40. Nested generics: type-safe form builder
function formBuilder<Fields extends Record<string, unknown>>(defaults: Fields) {
  const state = { ...defaults };
  return {
    setField<K extends keyof Fields>(key: K, value: Fields[K]): void {
      state[key] = value;
    },
    getField<K extends keyof Fields>(key: K): Fields[K] {
      return state[key];
    },
    reset(): void { Object.assign(state, defaults); },
    snapshot(): Readonly<Fields> { return { ...state }; },
  };
}

// 41. Function that wraps a class method
function bindMethod<T extends object, K extends keyof T>(
  obj: T,
  key: K
): T[K] extends (...args: infer A) => infer R ? (...args: A) => R : never {
  const fn = obj[key] as Function;
  return fn.bind(obj) as any;
}

// 42. Nested async generator
async function* concatAsync<T>(
  ...sources: AsyncIterable<T>[]
): AsyncGenerator<T> {
  for (const source of sources) {
    for await (const item of source) yield item;
  }
}

// 43. Function with nested result accumulation
function accumulate<T, E>(
  operations: Array<() => T | Error>
): { successes: T[]; errors: E[] } {
  const successes: T[] = [];
  const errors: E[] = [];
  for (const op of operations) {
    const r = op();
    if (r instanceof Error) errors.push(r as any as E);
    else successes.push(r);
  }
  return { successes, errors };
}

// 44. Function with recursive return type
function createChain<T>(value: T): {
  value: T;
  then<U>(fn: (v: T) => U): ReturnType<typeof createChain<U>>;
} {
  return {
    value,
    then: (fn) => createChain(fn(value)),
  };
}
const finalVal = createChain(1).then((n) => n * 2).then((n) => `Result: ${n}`).value;

// 45. Nested observable with transformation
function transformObs<T, U>(
  obs: { subscribe(fn: (v: T) => void): () => void },
  fn: (v: T) => U
): { subscribe(fn: (v: U) => void): () => void } {
  return {
    subscribe: (handler) => obs.subscribe((v) => handler(fn(v))),
  };
}

// 46. Generic function with dependent tuple return
function partition2<T>(
  arr: T[],
  pred: (item: T) => boolean
): [T[], T[]] {
  const yes: T[] = [], no: T[] = [];
  for (const item of arr) (pred(item) ? yes : no).push(item);
  return [yes, no];
}
const [evens2, odds] = partition2([1, 2, 3, 4, 5], (n) => n % 2 === 0);

// 47. Nested map-filter-reduce pipeline
function processPipeline<T, U>(
  arr: T[],
  steps: {
    filter?: (item: T) => boolean;
    map: (item: T) => U;
    reduce: (acc: U[], item: U) => U[];
  }
): U[] {
  const filtered = steps.filter ? arr.filter(steps.filter) : arr;
  const mapped = filtered.map(steps.map);
  return mapped.reduce(steps.reduce, []);
}

// 48. Typed functional option (maybe monad)
class Maybe<T> {
  constructor(private readonly _value: T | null) {}
  static of<T>(val: T | null): Maybe<T> { return new Maybe(val); }
  map<U>(fn: (v: T) => U): Maybe<U> {
    return this._value === null ? Maybe.of<U>(null) : Maybe.of(fn(this._value));
  }
  flatMap<U>(fn: (v: T) => Maybe<U>): Maybe<U> {
    return this._value === null ? Maybe.of<U>(null) : fn(this._value);
  }
  getOrElse(fallback: T): T { return this._value ?? fallback; }
}

// 49. Async callback waterfall
async function waterfall<T>(
  initial: T,
  steps: Array<(acc: T) => Promise<T>>
): Promise<T> {
  let current = initial;
  for (const step of steps) current = await step(current);
  return current;
}

// 50. Type-safe dependency injection via functions
function inject<Deps, Result>(
  factory: (deps: Deps) => Result,
  deps: Deps
): Result {
  return factory(deps);
}
const service = inject(
  ({ baseUrl, timeout }: { baseUrl: string; timeout: number }) => ({
    fetch: (path: string) => fetch(`${baseUrl}${path}`, { signal: AbortSignal.timeout(timeout) }),
  }),
  { baseUrl: "http://api", timeout: 5000 }
);
