export {};

// ── Basic `infer` Keyword Examples ───────────────────────────────────────────

// 1. infer return type of function
type ReturnType2<F> = F extends (...args: any[]) => infer R ? R : never;
type R1 = ReturnType2<() => string>;  // string
type R2 = ReturnType2<() => number>;  // number

// 2. infer parameter types
type Params<F> = F extends (...args: infer P) => any ? P : never;
type P1 = Params<(x: string, y: number) => void>; // [string, number]

// 3. infer first parameter
type FirstParam<F> = F extends (first: infer F2, ...rest: any[]) => any ? F2 : never;
type FP1 = FirstParam<(name: string, age: number) => void>; // string

// 4. infer single parameter
type SingleParam<F> = F extends (arg: infer A) => any ? A : never;
type SP1 = SingleParam<(x: number) => void>; // number

// 5. infer from Promise
type Awaited2<T> = T extends Promise<infer U> ? U : T;
type A1 = Awaited2<Promise<string>>; // string
type A2 = Awaited2<number>;          // number

// 6. infer element from array
type ElementOf<T> = T extends (infer U)[] ? U : never;
type E1 = ElementOf<string[]>; // string
type E2 = ElementOf<number>;   // never

// 7. infer constructor parameters
type CtorParams<T> = T extends new (...args: infer P) => any ? P : never;
class Point { constructor(public x: number, public y: number) {} }
type PP = CtorParams<typeof Point>; // [number, number]

// 8. infer instance type from constructor
type Instance<T> = T extends new (...args: any[]) => infer I ? I : never;
type PointInstance = Instance<typeof Point>; // Point

// 9. infer from generic type
type UnwrapBox<T> = T extends { value: infer V } ? V : never;
type UB = UnwrapBox<{ value: string }>; // string

// 10. infer from nested generic
type UnwrapArray<T> = T extends Array<infer U> ? U : never;
type UA = UnwrapArray<string[]>; // string

// 11. infer from readonly array
type ReadonlyElement<T> = T extends ReadonlyArray<infer U> ? U : never;
type RE = ReadonlyElement<ReadonlyArray<number>>; // number

// 12. infer from tuple head
type Head<T extends any[]> = T extends [infer H, ...any[]] ? H : never;
type TH = Head<[string, number, boolean]>; // string

// 13. infer from tuple tail
type Tail<T extends any[]> = T extends [any, ...infer T2] ? T2 : never;
type TT = Tail<[string, number, boolean]>; // [number, boolean]

// 14. infer from tuple last
type Last<T extends any[]> = T extends [...any[], infer L] ? L : never;
type TL = Last<[string, number, boolean]>; // boolean

// 15. infer from tuple init (all but last)
type Init<T extends any[]> = T extends [...infer I, any] ? I : never;
type TI = Init<[string, number, boolean]>; // [string, number]

// 16. infer from discriminated union
type ExtractPayload<T, K extends string> = T extends { type: K; payload: infer P } ? P : never;
type Events =
  | { type: "login"; payload: { userId: string } }
  | { type: "logout"; payload: {} };
type LoginPayload = ExtractPayload<Events, "login">; // { userId: string }

// 17. infer from mapped type value
type ValueOf2<T> = T extends { [key: string]: infer V } ? V : never;
type VO = ValueOf2<{ a: string; b: number }>; // string | number

// 18. infer from template literal
type StripOn<S extends string> = S extends `on${infer Rest}` ? Rest : S;
type SO = StripOn<"onClick">; // "Click"
type SO2 = StripOn<"focus">;  // "focus"

// 19. infer from nested object key
type InnerValue<T, K extends keyof T> = T[K] extends infer V ? V : never;
type IV = InnerValue<{ name: string; age: number }, "name">; // string

// 20. infer from function callback
type CallbackReturn<F> =
  F extends (cb: (...args: any[]) => infer R) => any ? R : never;
type CR = CallbackReturn<(cb: (err: Error | null, val: string) => void) => void>;
// void

// 21. infer from method
type MethodReturn<T, K extends keyof T> = T[K] extends (...args: any[]) => infer R ? R : never;
class Counter { increment(): number { return 0; } }
type MR = MethodReturn<Counter, "increment">; // number

// 22. infer from conditional branch
type IsPromise<T> = T extends Promise<infer _U> ? true : false;
type IP1 = IsPromise<Promise<string>>; // true
type IP2 = IsPromise<string>;          // false

// 23. infer + conditional to unwrap or keep
type MaybeUnwrap<T> = T extends Promise<infer U> ? U : T;
type MU1 = MaybeUnwrap<Promise<number>>; // number
type MU2 = MaybeUnwrap<string>;          // string

// 24. infer in return position to transform
type PromisifyReturn<F> =
  F extends (...args: infer A) => infer R
    ? (...args: A) => Promise<R>
    : never;
type PF = PromisifyReturn<(n: number) => string>; // (n: number) => Promise<string>

// 25. infer from nested Promise
type DoubleAwaited<T> = T extends Promise<infer U> ? (U extends Promise<infer V> ? V : U) : T;
type DA = DoubleAwaited<Promise<Promise<number>>>; // number

