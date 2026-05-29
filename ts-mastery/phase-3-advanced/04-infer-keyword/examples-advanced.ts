export {};

// ── Advanced `infer` Keyword Examples ────────────────────────────────────────

// 1. UnionToIntersection via infer in contravariant position
type UnionToIntersection<U> =
  (U extends any ? (x: U) => void : never) extends (x: infer I) => void ? I : never;
type UI = UnionToIntersection<{ a: string } | { b: number }>; // { a: string } & { b: number }

// 2. LastOfUnion via infer in conditional intersection
type LastOfUnion<U> =
  UnionToIntersection<U extends any ? () => U : never> extends () => infer R ? R : never;
type LU = LastOfUnion<"a" | "b" | "c">; // "c"

// 3. UnionToTuple recursive via LastOfUnion
type UnionToTuple<U, Acc extends any[] = []> =
  [U] extends [never] ? Acc : UnionToTuple<Exclude<U, LastOfUnion<U>>, [LastOfUnion<U>, ...Acc]>;
type UTT = UnionToTuple<"x" | "y" | "z">; // ["x", "y", "z"]

// 4. infer + constraint to narrow inferred type
type NumberReturn<F> = F extends (...args: any[]) => infer R extends number ? R : never;
type NR = NumberReturn<() => 42>; // 42

// 5. infer constrained to string literal
type StringKey<T> = T extends Record<infer K extends string, any> ? K : never;
type SK = StringKey<{ a: 1; b: 2 }>; // "a" | "b"

// 6. infer in co-recursive mutual type
type IsArray<T> = T extends (infer _U)[] ? true : false;
type WrapIfArray<T> = IsArray<T> extends true ? T extends (infer U)[] ? U[] : never : T[];
type WIA = WrapIfArray<string[]>; // string[]
type WIA2 = WrapIfArray<string>;  // string[]

// 7. infer enabling HKT simulation
interface HKT { readonly _A: unknown; readonly type: unknown }
type Apply<F extends HKT, A> = (F & { readonly _A: A })["type"];
interface OptionHKT extends HKT { readonly type: this["_A"] | null }
interface ArrayHKT extends HKT { readonly type: this["_A"][] }
type OptionStr = Apply<OptionHKT, string>; // string | null
type ArrNum   = Apply<ArrayHKT, number>;   // number[]

// 8. infer from recursive Functor via HKT
type FMap<F extends HKT, A, B> =
  Apply<F, A> extends infer FA ? FA extends A[] ? Apply<F, B> : never : never;

// 9. infer from recursive template literal: string split to union
type SplitUnion<S extends string, D extends string> =
  S extends `${infer H}${D}${infer T}` ? H | SplitUnion<T, D> : S;
type SU = SplitUnion<"a|b|c", "|">; // "a" | "b" | "c"

// 10. infer from template literal: extract all named params
type ExtractParams<R extends string> =
  R extends `${string}:${infer P}/${infer Rest}`
    ? P | ExtractParams<`/${Rest}`>
    : R extends `${string}:${infer P}`
    ? P
    : never;
type EP = ExtractParams<"/users/:id/posts/:postId">; // "id" | "postId"

// 11. infer in tuple recursion: Reverse
type Reverse<T extends any[], Acc extends any[] = []> =
  T extends [infer H, ...infer Tail] ? Reverse<Tail, [H, ...Acc]> : Acc;
type Rev = Reverse<[1, 2, 3, 4]>; // [4, 3, 2, 1]

// 12. infer in tuple recursion: Flatten one level
type Flatten<T extends any[]> =
  T extends [infer H, ...infer Tail]
    ? H extends any[]
      ? [...H, ...Flatten<Tail>]
      : [H, ...Flatten<Tail>]
    : [];
type FL = Flatten<[[1, 2], [3, [4, 5]], 6]>; // [1, 2, 3, [4, 5], 6]

// 13. infer for Zip of two tuples
type Zip<A extends any[], B extends any[]> =
  A extends [infer AH, ...infer AT]
    ? B extends [infer BH, ...infer BT]
      ? [[AH, BH], ...Zip<AT, BT>]
      : []
    : [];
type ZR = Zip<[1, 2, 3], ["a", "b", "c"]>; // [[1, "a"], [2, "b"], [3, "c"]]

// 14. infer for variadic tuple Concat
type Concat<A extends any[], B extends any[]> = [...A, ...B];
type CO = Concat<[1, 2], [3, 4]>; // [1, 2, 3, 4]

// 15. infer for typed Curry
type CurryFn<Args extends any[], R> =
  Args extends [infer A, ...infer Rest]
    ? Rest extends []
      ? (a: A) => R
      : (a: A) => CurryFn<Rest, R>
    : () => R;
