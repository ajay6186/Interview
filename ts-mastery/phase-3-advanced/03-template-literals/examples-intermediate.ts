export {};

// ── Intermediate Template Literal Type Examples ───────────────────────────────

// 1. Key remapping with template literal
type Getters<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] };
type Setters<T> = { [K in keyof T as `set${Capitalize<string & K>}`]: (v: T[K]) => void };
type User = { name: string; age: number; email: string };
type UserGetters = Getters<User>;
// { getName(): string; getAge(): number; getEmail(): string }

// 2. Prefix-filtered key extraction
type ExtractOn<T> = { [K in keyof T as K extends `on${string}` ? K : never]: T[K] };
type Props = { onClick: () => void; onFocus: () => void; label: string; value: string };
type OnProps = ExtractOn<Props>;
// { onClick: () => void; onFocus: () => void }

// 3. Strip prefix from key
type StripOn<T> = { [K in keyof T as K extends `on${infer Rest}` ? Uncapitalize<Rest> : K]: T[K] };
type Stripped = StripOn<{ onClick: () => void; onFocus: () => void; label: string }>;
// { click: () => void; focus: () => void; label: string }

// 4. Template literal union cross-product for styled-components
type ThemeColor = "primary" | "secondary" | "accent";
type Shade = "light" | "base" | "dark";
type ColorToken = `${ThemeColor}-${Shade}`;
// "primary-light" | "primary-base" | ... | "accent-dark"

// 5. Template literal for typed path access
type DotPath<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends object
    ? DotPath<T[K], `${Prefix}${K}.`> | `${Prefix}${K}`
    : `${Prefix}${K}`;
}[keyof T & string];
type Config = { db: { host: string; port: number }; debug: boolean };
type ConfigPath = DotPath<Config>;
// "db" | "db.host" | "db.port" | "debug"

// 6. Typed string interpolation
type Interpolate<S extends string> =
  S extends `${infer Pre}{${string}}${infer Post}` ? Interpolate<`${Pre}${string}${Post}`> : S;
// Not fully solvable at type level, but shows the pattern

// 7. camelCase to kebab-case
type CamelToKebab<S extends string> =
  S extends `${infer H}${infer T}`
    ? H extends Uppercase<H>
      ? `${H extends string ? `-${Lowercase<H>}` : H}${CamelToKebab<T>}`
      : `${H}${CamelToKebab<T>}`
    : S;
type KebabCase = CamelToKebab<"helloWorld">; // "hello-world" (approximation)

// 8. Template literal for strict URL pattern
type Scheme = "http" | "https";
type Domain = string;
type URL2 = `${Scheme}://${Domain}`;
const url: URL2 = "https://example.com";

// 9. Template literal union for form field names
type UserFields = "name" | "email" | "password";
type AddressFields = "street" | "city" | "zip";
type FieldPath = `user.${UserFields}` | `address.${AddressFields}`;
const fp: FieldPath = "user.email";

// 10. Typed event pattern: namespace:action
type Namespace = "auth" | "user" | "order";
type Action = "create" | "update" | "delete" | "read";
type Event2 = `${Namespace}:${Action}`;
// "auth:create" | "auth:update" | ... | "order:delete"

// 11. Template literal for typed translation key
type Lang = "en" | "fr" | "de";
type Section = "nav" | "form" | "error";
type TranslationKey = `${Lang}.${Section}.${string}`;
const tk: TranslationKey = "en.nav.home";

// 12. Template literal for SQL column alias
type Alias<Table extends string, Col extends string> = `${Table}.${Col} AS ${Table}_${Col}`;
type UserAlias = Alias<"user", "id" | "name">;
// "user.id AS user_id" | "user.name AS user_name"

// 13. Extract suffix from template literal
type ExtractSuffix<S extends string, P extends string> =
  S extends `${P}${infer Suffix}` ? Suffix : never;
type Suffix = ExtractSuffix<"onClick" | "onFocus" | "label", "on">;
// "Click" | "Focus"

// 14. Template literal for typed webhook event
type WebhookEvent<Entity extends string, Action extends string> =
  `${Lowercase<Entity>}.${Lowercase<Action>}`;
type UserWebhook = WebhookEvent<"User", "Created" | "Updated" | "Deleted">;
// "user.created" | "user.updated" | "user.deleted"

// 15. Infer from template literal pattern
type ParseRoute<R extends string> =
  R extends `/${infer Resource}/:${infer Param}` ? { resource: Resource; param: Param } :
  R extends `/${infer Resource}` ? { resource: Resource; param: never } :
  never;
