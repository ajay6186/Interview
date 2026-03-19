// ============================================================================
// Solution 3.2 — Mapped Types
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

type MyReadonly<T> = { readonly [K in keyof T]: T[K] };

type Test1 = Expect<Equal<MyReadonly<User>, { readonly id: number; readonly name: string; readonly email: string }>>;

// ---------------------------------------------------------------------------
// 2. Re-implement Partial
// ---------------------------------------------------------------------------

type MyPartial<T> = { [K in keyof T]?: T[K] };

type Test2 = Expect<Equal<MyPartial<User>, { id?: number; name?: string; email?: string }>>;

// ---------------------------------------------------------------------------
// 3. Nullable
// ---------------------------------------------------------------------------

type Nullable<T> = { [K in keyof T]: T[K] | null };

type Test3 = Expect<Equal<Nullable<User>, { id: number | null; name: string | null; email: string | null }>>;

// ---------------------------------------------------------------------------
// 4. Getters
// ---------------------------------------------------------------------------

type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type Test4 = Expect<Equal<
  Getters<{ name: string; age: number }>,
  { getName: () => string; getAge: () => number }
>>;

// ---------------------------------------------------------------------------
// 5. Pick by value type
// ---------------------------------------------------------------------------

type PickByType<T, V> = {
  [K in keyof T as T[K] extends V ? K : never]: T[K];
};

type Test5 = Expect<Equal<PickByType<User, string>, { name: string; email: string }>>;
type Test6 = Expect<Equal<PickByType<User, number>, { id: number }>>;

// ---------------------------------------------------------------------------
// 6. Deep Readonly
// ---------------------------------------------------------------------------

type DeepReadonly<T> = T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

type Nested = { a: { b: { c: number } }; d: string };

type Test7 = Expect<Equal<
  DeepReadonly<Nested>,
  { readonly a: { readonly b: { readonly c: number } }; readonly d: string }
>>;

console.log("Solution 3.2 — All type tests passed (compile-time only)!");

export {};
