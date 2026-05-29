export {};

// ── Nested Type Assertion Examples ───────────────────────────────────────────

// 1. Nested `as const` — deeply frozen config
const appConfig = {
  server: {
    host: "0.0.0.0",
    port: 3000,
    tls: { enabled: true, cert: "/etc/ssl/cert.pem" },
  },
  database: {
    url: "postgres://localhost:5432/app",
    pool: { min: 2, max: 10 },
  },
} as const;
type TLSEnabled = typeof appConfig.server.tls.enabled; // true (literal)
type PoolMax    = typeof appConfig.database.pool.max;  // 10 (literal)

// 2. Nested `satisfies` with deep structure
type NavItem = { label: string; path: string; children?: NavItem[] };
const navigation = {
  home:     { label: "Home",     path: "/" },
  products: {
    label: "Products", path: "/products",
    children: { featured: { label: "Featured", path: "/products/featured" } },
  },
} satisfies Record<string, { label: string; path: string; children?: Record<string, { label: string; path: string }> }>;
navigation.products.children?.featured.path; // "/products/featured"

// 3. Two-level type assertion chain
const raw: unknown = { user: { id: "1", address: { city: "NYC" } } };
const typed = raw as { user: { id: string; address: { city: string } } };
const city = typed.user.address.city;

// 4. Assertion function for nested structure
function assertUserPayload(val: unknown): asserts val is {
  user: { id: string; name: string };
  token: string;
} {
  if (typeof val !== "object" || val === null) throw new TypeError();
  const v = val as Record<string, unknown>;
  if (typeof v.token !== "string") throw new TypeError("Missing token");
  if (typeof v.user !== "object" || v.user === null) throw new TypeError("Missing user");
  const u = v.user as Record<string, unknown>;
  if (typeof u.id !== "string" || typeof u.name !== "string") throw new TypeError("Invalid user fields");
}

// 5. Non-null at multiple chain levels
type Node2 = { value: number; next?: Node2 };
const head: Node2 = { value: 1, next: { value: 2, next: { value: 3 } } };
const third = head.next!.next!.value; // 3

// 6. Nested `as const` + `satisfies` combination
const routes2 = {
  api: {
    users:  { path: "/api/users",        methods: ["GET", "POST"] },
    user:   { path: "/api/users/:id",    methods: ["GET", "PUT", "DELETE"] },
    health: { path: "/api/health",       methods: ["GET"] },
  },
} as const satisfies {
  api: Record<string, { path: string; methods: readonly string[] }>;
};
type UserMethods = typeof routes2.api.user.methods; // readonly ["GET", "PUT", "DELETE"]

// 7. Nested discriminated union with assertion
type Shape =
  | { kind: "circle"; geometry: { radius: number } }
  | { kind: "rect";   geometry: { width: number; height: number } };
function assertCircle(s: Shape): asserts s is Extract<Shape, { kind: "circle" }> {
  if (s.kind !== "circle") throw new TypeError(`Expected circle, got ${s.kind}`);
}
const shape: Shape = { kind: "circle", geometry: { radius: 5 } };
assertCircle(shape);
shape.geometry.radius; // narrowed

// 8. Generic nested assertion
function assertNested<T, K extends keyof T>(obj: T, key: K): asserts obj is T & { [P in K]-?: T[K] } {
  if (obj[key] == null) throw new TypeError(`Expected ${String(key)} to be defined`);
}
const user = { id: "1", name: undefined } as { id: string; name?: string };
assertNested(user, "name");
user.name.toUpperCase(); // narrowed to string

// 9. Deeply nested `as const` with array of objects
const menuItems = [
  { id: "home",    label: "Home",    icon: "home",    href: "/"        },
  { id: "users",   label: "Users",   icon: "users",   href: "/users"   },
  { id: "settings",label: "Settings",icon: "settings",href: "/settings"},
] as const;
type MenuItem = typeof menuItems[number];
type MenuIcons = MenuItem["icon"]; // "home" | "users" | "settings"

