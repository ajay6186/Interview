export {};

// ── Advanced Class Examples ──────────────────────────────────────────────────

// 1. Phantom-type wrapper class
declare const __brand: unique symbol;
class PhantomId<Brand> {
  readonly [__brand]!: Brand;
  constructor(readonly value: string) {}
  toString() { return this.value; }
}
type UserId = PhantomId<{ readonly _: "UserId" }>;
const makeUserId = (v: string): UserId => new PhantomId(v) as UserId;
const uid: UserId = makeUserId("u-42");

// 2. Branded class with factory and validation
class Email2 {
  private constructor(readonly value: string) {}
  static create(raw: string): Email2 {
    if (!raw.includes("@")) throw new Error("invalid email");
    return new Email2(raw);
  }
  equals(other: Email2) { return this.value === other.value; }
}
const email2 = Email2.create("a@b.com");

// 3. Abstract generic transformer with inferred output
abstract class Transformer<Input, Output> {
  abstract transform(input: Input): Output;
  pipe<Next>(other: Transformer<Output, Next>): Transformer<Input, Next> {
    const self = this;
    return new class extends Transformer<Input, Next> {
      transform(input: Input): Next { return other.transform(self.transform(input)); }
    };
  }
}
class DoubleTransformer extends Transformer<number, number> {
  transform(n: number) { return n * 2; }
}
class ToStringTransformer extends Transformer<number, string> {
  transform(n: number) { return String(n); }
}
const pipeline = new DoubleTransformer().pipe(new ToStringTransformer());
const pipeResult: string = pipeline.transform(21); // "42"

// 4. Type-state builder — compile-time completeness
type Missing = { readonly _tag: "missing" };
type Present<T> = { readonly _tag: "present"; value: T };
class RequestBuilder<
  Url extends Missing | Present<string> = Missing,
  Method extends Missing | Present<string> = Missing
> {
  private _url: string = "";
  private _method: string = "";
  setUrl(url: string): RequestBuilder<Present<string>, Method> {
    const b = new RequestBuilder<Present<string>, Method>();
    b._url = url; b._method = this._method; return b;
  }
  setMethod(method: string): RequestBuilder<Url, Present<string>> {
    const b = new RequestBuilder<Url, Present<string>>();
    b._url = this._url; b._method = method; return b;
  }
  build(this: RequestBuilder<Present<string>, Present<string>>) {
    return { url: this._url, method: this._method };
  }
}
const req = new RequestBuilder().setUrl("/api").setMethod("GET").build();

// 5. Class-based Option monad
class Option<A> {
  private constructor(private readonly _value: A | null) {}
  static some<A>(value: A): Option<A> { return new Option(value); }
  static none<A>(): Option<A> { return new Option<A>(null); }
  map<B>(f: (a: A) => B): Option<B> {
    return this._value === null ? Option.none() : Option.some(f(this._value));
  }
  flatMap<B>(f: (a: A) => Option<B>): Option<B> {
    return this._value === null ? Option.none() : f(this._value);
  }
  getOrElse(def: A): A { return this._value ?? def; }
  isSome(): this is { _value: A } { return this._value !== null; }
}
const opt = Option.some(42).map(x => x * 2).getOrElse(0); // 84

// 6. Class-based Result monad
class Result<T, E extends Error = Error> {
  private constructor(
    private readonly _ok: T | null,
    private readonly _err: E | null
  ) {}
  static ok<T, E extends Error>(value: T): Result<T, E> { return new Result(value, null); }
  static err<T, E extends Error>(error: E): Result<T, E> { return new Result<T, E>(null, error); }
  map<U>(f: (v: T) => U): Result<U, E> {
    return this._ok !== null ? Result.ok(f(this._ok)) : Result.err(this._err!);
  }
  flatMap<U>(f: (v: T) => Result<U, E>): Result<U, E> {
    return this._ok !== null ? f(this._ok) : Result.err(this._err!);
  }
  unwrap(): T {
    if (this._ok === null) throw this._err;
    return this._ok;
  }
}
const res = Result.ok<number, Error>(10).map(x => x + 1).unwrap(); // 11

