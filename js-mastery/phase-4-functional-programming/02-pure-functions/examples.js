// ============================================================================
// Examples 4.2 — Pure Functions  (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================================
"use strict";

// ─── BASIC (1–13) ────────────────────────────────────────────────────────────

/** Pure add: no side effects, same input → same output */
function ex01() {
  const add = (a, b) => a + b;
  console.log("Ex01 — pure add(3,4):", add(3, 4), "add(3,4) again:", add(3, 4));
}

/** Pure multiply: demonstrates determinism */
function ex02() {
  const multiply = (a, b) => a * b;
  console.log("Ex02 — pure multiply(6,7):", multiply(6, 7));
}

/** Pure concat: returns new string, original unchanged */
function ex03() {
  const greet = name => "Hello, " + name + "!";
  console.log("Ex03 — pure greet:", greet("Alice"), greet("Bob"));
}

/** Pure slice: returns new array, original unchanged */
function ex04() {
  const original = [1, 2, 3, 4, 5];
  const sliced = original.slice(1, 4);
  console.log("Ex04 — pure slice:", sliced, "original:", original);
}

/** Pure sort: uses spread to avoid mutation */
function ex05() {
  const nums = [5, 3, 1, 4, 2];
  const sorted = [...nums].sort((a, b) => a - b);
  console.log("Ex05 — pure sort:", sorted, "original:", nums);
}

/** Impure vs pure: comparison of push vs spread */
function ex06() {
  function impureAdd(arr, item) { arr.push(item); return arr; } // mutates!
  function pureAdd(arr, item) { return [...arr, item]; }
  const base = [1, 2, 3];
  const pureResult = pureAdd(base, 4);
  console.log("Ex06 — pure add:", pureResult, "base unchanged:", base);
}

/** Pure: no external state dependency */
function ex07() {
  // Pure: all inputs come from parameters
  const calculateTax = (price, rate) => price * rate;
  console.log("Ex07 — pure tax(100, 0.2):", calculateTax(100, 0.2));
}

/** Deterministic: same args → same result always */
function ex08() {
  const hashCode = str => str.split("").reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0);
  const h1 = hashCode("hello");
  const h2 = hashCode("hello");
  console.log("Ex08 — deterministic hashCode:", h1, "===", h2, ":", h1 === h2);
}

/** Idempotent: applying twice same as once */
function ex09() {
  const normalize = s => s.trim().toLowerCase().replace(/\s+/g, " ");
  const s = "  Hello   World  ";
  const once = normalize(s);
  const twice = normalize(once);
  console.log("Ex09 — idempotent normalize:", once, "===", twice, ":", once === twice);
}

/** Pure number formatting */
function ex10() {
  const formatCurrency = (amount, symbol = "$") =>
    symbol + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  console.log("Ex10 — formatCurrency:", formatCurrency(12345.6), formatCurrency(1000000, "€"));
}

/** Pure boolean logic */
function ex11() {
  const isEvenAndPositive = n => n > 0 && n % 2 === 0;
  console.log("Ex11 — pure boolean:", [1,2,-2,4,5,6].filter(isEvenAndPositive));
}

/** Pure object property access */
function ex12() {
  const getFullName = user => user.firstName + " " + user.lastName;
  const users = [{firstName:"Alice",lastName:"Smith"},{firstName:"Bob",lastName:"Jones"}];
  console.log("Ex12 — pure getFullName:", users.map(getFullName));
}

/** Pure string transformation */
function ex13() {
  const kebabCase = s => s.trim().toLowerCase().replace(/\s+/g, "-");
  console.log("Ex13 — kebabCase:", kebabCase("Hello World"), kebabCase("  Foo Bar  "));
}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────────────────────

