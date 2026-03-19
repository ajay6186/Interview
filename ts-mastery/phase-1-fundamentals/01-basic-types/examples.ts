// ============================================================================
// Examples 1.1 — Basic Types  (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================================

// ============================================================================
// BASIC — primitives, arrays, tuples, simple functions (Examples 1–13)
// ============================================================================

// 1. string
const firstName: string = "Alice";

// 2. number (integer)
const age: number = 25;

// 3. number (float)
const price: number = 9.99;

// 4. boolean
const isActive: boolean = true;

// 5. null
const empty: null = null;

// 6. undefined
const notSet: undefined = undefined;

// 7. bigint
const bigNum: bigint = 9007199254740993n;

// 8. symbol
const uniqueId: symbol = Symbol("id");

// 9. string array (bracket syntax)
const fruits: string[] = ["apple", "banana", "cherry"];

// 10. number array (generic syntax)
const primes: Array<number> = [2, 3, 5, 7, 11];

// 11. basic 2-element tuple
const point: [number, number] = [10, 20];

// 12. heterogeneous tuple
const record: [string, number, boolean] = ["Alice", 30, true];

// 13. void return type
function logMessage(msg: string): void {
  console.log(msg);
}

// ============================================================================
// INTERMEDIATE — readonly, aliases, unknown/never, object annotations (14–26)
// ============================================================================

// 14. readonly array
const constants: readonly number[] = [1, 2, 3];

// 15. ReadonlyArray<T> generic
const readonlyColors: ReadonlyArray<string> = ["red", "green", "blue"];

// 16. readonly tuple
const pair: readonly [string, number] = ["Bob", 42];

// 17. optional tuple element
type NameAge = [string, number?];
const nameOnly: NameAge = ["Carol"];
const nameAndAge: NameAge = ["Dave", 28];

// 18. rest element in tuple
type LabeledNumbers = [string, ...number[]];
const labeled: LabeledNumbers = ["scores", 90, 85, 78];

// 19. type alias for a primitive
type UserId = string;
const userId: UserId = "user-001";

// 20. literal union as a "ranged" number type
type Rating = 1 | 2 | 3 | 4 | 5;
const stars: Rating = 4;

// 21. unknown (safe alternative to any)
const raw: unknown = JSON.parse('{"x":1}');

// 22. any (escape hatch — use sparingly)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const legacyData: any = { foo: "bar" };

// 23. never — function that never returns (throws)
function fail(msg: string): never {
  throw new Error(msg);
}

// 24. function with explicit numeric return type
function multiply(a: number, b: number): number {
  return a * b;
}

// 25. function with string return type
function repeat(str: string, times: number): string {
  return str.repeat(times);
}

// 26. inline object type annotation
const origin: { x: number; y: number } = { x: 0, y: 0 };

// ============================================================================
// NESTED — objects in objects, arrays of objects, functions ↔ objects (27–38)
// ============================================================================

// 27. named nested object types
type Address = { street: string; city: string; zip: string };
type PersonWithAddress = { name: string; address: Address };
const alice: PersonWithAddress = {
  name: "Alice",
  address: { street: "123 Main St", city: "Springfield", zip: "12345" },
};

// 28. array of typed objects
type Point2D = { x: number; y: number };
const triangle: Point2D[] = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 2, y: 3 }];

// 29. object with an array property
type Playlist = { name: string; tracks: string[] };
const chill: Playlist = { name: "Chill", tracks: ["Song A", "Song B"] };

// 30. tuple whose second element is an object
type Measurement = [string, { value: number; unit: string }];
const temp: Measurement = ["temperature", { value: 36.6, unit: "°C" }];

// 31. array of tuples
const entries: [string, number][] = [["a", 1], ["b", 2], ["c", 3]];

// 32. 2-D matrix (nested arrays)
const matrix: number[][] = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];

// 33. function returning an object
function makePoint(x: number, y: number): { x: number; y: number } {
  return { x, y };
}

// 34. function accepting an object
function distanceTo(p: { x: number; y: number }): number {
  return Math.sqrt(p.x ** 2 + p.y ** 2);
}

// 35. object with a function property
type Formatter = { format: (value: number) => string };
const currencyFmt: Formatter = { format: (n) => `$${n.toFixed(2)}` };

// 36. nested optional properties
type ServerConfig = {
  server: { host: string; port?: number };
  debug?: boolean;
};
const cfg: ServerConfig = { server: { host: "localhost" } };

// 37. 3-D array
const cube: number[][][] = [[[1, 2], [3, 4]], [[5, 6], [7, 8]]];

// 38. function returning a deeply nested object
function getUser(): { id: number; profile: { name: string; age: number } } {
  return { id: 1, profile: { name: "Alice", age: 30 } };
}

// ============================================================================
// ADVANCED — const assertions, utility types, indexed access, conditionals (39–50)
// ============================================================================

// 39. const assertion — array becomes readonly tuple of literals
const palette = ["red", "green", "blue"] as const;
type PaletteColor = (typeof palette)[number]; // "red" | "green" | "blue"

// 40. const assertion on object — values become literal types
const HTTP_METHODS = { GET: "GET", POST: "POST", DELETE: "DELETE" } as const;
type HttpMethod = (typeof HTTP_METHODS)[keyof typeof HTTP_METHODS];

// 41. keyof typeof to derive key union
const appConfig = { host: "localhost", port: 3000, secure: false };
type AppConfigKey = keyof typeof appConfig; // "host" | "port" | "secure"

// 42. indexed access type
type FirstElement = [string, number, boolean][0]; // string
type SecondElement = [string, number, boolean][1]; // number

// 43. template literal type (basic)
type EventName = `on${Capitalize<string>}`;
type ClickEvent = `on${"Click"}`; // "onClick"

// 44. conditional type
type IsString<T> = T extends string ? true : false;
type CheckStr = IsString<string>;  // true
type CheckNum = IsString<number>;  // false

// 45. Readonly utility type
type ReadonlyPoint = Readonly<{ x: number; y: number }>;
const rp: ReadonlyPoint = { x: 1, y: 2 };

// 46. Partial utility type
type PartialServerConfig = Partial<ServerConfig>;
const partial: PartialServerConfig = {};

// 47. Required utility type — makes all props mandatory
type FullServerConfig = Required<ServerConfig>;

// 48. Record utility type
type ScoreMap = Record<string, number>;
const scores: ScoreMap = { Alice: 95, Bob: 87 };

// 49. Extract utility type
type Mixed = string | number | boolean;
type StringOrNumber = Extract<Mixed, string | number>; // string | number

// 50. Exclude utility type
type NotBoolean = Exclude<Mixed, boolean>; // string | number

// ============================================================================
// Runtime tests
// ============================================================================
console.assert(firstName === "Alice", "firstName");
console.assert(age === 25, "age");
console.assert(multiply(3, 7) === 21, "multiply");
console.assert(repeat("ab", 3) === "ababab", "repeat");
console.assert(distanceTo({ x: 3, y: 4 }) === 5, "distanceTo");
console.assert(currencyFmt.format(9.5) === "$9.50", "currencyFmt");
console.assert(makePoint(1, 2).y === 2, "makePoint");
console.assert(getUser().profile.name === "Alice", "getUser");
console.assert(scores["Alice"] === 95, "scores");
console.assert(matrix[1][1] === 5, "matrix");
console.assert(triangle.length === 3, "triangle");
console.assert(chill.tracks[0] === "Song A", "playlist");
console.log("Examples 1.1 — All assertions passed!");

export {};
