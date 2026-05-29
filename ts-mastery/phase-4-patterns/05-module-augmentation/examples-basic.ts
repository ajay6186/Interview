export {};

// ============================================================
// BASIC EXAMPLES — Module Augmentation & Declaration Merging (50 Examples)
// ============================================================

// 1. Basic interface merging — two declarations of the same interface merge
interface AppConfig {
  theme: string;
}
interface AppConfig {
  language: string;
}
const config1: AppConfig = { theme: "dark", language: "en" };

// 2. Adding a property to an existing interface
interface User {
  id: number;
  name: string;
}
interface User {
  email: string;
}
const user2: User = { id: 1, name: "Alice", email: "alice@example.com" };

// 3. Interface merging with optional properties
interface Settings {
  fontSize: number;
}
interface Settings {
  highContrast?: boolean;
}
const settings3: Settings = { fontSize: 14 };

// 4. Namespace + function merging (augmenting a function with properties)
function greet4(name: string): string {
  return `Hello, ${name}!`;
}
namespace greet4 {
  export const defaultGreeting = "Hello!";
  export function formal(name: string): string { return `Good day, ${name}.`; }
}
console.log(greet4("Alice"));
console.log(greet4.defaultGreeting);
console.log(greet4.formal("Bob"));

// 5. Enum merging — extending an enum across declarations
enum Status5a {
  Active = "active",
  Inactive = "inactive",
}
enum Status5a {
  Pending = "pending",
}
const s5: Status5a = Status5a.Pending;

// 6. Namespace merging — combining two namespaces
namespace Shapes {
  export interface Circle {
    kind: "circle";
    radius: number;
  }
}
namespace Shapes {
  export interface Rectangle {
    kind: "rect";
    width: number;
    height: number;
  }
}
const circle6: Shapes.Circle = { kind: "circle", radius: 5 };
const rect6: Shapes.Rectangle = { kind: "rect", width: 10, height: 5 };

// 7. Adding methods to an interface after the fact
interface StringUtils {
  capitalize(s: string): string;
}
interface StringUtils {
  truncate(s: string, max: number): string;
}
const strUtils7: StringUtils = {
  capitalize(s) { return s[0].toUpperCase() + s.slice(1); },
  truncate(s, max) { return s.length > max ? s.slice(0, max) + "…" : s; },
};

// 8. Global augmentation — adding to the global scope
declare global {
  interface Window {
    appVersion: string;
  }
}
// Usage: window.appVersion = "1.0.0";

// 9. Augmenting the Array interface globally
declare global {
  interface Array<T> {
    readonly last: T | undefined;
  }
}
Object.defineProperty(Array.prototype, "last", {
  get() { return this[this.length - 1]; },
  enumerable: false,
});
const last9 = [1, 2, 3].last; // 3

// 10. Augmenting String prototype globally
declare global {
  interface String {
    toTitleCase(): string;
  }
}
String.prototype.toTitleCase = function(): string {
  return this.replace(/\b\w/g, c => c.toUpperCase());
};

// 11. Namespace as a module container with types and values
namespace Logger {
  export type Level = "info" | "warn" | "error";
  export function log(level: Level, msg: string): void {
    console.log(`[${level.toUpperCase()}] ${msg}`);
  }
}
namespace Logger {
  export function debug(msg: string): void {
    console.log(`[DEBUG] ${msg}`);
  }
}
Logger.log("info", "Hello");
Logger.debug("debugging");

// 12. Interface merging for plugin registration
interface PluginMap {
  // populated by merges below
}
interface PluginMap {
  analytics: { trackEvent(name: string): void };
}
interface PluginMap {
  auth: { login(user: string, pass: string): boolean };
}

// 13. Augmenting a class via namespace
class Point13 {
  constructor(public x: number, public y: number) {}
}
namespace Point13 {
  export const origin: Point13 = new Point13(0, 0);
  export function distance(a: Point13, b: Point13): number {
    return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
  }
}
const origin13 = Point13.origin;
const dist13 = Point13.distance(new Point13(0, 0), new Point13(3, 4));

