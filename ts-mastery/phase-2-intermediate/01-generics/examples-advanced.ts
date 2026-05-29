export {};

// ============================================================
// ADVANCED EXAMPLES — Generics (50 Examples)
// ============================================================

// 1. Higher-kinded type simulation via type classes
interface Functor<F extends { _type: any }> {
  map<A, B>(fa: F & { _type: A }, fn: (a: A) => B): F & { _type: B };
}

// 2. Free monad simulation
type Free<F extends { _type: any }, A> =
  | { tag: "pure"; value: A }
  | { tag: "free"; effect: F & { _type: Free<F, A> } };

// 3. Infer mapped type — extract all method return types
type MethodReturnTypes<T> = {
  [K in keyof T as T[K] extends (...args: any[]) => any ? K : never]:
    T[K] extends (...args: any[]) => infer R ? R : never;
};
interface Service { getUser(): { id: number }; count(): number; name: string }
type Returns = MethodReturnTypes<Service>; // { getUser: { id: number }; count: number }

// 4. Generic — conditional distribution check
type IsDistributed<T, U> = T extends U ? T : never;
type StrOrNum = IsDistributed<string | number | boolean, string | number>;
// string | number (boolean excluded)

// 5. Generic type-level arithmetic — add two numbers via tuples
type BuildTuple<N extends number, Acc extends unknown[] = []> =
  Acc["length"] extends N ? Acc : BuildTuple<N, [...Acc, unknown]>;
type Add<A extends number, B extends number> =
  [...BuildTuple<A>, ...BuildTuple<B>]["length"];
type Sum = Add<3, 4>; // 7

// 6. Generic type-level subtraction
type Subtract<A extends number, B extends number> =
  BuildTuple<A> extends [...BuildTuple<B>, ...infer Rest] ? Rest["length"] : never;
type Diff = Subtract<10, 3>; // 7

// 7. Generic — type-level range as tuple
type Range<N extends number, Acc extends number[] = []> =
  Acc["length"] extends N ? Acc : Range<N, [...Acc, Acc["length"]]>;
type Range5 = Range<5>; // [0, 1, 2, 3, 4]

// 8. Generic — compare two numbers at type level
type LessThan<A extends number, B extends number> =
  BuildTuple<A> extends [...BuildTuple<B>, ...any[]] ? false : true;
type Lt = LessThan<3, 5>; // true

// 9. Generic — type-safe factory with discriminated output
type CreateOutput<K extends "string" | "number" | "boolean"> =
  K extends "string" ? string :
  K extends "number" ? number :
  boolean;
function createDefault<K extends "string" | "number" | "boolean">(
  kind: K
): CreateOutput<K> {
  if (kind === "string") return "" as CreateOutput<K>;
  if (kind === "number") return 0 as CreateOutput<K>;
  return false as CreateOutput<K>;
}

// 10. Generic infer — deep object path type
type Get<T, Path extends string> =
  Path extends `${infer K}.${infer Rest}`
    ? K extends keyof T ? Get<T[K], Rest> : never
    : Path extends keyof T ? T[Path] : never;
type Obj = { a: { b: { c: number } } };
type Deep = Get<Obj, "a.b.c">; // number

// 11. Generic — typed set path value
type Set2<T, Path extends string, Value> =
  Path extends `${infer K}.${infer Rest}`
    ? K extends keyof T
      ? { [P in keyof T]: P extends K ? Set2<T[P], Rest, Value> : T[P] }
      : T
    : Path extends keyof T
    ? { [P in keyof T]: P extends Path ? Value : T[P] }
    : T;

// 12. Generic — variadic function overload via tuple
function zip2<Tuples extends unknown[][]>(
  ...arrays: Tuples
): { [K in keyof Tuples]: Tuples[K] extends (infer E)[] ? E : never }[] {
  const len = Math.min(...arrays.map((a) => a.length));
  return Array.from({ length: len }, (_, i) =>
    arrays.map((a) => a[i])
  ) as any;
}
const zipped = zip2([1, 2, 3], ["a", "b", "c"], [true, false, true]);
// [number, string, boolean][]

// 13. Generic — type-safe functional lens
type Lens<S, A> = { get(s: S): A; set(a: A, s: S): S };
function composeLens<S, A, B>(outer: Lens<S, A>, inner: Lens<A, B>): Lens<S, B> {
  return {
    get: (s) => inner.get(outer.get(s)),
    set: (b, s) => outer.set(inner.set(b, outer.get(s)), s),
  };
}

// 14. Generic — phantom types for unit safety
declare const _unit: unique symbol;
type Quantity<Unit extends string> = number & { [_unit]: Unit };
type Meters = Quantity<"m">;
type Seconds = Quantity<"s">;
type MetersPerSecond = Quantity<"m/s">;
function speed(distance: Meters, time: Seconds): MetersPerSecond {
  return (distance / time) as MetersPerSecond;
}

