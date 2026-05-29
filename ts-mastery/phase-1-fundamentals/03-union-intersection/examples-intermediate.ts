export {};

// ============================================================
// INTERMEDIATE EXAMPLES — Union & Intersection Types (50 Examples)
// ============================================================

// 1. Discriminated union with shared fields
type ApiResponse<T> =
  | { status: "success"; data: T; code: 200 }
  | { status: "error"; message: string; code: 400 | 404 | 500 };
const ok: ApiResponse<string[]> = { status: "success", data: ["a"], code: 200 };
const err: ApiResponse<string[]> = { status: "error", message: "Not found", code: 404 };

// 2. Union with shared property narrowing
type Admin = { role: "admin"; permissions: string[]; name: string };
type Guest = { role: "guest"; sessionId: string; name: string };
type UserU = Admin | Guest;
function greetUser(u: UserU): string {
  return `Hello ${u.name} (${u.role})`; // name accessible on both
}

// 3. Intersection extends behavior
type HasLog = { log(msg: string): void };
type HasMetrics = { record(metric: string, value: number): void };
type Instrumented = HasLog & HasMetrics;
const inst: Instrumented = {
  log: (m) => console.log(m),
  record: (k, v) => console.log(k, v),
};

// 4. Union narrowed by truthiness
function displayCount(count: number | false): string {
  if (!count) return "None";
  return `Count: ${count}`;
}

// 5. Intersection spreads via object spread
const base = { id: 1, name: "base" };
const extended = { ...base, role: "admin", active: true };
type ExtendedType = typeof base & { role: string; active: boolean };

// 6. Union of tuple types
type Coord2D = [number, number];
type Coord3D = [number, number, number];
type AnyCoord = Coord2D | Coord3D;
function toStr(c: AnyCoord): string {
  return c.join(",");
}

// 7. Intersection adds index signature
type Dynamic = { [key: string]: unknown };
type Fixed = { name: string; age: number };
type FlexFixed = Fixed & Dynamic;
const ff: FlexFixed = { name: "Alice", age: 30, extra: true };

// 8. Exclude utility to remove union member
type AllRoles = "admin" | "editor" | "viewer" | "banned";
type ActiveRoles = Exclude<AllRoles, "banned">;
const ar: ActiveRoles = "editor";

// 9. Extract utility to pick union members
type MixedTypes = string | number | boolean | null;
type JustStrOrNum = Extract<MixedTypes, string | number>;
const sn: JustStrOrNum = 42;

// 10. NonNullable removes null and undefined
type Dirty = string | number | null | undefined;
type Clean = NonNullable<Dirty>;
const clean: Clean = "hello";

// 11. Union used in generic constraint
function maxOf<T extends string | number>(a: T, b: T): T {
  return a > b ? a : b;
}
const biggest = maxOf(10, 20);
const longest = maxOf("abc", "de");

// 12. Intersection for mixin application
function applyMixins<T extends object, U extends object>(a: T, b: U): T & U {
  return { ...a, ...b } as T & U;
}
const mixed = applyMixins({ name: "Alice" }, { age: 30 });

// 13. Discriminated union exhaustiveness with never
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; side: number }
  | { kind: "triangle"; base: number; height: number };
function area(s: Shape): number {
  switch (s.kind) {
    case "circle":   return Math.PI * s.radius ** 2;
    case "square":   return s.side ** 2;
    case "triangle": return 0.5 * s.base * s.height;
    default: const _: never = s; return _;
  }
}

// 14. Union mapped to object shape
type EventMap = {
  click: { x: number; y: number };
  keydown: { key: string };
  resize: { width: number; height: number };
};
type EventName = keyof EventMap;
function handle<E extends EventName>(event: E, data: EventMap[E]): void {
  console.log(event, data);
}

// 15. Intersection merging generics
type WithId<T> = T & { id: number };
type UserRecord = WithId<{ name: string; email: string }>;
const ur: UserRecord = { id: 1, name: "Alice", email: "a@b.com" };

// 16. Union guard: custom type predicate
type Fish = { swim(): void };
type Bird = { fly(): void };
function isFish(pet: Fish | Bird): pet is Fish {
  return "swim" in pet;
}
const myPet: Fish | Bird = { swim: () => {} };
if (isFish(myPet)) myPet.swim();

