// ============================================================================
// Examples 1.1 — Variables & Types  (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================================

"use strict";

// ─── BASIC (1–13) ────────────────────────────────────────────────────────────

/** String primitive */
function ex01() {
  const name = "Alice";
  console.log("Ex01 —", name, typeof name);
}

/** Number primitive */
function ex02() {
  const age = 30;
  console.log("Ex02 —", age, typeof age);
}

/** Boolean primitive */
function ex03() {
  const active = true;
  console.log("Ex03 —", active, typeof active);
}

/** null value */
function ex04() {
  const nothing = null;
  console.log("Ex04 —", nothing, typeof nothing); // "object" — famous JS quirk
}

/** undefined value */
function ex05() {
  let x;
  console.log("Ex05 —", x, typeof x);
}

/** BigInt primitive */
function ex06() {
  const big = 9007199254740991n;
  console.log("Ex06 —", big, typeof big);
}

/** Symbol primitive */
function ex07() {
  const sym = Symbol("id");
  console.log("Ex07 —", sym.toString(), typeof sym);
}

/** const vs let */
function ex08() {
  const PI = 3.14159;
  let count = 0;
  count += 1;
  console.log("Ex08 — PI:", PI, "count:", count);
}

/** NaN special value */ 
// (Not a Number)
function ex09() {
  const result = Number("abc");
  console.log("Ex09 — NaN:", result, "isNaN:", isNaN(result), "Number.isNaN:", Number.isNaN(result));
}

/** Infinity */
function ex10() {
  console.log("Ex10 — Infinity:", Infinity, "neg:", -Infinity, "1/0:", 1 / 0);
}

/** typeof checks */
function ex11() {
  console.log("Ex11 —",
    typeof 42,          // "number"
    typeof "hello",     // "string"
    typeof true,        // "boolean"
    typeof undefined,   // "undefined"
    typeof null,        // "object"
    typeof {},          // "object"
    typeof []           // "object"
  );
}

/** Array.isArray to distinguish arrays */
function ex12() {
  console.log("Ex12 — isArray([]):", Array.isArray([]), "isArray({}):", Array.isArray({}));
}

/** Strict equality vs loose equality */
function ex13() {
  console.log("Ex13 — 0 == false:", 0 == false, "0 === false:", 0 === false);
  console.log("Ex13 — null == undefined:", null == undefined, "null === undefined:", null === undefined);
}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────────────────────

/** Number() coercion */
function ex14() {
  console.log("Ex14 —",
    Number("42"),     // 42
    Number(""),       // 0
    Number(" "),      // 0
    Number(true),     // 1
    Number(false),    // 0
    Number(null),     // 0
    Number(undefined) // NaN
  );
}

/** parseInt and parseFloat */
function ex15() {
  console.log("Ex15 —",
    parseInt("42px"),    // 42
    parseFloat("3.14abc"), // 3.14
    parseInt("0xFF", 16),  // 255
    parseInt("10", 2)      // 2
  );
}

/** String() coercion */
function ex16() {
  console.log("Ex16 —",
    String(42),        // "42"
    String(true),      // "true"
    String(null),      // "null"
    String(undefined), // "undefined"
    String([1,2,3])    // "1,2,3"
  );
}

/** Boolean() coercion — falsy values */
function ex17() {
  const falsy = [0, "", null, undefined, NaN, false];
  falsy.forEach(v => console.log("Ex17 — Boolean(" + String(v) + "):", Boolean(v)));
}

/** Template literals */
function ex18() {
  const name = "World";
  const n = 42;
  console.log("Ex18 —", `Hello, ${name}! The answer is ${n * 1}.`);
}

/** String methods: length, toUpperCase, toLowerCase */
function ex19() {
  const s = "Hello, World!";
  console.log("Ex19 — length:", s.length, "upper:", s.toUpperCase(), "lower:", s.toLowerCase());
}

/** String methods: trim, trimStart, trimEnd */
function ex20() {
  const s = "  hello  ";
  console.log("Ex20 — trim:", `'${s.trim()}'`, "trimStart:", `'${s.trimStart()}'`);
}

/** String methods: includes, startsWith, endsWith */
function ex21() {
  const s = "JavaScript is great";
  console.log("Ex21 —",
    s.includes("great"),     // true
    s.startsWith("Java"),    // true
    s.endsWith("great")      // true
  );
}

