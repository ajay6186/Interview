export {};

// ── Advanced Utility Type Examples ───────────────────────────────────────────

// 1. Custom DeepPartial with tuple handling
type DeepPartial<T> =
  T extends (infer U)[] ? DeepPartial<U>[] :
  T extends readonly (infer U)[] ? readonly DeepPartial<U>[] :
  T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } :
  T;

// 2. Recursive Required with array support
type DeepRequired<T> =
  T extends (infer U)[] ? DeepRequired<U>[] :
  T extends object ? { [K in keyof T]-?: DeepRequired<T[K]> } :
  T;

// 3. Recursive Mutable (remove readonly deeply)
type DeepMutable<T> =
  T extends readonly (infer U)[] ? DeepMutable<U>[] :
  T extends object ? { -readonly [K in keyof T]: DeepMutable<T[K]> } :
  T;

// 4. Type-safe deep get with path tuple
type Get<T, K extends readonly PropertyKey[]> =
  K extends [] ? T :
  K extends [infer Head, ...infer Tail extends readonly PropertyKey[]]
    ? Head extends keyof T ? Get<T[Head], Tail> : never
    : never;
type AppState = { user: { profile: { name: string }; settings: { theme: "light" | "dark" } } };
type ThemePath = Get<AppState, ["user", "settings", "theme"]>; // "light" | "dark"

// 5. Type-safe deep set with path
type Set2<T, K extends readonly PropertyKey[], V> =
  K extends [infer Head, ...infer Tail extends readonly PropertyKey[]]
    ? Head extends keyof T
      ? { [P in keyof T]: P extends Head ? Set2<T[P], Tail, V> : T[P] }
      : T
    : V;
type Updated = Set2<AppState, ["user", "settings", "theme"], "dark">;

// 6. OmitNever — clean up mapped types that produce `never`
type OmitNever<T> = { [K in keyof T as T[K] extends never ? never : K]: T[K] };
type WithNevers = { a: string; b: never; c: number; d: never };
type Clean = OmitNever<WithNevers>; // { a: string; c: number }

// 7. Flatten intersection to plain object
type Flatten<T> = T extends object ? { [K in keyof T]: T[K] } : T;
type A = { x: number } & { y: string } & { z: boolean };
type FlatA = Flatten<A>; // { x: number; y: string; z: boolean }

// 8. Distributed conditional over union
type Distribute<T> = T extends any ? { value: T } : never;
type D = Distribute<string | number>; // { value: string } | { value: number }

// 9. UnionToIntersection via conditional types
type UnionToIntersection<U> =
  (U extends any ? (x: U) => void : never) extends (x: infer I) => void ? I : never;
type Intersection = UnionToIntersection<{ a: string } | { b: number }>; // { a: string } & { b: number }

// 10. Last element of union (via UnionToIntersection trick)
type UnionToTuple<U, T extends unknown[] = []> =
  [U] extends [never] ? T :
  UnionToTuple<Exclude<U, LastOfUnion<U>>, [LastOfUnion<U>, ...T]>;
type LastOfUnion<U> =
  UnionToIntersection<U extends any ? () => U : never> extends () => infer L ? L : never;
type Tuple = UnionToTuple<"a" | "b" | "c">; // ["a", "b", "c"] (order may vary)

// 11. Paths utility — all dot-notation paths
type Paths<T, Prefix extends string = ""> = {
  [K in keyof T & string]:
    T[K] extends object
      ? Paths<T[K], `${Prefix}${K}.`> | `${Prefix}${K}`
      : `${Prefix}${K}`;
}[keyof T & string];
type AppPaths = Paths<AppState>;
// "user" | "user.profile" | "user.profile.name" | "user.settings" | "user.settings.theme"
const path: AppPaths = "user.settings.theme";

// 12. ValueAtPath — get type at a dot-notation path
type Split<S extends string, D extends string> =
  S extends `${infer H}${D}${infer T}` ? [H, ...Split<T, D>] : [S];
type ValueAtPath<T, P extends string> = Get<T, Split<P, ".">>;
type Theme2 = ValueAtPath<AppState, "user.settings.theme">; // "light" | "dark"

