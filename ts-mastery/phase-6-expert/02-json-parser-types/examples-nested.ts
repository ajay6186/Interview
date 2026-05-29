export {};

// ============================================================
// Phase 6 – Expert: JSON Parser Types — NESTED (1–50)
// ============================================================

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };
type Trim<S extends string> =
  S extends ` ${infer R}` | `\n${infer R}` | `\t${infer R}` ? Trim<R> :
  S extends `${infer L} ` | `${infer L}\n` | `${infer L}\t` ? Trim<L> : S;

// --- 1. Deeply nested JSON type ---
type DeepJson = {
  user: {
    profile: {
      address: { street: string; city: string; zip: string };
      contacts: { type: "email" | "phone"; value: string }[];
    };
    settings: { theme: "light" | "dark"; notifications: boolean };
  };
  meta: { version: number; createdAt: string };
};

// --- 2. Nested JSON path type ---
type NestedPath<T, Prefix extends string = ""> =
  T extends object
    ? T extends (infer U)[]
      ? `${Prefix}[${number}]` | NestedPath<U, `${Prefix}[${number}].`>
      : { [K in keyof T & string]:
            `${Prefix}${K}` | NestedPath<T[K], `${Prefix}${K}.`>
        }[keyof T & string]
    : never;
type N2 = NestedPath<DeepJson>;

// --- 3. Access value at nested path ---
type DeepGet<T, Path extends string> =
  Path extends `${infer K}.${infer Rest}` ? K extends keyof T ? DeepGet<T[K], Rest> : never :
  Path extends `${infer K}[${infer _I}]${infer Rest}` ? K extends keyof T ? T[K] extends (infer U)[] ? DeepGet<U, Trim<Rest extends `.${infer R}` ? R : Rest>> : never : never :
  Path extends keyof T ? T[Path] : never;
type N3 = DeepGet<DeepJson, "user.profile.address.city">; // string

// --- 4. Nested JSON transform ---
type TransformNested<T, From, To> =
  T extends From ? To :
  T extends (infer U)[] ? TransformNested<U, From, To>[] :
  T extends object ? { [K in keyof T]: TransformNested<T[K], From, To> } :
  T;
type N4 = TransformNested<{ a: string; b: { c: string } }, string, number>;
// {a: number; b: {c: number}}

// --- 5. Nested readonly toggle ---
type DeepMutable<T> =
  T extends readonly (infer U)[] ? DeepMutable<U>[] :
  T extends object ? { -readonly [K in keyof T]: DeepMutable<T[K]> } :
  T;
type N5 = DeepMutable<DeepJson>;

// --- 6. Nested required / optional conversion ---
type DeepRequired<T> =
  T extends (infer U)[] ? DeepRequired<U>[] :
  T extends object ? { [K in keyof T]-?: DeepRequired<T[K]> } :
  T;
type DeepPartial<T> =
  T extends (infer U)[] ? DeepPartial<U>[] :
  T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } :
  T;
type N6 = DeepPartial<DeepJson>;

// --- 7. Nested JSON merge ---
type DeepMerge<A, B> =
  A extends object ? B extends object ?
    A extends (infer UA)[] ? B extends (infer UB)[] ? (UA | UB)[] : B :
    B extends unknown[] ? B :
    { [K in keyof A | keyof B]:
        K extends keyof B ? K extends keyof A ? DeepMerge<A[K], B[K]> : B[K] :
        K extends keyof A ? A[K] : never
    }
  : B : B;
type N7 = DeepMerge<{ a: { x: 1 }; b: 2 }, { a: { y: 3 }; c: 4 }>;
// {a:{x:1;y:3}; b:2; c:4}

// --- 8. Nested diff ---
type NestedDiff<A, B> =
  A extends object ? B extends object ? {
    [K in keyof A | keyof B]:
      K extends keyof A ? K extends keyof B ? NestedDiff<A[K], B[K]> : { removed: A[K] } :
      K extends keyof B ? { added: B[K] } : never
  } : { changed: { from: A; to: B } }
  : A extends B ? never : { changed: { from: A; to: B } };
type N8 = NestedDiff<{ a: 1; b: { c: 2 } }, { a: 1; b: { c: 3 }; d: 4 }>;

