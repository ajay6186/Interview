export {};

// ============================================================
// ADVANCED EXAMPLES — Builder Pattern (50 Examples)
// ============================================================

// 1. Phantom type builder — compile-time state tracking via type parameters
declare const _brand: unique symbol;
type Brand<T, B> = T & { [_brand]: B };
type Unset = Brand<{}, "Unset">;
type IsSet = Brand<{}, "IsSet">;

interface PhantomState { _name: IsSet | Unset; _email: IsSet | Unset }
class PhantomBuilder<S extends PhantomState = { _name: Unset; _email: Unset }> {
  private data: Record<string, unknown> = {};
  withName(n: string): PhantomBuilder<{ _name: IsSet; _email: S["_email"] }> {
    this.data["name"] = n; return this as any;
  }
  withEmail(e: string): PhantomBuilder<{ _name: S["_name"]; _email: IsSet }> {
    this.data["email"] = e; return this as any;
  }
  build(this: PhantomBuilder<{ _name: IsSet; _email: IsSet }>): { name: string; email: string } {
    return this.data as any;
  }
}
// Only compiles when both name and email are set:
const phantomUser = new PhantomBuilder().withName("Alice").withEmail("alice@example.com").build();

// 2. Recursive fluent builder — builds deeply nested configurations with type inference
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };
class DeepBuilder<T extends object> {
  protected data: DeepPartial<T> = {};
  set<K extends keyof T>(key: K, val: T[K]): this { this.data[key] = val; return this; }
  patch(partial: DeepPartial<T>): this { this.data = this.deepMerge(this.data, partial); return this; }
  private deepMerge<U extends object>(target: DeepPartial<U>, source: DeepPartial<U>): DeepPartial<U> {
    const out = { ...target };
    for (const k in source) {
      const sv = source[k], tv = target[k];
      (out as any)[k] = (sv && typeof sv === "object" && !Array.isArray(sv) && tv && typeof tv === "object")
        ? this.deepMerge(tv as any, sv as any)
        : sv;
    }
    return out;
  }
  build(): T { return this.data as T; }
}
type ServerConfig = { host: string; tls: { cert: string; key: string }; timeouts: { connect: number; read: number } };
const serverCfg = new DeepBuilder<ServerConfig>()
  .patch({ host: "api.example.com", tls: { cert: "/certs/cert.pem", key: "/certs/key.pem" }, timeouts: { connect: 5000, read: 30000 } })
  .build();

// 3. Builder with variadic type parameters — collects types across chained calls
type Append<Tuple extends unknown[], Item> = [...Tuple, Item];
class TypeCollectorBuilder<Collected extends unknown[] = []> {
  private validators: ((val: unknown) => boolean)[] = [];
  add<T>(validator: (val: T) => boolean): TypeCollectorBuilder<Append<Collected, T>> {
    this.validators.push(validator as any); return this as any;
  }
  build(): { validators: ((val: unknown) => boolean)[]; count: number } {
    return { validators: [...this.validators], count: this.validators.length };
  }
}
const collector = new TypeCollectorBuilder()
  .add((s: string) => s.length > 0)
  .add((n: number) => n > 0)
  .add((b: boolean) => b === true)
  .build();

// 4. Builder with conditional method exposure using type predicates
class ConditionalMethodBuilder<T extends Record<string, unknown>, HasId extends boolean = false> {
  private data: Partial<T> = {};
  setGeneral<K extends keyof T>(k: K, v: T[K]): this { this.data[k] = v; return this; }
  withId(id: string): ConditionalMethodBuilder<T, true> {
    (this.data as any)["id"] = id; return this as any;
  }
  // This method is only available after withId is called:
  buildWithId(this: ConditionalMethodBuilder<T, true>): T & { id: string } {
    return this.data as T & { id: string };
  }
  build(): T { return this.data as T; }
}
const withId = new ConditionalMethodBuilder<{ name: string }>()
  .setGeneral("name", "Alice").withId("u_001").buildWithId();

// 5. Monadic builder — flatMap-style chaining that short-circuits on error
type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };
class ResultBuilder<T> {
  private result: Result<T>;
  constructor(result: Result<T>) { this.result = result; }
  static ok<T>(val: T): ResultBuilder<T> { return new ResultBuilder({ ok: true, value: val }); }
  static err<T>(msg: string): ResultBuilder<T> { return new ResultBuilder<T>({ ok: false, error: msg }); }
  map<U>(fn: (val: T) => U): ResultBuilder<U> {
    return this.result.ok ? ResultBuilder.ok(fn(this.result.value)) : ResultBuilder.err(this.result.error);
  }
  flatMap<U>(fn: (val: T) => ResultBuilder<U>): ResultBuilder<U> {
    return this.result.ok ? fn(this.result.value) : ResultBuilder.err(this.result.error);
  }
  build(): Result<T> { return this.result; }
}
const resultChain = ResultBuilder.ok(42)
  .map(n => n * 2)
  .flatMap(n => n > 50 ? ResultBuilder.ok(`large: ${n}`) : ResultBuilder.err("too small"))
  .build();

// 6. Builder enforcing ordering via type state — each step returns a different type
class ConnectionStep { private host = ""; withHost(h: string): AuthStep { const a = new AuthStep(h); return a; } }
class AuthStep {
  constructor(private host: string) {}
  withAuth(user: string, pass: string): DatabaseStep { return new DatabaseStep(this.host, user, pass); }
}
class DatabaseStep {
  constructor(private host: string, private user: string, private pass: string) {}
  withDatabase(db: string): ReadyStep { return new ReadyStep(this.host, this.user, this.pass, db); }
}
class ReadyStep {
  constructor(private host: string, private user: string, private pass: string, private db: string) {}
  build() { return { connectionString: `postgresql://${this.user}:${this.pass}@${this.host}/${this.db}` }; }
}
// Steps enforced: host → auth → db → build
const connection = new ConnectionStep()
  .withHost("db.example.com")
  .withAuth("admin", "secret")
  .withDatabase("myapp")
  .build();

// 7. Builder with type-level validation — using template literal types
type NonEmptyString<T extends string> = T extends "" ? never : T;
type ValidEmail<T extends string> = T extends `${string}@${string}.${string}` ? T : never;
class TypeLevelValidatedBuilder<Name extends string = never, Email extends string = never> {
  private data: { name?: string; email?: string } = {};
  withName<N extends string>(name: NonEmptyString<N>): TypeLevelValidatedBuilder<N, Email> {
    this.data.name = name; return this as any;
  }
  withEmail<E extends string>(email: ValidEmail<E>): TypeLevelValidatedBuilder<Name, E> {
    this.data.email = email; return this as any;
  }
  build(this: TypeLevelValidatedBuilder<string, string>): { name: string; email: string } {
    return this.data as any;
  }
}
const typeSafe = new TypeLevelValidatedBuilder()
  .withName("Alice")
  .withEmail("alice@example.com")
  .build();