// 7. Typed EventEmitter with strict event map
type EventMap = Record<string, unknown[]>;
class TypedEmitter<Events extends EventMap> {
  private listeners = new Map<keyof Events, Function[]>();
  on<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void): this {
    const arr = this.listeners.get(event) ?? [];
    this.listeners.set(event, [...arr, listener]);
    return this;
  }
  off<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void): this {
    const arr = this.listeners.get(event) ?? [];
    this.listeners.set(event, arr.filter(l => l !== listener));
    return this;
  }
  emit<K extends keyof Events>(event: K, ...args: Events[K]): void {
    (this.listeners.get(event) ?? []).forEach(l => l(...args));
  }
}
type AppEvents = { login: [userId: string]; logout: []; error: [err: Error] };
const emitter = new TypedEmitter<AppEvents>();
emitter.on("login", (userId) => console.log(userId));
emitter.emit("login", "user-1");

// 8. Abstract class with conditional abstract methods
abstract class Serializable<T extends object> {
  abstract serialize(): string;
  abstract deserialize(raw: string): T;
  clone(): T { return this.deserialize(this.serialize()); }
}
class JsonRecord extends Serializable<{ name: string }> {
  constructor(private data: { name: string }) { super(); }
  serialize() { return JSON.stringify(this.data); }
  deserialize(raw: string) { return JSON.parse(raw) as { name: string }; }
}
const cloned = new JsonRecord({ name: "Alice" }).clone();

// 9. Decorator pattern using class wrapping with generics
interface Logger<T> { log(msg: T): void; }
class ConsoleLogger<T> implements Logger<T> {
  log(msg: T) { console.log(msg); }
}
class PrefixLogger<T extends string> implements Logger<T> {
  constructor(private inner: Logger<T>, private prefix: string) {}
  log(msg: T) { this.inner.log((this.prefix + msg) as T); }
}
const logger = new PrefixLogger(new ConsoleLogger<string>(), "[INFO] ");
logger.log("hello");

// 10. Class with inferred generic from constructor
class Wrapper<T> {
  constructor(readonly value: T) {}
  map<U>(f: (v: T) => U): Wrapper<U> { return new Wrapper(f(this.value)); }
  flatMap<U>(f: (v: T) => Wrapper<U>): Wrapper<U> { return f(this.value); }
}
const w = new Wrapper(42).map(x => x.toString()); // Wrapper<string>

// 11. Class hierarchy with discriminated union via `kind`
type Shape2 =
  | { kind: "circle"; radius: number }
  | { kind: "rect"; w: number; h: number };
abstract class ShapeBase2 {
  abstract get kind(): Shape2["kind"];
  abstract area(): number;
}
class Circle2 extends ShapeBase2 {
  readonly kind = "circle" as const;
  constructor(private radius: number) { super(); }
  area() { return Math.PI * this.radius ** 2; }
}
class Rect2 extends ShapeBase2 {
  readonly kind = "rect" as const;
  constructor(private w: number, private h: number) { super(); }
  area() { return this.w * this.h; }
}
function totalArea(shapes: ShapeBase2[]): number {
  return shapes.reduce((sum, s) => sum + s.area(), 0);
}

// 12. Mixin with generic constraint
type Constructor<T = {}> = new (...args: any[]) => T;
function Timestamped<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    createdAt = new Date();
    updatedAt = new Date();
    touch() { this.updatedAt = new Date(); }
  };
}
function Activatable<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    isActive = false;
    activate() { this.isActive = true; }
    deactivate() { this.isActive = false; }
  };
}
class User2 { constructor(public name: string) {} }
const FullUser = Timestamped(Activatable(User2));
const fu = new FullUser("Bob");
fu.activate(); fu.touch();

// 13. State machine class with literal string transitions
type TrafficLight = "red" | "yellow" | "green";
type Transitions = { red: "green"; green: "yellow"; yellow: "red" };
class StateMachine<States extends string, Trans extends { [S in States]: States }> {
  constructor(private state: States, private transitions: Trans) {}
  next(): void { this.state = this.transitions[this.state] as States; }
  current(): States { return this.state; }
}
const light = new StateMachine<TrafficLight, Transitions>(
  "red",
  { red: "green", green: "yellow", yellow: "red" }
);
light.next(); // green

