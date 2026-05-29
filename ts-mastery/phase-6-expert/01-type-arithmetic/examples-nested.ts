export {};

// ============================================================
// Phase 6 – Expert: Type Arithmetic — NESTED (1–50)
// ============================================================

// Core utilities
type BuildTuple<N extends number, T extends unknown[] = []> =
  T["length"] extends N ? T : BuildTuple<N, [...T, unknown]>;
type Add<A extends number, B extends number> = [...BuildTuple<A>, ...BuildTuple<B>]["length"] & number;
type Sub<A extends number, B extends number> =
  BuildTuple<A> extends [...BuildTuple<B>, ...infer R] ? R["length"] & number : 0;
type Mul<A extends number, B extends number, Acc extends unknown[] = []> =
  B extends 0 ? Acc["length"] & number : Mul<A, Sub<B, 1>, [...Acc, ...BuildTuple<A>]>;
type Div<A extends number, B extends number, Acc extends unknown[] = []> =
  LT<A, B> extends true ? Acc["length"] & number : Div<Sub<A, B>, B, [...Acc, unknown]>;
type Mod<A extends number, B extends number> = LT<A, B> extends true ? A : Mod<Sub<A, B>, B>;
type LT<A extends number, B extends number> =
  BuildTuple<A> extends [...BuildTuple<B>, ...infer _] ? false :
  BuildTuple<B> extends [...BuildTuple<A>, ...infer _] ? true : false;
type GTE<A extends number, B extends number> = A extends B ? true : LT<B, A>;
type LTE<A extends number, B extends number> = A extends B ? true : LT<A, B>;
type IsEven<N extends number> = Mod<N, 2> extends 0 ? true : false;

// --- 1. Nested arithmetic: (A + B) * (C - D) ---
type NestedArith1<A extends number, B extends number, C extends number, D extends number> =
  Mul<Add<A, B>, Sub<C, D>>;
type N1 = NestedArith1<2, 3, 10, 4>; // (2+3)*(10-4) = 30

// --- 2. Deeply nested power tower: A^(B^C) ---
type Pow<B extends number, E extends number> =
  E extends 0 ? 1 : Mul<B, Pow<B, Sub<E, 1>>>;
type PowerTower<A extends number, B extends number, C extends number> = Pow<A, Pow<B, C>>;
type N2 = PowerTower<2, 2, 3>; // 2^(2^3) = 2^8 = 256

// --- 3. Nested GCD chain ---
type GCD<A extends number, B extends number> = B extends 0 ? A : GCD<B, Mod<A, B>>;
type GCDChain<T extends number[]> =
  T extends [infer H extends number] ? H :
  T extends [infer H extends number, infer N extends number, ...infer Rest extends number[]]
    ? GCDChain<[GCD<H, N>, ...Rest]>
    : 0;
type N3 = GCDChain<[48, 36, 24, 18]>; // GCD of all four = 6

// --- 4. Nested sorting with arithmetic comparator ---
type InsertSorted<T extends number[], N extends number> =
  T extends [infer H extends number, ...infer R extends number[]]
    ? LTE<N, H> extends true ? [N, ...T] : [H, ...InsertSorted<R, N>]
    : [N];
type Sort<T extends number[]> =
  T extends [infer H extends number, ...infer R extends number[]]
    ? InsertSorted<Sort<R>, H>
    : [];
type N4 = Sort<[5, 3, 8, 1, 9, 2]>; // [1, 2, 3, 5, 8, 9]

// --- 5. Nested accumulation: running maximum ---
type RunningMax<T extends number[], Max extends number = 0> =
  T extends [infer H extends number, ...infer R extends number[]]
    ? [GTE<H, Max> extends true ? H : Max, ...RunningMax<R, GTE<H, Max> extends true ? H : Max>]
    : [];
type N5 = RunningMax<[3, 1, 4, 1, 5, 9, 2, 6]>; // [3,3,4,4,5,9,9,9]

