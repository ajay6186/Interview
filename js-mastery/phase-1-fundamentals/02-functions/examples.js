// ============================================================================
// Examples 1.2 — Functions  (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================================

"use strict";

// ─── BASIC (1–13) ────────────────────────────────────────────────────────────

/** Function declaration — hoisted */
function ex01() {
  function add(a, b) { return a + b; }
  console.log("Ex01 —", add(2, 3));
}

/** Function expression — not hoisted */
function ex02() {
  const multiply = function(a, b) { return a * b; };
  console.log("Ex02 —", multiply(4, 5));
}

/** Arrow function — concise body */
function ex03() {
  const square = n => n * n;
  console.log("Ex03 —", square(7));
}

/** Arrow function — block body */
function ex04() {
  const abs = n => {
    if (n < 0) return -n;
    return n;
  };
  console.log("Ex04 —", abs(-5), abs(3));
}

/** Returning an object from arrow (wrap in parens) */
function ex05() {
  const makePoint = (x, y) => ({ x, y });
  console.log("Ex05 —", makePoint(1, 2));
}

/** Default parameters */
function ex06() {
  function greet(name = "World") { return `Hello, ${name}!`; }
  console.log("Ex06 —", greet(), greet("Alice"));
}

/** Default param using previous param */
function ex07() {
  function rect(w, h = w) { return w * h; }
  console.log("Ex07 — square area:", rect(4), "rect area:", rect(3, 5));
}

/** Rest parameters */
function ex08() {
  function sum(...nums) { return nums.reduce((a, b) => a + b, 0); }
  console.log("Ex08 —", sum(1, 2, 3, 4, 5));
}

/** Arguments object (non-arrow) */
function ex09() {
  function logArgs() {
    console.log("Ex09 — arguments length:", arguments.length);
  }
  logArgs(1, 2, 3);
}

/** Function name property */
function ex10() {
  function namedFn() {}
  const expr = function myExpr() {};
  const arrow = () => {};
  console.log("Ex10 —", namedFn.name, expr.name, arrow.name);
}

/** Function length property (arity) */
function ex11() {
  function f(a, b, c) {}
  const g = (x, y) => x + y;
  console.log("Ex11 — f.length:", f.length, "g.length:", g.length);
}

/** Returning a function */
function ex12() {
  function makeMultiplier(n) { return x => x * n; }
  const triple = makeMultiplier(3);
  console.log("Ex12 —", triple(7));
}

/** Immediately Invoked Function Expression (IIFE) */
function ex13() {
  const result = (function() { return 42; })();
  console.log("Ex13 — IIFE result:", result);
}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────────────────────

/** Closure — counter factory */
function ex14() {
  function makeCounter(start = 0) {
    let count = start;
    return { inc: () => ++count, get: () => count };
  }
  const c = makeCounter(10);
  c.inc(); c.inc();
  console.log("Ex14 —", c.get());  // 12
}

/** Higher-order: map-like */
function ex15() {
  function myMap(arr, fn) { return arr.map(fn); }
  console.log("Ex15 —", myMap([1,2,3], x => x ** 2));
}

/** Higher-order: filter-like */
function ex16() {
  function myFilter(arr, pred) { return arr.filter(pred); }
  console.log("Ex16 —", myFilter([1,2,3,4,5,6], n => n % 2 === 0));
}

/** Higher-order: reduce-like */
function ex17() {
  function myReduce(arr, fn, init) { return arr.reduce(fn, init); }
  const product = myReduce([1,2,3,4], (acc, x) => acc * x, 1);
  console.log("Ex17 —", product);
}

/** Compose two functions */
function ex18() {
  const compose = (f, g) => x => f(g(x));
  const double = x => x * 2;
  const addOne = x => x + 1;
  const doubleThenAdd = compose(addOne, double);
  console.log("Ex18 —", doubleThenAdd(5));  // addOne(double(5)) = 11
}

/** Pipe (left-to-right) */
function ex19() {
  const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);
  const transform = pipe(
    x => x * 2,
    x => x + 1,
    x => `Result: ${x}`
  );
  console.log("Ex19 —", transform(5));  // "Result: 11"
}

/** Memoize basic */
function ex20() {
  function memoize(fn) {
    const cache = new Map();
    return function(n) {
      if (cache.has(n)) return cache.get(n);
      const result = fn(n);
      cache.set(n, result);
      return result;
    };
  }
  const slow = n => { return n * 2; };
  const fast = memoize(slow);
  console.log("Ex20 —", fast(21), fast(21)); // both 42
}

/** Once — call at most once */
function ex21() {
  function once(fn) {
    let called = false, result;
    return (...args) => {
      if (!called) { called = true; result = fn(...args); }
      return result;
    };
  }
  const init = once(() => "initialized");
  console.log("Ex21 —", init(), init(), init()); // all "initialized"
}

