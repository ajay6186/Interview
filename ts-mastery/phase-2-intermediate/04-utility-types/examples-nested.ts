export {};

// ── Nested Utility Type Examples ─────────────────────────────────────────────

// 1. Deeply nested Partial with explicit control
type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;
type AppState = {
  user: { profile: { name: string; avatar: string }; settings: { theme: string; notifications: boolean } };
  cart: { items: { id: string; qty: number }[]; total: number };
};
type PatchableState = DeepPartial<AppState>;
const patch: PatchableState = { user: { profile: { name: "Alice" } } };

// 2. Deeply nested Readonly with arrays
type DeepReadonly<T> =
  T extends (infer U)[] ? ReadonlyArray<DeepReadonly<U>> :
  T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } : T;
type FrozenState = DeepReadonly<AppState>;

// 3. Nested Pick across levels
type NestedPick<T, K extends keyof T, K2 extends keyof T[K]> = { [P in K]: Pick<T[P], K2> };
type PickedUser = NestedPick<AppState, "user", "profile">;
// { user: Pick<AppState["user"], "profile"> }

// 4. Recursive Required
type DeepRequired<T> = T extends object ? { [K in keyof T]-?: DeepRequired<T[K]> } : T;
type FullAppState = DeepRequired<AppState>;

// 5. Nested Omit at depth 2
type OmitNested<T, K extends keyof T, K2 extends keyof T[K]> = { [P in keyof T]: P extends K ? Omit<T[P], K2> : T[P] };
type StateWithoutAvatar = OmitNested<AppState, "user", "profile">;

// 6. Deep merge utility
type DeepMerge<T, U> = {
  [K in keyof T | keyof U]:
    K extends keyof T & keyof U
      ? T[K] extends object ? U[K] extends object ? DeepMerge<T[K], U[K]> : U[K] : U[K]
      : K extends keyof T ? T[K]
      : K extends keyof U ? U[K]
      : never;
};
type Base = { a: { x: number; y: number }; b: string };
type Extension = { a: { z: number }; c: boolean };
type Merged = DeepMerge<Base, Extension>; // { a: { x: number; y: number; z: number }; b: string; c: boolean }

// 7. Nested Record composition
type Matrix<T> = Record<number, Record<number, T>>;
const grid: Matrix<string> = { 0: { 0: "A", 1: "B" }, 1: { 0: "C", 1: "D" } };

// 8. Multi-level NonNullable
type DeepNonNullable<T> = T extends object
  ? { [K in keyof T]: DeepNonNullable<NonNullable<T[K]>> }
  : NonNullable<T>;
type NullableProfile = { name: string | null; address: { city: string | null } | null };
type CleanProfile = DeepNonNullable<NullableProfile>; // { name: string; address: { city: string } }

// 9. Nested Extract for response discriminant
type ApiResult<T> =
  | { status: "ok"; data: T; meta: { total: number } }
  | { status: "error"; error: string; code: number }
  | { status: "loading" };
type OkResult<T> = Extract<ApiResult<T>, { status: "ok" }>;
type DataOf<T> = OkResult<T>["data"];

// 10. Nested Awaited with chained promises
async function loadNested(): Promise<{ user: Promise<{ name: string }> }> {
  return { user: Promise.resolve({ name: "Alice" }) };
}
type NestedAwaited = Awaited<ReturnType<typeof loadNested>>; // { user: Promise<{ name: string }> }
// Note: Awaited only unwraps the top level

// 11. Nested Parameters with multiple HOF levels
function createMiddleware<T>(handler: (req: T, next: () => void) => void) {
  return (items: T[]) => items.forEach(req => handler(req, () => {}));
}
const httpMiddleware = createMiddleware<{ url: string }>((req, next) => { console.log(req.url); next(); });
type MiddlewareCreatorParams = Parameters<typeof createMiddleware>;
// [handler: (req: T, next: () => void) => void]

