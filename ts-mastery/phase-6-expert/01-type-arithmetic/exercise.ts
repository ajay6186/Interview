// ============================================================================
// Exercise 6.1 — Type-Level Arithmetic
// ============================================================================
// Implement addition, subtraction, and comparison at the type level using
// tuple length encoding.
//
// Instructions: Fill in every TODO so the file compiles with no type errors.
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// Helper: Build a tuple of length N
// ---------------------------------------------------------------------------

// TODO: Create a tuple of N elements (filled with 0s)
// BuildTuple<3> → [0, 0, 0]
type BuildTuple<N extends number, T extends any[] = []> = any;

type TestBuild = Expect<Equal<BuildTuple<3>, [0, 0, 0]>>;

// ---------------------------------------------------------------------------
// 1. Addition
// ---------------------------------------------------------------------------

// TODO: Add two numbers at the type level
// Add<2, 3> → 5
// Hint: concatenate two tuples and get the length
type Add<A extends number, B extends number> = any;

type TestAdd1 = Expect<Equal<Add<2, 3>, 5>>;
type TestAdd2 = Expect<Equal<Add<0, 0>, 0>>;
type TestAdd3 = Expect<Equal<Add<10, 5>, 15>>;

// ---------------------------------------------------------------------------
// 2. Subtraction
// ---------------------------------------------------------------------------

// TODO: Subtract B from A (assume A >= B)
// Subtract<5, 3> → 2
// Hint: if [...BuildTuple<B>, ...infer Rest] matches BuildTuple<A>, Rest['length'] is the answer
type Subtract<A extends number, B extends number> = any;

type TestSub1 = Expect<Equal<Subtract<5, 3>, 2>>;
type TestSub2 = Expect<Equal<Subtract<10, 0>, 10>>;
type TestSub3 = Expect<Equal<Subtract<7, 7>, 0>>;

// ---------------------------------------------------------------------------
// 3. Less than
// ---------------------------------------------------------------------------

// TODO: Is A < B?
type LessThan<A extends number, B extends number> = any;

type TestLt1 = Expect<Equal<LessThan<2, 5>, true>>;
type TestLt2 = Expect<Equal<LessThan<5, 2>, false>>;
type TestLt3 = Expect<Equal<LessThan<3, 3>, false>>;

// ---------------------------------------------------------------------------
// 4. Multiply
// ---------------------------------------------------------------------------

// TODO: Multiply two numbers at the type level
// Multiply<3, 4> → 12
// Hint: add A to itself B times using recursion
type Multiply<A extends number, B extends number> = any;

type TestMul1 = Expect<Equal<Multiply<3, 4>, 12>>;
type TestMul2 = Expect<Equal<Multiply<5, 0>, 0>>;
type TestMul3 = Expect<Equal<Multiply<2, 6>, 12>>;

// ---------------------------------------------------------------------------
// 5. Integer range
// ---------------------------------------------------------------------------

// TODO: Generate a union of integers from Start to End (inclusive)
// Range<2, 5> → 2 | 3 | 4 | 5
type Range<Start extends number, End extends number> = any;

type TestRange = Expect<Equal<Range<2, 5>, 2 | 3 | 4 | 5>>;

console.log("Exercise 6.1 — All type tests passed (compile-time only)!");

export {};
