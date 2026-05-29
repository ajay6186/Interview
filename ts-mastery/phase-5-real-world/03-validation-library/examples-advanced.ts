export {};

// ============================================================
// Phase 5 – Real World: Validation Library — ADVANCED (1–50)
// ============================================================

// --- 1. Core Schema type with infer helper ---
type Schema<T> = {
  parse: (input: unknown) => T;
  safeParse: (input: unknown) => { ok: true; data: T } | { ok: false; errors: string[] };
};
function makeSchema<T>(parse: (x: unknown) => T): Schema<T> {
  return {
    parse,
    safeParse(x) {
      try { return { ok: true, data: parse(x) }; }
      catch (e) { return { ok: false, errors: [(e as Error).message] }; }
    },
  };
}
const adv1_stringSchema = makeSchema<string>(x => {
  if (typeof x !== "string") throw new Error("Expected string");
  return x;
});

// --- 2. Infer<Schema> utility type ---
type Infer<S extends Schema<unknown>> = S extends Schema<infer T> ? T : never;
const adv2_numSchema = makeSchema<number>(x => {
  if (typeof x !== "number") throw new Error("Expected number");
  return x;
});
type Adv2_Num = Infer<typeof adv2_numSchema>; // number

// --- 3. Chainable refinement validator ---
class Validator<T> {
  constructor(private _schema: Schema<T>) {}
  refine(pred: (v: T) => boolean, msg: string): Validator<T> {
    const base = this._schema;
    return new Validator(makeSchema<T>(x => {
      const v = base.parse(x);
      if (!pred(v)) throw new Error(msg);
      return v;
    }));
  }
  parse(x: unknown): T { return this._schema.parse(x); }
  safeParse(x: unknown) { return this._schema.safeParse(x); }
}
const adv3_positiveNum = new Validator(adv2_numSchema).refine(n => n > 0, "Must be positive");

// --- 4. Object schema with typed keys ---
type ObjectSchema<T extends Record<string, Schema<unknown>>> = Schema<{ [K in keyof T]: Infer<T[K]> }>;
function objectSchema<T extends Record<string, Schema<unknown>>>(shape: T): ObjectSchema<T> {
  return makeSchema(x => {
    if (typeof x !== "object" || x === null) throw new Error("Expected object");
    const obj = x as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    const errors: string[] = [];
    for (const key of Object.keys(shape)) {
      try { result[key] = shape[key].parse(obj[key]); }
      catch (e) { errors.push(`${key}: ${(e as Error).message}`); }
    }
    if (errors.length) throw new Error(errors.join(", "));
    return result as { [K in keyof T]: Infer<T[K]> };
  });
}
const adv4_userSchema = objectSchema({ name: adv1_stringSchema, age: adv2_numSchema });
type Adv4_User = Infer<typeof adv4_userSchema>;

// --- 5. Array schema ---
function arraySchema<T>(item: Schema<T>): Schema<T[]> {
  return makeSchema(x => {
    if (!Array.isArray(x)) throw new Error("Expected array");
    return x.map((v, i) => {
      const r = item.safeParse(v);
      if (!r.ok) throw new Error(`[${i}]: ${r.errors.join(", ")}`);
      return r.data;
    });
  });
}
const adv5_stringsSchema = arraySchema(adv1_stringSchema);

// --- 6. Tuple schema with exact length inference ---
type TupleSchemas = readonly Schema<unknown>[];
type TupleOutput<T extends TupleSchemas> = { [K in keyof T]: T[K] extends Schema<infer V> ? V : never };
function tupleSchema<T extends TupleSchemas>(...schemas: T): Schema<TupleOutput<T>> {
  return makeSchema(x => {
    if (!Array.isArray(x)) throw new Error("Expected array for tuple");
    if (x.length !== schemas.length) throw new Error(`Expected ${schemas.length} elements`);
    return schemas.map((s, i) => s.parse(x[i])) as TupleOutput<T>;
  });
}
const adv6_pair = tupleSchema(adv1_stringSchema, adv2_numSchema);
type Adv6_Pair = Infer<typeof adv6_pair>; // [string, number]

