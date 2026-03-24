// Examples 5.1 — Factory & Module Pattern
"use strict";

// ─── BASIC (ex01–ex13) ────────────────────────────────────────────────────────

/** @example ex01 — Simple factory function */
function ex01() {
  function createPoint(x, y) {
    return { x, y, toString() { return `(${x}, ${y})`; } };
  }
  const p = createPoint(3, 4);
  console.log("ex01 simple factory:", p.toString());
}

/** @example ex02 — Factory with default values */
function ex02() {
  function createConfig(options = {}) {
    return {
      host: options.host || "localhost",
      port: options.port || 3000,
      debug: options.debug !== undefined ? options.debug : false,
    };
  }
  const cfg = createConfig({ port: 8080 });
  console.log("ex02 factory with defaults:", cfg);
}

/** @example ex03 — Factory with validation */
function ex03() {
  function createAge(n) {
    if (typeof n !== "number" || n < 0 || n > 150) throw new Error("Invalid age");
    return Object.freeze({ value: n, isAdult: n >= 18 });
  }
  const age = createAge(25);
  console.log("ex03 factory with validation:", age);
}

/** @example ex04 — Object literal module */
function ex04() {
  const MathUtils = {
    PI: 3.14159,
    square(n) { return n * n; },
    cube(n) { return n * n * n; },
    circleArea(r) { return this.PI * this.square(r); },
  };
  console.log("ex04 object literal module:", MathUtils.circleArea(5).toFixed(2));
}

/** @example ex05 — IIFE module with private state */
function ex05() {
  const BankAccount = (() => {
    let balance = 0;
    return {
      deposit(amount) { balance += amount; },
      withdraw(amount) { if (amount > balance) throw new Error("Insufficient"); balance -= amount; },
      get balance() { return balance; },
    };
  })();
  BankAccount.deposit(100);
  BankAccount.withdraw(30);
  console.log("ex05 IIFE private state, balance:", BankAccount.balance);
}

/** @example ex06 — IIFE module — public API with internal helpers */
function ex06() {
  const StringHelper = (() => {
    function _capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
    function _trim(s) { return s.trim(); }
    return {
      format(s) { return _capitalize(_trim(s)); },
      words(s) { return _trim(s).split(/\s+/); },
    };
  })();
  console.log("ex06 IIFE public API:", StringHelper.format("  hello world  "));
}

/** @example ex07 — Revealing module pattern */
function ex07() {
  const Calculator = (() => {
    let history = [];
    function add(a, b) { const r = a + b; history.push(`${a}+${b}=${r}`); return r; }
    function subtract(a, b) { const r = a - b; history.push(`${a}-${b}=${r}`); return r; }
    function getHistory() { return [...history]; }
    return { add, subtract, getHistory };
  })();
  Calculator.add(5, 3);
  Calculator.subtract(10, 4);
  console.log("ex07 revealing module history:", Calculator.getHistory());
}

/** @example ex08 — Module augmentation */
function ex08() {
  const BaseModule = (() => {
    const data = [];
    return {
      add(item) { data.push(item); },
      getAll() { return [...data]; },
    };
  })();
  // Augment with search
  BaseModule.search = function(pred) { return this.getAll().filter(pred); };
  BaseModule.add("apple"); BaseModule.add("banana"); BaseModule.add("avocado");
  console.log("ex08 module augmentation search:", BaseModule.search(x => x.startsWith("a")));
}

/** @example ex09 — Namespace pattern */
function ex09() {
  const App = App || {};
  App.utils = {
    clamp: (val, min, max) => Math.min(Math.max(val, min), max),
    lerp: (a, b, t) => a + (b - a) * t,
  };
  App.config = { version: "1.0.0", env: "dev" };
  console.log("ex09 namespace pattern:", App.utils.clamp(150, 0, 100), App.config.version);
}

/** @example ex10 — Factory returning frozen object */
function ex10() {
  function createVector(x, y) {
    return Object.freeze({
      x, y,
      add(v) { return createVector(x + v.x, y + v.y); },
      scale(s) { return createVector(x * s, y * s); },
      magnitude() { return Math.sqrt(x * x + y * y); },
    });
  }
  const v = createVector(3, 4);
  console.log("ex10 factory frozen object, magnitude:", v.magnitude(), "add:", v.add(createVector(1, 0)).x);
}

/** @example ex11 — Factory with private methods */
function ex11() {
  function createPassword(raw) {
    function _hash(s) { return s.split("").reverse().join("") + "_hashed"; }
    const hashed = _hash(raw);
    return {
      verify(input) { return _hash(input) === hashed; },
      toString() { return "[Password]"; },
    };
  }
  const pw = createPassword("secret123");
  console.log("ex11 factory private methods, verify:", pw.verify("secret123"), pw.toString());
}

