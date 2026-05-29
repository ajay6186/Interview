export {};

// ============================================================
// ADVANCED EXAMPLES — Interfaces (50 Examples)
// ============================================================

// 1. Generic interface with conditional property
interface Request<M extends "GET" | "POST"> {
  method: M;
  url: string;
  body: M extends "POST" ? unknown : never;
}
const get: Request<"GET"> = { method: "GET", url: "/items", body: never as never };
const post: Request<"POST"> = { method: "POST", url: "/items", body: { name: "Widget" } };

// 2. Interface with infer in conditional method return
interface Parser {
  parse<T>(raw: string): T;
}

// 3. Mapped interface — transform all methods to async
type Asyncify<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => Promise<R>
    : T[K];
};
interface SyncService {
  getUser(id: number): { name: string };
  getCount(): number;
}
type AsyncService = Asyncify<SyncService>;

// 4. Extract only method keys from interface
type MethodKeys<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];
interface Mixed {
  name: string;
  age: number;
  greet(): string;
  compute(x: number): number;
}
type OnlyMethods = MethodKeys<Mixed>; // "greet" | "compute"

// 5. Extract only data property keys
type DataKeys<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];
type OnlyData = DataKeys<Mixed>; // "name" | "age"

// 6. Interface with recursive mapped type
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};
interface Config {
  server: { host: string; port: number };
  db: { url: string; pool: number };
}
type ReadonlyConfig = DeepReadonly<Config>;
const rc: ReadonlyConfig = {
  server: { host: "localhost", port: 3000 },
  db: { url: "postgres://...", pool: 5 },
};
// rc.server.host = "x"; // Error

// 7. Interface-based discriminated union with exhaustive switch
interface LoginAction { type: "LOGIN"; payload: { userId: number } }
interface LogoutAction { type: "LOGOUT" }
interface ResetAction { type: "RESET"; payload: { reason: string } }
type AuthAction = LoginAction | LogoutAction | ResetAction;
function handleAction(action: AuthAction): string {
  switch (action.type) {
    case "LOGIN": return `logged in ${action.payload.userId}`;
    case "LOGOUT": return "logged out";
    case "RESET": return `reset: ${action.payload.reason}`;
    default: const _: never = action; return _;
  }
}

// 8. Interface with conditional mapped props (filter by value type)
type PickByType<T, V> = {
  [K in keyof T as T[K] extends V ? K : never]: T[K];
};
interface UserRecord {
  id: number;
  name: string;
  active: boolean;
  score: number;
}
type StringFields = PickByType<UserRecord, string>; // { name: string }
type NumberFields = PickByType<UserRecord, number>; // { id: number; score: number }

// 9. Interface with template literal keys via mapped type
type EventHandlerMap<Events extends Record<string, unknown>> = {
  [K in keyof Events as `on${Capitalize<string & K>}`]: (payload: Events[K]) => void;
};
interface AppEvents {
  login: { userId: number };
  logout: void;
  error: { message: string };
}
type Handlers = EventHandlerMap<AppEvents>;
// { onLogin: (payload: { userId: number }) => void; ... }

// 10. Declaration merging — augment third-party module
declare module "some-library" {
  interface Options {
    myCustomField?: string;
  }
}

// 11. Declaration merging — extend global namespace
declare global {
  interface Window {
    __APP_STATE__?: Record<string, unknown>;
  }
}

// 12. Interface with higher-kinded type simulation
interface Functor<F> {
  map<A, B>(fa: F & { _type: A }, f: (a: A) => B): F & { _type: B };
}

// 13. Interface for a typed event bus with once/on/off
interface TypedEventBus<Events extends Record<string, unknown>> {
  on<K extends keyof Events>(event: K, cb: (data: Events[K]) => void): () => void;
  once<K extends keyof Events>(event: K, cb: (data: Events[K]) => void): void;
  off<K extends keyof Events>(event: K, cb: (data: Events[K]) => void): void;
  emit<K extends keyof Events>(event: K, data: Events[K]): void;
}

// 14. Interface with variance annotations (TypeScript 4.7+)
interface Producer<out T> {
  produce(): T;
}
interface Consumer<in T> {
  consume(value: T): void;
}

// 15. Interface extending conditional type
type HasName = { name: string };
type HasAge = { age: number };
type PersonBase<T extends boolean> = T extends true ? HasName & HasAge : HasName;
interface AdminPerson extends PersonBase<true> {
  role: "admin";
}
const admin: AdminPerson = { name: "Alice", age: 30, role: "admin" };

// 16. Recursive interface with generic depth guard
interface JsonSchema {
  type: "string" | "number" | "boolean" | "object" | "array" | "null";
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
}
const schema: JsonSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "number" },
    address: {
      type: "object",
      properties: { city: { type: "string" } },
    },
  },
  required: ["name"],
};

