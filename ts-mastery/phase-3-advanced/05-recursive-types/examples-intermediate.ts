export {};

// ── Intermediate Recursive Type Examples ──────────────────────────────────────

// 1. Recursive DeepPartial with arrays
type DeepPartial<T> =
  T extends (infer U)[] ? DeepPartial<U>[] :
  T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;
type AppState = { user: { name: string; prefs: { theme: string; lang: string } }; items: string[] };
type PartialApp = DeepPartial<AppState>;

// 2. Recursive type for JSON schema inference
type JSONSchema =
  | { type: "string" }
  | { type: "number" }
  | { type: "boolean" }
  | { type: "null" }
  | { type: "array"; items: JSONSchema }
  | { type: "object"; properties: { [key: string]: JSONSchema }; required?: string[] };
type InferFromSchema<S extends JSONSchema> =
  S extends { type: "string" }  ? string  :
  S extends { type: "number" }  ? number  :
  S extends { type: "boolean" } ? boolean :
  S extends { type: "null" }    ? null    :
  S extends { type: "array"; items: infer I extends JSONSchema } ? InferFromSchema<I>[] :
  S extends { type: "object"; properties: infer P }
    ? { [K in keyof P]: P[K] extends JSONSchema ? InferFromSchema<P[K]> : never }
    : never;

// 3. Recursive breadcrumb path builder
type Breadcrumb<T, Prefix extends string = ""> = {
  [K in keyof T & string]:
    T[K] extends object
      ? Breadcrumb<T[K], `${Prefix}${K}.`> | `${Prefix}${K}`
      : `${Prefix}${K}`;
}[keyof T & string];
type Crumb = Breadcrumb<AppState>; // "user" | "user.name" | "user.prefs" | ...

// 4. Recursive type: pick deep
type DeepPick<T, K extends string> =
  K extends keyof T
    ? Pick<T, K>
    : {
        [P in keyof T as K extends `${P extends string ? P : never}.${string}` ? P : never]:
          K extends `${P extends string ? P : never}.${infer Rest}`
            ? DeepPick<T[P], Rest>
            : never;
      };

// 5. Recursive type for expression evaluator types
type Expr =
  | { op: "lit"; val: number }
  | { op: "add"; left: Expr; right: Expr }
  | { op: "mul"; left: Expr; right: Expr }
  | { op: "neg"; expr: Expr };
function evalExpr(e: Expr): number {
  switch (e.op) {
    case "lit": return e.val;
    case "add": return evalExpr(e.left) + evalExpr(e.right);
    case "mul": return evalExpr(e.left) * evalExpr(e.right);
    case "neg": return -evalExpr(e.expr);
  }
}

// 6. Recursive type: fully optional nested keys
type DeepKeyOf<T, Prefix extends string = ""> =
  T extends object
    ? {
        [K in keyof T & string]:
          | `${Prefix}${K}`
          | DeepKeyOf<T[K], `${Prefix}${K}.`>
      }[keyof T & string]
    : never;
type DKO = DeepKeyOf<{ a: { b: { c: string } }; d: number }>; // "a" | "a.b" | "a.b.c" | "d"

// 7. Recursive merge with overwrite
type Merge<A, B> = Omit<A, keyof B> & B;
type DeepMerge<A, B> = {
  [K in keyof (Omit<A, keyof B> & B)]:
    K extends keyof A & keyof B
      ? A[K] extends object
        ? B[K] extends object
          ? DeepMerge<A[K], B[K]>
          : B[K]
        : B[K]
      : K extends keyof B ? B[K] : K extends keyof A ? A[K] : never;
};

// 8. Recursive: type-safe tree fold
type TreeNode<T> = { value: T; children: TreeNode<T>[] };
type FoldTree<T, R> = (node: { value: T; children: R[] }) => R;
function foldTree<T, R>(tree: TreeNode<T>, f: FoldTree<T, R>): R {
  return f({ value: tree.value, children: tree.children.map(c => foldTree(c, f)) });
}

// 9. Recursive: strongly typed command chain
type Command<State, Result, Next = void> = {
  execute: (state: State) => Result;
  next?: Next extends void ? undefined : Command<Result, any>;
};

// 10. Recursive: extract all leaf value types
type Leaves<T> =
  T extends object
    ? { [K in keyof T]: Leaves<T[K]> }[keyof T]
    : T;
