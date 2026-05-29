export {};

// ============================================================
// Phase 6 – Expert: Variadic Tuples — BASIC (1–50)
// ============================================================

// --- 1. Basic variadic tuple spread ---
type Concat<A extends unknown[], B extends unknown[]> = [...A, ...B];
type B1 = Concat<[1, 2], [3, 4]>; // [1, 2, 3, 4]

// --- 2. Prepend element ---
type Prepend<T, Arr extends unknown[]> = [T, ...Arr];
type B2 = Prepend<0, [1, 2, 3]>; // [0, 1, 2, 3]

// --- 3. Append element ---
type Append<Arr extends unknown[], T> = [...Arr, T];
type B3 = Append<[1, 2, 3], 4>; // [1, 2, 3, 4]

// --- 4. Head of a tuple ---
type Head<T extends unknown[]> = T extends [infer H, ...infer _] ? H : never;
type B4 = Head<[1, 2, 3]>; // 1

// --- 5. Tail of a tuple ---
type Tail<T extends unknown[]> = T extends [infer _, ...infer Rest] ? Rest : never;
type B5 = Tail<[1, 2, 3]>; // [2, 3]

// --- 6. Last element ---
type Last<T extends unknown[]> = T extends [...infer _, infer L] ? L : never;
type B6 = Last<[1, 2, 3]>; // 3

// --- 7. Init (all but last) ---
type Init<T extends unknown[]> = T extends [...infer I, infer _] ? I : never;
type B7 = Init<[1, 2, 3]>; // [1, 2]

// --- 8. Tuple length ---
type Length<T extends unknown[]> = T["length"];
type B8 = Length<[1, 2, 3, 4]>; // 4

// --- 9. Reverse a tuple ---
type Reverse<T extends unknown[], Acc extends unknown[] = []> =
  T extends [infer H, ...infer Rest] ? Reverse<Rest, [H, ...Acc]> : Acc;
type B9 = Reverse<[1, 2, 3, 4]>; // [4, 3, 2, 1]

// --- 10. Zip two tuples ---
type Zip<A extends unknown[], B extends unknown[]> =
  A extends [infer HA, ...infer RA] ? B extends [infer HB, ...infer RB]
    ? [[HA, HB], ...Zip<RA, RB>] : [] : [];
type B10 = Zip<[1, 2, 3], ["a", "b", "c"]>; // [[1,"a"],[2,"b"],[3,"c"]]

// --- 11. Unzip (split pairs) ---
type Unzip<T extends [unknown, unknown][]> = {
  first: { [K in keyof T]: T[K][0] };
  second: { [K in keyof T]: T[K][1] };
};
type B11 = Unzip<[[1, "a"], [2, "b"], [3, "c"]]>;

// --- 12. Map a tuple to same type ---
type MapToString<T extends unknown[]> = { [K in keyof T]: string };
type B12 = MapToString<[1, 2, 3]>; // [string, string, string]

// --- 13. Map with specific transform ---
type MapToOptional<T extends unknown[]> = { [K in keyof T]: T[K] | undefined };
type B13 = MapToOptional<[number, string, boolean]>; // [number|undefined, string|undefined, boolean|undefined]

// --- 14. Tuple to union ---
type TupleToUnion<T extends unknown[]> = T[number];
type B14 = TupleToUnion<[1, "a", true]>; // 1 | "a" | true

// --- 15. Tuple includes check ---
type Includes<T extends unknown[], V> =
  T extends [infer H, ...infer Rest]
    ? [H] extends [V] ? [V] extends [H] ? true : Includes<Rest, V> : Includes<Rest, V>
    : false;
type B15_T = Includes<[1, 2, 3], 2>; // true
type B15_F = Includes<[1, 2, 3], 4>; // false

// --- 16. Variadic function type ---
type VariadicFn<Args extends unknown[], Return> = (...args: Args) => Return;
type AddFn = VariadicFn<[number, number], number>;
const B16_add: AddFn = (a, b) => a + b;