// 15. Generic — typed state monad
type State<S, A> = (state: S) => [A, S];
function pureState<S, A>(a: A): State<S, A> { return (s) => [a, s]; }
function bindState<S, A, B>(ma: State<S, A>, fn: (a: A) => State<S, B>): State<S, B> {
  return (s) => { const [a, s2] = ma(s); return fn(a)(s2); };
}
function getState<S>(): State<S, S> { return (s) => [s, s]; }
function putState<S>(newState: S): State<S, void> { return (_) => [undefined, newState]; }

// 16. Generic — type-safe proxy handler
function createValidatingProxy<T extends object>(
  target: T,
  validate: <K extends keyof T>(key: K, val: T[K]) => boolean
): T {
  return new Proxy(target, {
    set(obj: T, prop: string | symbol, value: unknown): boolean {
      const key = prop as keyof T;
      if (!validate(key, value as T[typeof key])) return false;
      (obj as any)[prop] = value;
      return true;
    },
  });
}

// 17. Generic — typed observable with operators
interface Observable2<T> {
  subscribe(fn: (val: T) => void): () => void;
  map<U>(fn: (v: T) => U): Observable2<U>;
  filter(pred: (v: T) => boolean): Observable2<T>;
  take(n: number): Observable2<T>;
  merge(other: Observable2<T>): Observable2<T>;
}

// 18. Generic — typed continuation monad
type Cont<R, A> = (k: (a: A) => R) => R;
function returnCont<R, A>(a: A): Cont<R, A> { return (k) => k(a); }
function bindCont<R, A, B>(ma: Cont<R, A>, fn: (a: A) => Cont<R, B>): Cont<R, B> {
  return (k) => ma((a) => fn(a)(k));
}

// 19. Generic — infer deeply nested function signature
type DeepReturnType<T> =
  T extends (...args: any[]) => infer R
    ? R extends (...args: any[]) => any
      ? DeepReturnType<R>
      : R
    : T;
const addN = (a: number) => (b: number) => (c: number) => a + b + c;
type DeepReturn = DeepReturnType<typeof addN>; // number

// 20. Generic — variance controlled containers
class Covariant<out T> {
  constructor(private readonly _val: T) {}
  get value(): T { return this._val; }
}
class Contravariant<in T> {
  private _handler!: (val: T) => void;
  set handler(fn: (val: T) => void) { this._handler = fn; }
}

// 21. Generic — type-safe event sourcing
interface EventStore<Events extends Record<string, unknown>> {
  append<K extends keyof Events>(type: K, payload: Events[K], stream: string): void;
  read<K extends keyof Events>(stream: string, type?: K): Array<{ type: K; payload: Events[K] }>;
  project<State>(
    stream: string,
    initial: State,
    reducer: (s: State, e: { type: keyof Events; payload: Events[keyof Events] }) => State
  ): State;
}

// 22. Generic — typed builder with phase tracking
type BuildPhase = "empty" | "named" | "configured" | "built";
type AllowedTransitions = {
  empty: "named";
  named: "configured";
  configured: "built";
  built: never;
};
class PhasedBuilder<Phase extends BuildPhase> {
  private data: Record<string, unknown> = {};
  transition<To extends AllowedTransitions[Phase]>(
    key: string,
    val: unknown
  ): PhasedBuilder<To> {
    this.data[key] = val;
    return this as unknown as PhasedBuilder<To>;
  }
}

// 23. Generic — typed recursive JSON path setter
function setPath<T extends object>(
  obj: T,
  path: string[],
  value: unknown
): T {
  if (path.length === 0) return value as T;
  const [head, ...tail] = path;
  return { ...obj, [head]: setPath((obj as any)[head] ?? {}, tail, value) };
}

// 24. Generic — type-safe SQL-like query builder
type WhereClause<T> = {
  [K in keyof T]?: T[K] | { $gt: T[K] } | { $lt: T[K] } | { $in: T[K][] };
};
class TypedQuery2<T extends object> {
  private filter: WhereClause<T> = {};
  private sortKey?: keyof T;
  where(clause: WhereClause<T>): this { Object.assign(this.filter, clause); return this; }
  orderBy(key: keyof T): this { this.sortKey = key; return this; }
  toSQL(): string { return JSON.stringify({ filter: this.filter, sort: this.sortKey }); }
}

// 25. Generic — type-safe chain of responsibility
type Handler2<T, R> = (input: T, next: (input: T) => R) => R;
function chain2<T, R>(
  ...handlers: Handler2<T, R>[]
): (input: T, base: (input: T) => R) => R {
  return (input, base) => {
    const fullChain = [...handlers].reverse().reduce(
      (next, handler) => (i: T) => handler(i, next),
      base
    );
    return fullChain(input);
  };
}

