export {};

// ── Advanced Enum & Literal Type Examples ────────────────────────────────────

// 1. Enum-to-union type extraction
enum Status { Active = "active", Inactive = "inactive", Pending = "pending" }
type StatusUnion = `${Status}`; // "active" | "inactive" | "pending"
const s: StatusUnion = "active";

// 2. Reverse mapped type from enum
enum Fruit2 { Apple = "apple", Banana = "banana", Cherry = "cherry" }
type FruitByValue = { [V in Fruit2]: Extract<keyof typeof Fruit2, string> };
// Manual version: { apple: "Apple"; banana: "Banana"; cherry: "Cherry" }

// 3. Exhaustiveness checker as type-level function
type Exhaustive<T extends never> = T;
function assertNever(x: never): Exhaustive<never> { throw new Error(`Unhandled: ${x}`); }
enum Shape3 { Circle = "circle", Square = "square", Triangle = "triangle" }
function handleShape(s: Shape3): number {
  switch (s) {
    case Shape3.Circle:   return 1;
    case Shape3.Square:   return 2;
    case Shape3.Triangle: return 3;
    default: return assertNever(s);
  }
}

// 4. Union-to-intersection via enum keys
type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (x: infer I) => void ? I : never;
type EnumValues<E extends Record<string, string>> = E[keyof E];
enum EventKind { Click = "click", Keyup = "keyup" }
type AllEventValues = EnumValues<typeof EventKind>; // "click" | "keyup"

// 5. Template literal type arithmetic (string-based)
type Repeat<S extends string, N extends number, Acc extends string = ""> =
  Acc extends { length: N } ? Acc : Repeat<S, N, `${Acc}${S}`>;
// Note: this is an approximation — true tuple-length recursion shown below
type RepeatStr<T extends string, Count extends number, Acc extends string[] = []> =
  Acc["length"] extends Count ? Acc[number] extends never ? "" : Acc[number] : RepeatStr<T, Count, [...Acc, T]>;

// 6. Branded enum with nominal typing
declare const _enumBrand: unique symbol;
type BrandedEnum<E, Brand extends string> = E & { readonly [_enumBrand]: Brand };
enum RawColor { Red = 0xff0000, Green = 0x00ff00, Blue = 0x0000ff }
type SafeColor = BrandedEnum<RawColor, "SafeColor">;
function toSafeColor(c: RawColor): SafeColor { return c as SafeColor; }

// 7. Const enum erasure and why it matters
const enum PureConst { A = 1, B = 2, C = 3 }
// After compilation, all uses of PureConst.A become literal 1 — no runtime object.
// This means you cannot iterate PureConst values at runtime.
const pureValues = [1, 2, 3] as const; // must list manually

// 8. Type-safe enum flag composer
const enum Perm { None = 0, R = 1, W = 2, X = 4 }
type FlagsOf<E extends number> = E;
function combine<T extends number>(...flags: T[]): number {
  return flags.reduce((acc, f) => acc | f, 0);
}
const adminPerm: number = combine(Perm.R, Perm.W, Perm.X);

// 9. Conditional type distributing over enum union
type CanDelete<P extends string> = P extends "admin" | "owner" ? true : false;
type AdminCanDelete = CanDelete<"admin">; // true
type GuestCanDelete = CanDelete<"guest">; // false

// 10. Template literal types for DSL creation
type SQL<T extends string> = `SELECT ${T} FROM ${string}`;
type SelectAll = SQL<"*">;
const q: SelectAll = "SELECT * FROM users";

type Insert<Table extends string, Cols extends string> = `INSERT INTO ${Table} (${Cols}) VALUES (?)`;
type InsertUser = Insert<"users", "name, email">;

// 11. Mapped type with enum filter
enum Status2 { Active2 = "active", Disabled = "disabled", Pending2 = "pending" }
type ActiveOnly<T extends { status: Status2 }> = T extends { status: Status2.Active2 } ? T : never;
type User5 = { name: string; status: Status2 };
type ActiveUser = ActiveOnly<User5>; // User5 if it can be narrowed — simplified