// --- 6. Nested modular arithmetic: ((A mod M1) + (B mod M2)) mod M3 ---
type NestedMod<A extends number, B extends number, M1 extends number, M2 extends number, M3 extends number> =
  Mod<Add<Mod<A, M1>, Mod<B, M2>>, M3>;
type N6 = NestedMod<17, 23, 5, 7, 8>; // (17%5 + 23%7) % 8 = (2+2)%8 = 4

// --- 7. Nested Fibonacci with memoization via conditional recursion ---
type FibN<N extends number> =
  N extends 0 ? 0 : N extends 1 ? 1 :
  N extends 2 ? 1 : N extends 3 ? 2 : N extends 4 ? 3 : N extends 5 ? 5 :
  N extends 6 ? 8 : N extends 7 ? 13 : N extends 8 ? 21 : N extends 9 ? 34 :
  Add<FibN<Sub<N, 1>>, FibN<Sub<N, 2>>>;
type N7_F10 = FibN<10>; // 55

// --- 8. Nested tuple transformation with arithmetic ---
type MapDouble<T extends number[]> =
  T extends [infer H extends number, ...infer R extends number[]]
    ? [Mul<H, 2>, ...MapDouble<R>]
    : [];
type N8 = MapDouble<[1, 2, 3, 4, 5]>; // [2, 4, 6, 8, 10]

// --- 9. Nested Pascal's triangle (2D) ---
type PascalRow<N extends number, K extends number = 0, Acc extends number[] = []> =
  GTE<K, Add<N, 1>> extends true ? Acc :
  PascalRow<N, Add<K, 1>, [...Acc, BinomCoeff<N, K>]>;
type BinomCoeff<N extends number, K extends number> =
  K extends 0 ? 1 : N extends K ? 1 :
  Add<BinomCoeff<Sub<N, 1>, Sub<K, 1>>, BinomCoeff<Sub<N, 1>, K>>;
type PascalTriangle<N extends number, Row extends number = 0, Acc extends number[][] = []> =
  Row extends N ? Acc : PascalTriangle<N, Add<Row, 1>, [...Acc, PascalRow<Row>]>;
type N9 = PascalTriangle<5>;
// [[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1]]

// --- 10. Nested digit operations: sum of digit cubes ---
type DigitToNum<D extends string> = D extends `${infer N extends number}` ? N : 0;
type CubeDigitSum<S extends string, Acc extends number = 0> =
  S extends `${infer D}${infer Rest}`
    ? CubeDigitSum<Rest, Add<Acc, Mul<DigitToNum<D>, Mul<DigitToNum<D>, DigitToNum<D>>>>>
    : Acc;
type N10 = CubeDigitSum<"153">; // 153 (Armstrong number)

// --- 11. Nested prime sieve (Sieve of Eratosthenes conceptual) ---
type MarkMultiples<N extends number, D extends number, Max extends number, Marked extends number[] = []> =
  GTE<N, Max> extends true ? Marked :
  MarkMultiples<Add<N, D>, D, Max, [...Marked, N]>;
type Sieve<Max extends number, D extends number = 2, Primes extends number[] = []> =
  GTE<D, Max> extends true ? Primes :
  IsPrimeSimple<D> extends true
    ? Sieve<Max, Add<D, 1>, [...Primes, D]>
    : Sieve<Max, Add<D, 1>, Primes>;
type IsPrimeSimple<N extends number, D extends number = 2> =
  Mul<D, D> extends infer Sq extends number
    ? GTE<Sq, N> extends true ? true
    : Mod<N, D> extends 0 ? false
    : IsPrimeSimple<N, Add<D, 1>>
    : true;
type N11_Primes = Sieve<20>; // [2,3,5,7,11,13,17,19]

// --- 12. Nested tuple zipping with arithmetic ---
type ZipWithAdd<A extends number[], B extends number[]> =
  A extends [infer HA extends number, ...infer RA extends number[]]
    ? B extends [infer HB extends number, ...infer RB extends number[]]
      ? [Add<HA, HB>, ...ZipWithAdd<RA, RB>]
      : []
    : [];
