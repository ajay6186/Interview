export {};

// ============================================================
// ADVANCED EXAMPLES — Type Narrowing (50 Examples)
// ============================================================

// 1. Assertion function with complex type predicate
function assertShape<T extends object>(
  val: unknown,
  checks: { [K in keyof T]: (v: unknown) => v is T[K] }
): asserts val is T {
  if (typeof val !== "object" || val === null) throw new TypeError("Not an object");
  for (const key of Object.keys(checks) as (keyof T)[]) {
    if (!checks[key]((val as any)[key])) throw new TypeError(`Invalid field: ${String(key)}`);
  }
}

// 2. Generic type guard factory
function makeGuard<T>(
  check: (val: unknown) => boolean
): (val: unknown) => val is T {
  return (val): val is T => check(val);
}
const isNumber = makeGuard<number>((v) => typeof v === "number");
const isString = makeGuard<string>((v) => typeof v === "string");

// 3. Combine type guards with AND
function and<A, B>(
  guardA: (v: unknown) => v is A,
  guardB: (v: unknown) => v is B
): (v: unknown) => v is A & B {
  return (v): v is A & B => guardA(v) && guardB(v);
}
const isNamedNumber = and(
  makeGuard<{ name: string }>((v) => typeof (v as any)?.name === "string"),
  makeGuard<{ value: number }>((v) => typeof (v as any)?.value === "number")
);

// 4. Combine type guards with OR
function or<A, B>(
  guardA: (v: unknown) => v is A,
  guardB: (v: unknown) => v is B
): (v: unknown) => v is A | B {
  return (v): v is A | B => guardA(v) || guardB(v);
}
const isStrOrNum = or(isString, isNumber);

// 5. Exhaustive check with infer
type AllColors = "red" | "green" | "blue";
type Remaining = Exclude<AllColors, "red" | "green">;
function assertOnlyBlue(c: Remaining): void {
  const _: "blue" = c; // compile-time check
}

// 6. Narrowing via conditional type result
type IsString<T> = T extends string ? true : false;
function processIfString<T>(
  val: T,
  fn: IsString<T> extends true ? (s: string) => string : never
): string {
  if (typeof val === "string") return (fn as (s: string) => string)(val);
  return String(val);
}

// 7. Narrowing with infer in conditional type
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
async function resolveValue<T>(val: T): Promise<UnwrapPromise<T>> {
  return (val instanceof Promise ? await val : val) as UnwrapPromise<T>;
}

// 8. Discriminated union with template literal discriminant
type Route =
  | { type: `GET:/users`; query?: { page: number } }
  | { type: `POST:/users`; body: { name: string } }
  | { type: `GET:/users/${string}`; params: { id: string } };
function handleRoute(r: Route): string {
  if (r.type === "GET:/users") return `list page=${r.query?.page ?? 1}`;
  if (r.type === "POST:/users") return `create ${r.body.name}`;
  return `get user ${r.params.id}`;
}

// 9. Recursive type guard
type JsonValue =
  | string | number | boolean | null
  | JsonValue[]
  | { [k: string]: JsonValue };
function isJsonValue(val: unknown): val is JsonValue {
  if (val === null || typeof val === "string" || typeof val === "number" || typeof val === "boolean") return true;
  if (Array.isArray(val)) return val.every(isJsonValue);
  if (typeof val === "object") return Object.values(val as object).every(isJsonValue);
  return false;
}

// 10. Control flow narrowing via type predicate method
class TypedBox<T> {
  constructor(private val: T | null) {}
  hasValue(): this is TypedBox<T> & { val: T } {
    return this.val !== null;
  }
  get(): T | null { return this.val; }
}
const box = new TypedBox<string>("hello");
if (box.hasValue()) {
  const s = box.get()!.toUpperCase(); // safe but needs ! due to private
}

// 11. Narrowing with overloaded assertion
function assert(condition: boolean, msg: string): asserts condition;
function assert<T>(val: T, guard: (v: T) => boolean, msg: string): asserts val is NonNullable<T>;
function assert(...args: any[]): void {
  const [first, second, third] = args;
  if (typeof second === "function") {
    if (!second(first)) throw new Error(third);
  } else {
    if (!first) throw new Error(second);
  }
}

// 12. Narrowing inside mapped type iteration (type level)
type NarrowValues<T, V> = {
  [K in keyof T as T[K] extends V ? K : never]: T[K];
};
interface Mixed2 { name: string; age: number; active: boolean; score: number }
type StringProps = NarrowValues<Mixed2, string>;  // { name: string }
type NumberProps = NarrowValues<Mixed2, number>;  // { age: number; score: number }

