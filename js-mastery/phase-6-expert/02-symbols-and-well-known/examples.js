// ============================================================================
// Examples 6.2 — Symbols & Well-Known Symbols  (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================================
"use strict";

// ─── BASIC (1–13) ────────────────────────────────────────────────────────────

/** Symbol(): creates a unique symbol */
function ex01() {
  const s1 = Symbol("id");
  const s2 = Symbol("id");
  console.log("Ex01 — Symbol uniqueness:", s1 === s2, typeof s1);
}

/** description: accessing the symbol's description string */
function ex02() {
  const sym = Symbol("mySymbol");
  console.log("Ex02 — Symbol description:", sym.description, sym.toString());
}

/** uniqueness: even identical descriptions are unique */
function ex03() {
  const syms = Array.from({length: 5}, (_, i) => Symbol("key"));
  const allUnique = syms.every((s, i) => syms.every((t, j) => i === j || s !== t));
  console.log("Ex03 — all symbols unique:", allUnique);
}

/** Symbol.for(): global symbol registry — same key returns same symbol */
function ex04() {
  const a = Symbol.for("shared");
  const b = Symbol.for("shared");
  const c = Symbol("shared"); // not registered
  console.log("Ex04 — Symbol.for same:", a === b, "vs local:", a === c);
}

/** Symbol.keyFor(): retrieve key from global registry */
function ex05() {
  const global = Symbol.for("globalKey");
  const local = Symbol("localKey");
  console.log("Ex05 — Symbol.keyFor global:", Symbol.keyFor(global), "local:", Symbol.keyFor(local));
}

/** Symbol as object key: store private-like data on object */
function ex06() {
  const TOKEN = Symbol("token");
  const user = { name: "Alice", [TOKEN]: "secret-abc-123" };
  console.log("Ex06 — symbol key value:", user[TOKEN], "visible in keys:", Object.keys(user));
}

/** not in for...in: symbol keys are excluded from enumeration */
function ex07() {
  const TYPE = Symbol("type");
  const item = { name: "Widget", price: 9.99, [TYPE]: "product" };
  const enumerable = [];
  for (const key in item) enumerable.push(key);
  console.log("Ex07 — for...in skips symbols:", enumerable, "symbol present:", item[TYPE]);
}

/** not in Object.keys: symbols excluded from Object.keys() */
function ex08() {
  const ID = Symbol("id");
  const record = { a: 1, b: 2, [ID]: 42 };
  console.log("Ex08 — Object.keys:", Object.keys(record), "symbol:", record[ID]);
}

/** Object.getOwnPropertySymbols: list symbol-keyed properties */
function ex09() {
  const SYM_A = Symbol("a");
  const SYM_B = Symbol("b");
  const obj = { x: 1, [SYM_A]: "alpha", [SYM_B]: "beta" };
  const symbols = Object.getOwnPropertySymbols(obj);
  console.log("Ex09 — getOwnPropertySymbols count:", symbols.length, "values:", symbols.map(s => obj[s]));
}

/** Reflect.ownKeys: returns both string and symbol keys */
function ex10() {
  const SYM = Symbol("hidden");
  const obj = { visible: true, [SYM]: "hidden value" };
  const allKeys = Reflect.ownKeys(obj);
  console.log("Ex10 — Reflect.ownKeys:", allKeys.filter(k => typeof k === "string"), "+ symbols:", allKeys.filter(k => typeof k === "symbol").length);
}

/** symbol in JSON.stringify: symbols are excluded */
function ex11() {
  const PRIV = Symbol("private");
  const data = { name: "Test", value: 100, [PRIV]: "not serialized" };
  const json = JSON.stringify(data);
  console.log("Ex11 — JSON.stringify (symbol excluded):", json);
}

