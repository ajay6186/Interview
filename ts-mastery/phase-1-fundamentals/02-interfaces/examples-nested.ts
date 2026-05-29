export {};

// ============================================================
// NESTED EXAMPLES — Interfaces (50 Examples)
// ============================================================

// 1. Interface with nested interface property
interface Address {
  street: string;
  city: string;
  country: string;
}
interface User {
  name: string;
  address: Address;
}
const user: User = {
  name: "Alice",
  address: { street: "123 Main St", city: "Boston", country: "USA" },
};

// 2. Three-level deep nesting
interface Engine {
  type: "v4" | "v6" | "electric";
  horsepower: number;
}
interface Drivetrain {
  engine: Engine;
  transmission: "manual" | "automatic";
}
interface Vehicle {
  brand: string;
  drivetrain: Drivetrain;
}
const car: Vehicle = {
  brand: "Honda",
  drivetrain: {
    engine: { type: "v4", horsepower: 150 },
    transmission: "automatic",
  },
};

// 3. Interface with array of nested interface
interface Tag {
  id: number;
  label: string;
}
interface Post {
  title: string;
  content: string;
  tags: Tag[];
}
const post: Post = {
  title: "TypeScript Deep Dive",
  content: "...",
  tags: [{ id: 1, label: "typescript" }, { id: 2, label: "programming" }],
};

// 4. Nested optional interface
interface ContactInfo {
  email: string;
  phone?: { number: string; extension?: string };
}
const contact: ContactInfo = { email: "a@b.com", phone: { number: "555-1234" } };

// 5. Interface referencing itself (recursive)
interface Category {
  id: number;
  name: string;
  parent?: Category;
  children: Category[];
}
const root: Category = {
  id: 1,
  name: "Root",
  children: [
    { id: 2, name: "Child A", children: [] },
    { id: 3, name: "Child B", children: [{ id: 4, name: "Grandchild", children: [] }] },
  ],
};

// 6. Interface with nested readonly
interface ImmutableAddress {
  readonly street: string;
  readonly city: string;
}
interface ImmutableUser {
  readonly name: string;
  readonly address: ImmutableAddress;
}
const iUser: ImmutableUser = {
  name: "Bob",
  address: { street: "1 Park Ave", city: "NYC" },
};

// 7. Interface with nested Record
interface Catalog {
  name: string;
  items: Record<string, { price: number; stock: number }>;
}
const catalog: Catalog = {
  name: "Electronics",
  items: {
    laptop: { price: 999, stock: 10 },
    phone: { price: 799, stock: 25 },
  },
};

// 8. Generic interface with nested generic
interface ApiPage<T> {
  data: T[];
  meta: { page: number; total: number };
}
interface UserRecord { id: number; name: string }
const page: ApiPage<UserRecord> = {
  data: [{ id: 1, name: "Alice" }],
  meta: { page: 1, total: 100 },
};

// 9. Nested discriminated union in interface
interface Success<T> { status: "ok"; data: T }
interface Failure { status: "error"; message: string }
type ApiResult<T> = Success<T> | Failure;
interface SearchResponse {
  query: string;
  result: ApiResult<{ items: string[] }>;
}
const resp: SearchResponse = {
  query: "ts",
  result: { status: "ok", data: { items: ["TypeScript"] } },
};

// 10. Interface with nested function properties
interface Middleware {
  name: string;
  before?: (ctx: { req: string }) => void;
  after?: (ctx: { res: string }) => void;
  handler: (ctx: { req: string; res: string }) => void;
}
const mw: Middleware = {
  name: "logger",
  handler: (ctx) => console.log(ctx),
};

// 11. Interface extending nested interface
interface BaseConfig {
  server: { host: string; port: number };
}
interface FullConfig extends BaseConfig {
  server: BaseConfig["server"] & { ssl: boolean };
  db: { url: string };
}
const fullConf: FullConfig = {
  server: { host: "localhost", port: 443, ssl: true },
  db: { url: "postgres://localhost/mydb" },
};

// 12. Nested interface with index signature
interface NestedDynamic {
  fixed: string;
  dynamic: { [key: string]: number };
}
const nd: NestedDynamic = { fixed: "hello", dynamic: { a: 1, b: 2 } };

// 13. Interface with nested Promise-returning methods
interface UserService {
  auth: {
    login(creds: { username: string; password: string }): Promise<string>;
    logout(): Promise<void>;
  };
  profile: {
    get(id: number): Promise<{ name: string; email: string }>;
    update(id: number, data: { name?: string }): Promise<void>;
  };
}

// 14. Deeply nested generic interface
interface Graph<Node, Edge> {
  nodes: Node[];
  edges: Array<{ from: Node; to: Node; data: Edge }>;
}
interface PointNode { x: number; y: number }
interface WeightedEdge { weight: number }
const graph: Graph<PointNode, WeightedEdge> = {
  nodes: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
  edges: [{ from: { x: 0, y: 0 }, to: { x: 1, y: 1 }, data: { weight: 1.41 } }],
};

