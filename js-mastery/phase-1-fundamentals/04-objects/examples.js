// ============================================================================
// Examples 1.4 — Objects  (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================================

"use strict";

// ─── BASIC (1–13) ────────────────────────────────────────────────────────────

/** Object literal */
function ex01() {
  const user = { name: "Alice", age: 30 };
  console.log("Ex01 —", user);
}

/** Dot notation access */
function ex02() {
  const car = { make: "Toyota", model: "Camry" };
  console.log("Ex02 —", car.make, car.model);
}

/** Bracket notation access */
function ex03() {
  const key = "color";
  const obj = { color: "red" };
  console.log("Ex03 —", obj[key]);
}

/** Property shorthand */
function ex04() {
  const x = 10, y = 20;
  const point = { x, y };
  console.log("Ex04 —", point);
}

/** Method shorthand */
function ex05() {
  const calc = {
    add(a, b) { return a + b; },
    sub(a, b) { return a - b; },
  };
  console.log("Ex05 —", calc.add(3, 4), calc.sub(10, 3));
}

/** Computed property keys */
function ex06() {
  const prefix = "user";
  const obj = { [`${prefix}Name`]: "Alice", [`${prefix}Age`]: 30 };
  console.log("Ex06 —", obj);
}

/** in operator */
function ex07() {
  const obj = { a: 1, b: undefined };
  console.log("Ex07 — 'a' in obj:", "a" in obj, "'c' in obj:", "c" in obj);
  console.log("Ex07 — 'b' in obj:", "b" in obj); // true even if undefined
}

/** delete operator */
function ex08() {
  const obj = { a: 1, b: 2, c: 3 };
  delete obj.b;
  console.log("Ex08 —", obj);
}

/** Object.keys, Object.values, Object.entries */
function ex09() {
  const obj = { x: 1, y: 2, z: 3 };
  console.log("Ex09 — keys:", Object.keys(obj));
  console.log("Ex09 — values:", Object.values(obj));
  console.log("Ex09 — entries:", Object.entries(obj));
}

/** Object.assign (shallow merge) */
function ex10() {
  const target = { a: 1, b: 2 };
  const result = Object.assign({}, target, { b: 99, c: 3 });
  console.log("Ex10 —", result, "original:", target);
}

/** Spread merge (preferred over Object.assign) */
function ex11() {
  const a = { x: 1 };
  const b = { y: 2 };
  const c = { ...a, ...b, z: 3 };
  console.log("Ex11 —", c);
}

/** hasOwnProperty */
function ex12() {
  const obj = { own: true };
  console.log("Ex12 — own:", obj.hasOwnProperty("own"));
  console.log("Ex12 — toString:", obj.hasOwnProperty("toString")); // false — inherited
}

/** for...in loop */
function ex13() {
  const obj = { a: 1, b: 2, c: 3 };
  const keys = [];
  for (const key in obj) {
    if (Object.hasOwn(obj, key)) keys.push(key);
  }
  console.log("Ex13 —", keys);
}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────────────────────

/** Object.fromEntries */
function ex14() {
  const entries = [["a", 1], ["b", 2], ["c", 3]];
  console.log("Ex14 —", Object.fromEntries(entries));
}

/** Transform object values using entries + fromEntries */
function ex15() {
  const prices = { apple: 1.5, banana: 0.5, cherry: 3.0 };
  const doubled = Object.fromEntries(
    Object.entries(prices).map(([k, v]) => [k, v * 2])
  );
  console.log("Ex15 —", doubled);
}

/** Object.freeze (shallow immutability) */
function ex16() {
  const config = Object.freeze({ host: "localhost", port: 3000 });
  try { config.port = 9999; } catch (e) { /* strict mode throws */ }
  console.log("Ex16 — frozen:", config.port); // still 3000
}

/** Object.seal */
function ex17() {
  const obj = Object.seal({ x: 1, y: 2 });
  obj.x = 99; // allowed (values can change)
  try { obj.z = 3; } catch(e) {} // not allowed (no new properties)
  console.log("Ex17 —", obj);
}

/** Property descriptors */
function ex18() {
  const obj = {};
  Object.defineProperty(obj, "id", {
    value: 42,
    writable: false,
    enumerable: true,
    configurable: false
  });
  console.log("Ex18 — id:", obj.id, "descriptor:", Object.getOwnPropertyDescriptor(obj, "id"));
}

