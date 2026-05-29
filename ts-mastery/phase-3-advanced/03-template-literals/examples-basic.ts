export {};

// ── Basic Template Literal Type Examples ─────────────────────────────────────

// 1. Simple template literal type
type Greeting = `Hello, ${string}!`;
const g: Greeting = "Hello, Alice!";

// 2. Concatenating two literals
type EventName = `on${"Click" | "Focus" | "Blur"}`;
const ev: EventName = "onClick";

// 3. Capitalize with template literal
type Uppercase2<S extends string> = Uppercase<S>;
type UC = Uppercase2<"hello">; // "HELLO"

// 4. Lowercase with template literal
type LC = Lowercase<"HELLO">; // "hello"

// 5. Capitalize first letter
type Cap = Capitalize<"hello world">; // "Hello world"

// 6. Uncapitalize first letter
type UnCap = Uncapitalize<"Hello">; // "hello"

// 7. Template literal from union — cross product
type Size = "sm" | "md" | "lg";
type Color = "red" | "blue";
type ColorSize = `${Color}-${Size}`;
// "red-sm" | "red-md" | "red-lg" | "blue-sm" | "blue-md" | "blue-lg"

// 8. Template literal for CSS class name
type BEMClass = `${string}__${string}` | `${string}__${string}--${string}`;
const cls: BEMClass = "card__header";
const cls2: BEMClass = "card__header--active";

// 9. Template literal for event handler names
type DOMEventName = "click" | "focus" | "blur" | "keydown";
type HandlerName = `on${Capitalize<DOMEventName>}`;
// "onClick" | "onFocus" | "onBlur" | "onKeydown"

// 10. Template literal for API route
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
type ApiRoute = `${HttpMethod} /api/${string}`;
const route: ApiRoute = "GET /api/users";

// 11. Template literal for CSS property value
type CSSLength = `${number}px` | `${number}em` | `${number}rem` | `${number}%`;
const padding: CSSLength = "16px";

// 12. Template literal for env variable pattern
type EnvVar = `VITE_${Uppercase<string>}`;
const env: EnvVar = "VITE_API_URL";

// 13. Template literal for Redux action type
type ActionType<Domain extends string, Action extends string> = `${Uppercase<Domain>}/${Uppercase<Action>}`;
type UserAction = ActionType<"user", "login">; // "USER/LOGIN"

// 14. Template literal for i18n key
type I18nKey = `${string}.${string}`;
const key: I18nKey = "nav.home";

// 15. Template literal for method key
type MethodKey<Entity extends string> = `find${Capitalize<Entity>}ById`;
type FindUser = MethodKey<"user">; // "findUserById"

// 16. Template literal for observable property name
type ObservableProp<K extends string> = `$${K}`;
const obs: ObservableProp<"count"> = "$count";

// 17. Template literal for CRUD method names
type CRUDMethod<T extends string> = `create${Capitalize<T>}` | `read${Capitalize<T>}` | `update${Capitalize<T>}` | `delete${Capitalize<T>}`;
type UserMethods = CRUDMethod<"user">;
// "createUser" | "readUser" | "updateUser" | "deleteUser"

// 18. Template literal for typed database table name
type TableName = `${Lowercase<string>}_table`;
const tbl: TableName = "users_table";

// 19. Template literal for version string
type SemVer = `${number}.${number}.${number}`;
const ver: SemVer = "1.2.3";

// 20. Template literal for error code
type ErrorCode = `ERR_${Uppercase<string>}_${number}`;
const err: ErrorCode = "ERR_NOT_FOUND_404";

// 21. Template literal for log prefix
type LogPrefix = `[${string}]`;
const prefix2: LogPrefix = "[INFO]";

// 22. Template literal for SQL operation
type SQLOp = `SELECT ${string} FROM ${string}` | `INSERT INTO ${string}` | `DELETE FROM ${string}`;
const q: SQLOp = "SELECT * FROM users";

// 23. Template literal for typed CSS variable
type CSSVar = `--${string}`;
const cssVar: CSSVar = "--primary-color";

// 24. Template literal for typed object key prefix
type PrefixedKey<T extends object, P extends string> = {
  [K in keyof T as `${P}${string & K}`]: T[K];
};
type UserWithPrefix = PrefixedKey<{ id: string; name: string }, "user_">;
// { user_id: string; user_name: string }

// 25. Template literal for named route
type NamedRoute = `/${string}` | `/${string}/${string}`;
const r1: NamedRoute = "/home";
const r2: NamedRoute = "/users/42";

// 26. Template literal for event bus channel
type Channel<Scope extends string, Event extends string> = `${Scope}:${Event}`;
type AuthChannel = Channel<"auth", "login" | "logout">;
// "auth:login" | "auth:logout"

// 27. Template literal for form field name
type FormFieldName<Form extends string, Field extends string> = `${Form}[${Field}]`;
type LoginField = FormFieldName<"login", "username" | "password">;
// "login[username]" | "login[password]"

