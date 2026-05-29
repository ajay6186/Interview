export {};

// ── Nested Template Literal Type Examples ────────────────────────────────────

// 1. Multi-level template literal composition
type NS = "user" | "order" | "product";
type Verb = "created" | "updated" | "deleted";
type Priority2 = "high" | "low";
type Event2 = `${NS}.${Verb}.${Priority2}`;
// "user.created.high" | "user.created.low" | ... | "product.deleted.low"

// 2. Nested key path from template literal
type DotPath<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends object
    ? DotPath<T[K], `${Prefix}${K}.`> | `${Prefix}${K}`
    : `${Prefix}${K}`;
}[keyof T & string];
type AppState = {
  user: { profile: { name: string }; settings: { theme: string } };
  cart: { items: string[]; total: number };
};
type AppPath = DotPath<AppState>;
// "user" | "user.profile" | "user.profile.name" | "user.settings" | ...

// 3. Infer nested route params
type ExtractParams<R extends string> =
  R extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractParams<`/${Rest}`>
    : R extends `${string}:${infer Param}`
    ? Param
    : never;
type Params = ExtractParams<"/users/:userId/posts/:postId">;
// "userId" | "postId"

// 4. Typed path param object
type RouteParams<R extends string> = {
  [K in ExtractParams<R>]: string;
};
type UserPostParams = RouteParams<"/users/:userId/posts/:postId">;
// { userId: string; postId: string }

// 5. Deep template literal key for nested locale
type Lang = "en" | "fr" | "de";
type Section = "nav" | "form" | "error";
type Fields<S extends Section> =
  S extends "nav" ? "home" | "about" | "contact" :
  S extends "form" ? "submit" | "cancel" | "reset" :
  S extends "error" ? "notFound" | "serverError" : never;
type LocaleKey = `${Lang}.${Section}.${string}`;
const lk: LocaleKey = "en.nav.home";

// 6. Nested template literal type for API endpoint
type ApiVersion = "v1" | "v2" | "v3";
type Resource = "users" | "posts" | "comments";
type SubResource = "likes" | "replies" | "attachments";
type ApiEndpoint =
  | `/${ApiVersion}/${Resource}`
  | `/${ApiVersion}/${Resource}/:id`
  | `/${ApiVersion}/${Resource}/:id/${SubResource}`;
const ep: ApiEndpoint = "/v2/users/:id/likes";

// 7. Nested mapped type with template literal remapping
type DeepGetters<T> = {
  [K in keyof T & string as `get${Capitalize<K>}`]:
    T[K] extends object
      ? DeepGetters<T[K]>
      : () => T[K];
};

// 8. Template literal for multi-level CSS BEM naming
type Block = "card" | "button" | "input";
type Element = "header" | "body" | "footer" | "label" | "icon";
type Modifier = "active" | "disabled" | "focused" | "large" | "small";
type BEMClass =
  | `${Block}`
  | `${Block}__${Element}`
  | `${Block}__${Element}--${Modifier}`
  | `${Block}--${Modifier}`;
const bem: BEMClass = "card__header--active";

// 9. Nested template literal for typed Redux action
type Domain2 = "user" | "cart" | "settings";
type UserAction = "login" | "logout" | "updateProfile";
type CartAction = "addItem" | "removeItem" | "clear";
type SettingsAction = "setTheme" | "setLanguage";
type ActionType =
  | `${Uppercase<Domain2>}/${Uppercase<UserAction>}`
  | `${Uppercase<Domain2>}/${Uppercase<CartAction>}`
  | `${Uppercase<Domain2>}/${Uppercase<SettingsAction>}`;
// Simplified since all actions apply to all domains here; real usage would be conditional

// 10. Nested parse: extract key + value from config line
type ParseLine<S extends string> =
  S extends `${infer Key}=${infer Value}` ? { key: Key; value: Value } :
  S extends `${infer Key}: ${infer Value}` ? { key: Key; value: Value } :
  never;
type PL1 = ParseLine<"host=localhost">;  // { key: "host"; value: "localhost" }
type PL2 = ParseLine<"port: 3000">;     // { key: "port"; value: "3000" }

// 11. Template literal for typed SQL WHERE clause
type SQLWhere<T extends string, Op extends "=" | "!=" | ">" | "<" | "LIKE"> =
  `WHERE ${T} ${Op} ?`;
type UserWhere = SQLWhere<"name" | "email", "=" | "LIKE">;
// "WHERE name = ?" | "WHERE name LIKE ?" | "WHERE email = ?" | ...

