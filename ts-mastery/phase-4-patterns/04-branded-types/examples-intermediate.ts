export {};

// ============================================================
// INTERMEDIATE EXAMPLES — Branded Types (50 Examples)
// ============================================================

type Brand<T, B extends string> = T & { readonly __brand: B };

// 1. Smart constructor pattern with validation result
type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };
type Email = Brand<string, "Email">;
function parseEmail(raw: string): ValidationResult<Email> {
  return raw.includes("@") && raw.includes(".")
    ? { ok: true, value: raw as Email }
    : { ok: false, error: `Invalid email: ${raw}` };
}

// 2. Chained smart constructors
type UserId = Brand<string, "UserId">;
type ActiveUserId = Brand<UserId, "ActiveUserId">;
function makeUserId(s: string): UserId { return s as UserId; }
function makeActiveUserId(id: UserId): ActiveUserId { return id as unknown as ActiveUserId; }

// 3. Compound brand — combining two brands
type Validated = Brand<string, "Validated">;
type Sanitized = Brand<string, "Sanitized">;
type SafeInput = Brand<Validated & Sanitized, "SafeInput">;
function makeSafeInput(s: string): SafeInput {
  const sanitized = s.trim().replace(/[<>]/g, "") as Sanitized;
  const validated = (sanitized.length > 0 ? sanitized : null) as unknown as Validated;
  return validated as unknown as SafeInput;
}

// 4. Branded type with phantom generic
type TypedId<Entity> = Brand<string, `${string}Id`> & { readonly _entity: Entity };
type User = { name: string };
type Order = { total: number };
type UserTypedId = TypedId<User>;
type OrderTypedId = TypedId<Order>;

// 5. Parse-don't-validate — return brand or throw
type Latitude = Brand<number, "Latitude">;
function requireLatitude(n: number): Latitude {
  if (n < -90 || n > 90) throw new RangeError(`${n} is not a valid latitude`);
  return n as Latitude;
}

// 6. Branded types in discriminated unions
type Pending = Brand<string, "Pending">;
type Confirmed = Brand<string, "Confirmed">;
type Failed = Brand<string, "Failed">;
type PaymentStatus =
  | { status: "pending"; ref: Pending }
  | { status: "confirmed"; ref: Confirmed }
  | { status: "failed"; ref: Failed; reason: string };

// 7. Narrowing branded types at runtime
type RawToken = string;
type BearerToken = Brand<string, "BearerToken">;
function isBearerToken(s: RawToken): s is BearerToken {
  return s.startsWith("Bearer ");
}
function extractBearerToken(header: string): BearerToken | null {
  return isBearerToken(header) ? header : null;
}

// 8. Branded API key with expiry metadata
type ApiKey = Brand<string, "ApiKey">;
interface ApiKeyRecord {
  key: ApiKey;
  createdAt: Date;
  expiresAt: Date;
  scopes: string[];
}
function makeApiKey(key: string, scopes: string[]): ApiKeyRecord {
  return { key: key as ApiKey, createdAt: new Date(), expiresAt: new Date(Date.now() + 86400000), scopes };
}

// 9. Branded number units with safe arithmetic
type Meters = Brand<number, "Meters">;
type Seconds = Brand<number, "Seconds">;
type MetersPerSecond = Brand<number, "MetersPerSecond">;
const m9 = (n: number): Meters => n as Meters;
const s9 = (n: number): Seconds => n as Seconds;
function divide9(d: Meters, t: Seconds): MetersPerSecond {
  return ((d as unknown as number) / (t as unknown as number)) as MetersPerSecond;
}
const speed9 = divide9(m9(100), s9(10));

// 10. Temperature brands preventing unit confusion
type Celsius = Brand<number, "Celsius">;
type Fahrenheit = Brand<number, "Fahrenheit">;
type Kelvin = Brand<number, "Kelvin">;
const celsius = (n: number): Celsius => n as Celsius;
const fahrenheit = (n: number): Fahrenheit => n as Fahrenheit;
function celsiusToFahrenheit(c: Celsius): Fahrenheit {
  return fahrenheit((c as unknown as number) * 9/5 + 32);
}
function celsiusToKelvin(c: Celsius): Kelvin {
  return ((c as unknown as number) + 273.15) as Kelvin;
}

// 11. Branded SQL query — prevent injection via raw strings
type SafeQuery = Brand<string, "SafeQuery">;
function sql(template: TemplateStringsArray, ...values: (string | number)[]): SafeQuery {
  const escaped = values.map(v => typeof v === "string" ? `'${v.replace(/'/g, "''")}'` : String(v));
  return template.reduce((acc, part, i) => acc + part + (escaped[i - 1] ?? ""), "") as SafeQuery;
}