// 12. Enum value lookup with infer
type EnumValueOf<E, K extends keyof E> = E[K];
type FruitApple = EnumValueOf<typeof Fruit2, "Apple">; // "apple"

// 13. Discriminated union type narrower factory
function makeNarrower<K extends string, V extends string>(
  key: K, value: V
) {
  return <T extends Record<K, V | string>>(obj: T): obj is T & Record<K, V> =>
    obj[key] === value;
}
const isActive = makeNarrower("status", "active");
const item = { status: "active", name: "foo" };
if (isActive(item)) {
  const st: "active" = item.status;
}

// 14. Type-level enum → object inversion
type InvertRecord<T extends Record<string, string>> = {
  [V in T[keyof T]]: { [K in keyof T]: T[K] extends V ? K : never }[keyof T];
};
const colorNames = { red: "RED", green: "GREEN", blue: "BLUE" } as const;
type InvertedColors = InvertRecord<typeof colorNames>; // { RED: "red"; GREEN: "green"; BLUE: "blue" }

// 15. Literal union size counting
type UnionSize<T, Acc extends unknown[] = []> =
  [T] extends [never] ? Acc["length"]
  : T extends any ? UnionSize<Exclude<T, T>, [...Acc, T]>
  : never;
type ShapeCount = UnionSize<"circle" | "square" | "triangle">; // 3

// 16. Enum discriminant narrowing with infer
type ExtractByKind<U, K> = U extends { kind: K } ? U : never;
enum NodeKind2 { Num = "num", Str = "str" }
type ASTNode3 = { kind: NodeKind2.Num; value: number } | { kind: NodeKind2.Str; value: string };
type NumNode = ExtractByKind<ASTNode3, NodeKind2.Num>; // { kind: NodeKind2.Num; value: number }

// 17. Conditional type based on enum value range
type IsError<S extends number> = S extends 400 | 401 | 403 | 404 | 500 ? true : false;
type Is404 = IsError<404>; // true
type Is200 = IsError<200>; // false

// 18. Template literal union to function dispatcher
type Handler3<E extends string> = { [K in E]: () => void };
function createDispatcher<E extends string>(handlers: Handler3<E>) {
  return (event: E): void => handlers[event]();
}
const dispatch = createDispatcher({ click: () => {}, focus: () => {}, blur: () => {} });
dispatch("click");

// 19. Recursive literal type for CSV header
type Join<T extends string[], D extends string, Acc extends string = ""> =
  T extends [infer H extends string, ...infer R extends string[]]
    ? Acc extends ""
      ? Join<R, D, H>
      : Join<R, D, `${Acc}${D}${H}`>
    : Acc;
type Header = Join<["id", "name", "email"], ",">;  // "id,name,email"

// 20. Enum value as index type key
enum StoreKey { Cart = "cart", Wishlist = "wishlist", Recent = "recent" }
type Store2 = { [K in StoreKey]: string[] };
const store3: Store2 = {
  [StoreKey.Cart]:     [],
  [StoreKey.Wishlist]: [],
  [StoreKey.Recent]:   [],
};

// 21. Readonly enum-like object with freeze
function makeEnum<T extends Record<string, string | number>>(obj: T): Readonly<T> {
  return Object.freeze(obj);
}
const Direction3 = makeEnum({ Up: "up", Down: "down", Left: "left", Right: "right" });
type Direction3 = typeof Direction3[keyof typeof Direction3];

// 22. Literal type arithmetic (type-level add via tuple)
type Tuple<N extends number, T extends unknown[] = []> =
  T["length"] extends N ? T : Tuple<N, [...T, unknown]>;
type Add<A extends number, B extends number> = [...Tuple<A>, ...Tuple<B>]["length"];
type Sum = Add<3, 4>; // 7