// --- 17. Spread parameter tuple ---
function spread<T extends unknown[]>(fn: (...args: T) => void, args: T): void {
  fn(...args);
}
spread(console.log, ["hello", 42]);

// --- 18. Collect tuple parameters ---
function collect<T extends unknown[]>(...args: T): T { return args; }
const B18 = collect(1, "a", true); // [number, string, boolean]
type B18_Type = typeof B18; // [number, string, boolean]

// --- 19. Typed tuple index access ---
type TupleAt<T extends unknown[], I extends number> = T[I];
type B19 = TupleAt<[number, string, boolean], 1>; // string

// --- 20. Flatten one level ---
type Flatten<T extends unknown[][]> = T extends [infer H extends unknown[], ...infer Rest extends unknown[][]]
  ? [...H, ...Flatten<Rest>] : [];
type B20 = Flatten<[[1, 2], [3, 4], [5]]>; // [1, 2, 3, 4, 5]

// --- 21. Repeat type N times ---
type Repeat<T, N extends number, Acc extends T[] = []> =
  Acc["length"] extends N ? Acc : Repeat<T, N, [...Acc, T]>;
type B21 = Repeat<string, 4>; // [string, string, string, string]

// --- 22. Take first N elements ---
type Take<T extends unknown[], N extends number, Acc extends unknown[] = []> =
  Acc["length"] extends N ? Acc :
  T extends [infer H, ...infer Rest] ? Take<Rest, N, [...Acc, H]> : Acc;
type B22 = Take<[1, 2, 3, 4, 5], 3>; // [1, 2, 3]

// --- 23. Drop first N elements ---
type Drop<T extends unknown[], N extends number, Acc extends unknown[] = []> =
  Acc["length"] extends N ? T :
  T extends [infer _, ...infer Rest] ? Drop<Rest, N, [...Acc, unknown]> : [];
type B23 = Drop<[1, 2, 3, 4, 5], 2>; // [3, 4, 5]

// --- 24. Tuple filter by type ---
type Filter<T extends unknown[], U> =
  T extends [infer H, ...infer Rest]
    ? H extends U ? [H, ...Filter<Rest, U>] : Filter<Rest, U>
    : [];
type B24 = Filter<[1, "a", 2, "b", 3], string>; // ["a", "b"]

// --- 25. Tuple partition ---
type Partition<T extends unknown[], U> = [Filter<T, U>, Filter<T, Exclude<T[number], U>>];
type B25 = Partition<[1, "a", 2, "b"], string>; // [["a","b"],[1,2]]

// --- 26. Unique elements ---
type Unique<T extends unknown[], Seen extends unknown[] = []> =
  T extends [infer H, ...infer Rest]
    ? Includes<Seen, H> extends true ? Unique<Rest, Seen> : [H, ...Unique<Rest, [...Seen, H]>]
    : [];
type B26 = Unique<[1, 2, 1, 3, 2, 4]>; // [1, 2, 3, 4]

// --- 27. Count elements ---
type CountElem<T extends unknown[]> = T["length"];
type B27 = CountElem<[1, 2, 3, 4, 5]>; // 5

// --- 28. Tuple slice ---
type Slice<T extends unknown[], Start extends number, End extends number> = Take<Drop<T, Start>, End>;
type B28 = Slice<[1, 2, 3, 4, 5], 1, 3>; // [2, 3, 4] (first 3 from dropped)

// --- 29. Tuple indexOf ---
type IndexOf<T extends unknown[], V, Acc extends unknown[] = []> =
  T extends [infer H, ...infer Rest]
    ? [H] extends [V] ? Acc["length"] : IndexOf<Rest, V, [...Acc, unknown]>
    : -1;
type B29 = IndexOf<["a", "b", "c"], "b">; // 1

// --- 30. Replace element at index ---
type ReplaceAt<T extends unknown[], I extends number, V, Acc extends unknown[] = []> =
  Acc["length"] extends I
    ? [...Acc, V, ...Tail<T>]
    : T extends [infer H, ...infer Rest] ? ReplaceAt<Rest, I, V, [...Acc, H]> : never;
