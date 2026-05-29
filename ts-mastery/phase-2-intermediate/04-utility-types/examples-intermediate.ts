export {};

// ── Intermediate Utility Type Examples ──────────────────────────────────────

// 1. Deep Partial (recursive)
type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;
type Config = { db: { host: string; port: number }; app: { debug: boolean; port: number } };
type DeepPartialConfig = DeepPartial<Config>;
const patch: DeepPartialConfig = { db: { host: "localhost" } };

// 2. Deep Readonly (recursive)
type DeepReadonly<T> = T extends (infer U)[]
  ? ReadonlyArray<DeepReadonly<U>>
  : T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;
type FrozenConfig = DeepReadonly<Config>;

// 3. Deep Required (recursive)
type DeepRequired<T> = T extends object
  ? { [K in keyof T]-?: DeepRequired<T[K]> }
  : T;
type FullConfig = DeepRequired<Config>;
const full: FullConfig = { db: { host: "localhost", port: 5432 }, app: { debug: false, port: 3000 } };

// 4. Mutable<T> — remove readonly from all properties
type Mutable<T> = { -readonly [K in keyof T]: T[K] };
type User = Readonly<{ id: string; name: string; email: string }>;
type MutableUser = Mutable<User>;
const mu: MutableUser = { id: "1", name: "Alice", email: "a@a.com" };
mu.name = "Bob"; // OK

// 5. PickByValue — pick keys whose value matches a type
type PickByValue<T, V> = {
  [K in keyof T as T[K] extends V ? K : never]: T[K];
};
type Profile = { name: string; age: number; active: boolean; email: string };
type StringFields = PickByValue<Profile, string>; // { name: string; email: string }
const sf: StringFields = { name: "Alice", email: "a@a.com" };

// 6. OmitByValue — omit keys whose value matches a type
type OmitByValue<T, V> = {
  [K in keyof T as T[K] extends V ? never : K]: T[K];
};
type NonStringFields = OmitByValue<Profile, string>; // { age: number; active: boolean }

// 7. Nullable<T> — add null to all properties
type Nullable<T> = { [K in keyof T]: T[K] | null };
type NullableUser = Nullable<{ name: string; age: number }>;
const nu: NullableUser = { name: null, age: null };

// 8. Flatten<T> — merge intersection type
type Flatten<T> = { [K in keyof T]: T[K] };
type A = { x: number } & { y: number };
type FlatA = Flatten<A>; // { x: number; y: number }

// 9. Awaited chain with utility
async function fetchUser(id: string): Promise<{ id: string; name: string }> {
  return { id, name: "Alice" };
}
type FetchedUser = Awaited<ReturnType<typeof fetchUser>>;
type FetchedId = FetchedUser["id"]; // string

// 10. Parameters of overloaded function
function parse(val: string): number;
function parse(val: number): string;
function parse(val: any): any { return typeof val === "string" ? +val : String(val); }
// Parameters picks the LAST overload signature
type ParseParams = Parameters<typeof parse>; // [number]

// 11. ReturnType chaining
const getConfig = () => ({ env: "prod", port: 3000 } as const);
type GetConfigReturn = ReturnType<typeof getConfig>;
type PortType = GetConfigReturn["port"]; // 3000

// 12. Merge two types utility (Pick conflicts resolved)
type Merge<T, U> = Omit<T, keyof U> & U;
type Base = { id: number; name: string; role: string };
type Override = { role: "admin" | "user" };
type Merged = Merge<Base, Override>; // { id: number; name: string; role: "admin" | "user" }

// 13. NonNullable with conditional
type StrictPick<T, K extends keyof T> = {
  [P in K]-?: NonNullable<T[P]>;
};
type Post = { title?: string | null; body?: string | null; id: string };
type StrictPostTitle = StrictPick<Post, "title">; // { title: string }

// 14. Partial + Record combination
type FormErrors<T> = Partial<Record<keyof T, string>>;
type LoginForm = { username: string; password: string };
const errors: FormErrors<LoginForm> = { password: "Too short" };

// 15. Readonly deep for nested arrays
type ReadonlyMatrix = DeepReadonly<number[][]>;
const matrix: ReadonlyMatrix = [[1, 2], [3, 4]];
// matrix[0][0] = 99; // Error

// 16. Utility: required keys of T
type RequiredKeys<T> = { [K in keyof T]-?: {} extends Pick<T, K> ? never : K }[keyof T];
type User2 = { id: string; name?: string; email?: string };
type UserRequiredKeys = RequiredKeys<User2>; // "id"

