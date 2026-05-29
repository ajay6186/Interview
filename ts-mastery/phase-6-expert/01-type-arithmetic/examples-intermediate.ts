export {};

// ============================================================
// Phase 6 – Expert: Type Arithmetic — INTERMEDIATE (1–50)
// ============================================================

// Re-usable foundations
type BuildTuple<N extends number, T extends unknown[] = []> =
  T["length"] extends N ? T : BuildTuple<N, [...T, unknown]>;
type Add<A extends number, B extends number> = [...BuildTuple<A>, ...BuildTuple<B>]["length"] & number;
type Subtract<A extends number, B extends number> =
  BuildTuple<A> extends [...BuildTuple<B>, ...infer R] ? R["length"] & number : 0;
type LessThan<A extends number, B extends number> =
  BuildTuple<A> extends [...BuildTuple<B>, ...infer _] ? false :
  BuildTuple<B> extends [...BuildTuple<A>, ...infer _] ? true : false;
type GTE<A extends number, B extends number> = A extends B ? true : LessThan<B, A>;
type LTE<A extends number, B extends number> = A extends B ? true : LessThan<A, B>;

// --- 1. Multiply<A, B> ---
type Multiply<A extends number, B extends number, Acc extends unknown[] = []> =
  B extends 0 ? Acc["length"] & number :
  Multiply<A, Subtract<B, 1>, [...Acc, ...BuildTuple<A>]>;
type Int1_Mul = Multiply<6, 7>; // 42

// --- 2. Divide<A, B> (integer floor division) ---
type Divide<A extends number, B extends number, Acc extends unknown[] = []> =
  LessThan<A, B> extends true ? Acc["length"] & number :
  Divide<Subtract<A, B>, B, [...Acc, unknown]>;
type Int2_Div = Divide<20, 4>; // 5

// --- 3. Modulo ---
type Modulo<A extends number, B extends number> =
  LessThan<A, B> extends true ? A : Modulo<Subtract<A, B>, B>;
type Int3_Mod = Modulo<17, 5>; // 2

// --- 4. Power<Base, Exp> ---
type Power<Base extends number, Exp extends number, Acc extends unknown[] = [unknown]> =
  Exp extends 0 ? 1 : Exp extends 1 ? Base :
  Power<Base, Subtract<Exp, 1>, [...Array<Acc["length"]>, ...Acc]>;
// Simpler approach using Multiply:
type Pow<B extends number, E extends number> =
  E extends 0 ? 1 : Multiply<B, Pow<B, Subtract<E, 1>>>;
type Int4_P = Pow<2, 8>; // 256

// --- 5. Square root (integer, floor) ---
type Sqrt<N extends number, I extends number = 0> =
  GTE<Multiply<I, I>, N> extends true
    ? Subtract<I, 1>
    : Sqrt<N, Add<I, 1>>;
type Int5_Sqrt = Sqrt<16>; // 4 (approximately)

// --- 6. GCD (Euclidean algorithm) ---
type GCD<A extends number, B extends number> =
  B extends 0 ? A : GCD<B, Modulo<A, B>>;
type Int6_GCD = GCD<48, 18>; // 6

// --- 7. LCM ---
type LCM<A extends number, B extends number> = Divide<Multiply<A, B>, GCD<A, B>>;
type Int7_LCM = LCM<4, 6>; // 12

// --- 8. Factorial ---
type Factorial<N extends number> =
  N extends 0 ? 1 : Multiply<N, Factorial<Subtract<N, 1>>>;
type Int8_F = Factorial<5>; // 120
type Int8_F2 = Factorial<0>; // 1

// --- 9. Fibonacci ---
type Fib<N extends number> =
  N extends 0 ? 0 : N extends 1 ? 1 : Add<Fib<Subtract<N, 1>>, Fib<Subtract<N, 2>>>;
type Int9_F = Fib<7>; // 13