// 15. Interface with nested readonly array of interfaces
interface Department {
  name: string;
  readonly employees: ReadonlyArray<{ id: number; name: string; role: string }>;
}
const dept: Department = {
  name: "Engineering",
  employees: [{ id: 1, name: "Alice", role: "Lead" }],
};

// 16. Interface composition via intersection
interface HasId { id: number }
interface HasTimestamps { createdAt: string; updatedAt: string }
interface HasSoftDelete { deletedAt?: string }
type BaseModel = HasId & HasTimestamps & HasSoftDelete;
interface UserModel extends BaseModel {
  name: string;
  email: string;
}
const userModel: UserModel = {
  id: 1, name: "Alice", email: "a@b.com",
  createdAt: "2024-01-01", updatedAt: "2024-06-01",
};

// 17. Nested interface with function that returns interface
interface Builder {
  withName(name: string): Builder;
  withAge(age: number): Builder;
  build(): { name: string; age: number };
}

// 18. Interface for event system with nested payloads
interface AppEvents {
  "user:login": { userId: number; timestamp: number };
  "user:logout": { userId: number };
  "post:created": { postId: number; authorId: number; title: string };
}
type EventPayload<K extends keyof AppEvents> = AppEvents[K];
const loginPayload: EventPayload<"user:login"> = { userId: 1, timestamp: Date.now() };

// 19. Nested interface with mapped type
interface FormSchema {
  fields: {
    name: { type: "text"; required: true };
    age: { type: "number"; required: false };
    email: { type: "email"; required: true };
  };
}
type FieldNames = keyof FormSchema["fields"]; // "name" | "age" | "email"

// 20. Interface with two levels of generic nesting
interface WrappedList<T> {
  items: Array<{ data: T; metadata: { index: number; selected: boolean } }>;
}
const wrappedUsers: WrappedList<{ name: string }> = {
  items: [{ data: { name: "Alice" }, metadata: { index: 0, selected: true } }],
};

// 21. Nested interface where child extends parent property
interface Theme {
  colors: { primary: string; secondary: string; background: string };
  typography: { fontFamily: string; fontSize: number };
}
interface DarkTheme extends Theme {
  colors: Theme["colors"] & { surface: string };
}
const dark: DarkTheme = {
  colors: { primary: "#fff", secondary: "#888", background: "#000", surface: "#111" },
  typography: { fontFamily: "monospace", fontSize: 14 },
};

// 22. Deeply nested optional chain through interfaces
interface Account {
  user?: {
    profile?: {
      avatar?: { url: string };
    };
  };
}
const account: Account = {};
const avatarUrl = account.user?.profile?.avatar?.url ?? "/default.png";

// 23. Interface with nested union of interfaces
interface EmailContact { kind: "email"; address: string }
interface PhoneContact { kind: "phone"; number: string }
interface ContactBook {
  entries: Array<{ name: string; contact: EmailContact | PhoneContact }>;
}
const contacts: ContactBook = {
  entries: [
    { name: "Alice", contact: { kind: "email", address: "alice@mail.com" } },
    { name: "Bob", contact: { kind: "phone", number: "555-0000" } },
  ],
};

// 24. Interface with nested schema and validation
interface Schema<T> {
  type: string;
  fields: {
    [K in keyof T]: {
      required: boolean;
      type: string;
      default?: T[K];
    };
  };
}

// 25. Nested interface with overloaded method
interface DataParser {
  parse(input: string): string[];
  parse(input: number): number[];
  rawData: { source: string; encoding: string };
}

// 26. Interface for Redux-like store
interface Store<State, Action> {
  getState(): State;
  dispatch(action: Action): void;
  subscribe(listener: (state: State) => void): () => void;
}

// 27. Interface with nested error types
interface ValidationError {
  field: string;
  messages: string[];
}
interface FormError {
  form: string;
  errors: ValidationError[];
  timestamp: number;
}
const formErr: FormError = {
  form: "registration",
  errors: [{ field: "email", messages: ["Invalid format"] }],
  timestamp: Date.now(),
};

// 28. Interface for HTTP client with nested config
interface HttpClient {
  config: {
    baseUrl: string;
    timeout: number;
    headers: Record<string, string>;
  };
  get<T>(path: string): Promise<T>;
  post<T, B>(path: string, body: B): Promise<T>;
}

// 29. Interface hierarchy: abstract → concrete
interface Shape {
  color: string;
  area(): number;
}
interface ColoredCircle extends Shape {
  radius: number;
}
interface ColoredRect extends Shape {
  width: number;
  height: number;
}

// 30. Interface with deeply nested generic constraint
interface TreeStructure<T extends { id: number }> {
  root: {
    node: T;
    children: Array<{ node: T; children: Array<{ node: T; children: [] }> }>;
  };
}

// 31. Interface with optional nested methods
interface Plugin {
  name: string;
  hooks?: {
    beforeInstall?(): void;
    afterInstall?(): void;
    onError?(err: Error): void;
  };
}
const myPlugin: Plugin = {
  name: "logger",
  hooks: { afterInstall: () => console.log("installed") },
};