/** Pure array ops: addItem, removeItem, updateItem */
function ex14() {
  const addItem = (arr, item) => [...arr, item];
  const removeItem = (arr, i) => [...arr.slice(0, i), ...arr.slice(i + 1)];
  const updateItem = (arr, i, val) => arr.map((x, idx) => idx === i ? val : x);
  let list = [];
  list = addItem(list, "a");
  list = addItem(list, "b");
  list = addItem(list, "c");
  list = removeItem(list, 1);
  list = updateItem(list, 0, "A");
  console.log("Ex14 — pure array ops:", list);
}

/** Pure object ops: addProp, removeProp, updateProp */
function ex15() {
  const addProp = (obj, key, val) => ({ ...obj, [key]: val });
  const removeProp = (obj, key) => { const { [key]: _, ...rest } = obj; return rest; };
  const updateProp = (obj, key, fn) => ({ ...obj, [key]: fn(obj[key]) });
  let config = {};
  config = addProp(config, "theme", "dark");
  config = addProp(config, "fontSize", 14);
  config = updateProp(config, "fontSize", n => n + 2);
  config = removeProp(config, "theme");
  console.log("Ex15 — pure object ops:", config);
}

/** Pure string ops: prepend, append, wrap, replace */
function ex16() {
  const prepend = prefix => str => prefix + str;
  const append = suffix => str => str + suffix;
  const wrap = (open, close) => str => open + str + close;
  const replaceAll = (from, to) => str => str.split(from).join(to);
  const transform = s =>
    wrap("[", "]")(prepend(">")(replaceAll(" ", "_")(s.toUpperCase())));
  console.log("Ex16 — pure string ops:", transform("hello world"));
}

/** Inject Date: make date-dependent code pure via injection */
function ex17() {
  // Impure: function internally calls new Date()
  // Pure: inject the date as a parameter
  const getGreeting = (name, now = new Date()) => {
    const hour = now.getHours();
    const period = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
    return `Good ${period}, ${name}!`;
  };
  // For testing, inject a fixed date
  const fixedDate = new Date("2026-03-23T09:00:00");
  console.log("Ex17 — inject date:", getGreeting("Alice", fixedDate));
}

/** Inject Math.random: make random-dependent code testable */
function ex18() {
  const pickRandom = (arr, randFn = Math.random) => arr[Math.floor(randFn() * arr.length)];
  const deterministicRand = () => 0.42; // always picks same index
  const fruits = ["apple", "banana", "cherry", "date"];
  console.log("Ex18 — inject random:", pickRandom(fruits, deterministicRand));
}

/** Pure validation: returns result object, no throwing */
function ex19() {
  const validateEmail = email => {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    return { valid: ok, error: ok ? null : "Invalid email format" };
  };
  console.log("Ex19 — validate email:", validateEmail("alice@example.com"));
  console.log("Ex19 — validate email:", validateEmail("not-an-email"));
}

/** Pure transform pipeline: compose multiple pure transforms */
function ex20() {
  const trim = s => s.trim();
  const lower = s => s.toLowerCase();
  const removeSpecial = s => s.replace(/[^a-z0-9\s]/g, "");
  const collapseSpaces = s => s.replace(/\s+/g, " ");
  const normalize = s => [trim, lower, removeSpecial, collapseSpaces].reduce((acc, fn) => fn(acc), s);
  console.log("Ex20 — pure pipeline:", normalize("  Hello, World! (2026)  "));
}

/** Pure state transitions: next state is pure function of current state */
function ex21() {
  const initialState = { count: 0, history: [] };
  const increment = state => ({ count: state.count + 1, history: [...state.history, "inc"] });
  const decrement = state => ({ count: state.count - 1, history: [...state.history, "dec"] });
  const reset = state => ({ count: 0, history: [...state.history, "reset"] });
  let s = initialState;
  s = increment(s); s = increment(s); s = increment(s); s = decrement(s); s = reset(s);
  console.log("Ex21 — pure state transitions:", s);
}

