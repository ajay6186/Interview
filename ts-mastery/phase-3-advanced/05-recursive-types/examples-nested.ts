export {};

// ── Nested Recursive Type Examples ────────────────────────────────────────────

// 1. Doubly recursive: DeepPartial of DeepReadonly
type DeepReadonly<T> = { readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K] };
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };
type DPDR<T> = DeepPartial<DeepReadonly<T>>;
type Nested1 = { db: { host: string; port: number }; app: { name: string } };
type DPDR1 = DPDR<Nested1>;

// 2. Recursive: 3-level JSON-like schema → TypeScript type
type Schema =
  | { t: "str" }
  | { t: "num" }
  | { t: "bool" }
  | { t: "arr"; item: Schema }
  | { t: "obj"; fields: { [k: string]: Schema } }
  | { t: "opt"; inner: Schema };
type FromSchema<S extends Schema> =
  S extends { t: "str" }  ? string  :
  S extends { t: "num" }  ? number  :
  S extends { t: "bool" } ? boolean :
  S extends { t: "arr"; item: infer I extends Schema } ? FromSchema<I>[] :
  S extends { t: "opt"; inner: infer I extends Schema } ? FromSchema<I> | undefined :
  S extends { t: "obj"; fields: infer F }
    ? { [K in keyof F]: F[K] extends Schema ? FromSchema<F[K]> : never }
    : never;
type PersonSchema = {
  t: "obj";
  fields: {
    name: { t: "str" };
    age:  { t: "num" };
    tags: { t: "arr"; item: { t: "str" } };
    addr: { t: "opt"; inner: { t: "obj"; fields: { city: { t: "str" } } } };
  };
};
type Person = FromSchema<PersonSchema>;
// { name: string; age: number; tags: string[]; addr?: { city: string } }

// 3. Recursive: deeply nested path + value extractor
type DeepGet<T, P extends string> =
  P extends `${infer K}.${infer Rest}`
    ? K extends keyof T
      ? DeepGet<T[K], Rest>
      : never
    : P extends keyof T ? T[P] : never;
type Data = { user: { profile: { address: { city: string; zip: string } } } };
type City = DeepGet<Data, "user.profile.address.city">; // string
type Zip  = DeepGet<Data, "user.profile.address.zip">;  // string

// 4. Recursive: mutual recursion — Odd/Even depth type
type Even<T, D extends 0[] = []> =
  D["length"] extends 0 ? T : T extends object ? { [K in keyof T]: Odd<T[K], D> } : T;
type Odd<T, D extends 0[]> =
  D extends [0, ...infer Rest extends 0[]] ? Even<T, Rest> : T;

// 5. Recursive: AST with multiple node types
type Lit = { kind: "lit"; val: number | string | boolean };
type Var = { kind: "var"; name: string };
type BinOp = { kind: "binop"; op: "+" | "-" | "*" | "/"; left: ASTNode; right: ASTNode };
type Call = { kind: "call"; fn: ASTNode; args: ASTNode[] };
type Lambda = { kind: "lambda"; params: string[]; body: ASTNode };
type ASTNode = Lit | Var | BinOp | Call | Lambda;
const ast: ASTNode = {
  kind: "call",
  fn: { kind: "lambda", params: ["x"], body: { kind: "binop", op: "+", left: { kind: "var", name: "x" }, right: { kind: "lit", val: 1 } } },
  args: [{ kind: "lit", val: 41 }]
};

// 6. Recursive: typed graph adjacency map
type Graph<Nodes extends string> = { [N in Nodes]: Nodes[] };
type BFS<G extends Graph<string>, Queue extends string[], Visited extends string = never> =
  Queue extends [infer Current extends string, ...infer Rest extends string[]]
    ? BFS<G, [...Rest, ...Exclude<G[Current][number], Visited | Current>[]], Visited | Current>
    : Visited;

