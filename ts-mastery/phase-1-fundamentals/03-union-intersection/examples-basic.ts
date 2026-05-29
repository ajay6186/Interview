export {};

// ============================================================
// BASIC EXAMPLES — Union & Intersection Types (50 Examples)
// ============================================================

// 1. Basic string | number union
let id: string | number = "abc";
id = 42;

// 2. Union with null
let nickname: string | null = "Neo";
nickname = null;

// 3. Union with undefined
let middleName: string | undefined = undefined;

// 4. Boolean union alternative (literal)
let answer: "yes" | "no" = "yes";

// 5. Numeric literal union
let dice: 1 | 2 | 3 | 4 | 5 | 6 = 3;

// 6. String literal union
let direction: "north" | "south" | "east" | "west" = "north";

// 7. Union in function parameter
function format(value: string | number): string {
  return String(value);
}

// 8. Union in function return type
function divide(a: number, b: number): number | null {
  return b === 0 ? null : a / b;
}

// 9. Narrowing union with typeof
function double(x: string | number): string | number {
  if (typeof x === "string") return x.repeat(2);
  return x * 2;
}

// 10. Narrowing union with equality check
function greet(lang: "en" | "fr"): string {
  if (lang === "en") return "Hello";
  return "Bonjour";
}

// 11. Union in array type
const ids: (string | number)[] = [1, "two", 3, "four"];

// 12. Union as type alias
type StringOrNumber = string | number;
const x: StringOrNumber = "hello";

// 13. Literal union type alias
type Status = "active" | "inactive" | "pending";
let userStatus: Status = "active";

// 14. Nullable type alias pattern
type Nullable<T> = T | null;
const maybeStr: Nullable<string> = null;

// 15. Optional type alias pattern
type Maybe<T> = T | undefined;
const maybeNum: Maybe<number> = undefined;

// 16. Simple intersection of two object types
type Named = { name: string };
type Aged = { age: number };
type Person = Named & Aged;
const person: Person = { name: "Alice", age: 30 };

// 17. Intersection adds property to type
type Identified = { id: number };
type NamedIdentified = Named & Identified;
const ni: NamedIdentified = { name: "Bob", id: 1 };

// 18. Intersection of three types
type Timestamped = { createdAt: string };
type Entity = Named & Identified & Timestamped;
const entity: Entity = { name: "Post", id: 42, createdAt: "2024-01-01" };

// 19. Intersection with inline types
type Admin = { name: string } & { role: "admin" } & { level: number };
const admin: Admin = { name: "Alice", role: "admin", level: 3 };

// 20. Union of object types
type Cat = { kind: "cat"; purrs: boolean };
type Dog = { kind: "dog"; barks: boolean };
type Pet = Cat | Dog;
const pet: Pet = { kind: "cat", purrs: true };

// 21. Narrowing object union with "in" operator
function descPet(p: Pet): string {
  if ("purrs" in p) return `Cat purrs: ${p.purrs}`;
  return `Dog barks: ${p.barks}`;
}

// 22. Union with literal discriminant
type Circle = { shape: "circle"; radius: number };
type Square = { shape: "square"; side: number };
type Shape = Circle | Square;
const s: Shape = { shape: "circle", radius: 5 };

// 23. Narrowing discriminated union
function area(shape: Shape): number {
  if (shape.shape === "circle") return Math.PI * shape.radius ** 2;
  return shape.shape === "square" ? shape.side ** 2 : 0;
}

// 24. Union in return type with narrowing at call site
function getInput(): string | number {
  return Math.random() > 0.5 ? "hello" : 42;
}
const raw = getInput();
if (typeof raw === "string") raw.toUpperCase();

// 25. Intersection preserves all methods
type Flyable = { fly(): void };
type Swimmable = { swim(): void };
type Amphibian = Flyable & Swimmable;
const frog: Amphibian = {
  fly: () => console.log("fly"),
  swim: () => console.log("swim"),
};

// 26. Union with boolean
type Result = boolean | string;
const res: Result = true;

// 27. Intersection narrows overlapping property to never
// (when types conflict, result is never for that prop)
type A = { x: string };
type B = { x: number };
type AB = A & B;
// AB["x"] is string & number = never

