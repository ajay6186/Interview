// Examples 5.4 — Error Handling
"use strict";

// ─── BASIC (ex01–ex13) ────────────────────────────────────────────────────────

/** @example ex01 — try/catch basic */
function ex01() {
  function divide(a, b) {
    if (b === 0) throw new Error("Division by zero");
    return a / b;
  }
  try {
    console.log("ex01 divide:", divide(10, 2));
    console.log("ex01 divide by zero:", divide(5, 0));
  } catch (e) {
    console.log("ex01 caught:", e.message);
  }
}

/** @example ex02 — finally block */
function ex02() {
  function withResource(fn) {
    const resource = { id: 42, closed: false };
    try {
      return fn(resource);
    } finally {
      resource.closed = true;
      console.log("ex02 finally: resource closed:", resource.closed);
    }
  }
  const result = withResource((r) => r.id * 2);
  console.log("ex02 result:", result);
}

/** @example ex03 — Rethrowing errors */
function ex03() {
  class DatabaseError extends Error { constructor(msg) { super(msg); this.name = "DatabaseError"; } }
  function fetchUser(id) { throw new DatabaseError("Connection timeout"); }
  function getUser(id) {
    try {
      return fetchUser(id);
    } catch (e) {
      if (e instanceof DatabaseError) throw e; // rethrow database errors
      throw new Error(`Unexpected error: ${e.message}`); // wrap others
    }
  }
  try { getUser(1); } catch (e) { console.log("ex03 rethrown:", e.name, e.message); }
}

/** @example ex04 — Error properties (message, name, stack) */
function ex04() {
  try {
    null.property;
  } catch (e) {
    console.log("ex04 error name:", e.name);
    console.log("ex04 error message:", e.message);
    console.log("ex04 has stack:", typeof e.stack === "string");
  }
}

/** @example ex05 — Custom error class */
function ex05() {
  class HttpError extends Error {
    constructor(statusCode, message) {
      super(message);
      this.name = "HttpError";
      this.statusCode = statusCode;
    }
    toString() { return `${this.name} [${this.statusCode}]: ${this.message}`; }
  }
  const err = new HttpError(404, "Not Found");
  console.log("ex05 custom error:", err.toString(), "instanceof Error:", err instanceof Error);
}

/** @example ex06 — Extending custom error */
function ex06() {
  class AppError extends Error {
    constructor(message, code) { super(message); this.name = "AppError"; this.code = code; }
  }
  class AuthError extends AppError {
    constructor(message) { super(message, "AUTH"); this.name = "AuthError"; }
  }
  const e = new AuthError("Unauthorized");
  console.log("ex06 error hierarchy:", e instanceof Error, e instanceof AppError, e instanceof AuthError, e.code, e.name);
}

/** @example ex07 — error instanceof checks */
function ex07() {
  class ValidationError extends Error { constructor(msg, field) { super(msg); this.name = "ValidationError"; this.field = field; } }
  class NotFoundError extends Error { constructor(msg) { super(msg); this.name = "NotFoundError"; } }
  function handleError(e) {
    if (e instanceof ValidationError) return `Validation failed on field "${e.field}": ${e.message}`;
    if (e instanceof NotFoundError) return `Not found: ${e.message}`;
    return `Unknown error: ${e.message}`;
  }
  console.log("ex07 instanceof dispatch:", handleError(new ValidationError("required", "email")));
  console.log("ex07 instanceof dispatch:", handleError(new NotFoundError("user#42")));
}

/** @example ex08 — Error.cause (chaining) */
function ex08() {
  function fetchData() { throw new TypeError("network failure"); }
  function loadUser(id) {
    try { return fetchData(); }
    catch (e) { throw new Error(`Failed to load user ${id}`, { cause: e }); }
  }
  try {
    loadUser(1);
  } catch (e) {
    console.log("ex08 outer error:", e.message);
    console.log("ex08 cause:", e.cause && e.cause.message);
  }
}

/** @example ex09 — TypeError */
function ex09() {
  function strictAdd(a, b) {
    if (typeof a !== "number" || typeof b !== "number") throw new TypeError(`Expected numbers, got ${typeof a} and ${typeof b}`);
    return a + b;
  }
  try { strictAdd("1", 2); } catch (e) { console.log("ex09 TypeError:", e.name, e.message); }
  console.log("ex09 valid:", strictAdd(3, 4));
}

/** @example ex10 — RangeError */
function ex10() {
  function clamp(val, min, max) {
    if (min > max) throw new RangeError(`min (${min}) cannot exceed max (${max})`);
    return Math.min(Math.max(val, min), max);
  }
  try { clamp(5, 10, 1); } catch (e) { console.log("ex10 RangeError:", e.name, e.message); }
  console.log("ex10 clamp:", clamp(150, 0, 100));
}

/** @example ex11 — SyntaxError-like custom parsing error */
function ex11() {
  class ParseError extends SyntaxError {
    constructor(message, line, col) {
      super(message);
      this.name = "ParseError";
      this.line = line;
      this.col = col;
    }
    toString() { return `${this.name} at ${this.line}:${this.col} — ${this.message}`; }
  }
  try {
    throw new ParseError("Unexpected token '}'", 42, 15);
  } catch (e) {
    console.log("ex11 parse error:", e.toString(), "instanceof SyntaxError:", e instanceof SyntaxError);
  }
}