// 13. Narrowing with discriminated tuple type
type TaggedTuple =
  | [tag: "str", val: string]
  | [tag: "num", val: number]
  | [tag: "arr", val: unknown[]];
function fromTagged(t: TaggedTuple): string {
  if (t[0] === "str") return t[1].toUpperCase();
  if (t[0] === "num") return t[1].toFixed(2);
  return `array[${t[1].length}]`;
}

// 14. Type assertion via satisfies for literal narrowing
const STATUS = {
  pending: 0,
  active: 1,
  banned: 2,
} as const satisfies Record<string, number>;
type StatusKey = keyof typeof STATUS;
const sk: StatusKey = "active";
const sv: (typeof STATUS)[StatusKey] = STATUS[sk]; // 0 | 1 | 2

// 15. Narrowing inferred conditional result
type Narrowed<T> =
  T extends string ? { kind: "string"; value: string } :
  T extends number ? { kind: "number"; value: number } :
  { kind: "other"; value: T };
function wrap<T>(val: T): Narrowed<T> {
  if (typeof val === "string") return { kind: "string", value: val } as Narrowed<T>;
  if (typeof val === "number") return { kind: "number", value: val } as Narrowed<T>;
  return { kind: "other", value: val } as Narrowed<T>;
}

// 16. Narrowing via class with private brand
declare const _brand: unique symbol;
class SafeString {
  readonly [_brand]: "SafeString";
  constructor(public readonly value: string) {}
}
function isSafeString(val: unknown): val is SafeString {
  return val instanceof SafeString;
}

// 17. Discriminated union with index access narrowing
type Schema = {
  string: { minLength?: number; maxLength?: number };
  number: { min?: number; max?: number };
  boolean: {};
};
type FieldSchema<T extends keyof Schema> = { type: T } & Schema[T];
type AnyField = { [K in keyof Schema]: FieldSchema<K> }[keyof Schema];
function validateField(field: AnyField, val: unknown): boolean {
  if (field.type === "string") return typeof val === "string";
  if (field.type === "number") return typeof val === "number";
  return typeof val === "boolean";
}

// 18. Narrowing with proxy trap type guard
function isProxy<T extends object>(target: T): target is T {
  return typeof target === "object" && target !== null;
}

// 19. Narrowing via conditional narrowing chain
type Level = "L1" | "L2" | "L3";
type L1Item = { level: "L1"; data: string };
type L2Item = { level: "L2"; data: { nested: number } };
type L3Item = { level: "L3"; data: { deep: { value: boolean } } };
type AnyItem = L1Item | L2Item | L3Item;
function extractData(item: AnyItem): string | number | boolean {
  if (item.level === "L1") return item.data;
  if (item.level === "L2") return item.data.nested;
  return item.data.deep.value;
}

// 20. Narrowing with infer extraction inside type guard
function isArrayOf<T>(
  arr: unknown,
  itemGuard: (x: unknown) => x is T
): arr is T[] {
  return Array.isArray(arr) && arr.every(itemGuard);
}
function isTuple2<A, B>(
  val: unknown,
  aGuard: (x: unknown) => x is A,
  bGuard: (x: unknown) => x is B
): val is [A, B] {
  return Array.isArray(val) && val.length === 2 && aGuard(val[0]) && bGuard(val[1]);
}

// 21. Narrowing assertion with generic constraint
function ensureType<T>(
  val: unknown,
  guard: (v: unknown) => v is T,
  label: string
): T {
  if (!guard(val)) throw new TypeError(`Expected ${label}, got ${typeof val}`);
  return val;
}
const name = ensureType("Alice", isString, "string");
const num = ensureType(42, isNumber, "number");

// 22. Narrowing with this type predicate (type-safe builder)
class QueryBuilder {
  private filters: string[] = [];
  private limitVal?: number;
  isLimited(): this is this & { limitVal: number } {
    return this.limitVal !== undefined;
  }
  limit(n: number): this { this.limitVal = n; return this; }
  where(f: string): this { this.filters.push(f); return this; }
  build(): string {
    let q = `SELECT * WHERE ${this.filters.join(" AND ")}`;
    if (this.isLimited()) q += ` LIMIT ${this.limitVal}`;
    return q;
  }
}

// 23. Narrowing by mapping type to guard
type GuardMap<T> = { [K in keyof T]: (v: unknown) => v is T[K] };
function makeObjectGuard<T extends object>(guards: GuardMap<T>): (v: unknown) => v is T {
  return (v): v is T => {
    if (typeof v !== "object" || v === null) return false;
    return (Object.keys(guards) as (keyof T)[]).every(
      (k) => guards[k]((v as any)[k])
    );
  };
}
const isPoint = makeObjectGuard<{ x: number; y: number }>({
  x: isNumber,
  y: isNumber,
});
const pt: unknown = { x: 1, y: 2 };
if (isPoint(pt)) console.log(pt.x, pt.y);

