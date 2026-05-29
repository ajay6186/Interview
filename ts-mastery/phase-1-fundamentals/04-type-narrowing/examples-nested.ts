export {};

// ============================================================
// NESTED EXAMPLES — Type Narrowing (50 Examples)
// ============================================================

// 1. Nested discriminated union narrowing
type ApiResponse<T> =
  | { status: "success"; data: T }
  | { status: "error"; error: { code: number; message: string } };
function handleResponse(r: ApiResponse<{ items: string[] }>): string[] {
  if (r.status === "success") return r.data.items;
  throw new Error(r.error.message);
}

// 2. Two-level discriminated union
type Event =
  | { category: "user"; type: "login"; payload: { userId: number } }
  | { category: "user"; type: "logout" }
  | { category: "system"; type: "reboot"; reason: string };
function handleEvent(e: Event): string {
  if (e.category === "user") {
    if (e.type === "login") return `login: ${e.payload.userId}`;
    return "logout";
  }
  return `reboot: ${e.reason}`;
}

// 3. Nested narrowing inside array iteration
type Notification =
  | { kind: "push"; title: string; body: string }
  | { kind: "email"; to: string; subject: string; html: string }
  | { kind: "sms"; phone: string; message: string };
function dispatchAll(notifs: Notification[]): void {
  for (const n of notifs) {
    switch (n.kind) {
      case "push":  console.log("push:", n.title);   break;
      case "email": console.log("email:", n.to);     break;
      case "sms":   console.log("sms:", n.phone);    break;
    }
  }
}

// 4. Narrowing recursive discriminated union (tree)
type Tree =
  | { tag: "leaf"; value: number }
  | { tag: "branch"; left: Tree; right: Tree };
function sumTree(t: Tree): number {
  if (t.tag === "leaf") return t.value;
  return sumTree(t.left) + sumTree(t.right);
}

// 5. Nested optional + discriminated union
type Step =
  | { done: false; next?: Step }
  | { done: true; result: string };
function runSteps(step: Step): string {
  if (step.done) return step.result;
  if (step.next) return runSteps(step.next);
  return "no result";
}

// 6. Narrowing nested object property
interface Config {
  auth?: {
    provider: "local" | "oauth";
    token?: string;
  };
}
function getProvider(cfg: Config): string {
  if (!cfg.auth) return "none";
  if (cfg.auth.provider === "oauth") return cfg.auth.token ?? "no-token";
  return "local";
}

// 7. Nested in-operator narrowing
type Pdf = { type: "pdf"; data: Buffer; pages: number };
type Csv = { type: "csv"; data: string; rows: number };
type Json = { type: "json"; data: object };
type Document = Pdf | Csv | Json;
function summarize(doc: Document): string {
  if ("pages" in doc)   return `PDF: ${doc.pages} pages`;
  if ("rows"  in doc)   return `CSV: ${doc.rows} rows`;
  return `JSON: ${Object.keys(doc.data).length} keys`;
}

// 8. Narrowing inside nested function calls
function processNested(val: string | { inner: string | number }): string {
  if (typeof val === "string") return val.toUpperCase();
  if (typeof val.inner === "string") return val.inner.toUpperCase();
  return val.inner.toFixed(2);
}

// 9. User-defined type guard for nested shape
interface HasUser { user: { id: number; name: string } }
function hasUser(obj: unknown): obj is HasUser {
  return (
    typeof obj === "object" && obj !== null &&
    "user" in obj &&
    typeof (obj as any).user === "object" &&
    (obj as any).user !== null &&
    typeof (obj as any).user.id === "number"
  );
}

// 10. Nested narrowing with generic
interface Container<T> { value: T | null; meta: { loaded: boolean } }
function extract<T>(c: Container<T>): T {
  if (!c.meta.loaded || c.value === null) throw new Error("Not loaded");
  return c.value;
}

// 11. Narrowing across nested ternary
type Result<T> = { ok: true; data: T } | { ok: false; error: string };
function chain<A, B>(r: Result<A>, fn: (a: A) => Result<B>): Result<B> {
  return r.ok ? fn(r.data) : r;
}

// 12. Narrowing in nested condition blocks
function handleRequest(req: {
  body: string | { json: unknown };
  headers: { auth?: string };
}): unknown {
  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body.json;
  if (!req.headers.auth) throw new Error("Unauthorized");
  return body;
}

