export {};

// ============================================================
// NESTED EXAMPLES — Generics (50 Examples)
// ============================================================

// 1. Generic class with nested generic method
class Registry<T extends { id: string }> {
  private items = new Map<string, T>();
  register(item: T): this { this.items.set(item.id, item); return this; }
  get(id: string): T | undefined { return this.items.get(id); }
  getOrCreate<U extends T>(id: string, factory: () => U): U {
    let item = this.items.get(id) as U | undefined;
    if (!item) { item = factory(); this.items.set(id, item); }
    return item;
  }
}

// 2. Nested generic interfaces
interface ApiClient<Endpoints extends Record<string, { req: unknown; res: unknown }>> {
  call<K extends keyof Endpoints>(
    endpoint: K,
    request: Endpoints[K]["req"]
  ): Promise<Endpoints[K]["res"]>;
}

// 3. Generic class with generic nested property
class Graph<Node, Edge> {
  nodes: Node[] = [];
  edges: Array<{ from: Node; to: Node; data: Edge }> = [];
  addNode(n: Node): this { this.nodes.push(n); return this; }
  addEdge(from: Node, to: Node, data: Edge): this {
    this.edges.push({ from, to, data });
    return this;
  }
}

// 4. Generic function with nested conditional type
type Nested<T, Depth extends number> =
  Depth extends 0 ? T : { value: Nested<T, Depth extends 1 ? 0 : 1> };
type D0 = Nested<string, 0>; // string
type D1 = Nested<string, 1>; // { value: string }

// 5. Deeply nested generic result
type Result<T, E = Error> =
  | { ok: true; value: T; meta?: { source: string; timing: number } }
  | { ok: false; error: E; code?: number; retryable?: boolean };

function succeed<T>(value: T, meta?: { source: string; timing: number }): Result<T> {
  return { ok: true, value, meta };
}
function fail<T, E extends Error>(error: E, code?: number): Result<T, E> {
  return { ok: false, error, code };
}

// 6. Generic type with nested mapped properties
type ApiSchema<T> = {
  [K in keyof T]: {
    endpoint: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    input: T[K] extends { req: infer R } ? R : never;
    output: T[K] extends { res: infer S } ? S : never;
  };
};

// 7. Nested generic with recursive constraint
interface Tree<T extends { id: number }> {
  node: T;
  children: Tree<T>[];
}
function mapTree<T extends { id: number }, U extends { id: number }>(
  tree: Tree<T>,
  fn: (node: T) => U
): Tree<U> {
  return { node: fn(tree.node), children: tree.children.map((c) => mapTree(c, fn)) };
}

// 8. Generic nested builder accumulation
class Query<T extends object, Selected extends Partial<T> = T> {
  private wheres: string[] = [];
  private limitVal?: number;
  select<K extends keyof T>(...keys: K[]): Query<T, Pick<T, K>> {
    return this as unknown as Query<T, Pick<T, K>>;
  }
  where(condition: string): this { this.wheres.push(condition); return this; }
  limit(n: number): this { this.limitVal = n; return this; }
  build(): { sql: string; type: Selected } {
    let sql = `SELECT * FROM table`;
    if (this.wheres.length) sql += ` WHERE ${this.wheres.join(" AND ")}`;
    if (this.limitVal) sql += ` LIMIT ${this.limitVal}`;
    return { sql, type: {} as Selected };
  }
}

// 9. Generic class with factory methods
class Option<T> {
  private constructor(private readonly _some: boolean, private readonly _val?: T) {}
  static some<T>(val: T): Option<T> { return new Option(true, val); }
  static none<T>(): Option<T> { return new Option<T>(false); }
  isSome(): this is Option<T> & { _val: T } { return this._some; }
  isNone(): boolean { return !this._some; }
  map<U>(fn: (v: T) => U): Option<U> {
    return this.isSome() ? Option.some(fn(this._val!)) : Option.none<U>();
  }
  flatMap<U>(fn: (v: T) => Option<U>): Option<U> {
    return this.isSome() ? fn(this._val!) : Option.none<U>();
  }
  getOrElse(fallback: T): T { return this.isSome() ? this._val! : fallback; }
  orElse(alternative: Option<T>): Option<T> { return this.isSome() ? this : alternative; }
}