// 23. Enum-based configuration with type-safe getter
enum ConfigKey { Host = "host", Port = "port", Debug = "debug" }
type ConfigValues = { [ConfigKey.Host]: string; [ConfigKey.Port]: number; [ConfigKey.Debug]: boolean };
class TypedConfigStore {
  private store: ConfigValues = { host: "localhost", port: 3000, debug: false };
  get<K extends ConfigKey>(key: K): ConfigValues[K] { return this.store[key] as ConfigValues[K]; }
  set<K extends ConfigKey>(key: K, value: ConfigValues[K]): void { this.store[key] = value as any; }
}
const cfg2 = new TypedConfigStore();
const host: string = cfg2.get(ConfigKey.Host);

// 24. Multi-step template literal building
type Step1 = "CREATE TABLE";
type Step2<T extends string> = `${Step1} ${T}`;
type Step3<T extends string, C extends string> = `${Step2<T>} (${C})`;
type CreateUsers = Step3<"users", "id INT, name TEXT">;
const ddl: CreateUsers = "CREATE TABLE users (id INT, name TEXT)";

// 25. Phantom literal type for unit safety
declare const _unit: unique symbol;
type Meters = number & { [_unit]: "meters" };
type Seconds = number & { [_unit]: "seconds" };
const toMeters = (n: number): Meters => n as Meters;
const toSeconds = (n: number): Seconds => n as Seconds;
function speed(distance: Meters, time: Seconds): number { return distance / time; }

// 26. Enum-based feature flag system
const enum Feature2 {
  DarkMode       = "dark_mode",
  BetaEditor     = "beta_editor",
  AdvancedSearch = "advanced_search",
}
type FeatureFlagMap = { [F in Feature2]: boolean };
const featureFlags: FeatureFlagMap = {
  [Feature2.DarkMode]:       true,
  [Feature2.BetaEditor]:     false,
  [Feature2.AdvancedSearch]: true,
};
function isEnabled(flag: Feature2): boolean { return featureFlags[flag]; }

// 27. Type-level string parsing
type ParseInt<S extends string> = S extends `${infer N extends number}` ? N : never;
type N42 = ParseInt<"42">; // 42
type N0 = ParseInt<"0">;   // 0

// 28. Enum-driven plugin registry
enum Plugin { Logger = "logger", Auth3 = "auth", Cache3 = "cache" }
type PluginApi = {
  [Plugin.Logger]: { log(msg: string): void };
  [Plugin.Auth3]:  { login(user: string): Promise<void> };
  [Plugin.Cache3]: { get(key: string): unknown; set(key: string, val: unknown): void };
};
type PluginRegistry = { [P in Plugin]?: PluginApi[P] };
const registry: PluginRegistry = {
  [Plugin.Logger]: { log: (msg) => console.log(msg) },
};

// 29. Type-safe event sourcing with enum events
enum UserEvent { Created = "user.created", Updated = "user.updated", Deleted = "user.deleted" }
type EventPayloads2 = {
  [UserEvent.Created]: { id: string; name: string };
  [UserEvent.Updated]: { id: string; changes: Partial<{ name: string; email: string }> };
  [UserEvent.Deleted]: { id: string; reason: string };
};
type TypedEvent<E extends UserEvent> = { type: E; payload: EventPayloads2[E]; timestamp: Date };
function createEvent<E extends UserEvent>(type: E, payload: EventPayloads2[E]): TypedEvent<E> {
  return { type, payload, timestamp: new Date() };
}
const created = createEvent(UserEvent.Created, { id: "u1", name: "Alice" });

// 30. Conditional mapped type based on value type
type OnlyStrings<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K]
};
type User6 = { name: string; age: number; email: string; active: boolean };
type StringFields = OnlyStrings<User6>; // { name: string; email: string }

