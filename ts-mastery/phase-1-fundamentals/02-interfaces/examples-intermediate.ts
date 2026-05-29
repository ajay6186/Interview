export {};

// ============================================================
// INTERMEDIATE EXAMPLES — Interfaces (50 Examples)
// ============================================================

// 1. Generic interface
interface Box<T> {
  value: T;
  isEmpty(): boolean;
}
const strBox: Box<string> = { value: "hello", isEmpty: () => false };

// 2. Generic interface with constraint
interface Lengthwise<T extends { length: number }> {
  item: T;
  getLength(): number;
}
const strLen: Lengthwise<string> = {
  item: "hello",
  getLength() { return this.item.length; },
};

// 3. Generic interface with multiple type params
interface KeyValue<K, V> {
  key: K;
  value: V;
}
const kv: KeyValue<string, number> = { key: "score", value: 100 };

// 4. Generic interface for a repository pattern
interface Repository<T> {
  findById(id: number): T | undefined;
  save(item: T): void;
  delete(id: number): void;
}

// 5. Interface with index signature + explicit property
interface FlexibleConfig {
  name: string;
  [key: string]: string | number; // must be compatible with name: string
}
const flexConf: FlexibleConfig = { name: "app", version: 1, env: "prod" };

// 6. Readonly index signature
interface ImmutableMap {
  readonly [key: string]: string;
}
const iMap: ImmutableMap = { a: "1", b: "2" };

// 7. Number index signature
interface NumberIndexed {
  [index: number]: string;
  length: number;
}

// 8. Interface for callable object (call signature)
interface Formatter {
  (value: number, decimals: number): string;
  defaultDecimals: number;
}
const fmt = ((v: number, d: number) => v.toFixed(d)) as Formatter;
fmt.defaultDecimals = 2;

// 9. Interface with both call and construct signatures
interface ClockConstructor {
  new(hour: number, minute: number): ClockInterface;
}
interface ClockInterface {
  tick(): void;
}

// 10. Interface implementing part of another
interface Readable {
  read(): string;
}
interface Writable {
  write(data: string): void;
}
interface ReadWritable extends Readable, Writable {
  seek(position: number): void;
}

// 11. Interface for fluent builder API
interface QueryBuilder {
  select(fields: string[]): QueryBuilder;
  where(condition: string): QueryBuilder;
  limit(n: number): QueryBuilder;
  build(): string;
}

// 12. Declaration merging — extending existing interface
interface Window {
  myCustomProp?: string;
}
// Augments the global Window — no object literal needed

// 13. Declaration merging — adding method to existing interface
interface Array<T> {
  first(): T | undefined;
}
Array.prototype.first = function () { return this[0]; };

// 14. Hybrid type — interface that is both function and object
interface Counter {
  (start: number): string;
  interval: number;
  reset(): void;
}

// 15. Interface with overloaded method signature
interface Stringifier {
  stringify(value: string): string;
  stringify(value: number): string;
  stringify(value: boolean): string;
}

// 16. Interface extending a class
class ControlBase {
  private state: boolean = false;
  getState() { return this.state; }
}
interface SelectControl extends ControlBase {
  options: string[];
}

// 17. Interface used as constraint in generic function
function identity<T extends { id: number }>(item: T): T {
  return item;
}
const result = identity({ id: 1, name: "Alice" });

// 18. Interface for event emitter pattern
interface EventEmitter<Events extends Record<string, unknown>> {
  on<K extends keyof Events>(event: K, listener: (data: Events[K]) => void): void;
  emit<K extends keyof Events>(event: K, data: Events[K]): void;
}

// 19. Interface with discriminant property
interface Circle {
  kind: "circle";
  radius: number;
}
interface Square {
  kind: "square";
  side: number;
}
type Shape = Circle | Square;
function area(s: Shape): number {
  if (s.kind === "circle") return Math.PI * s.radius ** 2;
  return s.side ** 2;
}

// 20. Interface with conditional property via union
interface ApiRequest<T = undefined> {
  method: "GET" | "POST" | "PUT" | "DELETE";
  url: string;
  body: T extends undefined ? never : T;
}

// 21. Extending interface and narrowing optional to required
interface OptBase {
  name?: string;
  age?: number;
}
interface StrictExtended extends Required<OptBase> {
  role: string;
}
const strictUser: StrictExtended = { name: "Alice", age: 30, role: "admin" };

// 22. Interface with Readonly utility
interface MutablePoint {
  x: number;
  y: number;
}
type ImmutablePoint = Readonly<MutablePoint>;
const frozen: ImmutablePoint = { x: 0, y: 0 };
// frozen.x = 1; // Error

// 23. Partial interface usage
interface CreateUserInput {
  name: string;
  email: string;
  role: string;
}
function patchUser(patch: Partial<CreateUserInput>): void {
  console.log(patch);
}
patchUser({ name: "Bob" });

// 24. Pick from interface
type UserPreview = Pick<CreateUserInput, "name" | "email">;
const preview: UserPreview = { name: "Eve", email: "eve@example.com" };

