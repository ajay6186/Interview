// ============================================================================
// Exercise 2.4 — Utility Types
// ============================================================================
// Master TypeScript's built-in utility types: Partial, Required, Pick,
// Omit, Record, Readonly, Extract, Exclude, NonNullable, ReturnType.
//
// Instructions: Fill in every TODO so the file compiles and all assertions pass.
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

// ---------------------------------------------------------------------------
// 1. Partial — make all properties optional
// ---------------------------------------------------------------------------

// TODO: Define UpdateUser as Partial<User>
type UpdateUser = any;

type Test1 = Expect<Equal<UpdateUser, { id?: number; name?: string; email?: string; age?: number }>>;

// ---------------------------------------------------------------------------
// 2. Required — make all properties required
// ---------------------------------------------------------------------------

interface PartialConfig {
  host?: string;
  port?: number;
  debug?: boolean;
}

// TODO: Define FullConfig as Required<PartialConfig>
type FullConfig = any;

type Test2 = Expect<Equal<FullConfig, { host: string; port: number; debug: boolean }>>;

// ---------------------------------------------------------------------------
// 3. Pick — select specific properties
// ---------------------------------------------------------------------------

// TODO: Define UserPreview with only `id` and `name` from User
type UserPreview = any;

type Test3 = Expect<Equal<UserPreview, { id: number; name: string }>>;

// ---------------------------------------------------------------------------
// 4. Omit — remove specific properties
// ---------------------------------------------------------------------------

// TODO: Define UserWithoutEmail — User without `email`
type UserWithoutEmail = any;

type Test4 = Expect<Equal<UserWithoutEmail, { id: number; name: string; age: number }>>;

// ---------------------------------------------------------------------------
// 5. Record — construct object type from keys and value type
// ---------------------------------------------------------------------------

// TODO: Define a type for a dictionary mapping user IDs (string) to User objects
type UserMap = any;

type Test5 = Expect<Equal<UserMap, Record<string, User>>>;

// ---------------------------------------------------------------------------
// 6. Extract and Exclude
// ---------------------------------------------------------------------------

type AllColors = "red" | "green" | "blue" | "yellow" | "purple";
type PrimaryColors = "red" | "green" | "blue";

// TODO: Extract only primary colors from AllColors
type Extracted = any;

// TODO: Get non-primary colors (exclude primary from all)
type Secondary = any;

type Test6 = Expect<Equal<Extracted, "red" | "green" | "blue">>;
type Test7 = Expect<Equal<Secondary, "yellow" | "purple">>;

// ---------------------------------------------------------------------------
// 7. ReturnType
// ---------------------------------------------------------------------------

function createUser() {
  return { id: 1, name: "Alice", email: "alice@test.com", age: 30 };
}

// TODO: Extract the return type of createUser
type CreatedUser = any;

type Test8 = Expect<Equal<CreatedUser, { id: number; name: string; email: string; age: number }>>;

// ---------------------------------------------------------------------------
// 8. Practical exercise: implement a function using utility types
// ---------------------------------------------------------------------------

// TODO: Implement an `updateUser` function that:
// - Takes a User and a Partial<User>
// - Returns a new User with the updates applied
function updateUser(user: User, updates: Partial<User>): User {
  // TODO: implement
  return null as any;
}

// ---------------------------------------------------------------------------
// Runtime tests
// ---------------------------------------------------------------------------
const alice: User = { id: 1, name: "Alice", email: "alice@test.com", age: 30 };
const updated = updateUser(alice, { name: "Alicia", age: 31 });
console.assert(updated.name === "Alicia", "updated name");
console.assert(updated.age === 31, "updated age");
console.assert(updated.email === "alice@test.com", "unchanged email");
console.assert(updated.id === 1, "unchanged id");
console.assert(alice.name === "Alice", "original unchanged");

console.log("Exercise 2.4 — All assertions passed!");

export {};
