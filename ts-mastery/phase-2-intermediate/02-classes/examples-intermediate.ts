export {};

// ============================================================
// INTERMEDIATE EXAMPLES — Classes (50 Examples)
// ============================================================

// 1. Generic class — typed repository
class Repository<T extends { id: number }> {
  protected items = new Map<number, T>();
  save(item: T): T { this.items.set(item.id, item); return item; }
  findById(id: number): T | undefined { return this.items.get(id); }
  findAll(): T[] { return [...this.items.values()]; }
  delete(id: number): boolean { return this.items.delete(id); }
  count(): number { return this.items.size; }
}

// 2. Generic class — typed stack with transform
class TypedStack<T> {
  private items: T[] = [];
  push(...vals: T[]): this { this.items.push(...vals); return this; }
  pop(): T | undefined { return this.items.pop(); }
  peek(): T | undefined { return this.items[this.items.length - 1]; }
  map<U>(fn: (item: T) => U): TypedStack<U> {
    return this.items.reduce((s, item) => s.push(fn(item)) && s, new TypedStack<U>());
  }
  get size(): number { return this.items.length; }
  isEmpty(): boolean { return this.items.length === 0; }
}

// 3. Class with generic constraint on method
class Sorter {
  sort<T>(arr: T[], compare: (a: T, b: T) => number): T[] {
    return [...arr].sort(compare);
  }
  sortBy<T, K extends keyof T>(arr: T[], key: K): T[] {
    return this.sort(arr, (a, b) => {
      const av = a[key], bv = b[key];
      return av < bv ? -1 : av > bv ? 1 : 0;
    });
  }
}

// 4. Generic abstract class
abstract class Transformer<In, Out> {
  abstract transform(input: In): Out;
  transformAll(inputs: In[]): Out[] { return inputs.map((i) => this.transform(i)); }
}
class NumberToString extends Transformer<number, string> {
  transform(n: number): string { return n.toFixed(2); }
}

// 5. Generic class — typed cache with LRU eviction
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  constructor(private maxSize: number) {}
  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    const val = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }
  set(key: K, val: V): void {
    if (this.cache.has(key)) this.cache.delete(key);
    else if (this.cache.size >= this.maxSize) this.cache.delete(this.cache.keys().next().value);
    this.cache.set(key, val);
  }
}

// 6. Mixin with generics
type Constructor<T = {}> = new (...args: any[]) => T;
function Comparable<T extends Constructor<{ value: number }>>(Base: T) {
  return class extends Base {
    lessThan(other: InstanceType<T> & { value: number }): boolean {
      return this.value < other.value;
    }
    greaterThan(other: InstanceType<T> & { value: number }): boolean {
      return this.value > other.value;
    }
    equals(other: InstanceType<T> & { value: number }): boolean {
      return this.value === other.value;
    }
  };
}

// 7. Class implementing generic interface
interface Collection<T> {
  add(item: T): void;
  remove(item: T): boolean;
  contains(item: T): boolean;
  toArray(): T[];
  get size(): number;
}
class UniqueList<T> implements Collection<T> {
  private items = new Set<T>();
  add(item: T): void { this.items.add(item); }
  remove(item: T): boolean { return this.items.delete(item); }
  contains(item: T): boolean { return this.items.has(item); }
  toArray(): T[] { return [...this.items]; }
  get size(): number { return this.items.size; }
}

// 8. Class with decorators (manual implementation)
function readonly3(target: any, key: string, descriptor: PropertyDescriptor): PropertyDescriptor {
  descriptor.writable = false;
  return descriptor;
}
function enumerable(value: boolean) {
  return (target: any, key: string, descriptor: PropertyDescriptor): PropertyDescriptor => {
    descriptor.enumerable = value;
    return descriptor;
  };
}

// 9. Class extending built-in with proper this typing
class SmartArray<T> extends Array<T> {
  static override get [Symbol.species]() { return Array; }
  first(): T | undefined { return this[0]; }
  last(): T | undefined { return this[this.length - 1]; }
  unique(): T[] { return [...new Set(this)]; }
  groupBy(fn: (item: T) => string): Record<string, T[]> {
    return this.reduce<Record<string, T[]>>((acc, item) => {
      const key = fn(item);
      (acc[key] ??= []).push(item);
      return acc;
    }, {});
  }
}

