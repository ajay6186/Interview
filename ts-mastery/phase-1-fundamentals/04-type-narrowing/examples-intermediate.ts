export {};

// ============================================================
// INTERMEDIATE EXAMPLES — Type Narrowing (50 Examples)
// ============================================================

// 1. Generic type guard
function isNonNull<T>(val: T | null | undefined): val is T {
  return val != null;
}
const arr = [1, null, 2, undefined, 3];
const nums = arr.filter(isNonNull); // number[]

// 2. Type guard with array filter inference
function isString(val: unknown): val is string {
  return typeof val === "string";
}
const mixed: unknown[] = ["a", 1, "b", 2];
const strings = mixed.filter(isString); // string[]

// 3. Assertion function (throws, narrows after call)
function assertIsDefined<T>(val: T): asserts val is NonNullable<T> {
  if (val == null) throw new Error("Expected non-null value");
}
const maybeStr: string | null = "hello";
assertIsDefined(maybeStr);
maybeStr.toUpperCase(); // safe

// 4. Assertion function for specific type
function assertIsString(val: unknown): asserts val is string {
  if (typeof val !== "string") throw new TypeError("Expected string");
}

// 5. Discriminated union with multiple discriminants
type Shape =
  | { kind: "circle"; color: "red" | "blue"; radius: number }
  | { kind: "circle"; color: "green"; radius: number; glow: boolean }
  | { kind: "square"; side: number };
function describe(s: Shape): string {
  if (s.kind === "circle" && s.color === "green") return `glowing: ${s.glow}`;
  if (s.kind === "circle") return `circle r=${s.radius}`;
  return `square ${s.side}`;
}

// 6. Exhaustive narrowing — never fallback
type Command = "start" | "stop" | "restart" | "status";
function handleCmd(cmd: Command): string {
  switch (cmd) {
    case "start":   return "starting";
    case "stop":    return "stopping";
    case "restart": return "restarting";
    case "status":  return "ok";
    default:
      const _exhaustive: never = cmd;
      throw new Error(`Unknown: ${_exhaustive}`);
  }
}

// 7. Narrowing in a loop with type guard accumulation
function partitionByType<T>(arr: (T | string)[]): [T[], string[]] {
  const ts: T[] = [];
  const strs: string[] = [];
  for (const item of arr) {
    if (typeof item === "string") strs.push(item);
    else ts.push(item);
  }
  return [ts, strs];
}

// 8. Narrowing through function call (flow-based)
function isDefined<T>(x: T | undefined): x is T { return x !== undefined; }
function processOptional(val: string | undefined): string {
  if (isDefined(val)) return val.trim();
  return "";
}

// 9. Narrowing class property via "in"
class AdminUser { admin = true; name: string; constructor(n: string) { this.name = n; } }
class RegularUser { name: string; constructor(n: string) { this.name = n; } }
function greet(u: AdminUser | RegularUser): string {
  if ("admin" in u) return `[Admin] ${u.name}`;
  return u.name;
}

// 10. Narrowing across function call boundaries (re-check required)
function maybeNull(): string | null { return Math.random() > 0.5 ? "hi" : null; }
const v = maybeNull();
if (v !== null) {
  // v is string here — but if TS doesn't know maybeNull is pure, it stays string inside block
  console.log(v.toUpperCase());
}

// 11. Narrowing with tagged union helper
function tag<T extends string, P>(type: T, payload: P): { type: T } & P {
  return { type, ...payload } as any;
}
type Login = { type: "login"; userId: number };
type Logout = { type: "logout" };
type AuthEvent = Login | Logout;
function handleAuth(e: AuthEvent): void {
  if (e.type === "login") console.log(e.userId);
}

// 12. Narrowing via optional chaining truthiness
interface Nested { child?: { value: number } }
function getValue(n: Nested): number {
  return n.child?.value ?? 0; // no explicit narrowing needed
}

// 13. Conditional type check with instanceof chain
class HttpError extends Error { constructor(public status: number, msg: string) { super(msg); } }
class NetworkError extends Error { constructor(msg: string) { super(msg); } }
function handleError(e: Error): string {
  if (e instanceof HttpError) return `HTTP ${e.status}: ${e.message}`;
  if (e instanceof NetworkError) return `Network: ${e.message}`;
  return `Error: ${e.message}`;
}

