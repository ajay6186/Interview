// ============================================================================
// Solution 6.1 — Type-Level Arithmetic
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// Helper: Build a tuple of length N
// ---------------------------------------------------------------------------

type BuildTuple<N extends number, T extends any[] = []> =
  T["length"] extends N ? T : BuildTuple<N, [...T, 0]>;

type TestBuild = Expect<Equal<BuildTuple<3>, [0, 0, 0]>>;

// ---------------------------------------------------------------------------
// 1. Addition
// ---------------------------------------------------------------------------

type Add<A extends number, B extends number> =
  [...BuildTuple<A>, ...BuildTuple<B>]["length"] extends infer R extends number ? R : never;

type TestAdd1 = Expect<Equal<Add<2, 3>, 5>>;
type TestAdd2 = Expect<Equal<Add<0, 0>, 0>>;
type TestAdd3 = Expect<Equal<Add<10, 5>, 15>>;

// ---------------------------------------------------------------------------
// 2. Subtraction
// ---------------------------------------------------------------------------

type Subtract<A extends number, B extends number> =
  BuildTuple<A> extends [...BuildTuple<B>, ...infer Rest] ? Rest["length"] : never;

type TestSub1 = Expect<Equal<Subtract<5, 3>, 2>>;
type TestSub2 = Expect<Equal<Subtract<10, 0>, 10>>;
type TestSub3 = Expect<Equal<Subtract<7, 7>, 0>>;

// ---------------------------------------------------------------------------
// 3. Less than
// ---------------------------------------------------------------------------

type LessThan<A extends number, B extends number, TA extends any[] = BuildTuple<A>, TB extends any[] = BuildTuple<B>> =
  TA extends [any, ...infer RestA]
    ? TB extends [any, ...infer RestB]
      ? LessThan<A, B, RestA, RestB>
      : false
    : TB extends [any, ...any[]]
      ? true
      : false;

type TestLt1 = Expect<Equal<LessThan<2, 5>, true>>;
type TestLt2 = Expect<Equal<LessThan<5, 2>, false>>;
type TestLt3 = Expect<Equal<LessThan<3, 3>, false>>;

// ---------------------------------------------------------------------------
// 4. Multiply
// ---------------------------------------------------------------------------

type Multiply<A extends number, B extends number, Acc extends any[] = []> =
  B extends 0
    ? Acc["length"] extends infer R extends number ? R : never
    : BuildTuple<B> extends [any, ...infer RestB]
      ? RestB["length"] extends infer NewB extends number
        ? Multiply<A, NewB, [...Acc, ...BuildTuple<A>]>
        : never
      : never;

type TestMul1 = Expect<Equal<Multiply<3, 4>, 12>>;
type TestMul2 = Expect<Equal<Multiply<5, 0>, 0>>;
type TestMul3 = Expect<Equal<Multiply<2, 6>, 12>>;

// ---------------------------------------------------------------------------
// 5. Integer range
// ---------------------------------------------------------------------------

type Range<Start extends number, End extends number, Acc extends number = never, Counter extends any[] = BuildTuple<Start>> =
  Counter["length"] extends End
    ? Acc | End
    : Range<Start, End, Acc | Counter["length"], [...Counter, 0]>;

type TestRange = Expect<Equal<Range<2, 5>, 2 | 3 | 4 | 5>>;

console.log("Solution 6.1 — All type tests passed (compile-time only)!");

export {};
