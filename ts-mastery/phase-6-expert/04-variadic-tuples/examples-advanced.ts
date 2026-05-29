export {};

// ============================================================
// Phase 6 – Expert: Variadic Tuples — ADVANCED (1–50)
// ============================================================

// Core helpers
type Head<T extends unknown[]> = T extends [infer H, ...infer _] ? H : never;
type Tail<T extends unknown[]> = T extends [infer _, ...infer R] ? R : never;
type Last<T extends unknown[]> = T extends [...infer _, infer L] ? L : never;
type Init<T extends unknown[]> = T extends [...infer I, infer _] ? I : never;
type Concat<A extends unknown[], B extends unknown[]> = [...A, ...B];
type Reverse<T extends unknown[], Acc extends unknown[] = []> =
  T extends [infer H, ...infer R] ? Reverse<R, [H, ...Acc]> : Acc;
type BuildTuple<N extends number, T extends unknown[] = []> =
  T["length"] extends N ? T : BuildTuple<N, [...T, unknown]>;
type Add<A extends number, B extends number> = [...BuildTuple<A>, ...BuildTuple<B>]["length"] & number;
type Includes<T extends unknown[], V> =
  T extends [infer H, ...infer R]
    ? [H] extends [V] ? [V] extends [H] ? true : Includes<R, V> : Includes<R, V> : false;

// --- 1. Type-level function composition with full type inference ---
type ComposeResult<Fns extends ((...args: unknown[]) => unknown)[]> =
  Fns extends [] ? never :
  Fns extends [infer Last extends (...args: unknown[]) => infer R] ? R :
  Fns extends [...infer Rest extends ((...args: unknown[]) => unknown)[], infer Last extends (...args: unknown[]) => infer R] ? R : never;
type ComposeInput<Fns extends ((...args: unknown[]) => unknown)[]> =
  Fns extends [infer First extends (...args: infer P) => unknown, ...infer _] ? P : never;
declare function compose<Fns extends ((...args: unknown[]) => unknown)[]>(
  ...fns: Fns
): (...args: ComposeInput<Fns>) => ComposeResult<Fns>;

// --- 2. Variadic intersect (merge multiple objects) ---
type Intersect<T extends object[]> =
  T extends [infer H extends object, ...infer Rest extends object[]]
    ? H & Intersect<Rest>
    : {};
type A2 = Intersect<[{ a: 1 }, { b: 2 }, { c: 3 }]>; // {a:1; b:2; c:3}

// --- 3. Variadic union ---
type Union<T extends unknown[]> = T[number];
type A3 = Union<[1, "a", true]>; // 1 | "a" | true

// --- 4. Tuple HKT (higher-kinded type simulation) ---
type Apply<F extends { [K: string]: unknown }, Arg> = F extends { hkt: infer R } ? R : never;
interface MaybeHKT<T> { hkt: T | null }
type LiftMaybe<T extends unknown[]> = { [K in keyof T]: T[K] | null };
type A4 = LiftMaybe<[number, string, boolean]>; // [number|null, string|null, boolean|null]

// --- 5. Tuple functor ---
type FMap<T extends unknown[], F extends (x: unknown) => unknown> = {
  [K in keyof T]: F extends (x: T[K]) => infer R ? R : never
};
type StringifyAll<T extends unknown[]> = FMap<T, (x: unknown) => string>;
type A5 = StringifyAll<[1, true, null]>; // [string, string, string]

// --- 6. Tuple applicative ---
type TupleAp<Fs extends ((x: unknown) => unknown)[], T extends unknown[]> = {
  [K in keyof Fs]: Fs[K] extends (x: T[K & number]) => infer R ? R : never
};

// --- 7. Tuple monad (flatMap) ---
type TupleBind<T extends unknown[], F extends { [K in keyof T]: (x: T[K]) => unknown[] }> = {
  [K in keyof T]: F[K] extends (x: T[K]) => infer R extends unknown[] ? R[number] : never
}[number][];

