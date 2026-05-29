export {};

// ── Intermediate Builder Pattern Examples ─────────────────────────────────────

// 1. Generic typed builder with type accumulation
type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;
class TypedBuilder<T extends Record<string, any>> {
  private data: Partial<T> = {};
  set<K extends keyof T>(key: K, val: T[K]): this { this.data[key] = val; return this; }
  build(): T { return this.data as T; }
}
const typedUser = new TypedBuilder<{ name: string; age: number }>()
  .set("name", "Alice").set("age", 30).build();

// 2. Step builder with required fields enforced by type
type Required2<T, K extends keyof T> = T & Required<Pick<T, K>>;
class StepBuilder<T extends Record<string, any>, Required extends keyof T = never> {
  private data: Partial<T> = {};
  set<K extends keyof T>(key: K, val: T[K]): StepBuilder<T, Required | K> {
    this.data[key] = val; return this as any;
  }
  build(this: StepBuilder<T, keyof T>): T { return this.data as T; }
}

// 3. Builder with validation at build time
class ValidatedBuilder<T> {
  private data: Partial<T> = {};
  private validators: Partial<{ [K in keyof T]: (v: T[K]) => string | null }> = {};
  set<K extends keyof T>(k: K, v: T[K]): this { this.data[k] = v; return this; }
  validate<K extends keyof T>(k: K, fn: (v: T[K]) => string | null): this { this.validators[k] = fn as any; return this; }
  build(): { value: T; errors: Partial<Record<keyof T, string>> } {
    const errors: Partial<Record<keyof T, string>> = {};
    for (const [k, fn] of Object.entries(this.validators)) {
      const err = (fn as any)(this.data[k as keyof T]);
      if (err) errors[k as keyof T] = err;
    }
    return { value: this.data as T, errors };
  }
}
const validated = new ValidatedBuilder<{ name: string; email: string }>()
  .set("name", "Alice").set("email", "invalid")
  .validate("email", e => e.includes("@") ? null : "Invalid email")
  .build();

// 4. Immutable builder (returns new instance on each set)
class ImmutableBuilder<T> {
  private constructor(private data: Partial<T> = {}) {}
  static create<T>(): ImmutableBuilder<T> { return new ImmutableBuilder<T>(); }
  set<K extends keyof T>(k: K, v: T[K]): ImmutableBuilder<T> {
    return new ImmutableBuilder<T>({ ...this.data, [k]: v });
  }
  build(): T { return { ...this.data } as T; }
}
const b1 = ImmutableBuilder.create<{ name: string; age: number }>();
const b2 = b1.set("name", "Alice");
const b3 = b2.set("age", 30);

// 5. Factory method builder
interface Vehicle { type: string; wheels: number; fuelType: string }
class VehicleBuilder {
  private vehicle: Partial<Vehicle> = {};
  static car(): VehicleBuilder { return new VehicleBuilder().type("car").wheels(4); }
  static truck(): VehicleBuilder { return new VehicleBuilder().type("truck").wheels(18); }
  static bike(): VehicleBuilder { return new VehicleBuilder().type("bike").wheels(2); }
  type(t: string): this { this.vehicle.type = t; return this; }
  wheels(n: number): this { this.vehicle.wheels = n; return this; }
  fuel(f: string): this { this.vehicle.fuelType = f; return this; }
  build(): Vehicle { return this.vehicle as Vehicle; }
}
const car = VehicleBuilder.car().fuel("electric").build();
const bike = VehicleBuilder.bike().fuel("petrol").build();

// 6. Builder with observer hook
class ObservedBuilder<T> {
  private data: Partial<T> = {};
  private onChange?: (key: keyof T, val: T[keyof T]) => void;
  withChangeHandler(fn: (key: keyof T, val: T[keyof T]) => void): this { this.onChange = fn; return this; }
  set<K extends keyof T>(k: K, v: T[K]): this {
    this.data[k] = v; this.onChange?.(k, v as T[keyof T]); return this;
  }
  build(): T { return this.data as T; }
}
const ob = new ObservedBuilder<{ name: string; age: number }>()
  .withChangeHandler((k, v) => console.log(`Set ${String(k)}=${v}`))
  .set("name", "Alice").set("age", 30).build();

