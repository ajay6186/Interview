export {};

// ============================================================
// ADVANCED EXAMPLES — Branded Types (50 Examples)
// ============================================================

type Brand<T, B extends string> = T & { readonly __brand: B };

// 1. Generic brand factory with type-level brand name
type Branded<T, Brand extends string> = T & { readonly [K in `__${Brand}`]: true };
type StrictUserId = Branded<string, "UserId">;
type StrictOrderId = Branded<string, "OrderId">;
// StrictUserId and StrictOrderId are structurally incompatible

// 2. Multi-brand intersection — require multiple validations passed
type Trimmed = Brand<string, "Trimmed">;
type NoHTML = Brand<string, "NoHTML">;
type LengthOk = Brand<string, "LengthOk">;
type FullyValidated = Trimmed & NoHTML & LengthOk;
function fullyValidate(s: string): FullyValidated {
  const t = s.trim() as Trimmed;
  const n = t.replace(/<[^>]*>/g, "") as unknown as NoHTML;
  if ((n as string).length === 0) throw new Error("Empty");
  return n as unknown as FullyValidated;
}

// 3. Phantom-type refined brand
declare const _tag: unique symbol;
type PhantomBrand<T, Tag> = T & { readonly [_tag]: Tag };
type InvoiceId = PhantomBrand<number, "Invoice">;
type CustomerId = PhantomBrand<number, "Customer">;
function getInvoice(id: InvoiceId): string { return `Invoice#${id}`; }
// getInvoice(42 as CustomerId); // Error — brand mismatch

// 4. Refinement type with predicate attached
interface Refinement<T, B extends string> {
  readonly brand: B;
  validate(value: T): value is Brand<T, B>;
  make(value: T): Brand<T, B>;
}
function createRefinement<T, B extends string>(brand: B, predicate: (v: T) => boolean): Refinement<T, B> {
  return {
    brand,
    validate(value: T): value is Brand<T, B> { return predicate(value); },
    make(value: T): Brand<T, B> {
      if (!predicate(value)) throw new Error(`Value failed ${brand} refinement`);
      return value as Brand<T, B>;
    },
  };
}
type PositiveNum = Brand<number, "Positive">;
const Positive = createRefinement<number, "Positive">("Positive", n => n > 0);

// 5. Branded builder pattern — accumulate brands across steps
type WithId = Brand<object, "HasId">;
type WithName = Brand<object, "HasName">;
type WithEmail = Brand<object, "HasEmail">;
type CompleteUser = WithId & WithName & WithEmail & { id: string; name: string; email: string };
class UserBuilder {
  private data: Partial<{ id: string; name: string; email: string }> = {};
  setId(id: string): this & { _has: WithId } { this.data.id = id; return this as any; }
  setName(name: string): this & { _has: WithName } { this.data.name = name; return this as any; }
  setEmail(email: string): this & { _has: WithEmail } { this.data.email = email; return this as any; }
  build(this: { _has: WithId & WithName & WithEmail }): CompleteUser {
    return (this as unknown as UserBuilder).data as CompleteUser;
  }
}

// 6. Type-level brand check with conditional types
type HasBrand<T, B extends string> = T extends Brand<infer _, B> ? true : false;
type A6 = HasBrand<Brand<string, "Email">, "Email">; // true
type B6 = HasBrand<string, "Email">; // false

// 7. ExtractBrand utility — get brand name from branded type
type ExtractBrand<T> = T extends Brand<infer _, infer B> ? B : never;
type EmailBrand = ExtractBrand<Brand<string, "Email">>; // "Email"
type NumBrand = ExtractBrand<Brand<number, "Score">>; // "Score"

// 8. UnwrapBrand utility — get base type
type UnwrapBrand<T> = T extends Brand<infer Base, string> ? Base : T;
type Base8a = UnwrapBrand<Brand<string, "Email">>; // string
type Base8b = UnwrapBrand<Brand<number, "Score">>; // number

// 9. Recursive brand stripping
type StripBrands<T> = T extends Brand<infer U, string> ? StripBrands<U> : T;
type DeepBrand = Brand<Brand<Brand<string, "A">, "B">, "C">;
type Stripped9 = StripBrands<DeepBrand>; // string

