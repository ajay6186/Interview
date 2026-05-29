export {};

// ============================================================
// NESTED EXAMPLES — Basic Types (50 Examples)
// ============================================================

// 1. Nested object type
type Address = { street: string; city: string; zip: string };
type UserWithAddress = { name: string; address: Address };
const userWithAddr: UserWithAddress = {
  name: "Alice",
  address: { street: "123 Main St", city: "Springfield", zip: "12345" },
};

// 2. Deeply nested object type
type Country = { name: string; code: string };
type City = { name: string; country: Country };
type Location = { city: City; coordinates: [number, number] };
const loc: Location = {
  city: { name: "Paris", country: { name: "France", code: "FR" } },
  coordinates: [48.8566, 2.3522],
};

// 3. Array of objects
type Product = { id: number; name: string; price: number };
const products: Product[] = [
  { id: 1, name: "Keyboard", price: 99 },
  { id: 2, name: "Mouse", price: 49 },
];

// 4. Array of tuples
const namedPoints: [string, number, number][] = [
  ["origin", 0, 0],
  ["target", 3, 4],
];

// 5. Object with array property
type Team = { name: string; members: string[] };
const team: Team = { name: "Alpha", members: ["Alice", "Bob", "Carol"] };

// 6. Object with typed array of objects
type Department = { name: string; employees: { id: number; name: string }[] };
const dept: Department = {
  name: "Engineering",
  employees: [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ],
};

// 7. Nested optional properties
type DeepOptional = {
  a?: { b?: { c?: string } };
};
const deep: DeepOptional = { a: { b: {} } };
const deepVal = deep.a?.b?.c ?? "default";

// 8. Record with nested object values
type RolePermissions = Record<string, { read: boolean; write: boolean }>;
const roles: RolePermissions = {
  admin: { read: true, write: true },
  viewer: { read: true, write: false },
};

// 9. Nested readonly object
type ImmutableTree = {
  readonly value: number;
  readonly children: readonly ImmutableTree[];
};
const tree: ImmutableTree = {
  value: 1,
  children: [
    { value: 2, children: [] },
    { value: 3, children: [{ value: 4, children: [] }] },
  ],
};

// 10. Tuple of objects
type Swap = [from: { currency: string; amount: number }, to: { currency: string }];
const trade: Swap = [
  { currency: "USD", amount: 100 },
  { currency: "EUR" },
];

// 11. Union inside nested object
type ApiResponse = {
  status: "ok" | "error";
  payload: { data: string } | { message: string };
};
const resp: ApiResponse = { status: "ok", payload: { data: "result" } };

// 12. Array of discriminated union objects
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rect"; width: number; height: number };
const shapes: Shape[] = [
  { kind: "circle", radius: 5 },
  { kind: "rect", width: 10, height: 4 },
];

// 13. Nested type alias chain
type ID = number;
type Timestamp = string;
type Meta = { createdAt: Timestamp; updatedAt: Timestamp };
type Entity = { id: ID; meta: Meta };
const entity: Entity = {
  id: 42,
  meta: { createdAt: "2024-01-01", updatedAt: "2024-06-01" },
};

// 14. Index access on nested type
type ConfigSchema = {
  server: { host: string; port: number };
  db: { url: string; pool: number };
};
type ServerConfig = ConfigSchema["server"]; // { host: string; port: number }
const srv: ServerConfig = { host: "localhost", port: 3000 };

// 15. keyof on nested type
type ServerKeys = keyof ConfigSchema["server"]; // "host" | "port"

// 16. Nested intersection type
type Timestamps = { createdAt: string; updatedAt: string };
type Identifiable = { id: number };
type AuditedRecord = Identifiable & Timestamps & { data: string };
const rec: AuditedRecord = {
  id: 1,
  data: "payload",
  createdAt: "2024-01-01",
  updatedAt: "2024-06-01",
};

// 17. Nested generic type (plain, no generic function)
type Box<T> = { value: T };
type NestedBox = Box<Box<number>>;
const nbox: NestedBox = { value: { value: 42 } };

// 18. Object with function property
type Handler = {
  name: string;
  handle: (input: string) => string;
};
const handler: Handler = {
  name: "upper",
  handle: (s) => s.toUpperCase(),
};

// 19. Array of function types
const transformers: Array<(s: string) => string> = [
  (s) => s.trim(),
  (s) => s.toLowerCase(),
  (s) => s.replace(/\s+/g, "_"),
];

// 20. Nested Record
type Matrix = Record<string, Record<string, number>>;
const matrix: Matrix = {
  row0: { col0: 1, col1: 2 },
  row1: { col0: 3, col1: 4 },
};

// 21. Optional nested array
type Config2 = { plugins?: string[]; hooks?: { name: string; fn: () => void }[] };
const cfg: Config2 = { plugins: ["pluginA"] };

// 22. Tuple with nested tuple
type Segment = [[number, number], [number, number]]; // start, end coordinates
const seg: Segment = [[0, 0], [10, 10]];

// 23. Object where values are arrays of tuples
type EventLog = Record<string, [timestamp: number, msg: string][]>;
const log: EventLog = {
  auth: [
    [1700000000, "login"],
    [1700001000, "logout"],
  ],
};

// 24. Readonly nested array
const grid: readonly (readonly number[])[] = [
  [1, 2, 3],
  [4, 5, 6],
];

// 25. Object with mixed array and scalar nested
type Profile = {
  user: { name: string; age: number };
  scores: number[];
  tags: string[];
};
const profile: Profile = {
  user: { name: "Dan", age: 28 },
  scores: [90, 85, 92],
  tags: ["typescript", "dev"],
};

