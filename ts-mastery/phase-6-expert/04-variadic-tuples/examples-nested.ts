export {};

// ============================================================
// Phase 6 – Expert: Variadic Tuples — NESTED (1–50)
// ============================================================

// Core helpers
type Head<T extends unknown[]> = T extends [infer H, ...infer _] ? H : never;
type Tail<T extends unknown[]> = T extends [infer _, ...infer R] ? R : never;
type Last<T extends unknown[]> = T extends [...infer _, infer L] ? L : never;
type Init<T extends unknown[]> = T extends [...infer I, infer _] ? I : never;
type Concat<A extends unknown[], B extends unknown[]> = [...A, ...B];
type Reverse<T extends unknown[], Acc extends unknown[] = []> =
  T extends [infer H, ...infer R] ? Reverse<R, [H, ...Acc]> : Acc;
type BuildTuple<N extends number, T extends unknown[] = []> =
  T["length"] extends N ? T : BuildTuple<N, [...T, unknown]>;
type Add<A extends number, B extends number> = [...BuildTuple<A>, ...BuildTuple<B>]["length"] & number;
type Includes<T extends unknown[], V> =
  T extends [infer H, ...infer R]
    ? [H] extends [V] ? [V] extends [H] ? true : Includes<R, V> : Includes<R, V> : false;
type Take<T extends unknown[], N extends number, Acc extends unknown[] = []> =
  Acc["length"] extends N ? Acc : T extends [infer H, ...infer R] ? Take<R, N, [...Acc, H]> : Acc;
type Drop<T extends unknown[], N extends number, Acc extends unknown[] = []> =
  Acc["length"] extends N ? T : T extends [infer _, ...infer R] ? Drop<R, N, [...Acc, unknown]> : [];

// --- 1. Deeply nested tuple of tuples ---
type Matrix<Rows extends number[][]> = {
  [R in keyof Rows]: Rows[R]
};
type N1 = Matrix<[[1, 2, 3], [4, 5, 6], [7, 8, 9]]>;

// --- 2. Nested tuple transformation ---
type DeepMap<T extends unknown[][], F extends (x: unknown) => unknown> = {
  [R in keyof T]: { [C in keyof T[R]]: F extends (x: T[R][C]) => infer U ? U : never }
};
type N2 = DeepMap<[[1, 2], [3, 4]], (x: number) => string>;
// [[string,string],[string,string]]

// --- 3. Nested tuple zip ---
type ZipRows<A extends unknown[][], B extends unknown[][]> = {
  [R in keyof A]: R extends keyof B ? Zip<A[R], B[R]> : A[R]
};
type Zip<A extends unknown[], B extends unknown[]> =
  A extends [infer HA, ...infer RA] ? B extends [infer HB, ...infer RB]
    ? [[HA, HB], ...Zip<RA, RB>] : [] : [];
type N3 = ZipRows<[[1, 2], [3, 4]], [["a", "b"], ["c", "d"]]>;
// [[[1,"a"],[2,"b"]], [[3,"c"],[4,"d"]]]

// --- 4. Nested variadic function composition ---
type DeepCompose<Fns extends ((...args: unknown[]) => unknown)[][]> = {
  [Row in keyof Fns]: Fns[Row] extends ((...args: unknown[]) => unknown)[]
    ? (...args: Parameters<Fns[Row][0]>) => ReturnType<Fns[Row][number]>
    : never
};

// --- 5. Tuple of tuples flatten ---
type FlattenDepth<T extends unknown[], Depth extends number, Acc extends unknown[] = []> =
  Depth extends 0 ? T :
  T extends [infer H, ...infer R]
    ? H extends unknown[]
      ? FlattenDepth<[...H, ...R], Depth, Acc>
      : FlattenDepth<R, Depth, [...Acc, H]>
    : Acc;
type N5 = FlattenDepth<[[1, [2, [3]]], [4, [5]]], 2>; // [1, 2, 3, 4, 5] (approx)

// --- 6. Nested tuple state machine ---
type State = "idle" | "loading" | "success" | "error";
type Payload<S extends State> =
  S extends "idle" ? [] :
  S extends "loading" ? [url: string] :
  S extends "success" ? [data: unknown, timestamp: number] :
  S extends "error" ? [error: Error, retries: number] :
  [];