// --- 8. Variadic overloads for N-ary function ---
function zipWith<A, B, R>(fn: (a: A, b: B) => R, a: [A], b: [B]): [R];
function zipWith<A, B, C, R>(fn: (a: A, b: B) => R, a: [A, C], b: [B, C]): [R, R];
function zipWith<A, B, R>(fn: (a: A, b: B) => R, a: A[], b: B[]): R[] {
  return a.map((v, i) => fn(v, b[i]));
}
const A8 = zipWith((a: number, b: number) => a + b, [1, 2], [3, 4]); // [4, 6]

// --- 9. Variadic mixin ---
type Mixin<T extends object[]> = Intersect<T>;
function mixin<T extends object[]>(...objs: T): Mixin<T> {
  return Object.assign({}, ...objs) as Mixin<T>;
}
const A9 = mixin({ a: 1 }, { b: "hello" }, { c: true });
type A9_T = typeof A9; // {a:number; b:string; c:boolean}

// --- 10. Type-safe apply with arity check ---
type ArityOf<F extends (...args: unknown[]) => unknown> = Parameters<F>["length"];
type CanApply<F extends (...args: unknown[]) => unknown, Args extends unknown[]> =
  ArityOf<F> extends Args["length"] ? true : false;
function safeApply<F extends (...args: unknown[]) => unknown>(
  fn: F,
  args: Parameters<F>
): ReturnType<F> {
  return fn(...args) as ReturnType<F>;
}
const A10_r = safeApply(Math.max, [1, 2, 3]); // number

// --- 11. Variadic type validator ---
type ValidateTuple<T extends unknown[], Schema extends { [K in keyof T]: (v: T[K]) => boolean }> = T;
function validateTuple<T extends unknown[]>(
  value: T,
  ...validators: { [K in keyof T]: (v: T[K]) => boolean }
): boolean {
  return validators.every((v, i) => v(value[i]));
}
const A11 = validateTuple(
  [1, "hello", true] as [number, string, boolean],
  (v: number) => v > 0,
  (v: string) => v.length > 0,
  (v: boolean) => v === true
);

// --- 12. Typed product type from tuples ---
type TupleProduct<A extends unknown[], B extends unknown[], Acc extends unknown[] = []> =
  A extends [infer HA, ...infer RA]
    ? TupleProduct<RA, B, [...Acc, ...{ [K in keyof B]: [HA, B[K]] }]>
    : Acc;
type A12 = TupleProduct<[1, 2], ["a", "b"]>;
// [[1,"a"],[1,"b"],[2,"a"],[2,"b"]]

// --- 13. Tuple-based type-safe routing ---
type Route<Path extends string, Params extends Record<string, unknown> = {}, Body = void, Result = void> = {
  path: Path;
  params: Params;
  body: Body;
  result: Result;
};
type RouteRegistry = [
  Route<"/users", {}, void, { id: number; name: string }[]>,
  Route<"/users/:id", { id: string }, void, { id: number; name: string }>,
  Route<"/users/:id/posts", { id: string }, void, { id: number; title: string }[]>,
];
type FindRoute<R extends Route<string, {}, unknown, unknown>[], Path extends string> =
  R extends [infer H extends Route<string, {}, unknown, unknown>, ...infer Rest extends Route<string, {}, unknown, unknown>[]]
    ? H["path"] extends Path ? H : FindRoute<Rest, Path>
    : never;
type A13 = FindRoute<RouteRegistry, "/users/:id">["result"]; // {id:number;name:string}

// --- 14. Variadic function decorators ---
type Decorator<F extends (...args: unknown[]) => unknown> = (fn: F) => F;
function withLog<F extends (...args: unknown[]) => unknown>(fn: F): F {
  return ((...args: Parameters<F>) => {
    console.log("call:", fn.name, args);
    return fn(...args);
  }) as F;
}
function withTiming<F extends (...args: unknown[]) => unknown>(fn: F): F {
  return ((...args: Parameters<F>) => {
    const start = Date.now();
    const result = fn(...args);
    console.log(`${fn.name}: ${Date.now() - start}ms`);
    return result;
  }) as F;
}
function applyDecorators<F extends (...args: unknown[]) => unknown>(
  fn: F,
  ...decorators: Decorator<F>[]
): F {
  return decorators.reduceRight((f, d) => d(f), fn);
}
const A14_fn = applyDecorators(
  (a: number, b: number) => a + b,
  withLog,
  withTiming
);

