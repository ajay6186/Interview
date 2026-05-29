export {};

// ============================================================
// Phase 6 – Expert: JSON Parser Types — ADVANCED (1–50)
// ============================================================

// Helpers
type Trim<S extends string> =
  S extends ` ${infer R}` | `\n${infer R}` | `\t${infer R}` ? Trim<R> :
  S extends `${infer L} ` | `${infer L}\n` | `${infer L}\t` ? Trim<L> : S;

// --- 1. Full JSON type parser — null ---
type ParseValue<S extends string> =
  Trim<S> extends "null" ? null :
  Trim<S> extends "true" ? true :
  Trim<S> extends "false" ? false :
  Trim<S> extends `"${infer Inner}"` ? Inner :
  Trim<S> extends `${infer N extends number}` ? N :
  Trim<S> extends `[${infer Inner}]` ? ParseArray<Inner> :
  Trim<S> extends `{${infer Inner}}` ? ParseObject<Inner> :
  unknown;

// --- 2. Parse JSON array contents ---
type ParseArray<S extends string, Acc extends unknown[] = []> =
  Trim<S> extends "" ? Acc :
  SplitFirst<Trim<S>> extends [infer First extends string, infer Rest extends string]
    ? ParseArray<Trim<Rest>, [...Acc, ParseValue<Trim<First>>]>
    : [...Acc, ParseValue<Trim<S>>];

// --- 3. Split on first top-level comma ---
type SplitFirst<S extends string, Depth extends number = 0, Acc extends string = ""> =
  S extends `${infer C}${infer Rest}`
    ? C extends "{" | "[" ? SplitFirst<Rest, Inc<Depth>, `${Acc}${C}`>
    : C extends "}" | "]" ? SplitFirst<Rest, Dec<Depth>, `${Acc}${C}`>
    : C extends "," ? Depth extends 0 ? [Acc, Rest] : SplitFirst<Rest, Depth, `${Acc}${C}`>
    : SplitFirst<Rest, Depth, `${Acc}${C}`>
    : never;
type Inc<N extends number> = [1,2,3,4,5,6,7,8,9,10][N extends 0|1|2|3|4|5|6|7|8|9 ? N : 9];
type Dec<N extends number> = [0,0,1,2,3,4,5,6,7,8][N extends 0|1|2|3|4|5|6|7|8|9 ? N : 0];

// --- 4. Parse JSON object contents ---
type ParseObject<S extends string, Acc extends Record<string, unknown> = {}> =
  Trim<S> extends "" ? Acc :
  SplitFirst<Trim<S>> extends [infer Pair extends string, infer Rest extends string]
    ? ParsePair<Trim<Pair>> extends [infer K extends string, infer V]
      ? ParseObject<Trim<Rest>, Acc & Record<K, V>>
      : Acc
    : ParsePair<Trim<S>> extends [infer K extends string, infer V]
      ? Acc & Record<K, V>
      : Acc;
type ParsePair<S extends string> =
  S extends `"${infer K}":${infer V}` ? [K, ParseValue<Trim<V>>] : never;

// --- 5. Round-trip type test ---
type A5_Parsed = ParseValue<'{"name":"Alice","age":30,"active":true}'>; // {name:"Alice",age:30,active:true}
type A5_Array = ParseValue<'[1,2,3]'>; // [1,2,3]
type A5_Null = ParseValue<"null">; // null

// --- 6. Type-level JSON schema validator ---
type JsonValue_ = string | number | boolean | null | JsonValue_[] | { [k: string]: JsonValue_ };
type Schema =
  | { type: "string"; minLength?: number; maxLength?: number; pattern?: string }
  | { type: "number"; min?: number; max?: number }
  | { type: "boolean" }
  | { type: "null" }
  | { type: "array"; items: Schema }
  | { type: "object"; properties: Record<string, Schema>; required?: string[] };