/** @example ex12 — Factory with inheritance via Object.create */
function ex12() {
  const animalProto = {
    speak() { return `${this.name} says ${this.sound}`; },
    toString() { return `[${this.type}: ${this.name}]`; },
  };
  function createAnimal(name, sound, type) {
    return Object.assign(Object.create(animalProto), { name, sound, type });
  }
  const dog = createAnimal("Rex", "woof", "Dog");
  console.log("ex12 factory with proto:", dog.speak(), String(dog));
}

/** @example ex13 — Mixin-based factory */
function ex13() {
  const Serializable = {
    serialize() { return JSON.stringify(this); },
  };
  const Validatable = {
    isValid() { return Object.values(this).every(v => v !== null && v !== undefined); },
  };
  function createEntity(data) {
    return Object.assign({}, data, Serializable, Validatable);
  }
  const entity = createEntity({ id: 1, name: "Test" });
  console.log("ex13 mixin factory, valid:", entity.isValid(), "serial:", entity.serialize());
}

// ─── INTERMEDIATE (ex14–ex26) ─────────────────────────────────────────────────

/** @example ex14 — Singleton pattern */
function ex14() {
  const Database = (() => {
    let instance = null;
    function createInstance() {
      return { connected: false, connect() { this.connected = true; }, query(sql) { return `result:${sql}`; } };
    }
    return {
      getInstance() {
        if (!instance) instance = createInstance();
        return instance;
      },
    };
  })();
  const db1 = Database.getInstance();
  const db2 = Database.getInstance();
  console.log("ex14 singleton:", db1 === db2);
}

/** @example ex15 — Lazy singleton */
function ex15() {
  const ExpensiveService = (() => {
    let instance = null;
    return {
      get() {
        if (!instance) {
          // Simulate expensive initialization
          instance = { id: Math.random(), initialized: true, compute: (n) => n * n };
        }
        return instance;
      },
    };
  })();
  const s1 = ExpensiveService.get();
  const s2 = ExpensiveService.get();
  console.log("ex15 lazy singleton same id:", s1.id === s2.id);
}

/** @example ex16 — Multiton pattern */
function ex16() {
  const ConnectionPool = (() => {
    const pools = new Map();
    return {
      getPool(key) {
        if (!pools.has(key)) {
          pools.set(key, { key, connections: [], add(c) { this.connections.push(c); } });
        }
        return pools.get(key);
      },
    };
  })();
  const p1 = ConnectionPool.getPool("primary");
  const p2 = ConnectionPool.getPool("replica");
  p1.add("conn-a");
  console.log("ex16 multiton, same primary:", ConnectionPool.getPool("primary") === p1, "pools:", ["primary","replica"].map(k => ConnectionPool.getPool(k).key));
}

/** @example ex17 — Factory method pattern */
function ex17() {
  class Logger {
    log(msg) { return `[${this.prefix}] ${msg}`; }
  }
  class ConsoleLogger extends Logger { constructor() { super(); this.prefix = "CONSOLE"; } }
  class FileLogger extends Logger { constructor() { super(); this.prefix = "FILE"; } }
  function createLogger(type) {
    if (type === "console") return new ConsoleLogger();
    if (type === "file") return new FileLogger();
    throw new Error(`Unknown logger type: ${type}`);
  }
  const cl = createLogger("console");
  const fl = createLogger("file");
  console.log("ex17 factory method:", cl.log("hello"), fl.log("world"));
}

/** @example ex18 — Abstract factory */
function ex18() {
  function createUIFactory(theme) {
    const styles = theme === "dark" ? { bg: "#333", fg: "#fff" } : { bg: "#fff", fg: "#000" };
    return {
      createButton(label) { return { type: "button", label, style: styles }; },
      createInput(placeholder) { return { type: "input", placeholder, style: styles }; },
    };
  }
  const darkFactory = createUIFactory("dark");
  const lightFactory = createUIFactory("light");
  const btn = darkFactory.createButton("Submit");
  console.log("ex18 abstract factory:", btn.label, btn.style.bg, lightFactory.createInput("Email").style.bg);
}

