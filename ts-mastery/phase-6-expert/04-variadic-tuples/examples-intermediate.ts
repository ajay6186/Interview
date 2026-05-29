export {};

// ============================================================
// Phase 6 – Expert: Variadic Tuples — INTERMEDIATE (1–50)
// ============================================================

// Core helpers
type Head<T extends unknown[]> = T extends [infer H, ...infer _] ? H : never;
type Tail<T extends unknown[]> = T extends [infer _, ...infer R] ? R : never;
type Last<T extends unknown[]> = T extends [...infer _, infer L] ? L : never;
type Init<T extends unknown[]> = T extends [...infer I, infer _] ? I : never;
type Concat<A extends unknown[], B extends unknown[]> = [...A, ...B];
type Reverse<T extends unknown[], Acc extends unknown[] = []> =
  T extends [infer H, ...infer R] ? Reverse<R, [H, ...Acc]> : Acc;
type Includes<T extends unknown[], V> =
  T extends [infer H, ...infer R]
    ? [H] extends [V] ? [V] extends [H] ? true : Includes<R, V> : Includes<R, V> : false;

// --- 1. Typed pipe (2-8 stages) ---
function pipe<A>(a: A): A;
function pipe<A, B>(a: A, f1: (a: A) => B): B;
function pipe<A, B, C>(a: A, f1: (a: A) => B, f2: (b: B) => C): C;
function pipe<A, B, C, D>(a: A, f1: (a: A) => B, f2: (b: B) => C, f3: (c: C) => D): D;
function pipe<A, B, C, D, E>(a: A, f1: (a: A) => B, f2: (b: B) => C, f3: (c: C) => D, f4: (d: D) => E): E;
function pipe(value: unknown, ...fns: Function[]): unknown {
  return fns.reduce((v, f) => f(v), value);
}
const I1 = pipe(5, n => n * 2, n => n + 1, n => `Result: ${n}`); // "Result: 11"

// --- 2. Typed compose (right to left) ---
function compose<A, B>(f: (a: A) => B): (a: A) => B;
function compose<A, B, C>(g: (b: B) => C, f: (a: A) => B): (a: A) => C;
function compose<A, B, C, D>(h: (c: C) => D, g: (b: B) => C, f: (a: A) => B): (a: A) => D;
function compose(...fns: Function[]): Function {
  return (x: unknown) => fns.reduceRight((v, f) => f(v), x);
}
const I2 = compose((n: number) => n.toString(), (s: string) => s.length);
type I2_T = typeof I2; // (a: string) => string

// --- 3. Variadic zip (N arrays) ---
type ZipN<T extends unknown[][]> = {
  [K in keyof T[0]]: { [I in keyof T]: K extends keyof T[I] ? T[I][K] : never }
};
declare function zipN<T extends unknown[][]>(...arrays: T): ZipN<T>;

// --- 4. Tuple map (preserving types) ---
type MapTuple<T extends unknown[], F extends { [K in keyof T]: (x: T[K]) => unknown }> = {
  [K in keyof T]: F[K] extends (x: T[K]) => infer R ? R : never
};
declare function mapTuple<T extends unknown[]>(
  tuple: T,
  ...fns: { [K in keyof T]: (x: T[K]) => unknown }
): MapTuple<T, { [K in keyof T]: (x: T[K]) => unknown }>;

// --- 5. Tuple reduce ---
type ReduceTuple<T extends number[], Acc extends number = 0> =
  T extends [infer H extends number, ...infer Rest extends number[]]
    ? ReduceTuple<Rest, Acc> // simplified (actual reduce would need Add)
    : Acc;

function reduceTuple<T extends unknown[], R>(
  tuple: T,
  reducer: (acc: R, cur: T[number], idx: number) => R,
  init: R
): R {
  return (tuple as T[number][]).reduce(reducer, init);
}
const I5_sum = reduceTuple([1, 2, 3, 4], (acc, cur) => acc + (cur as number), 0); // 10

// --- 6. Tuple flatMap ---
function flatMapTuple<T extends unknown[], U>(
  tuple: T,
  fn: (item: T[number], idx: number) => U[]
): U[] {
  return (tuple as T[number][]).flatMap(fn);
}
const I6 = flatMapTuple([1, 2, 3], n => [(n as number), (n as number) * 2]);
// [1,2,2,4,3,6]