// 14. Narrowing an unknown API response
function parseApiResponse(data: unknown): { name: string } {
  if (
    typeof data === "object" &&
    data !== null &&
    "name" in data &&
    typeof (data as Record<string, unknown>).name === "string"
  ) {
    return data as { name: string };
  }
  throw new Error("Invalid response");
}

// 15. Narrowing with Promise resolution (at value, not type level)
async function safeFetch(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

// 16. Narrowing union of arrays vs single value
function toArray<T>(val: T | T[]): T[] {
  return Array.isArray(val) ? val : [val];
}

// 17. Narrowing readonly vs mutable (structural only)
function sortNums(arr: number[] | readonly number[]): number[] {
  return Array.isArray(arr) ? [...arr].sort((a, b) => a - b) : [...arr].sort((a, b) => a - b);
}

// 18. Narrowing inside generic function via constraint
function getProperty<T extends object, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// 19. Narrowing with multiple conditions (&&)
function strictGreet(val: string | null | undefined): string {
  if (val !== null && val !== undefined && val.length > 0) {
    return val.trim().toUpperCase();
  }
  return "EMPTY";
}

// 20. Narrowing to concrete Record type
function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}
const input: unknown = { key: "value" };
if (isRecord(input)) {
  const keys = Object.keys(input);
}

// 21. Narrowing class union with method presence
class Pdf { export() { return Buffer.from("pdf"); } }
class Csv { stringify() { return "a,b,c"; } }
function render(doc: Pdf | Csv): string | Buffer {
  if ("export" in doc) return doc.export();
  return doc.stringify();
}

// 22. Narrowing with control flow after reassignment
let val2: string | number = "initial";
console.log(val2.toUpperCase()); // narrowed to string
val2 = 42;
console.log(val2.toFixed(2));   // narrowed to number

