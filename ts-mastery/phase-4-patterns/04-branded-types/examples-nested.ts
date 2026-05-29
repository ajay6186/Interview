export {};

// ============================================================
// NESTED EXAMPLES — Branded Types (50 Examples)
// ============================================================

type Brand<T, B extends string> = T & { readonly __brand: B };

// --- Nested / Combined Patterns ---

// 1. Nested branded objects — each field is independently branded
type BrandedEmail = Brand<string, "Email">;
type BrandedName = Brand<string, "Name">;
type BrandedAge = Brand<number, "Age">;
type ValidatedUser = {
  email: BrandedEmail;
  name: BrandedName;
  age: BrandedAge;
};
function makeValidatedUser(email: string, name: string, age: number): ValidatedUser {
  if (!email.includes("@")) throw new Error("Bad email");
  if (name.trim().length === 0) throw new Error("Bad name");
  if (age < 0 || age > 150) throw new Error("Bad age");
  return { email: email as BrandedEmail, name: name as BrandedName, age: age as BrandedAge };
}

// 2. Branded type inside generic container
type BrandedOption<T, B extends string> = { some: true; value: Brand<T, B> } | { some: false };
function brandedSome<T, B extends string>(value: T, _brand: B): BrandedOption<T, B> {
  return { some: true, value: value as Brand<T, B> };
}
function brandedNone<T, B extends string>(): BrandedOption<T, B> {
  return { some: false };
}

// 3. Map of branded IDs to branded values
type UserId = Brand<string, "UserId">;
type UserEmail = Brand<string, "UserEmail">;
const emailByUserId = new Map<UserId, UserEmail>();
emailByUserId.set("u-1" as UserId, "alice@x.com" as UserEmail);

// 4. Branded pair — both elements must be branded
type BrandedPair<A, B1 extends string, B2 extends string> = [Brand<A, B1>, Brand<A, B2>];
type Latitude = Brand<number, "Lat">;
type Longitude = Brand<number, "Lng">;
type LatLng = BrandedPair<number, "Lat", "Lng">;
const coords4: LatLng = [37.77 as Latitude, -122.41 as Longitude];

// 5. Nested branded generic struct
type BrandedResult<T, B extends string, E = Error> =
  | { ok: true; data: Brand<T, B> }
  | { ok: false; error: E };
function parsePositive(n: number): BrandedResult<number, "Positive"> {
  return n > 0
    ? { ok: true, data: n as Brand<number, "Positive"> }
    : { ok: false, error: new Error("Not positive") };
}

// 6. Deeply nested branded configuration
type Host = Brand<string, "Host">;
type Port = Brand<number, "Port">;
type DbName = Brand<string, "DbName">;
type DbConfig = { host: Host; port: Port; database: DbName };
type ServerConfig = {
  db: DbConfig;
  apiPort: Port;
  apiHost: Host;
};
function makeServerConfig(rawHost: string, rawPort: number): ServerConfig {
  return {
    db: {
      host: rawHost as Host,
      port: rawPort as Port,
      database: "mydb" as DbName,
    },
    apiPort: 3000 as Port,
    apiHost: "0.0.0.0" as Host,
  };
}

// 7. Array of branded objects
type ProductId = Brand<string, "ProductId">;
type Price = Brand<number, "Price">;
type CartItem = { productId: ProductId; quantity: number; unitPrice: Price };
type Cart = Brand<CartItem[], "Cart">;
function addToCart(cart: Cart, item: CartItem): Cart {
  return [...(cart as CartItem[]), item] as Cart;
}
function cartTotal(cart: Cart): Price {
  return (cart as CartItem[]).reduce((sum, i) => sum + i.quantity * (i.unitPrice as unknown as number), 0) as Price;
}

// 8. Branded hierarchy: domain → subdomain → entity
type DomainId<D extends string> = Brand<string, `Domain:${D}`>;
type EntityId<D extends string, E extends string> = Brand<DomainId<D>, `Entity:${E}`>;
type AuthDomainId = DomainId<"Auth">;
type AuthUserId = EntityId<"Auth", "User">;
type AuthRoleId = EntityId<"Auth", "Role">;