/** Getter and setter */
function ex19() {
  const obj = {
    _name: "Alice",
    get name() { return this._name.toUpperCase(); },
    set name(v) { this._name = v.trim(); }
  };
  obj.name = "  Bob  ";
  console.log("Ex19 —", obj.name);
}

/** Symbol as non-enumerable key */
function ex20() {
  const id = Symbol("id");
  const user = { name: "Alice", [id]: 42 };
  console.log("Ex20 — name visible in keys:", Object.keys(user));
  console.log("Ex20 — symbol access:", user[id]);
}

/** Object.create for prototype chain */
function ex21() {
  const proto = { greet() { return `Hi, I'm ${this.name}`; } };
  const obj = Object.create(proto);
  obj.name = "Alice";
  console.log("Ex21 —", obj.greet());
}

/** Shallow clone patterns */
function ex22() {
  const original = { a: 1, b: { c: 2 } };
  const shallowSpread = { ...original };
  const shallowAssign = Object.assign({}, original);
  shallowSpread.b.c = 99;
  console.log("Ex22 — original.b.c:", original.b.c); // 99 — shared reference
}

/** Deep clone with structuredClone */
function ex23() {
  const original = { a: 1, b: { c: 2 } };
  const deep = structuredClone(original);
  deep.b.c = 99;
  console.log("Ex23 — original.b.c:", original.b.c, "deep.b.c:", deep.b.c);
}

/** Object.is for strict comparison */
function ex24() {
  console.log("Ex24 —",
    Object.is(NaN, NaN),  // true
    Object.is(0, -0),     // false
    Object.is(1, 1)       // true
  );
}

/** Object.getOwnPropertyNames vs Object.keys */
function ex25() {
  const obj = {};
  Object.defineProperty(obj, "hidden", { value: 42, enumerable: false });
  obj.visible = 1;
  console.log("Ex25 — keys:", Object.keys(obj));
  console.log("Ex25 — getOwnPropertyNames:", Object.getOwnPropertyNames(obj));
}

/** Reflect.ownKeys includes symbols */
function ex26() {
  const sym = Symbol("s");
  const obj = { a: 1, [sym]: 2 };
  console.log("Ex26 —", Reflect.ownKeys(obj));
}

// ─── NESTED (27–38) ──────────────────────────────────────────────────────────

/** pick utility */
function ex27() {
  const pick = (obj, keys) =>
    Object.fromEntries(keys.filter(k => k in obj).map(k => [k, obj[k]]));
  const user = { id: 1, name: "Alice", password: "secret", age: 30 };
  console.log("Ex27 —", pick(user, ["id", "name", "age"]));
}

/** omit utility */
function ex28() {
  const omit = (obj, keys) => {
    const s = new Set(keys);
    return Object.fromEntries(Object.entries(obj).filter(([k]) => !s.has(k)));
  };
  const user = { id: 1, name: "Alice", password: "secret" };
  console.log("Ex28 —", omit(user, ["password"]));
}

/** mapValues */
function ex29() {
  const mapValues = (obj, fn) =>
    Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v, k)]));
  const prices = { apple: 1, banana: 2, cherry: 3 };
  console.log("Ex29 —", mapValues(prices, v => `$${v.toFixed(2)}`));
}

/** filterKeys */
function ex30() {
  const filterKeys = (obj, pred) =>
    Object.fromEntries(Object.entries(obj).filter(([k, v]) => pred(k, v)));
  const obj = { a: 1, b: null, c: 3, d: undefined };
  console.log("Ex30 —", filterKeys(obj, (k, v) => v != null));
}

/** Deep merge */
function ex31() {
  function deepMerge(a, b) {
    const result = { ...a };
    for (const [k, v] of Object.entries(b)) {
      result[k] = (v && typeof v === "object" && !Array.isArray(v)
        && a[k] && typeof a[k] === "object")
        ? deepMerge(a[k], v)
        : v;
    }
    return result;
  }
  const a = { x: 1, nested: { y: 2, z: 3 } };
  const b = { nested: { y: 99, w: 4 }, extra: 5 };
  console.log("Ex31 —", deepMerge(a, b));
}