// 12. Nested InstanceType with generic class
class Repository<T> {
  constructor(private name: string) {}
  findAll(): T[] { return []; }
}
type RepoInstance<T> = InstanceType<typeof Repository<T>>;
const userRepo: RepoInstance<{ id: string }> = new Repository("users");

// 13. Nested Record with tuple values
type ColumnDef<T> = Record<keyof T, { header: string; render: (v: T[keyof T]) => string }>;

// 14. DeepPartial on a deeply nested graph
type Schema = {
  nodes: Array<{ id: string; type: string; data: Record<string, unknown> }>;
  edges: Array<{ from: string; to: string; weight: number }>;
  meta: { version: string; createdAt: Date };
};
type SchemaPatch = DeepPartial<Schema>;
const sp: SchemaPatch = { meta: { version: "2.0" } };

// 15. Nested utility: NullableDeep
type NullableDeep<T> = T extends object ? { [K in keyof T]: NullableDeep<T[K]> | null } : T | null;

// 16. Multi-level ReturnType chaining
const createStore = <T>(initial: T) => ({
  get: (): T => initial,
  set: (v: T) => {},
});
type Store2<T> = ReturnType<typeof createStore<T>>;
type StoreGet<T> = Store2<T>["get"];
type StoredValue<T> = ReturnType<StoreGet<T>>;

// 17. Nested PickByValue across levels
type PickByValue<T, V> = { [K in keyof T as T[K] extends V ? K : never]: T[K] };
type EntityMap = { id: string; name: string; age: number; active: boolean; createdAt: Date };
type StringOnly = PickByValue<EntityMap, string>;   // { id: string; name: string }
type NumberOnly = PickByValue<EntityMap, number>;    // { age: number }
type BoolOnly   = PickByValue<EntityMap, boolean>;  // { active: boolean }

// 18. Deep Flatten of nested type intersections
type Flatten<T> = { [K in keyof T]: T[K] };
type A2 = { x: number } & { y: string } & { z: boolean };
type FlatA2 = Flatten<A2>; // { x: number; y: string; z: boolean }

// 19. Conditional nested extraction
type ExtractNested<T, K extends keyof T, V> = T[K] extends V ? T : never;
type UserWithString = ExtractNested<{ id: string; age: number }, "id", string>; // { id: string; age: number }

// 20. Recursive Exclude — exclude from union at every level
type DeepExclude<T, U> = T extends object
  ? { [K in keyof T]: DeepExclude<T[K], U> }
  : Exclude<T, U>;
type WithNulls = { name: string | null; nested: { value: number | null } };
type WithoutNulls = DeepExclude<WithNulls, null>; // { name: string; nested: { value: number } }

// 21. Nested Partial for patch request body
type Patch<T> = { [K in keyof T]?: T[K] extends object ? Patch<T[K]> : T[K] };
type UserPatch = Patch<{ name: string; address: { city: string; zip: string } }>;
const up2: UserPatch = { address: { city: "NYC" } };

// 22. Tree structure with utility types
type TreeNode<T> = {
  value: T;
  children: TreeNode<T>[];
  parent?: TreeNode<T>;
};
type ReadonlyTree<T> = DeepReadonly<TreeNode<T>>;
type PartialTree<T> = DeepPartial<TreeNode<T>>;

// 23. Nested Record with enumerated keys
type Section = "header" | "body" | "footer";
type Row2 = "col1" | "col2" | "col3";
type TableLayout = Record<Section, Record<Row2, string>>;
const layout: TableLayout = {
  header: { col1: "Name", col2: "Age", col3: "Email" },
  body:   { col1: "", col2: "", col3: "" },
  footer: { col1: "Total", col2: "", col3: "" },
};

// 24. Nested ReturnType inference
class Service {
  async getUser(id: string) {
    return { id, name: "Alice", roles: ["admin"] as const };
  }
}
type GetUserResult = Awaited<ReturnType<Service["getUser"]>>;
type UserRoles = GetUserResult["roles"]; // readonly ["admin"]

