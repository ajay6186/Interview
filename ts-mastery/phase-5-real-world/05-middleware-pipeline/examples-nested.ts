export {};

// ============================================================
// NESTED EXAMPLES — Middleware Pipeline (50 Examples)
// ============================================================

// 1. Typed context accumulation — each middleware adds typed properties
type BaseCtx = { path: string; method: string; status: number };
type WithAuth<C> = C & { userId: number; role: string };
type WithBody<C, T> = C & { body: T };
type WithSession<C> = C & { session: Record<string, unknown>; sessionId: string };
type WithTracing<C> = C & { traceId: string; spans: string[] };

// 2. Middleware that narrows context type
type Middleware<C> = (ctx: C, next: () => Promise<void>) => Promise<void>;

// 3. Typed middleware that adds auth fields
function authMiddleware<C extends BaseCtx>(
  validateToken: (path: string) => { userId: number; role: string } | null
): (ctx: C, next: () => Promise<void>) => Promise<WithAuth<C>> {
  return async (ctx, next) => {
    const auth = validateToken(ctx.path);
    if (!auth) { ctx.status = 401; return ctx as WithAuth<C>; }
    const enriched = Object.assign(ctx, auth) as WithAuth<C>;
    await next();
    return enriched;
  };
}

// 4. Pipeline builder that accumulates context types
class TypedPipeline<C extends BaseCtx> {
  private middlewares: Middleware<C>[] = [];
  use(mw: Middleware<C>): this { this.middlewares.push(mw); return this; }
  async run(ctx: C): Promise<C> {
    let i = -1;
    const dispatch = async (index: number): Promise<void> => {
      if (index <= i) throw new Error("next() called twice");
      i = index;
      if (index < this.middlewares.length) await this.middlewares[index](ctx, () => dispatch(index + 1));
    };
    await dispatch(0);
    return ctx;
  }
}

// 5. Nested router with typed context per route group
interface GroupCtx extends BaseCtx { groupPrefix: string; }
interface UserCtx extends GroupCtx { userId_: number; }
interface AdminCtx extends GroupCtx { adminId: number; permissions: string[]; }

// 6. Typed route group — applies shared middleware to a set of paths
class RouteGroup<C extends BaseCtx> {
  private middlewares: Middleware<C>[] = [];
  private routes: Array<{ method: string; path: RegExp; handler: Middleware<C> }> = [];
  use(mw: Middleware<C>): this { this.middlewares.push(mw); return this; }
  route(method: string, path: string, handler: Middleware<C>): this {
    const regex = new RegExp("^" + path.replace(/:([^/]+)/g, "([^/]+)") + "$");
    this.routes.push({ method, path: regex, handler });
    return this;
  }
  get(path: string, handler: Middleware<C>): this { return this.route("GET", path, handler); }
  post(path: string, handler: Middleware<C>): this { return this.route("POST", path, handler); }
  toMiddleware(): Middleware<C> {
    const groupMw = compose(this.middlewares);
    return async (ctx, next) => {
      const route = this.routes.find(r => r.method === ctx.method && r.path.test(ctx.path));
      if (!route) return next();
      return groupMw(ctx, () => route.handler(ctx, next));
    };
  }
}

function compose<C>(middlewares: Middleware<C>[]): Middleware<C> {
  return async (ctx, next) => {
    let i = -1;
    const dispatch = async (idx: number): Promise<void> => {
      if (idx <= i) throw new Error("next() called twice");
      i = idx;
      const fn = idx < middlewares.length ? middlewares[idx] : next;
      await fn(ctx, () => dispatch(idx + 1));
    };
    await dispatch(0);
  };
}

// 7. Nested route groups with shared middleware
class Application<C extends BaseCtx> {
  private globalMws: Middleware<C>[] = [];
  private groups: RouteGroup<C>[] = [];
  useGlobal(mw: Middleware<C>): this { this.globalMws.push(mw); return this; }
  group(setup: (g: RouteGroup<C>) => void): this {
    const g = new RouteGroup<C>();
    setup(g);
    this.groups.push(g);
    return this;
  }
  toMiddleware(): Middleware<C> {
    const groupMws = this.groups.map(g => g.toMiddleware());
    return compose([...this.globalMws, ...groupMws]);
  }
}

