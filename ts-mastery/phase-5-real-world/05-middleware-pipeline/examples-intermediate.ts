export {};

// ============================================================
// INTERMEDIATE EXAMPLES — Middleware Pipeline (50 Examples)
// ============================================================

// 1. Generic context type parameter
interface BaseCtx { [key: string]: unknown; }
type Middleware<C extends BaseCtx> = (ctx: C, next: () => Promise<void>) => Promise<void>;

// 2. Compose generic middleware
function compose<C extends BaseCtx>(middlewares: Middleware<C>[]): Middleware<C> {
  return async (ctx, next) => {
    let i = -1;
    const dispatch = async (index: number): Promise<void> => {
      if (index <= i) throw new Error("next() called multiple times");
      i = index;
      const fn = index < middlewares.length ? middlewares[index] : next;
      await fn(ctx, () => dispatch(index + 1));
    };
    await dispatch(0);
  };
}

// 3. Typed context extension pattern
interface HttpCtx extends BaseCtx {
  method: string;
  path: string;
  status: number;
  headers: Record<string, string>;
  body?: unknown;
}

// 4. Context enrichment — middleware adds typed fields
interface AuthCtx extends HttpCtx { userId?: number; role?: string; }
interface TracingCtx extends HttpCtx { traceId: string; spanId: string; }
interface LogCtx extends HttpCtx { logs: string[]; }

// 5. Middleware factory with typed options
interface RateLimitOpts { maxRequests: number; windowMs: number; keyFn: (ctx: HttpCtx) => string; }
function createRateLimiter(opts: RateLimitOpts): Middleware<HttpCtx> {
  const buckets = new Map<string, { count: number; resetAt: number }>();
  return async (ctx, next) => {
    const key = opts.keyFn(ctx);
    const now = Date.now();
    const bucket = buckets.get(key) ?? { count: 0, resetAt: now + opts.windowMs };
    if (now > bucket.resetAt) { bucket.count = 0; bucket.resetAt = now + opts.windowMs; }
    if (bucket.count >= opts.maxRequests) { ctx.status = 429; ctx.body = { error: "Too many requests" }; return; }
    bucket.count++;
    buckets.set(key, bucket);
    await next();
  };
}

// 6. Middleware with cleanup (try/finally pattern)
function withCleanup<C extends BaseCtx>(
  setup: (ctx: C) => Promise<unknown>,
  cleanup: (ctx: C) => Promise<void>
): Middleware<C> {
  return async (ctx, next) => {
    await setup(ctx);
    try { await next(); }
    finally { await cleanup(ctx); }
  };
}

// 7. Typed middleware chain builder
class MiddlewareChain<C extends BaseCtx> {
  private stack: Middleware<C>[] = [];
  use(mw: Middleware<C>): this { this.stack.push(mw); return this; }
  useIf(condition: boolean, mw: Middleware<C>): this {
    if (condition) this.stack.push(mw);
    return this;
  }
  build(): Middleware<C> { return compose(this.stack); }
  async run(ctx: C): Promise<void> {
    const pipeline = this.build();
    await pipeline(ctx, async () => {});
  }
}

// 8. Route-level middleware scoping
interface RouterCtx extends HttpCtx { params: Record<string, string>; routePattern: string; }
type RouteHandler<C extends RouterCtx> = Middleware<C>;

class Router<C extends RouterCtx> {
  private routes: { method: string; pattern: RegExp; keys: string[]; handler: RouteHandler<C> }[] = [];
  route(method: string, path: string, ...middlewares: Middleware<C>[]): this {
    const keys: string[] = [];
    const pattern = new RegExp("^" + path.replace(/:([^/]+)/g, (_, k) => { keys.push(k); return "([^/]+)"; }) + "$");
    this.routes.push({ method, pattern, keys, handler: compose(middlewares) });
    return this;
  }
  get(path: string, ...mws: Middleware<C>[]): this { return this.route("GET", path, ...mws); }
  post(path: string, ...mws: Middleware<C>[]): this { return this.route("POST", path, ...mws); }
  toMiddleware(): Middleware<C> {
    return async (ctx, next) => {
      for (const route of this.routes) {
        if (ctx.method === route.method && route.pattern.test(ctx.path)) {
          const match = ctx.path.match(route.pattern)!;
          ctx.params = Object.fromEntries(route.keys.map((k, i) => [k, match[i + 1]]));
          ctx.routePattern = route.pattern.source;
          return route.handler(ctx, next);
        }
      }
      await next();
    };
  }
}