type StateTuple<S extends State> = [S, ...Payload<S>];
type N6_Idle = StateTuple<"idle">;    // ["idle"]
type N6_Load = StateTuple<"loading">; // ["loading", string]
type N6_Suc = StateTuple<"success">;  // ["success", unknown, number]
type N6_Err = StateTuple<"error">;    // ["error", Error, number]

// --- 7. Nested pipeline types ---
type Pipeline<Input, Stages extends ((x: unknown) => unknown)[]> =
  Stages extends [infer F extends (x: Input) => infer R, ...infer Rest extends ((x: unknown) => unknown)[]]
    ? Pipeline<R, Rest>
    : Input;
type N7 = Pipeline<string, [(s: string) => number, (n: number) => boolean]>;
// boolean

// --- 8. Type-level matrix transpose ---
type Transpose<M extends unknown[][]> =
  M extends [] ? [] :
  M[0] extends unknown[] ? {
    [C in keyof M[0]]: { [R in keyof M]: M[R][C & number] }
  } : never;
type N8 = Transpose<[[1, 2, 3], [4, 5, 6]]>;
// [[1,4],[2,5],[3,6]]

// --- 9. Nested destructuring types ---
type DestructureNested<T extends unknown[][]> =
  T extends [infer Row extends unknown[], ...infer Rest extends unknown[][]]
    ? [...Row, ...DestructureNested<Rest>]
    : [];
type N9 = DestructureNested<[[1, 2], [3, 4], [5]]>; // [1,2,3,4,5]

// --- 10. Variadic tuple CRUD operations ---
type CrudTuple<T extends unknown[]> = {
  create: <V>(v: V) => [...T, V];
  read: <I extends number>(i: I) => T[I];
  update: <I extends number>(i: I, v: T[I]) => T;
  delete: <I extends number>(i: I) => [...Take<T, I>, ...Drop<T, Add<I, 1>>];
};

// --- 11. Nested applicative functor ---
type Apply2D<Fs extends ((x: unknown) => unknown)[][], Values extends unknown[][]> = {
  [R in keyof Fs]: {
    [C in keyof Fs[R]]: Fs[R][C] extends (x: Values[R & number][C & number]) => infer Result ? Result : never
  }
};

// --- 12. Type-safe variadic record ---
type VariadicRecord<Keys extends string[], Values extends unknown[]> =
  Keys extends [infer K extends string, ...infer KRest extends string[]]
    ? Values extends [infer V, ...infer VRest]
      ? Record<K, V> & VariadicRecord<KRest, VRest>
      : {}
    : {};
type N12 = VariadicRecord<["a", "b", "c"], [number, string, boolean]>;
// {a:number; b:string; c:boolean}

// --- 13. Nested tuple accumulator ---
class NestedAccumulator<Outer extends unknown[][], Inner extends unknown[] = []> {
  private rows: unknown[][] = [];
  private currentRow: unknown[] = [];
  addItem<V>(v: V): NestedAccumulator<Outer, [...Inner, V]> {
    const next = new NestedAccumulator<Outer, [...Inner, V]>();
    (next as unknown as { rows: unknown[][]; currentRow: unknown[] }).rows = this.rows;
    (next as unknown as { rows: unknown[][]; currentRow: unknown[] }).currentRow = [...this.currentRow, v];
    return next;
  }
  closeRow(): NestedAccumulator<[...Outer, Inner], []> {
    const next = new NestedAccumulator<[...Outer, Inner], []>();
    (next as unknown as { rows: unknown[][] }).rows = [...this.rows, this.currentRow];
    return next;
  }
  build(): Outer { return this.rows as Outer; }
}

// --- 14. Variadic tuple codec with nesting ---
type Codec<T> = { encode: (v: T) => string; decode: (s: string) => T };
type TupleCodec<T extends unknown[]> = { [K in keyof T]: Codec<T[K]> };
function composeTupleCodec<T extends unknown[]>(...codecs: TupleCodec<T>): Codec<T> {
  return {
    encode: v => "[" + codecs.map((c, i) => (c as Codec<unknown>).encode(v[i])).join(",") + "]",
    decode: s => {
      const parts = JSON.parse(s) as unknown[];
      return codecs.map((c, i) => (c as Codec<unknown>).decode(String(parts[i]))) as T;
    },
  };
}

// --- 15. Nested event chain types ---
type EventChain<Events extends [string, unknown][]> = {
  [K in keyof Events]: {
    from: Events[K][0];
    payload: Events[K][1];
    triggers: K extends `${infer N extends number}` ? N extends Events["length"] ? never : Events[N] : never;
  }
};