// 10. Assertion in recursive tree traversal
type Tree<T> = { value: T; left?: Tree<T>; right?: Tree<T> };
function assertLeaf<T>(node: Tree<T>): asserts node is Tree<T> & { left: undefined; right: undefined } {
  if (node.left || node.right) throw new Error("Not a leaf");
}
const leaf: Tree<number> = { value: 42 };
assertLeaf(leaf);
// leaf.left is now typed as undefined

// 11. Nested non-null in deeply optional chain
type Config3 = { db?: { replica?: { host?: string } } };
const cfg3: Config3 = { db: { replica: { host: "replica.host" } } };
const replicaHost = cfg3.db!.replica!.host!; // triple assertion

// 12. `satisfies` preserving nested literal inference
const designSystem = {
  colors: {
    brand: { primary: "#6366f1", secondary: "#8b5cf6" } as const,
    neutral: { white: "#fff", black: "#000" } as const,
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24 } as const,
} satisfies { colors: Record<string, Record<string, string>>; spacing: Record<string, number> };
type PrimaryColor = typeof designSystem.colors.brand.primary; // "#6366f1"

// 13. Type assertion for typed EventTarget
class TypedEventTarget<Events extends Record<string, Event>> extends EventTarget {
  typedDispatch<K extends keyof Events>(type: K & string, init?: EventInit): void {
    this.dispatchEvent(new Event(type, init));
  }
  typedOn<K extends keyof Events>(type: K & string, handler: (e: Events[K]) => void): void {
    this.addEventListener(type, handler as EventListener);
  }
}

// 14. Nested as-const for state machine config
const fsm = {
  initial: "idle",
  states: {
    idle:    { on: { start: "running", reset: "idle" } },
    running: { on: { pause: "paused", stop: "idle"  } },
    paused:  { on: { resume: "running", stop: "idle" } },
  },
} as const;
type FSMState = keyof typeof fsm.states;
type FSMEvent<S extends FSMState> = keyof typeof fsm.states[S]["on"];
type Transition<S extends FSMState, E extends FSMEvent<S>> = typeof fsm.states[S]["on"][E];

// 15. Non-null assertion in class field initialization
class DataStore<T> {
  private items!: T[]; // definite assignment assertion
  constructor() { this.items = []; }
  push(item: T): void { this.items.push(item); }
  all(): T[] { return this.items; }
}

// 16. `as` for re-typing complex reduce result
type Order = { id: string; status: "pending" | "done"; amount: number };
const orders: Order[] = [
  { id: "o1", status: "done",    amount: 100 },
  { id: "o2", status: "pending", amount: 50  },
];
const grouped = orders.reduce((acc, o) => {
  (acc[o.status] ??= []).push(o);
  return acc;
}, {} as Record<Order["status"], Order[]>);

// 17. Nested assertion in async context
async function fetchNestedData(): Promise<{
  profile: { user: { name: string }; meta: { active: boolean } }
}> {
  const raw = await fetch("/api/profile").then(r => r.json()) as unknown;
  return raw as { profile: { user: { name: string }; meta: { active: boolean } } };
}

// 18. Multi-layer `satisfies` at different nesting levels
type Point = { x: number; y: number };
type Shape2 = { origin: Point; dimensions: Point };
const rect2 = {
  origin:     { x: 0, y: 0 }     satisfies Point,
  dimensions: { x: 100, y: 200 } satisfies Point,
} satisfies Shape2;

// 19. Assertion for schema-validated nested object
type UserProfile = {
  id: string;
  contact: { email: string; phone?: string };
  address: { city: string; country: string };
};
function assertUserProfile(val: unknown): asserts val is UserProfile {
  if (typeof val !== "object" || val === null) throw new TypeError("Not an object");
  const v = val as Record<string, unknown>;
  if (typeof v.id !== "string") throw new TypeError("id must be string");
  if (typeof v.contact !== "object" || !v.contact) throw new TypeError("contact missing");
  if (typeof v.address !== "object" || !v.address) throw new TypeError("address missing");
}

