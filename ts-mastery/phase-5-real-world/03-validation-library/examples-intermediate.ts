export {};

// ============================================================
// INTERMEDIATE EXAMPLES — Validation Library (50 Examples)
// ============================================================

// 1. Generic schema type
type Schema<T> = { [K in keyof T]: Validator<T[K]> };

// 2. Validator function type
type Validator<T> = (value: T) => ValidationResult;
type ValidationResult = { ok: true } | { ok: false; error: string };

const ok: ValidationResult = { ok: true };
function fail(error: string): ValidationResult { return { ok: false, error }; }

// 3. Schema validator — validates an object against a schema
function schema<T>(s: Schema<T>): Validator<T> {
  return (value: T) => {
    for (const key in s) {
      const result = s[key](value[key]);
      if (!result.ok) return fail(`${key}: ${result.error}`);
    }
    return ok;
  };
}

// 4. Infer validated type from schema
type InferSchema<S> = S extends Schema<infer T> ? T : never;

// 5. String validators
const string: Validator<unknown> = (v) => typeof v === "string" ? ok : fail("Expected string");
const number: Validator<unknown> = (v) => typeof v === "number" ? ok : fail("Expected number");
const boolean_: Validator<unknown> = (v) => typeof v === "boolean" ? ok : fail("Expected boolean");

// 6. Validator builder pattern
class ValidatorBuilder<T> {
  private validators: Validator<T>[] = [];
  add(v: Validator<T>): this { this.validators.push(v); return this; }
  build(): Validator<T> {
    return (value: T) => {
      for (const v of this.validators) {
        const r = v(value);
        if (!r.ok) return r;
      }
      return ok;
    };
  }
}

// 7. String validator builder
class StringValidator {
  private v = new ValidatorBuilder<string>();
  required(): this { this.v.add(s => s.trim().length > 0 ? ok : fail("Required")); return this; }
  min(n: number): this { this.v.add(s => s.length >= n ? ok : fail(`Min length ${n}`)); return this; }
  max(n: number): this { this.v.add(s => s.length <= n ? ok : fail(`Max length ${n}`)); return this; }
  email(): this { this.v.add(s => /\S+@\S+\.\S+/.test(s) ? ok : fail("Invalid email")); return this; }
  pattern(re: RegExp, msg: string): this { this.v.add(s => re.test(s) ? ok : fail(msg)); return this; }
  build(): Validator<string> { return this.v.build(); }
}
const str = () => new StringValidator();

// 8. Number validator builder
class NumberValidator {
  private v = new ValidatorBuilder<number>();
  min(n: number): this { this.v.add(x => x >= n ? ok : fail(`Min ${n}`)); return this; }
  max(n: number): this { this.v.add(x => x <= n ? ok : fail(`Max ${n}`)); return this; }
  integer(): this { this.v.add(x => Number.isInteger(x) ? ok : fail("Must be integer")); return this; }
  positive(): this { this.v.add(x => x > 0 ? ok : fail("Must be positive")); return this; }
  build(): Validator<number> { return this.v.build(); }
}
const num = () => new NumberValidator();

// 9. Array validator
function array<T>(itemValidator: Validator<T>): Validator<T[]> {
  return (arr) => {
    if (!Array.isArray(arr)) return fail("Expected array");
    for (let i = 0; i < arr.length; i++) {
      const r = itemValidator(arr[i]);
      if (!r.ok) return fail(`[${i}]: ${r.error}`);
    }
    return ok;
  };
}

// 10. Union type validator
function union<T>(...validators: Validator<T>[]): Validator<T> {
  return (value) => {
    for (const v of validators) {
      const r = v(value);
      if (r.ok) return ok;
    }
    return fail("Value does not match any allowed type");
  };
}

// 11. Literal validator
function literal<T extends string | number | boolean>(expected: T): Validator<T> {
  return (v) => v === expected ? ok : fail(`Expected literal ${String(expected)}`);
}

// 12. Enum validator
function enumValues<T extends string>(values: readonly T[]): Validator<T> {
  return (v) => (values as readonly string[]).includes(v as string)
    ? ok : fail(`Must be one of: ${values.join(", ")}`);
}

// 13. Intersection validator — value must pass ALL schemas
function intersection<A, B>(va: Validator<A>, vb: Validator<B>): Validator<A & B> {
  return (value) => {
    const ra = va(value as A);
    if (!ra.ok) return ra;
    return vb(value as B);
  };
}