/** String methods: slice, substring, indexOf */
function ex22() {
  const s = "Hello, World!";
  console.log("Ex22 —",
    s.slice(7, 12),      // "World"
    s.indexOf("World"),  // 7
    s.slice(-6, -1)      // "World"
  );
}

/** String split and join */
function ex23() {
  const csv = "a,b,c,d";
  const parts = csv.split(",");
  console.log("Ex23 — split:", parts, "join:", parts.join(" | "));
}

/** Number methods */
function ex24() {
  const n = 3.14159;
  console.log("Ex24 —",
    n.toFixed(2),          // "3.14"
    Number.isInteger(42),  // true
    Number.isFinite(Infinity), // false
    Number.isNaN(NaN)      // true
  );
}

/** String replace and replaceAll */
function ex25() {
  const s = "foo bar foo";
  console.log("Ex25 —", s.replace("foo", "baz"), s.replaceAll("foo", "baz"));
}

/** String padStart, padEnd, repeat */
function ex26() {
  console.log("Ex26 —",
    "5".padStart(3, "0"),  // "005"
    "hi".padEnd(5, "."),   // "hi..."
    "ab".repeat(3)         // "ababab"
  );
}

// ─── NESTED (27–38) ──────────────────────────────────────────────────────────

/** Object.is for edge cases */
function ex27() {
  console.log("Ex27 —",
    Object.is(NaN, NaN),  // true (unlike ===)
    Object.is(0, -0),     // false (unlike ===)
    Object.is(1, 1)       // true
  );
}

/** Nullish coalescing operator ?? */
function ex28() {
  const val = null ?? "default";
  const val2 = 0 ?? "default";  // 0 is NOT nullish
  console.log("Ex28 — null??:", val, "0??:", val2);
}

/** Optional chaining ?. */
function ex29() {
  const user = { profile: { name: "Alice" } };
  console.log("Ex29 —",
    user?.profile?.name,      // "Alice"
    user?.address?.city,      // undefined (no throw)
    user?.getName?.()         // undefined (no throw)
  );
}

/** Logical assignment operators */
function ex30() {
  let a = null;
  let b = 0;
  let c = 1;
  a ??= "assigned";
  b ||= "assigned";
  c &&= "reassigned";
  console.log("Ex30 — a:", a, "b:", b, "c:", c);
}

/** Type coercion in arithmetic */
function ex31() {
  console.log("Ex31 —",
    "5" + 3,    // "53" (string concat)
    "5" - 3,    // 2 (numeric)
    "5" * "2",  // 10
    true + 1,   // 2
    null + 1    // 1
  );
}

/** Checking for existence patterns */
function ex32() {
  const obj = { x: 0, y: null };
  // Bad: falsy check misses 0 and null
  console.log("Ex32 — bad check x:", obj.x ? "exists" : "missing");  // "missing"!
  // Good: explicit check
  console.log("Ex32 — good check x:", obj.x !== undefined ? "exists" : "missing");
  console.log("Ex32 — in operator:", "x" in obj, "z" in obj);
}

/** Number edge cases */
function ex33() {
  console.log("Ex33 —",
    0.1 + 0.2,                           // 0.30000000000000004
    Math.abs(0.1 + 0.2 - 0.3) < 1e-10,  // true (epsilon comparison)
    Number.MAX_SAFE_INTEGER,
    Number.MIN_SAFE_INTEGER
  );
}

/** String at() and at(-1) */
function ex34() {
  const s = "Hello";
  console.log("Ex34 — first:", s.at(0), "last:", s.at(-1));
}

/** structuredClone for deep copy */
function ex35() {
  const original = { a: 1, nested: { b: 2 } };
  const clone = structuredClone(original);
  clone.nested.b = 99;
  console.log("Ex35 — original.nested.b:", original.nested.b, "clone.nested.b:", clone.nested.b);
}

/** globalThis */
function ex36() {
  console.log("Ex36 — globalThis is object:", typeof globalThis === "object");
}

/** typeof function */
function ex37() {
  function fn() {}
  const arrow = () => {};
  console.log("Ex37 —", typeof fn, typeof arrow, typeof class C {});
}

/** Primitive wrapper objects */
function ex38() {
  const strObj = new String("hello");
  const strPrim = "hello";
  console.log("Ex38 — typeof strObj:", typeof strObj, "typeof strPrim:", typeof strPrim);
  console.log("Ex38 — strObj == strPrim:", strObj == strPrim, "strObj === strPrim:", strObj === strPrim);
}