// 13. PickPath — pick only certain path keys
type PickPaths<T, P extends Paths<T>> = {
  [K in keyof T as `${K & string}` extends P ? K : never]: T[K];
};

// 14. Conditional utility: Optional<T, K>
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type User = { id: string; name: string; email: string };
type UserCreation = Optional<User, "id">; // id is optional

// 15. Conditional utility: RequiredBy<T, K>
type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
type FormUser = Optional<User, "id">;
type SubmittedUser = RequiredBy<FormUser, "name" | "email">;

// 16. Readonly selective — make only K readonly
type ReadonlyKeys<T, K extends keyof T> = Omit<T, K> & Readonly<Pick<T, K>>;
type StableUser = ReadonlyKeys<User, "id">; // id is readonly, others mutable

// 17. PartialExcept<T, K> — everything optional except K
type PartialExcept<T, K extends keyof T> = Required<Pick<T, K>> & Partial<Omit<T, K>>;
type UserUpdate = PartialExcept<User, "id">; // id required, rest optional

// 18. Recursive Exclude from union at all levels
type DeepExclude<T, U> =
  T extends object ? { [K in keyof T]: DeepExclude<T[K], U> } : Exclude<T, U>;
type WithNulls = { name: string | null; nested: { v: number | null } };
type WithoutNull = DeepExclude<WithNulls, null>; // { name: string; nested: { v: number } }

// 19. Conditional required via template literal key check
type KeysWith<T, Suffix extends string> = {
  [K in keyof T as K extends `${string}${Suffix}` ? K : never]: T[K];
};
type EventHandlers = { onClick: () => void; onFocus: () => void; label: string };
type OnKeys = KeysWith<EventHandlers, "">; // all keys — simplified; real: "onClick" | "onFocus"

// 20. NonNullableFields — recursively remove null/undefined
type NonNullableFields<T> = {
  [K in keyof T]: NonNullable<T[K]>;
};
type Raw = { name: string | null; age: number | undefined };
type Clean2 = NonNullableFields<Raw>; // { name: string; age: number }

// 21. Unwrap array utility
type Unwrap<T> = T extends (infer U)[] ? U : T;
type StrArr = Unwrap<string[]>;   // string
type NumItem = Unwrap<number[]>;  // number
type Plain = Unwrap<string>;      // string (not an array)

// 22. ReturnType of method in instance
class ApiClient {
  async getUser(id: string): Promise<{ id: string; name: string }> { return { id, name: "Alice" }; }
  async listPosts(): Promise<Array<{ id: string; title: string }>> { return []; }
}
type GetUserResult = Awaited<ReturnType<ApiClient["getUser"]>>;
type ListPostsItem = Awaited<ReturnType<ApiClient["listPosts"]>>[number];

// 23. Builder type via mapped Partial + chaining
type BuilderMethods<T> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: (val: T[K]) => Builder<T>;
} & { build(): T };
type Builder<T> = BuilderMethods<T>;

// 24. Key remapping with Capitalize
type Getters<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] };
type Setters<T> = { [K in keyof T as `set${Capitalize<string & K>}`]: (v: T[K]) => void };
type Accessors<T> = Getters<T> & Setters<T>;
type UserAccessors = Accessors<User>;
// { getId(): string; getName(): string; getEmail(): string;
//   setId(v: string): void; setName(v: string): void; setEmail(v: string): void }

// 25. Exclusive union via Never injection
type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
type XOR<T, U> = (T & Without<U, T>) | (U & Without<T, U>);
type HasId2 = { id: string };
type HasSlug = { slug: string };
type Identifier = XOR<HasId2, HasSlug>;
const byId: Identifier = { id: "u1" };
const bySlug: Identifier = { slug: "alice" };

// 26. Recursive type brand for ID safety
declare const _b: unique symbol;
type Brand<T, B> = T & { readonly [_b]: B };
type UserId = Brand<string, "UserId">;
type PostId = Brand<string, "PostId">;
const uid: UserId = "u1" as UserId;
const pid: PostId = "p1" as PostId;
// cannot assign uid to pid — different brands

// 27. Schema validator types using utility composition
type Validator<T> = {
  [K in keyof T]: (val: unknown) => val is T[K];
};
type UserValidator = Validator<User>;
const userValidator: UserValidator = {
  id: (v): v is string => typeof v === "string",
  name: (v): v is string => typeof v === "string",
  email: (v): v is string => typeof v === "string" && v.includes("@"),
};