// 12. Multi-hop infer for nested template
type InferHops<S extends string> =
  S extends `${infer A}.${infer B}.${infer C}` ? [A, B, C] :
  S extends `${infer A}.${infer B}` ? [A, B] :
  [S];
type H1 = InferHops<"a.b.c">; // ["a", "b", "c"]
type H2 = InferHops<"a.b">;   // ["a", "b"]
type H3 = InferHops<"a">;     // ["a"]

// 13. Template literal for typed permission matrix
type PermAction = "create" | "read" | "update" | "delete";
type PermScope = "own" | "any";
type Permission3 = `${string}:${PermAction}:${PermScope}`;
const p: Permission3 = "post:read:any";

// 14. Nested template literal mapping to event emitter API
type EmitterAPI<Events extends Record<string, any[]>> = {
  [K in keyof Events & string as `on${Capitalize<K>}`]: (handler: (...args: Events[K]) => void) => () => void;
} & {
  [K in keyof Events & string as `emit${Capitalize<K>}`]: (...args: Events[K]) => void;
};
type AppEvents2 = {
  login: [userId: string; timestamp: Date];
  logout: [];
  error: [err: Error];
};
type AppEmitter = EmitterAPI<AppEvents2>;
// { onLogin: ...; emitLogin: ...; onLogout: ...; emitLogout: ...; onError: ...; emitError: ... }

// 15. Nested template literal for typed CI/CD stage names
type Pipeline = "build" | "test" | "deploy";
type Stage = "start" | "end" | "fail";
type Environment = "dev" | "staging" | "prod";
type CIEvent = `${Pipeline}:${Stage}:${Environment}`;
const ci: CIEvent = "deploy:start:prod";

// 16. Multi-level template literal type for module system
type ModuleType = "component" | "service" | "util" | "hook";
type Framework = "react" | "vue" | "angular" | "svelte";
type ModuleDeclaration = `${Framework}/${ModuleType}/${string}`;
const md: ModuleDeclaration = "react/component/Button";

// 17. Nested template literal for typed RPC method
type RPCMethod<Service extends string, Method extends string, Version extends string = "1.0"> =
  `rpc://${Service}/${Method}?version=${Version}`;
type GetUser = RPCMethod<"UserService", "GetUser">; // "rpc://UserService/GetUser?version=1.0"

// 18. Template literal infer for URL parts
type ParseURL<U extends string> =
  U extends `${infer Scheme}://${infer Host}/${infer Path}`
    ? { scheme: Scheme; host: Host; path: Path }
    : U extends `${infer Scheme}://${infer Host}`
    ? { scheme: Scheme; host: Host; path: "" }
    : never;
type PU1 = ParseURL<"https://api.example.com/users">; // { scheme: "https"; host: "api.example.com"; path: "users" }

// 19. Multi-segment join with type-level recursion
type Join<T extends string[], Sep extends string = "."> =
  T extends [infer H extends string] ? H :
  T extends [infer H extends string, ...infer R extends string[]] ? `${H}${Sep}${Join<R, Sep>}` :
  "";
type Joined = Join<["users", "profile", "name"]>;        // "users.profile.name"
type SlashJoined = Join<["api", "v2", "users"], "/">;    // "api/v2/users"

// 20. Typed namespace event bus with nested namespaces
type NestedBus<T extends Record<string, Record<string, any[]>>> = {
  [NS in keyof T & string]: {
    [Ev in keyof T[NS] & string as `on${Capitalize<Ev>}`]: (handler: (...args: T[NS][Ev]) => void) => void;
  } & {
    [Ev in keyof T[NS] & string as `emit${Capitalize<Ev>}`]: (...args: T[NS][Ev]) => void;
  };
};

// 21. Template literal for CSS custom property reference
type CSSVarRef<Name extends string> = `var(--${Name})`;
type ThemeRef = CSSVarRef<`${string}-${string}`>;
const ref: ThemeRef = "var(--primary-color)";

// 22. Nested template literal for typed migration name
type MigrationName<Version extends number, Name extends string> =
  `${Version}_${Name extends string ? Lowercase<Name> : never}`;
type M = MigrationName<20240101, "AddUsersTable">; // "20240101_adduseerstable" (simplified)

// 23. Multi-level template literal for API typings
type HttpMethod2 = "GET" | "POST" | "PUT" | "DELETE";
type AuthLevel = "public" | "authenticated" | "admin";
type ResponseFormat = "json" | "xml" | "csv";
type EndpointSpec =
  `[${AuthLevel}] ${HttpMethod2} /${string} -> ${ResponseFormat}`;