// --- 9. Nested filter by type ---
type PickByType<T extends object, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K]
};
type OmitByType<T extends object, U> = {
  [K in keyof T as T[K] extends U ? never : K]: T[K]
};
type DeepPickStrings<T extends object> = {
  [K in keyof T]:
    T[K] extends string ? string :
    T[K] extends object ? DeepPickStrings<T[K] extends object ? T[K] : never> :
    never
};
type N9 = DeepPickStrings<{ name: string; age: number; nested: { city: string; count: number } }>;

// --- 10. Nested JSON flattening ---
type FlattenDeep<T extends object, Sep extends string = ".", Prefix extends string = ""> = {
  [K in keyof T & string as
    T[K] extends object
      ? T[K] extends (infer _)[]
        ? `${Prefix}${K}`
        : keyof FlattenDeep<T[K] extends object ? T[K] : Record<string, never>, Sep, `${Prefix}${K}${Sep}`>
      : `${Prefix}${K}`
  ]: T[K] extends object ? T[K] extends (infer _)[] ? T[K] : FlattenDeep<T[K], Sep, `${Prefix}${K}${Sep}`>[keyof FlattenDeep<T[K], Sep, `${Prefix}${K}${Sep}`>] : T[K]
};
type N10 = FlattenDeep<{ a: { b: { c: 1 }; d: 2 }; e: 3 }>;
// {"a.b.c":1; "a.d":2; e:3}

// --- 11. Nested JSON schema builder ---
type BuildSchema<T> =
  T extends null ? { type: "null" } :
  T extends boolean ? { type: "boolean" } :
  T extends number ? { type: "number" } :
  T extends string ? { type: "string" } :
  T extends (infer U)[] ? { type: "array"; items: BuildSchema<U> } :
  T extends object ? {
    type: "object";
    properties: { [K in keyof T]: BuildSchema<T[K]> };
    required: (keyof T & string)[];
  } : { type: "unknown" };
type N11 = BuildSchema<{ user: { name: string; tags: string[] } }>;

// --- 12. Nested JSON codec ---
type Codec<T> = { encode: (v: T) => JsonValue; decode: (j: JsonValue) => T };
type ObjectCodec<T extends Record<string, unknown>> = {
  [K in keyof T]: Codec<T[K]>
};
function objectCodec<T extends Record<string, unknown>>(codecs: ObjectCodec<T>): Codec<T> {
  return {
    encode: v => Object.fromEntries(Object.entries(codecs).map(([k, c]) => [k, (c as Codec<unknown>).encode((v as Record<string, unknown>)[k])])),
    decode: j => Object.fromEntries(Object.entries(codecs).map(([k, c]) => [k, (c as Codec<unknown>).decode((j as Record<string, JsonValue>)[k])])) as T,
  };
}

// --- 13. Nested JSON lens composition ---
type Lens<S, A> = { get: (s: S) => A; set: (s: S, a: A) => S };
function propLens<S, K extends keyof S>(key: K): Lens<S, S[K]> {
  return { get: s => s[key], set: (s, a) => ({ ...s, [key]: a }) };
}
function composeLens<S, A, B>(l1: Lens<S, A>, l2: Lens<A, B>): Lens<S, B> {
  return {
    get: s => l2.get(l1.get(s)),
    set: (s, b) => l1.set(s, l2.set(l1.get(s), b)),
  };
}
type User = { profile: { name: string } };
const profileLens = propLens<User, "profile">("profile");
const nameLens = propLens<User["profile"], "name">("name");
const userNameLens = composeLens(profileLens, nameLens);

// --- 14. Nested JSON validation pipeline ---
type ValidationStep<T> = (value: T) => { ok: true; value: T } | { ok: false; error: string };
function pipeValidations<T>(...steps: ValidationStep<T>[]): ValidationStep<T> {
  return value => {
    for (const step of steps) {
      const result = step(value);
      if (!result.ok) return result;
    }
    return { ok: true, value };
  };
}
const N14_nameValidation = pipeValidations<string>(
  v => v.length > 0 ? { ok: true, value: v } : { ok: false, error: "Empty" },
  v => v.length < 100 ? { ok: true, value: v } : { ok: false, error: "Too long" }
);

