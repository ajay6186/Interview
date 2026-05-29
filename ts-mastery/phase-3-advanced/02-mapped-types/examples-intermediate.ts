export {};

// ── Intermediate Mapped Type Examples ────────────────────────────────────────

// 1. Conditional value mapping
type MapValues<T, From, To> = {
  [K in keyof T]: T[K] extends From ? To : T[K];
};
type User = { id: number; name: string; createdAt: Date; updatedAt: Date };
type Serialized = MapValues<User, Date, string>;
// { id: number; name: string; createdAt: string; updatedAt: string }

// 2. Mapped type with key remapping and value filter
type PickByType<T, Type> = {
  [K in keyof T as T[K] extends Type ? K : never]: T[K];
};
type NumberFields = PickByType<User, number>; // { id: number }

// 3. Mapped type with key negation
type OmitByType<T, Type> = {
  [K in keyof T as T[K] extends Type ? never : K]: T[K];
};
type NonDateFields = OmitByType<User, Date>; // { id: number; name: string }

// 4. Mapped type with Capitalize + remapping
type UppercasedGetters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};
type UserGetters = UppercasedGetters<User>;
// { getId(): number; getName(): string; getCreatedAt(): Date; ... }

// 5. Conditional readonly mapped type
type ReadonlyIf<T, Condition extends boolean> = {
  [K in keyof T]: Condition extends true ? Readonly<{ value: T[K] }> : { value: T[K] };
}[keyof T];

// 6. Deep mapped conditional
type DeepNullable<T> = {
  [K in keyof T]: T[K] extends object ? DeepNullable<T[K]> : T[K] | null;
};

// 7. Mapped type to track mutations
type Diff<T> = {
  [K in keyof T]: { old: T[K]; new: T[K]; changed: boolean };
};
type UserDiff = Diff<User>;

// 8. Mapped type converting methods to async
type Promisify<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => Promise<Awaited<R>>
    : T[K];
};
class Repo {
  find(id: string): User { return {} as User; }
  list(): User[] { return []; }
}
type AsyncRepo = Promisify<Repo>;

// 9. Mapped type extracting function types only
type MethodsOnly<T> = {
  [K in keyof T as T[K] extends Function ? K : never]: T[K];
};
type RepoMethods = MethodsOnly<Repo>;

// 10. Mapped type removing methods
type DataOnly<T> = {
  [K in keyof T as T[K] extends Function ? never : K]: T[K];
};
class Model { id = ""; name = ""; greet() { return "hi"; } }
type ModelData = DataOnly<Model>; // { id: string; name: string }

// 11. Mapped type building event handler type
type EventHandlerMap<Events extends Record<string, any[]>> = {
  [K in keyof Events]: (...args: Events[K]) => void;
};
type AppHandlers = EventHandlerMap<{
  login: [userId: string, timestamp: Date];
  logout: [];
  error: [err: Error];
}>;

// 12. Mapped type for config builder fluent API
type FluentConfig<T> = {
  [K in keyof T as `with${Capitalize<string & K>}`]: (val: T[K]) => FluentConfig<T>;
} & { build(): T };

// 13. Mapped type creating validator per field
type Validators<T> = {
  [K in keyof T]: (val: T[K]) => { valid: boolean; errors: string[] };
};

// 14. Mapped type for proxy handler shape
type ProxyHandler2<T> = {
  [K in keyof T]: {
    get: () => T[K];
    set: (val: T[K]) => void;
  };
};

// 15. Mapped type with recursive Record flattening
type FlatRecord<T, Prefix extends string = ""> = {
  [K in keyof T & string as T[K] extends object
    ? keyof FlatRecord<T[K], `${Prefix}${K}.`>
    : `${Prefix}${K}`]: T[K] extends object ? never : T[K];
};

// 16. Conditional mapped type: required or optional based on another key
type RequireIf<T, Condition extends keyof T> = {
  [K in keyof T]: K extends Condition ? T[K] : T[K] | undefined;
};

// 17. Mapped type for React-like prop types
type PropTypes<T> = {
  [K in keyof T]: {
    type: T[K] extends string ? "string" : T[K] extends number ? "number" : "any";
    required: undefined extends T[K] ? false : true;
  };
};
type UserPropTypes = PropTypes<User>;