const es: EndpointSpec = "[authenticated] GET /users -> json";

// 24. Nested template literal for graph node naming
type NodeRole = "input" | "hidden" | "output";
type LayerNum = number;
type NodeName = `${NodeRole}_${string}`;
const nn: NodeName = "hidden_42";

// 25. Template literal type for typed telemetry
type MetricUnit = "ms" | "bytes" | "count" | "percent";
type MetricPath<Category extends string, Name extends string> = `${Category}.${Name}`;
type MetricDef<C extends string, N extends string, U extends MetricUnit> =
  `${MetricPath<C, N>}#${U}`;
type LatencyMetric = MetricDef<"http", "latency", "ms">; // "http.latency#ms"

// 26. Multi-hop key extraction
type Split<S extends string, D extends string> =
  S extends `${infer H}${D}${infer T}` ? [H, ...Split<T, D>] : [S];
type SegList = Split<"a.b.c.d", ".">; // ["a", "b", "c", "d"]

// 27. Typed state machine event label
type StateName = "idle" | "loading" | "success" | "failure";
type TransitionLabel<From extends StateName, To extends StateName> = `${From} -> ${To}`;
type Transitions =
  | TransitionLabel<"idle", "loading">
  | TransitionLabel<"loading", "success">
  | TransitionLabel<"loading", "failure">
  | TransitionLabel<"success" | "failure", "idle">;
const t1: Transitions = "idle -> loading";

// 28. Multi-level namespace merge via template
type Merge2<NS1 extends string, NS2 extends string, Keys extends string> =
  `${NS1}/${NS2}/${Keys}`;
type APIKeys = Merge2<"api", "v1", "users" | "posts">;
// "api/v1/users" | "api/v1/posts"

// 29. Template literal for typed feature flag hierarchy
type Env2 = "dev" | "prod";
type Category = "beta" | "stable";
type Feature = "darkMode" | "newEditor" | "aiSearch";
type FlagKey = `${Env2}/${Category}/${Feature}`;
const fk: FlagKey = "prod/stable/darkMode";

// 30. Nested template literal for typed log format
type LogCategory = "http" | "db" | "auth" | "cache";
type LogSeverity = "DEBUG" | "INFO" | "WARN" | "ERROR";
type LogLine = `${LogSeverity} [${LogCategory}] ${string}`;
const ll: LogLine = "INFO [http] GET /users 200 12ms";

// 31. Template literal infer: extract component name from file path
type ExtractComponent<Path extends string> =
  Path extends `${string}/${infer Name}.tsx` ? Name :
  Path extends `${string}/${infer Name}.ts` ? Name :
  Path extends `${infer Name}.tsx` ? Name :
  never;
type CompName = ExtractComponent<"components/Button.tsx">; // "Button"

// 32. Typed API route handler map
type RouteHandler<Path extends string> = {
  path: Path;
  params: RouteParams<Path>;
  handler: (params: RouteParams<Path>) => unknown;
};
type UserRouteHandler = RouteHandler<"/users/:id">; // { path; params: { id: string }; handler }

// 33. Template literal for typed build task
type BuildTarget = "dev" | "prod" | "test";
type BuildStep = "compile" | "bundle" | "optimize" | "test";
type BuildTask = `${BuildTarget}:${BuildStep}`;
// "dev:compile" | "dev:bundle" | ... | "test:test"

// 34. Template literal for typed webhook payload field
type WebhookPayload<T extends string> = `${T}${"_at" | "_by" | "_reason" | "_id"}`;
type UserPayloadField = WebhookPayload<"created" | "updated">;
// "created_at" | "created_by" | ... | "updated_id"

// 35. Multi-level infer for typed middleware
type MiddlewareName<Layer extends string, Func extends string> =
  `middleware.${Layer}.${Func}`;
type AuthMW = MiddlewareName<"auth", "validate" | "refresh">;
// "middleware.auth.validate" | "middleware.auth.refresh"

// 36. Nested template literal for typed CSS grid area
type GridArea<Row extends string, Col extends string> = `${Row} / ${Col}`;
type Area = GridArea<"header" | "sidebar", "main" | "footer">;
// "header / main" | "header / footer" | "sidebar / main" | "sidebar / footer"

