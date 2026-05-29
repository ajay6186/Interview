export {};

// ── Nested Mapped Type Examples ──────────────────────────────────────────────

// 1. Deep mapped type: recursive Partial
type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;
type Config = { db: { host: string; port: number }; app: { debug: boolean; port: number } };
type PatchConfig = DeepPartial<Config>;
const patch: PatchConfig = { db: { host: "localhost" } };

// 2. Deep Readonly recursive
type DeepReadonly<T> =
  T extends (infer U)[] ? ReadonlyArray<DeepReadonly<U>> :
  T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } :
  T;
type FrozenConfig = DeepReadonly<Config>;

// 3. Deep Required recursive
type DeepRequired<T> = T extends object ? { [K in keyof T]-?: DeepRequired<T[K]> } : T;
type FullConfig = DeepRequired<Config>;

// 4. Deep mapped type: date serialization
type SerializeDates<T> =
  T extends Date ? string :
  T extends (infer U)[] ? SerializeDates<U>[] :
  T extends object ? { [K in keyof T]: SerializeDates<T[K]> } :
  T;
type ApiUser = SerializeDates<{ name: string; createdAt: Date; tags: Date[] }>;

// 5. Deep mapped type: nullify all leaves
type DeepNullable<T> =
  T extends (infer U)[] ? DeepNullable<U>[] :
  T extends object ? { [K in keyof T]: DeepNullable<T[K]> | null } :
  T | null;

// 6. Nested mapped type with keyof at depth 2
type FlattenTwo<T> = {
  [K1 in keyof T]: {
    [K2 in keyof T[K1]]: T[K1][K2];
  };
};
type FlatUser = FlattenTwo<{ profile: { name: string; age: number }; settings: { theme: string } }>;

// 7. Nested mapped type for path flattening
type DotPaths<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends object
    ? DotPaths<T[K], `${Prefix}${K}.`> | `${Prefix}${K}`
    : `${Prefix}${K}`;
}[keyof T & string];
type AppPaths = DotPaths<Config>;
// "db" | "db.host" | "db.port" | "app" | "app.debug" | "app.port"

// 8. Nested mapped type with two-level key remapping
type AccessorPair<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
} & {
  [K in keyof T as `set${Capitalize<string & K>}`]: (v: T[K]) => void;
};
type UserAccessors = AccessorPair<{ name: string; age: number }>;
// { getName(): string; setName(v: string): void; getAge(): number; setAge(v: number): void }

// 9. Nested discriminated union mapper
type AnyResult<T> = { status: "ok"; data: T } | { status: "err"; error: string };
type MapResult<T, U> = {
  ok: AnyResult<U>;
  err: AnyResult<never>;
};

// 10. Nested mapped type: schema → TypeScript type
type SchemaMap = Record<string, "string" | "number" | "boolean" | "date">;
type InferSchema<S extends SchemaMap> = {
  [K in keyof S]: S[K] extends "string"  ? string :
                  S[K] extends "number"  ? number :
                  S[K] extends "boolean" ? boolean :
                  S[K] extends "date"    ? Date :
                  never;
};
const userSchema = { name: "string", age: "number", active: "boolean", dob: "date" } as const;
type InferredUser = InferSchema<typeof userSchema>;

// 11. Two-level nested getter generation
type DeepGetters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]:
    T[K] extends object
      ? DeepGetters<T[K]>
      : () => T[K];
};

// 12. Nested mapped type: React component prop types
type PropDef<T> = T extends string
  ? { type: "string"; default?: T }
  : T extends number
  ? { type: "number"; min?: number; max?: number }
  : T extends boolean
  ? { type: "boolean"; default?: T }
  : { type: "unknown" };
type ComponentProps<T> = { [K in keyof T]: PropDef<T[K]> };