// --- 15. Nested JSON query (multi-level) ---
class NestedQuery<T extends JsonValue> {
  constructor(private data: T) {}
  get<K extends keyof T>(key: K): NestedQuery<T[K]> { return new NestedQuery((this.data as Record<string, unknown>)[key as string] as T[K]); }
  value(): T { return this.data; }
  map<U extends JsonValue>(fn: (v: T) => U): NestedQuery<U> { return new NestedQuery(fn(this.data)); }
  filter(pred: (v: T) => boolean): NestedQuery<T | null> {
    return new NestedQuery<T | null>(pred(this.data) ? this.data : null);
  }
}
const N15_q = new NestedQuery({ user: { name: "Alice", age: 30 } }).get("user").get("name").value();

// --- 16. JSON recursive schema type ---
type JsonSchema_ =
  | { type: "string" }
  | { type: "number" }
  | { type: "boolean" }
  | { type: "null" }
  | { type: "array"; items: JsonSchema_ }
  | { type: "object"; properties: Record<string, JsonSchema_>; required?: string[] }
  | { type: "union"; schemas: JsonSchema_[] }
  | { type: "intersection"; schemas: JsonSchema_[] }
  | { type: "ref"; id: string };

// --- 17. Nested JSON aggregate type ---
type Aggregate<T extends JsonValue, State extends JsonValue> = {
  init: State;
  step: (state: State, value: T) => State;
  finalize: (state: State) => JsonValue;
};
const N17_sum: Aggregate<number, number> = {
  init: 0,
  step: (s, v) => s + v,
  finalize: s => s,
};

// --- 18. Nested JSON projections ---
type Projection<T extends object, Keys extends (keyof T)[]> = Pick<T, Keys[number]>;
type ComposedProjection<T extends object, A extends (keyof T)[], B extends (keyof T)[]> =
  Projection<T, A> & Projection<T, B>;
type N18 = ComposedProjection<{ a: 1; b: 2; c: 3 }, ["a"], ["b"]>; // {a:1; b:2}

// --- 19. Deeply nested update path ---
type DeepUpdate<T extends object, Path extends string, Value extends JsonValue> =
  Path extends `${infer K}.${infer Rest}`
    ? K extends keyof T
      ? { [P in keyof T]: P extends K ? T[P] extends object ? DeepUpdate<T[P], Rest, Value> : Value : T[P] }
      : T
    : Path extends keyof T
      ? { [P in keyof T]: P extends Path ? Value : T[P] }
      : T;
type N19 = DeepUpdate<{ a: { b: { c: 1 } }; d: 2 }, "a.b.c", 99>;
// {a:{b:{c:99}}; d:2}

// --- 20. Nested JSON event system ---
type EventMap = {
  "user:created": { id: number; name: string };
  "user:updated": { id: number; changes: Record<string, JsonValue> };
  "order:placed": { orderId: number; userId: number; items: { id: number; qty: number }[] };
};
type EventPayload<E extends keyof EventMap> = EventMap[E];
class EventSystem {
  private handlers: { [K in keyof EventMap]?: ((p: EventMap[K]) => void)[] } = {};
  on<K extends keyof EventMap>(event: K, handler: (payload: EventMap[K]) => void): void {
    (this.handlers[event] ??= []).push(handler);
  }
  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    (this.handlers[event] ?? []).forEach(h => h(payload));
  }
}

// --- 21. Nested JSON form types ---
type FormField<T extends JsonValue> = {
  value: T;
  error?: string;
  touched: boolean;
  dirty: boolean;
};
type FormState<T extends Record<string, JsonValue>> = {
  fields: { [K in keyof T]: FormField<T[K]> };
  isValid: boolean;
  isSubmitting: boolean;
};
type UserForm = FormState<{ name: string; email: string; age: number }>;

// --- 22. Nested JSON type-safe serialization ---
type Serialized<T> =
  T extends null ? "null" :
  T extends boolean ? `${T}` :
  T extends number ? `${T}` :
  T extends string ? `"${string}"` :
  T extends unknown[] ? `[${string}]` :
  T extends object ? `{${string}}` :
  never;
type Deserialized<S extends string> =
  S extends "null" ? null :
  S extends "true" ? true :
  S extends "false" ? false :
  S extends `"${infer V}"` ? V :
  S extends `${infer N extends number}` ? N :
  S extends `[${string}]` ? unknown[] :
  S extends `{${string}}` ? Record<string, unknown> :
  never;

