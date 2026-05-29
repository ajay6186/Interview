export {};

// ============================================================
// Phase 6 – Expert: JSON Parser Types — BASIC (1–50)
// ============================================================

// --- 1. JSON primitive types ---
type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonArray | JsonObject;
type JsonArray = JsonValue[];
type JsonObject = { [key: string]: JsonValue };

// --- 2. Type-level JSON null ---
type IsNull<T extends JsonValue> = T extends null ? true : false;
type B2_T = IsNull<null>;   // true
type B2_F = IsNull<"hello">; // false

// --- 3. Type-level JSON string check ---
type IsJsonString<T extends JsonValue> = T extends string ? true : false;
type B3_T = IsJsonString<"hello">; // true

// --- 4. Type-level JSON number check ---
type IsJsonNumber<T extends JsonValue> = T extends number ? true : false;
type B4_T = IsJsonNumber<42>; // true

// --- 5. Type-level JSON boolean check ---
type IsJsonBoolean<T extends JsonValue> = T extends boolean ? true : false;
type B5_T = IsJsonBoolean<true>; // true

// --- 6. JSON primitive type tag ---
type PrimitiveTag<T extends JsonPrimitive> =
  T extends null ? "null" :
  T extends string ? "string" :
  T extends number ? "number" :
  T extends boolean ? "boolean" :
  never;
type B6_S = PrimitiveTag<"hello">; // "string"
type B6_N = PrimitiveTag<null>;    // "null"

// --- 7. Extract JSON object keys ---
type JsonKeys<T extends JsonObject> = keyof T & string;
type B7_Keys = JsonKeys<{ name: string; age: number }>; // "name" | "age"

// --- 8. Get value by key ---
type JsonGet<T extends JsonObject, K extends keyof T> = T[K];
type B8_V = JsonGet<{ name: "Alice"; age: 30 }, "name">; // "Alice"

// --- 9. JSON object with specific required keys ---
type WithKeys<Keys extends string> = { [K in Keys]: JsonValue };
type B9 = WithKeys<"id" | "name">; // {id: JsonValue; name: JsonValue}

// --- 10. Typed JSON structure ---
type TypedJson<T extends object> = T;
type B10 = TypedJson<{ id: number; label: string; active: boolean }>;

// --- 11. JSON array element type ---
type ArrayElement<T extends JsonArray> = T[number];
type B11 = ArrayElement<number[]>; // number

// --- 12. JSON schema literal string parse ---
type ParseBool<S extends string> =
  S extends "true" ? true : S extends "false" ? false : never;
type B12_T = ParseBool<"true">;  // true
type B12_F = ParseBool<"false">; // false

// --- 13. Parse JSON null ---
type ParseNull<S extends string> = S extends "null" ? null : never;
type B13 = ParseNull<"null">; // null

// --- 14. Parse numeric literal string ---
type ParseNumber<S extends string> = S extends `${infer N extends number}` ? N : never;
type B14 = ParseNumber<"42">;  // 42
type B14_3 = ParseNumber<"3.14">; // 3.14

// --- 15. Parse string literal (strip quotes) ---
type ParseString<S extends string> = S extends `"${infer Inner}"` ? Inner : never;
type B15 = ParseString<'"hello"'>; // "hello"

// --- 16. JSON stringify type (number) ---
type StringifyNumber<N extends number> = `${N}`;
type B16 = StringifyNumber<42>; // "42"

// --- 17. JSON stringify boolean ---
type StringifyBool<B extends boolean> = B extends true ? "true" : "false";
type B17_T = StringifyBool<true>;  // "true"
type B17_F = StringifyBool<false>; // "false"

// --- 18. JSON stringify null ---
type StringifyNull = "null";
type B18 = StringifyNull; // "null"

// --- 19. Deep readonly JSON ---
type DeepReadonly<T> =
  T extends (infer U)[] ? readonly DeepReadonly<U>[] :
  T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } :
  T;
type B19 = DeepReadonly<{ a: { b: number[] } }>;

// --- 20. Partial JSON object ---
type PartialJson<T extends JsonObject> = Partial<T>;
type B20 = PartialJson<{ name: string; age: number }>; // {name?: string; age?: number}

// --- 21. Required JSON object ---
type RequiredJson<T extends JsonObject> = Required<T>;
type B21 = RequiredJson<{ name?: string; age?: number }>;

// --- 22. JSON pick ---
type JsonPick<T extends JsonObject, K extends keyof T> = Pick<T, K>;
type B22 = JsonPick<{ a: 1; b: 2; c: 3 }, "a" | "b">; // {a: 1; b: 2}