// 26. Generic — type-safe environment record
type Env<Schema extends Record<string, string>> = {
  [K in keyof Schema]: string;
};
function parseEnv<Schema extends Record<string, string>>(
  schema: Schema,
  raw: Record<string, string | undefined>
): Env<Schema> {
  const result = {} as Env<Schema>;
  for (const key of Object.keys(schema) as (keyof Schema)[]) {
    const val = raw[key as string];
    if (val === undefined) throw new Error(`Missing env var: ${String(key)}`);
    result[key] = val;
  }
  return result;
}

// 27. Generic — typed graph traversal
type Graph2<Node extends string> = {
  [K in Node]?: Node[];
};
function bfs<Node extends string>(
  graph: Graph2<Node>,
  start: Node
): Node[] {
  const visited = new Set<Node>([start]);
  const queue: Node[] = [start];
  const result: Node[] = [];
  while (queue.length) {
    const node = queue.shift()!;
    result.push(node);
    (graph[node] ?? []).forEach((n) => {
      if (!visited.has(n)) { visited.add(n); queue.push(n); }
    });
  }
  return result;
}

// 28. Generic — typed reactive store
type Selector<State, Result2> = (state: State) => Result2;
type SelectorMap<State, Selectors extends Record<string, Selector<State, any>>> = {
  [K in keyof Selectors]: ReturnType<Selectors[K]>;
};
function createSelectors<State, Selectors extends Record<string, Selector<State, any>>>(
  getState: () => State,
  selectors: Selectors
): () => SelectorMap<State, Selectors> {
  return () =>
    Object.fromEntries(
      Object.entries(selectors).map(([k, sel]) => [k, sel(getState())])
    ) as SelectorMap<State, Selectors>;
}

// 29. Generic — type-safe object validator
type TypeChecks = {
  string: string;
  number: number;
  boolean: boolean;
};
type TypeKey = keyof TypeChecks;
function checkType<K extends TypeKey>(
  val: unknown,
  type: K
): val is TypeChecks[K] {
  return typeof val === type;
}

// 30. Generic — typed union of arrays into single array
type UnpackArrays<T extends unknown[][]> =
  T extends (infer R extends unknown[])[] ? R[number] : never;
type Unpacked = UnpackArrays<[string[], number[], boolean[]]>; // string | number | boolean

// 31. Generic — type-safe recursive pick
type DeepPick<T, Keys extends string> =
  Keys extends `${infer K}.${infer Rest}`
    ? K extends keyof T
      ? { [P in K]: DeepPick<T[P], Rest> }
      : never
    : Keys extends keyof T
    ? { [P in Keys]: T[P] }
    : never;

// 32. Generic — type-safe function composition with arity tracking
type Composable<A, B> = (input: A) => B;
function composeAll<A, B, C>(
  fns: [Composable<A, B>, Composable<B, C>]
): Composable<A, C>;
function composeAll<A, B, C, D>(
  fns: [Composable<A, B>, Composable<B, C>, Composable<C, D>]
): Composable<A, D>;
function composeAll(fns: Composable<any, any>[]): Composable<any, any> {
  return fns.reduce((f, g) => (x) => g(f(x)));
}

// 33. Generic — typed schema inference
type Infer<Schema> =
  Schema extends { _type: infer T } ? T :
  Schema extends { type: "string" } ? string :
  Schema extends { type: "number" } ? number :
  Schema extends { type: "boolean" } ? boolean :
  Schema extends { type: "object"; properties: infer P }
    ? { [K in keyof P]: Infer<P[K]> }
    : Schema extends { type: "array"; items: infer I }
    ? Infer<I>[]
    : never;

// 34. Generic — typed function memoization with TTL
function memoizeWithTTL<T extends (...args: any[]) => any>(
  fn: T,
  ttl: number
): T {
  const cache = new Map<string, { value: ReturnType<T>; expiresAt: number }>();
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.value;
    const value = fn(...args);
    cache.set(key, { value, expiresAt: Date.now() + ttl });
    return value;
  }) as T;
}

// 35. Generic — type-safe serialization
interface Codec<T, S> {
  encode(val: T): S;
  decode(raw: S): T;
  map<U>(encode: (u: U) => T, decode: (t: T) => U): Codec<U, S>;
}

// 36. Generic — type-safe feature flags
type FlagSchema<Flags extends Record<string, boolean>> = {
  [K in keyof Flags]: boolean;
};
class FeatureFlags<Flags extends Record<string, boolean>> {
  constructor(private flags: FlagSchema<Flags>) {}
  isEnabled<K extends keyof Flags>(flag: K): Flags[K] {
    return this.flags[flag] as Flags[K];
  }
  withFlag<K extends string>(key: K, val: boolean): FeatureFlags<Flags & Record<K, boolean>> {
    return new FeatureFlags({ ...this.flags, [key]: val } as any);
  }
}