// --- 23. Nested JSON reactive type ---
type ReactiveJson<T extends JsonValue> = {
  value: T;
  subscribe: (listener: (v: T) => void) => () => void;
  update: (fn: (v: T) => T) => void;
};
function reactive<T extends JsonValue>(initial: T): ReactiveJson<T> {
  let value = initial;
  const listeners: ((v: T) => void)[] = [];
  return {
    get value() { return value; },
    subscribe: l => { listeners.push(l); return () => listeners.splice(listeners.indexOf(l), 1); },
    update: fn => { value = fn(value); listeners.forEach(l => l(value)); },
  };
}

// --- 24. Nested JSON data model ---
type ModelField<T extends JsonValue> = {
  type: string;
  required: boolean;
  default?: T;
  validators?: ((v: T) => string | null)[];
};
type DataModel<T extends Record<string, JsonValue>> = {
  [K in keyof T]: ModelField<T[K]>
};
const N24_userModel: DataModel<{ name: string; age: number }> = {
  name: { type: "string", required: true, validators: [v => v.length > 0 ? null : "Required"] },
  age: { type: "number", required: false, default: 0 },
};

// --- 25. Nested JSON CRUD types ---
type CrudOps<T extends Record<string, JsonValue>, PK extends keyof T = "id" & keyof T> = {
  create: (data: Omit<T, PK>) => Promise<T>;
  read: (id: T[PK]) => Promise<T | null>;
  update: (id: T[PK], data: Partial<Omit<T, PK>>) => Promise<T>;
  delete: (id: T[PK]) => Promise<void>;
  list: (filter?: Partial<T>) => Promise<T[]>;
};

// --- 26. Nested JSON tree structure ---
type JsonTree<T extends JsonValue> = {
  value: T;
  children: JsonTree<T>[];
};
function treeMap<T extends JsonValue, U extends JsonValue>(tree: JsonTree<T>, fn: (v: T) => U): JsonTree<U> {
  return { value: fn(tree.value), children: tree.children.map(c => treeMap(c, fn)) };
}
function treeReduce<T extends JsonValue, Acc extends JsonValue>(
  tree: JsonTree<T>, fn: (acc: Acc, v: T) => Acc, init: Acc
): Acc {
  return tree.children.reduce((a, c) => treeReduce(c, fn, a), fn(init, tree.value));
}

// --- 27. Nested JSON visitor pattern ---
type JsonVisitor = {
  visitNull: () => void;
  visitBoolean: (v: boolean) => void;
  visitNumber: (v: number) => void;
  visitString: (v: string) => void;
  visitArray: (v: JsonValue[]) => void;
  visitObject: (v: Record<string, JsonValue>) => void;
};
function visitJson(value: JsonValue, visitor: JsonVisitor): void {
  if (value === null) visitor.visitNull();
  else if (typeof value === "boolean") visitor.visitBoolean(value);
  else if (typeof value === "number") visitor.visitNumber(value);
  else if (typeof value === "string") visitor.visitString(value);
  else if (Array.isArray(value)) visitor.visitArray(value);
  else visitor.visitObject(value as Record<string, JsonValue>);
}

// --- 28. Nested JSON state machine ---
type JsonState = { id: string; data: Record<string, JsonValue> };
type JsonTransition = { from: string; to: string; event: string; guard?: (ctx: JsonValue) => boolean; action?: (ctx: JsonValue) => JsonValue };
class JsonStateMachine {
  private state: JsonState;
  constructor(initial: JsonState, private transitions: JsonTransition[]) { this.state = initial; }
  dispatch(event: string, ctx: JsonValue = null): boolean {
    const t = this.transitions.find(t => t.from === this.state.id && t.event === event && (!t.guard || t.guard(ctx)));
    if (!t) return false;
    const newData = t.action ? t.action(ctx) as Record<string, JsonValue> : this.state.data;
    this.state = { id: t.to, data: newData };
    return true;
  }
  current(): JsonState { return this.state; }
}

// --- 29. Nested JSON mapping over arrays of objects ---
type MapObjects<T extends Record<string, JsonValue>[], F extends { [K in keyof T[number]]?: (v: T[number][K]) => JsonValue }> = {
  [I in keyof T]: {
    [K in keyof T[I]]: K extends keyof F ? F[K] extends (v: T[I][K]) => infer R ? R : T[I][K] : T[I][K]
  }
};