// 10. Generic with nested generic array operations
function flatMapGeneric<T, U>(arr: T[], fn: (item: T) => U[]): U[] {
  return arr.reduce<U[]>((acc, item) => [...acc, ...fn(item)], []);
}
const words = flatMapGeneric(["hello world", "foo bar"], (s) => s.split(" "));

// 11. Nested generics — typed state machine
type StateConfig<State extends string, Event extends string, Context extends object> = {
  initial: State;
  context: Context;
  states: {
    [S in State]: {
      on?: { [E in Event]?: State | { target: State; action?: (ctx: Context, event: E) => Context } };
    };
  };
};

// 12. Generic with nested function parameter types
function createMiddleware<
  Req extends object,
  Res extends object,
  Next extends () => Promise<void> = () => Promise<void>
>(
  handler: (req: Req, res: Res, next: Next) => Promise<void>
): (req: Req, res: Res, next: Next) => Promise<void> {
  return handler;
}

// 13. Generic — type-safe ORM model
type ModelDef<Fields extends Record<string, unknown>> = {
  fields: Fields;
  relations?: Record<string, { type: "hasOne" | "hasMany"; model: string }>;
};
type Model<Def extends ModelDef<any>> = Def["fields"] & {
  id: number;
  createdAt: Date;
  updatedAt: Date;
};

// 14. Nested generic extends constraints
function mapNestedArrays<T, U>(
  arr: T[][],
  fn: (item: T, row: number, col: number) => U
): U[][] {
  return arr.map((row, i) => row.map((item, j) => fn(item, i, j)));
}

// 15. Generic recursive flatten
type DeepFlatten<T> =
  T extends Array<infer E>
    ? E extends Array<any>
      ? DeepFlatten<E>
      : E
    : T;
type Flat = DeepFlatten<string[][][]>; // string

// 16. Generic — nested promise chain with types
async function chainPromises<A, B, C>(
  start: A,
  step1: (a: A) => Promise<B>,
  step2: (b: B) => Promise<C>
): Promise<C> {
  return step2(await step1(start));
}

// 17. Generic — typed pipeline with generics flowing through
type Pipeline<In, Out> = (input: In) => Out;
function compose<A, B, C>(
  f: Pipeline<B, C>,
  g: Pipeline<A, B>
): Pipeline<A, C> {
  return (a) => f(g(a));
}
const process = compose(
  (n: number) => n.toFixed(2),
  (s: string) => parseInt(s, 10)
);

// 18. Generic — infer from mapped value
type ValueOf<T extends Record<string, unknown>> = T[keyof T];
type EventPayload = { click: { x: number }; keydown: { key: string } };
type AnyPayload = ValueOf<EventPayload>; // { x: number } | { key: string }

// 19. Generic — flatten union to array type
type UnionToArray<T> = T extends any ? [T] : never;
type StrUnion = "a" | "b" | "c";
type StrArrs = UnionToArray<StrUnion>; // ["a"] | ["b"] | ["c"]

// 20. Generic class with multiple generic dependencies
class Transformer<Input, Output, Config extends object = {}> {
  constructor(private config: Config) {}
  transform(input: Input, fn: (input: Input, config: Config) => Output): Output {
    return fn(input, this.config);
  }
}

// 21. Nested generic — typed cursor/iterator
class TypedIterator<T> {
  private index = 0;
  constructor(private items: T[]) {}
  hasNext(): boolean { return this.index < this.items.length; }
  next(): T { return this.items[this.index++]; }
  peek(): T | undefined { return this.items[this.index]; }
  reset(): void { this.index = 0; }
  map<U>(fn: (item: T) => U): TypedIterator<U> {
    return new TypedIterator(this.items.map(fn));
  }
}