/** Pure error handling: Either-style (no try/catch) */
function ex22() {
  const Right = val => ({ isRight: true, value: val });
  const Left = err => ({ isRight: false, error: err });
  const safeDiv = (a, b) => b === 0 ? Left("Division by zero") : Right(a / b);
  const map = (either, fn) => either.isRight ? Right(fn(either.value)) : either;

  const result1 = map(safeDiv(100, 4), x => x * 2);
  const result2 = map(safeDiv(100, 0), x => x * 2);
  console.log("Ex22 — pure Either:", result1, result2);
}

/** Pure array insert at index */
function ex23() {
  const insertAt = (arr, index, item) => [
    ...arr.slice(0, index),
    item,
    ...arr.slice(index)
  ];
  const nums = [1, 2, 4, 5];
  const result = insertAt(nums, 2, 3);
  console.log("Ex23 — pure insertAt:", result, "original:", nums);
}

/** Pure object merge deep */
function ex24() {
  function deepMerge(target, source) {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
        result[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }
  const base = { a: 1, b: { c: 2, d: 3 } };
  const override = { b: { c: 99, e: 5 }, f: 6 };
  console.log("Ex24 — deepMerge:", JSON.stringify(deepMerge(base, override)));
}

/** Pure flatten: flatten nested array to specified depth */
function ex25() {
  function flatten(arr, depth = 1) {
    if (depth === 0) return [...arr];
    return arr.reduce((acc, item) =>
      Array.isArray(item) ? [...acc, ...flatten(item, depth - 1)] : [...acc, item]
    , []);
  }
  const nested = [1, [2, [3, [4]], 5], 6];
  console.log("Ex25 — flatten depth 1:", flatten(nested, 1));
  console.log("Ex25 — flatten depth 2:", flatten(nested, 2));
  console.log("Ex25 — flatten depth Infinity:", flatten(nested, Infinity));
}

/** Pure map over object values */
function ex26() {
  const mapValues = (obj, fn) =>
    Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v)]));
  const prices = { apple: 1.5, banana: 0.75, cherry: 3.0 };
  const discounted = mapValues(prices, p => +(p * 0.9).toFixed(2));
  console.log("Ex26 — pure mapValues:", discounted);
}

// ─── NESTED (27–38) ──────────────────────────────────────────────────────────

/** Pure reducer: Redux-style pure state management */
function ex27() {
  const initialState = { items: [], total: 0 };
  function cartReducer(state = initialState, action) {
    switch (action.type) {
      case "ADD_ITEM":
        return { items: [...state.items, action.item], total: state.total + action.item.price };
      case "REMOVE_ITEM":
        return {
          items: state.items.filter(i => i.id !== action.id),
          total: state.total - (state.items.find(i => i.id === action.id) || {price:0}).price
        };
      default: return state;
    }
  }
  let state = cartReducer(undefined, {});
  state = cartReducer(state, { type: "ADD_ITEM", item: { id: 1, name: "Book", price: 15 } });
  state = cartReducer(state, { type: "ADD_ITEM", item: { id: 2, name: "Pen", price: 2 } });
  state = cartReducer(state, { type: "REMOVE_ITEM", id: 1 });
  console.log("Ex27 — pure reducer:", JSON.stringify(state));
}

/** Pure event sourcing: derive state from event log */
function ex28() {
  const events = [
    { type: "Deposit", amount: 1000 },
    { type: "Deposit", amount: 500 },
    { type: "Withdraw", amount: 200 },
    { type: "Deposit", amount: 300 },
    { type: "Withdraw", amount: 150 },
  ];
  const applyEvent = (balance, event) =>
    event.type === "Deposit" ? balance + event.amount : balance - event.amount;
  const balance = events.reduce(applyEvent, 0);
  console.log("Ex28 — pure event sourcing balance:", balance);
}