// 7. Query builder with chained joins
class SQLBuilder {
  private selects: string[] = ["*"];
  private froms: string[] = [];
  private joins: string[] = [];
  private wheres: string[] = [];
  private orderBy = "";
  private limit?: number;
  select(...fields: string[]): this { this.selects = fields; return this; }
  from(table: string): this { this.froms.push(table); return this; }
  join(table: string, on: string): this { this.joins.push(`JOIN ${table} ON ${on}`); return this; }
  leftJoin(table: string, on: string): this { this.joins.push(`LEFT JOIN ${table} ON ${on}`); return this; }
  where(cond: string): this { this.wheres.push(cond); return this; }
  order(field: string, dir: "ASC" | "DESC" = "ASC"): this { this.orderBy = `${field} ${dir}`; return this; }
  limitTo(n: number): this { this.limit = n; return this; }
  build(): string {
    return [
      `SELECT ${this.selects.join(", ")}`,
      `FROM ${this.froms.join(", ")}`,
      ...this.joins,
      this.wheres.length ? `WHERE ${this.wheres.join(" AND ")}` : "",
      this.orderBy ? `ORDER BY ${this.orderBy}` : "",
      this.limit !== undefined ? `LIMIT ${this.limit}` : ""
    ].filter(Boolean).join(" ");
  }
}
const sql = new SQLBuilder()
  .select("u.id", "u.name", "p.title")
  .from("users u")
  .leftJoin("posts p", "p.user_id = u.id")
  .where("u.active = true").order("u.name").limitTo(10).build();

// 8. Recursive builder (nested builders)
class AddressBuilder2 {
  private street = ""; private city = ""; private country = "";
  withStreet(s: string): this { this.street = s; return this; }
  withCity(c: string): this { this.city = c; return this; }
  withCountry(c: string): this { this.country = c; return this; }
  build() { return { street: this.street, city: this.city, country: this.country }; }
}
class PersonBuilder {
  private name = ""; private age = 0;
  private address?: ReturnType<AddressBuilder2["build"]>;
  withName(n: string): this { this.name = n; return this; }
  withAge(a: number): this { this.age = a; return this; }
  withAddress(fn: (b: AddressBuilder2) => AddressBuilder2): this {
    this.address = fn(new AddressBuilder2()).build(); return this;
  }
  build() { return { name: this.name, age: this.age, address: this.address }; }
}
const person = new PersonBuilder().withName("Alice").withAge(30)
  .withAddress(a => a.withStreet("123 Main St").withCity("Springfield").withCountry("US")).build();

// 9. Builder with undo stack
class UndoableBuilder<T extends Record<string, any>> {
  private history: Partial<T>[] = [{}];
  private pointer = 0;
  get current(): Partial<T> { return { ...this.history[this.pointer] }; }
  set<K extends keyof T>(k: K, v: T[K]): this {
    this.history = this.history.slice(0, this.pointer + 1);
    this.history.push({ ...this.current, [k]: v });
    this.pointer++;
    return this;
  }
  undo(): this { if (this.pointer > 0) this.pointer--; return this; }
  redo(): this { if (this.pointer < this.history.length - 1) this.pointer++; return this; }
  build(): T { return this.current as T; }
}
const ub = new UndoableBuilder<{ a: number; b: string }>().set("a", 1).set("b", "x").undo();

// 10. Builder with schema-driven defaults
type Schema2<T> = { [K in keyof T]: { default: T[K]; required?: boolean } };
class SchemaBuilder2<T> {
  private values: Partial<T> = {};
  constructor(private schema: Schema2<T>) {
    for (const [k, v] of Object.entries(schema)) this.values[k as keyof T] = (v as any).default;
  }
  set<K extends keyof T>(k: K, v: T[K]): this { this.values[k] = v; return this; }
  build(): T { return this.values as T; }
}
const sb = new SchemaBuilder2<{ name: string; active: boolean; timeout: number }>({
  name: { default: "", required: true },
  active: { default: true },
  timeout: { default: 5000 }
}).set("name", "MyService").build();

// 11. Fluent HTTP client builder
class HttpClientBuilder {
  private baseUrl = "";
  private headers: Record<string, string> = {};
  private interceptors: ((req: Request) => Request)[] = [];
  private timeout = 10000;
  baseURL(url: string): this { this.baseUrl = url; return this; }
  withHeader(k: string, v: string): this { this.headers[k] = v; return this; }
  withBearerToken(token: string): this { return this.withHeader("Authorization", `Bearer ${token}`); }
  withInterceptor(fn: (req: Request) => Request): this { this.interceptors.push(fn); return this; }
  withTimeout(ms: number): this { this.timeout = ms; return this; }
  build() {
    const { baseUrl, headers } = this;
    return {
      get: (path: string) => fetch(`${baseUrl}${path}`, { headers }),
      post: (path: string, body: any) => fetch(`${baseUrl}${path}`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(body) })
    };
  }
}
const http = new HttpClientBuilder().baseURL("https://api.example.com").withBearerToken("abc123").withTimeout(3000).build();