// --- 30. Nested JSON aggregation pipeline ---
type Pipeline<T extends JsonValue[]> = {
  filter: (pred: (v: T[number]) => boolean) => Pipeline<T>;
  map: <U extends JsonValue>(fn: (v: T[number]) => U) => Pipeline<U[]>;
  reduce: <Acc extends JsonValue>(fn: (acc: Acc, v: T[number]) => Acc, init: Acc) => Acc;
  toArray: () => T;
};
function jsonPipeline<T extends JsonValue[]>(data: T): Pipeline<T> {
  return {
    filter: pred => jsonPipeline(data.filter(pred) as T),
    map: fn => jsonPipeline(data.map(fn)) as unknown as Pipeline<ReturnType<typeof fn>[]>,
    reduce: (fn, init) => data.reduce(fn, init),
    toArray: () => data,
  };
}

// --- 31. Nested conditional types based on JSON value ---
type JsonBranch<T extends JsonValue, OnStr, OnNum, OnBool, OnNull, OnArr, OnObj> =
  T extends string ? OnStr :
  T extends number ? OnNum :
  T extends boolean ? OnBool :
  T extends null ? OnNull :
  T extends unknown[] ? OnArr :
  T extends object ? OnObj :
  never;
type N31 = JsonBranch<string, "is-string", "is-number", "is-bool", "is-null", "is-array", "is-object">; // "is-string"

// --- 32. Nested JSON type narrowing ---
function narrowJson<T extends JsonValue>(value: unknown): value is T {
  return value !== undefined;
}
function asString(v: JsonValue): v is string { return typeof v === "string"; }
function asNumber(v: JsonValue): v is number { return typeof v === "number"; }
function asObject(v: JsonValue): v is Record<string, JsonValue> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// --- 33. Nested JSON model with computed properties ---
type WithComputed<T extends Record<string, JsonValue>, C extends Record<string, (t: T) => JsonValue>> = T & {
  readonly [K in keyof C]: ReturnType<C[K]>
};
function withComputed<T extends Record<string, JsonValue>, C extends Record<string, (t: T) => JsonValue>>(
  data: T, computed: C
): WithComputed<T, C> {
  const result = { ...data } as Record<string, unknown>;
  for (const [k, fn] of Object.entries(computed)) {
    Object.defineProperty(result, k, { get: () => fn(data), enumerable: true });
  }
  return result as WithComputed<T, C>;
}

// --- 34. Nested JSON comparison chain ---
type Comparison = "eq" | "lt" | "gt" | "ne";
type CompareExpr = { op: Comparison; left: string; right: JsonValue };
type AndExpr = { op: "and"; exprs: (CompareExpr | AndExpr | OrExpr)[] };
type OrExpr = { op: "or"; exprs: (CompareExpr | AndExpr | OrExpr)[] };
type FilterExpr = CompareExpr | AndExpr | OrExpr;
function evalFilter(expr: FilterExpr, row: Record<string, JsonValue>): boolean {
  if (expr.op === "and") return expr.exprs.every(e => evalFilter(e, row));
  if (expr.op === "or") return expr.exprs.some(e => evalFilter(e, row));
  const left = row[expr.left] ?? null;
  if (expr.op === "eq") return JSON.stringify(left) === JSON.stringify(expr.right);
  if (expr.op === "ne") return JSON.stringify(left) !== JSON.stringify(expr.right);
  if (expr.op === "lt") return typeof left === "number" && typeof expr.right === "number" && left < expr.right;
  if (expr.op === "gt") return typeof left === "number" && typeof expr.right === "number" && left > expr.right;
  return false;
}

// --- 35. Nested JSON with type-level constraints ---
type NonEmptyString = string & { _nonEmpty: true };
type PositiveNumber = number & { _positive: true };
type ConstrainedUser = {
  id: PositiveNumber;
  name: NonEmptyString;
  email: string;
};
function constrainedUser(id: number, name: string, email: string): ConstrainedUser {
  if (id <= 0) throw new Error("id must be positive");
  if (!name) throw new Error("name must be non-empty");
  return { id: id as PositiveNumber, name: name as NonEmptyString, email };
}

// --- 36. Nested JSON observable ---
type Observer<T extends JsonValue> = (value: T, prev: T) => void;
class ObservableJson<T extends JsonValue> {
  private observers: Observer<T>[] = [];
  constructor(private _value: T) {}
  get value(): T { return this._value; }
  set value(v: T) {
    const prev = this._value;
    this._value = v;
    this.observers.forEach(o => o(v, prev));
  }
  observe(o: Observer<T>): () => void {
    this.observers.push(o);
    return () => this.observers.splice(this.observers.indexOf(o), 1);
  }
}

