export {};

// ── Nested `infer` Keyword Examples ──────────────────────────────────────────

// 1. Three-level nested infer: Promise<Array<{ value: T }>>
type ExtractTriple<T> =
  T extends Promise<infer U>
    ? U extends (infer V)[]
      ? V extends { value: infer W }
        ? W
        : V
      : U
    : T;
type ET = ExtractTriple<Promise<Array<{ value: string }>>>; // string

// 2. Nested infer from method → return → unwrap
type MethodUnpack<T, K extends keyof T> =
  T[K] extends (...args: any[]) => infer R
    ? R extends Promise<infer U>
      ? U extends (infer E)[]
        ? E
        : U
      : R
    : never;
class DataService {
  async listUsers(): Promise<{ id: string; name: string }[]> { return []; }
}
type UserItem = MethodUnpack<DataService, "listUsers">; // { id: string; name: string }

// 3. Infer from HOF returning HOF
type DeepReturn<F> =
  F extends (...args: any[]) => infer R1
    ? R1 extends (...args: any[]) => infer R2
      ? R2 extends (...args: any[]) => infer R3
        ? R3
        : R2
      : R1
    : never;
type DR = DeepReturn<() => () => () => string>; // string

// 4. Infer from nested discriminated union
type NestedEvents =
  | { kind: "user"; event: { type: "login"; userId: string } | { type: "logout" } }
  | { kind: "order"; event: { type: "placed"; orderId: string } };
type ExtractUserEvent<T, EType extends string> =
  T extends { kind: "user"; event: infer E }
    ? E extends { type: EType } & infer Rest
      ? Omit<Rest, "type">
      : never
    : never;
type LoginData = ExtractUserEvent<NestedEvents, "login">; // { userId: string }

// 5. Infer from two-level generic
type UnwrapNested<T> =
  T extends { outer: { inner: infer I } } ? I : never;
type UN = UnwrapNested<{ outer: { inner: number } }>; // number

// 6. Infer from nested function composition
type ComposeReturn<F, G> =
  F extends (...args: any[]) => infer RF
    ? G extends (input: RF) => infer RG
      ? RG
      : never
    : never;
type CR = ComposeReturn<() => string, (s: string) => number>; // number

// 7. Infer from callback → callback chain
type CallbackChainResult<F> =
  F extends (cb1: (val: infer A) => (cb2: (val: infer B) => infer C) => void) => void
    ? { a: A; b: B; c: C }
    : never;

// 8. Infer from nested union extraction
type DeepExtract<U, Shape> =
  U extends Shape
    ? U
    : U extends { [K: string]: infer Inner }
    ? DeepExtract<Inner, Shape>
    : never;

// 9. Two-step infer: extract generic param from two layers
class Box2<T> { constructor(readonly value: T) {} }
class Container<T> { constructor(readonly box: Box2<T>) {} }
type ContainerValue<C> = C extends Container<infer T> ? T : never;
type CV = ContainerValue<Container<string>>; // string

// 10. Infer for deeply nested ORM model
type ModelRelation<T, K extends keyof T> =
  T[K] extends (infer Item)[]
    ? Item extends { id: infer ID }
      ? { relation: "hasMany"; itemType: Item; idType: ID }
      : never
    : T[K] extends { id: infer ID }
    ? { relation: "belongsTo"; itemType: T[K]; idType: ID }
    : never;
type User = { id: string; posts: { id: number; title: string }[] };
type UserPosts = ModelRelation<User, "posts">;
// { relation: "hasMany"; itemType: { id: number; title: string }; idType: number }

// 11. Infer from recursive discriminated union tree
type Tree<T> =
  | { kind: "leaf"; value: T }
  | { kind: "branch"; left: Tree<T>; right: Tree<T> };
type TreeLeafValue<T extends Tree<any>> =
  T extends { kind: "leaf"; value: infer V }
    ? V
    : T extends { kind: "branch"; left: infer L extends Tree<any> }
    ? TreeLeafValue<L>
    : never;

// 12. Infer from async generator
type AsyncGenItem<T> = T extends AsyncGenerator<infer Y, any, any> ? Y : never;
type AsyncGenReturn<T> = T extends AsyncGenerator<any, infer R, any> ? R : never;
type AGI = AsyncGenItem<AsyncGenerator<string, void, unknown>>; // string