// 12. Typed form validator builder
type Validator2<T> = (val: T) => string | null;
class FieldBuilder<T> {
  private validators: Validator2<T>[] = [];
  private label = "";
  withLabel(l: string): this { this.label = l; return this; }
  required(): this { return this.addValidator(v => v === undefined || v === null || v === "" ? `${this.label} is required` : null); }
  min(n: number): this { return this.addValidator(v => typeof v === "number" && v < n ? `${this.label} must be >= ${n}` : null); }
  max(n: number): this { return this.addValidator(v => typeof v === "number" && v > n ? `${this.label} must be <= ${n}` : null); }
  addValidator(fn: Validator2<T>): this { this.validators.push(fn); return this; }
  build() { return (val: T): string[] => this.validators.map(v => v(val)).filter((e): e is string => e !== null); }
}
const ageField = new FieldBuilder<number>().withLabel("Age").required().min(0).max(150).build();

// 13. Typed event builder
interface EventSpec { name: string; payload?: any; meta?: Record<string, any> }
class EventBuilder<T extends EventSpec = EventSpec> {
  private spec: Partial<T> = {};
  name(n: T["name"]): this { (this.spec as any).name = n; return this; }
  payload(p: T["payload"]): this { (this.spec as any).payload = p; return this; }
  meta(m: Record<string, any>): this { (this.spec as any).meta = m; return this; }
  build(): T & { timestamp: number } { return { ...this.spec, timestamp: Date.now() } as any; }
}
const loginEvent = new EventBuilder().name("user.login").payload({ userId: "123" }).build();

// 14. Multi-stage builder pattern
class Stage1Builder {
  constructor(private name: string) {}
  withEmail(email: string): Stage2Builder { return new Stage2Builder(this.name, email); }
}
class Stage2Builder {
  constructor(private name: string, private email: string) {}
  withRole(role: string): Stage3Builder { return new Stage3Builder(this.name, this.email, role); }
}
class Stage3Builder {
  constructor(private name: string, private email: string, private role: string) {}
  build() { return { name: this.name, email: this.email, role: this.role }; }
}
const staged = new Stage1Builder("Alice").withEmail("alice@example.com").withRole("admin").build();

// 15. Builder with conditional method availability (type-state)
type HasName = { _name: true };
type HasEmail = { _email: true };
type FullUser = HasName & HasEmail;
class UserTypeStateBuilder<State = {}> {
  private data: any = {};
  withName(name: string): UserTypeStateBuilder<State & HasName> { this.data.name = name; return this as any; }
  withEmail(email: string): UserTypeStateBuilder<State & HasEmail> { this.data.email = email; return this as any; }
  build(this: UserTypeStateBuilder<FullUser>) { return this.data as { name: string; email: string }; }
}
const tsb = new UserTypeStateBuilder().withName("Alice").withEmail("alice@example.com").build();

// 16. Strategy-injected builder
type SortStrategy<T> = (a: T, b: T) => number;
class CollectionBuilder<T> {
  private items: T[] = [];
  private sortFn?: SortStrategy<T>;
  add(item: T): this { this.items.push(item); return this; }
  sortBy(fn: SortStrategy<T>): this { this.sortFn = fn; return this; }
  build(): T[] { return this.sortFn ? [...this.items].sort(this.sortFn) : [...this.items]; }
}
const sorted = new CollectionBuilder<{ name: string; age: number }>()
  .add({ name: "Charlie", age: 25 }).add({ name: "Alice", age: 30 })
  .sortBy((a, b) => a.name.localeCompare(b.name)).build();

// 17. Builder with mixin composition
type Ctor<T = {}> = new (...args: any[]) => T;
function WithTimestamps<TBase extends Ctor>(Base: TBase) {
  return class extends Base {
    createdAt = new Date();
    updatedAt = new Date();
    touch() { this.updatedAt = new Date(); return this; }
  };
}
class BaseEntityBuilder { protected data: any = {}; }
const TimestampedBuilder = WithTimestamps(BaseEntityBuilder);
class UserEntityBuilder extends TimestampedBuilder {
  name(n: string): this { this.data.name = n; return this; }
  build() { return { ...this.data, createdAt: this.createdAt, updatedAt: this.updatedAt }; }
}
const ue = new UserEntityBuilder().name("Alice").touch().build();