// --- 7. Union schema ---
function unionSchema<T extends readonly Schema<unknown>[]>(...schemas: T): Schema<Infer<T[number]>> {
  return makeSchema(x => {
    const errors: string[] = [];
    for (const s of schemas) {
      const r = s.safeParse(x);
      if (r.ok) return r.data as Infer<T[number]>;
      errors.push(r.errors.join(", "));
    }
    throw new Error(`Union failed: ${errors.join(" | ")}`);
  });
}
const adv7_strOrNum = unionSchema(adv1_stringSchema, adv2_numSchema);

// --- 8. Intersection schema ---
function intersectionSchema<A, B>(a: Schema<A>, b: Schema<B>): Schema<A & B> {
  return makeSchema(x => {
    const av = a.parse(x);
    const bv = b.parse(x);
    return { ...av as object, ...bv as object } as A & B;
  });
}
const adv8_namedAge = intersectionSchema(
  objectSchema({ name: adv1_stringSchema }),
  objectSchema({ age: adv2_numSchema })
);

// --- 9. Optional schema ---
function optionalSchema<T>(inner: Schema<T>): Schema<T | undefined> {
  return makeSchema(x => (x === undefined ? undefined : inner.parse(x)));
}
function nullableSchema<T>(inner: Schema<T>): Schema<T | null> {
  return makeSchema(x => (x === null ? null : inner.parse(x)));
}
const adv9_optStr = optionalSchema(adv1_stringSchema);
const adv9_nullNum = nullableSchema(adv2_numSchema);

// --- 10. Default value schema ---
function defaultSchema<T>(inner: Schema<T>, defaultVal: T): Schema<T> {
  return makeSchema(x => (x === undefined ? defaultVal : inner.parse(x)));
}
const adv10_withDefault = defaultSchema(adv2_numSchema, 42);

// --- 11. Transform schema ---
function transformSchema<T, U>(inner: Schema<T>, transform: (v: T) => U): Schema<U> {
  return makeSchema(x => transform(inner.parse(x)));
}
const adv11_strToNum = transformSchema(adv1_stringSchema, s => parseInt(s, 10));

// --- 12. Preprocess schema ---
function preprocessSchema<T>(preprocess: (x: unknown) => unknown, inner: Schema<T>): Schema<T> {
  return makeSchema(x => inner.parse(preprocess(x)));
}
const adv12_trimmed = preprocessSchema(x => typeof x === "string" ? x.trim() : x, adv1_stringSchema);

// --- 13. Lazy / recursive schema ---
function lazySchema<T>(getter: () => Schema<T>): Schema<T> {
  return makeSchema(x => getter().parse(x));
}
type TreeNode = { value: number; children: TreeNode[] };
const adv13_treeSchema: Schema<TreeNode> = lazySchema(() =>
  objectSchema({ value: adv2_numSchema, children: arraySchema(adv13_treeSchema) })
);

// --- 14. Branded string schema ---
type Email = string & { __brand: "Email" };
function emailSchema(): Schema<Email> {
  return makeSchema(x => {
    const s = adv1_stringSchema.parse(x);
    if (!s.includes("@")) throw new Error("Invalid email");
    return s as Email;
  });
}
const adv14_email = emailSchema();

// --- 15. Enum schema ---
function enumSchema<T extends string>(...values: T[]): Schema<T> {
  return makeSchema(x => {
    if (!values.includes(x as T)) throw new Error(`Expected one of: ${values.join(", ")}`);
    return x as T;
  });
}
const adv15_role = enumSchema("admin", "user", "guest");
type Adv15_Role = Infer<typeof adv15_role>;

// --- 16. Literal schema ---
function literalSchema<T extends string | number | boolean>(value: T): Schema<T> {
  return makeSchema(x => {
    if (x !== value) throw new Error(`Expected literal ${String(value)}`);
    return x as T;
  });
}
const adv16_trueOnly = literalSchema(true);
const adv16_statusOk = literalSchema("ok");

// --- 17. Record schema ---
function recordSchema<K extends string, V>(keys: Schema<K>, vals: Schema<V>): Schema<Record<K, V>> {
  return makeSchema(x => {
    if (typeof x !== "object" || x === null) throw new Error("Expected object");
    const result: Record<string, V> = {};
    for (const [k, v] of Object.entries(x as object)) {
      result[keys.parse(k)] = vals.parse(v);
    }
    return result as Record<K, V>;
  });
}
const adv17_strRecord = recordSchema(adv1_stringSchema, adv2_numSchema);