// --- 15. Type-level tuple evaluation ---
type EvalOps<T extends (number | string)[]> =
  T extends [infer A extends number, "+", infer B extends number, ...infer Rest]
    ? EvalOps<[Add<A, B>, ...Rest extends (number | string)[] ? Rest : []]>
    : T extends [infer R] ? R : never;
type A15 = EvalOps<[1, "+", 2, "+", 3]>; // 6

// --- 16. Dependent tuple types ---
type Range<Lo extends number, Hi extends number, Acc extends number[] = []> =
  Acc["length"] extends Hi ? Acc : Range<Lo, Hi, [...Acc, Acc["length"]]>;
type RangeTuple<Lo extends number, Hi extends number> = {
  [K in Range<Lo, Hi>[number]]: K
};
type A16 = Range<0, 5>; // [0, 1, 2, 3, 4]

// --- 17. Typed tuple pattern matching ---
type Match<T extends unknown[], Patterns extends unknown[][]> =
  Patterns extends [infer P extends unknown[], ...infer RestP extends unknown[][]]
    ? T extends P ? P : Match<T, RestP>
    : never;
type A17 = Match<[1, string], [[number, string], [string, number], [boolean, boolean]]>;
// [number, string]

// --- 18. Variadic tuple merge-sort ---
type Merge<A extends number[], B extends number[]> =
  A extends [] ? B : B extends [] ? A :
  A extends [infer HA extends number, ...infer RA extends number[]]
    ? B extends [infer HB extends number, ...infer RB extends number[]]
      ? HA extends HB ? [HA, ...Merge<RA, B>]
        : A18_LTE<HA, HB> extends true ? [HA, ...Merge<RA, B>] : [HB, ...Merge<A, RB>]
      : A
    : B;
type A18_LTE<A extends number, B extends number> =
  BuildTuple<A> extends [...BuildTuple<B>, ...infer _] ? false : true;
type MergeSort<T extends number[]> =
  T["length"] extends 0 | 1 ? T :
  Merge<MergeSort<A18_First<T>>, MergeSort<A18_Second<T>>>;
type A18_First<T extends number[]> = T extends [infer H extends number, ...infer R extends number[]] ? [H, ...A18_Second<R>] : [];
type A18_Second<T extends number[]> = T extends [infer _ extends number, ...infer R extends number[]] ? A18_First<R> : [];
type A18 = MergeSort<[3, 1, 4, 1, 5, 9, 2, 6]>; // [1, 1, 2, 3, 4, 5, 6, 9]

// --- 19. Typed tuple comprehension ---
type TupleComprehension<T extends number[], F extends (n: number) => number, Acc extends number[] = []> =
  T extends [infer H extends number, ...infer Rest extends number[]]
    ? TupleComprehension<Rest, F, [...Acc, ReturnType<F>]>
    : Acc;
// At value level:
function comprehend<T extends number[]>(t: T, f: (n: number) => number): number[] {
  return t.map(f);
}
const A19 = comprehend([1, 2, 3, 4, 5], n => n * n); // [1, 4, 9, 16, 25]

// --- 20. Variadic functor (map with preserved tuple length) ---
type ExactMap<T extends unknown[], F extends (...args: unknown[]) => unknown> = {
  [K in keyof T]: F extends (x: T[K]) => infer R ? R : never
};
type NumsToStrings<T extends number[]> = ExactMap<T, (x: number) => string>;
type A20 = NumsToStrings<[1, 2, 3]>; // [string, string, string]

// --- 21. Labeled variadic parameters ---
type LabeledTuple<Labels extends string[], Types extends unknown[]> =
  Labels["length"] extends Types["length"]
    ? { [K in keyof Labels as Labels[K] & string]: K extends keyof Types ? Types[K] : never }
    : never;
type A21 = LabeledTuple<["x", "y", "z"], [number, number, number]>;
// {x:number; y:number; z:number}