// 9. Error handling middleware with typed errors
class HttpError extends Error {
  constructor(public status: number, message: string, public code?: string) { super(message); }
}
const errorMiddleware: Middleware<HttpCtx> = async (ctx, next) => {
  try { await next(); }
  catch (e) {
    if (e instanceof HttpError) { ctx.status = e.status; ctx.body = { error: e.message, code: e.code }; }
    else { ctx.status = 500; ctx.body = { error: "Internal Server Error" }; }
  }
};

// 10. Typed request validator middleware
type RequestSchema<C> = { body?: (v: unknown) => boolean; query?: Partial<Record<string, (v: string) => boolean>> };
function validateRequest<C extends HttpCtx>(schema: RequestSchema<C>): Middleware<C> {
  return async (ctx, next) => {
    if (schema.body && !schema.body(ctx.body)) {
      ctx.status = 400;
      ctx.body = { error: "Invalid request body" };
      return;
    }
    await next();
  };
}

// 11. Response caching middleware
interface CachingCtx extends HttpCtx { cacheKey?: string; fromCache?: boolean; }
function cacheMiddleware<C extends CachingCtx>(store: Map<string, unknown>, ttlMs: number): Middleware<C> {
  const expiry = new Map<string, number>();
  return async (ctx, next) => {
    if (ctx.method !== "GET") return next();
    const key = ctx.cacheKey ?? ctx.path;
    const exp = expiry.get(key) ?? 0;
    if (store.has(key) && Date.now() < exp) {
      ctx.body = store.get(key);
      ctx.status = 200;
      ctx.fromCache = true;
      return;
    }
    await next();
    if (ctx.status === 200) {
      store.set(key, ctx.body);
      expiry.set(key, Date.now() + ttlMs);
    }
  };
}

// 12. Typed session middleware
interface Session { userId?: number; data: Record<string, unknown>; createdAt: Date; }
interface SessionCtx extends HttpCtx { session: Session; sessionId: string; }
const sessions = new Map<string, Session>();
const sessionMiddleware: Middleware<SessionCtx> = async (ctx, next) => {
  const sid = ctx.sessionId ?? Math.random().toString(36).slice(2);
  ctx.sessionId = sid;
  ctx.session = sessions.get(sid) ?? { data: {}, createdAt: new Date() };
  await next();
  sessions.set(sid, ctx.session);
};

// 13. Content negotiation middleware
function contentNegotiation<C extends HttpCtx>(formats: Record<string, () => string>): Middleware<C> {
  return async (ctx, next) => {
    await next();
    const accept = ctx.headers["accept"] ?? "*/*";
    const matched = Object.keys(formats).find(f => accept.includes(f) || accept.includes("*/*"));
    if (matched) ctx.headers["Content-Type"] = formats[matched]();
  };
}

// 14. Logging middleware with structured logs
interface LogEntry { level: "info" | "warn" | "error"; message: string; data?: Record<string, unknown>; ts: number; }
interface LoggingCtx extends HttpCtx { logEntries: LogEntry[]; }
function structuredLogger<C extends LoggingCtx>(): Middleware<C> {
  return async (ctx, next) => {
    ctx.logEntries = [];
    const t = Date.now();
    await next();
    ctx.logEntries.push({ level: ctx.status >= 500 ? "error" : "info", message: `${ctx.method} ${ctx.path}`, data: { status: ctx.status, ms: Date.now() - t }, ts: t });
  };
}

// 15. Middleware that wraps context (adapter pattern)
function adaptCtx<CIn extends BaseCtx, COut extends BaseCtx>(
  adapter: (ctx: CIn) => COut,
  mw: Middleware<COut>
): Middleware<CIn> {
  return async (ctxIn, next) => {
    const ctxOut = adapter(ctxIn);
    await mw(ctxOut, next);
  };
}

// 16. Namespaced middleware — applies to paths with prefix
function prefix<C extends HttpCtx>(path: string, mw: Middleware<C>): Middleware<C> {
  return async (ctx, next) => {
    if (ctx.path.startsWith(path)) return mw(ctx, next);
    return next();
  };
}

// 17. Typed plugin system via middleware
interface Plugin<C extends BaseCtx> { name: string; middleware: Middleware<C>; order?: number; }
class PluginSystem<C extends BaseCtx> {
  private plugins: Plugin<C>[] = [];
  register(plugin: Plugin<C>): void { this.plugins.push(plugin); }
  build(): Middleware<C> {
    const sorted = [...this.plugins].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return compose(sorted.map(p => p.middleware));
  }
}