// 8. Builder with mapped type — generates setter methods automatically
type SetterMethods<T> = { [K in keyof T as `set${Capitalize<string & K>}`]: (val: T[K]) => any };
function createAutoBuilder<T extends Record<string, unknown>>(defaults: T): SetterMethods<T> & { build(): T } {
  const data = { ...defaults } as T;
  const builder: any = { build: () => ({ ...data }) };
  for (const key of Object.keys(defaults)) {
    const setterName = `set${key.charAt(0).toUpperCase()}${key.slice(1)}`;
    builder[setterName] = (val: unknown) => { (data as any)[key] = val; return builder; };
  }
  return builder;
}
const autoBuilder = createAutoBuilder({ name: "", age: 0, active: false });
const autoBuilt = autoBuilder.setName("Alice").setAge(30).setActive(true).build();

// 9. Builder with covariant return types via generic this
abstract class BaseBuilder<T, Self extends BaseBuilder<T, Self>> {
  protected data: Partial<T> = {};
  set<K extends keyof T>(k: K, v: T[K]): Self { this.data[k] = v; return this as unknown as Self; }
  abstract build(): T;
}
class ExtendedUserBuilder extends BaseBuilder<{ name: string; email: string; role: string }, ExtendedUserBuilder> {
  withRole(r: string): this { this.data.role = r; return this; }
  build(): { name: string; email: string; role: string } { return this.data as any; }
}
const extUser = new ExtendedUserBuilder().set("name", "Alice").set("email", "a@b.com").withRole("admin").build();

// 10. Builder producing a type-safe command object with undo/redo
interface Command10<State> {
  execute(state: State): State;
  undo(state: State): State;
  description: string;
}
class CommandBuilder10<State> {
  private execFn?: (s: State) => State;
  private undoFn?: (s: State) => State;
  private desc = "";
  executes(fn: (s: State) => State): this { this.execFn = fn; return this; }
  undoes(fn: (s: State) => State): this { this.undoFn = fn; return this; }
  describes(d: string): this { this.desc = d; return this; }
  build(): Command10<State> {
    return { execute: this.execFn!, undo: this.undoFn!, description: this.desc };
  }
}
class CommandHistory<State> {
  private history: Command10<State>[] = [];
  private ptr = -1;
  execute(state: State, cmd: Command10<State>): State {
    this.history = this.history.slice(0, this.ptr + 1);
    this.history.push(cmd); this.ptr++;
    return cmd.execute(state);
  }
  undo(state: State): State { return this.ptr >= 0 ? this.history[this.ptr--].undo(state) : state; }
}
type EditorState = { text: string };
const insertCmd = new CommandBuilder10<EditorState>()
  .executes(s => ({ text: s.text + "Hello" }))
  .undoes(s => ({ text: s.text.slice(0, -5) }))
  .describes("Insert 'Hello'").build();

// 11. Builder implementing the specification pattern with type-safe predicates
interface Specification<T> { isSatisfiedBy(candidate: T): boolean; and(other: Specification<T>): Specification<T>; or(other: Specification<T>): Specification<T>; not(): Specification<T> }
class SpecBuilder<T> implements Specification<T> {
  constructor(private predicate: (val: T) => boolean) {}
  isSatisfiedBy(candidate: T): boolean { return this.predicate(candidate); }
  and(other: Specification<T>): Specification<T> { return new SpecBuilder<T>(v => this.isSatisfiedBy(v) && other.isSatisfiedBy(v)); }
  or(other: Specification<T>): Specification<T> { return new SpecBuilder<T>(v => this.isSatisfiedBy(v) || other.isSatisfiedBy(v)); }
  not(): Specification<T> { return new SpecBuilder<T>(v => !this.isSatisfiedBy(v)); }
}
interface Product11 { price: number; category: string; inStock: boolean }
const affordable = new SpecBuilder<Product11>(p => p.price < 50);
const electronics = new SpecBuilder<Product11>(p => p.category === "electronics");
const available = new SpecBuilder<Product11>(p => p.inStock);
const goodDeal = affordable.and(electronics).and(available);
const products11: Product11[] = [{ price: 29.99, category: "electronics", inStock: true }];
const deals = products11.filter(p => goodDeal.isSatisfiedBy(p));

// 12. Builder with type-safe query DSL using method chaining
type WhereClause<T> = { field: keyof T; op: "=" | "!=" | ">" | "<" | "like" | "in"; value: unknown };
class TypedQueryBuilder<T extends object> {
  private table = "";
  private clauses: WhereClause<T>[] = [];
  private selectFields: (keyof T)[] = [];
  private _limit?: number;
  from(table: string): this { this.table = table; return this; }
  select(...fields: (keyof T)[]): this { this.selectFields = fields; return this; }
  where<K extends keyof T>(field: K, op: WhereClause<T>["op"], value: T[K]): this {
    this.clauses.push({ field, op, value }); return this;
  }
  limit(n: number): this { this._limit = n; return this; }
  build() {
    return { table: this.table, select: this.selectFields, where: this.clauses, limit: this._limit };
  }
}
interface User12 { id: string; name: string; age: number; role: string }
const typedQuery = new TypedQueryBuilder<User12>()
  .from("users").select("id", "name", "role")
  .where("role", "=", "admin").where("age", ">", 18).limit(50).build();

// 13. Builder with async validation and lazy build
class AsyncValidatedBuilder<T> {
  private data: Partial<T> = {};
  private asyncValidators: ((data: Partial<T>) => Promise<string | null>)[] = [];
  set<K extends keyof T>(k: K, v: T[K]): this { this.data[k] = v; return this; }
  withAsyncValidator(fn: (data: Partial<T>) => Promise<string | null>): this { this.asyncValidators.push(fn); return this; }
  async build(): Promise<{ value: T | null; errors: string[] }> {
    const results = await Promise.all(this.asyncValidators.map(v => v(this.data)));
    const errors = results.filter((e): e is string => e !== null);
    return errors.length ? { value: null, errors } : { value: this.data as T, errors: [] };
  }
}
const asyncBuilder13 = new AsyncValidatedBuilder<{ username: string; email: string }>()
  .set("username", "alice")
  .set("email", "alice@example.com")
  .withAsyncValidator(async d => d.username && d.username.length < 3 ? "Username too short" : null);

