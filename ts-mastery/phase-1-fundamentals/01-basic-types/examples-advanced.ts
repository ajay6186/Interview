export {};

// ============================================================
// ADVANCED EXAMPLES — Basic Types (50 Examples)
// ============================================================

// 1. Const assertion narrows to literal tuple
const point = [1, 2] as const; // readonly [1, 2]
type PointType = typeof point; // readonly [1, 2]

// 2. Const assertion on object — all values become literal types
const HTTP_METHODS = { GET: "GET", POST: "POST", PUT: "PUT" } as const;
type HttpMethod = (typeof HTTP_METHODS)[keyof typeof HTTP_METHODS];
const method: HttpMethod = "GET";

// 3. Satisfies operator — validates shape without losing literal types
const config = {
  port: 3000,
  host: "localhost",
} satisfies { port: number; host: string };
const portType: number = config.port; // still number, not widened to unknown

// 4. Template literal type — string pattern
type EventName = `on${Capitalize<string>}`;
const evtName: EventName = "onClick";

// 5. Template literal type with union interpolation
type CSSProperty = `margin-${"top" | "bottom" | "left" | "right"}`;
const prop: CSSProperty = "margin-top";

// 6. Template literal type combining two unions
type GridArea = `${"row" | "col"}-${1 | 2 | 3}`;
const area: GridArea = "row-2";

// 7. Conditional type — basic T extends check
type IsString<T> = T extends string ? true : false;
type Test1 = IsString<string>; // true
type Test2 = IsString<number>; // false

// 8. Conditional type — extracting array element
type ElementOf<T> = T extends (infer E)[] ? E : never;
type StrEl = ElementOf<string[]>; // string
type NumEl = ElementOf<number[]>; // number

// 9. Conditional type — function return type extraction
type ReturnOf<F> = F extends (...args: any[]) => infer R ? R : never;
function fetchUser(): { id: number; name: string } {
  return { id: 1, name: "Alice" };
}
type FetchReturn = ReturnOf<typeof fetchUser>; // { id: number; name: string }

// 10. Distributive conditional type over union
type Flatten<T> = T extends any[] ? T[number] : T;
type Mixed = Flatten<string[] | number | boolean[]>; // string | number | boolean

// 11. Mapped type — transform all properties to boolean
type FlagMap<T> = { [K in keyof T]: boolean };
type Config = { host: string; port: number; ssl: boolean };
type ConfigFlags = FlagMap<Config>; // { host: boolean; port: boolean; ssl: boolean }

// 12. Mapped type — make all properties optional
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };
type PartialConfig = DeepPartial<Config>;
const pc: PartialConfig = {};

// 13. Mapped type — make all properties readonly
type DeepReadonly<T> = { readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K] };

// 14. Mapped type — remap keys with as
type Getters<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] };
type UserGetters = Getters<{ name: string; age: number }>;
// { getName: () => string; getAge: () => number }

// 15. Infer in conditional type — extract Promise value
type Awaited_<T> = T extends Promise<infer V> ? V : T;
type ResolvedString = Awaited_<Promise<string>>; // string
type ResolvedNum = Awaited_<number>; // number

// 16. Recursive type — linked list
type LinkedList<T> = { value: T; next: LinkedList<T> | null };
const list: LinkedList<number> = {
  value: 1,
  next: { value: 2, next: { value: 3, next: null } },
};

// 17. Recursive type — JSON-compatible value
type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };
const json: JSONValue = { a: [1, "two", { b: true }] };

// 18. Never in conditional — filter union members
type NonNullableUnion<T> = T extends null | undefined ? never : T;
type CleanUnion = NonNullableUnion<string | null | number | undefined>; // string | number

// 19. Template literal with infer
type ExtractPrefix<S extends string> = S extends `${infer P}_${string}` ? P : never;
type Prefix = ExtractPrefix<"user_created">; // "user"

// 20. Template literal with Uppercase
type Screaming<S extends string> = Uppercase<S>;
type Loud = Screaming<"hello world">; // "HELLO WORLD"

// 21. Variadic tuple — prepend element to tuple
type Prepend<T, Tuple extends unknown[]> = [T, ...Tuple];
type PrependedStr = Prepend<string, [number, boolean]>; // [string, number, boolean]

// 22. Variadic tuple — append element to tuple
type Append<Tuple extends unknown[], T> = [...Tuple, T];
type AppendedStr = Append<[number, boolean], string>; // [number, boolean, string]

// 23. Variadic tuple — concat two tuples
type Concat<A extends unknown[], B extends unknown[]> = [...A, ...B];
type Joined = Concat<[string, number], [boolean, null]>;

// 24. Conditional type — unwrap nested array
type DeepFlatten<T> = T extends (infer E)[] ? DeepFlatten<E> : T;
type FlatDeep = DeepFlatten<string[][][]>; // string

// 25. Brand type using unique symbol intersection
declare const _brand: unique symbol;
type Brand<T, B> = T & { [_brand]: B };
type Meters = Brand<number, "Meters">;
type Seconds = Brand<number, "Seconds">;
const dist = 10 as Meters;
const time = 5 as Seconds;
// const wrong: Meters = time; // Error!

// 26. Opaque ID type
type UserID = Brand<number, "UserID">;
type PostID = Brand<number, "PostID">;
const uid = 1 as UserID;
const pid = 100 as PostID;
// const mix: UserID = pid; // Error!

// 27. Assertion function (TypeScript 3.7+)
function assertIsString(val: unknown): asserts val is string {
  if (typeof val !== "string") throw new TypeError("Expected string");
}
const rawInput: unknown = "hello";
assertIsString(rawInput);
const upper = rawInput.toUpperCase(); // safe after assertion