// 7. Recursive: strongly typed reducer combiner
type CombinedState<Reducers extends Record<string, (s: any, a: any) => any>> = {
  [K in keyof Reducers]: Reducers[K] extends (s: infer S, a: any) => any ? S : never;
};
type AuthReducer = (s: { token: string | null }, a: { type: string }) => { token: string | null };
type UserReducer = (s: { name: string }, a: { type: string }) => { name: string };
type AppReducers = { auth: AuthReducer; user: UserReducer };
type AppCombinedState = CombinedState<AppReducers>;
// { auth: { token: string | null }; user: { name: string } }

// 8. Recursive: chain of transformers
type Transformer<A, B> = { transform: (input: A) => B };
type Pipeline<A, Steps extends readonly Transformer<any, any>[]> =
  Steps extends readonly [Transformer<A, infer B>, ...infer Rest extends readonly Transformer<any, any>[]]
    ? [B, ...Pipeline<B, Rest>]
    : [];

// 9. Recursive: strongly typed Trie for routes
type RouteTrie = { [segment: string]: RouteTrie | { __component: string } };
type InsertRoute<T extends RouteTrie, Segs extends string[], Component extends string> =
  Segs extends [infer S extends string, ...infer Rest extends string[]]
    ? { [K in keyof T | S]: K extends S ? (Rest extends [] ? { __component: Component } : InsertRoute<T extends { [P in S]: infer V extends RouteTrie } ? V : {}, Rest, Component>) : T[K] }
    : T;

// 10. Recursive: type-safe builder with history
type BuilderHist<Steps extends any[], Current> = {
  add<T>(val: T): BuilderHist<[...Steps, T], T>;
  build(): Steps;
  current: Current;
};

// 11. Recursive: nested discriminated union evaluator
type Eval<E extends ASTNode> =
  E extends Lit ? E["val"] :
  E extends BinOp ? number :
  never;

// 12. Recursive: collect all discriminant values
type AllKinds<T> = T extends { kind: infer K } ? K : never;
type AllASTKinds = AllKinds<ASTNode>; // "lit" | "var" | "binop" | "call" | "lambda"

// 13. Recursive: unwrap nested Either type
type Either<L, R> = { tag: "left"; left: L } | { tag: "right"; right: R };
type UnwrapRight<E> = E extends { tag: "right"; right: infer R } ? R : never;
type UnwrapLeft<E>  = E extends { tag: "left";  left:  infer L } ? L : never;
type DeepRight<E> = E extends { tag: "right"; right: infer R }
  ? R extends Either<any, any> ? DeepRight<R> : R
  : never;

// 14. Recursive: corecursive stream type (lazy)
type Stream<T> = { head: T; tail: () => Stream<T> } | null;
function take<T>(n: number, s: Stream<T>): T[] {
  if (!s || n === 0) return [];
  return [s.head, ...take(n - 1, s.tail())];
}

// 15. Recursive: nested Promise/Either monad chain
type AsyncEither<L, R> = Promise<Either<L, R>>;
type ChainAsyncEither<L, R, R2> = (
  prev: AsyncEither<L, R>,
  fn: (r: R) => AsyncEither<L, R2>
) => AsyncEither<L, R2>;

// 16. Recursive: deep boolean object (all fields → boolean)
type DeepBoolean<T> = { [K in keyof T]: T[K] extends object ? DeepBoolean<T[K]> : boolean };
type DBool = DeepBoolean<{ a: { b: string; c: number }; d: string }>;
// { a: { b: boolean; c: boolean }; d: boolean }

// 17. Recursive: typed plugin system with nested hooks
type PluginHooks<Events extends Record<string, any>> = {
  [K in keyof Events]?: (payload: Events[K]) => void | Promise<void>;
};
type Plugin<Events extends Record<string, any>> = {
  name: string;
  hooks: PluginHooks<Events>;
  dependencies?: string[];
};

// 18. Recursive: typed state machine with nested states
type StateMachine<S extends string, E extends string> = {
  initial: S;
  states: {
    [State in S]: {
      on: { [Event in E]?: S };
      entry?: () => void;
      exit?:  () => void;
    };
  };
};
type TrafficLight = StateMachine<"red" | "yellow" | "green", "next" | "reset">;