/** Pure state machine: transitions as pure functions */
function ex29() {
  const transitions = {
    idle:     { start: "running" },
    running:  { pause: "paused", stop: "idle" },
    paused:   { resume: "running", stop: "idle" }
  };
  const transition = (state, event) => (transitions[state] || {})[event] || state;
  let state = "idle";
  state = transition(state, "start");
  state = transition(state, "pause");
  state = transition(state, "resume");
  state = transition(state, "stop");
  console.log("Ex29 — pure state machine final state:", state);
}

/** Command/Query separation: pure queries, separate commands */
function ex30() {
  // Queries are pure functions that read state
  const getItemById = (items, id) => items.find(item => item.id === id) || null;
  const getTotalPrice = items => items.reduce((sum, item) => sum + item.price, 0);
  const getItemsByCategory = (items, cat) => items.filter(item => item.category === cat);

  const inventory = [
    { id: 1, name: "Laptop", price: 999, category: "Electronics" },
    { id: 2, name: "Phone",  price: 699, category: "Electronics" },
    { id: 3, name: "Desk",   price: 299, category: "Furniture"   },
  ];
  console.log("Ex30 — CQRS query:", getItemById(inventory, 2));
  console.log("Ex30 — CQRS total:", getTotalPrice(inventory));
  console.log("Ex30 — CQRS by cat:", getItemsByCategory(inventory, "Electronics").map(i => i.name));
}

/** Pure domain model: immutable value objects */
function ex31() {
  const createMoney = (amount, currency) => Object.freeze({ amount, currency });
  const addMoney = (a, b) => {
    if (a.currency !== b.currency) throw new Error("Currency mismatch");
    return createMoney(a.amount + b.amount, a.currency);
  };
  const scaleMoney = (money, factor) => createMoney(money.amount * factor, money.currency);
  const formatMoney = m => `${m.currency} ${m.amount.toFixed(2)}`;

  const price = createMoney(19.99, "USD");
  const tax   = createMoney(2.00,  "USD");
  const total = addMoney(price, tax);
  const doubled = scaleMoney(total, 2);
  console.log("Ex31 — pure domain Money:", formatMoney(price), "+", formatMoney(tax), "=", formatMoney(total));
  console.log("Ex31 — doubled:", formatMoney(doubled));
}

/** Pure tree operations: map/fold over tree without mutation */
function ex32() {
  const node = (val, children = []) => ({ val, children });
  const treeMap = (tree, fn) => node(fn(tree.val), tree.children.map(c => treeMap(c, fn)));
  const treeFold = (tree, fn, init) =>
    tree.children.reduce((acc, child) => treeFold(child, fn, acc), fn(init, tree.val));

  const tree = node(1, [node(2, [node(4), node(5)]), node(3, [node(6)])]);
  const doubled = treeMap(tree, x => x * 2);
  const sum = treeFold(tree, (acc, v) => acc + v, 0);
  console.log("Ex32 — treeMap root:", doubled.val, "children roots:", doubled.children.map(c => c.val));
  console.log("Ex32 — treeFold sum:", sum);
}

/** Pure graph operations: build and query adjacency list */
function ex33() {
  const createGraph = () => ({});
  const addEdge = (graph, from, to) => ({
    ...graph,
    [from]: [...(graph[from] || []), to],
    [to]:   [...(graph[to]   || []), from]
  });
  const getNeighbors = (graph, node) => graph[node] || [];
  const hasPath = (graph, start, end, visited = new Set()) => {
    if (start === end) return true;
    visited.add(start);
    return getNeighbors(graph, start)
      .filter(n => !visited.has(n))
      .some(n => hasPath(graph, n, end, visited));
  };

  let g = createGraph();
  g = addEdge(g, "A", "B");
  g = addEdge(g, "B", "C");
  g = addEdge(g, "C", "D");
  console.log("Ex33 — pure graph:", "A→D:", hasPath(g, "A", "D"), "A→E:", hasPath(g, "A", "E"));
}