type PR1 = ParseRoute<"/users/:id">; // { resource: "users"; param: "id" }
type PR2 = ParseRoute<"/posts">;     // { resource: "posts"; param: never }

// 16. Template literal for typed getter names with type info
type TypedGetter<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: T[K] extends string ? () => string
    : T[K] extends number ? () => number
    : () => T[K];
};

// 17. Template literal for styled component variant
type ButtonVariant = `btn-${"primary" | "secondary" | "ghost"}-${"sm" | "md" | "lg"}`;
const bv: ButtonVariant = "btn-primary-md";

// 18. Template literal for typed environment variable names
function getEnv<K extends string>(key: `VITE_${Uppercase<K>}`): string {
  return process.env[key] ?? "";
}
// getEnv("VITE_API_URL");

// 19. Template literal type guard
function isEventHandler<T extends string>(key: T): key is T & `on${string}` {
  return key.startsWith("on");
}
const onClick = "onClick";
if (isEventHandler(onClick)) {
  const handler: typeof onClick & `on${string}` = onClick;
}

// 20. Multi-segment template literal for REST endpoint
type RestEndpoint =
  `${"GET" | "POST" | "PUT" | "PATCH" | "DELETE"} /${"users" | "posts" | "comments"}` |
  `${"GET" | "PUT" | "PATCH" | "DELETE"} /${"users" | "posts" | "comments"}/:id`;
const ep: RestEndpoint = "GET /users";

// 21. Template literal for CSS custom property
type CSSCustomProp<Name extends string> = `--${Name}`;
type ThemeVar = CSSCustomProp<`${string}-${string}`>;
const tv: ThemeVar = "--primary-color";

// 22. Key filtering via template
type FilterByPattern<T, Pattern extends string> = {
  [K in keyof T as K extends Pattern ? K : never]: T[K];
};
type AppConfig = { VITE_API_URL: string; VITE_PORT: string; NODE_ENV: string };
type ViteVars = FilterByPattern<AppConfig, `VITE_${string}`>;
// { VITE_API_URL: string; VITE_PORT: string }

// 23. Template literal for typed property descriptor
type PropAccess<T, K extends keyof T> = {
  name: K;
  type: T[K] extends string ? "string" : T[K] extends number ? "number" : "other";
  path: `${string & K}`;
};

// 24. Template literal for HTTP response status message
type StatusMsg = `HTTP ${200 | 201 | 400 | 401 | 403 | 404 | 500} ${string}`;
const sm: StatusMsg = "HTTP 200 OK";

// 25. Template literal for CSS transition
type Duration = `${number}ms` | `${number}s`;
type CSSTransition = `${string} ${Duration} ease-in-out`;
const tr: CSSTransition = "transform 300ms ease-in-out";

// 26. Template literal composition with helper type
type Join<Parts extends string[], Sep extends string = "."> =
  Parts extends [infer H extends string] ? H :
  Parts extends [infer H extends string, ...infer T extends string[]] ? `${H}${Sep}${Join<T, Sep>}` :
  never;
type Joined = Join<["a", "b", "c"]>; // "a.b.c"
type DashJoined = Join<["foo", "bar"], "-">; // "foo-bar"

// 27. Template literal for typed log severity
type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";
type LogEntry = `[${LogLevel}] ${string}: ${string}`;
const le: LogEntry = "[INFO] server: started on port 3000";

// 28. Template literal for typed module path
type ModulePath = `./${string}` | `../${string}` | `@/${string}`;
const mp: ModulePath = "./utils/format";

// 29. Template literal for typed query string
type QSEntry = `${string}=${string | number}`;
type QueryString = `?${QSEntry}` | `?${QSEntry}&${QSEntry}`;
const qs: QueryString = "?page=1&limit=20";

// 30. Template literal for typed build target
type Target = `es${2015 | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022}`;
const ts: Target = "es2020";

// 31. Template literal for typed tag names
type HTMLBlock = "div" | "section" | "article" | "aside";
type HTMLInline = "span" | "a" | "strong" | "em";
type AnyHTMLTag = HTMLBlock | HTMLInline;
type TagSelector = `<${AnyHTMLTag}>`;
const ts2: TagSelector = "<div>";

// 32. Template literal infer for query parsing
type ParseQueryParam<S extends string> =
  S extends `${infer Key}=${infer Value}` ? { key: Key; value: Value } : never;
