// ============================================================================
// Solution 6.5 — Type-Safe Router
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// 1. Extract route parameters
// ---------------------------------------------------------------------------

type ExtractRouteParams<Path extends string> =
  Path extends `${string}:${infer Param}/${infer Rest}`
    ? { [K in Param]: string } & ExtractRouteParams<`/${Rest}`>
    : Path extends `${string}:${infer Param}`
      ? { [K in Param]: string }
      : {};

// Prettify for cleaner display
type Prettify<T> = { [K in keyof T]: T[K] } & {};

type Test1 = Expect<Equal<ExtractRouteParams<"/users/:id">, { id: string }>>;
type Test2 = Expect<Equal<
  Prettify<ExtractRouteParams<"/users/:userId/posts/:postId">>,
  { userId: string; postId: string }
>>;
type Test3 = Expect<Equal<ExtractRouteParams<"/about">, {}>>;

// ---------------------------------------------------------------------------
// 2. Route handler type
// ---------------------------------------------------------------------------

type RouteHandler<Path extends string> = (params: ExtractRouteParams<Path>) => string;

// ---------------------------------------------------------------------------
// 3. Router class
// ---------------------------------------------------------------------------

interface StoredRoute {
  method: string;
  pattern: string;
  segments: string[];
  handler: (params: Record<string, string>) => string;
}

class Router {
  private routes: StoredRoute[] = [];

  get<Path extends string>(path: Path, handler: RouteHandler<Path>): void {
    this.addRoute("GET", path, handler as any);
  }

  post<Path extends string>(path: Path, handler: RouteHandler<Path>): void {
    this.addRoute("POST", path, handler as any);
  }

  put<Path extends string>(path: Path, handler: RouteHandler<Path>): void {
    this.addRoute("PUT", path, handler as any);
  }

  delete<Path extends string>(path: Path, handler: RouteHandler<Path>): void {
    this.addRoute("DELETE", path, handler as any);
  }

  private addRoute(method: string, pattern: string, handler: (params: Record<string, string>) => string): void {
    const segments = pattern.split("/").filter(Boolean);
    this.routes.push({ method, pattern, segments, handler });
  }

  match(method: string, path: string): string | null {
    const pathSegments = path.split("/").filter(Boolean);

    for (const route of this.routes) {
      if (route.method !== method) continue;
      if (route.segments.length !== pathSegments.length) continue;

      const params: Record<string, string> = {};
      let matched = true;

      for (let i = 0; i < route.segments.length; i++) {
        const routeSeg = route.segments[i];
        const pathSeg = pathSegments[i];

        if (routeSeg.startsWith(":")) {
          params[routeSeg.slice(1)] = pathSeg;
        } else if (routeSeg !== pathSeg) {
          matched = false;
          break;
        }
      }

      if (matched) {
        return route.handler(params);
      }
    }

    return null;
  }
}

// ---------------------------------------------------------------------------
// Runtime tests
// ---------------------------------------------------------------------------

const router = new Router();

router.get("/users/:id", (params) => {
  return `User: ${params.id}`;
});

router.get("/users/:userId/posts/:postId", (params) => {
  return `User ${params.userId}, Post ${params.postId}`;
});

router.post("/users", (_params) => {
  return "Created user";
});

router.get("/about", (_params) => {
  return "About page";
});

console.assert(router.match("GET", "/users/123") === "User: 123", "match user");
console.assert(
  router.match("GET", "/users/alice/posts/42") === "User alice, Post 42",
  "match user post"
);
console.assert(router.match("POST", "/users") === "Created user", "match create");
console.assert(router.match("GET", "/about") === "About page", "match about");
console.assert(router.match("GET", "/unknown") === null, "no match");
console.assert(router.match("DELETE", "/users/1") === null, "wrong method");

console.log("Solution 6.5 — All assertions passed!");

export {};