// 9. Branded event system with nested payloads
type EventBrand<E extends string> = Brand<string, `Event:${E}`>;
type NestedEvent<E extends string, T> = {
  type: EventBrand<E>;
  payload: T;
  meta: { timestamp: Brand<number, "Timestamp">; source: Brand<string, "Source"> };
};
function createEvent<E extends string, T>(type: E, payload: T): NestedEvent<E, T> {
  return {
    type: type as EventBrand<E>,
    payload,
    meta: { timestamp: Date.now() as Brand<number, "Timestamp">, source: "app" as Brand<string, "Source"> },
  };
}

// 10. Branded state machine with nested state
type State<S extends string> = Brand<string, `State:${S}`>;
type Transition<From extends string, To extends string> = Brand<{ from: State<From>; to: State<To> }, "Transition">;
function makeTransition<F extends string, T extends string>(from: State<F>, to: State<T>): Transition<F, T> {
  return { from, to } as Transition<F, T>;
}

// 11. Nested branded monadic chain
type IO<T, B extends string> = Brand<() => T, `IO:${B}`>;
function makeIO<T, B extends string>(fn: () => T, brand: B): IO<T, B> {
  return fn as IO<T, B>;
}
function runIO<T, B extends string>(io: IO<T, B>): T {
  return (io as () => T)();
}
function mapIO<T, U, B extends string, B2 extends string>(
  io: IO<T, B>,
  fn: (t: T) => U,
  brand2: B2
): IO<U, B2> {
  return makeIO(() => fn(runIO(io)), brand2);
}

// 12. Multi-layer validation pipeline with nested brands
type Raw = Brand<string, "Raw">;
type Trimmed12 = Brand<Raw, "Trimmed">;
type Escaped = Brand<Trimmed12, "Escaped">;
type Validated12 = Brand<Escaped, "Validated">;
function trim12(raw: Raw): Trimmed12 { return (raw as string).trim() as Trimmed12; }
function escape12(t: Trimmed12): Escaped { return (t as string).replace(/[<>&]/g, "") as Escaped; }
function validate12(e: Escaped): Validated12 {
  if ((e as string).length < 1) throw new Error("Too short");
  return e as unknown as Validated12;
}
function fullPipeline12(input: string): Validated12 {
  return validate12(escape12(trim12(input as Raw)));
}

// 13. Record with both key and value branded
type StorageKey = Brand<string, "StorageKey">;
type StorageValue = Brand<string, "StorageValue">;
type BrandedStorage = Map<StorageKey, StorageValue>;
function storageSet(store: BrandedStorage, key: string, value: string): void {
  store.set(key as StorageKey, JSON.stringify(value) as StorageValue);
}

// 14. Branded type for tree node
type NodeId = Brand<string, "NodeId">;
type TreeNode<T> = {
  id: NodeId;
  value: T;
  children: TreeNode<T>[];
};
function makeNode<T>(id: string, value: T, children: TreeNode<T>[] = []): TreeNode<T> {
  return { id: id as NodeId, value, children };
}
function findNode<T>(root: TreeNode<T>, id: NodeId): TreeNode<T> | null {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

// 15. Nested branded auth context
type AuthToken = Brand<string, "AuthToken">;
type UserId15 = Brand<string, "UserId">;
type Role = Brand<string, "Role">;
type AuthContext = {
  token: AuthToken;
  userId: UserId15;
  roles: Role[];
  expiresAt: Brand<number, "ExpiresAt">;
};
function makeAuthContext(token: string, userId: string, roles: string[]): AuthContext {
  return {
    token: token as AuthToken,
    userId: userId as UserId15,
    roles: roles.map(r => r as Role),
    expiresAt: (Date.now() + 3600000) as Brand<number, "ExpiresAt">,
  };
}

// 16. Branded value objects in DDD style
type Money = { amount: Brand<number, "Amount">; currency: Brand<string, "Currency"> };
function money(amount: number, currency: string): Money {
  return { amount: amount as Brand<number, "Amount">, currency: currency.toUpperCase() as Brand<string, "Currency"> };
}
function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) throw new Error("Currency mismatch");
  return money((a.amount as unknown as number) + (b.amount as unknown as number), a.currency as string);
}

