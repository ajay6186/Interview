// ============================================================================
// Examples 1.3 — Union & Intersection Types  (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================================

// ============================================================================
// BASIC — primitive unions, literal unions, simple intersections (1–13)
// ============================================================================

// 1. string | number union
type StringOrNumber = string | number;
const val1: StringOrNumber = "hello";
const val2: StringOrNumber = 42;

// 2. three-type union
type Primitive = string | number | boolean;
const prim: Primitive = true;

// 3. nullable type (string | null)
type MaybeName = string | null;
const maybeName: MaybeName = null;

// 4. optional value (string | undefined)
type MaybeAge = number | undefined;
const maybeAge: MaybeAge = undefined;

// 5. literal string union
type Direction = "north" | "south" | "east" | "west";
const dir: Direction = "north";

// 6. literal number union
type HttpStatus = 200 | 301 | 404 | 500;
const status: HttpStatus = 200;

// 7. mixed literal union (string + number)
type IdType = string | number;
const id1: IdType = "abc-123";
const id2: IdType = 99;

// 8. literal boolean union
type Flag = true | false; // equivalent to boolean
const flag: Flag = false;

// 9. simple two-part intersection
type HasName = { name: string };
type HasAge = { age: number };
type NameAndAge = HasName & HasAge;
const person: NameAndAge = { name: "Alice", age: 30 };

// 10. three-part intersection
type HasEmail = { email: string };
type FullContact = HasName & HasAge & HasEmail;
const contact: FullContact = { name: "Bob", age: 25, email: "bob@example.com" };

// 11. union type used in function parameter
function display(value: string | number): string {
  return String(value);
}

// 12. literal union as state
type TrafficLight = "red" | "yellow" | "green";
function canGo(light: TrafficLight): boolean {
  return light === "green";
}

// 13. intersection used as function parameter
function introduce(p: HasName & HasAge): string {
  return `${p.name} is ${p.age}`;
}

// ============================================================================
// INTERMEDIATE — discriminated unions, narrowing, functional patterns (14–26)
// ============================================================================

// 14. discriminated union (2 variants)
type Cat = { kind: "cat"; purrs: boolean };
type Dog = { kind: "dog"; barks: boolean };
type Animal = Cat | Dog;
function describeAnimal(a: Animal): string {
  if (a.kind === "cat") return `Cat, purrs: ${a.purrs}`;
  return `Dog, barks: ${a.barks}`;
}

// 15. discriminated union (3 variants)
type Circle = { shape: "circle"; radius: number };
type Rect = { shape: "rectangle"; width: number; height: number };
type Triangle = { shape: "triangle"; base: number; height: number };
type Shape = Circle | Rect | Triangle;
function area(s: Shape): number {
  switch (s.shape) {
    case "circle":    return Math.PI * s.radius ** 2;
    case "rectangle": return s.width * s.height;
    case "triangle":  return 0.5 * s.base * s.height;
  }
}

// 16. union in function return type
function divide(a: number, b: number): number | string {
  if (b === 0) return "Cannot divide by zero";
  return a / b;
}

// 17. intersection combining method sets
type Readable = { read(): string };
type Writable = { write(data: string): void };
type ReadWrite = Readable & Writable;
const rw: ReadWrite = { read: () => "data", write: (d) => console.log(d) };

// 18. union with null narrowing
function safeLength(s: string | null): number {
  if (s === null) return 0;
  return s.length;
}

// 19. union narrowing with typeof
function double(value: string | number): string | number {
  if (typeof value === "number") return value * 2;
  return value + value;
}

// 20. exclusive-OR pattern via discriminant
type LoadingState = { status: "loading" };
type SuccessState = { status: "success"; data: string[] };
type ErrorState   = { status: "error"; error: Error };
type AsyncState   = LoadingState | SuccessState | ErrorState;
function getMessage(state: AsyncState): string {
  switch (state.status) {
    case "loading": return "Loading…";
    case "success": return state.data.join(", ");
    case "error":   return state.error.message;
  }
}

// 21. intersection to add metadata
type WithCreatedAt = { createdAt: Date };
type ProductRecord = { name: string; price: number } & WithCreatedAt;
const rec: ProductRecord = { name: "Pen", price: 1.5, createdAt: new Date() };

// 22. union of function types
type StringTransform = (s: string) => string;
type NumberTransform = (n: number) => number;
type AnyTransform = StringTransform | NumberTransform;

// 23. union of arrays
type StringOrNumberArray = string[] | number[];
const arr1: StringOrNumberArray = ["a", "b"];
const arr2: StringOrNumberArray = [1, 2, 3];