// 37. Template literal for typed OpenAPI operation ID
type HTTPVerb = "get" | "post" | "put" | "patch" | "delete";
type ResourceName = "User" | "Post" | "Comment";
type OperationId = `${HTTPVerb}${ResourceName}${"" | "By" | "List"}`;
const op: OperationId = "getUser";

// 38. Deep template literal for state machine key
type SMKey<Machine extends string, State extends string, Action extends string> =
  `${Machine}/${State}/${Action}`;
type LoaderKey = SMKey<"loader", "idle" | "loading", "start" | "stop">;
// "loader/idle/start" | "loader/idle/stop" | "loader/loading/start" | "loader/loading/stop"

// 39. Template literal for typed CSS animation
type AnimationName = `${string}Fade${"In" | "Out"}` | `${string}Slide${"Up" | "Down" | "Left" | "Right"}`;
const anim: AnimationName = "buttonFadeIn";

// 40. Typed channel message
type ChannelMsg<Ch extends string, Type extends string, Payload extends string> =
  `[${Ch}:${Type}] ${Payload}`;
const msg: ChannelMsg<"auth", "login", "userId=u1"> = "[auth:login] userId=u1";

// 41. Template literal for typed decorator namespace
type DecoratorName<Lib extends string, Name extends string> = `@${Lib}/${Name}`;
type MyDec = DecoratorName<"mylib", "Injectable" | "Component">;
// "@mylib/Injectable" | "@mylib/Component"

// 42. Template literal for typed build artifact
type ArtifactType = "chunk" | "entry" | "asset";
type BuildArtifact = `dist/${ArtifactType}/${string}.${string}`;
const ba: BuildArtifact = "dist/chunk/vendor.js";

// 43. Nested template literal for typed graph path
type GraphPath<Nodes extends string> =
  Nodes extends `${infer A} -> ${infer B} -> ${infer C}` ? [A, B, C] :
  Nodes extends `${infer A} -> ${infer B}` ? [A, B] :
  never;
type GP = GraphPath<"A -> B -> C">; // ["A", "B", "C"]

// 44. Multi-scope template literal for typed IAM policy
type IAMAction = "read" | "write" | "delete" | "list";
type IAMResource = "s3" | "ec2" | "rds";
type IAMPolicy = `${IAMResource}:${IAMAction}:${string}`;
const iam: IAMPolicy = "s3:read:my-bucket";

// 45. Template literal for typed plugin declaration
type PluginType = "transform" | "loader" | "resolver" | "optimizer";
type PluginName<T extends PluginType, Name extends string> = `${T}-${Name}`;
type TransformPlugin = PluginName<"transform", "babel" | "typescript" | "css">;
// "transform-babel" | "transform-typescript" | "transform-css"

// 46. Nested template literal for health check endpoint
type ServiceName2 = "api" | "db" | "cache" | "queue";
type HealthCheckPath = `/health/${ServiceName2}` | `/health/${ServiceName2}/detailed`;
const hc: HealthCheckPath = "/health/db";

// 47. Template literal for typed test case name
type TestSuite = "unit" | "integration" | "e2e";
type TestName<Suite extends TestSuite, Feature extends string, Case extends string> =
  `[${Suite}] ${Feature}: ${Case}`;
type UserTest = TestName<"unit", "UserService", "should create user" | "should validate email">;

// 48. Template literal for typed JWT claim key
type JWTClaim = `${"sub" | "iss" | "aud" | "exp" | "iat"}` | `custom_${string}`;
const claim: JWTClaim = "custom_userId";

// 49. Nested template literal for typed analytics event
type EventCategory = "engagement" | "conversion" | "technical";
type EventAction = "click" | "view" | "submit" | "error";
type AnalyticsEvent = `${EventCategory}/${EventAction}/${string}`;
const ae: AnalyticsEvent = "engagement/click/button_signup";

// 50. Full nested API type with template literal composition
type Method3 = "GET" | "POST" | "PUT" | "DELETE";
type BaseURL2 = "https://api.example.com";
type APIVersion2 = "v1" | "v2";
type APIPath = `${Resource}` | `${Resource}/${string}`;
type FullAPIURL = `${BaseURL2}/${APIVersion2}/${APIPath}`;
type EndpointDef<M extends Method3, U extends string> = {
  method: M;
  url: U;
  headers: Record<string, string>;
};
type GetUsers = EndpointDef<"GET", `${BaseURL2}/${APIVersion2}/users`>;
const getUsers: GetUsers = {
  method: "GET",
  url: "https://api.example.com/v1/users",
  headers: { Authorization: "Bearer token" },
};

type Resource = "users" | "posts" | "comments";