type B30 = ReplaceAt<[1, 2, 3], 1, "X">; // [1, "X", 3]

// --- 31. Remove at index ---
type RemoveAt<T extends unknown[], I extends number, Acc extends unknown[] = []> =
  Acc["length"] extends I
    ? [...Acc, ...Tail<T>]
    : T extends [infer H, ...infer Rest] ? RemoveAt<Rest, I, [...Acc, H]> : never;
type B31 = RemoveAt<[1, 2, 3, 4], 2>; // [1, 2, 4]

// --- 32. Insert at index ---
type InsertAt<T extends unknown[], I extends number, V, Acc extends unknown[] = []> =
  Acc["length"] extends I
    ? [...Acc, V, ...T]
    : T extends [infer H, ...infer Rest] ? InsertAt<Rest, I, V, [...Acc, H]> : never;
type B32 = InsertAt<[1, 2, 4], 2, 3>; // [1, 2, 3, 4]

// --- 33. Rotate left ---
type RotateLeft<T extends unknown[]> = T extends [infer H, ...infer Rest] ? [...Rest, H] : T;
type B33 = RotateLeft<[1, 2, 3, 4]>; // [2, 3, 4, 1]

// --- 34. Rotate right ---
type RotateRight<T extends unknown[]> = T extends [...infer Init, infer L] ? [L, ...Init] : T;
type B34 = RotateRight<[1, 2, 3, 4]>; // [4, 1, 2, 3]

// --- 35. Interleave ---
type Interleave<A extends unknown[], B extends unknown[]> =
  A extends [infer HA, ...infer RA] ? B extends [infer HB, ...infer RB]
    ? [HA, HB, ...Interleave<RA, RB>] : A : B;
type B35 = Interleave<[1, 3, 5], [2, 4, 6]>; // [1, 2, 3, 4, 5, 6]

// --- 36. Chunk into groups ---
type Chunk<T extends unknown[], N extends number, Acc extends unknown[][] = []> =
  T extends [] ? Acc : Chunk<Drop<T, N>, N, [...Acc, Take<T, N>]>;
type B36 = Chunk<[1, 2, 3, 4, 5, 6], 2>; // [[1,2],[3,4],[5,6]]

// --- 37. Tuple of N sequential numbers ---
type SeqNums<N extends number, Acc extends number[] = []> =
  Acc["length"] extends N ? Acc : SeqNums<N, [...Acc, Acc["length"]]>;
type B37 = SeqNums<5>; // [0, 1, 2, 3, 4]

// --- 38. Sum a tuple of numbers ---
type BuildTuple<N extends number, T extends unknown[] = []> =
  T["length"] extends N ? T : BuildTuple<N, [...T, unknown]>;
type Add<A extends number, B extends number> = [...BuildTuple<A>, ...BuildTuple<B>]["length"] & number;
type SumTuple<T extends number[], Acc extends number = 0> =
  T extends [infer H extends number, ...infer Rest extends number[]]
    ? SumTuple<Rest, Add<Acc, H>>
    : Acc;
type B38 = SumTuple<[1, 2, 3, 4, 5]>; // 15

// --- 39. Tuple of function parameters ---
type Params<F extends (...args: unknown[]) => unknown> = F extends (...args: infer P) => unknown ? P : never;
type B39 = Params<(a: number, b: string, c: boolean) => void>; // [number, string, boolean]

// --- 40. Return type of variadic function ---
type RetType<F extends (...args: unknown[]) => unknown> = F extends (...args: unknown[]) => infer R ? R : never;
type B40 = RetType<(a: number) => string>; // string

// --- 41. Awaited tuple types ---
type AwaitedTuple<T extends Promise<unknown>[]> =
  T extends [infer H extends Promise<unknown>, ...infer Rest extends Promise<unknown>[]]
    ? [Awaited<H>, ...AwaitedTuple<Rest>]
    : [];