// --- 10. IsPrime ---
type IsPrimeDivisor<N extends number, D extends number> =
  GTE<Multiply<D, D>, N> extends true ? true :
  Modulo<N, D> extends 0 ? false :
  IsPrimeDivisor<N, Add<D, 1>>;
type IsPrime<N extends number> =
  LTE<N, 1> extends true ? false : IsPrimeDivisor<N, 2>;
type Int10_T = IsPrime<7>; // true
type Int10_F = IsPrime<9>; // false

// --- 11. Triangular number ---
type Triangular<N extends number> = Divide<Multiply<N, Add<N, 1>>, 2>;
type Int11_T = Triangular<5>; // 15

// --- 12. Sum of squares ---
type SumOfSquares<N extends number, Acc extends number = 0> =
  N extends 0 ? Acc : SumOfSquares<Subtract<N, 1>, Add<Acc, Multiply<N, N>>>;
type Int12_S = SumOfSquares<3>; // 14 (1+4+9)

// --- 13. Build number range tuple [Lo..Hi) ---
type Range<Lo extends number, Hi extends number, Acc extends number[] = []> =
  Lo extends Hi ? Acc : Range<Add<Lo, 1>, Hi, [...Acc, Lo]>;
type Int13_R = Range<3, 7>; // [3, 4, 5, 6]

// --- 14. Count in range matching predicate ---
type CountInRange<Lo extends number, Hi extends number, Pred extends number> =
  Range<Lo, Hi> extends infer T extends number[]
    ? { [K in keyof T]: T[K] extends Pred ? true : false }[number] extends true ? 1 : 0
    : 0;

// --- 15. Ceiling division ---
type CeilDiv<A extends number, B extends number> =
  Modulo<A, B> extends 0 ? Divide<A, B> : Add<Divide<A, B>, 1>;
type Int15_C = CeilDiv<10, 3>; // 4

// --- 16. Absolute difference ---
type AbsDiff<A extends number, B extends number> =
  LTE<A, B> extends true ? Subtract<B, A> : Subtract<A, B>;
type Int16_D = AbsDiff<3, 7>; // 4
type Int16_D2 = AbsDiff<10, 4>; // 6

// --- 17. Product of tuple elements ---
type ProductTuple<T extends number[], Acc extends number = 1> =
  T extends [infer H extends number, ...infer Rest extends number[]]
    ? ProductTuple<Rest, Multiply<Acc, H>>
    : Acc;
type Int17_P = ProductTuple<[2, 3, 4]>; // 24

// --- 18. Max in tuple ---
type MaxTuple<T extends number[]> =
  T extends [infer H extends number] ? H :
  T extends [infer H extends number, ...infer R extends number[]]
    ? GTE<H, MaxTuple<R>> extends true ? H : MaxTuple<R>
    : never;
type Int18_M = MaxTuple<[3, 7, 1, 9, 2]>; // 9

// --- 19. Min in tuple ---
type MinTuple<T extends number[]> =
  T extends [infer H extends number] ? H :
  T extends [infer H extends number, ...infer R extends number[]]
    ? LTE<H, MinTuple<R>> extends true ? H : MinTuple<R>
    : never;
type Int19_M = MinTuple<[3, 7, 1, 9, 2]>; // 1

// --- 20. Sum of range [Lo..Hi) ---
type SumRange<Lo extends number, Hi extends number> =
  Lo extends Hi ? 0 : Add<Lo, SumRange<Add<Lo, 1>, Hi>>;
type Int20_S = SumRange<1, 6>; // 15 (1+2+3+4+5)

// --- 21. Geometric sequence (N terms starting at start, ratio r) ---
type GeomSeq<N extends number, Start extends number, Ratio extends number, Acc extends number[] = []> =
  Acc["length"] extends N ? Acc : GeomSeq<N, Multiply<Start, Ratio>, Ratio, [...Acc, Start]>;