// --- 18. Discriminated union schema ---
type DiscriminatedUnion<K extends string, T extends Record<string, Schema<Record<string, unknown>>>> =
  { [Tag in keyof T]: Infer<T[Tag]> & Record<K, Tag> }[keyof T];
function discriminatedUnionSchema<K extends string, T extends Record<string, Schema<Record<string, unknown>>>>(
  key: K, variants: T
): Schema<DiscriminatedUnion<K, T>> {
  return makeSchema(x => {
    if (typeof x !== "object" || x === null) throw new Error("Expected object");
    const tag = (x as Record<string, unknown>)[key];
    if (typeof tag !== "string" || !(tag in variants))
      throw new Error(`Unknown discriminant: ${String(tag)}`);
    return variants[tag].parse(x) as DiscriminatedUnion<K, T>;
  });
}

// --- 19. Partial schema ---
function partialSchema<T extends Record<string, Schema<unknown>>>(shape: T):
  Schema<{ [K in keyof T]?: Infer<T[K]> }> {
  const optShape: Record<string, Schema<unknown>> = {};
  for (const k of Object.keys(shape)) optShape[k] = optionalSchema(shape[k]);
  return objectSchema(optShape as { [K in keyof T]: Schema<Infer<T[K]> | undefined> }) as
    Schema<{ [K in keyof T]?: Infer<T[K]> }>;
}
const adv19_partialUser = partialSchema({ name: adv1_stringSchema, age: adv2_numSchema });

// --- 20. Required schema (makes partials required) ---
function requiredSchema<T extends object>(shape: { [K in keyof T]: Schema<T[K] | undefined> }):
  Schema<Required<T>> {
  return makeSchema(x => {
    const parsed = objectSchema(shape as Record<string, Schema<unknown>>).parse(x) as T;
    for (const key of Object.keys(shape)) {
      if ((parsed as Record<string, unknown>)[key] === undefined)
        throw new Error(`${key} is required`);
    }
    return parsed as Required<T>;
  });
}

// --- 21. Pick schema ---
function pickSchema<T extends Record<string, Schema<unknown>>, K extends keyof T>(
  shape: T, keys: K[]
): Schema<{ [P in K]: Infer<T[P]> }> {
  const picked = {} as { [P in K]: T[P] };
  for (const k of keys) (picked as Record<string, Schema<unknown>>)[k as string] = shape[k];
  return objectSchema(picked);
}
const adv21_userFull = { name: adv1_stringSchema, age: adv2_numSchema, email: adv14_email };
const adv21_nameOnly = pickSchema(adv21_userFull, ["name"]);

// --- 22. Omit schema ---
function omitSchema<T extends Record<string, Schema<unknown>>, K extends keyof T>(
  shape: T, keys: K[]
): Schema<{ [P in Exclude<keyof T, K>]: Infer<T[P]> }> {
  const omitted = { ...shape };
  for (const k of keys) delete (omitted as Record<string, unknown>)[k as string];
  return objectSchema(omitted as { [P in Exclude<keyof T, K>]: T[P] });
}
const adv22_noEmail = omitSchema(adv21_userFull, ["email"]);

// --- 23. Extend schema ---
function extendSchema<A extends Record<string, Schema<unknown>>, B extends Record<string, Schema<unknown>>>(
  base: A, extra: B
): Schema<{ [K in keyof A | keyof B]: K extends keyof B ? Infer<B[K]> : K extends keyof A ? Infer<A[K]> : never }> {
  return objectSchema({ ...base, ...extra }) as Schema<{ [K in keyof A | keyof B]: K extends keyof B ? Infer<B[K]> : K extends keyof A ? Infer<A[K]> : never }>;
}
const adv23_extUser = extendSchema(adv21_userFull, { role: adv15_role });

// --- 24. Supertype/subtype narrowing ---
function narrowSchema<T, U extends T>(inner: Schema<T>, pred: (v: T) => v is U, msg: string): Schema<U> {
  return makeSchema(x => {
    const v = inner.parse(x);
    if (!pred(v)) throw new Error(msg);
    return v;
  });
}
function isPositive(n: number): n is number { return n > 0; }
const adv24_positive = narrowSchema(adv2_numSchema, isPositive, "Must be positive");

