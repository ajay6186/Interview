export {};

// ============================================================
// NESTED EXAMPLES — Validation Library (50 Examples)
// ============================================================

// 1. Recursive schema type — deeply nested object validation
type Schema<T> = T extends object
  ? { [K in keyof T]: Schema<T[K]> | Validator<T[K]> }
  : Validator<T>;

type Validator<T> = (value: T) => ValidationResult;
type ValidationResult = { ok: true } | { ok: false; error: string };
const ok: ValidationResult = { ok: true };
function fail(error: string): ValidationResult { return { ok: false, error }; }

// 2. Deeply nested address schema
interface Address { street: string; city: string; country: string; zip: string; }
interface UserProfile { name: string; email: string; address: Address; age: number; }

const addressValidator: Validator<Address> = (v) => {
  if (!v.street) return fail("address.street required");
  if (!v.city) return fail("address.city required");
  if (!v.country) return fail("address.country required");
  if (!/^\d{5}(-\d{4})?$/.test(v.zip)) return fail("address.zip invalid");
  return ok;
};

// 3. Nested user profile validator
function validateUserProfile(v: UserProfile): ValidationResult {
  if (!v.name?.trim()) return fail("name required");
  if (!/\S+@\S+\.\S+/.test(v.email)) return fail("email invalid");
  if (v.age < 0 || v.age > 150) return fail("age out of range");
  return addressValidator(v.address);
}

// 4. Deeply nested discriminated union validation
type ApiResponse<T> =
  | { status: "success"; data: T; metadata: { requestId: string; timestamp: number } }
  | { status: "error"; error: { code: string; message: string; details?: string[] }; retryAfter?: number }
  | { status: "pending"; jobId: string; progress: number };

function validateApiResponse<T>(
  response: ApiResponse<T>,
  validateData: Validator<T>
): ValidationResult {
  if (response.status === "success") {
    if (!response.metadata.requestId) return fail("metadata.requestId required");
    return validateData(response.data);
  }
  if (response.status === "error") {
    if (!response.error.code) return fail("error.code required");
    return ok;
  }
  if (response.status === "pending") {
    if (response.progress < 0 || response.progress > 100) return fail("progress out of range [0, 100]");
    return ok;
  }
  return fail("Unknown response status");
}

// 5. Recursive tree validation
interface TreeNode<T> { value: T; children?: TreeNode<T>[]; }
function validateTree<T>(
  node: TreeNode<T>,
  validateValue: Validator<T>,
  depth = 0,
  maxDepth = 10
): ValidationResult {
  if (depth > maxDepth) return fail(`Tree depth exceeds maximum of ${maxDepth}`);
  const r = validateValue(node.value);
  if (!r.ok) return fail(`[depth ${depth}] ${r.error}`);
  if (node.children) {
    for (let i = 0; i < node.children.length; i++) {
      const cr = validateTree(node.children[i], validateValue, depth + 1, maxDepth);
      if (!cr.ok) return fail(`[child ${i}] ${cr.error}`);
    }
  }
  return ok;
}

// 6. Deep path error — track full key path on failure
interface PathResult { ok: boolean; path: string[]; error?: string; }
function validatePath<T>(value: T, validators: [string, Validator<unknown>][]): PathResult[] {
  return validators.map(([path, v]) => {
    const parts = path.split(".");
    let current: unknown = value;
    for (const part of parts) {
      if (typeof current !== "object" || current === null) {
        return { ok: false, path: parts, error: `${path} not found` };
      }
      current = (current as Record<string, unknown>)[part];
    }
    const r = v(current);
    return r.ok ? { ok: true, path: parts } : { ok: false, path: parts, error: r.error };
  });
}

// 7. Dependent field validation — field B depends on field A
type DependentRule<T> = {
  when: { field: keyof T; condition: (v: T[keyof T]) => boolean };
  then: { field: keyof T; validate: Validator<T[keyof T]> };
};
function applyDependentRules<T>(value: T, rules: DependentRule<T>[]): ValidationResult {
  for (const rule of rules) {
    if (rule.when.condition(value[rule.when.field])) {
      const r = rule.then.validate(value[rule.then.field]);
      if (!r.ok) return fail(`When ${String(rule.when.field)} is set: ${rule.then.field}: ${r.error}`);
    }
  }
  return ok;
}

