export {};

// ── Advanced Type Assertion Examples ─────────────────────────────────────────

// 1. Assertion function with infer in conditional
type IsRecord<T> = T extends Record<string, unknown> ? true : false;
function assertRecord2<T>(val: T): asserts val is T extends Record<string, unknown> ? T : never {
  if (typeof val !== "object" || val === null || Array.isArray(val)) {
    throw new TypeError("Expected plain object");
  }
}

// 2. Branded type assertion helpers
declare const _brand: unique symbol;
type Branded<T, B extends string> = T & { readonly [_brand]: B };
type Email = Branded<string, "Email">;
type Password = Branded<string, "Password">;
function assertEmail(s: string): asserts s is Email {
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(s)) throw new TypeError(`Invalid email: ${s}`);
}
function assertPassword(s: string): asserts s is Password {
  if (s.length < 8) throw new TypeError("Password too short");
}
const raw = "alice@example.com";
assertEmail(raw);
const email: Email = raw; // now branded

// 3. Type-safe deserialization with conditional types
type Deserialize<T> =
  T extends "string" ? string :
  T extends "number" ? number :
  T extends "boolean" ? boolean :
  T extends `${infer K}[]` ? Deserialize<K>[] :
  never;
function deserialize<T extends string>(schema: T, raw: unknown): Deserialize<T> {
  return raw as Deserialize<T>;
}
const val = deserialize("number", 42); // number

// 4. Phantom type assertion for units
type Meter = Branded<number, "Meter">;
type Second = Branded<number, "Second">;
const toMeter = (n: number): Meter => n as Meter;
const toSecond = (n: number): Second => n as Second;
function velocity(d: Meter, t: Second): number { return d / t; }
velocity(toMeter(100), toSecond(9.58)); // m/s

// 5. Type narrowing via symbol discriminant
const _kind = Symbol("kind");
type Circle2 = { [_kind]: "circle"; radius: number };
type Square2 = { [_kind]: "square"; side: number };
type Shape2 = Circle2 | Square2;
function makeCircle(radius: number): Circle2 { return { [_kind]: "circle", radius }; }
function isCircle(s: Shape2): s is Circle2 { return s[_kind] === "circle"; }

// 6. Conditional assertion (asserts when truthy)
function assertTruthy<T>(val: T, msg?: string): asserts val is NonNullable<T> & (T extends false ? never : T) {
  if (!val) throw new Error(msg ?? "Value is falsy");
}
const maybeUser: string | undefined = "Alice";
assertTruthy(maybeUser);
maybeUser.toUpperCase(); // narrowed

// 7. Typed `as const` assertion factory
function constOf<T>(val: T): { readonly value: T } {
  return { value: val } as const as { readonly value: T };
}
const c = constOf([1, 2, 3] as const);
type CV = typeof c.value; // readonly [1, 2, 3]

// 8. `satisfies` in generic function to preserve narrowing
function createStore<T extends Record<string, unknown>>(
  state: T satisfies Record<string, unknown>
): T {
  return { ...state };
}
// Note: satisfies can be used in expression positions in TS 4.9+

// 9. Exhaustive assertion with never type
type Result<T> = { ok: true; value: T } | { ok: false; error: string };
function handleResult<T>(r: Result<T>): T {
  if (r.ok) return r.value;
  throw new Error(r.error);
}
function assertOk<T>(r: Result<T>): asserts r is { ok: true; value: T } {
  if (!r.ok) throw new Error((r as { ok: false; error: string }).error);
}

// 10. Type-safe JSON decoder using assertion functions
type JSONSchema =
  | { type: "string" }
  | { type: "number" }
  | { type: "boolean" }
  | { type: "object"; properties: Record<string, JSONSchema> }
  | { type: "array"; items: JSONSchema };
type InferSchema<S extends JSONSchema> =
  S extends { type: "string" } ? string :
  S extends { type: "number" } ? number :
  S extends { type: "boolean" } ? boolean :
  S extends { type: "array"; items: infer I extends JSONSchema } ? InferSchema<I>[] :
  S extends { type: "object"; properties: infer P extends Record<string, JSONSchema> }
    ? { [K in keyof P]: InferSchema<P[K]> }
  : never;

