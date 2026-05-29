export {};

// ── Nested Enum & Literal Type Examples ─────────────────────────────────────

// 1. Nested namespace enums
namespace UI {
  export namespace Button {
    export enum Variant { Primary = "primary", Secondary = "secondary", Ghost = "ghost" }
    export enum Size { SM = "sm", MD = "md", LG = "lg" }
  }
  export namespace Input {
    export enum Type { Text = "text", Password = "password", Email = "email" }
    export enum State { Default = "default", Focus = "focus", Error = "error" }
  }
}
type ButtonProps = { variant: UI.Button.Variant; size: UI.Button.Size };
const btn: ButtonProps = { variant: UI.Button.Variant.Primary, size: UI.Button.Size.MD };

// 2. Nested discriminated union with enum tags
enum NodeKind { Leaf = "leaf", Branch = "branch", Root = "root" }
type TreeNode2 =
  | { kind: NodeKind.Leaf; value: number }
  | { kind: NodeKind.Branch; left: TreeNode2; right: TreeNode2 }
  | { kind: NodeKind.Root; child: TreeNode2 };
function sumTree(node: TreeNode2): number {
  switch (node.kind) {
    case NodeKind.Leaf:   return node.value;
    case NodeKind.Branch: return sumTree(node.left) + sumTree(node.right);
    case NodeKind.Root:   return sumTree(node.child);
  }
}
const tree: TreeNode2 = {
  kind: NodeKind.Root,
  child: {
    kind: NodeKind.Branch,
    left:  { kind: NodeKind.Leaf, value: 3 },
    right: { kind: NodeKind.Leaf, value: 4 },
  },
};
sumTree(tree); // 7

// 3. Multi-level literal type path
type Method3 = "get" | "post" | "put" | "delete";
type Resource = "users" | "posts" | "comments";
type SubResource = "likes" | "replies";
type ApiPath =
  | `/${Resource}`
  | `/${Resource}/${string}`
  | `/${Resource}/${string}/${SubResource}`;
const p1: ApiPath = "/users";
const p2: ApiPath = "/posts/42";
const p3: ApiPath = "/posts/42/replies";

// 4. Nested const object acting as enum hierarchy
const Routes = {
  Auth: {
    Login:    "/auth/login",
    Logout:   "/auth/logout",
    Register: "/auth/register",
  },
  Api: {
    Users: {
      List:   "/api/users",
      Detail: "/api/users/:id",
    },
    Posts: {
      List:   "/api/posts",
      Detail: "/api/posts/:id",
    },
  },
} as const;
type AuthRoute = typeof Routes.Auth[keyof typeof Routes.Auth];
type UserRoute = typeof Routes.Api.Users[keyof typeof Routes.Api.Users];

// 5. Nested enum in record mapping
enum Category { Electronics = "electronics", Clothing = "clothing" }
enum SubCategory {
  Phones = "phones", Laptops = "laptops",   // Electronics
  Shirts = "shirts", Pants = "pants",       // Clothing
}
const categoryMap: Record<Category, SubCategory[]> = {
  [Category.Electronics]: [SubCategory.Phones, SubCategory.Laptops],
  [Category.Clothing]:    [SubCategory.Shirts,  SubCategory.Pants],
};

// 6. Nested discriminated union recursive AST
enum ExprKind { Num = "num", Add = "add", Mul = "mul", Neg = "neg" }
type Expr =
  | { kind: ExprKind.Num; value: number }
  | { kind: ExprKind.Add; left: Expr; right: Expr }
  | { kind: ExprKind.Mul; left: Expr; right: Expr }
  | { kind: ExprKind.Neg; expr: Expr };
function evalExpr(e: Expr): number {
  switch (e.kind) {
    case ExprKind.Num: return e.value;
    case ExprKind.Add: return evalExpr(e.left) + evalExpr(e.right);
    case ExprKind.Mul: return evalExpr(e.left) * evalExpr(e.right);
    case ExprKind.Neg: return -evalExpr(e.expr);
  }
}
const expr: Expr = {
  kind: ExprKind.Add,
  left:  { kind: ExprKind.Num, value: 3 },
  right: { kind: ExprKind.Mul, left: { kind: ExprKind.Num, value: 4 }, right: { kind: ExprKind.Num, value: 5 } },
};
evalExpr(expr); // 23