// 14. Class-based proxy with property interception
class Reactive2<T extends object> {
  private _target: T;
  private _subscribers = new Map<keyof T, Array<(v: unknown) => void>>();
  constructor(initial: T) {
    this._target = { ...initial };
  }
  get<K extends keyof T>(key: K): T[K] { return this._target[key]; }
  set<K extends keyof T>(key: K, value: T[K]): void {
    this._target[key] = value;
    (this._subscribers.get(key) ?? []).forEach(cb => cb(value));
  }
  watch<K extends keyof T>(key: K, cb: (v: T[K]) => void): void {
    const arr = this._subscribers.get(key) ?? [];
    this._subscribers.set(key, [...arr, cb as (v: unknown) => void]);
  }
}
const state2 = new Reactive2({ count: 0 });
state2.watch("count", v => console.log("count:", v));
state2.set("count", 1);

// 15. Generic Repository with query builder
interface Entity { id: string }
class InMemoryRepo<T extends Entity> {
  private store = new Map<string, T>();
  save(item: T): void { this.store.set(item.id, item); }
  findById(id: string): T | undefined { return this.store.get(id); }
  findWhere(predicate: (item: T) => boolean): T[] {
    return [...this.store.values()].filter(predicate);
  }
  update(id: string, patch: Partial<Omit<T, "id">>): T | undefined {
    const existing = this.store.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch };
    this.store.set(id, updated);
    return updated;
  }
  delete(id: string): boolean { return this.store.delete(id); }
}
type Product = Entity & { name: string; price: number };
const products = new InMemoryRepo<Product>();
products.save({ id: "p1", name: "Widget", price: 9.99 });

// 16. Abstract class implementing template method pattern
abstract class DataExporter<T> {
  export(data: T[]): string {
    const prepared = this.prepare(data);
    const formatted = this.format(prepared);
    return this.finalize(formatted);
  }
  protected abstract prepare(data: T[]): T[];
  protected abstract format(data: T[]): string;
  protected finalize(output: string): string { return output; }
}
class CsvExporter<T extends Record<string, unknown>> extends DataExporter<T> {
  protected prepare(data: T[]): T[] { return data.filter(Boolean); }
  protected format(data: T[]): string {
    const keys = Object.keys(data[0] ?? {}) as (keyof T)[];
    const rows = data.map(row => keys.map(k => String(row[k])).join(","));
    return [keys.join(","), ...rows].join("\n");
  }
}

// 17. Fluent interface with method chaining returning `this`
class QueryBuilder3<T> {
  private conditions: string[] = [];
  private _limit?: number;
  private _offset?: number;
  where(condition: string): this { this.conditions.push(condition); return this; }
  limit(n: number): this { this._limit = n; return this; }
  offset(n: number): this { this._offset = n; return this; }
  build(): string {
    let q = `SELECT * FROM table`;
    if (this.conditions.length) q += ` WHERE ${this.conditions.join(" AND ")}`;
    if (this._limit !== undefined) q += ` LIMIT ${this._limit}`;
    if (this._offset !== undefined) q += ` OFFSET ${this._offset}`;
    return q;
  }
}
const query3 = new QueryBuilder3().where("age > 18").limit(10).offset(0).build();

// 18. Class with conditional type method return
class TypedStorage<T extends "string" | "number" | "boolean"> {
  private store: Map<string, unknown> = new Map();
  get<K extends T>(key: string, _type: K): K extends "string" ? string : K extends "number" ? number : boolean {
    return this.store.get(key) as any;
  }
  set(key: string, value: T extends "string" ? string : T extends "number" ? number : boolean): void {
    this.store.set(key, value);
  }
}

// 19. Singleton with generic type parameter
class Singleton2<T> {
  private static instances = new Map<string, unknown>();
  private constructor(readonly value: T) {}
  static getInstance<T>(key: string, factory: () => T): Singleton2<T> {
    if (!Singleton2.instances.has(key)) {
      Singleton2.instances.set(key, new Singleton2(factory()));
    }
    return Singleton2.instances.get(key) as Singleton2<T>;
  }
}
const s1 = Singleton2.getInstance("config", () => ({ debug: true }));
const s2 = Singleton2.getInstance("config", () => ({ debug: false }));
// s1 === s2 (same instance)