type ValidateSchema<S extends Schema, V extends JsonValue_> =
  S extends { type: "string" } ? V extends string ? V : never :
  S extends { type: "number" } ? V extends number ? V : never :
  S extends { type: "boolean" } ? V extends boolean ? V : never :
  S extends { type: "null" } ? V extends null ? V : never :
  S extends { type: "array" } ? V extends unknown[] ? V : never :
  S extends { type: "object" } ? V extends object ? V : never :
  never;

// --- 7. Typed JSON patch (RFC 6902) at type level ---
type PatchResult<T extends object, Op extends { op: string; path: string; value?: JsonValue_ }> =
  Op extends { op: "add"; path: `/${infer K}`; value: infer V }
    ? T & Record<K, V>
    : Op extends { op: "remove"; path: `/${infer K extends keyof T & string}` }
      ? Omit<T, K>
      : Op extends { op: "replace"; path: `/${infer K extends keyof T & string}`; value: infer V }
        ? Omit<T, K> & Record<K, V>
        : T;
type A7 = PatchResult<{ name: string; age: number }, { op: "remove"; path: "/age" }>;
// {name: string}

// --- 8. JSON difference type (structural) ---
type Diff<A extends object, B extends object> = {
  added: { [K in Exclude<keyof B, keyof A>]: B[K] };
  removed: { [K in Exclude<keyof A, keyof B>]: A[K] };
  changed: { [K in keyof A & keyof B as A[K] extends B[K] ? B[K] extends A[K] ? never : K : K]: { from: A[K]; to: B[K] } };
};
type A8 = Diff<{ a: 1; b: 2 }, { b: 3; c: 4 }>;

// --- 9. JSON type inference with discriminant ---
type Discriminated<D extends Record<string, Schema>> = {
  [T in keyof D]: { type: T } & { [K in keyof D[T] as K extends "type" ? never : K]: D[T][K] }
}[keyof D];
type EventSchemas = Discriminated<{
  click: { x: number; y: number };
  keydown: { key: string; ctrl: boolean };
}>;

// --- 10. Deep readonly JSON type ---
type DeepReadonly<T> =
  T extends (infer U)[] ? readonly DeepReadonly<U>[] :
  T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } :
  T;
type A10 = DeepReadonly<{ user: { posts: { id: number }[] } }>;

// --- 11. Type-safe JSON selector (like JMESPath) ---
type Select<T, S extends string> =
  S extends `${infer K}.${infer Rest}` ? K extends keyof T ? Select<T[K], Rest> : never :
  S extends keyof T ? T[S] :
  S extends `[${infer I extends number}]` ? T extends (infer U)[] ? U : never :
  never;
type A11 = Select<{ users: { name: string }[] }, "users">; // {name:string}[]

// --- 12. JSON schema code generator ---
type GenCode<S extends Schema> =
  S extends { type: "string" } ? "string" :
  S extends { type: "number" } ? "number" :
  S extends { type: "boolean" } ? "boolean" :
  S extends { type: "null" } ? "null" :
  S extends { type: "array"; items: infer I extends Schema } ? `${GenCode<I>}[]` :
  S extends { type: "object"; properties: infer P extends Record<string, Schema> }
    ? `{${GenObjectCode<P>}}` : "unknown";
type GenObjectCode<P extends Record<string, Schema>> =
  { [K in keyof P & string]: `${K}:${GenCode<P[K]>}` }[keyof P & string];

// --- 13. JSON API contract type ---
type ApiContract<Req extends object, Res extends JsonValue_> = {
  request: Req;
  response: Res;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
};
type UserApi = ApiContract<{ name: string }, { id: number; name: string }>;

// --- 14. Typed HTTP client from contract ---
type Client<C extends ApiContract<object, JsonValue_>> = {
  fetch: (req: C["request"]) => Promise<C["response"]>;
};
function createClient<C extends ApiContract<object, JsonValue_>>(
  contract: C,
  baseUrl: string
): Client<C> {
  return {
    fetch: async req => {
      const res = await fetch(`${baseUrl}${contract.path}`, {
        method: contract.method,
        body: contract.method !== "GET" ? JSON.stringify(req) : undefined,
      });
      return res.json();
    },
  };
}

