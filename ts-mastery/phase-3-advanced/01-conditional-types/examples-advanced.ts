export {};

// ── Advanced Conditional Type Examples ───────────────────────────────────────

// 1. Strict type equality via conditional trick
type StrictEqual<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type SE1 = StrictEqual<string, string>; // true
type SE2 = StrictEqual<string, number>; // false
type SE3 = StrictEqual<any, unknown>;   // false

// 2. ReadonlyPropKeys using StrictEqual
type ReadonlyKeys<T> = {
  [K in keyof T]-?: StrictEqual<
    { [Q in K]: T[K] },
    { -readonly [Q in K]: T[K] }
  > extends true ? never : K;
}[keyof T];
type RK = ReadonlyKeys<{ readonly a: 1; b: 2; readonly c: 3 }>; // "a" | "c"

// 3. UnionToIntersection via conditional
type UnionToIntersection<U> =
  (U extends any ? (x: U) => void : never) extends (x: infer I) => void ? I : never;
type UI = UnionToIntersection<{ a: string } | { b: number }>; // { a: string } & { b: number }

// 4. LastOfUnion via UnionToIntersection
type LastOfUnion<U> =
  UnionToIntersection<U extends any ? () => U : never> extends () => infer L ? L : never;
type LOU = LastOfUnion<"a" | "b" | "c">; // "c" (or deterministic last)

// 5. UnionToTuple via recursion
type UnionToTuple<U, T extends any[] = []> =
  [U] extends [never]
    ? T
    : UnionToTuple<Exclude<U, LastOfUnion<U>>, [LastOfUnion<U>, ...T]>;
type UTT = UnionToTuple<"a" | "b" | "c">; // ["a", "b", "c"]

// 6. CountUnion via tuple trick
type CountUnion<T> = UnionToTuple<T>["length"];
type CU = CountUnion<"x" | "y" | "z">; // 3

// 7. Distributive conditional to create cartesian product
type Cartesian2<A, B> = A extends any ? B extends any ? [A, B] : never : never;
type Cart2 = Cartesian2<0 | 1, "a" | "b">;
// [0, "a"] | [0, "b"] | [1, "a"] | [1, "b"]

// 8. Prevent distribution via boxing
type IsUnion<T> = [T] extends [UnionToIntersection<T>] ? false : true;
type IU1 = IsUnion<string | number>; // true
type IU2 = IsUnion<string>;          // false

// 9. Recursive conditional: deep JSON-safe
type JsonSafe<T> =
  T extends undefined | Function | symbol | bigint ? never :
  T extends string | number | boolean | null ? T :
  T extends Date ? string :
  T extends Map<any, any> | Set<any> ? never :
  T extends (infer U)[] ? JsonSafe<U>[] :
  T extends object ? { [K in keyof T]: JsonSafe<T[K]> } :
  never;
type SafeUser = JsonSafe<{ name: string; createdAt: Date; fn: () => void }>;
// { name: string; createdAt: string; fn: never }

// 10. Type-level if-then-else
type If<Cond extends boolean, Then, Else> = Cond extends true ? Then : Else;
type IA = If<true, string, number>;  // string
type IB = If<false, string, number>; // number

// 11. Logical operators for types
type And<A extends boolean, B extends boolean> = A extends true ? (B extends true ? true : false) : false;
type Or<A extends boolean, B extends boolean>  = A extends true ? true : (B extends true ? true : false);
type Not<A extends boolean> = A extends true ? false : true;
type ANDTrue = And<true, true>;   // true
type ORFalse = Or<false, false>;  // false
type NOTTrue = Not<true>;         // false

// 12. Conditional for variadic type spreading
type Spread<T extends any[], U extends any[]> = [...T, ...U];
type SpreadResult = Spread<[string, number], [boolean, null]>;
// [string, number, boolean, null]

// 13. Infer recursively from nested function
type DeepReturnType<F> =
  F extends (...args: any[]) => infer R
    ? R extends (...args: any[]) => any
      ? DeepReturnType<R>
      : R
    : F;