// 32. Nested interface with template literal key type
type HttpMethod2 = "get" | "post" | "put" | "delete";
interface RouterConfig {
  routes: { [K in `${HttpMethod2}:${string}`]: { handler: string; auth: boolean } };
}

// 33. Interface with nested computed property shape
interface ApiSchema {
  endpoints: Record<string, {
    method: "GET" | "POST";
    request: { params?: Record<string, string>; body?: unknown };
    response: { data: unknown; status: number };
  }>;
}

// 34. Nested interface extending two bases with conflict resolution
interface Auditable { updatedBy: string }
interface Versionable { version: number }
interface VersionedEntity extends Auditable, Versionable {
  id: number;
  data: string;
}
const ve: VersionedEntity = { id: 1, data: "x", updatedBy: "admin", version: 3 };

// 35. Interface with recursive optional children (tree)
interface MenuNode {
  label: string;
  url?: string;
  children?: MenuNode[];
}
const menu: MenuNode = {
  label: "Home",
  children: [
    { label: "About" },
    { label: "Blog", children: [{ label: "Post 1", url: "/blog/1" }] },
  ],
};

// 36. Nested interfaces for state machine
interface StateMachineConfig<State extends string, Event extends string> {
  initial: State;
  transitions: Record<State, Partial<Record<Event, State>>>;
  onEnter?: Record<State, () => void>;
}

// 37. Interface with nested mapped type
interface PermissionSet {
  resources: {
    [resource: string]: {
      actions: { read: boolean; write: boolean; delete: boolean };
    };
  };
}
const perms: PermissionSet = {
  resources: {
    posts: { actions: { read: true, write: true, delete: false } },
  },
};

// 38. Interface with nested array of discriminated unions
interface Notification {
  id: number;
  payload:
    | { kind: "message"; text: string }
    | { kind: "alert"; severity: "low" | "high" }
    | { kind: "reminder"; dueAt: string };
}
const notif: Notification = {
  id: 1,
  payload: { kind: "alert", severity: "high" },
};

// 39. Interface extending built-in with nested type
interface TypedMap<K, V> extends Map<K, V> {
  toObject(): Record<string, V>;
}

// 40. Nested interface for dependency injection
interface ServiceLocator {
  services: {
    db: { query<T>(sql: string): Promise<T[]> };
    cache: { get(key: string): string | null; set(key: string, val: string): void };
    logger: { info(msg: string): void; error(msg: string, err?: Error): void };
  };
}

// 41. Interface with deeply nested type extraction
interface AppConfig {
  auth: { providers: { name: string; clientId: string }[] };
}
type Provider = AppConfig["auth"]["providers"][number];
const prov: Provider = { name: "google", clientId: "xxx" };

// 42. Interface with nested callback interface
interface DataLoader<T> {
  load(id: number): Promise<T>;
  onLoad?: {
    success(data: T): void;
    failure(err: Error): void;
  };
}

// 43. Nested interface for command bus
interface CommandBus {
  register<T, R>(
    commandType: new (...args: any[]) => T,
    handler: { execute(cmd: T): Promise<R> }
  ): void;
}

// 44. Interface with nested template string keys
type Lang = "en" | "fr" | "de";
interface Translations {
  messages: { [K in `${Lang}.${string}`]: string };
}

// 45. Deeply nested optional chaining with interface
interface DeepOptional {
  a?: { b?: { c?: { d?: string } } };
}
const deepOpt: DeepOptional = { a: { b: {} } };
const leaf = deepOpt.a?.b?.c?.d ?? "N/A";

// 46. Interface for fluent query interface (nested returns)
interface SelectQuery {
  from(table: string): WhereQuery;
}
interface WhereQuery {
  where(condition: string): OrderQuery;
  build(): string;
}
interface OrderQuery extends WhereQuery {
  orderBy(field: string, dir: "ASC" | "DESC"): OrderQuery;
}

// 47. Nested interface with overloaded generic method
interface DataStore2<T> {
  query(id: number): T;
  query(filter: Partial<T>): T[];
  metadata: { count: number; lastUpdated: string };
}

// 48. Interface for plugin architecture with nested lifecycle
interface AppPlugin {
  name: string;
  version: string;
  lifecycle: {
    onLoad(app: object): void;
    onUnload(): void;
    onError?(err: Error): boolean;
  };
  config?: Record<string, unknown>;
}

// 49. Nested interface for matrix operations
interface Matrix {
  rows: number;
  cols: number;
  data: number[][];
  operations: {
    add(other: Matrix): Matrix;
    multiply(other: Matrix): Matrix;
    transpose(): Matrix;
  };
}

// 50. Interface with nested branded types
declare const _brand: unique symbol;
type Brand<T, B> = T & { [_brand]: B };
type UserId = Brand<number, "UserId">;
type PostId = Brand<number, "PostId">;
interface Like {
  user: { id: UserId; name: string };
  post: { id: PostId; title: string };
  timestamp: number;
}
