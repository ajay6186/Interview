export {};

// ── Basic Mapped Type Examples ────────────────────────────────────────────────

// 1. Simple mapped type over keyof
type Stringify<T> = { [K in keyof T]: string };
type User = { id: number; name: string; active: boolean };
type StringifiedUser = Stringify<User>; // { id: string; name: string; active: string }

// 2. Mapped type adding null
type Nullable<T> = { [K in keyof T]: T[K] | null };
type NullableUser = Nullable<User>;

// 3. Mapped type adding undefined
type Optional2<T> = { [K in keyof T]?: T[K] };
type PartialUser = Optional2<User>;

// 4. Mapped type removing optional
type Required2<T> = { [K in keyof T]-?: T[K] };
type Config = { host?: string; port?: number };
type RequiredConfig = Required2<Config>; // { host: string; port: number }

// 5. Mapped type adding readonly
type Readonly2<T> = { readonly [K in keyof T]: T[K] };
type ReadonlyUser = Readonly2<User>;

// 6. Mapped type removing readonly
type Mutable<T> = { -readonly [K in keyof T]: T[K] };
type FrozenUser = Readonly<User>;
type MutableUser = Mutable<FrozenUser>;

// 7. Mapped type identity (copy)
type Copy<T> = { [K in keyof T]: T[K] };
type UserCopy = Copy<User>;

// 8. Mapped type to boolean flag
type Flags<T> = { [K in keyof T]: boolean };
type UserFlags = Flags<User>; // { id: boolean; name: boolean; active: boolean }

// 9. Record mapped type
type CssVars = Record<"color" | "fontSize" | "margin", string>;
const cssVars: CssVars = { color: "red", fontSize: "16px", margin: "0" };

// 10. Mapped type from string union
type EventHandlers = { [K in "click" | "focus" | "blur"]: (e: Event) => void };

// 11. Mapped type with union value
type AllowedOrNull<T> = { [K in keyof T]: T[K] | null | undefined };
type NullableFields = AllowedOrNull<User>;

// 12. Mapped type reversing to boolean (Partial version)
type ToBooleans<T extends Record<string, unknown>> = { [K in keyof T]: boolean };
type UserBooleans = ToBooleans<User>;

// 13. Mapped type with literal value
type DefaultValues<T> = { [K in keyof T]: T[K] extends string ? "" : T[K] extends number ? 0 : null };

// 14. Mapped type preserving readonly status
type Annotate<T> = { [K in keyof T]: { value: T[K]; required: boolean } };
type AnnotatedUser = Annotate<User>;

// 15. Mapped type for getters
type Getters<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] };
type UserGetters = Getters<User>; // { getId(): number; getName(): string; getActive(): boolean }

// 16. Mapped type for setters
type Setters<T> = { [K in keyof T as `set${Capitalize<string & K>}`]: (v: T[K]) => void };
type UserSetters = Setters<User>;

// 17. Mapped type with Pick behavior
type PickKeys<T, K extends keyof T> = { [P in K]: T[P] };
type Preview = PickKeys<User, "id" | "name">;

// 18. Mapped type with Omit behavior
type OmitKeys<T, K extends keyof T> = { [P in Exclude<keyof T, K>]: T[P] };
type PublicUser = OmitKeys<User, "active">;

// 19. Mapped type over tuple
type MapTuple<T extends any[]> = { [K in keyof T]: T[K] extends number ? string : T[K] };
type MT = MapTuple<[number, string, boolean]>; // [string, string, boolean]

// 20. Mapped type adding prefix to all keys
type Prefixed<T, P extends string> = { [K in keyof T as `${P}${string & K}`]: T[K] };
type PrefixedUser = Prefixed<User, "user_">; // { user_id: number; user_name: string; user_active: boolean }

// 21. Mapped type for validation schema
type ValidationRules<T> = { [K in keyof T]?: ((val: T[K]) => boolean)[] };

// 22. Mapped type with template literal key rename
type WithPrefix<T, P extends string> = { [K in keyof T as `${P}${Capitalize<string & K>}`]: T[K] };
type Prop = WithPrefix<{ name: string; age: number }, "get">; // { getName: string; getAge: number }

// 23. Mapped type over index signature
type StringToNumber = { [key: string]: number };
type StringToString = { [K in string]: string };

// 24. Mapped type preserving optionality (no change)
type Preserved<T> = { [K in keyof T]: T[K] };

// 25. Mapped type conditional value transformation
type ConvertDates<T> = { [K in keyof T]: T[K] extends Date ? string : T[K] };
type WithDate = { name: string; created: Date };
type Converted = ConvertDates<WithDate>; // { name: string; created: string }

// 26. Mapped type building event listener map
type Listeners<Events extends Record<string, unknown>> = {
  [K in keyof Events]: (payload: Events[K]) => void;
};
type AppListeners = Listeners<{ login: { userId: string }; logout: {} }>;

// 27. Mapped type for test fixtures
type TestFixture<T> = { [K in keyof T]: T[K] | undefined };

// 28. Mapped type: key remapping with filtering
type OnlyStringKeys<T> = { [K in keyof T as K extends string ? K : never]: T[K] };
type Symbols = { [Symbol.iterator]: () => void; name: string };
type StringOnly = OnlyStringKeys<Symbols>; // { name: string }