// --- 7. Typed tuple sort ---
function sortTuple<T extends unknown[]>(
  tuple: T,
  compare: (a: T[number], b: T[number]) => number
): T[number][] {
  return [...(tuple as T[number][])].sort(compare);
}
const I7 = sortTuple([3, 1, 4, 1, 5, 9, 2, 6], (a, b) => (a as number) - (b as number));

// --- 8. Typed tuple group-by ---
function groupByTuple<T extends unknown[], K extends PropertyKey>(
  tuple: T,
  keyFn: (item: T[number]) => K
): Map<K, T[number][]> {
  const map = new Map<K, T[number][]>();
  for (const item of tuple as T[number][]) {
    const k = keyFn(item);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(item);
  }
  return map;
}

// --- 9. Variadic tuple constructor ---
class TypedTuple<T extends unknown[]> {
  constructor(private readonly items: T) {}
  at<I extends number>(i: I): T[I] { return this.items[i]; }
  length(): T["length"] { return this.items.length as T["length"]; }
  toArray(): T[number][] { return [...this.items]; }
  map<U>(fn: (v: T[number]) => U): U[] { return this.items.map(fn); }
  concat<U extends unknown[]>(other: TypedTuple<U>): TypedTuple<[...T, ...U]> {
    return new TypedTuple([...this.items, ...other.items] as [...T, ...U]);
  }
}
const I9_t = new TypedTuple([1, "hello", true] as [number, string, boolean]);
type I9_At1 = ReturnType<typeof I9_t["at"]>; // number | string | boolean

// --- 10. Typed tuple-based record ---
type TupleRecord<Keys extends string[], Values extends unknown[]> =
  Keys["length"] extends Values["length"]
    ? { [K in keyof Keys as Keys[K] & string]: K extends keyof Values ? Values[K] : never }
    : never;
type I10 = TupleRecord<["name", "age"], [string, number]>; // {name:string; age:number}

// --- 11. Variadic function overload resolver ---
type Overload<Sigs extends [unknown[], unknown][]> = {
  [K in keyof Sigs]: (...args: Sigs[K][0] extends unknown[] ? Sigs[K][0] : never) => Sigs[K][1]
}[number];
type I11_AddOverloads = Overload<[[number, number], number] | [[string, string], string]>;

// --- 12. Tuple-based state machine transitions ---
type Transition<State extends string, Event extends string, NextState extends string> =
  [State, Event, NextState];
type Transitions = [
  Transition<"idle", "start", "running">,
  Transition<"running", "pause", "paused">,
  Transition<"paused", "resume", "running">,
  Transition<"running", "stop", "idle">,
];
type ValidTransition<S extends string, E extends string, T extends Transition<string, string, string>[]> =
  T extends [infer H extends Transition<string, string, string>, ...infer Rest extends Transition<string, string, string>[]]
    ? H[0] extends S ? H[1] extends E ? H[2] : ValidTransition<S, E, Rest>
    : ValidTransition<S, E, Rest>
    : never;
type I12 = ValidTransition<"running", "pause", Transitions>; // "paused"

// --- 13. Tuple-based error accumulation ---
type ErrorTuple<Errs extends string[]> = { _errors: Errs };
type Validate<T, Errs extends string[] = []> =
  T extends null ? ErrorTuple<[...Errs, "null not allowed"]> :
  T extends string ? (T extends "" ? ErrorTuple<[...Errs, "empty string"]> : T) :
  T;
type I13_T = Validate<"hello">; // "hello"
type I13_F = Validate<"">; // ErrorTuple<["empty string"]>

// --- 14. TypedArgs with defaults ---
type WithDefaults<Required extends unknown[], Optional extends unknown[]> =
  [...Required, ...Partial<Optional>];
type I14 = WithDefaults<[string], [number?, boolean?]>;
// [string, number?, boolean?]

// --- 15. Tuple-based event sequence ---
type EventSeq<Events extends string[]> = {
  on: <E extends Events[number]>(event: E, handler: (e: E) => void) => void;
  emit: <E extends Events[number]>(event: E) => void;
};
function createEventSeq<Events extends string[]>(...events: Events): EventSeq<Events> {
  const handlers = new Map<string, ((e: string) => void)[]>();
  return {
    on: (event, handler) => { (handlers.get(event) ?? handlers.set(event, []).get(event)!).push(handler as (e: string) => void); },
    emit: event => { (handlers.get(event) ?? []).forEach(h => h(event)); },
  };
}
const I15_seq = createEventSeq("click", "submit", "cancel");