// 17. Intersection for decorator result
type Decorated<T> = T & { __decorated: true };
function decorate<T extends object>(obj: T): Decorated<T> {
  return { ...obj, __decorated: true as const };
}
const decorated = decorate({ name: "Alice" });

// 18. Union of generic types
type StringBox = { type: "string"; value: string };
type NumberBox = { type: "number"; value: number };
type AnyBox = StringBox | NumberBox;
function unbox(box: AnyBox): string | number {
  return box.value;
}

// 19. Intersection for middleware context
type BaseCtx = { req: { method: string; url: string } };
type AuthCtx = { user: { id: number; role: string } };
type FullCtx = BaseCtx & AuthCtx;
function handleRequest(ctx: FullCtx): void {
  console.log(ctx.req.url, ctx.user.role);
}

// 20. Union narrowing with Array.isArray
function flatten(val: string | string[]): string[] {
  if (Array.isArray(val)) return val;
  return [val];
}

// 21. Intersection for composable validation
type MinLength = { minLength: number };
type MaxLength = { maxLength: number };
type Pattern = { pattern: RegExp };
type StringRule = MinLength & MaxLength & Pattern;
const rule: StringRule = { minLength: 3, maxLength: 50, pattern: /^[a-z]+$/ };

// 22. Union of readonly arrays
type ReadonlyStrArr = readonly string[];
type ReadonlyNumArr = readonly number[];
type ReadonlyAny = ReadonlyStrArr | ReadonlyNumArr;

// 23. Discriminated union with optional payload
type Cmd =
  | { cmd: "start"; config?: { retries: number } }
  | { cmd: "stop"; reason: string }
  | { cmd: "restart" };
function dispatch(c: Cmd): void {
  if (c.cmd === "start") console.log("start", c.config?.retries ?? 3);
  else if (c.cmd === "stop") console.log("stop:", c.reason);
  else console.log("restart");
}

// 24. Intersection for builder state tracking
type Empty = {};
type WithName = { name: string };
type WithAge = { age: number };
type Complete = WithName & WithAge;

// 25. Union for multi-source input
type FileInput = { kind: "file"; path: string };
type UrlInput = { kind: "url"; href: string };
type TextInput = { kind: "text"; content: string };
type DataInput = FileInput | UrlInput | TextInput;
function getContent(input: DataInput): string {
  switch (input.kind) {
    case "file": return `file:${input.path}`;
    case "url":  return `url:${input.href}`;
    case "text": return input.content;
  }
}

// 26. Intersection forces all properties present
type MustHaveAll = { a: string } & { b: number } & { c: boolean };
const mha: MustHaveAll = { a: "x", b: 1, c: true };

// 27. Union of function signatures
type Fn1 = (x: number) => string;
type Fn2 = (x: string) => number;
type EitherFn = Fn1 | Fn2;

// 28. Intersection of function types (creates overload-like behavior)
type OverloadedFn = ((x: number) => string) & ((x: string) => number);

// 29. Union used in template literal type
type Dir = "top" | "bottom" | "left" | "right";
type BorderProp = `border-${Dir}`;
const bp: BorderProp = "border-top";

// 30. Intersection used in template literal type
type Base2 = { base: string };
type Ext = { extension: string };
type Filename = Base2 & Ext;
function toFilename(f: Filename): string {
  return `${f.base}.${f.extension}`;
}

// 31. Union of index signatures
type StrDict = { [k: string]: string };
type NumDict = { [k: string]: number };
// Note: union of index sigs is tricky — usually use Record<string, string | number>
type MixedDict = Record<string, string | number>;
const md: MixedDict = { a: "x", b: 2 };

// 32. Intersection adds metadata to any type
type WithMeta<T> = T & { _meta: { version: number; source: string } };
const withMeta: WithMeta<{ name: string }> = {
  name: "Alice",
  _meta: { version: 1, source: "api" },
};

// 33. Union narrowed by property existence
type HasEmail = { email: string; name: string };
type HasPhone = { phone: string; name: string };
type Contact = HasEmail | HasPhone;
function contactInfo(c: Contact): string {
  if ("email" in c) return c.email;
  return c.phone;
}

// 34. Exclude to build complement type
type Primary = "red" | "blue" | "yellow";
type AllColors = "red" | "blue" | "yellow" | "green" | "purple";
type Secondary = Exclude<AllColors, Primary>;
const sec: Secondary = "green";