// 18. Mapped type: union of mapped values
type ValuesOf<T> = T[keyof T];
type UserValues = ValuesOf<User>; // number | string | Date

// 19. Mapped type for Redux-like action types
type ActionTypes<State extends object> = {
  [K in keyof State as `SET_${Uppercase<string & K>}`]: {
    type: `SET_${Uppercase<string & K>}`;
    payload: State[K];
  };
};
type Actions2 = ActionTypes<{ count: number; name: string }>;
// { SET_COUNT: { type: "SET_COUNT"; payload: number }; ... }

// 20. Mapped type filtering by nullability
type NonNullableFields<T> = {
  [K in keyof T as null extends T[K] ? never : K]: T[K];
};

// 21. Mapped type to create form field descriptors
type FormField<T> = {
  [K in keyof T]: {
    name: K;
    value: T[K];
    dirty: boolean;
    error: string | null;
  };
}[keyof T];

// 22. Mapped type for type-safe object transform
function mapObject<T extends object, U>(
  obj: T,
  fn: <K extends keyof T>(key: K, val: T[K]) => U
): Record<keyof T, U> {
  const result = {} as Record<keyof T, U>;
  for (const key of Object.keys(obj) as (keyof T)[]) {
    result[key] = fn(key, obj[key]);
  }
  return result;
}
const lengths = mapObject({ a: "hi", b: "hello" }, (k, v) => v.length);

// 23. Mapped type with multiple conditional value transforms
type Coerce<T> = {
  [K in keyof T]:
    T[K] extends Date ? string :
    T[K] extends boolean ? 0 | 1 :
    T[K] extends (infer U)[] ? Coerce<U>[] :
    T[K] extends object ? Coerce<T[K]> :
    T[K];
};

// 24. Mapped type for observable fields
type Observable<T> = {
  [K in keyof T]: {
    value: T[K];
    subscribe: (cb: (val: T[K]) => void) => () => void;
  };
};

// 25. Mapped type: strict partial (only known keys)
type StrictPartial<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// 26. Mapped type to describe access levels
type AccessLevel = "none" | "read" | "write" | "admin";
type ResourceAccess<T> = {
  [K in keyof T]: AccessLevel;
};
type UserAccess = ResourceAccess<User>;

// 27. Mapped type with negated key filter via as
type RemovePrefix<T, P extends string> = {
  [K in keyof T as K extends `${P}${infer Rest}` ? Rest : K]: T[K];
};
type Cleaned = RemovePrefix<{ onLogin: () => void; onLogout: () => void; title: string }, "on">;
// { Login: () => void; Logout: () => void; title: string }

// 28. Mapped type with infer in key
type ExtractProps<T, Prefix extends string> = {
  [K in keyof T as K extends `${Prefix}${infer Rest}` ? Rest : never]: T[K];
};
type EventProps = ExtractProps<{ onClick: () => void; onFocus: () => void; label: string }, "on">;
// { Click: () => void; Focus: () => void }

// 29. Mapped type with keyof intersection
type IntersectionKeys<A, B> = { [K in keyof A & keyof B]: A[K] & B[K] };
type A2 = { x: number; y: string };
type B2 = { x: number; z: boolean };
type IK = IntersectionKeys<A2, B2>; // { x: number }

// 30. Mapped type: all combinations of optional/required
type AllVariants<T> = {
  required: Required<T>;
  partial: Partial<T>;
  readonly: Readonly<T>;
};

// 31. Mapped type: transform keys to paths
type Paths<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends object
    ? Paths<T[K], `${P}${K}.`> | `${P}${K}`
    : `${P}${K}`;
}[keyof T & string];
type ConfigPaths = Paths<{ db: { host: string }; port: number }>;
// "db" | "db.host" | "port"

// 32. Mapped type for strict event bus
type EventBus<Events extends Record<string, any[]>> = {
  on: <K extends keyof Events>(event: K, handler: (...args: Events[K]) => void) => void;
  emit: <K extends keyof Events>(event: K, ...args: Events[K]) => void;
};

// 33. Mapped type for record versioning
type Versioned<T> = {
  [K in keyof T]: { current: T[K]; version: number; history: T[K][] };
};