// 37. Generic — typed version of Array.prototype methods
type TypedArray2<T> = {
  map<U>(fn: (item: T, index: number) => U): TypedArray2<U>;
  filter(pred: (item: T) => boolean): TypedArray2<T>;
  reduce<U>(fn: (acc: U, item: T) => U, init: U): U;
  find(pred: (item: T) => boolean): T | undefined;
  toArray(): T[];
};

// 38. Generic — infer literal union from array
function createEnum<T extends readonly string[]>(
  values: T
): { [K in T[number]]: K } {
  return values.reduce(
    (acc, v) => ({ ...acc, [v]: v }),
    {} as { [K in T[number]]: K }
  );
}
const Status = createEnum(["active", "inactive", "banned"] as const);
type Status = typeof Status[keyof typeof Status]; // "active" | "inactive" | "banned"

// 39. Generic — type-safe partial deep clone
function cloneWith<T extends object, K extends keyof T>(
  obj: T,
  override: Pick<T, K>
): T {
  return { ...obj, ...override };
}

// 40. Generic — indexed access mapped type
type AllValues<T extends Record<string, readonly unknown[]>> = {
  [K in keyof T]: T[K][number];
}[keyof T];
type Config3 = { colors: readonly ["red", "blue"]; sizes: readonly ["sm", "md", "lg"] };
type ConfigValues = AllValues<Config3>; // "red" | "blue" | "sm" | "md" | "lg"

// 41. Generic — type-safe typed builder with required check
type IsComplete<Required extends string, Provided extends string> =
  Exclude<Required, Provided> extends never ? true : false;

// 42. Generic — distributive filter using conditional
type Filter<T, Condition> = T extends Condition ? T : never;
type StringsOnly = Filter<string | number | boolean, string>; // string
type NonNullables<T> = Filter<T, NonNullable<T>>;

// 43. Generic — type-safe subscription with cleanup
function createSubscription<T extends Record<string, unknown>>() {
  type Handlers = { [K in keyof T]?: Set<(data: T[K]) => void> };
  const handlers: Handlers = {};
  return {
    on<K extends keyof T>(event: K, fn: (data: T[K]) => void): () => void {
      (handlers[event] ??= new Set<(data: T[K]) => void>()).add(fn);
      return () => handlers[event]?.delete(fn);
    },
    emit<K extends keyof T>(event: K, data: T[K]): void {
      handlers[event]?.forEach((fn) => fn(data));
    },
  };
}

// 44. Generic — typed immutable record update
type ImmutableRecord<T> = Readonly<T>;
function immutableUpdate<T, K extends keyof T>(
  record: ImmutableRecord<T>,
  key: K,
  value: T[K]
): ImmutableRecord<T> {
  return Object.freeze({ ...record, [key]: value });
}

// 45. Generic — type-level tuple zip
type Zip<A extends unknown[], B extends unknown[]> =
  A extends [infer HA, ...infer TA]
    ? B extends [infer HB, ...infer TB]
      ? [[HA, HB], ...Zip<TA, TB>]
      : []
    : [];
type ZippedTuple = Zip<[1, 2, 3], ["a", "b", "c"]>;
// [[1, "a"], [2, "b"], [3, "c"]]

// 46. Generic — type-safe retry with increasing type specificity
type AttemptResult<T> =
  | { attempt: number; ok: true; value: T }
  | { attempt: number; ok: false; error: Error; retryable: boolean };

// 47. Generic — HKT-based functor laws check
type FunctorLaw1<F, A> = // identity law
  (fa: F) => fa; // map(id) === id
type FunctorLaw2<F, A, B, C> = // composition law
  (fn: (a: A) => B, gn: (b: B) => C) => boolean;

// 48. Generic — type-safe covariant array
function readonlyWrap<T>(arr: T[]): readonly T[] { return arr; }
function covariantIdentity<T>(arr: readonly T[]): readonly T[] { return arr; }
const constArr: readonly string[] = readonlyWrap(["a", "b"]);

// 49. Generic — typed property bag with runtime type check
class TypedBag<Schema extends Record<string, unknown>> {
  private storage = new Map<keyof Schema, Schema[keyof Schema]>();
  set<K extends keyof Schema>(key: K, val: Schema[K]): void {
    this.storage.set(key, val);
  }
  get<K extends keyof Schema>(key: K): Schema[K] | undefined {
    return this.storage.get(key) as Schema[K] | undefined;
  }
}

// 50. Generic — exhaustive discriminated type transformer
type Transform2<T extends { type: string }> = {
  [K in T["type"]]: (val: Extract<T, { type: K }>) => unknown;
};
function applyTransform<T extends { type: string }>(
  val: T,
  transformers: Transform2<T>
): unknown {
  return (transformers as any)[val.type](val);
}