// --- 22. Type-safe event bus with tuple event map ---
type EventBus<Events extends readonly (readonly [string, unknown])[]> = {
  emit<K extends Events[number][0]>(
    event: K,
    payload: Extract<Events[number], readonly [K, unknown]>[1]
  ): void;
  on<K extends Events[number][0]>(
    event: K,
    handler: (payload: Extract<Events[number], readonly [K, unknown]>[1]) => void
  ): () => void;
};
function createBus<Events extends readonly (readonly [string, unknown])[]>(): EventBus<Events> {
  const handlers = new Map<string, Function[]>();
  return {
    emit: (event, payload) => { (handlers.get(event as string) ?? []).forEach(h => h(payload)); },
    on: (event, handler) => {
      const list = handlers.get(event as string) ?? [];
      handlers.set(event as string, [...list, handler]);
      return () => handlers.set(event as string, handlers.get(event as string)!.filter(h => h !== handler));
    },
  };
}
type MyEvents = readonly [
  readonly ["user:created", { id: number }],
  readonly ["post:published", { postId: number; title: string }],
];
const A22_bus = createBus<MyEvents>();
A22_bus.on("user:created", ({ id }) => console.log(id));

// --- 23. Typed query result tuple ---
type DbRow<Cols extends Record<string, unknown>> = { [K in keyof Cols]: Cols[K] };
type DbResult<T extends DbRow<Record<string, unknown>>[]> = {
  rows: T;
  rowCount: T["length"];
  field: <K extends keyof T[number]>(name: K) => T[number][K][];
};
function dbResult<T extends DbRow<Record<string, unknown>>[]>(rows: T): DbResult<T> {
  return {
    rows,
    rowCount: rows.length as T["length"],
    field: (name) => rows.map(r => r[name]),
  };
}

// --- 24. Variadic tuple schema ---
type TupleSchema<T extends unknown[]> = {
  [K in keyof T]: {
    validate: (v: unknown) => v is T[K];
    serialize: (v: T[K]) => string;
    deserialize: (s: string) => T[K];
  }
};
function defineTupleSchema<T extends unknown[]>(
  ...defs: TupleSchema<T>
): TupleSchema<T> {
  return defs;
}
const A24_schema = defineTupleSchema<[number, string]>(
  { validate: (v): v is number => typeof v === "number", serialize: String, deserialize: Number },
  { validate: (v): v is string => typeof v === "string", serialize: s => `"${s}"`, deserialize: s => s.slice(1, -1) }
);

// --- 25. Type-level tuple algebra ---
type TupleAdd<A extends number[], B extends number[]> = {
  [K in keyof A]: A[K] extends number ? B[K & number] extends number ? Add<A[K], B[K & number]> : never : never
};
type A25 = TupleAdd<[1, 2, 3], [4, 5, 6]>; // [5, 7, 9]

// --- 26. Typed varargs accumulator ---
class Accumulator<T extends unknown[]> {
  private values: unknown[] = [];
  add<V>(v: V): Accumulator<[...T, V]> {
    const next = new Accumulator<[...T, V]>();
    (next as unknown as { values: unknown[] }).values = [...this.values, v];
    return next;
  }
  get(): T { return this.values as T; }
  length(): T["length"] { return this.values.length as T["length"]; }
}
const A26_acc = new Accumulator<[]>().add(1).add("hello").add(true);
type A26_T = ReturnType<typeof A26_acc["get"]>; // [number, string, boolean]

// --- 27. Variadic tuple lens ---
type TupleLens<T extends unknown[], I extends number> = {
  get: (t: T) => T[I];
  set: (t: T, v: T[I]) => T;
};
function tupleLens<T extends unknown[], I extends number>(i: I): TupleLens<T, I> {
  return {
    get: t => t[i],
    set: (t, v) => { const copy = [...t] as T; copy[i] = v; return copy; },
  };
}
const A27_lens = tupleLens<[number, string, boolean], 1>(1);
const A27_t = [1, "hello", true] as [number, string, boolean];
const A27_updated = A27_lens.set(A27_t, "world"); // [1, "world", true]

// --- 28. Typed tuple diff patch ---
type TuplePatch<T extends unknown[]> = {
  [K in keyof T]?: T[K] | undefined
};
function patchTuple<T extends unknown[]>(original: T, patch: TuplePatch<T>): T {
  return original.map((v, i) => (patch as Record<number, unknown>)[i] ?? v) as T;
}
const A28_patched = patchTuple([1, "a", true] as [number, string, boolean], { 1: "b" });

