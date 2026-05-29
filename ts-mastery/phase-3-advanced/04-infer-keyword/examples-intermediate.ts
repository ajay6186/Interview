export {};

// ── Intermediate `infer` Keyword Examples ────────────────────────────────────

// 1. infer with constraint on inferred type
type NumberReturn<F> = F extends (...args: any[]) => infer R extends number ? R : never;
type NR = NumberReturn<() => 42>; // 42
type NR2 = NumberReturn<() => string>; // never

// 2. infer with generic constraint in conditional
type StringArray<T> = T extends (infer U extends string)[] ? U : never;
type SA = StringArray<string[]>; // string
type SA2 = StringArray<number[]>; // never

// 3. Multi-position infer
type FnMeta<F> = F extends (a: infer A, b: infer B) => infer R
  ? { input: [A, B]; output: R }
  : never;
type FM = FnMeta<(a: string, b: number) => boolean>;
// { input: [string, number]; output: boolean }

// 4. infer in nested Promise chain
type DeepAwaited<T> = T extends Promise<infer U> ? DeepAwaited<U> : T;
type DA = DeepAwaited<Promise<Promise<Promise<string>>>>; // string

// 5. infer from method signature
type MethodMeta<T, K extends keyof T> =
  T[K] extends (this: any, ...args: infer P) => infer R
    ? { params: P; return: R }
    : never;
class UserService {
  create(name: string, email: string): { id: string } { return { id: "1" }; }
}
type CreateMeta = MethodMeta<UserService, "create">;
// { params: [string, string]; return: { id: string } }

// 6. infer from callback-style API
type CallbackValue<F> =
  F extends (cb: (err: null | Error, val: infer V) => void) => void ? V : never;
type CV = CallbackValue<(cb: (err: null | Error, data: string) => void) => void>; // string

// 7. infer from mapped type with conditional
type InferValues<T> = {
  [K in keyof T]: T[K] extends (infer U)[] ? U : T[K];
};
type Profile = { name: string; scores: number[]; tags: string[] };
type UnwrappedProfile = InferValues<Profile>;
// { name: string; scores: number; tags: string }

// 8. infer from discriminated union variant
type VariantData<T, Tag extends string> =
  T extends { type: Tag } & infer Rest ? Omit<Rest, "type"> : never;
type Events =
  | { type: "login"; userId: string; timestamp: Date }
  | { type: "logout"; userId: string };
type LoginData = VariantData<Events, "login">; // { userId: string; timestamp: Date }

// 9. infer class constructor with constraint
type CtorReturn<T> = T extends new (...args: any[]) => infer I extends object ? I : never;
class Repository<T> { findAll(): T[] { return []; } }
type RepoInstance = CtorReturn<typeof Repository<string>>; // Repository<string>

// 10. infer in recursive type: unwrap nested arrays
type DeepUnwrap<T> = T extends (infer U)[] ? DeepUnwrap<U> : T;
type DU = DeepUnwrap<string[][][]>; // string

// 11. infer for generic class field extraction
class Pair<A, B> { constructor(public first: A, public second: B) {} }
type PairA<T> = T extends Pair<infer A, any> ? A : never;
type PairB<T> = T extends Pair<any, infer B> ? B : never;
type PA = PairA<Pair<string, number>>;  // string
type PB = PairB<Pair<string, number>>; // number

// 12. infer from HOF return type
type HOFReturn<F> =
  F extends (arg: any) => (...args: any[]) => infer R ? R : never;
type HR = HOFReturn<(x: string) => (y: number) => boolean>; // boolean

// 13. infer in mapped type — extract function returns
type FunctionReturns<T> = {
  [K in keyof T as T[K] extends Function ? K : never]:
    T[K] extends (...args: any[]) => infer R ? R : never;
};
class Calculator {
  add(a: number, b: number): number { return a + b; }
  label(): string { return "calculator"; }
}
type CalcReturns = FunctionReturns<Calculator>;
// { add: number; label: string }

// 14. infer with template literal
type StripPrefix<S extends string, P extends string> =
  S extends `${P}${infer Rest}` ? Rest : S;
type SP = StripPrefix<"onClick", "on">; // "Click"
type SP2 = StripPrefix<"focus", "on">;  // "focus"

// 15. infer to detect optional parameter
type IsOptionalParam<F> =
  F extends (arg?: infer _A) => any ? true : false;
type IOP = IsOptionalParam<(x?: string) => void>; // true
type IOP2 = IsOptionalParam<(x: string) => void>; // false

// 16. infer from second generic argument
type SecondGeneric<T> = T extends Pair<any, infer B> ? B : never;
type SG = SecondGeneric<Pair<string, number>>; // number

