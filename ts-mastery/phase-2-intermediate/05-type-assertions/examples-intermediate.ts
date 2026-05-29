export {};

// ── Intermediate Type Assertion Examples ─────────────────────────────────────

// 1. Assertion function with complex type guard
function assertIsArray<T>(val: unknown): asserts val is T[] {
  if (!Array.isArray(val)) throw new TypeError("Expected array");
}
const maybeArr: unknown = [1, 2, 3];
assertIsArray<number>(maybeArr);
const doubled = maybeArr.map(n => n * 2); // narrowed to number[]

// 2. Typed assertion function with message
function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function processId(id: string | null) {
  assert(id !== null, "id must not be null");
  const upper = id.toUpperCase(); // narrowed to string
}

// 3. Generic assertion function
function assertDefined<T>(val: T | null | undefined, label = "value"): asserts val is T {
  if (val == null) throw new ReferenceError(`${label} is null/undefined`);
}
let name: string | null = "Alice";
assertDefined(name, "name");
name.toUpperCase(); // narrowed

// 4. `as const` with generic constraint
function createConfig<T extends Record<string, unknown>>(cfg: T) {
  return cfg as Readonly<T>;
}
const appCfg = createConfig({ debug: true, port: 3000 });
// appCfg.debug = false; // Error

// 5. `satisfies` with generic inference preservation
function createMenu<T extends Record<string, { path: string }>>(menu: T) {
  return menu;
}
const nav = createMenu({
  home:    { path: "/" },
  about:   { path: "/about" },
  contact: { path: "/contact" },
} satisfies Record<string, { path: string }>);
nav.home.path; // "/"

// 6. `as const` with object factory
function makeEvent<T extends string>(type: T, payload: unknown) {
  return { type, payload } as const;
}
const loginEvent = makeEvent("login", { userId: "u1" });
type LoginEventType = typeof loginEvent.type; // "login"

// 7. Type assertion in generic wrapper
class TypedCache<K, V> {
  private store = new Map<K, unknown>();
  set(key: K, value: V): void { this.store.set(key, value); }
  get(key: K): V { return this.store.get(key) as V; }
}
const cache = new TypedCache<string, number>();
cache.set("count", 42);
const count: number = cache.get("count");

// 8. Assertion in discriminated union narrowing
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; side: number };
function asCircle(shape: Shape): Extract<Shape, { kind: "circle" }> {
  if (shape.kind !== "circle") throw new Error("Not a circle");
  return shape as Extract<Shape, { kind: "circle" }>;
}

// 9. Non-null assertion in builder pattern
class Builder<T extends object> {
  private value!: T;
  set<K extends keyof T>(key: K, val: T[K]): this { this.value[key] = val; return this; }
  build(): T { return this.value!; }
}

// 10. `satisfies` for type-safe enum-like object
const Theme = {
  Light: { bg: "#fff", fg: "#000" },
  Dark:  { bg: "#000", fg: "#fff" },
} satisfies Record<string, { bg: string; fg: string }>;
type ThemeKey = keyof typeof Theme; // "Light" | "Dark"

// 11. `as const` recursively via helper
function deepFreeze<T extends object>(obj: T): Readonly<T> {
  Object.keys(obj).forEach(key => {
    const val = (obj as Record<string, unknown>)[key];
    if (typeof val === "object" && val !== null) deepFreeze(val);
  });
  return Object.freeze(obj);
}

// 12. Type-narrowing assertion for tagged union
type ApiResponse<T> =
  | { status: "success"; data: T }
  | { status: "error"; message: string };
function assertSuccess<T>(res: ApiResponse<T>): asserts res is { status: "success"; data: T } {
  if (res.status !== "success") throw new Error(res.message);
}
async function fetchUser() {
  const res: ApiResponse<{ name: string }> = { status: "success", data: { name: "Alice" } };
  assertSuccess(res);
  return res.data.name; // narrowed
}

// 13. `as` for narrowing from `unknown` in catch blocks
function tryParse(json: string): unknown {
  try { return JSON.parse(json); }
  catch (err) {
    const e = err as Error;
    throw new Error(`Parse error: ${e.message}`);
  }
}

// 14. Non-null chain in mapped result
function mapNonNull<T, U>(arr: (T | null)[], f: (v: T) => U): U[] {
  return arr.filter((v): v is T => v !== null).map(f);
}
const results = mapNonNull(["a", null, "b"], s => s.toUpperCase()); // ["A", "B"]

// 15. `satisfies` + type inference in array
const permissions = [
  { role: "admin", access: ["read", "write", "delete"] },
  { role: "user",  access: ["read"] },
] satisfies Array<{ role: string; access: string[] }>;
const adminRole = permissions[0].role; // "admin" (not string)