// --- 29. Type-safe N-dimensional matrix ---
type Matrix<T, Dims extends number[]> =
  Dims extends [infer N extends number, ...infer Rest extends number[]]
    ? Rest extends [] ? T[] : Matrix<T, Rest>[]
    : T;
type Matrix2D = Matrix<number, [3, 3]>; // number[][]
type Matrix3D = Matrix<number, [2, 2, 2]>; // number[][][]

// --- 30. Variadic intersection observer ---
type IntersectionOf<T extends unknown[]> = T extends [infer H, ...infer Rest]
  ? H & IntersectionOf<Rest> : {};
type A30 = IntersectionOf<[{ a: 1 }, { b: 2 }, { c: 3 }]>; // {a:1;b:2;c:3}

// --- 31. Typed tuple iterator ---
class TupleIterator<T extends unknown[]> implements Iterable<T[number]> {
  private idx = 0;
  constructor(private tuple: T) {}
  next(): IteratorResult<T[number]> {
    return this.idx < this.tuple.length
      ? { value: this.tuple[this.idx++], done: false }
      : { value: undefined as never, done: true };
  }
  [Symbol.iterator](): Iterator<T[number]> {
    return { next: () => this.next() };
  }
  map<U>(fn: (v: T[number]) => U): U[] { return this.tuple.map(fn); }
  filter(pred: (v: T[number]) => boolean): T[number][] { return this.tuple.filter(pred); }
}
const A31_iter = new TupleIterator([1, "hello", true] as [number, string, boolean]);
for (const v of A31_iter) console.log(v);

// --- 32. Variadic reducer chain ---
type ReducerChain<S, Actions extends [string, unknown][]> = {
  [K in Actions[number] as K[0]]: (state: S, payload: K[1]) => S
};
function createReducer<S, A extends [string, unknown][]>(
  initial: S,
  handlers: ReducerChain<S, A>
): { state: S; dispatch: <T extends A[number]>(action: T[0], payload: T[1]) => void } {
  let state = initial;
  return {
    get state() { return state; },
    dispatch(action, payload) {
      const handler = (handlers as Record<string, (s: S, p: unknown) => S>)[action];
      if (handler) state = handler(state, payload);
    },
  };
}

// --- 33. Type-safe variadic keys ---
type KeysOf<T extends object[], Acc extends string = never> =
  T extends [infer H extends object, ...infer Rest extends object[]]
    ? KeysOf<Rest, Acc | (keyof H & string)>
    : Acc;
type A33 = KeysOf<[{ a: 1 }, { b: 2 }, { c: 3 }]>; // "a" | "b" | "c"

// --- 34. Typed tuple channel ---
class Channel<T extends unknown[]> {
  private buffer: T[number][] = [];
  private consumers: ((v: T[number]) => void)[] = [];
  send(value: T[number]): void {
    if (this.consumers.length) this.consumers.shift()!(value);
    else this.buffer.push(value);
  }
  receive(): Promise<T[number]> {
    if (this.buffer.length) return Promise.resolve(this.buffer.shift()!);
    return new Promise(resolve => this.consumers.push(resolve));
  }
}
const A34_ch = new Channel<[number, string, boolean]>();
A34_ch.send(42);

// --- 35. Variadic observable ---
type Observer_<T extends unknown[]> = {
  [K in keyof T]: { next: (v: T[K]) => void; error: (e: Error) => void; complete: () => void }
}[number];
class Observable<T extends unknown[]> {
  constructor(private producer: (obs: Observer_<T>) => () => void) {}
  subscribe(obs: Observer_<T>): () => void { return this.producer(obs); }
  map<U>(fn: (v: T[number]) => U): Observable<[U]> {
    return new Observable<[U]>(o =>
      this.subscribe({ ...obs as Observer_<T>, next: v => (o as { next: (v: U) => void }).next(fn(v)) } as Observer_<T>)
    );
  }
}