// 25. Omit from interface
type UserWithoutRole = Omit<CreateUserInput, "role">;
const noRole: UserWithoutRole = { name: "Dan", email: "dan@example.com" };

// 26. Interface for middleware pattern
interface MiddlewareFn<Ctx> {
  (ctx: Ctx, next: () => Promise<void>): Promise<void>;
}

// 27. Mapped type derived from interface
type Optional<T> = { [K in keyof T]?: T[K] };
interface Config2 { host: string; port: number }
type OptionalConfig = Optional<Config2>;

// 28. Interface for state management
interface Reducer<S, A> {
  (state: S, action: A): S;
}

// 29. Interface for command pattern
interface Command {
  execute(): void;
  undo(): void;
}
class IncrementCommand implements Command {
  constructor(private store: { count: number }) {}
  execute() { this.store.count++; }
  undo() { this.store.count--; }
}

// 30. Interface for factory function
interface ShapeFactory {
  createCircle(radius: number): { kind: "circle"; radius: number };
  createSquare(side: number): { kind: "square"; side: number };
}

// 31. Interface with Promise method return
interface AsyncRepository<T> {
  findAll(): Promise<T[]>;
  findOne(id: number): Promise<T | null>;
  create(data: Omit<T, "id">): Promise<T>;
}

// 32. Self-referential interface (recursive)
interface TreeNode {
  value: number;
  children: TreeNode[];
}
const treeNode: TreeNode = {
  value: 1,
  children: [{ value: 2, children: [] }],
};

// 33. Interface for linked list node
interface ListNode<T> {
  value: T;
  next: ListNode<T> | null;
}
const head: ListNode<number> = { value: 1, next: { value: 2, next: null } };

// 34. Interface with method returning itself (fluent)
interface FluentLogger {
  log(msg: string): FluentLogger;
  warn(msg: string): FluentLogger;
  error(msg: string): FluentLogger;
}

// 35. Interface for plugin system
interface Plugin {
  name: string;
  version: string;
  install(app: { use(plugin: Plugin): void }): void;
}

// 36. Interface with generic method (not generic interface)
interface Mapper {
  map<T, U>(arr: T[], fn: (item: T) => U): U[];
}
const mapper: Mapper = { map: (arr, fn) => arr.map(fn) };

// 37. Interface for JSON serializable objects
interface Serializable {
  toJSON(): Record<string, unknown>;
  fromJSON(data: Record<string, unknown>): this;
}

// 38. Interface for cache
interface Cache<T> {
  get(key: string): T | undefined;
  set(key: string, value: T, ttl?: number): void;
  invalidate(key: string): void;
  clear(): void;
}

// 39. Interface with multiple index signatures (number vs string)
interface MixedIndex {
  [n: number]: string;
  [s: string]: string | number; // superset of number-indexed
}

// 40. Interface for pipe/compose
interface Pipe<In, Out> {
  run(input: In): Out;
  then<NextOut>(next: Pipe<Out, NextOut>): Pipe<In, NextOut>;
}

// 41. Interface for form field definition
interface FieldDef<T> {
  name: string;
  defaultValue: T;
  validate(value: T): string | null;
}
const ageField: FieldDef<number> = {
  name: "age",
  defaultValue: 0,
  validate: (v) => (v >= 0 ? null : "Must be non-negative"),
};

// 42. Interface for Proxy handler
interface ProxyHandler<T extends object> {
  get?(target: T, prop: string | symbol): unknown;
  set?(target: T, prop: string | symbol, value: unknown): boolean;
}

// 43. Interface as mixin
interface Timestamped {
  createdAt: Date;
  updatedAt: Date;
}
interface Identified {
  id: string;
}
interface BaseEntity extends Timestamped, Identified {}

// 44. Interface with conditional discriminated types
interface HttpGetRequest {
  method: "GET";
  headers?: Record<string, string>;
}
interface HttpPostRequest {
  method: "POST";
  body: unknown;
  headers?: Record<string, string>;
}
type HttpRequest = HttpGetRequest | HttpPostRequest;

// 45. Interface with error handling method
interface Fallible<T> {
  try(): T;
  catch(handler: (err: Error) => T): T;
}

// 46. Interface for rate limiting
interface RateLimiter {
  check(key: string): boolean;
  increment(key: string): void;
  reset(key: string): void;
  getCount(key: string): number;
}

// 47. Generic interface with default type parameter
interface Response<T = unknown> {
  status: number;
  data: T;
  headers: Record<string, string>;
}
const jsonResp: Response<{ users: string[] }> = {
  status: 200,
  data: { users: ["Alice"] },
  headers: { "content-type": "application/json" },
};

// 48. Interface for pagination
interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 49. Interface combining index signature and generic
interface TypedStorage<T> {
  [key: string]: T;
  length: number;
}

// 50. Interface for dependency injection container
interface Container {
  bind<T>(token: symbol): { to(implementation: new (...args: any[]) => T): void };
  get<T>(token: symbol): T;
}