// 13. Nested instanceof narrowing
class HttpError extends Error {
  constructor(public status: number, msg: string) { super(msg); }
}
class AppError extends Error {
  constructor(public code: string, msg: string) { super(msg); }
}
function wrapError(e: unknown): { kind: "http" | "app" | "unknown"; message: string } {
  if (e instanceof HttpError) return { kind: "http", message: `${e.status}: ${e.message}` };
  if (e instanceof AppError) return { kind: "app", message: `${e.code}: ${e.message}` };
  if (e instanceof Error) return { kind: "unknown", message: e.message };
  return { kind: "unknown", message: String(e) };
}

// 14. Narrowing union array element by position
type Pair = [string, number] | [number, string];
function describePair(pair: Pair): string {
  if (typeof pair[0] === "string") return `str:${pair[0]} num:${pair[1]}`;
  return `num:${pair[0]} str:${pair[1]}`;
}

// 15. Deep nested optional chain with narrowing
interface AppState {
  user?: {
    profile?: {
      address?: {
        city: string;
        country: { code: string; name: string };
      };
    };
  };
}
function getCity(state: AppState): string {
  const addr = state.user?.profile?.address;
  if (!addr) return "Unknown";
  return `${addr.city}, ${addr.country.name}`;
}

// 16. Narrowing discriminated union array elements inside filter
type Task =
  | { status: "pending"; id: number; title: string }
  | { status: "done"; id: number; title: string; completedAt: string };
const tasks: Task[] = [
  { status: "pending", id: 1, title: "A" },
  { status: "done", id: 2, title: "B", completedAt: "2024-01-01" },
];
const doneTasks = tasks.filter(
  (t): t is Extract<Task, { status: "done" }> => t.status === "done"
);

// 17. Nested narrowing: both outer and inner union
type Outer =
  | { kind: "a"; inner: { value: string } | { error: Error } }
  | { kind: "b"; data: number };
function processOuter(o: Outer): string {
  if (o.kind === "b") return `b:${o.data}`;
  if ("value" in o.inner) return `a-ok:${o.inner.value}`;
  return `a-err:${o.inner.error.message}`;
}

// 18. Narrowing state machine with nested states
type MachineState =
  | { state: "idle" }
  | { state: "loading"; requestId: string; retries: number }
  | {
      state: "loaded";
      data: { items: string[]; total: number };
      timestamp: number;
    }
  | { state: "error"; error: { code: number; message: string }; retryable: boolean };
function renderState(s: MachineState): string {
  switch (s.state) {
    case "idle":    return "Idle";
    case "loading": return `Loading... (attempt ${s.retries})`;
    case "loaded":  return `Loaded ${s.data.total} items`;
    case "error":   return `Error ${s.error.code}: ${s.error.message}`;
  }
}

// 19. Narrowing in recursive function with union
type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };
function stringify(val: JsonValue): string {
  if (val === null) return "null";
  if (typeof val === "string") return `"${val}"`;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (Array.isArray(val)) return `[${val.map(stringify).join(",")}]`;
  return `{${Object.entries(val).map(([k, v]) => `"${k}":${stringify(v)}`).join(",")}}`;
}

// 20. Nested discriminant with overlapping properties
type AdminAction =
  | { role: "admin"; action: "promote"; targetId: number; newRole: string }
  | { role: "admin"; action: "ban"; targetId: number; reason: string }
  | { role: "admin"; action: "view"; resource: string };
function handleAdmin(a: AdminAction): string {
  switch (a.action) {
    case "promote": return `promote ${a.targetId} to ${a.newRole}`;
    case "ban":     return `ban ${a.targetId}: ${a.reason}`;
    case "view":    return `view ${a.resource}`;
  }
}

// 21. Narrowing with nested type predicate chain
function isArrayOf<T>(arr: unknown, guard: (x: unknown) => x is T): arr is T[] {
  return Array.isArray(arr) && arr.every(guard);
}
function isNumber(x: unknown): x is number { return typeof x === "number"; }
const raw: unknown = [1, 2, 3];
if (isArrayOf(raw, isNumber)) {
  const doubled = raw.map((n) => n * 2); // number[]
}

// 22. Narrowing inside a class method
class DataProcessor {
  process(data: string | object): string {
    if (typeof data === "string") return data.trim();
    return JSON.stringify(data);
  }
}

// 23. Narrowing recursive type (category tree)
interface Category {
  id: number;
  name: string;
  parent?: Category;
}
function getPath(cat: Category): string {
  if (!cat.parent) return cat.name;
  return `${getPath(cat.parent)} > ${cat.name}`;
}