type N12 = ZipWithAdd<[1, 2, 3], [4, 5, 6]>; // [5, 7, 9]

// --- 13. Deeply nested recursive subtraction ---
type NestedSub<Ops extends [number, number][]> =
  Ops extends [[infer A extends number, infer B extends number], ...infer Rest extends [number, number][]]
    ? Add<Sub<A, B>, NestedSub<Rest>>
    : 0;
type N13 = NestedSub<[[10, 3], [7, 2], [5, 1]]>; // (7)+(5)+(4) = 16

// --- 14. Type-level statistics: mean (floor) ---
type SumTuple<T extends number[], Acc extends number = 0> =
  T extends [infer H extends number, ...infer R extends number[]]
    ? SumTuple<R, Add<Acc, H>>
    : Acc;
type Mean<T extends number[]> = Div<SumTuple<T>, T["length"] & number>;
type N14 = Mean<[2, 4, 6, 8, 10]>; // 6

// --- 15. Nested tuple of tuples: matrix addition ---
type MatAdd<A extends number[][], B extends number[][]> =
  A extends [infer RowA extends number[], ...infer RestA extends number[][]]
    ? B extends [infer RowB extends number[], ...infer RestB extends number[][]]
      ? [ZipWithAdd<RowA, RowB>, ...MatAdd<RestA, RestB>]
      : []
    : [];
type N15 = MatAdd<[[1, 2], [3, 4]], [[5, 6], [7, 8]]>; // [[6,8],[10,12]]

// --- 16. Deeply nested type-level merge sort ---
type MergeSorted<A extends number[], B extends number[]> =
  A extends [] ? B : B extends [] ? A :
  A extends [infer HA extends number, ...infer RA extends number[]]
    ? B extends [infer HB extends number, ...infer RB extends number[]]
      ? LTE<HA, HB> extends true ? [HA, ...MergeSorted<RA, B>] : [HB, ...MergeSorted<A, RB>]
      : A
    : B;
type Split<T extends number[]> = [
  { [K in keyof T as K extends `${number}` ? (K extends `${infer I extends number}` ? IsEven<I> extends true ? K : never : never) : never]: T[K & number] }[keyof T & string],
  { [K in keyof T as K extends `${number}` ? (K extends `${infer I extends number}` ? IsEven<I> extends false ? K : never : never) : never]: T[K & number] }[keyof T & string]
];
// Simplified merge sort via InsertSorted
type MergeSort<T extends number[]> =
  T extends [] ? [] : T extends [infer H] ? T :
  MergeSorted<MergeSort<EvenElements<T>>, MergeSort<OddElements<T>>>;
type EvenElements<T extends number[], I extends number = 0, Acc extends number[] = []> =
  T extends [infer H extends number, ...infer Rest extends number[]]
    ? IsEven<I> extends true ? EvenElements<Rest, Add<I, 1>, [...Acc, H]> : EvenElements<Rest, Add<I, 1>, Acc>
    : Acc;
type OddElements<T extends number[], I extends number = 0, Acc extends number[] = []> =
  T extends [infer H extends number, ...infer Rest extends number[]]
    ? IsEven<I> extends false ? OddElements<Rest, Add<I, 1>, [...Acc, H]> : OddElements<Rest, Add<I, 1>, Acc>
    : Acc;
type N16 = MergeSort<[5, 2, 8, 3, 9, 1]>; // [1,2,3,5,8,9]

// --- 17. Nested digit extraction and arithmetic ---
type Digits<N extends string, Acc extends number[] = []> =
  N extends `${infer D}${infer Rest}` ? Digits<Rest, [...Acc, DigitToNum<D>]> : Acc;
type NumDigits<N extends number> = Digits<`${N}`>;
type N17 = NumDigits<12345>; // [1,2,3,4,5]