// 23. Narrowing with Object.hasOwn (TS 4.9+)
function hasOwn(obj: object, key: string): key is keyof typeof obj {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

// 24. Narrowing with type predicate on class
class Token { constructor(public kind: "access" | "refresh", public value: string) {} }
function isAccessToken(t: Token): t is Token & { kind: "access" } {
  return t.kind === "access";
}

// 25. Narrowing tuple length
type Pair = [string, number];
type Triple = [string, number, boolean];
function isPair(arr: Pair | Triple): arr is Pair {
  return arr.length === 2;
}

// 26. Narrowing with Set.has for literal types
const VALID_COLORS = new Set(["red", "green", "blue"] as const);
type ValidColor = "red" | "green" | "blue";
function isValidColor(c: string): c is ValidColor {
  return VALID_COLORS.has(c as ValidColor);
}

// 27. Narrowing string template pattern
function isISODate(s: string): s is `${number}-${number}-${number}` {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

// 28. Narrowing via Zod-like parse pattern
interface Parser<T> { parse(val: unknown): T }
function safeParse<T>(parser: Parser<T>, val: unknown): T | null {
  try { return parser.parse(val); }
  catch { return null; }
}

// 29. Narrowing in a generator function
function* processItems(items: (string | number)[]): Generator<string> {
  for (const item of items) {
    if (typeof item === "string") yield item; // narrowed
  }
}

// 30. Narrowing inside map callback
const inputs: (string | null)[] = ["a", null, "b"];
const processed = inputs.map((i) => {
  if (i === null) return "";
  return i.toUpperCase(); // narrowed
});

// 31. Narrowing via Object.entries value types
const map: Record<string, string | number> = { a: "x", b: 1 };
for (const [key, val3] of Object.entries(map)) {
  if (typeof val3 === "string") console.log(key, val3.toUpperCase());
  else console.log(key, val3.toFixed());
}

// 32. Narrowing with as const and union
const METHODS = ["GET", "POST", "PUT", "DELETE"] as const;
type HttpMethod = (typeof METHODS)[number];
function isHttpMethod(s: string): s is HttpMethod {
  return (METHODS as readonly string[]).includes(s);
}

// 33. Narrowing inside reduce
const tokens: (string | number)[] = ["a", 1, "b", 2];
const sum = tokens.reduce<number>((acc, t) => {
  if (typeof t === "number") return acc + t;
  return acc;
}, 0);

// 34. Narrowing discriminated union array
type Notification =
  | { kind: "email"; to: string; subject: string }
  | { kind: "sms"; phone: string; message: string };
function sendAll(notifs: Notification[]): void {
  for (const n of notifs) {
    if (n.kind === "email") console.log("email to:", n.to);
    else console.log("sms to:", n.phone);
  }
}

// 35. Narrowing via hasOwnProperty with generic
function pluck<T extends object, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// 36. Narrowing with instanceof for built-in types
function safeJSON(val: unknown): string {
  if (val instanceof Error) return `Error: ${val.message}`;
  if (val instanceof Date) return val.toISOString();
  if (val instanceof RegExp) return val.source;
  return JSON.stringify(val);
}

// 37. Narrowing mapped type value via type guard
type EventHandlers = {
  onClick?: () => void;
  onChange?: (val: string) => void;
};
function callHandler<K extends keyof EventHandlers>(
  handlers: EventHandlers,
  key: K
): void {
  const fn = handlers[key];
  if (fn) (fn as Function)();
}

// 38. Narrowing with switch on typeof
function deepType(val: unknown): string {
  switch (typeof val) {
    case "string":    return `string:"${val}"`;
    case "number":    return `number:${val}`;
    case "boolean":   return `boolean:${val}`;
    case "object":    return val === null ? "null" : "object";
    case "undefined": return "undefined";
    case "function":  return "function";
    default:          return "unknown";
  }
}

// 39. Narrowing with type predicate returning object assertion
interface HasEmail { email: string }
function hasEmailProp(obj: object): obj is HasEmail {
  return "email" in obj && typeof (obj as any).email === "string";
}

// 40. Narrowing abstract base to concrete
abstract class Serializable {
  abstract serialize(): string;
}
class JsonSerializable extends Serializable {
  serialize() { return "{}"; }
  toObject() { return {}; }
}
function tryCast(s: Serializable): JsonSerializable | null {
  if (s instanceof JsonSerializable) return s;
  return null;
}

// 41. Narrowing via object shape completeness
interface Complete { a: string; b: number; c: boolean }
function isComplete(obj: Partial<Complete>): obj is Complete {
  return obj.a !== undefined && obj.b !== undefined && obj.c !== undefined;
}

// 42. Narrowing with number range
function classify(n: number): "small" | "medium" | "large" {
  if (n < 10) return "small";
  if (n < 100) return "medium";
  return "large";
}

// 43. Narrowing via computed property access
const VALIDATORS: Record<string, (v: unknown) => boolean> = {
  string: (v) => typeof v === "string",
  number: (v) => typeof v === "number",
};
function validate(type: string, value: unknown): boolean {
  return VALIDATORS[type]?.(value) ?? false;
}

// 44. Narrowing double union inside object
interface ApiMsg {
  payload: { kind: "data"; value: string } | { kind: "error"; code: number };
  meta: { timestamp: number };
}
function handleMsg(msg: ApiMsg): string {
  if (msg.payload.kind === "data") return msg.payload.value;
  return `Error ${msg.payload.code}`;
}

// 45. Narrowing across spread
function extendOrOverride<T extends object>(base: T, override: Partial<T>): T {
  return { ...base, ...override };
}

// 46. Narrowing with conditional throw in helper
function ensureString(val: unknown, name = "value"): string {
  if (typeof val !== "string") throw new TypeError(`${name} must be a string`);
  return val;
}

// 47. Narrowing tuple element type
type StrNumPair = [string, number];
function firstOfPair(pair: StrNumPair): string {
  return pair[0]; // already narrowed by tuple position
}

// 48. Narrowing via tagged result
type TaggedResult<T> = { success: true; data: T } | { success: false; error: string };
function unwrap<T>(r: TaggedResult<T>): T {
  if (!r.success) throw new Error(r.error);
  return r.data;
}

// 49. Narrowing generic container
interface Box<T> { value: T | null }
function unbox<T>(box: Box<T>): T {
  if (box.value === null) throw new Error("empty box");
  return box.value;
}

// 50. Narrowing using control flow analysis in complex branch
function complexNarrow(val: string | number | boolean | null): string {
  if (val === null) return "null";
  if (typeof val === "boolean") return val.toString();
  if (typeof val === "number") return val.toFixed(2);
  return val.trim(); // narrowed to string
}
