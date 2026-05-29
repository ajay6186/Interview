export {};

// ============================================================
// Phase 6 – Expert: Type-Safe Router — BASIC (1–50)
// ============================================================

// --- 1. Extract single param ---
type ExtractRouteParams<Path extends string> =
  Path extends `${string}:${infer Param}/${infer Rest}`
    ? { [K in Param]: string } & ExtractRouteParams<`/${Rest}`>
    : Path extends `${string}:${infer Param}`
      ? { [K in Param]: string }
      : {};
type B1 = ExtractRouteParams<"/users/:id">; // { id: string }

// --- 2. No params ---
type B2 = ExtractRouteParams<"/about">; // {}

// --- 3. Multiple params ---
type B3 = ExtractRouteParams<"/users/:userId/posts/:postId">; // { userId: string; postId: string }

// --- 4. Three params ---
type B4 = ExtractRouteParams<"/a/:x/b/:y/c/:z">; // { x: string; y: string; z: string }

// --- 5. Prettify helper ---
type Prettify<T> = { [K in keyof T]: T[K] } & {};
type B5 = Prettify<ExtractRouteParams<"/users/:userId/posts/:postId">>;

// --- 6. Route handler type ---
type RouteHandler<Path extends string> = (params: ExtractRouteParams<Path>) => string;
type B6 = RouteHandler<"/users/:id">; // (params: { id: string }) => string

// --- 7. Handler with no params ---
type B7 = RouteHandler<"/health">; // (params: {}) => string

// --- 8. Http methods ---
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
const B8: HttpMethod = "GET";

// --- 9. Route definition ---
type RouteDef<Path extends string> = {
  path: Path;
  method: HttpMethod;
  handler: RouteHandler<Path>;
};

// --- 10. Define a route ---
const B10: RouteDef<"/users/:id"> = {
  path: "/users/:id",
  method: "GET",
  handler: (params) => `User: ${params.id}`,
};

// --- 11. Static router map ---
type RouteMap = {
  "/": RouteHandler<"/">;
  "/users": RouteHandler<"/users">;
  "/users/:id": RouteHandler<"/users/:id">;
};

// --- 12. Param names union ---
type ParamNames<Path extends string> = keyof ExtractRouteParams<Path>;
type B12 = ParamNames<"/users/:userId/posts/:postId">; // "userId" | "postId"

// --- 13. Check if path has params ---
type HasParams<Path extends string> = ExtractRouteParams<Path> extends Record<string, never>
  ? false
  : keyof ExtractRouteParams<Path> extends never
  ? false
  : true;
type B13_T = HasParams<"/users/:id">; // true
type B13_F = HasParams<"/about">; // false

// --- 14. Simple typed get function ---
function get<Path extends string>(path: Path, handler: RouteHandler<Path>): void {
  console.log(`GET ${path}`, handler);
}
get("/users/:id", (params) => `Hello ${params.id}`);

// --- 15. Simple typed post function ---
function post<Path extends string>(path: Path, handler: RouteHandler<Path>): void {
  console.log(`POST ${path}`, handler);
}
post("/users", (_params) => "created");

// --- 16. Segment split ---
type SplitPath<Path extends string> =
  Path extends `/${infer Seg}/${infer Rest}`
    ? [Seg, ...SplitPath<`/${Rest}`>]
    : Path extends `/${infer Seg}`
    ? [Seg]
    : [];
type B16 = SplitPath<"/users/:id/posts">; // ["users", ":id", "posts"]

// --- 17. Is param segment ---
type IsParamSeg<S extends string> = S extends `:${string}` ? true : false;
type B17_T = IsParamSeg<":id">; // true
type B17_F = IsParamSeg<"users">; // false

// --- 18. Extract param name from segment ---
type ParamFromSeg<S extends string> = S extends `:${infer P}` ? P : never;
type B18 = ParamFromSeg<":userId">; // "userId"

