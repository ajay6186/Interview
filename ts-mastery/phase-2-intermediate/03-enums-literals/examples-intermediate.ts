export {};

// ── Intermediate Enum & Literal Type Examples ────────────────────────────────

// 1. Enum-driven discriminated union reducer
const enum CounterAction { Increment = "INC", Decrement = "DEC", Reset = "RESET" }
type CounterEvent =
  | { type: CounterAction.Increment; by: number }
  | { type: CounterAction.Decrement; by: number }
  | { type: CounterAction.Reset };
function counterReducer(state: number, event: CounterEvent): number {
  switch (event.type) {
    case CounterAction.Increment: return state + event.by;
    case CounterAction.Decrement: return state - event.by;
    case CounterAction.Reset:     return 0;
  }
}

// 2. Reverse mapping utility for numeric enums
enum Level { Debug = 0, Info = 1, Warn = 2, Error = 3 }
function levelFromString(name: string): Level | undefined {
  const key = name as keyof typeof Level;
  return Level[key] as Level | undefined;
}
const lvl = levelFromString("Warn"); // Level.Warn

// 3. Enum-based state machine
enum TrafficState { Red = "RED", Yellow = "YELLOW", Green = "GREEN" }
const transitions: Record<TrafficState, TrafficState> = {
  [TrafficState.Red]:    TrafficState.Green,
  [TrafficState.Green]:  TrafficState.Yellow,
  [TrafficState.Yellow]: TrafficState.Red,
};
function nextState(state: TrafficState): TrafficState {
  return transitions[state];
}

// 4. Literal union as finite state
type LoadState = "idle" | "loading" | "success" | "error";
type LoadTransition = {
  idle: "loading";
  loading: "success" | "error";
  success: "idle";
  error: "idle";
};
function canTransition<S extends LoadState>(from: S, to: LoadTransition[S]): boolean {
  return true; // compile-time validated
}
canTransition("idle", "loading");
canTransition("loading", "success");

// 5. Mapped type over enum values
enum Theme { Light = "light", Dark = "dark", System = "system" }
type ThemeConfig = { [K in Theme]: { bg: string; fg: string } };
const themeConfig: ThemeConfig = {
  [Theme.Light]:  { bg: "#fff", fg: "#000" },
  [Theme.Dark]:   { bg: "#000", fg: "#fff" },
  [Theme.System]: { bg: "auto", fg: "auto" },
};

// 6. Enum subset type with Extract
enum Permission { Read = "read", Write = "write", Delete = "delete", Admin = "admin" }
type ReadOnlyPermission = Extract<Permission, Permission.Read>;
const ro: ReadOnlyPermission = Permission.Read;

// 7. Exclude enum value
type NonAdminPermission = Exclude<Permission, Permission.Admin>;
const np: NonAdminPermission = Permission.Write;

// 8. Literal union exhaustive check
type Shape = "circle" | "square" | "triangle";
function areaLabel(shape: Shape): string {
  switch (shape) {
    case "circle":   return "πr²";
    case "square":   return "s²";
    case "triangle": return "½bh";
    default:
      const _x: never = shape;
      return _x;
  }
}

// 9. String enum with type guard
enum Fruit { Apple = "apple", Banana = "banana", Cherry = "cherry" }
function isFruit(s: string): s is Fruit {
  return Object.values(Fruit).includes(s as Fruit);
}
const maybeFruit = "apple";
if (isFruit(maybeFruit)) {
  const f: Fruit = maybeFruit; // Fruit.Apple
}

// 10. `as const` object acting as enum + type helper
const Alignment = { Left: "left", Center: "center", Right: "right" } as const;
type Alignment = typeof Alignment[keyof typeof Alignment];
function align(a: Alignment) { return a; }
align(Alignment.Left);

// 11. Template literal type from enum
enum ApiVersion { V1 = "v1", V2 = "v2" }
type ApiRoute = `/${ApiVersion}/${string}`;
const route: ApiRoute = "/v1/users";