// --- 15. JSON model versioning ---
type V1User = { id: number; name: string };
type V2User = { id: number; name: string; email: string };
type Migration<From, To> = (from: From) => To;
const migrateUser: Migration<V1User, V2User> = u => ({ ...u, email: "" });

// --- 16. Type-safe JSON store ---
class JsonStore<T extends Record<string, JsonValue_>> {
  private data: Partial<T> = {};
  set<K extends keyof T>(key: K, value: T[K]): void { this.data[key] = value; }
  get<K extends keyof T>(key: K): T[K] | undefined { return this.data[key]; }
  has(key: keyof T): boolean { return key in this.data; }
  toJSON(): string { return JSON.stringify(this.data); }
}
const A16_store = new JsonStore<{ user: V2User; settings: { theme: string } }>();

// --- 17. JSON virtual DOM (type-only) ---
type VNodeType = string | ((props: Record<string, JsonValue_>) => VNode);
type VNode = { type: VNodeType; props: Record<string, JsonValue_>; children: VNode[] };
function h(type: string, props: Record<string, JsonValue_>, ...children: VNode[]): VNode {
  return { type, props, children };
}
const A17_vnode = h("div", { class: "container" }, h("span", {}, h("p", {}, )));

// --- 18. JSON template engine (type-level) ---
type FillTemplate<T extends string, Vars extends Record<string, string>> =
  T extends `${infer Before}{{${infer Key}}}${infer After}`
    ? Key extends keyof Vars
      ? FillTemplate<`${Before}${Vars[Key]}${After}`, Vars>
      : FillTemplate<`${Before}${After}`, Vars>
    : T;
type A18 = FillTemplate<"Hello, {{name}}! You are {{age}} years old.", { name: "Alice"; age: "30" }>;
// "Hello, Alice! You are 30 years old."

// --- 19. GraphQL query type inference ---
type GqlFields<T extends string> =
  T extends `${infer F} ${infer Rest}` ? F | GqlFields<Rest> :
  T extends `${infer F}` ? F : never;
type GqlQuery<Fields extends string, T extends Record<string, unknown>> = {
  [K in GqlFields<Fields> as K extends keyof T ? K : never]: K extends keyof T ? T[K] : never
};
type A19 = GqlQuery<"id name email", { id: number; name: string; email: string; password: string }>;
// {id: number; name: string; email: string}

// --- 20. JSON CRDT (Conflict-free Replicated Data Type) entry ---
type CrdtEntry<T extends JsonValue_> = {
  value: T;
  timestamp: number;
  nodeId: string;
};
type CrdtState<T extends Record<string, JsonValue_>> = {
  [K in keyof T]: CrdtEntry<T[K]>
};
function crdtMerge<T extends JsonValue_>(a: CrdtEntry<T>, b: CrdtEntry<T>): CrdtEntry<T> {
  return a.timestamp >= b.timestamp ? a : b;
}

// --- 21. JSON stream parser (chunked) ---
class JsonStreamParser {
  private buffer = "";
  push(chunk: string): JsonValue_[] {
    this.buffer += chunk;
    const results: JsonValue_[] = [];
    let start = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      if (this.buffer[i] === "\n") {
        const line = this.buffer.slice(start, i).trim();
        if (line) { try { results.push(JSON.parse(line)); } catch {} }
        start = i + 1;
      }
    }
    this.buffer = this.buffer.slice(start);
    return results;
  }
}

// --- 22. JSON serializer with hooks ---
type SerializeHook<T> = { before?: (v: T) => T; after?: (s: string) => string };
function hookStringify<T extends JsonValue_>(value: T, hooks: SerializeHook<T> = {}): string {
  const v = hooks.before ? hooks.before(value) : value;
  const s = JSON.stringify(v);
  return hooks.after ? hooks.after(s) : s;
}

// --- 23. JSON normalizer ---
type Normalize<T extends JsonValue_> = T extends object
  ? T extends (infer U)[]
    ? Normalize<U>[]
    : { [K in keyof T]: Normalize<T[K]> }
  : T extends null ? null : T;