// 18. Middleware that measures and records metrics
interface MetricsCtx extends HttpCtx { metrics: Map<string, number>; }
function metricsMiddleware<C extends MetricsCtx>(): Middleware<C> {
  return async (ctx, next) => {
    ctx.metrics = new Map();
    const t = performance.now();
    await next();
    ctx.metrics.set("duration_ms", performance.now() - t);
    ctx.metrics.set("status", ctx.status);
  };
}

// 19. Typed parameter coercion middleware
function coerceParams<C extends RouterCtx>(): Middleware<C> {
  return async (ctx, next) => {
    ctx.params = Object.fromEntries(
      Object.entries(ctx.params).map(([k, v]) => [k, decodeURIComponent(v)])
    );
    await next();
  };
}

// 20. Typed CSRF protection middleware
interface CsrfCtx extends HttpCtx { csrfToken?: string; }
const csrfTokens = new Set<string>();
const csrfMiddleware: Middleware<CsrfCtx> = async (ctx, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(ctx.method)) {
    const token = ctx.headers["x-csrf-token"] ?? "";
    if (!csrfTokens.has(token)) { ctx.status = 403; ctx.body = { error: "Invalid CSRF token" }; return; }
  }
  await next();
};

// 21. Compression middleware stub
interface CompressionCtx extends HttpCtx { compressed: boolean; compressionAlgo?: "gzip" | "br" | "deflate"; }
const compressionMiddleware: Middleware<CompressionCtx> = async (ctx, next) => {
  const accept = ctx.headers["accept-encoding"] ?? "";
  ctx.compressed = false;
  await next();
  if (ctx.body && accept.includes("gzip")) { ctx.compressed = true; ctx.compressionAlgo = "gzip"; }
};

// 22. Typed OpenAPI request/response logging
interface OpenApiCtx extends HttpCtx { operationId?: string; }
function openApiLogger<C extends OpenApiCtx>(log: (entry: object) => void): Middleware<C> {
  return async (ctx, next) => {
    await next();
    log({ operationId: ctx.operationId, method: ctx.method, path: ctx.path, status: ctx.status });
  };
}

// 23. Middleware branching — if/else based on context
function branch<C extends BaseCtx>(
  condition: (ctx: C) => boolean,
  ifTrue: Middleware<C>,
  ifFalse: Middleware<C>
): Middleware<C> {
  return (ctx, next) => condition(ctx) ? ifTrue(ctx, next) : ifFalse(ctx, next);
}

// 24. Typed mock middleware (for testing)
class MockMiddleware<C extends BaseCtx> {
  calls: C[] = [];
  readonly middleware: Middleware<C> = async (ctx, next) => {
    this.calls.push({ ...ctx });
    await next();
  };
  wasCalled(): boolean { return this.calls.length > 0; }
  callCount(): number { return this.calls.length; }
}

// 25. Context snapshot for debugging
interface SnapCtx extends HttpCtx { snapshots: Record<string, unknown>[]; }
function snapshot<C extends SnapCtx>(label: string): Middleware<C> {
  return async (ctx, next) => {
    ctx.snapshots = ctx.snapshots ?? [];
    ctx.snapshots.push({ label, state: { ...ctx }, at: "before" });
    await next();
    ctx.snapshots.push({ label, state: { ...ctx }, at: "after" });
  };
}

// 26. Timeout middleware with proper cleanup
function withTimeout<C extends BaseCtx>(ms: number): Middleware<C> {
  return async (ctx: C & { status: number; body?: unknown }, next) => {
    let timedOut = false;
    const timeout = new Promise<void>((_, reject) => setTimeout(() => { timedOut = true; reject(new Error("Request timed out")); }, ms));
    try {
      await Promise.race([next(), timeout]);
    } catch (e) {
      if (timedOut) { (ctx as HttpCtx).status = 408; (ctx as HttpCtx).body = { error: "Request Timeout" }; }
      else throw e;
    }
  };
}

// 27. Tracing middleware with span support
class Tracer {
  private spans: { name: string; start: number; end?: number }[] = [];
  startSpan(name: string): { end: () => void } {
    const span = { name, start: performance.now() };
    this.spans.push(span);
    return { end: () => { span.end = performance.now(); } };
  }
  report(): typeof this.spans { return this.spans; }
}
function tracingMiddleware<C extends HttpCtx>(tracer: Tracer): Middleware<C> {
  return async (ctx, next) => {
    const span = tracer.startSpan(`${ctx.method} ${ctx.path}`);
    try { await next(); }
    finally { span.end(); }
  };
}

// 28. Typed request body size guard
interface SizedCtx extends HttpCtx { bodySize: number; }
function bodySizeGuard<C extends SizedCtx>(maxBytes: number): Middleware<C> {
  return async (ctx, next) => {
    if (ctx.bodySize > maxBytes) {
      ctx.status = 413;
      ctx.body = { error: `Body too large: max ${maxBytes} bytes` };
      return;
    }
    await next();
  };
}

