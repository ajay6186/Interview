// ============================================================================
// Solution 2.4 — Utility Types
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
// 1. Partial
// ---------------------------------------------------------------------------

type UpdateUser = Partial<User>;

type Test1 = Expect<Equal<UpdateUser, { id?: number; name?: string; email?: string; age?: number }>>;

// ---------------------------------------------------------------------------
// 2. Required
// ---------------------------------------------------------------------------

interface PartialConfig {
  host?: string;
  port?: number;
  debug?: boolean;
}

type FullConfig = Required<PartialConfig>;

type Test2 = Expect<Equal<FullConfig, { host: string; port: number; debug: boolean }>>;

// ---------------------------------------------------------------------------
// 3. Pick
// ---------------------------------------------------------------------------

type UserPreview = Pick<User, "id" | "name">;

type Test3 = Expect<Equal<UserPreview, { id: number; name: string }>>;

// ---------------------------------------------------------------------------
// 4. Omit
// ---------------------------------------------------------------------------

type UserWithoutEmail = Omit<User, "email">;

type Test4 = Expect<Equal<UserWithoutEmail, { id: number; name: string; age: number }>>;

// ---------------------------------------------------------------------------
// 5. Record
// ---------------------------------------------------------------------------

type UserMap = Record<string, User>;

type Test5 = Expect<Equal<UserMap, Record<string, User>>>;

// ---------------------------------------------------------------------------
// 6. Extract and Exclude
// ---------------------------------------------------------------------------

type AllColors = "red" | "green" | "blue" | "yellow" | "purple";
type PrimaryColors = "red" | "green" | "blue";

type Extracted = Extract<AllColors, PrimaryColors>;
type Secondary = Exclude<AllColors, PrimaryColors>;

type Test6 = Expect<Equal<Extracted, "red" | "green" | "blue">>;
type Test7 = Expect<Equal<Secondary, "yellow" | "purple">>;

// ---------------------------------------------------------------------------
// 7. ReturnType
// ---------------------------------------------------------------------------

function createUser() {
  return { id: 1, name: "Alice", email: "alice@test.com", age: 30 };
}

type CreatedUser = ReturnType<typeof createUser>;

type Test8 = Expect<Equal<CreatedUser, { id: number; name: string; email: string; age: number }>>;

// ---------------------------------------------------------------------------
// 8. Practical exercise
// ---------------------------------------------------------------------------

function updateUser(user: User, updates: Partial<User>): User {
  return { ...user, ...updates };
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

console.log("Solution 2.4 — All assertions passed!");

export {};
