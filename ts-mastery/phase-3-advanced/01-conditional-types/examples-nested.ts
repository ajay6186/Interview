export {};

// ── Nested Conditional Type Examples ────────────────────────────────────────

// 1. Multi-level conditional chain
type TypeName<T> =
  T extends string     ? "string" :
  T extends number     ? "number" :
  T extends boolean    ? "boolean" :
  T extends null       ? "null" :
  T extends undefined  ? "undefined" :
  T extends any[]      ? "array" :
  T extends Function   ? "function" :
  "object";
type TN1 = TypeName<string>;      // "string"
type TN2 = TypeName<number[]>;    // "array"
type TN3 = TypeName<() => void>;  // "function"

// 2. Nested conditional type: deep optional chain
type DeepOptional<T> =
  T extends null | undefined ? T :
  T extends (infer U)[] ? DeepOptional<U>[] :
  T extends object ? { [K in keyof T]?: DeepOptional<T[K]> } :
  T;

// 3. Two-level distributive conditional
type Cartesian<A, B> = A extends any ? B extends any ? [A, B] : never : never;
type Cart = Cartesian<"x" | "y", 1 | 2>;
// ["x", 1] | ["x", 2] | ["y", 1] | ["y", 2]

// 4. Nested infer: extract Promise<Array<T>>
type UnpackArray<T> = T extends (infer U)[] ? U : T;
type UnpackPromise<T> = T extends Promise<infer U> ? U : T;
type UnpackBoth<T> = UnpackArray<UnpackPromise<T>>;
type UB = UnpackBoth<Promise<string[]>>; // string

// 5. Three-level infer: method → return → unwrap
type MethodUnpacked<T, K extends keyof T> =
  T[K] extends (...args: any[]) => infer R
    ? R extends Promise<infer U>
      ? U extends (infer E)[]
        ? E
        : U
      : R
    : never;
class DataService2 {
  async list(): Promise<{ id: string }[]> { return []; }
}
type Item = MethodUnpacked<DataService2, "list">; // { id: string }

// 6. Recursive conditional: depth-limited flatten
type Flatten4<T, Depth extends number = 5> =
  Depth extends 0 ? T :
  T extends (infer U)[] ? Flatten4<U, [never, 0, 1, 2, 3, 4][Depth]> : T;
type F4 = Flatten4<number[][][]>; // number

// 7. Nested conditional to detect object vs primitive
type IsDeepObject<T> =
  T extends null | undefined | string | number | boolean | symbol | bigint
    ? false
    : T extends object
    ? true
    : false;
type IDO1 = IsDeepObject<{ x: 1 }>; // true
type IDO2 = IsDeepObject<string>;    // false

// 8. Conditional type at two union levels
type FlatUnion<T> = T extends T ? (T extends any[] ? T[number] : T) : never;
type FU = FlatUnion<string[] | "a" | number>; // string | "a" | number

// 9. Nested conditional for typed event handler
type EventPayload<E extends string> =
  E extends "click"   ? { x: number; y: number } :
  E extends "keydown" ? { key: string; code: string } :
  E extends "resize"  ? { width: number; height: number } :
  never;
type Handler<E extends string> = (payload: EventPayload<E>) => void;
const clickHandler: Handler<"click"> = (p) => console.log(p.x, p.y);

// 10. Conditional chain for JSON schema infer
type JSONType =
  | { type: "string" }
  | { type: "number" }
  | { type: "boolean" }
  | { type: "null" }
  | { type: "array"; items: JSONType }
  | { type: "object"; properties: Record<string, JSONType> };
type InferJSON<S extends JSONType> =
  S extends { type: "string" }  ? string  :
  S extends { type: "number" }  ? number  :
  S extends { type: "boolean" } ? boolean :
  S extends { type: "null" }    ? null    :
  S extends { type: "array"; items: infer I extends JSONType } ? InferJSON<I>[] :
  S extends { type: "object"; properties: infer P extends Record<string, JSONType> }
    ? { [K in keyof P]: InferJSON<P[K]> }
  : never;