// 19. Recursive: deeply nested mapped transformation
type DeepSnakeCase<T> =
  T extends string ? string :
  T extends (infer U)[] ? DeepSnakeCase<U>[] :
  T extends object
    ? { [K in keyof T as K extends string ? SnakeCase<K> : K]: DeepSnakeCase<T[K]> }
    : T;
type SnakeCase<S extends string> =
  S extends `${infer H}${infer T}`
    ? H extends Uppercase<H>
      ? H extends Lowercase<H>
        ? `${H}${SnakeCase<T>}`
        : `_${Lowercase<H>}${SnakeCase<T>}`
      : `${H}${SnakeCase<T>}`
    : S;
type CamelData = { firstName: string; lastName: string; homeAddress: { zipCode: string } };
type SnakeData = DeepSnakeCase<CamelData>;
// { first_name: string; last_name: string; home_address: { zip_code: string } }

// 20. Recursive: typed dependency injection graph
type DIGraph<Services extends Record<string, any>> = {
  [K in keyof Services]: {
    factory: (...deps: any[]) => Services[K];
    deps: (keyof Services)[];
  };
};

// 21. Recursive: event sourcing aggregate
type Event2<T extends string, P> = { type: T; payload: P; timestamp: number };
type EventStream<Events extends Event2<string, any>[]> = Events;
type ApplyEvent<State, E> = E extends Event2<infer T, infer P>
  ? T extends "increment" ? P extends number ? { count: P } : State : State
  : State;

// 22. Recursive: typed memoization cache
type MemoCache<F extends (...args: any[]) => any> =
  Map<Parameters<F>[0], ReturnType<F>>;

// 23. Recursive: nested form group
type FormGroup<T> = {
  [K in keyof T]: T[K] extends object
    ? FormGroup<T[K]>
    : { value: T[K]; dirty: boolean; valid: boolean };
};
type UserFormGroup = FormGroup<{ name: string; address: { city: string; zip: string } }>;

// 24. Recursive: deeply nested class hierarchy type inference
abstract class BaseRepo<T, ID> {
  abstract findById(id: ID): Promise<T | null>;
  abstract save(entity: T): Promise<T>;
}
class TypedRepo<T extends { id: string }> extends BaseRepo<T, string> {
  async findById(id: string) { return null as T | null; }
  async save(entity: T) { return entity; }
}
type RepoEntityType<R> = R extends BaseRepo<infer T, any> ? T : never;

// 25. Recursive: tuple rotation (all rotations)
type Rotate<T extends any[]> = T extends [infer H, ...infer Rest] ? [...Rest, H] : T;
type Rotate2<T extends any[]> = Rotate<Rotate<T>>;
type Rotate3<T extends any[]> = Rotate<Rotate2<T>>;
type R0 = Rotate<[1, 2, 3]>;  // [2, 3, 1]
type R1 = Rotate2<[1, 2, 3]>; // [3, 1, 2]
type R2 = Rotate3<[1, 2, 3]>; // [1, 2, 3]

// 26. Recursive: N-ary tree fold type
type NTree<T> = { val: T; children: NTree<T>[] };
type TreeFold<T, R> = (node: { val: T; childResults: R[] }) => R;

// 27. Recursive: type-safe option chaining with lenses
type Lens2<S, A> = { get: (s: S) => A; set: (a: A, s: S) => S };
type ComposeLens<S, A, B> = (outer: Lens2<S, A>, inner: Lens2<A, B>) => Lens2<S, B>;

// 28. Recursive: higher-order recursive type transformer
type HORecursive<T, F extends (x: any) => any> =
  T extends (infer U)[] ? HORecursive<U, F>[] :
  T extends object ? { [K in keyof T]: HORecursive<T[K], F> } :
  F extends (x: T) => infer R ? R : T;

// 29. Recursive: deep patch (nested partial update)
type DeepPatch<T, P extends DeepPartial<T>> = {
  [K in keyof T]: K extends keyof P
    ? P[K] extends undefined ? T[K]
    : P[K] extends object ? T[K] extends object ? DeepPatch<T[K], P[K] & DeepPartial<T[K]>> : T[K]
    : P[K]
    : T[K];
};