// 17. Branded tuple with position semantics
type X = Brand<number, "X">;
type Y = Brand<number, "Y">;
type Z = Brand<number, "Z">;
type Point3D = [X, Y, Z];
function makePoint3D(x: number, y: number, z: number): Point3D {
  return [x as X, y as Y, z as Z];
}
function distanceTo(a: Point3D, b: Point3D): number {
  return Math.sqrt(
    Math.pow((b[0] as unknown as number) - (a[0] as unknown as number), 2) +
    Math.pow((b[1] as unknown as number) - (a[1] as unknown as number), 2) +
    Math.pow((b[2] as unknown as number) - (a[2] as unknown as number), 2)
  );
}

// 18. Nested branded pagination
type PageNumber = Brand<number, "PageNumber">;
type PageSize = Brand<number, "PageSize">;
type Offset = Brand<number, "Offset">;
type PaginationParams = { page: PageNumber; size: PageSize; offset: Offset };
function makePagination(page: number, size: number): PaginationParams {
  const p = Math.max(1, page) as PageNumber;
  const s = Math.min(100, Math.max(1, size)) as PageSize;
  return { page: p, size: s, offset: ((p as unknown as number - 1) * (s as unknown as number)) as Offset };
}

// 19. Chained brand refinements in a pipeline
type StepA = Brand<string, "StepA">;
type StepB = Brand<StepA, "StepB">;
type StepC = Brand<StepB, "StepC">;
type Pipeline19 = { stepA: (s: string) => StepA; stepB: (s: StepA) => StepB; stepC: (s: StepB) => StepC };
const pipeline19: Pipeline19 = {
  stepA: s => s.trim() as StepA,
  stepB: s => (s as string).toLowerCase() as StepB,
  stepC: s => (s as string).replace(/\s+/g, "-") as StepC,
};
const result19: StepC = pipeline19.stepC(pipeline19.stepB(pipeline19.stepA("  Hello World  ")));

// 20. Branded access-controlled repository
type ReadToken = Brand<string, "ReadToken">;
type WriteToken = Brand<string, "WriteToken">;
type AdminToken20 = ReadToken & WriteToken & Brand<string, "AdminToken">;
class BrandedRepo<T> {
  private data: T[] = [];
  read(_token: ReadToken): T[] { return [...this.data]; }
  write(_token: WriteToken, item: T): void { this.data.push(item); }
  clear(_token: AdminToken20): void { this.data = []; }
}

// 21. Nested branded currency amounts
type USD = Brand<number, "USD">;
type EUR = Brand<number, "EUR">;
type GBP = Brand<number, "GBP">;
type CurrencyAmount = { usd: USD } | { eur: EUR } | { gbp: GBP };
function toUSD(amount: CurrencyAmount): USD {
  if ("usd" in amount) return amount.usd;
  if ("eur" in amount) return ((amount.eur as unknown as number) * 1.09) as USD;
  return ((amount.gbp as unknown as number) * 1.27) as USD;
}

// 22. Nested branded API response
type ApiVersion = Brand<string, "ApiVersion">;
type RequestId = Brand<string, "RequestId">;
type ApiResponse<T> = {
  version: ApiVersion;
  requestId: RequestId;
  data: T;
  errors: Brand<string, "ApiError">[];
};
function makeApiResponse<T>(data: T, version = "v1"): ApiResponse<T> {
  return {
    version: version as ApiVersion,
    requestId: Math.random().toString(36).slice(2) as RequestId,
    data,
    errors: [],
  };
}

// 23. Brand-safe serialization/deserialization pair
type SerializedId = Brand<string, "Serialized">;
type DeserializedId = Brand<string, "Deserialized">;
function serialize(id: UserId): SerializedId { return btoa(id as string) as SerializedId; }
function deserialize(s: SerializedId): DeserializedId { return atob(s as string) as DeserializedId; }

// 24. Nested branded form state
type FieldName = Brand<string, "FieldName">;
type FieldValue = Brand<string, "FieldValue">;
type FieldError = Brand<string, "FieldError">;
type FormState = {
  fields: Map<FieldName, FieldValue>;
  errors: Map<FieldName, FieldError[]>;
  isDirty: boolean;
  isValid: boolean;
};