// 18. Async builder (with async setup)
class AsyncBuilder<T> {
  private steps: ((acc: T) => Promise<T>)[] = [];
  addAsyncStep(fn: (acc: T) => Promise<T>): this { this.steps.push(fn); return this; }
  async build(initial: T): Promise<T> {
    return this.steps.reduce(async (acc, fn) => fn(await acc), Promise.resolve(initial));
  }
}
const asyncB = new AsyncBuilder<{ id: string; name: string }>()
  .addAsyncStep(async u => ({ ...u, name: u.name.toUpperCase() }))
  .addAsyncStep(async u => ({ ...u, id: Math.random().toString(36).slice(2) }));

// 19. Environment-aware builder
type Env = "development" | "staging" | "production";
class EnvBuilder<T> {
  private configs: Partial<Record<Env, Partial<T>>> = {};
  private base: Partial<T> = {};
  withBase(cfg: Partial<T>): this { this.base = cfg; return this; }
  forEnv(env: Env, cfg: Partial<T>): this { this.configs[env] = cfg; return this; }
  build(env: Env): T {
    return { ...this.base, ...this.configs[env] } as T;
  }
}
const envCfg = new EnvBuilder<{ apiUrl: string; debug: boolean }>()
  .withBase({ debug: false })
  .forEnv("development", { apiUrl: "http://localhost:3000", debug: true })
  .forEnv("production", { apiUrl: "https://api.example.com" })
  .build("development");

// 20. Lazy builder (deferred construction)
class LazyBuilder<T> {
  private factory?: () => T;
  private instance?: T;
  withFactory(fn: () => T): this { this.factory = fn; return this; }
  get(): T {
    if (!this.instance) this.instance = this.factory!();
    return this.instance;
  }
}
const lazyUser = new LazyBuilder<{ name: string }>()
  .withFactory(() => ({ name: "Alice" }));

// 21. Builder with event hooks
class HookableBuilder<T> {
  private data: Partial<T> = {};
  private hooks: { before?: () => void; after?: (result: T) => void } = {};
  set<K extends keyof T>(k: K, v: T[K]): this { this.data[k] = v; return this; }
  onBeforeBuild(fn: () => void): this { this.hooks.before = fn; return this; }
  onAfterBuild(fn: (result: T) => void): this { this.hooks.after = fn; return this; }
  build(): T {
    this.hooks.before?.();
    const result = this.data as T;
    this.hooks.after?.(result);
    return result;
  }
}

// 22. Builder with computed fields
class ComputedBuilder<T, C extends Record<string, (data: T) => any> = {}> {
  private data: Partial<T> = {};
  private computed: C;
  constructor(computed: C) { this.computed = computed; }
  set<K extends keyof T>(k: K, v: T[K]): this { this.data[k] = v; return this; }
  build(): T & { [K in keyof C]: ReturnType<C[K]> } {
    const computedValues: any = {};
    for (const [k, fn] of Object.entries(this.computed)) computedValues[k] = fn(this.data as T);
    return { ...this.data, ...computedValues } as any;
  }
}
const cb = new ComputedBuilder({ fullName: (u: { first: string; last: string }) => `${u.first} ${u.last}` })
  .set("first", "Alice").set("last", "Smith").build();

// 23. Builder with serialization
class SerializableBuilder<T> {
  private data: Partial<T> = {};
  set<K extends keyof T>(k: K, v: T[K]): this { this.data[k] = v; return this; }
  build(): T { return this.data as T; }
  toJSON(): string { return JSON.stringify(this.data); }
  static fromJSON<T>(json: string): T { return JSON.parse(json); }
}
const sb2 = new SerializableBuilder<{ name: string }>().set("name", "Alice");
const json = sb2.toJSON();

// 24. Composite builder (builds multiple sub-objects)
class CompositeBuilder<T extends Record<string, any>> {
  private parts: Partial<T> = {};
  private builders: Partial<{ [K in keyof T]: any }> = {};
  setPart<K extends keyof T>(key: K, builder: { build(): T[K] }): this {
    this.builders[key] = builder; return this;
  }
  setValue<K extends keyof T>(key: K, val: T[K]): this { this.parts[key] = val; return this; }
  build(): T {
    const result: Partial<T> = { ...this.parts };
    for (const [k, b] of Object.entries(this.builders)) result[k as keyof T] = (b as any).build();
    return result as T;
  }
}