// 29. Mapped type: negate boolean fields
type Negate<T extends { [K in keyof T]: boolean }> = { [K in keyof T]: boolean };

// 30. Mapped type: transform to Optional array
type ArrayFields<T> = { [K in keyof T]: T[K][] };
type UserArrays = ArrayFields<User>; // { id: number[]; name: string[]; active: boolean[] }

// 31. Mapped type: key to value map
type KeyMap<T> = { [K in keyof T]: K };
type UserKeyMap = KeyMap<User>; // { id: "id"; name: "name"; active: "active" }

// 32. Mapped type: make functions async
type Asyncify<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R ? (...args: A) => Promise<R> : T[K];
};

// 33. Mapped type with two-level mapping
type Nested<T> = { [K in keyof T]: { value: T[K] } };
type NestedUser = Nested<User>; // { id: { value: number }; name: { value: string }; ... }

// 34. Mapped type: union keys to Record
type UnionRecord<U extends string, V> = { [K in U]: V };
type ColorMap2 = UnionRecord<"red" | "green" | "blue", string>;

// 35. Mapped type: mark keys optional by name
type OptionalKeys2<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type UserOpt = OptionalKeys2<User, "active">; // { id: number; name: string; active?: boolean }

// 36. Mapped type to collect metadata
type FieldMeta<T> = {
  [K in keyof T]: { key: K; type: string; optional: undefined extends T[K] ? true : false };
};

// 37. Mapped type for method binding
type Bound<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => R
    : T[K];
};

// 38. Mapped type with key filtering by prefix
type FilterPrefix<T, P extends string> = {
  [K in keyof T as K extends `${P}${string}` ? K : never]: T[K];
};
type EventProps = { onClick: () => void; onFocus: () => void; label: string; value: string };
type OnHandlers = FilterPrefix<EventProps, "on">; // { onClick: ...; onFocus: ... }

// 39. Mapped type for diff tracking
type TrackChanges<T> = {
  [K in keyof T]: { before: T[K]; after: T[K]; changed: boolean };
};

// 40. Mapped type: rename with suffix
type Suffixed<T, S extends string> = { [K in keyof T as `${string & K}${S}`]: T[K] };
type DraftUser = Suffixed<User, "Draft">; // { idDraft: number; nameDraft: string; ... }

// 41. Mapped type for type-safe defaults
type WithDefaults<T, D extends Partial<T>> = {
  [K in keyof T]: K extends keyof D ? NonNullable<D[K]> | T[K] : T[K];
};

// 42. Mapped type: pick required fields only
type RequiredOnly<T> = {
  [K in keyof T as {} extends Pick<T, K> ? never : K]: T[K];
};
type Form = { name: string; email?: string };
type OnlyRequired = RequiredOnly<Form>; // { name: string }

// 43. Mapped type for spy/mock helpers
type SpyOn<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? { calls: A[]; mock: (...args: A) => R }
    : T[K];
};

// 44. Mapped type: tag with discriminant
type Tagged2<T, Tag extends string> = { [K in keyof T]: T[K] & { _tag: Tag } };

// 45. Mapped type converting to event emitter
type EventEmitterType<T extends Record<string, any[]>> = {
  [K in keyof T as `on${Capitalize<string & K>}`]: (handler: (...args: T[K]) => void) => void;
} & {
  [K in keyof T as `emit${Capitalize<string & K>}`]: (...args: T[K]) => void;
};

// 46. Mapped type: remove methods
type DataOnly<T> = { [K in keyof T as T[K] extends Function ? never : K]: T[K] };
class Person { name = "Alice"; greet() { return "hi"; } }
type PersonData = DataOnly<Person>; // { name: string }

// 47. Mapped type for deep clone type
type DeepClone<T> = T extends (infer U)[] ? DeepClone<U>[] : T extends object ? { [K in keyof T]: DeepClone<T[K]> } : T;

// 48. Mapped type: optional boolean flags
type FeatureFlags<T extends string> = { [K in T]?: boolean };
type AppFlags = FeatureFlags<"darkMode" | "betaEditor" | "analytics">;

// 49. Mapped type key transformation: camelCase to snake_case helper
type CamelToSnake<S extends string> =
  S extends `${infer Head}${infer Tail}`
    ? Head extends Uppercase<Head>
      ? `_${Lowercase<Head>}${CamelToSnake<Tail>}`
      : `${Head}${CamelToSnake<Tail>}`
    : S;
type SnakeCased<T> = { [K in keyof T as CamelToSnake<string & K>]: T[K] };
type SnakeUser = SnakeCased<{ firstName: string; lastName: string; createdAt: Date }>;
// { first_name: string; last_name: string; created_at: Date }

// 50. Mapped type for state action creators
type ActionCreators<State extends object> = {
  [K in keyof State as `set${Capitalize<string & K>}`]: (val: State[K]) => { type: `SET_${Uppercase<string & K>}`; payload: State[K] };
};
type CounterState = { count: number; label: string };
type CounterActions = ActionCreators<CounterState>;
// { setCount: (val: number) => { type: "SET_COUNT"; payload: number };
//   setLabel: (val: string) => { type: "SET_LABEL"; payload: string } }