// 24. literal union for configuration keys
type LogLevel = "debug" | "info" | "warn" | "error";
function log(level: LogLevel, msg: string): void {
  console.log(`[${level.toUpperCase()}] ${msg}`);
}

// 25. intersection of generics
type Stamped<T> = T & { timestamp: number };
const stamped: Stamped<HasName> = { name: "event", timestamp: Date.now() };

// 26. union used as Record key
type Role = "admin" | "editor" | "viewer";
const permissions: Record<Role, string[]> = {
  admin:  ["read", "write", "delete"],
  editor: ["read", "write"],
  viewer: ["read"],
};

// ============================================================================
// NESTED — unions/intersections inside objects, nested discriminated unions (27–38)
// ============================================================================

// 27. union of objects with nested properties
type SuccessResponse = { ok: true;  data: { items: string[]; total: number } };
type FailResponse    = { ok: false; error: { code: number; message: string } };
type ApiResponse = SuccessResponse | FailResponse;
function handleResponse(r: ApiResponse): string {
  if (r.ok) return `Got ${r.data.items.length} items`;
  return `Error ${r.error.code}: ${r.error.message}`;
}

// 28. intersection of nested objects
type HasAddress = { address: { city: string; zip: string } };
type HasPhone   = { phone: { mobile: string; work?: string } };
type FullProfile = HasName & HasAddress & HasPhone;
const profile: FullProfile = {
  name: "Alice",
  address: { city: "NYC", zip: "10001" },
  phone: { mobile: "555-1234" },
};

// 29. union inside an object property
type Notification = {
  id: number;
  payload: { type: "email"; to: string } | { type: "sms"; phone: string };
};
const emailNotif: Notification = { id: 1, payload: { type: "email", to: "a@b.com" } };

// 30. intersection inside union (mixed)
type AdminUser  = HasName & HasAge & { role: "admin"; permissions: string[] };
type GuestUser  = HasName & { role: "guest" };
type User = AdminUser | GuestUser;
function userLabel(u: User): string {
  if (u.role === "admin") return `Admin: ${u.name} (${u.permissions.length} perms)`;
  return `Guest: ${u.name}`;
}

// 31. discriminated union with nested variant data
type TextBlock  = { tag: "text"; content: string };
type ImageBlock = { tag: "image"; src: string; alt: string };
type ListBlock  = { tag: "list"; items: string[]; ordered: boolean };
type ContentBlock = TextBlock | ImageBlock | ListBlock;
function renderBlock(b: ContentBlock): string {
  switch (b.tag) {
    case "text":  return `<p>${b.content}</p>`;
    case "image": return `<img src="${b.src}" alt="${b.alt}" />`;
    case "list":  return b.ordered ? "<ol>" : "<ul>";
  }
}

// 32. union of tuples
type Pair = [string, string];
type Triple = [string, string, string];
type StringTuple = Pair | Triple;
function joinTuple(t: StringTuple): string {
  return t.join("-");
}

// 33. intersection adding readonly layer
type ImmutablePoint = Readonly<{ x: number; y: number }> & { label: string };
const ip: ImmutablePoint = { x: 1, y: 2, label: "A" };

// 34. nested discriminated union (variant inside variant)
type NumberInput  = { kind: "number"; value: number };
type StringInput  = { kind: "string"; value: string };
type CompositeInput = {
  kind: "composite";
  parts: (NumberInput | StringInput)[];
};
type AnyInput = NumberInput | StringInput | CompositeInput;
function countParts(input: AnyInput): number {
  if (input.kind === "composite") return input.parts.length;
  return 1;
}

// 35. union of array-returning functions
type ArrayProducer<T> = (() => T[]) | ((seed: T) => T[]);

// 36. deeply nested intersection
type WithId      = { id: number };
type WithMeta    = { meta: { version: string; author: string } };
type WithContent = { content: { body: string; tags: string[] } };
type Document = WithId & WithMeta & WithContent;
const doc: Document = {
  id: 1,
  meta:    { version: "1.0", author: "Alice" },
  content: { body: "Hello world", tags: ["ts", "example"] },
};

// 37. union narrowed by Array.isArray
function processInput(input: string | string[]): string {
  if (Array.isArray(input)) return input.join(", ");
  return input;
}

// 38. intersection extending a union member
type EnhancedCat = Cat & { indoor: boolean };
const myCat: EnhancedCat = { kind: "cat", purrs: true, indoor: true };