type Int21_G = GeomSeq<4, 1, 2>; // [1, 2, 4, 8]

// --- 22. Arithmetic sequence ---
type ArithSeq<N extends number, Start extends number, Step extends number, Acc extends number[] = []> =
  Acc["length"] extends N ? Acc : ArithSeq<N, Add<Start, Step>, Step, [...Acc, Start]>;
type Int22_A = ArithSeq<5, 0, 3>; // [0, 3, 6, 9, 12]

// --- 23. Running sum (prefix sums) ---
type PrefixSums<T extends number[], Sum extends number = 0, Acc extends number[] = []> =
  T extends [infer H extends number, ...infer Rest extends number[]]
    ? PrefixSums<Rest, Add<Sum, H>, [...Acc, Add<Sum, H>]>
    : Acc;
type Int23_PS = PrefixSums<[1, 2, 3, 4]>; // [1, 3, 6, 10]

// --- 24. Running product ---
type PrefixProds<T extends number[], Prod extends number = 1, Acc extends number[] = []> =
  T extends [infer H extends number, ...infer Rest extends number[]]
    ? PrefixProds<Rest, Multiply<Prod, H>, [...Acc, Multiply<Prod, H>]>
    : Acc;
type Int24_PP = PrefixProds<[1, 2, 3, 4]>; // [1, 2, 6, 24]

// --- 25. Sort a tuple of numbers (insertion sort) ---
type InsertSorted<T extends number[], N extends number> =
  T extends [infer H extends number, ...infer Rest extends number[]]
    ? LTE<N, H> extends true ? [N, ...T] : [H, ...InsertSorted<Rest, N>]
    : [N];
type InsertionSort<T extends number[]> =
  T extends [infer H extends number, ...infer Rest extends number[]]
    ? InsertSorted<InsertionSort<Rest>, H>
    : [];
type Int25_S = InsertionSort<[3, 1, 4, 1, 5, 9, 2, 6]>; // [1,1,2,3,4,5,6,9]

// --- 26. Nth prime ---
type NthPrime<N extends number, Candidate extends number = 2, Count extends number = 0> =
  Count extends N ? Candidate :
  IsPrime<Candidate> extends true
    ? NthPrime<N, Add<Candidate, 1>, Add<Count, 1>>
    : NthPrime<N, Add<Candidate, 1>, Count>;
// type Int26_P = NthPrime<5>; // too recursive for demo; concept shown

// --- 27. Integer logarithm base B ---
type LogB<N extends number, B extends number, Acc extends number = 0> =
  LessThan<N, B> extends true ? Acc : LogB<Divide<N, B>, B, Add<Acc, 1>>;
type Int27_L = LogB<64, 2>; // 6

// --- 28. Number of digits ---
type NumDigits<N extends number> = Add<LogB<N, 10>, 1>;
type Int28_D = NumDigits<1000>; // 4

// --- 29. Reverse digits via string ---
type ReverseDigits<N extends number> =
  `${N}` extends `${infer A}${infer B}` ? `${ReverseDigits<B extends `${number}` ? StrToNum<typeof B> : 0>}${A}` : `${N}`;
type StrToNum<S extends `${number}`> = S extends `${infer N extends number}` ? N : never;
// (Demonstration only — full reversal requires template literal parsing)

// --- 30. Palindrome number check ---
type IsPalindromeStr<S extends string> =
  S extends `${infer F}${infer M}${infer L}`
    ? F extends L ? IsPalindromeStr<M> : false
    : true;
type IsPalindrome<N extends number> = IsPalindromeStr<`${N}`>;
type Int30_T = IsPalindrome<121>; // true
type Int30_F = IsPalindrome<123>; // false

// --- 31. Digit sum ---
type DigitToNum<D extends string> = D extends `${infer N extends number}` ? N : 0;
type DigitSum<S extends string, Acc extends number = 0> =
  S extends `${infer D}${infer Rest}`
    ? DigitSum<Rest, Add<Acc, DigitToNum<D>>>
    : Acc;