type DRT = DeepReturnType<() => () => () => string>; // string

// 14. Conditional type for typed curry
type Curry<F extends (...args: any[]) => any> =
  Parameters<F> extends [infer First, ...infer Rest]
    ? Rest extends []
      ? F
      : (arg: First) => Curry<(...args: Rest) => ReturnType<F>>
    : never;
type CurriedAdd = Curry<(a: number, b: number, c: number) => number>;
// (arg: number) => (arg: number) => (arg: number) => number

// 15. Non-distributive mapped conditional
type MapNonDistributive<T, F extends Record<string, any>> = {
  [K in keyof T]: [T[K]] extends [keyof F] ? F[T[K]] : T[K];
};

// 16. Flatten type with depth counter
type FlatDepth<T, N extends number, Depth extends 0[] = []> =
  Depth["length"] extends N
    ? T
    : T extends (infer U)[]
    ? FlatDepth<U, N, [...Depth, 0]>
    : T;
type FD = FlatDepth<string[][][], 2>; // string[]
type FD2 = FlatDepth<string[][][], 3>; // string

// 17. Type-safe select (SQL-like)
type SelectColumns<T, K extends (keyof T)[]> = Pick<T, K[number]>;
type UserColumns = SelectColumns<
  { id: string; name: string; email: string; password: string },
  ["id", "name"]
>; // { id: string; name: string }

// 18. Conditional for typed guard factory
type TypeGuard<T> = (val: unknown) => val is T;
type Guards<T> = { [K in keyof T]-?: TypeGuard<T[K]> };

// 19. Propagate conditional: transform union branches
type PropagateResult<T> =
  T extends { status: "ok"; data: infer D }
    ? { status: "ok"; data: D extends (infer U)[] ? U[] : [D] }
    : T;
type PR = PropagateResult<{ status: "ok"; data: string }>; // { status: "ok"; data: [string] }

// 20. Distribute and collect: map a union
type MapValues<T, F extends (v: T) => any> =
  T extends any ? ReturnType<F> : never;
type Doubled = MapValues<1 | 2 | 3, (v: number) => `${number}`>; // `${number}`

// 21. Recursive conditional with accumulator
type Reverse<T extends any[], Acc extends any[] = []> =
  T extends [infer H, ...infer R]
    ? Reverse<R, [H, ...Acc]>
    : Acc;
type Rev = Reverse<[1, 2, 3, 4]>; // [4, 3, 2, 1]

// 22. Conditional for higher-kinded types (HKT simulation)
interface HKT { _A: unknown; type: unknown }
type Apply2<F extends HKT, A> = (F & { _A: A })["type"];
interface ArrayHKT extends HKT { type: this["_A"][] }
interface PromiseHKT extends HKT { type: Promise<this["_A"]> }
type ArrStr2 = Apply2<ArrayHKT, string>;    // string[]
type ProNum2  = Apply2<PromiseHKT, number>;  // Promise<number>

// 23. Conditional for typed memoize
type MemoKey<F extends (...args: any[]) => any> =
  Parameters<F> extends infer P
    ? P extends (string | number | boolean)[]
      ? string
      : WeakMap<object, ReturnType<F>>
    : never;

// 24. Nested infer with multiple type slots
type ExtractFunction<T> = T extends {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R ? [K, A, R] : never;
}[keyof T] ? T : never;

// 25. Conditional for type-level append
type Append<T extends any[], Item> = [...T, Item];
type App = Append<[string, number], boolean>; // [string, number, boolean]

// 26. Conditional for type-level prepend
type Prepend<T extends any[], Item> = [Item, ...T];
type Pre = Prepend<[string, number], boolean>; // [boolean, string, number]

// 27. Conditional for type-safe builder stage
type BuilderStage = "empty" | "named" | "complete";
type StageTransition<S extends BuilderStage> =
  S extends "empty" ? "named" : S extends "named" ? "complete" : never;
type NextStage = StageTransition<"empty">;   // "named"
type NextStage2 = StageTransition<"named">; // "complete"

