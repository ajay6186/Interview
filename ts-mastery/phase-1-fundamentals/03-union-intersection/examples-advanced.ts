export {};

// ============================================================
// ADVANCED EXAMPLES — Union & Intersection Types (50 Examples)
// ============================================================

// 1. Distributive conditional over union
type ToArray<T> = T extends any ? T[] : never;
type StrOrNumArrays = ToArray<string | number>; // string[] | number[]
const sa: StrOrNumArrays = ["a", "b"];

// 2. Non-distributive conditional (wrap in tuple to prevent distribution)
type NonDist<T> = [T] extends [any] ? T[] : never;
type UnionArray = NonDist<string | number>; // (string | number)[]
const ua: UnionArray = ["a", 1];

// 3. Union to intersection via contravariance
type UnionToIntersection<U> =
  (U extends any ? (x: U) => void : never) extends (x: infer I) => void ? I : never;
type U2I = UnionToIntersection<{ a: string } | { b: number }>;
const u2i: U2I = { a: "x", b: 1 };

// 4. Last element of union (exploits UnionToIntersection)
type UnionToFn<U> = U extends any ? (x: U) => void : never;
type LastOf<U> =
  UnionToIntersection<UnionToFn<U>> extends (x: infer L) => void ? L : never;
type LastColor = LastOf<"red" | "green" | "blue">; // "blue" (implementation-defined)

// 5. Union size check — exact member count
type Count<U, Acc extends unknown[] = []> =
  [U] extends [never] ? Acc["length"] : Count<Exclude<U, LastOf<U>>, [unknown, ...Acc]>;
type Size = Count<"a" | "b" | "c">; // 3

// 6. Flatten union of unions
type FlatUnion<T> = T extends infer U ? U : never;
type Nested2 = ("a" | "b") | ("c" | "d");
type Flat = FlatUnion<Nested2>; // "a" | "b" | "c" | "d"

// 7. Intersection composition — builder pattern type state
interface Empty {}
interface WithName { _name: string }
interface WithEmail { _email: string }
type CompleteForm = WithName & WithEmail;
function buildForm(): Empty { return {}; }
function setName<T>(form: T, name: string): T & WithName { return { ...form, _name: name } as any; }
function setEmail<T>(form: T, email: string): T & WithEmail { return { ...form, _email: email } as any; }
const complete: CompleteForm = setEmail(setName(buildForm(), "Alice"), "alice@x.com");

// 8. Discriminated union with template literal discriminant
type RouteEvent<Path extends string> =
  | { type: `navigate:${Path}`; from: string }
  | { type: `prefetch:${Path}` };
type HomeEvents = RouteEvent<"home">;
const nav: HomeEvents = { type: "navigate:home", from: "/about" };

// 9. Union narrowed by satisfies
type Config2 = { env: "dev" | "prod"; port: number };
const cfg = { env: "prod", port: 443 } satisfies Config2;
// cfg.env is still "prod" (literal), not widened to string

// 10. Exclusive OR (XOR) type — only one or the other
type XOR<T, U> =
  | (T & { [K in Exclude<keyof U, keyof T>]?: never })
  | (U & { [K in Exclude<keyof T, keyof U>]?: never });
type EitherNameOrAlias = XOR<{ name: string }, { alias: string }>;
const withName: EitherNameOrAlias = { name: "Alice" };
const withAlias: EitherNameOrAlias = { alias: "neo" };
// const both: EitherNameOrAlias = { name: "Alice", alias: "neo" }; // Error

// 11. Recursive union expansion
type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type NonZeroDigit = Exclude<Digit, 0>; // 1 | 2 | ... | 9

// 12. Intersection for type-safe event bus
type StrictEventBus<Events extends Record<string, unknown>> = {
  emit<K extends keyof Events>(event: K, payload: Events[K]): void;
  on<K extends keyof Events>(event: K, handler: (payload: Events[K]) => void): void;
};

// 13. Union mapped to discriminated interface
type TypedUnion<T extends Record<string, unknown>> = {
  [K in keyof T]: { kind: K } & T[K];
}[keyof T];
type Actions = TypedUnion<{
  ADD: { item: string };
  REMOVE: { index: number };
  CLEAR: {};
}>;
const addAction: Actions = { kind: "ADD", item: "Widget" };

// 14. Intersection prevents extra keys (exact type simulation)
type Exact<T, Shape extends T> = Shape;
type ExactUser = Exact<{ name: string }, { name: string }>;
// { name: string; extra: boolean } would fail the constraint

// 15. Union of infer extraction results
type Unpack<T> =
  T extends Array<infer E> ? E :
  T extends Promise<infer P> ? P :
  T extends Record<string, infer V> ? V :
  T;
type FromArray = Unpack<string[]>;          // string
type FromPromise = Unpack<Promise<number>>; // number
type FromRecord = Unpack<Record<string, boolean>>; // boolean