// 12. Numeric enum with bit flags
enum Access {
  None    = 0,
  Read    = 1 << 0,
  Write   = 1 << 1,
  Execute = 1 << 2,
}
function grantAccess(base: Access, extra: Access): Access {
  return base | extra;
}
function checkAccess(perms: Access, required: Access): boolean {
  return (perms & required) === required;
}
const userPerms = grantAccess(Access.Read, Access.Write);
checkAccess(userPerms, Access.Execute); // false

// 13. Record mapped over literal union
type StatusCode = 200 | 201 | 400 | 404 | 500;
const statusMessages: Record<StatusCode, string> = {
  200: "OK",
  201: "Created",
  400: "Bad Request",
  404: "Not Found",
  500: "Internal Server Error",
};

// 14. Literal type widening with union helper
type Widen<T> = T extends string ? string : T extends number ? number : T;
type W = Widen<"hello">; // string

// 15. Const enum as key in Record
const enum Season { Spring = "spring", Summer = "summer", Autumn = "autumn", Winter = "winter" }
const seasonEmoji: Record<Season, string> = {
  [Season.Spring]: "🌸",
  [Season.Summer]: "☀️",
  [Season.Autumn]: "🍂",
  [Season.Winter]: "❄️",
};

// 16. Discriminated union with enum tag
enum ShapeKind { Circle = "circle", Rectangle = "rectangle" }
type ShapeVariant =
  | { kind: ShapeKind.Circle; radius: number }
  | { kind: ShapeKind.Rectangle; width: number; height: number };
function area(shape: ShapeVariant): number {
  if (shape.kind === ShapeKind.Circle) return Math.PI * shape.radius ** 2;
  return shape.width * shape.height;
}

// 17. Enum-keyed function map
enum MathOp { Add = "add", Sub = "sub", Mul = "mul", Div = "div" }
const ops: Record<MathOp, (a: number, b: number) => number> = {
  [MathOp.Add]: (a, b) => a + b,
  [MathOp.Sub]: (a, b) => a - b,
  [MathOp.Mul]: (a, b) => a * b,
  [MathOp.Div]: (a, b) => a / b,
};
const result2 = ops[MathOp.Add](3, 4); // 7

// 18. Literal type conditional
type IsString<T> = T extends string ? true : false;
type C = IsString<"hello">; // true
type D = IsString<42>;      // false

// 19. Enum with namespace for grouping
namespace HTTP {
  export enum Method { GET = "GET", POST = "POST", PUT = "PUT", DELETE = "DELETE" }
  export enum Header { ContentType = "Content-Type", Accept = "Accept" }
}
function sendRequest(method: HTTP.Method, url: string) {
  return fetch(url, { method });
}

// 20. `satisfies` operator with enum record
const colorMap = {
  [Theme.Light]:  "#ffffff",
  [Theme.Dark]:   "#000000",
  [Theme.System]: "#888888",
} satisfies Record<Theme, string>;

// 21. Infer literal from generic
function identity2<T extends string>(val: T): T { return val; }
const x2 = identity2("hello"); // type is "hello"

// 22. Mapped type with enum keys
type EnumFlags<E extends string> = { [K in E]: boolean };
type FeatureFlags = EnumFlags<"darkMode" | "betaFeature" | "analytics">;
const flags: FeatureFlags = { darkMode: true, betaFeature: false, analytics: true };

// 23. Numeric enum with comparison guard
enum Rating { Poor = 1, Fair = 2, Good = 3, Excellent = 4 }
function isGoodOrBetter(r: Rating): boolean { return r >= Rating.Good; }

// 24. String literal union from object values
const events2 = { click: "click", focus: "focus", blur: "blur" } as const;
type DOMEvent = typeof events2[keyof typeof events2];
function handleEvent(e: DOMEvent) { console.log(e); }

