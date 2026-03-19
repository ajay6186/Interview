// ============================================================================
// Exercise 3.2 — Mapped Types
// ============================================================================
// Learn to transform object types by iterating over their keys.
//
// Instructions: Fill in every TODO so the file compiles with no type errors.
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

interface User {
  id: number;
  name: string;
  email: string;
}

// ---------------------------------------------------------------------------
// 1. Re-implement Readonly
// ---------------------------------------------------------------------------

// TODO: Make all properties readonly
type MyReadonly<T> = any;

type Test1 = Expect<Equal<MyReadonly<User>, { readonly id: number; readonly name: string; readonly email: string }>>;

// ---------------------------------------------------------------------------
// 2. Re-implement Partial
// ---------------------------------------------------------------------------

// TODO: Make all properties optional
type MyPartial<T> = any;

type Test2 = Expect<Equal<MyPartial<User>, { id?: number; name?: string; email?: string }>>;

// ---------------------------------------------------------------------------
// 3. Nullable — make all properties nullable
// ---------------------------------------------------------------------------

// TODO: Map each property T[K] to T[K] | null
type Nullable<T> = any;

type Test3 = Expect<Equal<Nullable<User>, { id: number | null; name: string | null; email: string | null }>>;

// ---------------------------------------------------------------------------
// 4. Getters — create getter methods for each property
// ---------------------------------------------------------------------------

// TODO: Map { name: string } → { getName: () => string }
// Hint: use `as` clause for key remapping: `[K in keyof T as ...]`
type Getters<T> = any;

type Test4 = Expect<Equal<
  Getters<{ name: string; age: number }>,
  { getName: () => string; getAge: () => number }
>>;

// ---------------------------------------------------------------------------
// 5. Pick by value type
// ---------------------------------------------------------------------------

// TODO: Pick only the properties from T whose values extend V
type PickByType<T, V> = any;

type Test5 = Expect<Equal<PickByType<User, string>, { name: string; email: string }>>;
type Test6 = Expect<Equal<PickByType<User, number>, { id: number }>>;

// ---------------------------------------------------------------------------
// 6. Deep Readonly
// ---------------------------------------------------------------------------

// TODO: Make all properties readonly recursively (including nested objects)
type DeepReadonly<T> = any;

type Nested = { a: { b: { c: number } }; d: string };

type Test7 = Expect<Equal<
  DeepReadonly<Nested>,
  { readonly a: { readonly b: { readonly c: number } }; readonly d: string }
>>;

console.log("Exercise 3.2 — All type tests passed (compile-time only)!");

export {};
