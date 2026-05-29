export {};

// ============================================================
// BASIC EXAMPLES — Interfaces (50 Examples)
// ============================================================

// 1. Simple interface definition
interface Animal {
  name: string;
  sound: string;
}

// 2. Implementing interface with object literal
const dog: Animal = { name: "Rex", sound: "Woof" };

// 3. Interface with number property
interface Rectangle {
  width: number;
  height: number;
}
const rect: Rectangle = { width: 100, height: 50 };

// 4. Interface with boolean property
interface Toggle {
  isOn: boolean;
  label: string;
}
const toggle: Toggle = { isOn: true, label: "Dark Mode" };

// 5. Interface with optional property
interface UserProfile {
  username: string;
  bio?: string;
}
const profile1: UserProfile = { username: "alice" };
const profile2: UserProfile = { username: "bob", bio: "Developer" };

// 6. Interface with readonly property
interface Config {
  readonly apiKey: string;
  timeout: number;
}
const conf: Config = { apiKey: "secret-key", timeout: 5000 };
// conf.apiKey = "other"; // Error — readonly

// 7. Interface with multiple optional properties
interface SearchParams {
  query: string;
  page?: number;
  limit?: number;
  sort?: string;
}
const params: SearchParams = { query: "typescript" };

// 8. Interface extending another interface
interface Vehicle {
  brand: string;
  speed: number;
}
interface Car extends Vehicle {
  doors: number;
}
const car: Car = { brand: "Toyota", speed: 180, doors: 4 };

// 9. Interface extending with added optional field
interface AdminUser {
  id: number;
  name: string;
}
interface SuperAdminUser extends AdminUser {
  clearanceLevel?: number;
}
const superAdmin: SuperAdminUser = { id: 1, name: "Alice" };

// 10. Function in interface
interface Greeter {
  greet(name: string): string;
}
const greeter: Greeter = {
  greet: (name) => `Hello, ${name}!`,
};

// 11. Interface with method shorthand syntax
interface Calculator {
  add(a: number, b: number): number;
  subtract(a: number, b: number): number;
}
const calc: Calculator = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
};

// 12. Class implementing interface
interface Printable {
  print(): void;
}
class Document implements Printable {
  constructor(private content: string) {}
  print(): void {
    console.log(this.content);
  }
}

// 13. Interface for array type
interface StringList {
  items: string[];
  count: number;
}
const list: StringList = { items: ["a", "b", "c"], count: 3 };

// 14. Interface with union property
interface Notification {
  message: string;
  type: "info" | "warning" | "error";
}
const notif: Notification = { message: "All good", type: "info" };

// 15. Interface with literal type property
interface Status {
  code: 200 | 404 | 500;
  text: string;
}
const okStatus: Status = { code: 200, text: "OK" };

// 16. Interface for function type (call signature)
interface StringTransformer {
  (input: string): string;
}
const upperCase: StringTransformer = (s) => s.toUpperCase();

// 17. Interface with index signature
interface Dictionary {
  [key: string]: string;
}
const dict: Dictionary = { hello: "world", foo: "bar" };

// 18. Readonly property in method-containing interface
interface ImmutableCounter {
  readonly count: number;
  increment(): ImmutableCounter;
}

// 19. Interface extending two interfaces
interface Flyable {
  fly(): void;
}
interface Swimmable {
  swim(): void;
}
interface Duck extends Flyable, Swimmable {
  quack(): void;
}

// 20. Implementing multi-interface class
class RealDuck implements Duck {
  fly(): void { console.log("flying"); }
  swim(): void { console.log("swimming"); }
  quack(): void { console.log("quack!"); }
}

// 21. Interface with array of objects
interface Team {
  name: string;
  members: { id: number; name: string }[];
}
const team: Team = {
  name: "Alpha",
  members: [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }],
};

// 22. Interface with null-able property
interface ApiResponse {
  data: string | null;
  error: string | null;
}
const ok: ApiResponse = { data: "result", error: null };
const err: ApiResponse = { data: null, error: "Not found" };

// 23. Interface with default-like pattern via class
interface Timeout {
  delay: number;
  callback: () => void;
}
function runAfter(t: Timeout): void {
  setTimeout(t.callback, t.delay);
}

// 24. Interface as function parameter type
interface LoginCredentials {
  username: string;
  password: string;
}
function login(creds: LoginCredentials): boolean {
  return creds.username === "admin" && creds.password === "secret";
}