// --- 36. Variadic JSON encoder ---
type JsonEncoders<T extends unknown[]> = {
  [K in keyof T]: (v: T[K]) => string
};
function encodeAll<T extends unknown[]>(values: T, encoders: JsonEncoders<T>): string[] {
  return values.map((v, i) => (encoders[i] as (v: unknown) => string)(v));
}
const A36_encoded = encodeAll(
  [42, "hello", true] as [number, string, boolean],
  [String, (s: string) => `"${s}"`, (b: boolean) => b ? "1" : "0"]
);

// --- 37. Dependent types via conditional tuples ---
type PayloadFor<T extends string> =
  T extends "create" ? { name: string; email: string } :
  T extends "update" ? { id: number; data: Record<string, unknown> } :
  T extends "delete" ? { id: number } :
  never;
type TypedAction<T extends "create" | "update" | "delete"> = [T, PayloadFor<T>];
function createAction<T extends "create" | "update" | "delete">(
  type: T,
  payload: PayloadFor<T>
): TypedAction<T> {
  return [type, payload];
}
const A37_create = createAction("create", { name: "Alice", email: "alice@test.com" });
const A37_delete = createAction("delete", { id: 1 });

// --- 38. Variadic type-safe SQL parameters ---
type SqlParams<T extends (string | number | boolean | null)[]> = T;
function sql<T extends (string | number | boolean | null)[]>(
  template: TemplateStringsArray,
  ...values: T
): { query: string; params: T } {
  const query = template.reduce((acc, s, i) => acc + s + (i < values.length ? "?" : ""), "");
  return { query, params: values };
}
const A38 = sql`SELECT * FROM users WHERE id = ${1} AND active = ${true}`;
type A38_T = typeof A38.params; // [number, boolean]

// --- 39. Tuple-based type narrowing ---
function matchTuple<T extends unknown[]>(
  value: unknown,
  shape: { [K in keyof T]: (v: unknown) => v is T[K] }
): value is T {
  if (!Array.isArray(value) || value.length !== shape.length) return false;
  return shape.every((guard, i) => guard(value[i]));
}
const isNumStr = matchTuple.bind(null, [1, "a"], [
  (v: unknown): v is number => typeof v === "number",
  (v: unknown): v is string => typeof v === "string"
]);

// --- 40. Typed command queue ---
class CommandQueue<Commands extends [string, unknown, unknown][]> {
  private queue: { type: string; payload: unknown }[] = [];
  private handlers: Record<string, (p: unknown) => unknown> = {};
  register<K extends Commands[number]>(
    type: K[0],
    handler: (payload: K[1]) => K[2]
  ): this {
    this.handlers[type] = handler;
    return this;
  }
  enqueue<K extends Commands[number]>(type: K[0], payload: K[1]): this {
    this.queue.push({ type, payload });
    return this;
  }
  async flush(): Promise<void> {
    while (this.queue.length > 0) {
      const { type, payload } = this.queue.shift()!;
      await this.handlers[type]?.(payload);
    }
  }
}
type CmdDefs = [["add", { a: number; b: number }, number], ["greet", string, string]];
const A40_q = new CommandQueue<CmdDefs>()
  .register("add", ({ a, b }) => a + b)
  .register("greet", name => `Hello, ${name}!`)
  .enqueue("add", { a: 3, b: 4 });

// --- 41. Type-safe function memoization with tuple key ---
function memoWithKey<Args extends unknown[], R>(
  fn: (...args: Args) => R,
  keyFn: (...args: Args) => string = (...args) => JSON.stringify(args)
): (...args: Args) => R {
  const cache = new Map<string, R>();
  return (...args) => {
    const k = keyFn(...args);
    if (!cache.has(k)) cache.set(k, fn(...args));
    return cache.get(k)!;
  };
}
const A41_fib = memoWithKey(function fib(n: number): number {
  return n <= 1 ? n : fib(n - 1) + fib(n - 2);
});

// --- 42. Variadic type guard combinator ---
type Guards<T extends unknown[]> = { [K in keyof T]: (v: unknown) => v is T[K] };
function every<T extends unknown[]>(...guards: Guards<T>): (v: unknown) => v is T[number] {
  return (v): v is T[number] => guards.every(g => g(v));
}
const A42_isNumOrStr = every<[number, string]>(
  (v): v is number => typeof v === "number",
  (v): v is string => typeof v === "string"
);