// 7. Nested template literal building a CSS-like DSL
type CSSProp = "background" | "color" | "border";
type CSSDir = "top" | "bottom" | "left" | "right";
type CSSFullProp = CSSProp | `${CSSProp}-${CSSDir}`;
const cssProp: CSSFullProp = "border-top";

// 8. Nested enum-mapped component config
namespace Components {
  export enum Dialog { Info = "info", Warn = "warn", Error = "error", Confirm = "confirm" }
  export enum Table  { Striped = "striped", Bordered = "bordered", Hoverable = "hoverable" }
}
type DialogConfig = {
  type: Components.Dialog;
  title: string;
  confirmText?: string;
};
const dlg: DialogConfig = { type: Components.Dialog.Warn, title: "Warning!", confirmText: "OK" };

// 9. Deeply nested `as const` + keyof chains
const AppConfig2 = {
  features: {
    auth: { enabled: true, provider: "oauth2" },
    notifications: { email: true, sms: false },
  },
  ui: {
    theme: "dark",
    density: "comfortable",
  },
} as const;
type FeatureKey = keyof typeof AppConfig2.features;
type AuthProvider = typeof AppConfig2.features.auth.provider;

// 10. Nested union of unions
type RGB = "red" | "green" | "blue";
type CMYK = "cyan" | "magenta" | "yellow" | "black";
type HexColor = `#${string}`;
type AnyColor = RGB | CMYK | HexColor;
function normalizeColor(c: AnyColor): string { return c; }

// 11. Enum tree with traversal
enum FileType { Directory = "dir", File = "file", Symlink = "symlink" }
type FSNode =
  | { type: FileType.File; name: string; size: number }
  | { type: FileType.Directory; name: string; children: FSNode[] }
  | { type: FileType.Symlink; name: string; target: string };
function listFiles(node: FSNode): string[] {
  switch (node.type) {
    case FileType.File:      return [node.name];
    case FileType.Symlink:   return [node.name];
    case FileType.Directory: return node.children.flatMap(listFiles);
  }
}

// 12. Nested literal type conditional
type DeepLiteral<T> =
  T extends string ? `str:${T}` :
  T extends number ? `num:${T & number}` :
  T extends boolean ? `bool:${T & boolean}` :
  never;
type DL1 = DeepLiteral<"hello">; // "str:hello"
type DL2 = DeepLiteral<42>;      // "num:42"

// 13. Multi-level namespace with grouped enum
namespace Http {
  export namespace Request {
    export enum Method { GET = "GET", POST = "POST", PUT = "PUT" }
    export enum BodyType { JSON = "application/json", Form = "multipart/form-data" }
  }
  export namespace Response {
    export enum Status { OK = 200, Created = 201, NoContent = 204 }
    export enum Error { BadRequest = 400, Unauthorized = 401, NotFound = 404 }
  }
}
const reqMethod: Http.Request.Method = Http.Request.Method.GET;
const resStatus: Http.Response.Status = Http.Response.Status.OK;

// 14. Recursive literal type for nested JSON schema
type JSONPrimitive = string | number | boolean | null;
type JSONArray = JSONValue[];
type JSONObject = { [key: string]: JSONValue };
type JSONValue = JSONPrimitive | JSONArray | JSONObject;
const jsonDoc: JSONValue = {
  name: "Alice",
  scores: [95, 87, 92],
  meta: { active: true, role: null },
};

// 15. Const enum nested inside function scope effect
const enum AnimState { Idle = "idle", Running = "running", Jumping = "jumping", Falling = "falling" }
type AnimTransition = {
  idle:    "running";
  running: "jumping" | "idle";
  jumping: "falling";
  falling: "idle";
};
function nextAnimState<S extends AnimState>(state: S): AnimTransition[S] {
  const map: Record<AnimState, AnimState> = {
    [AnimState.Idle]:    AnimState.Running,
    [AnimState.Running]: AnimState.Idle,
    [AnimState.Jumping]: AnimState.Falling,
    [AnimState.Falling]: AnimState.Idle,
  };
  return map[state] as AnimTransition[S];
}

