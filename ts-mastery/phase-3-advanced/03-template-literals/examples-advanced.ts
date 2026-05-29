export {};

// ── Advanced Template Literal Type Examples ───────────────────────────────────

// 1. camelCase to snake_case (recursive)
type CamelToSnake<S extends string> =
  S extends `${infer H}${infer T}`
    ? H extends Uppercase<H>
      ? H extends Lowercase<H>
        ? `${H}${CamelToSnake<T>}`
        : `_${Lowercase<H>}${CamelToSnake<T>}`
      : `${H}${CamelToSnake<T>}`
    : S;
type SnakeCased = CamelToSnake<"helloWorldFoo">; // "hello_world_foo"

// 2. snake_case to camelCase (recursive)
type SnakeToCamel<S extends string> =
  S extends `${infer H}_${infer T}` ? `${H}${Capitalize<SnakeToCamel<T>>}` : S;
type CamelCased = SnakeToCamel<"hello_world_foo">; // "helloWorldFoo"

// 3. Recursive string split to tuple
type Split<S extends string, D extends string> =
  S extends `${infer H}${D}${infer T}` ? [H, ...Split<T, D>] : [S];
type Parts = Split<"a.b.c.d", ".">; // ["a", "b", "c", "d"]

// 4. Recursive join
type Join<T extends string[], Sep extends string = ""> =
  T extends [infer H extends string] ? H :
  T extends [infer H extends string, ...infer R extends string[]]
    ? `${H}${Sep}${Join<R, Sep>}`
    : "";
type Joined = Join<["hello", "world"], " ">; // "hello world"

// 5. String reverse via recursion
type ReverseStr<S extends string, Acc extends string = ""> =
  S extends `${infer H}${infer T}` ? ReverseStr<T, `${H}${Acc}`> : Acc;
type Rev = ReverseStr<"hello">; // "olleh"

// 6. Repeat string N times
type Repeat<S extends string, N extends number, Acc extends string = "", Count extends 0[] = []> =
  Count["length"] extends N ? Acc : Repeat<S, N, `${Acc}${S}`, [...Count, 0]>;
type Rep = Repeat<"ab", 3>; // "ababab"

// 7. Trim template literal
type TrimLeft<S extends string> =
  S extends ` ${infer T}` ? TrimLeft<T> : S;
type TrimRight<S extends string> =
  S extends `${infer T} ` ? TrimRight<T> : S;
type Trim<S extends string> = TrimLeft<TrimRight<S>>;
type Trimmed = Trim<"  hello world  ">; // "hello world"

// 8. Count occurrences of a substring
type CountOccurrences<S extends string, Sub extends string, Acc extends 0[] = []> =
  S extends `${string}${Sub}${infer Rest}`
    ? CountOccurrences<Rest, Sub, [...Acc, 0]>
    : Acc["length"];
type Count = CountOccurrences<"banana", "a">; // 3

// 9. String includes check
type Includes<S extends string, Sub extends string> =
  S extends `${string}${Sub}${string}` ? true : false;
type Inc = Includes<"hello world", "world">; // true

// 10. StartsWith / EndsWith
type StartsWith<S extends string, Prefix extends string> = S extends `${Prefix}${string}` ? true : false;
type EndsWith<S extends string, Suffix extends string>   = S extends `${string}${Suffix}` ? true : false;
type SW = StartsWith<"onClick", "on">; // true
type EW = EndsWith<"Button.tsx", ".tsx">; // true

// 11. Replace first occurrence
type Replace<S extends string, From extends string, To extends string> =
  S extends `${infer Before}${From}${infer After}` ? `${Before}${To}${After}` : S;
type Replaced = Replace<"hello world", "world", "TypeScript">; // "hello TypeScript"

// 12. Replace all occurrences
type ReplaceAll<S extends string, From extends string, To extends string> =
  S extends `${infer Before}${From}${infer After}`
    ? `${Before}${To}${ReplaceAll<After, From, To>}`
    : S;
type ReplacedAll = ReplaceAll<"a.b.c", ".", "/">; // "a/b/c"