// 31. Const object as finite state machine config
const FSM = {
  initial: "idle",
  states: {
    idle:    { on: { start: "running" } },
    running: { on: { pause: "paused", stop: "idle" } },
    paused:  { on: { resume: "running", stop: "idle" } },
  },
} as const;
type FSMState = keyof typeof FSM.states;
type FSMEvent3<S extends FSMState> = keyof typeof FSM.states[S]["on"];

// 32. Enum literal type guard + type narrowing chain
enum TokenType { String2 = "string", Number2 = "number", Boolean2 = "boolean", Null = "null" }
type Token =
  | { type: TokenType.String2; value: string }
  | { type: TokenType.Number2; value: number }
  | { type: TokenType.Boolean2; value: boolean }
  | { type: TokenType.Null; value: null };
function coerceToken(t: Token): string | number | boolean | null {
  switch (t.type) {
    case TokenType.String2:  return t.value;
    case TokenType.Number2:  return t.value;
    case TokenType.Boolean2: return t.value;
    case TokenType.Null:     return null;
  }
}

// 33. Infer enum value from template literal
type HttpPrefix = "HTTP_";
type CodeStr = `${HttpPrefix}${number}`;
type ExtractCode<S extends CodeStr> = S extends `${HttpPrefix}${infer N extends number}` ? N : never;
type Code404 = ExtractCode<"HTTP_404">; // 404

// 34. String enum mapped to handler object type
enum Command { Start = "start", Stop = "stop", Restart = "restart" }
type CommandHandlers = { [C in Command]: (args: string[]) => void };
const handlers: CommandHandlers = {
  [Command.Start]:   (args) => console.log("Starting", args),
  [Command.Stop]:    (args) => console.log("Stopping", args),
  [Command.Restart]: (args) => console.log("Restarting", args),
};

// 35. Compile-time enum value set membership
type IsValidStatus<S extends string> = S extends `${Status}` ? true : false;
type ChkActive = IsValidStatus<"active">;   // true
type ChkFoo    = IsValidStatus<"foo">;      // false

// 36. Template literal type for query strings
type QSParam = `${string}=${string}`;
type QueryString = `?${QSParam}` | `?${QSParam}&${QSParam}`;
const qs: QueryString = "?page=1&limit=20";

// 37. Numeric literal type-level min/max
type Min<A extends number, B extends number> = Tuple<A>["length"] extends 0
  ? A
  : Tuple<B>["length"] extends 0
  ? B
  : A;  // simplified
type MinVal = Min<3, 5>; // 3 (ideally)

// 38. Enum-driven API route builder
enum ApiVersion2 { V1 = "v1", V2 = "v2", V3 = "v3" }
enum ApiResource { Users = "users", Posts = "posts", Auth = "auth" }
type ApiEndpoint2 = `/${ApiVersion2}/${ApiResource}` | `/${ApiVersion2}/${ApiResource}/${string}`;
function buildEndpoint(version: ApiVersion2, resource: ApiResource, id?: string): ApiEndpoint2 {
  return id ? `/${version}/${resource}/${id}` : `/${version}/${resource}`;
}
buildEndpoint(ApiVersion2.V2, ApiResource.Users, "42"); // "/v2/users/42"

// 39. Literal mapped type with remapping
type Getters<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] };
type Setters<T> = { [K in keyof T as `set${Capitalize<string & K>}`]: (v: T[K]) => void };
type Accessors2<T> = Getters<T> & Setters<T>;
type PersonAccessors = Accessors2<{ name: string; age: number }>;
// { getName(): string; setName(v: string): void; getAge(): number; setAge(v: number): void }

// 40. Enum-constrained generic function with map
function mapEnum<E extends string, T>(
  enumObj: { [K: string]: E },
  mapper: (value: E) => T
): Record<E, T> {
  const result = {} as Record<E, T>;
  for (const key of Object.keys(enumObj)) {
    const val = enumObj[key] as E;
    result[val] = mapper(val);
  }
  return result;
}
const directionLabels = mapEnum(Direction3, (d) => d.charAt(0).toUpperCase() + d.slice(1));