// 16. Nested mapped type over enum
enum Role { Admin = "admin", User = "user", Guest = "guest" }
type RolePermissions = {
  [R in Role]: {
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
  }
};
const rolePermissions: RolePermissions = {
  [Role.Admin]: { canRead: true,  canWrite: true,  canDelete: true  },
  [Role.User]:  { canRead: true,  canWrite: true,  canDelete: false },
  [Role.Guest]: { canRead: true,  canWrite: false, canDelete: false },
};

// 17. Nested literal type routing table
type Routes2 = {
  "/": { params: {}; query: {} };
  "/users": { params: {}; query: { page?: string } };
  "/users/:id": { params: { id: string }; query: {} };
  "/posts/:id/comments": { params: { id: string }; query: { limit?: string } };
};
type RouteKey = keyof Routes2;
type RouteParams<R extends RouteKey> = Routes2[R]["params"];
const params: RouteParams<"/users/:id"> = { id: "42" };

// 18. Enum-keyed nested event system
enum AppEvent { UserLogin = "user:login", UserLogout = "user:logout", DataFetched = "data:fetched" }
type AppEventPayloads = {
  [AppEvent.UserLogin]: { userId: string; timestamp: Date };
  [AppEvent.UserLogout]: { userId: string };
  [AppEvent.DataFetched]: { url: string; data: unknown };
};
function handleAppEvent<E extends AppEvent>(event: E, payload: AppEventPayloads[E]): void {
  console.log(event, payload);
}
handleAppEvent(AppEvent.UserLogin, { userId: "u1", timestamp: new Date() });

// 19. Deep partial with enum-keyed options
enum DisplayMode { List = "list", Grid = "grid", Table = "table" }
type DisplayOptions = {
  mode: DisplayMode;
  columns?: number;
  rowHeight?: number;
  filters: { active: boolean; search: string };
};
type DeepPartialDisplay = {
  mode?: DisplayMode;
  columns?: number;
  rowHeight?: number;
  filters?: Partial<DisplayOptions["filters"]>;
};
const opts: DeepPartialDisplay = { mode: DisplayMode.Grid, filters: { active: true } };

// 20. Nested literal union from template literal composition
type HttpScheme = "http" | "https";
type Domain = "api.example.com" | "cdn.example.com";
type BaseUrl = `${HttpScheme}://${Domain}`;
type FullUrl = `${BaseUrl}/${string}`;
const url: FullUrl = "https://api.example.com/v1/users";

// 21. Enum bits in nested access control
namespace ACL {
  export const enum Resource { File = "file", Directory = "directory" }
  export const enum Action { Read = 1, Write = 2, Delete = 4 }
  export type Policy = { resource: Resource; actions: number };
}
const policy: ACL.Policy = { resource: ACL.Resource.File, actions: ACL.Action.Read | ACL.Action.Write };

// 22. Nested discriminated union with shared fields
enum AlertSeverity { Info = "info", Warn = "warn", Error = "error" }
type BaseAlert = { id: string; timestamp: Date; severity: AlertSeverity };
type Alert2 =
  | (BaseAlert & { severity: AlertSeverity.Info; message: string })
  | (BaseAlert & { severity: AlertSeverity.Warn; message: string; code: number })
  | (BaseAlert & { severity: AlertSeverity.Error; message: string; code: number; stack?: string });
function formatAlert(a: Alert2): string {
  switch (a.severity) {
    case AlertSeverity.Info:  return `[INFO] ${a.message}`;
    case AlertSeverity.Warn:  return `[WARN ${a.code}] ${a.message}`;
    case AlertSeverity.Error: return `[ERR ${a.code}] ${a.message}${a.stack ? "\n" + a.stack : ""}`;
  }
}

// 23. Multi-enum product type
enum Brand { Apple = "apple", Samsung = "samsung" }
enum Category2 { Phone = "phone", Tablet = "tablet" }
type Product = { brand: Brand; category: Category2; model: string };
const product: Product = { brand: Brand.Apple, category: Category2.Phone, model: "iPhone 15" };

