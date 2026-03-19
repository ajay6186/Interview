// ============================================================================
// Exercise 3.1 — Conditional Types
// ============================================================================
// Learn to write types that branch based on conditions using `extends`.
//
// Instructions: Fill in every TODO so the file compiles with no type errors.
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// 1. Basic conditional type
// ---------------------------------------------------------------------------

// TODO: If T is string, resolve to "string"; otherwise "other"
type IsString<T> = any;

type Test1 = Expect<Equal<IsString<string>, "string">>;
type Test2 = Expect<Equal<IsString<number>, "other">>;
type Test3 = Expect<Equal<IsString<"hello">, "string">>;

// ---------------------------------------------------------------------------
// 2. Nested conditional
// ---------------------------------------------------------------------------

// TODO: Map T to its type name string:
//   string → "string", number → "number", boolean → "boolean", otherwise → "unknown"
type TypeName<T> = any;

type Test4 = Expect<Equal<TypeName<string>, "string">>;
type Test5 = Expect<Equal<TypeName<number>, "number">>;
type Test6 = Expect<Equal<TypeName<boolean>, "boolean">>;
type Test7 = Expect<Equal<TypeName<{}>, "unknown">>;

// ---------------------------------------------------------------------------
// 3. Distributive conditional types
// ---------------------------------------------------------------------------

// TODO: Remove null and undefined from a union (re-implement NonNullable)
type MyNonNullable<T> = any;

type Test8 = Expect<Equal<MyNonNullable<string | null | undefined>, string>>;
type Test9 = Expect<Equal<MyNonNullable<number | null>, number>>;

// ---------------------------------------------------------------------------
// 4. Conditional type with arrays
// ---------------------------------------------------------------------------

// TODO: If T is an array, extract the element type; otherwise return T
type UnpackArray<T> = any;

type Test10 = Expect<Equal<UnpackArray<string[]>, string>>;
type Test11 = Expect<Equal<UnpackArray<number[]>, number>>;
type Test12 = Expect<Equal<UnpackArray<string>, string>>;

// ---------------------------------------------------------------------------
// 5. Conditional type for function detection
// ---------------------------------------------------------------------------

// TODO: If T is a function, return its return type; otherwise return never
type GetReturnType<T> = any;

type Test13 = Expect<Equal<GetReturnType<() => string>, string>>;
type Test14 = Expect<Equal<GetReturnType<(x: number) => boolean>, boolean>>;
type Test15 = Expect<Equal<GetReturnType<string>, never>>;

// ---------------------------------------------------------------------------
// 6. Practical: Flatten union of arrays
// ---------------------------------------------------------------------------

// TODO: Given a union of arrays, extract all element types
// Hint: distributive conditional types distribute over unions
type FlattenUnion<T> = any;

type Test16 = Expect<Equal<FlattenUnion<string[] | number[]>, string | number>>;
type Test17 = Expect<Equal<FlattenUnion<boolean[] | string[]>, boolean | string>>;

console.log("Exercise 3.1 — All type tests passed (compile-time only)!");

export {};