// 13. Extract route params as typed object
type ExtractRouteParams<R extends string> =
  R extends `${string}:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof ExtractRouteParams<`/${Rest}`>]: string }
    : R extends `${string}:${infer Param}`
    ? { [K in Param]: string }
    : {};
type UserPostParams = ExtractRouteParams<"/users/:userId/posts/:postId">;
// { userId: string; postId: string }

// 14. Type-level sprintf (count and type placeholders)
type CountPlaceholders<S extends string, Acc extends string[] = []> =
  S extends `${string}%s${infer Rest}` ? CountPlaceholders<Rest, [...Acc, string]> :
  S extends `${string}%d${infer Rest}` ? CountPlaceholders<Rest, [...Acc, number]> :
  Acc;
type Format<S extends string> = (...args: CountPlaceholders<S>) => string;
type Fmt = Format<"Hello %s! You have %d messages.">; // (arg0: string, arg1: number) => string

// 15. Template literal for typed SQL query builder
type SelectFields<T extends string[]> = Join<T, ", ">;
type FromTable<T extends string> = `FROM ${T}`;
type WhereClause<C extends string> = `WHERE ${C}`;
type SQLQuery<Fields extends string[], Table extends string> =
  `SELECT ${SelectFields<Fields>} ${FromTable<Table>}`;
type Q = SQLQuery<["id", "name", "email"], "users">; // "SELECT id, name, email FROM users"

// 16. Template literal for type-safe CSS-in-TS
type CSSValue = string | number;
type CSSProp = "margin" | "padding" | "color" | "background" | "fontSize";
type CSSRule = `${CSSProp}: ${string}`;
const rule: CSSRule = "margin: 16px";

type CSSBlock<Selector extends string> = `${Selector} { ${CSSRule} }`;
const block: CSSBlock<".btn"> = ".btn { color: red }";

// 17. Typed string interpolation with variable tracking
type Interpolated<S extends string, Vars extends Record<string, string>> =
  S extends `${infer Before}{${infer Key}}${infer After}`
    ? Key extends keyof Vars
      ? `${Before}${Vars[Key]}${Interpolated<After, Vars>}`
      : `${Before}{${Key}}${Interpolated<After, Vars>}`
    : S;
type Result = Interpolated<"Hello {name}!", { name: "Alice" }>; // "Hello Alice!"

// 18. Template literal for typed path parsing
type ParsePath<P extends string> =
  P extends `/${infer Segment}/${infer Rest}`
    ? [Segment, ...ParsePath<`/${Rest}`>]
    : P extends `/${infer Segment}`
    ? [Segment]
    : [];
type PP = ParsePath<"/users/42/posts">; // ["users", "42", "posts"]

// 19. Template literal: count string length (limited)
type StrLen<S extends string, Acc extends 0[] = []> =
  S extends `${string}${infer T}`
    ? S extends T ? Acc["length"] : StrLen<T, [...Acc, 0]>
    : Acc["length"];
// Note: TypeScript limits recursion for this — works for short strings

// 20. Template literal for typed decorator factory
type DecoratorTarget<T extends string> = `@${T}`;
type RouterDecorator = DecoratorTarget<"Get" | "Post" | "Put" | "Delete">;
// "@Get" | "@Post" | "@Put" | "@Delete"

// 21. Typed log format string
type LogFields = "timestamp" | "level" | "message" | "trace";
type LogFormat<Fields extends LogFields[]> = Join<Fields, " | ">;
type DefaultLog = LogFormat<["timestamp", "level", "message"]>;
// "timestamp | level | message"

// 22. Template literal for type-safe env config
type EnvVarKey = `${Uppercase<string>}_${Uppercase<string>}`;
function getEnvVar(key: EnvVarKey): string {
  return process.env[key] ?? "";
}
// getEnvVar("API_URL"); // valid
// getEnvVar("apiUrl");  // invalid

// 23. Template literal for type-safe HTML generation
type HTMLTag = "div" | "span" | "p" | "h1" | "h2" | "button" | "input";
type OpenTag<T extends HTMLTag> = `<${T}>`;
type CloseTag<T extends HTMLTag> = `</${T}>`;
type HTMLElement2<T extends HTMLTag> = `${OpenTag<T>}${string}${CloseTag<T>}`;
const el: HTMLElement2<"div"> = "<div>Hello</div>";

// 24. Template literal for typed GraphQL operation
type GQLOp = "query" | "mutation" | "subscription";
type GQLOperationName<Op extends GQLOp, Name extends string> = `${Op} ${Name}`;
type GetUserOp = GQLOperationName<"query", "GetUser">; // "query GetUser"

// 25. Template literal for typed MIME type
type MIMEType =
  | `text/${"html" | "plain" | "css" | "javascript"}`
  | `application/${"json" | "xml" | "pdf" | "octet-stream"}`
  | `image/${"png" | "jpeg" | "gif" | "svg+xml" | "webp"}`;
const mime: MIMEType = "application/json";

// 26. Template literal infer for typed env parsing
type ParseEnvEntry<S extends string> =
  S extends `${infer Key}="${infer Value}"` ? { key: Key; value: Value } :
  S extends `${infer Key}=${infer Value}` ? { key: Key; value: Value } :
  never;
type PEE = ParseEnvEntry<`API_URL="https://api.example.com"`>;
// { key: "API_URL"; value: "https://api.example.com" }

// 27. Template literal for typed markdown heading
type MarkdownHeading<Level extends 1 | 2 | 3 | 4 | 5 | 6, Text extends string> =
  `${"#".repeat(Level & number)} ${Text}`;
// Cannot use repeat at type level — approximation:
type H1 = `# ${string}`;
type H2 = `## ${string}`;