// 25. Exhaustive pattern match with enum
enum Weekday { Mon, Tue, Wed, Thu, Fri, Sat, Sun }
function isWorkday(d: Weekday): boolean {
  switch (d) {
    case Weekday.Mon:
    case Weekday.Tue:
    case Weekday.Wed:
    case Weekday.Thu:
    case Weekday.Fri: return true;
    case Weekday.Sat:
    case Weekday.Sun: return false;
    default:
      const _never: never = d;
      return _never;
  }
}

// 26. Const enum in generic constraint
const enum LogLevel { Verbose = 0, Debug = 1, Info = 2, Warn = 3, Error = 4 }
function log2<L extends LogLevel>(level: L, msg: string): void {
  if (level >= LogLevel.Warn) console.warn(msg);
  else console.log(msg);
}

// 27. Template literal union from two literal unions
type Variant = "primary" | "secondary";
type Size2 = "sm" | "md" | "lg";
type ButtonClass = `btn-${Variant}-${Size2}`;
const cls: ButtonClass = "btn-primary-md";

// 28. Enum array iteration
const allDirections = [Direction2.Up, Direction2.Down, Direction2.Left, Direction2.Right];
enum Direction2 { Up = "UP", Down = "DOWN", Left = "LEFT", Right = "RIGHT" }
function moveAll(dirs: Direction2[]): string {
  return dirs.map(d => d.toLowerCase()).join(", ");
}

// 29. `keyof typeof` for enum name lookup
enum Font { Serif = "serif", SansSerif = "sans-serif", Monospace = "monospace" }
type FontKey = keyof typeof Font; // "Serif" | "SansSerif" | "Monospace"
function getFontByKey(key: FontKey): Font { return Font[key]; }

// 30. Literal type object shape with `as const`
const gradients = {
  sunset: ["#f97316", "#ec4899"],
  ocean:  ["#3b82f6", "#06b6d4"],
} as const;
type GradientName = keyof typeof gradients;
type GradientColors = typeof gradients[GradientName];

// 31. Enum in function overload
enum Currency { USD = "USD", EUR = "EUR", GBP = "GBP" }
function convert(amount: number, from: Currency.USD, to: Currency.EUR): number;
function convert(amount: number, from: Currency.EUR, to: Currency.USD): number;
function convert(amount: number, from: Currency, to: Currency): number {
  return amount; // simplified
}

// 32. Literal type annotation on array
const httpMethods = ["GET", "POST", "PUT", "DELETE"] as const;
type HttpMethod2 = typeof httpMethods[number];
function isHttpMethod(s: string): s is HttpMethod2 {
  return (httpMethods as readonly string[]).includes(s);
}

// 33. Enum for CSS units
enum CSSUnit2 { px = "px", em = "em", rem = "rem", pct = "%" }
function px(n: number): `${number}${CSSUnit2.px}` { return `${n}px`; }
const fontSize = px(16); // "16px"

// 34. Intersection of literal types
type HasName = { name: string };
type HasAge = { age: 18 | 21 | 25 | 30 };
type Person2 = HasName & HasAge;
const adult: Person2 = { name: "Alice", age: 18 };

// 35. Mapped type narrowing by enum
enum FieldType { Text = "text", Number = "number", Boolean = "boolean" }
type FieldValue = {
  [FieldType.Text]: string;
  [FieldType.Number]: number;
  [FieldType.Boolean]: boolean;
};
function getField<T extends FieldType>(type: T): FieldValue[T] {
  return "" as FieldValue[T]; // simplified
}

// 36. Const enum bit flags helper
const enum Mode { None = 0, Read = 1, Write = 2, Execute = 4 }
function setMode(modes: Mode[]): number { return modes.reduce((acc, m) => acc | m, 0); }
const rwMode = setMode([Mode.Read, Mode.Write]); // 3

// 37. String literal brand alias
type Slug = string & { readonly _brand: "Slug" };
function toSlug(s: string): Slug { return s.toLowerCase().replace(/\s+/g, "-") as Slug; }
const slug: Slug = toSlug("Hello World");