// 10. Branded mapped type — brand every property value
type BrandValues<T, B extends string> = {
  [K in keyof T]: T[K] extends string ? Brand<T[K], B> : T[K];
};
type RawUser10 = { id: string; name: string; age: number };
type SanitizedUser10 = BrandValues<RawUser10, "Sanitized">;

// 11. Type-safe branded store with enforced key types
type EntityId<T extends string> = Brand<string, `${T}Id`>;
type UserEntityId = EntityId<"User">;
type ProductEntityId = EntityId<"Product">;
class TypedStore<Id extends Brand<string, string>, Entity> {
  private store = new Map<string, Entity>();
  set(id: Id, entity: Entity): void { this.store.set(id as string, entity); }
  get(id: Id): Entity | undefined { return this.store.get(id as string); }
  delete(id: Id): void { this.store.delete(id as string); }
}
const userStore = new TypedStore<UserEntityId, { name: string }>();

// 12. Branded function type — prevents passing wrong callbacks
type TypedCallback<Event extends string, Data> = Brand<(data: Data) => void, `Callback:${Event}`>;
function makeClickCallback(fn: (data: { x: number; y: number }) => void): TypedCallback<"click", { x: number; y: number }> {
  return fn as TypedCallback<"click", { x: number; y: number }>;
}
function registerClickHandler(cb: TypedCallback<"click", { x: number; y: number }>): void {}

// 13. Branded result type with tag discrimination
type Ok<T> = Brand<{ value: T }, "Ok">;
type Err<E> = Brand<{ error: E }, "Err">;
type Result<T, E = Error> = Ok<T> | Err<E>;
function ok<T>(value: T): Ok<T> { return { value } as Ok<T>; }
function err<E>(error: E): Err<E> { return { error } as Err<E>; }
function isOk<T, E>(r: Result<T, E>): r is Ok<T> { return "value" in r; }

// 14. Phantom types for measurement conversions
declare const _unit: unique symbol;
type Quantity<Unit extends string> = Brand<number, "Quantity"> & { [_unit]: Unit };
function quantity<U extends string>(value: number): Quantity<U> { return value as Quantity<U>; }
type Meters14 = Quantity<"m">;
type Kilometers = Quantity<"km">;
function metersToKm(m: Meters14): Kilometers { return quantity<"km">((m as unknown as number) / 1000); }

// 15. Branded type for cryptographic nonces
type Nonce = Brand<string, "Nonce">;
const usedNonces = new Set<string>();
function createNonce(): Nonce {
  const nonce = Math.random().toString(36).slice(2);
  return nonce as Nonce;
}
function consumeNonce(nonce: Nonce): boolean {
  if (usedNonces.has(nonce as string)) return false;
  usedNonces.add(nonce as string);
  return true;
}

// 16. Branded type with runtime class guard
class BrandedClass<T, B extends string> {
  readonly __brand!: B;
  constructor(readonly value: T) {}
  static is<T, B extends string>(brand: B, value: unknown): value is BrandedClass<T, B> {
    return value instanceof BrandedClass;
  }
}

// 17. Type-safe event payload schema via brands
type EventPayload<E extends string, D> = Brand<D, `Event:${E}`>;
type ClickPayload = EventPayload<"click", { x: number; y: number }>;
type SubmitPayload = EventPayload<"submit", { formId: string; data: Record<string, string> }>;
function dispatchEvent<E extends string, D>(event: E, payload: EventPayload<E, D>): void {
  console.log(`Dispatching ${event}:`, payload);
}

// 18. Branded type lattice — subtype relationships via intersections
type AuthToken = Brand<string, "AuthToken">;
type AdminToken = AuthToken & Brand<string, "AdminToken">;
type SuperAdminToken = AdminToken & Brand<string, "SuperAdminToken">;
function requireAdmin(token: AdminToken): void {}
function requireSuperAdmin(token: SuperAdminToken): void {}
const superToken = "x" as SuperAdminToken;
requireAdmin(superToken);    // OK — SuperAdmin extends Admin
requireSuperAdmin(superToken); // OK