// 30. Recursive: nested type-safe command bus
type CommandMap = Record<string, { input: any; output: any }>;
type CommandBus<M extends CommandMap> = {
  dispatch<K extends keyof M>(cmd: K, input: M[K]["input"]): Promise<M[K]["output"]>;
};
type AppCommands = {
  createUser: { input: { name: string }; output: { id: string } };
  deleteUser: { input: { id: string  }; output: void };
};
type AppBus = CommandBus<AppCommands>;

// 31. Recursive: nested tagged union narrowing helper
type Extract2<T, Tag extends string> = T extends { _tag: Tag } ? T : never;
type Tagged =
  | { _tag: "A"; valA: string }
  | { _tag: "B"; valB: number }
  | { _tag: "C"; valC: boolean };
type OnlyA = Extract2<Tagged, "A">; // { _tag: "A"; valA: string }

// 32. Recursive: strongly typed middleware stack type
type MiddlewareStack<Ctx, Fns extends readonly ((ctx: Ctx, next: () => Promise<void>) => Promise<void>)[]> = {
  use<F extends (ctx: Ctx, next: () => Promise<void>) => Promise<void>>(fn: F): MiddlewareStack<Ctx, [...Fns, F]>;
  run(ctx: Ctx): Promise<void>;
};

// 33. Recursive: typed observable chain
type Observable<T> = {
  subscribe(obs: (val: T) => void): () => void;
  map<U>(fn: (val: T) => U): Observable<U>;
  filter(pred: (val: T) => boolean): Observable<T>;
  flatMap<U>(fn: (val: T) => Observable<U>): Observable<U>;
};

// 34. Recursive: type-safe heterogeneous list
type HList<T extends any[]> =
  T extends [] ? { isEmpty: true } :
  T extends [infer H, ...infer Rest]
    ? { head: H; tail: HList<Rest>; isEmpty: false }
    : never;
type HL = HList<[string, number, boolean]>;
// { head: string; tail: { head: number; tail: { head: boolean; tail: { isEmpty: true }; ... }; ... }; ... }

// 35. Recursive: compute GCD via type-level subtraction
type GCD<A extends 0[], B extends 0[]> =
  B extends [] ? A["length"] :
  A["length"] extends B["length"] ? A["length"] :
  A["length"] extends 0 ? B["length"] :
  B["length"] extends 0 ? A["length"] :
  GCD<B, A["length"] extends infer AN extends number ? B["length"] extends infer BN extends number ? [] : B : B>;

// 36. Recursive: type-level church numerals (simplified)
type Zero  = { prev: never; isZero: true };
type Succ<N> = { prev: N; isZero: false };
type One   = Succ<Zero>;
type Two   = Succ<One>;
type Three = Succ<Two>;

// 37. Recursive: nested error hierarchy
type AppError =
  | { code: "AUTH_ERROR"; sub: "INVALID_TOKEN" | "EXPIRED_TOKEN" }
  | { code: "DB_ERROR";   sub: "CONN_FAILED"  | "QUERY_FAILED" }
  | { code: "NET_ERROR";  sub: "TIMEOUT"       | "DNS_FAILURE" };
type ErrorSub<Code extends AppError["code"]> = Extract<AppError, { code: Code }>["sub"];
type AuthSubs = ErrorSub<"AUTH_ERROR">; // "INVALID_TOKEN" | "EXPIRED_TOKEN"

// 38. Recursive: builder with cumulative type narrowing
type Builder<Acc extends Record<string, any> = {}> = {
  set<K extends string, V>(key: K, val: V): Builder<Acc & { [P in K]: V }>;
  build(): Acc;
};

// 39. Recursive: typed dependency graph (DAG)
type DAG<Nodes extends string> = {
  [N in Nodes]: Exclude<Nodes, N>[];
};
type MyDAG = DAG<"a" | "b" | "c" | "d">;
// { a: ("b"|"c"|"d")[]; b: ("a"|"c"|"d")[]; ... }

