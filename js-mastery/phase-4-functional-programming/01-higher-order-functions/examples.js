// ============================================================================
// Examples 4.1 — Higher-Order Functions  (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================================
"use strict";

// ─── BASIC (1–13) ────────────────────────────────────────────────────────────

/** map: double each element */
function ex01() {
  const nums = [1, 2, 3, 4, 5];
  const doubled = nums.map(x => x * 2);
  console.log("Ex01 — map double:", doubled);
}

/** filter: keep only even numbers */
function ex02() {
  const nums = [1, 2, 3, 4, 5, 6];
  const evens = nums.filter(x => x % 2 === 0);
  console.log("Ex02 — filter evens:", evens);
}

/** reduce: sum all elements */
function ex03() {
  const nums = [1, 2, 3, 4, 5];
  const sum = nums.reduce((acc, n) => acc + n, 0);
  console.log("Ex03 — reduce sum:", sum);
}

/** forEach: side-effect iteration */
function ex04() {
  const fruits = ["apple", "banana", "cherry"];
  const collected = [];
  fruits.forEach(f => collected.push(f.toUpperCase()));
  console.log("Ex04 — forEach uppercase:", collected);
}

/** find: first element matching predicate */
function ex05() {
  const users = [{id:1,name:"Alice"},{id:2,name:"Bob"},{id:3,name:"Charlie"}];
  const found = users.find(u => u.id === 2);
  console.log("Ex05 — find by id:", found);
}

/** findIndex: index of first match */
function ex06() {
  const scores = [42, 78, 91, 55, 100];
  const idx = scores.findIndex(s => s >= 90);
  console.log("Ex06 — findIndex >= 90:", idx);
}

/** some: at least one element passes */
function ex07() {
  const nums = [1, 3, 5, 7, 8];
  const hasEven = nums.some(x => x % 2 === 0);
  console.log("Ex07 — some even:", hasEven);
}

/** every: all elements pass */
function ex08() {
  const passwords = ["abc123", "xyz789", "def456"];
  const allHaveDigit = passwords.every(p => /\d/.test(p));
  console.log("Ex08 — every has digit:", allHaveDigit);
}

/** flat: flatten nested arrays one level */
function ex09() {
  const nested = [[1, 2], [3, 4], [5, 6]];
  const flat = nested.flat();
  console.log("Ex09 — flat:", flat);
}

/** flatMap: map then flatten */
function ex10() {
  const sentences = ["Hello World", "Foo Bar"];
  const words = sentences.flatMap(s => s.split(" "));
  console.log("Ex10 — flatMap words:", words);
}

/** sort with comparator: ascending */
function ex11() {
  const nums = [5, 3, 8, 1, 4];
  const sorted = [...nums].sort((a, b) => a - b);
  console.log("Ex11 — sort ascending:", sorted);
}

/** Array.from with map function */
function ex12() {
  const squares = Array.from({length: 5}, (_, i) => (i + 1) ** 2);
  console.log("Ex12 — Array.from squares:", squares);
}

/** Array.of: create array from arguments */
function ex13() {
  const arr = Array.of(7, 14, 21, 28);
  console.log("Ex13 — Array.of:", arr);
}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────────────────────

