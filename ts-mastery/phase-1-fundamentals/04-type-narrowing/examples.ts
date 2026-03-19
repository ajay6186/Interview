// ============================================================================
// Examples 1.4 — Type Narrowing  (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================================

// ============================================================================
// BASIC — typeof, null/undefined checks, truthiness, in, instanceof (1–13)
// ============================================================================

// 1. typeof — string branch
function shout(v: string | number): string {
  if (typeof v === "string") return v.toUpperCase();
  return String(v);
}

// 2. typeof — number branch
function halve(v: string | number): number {
  if (typeof v === "number") return v / 2;
  return v.length / 2;
}

// 3. typeof — boolean branch
function toggle(v: boolean | string): boolean {
  if (typeof v === "boolean") return !v;
  return v !== "";
}

// 4. typeof — undefined branch
function orDefault(v: string | undefined): string {
  if (typeof v === "undefined") return "default";
  return v;
}

// 5. null equality check
function safeUpper(s: string | null): string {
  if (s === null) return "";
  return s.toUpperCase();
}

// 6. undefined equality check
function safeToFixed(n: number | undefined): string {
  if (n === undefined) return "N/A";
  return n.toFixed(2);
}

// 7. truthiness — falsy guard
function formatName(name: string | null | undefined): string {
  if (!name) return "Anonymous";
  return name.trim();
}

// 8. truthiness — truthy shorthand
function greetIfPresent(name: string | null): string {
  return name ? `Hello, ${name}!` : "Hello, stranger!";
}

// 9. in operator — single property
type Fish = { swim: () => string };
type Bird = { fly: () => string };
function move(animal: Fish | Bird): string {
  if ("swim" in animal) return animal.swim();
  return animal.fly();
}

// 10. in operator — two discriminating props
type Keyboard = { type: "keyboard"; keys: number };
type Mouse    = { type: "mouse"; buttons: number };
type Device   = Keyboard | Mouse;
function describeDevice(d: Device): string {
  if ("keys" in d) return `Keyboard with ${d.keys} keys`;
  return `Mouse with ${d.buttons} buttons`;
}

// 11. instanceof — built-in Date
function formatValue(v: Date | number): string {
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

// 12. instanceof — custom class
class ApiError {
  constructor(public status: number, public message: string) {}
}
class NetworkError {
  constructor(public message: string) {}
}
function describeError(e: ApiError | NetworkError): string {
  if (e instanceof ApiError) return `API ${e.status}: ${e.message}`;
  return `Network: ${e.message}`;
}

// 13. Array.isArray check
function flatten(v: string | string[]): string {
  if (Array.isArray(v)) return v.join(", ");
  return v;
}

// ============================================================================
// INTERMEDIATE — custom type guards, discriminants, switch narrowing (14–26)
// ============================================================================

// 14. custom type guard — is predicate
type Admin = { role: "admin"; permissions: string[] };
type Guest = { role: "guest" };
type User  = Admin | Guest;
function isAdmin(u: User): u is Admin {
  return u.role === "admin";
}
function getPermissions(u: User): string[] {
  return isAdmin(u) ? u.permissions : [];
}

// 15. custom type guard with in operator inside
function isFish(animal: Fish | Bird): animal is Fish {
  return "swim" in animal;
}

// 16. custom type guard filtering an array
const users: User[] = [
  { role: "admin", permissions: ["read", "write"] },
  { role: "guest" },
];
const admins: Admin[] = users.filter(isAdmin);

// 17. discriminant property narrowing (string literal)
type Circle    = { shape: "circle";    radius: number };
type Rectangle = { shape: "rectangle"; width: number; height: number };
type Shape = Circle | Rectangle;
function area(s: Shape): number {
  if (s.shape === "circle") return Math.PI * s.radius ** 2;
  return s.width * s.height;
}

// 18. switch-case narrowing
type Status = "loading" | "success" | "error";
function statusMessage(s: Status): string {
  switch (s) {
    case "loading": return "Please wait…";
    case "success": return "Done!";
    case "error":   return "Something went wrong.";
  }
}

// 19. narrowing with logical AND
function processTag(tag: string | null | undefined): string {
  if (tag !== null && tag !== undefined) return tag.trim();
  return "";
}

// 20. narrowing out null AND undefined (double guard)
function ensureString(v: string | null | undefined): string {
  if (v == null) return ""; // covers both null and undefined
  return v;
}

// 21. narrowing to a literal type
type Color = "red" | "green" | "blue";
function isRed(c: Color): c is "red" {
  return c === "red";
}

// 22. instanceof in a catch block
function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch (err) {
    if (err instanceof SyntaxError) return null;
    throw err;
  }
}

// 23. re-narrowing after assignment
function evolveState(state: "pending" | "running" | "done"): string {
  let label: string;
  if (state === "pending") {
    label = "Waiting";
  } else if (state === "running") {
    label = "In progress";
  } else {
    label = "Complete";
  }
  return label;
}

