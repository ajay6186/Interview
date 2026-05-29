export {};

// ── Basic Recursive Type Examples ─────────────────────────────────────────────

// 1. Simple recursive list
type List<T> = { head: T; tail: List<T> } | null;
const nums: List<number> = { head: 1, tail: { head: 2, tail: null } };

// 2. Recursive tree node
type TreeNode<T> = { value: T; left: TreeNode<T> | null; right: TreeNode<T> | null };
const tree: TreeNode<number> = { value: 1, left: null, right: null };

// 3. Recursive JSON value
type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };
const json: JSONValue = { name: "Alice", scores: [1, 2, 3], meta: { active: true } };

// 4. Recursive DeepPartial
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };
type Config = { db: { host: string; port: number }; app: { name: string; debug: boolean } };
const partial: DeepPartial<Config> = { db: { host: "localhost" } };

// 5. Recursive DeepReadonly
type DeepReadonly<T> = { readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K] };
type FrozenConfig = DeepReadonly<Config>;

// 6. Recursive DeepRequired
type DeepRequired<T> = { [K in keyof T]-?: T[K] extends object ? DeepRequired<T[K]> : T[K] };

// 7. Recursive array flattening type
type Flatten<T> = T extends (infer U)[] ? Flatten<U> : T;
type F1 = Flatten<string[][][]>; // string
type F2 = Flatten<number[]>;     // number

// 8. Recursive Promise unwrap
type DeepAwaited<T> = T extends Promise<infer U> ? DeepAwaited<U> : T;
type DA = DeepAwaited<Promise<Promise<string>>>; // string

// 9. Tuple head extraction via recursive infer
type Head<T extends any[]> = T extends [infer H, ...any[]] ? H : never;
type TH = Head<[string, number, boolean]>; // string

// 10. Tuple tail via recursive infer
type Tail<T extends any[]> = T extends [any, ...infer T2] ? T2 : never;
type TT = Tail<[string, number, boolean]>; // [number, boolean]

// 11. Recursive Reverse tuple
type Reverse<T extends any[], Acc extends any[] = []> =
  T extends [infer H, ...infer Rest] ? Reverse<Rest, [H, ...Acc]> : Acc;
type RV = Reverse<[1, 2, 3]>; // [3, 2, 1]

// 12. Recursive tuple length via counter
type TupleOf<T, N extends number, Acc extends T[] = []> =
  Acc["length"] extends N ? Acc : TupleOf<T, N, [...Acc, T]>;
type ThreeStrings = TupleOf<string, 3>; // [string, string, string]

// 13. Recursive Prepend
type Prepend<T, Arr extends any[]> = [T, ...Arr];
type Pre = Prepend<string, [number, boolean]>; // [string, number, boolean]

// 14. Recursive Append
type Append<Arr extends any[], T> = [...Arr, T];
type App = Append<[string, number], boolean>; // [string, number, boolean]

// 15. Recursive Concat two tuples
type ConcatTuples<A extends any[], B extends any[]> = [...A, ...B];
type CT = ConcatTuples<[1, 2], [3, 4]>; // [1, 2, 3, 4]

// 16. Recursive optional chain type
type DeepOptional<T> = T extends object
  ? { [K in keyof T]?: DeepOptional<T[K]> }
  : T | undefined;

// 17. Recursive nullable wrapper
type DeepNullable<T> = T extends object
  ? { [K in keyof T]: DeepNullable<T[K]> | null }
  : T | null;

// 18. Recursive type for binary tree
type BinTree<T> = { val: T; left?: BinTree<T>; right?: BinTree<T> };
const bt: BinTree<string> = { val: "root", left: { val: "L" }, right: { val: "R" } };

// 19. Recursive linked list traversal type
type ListLength<L extends List<any>, N extends 0[] = []> =
  L extends null ? N["length"] : ListLength<L["tail"], [...N, 0]>;

// 20. Recursive path union from nested object
type Paths<T, Prefix extends string = ""> = {
  [K in keyof T & string]:
    T[K] extends object
      ? Paths<T[K], `${Prefix}${K}.`> | `${Prefix}${K}`
      : `${Prefix}${K}`;
}[keyof T & string];
type ConfigPaths = Paths<Config>; // "db" | "db.host" | "db.port" | "app" | "app.name" | "app.debug"

