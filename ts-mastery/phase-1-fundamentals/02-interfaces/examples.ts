// ============================================================================
// Examples 1.2 — Interfaces  (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================================

// ============================================================================
// BASIC — simple interfaces, optional/readonly props, methods (Examples 1–13)
// ============================================================================

// 1. minimal interface
interface Greetable {
  name: string;
}
const greeter: Greetable = { name: "World" };

// 2. multiple properties
interface Product {
  name: string;
  price: number;
  inStock: boolean;
}
const laptop: Product = { name: "Laptop", price: 999, inStock: true };

// 3. optional property
interface Config {
  host: string;
  port: number;
  debug?: boolean;
}
const serverCfg: Config = { host: "localhost", port: 3000 };

// 4. readonly property
interface Point {
  readonly x: number;
  readonly y: number;
}
const origin: Point = { x: 0, y: 0 };

// 5. interface method (shorthand)
interface Logger {
  log(message: string): void;
}
const consoleLogger: Logger = { log: (msg) => console.log(msg) };

// 6. interface method (property syntax)
interface Stringable {
  toString: () => string;
}
const obj: Stringable = { toString: () => "hello" };

// 7. array property
interface Bag {
  items: string[];
}
const bag: Bag = { items: ["pen", "book"] };

// 8. number index signature
interface NumberList {
  [index: number]: string;
}
const list: NumberList = ["a", "b", "c"];

// 9. string index signature
interface Dictionary {
  [key: string]: string;
}
const dict: Dictionary = { hello: "world", foo: "bar" };

// 10. interface for a function type
interface Predicate {
  (value: number): boolean;
}
const isPositive: Predicate = (n) => n > 0;

// 11. interface with multiple methods
interface Calculator {
  add(a: number, b: number): number;
  subtract(a: number, b: number): number;
}
const calc: Calculator = { add: (a, b) => a + b, subtract: (a, b) => a - b };

// 12. interface with optional method
interface Serializable {
  serialize(): string;
  deserialize?(data: string): void;
}
const s: Serializable = { serialize: () => "{}" };

// 13. interface with union type property
interface Status {
  state: "loading" | "success" | "error";
  message?: string;
}
const loaded: Status = { state: "success" };

// ============================================================================
// INTERMEDIATE — extends, merged types, generics, patterns (14–26)
// ============================================================================

// 14. single inheritance
interface Animal {
  name: string;
  sound: string;
}
interface Pet extends Animal {
  owner: string;
}
const rex: Pet = { name: "Rex", sound: "Woof", owner: "Alice" };

// 15. multiple inheritance
interface HasId { id: number }
interface HasTimestamps { createdAt: Date; updatedAt: Date }
interface Entity extends HasId, HasTimestamps { label: string }
const entity: Entity = {
  id: 1,
  label: "item",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-06-01"),
};

// 16. interface extending with added optional
interface Vehicle {
  make: string;
  model: string;
}
interface Car extends Vehicle {
  doors?: number;
}
const car: Car = { make: "Toyota", model: "Camry" };

// 17. re-opening (declaration merging)
interface Window2 {
  title: string;
}
interface Window2 {
  width: number;
  height: number;
}
const win: Window2 = { title: "App", width: 1024, height: 768 };

// 18. generic interface (container)
interface Box<T> {
  value: T;
}
const strBox: Box<string> = { value: "hello" };
const numBox: Box<number> = { value: 42 };

// 19. generic interface with constraint
interface Repository<T extends { id: number }> {
  findById(id: number): T | undefined;
  save(item: T): void;
}

// 20. callable interface
interface Transform {
  (input: string): string;
  version: string;
}
const upperCase: Transform = Object.assign(
  (s: string) => s.toUpperCase(),
  { version: "1.0" }
);

// 21. constructor interface
interface Constructable {
  new(name: string): { name: string };
}

// 22. interface for event handler
interface EventHandler {
  (event: { type: string; payload: unknown }): void;
}
const handler: EventHandler = (e) => console.log(e.type);

// 23. interface for API response shape
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}
const response: ApiResponse<string[]> = { data: ["a", "b"], status: 200, message: "OK" };

// 24. readonly array property
interface Config2 {
  readonly allowedOrigins: readonly string[];
}
const cfg2: Config2 = { allowedOrigins: ["http://localhost:3000"] };

// 25. index signature with specific key override
interface Scores {
  [subject: string]: number;
  math: number; // specific key — type must be compatible with index type
}
const scores: Scores = { math: 95, science: 88 };

// 26. interface for a builder pattern
interface QueryBuilder {
  select(fields: string[]): QueryBuilder;
  where(condition: string): QueryBuilder;
  limit(n: number): QueryBuilder;
  build(): string;
}

// ============================================================================
// NESTED — interfaces referencing other interfaces, hierarchies (27–38)
// ============================================================================

// 27. interface with nested interface property
interface Coordinates {
  lat: number;
  lng: number;
}
interface Location {
  name: string;
  coords: Coordinates;
}
const paris: Location = { name: "Paris", coords: { lat: 48.85, lng: 2.35 } };

// 28. three-level nesting
interface Street { number: number; name: string }
interface CityAddress { street: Street; city: string; country: string }
interface Contact { fullName: string; address: CityAddress }
const contact: Contact = {
  fullName: "Alice",
  address: {
    city: "Berlin",
    country: "Germany",
    street: { number: 10, name: "Hauptstraße" },
  },
};

// 29. interface with array of another interface
interface Tag { label: string; color: string }
interface Article {
  title: string;
  tags: Tag[];
}
const article: Article = {
  title: "TypeScript Tips",
  tags: [{ label: "TS", color: "blue" }, { label: "JS", color: "yellow" }],
};

