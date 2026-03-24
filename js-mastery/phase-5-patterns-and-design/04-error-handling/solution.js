// ============================================================================
// Solution 5.4 — Error Handling
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Custom error hierarchy
// ---------------------------------------------------------------------------

class AppError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "AppError";
    this.code = code;
    if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, field) {
    super(message, "VALIDATION");
    this.name = "ValidationError";
    this.field = field;
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

// ---------------------------------------------------------------------------
// 2. Result type
// ---------------------------------------------------------------------------

const Result = {
  ok: (value) => ({ ok: true, value }),
  err: (error) => ({ ok: false, error }),
};

// safeRun — wraps fn() in a Result, catching any thrown errors
function safeRun(fn) {
  try {
    return Result.ok(fn());
  } catch (e) {
    return Result.err(e);
  }
}

// ---------------------------------------------------------------------------
// 3. Schema validation
// ---------------------------------------------------------------------------

// validate — throws ValidationError for each rule violation
function validate(data, schema) {
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    if (rules.required && (value === null || value === undefined || value === "")) {
      throw new ValidationError(`Field "${field}" is required`, field);
    }
    if (value !== undefined && value !== null && rules.type && typeof value !== rules.type) {
      throw new ValidationError(
        `Field "${field}" must be of type ${rules.type}, got ${typeof value}`, field
      );
    }
    if (rules.min !== undefined && typeof value === "number" && value < rules.min) {
      throw new ValidationError(`Field "${field}" must be >= ${rules.min}`, field);
    }
  }
  return true;
}

// ---------------------------------------------------------------------------
// Runtime assertions
// ---------------------------------------------------------------------------

const e = new AppError("bad request", 400);
console.assert(e instanceof Error && e instanceof AppError, "AppError is an Error");
console.assert(e.code === 400 && e.message === "bad request", "AppError properties");

const ve = new ValidationError("invalid email");
console.assert(ve instanceof AppError && ve.code === "VALIDATION", "ValidationError");

const nfe = new NotFoundError("user not found");
console.assert(nfe.code === "NOT_FOUND", "NotFoundError");

const ok = Result.ok(42);
console.assert(ok.ok && ok.value === 42, "Result.ok");

const err = Result.err(new Error("oops"));
console.assert(!err.ok && err.error.message === "oops", "Result.err");

const good = safeRun(() => 100);
console.assert(good.ok && good.value === 100, "safeRun: success");

const bad = safeRun(() => { throw new Error("fail"); });
console.assert(!bad.ok, "safeRun: failure");

try {
  validate({ name: 123 }, { name: { required: true, type: "string" } });
} catch (ve2) {
  console.assert(ve2 instanceof ValidationError, "validate throws ValidationError");
}

console.log("Solution 5.4 — All assertions passed!");
