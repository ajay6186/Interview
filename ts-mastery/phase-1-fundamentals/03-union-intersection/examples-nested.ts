export {};

// ============================================================
// NESTED EXAMPLES — Union & Intersection Types (50 Examples)
// ============================================================

// 1. Nested discriminated union inside object
type Payment =
  | { method: "card"; card: { number: string; cvv: string } }
  | { method: "paypal"; email: string }
  | { method: "crypto"; wallet: string; coin: "BTC" | "ETH" };
const pay: Payment = { method: "card", card: { number: "4111", cvv: "123" } };

// 2. Array of discriminated union
type Event =
  | { type: "click"; x: number; y: number }
  | { type: "keydown"; key: string }
  | { type: "scroll"; delta: number };
const events: Event[] = [
  { type: "click", x: 100, y: 200 },
  { type: "keydown", key: "Enter" },
];

// 3. Intersection with nested objects
type Auditable = { audit: { by: string; at: string } };
type Identifiable = { id: number };
type AuditedEntity<T> = T & Identifiable & Auditable;
type AuditedUser = AuditedEntity<{ name: string; email: string }>;
const au: AuditedUser = {
  id: 1,
  name: "Alice",
  email: "a@b.com",
  audit: { by: "system", at: "2024-01-01" },
};

// 4. Union of arrays of objects
type StringArray = { kind: "strings"; values: string[] };
type NumberArray = { kind: "numbers"; values: number[] };
type TypedArray = StringArray | NumberArray;
const ta: TypedArray = { kind: "strings", values: ["a", "b"] };

// 5. Nested union in interface property
interface Form {
  fields: Array<
    | { type: "text"; name: string; value: string }
    | { type: "number"; name: string; value: number }
    | { type: "checkbox"; name: string; checked: boolean }
  >;
}
const form: Form = {
  fields: [
    { type: "text", name: "username", value: "alice" },
    { type: "checkbox", name: "agree", checked: true },
  ],
};

// 6. Intersection with nested intersection
type HasName = { name: string };
type HasAge = { age: number };
type HasAddress = { address: { city: string; zip: string } };
type FullPerson = HasName & HasAge & HasAddress;
const fp: FullPerson = {
  name: "Bob",
  age: 35,
  address: { city: "NYC", zip: "10001" },
};

// 7. Union in nested object property
type Config = {
  server: { host: string; port: number };
  auth: { provider: "local" | "oauth" | "saml"; secret: string };
};
const cfg: Config = {
  server: { host: "localhost", port: 3000 },
  auth: { provider: "oauth", secret: "xxx" },
};

// 8. Recursive discriminated union (tree)
type Expr =
  | { tag: "num"; value: number }
  | { tag: "add"; left: Expr; right: Expr }
  | { tag: "mul"; left: Expr; right: Expr };
const ast: Expr = {
  tag: "add",
  left: { tag: "num", value: 1 },
  right: { tag: "mul", left: { tag: "num", value: 2 }, right: { tag: "num", value: 3 } },
};
function evalExpr(e: Expr): number {
  if (e.tag === "num") return e.value;
  if (e.tag === "add") return evalExpr(e.left) + evalExpr(e.right);
  return evalExpr(e.left) * evalExpr(e.right);
}

// 9. Nested union inside tuple
type Tagged<T> = [tag: string, value: T | null];
const t1: Tagged<number> = ["score", 95];
const t2: Tagged<number> = ["score", null];

// 10. Intersection with multiple nested objects
type DbConfig = { host: string; port: number; database: string };
type CacheConfig = { host: string; port: number; ttl: number };
type FullServiceConfig = { db: DbConfig; cache: CacheConfig; name: string };
const svc: FullServiceConfig = {
  name: "api",
  db: { host: "db-host", port: 5432, database: "mydb" },
  cache: { host: "redis-host", port: 6379, ttl: 300 },
};

// 11. Union of nested object unions
type MenuLeaf = { kind: "leaf"; label: string; url: string };
type MenuGroup = { kind: "group"; label: string; children: MenuItem[] };
type MenuItem = MenuLeaf | MenuGroup;
const menu: MenuItem[] = [
  { kind: "leaf", label: "Home", url: "/" },
  {
    kind: "group",
    label: "Products",
    children: [
      { kind: "leaf", label: "Widget", url: "/widget" },
      { kind: "leaf", label: "Gadget", url: "/gadget" },
    ],
  },
];