// 11. Assertion with infer in conditional
type ExtractFirst<T> = T extends [infer First, ...infer _Rest] ? First : never;
function assertFirstIs<T, E>(arr: T[], _expected: E): asserts arr is [E, ...T[]] {
  if (arr[0] !== (_expected as unknown)) throw new TypeError("First element mismatch");
}

// 12. `as const` in recursive type computation
const PERMISSIONS = {
  admin: { read: true, write: true, delete: true },
  user:  { read: true, write: true, delete: false },
  guest: { read: true, write: false, delete: false },
} as const;
type Role = keyof typeof PERMISSIONS;
type RolePermissions<R extends Role> = typeof PERMISSIONS[R];
type AdminCanDelete = RolePermissions<"admin">["delete"]; // true

// 13. Double-assertion safety wrapper
function coerce<From, To>(val: From): To {
  return val as unknown as To;
}
// Only use when you know the runtime shape matches
const strAsNum: number = coerce<string, number>("42"); // runtime: "42" (not actually number)

// 14. Assert + infer combined for schema validation
type Schema2 = { [key: string]: "string" | "number" | "boolean" };
type InferSchema2<S extends Schema2> = { [K in keyof S]: S[K] extends "string" ? string : S[K] extends "number" ? number : boolean };
function validate<S extends Schema2>(schema: S, data: unknown): InferSchema2<S> {
  if (typeof data !== "object" || data === null) throw new TypeError("Not an object");
  const obj = data as Record<string, unknown>;
  for (const key of Object.keys(schema)) {
    if (typeof obj[key] !== schema[key]) throw new TypeError(`${key} should be ${schema[key]}`);
  }
  return data as InferSchema2<S>;
}
const userSchema = { name: "string", age: "number" } as const;
const validatedUser = validate(userSchema, { name: "Alice", age: 30 });

// 15. Assertion in type-safe command pattern
type Command<P, R> = { payload: P; execute: (payload: P) => R };
function assertCommand<P, R>(val: unknown): asserts val is Command<P, R> {
  if (typeof (val as Command<P, R>)?.execute !== "function") {
    throw new TypeError("Not a valid Command");
  }
}

// 16. `satisfies` with recursive inference
type RecursiveRecord<T> = { [key: string]: T | RecursiveRecord<T> };
const tree = {
  a: { b: { c: 42 }, d: 1 },
  e: 2,
} satisfies RecursiveRecord<number>;

// 17. Non-null assertion operator as type tool
type AssertNonNull<T> = T extends null | undefined ? never : T;
function toNonNull<T>(val: T): AssertNonNull<T> {
  if (val == null) throw new TypeError("Expected non-null value");
  return val as AssertNonNull<T>;
}

// 18. `as const` for type-level enum encoding
const Status = { Active: 0, Inactive: 1, Suspended: 2 } as const;
type StatusCode = typeof Status[keyof typeof Status]; // 0 | 1 | 2
type StatusName = keyof typeof Status;                // "Active" | "Inactive" | "Suspended"
function statusLabel(code: StatusCode): StatusName {
  return (Object.keys(Status) as StatusName[]).find(k => Status[k] === code)!;
}

// 19. Generic assertion composing multiple checks
type Predicate<T> = (val: unknown) => val is T;
function and<A, B>(p1: Predicate<A>, p2: Predicate<B>): Predicate<A & B> {
  return (val): val is A & B => p1(val) && p2(val);
}
const isString = (v: unknown): v is string => typeof v === "string";
const isLong = (v: unknown): v is string => typeof v === "string" && v.length > 5;
const isLongString = and(isString, isLong);

// 20. Type assertion narrowing in class hierarchy
class Vehicle { speed = 0 }
class Car extends Vehicle { doors = 4 }
class Truck extends Vehicle { payload = 5000 }
function assertCar(v: Vehicle): asserts v is Car {
  if (!(v instanceof Car)) throw new TypeError("Not a Car");
}
const vehicle: Vehicle = new Car();
assertCar(vehicle);
vehicle.doors; // narrowed to Car