/** Invert object (swap keys and values) */
function ex32() {
  const invert = obj =>
    Object.fromEntries(Object.entries(obj).map(([k, v]) => [v, k]));
  const map = { a: "1", b: "2", c: "3" };
  console.log("Ex32 —", invert(map));
}

/** Count properties */
function ex33() {
  const obj = { a: 1, b: 2, c: 3, d: 4 };
  console.log("Ex33 — count:", Object.keys(obj).length);
}

/** Object to query string */
function ex34() {
  const params = { page: 1, limit: 20, sort: "name" };
  const qs = Object.entries(params).map(([k, v]) => `${k}=${v}`).join("&");
  console.log("Ex34 —", `?${qs}`);
}

/** Flatten nested object */
function ex35() {
  function flatten(obj, prefix = "", result = {}) {
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, key, result);
      else result[key] = v;
    }
    return result;
  }
  const nested = { a: { b: { c: 1 }, d: 2 }, e: 3 };
  console.log("Ex35 —", flatten(nested));
}

/** Object.hasOwn (modern replacement for hasOwnProperty) */
function ex36() {
  const obj = { a: 1 };
  console.log("Ex36 —",
    Object.hasOwn(obj, "a"),          // true
    Object.hasOwn(obj, "toString")    // false
  );
}

/** Proxy for defaults */
function ex37() {
  const withDefaults = (defaults, obj) =>
    new Proxy(obj, {
      get(target, key) { return key in target ? target[key] : defaults[key]; }
    });
  const config = withDefaults({ timeout: 5000, retries: 3 }, { timeout: 1000 });
  console.log("Ex37 — timeout:", config.timeout, "retries:", config.retries);
}

/** Object.entries sorted */
function ex38() {
  const obj = { c: 3, a: 1, b: 2 };
  const sorted = Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
  console.log("Ex38 —", sorted);
}

// ─── ADVANCED (39–50) ────────────────────────────────────────────────────────

/** Deeply freeze object */
function ex39() {
  function deepFreeze(obj) {
    Object.getOwnPropertyNames(obj).forEach(name => {
      const val = obj[name];
      if (val && typeof val === "object") deepFreeze(val);
    });
    return Object.freeze(obj);
  }
  const config = deepFreeze({ db: { host: "localhost", port: 5432 } });
  try { config.db.port = 9999; } catch(e) {}
  console.log("Ex39 —", config.db.port); // 5432
}

/** Mixin pattern */
function ex40() {
  const Timestamped = (Base) => class extends Base {
    constructor(...args) { super(...args); this.createdAt = new Date().toISOString(); }
  };
  const Activatable = (Base) => class extends Base {
    activate() { this.active = true; return this; }
    deactivate() { this.active = false; return this; }
  };
  class User extends Timestamped(Activatable(class { constructor(n) { this.name = n; } })) {}
  const u = new User("Alice");
  u.activate();
  console.log("Ex40 —", u.name, u.active, typeof u.createdAt);
}

