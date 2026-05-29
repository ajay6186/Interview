export {};

// ── Basic Type Assertion Examples ────────────────────────────────────────────

// 1. Basic `as` type assertion
const value: unknown = "hello";
const str: string = value as string;

// 2. `as` on DOM element
const input = document.getElementById("name") as HTMLInputElement;
const inputValue = input?.value;

// 3. `as` for narrowing API response
const response: unknown = { id: 1, name: "Alice" };
const user = response as { id: number; name: string };

// 4. Double assertion (unsafe cast via `unknown`)
const num: number = 42;
const str2 = num as unknown as string; // unsafe but valid

// 5. Non-null assertion `!`
function getElement() { return document.getElementById("root"); }
const el = getElement()!; // assert non-null

// 6. Non-null on optional chain
type Profile = { address?: { city?: string } };
const profile: Profile = {};
const city = profile.address?.city ?? "Unknown";

// 7. Non-null on function argument
function greet(name: string | undefined) {
  console.log(`Hello, ${name!}`); // asserts name is string
}

// 8. `as const` on primitive
const greeting = "hello" as const;
type Greeting = typeof greeting; // "hello"

// 9. `as const` on array
const colors = ["red", "green", "blue"] as const;
type Color = typeof colors[number]; // "red" | "green" | "blue"

// 10. `as const` on object
const config = { env: "production", port: 3000 } as const;
type Env = typeof config.env; // "production"

// 11. `satisfies` operator
const palette = {
  red: [255, 0, 0],
  green: [0, 255, 0],
} satisfies Record<string, [number, number, number]>;
const red = palette.red; // inferred as [number, number, number]

// 12. `satisfies` with narrowed inference
const routes = {
  home: "/",
  about: "/about",
  contact: "/contact",
} satisfies Record<string, string>;
const home = routes.home; // type is "/" (not string)

// 13. `as` for narrowing from any
function processAny(value: any): string {
  return (value as string).toUpperCase();
}

// 14. Type predicate (type guard function)
function isString(val: unknown): val is string {
  return typeof val === "string";
}
const unknown1: unknown = "hello";
if (isString(unknown1)) {
  const s: string = unknown1; // narrowed
}

// 15. `instanceof` as type guard (not assertion)
function handleError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

// 16. `as` in return type coercion
function fromJson<T>(json: string): T {
  return JSON.parse(json) as T;
}
const parsed = fromJson<{ id: number }>('{"id": 1}');

// 17. Non-null in method chaining
type Chain = { next?: Chain; value: number };
const chain: Chain = { value: 1, next: { value: 2 } };
const nextVal = chain.next!.value;

// 18. `as` on object property access
const data: Record<string, unknown> = { count: 10 };
const count = data["count"] as number;

// 19. `as const` in function return
function getTheme() {
  return { mode: "dark", fontSize: 14 } as const;
}
type Theme = ReturnType<typeof getTheme>;
type Mode = Theme["mode"]; // "dark"

// 20. `satisfies` for validated config
const dbConfig = {
  host: "localhost",
  port: 5432,
  ssl: false,
} satisfies { host: string; port: number; ssl: boolean };
dbConfig.port; // number (not widened)

// 21. Assertion in event handler
document.addEventListener("click", (e) => {
  const target = e.target as HTMLButtonElement;
  console.log(target.textContent);
});

// 22. Non-null on Map.get
const map = new Map<string, number>();
map.set("x", 1);
const x = map.get("x")!; // assert it exists

// 23. Type assertion for environment variables
const apiKey = process.env["API_KEY"] as string; // assert not undefined

// 24. `as const` in switch discriminant
const action = { type: "increment" } as const;
switch (action.type) {
  case "increment": break; // type is narrowed to "increment"
}

// 25. `as` on JSON.parse result
const jsonData = JSON.parse('{"name":"Alice"}') as { name: string };

// 26. `satisfies` with union value type
const icons = {
  success: "✓",
  error:   "✗",
  warning: "⚠",
} satisfies Record<string, string>;

// 27. Assertion function pattern (pre-ES2019)
function assertString(val: unknown): asserts val is string {
  if (typeof val !== "string") throw new TypeError("Not a string");
}
const maybeStr: unknown = "hello";
assertString(maybeStr);
const length = maybeStr.length; // narrowed to string

// 28. Non-null assertion vs optional chaining
const arr: string[] | null = ["a", "b"];
const first1 = arr![0];            // assertion
const first2 = arr?.[0] ?? "";     // safe