// 24. Deeply nested `as const` slice
const palettes = {
  brand: { primary: "#6366f1", secondary: "#8b5cf6" },
  status: { success: "#22c55e", error: "#ef4444", warning: "#f59e0b" },
} as const;
type StatusColor = typeof palettes.status[keyof typeof palettes.status];

// 25. Conditional literal type refinement
type Numeric = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type DigitString = `${Numeric}`;
type TwoDigit = `${Numeric}${Numeric}`;
const twoDigit: TwoDigit = "42";

// 26. Nested namespace with const enums for theming
namespace Design {
  export namespace Color {
    export const enum Brand { Primary = "indigo", Accent = "violet" }
    export const enum Neutral { White = "#fff", Black = "#000", Gray = "#888" }
  }
  export namespace Spacing {
    export const enum Scale { XS = 4, SM = 8, MD = 16, LG = 24, XL = 32 }
  }
}

// 27. Enum-driven recursive validator
type ValidationRule<T> =
  | { kind: "required" }
  | { kind: "min"; value: T extends number ? number : never }
  | { kind: "max"; value: T extends number ? number : never }
  | { kind: "and"; rules: ValidationRule<T>[] }
  | { kind: "or";  rules: ValidationRule<T>[] };
const ageRule: ValidationRule<number> = {
  kind: "and",
  rules: [{ kind: "min", value: 0 }, { kind: "max", value: 150 }],
};

// 28. Enum-keyed factory with nested product types
enum Vehicle { Car = "car", Bike = "bike", Truck = "truck" }
type VehicleSpec = {
  [Vehicle.Car]:   { seats: number; doors: number };
  [Vehicle.Bike]:  { engineCC: number };
  [Vehicle.Truck]: { payload: number; axles: number };
};
function describeVehicle<V extends Vehicle>(type: V, spec: VehicleSpec[V]): string {
  return `${type}: ${JSON.stringify(spec)}`;
}
describeVehicle(Vehicle.Car, { seats: 5, doors: 4 });

// 29. Deep nested literal type inference
const schema = {
  user: { fields: { name: "string", age: "number", active: "boolean" } },
  post: { fields: { title: "string", body: "string", views: "number" } },
} as const;
type EntityName = keyof typeof schema;
type FieldName<E extends EntityName> = keyof typeof schema[E]["fields"];
type FieldType2<E extends EntityName, F extends FieldName<E>> = typeof schema[E]["fields"][F];

// 30. Enum combo-type for permissions matrix
enum Resource2 { User = "user", Post = "post" }
enum Operation2 { Create = "create", Read = "read", Update = "update", Delete = "delete" }
type Permission2 = `${Resource2}:${Operation2}`;
type AdminPermissions = Permission2[];
const adminPerms: AdminPermissions = ["user:create", "user:delete", "post:delete"];

// 31. Nested const enum bitfield system
const enum IO { None = 0, Read = 1, Write = 2, Seek = 4, All = Read | Write | Seek }
type FileHandle = { path: string; flags: IO };
function openFile(path: string, mode: "r" | "w" | "rw"): FileHandle {
  const flags = mode === "r" ? IO.Read : mode === "w" ? IO.Write : IO.Read | IO.Write;
  return { path, flags };
}

// 32. Template literal from enum members
enum EventScope { Global = "global", Local = "local" }
enum EventCategory { UI = "ui", Network = "network" }
type ScopedEvent = `${EventScope}:${EventCategory}:${string}`;
const se: ScopedEvent = "global:ui:click";

// 33. Nested lookup type from enum-keyed map
enum Lang { EN = "en", FR = "fr", DE = "de" }
type Translations = { [L in Lang]: { greeting: string; farewell: string } };
const i18n: Translations = {
  [Lang.EN]: { greeting: "Hello", farewell: "Goodbye" },
  [Lang.FR]: { greeting: "Bonjour", farewell: "Au revoir" },
  [Lang.DE]: { greeting: "Hallo", farewell: "Auf Wiedersehen" },
};
function translate<L extends Lang>(lang: L, key: keyof Translations[L]): string {
  return i18n[lang][key];
}

// 34. Nested union with inferred literal
type Result2<T, E extends string> =
  | { ok: true; value: T }
  | { ok: false; error: E };