// 20. Class implementing visitor pattern with generics
interface Visitor2<R> {
  visitNumber(n: NumberNode): R;
  visitString(s: StringNode): R;
  visitBool(b: BoolNode): R;
}
abstract class ASTNode2 {
  abstract accept<R>(visitor: Visitor2<R>): R;
}
class NumberNode extends ASTNode2 {
  constructor(readonly value: number) { super(); }
  accept<R>(v: Visitor2<R>) { return v.visitNumber(this); }
}
class StringNode extends ASTNode2 {
  constructor(readonly value: string) { super(); }
  accept<R>(v: Visitor2<R>) { return v.visitString(this); }
}
class BoolNode extends ASTNode2 {
  constructor(readonly value: boolean) { super(); }
  accept<R>(v: Visitor2<R>) { return v.visitBool(this); }
}
class JsonSerializer implements Visitor2<string> {
  visitNumber(n: NumberNode) { return String(n.value); }
  visitString(s: StringNode) { return `"${s.value}"`; }
  visitBool(b: BoolNode) { return String(b.value); }
}
const serializer = new JsonSerializer();
const node: ASTNode2 = new NumberNode(42);
const json2 = node.accept(serializer); // "42"

// 21. Abstract class with variance simulation
abstract class Covariant<out T> {
  abstract get(): T;
}
class ConcreteCovariant<T> extends Covariant<T> {
  constructor(private val: T) { super(); }
  get(): T { return this.val; }
}
function useCovariant(c: Covariant<string | number>) {
  return c.get();
}
useCovariant(new ConcreteCovariant<string>("hello")); // OK — string extends string|number

// 22. Higher-kinded simulation using class members
interface Functor<A> { map<B>(f: (a: A) => B): Functor<B>; }
class Box2<A> implements Functor<A> {
  constructor(readonly value: A) {}
  map<B>(f: (a: A) => B): Box2<B> { return new Box2(f(this.value)); }
}
function doubleBox(b: Box2<number>): Box2<number> { return b.map(x => x * 2); }

// 23. Class-based lazy evaluation
class Lazy<T> {
  private _computed = false;
  private _value!: T;
  constructor(private factory: () => T) {}
  get value(): T {
    if (!this._computed) { this._value = this.factory(); this._computed = true; }
    return this._value;
  }
  map<U>(f: (v: T) => U): Lazy<U> { return new Lazy(() => f(this.value)); }
}
const expensiveCalc = new Lazy(() => { return 6 * 7; });
const doubled = expensiveCalc.map(x => x * 2);
const lazyResult: number = doubled.value; // 84

// 24. Abstract factory pattern with generic product hierarchy
abstract class UIFactory<Button, Input> {
  abstract createButton(label: string): Button;
  abstract createInput(placeholder: string): Input;
}
interface WebButton { render(): string }
interface WebInput { render(): string }
class WebUIFactory extends UIFactory<WebButton, WebInput> {
  createButton(label: string): WebButton { return { render: () => `<button>${label}</button>` }; }
  createInput(placeholder: string): WebInput { return { render: () => `<input placeholder="${placeholder}"/>` }; }
}

// 25. Recursive generic class: linked list
class LinkedList<T> {
  head: { value: T; next: LinkedList<T> | null } | null = null;
  prepend(value: T): LinkedList<T> {
    const list = new LinkedList<T>();
    list.head = { value, next: this.head ? this : null };
    return list;
  }
  toArray(): T[] {
    const result: T[] = [];
    let current = this.head;
    while (current) { result.push(current.value); current = current.next; }
    return result;
  }
  map<U>(f: (v: T) => U): LinkedList<U> {
    const list = new LinkedList<U>();
    this.toArray().reverse().forEach(v => list.head = { value: f(v), next: list.head ? list : null });
    return list;
  }
}
const ll = new LinkedList<number>().prepend(3).prepend(2).prepend(1);
const llArr = ll.toArray(); // [1, 2, 3]