// 8. Context scoping — run middleware in isolated context copy
function isolated<C extends BaseCtx>(mw: Middleware<C>): Middleware<C> {
  return async (ctx, next) => {
    const copy = { ...ctx };
    await mw(copy, async () => {});
    await next();
  };
}

// 9. Typed middleware — adds computed field based on existing context
function computed<C extends BaseCtx, K extends string, V>(
  key: K,
  compute: (ctx: C) => V
): Middleware<C & Partial<Record<K, V>>> {
  return async (ctx, next) => {
    (ctx as Record<string, unknown>)[key] = compute(ctx);
    await next();
  };
}

// 10. Nested context with typed sub-objects
interface RequestMeta {
  userAgent?: string;
  ip?: string;
  referer?: string;
  acceptLanguage?: string;
}
interface ExtendedCtx extends BaseCtx { meta: RequestMeta; }
const metaExtractor: Middleware<ExtendedCtx> = async (ctx, next) => {
  ctx.meta = { userAgent: "Mozilla/5.0", ip: "127.0.0.1" };
  await next();
};

// 11. Middleware for hierarchical permissions
type Permission = "read" | "write" | "admin";
interface PermissionCtx extends BaseCtx { permissions: Permission[]; }
function requirePermission(permission: Permission): Middleware<PermissionCtx> {
  return async (ctx, next) => {
    if (!ctx.permissions.includes(permission)) {
      ctx.status = 403;
      return;
    }
    await next();
  };
}

// 12. Nested middleware chain with error boundary
class ErrorBoundary<C extends BaseCtx> {
  private errorHandlers: ((ctx: C, error: unknown) => Promise<void>)[] = [];
  catch(handler: (ctx: C, error: unknown) => Promise<void>): this {
    this.errorHandlers.push(handler);
    return this;
  }
  wrap(mw: Middleware<C>): Middleware<C> {
    return async (ctx, next) => {
      try {
        await mw(ctx, next);
      } catch (e) {
        for (const handler of this.errorHandlers) {
          try { await handler(ctx, e); return; } catch {}
        }
        throw e;
      }
    };
  }
}

// 13. Typed pipeline with measurement points
interface MeasureCtx extends BaseCtx { measurements: Map<string, number>; }
function measure<C extends MeasureCtx>(label: string): Middleware<C> {
  return async (ctx, next) => {
    const start = performance.now();
    await next();
    ctx.measurements.set(label, performance.now() - start);
  };
}

// 14. Nested middleware for request coalescing
const pending = new Map<string, Promise<void>>();
function coalesce<C extends BaseCtx>(keyFn: (ctx: C) => string): Middleware<C> {
  return async (ctx, next) => {
    const key = keyFn(ctx);
    if (pending.has(key)) { await pending.get(key); return; }
    const p = next().finally(() => pending.delete(key));
    pending.set(key, p);
    await p;
  };
}

// 15. Typed context validation middleware
function validateCtx<C extends BaseCtx>(
  checks: Array<{ field: keyof C; validator: (v: C[keyof C]) => boolean; error: string }>
): Middleware<C> {
  return async (ctx, next) => {
    for (const check of checks) {
      if (!check.validator(ctx[check.field])) {
        ctx.status = 400;
        return;
      }
    }
    await next();
  };
}

// 16. Middleware graph — resolve execution order via topological sort
interface MiddlewareNode<C extends BaseCtx> {
  name: string;
  middleware: Middleware<C>;
  after?: string[];
}
function resolveMiddlewareOrder<C extends BaseCtx>(nodes: MiddlewareNode<C>[]): Middleware<C>[] {
  const sorted: MiddlewareNode<C>[] = [];
  const visited = new Set<string>();
  const visit = (node: MiddlewareNode<C>) => {
    if (visited.has(node.name)) return;
    visited.add(node.name);
    for (const dep of node.after ?? []) {
      const depNode = nodes.find(n => n.name === dep);
      if (depNode) visit(depNode);
    }
    sorted.push(node);
  };
  nodes.forEach(visit);
  return sorted.map(n => n.middleware);
}

// 17. Typed middleware with dependency injection
interface Container { resolve<T>(token: string): T; }
function inject<C extends BaseCtx, T>(
  token: string,
  container: Container,
  factory: (service: T) => Middleware<C>
): Middleware<C> {
  const service = container.resolve<T>(token);
  return factory(service);
}