// 19. Runtime brand registry with validation functions
type BrandedValidator<T, B extends string> = {
  brand: B;
  validate(v: unknown): v is Brand<T, B>;
};
const validators = new Map<string, BrandedValidator<unknown, string>>();
function registerValidator<T, B extends string>(v: BrandedValidator<T, B>): void {
  validators.set(v.brand, v as BrandedValidator<unknown, string>);
}

// 20. Branded type for safe SQL identifiers
type SqlIdentifier = Brand<string, "SqlIdentifier">;
const sqlIdRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
function makeSqlId(name: string): SqlIdentifier {
  if (!sqlIdRegex.test(name)) throw new Error(`Invalid SQL identifier: ${name}`);
  return name as SqlIdentifier;
}
function selectFrom(table: SqlIdentifier, columns: SqlIdentifier[]): Brand<string, "SafeQuery"> {
  return `SELECT ${columns.map(c => c).join(", ")} FROM ${table}` as Brand<string, "SafeQuery">;
}

// 21. Branded type for validated JSON schemas
type JsonSchema = Brand<object, "JsonSchema">;
function makeJsonSchema(obj: object): JsonSchema {
  if (!("type" in obj)) throw new Error("Missing type");
  return obj as JsonSchema;
}

// 22. Composable branded validators
type Validator<T, B extends string> = (v: T) => Brand<T, B>;
function compose<T, B1 extends string, B2 extends string>(
  v1: Validator<T, B1>,
  v2: Validator<Brand<T, B1>, B2>
): Validator<T, B2 & B1> {
  return (v: T) => v2(v1(v)) as unknown as Brand<T, B2 & B1>;
}

// 23. Brand-safe Record lookup
type BrandedKey<B extends string> = Brand<string, B>;
function lookup<K extends BrandedKey<string>, V>(
  record: Map<K, V>,
  key: K
): V | undefined {
  return record.get(key);
}

// 24. Type-safe HTTP method brand
type HttpMethod = Brand<"GET" | "POST" | "PUT" | "DELETE" | "PATCH", "HttpMethod">;
const GET: HttpMethod = "GET" as HttpMethod;
const POST: HttpMethod = "POST" as HttpMethod;
function makeRequest(method: HttpMethod, url: string): void {
  console.log(`${method} ${url}`);
}

// 25. Branded immutable object — prevent mutation
type Immutable<T extends object> = Readonly<Brand<T, "Immutable">>;
function freeze25<T extends object>(obj: T): Immutable<T> {
  return Object.freeze(obj) as Immutable<T>;
}
const config25 = freeze25({ host: "localhost", port: 3000 });
// config25.port = 4000; // Error — Readonly

// 26. Branded async pipeline
type AsyncPipeline<In, Out> = Brand<(input: In) => Promise<Out>, "AsyncPipeline">;
function makeAsyncPipeline<In, Out>(fn: (input: In) => Promise<Out>): AsyncPipeline<In, Out> {
  return fn as AsyncPipeline<In, Out>;
}
function chainPipelines<A, B, C>(
  p1: AsyncPipeline<A, B>,
  p2: AsyncPipeline<B, C>
): AsyncPipeline<A, C> {
  return makeAsyncPipeline(async (a: A) => p2(await p1(a)));
}

// 27. Structural brand strengthening with declaration merging
interface UserBrand { readonly _userBrand: unique symbol }
type UserId27 = string & UserBrand;
function makeUserId27(s: string): UserId27 { return s as UserId27; }

// 28. Brand as capability token
type Capability<C extends string> = Brand<symbol, `Cap:${C}`>;
function grantCapability<C extends string>(cap: C): Capability<C> {
  return Symbol(cap) as Capability<C>;
}
type ReadCap = Capability<"Read">;
type WriteCap = Capability<"Write">;
function withReadAccess(cap: ReadCap, action: () => void): void { action(); }

