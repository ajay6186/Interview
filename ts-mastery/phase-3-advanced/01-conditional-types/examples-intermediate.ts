export {};

// ── Intermediate Conditional Type Examples ───────────────────────────────────

// 1. Distributive vs non-distributive conditional
type Distributive<T> = T extends string ? "string" : "other";
type NonDistributive<T> = [T] extends [string] ? "string" : "other";
type DA = Distributive<string | number>;    // "string" | "other"
type NDA = NonDistributive<string | number>; // "other" (treated as tuple)

// 2. Infer in return position
type UnwrapFn<T> = T extends (...args: any[]) => infer R ? R : never;
type FnReturn = UnwrapFn<(x: number) => string>; // string

// 3. Infer in parameter position
type FirstParam<T> = T extends (first: infer F, ...args: any[]) => any ? F : never;
type FP = FirstParam<(name: string, age: number) => void>; // string

// 4. Infer in Promise
type AwaitedValue<T> = T extends Promise<infer U> ? AwaitedValue<U> : T;
type AV = AwaitedValue<Promise<Promise<string>>>; // string (recursive)

// 5. Infer nested array element
type DeepElement<T> = T extends (infer U)[] ? DeepElement<U> : T;
type DE = DeepElement<number[][][]>; // number

// 6. Infer constructor params
type CtorParams<T> = T extends new (...args: infer P) => any ? P : never;
class MyClass2 { constructor(public x: string, public y: number) {} }
type MP = CtorParams<typeof MyClass2>; // [string, number]

// 7. Infer instance type
type InferInstance<T> = T extends new (...args: any[]) => infer I ? I : never;
type MC = InferInstance<typeof MyClass2>; // MyClass2

// 8. Union distribution to build payload map
type Events =
  | { type: "click"; x: number; y: number }
  | { type: "keydown"; key: string }
  | { type: "focus"; target: string };
type EventMap = { [E in Events as E["type"]]: Omit<E, "type"> };
// { click: { x: number; y: number }; keydown: { key: string }; focus: { target: string } }

// 9. Filter union to only those extending a shape
type FilterUnion<U, Shape> = U extends Shape ? U : never;
type StringEvents = FilterUnion<Events, { type: "click" | "keydown" }>;
// { type: "click"; ... } | { type: "keydown"; ... }

// 10. Extract event by type
type EventOf<E extends Events, K extends E["type"]> = Extract<E, { type: K }>;
type ClickEvent = EventOf<Events, "click">; // { type: "click"; x: number; y: number }

// 11. Conditional mapped type: transform values
type Nullify<T> = { [K in keyof T]: T[K] | null };
type Stringify2<T> = { [K in keyof T]: T[K] extends number ? string : T[K] };
type User = { name: string; age: number; active: boolean };
type StringifiedUser = Stringify2<User>; // { name: string; age: string; active: boolean }

// 12. Deep conditional mapped type
type DeepStringify<T> = T extends object
  ? { [K in keyof T]: DeepStringify<T[K]> }
  : T extends number ? string : T;

// 13. Conditional Pick
type ConditionalPick<T, V> = Pick<T, { [K in keyof T]: T[K] extends V ? K : never }[keyof T]>;
type Strings = ConditionalPick<User, string>; // { name: string }

// 14. Conditional Omit
type ConditionalOmit<T, V> = Pick<T, { [K in keyof T]: T[K] extends V ? never : K }[keyof T]>;
type NoStrings = ConditionalOmit<User, string>; // { age: number; active: boolean }

// 15. Overloaded function conditional return
function convert<T extends string | number>(
  val: T
): T extends string ? number : string {
  if (typeof val === "string") return val.length as any;
  return String(val) as any;
}
const len = convert("hello"); // number
const str = convert(42);      // string

// 16. Promisify all methods of an object
type Promisify<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R ? (...args: A) => Promise<R> : T[K];
};
class Calculator2 {
  add(a: number, b: number) { return a + b; }
  label(s: string) { return s; }
}
type AsyncCalc = Promisify<Calculator2>;
// { add: (a: number, b: number) => Promise<number>; label: (s: string) => Promise<string> }

// 17. Infer in tuple position
type HeadTail<T extends any[]> = T extends [infer H, ...infer T2] ? [H, T2] : never;
type HT = HeadTail<[string, number, boolean]>; // [string, [number, boolean]]