/** @example ex12 — Async error handling with try/catch + async/await */
function ex12() {
  async function fetchUser(id) {
    await new Promise(r => setTimeout(r, 0));
    if (id < 0) throw new RangeError("ID must be positive");
    return { id, name: "Alice" };
  }
  async function run() {
    try {
      const user = await fetchUser(-1);
      console.log("ex12 user:", user);
    } catch (e) {
      console.log("ex12 async caught:", e.name, e.message);
    }
    const user = await fetchUser(1);
    console.log("ex12 valid user:", user);
  }
  run();
}

/** @example ex13 — Unhandled rejection handling concept */
function ex13() {
  // In Node.js, unhandledRejection event; in browser, unhandledrejection
  // Here we show the pattern of always catching promises
  function riskyOperation(fail) {
    return new Promise((resolve, reject) => {
      setTimeout(() => fail ? reject(new Error("operation failed")) : resolve("success"), 0);
    });
  }
  riskyOperation(true)
    .then(result => console.log("ex13 ok:", result))
    .catch(e => console.log("ex13 promise caught:", e.message));
  riskyOperation(false)
    .then(result => console.log("ex13 ok:", result))
    .catch(e => console.log("ex13 never:", e.message));
}

// ─── INTERMEDIATE (ex14–ex26) ─────────────────────────────────────────────────

/** @example ex14 — ValidationError with multiple fields */
function ex14() {
  class ValidationError extends Error {
    constructor(errors) {
      super("Validation failed");
      this.name = "ValidationError";
      this.errors = errors;
    }
    toString() { return `${this.name}: ${this.errors.map(e => `${e.field}: ${e.message}`).join(", ")}`; }
  }
  function validateUser(data) {
    const errors = [];
    if (!data.name) errors.push({ field: "name", message: "required" });
    if (!data.email || !data.email.includes("@")) errors.push({ field: "email", message: "invalid email" });
    if (data.age < 0 || data.age > 150) errors.push({ field: "age", message: "out of range" });
    if (errors.length) throw new ValidationError(errors);
    return true;
  }
  try {
    validateUser({ name: "", email: "not-email", age: -5 });
  } catch (e) {
    console.log("ex14 multi-field validation:", e.toString());
  }
}

/** @example ex15 — NotFoundError */
function ex15() {
  class NotFoundError extends Error {
    constructor(resource, id) {
      super(`${resource} with id ${id} not found`);
      this.name = "NotFoundError";
      this.resource = resource;
      this.id = id;
    }
  }
  const db = new Map([[1, { id: 1, name: "Alice" }]]);
  function findUser(id) {
    const user = db.get(id);
    if (!user) throw new NotFoundError("User", id);
    return user;
  }
  try { findUser(999); } catch (e) { console.log("ex15 not found:", e.name, e.message, e.resource, e.id); }
  console.log("ex15 found:", findUser(1));
}

/** @example ex16 — NetworkError with retry logic */
function ex16() {
  class NetworkError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.name = "NetworkError";
      this.statusCode = statusCode;
      this.retryable = statusCode >= 500 || statusCode === 429;
    }
  }
  async function fetchWithRetry(url, maxRetries = 3) {
    let attempts = 0;
    async function attempt() {
      attempts++;
      if (attempts < 3) throw new NetworkError("Service Unavailable", 503);
      return { data: "success", attempts };
    }
    for (let i = 0; i < maxRetries; i++) {
      try { return await attempt(); }
      catch (e) { if (!e.retryable || i === maxRetries - 1) throw e; }
    }
  }
  fetchWithRetry("/api/data").then(r => console.log("ex16 network retry result:", r));
}

/** @example ex17 — Error wrapping */
function ex17() {
  function wrap(error, context) {
    const wrapped = new Error(`${context}: ${error.message}`);
    wrapped.name = "WrappedError";
    wrapped.original = error;
    wrapped.context = context;
    return wrapped;
  }
  function parseConfig(raw) {
    try { return JSON.parse(raw); }
    catch (e) { throw wrap(e, "parseConfig"); }
  }
  try { parseConfig("{invalid json}"); }
  catch (e) { console.log("ex17 wrapped error:", e.name, e.context, "original:", e.original.name); }
}

/** @example ex18 — Error chain (cause chain) */
function ex18() {
  function level3() { throw new Error("low-level failure"); }
  function level2() {
    try { level3(); } catch (e) { throw new Error("mid-level failure", { cause: e }); }
  }
  function level1() {
    try { level2(); } catch (e) { throw new Error("high-level failure", { cause: e }); }
  }
  function printChain(err, depth = 0) {
    console.log("ex18 " + "  ".repeat(depth) + err.message);
    if (err.cause) printChain(err.cause, depth + 1);
  }
  try { level1(); } catch (e) { printChain(e); }
}

