// ============================================================================
// Solution 6.4 — Variadic Tuple Types
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// 1. Concat tuples
// ---------------------------------------------------------------------------

type Concat<A extends any[], B extends any[]> = [...A, ...B];

type TestConcat = Expect<Equal<Concat<[1, 2], [3, 4]>, [1, 2, 3, 4]>>;

// ---------------------------------------------------------------------------
// 2. Head and Tail
// ---------------------------------------------------------------------------

type Head<T extends any[]> = T extends [infer H, ...any[]] ? H : never;
type Tail<T extends any[]> = T extends [any, ...infer R] ? R : [];

type TestHead = Expect<Equal<Head<[1, 2, 3]>, 1>>;
type TestTail = Expect<Equal<Tail<[1, 2, 3]>, [2, 3]>>;

// ---------------------------------------------------------------------------
// 3. Init and Last
// ---------------------------------------------------------------------------

type Init<T extends any[]> = T extends [...infer I, any] ? I : [];
type Last<T extends any[]> = T extends [...any[], infer L] ? L : never;

type TestInit = Expect<Equal<Init<[1, 2, 3]>, [1, 2]>>;
type TestLast = Expect<Equal<Last<[1, 2, 3]>, 3>>;

// ---------------------------------------------------------------------------
// 4. Zip two tuples
// ---------------------------------------------------------------------------

type Zip<A extends any[], B extends any[]> =
  A extends [infer AH, ...infer AT]
    ? B extends [infer BH, ...infer BT]
      ? [[AH, BH], ...Zip<AT, BT>]
      : []
    : [];

type TestZip = Expect<Equal<
  Zip<[1, 2, 3], ["a", "b", "c"]>,
  [[1, "a"], [2, "b"], [3, "c"]]
>>;

// ---------------------------------------------------------------------------
// 5. Type-safe curry
// ---------------------------------------------------------------------------

type Curry<Args extends any[], Return> =
  Args extends [infer First, ...infer Rest]
    ? Rest extends []
      ? (arg: First) => Return
      : (arg: First) => Curry<Rest, Return>
    : Return;

function curry<Args extends any[], R>(
  fn: (...args: Args) => R
): Curry<Args, R> {
  function curried(this: any, ...args: any[]): any {
    if (args.length >= fn.length) {
      return fn.apply(this, args as any);
    }
    return (...moreArgs: any[]) => curried(...args, ...moreArgs);
  }
  return curried as any;
}

// ---------------------------------------------------------------------------
// 6. Typed zip function
// ---------------------------------------------------------------------------

function zip<A extends any[], B extends any[]>(
  a: [...A],
  b: [...B]
): Zip<A, B> {
  const result: any[] = [];
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    result.push([a[i], b[i]]);
  }
  return result as any;
}

// ---------------------------------------------------------------------------
// Runtime tests
// ---------------------------------------------------------------------------
const zipped = zip([1, 2, 3] as [1, 2, 3], ["a", "b", "c"] as ["a", "b", "c"]);
console.assert(JSON.stringify(zipped) === '[[1,"a"],[2,"b"],[3,"c"]]', "zip");

const add = (a: number, b: number, c: number) => a + b + c;
const curried = curry(add);
console.assert(curried(1)(2)(3) === 6, "curry");

const mul = (a: number, b: number) => a * b;
const curriedMul = curry(mul);
console.assert(curriedMul(3)(4) === 12, "curry mul");

console.log("Solution 6.4 — All assertions passed!");

export {};
