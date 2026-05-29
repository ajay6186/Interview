export {};

// ── Basic Utility Type Examples ──────────────────────────────────────────────

// 1. Partial<T> — makes all properties optional
type User = { id: string; name: string; email: string; age: number };
type PartialUser = Partial<User>;
const patch: PartialUser = { name: "Alice" }; // only name provided

// 2. Required<T> — makes all properties required
type Config = { host?: string; port?: number; debug?: boolean };
type RequiredConfig = Required<Config>;
const cfg: RequiredConfig = { host: "localhost", port: 3000, debug: false };

// 3. Readonly<T> — makes all properties readonly
type ReadonlyUser = Readonly<User>;
const frozenUser: ReadonlyUser = { id: "1", name: "Alice", email: "a@a.com", age: 30 };
// frozenUser.name = "Bob"; // Error

// 4. Pick<T, K> — select specific properties
type UserPreview = Pick<User, "id" | "name">;
const preview: UserPreview = { id: "1", name: "Alice" };

// 5. Omit<T, K> — exclude specific properties
type PublicUser = Omit<User, "email">;
const publicUser: PublicUser = { id: "1", name: "Alice", age: 30 };

// 6. Record<K, V> — key-value map
type RoleMap = Record<string, boolean>;
const roles: RoleMap = { admin: true, guest: false };

// 7. Record with literal union keys
type ColorRecord = Record<"red" | "green" | "blue", string>;
const colors: ColorRecord = { red: "#ff0000", green: "#00ff00", blue: "#0000ff" };

// 8. Exclude<U, E> — remove types from union
type StringOrNumber = string | number | boolean;
type NoBoolean = Exclude<StringOrNumber, boolean>; // string | number
const nb: NoBoolean = 42;

// 9. Extract<U, E> — keep types from union that are assignable to E
type OnlyString = Extract<StringOrNumber, string>; // string
const os: OnlyString = "hello";

// 10. NonNullable<T> — remove null and undefined
type MaybeUser = User | null | undefined;
type DefiniteUser = NonNullable<MaybeUser>; // User
const du: DefiniteUser = { id: "1", name: "A", email: "a@a.com", age: 1 };

// 11. ReturnType<F> — infer function return type
function getUser(): User { return { id: "1", name: "Alice", email: "a@a.com", age: 30 }; }
type GetUserReturn = ReturnType<typeof getUser>; // User

// 12. Parameters<F> — infer function parameter tuple
function createPost(title: string, body: string, authorId: number): void {}
type CreatePostParams = Parameters<typeof createPost>; // [string, string, number]
const params: CreatePostParams = ["Title", "Body", 1];

// 13. ConstructorParameters<C> — infer constructor parameter tuple
class Point { constructor(public x: number, public y: number) {} }
type PointParams = ConstructorParameters<typeof Point>; // [number, number]

// 14. InstanceType<C> — infer class instance type
class MyService { greet() { return "hello"; } }
type MyServiceInstance = InstanceType<typeof MyService>; // MyService
function createService(ctor: typeof MyService): MyServiceInstance { return new ctor(); }

// 15. Awaited<T> — unwrap Promise type
type MaybePromise = Promise<string>;
type Unwrapped = Awaited<MaybePromise>; // string
async function fetchName(): Promise<string> { return "Alice"; }
type FetchedName = Awaited<ReturnType<typeof fetchName>>; // string

// 16. Partial in update function
function updateUser(user: User, updates: Partial<User>): User {
  return { ...user, ...updates };
}
const updated = updateUser({ id: "1", name: "Alice", email: "a@a.com", age: 30 }, { name: "Bob" });

// 17. Required in validation
function validateConfig(config: Required<Config>): void {
  console.log(`Connecting to ${config.host}:${config.port}`);
}

// 18. Readonly in pure function
function printUser(user: Readonly<User>): void {
  console.log(user.name);
  // user.name = "X"; // Error — mutation blocked
}

// 19. Pick for API response shaping
type ApiUserResponse = Pick<User, "id" | "name" | "email">;
function toApiResponse(user: User): ApiUserResponse {
  return { id: user.id, name: user.name, email: user.email };
}

// 20. Omit for DTO pattern
type CreateUserDto = Omit<User, "id">; // id assigned by server
function createUser(dto: CreateUserDto): User {
  return { ...dto, id: crypto.randomUUID() };
}

// 21. Record for lookup table
const httpMessages: Record<number, string> = {
  200: "OK", 201: "Created", 404: "Not Found", 500: "Internal Server Error",
};

// 22. Exclude with union narrowing
type Event2 = "click" | "focus" | "blur" | "keydown" | "keyup";
type MouseEvent2 = Extract<Event2, "click">;
type NonMouseEvent = Exclude<Event2, "click">;

// 23. NonNullable in safe accessor
function safeGet<T>(value: T | null | undefined): NonNullable<T> {
  if (value == null) throw new Error("Value is null/undefined");
  return value as NonNullable<T>;
}

// 24. ReturnType for typing callbacks
const fetchData = async (url: string): Promise<{ data: unknown }> => ({ data: null });
type FetchDataReturn = Awaited<ReturnType<typeof fetchData>>; // { data: unknown }

// 25. Parameters spread call
function add(a: number, b: number, c: number): number { return a + b + c; }
type AddParams = Parameters<typeof add>; // [number, number, number]
const args: AddParams = [1, 2, 3];
add(...args); // 6

