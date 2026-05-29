export {};

// ── Advanced Mapped Type Examples ────────────────────────────────────────────

// 1. ReadonlyKeys detection via StrictEqual trick
type StrictEqual<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type ReadonlyKeys<T> = {
  [K in keyof T]-?: StrictEqual<
    { [Q in K]: T[K] },
    { -readonly [Q in K]: T[K] }
  > extends true ? never : K;
}[keyof T];
type User = { readonly id: string; name: string; readonly email: string };
type RK = ReadonlyKeys<User>; // "id" | "email"

// 2. OptionalKeys and RequiredKeys detection
type OptionalKeys<T> = { [K in keyof T]-?: {} extends Pick<T, K> ? K : never }[keyof T];
type RequiredKeys<T> = { [K in keyof T]-?: {} extends Pick<T, K> ? never : K }[keyof T];
type Form = { name: string; email?: string; age?: number };
type RF = RequiredKeys<Form>; // "name"
type OF = OptionalKeys<Form>; // "email" | "age"

// 3. Mapped type via symbol keys (type-safe)
type SymbolKeys<T> = { [K in keyof T as K extends symbol ? K : never]: T[K] };

// 4. Mapped type: invert a Record
type InvertRecord<T extends Record<string, string>> = {
  [V in T[keyof T]]: { [K in keyof T]: T[K] extends V ? K : never }[keyof T];
};
const statusMap = { active: "ACTIVE", inactive: "INACTIVE", pending: "PENDING" } as const;
type InvertedStatus = InvertRecord<typeof statusMap>;
// { ACTIVE: "active"; INACTIVE: "inactive"; PENDING: "pending" }

// 5. Mapped type: compose multiple mappers
type ComposeMapped<T, Mappers extends ((obj: any) => any)[]> =
  Mappers extends [] ? T :
  Mappers extends [(v: T) => infer R, ...infer Rest extends ((obj: any) => any)[]]
    ? ComposeMapped<R, Rest>
    : T;

// 6. Mapped type: type-safe reduce
type ReduceMapped<T, Keys extends (keyof T)[], Acc = {}> =
  Keys extends [infer K extends keyof T, ...infer Rest extends (keyof T)[]]
    ? ReduceMapped<T, Rest, Acc & Pick<T, K>>
    : Acc;
type Reduced = ReduceMapped<User, ["id", "name"]>; // { id: string } & { name: string }

// 7. Mapped type: deep flattening key paths to object
type DeepFlat<T, Prefix extends string = ""> = T extends object
  ? { [K in keyof T & string]:
      T[K] extends object
        ? DeepFlat<T[K], `${Prefix}${K}.`>
        : { [P in `${Prefix}${K}`]: T[K] }
    }[keyof T & string]
  : never;
type FlatConfig = DeepFlat<{ db: { host: string; port: number }; debug: boolean }>;
// { "db.host": string } & { "db.port": number } & { "debug": boolean }

// 8. Mapped type: key type narrowing via as-clause with infer
type ExtractedKeys<T, Prefix extends string> = {
  [K in keyof T as K extends `${Prefix}${infer Rest}` ? Rest : never]: T[K];
};
type EventProps = { onClick: () => void; onFocus: () => void; label: string };
type Events2 = ExtractedKeys<EventProps, "on">; // { Click: () => void; Focus: () => void }

// 9. Mapped type: conditional modifier removal
type UnwrapOptional<T> = {
  [K in keyof T]-?: NonNullable<T[K]>;
};
type NullableForm = { name?: string | null; age?: number | null };
type CleanForm = UnwrapOptional<NullableForm>; // { name: string; age: number }

// 10. Mapped type: discriminated union builder
type EventUnion<Events extends Record<string, object>> = {
  [K in keyof Events]: { type: K } & Events[K];
}[keyof Events];
type AppEvents = EventUnion<{
  login:   { userId: string };
  logout:  { reason: string };
  update:  { field: string; value: unknown };
}>;
// { type: "login"; userId: string } | { type: "logout"; reason: string } | { type: "update"; ... }

// 11. Mapped type: enforce complete enum coverage
type ExhaustiveCoverage<T extends string, V> = { [K in T]: V };
type LoadingState = "idle" | "loading" | "success" | "error";
const stateConfig: ExhaustiveCoverage<LoadingState, { label: string; color: string }> = {
  idle:    { label: "Idle",    color: "gray"   },
  loading: { label: "Loading", color: "blue"   },
  success: { label: "Done",    color: "green"  },
  error:   { label: "Error",   color: "red"    },
};

