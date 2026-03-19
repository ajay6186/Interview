// ============================================================================
// Solution 1.4 — Type Narrowing
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// 1. typeof narrowing
// ---------------------------------------------------------------------------

function double(value: string | number): string | number {
  if (typeof value === "number") {
    return value * 2;
  }
  return value + value;
}

// ---------------------------------------------------------------------------
// 2. Truthiness narrowing
// ---------------------------------------------------------------------------

function formatName(name: string | null | undefined): string {
  if (name) {
    return name.toUpperCase();
  }
  return "N/A";
}

// ---------------------------------------------------------------------------
// 3. `in` operator narrowing
// ---------------------------------------------------------------------------

type Fish = { swim: () => string };
type Bird = { fly: () => string };

function move(animal: Fish | Bird): string {
  if ("swim" in animal) {
    return animal.swim();
  }
  return animal.fly();
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

function describeError(error: ApiError | NetworkError): string {
  if (error instanceof ApiError) {
    return `API Error ${error.status}: ${error.message}`;
  }
  return `Network Error: ${error.message}`;
}

// ---------------------------------------------------------------------------
// 5. Custom type guard
// ---------------------------------------------------------------------------

type Admin = { role: "admin"; permissions: string[] };
type Guest = { role: "guest" };
type User = Admin | Guest;

function isAdmin(user: User): user is Admin {
  return user.role === "admin";
}

function getPermissions(user: User): string[] {
  if (isAdmin(user)) {
    return user.permissions;
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

console.log("Solution 1.4 — All assertions passed!");

export {};