// 17. infer from nested conditional type
type NestedInfer<T> =
  T extends Promise<infer U>
    ? U extends (infer E)[]
      ? E
      : U
    : T;
type NI1 = NestedInfer<Promise<number[]>>; // number
type NI2 = NestedInfer<Promise<string>>;   // string

// 18. infer in union distribution
type DistributeReturn<T> = T extends (...args: any[]) => infer R ? R : never;
type DR = DistributeReturn<(() => string) | (() => number)>; // string | number

// 19. infer for typed Event payload extraction
type PayloadOf<Events, Type extends string> =
  Events extends { type: Type; payload: infer P } ? P : never;
type AppEvents =
  | { type: "click"; payload: { x: number; y: number } }
  | { type: "keydown"; payload: { key: string } };
type ClickPayload = PayloadOf<AppEvents, "click">; // { x: number; y: number }

// 20. infer from Thenable (custom then-able)
type ThenableValue<T> = T extends { then(resolve: (val: infer V) => void): any } ? V : never;
type TV = ThenableValue<{ then(resolve: (val: number) => void): void }>; // number

// 21. infer from typed API response
type ResponseData<T> = T extends { data: infer D; status: number } ? D : never;
type RD = ResponseData<{ data: { user: string }; status: 200 }>; // { user: string }

// 22. infer from keyof T extraction
type KeysOf<T> = T extends Record<infer K, any> ? K : never;
type KO = KeysOf<{ a: 1; b: 2 }>; // "a" | "b"

// 23. infer combined: method name + return type
type MethodInfo<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => infer R
    ? { name: K; returnType: R }
    : never;
}[keyof T];
type CalcInfo = MethodInfo<Calculator>;
// { name: "add"; returnType: number } | { name: "label"; returnType: string }

// 24. infer from Map<K, V>
type MapKey<T> = T extends Map<infer K, any> ? K : never;
type MapVal<T> = T extends Map<any, infer V> ? V : never;
type MK = MapKey<Map<string, number>>; // string
type MV = MapVal<Map<string, number>>; // number

// 25. infer from Set<T>
type SetItem<T> = T extends Set<infer E> ? E : never;
type SI = SetItem<Set<boolean>>; // boolean

// 26. infer from Generator<Y, R, N>
type GenYield<T> = T extends Generator<infer Y, any, any> ? Y : never;
type GenReturn<T> = T extends Generator<any, infer R, any> ? R : never;
type GY = GenYield<Generator<number, string, void>>; // number
type GR = GenReturn<Generator<number, string, void>>; // string

// 27. infer from WeakRef<T>
type WeakRefTarget<T> = T extends WeakRef<infer U> ? U : never;
type WRT = WeakRefTarget<WeakRef<{ id: string }>>; // { id: string }

// 28. infer with multiple conditional arms
type InferKind<T> =
  T extends string   ? { kind: "string"; val: T } :
  T extends number   ? { kind: "number"; val: T } :
  T extends boolean  ? { kind: "bool"; val: T } :
  T extends (infer U)[] ? { kind: "array"; item: U } :
  { kind: "object"; val: T };
type IK1 = InferKind<string[]>;  // { kind: "array"; item: string }
type IK2 = InferKind<number>;    // { kind: "number"; val: number }

// 29. infer from typed function factory
type FactoryReturn<F extends () => any> = F extends () => infer R ? R : never;
const makeUser = () => ({ id: "1", name: "Alice" } as const);
type UserShape = FactoryReturn<typeof makeUser>; // { readonly id: "1"; readonly name: "Alice" }

// 30. infer from proxy handler
type ProxiedGet<T> = T extends {
  get(target: any, key: infer K): any;
} ? K : never;

// 31. infer from reducer type
type ReducerState<R> = R extends (state: infer S, action: any) => any ? S : never;
type ReducerAction<R> = R extends (state: any, action: infer A) => any ? A : never;
type CountReducer = (state: number, action: { type: "inc" | "dec" }) => number;
type CS = ReducerState<CountReducer>;   // number
type CA = ReducerAction<CountReducer>;  // { type: "inc" | "dec" }

// 32. infer from event listener
type EventListenerPayload<F> = F extends (event: infer E) => any ? E : never;
type ELP = EventListenerPayload<(e: MouseEvent) => void>; // MouseEvent

// 33. infer from class static method
class UserFactory {
  static create(name: string): { id: string; name: string } {
    return { id: "1", name };
  }
}
type StaticReturn<T> = T extends { create: (...args: any[]) => infer R } ? R : never;
type FactoryResult = StaticReturn<typeof UserFactory>; // { id: string; name: string }