type L = Leaves<{ a: { b: string; c: number }; d: boolean }>; // string | number | boolean

// 11. Recursive: conditional deep freeze type
type DeepFreeze<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepFreeze<T[K]> : T[K];
};
const config = { db: { host: "localhost", port: 5432 } } as const;
type FrozenConfig = DeepFreeze<typeof config>;

// 12. Recursive type: validated nested structure
type Validate<T, Schema> =
  Schema extends object
    ? { [K in keyof Schema]: K extends keyof T ? Validate<T[K], Schema[K]> : never }
    : T extends Schema ? T : never;

// 13. Recursive: tuple map
type MapTuple<T extends any[], F extends (x: any) => any> =
  T extends [infer H, ...infer Rest]
    ? [F extends (x: H) => infer R ? R : never, ...MapTuple<Rest, F>]
    : [];
type MT = MapTuple<[string, number], (x: string | number) => boolean>; // [boolean, boolean]

// 14. Recursive: tuple filter
type FilterTuple<T extends any[], U> =
  T extends [infer H, ...infer Rest]
    ? [H] extends [U] ? [H, ...FilterTuple<Rest, U>] : FilterTuple<Rest, U>
    : [];
type FT = FilterTuple<[string, number, string, boolean], string>; // [string, string]

// 15. Recursive: typed list cons/nil
type Nil = { readonly _tag: "Nil" };
type Cons<H, T extends List2> = { readonly _tag: "Cons"; head: H; tail: T };
type List2 = Nil | Cons<any, List2>;
type ConsOf<H, T extends List2> = Cons<H, T>;
type L2 = ConsOf<string, ConsOf<number, Nil>>;

// 16. Recursive: trie structure
type Trie = { [key: string]: Trie | string };
const routes: Trie = { users: { ":id": "UserDetail", list: "UserList" }, home: "Home" };

// 17. Recursive: deeply nested optional
type DeepOptional<T> =
  T extends object ? { [K in keyof T]?: DeepOptional<T[K]> } : T | undefined;

// 18. Recursive: serialize nested dates
type SerializeDates<T> =
  T extends Date ? string :
  T extends (infer U)[] ? SerializeDates<U>[] :
  T extends object ? { [K in keyof T]: SerializeDates<T[K]> } : T;
type WithDates = { created: Date; tags: Date[]; meta: { updated: Date } };
type Serialized = SerializeDates<WithDates>;
// { created: string; tags: string[]; meta: { updated: string } }

// 19. Recursive: readonly path extraction
type ReadonlyPaths<T, Prefix extends string = ""> =
  T extends object
    ? {
        [K in keyof T & string]:
          T extends Readonly<Pick<T, K>>
            ? `${Prefix}${K}` | ReadonlyPaths<T[K], `${Prefix}${K}.`>
            : ReadonlyPaths<T[K], `${Prefix}${K}.`>;
      }[keyof T & string]
    : never;

// 20. Recursive: tuple to union of pairs
type Pairs<T extends any[]> =
  T extends [infer A, infer B, ...infer Rest]
    ? [A, B] | Pairs<[B, ...Rest]>
    : never;
type P2 = Pairs<[1, 2, 3, 4]>; // [1,2] | [2,3] | [3,4]

// 21. Recursive: DFS type traversal
type DFSKeys<T, Visited extends string = never> =
  T extends object
    ? {
        [K in keyof T & string]:
          K extends Visited ? never : K | DFSKeys<T[K], Visited | K>
      }[keyof T & string]
    : never;

// 22. Recursive: accumulate tuple type
type Accumulate<T extends any[], Acc extends any[] = []> =
  T extends [infer H, ...infer Rest]
    ? Accumulate<Rest, [...Acc, H]>
    : Acc;

// 23. Recursive: split string by delimiter to tuple
type Split<S extends string, D extends string> =
  S extends `${infer H}${D}${infer T}` ? [H, ...Split<T, D>] : [S];
type SP = Split<"a.b.c.d", ".">; // ["a", "b", "c", "d"]

// 24. Recursive: typed route tree
type Route = { path: string; component: string; children?: Route[] };
const routeTree: Route = {
  path: "/",
  component: "App",
  children: [
    { path: "users", component: "Users", children: [{ path: ":id", component: "UserDetail" }] },
    { path: "about", component: "About" }
  ]
};