// 20. Deeply nested const enum lookup via as const
const httpCodes = {
  success: { ok: 200, created: 201, noContent: 204 },
  client:  { badRequest: 400, unauthorized: 401, notFound: 404 },
  server:  { internalError: 500, notImplemented: 501 },
} as const;
type HttpCode = typeof httpCodes[keyof typeof httpCodes][keyof typeof httpCodes[keyof typeof httpCodes]];
// 200 | 201 | 204 | 400 | 401 | 404 | 500 | 501

// 21. `as const` on returned nested tuple
function getRange(): readonly [min: number, max: number] {
  return [0, 100] as const;
}
const [min, max] = getRange(); // readonly tuple

// 22. Nested non-null for graph traversal
type GraphNode = { id: string; neighbors?: GraphNode[] };
function firstNeighbor(node: GraphNode): GraphNode {
  return node.neighbors![0]; // assert neighbors exists and has items
}

// 23. `satisfies` for typed API route map
const apiRoutes = {
  "GET /users":       { handler: "listUsers",   auth: false },
  "POST /users":      { handler: "createUser",  auth: true  },
  "GET /users/:id":   { handler: "getUser",     auth: false },
  "DELETE /users/:id":{ handler: "deleteUser",  auth: true  },
} satisfies Record<string, { handler: string; auth: boolean }>;
type ProtectedRoutes = {
  [K in keyof typeof apiRoutes as typeof apiRoutes[K]["auth"] extends true ? K : never]: typeof apiRoutes[K];
};

// 24. Type assertion in type-safe proxy
function createTypedProxy<T extends object>(target: T): T {
  return new Proxy(target, {
    get(obj, key) {
      return obj[key as keyof T];
    },
    set(obj, key, val) {
      (obj as Record<PropertyKey, unknown>)[key] = val;
      return true;
    },
  }) as T;
}
const proxied = createTypedProxy({ name: "Alice", age: 30 });

// 25. Nested `as const` for theme tokens
const tokens2 = {
  light: {
    primary: { bg: "#6366f1", fg: "#fff" } as const,
    surface: { bg: "#f9fafb", fg: "#111" } as const,
  } as const,
  dark: {
    primary: { bg: "#4f46e5", fg: "#fff" } as const,
    surface: { bg: "#1e1e2e", fg: "#cdd6f4" } as const,
  } as const,
} as const;
type LightPrimaryBg = typeof tokens2.light.primary.bg; // "#6366f1"

// 26. Assertion function used in conditional rendering context
type AuthedUser = { id: string; role: "admin" | "user" };
function assertAuthed(user: unknown): asserts user is AuthedUser {
  if (typeof (user as AuthedUser)?.id !== "string") throw new Error("Unauthenticated");
}
const sessionUser: unknown = { id: "u1", role: "admin" };
assertAuthed(sessionUser);
sessionUser.role; // "admin" | "user"

// 27. Non-null in recursive reduction
type BinTree = { left?: BinTree; right?: BinTree; val: number };
function sumTree(t?: BinTree): number {
  if (!t) return 0;
  return t.val + sumTree(t.left) + sumTree(t.right);
}
const tree: BinTree = { val: 1, left: { val: 2 }, right: { val: 3 } };
sumTree(tree); // 6

// 28. Chained assertions in validation pipeline
function pipeline<T>(val: unknown, ...validators: Array<(v: unknown) => void>): T {
  validators.forEach(v => v(val));
  return val as T;
}

// 29. Nested `satisfies` array of tuples
const matrix = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
] satisfies [number, number, number][];
type MatrixRow = typeof matrix[number]; // [number, number, number]

// 30. `as` for type-safe dynamic property access
function getProperty<T extends object, K extends keyof T>(obj: T, key: string): T[K] {
  return (obj as Record<string, unknown>)[key] as T[K];
}
const user2 = { id: "1", name: "Alice" };
const id2: string = getProperty(user2, "id");