// 10. Class with private backing store and computed properties
class Duration {
  private readonly _ms: number;
  constructor(ms: number) { this._ms = Math.max(0, ms); }
  static fromSeconds(s: number): Duration { return new Duration(s * 1000); }
  static fromMinutes(m: number): Duration { return new Duration(m * 60 * 1000); }
  get milliseconds(): number { return this._ms; }
  get seconds(): number { return this._ms / 1000; }
  get minutes(): number { return this._ms / 60000; }
  add(other: Duration): Duration { return new Duration(this._ms + other._ms); }
  toString(): string { return `${this.seconds.toFixed(3)}s`; }
}

// 11. Observer pattern with generics
interface Observer2<T> { update(data: T): void }
class Subject2<T> {
  private observers: Observer2<T>[] = [];
  subscribe(obs: Observer2<T>): () => void {
    this.observers.push(obs);
    return () => { this.observers = this.observers.filter((o) => o !== obs); };
  }
  notify(data: T): void { this.observers.forEach((o) => o.update(data)); }
}

// 12. Command pattern with generic command type
interface Command2<Result = void> { execute(): Result; undo(): void }
class CommandHistory {
  private history: Command2<any>[] = [];
  execute<R>(cmd: Command2<R>): R {
    const result = cmd.execute();
    this.history.push(cmd);
    return result;
  }
  undo(): void { this.history.pop()?.undo(); }
  clear(): void { this.history = []; }
}

// 13. Iterator pattern
interface TypedIterator2<T> {
  hasNext(): boolean;
  next(): T;
}
class ArrayIterator<T> implements TypedIterator2<T> {
  private index = 0;
  constructor(private items: T[]) {}
  hasNext(): boolean { return this.index < this.items.length; }
  next(): T { return this.items[this.index++]; }
  reset(): void { this.index = 0; }
}

// 14. Strategy pattern
interface SortStrategy2<T> { sort(arr: T[]): T[] }
class Sorter2<T> {
  private strategy: SortStrategy2<T>;
  constructor(strategy: SortStrategy2<T>) { this.strategy = strategy; }
  setStrategy(strategy: SortStrategy2<T>): void { this.strategy = strategy; }
  sort(arr: T[]): T[] { return this.strategy.sort(arr); }
}

// 15. Prototype pattern via clone
interface Clonable<T> { clone(): T }
class Config3 implements Clonable<Config3> {
  constructor(
    public host: string,
    public port: number,
    public ssl: boolean,
    public timeout: number
  ) {}
  clone(): Config3 { return new Config3(this.host, this.port, this.ssl, this.timeout); }
  with(overrides: Partial<Config3>): Config3 {
    return Object.assign(this.clone(), overrides);
  }
}

// 16. Decorator pattern
abstract class Component { abstract render(): string }
class TextComponent extends Component { render() { return "text"; } }
abstract class Decorator extends Component {
  constructor(protected component: Component) { super(); }
}
class BoldDecorator extends Decorator {
  render() { return `<b>${this.component.render()}</b>`; }
}
class ItalicDecorator extends Decorator {
  render() { return `<i>${this.component.render()}</i>`; }
}
const boldItalic = new ItalicDecorator(new BoldDecorator(new TextComponent()));

// 17. Composite pattern
abstract class FileSystemItem {
  abstract getSize(): number;
  abstract getName(): string;
}
class File2 extends FileSystemItem {
  constructor(private name: string, private size: number) { super(); }
  getSize() { return this.size; }
  getName() { return this.name; }
}
class Folder extends FileSystemItem {
  private children: FileSystemItem[] = [];
  constructor(private name: string) { super(); }
  add(item: FileSystemItem): this { this.children.push(item); return this; }
  getSize(): number { return this.children.reduce((sum, c) => sum + c.getSize(), 0); }
  getName(): string { return this.name; }
}

// 18. Proxy pattern
class ExpensiveService {
  compute(n: number): number { return n * n; }
}
class CachedService {
  private cache = new Map<number, number>();
  private service = new ExpensiveService();
  compute(n: number): number {
    return this.cache.get(n) ?? (() => {
      const r = this.service.compute(n);
      this.cache.set(n, r);
      return r;
    })();
  }
}