// 25. Nested Omit + Partial for update DTO pattern
type UpdateDTO<T extends { id: string }> = Required<Pick<T, "id">> & DeepPartial<Omit<T, "id">>;
type Profile2 = { id: string; name: string; address: { city: string; zip: string } };
type ProfileUpdateDTO = UpdateDTO<Profile2>;
const profileUpdate: ProfileUpdateDTO = { id: "p1", address: { city: "London" } };

// 26. Deeply nested conditional type with extends
type IsNested<T> = T extends object ? (keyof T extends never ? false : true) : false;
type A3 = IsNested<{ x: number }>; // true
type B3 = IsNested<string>;        // false
type C3 = IsNested<{}>;            // false

// 27. Nested ConstructorParameters for sub-classing
class BaseModel {
  constructor(public id: string, public createdAt: Date) {}
}
class UserModel extends BaseModel {
  constructor(id: string, createdAt: Date, public name: string) { super(id, createdAt); }
}
type UserModelParams = ConstructorParameters<typeof UserModel>; // [string, Date, string]

// 28. Utility for typed nested updates
function setNested<T extends object, K1 extends keyof T, K2 extends keyof T[K1]>(
  obj: T, k1: K1, k2: K2, value: T[K1][K2]
): T {
  return { ...obj, [k1]: { ...obj[k1], [k2]: value } };
}
const state2 = { user: { name: "Alice", age: 30 }, theme: "dark" };
const updated = setNested(state2, "user", "name", "Bob");

// 29. Nested conditional with infer
type UnwrapPromiseNested<T> =
  T extends Promise<infer U> ? UnwrapPromiseNested<U> :
  T extends object ? { [K in keyof T]: UnwrapPromiseNested<T[K]> } :
  T;
type NestedResult = UnwrapPromiseNested<{ data: Promise<{ user: Promise<string> }> }>;
// { data: { user: string } }

// 30. Utility for type-safe deep get
type Get<T, K extends readonly unknown[]> =
  K extends [infer First, ...infer Rest]
    ? First extends keyof T
      ? Get<T[First], Rest>
      : never
    : T;
type DeepConfig = { db: { host: string; port: number } };
type Host = Get<DeepConfig, ["db", "host"]>; // string

// 31. Nested Record with variant
type ThemeVariant = "light" | "dark";
type Component = "button" | "input" | "card";
type CSSProperty = "color" | "background" | "border";
type DesignTokens = Record<ThemeVariant, Record<Component, Partial<Record<CSSProperty, string>>>>;
const tokens: DesignTokens = {
  light: { button: { color: "#fff", background: "#6366f1" }, input: {}, card: {} },
  dark:  { button: { color: "#fff", background: "#4f46e5" }, input: {}, card: {} },
};

// 32. Nested Awaited unwrap for parallel fetching
async function fetchAll(): Promise<[Promise<string>, Promise<number>]> {
  return [Promise.resolve("Alice"), Promise.resolve(30)];
}
type FetchAllResult = Awaited<ReturnType<typeof fetchAll>>; // [Promise<string>, Promise<number>]

// 33. Deep intersection merge with utility
type Deep = DeepMerge<{ a: { x: number }; b: string }, { a: { y: string }; c: boolean }>;
// { a: { x: number; y: string }; b: string; c: boolean }

// 34. Partial at one level, Required at another
type PartialTopRequired<T> = {
  [K in keyof T]?: Required<T[K] extends object ? T[K] : never>;
};

// 35. Nested Exclude from union in mapped type
type FilterUnion<T, Exclude2> = {
  [K in keyof T]: T[K] extends Exclude2 ? never : T[K];
}[keyof T];

// 36. PickByType generalization
type PickValueType<T, V> = { [K in keyof T as T[K] extends V ? K : never]: T[K] };
type Schema2 = { name: string; age: number; active: boolean; tags: string[] };
type ArrayFields = PickValueType<Schema2, unknown[]>; // { tags: string[] }