// 35. Union in conditional type
type IsArray<T> = T extends any[] ? true : false;
type CheckStr = IsArray<string>;   // false
type CheckArr = IsArray<number[]>; // true

// 36. Intersection with generic
function merge<T, U>(a: T, b: U): T & U {
  return { ...a as any, ...b as any };
}
const merged = merge({ x: 1 }, { y: 2 });
merged.x; merged.y;

// 37. Union default narrowing — same property different type
type A2 = { mode: "a"; value: string };
type B2 = { mode: "b"; value: number };
type AB2 = A2 | B2;
function processAB(item: AB2): string {
  if (item.mode === "a") return item.value.toUpperCase();
  return item.value.toFixed(2);
}

// 38. Intersection with Omit and Pick
type Extended2 = Pick<{ a: string; b: number; c: boolean }, "a" | "b"> &
  Omit<{ b: number; d: string }, "b">;
const ex: Extended2 = { a: "x", b: 1, d: "y" };

// 39. Union of mapped types
type StringRecord = Record<string, string>;
type NumberRecord = Record<string, number>;
type FlexRecord = StringRecord | NumberRecord;

// 40. Intersection with overriding (last wins for duplicate keys in practice)
type BaseA = { x: string; y: string };
type Override = { y: number }; // overrides y
type Result3 = Omit<BaseA, "y"> & Override;
const r: Result3 = { x: "hello", y: 42 };

// 41. Distributive union in generic
type Wrap<T> = T extends any ? { value: T } : never;
type WrappedUnion = Wrap<string | number>;
// { value: string } | { value: number }
const w: WrappedUnion = { value: "hi" };

// 42. Union of class instances with shared interface
interface Runnable { run(): void }
class TaskA implements Runnable { run() { console.log("A"); } }
class TaskB implements Runnable { run() { console.log("B"); } }
const tasks: Runnable[] = [new TaskA(), new TaskB()];
tasks.forEach((t) => t.run());

// 43. Intersection for event handler with metadata
type ListenerFn<T> = ((event: T) => void) & { once?: boolean; priority?: number };
const clickListener: ListenerFn<{ x: number; y: number }> = (e) => console.log(e);
clickListener.once = true;

// 44. Union for parser result
type ParseOk = { ok: true; value: number };
type ParseFail = { ok: false; input: string; reason: string };
type ParseResult = ParseOk | ParseFail;
function parseNumber(s: string): ParseResult {
  const n = Number(s);
  if (isNaN(n)) return { ok: false, input: s, reason: "NaN" };
  return { ok: true, value: n };
}

// 45. Intersection with Record
type WithDefaults = Record<string, unknown> & { timeout: number; retries: number };
const opts: WithDefaults = { timeout: 5000, retries: 3, custom: true };

// 46. Union for config variants
type DevConfig = { env: "dev"; debug: true; verbose?: boolean };
type ProdConfig = { env: "prod"; debug: false; logLevel: "warn" | "error" };
type AppConfig = DevConfig | ProdConfig;
function configure(cfg: AppConfig): void {
  if (cfg.env === "dev") console.log("debug mode", cfg.debug);
  else console.log("log level", cfg.logLevel);
}

// 47. Intersection for plugin composition
type CorePlugin = { name: string; version: string };
type HttpPlugin = { baseUrl: string; timeout: number };
type FullPlugin = CorePlugin & HttpPlugin;
const plug: FullPlugin = { name: "client", version: "1.0", baseUrl: "http://api", timeout: 3000 };

// 48. Union narrowed to specific literal with assertion
type Env = "dev" | "staging" | "prod";
function assertEnv(val: string): asserts val is Env {
  if (!["dev", "staging", "prod"].includes(val)) throw new Error(`Invalid env: ${val}`);
}
const raw: string = "prod";
assertEnv(raw);
const env: Env = raw;

// 49. Union with mapped value access
type EventPayloads = {
  click: { x: number; y: number };
  submit: { formId: string; data: Record<string, string> };
};
type ClickPayload = EventPayloads["click"];
const cp: ClickPayload = { x: 10, y: 20 };

// 50. Intersection for required + optional combo
type Required2 = { id: number; name: string };
type Optional2 = { description?: string; tags?: string[] };
type BlogPost = Required2 & Optional2;
const bp: BlogPost = { id: 1, name: "TypeScript Tips" };