// --- 16. Tuple-based schema ---
type FieldDef<T> = { name: string; type: string; default?: T; required: boolean };
type Schema<T extends unknown[]> = { [K in keyof T]: FieldDef<T[K]> };
function defineSchema<T extends unknown[]>(...fields: Schema<T>): Schema<T> {
  return fields;
}

// --- 17. Curried variadic function ---
type CurriedFn<Args extends unknown[], R> =
  Args extends [] ? R :
  Args extends [infer A, ...infer Rest] ? (a: A) => CurriedFn<Rest, R> : R;
function curryN<Args extends unknown[], R>(fn: (...args: Args) => R): CurriedFn<Args, R> {
  const arity = fn.length;
  function curried(...args: unknown[]): unknown {
    if (args.length >= arity) return (fn as Function)(...args);
    return (...more: unknown[]) => curried(...args, ...more);
  }
  return curried as CurriedFn<Args, R>;
}
const I17_add3 = curryN((a: number, b: number, c: number) => a + b + c);
const I17_step = I17_add3(1)(2); // (c: number) => number

// --- 18. Tuple-based command pattern ---
type Command<Args extends unknown[], Result> = { args: Args; execute: (...args: Args) => Result };
function command<Args extends unknown[], Result>(
  fn: (...args: Args) => Result,
  ...args: Args
): Command<Args, Result> {
  return { args, execute: fn };
}
const I18_cmd = command((a: number, b: number) => a + b, 3, 4);
const I18_result = I18_cmd.execute(...I18_cmd.args); // 7

// --- 19. Tuple comparison ---
type TupleEq<A extends unknown[], B extends unknown[]> =
  A extends B ? B extends A ? true : false : false;
type I19_T = TupleEq<[1, 2, 3], [1, 2, 3]>; // true
type I19_F = TupleEq<[1, 2], [1, 2, 3]>;    // false

// --- 20. N-ary product type ---
type Product<A extends unknown[], B extends unknown[]> = {
  [KA in keyof A]: {
    [KB in keyof B]: [A[KA], B[KB]]
  }[number]
}[number];
type I20 = Product<[1, 2], ["a", "b"]>;
// [1,"a"] | [1,"b"] | [2,"a"] | [2,"b"]

// --- 21. Tuple-based builder pattern ---
class TupleBuilder<T extends unknown[] = []> {
  private items: unknown[] = [];
  add<V>(v: V): TupleBuilder<[...T, V]> {
    const nb = new TupleBuilder<[...T, V]>();
    (nb as unknown as { items: unknown[] }).items = [...this.items, v];
    return nb;
  }
  build(): T { return this.items as T; }
}
const I21_t = new TupleBuilder().add(1).add("hello").add(true).build();
type I21_Type = typeof I21_t; // [number, string, boolean]

// --- 22. Typed event tuple bus ---
type EventBusTuple<Events extends readonly [string, unknown][]> = {
  emit<K extends Events[number][0]>(
    event: K,
    payload: Extract<Events[number], [K, unknown]>[1]
  ): void;
  on<K extends Events[number][0]>(
    event: K,
    handler: (payload: Extract<Events[number], [K, unknown]>[1]) => void
  ): void;
};
type AppEvents = readonly [
  ["user:created", { id: number; name: string }],
  ["user:deleted", { id: number }],
];
declare function createBus<E extends readonly [string, unknown][]>(): EventBusTuple<E>;
const I22_bus = createBus<AppEvents>();
I22_bus.on("user:created", payload => console.log(payload.name));

// --- 23. Variadic middleware ---
type Middleware<T> = (ctx: T, next: () => Promise<void>) => Promise<void>;
function composeMiddleware<T>(...mws: Middleware<T>[]): Middleware<T> {
  return async (ctx, next) => {
    let i = -1;
    const dispatch = async (index: number): Promise<void> => {
      if (index <= i) return;
      i = index;
      const fn = mws[index] ?? next;
      await fn(ctx, () => dispatch(index + 1));
    };
    await dispatch(0);
  };
}
type HttpCtx = { path: string; status: number };
const I23_mw = composeMiddleware<HttpCtx>(
  async (ctx, next) => { ctx.status = 200; await next(); },
  async (ctx, next) => { console.log(ctx.path); await next(); }
);

