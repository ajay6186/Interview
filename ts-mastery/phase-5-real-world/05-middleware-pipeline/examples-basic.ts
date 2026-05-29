export {};

// ============================================================
// BASIC EXAMPLES — Middleware Pipeline (50 Examples)
// ============================================================

// 1. Basic context type — request/response bag
interface Context { path: string; method: string; status: number; body?: unknown; }

// 2. Next function type — calls next middleware
type Next = () => Promise<void>;

// 3. Middleware function type
type Middleware<C> = (ctx: C, next: Next) => Promise<void>;

// 4. Simple logging middleware
const logger: Middleware<Context> = async (ctx, next) => {
  console.log(`--> ${ctx.method} ${ctx.path}`);
  await next();
  console.log(`<-- ${ctx.status}`);
};

// 5. Response time middleware
const responseTime: Middleware<Context> = async (ctx, next) => {
  const start = Date.now();
  await next();
  console.log(`${ctx.path} took ${Date.now() - start}ms`);
};

// 6. Error handler middleware
const errorHandler: Middleware<Context> = async (ctx, next) => {
  try {
    await next();
  } catch (e) {
    ctx.status = 500;
    ctx.body = { error: String(e) };
  }
};

// 7. Compose middleware into a pipeline
function compose<C>(middlewares: Middleware<C>[]): Middleware<C> {
  return async (ctx, next) => {
    let index = -1;
    async function dispatch(i: number): Promise<void> {
      if (i <= index) throw new Error("next() called multiple times");
      index = i;
      const fn = i < middlewares.length ? middlewares[i] : next;
      await fn(ctx, () => dispatch(i + 1));
    }
    await dispatch(0);
  };
}

// 8. HTTP method guard middleware
function methodGuard(allowed: string[]): Middleware<Context> {
  return async (ctx, next) => {
    if (!allowed.includes(ctx.method)) {
      ctx.status = 405;
      ctx.body = { error: "Method Not Allowed" };
      return;
    }
    await next();
  };
}

// 9. Content-Type setter middleware
interface HttpContext extends Context { headers: Record<string, string>; }
const setJsonContentType: Middleware<HttpContext> = async (ctx, next) => {
  await next();
  ctx.headers["Content-Type"] = "application/json";
};

// 10. Request ID middleware
interface RequestContext extends Context { requestId: string; }
const attachRequestId: Middleware<RequestContext> = async (ctx, next) => {
  ctx.requestId = Math.random().toString(36).slice(2);
  await next();
};

// 11. Auth context type
interface AuthContext extends Context { userId?: number; token?: string; }

// 12. Token validation middleware
function requireAuth(validateToken: (t: string) => number | null): Middleware<AuthContext> {
  return async (ctx, next) => {
    if (!ctx.token) { ctx.status = 401; return; }
    const userId = validateToken(ctx.token);
    if (!userId) { ctx.status = 401; return; }
    ctx.userId = userId;
    await next();
  };
}

// 13. Rate limiter state
const requestCounts = new Map<string, number>();

// 14. Rate limiter middleware
function rateLimit(maxPerMinute: number): Middleware<AuthContext> {
  return async (ctx, next) => {
    const key = String(ctx.userId ?? ctx.path);
    const count = requestCounts.get(key) ?? 0;
    if (count >= maxPerMinute) { ctx.status = 429; return; }
    requestCounts.set(key, count + 1);
    await next();
  };
}

// 15. Cache context
interface CacheContext extends Context { cacheHit?: boolean; }

// 16. Simple in-memory cache middleware
const cache = new Map<string, unknown>();
const cacheMiddleware: Middleware<CacheContext> = async (ctx, next) => {
  const key = ctx.path;
  if (cache.has(key)) {
    ctx.body = cache.get(key);
    ctx.cacheHit = true;
    ctx.status = 200;
    return;
  }
  await next();
  if (ctx.status === 200) cache.set(key, ctx.body);
};

// 17. Timing context
interface TimingContext extends Context { duration?: number; }

// 18. Timing middleware
const timing: Middleware<TimingContext> = async (ctx, next) => {
  const t0 = performance.now();
  await next();
  ctx.duration = performance.now() - t0;
};