// 19. State pattern
interface State2 { handle(context: Context2): void; name: string }
class Context2 {
  private state: State2;
  constructor(initialState: State2) { this.state = initialState; }
  setState(state: State2): void { this.state = state; }
  request(): void { this.state.handle(this); }
  get stateName(): string { return this.state.name; }
}

// 20. Class with discriminated union property
class Response2<T = unknown> {
  private constructor(
    private readonly _result: { ok: true; data: T } | { ok: false; error: Error }
  ) {}
  static ok2<T>(data: T): Response2<T> { return new Response2({ ok: true, data }); }
  static error2<T>(err: Error): Response2<T> { return new Response2<T>({ ok: false, error: err }); }
  isOk(): this is Response2<T> & { _result: { ok: true; data: T } } { return this._result.ok; }
  getData(): T | null { return this._result.ok ? this._result.data : null; }
}

// 21. Class with abstract generic method
abstract class Serializer<T> {
  abstract serialize(val: T): string;
  abstract deserialize(raw: string): T;
  round(val: T): T { return this.deserialize(this.serialize(val)); }
}
class JsonSerializer<T> extends Serializer<T> {
  serialize(val: T): string { return JSON.stringify(val); }
  deserialize(raw: string): T { return JSON.parse(raw) as T; }
}

// 22. Generic class extending generic class
class BaseCollection<T> {
  protected items: T[] = [];
  add(item: T): this { this.items.push(item); return this; }
  get length(): number { return this.items.length; }
  toArray(): T[] { return [...this.items]; }
}
class FilterableCollection<T> extends BaseCollection<T> {
  filter(pred: (item: T) => boolean): T[] { return this.items.filter(pred); }
  find2(pred: (item: T) => boolean): T | undefined { return this.items.find(pred); }
}

// 23. Class implementing Iterable<T>
class InfiniteRange implements Iterable<number> {
  constructor(private start = 0, private step = 1) {}
  [Symbol.iterator](): Iterator<number> {
    let current = this.start;
    const step = this.step;
    return {
      next(): IteratorResult<number> {
        const value = current;
        current += step;
        return { value, done: false };
      },
    };
  }
  take(n: number): number[] {
    const result: number[] = [];
    for (const val of this) {
      result.push(val);
      if (result.length >= n) break;
    }
    return result;
  }
}

// 24. Class with Symbol.asyncIterator
class AsyncStream<T> {
  constructor(private items: T[], private delayMs = 0) {}
  [Symbol.asyncIterator](): AsyncIterator<T> {
    let index = 0;
    const items = this.items;
    const delay = this.delayMs;
    return {
      async next(): Promise<IteratorResult<T>> {
        if (index < items.length) {
          if (delay > 0) await new Promise((r) => setTimeout(r, delay));
          return { value: items[index++], done: false };
        }
        return { value: undefined as never, done: true };
      },
    };
  }
}

// 25. Class with type-safe event system
type EventMap2 = { click: { x: number; y: number }; submit: { data: string } };
class TypedComponent<Events extends Record<string, unknown>> {
  private listeners: { [K in keyof Events]?: Set<(data: Events[K]) => void> } = {};
  on<K extends keyof Events>(event: K, fn: (data: Events[K]) => void): () => void {
    (this.listeners[event] ??= new Set()).add(fn as any);
    return () => this.listeners[event]?.delete(fn as any);
  }
  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    (this.listeners[event] as Set<(d: Events[K]) => void> | undefined)?.forEach((fn) => fn(data));
  }
}
class Button2 extends TypedComponent<EventMap2> {}

// 26. Fluent builder with required state tracking
class FluentRequest {
  private _url?: string;
  private _method: "GET" | "POST" = "GET";
  private _headers: Record<string, string> = {};
  url(url: string): this { this._url = url; return this; }
  method(m: "GET" | "POST"): this { this._method = m; return this; }
  header(k: string, v: string): this { this._headers[k] = v; return this; }
  build(): { url: string; method: string; headers: Record<string, string> } {
    if (!this._url) throw new Error("URL required");
    return { url: this._url, method: this._method, headers: this._headers };
  }
}

