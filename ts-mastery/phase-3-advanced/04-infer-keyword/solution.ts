// ============================================================================
// Solution 3.4 — The `infer` Keyword
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// 1. Infer function return type
// ---------------------------------------------------------------------------

type MyReturnType<T extends (...args: any[]) => any> = T extends (...args: any[]) => infer R ? R : never;

type Test1 = Expect<Equal<MyReturnType<() => string>, string>>;
type Test2 = Expect<Equal<MyReturnType<(x: number) => boolean>, boolean>>;

// ---------------------------------------------------------------------------
// 2. Infer function parameters
// ---------------------------------------------------------------------------

type MyParameters<T extends (...args: any[]) => any> = T extends (...args: infer P) => any ? P : never;

type Test3 = Expect<Equal<MyParameters<(a: string, b: number) => void>, [a: string, b: number]>>;

// ---------------------------------------------------------------------------
// 3. Infer first element of tuple
// ---------------------------------------------------------------------------

type First<T extends any[]> = T extends [infer F, ...any[]] ? F : never;

type Test4 = Expect<Equal<First<[string, number, boolean]>, string>>;
type Test5 = Expect<Equal<First<[42, "hello"]>, 42>>;

// ---------------------------------------------------------------------------
// 4. Infer last element of tuple
// ---------------------------------------------------------------------------

type Last<T extends any[]> = T extends [...any[], infer L] ? L : never;

type Test6 = Expect<Equal<Last<[string, number, boolean]>, boolean>>;
type Test7 = Expect<Equal<Last<[42, "hello"]>, "hello">>;

// ---------------------------------------------------------------------------
// 5. Infer Promise resolved type
// ---------------------------------------------------------------------------

type UnwrapPromise<T> = T extends Promise<infer U> ? UnwrapPromise<U> : T;

type Test8 = Expect<Equal<UnwrapPromise<Promise<string>>, string>>;
type Test9 = Expect<Equal<UnwrapPromise<Promise<Promise<number>>>, number>>;
type Test10 = Expect<Equal<UnwrapPromise<string>, string>>;

// ---------------------------------------------------------------------------
// 6. Infer constructor instance type
// ---------------------------------------------------------------------------

type GetInstanceType<T extends new (...args: any[]) => any> = T extends new (...args: any[]) => infer I ? I : never;

class MyClass { x = 1; }

type Test11 = Expect<Equal<GetInstanceType<typeof MyClass>, MyClass>>;

// ---------------------------------------------------------------------------
// 7. Infer array element type
// ---------------------------------------------------------------------------

type ElementType<T> = T extends (infer U)[] ? U : never;

type Test12 = Expect<Equal<ElementType<string[]>, string>>;
type Test13 = Expect<Equal<ElementType<number[]>, number>>;
type Test14 = Expect<Equal<ElementType<boolean>, never>>;

console.log("Solution 3.4 — All type tests passed (compile-time only)!");

export {};
