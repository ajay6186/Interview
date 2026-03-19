// ============================================================================
// Exercise 5.1 — Type-Safe API Client
// ============================================================================
// Build a fully typed API client that maps endpoints to request/response types.
//
// Instructions: Fill in every TODO so the file compiles and all assertions pass.
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// API Schema definition
// ---------------------------------------------------------------------------

// TODO: Define an API schema type that maps method+path to request/response types

interface ApiSchema {
  "GET /users": { response: User[] };
  "GET /users/:id": { params: { id: string }; response: User };
  "POST /users": { body: CreateUserBody; response: User };
  "PUT /users/:id": { params: { id: string }; body: UpdateUserBody; response: User };
  "DELETE /users/:id": { params: { id: string }; response: { success: boolean } };
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface CreateUserBody {
  name: string;
  email: string;
}

interface UpdateUserBody {
  name?: string;
  email?: string;
}

// ---------------------------------------------------------------------------
// TODO: Implement the ApiClient class
// ---------------------------------------------------------------------------

// The client should:
// - Accept an ApiSchema as a generic parameter
// - Have a `request` method that enforces correct types for each endpoint
// - Simulate responses (no actual HTTP needed)

type ExtractMethod<K extends string> = K extends `${infer M} ${string}` ? M : never;
type ExtractPath<K extends string> = K extends `${string} ${infer P}` ? P : never;

// TODO: Implement ApiClient
class ApiClient<Schema extends Record<string, any>> {
  // TODO: implement request method
  // request<K extends keyof Schema>(endpoint: K, options?: ...): Promise<Schema[K]["response"]>
}

// ---------------------------------------------------------------------------
// Runtime tests (uncomment after implementing)
// ---------------------------------------------------------------------------

/*
const client = new ApiClient<ApiSchema>();

async function test() {
  // These should be fully typed:
  const users = await client.request("GET /users");
  const user = await client.request("GET /users/:id", { params: { id: "1" } });
  const created = await client.request("POST /users", { body: { name: "Alice", email: "a@b.com" } });
}
*/

console.log("Exercise 5.1 — All assertions passed!");

export {};