// 25. Prototype-based builder (clone from template)
class PrototypeBuilder<T extends object> {
  constructor(private prototype: T) {}
  clone(): T & { set<K extends keyof T>(k: K, v: T[K]): T } {
    const copy = { ...this.prototype };
    (copy as any).set = <K extends keyof T>(k: K, v: T[K]) => { (copy as any)[k] = v; return copy; };
    return copy as any;
  }
}
const userProto = new PrototypeBuilder({ name: "Default", role: "user", active: true });
const user2 = userProto.clone();

// 26. Builder with type-narrowing via discriminant
type ProductBase = { sku: string; price: number };
type DigitalProduct = ProductBase & { type: "digital"; downloadUrl: string };
type PhysicalProduct = ProductBase & { type: "physical"; weight: number; dimensions: string };
class ProductBuilder {
  static digital(sku: string, price: number) {
    return {
      sku, price, type: "digital" as const,
      withDownload(url: string): DigitalProduct { return { sku, price, type: "digital", downloadUrl: url }; }
    };
  }
  static physical(sku: string, price: number) {
    return {
      sku, price, type: "physical" as const,
      withWeight(w: number) { return { ...this, weight: w, withDimensions(d: string): PhysicalProduct { return { sku, price, type: "physical", weight: w, dimensions: d }; } }; }
    };
  }
}
const dp = ProductBuilder.digital("DL-001", 9.99).withDownload("https://cdn.example.com/file");

// 27. Builder with transformation pipeline
class PipelineBuilder2<T> {
  private transforms: ((val: T) => T)[] = [];
  pipe(fn: (val: T) => T): this { this.transforms.push(fn); return this; }
  build(): (input: T) => T {
    const fns = this.transforms;
    return (input: T) => fns.reduce((acc, fn) => fn(acc), input);
  }
}
const normalize = new PipelineBuilder2<string>()
  .pipe(s => s.trim()).pipe(s => s.toLowerCase()).pipe(s => s.replace(/\s+/g, "_")).build();

// 28. Builder with dependency injection
class DIBuilder<Services extends Record<string, any>> {
  private services: Partial<Services> = {};
  provide<K extends keyof Services>(k: K, factory: () => Services[K]): this {
    this.services[k] = factory(); return this;
  }
  build(): Services { return this.services as Services; }
}
const di = new DIBuilder<{ logger: { log: (msg: string) => void }; db: { query: (sql: string) => any[] } }>()
  .provide("logger", () => ({ log: console.log }))
  .provide("db", () => ({ query: (_sql: string) => [] })).build();

// 29. Builder with automatic type inference
function createBuilder<T>(defaults: T) {
  const data = { ...defaults };
  const builder = {
    set<K extends keyof T>(k: K, v: T[K]): typeof builder { data[k] = v; return builder; },
    build(): T { return { ...data }; }
  };
  return builder;
}
const b = createBuilder({ name: "", age: 0, active: true }).set("name", "Alice").set("age", 30).build();

// 30. Builder for paginated list
class PaginatedListBuilder<T> {
  private items: T[] = [];
  private meta = { page: 1, pageSize: 10, total: 0 };
  addItems(items: T[]): this { this.items.push(...items); return this; }
  withPage(page: number): this { this.meta.page = page; return this; }
  withPageSize(size: number): this { this.meta.pageSize = size; return this; }
  withTotal(total: number): this { this.meta.total = total; return this; }
  build() {
    return {
      data: this.items,
      meta: {
        ...this.meta,
        totalPages: Math.ceil(this.meta.total / this.meta.pageSize),
        hasNext: this.meta.page * this.meta.pageSize < this.meta.total,
        hasPrev: this.meta.page > 1
      }
    };
  }
}
const list = new PaginatedListBuilder<{ id: string; name: string }>()
  .addItems([{ id: "1", name: "Alice" }]).withPage(2).withPageSize(20).withTotal(100).build();

// 31. Builder for environment variable config
class EnvConfigBuilder {
  private fields: Record<string, { key: string; default?: string; required?: boolean }> = {};
  field(name: string, envKey: string, defaultVal?: string): this {
    this.fields[name] = { key: envKey, default: defaultVal }; return this;
  }
  required(name: string, envKey: string): this {
    this.fields[name] = { key: envKey, required: true }; return this;
  }
  build(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [name, spec] of Object.entries(this.fields)) {
      const val = process.env[spec.key] ?? spec.default;
      if (spec.required && !val) throw new Error(`Missing required env var: ${spec.key}`);
      if (val) result[name] = val;
    }
    return result;
  }
}
const envConfig = new EnvConfigBuilder()
  .required("dbUrl", "DATABASE_URL")
  .field("port", "PORT", "3000")
  .field("debug", "DEBUG", "false").build();