/** @example ex19 — Safe division (no throw) */
function ex19() {
  function safeDivide(a, b) {
    if (b === 0) return { ok: false, error: new Error("Division by zero") };
    if (typeof a !== "number" || typeof b !== "number") return { ok: false, error: new TypeError("Not a number") };
    return { ok: true, value: a / b };
  }
  const r1 = safeDivide(10, 2);
  const r2 = safeDivide(10, 0);
  console.log("ex19 safe divide:", r1, r2);
  if (r1.ok) console.log("ex19 result:", r1.value);
  if (!r2.ok) console.log("ex19 error:", r2.error.message);
}

/** @example ex20 — Result type (Ok/Err) */
function ex20() {
  const Result = {
    ok: (value) => ({ ok: true, value, map: (fn) => Result.ok(fn(value)), flatMap: (fn) => fn(value), getOrElse: () => value }),
    err: (error) => ({ ok: false, error, map: () => Result.err(error), flatMap: () => Result.err(error), getOrElse: (def) => def }),
  };
  function parseNumber(s) {
    const n = Number(s);
    return isNaN(n) ? Result.err(new Error(`"${s}" is not a number`)) : Result.ok(n);
  }
  const r1 = parseNumber("42").map(n => n * 2);
  const r2 = parseNumber("abc").map(n => n * 2);
  console.log("ex20 Result type:", r1.value, r2.error.message, r2.getOrElse(0));
}

/** @example ex21 — Maybe/Option type */
function ex21() {
  const Maybe = {
    just: (value) => ({
      isNothing: false,
      value,
      map: (fn) => Maybe.just(fn(value)),
      flatMap: (fn) => fn(value),
      getOrElse: () => value,
    }),
    nothing: () => ({
      isNothing: true,
      map: () => Maybe.nothing(),
      flatMap: () => Maybe.nothing(),
      getOrElse: (def) => def,
    }),
    fromNullable: (v) => v == null ? Maybe.nothing() : Maybe.just(v),
  };
  const users = new Map([[1, { id: 1, name: "Alice", address: { city: "NYC" } }]]);
  const getCity = (id) =>
    Maybe.fromNullable(users.get(id))
      .flatMap(u => Maybe.fromNullable(u.address))
      .map(addr => addr.city)
      .getOrElse("Unknown");
  console.log("ex21 Maybe:", getCity(1), getCity(999));
}

/** @example ex22 — Either pattern */
function ex22() {
  const Either = {
    right: (value) => ({ isRight: true, value, map: (fn) => Either.right(fn(value)), mapLeft: () => Either.right(value), fold: (_, r) => r(value) }),
    left: (value) => ({ isRight: false, value, map: () => Either.left(value), mapLeft: (fn) => Either.left(fn(value)), fold: (l, _) => l(value) }),
  };
  function parseAge(s) {
    const n = parseInt(s, 10);
    if (isNaN(n)) return Either.left(`"${s}" is not a valid age`);
    if (n < 0 || n > 150) return Either.left(`${n} is out of range`);
    return Either.right(n);
  }
  const result1 = parseAge("25").map(n => `Age: ${n}`).fold(e => `Error: ${e}`, v => v);
  const result2 = parseAge("-5").map(n => `Age: ${n}`).fold(e => `Error: ${e}`, v => v);
  console.log("ex22 Either:", result1, result2);
}

/** @example ex23 — try-catch as value */
function ex23() {
  function tryCatch(fn) {
    try { return { tag: "right", value: fn() }; }
    catch (e) { return { tag: "left", error: e }; }
  }
  const r1 = tryCatch(() => JSON.parse('{"valid":true}'));
  const r2 = tryCatch(() => JSON.parse("{bad json}"));
  console.log("ex23 try-catch as value:", r1.tag, r1.value, r2.tag, r2.error.name);
}

/** @example ex24 — Async error boundary pattern */
function ex24() {
  function withErrorBoundary(fn, onError) {
    return async function(...args) {
      try {
        return await fn(...args);
      } catch (e) {
        return onError(e, args);
      }
    };
  }
  const safeFetch = withErrorBoundary(
    async (url) => {
      if (url.includes("bad")) throw new Error("Network error");
      return { url, data: "ok" };
    },
    (e, [url]) => ({ url, data: null, error: e.message }),
  );
  Promise.all([safeFetch("/api/good"), safeFetch("/api/bad")]).then(results => {
    console.log("ex24 error boundary:", results);
  });
}

/** @example ex25 — Error aggregation */
function ex25() {
  class AggregateError extends Error {
    constructor(errors, message = "Multiple errors occurred") {
      super(message);
      this.name = "AggregateError";
      this.errors = errors;
    }
    toString() { return `${this.name}: [${this.errors.map(e => e.message).join(", ")}]`; }
  }
  async function validateAll(data) {
    const checks = [
      () => { if (!data.name) throw new Error("name required"); },
      () => { if (!data.email) throw new Error("email required"); },
      () => { if (!data.age || data.age < 18) throw new Error("must be 18+"); },
    ];
    const errors = [];
    for (const check of checks) {
      try { check(); } catch (e) { errors.push(e); }
    }
    if (errors.length) throw new AggregateError(errors);
  }
  validateAll({ name: "", email: "", age: 16 })
    .catch(e => console.log("ex25 aggregate error:", e.toString()));
}

