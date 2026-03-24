// ============================================================================
// Examples 1.3 — Arrays  (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================================

"use strict";

// ─── BASIC (1–13) ────────────────────────────────────────────────────────────

/** Array literal */
function ex01() { console.log("Ex01 —", [1, 2, 3]); }

/** Array.of */
function ex02() { console.log("Ex02 —", Array.of(1, 2, 3)); }

/** Array.from string */
function ex03() { console.log("Ex03 —", Array.from("hello")); }

/** Array.from with map */
function ex04() { console.log("Ex04 —", Array.from({length: 5}, (_, i) => i * 2)); }

/** push and pop */
function ex05() {
  const a = [1, 2, 3];
  a.push(4);
  const popped = a.pop();
  console.log("Ex05 — after push/pop:", a, "popped:", popped);
}

/** shift and unshift */
function ex06() {
  const a = [1, 2, 3];
  a.unshift(0);
  const shifted = a.shift();
  console.log("Ex06 — shifted:", shifted, "arr:", a);
}

/** length property */
function ex07() {
  const a = [10, 20, 30, 40];
  console.log("Ex07 — length:", a.length, "last:", a[a.length - 1], "at(-1):", a.at(-1));
}

/** indexOf and lastIndexOf */
function ex08() {
  const a = [1, 2, 3, 2, 1];
  console.log("Ex08 — indexOf(2):", a.indexOf(2), "lastIndexOf(2):", a.lastIndexOf(2));
}

/** includes */
function ex09() {
  const a = [1, 2, 3, NaN];
  console.log("Ex09 — includes(2):", a.includes(2), "includes(NaN):", a.includes(NaN));
}

/** slice (no mutation) */
function ex10() {
  const a = [1, 2, 3, 4, 5];
  console.log("Ex10 — slice(1,3):", a.slice(1, 3), "slice(-2):", a.slice(-2));
}

/** concat */
function ex11() {
  const a = [1, 2];
  const b = [3, 4];
  console.log("Ex11 —", a.concat(b), a.concat([5], [6, 7]));
}

/** join */
function ex12() {
  const a = ["a", "b", "c"];
  console.log("Ex12 —", a.join("-"), a.join(""), a.join());
}

/** spread to copy and merge */
function ex13() {
  const a = [1, 2, 3];
  const copy = [...a];
  const merged = [...a, ...a];
  copy.push(99);
  console.log("Ex13 — original:", a, "copy:", copy, "merged:", merged);
}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────────────────────

/** map */
function ex14() {
  const nums = [1, 2, 3, 4, 5];
  console.log("Ex14 —", nums.map(x => x ** 2));
}

/** filter */
function ex15() {
  const nums = [1, 2, 3, 4, 5, 6];
  console.log("Ex15 —", nums.filter(x => x % 2 === 0));
}

/** reduce to sum */
function ex16() {
  const nums = [1, 2, 3, 4, 5];
  console.log("Ex16 —", nums.reduce((acc, x) => acc + x, 0));
}

/** reduce to object (count occurrences) */
function ex17() {
  const words = ["a", "b", "a", "c", "b", "a"];
  const counts = words.reduce((acc, w) => {
    acc[w] = (acc[w] || 0) + 1;
    return acc;
  }, {});
  console.log("Ex17 —", counts);
}

/** find and findIndex */
function ex18() {
  const users = [{id:1,name:"Alice"},{id:2,name:"Bob"},{id:3,name:"Carol"}];
  console.log("Ex18 — find:", users.find(u => u.id === 2));
  console.log("Ex18 — findIndex:", users.findIndex(u => u.name === "Carol"));
}

/** some and every */
function ex19() {
  const nums = [2, 4, 6, 8];
  console.log("Ex19 — every even:", nums.every(x => x % 2 === 0));
  console.log("Ex19 — some > 5:", nums.some(x => x > 5));
}

/** flat and flatMap */
function ex20() {
  const nested = [[1, 2], [3, [4, 5]]];
  console.log("Ex20 — flat(1):", nested.flat());
  console.log("Ex20 — flat(Infinity):", nested.flat(Infinity));
  const sentences = ["hello world", "foo bar"];
  console.log("Ex20 — flatMap words:", sentences.flatMap(s => s.split(" ")));
}