// 14. Namespace merging — combining constants
namespace Config {
  export const DB_HOST = "localhost";
}
namespace Config {
  export const DB_PORT = 5432;
}
namespace Config {
  export const DB_NAME = "mydb";
}
const connStr = `${Config.DB_HOST}:${Config.DB_PORT}/${Config.DB_NAME}`;

// 15. Interface extending a merged interface
interface BaseShape {
  color: string;
}
interface BaseShape {
  opacity: number;
}
interface Triangle extends BaseShape {
  base: number;
  height: number;
}
const tri15: Triangle = { color: "red", opacity: 0.8, base: 10, height: 5 };

// 16. Declaration merging for error types
interface AppError {
  code: string;
  message: string;
}
interface AppError {
  statusCode: number;
}
interface AppError {
  details?: Record<string, unknown>;
}
const err16: AppError = { code: "NOT_FOUND", message: "Resource not found", statusCode: 404 };

// 17. Augmenting built-in Math namespace via interface merging
// Note: Math is not an interface but we can augment it via module augmentation in a module file
namespace MathExtensions {
  export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
  export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }
}
const clamped17 = MathExtensions.clamp(150, 0, 100); // 100

// 18. Adding readonly properties via interface merge
interface User18 {
  id: number;
}
interface User18 {
  readonly createdAt: Date;
}
const u18: User18 = { id: 1, createdAt: new Date() };

// 19. Namespace with type and function exports
namespace Validation {
  export type Rule<T> = (value: T) => boolean;
  export function required(value: string): boolean { return value.trim().length > 0; }
}
namespace Validation {
  export function minLength(min: number): Validation.Rule<string> {
    return (s: string) => s.length >= min;
  }
  export function maxLength(max: number): Validation.Rule<string> {
    return (s: string) => s.length <= max;
  }
}
const isValid19 = Validation.required("hello") && Validation.minLength(3)("hello");

// 20. Augmenting event listener types (global)
declare global {
  interface HTMLElement {
    onClickOutside?: (event: MouseEvent) => void;
  }
}

// 21. Interface merging to simulate mixins
interface Serializable {
  serialize(): string;
}
interface Serializable {
  deserialize(data: string): void;
}
interface Loggable {
  log(msg: string): void;
}
interface Loggable {
  warn(msg: string): void;
}
interface Entity extends Serializable, Loggable {
  id: string;
}

// 22. Namespace merging for namespaced constants
namespace HTTP {
  export namespace Status {
    export const OK = 200;
    export const NOT_FOUND = 404;
  }
}
namespace HTTP {
  export namespace Status {
    export const INTERNAL_ERROR = 500;
  }
}
const status22 = HTTP.Status.OK; // 200

// 23. Declaration merging for typed environment
interface ProcessEnv {
  NODE_ENV?: string;
}
interface ProcessEnv {
  DATABASE_URL?: string;
}
interface ProcessEnv {
  API_KEY?: string;
}
// Augmenting NodeJS.ProcessEnv would go here in a .d.ts file

// 24. Merged interface as configuration contract
interface MiddlewareConfig {
  timeout?: number;
}
interface MiddlewareConfig {
  retries?: number;
}
interface MiddlewareConfig {
  logging?: boolean;
}
const mwConfig24: MiddlewareConfig = { timeout: 5000, retries: 3, logging: true };

// 25. Function namespace for enum-like values
function Color25(hex: string): string { return hex; }
namespace Color25 {
  export const Red = "#ff0000";
  export const Green = "#00ff00";
  export const Blue = "#0000ff";
}
const myColor = Color25(Color25.Red);

// 26. Augmenting interface with generic method
interface Repository<T> {
  findById(id: string): T | undefined;
}
interface Repository<T> {
  findAll(): T[];
  save(entity: T): void;
}
class InMemoryRepo<T> implements Repository<T> {
  private items: T[] = [];
  findById(id: string): T | undefined { return undefined; }
  findAll(): T[] { return this.items; }
  save(entity: T): void { this.items.push(entity); }
}

// 27. Namespace for utility functions attached to a class
class DateRange {
  constructor(public start: Date, public end: Date) {}
}
namespace DateRange {
  export function of(start: string, end: string): DateRange {
    return new DateRange(new Date(start), new Date(end));
  }
  export function today(): DateRange {
    const now = new Date();
    return new DateRange(now, now);
  }
}

