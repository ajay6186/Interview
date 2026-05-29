export {};

// ── Basic Enum & Literal Type Examples ──────────────────────────────────────

// 1. Numeric enum
enum Direction {
  Up,
  Down,
  Left,
  Right,
}
const dir: Direction = Direction.Up;

// 2. Numeric enum with explicit values
enum HttpStatus {
  OK = 200,
  NotFound = 404,
  InternalServerError = 500,
}
const status: HttpStatus = HttpStatus.OK;

// 3. String enum
enum Color {
  Red = "RED",
  Green = "GREEN",
  Blue = "BLUE",
}
const color: Color = Color.Red;

// 4. Heterogeneous enum (mixed)
enum BoolLike {
  No = 0,
  Yes = "YES",
}
const flag: BoolLike = BoolLike.Yes;

// 5. Enum in a function parameter
function move(direction: Direction): string {
  return `Moving ${Direction[direction]}`;
}
move(Direction.Left);

// 6. Enum member access by name
const colorName: string = Color.Green; // "GREEN"

// 7. Reverse mapping for numeric enums
const dirName: string = Direction[Direction.Down]; // "Down"

// 8. Enum in a switch statement
function describe(status: HttpStatus): string {
  switch (status) {
    case HttpStatus.OK:                return "Success";
    case HttpStatus.NotFound:          return "Not found";
    case HttpStatus.InternalServerError: return "Server error";
  }
}

// 9. Const enum — erased at compile time
const enum Size {
  Small = "SM",
  Medium = "MD",
  Large = "LG",
}
const sz: Size = Size.Medium;

// 10. Const enum numeric
const enum Priority {
  Low = 1,
  Medium = 2,
  High = 3,
}
const p: Priority = Priority.High;

// 11. String literal type
type Greeting = "hello" | "goodbye";
const greet: Greeting = "hello";

// 12. Numeric literal type
type DiceRoll = 1 | 2 | 3 | 4 | 5 | 6;
const roll: DiceRoll = 3;

// 13. Boolean literal type
type IsEnabled = true | false; // same as boolean
const enabled: IsEnabled = true;

// 14. Template literal type
type EventName = `on${string}`;
const ev: EventName = "onClick";

// 15. Literal type in function return
function getEnv(): "development" | "production" | "test" {
  return "development";
}

// 16. `as const` to narrow to literal types
const palette = ["red", "green", "blue"] as const;
type PaletteColor = typeof palette[number]; // "red" | "green" | "blue"

// 17. Object `as const`
const endpoints = {
  users: "/api/users",
  posts: "/api/posts",
} as const;
type Endpoint = typeof endpoints[keyof typeof endpoints];

// 18. Enum values used as types
type OkStatus = HttpStatus.OK;
const ok: OkStatus = HttpStatus.OK;

// 19. Literal type union narrowing
function handleSize(size: "sm" | "md" | "lg"): number {
  if (size === "sm") return 8;
  if (size === "md") return 16;
  return 24;
}

// 20. Enum as object key
const statusMessages: { [key in HttpStatus]: string } = {
  [HttpStatus.OK]: "OK",
  [HttpStatus.NotFound]: "Not Found",
  [HttpStatus.InternalServerError]: "Internal Server Error",
};

// 21. String enum in discriminated union
enum ActionType {
  Increment = "INCREMENT",
  Decrement = "DECREMENT",
  Reset = "RESET",
}
type Action =
  | { type: ActionType.Increment; amount: number }
  | { type: ActionType.Decrement; amount: number }
  | { type: ActionType.Reset };

// 22. Enum comparison
const isOk = status === HttpStatus.OK;

// 23. Literal type with default parameter
function log(level: "info" | "warn" | "error" = "info", msg: string): void {
  console.log(`[${level}] ${msg}`);
}

// 24. Tuple with literal types
type Point2D = [x: number, y: number];
const pt: Point2D = [0, 0];

// 25. Const assertion on nested object
const config = {
  env: "production",
  port: 3000,
  db: { host: "localhost" },
} as const;
type DbHost = typeof config["db"]["host"]; // "localhost"

// 26. Enum used in array
const validDirections: Direction[] = [Direction.Up, Direction.Down];

// 27. String enum for HTTP methods
enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  PATCH = "PATCH",
}
function request(url: string, method: HttpMethod): void {
  console.log(`${method} ${url}`);
}