type PersonSchema = InferJSON<{
  type: "object";
  properties: {
    name: { type: "string" };
    age:  { type: "number" };
  };
}>;
// { name: string; age: number }

// 11. Nested conditional type for API response normalizer
type Normalize<T> =
  T extends null | undefined ? null :
  T extends Date ? string :
  T extends (infer U)[] ? Normalize<U>[] :
  T extends object ? { [K in keyof T]: Normalize<T[K]> } :
  T;
type NormalizedUser = Normalize<{
  id: string;
  createdAt: Date;
  tags: string[];
  meta: { active: boolean; lastSeen: Date };
}>;

// 12. Two-step infer: extract method param types
type MethodParams<T, K extends keyof T> =
  T[K] extends (...args: infer P) => any ? P : never;
class UserService {
  create(name: string, email: string): void {}
  find(id: string): { name: string } { return { name: "" }; }
}
type CreateParams = MethodParams<UserService, "create">; // [string, string]

// 13. Conditional chained with `infer` for result wrapping
type SafeResult<T> =
  T extends (...args: infer A) => infer R
    ? R extends Promise<infer U>
      ? (...args: A) => Promise<{ ok: true; data: U } | { ok: false; error: string }>
      : (...args: A) => { ok: true; data: R } | { ok: false; error: string }
    : never;

// 14. Deep conditional flattening of nested unions
type FlattenUnion<T> =
  T extends (infer U)[]
    ? FlattenUnion<U>
    : T extends object
    ? { [K in keyof T]: FlattenUnion<T[K]> }
    : T;

// 15. Recursive conditional: merge nested objects
type DeepMerge<T, U> = {
  [K in keyof T | keyof U]:
    K extends keyof T & keyof U
      ? T[K] extends object ? U[K] extends object ? DeepMerge<T[K], U[K]> : U[K] : U[K]
      : K extends keyof T ? T[K]
      : K extends keyof U ? U[K]
      : never;
};

// 16. Conditional for recursive type traversal
type VisitNodes<T, Visitor> =
  T extends null | undefined | string | number | boolean ? Visitor :
  T extends (infer U)[] ? VisitNodes<U, Visitor>[] :
  T extends object ? { [K in keyof T]: VisitNodes<T[K], Visitor> } :
  never;

// 17. Multi-level infer for object key + value extraction
type InferPairs<T> = T extends Record<infer K extends string, infer V>
  ? { key: K; value: V }
  : never;
type IP = InferPairs<{ a: 1; b: 2 }>; // { key: "a" | "b"; value: 1 | 2 }

// 18. Conditional with nested template literal
type Prefix<P extends string, T extends string> = T extends `${P}${infer Rest}` ? Rest : never;
type Strip = Prefix<"on", "onClick" | "onFocus" | "label">;
// "Click" | "Focus"

// 19. Two-level extract from discriminated union
type AnyResult<T> = { status: "ok"; data: T } | { status: "err"; msg: string };
type OkData<R> = R extends { status: "ok"; data: infer D } ? D : never;
type ErrMsg<R> = R extends { status: "err"; msg: infer M } ? M : never;
type AOD = OkData<AnyResult<string>>; // string
type AEM = ErrMsg<AnyResult<string>>; // string

// 20. Recursive conditional object key paths type
type ObjectPaths<T, Prefix extends string = ""> = {
  [K in keyof T & string]:
    T[K] extends object
      ? ObjectPaths<T[K], `${Prefix}${K}.`> | `${Prefix}${K}`
      : `${Prefix}${K}`;
}[keyof T & string];
type AppConfig = { db: { host: string; port: number }; app: { debug: boolean } };
type ConfigPath = ObjectPaths<AppConfig>;
// "db" | "db.host" | "db.port" | "app" | "app.debug"