// 31. Nested type assertion in HOF
function wrapNested<T, U>(
  outer: unknown,
  outerKey: string,
  innerKey: string
): T[keyof T] {
  const o = outer as Record<string, unknown>;
  const inner = o[outerKey] as Record<string, unknown>;
  return inner[innerKey] as T[keyof T];
}

// 32. `as const` on function result passed to generic
function asConst<T>(val: T): Readonly<T> { return Object.freeze(val) as Readonly<T>; }
const immutable = asConst({ x: 1, y: [2, 3] } as const);
type IX = typeof immutable.x; // 1

// 33. Assertion composition — build complex validator
type ComplexUser = { id: string; roles: string[]; address: { city: string } };
function assertComplexUser(v: unknown): asserts v is ComplexUser {
  if (typeof v !== "object" || v === null) throw new TypeError();
  const obj = v as Record<string, unknown>;
  if (!Array.isArray(obj.roles)) throw new TypeError("roles must be array");
  if (typeof obj.id !== "string") throw new TypeError("id must be string");
  if (typeof (obj.address as Record<string, unknown>)?.city !== "string") throw new TypeError("city required");
}

// 34. `satisfies` for heterogeneous but constrained values
const palette2 = {
  primary:   "#6366f1" as string,
  secondary: "#8b5cf6" as string,
  accent:    [255, 100, 50] as [number, number, number],
} satisfies Record<string, string | [number, number, number]>;
palette2.accent; // [number, number, number]

// 35. Non-null with exhaustive union check
type Auth = { status: "authenticated"; userId: string } | { status: "anonymous" };
function requireAuthenticated(auth: Auth): asserts auth is Extract<Auth, { status: "authenticated" }> {
  if (auth.status !== "authenticated") throw new Error("Not authenticated");
}

// 36. `as const` used in switch case labels
const Events2 = {
  INIT:  "init",
  START: "start",
  STOP:  "stop",
  RESET: "reset",
} as const;
type Event2 = typeof Events2[keyof typeof Events2];
function handleEvent2(e: Event2): void {
  switch (e) {
    case Events2.INIT:  console.log("initializing"); break;
    case Events2.START: console.log("starting");     break;
    case Events2.STOP:  console.log("stopping");     break;
    case Events2.RESET: console.log("resetting");    break;
  }
}

// 37. Deep assertion chain via composition
const assertors = {
  isString: (v: unknown): asserts v is string => { if (typeof v !== "string") throw new TypeError(); },
  isNumber: (v: unknown): asserts v is number => { if (typeof v !== "number") throw new TypeError(); },
};
function assertField<T, K extends keyof T>(obj: T, key: K, assertor: (v: unknown) => void): void {
  assertor(obj[key]);
}

// 38. Nested `as const` with generic extraction
const handlers3 = {
  login:  { method: "POST" as const, path: "/auth/login" as const },
  logout: { method: "POST" as const, path: "/auth/logout" as const },
  me:     { method: "GET"  as const, path: "/auth/me"     as const },
} as const;
type HandlerMethod<K extends keyof typeof handlers3> = typeof handlers3[K]["method"];
type LoginMethod = HandlerMethod<"login">; // "POST"

// 39. Triple nested assertion utility
function assertPath<T, K1 extends keyof T, K2 extends keyof T[K1]>(
  obj: T, k1: K1, k2: K2
): asserts obj is T & { [P in K1]: { [Q in K2]-?: T[K1][K2] } } {
  const mid = obj[k1] as Record<string, unknown>;
  if (mid == null || mid[k2 as string] == null) {
    throw new TypeError(`Expected ${String(k1)}.${String(k2)} to be defined`);
  }
}

// 40. `satisfies` on class method return type
class ConfigBuilder2 {
  build() {
    return {
      host: "localhost",
      port: 3000,
      db: { host: "localhost", port: 5432 },
    } satisfies { host: string; port: number; db: { host: string; port: number } };
  }
}
const config4 = new ConfigBuilder2().build();
config4.db.port; // number