// --- 19. Segments to params ---
type SegsToParams<Segs extends string[]> =
  Segs extends [infer H extends string, ...infer Rest extends string[]]
    ? IsParamSeg<H> extends true
      ? { [K in ParamFromSeg<H>]: string } & SegsToParams<Rest>
      : SegsToParams<Rest>
    : {};
type B19 = Prettify<SegsToParams<["users", ":id", "posts", ":postId"]>>;

// --- 20. Route response types ---
type JsonResponse<T> = { status: number; body: T };
type TypedHandler<Path extends string, Res> = (params: ExtractRouteParams<Path>) => JsonResponse<Res>;

// --- 21. User handler ---
type UserResponse = { id: string; name: string };
type B21 = TypedHandler<"/users/:id", UserResponse>;

// --- 22. Basic router class ---
class BasicRouter {
  private routes: { method: string; path: string; handler: Function }[] = [];
  get<P extends string>(path: P, handler: RouteHandler<P>) { this.routes.push({ method: "GET", path, handler }); }
  post<P extends string>(path: P, handler: RouteHandler<P>) { this.routes.push({ method: "POST", path, handler }); }
}

// --- 23. Use basic router ---
const B23_router = new BasicRouter();
B23_router.get("/users/:id", (p) => `User ${p.id}`);
B23_router.post("/users", (_p) => "created");

// --- 24. Path segment count ---
type SegCount<Path extends string> = SplitPath<Path>["length"];
type B24 = SegCount<"/users/:id/posts/:postId">; // 4

// --- 25. Static path check ---
type IsStaticPath<Path extends string> = HasParams<Path> extends false ? true : false;
type B25_T = IsStaticPath<"/about">; // true
type B25_F = IsStaticPath<"/users/:id">; // false

// --- 26. Merge params ---
type MergeParams<A extends object, B extends object> = Prettify<A & B>;
type B26 = MergeParams<{ id: string }, { page: string }>; // { id: string; page: string }

// --- 27. Request context ---
type Request<Path extends string> = {
  method: HttpMethod;
  path: string;
  params: ExtractRouteParams<Path>;
};

// --- 28. Response object ---
type Response = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
};

// --- 29. Full handler signature ---
type FullHandler<Path extends string> = (req: Request<Path>, res: Response) => void;
type B29 = FullHandler<"/users/:id">; // (req: Request<...>, res: Response) => void

// --- 30. Route with method ---
type Route<M extends HttpMethod, P extends string> = {
  method: M;
  path: P;
  handler: RouteHandler<P>;
};
const B30: Route<"GET", "/users/:id"> = {
  method: "GET",
  path: "/users/:id",
  handler: (p) => `User ${p.id}`,
};

// --- 31. Route array ---
type Routes = Route<HttpMethod, string>[];

// --- 32. Path prefix ---
type WithPrefix<Prefix extends string, Path extends string> = `${Prefix}${Path}`;
type B32 = WithPrefix<"/api/v1", "/users/:id">; // "/api/v1/users/:id"

// --- 33. Extract prefix params ---
type B33 = ExtractRouteParams<WithPrefix<"/api/v1", "/users/:id">>; // { id: string }

// --- 34. Redirect type ---
type Redirect = { type: "redirect"; to: string; status: 301 | 302 | 307 | 308 };
type HandlerResult = string | Redirect;

// --- 35. Redirect handler ---
type RedirectHandler<Path extends string> = (params: ExtractRouteParams<Path>) => HandlerResult;

// --- 36. Wildcard path ---
type CatchAll<Prefix extends string> = `${Prefix}/*`;
type B36 = CatchAll<"/static">; // "/static/*"

// --- 37. Path to string literal ---
function makeRoute<P extends string>(path: P): P { return path; }
const B37 = makeRoute("/users/:id"); // type is "/users/:id"