// 17. Interface with infer-based return type shaping
interface Transformer<In, Out> {
  transform(input: In): Out;
  inverse?: Transformer<Out, In>;
}
const strToNum: Transformer<string, number> = {
  transform: (s) => parseInt(s),
  inverse: { transform: (n) => String(n) },
};

// 18. Interface for type-safe key-value with constraint
interface StrictRecord<K extends string, V> {
  keys(): K[];
  values(): V[];
  get(key: K): V;
  set(key: K, value: V): void;
}

// 19. Interface with symbolic keys
const _serialize = Symbol("serialize");
const _validate = Symbol("validate");
interface Storable {
  [_serialize](): string;
  [_validate](): boolean;
}

// 20. Generic interface constraint on return type method
interface Converter<From, To> {
  convert(value: From): To;
  batch(values: From[]): To[];
}
const numToStr: Converter<number, string> = {
  convert: (n) => String(n),
  batch: (ns) => ns.map(String),
};

// 21. Interface for a typed immutable collection
interface ImmutableList<T> {
  readonly length: number;
  get(index: number): T;
  push(item: T): ImmutableList<T>;
  filter(pred: (item: T) => boolean): ImmutableList<T>;
  map<U>(fn: (item: T) => U): ImmutableList<U>;
}

// 22. Interface mixin via intersection
interface HasToString { toString(): string }
interface HasToJSON { toJSON(): Record<string, unknown> }
interface HasClone<T> { clone(): T }
interface FullEntity extends HasToString, HasToJSON, HasClone<FullEntity> {
  id: number;
}

// 23. Interface for type-safe command pattern with result
interface TypedCommand<Input, Output> {
  readonly name: string;
  validate(input: Input): string[];
  execute(input: Input): Promise<Output>;
}

// 24. Extend interface with mapped remap
type PrefixKeys<T, P extends string> = {
  [K in keyof T as `${P}${Capitalize<string & K>}`]: T[K];
};
interface Original {
  name: string;
  value: number;
}
type Prefixed = PrefixKeys<Original, "my">; // { myName: string; myValue: number }

// 25. Interface for curried function type
interface Curried<A, B, C> {
  (a: A): (b: B) => C;
}
const addCurried: Curried<number, number, number> = (a) => (b) => a + b;
const add5 = addCurried(5);
const result = add5(3); // 8

// 26. Interface with co- and contra-variant positions
interface ReadonlyRef<out T> {
  readonly current: T;
}
interface MutableRef<T> {
  current: T;
}

// 27. Interface for a type-level schema validator
interface SchemaValidator<T> {
  parse(input: unknown): T;
  safeParse(input: unknown): { success: true; data: T } | { success: false; error: string };
  optional(): SchemaValidator<T | undefined>;
  nullable(): SchemaValidator<T | null>;
}

// 28. Generic interface with default type parameter
interface Wrapper<T = string> {
  wrap(value: T): { wrapped: T };
  unwrap(container: { wrapped: T }): T;
}
const strWrapper: Wrapper = {
  wrap: (s) => ({ wrapped: s }),
  unwrap: (c) => c.wrapped,
};

// 29. Interface with overloaded call signatures for type narrowing
interface SmartParse {
  (value: "true" | "false"): boolean;
  (value: `${number}`): number;
  (value: string): string;
}

// 30. Interface for lazy evaluation
interface Lazy<T> {
  evaluate(): T;
  map<U>(fn: (value: T) => U): Lazy<U>;
  flatMap<U>(fn: (value: T) => Lazy<U>): Lazy<U>;
}

// 31. Interface for type-safe HTTP router
interface Route<Path extends string, Handler> {
  path: Path;
  handler: Handler;
  middleware?: Array<(ctx: object, next: () => Promise<void>) => Promise<void>>;
}

// 32. Interface hierarchy with abstract-like contracts
interface Comparable<T> {
  compareTo(other: T): -1 | 0 | 1;
}
interface Equatable<T> {
  equals(other: T): boolean;
}
interface Orderable<T> extends Comparable<T>, Equatable<T> {
  lessThan(other: T): boolean;
  greaterThan(other: T): boolean;
}

// 33. Interface for AST node types
interface BaseNode {
  kind: string;
  start: number;
  end: number;
}
interface Literal extends BaseNode {
  kind: "Literal";
  value: string | number | boolean;
}
interface Identifier extends BaseNode {
  kind: "Identifier";
  name: string;
}
interface BinaryExpr extends BaseNode {
  kind: "BinaryExpr";
  left: Literal | Identifier;
  operator: "+" | "-" | "*" | "/";
  right: Literal | Identifier;
}
type ASTNode = Literal | Identifier | BinaryExpr;