// 14. Recursive schema (for nested objects)
function lazy<T>(factory: () => Validator<T>): Validator<T> {
  return (v) => factory()(v);
}

// 15. Typed validation errors — collect all errors
interface FieldError { field: string; message: string; }
interface ValidationErrors { ok: false; errors: FieldError[]; }
type FullValidationResult<T> = { ok: true; value: T } | ValidationErrors;

// 16. Schema that collects all field errors
function schemaAll<T>(s: Schema<T>): (value: T) => FullValidationResult<T> {
  return (value: T) => {
    const errors: FieldError[] = [];
    for (const key in s) {
      const r = s[key](value[key]);
      if (!r.ok) errors.push({ field: key, message: r.error });
    }
    if (errors.length) return { ok: false, errors };
    return { ok: true, value };
  };
}

// 17. Default value on validation failure
function withDefault<T>(validator: Validator<T>, defaultValue: T): (v: unknown) => T {
  return (v) => {
    const r = validator(v as T);
    return r.ok ? (v as T) : defaultValue;
  };
}

// 18. Transform validator — coerce before validating
function coerce<TIn, TOut>(transform: (v: TIn) => TOut, validator: Validator<TOut>): Validator<TIn> {
  return (v) => validator(transform(v));
}

// 19. Parse number from string
const parseNumber = coerce<string, number>(Number, num().build());

// 20. Preprocess: trim string before validating
function preprocess<T>(fn: (v: T) => T, validator: Validator<T>): Validator<T> {
  return (v) => validator(fn(v));
}
const trimmedStr = preprocess<string>(s => s.trim(), str().required().build());

// 21. Branded type validators
type Email = string & { __brand: "Email" };
type UserId = number & { __brand: "UserId" };

function brandedEmail(): (v: string) => { ok: true; value: Email } | { ok: false; error: string } {
  return (v) => /\S+@\S+\.\S+/.test(v)
    ? { ok: true, value: v as Email }
    : { ok: false, error: "Invalid email" };
}

// 22. Discriminated union validator
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rectangle"; width: number; height: number };

const circleValidator: Validator<{ kind: "circle"; radius: number }> = schema({
  kind: literal("circle"),
  radius: num().positive().build(),
});

const rectValidator: Validator<{ kind: "rectangle"; width: number; height: number }> = schema({
  kind: literal("rectangle"),
  width: num().positive().build(),
  height: num().positive().build(),
});

const shapeValidator: Validator<Shape> = union(
  circleValidator as Validator<Shape>,
  rectValidator as Validator<Shape>
);

// 23. Partial schema — all fields optional
type PartialSchema<T> = { [K in keyof T]?: Validator<T[K]> };
function partialSchema<T>(s: PartialSchema<T>): Validator<Partial<T>> {
  return (value) => {
    for (const key in s) {
      const val = (value as T)[key];
      if (val === undefined) continue;
      const r = s[key]!(val);
      if (!r.ok) return fail(`${key}: ${r.error}`);
    }
    return ok;
  };
}

// 24. Pick schema — validate only selected fields
function pick<T, K extends keyof T>(s: Schema<T>, keys: K[]): Validator<Pick<T, K>> {
  const subset = Object.fromEntries(keys.map(k => [k, s[k]])) as Schema<Pick<T, K>>;
  return schema(subset);
}

// 25. Omit schema — validate all fields except omitted
function omit<T, K extends keyof T>(s: Schema<T>, keys: K[]): Validator<Omit<T, K>> {
  const subset = Object.fromEntries(
    (Object.keys(s) as (keyof T)[]).filter(k => !keys.includes(k as K)).map(k => [k, s[k]])
  ) as Schema<Omit<T, K>>;
  return schema(subset);
}

// 26. Extend schema with additional fields
function extend<T, E>(base: Schema<T>, extra: Schema<E>): Validator<T & E> {
  return intersection(schema(base), schema(extra));
}

// 27. Validated form state type
interface FormState<T> {
  values: Partial<T>;
  errors: Partial<Record<keyof T, string>>;
  isValid: boolean;
}