// 28. Typed RegExp pattern string
type RegExpFlag = "g" | "i" | "m" | "s" | "u" | "y";
type RegExpStr = `/${string}/${RegExpFlag | ""}`;
const re: RegExpStr = "/^hello/gi";

// 29. Template literal for typed React prop event handler
type ReactEvent = "onClick" | "onChange" | "onSubmit" | "onFocus" | "onBlur" | "onKeyDown";
type EventPropType<E extends ReactEvent> =
  E extends "onClick" | "onFocus" | "onBlur" ? (e: MouseEvent) => void :
  E extends "onChange" ? (e: Event) => void :
  E extends "onSubmit" ? (e: SubmitEvent) => void :
  (e: KeyboardEvent) => void;

// 30. Template literal for typed JSON pointer (RFC 6901)
type JSONPointer = "" | `/${string}`;
const jp: JSONPointer = "/foo/bar/0";

// 31. Template literal for typed CORS origin
type Protocol = "http" | "https";
type HostPort = `${string}:${number}`;
type CORSOrigin = `${Protocol}://${string}` | "*";
const cors: CORSOrigin = "https://example.com";

// 32. Template literal for typed time format
type Hours = `${0 | 1}${number}` | `2${0 | 1 | 2 | 3}`;
type MinSec = `${0 | 1 | 2 | 3 | 4 | 5}${number}`;
type TimeFormat = `${string}:${string}:${string}`; // simplified
const time: TimeFormat = "14:30:00";

// 33. Template literal for typed cache key
type CacheKey<Entity extends string, Id extends string | number> = `${Entity}:${Id}`;
type UserCacheKey = CacheKey<"user", string>; // "user:${string}"
const ck: UserCacheKey = "user:42";

// 34. Template literal for typed build output path
type BuildEnv = "development" | "production" | "test";
type OutputPath<Env extends BuildEnv, Entry extends string> =
  `dist/${Env}/${Entry}`;
type ProdMain = OutputPath<"production", "main">; // "dist/production/main"

// 35. Template literal for typed webhook signature
type HMAC = `sha${256 | 512}=${string}`;
const sig: HMAC = "sha256=abc123def456";

// 36. Template literal type for typed Docker image tag
type DockerImage<Name extends string, Tag extends string = "latest"> = `${Name}:${Tag}`;
type NginxImage = DockerImage<"nginx", "1.25-alpine">; // "nginx:1.25-alpine"

// 37. Template literal for typed Kubernetes resource
type K8sResource = "pod" | "deployment" | "service" | "configmap" | "secret";
type K8sName<Resource extends K8sResource, Name extends string> = `${Resource}/${Name}`;
type MyPod = K8sName<"pod", "my-app-abc123">; // "pod/my-app-abc123"