// 8. Complex form validation with dependent fields
interface RegisterForm {
  accountType: "personal" | "business";
  companyName?: string;
  companySize?: number;
  name: string;
  email: string;
}
const registerRules: DependentRule<RegisterForm>[] = [
  {
    when: { field: "accountType", condition: v => v === "business" },
    then: { field: "companyName", validate: v => (v && String(v).trim()) ? ok : fail("Company name required for business accounts") },
  },
  {
    when: { field: "accountType", condition: v => v === "business" },
    then: { field: "companySize", validate: v => (typeof v === "number" && v > 0) ? ok : fail("Company size must be positive") },
  },
];

// 9. Schema versioning — validate with migration support
interface V1Schema { version: 1; name: string; }
interface V2Schema { version: 2; firstName: string; lastName: string; }
type AnyVersionSchema = V1Schema | V2Schema;
function migrateToV2(v1: V1Schema): V2Schema {
  const [first = "", ...rest] = v1.name.split(" ");
  return { version: 2, firstName: first, lastName: rest.join(" ") };
}
function validateAndMigrate(data: AnyVersionSchema): V2Schema {
  if (data.version === 1) return migrateToV2(data);
  if (!data.firstName || !data.lastName) throw new Error("Invalid V2 schema");
  return data;
}

// 10. Lazy recursive schema for graph validation
interface GraphNode { id: string; edges: GraphNode[]; value: number; }
const graphNodeValidator: Validator<GraphNode> = (node) => {
  if (!node.id) return fail("id required");
  if (typeof node.value !== "number") return fail("value must be number");
  for (const edge of node.edges ?? []) {
    const r = graphNodeValidator(edge);
    if (!r.ok) return fail(`edge ${edge.id}: ${r.error}`);
  }
  return ok;
};

// 11. Schema inheritance — extend base schema
interface BaseEntity { id: number; createdAt: string; updatedAt: string; }
interface Product extends BaseEntity { name: string; price: number; stock: number; }
function validateBase(v: BaseEntity): ValidationResult {
  if (!Number.isInteger(v.id) || v.id <= 0) return fail("id must be positive integer");
  if (!Date.parse(v.createdAt)) return fail("createdAt invalid date");
  return ok;
}
function validateProduct(v: Product): ValidationResult {
  const base = validateBase(v);
  if (!base.ok) return base;
  if (!v.name.trim()) return fail("name required");
  if (v.price < 0) return fail("price cannot be negative");
  if (v.stock < 0) return fail("stock cannot be negative");
  return ok;
}

// 12. Nested array of objects validation
function validateArray<T>(items: T[], validator: Validator<T>): { index: number; error: string }[] {
  const errors: { index: number; error: string }[] = [];
  for (let i = 0; i < items.length; i++) {
    const r = validator(items[i]);
    if (!r.ok) errors.push({ index: i, error: r.error });
  }
  return errors;
}

// 13. Typed deep error collection
type DeepErrors<T> = T extends object
  ? { [K in keyof T]?: DeepErrors<T[K]> }
  : string | undefined;

// 14. Collect deep errors from nested object
function collectDeepErrors<T extends object>(
  value: T,
  validators: { [K in keyof T]?: Validator<T[K]> }
): DeepErrors<T> {
  const errors = {} as DeepErrors<T>;
  for (const key in validators) {
    const v = validators[key]!;
    const r = v(value[key]);
    if (!r.ok) (errors as Record<string, unknown>)[key] = r.error;
  }
  return errors;
}

// 15. Multi-level schema composition
interface OrderLine { productId: number; quantity: number; price: number; }
interface Order { id: string; customerId: number; lines: OrderLine[]; discount?: number; }

function validateOrderLine(v: OrderLine): ValidationResult {
  if (!Number.isInteger(v.productId) || v.productId <= 0) return fail("productId invalid");
  if (!Number.isInteger(v.quantity) || v.quantity <= 0) return fail("quantity must be positive integer");
  if (v.price < 0) return fail("price cannot be negative");
  return ok;
}
function validateOrder(v: Order): ValidationResult {
  if (!v.id.trim()) return fail("id required");
  if (!Number.isInteger(v.customerId) || v.customerId <= 0) return fail("customerId invalid");
  if (!v.lines.length) return fail("order must have at least one line");
  for (let i = 0; i < v.lines.length; i++) {
    const r = validateOrderLine(v.lines[i]);
    if (!r.ok) return fail(`lines[${i}]: ${r.error}`);
  }
  if (v.discount !== undefined && (v.discount < 0 || v.discount > 100)) return fail("discount must be 0-100");
  return ok;
}