// 14. Builder with type-level readonly enforcement
class ImmutableBuilderAdv<T extends object> {
  private readonly data: Partial<T>;
  private constructor(data: Partial<T> = {}) { this.data = Object.freeze({ ...data }); }
  static start<T extends object>(): ImmutableBuilderAdv<T> { return new ImmutableBuilderAdv<T>(); }
  set<K extends keyof T>(k: K, v: T[K]): ImmutableBuilderAdv<T> {
    return new ImmutableBuilderAdv<T>({ ...this.data, [k]: v });
  }
  build(): Readonly<T> { return Object.freeze({ ...this.data }) as Readonly<T>; }
}
const immutable14 = ImmutableBuilderAdv.start<{ name: string; age: number }>()
  .set("name", "Alice").set("age", 30).build();

// 15. Builder that generates TypeScript interface descriptors at runtime
type FieldDescriptor = { key: string; type: "string" | "number" | "boolean" | "date" | "array"; required: boolean };
class SchemaDescriptorBuilder<T = {}> {
  private fields: FieldDescriptor[] = [];
  addField<K extends string, FType extends FieldDescriptor["type"]>(
    key: K, type: FType, required = false
  ): SchemaDescriptorBuilder<T & Record<K, FType extends "number" ? number : FType extends "boolean" ? boolean : string>> {
    this.fields.push({ key, type, required }); return this as any;
  }
  build() {
    return {
      fields: this.fields,
      validate: (obj: Record<string, unknown>) => this.fields
        .filter(f => f.required && !obj[f.key])
        .map(f => `${f.key} is required`)
    };
  }
}
const schema15 = new SchemaDescriptorBuilder()
  .addField("name", "string", true)
  .addField("age", "number", true)
  .addField("email", "string", true)
  .build();

// 16. Builder with exhaustive union dispatch — each union member gets its own builder
type ShapeKind = "circle" | "rect" | "triangle";
interface Shape16 { kind: ShapeKind; area(): number; perimeter(): number }
class CircleBuilder16 {
  constructor(private radius: number) {}
  build(): Shape16 {
    const r = this.radius;
    return { kind: "circle", area: () => Math.PI * r * r, perimeter: () => 2 * Math.PI * r };
  }
}
class RectBuilder16 {
  constructor(private w: number, private h: number) {}
  build(): Shape16 {
    const { w, h } = this;
    return { kind: "rect", area: () => w * h, perimeter: () => 2 * (w + h) };
  }
}
class ShapeFactory16 {
  static circle(radius: number): Shape16 { return new CircleBuilder16(radius).build(); }
  static rect(w: number, h: number): Shape16 { return new RectBuilder16(w, h).build(); }
}
const shapes: Shape16[] = [ShapeFactory16.circle(5), ShapeFactory16.rect(4, 6)];

// 17. Builder that accumulates type information for a type-safe pipeline
type PipeStep<In, Out> = { transform: (input: In) => Out };
class TypedPipelineBuilder<Input, Output = Input> {
  private steps: PipeStep<any, any>[] = [];
  then<Next>(fn: (val: Output) => Next): TypedPipelineBuilder<Input, Next> {
    const next = new TypedPipelineBuilder<Input, Next>();
    (next as any).steps = [...this.steps, { transform: fn }];
    return next;
  }
  build(): (input: Input) => Output {
    const steps = this.steps;
    return (input: Input) => steps.reduce((acc: any, step) => step.transform(acc), input) as Output;
  }
}
const typedPipeline = new TypedPipelineBuilder<string>()
  .then(s => s.trim())
  .then(s => parseInt(s, 10))
  .then(n => n * 2)
  .then(n => `Result: ${n}`)
  .build();
const pipeResult = typedPipeline("  21  ");

// 18. Builder with observable pattern — emits change events
type Observer<T> = (key: keyof T, value: T[keyof T], prev: T[keyof T] | undefined) => void;
class ObservableBuilder<T extends Record<string, unknown>> {
  private data: Partial<T> = {};
  private observers: Observer<T>[] = [];
  subscribe(observer: Observer<T>): () => void {
    this.observers.push(observer);
    return () => { this.observers = this.observers.filter(o => o !== observer); };
  }
  set<K extends keyof T>(k: K, v: T[K]): this {
    const prev = this.data[k];
    this.data[k] = v;
    this.observers.forEach(obs => obs(k, v as T[keyof T], prev as T[keyof T]));
    return this;
  }
  build(): T { return this.data as T; }
}
const obs18 = new ObservableBuilder<{ name: string; status: string }>();
const unsub = obs18.subscribe((k, v, prev) => console.log(`${String(k)}: ${String(prev)} → ${String(v)}`));
obs18.set("name", "Alice").set("status", "active");
const built18 = obs18.build();
unsub();

// 19. Builder with structural type checking via conditional types
type IsCompatible<T, Required> = Required extends T ? true : false;
type AssertCompatible<T, Required> = IsCompatible<T, Required> extends true ? T : never;
class StrictBuilder<T, Requirements extends Partial<T> = {}> {
  private data: Partial<T> = {};
  set<K extends keyof T>(k: K, v: T[K]): StrictBuilder<T, Requirements & Pick<T, K>> {
    this.data[k] = v; return this as any;
  }
  build<R extends Requirements>(
    this: StrictBuilder<T, AssertCompatible<Requirements, T>>
  ): T { return this.data as T; }
}

// 20. Builder with schema-driven type generation
const schema20 = { name: "string" as const, age: "number" as const, active: "boolean" as const };
type SchemaType<S extends Record<string, "string" | "number" | "boolean">> = {
  [K in keyof S]: S[K] extends "string" ? string : S[K] extends "number" ? number : boolean
};
function schemaBuilder<S extends Record<string, "string" | "number" | "boolean">>(schema: S) {
  const data: Partial<SchemaType<S>> = {};
  const builder = {
    set<K extends keyof S>(k: K, v: SchemaType<S>[K]): typeof builder { (data as any)[k] = v; return builder; },
    build(): SchemaType<S> { return data as SchemaType<S>; }
  };
  return builder;
}
const schemaBuilt = schemaBuilder(schema20).set("name", "Alice").set("age", 30).set("active", true).build();

// 21. Builder implementing Strategy pattern with type-safe strategy selection
type Strategy<Input, Output> = (input: Input) => Output;
class StrategyBuilder<Input, Output> {
  private strategy?: Strategy<Input, Output>;
  private fallback?: Output;
  withStrategy(s: Strategy<Input, Output>): this { this.strategy = s; return this; }
  withFallback(val: Output): this { this.fallback = val; return this; }
  build(): (input: Input) => Output {
    const s = this.strategy; const fb = this.fallback;
    return (input: Input) => {
      try { return s ? s(input) : fb!; }
      catch { return fb!; }
    };
  }
}
const sortStrategy = new StrategyBuilder<number[], number[]>()
  .withStrategy(arr => [...arr].sort((a, b) => a - b))
  .withFallback([]).build();
