// ============================================================================
// Exercise 5.4 — Error Handling
// ============================================================================
// Build a custom error hierarchy, a Result type for explicit error handling,
// and a schema-based validator.
//
// Instructions: Fill in every TODO so the file runs and all assertions pass.
// Run with: node exercise.js
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Custom error hierarchy
// ---------------------------------------------------------------------------

// TODO: Create AppError extending Error with an extra `code` property
//       constructor(message, code) — call super(message), set this.name and this.code
class AppError extends Error {
  constructor(message, code) {
    // TODO: super(message); this.name = "AppError"; this.code = code;
  }
}

// TODO: Create ValidationError extending AppError
//       Hard-codes code to "VALIDATION"; optionally accepts a `field` name
class ValidationError extends AppError {
  constructor(message, field) {
    // TODO: super(message, "VALIDATION"); this.name = ...; this.field = field;
  }
}

// TODO: Create NotFoundError extending AppError
//       Hard-codes code to "NOT_FOUND"
class NotFoundError extends AppError {
  constructor(message) {
    // TODO: super(message, "NOT_FOUND"); this.name = ...;
  }
}

// ---------------------------------------------------------------------------
// 2. Result type
// ---------------------------------------------------------------------------

// TODO: Implement a Result object with two factory methods:
//       Result.ok(value)  → { ok: true, value }
//       Result.err(error) → { ok: false, error }
const Result = {
  ok: (value) => ({ /* TODO */ }),
  err: (error) => ({ /* TODO */ }),
};

// TODO: Write safeRun(fn) — calls fn(), wraps return in Result.ok;
//       if fn throws, wraps the error in Result.err
function safeRun(fn) {
  // TODO: try { return Result.ok(fn()); } catch(e) { return Result.err(e); }
}

// ---------------------------------------------------------------------------
// 3. Schema validation
// ---------------------------------------------------------------------------

// TODO: Write validate(data, schema) that validates `data` against `schema`
//       schema shape: { fieldName: { required?: bool, type?: string, min?: number } }
//       Throw ValidationError with a helpful message for each violated rule
//       Return true if valid
function validate(data, schema) {
  // TODO: implement — iterate Object.entries(schema), check each field
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

console.log("Exercise 5.4 — All assertions passed!");
