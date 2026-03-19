// ============================================================================
// Solution 6.2 — JSON Parser at the Type Level
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Whitespace = " " | "\n" | "\t" | "\r";

type SkipWhitespace<S extends string> =
  S extends `${Whitespace}${infer Rest}` ? SkipWhitespace<Rest> : S;

type TestSkip = Expect<Equal<SkipWhitespace<"  hello">, "hello">>;

// ---------------------------------------------------------------------------
// Number parsing helper
// ---------------------------------------------------------------------------

type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

type ParseDigits<S extends string, Acc extends string = ""> =
  S extends `${infer D extends Digit}${infer Rest}`
    ? ParseDigits<Rest, `${Acc}${D}`>
    : Acc extends "" ? never : [Acc, S];

type StringToNumber<S extends string> = S extends `${infer N extends number}` ? N : never;

// ---------------------------------------------------------------------------
// 1. Parse string literals
// ---------------------------------------------------------------------------

type ParseStringContent<S extends string, Acc extends string = ""> =
  S extends `"${infer Rest}`
    ? [Acc, Rest]
    : S extends `\\${infer Escaped}${infer Rest}`
      ? ParseStringContent<Rest, `${Acc}${Escaped}`>
      : S extends `${infer Char}${infer Rest}`
        ? ParseStringContent<Rest, `${Acc}${Char}`>
        : never;

type ParseString<S extends string> =
  S extends `"${infer Rest}`
    ? ParseStringContent<Rest>
    : never;

type TestStr = Expect<Equal<ParseString<'"hello" rest'>, ["hello", " rest"]>>;

// ---------------------------------------------------------------------------
// 2. Parse numbers
// ---------------------------------------------------------------------------

type ParseNumber<S extends string> =
  ParseDigits<S> extends [infer Digits extends string, infer Rest extends string]
    ? [StringToNumber<Digits>, Rest]
    : never;

type TestNum = Expect<Equal<ParseNumber<"42 rest">, [42, " rest"]>>;

// ---------------------------------------------------------------------------
// 3. Parse literals
// ---------------------------------------------------------------------------

type ParseLiteral<S extends string> =
  S extends `true${infer Rest}` ? [true, Rest] :
  S extends `false${infer Rest}` ? [false, Rest] :
  S extends `null${infer Rest}` ? [null, Rest] :
  never;

type TestTrue = Expect<Equal<ParseLiteral<"true rest">, [true, " rest"]>>;
type TestFalse = Expect<Equal<ParseLiteral<"false rest">, [false, " rest"]>>;
type TestNull = Expect<Equal<ParseLiteral<"null rest">, [null, " rest"]>>;

// ---------------------------------------------------------------------------
// 4. Parse arrays
// ---------------------------------------------------------------------------

type ParseArrayElements<S extends string, Acc extends any[] = []> =
  SkipWhitespace<S> extends `]${infer Rest}`
    ? [Acc, Rest]
    : ParseValue<SkipWhitespace<S>> extends [infer Val, infer Rest extends string]
      ? SkipWhitespace<Rest> extends `,${infer AfterComma}`
        ? ParseArrayElements<AfterComma, [...Acc, Val]>
        : SkipWhitespace<Rest> extends `]${infer AfterBracket}`
          ? [[...Acc, Val], AfterBracket]
          : never
      : never;

type ParseArray<S extends string> =
  S extends `[${infer Rest}`
    ? ParseArrayElements<Rest>
    : never;

// ---------------------------------------------------------------------------
// 5. Parse objects
// ---------------------------------------------------------------------------

type ParseObjectEntries<S extends string, Acc extends Record<string, any> = {}> =
  SkipWhitespace<S> extends `}${infer Rest}`
    ? [Acc, Rest]
    : ParseString<SkipWhitespace<S>> extends [infer Key extends string, infer AfterKey extends string]
      ? SkipWhitespace<AfterKey> extends `:${infer AfterColon}`
        ? ParseValue<SkipWhitespace<AfterColon>> extends [infer Val, infer AfterVal extends string]
          ? SkipWhitespace<AfterVal> extends `,${infer AfterComma}`
            ? ParseObjectEntries<AfterComma, Acc & { [K in Key]: Val }>
            : SkipWhitespace<AfterVal> extends `}${infer AfterBrace}`
              ? [Acc & { [K in Key]: Val }, AfterBrace]
              : never
          : never
        : never
      : never;

type Prettify<T> = { [K in keyof T]: T[K] } & {};

type ParseObject<S extends string> =
  S extends `{${infer Rest}`
    ? ParseObjectEntries<Rest> extends [infer Obj, infer Remaining]
      ? [Prettify<Obj>, Remaining]
      : never
    : never;

// ---------------------------------------------------------------------------
// Combined parser
// ---------------------------------------------------------------------------

type ParseValue<S extends string> =
  SkipWhitespace<S> extends infer Trimmed extends string
    ? Trimmed extends `"${string}` ? ParseString<Trimmed>
    : Trimmed extends `[${string}` ? ParseArray<Trimmed>
    : Trimmed extends `{${string}` ? ParseObject<Trimmed>
    : Trimmed extends `t${string}` | `f${string}` | `n${string}` ? ParseLiteral<Trimmed>
    : Trimmed extends `${Digit}${string}` ? ParseNumber<Trimmed>
    : never
    : never;

// Top-level parser
type ParseJson<S extends string> = ParseValue<S> extends [infer Val, string] ? Val : never;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

type TestJson1 = Expect<Equal<ParseJson<'"hello"'>, "hello">>;
type TestJson2 = Expect<Equal<ParseJson<"true">, true>>;
type TestJson3 = Expect<Equal<ParseJson<"null">, null>>;
type TestJson4 = Expect<Equal<ParseJson<"42">, 42>>;
type TestJson5 = Expect<Equal<ParseJson<"[1, 2, 3]">, [1, 2, 3]>>;

console.log("Solution 6.2 — All type tests passed (compile-time only)!");

export {};