function normalize<T extends JsonValue_>(v: T): Normalize<T> {
  return v as Normalize<T>;
}

// --- 24. JSON content hash ---
function jsonHash(v: JsonValue_): string {
  const sorted = JSON.stringify(v, (_, val) =>
    typeof val === "object" && val !== null && !Array.isArray(val)
      ? Object.fromEntries(Object.entries(val as Record<string, unknown>).sort())
      : val
  );
  let h = 0;
  for (const c of sorted) { h = (Math.imul(31, h) + c.charCodeAt(0)) | 0; }
  return h.toString(16);
}

// --- 25. JSON index builder ---
class JsonIndex<T extends Record<string, JsonValue_>> {
  private index = new Map<string, Set<T>>();
  add(key: keyof T & string, value: T[keyof T], record: T): void {
    const k = `${key}:${JSON.stringify(value)}`;
    if (!this.index.has(k)) this.index.set(k, new Set());
    this.index.get(k)!.add(record);
  }
  find(key: keyof T & string, value: T[keyof T]): T[] {
    return [...(this.index.get(`${key}:${JSON.stringify(value)}`) ?? [])];
  }
}

// --- 26. Type-safe JSON protocol buffer (mock) ---
type ProtoField = { number: number; type: "string" | "int32" | "bool" | "bytes"; repeated?: boolean };
type ProtoMessage<Fields extends Record<string, ProtoField>> = {
  [K in keyof Fields]: Fields[K]["repeated"] extends true
    ? Fields[K]["type"] extends "string" ? string[]
    : Fields[K]["type"] extends "int32" ? number[]
    : boolean[]
    : Fields[K]["type"] extends "string" ? string
    : Fields[K]["type"] extends "int32" ? number
    : boolean
};
type A26_User = ProtoMessage<{
  name: { number: 1; type: "string" };
  age: { number: 2; type: "int32" };
  tags: { number: 3; type: "string"; repeated: true };
}>;

// --- 27. JSON expression evaluator (type-level) ---
type EvalJsonExpr<E extends JsonValue_> =
  E extends number ? E :
  E extends boolean ? E :
  E extends null ? null :
  E extends string ? E :
  E extends { op: "+"; left: infer L extends number; right: infer R extends number } ? [...Array<L>, ...Array<R>]["length"] :
  E extends { op: "?"; cond: true; then: infer T } ? T :
  E extends { op: "?"; cond: false; else: infer F } ? F :
  never;

// --- 28. JSON cursor ---
class JsonCursor {
  constructor(private value: JsonValue_) {}
  at(key: string | number): JsonCursor {
    if (typeof this.value === "object" && this.value !== null) {
      if (Array.isArray(this.value)) return new JsonCursor(this.value[key as number] ?? null);
      return new JsonCursor((this.value as Record<string, JsonValue_>)[key as string] ?? null);
    }
    return new JsonCursor(null);
  }
  get(): JsonValue_ { return this.value; }
  is(type: "string"): this is JsonCursor & { get(): string } { return typeof this.value === "string"; }
  isNull(): boolean { return this.value === null; }
}

// --- 29. JSON transformer pipeline ---
type JsonTransformer = (v: JsonValue_) => JsonValue_;
function pipeline(...transformers: JsonTransformer[]): JsonTransformer {
  return v => transformers.reduce((acc, t) => t(acc), v);
}
const A29_pipe = pipeline(
  v => typeof v === "string" ? v.trim() : v,
  v => v === "" ? null : v,
);

// --- 30. JSON virtual table (typed rows) ---
type VirtualTable<T extends Record<string, JsonValue_>> = {
  columns: (keyof T)[];
  rows: T[];
  where: (pred: (row: T) => boolean) => T[];
  select: <K extends keyof T>(...cols: K[]) => Pick<T, K>[];
};
function virtualTable<T extends Record<string, JsonValue_>>(rows: T[]): VirtualTable<T> {
  return {
    columns: rows.length > 0 ? Object.keys(rows[0]) as (keyof T)[] : [],
    rows,
    where: pred => rows.filter(pred),
    select: (...cols) => rows.map(r => Object.fromEntries(cols.map(c => [c, r[c]])) as Pick<T, typeof cols[number]>),
  };
}

