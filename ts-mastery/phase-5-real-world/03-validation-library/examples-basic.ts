export {};

// ============================================================
// BASIC EXAMPLES — Validation Library (50 Examples)
// ============================================================

// 1. Validation result type
type ValidationResult = { ok: true } | { ok: false; error: string };

// 2. Validator function type
type Validator<T> = (value: T) => ValidationResult;

// 3. Success result helper
const ok: ValidationResult = { ok: true };

// 4. Error result helper
function fail(error: string): ValidationResult {
  return { ok: false, error };
}

// 5. Validate required string
const required: Validator<string> = (v) =>
  v.trim().length > 0 ? ok : fail("Value is required");

// 6. Validate minimum string length
function minLength(min: number): Validator<string> {
  return (v) => v.length >= min ? ok : fail(`Must be at least ${min} characters`);
}

// 7. Validate maximum string length
function maxLength(max: number): Validator<string> {
  return (v) => v.length <= max ? ok : fail(`Must be at most ${max} characters`);
}

// 8. Validate email format
const emailFormat: Validator<string> = (v) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? ok : fail("Invalid email address");

// 9. Validate number minimum
function minValue(min: number): Validator<number> {
  return (v) => v >= min ? ok : fail(`Must be at least ${min}`);
}

// 10. Validate number maximum
function maxValue(max: number): Validator<number> {
  return (v) => v <= max ? ok : fail(`Must be at most ${max}`);
}

// 11. Validate positive number
const positive: Validator<number> = (v) =>
  v > 0 ? ok : fail("Must be a positive number");

// 12. Validate integer
const integer: Validator<number> = (v) =>
  Number.isInteger(v) ? ok : fail("Must be an integer");

// 13. Validate boolean is true
const mustBeTrue: Validator<boolean> = (v) =>
  v === true ? ok : fail("Must be accepted");

// 14. Validate non-empty array
function nonEmptyArray<T>(): Validator<T[]> {
  return (v) => v.length > 0 ? ok : fail("Array must not be empty");
}

// 15. Validate array max length
function arrayMaxLength<T>(max: number): Validator<T[]> {
  return (v) => v.length <= max ? ok : fail(`Array must have at most ${max} items`);
}

// 16. Combine validators — all must pass
function allOf<T>(...validators: Validator<T>[]): Validator<T> {
  return (v) => {
    for (const validate of validators) {
      const result = validate(v);
      if (!result.ok) return result;
    }
    return ok;
  };
}

// 17. Combine validators — at least one must pass
function anyOf<T>(...validators: Validator<T>[]): Validator<T> {
  return (v) => {
    const errors: string[] = [];
    for (const validate of validators) {
      const result = validate(v);
      if (result.ok) return ok;
      errors.push(result.error);
    }
    return fail(errors.join(" or "));
  };
}

// 18. Optional validator — passes if value is undefined
function optional<T>(validator: Validator<T>): Validator<T | undefined> {
  return (v) => v === undefined ? ok : validator(v);
}

// 19. Nullable validator — passes if value is null
function nullable<T>(validator: Validator<T>): Validator<T | null> {
  return (v) => v === null ? ok : validator(v);
}

// 20. Validate URL format
const urlFormat: Validator<string> = (v) => {
  try { new URL(v); return ok; }
  catch { return fail("Invalid URL"); }
};

// 21. Validate phone number (simple pattern)
const phoneFormat: Validator<string> = (v) =>
  /^\+?[\d\s\-()]{7,15}$/.test(v) ? ok : fail("Invalid phone number");

// 22. Validate UUID format
const uuidFormat: Validator<string> = (v) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
    ? ok : fail("Invalid UUID");

// 23. Validate string matches regex
function matchesPattern(pattern: RegExp, msg: string): Validator<string> {
  return (v) => pattern.test(v) ? ok : fail(msg);
}

// 24. Validate one of allowed values
function oneOf<T extends string>(allowed: readonly T[]): Validator<T> {
  return (v) => (allowed as readonly string[]).includes(v)
    ? ok : fail(`Must be one of: ${allowed.join(", ")}`);
}

// 25. Validate object field — run validator on a field
function field<T, K extends keyof T>(
  key: K,
  validator: Validator<T[K]>
): Validator<T> {
  return (obj) => {
    const result = validator(obj[key]);
    if (!result.ok) return fail(`Field '${String(key)}': ${result.error}`);
    return ok;
  };
}