// ============================================================================
// ADVANCED — distributive behavior, exhaustiveness, mapped unions (39–50)
// ============================================================================

// 39. exhaustive switch with never
function exhaustiveCheck(s: Shape): number {
  switch (s.shape) {
    case "circle":    return Math.PI * s.radius ** 2;
    case "rectangle": return s.width * s.height;
    case "triangle":  return 0.5 * s.base * s.height;
    default: {
      const _: never = s;
      throw new Error("Unknown shape");
    }
  }
}

// 40. distributive conditional over union
type ToArray<T> = T extends unknown ? T[] : never;
type StrOrNumArrays = ToArray<string | number>; // string[] | number[]

// 41. union collapse (duplicate members removed)
type Collapsed = string | string | number; // string | number

// 42. intersection identity
type Same = { a: number } & {}; // still { a: number }

// 43. union of function signatures for overload-like behavior
type FormatFn =
  | ((value: number, decimals: number) => string)
  | ((value: string) => string);

// 44. branded type via intersection (prevents accidental assignment)
type UserId = string & { readonly _brand: "UserId" };
function createUserId(raw: string): UserId {
  return raw as UserId;
}
const uid = createUserId("user-42");

// 45. mapped type over union keys
type Status = "active" | "inactive" | "pending";
type StatusLabels = { [K in Status]: string };
const labels: StatusLabels = { active: "Active", inactive: "Inactive", pending: "Pending" };

// 46. discriminated union with default/fallback branch
type KnownEvent  = { type: "click" | "focus"; target: string };
type UnknownEvent = { type: string };
type AnyEvent = KnownEvent | UnknownEvent;
function handleEvent(e: AnyEvent): string {
  if ("target" in e) return `${e.type} on ${e.target}`;
  return `unknown: ${e.type}`;
}

// 47. union narrowed via custom type guard
function isSuccess(r: ApiResponse): r is SuccessResponse {
  return r.ok === true;
}

// 48. intersection with conditional property (discriminant trick)
type Optional<T, K extends keyof T> =
  Omit<T, K> & Partial<Pick<T, K>>;
type OptionalEmail = Optional<FullContact, "email">;

// 49. chain of mapped intersections
type Frozen<T> = { readonly [K in keyof T]: T[K] };
type FrozenContact = Frozen<FullContact>;

// 50. recursive union (JSON value)
type JsonPrimitive = string | number | boolean | null;
type JsonArray    = JsonValue[];
type JsonObject   = { [key: string]: JsonValue };
type JsonValue    = JsonPrimitive | JsonArray | JsonObject;

const json: JsonValue = { name: "Alice", scores: [95, 87], active: true, nickname: null };

// ============================================================================
// Runtime tests
// ============================================================================
console.assert(display("hi") === "hi", "display string");
console.assert(display(5) === "5", "display number");
console.assert(canGo("green") === true, "canGo green");
console.assert(canGo("red") === false, "canGo red");
console.assert(introduce({ name: "Alice", age: 30 }) === "Alice is 30", "introduce");
console.assert(describeAnimal({ kind: "cat", purrs: true }) === "Cat, purrs: true", "cat");
console.assert(describeAnimal({ kind: "dog", barks: false }) === "Dog, barks: false", "dog");
console.assert(Math.abs(area({ shape: "circle", radius: 1 }) - Math.PI) < 0.001, "circle area");
console.assert(area({ shape: "rectangle", width: 3, height: 4 }) === 12, "rect area");
console.assert(area({ shape: "triangle", base: 6, height: 4 }) === 12, "tri area");
console.assert(double("ha") === "haha", "double string");
console.assert(double(5) === 10, "double number");
console.assert(safeLength(null) === 0, "safeLength null");
console.assert(safeLength("abc") === 3, "safeLength str");
console.assert(joinTuple(["a", "b"]) === "a-b", "pair");
console.assert(joinTuple(["a", "b", "c"]) === "a-b-c", "triple");
console.assert(processInput(["x", "y"]) === "x, y", "processInput array");
console.assert(processInput("z") === "z", "processInput str");
console.assert(userLabel({ name: "Alice", age: 30, role: "admin", permissions: ["r"] }) === "Admin: Alice (1 perms)", "admin");
console.assert(userLabel({ name: "Bob", role: "guest" }) === "Guest: Bob", "guest");
console.assert(countParts({ kind: "composite", parts: [{kind:"number",value:1},{kind:"string",value:"x"}] }) === 2, "composite");
console.log("Examples 1.3 — All assertions passed!");

export {};