// 18. Multi-tenant middleware — resolves tenant from context
interface TenantCtx extends BaseCtx { tenantId: string; tenantConfig: Record<string, unknown>; }
function tenantResolver(
  getTenant: (path: string) => Promise<{ id: string; config: Record<string, unknown> } | null>
): Middleware<TenantCtx> {
  return async (ctx, next) => {
    const tenant = await getTenant(ctx.path);
    if (!tenant) { ctx.status = 404; return; }
    ctx.tenantId = tenant.id;
    ctx.tenantConfig = tenant.config;
    await next();
  };
}

// 19. Typed middleware for response shaping
interface ShapeCtx extends BaseCtx { body?: unknown; }
function shapeResponse<T, R>(transformer: (body: T) => R): Middleware<ShapeCtx> {
  return async (ctx, next) => {
    await next();
    if (ctx.body !== undefined) ctx.body = transformer(ctx.body as T);
  };
}

// 20. Pipeline with typed hooks (before/after each middleware)
type Hook<C extends BaseCtx> = (ctx: C, middlewareName: string, phase: "before" | "after") => void;
class HookedPipeline<C extends BaseCtx> {
  private middlewares: Array<{ name: string; fn: Middleware<C> }> = [];
  private hooks: Hook<C>[] = [];
  use(name: string, mw: Middleware<C>): this { this.middlewares.push({ name, fn: mw }); return this; }
  onEach(hook: Hook<C>): this { this.hooks.push(hook); return this; }
  async run(ctx: C): Promise<void> {
    let i = -1;
    const dispatch = async (index: number): Promise<void> => {
      if (index <= i) throw new Error("next() called twice");
      i = index;
      if (index >= this.middlewares.length) return;
      const { name, fn } = this.middlewares[index];
      this.hooks.forEach(h => h(ctx, name, "before"));
      await fn(ctx, () => dispatch(index + 1));
      this.hooks.forEach(h => h(ctx, name, "after"));
    };
    await dispatch(0);
  }
}

// 21. Typed middleware for file uploads
interface UploadCtx extends BaseCtx { files?: File[]; uploadedUrls?: string[]; }
function fileUploadMiddleware(uploadFn: (file: File) => Promise<string>): Middleware<UploadCtx> {
  return async (ctx, next) => {
    if (ctx.files?.length) {
      ctx.uploadedUrls = await Promise.all(ctx.files.map(uploadFn));
    }
    await next();
  };
}

// 22. Typed event sourcing middleware
interface EventCtx extends BaseCtx { events: Array<{ type: string; payload: unknown; at: number }>; }
function eventLogger<C extends EventCtx>(type: string): Middleware<C> {
  return async (ctx, next) => {
    ctx.events.push({ type: `${type}:request`, payload: { path: ctx.path, method: ctx.method }, at: Date.now() });
    await next();
    ctx.events.push({ type: `${type}:response`, payload: { status: ctx.status }, at: Date.now() });
  };
}

// 23. Middleware pipeline with typed state machine
type PipelineState = "idle" | "running" | "done" | "error";
class StatefulPipeline<C extends BaseCtx> {
  state: PipelineState = "idle";
  private pipeline: TypedPipeline<C>;
  constructor(middlewares: Middleware<C>[]) {
    this.pipeline = new TypedPipeline<C>();
    middlewares.forEach(m => this.pipeline.use(m));
  }
  async run(ctx: C): Promise<C> {
    this.state = "running";
    try {
      const result = await this.pipeline.run(ctx);
      this.state = "done";
      return result;
    } catch (e) {
      this.state = "error";
      throw e;
    }
  }
}

// 24. Typed response negotiation middleware
type ContentType = "application/json" | "text/html" | "text/xml";
interface NegotiableCtx extends BaseCtx { accept: ContentType; responseContentType?: ContentType; }
function negotiateContent<C extends NegotiableCtx>(
  renderers: Record<ContentType, (body: unknown) => unknown>
): Middleware<C> {
  return async (ctx, next) => {
    await next();
    const renderer = renderers[ctx.accept] ?? renderers["application/json"];
    ctx.responseContentType = ctx.accept;
    (ctx as { body?: unknown }).body = renderer((ctx as { body?: unknown }).body);
  };
}

