// ============================================================================
// Solution 3.1 — Conditional Types
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// 1. Basic conditional type
// ---------------------------------------------------------------------------

type IsString<T> = T extends string ? "string" : "other";

type Test1 = Expect<Equal<IsString<string>, "string">>;
type Test2 = Expect<Equal<IsString<number>, "other">>;
type Test3 = Expect<Equal<IsString<"hello">, "string">>;

// ---------------------------------------------------------------------------
// 2. Nested conditional
// ---------------------------------------------------------------------------

type TypeName<T> = T extends string
  ? "string"
  : T extends number
    ? "number"
    : T extends boolean
      ? "boolean"
      : "unknown";

type Test4 = Expect<Equal<TypeName<string>, "string">>;
type Test5 = Expect<Equal<TypeName<number>, "number">>;
type Test6 = Expect<Equal<TypeName<boolean>, "boolean">>;
type Test7 = Expect<Equal<TypeName<{}>, "unknown">>;

// ---------------------------------------------------------------------------
// 3. Distributive conditional types
// ---------------------------------------------------------------------------

type MyNonNullable<T> = T extends null | undefined ? never : T;

type Test8 = Expect<Equal<MyNonNullable<string | null | undefined>, string>>;
type Test9 = Expect<Equal<MyNonNullable<number | null>, number>>;

// ---------------------------------------------------------------------------
// 4. Conditional type with arrays
// ---------------------------------------------------------------------------

type UnpackArray<T> = T extends (infer U)[] ? U : T;

type Test10 = Expect<Equal<UnpackArray<string[]>, string>>;
type Test11 = Expect<Equal<UnpackArray<number[]>, number>>;
type Test12 = Expect<Equal<UnpackArray<string>, string>>;

// ---------------------------------------------------------------------------
// 5. Conditional type for function detection
// ---------------------------------------------------------------------------

type GetReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type Test13 = Expect<Equal<GetReturnType<() => string>, string>>;
type Test14 = Expect<Equal<GetReturnType<(x: number) => boolean>, boolean>>;
type Test15 = Expect<Equal<GetReturnType<string>, never>>;

// ---------------------------------------------------------------------------
// 6. Flatten union of arrays
// ---------------------------------------------------------------------------

type FlattenUnion<T> = T extends (infer U)[] ? U : T;

type Test16 = Expect<Equal<FlattenUnion<string[] | number[]>, string | number>>;
type Test17 = Expect<Equal<FlattenUnion<boolean[] | string[]>, boolean | string>>;

console.log("Solution 3.1 — All type tests passed (compile-time only)!");

export {};