// --- 31. Type-level JSON schema generation from TypeScript interface ---
type ObjectSchema<T extends object> = {
  type: "object";
  properties: { [K in keyof T]: SchemaOf<T[K]> };
};
type SchemaOf<T> =
  T extends null ? { type: "null" } :
  T extends boolean ? { type: "boolean" } :
  T extends number ? { type: "number" } :
  T extends string ? { type: "string" } :
  T extends (infer U)[] ? { type: "array"; items: SchemaOf<U> } :
  T extends object ? ObjectSchema<T> :
  { type: "unknown" };

// --- 32. JSON data lens ---
type Lens<T, V> = { get: (t: T) => V; set: (t: T, v: V) => T };
function prop<T, K extends keyof T>(key: K): Lens<T, T[K]> {
  return { get: t => t[key], set: (t, v) => ({ ...t, [key]: v }) };
}
function compose_<T, U, V>(lens1: Lens<T, U>, lens2: Lens<U, V>): Lens<T, V> {
  return {
    get: t => lens2.get(lens1.get(t)),
    set: (t, v) => lens1.set(t, lens2.set(lens1.get(t), v)),
  };
}
const nameLens = prop<{ user: { name: string } }, "user">("user");

// --- 33. JSON versioned cache ---
class JsonVersionedCache<T extends JsonValue_> {
  private versions: { data: T; version: number; timestamp: Date }[] = [];
  push(data: T): void {
    this.versions.push({ data, version: this.versions.length + 1, timestamp: new Date() });
  }
  at(version: number): T | undefined { return this.versions.find(v => v.version === version)?.data; }
  latest(): T | undefined { return this.versions[this.versions.length - 1]?.data; }
}

// --- 34. JSON query language AST ---
type JqlExpr =
  | { op: "field"; name: string }
  | { op: "const"; value: JsonValue_ }
  | { op: "eq"; left: JqlExpr; right: JqlExpr }
  | { op: "and"; left: JqlExpr; right: JqlExpr }
  | { op: "or"; left: JqlExpr; right: JqlExpr }
  | { op: "not"; expr: JqlExpr };
function evalJql(expr: JqlExpr, row: Record<string, JsonValue_>): JsonValue_ {
  switch (expr.op) {
    case "field": return row[expr.name] ?? null;
    case "const": return expr.value;
    case "eq": return JSON.stringify(evalJql(expr.left, row)) === JSON.stringify(evalJql(expr.right, row));
    case "and": return !!(evalJql(expr.left, row)) && !!(evalJql(expr.right, row));
    case "or": return !!(evalJql(expr.left, row)) || !!(evalJql(expr.right, row));
    case "not": return !evalJql(expr.expr, row);
  }
}

// --- 35. Strongly typed JSON API client ---
type ApiRoutes = {
  "/users": { GET: { res: { id: number; name: string }[] }; POST: { req: { name: string }; res: { id: number } } };
  "/users/:id": { GET: { res: { id: number; name: string } }; DELETE: { res: void } };
};
type RouteFor<Path extends keyof ApiRoutes, Method extends keyof ApiRoutes[Path]> =
  ApiRoutes[Path][Method];

// --- 36. JSON event log with typed events ---
type TypedEvent<T extends string, P extends JsonValue_> = { type: T; payload: P; timestamp: number };
class TypedEventLog {
  private log: TypedEvent<string, JsonValue_>[] = [];
  push<T extends string, P extends JsonValue_>(event: TypedEvent<T, P>): void { this.log.push(event); }
  filter<T extends string>(type: T): TypedEvent<T, JsonValue_>[] {
    return this.log.filter(e => e.type === type) as TypedEvent<T, JsonValue_>[];
  }
}