// 29. `as unknown as T` for cross-type assertion
function mockAs<T>(val: unknown): T { return val as unknown as T; }
const fakeNum = mockAs<number>("not a number"); // runtime unsafe

// 30. `as const` in enum-like pattern
const HttpMethod = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
} as const;
type HttpMethod = typeof HttpMethod[keyof typeof HttpMethod];

// 31. `satisfies` for icon map with tuple values
const buttonStyles = {
  primary:   { bg: "#6366f1", text: "#fff" },
  secondary: { bg: "#e5e7eb", text: "#111" },
} satisfies Record<string, { bg: string; text: string }>;
buttonStyles.primary.bg; // still type "string" — narrowed by satisfies

// 32. Assertion on querySelector
const form = document.querySelector("form") as HTMLFormElement;
form?.reset();

// 33. Non-null on array find
const nums = [1, 2, 3, 4, 5];
const found = nums.find(n => n > 3)!; // assert found is number

// 34. `as` for intersecting types
const base = { id: "1" } as { id: string; role: "admin" };

// 35. `as const` tuple
const point = [1, 2] as const;
type X = typeof point[0]; // 1
type Y = typeof point[1]; // 2

// 36. Conditional assertion helper
function assertDefined<T>(val: T | null | undefined): T {
  if (val == null) throw new Error("Expected defined value");
  return val;
}
const definedVal = assertDefined<string>(null as unknown as string);

// 37. `as` in destructuring
const raw = {} as unknown;
const { name } = raw as { name: string };

// 38. `satisfies` ensures completeness
const statusColors = {
  pending: "orange",
  active: "green",
  closed: "gray",
} satisfies Record<"pending" | "active" | "closed", string>;

// 39. Non-null assertion on ref (React-like pattern)
class Ref<T> { current: T | null = null; }
const inputRef = new Ref<HTMLInputElement>();
// Focus: inputRef.current!.focus();

// 40. `as` to narrow from broad interface
interface Animal { name: string }
interface Dog3 extends Animal { bark(): void }
const animal: Animal = { name: "Rex" } as Dog3;

// 41. `satisfies` vs `as` difference
const a1 = { x: 1, y: 2 } as { x: number }; // y is lost from type
const a2 = { x: 1, y: 2 } satisfies { x: number }; // y is retained

// 42. Non-null in template literal
const nullableId: string | null = "abc";
const message = `ID: ${nullableId!}`; // assert non-null

// 43. `as const` for frozen config loading
function loadConfig() {
  return {
    maxRetries: 3,
    timeout: 5000,
    baseUrl: "https://api.example.com",
  } as const;
}
const cfg = loadConfig();
type MaxRetries = typeof cfg.maxRetries; // 3 (literal)

// 44. Assertion in generic utility
function assertType<T>(val: unknown): T {
  return val as T;
}
const typedObj = assertType<{ id: string }>({ id: "1" });

// 45. `satisfies` with array literal
const allowed = ["read", "write", "admin"] satisfies string[];
type Allowed = typeof allowed[number]; // "read" | "write" | "admin"

// 46. Double-cast to erase type brand
declare const _brand: unique symbol;
type Branded<T, B> = T & { readonly [_brand]: B };
type SafeId = Branded<string, "SafeId">;
const raw2 = "123";
const safeId = raw2 as unknown as SafeId; // double-cast to apply brand

// 47. `as const` for literal enum replacement
const Sizes = { SM: "sm", MD: "md", LG: "lg" } as const;
type Size = typeof Sizes[keyof typeof Sizes]; // "sm" | "md" | "lg"
const size: Size = Sizes.MD;

// 48. Non-null in array destructuring
const [head, ...rest] = [1, 2, 3];
const firstElem: number = head!; // technically not needed but shows pattern

// 49. `satisfies` for nested shape constraint
const menuItems = {
  home:     { path: "/", label: "Home" },
  about:    { path: "/about", label: "About" },
  contact:  { path: "/contact", label: "Contact" },
} satisfies Record<string, { path: string; label: string }>;
menuItems.home.path; // "/"

// 50. `as` vs type annotation preference
// Prefer type annotation when possible; use `as` only for narrow-from-wider patterns
const x1: number = 42;        // annotation — preferred
const x2 = 42 as number;      // assertion — avoid unless necessary
const x3 = "foo" as unknown as number; // force cast — dangerous, avoid