/** @example ex19 — Registry pattern */
function ex19() {
  const Registry = (() => {
    const entries = new Map();
    return {
      register(name, factory) { entries.set(name, factory); },
      create(name, ...args) {
        const factory = entries.get(name);
        if (!factory) throw new Error(`No factory for: ${name}`);
        return factory(...args);
      },
      has(name) { return entries.has(name); },
    };
  })();
  Registry.register("user", (name) => ({ type: "user", name }));
  Registry.register("admin", (name) => ({ type: "admin", name, level: "super" }));
  console.log("ex19 registry:", Registry.create("user", "Alice"), Registry.has("admin"));
}

/** @example ex20 — Service locator pattern */
function ex20() {
  const ServiceLocator = (() => {
    const services = {};
    return {
      register(name, service) { services[name] = service; },
      resolve(name) {
        if (!services[name]) throw new Error(`Service not found: ${name}`);
        return services[name];
      },
    };
  })();
  ServiceLocator.register("logger", { log: (m) => `LOG: ${m}` });
  ServiceLocator.register("cache", { get: (k) => null, set: (k, v) => {} });
  const logger = ServiceLocator.resolve("logger");
  console.log("ex20 service locator:", logger.log("app started"));
}

/** @example ex21 — Dependency injection container concept */
function ex21() {
  function createContainer() {
    const bindings = new Map();
    return {
      bind(name, factory) { bindings.set(name, factory); },
      make(name) {
        const factory = bindings.get(name);
        if (!factory) throw new Error(`No binding for: ${name}`);
        return factory(this);
      },
    };
  }
  const container = createContainer();
  container.bind("config", () => ({ db: "postgres://localhost/mydb" }));
  container.bind("db", (c) => ({ config: c.make("config"), query: (sql) => `[DB] ${sql}` }));
  const db = container.make("db");
  console.log("ex21 DI container:", db.query("SELECT 1"), db.config.db);
}

/** @example ex22 — Object pool pattern */
function ex22() {
  function createObjectPool(factory, maxSize = 5) {
    const available = [];
    let totalCreated = 0;
    return {
      acquire() {
        if (available.length > 0) return available.pop();
        if (totalCreated < maxSize) { totalCreated++; return factory(); }
        throw new Error("Pool exhausted");
      },
      release(obj) { available.push(obj); },
      get stats() { return { available: available.length, total: totalCreated }; },
    };
  }
  const pool = createObjectPool(() => ({ id: Math.random(), data: null }), 3);
  const obj1 = pool.acquire();
  const obj2 = pool.acquire();
  pool.release(obj1);
  console.log("ex22 object pool stats:", pool.stats);
}

/** @example ex23 — Flyweight pattern */
function ex23() {
  const TreeFactory = (() => {
    const sharedTypes = new Map();
    return {
      getType(species, color, texture) {
        const key = `${species}|${color}|${texture}`;
        if (!sharedTypes.has(key)) sharedTypes.set(key, { species, color, texture });
        return sharedTypes.get(key);
      },
      typeCount() { return sharedTypes.size; },
    };
  })();
  function createTree(x, y, species) {
    return { x, y, type: TreeFactory.getType(species, "green", "rough") };
  }
  const trees = [createTree(1,2,"oak"), createTree(3,4,"oak"), createTree(5,6,"pine")];
  console.log("ex23 flyweight, trees:", trees.length, "shared types:", TreeFactory.typeCount(), "same type ref:", trees[0].type === trees[1].type);
}

/** @example ex24 — Builder pattern via factory */
function ex24() {
  function createQueryBuilder(table) {
    let _where = [];
    let _limit = null;
    let _orderBy = null;
    return {
      where(cond) { _where.push(cond); return this; },
      limit(n) { _limit = n; return this; },
      orderBy(col) { _orderBy = col; return this; },
      build() {
        let q = `SELECT * FROM ${table}`;
        if (_where.length) q += ` WHERE ${_where.join(" AND ")}`;
        if (_orderBy) q += ` ORDER BY ${_orderBy}`;
        if (_limit !== null) q += ` LIMIT ${_limit}`;
        return q;
      },
    };
  }
  const query = createQueryBuilder("users").where("age > 18").where("active = 1").orderBy("name").limit(10).build();
  console.log("ex24 builder factory:", query);
}

/** @example ex25 — Prototype factory */
function ex25() {
  const baseConfig = { timeout: 5000, retries: 3, debug: false };
  function createConfigFrom(base, overrides) {
    return Object.assign(Object.create(null), base, overrides);
  }
  const devConfig = createConfigFrom(baseConfig, { debug: true, timeout: 1000 });
  const prodConfig = createConfigFrom(baseConfig, { retries: 5 });
  console.log("ex25 prototype factory, dev:", devConfig.debug, devConfig.timeout, "prod retries:", prodConfig.retries);
}