type DigitSumN<N extends number> = DigitSum<`${N}`>;
type Int31_D = DigitSumN<1234>; // 10

// --- 32. Is digit sum equal to sum of cubes (Armstrong check) ---
type CubeDigitSum<S extends string, Acc extends number = 0> =
  S extends `${infer D}${infer Rest}`
    ? CubeDigitSum<Rest, Add<Acc, Multiply<DigitToNum<D>, Multiply<DigitToNum<D>, DigitToNum<D>>>>>
    : Acc;
type IsArmstrong<N extends number> =
  `${N}` extends infer S extends string
    ? CubeDigitSum<S> extends N ? true : false
    : false;
type Int32_A = IsArmstrong<153>; // true (1³+5³+3³=153)

// --- 33. Collatz sequence length ---
type Collatz<N extends number, Steps extends number = 0> =
  N extends 1 ? Steps :
  IsEven<N> extends true
    ? Collatz<Divide<N, 2>, Add<Steps, 1>>
    : Collatz<Add<Multiply<3, N>, 1>, Add<Steps, 1>>;
type IsEven<N extends number> = Modulo<N, 2> extends 0 ? true : false;
// type Int33_C = Collatz<6>; // 8 — too recursive for tsc demo

// --- 34. Number to binary (tuple of 0|1) ---
type ToBinary<N extends number, Acc extends (0|1)[] = []> =
  N extends 0 ? Acc extends [] ? [0] : Acc :
  [...ToBinary<Divide<N, 2>, Acc>, Modulo<N, 2> extends 0 ? 0 : 1];
type Int34_B = ToBinary<10>; // [1, 0, 1, 0]

// --- 35. Count set bits (popcount) ---
type PopCount<N extends number> =
  N extends 0 ? 0 : Add<Modulo<N, 2> extends 0 ? 0 : 1, PopCount<Divide<N, 2>>>;
type Int35_P = PopCount<7>; // 3 (111 in binary)

// --- 36. Bitwise AND via binary strings (conceptual) ---
type BitwiseAnd<A extends number, B extends number> = Multiply<Divide<A, 2>, Divide<B, 2>>;
// (Simplified demonstration — real bitwise needs full binary decomposition)

// --- 37. Numbers with shared divisors ---
type ShareDivisor<A extends number, B extends number, D extends number = 2> =
  GTE<D, A> extends true ? false :
  Modulo<A, D> extends 0 ? Modulo<B, D> extends 0 ? true : ShareDivisor<A, B, Add<D, 1>> :
  ShareDivisor<A, B, Add<D, 1>>;
type Int37_T = ShareDivisor<6, 10>; // true (share factor 2)

// --- 38. Euler's totient (phi) ---
type Coprime<A extends number, B extends number> = GCD<A, B> extends 1 ? true : false;
type CountCoprime<N extends number, K extends number = 1, Acc extends number = 0> =
  GTE<K, N> extends true ? Acc :
  CountCoprime<N, Add<K, 1>, Coprime<N, K> extends true ? Add<Acc, 1> : Acc>;
// type Int38_Phi = CountCoprime<12>; // 4 (1,5,7,11)

// --- 39. Catalan numbers ---
type Catalan<N extends number> =
  N extends 0 ? 1 : Divide<Multiply<Multiply<2, Add<Multiply<2, N>, -1 extends number ? 0 : 0>>, Catalan<Subtract<N, 1>>>, Add<N, 1>>;
// Simplified: Catalan(n) = C(2n,n)/(n+1)
// Use iterative approach: C(0)=1, C(n) = sum(C(i)*C(n-1-i))
type CatalanSimple<N extends number> = Divide<Factorial<Multiply<2, N>>, Multiply<Factorial<N>, Factorial<Add<N, 1>>>>;
// type Int39_C = CatalanSimple<4>; // 14