// 25. Recursive branded tree with depth tracking
type Depth = Brand<number, "Depth">;
type BoundedTree<T, MaxDepth extends number> = {
  value: T;
  depth: Depth;
  children: MaxDepth extends 0 ? [] : BoundedTree<T, MaxDepth>[];
};

// 26. Branded environment configuration with nested sections
type DbHost = Brand<string, "DbHost">;
type DbPort = Brand<number, "DbPort">;
type RedisUrl = Brand<string, "RedisUrl">;
type JwtSecret = Brand<string, "JwtSecret">;
type AppConfig = {
  db: { host: DbHost; port: DbPort };
  redis: { url: RedisUrl };
  auth: { jwtSecret: JwtSecret };
};

// 27. Branded type for request/response pairs
type RequestBrand = Brand<object, "Request">;
type ResponseBrand = Brand<object, "Response">;
type Handler<Req extends RequestBrand, Res extends ResponseBrand> = (req: Req) => Promise<Res>;
type LoginRequest = RequestBrand & { email: string; password: string };
type LoginResponse = ResponseBrand & { token: string; userId: string };

// 28. Multi-tenant branded IDs
type TenantId = Brand<string, "TenantId">;
type TenantScopedId<T extends string> = Brand<string, `${T}:Tenant`>;
type TenantUserId = TenantScopedId<"User">;
function makeTenantUserId(tenantId: TenantId, userId: string): TenantUserId {
  return `${tenantId}:${userId}` as TenantUserId;
}

// 29. Brand-preserving functional utilities
type BrandedValue<T, B extends string> = Brand<T, B>;
function map29<T, U, B extends string>(
  branded: BrandedValue<T, B>,
  fn: (t: T) => U
): U {
  return fn(branded as unknown as T);
}
function flatMap29<T, U, B1 extends string, B2 extends string>(
  branded: BrandedValue<T, B1>,
  fn: (t: T) => BrandedValue<U, B2>
): BrandedValue<U, B2> {
  return fn(branded as unknown as T);
}

// 30. Nested branded with conditional type narrowing
type StringBrand30 = Brand<string, "Str">;
type NumberBrand30 = Brand<number, "Num">;
type AnyBrand30 = StringBrand30 | NumberBrand30;
function processAny30(val: AnyBrand30): string {
  if (typeof val === "string") {
    const s: StringBrand30 = val;
    return `String: ${s}`;
  }
  const n: NumberBrand30 = val;
  return `Number: ${n}`;
}

// 31. Branded permissions with nested capability checks
type Permission<P extends string> = Brand<string, `Perm:${P}`>;
type PermSet<P extends string> = Set<Permission<P>>;
function hasPermission<P extends string>(set: PermSet<P>, perm: Permission<P>): boolean {
  return set.has(perm);
}
function requirePermission<P extends string>(set: PermSet<P>, perm: Permission<P>, action: () => void): void {
  if (!hasPermission(set, perm)) throw new Error("Permission denied");
  action();
}

// 32. Branded data transformation pipeline with composition
type Transformer<In, Out, B extends string> = Brand<(input: In) => Out, `Transform:${B}`>;
function makeTransformer<In, Out, B extends string>(fn: (i: In) => Out, brand: B): Transformer<In, Out, B> {
  return fn as Transformer<In, Out, B>;
}
function composeTransformers<A, B_type, C, B1 extends string, B2 extends string>(
  t1: Transformer<A, B_type, B1>,
  t2: Transformer<B_type, C, B2>
): Transformer<A, C, `${B1}->${B2}`> {
  return makeTransformer((a: A) => (t2 as (b: B_type) => C)((t1 as (a: A) => B_type)(a)), `${t1}->${t2}` as any);
}

// 33. Branded type for graph edges
type VertexId = Brand<string, "VertexId">;
type EdgeId = Brand<string, `Edge:${string}-${string}`>;
type Edge = { id: EdgeId; from: VertexId; to: VertexId; weight: Brand<number, "Weight"> };
function makeEdge(from: VertexId, to: VertexId, weight: number): Edge {
  return {
    id: `${from}->${to}` as EdgeId,
    from,
    to,
    weight: weight as Brand<number, "Weight">,
  };
}