/** @example ex26 — Parameterized factory */
function ex26() {
  function createValidator(rules) {
    return function validate(value) {
      const errors = [];
      if (rules.required && (value === null || value === undefined || value === "")) errors.push("required");
      if (rules.minLength && typeof value === "string" && value.length < rules.minLength) errors.push(`minLength:${rules.minLength}`);
      if (rules.maxLength && typeof value === "string" && value.length > rules.maxLength) errors.push(`maxLength:${rules.maxLength}`);
      if (rules.pattern && !rules.pattern.test(value)) errors.push("pattern");
      return { valid: errors.length === 0, errors };
    };
  }
  const emailValidator = createValidator({ required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ });
  console.log("ex26 parameterized factory:", emailValidator("test@example.com"), emailValidator("not-an-email"));
}

// ─── NESTED (ex27–ex38) ───────────────────────────────────────────────────────

/** @example ex27 — Plugin system */
function ex27() {
  function createApp() {
    const plugins = [];
    const hooks = {};
    return {
      use(plugin) { plugins.push(plugin); plugin.install(this); return this; },
      on(hook, fn) { (hooks[hook] = hooks[hook] || []).push(fn); },
      emit(hook, ctx) { (hooks[hook] || []).forEach(fn => fn(ctx)); },
      plugins: () => plugins.map(p => p.name),
    };
  }
  const app = createApp();
  app.use({ name: "logger", install(a) { a.on("request", ctx => ctx.logs.push("logged")); } });
  app.use({ name: "auth", install(a) { a.on("request", ctx => { ctx.authenticated = true; }); } });
  const ctx = { logs: [] };
  app.emit("request", ctx);
  console.log("ex27 plugin system, plugins:", app.plugins(), "ctx:", ctx);
}

/** @example ex28 — Middleware registration */
function ex28() {
  function createMiddlewareChain() {
    const mws = [];
    return {
      use(fn) { mws.push(fn); return this; },
      execute(ctx) {
        let i = 0;
        function next() { if (i < mws.length) mws[i++](ctx, next); }
        next();
        return ctx;
      },
    };
  }
  const chain = createMiddlewareChain();
  chain.use((ctx, next) => { ctx.steps = []; ctx.steps.push("parse"); next(); });
  chain.use((ctx, next) => { ctx.steps.push("auth"); next(); });
  chain.use((ctx, next) => { ctx.steps.push("handler"); });
  const result = chain.execute({});
  console.log("ex28 middleware chain:", result.steps);
}

/** @example ex29 — Feature flag system */
function ex29() {
  function createFeatureFlags(config = {}) {
    const flags = Object.assign({}, config);
    const overrides = {};
    return {
      isEnabled(flag) { return flag in overrides ? overrides[flag] : !!flags[flag]; },
      enable(flag) { overrides[flag] = true; },
      disable(flag) { overrides[flag] = false; },
      reset(flag) { delete overrides[flag]; },
      all() { const all = Object.assign({}, flags, overrides); return all; },
    };
  }
  const flags = createFeatureFlags({ darkMode: false, beta: true, newCheckout: false });
  flags.enable("darkMode");
  console.log("ex29 feature flags:", flags.isEnabled("darkMode"), flags.isEnabled("beta"), flags.isEnabled("newCheckout"));
}

/** @example ex30 — Configuration factory with environments */
function ex30() {
  function createEnvConfig(env) {
    const base = { logLevel: "warn", maxConnections: 10, timeout: 30000 };
    const envConfigs = {
      development: { logLevel: "debug", timeout: 5000, hot: true },
      production: { logLevel: "error", maxConnections: 100, ssl: true },
      test: { logLevel: "silent", timeout: 1000, mock: true },
    };
    return Object.assign({}, base, envConfigs[env] || {}, { env });
  }
  const devCfg = createEnvConfig("development");
  const prodCfg = createEnvConfig("production");
  console.log("ex30 env config, dev:", devCfg.logLevel, "prod connections:", prodCfg.maxConnections);
}

/** @example ex31 — Adapter factory */
function ex31() {
  function createStorageAdapter(type) {
    const store = {};
    const adapters = {
      memory: {
        get: (k) => store[k] || null,
        set: (k, v) => { store[k] = v; },
        remove: (k) => { delete store[k]; },
      },
      prefixed: (prefix) => ({
        get: (k) => store[`${prefix}:${k}`] || null,
        set: (k, v) => { store[`${prefix}:${k}`] = v; },
        remove: (k) => { delete store[`${prefix}:${k}`]; },
      }),
    };
    if (type === "prefixed") return adapters.prefixed("app");
    return adapters[type] || adapters.memory;
  }
  const mem = createStorageAdapter("memory");
  const pfx = createStorageAdapter("prefixed");
  mem.set("key", "val"); pfx.set("key", "prefixed-val");
  console.log("ex31 adapter factory:", mem.get("key"), pfx.get("key"));
}