// 21. Recursive value at path
type GetAtPath<T, P extends string> =
  P extends `${infer K}.${infer Rest}`
    ? K extends keyof T ? GetAtPath<T[K], Rest> : never
    : P extends keyof T ? T[P] : never;
type DBHost = GetAtPath<Config, "db.host">; // string

// 22. Recursive type: nested record
type NestedRecord<Keys extends string[], V> =
  Keys extends [infer K extends string, ...infer Rest extends string[]]
    ? { [P in K]: NestedRecord<Rest, V> }
    : V;
type NR = NestedRecord<["a", "b", "c"], number>; // { a: { b: { c: number } } }

// 23. Recursive Omit deep
type DeepOmit<T, K extends string> = {
  [P in keyof T as P extends K ? never : P]:
    T[P] extends object ? DeepOmit<T[P], K> : T[P];
};

// 24. Recursive union of keys
type AllKeys<T> = T extends object ? keyof T | AllKeys<T[keyof T]> : never;

// 25. Recursive function unwrap
type UnwrapFn<F> = F extends (...args: any[]) => infer R
  ? R extends (...args: any[]) => any ? UnwrapFn<R> : R
  : F;
type UF = UnwrapFn<() => () => () => string>; // string

// 26. Recursive type: conditional branch
type IsLeaf<T> = T extends { children: any[] } ? false : true;
type LeafNode = { value: string };
type BranchNode = { value: string; children: BranchNode[] };
type IL1 = IsLeaf<LeafNode>;   // true
type IL2 = IsLeaf<BranchNode>; // false

// 27. Recursive array to union
type ArrayToUnion<T extends any[]> =
  T extends [infer H, ...infer Rest] ? H | ArrayToUnion<Rest> : never;
type AU = ArrayToUnion<[string, number, boolean]>; // string | number | boolean

// 28. Recursive union member count via tuple accumulation
type UnionToTupleSimple<U, Acc extends any[] = []> =
  [U] extends [never] ? Acc : never; // simplified

// 29. Recursive object merge
type DeepMerge<A, B> = {
  [K in keyof A | keyof B]:
    K extends keyof B
      ? K extends keyof A
        ? A[K] extends object
          ? B[K] extends object
            ? DeepMerge<A[K], B[K]>
            : B[K]
          : B[K]
        : B[K]
      : K extends keyof A ? A[K] : never;
};
type DM = DeepMerge<{ a: { x: number }; b: string }, { a: { y: string }; c: boolean }>;
// { a: { x: number; y: string }; b: string; c: boolean }

// 30. Recursive array map type
type MapArray<T extends any[], F extends (x: any) => any> =
  T extends [infer H, ...infer Rest]
    ? [F extends (x: H) => infer R ? R : never, ...MapArray<Rest, F>]
    : [];

// 31. Recursive conditional: unwrap nested Box
type Box<T> = { value: T };
type UnwrapBox<T> = T extends Box<infer V> ? UnwrapBox<V> : T;
type UBR = UnwrapBox<Box<Box<Box<string>>>>; // string

// 32. Recursive type for nested array element access
type ElementAt<T extends any[], N extends number> =
  T extends [infer H, ...infer Rest]
    ? N extends 0 ? H : ElementAt<Rest, N extends 0 ? never : number>
    : never;

// 33. Recursive: all values of nested object
type DeepValues<T> = T extends object ? DeepValues<T[keyof T]> : T;
type DV = DeepValues<{ a: { b: string; c: number }; d: boolean }>; // string | number | boolean

// 34. Recursive last element of tuple
type Last<T extends any[]> = T extends [...any[], infer L] ? L : never;
type L1 = Last<[string, number, boolean]>; // boolean

// 35. Recursive init (all but last) of tuple
type Init<T extends any[]> = T extends [...infer I, any] ? I : never;
type I1 = Init<[string, number, boolean]>; // [string, number]

// 36. Recursive type for expression AST
type Expr =
  | { kind: "num"; value: number }
  | { kind: "add"; left: Expr; right: Expr }
  | { kind: "mul"; left: Expr; right: Expr };
const expr: Expr = { kind: "add", left: { kind: "num", value: 1 }, right: { kind: "num", value: 2 } };