/** @example ex26 — Partial failure handling */
function ex26() {
  async function processItems(items, processor) {
    const results = await Promise.allSettled(items.map(item => processor(item)));
    const succeeded = results.filter(r => r.status === "fulfilled").map(r => r.value);
    const failed = results.filter(r => r.status === "rejected").map(r => r.reason.message);
    return { succeeded, failed, total: items.length };
  }
  const items = [1, 2, 3, 4, 5];
  processItems(items, async (n) => {
    if (n % 2 === 0) throw new Error(`Failed for ${n}`);
    return n * 10;
  }).then(r => console.log("ex26 partial failure:", r));
}

// ─── NESTED (ex27–ex38) ───────────────────────────────────────────────────────

/** @example ex27 — Retry with error check */
function ex27() {
  let callCount = 0;
  async function unstableOperation() {
    callCount++;
    if (callCount < 3) throw Object.assign(new Error("Transient error"), { retryable: true });
    return { result: "success", attempts: callCount };
  }
  async function retry(fn, { maxAttempts = 3, delay = 0, shouldRetry = (e) => e.retryable } = {}) {
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try { return await fn(); }
      catch (e) {
        lastError = e;
        if (!shouldRetry(e) || attempt === maxAttempts) throw e;
        if (delay > 0) await new Promise(r => setTimeout(r, delay));
      }
    }
    throw lastError;
  }
  retry(unstableOperation).then(r => console.log("ex27 retry result:", r));
}

/** @example ex28 — Circuit breaker */
function ex28() {
  function createCircuitBreaker(fn, { threshold = 3, resetTimeout = 100 } = {}) {
    let failures = 0;
    let state = "closed"; // closed, open, half-open
    let lastFailureTime = null;
    return async function(...args) {
      if (state === "open") {
        if (Date.now() - lastFailureTime > resetTimeout) state = "half-open";
        else throw new Error("Circuit breaker is OPEN");
      }
      try {
        const result = await fn(...args);
        if (state === "half-open") { state = "closed"; failures = 0; }
        return result;
      } catch (e) {
        failures++;
        lastFailureTime = Date.now();
        if (failures >= threshold) state = "open";
        throw e;
      }
    };
  }
  let count = 0;
  const breaker = createCircuitBreaker(async () => { count++; if (count <= 3) throw new Error("Service down"); return "ok"; }, { threshold: 3 });
  async function run() {
    for (let i = 0; i < 5; i++) {
      try { await breaker(); } catch (e) { console.log(`ex28 circuit breaker [${i+1}]:`, e.message); }
    }
  }
  run();
}

/** @example ex29 — Fallback pattern */
function ex29() {
  async function withFallback(primary, fallback) {
    try { return { source: "primary", data: await primary() }; }
    catch (primaryError) {
      console.log("ex29 primary failed:", primaryError.message, "trying fallback...");
      try { return { source: "fallback", data: await fallback() }; }
      catch (fallbackError) {
        throw new AggregateError(
          [primaryError, fallbackError],
          "Both primary and fallback failed",
        );
      }
    }
  }
  class AggregateError extends Error { constructor(errs, msg) { super(msg); this.errors = errs; } }
  const primaryFetch = async () => { throw new Error("Primary DB offline"); };
  const fallbackFetch = async () => ({ users: [{ id: 1, name: "Alice" }] });
  withFallback(primaryFetch, fallbackFetch).then(r => console.log("ex29 fallback result:", r));
}

/** @example ex30 — Error telemetry concept */
function ex30() {
  const ErrorTracker = (() => {
    const log = [];
    return {
      capture(error, context = {}) {
        log.push({
          message: error.message,
          name: error.name,
          timestamp: new Date("2026-01-01").toISOString(),
          context,
        });
      },
      getLog() { return [...log]; },
      summary() {
        const byName = {};
        log.forEach(e => { byName[e.name] = (byName[e.name] || 0) + 1; });
        return byName;
      },
    };
  })();
  ErrorTracker.capture(new TypeError("Expected string"), { userId: 42, route: "/api/user" });
  ErrorTracker.capture(new RangeError("Index out of bounds"), { component: "Table" });
  ErrorTracker.capture(new TypeError("Cannot read property"), { userId: 99 });
  console.log("ex30 error telemetry:", ErrorTracker.summary(), "total:", ErrorTracker.getLog().length);
}

/** @example ex31 — Structured logging with errors */
function ex31() {
  function createLogger(service) {
    return {
      error(message, error, metadata = {}) {
        const entry = {
          level: "error",
          service,
          message,
          error: { name: error.name, message: error.message, code: error.code },
          timestamp: new Date("2026-01-01").toISOString(),
          ...metadata,
        };
        console.log("ex31 structured log:", JSON.stringify(entry));
      },
      warn(message, metadata) {
        console.log("ex31 warn:", JSON.stringify({ level: "warn", service, message, ...metadata }));
      },
    };
  }
  const logger = createLogger("user-service");
  try { JSON.parse("{bad}"); }
  catch (e) { logger.error("Failed to parse user data", e, { userId: 123, operation: "parseUser" }); }
}