// 13. Infer from event system with nested namespaces
type NestedEventMap = {
  user: { login: [userId: string]; logout: [] };
  order: { placed: [orderId: string; total: number] };
};
type NestedPayload<E extends NestedEventMap, NS extends keyof E, Ev extends keyof E[NS]> =
  E[NS][Ev] extends infer P extends any[] ? P : never;
type LP = NestedPayload<NestedEventMap, "user", "login">; // [string]

// 14. Infer chain: unpack curried function
type Uncurry<F> =
  F extends (a: infer A) => (b: infer B) => infer R
    ? (a: A, b: B) => R
    : F;
type UC = Uncurry<(a: string) => (b: number) => boolean>; // (a: string, b: number) => boolean

// 15. Infer from ADT constructors
type ADT =
  | { tag: "none" }
  | { tag: "some"; value: string }
  | { tag: "error"; code: number; message: string };
type ADTValue<T extends ADT, Tag extends ADT["tag"]> =
  T extends { tag: Tag } & infer Rest ? Omit<Rest, "tag"> : never;
type SomeData = ADTValue<ADT, "some">;  // { value: string }
type ErrData  = ADTValue<ADT, "error">; // { code: number; message: string }

// 16. Infer from object property chain
type ChainedValue<T, K1 extends keyof T, K2 extends keyof T[K1]> =
  T[K1][K2] extends infer V ? V : never;
type Config = { db: { host: string; port: number } };
type DbHost = ChainedValue<Config, "db", "host">; // string

// 17. Infer combined: extract result type and error type
type SafeFnResult<F> =
  F extends (...args: any[]) => Promise<infer R>
    ? R extends { ok: true; value: infer V }
      ? { success: V }
      : R extends { ok: false; error: infer E }
      ? { failure: E }
      : { raw: R }
    : never;

// 18. Infer from discriminated union with nested variants
type DBEvent =
  | { source: "mysql"; op: { type: "insert"; table: string; row: object } }
  | { source: "pg"; op: { type: "update"; table: string; changes: object } };
type DBOp<E extends DBEvent, S extends DBEvent["source"]> =
  E extends { source: S; op: infer Op } ? Op : never;
type MySQLOp = DBOp<DBEvent, "mysql">; // { type: "insert"; table: string; row: object }

// 19. Infer from two-level mapped + conditional
type WrapResult<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => infer R
    ? () => Promise<R>
    : T[K];
};
class Sync {
  count(): number { return 0; }
  name = "sync";
}
type AsyncSync = WrapResult<Sync>;
// { count: () => Promise<number>; name: string }

// 20. Infer from class hierarchy
abstract class BaseService<T> { abstract process(data: T): void; }
class UserService2 extends BaseService<{ id: string }> {
  process(data: { id: string }): void {}
}
type ServiceData<S> = S extends BaseService<infer T> ? T : never;
type USD = ServiceData<UserService2>; // { id: string }

// 21. Nested infer for tuple pairs
type PairValues<T extends [any, any][]> = {
  [K in keyof T]: T[K] extends [infer A, infer B] ? { key: A; value: B } : never;
};
type PV = PairValues<[["name", string], ["age", number]]>;
// [{ key: "name"; value: string }, { key: "age"; value: number }]

// 22. Infer from recursive Record values
type RecordLeaf<T> = T extends Record<string, infer V>
  ? V extends Record<string, any> ? RecordLeaf<V> : V
  : never;
type RL = RecordLeaf<{ a: { b: { c: number } } }>; // number

// 23. Infer from middleware stack type
type MiddlewareStack<T extends ((req: any, res: any, next: () => void) => void)[]> =
  T extends [(req: infer Req, res: infer Res, next: any) => void, ...infer Rest]
    ? { req: Req; res: Res; rest: Rest }
    : never;

// 24. Infer from decorator pattern
type Decorated<T, D> = D extends (ctor: new (...args: any[]) => T) => infer C ? C : never;

// 25. Infer from nested mapped conditional
type TransformNested<T> = {
  [K in keyof T]: T[K] extends object
    ? T[K] extends (infer U)[]
      ? U extends { value: infer V } ? V[] : T[K]
      : { [K2 in keyof T[K]]: T[K][K2] extends number ? string : T[K][K2] }
    : T[K];
};