// 28. Form state from schema validation
function validateForm<T>(values: Partial<T>, s: Schema<T>): FormState<T> {
  const errors: Partial<Record<keyof T, string>> = {};
  for (const key in s) {
    const r = s[key](values[key] as T[typeof key]);
    if (!r.ok) errors[key] = r.error;
  }
  return { values, errors, isValid: Object.keys(errors).length === 0 };
}

// 29. Chain validators with custom error messages
function withMessage<T>(validator: Validator<T>, message: string): Validator<T> {
  return (v) => {
    const r = validator(v);
    return r.ok ? ok : fail(message);
  };
}

// 30. Conditional validator — validate based on another field
function when<T, K extends keyof T>(
  field: K,
  condition: (v: T[K]) => boolean,
  thenValidator: Validator<T>,
  elseValidator?: Validator<T>
): Validator<T> {
  return (value) => {
    if (condition(value[field])) return thenValidator(value);
    return elseValidator ? elseValidator(value) : ok;
  };
}

// 31. Cross-field validation
function refine<T>(validator: Validator<T>, refinement: (v: T) => boolean, message: string): Validator<T> {
  return (v) => {
    const r = validator(v);
    if (!r.ok) return r;
    return refinement(v) ? ok : fail(message);
  };
}

// 32. Password confirmation cross-field check
interface PasswordForm { password: string; confirm: string; }
const passwordFormValidator = refine<PasswordForm>(
  schema({ password: str().min(8).build(), confirm: str().min(1).build() }),
  (v) => v.password === v.confirm,
  "Passwords must match"
);

// 33. Async validator type
type AsyncValidator<T> = (value: T) => Promise<ValidationResult>;

// 34. Async email uniqueness validator
function asyncUnique(checkFn: (v: string) => Promise<boolean>): AsyncValidator<string> {
  return async (v) => {
    const isUnique = await checkFn(v);
    return isUnique ? ok : fail("Value already exists");
  };
}

// 35. Compose sync and async validators
async function validateAsync<T>(
  value: T,
  syncValidators: Validator<T>[],
  asyncValidators: AsyncValidator<T>[]
): Promise<ValidationResult> {
  for (const v of syncValidators) {
    const r = v(value);
    if (!r.ok) return r;
  }
  for (const v of asyncValidators) {
    const r = await v(value);
    if (!r.ok) return r;
  }
  return ok;
}

// 36. Typed validation pipeline
class ValidationPipeline<T> {
  private syncValidators: Validator<T>[] = [];
  private asyncValidators: AsyncValidator<T>[] = [];
  check(v: Validator<T>): this { this.syncValidators.push(v); return this; }
  checkAsync(v: AsyncValidator<T>): this { this.asyncValidators.push(v); return this; }
  async run(value: T): Promise<ValidationResult> {
    return validateAsync(value, this.syncValidators, this.asyncValidators);
  }
}

// 37. Typed error bag
class ErrorBag {
  private errors: Map<string, string[]> = new Map();
  add(field: string, message: string): void {
    const existing = this.errors.get(field) ?? [];
    this.errors.set(field, [...existing, message]);
  }
  has(field: string): boolean { return (this.errors.get(field)?.length ?? 0) > 0; }
  get(field: string): string[] { return this.errors.get(field) ?? []; }
  first(field: string): string | undefined { return this.errors.get(field)?.[0]; }
  isEmpty(): boolean { return this.errors.size === 0; }
  toObject(): Record<string, string[]> { return Object.fromEntries(this.errors); }
}

// 38. Schema to error bag
function validateToErrorBag<T>(value: T, s: Schema<T>): ErrorBag {
  const bag = new ErrorBag();
  for (const key in s) {
    const r = s[key](value[key]);
    if (!r.ok) bag.add(key, r.error);
  }
  return bag;
}

// 39. Date range validator
function dateRange(min?: Date, max?: Date): Validator<Date> {
  return (v) => {
    if (!(v instanceof Date) || isNaN(v.getTime())) return fail("Invalid date");
    if (min && v < min) return fail(`Date must be after ${min.toISOString()}`);
    if (max && v > max) return fail(`Date must be before ${max.toISOString()}`);
    return ok;
  };
}

// 40. File validation
interface FileInfo { name: string; size: number; type: string; }
function fileValidator(opts: { maxBytes?: number; allowedTypes?: string[] }): Validator<FileInfo> {
  return (f) => {
    if (opts.maxBytes && f.size > opts.maxBytes) return fail(`File too large: max ${opts.maxBytes} bytes`);
    if (opts.allowedTypes && !opts.allowedTypes.includes(f.type)) return fail(`Invalid file type: ${f.type}`);
    return ok;
  };
}