// --- 37. Nested JSON middleware ---
type JsonMiddleware<In extends JsonValue, Out extends JsonValue> = (value: In, next: (v: In) => Out) => Out;
function chain_<In extends JsonValue, Out extends JsonValue>(...mws: JsonMiddleware<In, Out>[]): (v: In) => Out {
  const end: (v: In) => Out = v => v as unknown as Out;
  return mws.reduceRight((next, mw) => v => mw(v, next), end);
}

// --- 38. Nested JSON schema composition ---
type IntersectSchema<A extends Record<string, { type: string }>, B extends Record<string, { type: string }>> = {
  [K in keyof A | keyof B]:
    K extends keyof A & keyof B ? A[K] :
    K extends keyof A ? A[K] :
    K extends keyof B ? B[K] :
    never
};
type N38 = IntersectSchema<{ name: { type: "string" } }, { age: { type: "number" } }>;
// {name:{type:"string"}; age:{type:"number"}}

// --- 39. Nested JSON pagination ---
type Page<T extends JsonValue> = {
  data: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
};
function page<T extends JsonValue>(data: T[], page_: number, pageSize: number, total: number): Page<T> {
  const totalPages = Math.ceil(total / pageSize);
  return { data, pagination: { page: page_, pageSize, total, totalPages, hasNext: page_ < totalPages, hasPrev: page_ > 1 } };
}

// --- 40. Nested JSON dependency graph ---
type DependencyGraph<T extends string> = {
  nodes: T[];
  edges: [T, T][];
  dependsOn: (node: T) => T[];
  dependedBy: (node: T) => T[];
};
function buildGraph<T extends string>(nodes: T[], edges: [T, T][]): DependencyGraph<T> {
  return {
    nodes,
    edges,
    dependsOn: node => edges.filter(([from]) => from === node).map(([, to]) => to),
    dependedBy: node => edges.filter(([, to]) => to === node).map(([from]) => from),
  };
}

// --- 41. Nested JSON type-safe reducer ---
type Action<T extends string, P extends JsonValue> = { type: T; payload: P };
type Reducer<State extends JsonValue, A extends Action<string, JsonValue>> = (state: State, action: A) => State;
function combineReducers<State extends Record<string, JsonValue>, Actions extends Action<string, JsonValue>>(
  reducers: { [K in keyof State]: Reducer<State[K], Actions> }
): Reducer<State, Actions> {
  return (state, action) => {
    const next = { ...state };
    for (const key of Object.keys(reducers)) {
      (next as Record<string, unknown>)[key] = reducers[key as keyof State](state[key as keyof State] as State[keyof State], action);
    }
    return next;
  };
}

// --- 42. Nested JSON type graph ---
type TypeNode =
  | { kind: "primitive"; type: "string" | "number" | "boolean" | "null" }
  | { kind: "array"; items: TypeNode }
  | { kind: "object"; properties: Record<string, TypeNode> }
  | { kind: "union"; types: TypeNode[] }
  | { kind: "literal"; value: JsonValue };
function inferTypeNode(value: JsonValue): TypeNode {
  if (value === null) return { kind: "primitive", type: "null" };
  if (typeof value === "boolean") return { kind: "primitive", type: "boolean" };
  if (typeof value === "number") return { kind: "primitive", type: "number" };
  if (typeof value === "string") return { kind: "primitive", type: "string" };
  if (Array.isArray(value)) return { kind: "array", items: value.length > 0 ? inferTypeNode(value[0]) : { kind: "primitive", type: "null" } };
  return { kind: "object", properties: Object.fromEntries(Object.entries(value as Record<string, JsonValue>).map(([k, v]) => [k, inferTypeNode(v)])) };
}

// --- 43. Nested JSON type-safe storage ---
type StorageKey<T extends JsonValue> = string & { __type: T };
function key<T extends JsonValue>(k: string): StorageKey<T> { return k as StorageKey<T>; }
class TypedStorage {
  set<T extends JsonValue>(key: StorageKey<T>, value: T): void { localStorage.setItem(key, JSON.stringify(value)); }
  get<T extends JsonValue>(key: StorageKey<T>): T | null {
    const v = localStorage.getItem(key);
    return v !== null ? JSON.parse(v) as T : null;
  }
}

