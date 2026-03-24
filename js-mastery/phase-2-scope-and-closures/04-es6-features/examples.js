// ============================================================================
// Examples 2.4 — ES6+ Features  (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================================

"use strict";

function ex01() { const x = 1; let y = 2; console.log("Ex01 — const/let:", x, y); }
function ex02() {
  { let block = "inside"; console.log("Ex02 — block-scoped:", block); }
  // block is not accessible here
}
function ex03() { const name = "Alice"; console.log("Ex03 — template:", `Hello, ${name}!`); }
function ex04() { const a = 1, b = 2; console.log("Ex04 — expr:", `${a} + ${b} = ${a + b}`); }
function ex05() {
  const f = x => x * 2;
  console.log("Ex05 — arrow:", f(5));
}
function ex06() {
  const obj = { x: 1, y: 2 };
  console.log("Ex06 — shorthand:", obj);
}
function ex07() {
  const key = "dynamic";
  const obj = { [key]: 42, [`${key}2`]: 99 };
  console.log("Ex07 — computed:", obj);
}
function ex08() {
  function greet(name = "World") { return `Hello, ${name}!`; }
  console.log("Ex08 — default:", greet(), greet("Alice"));
}
function ex09() {
  function sum(...args) { return args.reduce((a,b) => a+b, 0); }
  console.log("Ex09 — rest:", sum(1,2,3,4,5));
}
function ex10() {
  const a = [1,2,3], b = [4,5,6];
  console.log("Ex10 — spread array:", [...a, ...b]);
}
function ex11() {
  const o1 = {a:1}, o2 = {b:2};
  console.log("Ex11 — spread object:", {...o1, ...o2});
}
function ex12() {
  const m = new Map([["a",1],["b",2],["c",3]]);
  console.log("Ex12 — Map:", m.get("b"), m.size);
}
function ex13() {
  const s = new Set([1,2,2,3,3,3]);
  console.log("Ex13 — Set:", [...s], s.size);
}
function ex14() {
  const m = new Map();
  m.set("x", 10); m.set("y", 20);
  console.log("Ex14 — Map set/get:", m.get("x"), m.has("y"), m.size);
}
function ex15() {
  const s = new Set(["a","b","c","a","b"]);
  s.add("d"); s.delete("a");
  console.log("Ex15 — Set:", [...s]);
}
function ex16() {
  const wm = new WeakMap();
  const key = {};
  wm.set(key, "secret");
  console.log("Ex16 — WeakMap:", wm.get(key), wm.has(key));
}
function ex17() {
  const ws = new WeakSet();
  const obj = {};
  ws.add(obj);
  console.log("Ex17 — WeakSet:", ws.has(obj));
}
function ex18() {
  const id1 = Symbol("id"), id2 = Symbol("id");
  console.log("Ex18 — unique:", id1 === id2, id1.description);
}
function ex19() {
  const s = Symbol.for("shared");
  console.log("Ex19 — global Symbol:", Symbol.for("shared") === s, Symbol.keyFor(s));
}
function ex20() {
  const obj = { [Symbol.toPrimitive](hint) {
    if (hint === "number") return 42;
    return "forty-two";
  }};
  console.log("Ex20 — toPrimitive:", +obj, `${obj}`);
}
function ex21() {
  // for...of with Map
  const map = new Map([["a",1],["b",2]]);
  for (const [k,v] of map) console.log(`Ex21 — ${k}: ${v}`);
}
function ex22() {
  // Map from object entries
  const obj = {x:1,y:2,z:3};
  const map = new Map(Object.entries(obj));
  console.log("Ex22 — Map from obj:", map.get("x"), map.get("z"));
}
function ex23() {
  // Set operations
  const a = new Set([1,2,3,4]), b = new Set([3,4,5,6]);
  const union = new Set([...a,...b]);
  const inter = new Set([...a].filter(x=>b.has(x)));
  const diff = new Set([...a].filter(x=>!b.has(x)));
  console.log("Ex23 — union:", [...union], "inter:", [...inter], "diff:", [...diff]);
}
function ex24() {
  // for...of with Set
  const fruits = new Set(["apple","banana","cherry","apple"]);
  const result = [];
  for (const f of fruits) result.push(f);
  console.log("Ex24 —", result);
}
function ex25() {
  // Map iteration methods
  const m = new Map([["a",1],["b",2],["c",3]]);
  console.log("Ex25 — keys:", [...m.keys()], "values:", [...m.values()]);
}
function ex26() {
  // Nullish coalescing ??
  const a = null ?? "default";
  const b = 0 ?? "default";    // keeps 0
  const c = "" ?? "default";   // keeps ""
  console.log("Ex26 —", a, b, c);
}
function ex27() {
  // Optional chaining ?.
  const user = { profile: { name: "Alice" } };
  console.log("Ex27 —",
    user?.profile?.name,
    user?.address?.city,
    user?.getAge?.()
  );
}
function ex28() {
  // Logical assignment
  let a = null, b = 0, c = 1;
  a ??= "filled"; b ||= "filled"; c &&= "updated";
  console.log("Ex28 —", a, b, c);
}
function ex29() {
  // Array destructuring
  const [first, second, ...rest] = [1,2,3,4,5];
  console.log("Ex29 —", first, second, rest);
}
function ex30() {
  // Object destructuring with rename and default
  const { name: n, age: a = 0, city = "Unknown" } = { name: "Alice", age: 30 };
  console.log("Ex30 —", n, a, city);
}
function ex31() {
  // Nested destructuring
  const { a: { b: { c } } } = { a: { b: { c: 42 } } };
  console.log("Ex31 — nested:", c);
}
function ex32() {
  // Destructure in function params
  function area({ width, height }) { return width * height; }
  console.log("Ex32 —", area({ width: 5, height: 3 }));
}
function ex33() {
  // Swap with destructuring
  let x = 1, y = 2;
  [x, y] = [y, x];
  console.log("Ex33 — swapped:", x, y);
}
function ex34() {
  // for...of with entries for index
  for (const [i, v] of ["a","b","c"].entries()) {
    console.log(`Ex34 — [${i}]: ${v}`);
  }
}
function ex35() {
  // Object.entries + Map
  const freq = new Map();
  for (const [, val] of Object.entries({ a:1, b:2, c:3 })) freq.set(val, (freq.get(val)||0)+1);
  console.log("Ex35 —", [...freq.entries()]);
}
function ex36() {
  // WeakRef (ES2021)
  const obj = { name: "temporary" };
  const ref = new WeakRef(obj);
  console.log("Ex36 — deref:", ref.deref()?.name);
}
function ex37() {
  // globalThis
  console.log("Ex37 — globalThis type:", typeof globalThis);
}
function ex38() {
  // String methods (ES6+)
  const s = "Hello, World!";
  console.log("Ex38 —",
    s.includes("World"),
    s.startsWith("Hello"),
    s.endsWith("!"),
    s.at(-1)
  );
}
function ex39() {
  // Array methods (ES6+)
  console.log("Ex39 —",
    [1,[2,[3,[4]]]].flat(Infinity),
    [1,2,3].flatMap(x => [x, x*2]),
    Array.from({length:5}, (_,i)=>i+1)
  );
}
function ex40() {
  // Object methods (ES2017+)
  const obj = { a:1, b:2, c:3 };
  console.log("Ex40 —",
    Object.entries(obj),
    Object.fromEntries([["x",1],["y",2]])
  );
}
function ex41() {
  // Promise combinators
  Promise.all([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)])
    .then(results => console.log("Ex41 — Promise.all:", results));
}
function ex42() {
  // Async/await basics
  async function fetchDouble(n) { return n * 2; }
  fetchDouble(21).then(v => console.log("Ex42 — async:", v));
}
function ex43() {
  // Generator function
  function* fibonacci() {
    let a = 0, b = 1;
    while (true) { yield a; [a, b] = [b, a + b]; }
  }
  const gen = fibonacci();
  console.log("Ex43 — fib:", Array.from({length:8}, () => gen.next().value));
}
function ex44() {
  // Tagged template
  function sql(strings, ...vals) {
    return strings.raw.reduce((acc, s, i) => acc + s + (i < vals.length ? `$${i+1}` : ""), "");
  }
  const table = "users", id = 1;
  console.log("Ex44 —", sql`SELECT * FROM ${table} WHERE id = ${id}`);
}
function ex45() {
  // Symbol.iterator custom
  const range = (from, to) => ({
    [Symbol.iterator]() {
      let i = from;
      return { next: () => i <= to ? { value: i++, done: false } : { done: true } };
    }
  });
  console.log("Ex45 —", [...range(1,5)]);
}
function ex46() {
  // Promise.allSettled
  Promise.allSettled([
    Promise.resolve("ok"),
    Promise.reject(new Error("fail")),
    Promise.resolve(42)
  ]).then(results => console.log("Ex46 — allSettled:", results.map(r => r.status)));
}
function ex47() {
  // structuredClone (ES2022)
  const original = { a: 1, b: { c: 2 }, arr: [1,2,3] };
  const clone = structuredClone(original);
  clone.b.c = 99;
  console.log("Ex47 — original.b.c:", original.b.c, "clone.b.c:", clone.b.c);
}
function ex48() {
  // at() method
  const arr = [10, 20, 30, 40, 50];
  console.log("Ex48 — at(0):", arr.at(0), "at(-1):", arr.at(-1), "at(-2):", arr.at(-2));
}
function ex49() {
  // Object.hasOwn (ES2022)
  const obj = { own: true };
  console.log("Ex49 —",
    Object.hasOwn(obj, "own"),      // true
    Object.hasOwn(obj, "toString")  // false
  );
}
function ex50() {
  // Error.cause (ES2022)
  try {
    try { throw new Error("original"); }
    catch (e) { throw new Error("wrapper", { cause: e }); }
  } catch (e) {
    console.log("Ex50 —", e.message, "cause:", e.cause.message);
  }
}

function main() {
  console.log("=".repeat(60));
  console.log("Examples 2.4 — ES6+ Features");
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