// 38. Template literal for TypeScript diagnostics message
type TSError<Code extends number, Msg extends string> = `TS${Code}: ${Msg}`;
type TS2322 = TSError<2322, "Type 'string' is not assignable to type 'number'.">;

// 39. Template literal for typed AWS ARN
type AWSRegion = "us-east-1" | "eu-west-1" | "ap-southeast-1";
type AWSService = "s3" | "lambda" | "dynamodb";
type AWSARN = `arn:aws:${AWSService}:${AWSRegion}:${string}:${string}`;
const arn: AWSARN = "arn:aws:lambda:us-east-1:123456789012:function:my-function";

// 40. Template literal for typed git ref
type GitRef = `refs/${"heads" | "tags" | "remotes"}/${string}`;
const ref: GitRef = "refs/heads/main";

// 41. Typed string pad (left)
type PadLeft<S extends string, N extends number, Char extends string = " ", Acc extends string = S> =
  Acc extends { length: N } ? Acc : PadLeft<S, N, Char, `${Char}${Acc}`>;
// Note: Type-level string length check is approximated here

// 42. Template literal for typed semantic version constraint
type SemVer2 = `${number}.${number}.${number}`;
type VersionConstraint = `${"^" | "~" | ">=" | "<=" | ">" | "<" | "="}${SemVer2}`;
const vc: VersionConstraint = "^1.2.3";

// 43. Template literal for typed JSON schema reference
type JSONSchemaRef = `#/definitions/${string}` | `${string}#/${string}`;
const jsr: JSONSchemaRef = "#/definitions/User";

// 44. Typed GraphQL field path
type GQLPath = string;
type GQLFieldPath<Root extends string, Field extends string> = `${Root}.${Field}`;
type UserFields = GQLFieldPath<"user", "name" | "email" | "age">;
// "user.name" | "user.email" | "user.age"

// 45. Template literal for typed CI/CD pipeline step
type CIStep = `${"build" | "test" | "lint" | "deploy" | "release"}:${string}`;
const step: CIStep = "test:unit";

// 46. Typed permission scope with hierarchical nesting
type AdminScope  = `admin:${string}`;
type UserScope   = `user:${string}`;
type PublicScope = `public:${string}`;
type AnyScope = AdminScope | UserScope | PublicScope;
const scope: AnyScope = "user:profile:read";

// 47. Template literal for typed feature toggle key
type AppEnv = "alpha" | "beta" | "ga";
type Feature = "newDashboard" | "aiSearch" | "darkMode";
type ToggleKey = `${AppEnv}/${Feature}/${boolean}`;
// TypeScript doesn't distribute boolean in template literals like union

// 48. Template literal for typed database constraint name
type TableName = `${Lowercase<string>}s`;
type ConstraintType = "pk" | "fk" | "uq" | "ck" | "idx";
type ConstraintName = `${TableName}_${ConstraintType}_${string}`;
const cn: ConstraintName = "users_pk_id";

// 49. Template literal for typed ANSI escape code
type ANSIColor = "30" | "31" | "32" | "33" | "34" | "35" | "36" | "37";
type ANSICode = `\x1b[${ANSIColor}m${string}\x1b[0m`;
// Cannot use actual escape codes in type literals easily, but shows the pattern

// 50. Full typed URL builder using template literal composition
type URLProtocol = "http" | "https";
type URLHost = string;
type URLPort = `:${number}` | "";
type URLBasePath = `/${string}` | "";
type URLParams = `?${string}` | "";
type URLFragment = `#${string}` | "";
type FullURL = `${URLProtocol}://${URLHost}${URLPort}${URLBasePath}${URLParams}${URLFragment}`;
function buildURL<
  P extends URLProtocol,
  H extends URLHost,
  Path extends `/${string}`
>(protocol: P, host: H, path: Path): `${P}://${H}${Path}` {
  return `${protocol}://${host}${path}`;
}
const url2: `https://${string}/api/users` = buildURL("https", "api.example.com", "/api/users");
