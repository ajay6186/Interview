// ============================================================================
// Exercise 3.3 — Template Literal Types
// ============================================================================
// Learn to manipulate string types at the type level.
//
// Instructions: Fill in every TODO so the file compiles with no type errors.
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// 1. Basic template literal type
// ---------------------------------------------------------------------------

// TODO: Create a type that prepends "get" to a string and capitalizes
// e.g., "name" → "getName"
type Getter<S extends string> = any;

type Test1 = Expect<Equal<Getter<"name">, "getName">>;
type Test2 = Expect<Equal<Getter<"age">, "getAge">>;

// ---------------------------------------------------------------------------
// 2. Event names
// ---------------------------------------------------------------------------

// TODO: Given an entity name, create event name types:
// "User" → "User:created" | "User:updated" | "User:deleted"
type EventName<Entity extends string> = any;

type Test3 = Expect<Equal<EventName<"User">, "User:created" | "User:updated" | "User:deleted">>;
type Test4 = Expect<Equal<EventName<"Post">, "Post:created" | "Post:updated" | "Post:deleted">>;

// ---------------------------------------------------------------------------
// 3. CSS property to camelCase
// ---------------------------------------------------------------------------

// TODO: Convert kebab-case to camelCase
// "background-color" → "backgroundColor"
// "font-size" → "fontSize"
type KebabToCamel<S extends string> = any;

type Test5 = Expect<Equal<KebabToCamel<"background-color">, "backgroundColor">>;
type Test6 = Expect<Equal<KebabToCamel<"font-size">, "fontSize">>;
type Test7 = Expect<Equal<KebabToCamel<"color">, "color">>;

// ---------------------------------------------------------------------------
// 4. Extract route params
// ---------------------------------------------------------------------------

// TODO: Extract parameter names from a route pattern
// "/users/:id/posts/:postId" → "id" | "postId"
type ExtractParams<S extends string> = any;

type Test8 = Expect<Equal<ExtractParams<"/users/:id">, "id">>;
type Test9 = Expect<Equal<ExtractParams<"/users/:id/posts/:postId">, "id" | "postId">>;

// ---------------------------------------------------------------------------
// 5. String manipulation utilities
// ---------------------------------------------------------------------------

// TODO: Remove leading/trailing whitespace from a string type
type TrimLeft<S extends string> = any;
type TrimRight<S extends string> = any;
type Trim<S extends string> = any;

type Test10 = Expect<Equal<Trim<"  hello  ">, "hello">>;
type Test11 = Expect<Equal<TrimLeft<"  hello">, "hello">>;
type Test12 = Expect<Equal<TrimRight<"hello  ">, "hello">>;

console.log("Exercise 3.3 — All type tests passed (compile-time only)!");

export {};