// 26. Deep index access type
type AppState = { auth: { user: { role: string } } };
type UserRole = AppState["auth"]["user"]["role"]; // string

// 27. Nested discriminated union
type Tree =
  | { type: "leaf"; value: number }
  | { type: "branch"; left: Tree; right: Tree };
const binaryTree: Tree = {
  type: "branch",
  left: { type: "leaf", value: 1 },
  right: {
    type: "branch",
    left: { type: "leaf", value: 2 },
    right: { type: "leaf", value: 3 },
  },
};

// 28. Array of nested intersections
type Labeled = { label: string };
type Valued = { value: number };
const items: (Labeled & Valued)[] = [
  { label: "a", value: 1 },
  { label: "b", value: 2 },
];

// 29. Nested optional with default via nullish coalescing
type Prefs = { display?: { theme?: "dark" | "light" } };
const prefs: Prefs = {};
const theme = prefs.display?.theme ?? "light";

// 30. Nested mapped shape via Record
type Endpoints = Record<"get" | "post" | "delete", { path: string; auth: boolean }>;
const routes: Endpoints = {
  get: { path: "/items", auth: false },
  post: { path: "/items", auth: true },
  delete: { path: "/items/:id", auth: true },
};

// 31. Union of nested objects
type Event =
  | { type: "click"; x: number; y: number }
  | { type: "keydown"; key: string }
  | { type: "resize"; width: number; height: number };
const evt: Event = { type: "keydown", key: "Enter" };

// 32. Nested Partial
type FullUser = {
  name: string;
  address: { city: string; zip: string };
};
type PartialUser = Partial<FullUser>;
const partialUser: PartialUser = { name: "Alice" };

// 33. Nested Readonly on union
type ReadonlyEvent = Readonly<
  { type: "click"; x: number; y: number }
>;
const clickEvt: ReadonlyEvent = { type: "click", x: 0, y: 0 };

// 34. Object with optional nested array
type FormField = {
  label: string;
  validators?: Array<(val: string) => boolean>;
};
const field: FormField = {
  label: "Email",
  validators: [(v) => v.includes("@")],
};

// 35. Tuple containing union
type MaybeNumber = [string, number | null];
const mn1: MaybeNumber = ["count", 42];
const mn2: MaybeNumber = ["total", null];

// 36. Nested typeof
const defaultState = { loading: false, data: "", error: null as string | null };
type AppDefaultState = typeof defaultState;
const state: AppDefaultState = { loading: true, data: "", error: null };

// 37. Object with computed keys via as const
const KEYS = ["name", "email", "phone"] as const;
type UserFields = (typeof KEYS)[number]; // "name" | "email" | "phone"
const field2: UserFields = "email";

// 38. Array of objects with as const
const roles = [
  { role: "admin", level: 3 },
  { role: "user", level: 1 },
] as const;
type RoleEntry = (typeof roles)[number];
const roleEntry: RoleEntry = { role: "admin", level: 3 };

// 39. keyof on intersection type
type KA = { a: string };
type KB = { b: number };
type KAB = KA & KB;
type KABKeys = keyof KAB; // "a" | "b"

// 40. Nested function returning object
type UserFactory = { create: (name: string) => { id: number; name: string } };
const factory: UserFactory = {
  create: (name) => ({ id: Math.random(), name }),
};

// 41. Triple-nested optional chain
type DeepNested = { a?: { b?: { c?: { d: number } } } };
const dn: DeepNested = {};
const deepD = dn.a?.b?.c?.d ?? 0;

// 42. Nested index signature
type Dict = { [key: string]: { count: number; items: string[] } };
const dict: Dict = {
  fruits: { count: 3, items: ["apple", "banana", "cherry"] },
};

// 43. Object with tuple union property
type Axis = { value: [number, number] | [number, number, number] };
const ax2d: Axis = { value: [1, 2] };
const ax3d: Axis = { value: [1, 2, 3] };

// 44. Array of readonly tuples
const readonlyPairs: ReadonlyArray<readonly [string, number]> = [
  ["a", 1],
  ["b", 2],
];

// 45. Object with nested Record
type Registry = { services: Record<string, { url: string; timeout: number }> };
const registry: Registry = {
  services: {
    auth: { url: "http://auth", timeout: 3000 },
    data: { url: "http://data", timeout: 5000 },
  },
};

// 46. Pick on nested property type
type FullProduct = { id: number; name: string; price: number; stock: number };
type Cart = { items: Array<Pick<FullProduct, "id" | "name" | "price">> };
const cart: Cart = {
  items: [{ id: 1, name: "Widget", price: 9.99 }],
};

// 47. Omit on nested union member
type AdminUser = { role: "admin"; name: string; secret: string };
type PublicAdminUser = Omit<AdminUser, "secret">;
const pubAdmin: PublicAdminUser = { role: "admin", name: "Alice" };

// 48. Spread of nested object type
type Base = { id: number; meta: { created: string } };
type Extended = Base & { extra: boolean };
const ext: Extended = { id: 1, meta: { created: "2024-01-01" }, extra: true };

// 49. Object mapping to function type
type MethodMap = Record<string, (...args: any[]) => unknown>;
const methods: MethodMap = {
  greet: (name: string) => `Hello ${name}`,
  add: (a: number, b: number) => a + b,
};

// 50. Deeply chained index access
type Schema = {
  tables: {
    users: { columns: { name: string; type: string }[] };
  };
};
type UsersColumns = Schema["tables"]["users"]["columns"];
const cols: UsersColumns = [{ name: "id", type: "integer" }];
