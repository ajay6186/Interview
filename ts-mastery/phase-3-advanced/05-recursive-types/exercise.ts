// ============================================================================
// Exercise 3.5 — Recursive Types
// ============================================================================
// Learn to define types that reference themselves for deeply nested structures.
//
// Instructions: Fill in every TODO so the file compiles with no type errors.
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// 1. JSON type
// ---------------------------------------------------------------------------

// TODO: Define a recursive type that represents any valid JSON value
// string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }
type JsonValue = any;

const j1: JsonValue = "hello";
const j2: JsonValue = 42;
const j3: JsonValue = [1, "two", [3, null]];
const j4: JsonValue = { a: { b: { c: [1, 2] } } };

// ---------------------------------------------------------------------------
// 2. Deep Partial
// ---------------------------------------------------------------------------

// TODO: Make all properties optional, recursively
type DeepPartial<T> = any;

type Config = {
  server: {
    host: string;
    port: number;
    ssl: {
      enabled: boolean;
      cert: string;
    };
  };
  debug: boolean;
};

type Test1 = Expect<Equal<
  DeepPartial<Config>,
  {
    server?: {
      host?: string;
      port?: number;
      ssl?: {
        enabled?: boolean;
        cert?: string;
      };
    };
    debug?: boolean;
  }
>>;

// ---------------------------------------------------------------------------
// 3. Flatten nested arrays
// ---------------------------------------------------------------------------

// TODO: Recursively flatten nested array types
// [1, [2, [3]]] → type should be number
type DeepFlatten<T> = any;

type Test2 = Expect<Equal<DeepFlatten<number[][]>, number>>;
type Test3 = Expect<Equal<DeepFlatten<string[][][]>, string>>;
type Test4 = Expect<Equal<DeepFlatten<boolean>, boolean>>;

// ---------------------------------------------------------------------------
// 4. Tuple to union (recursive)
// ---------------------------------------------------------------------------

// TODO: Convert a tuple type to a union of its elements
type TupleToUnion<T extends any[]> = any;

type Test5 = Expect<Equal<TupleToUnion<[string, number, boolean]>, string | number | boolean>>;
type Test6 = Expect<Equal<TupleToUnion<[1, 2, 3]>, 1 | 2 | 3>>;

// ---------------------------------------------------------------------------
// 5. Reverse a tuple type
// ---------------------------------------------------------------------------

// TODO: Reverse a tuple at the type level
type Reverse<T extends any[]> = any;

type Test7 = Expect<Equal<Reverse<[1, 2, 3]>, [3, 2, 1]>>;
type Test8 = Expect<Equal<Reverse<["a", "b"]>, ["b", "a"]>>;
type Test9 = Expect<Equal<Reverse<[]>, []>>;

console.log("Exercise 3.5 — All type tests passed (compile-time only)!");

export {};