// --- 43. Typed saga effects tuple ---
type Effect<T extends unknown[]> =
  | { type: "put"; payload: T[0] }
  | { type: "take"; pattern: T[1] }
  | { type: "call"; fn: (...args: T) => Promise<unknown> };
function* typedSaga<Events extends unknown[]>(): Generator<Effect<Events>, void, unknown> {
  const event: Events[0] = yield { type: "take", pattern: "USER_CREATED" };
  yield { type: "put", payload: { type: "NOTIFY", userId: event } };
}

// --- 44. Tuple-based reactive state ---
type StateAtom<T extends unknown[]> = {
  readonly current: T;
  set: <K extends keyof T>(index: K, value: T[K]) => void;
  subscribe: (listener: (state: T) => void) => () => void;
};
function atom<T extends unknown[]>(initial: T): StateAtom<T> {
  let state = [...initial] as T;
  const listeners: ((s: T) => void)[] = [];
  return {
    get current() { return state; },
    set(index, value) {
      const next = [...state] as T;
      next[index as number] = value;
      state = next;
      listeners.forEach(l => l(state));
    },
    subscribe(l) { listeners.push(l); return () => listeners.splice(listeners.indexOf(l), 1); },
  };
}
const A44_state = atom([0, "initial", false] as [number, string, boolean]);
A44_state.subscribe(s => console.log(s));
A44_state.set(0, 42);

// --- 45. Typed tuple stream ---
type TupleStream<T extends unknown[]> = AsyncIterable<T[number]> & {
  map: <U>(fn: (v: T[number]) => U) => TupleStream<[U]>;
  filter: (pred: (v: T[number]) => boolean) => TupleStream<T>;
  take: (n: number) => TupleStream<T>;
};

// --- 46. Higher-order variadic type ---
type MapOver<T extends unknown[], F extends <U>(x: U) => unknown> = {
  [K in keyof T]: F extends <U>(x: U) => infer R ? R : never
};
type DoubleAll<T extends number[]> = MapOver<T, (x: number) => number>;

// --- 47. Tuple-based type class instances ---
type Functor<F extends (x: unknown) => unknown[]> = {
  fmap: <A, B>(fa: ReturnType<F>, fn: (a: A) => B) => ReturnType<F>
};

// --- 48. Variadic JSON serialization ---
type JsonTuple<T extends unknown[]> = {
  [K in keyof T]: T[K] extends string ? string :
    T[K] extends number ? number :
    T[K] extends boolean ? boolean :
    T[K] extends null ? null :
    T[K] extends unknown[] ? JsonTuple<T[K]> :
    T[K] extends object ? Record<string, unknown> : never
};
function serializeJsonTuple<T extends unknown[]>(tuple: T): string {
  return JSON.stringify(tuple);
}

// --- 49. Typed tuple pool ---
class TuplePool<T extends unknown[]> {
  private pool: T[] = [];
  constructor(private factory: () => T, size = 10) {
    this.pool = Array.from({ length: size }, factory);
  }
  acquire(): T { return this.pool.pop() ?? this.factory(); }
  release(item: T): void { this.pool.push(item); }
  get size(): number { return this.pool.length; }
}

// --- 50. Full variadic type system: function type algebra ---
type Compose2<F extends (a: unknown) => unknown, G extends (a: unknown) => unknown> =
  F extends (a: infer A) => infer B
    ? G extends (a: B) => infer C
      ? (a: A) => C
      : never
    : never;
type ComposeN<Fns extends ((a: unknown) => unknown)[]> =
  Fns extends [] ? (x: unknown) => unknown :
  Fns extends [infer F extends (a: unknown) => unknown] ? F :
  Fns extends [infer F extends (a: unknown) => unknown, ...infer Rest extends ((a: unknown) => unknown)[]]
    ? Compose2<F, ComposeN<Rest>>
    : never;
type A50 = ComposeN<[(a: string) => number, (a: number) => boolean]>;
// (a: string) => boolean