// 26. Class implementing read-only value object pattern
class Money {
  private constructor(readonly amount: number, readonly currency: string) {}
  static of(amount: number, currency: string): Money { return new Money(amount, currency); }
  add(other: Money): Money {
    if (this.currency !== other.currency) throw new Error("Currency mismatch");
    return new Money(this.amount + other.amount, this.currency);
  }
  multiply(factor: number): Money { return new Money(this.amount * factor, this.currency); }
  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
  toString() { return `${this.currency} ${this.amount.toFixed(2)}`; }
}
const m1 = Money.of(10, "USD");
const m2 = Money.of(5, "USD");
const m3 = m1.add(m2); // USD 15.00

// 27. Class with generic accumulator (fold)
class Fold<T, R> {
  constructor(
    private initial: R,
    private reducer: (acc: R, item: T) => R
  ) {}
  run(items: T[]): R { return items.reduce(this.reducer, this.initial); }
  contramap<U>(f: (u: U) => T): Fold<U, R> {
    return new Fold(this.initial, (acc, u) => this.reducer(acc, f(u)));
  }
}
const sum2 = new Fold(0, (acc, n: number) => acc + n);
const sumResult = sum2.run([1, 2, 3, 4, 5]); // 15
const sumLengths = sum2.contramap((s: string) => s.length).run(["hi", "there"]); // 7

// 28. Class with conditional constructor overloads via factory
class Temperature {
  private readonly celsius: number;
  private constructor(celsius: number) { this.celsius = celsius; }
  static fromCelsius(c: number): Temperature { return new Temperature(c); }
  static fromFahrenheit(f: number): Temperature { return new Temperature((f - 32) * 5 / 9); }
  static fromKelvin(k: number): Temperature { return new Temperature(k - 273.15); }
  toCelsius(): number { return this.celsius; }
  toFahrenheit(): number { return this.celsius * 9 / 5 + 32; }
  toKelvin(): number { return this.celsius + 273.15; }
}
const boiling = Temperature.fromCelsius(100);
const freezing = Temperature.fromFahrenheit(32);

// 29. Class-based pipeline with type-chaining
class Pipeline3<T> {
  private steps: Array<(v: unknown) => unknown> = [];
  private constructor(steps: Array<(v: unknown) => unknown> = []) {
    this.steps = steps;
  }
  static of<T>(): Pipeline3<T> { return new Pipeline3<T>(); }
  pipe<U>(fn: (v: T) => U): Pipeline3<U> {
    return new Pipeline3<U>([...this.steps, fn as (v: unknown) => unknown]);
  }
  run(input: T): unknown {
    return this.steps.reduce((acc, fn) => fn(acc), input as unknown);
  }
}
const pl = Pipeline3.of<string>()
  .pipe(s => s.trim())
  .pipe(s => s.toUpperCase())
  .pipe(s => s.split(""));
const plResult = pl.run("  hello  ");

// 30. Observer pattern with typed subjects
interface Observer2<T> { update(value: T): void; }
class Subject2<T> {
  private observers: Set<Observer2<T>> = new Set();
  private _value: T;
  constructor(initial: T) { this._value = initial; }
  subscribe(observer: Observer2<T>): () => void {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }
  get value(): T { return this._value; }
  set value(v: T) {
    this._value = v;
    this.observers.forEach(o => o.update(v));
  }
}
const counter2 = new Subject2(0);
const unsub = counter2.subscribe({ update: v => console.log("counter:", v) });
counter2.value = 1;
unsub();

// 31. Class with symbol-keyed private state
const _secret = Symbol("secret");
class SecretHolder {
  private [_secret]: string;
  constructor(secret: string) { this[_secret] = secret; }
  verify(input: string): boolean { return this[_secret] === input; }
}
const holder = new SecretHolder("s3cr3t");
holder.verify("s3cr3t"); // true

// 32. Decorator class wrapper preserving generic type
class Memoized<Args extends unknown[], R> {
  private cache = new Map<string, R>();
  constructor(private fn: (...args: Args) => R) {}
  call(...args: Args): R {
    const key = JSON.stringify(args);
    if (!this.cache.has(key)) this.cache.set(key, this.fn(...args));
    return this.cache.get(key)!;
  }
  invalidate(): void { this.cache.clear(); }
}
const fib = new Memoized((n: number): number => n <= 1 ? n : fib.call(n - 1) + fib.call(n - 2));
fib.call(10); // 55