// 21. `satisfies` for API contract enforcement
type ApiEndpoint = { method: "GET" | "POST" | "PUT" | "DELETE"; handler: string; auth: boolean };
const apiDef = {
  listUsers:  { method: "GET",    handler: "UserController.list",   auth: false },
  createUser: { method: "POST",   handler: "UserController.create", auth: true  },
  deleteUser: { method: "DELETE", handler: "UserController.delete", auth: true  },
} satisfies Record<string, ApiEndpoint>;
type ProtectedRoutes = {
  [K in keyof typeof apiDef as typeof apiDef[K]["auth"] extends true ? K : never]: typeof apiDef[K];
};

// 22. Template literal + assertion
type RoutePattern = `/${string}`;
function assertRoute(path: string): asserts path is RoutePattern {
  if (!path.startsWith("/")) throw new TypeError(`Route must start with /: ${path}`);
}

// 23. `as const` preserving template literal inference
function endpoint<M extends "GET" | "POST", P extends string>(method: M, path: P) {
  return { method, path } as const;
}
const listUsers = endpoint("GET", "/users");
type ListUsersMethod = typeof listUsers.method; // "GET"
type ListUsersPath   = typeof listUsers.path;   // "/users"

// 24. Assertion function with complex shape recursion
function assertDeep<T extends object>(val: unknown, shape: T): asserts val is T {
  if (typeof val !== "object" || val === null) throw new TypeError("Expected object");
  for (const key of Object.keys(shape) as (keyof T)[]) {
    const expected = typeof shape[key];
    const actual = typeof (val as Record<string, unknown>)[key as string];
    if (actual !== expected) throw new TypeError(`${String(key)}: expected ${expected}, got ${actual}`);
  }
}

// 25. Conditional type + assertion for schema-driven parsing
type ParseResult<T> = { success: true; data: T } | { success: false; errors: string[] };
function assertParseSuccess<T>(result: ParseResult<T>): asserts result is { success: true; data: T } {
  if (!result.success) {
    throw new Error(`Parse failed:\n${(result as { success: false; errors: string[] }).errors.join("\n")}`);
  }
}

// 26. Type-safe Object.entries via assertion
function typedEntries<T extends object>(obj: T): [keyof T & string, T[keyof T]][] {
  return Object.entries(obj) as [keyof T & string, T[keyof T]][];
}
const user = { id: "1", name: "Alice", age: 30 };
typedEntries(user).forEach(([key, val]) => console.log(key, val));

// 27. `as const` object literal narrowed via generic
function literal<T extends string | number | boolean>(val: T): T { return val; }
const mode = literal("dark"); // "dark" (not string)

// 28. Assertion building block composition
type AssertFn<T> = (val: unknown) => asserts val is T;
function combine<T>(...fns: AssertFn<Partial<T>>[]): AssertFn<T> {
  return (val): asserts val is T => fns.forEach(fn => fn(val));
}

// 29. `satisfies` + type narrowing for conditional access
const featureFlags2 = {
  darkMode:    true,
  betaEditor:  false,
  experiments: { newDashboard: true, aiSearch: false },
} satisfies Record<string, boolean | Record<string, boolean>>;
const betaEnabled: boolean = featureFlags2.betaEditor;
const newDash: boolean = (featureFlags2.experiments as Record<string, boolean>).newDashboard;

// 30. Typed assertion result wrapper
type AssertResult<T> = { value: T; assertedAt: Date };
function assertAndWrap<T>(val: unknown, asserter: (v: unknown) => asserts v is T): AssertResult<T> {
  asserter(val);
  return { value: val, assertedAt: new Date() };
}

// 31. `as const` for literal union discrimination
const AppActions = {
  Navigate: "NAVIGATE",
  ShowModal: "SHOW_MODAL",
  HideModal: "HIDE_MODAL",
  SetTheme:  "SET_THEME",
} as const;
type AppAction = typeof AppActions[keyof typeof AppActions];
type NavigateAction = { type: typeof AppActions.Navigate; path: string };
function isNavigate(action: { type: AppAction }): action is NavigateAction {
  return action.type === AppActions.Navigate;
}