// 34. Branded type composition for audit logs
type AuditId = Brand<string, "AuditId">;
type AuditAction = Brand<string, "AuditAction">;
type AuditEntry = {
  id: AuditId;
  action: AuditAction;
  userId: Brand<string, "UserId">;
  timestamp: Brand<number, "Timestamp">;
  details: Brand<object, "AuditDetails">;
};
function createAuditEntry(action: string, userId: string, details: object): AuditEntry {
  return {
    id: Math.random().toString(36).slice(2) as AuditId,
    action: action as AuditAction,
    userId: userId as Brand<string, "UserId">,
    timestamp: Date.now() as Brand<number, "Timestamp">,
    details: details as Brand<object, "AuditDetails">,
  };
}

// 35. Nested branded observable
type ObservableValue<T, B extends string> = {
  get(): Brand<T, B>;
  set(value: T): void;
  subscribe(fn: (value: Brand<T, B>) => void): () => void;
};
function makeObservable<T, B extends string>(initial: T, brand: B): ObservableValue<T, B> {
  let value = initial as Brand<T, B>;
  const subs = new Set<(v: Brand<T, B>) => void>();
  return {
    get() { return value; },
    set(v: T) { value = v as Brand<T, B>; subs.forEach(s => s(value)); },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
  };
}

// 36. Nested branded conditional access
type SecureData<T> = Brand<T, "Secure">;
type PublicData<T> = Brand<T, "Public">;
function toPublic<T>(secure: SecureData<T>, sanitize: (t: T) => T): PublicData<T> {
  return sanitize(secure as unknown as T) as unknown as PublicData<T>;
}

// 37. Brand-augmented discriminated union
type Success37<T> = Brand<{ kind: "success"; value: T }, "Success">;
type Failure37<E> = Brand<{ kind: "failure"; error: E }, "Failure">;
type Outcome37<T, E = string> = Success37<T> | Failure37<E>;
function succeed37<T>(value: T): Success37<T> { return { kind: "success", value } as Success37<T>; }
function fail37<E>(error: E): Failure37<E> { return { kind: "failure", error } as Failure37<E>; }

// 38. Branded timestamp with chronological ordering
type Timestamp38 = Brand<number, "Timestamp">;
function isAfter(a: Timestamp38, b: Timestamp38): boolean {
  return (a as unknown as number) > (b as unknown as number);
}
function maxTimestamp(...ts: Timestamp38[]): Timestamp38 {
  return Math.max(...(ts as unknown as number[])) as Timestamp38;
}

// 39. Nested branded pagination cursor
type EncodedCursor = Brand<string, "EncodedCursor">;
type DecodedCursor<T> = Brand<T, "DecodedCursor">;
function encodeCursor<T>(data: T): EncodedCursor {
  return Buffer.from(JSON.stringify(data)).toString("base64url") as EncodedCursor;
}
function decodeCursor<T>(cursor: EncodedCursor): DecodedCursor<T> {
  return JSON.parse(Buffer.from(cursor as string, "base64url").toString()) as DecodedCursor<T>;
}

// 40. Compound branded domain object
type OrderId40 = Brand<string, "OrderId">;
type CustomerId40 = Brand<string, "CustomerId">;
type OrderStatus40 = Brand<"pending" | "shipped" | "delivered", "OrderStatus">;
type OrderAmount40 = Brand<number, "OrderAmount">;
type Order40 = {
  id: OrderId40;
  customerId: CustomerId40;
  status: OrderStatus40;
  total: OrderAmount40;
  items: { productId: Brand<string, "ProductId">; qty: number; price: Brand<number, "Price"> }[];
};

// 41. Branded type with mapped properties
type BrandEachProp<T, B extends string> = {
  [K in keyof T]: T[K] extends string ? Brand<T[K], B> : T[K] extends number ? Brand<T[K], B> : T[K];
};
type RawProfile = { name: string; bio: string; age: number };
type SanitizedProfile = BrandEachProp<RawProfile, "Sanitized">;

// 42. Branded function composition chain
type F0 = Brand<() => string, "F0">;
type F1 = Brand<(s: string) => number, "F1">;
type F2 = Brand<(n: number) => boolean, "F2">;
function makeF0(fn: () => string): F0 { return fn as F0; }
function makeF1(fn: (s: string) => number): F1 { return fn as F1; }
function makeF2(fn: (n: number) => boolean): F2 { return fn as F2; }
function chain42(f0: F0, f1: F1, f2: F2): boolean {
  return (f2 as (n: number) => boolean)((f1 as (s: string) => number)((f0 as () => string)()));
}