/** sort (default and comparator) */
function ex21() {
  const nums = [10, 1, 5, 3, 8];
  console.log("Ex21 — default sort:", [...nums].sort());
  console.log("Ex21 — numeric sort:", [...nums].sort((a, b) => a - b));
}

/** reverse (copy) */
function ex22() {
  const a = [1, 2, 3, 4, 5];
  console.log("Ex22 — reversed:", [...a].reverse(), "original:", a);
}

/** splice (mutation) */
function ex23() {
  const a = [1, 2, 3, 4, 5];
  const removed = a.splice(1, 2, 10, 20);
  console.log("Ex23 — after splice:", a, "removed:", removed);
}

/** fill */
function ex24() {
  console.log("Ex24 —",
    new Array(5).fill(0),
    [1,2,3,4,5].fill(0, 2, 4)
  );
}

/** forEach (side effects) */
function ex25() {
  const results = [];
  [1, 2, 3].forEach((x, i) => results.push(`${i}:${x}`));
  console.log("Ex25 —", results);
}

/** entries, keys, values iterators */
function ex26() {
  const a = ["a", "b", "c"];
  console.log("Ex26 — entries:", [...a.entries()]);
  console.log("Ex26 — keys:", [...a.keys()]);
  console.log("Ex26 — values:", [...a.values()]);
}

// ─── NESTED (27–38) ──────────────────────────────────────────────────────────

/** Chaining: filter → map → reduce */
function ex27() {
  const result = [1,2,3,4,5,6,7,8,9,10]
    .filter(x => x % 2 === 0)
    .map(x => x ** 2)
    .reduce((acc, x) => acc + x, 0);
  console.log("Ex27 — chain:", result);  // 4+16+36+64+100 = 220
}

/** groupBy using reduce */
function ex28() {
  function groupBy(arr, fn) {
    return arr.reduce((groups, item) => {
      const key = fn(item);
      (groups[key] = groups[key] || []).push(item);
      return groups;
    }, {});
  }
  const people = [{age:20},{age:25},{age:20},{age:30},{age:25}];
  console.log("Ex28 —", groupBy(people, p => p.age));
}

/** partition using reduce */
function ex29() {
  function partition(arr, pred) {
    return arr.reduce(([pass, fail], x) =>
      pred(x) ? [[...pass, x], fail] : [pass, [...fail, x]], [[], []]);
  }
  const [evens, odds] = partition([1,2,3,4,5,6], x => x % 2 === 0);
  console.log("Ex29 — evens:", evens, "odds:", odds);
}

/** zip two arrays */
function ex30() {
  function zip(a, b) { return a.map((x, i) => [x, b[i]]); }
  console.log("Ex30 —", zip([1,2,3], ["a","b","c"]));
}

/** chunk array */
function ex31() {
  function chunk(arr, size) {
    const result = [];
    for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
    return result;
  }
  console.log("Ex31 —", chunk([1,2,3,4,5,6,7], 3));
}

/** unique values */
function ex32() {
  const a = [1,2,2,3,3,3,4];
  console.log("Ex32 — unique:", [...new Set(a)]);
}

/** intersection of two arrays */
function ex33() {
  function intersect(a, b) {
    const setB = new Set(b);
    return a.filter(x => setB.has(x));
  }
  console.log("Ex33 —", intersect([1,2,3,4], [2,4,6]));
}

/** difference of two arrays */
function ex34() {
  function difference(a, b) {
    const setB = new Set(b);
    return a.filter(x => !setB.has(x));
  }
  console.log("Ex34 —", difference([1,2,3,4,5], [2,4]));
}

/** flatten deep */
function ex35() {
  function flatDeep(arr) { return arr.flat(Infinity); }
  console.log("Ex35 —", flatDeep([1,[2,[3,[4,[5]]]]]));
}

/** rotate array by n positions */
function ex36() {
  function rotate(arr, n) {
    const len = arr.length;
    const k = ((n % len) + len) % len;
    return [...arr.slice(k), ...arr.slice(0, k)];
  }
  console.log("Ex36 —", rotate([1,2,3,4,5], 2));  // [3,4,5,1,2]
}

/** matrix transpose */
function ex37() {
  function transpose(matrix) {
    return matrix[0].map((_, colIdx) => matrix.map(row => row[colIdx]));
  }
  const m = [[1,2,3],[4,5,6],[7,8,9]];
  console.log("Ex37 —", transpose(m));
}