// 24. ternary narrowing
function clamp(v: number | null): number {
  return v !== null ? Math.max(0, Math.min(100, v)) : 0;
}

// 25. assertion function
function assertString(v: unknown): asserts v is string {
  if (typeof v !== "string") throw new TypeError("Expected string");
}

// 26. narrowing with Array.isArray inside ternary
function toArray<T>(v: T | T[]): T[] {
  return Array.isArray(v) ? v : [v];
}

// ============================================================================
// NESTED — narrowing inside callbacks, loops, nested objects (27–38)
// ============================================================================

// 27. narrowing inside a .filter callback
const mixed: (string | number)[] = ["a", 1, "b", 2];
const strings = mixed.filter((v): v is string => typeof v === "string");

// 28. narrowing inside a .map callback
function processAll(items: (string | number)[]): string[] {
  return items.map((item) => {
    if (typeof item === "string") return item.toUpperCase();
    return item.toFixed(0);
  });
}

// 29. narrowing inside a for-of loop
function sumNumbers(items: (string | number)[]): number {
  let total = 0;
  for (const item of items) {
    if (typeof item === "number") total += item;
  }
  return total;
}

// 30. nested property check with in operator
type HasSwimMethod = { animal: Fish };
type HasFlyMethod  = { animal: Bird };
function outerMove(container: HasSwimMethod | HasFlyMethod): string {
  if ("swim" in container.animal) return container.animal.swim();
  return container.animal.fly();
}

// 31. multi-level instanceof discrimination
class DatabaseError {
  constructor(public query: string, public message: string) {}
}
function classifyError(e: ApiError | NetworkError | DatabaseError): string {
  if (e instanceof ApiError)      return `API(${e.status})`;
  if (e instanceof DatabaseError) return `DB(${e.query})`;
  return `Net`;
}

// 32. narrowing union of 3 types
type A = { kind: "a"; value: string };
type B = { kind: "b"; count: number };
type C = { kind: "c"; flag: boolean };
type ABC = A | B | C;
function describeABC(x: ABC): string {
  if (x.kind === "a") return x.value;
  if (x.kind === "b") return String(x.count);
  return String(x.flag);
}

// 33. narrowing and intersection — guard preserves extra fields
type BasicUser  = { name: string };
type AdminUser  = BasicUser & { isAdmin: true; secret: string };
function getSecret(u: BasicUser | AdminUser): string | null {
  if ("isAdmin" in u && u.isAdmin) return u.secret;
  return null;
}

// 34. narrowing through an optional property
type WithOptional = { value?: string | number };
function extractString(w: WithOptional): string | null {
  if (typeof w.value === "string") return w.value;
  return null;
}

// 35. narrowing in a reduce callback
function categorize(items: (string | number)[]): { strings: string[]; numbers: number[] } {
  return items.reduce(
    (acc, item) => {
      if (typeof item === "string") acc.strings.push(item);
      else acc.numbers.push(item);
      return acc;
    },
    { strings: [] as string[], numbers: [] as number[] }
  );
}

// 36. instanceof + in combined
class HttpResponse {
  constructor(public status: number, public body: string) {}
}
function inspect(v: HttpResponse | ApiError): string {
  if (v instanceof ApiError) return `Error ${v.status}`;
  if (v instanceof HttpResponse && v.status >= 400) return `HTTP ${v.status}`;
  return "OK";
}

// 37. narrowing guards preserving through helper
function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((i) => typeof i === "string");
}
function joinIfStrings(v: unknown): string {
  if (isStringArray(v)) return v.join(", ");
  return "";
}

// 38. narrowing with as const discriminant
const EVENTS = ["click", "focus", "blur"] as const;
type DomEvent = (typeof EVENTS)[number];
function isDomEvent(v: string): v is DomEvent {
  return (EVENTS as readonly string[]).includes(v);
}

// ============================================================================
// ADVANCED — never exhaustiveness, assertion functions, complex guards (39–50)
// ============================================================================

// 39. exhaustiveness check with never
type TrafficLight = "red" | "yellow" | "green";
function lightDuration(light: TrafficLight): number {
  switch (light) {
    case "red":    return 60;
    case "yellow": return 5;
    case "green":  return 45;
    default: {
      const _exhaustive: never = light;
      throw new Error(`Unhandled light: ${_exhaustive}`);
    }
  }
}

// 40. discriminated union exhaustion with never fallback
type Action =
  | { type: "ADD"; item: string }
  | { type: "REMOVE"; id: number }
  | { type: "CLEAR" };
function reduce(state: string[], action: Action): string[] {
  switch (action.type) {
    case "ADD":    return [...state, action.item];
    case "REMOVE": return state.filter((_, i) => i !== action.id);
    case "CLEAR":  return [];
    default: {
      const _: never = action;
      return state;
    }
  }
}