// ─── ADVANCED (39–50) ────────────────────────────────────────────────────────

/** Symbol uniqueness */
function ex39() {
  const s1 = Symbol("key");
  const s2 = Symbol("key");
  console.log("Ex39 — s1 === s2:", s1 === s2);  // false — always unique
}

/** Symbol.for global registry */
function ex40() {
  const s1 = Symbol.for("shared");
  const s2 = Symbol.for("shared");
  console.log("Ex40 — shared:", s1 === s2, Symbol.keyFor(s1));
}

/** BigInt arithmetic */
function ex41() {
  const a = 9007199254740991n;
  const b = 1n;
  console.log("Ex41 — BigInt add:", a + b, typeof (a + b));
}

/** Logical OR short-circuit */
function ex42() {
  let sideEffect = false;
  const val = "truthy" || (sideEffect = true);
  console.log("Ex42 — val:", val, "sideEffect:", sideEffect); // sideEffect stays false
}

/** Logical AND short-circuit */
function ex43() {
  let sideEffect = false;
  const val = "" && (sideEffect = true);
  console.log("Ex43 — val:", JSON.stringify(val), "sideEffect:", sideEffect);
}

/** Type checking utility */
function ex44() {
  function typeOf(v) {
    if (v === null) return "null";
    if (Array.isArray(v)) return "array";
    return typeof v;
  }
  console.log("Ex44 —",
    typeOf(null),    // "null"
    typeOf([]),      // "array"
    typeOf({}),      // "object"
    typeOf(42),      // "number"
    typeOf("hi")     // "string"
  );
}

/** Object.prototype.toString for exact type */
function ex45() {
  function exactType(v) {
    return Object.prototype.toString.call(v);
  }
  console.log("Ex45 —",
    exactType(null),      // [object Null]
    exactType([]),        // [object Array]
    exactType(new Date()) // [object Date]
  );
}

/** Tagged template literal */
function ex46() {
  function tag(strings, ...values) {
    return strings.raw.join("") + " | vals: " + values.join(", ");
  }
  const a = 1, b = 2;
  console.log("Ex46 —", tag`sum of ${a} and ${b}`);
}

/** String.raw */
function ex47() {
  console.log("Ex47 —", String.raw`Line1\nLine2\tTabbed`); // backslashes literal
}

/** Conversion via valueOf and toString */
function ex48() {
  const obj = {
    valueOf() { return 42; },
    toString() { return "forty-two"; }
  };
  console.log("Ex48 — num context:", obj + 1, "str context:", `${obj}`);
}

/** Number precision helpers */
function ex49() {
  function safeEquals(a, b, epsilon = Number.EPSILON) {
    return Math.abs(a - b) < epsilon;
  }
  console.log("Ex49 — 0.1+0.2 == 0.3:", safeEquals(0.1 + 0.2, 0.3, 1e-10));
}

/** Complete type-check utility */
function ex50() {
  function is(type, val) {
    return Object.prototype.toString.call(val) === `[object ${type}]`;
  }
  console.log("Ex50 —",
    is("Array", []),        // true
    is("Date", new Date()), // true
    is("RegExp", /abc/),    // true
    is("Map", new Map())    // true
  );
}

function main() {
  console.log("=".repeat(60));
  console.log("Examples 1.1 — Variables & Types");
  console.log("=".repeat(60));

  console.log("\n--- BASIC (1-13) ---");
  ex01(); ex02(); ex03(); ex04(); ex05(); ex06(); ex07();
  ex08(); ex09(); ex10(); ex11(); ex12(); ex13();

  console.log("\n--- INTERMEDIATE (14-26) ---");
  ex14(); ex15(); ex16(); ex17(); ex18(); ex19(); ex20();
  ex21(); ex22(); ex23(); ex24(); ex25(); ex26();

  console.log("\n--- NESTED (27-38) ---");
  ex27(); ex28(); ex29(); ex30(); ex31(); ex32(); ex33();
  ex34(); ex35(); ex36(); ex37(); ex38();

  console.log("\n--- ADVANCED (39-50) ---");
  ex39(); ex40(); ex41(); ex42(); ex43(); ex44(); ex45();
  ex46(); ex47(); ex48(); ex49(); ex50();
}

main();