// 34. Interface with recursive Partial
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
interface AppState {
  user: { name: string; role: string };
  settings: { theme: string; locale: string };
}
const partialState: DeepPartial<AppState> = { user: { name: "Alice" } };

// 35. Interface for pipeline with type threading
interface Pipeline<In, Out> {
  pipe<NextOut>(fn: (output: Out) => NextOut): Pipeline<In, NextOut>;
  run(input: In): Out;
}

// 36. Interface with readonly mapped properties
type ReadonlyInterface<T> = {
  readonly [K in keyof T]: T[K] extends object ? ReadonlyInterface<T[K]> : T[K];
};

// 37. Interface for type-safe reducer
interface TypedReducer<State, ActionMap extends Record<string, unknown>> {
  handle<K extends keyof ActionMap>(
    type: K,
    handler: (state: State, payload: ActionMap[K]) => State
  ): TypedReducer<State, ActionMap>;
  build(): (state: State, action: { type: keyof ActionMap; payload: unknown }) => State;
}

// 38. Interface with template literal method names
type HttpMethods = "get" | "post" | "put" | "patch" | "delete";
type RestMethods<Path extends string> = {
  [M in HttpMethods as `${M}${Capitalize<Path>}`]: () => Promise<unknown>;
};

// 39. Interface extending conditional generic
type ConditionalBase<T> = T extends string
  ? { label: T; length: number }
  : { value: T; hash: string };
interface StringEntity extends ConditionalBase<string> {
  id: number;
}
const strEnt: StringEntity = { id: 1, label: "hello", length: 5 };

// 40. Interface for builder with type-state tracking
interface EmptyBuilder { setName(name: string): NamedBuilder }
interface NamedBuilder { setAge(age: number): CompleteBuilder }
interface CompleteBuilder {
  setRole(role: string): CompleteBuilder;
  build(): { name: string; age: number; role?: string };
}

// 41. Interface for type-safe ORM query
interface QueryInterface<T> {
  select<K extends keyof T>(fields: K[]): QueryInterface<Pick<T, K>>;
  where(condition: Partial<T>): QueryInterface<T>;
  orderBy<K extends keyof T>(field: K, direction: "ASC" | "DESC"): QueryInterface<T>;
  limit(n: number): QueryInterface<T>;
  execute(): Promise<T[]>;
}

// 42. Interface for decorator factory
interface ClassDecorator<T extends new (...args: any[]) => object> {
  (constructor: T): T;
}

// 43. Interface extending Array with extra methods
interface TypedArray<T> extends Array<T> {
  sum(this: TypedArray<number>): number;
  unique(): TypedArray<T>;
  groupBy<K extends PropertyKey>(fn: (item: T) => K): Record<K, TypedArray<T>>;
}

// 44. Interface for reactive value (Observable-like)
interface Observable<T> {
  subscribe(observer: {
    next: (value: T) => void;
    error?: (err: Error) => void;
    complete?: () => void;
  }): { unsubscribe(): void };
  pipe<U>(operator: (source: Observable<T>) => Observable<U>): Observable<U>;
  map<U>(fn: (value: T) => U): Observable<U>;
  filter(pred: (value: T) => boolean): Observable<T>;
}

// 45. Interface for typed environment variables
interface EnvConfig {
  NODE_ENV: "development" | "production" | "test";
  PORT: `${number}`;
  DATABASE_URL: `${"postgres" | "mysql"}://${string}`;
}

// 46. Interface for type-safe localization
interface I18n<Locale extends string, Keys extends string> {
  t(locale: Locale, key: Keys): string;
  t(locale: Locale, key: Keys, params: Record<string, string | number>): string;
}

// 47. Interface for recursive type-safe path access
interface TypedPath<T> {
  get<K extends keyof T>(key: K): TypedPath<T[K]>;
  value(): T;
}

// 48. Interface with NoInfer simulation
interface StrictRef<T> {
  get(): T;
  set(value: T): void;
}
function createRef<T>(initial: T): StrictRef<T> {
  let val = initial;
  return { get: () => val, set: (v) => { val = v; } };
}

// 49. Interface combining mapped and template literal types
type ApiClientInterface<Endpoints extends Record<string, { req: unknown; res: unknown }>> = {
  [K in keyof Endpoints as `${string & K}`]: (
    req: Endpoints[K]["req"]
  ) => Promise<Endpoints[K]["res"]>;
};

// 50. Interface for type-level dependency graph
interface DependencyContainer<Services extends Record<string, unknown>> {
  register<K extends string, T>(
    key: K,
    factory: (services: Services) => T
  ): DependencyContainer<Services & Record<K, T>>;
  resolve<K extends keyof Services>(key: K): Services[K];
}