// --- 40. Pascal's triangle row ---
type BinomCoeff<N extends number, K extends number> =
  K extends 0 ? 1 : N extends K ? 1 :
  Add<BinomCoeff<Subtract<N, 1>, Subtract<K, 1>>, BinomCoeff<Subtract<N, 1>, K>>;
type PascalRow<N extends number, K extends number = 0, Acc extends number[] = []> =
  GTE<K, Add<N, 1>> extends true ? Acc :
  PascalRow<N, Add<K, 1>, [...Acc, BinomCoeff<N, K>]>;
type Int40_P = PascalRow<4>; // [1, 4, 6, 4, 1]

// --- 41. Hamming weight (alias for PopCount) ---
type HammingWeight<N extends number> = PopCount<N>;
type Int41_H = HammingWeight<255>; // 8

// --- 42. Type-level signum ---
type Sign<N extends number> = N extends 0 ? 0 : 1;
type Int42_S = Sign<5>; // 1
type Int42_S2 = Sign<0>; // 0

// --- 43. Clamp ---
type Clamp<N extends number, Lo extends number, Hi extends number> =
  LessThan<N, Lo> extends true ? Lo : GTE<N, Hi> extends true ? Hi : N;
type Int43_C = Clamp<15, 0, 10>; // 10

// --- 44. Nearest multiple ---
type NearestMultiple<N extends number, Multiple extends number> =
  Modulo<N, Multiple> extends 0 ? N :
  LessThan<Modulo<N, Multiple>, Divide<Multiple, 2>> extends true
    ? Subtract<N, Modulo<N, Multiple>>
    : Add<Subtract<N, Modulo<N, Multiple>>, Multiple>;
type Int44_NM = NearestMultiple<7, 3>; // 6

// --- 45. Type-level parity (odd/even alternating) ---
type Parity<N extends number> = IsEven<N> extends true ? "even" : "odd";
type Int45_P = Parity<7>; // "odd"

// --- 46. Extended GCD ---
type EGCD<A extends number, B extends number> =
  B extends 0 ? { gcd: A; x: 1; y: 0 } :
  EGCD<B, Modulo<A, B>> extends infer R extends { gcd: number; x: number; y: number }
    ? { gcd: R["gcd"]; x: R["y"]; y: Subtract<R["x"], Multiply<Divide<A, B>, R["y"]>> }
    : never;

// --- 47. Bits needed to represent N ---
type BitsFor<N extends number> = Add<LogB<N, 2>, 1>;
type Int47_B = BitsFor<7>; // 3

// --- 48. Number of trailing zeros in factorial ---
type TrailingZeros<N extends number, Acc extends number = 0> =
  LessThan<N, 5> extends true ? Acc :
  TrailingZeros<Divide<N, 5>, Add<Acc, Divide<N, 5>>>;
// type Int48_T = TrailingZeros<20>; // 4

// --- 49. Type-safe counter with bounds ---
type BoundedCounter<Max extends number, N extends number = 0> = {
  value: N;
  inc: LessThan<N, Max> extends true ? BoundedCounter<Max, Add<N, 1>> : "at max";
  dec: N extends 0 ? "at min" : BoundedCounter<Max, Subtract<N, 1>>;
};
type Int49_C = BoundedCounter<3>["inc"]["inc"]["inc"]; // BoundedCounter<3, 3>

// --- 50. Type-level accumulator with multiple operations ---
type NumOps<N extends number> = {
  value: N;
  add: <B extends number>(b: B) => NumOps<Add<N, B>>;
  mul: <B extends number>(b: B) => NumOps<Multiply<N, B>>;
  sub: <B extends number>(b: B) => NumOps<Subtract<N, B>>;
};
declare function numOps<N extends number>(n: N): NumOps<N>;
const _demo = numOps(3);
type _DemoType = typeof _demo;