// 21. Conditional with infer for tuple decomposition
type ZipTuple<A extends any[], B extends any[]> =
  A extends [infer AH, ...infer AR]
    ? B extends [infer BH, ...infer BR]
      ? [[AH, BH], ...ZipTuple<AR, BR>]
      : []
    : [];
type ZT = ZipTuple<[string, number], [boolean, null]>; // [[string, boolean], [number, null]]

// 22. Nested conditional for HKT-like type
type Apply<F extends { _type: unknown }, A> =
  F extends { _type: "Array" } ? A[] :
  F extends { _type: "Promise" } ? Promise<A> :
  F extends { _type: "Option" } ? A | null :
  never;
type ArrStr = Apply<{ _type: "Array" }, string>;    // string[]
type ProNum = Apply<{ _type: "Promise" }, number>;   // Promise<number>

// 23. Two-level conditional: check both outer and inner type
type IsNestedArray<T> = T extends (infer U)[] ? (U extends any[] ? true : false) : false;
type INA1 = IsNestedArray<number[][]>; // true
type INA2 = IsNestedArray<number[]>;  // false

// 24. Conditional for strict JSON-compatible check
type Jsonable<T> =
  T extends string | number | boolean | null ? T :
  T extends undefined | Function | symbol | bigint ? never :
  T extends (infer U)[] ? Jsonable<U>[] :
  T extends object ? { [K in keyof T]: Jsonable<T[K]> } :
  never;
type JE = Jsonable<{ name: string; fn: Function }>; // { name: string; fn: never }

// 25. Three-level nested infer
type UnpackThree<T> =
  T extends Promise<infer U>
    ? U extends (infer V)[]
      ? V extends { value: infer W }
        ? W
        : V
      : U
    : T;
type UT = UnpackThree<Promise<Array<{ value: string }>>>; // string

// 26. Conditional type for class hierarchy check
type IsSubclass<Child, Parent> =
  Child extends new (...args: any[]) => infer CI
    ? Parent extends new (...args: any[]) => infer PI
      ? CI extends PI ? true : false
      : false
    : false;
class Animal3 {}
class Dog4 extends Animal3 {}
class Cat2 extends Animal3 {}
type DogCheck = IsSubclass<typeof Dog4, typeof Animal3>; // true

// 27. Nested conditional for GraphQL-like type system
type GQLType =
  | { kind: "scalar"; name: "String" | "Int" | "Boolean" }
  | { kind: "object"; fields: Record<string, GQLType> }
  | { kind: "list"; of: GQLType }
  | { kind: "nullable"; of: GQLType };
type InferGQL<T extends GQLType> =
  T extends { kind: "scalar"; name: "String" }  ? string :
  T extends { kind: "scalar"; name: "Int" }     ? number :
  T extends { kind: "scalar"; name: "Boolean" } ? boolean :
  T extends { kind: "list"; of: infer I extends GQLType }     ? InferGQL<I>[] :
  T extends { kind: "nullable"; of: infer I extends GQLType } ? InferGQL<I> | null :
  T extends { kind: "object"; fields: infer F extends Record<string, GQLType> }
    ? { [K in keyof F]: InferGQL<F[K]> }
  : never;

// 28. Conditional for exhaustive union type check
type UnionMembersCount<T, Acc extends any[] = []> =
  [T] extends [never] ? Acc["length"] :
  T extends any ? UnionMembersCount<Exclude<T, T>, [...Acc, T]> :
  never;
type Count = UnionMembersCount<"a" | "b" | "c">; // 3

// 29. Multi-step conditional inference for ORM
type SelectReturn<T, F extends (keyof T)[] | undefined> =
  F extends (keyof T)[]
    ? Pick<T, F[number]>
    : T;
type UserModel = { id: string; name: string; email: string; password: string };
type SelectId   = SelectReturn<UserModel, ["id", "name"]>; // { id: string; name: string }
type SelectAll2 = SelectReturn<UserModel, undefined>;       // UserModel