// --- 23. JSON omit ---
type JsonOmit<T extends JsonObject, K extends keyof T> = Omit<T, K>;
type B23 = JsonOmit<{ a: 1; b: 2; c: 3 }, "c">; // {a: 1; b: 2}

// --- 24. JSON merge (shallow) ---
type JsonMerge<A extends JsonObject, B extends JsonObject> = Omit<A, keyof B> & B;
type B24 = JsonMerge<{ a: 1; b: 2 }, { b: "new"; c: 3 }>; // {a:1; b:"new"; c:3}

// --- 25. JSON flatten keys ---
type FlatKeys<T extends JsonObject, Prefix extends string = ""> = {
  [K in keyof T & string]:
    T[K] extends JsonObject
      ? FlatKeys<T[K], `${Prefix}${K}.`>
      : `${Prefix}${K}`
}[keyof T & string];
type B25 = FlatKeys<{ a: { b: { c: 1 } }; d: 2 }>; // "a.b.c" | "d"

// --- 26. Typed JSON path ---
type JsonPath<T extends JsonObject, Path extends string> =
  Path extends `${infer K}.${infer Rest}`
    ? K extends keyof T
      ? T[K] extends JsonObject ? JsonPath<T[K], Rest> : never
      : never
    : Path extends keyof T ? T[Path] : never;
type B26 = JsonPath<{ a: { b: { c: 42 } } }, "a.b.c">; // 42

// --- 27. JSON type guard ---
function isJsonObject(v: JsonValue): v is JsonObject {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function isJsonArray(v: JsonValue): v is JsonArray {
  return Array.isArray(v);
}
function isJsonPrimitive(v: JsonValue): v is JsonPrimitive {
  return v === null || typeof v !== "object";
}

// --- 28. JSON schema type ---
type JsonSchema = {
  type: "string" | "number" | "boolean" | "null" | "array" | "object";
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
};
const B28_schema: JsonSchema = {
  type: "object",
  properties: { name: { type: "string" }, age: { type: "number" } },
  required: ["name"],
};

// --- 29. Infer TypeScript type from JsonSchema ---
type InferSchema<S extends JsonSchema> =
  S["type"] extends "string" ? string :
  S["type"] extends "number" ? number :
  S["type"] extends "boolean" ? boolean :
  S["type"] extends "null" ? null :
  S["type"] extends "array" ? (S["items"] extends JsonSchema ? InferSchema<S["items"]>[] : JsonValue[]) :
  S["type"] extends "object" ? (S["properties"] extends Record<string, JsonSchema>
    ? { [K in keyof S["properties"]]: InferSchema<S["properties"][K]> }
    : JsonObject) :
  never;
const _inferredUser: InferSchema<{ type: "object"; properties: { name: { type: "string" }; age: { type: "number" } }; required: ["name"] }> = { name: "Alice", age: 30 };

// --- 30. JSON validator function ---
function validateJson<T extends JsonValue>(schema: JsonSchema, value: unknown): value is T {
  if (schema.type === "string") return typeof value === "string";
  if (schema.type === "number") return typeof value === "number";
  if (schema.type === "boolean") return typeof value === "boolean";
  if (schema.type === "null") return value === null;
  if (schema.type === "array") return Array.isArray(value);
  if (schema.type === "object") return typeof value === "object" && value !== null && !Array.isArray(value);
  return false;
}

// --- 31. Parse key-value pair ---
type ParseKV<S extends string> =
  S extends `"${infer K}":${infer V}`
    ? { key: K; raw: V }
    : never;
type B31 = ParseKV<'"name":"Alice"'>; // {key: "name"; raw: '"Alice"'}

// --- 32. JSON diff type ---
type JsonDiff<A extends JsonObject, B extends JsonObject> = {
  added: Omit<B, keyof A>;
  removed: Omit<A, keyof B>;
  changed: { [K in keyof A & keyof B]: A[K] extends B[K] ? never : K }[keyof A & keyof B];
};
type B32 = JsonDiff<{ a: 1; b: 2 }, { b: 3; c: 4 }>;
// {added:{c:4}; removed:{a:1}; changed:"b"}

// --- 33. JSON patch operation ---
type JsonPatchOp =
  | { op: "add"; path: string; value: JsonValue }
  | { op: "remove"; path: string }
  | { op: "replace"; path: string; value: JsonValue }
  | { op: "copy"; from: string; path: string }
  | { op: "move"; from: string; path: string }
  | { op: "test"; path: string; value: JsonValue };

// --- 34. Apply add patch (type-level) ---
type ApplyAdd<T extends JsonObject, K extends string, V extends JsonValue> = T & Record<K, V>;
type B34 = ApplyAdd<{ a: 1 }, "b", 2>; // {a:1, b:2}

// --- 35. Apply remove patch (type-level) ---
type ApplyRemove<T extends JsonObject, K extends keyof T> = Omit<T, K>;
type B35 = ApplyRemove<{ a: 1; b: 2; c: 3 }, "b">; // {a:1; c:3}

// --- 36. JSON merge-patch (RFC 7396) ---
type MergePatch<T extends JsonObject, Patch extends JsonObject> = {
  [K in keyof T | keyof Patch]:
    K extends keyof Patch
      ? Patch[K] extends null ? never : Patch[K]
      : K extends keyof T ? T[K] : never
};
type B36 = MergePatch<{ a: 1; b: 2 }, { b: null; c: 3 }>; // {a:1; c:3}

// --- 37. JSON pointer type ---
type JsonPointer = `/${string}`;
function resolvePointer(obj: JsonValue, pointer: JsonPointer): JsonValue | undefined {
  const parts = pointer.slice(1).split("/");
  let current: JsonValue = obj;
  for (const part of parts) {
    if (typeof current !== "object" || current === null) return undefined;
    current = (current as Record<string, JsonValue>)[part];
  }
  return current;
}
const B37_result = resolvePointer({ a: { b: 42 } }, "/a/b"); // 42

// --- 38. Type-safe JSON.parse ---
function parseJson<T extends JsonValue>(json: string): T {
  return JSON.parse(json) as T;
}
const B38_user = parseJson<{ name: string; age: number }>('{"name":"Alice","age":30}');

// --- 39. Type-safe JSON.stringify ---
function stringifyJson<T extends JsonValue>(value: T): string {
  return JSON.stringify(value);
}
const B39_str = stringifyJson({ name: "Alice", age: 30 });

// --- 40. Deep clone via JSON (type-level roundtrip) ---
function jsonClone<T extends JsonValue>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// --- 41. JSON transform ---
type JsonTransform<T extends JsonObject, F extends { [K in keyof T]?: (v: T[K]) => JsonValue }> = {
  [K in keyof T]: K extends keyof F ? F[K] extends (v: T[K]) => infer R ? R : T[K] : T[K]
};

// --- 42. JSON flatten (one level) ---
function flattenJson(obj: JsonObject): JsonObject {
  const result: JsonObject = {};
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === "object" && val !== null && !Array.isArray(val)) {
      for (const [k2, v2] of Object.entries(val as JsonObject)) {
        result[`${key}.${k2}`] = v2;
      }
    } else result[key] = val;
  }
  return result;
}