/** @example ex32 — Distributed tracing concept */
function ex32() {
  function createTracer(serviceName) {
    const spans = [];
    function startSpan(name, parentId = null) {
      const span = { id: `span-${spans.length + 1}`, name, serviceName, parentId, startTime: Date.now(), tags: {}, errors: [] };
      spans.push(span);
      return {
        setTag(key, value) { span.tags[key] = value; return this; },
        recordError(e) { span.errors.push({ message: e.message, name: e.name }); return this; },
        finish() { span.duration = Date.now() - span.startTime; return span; },
      };
    }
    return { startSpan, getSpans: () => [...spans] };
  }
  const tracer = createTracer("api-gateway");
  const rootSpan = tracer.startSpan("processRequest");
  rootSpan.setTag("http.method", "POST").setTag("http.url", "/api/users");
  try {
    const childSpan = tracer.startSpan("validateInput", rootSpan.id);
    throw new Error("Validation failed");
  } catch (e) {
    rootSpan.recordError(e);
  }
  rootSpan.finish();
  console.log("ex32 distributed trace:", tracer.getSpans().map(s => ({ name: s.name, errors: s.errors.length })));
}

/** @example ex33 — Typed error union */
function ex33() {
  // Discriminated union of errors
  function createError(type, message, extra = {}) {
    return Object.freeze({ type, message, ...extra, timestamp: new Date("2026-01-01").toISOString() });
  }
  const Errors = {
    notFound: (resource, id) => createError("NOT_FOUND", `${resource}#${id} not found`, { resource, id }),
    unauthorized: (action) => createError("UNAUTHORIZED", `Not allowed to ${action}`, { action }),
    validation: (field, rule) => createError("VALIDATION", `${field} failed ${rule}`, { field, rule }),
    server: (msg) => createError("SERVER_ERROR", msg),
  };
  function handleError(err) {
    switch (err.type) {
      case "NOT_FOUND": return `404: ${err.message}`;
      case "UNAUTHORIZED": return `401: ${err.message}`;
      case "VALIDATION": return `422: ${err.message}`;
      case "SERVER_ERROR": return `500: ${err.message}`;
      default: return `Unknown: ${err.message}`;
    }
  }
  console.log("ex33 typed error union:", handleError(Errors.notFound("User", 42)));
  console.log("ex33 typed error union:", handleError(Errors.validation("email", "format")));
}

/** @example ex34 — Exhaustive error handling */
function ex34() {
  const ErrorTypes = { NETWORK: "NETWORK", TIMEOUT: "TIMEOUT", PARSE: "PARSE", AUTH: "AUTH" };
  function makeError(type, msg) { return { type, message: msg }; }
  function handleAllErrors(error) {
    // Simulate exhaustive switch
    const handlers = {
      [ErrorTypes.NETWORK]: (e) => `Network issue: ${e.message} — retry later`,
      [ErrorTypes.TIMEOUT]: (e) => `Timeout: ${e.message} — increase timeout`,
      [ErrorTypes.PARSE]: (e) => `Parse error: ${e.message} — check input format`,
      [ErrorTypes.AUTH]: (e) => `Auth error: ${e.message} — re-login`,
    };
    const handler = handlers[error.type];
    if (!handler) throw new Error(`Unhandled error type: ${error.type}`);
    return handler(error);
  }
  [ErrorTypes.NETWORK, ErrorTypes.TIMEOUT, ErrorTypes.AUTH].forEach(type => {
    console.log("ex34 exhaustive:", handleAllErrors(makeError(type, "details")));
  });
}

/** @example ex35 — Error serialization */
function ex35() {
  function serializeError(error) {
    return JSON.stringify({
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack ? error.stack.split("\n")[0] : undefined,
      cause: error.cause ? { message: error.cause.message } : undefined,
    });
  }
  function deserializeError(json) {
    const data = JSON.parse(json);
    const error = new Error(data.message);
    error.name = data.name;
    error.code = data.code;
    return error;
  }
  class ApiError extends Error { constructor(msg, code) { super(msg); this.name = "ApiError"; this.code = code; } }
  const original = new ApiError("Resource not found", 404);
  const serialized = serializeError(original);
  const restored = deserializeError(serialized);
  console.log("ex35 error serialization:", serialized);
  console.log("ex35 deserialized:", restored.name, restored.message, restored.code);
}

/** @example ex36 — Error catalog pattern */
function ex36() {
  const ErrorCatalog = Object.freeze({
    USER_NOT_FOUND: { code: "USR_001", message: "User not found", httpStatus: 404 },
    EMAIL_TAKEN: { code: "USR_002", message: "Email already in use", httpStatus: 409 },
    INVALID_PASSWORD: { code: "USR_003", message: "Password does not meet requirements", httpStatus: 400 },
    SESSION_EXPIRED: { code: "AUTH_001", message: "Session has expired", httpStatus: 401 },
    RATE_LIMITED: { code: "GW_001", message: "Too many requests", httpStatus: 429 },
  });
  class CatalogError extends Error {
    constructor(key, override = {}) {
      const entry = ErrorCatalog[key];
      if (!entry) throw new Error(`Unknown error key: ${key}`);
      super(override.message || entry.message);
      this.name = "CatalogError";
      this.code = entry.code;
      this.httpStatus = entry.httpStatus;
    }
  }
  const err = new CatalogError("USER_NOT_FOUND");
  console.log("ex36 error catalog:", err.code, err.message, err.httpStatus);
}