// --- 18. Nested prime factorization with multiplicity ---
type PrimeFactors<N extends number, D extends number = 2, Acc extends number[] = []> =
  GTE<N, 2> extends false ? Acc :
  Mod<N, D> extends 0 ? PrimeFactors<Div<N, D>, D, [...Acc, D]> :
  PrimeFactors<N, Add<D, 1>, Acc>;
type Factorization<N extends number> = { factors: PrimeFactors<N>; n: N };
type N18 = Factorization<12>; // {factors: [2,2,3], n: 12}

// --- 19. Nested arithmetic expressions as type trees ---
type Expr =
  | { op: "num"; val: number }
  | { op: "add"; left: Expr; right: Expr }
  | { op: "mul"; left: Expr; right: Expr }
  | { op: "sub"; left: Expr; right: Expr };
type EvalExpr<E extends Expr> =
  E extends { op: "num"; val: infer V extends number } ? V :
  E extends { op: "add"; left: infer L extends Expr; right: infer R extends Expr } ? Add<EvalExpr<L>, EvalExpr<R>> :
  E extends { op: "mul"; left: infer L extends Expr; right: infer R extends Expr } ? Mul<EvalExpr<L>, EvalExpr<R>> :
  E extends { op: "sub"; left: infer L extends Expr; right: infer R extends Expr } ? Sub<EvalExpr<L>, EvalExpr<R>> :
  never;
type N19_Expr = EvalExpr<{ op: "add"; left: { op: "num"; val: 3 }; right: { op: "mul"; left: { op: "num"; val: 4 }; right: { op: "num"; val: 5 } } }>;
// 3 + (4 * 5) = 23

// --- 20. Nested conditional arithmetic ---
type NestedIf<Cond extends boolean, Then extends number, Else extends number> =
  Cond extends true ? Then : Else;
type AbsVal<A extends number, B extends number> =
  NestedIf<GTE<A, B>, Sub<A, B>, Sub<B, A>>;
type N20 = AbsVal<3, 7>; // 4

// --- 21. Recursive sum of nested tuples ---
type SumNested<T extends (number | number[])[]> =
  T extends [infer H, ...infer Rest extends (number | number[])[]]
    ? H extends number
      ? Add<H, SumNested<Rest>>
      : H extends number[]
        ? Add<SumTuple<H>, SumNested<Rest>>
        : SumNested<Rest>
    : 0;
type N21 = SumNested<[1, [2, 3], 4, [5, 6]]>; // 21

// --- 22. Nested collation with count ---
type CountOccurrences<T extends number[], N extends number, Acc extends unknown[] = []> =
  T extends [infer H extends number, ...infer R extends number[]]
    ? H extends N ? CountOccurrences<R, N, [...Acc, unknown]> : CountOccurrences<R, N, Acc>
    : Acc["length"] & number;
type FrequencyMap<T extends number[], Acc extends Record<string, number> = {}> =
  T extends [infer H extends number, ...infer R extends number[]]
    ? FrequencyMap<R, Omit<Acc, `${H}`> & Record<`${H}`, Add<Acc[`${H}` & keyof Acc] extends number ? Acc[`${H}` & keyof Acc] : 0, 1>>>
    : Acc;
type N22 = CountOccurrences<[1, 2, 1, 3, 1, 2], 1>; // 3

// --- 23. Nested sliding window maximum ---
type WindowMax<T extends number[], W extends number, Acc extends number[] = []> =
  T["length"] extends infer L extends number
    ? LT<L, W> extends true ? Acc
    : WindowMax<Tail<T>, W, [...Acc, MaxTuple<Take<T, W>>]>
    : Acc;
type Tail<T extends unknown[]> = T extends [infer _, ...infer R] ? R : [];
type Take<T extends unknown[], N extends number, Acc extends unknown[] = []> =
  Acc["length"] extends N ? Acc : T extends [infer H, ...infer R] ? Take<R, N, [...Acc, H]> : Acc;