// 29. Branded error types
type NotFoundError = Brand<Error, "NotFoundError">;
type ValidationError = Brand<Error, "ValidationError">;
function makeNotFound(msg: string): NotFoundError {
  return Object.assign(new Error(msg), { name: "NotFoundError" }) as NotFoundError;
}
function handleError(err: NotFoundError | ValidationError): string {
  if ((err as Error & { __brand: string }).__brand === "NotFoundError") return "404";
  return "400";
}

// 30. Branded type for confirmed (idempotent) operations
type IdempotencyKey = Brand<string, "IdempotencyKey">;
const processedKeys = new Set<string>();
function withIdempotency(key: IdempotencyKey, op: () => void): void {
  if (processedKeys.has(key as string)) return;
  op();
  processedKeys.add(key as string);
}

// 31. Branded function overloads
type Parser<T, B extends string> = Brand<(input: string) => Brand<T, B>, "Parser">;
function makeParser<T, B extends string>(
  parse: (input: string) => T,
  brand: B
): Parser<T, B> {
  return ((input: string) => parse(input) as Brand<T, B>) as Parser<T, B>;
}
const intParser = makeParser(parseInt, "Integer");

// 32. Brand for type-safe template literals
type TemplateBrand<T extends string> = Brand<string, T>;
type HtmlTemplate = TemplateBrand<"HtmlTemplate">;
type SqlTemplate = TemplateBrand<"SqlTemplate">;
function html(strings: TemplateStringsArray, ...values: (string | number)[]): HtmlTemplate {
  return String.raw(strings, ...values) as HtmlTemplate;
}

// 33. Covariant/contravariant brands
type ReadonlyId<T extends string> = Brand<string, `Readonly:${T}`>;
type WritableId<T extends string> = Brand<string, `Writable:${T}`>;
function toReadonly<T extends string>(id: WritableId<T>): ReadonlyId<T> {
  return id as unknown as ReadonlyId<T>;
}

// 34. Branded type guard with assertion function
function assertBrand<T, B extends string>(
  value: T,
  predicate: (v: T) => boolean,
  brand: B
): asserts value is Brand<T, B> {
  if (!predicate(value)) throw new Error(`Value failed ${brand} assertion`);
}
const maybeEmail34 = "test@example.com";
assertBrand(maybeEmail34, s => s.includes("@"), "Email");
// Now maybeEmail34 is Brand<string, "Email">

// 35. Branded type for locale-aware formatting
type FormattedNumber = Brand<string, "FormattedNumber">;
type FormattedDate = Brand<string, "FormattedDate">;
function formatNumber35(n: number, locale: string): FormattedNumber {
  return new Intl.NumberFormat(locale).format(n) as FormattedNumber;
}
function formatDate35(d: Date, locale: string): FormattedDate {
  return new Intl.DateTimeFormat(locale).format(d) as FormattedDate;
}

// 36. Combine brands with type narrowing in switch
type ErrorCode = Brand<number, "ErrorCode">;
const E_NOT_FOUND: ErrorCode = 404 as ErrorCode;
const E_FORBIDDEN: ErrorCode = 403 as ErrorCode;
function describeError(code: ErrorCode): string {
  switch (code as number) {
    case 404: return "Not Found";
    case 403: return "Forbidden";
    default: return "Unknown Error";
  }
}

// 37. Branded key for type-safe env vars
type EnvKey<K extends string> = Brand<K, "EnvKey">;
function env<K extends string>(key: EnvKey<K>): string | undefined {
  return process.env[key as string];
}
const DB_URL: EnvKey<"DATABASE_URL"> = "DATABASE_URL" as EnvKey<"DATABASE_URL">;
const dbUrl37 = env(DB_URL);

// 38. Branded type for cursor-based pagination
type Cursor = Brand<string, "Cursor">;
function makeCursor(data: { id: string; createdAt: number }): Cursor {
  return Buffer.from(JSON.stringify(data)).toString("base64") as Cursor;
}
function parseCursor(cursor: Cursor): { id: string; createdAt: number } {
  return JSON.parse(Buffer.from(cursor as string, "base64").toString("utf-8"));
}