// 26. infer in mapped type (not directly possible, used via conditional)
type ExtractFunctionReturns<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => infer R ? R : never;
};
class API { getUser(): string { return ""; } getAge(): number { return 0; } }
type APIReturns = ExtractFunctionReturns<API>;
// { getUser: string; getAge: number }

// 27. infer from index signature
type IndexValue<T extends { [key: string]: unknown }> =
  T extends { [key: string]: infer V } ? V : never;
type IV2 = IndexValue<Record<string, string | number>>; // string | number

// 28. infer from union member
type UnionToIntersection<U> =
  (U extends any ? (x: U) => void : never) extends (x: infer I) => void ? I : never;
type UI = UnionToIntersection<{ a: string } | { b: number }>; // { a: string } & { b: number }

// 29. infer from Readonly<T>
type UnwrapReadonly<T> = T extends Readonly<infer U> ? U : T;
type UR = UnwrapReadonly<Readonly<{ x: number }>>;

// 30. infer first element of readonly tuple
type ReadonlyHead<T extends readonly any[]> = T extends readonly [infer H, ...any[]] ? H : never;
type RH = ReadonlyHead<readonly [string, number]>; // string

// 31. infer from object literal value type
type ObjectValueType<T> = T extends Record<string, infer V> ? V : never;
const obj = { a: 1, b: 2, c: 3 } as const;
type OVT = ObjectValueType<typeof obj>; // 1 | 2 | 3

// 32. infer from Result type
type OkValue<T> = T extends { ok: true; value: infer V } ? V : never;
type OV = OkValue<{ ok: true; value: number } | { ok: false; error: string }>; // number

// 33. infer from error union arm
type ErrorMsg<T> = T extends { ok: false; error: infer E } ? E : never;
type EM = ErrorMsg<{ ok: true; value: number } | { ok: false; error: string }>; // string

// 34. infer from event map
type EventArgs<T extends Record<string, any[]>, K extends keyof T> = T[K] extends infer A ? A : never;

// 35. infer from function overload (last signature)
function parse(val: string): number;
function parse(val: number): string;
function parse(val: any): any { return val; }
type ParseReturn = ReturnType<typeof parse>; // string (last overload)

// 36. infer conditional type from class
class Box<T> { constructor(readonly value: T) {} }
type BoxValue<B> = B extends Box<infer V> ? V : never;
type BV = BoxValue<Box<string>>; // string

// 37. infer from key-value pair
type Pair<K extends string, V> = { key: K; value: V };
type PairKey<P> = P extends Pair<infer K, any> ? K : never;
type PV<P> = P extends Pair<any, infer V> ? V : never;
type PK = PairKey<Pair<"name", string>>; // "name"
type PVT = PV<Pair<"age", number>>;      // number

// 38. infer to detect union member count (simplified)
type HasExactlyOne<T> = T extends [infer _] ? true : false;

// 39. infer from rest parameters
type RestParams<F> = F extends (first: any, ...rest: infer R) => any ? R : never;
type RP = RestParams<(a: string, b: number, c: boolean) => void>; // [number, boolean]

// 40. infer class field type
class Config2 { host = "localhost"; port = 3000; }
type FieldType<T, K extends keyof T> = T[K] extends infer V ? V : never;
type HostType = FieldType<Config2, "host">; // string

// 41. infer multiple in one conditional
type SplitFn<F> = F extends (a: infer A, b: infer B) => infer R ? { a: A; b: B; r: R } : never;
type SF = SplitFn<(a: string, b: number) => boolean>; // { a: string; b: number; r: boolean }

// 42. infer from object with optional fields
type OptionalValue<T, K extends keyof T> = T[K] extends infer V | undefined ? V : T[K];
type OVal = OptionalValue<{ name?: string }, "name">; // string

// 43. infer from intersection
type FromIntersection<T> = T extends (infer A) & (infer B) ? [A, B] : never;

// 44. infer from Map type
type MapValue<T> = T extends Map<any, infer V> ? V : never;
type MV = MapValue<Map<string, number>>; // number

// 45. infer from Set type
type SetElement<T> = T extends Set<infer E> ? E : never;
type SE = SetElement<Set<string>>; // string

// 46. infer from Generator
type GeneratorYield<T> = T extends Generator<infer Y, any, any> ? Y : never;
type GY = GeneratorYield<Generator<number, void, unknown>>; // number

// 47. infer from AsyncGenerator
type AsyncGenYield<T> = T extends AsyncGenerator<infer Y, any, any> ? Y : never;

// 48. infer from WeakMap
type WeakMapValue<T> = T extends WeakMap<object, infer V> ? V : never;
type WV = WeakMapValue<WeakMap<object, string>>; // string

// 49. infer from Iterable
type IterableType<T> = T extends Iterable<infer U> ? U : never;
type IT = IterableType<string[]>; // string

// 50. infer from Iterator
type IteratorType<T> = T extends Iterator<infer U> ? U : never;
type IterT = IteratorType<Iterator<number>>; // number