// 16. Assertion for exhaustive switch
function assertNever(x: never, msg = "Unexpected"): never {
  throw new Error(`${msg}: ${JSON.stringify(x)}`);
}
type Dir = "north" | "south" | "east" | "west";
function getOpposite(d: Dir): Dir {
  switch (d) {
    case "north": return "south";
    case "south": return "north";
    case "east":  return "west";
    case "west":  return "east";
    default: return assertNever(d);
  }
}

// 17. Typed FormData assertion helper
function getFormField(form: HTMLFormElement, name: string): string {
  const data = new FormData(form);
  return data.get(name) as string;
}

// 18. `as const` + satisfies for validated config
const serverConfig = {
  port: 3000,
  host: "0.0.0.0",
  cors: { origins: ["*"] },
} as const satisfies { port: number; host: string; cors: { origins: string[] } };
type CORSOrigins = typeof serverConfig.cors.origins; // readonly ["*"]

// 19. Generic type predicate
function isShape<K extends "circle" | "square">(
  shape: Shape, kind: K
): shape is Extract<Shape, { kind: K }> {
  return shape.kind === kind;
}
const s: Shape = { kind: "circle", radius: 5 };
if (isShape(s, "circle")) {
  s.radius; // number
}

// 20. `as` for re-typing function result
function identity<T>(val: T): T { return val; }
const asNumber = identity("42") as unknown as number; // force conversion

// 21. Non-null with type predicate in filter
const items = [1, null, 2, undefined, 3];
const numbers = items.filter((x): x is number => x !== null && x !== undefined);
// numbers: number[]

// 22. Type assertion in generic repository
function deserialize<T>(raw: Record<string, unknown>): T {
  return raw as unknown as T;
}
type User = { id: string; name: string };
const userObj = deserialize<User>({ id: "1", name: "Alice" });

// 23. `as const` on function parameters via wrapper
function literal<T extends string>(s: T): T { return s; }
const method = literal("GET"); // type is "GET"

// 24. Assertion function composition
function assertAll<T>(...assertions: Array<(v: unknown) => asserts v is T>) {
  return (val: unknown): asserts val is T => {
    assertions.forEach(a => a(val));
  };
}

// 25. Non-null assertion with lazy initialization
class LazyValue<T> {
  private _value!: T;
  private _initialized = false;
  initialize(val: T): void { this._value = val; this._initialized = true; }
  get value(): T {
    if (!this._initialized) throw new Error("Not initialized");
    return this._value!;
  }
}

// 26. `satisfies` for CSS property map
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} satisfies Record<string, number>;
type SpacingKey = keyof typeof spacing; // "xs" | "sm" | "md" | "lg" | "xl"

// 27. Generic assertion with runtime check
function assertRecord(val: unknown): asserts val is Record<string, unknown> {
  if (typeof val !== "object" || val === null || Array.isArray(val)) {
    throw new TypeError("Expected plain object");
  }
}

// 28. `as const` in union type narrowing
const statusMap = { ok: 200, created: 201, notFound: 404 } as const;
type StatusKey = keyof typeof statusMap;
function getStatus(key: StatusKey) { return statusMap[key]; }
const okStatus = getStatus("ok"); // 200

// 29. Assertion chaining via void
function validateUser(user: unknown): asserts user is User {
  assertRecord(user);
  if (typeof (user as Record<string, unknown>).id !== "string") throw new TypeError("id must be string");
  if (typeof (user as Record<string, unknown>).name !== "string") throw new TypeError("name must be string");
}

// 30. `as` for type alignment in reduce
const entries: [string, number][] = [["a", 1], ["b", 2]];
const obj = entries.reduce((acc, [k, v]) => {
  acc[k] = v;
  return acc;
}, {} as Record<string, number>);

// 31. `satisfies` with discriminated union
const eventHandlers = {
  click: (e: MouseEvent) => {},
  keydown: (e: KeyboardEvent) => {},
  focus: (e: FocusEvent) => {},
} satisfies Partial<Record<string, (e: Event) => void>>;

// 32. Non-null assertion in method decorator (conceptual)
function getMethod<T extends object>(obj: T, method: keyof T): Function {
  const fn = obj[method];
  if (typeof fn !== "function") throw new TypeError();
  return fn as Function;
}

// 33. Double assertion via unknown in type conversion
type StringToNumber<S extends string> = number;
const coerce = <S extends string>(s: S): StringToNumber<S> => Number(s) as unknown as StringToNumber<S>;

// 34. `satisfies` prevents excess property errors that `as` would allow
type Config2 = { host: string; port: number };
// const c1 = { host: "localhost", port: 3000, extra: true } as Config2; // extra silently lost
const c2 = { host: "localhost", port: 3000 } satisfies Config2; // safe