// 13. Nested mapped type: event emitter with nested events
type NestedEvents = {
  user: { login: [userId: string]; logout: []; update: [changes: Partial<{ name: string }>] };
  system: { error: [err: Error]; warn: [msg: string] };
};
type FlatEvents<E extends Record<string, Record<string, any[]>>> = {
  [NS in keyof E]: {
    [Ev in keyof E[NS]]: (...args: E[NS][Ev]) => void;
  };
};
type NestedEmitter = FlatEvents<NestedEvents>;

// 14. Nested mapped type: form field state
type FieldState<V> = { value: V; dirty: boolean; touched: boolean; error: string | null };
type FormState<T> = { [K in keyof T]: FieldState<T[K]> };
type UserFormState = FormState<{ name: string; email: string; age: number }>;

// 15. Nested conditional mapped type: pick arrays
type ArrayProps<T> = { [K in keyof T as T[K] extends any[] ? K : never]: T[K] };
type Profile = { name: string; tags: string[]; scores: number[]; age: number };
type ArrProfile = ArrayProps<Profile>; // { tags: string[]; scores: number[] }

// 16. Nested mapped type for deeply optional patch
type DeepPatch<T> = {
  [K in keyof T]?: T[K] extends object
    ? T[K] extends (infer U)[]
      ? DeepPatch<U>[]
      : DeepPatch<T[K]>
    : T[K];
};

// 17. Nested mapped type: transform to promise-returning
type DeepPromisify<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => Promise<R>
    : T[K] extends object
    ? DeepPromisify<T[K]>
    : T[K];
};

// 18. Nested mapped type: flatten object to tuple of entries
type EntryOf<T> = { [K in keyof T]: [K, T[K]] }[keyof T];
type UserEntry = EntryOf<{ id: string; name: string }>;
// ["id", string] | ["name", string]

// 19. Nested mapped type for configuration schema
type SchemaNode =
  | { type: "string"; required: boolean }
  | { type: "number"; required: boolean; min?: number }
  | { type: "object"; required: boolean; properties: Record<string, SchemaNode> };
type ObjectSchema<T extends Record<string, SchemaNode>> = {
  [K in keyof T]: T[K] extends { type: "string" } ? string :
                  T[K] extends { type: "number" } ? number :
                  T[K] extends { type: "object"; properties: infer P extends Record<string, SchemaNode> }
                    ? ObjectSchema<P>
                    : never;
};

// 20. Nested mapped type: two-level key extraction
type DeepKeyOf<T, K extends keyof T = keyof T> = K extends string
  ? T[K] extends object ? K | `${K}.${string & keyof T[K]}` : K
  : never;
type DK = DeepKeyOf<{ db: { host: string; port: number }; debug: boolean }>;
// "db" | "db.host" | "db.port" | "debug"

// 21. Nested mapped type: generate query builder type
type SelectClause<T> = {
  select<K extends (keyof T)[]>(...fields: K): Pick<T, K[number]>;
};
type WhereClause<T> = {
  where<K extends keyof T>(field: K, op: "=" | "!=" | ">" | "<", val: T[K]): void;
};
type QueryAPI<T> = SelectClause<T> & WhereClause<T> & { execute(): T[] };

// 22. Nested mapped type: build event listener map from event definition
type EventDef = {
  user: { created: { id: string; name: string }; deleted: { id: string } };
  order: { placed: { orderId: string; total: number }; shipped: { orderId: string } };
};
type FlatEventMap<E extends EventDef> = {
  [NS in keyof E]: {
    [Ev in keyof E[NS]]: (payload: E[NS][Ev]) => void;
  };
};
type AppEventMap = FlatEventMap<EventDef>;

// 23. Recursive mapped type: lens system
type Lens<T, K extends keyof T> = {
  get: (obj: T) => T[K];
  set: (obj: T, val: T[K]) => T;
  modify: (obj: T, fn: (val: T[K]) => T[K]) => T;
};
type LensesFor<T> = { [K in keyof T]: Lens<T, K> };