// 33. Class implementing Comparable interface
interface Comparable<T> { compareTo(other: T): -1 | 0 | 1; }
class Version implements Comparable<Version> {
  constructor(readonly major: number, readonly minor: number, readonly patch: number) {}
  compareTo(other: Version): -1 | 0 | 1 {
    for (const key of ["major", "minor", "patch"] as const) {
      if (this[key] < other[key]) return -1;
      if (this[key] > other[key]) return 1;
    }
    return 0;
  }
  toString() { return `${this.major}.${this.minor}.${this.patch}`; }
}
const v1 = new Version(1, 2, 3);
const v2 = new Version(1, 3, 0);
v1.compareTo(v2); // -1

// 34. Class-based Command pattern with undo stack
interface Command2<T> { execute(): T; undo(): void; }
class CommandHistory<T> {
  private history: Command2<T>[] = [];
  execute(cmd: Command2<T>): T {
    const result = cmd.execute();
    this.history.push(cmd);
    return result;
  }
  undo(): void { this.history.pop()?.undo(); }
  undoAll(): void { while (this.history.length) this.undo(); }
}
class IncrementCommand implements Command2<number> {
  private prevValue = 0;
  constructor(private store: { count: number }) {}
  execute(): number { this.prevValue = this.store.count; this.store.count++; return this.store.count; }
  undo(): void { this.store.count = this.prevValue; }
}
const store2 = { count: 0 };
const history = new CommandHistory<number>();
history.execute(new IncrementCommand(store2));
history.execute(new IncrementCommand(store2));
history.undo(); // store2.count === 1

// 35. Class with structural typing enforcement
interface HasId { id: string }
interface HasTimestamp { createdAt: Date }
class AuditableRepo<T extends HasId & HasTimestamp> {
  private records = new Map<string, T>();
  add(record: T): void { this.records.set(record.id, record); }
  getRecent(since: Date): T[] {
    return [...this.records.values()].filter(r => r.createdAt >= since);
  }
}
type AuditLog = HasId & HasTimestamp & { action: string };
const auditRepo = new AuditableRepo<AuditLog>();

// 36. Class implementing Strategy with typed strategies
type SortStrategy<T> = (a: T, b: T) => number;
class SortedCollection<T> {
  private items: T[] = [];
  constructor(private strategy: SortStrategy<T>) {}
  add(item: T): void { this.items.push(item); this.items.sort(this.strategy); }
  changeStrategy(strategy: SortStrategy<T>): void {
    this.strategy = strategy;
    this.items.sort(this.strategy);
  }
  toArray(): T[] { return [...this.items]; }
}
const nums = new SortedCollection<number>((a, b) => a - b);
nums.add(3); nums.add(1); nums.add(2);
nums.toArray(); // [1, 2, 3]

// 37. Generic class with multiple type constraints
class Transformer2<T extends object, K extends keyof T> {
  constructor(private obj: T, private key: K) {}
  transform<U>(f: (v: T[K]) => U): Transformer2<Omit<T, K> & Record<K, U>, K> {
    const transformed = { ...this.obj, [this.key]: f(this.obj[this.key]) } as any;
    return new Transformer2(transformed, this.key);
  }
  get(): T { return this.obj; }
}
const t2 = new Transformer2({ name: "Alice", age: 30 }, "age")
  .transform(age => age.toString())
  .get();

// 38. Abstract class with covariant return types
abstract class AnimalFactory<T> {
  abstract create(name: string): T;
  createMany(names: string[]): T[] { return names.map(n => this.create(n)); }
}
class Dog { constructor(readonly name: string) {} bark() { return `${this.name} barks`; } }
class DogFactory extends AnimalFactory<Dog> {
  create(name: string): Dog { return new Dog(name); }
}
const dogs = new DogFactory().createMany(["Rex", "Buddy"]);