// 12. Mapped type: merge multiple interfaces
type Spread2<T extends object[]> =
  T extends [infer A extends object, ...infer Rest extends object[]]
    ? Omit<A, keyof Spread2<Rest>> & Spread2<Rest>
    : {};
type S2 = Spread2<[{ a: string }, { b: number }, { a: boolean }]>;
// { b: number } & { a: boolean }  (last wins)

// 13. Mapped type for type-safe builder with phantom types
declare const _stage: unique symbol;
type Stage = "empty" | "named" | "configured" | "built";
type TypedBuilder<T, S extends Stage> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: (v: T[K]) => TypedBuilder<T, "named">;
} & (S extends "built" ? { result: T } : {
  build: S extends "named" ? () => T : never;
});

// 14. Mapped type: tag union members
type TaggedUnion<T extends Record<string, object>> = {
  [K in keyof T]: T[K] & { readonly _type: K };
}[keyof T];
type TaggedShape = TaggedUnion<{
  circle: { radius: number };
  square: { side: number };
}>;
// ({ radius: number } & { readonly _type: "circle" }) | ({ side: number } & { readonly _type: "square" })

// 15. Mapped type: bi-directional key mapping
type BiMap<T extends Record<string, string>> = T & InvertRecord<T>;
const colorEnum = { red: "RED", green: "GREEN" } as const;
type ColorBiMap = BiMap<typeof colorEnum>;
// { red: "RED"; green: "GREEN"; RED: "red"; GREEN: "green" }

// 16. Mapped type: type-safe lens
type Lens<T> = {
  [K in keyof T]: {
    get: (obj: T) => T[K];
    set: (obj: T, val: T[K]) => T;
    compose<K2 extends keyof T[K]>(inner: Lens<T[K]>[K2]): Lens<T>[K];
  };
};

// 17. Mapped type: derive action creator types
type ActionCreator<T extends Record<string, any>> = {
  [K in keyof T]: (payload: T[K]) => { type: K; payload: T[K] };
};
const actions3 = {} as ActionCreator<{ increment: number; decrement: number; reset: void }>;

// 18. Mapped type: deep transform using recursion
type Transform<T, From, To> =
  T extends From ? To :
  T extends (infer U)[] ? Transform<U, From, To>[] :
  T extends object ? { [K in keyof T]: Transform<T[K], From, To> } :
  T;
type DateToStr<T> = Transform<T, Date, string>;
type ModelSerialized = DateToStr<{ id: string; created: Date; tags: Date[] }>;

// 19. Mapped type: decorator factory types
type ClassDecorator2<T extends object> = (target: new (...args: any[]) => T) => new (...args: any[]) => T;
type MethodDecorator2<T> = (
  target: object,
  key: string,
  descriptor: TypedPropertyDescriptor<T>
) => TypedPropertyDescriptor<T> | void;

// 20. Mapped type: typed FormData builder
type FormDataShape<T extends Record<string, string | Blob>> = {
  [K in keyof T]: T[K];
};
type UserFormData = FormDataShape<{ name: string; avatar: Blob }>;
function buildFormData<T extends Record<string, string | Blob>>(data: FormDataShape<T>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.append(k, v);
  return fd;
}

// 21. Mapped type: access control via readonly overlay
type ReadAccess<T> = { readonly [K in keyof T]: T[K] };
type WriteAccess<T> = { [K in keyof T]: T[K] };
type OwnerAccess<T> = WriteAccess<T> & { delete: () => void };
type GuestAccess<T> = ReadAccess<Omit<T, "password" | "token">>;

// 22. Mapped type: API response normalization pipeline
type Pipeline<T, Fns extends ((v: any) => any)[]> =
  Fns extends [(v: T) => infer R, ...infer Rest extends ((v: any) => any)[]]
    ? Pipeline<R, Rest>
    : T;

// 23. Mapped type: typed event delegation
type DelegateEvents<T extends Record<string, any[]>> = {
  [K in keyof T]: {
    on: (handler: (...args: T[K]) => void) => () => void;
    once: (handler: (...args: T[K]) => void) => void;
    emit: (...args: T[K]) => void;
  };
};