// 30. optional nested interface
interface Theme {
  colors?: { primary: string; secondary: string };
  font?: string;
}
const lightTheme: Theme = { colors: { primary: "#fff", secondary: "#000" } };

// 31. method that accepts another interface
interface Shape {
  area(): number;
}
interface Canvas {
  draw(shape: Shape): void;
}

// 32. method that returns another interface
interface UserService {
  getUser(id: number): { id: number; name: string };
}
const userSvc: UserService = { getUser: (id) => ({ id, name: "Alice" }) };

// 33. interface hierarchy (3 levels)
interface Base { id: number }
interface Named extends Base { name: string }
interface Detailed extends Named { description: string }
const item: Detailed = { id: 1, name: "Widget", description: "A small widget" };

// 34. interface with tuple property
interface BoundingBox {
  topLeft: [number, number];
  bottomRight: [number, number];
}
const box: BoundingBox = { topLeft: [0, 0], bottomRight: [100, 100] };

// 35. interface with nested generic
interface Paginated<T> {
  items: T[];
  meta: { page: number; total: number; perPage: number };
}
const page: Paginated<string> = { items: ["a", "b"], meta: { page: 1, total: 10, perPage: 2 } };

// 36. interface with record-like nested map
interface RolePermissions {
  roles: { [roleName: string]: string[] };
}
const perms: RolePermissions = { roles: { admin: ["read", "write"], guest: ["read"] } };

// 37. recursive interface (tree node)
interface TreeNode {
  value: number;
  children?: TreeNode[];
}
const tree: TreeNode = {
  value: 1,
  children: [{ value: 2 }, { value: 3, children: [{ value: 4 }] }],
};

// 38. interface composing multiple sub-interfaces
interface Profile { avatar: string; bio: string }
interface Preferences { theme: string; language: string }
interface FullUser extends HasId, Greetable {
  profile: Profile;
  preferences: Preferences;
}
const fullUser: FullUser = {
  id: 1,
  name: "Alice",
  profile: { avatar: "url", bio: "Dev" },
  preferences: { theme: "dark", language: "en" },
};

// ============================================================================
// ADVANCED — hybrid types, generic constraints, complex patterns (39–50)
// ============================================================================

// 39. hybrid interface — callable + properties
interface Validator {
  (value: string): boolean;
  errorMessage: string;
  minLength: number;
}
const notEmpty: Validator = Object.assign(
  (v: string) => v.length > 0,
  { errorMessage: "Must not be empty", minLength: 1 }
);

// 40. interface with overloaded call signatures
interface Converter {
  (value: string): number;
  (value: number): string;
}

// 41. interface with Symbol key
const toStringTag = Symbol("toStringTag");
interface WithTag {
  [toStringTag]: string;
  value: unknown;
}

// 42. generic interface with multiple type params
interface Mapper<TIn, TOut> {
  map(input: TIn): TOut;
  mapAll(inputs: TIn[]): TOut[];
}

// 43. interface with inferred generic from method
interface Comparer<T> {
  compare(a: T, b: T): -1 | 0 | 1;
  sort(items: T[]): T[];
}

// 44. interface extending a mapped utility
type ReadonlyProduct = Readonly<Product>;
interface SpecialProduct extends ReadonlyProduct {
  discount: number;
}
const special: SpecialProduct = { name: "TV", price: 499, inStock: true, discount: 10 };

// 45. interface with conditional-typed method return
interface SmartParser<T> {
  parse(raw: string): T;
  tryParse(raw: string): T | null;
}
const jsonParser: SmartParser<object> = {
  parse: (s) => JSON.parse(s),
  tryParse: (s) => { try { return JSON.parse(s); } catch { return null; } },
};

// 46. interface for a plugin system
interface Plugin {
  name: string;
  version: string;
  install(context: { register(name: string, fn: () => void): void }): void;
}

// 47. self-referencing generic interface (linked list)
interface LinkedList<T> {
  value: T;
  next: LinkedList<T> | null;
}
const linked: LinkedList<number> = { value: 1, next: { value: 2, next: null } };

// 48. interface with index signature returning interface
interface ComponentRegistry {
  [name: string]: { render(): string; destroy(): void };
}

// 49. builder pattern via chained interface
interface SelectBuilder {
  from(table: string): WhereBuilder;
}
interface WhereBuilder {
  where(condition: string): LimitBuilder;
}
interface LimitBuilder {
  limit(n: number): { build(): string };
}

// 50. interface extending multiple generics
interface CrudRepository<TEntity extends HasId, TCreate, TUpdate> {
  create(data: TCreate): TEntity;
  update(id: number, data: TUpdate): TEntity;
  delete(id: number): void;
  findAll(): TEntity[];
}

// ============================================================================
// Runtime tests
// ============================================================================
console.assert(greeter.name === "World", "greeter");
console.assert(laptop.price === 999, "laptop.price");
console.assert(serverCfg.debug === undefined, "debug optional");
console.assert(calc.add(3, 4) === 7, "calc.add");
console.assert(calc.subtract(10, 3) === 7, "calc.subtract");
console.assert(isPositive(5) === true, "isPositive");
console.assert(isPositive(-1) === false, "isPositive neg");
console.assert(rex.owner === "Alice", "pet owner");
console.assert(strBox.value === "hello", "strBox");
console.assert(upperCase("hello") === "HELLO", "upperCase");
console.assert(upperCase.version === "1.0", "upperCase.version");
console.assert(paris.coords.lat === 48.85, "paris coords");
console.assert(item.description === "A small widget", "item");
console.assert(linked.next?.value === 2, "linked list");
console.assert(notEmpty("hi") === true, "notEmpty");
console.assert(notEmpty("") === false, "notEmpty empty");
console.log("Examples 1.2 — All assertions passed!");

export {};