// 12. Intersection inside array elements
type Role = { role: "admin" | "user" };
type WithTs = { createdAt: string };
type RoleEntry = Role & WithTs & { userId: number };
const roles: RoleEntry[] = [
  { role: "admin", createdAt: "2024-01-01", userId: 1 },
  { role: "user", createdAt: "2024-02-01", userId: 2 },
];

// 13. Nested discriminated union for API responses
type UserResp =
  | { status: 200; body: { id: number; name: string; email: string } }
  | { status: 404; body: { message: string } }
  | { status: 500; body: { error: string; stack?: string } };
function handleUserResp(r: UserResp): string {
  switch (r.status) {
    case 200:  return r.body.name;
    case 404:  return r.body.message;
    case 500:  return r.body.error;
  }
}

// 14. Union inside Record values
type FieldDef = Record<string, { type: "string" | "number" | "boolean"; required: boolean }>;
const schema: FieldDef = {
  name:   { type: "string",  required: true  },
  age:    { type: "number",  required: false },
  active: { type: "boolean", required: true  },
};

// 15. Intersection of generics with nested properties
type WithPagination<T> = T & {
  meta: { page: number; perPage: number; total: number };
};
type UserListResponse = WithPagination<{ users: { id: number; name: string }[] }>;
const ul: UserListResponse = {
  users: [{ id: 1, name: "Alice" }],
  meta: { page: 1, perPage: 10, total: 1 },
};

// 16. Nested union optional chain
type Node =
  | { kind: "branch"; left?: Node; right?: Node; value: number }
  | { kind: "leaf"; value: number };
function sumTree(n: Node): number {
  if (n.kind === "leaf") return n.value;
  return n.value + sumTree(n.left ?? { kind: "leaf", value: 0 }) +
         sumTree(n.right ?? { kind: "leaf", value: 0 });
}

// 17. Intersection for middleware chain context accumulation
type Step1Ctx = { requestId: string };
type Step2Ctx = Step1Ctx & { user: { id: number } };
type Step3Ctx = Step2Ctx & { permissions: string[] };
function finalHandler(ctx: Step3Ctx): void {
  console.log(ctx.requestId, ctx.user.id, ctx.permissions);
}

// 18. Union of intersections
type AdminPermissions = { read: true; write: true; delete: true };
type UserPermissions = { read: true; write: false; delete: false };
type EditorPermissions = { read: true; write: true; delete: false };
type Permission = AdminPermissions | UserPermissions | EditorPermissions;

// 19. Nested union in Promise return
async function fetchData(kind: "user" | "post"): Promise<
  | { kind: "user"; id: number; name: string }
  | { kind: "post"; id: number; title: string }
> {
  if (kind === "user") return { kind: "user", id: 1, name: "Alice" };
  return { kind: "post", id: 1, title: "Hello World" };
}

// 20. Intersection with mapped computed property
type Flags<T extends Record<string, unknown>> = {
  [K in keyof T as `is${Capitalize<string & K>}`]: boolean;
};
type UserFlags = Flags<{ admin: unknown; active: unknown }>;
// { isAdmin: boolean; isActive: boolean }
const uf: UserFlags = { isAdmin: true, isActive: true };

// 21. Union narrows inside nested condition
type Payload =
  | { event: "join"; room: string; user: string }
  | { event: "leave"; room: string }
  | { event: "message"; room: string; text: string; user: string };
function handleWs(p: Payload): void {
  if (p.event === "message") console.log(p.user, ":", p.text);
  else if (p.event === "join") console.log(p.user, "joined", p.room);
  else console.log("left", p.room);
}

// 22. Nested intersection of optionals
type PartialA = { x?: number; y?: number };
type PartialB = { z?: number; w?: number };
type AllOptional = PartialA & PartialB;
const ao: AllOptional = { x: 1, z: 3 };

// 23. Union of readonly tuples
type RGB = readonly [number, number, number];
type RGBA = readonly [number, number, number, number];
type Color2 = RGB | RGBA;
const red: Color2 = [255, 0, 0];
const transparent: Color2 = [0, 0, 0, 0];