// 24. Nested mapped type: two-phase transformation
type Phase1<T> = { [K in keyof T]: { raw: T[K] } };
type Phase2<T> = { [K in keyof T]: { raw: T[K]; processed: string } };
type TwoPhase<T> = Phase1<T> & Phase2<T>;

// 25. Nested mapped type for dependency injection
type DIContainer<Services extends Record<string, abstract new (...args: any[]) => any>> = {
  bind<K extends keyof Services>(token: K, impl: InstanceType<Services[K]>): void;
  get<K extends keyof Services>(token: K): InstanceType<Services[K]>;
};

// 26. Nested mapped type: deeply map arrays
type MapArrays<T, F extends (v: unknown) => unknown> = {
  [K in keyof T]: T[K] extends (infer U)[] ? ReturnType<F>[] : T[K];
};

// 27. Nested mapped type for test assertion object
type Expect<T> = {
  [K in keyof T]: {
    toBe: (expected: T[K]) => void;
    not: { toBe: (val: T[K]) => void };
  };
};

// 28. Nested mapped type: deep defaults
type WithDefaults<T, D extends DeepPartial<T>> = {
  [K in keyof T]: K extends keyof D ? NonNullable<D[K]> | NonNullable<T[K]> : T[K];
};

// 29. Nested mapped type for data access object (DAO)
type DAO<T extends { id: string }> = {
  findById: (id: string) => Promise<T | null>;
  findAll: (filter?: Partial<T>) => Promise<T[]>;
  create: (data: Omit<T, "id">) => Promise<T>;
  update: (id: string, patch: Partial<Omit<T, "id">>) => Promise<T>;
  delete: (id: string) => Promise<void>;
};

// 30. Nested mapped type for nested namespaces
type Namespaced<T extends Record<string, Record<string, any>>> = {
  [NS in keyof T]: {
    [K in keyof T[NS]]: T[NS][K];
  };
};

// 31. Nested mapped type: record with metadata
type WithMetadata<T> = {
  [K in keyof T]: {
    value: T[K];
    metadata: { updatedAt: Date; updatedBy: string };
  };
};

// 32. Nested mapped type: extract literal keys
type LiteralKeys<T> = {
  [K in keyof T]: T[K] extends string ? (string extends T[K] ? never : K) : never;
}[keyof T];
const status = { active: "active", inactive: "inactive" } as const;
type StatusLiteralKeys = LiteralKeys<typeof status>; // "active" | "inactive"

// 33. Two-level remapped type for typed decorators
type DecoratedClass<T> = {
  [K in keyof T as K extends string ? `__${K}__` : never]: T[K];
};

// 34. Nested mapped type: schema for API response normalization
type NormalizeResponse<T> = {
  [K in keyof T]:
    T[K] extends Date ? string :
    T[K] extends boolean ? 0 | 1 :
    T[K] extends (infer U)[] ? NormalizeResponse<U>[] :
    T[K] extends object ? NormalizeResponse<T[K]> :
    T[K];
};

// 35. Nested mapped type: split mapped type into two
type SplitType<T> = {
  strings: { [K in keyof T as T[K] extends string ? K : never]: T[K] };
  others: { [K in keyof T as T[K] extends string ? never : K]: T[K] };
};
type Split2 = SplitType<{ a: string; b: number; c: string; d: boolean }>;

// 36. Nested mapped type: build state machine types
type States = "idle" | "running" | "paused" | "done";
type TransitionMap = {
  idle:    { start: "running" };
  running: { pause: "paused"; stop: "done" };
  paused:  { resume: "running"; stop: "done" };
  done:    {};
};
type FSMType = {
  [S in States]: {
    state: S;
    transitions: TransitionMap[S];
    trigger: <E extends keyof TransitionMap[S]>(event: E) => void;
  };
};

// 37. Nested mapped type: nested form with section grouping
type FormSection<T> = {
  fields: FormState<T>;
  isValid: boolean;
  submit: () => void;
};
type UserFormSections = {
  personal: FormSection<{ name: string; dob: Date }>;
  contact:  FormSection<{ email: string; phone?: string }>;
};
type FieldState2<V> = { value: V; error?: string };
type FormState2<T> = { [K in keyof T]: FieldState2<T[K]> };