// 30. Conditional type for ADT transformer
type Transform<T> =
  T extends { _tag: "Some"; value: infer V }
    ? { _tag: "Some"; value: V[] }
    : T extends { _tag: "None" }
    ? { _tag: "None" }
    : never;
type Some2<A> = { _tag: "Some"; value: A };
type None2 = { _tag: "None" };
type Trans = Transform<Some2<string>>; // { _tag: "Some"; value: string[] }

// 31. Conditional for nested option type
type Lift<T> = T extends null | undefined ? None2 : Some2<T>;
type LiftResult = Lift<string>; // Some2<string>
type LiftNone   = Lift<null>;   // None2

// 32. Nested conditional for property type annotation
type AnnotateTypes<T> = {
  [K in keyof T]: {
    value: T[K];
    type: TypeName<T[K]>;
    nullable: null extends T[K] ? true : false;
  };
};

// 33. Conditional for recursive identity check
type SameShape<A, B> =
  [A] extends [B]
    ? [B] extends [A]
      ? true
      : false
    : false;
type SS1 = SameShape<{ x: number }, { x: number }>; // true
type SS2 = SameShape<{ x: number }, { x: string }>; // false

// 34. Conditional chaining for Optional + NonNullable result
type ChainedConditional<T> =
  T extends null | undefined ? "null-ish" :
  T extends string ? `string:${T}` :
  T extends number ? `number:${T}` :
  "other";
type CC1 = ChainedConditional<null>;    // "null-ish"
type CC2 = ChainedConditional<"abc">;   // "string:abc"
type CC3 = ChainedConditional<42>;      // "number:42"
type CC4 = ChainedConditional<boolean>; // "other"

// 35. Nested conditional with infer and template literal
type EventName2<T extends string> = T extends `on${infer Rest}` ? Rest : never;
type EventNames = EventName2<"onClick" | "onFocus" | "onBlur" | "submit">;
// "Click" | "Focus" | "Blur"

// 36. Deep conditional array filtering
type DeepFilter<T extends any[], F> =
  T extends [infer H, ...infer R]
    ? H extends F
      ? [H, ...DeepFilter<R, F>]
      : DeepFilter<R, F>
    : [];
type DF = DeepFilter<[string, number, string, boolean, string], string>; // [string, string, string]

// 37. Conditional for type equality in generic
type IfEquals<X, Y, T, F = never> =
  (<G>() => G extends X ? 1 : 2) extends (<G>() => G extends Y ? 1 : 2) ? T : F;
type ReadonlyPropKeys<T> = {
  [K in keyof T]-?: IfEquals<{ [Q in K]: T[K] }, { -readonly [Q in K]: T[K] }, never, K>;
}[keyof T];
type RO = ReadonlyPropKeys<{ readonly a: 1; b: 2 }>; // "a"

// 38. Conditional for API error discriminant
type ApiError<Code extends number> =
  Code extends 400 ? { kind: "bad_request"; fields: string[] } :
  Code extends 401 ? { kind: "unauthorized" } :
  Code extends 403 ? { kind: "forbidden"; resource: string } :
  Code extends 404 ? { kind: "not_found"; resource: string } :
  Code extends 500 ? { kind: "server_error"; message: string } :
  { kind: "unknown"; code: Code };
type E400 = ApiError<400>; // { kind: "bad_request"; fields: string[] }
type E401 = ApiError<401>; // { kind: "unauthorized" }

// 39. Conditional type for dependency graph
type Requires<A extends string, B extends string> = { name: A; requires: B[] };
type IsCompatible<A extends Requires<string, string>, B extends Requires<string, string>> =
  A["requires"] extends B["name"][] ? true : false;

// 40. Triple nested conditional for schema traversal
type SchemaToTs<T> =
  T extends { type: "string" }  ? string :
  T extends { type: "number" }  ? number :
  T extends { type: "boolean" } ? boolean :
  T extends { type: "array"; item: infer I } ? SchemaToTs<I>[] :
  T extends { type: "object"; props: Record<string, { type: string }> }
    ? { [K in keyof T["props" & {}]]: SchemaToTs<T["props" & {}][K]> }
  : unknown;