/** @example ex32 — Decorator factory */
function ex32() {
  function withLogging(fn, name = fn.name) {
    return function(...args) {
      console.log(`ex32 [LOG] calling ${name} with`, args);
      const result = fn.apply(this, args);
      console.log(`ex32 [LOG] ${name} returned`, result);
      return result;
    };
  }
  function withMemoization(fn) {
    const cache = new Map();
    return function(...args) {
      const key = JSON.stringify(args);
      if (!cache.has(key)) cache.set(key, fn.apply(this, args));
      return cache.get(key);
    };
  }
  function add(a, b) { return a + b; }
  const loggedAdd = withLogging(add, "add");
  const memoAdd = withMemoization(add);
  loggedAdd(2, 3);
  console.log("ex32 decorator factory memoized:", memoAdd(2, 3), memoAdd(2, 3));
}

/** @example ex33 — Command factory */
function ex33() {
  function createCommand(execute, undo) {
    return { execute, undo };
  }
  function createCommandHistory() {
    const history = [];
    return {
      execute(cmd) { cmd.execute(); history.push(cmd); },
      undo() { const cmd = history.pop(); if (cmd) cmd.undo(); },
      get length() { return history.length; },
    };
  }
  let value = 0;
  const history = createCommandHistory();
  history.execute(createCommand(() => { value += 10; }, () => { value -= 10; }));
  history.execute(createCommand(() => { value *= 2; }, () => { value /= 2; }));
  console.log("ex33 command factory, value:", value);
  history.undo();
  console.log("ex33 after undo:", value);
}

/** @example ex34 — Strategy registry */
function ex34() {
  function createSorter() {
    const strategies = {
      bubble: (arr) => { const a = [...arr]; for (let i = 0; i < a.length; i++) for (let j = 0; j < a.length - i - 1; j++) if (a[j] > a[j+1]) [a[j], a[j+1]] = [a[j+1], a[j]]; return a; },
      insertion: (arr) => { const a = [...arr]; for (let i = 1; i < a.length; i++) { let j = i; while (j > 0 && a[j-1] > a[j]) { [a[j-1], a[j]] = [a[j], a[j-1]]; j--; } } return a; },
      native: (arr) => [...arr].sort((a, b) => a - b),
    };
    let strategy = "native";
    return {
      setStrategy(name) { if (!strategies[name]) throw new Error(`Unknown: ${name}`); strategy = name; },
      sort(arr) { return strategies[strategy](arr); },
    };
  }
  const sorter = createSorter();
  const arr = [5, 2, 8, 1, 9, 3];
  sorter.setStrategy("bubble");
  console.log("ex34 strategy registry, bubble:", sorter.sort(arr));
  sorter.setStrategy("native");
  console.log("ex34 native:", sorter.sort(arr));
}

/** @example ex35 — Observer factory */
function ex35() {
  function createObservable(initialValue) {
    let value = initialValue;
    const observers = [];
    return {
      subscribe(fn) { observers.push(fn); return () => { const i = observers.indexOf(fn); if (i > -1) observers.splice(i, 1); }; },
      get value() { return value; },
      set value(v) { value = v; observers.forEach(fn => fn(v)); },
    };
  }
  const count = createObservable(0);
  const log = [];
  const unsub = count.subscribe(v => log.push(v));
  count.value = 1; count.value = 2;
  unsub();
  count.value = 3; // not observed
  console.log("ex35 observer factory log:", log, "current:", count.value);
}

/** @example ex36 — Chain of responsibility factory */
function ex36() {
  function createHandler(name, canHandle, handle) {
    return {
      name,
      canHandle,
      handle,
      setNext(handler) { this.next = handler; return handler; },
      process(request) {
        if (this.canHandle(request)) return this.handle(request);
        if (this.next) return this.next.process(request);
        return `Unhandled: ${request}`;
      },
    };
  }
  const numHandler = createHandler("number", (r) => typeof r === "number", (r) => `Number: ${r * 2}`);
  const strHandler = createHandler("string", (r) => typeof r === "string", (r) => `String: ${r.toUpperCase()}`);
  const boolHandler = createHandler("bool", (r) => typeof r === "boolean", (r) => `Bool: ${!r}`);
  numHandler.setNext(strHandler).setNext(boolHandler);
  console.log("ex36 chain factory:", numHandler.process(5), numHandler.process("hello"), numHandler.process(true));
}