// 32. Non-null assertion in generic map lookup
class TypedMap<K extends string | number, V> {
  private data = new Map<K, V>();
  set(key: K, val: V): this { this.data.set(key, val); return this; }
  getOrThrow(key: K): V {
    const val = this.data.get(key);
    if (val === undefined) throw new RangeError(`Key not found: ${String(key)}`);
    return val!;
  }
}

// 33. Assertion in type-safe event bus
type EventMap = Record<string, unknown>;
function createEventBus<E extends EventMap>() {
  const listeners = new Map<keyof E, Function[]>();
  return {
    on<K extends keyof E>(event: K, handler: (payload: E[K]) => void): void {
      (listeners.get(event) ?? (listeners.set(event, []).get(event)!)).push(handler);
    },
    emit<K extends keyof E>(event: K, payload: E[K]): void {
      listeners.get(event)?.forEach(h => h(payload));
    },
  };
}
type AppEvents2 = { login: { userId: string }; logout: {} };
const bus = createEventBus<AppEvents2>();
bus.emit("login", { userId: "u1" });

// 34. `satisfies` for complete enum coverage
type Status2 = "pending" | "active" | "closed";
const statusConfig = {
  pending: { color: "yellow", label: "Pending" },
  active:  { color: "green",  label: "Active"  },
  closed:  { color: "gray",   label: "Closed"  },
} satisfies Record<Status2, { color: string; label: string }>;
// If you miss a key, TypeScript will error

// 35. Double-brand with multiple unique symbols
declare const _userTag: unique symbol;
declare const _adminTag: unique symbol;
type UserToken  = string & { readonly [_userTag]: true };
type AdminToken = string & { readonly [_adminTag]: true };
function toUserToken(s: string): UserToken { return s as UserToken; }
function toAdminToken(s: string): AdminToken { return s as AdminToken; }
function adminRoute(token: AdminToken): void {}
// adminRoute(toUserToken("x")); // Type error — safe

// 36. `as const` + keyof for exhaustive key check
const endpoints2 = { users: "/users", posts: "/posts", auth: "/auth" } as const;
type Endpoint = keyof typeof endpoints2;
function isEndpoint(s: string): s is Endpoint {
  return Object.keys(endpoints2).includes(s as Endpoint);
}

// 37. Conditional assert + widen safely
function widen<T extends string>(val: T): string { return val as string; }
function narrow(val: string): "hello" | "world" { return val as "hello" | "world"; }

// 38. `satisfies` to enforce method map typing
type ControllerMethods = {
  [key: string]: (req: { params: Record<string, string> }) => unknown;
};
const userController = {
  list:   (req) => [],
  detail: (req) => ({ id: req.params.id }),
} satisfies ControllerMethods;

// 39. Assertion for config hot-reload safety
type LiveConfig = { [K in keyof AppConfig]: AppConfig[K] };
type AppConfig = { debug: boolean; maxRetries: number };
function reloadConfig(raw: unknown): asserts raw is LiveConfig {
  if (typeof (raw as AppConfig)?.debug !== "boolean") throw new TypeError("debug must be boolean");
  if (typeof (raw as AppConfig)?.maxRetries !== "number") throw new TypeError("maxRetries must be number");
}

// 40. Phantom type + assertion function for type-safe IDs
type EntityId<E extends string> = string & { __entity: E };
type UserId = EntityId<"User">;
type PostId = EntityId<"Post">;
function parseUserId(raw: string): UserId {
  if (!raw.startsWith("u-")) throw new TypeError("Not a user ID");
  return raw as UserId;
}
function parsePostId(raw: string): PostId {
  if (!raw.startsWith("p-")) throw new TypeError("Not a post ID");
  return raw as PostId;
}

// 41. `satisfies` + template literal for typed routes
type HttpRoute = `${"GET" | "POST" | "PUT" | "DELETE"} /${string}`;
const routes3 = {
  listUsers:   "GET /users",
  createUser:  "POST /users",
  updateUser:  "PUT /users/:id",
  deleteUser:  "DELETE /users/:id",
} satisfies Record<string, HttpRoute>;
type CreateUserRoute = typeof routes3.createUser; // "POST /users"