// 37. Nested Readonly tuple
type DeepReadonlyTuple<T extends readonly unknown[]> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};
type Entry = DeepReadonlyTuple<[string, { x: number }]>; // readonly [string, { readonly x: number }]

// 38. Multi-level InstanceType chain
class FactoryFactory {
  create() { return new (class { make() { return new (class { value = 42 })(); } })(); }
}
type FF = InstanceType<typeof FactoryFactory>;
type F = ReturnType<FF["create"]>;
type M = ReturnType<F["make"]>;
type V = M["value"]; // number

// 39. Partial<T> for a state machine context
type OrderState = { pending: {}; shipped: { trackingId: string }; delivered: { deliveredAt: Date } };
type PartialOrder = DeepPartial<OrderState>;

// 40. Conditional Required at certain depth
type RequiredAtDepth1<T> = { [K in keyof T]-?: T[K] };
type RequiredAtDepth2<T> = { [K in keyof T]-?: RequiredAtDepth1<T[K] extends object ? T[K] : {}> };

// 41. Nested Pick with indexed access
type NestedProfilePick = Pick<AppState["user"]["profile"], "name">;
const np: NestedProfilePick = { name: "Alice" };

// 42. Record of Records for matrix of options
type OptionMatrix<Row extends string, Col extends string, V> = Record<Row, Record<Col, V>>;
type SeatMatrix = OptionMatrix<"A" | "B" | "C", "1" | "2" | "3", boolean>;
const seats: SeatMatrix = {
  A: { "1": true, "2": false, "3": true },
  B: { "1": false, "2": true, "3": false },
  C: { "1": true, "2": true, "3": false },
};

// 43. Deep Mutable
type DeepMutable<T> = T extends object ? { -readonly [K in keyof T]: DeepMutable<T[K]> } : T;
type FrozenPoint = Readonly<{ x: Readonly<{ val: number }> }>;
type MutablePoint = DeepMutable<FrozenPoint>; // { x: { val: number } }

// 44. Nested ReturnType from factory
const createApiClient = (baseUrl: string) => ({
  users: {
    list: () => fetch(`${baseUrl}/users`),
    detail: (id: string) => fetch(`${baseUrl}/users/${id}`),
  },
});
type ApiClient2 = ReturnType<typeof createApiClient>;
type UsersApi = ApiClient2["users"];
type ListFn = UsersApi["list"];
type ListResult = ReturnType<ListFn>; // Promise<Response>

// 45. Recursive Partial with array item handling
type PartialArray<T> = T extends (infer U)[] ? PartialItem<U>[] : T;
type PartialItem<T> = T extends object ? { [K in keyof T]?: PartialArray<T[K]> } : T;

// 46. Type-safe deep setter
type DeepSetter<T> = {
  [K in keyof T]: T[K] extends object ? DeepSetter<T[K]> & { $set(val: T[K]): void } : { $set(val: T[K]): void };
};

// 47. Conditional NonNullable across union arms
type SafeValue<T> = T extends null | undefined ? never : T;
type Values = SafeValue<string | null | undefined | number>; // string | number

// 48. Nested Awaited in service composition
class DataService {
  async fetchProfile(id: string): Promise<{ id: string; bio: Promise<string> }> {
    return { id, bio: Promise.resolve("Software engineer") };
  }
}
type ProfileShape = Awaited<ReturnType<DataService["fetchProfile"]>>;
// { id: string; bio: Promise<string> }

// 49. RequiredKeys + PickByValue combination
type AllRequired<T> = { [K in keyof T]-?: T[K] };
type StringRequired<T> = PickByValue<AllRequired<T>, string>;
type FormData = { name?: string; email?: string; age?: number };
type RequiredStrings = StringRequired<FormData>; // { name: string; email: string }

// 50. Full compose: UpdateState<T>
type UpdateState<T extends object> = Readonly<{
  current: T;
  previous: DeepReadonly<T>;
  patch: DeepPartial<T>;
  apply: (patch: DeepPartial<T>) => UpdateState<T>;
}>;