// --- 37. JSON array diff ---
type ArrayDiff<T extends JsonValue_> = {
  added: T[];
  removed: T[];
  unchanged: T[];
};
function arrayDiff<T extends JsonValue_>(prev: T[], next: T[]): ArrayDiff<T> {
  const prevSet = new Set(prev.map(v => JSON.stringify(v)));
  const nextSet = new Set(next.map(v => JSON.stringify(v)));
  return {
    added: next.filter(v => !prevSet.has(JSON.stringify(v))),
    removed: prev.filter(v => !nextSet.has(JSON.stringify(v))),
    unchanged: prev.filter(v => nextSet.has(JSON.stringify(v))),
  };
}

// --- 38. JSON recursive transformer ---
function transformDeep(v: JsonValue_, fn: (v: JsonValue_) => JsonValue_): JsonValue_ {
  if (Array.isArray(v)) return fn(v.map(item => transformDeep(item, fn)));
  if (typeof v === "object" && v !== null) {
    return fn(Object.fromEntries(
      Object.entries(v as Record<string, JsonValue_>).map(([k, val]) => [k, transformDeep(val, fn)])
    ));
  }
  return fn(v);
}

// --- 39. JSON path extractor ---
type ExtractPaths<T, Prefix extends string = ""> = T extends object
  ? T extends (infer U)[]
    ? `${Prefix}[number]` | ExtractPaths<U, `${Prefix}[number].`>
    : { [K in keyof T & string]: `${Prefix}${K}` | ExtractPaths<T[K], `${Prefix}${K}.`> }[keyof T & string]
  : never;
type A39 = ExtractPaths<{ user: { name: string; tags: string[] } }>;

// --- 40. JSON property chain accessor ---
function chain<T extends Record<string, JsonValue_>>(obj: T) {
  return new Proxy({} as T, {
    get(_, key: string) {
      const v = obj[key];
      if (typeof v === "object" && v !== null && !Array.isArray(v)) return chain(v as Record<string, JsonValue_>);
      return v;
    },
  });
}

// --- 41. JSON diff patch generator ---
function generatePatch(prev: Record<string, JsonValue_>, next: Record<string, JsonValue_>): {op: string; path: string; value?: JsonValue_}[] {
  const patches: {op: string; path: string; value?: JsonValue_}[] = [];
  for (const key of new Set([...Object.keys(prev), ...Object.keys(next)])) {
    if (!(key in prev)) patches.push({ op: "add", path: `/${key}`, value: next[key] });
    else if (!(key in next)) patches.push({ op: "remove", path: `/${key}` });
    else if (JSON.stringify(prev[key]) !== JSON.stringify(next[key]))
      patches.push({ op: "replace", path: `/${key}`, value: next[key] });
  }
  return patches;
}

// --- 42. JSON schema validator with errors ---
type ValidationResult<T> = { ok: true; data: T } | { ok: false; errors: string[] };
function validate<T>(schema: SchemaOf<T>, data: unknown): ValidationResult<T> {
  if ((schema as { type: string }).type === "string" && typeof data !== "string")
    return { ok: false, errors: ["Expected string"] };
  if ((schema as { type: string }).type === "number" && typeof data !== "number")
    return { ok: false, errors: ["Expected number"] };
  return { ok: true, data: data as T };
}

// --- 43. Typed JSON environment variables ---
type EnvSchema = {
  PORT: number;
  NODE_ENV: "development" | "production" | "test";
  DATABASE_URL: string;
};
function loadEnv<T extends Record<string, string | number>>(schema: Record<keyof T, "string" | "number">): T {
  const result: Record<string, unknown> = {};
  for (const [key, type] of Object.entries(schema)) {
    const raw = process.env[key];
    if (raw === undefined) throw new Error(`Missing env: ${key}`);
    result[key] = type === "number" ? Number(raw) : raw;
  }
  return result as T;
}