// 42. Assertion in generic class with template type
class Decoder<T> {
  constructor(private decode: (raw: unknown) => T) {}
  run(raw: unknown): T { return this.decode(raw); }
  map<U>(f: (v: T) => U): Decoder<U> { return new Decoder(raw => f(this.decode(raw))); }
  assert(asserter: (v: T) => asserts v is T): Decoder<T> {
    return new Decoder(raw => {
      const val = this.decode(raw);
      asserter(val);
      return val;
    });
  }
}
const stringDecoder = new Decoder<string>(raw => {
  if (typeof raw !== "string") throw new TypeError("Expected string");
  return raw;
});

// 43. Type-safe storage with assertion on read
class SafeStorage<Schema extends Record<string, unknown>> {
  private store: Partial<Schema> = {};
  write<K extends keyof Schema>(key: K, val: Schema[K]): void { this.store[key] = val; }
  read<K extends keyof Schema>(key: K): Schema[K] {
    const val = this.store[key];
    if (val === undefined) throw new RangeError(`${String(key)} not found`);
    return val!;
  }
}
type StorageSchema = { userId: string; count: number };
const storage = new SafeStorage<StorageSchema>();
storage.write("userId", "u1");

// 44. `as const` enabling type-level computation
const MATRIX = [[1, 0], [0, 1]] as const;
type MatrixRow = typeof MATRIX[number];     // readonly [1, 0] | readonly [0, 1]
type MatrixCell = MatrixRow[number];         // 0 | 1

// 45. Type assertion via overloaded function
function get(obj: Record<string, unknown>, key: string): unknown;
function get<T>(obj: Record<string, unknown>, key: string): T;
function get<T>(obj: Record<string, unknown>, key: string): T | unknown {
  return obj[key] as T;
}
const nameStr = get<string>({ name: "Alice" }, "name");

// 46. `satisfies` for strict plugin typing
type Plugin = { name: string; setup: () => void | Promise<void>; teardown?: () => void };
const plugins = {
  http:   { name: "http",   setup: () => console.log("http ready") },
  logger: { name: "logger", setup: async () => {}, teardown: () => console.log("logger done") },
} satisfies Record<string, Plugin>;

// 47. Assertion-based runtime type registry
const typeRegistry = new Map<string, (v: unknown) => boolean>();
typeRegistry.set("string",  v => typeof v === "string");
typeRegistry.set("number",  v => typeof v === "number");
typeRegistry.set("boolean", v => typeof v === "boolean");
function assertRegistered<T>(typeName: string, val: unknown): T {
  const check = typeRegistry.get(typeName);
  if (!check || !check(val)) throw new TypeError(`Expected ${typeName}`);
  return val as T;
}

// 48. `as const` for literal discrimination in ADT
type None2 = { readonly _tag: "None" };
type Some2<A> = { readonly _tag: "Some"; readonly value: A };
type Option2<A> = None2 | Some2<A>;
const none: None2 = { _tag: "None" } as const;
function some<A>(value: A): Some2<A> { return { _tag: "Some", value } as const; }
function isNone<A>(opt: Option2<A>): opt is None2 { return opt._tag === "None"; }

// 49. Double-assertion for intersection creation at runtime
type WithId2 = { id: string };
type WithTimestamp = { createdAt: Date };
type Entity = WithId2 & WithTimestamp;
function toEntity(obj: Record<string, unknown>): Entity {
  return { id: obj.id as string, createdAt: obj.createdAt as Date };
}

// 50. Full stack: assertion function + branded types + `satisfies`
const env = {
  NODE_ENV: process.env["NODE_ENV"] ?? "development",
  PORT:     Number(process.env["PORT"] ?? 3000),
  API_KEY:  process.env["API_KEY"] ?? "",
} satisfies { NODE_ENV: string; PORT: number; API_KEY: string };
type Env2 = typeof env;
function assertEnv(e: typeof env): asserts e is Env2 & { API_KEY: Branded<string, "ApiKey"> } {
  if (!e.API_KEY) throw new Error("API_KEY is required");
}
assertEnv(env);
const apiKey2: Branded<string, "ApiKey"> = env.API_KEY;