type PQP = ParseQueryParam<"page=1">; // { key: "page"; value: "1" }

// 33. Template literal for typed file path
type FileExt = "ts" | "tsx" | "js" | "jsx" | "json" | "css";
type FilePath = `${string}.${FileExt}`;
const fp2: FilePath = "components/Button.tsx";

// 34. Template literal + mapped type for i18n
type I18nShape<Keys extends string> = Record<Keys, string>;
type I18nGetter<Keys extends string> = {
  [K in Keys as `t_${K}`]: () => string;
};
type NavI18n = I18nGetter<"home" | "about" | "contact">;
// { t_home(): string; t_about(): string; t_contact(): string }

// 35. Template literal for typed signal name (Angular-like)
type Signal<T extends string> = `$${T}Signal`;
type CounterSignal = Signal<"count" | "loading">;
// "$countSignal" | "$loadingSignal"

// 36. Template literal for typed service name
type ServiceName<Entity extends string> = `${Capitalize<Entity>}Service`;
type UserService2 = ServiceName<"user">; // "UserService"

// 37. Template literal for typed identifier
type UUIDLike = `${string}-${string}-${string}-${string}-${string}`;
const uuid: UUIDLike = "550e8400-e29b-41d4-a716-446655440000";

// 38. Template literal for typed header key
type CustomHeader = `x-${Lowercase<string>}`;
const h2: CustomHeader = "x-request-id";

// 39. Template literal for typed event subscription
type Subscription<E extends string> = `${E}:subscribe` | `${E}:unsubscribe`;
type UserSub = Subscription<"userCreated" | "userDeleted">;
// "userCreated:subscribe" | "userCreated:unsubscribe" | ...

// 40. Template literal for typed argument name
type ArgName<T extends string> = `$${Lowercase<T>}`;
type UserArg = ArgName<"User">; // "$user"

// 41. Template literal for typed store key
type StoreKey<NS extends string, Key extends string> = `${NS}/${Key}`;
type UserStore = StoreKey<"user", "profile" | "settings">;
// "user/profile" | "user/settings"

// 42. Template literal for CSS keyframe name
type KeyframeName = `${string}Animation` | `${string}Keyframe`;
const kf: KeyframeName = "fadeInAnimation";

// 43. Template literal for typed metric tag
type MetricTag<Name extends string, Value extends string> = `${Name}="${Value}"`;
type EnvTag = MetricTag<"env", "prod" | "staging">;
// "env=\"prod\"" | "env=\"staging\""

// 44. Template literal for typed graph edge
type Edge<From extends string, To extends string> = `${From} -> ${To}`;
type GraphEdge = Edge<"A" | "B", "C" | "D">;
// "A -> C" | "A -> D" | "B -> C" | "B -> D"

// 45. Template literal for typed command name
type Command<Entity extends string, Op extends string> = `${Lowercase<Op>}${Capitalize<Entity>}`;
type UserCommand = Command<"User", "create" | "update" | "delete">;
// "createUser" | "updateUser" | "deleteUser"

// 46. Template literal infer for path segments
type Segments<S extends string> =
  S extends `${infer H}/${infer T}` ? [H, ...Segments<T>] : [S];
type Segs = Segments<"users/42/posts">; // ["users", "42", "posts"]

// 47. Template literal for typed prop type annotation
type TypeAnnotation<T> =
  T extends string ? "string" :
  T extends number ? "number" :
  T extends boolean ? "boolean" :
  "object";
type AnnotatedProp<K extends string, T> = `${K}: ${TypeAnnotation<T>}`;
type UserIdAnnotation = AnnotatedProp<"id", string>; // "id: string"

// 48. Template literal for typed HTTP Accept header
type MimeType = `${string}/${string}` | "*/*";
type AcceptHeader = `Accept: ${MimeType}`;
const ah: AcceptHeader = "Accept: application/json";

// 49. Template literal for typed gRPC method name
type GRPCMethod<Service extends string, Method extends string> =
  `/${Service}/${Method}`;
type ListUsers = GRPCMethod<"UserService", "ListUsers">; // "/UserService/ListUsers"

// 50. Template literal for complete API definition
type Method2 = "GET" | "POST" | "PUT" | "DELETE";
type Resource2 = "users" | "posts" | "comments";
type StatusCode2 = 200 | 201 | 204 | 400 | 404 | 500;
type ApiEntry = `${Method2} /${Resource2} -> ${StatusCode2}`;
const entry: ApiEntry = "POST /users -> 201";