// 24. Nested intersection mapped type
type Nullable<T> = { [K in keyof T]: T[K] | null };
type UserShape = { name: string; age: number };
type NullableUser = Nullable<UserShape>;
const nu: NullableUser = { name: null, age: 30 };

// 25. Deeply nested discriminated union
type UIBlock =
  | { block: "text"; content: string; style?: { bold?: boolean; italic?: boolean } }
  | { block: "image"; src: string; alt: string; size: { w: number; h: number } }
  | {
      block: "card";
      title: string;
      children: UIBlock[];
    };
const card: UIBlock = {
  block: "card",
  title: "Info",
  children: [
    { block: "text", content: "Hello" },
    { block: "image", src: "/img.png", alt: "img", size: { w: 100, h: 100 } },
  ],
};

// 26. Intersection for composing service traits
type Healthcheck = { healthcheck(): Promise<boolean> };
type Shutdown = { shutdown(): Promise<void> };
type Metrics = { getMetrics(): Record<string, number> };
type ManagedService = Healthcheck & Shutdown & Metrics & { name: string };

// 27. Union of generic wrappers
type Either<L, R> = { tag: "left"; value: L } | { tag: "right"; value: R };
function mapRight<L, R, R2>(e: Either<L, R>, fn: (r: R) => R2): Either<L, R2> {
  if (e.tag === "right") return { tag: "right", value: fn(e.value) };
  return e;
}

// 28. Nested union result chain
type Step<T> =
  | { ok: true; value: T; next?: Step<T> }
  | { ok: false; error: string };
const chain: Step<number> = {
  ok: true,
  value: 1,
  next: { ok: true, value: 2, next: { ok: false, error: "end" } },
};

// 29. Intersection with Record for typed config layers
type DefaultCfg = { timeout: number; retries: number };
type UserCfg = Partial<DefaultCfg> & Record<string, unknown>;
type ResolvedCfg = DefaultCfg & UserCfg;

// 30. Nested discriminated union — state machine states
type MachineState =
  | { state: "idle" }
  | { state: "loading"; requestId: string }
  | { state: "success"; data: { items: string[]; total: number } }
  | { state: "error"; error: { code: number; message: string } };
const loading: MachineState = { state: "loading", requestId: "req-1" };

// 31. Union with generic constraint intersection
type Serializable = { toJSON(): string };
type HasId2 = { id: number };
function serialize<T extends Serializable & HasId2>(item: T): string {
  return `${item.id}:${item.toJSON()}`;
}

// 32. Intersection for combining validators
type RangeCheck = { min: number; max: number };
type FormatCheck = { pattern: RegExp };
type NumericRule = RangeCheck & FormatCheck & { required: boolean };

// 33. Union and intersection in return type
function split(items: string | string[]): [string[], string] {
  const arr = Array.isArray(items) ? items : [items];
  return [arr, arr.join(",")];
}

// 34. Nested union for form validation errors
type FieldError =
  | { kind: "required"; field: string }
  | { kind: "minLength"; field: string; min: number; actual: number }
  | { kind: "pattern"; field: string; pattern: string };
type FormErrors = { errors: FieldError[]; valid: boolean };

// 35. Intersection for plugin with required + optional config
type PluginBase = { name: string; version: string };
type PluginOptions<T = {}> = PluginBase & T;
type HttpPluginOptions = PluginOptions<{ baseUrl: string; timeout?: number }>;
const hp: HttpPluginOptions = { name: "http", version: "1.0", baseUrl: "http://api" };

// 36. Union of nested generics
type Container<T> =
  | { kind: "single"; value: T }
  | { kind: "collection"; values: T[] }
  | { kind: "empty" };
const single: Container<number> = { kind: "single", value: 42 };
const coll: Container<number> = { kind: "collection", values: [1, 2, 3] };

// 37. Intersection merges index signatures
type StrIndex = { [k: string]: string };
type NumIndex = { [k: string]: number };
// Can't directly intersect conflicting index sigs; use a combined value type
type FlexIndex = { [k: string]: string | number };