// 39. Branded type for vector dimensions
type Vector<D extends number> = Brand<number[], `Vector${D}`>;
function makeVector<D extends number>(dims: D, values: number[]): Vector<D> {
  if (values.length !== dims) throw new Error(`Expected ${dims} dimensions`);
  return values as unknown as Vector<D>;
}
function dotProduct<D extends number>(a: Vector<D>, b: Vector<D>): number {
  return (a as number[]).reduce((sum, v, i) => sum + v * (b as number[])[i], 0);
}

// 40. Branded type for JWT parts
type JwtHeader = Brand<string, "JwtHeader">;
type JwtPayload = Brand<string, "JwtPayload">;
type JwtSignature = Brand<string, "JwtSignature">;
type Jwt = Brand<string, "Jwt">;
function buildJwt(header: JwtHeader, payload: JwtPayload, sig: JwtSignature): Jwt {
  return `${header}.${payload}.${sig}` as Jwt;
}

// 41. Branded type for debounced functions
type Debounced<T extends (...args: any[]) => any> = Brand<T, "Debounced">;
function debounce<T extends (...args: any[]) => any>(fn: T, ms: number): Debounced<T> {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); }) as Debounced<T>;
}

// 42. Branded type for environment name
type Env = Brand<string, "Env">;
const PROD: Env = "production" as Env;
const DEV: Env = "development" as Env;
function isProd(env: Env): boolean { return (env as string) === "production"; }

// 43. Type-safe feature flags with brands
type FeatureFlag = Brand<string, "FeatureFlag">;
const flags = new Set<string>();
function enableFlag(flag: FeatureFlag): void { flags.add(flag as string); }
function isEnabled(flag: FeatureFlag): boolean { return flags.has(flag as string); }
const DARK_MODE_FLAG: FeatureFlag = "dark-mode" as FeatureFlag;

// 44. Branded type combining phantom + nominal
type TaggedValue<T, Tag extends string> = Brand<T, Tag> & { readonly _tag: Tag };
type Celsius44 = TaggedValue<number, "Celsius">;
type Fahrenheit44 = TaggedValue<number, "Fahrenheit">;
function celsius44(n: number): Celsius44 { return n as Celsius44; }

// 45. Brand with zod-like parse interface
interface BrandedParser<T, B extends string> {
  parse(input: unknown): Brand<T, B>;
  safeParse(input: unknown): { success: true; data: Brand<T, B> } | { success: false; error: string };
}

// 46. Branded type for database row identifiers
type RowId<Table extends string> = Brand<number, `Row:${Table}`>;
type UserRow = RowId<"users">;
type PostRow = RowId<"posts">;
function deleteRow<T extends string>(id: RowId<T>, table: T): void {
  console.log(`DELETE FROM ${table} WHERE id = ${id}`);
}

// 47. Branded type for compile-time constants
type Const<T extends string | number | boolean> = Brand<T, "Const">;
const MAX_RETRIES: Const<3> = 3 as Const<3>;
const API_VERSION: Const<"v2"> = "v2" as Const<"v2">;

// 48. Functor over branded types — map preserving brand
type BrandedArray<T, B extends string> = Brand<T[], B>;
function mapBranded<T, U, B extends string>(
  arr: BrandedArray<T, B>,
  fn: (v: T) => U
): U[] {
  return (arr as T[]).map(fn);
}

// 49. Branded newtype — full structural incompatibility via unique symbol
declare const _newtype: unique symbol;
type Newtype<T, Tag> = T & { readonly [_newtype]: Tag };
type Dollars = Newtype<number, "Dollars">;
type Cents = Newtype<number, "Cents">;
function dollarsToCents(d: Dollars): Cents { return ((d as unknown as number) * 100) as Cents; }

// 50. Contextual brand — brand depends on runtime context
type ContextualBrand<T, Ctx extends string> = Brand<T, `In:${Ctx}`>;
type InTransaction<T> = ContextualBrand<T, "Transaction">;
type InRequest<T> = ContextualBrand<T, "Request">;
function withTransaction<T>(fn: (db: InTransaction<object>) => T): T {
  return fn({} as InTransaction<object>);
}