/** @example ex37 — Composite factory */
function ex37() {
  function createLeaf(name, value) {
    return { name, isLeaf: true, getValue() { return value; }, toString() { return `${name}:${value}`; } };
  }
  function createComposite(name) {
    const children = [];
    return {
      name, isLeaf: false,
      add(child) { children.push(child); return this; },
      getValue() { return children.reduce((sum, c) => sum + c.getValue(), 0); },
      toString() { return `${name}(${children.map(c => c.toString()).join(",")})`; },
    };
  }
  const root = createComposite("root");
  const branch = createComposite("branch");
  branch.add(createLeaf("a", 3)).add(createLeaf("b", 5));
  root.add(branch).add(createLeaf("c", 2));
  console.log("ex37 composite factory:", root.toString(), "total:", root.getValue());
}

/** @example ex38 — State machine factory */
function ex38() {
  function createStateMachine(initial, transitions) {
    let state = initial;
    const history = [initial];
    return {
      get state() { return state; },
      transition(event) {
        const key = `${state}:${event}`;
        const next = transitions[key];
        if (!next) throw new Error(`Invalid transition: ${key}`);
        state = next;
        history.push(state);
        return this;
      },
      can(event) { return `${state}:${event}` in transitions; },
      get history() { return [...history]; },
    };
  }
  const traffic = createStateMachine("red", {
    "red:go": "green", "green:slow": "yellow", "yellow:stop": "red",
  });
  traffic.transition("go").transition("slow").transition("stop");
  console.log("ex38 state machine:", traffic.state, "history:", traffic.history);
}

// ─── ADVANCED (ex39–ex50) ─────────────────────────────────────────────────────

/** @example ex39 — IoC container */
function ex39() {
  function createIoCContainer() {
    const registry = new Map();
    const singletons = new Map();
    return {
      register(name, factory, { singleton = false } = {}) {
        registry.set(name, { factory, singleton });
      },
      resolve(name) {
        const entry = registry.get(name);
        if (!entry) throw new Error(`Not registered: ${name}`);
        if (entry.singleton) {
          if (!singletons.has(name)) singletons.set(name, entry.factory(this));
          return singletons.get(name);
        }
        return entry.factory(this);
      },
    };
  }
  const ioc = createIoCContainer();
  ioc.register("config", () => ({ dbUrl: "postgres://localhost/app" }), { singleton: true });
  ioc.register("db", (c) => ({ url: c.resolve("config").dbUrl, query: (s) => `[DB:${s}]` }));
  ioc.register("repo", (c) => ({ db: c.resolve("db"), find: (id) => c.resolve("db").query(`SELECT * WHERE id=${id}`) }));
  const repo = ioc.resolve("repo");
  console.log("ex39 IoC container:", repo.find(42), ioc.resolve("config") === ioc.resolve("config"));
}

/** @example ex40 — Dynamic module factory */
function ex40() {
  function createModuleLoader() {
    const modules = new Map();
    const loading = new Map();
    return {
      define(name, deps, factory) {
        modules.set(name, { deps, factory, exports: null });
      },
      require(name) {
        const mod = modules.get(name);
        if (!mod) throw new Error(`Module not found: ${name}`);
        if (mod.exports !== null) return mod.exports;
        const depExports = mod.deps.map(d => this.require(d));
        mod.exports = mod.factory(...depExports);
        return mod.exports;
      },
    };
  }
  const loader = createModuleLoader();
  loader.define("utils", [], () => ({ add: (a, b) => a + b, mul: (a, b) => a * b }));
  loader.define("math", ["utils"], (utils) => ({ sum: (arr) => arr.reduce(utils.add, 0) }));
  const math = loader.require("math");
  console.log("ex40 dynamic module factory, sum:", math.sum([1,2,3,4,5]));
}

/** @example ex41 — Lazy module factory */
function ex41() {
  function lazy(factory) {
    let value;
    let initialized = false;
    return new Proxy({}, {
      get(_, prop) {
        if (!initialized) { value = factory(); initialized = true; }
        return value[prop];
      },
    });
  }
  let initCount = 0;
  const heavyModule = lazy(() => {
    initCount++;
    return { data: [1,2,3], compute: (n) => n * 100 };
  });
  console.log("ex41 lazy module (not yet init, initCount):", initCount);
  console.log("ex41 first access:", heavyModule.compute(5), "initCount:", initCount);
  console.log("ex41 second access:", heavyModule.data, "initCount:", initCount);
}