// 25. Recursive: infer nested discriminated union
type ParseNode<T> =
  T extends { kind: "leaf"; value: infer V } ? V :
  T extends { kind: "node"; children: infer C extends ParseNode<any>[] } ? C[number] : never;

// 26. Recursive type: indexed access deep
type NestedAccess<T, Keys extends string[]> =
  Keys extends [infer K extends keyof T & string, ...infer Rest extends string[]]
    ? Rest extends [] ? T[K] : NestedAccess<T[K], Rest>
    : T;
type NA = NestedAccess<AppState, ["user", "name"]>; // string

// 27. Recursive: tuple drop first N
type Drop<T extends any[], N extends number, Acc extends 0[] = []> =
  Acc["length"] extends N ? T :
  T extends [any, ...infer Rest] ? Drop<Rest, N, [...Acc, 0]> : T;
type D2 = Drop<[1, 2, 3, 4, 5], 2>; // [3, 4, 5]

// 28. Recursive: take first N elements
type Take<T extends any[], N extends number, Acc extends any[] = []> =
  Acc["length"] extends N ? Acc :
  T extends [infer H, ...infer Rest] ? Take<Rest, N, [...Acc, H]> : Acc;
type TK = Take<[1, 2, 3, 4, 5], 3>; // [1, 2, 3]

// 29. Recursive: interleave two tuples
type Interleave<A extends any[], B extends any[]> =
  A extends [infer AH, ...infer AT]
    ? B extends [infer BH, ...infer BT]
      ? [AH, BH, ...Interleave<AT, BT>]
      : A
    : B;
type IL = Interleave<[1, 3, 5], [2, 4, 6]>; // [1, 2, 3, 4, 5, 6]

// 30. Recursive: tuple rotate left
type RotateLeft<T extends any[]> =
  T extends [infer H, ...infer Rest] ? [...Rest, H] : T;
type RL = RotateLeft<[1, 2, 3]>; // [2, 3, 1]

// 31. Recursive: repeat tuple N times
type RepeatTuple<T extends any[], N extends number, Acc extends any[] = []> =
  Acc["length"] extends N ? Acc : RepeatTuple<T, N, [...Acc, ...T]>;
type RT = RepeatTuple<[string, number], 3>;
// [string, number, string, number, string, number]

// 32. Recursive: type-safe path setter
type SetPath<T, P extends string, V> =
  P extends `${infer K}.${infer Rest}`
    ? K extends keyof T
      ? { [Q in keyof T]: Q extends K ? SetPath<T[Q], Rest, V> : T[Q] }
      : T
    : P extends keyof T
      ? { [Q in keyof T]: Q extends P ? V : T[Q] }
      : T;
type WithDebug = SetPath<AppState, "user.name", "Bob">;

// 33. Recursive: type-safe nested event map
type EventMap = {
  user: { login: { userId: string }; logout: { userId: string } };
  app:  { start: {}; stop: { reason: string } };
};
type FlatEventMap<T, Prefix extends string = ""> = {
  [K in keyof T & string]:
    T[K] extends object
      ? keyof T[K] extends never
        ? { type: `${Prefix}${K}`; payload: T[K] }
        : FlatEventMap<T[K], `${Prefix}${K}:`>[keyof FlatEventMap<T[K], `${Prefix}${K}:`>]
      : { type: `${Prefix}${K}`; payload: T[K] };
}[keyof T & string];

// 34. Recursive: type-safe config defaults
type WithDefaults<T, D> = {
  [K in keyof T | keyof D]:
    K extends keyof T
      ? K extends keyof D
        ? T[K] extends undefined ? D[K] : T[K]
        : T[K]
      : K extends keyof D ? D[K] : never;
};

// 35. Recursive: strongly typed JSON pointer traversal
type TraversePointer<T, P extends string> =
  P extends "" ? T :
  P extends `/${infer K}/${infer Rest}`
    ? K extends keyof T ? TraversePointer<T[K], `/${Rest}`> : never
    : P extends `/${infer K}`
    ? K extends keyof T ? T[K] : never
    : never;
type TP = TraversePointer<Config, "/db/host">; // string