type MaxTuple<T extends number[]> =
  T extends [infer H extends number] ? H :
  T extends [infer H extends number, ...infer R extends number[]]
    ? GTE<H, MaxTuple<R>> extends true ? H : MaxTuple<R>
    : 0;
type N23 = WindowMax<[1, 3, 2, 5, 4], 3>; // [3, 5, 5]

// --- 24. Nested power mod (important for cryptography) ---
type PowerMod<Base extends number, Exp extends number, M extends number> =
  Exp extends 0 ? 1 :
  IsEven<Exp> extends true
    ? Mod<Mul<PowerMod<Base, Div<Exp, 2>, M>, PowerMod<Base, Div<Exp, 2>, M>>, M>
    : Mod<Mul<Base, PowerMod<Base, Sub<Exp, 1>, M>>, M>;
// type N24 = PowerMod<2, 10, 1000>; // 2^10 mod 1000 = 24

// --- 25. Nested type-level long division ---
type LongDiv<A extends number[], B extends number, Quotient extends number[] = [], Rem extends number = 0> =
  A extends [infer D extends number, ...infer Rest extends number[]]
    ? LongDiv<Rest, B, [...Quotient, Div<Add<Mul<Rem, 10>, D>, B>], Mod<Add<Mul<Rem, 10>, D>, B>>
    : { quotient: Quotient; remainder: Rem };
type N25 = LongDiv<[1, 2, 3], 4>; // 123 / 4 = quotient [3, 0] rem 3

// --- 26. Nested tuple convolution ---
type Convolve<A extends number[], B extends number[], N extends number = 0, Acc extends number[] = []> =
  N extends Add<A["length"] & number, Sub<B["length"] & number, 1>>
    ? Acc
    : Convolve<A, B, Add<N, 1>, [...Acc, ConvPoint<A, B, N>]>;
type ConvPoint<A extends number[], B extends number[], N extends number, K extends number = 0, Acc extends number = 0> =
  K extends Add<N, 1>
    ? Acc
    : ConvPoint<A, B, N, Add<K, 1>, Add<Acc, Mul<GetAt<A, K>, GetAt<B, Sub<N, K>>>>>;
type GetAt<T extends number[], I extends number> = T[I] extends number ? T[I] : 0;
// type N26 = Convolve<[1, 2, 1], [1, 0, -1]>; // limited by no-negative handling

// --- 27. Nested matrix power ---
type MatMul<A extends number[][], B extends number[][]> =
  A extends [infer RA extends number[], ...infer RestA extends number[][]]
    ? [MatMulRow<RA, B>, ...MatMul<RestA, B>]
    : [];
type MatMulRow<Row extends number[], B extends number[], ColIdx extends number = 0, Acc extends number[] = []> =
  ColIdx extends (B[0] extends unknown[] ? B[0]["length"] : 0)
    ? Acc
    : MatMulRow<Row, B, Add<ColIdx, 1>, [...Acc, DotProduct<Row, GetCol<B, ColIdx>>]>;
type GetCol<M extends number[][], I extends number> =
  M extends [infer Row extends number[], ...infer Rest extends number[][]]
    ? [GetAt<Row, I>, ...GetCol<Rest, I>]
    : [];
type DotProduct<A extends number[], B extends number[], Acc extends number = 0> =
  A extends [infer HA extends number, ...infer RA extends number[]]
    ? B extends [infer HB extends number, ...infer RB extends number[]]
      ? DotProduct<RA, RB, Add<Acc, Mul<HA, HB>>>
      : Acc
    : Acc;

// --- 28. Nested type-level base conversion ---
type ToBase<N extends number, B extends number, Acc extends number[] = []> =
  N extends 0 ? (Acc extends [] ? [0] : Acc) :
  ToBase<Div<N, B>, B, [Mod<N, B>, ...Acc]>;