// 32. Builder with clone/merge
class MergableBuilder<T> {
  constructor(private data: T) {}
  merge(partial: Partial<T>): MergableBuilder<T> { return new MergableBuilder<T>({ ...this.data, ...partial }); }
  build(): T { return this.data; }
}
const base2 = new MergableBuilder({ name: "Default", debug: false, port: 3000 });
const prod = base2.merge({ debug: false, port: 8080 }).build();
const dev  = base2.merge({ debug: true,  port: 3000 }).build();

// 33. Builder with array helper methods
class ListBuilder<T> {
  private items: T[] = [];
  add(item: T): this { this.items.push(item); return this; }
  addMany(items: T[]): this { this.items.push(...items); return this; }
  remove(pred: (item: T) => boolean): this { this.items = this.items.filter(i => !pred(i)); return this; }
  transform(fn: (item: T) => T): this { this.items = this.items.map(fn); return this; }
  build(): T[] { return [...this.items]; }
}
const names = new ListBuilder<string>().addMany(["Alice", "Bob", "Charlie"]).remove(n => n === "Bob").build();

// 34. Builder with method aliases
class AliasedBuilder<T extends Record<string, any>> {
  private data: Partial<T> = {};
  set<K extends keyof T>(k: K, v: T[K]): this { this.data[k] = v; return this; }
  // Alias methods that delegate to set
  name = (v: string) => this.set("name" as keyof T, v as T[keyof T]);
  email = (v: string) => this.set("email" as keyof T, v as T[keyof T]);
  build(): T { return this.data as T; }
}

// 35. Builder with template method
abstract class TemplateBuilder<T> {
  protected abstract setDefaults(): void;
  protected abstract validate(data: Partial<T>): void;
  protected data: Partial<T> = {};
  build(): T {
    this.setDefaults();
    this.validate(this.data);
    return this.data as T;
  }
}
class ProductTemplateBuilder extends TemplateBuilder<{ sku: string; price: number; stock: number }> {
  withSku(s: string): this { this.data.sku = s; return this; }
  withPrice(p: number): this { this.data.price = p; return this; }
  protected setDefaults() { this.data.stock ??= 0; }
  protected validate(d: Partial<{ sku: string; price: number; stock: number }>) {
    if (!d.sku) throw new Error("SKU required");
    if (!d.price || d.price < 0) throw new Error("Price must be positive");
  }
}
const product = new ProductTemplateBuilder().withSku("SKU-001").withPrice(19.99).build();

// 36. Builder with interceptor chain
type Interceptor<T> = (val: T, next: (val: T) => T) => T;
class InterceptorBuilder<T> {
  private interceptors: Interceptor<T>[] = [];
  add(fn: Interceptor<T>): this { this.interceptors.push(fn); return this; }
  build(initial: T): T {
    const chain = this.interceptors.reduceRight(
      (next: (val: T) => T, fn: Interceptor<T>) => (val: T) => fn(val, next),
      (val: T) => val
    );
    return chain(initial);
  }
}
const ib = new InterceptorBuilder<string>()
  .add((val, next) => next(val.trim()))
  .add((val, next) => next(val.toUpperCase())).build("  hello  ");

// 37. Builder with conditional branches
class ConditionalBuilder<T> {
  private data: Partial<T> = {};
  set<K extends keyof T>(k: K, v: T[K]): this { this.data[k] = v; return this; }
  setIf<K extends keyof T>(condition: boolean, k: K, v: T[K]): this {
    if (condition) this.data[k] = v; return this;
  }
  setIfDefined<K extends keyof T>(k: K, v: T[K] | undefined): this {
    if (v !== undefined) this.data[k] = v; return this;
  }
  build(): T { return this.data as T; }
}
const isProd = process.env.NODE_ENV === "production";
const conditionalCfg = new ConditionalBuilder<{ debug: boolean; logLevel: string }>()
  .set("logLevel", "info").setIf(isProd, "debug", false).setIf(!isProd, "debug", true).build();