// 24. Narrowing — preserve literal type after narrowing
const ROLES = ["admin", "user", "guest"] as const;
type Role = (typeof ROLES)[number];
function assertRole(val: string): asserts val is Role {
  if (!(ROLES as readonly string[]).includes(val)) throw new Error(`Invalid role: ${val}`);
}
const rawRole: string = "admin";
assertRole(rawRole);
const role: Role = rawRole;

// 25. Narrowing with conditional mapped filtering
type FilteredKeys<T, Condition> = {
  [K in keyof T]: T[K] extends Condition ? K : never;
}[keyof T];
type StringKeys = FilteredKeys<{ a: string; b: number; c: string }, string>; // "a" | "c"

// 26. Narrowing via class hierarchy + interface combo
interface Serializable { serialize(): string }
interface Cacheable { cacheKey(): string }
class CachedEntity implements Serializable, Cacheable {
  serialize() { return "{}"; }
  cacheKey() { return "entity:1"; }
}
function isCacheable(val: object): val is Cacheable {
  return "cacheKey" in val && typeof (val as any).cacheKey === "function";
}

// 27. Narrowing inside flatMap
const data: (string | string[])[] = ["a", ["b", "c"], "d"];
const flat = data.flatMap<string>((item) =>
  Array.isArray(item) ? item : [item]
);

// 28. Narrowing with mapped discriminant
type EventRegistry = {
  click: { x: number; y: number };
  keydown: { key: string; ctrl: boolean };
  resize: { width: number; height: number };
};
type TypedEvent<K extends keyof EventRegistry> = { type: K } & EventRegistry[K];
type AnyEvent = { [K in keyof EventRegistry]: TypedEvent<K> }[keyof EventRegistry];
function onEvent(e: AnyEvent): void {
  if (e.type === "click") console.log(e.x, e.y);
  else if (e.type === "keydown") console.log(e.key, e.ctrl);
  else console.log(e.width, e.height);
}

// 29. Narrowing with inferred conditional types in runtime
function processUnion<T extends string | number | boolean>(val: T): T extends string ? string : T extends number ? number : boolean {
  return val as any;
}

// 30. Narrowing via prototype chain check
function isPlainObject(val: unknown): val is Record<string, unknown> {
  if (typeof val !== "object" || val === null) return false;
  const proto = Object.getPrototypeOf(val);
  return proto === Object.prototype || proto === null;
}

// 31. Narrowing with pattern-matching helper
type Pattern<T> = T extends object
  ? { [K in keyof T]?: Pattern<T[K]> }
  : T;
function matches<T extends object>(val: unknown, pattern: Pattern<T>): val is T {
  if (typeof val !== "object" || val === null) return false;
  return Object.entries(pattern).every(([k, expected]) => {
    const actual = (val as any)[k];
    if (typeof expected === "object" && expected !== null) return matches(actual, expected as any);
    return actual === expected;
  });
}

// 32. Narrowing with compile-time constraint verification
type AssertExtends<T extends U, U> = T;
type Check1 = AssertExtends<"hello", string>;    // ok
// type Check2 = AssertExtends<number, string>;  // Error

// 33. Narrowing inferred from overload selection
function parse(val: "true"): true;
function parse(val: "false"): false;
function parse(val: "true" | "false"): boolean;
function parse(val: string): boolean {
  return val === "true";
}
const t = parse("true");  // type: true
const f = parse("false"); // type: false

// 34. Narrowing via function composition
const composeGuards = <T>(...guards: Array<(v: unknown) => v is T>) =>
  (v: unknown): v is T => guards.every((g) => g(v));

// 35. Narrowing — type of array element from const assertion
const SUPPORTED_LANGS = ["en", "fr", "de", "ja"] as const;
type SupportedLang = (typeof SUPPORTED_LANGS)[number];
function isSupportedLang(s: string): s is SupportedLang {
  return (SUPPORTED_LANGS as readonly string[]).includes(s);
}

// 36. Narrowing with heterogeneous union array via type guard + reduce
type TypedItem =
  | { kind: "num"; value: number }
  | { kind: "str"; value: string };
type Partitioned = { nums: number[]; strs: string[] };
const items: TypedItem[] = [
  { kind: "num", value: 1 },
  { kind: "str", value: "a" },
  { kind: "num", value: 2 },
];
const partitioned = items.reduce<Partitioned>(
  (acc, item) => {
    if (item.kind === "num") acc.nums.push(item.value);
    else acc.strs.push(item.value);
    return acc;
  },
  { nums: [], strs: [] }
);