// 17. Optional keys extraction
type OptionalKeys<T> = { [K in keyof T]-?: {} extends Pick<T, K> ? K : never }[keyof T];
type UserOptionalKeys = OptionalKeys<User2>; // "name" | "email"

// 18. Utility: function properties of T
type FunctionProperties<T> = {
  [K in keyof T as T[K] extends Function ? K : never]: T[K];
};
class MyClass {
  name = "foo";
  greet() { return "hi"; }
  run() {}
}
type FnProps = FunctionProperties<MyClass>; // { greet(): string; run(): void }

// 19. Utility: non-function properties of T
type NonFunctionProperties<T> = {
  [K in keyof T as T[K] extends Function ? never : K]: T[K];
};
type DataProps = NonFunctionProperties<MyClass>; // { name: string }

// 20. Exclusive union (XOR) utility
type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
type XOR<T, U> = (T & Without<U, T>) | (U & Without<T, U>);
type HasName = { name: string };
type HasEmail = { email: string };
type NameOrEmail = XOR<HasName, HasEmail>;
const n: NameOrEmail = { name: "Alice" }; // only name
const e: NameOrEmail = { email: "a@a.com" }; // only email

// 21. Partial<T> applied only to nested key
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type Product = { id: string; name: string; price: number; description: string };
type CreateProductDto = PartialBy<Product, "description">;
const dto: CreateProductDto = { id: "p1", name: "Widget", price: 9.99 }; // description optional

// 22. RequiredBy — make specific keys required
type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
type FullPost = RequiredBy<{ title?: string; body?: string; id: string }, "title" | "body">;
const fp: FullPost = { id: "1", title: "T", body: "B" };

// 23. Invert Record utility
type InvertRecord<T extends Record<string, string>> = {
  [V in T[keyof T]]: { [K in keyof T]: T[K] extends V ? K : never }[keyof T];
};
const colorMap = { red: "RED", green: "GREEN", blue: "BLUE" } as const;
type InvertedColors = InvertRecord<typeof colorMap>; // { RED: "red"; GREEN: "green"; BLUE: "blue" }

// 24. Awaited in typed fetch wrapper
async function typedFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  return res.json() as Promise<T>;
}
type FetchResult<T> = Awaited<ReturnType<typeof typedFetch<T>>>;

// 25. Exclude used in union filtering
type AnyPrimitive = string | number | boolean | null | undefined;
type TruthyPrimitive = Exclude<AnyPrimitive, null | undefined | false | 0 | "">;

// 26. Extract + Record for event handler map
type DOMEvents = "click" | "focus" | "blur" | "keydown" | "keyup" | "change";
type MouseDOMEvents = Extract<DOMEvents, "click" | "mouseenter" | "mouseleave">;
type MouseHandlers = Partial<Record<MouseDOMEvents, (e: Event) => void>>;

// 27. Utility: ReadonlyRecord
type ReadonlyRecord<K extends string, V> = Readonly<Record<K, V>>;
const config3: ReadonlyRecord<"host" | "port", string> = { host: "localhost", port: "3000" };

// 28. ReturnType in higher-order function typing
function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    if (!cache.has(key)) cache.set(key, fn(...args));
    return cache.get(key)!;
  }) as T;
}
const memoFib = memoize((n: number): number => n <= 1 ? n : memoFib(n - 1) + memoFib(n - 2));

// 29. Parameters + ReturnType for typed middleware
type Fn3<Params extends any[], Return> = (...args: Params) => Return;
type Middleware<T extends (...args: any[]) => any> = (
  fn: T
) => (...args: Parameters<T>) => ReturnType<T>;
const withLogging: Middleware<(n: number) => string> = (fn) => (...args) => {
  console.log("calling with", args);
  return fn(...args);
};

// 30. Utility: Overwrite<T, U> (alias for Merge)
type Overwrite<T, U extends Partial<Record<keyof T, unknown>>> = Omit<T, keyof U> & U;
type Vehicle = { speed: number; fuel: "gas" | "electric"; seats: number };
type ElectricVehicle = Overwrite<Vehicle, { fuel: "electric" }>;

// 31. ConstructorParameters with abstract class
abstract class Shape4 {
  constructor(public color: string) {}
  abstract area(): number;
}
type ShapeCtorParams = ConstructorParameters<typeof Shape4>; // [string]

// 32. InstanceType in factory pattern
type InstanceTypeOf<T extends abstract new (...args: any[]) => any> = InstanceType<T>;
function instantiate<T extends new (...args: any[]) => any>(ctor: T, ...args: ConstructorParameters<T>): InstanceTypeOf<T> {
  return new ctor(...args);
}