// 25. Interface as function return type
interface Token {
  value: string;
  expiresAt: number;
}
function generateToken(): Token {
  return { value: "abc123", expiresAt: Date.now() + 3600000 };
}

// 26. Nested interface property
interface Coordinates {
  lat: number;
  lng: number;
}
interface Place {
  name: string;
  location: Coordinates;
}
const place: Place = { name: "Eiffel Tower", location: { lat: 48.8584, lng: 2.2945 } };

// 27. Interface with boolean method return
interface Validator {
  validate(value: string): boolean;
}
const emailValidator: Validator = {
  validate: (v) => v.includes("@"),
};

// 28. Interface for event handler
interface EventHandler {
  event: string;
  handler: (payload: unknown) => void;
}
const clickHandler: EventHandler = {
  event: "click",
  handler: (p) => console.log("clicked", p),
};

// 29. Interface with generic-like constraint using any
interface Container {
  value: any;
  isEmpty(): boolean;
}

// 30. Interface merging (declaration merging)
interface Plugin {
  name: string;
}
interface Plugin {
  version: string;
}
// Plugin now has both name and version
const plug: Plugin = { name: "myPlugin", version: "1.0.0" };

// 31. Empty interface (marker/tag)
interface Serializable {}
class User implements Serializable {
  constructor(public name: string) {}
}

// 32. Interface for tuple-like structure
interface Pair {
  first: string;
  second: number;
}
const pair: Pair = { first: "hello", second: 42 };

// 33. Interface with Date property
interface Event {
  title: string;
  date: Date;
}
const evt: Event = { title: "Meeting", date: new Date("2024-06-15") };

// 34. Interface property with RegExp type
interface ValidationRule {
  pattern: RegExp;
  message: string;
}
const rule: ValidationRule = {
  pattern: /^\d{4}$/,
  message: "Must be 4 digits",
};

// 35. Interface with Error type property
interface AppError {
  message: string;
  cause?: Error;
}
const appErr: AppError = { message: "Something went wrong" };

// 36. Optional method in interface
interface Disposable {
  dispose?(): void;
  name: string;
}
const resource: Disposable = { name: "conn" };
resource.dispose?.();

// 37. Interface with promise return type in method
interface AsyncFetcher {
  fetch(url: string): Promise<string>;
}
const fetcher: AsyncFetcher = {
  fetch: async (url) => `Response from ${url}`,
};

// 38. Interface with getter-like method naming
interface Measurable {
  getWidth(): number;
  getHeight(): number;
}
const box: Measurable = {
  getWidth: () => 100,
  getHeight: () => 200,
};

// 39. Interface for Map-like structure
interface KeyValueStore {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
}

// 40. Extending built-in interface
interface ExtendedArray extends Array<string> {
  first(): string | undefined;
}

// 41. Interface for constructor pattern
interface Buildable {
  build(): string;
  reset(): void;
}

// 42. Interface with symbol index signature
// (less common — using string index for clarity)
interface SymbolKeyed {
  [key: string]: number;
}

// 43. Interface property that is an interface
interface Engine {
  horsepower: number;
  type: "v4" | "v6" | "electric";
}
interface FullCar {
  brand: string;
  engine: Engine;
}
const myCar: FullCar = {
  brand: "Honda",
  engine: { horsepower: 150, type: "v4" },
};

// 44. Interface extending and overriding optional to required
interface Base {
  id?: number;
}
interface Derived extends Base {
  id: number; // makes it required
}
const derived: Derived = { id: 1 };

// 45. Interface with rest-like array method
interface Logger {
  log(message: string, ...args: unknown[]): void;
}
const logger: Logger = {
  log: (msg, ...rest) => console.log(msg, ...rest),
};

// 46. Interface for singleton pattern
interface Singleton {
  getInstance(): Singleton;
}

// 47. Interface for observer pattern
interface Observer {
  update(event: string, data: unknown): void;
}
interface Subject {
  subscribe(observer: Observer): void;
  notify(event: string, data: unknown): void;
}

// 48. Interface for strategy pattern
interface SortStrategy {
  sort(arr: number[]): number[];
}
const bubbleSort: SortStrategy = {
  sort: (arr) => [...arr].sort((a, b) => a - b),
};

// 49. Interface with multiple return overloads via method signatures
interface Converter {
  convert(value: string): number;
  convert(value: number): string;
}

// 50. Interface as type guard predicate
interface Fish {
  swim(): void;
}
interface Bird {
  fly(): void;
}
function isFish(pet: Fish | Bird): pet is Fish {
  return "swim" in pet;
}