// 28. Conditional type for variance tracking
type Covariant<T> = () => T;
type Contravariant<T> = (val: T) => void;
type IsCovariantSubtype<Child, Parent> =
  Covariant<Child> extends Covariant<Parent> ? true : false;
type IsContravariantSubtype<Child, Parent> =
  Contravariant<Parent> extends Contravariant<Child> ? true : false;

// 29. Conditional mapping to schema validator
type SchemaOf<T> = {
  [K in keyof T]-?: T[K] extends string ? { type: "string"; required: true } :
                    T[K] extends number ? { type: "number"; required: true } :
                    T[K] extends boolean ? { type: "boolean"; required: true } :
                    T[K] extends string | undefined ? { type: "string"; required: false } :
                    { type: "unknown"; required: boolean };
};
type User = { name: string; age: number; bio?: string };
type UserSchema = SchemaOf<User>;

// 30. Infer multiple constraints
type ExtractBothParams<T> =
  T extends (a: infer A extends string, b: infer B extends number) => any
    ? { a: A; b: B }
    : never;
type EBP = ExtractBothParams<(a: "hello", b: 42) => void>; // { a: "hello"; b: 42 }

// 31. Conditional for typed curry with rest args
type CurryRest<F extends (...args: any[]) => any, Collected extends any[] = []> =
  Parameters<F> extends [...Collected, infer Next, ...infer _Rem]
    ? (arg: Next) => CurryRest<F, [...Collected, Next]>
    : ReturnType<F>;

// 32. Conditional for recursive optional unwrapping
type StripOptional<T> =
  T extends undefined ? never :
  T extends null ? never :
  T extends (infer U)? ? StripOptional<U> :
  T extends (infer U)[] ? StripOptional<U>[] :
  T extends object ? { [K in keyof T]-?: StripOptional<T[K]> } :
  T;

// 33. Conditional for type narrowing chains
type Narrow<T, Guard extends (v: T) => boolean> =
  Guard extends (v: T) => v is infer Narrowed ? Narrowed : T;

// 34. Conditional for type-level integer comparison
type GTE<A extends number, B extends number> =
  A extends B ? true :
  `${A}` extends `-${string}` ? false :
  `${B}` extends `-${string}` ? true :
  BuildTuple<A> extends [...BuildTuple<B>, ...any[]] ? true : false;
type BuildTuple<N extends number, T extends 0[] = []> =
  T["length"] extends N ? T : BuildTuple<N, [...T, 0]>;
type GTE1 = GTE<5, 3>; // true
type GTE2 = GTE<2, 3>; // false

// 35. Conditional for nominal type safety
declare const _N: unique symbol;
type Nominal<T, N extends string> = T & { [_N]: N };
type USD = Nominal<number, "USD">;
type EUR = Nominal<number, "EUR">;
function addUSD(a: USD, b: USD): USD { return (a + b) as USD; }
// addUSD(1 as EUR, 1 as USD); // Error

// 36. Conditional for recursive depth counting
type Depth<T, Acc extends 0[] = []> =
  T extends object
    ? Depth<T[keyof T], [...Acc, 0]>
    : Acc["length"];
type D1 = Depth<{ a: { b: { c: string } } }>; // 3

// 37. Conditional for typed event sourcing
type CommandOf<Handler> = Handler extends (cmd: infer C) => any ? C : never;
type ResultOf<Handler> = Handler extends (...args: any[]) => infer R ? Awaited<R> : never;
type CommandResult<Handler> = { command: CommandOf<Handler>; result: ResultOf<Handler> };

// 38. Conditional for deep pick via dot path
type SplitPath<S extends string> =
  S extends `${infer H}.${infer T}` ? [H, ...SplitPath<T>] : [S];
type GetAtPath<T, P extends any[]> =
  P extends [infer K, ...infer Rest]
    ? K extends keyof T ? GetAtPath<T[K], Rest> : never
    : T;
type GAP = GetAtPath<{ a: { b: { c: number } } }, SplitPath<"a.b.c">>; // number