// 33. Partial<T> for patch API
class Store<T> {
  private state: T;
  constructor(initial: T) { this.state = initial; }
  patch(updates: Partial<T>): void { this.state = { ...this.state, ...updates }; }
  get(): T { return this.state; }
}

// 34. Readonly<T> with type narrowing
function freeze<T>(obj: T): Readonly<T> { return Object.freeze(obj) as Readonly<T>; }
const frozen = freeze({ x: 1, y: 2 });
// frozen.x = 10; // Error

// 35. Pick for projection function
function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return keys.reduce((acc, k) => ({ ...acc, [k]: obj[k] }), {} as Pick<T, K>);
}
const user = { id: "1", name: "Alice", email: "a@a.com", age: 30 };
const userPreview = pick(user, ["id", "name"]); // { id: string; name: string }

// 36. Omit for exclusion function
function omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const copy = { ...obj };
  keys.forEach(k => delete copy[k]);
  return copy as Omit<T, K>;
}
const noEmail = omit(user, ["email"]); // { id; name; age }

// 37. Record for translation map
type Lang = "en" | "fr" | "de";
type Translations = Record<Lang, Record<string, string>>;
const translations: Translations = {
  en: { hello: "Hello", bye: "Goodbye" },
  fr: { hello: "Bonjour", bye: "Au revoir" },
  de: { hello: "Hallo", bye: "Auf Wiedersehen" },
};

// 38. NonNullable + keyof for safe key access
type SafeKeys<T> = {
  [K in keyof T]: NonNullable<T[K]> extends never ? never : K;
}[keyof T];

// 39. Extract<T, U> for tagged union filtering
type Result2<T> = { ok: true; value: T } | { ok: false; error: string };
type Success<T> = Extract<Result2<T>, { ok: true }>; // { ok: true; value: T }
type Failure<T> = Extract<Result2<T>, { ok: false }>; // { ok: false; error: string }

// 40. Awaited for retry wrapper
async function withRetry<T>(fn: () => Promise<T>, retries: number): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try { return await fn(); } catch {}
  }
  throw new Error("Max retries exceeded");
}
type RetryResult<T> = Awaited<ReturnType<typeof withRetry<T>>>;

// 41. Utility: ValueOf<T>
type ValueOf<T> = T[keyof T];
type UserValue = ValueOf<{ id: string; name: string; age: number }>; // string | number

// 42. Utility: Paths<T> (shallow)
type Paths<T> = keyof T & string;
type UserPaths = Paths<{ id: string; name: string; email: string }>; // "id" | "name" | "email"

// 43. Optional<T, K> — make K optional
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type CreateUser = Optional<{ id: string; name: string; email: string }, "id">;

// 44. DeepPartial applied to API response shape
type ApiResponse<T> = { data: T; meta: { total: number; page: number } };
type PatchableResponse<T> = DeepPartial<ApiResponse<T>>;

// 45. Record with union values
type Permission = "read" | "write" | "delete";
type ResourcePermissions = Record<string, Permission[]>;
const perms: ResourcePermissions = { users: ["read", "write"], posts: ["read"] };

// 46. Readonly + Partial combination
type Options<T> = Readonly<Partial<T>>;
type SearchOptions = Options<{ query: string; limit: number; offset: number }>;
const opts: SearchOptions = { query: "TypeScript" };

// 47. PickByValue with function filter
type Methods<T> = PickByValue<T, Function>;
class API {
  baseUrl = "/api";
  get(path: string) { return fetch(this.baseUrl + path); }
  post(path: string, body: unknown) { return fetch(this.baseUrl + path, { method: "POST", body: JSON.stringify(body) }); }
}
type APIMethods = Methods<API>; // { get: ...; post: ... }

// 48. Intersection + utility for mixin types
type WithId = { id: string };
type WithTimestamps = { createdAt: Date; updatedAt: Date };
type Entity2<T> = T & WithId & WithTimestamps;
type UserEntity = Entity2<{ name: string; email: string }>;

// 49. Conditional Readonly: ReadonlyIf
type ReadonlyIf<T, Condition extends boolean> = Condition extends true ? Readonly<T> : T;
type Obj = { x: number; y: number };
type FrozenObj = ReadonlyIf<Obj, true>;   // Readonly<Obj>
type MutableObj = ReadonlyIf<Obj, false>; // Obj

// 50. Composing utilities: UpdatePayload
type UpdatePayload<T extends { id: string }> = Required<Pick<T, "id">> & Partial<Omit<T, "id">>;
type UpdateUserPayload = UpdatePayload<{ id: string; name: string; email: string; age: number }>;
const up: UpdateUserPayload = { id: "u1", name: "Bob" }; // only id required