type N28_Bin = ToBase<13, 2>; // [1, 1, 0, 1]
type N28_Hex = ToBase<255, 16>; // [15, 15]

// --- 29. Nested accumulator with two passes ---
type TwoPassSum<T extends number[]> = {
  forward: PrefixSums<T>;
  backward: PrefixSums<Reverse<T>>;
};
type PrefixSums<T extends number[], Sum extends number = 0, Acc extends number[] = []> =
  T extends [infer H extends number, ...infer R extends number[]]
    ? PrefixSums<R, Add<Sum, H>, [...Acc, Add<Sum, H>]>
    : Acc;
type Reverse<T extends unknown[], Acc extends unknown[] = []> =
  T extends [infer H, ...infer R] ? Reverse<R, [H, ...Acc]> : Acc;
type N29 = TwoPassSum<[1, 2, 3]>;
// {forward: [1,3,6], backward: [3,5,6]}

// --- 30. Nested recursive structure: N-ary tree depth ---
type NaryTree<Val extends number> = { val: Val; children: NaryTree<number>[] };
type TreeDepth<T extends NaryTree<number>> =
  T["children"] extends [] ? 1 :
  Add<1, MaxTuple<{ [K in keyof T["children"]]: 1 }[number] extends number ? [1] : [1]>[0] extends number ? 1 : 1>;

// --- 31. Nested integer intervals ---
type Interval<Lo extends number, Hi extends number> = { lo: Lo; hi: Hi };
type IntervalOverlap<A extends Interval<number, number>, B extends Interval<number, number>> =
  GTE<A["hi"], B["lo"]> extends true ? LTE<A["lo"], B["hi"]> extends true ? true : false : false;
type IntervalLen<I extends Interval<number, number>> = Sub<I["hi"], I["lo"]>;
type N31_Overlap = IntervalOverlap<Interval<1, 5>, Interval<3, 8>>; // true

// --- 32. Nested cumulative product ---
type CumProd<T extends number[], Prod extends number = 1, Acc extends number[] = []> =
  T extends [infer H extends number, ...infer R extends number[]]
    ? CumProd<R, Mul<Prod, H>, [...Acc, Mul<Prod, H>]>
    : Acc;
type N32 = CumProd<[1, 2, 3, 4]>; // [1, 2, 6, 24]

// --- 33. Nested type-level lookup table ---
type FibLUT = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55];
type FibLookup<N extends number> = N extends keyof FibLUT ? FibLUT[N] : never;
type N33 = FibLookup<7>; // 13

// --- 34. Nested string digit arithmetic ---
type AddStrNums<A extends string, B extends string> =
  `${Add<StrToNum<A>, StrToNum<B>>}`;
type StrToNum<S extends string> = S extends `${infer N extends number}` ? N : 0;
type N34 = AddStrNums<"123", "456">; // "579"

// --- 35. Nested type-level unit conversion ---
type MetersToFeet<M extends number> = Div<Mul<M, 328>, 100>;
type FeetToInches<F extends number> = Mul<F, 12>;
type MetersToInches<M extends number> = FeetToInches<MetersToFeet<M>>;
type N35 = MetersToInches<2>; // ~78 inches

// --- 36. Nested integer overflow detection (modular arithmetic) ---
type U8 = 256;
type U8Add<A extends number, B extends number> = Mod<Add<A, B>, U8>;
type U8Mul<A extends number, B extends number> = Mod<Mul<A, B>, U8>;
type N36 = U8Add<200, 100>; // 44 (overflow wraps)

// --- 37. Nested type-level polynomial multiplication ---
type PolyMul<A extends number[], B extends number[], Acc extends number[] = []> =
  A extends [infer HA extends number, ...infer RA extends number[]]
    ? PolyMul<RA, B, PolyAdd<Acc, MapScale<B, HA, Acc["length"] & number>>>
    : Acc;
type MapScale<T extends number[], S extends number, Shift extends number> =
  [...BuildTuple<Shift> extends infer P extends unknown[] ? P : never, ...{ [K in keyof T]: T[K] extends number ? Mul<T[K], S> : 0 }];
