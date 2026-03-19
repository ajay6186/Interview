// ============================================================================
// Exercise 6.2 — JSON Parser at the Type Level
// ============================================================================
// Parse JSON string literals into TypeScript types at compile time.
// This is one of the most advanced type-level challenges!
//
// Instructions: Fill in every TODO so the file compiles with no type errors.
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Whitespace = " " | "\n" | "\t" | "\r";

// TODO: Skip leading whitespace
type SkipWhitespace<S extends string> = any;

type TestSkip = Expect<Equal<SkipWhitespace<"  hello">, "hello">>;

// ---------------------------------------------------------------------------
// 1. Parse string literals
// ---------------------------------------------------------------------------

// TODO: Parse a JSON string "..." and return [parsed_value, remaining_string]
// ParseString<'"hello" rest'> → ["hello", " rest"]
type ParseString<S extends string> = any;

type TestStr = Expect<Equal<ParseString<'"hello" rest'>, ["hello", " rest"]>>;

// ---------------------------------------------------------------------------
// 2. Parse number literals
// ---------------------------------------------------------------------------

// TODO: Parse a JSON number and return [parsed_number, remaining]
// ParseNumber<'42 rest'> → [42, ' rest']
// Hint: accumulate digit characters, then convert using a lookup
type ParseNumber<S extends string> = any;

// ---------------------------------------------------------------------------
// 3. Parse boolean and null
// ---------------------------------------------------------------------------

// TODO: Parse true, false, null
type ParseLiteral<S extends string> = any;

type TestTrue = Expect<Equal<ParseLiteral<"true rest">, [true, " rest"]>>;
type TestFalse = Expect<Equal<ParseLiteral<"false rest">, [false, " rest"]>>;
type TestNull = Expect<Equal<ParseLiteral<"null rest">, [null, " rest"]>>;

// ---------------------------------------------------------------------------
// 4. Full JSON parser (simplified)
// ---------------------------------------------------------------------------

// TODO: Combine all parsers into a single ParseJson type
// Should handle: strings, numbers, booleans, null, arrays, objects
// This is very challenging — start with primitives only if needed

// type ParseJson<S extends string> = ...

// type TestJson1 = Expect<Equal<ParseJson<'"hello"'>, "hello">>;
// type TestJson2 = Expect<Equal<ParseJson<'true'>, true>>;
// type TestJson3 = Expect<Equal<ParseJson<'null'>, null>>;

console.log("Exercise 6.2 — All type tests passed (compile-time only)!");

export {};