// --- 25. Async validation schema ---
type AsyncSchema<T> = { parseAsync: (x: unknown) => Promise<T> };
function asyncSchema<T>(validate: (x: unknown) => Promise<T>): AsyncSchema<T> {
  return { parseAsync: validate };
}
const adv25_asyncUser = asyncSchema<{ name: string }>(async x => {
  await new Promise(r => setTimeout(r, 0));
  return adv4_userSchema.parse(x) as { name: string };
});

// --- 26. Validation error class with paths ---
class ValidationError extends Error {
  constructor(public readonly issues: { path: string[]; message: string }[]) {
    super(issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; "));
    this.name = "ValidationError";
  }
}
function pathValidation<T>(path: string[], inner: Schema<T>): Schema<T> {
  return makeSchema(x => {
    const r = inner.safeParse(x);
    if (!r.ok) throw new ValidationError(r.errors.map(msg => ({ path, message: msg })));
    return r.data;
  });
}
const adv26_named = pathValidation(["user", "name"], adv1_stringSchema);

// --- 27. Schema composition with pipe ---
function pipeSchema<T, U>(first: Schema<T>, second: Schema<U>): Schema<U> {
  return makeSchema(x => second.parse(first.parse(x)));
}
const adv27_strToTrimmedNum = pipeSchema(adv12_trimmed, adv11_strToNum);

// --- 28. Schema versioning ---
type VersionedSchema<T> = { version: number; schema: Schema<T> };
function versionedSchema<T>(version: number, schema: Schema<T>): VersionedSchema<T> {
  return { version, schema };
}
function parseVersioned<T>(vs: VersionedSchema<T>, x: unknown): T {
  return vs.schema.parse(x);
}
const adv28_v1 = versionedSchema(1, adv4_userSchema);

// --- 29. Schema with context (contextual validators) ---
type ContextSchema<Ctx, T> = { parse: (ctx: Ctx, x: unknown) => T };
function contextSchema<Ctx, T>(parse: (ctx: Ctx, x: unknown) => T): ContextSchema<Ctx, T> {
  return { parse };
}
type AuthCtx = { userId: string; isAdmin: boolean };
const adv29_adminOnly = contextSchema<AuthCtx, string>((ctx, x) => {
  if (!ctx.isAdmin) throw new Error("Admin only");
  return adv1_stringSchema.parse(x);
});

// --- 30. Multi-field cross-validation ---
function crossValidate<T>(schema: Schema<T>, validate: (v: T) => string | null): Schema<T> {
  return makeSchema(x => {
    const v = schema.parse(x);
    const err = validate(v);
    if (err) throw new Error(err);
    return v;
  });
}
const adv30_confirmedPass = crossValidate(
  objectSchema({ password: adv1_stringSchema, confirm: adv1_stringSchema }),
  obj => obj.password === obj.confirm ? null : "Passwords must match"
);

// --- 31. Coerce schema (type coercion) ---
const adv31_coerceNum = makeSchema<number>(x => {
  const n = Number(x);
  if (isNaN(n)) throw new Error("Cannot coerce to number");
  return n;
});
const adv31_coerceBool = makeSchema<boolean>(x =>
  x === "true" || x === true ? true : x === "false" || x === false ? false :
  (() => { throw new Error("Cannot coerce to boolean"); })()
);

// --- 32. Schema merging (deep merge for objects) ---
function mergeSchemas<A extends Record<string, Schema<unknown>>, B extends Record<string, Schema<unknown>>>(
  a: A, b: B
): Schema<Omit<{ [K in keyof A]: Infer<A[K]> }, keyof B> & { [K in keyof B]: Infer<B[K]> }> {
  return objectSchema({ ...a, ...b }) as Schema<Omit<{ [K in keyof A]: Infer<A[K]> }, keyof B> & { [K in keyof B]: Infer<B[K]> }>;
}
const adv32_merged = mergeSchemas({ name: adv1_stringSchema, age: adv2_numSchema }, { age: adv31_coerceNum });

// --- 33. Fluent builder API ---
class SchemaBuilder<T> {
  private _schema: Schema<T>;
  constructor(schema: Schema<T>) { this._schema = schema; }
  static string(): SchemaBuilder<string> { return new SchemaBuilder(adv1_stringSchema); }
  static number(): SchemaBuilder<number> { return new SchemaBuilder(adv2_numSchema); }
  min(n: number): SchemaBuilder<number> {
    return new SchemaBuilder(new Validator(this._schema as unknown as Schema<number>)
      .refine(v => v >= n, `Min ${n}`)) as unknown as SchemaBuilder<number>;
  }
  max(n: number): SchemaBuilder<number> {
    return new SchemaBuilder(new Validator(this._schema as unknown as Schema<number>)
      .refine(v => v <= n, `Max ${n}`)) as unknown as SchemaBuilder<number>;
  }
  build(): Schema<T> { return this._schema; }
}
const adv33_age = SchemaBuilder.number().min(0).max(150).build();

// --- 34. Schema introspection ---
type SchemaShape = { type: string; optional?: boolean; shape?: Record<string, SchemaShape> };
function describe(schema: Schema<unknown>): string { return schema.constructor?.name ?? "Schema"; }
function schemaShape(type: string, opts?: Partial<SchemaShape>): SchemaShape {
  return { type, ...opts };
}
const adv34_userShape: SchemaShape = schemaShape("object", {
  shape: { name: schemaShape("string"), age: schemaShape("number") }
});

// --- 35. Middleware validator ---
type ValidateMiddleware<T> = (req: unknown, next: (data: T) => void) => void;
function validationMiddleware<T>(schema: Schema<T>): ValidateMiddleware<T> {
  return (req, next) => {
    const r = schema.safeParse(req);
    if (!r.ok) throw new ValidationError(r.errors.map(m => ({ path: [], message: m })));
    next(r.data);
  };
}
const adv35_mw = validationMiddleware(adv4_userSchema);

// --- 36. Zod-like z object ---
const z = {
  string: () => new Validator(adv1_stringSchema),
  number: () => new Validator(adv2_numSchema),
  object: <T extends Record<string, Validator<unknown>>>(shape: T) =>
    new Validator(objectSchema(Object.fromEntries(
      Object.entries(shape).map(([k, v]) => [k, v["_schema"]])
    ) as Record<string, Schema<unknown>>)),
  array: <T>(item: Validator<T>) => new Validator(arraySchema(item["_schema"])),
};
// Example usage (type-level)
type Adv36_Infer<V extends Validator<unknown>> = V extends Validator<infer T> ? T : never;

// --- 37. Schema with metadata ---
type SchemaWithMeta<T> = Schema<T> & { description?: string; example?: T };
function withMeta<T>(schema: Schema<T>, meta: { description?: string; example?: T }): SchemaWithMeta<T> {
  return Object.assign(schema, meta);
}
const adv37_namedStr = withMeta(adv1_stringSchema, { description: "A user name", example: "Alice" });

// --- 38. Conditional schema ---
function conditionalSchema<T, U>(
  condition: Schema<boolean>,
  ifTrue: Schema<T>,
  ifFalse: Schema<U>
): Schema<T | U> {
  return makeSchema(x => {
    const flag = condition.safeParse(x);
    return flag.ok && flag.data ? ifTrue.parse(x) : ifFalse.parse(x);
  });
}

// --- 39. Schema registry ---
class SchemaRegistry {
  private registry = new Map<string, Schema<unknown>>();
  register<T>(name: string, schema: Schema<T>): void {
    this.registry.set(name, schema as Schema<unknown>);
  }
  get<T>(name: string): Schema<T> {
    const s = this.registry.get(name);
    if (!s) throw new Error(`Schema '${name}' not found`);
    return s as Schema<T>;
  }
  has(name: string): boolean { return this.registry.has(name); }
}
const adv39_registry = new SchemaRegistry();
adv39_registry.register("user", adv4_userSchema);

// --- 40. Form schema (flat key-value validation) ---
type FormFields = Record<string, string | string[]>;
function formSchema<T>(
  schema: Schema<T>,
  preprocess?: (f: FormFields) => unknown
): Schema<T> {
  return makeSchema(x => schema.parse(preprocess ? preprocess(x as FormFields) : x));
}
const adv40_formUser = formSchema(adv4_userSchema, f => ({
  name: f["name"],
  age: Number(f["age"])
}));

// --- 41. JSON schema generator ---
function toJsonSchema(shape: SchemaShape): Record<string, unknown> {
  if (shape.type === "object" && shape.shape) {
    return {
      type: "object",
      properties: Object.fromEntries(
        Object.entries(shape.shape).map(([k, v]) => [k, toJsonSchema(v)])
      )
    };
  }
  return { type: shape.type };
}
const adv41_jsonSchema = toJsonSchema(adv34_userShape);

// --- 42. Error accumulation (collect ALL errors) ---
function collectErrors<T>(schema: Schema<T>, x: unknown): string[] {
  const r = schema.safeParse(x);
  return r.ok ? [] : r.errors;
}
const adv42_errors = collectErrors(adv4_userSchema, { name: 123, age: "not-a-number" });

// --- 43. Schema cloning ---
function cloneSchema<T>(schema: Schema<T>): Schema<T> {
  return makeSchema(x => schema.parse(x));
}
const adv43_clonedStr = cloneSchema(adv1_stringSchema);

// --- 44. Schema composition chain (>5 transforms) ---
const adv44_pipeline = transformSchema(
  transformSchema(
    transformSchema(adv1_stringSchema, s => s.trim()),
    s => s.toLowerCase()
  ),
  s => s.replace(/\s+/g, "-")
);
const adv44_slug = adv44_pipeline.parse("  Hello World  "); // "hello-world"

// --- 45. Template literal schema ---
function templateLiteralSchema<P extends string>(prefix: P): Schema<`${P}${string}`> {
  return makeSchema(x => {
    const s = adv1_stringSchema.parse(x);
    if (!s.startsWith(prefix)) throw new Error(`Must start with "${prefix}"`);
    return s as `${P}${string}`;
  });
}
const adv45_urnPrefix = templateLiteralSchema("urn:");
type Adv45_Urn = Infer<typeof adv45_urnPrefix>; // `urn:${string}`

// --- 46. Date schema with range validation ---
const adv46_dateSchema = makeSchema<Date>(x => {
  const d = x instanceof Date ? x : new Date(String(x));
  if (isNaN(d.getTime())) throw new Error("Invalid date");
  return d;
});
function dateRange(min: Date, max: Date): Schema<Date> {
  return new Validator(adv46_dateSchema)
    .refine(d => d >= min && d <= max, `Date out of range`)["_schema"] as Schema<Date>;
}

// --- 47. Polymorphic schema (tagged) ---
type Tagged<Tag extends string, T> = { tag: Tag } & T;
function taggedSchema<Tag extends string, T>(tag: Tag, schema: Schema<T>): Schema<Tagged<Tag, T>> {
  return transformSchema(schema, v => ({ tag, ...v as object } as Tagged<Tag, T>));
}
const adv47_taggedUser = taggedSchema("user", adv4_userSchema);

// --- 48. Schema cache (memoize parse) ---
function cachedSchema<T>(schema: Schema<T>): Schema<T> {
  const cache = new WeakMap<object, T>();
  return makeSchema(x => {
    if (typeof x === "object" && x !== null) {
      if (cache.has(x)) return cache.get(x)!;
      const v = schema.parse(x);
      cache.set(x, v);
      return v;
    }
    return schema.parse(x);
  });
}
const adv48_cachedUser = cachedSchema(adv4_userSchema);

// --- 49. Schema type guard ---
function schemaGuard<T>(schema: Schema<T>): (x: unknown) => x is T {
  return (x): x is T => schema.safeParse(x).ok;
}
const adv49_isUser = schemaGuard(adv4_userSchema);
function processIfUser(x: unknown): void {
  if (adv49_isUser(x)) {
    const _name: string = x.name; // x is typed as Adv4_User here
    void _name;
  }
}

// --- 50. Full validation pipeline with audit log ---
type AuditEntry = { timestamp: Date; input: unknown; ok: boolean; errors?: string[] };
class AuditedSchema<T> {
  private log: AuditEntry[] = [];
  constructor(private schema: Schema<T>) {}
  parse(x: unknown): T {
    const r = this.schema.safeParse(x);
    this.log.push({ timestamp: new Date(), input: x, ok: r.ok, errors: r.ok ? undefined : r.errors });
    if (!r.ok) throw new Error(r.errors.join(", "));
    return r.data;
  }
  getLog(): readonly AuditEntry[] { return this.log; }
}
const adv50_auditedUser = new AuditedSchema(adv4_userSchema);