type PolyAdd<A extends number[], B extends number[]> = ZipWithAdd_<A, B>;
type ZipWithAdd_<A extends number[], B extends number[]> =
  A extends [infer HA extends number, ...infer RA extends number[]]
    ? B extends [infer HB extends number, ...infer RB extends number[]]
      ? [Add<HA, HB>, ...ZipWithAdd_<RA, RB>]
      : A
    : B;

// --- 38. Nested bit manipulation chain ---
type BitChain<N extends number> = {
  n: N;
  lshift2: Mul<N, 4>;
  rshift1: Div<N, 2>;
  and15: Mod<N, 16>;
  or8: Sub<Add<N, 8>, Mul<Mod<N, 8>, Div<N, 8>>>;
};
type N38 = BitChain<13>;

// --- 39. Nested type-level multiset operations ---
type MultisetAdd<A extends Record<string, number>, B extends Record<string, number>> = {
  [K in keyof A | keyof B]: K extends keyof A ? K extends keyof B
    ? Add<A[K] & number, B[K] & number>
    : A[K]
    : K extends keyof B ? B[K] : never
};
type A_ = { a: 2; b: 3 };
type B_ = { b: 1; c: 4 };
type N39 = MultisetAdd<A_, B_>; // {a:2, b:4, c:4}

// --- 40. Nested arithmetic in type constraints ---
type Matrix<R extends number, C extends number> = { rows: R; cols: C; data: number[][] };
type ValidMul<A extends Matrix<number, number>, B extends Matrix<number, number>> =
  A["cols"] extends B["rows"] ? true : false;
type MatResult<A extends Matrix<number, number>, B extends Matrix<number, number>> =
  ValidMul<A, B> extends true ? Matrix<A["rows"], B["cols"]> : never;
type N40 = MatResult<Matrix<2, 3>, Matrix<3, 4>>; // Matrix<2, 4>

// --- 41. Nested arithmetic series ---
type ArithSeries<Start extends number, Step extends number, Count extends number, Acc extends number[] = []> =
  Acc["length"] extends Count ? Acc :
  ArithSeries<Add<Start, Step>, Step, Count, [...Acc, Start]>;
type N41 = ArithSeries<1, 2, 5>; // [1, 3, 5, 7, 9]

// --- 42. Nested number decomposition and recomposition ---
type SplitDigits<N extends number> = Digits<`${N}`>;
type Digits<S extends string, Acc extends number[] = []> =
  S extends `${infer D}${infer R}` ? Digits<R, [...Acc, DigitToNum<D>]> : Acc;
type DigitToNum<D extends string> = D extends `${infer N extends number}` ? N : 0;
type RecomposeDigits<D extends number[]> = SumTuple<ZipWithMul<D, Powers10<D["length"] & number>>>;
type ZipWithMul<A extends number[], B extends number[]> =
  A extends [infer HA extends number, ...infer RA extends number[]]
    ? B extends [infer HB extends number, ...infer RB extends number[]]
      ? [Mul<HA, HB>, ...ZipWithMul<RA, RB>]
      : []
    : [];
type Pow10<N extends number> = Pow<10, N>;
type Pow<B extends number, E extends number> = E extends 0 ? 1 : Mul<B, Pow<B, Sub<E, 1>>>;
type Powers10<N extends number, Acc extends number[] = []> =
  Acc["length"] extends N ? Acc : Powers10<N, [...Acc, Pow10<Sub<N, Add<Acc["length"] & number, 1>>>]>;
type SumTuple<T extends number[], Acc extends number = 0> =
  T extends [infer H extends number, ...infer R extends number[]] ? SumTuple<R, Add<Acc, H>> : Acc;
type N42_Digits = SplitDigits<123>; // [1, 2, 3]

