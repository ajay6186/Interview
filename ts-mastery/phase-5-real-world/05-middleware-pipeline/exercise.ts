// ============================================================================
// Exercise 5.5 — Type-Safe Middleware Pipeline
// ============================================================================
// Build an Express-like middleware pipeline where each middleware can add
// typed properties to the context object.
//
// Instructions: Fill in every TODO so the file compiles and all assertions pass.
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
// TODO: Define Middleware type
// A middleware takes a context and returns an extended context
// ---------------------------------------------------------------------------

// type Middleware<In, Out extends In> = (ctx: In) => Out;

// ---------------------------------------------------------------------------
// TODO: Implement Pipeline class
// ---------------------------------------------------------------------------

// The pipeline should:
// - Start with BaseContext
// - Allow adding middleware that extends the context
// - Track the accumulated context type through the chain
// - Have a `run(ctx: BaseContext)` method that returns the final context

class Pipeline<Ctx extends BaseContext = BaseContext> {
  // TODO: store middleware functions

  // TODO: use<NewCtx>(mw: (ctx: Ctx) => NewCtx): Pipeline<NewCtx>

  // TODO: run(ctx: BaseContext): Ctx
}

// ---------------------------------------------------------------------------
// Example middleware functions (uncomment after implementing)
// ---------------------------------------------------------------------------

/*
function authMiddleware(ctx: BaseContext) {
  return { ...ctx, userId: "user-123", isAuthenticated: true as const };
}

function loggerMiddleware<T extends BaseContext>(ctx: T) {
  console.log(`${ctx.method} ${ctx.path}`);
  return { ...ctx, logged: true as const };
}

function timingMiddleware<T extends BaseContext>(ctx: T) {
  return { ...ctx, startTime: Date.now() };
}
*/

// ---------------------------------------------------------------------------
// Runtime tests (uncomment after implementing)
// ---------------------------------------------------------------------------

/*
const pipeline = new Pipeline()
  .use(authMiddleware)
  .use(loggerMiddleware)
  .use(timingMiddleware);

const result = pipeline.run({ path: "/api/users", method: "GET" });

console.assert(result.userId === "user-123", "has userId");
console.assert(result.isAuthenticated === true, "is authenticated");
console.assert(result.logged === true, "is logged");
console.assert(typeof result.startTime === "number", "has startTime");
console.assert(result.path === "/api/users", "preserved path");
*/

console.log("Exercise 5.5 — All assertions passed!");

export {};