/** symbol as constant enum alternative */
function ex12() {
  const Direction = Object.freeze({
    UP: Symbol("UP"),
    DOWN: Symbol("DOWN"),
    LEFT: Symbol("LEFT"),
    RIGHT: Symbol("RIGHT")
  });
  function move(dir) {
    if (dir === Direction.UP) return "moving up";
    if (dir === Direction.DOWN) return "moving down";
    return "other direction";
  }
  console.log("Ex12 — symbol enum:", move(Direction.UP), move(Direction.LEFT));
}

/** symbol description in error messages */
function ex13() {
  const REQUIRED = Symbol("required field");
  function validate(obj, requiredSymbol) {
    if (!(requiredSymbol in obj)) {
      throw new Error(`Missing field: ${requiredSymbol.description}`);
    }
    return true;
  }
  const record = { [REQUIRED]: "value" };
  try {
    console.log("Ex13 — symbol validation pass:", validate(record, REQUIRED));
    validate({}, REQUIRED);
  } catch (e) {
    console.log("Ex13 — symbol validation error:", e.message);
  }
}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────────────────────

/** Symbol.iterator basic: make object iterable */
function ex14() {
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
  console.log("Ex14 — Symbol.iterator:", [...range]);
}

/** make array-like iterable: add Symbol.iterator to plain object */
function ex15() {
  const arrayLike = { 0: "a", 1: "b", 2: "c", length: 3 };
  arrayLike[Symbol.iterator] = Array.prototype[Symbol.iterator];
  console.log("Ex15 — array-like iterable:", [...arrayLike]);
}

/** iterable object: class with Symbol.iterator */
function ex16() {
  class InfiniteCounter {
    constructor(start = 0) { this.n = start; }
    [Symbol.iterator]() {
      let n = this.n;
      return { next() { return { value: n++, done: false }; } };
    }
  }
  const counter = new InfiniteCounter(5);
  const first5 = [];
  for (const v of counter) { first5.push(v); if (first5.length >= 5) break; }
  console.log("Ex16 — class iterator:", first5);
}

/** Symbol.iterator in class: reusable iterator */
function ex17() {
  class WordList {
    constructor(sentence) { this.words = sentence.split(" "); }
    [Symbol.iterator]() { return this.words[Symbol.iterator](); }
  }
  const list = new WordList("the quick brown fox");
  console.log("Ex17 — class Symbol.iterator:", [...list]);
}

/** Symbol.toPrimitive number hint */
function ex18() {
  class Money {
    constructor(amount, currency) { this.amount = amount; this.currency = currency; }
    [Symbol.toPrimitive](hint) {
      if (hint === "number") return this.amount;
      if (hint === "string") return `${this.amount} ${this.currency}`;
      return this.amount; // default
    }
  }
  const price = new Money(29.99, "USD");
  console.log("Ex18 — toPrimitive number:", +price, "string:", `${price}`, "default:", price + 0);
}

/** Symbol.toPrimitive string/default */
function ex19() {
  class Version {
    constructor(major, minor, patch) { this.v = [major, minor, patch]; }
    [Symbol.toPrimitive](hint) {
      if (hint === "string") return this.v.join(".");
      return this.v[0]; // numeric major version
    }
  }
  const v = new Version(2, 3, 1);
  console.log("Ex19 — Version toPrimitive string:", `v${v}`, "number:", v * 1);
}

/** Symbol.toStringTag: custom [object Tag] */
function ex20() {
  class Database {
    get [Symbol.toStringTag]() { return "Database"; }
  }
  class Cache {
    get [Symbol.toStringTag]() { return "Cache"; }
  }
  const db = new Database();
  const cache = new Cache();
  console.log("Ex20 — toStringTag:", Object.prototype.toString.call(db), Object.prototype.toString.call(cache));
}

/** Symbol.hasInstance: custom instanceof */
function ex21() {
  class Positive {
    static [Symbol.hasInstance](n) { return typeof n === "number" && n > 0; }
  }
  console.log("Ex21 — hasInstance:", 5 instanceof Positive, -3 instanceof Positive, 0 instanceof Positive);
}