// --- 16. Type-safe variadic template literal ---
type JoinStrings<T extends string[], Sep extends string = ""> =
  T extends [infer H extends string] ? H :
  T extends [infer H extends string, ...infer Rest extends string[]]
    ? `${H}${Sep}${JoinStrings<Rest, Sep>}`
    : "";
type N16_A = JoinStrings<["Hello", "World"]>;     // "HelloWorld"
type N16_B = JoinStrings<["a", "b", "c"], "-">;   // "a-b-c"
type N16_C = JoinStrings<["api", "v1", "users"], "/">;  // "api/v1/users"

// --- 17. Nested tuple conditional types ---
type NestedFilter<T extends unknown[][], Pred extends unknown> = {
  [R in keyof T]: T[R] extends unknown[] ? { [C in keyof T[R] as T[R][C] extends Pred ? C : never]: T[R][C] } : never
};

// --- 18. Variadic type-safe serialization ---
type Serializable = string | number | boolean | null;
type SerializableTuple<T extends Serializable[]> = T;
type DeepSerializable<T extends unknown[][]> = {
  [R in keyof T]: T[R] extends unknown[] ? T[R][number] extends Serializable ? T[R] : never : never
};

// --- 19. Nested tuple as type-safe matrix operations ---
type MatMul<A extends number[][], B extends number[][]> = {
  [R in keyof A]: {
    [C in keyof B[0]]: number
  }
};
type N19 = MatMul<[[1, 2], [3, 4]], [[5, 6], [7, 8]]>;
// [[number,number],[number,number]]

// --- 20. Type-level function composition tree ---
type CompTree<Root, Left, Right> = {
  root: Root;
  left: Left;
  right: Right;
};
type EvalCompTree<T> =
  T extends CompTree<(a: infer A) => infer B, infer L, infer R>
    ? EvalCompTree<L> extends (a: infer LA) => A
      ? EvalCompTree<R> extends (a: B) => infer RB
        ? (a: LA) => RB
        : (a: LA) => B
      : (a: A) => B
    : T;

// --- 21. Nested recursive tuple processing ---
type RecursiveMap<T extends unknown[], F extends (x: unknown) => unknown> =
  T extends [infer H, ...infer Rest]
    ? H extends unknown[]
      ? [RecursiveMap<H, F>, ...RecursiveMap<Rest, F>]
      : [F extends (x: H) => infer R ? R : never, ...RecursiveMap<Rest, F>]
    : [];
type N21 = RecursiveMap<[1, [2, [3, 4]], 5], (x: number) => string>;
// [string, [string, [string, string]], string]

// --- 22. Variadic event bus with wildcard ---
type EventMap = {
  "app:start": [];
  "app:stop": [];
  "user:login": [userId: string];
  "user:logout": [userId: string];
  "data:fetch": [url: string, method: string];
  "data:error": [url: string, error: Error];
};
type WildcardMatch<Pattern extends string, Event extends keyof EventMap> =
  Pattern extends `${infer NS}:*` ? Event extends `${NS}:${string}` ? Event : never : never;
type N22_UserEvents = WildcardMatch<"user:*", keyof EventMap>; // "user:login" | "user:logout"

// --- 23. Nested parameter decorators ---
type Param<T> = { type: T; required: boolean; description?: string };
type ParamTuple<T extends unknown[]> = { [K in keyof T]: Param<T[K]> };
function defineParams<T extends unknown[]>(...params: ParamTuple<T>): ParamTuple<T> {
  return params;
}
const N23_params = defineParams<[number, string, boolean]>(
  { type: 0 as number, required: true, description: "id" },
  { type: "" as string, required: true, description: "name" },
  { type: false as boolean, required: false, description: "active" }
);

// --- 24. Nested promise chain types ---
type PromiseChain<T extends unknown[]> =
  T extends [infer H, ...infer Rest]
    ? Promise<H extends Promise<infer V> ? V & PromiseChain<Rest> : H & PromiseChain<Rest>>
    : Promise<unknown>;

// --- 25. Type-safe variadic class mixin ---
type Constructor<T = {}> = new (...args: unknown[]) => T;
type GConstructor<T = {}> = new (...args: unknown[]) => T;
type Mixin<T extends Constructor[]> = T extends [infer H extends Constructor, ...infer Rest extends Constructor[]]
  ? InstanceType<H> & Mixin<Rest> : {};