// 43. Branded multi-key compound lookup
type CompoundKey<A extends string, B extends string> = Brand<string, `${A}+${B}`>;
function makeCompoundKey<A extends string, B extends string>(a: A, b: B): CompoundKey<A, B> {
  return `${a}+${b}` as CompoundKey<A, B>;
}
const userProductKey = makeCompoundKey("UserId", "ProductId");

// 44. Nested brand with JSON roundtrip
type SafeJson = Brand<string, "SafeJson">;
type ParsedJson<T> = Brand<T, "ParsedJson">;
function toSafeJson<T>(value: T): SafeJson { return JSON.stringify(value) as SafeJson; }
function fromSafeJson<T>(json: SafeJson): ParsedJson<T> { return JSON.parse(json as string) as ParsedJson<T>; }
const json44 = toSafeJson({ a: 1 });
const parsed44 = fromSafeJson<{ a: number }>(json44);

// 45. Branded service interface
type ServiceName = Brand<string, "ServiceName">;
type ServiceVersion = Brand<string, "ServiceVersion">;
type ServiceId45 = Brand<string, "ServiceId">;
interface ServiceDescriptor {
  id: ServiceId45;
  name: ServiceName;
  version: ServiceVersion;
  dependencies: ServiceId45[];
}

// 46. Accumulating brands across multiple modules
type Parsed46 = Brand<object, "Parsed">;
type Validated46 = Brand<Parsed46, "Validated">;
type Authorized46 = Brand<Validated46, "Authorized">;
type Processed46 = Brand<Authorized46, "Processed">;
function processRequest(input: object): Processed46 {
  const parsed = input as Parsed46;
  const validated = parsed as unknown as Validated46;
  const authorized = validated as unknown as Authorized46;
  return authorized as unknown as Processed46;
}

// 47. Branded type for locale-specific content
type LocalizedString<Locale extends string> = Brand<string, `Localized:${Locale}`>;
type EnglishString = LocalizedString<"en">;
type FrenchString = LocalizedString<"fr">;
function translate(en: EnglishString, toLang: "fr"): FrenchString {
  return `[FR]${en}` as FrenchString;
}

// 48. Branded dependency injection token
type InjectionToken<T> = Brand<symbol, "InjectionToken"> & { _type: T };
function createToken<T>(description: string): InjectionToken<T> {
  return Symbol(description) as InjectionToken<T>;
}
const USER_SERVICE_TOKEN = createToken<{ findById(id: string): object }>("UserService");

// 49. Nested branded with recursive unwrapping
type Wrapped<T, B extends string> = Brand<{ value: T }, B>;
type DoubleWrapped<T, B1 extends string, B2 extends string> = Wrapped<Wrapped<T, B1>, B2>;
function wrap<T, B extends string>(value: T, _brand: B): Wrapped<T, B> { return { value } as Wrapped<T, B>; }
function unwrap<T, B extends string>(wrapped: Wrapped<T, B>): T { return (wrapped as { value: T }).value; }
const dw = wrap(wrap(42, "Inner"), "Outer");
const inner = unwrap(dw);

// 50. Full domain model with cross-referencing brands
type CategoryId = Brand<string, "CategoryId">;
type ProductId50 = Brand<string, "ProductId">;
type InventoryCount = Brand<number, "InventoryCount">;
type ProductPrice = Brand<number, "ProductPrice">;
type Product50 = {
  id: ProductId50;
  categoryId: CategoryId;
  name: Brand<string, "ProductName">;
  price: ProductPrice;
  stock: InventoryCount;
};
function createProduct(id: string, categoryId: string, name: string, price: number, stock: number): Product50 {
  return {
    id: id as ProductId50,
    categoryId: categoryId as CategoryId,
    name: name as Brand<string, "ProductName">,
    price: price as ProductPrice,
    stock: stock as InventoryCount,
  };
}
function updateStock(product: Product50, delta: number): Product50 {
  const newStock = Math.max(0, (product.stock as unknown as number) + delta) as InventoryCount;
  return { ...product, stock: newStock };
}