/** Pure formatting: number, date, bytes */
function ex34() {
  const formatNumber = (n, decimals = 0) => n.toLocaleString("en-US", { minimumFractionDigits: decimals });
  const formatBytes = bytes => {
    const units = ["B","KB","MB","GB","TB"];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) { bytes /= 1024; i++; }
    return bytes.toFixed(2) + " " + units[i];
  };
  const padLeft = (str, len, char = " ") => str.padStart(len, char);
  console.log("Ex34 — formatNumber:", formatNumber(1234567.89, 2));
  console.log("Ex34 — formatBytes:", formatBytes(1536), formatBytes(1048576));
  console.log("Ex34 — padLeft:", padLeft("42", 8, "0"));
}

/** Pure i18n: translate with pure function and dictionary */
function ex35() {
  const translations = {
    en: { hello: "Hello", goodbye: "Goodbye", thanks: "Thank you" },
    es: { hello: "Hola",  goodbye: "Adiós",   thanks: "Gracias"   },
    fr: { hello: "Bonjour", goodbye: "Au revoir", thanks: "Merci" }
  };
  const t = (lang, key, fallback = key) => (translations[lang] || {})[key] || fallback;
  console.log("Ex35 — i18n:", t("en","hello"), t("es","thanks"), t("fr","goodbye"), t("de","hello"));
}

/** Pure permission check: role-based access control */
function ex36() {
  const permissions = {
    admin:  ["read","write","delete","manage"],
    editor: ["read","write"],
    viewer: ["read"]
  };
  const can = (role, action) => (permissions[role] || []).includes(action);
  const hasAny = (role, actions) => actions.some(a => can(role, a));
  const hasAll = (role, actions) => actions.every(a => can(role, a));

  console.log("Ex36 — admin delete:", can("admin","delete"));
  console.log("Ex36 — viewer write:", can("viewer","write"));
  console.log("Ex36 — editor hasAll read+write:", hasAll("editor", ["read","write"]));
  console.log("Ex36 — viewer hasAny write+delete:", hasAny("viewer", ["write","delete"]));
}

/** Pure update at deep path */
function ex37() {
  function updateAt(obj, path, fn) {
    if (path.length === 0) return fn(obj);
    const [head, ...tail] = path;
    return { ...obj, [head]: updateAt(obj[head] || {}, tail, fn) };
  }
  const state = { user: { profile: { age: 25, name: "Alice" } } };
  const next = updateAt(state, ["user", "profile", "age"], age => age + 1);
  console.log("Ex37 — updateAt original age:", state.user.profile.age, "next age:", next.user.profile.age);
}

/** Pure copy-on-write: persistent array with structural sharing */
function ex38() {
  // Simulate persistent array with plain JS (conceptual)
  function persistentSet(arr, index, value) {
    const copy = [...arr];
    copy[index] = value;
    return copy;
  }
  const v0 = [1, 2, 3, 4, 5];
  const v1 = persistentSet(v0, 2, 99);
  const v2 = persistentSet(v1, 4, 77);
  console.log("Ex38 — persistent v0:", v0);
  console.log("Ex38 — persistent v1:", v1);
  console.log("Ex38 — persistent v2:", v2);
}

// ─── ADVANCED (39–50) ────────────────────────────────────────────────────────

/** Effect system concept: separate effects from logic */
function ex39() {
  // Pure logic returns a description of effects, not side effects themselves
  function processOrder(order) {
    const effects = [];
    if (order.total > 1000) effects.push({ type: "SendEmail", to: order.email, template: "high_value" });
    if (order.items.length === 0) effects.push({ type: "Log", level: "warn", msg: "Empty order" });
    effects.push({ type: "SaveOrder", order });
    return { ...order, status: "processed" };
  }
  const order = { id: 1, email: "alice@example.com", total: 1500, items: ["Book"] };
  const result = processOrder(order);
  console.log("Ex39 — effect system result:", result.status, "total:", result.total);
}