function applyMixins<T extends Constructor[]>(...ctors: T): Constructor<Mixin<T>> {
  return class {
    constructor() {
      for (const Ctor of ctors) Object.assign(this, new (Ctor as Constructor)());
    }
  } as Constructor<Mixin<T>>;
}

// --- 26. Tuple as typed linked list ---
type Cons<H, T extends unknown[]> = [H, ...T];
type Nil = [];
type LinkedList<T> = Nil | Cons<T, LinkedList<T>>;
type ListHead<L extends LinkedList<unknown>> = L extends Cons<infer H, infer _> ? H : never;
type ListTail<L extends LinkedList<unknown>> = L extends Cons<infer _, infer T extends LinkedList<unknown>> ? T : Nil;
type N26_List = Cons<1, Cons<2, Cons<3, Nil>>>; // [1, 2, 3]
type N26_H = ListHead<N26_List>; // 1
type N26_T = ListTail<N26_List>; // [2, 3]

// --- 27. Nested variadic intersection types ---
type IntersectAll<T extends object[]> = T extends [infer H extends object, ...infer Rest extends object[]]
  ? H & IntersectAll<Rest> : {};
type N27 = IntersectAll<[{ a: 1 }, { b: 2 }, { c: 3 }, { d: 4 }]>;
// {a:1;b:2;c:3;d:4}

// --- 28. Nested tuple merge with priority ---
type MergeTuples<T extends unknown[][]> =
  T extends [infer H extends unknown[], ...infer Rest extends unknown[][]]
    ? H extends [] ? MergeTuples<Rest> :
      H extends [infer HH, ...infer HR]
        ? [HH, ...MergeTuples<[HR, ...Rest]>]
        : MergeTuples<Rest>
    : [];
type N28 = MergeTuples<[[1, 2], [3, 4], [5]]>; // [1, 2, 3, 4, 5]

// --- 29. Type-safe variadic dependency injection ---
type DIToken<T> = { _type: T; _id: symbol };
type DITuple<Tokens extends DIToken<unknown>[]> = {
  [K in keyof Tokens]: Tokens[K] extends DIToken<infer T> ? T : never
};
function inject<Tokens extends DIToken<unknown>[]>(
  container: Map<symbol, unknown>,
  tokens: Tokens
): DITuple<Tokens> {
  return tokens.map(t => container.get(t._id)) as DITuple<Tokens>;
}

// --- 30. Nested tuple with type-level validation ---
type ValidateNested<T extends unknown[][]> = {
  [R in keyof T]: T[R] extends number[] ? "valid" : "invalid"
};
type N30 = ValidateNested<[[1, 2, 3], ["a", "b"], [4, 5]]>;
// ["valid", "invalid", "valid"]

// --- 31. Multi-dimensional tuple type ---
type Tensor<T, Shape extends number[]> =
  Shape extends [infer N extends number, ...infer Rest extends number[]]
    ? Rest extends [] ? T[] : Tensor<T, Rest>[]
    : T;
type Vector3 = Tensor<number, [3]>;         // number[]
type Matrix3x3 = Tensor<number, [3, 3]>;    // number[][]
type Tensor3D = Tensor<number, [2, 3, 4]>;  // number[][][]

// --- 32. Nested applicative tuple ---
type TupleAp<Fs extends ((x: unknown) => unknown)[], Xs extends unknown[]> = {
  [K in keyof Fs]: Fs[K] extends (x: Xs[K & number]) => infer R ? R : never
};
type N32 = TupleAp<[(n: number) => string, (s: string) => boolean], [number, string]>;
// [string, boolean]

// --- 33. Variadic constraint propagation ---
type Constrain<T extends unknown[], Constraint extends (x: unknown) => boolean, Acc extends unknown[] = []> =
  T extends [infer H, ...infer R]
    ? Constrain<R, Constraint, [...Acc, H]>
    : Acc;

// --- 34. Nested tuple comparison ---
type TupleCompare<A extends unknown[], B extends unknown[]> =
  A extends [] ? B extends [] ? "equal" : "less" :
  B extends [] ? "greater" :
  A extends [infer HA, ...infer RA] ? B extends [infer HB, ...infer RB]
    ? [HA] extends [HB] ? [HB] extends [HA] ? TupleCompare<RA, RB> : "less" : "greater"
    : never : never;
type N34_E = TupleCompare<[1, 2, 3], [1, 2, 3]>; // "equal"
type N34_L = TupleCompare<[1, 2], [1, 3]>;        // "less"