// 28. Infer + ReturnType for typed promise chains
type AsyncChain<T, U> = (input: Awaited<T>) => Promise<U>;
function chain<T, U>(
  first: () => Promise<T>,
  second: AsyncChain<Promise<T>, U>
): () => Promise<U> {
  return async () => second(await first());
}

// 29. Type-level pipeline composition
type Pipe<T extends readonly ((...args: any[]) => any)[]> =
  T extends [infer F extends (...args: any[]) => any]
    ? F
    : T extends [infer F extends (...args: any[]) => any, ...infer Rest extends readonly ((...args: any[]) => any)[]]
    ? (input: Parameters<F>[0]) => ReturnType<Pipe<Rest>>
    : never;

// 30. Conditional type for mapping Result<T, E>
type MapResult<T, E, U> = T extends { ok: true; value: infer V } ? { ok: true; value: U } : T;

// 31. ConstructorParameters + spread for typed factory
class HttpRequest {
  constructor(
    public method: "GET" | "POST",
    public url: string,
    public headers: Record<string, string>
  ) {}
}
type HttpRequestArgs = ConstructorParameters<typeof HttpRequest>;
function makeRequest(...args: HttpRequestArgs): HttpRequest { return new HttpRequest(...args); }

// 32. Conditional extract based on value shape
type HasMethod<T, M extends string> = M extends keyof T ? (T[M] extends Function ? T : never) : never;
class Controller { handle(req: unknown) {} }
class Helper { compute(): number { return 0; } }
type ControllerCheck = HasMethod<Controller, "handle">; // Controller

// 33. Distributive mapped type for union
type MapUnion<T, U> = T extends any ? U & { type: T } : never;
type Events = MapUnion<"click" | "focus", { timestamp: Date }>;
// { type: "click"; timestamp: Date } | { type: "focus"; timestamp: Date }

// 34. Deep freeze type (fully readonly + no mutation)
type Immutable<T> =
  T extends (infer U)[] ? ReadonlyArray<Immutable<U>> :
  T extends object ? { readonly [K in keyof T]: Immutable<T[K]> } :
  T;
const frozenState: Immutable<AppState> = {
  user: { profile: { name: "Alice" }, settings: { theme: "dark" } }
};

// 35. Type assertion helpers with generics
function isType<T>(value: unknown, check: (v: unknown) => v is T): T {
  if (!check(value)) throw new TypeError("Type assertion failed");
  return value;
}
const str = isType("hello", (v): v is string => typeof v === "string");

// 36. Narrowed mapped type — filter by value type
type FilterByValueType<T, V> = {
  [K in keyof T as T[K] extends V ? K : never]: T[K];
};
type DataModel = { id: string; count: number; active: boolean; items: string[]; meta: object };
type OnlyPrimitives = FilterByValueType<DataModel, string | number | boolean>;

// 37. Template literal + utility for event name generation
type EventPrefix = "on" | "after" | "before";
type EventBase = "save" | "delete" | "update";
type EventName = `${EventPrefix}${Capitalize<EventBase>}`;
type EventHandlerMap = Partial<Record<EventName, () => void>>;
const hooks: EventHandlerMap = { onSave: () => console.log("saved") };

// 38. Conditional Awaited unwrapping
type DeepAwaited<T> =
  T extends Promise<infer U> ? DeepAwaited<U> :
  T extends object ? { [K in keyof T]: DeepAwaited<T[K]> } :
  T;
type NestedPromise = { data: Promise<{ user: Promise<string> }> };
type FlatNested = DeepAwaited<NestedPromise>; // { data: { user: string } }

// 39. Record + conditional for typed storage
type StorageSchema = { userId: string; sessionToken: string; lastLogin: Date };
type SerializedStorage = { [K in keyof StorageSchema]: string };
function serialize<K extends keyof StorageSchema>(key: K, val: StorageSchema[K]): string {
  return String(val);
}