// 41. Record validator (key-value object with dynamic keys)
function record<K extends string, V>(
  keyValidator: Validator<K>,
  valueValidator: Validator<V>
): Validator<Record<K, V>> {
  return (obj) => {
    for (const [k, v] of Object.entries(obj)) {
      const kr = keyValidator(k as K);
      if (!kr.ok) return fail(`Invalid key '${k}': ${kr.error}`);
      const vr = valueValidator(v as V);
      if (!vr.ok) return fail(`Invalid value at '${k}': ${vr.error}`);
    }
    return ok;
  };
}

// 42. Tuple validator
function tuple<T extends unknown[]>(...validators: { [K in keyof T]: Validator<T[K]> }): Validator<T> {
  return (arr) => {
    if (!Array.isArray(arr)) return fail("Expected tuple");
    for (let i = 0; i < validators.length; i++) {
      const r = validators[i](arr[i]);
      if (!r.ok) return fail(`[${i}]: ${r.error}`);
    }
    return ok;
  };
}

// 43. Typed validate-and-assert
function assertValid<T>(value: unknown, validator: Validator<T>): asserts value is T {
  const r = validator(value as T);
  if (!r.ok) throw new TypeError(`Validation failed: ${r.error}`);
}

// 44. Safe parse — return value or undefined
function safeParse<T>(value: unknown, validator: Validator<T>): T | undefined {
  const r = validator(value as T);
  return r.ok ? (value as T) : undefined;
}

// 45. Validator registry
class ValidatorRegistry {
  private store = new Map<string, Validator<unknown>>();
  register<T>(name: string, validator: Validator<T>): void {
    this.store.set(name, validator as Validator<unknown>);
  }
  get<T>(name: string): Validator<T> | undefined {
    return this.store.get(name) as Validator<T> | undefined;
  }
  validate<T>(name: string, value: T): ValidationResult {
    const v = this.get<T>(name);
    if (!v) return fail(`No validator registered for: ${name}`);
    return v(value);
  }
}

// 46. Typed input sanitizer + validator
interface SanitizeConfig<T> { sanitize: (v: T) => T; validate: Validator<T>; }
function sanitizeAndValidate<T>(value: T, config: SanitizeConfig<T>): { value: T; result: ValidationResult } {
  const sanitized = config.sanitize(value);
  return { value: sanitized, result: config.validate(sanitized) };
}

// 47. Context-aware validator
type ContextualValidator<T, C> = (value: T, context: C) => ValidationResult;
function contextual<T, C>(fn: ContextualValidator<T, C>): ContextualValidator<T, C> { return fn; }

// 48. Multi-locale error messages
type Locale = "en" | "fr" | "es";
type LocaleMessages = Record<string, Record<Locale, string>>;
const messages: LocaleMessages = {
  required: { en: "This field is required", fr: "Ce champ est requis", es: "Este campo es requerido" },
  min_length: { en: "Too short", fr: "Trop court", es: "Demasiado corto" },
};
function localizedFail(key: string, locale: Locale): ValidationResult {
  return fail(messages[key]?.[locale] ?? key);
}

// 49. Validator composition with types
type ComposedValidator<T> = { and<U>(other: Validator<U>): ComposedValidator<T & U>; build(): Validator<T>; };
function compose<T>(v: Validator<T>): ComposedValidator<T> {
  return {
    and<U>(other: Validator<U>): ComposedValidator<T & U> {
      return compose(intersection(v, other));
    },
    build(): Validator<T> { return v; },
  };
}
function intersection<A, B>(va: Validator<A>, vb: Validator<B>): Validator<A & B> {
  return (value) => { const r = va(value as A); return r.ok ? vb(value as B) : r; };
}

// 50. Version-aware schema migration
interface SchemaVersion<T> { version: number; validator: Validator<T>; migrate?: (old: unknown) => T; }
function validateWithMigration<T>(value: unknown, versions: SchemaVersion<T>[], currentVersion: number): T {
  for (const v of [...versions].reverse()) {
    const r = v.validator(value as T);
    if (r.ok) return value as T;
    if (v.migrate && v.version < currentVersion) return v.migrate(value);
  }
  throw new Error("No compatible schema version found");
}