// 16. Polymorphic validation — different validators based on discriminant
type Payment =
  | { method: "card"; cardNumber: string; cvv: string; expiry: string }
  | { method: "paypal"; email: string }
  | { method: "crypto"; walletAddress: string; currency: "BTC" | "ETH" };

function validatePayment(p: Payment): ValidationResult {
  if (p.method === "card") {
    if (!/^\d{16}$/.test(p.cardNumber.replace(/\s/g, ""))) return fail("Invalid card number");
    if (!/^\d{3,4}$/.test(p.cvv)) return fail("Invalid CVV");
    if (!/^\d{2}\/\d{2}$/.test(p.expiry)) return fail("Invalid expiry (MM/YY)");
  } else if (p.method === "paypal") {
    if (!/\S+@\S+\.\S+/.test(p.email)) return fail("Invalid PayPal email");
  } else {
    if (!p.walletAddress.trim()) return fail("Wallet address required");
    if (!["BTC", "ETH"].includes(p.currency)) return fail("Unsupported currency");
  }
  return ok;
}

// 17. Conditional schema — different validation based on runtime type
function conditional<T>(
  discriminant: (v: T) => string,
  validators: Record<string, Validator<T>>
): Validator<T> {
  return (value) => {
    const key = discriminant(value);
    const validator = validators[key];
    if (!validator) return fail(`No validator for type: ${key}`);
    return validator(value);
  };
}