// 19. CORS middleware
interface CorsContext extends Context { headers: Record<string, string>; }
const cors: Middleware<CorsContext> = async (ctx, next) => {
  ctx.headers["Access-Control-Allow-Origin"] = "*";
  ctx.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE";
  await next();
};

// 20. Body parser middleware (simulated)
interface BodyContext extends Context { rawBody?: string; parsedBody?: unknown; }
const jsonBodyParser: Middleware<BodyContext> = async (ctx, next) => {
  if (ctx.rawBody) {
    try { ctx.parsedBody = JSON.parse(ctx.rawBody); }
    catch { ctx.status = 400; ctx.body = { error: "Invalid JSON" }; return; }
  }
  await next();
};

// 21. Request validator middleware
function validateBody<T>(validate: (b: unknown) => b is T): Middleware<BodyContext> {
  return async (ctx, next) => {
    if (!validate(ctx.parsedBody)) {
      ctx.status = 422;
      ctx.body = { error: "Validation failed" };
      return;
    }
    await next();
  };
}

// 22. Redirect middleware
interface RedirectContext extends Context { redirectTo?: string; }
function redirect(to: string, code = 302): Middleware<RedirectContext> {
  return async (ctx) => {
    ctx.redirectTo = to;
    ctx.status = code;
  };
}

// 23. Not found handler
const notFound: Middleware<Context> = async (ctx, next) => {
  await next();
  if (!ctx.status || ctx.status === 404) {
    ctx.status = 404;
    ctx.body = { error: "Not Found" };
  }
};

// 24. Secure headers middleware
const secureHeaders: Middleware<HttpContext> = async (ctx, next) => {
  await next();
  ctx.headers["X-Content-Type-Options"] = "nosniff";
  ctx.headers["X-Frame-Options"] = "DENY";
  ctx.headers["X-XSS-Protection"] = "1; mode=block";
};

// 25. Request size limiter
interface SizedContext extends Context { contentLength?: number; }
function maxBodySize(bytes: number): Middleware<SizedContext> {
  return async (ctx, next) => {
    if ((ctx.contentLength ?? 0) > bytes) {
      ctx.status = 413;
      ctx.body = { error: "Request entity too large" };
      return;
    }
    await next();
  };
}

// 26. IP whitelist middleware
interface IpContext extends Context { ip: string; }
function ipWhitelist(allowed: string[]): Middleware<IpContext> {
  return async (ctx, next) => {
    if (!allowed.includes(ctx.ip)) {
      ctx.status = 403;
      ctx.body = { error: "Forbidden" };
      return;
    }
    await next();
  };
}

// 27. Conditional middleware
function when<C>(condition: (ctx: C) => boolean, middleware: Middleware<C>): Middleware<C> {
  return async (ctx, next) => {
    if (condition(ctx)) return middleware(ctx, next);
    return next();
  };
}

// 28. Apply middleware only on GET requests
const onlyGet = when<Context>(ctx => ctx.method === "GET", logger);

// 29. Delay middleware (for testing/rate limiting)
function delay(ms: number): Middleware<Context> {
  return async (_ctx, next) => {
    await new Promise(r => setTimeout(r, ms));
    await next();
  };
}

// 30. Retry middleware
function retry(times: number): Middleware<Context> {
  return async (ctx, next) => {
    for (let i = 0; i < times; i++) {
      try { await next(); return; }
      catch { if (i === times - 1) throw; }
    }
  };
}

// 31. Timeout middleware
function timeout(ms: number): Middleware<Context> {
  return async (ctx, next) => {
    await Promise.race([
      next(),
      new Promise<void>((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms)),
    ]);
  };
}

// 32. Request counter middleware
let requestCount = 0;
const counter: Middleware<Context> = async (_ctx, next) => {
  requestCount++;
  await next();
};

// 33. Path prefix middleware — route to nested pipeline
function prefix(path: string, middleware: Middleware<Context>): Middleware<Context> {
  return async (ctx, next) => {
    if (ctx.path.startsWith(path)) return middleware(ctx, next);
    return next();
  };
}

// 34. Async middleware that adds data to context
interface DataContext extends Context { data?: Record<string, unknown>; }
const initData: Middleware<DataContext> = async (ctx, next) => {
  ctx.data = {};
  await next();
};

// 35. Set response body middleware
function setBody(body: unknown): Middleware<Context> {
  return async (ctx, next) => {
    ctx.body = body;
    ctx.status = 200;
    await next();
  };
}