/** @example ex42 — Async factory */
function ex42() {
  async function createAsyncService(name) {
    // Simulate async initialization
    await new Promise(r => setTimeout(r, 0));
    return {
      name,
      initialized: true,
      fetch: async (id) => { await new Promise(r => setTimeout(r, 0)); return { id, source: name }; },
    };
  }
  createAsyncService("UserService").then(async svc => {
    const user = await svc.fetch(1);
    console.log("ex42 async factory:", svc.name, svc.initialized, user);
  });
}

/** @example ex43 — Factory with lifecycle hooks */
function ex43() {
  function createWithLifecycle(config) {
    const hooks = { create: [], destroy: [], update: [] };
    const obj = {
      ...config,
      on(event, fn) { (hooks[event] = hooks[event] || []).push(fn); return this; },
      destroy() { hooks.destroy.forEach(fn => fn(this)); },
      update(data) { Object.assign(this, data); hooks.update.forEach(fn => fn(this)); return this; },
    };
    hooks.create.forEach(fn => fn(obj));
    return obj;
  }
  const events = [];
  const item = createWithLifecycle({ id: 1, name: "Widget" });
  item.on("update", (o) => events.push(`updated:${o.name}`));
  item.on("destroy", (o) => events.push(`destroyed:${o.name}`));
  item.update({ name: "SuperWidget" });
  item.destroy();
  console.log("ex43 lifecycle factory:", events);
}

/** @example ex44 — Polymorphic factory */
function ex44() {
  function createShape(type, params) {
    const shapes = {
      circle: ({ r }) => ({
        type: "circle", r,
        area: () => Math.PI * r * r,
        perimeter: () => 2 * Math.PI * r,
      }),
      rectangle: ({ w, h }) => ({
        type: "rectangle", w, h,
        area: () => w * h,
        perimeter: () => 2 * (w + h),
      }),
      triangle: ({ a, b, c }) => {
        const s = (a + b + c) / 2;
        return { type: "triangle", a, b, c, area: () => Math.sqrt(s * (s-a) * (s-b) * (s-c)), perimeter: () => a + b + c };
      },
    };
    const builder = shapes[type];
    if (!builder) throw new Error(`Unknown shape: ${type}`);
    return builder(params);
  }
  const circle = createShape("circle", { r: 5 });
  const rect = createShape("rectangle", { w: 4, h: 6 });
  console.log("ex44 polymorphic factory, circle area:", circle.area().toFixed(2), "rect area:", rect.area());
}

/** @example ex45 — Type-based factory */
function ex45() {
  function createSerializer(type) {
    const serializers = {
      json: {
        serialize: (v) => JSON.stringify(v),
        deserialize: (s) => JSON.parse(s),
      },
      csv: {
        serialize: (rows) => rows.map(r => Object.values(r).join(",")).join("\n"),
        deserialize: (s) => s.split("\n").map(row => row.split(",")),
      },
      base64: {
        serialize: (s) => Buffer.from(String(s)).toString("base64"),
        deserialize: (s) => Buffer.from(s, "base64").toString("utf8"),
      },
    };
    if (!serializers[type]) throw new Error(`Unknown serializer: ${type}`);
    return serializers[type];
  }
  const json = createSerializer("json");
  const data = { name: "Alice", age: 30 };
  const serialized = json.serialize(data);
  console.log("ex45 type-based factory:", serialized, json.deserialize(serialized));
}