// 40. Mapped type with conditional access modifiers
type OptionalIfNullable<T> = {
  [K in keyof T as null extends T[K] ? K : undefined extends T[K] ? K : never]?: NonNullable<T[K]>;
} & {
  [K in keyof T as null extends T[K] ? never : undefined extends T[K] ? never : K]: T[K];
};

// 41. Type-safe clone with exclusion
type CloneWith<T, Extras> = Flatten<T & Extras>;
type BaseEntity = { id: string; createdAt: Date };
type UserWithMeta = CloneWith<User, BaseEntity>;

// 42. Intersection-safe merge (later wins)
type SafeMerge<A, B> = Flatten<Omit<A, keyof B> & B>;
type ConfigA = { timeout: number; retries: number; debug: boolean };
type ConfigB = { timeout: 30; cacheTTL: number };
type FinalConfig = SafeMerge<ConfigA, ConfigB>;

// 43. Type-safe partial update via Proxy
type ProxyUpdate<T> = {
  get<K extends keyof T>(key: K): T[K];
  set<K extends keyof T>(key: K, value: T[K]): void;
  patch(updates: Partial<T>): void;
};

// 44. Nested Required + Readonly for immutable config
type StrictConfig<T> = Readonly<DeepRequired<T>>;
type AppConfig = { db?: { host?: string; port?: number }; app?: { debug?: boolean } };
type StrictAppConfig = StrictConfig<AppConfig>;
// { readonly db: { readonly host: string; readonly port: number }; readonly app: { readonly debug: boolean } }

// 45. Conditional type distribution guard
type IsUnion<T> = [T] extends [UnionToIntersection<T>] ? false : true;
type CheckUnion1 = IsUnion<string | number>; // true
type CheckUnion2 = IsUnion<string>;          // false

// 46. Utility for mapped function overloads
type Overloads<T extends (...args: any[]) => any> = T extends {
  (...args: infer A1): infer R1;
  (...args: infer A2): infer R2;
} ? [A1, R1] | [A2, R2] : never;

// 47. PickOptional / PickRequired utilities
type PickOptional<T> = {
  [K in keyof T as {} extends Pick<T, K> ? K : never]?: T[K];
};
type PickRequired2<T> = {
  [K in keyof T as {} extends Pick<T, K> ? never : K]: T[K];
};
type Form = { name: string; email?: string; age?: number };
type RequiredForm = PickRequired2<Form>; // { name: string }
type OptionalForm = PickOptional<Form>;   // { email?: string; age?: number }

// 48. Function composition type
type Compose<Fns extends readonly ((...args: any[]) => any)[]> =
  Fns extends readonly [...infer Init extends ((...args: any[]) => any)[], infer Last extends (...args: any[]) => any]
    ? (...args: Parameters<Last>) => ReturnType<Compose<Init>>
    : Fns extends readonly [infer Single extends (...args: any[]) => any]
    ? Single
    : never;

// 49. Typed Event Bus with utility types
type EventMap2 = Record<string, unknown>;
type Listener<Payload> = (payload: Payload) => void;
type ListenerMap<Events extends EventMap2> = {
  [K in keyof Events]?: Listener<Events[K]>[];
};
class TypedBus<Events extends EventMap2> {
  private listeners: ListenerMap<Events> = {};
  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
    (this.listeners[event] ??= []).push(listener);
  }
  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    this.listeners[event]?.forEach(l => l(payload));
  }
}
type AppEvents = { login: { userId: string }; logout: {} };
const bus = new TypedBus<AppEvents>();
bus.on("login", ({ userId }) => console.log(userId));
bus.emit("login", { userId: "u1" });

// 50. Complete utility composition: TypedForm<T>
type TypedForm<T> = {
  values: Partial<T>;
  errors: Partial<Record<keyof T, string[]>>;
  touched: Partial<Record<keyof T, boolean>>;
  isDirty: boolean;
  isValid: boolean;
  submit: () => void | Promise<void>;
  reset: () => void;
  setField: <K extends keyof T>(key: K, val: T[K]) => void;
  setError: <K extends keyof T>(key: K, errors: string[]) => void;
};
declare function createForm<T extends object>(initial: T): TypedForm<T>;
const loginForm = createForm({ username: "", password: "" });
loginForm.setField("username", "alice");
loginForm.setError("password", ["Too short"]);
