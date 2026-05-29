export {};

// ============================================================
// INTERMEDIATE EXAMPLES — Basic Types (50 Examples)
// ============================================================

// 1. Union type: string | number
let id: string | number = "abc-123";
id = 42;

// 2. Union type with null
let nickname: string | null = "Neo";
nickname = null;

// 3. Union type with undefined
let middleName: string | undefined = undefined;

// 4. Three-way union
let httpStatus: 200 | 404 | 500 = 200;

// 5. Type alias for union
type StringOrNumber = string | number;
const mixedId: StringOrNumber = "X1";

// 6. Readonly array
const readonlyNums: readonly number[] = [1, 2, 3];
// readonlyNums.push(4); // Error — readonly

// 7. ReadonlyArray<T> generic form
const readonlyStrs: ReadonlyArray<string> = ["a", "b", "c"];

// 8. Labeled tuple elements
type Point2D = [x: number, y: number];
const origin: Point2D = [0, 0];

// 9. Labeled tuple with optional element
type Range = [start: number, end: number, step?: number];
const r1: Range = [0, 10];
const r2: Range = [0, 100, 5];

// 10. Object type with optional property
const product: { name: string; price: number; discount?: number } = {
  name: "Widget",
  price: 9.99,
};

// 11. Object type with readonly property
const frozen: { readonly id: number; label: string } = {
  id: 1,
  label: "item",
};
// frozen.id = 2; // Error

// 12. Type alias for object shape
type Coordinate = { x: number; y: number };
const coord: Coordinate = { x: 3, y: 4 };

// 13. Index access type
type CoordX = Coordinate["x"]; // number

// 14. keyof operator
type CoordKeys = keyof Coordinate; // "x" | "y"
const key: CoordKeys = "x";

// 15. typeof in type position
const sampleConfig = { host: "localhost", port: 8080 };
type ConfigType = typeof sampleConfig;
const anotherConfig: ConfigType = { host: "example.com", port: 443 };

// 16. Widening — let widens literal to base type
let widened = "hello"; // inferred as string, not "hello"

// 17. Non-null assertion operator
function getLength(s: string | null): number {
  return s!.length; // assert not null
}

// 18. Optional chaining with types
const obj: { nested?: { value: number } } = {};
const val = obj.nested?.value; // number | undefined

// 19. Nullish coalescing assignment
let stored: string | null = null;
stored ??= "default value";

// 20. Logical OR assignment
let count: number | undefined;
count ||= 0;

// 21. Logical AND assignment
let verified: boolean | undefined = true;
verified &&= false;

// 22. as const — narrow to literal
const direction = "north" as const; // type is "north", not string

// 23. as const on object — all props become readonly literals
const config2 = { method: "GET", timeout: 5000 } as const;
// config2.method = "POST"; // Error

// 24. Satisfies operator — checks shape without widening
const palette = {
  red: [255, 0, 0],
  green: "#00ff00",
} satisfies Record<string, string | number[]>;

// 25. Type widening with let vs const
const literalConst = 42; // type: 42
let literalLet = 42;     // type: number

// 26. Enum-like object with as const
const Direction = {
  Up: "UP",
  Down: "DOWN",
  Left: "LEFT",
  Right: "RIGHT",
} as const;
type DirectionType = (typeof Direction)[keyof typeof Direction];

// 27. Extract keys of object type
const colorMap = { red: "#f00", green: "#0f0" } as const;
type ColorName = keyof typeof colorMap; // "red" | "green"

// 28. Index access on const object
type RedValue = (typeof colorMap)["red"]; // "#f00"

// 29. Tuple spread
type Pair = [string, number];
type Extended = [...Pair, boolean];
const extPair: Extended = ["hello", 1, true];

// 30. Rest element in tuple
type AtLeastOne = [string, ...number[]];
const rest1: AtLeastOne = ["label", 1, 2, 3];

// 31. Function overloads — declaration only (impl hidden)
function format(value: string): string;
function format(value: number): string;
function format(value: string | number): string {
  return String(value);
}

// 32. Intersection type for merging objects
type Named = { name: string };
type Aged = { age: number };
type Person = Named & Aged;
const p: Person = { name: "Sam", age: 40 };

// 33. Object spread preserves types
const base = { id: 1, active: true };
const extended = { ...base, role: "admin" };

// 34. Discriminated union with literal type tag
type Success = { ok: true; data: string };
type Failure = { ok: false; error: string };
type Result = Success | Failure;

// 35. Narrowing discriminated union
function handleResult(res: Result): string {
  if (res.ok) return res.data;
  return res.error;
}

// 36. Type alias for function signature
type Transformer = (input: string) => string;
const upper: Transformer = (s) => s.toUpperCase();

// 37. Callback parameter type
function runCallback(fn: (n: number) => void): void {
  fn(42);
}

// 38. Generic type alias (preview — covered more in generics)
type Nullable<T> = T | null;
const maybeStr: Nullable<string> = null;

// 39. Record<K, V> built-in utility
const phoneBook: Record<string, string> = {
  Alice: "555-1234",
  Bob: "555-5678",
};

// 40. Partial<T> built-in utility
type FullConfig = { host: string; port: number; ssl: boolean };
const partialCfg: Partial<FullConfig> = { host: "localhost" };

// 41. Required<T> built-in utility
type OptConfig = { host?: string; port?: number };
type StrictConfig = Required<OptConfig>;
const strictCfg: StrictConfig = { host: "x", port: 80 };

// 42. Readonly<T> built-in utility
type MutablePoint = { x: number; y: number };
const frozenPoint: Readonly<MutablePoint> = { x: 1, y: 2 };
// frozenPoint.x = 3; // Error

// 43. Pick<T, K> built-in utility
type UserFull = { id: number; name: string; email: string; role: string };
type UserPreview = Pick<UserFull, "id" | "name">;
const preview: UserPreview = { id: 1, name: "Alice" };

// 44. Omit<T, K> built-in utility
type UserPublic = Omit<UserFull, "email" | "role">;
const pub: UserPublic = { id: 2, name: "Bob" };

// 45. Exclude<Union, Members> utility
type AllStatuses = "active" | "inactive" | "banned";
type LiveStatuses = Exclude<AllStatuses, "banned">;
const live: LiveStatuses = "active";

// 46. Extract<Union, Members> utility
type Numbers = Extract<string | number | boolean, number>;
const extracted: Numbers = 42;

// 47. NonNullable<T> utility
type MaybeStr = string | null | undefined;
type DefiniteStr = NonNullable<MaybeStr>; // string
const definite: DefiniteStr = "hello";

// 48. ReturnType<F> utility
function getUser() {
  return { id: 1, name: "Alice" };
}
type GetUserReturn = ReturnType<typeof getUser>; // { id: number; name: string }

// 49. Parameters<F> utility
function connect(host: string, port: number): void {}
type ConnectParams = Parameters<typeof connect>; // [string, number]

// 50. ConstructorParameters<C> utility
class Server {
  constructor(public host: string, public port: number) {}
}
type ServerCtorParams = ConstructorParameters<typeof Server>; // [string, number]