// 35. Non-null chaining with assertion type guard
function getOrThrow<T>(map: Map<string, T>, key: string): T {
  const val = map.get(key);
  if (val === undefined) throw new RangeError(`Key "${key}" not found`);
  return val;
}

// 36. `as const` inside generic
function tagged<K extends string, T>(tag: K, value: T): { tag: K; value: T } {
  return { tag, value } as const as { tag: K; value: T };
}
const t = tagged("user", { id: "1" });
type Tag = typeof t.tag; // "user"

// 37. Assertion function for DOM types
function assertHTMLElement<T extends HTMLElement>(el: Element | null, ctor: new () => T): asserts el is T {
  if (!(el instanceof ctor)) throw new TypeError(`Expected ${ctor.name}`);
}
const el = document.getElementById("btn");
assertHTMLElement(el, HTMLButtonElement);
// el.click(); // narrowed to HTMLButtonElement

// 38. `as const` for route definition
const routes = {
  home:    { path: "/" as const,        exact: true  },
  users:   { path: "/users" as const,   exact: true  },
  profile: { path: "/users/:id" as const, exact: false },
} satisfies Record<string, { path: string; exact: boolean }>;
type HomePath = typeof routes.home.path; // "/"

// 39. Typed window extension via assertion
function getWindowProp<T>(key: string): T {
  return (window as unknown as Record<string, unknown>)[key] as T;
}

// 40. Non-null in event delegation
document.body.addEventListener("click", e => {
  const btn = (e.target as HTMLElement).closest("button");
  if (btn) btn.setAttribute("data-clicked", "true");
});

// 41. `satisfies` preserving tuple literals
const breakpoints = {
  sm: [640, 767],
  md: [768, 1023],
  lg: [1024, 1279],
} satisfies Record<string, [number, number]>;
const smMin = breakpoints.sm[0]; // number (typed from tuple)

// 42. Assertion function used as middleware check
function requireAuth(user: unknown): asserts user is { id: string; role: string } {
  assertRecord(user);
  if (!(user as Record<string, unknown>).id) throw new Error("Unauthenticated");
}

// 43. `as const` + spread pattern for type-safe merge
const base2 = { debug: false, version: 1 } as const;
const extended = { ...base2, version: 2 } as const;
type Version = typeof extended.version; // 2

// 44. Assertion with generic narrowing in class
class TypedStore<T extends object> {
  private data: Partial<T> = {};
  set<K extends keyof T>(key: K, val: T[K]): void { this.data[key] = val; }
  get<K extends keyof T>(key: K): T[K] {
    const val = this.data[key];
    if (val === undefined) throw new RangeError(`Key ${String(key)} not found`);
    return val as T[K];
  }
}

// 45. `satisfies` for plugin registration
const plugins = {
  auth:  { init: () => {} },
  cache: { init: () => {} },
  logs:  { init: () => {} },
} satisfies Record<string, { init: () => void }>;
type PluginNames = keyof typeof plugins; // "auth" | "cache" | "logs"

// 46. Non-null in Optional<T> monad unwrap
class Option<T> {
  constructor(private val: T | null) {}
  unwrap(): T {
    if (this.val === null) throw new Error("None");
    return this.val!;
  }
  map<U>(f: (v: T) => U): Option<U> {
    return this.val === null ? new Option<U>(null) : new Option(f(this.val));
  }
}
const opt = new Option("hello").map(s => s.length).unwrap();

// 47. Type assertion with `as` on generic return
function parseJson<T = unknown>(s: string): T {
  return JSON.parse(s) as T;
}
const result = parseJson<number[]>("[1, 2, 3]");

// 48. `satisfies` constraining callback types
const handlers2 = {
  onSuccess: (data: string) => console.log(data),
  onError:   (err: Error)   => console.error(err),
} satisfies { onSuccess: (data: string) => void; onError: (err: Error) => void };

// 49. Non-null in dependency injection
class Container2 {
  private registry = new Map<string, unknown>();
  register<T>(token: string, impl: T): void { this.registry.set(token, impl); }
  resolve<T>(token: string): T { return this.registry.get(token) as T; }
}
const container = new Container2();
container.register("http", { get: async (url: string) => fetch(url) });
const http = container.resolve<{ get: (url: string) => Promise<Response> }>("http");

// 50. `as const` + `satisfies` + assertion function combo
const ENV_KEYS = ["NODE_ENV", "PORT", "API_KEY"] as const satisfies readonly string[];
type EnvKey = typeof ENV_KEYS[number];
function getEnv(key: EnvKey): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}
