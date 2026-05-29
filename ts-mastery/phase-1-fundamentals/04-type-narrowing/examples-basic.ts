export {};

// ============================================================
// BASIC EXAMPLES — Type Narrowing (50 Examples)
// ============================================================

// 1. typeof narrowing — string
function upper(val: string | number): string {
  if (typeof val === "string") return val.toUpperCase();
  return val.toFixed(2);
}

// 2. typeof narrowing — number
function doubleOrRepeat(x: string | number): string | number {
  if (typeof x === "number") return x * 2;
  return x.repeat(2);
}

// 3. typeof narrowing — boolean
function display(flag: boolean | string): string {
  if (typeof flag === "boolean") return flag ? "yes" : "no";
  return flag;
}

// 4. typeof narrowing — function
function callOrReturn(fn: Function | string): unknown {
  if (typeof fn === "function") return fn();
  return fn;
}

// 5. typeof narrowing — undefined check
function greet(name?: string): string {
  if (typeof name === "undefined") return "Hello, stranger!";
  return `Hello, ${name}!`;
}

// 6. Equality narrowing — literal value
function handle(status: "ok" | "error" | "pending"): string {
  if (status === "ok") return "success";
  if (status === "error") return "failed";
  return "waiting";
}

// 7. Equality narrowing — strict equality with null
function getLength(s: string | null): number {
  if (s === null) return 0;
  return s.length;
}

// 8. Equality narrowing — null and undefined together
function coerce(val: string | null | undefined): string {
  if (val == null) return ""; // catches both null and undefined
  return val;
}

// 9. Truthiness narrowing — falsy removes null/undefined/0/""
function processStr(s: string | null): string {
  if (s) return s.trim();
  return "";
}

// 10. Truthiness narrowing — number
function safeDiv(a: number, b: number | 0): number {
  if (!b) return 0;
  return a / b;
}

// 11. instanceof narrowing — Date
function formatInput(val: string | Date): string {
  if (val instanceof Date) return val.toISOString();
  return val;
}

// 12. instanceof narrowing — Error
function logError(err: Error | string): void {
  if (err instanceof Error) console.error(err.message);
  else console.error(err);
}

// 13. instanceof narrowing — class hierarchy
class Animal { breathe() { return "breathing"; } }
class Dog extends Animal { bark() { return "woof"; } }
class Cat extends Animal { meow() { return "meow"; } }
function makeSound(a: Dog | Cat): string {
  if (a instanceof Dog) return a.bark();
  return a.meow();
}

// 14. "in" operator narrowing — check property existence
type Fish = { swim(): void };
type Bird = { fly(): void };
function move(creature: Fish | Bird): void {
  if ("swim" in creature) creature.swim();
  else creature.fly();
}

// 15. "in" operator — optional property check
type WithLogger = { log: (m: string) => void };
type NoLogger = { silent: true };
function maybeLog(thing: WithLogger | NoLogger, msg: string): void {
  if ("log" in thing) thing.log(msg);
}

// 16. Discriminated union narrowing via shared tag
type Circle = { kind: "circle"; radius: number };
type Square = { kind: "square"; side: number };
type Shape = Circle | Square;
function area(s: Shape): number {
  if (s.kind === "circle") return Math.PI * s.radius ** 2;
  return s.side ** 2;
}

// 17. Discriminated union — switch statement
type Action =
  | { type: "INC" }
  | { type: "DEC" }
  | { type: "SET"; value: number };
function reduce(n: number, a: Action): number {
  switch (a.type) {
    case "INC": return n + 1;
    case "DEC": return n - 1;
    case "SET": return a.value;
  }
}

// 18. User-defined type guard — is predicate
function isString(val: unknown): val is string {
  return typeof val === "string";
}
const raw: unknown = "hello";
if (isString(raw)) raw.toUpperCase(); // safe

// 19. User-defined type guard — object shape
interface User { name: string; age: number }
function isUser(obj: unknown): obj is User {
  return typeof obj === "object" && obj !== null && "name" in obj && "age" in obj;
}

// 20. Type guard narrows array of mixed types
const values: (string | number)[] = ["a", 1, "b", 2];
const strings = values.filter((v): v is string => typeof v === "string");

// 21. Nullish narrowing after null check
function initials(name: string | null): string {
  if (name === null) return "?";
  return name.split(" ").map((w) => w[0]).join(".");
}

// 22. Truthiness narrows union
function titleCase(s: string | ""): string {
  if (!s) return "Untitled";
  return s[0].toUpperCase() + s.slice(1);
}

// 23. Narrowing with Array.isArray
function joinOrRepeat(val: string | string[]): string {
  if (Array.isArray(val)) return val.join(", ");
  return val;
}

// 24. Narrowing assignment (control flow analysis)
let x: string | number;
x = "hello";
x.toUpperCase(); // narrowed to string here
x = 42;
x.toFixed(); // narrowed to number here