/** Partial application */
function ex22() {
  function partial(fn, ...preArgs) {
    return (...laterArgs) => fn(...preArgs, ...laterArgs);
  }
  const add = (a, b) => a + b;
  const add10 = partial(add, 10);
  console.log("Ex22 —", add10(5), add10(20));
}

/** Curry (binary) */
function ex23() {
  function curry(fn) {
    return a => b => fn(a, b);
  }
  const add = curry((a, b) => a + b);
  console.log("Ex23 —", add(3)(4));
}

/** Flip — reverse argument order */
function ex24() {
  const flip = fn => (a, b) => fn(b, a);
  const subtract = (a, b) => a - b;
  const flippedSub = flip(subtract);
  console.log("Ex24 —", subtract(10, 3), flippedSub(10, 3)); // 7, -7
}

/** Tap — side effect then pass through */
function ex25() {
  const tap = fn => x => { fn(x); return x; };
  const log = tap(x => console.log("Ex25 — tap:", x));
  const result = [1,2,3].map(log);
  console.log("Ex25 — result:", result);
}

/** applyTwice */
function ex26() {
  const applyTwice = (fn, x) => fn(fn(x));
  const double = x => x * 2;
  console.log("Ex26 —", applyTwice(double, 3));  // 12
}

// ─── NESTED (27–38) ──────────────────────────────────────────────────────────

/** Recursive factorial */
function ex27() {
  function factorial(n) {
    return n <= 1 ? 1 : n * factorial(n - 1);
  }
  console.log("Ex27 —", factorial(6));  // 720
}

/** Recursive Fibonacci */
function ex28() {
  function fib(n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
  }
  console.log("Ex28 —", fib(10));  // 55
}

/** Memoized Fibonacci */
function ex29() {
  function memoFib(n, memo = {}) {
    if (n in memo) return memo[n];
    if (n <= 1) return n;
    return (memo[n] = memoFib(n - 1, memo) + memoFib(n - 2, memo));
  }
  console.log("Ex29 —", memoFib(40));  // 102334155
}

/** Function that returns multiple functions */
function ex30() {
  function makeCalc(base) {
    return {
      add: n => base + n,
      sub: n => base - n,
      mul: n => base * n,
    };
  }
  const calc = makeCalc(10);
  console.log("Ex30 —", calc.add(5), calc.sub(3), calc.mul(4));
}

/** Throttle — max once per interval */
function ex31() {
  function throttle(fn, ms) {
    let last = 0;
    return function(...args) {
      const now = Date.now();
      if (now - last >= ms) { last = now; return fn(...args); }
    };
  }
  const log = throttle(x => x, 1000);
  console.log("Ex31 — throttle:", log("a"), log("b")); // "a", undefined
}

/** Debounce concept (returns fn; demonstrates closure) */
function ex32() {
  function debounce(fn, ms) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  }
  const db = debounce(() => {}, 100);
  console.log("Ex32 — debounce is function:", typeof db === "function");
}

/** Variadic compose (N functions) */
function ex33() {
  const composeN = (...fns) => x => fns.reduceRight((v, f) => f(v), x);
  const transform = composeN(
    x => `[${x}]`,
    x => x.toUpperCase(),
    x => x.trim()
  );
  console.log("Ex33 —", transform("  hello  "));  // "[HELLO]"
}

/** Trampoline for stack-safe recursion */
function ex34() {
  function trampoline(fn) {
    return function(...args) {
      let result = fn(...args);
      while (typeof result === "function") result = result();
      return result;
    };
  }
  function loop(n, acc = 0) {
    if (n === 0) return acc;
    return () => loop(n - 1, acc + n);
  }
  const safeLoop = trampoline(loop);
  console.log("Ex34 —", safeLoop(1000));  // 500500
}

/** Function overloading via arguments */
function ex35() {
  function greet(nameOrObj) {
    if (typeof nameOrObj === "string") return `Hello, ${nameOrObj}!`;
    return `Hello, ${nameOrObj.first} ${nameOrObj.last}!`;
  }
  console.log("Ex35 —", greet("Alice"), greet({ first: "Bob", last: "Smith" }));
}

/** Async function returns Promise */
function ex36() {
  async function fetchValue() { return 42; }
  fetchValue().then(v => console.log("Ex36 — async value:", v));
}

/** Generator function basics */
function ex37() {
  function* range(start, end) {
    for (let i = start; i < end; i++) yield i;
  }
  console.log("Ex37 —", [...range(0, 5)]);
}

/** Tagged template function */
function ex38() {
  function highlight(strings, ...vals) {
    return strings.reduce((acc, str, i) =>
      acc + str + (vals[i] !== undefined ? `**${vals[i]}**` : ""), "");
  }
  const name = "Alice", score = 95;
  console.log("Ex38 —", highlight`${name} scored ${score} points`);
}

// ─── ADVANCED (39–50) ────────────────────────────────────────────────────────