// 18. Infer multiple positions
type SecondParam<T> = T extends (a: any, b: infer B, ...args: any[]) => any ? B : never;
type SP = SecondParam<(x: string, y: number, z: boolean) => void>; // number

// 19. Conditional required/optional metadata
type RequiredFields<T> = {
  [K in keyof T]-?: undefined extends T[K] ? never : K;
}[keyof T];
type OptionalFields<T> = Exclude<keyof T, RequiredFields<T>>;
type Form = { name: string; email?: string; age?: number };
type RF = RequiredFields<Form>; // "name"
type OF = OptionalFields<Form>; // "email" | "age"

// 20. Recursive conditional for deeply optional
type AllOptional<T> = T extends object
  ? { [K in keyof T]?: AllOptional<T[K]> }
  : T | undefined;

// 21. Variadic tuple head and init
type Init<T extends any[]> = T extends [...infer I, infer _L] ? I : never;
type Head<T extends any[]> = T extends [infer H, ...any[]] ? H : never;
type Tail2<T extends any[]> = T extends [any, ...infer T3] ? T3 : never;
type IT = Init<[1, 2, 3]>; // [1, 2]
type HH = Head<[1, 2, 3]>; // 1
type TT = Tail2<[1, 2, 3]>; // [2, 3]

// 22. Conditional type as type guard
type IsStringArray<T> = T extends string[] ? true : false;
function toUpperAll<T extends any[]>(arr: T): IsStringArray<T> extends true ? string[] : never {
  if (arr.every(v => typeof v === "string")) return arr.map(s => s.toUpperCase()) as any;
  throw new TypeError("Not a string array");
}

// 23. Distributive type collecting subtypes
type Subtypes<T, U extends T> = U;
type NumericSubset = Subtypes<number | string | boolean, number | boolean>; // number | boolean

// 24. Infer from object's method
type MethodReturn<T, K extends keyof T> = T[K] extends (...args: any[]) => infer R ? R : never;
type MR = MethodReturn<{ greet(): string; compute(): number }, "compute">; // number

// 25. Infer from indexed type
type ValueAt<T, K extends keyof T> = T[K] extends infer V ? V : never;
type VA = ValueAt<{ x: string; y: number }, "x">; // string

// 26. Conditional union reduction
type UnwrapSingle<T> = T extends [infer U] ? U : T;
type US = UnwrapSingle<[string]>;         // string
type UM = UnwrapSingle<[string, number]>; // [string, number]

// 27. Conditional type with template literal
type EventHandlerName<T extends string> = `on${Capitalize<T>}`;
type ClickHandler = EventHandlerName<"click">; // "onClick"
type FocusHandler = EventHandlerName<"focus">; // "onFocus"

// 28. Mapped conditional: filter by assignability
type Assignable<T, To> = {
  [K in keyof T as T[K] extends To ? K : never]: T[K];
};
type NumberFields = Assignable<{ a: string; b: number; c: number }, number>;
// { b: number; c: number }

// 29. Conditional type for union tagging
type Tagged<U extends string, T> = T extends any ? { _tag: U; value: T } : never;
type StringOrNum = Tagged<"StringOrNum", string | number>;
// { _tag: "StringOrNum"; value: string } | { _tag: "StringOrNum"; value: number }

// 30. Conditional type inference in HOF
function mapResult<T, U>(
  result: { ok: true; value: T } | { ok: false; error: string },
  f: T extends any ? (v: T) => U : never
): { ok: true; value: U } | { ok: false; error: string } {
  if (result.ok) return { ok: true, value: (f as (v: T) => U)(result.value) };
  return result;
}

// 31. Non-distributive identity check
type StrictEquals<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type SE1 = StrictEquals<string, string>; // true
type SE2 = StrictEquals<string, number>; // false

// 32. Conditional type for tuple length check
type HasLength<T extends any[], N extends number> = T["length"] extends N ? true : false;
type HL = HasLength<[1, 2, 3], 3>; // true
type HL2 = HasLength<[1, 2], 3>;   // false

// 33. Conditional map + filter in one
type FilterMap<T extends any[], From, To> =
  T extends [infer H, ...infer R]
    ? H extends From
      ? [To, ...FilterMap<R, From, To>]
      : FilterMap<R, From, To>
    : [];
type FM = FilterMap<[string, number, string, boolean], string, "str">; // ["str", "str"]

// 34. Conditional for read-only vs mutable
type PropAccessMode<T, K extends keyof T> = Readonly<Pick<T, K>> extends Pick<T, K> ? "readonly" : "mutable";
// (simplified check — true equality requires more complex trick)