/** @example ex37 — Error recovery strategies */
function ex37() {
  function createRecoveryManager() {
    const strategies = new Map();
    return {
      register(errorType, strategy) { strategies.set(errorType, strategy); return this; },
      async recover(error, context) {
        const strategy = strategies.get(error.constructor) || strategies.get(error.name);
        if (!strategy) throw error;
        return strategy(error, context);
      },
    };
  }
  class NetworkError extends Error { constructor(m) { super(m); this.name = "NetworkError"; } }
  class CacheError extends Error { constructor(m) { super(m); this.name = "CacheError"; } }
  const recovery = createRecoveryManager();
  recovery.register("NetworkError", async (e, ctx) => { return { recovered: true, from: "cache", data: ctx.fallbackData }; });
  recovery.register("CacheError", async (e, ctx) => { return { recovered: true, from: "default", data: null }; });
  const err = new NetworkError("timeout");
  err.name = "NetworkError";
  recovery.recover(err, { fallbackData: [1, 2, 3] }).then(r => console.log("ex37 error recovery:", r));
}

/** @example ex38 — Error context propagation */
function ex38() {
  class ErrorContext {
    constructor(initial = {}) { this._ctx = { ...initial }; this._errors = []; }
    set(key, value) { this._ctx[key] = value; return this; }
    get(key) { return this._ctx[key]; }
    addError(error) { this._errors.push({ error: error.message, ctx: { ...this._ctx } }); return this; }
    hasErrors() { return this._errors.length > 0; }
    getErrors() { return [...this._errors]; }
  }
  const ctx = new ErrorContext({ requestId: "req-123", userId: 42 });
  ctx.set("operation", "createOrder");
  try { throw new Error("Database connection failed"); }
  catch (e) { ctx.addError(e); }
  ctx.set("operation", "sendNotification");
  try { throw new Error("SMTP unavailable"); }
  catch (e) { ctx.addError(e); }
  console.log("ex38 error context propagation:", ctx.getErrors());
}

// ─── ADVANCED (ex39–ex50) ─────────────────────────────────────────────────────

/** @example ex39 — Error fingerprinting */
function ex39() {
  function fingerprintError(error) {
    // Create a stable fingerprint from error properties (for deduplication)
    const parts = [
      error.name,
      error.message.replace(/\d+/g, "N"), // normalize numbers
      error.code || "",
      (error.stack || "").split("\n")[1] || "", // first stack frame
    ];
    // Simple hash (not crypto-grade, for demo)
    let hash = 0;
    const str = parts.join("|");
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return hash.toString(16);
  }
  const err1 = new TypeError("Cannot read property 'x' of undefined");
  const err2 = new TypeError("Cannot read property 'y' of undefined");
  const err3 = new TypeError("Cannot read property 'x' of undefined");
  console.log("ex39 fingerprints:", fingerprintError(err1), fingerprintError(err2), fingerprintError(err3));
  console.log("ex39 err1 === err3:", fingerprintError(err1) === fingerprintError(err3));
}

/** @example ex40 — Error budget concept */
function ex40() {
  function createErrorBudget(limit, windowMs = 60000) {
    let errors = [];
    return {
      record() {
        const now = Date.now();
        errors = errors.filter(t => now - t < windowMs);
        errors.push(now);
      },
      get used() {
        const now = Date.now();
        errors = errors.filter(t => now - t < windowMs);
        return errors.length;
      },
      get remaining() { return Math.max(0, limit - this.used); },
      get exceeded() { return this.used >= limit; },
      get percentage() { return Math.min(100, (this.used / limit) * 100).toFixed(1); },
    };
  }
  const budget = createErrorBudget(5, 60000);
  [1,2,3,4].forEach(() => budget.record());
  console.log("ex40 error budget:", { used: budget.used, remaining: budget.remaining, exceeded: budget.exceeded, percentage: budget.percentage + "%" });
  budget.record();
  console.log("ex40 after 5th error:", { exceeded: budget.exceeded });
}

/** @example ex41 — Error middleware pipeline */
function ex41() {
  function createErrorMiddlewarePipeline() {
    const handlers = [];
    return {
      use(handler) { handlers.push(handler); return this; },
      async handle(error, context = {}) {
        let i = 0;
        const next = async (err) => {
          if (i >= handlers.length) throw err;
          const h = handlers[i++];
          return h(err, context, next);
        };
        return next(error);
      },
    };
  }
  const pipeline = createErrorMiddlewarePipeline()
    .use(async (err, ctx, next) => { ctx.logged = true; console.log("ex41 [middleware] logging:", err.message); return next(err); })
    .use(async (err, ctx, next) => { if (err.code === "NOT_FOUND") return { status: 404, message: err.message }; return next(err); })
    .use(async (err, ctx) => { return { status: 500, message: "Internal Server Error", detail: err.message }; });
  const notFound = Object.assign(new Error("User not found"), { code: "NOT_FOUND" });
  pipeline.handle(notFound).then(r => console.log("ex41 error middleware result:", r));
}

