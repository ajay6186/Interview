// ============================================================================
// Examples 1.5 — Control Flow  (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================================

"use strict";

// ─── BASIC (1–13) ────────────────────────────────────────────────────────────

/** if/else basic */
function ex01() {
  const x = 10;
  if (x > 5) console.log("Ex01 — greater than 5");
  else console.log("Ex01 — 5 or less");
}

/** if/else if/else chain */
function ex02() {
  function classify(n) {
    if (n > 0) return "positive";
    else if (n < 0) return "negative";
    else return "zero";
  }
  console.log("Ex02 —", classify(3), classify(-1), classify(0));
}

/** Ternary operator */
function ex03() {
  const age = 20;
  const status = age >= 18 ? "adult" : "minor";
  console.log("Ex03 —", status);
}

/** switch/case */
function ex04() {
  function dayName(d) {
    switch (d) {
      case 0: return "Sunday";
      case 1: return "Monday";
      case 6: return "Saturday";
      default: return "Weekday";
    }
  }
  console.log("Ex04 —", dayName(0), dayName(1), dayName(3), dayName(6));
}

/** switch fall-through */
function ex05() {
  function season(month) {
    switch (month) {
      case 12: case 1: case 2: return "Winter";
      case 3: case 4: case 5: return "Spring";
      case 6: case 7: case 8: return "Summer";
      default: return "Autumn";
    }
  }
  console.log("Ex05 —", season(1), season(4), season(7), season(10));
}

/** Basic for loop */
function ex06() {
  const result = [];
  for (let i = 0; i < 5; i++) result.push(i * i);
  console.log("Ex06 —", result);
}

/** while loop */
function ex07() {
  let n = 1, result = [];
  while (n <= 32) { result.push(n); n *= 2; }
  console.log("Ex07 —", result);
}

/** do...while */
function ex08() {
  let i = 0, result = [];
  do { result.push(i); i++; } while (i < 5);
  console.log("Ex08 —", result);
}

/** for...of with array */
function ex09() {
  const fruits = ["apple", "banana", "cherry"];
  const upper = [];
  for (const f of fruits) upper.push(f.toUpperCase());
  console.log("Ex09 —", upper);
}

/** for...in with object */
function ex10() {
  const obj = { a: 1, b: 2, c: 3 };
  const keys = [];
  for (const k in obj) { if (Object.hasOwn(obj, k)) keys.push(k); }
  console.log("Ex10 —", keys);
}

/** break in loop */
function ex11() {
  let found = -1;
  const arr = [5, 3, 8, 1, 9, 2];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > 7) { found = i; break; }
  }
  console.log("Ex11 — first index > 7:", found);
}

/** continue in loop */
function ex12() {
  const result = [];
  for (let i = 0; i < 10; i++) {
    if (i % 2 === 0) continue;
    result.push(i);
  }
  console.log("Ex12 — odd nums:", result);
}

/** Nested for loops (multiplication table) */
function ex13() {
  const table = [];
  for (let i = 1; i <= 3; i++) {
    const row = [];
    for (let j = 1; j <= 3; j++) row.push(i * j);
    table.push(row);
  }
  console.log("Ex13 — 3x3 table:", table);
}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────────────────────

/** Short-circuit AND */
function ex14() {
  const user = { name: "Alice", role: "admin" };
  const isAdmin = user && user.role === "admin";
  console.log("Ex14 —", isAdmin);
}

/** Short-circuit OR for defaults */
function ex15() {
  function greet(name) { return `Hello, ${name || "Guest"}!`; }
  console.log("Ex15 —", greet("Alice"), greet(""), greet(null));
}

/** Nullish coalescing ?? */
function ex16() {
  function getPort(config) { return config.port ?? 3000; }
  console.log("Ex16 —", getPort({ port: 8080 }), getPort({ port: 0 }), getPort({}));
}

/** Optional chaining ?. */
function ex17() {
  const obj = { a: { b: { c: 42 } } };
  console.log("Ex17 —", obj?.a?.b?.c, obj?.x?.y?.z, obj?.a?.b?.c?.toString());
}

/** Labeled break */
function ex18() {
  let result = [];
  outer: for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (i === 1 && j === 1) break outer;
      result.push([i, j]);
    }
  }
  console.log("Ex18 — labeled break:", result);
}