// 41. assertion function used as pre-condition
function assertDefined<T>(v: T | null | undefined, label: string): asserts v is T {
  if (v == null) throw new Error(`${label} must not be null/undefined`);
}
function processUser(u: User | null): string {
  assertDefined(u, "user");
  return u.role; // TypeScript knows u is User here
}

// 42. type guard composition — AND of two guards
function isAdminFish(v: unknown): v is Admin & Fish {
  return (
    typeof v === "object" &&
    v !== null &&
    "role" in v &&
    (v as Admin).role === "admin" &&
    "swim" in v
  );
}

// 43. narrowing with generic constraint
function firstElement<T>(arr: T | T[]): T {
  if (Array.isArray(arr)) return arr[0];
  return arr;
}

// 44. narrowing unknown to object safely
function getProperty(v: unknown, key: string): unknown {
  if (typeof v === "object" && v !== null && key in v) {
    return (v as Record<string, unknown>)[key];
  }
  return undefined;
}

// 45. control flow analysis across blocks
function processValue(v: string | number | null): string {
  if (v === null) return "null";
  // v is now string | number
  const doubled = typeof v === "string" ? v + v : v * 2;
  // doubled is string | number
  return String(doubled);
}

// 46. user-defined guard via instanceof + in
function isApiErrorWithStatus(e: unknown, code: number): e is ApiError {
  return e instanceof ApiError && e.status === code;
}

// 47. narrowing with Array.isArray + nested in
function parsePayload(v: unknown): string {
  if (Array.isArray(v)) return v.map(String).join(", ");
  if (typeof v === "object" && v !== null && "message" in v) {
    return String((v as { message: unknown }).message);
  }
  return String(v);
}

// 48. multi-guard predicate combining typeof + length
function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.length > 0;
}
function safeTrim(v: unknown): string {
  if (isNonEmptyString(v)) return v.trim();
  return "";
}

// 49. narrowing generics with conditional
function wrapIfNotArray<T>(v: T | T[]): T[] {
  if (Array.isArray(v)) return v as T[];
  return [v as T];
}

// 50. chained narrowing for complex union
type JsonLeaf   = string | number | boolean | null;
type JsonObj    = { [k: string]: JsonLeaf };
type JsonPayload = JsonLeaf | JsonObj | JsonLeaf[];
function summarize(v: JsonPayload): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return `[${v.length} items]`;
  if (typeof v === "object") return `{${Object.keys(v).join(",")}}`;
  return String(v);
}

// ============================================================================
// Runtime tests
// ============================================================================
console.assert(shout("hi") === "HI", "shout str");
console.assert(shout(5) === "5", "shout num");
console.assert(halve(10) === 5, "halve num");
console.assert(toggle(true) === false, "toggle bool");
console.assert(toggle("x") === true, "toggle str");
console.assert(orDefault(undefined) === "default", "orDefault undef");
console.assert(orDefault("hi") === "hi", "orDefault str");
console.assert(safeUpper(null) === "", "safeUpper null");
console.assert(safeUpper("hi") === "HI", "safeUpper str");
console.assert(formatName(null) === "Anonymous", "formatName null");
console.assert(formatName("alice") === "alice", "formatName str");
console.assert(move({ swim: () => "swimming" }) === "swimming", "fish");
console.assert(move({ fly: () => "flying" }) === "flying", "bird");
console.assert(flatten("hi") === "hi", "flatten str");
console.assert(flatten(["a", "b"]) === "a, b", "flatten arr");
console.assert(getPermissions({ role: "admin", permissions: ["r"] }) .length === 1, "admin perms");
console.assert(getPermissions({ role: "guest" }).length === 0, "guest perms");
console.assert(describeError(new ApiError(404, "Not Found")) === "API 404: Not Found", "api err");
console.assert(describeError(new NetworkError("Timeout")) === "Network: Timeout", "net err");
console.assert(Math.abs(area({ shape: "circle", radius: 1 }) - Math.PI) < 0.001, "circle");
console.assert(area({ shape: "rectangle", width: 3, height: 4 }) === 12, "rect");
console.assert(clamp(null) === 0, "clamp null");
console.assert(clamp(150) === 100, "clamp overflow");
console.assert(strings.length === 2, "filter strings");
console.assert(sumNumbers(["a", 1, "b", 2]) === 3, "sumNumbers");
console.assert(lightDuration("green") === 45, "light");
console.assert(summarize(null) === "null", "summarize null");
console.assert(summarize([1, 2]) === "[2 items]", "summarize arr");
console.assert(safeTrim("  hi  ") === "hi", "safeTrim");
console.assert(safeTrim(42) === "", "safeTrim non-str");
console.log("Examples 1.4 — All assertions passed!");

export {};