// 36. Recursive: type-safe diff
type Diff<A, B> = {
  [K in keyof A | keyof B]:
    K extends keyof A & keyof B
      ? A[K] extends B[K] ? B[K] extends A[K] ? never : { from: A[K]; to: B[K] } : { from: A[K]; to: B[K] }
      : K extends keyof A ? { removed: A[K] }
      : K extends keyof B ? { added: B[K] }
      : never;
};

// 37. Recursive: validate deeply nested required fields
type RequiredDeep<T> = {
  [K in keyof T]-?: T[K] extends object ? RequiredDeep<T[K]> : T[K];
};

// 38. Recursive: transform all string values
type StringifyValues<T> =
  T extends string ? string :
  T extends number | boolean | null ? string :
  T extends (infer U)[] ? StringifyValues<U>[] :
  T extends object ? { [K in keyof T]: StringifyValues<T[K]> } : T;

// 39. Recursive: count depth of nested object
type Depth<T, Acc extends 0[] = []> =
  T extends object
    ? { [K in keyof T]: Depth<T[K], [...Acc, 0]> }[keyof T] | Acc["length"]
    : Acc["length"];

// 40. Recursive: build tuple from union (simplified)
type TupleFromUnion<U extends string, Acc extends string[] = []> =
  [U] extends [never] ? Acc :
  U extends infer H extends string
    ? TupleFromUnion<Exclude<U, H>, [...Acc, H]>
    : Acc;

// 41. Recursive: chain optional getters
type OptChain<T, Keys extends string[]> =
  Keys extends [infer K extends keyof T & string, ...infer Rest extends string[]]
    ? Rest extends []
      ? T[K] | undefined
      : OptChain<NonNullable<T[K]>, Rest> | undefined
    : T | undefined;
type OC = OptChain<AppState, ["user", "prefs", "theme"]>; // string | undefined

// 42. Recursive: typed Trie lookup result
type TrieLookup<T, Keys extends string[]> =
  Keys extends [infer K extends string & keyof T, ...infer Rest extends string[]]
    ? Rest extends [] ? T[K] : TrieLookup<T[K], Rest>
    : T;

// 43. Recursive: flatten union of objects
type FlattenUnion<T> =
  T extends object
    ? { [K in keyof T]: T[K] }
    : T;

// 44. Recursive: get all function-valued keys
type FunctionKeys<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];
class MyService {
  save(): void {}
  load(): string { return ""; }
  config = { debug: false };
}
type FK = FunctionKeys<MyService>; // "save" | "load"

// 45. Recursive: proxy-able type
type Proxied<T> = {
  [K in keyof T]: T[K] extends object ? Proxied<T[K]> : T[K];
} & { __isProxy: true };

// 46. Recursive: map function over nested values
type DeepMap<T, F extends (x: any) => any> =
  T extends (infer U)[] ? DeepMap<U, F>[] :
  T extends object ? { [K in keyof T]: DeepMap<T[K], F> } :
  F extends (x: T) => infer R ? R : T;

// 47. Recursive: compute tuple sum as type
type Add<A extends 0[], B extends 0[]> = [...A, ...B];
type Sum3 = Add<[0, 0], [0, 0, 0]>["length"]; // 5

// 48. Recursive: stringify tuple elements
type StringifyTuple<T extends any[]> =
  T extends [infer H, ...infer Rest]
    ? [`${H & (string | number | boolean)}`, ...StringifyTuple<Rest>]
    : [];
type ST2 = StringifyTuple<[1, "a", true]>; // ["1", "a", "true"]

// 49. Recursive: typed stack (push/pop)
type Stack<T extends any[]> = {
  push<V>(val: V): Stack<[V, ...T]>;
  pop(): T extends [any, ...infer Rest] ? { val: T[0]; stack: Stack<Rest> } : never;
  peek: T extends [infer H, ...any[]] ? H : undefined;
};

// 50. Recursive: build nested form state from schema
type FormField<T> = T extends string | number | boolean
  ? { value: T; error: string | null; touched: boolean }
  : T extends object
  ? { [K in keyof T]: FormField<T[K]> }
  : never;
type FormState<T> = FormField<T>;
type UserForm = FormState<{ name: string; address: { city: string; zip: string } }>;
// { name: FieldMeta; address: { city: FieldMeta; zip: FieldMeta } }