/** @example ex42 — Typed Result with chaining */
function ex42() {
  class Result {
    constructor(ok, value, error) { this._ok = ok; this._value = value; this._error = error; }
    static ok(value) { return new Result(true, value, null); }
    static err(error) { return new Result(false, null, error); }
    get ok() { return this._ok; }
    get value() { return this._value; }
    get error() { return this._error; }
    map(fn) { return this._ok ? Result.ok(fn(this._value)) : this; }
    flatMap(fn) { return this._ok ? fn(this._value) : this; }
    mapError(fn) { return this._ok ? this : Result.err(fn(this._error)); }
    recover(fn) { return this._ok ? this : Result.ok(fn(this._error)); }
    fold(onErr, onOk) { return this._ok ? onOk(this._value) : onErr(this._error); }
    toPromise() { return this._ok ? Promise.resolve(this._value) : Promise.reject(this._error); }
  }
  function parsePositiveInt(s) {
    const n = parseInt(s, 10);
    if (isNaN(n)) return Result.err(new Error(`"${s}" is not a number`));
    if (n <= 0) return Result.err(new RangeError(`${n} is not positive`));
    return Result.ok(n);
  }
  const result = parsePositiveInt("42")
    .map(n => n * 2)
    .flatMap(n => n > 50 ? Result.ok(`${n} is big`) : Result.err(new Error("too small")))
    .fold(e => `Error: ${e.message}`, v => v);
  console.log("ex42 typed Result chain:", result);
}

/** @example ex43 — Promise error handling patterns */
function ex43() {
  async function fetchData(id) {
    if (id === 0) throw new TypeError("ID cannot be zero");
    if (id < 0) throw new RangeError("ID must be positive");
    return { id, data: `Data for ${id}` };
  }
  // Pattern 1: catch at the end
  const p1 = fetchData(-1).catch(e => ({ error: e.message }));
  // Pattern 2: per-promise catch
  const p2 = fetchData(0).catch(e => ({ error: e.name }));
  // Pattern 3: Promise.allSettled
  Promise.allSettled([fetchData(1), fetchData(-1), fetchData(2)]).then(results => {
    console.log("ex43 allSettled:", results.map(r => r.status === "fulfilled" ? r.value.id : r.reason.constructor.name));
  });
  Promise.all([p1, p2]).then(([r1, r2]) => console.log("ex43 catch patterns:", r1, r2));
}

/** @example ex44 — Async error with cleanup */
function ex44() {
  async function withCleanup(acquireFn, useFn, cleanupFn) {
    const resource = await acquireFn();
    try {
      return await useFn(resource);
    } finally {
      await cleanupFn(resource);
    }
  }
  withCleanup(
    async () => { const conn = { id: 1, closed: false }; return conn; },
    async (conn) => { if (Math.random() < 0) throw new Error("query failed"); return { data: [1,2,3], connId: conn.id }; },
    async (conn) => { conn.closed = true; console.log("ex44 cleanup: connection closed, id:", conn.id); },
  ).then(result => console.log("ex44 with cleanup result:", result));
}