// --- 24. Typed tuple spread in class ---
class Rect<Coords extends [number, number, number, number]> {
  constructor(public coords: Coords) {}
  get [0](): Coords[0] { return this.coords[0]; }
  get [1](): Coords[1] { return this.coords[1]; }
  get [2](): Coords[2] { return this.coords[2]; }
  get [3](): Coords[3] { return this.coords[3]; }
  get width(): number { return this.coords[2] - this.coords[0]; }
  get height(): number { return this.coords[3] - this.coords[1]; }
}
const I24_rect = new Rect([0, 0, 100, 50] as [number, number, number, number]);

// --- 25. Variadic bind ---
function bind<This, Args extends unknown[], R>(
  fn: (this: This, ...args: Args) => R,
  thisArg: This,
  ...partial: Partial<Args>
): (...rest: Partial<Args>) => R {
  return (...rest) => fn.call(thisArg, ...[...partial, ...rest] as Args);
}

// --- 26. Typed function partial application ---
type PartialArgs<F extends (...args: unknown[]) => unknown, Applied extends unknown[]> =
  Parameters<F> extends [...Applied, ...infer Rest] ? Rest : never;
function partial<F extends (...args: unknown[]) => unknown, Applied extends Partial<Parameters<F>>>(
  fn: F,
  ...applied: Applied
): (...rest: PartialArgs<F, Applied>) => ReturnType<F> {
  return (...rest) => fn(...applied, ...rest) as ReturnType<F>;
}
const I26_add5 = partial((a: number, b: number) => a + b, 5);
const I26_result = I26_add5(3); // 8

// --- 27. Typed tuple swap ---
type Swap<T extends unknown[], I extends number, J extends number> =
  { [K in keyof T]: K extends `${I}` ? T[J & number] : K extends `${J}` ? T[I & number] : T[K & number] };
type I27 = Swap<[1, 2, 3, 4], 1, 3>; // [1, 4, 3, 2]

// --- 28. Tuple max element type ---
type MaxLength<Tuples extends unknown[][]> =
  Tuples extends [infer H extends unknown[], ...infer Rest extends unknown[][]]
    ? H["length"] extends MaxLength<Rest> ? H["length"] : MaxLength<Rest>
    : 0;
type I28 = MaxLength<[[1, 2], [3, 4, 5], [6]]>; // 3

// --- 29. Cartesian product tuple ---
type CartProduct<A extends unknown[], B extends unknown[]> =
  A extends [infer HA, ...infer RA]
    ? [...{ [K in keyof B]: [HA, B[K]] }, ...CartProduct<RA, B>]
    : [];
type I29 = CartProduct<[1, 2], ["a", "b"]>;
// [[1,"a"],[1,"b"],[2,"a"],[2,"b"]]

// --- 30. Typed promise.all return ---
type AwaitAll<T extends Promise<unknown>[]> = {
  [K in keyof T]: Awaited<T[K]>
};
declare function awaitAll<T extends Promise<unknown>[]>(...promises: T): Promise<AwaitAll<T>>;
const I30_result = awaitAll(Promise.resolve(1), Promise.resolve("a"), Promise.resolve(true));
type I30_Type = Awaited<typeof I30_result>; // [number, string, boolean]

// --- 31. Tuple as type-safe stack ---
class TypedStack<T extends unknown[]> {
  private items: unknown[] = [];
  push<V>(v: V): TypedStack<[...T, V]> {
    const ns = new TypedStack<[...T, V]>();
    (ns as unknown as { items: unknown[] }).items = [...this.items, v];
    return ns;
  }
  pop(): TypedStack<Init<T>> {
    const ns = new TypedStack<Init<T>>();
    (ns as unknown as { items: unknown[] }).items = this.items.slice(0, -1);
    return ns;
  }
  peek(): Last<T> { return this.items[this.items.length - 1] as Last<T>; }
  size(): T["length"] { return this.items.length as T["length"]; }
}
const I31_stack = new TypedStack().push(1).push("hello").push(true);
type I31_Peek = ReturnType<typeof I31_stack["peek"]>; // boolean