// 26. Object validator — validate multiple fields
function objectValidator<T>(...fieldValidators: Validator<T>[]): Validator<T> {
  return allOf(...fieldValidators);
}

// 27. Validate User object shape
interface User { name: string; email: string; age: number; }
const validateUser = objectValidator<User>(
  field("name", allOf(required, minLength(2), maxLength(50))),
  field("email", allOf(required, emailFormat)),
  field("age", allOf(positive, integer, maxValue(120))),
);

// 28. Validate string is not just whitespace
const nonBlank: Validator<string> = (v) =>
  v.trim().length > 0 ? ok : fail("Must not be blank or whitespace only");

// 29. Validate date is in the future
const futureDate: Validator<Date> = (v) =>
  v > new Date() ? ok : fail("Date must be in the future");

// 30. Validate date is in the past
const pastDate: Validator<Date> = (v) =>
  v < new Date() ? ok : fail("Date must be in the past");

// 31. Validate password strength
const strongPassword: Validator<string> = allOf(
  minLength(8),
  matchesPattern(/[A-Z]/, "Must contain an uppercase letter"),
  matchesPattern(/[0-9]/, "Must contain a number"),
  matchesPattern(/[^A-Za-z0-9]/, "Must contain a special character")
);

// 32. Collect all validation errors
type ValidationErrors = string[];
function validateAll<T>(value: T, ...validators: Validator<T>[]): ValidationErrors {
  return validators
    .map(v => v(value))
    .filter((r): r is { ok: false; error: string } => !r.ok)
    .map(r => r.error);
}

// 33. Check if valid (boolean shorthand)
function isValid<T>(value: T, validator: Validator<T>): boolean {
  return validator(value).ok;
}

// 34. Assert valid — throws on failure
function assertValid<T>(value: T, validator: Validator<T>): void {
  const result = validator(value);
  if (!result.ok) throw new Error(`Validation failed: ${result.error}`);
}

// 35. Validate credit card number (Luhn algorithm)
const luhnCheck: Validator<string> = (v) => {
  const digits = v.replace(/\D/g, "");
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i]);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0 ? ok : fail("Invalid credit card number");
};

// 36. Validate zip code (US format)
const usZipCode: Validator<string> = matchesPattern(/^\d{5}(-\d{4})?$/, "Invalid US zip code");

// 37. Validate ISO date string
const isoDate: Validator<string> = (v) =>
  !isNaN(Date.parse(v)) ? ok : fail("Invalid date format");

// 38. Validate hex color
const hexColor: Validator<string> = matchesPattern(
  /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/,
  "Invalid hex color"
);

// 39. Validate JSON string
const validJson: Validator<string> = (v) => {
  try { JSON.parse(v); return ok; }
  catch { return fail("Invalid JSON string"); }
};

// 40. Transform before validate
function transform<T, U>(transform: (v: T) => U, validator: Validator<U>): Validator<T> {
  return (v) => validator(transform(v));
}

// 41. Trim before validating
const trimmedRequired = transform<string, string>(s => s.trim(), required);

// 42. Validate each item in an array
function each<T>(validator: Validator<T>): Validator<T[]> {
  return (arr) => {
    for (let i = 0; i < arr.length; i++) {
      const result = validator(arr[i]);
      if (!result.ok) return fail(`Item [${i}]: ${result.error}`);
    }
    return ok;
  };
}

// 43. Validate username format
const usernameFormat: Validator<string> = allOf(
  minLength(3),
  maxLength(20),
  matchesPattern(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed")
);

// 44. Range validator for numbers
function inRange(min: number, max: number): Validator<number> {
  return allOf(minValue(min), maxValue(max));
}

// 45. Percentage validator (0-100)
const percentage: Validator<number> = inRange(0, 100);

// 46. Validate string is numeric
const numericString: Validator<string> = (v) =>
  /^\d+$/.test(v) ? ok : fail("Must contain only digits");

// 47. Validate file extension
function fileExtension(allowed: string[]): Validator<string> {
  return (v) => {
    const ext = v.split(".").pop()?.toLowerCase() ?? "";
    return allowed.includes(ext) ? ok : fail(`Extension must be one of: ${allowed.join(", ")}`);
  };
}

// 48. Validate latitude
const latitude: Validator<number> = inRange(-90, 90);

// 49. Validate longitude
const longitude: Validator<number> = inRange(-180, 180);

// 50. Validate coordinates
interface Coordinates { lat: number; lng: number; }
const validateCoordinates = objectValidator<Coordinates>(
  field("lat", latitude),
  field("lng", longitude),
);