// 16. Conditional intersection — add only if condition met
type WithDebug<T, Debug extends boolean> =
  Debug extends true ? T & { __debug: unknown } : T;
type ProdType = WithDebug<{ name: string }, false>; // { name: string }
type DevType = WithDebug<{ name: string }, true>;   // { name: string; __debug: unknown }

// 17. Union filtering — keep only object types
type OnlyObjects<U> = U extends object ? U : never;
type Mixed2 = string | number | { id: number } | boolean | { name: string };
type Objects = OnlyObjects<Mixed2>; // { id: number } | { name: string }

// 18. Intersection of mapped types
type Readonly2<T> = { readonly [K in keyof T]: T[K] };
type Optional2<T> = { [K in keyof T]?: T[K] };
type ReadonlyOptional<T> = Readonly2<T> & Optional2<T>;
// Effectively: { readonly [K in keyof T]?: T[K] }

// 19. Distributive pick over union
type DistributedPick<T, K extends keyof T> = T extends any ? Pick<T, K> : never;
type AnyShape =
  | { kind: "circle"; radius: number; color: string }
  | { kind: "square"; side: number; color: string };
type KindAndColor = DistributedPick<AnyShape, "kind" | "color">;
// { kind: "circle"; color: string } | { kind: "square"; color: string }

// 20. Union to overloaded function type
type Overloads<U extends Record<string, [args: any[], ret: any]>> = {
  [K in keyof U]: (...args: U[K][0]) => U[K][1];
}[keyof U];

// 21. Intersection narrows function signature
type Logger2 = (msg: string) => void;
type WithLevel = { level: "info" | "warn" | "error" };
type LevelLogger = Logger2 & WithLevel;
const ll = Object.assign(
  (msg: string) => console.log(msg),
  { level: "info" as const }
);

// 22. Union to record via mapped type
type UnionToRecord<U extends string, V = unknown> = Record<U, V>;
type Colors = "red" | "green" | "blue";
type ColorValues = UnionToRecord<Colors, number>;
const cv: ColorValues = { red: 255, green: 0, blue: 128 };

// 23. Exclusive union for HTTP request body
type WithBody<B> = { body: B; headers?: Record<string, string> };
type WithoutBody = { body?: never; headers?: Record<string, string> };
type GetRequest = WithoutBody & { method: "GET"; url: string };
type PostRequest = WithBody<unknown> & { method: "POST"; url: string };
type HttpReq = GetRequest | PostRequest;

// 24. Intersection for read-model vs write-model split
type Identifier = { id: string };
type WriteUser = { name: string; email: string; passwordHash: string };
type ReadUser = Identifier & Omit<WriteUser, "passwordHash"> & { createdAt: string };

// 25. Union flattening via conditional
type DeepUnion<T> =
  T extends T ? (T extends infer U ? U : never) : never;

// 26. Conditional intersection — merge two schemas
type Merge<A, B> = {
  [K in keyof A | keyof B]:
    K extends keyof A & keyof B
      ? A[K] | B[K]   // overlapping: union
      : K extends keyof A
      ? A[K]
      : K extends keyof B
      ? B[K]
      : never;
};
type SchemaA = { name: string; age: number };
type SchemaB = { age: string; email: string };
type Merged = Merge<SchemaA, SchemaB>;
// { name: string; age: number | string; email: string }

// 27. Branded union members
declare const _b: unique symbol;
type Brand<T, B> = T & { [_b]: B };
type USD = Brand<number, "USD">;
type EUR = Brand<number, "EUR">;
type Money = USD | EUR;
const usd = 100 as USD;
const eur = 85 as EUR;
function total(amounts: Money[]): number {
  return amounts.reduce((s, a) => s + a, 0);
}

// 28. Recursive union walk
type Paths<T, P extends string = ""> =
  T extends object
    ? { [K in keyof T & string]: Paths<T[K], P extends "" ? K : `${P}.${K}`> }[keyof T & string]
    : P;
type ObjPaths = Paths<{ a: { b: { c: string } }; d: number }>;
// "a.b.c" | "d" | "a.b" | "a"
const path: ObjPaths = "a.b.c";

// 29. Union discrimination via satisfies + as const
const SHAPES = [
  { kind: "circle", radius: 5 },
  { kind: "square", side: 4 },
] as const satisfies readonly { kind: string }[];
type ShapeKind = (typeof SHAPES)[number]["kind"]; // "circle" | "square"

// 30. Intersection for type-safe proxy
type DeepRequired<T> = {
  [K in keyof T]-?: T[K] extends object ? DeepRequired<T[K]> : T[K];
};
type AllDefined<T> = T & DeepRequired<T>;

// 31. Union of rest tuple types
type Rest1 = [string, ...number[]];
type Rest2 = [boolean, ...string[]];
type AnyRest = Rest1 | Rest2;

// 32. Intersection of readonly and mutable
type Mutable<T> = { -readonly [K in keyof T]: T[K] };
type FrozenPoint = Readonly<{ x: number; y: number }>;
type ThawedPoint = Mutable<FrozenPoint>;
const tp: ThawedPoint = { x: 1, y: 2 };
tp.x = 3; // now writable