// --- 32. Variadic event emitter ---
class VariadicEmitter<Events extends Record<string, unknown[]>> {
  private handlers: { [K in keyof Events]?: ((...args: Events[K]) => void)[] } = {};
  on<K extends keyof Events>(event: K, handler: (...args: Events[K]) => void): void {
    (this.handlers[event] ??= []).push(handler);
  }
  emit<K extends keyof Events>(event: K, ...args: Events[K]): void {
    (this.handlers[event] ?? []).forEach(h => h(...args));
  }
}
type SocketEvents = {
  connect: [host: string, port: number];
  data: [chunk: Buffer];
  error: [err: Error];
};
const I32_emitter = new VariadicEmitter<SocketEvents>();
I32_emitter.on("connect", (host, port) => console.log(`${host}:${port}`));

// --- 33. Typed tuple serializer ---
function serializeTuple<T extends (string | number | boolean)[]>(tuple: T): string {
  return JSON.stringify(tuple);
}
function deserializeTuple<T extends (string | number | boolean)[]>(json: string): T {
  return JSON.parse(json) as T;
}
const I33_json = serializeTuple([1, "hello", true]);
const I33_back = deserializeTuple<[number, string, boolean]>(I33_json);

// --- 34. Typed conditional spread ---
type MaybeSpread<T extends unknown[] | undefined> = T extends unknown[] ? T : [];
type I34 = [...MaybeSpread<[1, 2]>, ...MaybeSpread<undefined>]; // [1, 2]

// --- 35. Variadic type guard ---
function isTuple<T extends unknown[]>(
  value: unknown,
  ...guards: { [K in keyof T]: (v: unknown) => v is T[K] }
): value is T {
  if (!Array.isArray(value) || value.length !== guards.length) return false;
  return guards.every((g, i) => g(value[i]));
}
const I35_isNumStr = (v: unknown): boolean =>
  isTuple<[number, string]>(v, (x): x is number => typeof x === "number", (x): x is string => typeof x === "string");

// --- 36. Tuple-based function signature ---
type Signature<Params extends unknown[], Return> = {
  params: Params;
  return: Return;
  fn: (...params: Params) => Return;
};
function signature<Params extends unknown[], Return>(
  fn: (...params: Params) => Return
): Signature<Params, Return> {
  return { params: [] as unknown as Params, return: undefined as unknown as Return, fn };
}
const I36_sig = signature((a: number, b: string) => `${a}: ${b}`);

// --- 37. Variadic proxy ---
function variadic<Args extends unknown[], R>(
  fn: (...args: Args) => R
): { call: (...args: Args) => R; apply: (args: Args) => R } {
  return {
    call: (...args) => fn(...args),
    apply: args => fn(...args),
  };
}
const I37_proxy = variadic((a: number, b: number) => a + b);
const I37_r = I37_proxy.apply([3, 4]); // 7

// --- 38. Tuple-based value object ---
type ValueObject<T extends unknown[]> = Readonly<T> & { equals: (other: ValueObject<T>) => boolean };
function valueObject<T extends unknown[]>(...items: T): ValueObject<T> {
  const tuple = Object.freeze([...items]) as Readonly<T>;
  return Object.assign(tuple, {
    equals(other: ValueObject<T>) { return JSON.stringify(this) === JSON.stringify(other); }
  }) as ValueObject<T>;
}
const I38_p1 = valueObject(1, 2);
const I38_p2 = valueObject(1, 2);
const I38_eq = I38_p1.equals(I38_p2); // true

// --- 39. Labeled tuple elements ---
type LabeledPoint = [x: number, y: number, z: number];
function labeledPoint(x: number, y: number, z: number): LabeledPoint { return [x, y, z]; }
const I39_p = labeledPoint(1, 2, 3);
const [ix, iy, iz] = I39_p;

// --- 40. Rest elements in the middle ---
type SandwichTuple<Head extends unknown[], Rest extends unknown[], Tail extends unknown[]> = [...Head, ...Rest, ...Tail];
type I40 = SandwichTuple<[string], number[], [boolean]>;
// [string, ...number[], boolean]

// --- 41. Recursive tuple builder ---
type BuildPath<Parts extends string[]> =
  Parts extends [infer H extends string, ...infer Rest extends string[]]
    ? Rest extends [] ? H : `${H}/${BuildPath<Rest>}`
    : never;
type I41 = BuildPath<["api", "v1", "users", "profile"]>; // "api/v1/users/profile"