/** Symbol.species: control species for derived instances */
function ex22() {
  class MyArray extends Array {
    static get [Symbol.species]() { return Array; }
  }
  const mine = new MyArray(1, 2, 3);
  const mapped = mine.map(x => x * 2);
  console.log("Ex22 — Symbol.species:", mapped instanceof Array, mapped instanceof MyArray, [...mapped]);
}

/** Symbol.asyncIterator: async iterable protocol */
async function ex23() {
  class AsyncRange {
    constructor(from, to) { this.from = from; this.to = to; }
    [Symbol.asyncIterator]() {
      let current = this.from;
      const last = this.to;
      return {
        async next() {
          await new Promise(r => setTimeout(r, 0));
          return current <= last
            ? { value: current++, done: false }
            : { value: undefined, done: true };
        }
      };
    }
  }
  const results = [];
  for await (const v of new AsyncRange(1, 5)) results.push(v);
  console.log("Ex23 — Symbol.asyncIterator:", results);
}

/** Symbol.isConcatSpreadable: control Array.prototype.concat behavior */
function ex24() {
  const spreadable = { 0: "a", 1: "b", length: 2, [Symbol.isConcatSpreadable]: true };
  const notSpreadable = ["x", "y"];
  notSpreadable[Symbol.isConcatSpreadable] = false;
  console.log("Ex24 — isConcatSpreadable spread:", [].concat(spreadable), "not:", [].concat(notSpreadable));
}

/** Symbol.unscopables: exclude properties from with scope */
function ex25() {
  const obj = {
    a: 1,
    b: 2,
    [Symbol.unscopables]: { b: true }
  };
  let aVal, bVal;
  // with (obj) { aVal = a; try { bVal = b; } catch { bVal = "unscopable"; } }
  // 'with' is forbidden in strict mode; demonstrate the concept via inspection
  const unscopedKeys = Object.keys(obj[Symbol.unscopables] || {});
  console.log("Ex25 — Symbol.unscopables excluded:", unscopedKeys, "obj.a:", obj.a);
}

/** Symbol.match: customize String.prototype.match */
function ex26() {
  class CaseInsensitiveSearch {
    constructor(pattern) { this.pattern = pattern; }
    [Symbol.match](str) {
      const re = new RegExp(this.pattern, "i");
      return str.match(re);
    }
  }
  const result = "Hello World".match(new CaseInsensitiveSearch("hello"));
  console.log("Ex26 — Symbol.match:", result && result[0]);
}

// ─── NESTED (27–38) ──────────────────────────────────────────────────────────

/** Symbol.replace: customize String.prototype.replace */
function ex27() {
  class RedactReplacer {
    constructor(pattern) { this.pattern = new RegExp(pattern, "g"); }
    [Symbol.replace](str, replacement) {
      return str.replace(this.pattern, "***");
    }
  }
  const result = "My password is secret123".replace(new RedactReplacer("secret\\w+"), "");
  console.log("Ex27 — Symbol.replace:", result);
}

/** Symbol.search: customize String.prototype.search */
function ex28() {
  class FuzzySearch {
    constructor(term) { this.term = term.toLowerCase(); }
    [Symbol.search](str) {
      return str.toLowerCase().indexOf(this.term);
    }
  }
  const idx = "Hello World".search(new FuzzySearch("WORLD"));
  console.log("Ex28 — Symbol.search:", idx);
}