// 39. Class with indexed access type tracking
type Config = { db: { host: string; port: number }; cache: { ttl: number } };
class TypedConfig<C extends object> {
  constructor(private config: C) {}
  get<K extends keyof C>(key: K): C[K] { return this.config[key]; }
  getPath<K extends keyof C, K2 extends keyof C[K]>(key: K, key2: K2): C[K][K2] {
    return (this.config[key] as any)[key2];
  }
}
const cfg = new TypedConfig<Config>({ db: { host: "localhost", port: 5432 }, cache: { ttl: 60 } });
const dbHost: string = cfg.getPath("db", "host");

// 40. Class implementing Chain of Responsibility
abstract class Handler2<T, R> {
  private next: Handler2<T, R> | null = null;
  setNext(handler: Handler2<T, R>): Handler2<T, R> { this.next = handler; return handler; }
  handle(request: T): R | null {
    return this.canHandle(request) ? this.process(request) : (this.next?.handle(request) ?? null);
  }
  protected abstract canHandle(request: T): boolean;
  protected abstract process(request: T): R;
}
class SmallAmountHandler extends Handler2<number, string> {
  protected canHandle(n: number) { return n < 10; }
  protected process(n: number) { return `small: ${n}`; }
}
class LargeAmountHandler extends Handler2<number, string> {
  protected canHandle(n: number) { return n >= 10; }
  protected process(n: number) { return `large: ${n}`; }
}
const chain2 = new SmallAmountHandler();
chain2.setNext(new LargeAmountHandler());
chain2.handle(5);  // "small: 5"
chain2.handle(15); // "large: 15"

// 41. Proxy class for access control
class SecureProxy<T extends object> {
  private target: T;
  constructor(target: T, private allowedKeys: Set<keyof T>) {
    this.target = target;
  }
  get<K extends keyof T>(key: K): T[K] {
    if (!this.allowedKeys.has(key)) throw new Error(`Access denied: ${String(key)}`);
    return this.target[key];
  }
  set<K extends keyof T>(key: K, value: T[K]): void {
    if (!this.allowedKeys.has(key)) throw new Error(`Access denied: ${String(key)}`);
    this.target[key] = value;
  }
}
const record = { name: "Alice", ssn: "123-45-6789" };
const proxy2 = new SecureProxy(record, new Set<keyof typeof record>(["name"]));
proxy2.get("name"); // "Alice"

// 42. Class with compile-time exhaustiveness checking
type Direction = "north" | "south" | "east" | "west";
class DirectionHandler {
  handle(dir: Direction): string {
    switch (dir) {
      case "north": return "Going north";
      case "south": return "Going south";
      case "east":  return "Going east";
      case "west":  return "Going west";
      default:
        const _exhaustive: never = dir;
        return _exhaustive;
    }
  }
}

// 43. Class implementing Iterator protocol
class Range implements Iterable<number> {
  constructor(private start: number, private end: number, private step = 1) {}
  [Symbol.iterator](): Iterator<number> {
    let current = this.start;
    const end = this.end;
    const step = this.step;
    return {
      next(): IteratorResult<number> {
        if (current < end) {
          const value = current;
          current += step;
          return { done: false, value };
        }
        return { done: true, value: undefined as never };
      }
    };
  }
  toArray(): number[] { return [...this]; }
}
const range = new Range(0, 10, 2).toArray(); // [0, 2, 4, 6, 8]

// 44. Class with async lifecycle hooks
abstract class Service {
  private _started = false;
  protected abstract onStart(): Promise<void>;
  protected abstract onStop(): Promise<void>;
  async start(): Promise<void> {
    if (this._started) return;
    await this.onStart();
    this._started = true;
  }
  async stop(): Promise<void> {
    if (!this._started) return;
    await this.onStop();
    this._started = false;
  }
  get isRunning(): boolean { return this._started; }
}
class DatabaseService extends Service {
  protected async onStart() { console.log("db connected"); }
  protected async onStop() { console.log("db disconnected"); }
}

// 45. Class with mapped type method generation
type Methods<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
} & {
  [K in keyof T as `set${Capitalize<string & K>}`]: (v: T[K]) => void;
};
function makeAccessors<T extends object>(obj: T): Methods<T> {
  const result: any = {};
  for (const key of Object.keys(obj) as (keyof T)[]) {
    const cap = String(key).charAt(0).toUpperCase() + String(key).slice(1);
    result[`get${cap}`] = () => obj[key];
    result[`set${cap}`] = (v: T[typeof key]) => { obj[key] = v; };
  }
  return result;
}
const personAccessors = makeAccessors({ name: "Alice", age: 30 });