/** Labeled continue */
function ex19() {
  const result = [];
  outer: for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (j === 1) continue outer;
      result.push([i, j]);
    }
  }
  console.log("Ex19 — labeled continue:", result);
}

/** FizzBuzz array */
function ex20() {
  const result = [];
  for (let i = 1; i <= 20; i++) {
    if (i % 15 === 0) result.push("FizzBuzz");
    else if (i % 3 === 0) result.push("Fizz");
    else if (i % 5 === 0) result.push("Buzz");
    else result.push(i);
  }
  console.log("Ex20 — FizzBuzz:", result);
}

/** for...of with index using entries() */
function ex21() {
  const arr = ["a", "b", "c"];
  for (const [i, v] of arr.entries()) {
    console.log(`Ex21 — [${i}]: ${v}`);
  }
}

/** for...of with Map */
function ex22() {
  const map = new Map([["a", 1], ["b", 2], ["c", 3]]);
  for (const [key, val] of map) {
    console.log(`Ex22 — ${key} = ${val}`);
  }
}

/** while with complex condition */
function ex23() {
  function collatz(n) {
    const seq = [n];
    while (n !== 1) {
      n = n % 2 === 0 ? n / 2 : 3 * n + 1;
      seq.push(n);
    }
    return seq;
  }
  console.log("Ex23 — Collatz(6):", collatz(6));
}

/** switch with return (no break needed) */
function ex24() {
  function httpStatus(code) {
    switch (true) {
      case code >= 500: return "Server Error";
      case code >= 400: return "Client Error";
      case code >= 300: return "Redirect";
      case code >= 200: return "Success";
      default: return "Unknown";
    }
  }
  console.log("Ex24 —", httpStatus(200), httpStatus(404), httpStatus(500));
}

/** Early return pattern */
function ex25() {
  function processUser(user) {
    if (!user) return "No user";
    if (!user.active) return "Inactive";
    if (!user.email) return "No email";
    return `Processing ${user.email}`;
  }
  console.log("Ex25 —",
    processUser(null),
    processUser({ active: false }),
    processUser({ active: true, email: "a@b.com" })
  );
}

/** Guard clauses pattern */
function ex26() {
  function divide(a, b) {
    if (typeof a !== "number") throw new TypeError("a must be a number");
    if (typeof b !== "number") throw new TypeError("b must be a number");
    if (b === 0) throw new RangeError("division by zero");
    return a / b;
  }
  try {
    console.log("Ex26 —", divide(10, 2), divide(7, 3).toFixed(4));
    divide(1, 0);
  } catch (e) {
    console.log("Ex26 — caught:", e.message);
  }
}

// ─── NESTED (27–38) ──────────────────────────────────────────────────────────

/** Binary search */
function ex27() {
  function binarySearch(arr, target) {
    let lo = 0, hi = arr.length - 1;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (arr[mid] === target) return mid;
      if (arr[mid] < target) lo = mid + 1;
      else hi = mid - 1;
    }
    return -1;
  }
  const sorted = [1,3,5,7,9,11,13,15];
  console.log("Ex27 —", binarySearch(sorted, 7), binarySearch(sorted, 6));
}

/** Bubble sort */
function ex28() {
  function bubbleSort(arr) {
    const a = [...arr];
    for (let i = 0; i < a.length; i++)
      for (let j = 0; j < a.length - i - 1; j++)
        if (a[j] > a[j+1]) [a[j], a[j+1]] = [a[j+1], a[j]];
    return a;
  }
  console.log("Ex28 —", bubbleSort([5,3,8,1,9,2]));
}

/** Prime check */
function ex29() {
  function isPrime(n) {
    if (n < 2) return false;
    for (let i = 2; i <= Math.sqrt(n); i++)
      if (n % i === 0) return false;
    return true;
  }
  const primes = [];
  for (let i = 2; i <= 30; i++) if (isPrime(i)) primes.push(i);
  console.log("Ex29 — primes to 30:", primes);
}

/** Nested loops: matrix multiply */
function ex30() {
  function matMul(A, B) {
    const rows = A.length, cols = B[0].length, inner = B.length;
    const C = Array.from({length: rows}, () => new Array(cols).fill(0));
    for (let i = 0; i < rows; i++)
      for (let j = 0; j < cols; j++)
        for (let k = 0; k < inner; k++)
          C[i][j] += A[i][k] * B[k][j];
    return C;
  }
  const A = [[1,2],[3,4]], B = [[5,6],[7,8]];
  console.log("Ex30 —", matMul(A, B));
}

