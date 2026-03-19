// ============================================================================
// Exercise 3.4 — The `infer` Keyword
// ============================================================================
// Learn to extract types from complex structures using `infer`.
//
// Instructions: Fill in every TODO so the file compiles with no type errors.
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// 1. Infer function return type
// ---------------------------------------------------------------------------

// TODO: Extract the return type of a function (re-implement ReturnType)
type MyReturnType<T extends (...args: any[]) => any> = any;

type Test1 = Expect<Equal<MyReturnType<() => string>, string>>;
type Test2 = Expect<Equal<MyReturnType<(x: number) => boolean>, boolean>>;

// ---------------------------------------------------------------------------
// 2. Infer function parameters
// ---------------------------------------------------------------------------

// TODO: Extract parameter types as a tuple (re-implement Parameters)
type MyParameters<T extends (...args: any[]) => any> = any;

type Test3 = Expect<Equal<MyParameters<(a: string, b: number) => void>, [a: string, b: number]>>;

// ---------------------------------------------------------------------------
// 3. Infer first element of tuple
// ---------------------------------------------------------------------------

// TODO: Extract the first element type from a tuple
type First<T extends any[]> = any;

type Test4 = Expect<Equal<First<[string, number, boolean]>, string>>;
type Test5 = Expect<Equal<First<[42, "hello"]>, 42>>;

// ---------------------------------------------------------------------------
// 4. Infer last element of tuple
// ---------------------------------------------------------------------------

// TODO: Extract the last element type from a tuple
type Last<T extends any[]> = any;

type Test6 = Expect<Equal<Last<[string, number, boolean]>, boolean>>;
type Test7 = Expect<Equal<Last<[42, "hello"]>, "hello">>;

// ---------------------------------------------------------------------------
// 5. Infer Promise resolved type
// ---------------------------------------------------------------------------

// TODO: Unwrap a Promise type (possibly nested)
// Promise<string> → string
// Promise<Promise<number>> → number
type UnwrapPromise<T> = any;

type Test8 = Expect<Equal<UnwrapPromise<Promise<string>>, string>>;
type Test9 = Expect<Equal<UnwrapPromise<Promise<Promise<number>>>, number>>;
type Test10 = Expect<Equal<UnwrapPromise<string>, string>>;

// ---------------------------------------------------------------------------
// 6. Infer constructor instance type
// ---------------------------------------------------------------------------

// TODO: Extract the instance type from a constructor function
type GetInstanceType<T extends new (...args: any[]) => any> = any;

class MyClass { x = 1; }

type Test11 = Expect<Equal<GetInstanceType<typeof MyClass>, MyClass>>;

// ---------------------------------------------------------------------------
// 7. Infer array element type
// ---------------------------------------------------------------------------

// TODO: Given T[], infer T. If not an array, return never.
type ElementType<T> = any;

type Test12 = Expect<Equal<ElementType<string[]>, string>>;
type Test13 = Expect<Equal<ElementType<number[]>, number>>;
type Test14 = Expect<Equal<ElementType<boolean>, never>>;

console.log("Exercise 3.4 — All type tests passed (compile-time only)!");

export {};