// 46. Class with conditional generic narrowing
class TypedMap<K extends string, V> {
  private map = new Map<K, V>();
  set(key: K, value: V): this { this.map.set(key, value); return this; }
  get(key: K): V | undefined { return this.map.get(key); }
  getOrThrow(key: K): V {
    const v = this.map.get(key);
    if (v === undefined) throw new Error(`Key not found: ${key}`);
    return v;
  }
  keys(): K[] { return [...this.map.keys()]; }
  values(): V[] { return [...this.map.values()]; }
}
const tm = new TypedMap<"a" | "b" | "c", number>()
  .set("a", 1)
  .set("b", 2);

// 47. Class with recursive type deep freeze
type DeepReadonly2<T> = T extends (infer U)[]
  ? ReadonlyArray<DeepReadonly2<U>>
  : T extends object
  ? { readonly [K in keyof T]: DeepReadonly2<T[K]> }
  : T;
class Immutable<T extends object> {
  private readonly _data: DeepReadonly2<T>;
  constructor(data: T) { this._data = Object.freeze(data) as DeepReadonly2<T>; }
  get data(): DeepReadonly2<T> { return this._data; }
  with(patch: Partial<T>): Immutable<T> {
    return new Immutable({ ...this._data as T, ...patch });
  }
}
const imm = new Immutable({ x: 1, y: 2 });
const imm2 = imm.with({ x: 10 });

// 48. Class-level dependency injection via constructor overload
interface HttpClient { get(url: string): Promise<string> }
interface Cache2 { get(key: string): string | undefined; set(key: string, val: string): void }
class ApiService {
  constructor(
    private http: HttpClient,
    private cache: Cache2
  ) {}
  async fetch(url: string): Promise<string> {
    const cached = this.cache.get(url);
    if (cached) return cached;
    const result = await this.http.get(url);
    this.cache.set(url, result);
    return result;
  }
}

// 49. Class with template method + hook methods
class DataProcessor<T, R> {
  process(items: T[]): R[] {
    const filtered = this.filter(items);
    const validated = this.validate(filtered);
    return validated.map(item => this.transform(item));
  }
  protected filter(items: T[]): T[] { return items; }
  protected validate(items: T[]): T[] { return items; }
  protected transform(item: T): R { return item as unknown as R; }
}
class PositiveNumberProcessor extends DataProcessor<number, string> {
  protected filter(items: number[]): number[] { return items.filter(n => n > 0); }
  protected validate(items: number[]): number[] { return items.filter(n => isFinite(n)); }
  protected transform(item: number): string { return item.toFixed(2); }
}
const processed = new PositiveNumberProcessor().process([-1, 0, 3.14, Infinity, 42]);

// 50. Class with type-safe event sourcing
type EventBase = { type: string; payload: unknown };
type Reducer<State, Event extends EventBase> = (state: State, event: Event) => State;
class EventStore<State, Event extends EventBase> {
  private events: Event[] = [];
  constructor(private initialState: State, private reducer: Reducer<State, Event>) {}
  dispatch(event: Event): void { this.events.push(event); }
  getState(): State { return this.events.reduce(this.reducer, this.initialState); }
  getHistory(): readonly Event[] { return this.events; }
  replay(events: Event[]): State { return events.reduce(this.reducer, this.initialState); }
}
type CounterEvent =
  | { type: "increment"; payload: number }
  | { type: "decrement"; payload: number }
  | { type: "reset";     payload: null };
const counterStore = new EventStore<number, CounterEvent>(
  0,
  (state, event) => {
    switch (event.type) {
      case "increment": return state + event.payload;
      case "decrement": return state - event.payload;
      case "reset":     return 0;
    }
  }
);
counterStore.dispatch({ type: "increment", payload: 5 });
counterStore.dispatch({ type: "decrement", payload: 2 });
counterStore.getState(); // 3