// 38. Builder with generic constraints
class TypeConstrainedBuilder<T extends { id: string; createdAt: Date }> {
  private data: Partial<T> = {};
  withId(id: string): this { this.data.id = id; return this; }
  set<K extends keyof T>(k: K, v: T[K]): this { this.data[k] = v; return this; }
  build(): T {
    this.data.createdAt ??= new Date() as T["createdAt"];
    return this.data as T;
  }
}
const constrained = new TypeConstrainedBuilder<{ id: string; createdAt: Date; name: string }>()
  .withId("abc").set("name", "Test").build();

// 39. Builder with batch updates
class BatchUpdateBuilder<T> {
  private updates: Partial<T>[] = [];
  batch(update: Partial<T>): this { this.updates.push(update); return this; }
  build(initial: T): T {
    return this.updates.reduce((acc, update) => ({ ...acc, ...update }), initial);
  }
}
const bub = new BatchUpdateBuilder<{ a: number; b: string; c: boolean }>()
  .batch({ a: 1 }).batch({ b: "x" }).batch({ c: true }).build({ a: 0, b: "", c: false });

// 40. Builder with retry logic
class RetryableOperationBuilder<T> {
  private fn?: () => Promise<T>;
  private maxRetries = 3;
  private retryDelay = 1000;
  private shouldRetry: (e: Error) => boolean = () => true;
  withOperation(fn: () => Promise<T>): this { this.fn = fn; return this; }
  withMaxRetries(n: number): this { this.maxRetries = n; return this; }
  withDelay(ms: number): this { this.retryDelay = ms; return this; }
  withRetryCondition(fn: (e: Error) => boolean): this { this.shouldRetry = fn; return this; }
  build(): () => Promise<T> {
    const { fn, maxRetries, retryDelay, shouldRetry } = this;
    return async () => {
      for (let i = 0; i <= maxRetries; i++) {
        try { return await fn!(); }
        catch (e) {
          if (i === maxRetries || !shouldRetry(e as Error)) throw e;
          await new Promise(r => setTimeout(r, retryDelay * (i + 1)));
        }
      }
      throw new Error("Unreachable");
    };
  }
}

// 41. Tree builder
type TreeNode2<T> = { value: T; children: TreeNode2<T>[] };
class TreeBuilder<T> {
  private node: TreeNode2<T>;
  constructor(value: T) { this.node = { value, children: [] }; }
  addChild(value: T, fn?: (b: TreeBuilder<T>) => TreeBuilder<T>): this {
    const child = new TreeBuilder<T>(value);
    if (fn) fn(child);
    this.node.children.push(child.build()); return this;
  }
  build(): TreeNode2<T> { return this.node; }
}
const tree = new TreeBuilder("root")
  .addChild("branch1", b => b.addChild("leaf1").addChild("leaf2"))
  .addChild("branch2").build();

// 42. Command builder
interface Command2<T> { execute(): T; undo(): T; description: string }
class CommandBuilder<T> {
  private executeFn?: () => T;
  private undoFn?: () => T;
  private desc = "";
  withExecute(fn: () => T): this { this.executeFn = fn; return this; }
  withUndo(fn: () => T): this { this.undoFn = fn; return this; }
  withDescription(d: string): this { this.desc = d; return this; }
  build(): Command2<T> {
    return { execute: this.executeFn!, undo: this.undoFn!, description: this.desc };
  }
}
const cmd = new CommandBuilder<number>()
  .withExecute(() => 42).withUndo(() => 0).withDescription("Set value to 42").build();

// 43. Throttled builder (prevents rapid build calls)
class ThrottledBuilder<T> {
  private data: Partial<T> = {};
  private dirty = false;
  set<K extends keyof T>(k: K, v: T[K]): this { this.data[k] = v; this.dirty = true; return this; }
  buildIfDirty(): T | null {
    if (!this.dirty) return null;
    this.dirty = false;
    return { ...this.data } as T;
  }
  build(): T { return { ...this.data } as T; }
}

// 44. Typed option builder
type Options<T> = { [K in keyof T]: { value: T[K]; description: string } };
class OptionsBuilder<T extends Record<string, any>> {
  private options: Partial<Options<T>> = {};
  addOption<K extends keyof T>(k: K, value: T[K], description: string): this {
    this.options[k] = { value, description } as any; return this;
  }
  build(): T {
    const result: any = {};
    for (const [k, opt] of Object.entries(this.options)) result[k] = (opt as any).value;
    return result as T;
  }
}

