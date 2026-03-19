// ============================================================================
// Solution 3.3 — Template Literal Types
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// 1. Basic template literal type
// ---------------------------------------------------------------------------

type Getter<S extends string> = `get${Capitalize<S>}`;

type Test1 = Expect<Equal<Getter<"name">, "getName">>;
type Test2 = Expect<Equal<Getter<"age">, "getAge">>;

// ---------------------------------------------------------------------------
// 2. Event names
// ---------------------------------------------------------------------------

type EventName<Entity extends string> = `${Entity}:${"created" | "updated" | "deleted"}`;

type Test3 = Expect<Equal<EventName<"User">, "User:created" | "User:updated" | "User:deleted">>;
type Test4 = Expect<Equal<EventName<"Post">, "Post:created" | "Post:updated" | "Post:deleted">>;

// ---------------------------------------------------------------------------
// 3. CSS property to camelCase
// ---------------------------------------------------------------------------

type KebabToCamel<S extends string> = S extends `${infer Head}-${infer Tail}`
  ? `${Head}${KebabToCamel<Capitalize<Tail>>}`
  : S;

type Test5 = Expect<Equal<KebabToCamel<"background-color">, "backgroundColor">>;
type Test6 = Expect<Equal<KebabToCamel<"font-size">, "fontSize">>;
type Test7 = Expect<Equal<KebabToCamel<"color">, "color">>;

// ---------------------------------------------------------------------------
// 4. Extract route params
// ---------------------------------------------------------------------------

type ExtractParams<S extends string> =
  S extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractParams<Rest>
    : S extends `${string}:${infer Param}`
      ? Param
      : never;

type Test8 = Expect<Equal<ExtractParams<"/users/:id">, "id">>;
type Test9 = Expect<Equal<ExtractParams<"/users/:id/posts/:postId">, "id" | "postId">>;

// ---------------------------------------------------------------------------
// 5. String manipulation utilities
// ---------------------------------------------------------------------------

type Whitespace = " " | "\t" | "\n";

type TrimLeft<S extends string> = S extends `${Whitespace}${infer Rest}` ? TrimLeft<Rest> : S;
type TrimRight<S extends string> = S extends `${infer Rest}${Whitespace}` ? TrimRight<Rest> : S;
type Trim<S extends string> = TrimLeft<TrimRight<S>>;

type Test10 = Expect<Equal<Trim<"  hello  ">, "hello">>;
type Test11 = Expect<Equal<TrimLeft<"  hello">, "hello">>;
type Test12 = Expect<Equal<TrimRight<"hello  ">, "hello">>;

console.log("Solution 3.3 — All type tests passed (compile-time only)!");

export {};