// --- 42. Tuple intersection ---
type TupleIntersect<A extends unknown[], B extends unknown[]> = {
  [K in keyof A & keyof B]: A[K] & B[K]
} & unknown[];
type I42 = TupleIntersect<[number, string], [1, "hello"]>; // roughly [1, "hello"]

// --- 43. Variadic tuple predicate ---
type AllExtend<T extends unknown[], U> =
  T extends [infer H, ...infer Rest]
    ? H extends U ? AllExtend<Rest, U> : false
    : true;
type AnyExtend<T extends unknown[], U> =
  T extends [infer H, ...infer Rest]
    ? H extends U ? true : AnyExtend<Rest, U>
    : false;
type I43_All = AllExtend<[1, 2, 3], number>; // true
type I43_Any = AnyExtend<[string, number, boolean], number>; // true

// --- 44. Tuple homogeneous check ---
type IsHomogeneous<T extends unknown[]> =
  T extends [infer H, ...infer Rest]
    ? Rest extends [] ? true
    : Rest extends (H extends unknown ? H[] : never) ? true : false
    : true;
type I44_T = IsHomogeneous<[number, number, number]>; // true
type I44_F = IsHomogeneous<[number, string]>; // false

// --- 45. Tuple normalization ---
type NormalizeToArray<T> = T extends unknown[] ? T : [T];
type I45_A = NormalizeToArray<[1, 2]>; // [1, 2]
type I45_S = NormalizeToArray<string>; // [string]

// --- 46. Typed tuple diff ---
type TupleDiff<A extends unknown[], B extends unknown[]> = {
  added: Exclude<B[number], A[number]>;
  removed: Exclude<A[number], B[number]>;
};
type I46 = TupleDiff<[1, 2, 3], [2, 3, 4]>;
// {added: 4; removed: 1}

// --- 47. Variadic function memo ---
function memoVariadic<Args extends unknown[], R>(
  fn: (...args: Args) => R
): (...args: Args) => R {
  const cache = new Map<string, R>();
  return (...args) => {
    const key = JSON.stringify(args);
    if (!cache.has(key)) cache.set(key, fn(...args));
    return cache.get(key)!;
  };
}
const I47_fib = memoVariadic(function fib(n: number): number {
  return n <= 1 ? n : fib(n - 1) + fib(n - 2);
});

// --- 48. Tuple-based pipeline with typed intermediate ---
type Pipeline<Input, Output> = (input: Input) => Output;
function makePipeline<A, B, C>(f: Pipeline<A, B>, g: Pipeline<B, C>): Pipeline<A, C> {
  return a => g(f(a));
}
function makeNPipeline<T extends unknown[]>(...fns: { [K in keyof T]: K extends "0" ? Pipeline<T[0], T[1 & number]> : Pipeline<T[Exclude<K, "0"> extends `${infer N extends number}` ? N : never], T[number]> }[number][]): Pipeline<unknown, unknown> {
  return fns.reduce((f, g) => (x: unknown) => (g as Pipeline<unknown, unknown>)((f as Pipeline<unknown, unknown>)(x)));
}
const I48_pipeline = makePipeline((s: string) => s.length, (n: number) => n > 5);
const I48_result = I48_pipeline("hello"); // false

// --- 49. Tuple type assertion ---
function assertTuple<T extends unknown[]>(
  value: unknown,
  length: T["length"]
): asserts value is T {
  if (!Array.isArray(value) || value.length !== length)
    throw new TypeError(`Expected tuple of length ${length}`);
}
const I49_val: unknown = [1, "a", true];
assertTuple<[number, string, boolean]>(I49_val, 3);
const [ia, ib, ic] = I49_val; // typed as number, string, boolean

// --- 50. Full variadic computation pipeline ---
type ComputePipeline<Input, Transforms extends ((x: unknown) => unknown)[]> =
  Transforms extends [infer F extends (x: Input) => infer R, ...infer Rest extends ((x: unknown) => unknown)[]]
    ? ComputePipeline<R, Rest>
    : Input;
function runPipeline<T>(value: T, ...transforms: ((x: unknown) => unknown)[]): unknown {
  return transforms.reduce((v, f) => f(v), value);
}
const I50_result = runPipeline(
  "  Hello World  ",
  (s: unknown) => (s as string).trim(),
  (s: unknown) => (s as string).toLowerCase(),
  (s: unknown) => (s as string).split(" "),
  (arr: unknown) => (arr as string[]).join("-")
); // "hello-world"