/** Builder pattern */
function ex41() {
  class QueryBuilder {
    #q = { select: "*", where: [], limit: null };
    select(cols) { this.#q.select = cols; return this; }
    where(cond) { this.#q.where.push(cond); return this; }
    limit(n) { this.#q.limit = n; return this; }
    build() {
      let sql = `SELECT ${this.#q.select} FROM table`;
      if (this.#q.where.length) sql += ` WHERE ${this.#q.where.join(" AND ")}`;
      if (this.#q.limit) sql += ` LIMIT ${this.#q.limit}`;
      return sql;
    }
  }
  const q = new QueryBuilder().select("id, name").where("age > 18").where("active = true").limit(10).build();
  console.log("Ex41 —", q);
}

/** Immutable record updates */
function ex42() {
  const update = (obj, changes) => ({ ...obj, ...changes });
  const updateIn = (obj, [key, ...rest], val) =>
    rest.length === 0 ? update(obj, { [key]: val })
      : update(obj, { [key]: updateIn(obj[key] || {}, rest, val) });
  const state = { user: { name: "Alice", address: { city: "NYC" } } };
  const next = updateIn(state, ["user", "address", "city"], "LA");
  console.log("Ex42 — original:", state.user.address.city, "next:", next.user.address.city);
}

/** Object pool */
function ex43() {
  function createPool(factory, size) {
    const pool = Array.from({ length: size }, factory);
    let index = 0;
    return { acquire: () => pool[index++ % size] };
  }
  const pool = createPool(() => ({ buffer: new Array(100).fill(0) }), 3);
  const a = pool.acquire();
  const b = pool.acquire();
  console.log("Ex43 — same object:", a === pool.acquire()); // cycles back
}

/** Object diff */
function ex44() {
  function diff(a, b) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    const result = {};
    for (const k of keys) {
      if (a[k] !== b[k]) result[k] = { from: a[k], to: b[k] };
    }
    return result;
  }
  console.log("Ex44 —", diff({ a:1, b:2, c:3 }, { a:1, b:99, d:4 }));
}

/** Schema validation */
function ex45() {
  function validate(obj, schema) {
    const errors = [];
    for (const [key, rule] of Object.entries(schema)) {
      const val = obj[key];
      if (rule.required && val == null) errors.push(`${key} is required`);
      if (rule.type && val != null && typeof val !== rule.type)
        errors.push(`${key} must be ${rule.type}`);
    }
    return errors;
  }
  const schema = { name: { required: true, type: "string" }, age: { required: true, type: "number" } };
  console.log("Ex45 — valid:", validate({ name: "Alice", age: 30 }, schema));
  console.log("Ex45 — invalid:", validate({ name: 123 }, schema));
}

/** Observable object via Proxy */
function ex46() {
  function observable(obj) {
    const listeners = [];
    const proxy = new Proxy(obj, {
      set(target, key, value) {
        const old = target[key];
        target[key] = value;
        listeners.forEach(fn => fn(key, value, old));
        return true;
      }
    });
    return { proxy, onChange: fn => listeners.push(fn) };
  }
  const { proxy, onChange } = observable({ count: 0 });
  onChange((k, v, old) => console.log(`Ex46 — ${k}: ${old} → ${v}`));
  proxy.count = 1;
  proxy.count = 2;
}

/** Lazy properties (defineProperty with getter) */
function ex47() {
  function lazyProp(obj, key, compute) {
    Object.defineProperty(obj, key, {
      get() {
        const val = compute();
        Object.defineProperty(obj, key, { value: val, writable: false });
        return val;
      },
      configurable: true
    });
  }
  const config = {};
  lazyProp(config, "expensiveData", () => { return [1,2,3].map(x => x * x); });
  console.log("Ex47 —", config.expensiveData, config.expensiveData); // computed once
}

/** Serialize / deserialize with class instances */
function ex48() {
  class Color {
    constructor(r, g, b) { this.r = r; this.g = g; this.b = b; }
    toHex() { return `#${[this.r,this.g,this.b].map(v=>v.toString(16).padStart(2,"0")).join("")}`; }
    static fromJSON(json) { return new Color(json.r, json.g, json.b); }
    toJSON() { return { r: this.r, g: this.g, b: this.b }; }
  }
  const c = new Color(255, 128, 0);
  const serialized = JSON.stringify(c);
  const restored = Color.fromJSON(JSON.parse(serialized));
  console.log("Ex48 —", c.toHex(), restored.toHex());
}

/** Object.create with full descriptor map */
function ex49() {
  const obj = Object.create(Object.prototype, {
    name: { value: "Alice", writable: true, enumerable: true, configurable: true },
    greet: { value() { return `Hi, I'm ${this.name}`; }, enumerable: false }
  });
  console.log("Ex49 —", obj.greet(), Object.keys(obj));
}

/** Complete record type with validation and immutability */
function ex50() {
  function createRecord(schema) {
    return function(data) {
      const errors = [];
      for (const [k, type] of Object.entries(schema)) {
        if (!(k in data)) errors.push(`Missing: ${k}`);
        else if (typeof data[k] !== type) errors.push(`${k} must be ${type}`);
      }
      if (errors.length) throw new Error(errors.join("; "));
      return Object.freeze({ ...data });
    };
  }
  const User = createRecord({ name: "string", age: "number" });
  const u = User({ name: "Alice", age: 30 });
  console.log("Ex50 —", u, Object.isFrozen(u));
}

function main() {
  console.log("=".repeat(60));
  console.log("Examples 1.4 — Objects");
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