const sorted21 = sortStrategy([3, 1, 4, 1, 5, 9]);

// 22. Builder with decorator-like method wrapping
type MethodWrapper<T extends (...args: any[]) => any> = (fn: T, ...args: Parameters<T>) => ReturnType<T>;
class DecoratorBuilder<T extends Record<string, (...args: any[]) => any>> {
  private wrappers: Map<keyof T, MethodWrapper<any>> = new Map();
  wrapMethod<K extends keyof T>(method: K, wrapper: MethodWrapper<T[K]>): this {
    this.wrappers.set(method, wrapper); return this;
  }
  build(target: T): T {
    const proxy: any = {};
    for (const key of Object.keys(target) as (keyof T)[]) {
      const wrapper = this.wrappers.get(key);
      proxy[key] = wrapper
        ? (...args: any[]) => wrapper(target[key].bind(target) as any, ...args)
        : target[key].bind(target);
    }
    return proxy;
  }
}
const decorated = new DecoratorBuilder<{ greet: (name: string) => string }>()
  .wrapMethod("greet", (fn, name) => { console.log("before"); const r = fn(name); console.log("after"); return r; })
  .build({ greet: (name: string) => `Hello, ${name}!` });

// 23. Builder with memoization — caches build results
class MemoizedBuilder<TKey, TVal> {
  private cache = new Map<TKey, TVal>();
  private builderFn?: (key: TKey) => TVal;
  withBuilder(fn: (key: TKey) => TVal): this { this.builderFn = fn; return this; }
  build(key: TKey): TVal {
    if (!this.cache.has(key)) this.cache.set(key, this.builderFn!(key));
    return this.cache.get(key)!;
  }
  invalidate(key: TKey): this { this.cache.delete(key); return this; }
  clear(): this { this.cache.clear(); return this; }
}
const memoBuilder = new MemoizedBuilder<string, { id: string; data: string }>()
  .withBuilder(key => ({ id: key, data: `computed-${Date.now()}` }));
const r1 = memoBuilder.build("key1");
const r2 = memoBuilder.build("key1"); // same instance

// 24. Builder with type-safe event payloads using mapped types
type EventMap24 = { "user:login": { userId: string; timestamp: number }; "user:logout": { userId: string }; "error": { message: string; code: number } };
class EventPayloadBuilder<K extends keyof EventMap24> {
  private payload: Partial<EventMap24[K]> = {};
  set<F extends keyof EventMap24[K]>(field: F, value: EventMap24[K][F]): this {
    (this.payload as any)[field] = value; return this;
  }
  build(): EventMap24[K] { return this.payload as EventMap24[K]; }
}
class TypedEventBuilder {
  static for<K extends keyof EventMap24>(event: K): EventPayloadBuilder<K> {
    return new EventPayloadBuilder<K>();
  }
}
const loginPayload = TypedEventBuilder.for("user:login").set("userId", "u_001").set("timestamp", Date.now()).build();
const errorPayload = TypedEventBuilder.for("error").set("message", "Not found").set("code", 404).build();

// 25. Builder implementing the Template Method pattern with generic hooks
abstract class AbstractRequestBuilder<Options extends object, Result> {
  protected abstract buildUrl(opts: Options): string;
  protected abstract buildHeaders(opts: Options): Record<string, string>;
  protected abstract parseResponse(raw: unknown): Result;
  build(opts: Options): { url: string; headers: Record<string, string>; parse: (raw: unknown) => Result } {
    return { url: this.buildUrl(opts), headers: this.buildHeaders(opts), parse: this.parseResponse.bind(this) };
  }
}
interface AuthOpts { baseUrl: string; token: string; userId: string }
class AuthenticatedRequestBuilder extends AbstractRequestBuilder<AuthOpts, { id: string; name: string }> {
  protected buildUrl(opts: AuthOpts): string { return `${opts.baseUrl}/users/${opts.userId}`; }
  protected buildHeaders(opts: AuthOpts): Record<string, string> {
    return { Authorization: `Bearer ${opts.token}`, "Content-Type": "application/json" };
  }
  protected parseResponse(raw: unknown): { id: string; name: string } { return raw as any; }
}
const reqSpec = new AuthenticatedRequestBuilder().build({ baseUrl: "https://api.example.com", token: "abc", userId: "u1" });

// 26. Builder with lazy validation and custom error types
interface ValidationError26 { field: string; rule: string; message: string }
class TypedValidationBuilder<T extends Record<string, unknown>> {
  private rules: Array<{ field: keyof T; rule: string; predicate: (val: unknown) => boolean; message: string }> = [];
  addRule<K extends keyof T>(field: K, rule: string, predicate: (val: T[K]) => boolean, message: string): this {
    this.rules.push({ field, rule, predicate: predicate as any, message }); return this;
  }
  build(): { validate: (data: T) => ValidationError26[] } {
    const rules = this.rules;
    return {
      validate: (data: T) => rules
        .filter(r => !r.predicate(data[r.field]))
        .map(r => ({ field: String(r.field), rule: r.rule, message: r.message }))
    };
  }
}
const userValidator26 = new TypedValidationBuilder<{ name: string; age: number; email: string }>()
  .addRule("name", "required", v => v.length > 0, "Name is required")
  .addRule("age", "positive", v => v > 0, "Age must be positive")
  .addRule("email", "format", v => v.includes("@"), "Invalid email format")
  .build();

// 27. Builder with compile-time config merging using intersection types
type Merge27<A, B> = Omit<A, keyof B> & B;
class ConfigMergeBuilder<Config extends object = {}> {
  private config: Config;
  private constructor(cfg: Config) { this.config = cfg; }
  static create(): ConfigMergeBuilder<{}> { return new ConfigMergeBuilder({}); }
  with<Extension extends object>(extension: Extension): ConfigMergeBuilder<Merge27<Config, Extension>> {
    return new ConfigMergeBuilder({ ...this.config, ...extension } as any);
  }
  build(): Config { return { ...this.config }; }
}
const merged27 = ConfigMergeBuilder.create()
  .with({ host: "localhost", port: 3000 })
  .with({ auth: { secret: "abc", ttl: 3600 } })
  .with({ port: 8080 }) // overrides port
  .build();

// 28. Builder for type-safe HTTP routes with parameter extraction
type ExtractParams<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractParams<`/${Rest}`>
    : T extends `${string}:${infer Param}`
    ? Param
    : never;