// 18. Typed JSON schema validator
interface JsonSchema {
  type: "string" | "number" | "boolean" | "object" | "array" | "null";
  required?: string[];
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
}
function validateAgainstJsonSchema(value: unknown, schema: JsonSchema): ValidationResult {
  if (schema.type === "null" && value === null) return ok;
  if (schema.type === "string") {
    if (typeof value !== "string") return fail(`Expected string`);
    if (schema.minLength && value.length < schema.minLength) return fail(`Min length ${schema.minLength}`);
    if (schema.maxLength && value.length > schema.maxLength) return fail(`Max length ${schema.maxLength}`);
    return ok;
  }
  if (schema.type === "number") {
    if (typeof value !== "number") return fail("Expected number");
    if (schema.minimum !== undefined && value < schema.minimum) return fail(`Min ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum) return fail(`Max ${schema.maximum}`);
    return ok;
  }
  if (schema.type === "boolean") return typeof value === "boolean" ? ok : fail("Expected boolean");
  if (schema.type === "object") {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return fail("Expected object");
    const obj = value as Record<string, unknown>;
    for (const req of schema.required ?? []) {
      if (!(req in obj)) return fail(`Missing required property: ${req}`);
    }
    for (const [key, propSchema] of Object.entries(schema.properties ?? {})) {
      if (key in obj) {
        const r = validateAgainstJsonSchema(obj[key], propSchema);
        if (!r.ok) return fail(`${key}: ${r.error}`);
      }
    }
    return ok;
  }
  if (schema.type === "array") {
    if (!Array.isArray(value)) return fail("Expected array");
    if (schema.items) {
      for (let i = 0; i < value.length; i++) {
        const r = validateAgainstJsonSchema(value[i], schema.items);
        if (!r.ok) return fail(`[${i}]: ${r.error}`);
      }
    }
    return ok;
  }
  return fail(`Unknown schema type: ${schema.type}`);
}

// 19. Recursive record validator
function validateRecord<K extends string, V>(
  obj: Record<K, V>,
  keyValidator: Validator<K>,
  valueValidator: Validator<V>
): ValidationResult {
  for (const [k, v] of Object.entries(obj)) {
    const kr = keyValidator(k as K);
    if (!kr.ok) return fail(`Key '${k}': ${kr.error}`);
    const vr = valueValidator(v as V);
    if (!vr.ok) return fail(`Value at '${k}': ${vr.error}`);
  }
  return ok;
}

// 20. Typed validation pipeline with context sharing
interface ValidationContext { user?: { id: number; role: string }; data: unknown; }
type ContextualValidator<T> = (value: T, ctx: ValidationContext) => ValidationResult;

// 21. Context-aware role-based field validation
function requireRole(role: string, validator: ContextualValidator<unknown>): ContextualValidator<unknown> {
  return (value, ctx) => {
    if (ctx.user?.role !== role) return ok;
    return validator(value, ctx);
  };
}

// 22. Cross-field async validation pipeline
interface AsyncValidationPipeline<T> {
  steps: Array<(value: T) => Promise<ValidationResult>>;
}
async function runAsyncPipeline<T>(value: T, pipeline: AsyncValidationPipeline<T>): Promise<ValidationResult[]> {
  return Promise.all(pipeline.steps.map(step => step(value)));
}

// 23. Union of schemas — matches first valid
function oneOf<T>(...validators: Validator<unknown>[]): Validator<unknown> {
  return (v) => {
    const errors: string[] = [];
    for (const validator of validators) {
      const r = validator(v);
      if (r.ok) return ok;
      errors.push(r.error);
    }
    return fail(`No schema matched: [${errors.join(", ")}]`);
  };
}

// 24. Schema intersection — must pass all
function allOf<T>(...validators: Validator<T>[]): Validator<T> {
  return (v) => {
    for (const validator of validators) {
      const r = validator(v);
      if (!r.ok) return r;
    }
    return ok;
  };
}

// 25. Deep partial schema validation — validate only present fields
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };
function validateDeepPartial<T extends object>(
  value: DeepPartial<T>,
  validators: { [K in keyof T]?: Validator<T[K]> }
): ValidationResult {
  for (const key in validators) {
    const val = (value as Partial<T>)[key];
    if (val !== undefined) {
      const r = validators[key]!(val as T[typeof key]);
      if (!r.ok) return fail(`${key}: ${r.error}`);
    }
  }
  return ok;
}

// 26. Validation result accumulator
class ValidationAccumulator {
  private errors: Array<{ path: string; message: string }> = [];
  check(path: string, result: ValidationResult): this {
    if (!result.ok) this.errors.push({ path, message: result.error });
    return this;
  }
  checkField<T, K extends keyof T>(obj: T, field: K, validator: Validator<T[K]>): this {
    return this.check(String(field), validator(obj[field]));
  }
  isValid(): boolean { return this.errors.length === 0; }
  getErrors(): typeof this.errors { return this.errors; }
  toResult(): ValidationResult {
    return this.isValid() ? ok : fail(this.errors.map(e => `${e.path}: ${e.message}`).join("; "));
  }
}

// 27. Nested schema with default values
interface SchemaWithDefault<T> { validator: Validator<T>; default?: T; }
function applyDefaults<T extends object>(
  value: Partial<T>,
  schema: { [K in keyof T]: SchemaWithDefault<T[K]> }
): T {
  const result = { ...value } as T;
  for (const key in schema) {
    if ((result as Partial<T>)[key] === undefined && schema[key].default !== undefined) {
      result[key] = schema[key].default!;
    }
  }
  return result;
}

// 28. Type-safe form array with nested schemas
interface InvoiceItem { description: string; qty: number; unitPrice: number; }
interface Invoice { invoiceNumber: string; items: InvoiceItem[]; tax: number; }
function validateInvoice(inv: Invoice): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!inv.invoiceNumber.trim()) errors.push("invoiceNumber required");
  if (!inv.items.length) errors.push("items cannot be empty");
  for (let i = 0; i < inv.items.length; i++) {
    const item = inv.items[i];
    if (!item.description.trim()) errors.push(`items[${i}].description required`);
    if (item.qty <= 0) errors.push(`items[${i}].qty must be positive`);
    if (item.unitPrice < 0) errors.push(`items[${i}].unitPrice cannot be negative`);
  }
  if (inv.tax < 0 || inv.tax > 1) errors.push("tax must be between 0 and 1");
  return { valid: errors.length === 0, errors };
}

// 29. Validation with warnings (non-blocking issues)
interface ValidationReport { ok: boolean; errors: string[]; warnings: string[]; }
function validateWithWarnings<T>(
  value: T,
  rules: { check: Validator<T>; severity: "error" | "warning" }[]
): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  for (const rule of rules) {
    const r = rule.check(value);
    if (!r.ok) {
      if (rule.severity === "error") errors.push(r.error);
      else warnings.push(r.error);
    }
  }
  return { ok: errors.length === 0, errors, warnings };
}

// 30. Schema-driven input masking
interface MaskedField { value: string; masked: string; valid: boolean; }
function createMaskedField(value: string, mask: RegExp, maskChar = "*"): MaskedField {
  const masked = value.replace(/./g, maskChar);
  return { value, masked, valid: mask.test(value) };
}

// 31. Typed validation event system
type ValidationEvent =
  | { type: "field_valid"; field: string }
  | { type: "field_invalid"; field: string; error: string }
  | { type: "form_valid" }
  | { type: "form_invalid"; errors: string[] };

class ValidationEmitter {
  private handlers: ((e: ValidationEvent) => void)[] = [];
  on(fn: (e: ValidationEvent) => void): () => void {
    this.handlers.push(fn);
    return () => { this.handlers = this.handlers.filter(h => h !== fn); };
  }
  emit(event: ValidationEvent): void { this.handlers.forEach(h => h(event)); }
}

// 32. Form validation with emitter
function validateFormWithEvents<T extends object>(
  value: T,
  validators: { [K in keyof T]?: Validator<T[K]> },
  emitter: ValidationEmitter
): boolean {
  const errors: string[] = [];
  for (const key in validators) {
    const r = validators[key]!(value[key]);
    if (r.ok) emitter.emit({ type: "field_valid", field: key });
    else { emitter.emit({ type: "field_invalid", field: key, error: r.error }); errors.push(r.error); }
  }
  if (errors.length === 0) emitter.emit({ type: "form_valid" });
  else emitter.emit({ type: "form_invalid", errors });
  return errors.length === 0;
}

// 33. Typed zod-like schema builder
class ZodLike<T> {
  constructor(private _validate: Validator<T>) {}
  parse(v: unknown): T {
    const r = this._validate(v as T);
    if (!r.ok) throw new Error(r.error);
    return v as T;
  }
  safeParse(v: unknown): { success: true; data: T } | { success: false; error: string } {
    const r = this._validate(v as T);
    if (r.ok) return { success: true, data: v as T };
    return { success: false, error: r.error };
  }
  optional(): ZodLike<T | undefined> {
    return new ZodLike<T | undefined>(v => v === undefined ? ok : this._validate(v as T));
  }
  nullable(): ZodLike<T | null> {
    return new ZodLike<T | null>(v => v === null ? ok : this._validate(v as T));
  }
  refine(fn: (v: T) => boolean, message: string): ZodLike<T> {
    return new ZodLike<T>(v => { const r = this._validate(v); return r.ok ? (fn(v) ? ok : fail(message)) : r; });
  }
}

// 34. Zod-like string schema
const z = {
  string: () => new ZodLike<string>(v => typeof v === "string" ? ok : fail("Expected string")),
  number: () => new ZodLike<number>(v => typeof v === "number" ? ok : fail("Expected number")),
  boolean: () => new ZodLike<boolean>(v => typeof v === "boolean" ? ok : fail("Expected boolean")),
};

// 35. Typed runtime shape guard from schema
function shapeGuard<T>(validators: { [K in keyof T]: Validator<T[K]> }): (v: unknown) => v is T {
  return (v): v is T => {
    if (typeof v !== "object" || v === null) return false;
    for (const key in validators) {
      const r = validators[key]((v as Record<string, unknown>)[key] as T[typeof key]);
      if (!r.ok) return false;
    }
    return true;
  };
}

// 36. Validate nested config with env overrides
interface AppConfig { server: { port: number; host: string }; db: { url: string; pool: number }; }
function validateConfig(config: unknown, env: Record<string, string>): AppConfig {
  const merged = {
    server: { port: parseInt(env["PORT"] ?? "3000"), host: env["HOST"] ?? "localhost" },
    db: { url: env["DATABASE_URL"] ?? "", pool: parseInt(env["DB_POOL"] ?? "5") },
    ...(typeof config === "object" ? config : {}),
  } as AppConfig;
  if (isNaN(merged.server.port)) throw new Error("Invalid port");
  if (!merged.db.url) throw new Error("DATABASE_URL required");
  return merged;
}

// 37. Typed multi-step form validation
interface Step1Data { name: string; email: string; }
interface Step2Data { address: string; zip: string; }
interface Step3Data { paymentMethod: "card" | "paypal"; }
type FormData = Step1Data & Step2Data & Step3Data;

function validateStep1(v: Step1Data): ValidationResult {
  if (!v.name.trim()) return fail("Name required");
  if (!/\S+@\S+\.\S+/.test(v.email)) return fail("Invalid email");
  return ok;
}
function validateStep2(v: Step2Data): ValidationResult {
  if (!v.address.trim()) return fail("Address required");
  if (!/^\d{5}$/.test(v.zip)) return fail("Invalid zip");
  return ok;
}
function validateStep3(v: Step3Data): ValidationResult {
  if (!["card", "paypal"].includes(v.paymentMethod)) return fail("Invalid payment method");
  return ok;
}
function validateCompleteForm(v: FormData): ValidationResult {
  const s1 = validateStep1(v);
  if (!s1.ok) return s1;
  const s2 = validateStep2(v);
  if (!s2.ok) return s2;
  return validateStep3(v);
}

// 38. Typed i18n validation messages
type Locale = "en" | "fr" | "de";
type MessageKey = "required" | "too_short" | "invalid_email" | "out_of_range";
const i18nMessages: Record<MessageKey, Record<Locale, string>> = {
  required: { en: "This field is required", fr: "Ce champ est obligatoire", de: "Dieses Feld ist erforderlich" },
  too_short: { en: "Too short", fr: "Trop court", de: "Zu kurz" },
  invalid_email: { en: "Invalid email", fr: "Email invalide", de: "Ungültige E-Mail" },
  out_of_range: { en: "Out of range", fr: "Hors plage", de: "Außerhalb des Bereichs" },
};
function localizedFail(key: MessageKey, locale: Locale): ValidationResult {
  return fail(i18nMessages[key][locale]);
}

// 39. Typed schema diff — check which fields changed and re-validate
type SchemaChange<T> = { field: keyof T; oldValue: T[keyof T]; newValue: T[keyof T] };
function detectChanges<T>(oldObj: T, newObj: T): SchemaChange<T>[] {
  return (Object.keys(newObj as object) as (keyof T)[])
    .filter(k => oldObj[k] !== newObj[k])
    .map(k => ({ field: k, oldValue: oldObj[k], newValue: newObj[k] }));
}
function validateChangedFields<T>(
  changes: SchemaChange<T>[],
  validators: { [K in keyof T]?: Validator<T[K]> }
): ValidationResult {
  for (const change of changes) {
    const v = validators[change.field];
    if (!v) continue;
    const r = v(change.newValue as T[typeof change.field]);
    if (!r.ok) return fail(`${String(change.field)}: ${r.error}`);
  }
  return ok;
}

// 40. Validate nested config with template literals
type Env = "development" | "staging" | "production";
interface EnvConfig<E extends Env> { env: E; debug: E extends "production" ? false : boolean; apiUrl: string; }
function validateEnvConfig<E extends Env>(config: EnvConfig<E>): ValidationResult {
  if (config.env === "production" && config.debug) return fail("debug must be false in production");
  if (!config.apiUrl.startsWith("https://") && config.env === "production") return fail("Production must use HTTPS");
  return ok;
}

// 41. Validation with structural subtyping check
type HasId = { id: number };
type HasName = { name: string };
function isHasId(v: unknown): v is HasId {
  return typeof v === "object" && v !== null && typeof (v as HasId).id === "number";
}
function isHasName(v: unknown): v is HasName {
  return typeof v === "object" && v !== null && typeof (v as HasName).name === "string";
}

// 42. Typed test fixture validator
type Fixture<T> = { input: T; expected: ValidationResult; description: string };
function runFixtures<T>(validator: Validator<T>, fixtures: Fixture<T>[]): { passed: number; failed: string[] } {
  let passed = 0;
  const failed: string[] = [];
  for (const fixture of fixtures) {
    const result = validator(fixture.input);
    const matches = result.ok === fixture.expected.ok;
    if (matches) passed++;
    else failed.push(`${fixture.description}: expected ${fixture.expected.ok ? "ok" : "fail"}, got ${result.ok ? "ok" : `fail(${result.error})`}`);
  }
  return { passed, failed };
}

// 43. Typed schema registry
class SchemaRegistry {
  private schemas = new Map<string, Validator<unknown>>();
  register<T>(name: string, validator: Validator<T>): void {
    this.schemas.set(name, validator as Validator<unknown>);
  }
  validate(name: string, value: unknown): ValidationResult {
    const v = this.schemas.get(name);
    if (!v) return fail(`Schema '${name}' not registered`);
    return v(value);
  }
  has(name: string): boolean { return this.schemas.has(name); }
}

// 44. Typed runtime constraint system
interface Constraint<T> { name: string; check: Validator<T>; severity: "error" | "warning" | "info"; }
function applyConstraints<T>(value: T, constraints: Constraint<T>[]): { violations: Constraint<T>[]; ok: boolean } {
  const violations = constraints.filter(c => !c.check(value).ok);
  return { violations, ok: !violations.some(v => v.severity === "error") };
}

// 45. Nested config schema with typed defaults
type ConfigDefaults<T> = { [K in keyof T]: T[K] extends object ? ConfigDefaults<T[K]> : T[K] | undefined };
function mergeWithDefaults<T extends object>(config: Partial<T>, defaults: ConfigDefaults<T>): T {
  const result = { ...defaults } as T;
  for (const key in config) {
    const val = config[key];
    if (val !== undefined) result[key] = val as T[typeof key];
  }
  return result;
}

// 46. Typed union discrimination validator
function discriminateUnion<T extends { type: string }>(
  validators: { [K in T["type"]]: Validator<Extract<T, { type: K }>> }
): Validator<T> {
  return (v) => {
    const validator = validators[v.type as T["type"]];
    if (!validator) return fail(`Unknown type: ${v.type}`);
    return (validator as Validator<T>)(v);
  };
}

// 47. Coerce and validate — parse incoming data
function coerceString(v: unknown): string { return v == null ? "" : String(v); }
function coerceNumber(v: unknown): number { return Number(v); }
function coerceBoolean(v: unknown): boolean { return Boolean(v); }
function coerceAndValidate<T>(raw: unknown, coerce: (v: unknown) => T, validator: Validator<T>): { value: T; result: ValidationResult } {
  const value = coerce(raw);
  return { value, result: validator(value) };
}

// 48. Typed nested validation errors tree
type ValidationTree<T> = T extends object
  ? { [K in keyof T]?: ValidationTree<T[K]> | string }
  : string;
function buildValidationTree<T extends object>(
  value: T,
  validators: { [K in keyof T]?: Validator<T[K]> }
): ValidationTree<T> {
  const tree = {} as ValidationTree<T>;
  for (const key in validators) {
    const r = validators[key]!(value[key]);
    if (!r.ok) (tree as Record<string, unknown>)[key] = r.error;
  }
  return tree;
}

// 49. Typed schema evolution — add new fields with migration
interface SchemaV1 { name: string; age: number; }
interface SchemaV2 { name: string; age: number; email: string; }
function migrateV1ToV2(v1: SchemaV1, defaultEmail: string): SchemaV2 {
  return { ...v1, email: defaultEmail };
}
function validateSchemaVersion(data: unknown, expectedVersion: number): ValidationResult {
  if (typeof data !== "object" || data === null) return fail("Expected object");
  const version = (data as { _version?: unknown })._version;
  if (typeof version !== "number") return fail("Missing _version field");
  if (version !== expectedVersion) return fail(`Expected schema version ${expectedVersion}, got ${version}`);
  return ok;
}

// 50. Full validation framework with types, transformations, and error collection
class TypedValidator<TIn, TOut = TIn> {
  constructor(
    private _transform: (v: TIn) => TOut,
    private _validators: Validator<TOut>[]
  ) {}
  static from<T>(validator: Validator<T>): TypedValidator<T> {
    return new TypedValidator(v => v, [validator]);
  }
  transform<TNew>(fn: (v: TOut) => TNew): TypedValidator<TIn, TNew> {
    return new TypedValidator<TIn, TNew>(v => fn(this._transform(v)), []);
  }
  check(validator: Validator<TOut>): TypedValidator<TIn, TOut> {
    return new TypedValidator(this._transform, [...this._validators, validator]);
  }
  run(input: TIn): { value: TOut; errors: string[] } {
    const value = this._transform(input);
    const errors = this._validators.flatMap(v => { const r = v(value); return r.ok ? [] : [r.error]; });
    return { value, errors };
  }
}
