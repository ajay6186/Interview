// ============================================================================
// Exercise 5.3 — Type-Safe Validation Library
// ============================================================================
// Build a Zod-like validation library that infers TypeScript types from schemas.
//
// Instructions: Fill in every TODO so the file compiles and all assertions pass.
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// TODO: Implement schema types and validators
// ---------------------------------------------------------------------------

// Each schema type should:
// - Have a `parse(value: unknown)` method that validates and returns typed data
// - Have an `_output` type brand for type inference

// TODO: Base schema interface
interface Schema<T> {
  _output: T;
  parse(value: unknown): T;
}

// TODO: Implement string schema
function string(): Schema<string> {
  // TODO: returns a schema that validates strings
  return null as any;
}

// TODO: Implement number schema
function number(): Schema<number> {
  return null as any;
}

// TODO: Implement boolean schema
function boolean(): Schema<boolean> {
  return null as any;
}

// TODO: Implement object schema
// Takes a shape like { name: string(), age: number() }
// Returns a schema that validates the full object
type ObjectShape = Record<string, Schema<any>>;
type InferShape<S extends ObjectShape> = {
  [K in keyof S]: S[K]["_output"];
};

function object<S extends ObjectShape>(shape: S): Schema<InferShape<S>> {
  return null as any;
}

// TODO: Implement array schema
function array<T>(itemSchema: Schema<T>): Schema<T[]> {
  return null as any;
}

// TODO: Implement optional wrapper
function optional<T>(schema: Schema<T>): Schema<T | undefined> {
  return null as any;
}

// TODO: Infer type utility
type Infer<S extends Schema<any>> = S["_output"];

// ---------------------------------------------------------------------------
// Type-level tests
// ---------------------------------------------------------------------------

const userSchema = object({
  name: string(),
  age: number(),
  active: boolean(),
});

type UserType = Infer<typeof userSchema>;
type TestUser = Expect<Equal<UserType, { name: string; age: number; active: boolean }>>;

// ---------------------------------------------------------------------------
// Runtime tests (uncomment after implementing)
// ---------------------------------------------------------------------------

/*
const str = string().parse("hello");
console.assert(str === "hello", "parse string");

let threw = false;
try { string().parse(42); } catch { threw = true; }
console.assert(threw, "string rejects number");

const num = number().parse(42);
console.assert(num === 42, "parse number");

const user = userSchema.parse({ name: "Alice", age: 30, active: true });
console.assert(user.name === "Alice", "parse object name");
console.assert(user.age === 30, "parse object age");

const nums = array(number()).parse([1, 2, 3]);
console.assert(nums.length === 3, "parse array");
*/

console.log("Exercise 5.3 — All assertions passed!");

export {};