// 40. Recursive: deep required + readonly combination
type StrictImmutable<T> = {
  readonly [K in keyof T]-?: T[K] extends object ? StrictImmutable<T[K]> : T[K];
};

// 41. Recursive: nested function composition type
type Pipe<Fns extends readonly ((...args: any[]) => any)[]> =
  Fns extends readonly [(...args: infer A) => infer R]
    ? (...args: A) => R
    : Fns extends readonly [(...args: infer A) => any, ...infer Rest extends readonly ((...args: any[]) => any)[]]
    ? (...args: A) => ReturnType<Pipe<Rest>>
    : never;

// 42. Recursive: typed RPC with nested namespaces
type RPCService = {
  users: {
    get: (id: string) => Promise<{ name: string }>;
    list: () => Promise<{ name: string }[]>;
  };
  auth: {
    login: (creds: { email: string; password: string }) => Promise<{ token: string }>;
  };
};
type RPCClient2<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? T[K]
    : T[K] extends object ? RPCClient2<T[K]> : never;
};

// 43. Recursive: strongly typed object lens system
type GetLens<T, K extends keyof T> = { get: (t: T) => T[K]; set: (v: T[K], t: T) => T };
type Focus<T, Path extends any[]> =
  Path extends [infer K extends keyof T]
    ? GetLens<T, K>
    : Path extends [infer K extends keyof T, ...infer Rest]
    ? GetLens<T[K], Rest extends any[] ? Rest[0] : never>
    : never;

// 44. Recursive: type-level arithmetic (Peano + infix)
type Nat = 0[];
type Inc<N extends Nat> = [...N, 0];
type Dec<N extends Nat> = N extends [0, ...infer R extends 0[]] ? R : never;
type Add<A extends Nat, B extends Nat> = [...A, ...B];
type Mul<A extends Nat, B extends Nat, Acc extends Nat = []> =
  A extends [] ? Acc : Mul<Dec<A>, B, Add<Acc, B>>;
type Three2 = [0, 0, 0];
type Nine2  = Mul<Three2, Three2>; // length = 9

// 45. Recursive: type-safe event sourcing with replay
type Aggregate<State, Events extends { type: string; payload: any }[]> = {
  state: State;
  apply<E extends Events[number]>(event: E): Aggregate<State, Events>;
};

// 46. Recursive: deeply nested test assertion types
type DeepEqual<A, B> =
  A extends B
    ? B extends A
      ? A extends object
        ? { [K in keyof A]: DeepEqual<A[K], B[K extends keyof B ? K : never]> }[keyof A] extends true ? true : false
        : true
      : false
    : false;

// 47. Recursive: exhaustive pattern match type
type Match<T, Patterns extends { [K in Extract<T, { kind: string }>["kind"]]?: any }> = {
  [K in keyof Patterns]: Patterns[K] extends (x: Extract<T, { kind: K }>) => infer R ? R : never;
}[keyof Patterns];

// 48. Recursive: covariant functor type
interface Functor<F extends <T>(x: T) => any> {
  map<A, B>(fa: ReturnType<F>, f: (a: A) => B): ReturnType<F>;
}

// 49. Recursive: type-safe tree zipper (context + focus)
type TreeZipper<T> = {
  focus: NTree<T>;
  path: Array<{ left: NTree<T>[]; right: NTree<T>[]; parent: T }>;
};

// 50. Recursive: complete typed ORM relation map
type Model<T extends Record<string, any>> = { fields: T };
type HasMany<M extends Model<any>>   = { type: "hasMany";   model: M };
type BelongsTo<M extends Model<any>> = { type: "belongsTo"; model: M };
type Relation = HasMany<any> | BelongsTo<any>;
type ORM<Models extends Record<string, Model<any>>> = {
  [K in keyof Models]: {
    model: Models[K];
    relations: { [R in string]?: Relation };
    find(id: string): Promise<Models[K]["fields"] | null>;
    save(data: Models[K]["fields"]): Promise<Models[K]["fields"]>;
  };
};