// 24. Mapped type: deep merge utility
type DeepMerge<T, U> = {
  [K in keyof T | keyof U]:
    K extends keyof T & keyof U
      ? T[K] extends object ? U[K] extends object ? DeepMerge<T[K], U[K]> : U[K] : U[K]
      : K extends keyof T ? T[K]
      : K extends keyof U ? U[K]
      : never;
};

// 25. Mapped type: type-safe query builder result
type QueryResult<T, Select extends keyof T> = Select extends never ? T : Pick<T, Select>;

// 26. Mapped type: HOF parameter extraction
type HOFParams<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => (...args: any[]) => any ? A : never;
};

// 27. Mapped type: value encoding to string
type Encode<T> = {
  [K in keyof T]: T[K] extends string  ? `str:${T[K]}` :
                  T[K] extends number  ? `num:${T[K] & number}` :
                  T[K] extends boolean ? `bool:${T[K] & boolean}` :
                  never;
};
type Encoded = Encode<{ name: "Alice"; age: 30; active: true }>;
// { name: "str:Alice"; age: "num:30"; active: "bool:true" }

// 28. Mapped type: class prototype extraction
type ProtoOf<T extends abstract new (...args: any[]) => any> = InstanceType<T>;
type StaticOf<T> = Omit<T, "prototype">;

// 29. Mapped type: exhaustive pattern match
type Match<T extends string, Cases extends Record<T, any>> = {
  [K in T]: Cases[K];
}[T];
type ColorResult = Match<"red" | "green" | "blue", { red: "#f00"; green: "#0f0"; blue: "#00f" }>;
// "#f00" | "#0f0" | "#00f"

// 30. Mapped type: deep brand injection
declare const _brand: unique symbol;
type BrandAll<T, B extends string> = {
  [K in keyof T]: T[K] & { readonly [_brand]: B };
};

// 31. Mapped type: graph node type system
type NodeMap<T extends Record<string, object>> = {
  [K in keyof T]: {
    data: T[K];
    edges: (keyof T)[];
    label: K;
  };
};
type MyGraph = NodeMap<{ A: { x: number }; B: { y: string }; C: { z: boolean } }>;

// 32. Mapped type: create index signature from union
type UnionIndex<U extends string, V> = { [K in U]: V };
type Colors2 = UnionIndex<"red" | "green" | "blue", string>;

// 33. Mapped type: HKT application table
type HKTApply<F extends { _: unknown }, A> = (F & { _: A })["_"];
interface ListHKT { _: unknown; type: this["_"][] }
interface MaybeHKT { _: unknown; type: this["_"] | null }
// Mapped over a union of HKT
type MapHKT<F extends { _: unknown }, Types extends string> = {
  [K in Types]: HKTApply<F, K>;
};

// 34. Mapped type: co-product (variant) type
type Variant<T extends Record<string, object>> = {
  [K in keyof T]: { readonly tag: K } & T[K];
}[keyof T];
type Action2 = Variant<{
  increment: { amount: number };
  decrement: { amount: number };
  reset: {};
}>;

// 35. Mapped type: typed Redux-like store
type StoreSlice<State, Actions extends Record<string, (s: State, payload?: any) => State>> = {
  state: State;
  dispatch: <K extends keyof Actions>(action: K, payload?: Parameters<Actions[K]>[1]) => void;
  select: <T>(selector: (s: State) => T) => T;
};

// 36. Mapped type: Intersect all values of T
type IntersectValues<T> = { [K in keyof T]: (x: T[K]) => void }[keyof T] extends (x: infer I) => void ? I : never;
type IV = IntersectValues<{ a: { x: number }; b: { y: string } }>; // { x: number } & { y: string }

// 37. Mapped type with conditional key remap + value
type RenameAndTransform<T, From extends string, To extends string, V> = {
  [K in keyof T as K extends From ? To : K]: K extends From ? V : T[K];
};
type Renamed = RenameAndTransform<{ id: string; name: string }, "id", "userId", number>;
// { userId: number; name: string }

// 38. Mapped type: access path setter
type SetPath<T, P extends string, V> =
  P extends `${infer K}.${infer Rest}`
    ? K extends keyof T
      ? { [Q in keyof T]: Q extends K ? SetPath<T[Q], Rest, V> : T[Q] }
      : T
    : P extends keyof T
    ? { [Q in keyof T]: Q extends P ? V : T[Q] }
    : T;
type Config2 = { db: { host: string; port: number } };
type Updated2 = SetPath<Config2, "db.port", 5432>; // { db: { host: string; port: 5432 } }