// --- 35. Nested tuple type safe update ---
type TupleUpdate<T extends unknown[], I extends number, V> = {
  [K in keyof T]: K extends `${I}` ? V : T[K]
};
type N35 = TupleUpdate<[1, 2, 3, 4], 2, "replaced">;
// [1, 2, "replaced", 4]

// --- 36. Variadic type-safe function composition with error handling ---
type ResultPipeline<T extends unknown[], E> = {
  [K in keyof T]: T[K] | { error: E }
};
function resultPipe<A, B, E>(
  value: A | { error: E },
  fn: (a: A) => B | { error: E }
): B | { error: E } {
  if (typeof value === "object" && value !== null && "error" in value) return value;
  return fn(value as A);
}

// --- 37. Nested recursive type inference ---
type RecursiveInfer<T extends unknown[]> = T extends [infer H, ...infer Rest]
  ? { head: H; tail: RecursiveInfer<Rest extends unknown[] ? Rest : []> }
  : { empty: true };
type N37 = RecursiveInfer<[1, 2, 3]>;
// {head:1; tail:{head:2; tail:{head:3; tail:{empty:true}}}}

// --- 38. Variadic type-safe event source ---
type EventSource<Events extends [string, unknown, unknown][]> = {
  [K in Events[number] as K[0]]: {
    payload: K[1];
    result: K[2];
  }
};
type N38 = EventSource<[
  ["user.create", { name: string }, { id: number }],
  ["post.publish", { postId: number }, boolean]
]>;

// --- 39. Nested tuple HOF ---
type HigherOrder<T extends ((...args: unknown[]) => unknown)[]> = {
  [K in keyof T]: T[K] extends (...args: infer P) => infer R ? (fn: T[K]) => (...args: P) => R : never
};

// --- 40. Type-safe variadic builder ---
class NestedBuilder<Outer extends unknown[] = [], Inner extends unknown[] = []> {
  private outerData: unknown[] = [];
  private innerData: unknown[] = [];
  outer<V>(v: V): NestedBuilder<[...Outer, V], Inner> {
    const nb = new NestedBuilder<[...Outer, V], Inner>();
    (nb as unknown as { outerData: unknown[] }).outerData = [...this.outerData, v];
    (nb as unknown as { innerData: unknown[] }).innerData = this.innerData;
    return nb;
  }
  inner<V>(v: V): NestedBuilder<Outer, [...Inner, V]> {
    const nb = new NestedBuilder<Outer, [...Inner, V]>();
    (nb as unknown as { outerData: unknown[] }).outerData = this.outerData;
    (nb as unknown as { innerData: unknown[] }).innerData = [...this.innerData, v];
    return nb;
  }
  build(): { outer: Outer; inner: Inner } {
    return { outer: this.outerData as Outer, inner: this.innerData as Inner };
  }
}
const N40 = new NestedBuilder()
  .outer("a").outer("b")
  .inner(1).inner(2).inner(3)
  .build();
type N40_T = typeof N40; // {outer: [string, string]; inner: [number, number, number]}

// --- 41. Tuple-based tree structure ---
type TreeTuple<T> = T | [T, ...TreeTuple<T>[]];
type N41_Tree = TreeTuple<number>;
const N41_tree: TreeTuple<number> = [1, [2, 3, [4, 5]], [6, 7]];

// --- 42. Nested variadic type-safe assertion ---
function assertAllTuples<T extends unknown[][]>(
  values: T,
  ...validators: { [K in keyof T]: (v: T[K]) => boolean }
): boolean {
  return values.every((v, i) => (validators[i] as (x: unknown) => boolean)(v));
}

// --- 43. Tuple as type-safe pair ---
type Pair<A, B> = [A, B];
type PairMap<T extends Pair<unknown, unknown>[], F extends (a: unknown) => unknown, G extends (b: unknown) => unknown> = {
  [K in keyof T]: T[K] extends Pair<infer A, infer B> ? Pair<F extends (a: A) => infer R ? R : never, G extends (b: B) => infer S ? S : never> : never
};
type N43 = PairMap<[[1, "a"], [2, "b"]], (n: number) => string, (s: string) => number>;
// [[string, number], [string, number]]

// --- 44. Nested variadic reduce ---
type NestedReduce<T extends unknown[][], Acc extends unknown = 0> =
  T extends [infer Row extends unknown[], ...infer Rest extends unknown[][]]
    ? NestedReduce<Rest, [...(Acc extends unknown[] ? Acc : [Acc]), ...Row]>
    : Acc;