/** sliding window */
function ex38() {
  function windows(arr, size) {
    return arr.slice(size - 1).map((_, i) => arr.slice(i, i + size));
  }
  console.log("Ex38 —", windows([1,2,3,4,5], 3));
}

// ─── ADVANCED (39–50) ────────────────────────────────────────────────────────

/** Array.from with Set for dedup */
function ex39() {
  const unique = arr => Array.from(new Set(arr));
  console.log("Ex39 —", unique([1,2,2,3,3,3]));
}

/** Flatten and unique (flatMap + Set) */
function ex40() {
  const data = [[1,2,3],[2,3,4],[3,4,5]];
  const result = [...new Set(data.flat())];
  console.log("Ex40 —", result);
}

/** Cartesian product */
function ex41() {
  function cartesian(a, b) {
    return a.flatMap(x => b.map(y => [x, y]));
  }
  console.log("Ex41 —", cartesian([1,2], ["a","b"]));
}

/** Array diff (deep equal objects) */
function ex42() {
  function diffBy(a, b, key) {
    const setB = new Set(b.map(x => x[key]));
    return a.filter(x => !setB.has(x[key]));
  }
  const a = [{id:1},{id:2},{id:3}];
  const b = [{id:2}];
  console.log("Ex42 —", diffBy(a, b, "id"));
}

/** Scan (running reduce) */
function ex43() {
  function scan(arr, fn, init) {
    const result = [init];
    arr.forEach(x => result.push(fn(result.at(-1), x)));
    return result;
  }
  console.log("Ex43 —", scan([1,2,3,4,5], (a,b) => a + b, 0));
}

/** Unfold (expand array from seed) */
function ex44() {
  function unfold(fn, seed) {
    const result = [];
    let val = seed;
    while (true) {
      const next = fn(val);
      if (next === false) break;
      result.push(next[0]);
      val = next[1];
    }
    return result;
  }
  const fib = unfold(([a,b]) => b > 100 ? false : [a, [b, a+b]], [0,1]);
  console.log("Ex44 — fibonacci:", fib);
}

/** Array as stack */
function ex45() {
  class Stack {
    #data = [];
    push(v) { this.#data.push(v); return this; }
    pop() { return this.#data.pop(); }
    peek() { return this.#data.at(-1); }
    get size() { return this.#data.length; }
  }
  const s = new Stack();
  s.push(1).push(2).push(3);
  console.log("Ex45 — peek:", s.peek(), "pop:", s.pop(), "size:", s.size);
}

/** Array as queue */
function ex46() {
  class Queue {
    #data = [];
    enqueue(v) { this.#data.push(v); return this; }
    dequeue() { return this.#data.shift(); }
    get size() { return this.#data.length; }
    get front() { return this.#data[0]; }
  }
  const q = new Queue();
  q.enqueue(1).enqueue(2).enqueue(3);
  console.log("Ex46 — front:", q.front, "dequeue:", q.dequeue(), "size:", q.size);
}

/** Lazy array using generator */
function ex47() {
  function* lazyMap(arr, fn) { for (const x of arr) yield fn(x); }
  function* lazyFilter(iterable, pred) { for (const x of iterable) if (pred(x)) yield x; }
  const result = [...lazyFilter(lazyMap([1,2,3,4,5], x => x * 2), x => x > 4)];
  console.log("Ex47 — lazy chain:", result);
}

/** findLast and findLastIndex (ES2023) */
function ex48() {
  const a = [1, 2, 3, 4, 5, 2, 1];
  console.log("Ex48 — findLast:", a.findLast(x => x < 3));
  console.log("Ex48 — findLastIndex:", a.findLastIndex(x => x < 3));
}

/** toSorted, toReversed, toSpliced (non-mutating, ES2023) */
function ex49() {
  const a = [3,1,4,1,5,9,2,6];
  console.log("Ex49 — toSorted:", a.toSorted((x,y) => x - y));
  console.log("Ex49 — toReversed:", a.toReversed());
  console.log("Ex49 — original:", a); // unchanged
}

/** with() non-mutating index update (ES2023) */
function ex50() {
  const a = [1, 2, 3, 4, 5];
  const updated = a.with(2, 99);
  console.log("Ex50 — with:", updated, "original:", a);
}

function main() {
  console.log("=".repeat(60));
  console.log("Examples 1.3 — Arrays");
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