// 24. Narrowing with assertion after async
async function fetchUser(id: number): Promise<{ name: string } | null> {
  return null; // stub
}
async function requireUser(id: number): Promise<{ name: string }> {
  const user = await fetchUser(id);
  if (user === null) throw new Error(`User ${id} not found`);
  return user; // narrowed
}

// 25. Narrowing with Map value
const registry = new Map<string, { version: string; enabled: boolean }>();
registry.set("auth", { version: "2.0", enabled: true });
function getPlugin(name: string): { version: string; enabled: boolean } {
  const p = registry.get(name);
  if (!p) throw new Error(`Plugin ${name} not found`);
  return p; // narrowed from T | undefined
}

// 26. Nested narrowing — object with function or literal
type Handler = string | { path: string; fn: (ctx: object) => void };
function normalizeHandler(h: Handler): { path: string; fn: (ctx: object) => void } {
  if (typeof h === "string") return { path: h, fn: () => {} };
  return h;
}

// 27. Narrowing inside Promise.all results
async function loadAll(): Promise<[string | null, number | null]> {
  return ["hello", 42];
}
async function use(): Promise<void> {
  const [name, age] = await loadAll();
  if (name !== null && age !== null) {
    console.log(name.toUpperCase(), age.toFixed());
  }
}

// 28. Narrowing with Set.has guard on union
const EVENTS = new Set(["click", "keydown", "scroll"] as const);
type DomEvent = "click" | "keydown" | "scroll";
function isDomEvent(s: string): s is DomEvent {
  return EVENTS.has(s as DomEvent);
}

// 29. Narrowing flow inside nested try/catch
function safeProcess(input: unknown): string {
  try {
    if (typeof input !== "string") throw new TypeError("not a string");
    return input.trim().toUpperCase();
  } catch (e) {
    if (e instanceof TypeError) return `type error: ${e.message}`;
    return "unknown error";
  }
}

// 30. Narrowing union via key remapping
type Fields = { name: string } | { label: string };
function getLabel(f: Fields): string {
  if ("name" in f) return f.name;
  return f.label;
}

// 31. Nested narrowing — class hierarchy with method guard
class Shape2 { area(): number { return 0; } }
class Circle2 extends Shape2 {
  constructor(public radius: number) { super(); }
  area() { return Math.PI * this.radius ** 2; }
}
class Rect2 extends Shape2 {
  constructor(public w: number, public h: number) { super(); }
  area() { return this.w * this.h; }
}
function describe2(s: Shape2): string {
  if (s instanceof Circle2) return `circle r=${s.radius} area=${s.area().toFixed(2)}`;
  if (s instanceof Rect2) return `rect ${s.w}x${s.h} area=${s.area()}`;
  return `shape area=${s.area()}`;
}