// 22. Generic — nested data transformation
function transformTree<T extends object, U extends object>(
  data: T,
  transformers: {
    [K in keyof T]?: T[K] extends object[] ? (arr: T[K]) => U[] : (val: T[K]) => U[keyof U];
  }
): object {
  const result: any = {};
  for (const key of Object.keys(data) as (keyof T)[]) {
    result[key] = transformers[key] ? (transformers[key] as Function)(data[key]) : data[key];
  }
  return result;
}

// 23. Generic — deeply nested generic constraint
function traverseObject<T extends Record<string, unknown>>(
  obj: T,
  visitor: <K extends keyof T>(key: K, value: T[K]) => void
): void {
  for (const key of Object.keys(obj) as (keyof T)[]) {
    visitor(key, obj[key]);
  }
}

// 24. Generic — typed form builder with validation
type FieldValidator<T> = (val: T) => string | null;
class TypedForm<Fields extends Record<string, unknown>> {
  private validators: { [K in keyof Fields]?: FieldValidator<Fields[K]> } = {};
  private values: Partial<Fields> = {};
  addField<K extends keyof Fields>(
    key: K,
    validator: FieldValidator<Fields[K]>
  ): this {
    this.validators[key] = validator;
    return this;
  }
  setValue<K extends keyof Fields>(key: K, val: Fields[K]): this {
    this.values[key] = val;
    return this;
  }
  validate(): { [K in keyof Fields]?: string } {
    const errors: { [K in keyof Fields]?: string } = {};
    for (const key of Object.keys(this.validators) as (keyof Fields)[]) {
      const err = this.validators[key]?.(this.values[key] as Fields[keyof Fields]);
      if (err) errors[key] = err;
    }
    return errors;
  }
}

// 25. Generic — type-safe container operations
class Container2<T> {
  constructor(private val: T) {}
  map<U>(fn: (v: T) => U): Container2<U> { return new Container2(fn(this.val)); }
  flatMap<U>(fn: (v: T) => Container2<U>): Container2<U> { return fn(this.val); }
  zip<U>(other: Container2<U>): Container2<[T, U]> {
    return new Container2([this.val, other.val] as [T, U]);
  }
  value(): T { return this.val; }
}

// 26. Generic — typed dependency injection
type Provider<T> = () => T;
class DI<Services extends Record<string, unknown>> {
  private providers: { [K in keyof Services]?: Provider<Services[K]> } = {};
  register<K extends keyof Services>(key: K, provider: Provider<Services[K]>): this {
    this.providers[key] = provider;
    return this;
  }
  resolve<K extends keyof Services>(key: K): Services[K] {
    const provider = this.providers[key];
    if (!provider) throw new Error(`No provider for ${String(key)}`);
    return provider();
  }
}

// 27. Nested generic — typed event bus with namespacing
type NamespacedEvents<NS extends string, Events extends Record<string, unknown>> = {
  [K in keyof Events as `${NS}:${string & K}`]: Events[K];
};
type AuthEvents = NamespacedEvents<"auth", {
  login: { userId: number };
  logout: void;
}>;
// "auth:login": { userId: number }; "auth:logout": void

// 28. Generic — typed aggregate root (DDD)
class AggregateRoot<State extends object, Events extends Record<string, unknown>> {
  protected state: State;
  private domainEvents: Array<{ [K in keyof Events]: { type: K; payload: Events[K] } }[keyof Events]> = [];
  constructor(initialState: State) { this.state = initialState; }
  protected addEvent<K extends keyof Events>(type: K, payload: Events[K]): void {
    this.domainEvents.push({ type, payload } as any);
  }
  flushEvents() { const events = [...this.domainEvents]; this.domainEvents = []; return events; }
}

// 29. Generic — nested recursive mapped type
type Paths<T> = T extends object
  ? { [K in keyof T & string]: K | `${K}.${Paths<T[K]>}` }[keyof T & string]
  : never;