/** Auto-curry for any arity */
function ex39() {
  function autoCurry(fn) {
    return function curried(...args) {
      if (args.length >= fn.length) return fn(...args);
      return (...more) => curried(...args, ...more);
    };
  }
  const add3 = autoCurry((a, b, c) => a + b + c);
  console.log("Ex39 —", add3(1)(2)(3), add3(1, 2)(3), add3(1)(2, 3));
}

/** Transducer concept */
function ex40() {
  const mapT = fn => reducer => (acc, val) => reducer(acc, fn(val));
  const filterT = pred => reducer => (acc, val) => pred(val) ? reducer(acc, val) : acc;
  const append = (acc, val) => [...acc, val];
  const xform = filterT(x => x % 2 === 0)(mapT(x => x * 10)(append));
  const result = [1,2,3,4,5].reduce(xform, []);
  console.log("Ex40 —", result);  // [20, 40]
}

/** Y-combinator (for anonymous recursion) */
function ex41() {
  const Y = f => (x => f(v => x(x)(v)))(x => f(v => x(x)(v)));
  const fac = Y(self => n => n <= 1 ? 1 : n * self(n - 1));
  console.log("Ex41 — Y fac(5):", fac(5));
}

/** Curried lens (get/set) */
function ex42() {
  const lens = (getter, setter) => ({ get: getter, set: setter });
  const view = l => obj => l.get(obj);
  const set = l => val => obj => l.set(val, obj);
  const nameLens = lens(o => o.name, (v, o) => ({ ...o, name: v }));
  const obj = { name: "Alice", age: 30 };
  console.log("Ex42 — view:", view(nameLens)(obj), "set:", set(nameLens)("Bob")(obj));
}

/** Function composition type checking */
function ex43() {
  function safeCompose(...fns) {
    return x => {
      let result = x;
      for (let i = fns.length - 1; i >= 0; i--) {
        result = fns[i](result);
      }
      return result;
    };
  }
  const transform = safeCompose(x => x * 2, x => x + 1, x => x * 3);
  console.log("Ex43 —", transform(2));  // ((2*3)+1)*2 = 14
}

/** Continuation-passing style */
function ex44() {
  function addCPS(a, b, k) { k(a + b); }
  function mulCPS(a, b, k) { k(a * b); }
  addCPS(3, 4, sum => mulCPS(sum, 2, result => console.log("Ex44 — CPS:", result)));
}

/** Lazy evaluation with thunks */
function ex45() {
  const thunk = fn => () => fn();
  const lazyBig = thunk(() => { return 2 ** 32; });
  console.log("Ex45 — thunk:", lazyBig());
}

/** Monad-like container (Maybe) */
function ex46() {
  class Maybe {
    constructor(val) { this.val = val; }
    static of(val) { return new Maybe(val); }
    map(fn) { return this.val == null ? this : Maybe.of(fn(this.val)); }
    getOrElse(def) { return this.val == null ? def : this.val; }
  }
  const result = Maybe.of(5).map(x => x * 2).map(x => x + 1).getOrElse(0);
  const nullResult = Maybe.of(null).map(x => x * 2).getOrElse(-1);
  console.log("Ex46 —", result, nullResult);
}

/** Pipe with async steps */
function ex47() {
  const pipeAsync = (...fns) => x => fns.reduce((p, f) => p.then(f), Promise.resolve(x));
  pipeAsync(
    x => x * 2,
    x => Promise.resolve(x + 1),
    x => `result: ${x}`
  )(5).then(v => console.log("Ex47 —", v));
}

/** Function mixin pattern */
function ex48() {
  const Serializable = (superclass) => class extends superclass {
    serialize() { return JSON.stringify(this); }
  };
  const Validatable = (superclass) => class extends superclass {
    isValid() { return Object.keys(this).length > 0; }
  };
  class Base { constructor(data) { Object.assign(this, data); } }
  class Model extends Serializable(Validatable(Base)) {}
  const m = new Model({ name: "Alice" });
  console.log("Ex48 —", m.serialize(), m.isValid());
}

/** Church encoding of booleans */
function ex49() {
  const TRUE = a => b => a;
  const FALSE = a => b => b;
  const IF = cond => t => f => cond(t)(f);
  const AND = a => b => IF(a)(b)(FALSE);
  console.log("Ex49 — church TRUE:", IF(TRUE)("yes")("no"));
  console.log("Ex49 — church AND T T:", IF(AND(TRUE)(TRUE))("yes")("no"));
  console.log("Ex49 — church AND T F:", IF(AND(TRUE)(FALSE))("yes")("no"));
}

/** Full function toolkit summary */
function ex50() {
  const identity = x => x;
  const constant = x => () => x;
  const flip = fn => (a, b) => fn(b, a);
  const always42 = constant(42);
  const flippedDiv = flip((a, b) => a / b);
  console.log("Ex50 —",
    identity("hello"),
    always42(),
    flippedDiv(2, 10)  // 10/2 = 5
  );
}

function main() {
  console.log("=".repeat(60));
  console.log("Examples 1.2 — Functions");
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