type CurriedAdd = CurryFn<[number, number, number], number>;
// (a: number) => (a: number) => (a: number) => number

// 16. infer for uncurry (flatten curried to tuple args)
type Uncurry<F> =
  F extends (a: infer A) => infer R
    ? R extends (...args: any[]) => any
      ? [A, ...Uncurry<R>] extends infer U ? U extends any[] ? U : [A] : [A]
      : [A]
    : [];

// 17. infer from multiple overload signatures (last wins)
function process(x: string): boolean;
function process(x: number): string;
function process(x: any): any { return x; }
type ProcessReturn = ReturnType<typeof process>; // string (last overload)

// 18. infer for OverloadParameters extraction via union
type Overloads<T extends (...args: any[]) => any> =
  T extends { (...args: infer A1): infer R1; (...args: infer A2): infer R2 }
    ? [(...args: A1) => R1, (...args: A2) => R2]
    : never;

// 19. infer from function composition type
type Compose<Fns extends readonly ((...args: any[]) => any)[]> =
  Fns extends readonly [infer F1 extends (...args: any[]) => any]
    ? F1
    : Fns extends readonly [
        infer F1 extends (...args: any[]) => any,
        ...infer Rest extends readonly ((...args: any[]) => any)[]
      ]
    ? (...args: Parameters<F1>) => ReturnType<Compose<Rest>>
    : never;

// 20. infer for pipeline step extraction
type PipeArgs<Fns extends readonly any[]> =
  Fns extends readonly [(...args: infer A) => infer _R, ...infer _Rest] ? A : never;
type PipeReturn<Fns extends readonly any[]> =
  Fns extends readonly [...infer _Init, (...args: any[]) => infer R] ? R : never;

// 21. infer for type-safe Redux action creators
type ActionCreator<T extends string, P> = { type: T; payload: P };
type ActionType<AC> = AC extends ActionCreator<infer T, any> ? T : never;
type ActionPayload<AC> = AC extends ActionCreator<any, infer P> ? P : never;
type LoginAction = ActionCreator<"LOGIN", { userId: string }>;
type LAType    = ActionType<LoginAction>;    // "LOGIN"
type LAPayload = ActionPayload<LoginAction>; // { userId: string }

// 22. infer from class with generic method
class Repository<T> {
  find(id: string): Promise<T | null> { return Promise.resolve(null); }
  findAll(): Promise<T[]> { return Promise.resolve([]); }
}
type RepoEntity<R> = R extends Repository<infer T> ? T : never;
type UserEntity = RepoEntity<Repository<{ id: string; name: string }>>; // { id: string; name: string }

// 23. infer from deep conditional: Result type chain
type Ok<T> = { ok: true; value: T };
type Err<E> = { ok: false; error: E };
type Result<T, E> = Ok<T> | Err<E>;
type OkValue<R> = R extends Ok<infer T> ? T : never;
type ErrValue<R> = R extends Err<infer E> ? E : never;
type OV = OkValue<Result<number, string>>; // number
type EV = ErrValue<Result<number, string>>; // string

// 24. infer from class static factory method
class UserFactory {
  static create(id: string, name: string): { id: string; name: string } {
    return { id, name };
  }
}
type StaticReturn<T, K extends keyof T> =
  T[K] extends (...args: any[]) => infer R ? R : never;
type FactoryResult = StaticReturn<typeof UserFactory, "create">; // { id: string; name: string }

// 25. infer for typed event bus: extract payload by event name
type ExtractPayload<Events, Name extends string> =
  Events extends { name: Name; payload: infer P } ? P : never;
type BusEvents =
  | { name: "user:login"; payload: { userId: string } }
  | { name: "user:logout"; payload: { userId: string; reason: string } };
type LoginPayload = ExtractPayload<BusEvents, "user:login">; // { userId: string }

// 26. infer enabling type-level schema engine
type InferSchema<S> =
  S extends { type: "string" }  ? string  :
  S extends { type: "number" }  ? number  :
  S extends { type: "boolean" } ? boolean :
  S extends { type: "array"; items: infer I } ? InferSchema<I>[] :
  S extends { type: "object"; props: infer P }
    ? { [K in keyof P]: InferSchema<P[K]> }
    : never;
type UserSchema = {
  type: "object";
  props: { name: { type: "string" }; age: { type: "number" }; tags: { type: "array"; items: { type: "string" } } };
};
type InferredUser = InferSchema<UserSchema>;
// { name: string; age: number; tags: string[] }

// 27. infer for type-level state machine transitions
type FSMTransition<States extends string, Events extends string> = {
  [S in States]: { [E in Events]?: States };
};
type CanTransit<
  FSM extends FSMTransition<any, any>,
  State extends keyof FSM,
  Event extends keyof FSM[State]