// 25. Typed context locking (prevent mutation during async ops)
function withLock<C extends BaseCtx>(middleware: Middleware<C>): Middleware<C> {
  return async (ctx, next) => {
    const frozen = Object.freeze({ ...ctx }) as C;
    await middleware(frozen, next);
  };
}

// 26. Typed middleware composition with type-level tracking
type MiddlewareStack<C> = { _ctx: C };
function stack<C>(): MiddlewareStack<C> { return { _ctx: {} as C }; }
function addToStack<C, C2 extends C>(_s: MiddlewareStack<C>, _mw: Middleware<C2>): MiddlewareStack<C2> {
  return { _ctx: {} as C2 };
}

// 27. Conditional branching based on nested context
interface BranchCtx extends BaseCtx { isApi: boolean; isAdmin: boolean; }
function branches<C extends BranchCtx>(
  ...options: Array<{ when: (ctx: C) => boolean; then: Middleware<C> }>
): Middleware<C> {
  return async (ctx, next) => {
    for (const opt of options) {
      if (opt.when(ctx)) return opt.then(ctx, next);
    }
    return next();
  };
}

// 28. Typed middleware for streaming responses
interface StreamCtx extends BaseCtx { stream?: AsyncIterable<string>; }
function streamMiddleware<C extends StreamCtx>(
  generator: (ctx: C) => AsyncIterable<string>
): Middleware<C> {
  return async (ctx, next) => {
    await next();
    if (ctx.status === 200) ctx.stream = generator(ctx);
  };
}

// 29. Typed retry middleware with backoff
function retryWithBackoff<C extends BaseCtx>(
  maxRetries: number,
  shouldRetry: (ctx: C) => boolean,
  backoffMs: (attempt: number) => number
): Middleware<C> {
  return async (ctx, next) => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const ctxCopy = { ...ctx };
      await next.call(null);
      if (!shouldRetry(ctx) || attempt === maxRetries) return;
      Object.assign(ctx, ctxCopy);
      await new Promise(r => setTimeout(r, backoffMs(attempt)));
    }
  };
}

// 30. Typed middleware for request buffering
class RequestBuffer<C extends BaseCtx> {
  private buffer: C[] = [];
  private processing = false;
  middleware: Middleware<C>;
  constructor(private handler: (items: C[]) => Promise<void>, private flushInterval: number) {
    this.middleware = async (ctx, next) => {
      this.buffer.push(ctx);
      await next();
    };
    setInterval(() => this.flush(), flushInterval);
  }
  private async flush(): Promise<void> {
    if (this.processing || !this.buffer.length) return;
    this.processing = true;
    const batch = this.buffer.splice(0);
    await this.handler(batch);
    this.processing = false;
  }
}

// 31. Typed middleware chain with priority
class PriorityChain<C extends BaseCtx> {
  private middlewares: Array<{ priority: number; fn: Middleware<C> }> = [];
  add(priority: number, fn: Middleware<C>): this {
    this.middlewares.push({ priority, fn });
    this.middlewares.sort((a, b) => a.priority - b.priority);
    return this;
  }
  build(): Middleware<C> { return compose(this.middlewares.map(m => m.fn)); }
}

// 32. Typed pub/sub middleware integration
interface PubSubCtx extends BaseCtx { published: string[]; }
type Publisher = { publish(channel: string, data: unknown): void };
function pubSubMiddleware<C extends PubSubCtx>(
  publisher: Publisher,
  channel: (ctx: C) => string
): Middleware<C> {
  return async (ctx, next) => {
    ctx.published = [];
    await next();
    const ch = channel(ctx);
    publisher.publish(ch, { path: ctx.path, status: ctx.status });
    ctx.published.push(ch);
  };
}

// 33. Typed middleware that converts HTTP errors to domain errors
class DomainError extends Error { constructor(public code: string, message: string) { super(message); } }
function httpToDomain<C extends BaseCtx>(
  mapping: Record<number, (ctx: C) => DomainError>
): Middleware<C> {
  return async (ctx, next) => {
    await next();
    const converter = mapping[ctx.status];
    if (converter) throw converter(ctx);
  };
}