type B41 = AwaitedTuple<[Promise<string>, Promise<number>]>; // [string, number]

// --- 42. Tuple to object with sequential keys ---
type TupleToObj<T extends unknown[]> = { [K in keyof T as K extends `${number}` ? K : never]: T[K & number] };
type B42 = TupleToObj<[string, number, boolean]>; // {"0":string;"1":number;"2":boolean}

// --- 43. Optional tuple elements ---
type OptionalTail<T extends unknown[]> = T extends [infer H, ...infer Rest]
  ? [H, ...Partial<Rest extends unknown[] ? Rest : never>]
  : T;
type B43 = OptionalTail<[string, number, boolean]>; // [string, number?, boolean?]

// --- 44. Required tuple elements (all required) ---
type AllRequired<T extends unknown[]> = { [K in keyof T]-?: T[K] };
type B44 = AllRequired<[string?, number?, boolean?]>; // [string, number, boolean]

// --- 45. Spread into function ---
declare function apply<T extends unknown[], R>(fn: (...args: T) => R, args: T): R;
const B45 = apply(Math.max, [1, 2, 3]); // number

// --- 46. Typed curry ---
type Curry<F extends (...args: unknown[]) => unknown> =
  Parameters<F> extends [infer A, ...infer Rest]
    ? (a: A) => Rest extends [] ? ReturnType<F> : Curry<(...args: Rest) => ReturnType<F>>
    : ReturnType<F>;
declare function curry<F extends (...args: unknown[]) => unknown>(fn: F): Curry<F>;
declare function addThree(a: number, b: number, c: number): number;
const B46_curried = curry(addThree);
type B46_T = typeof B46_curried; // (a: number) => (b: number) => (c: number) => number

// --- 47. Pipeline (pipe operator) ---
type PipeResult<Fns extends ((...args: unknown[]) => unknown)[]> =
  Fns extends [] ? never :
  Fns extends [infer Last extends (...args: unknown[]) => unknown] ? ReturnType<Last> :
  Fns extends [...infer Rest extends ((...args: unknown[]) => unknown)[], infer Last extends (...args: unknown[]) => unknown]
    ? ReturnType<Last>
    : never;
function pipe<A>(a: A): A;
function pipe<A, B>(a: A, ab: (a: A) => B): B;
function pipe<A, B, C>(a: A, ab: (a: A) => B, bc: (b: B) => C): C;
function pipe(value: unknown, ...fns: Function[]): unknown {
  return fns.reduce((v, f) => f(v), value);
}
const B47 = pipe("hello", s => s.toUpperCase(), s => s + "!"); // "HELLO!"

// --- 48. Tuple spread in class constructor ---
class Point<Coords extends number[]> {
  constructor(public coords: Coords) {}
  get dimensions(): number { return this.coords.length; }
}
const B48_p2d = new Point([1, 2]);
const B48_p3d = new Point([1, 2, 3]);

// --- 49. Overloaded functions via tuple types ---
type Overloads<T extends ((...args: unknown[]) => unknown)[]> = {
  [K in keyof T]: T[K] extends (...args: infer P) => infer R ? (...args: P) => R : never
};

// --- 50. Full variadic composition ---
type Compose<Fns extends ((...args: unknown[]) => unknown)[]> =
  Fns extends [] ? (...args: unknown[]) => unknown :
  Fns extends [infer F extends (...args: unknown[]) => unknown] ? F :
  Fns extends [infer First extends (...args: unknown[]) => unknown, ...infer Rest extends ((...args: unknown[]) => unknown)[]]
    ? (...args: Parameters<First>) => ReturnType<Compose<Rest>>
    : never;
function compose<A, B, C>(bc: (b: B) => C, ab: (a: A) => B): (a: A) => C {
  return a => bc(ab(a));
}
const B50_fn = compose(
  (n: number) => n.toString(),
  (s: string) => s.length
);
const B50_result = B50_fn("hello"); // "5"