// --- 44. JSON RPC type-safe client ---
type RpcMethods = {
  add: { params: { a: number; b: number }; result: number };
  greet: { params: { name: string }; result: string };
};
type RpcClient<T extends Record<string, { params: object; result: unknown }>> = {
  [K in keyof T]: (params: T[K]["params"]) => Promise<T[K]["result"]>
};

// --- 45. JSON streaming serializer ---
function* streamStringify(value: JsonValue_): Generator<string> {
  if (value === null) yield "null";
  else if (typeof value === "boolean") yield value ? "true" : "false";
  else if (typeof value === "number") yield String(value);
  else if (typeof value === "string") yield JSON.stringify(value);
  else if (Array.isArray(value)) {
    yield "[";
    for (let i = 0; i < value.length; i++) {
      if (i > 0) yield ",";
      yield* streamStringify(value[i]);
    }
    yield "]";
  } else {
    yield "{";
    const entries = Object.entries(value as Record<string, JsonValue_>);
    for (let i = 0; i < entries.length; i++) {
      if (i > 0) yield ",";
      yield JSON.stringify(entries[i][0]);
      yield ":";
      yield* streamStringify(entries[i][1]);
    }
    yield "}";
  }
}

// --- 46. Type-safe NDJSON (newline-delimited JSON) ---
class NdjsonWriter<T extends JsonValue_> {
  private lines: string[] = [];
  write(value: T): void { this.lines.push(JSON.stringify(value)); }
  toString(): string { return this.lines.join("\n"); }
}
function parseNdjson<T extends JsonValue_>(input: string): T[] {
  return input.split("\n").filter(Boolean).map(line => JSON.parse(line) as T);
}

// --- 47. JSON immutable update helpers ---
function immutableSet<T extends object, K extends keyof T>(obj: T, key: K, value: T[K]): T {
  return Object.freeze({ ...obj, [key]: value });
}
function immutableDelete<T extends object, K extends keyof T>(obj: T, key: K): Omit<T, K> {
  const result = { ...obj };
  delete result[key];
  return Object.freeze(result);
}

// --- 48. JSON tree walker ---
function walkJson(
  value: JsonValue_,
  visitor: { enter?: (v: JsonValue_, path: string[]) => void; exit?: (v: JsonValue_, path: string[]) => void },
  path: string[] = []
): void {
  visitor.enter?.(value, path);
  if (Array.isArray(value)) {
    value.forEach((item, i) => walkJson(item, visitor, [...path, String(i)]));
  } else if (typeof value === "object" && value !== null) {
    for (const [k, v] of Object.entries(value as Record<string, JsonValue_>)) {
      walkJson(v, visitor, [...path, k]);
    }
  }
  visitor.exit?.(value, path);
}

// --- 49. JSON-safe typed map ---
class JsonMap<K extends string, V extends JsonValue_> {
  private map: Record<string, V> = {};
  set(key: K, value: V): void { this.map[key] = value; }
  get(key: K): V | undefined { return this.map[key]; }
  keys(): K[] { return Object.keys(this.map) as K[]; }
  values(): V[] { return Object.values(this.map); }
  toJSON(): Record<string, V> { return { ...this.map }; }
}

// --- 50. Full typed JSON message bus ---
type MessageTypes = {
  "user.created": { id: number; name: string };
  "user.updated": { id: number; changes: Record<string, JsonValue_> };
  "user.deleted": { id: number };
};
class JsonMessageBus {
  private handlers = new Map<string, ((payload: JsonValue_) => void)[]>();
  on<T extends keyof MessageTypes>(type: T, handler: (payload: MessageTypes[T]) => void): void {
    if (!this.handlers.has(type as string)) this.handlers.set(type as string, []);
    this.handlers.get(type as string)!.push(handler as (payload: JsonValue_) => void);
  }
  emit<T extends keyof MessageTypes>(type: T, payload: MessageTypes[T]): void {
    (this.handlers.get(type as string) ?? []).forEach(h => h(payload));
  }
}
const A50_bus = new JsonMessageBus();
A50_bus.on("user.created", ({ id, name }) => console.log(`User ${id}: ${name}`));