// 28. Assertion function for non-null
function assertDefined<T>(val: T): asserts val is NonNullable<T> {
  if (val == null) throw new Error("Expected defined value");
}

// 29. Conditional type — head of tuple
type Head<T extends unknown[]> = T extends [infer H, ...unknown[]] ? H : never;
type FirstOfTuple = Head<[string, number, boolean]>; // string

// 30. Conditional type — tail of tuple
type Tail<T extends unknown[]> = T extends [unknown, ...infer Rest] ? Rest : never;
type TailOfTuple = Tail<[string, number, boolean]>; // [number, boolean]

// 31. Conditional type — last element of tuple
type Last<T extends unknown[]> = T extends [...unknown[], infer L] ? L : never;
type LastEl = Last<[string, number, boolean]>; // boolean

// 32. Length of tuple as number literal
type Length<T extends unknown[]> = T["length"];
type Len3 = Length<[1, 2, 3]>; // 3

// 33. Mapped type — exclude undefined from all props
type RequiredDefined<T> = { [K in keyof T]-?: NonNullable<T[K]> };
type PartOpt = { a?: string; b?: number };
type StrictOpt = RequiredDefined<PartOpt>; // { a: string; b: number }

// 34. Mapped type — add undefined to all props
type AllOptional<T> = { [K in keyof T]: T[K] | undefined };

// 35. Template literal — route pattern
type ApiRoute = `/api/${"users" | "posts" | "comments"}`;
const route: ApiRoute = "/api/users";

// 36. Template literal — event handler name
type OnEvent<E extends string> = `on${Capitalize<E>}`;
type ClickHandler = OnEvent<"click">; // "onClick"

// 37. Recursive conditional — deep ReadOnly on arrays
type DeepReadonlyArr<T> = T extends (infer E)[]
  ? ReadonlyArray<DeepReadonlyArr<E>>
  : T extends object
  ? { readonly [K in keyof T]: DeepReadonlyArr<T[K]> }
  : T;

// 38. Infer in mapped type — extract method return types
type MethodReturnTypes<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => infer R ? R : never;
};
type Service = { getUser(): { id: number }; getCount(): number };
type ServiceReturns = MethodReturnTypes<Service>;
// { getUser: { id: number }; getCount: number }

// 39. Conditional distribution — union to intersection
type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends
  (x: infer I) => void
  ? I
  : never;
type U2I = UnionToIntersection<{ a: string } | { b: number }>;
// { a: string } & { b: number }

// 40. Exclude mapped — filter keys by value type
type FilterByValueType<T, V> = {
  [K in keyof T as T[K] extends V ? K : never]: T[K];
};
type Mixed2 = { name: string; age: number; active: boolean; score: number };
type OnlyNumbers = FilterByValueType<Mixed2, number>; // { age: number; score: number }

// 41. Conditional — check if tuple is empty
type IsEmpty<T extends unknown[]> = T["length"] extends 0 ? true : false;
type CheckEmpty = IsEmpty<[]>; // true
type CheckNonEmpty = IsEmpty<[1]>; // false

// 42. Recursive — deep nullable
type DeepNullable<T> = T extends object
  ? { [K in keyof T]: DeepNullable<T[K]> | null }
  : T | null;

// 43. Template literal — CSS class factory
type BEM<B extends string, E extends string = "", M extends string = ""> =
  E extends ""
    ? B
    : M extends ""
    ? `${B}__${E}`
    : `${B}__${E}--${M}`;
type ButtonClass = BEM<"btn">; // "btn"
type ButtonIconClass = BEM<"btn", "icon">; // "btn__icon"
type ButtonIconActiveClass = BEM<"btn", "icon", "active">; // "btn__icon--active"

// 44. String split at type level
type Split<S extends string, D extends string> =
  S extends `${infer Head}${D}${infer Tail}`
    ? [Head, ...Split<Tail, D>]
    : [S];
type Parts = Split<"a,b,c", ",">; // ["a", "b", "c"]

// 45. Replace in string at type level
type Replace<S extends string, From extends string, To extends string> =
  S extends `${infer Before}${From}${infer After}`
    ? `${Before}${To}${After}`
    : S;
type Replaced = Replace<"hello_world", "_", "-">; // "hello-world"

// 46. Infer — extract parameters of generic function
type UnpackParameters<F extends (...args: any) => any> =
  F extends (...args: infer P) => any ? P : never;
type SumParams = UnpackParameters<(a: number, b: number) => number>; // [number, number]

// 47. Recursive depth limit guard (simulation)
type Repeat<S extends string, N extends number, Acc extends string[] = []> =
  Acc["length"] extends N ? Acc[number] : Repeat<S, N, [...Acc, S]>;
type ThreeFoos = Repeat<"foo", 3>; // "foo" | "foo" | "foo" → "foo"

// 48. Record with template literal keys
type DataStore<Keys extends string> = Record<`${Keys}Data`, unknown>;
type UserStore = DataStore<"user" | "post">;
// { userData: unknown; postData: unknown }

// 49. Mapped — transform to setter functions
type Setters<T> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: (value: T[K]) => void;
};
type FormSetters = Setters<{ name: string; age: number }>;
// { setName: (value: string) => void; setAge: (value: number) => void }

// 50. Exhaustive check with never
type Color = "red" | "green" | "blue";
function describeColor(c: Color): string {
  switch (c) {
    case "red":   return "warm";
    case "green": return "natural";
    case "blue":  return "cool";
    default:
      const _exhaustive: never = c;
      return _exhaustive;
  }
}