// 12. Database ID brands for type-safe ORM
type TableId<T extends string> = Brand<number, `${T}Id`>;
type UsersTableId = TableId<"Users">;
type OrdersTableId = TableId<"Orders">;
function getUserRecord(id: UsersTableId): string { return `User#${id}`; }
function getOrderRecord(id: OrdersTableId): string { return `Order#${id}`; }
// getUserRecord(1 as OrdersTableId); // Error

// 13. Branded path types
type AbsolutePath = Brand<string, "AbsolutePath">;
type RelativePath = Brand<string, "RelativePath">;
function makeAbsolute(p: string): AbsolutePath {
  if (!p.startsWith("/") && !p.match(/^[A-Za-z]:\\/)) throw new Error("Not absolute");
  return p as AbsolutePath;
}
function joinPaths(base: AbsolutePath, rel: RelativePath): AbsolutePath {
  return `${base}/${rel}` as AbsolutePath;
}

// 14. Branded sorted array — guarantee sorting at type level
type Sorted<T> = Brand<T[], "Sorted">;
function sorted<T>(arr: T[], compareFn?: (a: T, b: T) => number): Sorted<T> {
  return [...arr].sort(compareFn) as unknown as Sorted<T>;
}
function binarySearch<T>(sortedArr: Sorted<T>, target: T): number {
  const arr = sortedArr as unknown as T[];
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] === target) return mid;
    else if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}

// 15. Non-empty array brand
type NonEmptyArray<T> = Brand<T[], "NonEmpty"> & [T, ...T[]];
function makeNonEmpty<T>(arr: T[]): NonEmptyArray<T> {
  if (arr.length === 0) throw new Error("Array cannot be empty");
  return arr as unknown as NonEmptyArray<T>;
}
function head<T>(arr: NonEmptyArray<T>): T { return arr[0]; }

// 16. Brands as access levels — role-based typing
type AdminToken = Brand<string, "AdminToken">;
type UserToken = Brand<string, "UserToken">;
function adminAction(token: AdminToken): void { console.log("Admin action with", token); }
function userAction(token: UserToken): void { console.log("User action with", token); }

// 17. Intersection brands for permission composition
type ReadPermission = Brand<string, "Read">;
type WritePermission = Brand<string, "Write">;
type ReadWriteToken = ReadPermission & WritePermission;
function readData(token: ReadPermission): void {}
function writeData(token: WritePermission): void {}
function readWrite(token: ReadWriteToken): void {
  readData(token);
  writeData(token);
}

// 18. Branded version string
type SemVer = Brand<string, "SemVer">;
function makeSemVer(s: string): SemVer {
  if (!/^\d+\.\d+\.\d+/.test(s)) throw new Error(`Invalid semver: ${s}`);
  return s as SemVer;
}
function compareVersions(a: SemVer, b: SemVer): number {
  const parse = (v: SemVer) => (v as string).split(".").map(Number);
  const [a1,a2,a3] = parse(a), [b1,b2,b3] = parse(b);
  return a1 - b1 || a2 - b2 || a3 - b3;
}

// 19. Branded duration with different scales
type Milliseconds = Brand<number, "Milliseconds">;
type Minutes = Brand<number, "Minutes">;
const ms = (n: number): Milliseconds => n as Milliseconds;
const min = (n: number): Minutes => n as Minutes;
function minutesToMs(m: Minutes): Milliseconds { return ms((m as unknown as number) * 60000); }
function addMs(a: Milliseconds, b: Milliseconds): Milliseconds {
  return ms((a as unknown as number) + (b as unknown as number));
}

// 20. Branded type for CSS pixel values
type PxValue = Brand<number, "PxValue">;
type RemValue = Brand<number, "RemValue">;
const px = (n: number): PxValue => n as PxValue;
const rem = (n: number): RemValue => n as RemValue;
function pxToRem(p: PxValue, base = 16): RemValue { return rem((p as unknown as number) / base); }

// 21. Branded normalized value (0..1)
type NormalizedValue = Brand<number, "NormalizedValue">;
function normalize(n: number): NormalizedValue {
  return Math.max(0, Math.min(1, n)) as NormalizedValue;
}
function lerp(a: NormalizedValue, b: number, t: NormalizedValue): number {
  return a as unknown as number + ((b - (a as unknown as number)) * (t as unknown as number));
}