// 37. Recursive type: enforce max nesting depth
type MaxDepth<T, D extends 0[] = []> =
  D["length"] extends 3
    ? T
    : T extends object
    ? { [K in keyof T]: MaxDepth<T[K], [...D, 0]> }
    : T;

// 38. Recursive: split string to char array
type Chars<S extends string> =
  S extends `${infer C}${infer Rest}` ? [C, ...Chars<Rest>] : [];
type CH = Chars<"abc">; // ["a", "b", "c"]

// 39. Recursive: join char array to string
type Join<T extends string[], Sep extends string = ""> =
  T extends [infer H extends string] ? H :
  T extends [infer H extends string, ...infer R extends string[]]
    ? `${H}${Sep}${Join<R, Sep>}`
    : "";
type JO = Join<["a", "b", "c"], "-">; // "a-b-c"

// 40. Recursive: tuple to object (indexed)
type TupleToObject<T extends readonly any[]> = { [K in keyof T]: T[K] };
type TTO = TupleToObject<readonly [string, number, boolean]>;

// 41. Recursive: flatten one level of nested arrays
type FlatOne<T extends any[]> =
  T extends [infer H, ...infer Rest]
    ? H extends any[] ? [...H, ...FlatOne<Rest>] : [H, ...FlatOne<Rest>]
    : [];
type FO = FlatOne<[[1, 2], [3, 4], [5]]>; // [1, 2, 3, 4, 5]

// 42. Recursive: union of tuple elements
type TupleUnion<T extends any[]> = T[number];
type TU = TupleUnion<[string, number, boolean]>; // string | number | boolean

// 43. Recursive: count tuple elements
type Count<T extends any[], Acc extends 0[] = []> =
  T extends [any, ...infer Rest] ? Count<Rest, [...Acc, 0]> : Acc["length"];
type C1 = Count<[string, number, boolean]>; // 3

// 44. Recursive: filter tuple elements by type
type Filter<T extends any[], U> =
  T extends [infer H, ...infer Rest]
    ? H extends U ? [H, ...Filter<Rest, U>] : Filter<Rest, U>
    : [];
type FIL = Filter<[string, number, string, boolean, number], string>; // [string, string]

// 45. Recursive: zip two tuples
type Zip<A extends any[], B extends any[]> =
  A extends [infer AH, ...infer AT]
    ? B extends [infer BH, ...infer BT]
      ? [[AH, BH], ...Zip<AT, BT>]
      : []
    : [];
type ZP = Zip<[1, 2], ["a", "b"]>; // [[1, "a"], [2, "b"]]

// 46. Recursive: nth element of tuple
type Nth<T extends any[], N extends number, Acc extends 0[] = []> =
  T extends [infer H, ...infer Rest]
    ? Acc["length"] extends N ? H : Nth<Rest, N, [...Acc, 0]>
    : never;
type N0 = Nth<[string, number, boolean], 1>; // number

// 47. Recursive: tuple includes type check
type Includes<T extends any[], U> =
  T extends [infer H, ...infer Rest] ? H extends U ? true : Includes<Rest, U> : false;
type IN1 = Includes<[string, number, boolean], number>; // true
type IN2 = Includes<[string, number, boolean], Date>;   // false

// 48. Recursive: unique elements from tuple
type Unique<T extends any[], Acc extends any[] = []> =
  T extends [infer H, ...infer Rest]
    ? Includes<Acc, H> extends true ? Unique<Rest, Acc> : Unique<Rest, [...Acc, H]>
    : Acc;
type UQ = Unique<[1, 2, 1, 3, 2, 4]>; // [1, 2, 3, 4]

// 49. Recursive type: convert union to intersection
type UnionToIntersection<U> =
  (U extends any ? (x: U) => void : never) extends (x: infer I) => void ? I : never;
type UI2 = UnionToIntersection<{ a: string } | { b: number }>; // { a: string } & { b: number }

// 50. Recursive: full DOM-like tree type
type DOMNode = {
  tag: string;
  attrs?: Record<string, string>;
  children?: DOMNode[];
  text?: string;
};
const dom: DOMNode = {
  tag: "div",
  attrs: { class: "container" },
  children: [
    { tag: "h1", text: "Title" },
    { tag: "p", children: [{ tag: "span", text: "Hello" }] }
  ]
};