// 27. Class that wraps a promise (lazy)
class LazyPromise<T> {
  private _promise?: Promise<T>;
  constructor(private factory: () => Promise<T>) {}
  get(): Promise<T> { return (this._promise ??= this.factory()); }
  reset(): void { this._promise = undefined; }
}

// 28. Class with property descriptors
class ValidatedModel {
  private _name: string = "";
  get name(): string { return this._name; }
  set name(val: string) {
    if (!val || val.length < 2) throw new Error("Name too short");
    this._name = val.trim();
  }
  private _age: number = 0;
  get age(): number { return this._age; }
  set age(val: number) {
    if (val < 0 || val > 150) throw new RangeError("Invalid age");
    this._age = Math.floor(val);
  }
}

// 29. Generic class — typed observable value
class Atom<T> {
  private _value: T;
  private listeners = new Set<(val: T, prev: T) => void>();
  constructor(initial: T) { this._value = initial; }
  get value(): T { return this._value; }
  set(val: T): void {
    const prev = this._value;
    this._value = val;
    this.listeners.forEach((fn) => fn(val, prev));
  }
  subscribe(fn: (val: T, prev: T) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  derive<U>(fn: (val: T) => U): Atom<U> {
    const derived = new Atom(fn(this._value));
    this.subscribe((v) => derived.set(fn(v)));
    return derived;
  }
}

// 30. Class with typed method overloads via conditional return type
class Parser {
  parse(input: string, asNumber: true): number;
  parse(input: string, asNumber: false): string;
  parse(input: string, asNumber?: boolean): string | number;
  parse(input: string, asNumber = false): string | number {
    return asNumber ? parseFloat(input) : input;
  }
}

// 31. Class with "this" return type for fluent chaining in subclasses
class BaseBuilder {
  protected data: Record<string, unknown> = {};
  set(key: string, val: unknown): this { this.data[key] = val; return this; }
  build(): Record<string, unknown> { return { ...this.data }; }
}
class ExtendedBuilder extends BaseBuilder {
  setName(name: string): this { return this.set("name", name); }
  setAge(age: number): this { return this.set("age", age); }
}
const ext = new ExtendedBuilder().setName("Alice").setAge(30).build();

// 32. Generic factory class
class Factory<T> {
  private creators = new Map<string, () => T>();
  register(type: string, creator: () => T): this { this.creators.set(type, creator); return this; }
  create(type: string): T {
    const creator = this.creators.get(type);
    if (!creator) throw new Error(`Unknown type: ${type}`);
    return creator();
  }
}

// 33. Class with generic static methods
class ArrayUtils {
  static unique<T>(arr: T[]): T[] { return [...new Set(arr)]; }
  static groupBy2<T, K extends string>(arr: T[], fn: (item: T) => K): Record<K, T[]> {
    return arr.reduce<Record<K, T[]>>((acc, item) => {
      const key = fn(item);
      (acc[key] ??= []).push(item);
      return acc;
    }, {} as Record<K, T[]>);
  }
  static zip2<A, B>(a: A[], b: B[]): [A, B][] {
    return a.map((item, i) => [item, b[i]] as [A, B]);
  }
}

// 34. Class with discriminated union return in method
class ResultHandler<T> {
  constructor(private readonly value: T | Error) {}
  map<U>(fn: (v: T) => U): ResultHandler<U> {
    if (this.value instanceof Error) return new ResultHandler<U>(this.value);
    return new ResultHandler(fn(this.value as T));
  }
  getOrElse(fallback: T): T {
    return this.value instanceof Error ? fallback : this.value as T;
  }
  isError(): boolean { return this.value instanceof Error; }
}

// 35. Generic mixin for observable properties
function Observable3<Base extends Constructor<{}>>(target: Base) {
  return class extends target {
    private __listeners: Record<string, Function[]> = {};
    observe(prop: string, fn: (val: unknown) => void): () => void {
      (this.__listeners[prop] ??= []).push(fn);
      return () => { this.__listeners[prop] = this.__listeners[prop].filter((f) => f !== fn); };
    }
    notify2(prop: string, val: unknown): void {
      this.__listeners[prop]?.forEach((fn) => fn(val));
    }
  };
}

// 36. Class encapsulating complex state transitions
class Workflow {
  private state: "draft" | "review" | "approved" | "rejected" = "draft";
  private log: string[] = [];
  submit(): void {
    if (this.state !== "draft") throw new Error("Can only submit drafts");
    this.state = "review";
    this.log.push(`submitted at ${new Date().toISOString()}`);
  }
  approve(): void {
    if (this.state !== "review") throw new Error("Can only approve reviews");
    this.state = "approved";
    this.log.push(`approved at ${new Date().toISOString()}`);
  }
  reject(reason: string): void {
    if (this.state !== "review") throw new Error("Can only reject reviews");
    this.state = "rejected";
    this.log.push(`rejected: ${reason}`);
  }
  get currentState() { return this.state; }
  get history() { return [...this.log]; }
}

// 37. Generic class — typed event queue
class TypedQueue2<T> {
  private queue: T[] = [];
  private waiters: Array<(item: T) => void> = [];
  enqueue(item: T): void {
    const waiter = this.waiters.shift();
    if (waiter) waiter(item);
    else this.queue.push(item);
  }
  dequeue(): Promise<T> {
    return new Promise((resolve) => {
      const item = this.queue.shift();
      if (item !== undefined) resolve(item);
      else this.waiters.push(resolve);
    });
  }
}

// 38. Class that simulates algebraic data types
class Maybe2<T> {
  private constructor(private readonly _val: T | undefined) {}
  static just<T>(val: T): Maybe2<T> { return new Maybe2(val); }
  static nothing<T>(): Maybe2<T> { return new Maybe2<T>(undefined); }
  isJust(): boolean { return this._val !== undefined; }
  map<U>(fn: (v: T) => U): Maybe2<U> {
    return this._val !== undefined ? Maybe2.just(fn(this._val)) : Maybe2.nothing<U>();
  }
  flatMap<U>(fn: (v: T) => Maybe2<U>): Maybe2<U> {
    return this._val !== undefined ? fn(this._val) : Maybe2.nothing<U>();
  }
  getOrElse(fallback: T): T { return this._val !== undefined ? this._val : fallback; }
}

// 39. Abstract class with typed hook methods
abstract class BaseController<Req, Res> {
  async handle(req: Req): Promise<Res> {
    const validated = await this.validate(req);
    const processed = await this.process(validated);
    return this.format(processed);
  }
  protected abstract validate(req: Req): Promise<Req>;
  protected abstract process(req: Req): Promise<unknown>;
  protected abstract format(result: unknown): Res;
}

// 40. Generic event-driven state machine
class StateMachine2<State extends string, Event2 extends string> {
  private transitions: Map<`${State}:${Event2}`, State> = new Map();
  private currentState: State;
  private handlers: Map<State, (() => void)[]> = new Map();
  constructor(initial: State) { this.currentState = initial; }
  addTransition(from: State, event: Event2, to: State): this {
    this.transitions.set(`${from}:${event}`, to);
    return this;
  }
  onEnter(state: State, fn: () => void): this {
    (this.handlers.get(state) ?? (this.handlers.set(state, []) && this.handlers.get(state))!).push(fn);
    return this;
  }
  send(event: Event2): boolean {
    const next = this.transitions.get(`${this.currentState}:${event}`);
    if (!next) return false;
    this.currentState = next;
    this.handlers.get(next)?.forEach((fn) => fn());
    return true;
  }
  get state(): State { return this.currentState; }
}

// 41. Generic class with method return type inference
class QueryBuilder3<T extends Record<string, unknown>> {
  private query: Partial<T> = {};
  where<K extends keyof T>(key: K, val: T[K]): QueryBuilder3<T> {
    this.query[key] = val;
    return this;
  }
  build(): Partial<T> { return { ...this.query }; }
  execute(data: T[]): T[] {
    return data.filter((item) =>
      (Object.keys(this.query) as (keyof T)[]).every((k) => item[k] === this.query[k])
    );
  }
}

// 42. Mixin — serializable class
function withSerialization<Base extends Constructor<{}>>(B: Base) {
  return class extends B {
    serialize(): string { return JSON.stringify(this); }
    static deserialize<T extends typeof this>(this: T, json: string): InstanceType<T> {
      return Object.assign(new (this as any)(), JSON.parse(json));
    }
  };
}

// 43. Generic class — typed immutable record
class ImmutableRecord<T extends object> {
  private readonly _data: Readonly<T>;
  constructor(data: T) { this._data = Object.freeze({ ...data }); }
  get<K extends keyof T>(key: K): T[K] { return this._data[key]; }
  set<K extends keyof T>(key: K, val: T[K]): ImmutableRecord<T> {
    return new ImmutableRecord({ ...this._data, [key]: val });
  }
  toObject(): Readonly<T> { return this._data; }
}

// 44. Abstract class with template method + hook
abstract class DataProcessor<Input, Output> {
  process(input: Input): Output {
    const cleaned = this.clean(input);
    const transformed = this.transform(cleaned);
    return this.postProcess(transformed);
  }
  protected abstract clean(input: Input): Input;
  protected abstract transform(input: Input): Output;
  protected postProcess(output: Output): Output { return output; }
}

// 45. Class combining multiple design patterns
class EventDrivenStore<State> {
  private _state: State;
  private eventLog: string[] = [];
  private subscribers = new Set<(s: State) => void>();
  constructor(initial: State) { this._state = initial; }
  get state(): State { return this._state; }
  update(updater: (prev: State) => State, event?: string): void {
    this._state = updater(this._state);
    if (event) this.eventLog.push(`${event} at ${new Date().toISOString()}`);
    this.subscribers.forEach((fn) => fn(this._state));
  }
  subscribe(fn: (s: State) => void): () => void {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }
}

// 46. Generic class with conditional method visibility
class TypedMap3<K extends string | number | symbol, V> extends Map<K, V> {
  getOrDefault(key: K, def: V): V { return this.get(key) ?? def; }
  mapValues<U>(fn: (val: V, key: K) => U): TypedMap3<K, U> {
    const result = new TypedMap3<K, U>();
    this.forEach((v, k) => result.set(k, fn(v, k)));
    return result;
  }
}

// 47. Generic class — typed mediator
interface Participant { receive(msg: unknown, from: string): void }
class Mediator {
  private participants = new Map<string, Participant>();
  register(name: string, p: Participant): void { this.participants.set(name, p); }
  send(from: string, to: string, msg: unknown): void {
    this.participants.get(to)?.receive(msg, from);
  }
  broadcast(from: string, msg: unknown): void {
    this.participants.forEach((p, name) => {
      if (name !== from) p.receive(msg, from);
    });
  }
}

// 48. Generic class — typed circular buffer
class CircularBuffer<T> {
  private buffer: (T | undefined)[];
  private head = 0;
  private tail = 0;
  private _size = 0;
  constructor(private capacity: number) {
    this.buffer = new Array(capacity);
  }
  push(item: T): T | undefined {
    const overwritten = this.isFull() ? this.buffer[this.head] : undefined;
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    if (this.isFull()) this.head = (this.head + 1) % this.capacity;
    else this._size++;
    return overwritten;
  }
  pop(): T | undefined {
    if (this.isEmpty()) return undefined;
    const item = this.buffer[this.head];
    this.head = (this.head + 1) % this.capacity;
    this._size--;
    return item;
  }
  isFull(): boolean { return this._size === this.capacity; }
  isEmpty(): boolean { return this._size === 0; }
  get size(): number { return this._size; }
}

// 49. Generic abstract transformer chain
abstract class Step<In, Out> {
  abstract process(input: In): Out;
  then<Next>(next: Step<Out, Next>): Step<In, Next> {
    const self = this;
    return new class extends Step<In, Next> {
      process(input: In): Next { return next.process(self.process(input)); }
    };
  }
}

// 50. Class with full CRUD interface
interface Entity { id: number }
class InMemoryStore<T extends Entity> {
  private store = new Map<number, T>();
  private nextId = 1;
  create(data: Omit<T, "id">): T {
    const item = { ...data, id: this.nextId++ } as T;
    this.store.set(item.id, item);
    return item;
  }
  read(id: number): T | undefined { return this.store.get(id); }
  update(id: number, changes: Partial<Omit<T, "id">>): T | undefined {
    const item = this.store.get(id);
    if (!item) return undefined;
    const updated = { ...item, ...changes };
    this.store.set(id, updated);
    return updated;
  }
  delete(id: number): boolean { return this.store.delete(id); }
  list(): T[] { return [...this.store.values()]; }
}