// --- 38. Endpoint builder ---
function endpoint<P extends string, R>(
  path: P,
  handler: (params: ExtractRouteParams<P>) => R
): { path: P; handler: (params: ExtractRouteParams<P>) => R } {
  return { path, handler };
}
const B38 = endpoint("/posts/:slug", (p) => ({ slug: p.slug }));

// --- 39. Route params partial ---
type PartialParams<Path extends string> = Partial<ExtractRouteParams<Path>>;
type B39 = PartialParams<"/users/:id/posts/:postId">; // { id?: string; postId?: string }

// --- 40. Build URL from params ---
function buildUrl<P extends string>(
  path: P,
  params: ExtractRouteParams<P>
): string {
  return (path as string).replace(/:(\w+)/g, (_, key) => (params as Record<string, string>)[key] ?? "");
}
const B40 = buildUrl("/users/:id", { id: "123" }); // "/users/123"

// --- 41. Match result ---
type MatchResult<Path extends string> =
  | { matched: true; params: ExtractRouteParams<Path> }
  | { matched: false };

// --- 42. Simple matcher ---
function matchPath<P extends string>(pattern: P, path: string): MatchResult<P> {
  const patternSegs = pattern.split("/").filter(Boolean);
  const pathSegs = path.split("/").filter(Boolean);
  if (patternSegs.length !== pathSegs.length) return { matched: false };
  const params: Record<string, string> = {};
  for (let i = 0; i < patternSegs.length; i++) {
    if (patternSegs[i].startsWith(":")) params[patternSegs[i].slice(1)] = pathSegs[i];
    else if (patternSegs[i] !== pathSegs[i]) return { matched: false };
  }
  return { matched: true, params: params as ExtractRouteParams<P> };
}
const B42 = matchPath("/users/:id", "/users/42");

// --- 43. Guard-based access ---
if (B42.matched) {
  const id = B42.params.id; // string
  console.log(id);
}

// --- 44. Typed link builder ---
type LinkFor<Path extends string> = keyof ExtractRouteParams<Path> extends never
  ? () => string
  : (params: ExtractRouteParams<Path>) => string;

function link<P extends string>(path: P): LinkFor<P> {
  return ((params?: Record<string, string>) =>
    params
      ? (path as string).replace(/:(\w+)/g, (_, k) => params[k])
      : path
  ) as LinkFor<P>;
}
const B44_userLink = link("/users/:id");
const B44_aboutLink = link("/about");

// --- 45. Route not found handler ---
type NotFoundHandler = (path: string) => string;
const B45_notFound: NotFoundHandler = (path) => `404: ${path} not found`;

// --- 46. Error handler ---
type ErrorHandler = (err: Error, path: string) => string;
const B46_error: ErrorHandler = (err) => `500: ${err.message}`;

// --- 47. Method override ---
type MethodMap<Path extends string> = {
  [M in HttpMethod]?: RouteHandler<Path>;
};
const B47: MethodMap<"/users/:id"> = {
  GET: (p) => `Get user ${p.id}`,
  DELETE: (p) => `Delete user ${p.id}`,
};

// --- 48. Route registry ---
const B48_registry = new Map<string, RouteHandler<string>>();
B48_registry.set("/users/:id", (p) => `User: ${(p as { id: string }).id}`);

// --- 49. Generate path from template ---
type PathTemplate<T extends Record<string, string>> = string;
function fillTemplate(template: string, params: Record<string, string>): string {
  return template.replace(/:(\w+)/g, (_, k) => params[k] ?? `:${k}`);
}
const B49 = fillTemplate("/users/:id/posts/:postId", { id: "1", postId: "2" });

// --- 50. Compose handlers ---
function first<P extends string>(...handlers: RouteHandler<P>[]): RouteHandler<P> {
  return (params) => {
    for (const h of handlers) {
      const result = h(params);
      if (result) return result;
    }
    return "";
  };
}
const B50 = first<"/users/:id">(
  (p) => (p.id === "admin" ? "Admin panel" : ""),
  (p) => `User: ${p.id}`
);