// 22. Cryptographic hash brand
type SHA256Hash = Brand<string, "SHA256Hash">;
function makeSHA256(hex: string): SHA256Hash {
  if (!/^[0-9a-f]{64}$/i.test(hex)) throw new Error("Not a valid SHA256 hex");
  return hex as SHA256Hash;
}
function verifyHash(data: string, hash: SHA256Hash): boolean {
  return true; // placeholder
}

// 23. Branded filename (no path separators)
type Filename = Brand<string, "Filename">;
function makeFilename(s: string): Filename {
  if (s.includes("/") || s.includes("\\")) throw new Error("Not a filename");
  return s as Filename;
}

// 24. Runtime branding registry
const brandRegistry = new Map<string, (v: unknown) => boolean>();
function registerBrand<T, B extends string>(brand: B, validator: (v: T) => boolean): void {
  brandRegistry.set(brand, validator as (v: unknown) => boolean);
}
registerBrand<string, "Email">("Email", (s: string) => s.includes("@"));

// 25. Branded with WeakMap for metadata
const brandMetadata = new WeakMap<object, Record<string, unknown>>();
type BrandedObj<T extends object, B extends string> = T & { readonly __brand: B };
function brandWithMeta<T extends object, B extends string>(obj: T, brand: B, meta: Record<string, unknown>): BrandedObj<T, B> {
  brandMetadata.set(obj, meta);
  return obj as BrandedObj<T, B>;
}

// 26. Phantom type via brand — zero runtime cost
type PhantomId<T> = Brand<string, "PhantomId"> & { _phantom: T };
type ProductEntity = { price: number };
type ProductPhantomId = PhantomId<ProductEntity>;

// 27. Branded readonly record
type ImmutableRecord<K extends string, V> = Brand<Readonly<Record<K, V>>, "Immutable">;
function freeze<K extends string, V>(record: Record<K, V>): ImmutableRecord<K, V> {
  return Object.freeze(record) as ImmutableRecord<K, V>;
}

// 28. Two-phase branded input: raw → parsed → validated
type RawInput = string;
type ParsedInput = Brand<string, "Parsed">;
type ValidatedInput = Brand<ParsedInput, "Validated">;
function parse28(raw: RawInput): ParsedInput { return raw.trim() as ParsedInput; }
function validate28(parsed: ParsedInput): ValidatedInput {
  if (parsed.length === 0) throw new Error("Empty");
  return parsed as unknown as ValidatedInput;
}
function process28(input: ValidatedInput): void { console.log("Processing:", input); }

// 29. Branded type for CUID
type CUID = Brand<string, "CUID">;
function makeCUID(s: string): CUID {
  if (!s.startsWith("c") || s.length !== 25) throw new Error("Invalid CUID");
  return s as CUID;
}

// 30. Factory returning branded type with generic
function makeBrandedId<B extends string>(brand: B) {
  return function(raw: string): Brand<string, B> {
    return raw as Brand<string, B>;
  };
}
const makeSessionId = makeBrandedId("SessionId");
type SessionId = ReturnType<typeof makeSessionId>;

// 31. Branded type in Map for type-safe caching
type CacheKey = Brand<string, "CacheKey">;
const cache31 = new Map<CacheKey, unknown>();
function cacheKey(ns: string, id: string): CacheKey { return `${ns}:${id}` as CacheKey; }
function getFromCache<T>(key: CacheKey): T | undefined { return cache31.get(key) as T; }
function setCache<T>(key: CacheKey, value: T): void { cache31.set(key, value); }

// 32. Branded promise resolve value
type ResolvedUserId = Brand<string, "ResolvedUserId">;
async function resolveUser(id: string): Promise<ResolvedUserId> {
  return id as ResolvedUserId;
}

// 33. Branded type alias for query params
type QueryParam = Brand<string, "QueryParam">;
function encodeParam(val: string): QueryParam {
  return encodeURIComponent(val) as QueryParam;
}
function buildQueryString(params: Record<string, QueryParam>): string {
  return Object.entries(params).map(([k, v]) => `${k}=${v}`).join("&");
}

// 34. Branded MIME type
type MimeType = Brand<string, "MimeType">;
const JSON_MIME: MimeType = "application/json" as MimeType;
const TEXT_MIME: MimeType = "text/plain" as MimeType;
function setContentType(mime: MimeType): void { console.log(`Content-Type: ${mime}`); }