// 38. Nested mapped type for builder with accumulator
type BuilderAcc<T, Done extends (keyof T)[] = []> = {
  [K in keyof T as K extends Done[number] ? never : K]: (val: T[K]) => BuilderAcc<T, [...Done, K]>;
} & (Done["length"] extends keyof T extends never ? true : false ? { build(): T } : {});

// 39. Nested mapped type: event sourcing state
type EventState<Commands, State> = {
  apply: (command: Commands, state: State) => State;
  project: (events: Commands[]) => State;
};

// 40. Nested mapped type: typed merge strategy
type MergeStrategy<T> = {
  [K in keyof T]: "replace" | "append" | "deep";
};

// 41. Two-layer key inheritance mapped type
type Inherited<Parent, Child extends Partial<Parent>> = {
  [K in keyof Parent | keyof Child]:
    K extends keyof Child ? Child[K & keyof Child] :
    K extends keyof Parent ? Parent[K & keyof Parent] :
    never;
};

// 42. Nested mapped type for typed serializer
type Serializers<T> = {
  serialize: (obj: T) => { [K in keyof T]: string };
  deserialize: (raw: { [K in keyof T]: string }) => T;
};

// 43. Nested mapped type for deep clone typing
type DeepClone<T> =
  T extends (infer U)[] ? DeepClone<U>[] :
  T extends object ? { [K in keyof T]: DeepClone<T[K]> } :
  T;

// 44. Nested mapped type for type-safe patch operations
type PatchOp<T> =
  | { op: "set"; key: keyof T; value: T[keyof T] }
  | { op: "delete"; key: keyof T };
type PatchHistory<T> = PatchOp<T>[];

// 45. Nested mapped type: generate REST endpoint types
type RestEndpoints<T extends { id: string }> = {
  list: { req: Partial<T>; res: T[] };
  get:  { req: { id: string }; res: T | null };
  create: { req: Omit<T, "id">; res: T };
  update: { req: { id: string } & Partial<T>; res: T };
  delete: { req: { id: string }; res: void };
};

// 46. Nested mapped type with conditional key rename
type Suffixes<T, Condition> = {
  [K in keyof T as T[K] extends Condition ? `${string & K}?` : string & K]: T[K];
};

// 47. Nested mapped type: two-level readonly + optional
type StrictConfig<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? Readonly<Required<StrictConfig<T[K]>>>
    : T[K];
};

// 48. Nested mapped type for typed observable
type ObservableState<T> = {
  [K in keyof T]: {
    get: () => T[K];
    set: (v: T[K]) => void;
    watch: (cb: (v: T[K], prev: T[K]) => void) => () => void;
  };
};

// 49. Nested mapped type: multi-level permission matrix
type Role2 = "admin" | "user" | "guest";
type Permissions2<Actions extends string> = {
  [R in Role2]: { [A in Actions]: boolean };
};
type AppPermissions = Permissions2<"create" | "read" | "update" | "delete">;
const perms: AppPermissions = {
  admin: { create: true,  read: true,  update: true,  delete: true  },
  user:  { create: true,  read: true,  update: true,  delete: false },
  guest: { create: false, read: true,  update: false, delete: false },
};

// 50. Nested mapped type: complete typed ORM
type ORMModel<T extends object> = {
  readonly schema: { [K in keyof T]: { type: string; nullable: boolean } };
  select<K extends (keyof T)[]>(...fields: K): Promise<Pick<T, K[number]>[]>;
  where<K extends keyof T>(field: K, op: "=" | "!=" | ">" | "<", val: T[K]): ORMModel<T>;
  insert(data: Omit<T, "id">): Promise<T>;
  update(id: string, patch: Partial<Omit<T, "id">>): Promise<T>;
  delete(id: string): Promise<void>;
};