// 28. Union used in conditional (truthiness narrowing)
function process(val: string | 0): string {
  if (!val) return "empty";
  return val.toUpperCase(); // narrowed to string
}

// 29. Nullish union narrowing
function getLength(s: string | null | undefined): number {
  return s?.length ?? 0;
}

// 30. Discriminated union switch
type Action =
  | { type: "INCREMENT" }
  | { type: "DECREMENT" }
  | { type: "RESET"; value: number };
function reducer(state: number, action: Action): number {
  switch (action.type) {
    case "INCREMENT": return state + 1;
    case "DECREMENT": return state - 1;
    case "RESET": return action.value;
  }
}

// 31. Union | undefined for optional returns
function find(arr: number[], val: number): number | undefined {
  return arr.find((n) => n === val);
}

// 32. Intersection for mixin pattern
type Loggable = { log(msg: string): void };
type Configurable = { configure(opts: object): void };
type Service = Loggable & Configurable & { name: string };

// 33. Union used as function overload shorthand
function pad(value: string | number, size: number): string {
  return String(value).padStart(size, "0");
}

// 34. Union of array types
type MixedArray = string[] | number[];
const arr1: MixedArray = ["a", "b"];
const arr2: MixedArray = [1, 2, 3];

// 35. Intersection for role-based object
type BaseUser = { id: number; name: string };
type AdminRole = { role: "admin"; permissions: string[] };
type AdminUser = BaseUser & AdminRole;
const au: AdminUser = { id: 1, name: "Alice", role: "admin", permissions: ["write"] };

// 36. Union narrowing with instanceof
function printDate(d: Date | string): string {
  if (d instanceof Date) return d.toISOString();
  return d;
}

// 37. Union of function types
type Handler = ((event: string) => void) | ((event: string, data: unknown) => void);

// 38. Intersection function types (rare — callable & properties)
type LogFn = ((msg: string) => void) & { level: "info" | "warn" | "error" };

// 39. Union fallback with default
function coerce(val: string | number | boolean): string {
  if (typeof val === "boolean") return val ? "true" : "false";
  return String(val);
}

// 40. Union in generic constraint
function first<T extends string | number>(arr: T[]): T | undefined {
  return arr[0];
}

// 41. Intersection with required and partial
type RequiredName = { name: string };
type OptionalAge = { age?: number };
type Profile = RequiredName & OptionalAge;
const p: Profile = { name: "Dan" };

// 42. Union type for HTTP status
type OkStatus = 200 | 201 | 204;
type ErrStatus = 400 | 401 | 403 | 404 | 500;
type HttpStatus = OkStatus | ErrStatus;
const code: HttpStatus = 404;

// 43. Intersection adds readonly constraint
type Mutable = { x: number; y: number };
type ReadonlyPoint = Mutable & Readonly<{ z: number }>;
const rp: ReadonlyPoint = { x: 1, y: 2, z: 3 };

// 44. Union for error result pattern
type Ok<T> = { ok: true; value: T };
type Err<E> = { ok: false; error: E };
type Result2<T, E = string> = Ok<T> | Err<E>;
const good: Result2<number> = { ok: true, value: 42 };
const bad: Result2<number> = { ok: false, error: "not found" };

// 45. Narrowing Result type
function unwrap<T>(result: Result2<T>): T {
  if (result.ok) return result.value;
  throw new Error(result.error);
}

// 46. Union of class instances
class Cat2 { meow() { return "meow"; } }
class Dog2 { bark() { return "woof"; } }
let animal: Cat2 | Dog2 = new Cat2();
if (animal instanceof Cat2) animal.meow();

// 47. Intersection for API response shape
type Meta = { page: number; total: number };
type DataWrapper<T> = { data: T } & Meta;
const users: DataWrapper<string[]> = { data: ["Alice"], page: 1, total: 1 };

// 48. Union with void in callback
function run(cb: (() => void) | null): void {
  cb?.();
}

// 49. Intersection of generics
type Combined<A, B> = A & B;
const c: Combined<{ x: number }, { y: number }> = { x: 1, y: 2 };

// 50. Union exhaustion check with never
type Color = "red" | "green" | "blue";
function colorHex(c: Color): string {
  switch (c) {
    case "red":   return "#ff0000";
    case "green": return "#00ff00";
    case "blue":  return "#0000ff";
    default: const _: never = c; return _;
  }
}