// 38. Enum + generic constraint
enum OrderStatus { Pending = "pending", Shipped = "shipped", Delivered = "delivered" }
function filterByStatus<S extends OrderStatus>(orders: { status: OrderStatus }[], s: S) {
  return orders.filter(o => o.status === s) as { status: S }[];
}

// 39. Literal type from mapped type key
type EventTypes = { click: MouseEvent; keydown: KeyboardEvent; focus: FocusEvent };
type EventKey = keyof EventTypes;
function listen<K extends EventKey>(event: K, handler: (e: EventTypes[K]) => void) {
  document.addEventListener(event, handler as EventListener);
}

// 40. String enum vs const object comparison
// String enum: tree-shakeable, has reverse mapping disabled
enum LogType { Info = "info", Error = "error" }
// Const object: lighter, flexible
const LOG = { Info: "info", Error: "error" } as const;
type LogType2 = typeof LOG[keyof typeof LOG];

// 41. Numeric enum max value
enum Priority2 { Low = 1, Medium = 5, High = 10, Critical = 100 }
const maxPriority = Math.max(...Object.values(Priority2).filter(v => typeof v === "number") as number[]);

// 42. Template literal type with union expansion
type Method2 = "get" | "post";
type Path2 = "/users" | "/posts";
type ApiEndpoint = `${Uppercase<Method2>} ${Path2}`;
const ep: ApiEndpoint = "GET /users";

// 43. Enum-driven config object
enum Environment { Dev = "dev", Staging = "staging", Prod = "prod" }
const configs2: Record<Environment, { apiUrl: string; debug: boolean }> = {
  [Environment.Dev]:     { apiUrl: "http://localhost:3000", debug: true },
  [Environment.Staging]: { apiUrl: "https://staging.api.com", debug: true },
  [Environment.Prod]:    { apiUrl: "https://api.com",         debug: false },
};

// 44. Literal union type guard
type Primitive = string | number | boolean;
function isPrimitive(v: unknown): v is Primitive {
  return typeof v === "string" || typeof v === "number" || typeof v === "boolean";
}

// 45. Const assertion on function result
function makePoint(x: number, y: number) { return [x, y] as const; }
type Point3 = ReturnType<typeof makePoint>; // readonly [number, number]

// 46. Enum used as discriminant key
enum MessageKind { Text = "text", Image = "image", File = "file" }
type Message =
  | { kind: MessageKind.Text; content: string }
  | { kind: MessageKind.Image; url: string; alt: string }
  | { kind: MessageKind.File; filename: string; size: number };
function renderMessage(msg: Message): string {
  switch (msg.kind) {
    case MessageKind.Text:  return msg.content;
    case MessageKind.Image: return `<img src="${msg.url}" alt="${msg.alt}"/>`;
    case MessageKind.File:  return `📎 ${msg.filename} (${msg.size}B)`;
  }
}

// 47. Literal type from conditional
type Stringify<T> = T extends string ? T : `${Extract<T, number | boolean>}`;
type S1 = Stringify<42>;   // "42"
type S2 = Stringify<true>; // "true"

// 48. Enum with generic function for type-safe access
function getEnumValue<E extends Record<string, string>>(enumObj: E, key: keyof E): E[keyof E] {
  return enumObj[key];
}
const method3 = getEnumValue(HTTP.Method, "GET"); // HTTP.Method.GET

// 49. Const enum in bitwise operations
const enum Flag { A = 1 << 0, B = 1 << 1, C = 1 << 2 }
function hasFlag(flags: number, flag: Flag): boolean { return (flags & flag) !== 0; }
const myFlags = Flag.A | Flag.C;
hasFlag(myFlags, Flag.B); // false

// 50. Enum with decorator-like metadata map
enum Endpoint3 { Users = "/users", Posts = "/posts", Auth = "/auth/login" }
const endpointMeta: Record<Endpoint3, { protected: boolean; cacheable: boolean }> = {
  [Endpoint3.Users]: { protected: true,  cacheable: true  },
  [Endpoint3.Posts]: { protected: false, cacheable: true  },
  [Endpoint3.Auth]:  { protected: false, cacheable: false },
};