// 25. Narrowing from conditional assignment
function parseId(raw: string): number | string {
  const n = Number(raw);
  if (!isNaN(n)) return n;
  return raw;
}

// 26. Narrowing with optional chaining guard
interface Config { server?: { host: string } }
function getHost(cfg: Config): string {
  if (cfg.server) return cfg.server.host; // server narrowed to defined
  return "localhost";
}

// 27. Narrowing — no narrowing needed with generic
function identity<T>(val: T): T { return val; }

// 28. Asserting non-null with !
function getFirst(arr: string[]): string {
  return arr[0]!; // assert non-null/undefined
}

// 29. Non-null assertion in assignment
const input = document.getElementById("myInput");
// const typed = input! as HTMLInputElement; // real browser code

// 30. Narrowing with throw
function requireString(val: unknown): string {
  if (typeof val !== "string") throw new TypeError("Expected string");
  return val; // narrowed to string
}

// 31. Narrowing in while loop
function processQueue(queue: (string | null)[]): string[] {
  const result: string[] = [];
  for (const item of queue) {
    if (item === null) continue;
    result.push(item.toUpperCase()); // narrowed
  }
  return result;
}

// 32. Narrowing with early return
function stringify(val: string | number | boolean): string {
  if (typeof val === "boolean") return val ? "true" : "false";
  if (typeof val === "number") return val.toFixed(2);
  return val; // narrowed to string
}

// 33. Narrowing using length check
function firstChar(val: string | string[]): string {
  if (typeof val === "string") return val[0] ?? "";
  return val[0] ?? "";
}

// 34. Narrowing with regex test
function parseDate(s: string): Date | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s);
  return null;
}

// 35. Narrowing union to single type via filter
const mixed: (string | number)[] = [1, "two", 3, "four"];
const nums = mixed.filter((n): n is number => typeof n === "number");

// 36. Narrowing after Object.keys check
function hasKey<T extends object>(obj: T, key: string): key is keyof T {
  return key in obj;
}

// 37. Narrowing with ternary
function toNumber(val: string | number): number {
  return typeof val === "number" ? val : parseInt(val, 10);
}

// 38. Narrowing undefined with default parameter
function greetUser(name: string | undefined = "Guest"): string {
  return `Hello, ${name}!`; // name is always string here
}

// 39. Narrowing null via logical operator
const maybeStr: string | null = null;
const safe = maybeStr ?? "default"; // safe: string

// 40. Narrowing with satisfies operator
const settings = {
  theme: "dark",
  fontSize: 14,
} satisfies { theme: string; fontSize: number };
// theme is still "dark" literal type

// 41. Narrowing nested property
interface Response { data?: { items: string[] } }
function getItems(r: Response): string[] {
  if (!r.data) return [];
  return r.data.items; // narrowed
}

// 42. Narrowing with try/catch
function parseJSON(s: string): object | null {
  try {
    const parsed = JSON.parse(s);
    if (typeof parsed === "object" && parsed !== null) return parsed;
    return null;
  } catch {
    return null;
  }
}

// 43. Narrowing via explicit boolean conversion
function toBoolean(val: unknown): boolean {
  return Boolean(val);
}

// 44. Narrowing in ternary chain
function classify(n: number): "negative" | "zero" | "positive" {
  return n < 0 ? "negative" : n === 0 ? "zero" : "positive";
}

// 45. Narrowing with template literal check
function isHttpUrl(s: string): s is `http${"s" | ""}://${string}` {
  return s.startsWith("http://") || s.startsWith("https://");
}
const url: string = "https://example.com";
if (isHttpUrl(url)) console.log("valid url:", url);

// 46. Narrowing with Map.has
const map = new Map<string, number>([["a", 1]]);
function getVal(key: string): number {
  if (map.has(key)) return map.get(key)!; // need ! because TS doesn't narrow Map.get
  return 0;
}

// 47. Narrowing Symbol.iterator
function isIterable(val: unknown): val is Iterable<unknown> {
  return val != null && typeof (val as any)[Symbol.iterator] === "function";
}

// 48. Narrowing tuple vs array via length
function isTuple2(arr: number[]): arr is [number, number] {
  return arr.length === 2;
}

// 49. Narrowing by comparing class constructors
class Rectangle2 { constructor(public w: number, public h: number) {} }
class Circle2 { constructor(public r: number) {} }
function describe(shape: Rectangle2 | Circle2): string {
  if (shape.constructor === Rectangle2) return `rect ${shape.w}x${shape.h}`;
  return `circle r=${(shape as Circle2).r}`;
}

// 50. Narrowing via custom predicate on enum-like union
type Level = "info" | "warn" | "error";
const ERROR_LEVELS: Level[] = ["warn", "error"];
function isErrorLevel(l: Level): l is "warn" | "error" {
  return ERROR_LEVELS.includes(l);
}
const level: Level = "warn";
if (isErrorLevel(level)) console.log("Alert:", level);
