// ============================================================================
// Solution 6.4 — RegExp & Parsing
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Pattern matching
// ---------------------------------------------------------------------------

// isEmail — basic email validation
function isEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

// extractNumbers — finds all integers and decimals in a string
function extractNumbers(str) {
  const matches = str.match(/\d+(\.\d+)?/g);
  return matches ? matches.map(Number) : [];
}

// ---------------------------------------------------------------------------
// 2. String transformation
// ---------------------------------------------------------------------------

// capitalize — uppercases first letter of each word via replace callback
function capitalize(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

// highlight — wraps each regex match in **...**
function highlight(text, pattern) {
  return text.replace(pattern, m => `**${m}**`);
}

// ---------------------------------------------------------------------------
// 3. Structured parsing
// ---------------------------------------------------------------------------

// parseDate — extracts year/month/day from "YYYY-MM-DD" using named groups
function parseDate(str) {
  const match = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/.exec(str);
  return match ? match.groups : null;
}

// tokenize — breaks arithmetic expression into typed token objects
function tokenize(expr) {
  const tokens = [];
  const re = /\s*(\d+(?:\.\d+)?|[+\-*/^%]|[()])\s*/g;
  let match;
  while ((match = re.exec(expr)) !== null) {
    const value = match[1];
    let type;
    if (/^\d/.test(value)) type = "number";
    else if (/^[+\-*/^%]$/.test(value)) type = "operator";
    else type = "paren";
    tokens.push({ type, value });
  }
  return tokens;
}

// ---------------------------------------------------------------------------
// Runtime assertions
// ---------------------------------------------------------------------------

console.assert(isEmail("user@example.com") === true, "isEmail: valid");
console.assert(isEmail("notanemail") === false, "isEmail: invalid (no @)");
console.assert(isEmail("bad@") === false, "isEmail: invalid (no domain)");

const nums = extractNumbers("abc 123 def 45.6 ghi 7");
console.assert(JSON.stringify(nums) === "[123,45.6,7]", "extractNumbers");

console.assert(capitalize("hello world foo") === "Hello World Foo", "capitalize");

console.assert(highlight("the cat sat", /cat/) === "the **cat** sat", "highlight");

const d = parseDate("2024-03-15");
console.assert(d.year === "2024" && d.month === "03" && d.day === "15", "parseDate");

const tokens = tokenize("(1 + 23) * 4");
console.assert(tokens.some(t => t.type === "number" && t.value === "23"), "tokenize: number");
console.assert(tokens.some(t => t.type === "operator" && t.value === "*"), "tokenize: operator");
console.assert(tokens.some(t => t.type === "paren" && t.value === "("), "tokenize: paren");

console.log("Solution 6.4 — All assertions passed!");