class RouteBuilder28<Path extends string> {
  private path: Path;
  private handler?: (params: Record<ExtractParams<Path>, string>) => void;
  constructor(path: Path) { this.path = path; }
  withHandler(fn: (params: Record<ExtractParams<Path>, string>) => void): this {
    this.handler = fn; return this;
  }
  build() { return { path: this.path, handler: this.handler }; }
}
const route28 = new RouteBuilder28("/users/:userId/posts/:postId")
  .withHandler(params => console.log(params.userId, params.postId)).build();

// 29. Builder with type-safe environment-specific overrides
type Environments = "development" | "test" | "staging" | "production";
class EnvAwareBuilder<Base extends object> {
  private base: Base;
  private overrides: Partial<Record<Environments, Partial<Base>>> = {};
  constructor(base: Base) { this.base = base; }
  forEnv(env: Environments, overrides: Partial<Base>): this { this.overrides[env] = overrides; return this; }
  build(env: Environments): Base {
    return { ...this.base, ...(this.overrides[env] ?? {}) };
  }
}
const envBuilder29 = new EnvAwareBuilder({ apiUrl: "http://localhost:3000", debug: true, logLevel: "verbose", cache: false })
  .forEnv("production", { apiUrl: "https://api.example.com", debug: false, logLevel: "error", cache: true })
  .forEnv("staging", { apiUrl: "https://staging.example.com", debug: false });
const prodConfig29 = envBuilder29.build("production");
const devConfig29  = envBuilder29.build("development");

// 30. Builder with type-safe slot system (Vue-style named slots)
type SlotMap30<Slots extends string> = Record<Slots, string>;
class SlottedBuilder<Slots extends string> {
  private slots: Partial<SlotMap30<Slots>> = {};
  private defaultSlot?: string;
  fillSlot<S extends Slots>(slot: S, content: string): this {
    (this.slots as any)[slot] = content; return this;
  }
  defaultContent(content: string): this { this.defaultSlot = content; return this; }
  build(): { slots: Partial<SlotMap30<Slots>>; default: string | undefined } {
    return { slots: { ...this.slots }, default: this.defaultSlot };
  }
}
const card30 = new SlottedBuilder<"header" | "body" | "footer">()
  .fillSlot("header", "<h1>Title</h1>")
  .fillSlot("body", "<p>Content</p>")
  .fillSlot("footer", "<button>OK</button>")
  .build();

// 31. Builder implementing the Visitor pattern for type-safe AST construction
type AstNode = { type: "literal"; value: number } | { type: "binary"; op: "+"|"-"|"*"|"/"; left: AstNode; right: AstNode } | { type: "variable"; name: string };
class AstBuilder {
  static literal(value: number): AstNode { return { type: "literal", value }; }
  static variable(name: string): AstNode { return { type: "variable", name }; }
  static binary(op: "+"|"-"|"*"|"/", left: AstNode, right: AstNode): AstNode { return { type: "binary", op, left, right }; }
  static evaluate(node: AstNode, vars: Record<string, number> = {}): number {
    switch (node.type) {
      case "literal": return node.value;
      case "variable": return vars[node.name] ?? 0;
      case "binary": {
        const l = AstBuilder.evaluate(node.left, vars), r = AstBuilder.evaluate(node.right, vars);
        return node.op === "+" ? l + r : node.op === "-" ? l - r : node.op === "*" ? l * r : l / r;
      }
    }
  }
}
// Builds (x + 2) * (y - 1)
const ast = AstBuilder.binary("*",
  AstBuilder.binary("+", AstBuilder.variable("x"), AstBuilder.literal(2)),
  AstBuilder.binary("-", AstBuilder.variable("y"), AstBuilder.literal(1))
);
const astResult = AstBuilder.evaluate(ast, { x: 3, y: 5 }); // (3+2)*(5-1) = 20

// 32. Builder with type-safe plugin system
type Plugin32<T> = { name: string; apply: (builder: T) => T };
class PluggableBuilder<T extends Record<string, unknown>> {
  private data: Partial<T> = {};
  private plugins: Plugin32<PluggableBuilder<T>>[] = [];
  set<K extends keyof T>(k: K, v: T[K]): this { this.data[k] = v; return this; }
  use(plugin: Plugin32<PluggableBuilder<T>>): this { this.plugins.push(plugin); return this; }
  build(): T {
    let builder: PluggableBuilder<T> = this;
    for (const plugin of this.plugins) builder = plugin.apply(builder);
    return builder.data as T;
  }
}
const timestampPlugin: Plugin32<PluggableBuilder<{ name: string; createdAt?: Date }>> = {
  name: "timestamp",
  apply: b => b.set("createdAt", new Date())
};
const pluggable32 = new PluggableBuilder<{ name: string; createdAt?: Date }>()
  .set("name", "Alice").use(timestampPlugin).build();

// 33. Builder with lazy dependency resolution
type Factory33<T> = () => T;
class LazyDiBuilder<Services extends Record<string, unknown>> {
  private factories = new Map<keyof Services, Factory33<unknown>>();
  private resolving = new Set<keyof Services>();
  register<K extends keyof Services>(key: K, factory: Factory33<Services[K]>): this {
    this.factories.set(key, factory); return this;
  }
  build(): { resolve: <K extends keyof Services>(key: K) => Services[K] } {
    const cache = new Map<keyof Services, unknown>();
    const resolving = this.resolving;
    const factories = this.factories;
    return {
      resolve: <K extends keyof Services>(key: K): Services[K] => {
        if (cache.has(key)) return cache.get(key) as Services[K];
        if (resolving.has(key)) throw new Error(`Circular dependency: ${String(key)}`);
        resolving.add(key);
        const instance = factories.get(key)!();
        resolving.delete(key);
        cache.set(key, instance);
        return instance as Services[K];
      }
    };
  }
}
const di33 = new LazyDiBuilder<{ config: { port: number }; server: { start(): void } }>()
  .register("config", () => ({ port: 8080 }))
  .register("server", () => ({ start: () => console.log("starting") }))
  .build();

// 34. Builder with complete type narrowing via exhaustive pattern matching
type EventKind34 = "click" | "hover" | "focus" | "blur";
type EventConfig34<K extends EventKind34> =
  K extends "click" ? { button: "left" | "right"; modifiers: string[] } :
  K extends "hover" ? { delay: number; tolerance: number } :
  K extends "focus" | "blur" ? { target: string } :
  never;