/** Symbol.split: customize String.prototype.split */
function ex29() {
  class MultiDelimiter {
    constructor(...delimiters) { this.delimiters = delimiters; }
    [Symbol.split](str) {
      const re = new RegExp(this.delimiters.map(d => d.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "g");
      return str.split(re);
    }
  }
  const parts = "one,two;three|four".split(new MultiDelimiter(",", ";", "|"));
  console.log("Ex29 — Symbol.split multi-delimiter:", parts);
}

/** well-known override: override Symbol.iterator on Array subclass */
function ex30() {
  class ReverseArray extends Array {
    [Symbol.iterator]() {
      let i = this.length - 1;
      const arr = this;
      return {
        next() {
          return i >= 0
            ? { value: arr[i--], done: false }
            : { value: undefined, done: true };
        }
      };
    }
  }
  const ra = ReverseArray.of(1, 2, 3, 4, 5);
  console.log("Ex30 — reverse array iterator:", [...ra]);
}

/** symbol-keyed private pattern: use symbols for private fields */
function ex31() {
  const _balance = Symbol("balance");
  const _owner = Symbol("owner");
  class BankAccount {
    constructor(owner, initialBalance) {
      this[_owner] = owner;
      this[_balance] = initialBalance;
    }
    deposit(amount) { this[_balance] += amount; return this; }
    withdraw(amount) {
      if (amount > this[_balance]) throw new Error("Insufficient funds");
      this[_balance] -= amount;
      return this;
    }
    get info() { return `${this[_owner]}: $${this[_balance]}`; }
  }
  const account = new BankAccount("Alice", 100);
  account.deposit(50).withdraw(30);
  console.log("Ex31 — symbol private fields:", account.info, "direct access:", account.balance);
}

/** symbol for interface contract: define method contracts with symbols */
function ex32() {
  const Serializable = Symbol("Serializable.serialize");
  const Deserializable = Symbol("Deserializable.deserialize");

  class Config {
    constructor(data) { this.data = data; }
    [Serializable]() { return JSON.stringify(this.data); }
    static [Deserializable](str) { return new Config(JSON.parse(str)); }
  }

  const cfg = new Config({ host: "localhost", port: 3000 });
  const serialized = cfg[Serializable]();
  const restored = Config[Deserializable](serialized);
  console.log("Ex32 — symbol interface contract:", serialized, "restored:", restored.data);
}

/** symbol as capability token: access gating */
function ex33() {
  const ADMIN_CAPABILITY = Symbol("admin");
  function createSystem() {
    const adminCap = ADMIN_CAPABILITY;
    return {
      publicAction() { return "public"; },
      adminAction(cap) {
        if (cap !== adminCap) throw new Error("Unauthorized");
        return "admin action performed";
      },
      getCapability(password) {
        if (password === "correct-horse") return adminCap;
        throw new Error("Wrong password");
      }
    };
  }
  const sys = createSystem();
  const cap = sys.getCapability("correct-horse");
  console.log("Ex33 — symbol capability:", sys.adminAction(cap));
  try { sys.adminAction(Symbol("admin")); } catch(e) { console.log("Ex33 — unauthorized:", e.message); }
}

/** symbol in proxy: intercept symbol-keyed access */
function ex34() {
  const LOCKED = Symbol("locked");
  const obj = { name: "Resource", [LOCKED]: true };
  const proxy = new Proxy(obj, {
    get(target, key) {
      if (key === LOCKED) return "access to locked symbol intercepted";
      return target[key];
    }
  });
  console.log("Ex34 — symbol in proxy:", proxy.name, proxy[LOCKED]);
}

/** symbol-keyed metadata: attach metadata without polluting object */
function ex35() {
  const META = Symbol("metadata");
  function attachMeta(obj, meta) {
    obj[META] = meta;
    return obj;
  }
  function getMeta(obj) { return obj[META]; }
  const user = attachMeta({ name: "Bob", age: 30 }, { created: "2024-01-01", version: 1 });
  console.log("Ex35 — symbol metadata:", getMeta(user), "clean keys:", Object.keys(user));
}

/** metaprogramming with symbols: dynamic method dispatch */
function ex36() {
  const RENDER = Symbol("render");
  const VALIDATE = Symbol("validate");

  class TextField {
    constructor(value) { this.value = value; }
    [RENDER]() { return `<input value="${this.value}" />`; }
    [VALIDATE]() { return this.value.length > 0; }
  }
  class NumberField {
    constructor(value) { this.value = value; }
    [RENDER]() { return `<input type="number" value="${this.value}" />`; }
    [VALIDATE]() { return !isNaN(this.value); }
  }

  const fields = [new TextField("hello"), new NumberField(42)];
  fields.forEach(f => console.log("Ex36 — symbol dispatch:", f[RENDER](), f[VALIDATE]()));
}

/** symbol registry patterns: namespaced symbols */
function ex37() {
  const registry = new Map();
  function getSymbol(namespace, name) {
    const key = `${namespace}::${name}`;
    if (!registry.has(key)) registry.set(key, Symbol(key));
    return registry.get(key);
  }
  const httpMethod = getSymbol("http", "method");
  const httpMethod2 = getSymbol("http", "method");
  const dbMethod = getSymbol("db", "method");
  console.log("Ex37 — namespaced symbols same:", httpMethod === httpMethod2, "different ns:", httpMethod === dbMethod);
}

/** symbol monkeypatching safely: extend without conflicts */
function ex38() {
  const MY_LIB_SORT = Symbol("myLib.sort");
  Array.prototype[MY_LIB_SORT] = function(comparator) {
    return [...this].sort(comparator);
  };
  const nums = [5, 2, 8, 1, 9];
  const sorted = nums[MY_LIB_SORT]((a, b) => a - b);
  console.log("Ex38 — symbol monkeypatch:", sorted, "original:", nums);
  delete Array.prototype[MY_LIB_SORT]; // cleanup
}

// ─── ADVANCED (39–50) ────────────────────────────────────────────────────────

/** symbol-based access control: roles and permissions */
function ex39() {
  const ROLES = {
    ADMIN: Symbol("admin"),
    USER: Symbol("user"),
    GUEST: Symbol("guest")
  };
  const permissions = new Map([
    [ROLES.ADMIN, ["read", "write", "delete"]],
    [ROLES.USER, ["read", "write"]],
    [ROLES.GUEST, ["read"]]
  ]);
  function can(role, action) {
    return (permissions.get(role) || []).includes(action);
  }
  console.log("Ex39 — symbol RBAC admin delete:", can(ROLES.ADMIN, "delete"));
  console.log("Ex39 — symbol RBAC guest write:", can(ROLES.GUEST, "write"));
}

/** symbol protocol pattern: pluggable behaviors */
function ex40() {
  const COMPARABLE = Symbol("Comparable.compareTo");
  class Temperature {
    constructor(celsius) { this.celsius = celsius; }
    [COMPARABLE](other) { return this.celsius - other.celsius; }
  }
  function sort(items) {
    return [...items].sort((a, b) => a[COMPARABLE](b));
  }
  const temps = [new Temperature(30), new Temperature(15), new Temperature(22)];
  const sorted = sort(temps).map(t => t.celsius);
  console.log("Ex40 — symbol protocol sort:", sorted);
}

/** symbol for branding: nominal typing pattern */
function ex41() {
  const USD_BRAND = Symbol("USD");
  const EUR_BRAND = Symbol("EUR");
  function usd(amount) { return Object.assign(Object.create(null), { amount, [USD_BRAND]: true }); }
  function eur(amount) { return Object.assign(Object.create(null), { amount, [EUR_BRAND]: true }); }
  function addUSD(a, b) {
    if (!a[USD_BRAND] || !b[USD_BRAND]) throw new Error("Both must be USD");
    return usd(a.amount + b.amount);
  }
  const total = addUSD(usd(10), usd(20));
  console.log("Ex41 — symbol branding USD:", total.amount);
  try { addUSD(usd(5), eur(10)); } catch(e) { console.log("Ex41 — brand mismatch:", e.message); }
}

/** symbol in proxy: virtual property interception */
function ex42() {
  const VIRTUAL = Symbol("virtual");
  const handler = {
    get(target, key) {
      if (key === VIRTUAL) return "I am virtual";
      return Reflect.get(target, key);
    },
    has(target, key) {
      if (key === VIRTUAL) return true;
      return Reflect.has(target, key);
    }
  };
  const proxy = new Proxy({ real: "property" }, handler);
  console.log("Ex42 — virtual symbol property:", proxy[VIRTUAL], VIRTUAL in proxy, proxy.real);
}

/** symbol-keyed event bus: avoid event name collisions */
function ex43() {
  function createEventBus() {
    const listeners = new Map();
    return {
      on(event, handler) {
        if (!listeners.has(event)) listeners.set(event, []);
        listeners.get(event).push(handler);
      },
      emit(event, data) {
        (listeners.get(event) || []).forEach(h => h(data));
      }
    };
  }
  const CLICK = Symbol("click");
  const bus = createEventBus();
  const received = [];
  bus.on(CLICK, data => received.push(data));
  bus.emit(CLICK, { x: 10, y: 20 });
  bus.emit(CLICK, { x: 30, y: 40 });
  console.log("Ex43 — symbol event bus:", received);
}

/** symbol as first-class capabilities: pass access tokens */
function ex44() {
  function createVault(secret) {
    const READ_CAP = Symbol("read");
    const WRITE_CAP = Symbol("write");
    let stored = secret;
    return {
      capabilities: { READ_CAP, WRITE_CAP },
      access(cap, newValue) {
        if (cap === WRITE_CAP) { stored = newValue; return "written"; }
        if (cap === READ_CAP) return stored;
        return "denied";
      }
    };
  }
  const vault = createVault("initial secret");
  const { READ_CAP, WRITE_CAP } = vault.capabilities;
  console.log("Ex44 — vault read:", vault.access(READ_CAP));
  vault.access(WRITE_CAP, "new secret");
  console.log("Ex44 — vault after write:", vault.access(READ_CAP));
  console.log("Ex44 — vault deny:", vault.access(Symbol("read")));
}

/** symbol-based mixins: conflict-free mixin application */
function ex45() {
  function createMixin(name, methods) {
    const sym = Symbol(name);
    return { sym, methods };
  }
  const Serializable = createMixin("Serializable", {
    serialize() { return JSON.stringify(this); },
    deserialize: JSON.parse
  });
  class Point {
    constructor(x, y) { this.x = x; this.y = y; }
  }
  // Apply mixin methods with namespaced symbol key
  Point.prototype[Serializable.sym] = Serializable.methods;
  const p = new Point(3, 4);
  const serialized = p[Serializable.sym].serialize.call(p);
  console.log("Ex45 — symbol mixin:", serialized);
}

/** symbol for lazy initialization: compute on first access */
function ex46() {
  const CACHE = Symbol("cache");
  class ExpensiveComputer {
    constructor(n) { this.n = n; }
    get result() {
      if (!this[CACHE]) {
        console.log("Ex46 — computing...");
        this[CACHE] = Array.from({length: this.n}, (_, i) => i + 1)
          .reduce((sum, x) => sum + x, 0);
      }
      return this[CACHE];
    }
  }
  const comp = new ExpensiveComputer(100);
  console.log("Ex46 — first access:", comp.result);
  console.log("Ex46 — second access (cached):", comp.result);
}

/** symbol-keyed WeakMap for truly private state */
function ex47() {
  const _private = new WeakMap();
  const SECRET = Symbol("secret");
  class SecureData {
    constructor(value) {
      _private.set(this, { [SECRET]: value, accessCount: 0 });
    }
    access(token) {
      if (token !== SECRET) throw new Error("Invalid token");
      const state = _private.get(this);
      state.accessCount++;
      return state[SECRET];
    }
    get stats() { return { accessCount: _private.get(this).accessCount }; }
  }
  const data = new SecureData("top secret");
  data.access(SECRET);
  data.access(SECRET);
  console.log("Ex47 — SecureData access count:", data.stats.accessCount);
  try { data.access(Symbol("secret")); } catch(e) { console.log("Ex47 — invalid token:", e.message); }
}

/** symbol-based observer pattern */
function ex48() {
  const OBSERVERS = Symbol("observers");
  class Observable {
    constructor() { this[OBSERVERS] = new Map(); }
    on(event, fn) {
      const evSym = typeof event === "symbol" ? event : Symbol.for(event);
      if (!this[OBSERVERS].has(evSym)) this[OBSERVERS].set(evSym, []);
      this[OBSERVERS].get(evSym).push(fn);
      return () => { // unsubscribe
        const fns = this[OBSERVERS].get(evSym);
        this[OBSERVERS].set(evSym, fns.filter(f => f !== fn));
      };
    }
    emit(event, data) {
      const evSym = typeof event === "symbol" ? event : Symbol.for(event);
      (this[OBSERVERS].get(evSym) || []).forEach(fn => fn(data));
    }
  }
  const obs = new Observable();
  const DATA_EVENT = Symbol("data");
  const log = [];
  obs.on(DATA_EVENT, d => log.push(d));
  obs.emit(DATA_EVENT, 1);
  obs.emit(DATA_EVENT, 2);
  console.log("Ex48 — symbol observer:", log);
}

/** symbol for type tagging: discriminated unions */
function ex49() {
  const TYPE = Symbol("type");
  const SUCCESS = Symbol("Success");
  const FAILURE = Symbol("Failure");

  const Result = {
    ok: value => ({ [TYPE]: SUCCESS, value }),
    err: error => ({ [TYPE]: FAILURE, error }),
    isOk: r => r[TYPE] === SUCCESS,
    isErr: r => r[TYPE] === FAILURE,
    map: (r, fn) => Result.isOk(r) ? Result.ok(fn(r.value)) : r,
    getOrElse: (r, def) => Result.isOk(r) ? r.value : def
  };

  const ok = Result.map(Result.ok(5), x => x * 2);
  const err = Result.map(Result.err("not found"), x => x * 2);
  console.log("Ex49 — symbol Result type:", Result.getOrElse(ok, 0), Result.getOrElse(err, -1));
}

/** symbol-based extensible protocol: open closed principle */
function ex50() {
  const STRINGIFY = Symbol("stringify");
  const CLONE = Symbol("clone");

  // Core protocol
  function stringify(val) {
    if (val && typeof val[STRINGIFY] === "function") return val[STRINGIFY]();
    return JSON.stringify(val);
  }
  function clone(val) {
    if (val && typeof val[CLONE] === "function") return val[CLONE]();
    return JSON.parse(JSON.stringify(val));
  }

  class Point {
    constructor(x, y) { this.x = x; this.y = y; }
    [STRINGIFY]() { return `Point(${this.x}, ${this.y})`; }
    [CLONE]() { return new Point(this.x, this.y); }
  }
  class Circle {
    constructor(cx, cy, r) { this.cx = cx; this.cy = cy; this.r = r; }
    [STRINGIFY]() { return `Circle(center=(${this.cx},${this.cy}), r=${this.r})`; }
    [CLONE]() { return new Circle(this.cx, this.cy, this.r); }
  }

  const p = new Point(3, 4);
  const c = new Circle(0, 0, 5);
  const p2 = clone(p);
  console.log("Ex50 — symbol protocol:", stringify(p), stringify(c));
  console.log("Ex50 — cloned:", stringify(p2), p2 !== p);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== BASIC (1–13) ===");
  ex01(); ex02(); ex03(); ex04(); ex05(); ex06(); ex07(); ex08(); ex09(); ex10();
  ex11(); ex12(); ex13();
  console.log("=== INTERMEDIATE (14–26) ===");
  ex14(); ex15(); ex16(); ex17(); ex18(); ex19(); ex20(); ex21();
  await ex23(); ex24(); ex25(); ex26();
  console.log("=== NESTED (27–38) ===");
  ex27(); ex28(); ex29(); ex30(); ex31(); ex32(); ex33(); ex34(); ex35(); ex36();
  ex37(); ex38();
  console.log("=== ADVANCED (39–50) ===");
  ex39(); ex40(); ex41(); ex42(); ex43(); ex44(); ex45(); ex46(); ex47(); ex48();
  ex49(); ex50();
}

main();