// 28. Interface merging for form field types
interface TextField {
  type: "text";
  value: string;
}
interface TextField {
  placeholder?: string;
  maxLength?: number;
}
const field28: TextField = { type: "text", value: "", placeholder: "Enter text…" };

// 29. Merging event payload types
interface EventPayloads {
  click: { x: number; y: number };
}
interface EventPayloads {
  keydown: { key: string; code: string };
}
interface EventPayloads {
  scroll: { scrollY: number };
}
type AnyPayload = EventPayloads[keyof EventPayloads];

// 30. Namespace factory function pattern
function createService30(name: string) { return { name, start() {} }; }
namespace createService30 {
  export type Options = { timeout?: number; retries?: number };
}
const svcOptions30: createService30.Options = { timeout: 5000 };

// 31. Augmenting an error class via interface
interface TypeError {
  field?: string;
}
// This adds an optional field property to built-in TypeError

// 32. Namespace for related constants and types
namespace Units {
  export type Length = "px" | "em" | "rem" | "%";
  export const PX: Length = "px";
  export const EM: Length = "em";
}
namespace Units {
  export type Color = "rgb" | "hsl" | "hex";
  export const RGB: Color = "rgb";
}
const unit32: Units.Length = Units.PX;

// 33. Merged interface for a service locator
interface Services {
  logger: { log(msg: string): void };
}
interface Services {
  cache: { get(key: string): unknown; set(key: string, val: unknown): void };
}
function getService<K extends keyof Services>(services: Services, key: K): Services[K] {
  return services[key];
}

// 34. Namespace extending enum semantics
enum Direction34 {
  North = "N",
  South = "S",
}
enum Direction34 {
  East = "E",
  West = "W",
}
namespace Direction34 {
  export function opposite(d: Direction34): Direction34 {
    switch (d) {
      case Direction34.North: return Direction34.South;
      case Direction34.South: return Direction34.North;
      case Direction34.East: return Direction34.West;
      case Direction34.West: return Direction34.East;
    }
  }
}

// 35. Interface merging for a config builder
interface BuilderConfig {
  entry: string;
}
interface BuilderConfig {
  output?: string;
}
interface BuilderConfig {
  plugins?: string[];
  sourceMaps?: boolean;
}
const builderCfg35: BuilderConfig = { entry: "src/index.ts", sourceMaps: true };

// 36. Declaration merging for a shape union
interface ShapeRegistry {
  circle: { r: number };
}
interface ShapeRegistry {
  square: { side: number };
}
interface ShapeRegistry {
  triangle: { base: number; height: number };
}
type ShapeType = keyof ShapeRegistry;
function area36(shape: ShapeType, dims: ShapeRegistry[typeof shape]): number {
  if (shape === "circle") return Math.PI * (dims as { r: number }).r ** 2;
  if (shape === "square") return (dims as { side: number }).side ** 2;
  return 0.5 * (dims as { base: number; height: number }).base * (dims as { base: number; height: number }).height;
}

// 37. Augmenting a class namespace for testing helpers
class Timer37 {
  private ms: number;
  constructor(ms: number) { this.ms = ms; }
  wait(): Promise<void> { return new Promise(r => setTimeout(r, this.ms)); }
}
namespace Timer37 {
  export function immediate(): Timer37 { return new Timer37(0); }
  export function seconds(s: number): Timer37 { return new Timer37(s * 1000); }
}
const t37 = Timer37.seconds(2);

// 38. Interface merging for HTTP client options
interface HttpOptions {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
}
interface HttpOptions {
  headers?: Record<string, string>;
  timeout?: number;
}
interface HttpOptions {
  body?: string;
  credentials?: "include" | "omit" | "same-origin";
}

// 39. Namespace for math constants and functions
namespace MathConst {
  export const TAU = Math.PI * 2;
  export const PHI = 1.618033988749895;
}
namespace MathConst {
  export function factorial(n: number): number {
    return n <= 1 ? 1 : n * factorial(n - 1);
  }
  export function fibonacci(n: number): number {
    return n <= 1 ? n : fibonacci(n - 1) + fibonacci(n - 2);
  }
}
const phi39 = MathConst.PHI;
const fib39 = MathConst.fibonacci(10);