// 37. Narrowing via is-predicate with bounded polymorphism
function hasField<T extends object, K extends string>(
  val: T,
  key: K
): val is T & Record<K, unknown> {
  return key in val;
}
const obj: { name: string } = { name: "Alice" };
if (hasField(obj, "age")) {
  const age = obj.age; // unknown, but obj has the field
}

// 38. Narrowing — type guard on Map entries
function narrowMapEntries<K, V>(
  map: Map<K, V | null>,
  guard: (v: V | null) => v is V
): Map<K, V> {
  const result = new Map<K, V>();
  for (const [k, v] of map.entries()) {
    if (guard(v)) result.set(k, v);
  }
  return result;
}

// 39. Narrowing via class method as type predicate
class Result<T> {
  constructor(private val: T | Error) {}
  isError(): this is Result<never> & { val: Error } {
    return this.val instanceof Error;
  }
  isOk(): this is Result<T> & { val: T } {
    return !(this.val instanceof Error);
  }
  getOrThrow(): T {
    if (this.isError()) throw this.val;
    return this.val as T;
  }
}

// 40. Narrowing infer in nested conditional
type ExtractNested<T> =
  T extends { data: { items: infer I[] } } ? I :
  T extends { data: infer D } ? D :
  never;
type Extracted1 = ExtractNested<{ data: { items: string[] } }>;    // string
type Extracted2 = ExtractNested<{ data: number }>;                  // number

// 41. Narrowing with keyof guard
function isKeyOf<T extends object>(key: string | number | symbol, obj: T): key is keyof T {
  return key in obj;
}
const config = { host: "localhost", port: 3000 };
const key: string = "host";
if (isKeyOf(key, config)) {
  const val = config[key]; // string | number
}

// 42. Narrowing using declaration narrowing
function getUserType(user: { role: string }): "admin" | "regular" {
  if (user.role === "admin") return "admin";
  return "regular";
}
const userRole = getUserType({ role: "admin" });
// userRole: "admin" | "regular" — known at call site

// 43. Narrowing with assertion in test utility pattern
function expectType<T>(_val: T): void {}
const strResult: string = "hello";
expectType<string>(strResult); // compile-time type check

// 44. Narrowing via labeled tuple
type StrNum = [label: string, value: number];
type NumStr = [value: number, label: string];
type Either2 = StrNum | NumStr;
function fromEither(e: Either2): string {
  if (typeof e[0] === "string") return `${e[0]}=${e[1]}`;
  return `${e[1]}=${e[0]}`;
}

// 45. Narrowing — branded assertion
declare const _b: unique symbol;
type Positive = number & { [_b]: "Positive" };
function assertPositive(n: number): asserts n is Positive {
  if (n <= 0) throw new RangeError(`Expected positive, got ${n}`);
}
const val: number = 5;
assertPositive(val);
const pos: Positive = val;

// 46. Narrowing with inferred discriminant mapping
type ShapeMap = { circle: { radius: number }; square: { side: number } };
type AnyShape2 = { [K in keyof ShapeMap]: { kind: K } & ShapeMap[K] }[keyof ShapeMap];
function shapeArea(s: AnyShape2): number {
  if (s.kind === "circle") return Math.PI * s.radius ** 2;
  return s.side ** 2;
}

// 47. Narrowing recursive tree with union accumulator
type NodeType = "internal" | "leaf";
type BTree<T> =
  | { type: "leaf"; value: T }
  | { type: "internal"; left: BTree<T>; right: BTree<T> };
function collectLeaves<T>(tree: BTree<T>): T[] {
  if (tree.type === "leaf") return [tree.value];
  return [...collectLeaves(tree.left), ...collectLeaves(tree.right)];
}

// 48. Narrowing via conditional mapped return
function castTo<T extends "string" | "number" | "boolean">(
  val: unknown,
  type: T
): T extends "string" ? string : T extends "number" ? number : boolean {
  if (type === "string") return String(val) as any;
  if (type === "number") return Number(val) as any;
  return Boolean(val) as any;
}
const asStr = castTo("42", "string");   // string
const asNum = castTo("42", "number");   // number
const asBool = castTo(1, "boolean");    // boolean

// 49. Narrowing multiple predicate composition
type SchemaGuard<T> = (val: unknown) => val is T;
function intersectGuards<A, B>(
  a: SchemaGuard<A>,
  b: SchemaGuard<B>
): SchemaGuard<A & B> {
  return (val): val is A & B => a(val) && b(val);
}

// 50. Full type-safe parse pipeline with narrowing
interface ParsePipeline<In, Out> {
  parse(input: In): Out;
  map<NextOut>(fn: (out: Out) => NextOut): ParsePipeline<In, NextOut>;
  validate(pred: (out: Out) => boolean, msg: string): ParsePipeline<In, Out>;
}