// 26. Partial with default merge
function withDefaults<T>(partial: Partial<T>, defaults: T): T {
  return { ...defaults, ...partial };
}
const config2 = withDefaults<Config>({ debug: true }, { host: "localhost", port: 3000, debug: false });

// 27. Readonly array
type ReadonlyStringArray = Readonly<string[]>; // Cannot push/pop
const arr: ReadonlyStringArray = ["a", "b", "c"];
// arr.push("d"); // Error

// 28. Record over enum-like keys
type StatusLabel = Record<"pending" | "active" | "closed", string>;
const statusLabels: StatusLabel = { pending: "Pending", active: "Active", closed: "Closed" };

// 29. Extract from complex union
type AnyValue = string | number | boolean | null | undefined | object;
type Falsy = Extract<AnyValue, null | undefined | false | 0 | "">;
const falsy: Falsy = null;

// 30. ConstructorParameters in factory function
class Connection {
  constructor(public host: string, public port: number, public ssl: boolean) {}
}
function createConnection(...args: ConstructorParameters<typeof Connection>): Connection {
  return new Connection(...args);
}
createConnection("localhost", 5432, true);

// 31. InstanceType narrowing
abstract class Animal { abstract speak(): string; }
class Dog2 extends Animal { speak() { return "Woof"; } }
class Cat  extends Animal { speak() { return "Meow"; } }
type DogInstance = InstanceType<typeof Dog2>; // Dog2

// 32. Awaited with nested Promises
type DoublePromise = Promise<Promise<number>>;
type FlatAwaited = Awaited<DoublePromise>; // number (flattened)

// 33. Partial in form state
type FormState<T> = { values: Partial<T>; errors: Partial<Record<keyof T, string>> };
type LoginForm = FormState<{ username: string; password: string }>;
const form: LoginForm = { values: { username: "alice" }, errors: { password: "Required" } };

// 34. Omit with union
type A2 = { id: number; name: string; secret: string };
type B2 = { id: number; title: string; secret: string };
type WithoutSecret = Omit<A2 | B2, "secret">;
// = Omit<A2, "secret"> | Omit<B2, "secret">

// 35. Record<string, unknown> as open object type
function processRecord(data: Record<string, unknown>): string[] {
  return Object.keys(data);
}

// 36. NonNullable in conditional
type Maybe<T> = T | null | undefined;
function unwrap<T>(value: Maybe<T>): NonNullable<T> {
  if (value == null) throw new Error("Null");
  return value as NonNullable<T>;
}

// 37. ReturnType with method
class Calculator {
  add(a: number, b: number) { return a + b; }
}
type AddResult = ReturnType<Calculator["add"]>; // number

// 38. Parameters for middleware typing
type Middleware = (req: { url: string }, res: { send: (s: string) => void }, next: () => void) => void;
type MiddlewareParams = Parameters<Middleware>;
const mwParams: MiddlewareParams = [{ url: "/" }, { send: console.log }, () => {}];

// 39. Pick across nested
type Address = { street: string; city: string; zip: string };
type UserWithAddress = User & { address: Address };
type UserLocation = Pick<UserWithAddress, "name" | "address">;

// 40. Readonly on tuple
type ReadonlyPoint = Readonly<[number, number]>;
const rp: ReadonlyPoint = [1, 2];
// rp[0] = 99; // Error

// 41. Required makes optional required
type DraftPost = { title?: string; body?: string; tags?: string[] };
type PublishedPost = Required<DraftPost>; // all required
const pub: PublishedPost = { title: "T", body: "B", tags: ["ts"] };

// 42. Exclude in type narrowing
type StringLiteral = string extends infer S ? S : never;
type NoString = Exclude<"a" | "b" | 1 | 2, string>; // 1 | 2

// 43. Extract for filtering generic unions
type HttpSuccess = Extract<200 | 201 | 400 | 404 | 500, 200 | 201 | 204>; // 200 | 201

// 44. Record in config lookup
type EnvConfig = Record<"development" | "staging" | "production", { apiUrl: string }>;
const envConfig: EnvConfig = {
  development: { apiUrl: "http://localhost:3000" },
  staging:     { apiUrl: "https://staging.api.com" },
  production:  { apiUrl: "https://api.com" },
};

// 45. Partial with validation helper
function validatePartial<T>(partial: Partial<T>, required: (keyof T)[]): partial is T {
  return required.every(k => partial[k] !== undefined);
}

// 46. ConstructorParameters to clone
function clone<T>(ctor: new (...args: any[]) => T, ...args: ConstructorParameters<typeof ctor>): T {
  return new ctor(...args);
}

// 47. Awaited with custom thenable
type CustomThenable<T> = { then(resolve: (v: T) => void): void };
type AwaitedCustom = Awaited<CustomThenable<string>>; // string

// 48. ReturnType on async function
async function loadUser(id: string): Promise<User> {
  return { id, name: "Alice", email: "a@a.com", age: 30 };
}
type LoadedUser = Awaited<ReturnType<typeof loadUser>>; // User

// 49. Combine Partial + Omit for update DTO
type UpdateUserDto = Partial<Omit<User, "id">>;
const updateDto: UpdateUserDto = { name: "Bob", age: 31 };

// 50. Combine Pick + Readonly for view model
type UserViewModel = Readonly<Pick<User, "id" | "name">>;
const vm: UserViewModel = { id: "1", name: "Alice" };
// vm.name = "Bob"; // Error