// 34. Middleware pipeline visualization
interface PipelineVisualization {
  nodes: Array<{ name: string; type: "middleware" | "branch" | "compose" }>;
  edges: Array<{ from: string; to: string }>;
}
function visualizePipeline<C extends BaseCtx>(
  middlewares: Array<{ name: string; fn: Middleware<C> }>
): PipelineVisualization {
  return {
    nodes: middlewares.map(m => ({ name: m.name, type: "middleware" })),
    edges: middlewares.slice(0, -1).map((m, i) => ({ from: m.name, to: middlewares[i + 1].name })),
  };
}

// 35. Typed lambda-style middleware (AWS Lambda proxy style)
interface LambdaCtx { path: string; method: string; headers: Record<string, string>; body?: string; statusCode: number; responseBody?: string; }
type LambdaMiddleware = (ctx: LambdaCtx, next: () => Promise<void>) => Promise<void>;

const lambdaLogger: LambdaMiddleware = async (ctx, next) => {
  console.log(`[Lambda] ${ctx.method} ${ctx.path}`);
  await next();
};

// 36. Typed context pool — reuse context objects
class ContextPool<C extends BaseCtx> {
  private pool: C[] = [];
  constructor(private factory: () => C, private size: number) {
    for (let i = 0; i < size; i++) this.pool.push(factory());
  }
  acquire(): C { return this.pool.pop() ?? this.factory(); }
  release(ctx: C): void { if (this.pool.length < this.size) this.pool.push(ctx); }
}

// 37. Middleware pipeline testing utilities
interface TestRequest { path: string; method: string; headers?: Record<string, string>; body?: unknown; }
interface TestResponse { status: number; body?: unknown; headers?: Record<string, string>; }
async function testPipeline<C extends BaseCtx>(
  pipeline: TypedPipeline<C>,
  request: TestRequest,
  ctx: C
): Promise<TestResponse> {
  Object.assign(ctx, request);
  await pipeline.run(ctx);
  return { status: ctx.status };
}

// 38. Typed plugin system with typed slots
type PluginSlot = "auth" | "logging" | "caching" | "error" | "compression";
interface TypedPlugin<C extends BaseCtx> {
  slot: PluginSlot;
  order: number;
  middleware: Middleware<C>;
}
class PluginRunner<C extends BaseCtx> {
  private plugins: TypedPlugin<C>[] = [];
  install(plugin: TypedPlugin<C>): void { this.plugins.push(plugin); }
  buildSlot(slot: PluginSlot): Middleware<C> {
    const sorted = this.plugins
      .filter(p => p.slot === slot)
      .sort((a, b) => a.order - b.order);
    return compose(sorted.map(p => p.middleware));
  }
  buildAll(): Middleware<C> {
    const order: PluginSlot[] = ["auth", "logging", "caching", "compression", "error"];
    return compose(order.map(slot => this.buildSlot(slot)));
  }
}

// 39. Type-safe context diff (before/after middleware)
function diffContext<C extends BaseCtx>(before: C, after: C): Partial<C> {
  const diff: Partial<C> = {};
  for (const key of Object.keys(after) as (keyof C)[]) {
    if (before[key] !== after[key]) diff[key] = after[key];
  }
  return diff;
}

// 40. Middleware that applies transformations to all responses
function globalTransform<C extends BaseCtx>(
  transform: (ctx: C) => void
): Middleware<C> {
  return async (ctx, next) => {
    await next();
    transform(ctx);
  };
}

// 41. Typed hot-reloadable middleware
class HotReloadableMiddleware<C extends BaseCtx> {
  private current: Middleware<C>;
  constructor(initial: Middleware<C>) { this.current = initial; }
  reload(next: Middleware<C>): void { this.current = next; }
  readonly middleware: Middleware<C> = async (ctx, next) => this.current(ctx, next);
}

// 42. Typed per-route middleware overrides
interface RouteConfig<C extends BaseCtx> {
  path: string;
  method: string;
  overrideMiddlewares?: Middleware<C>[];
}
function routeOverrides<C extends BaseCtx>(
  routes: RouteConfig<C>[],
  defaultPipeline: Middleware<C>
): Middleware<C> {
  return async (ctx, next) => {
    const route = routes.find(r => r.path === ctx.path && r.method === ctx.method);
    if (route?.overrideMiddlewares) return compose(route.overrideMiddlewares)(ctx, next);
    return defaultPipeline(ctx, next);
  };
}

