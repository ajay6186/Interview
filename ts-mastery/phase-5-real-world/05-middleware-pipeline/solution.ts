// ============================================================================
// Solution 5.5 — Type-Safe Middleware Pipeline
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// Base context
// ---------------------------------------------------------------------------

interface BaseContext {
  path: string;
  method: string;
}

// ---------------------------------------------------------------------------
// Pipeline implementation
// ---------------------------------------------------------------------------

class Pipeline<Ctx extends BaseContext = BaseContext> {
  private middlewares: ((ctx: any) => any)[] = [];

  private constructor(middlewares: ((ctx: any) => any)[]) {
    this.middlewares = middlewares;
  }

  static create(): Pipeline<BaseContext> {
    return new Pipeline([]);
  }

  use<NewCtx extends BaseContext>(
    mw: (ctx: Ctx) => NewCtx
  ): Pipeline<NewCtx> {
    return new Pipeline<NewCtx>([...this.middlewares, mw]);
  }

  run(ctx: BaseContext): Ctx {
    let result: any = ctx;
    for (const mw of this.middlewares) {
      result = mw(result);
    }
    return result;
  }
}

// Also provide a simpler constructor:
function createPipeline(): Pipeline<BaseContext> {
  return Pipeline.create();
}

// Alternate simple class version (matching exercise API):
class SimplePipeline<Ctx extends BaseContext = BaseContext> {
  private middlewares: ((ctx: any) => any)[];

  constructor(middlewares: ((ctx: any) => any)[] = []) {
    this.middlewares = middlewares;
  }

  use<NewCtx extends BaseContext>(
    mw: (ctx: Ctx) => NewCtx
  ): SimplePipeline<NewCtx> {
    return new SimplePipeline<NewCtx>([...this.middlewares, mw]);
  }

  run(ctx: BaseContext): Ctx {
    let result: any = ctx;
    for (const mw of this.middlewares) {
      result = mw(result);
    }
    return result;
  }
}

// ---------------------------------------------------------------------------
// Middleware functions
// ---------------------------------------------------------------------------

function authMiddleware(ctx: BaseContext) {
  return { ...ctx, userId: "user-123", isAuthenticated: true as const };
}

function loggerMiddleware<T extends BaseContext>(ctx: T) {
  return { ...ctx, logged: true as const };
}

function timingMiddleware<T extends BaseContext>(ctx: T) {
  return { ...ctx, startTime: Date.now() };
}

// ---------------------------------------------------------------------------
// Runtime tests
// ---------------------------------------------------------------------------

const pipeline = new SimplePipeline()
  .use(authMiddleware)
  .use(loggerMiddleware)
  .use(timingMiddleware);

const result = pipeline.run({ path: "/api/users", method: "GET" });

console.assert(result.userId === "user-123", "has userId");
console.assert(result.isAuthenticated === true, "is authenticated");
console.assert(result.logged === true, "is logged");
console.assert(typeof result.startTime === "number", "has startTime");
console.assert(result.path === "/api/users", "preserved path");
console.assert(result.method === "GET", "preserved method");

console.log("Solution 5.5 — All assertions passed!");

export {};