// 34. Mapped type to produce property descriptor
type Descriptors<T> = {
  [K in keyof T]: PropertyDescriptor & { value: T[K] };
};

// 35. Mapped type: field accessor pair
type FieldAccessor<T> = {
  [K in keyof T]: [get: () => T[K], set: (v: T[K]) => void];
};

// 36. Mapped type with negated condition in key
type Without<T, K extends keyof T> = {
  [P in keyof T as P extends K ? never : P]: T[P];
};
type NoId = Without<User, "id">; // { name: string; createdAt: Date; updatedAt: Date }

// 37. Mapped type to enforce interface completeness
type Complete<T extends Record<string, any>, Impl extends T> = Impl;

// 38. Mapped type for CSS property map
type CSSPropMap<Props extends string> = {
  [K in Props]?: string | number;
};
type LayoutCSS = CSSPropMap<"display" | "flex" | "margin" | "padding" | "color">;

// 39. Mapped type: observable + reactive store
type ReactiveStore<T extends object> = {
  readonly state: Readonly<T>;
  patch: (updates: Partial<T>) => void;
  subscribe: <K extends keyof T>(key: K, cb: (val: T[K]) => void) => () => void;
};

// 40. Mapped type: conditional function wrapping
type WrappedIf<T, Wrap extends boolean> = {
  [K in keyof T]: Wrap extends true ? { wrapped: T[K] } : T[K];
};

// 41. Mapped type: method stubs for testing
type MockMethods<T> = {
  [K in keyof T as T[K] extends Function ? K : never]:
    T[K] extends (...args: infer A) => infer R
      ? jest.Mock<R, A>
      : never;
};

// 42. Mapped type for typed dependency injection container
type Container<T extends Record<string, new (...args: any[]) => any>> = {
  [K in keyof T]: InstanceType<T[K]>;
};

// 43. Mapped type to exclude undefined values
type NoUndefined<T> = {
  [K in keyof T as undefined extends T[K] ? never : K]: T[K];
};

// 44. Mapped type: type of keys as values
type KeysAsValues<T> = {
  [K in keyof T]: K;
};
type UserKeys = KeysAsValues<User>; // { id: "id"; name: "name"; ... }

// 45. Mapped type for schema-driven form
type FormDescriptor<T> = {
  [K in keyof T]: {
    label: string;
    placeholder?: string;
    validators?: ((v: T[K]) => boolean)[];
    type: T[K] extends string ? "text" | "email" | "password" : T[K] extends number ? "number" : "checkbox";
  };
};

// 46. Mapped type: merge two records overriding shared keys
type MergeOverride<A, B> = { [K in keyof A | keyof B]: K extends keyof B ? B[K & keyof B] : K extends keyof A ? A[K & keyof A] : never };
type MA = { x: number; y: string };
type MB = { y: boolean; z: number };
type MC2 = MergeOverride<MA, MB>; // { x: number; y: boolean; z: number }

// 47. Mapped type: enforce all keys are handled
type ExhaustiveMap<T extends string, V> = { [K in T]: V };
type StatusMap2 = ExhaustiveMap<"idle" | "loading" | "done" | "error", { label: string; color: string }>;

// 48. Mapped type for versioned API
type ApiVersion<T, V extends string> = {
  [K in keyof T as `${V}_${string & K}`]: T[K];
};
type V1User = ApiVersion<User, "v1">; // { v1_id: number; v1_name: string; ... }

// 49. Mapped type: model → form value conversion
type ToFormValues<T> = {
  [K in keyof T]: T[K] extends Date ? string : T[K] extends boolean ? "true" | "false" : T[K];
};
type UserFormValues = ToFormValues<User>; // { id: number; name: string; createdAt: string; updatedAt: string }

// 50. Mapped type: complete proxy interface
type Proxy<T> = {
  readonly [K in keyof T]: T[K];
} & {
  $get<K extends keyof T>(key: K): T[K];
  $set<K extends keyof T>(key: K, val: T[K]): void;
  $patch(updates: Partial<T>): void;
  $observe<K extends keyof T>(key: K, cb: (val: T[K]) => void): () => void;
};