// 26. Infer to detect co-variance
type IsCovariant<F, A, B> =
  F extends (x: A) => infer R
    ? F extends (x: B) => any
      ? true : false
    : false;

// 27. Infer from factory pattern
type FactoryOutput<F extends Record<string, () => any>> = {
  [K in keyof F]: F[K] extends () => infer R ? R : never;
};
const factories = {
  user: () => ({ id: "1", name: "Alice" }),
  post: () => ({ id: 1, title: "Hello" }),
};
type FactoryResult = FactoryOutput<typeof factories>;
// { user: { id: string; name: string }; post: { id: number; title: string } }

// 28. Infer from JSON schema to TypeScript type
type JSSchema =
  | { type: "string" }
  | { type: "number" }
  | { type: "boolean" }
  | { type: "array"; items: JSSchema }
  | { type: "object"; properties: Record<string, JSSchema> };
type InferJS<S extends JSSchema> =
  S extends { type: "string" }  ? string :
  S extends { type: "number" }  ? number :
  S extends { type: "boolean" } ? boolean :
  S extends { type: "array"; items: infer I extends JSSchema } ? InferJS<I>[] :
  S extends { type: "object"; properties: infer P extends Record<string, JSSchema> }
    ? { [K in keyof P]: InferJS<P[K]> }
  : never;
type PersonType = InferJS<{
  type: "object";
  properties: { name: { type: "string" }; age: { type: "number" } };
}>; // { name: string; age: number }

// 29. Infer from recursive function type
type RecursiveFn<T> = T extends (...args: any[]) => infer R
  ? R extends (...args: any[]) => any
    ? RecursiveFn<R>
    : R
  : T;
type RF = RecursiveFn<() => () => () => number>; // number

// 30. Infer from observer pattern
type ObserverValue<T> = T extends { subscribe: (cb: (val: infer V) => void) => void } ? V : never;
class Observable2<T> {
  constructor(private val: T) {}
  subscribe(cb: (val: T) => void): void { cb(this.val); }
}
type OV = ObserverValue<Observable2<string>>; // string

// 31. Infer for deeply nested access control
type NestedAccess<T, Depth extends number, Acc extends 0[] = []> =
  Acc["length"] extends Depth
    ? T
    : T extends object
    ? NestedAccess<T[keyof T], Depth, [...Acc, 0]>
    : T;

// 32. Infer from monad chain
type MonadChain<M, A, B> =
  M extends { map: (f: (a: A) => infer B2) => infer MB } ? MB : never;

// 33. Infer for type-safe event streaming
type StreamPayload<T extends { on(event: string, cb: (data: infer D) => void): void }, E extends string> =
  T extends { on(event: E, cb: (data: infer D) => void): void } ? D : never;

// 34. Infer from recursive tuple flatten
type FlatTuple<T extends any[]> =
  T extends [infer H, ...infer R]
    ? H extends any[]
      ? [...FlatTuple<H>, ...FlatTuple<R>]
      : [H, ...FlatTuple<R>]
    : [];
type FT = FlatTuple<[[1, 2], [3, [4, 5]]]>; // [1, 2, 3, 4, 5]

// 35. Infer from function union to produce result union
type UnionReturn<T> = T extends (...args: any[]) => infer R ? R : never;
type UR = UnionReturn<(() => string) | (() => number) | (() => boolean)>;
// string | number | boolean

// 36. Infer from class extends chain
class A { aMethod(): string { return ""; } }
class B extends A { bMethod(): number { return 0; } }
type ExtendsValue<T, Base> = T extends Base ? T : never;
type BCheck = ExtendsValue<typeof B, typeof A>; // typeof B

// 37. Infer from complex mapped + infer combination
type DeepMethodReturns<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => infer R
    ? R extends Promise<infer U>
      ? U
      : R
    : T[K] extends object
    ? DeepMethodReturns<T[K]>
    : T[K];
};
class Nested {
  async fetchUser(): Promise<{ id: string }> { return { id: "1" }; }
  format(): string { return ""; }
  sub = { count(): number { return 0; } };
}
type NR = DeepMethodReturns<Nested>;
// { fetchUser: { id: string }; format: string; sub: { count: number } }