// 38. Nested union for typed event system
type AppEvent<T extends Record<string, unknown>> = {
  [K in keyof T]: { type: K; payload: T[K] };
}[keyof T];
type MyEvents = AppEvent<{
  login: { userId: number };
  logout: { reason: string };
}>;
const loginEvt: MyEvents = { type: "login", payload: { userId: 1 } };

// 39. Intersection with Partial makes all optional then required
type AlwaysPresent = { id: number };
type SometimesPresent = Partial<{ name: string; role: string }>;
type FlexUser = AlwaysPresent & SometimesPresent;
const fu: FlexUser = { id: 1 };

// 40. Nested recursive union for JSON-like schema
type SchemaType =
  | { type: "string"; minLength?: number; maxLength?: number }
  | { type: "number"; min?: number; max?: number }
  | { type: "boolean" }
  | { type: "array"; items: SchemaType }
  | { type: "object"; properties: Record<string, SchemaType>; required?: string[] };
const userSchema: SchemaType = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1 },
    age: { type: "number", min: 0 },
    tags: { type: "array", items: { type: "string" } },
  },
  required: ["name"],
};

// 41. Union for multi-step wizard state
type WizardStep =
  | { step: 1; data: { name: string } }
  | { step: 2; data: { name: string; email: string } }
  | { step: 3; data: { name: string; email: string; plan: "free" | "pro" } };
function wizardLabel(w: WizardStep): string {
  if (w.step === 3) return `${w.data.name} → ${w.data.plan}`;
  if (w.step === 2) return `${w.data.name} → ${w.data.email}`;
  return w.data.name;
}

// 42. Intersection for CQRS command/query shapes
type Command2 = { type: "command"; mutates: true };
type Query2 = { type: "query"; mutates: false };
type Handler2<T extends Command2 | Query2> = {
  handle(input: T): T extends Command2 ? void : unknown;
};

// 43. Union for type-safe CSS-in-JS
type CssValue = string | number;
type StyleRule = Partial<Record<"color" | "background" | "fontSize" | "margin" | "padding", CssValue>>;
const style: StyleRule = { color: "red", fontSize: 14 };

// 44. Nested intersection for ORM model
type BaseModel = { id: number; createdAt: Date; updatedAt: Date };
type SoftDelete = { deletedAt?: Date; isDeleted: boolean };
type FullModel<T> = BaseModel & SoftDelete & T;
type BlogPostModel = FullModel<{ title: string; body: string; authorId: number }>;

// 45. Union of constructor signatures
type Constructors =
  | (new (name: string) => { name: string })
  | (new (name: string, age: number) => { name: string; age: number });

// 46. Nested union for validation result
type ValidationResult =
  | { valid: true; value: unknown }
  | { valid: false; errors: Array<{ field: string; message: string }> };
function validate(data: Record<string, unknown>): ValidationResult {
  if (!data.name) return { valid: false, errors: [{ field: "name", message: "required" }] };
  return { valid: true, value: data };
}

// 47. Intersection for read and write sides
type ReadModel = { id: number; name: string; computedField: string };
type WriteModel = Omit<ReadModel, "id" | "computedField">;
type PatchModel = Partial<WriteModel>;
const patch: PatchModel = { name: "Updated" };

// 48. Union of branded types
declare const _brand: unique symbol;
type Brand<T, B> = T & { [_brand]: B };
type Meters = Brand<number, "Meters">;
type Kilograms = Brand<number, "Kilograms">;
type Measurement = Meters | Kilograms;
const dist = 5 as Meters;
const weight = 70 as Kilograms;

// 49. Nested intersection generic accumulator
type Accumulate<T extends unknown[]> = T extends [infer Head, ...infer Rest]
  ? Head & Accumulate<Rest>
  : unknown;
type AllOf = Accumulate<[{ a: string }, { b: number }, { c: boolean }]>;
const allof: AllOf = { a: "x", b: 1, c: true };

// 50. Union for tagged template literal types
type LiteralId<T extends string> = `${T}_${number}`;
type UserId2 = LiteralId<"user">;
type PostId2 = LiteralId<"post">;
type AnyId = UserId2 | PostId2;
const uid: AnyId = "user_42";
const pid: AnyId = "post_7";