class EventHandlerBuilder34<K extends EventKind34> {
  private config?: EventConfig34<K>;
  withConfig(cfg: EventConfig34<K>): this { this.config = cfg; return this; }
  build(): { kind: K; config: EventConfig34<K> } {
    return { kind: undefined as unknown as K, config: this.config! };
  }
}
function buildEventHandler<K extends EventKind34>(kind: K, fn: (b: EventHandlerBuilder34<K>) => EventHandlerBuilder34<K>) {
  return fn(new EventHandlerBuilder34<K>()).build();
}
const clickHandler = buildEventHandler("click", b => b.withConfig({ button: "left", modifiers: ["ctrl"] }));
const hoverHandler = buildEventHandler("hover", b => b.withConfig({ delay: 300, tolerance: 10 }));

// 35. Builder with type-safe serialization round-tripping
interface Codec<T, Serialized> { encode(val: T): Serialized; decode(raw: Serialized): T }
class CodecBuilder<T, S = T> {
  private encodeFn: (val: T) => S = val => val as unknown as S;
  private decodeFn: (raw: S) => T = raw => raw as unknown as T;
  withEncoder(fn: (val: T) => S): this { this.encodeFn = fn; return this; }
  withDecoder(fn: (raw: S) => T): this { this.decodeFn = fn; return this; }
  build(): Codec<T, S> { return { encode: this.encodeFn, decode: this.decodeFn }; }
}
const dateCodec = new CodecBuilder<Date, string>()
  .withEncoder(d => d.toISOString())
  .withDecoder(s => new Date(s)).build();
const encoded = dateCodec.encode(new Date("2024-01-01"));
const decoded = dateCodec.decode(encoded);

// 36. Builder with complete fluent API and method overloading
class FluentNumberBuilder {
  private value: number;
  constructor(initial: number) { this.value = initial; }
  add(n: number): this { this.value += n; return this; }
  subtract(n: number): this { this.value -= n; return this; }
  multiply(n: number): this { this.value *= n; return this; }
  divide(n: number): this { if (n === 0) throw new Error("Division by zero"); this.value /= n; return this; }
  abs(): this { this.value = Math.abs(this.value); return this; }
  round(decimals = 0): this { const factor = 10 ** decimals; this.value = Math.round(this.value * factor) / factor; return this; }
  clamp(min: number, max: number): this { this.value = Math.max(min, Math.min(max, this.value)); return this; }
  build(): number { return this.value; }
}
const computed36 = new FluentNumberBuilder(100)
  .add(50).multiply(1.1).subtract(30).round(2).clamp(0, 200).build();

// 37. Builder with dependency graph and topological sort
class DependencyGraphBuilder<T extends string> {
  private nodes: Set<T> = new Set();
  private edges: Map<T, Set<T>> = new Map();
  addNode(node: T): this { this.nodes.add(node); if (!this.edges.has(node)) this.edges.set(node, new Set()); return this; }
  addDependency(node: T, dependsOn: T): this {
    this.addNode(node).addNode(dependsOn);
    this.edges.get(node)!.add(dependsOn); return this;
  }
  build(): { order: T[]; hasCycle: boolean } {
    const visited = new Set<T>(), stack = new Set<T>(), order: T[] = [];
    let hasCycle = false;
    const visit = (node: T) => {
      if (stack.has(node)) { hasCycle = true; return; }
      if (visited.has(node)) return;
      stack.add(node);
      for (const dep of this.edges.get(node) ?? []) visit(dep as T);
      stack.delete(node); visited.add(node); order.push(node);
    };
    for (const node of this.nodes) visit(node);
    return { order: order.reverse(), hasCycle };
  }
}
const depGraph = new DependencyGraphBuilder<"app" | "db" | "cache" | "logger">()
  .addDependency("app", "db").addDependency("app", "cache").addDependency("db", "logger").addDependency("cache", "logger")
  .build();

// 38. Builder with structural validation using type predicates
function isString(v: unknown): v is string { return typeof v === "string"; }
function isNumber(v: unknown): v is number { return typeof v === "number"; }
type TypeGuard<T> = (v: unknown) => v is T;
type GuardedShape<Schema extends Record<string, TypeGuard<any>>> = {
  [K in keyof Schema]: Schema[K] extends TypeGuard<infer T> ? T : never
};
class StructuralBuilder<Schema extends Record<string, TypeGuard<any>>> {
  constructor(private schema: Schema) {}
  parse(raw: unknown): GuardedShape<Schema> | null {
    if (!raw || typeof raw !== "object") return null;
    const obj = raw as Record<string, unknown>;
    for (const [k, guard] of Object.entries(this.schema)) {
      if (!guard(obj[k])) return null;
    }
    return raw as GuardedShape<Schema>;
  }
}
const userParser = new StructuralBuilder({ name: isString, age: isNumber });
const parsed38 = userParser.parse({ name: "Alice", age: 30 });

// 39. Builder with typed state transitions — finite state machine builder
type FSMState = string;
type FSMTransitions<States extends FSMState, Events extends string> = {
  [S in States]?: { [E in Events]?: States }
};
class FsmBuilder<States extends FSMState, Events extends string> {
  private transitions: FSMTransitions<States, Events> = {};
  private initial?: States;
  withInitial(state: States): this { this.initial = state; return this; }
  transition(from: States, event: Events, to: States): this {
    if (!this.transitions[from]) this.transitions[from] = {};
    (this.transitions[from] as any)[event] = to; return this;
  }
  build() {
    let current = this.initial!;
    const transitions = this.transitions;
    return {
      getState: () => current,
      send: (event: Events): States => {
        const next = (transitions[current] as any)?.[event];
        if (next) current = next;
        return current;
      }
    };
  }
}
const trafficLight = new FsmBuilder<"red"|"yellow"|"green", "next">()
  .withInitial("red")
  .transition("red", "next", "green")
  .transition("green", "next", "yellow")
  .transition("yellow", "next", "red")
  .build();
trafficLight.send("next"); // green
trafficLight.send("next"); // yellow

// 40. Builder with conditional type-level branching for different payload shapes
type Condition40<Flag extends boolean, TrueType, FalseType> = Flag extends true ? TrueType : FalseType;
class ConditionalShapeBuilder<IsAdmin extends boolean> {
  private data: Record<string, unknown> = {};
  withName(n: string): this { this.data["name"] = n; return this; }
  withEmail(e: string): this { this.data["email"] = e; return this; }
  withAdminKey(this: ConditionalShapeBuilder<true>, key: string): this { this.data["adminKey"] = key; return this; }
  build(): Condition40<IsAdmin, { name: string; email: string; adminKey: string }, { name: string; email: string }> {
    return this.data as any;
  }
}
function createAdminBuilder(): ConditionalShapeBuilder<true> { return new ConditionalShapeBuilder<true>(); }
function createUserBuilder(): ConditionalShapeBuilder<false> { return new ConditionalShapeBuilder<false>(); }
const adminBuilt40 = createAdminBuilder().withName("Admin").withEmail("a@b.com").withAdminKey("sk-secret").build();

