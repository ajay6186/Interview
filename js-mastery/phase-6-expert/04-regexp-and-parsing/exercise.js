// ============================================================================
// Exercise 6.4 — RegExp & Parsing
// ============================================================================
// Apply regular expressions to validation, extraction, transformation, and
// building a simple tokenizer with named capture groups.
//
// Instructions: Fill in every TODO so the file runs and all assertions pass.
// Run with: node exercise.js
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. Pattern matching
// ---------------------------------------------------------------------------

// TODO: Write isEmail(str) — returns true if str looks like a valid email
//       Minimum regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
function isEmail(str) {
  // TODO: implement
}

// TODO: Write extractNumbers(str) — returns an array of all numbers found
//       Both integers and decimals (e.g. "abc 3.14 xyz 7" → [3.14, 7])
//       Use str.match() with a global regex, then map to Number
function extractNumbers(str) {
  // TODO: implement
}

// ---------------------------------------------------------------------------
// 2. String transformation
// ---------------------------------------------------------------------------

// TODO: Write capitalize(str) — capitalise the first letter of each word
//       Use str.replace(/\b\w/g, c => c.toUpperCase())
function capitalize(str) {
  // TODO: implement
}

// TODO: Write highlight(text, pattern) — wrap each match in **...**
//       highlight("the cat sat", /cat/) === "the **cat** sat"
function highlight(text, pattern) {
  // TODO: text.replace(pattern, m => `**${m}**`)
}

// ---------------------------------------------------------------------------
// 3. Structured parsing
// ---------------------------------------------------------------------------

// TODO: Write parseDate(str) — accepts "YYYY-MM-DD", returns { year, month, day }
//       Use named capture groups: (?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})
function parseDate(str) {
  // TODO: const match = /.../.exec(str); return match?.groups ?? null;
}

// TODO: Write tokenize(expr) — tokenizes a simple arithmetic expression
//       Each token is { type: "number" | "operator" | "paren", value: string }
//       Example: "(1 + 23) * 4" → [{type:"paren",value:"("},
//                                   {type:"number",value:"1"}, ...]
function tokenize(expr) {
  // TODO: use a global regex that matches numbers, operators, and parens
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

console.log("Exercise 6.4 — All assertions passed!");