// 29. Middleware execution order logging
function trace<C extends BaseCtx>(name: string, log: string[]): Middleware<C> {
  return async (ctx, next) => {
    log.push(`${name}:before`);
    await next();
    log.push(`${name}:after`);
  };
}

// 30. Typed API key auth middleware
interface ApiKeyCtx extends HttpCtx { apiKey?: string; clientId?: string; }
function apiKeyAuth<C extends ApiKeyCtx>(
  validateKey: (key: string) => { clientId: string } | null
): Middleware<C> {
  return async (ctx, next) => {
    const key = ctx.headers["x-api-key"] ?? ctx.apiKey ?? "";
    const result = validateKey(key);
    if (!result) { ctx.status = 401; ctx.body = { error: "Invalid API key" }; return; }
    ctx.clientId = result.clientId;
    await next();
  };
}

// 31. Typed health check middleware
interface HealthCtx extends HttpCtx { checks: Record<string, boolean>; }
function healthCheck<C extends HealthCtx>(checks: Record<string, () => Promise<boolean>>): Middleware<C> {
  return async (ctx, next) => {
    if (ctx.path !== "/health") return next();
    const results = await Promise.allSettled(Object.entries(checks).map(async ([k, fn]) => [k, await fn()]));
    ctx.checks = Object.fromEntries(results.map((r, i) => [
      Object.keys(checks)[i],
      r.status === "fulfilled" ? r.value[1] : false
    ]));
    ctx.status = Object.values(ctx.checks).every(Boolean) ? 200 : 503;
    ctx.body = { status: ctx.status === 200 ? "healthy" : "degraded", checks: ctx.checks };
  };
}

// 32. Typed middleware with dependency injection
interface ServiceContainer { get<T>(token: symbol): T; }
function inject<C extends BaseCtx, T>(
  token: symbol,
  container: ServiceContainer,
  use: (ctx: C, service: T) => Middleware<C>
): Middleware<C> {
  const service = container.get<T>(token);
  return use({} as C, service);
}

// 33. Typed multipart/mixed response composer
interface MultipartCtx extends HttpCtx { parts: { contentType: string; body: unknown }[]; }
const multipartResponse: Middleware<MultipartCtx> = async (ctx, next) => {
  ctx.parts = [];
  await next();
};

// 34. JSON Schema validation middleware
type JsonSchemaValidator = (data: unknown) => boolean;
function jsonSchemaValidation<C extends HttpCtx>(validator: JsonSchemaValidator): Middleware<C> {
  return async (ctx, next) => {
    if (ctx.body !== undefined && !validator(ctx.body)) {
      ctx.status = 422;
      ctx.body = { error: "Request body failed schema validation" };
      return;
    }
    await next();
  };
}

// 35. Typed request ID propagation
interface CorrelationCtx extends HttpCtx { correlationId: string; }
function correlationId<C extends CorrelationCtx>(generate: () => string): Middleware<C> {
  return async (ctx, next) => {
    ctx.correlationId = ctx.headers["x-correlation-id"] ?? generate();
    ctx.headers["x-correlation-id"] = ctx.correlationId;
    await next();
  };
}

// 36. Middleware that short-circuits on condition
function shortCircuit<C extends HttpCtx>(
  condition: (ctx: C) => boolean,
  response: { status: number; body: unknown }
): Middleware<C> {
  return async (ctx, next) => {
    if (condition(ctx)) { ctx.status = response.status; ctx.body = response.body; return; }
    await next();
  };
}

// 37. Typed response transformer
function transformResponse<C extends HttpCtx, T>(transform: (body: unknown) => T): Middleware<C> {
  return async (ctx, next) => {
    await next();
    if (ctx.status >= 200 && ctx.status < 300 && ctx.body !== undefined) {
      ctx.body = transform(ctx.body);
    }
  };
}

// 38. API versioning middleware
interface VersionCtx extends HttpCtx { apiVersion: number; }
function versionMiddleware<C extends VersionCtx>(handlers: Record<number, Middleware<C>>): Middleware<C> {
  return async (ctx, next) => {
    const handler = handlers[ctx.apiVersion];
    if (handler) return handler(ctx, next);
    ctx.status = 400;
    ctx.body = { error: `Unsupported API version: ${ctx.apiVersion}` };
  };
}