/** groupBy: group array elements by a key function */
function ex14() {
  function groupBy(arr, keyFn) {
    return arr.reduce((acc, item) => {
      const key = keyFn(item);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }
  const people = [
    {name:"Alice",dept:"Eng"},{name:"Bob",dept:"HR"},
    {name:"Carol",dept:"Eng"},{name:"Dave",dept:"HR"}
  ];
  const byDept = groupBy(people, p => p.dept);
  console.log("Ex14 — groupBy dept:", JSON.stringify(byDept));
}

/** countBy: count occurrences per key */
function ex15() {
  function countBy(arr, keyFn) {
    return arr.reduce((acc, item) => {
      const key = keyFn(item);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }
  const words = ["apple", "banana", "avocado", "blueberry", "apricot"];
  const byLetter = countBy(words, w => w[0]);
  console.log("Ex15 — countBy first letter:", byLetter);
}

/** partition: split into two arrays by predicate */
function ex16() {
  function partition(arr, pred) {
    return arr.reduce(([pass, fail], item) =>
      pred(item) ? [[...pass, item], fail] : [pass, [...fail, item]]
    , [[], []]);
  }
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const [evens, odds] = partition(nums, x => x % 2 === 0);
  console.log("Ex16 — partition evens/odds:", evens, odds);
}

/** zip: combine two arrays element-wise */
function ex17() {
  function zip(a, b) {
    return a.map((item, i) => [item, b[i]]);
  }
  const names = ["Alice", "Bob", "Carol"];
  const scores = [95, 87, 92];
  const zipped = zip(names, scores);
  console.log("Ex17 — zip:", zipped);
}

/** unzip: split array of pairs into two arrays */
function ex18() {
  function unzip(pairs) {
    return pairs.reduce(([as, bs], [a, b]) => [[...as, a], [...bs, b]], [[], []]);
  }
  const pairs = [["Alice", 95], ["Bob", 87], ["Carol", 92]];
  const [names, scores] = unzip(pairs);
  console.log("Ex18 — unzip:", names, scores);
}

/** chunk: split array into groups of size n */
function ex19() {
  function chunk(arr, n) {
    const result = [];
    for (let i = 0; i < arr.length; i += n) {
      result.push(arr.slice(i, i + n));
    }
    return result;
  }
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  console.log("Ex19 — chunk(3):", chunk(nums, 3));
}

/** take: take first n elements */
function ex20() {
  function take(arr, n) {
    return arr.slice(0, n);
  }
  const nums = [10, 20, 30, 40, 50, 60];
  console.log("Ex20 — take(4):", take(nums, 4));
}

/** drop: drop first n elements */
function ex21() {
  function drop(arr, n) {
    return arr.slice(n);
  }
  const nums = [10, 20, 30, 40, 50, 60];
  console.log("Ex21 — drop(2):", drop(nums, 2));
}

/** takeWhile: take elements while predicate holds */
function ex22() {
  function takeWhile(arr, pred) {
    const result = [];
    for (const item of arr) {
      if (!pred(item)) break;
      result.push(item);
    }
    return result;
  }
  const nums = [2, 4, 6, 7, 8, 10];
  console.log("Ex22 — takeWhile even:", takeWhile(nums, x => x % 2 === 0));
}

/** dropWhile: drop elements while predicate holds */
function ex23() {
  function dropWhile(arr, pred) {
    let i = 0;
    while (i < arr.length && pred(arr[i])) i++;
    return arr.slice(i);
  }
  const nums = [2, 4, 6, 7, 8, 10];
  console.log("Ex23 — dropWhile even:", dropWhile(nums, x => x % 2 === 0));
}

/** unique: remove duplicates preserving order */
function ex24() {
  function unique(arr) {
    return arr.filter((item, index) => arr.indexOf(item) === index);
  }
  const nums = [1, 2, 3, 2, 4, 3, 5, 1];
  console.log("Ex24 — unique:", unique(nums));
}

/** intersection: elements in both arrays */
function ex25() {
  function intersection(a, b) {
    const setB = new Set(b);
    return a.filter(x => setB.has(x));
  }
  const a = [1, 2, 3, 4, 5];
  const b = [3, 4, 5, 6, 7];
  console.log("Ex25 — intersection:", intersection(a, b));
}

/** difference: elements in a but not b */
function ex26() {
  function difference(a, b) {
    const setB = new Set(b);
    return a.filter(x => !setB.has(x));
  }
  const a = [1, 2, 3, 4, 5];
  const b = [3, 4, 5, 6, 7];
  console.log("Ex26 — difference a\\b:", difference(a, b));
}

// ─── NESTED (27–38) ──────────────────────────────────────────────────────────

/** compose via reduceRight: build function pipeline right-to-left */
function ex27() {
  function composeN(...fns) {
    return x => fns.reduceRight((acc, fn) => fn(acc), x);
  }
  const double = x => x * 2;
  const addOne = x => x + 1;
  const square = x => x * x;
  const transform = composeN(square, addOne, double); // square(addOne(double(x)))
  console.log("Ex27 — compose(square,addOne,double)(3):", transform(3)); // square(addOne(6)) = square(7) = 49
}

/** pipe via reduce: build function pipeline left-to-right */
function ex28() {
  function pipeN(...fns) {
    return x => fns.reduce((acc, fn) => fn(acc), x);
  }
  const trim = s => s.trim();
  const upper = s => s.toUpperCase();
  const exclaim = s => s + "!";
  const transform = pipeN(trim, upper, exclaim);
  console.log("Ex28 — pipeN trim→upper→exclaim:", transform("  hello world  "));
}

/** aperture: sliding window of size n */
function ex29() {
  function aperture(n, arr) {
    return arr.slice(0, arr.length - n + 1).map((_, i) => arr.slice(i, i + n));
  }
  const nums = [1, 2, 3, 4, 5];
  console.log("Ex29 — aperture(3):", aperture(3, nums));
}

/** scan: running totals (like reduce but keeps all intermediate values) */
function ex30() {
  function scan(arr, fn, initial) {
    const result = [initial];
    arr.forEach(item => result.push(fn(result[result.length - 1], item)));
    return result;
  }
  const nums = [1, 2, 3, 4, 5];
  const runningSum = scan(nums, (acc, n) => acc + n, 0);
  console.log("Ex30 — scan running sum:", runningSum);
}

/** unfold: generate an array by repeatedly applying a function */
function ex31() {
  function unfold(fn, seed) {
    const result = [];
    let state = seed;
    let next = fn(state);
    while (next !== null) {
      result.push(next[0]);
      state = next[1];
      next = fn(state);
    }
    return result;
  }
  // Generate first 8 Fibonacci numbers
  const fibs = unfold(([a, b]) => b > 100 ? null : [a, [b, a + b]], [0, 1]);
  console.log("Ex31 — unfold fibonacci:", fibs);
}

/** iterate: generate array by repeatedly applying fn to seed */
function ex32() {
  function iterate(fn, seed, n) {
    const result = [seed];
    for (let i = 1; i < n; i++) {
      result.push(fn(result[result.length - 1]));
    }
    return result;
  }
  const powers = iterate(x => x * 2, 1, 8); // powers of 2
  console.log("Ex32 — iterate powers of 2:", powers);
}

/** juxtapose: apply multiple functions to same input, collect results */
function ex33() {
  function juxt(...fns) {
    return x => fns.map(fn => fn(x));
  }
  const analyze = juxt(
    x => Math.min(...x),
    x => Math.max(...x),
    x => x.reduce((a, b) => a + b, 0) / x.length
  );
  const nums = [4, 8, 15, 16, 23, 42];
  const [min, max, avg] = analyze(nums);
  console.log("Ex33 — juxt [min,max,avg]:", min, max, avg.toFixed(2));
}

/** converge: apply binary fn to results of two unary fns */
function ex34() {
  function converge(combiner, [fn1, fn2]) {
    return x => combiner(fn1(x), fn2(x));
  }
  const nums = [1, 2, 3, 4, 5];
  const meanFn = converge(
    (sum, len) => sum / len,
    [
      arr => arr.reduce((a, b) => a + b, 0),
      arr => arr.length
    ]
  );
  console.log("Ex34 — converge mean:", meanFn(nums));
}

/** zipWith: zip two arrays applying a combining function */
function ex35() {
  function zipWith(fn, a, b) {
    return a.map((item, i) => fn(item, b[i]));
  }
  const prices = [10, 20, 30];
  const quantities = [3, 2, 5];
  const totals = zipWith((p, q) => p * q, prices, quantities);
  console.log("Ex35 — zipWith multiply:", totals);
}

/** cartesian product: all combinations of two arrays */
function ex36() {
  function cartesian(a, b) {
    return a.flatMap(x => b.map(y => [x, y]));
  }
  const suits = ["♠", "♥"];
  const ranks = ["A", "K", "Q"];
  const combos = cartesian(suits, ranks);
  console.log("Ex36 — cartesian product:", combos);
}

/** memoize higher-order function: cache results */
function ex37() {
  function memoize(fn) {
    const cache = new Map();
    return function(...args) {
      const key = JSON.stringify(args);
      if (cache.has(key)) return cache.get(key);
      const result = fn.apply(this, args);
      cache.set(key, result);
      return result;
    };
  }
  let callCount = 0;
  const expensiveFn = memoize(n => { callCount++; return n * n; });
  expensiveFn(5); expensiveFn(5); expensiveFn(10);
  console.log("Ex37 — memoize call count (should be 2):", callCount);
}

/** once: higher-order function that allows fn to be called only once */
function ex38() {
  function once(fn) {
    let called = false;
    let result;
    return function(...args) {
      if (!called) {
        called = true;
        result = fn.apply(this, args);
      }
      return result;
    };
  }
  let count = 0;
  const initOnce = once(() => { count++; return "initialized"; });
  const r1 = initOnce();
  const r2 = initOnce();
  const r3 = initOnce();
  console.log("Ex38 — once result:", r1, r2, r3, "count:", count);
}

// ─── ADVANCED (39–50) ────────────────────────────────────────────────────────

/** transducer map: composable transformation without intermediate arrays */
function ex39() {
  const mapTransducer = fn => reducer => (acc, item) => reducer(acc, fn(item));
  const filterTransducer = pred => reducer => (acc, item) => pred(item) ? reducer(acc, item) : acc;

  const arrayConcat = (acc, item) => [...acc, item];
  const xform = mapTransducer(x => x * 2)(filterTransducer(x => x > 5)(arrayConcat));
  const result = [1, 2, 3, 4, 5].reduce(xform, []);
  console.log("Ex39 — transducer map+filter:", result);
}

/** transducer filter: reusable filtering without intermediate array */
function ex40() {
  const filterTransducer = pred => reducer => (acc, item) => pred(item) ? reducer(acc, item) : acc;
  const mapTransducer = fn => reducer => (acc, item) => reducer(acc, fn(item));
  const transduce = (xform, reducer, init, arr) => arr.reduce(xform(reducer), init);

  const sumReducer = (acc, x) => acc + x;
  const xform = filterTransducer(x => x % 2 === 0)(mapTransducer(x => x * 3)(sumReducer));
  const result = [1, 2, 3, 4, 5, 6].reduce(xform, 0);
  console.log("Ex40 — transducer filter+map+sum:", result);
}

/** Church numeral zero and successor */
function ex41() {
  const ZERO = f => x => x;
  const SUCC = n => f => x => f(n(f)(x));
  const ONE = SUCC(ZERO);
  const TWO = SUCC(ONE);
  const THREE = SUCC(TWO);
  const toInt = n => n(x => x + 1)(0);
  console.log("Ex41 — Church numerals 0,1,2,3:", toInt(ZERO), toInt(ONE), toInt(TWO), toInt(THREE));
}

/** Church boolean encoding */
function ex42() {
  const TRUE = a => b => a;
  const FALSE = a => b => b;
  const AND = p => q => p(q)(FALSE);
  const OR = p => q => p(TRUE)(q);
  const NOT = p => p(FALSE)(TRUE);
  const toBool = b => b(true)(false);
  console.log("Ex42 — Church booleans AND(T,F):", toBool(AND(TRUE)(FALSE)));
  console.log("Ex42 — Church booleans OR(T,F):", toBool(OR(TRUE)(FALSE)));
  console.log("Ex42 — Church booleans NOT(T):", toBool(NOT(TRUE)));
}

/** Catamorphism: fold a custom data structure */
function ex43() {
  // Binary tree as nested plain objects
  const leaf = val => ({ tag: "leaf", val });
  const branch = (left, right) => ({ tag: "branch", left, right });

  function cata(tree, { onLeaf, onBranch }) {
    if (tree.tag === "leaf") return onLeaf(tree.val);
    return onBranch(cata(tree.left, { onLeaf, onBranch }), cata(tree.right, { onLeaf, onBranch }));
  }

  const tree = branch(branch(leaf(1), leaf(2)), leaf(3));
  const sum = cata(tree, { onLeaf: v => v, onBranch: (l, r) => l + r });
  console.log("Ex43 — catamorphism tree sum:", sum);
}

/** Fantasy-land Functor: a box that supports map */
function ex44() {
  class Box {
    constructor(value) { this.value = value; }
    map(fn) { return new Box(fn(this.value)); }
    fold(fn) { return fn(this.value); }
  }
  const result = new Box(5)
    .map(x => x * 2)
    .map(x => x + 1)
    .fold(x => x);
  console.log("Ex44 — Functor Box(5).map(*2).map(+1):", result);
}

/** Monad bind concept: chain computations that may fail */
function ex45() {
  class Maybe {
    constructor(value) { this.value = value; }
    static of(value) { return new Maybe(value); }
    isNothing() { return this.value === null || this.value === undefined; }
    map(fn) { return this.isNothing() ? this : Maybe.of(fn(this.value)); }
    chain(fn) { return this.isNothing() ? this : fn(this.value); }
    getOrElse(def) { return this.isNothing() ? def : this.value; }
  }
  const safeDiv = x => y => y === 0 ? Maybe.of(null) : Maybe.of(x / y);
  const result = Maybe.of(100).chain(safeDiv(100)).chain(safeDiv(5)).getOrElse(0);
  const divByZero = Maybe.of(100).chain(safeDiv(100)).chain(safeDiv(0)).getOrElse(-1);
  console.log("Ex45 — Maybe monad 100/100/5:", result, "100/.../0:", divByZero);
}

/** Applicative: apply wrapped function to wrapped value */
function ex46() {
  class Applicative {
    constructor(value) { this.value = value; }
    static of(value) { return new Applicative(value); }
    map(fn) { return Applicative.of(fn(this.value)); }
    ap(wrappedFn) { return Applicative.of(wrappedFn.value(this.value)); }
  }
  const add = a => b => a + b;
  const result = Applicative.of(3).ap(Applicative.of(add(5)));
  console.log("Ex46 — Applicative ap(add(5)) to 3:", result.value);
}

/** Lens: composable getter/setter for nested data */
function ex47() {
  const lens = (getter, setter) => ({ get: getter, set: setter });
  const view = (l, obj) => l.get(obj);
  const set = (l, val, obj) => l.set(val, obj);
  const over = (l, fn, obj) => set(l, fn(view(l, obj)), obj);

  const nameLens = lens(obj => obj.name, (val, obj) => ({ ...obj, name: val }));
  const user = { name: "Alice", age: 30 };
  console.log("Ex47 — lens view:", view(nameLens, user));
  console.log("Ex47 — lens set:", set(nameLens, "Bob", user));
  console.log("Ex47 — lens over:", over(nameLens, s => s.toUpperCase(), user));
}

/** Profunctor: map over both input and output */
function ex48() {
  // A profunctor wraps a function and supports dimap
  class ProFn {
    constructor(fn) { this.fn = fn; }
    dimap(pre, post) { return new ProFn(x => post(this.fn(pre(x)))); }
    run(x) { return this.fn(x); }
  }
  const strlen = new ProFn(s => s.length);
  const result = strlen
    .dimap(s => s.trim(), n => n * n) // trim input, square output
    .run("  hello  ");
  console.log("Ex48 — Profunctor dimap strlen('  hello  '):", result); // trim→"hello"(5), 5^2=25
}

/** Kleisli composition: compose functions that return monadic values */
function ex49() {
  const safeParseInt = s => {
    const n = parseInt(s, 10);
    return isNaN(n) ? null : n;
  };
  const safeSquareRoot = n => n < 0 ? null : Math.sqrt(n);

  // Kleisli compose for nullable (simple Maybe)
  function kleisli(f, g) {
    return x => {
      const result = f(x);
      return result === null ? null : g(result);
    };
  }
  const parseAndSqrt = kleisli(safeParseInt, safeSquareRoot);
  console.log("Ex49 — Kleisli '25':", parseAndSqrt("25"));
  console.log("Ex49 — Kleisli 'abc':", parseAndSqrt("abc"));
  console.log("Ex49 — Kleisli '-9':", parseAndSqrt("-9"));
}

/** Free monad concept: DSL via data structures, interpreted separately */
function ex50() {
  // Free monad as simple instruction objects interpreted by a runner
  const Read = key => ({ type: "Read", key });
  const Write = (key, value, next) => ({ type: "Write", key, value, next });
  const Pure = value => ({ type: "Pure", value });

  function interpret(instruction, store = {}) {
    if (instruction.type === "Pure") return { result: instruction.value, store };
    if (instruction.type === "Write") {
      const newStore = { ...store, [instruction.key]: instruction.value };
      return interpret(instruction.next, newStore);
    }
    if (instruction.type === "Read") return { result: store[instruction.key], store };
  }

  const program = Write("x", 10, Write("y", 20, Pure("done")));
  const { result, store } = interpret(program);
  console.log("Ex50 — Free monad program result:", result, "store:", store);
}

// ─── main ────────────────────────────────────────────────────────────────────

function main() {
  console.log("=== Examples 4.1 — Higher-Order Functions ===\n");
  console.log("--- BASIC (1–13) ---");
  ex01(); ex02(); ex03(); ex04(); ex05(); ex06(); ex07();
  ex08(); ex09(); ex10(); ex11(); ex12(); ex13();
  console.log("\n--- INTERMEDIATE (14–26) ---");
  ex14(); ex15(); ex16(); ex17(); ex18(); ex19(); ex20();
  ex21(); ex22(); ex23(); ex24(); ex25(); ex26();
  console.log("\n--- NESTED (27–38) ---");
  ex27(); ex28(); ex29(); ex30(); ex31(); ex32(); ex33();
  ex34(); ex35(); ex36(); ex37(); ex38();
  console.log("\n--- ADVANCED (39–50) ---");
  ex39(); ex40(); ex41(); ex42(); ex43(); ex44(); ex45();
  ex46(); ex47(); ex48(); ex49(); ex50();
}

main();