// 32. Narrowing via predicate returning never for strict check
function assertNever(val: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(val)}`);
}
type TrafficLight = "red" | "yellow" | "green";
function getWait(light: TrafficLight): number {
  if (light === "red") return 60;
  if (light === "yellow") return 5;
  if (light === "green") return 0;
  return assertNever(light);
}

// 33. Narrowing via function overloads + type predicate combination
function parseValue(s: "true" | "false"): boolean;
function parseValue(s: `${number}`): number;
function parseValue(s: string): boolean | number;
function parseValue(s: string): boolean | number {
  if (s === "true" || s === "false") return s === "true";
  return Number(s);
}

// 34. Narrowing with custom equality
type Version = `${number}.${number}.${number}`;
function isVersion(s: string): s is Version {
  return /^\d+\.\d+\.\d+$/.test(s);
}
const v: string = "1.2.3";
if (isVersion(v)) console.log("semver:", v);

// 35. Narrowing array elements inside reduce
type Mixed3 = string | number | null;
const arr2: Mixed3[] = ["a", 1, null, "b", 2, null];
const result = arr2.reduce<{ strings: string[]; numbers: number[] }>(
  (acc, item) => {
    if (typeof item === "string") acc.strings.push(item);
    else if (typeof item === "number") acc.numbers.push(item);
    return acc;
  },
  { strings: [], numbers: [] }
);

// 36. Narrowing conditional deeply nested result
type DeepResult =
  | { level1: { level2: { ok: true; value: string } | { ok: false } } }
  | { level1: null };
function extractDeep(r: DeepResult): string {
  if (!r.level1) return "no level1";
  if (!r.level1.level2.ok) return "level2 failed";
  return r.level1.level2.value;
}

// 37. Narrowing with Omit to safe access post-check
type Full = { id: number; secret: string; name: string };
type Public = Omit<Full, "secret">;
function toPublic(u: Full): Public {
  const { secret, ...pub } = u;
  return pub;
}

// 38. Narrowing with callback and closure
function createValidator(type: "string" | "number") {
  return (val: unknown): boolean => {
    return typeof val === type; // type is captured
  };
}

// 39. Narrowing generic parameter via extends
function isArrayOfType<T>(arr: unknown, check: (x: unknown) => x is T): arr is T[] {
  return Array.isArray(arr) && arr.every(check);
}
function isStr(x: unknown): x is string { return typeof x === "string"; }
const rawArr: unknown = ["a", "b"];
if (isArrayOfType(rawArr, isStr)) {
  const joined = rawArr.join(","); // string[]
}

// 40. Nested narrowing — API error hierarchy
type ApiError =
  | { kind: "auth"; statusCode: 401 | 403; realm: string }
  | { kind: "notFound"; statusCode: 404; resource: string }
  | { kind: "server"; statusCode: 500 | 503; retryAfter?: number };
function handleApiError(e: ApiError): string {
  switch (e.kind) {
    case "auth":     return `Auth (${e.statusCode}): realm=${e.realm}`;
    case "notFound": return `Not found: ${e.resource}`;
    case "server":   return `Server error ${e.statusCode}${e.retryAfter ? ` (retry in ${e.retryAfter}s)` : ""}`;
  }
}

// 41. Narrowing with index lookup
type RouteMap = { home: "/"; about: "/about"; blog: "/blog/:id" };
function getPath<K extends keyof RouteMap>(key: K): RouteMap[K] {
  const map: RouteMap = { home: "/", about: "/about", blog: "/blog/:id" };
  return map[key];
}

// 42. Narrowing with class-based registry
class BaseService { name = "base"; }
class AuthService extends BaseService { login() {} }
class DataService extends BaseService { query() {} }
type AnyService = AuthService | DataService;
function dispatch(svc: AnyService): void {
  if (svc instanceof AuthService) svc.login();
  else svc.query();
}

// 43. Narrowing via property length check on tuple
type OneOrTwo = [string] | [string, number];
function expand(t: OneOrTwo): [string, number] {
  if (t.length === 2) return t;
  return [t[0], 0];
}

// 44. Narrowing in generator with discriminated union
type Item = { kind: "a"; val: string } | { kind: "b"; val: number };
function* filterA(items: Item[]): Generator<string> {
  for (const item of items) {
    if (item.kind === "a") yield item.val.toUpperCase();
  }
}

// 45. Narrowing nested optional with assertion
interface DeepConfig {
  db?: {
    pool?: {
      max: number;
      min?: number;
    };
  };
}
function requirePool(cfg: DeepConfig): { max: number; min?: number } {
  if (!cfg.db?.pool) throw new Error("pool config missing");
  return cfg.db.pool;
}

// 46. Narrowing with satisfies and object literal
const routes = {
  home: { path: "/", auth: false },
  dashboard: { path: "/dashboard", auth: true },
} satisfies Record<string, { path: string; auth: boolean }>;
type RouteConfig = typeof routes;
type AuthRoutes = { [K in keyof RouteConfig as RouteConfig[K]["auth"] extends true ? K : never]: RouteConfig[K] };

// 47. Narrowing inside async generator
async function* processChunks(chunks: (string | null)[]): AsyncGenerator<string> {
  for (const chunk of chunks) {
    if (chunk !== null) yield chunk.trim();
  }
}

// 48. Narrowing discriminated union variant from array
type Variant = { tag: "A"; x: number } | { tag: "B"; y: string };
const variants: Variant[] = [{ tag: "A", x: 1 }, { tag: "B", y: "hi" }];
const aVariants = variants.filter((v): v is Extract<Variant, { tag: "A" }> => v.tag === "A");

// 49. Narrowing nested result union
type NestedResult<T> =
  | { ok: true; data: { value: T; meta: { source: string } } }
  | { ok: false; error: { code: number; message: string; retryable: boolean } };
function extractValue<T>(r: NestedResult<T>): T {
  if (!r.ok) throw new Error(`${r.error.code}: ${r.error.message}`);
  return r.data.value;
}

// 50. Narrowing with multiple guards composed
function isValidUser(val: unknown): val is { name: string; age: number; email: string } {
  if (typeof val !== "object" || val === null) return false;
  const obj = val as Record<string, unknown>;
  return (
    typeof obj.name === "string" &&
    typeof obj.age === "number" &&
    typeof obj.email === "string" &&
    obj.email.includes("@")
  );
}
