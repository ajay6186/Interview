// ============================================================================
// Exercise 6.4 — Variadic Tuple Types
// ============================================================================
// Master TypeScript's variadic tuple types for advanced tuple manipulation.
//
// Instructions: Fill in every TODO so the file compiles with no type errors.
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// 1. Concat tuples
// ---------------------------------------------------------------------------

// TODO: Concatenate two tuples
type Concat<A extends any[], B extends any[]> = any;

type TestConcat = Expect<Equal<Concat<[1, 2], [3, 4]>, [1, 2, 3, 4]>>;

// ---------------------------------------------------------------------------
// 2. Head and Tail
// ---------------------------------------------------------------------------

// TODO: Extract the first element
type Head<T extends any[]> = any;

// TODO: Extract everything except the first element
type Tail<T extends any[]> = any;

type TestHead = Expect<Equal<Head<[1, 2, 3]>, 1>>;
type TestTail = Expect<Equal<Tail<[1, 2, 3]>, [2, 3]>>;

// ---------------------------------------------------------------------------
// 3. Init and Last
// ---------------------------------------------------------------------------

// TODO: Extract everything except the last element
type Init<T extends any[]> = any;

// TODO: Extract the last element
type Last<T extends any[]> = any;

type TestInit = Expect<Equal<Init<[1, 2, 3]>, [1, 2]>>;
type TestLast = Expect<Equal<Last<[1, 2, 3]>, 3>>;

// ---------------------------------------------------------------------------
// 4. Zip two tuples
// ---------------------------------------------------------------------------

// TODO: Zip two tuples into a tuple of pairs
// Zip<[1, 2, 3], ["a", "b", "c"]> → [[1, "a"], [2, "b"], [3, "c"]]
type Zip<A extends any[], B extends any[]> = any;

type TestZip = Expect<Equal<
  Zip<[1, 2, 3], ["a", "b", "c"]>,
  [[1, "a"], [2, "b"], [3, "c"]]
>>;

// ---------------------------------------------------------------------------
// 5. Type-safe curry function
// ---------------------------------------------------------------------------

// TODO: Implement a type for a curried function
// curry(fn: (a, b, c) => R) should return (a) => (b) => (c) => R
type Curry<Args extends any[], Return> = any;

// TODO: Implement the curry function at runtime
function curry<Args extends any[], R>(
  fn: (...args: Args) => R
): Curry<Args, R> {
  // TODO: implement
  return null as any;
}

// ---------------------------------------------------------------------------
// 6. Typed zip function (runtime)
// ---------------------------------------------------------------------------

// TODO: Implement a typed zip function at runtime
function zip<A extends any[], B extends any[]>(
  a: [...A],
  b: [...B]
): Zip<A, B> {
  // TODO: implement
  return null as any;
}

// ---------------------------------------------------------------------------
// Runtime tests
// ---------------------------------------------------------------------------
const zipped = zip([1, 2, 3] as [1, 2, 3], ["a", "b", "c"] as ["a", "b", "c"]);
console.assert(JSON.stringify(zipped) === '[[1,"a"],[2,"b"],[3,"c"]]', "zip");

// Uncomment after implementing curry:
/*
const add = (a: number, b: number, c: number) => a + b + c;
const curried = curry(add);
console.assert(curried(1)(2)(3) === 6, "curry");
*/

console.log("Exercise 6.4 — All assertions passed!");

export {};