// 36. Status code setter
function setStatus(code: number): Middleware<Context> {
  return async (ctx, next) => {
    await next();
    ctx.status = code;
  };
}

// 37. Middleware pipeline runner
async function run<C>(ctx: C, middlewares: Middleware<C>[]): Promise<void> {
  const pipeline = compose(middlewares);
  await pipeline(ctx, async () => {});
}

// 38. Trace middleware — adds span-like logging
interface TraceContext extends Context { traceId: string; spans: string[]; }
const tracer: Middleware<TraceContext> = async (ctx, next) => {
  ctx.traceId = Math.random().toString(16).slice(2);
  ctx.spans = [];
  await next();
};

// 39. User-agent logging middleware
interface UaContext extends Context { userAgent?: string; }
const logUserAgent: Middleware<UaContext> = async (ctx, next) => {
  if (ctx.userAgent) console.log(`User-Agent: ${ctx.userAgent}`);
  await next();
};

// 40. Compression context (simulated)
interface CompressionContext extends Context { compressed?: boolean; }
const compress: Middleware<CompressionContext> = async (ctx, next) => {
  await next();
  ctx.compressed = true; // simulate compression
};

// 41. API versioning middleware
interface VersionContext extends Context { apiVersion: string; }
function requireVersion(supported: string[]): Middleware<VersionContext> {
  return async (ctx, next) => {
    if (!supported.includes(ctx.apiVersion)) {
      ctx.status = 400;
      ctx.body = { error: `Unsupported API version: ${ctx.apiVersion}` };
      return;
    }
    await next();
  };
}

// 42. Feature flag middleware
interface FeatureContext extends Context { features: Record<string, boolean>; }
function requireFeature(flag: string): Middleware<FeatureContext> {
  return async (ctx, next) => {
    if (!ctx.features[flag]) {
      ctx.status = 403;
      ctx.body = { error: `Feature '${flag}' is not enabled` };
      return;
    }
    await next();
  };
}

// 43. ETag middleware (simulated)
interface ETagContext extends Context { etag?: string; }
const etag: Middleware<ETagContext> = async (ctx, next) => {
  await next();
  if (ctx.body) ctx.etag = JSON.stringify(ctx.body).length.toString(16);
};

// 44. Accept-Language middleware
interface LangContext extends Context { lang: string; }
function defaultLang(lang: string): Middleware<LangContext> {
  return async (ctx, next) => {
    if (!ctx.lang) ctx.lang = lang;
    await next();
  };
}

// 45. Health check bypass middleware
const healthCheck: Middleware<Context> = async (ctx, next) => {
  if (ctx.path === "/health") {
    ctx.status = 200;
    ctx.body = { status: "ok" };
    return;
  }
  await next();
};

// 46. Metrics collection middleware
interface MetricsContext extends Context { metrics: { path: string; method: string; duration: number; status: number }[]; }
function metricsCollector(store: MetricsContext["metrics"]): Middleware<Context> {
  return async (ctx, next) => {
    const t = Date.now();
    await next();
    store.push({ path: ctx.path, method: ctx.method, duration: Date.now() - t, status: ctx.status });
  };
}

// 47. Deprecation warning middleware
function deprecated(message: string): Middleware<Context> {
  return async (ctx, next) => {
    console.warn(`[DEPRECATED] ${ctx.path}: ${message}`);
    await next();
  };
}

// 48. Schema validation middleware (on context)
function mustHave<C>(field: keyof C): Middleware<C> {
  return async (ctx, next) => {
    if (ctx[field] == null) throw new Error(`Context missing required field: ${String(field)}`);
    await next();
  };
}

// 49. Guard middleware — abort if predicate fails
function guard<C>(predicate: (ctx: C) => boolean, status: number, message: string): Middleware<C & Context> {
  return async (ctx, next) => {
    if (!predicate(ctx)) {
      ctx.status = status;
      ctx.body = { error: message };
      return;
    }
    await next();
  };
}

// 50. Simple pipeline builder
class Pipeline<C> {
  private middlewares: Middleware<C>[] = [];
  use(m: Middleware<C>): this { this.middlewares.push(m); return this; }
  build(): Middleware<C> { return compose(this.middlewares); }
}