> = FSM[State][Event] extends infer Next ? Next : never;
type TrafficFSM = FSMTransition<"red" | "yellow" | "green", "next" | "reset"> & {
  red:    { next: "green" };
  green:  { next: "yellow" };
  yellow: { next: "red"; reset: "red" };
};
type AfterGreenNext = CanTransit<TrafficFSM, "green", "next">; // "yellow"

// 28. infer combined with mapped type for API client
type ApiSpec = {
  getUser:  { input: { id: string };        output: { name: string } };
  listUsers:{ input: {};                    output: { name: string }[] };
  createUser:{ input: { name: string };     output: { id: string; name: string } };
};
type ApiClient<Spec> = {
  [K in keyof Spec]: Spec[K] extends { input: infer I; output: infer O }
    ? (input: I) => Promise<O>
    : never;
};
type TypedClient = ApiClient<ApiSpec>;
// { getUser: (input: {id: string}) => Promise<{name: string}>; ... }

// 29. infer for typed middleware inference
type MiddlewareFn<Ctx> = (ctx: Ctx, next: () => Promise<void>) => Promise<void>;
type ContextOf<M> = M extends MiddlewareFn<infer Ctx> ? Ctx : never;
type AuthMiddleware = MiddlewareFn<{ user: { id: string }; req: Request }>;
type AuthCtx = ContextOf<AuthMiddleware>; // { user: { id: string }; req: Request }

// 30. infer for deep path accessor type
type SplitPath<P extends string> =
  P extends `${infer H}.${infer T}` ? [H, ...SplitPath<T>] : [P];
type GetPath<T, P extends string[]> =
  P extends [infer K extends string & keyof T, ...infer Rest extends string[]]
    ? Rest extends []
      ? T[K]
      : GetPath<T[K], Rest>
    : never;
type AtPath<T, P extends string> = GetPath<T, SplitPath<P>>;
type Config = { db: { host: string; port: number }; app: { name: string } };
type DBHost = AtPath<Config, "db.host">; // string
type AppName = AtPath<Config, "app.name">; // string

// 31. infer for typed validator builder
type Validator<T> = { validate: (val: unknown) => val is T };
type ValidatedType<V> = V extends Validator<infer T> ? T : never;
const stringValidator: Validator<string> = { validate: (v): v is string => typeof v === "string" };
type VT = ValidatedType<typeof stringValidator>; // string

// 32. infer from recursive type: deep array unwrap
type DeepUnwrapArray<T> = T extends (infer U)[] ? DeepUnwrapArray<U> : T;
type DUA = DeepUnwrapArray<string[][][]>; // string

// 33. infer from recursive type: deep Promise unwrap
type DeepAwaited<T> = T extends Promise<infer U> ? DeepAwaited<U> : T;
type DPA = DeepAwaited<Promise<Promise<Promise<number>>>>; // number

// 34. infer for type-safe builder stage
type BuilderState<T extends Record<string, boolean>> = {
  [K in keyof T]: T[K] extends true ? "set" : "unset";
};
type WithField<State extends Record<string, boolean>, K extends string> =
  State & { [P in K]: true };

// 35. infer from branded type
declare const __brand: unique symbol;
type Brand<T, B> = T & { [__brand]: B };
type UnwrapBrand<T> = T extends Brand<infer V, any> ? V : T;
type UserId = Brand<string, "UserId">;
type UB2 = UnwrapBrand<UserId>; // string

// 36. infer for phantom type extraction
type PhantomRead  = "read";
type PhantomWrite = "write";
type Capability<T, Cap extends string> = { _cap: Cap; _type: T };
type CapabilityType<C> = C extends Capability<infer T, any> ? T : never;
type CapCap<C>         = C extends Capability<any, infer Cap> ? Cap : never;
type RC = CapabilityType<Capability<string, PhantomRead>>;   // string
type CC = CapCap<Capability<string, PhantomRead>>;           // "read"

// 37. infer for typed mixin extraction
type Constructor<T = {}> = new (...args: any[]) => T;
type MixinBase<M> = M extends Constructor<infer T> ? T : never;
class BaseEntity { id = ""; }
type EntityMixinBase = MixinBase<typeof BaseEntity>; // BaseEntity

// 38. infer from variadic tuple: collect rest after first two
type DropTwo<T extends any[]> =
  T extends [any, any, ...infer Rest] ? Rest : T;
type DT = DropTwo<[string, number, boolean, Date]>; // [boolean, Date]

// 39. infer in inductive proof style: tuple length
type Length<T extends any[]> = T extends { length: infer L } ? L : never;
type Len = Length<[1, 2, 3, 4]>; // 4

