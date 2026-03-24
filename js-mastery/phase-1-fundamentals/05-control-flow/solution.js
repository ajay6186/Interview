// ============================================================================
// Solution 1.5 — Control Flow
// ============================================================================

"use strict";

function classify(n) {
  if (n > 0) return "positive";
  if (n < 0) return "negative";
  return "zero";
}

function grade(score) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  return "F";
}

function dayType(day) {
  switch (day) {
    case "saturday":
    case "sunday":
      return "weekend";
    default:
      return "weekday";
  }
}

function fizzbuzz(n) {
  if (n % 15 === 0) return "FizzBuzz";
  if (n % 3 === 0) return "Fizz";
  if (n % 5 === 0) return "Buzz";
  return String(n);
}

function range(start, end) {
  const result = [];
  for (let i = start; i < end; i++) result.push(i);
  return result;
}

function sumWhile(arr) {
  let sum = 0, i = 0;
  while (i < arr.length) { sum += arr[i]; i++; }
  return sum;
}

function flatten(arr) {
  const result = [];
  for (const item of arr) {
    for (const x of item) result.push(x);
  }
  return result;
}

function countKeys(obj) {
  let count = 0;
  for (const key in obj) {
    if (Object.hasOwn(obj, key)) count++;
  }
  return count;
}

function defaultTo(value, fallback) { return value || fallback; }
function nullishTo(value, fallback) { return value ?? fallback; }
function clamp(n, min, max) { return Math.min(Math.max(n, min), max); }

// Assertions
console.assert(classify(5) === "positive", "classify positive failed");
console.assert(classify(-3) === "negative", "classify negative failed");
console.assert(classify(0) === "zero", "classify zero failed");
console.assert(grade(95) === "A", "grade A failed");
console.assert(grade(85) === "B", "grade B failed");
console.assert(grade(75) === "C", "grade C failed");
console.assert(grade(60) === "F", "grade F failed");
console.assert(dayType("saturday") === "weekend", "dayType weekend failed");
console.assert(dayType("sunday") === "weekend", "dayType sunday failed");
console.assert(dayType("monday") === "weekday", "dayType weekday failed");
console.assert(fizzbuzz(15) === "FizzBuzz", "fizzbuzz 15 failed");
console.assert(fizzbuzz(9) === "Fizz", "fizzbuzz 9 failed");
console.assert(fizzbuzz(10) === "Buzz", "fizzbuzz 10 failed");
console.assert(fizzbuzz(7) === "7", "fizzbuzz 7 failed");
console.assert(JSON.stringify(range(0, 5)) === "[0,1,2,3,4]", "range failed");
console.assert(sumWhile([1,2,3,4,5]) === 15, "sumWhile failed");
console.assert(JSON.stringify(flatten([[1,2],[3,4],[5]])) === "[1,2,3,4,5]", "flatten failed");
console.assert(countKeys({a:1,b:2,c:3}) === 3, "countKeys failed");
console.assert(defaultTo(null, "default") === "default", "defaultTo failed");
console.assert(nullishTo(0, "fallback") === 0, "nullishTo 0 should keep 0");
console.assert(clamp(5, 0, 10) === 5, "clamp failed");
console.assert(clamp(-5, 0, 10) === 0, "clamp min failed");
console.assert(clamp(15, 0, 10) === 10, "clamp max failed");

console.log("Solution 1.5 — All assertions passed!");