// 39. Conditional for type-safe sprintf
type CountPlaceholders<S extends string, Acc extends any[] = []> =
  S extends `${string}{}${infer Rest}` ? CountPlaceholders<Rest, [...Acc, string]> : Acc;
type Format<S extends string> = (...args: CountPlaceholders<S>) => string;
type Fmt = Format<"Hello {} and {}">; // (arg_0: string, arg_1: string) => string

// 40. Conditional for effect system types
type Effect<R, E, A> = (env: R) => Promise<{ ok: true; value: A } | { ok: false; error: E }>;
type EffectResult<Eff> =
  Eff extends Effect<any, any, infer A> ? A : never;
type EffectError<Eff> =
  Eff extends Effect<any, infer E, any> ? E : never;

// 41. Conditional type for property path typing
type NestedValue<T, K extends string> =
  K extends keyof T ? T[K] :
  K extends `${infer P}.${infer Rest}` ? P extends keyof T ? NestedValue<T[P], Rest> : never :
  never;
type Config2 = { db: { host: string }; app: { port: number } };
type Host = NestedValue<Config2, "db.host">; // string
type Port = NestedValue<Config2, "app.port">; // number

// 42. Conditional for function overload resolution type
type OverloadReturnType<F> =
  F extends { (...args: infer A1): infer R1; (...args: infer A2): infer R2 }
    ? R1 | R2
    : F extends (...args: any[]) => infer R
    ? R
    : never;

// 43. Conditional for brand verification
type StripBrand<T> = T extends infer U & Record<typeof _N, any> ? U : T;
type Stripped = StripBrand<USD>; // number

// 44. Conditional type for type-safe record access
type SafeAccess<T extends Record<string, any>, K extends string> =
  K extends keyof T ? T[K] : undefined;
type SA = SafeAccess<{ a: string; b: number }, "a">;   // string
type SB = SafeAccess<{ a: string; b: number }, "c">;   // undefined

// 45. Conditional for method decorator typing
type DecoratedMethod<T extends (...args: any[]) => any> =
  (...args: Parameters<T>) => ReturnType<T> extends Promise<infer R> ? Promise<R> : Promise<ReturnType<T>>;

// 46. Conditional for recursive schema flattening
type FlatSchema<T> =
  T extends object
    ? { [K in keyof T]: FlatSchema<T[K]> } extends infer F
      ? F
      : never
    : T;

// 47. Conditional for monad bind type
type MonadBind<M, A, B> =
  M extends "Option"  ? (A | null) extends infer V ? (f: (v: A) => B | null) => B | null : never :
  M extends "Array"   ? A[] extends infer V ? (f: (v: A) => B[]) => B[] : never :
  never;

// 48. Conditional for type-level finite automata
type State = "idle" | "loading" | "success" | "error";
type ValidTransitions = {
  idle: "loading";
  loading: "success" | "error";
  success: "idle";
  error: "idle";
};
type CanTransit<From extends State, To extends State> =
  To extends ValidTransitions[From] ? true : false;
type CT1 = CanTransit<"idle", "loading">;  // true
type CT2 = CanTransit<"idle", "success">; // false

// 49. Conditional for algebraic data type transformer
type TransformADT<T, From, To> =
  T extends From ? To :
  T extends (infer U)[] ? TransformADT<U, From, To>[] :
  T extends object ? { [K in keyof T]: TransformADT<T[K], From, To> } :
  T;
type DateToString<T> = TransformADT<T, Date, string>;
type Serialized = DateToString<{ createdAt: Date; tags: Date[] }>;
// { createdAt: string; tags: string[] }

// 50. Conditional for type-level fold (catamorphism)
type Fold<T, Base, Rec> =
  T extends [] ? Base :
  T extends [infer H, ...infer Rest]
    ? Rec extends (head: H, acc: Fold<Rest, Base, Rec>) => infer R ? R : never
    : never;
// Cannot fully compute this at type level without recursion limit, but demonstrates the pattern
type SumTypes = Fold<[number, number, number], 0, (h: number, acc: number) => number>;