// 41. Brand + enum for strongly typed IDs
const enum EntityKind { User = "user", Post = "post", Comment = "comment" }
type EntityId<K extends EntityKind> = string & { readonly __kind: K };
type UserId2 = EntityId<EntityKind.User>;
type PostId = EntityId<EntityKind.Post>;
const makeId = <K extends EntityKind>(kind: K, raw: string): EntityId<K> =>
  `${kind}:${raw}` as EntityId<K>;
const userId: UserId2 = makeId(EntityKind.User, "123");

// 42. Literal type sentinel for optional vs undefined
const UNSET = Symbol("UNSET");
type Unset = typeof UNSET;
type Optional<T> = T | Unset;
function isSet<T>(val: Optional<T>): val is T { return val !== UNSET; }
const maybeValue: Optional<string> = "hello";
if (isSet(maybeValue)) {
  const v: string = maybeValue;
}

// 43. Template literal for safe CSS class names
type CSSClassName = `${string}__${string}` | `${string}__${string}--${string}`;
const block: CSSClassName = "card__header";
const modifier: CSSClassName = "card__header--active";

// 44. Enum value iteration via Object.values with type assertion
enum Day { Mon = "mon", Tue = "tue", Wed = "wed", Thu = "thu", Fri = "fri" }
const workdays = Object.values(Day) as Day[];
function isWorkday2(d: string): d is Day { return workdays.includes(d as Day); }

// 45. Type-level string split
type Split<S extends string, D extends string> =
  S extends `${infer Head}${D}${infer Tail}`
    ? [Head, ...Split<Tail, D>]
    : [S];
type Parts = Split<"a,b,c", ",">; // ["a", "b", "c"]

// 46. Enum-indexed state with TypeScript const assertion
const initialState2 = {
  [Status.Active]:   { count: 0 },
  [Status.Inactive]: { count: 0 },
  [Status.Pending]:  { count: 0 },
} as const;
type StateSnapshot = typeof initialState2;
type ActiveCount = StateSnapshot["active"]["count"]; // 0

// 47. Narrowing with overloaded literal types
function parse(value: "true" | "false"): boolean;
function parse(value: `${number}`): number;
function parse(value: string): string | number | boolean {
  if (value === "true") return true;
  if (value === "false") return false;
  const n = Number(value);
  return isNaN(n) ? value : n;
}
const boolResult: boolean = parse("true");
const numResult: number = parse("42");

// 48. Const enum in type position only (ambient)
declare const enum HttpCode { OK = 200, Created = 201 }
// Used only in types — erased at runtime
function isSuccess2(code: number): code is HttpCode.OK { return code === 200; }

// 49. Type-safe enum registry with dependency injection
enum Service2 { Http = "http", Logger2 = "logger", Auth2 = "auth" }
type ServiceMap = {
  [Service2.Http]:    { get(url: string): Promise<string> };
  [Service2.Logger2]: { info(msg: string): void };
  [Service2.Auth2]:   { token(): string };
};
type Container = { [S in Service2]: ServiceMap[S] };
function resolve<S extends Service2>(container: Container, service: S): ServiceMap[S] {
  return container[service];
}

// 50. Recursive template literal type for nested key paths
type NestedKeys<T, Prefix extends string = ""> = {
  [K in keyof T & string]:
    T[K] extends object
      ? NestedKeys<T[K], `${Prefix}${K}.`> | `${Prefix}${K}`
      : `${Prefix}${K}`;
}[keyof T & string];
type AppState = { user: { name: string; role: string }; settings: { theme: string } };
type AppKey = NestedKeys<AppState>;
// "user" | "user.name" | "user.role" | "settings" | "settings.theme"
const key: AppKey = "user.name";
