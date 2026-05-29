export {};

// ── Basic Conditional Type Examples ─────────────────────────────────────────

// 1. Simple extends check
type IsString<T> = T extends string ? true : false;
type A = IsString<"hello">; // true
type B = IsString<42>;      // false

// 2. IsNumber
type IsNumber<T> = T extends number ? true : false;
type C = IsNumber<99>;   // true
type D = IsNumber<"x">; // false

// 3. IsBoolean
type IsBoolean<T> = T extends boolean ? true : false;
type E = IsBoolean<true>;    // true
type F = IsBoolean<"true">;  // false

// 4. Nullable check
type IsNullable<T> = null extends T ? true : false;
type G = IsNullable<string | null>; // true
type H = IsNullable<string>;        // false

// 5. IsArray
type IsArray<T> = T extends any[] ? true : false;
type I = IsArray<number[]>; // true
type J = IsArray<number>;   // false

// 6. IsObject (non-array)
type IsObject<T> = T extends object ? (T extends any[] ? false : true) : false;
type K = IsObject<{ x: 1 }>;   // true
type L = IsObject<number[]>;   // false

// 7. IsFunction
type IsFunction<T> = T extends (...args: any[]) => any ? true : false;
type M = IsFunction<() => void>; // true
type N = IsFunction<string>;     // false

// 8. NonNullable conditional
type NonNullableCustom<T> = T extends null | undefined ? never : T;
type O = NonNullableCustom<string | null>; // string
type P = NonNullableCustom<undefined>;     // never

// 9. Unwrap array element
type ElementOf<T> = T extends (infer U)[] ? U : never;
type Q = ElementOf<string[]>; // string
type R = ElementOf<number>;   // never

// 10. Unwrap Promise
type Awaited2<T> = T extends Promise<infer U> ? U : T;
type S2 = Awaited2<Promise<string>>; // string
type T2 = Awaited2<number>;          // number

// 11. ReturnType conditional
type MyReturnType<F> = F extends (...args: any[]) => infer R ? R : never;
type U2 = MyReturnType<() => string>; // string
type V2 = MyReturnType<string>;       // never

// 12. Parameters conditional
type MyParameters<F> = F extends (...args: infer P) => any ? P : never;
type W2 = MyParameters<(a: string, b: number) => void>; // [string, number]

// 13. Conditional type with default
type OrDefault<T, D> = T extends undefined ? D : T;
type X2 = OrDefault<undefined, string>; // string
type Y2 = OrDefault<number, string>;    // number

// 14. Check if two types are equal
type Equals<A, B> = A extends B ? (B extends A ? true : false) : false;
type Z2 = Equals<string, string>; // true
type AA2 = Equals<string, number>; // false

// 15. Extract matching types
type OnlyStrings2<T> = T extends string ? T : never;
type BB = OnlyStrings2<"a" | "b" | 1 | 2>; // "a" | "b"

// 16. Exclude matching types
type NoStrings<T> = T extends string ? never : T;
type CC = NoStrings<"a" | 1 | true>; // 1 | true

// 17. Primitive check
type IsPrimitive<T> = T extends string | number | boolean | null | undefined | symbol | bigint
  ? true : false;
type DD = IsPrimitive<string>; // true
type EE = IsPrimitive<object>; // false

// 18. Condition on literal type
type IsLiteralString<T> = T extends string ? (string extends T ? false : true) : false;
type FF = IsLiteralString<"hello">; // true
type GG = IsLiteralString<string>;  // false

// 19. Check if T extends never
type IsNever<T> = [T] extends [never] ? true : false;
type HH = IsNever<never>; // true
type II = IsNever<string>; // false

// 20. Union of conditional types (distributive)
type Flatten2<T> = T extends Array<infer U> ? U : T;
type JJ = Flatten2<string[] | number[]>; // string | number
type KK = Flatten2<string | number>;     // string | number

// 21. Conditional narrowing in generic function
function processValue<T>(val: T): T extends string ? string[] : T extends number ? number[] : never {
  if (typeof val === "string") return val.split("") as any;
  if (typeof val === "number") return [val] as any;
  throw new Error("Unsupported type");
}
const chars = processValue("hello"); // string[]
const nums2 = processValue(42);     // number[]

// 22. Type that checks if object has a key
type HasKey<T, K extends string> = K extends keyof T ? true : false;
type LL = HasKey<{ name: string }, "name">; // true
type MM = HasKey<{ name: string }, "age">;  // false

// 23. Conditional based on value shape
type HasId<T> = T extends { id: unknown } ? true : false;
type NN = HasId<{ id: string; name: string }>; // true
type OO = HasId<{ name: string }>;             // false

// 24. Conditional type returning a different type
type Stringify<T> = T extends number ? `${T}` : T extends boolean ? `${T}` : string;
type PP = Stringify<42>;   // "42"
type QQ = Stringify<true>; // "true"

// 25. Optional return: T or void
type MaybeVoid<T> = T extends undefined ? void : T;
type RR = MaybeVoid<undefined>; // void
type SS = MaybeVoid<string>;    // string

// 26. Coerce to array if not already
type AsArray<T> = T extends any[] ? T : [T];
type TT = AsArray<string>;    // [string]
type UU = AsArray<string[]>;  // string[]

// 27. Conditional key selection
type StringKeys<T> = {
  [K in keyof T]: T[K] extends string ? K : never;
}[keyof T];
type VV = StringKeys<{ name: string; age: number; email: string }>; // "name" | "email"

// 28. Conditional partial
type MaybePartial<T, Condition extends boolean> = Condition extends true ? Partial<T> : T;
type WW = MaybePartial<{ x: number }, true>;  // Partial<{ x: number }>
type XX = MaybePartial<{ x: number }, false>; // { x: number }