// 41. `as const` propagation through re-exports
const METHODS = { GET: "GET", POST: "POST" } as const;
const PATHS   = { USERS: "/users", POSTS: "/posts" } as const;
const API3 = { methods: METHODS, paths: PATHS } as const;
type ApiGetPath = typeof API3.paths.USERS; // "/users"

// 42. Nested non-null guard for optional parameters
function createQuery(
  table: string,
  where?: { field: string; value: unknown },
  limit?: number
): string {
  const whereClause = where ? `WHERE ${where.field} = ?` : "";
  const limitClause = limit != null ? `LIMIT ${limit}` : "";
  return `SELECT * FROM ${table} ${whereClause} ${limitClause}`.trim();
}

// 43. Nested `satisfies` for plugin config
type Plugin = { name: string; version: string; init: () => void };
const plugins = {
  auth:  { name: "auth",  version: "1.0.0", init: () => {} },
  cache: { name: "cache", version: "2.0.0", init: () => {} },
} satisfies Record<string, Plugin>;
type PluginName = keyof typeof plugins; // "auth" | "cache"

// 44. Type assertion with intersection merging
type WithMeta<T> = T & { meta: { createdAt: Date; updatedAt: Date } };
function addMeta<T>(obj: T): WithMeta<T> {
  return { ...obj as object, meta: { createdAt: new Date(), updatedAt: new Date() } } as WithMeta<T>;
}

// 45. `as` in JSON transformer
function transformResponse<T extends object, U>(
  raw: unknown,
  transform: (v: T) => U
): U {
  return transform(raw as T);
}
const userRes = transformResponse<{ first_name: string }, { name: string }>(
  { first_name: "Alice" },
  v => ({ name: v.first_name })
);

// 46. `satisfies` for Redux-like action creators
const actions = {
  increment: (by: number) => ({ type: "increment" as const, payload: by }),
  decrement: (by: number) => ({ type: "decrement" as const, payload: by }),
  reset:     ()           => ({ type: "reset" as const }),
} satisfies Record<string, (...args: any[]) => { type: string }>;
type IncrementAction = ReturnType<typeof actions.increment>; // { type: "increment"; payload: number }

// 47. Nested type assertion via generic class method
class TypedMapper<T, U> {
  constructor(private readonly mapper: (val: T) => U) {}
  map(raw: unknown): U { return this.mapper(raw as T); }
}
const userMapper = new TypedMapper<{ name: string }, string>(v => v.name);
const name2 = userMapper.map({ name: "Alice" }); // "Alice"

// 48. Assertion function for array of typed objects
function assertArrayOf<T>(
  val: unknown,
  itemAsserter: (v: unknown) => asserts v is T
): asserts val is T[] {
  if (!Array.isArray(val)) throw new TypeError("Expected array");
  val.forEach(item => itemAsserter(item));
}

// 49. `as const` + template literal
const prefix = "btn" as const;
type BtnClass = `${typeof prefix}-${string}`;
const cls: BtnClass = "btn-primary";

// 50. Composed `as const` + `satisfies` for full application schema
type Route = { method: "GET" | "POST" | "PUT" | "DELETE"; path: string; auth: boolean };
const routeSchema = {
  listUsers:   { method: "GET",    path: "/users",     auth: false },
  createUser:  { method: "POST",   path: "/users",     auth: true  },
  getUser:     { method: "GET",    path: "/users/:id", auth: false },
  updateUser:  { method: "PUT",    path: "/users/:id", auth: true  },
  deleteUser:  { method: "DELETE", path: "/users/:id", auth: true  },
} as const satisfies Record<string, Route>;
type AuthedRoutes = {
  [K in keyof typeof routeSchema as typeof routeSchema[K]["auth"] extends true ? K : never]: typeof routeSchema[K];
};
// { createUser: ...; updateUser: ...; deleteUser: ... }