// 38. Infer from two-branch: Ok vs Err
type ResultValue<T> = T extends { ok: true; value: infer V } | { ok: false; error: infer E }
  ? [V, E]
  : never;
type RV = ResultValue<{ ok: true; value: string } | { ok: false; error: Error }>;
// [string, Error]

// 39. Infer from typed tuple operations
type ZipInfer<A extends any[], B extends any[]> =
  A extends [infer AH, ...infer AR]
    ? B extends [infer BH, ...infer BR]
      ? [[AH, BH], ...ZipInfer<AR, BR>]
      : []
    : [];
type ZI = ZipInfer<[string, number], [boolean, null]>; // [[string, boolean], [number, null]]

// 40. Infer from DI container registration
type ContainerGet<Reg extends Record<string, new (...args: any[]) => any>, K extends keyof Reg> =
  Reg[K] extends new (...args: any[]) => infer I ? I : never;
class MyRepo { findAll() { return []; } }
type RegMap = { repo: typeof MyRepo };
type RepoInst = ContainerGet<RegMap, "repo">; // MyRepo

// 41. Infer from variadic HOF
type VariadicReturn<F extends (...args: any[]) => any> = ReturnType<F>;
type MappedVariadic<T extends Record<string, (...args: any[]) => any>> = {
  [K in keyof T]: VariadicReturn<T[K]>;
};

// 42. Infer from conditional chain with three types
type Triple<T> =
  T extends string ? [T, number, boolean] :
  T extends number ? [string, T, boolean] :
  [string, number, T];
type Tri1 = Triple<string>;  // [string, number, boolean]
type Tri2 = Triple<boolean>; // [string, number, boolean]

// 43. Infer from class decorator pattern
type ClassDecoratorReturn<D> =
  D extends (ctor: new (...args: infer P) => infer I) => infer Decorated
    ? { ctor: new (...args: P) => I; decorated: Decorated }
    : never;

// 44. Infer from functional options pattern
type OptionFn<T> = (options: T) => void;
type OptionParam<F> = F extends OptionFn<infer T> ? T : never;
type OP = OptionParam<OptionFn<{ timeout: number; retries: number }>>; // { timeout: number; retries: number }

// 45. Nested infer for typed SQL builder
type SelectResult<T, Cols extends (keyof T)[]> =
  Cols extends (infer K extends keyof T)[]
    ? Pick<T, K>
    : never;
type User2 = { id: string; name: string; email: string; age: number };
type Projection = SelectResult<User2, ["id", "name"]>; // { id: string; name: string }

// 46. Infer from function intersection (callable + property)
type HybridReturn<T> =
  T extends { (x: infer A): infer R; default: infer D } ? [A, R, D] : never;

// 47. Infer from typed store selector
type SelectorResult<State, Selector extends (state: State) => any> =
  Selector extends (state: State) => infer R ? R : never;
type AppStore = { count: number; users: string[] };
type SelectedCount = SelectorResult<AppStore, (s: AppStore) => s["count"]>; // number

// 48. Infer from complex error hierarchy
type ErrorPayload<E extends Error> = E extends { payload: infer P } ? P : never;
class ApiError extends Error { payload: { code: number; msg: string } = { code: 0, msg: "" }; }
type ApiPayload = ErrorPayload<ApiError>; // { code: number; msg: string }

// 49. Infer from recursive schema with depth limit
type RecSchema<T, Depth extends number, Acc extends 0[] = []> =
  Acc["length"] extends Depth
    ? T
    : T extends Record<string, infer V>
    ? Record<string, RecSchema<V, Depth, [...Acc, 0]>>
    : T;

// 50. Complete: infer multi-layer API client type
class FullApiClient {
  users = {
    list: async (): Promise<{ id: string; name: string }[]> => [],
    detail: async (id: string): Promise<{ id: string; name: string; email: string }> => ({} as any),
  };
  posts = {
    list: async (): Promise<{ id: number; title: string }[]> => [],
  };
}
type ApiNamespace<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => Promise<infer R> ? R : never;
};
type UsersAPI = ApiNamespace<FullApiClient["users"]>;
// { list: { id: string; name: string }[]; detail: { id: string; name: string; email: string } }
