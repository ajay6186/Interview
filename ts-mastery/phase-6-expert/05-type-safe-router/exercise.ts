// ============================================================================
// Exercise 6.5 — Type-Safe Router
// ============================================================================
// Build a router where route parameters are extracted from path patterns
// at the type level, and handlers receive correctly typed params.
//
// Instructions: Fill in every TODO so the file compiles and all assertions pass.
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// 1. Extract route parameters from path patterns
// ---------------------------------------------------------------------------

// TODO: Extract parameter names from a route string
// "/users/:id" → { id: string }
// "/users/:userId/posts/:postId" → { userId: string; postId: string }
// "/about" → {}
type ExtractRouteParams<Path extends string> = any;

type Test1 = Expect<Equal<ExtractRouteParams<"/users/:id">, { id: string }>>;
type Test2 = Expect<Equal<
  ExtractRouteParams<"/users/:userId/posts/:postId">,
  { userId: string; postId: string }
>>;
type Test3 = Expect<Equal<ExtractRouteParams<"/about">, {}>>;

// ---------------------------------------------------------------------------
// 2. Route handler type
// ---------------------------------------------------------------------------

// TODO: Define a handler type that receives typed params
type RouteHandler<Path extends string> = (params: ExtractRouteParams<Path>) => string;

// ---------------------------------------------------------------------------
// 3. Router class
// ---------------------------------------------------------------------------

// TODO: Implement a Router class with:
// - get<Path>(path, handler): void — register a GET route
// - post<Path>(path, handler): void — register a POST route
// - match(method, path): string | null — find and execute matching route

class Router {
  // TODO: implement
}

// ---------------------------------------------------------------------------
// 4. Advanced: Typed route definitions
// ---------------------------------------------------------------------------

// TODO: Define a helper that creates a typed route registry
// Each route maps a pattern to its handler, with full type checking

// type RouteRegistry = {
//   "/users": { GET: () => string };
//   "/users/:id": { GET: (params: { id: string }) => string };
//   "/users/:id/posts": { GET: (params: { id: string }) => string };
// };

// ---------------------------------------------------------------------------
// Runtime tests (uncomment after implementing)
// ---------------------------------------------------------------------------

/*
const router = new Router();

router.get("/users/:id", (params) => {
  return `User: ${params.id}`;
});

router.get("/users/:userId/posts/:postId", (params) => {
  return `User ${params.userId}, Post ${params.postId}`;
});

router.post("/users", (params) => {
  return "Created user";
});

console.assert(router.match("GET", "/users/123") === "User: 123", "match user");
console.assert(
  router.match("GET", "/users/alice/posts/42") === "User alice, Post 42",
  "match user post"
);
console.assert(router.match("POST", "/users") === "Created user", "match create");
console.assert(router.match("GET", "/unknown") === null, "no match");
*/

console.log("Exercise 6.5 — All assertions passed!");

export {};