/** @example ex45 — Error-first callbacks to Promise */
function ex45() {
  function promisify(fn) {
    return function(...args) {
      return new Promise((resolve, reject) => {
        fn(...args, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    };
  }
  // Simulate Node.js-style error-first callback
  function readFile(path, callback) {
    setTimeout(() => {
      if (path === "/bad/path") callback(new Error("ENOENT: file not found"));
      else callback(null, `contents of ${path}`);
    }, 0);
  }
  const readFileAsync = promisify(readFile);
  readFileAsync("/good/path").then(data => console.log("ex45 promisify:", data));
  readFileAsync("/bad/path").catch(e => console.log("ex45 promisify error:", e.message));
}

/** @example ex46 — Global error handling strategy */
function ex46() {
  class ErrorHandler {
    constructor() {
      this._strategies = new Map();
      this._fallback = (e) => console.log("ex46 fallback handler:", e.message);
    }
    register(errorClass, handler) { this._strategies.set(errorClass, handler); return this; }
    handle(error) {
      for (const [ErrorClass, handler] of this._strategies) {
        if (error instanceof ErrorClass) { handler(error); return; }
      }
      this._fallback(error);
    }
    setFallback(fn) { this._fallback = fn; return this; }
  }
  class NetworkError extends Error {}
  class AuthError extends Error {}
  const handler = new ErrorHandler();
  handler
    .register(NetworkError, (e) => console.log("ex46 network handler:", e.message))
    .register(AuthError, (e) => console.log("ex46 auth handler:", e.message));
  handler.handle(new NetworkError("timeout"));
  handler.handle(new AuthError("token expired"));
  handler.handle(new RangeError("out of bounds")); // falls through to fallback
}

/** @example ex47 — Error rate limiting */
function ex47() {
  function createErrorRateLimiter(maxErrors, windowMs) {
    const windows = new Map();
    return function shouldSurface(errorKey) {
      const now = Date.now();
      const windowStart = Math.floor(now / windowMs) * windowMs;
      const key = `${errorKey}:${windowStart}`;
      const count = (windows.get(key) || 0) + 1;
      windows.set(key, count);
      // Cleanup old windows
      for (const k of windows.keys()) { if (!k.endsWith(`:${windowStart}`)) windows.delete(k); }
      return count <= maxErrors;
    };
  }
  const shouldSurface = createErrorRateLimiter(3, 60000);
  const results = [];
  for (let i = 0; i < 6; i++) results.push(shouldSurface("DB_TIMEOUT"));
  console.log("ex47 error rate limiting (first 3 surface, rest suppressed):", results);
}

/** @example ex48 — Structured error response */
function ex48() {
  function createErrorResponse(error) {
    const base = {
      success: false,
      timestamp: new Date("2026-01-01").toISOString(),
      error: {
        message: error.message,
        code: error.code || "INTERNAL_ERROR",
        name: error.name,
      },
    };
    if (error.field) base.error.field = error.field;
    if (error.errors) base.error.details = error.errors.map(e => ({ message: e.message, field: e.field }));
    return base;
  }
  class ValidationError extends Error {
    constructor(errors) { super("Validation failed"); this.name = "ValidationError"; this.code = "VALIDATION"; this.errors = errors; }
  }
  const err = new ValidationError([
    { message: "required", field: "name" },
    { message: "invalid format", field: "email" },
  ]);
  const response = createErrorResponse(err);
  console.log("ex48 structured error response:", JSON.stringify(response, null, 2));
}

/** @example ex49 — Retry with exponential backoff */
function ex49() {
  async function retryWithBackoff(fn, { maxAttempts = 5, baseDelay = 10, maxDelay = 1000, jitter = true } = {}) {
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try { return await fn(attempt); }
      catch (e) {
        lastError = e;
        if (attempt === maxAttempts) break;
        const exponential = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
        const delay = jitter ? exponential * (0.5 + Math.random() * 0.5) : exponential;
        console.log(`ex49 attempt ${attempt} failed, retrying in ~${Math.round(delay)}ms`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
    throw lastError;
  }
  let attempts = 0;
  retryWithBackoff(async (n) => {
    attempts++;
    if (attempts < 3) throw Object.assign(new Error("transient"), { retryable: true });
    return { success: true, totalAttempts: attempts };
  }, { maxAttempts: 5, baseDelay: 1 }).then(r => console.log("ex49 backoff result:", r));
}

/** @example ex50 — Full error handling system */
function ex50() {
  // Complete system: typed errors + Result + middleware + telemetry
  class AppError extends Error {
    constructor(message, code, meta = {}) { super(message); this.name = "AppError"; this.code = code; Object.assign(this, meta); }
  }
  const Result = {
    ok: (v) => ({ ok: true, value: v }),
    err: (e) => ({ ok: false, error: e }),
    from: async (promise) => { try { return Result.ok(await promise); } catch (e) { return Result.err(e); } },
  };
  const telemetry = { errors: [], record: function(e) { this.errors.push({ name: e.name, code: e.code, msg: e.message }); } };
  async function processOrder(order) {
    if (!order.id) return Result.err(new AppError("Order ID required", "VALIDATION", { field: "id" }));
    if (!order.userId) return Result.err(new AppError("User ID required", "VALIDATION", { field: "userId" }));
    if (order.total <= 0) return Result.err(new AppError("Invalid total", "BUSINESS_RULE", { min: 0 }));
    await new Promise(r => setTimeout(r, 0));
    return Result.ok({ orderId: order.id, status: "confirmed", total: order.total });
  }
  const orders = [
    { id: "ORD-1", userId: 42, total: 99.99 },
    { id: null, userId: 42, total: 10 },
    { id: "ORD-3", userId: null, total: 20 },
  ];
  Promise.all(orders.map(o => processOrder(o))).then(results => {
    results.forEach(r => { if (!r.ok) telemetry.record(r.error); });
    const succeeded = results.filter(r => r.ok).map(r => r.value);
    const failed = results.filter(r => !r.ok).map(r => r.error.message);
    console.log("ex50 full error system:", { succeeded, failed, telemetry: telemetry.errors.length + " errors recorded" });
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function main() {
  console.log("=== BASIC (ex01–ex13) ===");
  ex01(); ex02(); ex03(); ex04(); ex05(); ex06(); ex07();
  ex08(); ex09(); ex10(); ex11(); ex12(); ex13();

  console.log("\n=== INTERMEDIATE (ex14–ex26) ===");
  ex14(); ex15(); ex16(); ex17(); ex18(); ex19(); ex20();
  ex21(); ex22(); ex23(); ex24(); ex25(); ex26();

  console.log("\n=== NESTED (ex27–ex38) ===");
  ex27(); ex28(); ex29(); ex30(); ex31(); ex32(); ex33();
  ex34(); ex35(); ex36(); ex37(); ex38();

  console.log("\n=== ADVANCED (ex39–ex50) ===");
  ex39(); ex40(); ex41(); ex42(); ex43(); ex44(); ex45();
  ex46(); ex47(); ex48(); ex49(); ex50();
}

main();
