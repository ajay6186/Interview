// ============================================================================
// Solution 5.1 — Type-Safe API Client
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// API Schema
// ---------------------------------------------------------------------------

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

type ApiSchema = {
  "GET /users": { response: User[] };
  "GET /users/:id": { params: { id: string }; response: User };
  "POST /users": { body: CreateUserBody; response: User };
  "PUT /users/:id": { params: { id: string }; body: UpdateUserBody; response: User };
  "DELETE /users/:id": { params: { id: string }; response: { success: boolean } };
};

// ---------------------------------------------------------------------------
// Type utilities
// ---------------------------------------------------------------------------

type ExtractMethod<K extends string> = K extends `${infer M} ${string}` ? M : never;
type ExtractPath<K extends string> = K extends `${string} ${infer P}` ? P : never;

// Build the options type from a schema entry
type RequestOptions<Entry> =
  (Entry extends { params: infer P } ? { params: P } : {}) &
  (Entry extends { body: infer B } ? { body: B } : {});

// Check if options are required (has params or body)
type HasRequiredOptions<Entry> =
  Entry extends { params: any } ? true :
  Entry extends { body: any } ? true :
  false;

// ---------------------------------------------------------------------------
// ApiClient
// ---------------------------------------------------------------------------

class ApiClient<Schema extends Record<string, { response: any }>> {
  private mockData: Map<string, any> = new Map();

  // Set mock response for testing
  mock<K extends keyof Schema & string>(endpoint: K, data: Schema[K]["response"]): void {
    this.mockData.set(endpoint, data);
  }

  // Type-safe request method
  async request<K extends keyof Schema & string>(
    endpoint: K,
    ...args: HasRequiredOptions<Schema[K]> extends true
      ? [options: RequestOptions<Schema[K]>]
      : [options?: RequestOptions<Schema[K]>]
  ): Promise<Schema[K]["response"]> {
    const options = args[0];

    // In a real client, this would make an HTTP request
    // For testing, return mock data
    if (this.mockData.has(endpoint)) {
      return this.mockData.get(endpoint);
    }

    // Simulate a basic response
    const method = endpoint.split(" ")[0];
    const path = endpoint.split(" ")[1];

    if (method === "DELETE") {
      return { success: true } as Schema[K]["response"];
    }

    throw new Error(`No mock data for ${endpoint}`);
  }
}

// ---------------------------------------------------------------------------
// Runtime tests
// ---------------------------------------------------------------------------

async function runTests() {
  const client = new ApiClient<ApiSchema>();

  // Set up mocks
  const mockUsers: User[] = [
    { id: "1", name: "Alice", email: "alice@test.com" },
    { id: "2", name: "Bob", email: "bob@test.com" },
  ];

  client.mock("GET /users", mockUsers);
  client.mock("GET /users/:id", mockUsers[0]);
  client.mock("POST /users", { id: "3", name: "Charlie", email: "c@test.com" });

  const users = await client.request("GET /users");
  console.assert(users.length === 2, "get users");
  console.assert(users[0].name === "Alice", "first user");

  const user = await client.request("GET /users/:id", { params: { id: "1" } });
  console.assert(user.name === "Alice", "get user by id");

  const created = await client.request("POST /users", {
    body: { name: "Charlie", email: "c@test.com" },
  });
  console.assert(created.name === "Charlie", "create user");

  const deleted = await client.request("DELETE /users/:id", { params: { id: "1" } });
  console.assert(deleted.success === true, "delete user");

  console.log("Solution 5.1 — All assertions passed!");
}

runTests();

export {};