// 29. Conditional readonly
type MaybeReadonly<T, R extends boolean> = R extends true ? Readonly<T> : T;
type YY = MaybeReadonly<{ x: number }, true>; // Readonly<{ x: number }>

// 30. Conditional Record
type MakeRecord<K extends string, V, Optional extends boolean> =
  Optional extends true ? Partial<Record<K, V>> : Record<K, V>;
type ZZ = MakeRecord<"a" | "b", string, true>; // { a?: string; b?: string }

// 31. Conditional array vs single
type Wrap<T, Multiple extends boolean> = Multiple extends true ? T[] : T;
type AAA = Wrap<string, true>;  // string[]
type BBB = Wrap<string, false>; // string

// 32. Null-safe extraction
type SafeKey<T, K extends keyof T> = T[K] extends null | undefined ? never : T[K];
type CCC = SafeKey<{ name: string | null }, "name">; // never — because string | null extends null
// More precisely:
type SafeNonNull<T, K extends keyof T> = NonNullable<T[K]>;
type DDD = SafeNonNull<{ name: string | null }, "name">; // string

// 33. Conditional type inside interface
type JsonSafe<T> =
  T extends string | number | boolean | null ? T :
  T extends Date ? string :
  T extends (infer U)[] ? JsonSafe<U>[] :
  T extends object ? { [K in keyof T]: JsonSafe<T[K]> } :
  never;
type EEE = JsonSafe<Date>; // string
type FFF = JsonSafe<{ created: Date; name: string }>; // { created: string; name: string }

// 34. Conditional Promise wrapping
type MaybeAsync<T, Async extends boolean> = Async extends true ? Promise<T> : T;
type GGG = MaybeAsync<string, true>;  // Promise<string>
type HHH = MaybeAsync<string, false>; // string

// 35. Conditional to pick first of union
type FirstInUnion<T> = T extends any ? T : never;
// (this is just distribution — returns the union itself)

// 36. Tuple element type extraction
type First<T extends any[]> = T extends [infer F, ...infer _Rest] ? F : never;
type Last<T extends any[]> = T extends [...infer _Init, infer L] ? L : never;
type III = First<[string, number, boolean]>; // string
type JJJ = Last<[string, number, boolean]>;  // boolean

// 37. Conditional function wrapping
type Promisify<T> = T extends (...args: infer A) => infer R ? (...args: A) => Promise<R> : never;
type KKK = Promisify<(x: number) => string>; // (x: number) => Promise<string>

// 38. Conditional from keyof
type PickStringProps<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K];
};
type LLL = PickStringProps<{ name: string; age: number; email: string }>;
// { name: string; email: string }

// 39. Conditional default type parameter
type WithDefault<T, D = string> = T extends undefined ? D : T;
type MMM = WithDefault<undefined>;        // string
type NNN = WithDefault<undefined, number>; // number
type OOO = WithDefault<boolean>;           // boolean

// 40. Recursive flattening via conditional
type Flatten3<T> = T extends Array<infer U> ? Flatten3<U> : T;
type PPP = Flatten3<number[][][]>; // number

// 41. Conditional tuple conversion
type ToTuple<T> = T extends any[] ? T : [T];
type QQQ = ToTuple<[string, number]>; // [string, number]
type RRR = ToTuple<string>;           // [string]

// 42. Conditional type brand checking
declare const _b: unique symbol;
type Branded2<T, B> = T & { readonly [_b]: B };
type IsBranded<T, B> = T extends Branded2<unknown, B> ? true : false;
type SSS = IsBranded<Branded2<string, "Email">, "Email">; // true

// 43. Conditional from string literal
type StartsWithOn<S extends string> = S extends `on${string}` ? true : false;
type TTT = StartsWithOn<"onClick">; // true
type UUU = StartsWithOn<"click">;   // false

// 44. Conditional based on length
type IsEmpty<T extends any[]> = T extends [] ? true : false;
type VVV = IsEmpty<[]>;       // true
type WWW = IsEmpty<[number]>; // false

// 45. Map values conditionally
type ConvertDates<T> = {
  [K in keyof T]: T[K] extends Date ? string : T[K];
};
type XXX = ConvertDates<{ name: string; created: Date }>; // { name: string; created: string }

// 46. Guard type narrowing
type NonEmpty<T extends any[]> = T extends [] ? never : T;
type YYY = NonEmpty<[string]>; // [string]
type ZZZ = NonEmpty<[]>;       // never

// 47. Key filter by multiple types
type KeysOfType<T, V> = { [K in keyof T]: T[K] extends V ? K : never }[keyof T];
type AAAA = KeysOfType<{ a: string; b: number; c: string; d: boolean }, string>; // "a" | "c"

// 48. Conditional type for tagged union
type PayloadOf<T extends { type: string; payload?: unknown }, K extends string> =
  T extends { type: K; payload: infer P } ? P : never;
type Event2 =
  | { type: "login"; payload: { userId: string } }
  | { type: "logout"; payload: { reason: string } }
  | { type: "ping" };
type LoginPayload = PayloadOf<Event2, "login">; // { userId: string }

// 49. Conditional to detect constructor type
type IsConstructor<T> = T extends new (...args: any[]) => any ? true : false;
type BBBB = IsConstructor<typeof Date>;   // true
type CCCC = IsConstructor<() => void>;   // false

// 50. Generic conditional factory
type Factory<T> = T extends string ? () => string : T extends number ? () => number : () => unknown;
function createFactory<T>(val: T): Factory<T> {
  return (() => val) as Factory<T>;
}
const strFactory: Factory<string> = createFactory("hello");
const numFactory: Factory<number> = createFactory(42);