// 28. Template literal for typed URL parameter
type UrlParam = `:${string}`;
const param: UrlParam = ":id";

// 29. Template literal for CSS media query
type Breakpoint = "sm" | "md" | "lg" | "xl";
type MediaQuery = `@media (min-width: ${string})`;
const mq: MediaQuery = "@media (min-width: 768px)";

// 30. Template literal for typed color token
type ColorToken = `color-${string}-${number}`;
const ct: ColorToken = "color-brand-500";

// 31. Template literal for snake_case key
type SnakeCase<S extends string> =
  S extends `${infer Head}${infer Tail}`
    ? Head extends Uppercase<Head>
      ? `_${Lowercase<Head>}${SnakeCase<Tail>}`
      : `${Head}${SnakeCase<Tail>}`
    : S;
type SC = SnakeCase<"helloWorld">; // "_hello_world" (approximate)

// 32. Template literal for typed namespace key
type NSKey<NS extends string, Key extends string> = `${NS}.${Key}`;
type Config = NSKey<"db", "host" | "port">; // "db.host" | "db.port"

// 33. Template literal for typed HTTP header
type Header = `X-${Capitalize<string>}`;
const h: Header = "X-Auth-Token";

// 34. Template literal for typed mutation name (GraphQL)
type MutationName<Entity extends string> = `${Lowercase<Entity>}${Capitalize<"create" | "update" | "delete">}`;
type UserMutation = MutationName<"User">; // "userCreate" | "userUpdate" | "userDelete"

// 35. Template literal for build artifact path
type ArtifactPath = `dist/${string}.${string}`;
const bundle: ArtifactPath = "dist/main.js";

// 36. Template literal for typed debug tag
type DebugTag<Module extends string> = `[${Module}]`;
const tag: DebugTag<"Auth"> = "[Auth]";

// 37. Template literal for metric name
type MetricName<NS extends string, Op extends string> = `${NS}.${Op}.${string}`;
const metric: MetricName<"http", "request"> = "http.request.latency";

// 38. Template literal for environment-scoped key
type EnvKey<Env extends "dev" | "staging" | "prod", Key extends string> = `${Env}.${Key}`;
type ProdKey = EnvKey<"prod", "apiUrl" | "apiKey">;
// "prod.apiUrl" | "prod.apiKey"

// 39. Template literal for CSS selector
type Selector = `.${string}` | `#${string}` | `${string}:${string}`;
const sel: Selector = ".active";
const id: Selector = "#root";

// 40. Template literal for typed feature flag
type FeatureKey<Group extends string, Flag extends string> = `${Group}/${Flag}`;
type BetaFeature = FeatureKey<"beta", "editor" | "dashboard">;
// "beta/editor" | "beta/dashboard"

// 41. Template literal for form validation key
type ValidationKey<Form extends string, Field extends string, Rule extends string> = `${Form}.${Field}.${Rule}`;
type LoginValidation = ValidationKey<"login", "email", "required" | "format">;
// "login.email.required" | "login.email.format"

// 42. Template literal for typed permission string
type Permission2 = `${string}:${"read" | "write" | "delete" | "admin"}`;
const perm2: Permission2 = "users:read";

// 43. Template literal for API version path
type ApiVersionPath<V extends string, Path extends string> = `/api/${V}${Path}`;
type V2UsersPath = ApiVersionPath<"v2", "/users" | "/users/:id">;
// "/api/v2/users" | "/api/v2/users/:id"

// 44. Template literal for type-safe interpolation
type Interpolate<S extends string, Vars extends string> =
  S extends `${infer Pre}{${infer Var}}${infer Post}`
    ? Var extends Vars
      ? `${Pre}${string}${Interpolate<Post, Vars>}`
      : never
    : S;
type Tpl = Interpolate<"Hello {name}! You have {count} messages.", "name" | "count">;

// 45. Template literal for color scheme token
type Shade = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
type PaletteColor = "slate" | "blue" | "indigo" | "violet";
type ColorScale = `${PaletteColor}-${Shade}`;
const scale: ColorScale = "blue-500";

// 46. Template literal for locale string
type Locale = `${string}-${Uppercase<string>}`;
const locale: Locale = "en-US";

// 47. Template literal for typed query param
type QueryParam<K extends string, V extends string | number> = `${K}=${V}`;
const qp: QueryParam<"page", number> = "page=1";

// 48. Template literal for hook name (React-like)
type HookName = `use${Capitalize<string>}`;
const hook: HookName = "useState";

// 49. Template literal for typed file extension check
type ImageFile = `${string}.${"png" | "jpg" | "jpeg" | "gif" | "webp" | "svg"}`;
const img: ImageFile = "photo.png";

// 50. Template literal for typed event namespace
type NamespacedEvent<NS extends string, Event extends string> = `${NS}.${Event}`;
type DomEvent = NamespacedEvent<"dom", "click" | "focus" | "keydown">;
// "dom.click" | "dom.focus" | "dom.keydown"