// --- 44. Nested JSON type-safe cache ---
class TypedJsonCache<Keys extends Record<string, JsonValue>> {
  private cache: Partial<{ [K in keyof Keys]: { data: Keys[K]; expires: number } }> = {};
  set<K extends keyof Keys>(key: K, value: Keys[K], ttlMs: number): void {
    this.cache[key] = { data: value, expires: Date.now() + ttlMs };
  }
  get<K extends keyof Keys>(key: K): Keys[K] | undefined {
    const e = this.cache[key];
    if (!e || Date.now() > e.expires) return undefined;
    return e.data;
  }
}

// --- 45. Nested JSON type-safe queue ---
class TypedJsonQueue<T extends JsonValue> {
  private queue: T[] = [];
  enqueue(item: T): void { this.queue.push(item); }
  dequeue(): T | undefined { return this.queue.shift(); }
  peek(): T | undefined { return this.queue[0]; }
  size(): number { return this.queue.length; }
  toJSON(): T[] { return [...this.queue]; }
}

// --- 46. Nested JSON type transformer chain ---
type TransformChain<T extends JsonValue, Steps extends ((v: JsonValue) => JsonValue)[]> =
  Steps extends [infer S extends (v: JsonValue) => infer R extends JsonValue, ...infer Rest extends ((v: JsonValue) => JsonValue)[]]
    ? TransformChain<R, Rest>
    : T;

// --- 47. Nested JSON model inheritance ---
type BaseModel = { id: number; createdAt: string; updatedAt: string };
type ExtendModel<T extends Record<string, JsonValue>> = BaseModel & T;
type UserModel = ExtendModel<{ name: string; email: string }>;
type PostModel = ExtendModel<{ title: string; body: string; authorId: number }>;
type CommentModel = ExtendModel<{ body: string; postId: number; authorId: number }>;

// --- 48. Nested JSON collection operations ---
type CollectionOps<T extends Record<string, JsonValue>, K extends keyof T> = {
  groupBy: (key: K) => Record<string, T[]>;
  sortBy: (key: K) => T[];
  distinct: (key: K) => T[K][];
  sumBy: (key: K) => number;
};
function collection<T extends Record<string, JsonValue>, K extends keyof T>(items: T[]): CollectionOps<T, K> {
  return {
    groupBy: key => items.reduce((acc, item) => {
      const k = String(item[key]);
      (acc[k] ??= []).push(item);
      return acc;
    }, {} as Record<string, T[]>),
    sortBy: key => [...items].sort((a, b) => {
      const av = a[key], bv = b[key];
      return typeof av === "number" && typeof bv === "number" ? av - bv :
             String(av) < String(bv) ? -1 : String(av) > String(bv) ? 1 : 0;
    }),
    distinct: key => [...new Set(items.map(i => i[key]))],
    sumBy: key => items.reduce((s, i) => s + (typeof i[key] === "number" ? (i[key] as number) : 0), 0),
  };
}

// --- 49. Nested JSON type-safe builder pattern ---
class JsonBuilder_<T extends Record<string, JsonValue> = {}> {
  constructor(private data: T = {} as T) {}
  set<K extends string, V extends JsonValue>(key: K, value: V): JsonBuilder_<T & Record<K, V>> {
    return new JsonBuilder_({ ...this.data, [key]: value }) as JsonBuilder_<T & Record<K, V>>;
  }
  build(): T { return { ...this.data }; }
}
const N49_user = new JsonBuilder_()
  .set("name", "Alice")
  .set("age", 30)
  .set("roles", ["admin", "user"])
  .build();
type N49_UserType = typeof N49_user; // {name:string, age:number, roles:string[]}

// --- 50. Full nested JSON application state ---
type AppState = {
  auth: {
    user: { id: number; name: string; email: string } | null;
    token: string | null;
    permissions: string[];
  };
  ui: {
    theme: "light" | "dark";
    sidebar: boolean;
    modal: { open: boolean; component: string | null };
  };
  data: {
    users: Record<number, { id: number; name: string }>;
    posts: Record<number, { id: number; title: string; authorId: number }>;
    loading: Record<string, boolean>;
    errors: Record<string, string>;
  };
};
const N50_initialState: AppState = {
  auth: { user: null, token: null, permissions: [] },
  ui: { theme: "light", sidebar: true, modal: { open: false, component: null } },
  data: { users: {}, posts: {}, loading: {}, errors: {} },
};