// 34. infer from spread parameter
type SpreadArgs<F> = F extends (...args: [...infer A, infer Last]) => any ? [A, Last] : never;
type SA3 = SpreadArgs<(a: string, b: number, c: boolean) => void>; // [[string, number], boolean]

// 35. infer for typed middleware chain
type MiddlewareNext<F> = F extends (req: any, res: any, next: infer N) => any ? N : never;
type MN = MiddlewareNext<(req: Request, res: Response, next: () => void) => void>; // () => void

// 36. infer from Exclude result
type ExcludeInfer<T, U> = T extends U ? never : T;
type EI = ExcludeInfer<string | number | boolean, string>; // number | boolean

// 37. infer from record entry
type EntryInfer<T> = T extends [infer K, infer V] ? { key: K; value: V } : never;
type EI2 = EntryInfer<["name", string]>; // { key: "name"; value: string }

// 38. infer from event handler map
type HandlerPayload<T extends Record<string, (payload: any) => void>, K extends keyof T> =
  T[K] extends (payload: infer P) => void ? P : never;
type AppHandlers = { login: (payload: { userId: string }) => void };
type HP = HandlerPayload<AppHandlers, "login">; // { userId: string }

// 39. infer + constraint to narrow string literal
type ParseVersion<S extends string> =
  S extends `${infer Major extends number}.${infer Minor extends number}.${infer Patch extends number}`
    ? { major: Major; minor: Minor; patch: Patch }
    : never;
type PV = ParseVersion<"1.2.3">; // { major: 1; minor: 2; patch: 3 }

// 40. infer from React-like component props
type ComponentProps<T> = T extends (props: infer P) => any ? P : never;
const Button = (props: { label: string; onClick: () => void }) => null;
type ButtonProps = ComponentProps<typeof Button>; // { label: string; onClick: () => void }

// 41. infer from higher-kinded simulation
interface HKT2 { _A: unknown; type: unknown }
type Apply2<F extends HKT2, A> = (F & { _A: A })["type"];
interface OptionHKT extends HKT2 { type: this["_A"] | null }
type OptionString = Apply2<OptionHKT, string>; // string | null

// 42. infer from async function
type AsyncReturn<F> = F extends (...args: any[]) => Promise<infer R> ? R : never;
async function fetchUser(): Promise<{ name: string }> { return { name: "Alice" }; }
type FetchedUser = AsyncReturn<typeof fetchUser>; // { name: string }

// 43. infer from Iterable
type IterableItem<T> = T extends Iterable<infer I> ? I : never;
type II = IterableItem<string[]>; // string
type II2 = IterableItem<Set<number>>; // number

// 44. infer from class abstract method
abstract class Repo<T> { abstract find(id: string): T; }
type RepoType<R> = R extends Repo<infer T> ? T : never;
class UserRepo extends Repo<{ id: string; name: string }> {
  find(id: string) { return { id, name: "Alice" }; }
}
type UserRepoType = RepoType<UserRepo>; // { id: string; name: string }

// 45. infer from tagged template literal
type StripTag<T extends string, Tag extends string> =
  T extends `${Tag}:${infer Rest}` ? Rest : T;
type ST = StripTag<"user:alice", "user">; // "alice"

// 46. infer from error class
type ErrorData<E> = E extends Error & { data: infer D } ? D : never;
class AppError extends Error { constructor(public data: { code: number }) { super(); } }
type ED = ErrorData<AppError>; // { code: number }

// 47. infer from serialized JSON type
type Deserialized<T> = T extends string ? (T extends `${infer N extends number}` ? N : T) : T;
type DS1 = Deserialized<"42">;    // 42
type DS2 = Deserialized<"hello">; // "hello"

// 48. infer for deep pick
type DeepValue<T, K extends keyof T> = T[K] extends infer V ? (V extends object ? V : V) : never;
type DV = DeepValue<{ user: { name: string } }, "user">; // { name: string }

// 49. infer from object spread
type SpreadResult<T, U> = T extends object ? U extends object ? T & U : never : never;

// 50. infer for complete function type deconstruction
type Deconstruct<F> =
  F extends (...args: infer Args) => Promise<infer AsyncResult>
    ? { type: "async"; args: Args; result: AsyncResult }
    : F extends (...args: infer Args) => infer SyncResult
    ? { type: "sync"; args: Args; result: SyncResult }
    : never;
type DC1 = Deconstruct<(x: string) => Promise<number>>;
// { type: "async"; args: [string]; result: number }
type DC2 = Deconstruct<(x: string) => boolean>;
// { type: "sync"; args: [string]; result: boolean }