// 35. Infer from class field
class Pair<A, B> { constructor(public first: A, public second: B) {} }
type FirstOf<P> = P extends Pair<infer A, any> ? A : never;
type SecondOf<P> = P extends Pair<any, infer B> ? B : never;
type PA = FirstOf<Pair<string, number>>;  // string
type PB = SecondOf<Pair<string, number>>; // number

// 36. Conditional callback typing
type Handler<T> = T extends string
  ? (val: string) => void
  : T extends number
  ? (val: number) => void
  : (val: unknown) => void;
function on<T>(val: T, handler: Handler<T>): void { (handler as any)(val); }
on("hello", (s) => s.toUpperCase());
on(42,      (n) => n.toFixed(2));

// 37. Conditional recursive optional unwrap
type Definite<T> = T extends undefined | null ? never : T extends (infer U)? ? Definite<U> : T;

// 38. Tuple to union
type TupleToUnion<T extends any[]> = T[number];
type TTU = TupleToUnion<[string, number, boolean]>; // string | number | boolean

// 39. Union to tuple (fixed size, order-dependent)
type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (x: infer I) => void ? I : never;
type LastOf<U> = UnionToIntersection<U extends any ? () => U : never> extends () => infer R ? R : never;

// 40. String split type
type Split<S extends string, D extends string> =
  S extends `${infer H}${D}${infer T}` ? [H, ...Split<T, D>] : [S];
type SP2 = Split<"a.b.c", ".">; // ["a", "b", "c"]

// 41. Conditional for JSON-safe check
type IsJsonSafe<T> =
  T extends string | number | boolean | null ? true :
  T extends any[] ? T extends JsonSafeArray<T> ? true : false :
  T extends object ? T extends JsonSafeObject<T> ? true : false :
  false;
type JsonSafeArray<T extends any[]> = T[number] extends (string | number | boolean | null | object) ? T : never;
type JsonSafeObject<T extends object> = { [K in keyof T]: IsJsonSafe<T[K]> extends true ? T[K] : never };

// 42. Conditional for builder pattern return
type BuilderReturn<T, Stage extends "empty" | "partial" | "complete"> =
  Stage extends "complete" ? T :
  Stage extends "partial"  ? Partial<T> :
  {};

// 43. Infer from mapped type
type InferMapped<T> = T extends { [K in infer Keys]: infer Value }
  ? { keys: Keys; values: Value }
  : never;
type IM = InferMapped<{ a: string; b: number }>; // { keys: "a" | "b"; values: string | number }

// 44. Conditional type for template string parsing
type ParseInt<S extends string> = S extends `${infer N extends number}` ? N : never;
type PI = ParseInt<"42">; // 42

// 45. Recursive conditional for nested arrays
type NestedArrayElement<T> =
  T extends (infer U)[] ? NestedArrayElement<U> : T;
type NAE = NestedArrayElement<number[][][]>; // number

// 46. Conditional based on assignability to function
type Callable<T> = T extends (...args: any[]) => any ? T : never;
type OnlyFunctions<T> = { [K in keyof T]: Callable<T[K]> };
class Service2 {
  name = "svc";
  greet() { return "hi"; }
}
type ServiceFns = OnlyFunctions<Service2>; // { name: never; greet: () => string }

// 47. Conditional for method extraction
type Methods2<T> = { [K in keyof T as T[K] extends Function ? K : never]: T[K] };
type ServiceMethods = Methods2<Service2>; // { greet: () => string }

// 48. Conditional type for tuple concatenation
type Concat<A extends any[], B extends any[]> = [...A, ...B];
type CA = Concat<[string, number], [boolean, null]>; // [string, number, boolean, null]

// 49. Conditional for exact object shape
type ExactObject<T, Shape> =
  T extends Shape
    ? Exclude<keyof T, keyof Shape> extends never
      ? T
      : never
    : never;
type EO = ExactObject<{ x: 1; y: 2 }, { x: number }>; // never (has extra key y)
type EO2 = ExactObject<{ x: 1 }, { x: number }>;       // { x: 1 }

// 50. Conditional wrapping in factory
function conditionalWrap<T, W extends boolean>(
  val: T,
  wrap: W
): W extends true ? { value: T } : T {
  return (wrap ? { value: val } : val) as any;
}
const wrapped   = conditionalWrap("hi", true  as const); // { value: string }
const unwrapped = conditionalWrap("hi", false as const); // string