/** IO monad: wrap side effects, keep business logic pure */
function ex40() {
  class IO {
    constructor(fn) { this.fn = fn; }
    static of(value) { return new IO(() => value); }
    map(fn) { return new IO(() => fn(this.fn())); }
    chain(fn) { return new IO(() => fn(this.fn()).fn()); }
    run() { return this.fn(); }
  }
  // Build a pipeline of IO operations without executing them
  const getInput = IO.of("  hello world  ");
  const program = getInput
    .map(s => s.trim())
    .map(s => s.toUpperCase())
    .map(s => s.split(" ").reverse().join(" "));
  console.log("Ex40 — IO monad run:", program.run());
}

/** Reader monad: dependency injection via monad */
function ex41() {
  class Reader {
    constructor(fn) { this.run = fn; }
    static of(value) { return new Reader(() => value); }
    map(fn) { return new Reader(env => fn(this.run(env))); }
    chain(fn) { return new Reader(env => fn(this.run(env)).run(env)); }
  }
  const ask = new Reader(env => env);
  const getUser = ask.map(env => env.currentUser);
  const getGreeting = getUser.map(user => `Hello, ${user.name}!`);

  const env = { currentUser: { name: "Alice", role: "admin" }, config: { theme: "dark" } };
  console.log("Ex41 — Reader monad:", getGreeting.run(env));
}

/** Writer monad: accumulate log alongside computation */
function ex42() {
  class Writer {
    constructor(value, log = []) { this.value = value; this.log = log; }
    static of(value) { return new Writer(value, []); }
    map(fn) { return new Writer(fn(this.value), this.log); }
    chain(fn) {
      const result = fn(this.value);
      return new Writer(result.value, [...this.log, ...result.log]);
    }
  }
  const tell = msg => new Writer(undefined, [msg]);
  const divide = (a, b) => new Writer(a / b, [`Dividing ${a} by ${b}`]);
  const sqrt = n => new Writer(Math.sqrt(n), [`Taking sqrt of ${n}`]);

  const computation = Writer.of(64)
    .chain(n => divide(n, 4))
    .chain(n => sqrt(n));
  console.log("Ex42 — Writer monad value:", computation.value, "log:", computation.log);
}

/** State monad: thread state through computation */
function ex43() {
  class State {
    constructor(fn) { this.run = fn; }
    static of(value) { return new State(s => [value, s]); }
    map(fn) { return new State(s => { const [v, ns] = this.run(s); return [fn(v), ns]; }); }
    chain(fn) { return new State(s => { const [v, ns] = this.run(s); return fn(v).run(ns); }); }
  }
  const get = new State(s => [s, s]);
  const put = newState => new State(() => [undefined, newState]);
  const modify = fn => new State(s => [undefined, fn(s)]);

  const counter = modify(n => n + 1)
    .chain(() => modify(n => n * 2))
    .chain(() => get);
  const [value, finalState] = counter.run(5);
  console.log("Ex43 — State monad value:", value, "finalState:", finalState); // (5+1)*2 = 12
}

/** Total vs partial functions: make partial functions total */
function ex44() {
  // Partial: may throw or return undefined
  const safeDivide = (a, b) => b === 0 ? { ok: false, error: "division by zero" } : { ok: true, value: a / b };
  const safeHead = arr => arr.length === 0 ? { ok: false, error: "empty array" } : { ok: true, value: arr[0] };
  const safeGet = (obj, key) => key in obj ? { ok: true, value: obj[key] } : { ok: false, error: `key "${key}" missing` };

  console.log("Ex44 — total safeDivide:", safeDivide(10, 0), safeDivide(10, 2));
  console.log("Ex44 — total safeHead:", safeHead([]), safeHead([1,2,3]));
  console.log("Ex44 — total safeGet:", safeGet({a:1}, "b"));
}