// 41. Builder with covariant/contravariant type relationships
type Consumer<T> = (val: T) => void;
type Producer<T> = () => T;
class TypeRelationBuilder<T> {
  private producers: Producer<T>[] = [];
  private consumers: Consumer<T>[] = [];
  addProducer(p: Producer<T>): this { this.producers.push(p); return this; }
  addConsumer(c: Consumer<T>): this { this.consumers.push(c); return this; }
  build(): { run: () => void } {
    const { producers, consumers } = this;
    return {
      run: () => {
        const values = producers.map(p => p());
        values.forEach(v => consumers.forEach(c => c(v)));
      }
    };
  }
}
const relay = new TypeRelationBuilder<number>()
  .addProducer(() => Math.random() * 100)
  .addProducer(() => Date.now() % 100)
  .addConsumer(v => console.log("A:", v))
  .addConsumer(v => console.log("B:", v.toFixed(2)))
  .build();

// 42. Builder for type-safe ORM-like query with relation loading
type LoadRelation<T, Relations extends keyof T> = Omit<T, Relations> & Required<Pick<T, Relations>>;
interface UserEntity { id: string; name: string; posts?: PostEntity[]; profile?: ProfileEntity }
interface PostEntity { id: string; title: string }
interface ProfileEntity { bio: string; avatar: string }
class EntityQueryBuilder<Entity, Loaded extends keyof Entity = never> {
  private relations: string[] = [];
  private filter: Record<string, unknown> = {};
  load<R extends keyof Entity>(relation: R): EntityQueryBuilder<Entity, Loaded | R> {
    this.relations.push(String(relation)); return this as any;
  }
  where(field: keyof Entity, val: unknown): this { this.filter[String(field)] = val; return this; }
  build(): { relations: string[]; filter: Record<string, unknown> } {
    return { relations: this.relations, filter: this.filter };
  }
}
const userQuery = new EntityQueryBuilder<UserEntity>()
  .load("posts").load("profile").where("id", "u_001").build();

// 43. Builder with type-safe property access paths
type Path43<T> = T extends object ? { [K in keyof T]: K extends string ? K | `${K}.${Path43<T[K]>}` : never }[keyof T] : never;
class PathAccessBuilder<T extends object> {
  private accessors: Map<string, (obj: T) => unknown> = new Map();
  access<P extends Path43<T>>(path: P): this {
    this.accessors.set(path as string, (obj: T) => {
      const parts = (path as string).split(".");
      return parts.reduce((acc: unknown, part) => (acc as any)?.[part], obj);
    });
    return this;
  }
  build(): { get: (obj: T, path: Path43<T>) => unknown } {
    const accessors = this.accessors;
    return {
      get: (obj: T, path: Path43<T>) => accessors.get(path as string)?.(obj)
    };
  }
}
type Obj43 = { user: { name: string; address: { city: string } } };
const pathBuilder43 = new PathAccessBuilder<Obj43>()
  .access("user").access("user.name").access("user.address.city").build();

// 44. Builder with capability flags — methods enabled based on which capabilities are set
type Caps44 = "readable" | "writable" | "deletable";
class CapabilityBuilder<C extends Caps44 = never> {
  private caps: Set<Caps44> = new Set();
  private data: Record<string, unknown> = {};
  withReadable(): CapabilityBuilder<C | "readable"> { this.caps.add("readable"); return this as any; }
  withWritable(): CapabilityBuilder<C | "writable"> { this.caps.add("writable"); return this as any; }
  withDeletable(): CapabilityBuilder<C | "deletable"> { this.caps.add("deletable"); return this as any; }
  read(this: CapabilityBuilder<C & "readable">): Record<string, unknown> { return { ...this.data }; }
  write(this: CapabilityBuilder<C & "writable">, update: Record<string, unknown>): void { Object.assign(this.data, update); }
  delete(this: CapabilityBuilder<C & "deletable">): void { for (const k in this.data) delete this.data[k]; }
  build(): { capabilities: Caps44[] } { return { capabilities: [...this.caps] }; }
}
const rw = new CapabilityBuilder().withReadable().withWritable();
const readResult = rw.read();

// 45. Builder producing a type-safe proxy object
class ProxyBuilder<T extends object> {
  private target: T;
  private getTraps: Partial<{ [K in keyof T]: (val: T[K]) => T[K] }> = {};
  private setTraps: Partial<{ [K in keyof T]: (val: T[K]) => T[K] }> = {};
  constructor(target: T) { this.target = target; }
  interceptGet<K extends keyof T>(key: K, fn: (val: T[K]) => T[K]): this { this.getTraps[key] = fn; return this; }
  interceptSet<K extends keyof T>(key: K, fn: (val: T[K]) => T[K]): this { this.setTraps[key] = fn; return this; }
  build(): T {
    const getTraps = this.getTraps, setTraps = this.setTraps;
    return new Proxy(this.target, {
      get: (target, prop, receiver) => {
        const val = Reflect.get(target, prop, receiver);
        const trap = getTraps[prop as keyof T];
        return trap ? trap(val) : val;
      },
      set: (target, prop, value, receiver) => {
        const trap = setTraps[prop as keyof T];
        return Reflect.set(target, prop, trap ? trap(value) : value, receiver);
      }
    });
  }
}
const proxy45 = new ProxyBuilder({ name: "alice", role: "user" })
  .interceptGet("name", v => v.toUpperCase())
  .interceptSet("role", v => (["user","admin"].includes(v) ? v : "user"))
  .build();

// 46. Builder with complete type safe middleware composition
type Middleware46<Input, Output, Next extends Output = Output> =
  (input: Input, next: (input: Input) => Next) => Output;
class MiddlewareComposer<Input, Output> {
  private middlewares: Middleware46<Input, Output>[] = [];
  use(mw: Middleware46<Input, Output>): this { this.middlewares.push(mw); return this; }
  build(terminal: (input: Input) => Output): (input: Input) => Output {
    return this.middlewares.reduceRight(
      (next: (input: Input) => Output, mw: Middleware46<Input, Output>) =>
        (input: Input) => mw(input, next),
      terminal
    );
  }
}
interface Ctx46 { body: string; userId?: string; timestamp?: number }
const pipeline46 = new MiddlewareComposer<Ctx46, Ctx46>()
  .use((ctx, next) => next({ ...ctx, timestamp: Date.now() }))
  .use((ctx, next) => next({ ...ctx, userId: "extracted_from_token" }))
  .build(ctx => ctx);