// 45. Accumulator builder
class AccumulatorBuilder<T extends number | string> {
  private items: T[] = [];
  push(item: T): this { this.items.push(item); return this; }
  build(): { items: T[]; sum: T extends number ? number : string } {
    const sum = this.items.reduce((a, b) => (a as any) + (b as any)) as T extends number ? number : string;
    return { items: [...this.items], sum };
  }
}
const accNum = new AccumulatorBuilder<number>().push(1).push(2).push(3).build();

// 46. Snapshot diff builder
class DiffBuilder<T extends Record<string, any>> {
  constructor(private before: T, private after: Partial<T>) {}
  build(): { added: Partial<T>; removed: Partial<T>; changed: Partial<T> } {
    const added: Partial<T> = {}, removed: Partial<T> = {}, changed: Partial<T> = {};
    for (const k in this.after) {
      if (!(k in this.before)) added[k] = this.after[k];
      else if (this.before[k] !== this.after[k]) changed[k] = this.after[k];
    }
    for (const k in this.before) if (!(k in this.after)) removed[k] = this.before[k];
    return { added, removed, changed };
  }
}
const diff = new DiffBuilder({ a: 1, b: 2, c: 3 }, { a: 10, d: 4 }).build();

// 47. API endpoint builder
class EndpointBuilder {
  private path = "/";
  private method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" = "GET";
  private middlewares: string[] = [];
  private responseType = "json";
  withPath(p: string): this { this.path = p; return this; }
  withMethod(m: typeof this.method): this { this.method = m; return this; }
  withMiddleware(m: string): this { this.middlewares.push(m); return this; }
  withResponseType(t: string): this { this.responseType = t; return this; }
  build() { return { path: this.path, method: this.method, middlewares: this.middlewares, responseType: this.responseType }; }
}
const endpoint = new EndpointBuilder().withPath("/api/users").withMethod("POST").withMiddleware("auth").withMiddleware("validate").build();

// 48. Fluent assertion builder (for tests)
class AssertBuilder<T> {
  constructor(private actual: T) {}
  toBe(expected: T): this { if (this.actual !== expected) throw new Error(`Expected ${expected}, got ${this.actual}`); return this; }
  toEqual(expected: T): this { if (JSON.stringify(this.actual) !== JSON.stringify(expected)) throw new Error("Not equal"); return this; }
  toBeTruthy(): this { if (!this.actual) throw new Error("Expected truthy"); return this; }
  toBeFalsy(): this { if (this.actual) throw new Error("Expected falsy"); return this; }
  build(): T { return this.actual; }
}
function expect2<T>(val: T) { return new AssertBuilder(val); }
expect2(1 + 1).toBe(2).toBeTruthy();

// 49. Recursive template builder
class TemplateEngine {
  private templates: Map<string, string> = new Map();
  define(name: string, template: string): this { this.templates.set(name, template); return this; }
  render(name: string, vars: Record<string, string>): string {
    const template = this.templates.get(name) ?? "";
    return template.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
  }
}
const engine = new TemplateEngine()
  .define("greeting", "Hello, {{name}}!")
  .define("farewell", "Goodbye, {{name}}! See you {{when}}.");

// 50. Complete type-safe API spec builder
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
interface ApiEndpoint { method: HttpMethod; path: string; auth: boolean; handler: string; middlewares: string[] }
class ApiSpecBuilder {
  private endpoints: ApiEndpoint[] = [];
  private authMiddleware = "authenticate";
  endpoint(method: HttpMethod, path: string, handler: string): EndpointConfigBuilder {
    return new EndpointConfigBuilder(method, path, handler, this);
  }
  _addEndpoint(ep: ApiEndpoint): this { this.endpoints.push(ep); return this; }
  build() { return { endpoints: this.endpoints, count: this.endpoints.length }; }
}
class EndpointConfigBuilder {
  private auth = false;
  private middlewares: string[] = [];
  constructor(private method: HttpMethod, private path: string, private handler: string, private parent: ApiSpecBuilder) {}
  protected(): this { this.auth = true; return this; }
  use(middleware: string): this { this.middlewares.push(middleware); return this; }
  done(): ApiSpecBuilder { return this.parent._addEndpoint({ method: this.method, path: this.path, handler: this.handler, auth: this.auth, middlewares: this.middlewares }); }
}
const api = new ApiSpecBuilder()
  .endpoint("GET", "/users", "UserController.list").done()
  .endpoint("POST", "/users", "UserController.create").protected().use("validate").done()
  .build();