/** Algebra of programs: equational reasoning */
function ex45() {
  // map fusion law: arr.map(f).map(g) === arr.map(x => g(f(x)))
  const arr = [1, 2, 3, 4, 5];
  const f = x => x * 2;
  const g = x => x + 1;
  const twoMaps = arr.map(f).map(g);
  const fused   = arr.map(x => g(f(x)));
  console.log("Ex45 — map fusion:", JSON.stringify(twoMaps), "===", JSON.stringify(fused), ":", JSON.stringify(twoMaps) === JSON.stringify(fused));
}

/** Referential transparency: substitution model */
function ex46() {
  const double = x => x * 2;
  const addOne = x => x + 1;
  const x = double(5);       // can substitute x with 10 anywhere
  const result1 = addOne(x); // addOne(10)
  const result2 = addOne(double(5)); // same as above
  console.log("Ex46 — referential transparency:", result1, "===", result2, ":", result1 === result2);
}

/** Equational reasoning: prove programs equivalent */
function ex47() {
  // filter then map = map only items that pass, then transform
  // map(f, filter(p, arr)) === filter(x => p(f_inv(x)), map(f, arr))  — not always possible
  // But: filter(p).map(f) (if p and f are independent)
  const arr = [1, 2, 3, 4, 5, 6];
  const isEven = x => x % 2 === 0;
  const triple  = x => x * 3;
  const v1 = arr.filter(isEven).map(triple);
  const v2 = arr.reduce((acc, x) => isEven(x) ? [...acc, triple(x)] : acc, []);
  console.log("Ex47 — equational:", JSON.stringify(v1), "===", JSON.stringify(v2), ":", JSON.stringify(v1) === JSON.stringify(v2));
}

/** Pure FFI boundary: isolate impurity at edges */
function ex48() {
  // Impure layer: I/O, randomness, etc.
  const fetchData = () => [{ id: 1, val: 42 }, { id: 2, val: 17 }]; // simulated

  // Pure core: all business logic is pure
  const processData = data => data
    .filter(item => item.val > 20)
    .map(item => ({ ...item, val: item.val * 2 }));

  // Thin impure shell: only this function touches the outside world
  function runApp() {
    const rawData = fetchData(); // impure
    return processData(rawData); // pure
  }

  console.log("Ex48 — pure FFI boundary:", runApp());
}

/** Pure functional optics: lens compose */
function ex49() {
  const lens = (get, set) => ({ get, set });
  const compose = (l1, l2) => lens(
    obj => l2.get(l1.get(obj)),
    (val, obj) => l1.set(l2.set(val, l1.get(obj)), obj)
  );

  const userLens  = lens(s => s.user,  (v, s) => ({ ...s, user: v }));
  const nameLens  = lens(s => s.name,  (v, s) => ({ ...s, name: v }));
  const userNameLens = compose(userLens, nameLens);

  const state = { user: { name: "Alice", age: 30 }, theme: "dark" };
  const newState = { ...state, user: userNameLens.set("Bob", state.user) };
  console.log("Ex49 — lens compose get:", userNameLens.get(state));
  console.log("Ex49 — lens compose set:", newState.user.name, "(theme unchanged:", newState.theme + ")");
}

/** Pure memoization with max cache size (LRU-like) */
function ex50() {
  function memoizeWithLimit(fn, limit = 3) {
    const cache = new Map();
    return function(...args) {
      const key = JSON.stringify(args);
      if (cache.has(key)) return cache.get(key);
      if (cache.size >= limit) {
        const oldest = cache.keys().next().value;
        cache.delete(oldest);
      }
      const result = fn(...args);
      cache.set(key, result);
      return result;
    };
  }
  let calls = 0;
  const heavyFn = memoizeWithLimit(n => { calls++; return n * n * n; }, 3);
  heavyFn(2); heavyFn(3); heavyFn(4); // fills cache
  heavyFn(5); // evicts 2, adds 5
  heavyFn(3); // cache hit
  console.log("Ex50 — memoize with limit calls (expected 4):", calls);
}

// ─── main ────────────────────────────────────────────────────────────────────

function main() {
  console.log("=== Examples 4.2 — Pure Functions ===\n");
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
