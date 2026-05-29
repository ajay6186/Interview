export {};

// ============================================================
// BASIC EXAMPLES — Branded Types (50 Examples)
// ============================================================

// 1. Core Brand helper type
type Brand<T, B extends string> = T & { readonly __brand: B };

// 2. Branded string ID
type UserId = Brand<string, "UserId">;
const userId: UserId = "user-123" as UserId;

// 3. Branded number ID
type ProductId = Brand<number, "ProductId">;
const productId: ProductId = 42 as ProductId;

// 4. Creating a branded value with a factory function
function makeUserId(id: string): UserId {
  return id as UserId;
}
const uid = makeUserId("u-001");

// 5. Function that only accepts branded type
function getUserById(id: UserId): string {
  return `User:${id}`;
}
const result5 = getUserById(makeUserId("u-1"));

// 6. Two different branded string types cannot be mixed
type PostId = Brand<string, "PostId">;
function makePostId(id: string): PostId { return id as PostId; }
// getUserById(makePostId("p-1")); // Error: PostId is not UserId

// 7. Branded Email type
type Email = Brand<string, "Email">;
function makeEmail(email: string): Email {
  if (!email.includes("@")) throw new Error("Invalid email");
  return email as Email;
}
const email7: Email = makeEmail("alice@example.com");

// 8. Function requiring Email brand
function sendEmail(to: Email, subject: string): void {
  console.log(`Sending "${subject}" to ${to}`);
}
sendEmail(makeEmail("bob@example.com"), "Hello");

// 9. Branded URL type
type ValidUrl = Brand<string, "ValidUrl">;
function makeUrl(url: string): ValidUrl {
  new URL(url); // throws if invalid
  return url as ValidUrl;
}

// 10. Branded non-empty string
type NonEmptyString = Brand<string, "NonEmptyString">;
function makeNonEmpty(s: string): NonEmptyString {
  if (s.length === 0) throw new Error("Empty string");
  return s as NonEmptyString;
}

// 11. Branded positive number
type PositiveNumber = Brand<number, "PositiveNumber">;
function makePositive(n: number): PositiveNumber {
  if (n <= 0) throw new Error("Must be positive");
  return n as PositiveNumber;
}
const price11: PositiveNumber = makePositive(9.99);

// 12. Branded integer
type Integer = Brand<number, "Integer">;
function makeInteger(n: number): Integer {
  if (!Number.isInteger(n)) throw new Error("Not an integer");
  return n as Integer;
}

// 13. Branded percentage (0–100)
type Percentage = Brand<number, "Percentage">;
function makePercentage(n: number): Percentage {
  if (n < 0 || n > 100) throw new Error("Out of range");
  return n as Percentage;
}
const discount13: Percentage = makePercentage(25);

// 14. Branded Meters unit
type Meters = Brand<number, "Meters">;
function meters(n: number): Meters { return n as Meters; }
const distance14: Meters = meters(100);

// 15. Branded Seconds unit
type Seconds = Brand<number, "Seconds">;
function seconds(n: number): Seconds { return n as Seconds; }
const timeout15: Seconds = seconds(30);

// 16. Branded Kilograms unit
type Kilograms = Brand<number, "Kilograms">;
function kg(n: number): Kilograms { return n as Kilograms; }

// 17. Branded USD currency
type USD = Brand<number, "USD">;
function usd(n: number): USD { return n as USD; }
const price17: USD = usd(19.99);

// 18. Branded EUR currency
type EUR = Brand<number, "EUR">;
function eur(n: number): EUR { return n as EUR; }
// Cannot assign EUR to USD without explicit conversion

// 19. Type-safe currency conversion
function eurToUsd(amount: EUR, rate: number): USD {
  return usd((amount as unknown as number) * rate);
}
const converted19 = eurToUsd(eur(100), 1.09);

// 20. Branded hex color string
type HexColor = Brand<string, "HexColor">;
function makeHexColor(s: string): HexColor {
  if (!/^#[0-9a-fA-F]{6}$/.test(s)) throw new Error("Invalid hex color");
  return s as HexColor;
}
const red20: HexColor = makeHexColor("#ff0000");

// 21. Branded UUID
type UUID = Brand<string, "UUID">;
function makeUUID(s: string): UUID {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s))
    throw new Error("Invalid UUID");
  return s as UUID;
}

// 22. Branded timestamp (milliseconds since epoch)
type Timestamp = Brand<number, "Timestamp">;
function now(): Timestamp { return Date.now() as Timestamp; }
const ts22: Timestamp = now();

// 23. Branded latitude
type Latitude = Brand<number, "Latitude">;
function makeLatitude(n: number): Latitude {
  if (n < -90 || n > 90) throw new Error("Invalid latitude");
  return n as Latitude;
}

// 24. Branded longitude
type Longitude = Brand<number, "Longitude">;
function makeLongitude(n: number): Longitude {
  if (n < -180 || n > 180) throw new Error("Invalid longitude");
  return n as Longitude;
}

// 25. Using branded lat/lng together
type GeoPoint = { lat: Latitude; lng: Longitude };
function makeGeoPoint(lat: number, lng: number): GeoPoint {
  return { lat: makeLatitude(lat), lng: makeLongitude(lng) };
}