// 39. Mapped type: generate API types from spec
type APISpec<Spec extends Record<string, { method: string; body?: object; response: object }>> = {
  [K in keyof Spec]: {
    request: Spec[K]["method"] extends "GET"
      ? { method: "GET" }
      : { method: Spec[K]["method"]; body: Spec[K]["body"] };
    response: Spec[K]["response"];
  };
};

// 40. Mapped type: co-locate type and runtime
type TypedRecord<T extends Record<string, { value: unknown; type: string }>> = {
  [K in keyof T]: T[K]["value"];
};

// 41. Mapped type: track which keys were set in builder
type BuilderState<T, Set extends keyof T = never> = {
  [K in keyof T as K extends Set ? K : never]: T[K];
} & {
  set<K extends Exclude<keyof T, Set>>(key: K, val: T[K]): BuilderState<T, Set | K>;
  build: Set extends keyof T ? () => T : never;
};

// 42. Mapped type: type-safe patch with history
type Patchable<T> = T & {
  $history: Partial<T>[];
  $patch(updates: Partial<T>): Patchable<T>;
  $undo(): Patchable<T>;
};

// 43. Mapped type: generate test matrix
type TestMatrix<Inputs extends string, Scenarios extends string> = {
  [I in Inputs]: { [S in Scenarios]: boolean };
};
type Tests = TestMatrix<"add" | "remove", "empty" | "single" | "many">;

// 44. Mapped type: co-recursive type-level encoding
type Encode2<T> =
  T extends string  ? { kind: "str"; val: T } :
  T extends number  ? { kind: "num"; val: T } :
  T extends boolean ? { kind: "bool"; val: T } :
  T extends (infer U)[] ? { kind: "arr"; val: Encode2<U>[] } :
  T extends object ? { kind: "obj"; val: { [K in keyof T]: Encode2<T[K]> } } :
  never;
type Enc = Encode2<{ name: string; ages: number[] }>;

// 45. Mapped type: typed diff
type DiffMap<Old, New> = {
  [K in keyof Old | keyof New]:
    K extends keyof Old & keyof New
      ? StrictEqual<Old[K & keyof Old], New[K & keyof New]> extends true
        ? { status: "unchanged"; value: Old[K & keyof Old] }
        : { status: "changed"; before: Old[K & keyof Old]; after: New[K & keyof New] }
      : K extends keyof New
      ? { status: "added"; value: New[K & keyof New] }
      : { status: "removed"; value: Old[K & keyof Old] };
};

// 46. Mapped type: enforce schema completeness at compile time
type Validated<Schema extends Record<string, "string" | "number" | "boolean">, Data> = {
  [K in keyof Schema]: K extends keyof Data
    ? Data[K] extends (Schema[K] extends "string" ? string : Schema[K] extends "number" ? number : boolean)
      ? Data[K]
      : never
    : never;
};

// 47. Mapped type: key-value pair union from object
type Entries2<T> = { [K in keyof T]: [K, T[K]] }[keyof T];
type UserEntries = Entries2<{ id: string; name: string; age: number }>;
// ["id", string] | ["name", string] | ["age", number]

// 48. Mapped type: produce class-like interface
type ClassLike<T extends object> = {
  new (...args: any[]): T;
  prototype: T;
} & { [K in keyof T as T[K] extends Function ? K : never]: T[K] };

// 49. Mapped type: event sourcing projection types
type Projection<Events extends Record<string, object>, State> = {
  [K in keyof Events]: (state: State, event: Events[K]) => State;
};
type CounterEvents = { increment: { by: number }; decrement: { by: number }; reset: {} };
type CounterProjection = Projection<CounterEvents, number>;

// 50. Mapped type: complete type-safe configuration schema
type SchemaDefinition<T extends object> = {
  [K in keyof T]: {
    type: T[K] extends string ? "string" : T[K] extends number ? "number" : T[K] extends boolean ? "boolean" : "object";
    required: undefined extends T[K] ? false : true;
    default?: T[K];
    validate?: (v: T[K]) => boolean;
    description?: string;
  };
};
type AppConfigSchema = SchemaDefinition<{ host: string; port: number; debug?: boolean }>;
const schema: AppConfigSchema = {
  host:  { type: "string",  required: true,  description: "Server hostname" },
  port:  { type: "number",  required: true,  validate: (v) => v > 0 && v < 65536 },
  debug: { type: "boolean", required: false, default: false },
};