// 43. Typed middleware — accumulate side effects
interface SideEffectCtx extends BaseCtx { sideEffects: Array<() => Promise<void>>; }
const collectEffects: Middleware<SideEffectCtx> = async (ctx, next) => {
  ctx.sideEffects = [];
  await next();
  await Promise.all(ctx.sideEffects.map(fn => fn()));
};

// 44. Typed context narrowing middleware
function narrowCtx<C extends BaseCtx, N extends C>(
  guard: (ctx: C) => ctx is N,
  middleware: Middleware<N>
): Middleware<C> {
  return async (ctx, next) => {
    if (guard(ctx)) return middleware(ctx, next);
    return next();
  };
}

// 45. Typed request replay middleware
class RequestReplayer<C extends BaseCtx> {
  private history: C[] = [];
  middleware: Middleware<C> = async (ctx, next) => {
    this.history.push({ ...ctx });
    await next();
  };
  async replay(pipeline: Middleware<C>): Promise<void> {
    for (const ctx of this.history) await pipeline({ ...ctx }, async () => {});
  }
}

// 46. Typed middlewares for A/B testing
interface ABCtx extends BaseCtx { variant: "control" | "treatment"; }
function abTestMiddleware<C extends ABCtx>(ratio: number): Middleware<C> {
  return async (ctx, next) => {
    ctx.variant = Math.random() < ratio ? "treatment" : "control";
    await next();
  };
}

// 47. Nested typed request limiting by resource
class ResourceLimiter<C extends BaseCtx & { resource: string }> {
  private counts = new Map<string, number>();
  middleware(max: number): Middleware<C> {
    return async (ctx, next) => {
      const count = this.counts.get(ctx.resource) ?? 0;
      if (count >= max) { ctx.status = 429; return; }
      this.counts.set(ctx.resource, count + 1);
      try { await next(); }
      finally { this.counts.set(ctx.resource, (this.counts.get(ctx.resource) ?? 1) - 1); }
    };
  }
}

// 48. Typed middleware for response pagination headers
interface PaginationCtx extends BaseCtx { pagination?: { page: number; perPage: number; total: number }; headers: Record<string, string>; }
const paginationHeaders: Middleware<PaginationCtx> = async (ctx, next) => {
  await next();
  if (ctx.pagination) {
    ctx.headers["X-Total-Count"] = String(ctx.pagination.total);
    ctx.headers["X-Page"] = String(ctx.pagination.page);
    ctx.headers["X-Per-Page"] = String(ctx.pagination.perPage);
    ctx.headers["X-Total-Pages"] = String(Math.ceil(ctx.pagination.total / ctx.pagination.perPage));
  }
};

// 49. Typed middleware pipeline composition operators
function pipe<C extends BaseCtx>(...mws: Middleware<C>[]): Middleware<C> { return compose(mws); }
function concurrent<C extends BaseCtx>(...mws: Middleware<C>[]): Middleware<C> {
  return async (ctx, next) => {
    await Promise.all(mws.map(mw => mw({ ...ctx }, async () => {})));
    await next();
  };
}
function race<C extends BaseCtx>(...mws: Middleware<C>[]): Middleware<C> {
  return async (ctx, next) => {
    await Promise.race(mws.map(mw => mw({ ...ctx }, async () => {})));
    await next();
  };
}

// 50. Full typed application stack example
interface AppCtx extends BaseCtx {
  headers: Record<string, string>;
  body?: unknown;
  requestId: string;
  userId?: number;
  role?: string;
}

const requestIdMw: Middleware<AppCtx> = async (ctx, next) => {
  ctx.requestId = Math.random().toString(36).slice(2);
  await next();
};
const corsHeaders: Middleware<AppCtx> = async (ctx, next) => {
  await next();
  ctx.headers["Access-Control-Allow-Origin"] = "*";
};
const globalErrorHandler: Middleware<AppCtx> = async (ctx, next) => {
  try { await next(); }
  catch (e) { ctx.status = 500; ctx.body = { error: String(e) }; }
};

const appPipeline = pipe<AppCtx>(requestIdMw, corsHeaders, globalErrorHandler);