// 39. Typed circuit breaker middleware
interface CircuitBreakerOpts { threshold: number; timeout: number; }
class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private state: "closed" | "open" | "half-open" = "closed";
  constructor(private opts: CircuitBreakerOpts) {}
  isOpen(): boolean {
    if (this.state === "open" && Date.now() - this.lastFailure > this.opts.timeout) this.state = "half-open";
    return this.state === "open";
  }
  recordSuccess(): void { this.state = "closed"; this.failures = 0; }
  recordFailure(): void {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.opts.threshold) this.state = "open";
  }
}
function circuitBreakerMiddleware<C extends HttpCtx>(breaker: CircuitBreaker): Middleware<C> {
  return async (ctx, next) => {
    if (breaker.isOpen()) { ctx.status = 503; ctx.body = { error: "Service unavailable" }; return; }
    try { await next(); breaker.recordSuccess(); }
    catch (e) { breaker.recordFailure(); throw e; }
  };
}

// 40. Idempotency key middleware
const processedKeys = new Set<string>();
interface IdempotentCtx extends HttpCtx { idempotencyKey?: string; }
const idempotencyMiddleware: Middleware<IdempotentCtx> = async (ctx, next) => {
  const key = ctx.headers["idempotency-key"] ?? ctx.idempotencyKey;
  if (key) {
    if (processedKeys.has(key)) { ctx.status = 200; ctx.body = { cached: true }; return; }
    processedKeys.add(key);
  }
  await next();
};

// 41. Typed batch middleware
async function batchRun<C extends BaseCtx>(ctx: C, middlewares: Middleware<C>[]): Promise<void> {
  await Promise.all(middlewares.map(mw => mw({ ...ctx }, async () => {})));
}

// 42. Middleware testing utility
async function runMiddleware<C extends BaseCtx>(
  ctx: C,
  middlewares: Middleware<C>[]
): Promise<C> {
  const pipeline = compose(middlewares);
  await pipeline(ctx, async () => {});
  return ctx;
}

// 43. Middleware type assertion helper
function assertMiddleware<C extends BaseCtx>(fn: unknown): Middleware<C> {
  if (typeof fn !== "function") throw new TypeError("Expected middleware function");
  return fn as Middleware<C>;
}

// 44. Lazy middleware — loads handler only on first call
function lazy<C extends BaseCtx>(factory: () => Promise<Middleware<C>>): Middleware<C> {
  let resolved: Middleware<C> | undefined;
  return async (ctx, next) => {
    if (!resolved) resolved = await factory();
    return resolved(ctx, next);
  };
}

// 45. Typed HATEOAS link injector
interface HateoasCtx extends HttpCtx { links?: Record<string, string>; }
function hateoasLinks<C extends HateoasCtx>(buildLinks: (ctx: C) => Record<string, string>): Middleware<C> {
  return async (ctx, next) => {
    await next();
    if (ctx.status >= 200 && ctx.status < 300) ctx.links = buildLinks(ctx);
  };
}

// 46. Typed request body normalizer
function normalizeBody<C extends HttpCtx, T>(normalize: (v: unknown) => T): Middleware<C> {
  return async (ctx, next) => {
    if (ctx.body) ctx.body = normalize(ctx.body);
    await next();
  };
}

// 47. Typed response envelope
function envelope<C extends HttpCtx>(): Middleware<C> {
  return async (ctx, next) => {
    await next();
    if (ctx.status >= 200 && ctx.status < 300) {
      ctx.body = { data: ctx.body, timestamp: new Date().toISOString(), status: ctx.status };
    }
  };
}

// 48. Resource ownership middleware
interface OwnerCtx extends AuthCtx { resourceUserId?: number; }
function requireOwnership<C extends OwnerCtx>(): Middleware<C> {
  return async (ctx, next) => {
    if (ctx.role !== "admin" && ctx.userId !== ctx.resourceUserId) {
      ctx.status = 403;
      ctx.body = { error: "Not authorized to access this resource" };
      return;
    }
    await next();
  };
}

// 49. Middleware chain with named slots
class SlottedChain<C extends BaseCtx> {
  private slots: Map<string, Middleware<C>[]> = new Map(
    ["pre", "main", "post"].map(s => [s, []])
  );
  add(slot: string, mw: Middleware<C>): this {
    if (!this.slots.has(slot)) this.slots.set(slot, []);
    this.slots.get(slot)!.push(mw);
    return this;
  }
  build(): Middleware<C> {
    const all = [...this.slots.values()].flat();
    return compose(all);
  }
}

// 50. Fully typed application server (minimal)
class App<C extends HttpCtx> {
  private chain = new MiddlewareChain<C>();
  use(mw: Middleware<C>): this { this.chain.use(mw); return this; }
  async handle(ctx: C): Promise<void> { await this.chain.run(ctx); }
}