// --- 43. Nested range intersection ---
type RangeIntersect<A extends [number, number], B extends [number, number]> =
  GTE<A[1], B[0]> extends true ? LTE<A[0], B[1]> extends true
    ? [GTE<A[0], B[0]> extends true ? A[0] : B[0], LTE<A[1], B[1]> extends true ? A[1] : B[1]]
    : never
  : never;
type N43 = RangeIntersect<[2, 8], [5, 12]>; // [5, 8]

// --- 44. Nested arithmetic in tuple mapping ---
type MapMod<T extends number[], M extends number> =
  T extends [infer H extends number, ...infer R extends number[]]
    ? [Mod<H, M>, ...MapMod<R, M>]
    : [];
type N44 = MapMod<[10, 15, 20, 25], 7>; // [3, 1, 6, 4]

// --- 45. Nested difference array ---
type DiffArray<T extends number[], Acc extends number[] = []> =
  T extends [infer A extends number, infer B extends number, ...infer R extends number[]]
    ? DiffArray<[B, ...R], [...Acc, Sub<B, A>]>
    : Acc;
type N45 = DiffArray<[1, 4, 2, 8, 5]>; // [3, ???, 6, ???] -- negative not shown

// --- 46. Nested combination generator ---
type Combinations<T extends number[], K extends number> =
  K extends 0 ? [[]] :
  T extends [infer H extends number, ...infer R extends number[]]
    ? [...MapPrepend<H, Combinations<R, Sub<K, 1>>>, ...Combinations<R, K>]
    : [];
type MapPrepend<V extends number, T extends number[][]> =
  T extends [infer H extends number[], ...infer R extends number[][]]
    ? [[V, ...H], ...MapPrepend<V, R>]
    : [];
type N46 = Combinations<[1, 2, 3, 4], 2>;
// [[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]]

// --- 47. Nested type-level memo table ---
type Memo = Record<string, number>;
type WithMemo<N extends number, M extends Memo = {}> =
  `${N}` extends keyof M ? M[`${N}`] :
  N extends 0 ? 0 : N extends 1 ? 1 :
  Add<FibN<Sub<N, 1>>, FibN<Sub<N, 2>>>;
type FibN<N extends number> = N extends 0 ? 0 : N extends 1 ? 1 :
  N extends 2 ? 1 : N extends 3 ? 2 : N extends 4 ? 3 : N extends 5 ? 5 :
  Add<FibN<Sub<N, 1>>, FibN<Sub<N, 2>>>;

// --- 48. Nested floor division and remainder ---
type DivRem<A extends number, B extends number> = { q: Div<A, B>; r: Mod<A, B> };
type N48 = DivRem<17, 5>; // { q: 3; r: 2 }

// --- 49. Nested type composition with arithmetic bounds ---
type Bounded<Lo extends number, Hi extends number> = {
  range: [Lo, Hi];
  size: Sub<Hi, Lo>;
  midpoint: Div<Add<Lo, Hi>, 2>;
};
type BinarySearch<Lo extends number, Hi extends number> = {
  mid: Div<Add<Lo, Hi>, 2>;
  left: Bounded<Lo, Div<Add<Lo, Hi>, 2>>;
  right: Bounded<Div<Add<Lo, Hi>, 2>, Hi>;
};
type N49 = BinarySearch<0, 16>;

// --- 50. Comprehensive nested arithmetic: stats over a range ---
type RangeStats<Lo extends number, Hi extends number> = {
  range: [Lo, Hi];
  count: Sub<Hi, Lo>;
  sum: SumRange<Lo, Hi>;
  min: Lo;
  max: Sub<Hi, 1>;
  mean: Div<SumRange<Lo, Hi>, Sub<Hi, Lo>>;
};
type SumRange<Lo extends number, Hi extends number> =
  Lo extends Hi ? 0 : Add<Lo, SumRange<Add<Lo, 1>, Hi>>;
type N50 = RangeStats<1, 6>;
// {range:[1,6], count:5, sum:15, min:1, max:5, mean:3}
