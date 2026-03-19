// ============================================================================
// Exercise 1.4 — Type Narrowing
// ============================================================================
// Learn to narrow types using typeof, instanceof, in, and custom type guards.
//
// Instructions: Fill in every TODO so the file compiles and all assertions pass.
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// 1. typeof narrowing
// ---------------------------------------------------------------------------

// TODO: Implement this function that doubles a number or repeats a string
function double(value: string | number): string | number {
  // TODO: use typeof to narrow and handle each case
  // number -> multiply by 2
  // string -> repeat twice (concatenate with itself)
  return null as any;
}

// ---------------------------------------------------------------------------
// 2. Truthiness narrowing
// ---------------------------------------------------------------------------

// TODO: Implement — return uppercased string, or "N/A" if null/undefined
function formatName(name: string | null | undefined): string {
  // TODO: implement
  return null as any;
}

// ---------------------------------------------------------------------------
// 3. `in` operator narrowing
// ---------------------------------------------------------------------------

type Fish = { swim: () => string };
type Bird = { fly: () => string };

// TODO: Implement — call the appropriate method based on what the animal can do
function move(animal: Fish | Bird): string {
  // TODO: use `in` operator to narrow
  return null as any;
}

// ---------------------------------------------------------------------------
// 4. instanceof narrowing
// ---------------------------------------------------------------------------

class ApiError {
  constructor(public status: number, public message: string) {}
}

class NetworkError {
  constructor(public message: string) {}
}

// TODO: Return descriptive error message using instanceof
function describeError(error: ApiError | NetworkError): string {
  // ApiError → "API Error {status}: {message}"
  // NetworkError → "Network Error: {message}"
  return null as any;
}

// ---------------------------------------------------------------------------
// 5. Custom type guard
// ---------------------------------------------------------------------------

type Admin = { role: "admin"; permissions: string[] };
type Guest = { role: "guest" };
type User = Admin | Guest;

// TODO: Implement a type guard function
function isAdmin(user: User): user is Admin {
  // TODO: implement
  return null as any;
}

function getPermissions(user: User): string[] {
  if (isAdmin(user)) {
    return user.permissions; // should work after narrowing
  }
  return [];
}

// ---------------------------------------------------------------------------
// Runtime tests
// ---------------------------------------------------------------------------
console.assert(double(5) === 10, "double(5) should be 10");
console.assert(double("ha") === "haha", 'double("ha") should be "haha"');
console.assert(formatName("alice") === "ALICE", "formatName alice");
console.assert(formatName(null) === "N/A", "formatName null");
console.assert(formatName(undefined) === "N/A", "formatName undefined");
console.assert(move({ swim: () => "swimming" }) === "swimming", "fish moves");
console.assert(move({ fly: () => "flying" }) === "flying", "bird moves");
console.assert(describeError(new ApiError(404, "Not Found")) === "API Error 404: Not Found", "api error");
console.assert(describeError(new NetworkError("Timeout")) === "Network Error: Timeout", "network error");
console.assert(JSON.stringify(getPermissions({ role: "admin", permissions: ["read", "write"] })) === '["read","write"]', "admin perms");
console.assert(getPermissions({ role: "guest" }).length === 0, "guest perms");

console.log("Exercise 1.4 — All assertions passed!");

export {};