// 33. Template literal union — CSS size values
type CssUnit = "px" | "rem" | "em" | "vh" | "vw" | "%";
type CssSize = `${number}${CssUnit}`;
const w: CssSize = "100px";
const h: CssSize = "2rem";

// 34. Union of conditional types with never filtering
type FilterNever<T> = T extends never ? never : T;
type Filtered = FilterNever<string | never | number>; // string | number

// 35. Intersection for generic middleware result
type MiddlewareResult<Ctx, Extra> = Ctx & Extra & { _processedAt: number };
type AuthResult = MiddlewareResult<{ req: string }, { user: { id: number } }>;

// 36. Discriminated union with shared methods via intersection
type WithPrint = { print(): void };
type TypedShapeA = { shape: "A"; value: number } & WithPrint;
type TypedShapeB = { shape: "B"; label: string } & WithPrint;
type TypedShape = TypedShapeA | TypedShapeB;
function printShape(s: TypedShape): void { s.print(); }

// 37. Union to tuple (ordered, limited to 4 members here)
type Push<T extends unknown[], V> = [...T, V];
type UnionToTuple<U, Acc extends unknown[] = []> =
  [U] extends [never] ? Acc : UnionToTuple<Exclude<U, LastOf<U>>, Push<Acc, LastOf<U>>>;
// Note: requires LastOf from example 4

// 38. Intersection for accumulating builder type
type Pipe<In, Out> = { _in: In; _out: Out };
type Chain<A extends Pipe<any, any>, B extends Pipe<A["_out"], any>> =
  Pipe<A["_in"], B["_out"]>;
type Step1 = Pipe<string, number>;
type Step2 = Pipe<number, boolean>;
type Combined = Chain<Step1, Step2>; // Pipe<string, boolean>

// 39. Conditional — restrict intersection to same-key types
type StrictIntersect<A, B> = A extends B ? (B extends A ? A & B : never) : never;

// 40. Union for async or sync
type MaybeAsync<T> = T | Promise<T>;
async function normalize(val: MaybeAsync<string>): Promise<string> {
  return await val;
}

// 41. Intersection with ReturnType and Parameters
type Original2 = (x: number, y: string) => boolean;
type SameSignature = (...args: Parameters<Original2>) => ReturnType<Original2>;
const impl: SameSignature = (x, y) => x > 0;

// 42. Union to discriminated union via mapped type
type ToDiscriminated<T extends Record<string, unknown>> = {
  [K in keyof T]: { _tag: K; value: T[K] };
}[keyof T];
type Variants = ToDiscriminated<{ num: number; str: string; bool: boolean }>;
const v: Variants = { _tag: "num", value: 42 };

// 43. Intersection with variadic tuple
type Spread<T extends unknown[], U extends unknown[]> = [...T, ...U];
type Combined2 = Spread<[string, number], [boolean, null]>;
const c2: Combined2 = ["x", 1, true, null];

// 44. Deep union unwrap
type Unwrap<T> =
  T extends { value: infer V } ? Unwrap<V> : T;
type Deep = Unwrap<{ value: { value: { value: string } } }>; // string

// 45. Intersection to simulate multiple inheritance
class Mixin1 { method1() { return "m1"; } }
class Mixin2 { method2() { return "m2"; } }
type Mixin1And2 = InstanceType<typeof Mixin1> & InstanceType<typeof Mixin2>;
function createMixed(): Mixin1And2 {
  return Object.assign(new Mixin1(), new Mixin2());
}

// 46. Union of template literal patterns
type Route = `/users` | `/users/${string}` | `/posts` | `/posts/${string}`;
const r1: Route = "/users";
const r2: Route = "/users/42";

// 47. Intersection of mapped conditionals
type RequiredMethods<T> = {
  [K in keyof T as T[K] extends Function ? K : never]: T[K];
} & {
  [K in keyof T as T[K] extends Function ? never : K]?: T[K];
};

// 48. Union narrowing via assertion functions
function assertIsNumber(val: unknown): asserts val is number {
  if (typeof val !== "number") throw new TypeError();
}
const u: string | number = 42;
assertIsNumber(u);
u.toFixed(2); // safe

// 49. Conditional union preservation
type PreserveOrder<T extends string[]> =
  T extends [infer H extends string, ...infer R extends string[]]
    ? H | PreserveOrder<R>
    : never;
type Ordered = PreserveOrder<["a", "b", "c"]>; // "a" | "b" | "c"

// 50. Intersection used to lock a property to a specific literal
type Locked<T, K extends keyof T, V extends T[K]> = Omit<T, K> & Record<K, V>;
type BaseRecord = { status: "active" | "inactive" | "deleted"; name: string };
type ActiveRecord = Locked<BaseRecord, "status", "active">;
const active: ActiveRecord = { status: "active", name: "Alice" };