// --- 43. JSON deep get ---
function deepGet(obj: JsonValue, path: string[]): JsonValue | undefined {
  let cur = obj;
  for (const key of path) {
    if (typeof cur !== "object" || cur === null) return undefined;
    cur = (cur as Record<string, JsonValue>)[key];
  }
  return cur;
}

// --- 44. JSON deep set ---
function deepSet(obj: JsonObject, path: string[], value: JsonValue): JsonObject {
  if (path.length === 0) return obj;
  const [head, ...tail] = path;
  if (tail.length === 0) return { ...obj, [head]: value };
  const child = (obj[head] as JsonObject) ?? {};
  return { ...obj, [head]: deepSet(child, tail, value) };
}

// --- 45. JSON shape validation ---
function matchShape<T extends JsonObject>(template: T, data: JsonObject): boolean {
  return Object.keys(template).every(k => k in data);
}

// --- 46. JSON compare ---
function jsonEqual(a: JsonValue, b: JsonValue): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

// --- 47. JSON filter keys ---
function filterKeys<T extends JsonObject>(obj: T, pred: (key: string) => boolean): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([k]) => pred(k))) as Partial<T>;
}

// --- 48. JSON map values ---
function mapValues<T extends JsonObject>(obj: T, fn: (v: JsonValue) => JsonValue): JsonObject {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v)]));
}

// --- 49. JSON reduce ---
function reduceJson<Acc>(obj: JsonObject, fn: (acc: Acc, key: string, val: JsonValue) => Acc, init: Acc): Acc {
  return Object.entries(obj).reduce((acc, [k, v]) => fn(acc, k, v), init);
}

// --- 50. JSON codec ---
type JsonCodec<T> = {
  encode: (value: T) => JsonValue;
  decode: (json: JsonValue) => T;
};
function jsonCodec<T>(encode: (v: T) => JsonValue, decode: (j: JsonValue) => T): JsonCodec<T> {
  return { encode, decode };
}
const B50_numCodec = jsonCodec<number>(n => n, j => j as number);