// 26. Branded port number
type Port = Brand<number, "Port">;
function makePort(n: number): Port {
  if (n < 1 || n > 65535) throw new Error("Invalid port");
  return n as Port;
}
const httpPort: Port = makePort(80);

// 27. Branded IPv4 address
type IPv4 = Brand<string, "IPv4">;
function makeIPv4(s: string): IPv4 {
  const parts = s.split(".");
  if (parts.length !== 4 || parts.some(p => isNaN(+p) || +p < 0 || +p > 255))
    throw new Error("Invalid IPv4");
  return s as IPv4;
}

// 28. Storing brands in arrays preserves type
const userIds28: UserId[] = [makeUserId("a"), makeUserId("b"), makeUserId("c")];
const first28: UserId = userIds28[0];

// 29. Brand survives object destructuring
const user29 = { id: makeUserId("u-1"), name: "Alice" };
const { id: uid29 }: { id: UserId; name: string } = user29;

// 30. Branded types work with generics
function getById<T>(items: Map<UserId, T>, id: UserId): T | undefined {
  return items.get(id);
}

// 31. Branded type as Record key
type ProductMap = Record<string, ProductId>;
const catalog31: ProductMap = { apple: 1 as ProductId, banana: 2 as ProductId };

// 32. Type alias for branded factory return
type Factory<B> = (raw: string) => B;
const userIdFactory: Factory<UserId> = makeUserId;

// 33. Branded type with default value
function orDefault<T extends Brand<string, string>>(val: T | null, def: T): T {
  return val ?? def;
}

// 34. Nominal typing prevents accidental swaps
type OrderId = Brand<string, "OrderId">;
function makeOrderId(id: string): OrderId { return id as OrderId; }
function getOrder(id: OrderId): string { return `Order:${id}`; }
// getOrder(makeUserId("u-1")); // compile error

// 35. Branded boolean — always-true flag
type TrueBrand = Brand<true, "TrueBrand">;
const verified35: TrueBrand = true as TrueBrand;

// 36. Branded type narrows union
type RawId = string;
type SafeId = Brand<string, "SafeId">;
function validate36(id: RawId): SafeId {
  return id.trim() as SafeId;
}

// 37. Stripping brand (back to base type)
function stripBrand<T>(branded: Brand<T, string>): T {
  return branded as unknown as T;
}
const rawId37: string = stripBrand(makeUserId("u-1"));

// 38. Branded number in arithmetic (cast needed)
type Score = Brand<number, "Score">;
function makeScore(n: number): Score { return Math.max(0, Math.min(100, n)) as Score; }
function averageScore(a: Score, b: Score): Score {
  return (((a as unknown as number) + (b as unknown as number)) / 2) as Score;
}

// 39. Branded object keys
type TableName = Brand<string, "TableName">;
const tables: Record<TableName, string[]> = {
  ["users" as TableName]: ["id", "name"],
};

// 40. Reusing Brand with different base types
type PositiveInt = Brand<number, "PositiveInt">;
type SafeString = Brand<string, "SafeString">;

function makePositiveInt(n: number): PositiveInt {
  if (!Number.isInteger(n) || n < 0) throw new Error();
  return n as PositiveInt;
}
function makeSafeString(s: string): SafeString {
  return s.replace(/[<>]/g, "") as SafeString;
}

// 41. Branded type in interface
interface UserRecord {
  id: UserId;
  email: Email;
  createdAt: Timestamp;
}

// 42. Building a UserRecord with brands
function createUserRecord(rawId: string, rawEmail: string): UserRecord {
  return {
    id: makeUserId(rawId),
    email: makeEmail(rawEmail),
    createdAt: now(),
  };
}

// 43. Branded return from async function
async function fetchUserId(url: string): Promise<UserId> {
  return makeUserId(`fetched-${url}`);
}

// 44. Branded type guard
function isUserId(s: string): s is UserId {
  return s.startsWith("user-");
}

// 45. Use type guard before using as branded type
function parseId45(raw: string): UserId | null {
  return isUserId(raw) ? raw : null;
}

// 46. Opaque-style brand using intersection
type Opaque<T, K> = T & { readonly _type: K };
type Token = Opaque<string, "Token">;
function makeToken(s: string): Token { return s as Token; }

// 47. Brand with optional data
type MaybeBranded = Brand<string, "MaybeBranded"> | null;
const mb47: MaybeBranded = Math.random() > 0.5 ? makeUserId("x") as unknown as Brand<string, "MaybeBranded"> : null;

// 48. Branded enum value
type HttpMethod = Brand<string, "HttpMethod">;
const GET: HttpMethod = "GET" as HttpMethod;
const POST: HttpMethod = "POST" as HttpMethod;

// 49. Template literal brand
type EventName = Brand<`on${string}`, "EventName">;
const onClick: EventName = "onClick" as EventName;

// 50. Summary: Brand is just a type intersection — runtime erased
type AnyBrand = Brand<unknown, string>;
const _brand50: AnyBrand = {} as AnyBrand; // brands exist only at compile time