type FetchResult = Result2<string, "network_error" | "timeout" | "parse_error">;
function handleResult(r: FetchResult): string {
  if (r.ok) return r.value;
  switch (r.error) {
    case "network_error": return "Network failed";
    case "timeout":       return "Request timed out";
    case "parse_error":   return "Failed to parse";
  }
}

// 35. Multi-level enum composition
namespace App {
  export enum Module { Auth = "auth", Dashboard = "dashboard", Settings = "settings" }
  export enum AuthSubModule { Login = "login", Register = "register", ForgotPassword = "forgot" }
}
type AppRoute2 = `/${App.Module}` | `/${App.Module.Auth}/${App.AuthSubModule}`;
const route2: AppRoute2 = "/auth/login";

// 36. Enum-driven schema validation
enum FieldKind { String = "string", Number = "number", Boolean = "boolean", Array = "array" }
type FieldDef =
  | { kind: FieldKind.String; minLength?: number; maxLength?: number }
  | { kind: FieldKind.Number; min?: number; max?: number }
  | { kind: FieldKind.Boolean }
  | { kind: FieldKind.Array; itemKind: FieldKind; maxItems?: number };
type Schema2 = Record<string, FieldDef>;
const userSchema: Schema2 = {
  name:    { kind: FieldKind.String, minLength: 1, maxLength: 100 },
  age:     { kind: FieldKind.Number, min: 0, max: 150 },
  active:  { kind: FieldKind.Boolean },
  hobbies: { kind: FieldKind.Array, itemKind: FieldKind.String },
};

// 37. Deeply nested template literal
type Env2 = "dev" | "staging" | "prod";
type Service = "api" | "auth" | "cdn";
type Region = "us-east" | "eu-west" | "ap-south";
type ServiceEndpoint = `${Env2}.${Region}.${Service}.internal`;
const ep2: ServiceEndpoint = "prod.us-east.api.internal";

// 38. Enum state machine with nested context
enum OrderState { Draft = "draft", Submitted = "submitted", Fulfilled = "fulfilled", Cancelled = "cancelled" }
type OrderContext = {
  [OrderState.Draft]:      { items: string[] };
  [OrderState.Submitted]:  { items: string[]; submittedAt: Date };
  [OrderState.Fulfilled]:  { items: string[]; submittedAt: Date; fulfilledAt: Date };
  [OrderState.Cancelled]:  { reason: string };
};
type Order2<S extends OrderState> = { state: S; context: OrderContext[S] };
const draft: Order2<OrderState.Draft> = { state: OrderState.Draft, context: { items: ["item1"] } };

// 39. Literal type matrix
type Row = 0 | 1 | 2;
type Col = 0 | 1 | 2;
type Cell = [Row, Col];
type Board = Cell[][];
const cell: Cell = [1, 2];

// 40. Nested enum + const for theming
enum ColorScheme { Light = "light", Dark = "dark" }
enum ComponentName { Button2 = "button", Card = "card", Input2 = "input" }
const theme2 = {
  [ColorScheme.Light]: {
    [ComponentName.Button2]: { bg: "#6366f1", text: "#fff" },
    [ComponentName.Card]:    { bg: "#fff",    text: "#111" },
    [ComponentName.Input2]:  { bg: "#f9fafb", text: "#111" },
  },
  [ColorScheme.Dark]: {
    [ComponentName.Button2]: { bg: "#4f46e5", text: "#fff" },
    [ComponentName.Card]:    { bg: "#1e1e2e", text: "#cdd6f4" },
    [ComponentName.Input2]:  { bg: "#313244", text: "#cdd6f4" },
  },
} as const;
type ThemeToken = typeof theme2[ColorScheme.Light][ComponentName.Button2];

// 41. Recursive enum-tagged union
enum ListKind { Nil = "nil", Cons = "cons" }
type List<T> =
  | { kind: ListKind.Nil }
  | { kind: ListKind.Cons; head: T; tail: List<T> };
function listLength<T>(list: List<T>): number {
  if (list.kind === ListKind.Nil) return 0;
  return 1 + listLength(list.tail);
}
const myList: List<number> = {
  kind: ListKind.Cons, head: 1,
  tail: { kind: ListKind.Cons, head: 2, tail: { kind: ListKind.Nil } },
};
listLength(myList); // 2