const result46 = pipeline46({ body: "request" });

// 47. Builder with type-safe recursive JSON builder
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
class JsonBuilder {
  private value: JsonValue;
  private constructor(v: JsonValue) { this.value = v; }
  static object(fn: (b: JsonObjectBuilder) => JsonObjectBuilder): JsonBuilder {
    return new JsonBuilder(fn(new JsonObjectBuilder()).build());
  }
  static array(fn: (b: JsonArrayBuilder) => JsonArrayBuilder): JsonBuilder {
    return new JsonBuilder(fn(new JsonArrayBuilder()).build());
  }
  static literal(v: string | number | boolean | null): JsonBuilder { return new JsonBuilder(v); }
  build(): JsonValue { return this.value; }
}
class JsonObjectBuilder {
  private obj: { [key: string]: JsonValue } = {};
  set(key: string, value: JsonBuilder): this { this.obj[key] = value.build(); return this; }
  setLiteral(key: string, value: string | number | boolean | null): this { this.obj[key] = value; return this; }
  build(): { [key: string]: JsonValue } { return { ...this.obj }; }
}
class JsonArrayBuilder {
  private arr: JsonValue[] = [];
  push(value: JsonBuilder): this { this.arr.push(value.build()); return this; }
  pushLiteral(v: string | number | boolean | null): this { this.arr.push(v); return this; }
  build(): JsonValue[] { return [...this.arr]; }
}
const json47 = JsonBuilder.object(o => o
  .setLiteral("name", "Alice")
  .set("address", JsonBuilder.object(a => a.setLiteral("city", "NYC").setLiteral("zip", "10001")))
  .set("tags", JsonBuilder.array(a => a.pushLiteral("admin").pushLiteral("user")))
).build();

// 48. Builder with exhaustive type narrowing for analytics events
type AnalyticsEvent =
  | { event: "page_view"; url: string; referrer?: string }
  | { event: "click"; elementId: string; coordinates: { x: number; y: number } }
  | { event: "conversion"; funnel: string; step: number; value: number };
class AnalyticsEventBuilder<E extends AnalyticsEvent["event"]> {
  private payload: Partial<Extract<AnalyticsEvent, { event: E }>> = {};
  constructor(event: E) { (this.payload as any)["event"] = event; }
  set<K extends keyof Extract<AnalyticsEvent, { event: E }>>(k: K, v: Extract<AnalyticsEvent, { event: E }>[K]): this {
    (this.payload as any)[k] = v; return this;
  }
  build(): Extract<AnalyticsEvent, { event: E }> { return this.payload as Extract<AnalyticsEvent, { event: E }>; }
}
function analyticsEvent<E extends AnalyticsEvent["event"]>(e: E) { return new AnalyticsEventBuilder(e); }
const pageViewEvt = analyticsEvent("page_view").set("url", "/home").set("referrer", "/about").build();
const clickEvt = analyticsEvent("click").set("elementId", "btn-signup").set("coordinates", { x: 100, y: 200 }).build();

// 49. Builder with compile-time verified required fields using intersection narrowing
type RequiredFields<T, K extends keyof T> = Pick<T, K>;
type BuildableWhen<T, Required extends keyof T, Provided extends keyof T> =
  Required extends Provided ? T : never;
class RequiredFieldBuilder<T extends object, Provided extends keyof T = never> {
  private data: Partial<T> = {};
  set<K extends keyof T>(k: K, v: T[K]): RequiredFieldBuilder<T, Provided | K> {
    this.data[k] = v; return this as any;
  }
  build<Required extends keyof T>(
    this: RequiredFieldBuilder<T, BuildableWhen<T, Required, Provided> extends never ? never : Provided>
  ): T { return this.data as T; }
}

// 50. Ultimate production-grade builder — type-safe API client with interceptors, retries, and schema validation
type HttpVerb = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type RequestInterceptor = (req: { url: string; method: HttpVerb; headers: Record<string, string>; body?: unknown }) => typeof req;
type ResponseInterceptor = (res: { status: number; data: unknown }) => typeof res;
interface ApiClientConfig { baseUrl: string; timeout: number; retries: number; headers: Record<string, string> }
class ProductionApiClientBuilder {
  private config: ApiClientConfig = { baseUrl: "", timeout: 10000, retries: 0, headers: {} };
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  withBaseUrl(url: string): this { this.config.baseUrl = url; return this; }
  withTimeout(ms: number): this { this.config.timeout = ms; return this; }
  withRetries(n: number): this { this.config.retries = n; return this; }
  withHeader(k: string, v: string): this { this.config.headers[k] = v; return this; }
  withBearerAuth(token: string): this { return this.withHeader("Authorization", `Bearer ${token}`); }
  addRequestInterceptor(fn: RequestInterceptor): this { this.requestInterceptors.push(fn); return this; }
  addResponseInterceptor(fn: ResponseInterceptor): this { this.responseInterceptors.push(fn); return this; }
  build() {
    const { config, requestInterceptors, responseInterceptors } = this;
    async function request<T>(method: HttpVerb, path: string, body?: unknown): Promise<T> {
      let req = { url: `${config.baseUrl}${path}`, method, headers: { ...config.headers }, body };
      for (const interceptor of requestInterceptors) req = interceptor(req);
      for (let attempt = 0; attempt <= config.retries; attempt++) {
        try {
          const response = await fetch(req.url, {
            method: req.method, headers: req.headers,
            body: body ? JSON.stringify(body) : undefined,
            signal: AbortSignal.timeout(config.timeout)
          });
          let res = { status: response.status, data: await response.json() };
          for (const interceptor of responseInterceptors) res = interceptor(res);
          return res.data as T;
        } catch (e) { if (attempt === config.retries) throw e; }
      }
      throw new Error("Unreachable");
    }
    return {
      get: <T>(path: string) => request<T>("GET", path),
      post: <T>(path: string, body: unknown) => request<T>("POST", path, body),
      put: <T>(path: string, body: unknown) => request<T>("PUT", path, body),
      patch: <T>(path: string, body: unknown) => request<T>("PATCH", path, body),
      delete: <T>(path: string) => request<T>("DELETE", path)
    };
  }
}
const apiClient = new ProductionApiClientBuilder()
  .withBaseUrl("https://api.example.com")
  .withTimeout(5000)
  .withRetries(3)
  .withBearerAuth("sk-prod-abc123")
  .withHeader("Accept", "application/json")
  .addRequestInterceptor(req => ({ ...req, headers: { ...req.headers, "X-Request-Id": Math.random().toString(36).slice(2) } }))
  .addResponseInterceptor(res => { if (res.status >= 400) console.error("API Error:", res.status); return res; })
  .build();