// 28. Literal inference in objects
const btn = { type: "submit" } as const;
type BtnType = typeof btn.type; // "submit"

// 29. Enum in interface
interface Event2 {
  type: ActionType;
  timestamp: Date;
}

// 30. String literal union as parameter constraint
function setAlignment(align: "left" | "center" | "right"): void {
  console.log("Align:", align);
}

// 31. Numeric literal comparison
type IsZero<N extends number> = N extends 0 ? true : false;
type A = IsZero<0>; // true
type B = IsZero<1>; // false

// 32. Enum in conditional expression
function isSuccess(s: HttpStatus): boolean {
  return s === HttpStatus.OK;
}

// 33. Literal type widening prevention
const narrow = "hello" as const;
type Narrow = typeof narrow; // "hello" (not string)

// 34. `satisfies` with literal type
const theme = {
  primary: "#ff0000",
  secondary: "#00ff00",
} satisfies Record<string, string>;

// 35. Const enum usage in conditional
const enum Weekday { Mon = 1, Tue, Wed, Thu, Fri, Sat, Sun }
function isWeekend(day: Weekday): boolean {
  return day === Weekday.Sat || day === Weekday.Sun;
}

// 36. Enum extending via re-export pattern
enum BaseStatus { Active = "ACTIVE", Inactive = "INACTIVE" }
// can't truly extend enums, but can create alias unions
type ExtendedStatus = BaseStatus | "PENDING";
const es: ExtendedStatus = "PENDING";

// 37. Literal type in generic constraint
function echo<T extends "ping" | "pong">(val: T): T { return val; }
const pong = echo("pong"); // type is "pong"

// 38. Object literal with enum values as keys (satisfies)
const dirLabels = {
  [Direction.Up]: "Up",
  [Direction.Down]: "Down",
  [Direction.Left]: "Left",
  [Direction.Right]: "Right",
} satisfies Record<Direction, string>;

// 39. Numeric literal as index type
type Matrix3x3 = [[number, number, number], [number, number, number], [number, number, number]];
type FirstRow = Matrix3x3[0]; // [number, number, number]

// 40. Template literal union
type CSSUnit = "px" | "em" | "rem" | "%";
type CSSValue = `${number}${CSSUnit}`;
const fs: CSSValue = "16px";

// 41. Enum namespace access
namespace HttpStatusGroup {
  export enum Success { OK = 200, Created = 201 }
  export enum Error { NotFound = 404, ServerError = 500 }
}
const created = HttpStatusGroup.Success.Created; // 201

// 42. Literal type array with `as const`
const roles = ["admin", "user", "guest"] as const;
type Role = typeof roles[number];
function hasRole(role: Role): boolean { return roles.includes(role); }

// 43. Enum computed member
enum FileAccess {
  None,
  Read = 1 << 1,
  Write = 1 << 2,
  ReadWrite = Read | Write,
}
const rw = FileAccess.ReadWrite; // 6

// 44. Literal type default function
function createTag(tag: "div" | "span" | "p" = "div"): string {
  return `<${tag}></${tag}>`;
}

// 45. Enum in class property
class Button {
  constructor(public size: Size = Size.Medium) {}
}
const btn2 = new Button();

// 46. `as const` on function return
function getConfig() {
  return { mode: "dark", lang: "en" } as const;
}
type AppConfig = ReturnType<typeof getConfig>;

// 47. Literal type narrowing in `if`
function padStart(s: string, fill: "0" | " "): string {
  return fill === "0" ? s.padStart(10, "0") : s.padStart(10, " ");
}

// 48. Enum bitflag pattern
enum Permission {
  None   = 0,
  Read   = 1 << 0,
  Write  = 1 << 1,
  Execute = 1 << 2,
  All    = Read | Write | Execute,
}
function hasPermission(userPerms: Permission, required: Permission): boolean {
  return (userPerms & required) === required;
}
hasPermission(Permission.All, Permission.Read); // true

// 49. String literal type alias
type UUID = `${string}-${string}-${string}-${string}-${string}`;
const id: UUID = "550e8400-e29b-41d4-a716-446655440000";

// 50. Const object used as enum replacement
const STATUS = {
  PENDING: "pending",
  ACTIVE: "active",
  CLOSED: "closed",
} as const;
type Status2 = typeof STATUS[keyof typeof STATUS];
const currentStatus: Status2 = STATUS.ACTIVE;