// 42. Enum flags union narrowing
const enum Feature { A = 1, B = 2, C = 4 }
type HasFeature<F extends Feature> = { flags: number };
function requiresFeature<F extends Feature>(obj: HasFeature<F>, feature: F): boolean {
  return (obj.flags & feature) !== 0;
}

// 43. Nested as const creating complex union
const api2 = {
  v1: { users: { list: "GET /v1/users", detail: "GET /v1/users/:id" } },
  v2: { users: { list: "GET /v2/users", detail: "GET /v2/users/:id", create: "POST /v2/users" } },
} as const;
type ApiV1Endpoints = typeof api2.v1.users[keyof typeof api2.v1.users];
type ApiV2Endpoints = typeof api2.v2.users[keyof typeof api2.v2.users];

// 44. Nested enum-based graph node types
enum NodeType { Input = "input", Hidden = "hidden", Output = "output" }
enum EdgeType { Forward = "forward", Backward = "backward" }
type GraphNode = { type: NodeType; id: string; value: number };
type GraphEdge = { type: EdgeType; from: string; to: string; weight: number };
type NeuralNet = { nodes: GraphNode[]; edges: GraphEdge[] };

// 45. Literal union for key paths
type DotPath<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends object
    ? DotPath<T[K], `${Prefix}${K}.`> | `${Prefix}${K}`
    : `${Prefix}${K}`;
}[keyof T & string];
type Config2 = { db: { host: string; port: number }; app: { debug: boolean } };
type ConfigPath = DotPath<Config2>; // "db" | "db.host" | "db.port" | "app" | "app.debug"

// 46. Enum for typed sort keys
enum SortDirection2 { ASC = "asc", DESC = "desc" }
type SortSpec<T> = { field: keyof T; direction: SortDirection2 };
type User3 = { name: string; age: number; createdAt: Date };
const sort: SortSpec<User3> = { field: "age", direction: SortDirection2.DESC };

// 47. Const enum for flags with type-level checks
const enum Capability { Fly = "fly", Swim = "swim", Run = "run" }
type Animal = { name: string; capabilities: Capability[] };
function hasCapability(animal: Animal, cap: Capability): boolean {
  return animal.capabilities.includes(cap);
}
const eagle: Animal = { name: "Eagle", capabilities: [Capability.Fly] };

// 48. Template literal + enum composition for event naming
enum Domain2 { User2 = "user", Order3 = "order", Payment = "payment" }
enum EventType2 { Created = "created", Updated = "updated", Deleted = "deleted" }
type DomainEvent = `${Domain2}.${EventType2}`;
const evt: DomainEvent = "user.created";

// 49. Nested literal type for structured CSS
type CSSBorderStyle = "solid" | "dashed" | "dotted" | "none";
type CSSBorderWidth = "1px" | "2px" | "4px";
type CSSBorderColor = "transparent" | "#000" | "#fff" | string;
type CSSBorder = `${CSSBorderWidth} ${CSSBorderStyle} ${CSSBorderColor}`;
const border: CSSBorder = "2px solid #000";

// 50. Exhaustive enum handler with nested switch
enum HttpMethod3 { GET = "GET", POST = "POST", PUT = "PUT", PATCH = "PATCH", DELETE = "DELETE" }
enum ResourceType { User4 = "user", Post2 = "post" }
function handleRequest(method: HttpMethod3, resource: ResourceType): string {
  switch (resource) {
    case ResourceType.User4:
      switch (method) {
        case HttpMethod3.GET:    return "List users";
        case HttpMethod3.POST:   return "Create user";
        case HttpMethod3.PUT:    return "Replace user";
        case HttpMethod3.PATCH:  return "Update user";
        case HttpMethod3.DELETE: return "Delete user";
      }
    case ResourceType.Post2:
      switch (method) {
        case HttpMethod3.GET:    return "List posts";
        case HttpMethod3.POST:   return "Create post";
        case HttpMethod3.PUT:    return "Replace post";
        case HttpMethod3.PATCH:  return "Update post";
        case HttpMethod3.DELETE: return "Delete post";
      }
  }
}