// 40. infer for typed Lens
type Lens<S, A> = {
  get: (s: S) => A;
  set: (a: A) => (s: S) => S;
};
type LensTarget<L> = L extends Lens<any, infer A> ? A : never;
type LensSource<L> = L extends Lens<infer S, any> ? S : never;
declare const nameLens: Lens<{ name: string }, string>;
type LT = LensTarget<typeof nameLens>; // string
type LS = LensSource<typeof nameLens>; // { name: string }

// 41. infer for type-safe observer pattern
type Observer<T> = { next: (val: T) => void; complete?: () => void };
type ObservedType<O> = O extends Observer<infer T> ? T : never;
type OT2 = ObservedType<Observer<{ id: string }>>; // { id: string }

// 42. infer for correlated union narrowing
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; side: number }
  | { kind: "triangle"; base: number; height: number };
type ShapeData<K extends Shape["kind"]> =
  Shape extends infer S ? S extends { kind: K } ? Omit<S, "kind"> : never : never;
type CircleData   = ShapeData<"circle">;   // { radius: number }
type TriangleData = ShapeData<"triangle">; // { base: number; height: number }

// 43. infer for type-level monad bind (>>=)
type MonadBind<M, F> =
  M extends { value: infer V }
    ? F extends (v: V) => infer R
      ? R
      : never
    : never;
type Wrapped = { value: number };
type Doubled = MonadBind<Wrapped, (n: number) => { value: string }>;
// { value: string }

// 44. infer for exhaustive action handler types
type Action =
  | { type: "INCREMENT"; amount: number }
  | { type: "DECREMENT"; amount: number }
  | { type: "RESET" };
type ActionHandlers<A extends { type: string }> = {
  [K in A["type"]]: A extends { type: K } ? (action: A) => void : never;
};
type AllHandlers = ActionHandlers<Action>;
// { INCREMENT: (action: {...}) => void; DECREMENT: ...; RESET: ... }

// 45. infer for generic proxy handler return type
type ProxyGet<T, K extends keyof T> = T[K] extends infer V ? V : never;
type PG = ProxyGet<{ name: string; age: number }, "name">; // string

// 46. infer for deep method return type
type DeepMethodReturn<T, K extends keyof T> =
  T[K] extends (...args: any[]) => Promise<infer R>
    ? R
    : T[K] extends (...args: any[]) => infer R
    ? R
    : never;
class DataService {
  async fetchUser(): Promise<{ id: string; name: string }> { return { id: "1", name: "Alice" }; }
  formatName(name: string): string { return name.toUpperCase(); }
}
type FetchReturn  = DeepMethodReturn<DataService, "fetchUser">;  // { id: string; name: string }
type FormatReturn = DeepMethodReturn<DataService, "formatName">; // string

// 47. infer for function signature normalization
type NormalizeAsync<F> =
  F extends (...args: infer A) => Promise<infer R>
    ? { async: true; args: A; result: R }
    : F extends (...args: infer A) => infer R
    ? { async: false; args: A; result: R }
    : never;
type NA1 = NormalizeAsync<(x: string) => Promise<number>>;
// { async: true; args: [string]; result: number }
type NA2 = NormalizeAsync<(x: string) => boolean>;
// { async: false; args: [string]; result: boolean }

// 48. infer for interface extension detection
type Extends<A, B> = A extends B ? true : false;
type IsSerializable<T> = Extends<T, { serialize(): string }>;
class Token { serialize() { return "token"; } }
class RawData {}
type IS1 = IsSerializable<Token>;   // true
type IS2 = IsSerializable<RawData>; // false

// 49. infer for runtime-type-safe injection
type InjectableClass<T> = new (...args: any[]) => T;
type InjectedType<C> = C extends InjectableClass<infer T> ? T : never;
class EmailService { send(to: string, msg: string): void {} }
type ESType = InjectedType<typeof EmailService>; // EmailService

// 50. infer for complete type-safe RPC client generation
type RPCSchema = {
  auth: {
    login:  { req: { email: string; password: string }; res: { token: string } };
    logout: { req: { token: string };                   res: { success: boolean } };
  };
  users: {
    get:    { req: { id: string };   res: { id: string; name: string } };
    list:   { req: { page: number }; res: { items: { id: string; name: string }[] } };
  };
};
type RPCNamespace<NS> = {
  [K in keyof NS]: NS[K] extends { req: infer Req; res: infer Res }
    ? (req: Req) => Promise<Res>
    : never;
};
type RPCClient<Schema> = {
  [NS in keyof Schema]: RPCNamespace<Schema[NS]>;
};
type TypedRPCClient = RPCClient<RPCSchema>;
// {
//   auth:  { login: (req: {email,password}) => Promise<{token}>; logout: ... };
//   users: { get: (req: {id}) => Promise<{id,name}>; list: ... };
// }