// 40. Augmenting global Error with additional fields
declare global {
  interface Error {
    code?: string;
    statusCode?: number;
  }
}
const err40 = new Error("Not found");
err40.code = "NOT_FOUND";
err40.statusCode = 404;

// 41. Merging interfaces for a React-like component props pattern
interface ButtonProps {
  label: string;
  onClick: () => void;
}
interface ButtonProps {
  disabled?: boolean;
  variant?: "primary" | "secondary";
}
const btnProps41: ButtonProps = { label: "Submit", onClick: () => {}, variant: "primary" };

// 42. Namespace + type alias pattern
function createValidator42<T>(fn: (v: T) => boolean) { return fn; }
namespace createValidator42 {
  export type Validator<T> = (v: T) => boolean;
  export function combine<T>(...validators: Validator<T>[]): Validator<T> {
    return (v: T) => validators.every(fn => fn(v));
  }
}

// 43. Merged interface accumulating middleware types
interface Middleware {
  name: string;
  handle(ctx: unknown, next: () => Promise<void>): Promise<void>;
}
interface Middleware {
  priority?: number;
  enabled?: boolean;
}

// 44. Namespace providing a mini DSL
namespace Query {
  export type Condition = { field: string; op: "=" | ">" | "<"; value: unknown };
  export function eq(field: string, value: unknown): Condition { return { field, op: "=", value }; }
}
namespace Query {
  export type OrderBy = { field: string; dir: "ASC" | "DESC" };
  export function orderBy(field: string, dir: "ASC" | "DESC" = "ASC"): OrderBy { return { field, dir }; }
}
const cond44 = Query.eq("age", 18);
const order44 = Query.orderBy("name");

// 45. Interface merging for locale config
interface LocaleConfig {
  language: string;
  region: string;
}
interface LocaleConfig {
  dateFormat?: string;
  numberFormat?: string;
}
interface LocaleConfig {
  currency?: string;
  timezone?: string;
}
const locale45: LocaleConfig = { language: "en", region: "US", currency: "USD", timezone: "America/New_York" };

// 46. Augmenting Object interface
declare global {
  interface ObjectConstructor {
    fromEntries<T = unknown>(entries: [string, T][]): Record<string, T>;
  }
}

// 47. Class + namespace for a fluent builder pattern
class QueryBuilder47 {
  private parts: string[] = [];
  select(...cols: string[]): this { this.parts.push(`SELECT ${cols.join(", ")}`); return this; }
  from(table: string): this { this.parts.push(`FROM ${table}`); return this; }
  build(): string { return this.parts.join(" "); }
}
namespace QueryBuilder47 {
  export function select(...cols: string[]): QueryBuilder47 { return new QueryBuilder47().select(...cols); }
}
const query47 = QueryBuilder47.select("id", "name").from("users").build();

// 48. Declaration merging for typed themes
interface Theme {
  colors: { primary: string; secondary: string };
}
interface Theme {
  typography: { fontFamily: string; fontSize: number };
}
interface Theme {
  spacing: { unit: number };
}
const theme48: Theme = {
  colors: { primary: "#007bff", secondary: "#6c757d" },
  typography: { fontFamily: "sans-serif", fontSize: 16 },
  spacing: { unit: 8 },
};

// 49. Namespace for dependency versions
namespace Dependencies {
  export const typescript = "5.x";
  export const node = "20.x";
}
namespace Dependencies {
  export const react = "18.x";
  export const vite = "5.x";
}
const deps49 = { ...Dependencies };

// 50. Combined namespace + interface for a plugin system
interface PluginOptions50 {
  name: string;
  version: string;
}
interface PluginOptions50 {
  config?: Record<string, unknown>;
}
namespace PluginOptions50 {
  export function defaults(name: string): PluginOptions50 {
    return { name, version: "1.0.0" };
  }
}
const plug50 = PluginOptions50.defaults("my-plugin");