type ObjPaths = Paths<{ a: { b: { c: string } }; d: number }>;
// "a" | "a.b" | "a.b.c" | "d"

// 30. Generic — typed recursive merge
type DeepMerge<A extends object, B extends object> = Omit<A, keyof B> & {
  [K in keyof B]: K extends keyof A
    ? A[K] extends object
      ? B[K] extends object
        ? DeepMerge<A[K], B[K]>
        : B[K]
      : B[K]
    : B[K];
};
type Merged = DeepMerge<{ a: string; b: { x: number } }, { b: { y: boolean }; c: string }>;

// 31. Generic — typed cursor for pagination
class Cursor<T> {
  constructor(
    private items: T[],
    private pos = 0,
    private pageSize = 10
  ) {}
  hasMore(): boolean { return this.pos < this.items.length; }
  next(): { items: T[]; cursor: string } {
    const page = this.items.slice(this.pos, this.pos + this.pageSize);
    this.pos += this.pageSize;
    return { items: page, cursor: Buffer.from(String(this.pos)).toString("base64") };
  }
}

// 32. Generic — typed command handler chain
interface CommandHandler<Cmd, Result2> {
  handle(cmd: Cmd): Promise<Result2>;
  setNext(handler: CommandHandler<Cmd, Result2>): CommandHandler<Cmd, Result2>;
}

// 33. Generic — typed record transformer
function transformRecord<
  K extends string,
  V,
  V2
>(
  record: Record<K, V>,
  fn: (key: K, val: V) => V2
): Record<K, V2> {
  return Object.fromEntries(
    Object.entries<V>(record).map(([k, v]) => [k, fn(k as K, v)])
  ) as Record<K, V2>;
}

