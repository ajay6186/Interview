export {};

// ============================================================
// BASIC EXAMPLES — Classes (50 Examples)
// ============================================================

// 1. Basic class with constructor
class Animal {
  name: string;
  constructor(name: string) { this.name = name; }
  speak(): string { return `${this.name} makes a sound.`; }
}
const a = new Animal("Cat");

// 2. Shorthand constructor (parameter properties)
class Dog {
  constructor(public name: string, public breed: string) {}
  bark(): string { return `${this.name} barks!`; }
}
const d = new Dog("Rex", "Husky");

// 3. Private fields
class BankAccount {
  private balance: number = 0;
  deposit(amount: number): void { this.balance += amount; }
  withdraw(amount: number): boolean {
    if (amount > this.balance) return false;
    this.balance -= amount;
    return true;
  }
  getBalance(): number { return this.balance; }
}

// 4. Private fields with ECMAScript # syntax
class SecureBag {
  #items: string[] = [];
  add(item: string): void { this.#items.push(item); }
  list(): readonly string[] { return [...this.#items]; }
}

// 5. Protected fields
class Person {
  protected name: string;
  constructor(name: string) { this.name = name; }
  greet(): string { return `Hello, I'm ${this.name}`; }
}
class Employee extends Person {
  constructor(name: string, public role: string) { super(name); }
  introduce(): string { return `${this.name} works as ${this.role}`; }
}

// 6. Readonly fields
class Config {
  readonly maxRetries: number;
  readonly timeout: number;
  constructor(maxRetries: number, timeout: number) {
    this.maxRetries = maxRetries;
    this.timeout = timeout;
  }
}
const config = new Config(3, 5000);
// config.maxRetries = 5; // Error

// 7. Static property
class Counter {
  static count = 0;
  id: number;
  constructor() { this.id = ++Counter.count; }
  static reset(): void { Counter.count = 0; }
}
const c1 = new Counter(); // id = 1
const c2 = new Counter(); // id = 2

// 8. Static method
class MathUtils {
  static add(a: number, b: number): number { return a + b; }
  static multiply(a: number, b: number): number { return a * b; }
  static PI = 3.14159265;
}
const sum2 = MathUtils.add(3, 4);

// 9. Getter and setter
class Temperature {
  private _celsius: number = 0;
  get fahrenheit(): number { return this._celsius * 9 / 5 + 32; }
  set fahrenheit(f: number) { this._celsius = (f - 32) * 5 / 9; }
  get celsius(): number { return this._celsius; }
  set celsius(c: number) { this._celsius = c; }
}
const temp = new Temperature();
temp.celsius = 100;
console.log(temp.fahrenheit); // 212

// 10. Class implementing interface
interface Printable {
  print(): void;
}
class Receipt implements Printable {
  constructor(private amount: number) {}
  print(): void { console.log(`Receipt: $${this.amount.toFixed(2)}`); }
}

// 11. Class implementing multiple interfaces
interface Readable2 { read(): string }
interface Closable { close(): void }
class FileHandle implements Readable2, Closable {
  private content: string;
  private open = true;
  constructor(content: string) { this.content = content; }
  read(): string {
    if (!this.open) throw new Error("closed");
    return this.content;
  }
  close(): void { this.open = false; }
}

// 12. Class inheritance
class Shape2 {
  constructor(public color: string) {}
  area(): number { return 0; }
  toString(): string { return `${this.color} shape with area ${this.area()}`; }
}
class Circle extends Shape2 {
  constructor(color: string, public radius: number) { super(color); }
  area(): number { return Math.PI * this.radius ** 2; }
}
class Rect extends Shape2 {
  constructor(color: string, public width: number, public height: number) { super(color); }
  area(): number { return this.width * this.height; }
}

// 13. Abstract class
abstract class AbstractShape {
  abstract area(): number;
  abstract perimeter(): number;
  describe(): string {
    return `Area: ${this.area().toFixed(2)}, Perimeter: ${this.perimeter().toFixed(2)}`;
  }
}
class Square extends AbstractShape {
  constructor(public side: number) { super(); }
  area(): number { return this.side ** 2; }
  perimeter(): number { return this.side * 4; }
}

// 14. super() call with arguments
class Vehicle {
  constructor(public make: string, public model: string, public year: number) {}
  info(): string { return `${this.year} ${this.make} ${this.model}`; }
}
class ElectricCar extends Vehicle {
  constructor(make: string, model: string, year: number, public range: number) {
    super(make, model, year);
  }
  info(): string { return `${super.info()} (EV, ${this.range}km range)`; }
}

// 15. Method overriding
class Logger {
  log(message: string): void { console.log(`[LOG] ${message}`); }
}
class TimestampLogger extends Logger {
  log(message: string): void {
    super.log(`[${new Date().toISOString()}] ${message}`);
  }
}

// 16. Class with optional constructor parameter
class User {
  name: string;
  role: string;
  constructor(name: string, role = "user") {
    this.name = name;
    this.role = role;
  }
}
const admin = new User("Alice", "admin");
const guest = new User("Bob");

// 17. Class with rest constructor parameter
class TagList {
  tags: string[];
  constructor(public name: string, ...tags: string[]) {
    this.tags = tags;
  }
}
const tagList = new TagList("blog", "ts", "web", "js");

// 18. Class with computed property
class EventEmitter2 {
  private handlers: Record<string, Function[]> = {};
  on(event: string, fn: Function): void {
    (this.handlers[event] ??= []).push(fn);
  }
  emit(event: string, ...args: unknown[]): void {
    this.handlers[event]?.forEach((fn) => fn(...args));
  }
}

// 19. Fluent interface (method chaining)
class StringBuilder {
  private parts: string[] = [];
  append(text: string): this { this.parts.push(text); return this; }
  appendLine(text: string): this { this.parts.push(text + "\n"); return this; }
  build(): string { return this.parts.join(""); }
  clear(): this { this.parts = []; return this; }
}
const str = new StringBuilder().append("Hello").append(", ").append("World!").build();

// 20. Class that stores state
class StatefulCounter {
  private history: number[] = [];
  private _count = 0;
  increment(by = 1): void { this._count += by; this.history.push(this._count); }
  undo(): void {
    this.history.pop();
    this._count = this.history[this.history.length - 1] ?? 0;
  }
  get count(): number { return this._count; }
}

// 21. Class with static factory method
class Color {
  private constructor(public r: number, public g: number, public b: number) {}
  static fromHex(hex: string): Color {
    const n = parseInt(hex.replace("#", ""), 16);
    return new Color((n >> 16) & 255, (n >> 8) & 255, n & 255);
  }
  static fromRGB(r: number, g: number, b: number): Color { return new Color(r, g, b); }
  toHex(): string {
    return `#${[this.r, this.g, this.b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  }
}
const red = Color.fromHex("#ff0000");

// 22. Class with toString and valueOf
class Money {
  constructor(public amount: number, public currency: string) {}
  toString(): string { return `${this.amount} ${this.currency}`; }
  valueOf(): number { return this.amount; }
  add(other: Money): Money {
    if (other.currency !== this.currency) throw new Error("Currency mismatch");
    return new Money(this.amount + other.amount, this.currency);
  }
}

// 23. Singleton pattern
class Singleton {
  private static instance: Singleton | null = null;
  private constructor(public id: number) {}
  static getInstance(): Singleton {
    return (Singleton.instance ??= new Singleton(1));
  }
}

// 24. Class with lazy initialization
class LazyService {
  private _connection: object | null = null;
  get connection(): object {
    return (this._connection ??= { connected: true });
  }
}

// 25. Class with index signature
class Registry2 {
  private store: Record<string, unknown> = {};
  set(key: string, value: unknown): void { this.store[key] = value; }
  get(key: string): unknown { return this.store[key]; }
  has(key: string): boolean { return key in this.store; }
}

// 26. Type guard method in class
class Transport {
  constructor(public type: "http" | "grpc" | "websocket") {}
  isHttp(): this is { type: "http" } { return this.type === "http"; }
}

// 27. Class with generator method
class InfiniteSequence {
  *[Symbol.iterator](): Generator<number> {
    let n = 0;
    while (true) yield n++;
  }
}

// 28. Class implementing Iterable
class Range2 implements Iterable<number> {
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
          return { value, done: false };
        }
        return { value: undefined as never, done: true };
      },
    };
  }
}
const range = [...new Range2(1, 6)]; // [1, 2, 3, 4, 5]

// 29. Class with Symbol.toPrimitive
class Vector {
  constructor(public x: number, public y: number) {}
  [Symbol.toPrimitive](hint: string): number | string {
    if (hint === "number") return Math.hypot(this.x, this.y);
    return `(${this.x}, ${this.y})`;
  }
}

// 30. Declaration merging with class
class Point {
  constructor(public x: number, public y: number) {}
}
interface Point {
  distance(other: Point): number;
}
Point.prototype.distance = function(other: Point) {
  return Math.hypot(this.x - other.x, this.y - other.y);
};

// 31. Class with Symbol.hasInstance
class EvenNumber {
  static [Symbol.hasInstance](val: unknown): boolean {
    return typeof val === "number" && val % 2 === 0;
  }
}
console.log(4 instanceof EvenNumber); // true

// 32. Class with private static
class IdGenerator {
  private static nextId = 1;
  static generate(): number { return IdGenerator.nextId++; }
  static reset(): void { IdGenerator.nextId = 1; }
}

// 33. Class extending Error
class AppError extends Error {
  constructor(message: string, public readonly code: number) {
    super(message);
    this.name = "AppError";
  }
}
class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
    this.name = "NotFoundError";
  }
}

// 34. Mixin function
type Constructor<T = {}> = new (...args: any[]) => T;
function Timestamped<Base extends Constructor>(base: Base) {
  return class extends base {
    createdAt = new Date();
    updatedAt = new Date();
    touch() { this.updatedAt = new Date(); }
  };
}
class Post {
  constructor(public title: string) {}
}
class TimestampedPost extends Timestamped(Post) {}
const tp = new TimestampedPost("Hello World");

// 35. Abstract class with template method pattern
abstract class Game {
  abstract initialize(): void;
  abstract startPlay(): void;
  abstract endPlay(): void;
  play(): void {
    this.initialize();
    this.startPlay();
    this.endPlay();
  }
}
class Chess extends Game {
  initialize(): void { console.log("Chess: Setup board"); }
  startPlay(): void { console.log("Chess: Playing"); }
  endPlay(): void { console.log("Chess: Checkmate"); }
}

// 36. Class with proxy for validation
class ValidatedModel {
  name!: string;
  age!: number;
  static create(data: { name: string; age: number }): ValidatedModel {
    if (!data.name) throw new Error("name required");
    if (data.age < 0) throw new RangeError("age must be non-negative");
    return Object.assign(new ValidatedModel(), data);
  }
}

// 37. Mixin for serialization
function Serializable2<Base extends Constructor>(base: Base) {
  return class extends base {
    toJSON(): string { return JSON.stringify(this); }
    static fromJSON<T>(this: new (...args: any[]) => T, json: string): T {
      return Object.assign(new (this as any)(), JSON.parse(json));
    }
  };
}

// 38. Class with WeakRef for memory-safe caching
class WeakCache<K extends object, V> {
  private store = new Map<K, WeakRef<V>>();
  set(key: K, val: V): void { this.store.set(key, new WeakRef(val)); }
  get(key: K): V | undefined { return this.store.get(key)?.deref(); }
}

// 39. Class clone pattern
class Config2 {
  constructor(
    public host: string,
    public port: number,
    public ssl: boolean
  ) {}
  clone(overrides: Partial<Config2> = {}): Config2 {
    return new Config2(
      overrides.host ?? this.host,
      overrides.port ?? this.port,
      overrides.ssl ?? this.ssl
    );
  }
}

// 40. Class with builder inner class
class Request {
  private constructor(
    public url: string,
    public method: string,
    public headers: Record<string, string>,
    public body?: string
  ) {}
  static builder(url: string): Request.Builder {
    return new Request.Builder(url);
  }
}
namespace Request {
  export class Builder {
    private _method = "GET";
    private _headers: Record<string, string> = {};
    private _body?: string;
    constructor(private url: string) {}
    method(m: string): this { this._method = m; return this; }
    header(k: string, v: string): this { this._headers[k] = v; return this; }
    body(b: string): this { this._body = b; return this; }
    build(): Request { return new (Request as any)(this.url, this._method, this._headers, this._body); }
  }
}

// 41. Decorator-like class wrapper
function logged<T extends Constructor>(Base: T) {
  return class extends Base {
    constructor(...args: any[]) {
      super(...args);
      console.log(`[${Base.name}] instantiated`);
    }
  };
}
class Service2 { constructor(public name: string) {} }
const LoggedService = logged(Service2);

// 42. Class with private constructor and static factory
class Token {
  private constructor(
    private readonly _value: string,
    private readonly _expiresAt: number
  ) {}
  static create(value: string, ttlMs: number): Token {
    return new Token(value, Date.now() + ttlMs);
  }
  get value(): string { return this._value; }
  get isExpired(): boolean { return Date.now() > this._expiresAt; }
}

// 43. Class hierarchy with overridden toString
class Node2 {
  constructor(public data: unknown) {}
  toString(): string { return `Node(${JSON.stringify(this.data)})`; }
}
class TextNode extends Node2 {
  constructor(public text: string) { super(text); }
  toString(): string { return `TextNode("${this.text}")`; }
}

// 44. Class extending Map
class TypedMap2<K, V> extends Map<K, V> {
  getOrDefault(key: K, defaultVal: V): V {
    return this.has(key) ? this.get(key)! : defaultVal;
  }
  invert(): Map<V, K> {
    return new Map([...this.entries()].map(([k, v]) => [v, k]));
  }
}

// 45. Class extending Array
class NumberList extends Array<number> {
  sum(): number { return this.reduce((a, b) => a + b, 0); }
  average(): number { return this.length ? this.sum() / this.length : 0; }
  max(): number { return Math.max(...this); }
  min(): number { return Math.min(...this); }
}

// 46. Class with protected static factory
class BaseEntity {
  protected static create<T extends BaseEntity>(this: new (id: number) => T, id: number): T {
    return new this(id);
  }
  constructor(public readonly id: number) {}
}
class UserEntity extends BaseEntity {
  constructor(id: number, public name: string = "Unknown") { super(id); }
}

// 47. Class with index signature
class FlexObject {
  [key: string]: unknown;
  constructor(data: Record<string, unknown>) {
    Object.assign(this, data);
  }
}

// 48. Abstract factory via static method
abstract class Button {
  abstract render(): string;
  static create(theme: "light" | "dark"): Button {
    return theme === "light" ? new LightButton() : new DarkButton();
  }
}
class LightButton extends Button { render() { return "<button class='light'>"; } }
class DarkButton extends Button { render() { return "<button class='dark'>"; } }

// 49. Class using composition over inheritance
class Logger2 {
  log(msg: string): void { console.log(`[LOG] ${msg}`); }
}
class Validator2 {
  validate(val: string): boolean { return val.length > 0; }
}
class UserService {
  private logger = new Logger2();
  private validator = new Validator2();
  create(name: string): void {
    if (!this.validator.validate(name)) {
      this.logger.log(`Invalid name: ${name}`);
      return;
    }
    this.logger.log(`Created user: ${name}`);
  }
}

// 50. Class with override keyword (TypeScript 4.3+)
class Base2 {
  method(): string { return "base"; }
}
class Derived2 extends Base2 {
  override method(): string { return "derived"; }
}