/** State machine via switch */
function ex31() {
  function trafficLight(state, action) {
    switch (state) {
      case "red": return action === "timer" ? "green" : state;
      case "green": return action === "timer" ? "yellow" : state;
      case "yellow": return action === "timer" ? "red" : state;
      default: return "red";
    }
  }
  let light = "red";
  for (let i = 0; i < 4; i++) {
    light = trafficLight(light, "timer");
    console.log(`Ex31 — light: ${light}`);
  }
}

/** try/catch/finally in control flow */
function ex32() {
  function safeDivide(a, b) {
    try {
      if (b === 0) throw new Error("Division by zero");
      return { ok: true, value: a / b };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }
  console.log("Ex32 —", safeDivide(10, 2), safeDivide(10, 0));
}

/** Reduce as loop replacement */
function ex33() {
  const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const { sum, count, max } = data.reduce((acc, x) => ({
    sum: acc.sum + x,
    count: acc.count + 1,
    max: Math.max(acc.max, x)
  }), { sum: 0, count: 0, max: -Infinity });
  console.log("Ex33 — sum:", sum, "count:", count, "max:", max);
}

/** Generator as lazy range */
function ex34() {
  function* range(start, end, step = 1) {
    for (let i = start; i < end; i += step) yield i;
  }
  console.log("Ex34 — range(0,10,2):", [...range(0, 10, 2)]);
}

/** Recursive DFS on tree */
function ex35() {
  function dfs(node) {
    const result = [node.val];
    for (const child of (node.children || [])) result.push(...dfs(child));
    return result;
  }
  const tree = { val: 1, children: [
    { val: 2, children: [{ val: 4 }, { val: 5 }] },
    { val: 3, children: [{ val: 6 }] }
  ]};
  console.log("Ex35 — DFS:", dfs(tree));
}

/** BFS on tree using queue */
function ex36() {
  function bfs(root) {
    const result = [], queue = [root];
    while (queue.length) {
      const node = queue.shift();
      result.push(node.val);
      for (const child of (node.children || [])) queue.push(child);
    }
    return result;
  }
  const tree = { val: 1, children: [
    { val: 2, children: [{ val: 4 }, { val: 5 }] },
    { val: 3 }
  ]};
  console.log("Ex36 — BFS:", bfs(tree));
}

/** Loop with early termination returning result */
function ex37() {
  function findPair(arr, target) {
    const seen = new Set();
    for (const n of arr) {
      if (seen.has(target - n)) return [target - n, n];
      seen.add(n);
    }
    return null;
  }
  console.log("Ex37 —", findPair([2, 7, 11, 15], 9), findPair([1, 2, 3], 100));
}

/** Infinite loop with break */
function ex38() {
  function firstPerfect(above) {
    let n = above + 1;
    while (true) {
      const divisors = [];
      for (let i = 1; i < n; i++) if (n % i === 0) divisors.push(i);
      if (divisors.reduce((a,b)=>a+b,0) === n) return n;
      n++;
    }
  }
  console.log("Ex38 — first perfect > 0:", firstPerfect(0)); // 6
}

// ─── ADVANCED (39–50) ────────────────────────────────────────────────────────

/** Pattern matching simulation */
function ex39() {
  function match(value, patterns) {
    for (const [predicate, handler] of patterns) {
      if (predicate(value)) return handler(value);
    }
    throw new Error("No pattern matched");
  }
  const result = match(42, [
    [x => x < 0, x => `negative: ${x}`],
    [x => x === 0, () => "zero"],
    [x => x > 0, x => `positive: ${x}`],
  ]);
  console.log("Ex39 —", result);
}

/** Lazy evaluation with short-circuit */
function ex40() {
  let calls = 0;
  const expensive = () => { calls++; return true; };
  const result = false && expensive(); // expensive never called
  console.log("Ex40 — result:", result, "calls:", calls);
}

/** Strategy pattern via switch */
function ex41() {
  function sort(arr, strategy = "asc") {
    const strategies = {
      asc: (a, b) => a - b,
      desc: (a, b) => b - a,
      len: (a, b) => a.toString().length - b.toString().length,
    };
    return [...arr].sort(strategies[strategy]);
  }
  console.log("Ex41 — asc:", sort([3,1,4,1,5,9,2]));
  console.log("Ex41 — desc:", sort([3,1,4,1,5,9,2], "desc"));
}

/** Trampoline for deep recursion */
function ex42() {
  function trampoline(fn) {
    return (...args) => {
      let res = fn(...args);
      while (typeof res === "function") res = res();
      return res;
    };
  }
  const sum = trampoline(function s(n, acc = 0) {
    return n <= 0 ? acc : () => s(n - 1, acc + n);
  });
  console.log("Ex42 — sum 10000:", sum(10000));
}

/** Coroutine via generator */
function ex43() {
  function* coroutine() {
    const x = yield "give me x";
    const y = yield "give me y";
    return x + y;
  }
  const gen = coroutine();
  console.log("Ex43 —", gen.next().value);    // "give me x"
  console.log("Ex43 —", gen.next(10).value);  // "give me y"
  console.log("Ex43 —", gen.next(20).value);  // 30
}

/** Finite state machine class */
function ex44() {
  class FSM {
    #state;
    #transitions;
    constructor(initial, transitions) {
      this.#state = initial;
      this.#transitions = transitions;
    }
    dispatch(event) {
      const next = this.#transitions[this.#state]?.[event];
      if (!next) throw new Error(`No transition from ${this.#state} on ${event}`);
      this.#state = next;
      return this;
    }
    get state() { return this.#state; }
  }
  const door = new FSM("closed", {
    closed: { open: "opened" },
    opened: { close: "closed", lock: "locked" },
    locked: { unlock: "opened" },
  });
  door.dispatch("open").dispatch("lock");
  console.log("Ex44 — door state:", door.state);
}

/** Exception-based control flow */
function ex45() {
  class StopIteration extends Error {}
  function processAll(items) {
    const results = [];
    try {
      for (const item of items) {
        if (item === null) throw new StopIteration("null found");
        results.push(item * 2);
      }
    } catch (e) {
      if (!(e instanceof StopIteration)) throw e;
      results.push("STOPPED");
    }
    return results;
  }
  console.log("Ex45 —", processAll([1, 2, null, 3, 4]));
}

/** Async iteration pattern (simulated) */
function ex46() {
  async function* asyncRange(n) {
    for (let i = 0; i < n; i++) {
      await Promise.resolve(); // simulate async work
      yield i;
    }
  }
  (async () => {
    const result = [];
    for await (const x of asyncRange(5)) result.push(x);
    console.log("Ex46 — async range:", result);
  })();
}

/** Loop performance: chunked processing */
function ex47() {
  function processChunks(arr, chunkSize, fn) {
    const results = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
      const chunk = arr.slice(i, i + chunkSize);
      results.push(fn(chunk));
    }
    return results;
  }
  const data = Array.from({length: 10}, (_, i) => i + 1);
  console.log("Ex47 —", processChunks(data, 3, chunk => chunk.reduce((a,b)=>a+b,0)));
}

/** while with timeout guard */
function ex48() {
  function retry(fn, maxAttempts) {
    let attempt = 0;
    while (attempt < maxAttempts) {
      try {
        return fn(attempt);
      } catch {
        attempt++;
      }
    }
    throw new Error(`Failed after ${maxAttempts} attempts`);
  }
  const result = retry(n => {
    if (n < 2) throw new Error("not yet");
    return `success on attempt ${n}`;
  }, 5);
  console.log("Ex48 —", result);
}

/** for...of with destructuring */
function ex49() {
  const users = [
    { id: 1, name: "Alice", role: "admin" },
    { id: 2, name: "Bob", role: "user" },
    { id: 3, name: "Carol", role: "admin" },
  ];
  const admins = [];
  for (const { id, name, role } of users) {
    if (role === "admin") admins.push({ id, name });
  }
  console.log("Ex49 —", admins);
}

/** Iterator protocol in for...of */
function ex50() {
  const range = {
    from: 1, to: 5,
    [Symbol.iterator]() {
      let current = this.from;
      const last = this.to;
      return {
        next() {
          return current <= last
            ? { value: current++, done: false }
            : { value: undefined, done: true };
        }
      };
    }
  };
  console.log("Ex50 — custom iterable:", [...range]);
}

function main() {
  console.log("=".repeat(60));
  console.log("Examples 1.5 — Control Flow");
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