// 41. Conditional from tuple length
type LengthOf<T extends any[]> = T["length"];
type Len = LengthOf<[string, number, boolean]>; // 3

type IsSingletonTuple<T extends any[]> = T extends [any] ? true : false;
type IST1 = IsSingletonTuple<[string]>;        // true
type IST2 = IsSingletonTuple<[string, number]>; // false

// 42. Nested conditional for validator result
type ValidResult<T> = T extends null | undefined
  ? { valid: false; reason: "nullish" }
  : T extends string
  ? T extends "" ? { valid: false; reason: "empty" } : { valid: true; value: T }
  : { valid: false; reason: "unknown type" };
type VR1 = ValidResult<"hello">; // { valid: true; value: "hello" }
type VR2 = ValidResult<"">;      // { valid: false; reason: "empty" }

// 43. Conditional path extraction
type LeafPaths<T, K extends keyof T & string = keyof T & string> =
  T[K] extends object ? `${K}.${LeafPaths<T[K]>}` : K;
type LP = LeafPaths<{ db: { host: string; port: number }; debug: boolean }>;
// "db.host" | "db.port" | "debug"

// 44. Conditional for class factory return type
type ClassOf<T> = T extends new (...args: any[]) => infer I ? I : never;
type InstanceOf<T extends abstract new (...args: any[]) => any> = InstanceType<T>;
class Repo2<T> { constructor(public item: T) {} }
type RepoUser = ClassOf<typeof Repo2<string>>; // Repo2<string>

// 45. Conditional brand-based routing
declare const _kind: unique symbol;
type Route<K extends string> = { [_kind]: K; path: string };
type ApiRoute = Route<"api">;
type PublicRoute = Route<"public">;
type IsApiRoute<R> = R extends Route<"api"> ? true : false;
type IAR = IsApiRoute<ApiRoute>;    // true
type IPR = IsApiRoute<PublicRoute>; // false

// 46. Conditional type for tree shape inference
type Tree<T> =
  | { kind: "leaf"; value: T }
  | { kind: "branch"; left: Tree<T>; right: Tree<T> };
type TreeValueType<T extends Tree<any>> =
  T extends { kind: "leaf"; value: infer V } ? V :
  T extends { kind: "branch"; left: infer L extends Tree<any>; right: any } ? TreeValueType<L> :
  never;
type TVC = TreeValueType<Tree<number>>; // number

// 47. Deep conditional: all leaves equal type
type AllLeaves<T, V> =
  T extends object
    ? { [K in keyof T]: AllLeaves<T[K], V> }[keyof T] extends true ? true : false
    : T extends V ? true : false;

// 48. Conditional for strict object match
type ExactMatch<T, Expected> =
  keyof T extends keyof Expected
    ? keyof Expected extends keyof T
      ? true
      : false
    : false;
type EM1 = ExactMatch<{ a: 1; b: 2 }, { a: number; b: number }>; // true
type EM2 = ExactMatch<{ a: 1 }, { a: number; b: number }>;        // false

// 49. Conditional recursive tagged union transformer
type MapLeaves<T, To> =
  T extends { _tag: string }
    ? { [K in keyof T]: K extends "_tag" ? T[K] : MapLeaves<T[K], To> }
    : T extends object
    ? { [K in keyof T]: MapLeaves<T[K], To> }
    : To;

// 50. Conditional type for typed state transition
type Transition<S extends string, From extends S, To extends S> = {
  from: From;
  to: To;
  allowed: From extends To ? false : true;
};
type T1 = Transition<"idle" | "running" | "done", "idle", "running">; // { from: "idle"; to: "running"; allowed: true }
type T2 = Transition<"idle" | "running" | "done", "idle", "idle">;   // { from: "idle"; to: "idle"; allowed: false }