// 35. Branded type for sanitized HTML
type SafeHTML = Brand<string, "SafeHTML">;
function sanitizeHTML(raw: string): SafeHTML {
  return raw.replace(/</g, "&lt;").replace(/>/g, "&gt;") as SafeHTML;
}

// 36. Combining brands with Record type
type BrandedRecord<K extends Brand<string, string>, V> = Record<string, V>;
type UserMap = BrandedRecord<UserId, { name: string }>;

// 37. Brand as constraint in generic
function processId<T extends Brand<string, string>>(id: T): string {
  return String(id);
}
const r37a = processId(makeUserId("u-1"));
const r37b = processId(makeEmail("x@x.com"));

// 38. Branded type narrowing with satisfies
const config38 = {
  host: "localhost" as Brand<string, "Hostname">,
  port: 3000 as Brand<number, "Port">,
};
type ServerConfig = typeof config38;

// 39. Accumulating branded values safely
type LineCount = Brand<number, "LineCount">;
function countLines(text: string): LineCount {
  return text.split("\n").length as LineCount;
}
function sumLineCounts(...counts: LineCount[]): LineCount {
  return counts.reduce((a, b) => ((a as unknown as number) + (b as unknown as number)) as LineCount, 0 as LineCount);
}

// 40. Branded type for file extension
type FileExtension = Brand<string, "FileExtension">;
function makeExtension(ext: string): FileExtension {
  if (!ext.startsWith(".")) throw new Error("Extension must start with .");
  return ext.toLowerCase() as FileExtension;
}
const ts40: FileExtension = makeExtension(".ts");

// 41. Multi-level brand hierarchy
type StringBrand = Brand<string, "String">;
type TrimmedString = Brand<StringBrand, "Trimmed">;
type TrimmedEmail = Brand<TrimmedString, "TrimmedEmail">;
function trim41(s: StringBrand): TrimmedString { return (s as string).trim() as TrimmedString; }

// 42. Brand as state machine constraint
type DraftOrder = Brand<string, "Draft">;
type SubmittedOrder = Brand<string, "Submitted">;
type FulfilledOrder = Brand<string, "Fulfilled">;
function submitOrder(draft: DraftOrder): SubmittedOrder { return draft as unknown as SubmittedOrder; }
function fulfillOrder(submitted: SubmittedOrder): FulfilledOrder { return submitted as unknown as FulfilledOrder; }

// 43. Branded type for base64 encoded data
type Base64 = Brand<string, "Base64">;
function encodeBase64(s: string): Base64 {
  return Buffer.from(s).toString("base64") as Base64;
}
function decodeBase64(b: Base64): string {
  return Buffer.from(b as string, "base64").toString("utf-8");
}

// 44. Branded type prevents accidental use of raw JSON
type JSONString = Brand<string, "JSONString">;
function toJSON<T>(value: T): JSONString { return JSON.stringify(value) as JSONString; }
function fromJSON<T>(json: JSONString): T { return JSON.parse(json as string) as T; }

// 45. Domain-specific branded type for coupon code
type CouponCode = Brand<string, "CouponCode">;
function makeCouponCode(s: string): CouponCode {
  const code = s.trim().toUpperCase();
  if (code.length < 4 || code.length > 20) throw new Error("Invalid coupon code length");
  return code as CouponCode;
}

// 46. Branded type for phone numbers
type PhoneNumber = Brand<string, "PhoneNumber">;
function makePhoneNumber(s: string): PhoneNumber {
  const digits = s.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) throw new Error("Invalid phone number");
  return `+${digits}` as PhoneNumber;
}

// 47. Branded predicate function
type Predicate<T> = Brand<(value: T) => boolean, "Predicate">;
function makePredicate<T>(fn: (value: T) => boolean): Predicate<T> {
  return fn as Predicate<T>;
}
const isPositive = makePredicate((n: number) => n > 0);

// 48. Type-safe event name brand
type EventName = Brand<string, "EventName">;
const CLICK: EventName = "click" as EventName;
const SUBMIT: EventName = "submit" as EventName;

// 49. Branded type for locale string
type Locale = Brand<string, "Locale">;
const EN_US: Locale = "en-US" as Locale;
const FR_FR: Locale = "fr-FR" as Locale;
function formatNumber(n: number, locale: Locale): string {
  return new Intl.NumberFormat(locale as string).format(n);
}

// 50. Covariant branded type — use in container
type ReadonlyBranded<T, B extends string> = Readonly<Brand<T, B>>;
type ImmutableUserId = ReadonlyBranded<string, "UserId">;
const immutableId50: ImmutableUserId = makeUserId("u-99");