/** @example ex46 — Factory combinator */
function ex46() {
  function combine(...factories) {
    return function(config) {
      return factories.reduce((obj, factory) => Object.assign(obj, factory(obj, config)), {});
    };
  }
  function withTimestamps(obj) { return { ...obj, createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01") }; }
  function withId(obj) { return { ...obj, id: Math.floor(Math.random() * 10000) }; }
  function withValidation(obj, { schema } = {}) {
    return { ...obj, validate() { return schema ? Object.keys(schema).every(k => k in this) : true; } };
  }
  const createEntity = combine(withId, withTimestamps, withValidation);
  const entity = createEntity({ schema: { id: true, createdAt: true } });
  console.log("ex46 factory combinator, has id:", "id" in entity, "valid:", entity.validate());
}

/** @example ex47 — Factory with validation pipeline */
function ex47() {
  function createValidatorPipeline(...validators) {
    return function(value) {
      const errors = [];
      for (const v of validators) {
        const result = v(value);
        if (result !== true) errors.push(result);
      }
      return { valid: errors.length === 0, errors };
    };
  }
  const required = (v) => (v !== null && v !== undefined && v !== "") || "required";
  const minLen = (n) => (v) => (typeof v === "string" && v.length >= n) || `minLength:${n}`;
  const maxLen = (n) => (v) => (typeof v === "string" && v.length <= n) || `maxLength:${n}`;
  const alphanumeric = (v) => /^[a-zA-Z0-9]+$/.test(v) || "alphanumeric only";
  const usernameValidator = createValidatorPipeline(required, minLen(3), maxLen(20), alphanumeric);
  console.log("ex47 validator pipeline:", usernameValidator("alice"), usernameValidator("a!"), usernameValidator(""));
}

/** @example ex48 — Factory with middleware */
function ex48() {
  function createPipelineFactory(middlewares = []) {
    function applyMiddleware(value) {
      return middlewares.reduce((v, mw) => mw(v), value);
    }
    return {
      use(mw) { return createPipelineFactory([...middlewares, mw]); },
      run: applyMiddleware,
    };
  }
  const pipeline = createPipelineFactory()
    .use(v => v.trim())
    .use(v => v.toLowerCase())
    .use(v => v.replace(/\s+/g, "_"));
  console.log("ex48 factory with middleware:", pipeline.run("  Hello   World  "));
}

/** @example ex49 — Abstract factory with dependency injection */
function ex49() {
  function createRepositoryFactory(dbAdapter) {
    return {
      createUserRepo() {
        return {
          findById: (id) => dbAdapter.query(`SELECT * FROM users WHERE id = ${id}`),
          findAll: () => dbAdapter.query("SELECT * FROM users"),
          save: (user) => dbAdapter.execute(`INSERT INTO users VALUES (${JSON.stringify(user)})`),
        };
      },
      createProductRepo() {
        return {
          findById: (id) => dbAdapter.query(`SELECT * FROM products WHERE id = ${id}`),
          search: (term) => dbAdapter.query(`SELECT * FROM products WHERE name LIKE '%${term}%'`),
        };
      },
    };
  }
  const mockDb = {
    query: (sql) => `[RESULT: ${sql}]`,
    execute: (sql) => `[OK: ${sql}]`,
  };
  const factory = createRepositoryFactory(mockDb);
  const userRepo = factory.createUserRepo();
  console.log("ex49 abstract factory DI:", userRepo.findById(1));
}

/** @example ex50 — Self-registering factory */
function ex50() {
  const PluginRegistry = (() => {
    const plugins = new Map();
    return {
      define(name, options, factory) {
        plugins.set(name, { options, factory });
        return this;
      },
      create(name, config = {}) {
        const entry = plugins.get(name);
        if (!entry) throw new Error(`Plugin not defined: ${name}`);
        const opts = Object.assign({}, entry.options, config);
        return entry.factory(opts);
      },
      list() { return [...plugins.keys()]; },
    };
  })();

  PluginRegistry
    .define("logger", { level: "info", prefix: "[LOG]" }, (opts) => ({
      log: (msg) => `${opts.prefix}[${opts.level}] ${msg}`,
    }))
    .define("cache", { maxSize: 100, ttl: 60000 }, (opts) => {
      const store = new Map();
      return {
        set: (k, v) => { if (store.size < opts.maxSize) store.set(k, { v, t: Date.now() }); },
        get: (k) => { const e = store.get(k); return e && Date.now() - e.t < opts.ttl ? e.v : null; },
      };
    });

  const logger = PluginRegistry.create("logger", { level: "debug" });
  const cache = PluginRegistry.create("cache", { maxSize: 10 });
  cache.set("key1", "value1");
  console.log("ex50 self-registering factory, plugins:", PluginRegistry.list(), "log:", logger.log("hello"), "cache:", cache.get("key1"));
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function main() {
  console.log("=== BASIC (ex01–ex13) ===");
  ex01(); ex02(); ex03(); ex04(); ex05(); ex06(); ex07();
  ex08(); ex09(); ex10(); ex11(); ex12(); ex13();

  console.log("\n=== INTERMEDIATE (ex14–ex26) ===");
  ex14(); ex15(); ex16(); ex17(); ex18(); ex19(); ex20();
  ex21(); ex22(); ex23(); ex24(); ex25(); ex26();

  console.log("\n=== NESTED (ex27–ex38) ===");
  ex27(); ex28(); ex29(); ex30(); ex31(); ex32(); ex33();
  ex34(); ex35(); ex36(); ex37(); ex38();

  console.log("\n=== ADVANCED (ex39–ex50) ===");
  ex39(); ex40(); ex41(); ex42(); ex43(); ex44(); ex45();
  ex46(); ex47(); ex48(); ex49(); ex50();
}

main();