// 34. Generic — type-safe route handler
type RouteParams<Path extends string> =
  Path extends `${string}:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof RouteParams<Rest>]: string }
    : Path extends `${string}:${infer Param}`
    ? { [K in Param]: string }
    : {};
function createHandler<Path extends string>(
  path: Path,
  handler: (params: RouteParams<Path>, query: Record<string, string>) => Response
): { path: Path; handler: typeof handler } {
  return { path, handler };
}

// 35. Generic — conditional mapped type (transform values)
type TransformValues<T, From, To> = {
  [K in keyof T]: T[K] extends From ? To : T[K];
};
type NullToUndefined<T> = TransformValues<T, null, undefined>;
type User2 = { name: string | null; age: number | null };
type CleanUser = NullToUndefined<User2>; // { name: string | undefined; age: number | undefined }

// 36. Generic — typed runtime schema builder
type RuntimeSchema<T> = {
  [K in keyof T]: {
    type: T[K] extends string ? "string" : T[K] extends number ? "number" : "unknown";
    required: boolean;
  };
};

// 37. Generic — typed lazy tree builder
function lazy2<T>(creator: () => T): { get(): T } {
  let val: T | undefined;
  return { get: () => (val ??= creator()) };
}
const expensiveTree = lazy2(() => buildLargeTree(10));
function buildLargeTree(depth: number): { depth: number } { return { depth }; }

// 38. Generic — accumulate types in recursive type
type Flatten2<T extends unknown[]> =
  T extends [infer Head, ...infer Tail]
    ? Head extends unknown[]
      ? [...Flatten2<Head>, ...Flatten2<Tail>]
      : [Head, ...Flatten2<Tail>]
    : [];
type Flattened = Flatten2<[[1, 2], [3, [4, 5]], 6]>; // [1, 2, 3, 4, 5, 6]

// 39. Generic — typed diff of arrays
function arrayDiff<T>(a: T[], b: T[]): { added: T[]; removed: T[] } {
  const setA = new Set(a);
  const setB = new Set(b);
  return {
    added: b.filter((v) => !setA.has(v)),
    removed: a.filter((v) => !setB.has(v)),
  };
}

// 40. Generic — typed audit logger
interface AuditEntry<Action extends string, Entity extends object> {
  action: Action;
  entity: Entity;
  userId: number;
  timestamp: Date;
}
class AuditLog<Entity extends { id: number }> {
  private entries: AuditEntry<string, Entity>[] = [];
  log<A extends string>(action: A, entity: Entity, userId: number): void {
    this.entries.push({ action, entity, userId, timestamp: new Date() });
  }
  getByAction<A extends string>(action: A): Array<AuditEntry<A, Entity>> {
    return this.entries.filter((e) => e.action === action) as Array<AuditEntry<A, Entity>>;
  }
}

// 41. Generic — typed array with guaranteed elements
type NonEmptyArray<T> = [T, ...T[]];
function first2<T>(arr: NonEmptyArray<T>): T { return arr[0]; }
const ne: NonEmptyArray<number> = [1, 2, 3];
const f2 = first2(ne); // always number, not number | undefined

// 42. Generic — create typed API response wrapper
function createResponse<T>(
  data: T,
  options: { status?: number; headers?: Record<string, string> } = {}
): { data: T; status: number; headers: Record<string, string> } {
  return { data, status: options.status ?? 200, headers: options.headers ?? {} };
}

// 43. Generic — typed schema with default values
type WithDefaults<Schema, Defaults extends Partial<Schema>> =
  Omit<Schema, keyof Defaults> & Required<Pick<Schema, keyof Defaults & keyof Schema>>;

// 44. Generic — function with optional generic trailing argument
function withOptions<T, Options extends object = {}>(
  fn: (options: Options) => T,
  defaultOptions: Options
): (options?: Partial<Options>) => T {
  return (opts) => fn({ ...defaultOptions, ...opts } as Options);
}

// 45. Generic — typed table/matrix operations
class Matrix2<T> {
  constructor(private data: T[][], public rows: number, public cols: number) {}
  get(r: number, c: number): T { return this.data[r][c]; }
  map<U>(fn: (val: T, r: number, c: number) => U): Matrix2<U> {
    return new Matrix2(
      this.data.map((row, r) => row.map((val, c) => fn(val, r, c))),
      this.rows,
      this.cols
    );
  }
}

// 46. Generic — exhaustive map over discriminated union
type ShapeArea = {
  circle: (s: { radius: number }) => number;
  square: (s: { side: number }) => number;
};
function matchShape<K extends keyof ShapeArea>(
  kind: K,
  shape: Parameters<ShapeArea[K]>[0],
  handlers: ShapeArea
): number {
  return (handlers[kind] as (s: any) => number)(shape);
}

// 47. Generic — complex type-threaded pipeline
class TypedPipeline<In, Out = In> {
  private steps: Array<(val: any) => any> = [];
  pipe<Next>(fn: (val: Out) => Next): TypedPipeline<In, Next> {
    const next = new TypedPipeline<In, Next>();
    next.steps = [...this.steps, fn];
    return next;
  }
  run(input: In): Out {
    return this.steps.reduce((acc, fn) => fn(acc), input as any);
  }
}
const pl = new TypedPipeline<string>()
  .pipe((s: string) => s.trim())
  .pipe((s) => s.length)
  .pipe((n) => n > 3);
const out = pl.run("  hello  "); // boolean

// 48. Generic — typed sparse array
class SparseArray<T> {
  private data: Map<number, T> = new Map();
  set(index: number, val: T): void { this.data.set(index, val); }
  get(index: number): T | undefined { return this.data.get(index); }
  toArray(length: number, defaultVal: T): T[] {
    return Array.from({ length }, (_, i) => this.data.get(i) ?? defaultVal);
  }
}

// 49. Generic — typed decorator with payload
function withPayload<T extends object, P>(
  value: T,
  payload: P
): T & { __payload: P } {
  return { ...value, __payload: payload };
}

// 50. Generic — typed range with step
function* range3<T extends number>(
  start: T,
  end: T,
  step: number = 1
): Generator<number> {
  for (let i = start; i < end; i += step) yield i;
}
const r = [...range3(0, 10, 2)]; // [0, 2, 4, 6, 8]