// --- 45. Variadic type-safe data pipeline ---
class DataPipeline<T extends unknown[]> {
  private stages: ((data: unknown[]) => unknown[])[] = [];
  map<U>(fn: (v: T[number]) => U): DataPipeline<{ [K in keyof T]: U }> {
    const dp = new DataPipeline<{ [K in keyof T]: U }>();
    (dp as unknown as { stages: unknown[] }).stages = [...this.stages, (data: unknown[]) => data.map(fn)];
    return dp;
  }
  filter(pred: (v: T[number]) => boolean): DataPipeline<T> {
    const dp = new DataPipeline<T>();
    (dp as unknown as { stages: unknown[] }).stages = [...this.stages, (data: unknown[]) => data.filter(pred)];
    return dp;
  }
  run(input: T): unknown[] { return this.stages.reduce((data, stage) => stage(data), input as unknown[]); }
}
const N45_pipeline = new DataPipeline<[number, number, number]>()
  .filter(n => n > 1)
  .map(n => n * 2);

// --- 46. Nested tuple monad chain ---
type Chain<T extends unknown[], F extends (x: unknown) => unknown[]> = {
  [K in keyof T]: F extends (x: T[K]) => infer R extends unknown[] ? R[number] : never
}[number][];
type N46 = Chain<[1, 2, 3], (n: number) => [number, string]>; // (number | string)[]

// --- 47. Variadic type-safe serialization format ---
type Format<T extends unknown[]> = {
  version: number;
  data: T;
  checksum: string;
};
function serialize<T extends unknown[]>(data: T, version = 1): Format<T> {
  const json = JSON.stringify(data);
  const checksum = json.length.toString(16);
  return { version, data, checksum };
}
function deserialize<T extends unknown[]>(format: Format<T>): T {
  return format.data;
}

// --- 48. Nested tuple equality with structural comparison ---
type DeepTupleEq<A, B> =
  A extends unknown[] ? B extends unknown[] ?
    A["length"] extends B["length"] ?
      A extends [infer HA, ...infer RA] ? B extends [infer HB, ...infer RB]
        ? DeepTupleEq<HA, HB> extends true ? DeepTupleEq<RA, RB> : false
        : false
      : true
    : false
  : false : [A] extends [B] ? [B] extends [A] ? true : false : false;
type N48_T = DeepTupleEq<[1, [2, 3]], [1, [2, 3]]>; // true
type N48_F = DeepTupleEq<[1, [2, 3]], [1, [2, 4]]>; // false

// --- 49. Multi-level nested type inference ---
type InferNested<T extends unknown[][][]> = {
  [L1 in keyof T]: T[L1] extends unknown[][]
    ? { [L2 in keyof T[L1]]: T[L1][L2] extends unknown[] ? T[L1][L2][number] : never }
    : never
};

// --- 50. Full nested variadic system ---
type FullSystem<
  Inputs extends unknown[],
  Transforms extends ((x: unknown) => unknown)[],
  Validators extends ((x: unknown) => boolean)[],
  Output extends unknown[]
> = {
  inputs: Inputs;
  transforms: Transforms;
  validators: Validators;
  run: () => Output;
};
class FullVariadicSystem<I extends unknown[], T extends unknown[], O extends unknown[]> {
  private transformFns: ((x: unknown) => unknown)[] = [];
  private validatorFns: ((x: unknown) => boolean)[] = [];
  constructor(private inputs: I) {}
  transform<U>(fn: (x: I[number]) => U): FullVariadicSystem<I, [...T, U], O> {
    const sys = new FullVariadicSystem<I, [...T, U], O>(this.inputs);
    (sys as unknown as { transformFns: unknown[] }).transformFns = [...this.transformFns, fn];
    return sys;
  }
  validate(fn: (x: unknown) => boolean): this {
    this.validatorFns.push(fn);
    return this;
  }
  run(): unknown[] {
    return this.inputs
      .filter(v => this.validatorFns.every(f => f(v)))
      .map(v => this.transformFns.reduce((acc, fn) => fn(acc), v));
  }
}
const N50_system = new FullVariadicSystem([1, 2, 3, 4, 5, 6])
  .validate(n => (n as number) % 2 === 0)
  .transform(n => (n as number) * 2)
  .transform(n => `value: ${n}`);
const N50_result = N50_system.run(); // ["value: 4", "value: 8", "value: 12"]
