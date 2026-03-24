// Examples 5.5 — Proxy & Reflect
"use strict";

// ─── BASIC (ex01–ex13) ────────────────────────────────────────────────────────

/** @example ex01 — Proxy get trap */
function ex01() {
  const handler = {
    get(target, key) {
      console.log(`ex01 get: ${String(key)}`);
      return Reflect.get(target, key);
    },
  };
  const obj = new Proxy({ name: "Alice", age: 30 }, handler);
  const _ = obj.name;
  const __ = obj.age;
  console.log("ex01 name:", obj.name);
}

/** @example ex02 — Proxy set trap */
function ex02() {
  const log = [];
  const obj = new Proxy({}, {
    set(target, key, value) {
      log.push({ key: String(key), value });
      return Reflect.set(target, key, value);
    },
  });
  obj.x = 10; obj.y = 20; obj.z = 30;
  console.log("ex02 set trap log:", log, "obj:", obj);
}

/** @example ex03 — Proxy has trap */
function ex03() {
  const range = new Proxy({ min: 1, max: 100 }, {
    has(target, key) {
      const n = Number(key);
      if (!isNaN(n)) return n >= target.min && n <= target.max;
      return Reflect.has(target, key);
    },
  });
  console.log("ex03 has trap:", 50 in range, 150 in range, 1 in range);
}

/** @example ex04 — Proxy deleteProperty trap */
function ex04() {
  function createProtected(obj, protectedKeys) {
    return new Proxy(obj, {
      deleteProperty(target, key) {
        if (protectedKeys.includes(String(key))) throw new Error(`Cannot delete protected property "${String(key)}"`);
        return Reflect.deleteProperty(target, key);
      },
    });
  }
  const obj = createProtected({ id: 1, name: "Alice", temp: "temporary" }, ["id", "name"]);
  delete obj.temp; // ok
  try { delete obj.id; } catch (e) { console.log("ex04 deleteProperty trap:", e.message); }
  console.log("ex04 obj after:", obj);
}

/** @example ex05 — apply trap (function proxy) */
function ex05() {
  function multiply(a, b) { return a * b; }
  const logged = new Proxy(multiply, {
    apply(target, thisArg, args) {
      console.log("ex05 apply trap, args:", args);
      const result = Reflect.apply(target, thisArg, args);
      console.log("ex05 result:", result);
      return result;
    },
  });
  logged(6, 7);
}

/** @example ex06 — construct trap */
function ex06() {
  class User { constructor(name, role) { this.name = name; this.role = role; } }
  const TrackedUser = new Proxy(User, {
    construct(target, args) {
      console.log("ex06 construct trap, args:", args);
      const instance = Reflect.construct(target, args);
      instance.createdAt = new Date("2026-01-01");
      return instance;
    },
  });
  const u = new TrackedUser("Alice", "admin");
  console.log("ex06 constructed:", u.name, u.role, u.createdAt.toISOString().slice(0, 10));
}

/** @example ex07 — Reflect.get */
function ex07() {
  const obj = { x: 10, get doubled() { return this.x * 2; } };
  console.log("ex07 Reflect.get:", Reflect.get(obj, "x"));
  console.log("ex07 Reflect.get (getter):", Reflect.get(obj, "doubled"));
  // With custom receiver
  const receiver = { x: 99 };
  console.log("ex07 Reflect.get (receiver):", Reflect.get(obj, "doubled", receiver));
}

/** @example ex08 — Reflect.set */
function ex08() {
  const obj = {};
  const success = Reflect.set(obj, "name", "Alice");
  const frozen = Object.freeze({ x: 1 });
  const fail = Reflect.set(frozen, "x", 99);
  console.log("ex08 Reflect.set success:", success, "obj:", obj);
  console.log("ex08 Reflect.set on frozen:", fail);
}

/** @example ex09 — Reflect.has */
function ex09() {
  const obj = { a: 1, b: 2 };
  const child = Object.create(obj);
  child.c = 3;
  console.log("ex09 Reflect.has own:", Reflect.has(child, "c"), Reflect.has(child, "z"));
  console.log("ex09 Reflect.has inherited:", Reflect.has(child, "a"));
  console.log("ex09 'a' in child (same):", "a" in child);
}

/** @example ex10 — Reflect.deleteProperty */
function ex10() {
  const obj = { x: 1, y: 2, z: 3 };
  console.log("ex10 before:", Object.keys(obj));
  Reflect.deleteProperty(obj, "y");
  console.log("ex10 after delete:", Object.keys(obj));
  const frozen = Object.freeze({ a: 1 });
  const result = Reflect.deleteProperty(frozen, "a"); // returns false
  console.log("ex10 delete on frozen:", result);
}

/** @example ex11 — Reflect.ownKeys */
function ex11() {
  const sym = Symbol("secret");
  const obj = { name: "Alice", age: 30, [sym]: "hidden" };
  console.log("ex11 Object.keys:", Object.keys(obj)); // no symbols
  console.log("ex11 Reflect.ownKeys:", Reflect.ownKeys(obj)); // includes symbols
}

/** @example ex12 — Reflect.defineProperty */
function ex12() {
  const obj = {};
  Reflect.defineProperty(obj, "constant", { value: 42, writable: false, enumerable: true, configurable: false });
  Reflect.defineProperty(obj, "computed", { get() { return this.constant * 2; }, enumerable: true, configurable: true });
  console.log("ex12 Reflect.defineProperty:", obj.constant, obj.computed);
  obj.constant = 99; // silently fails in non-strict mode, but assignment not reflected
  console.log("ex12 after attempted write:", obj.constant); // still 42
}

/** @example ex13 — Reflect.apply */
function ex13() {
  function greet(greeting, punctuation) {
    return `${greeting}, ${this.name}${punctuation}`;
  }
  const context = { name: "World" };
  console.log("ex13 Reflect.apply:", Reflect.apply(greet, context, ["Hello", "!"]));
  // Compare to Function.prototype.call
  console.log("ex13 equivalent call:", greet.call(context, "Hello", "!"));
}

// ─── INTERMEDIATE (ex14–ex26) ─────────────────────────────────────────────────

/** @example ex14 — Validation proxy */
function ex14() {
  function createValidated(schema) {
    const target = {};
    return new Proxy(target, {
      set(obj, key, value) {
        const rule = schema[key];
        if (rule && !rule(value)) throw new TypeError(`Invalid value for "${String(key)}": ${JSON.stringify(value)}`);
        return Reflect.set(obj, key, value);
      },
    });
  }
  const person = createValidated({
    age: (v) => Number.isInteger(v) && v >= 0 && v <= 150,
    email: (v) => typeof v === "string" && v.includes("@"),
  });
  person.email = "alice@example.com";
  person.age = 30;
  try { person.age = -5; } catch (e) { console.log("ex14 validation proxy:", e.message); }
  console.log("ex14 person:", person);
}

/** @example ex15 — Read-only proxy */
function ex15() {
  function readOnly(obj, deep = false) {
    return new Proxy(obj, {
      get(target, key, receiver) {
        const value = Reflect.get(target, key, receiver);
        if (deep && typeof value === "object" && value !== null) return readOnly(value, true);
        return value;
      },
      set(target, key) { throw new TypeError(`Cannot set "${String(key)}" on read-only object`); },
      deleteProperty(target, key) { throw new TypeError(`Cannot delete "${String(key)}" on read-only object`); },
    });
  }
  const config = readOnly({ db: { host: "localhost", port: 5432 }, debug: false }, true);
  console.log("ex15 readOnly get:", config.db.host, config.debug);
  try { config.debug = true; } catch (e) { console.log("ex15 set blocked:", e.message); }
}

/** @example ex16 — Logging proxy */
function ex16() {
  function withLogging(obj, label = "proxy") {
    const log = [];
    const proxy = new Proxy(obj, {
      get(target, key, receiver) {
        const value = Reflect.get(target, key, receiver);
        if (typeof key === "string" && !key.startsWith("_")) log.push({ op: "get", key });
        return typeof value === "function" ? value.bind(target) : value;
      },
      set(target, key, value) {
        log.push({ op: "set", key: String(key), value });
        return Reflect.set(target, key, value);
      },
    });
    proxy._log = () => log;
    return proxy;
  }
  const obj = withLogging({ x: 1, y: 2 }, "myObj");
  const _ = obj.x;
  obj.z = 3;
  console.log("ex16 logging proxy log:", obj._log());
}

/** @example ex17 — Default values proxy */
function ex17() {
  function withDefaults(defaults) {
    return (target = {}) => new Proxy(target, {
      get(obj, key, receiver) {
        if (Reflect.has(obj, key)) return Reflect.get(obj, key, receiver);
        if (key in defaults) return typeof defaults[key] === "function" ? defaults[key]() : defaults[key];
        return undefined;
      },
    });
  }
  const createConfig = withDefaults({
    timeout: 5000,
    retries: 3,
    headers: () => ({}),
    debug: false,
  });
  const cfg = createConfig({ timeout: 1000 });
  console.log("ex17 defaults proxy:", cfg.timeout, cfg.retries, cfg.debug, cfg.unknown);
}

/** @example ex18 — Negative index proxy */
function ex18() {
  function negativeIndex(arr) {
    return new Proxy(arr, {
      get(target, key) {
        const index = typeof key === "string" ? Number(key) : NaN;
        if (Number.isInteger(index) && index < 0) return target[target.length + index];
        return Reflect.get(target, key);
      },
      set(target, key, value) {
        const index = typeof key === "string" ? Number(key) : NaN;
        if (Number.isInteger(index) && index < 0) { target[target.length + index] = value; return true; }
        return Reflect.set(target, key, value);
      },
    });
  }
  const arr = negativeIndex([10, 20, 30, 40, 50]);
  console.log("ex18 negative index:", arr[-1], arr[-2], arr[-5]);
  arr[-1] = 99;
  console.log("ex18 after arr[-1]=99:", arr[4]);
}

/** @example ex19 — Observable proxy (reactive) */
function ex19() {
  function observable(obj) {
    const subscribers = new Map();
    const proxy = new Proxy(obj, {
      set(target, key, value) {
        const old = target[key];
        const result = Reflect.set(target, key, value);
        if (old !== value) (subscribers.get(String(key)) || []).forEach(fn => fn(value, old));
        return result;
      },
    });
    proxy.$on = (key, fn) => { if (!subscribers.has(key)) subscribers.set(key, []); subscribers.get(key).push(fn); };
    return proxy;
  }
  const state = observable({ count: 0, name: "Alice" });
  const changes = [];
  state.$on("count", (newVal, oldVal) => changes.push({ newVal, oldVal }));
  state.count = 1; state.count = 2; state.count = 1;
  console.log("ex19 observable proxy changes:", changes);
}

/** @example ex20 — Lazy loading proxy */
function ex20() {
  function lazy(loader) {
    let loaded = false;
    let value = null;
    return new Proxy({}, {
      get(_, key) {
        if (!loaded) {
          value = loader();
          loaded = true;
          console.log("ex20 lazy: loaded on first access");
        }
        const v = value[key];
        return typeof v === "function" ? v.bind(value) : v;
      },
    });
  }
  let initCount = 0;
  const heavyService = lazy(() => {
    initCount++;
    return {
      data: [1, 2, 3, 4, 5],
      sum() { return this.data.reduce((a, b) => a + b, 0); },
    };
  });
  console.log("ex20 before access, initCount:", initCount);
  console.log("ex20 first access sum:", heavyService.sum());
  console.log("ex20 second access data:", heavyService.data);
  console.log("ex20 initCount:", initCount); // still 1
}

/** @example ex21 — Caching proxy */
function ex21() {
  function memoizeProxy(fn) {
    const cache = new Map();
    return new Proxy(fn, {
      apply(target, thisArg, args) {
        const key = JSON.stringify(args);
        if (!cache.has(key)) {
          const result = Reflect.apply(target, thisArg, args);
          cache.set(key, result);
          console.log("ex21 cache miss, computed:", result);
        } else {
          console.log("ex21 cache hit for args:", args);
        }
        return cache.get(key);
      },
    });
  }
  function expensiveAdd(a, b) { return a + b; }
  const cachedAdd = memoizeProxy(expensiveAdd);
  cachedAdd(2, 3); cachedAdd(2, 3); cachedAdd(4, 5);
  console.log("ex21 cached results:", cachedAdd(2, 3), cachedAdd(4, 5));
}

/** @example ex22 — Type coercion proxy */
function ex22() {
  function typed(schema) {
    const target = {};
    return new Proxy(target, {
      set(obj, key, rawValue) {
        const coerce = schema[key];
        const value = coerce ? coerce(rawValue) : rawValue;
        return Reflect.set(obj, key, value);
      },
    });
  }
  const model = typed({
    age: Number,
    active: Boolean,
    name: String,
    tags: (v) => Array.isArray(v) ? v : String(v).split(","),
  });
  model.age = "42";
  model.active = 0;
  model.name = 123;
  model.tags = "a,b,c";
  console.log("ex22 type coercion proxy:", model.age, typeof model.age, model.active, typeof model.active, model.tags);
}

/** @example ex23 — Method chaining proxy */
function ex23() {
  function chainable(obj) {
    return new Proxy(obj, {
      get(target, key, receiver) {
        const value = Reflect.get(target, key, receiver);
        if (typeof value === "function") {
          return function(...args) {
            const result = value.apply(target, args);
            // If method returns undefined or the object itself, enable chaining
            return result === undefined || result === target ? receiver : result;
          };
        }
        return value;
      },
    });
  }
  const builder = chainable({
    parts: [],
    add(part) { this.parts.push(part); },
    prefix(p) { this.parts = this.parts.map(x => `${p}${x}`); },
    build() { return this.parts.join(", "); },
  });
  builder.add("alpha").add("beta").add("gamma").prefix("item-");
  console.log("ex23 method chaining proxy:", builder.build());
}

/** @example ex24 — Deep reactive proxy */
function ex24() {
  function reactive(obj, onChange = () => {}) {
    if (typeof obj !== "object" || obj === null) return obj;
    return new Proxy(obj, {
      get(target, key, receiver) {
        const value = Reflect.get(target, key, receiver);
        if (typeof value === "object" && value !== null) return reactive(value, onChange);
        return value;
      },
      set(target, key, value) {
        const result = Reflect.set(target, key, value);
        onChange(String(key), value, target);
        return result;
      },
    });
  }
  const changes = [];
  const state = reactive({ user: { name: "Alice", address: { city: "NYC" } } }, (key, val) => changes.push(key));
  state.user.name = "Bob";
  state.user.address.city = "LA";
  console.log("ex24 deep reactive changes:", changes);
}

/** @example ex25 — Nested proxy */
function ex25() {
  function createNested(data) {
    return new Proxy(data, {
      get(target, key, receiver) {
        const value = Reflect.get(target, key, receiver);
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          return createNested(value);
        }
        return value;
      },
      set(target, key, value) {
        return Reflect.set(target, key, value);
      },
    });
  }
  const config = createNested({ server: { host: "localhost", ssl: { enabled: true, cert: "/etc/ssl/cert.pem" } } });
  console.log("ex25 nested proxy:", config.server.host, config.server.ssl.enabled, config.server.ssl.cert);
}

/** @example ex26 — Revocable proxy */
function ex26() {
  const target = { secret: "confidential data", publicInfo: "public" };
  const { proxy, revoke } = Proxy.revocable(target, {
    get(t, key) {
      if (key === "secret") throw new Error("Access denied");
      return Reflect.get(t, key);
    },
  });
  console.log("ex26 before revoke:", proxy.publicInfo);
  try { console.log("ex26 secret:", proxy.secret); } catch (e) { console.log("ex26 denied:", e.message); }
  revoke();
  try { console.log("ex26 after revoke:", proxy.publicInfo); } catch (e) { console.log("ex26 revoked:", e.message); }
}

// ─── NESTED (ex27–ex38) ───────────────────────────────────────────────────────

/** @example ex27 — Schema validation proxy */
function ex27() {
  function createSchemaProxy(schema) {
    const data = {};
    return new Proxy(data, {
      set(target, key, value) {
        const field = schema[key];
        if (field) {
          if (field.required && (value === null || value === undefined)) throw new TypeError(`"${key}" is required`);
          if (field.type && typeof value !== field.type) throw new TypeError(`"${key}" must be ${field.type}`);
          if (field.min !== undefined && value < field.min) throw new RangeError(`"${key}" >= ${field.min}`);
          if (field.max !== undefined && value > field.max) throw new RangeError(`"${key}" <= ${field.max}`);
          if (field.pattern && !field.pattern.test(value)) throw new Error(`"${key}" pattern mismatch`);
        }
        return Reflect.set(target, key, value);
      },
    });
  }
  const user = createSchemaProxy({
    age: { type: "number", min: 0, max: 150 },
    email: { type: "string", pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    name: { required: true, type: "string" },
  });
  user.name = "Alice";
  user.age = 30;
  user.email = "alice@example.com";
  try { user.age = -1; } catch (e) { console.log("ex27 schema proxy error:", e.message); }
  console.log("ex27 valid data:", user);
}

/** @example ex28 — Access control proxy */
function ex28() {
  function withACL(obj, acl) {
    // acl = { read: [...roles], write: [...roles] }
    let currentRole = "guest";
    return new Proxy(obj, {
      get(target, key) {
        if (key === "_setRole") return (role) => { currentRole = role; };
        const rule = acl[String(key)];
        if (rule && !rule.read.includes(currentRole)) throw new Error(`Read access denied for role "${currentRole}"`);
        return Reflect.get(target, key);
      },
      set(target, key, value) {
        const rule = acl[String(key)];
        if (rule && !rule.write.includes(currentRole)) throw new Error(`Write access denied for role "${currentRole}"`);
        return Reflect.set(target, key, value);
      },
    });
  }
  const resource = withACL(
    { publicData: "visible", adminData: "secret", name: "Resource" },
    {
      adminData: { read: ["admin"], write: ["admin"] },
      name: { read: ["guest", "user", "admin"], write: ["admin"] },
    },
  );
  console.log("ex28 guest read name:", resource.name);
  try { console.log("ex28 guest read admin:", resource.adminData); } catch (e) { console.log("ex28 ACL denied:", e.message); }
  resource._setRole("admin");
  console.log("ex28 admin read:", resource.adminData);
}

/** @example ex29 — API mock proxy */
function ex29() {
  function createApiMock(mockData) {
    const callLog = [];
    const proxy = new Proxy({}, {
      get(_, resource) {
        return new Proxy({}, {
          get(_, method) {
            return async (id, body) => {
              callLog.push({ resource: String(resource), method: String(method), id, body });
              const data = mockData[String(resource)];
              if (method === "findById") return data?.find(item => item.id === id) || null;
              if (method === "findAll") return data || [];
              if (method === "create") { const item = { id: Date.now(), ...body }; (data || []).push(item); return item; }
              return null;
            };
          },
        });
      },
    });
    proxy._calls = () => callLog;
    return proxy;
  }
  const api = createApiMock({
    users: [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }],
    posts: [{ id: 1, title: "Hello" }],
  });
  Promise.all([api.users.findById(1), api.users.findAll(), api.posts.findById(1)])
    .then(([user, users, post]) => {
      console.log("ex29 API mock:", user, users.length, post);
      console.log("ex29 calls:", api._calls().map(c => `${c.resource}.${c.method}`));
    });
}

/** @example ex30 — Dependency tracking proxy */
function ex30() {
  let activeEffect = null;
  function track(target, key) {
    if (!activeEffect) return;
    const deps = target.__deps__ = target.__deps__ || {};
    (deps[key] = deps[key] || new Set()).add(activeEffect);
  }
  function trigger(target, key) {
    const deps = target.__deps__ || {};
    (deps[key] || new Set()).forEach(fn => fn());
  }
  function ref(value) {
    const obj = { _value: value };
    return new Proxy(obj, {
      get(t, key) { if (key === "value") { track(t, "value"); return t._value; } return Reflect.get(t, key); },
      set(t, key, v) { if (key === "value") { t._value = v; trigger(t, "value"); return true; } return Reflect.set(t, key, v); },
    });
  }
  function effect(fn) { activeEffect = fn; fn(); activeEffect = null; }
  const count = ref(0);
  const log = [];
  effect(() => log.push(`effect: count = ${count.value}`));
  count.value = 1; count.value = 2;
  console.log("ex30 dependency tracking:", log);
}

/** @example ex31 — Virtual DOM proxy concept */
function ex31() {
  function createVNode(tag, props = {}, children = []) {
    const vnode = { tag, props, children, _dirty: false };
    return new Proxy(vnode, {
      set(target, key, value) {
        if (key !== "_dirty") {
          target._dirty = true;
          console.log("ex31 vnode dirty set:", String(key));
        }
        return Reflect.set(target, key, value);
      },
    });
  }
  const vnode = createVNode("div", { class: "container" }, []);
  console.log("ex31 vnode dirty initial:", vnode._dirty);
  vnode.props = { class: "container active" };
  console.log("ex31 vnode dirty after:", vnode._dirty);
}

/** @example ex32 — Proxy-based DSL */
function ex32() {
  function createCSS() {
    const styles = {};
    return new Proxy({}, {
      get(_, selector) {
        return new Proxy({}, {
          set(__, prop, value) {
            if (!styles[selector]) styles[selector] = {};
            const cssProperty = prop.replace(/([A-Z])/g, "-$1").toLowerCase();
            styles[selector][cssProperty] = value;
            return true;
          },
          get(__, prop) {
            if (prop === "__dump") return () => {
              return Object.entries(styles).map(([sel, rules]) =>
                `${sel} { ${Object.entries(rules).map(([p, v]) => `${p}: ${v}`).join("; ")} }`
              ).join("\n");
            };
            return styles[selector]?.[prop.replace(/([A-Z])/g, "-$1").toLowerCase()];
          },
        });
      },
    });
  }
  const css = createCSS();
  css[".container"].backgroundColor = "blue";
  css[".container"].fontSize = "16px";
  css["h1"].color = "red";
  console.log("ex32 proxy DSL CSS:", css[".container"].__dump());
}

/** @example ex33 — Sandbox proxy */
function ex33() {
  function createSandbox(allowedGlobals = {}) {
    const sandbox = {};
    return new Proxy(sandbox, {
      get(target, key) {
        if (key in target) return Reflect.get(target, key);
        if (key in allowedGlobals) return allowedGlobals[key];
        // Deny access to dangerous globals
        if (["process", "require", "global", "eval", "__dirname"].includes(String(key))) {
          throw new Error(`Access to "${String(key)}" is not allowed in sandbox`);
        }
        return undefined;
      },
      set(target, key, value) {
        return Reflect.set(target, key, value);
      },
    });
  }
  const sandbox = createSandbox({ Math, JSON, console });
  sandbox.x = 42;
  console.log("ex33 sandbox allowed:", sandbox.Math.PI.toFixed(4), sandbox.x);
  try { const _ = sandbox.process; } catch (e) { console.log("ex33 sandbox blocked:", e.message); }
}

/** @example ex34 — ORM proxy */
function ex34() {
  function createModel(tableName, schema) {
    const data = {};
    const changes = new Set();
    return new Proxy(data, {
      get(target, key) {
        if (key === "save") {
          return async () => {
            const changedFields = [...changes];
            changes.clear();
            console.log(`ex34 ORM save to ${tableName}, changed:`, changedFields, "values:", { ...target });
            return true;
          };
        }
        if (key === "toJSON") return () => ({ ...target });
        return Reflect.get(target, key);
      },
      set(target, key, value) {
        const field = schema[key];
        if (field && field.type && typeof value !== field.type) {
          throw new TypeError(`${String(key)} must be ${field.type}`);
        }
        changes.add(String(key));
        return Reflect.set(target, key, value);
      },
    });
  }
  const user = createModel("users", { name: { type: "string" }, age: { type: "number" } });
  user.name = "Alice"; user.age = 30;
  user.save().then(() => console.log("ex34 ORM model:", user.toJSON()));
}

/** @example ex35 — Proxy-based AOP (Aspect-Oriented Programming) */
function ex35() {
  function withAspects(obj, aspects = {}) {
    return new Proxy(obj, {
      get(target, key, receiver) {
        const value = Reflect.get(target, key, receiver);
        if (typeof value === "function") {
          return function(...args) {
            const before = aspects[`${String(key)}:before`];
            const after = aspects[`${String(key)}:after`];
            const around = aspects[`${String(key)}:around`];
            if (before) before(args);
            const invoke = () => value.apply(target, args);
            const result = around ? around(invoke, args) : invoke();
            if (after) after(result, args);
            return result;
          };
        }
        return value;
      },
    });
  }
  const service = withAspects(
    {
      createUser(name) { return { id: 1, name }; },
      deleteUser(id) { return `deleted:${id}`; },
    },
    {
      "createUser:before": (args) => console.log("ex35 AOP before createUser:", args),
      "createUser:after": (result) => console.log("ex35 AOP after createUser:", result),
    },
  );
  const user = service.createUser("Alice");
  console.log("ex35 AOP result:", user);
}

// ─── ADVANCED (ex39–ex50) ─────────────────────────────────────────────────────

/** @example ex39 — Membrane pattern */
function ex39() {
  function createMembrane(target) {
    const wrappedMap = new WeakMap();
    function wrap(obj) {
      if (typeof obj !== "object" || obj === null) return obj;
      if (wrappedMap.has(obj)) return wrappedMap.get(obj);
      const wrapped = new Proxy(obj, {
        get(t, key, receiver) {
          const value = Reflect.get(t, key, receiver);
          return wrap(value);
        },
        set(t, key, value) {
          return Reflect.set(t, key, value);
        },
      });
      wrappedMap.set(obj, wrapped);
      return wrapped;
    }
    return wrap(target);
  }
  const obj = { nested: { deep: { value: 42 } }, arr: [1, 2, 3] };
  const wrapped = createMembrane(obj);
  console.log("ex39 membrane deep:", wrapped.nested.deep.value);
  console.log("ex39 membrane array:", wrapped.arr[0]);
}

/** @example ex40 — Proxy chains */
function ex40() {
  function logProxy(target, label) {
    return new Proxy(target, {
      get(t, key, r) { console.log(`ex40 [${label}] get:`, String(key)); return Reflect.get(t, key, r); },
      set(t, key, v) { console.log(`ex40 [${label}] set:`, String(key), "=", v); return Reflect.set(t, key, v); },
    });
  }
  function validateProxy(target, rules) {
    return new Proxy(target, {
      set(t, key, v) {
        const rule = rules[String(key)];
        if (rule && !rule(v)) throw new TypeError(`Invalid: ${String(key)} = ${v}`);
        return Reflect.set(t, key, v);
      },
    });
  }
  // Chain: validate → log → actual object
  const base = {};
  const validated = validateProxy(base, { age: (v) => v >= 0 });
  const logged = logProxy(validated, "chained");
  logged.age = 25;
  console.log("ex40 proxy chain result:", base);
}

/** @example ex41 — Transparent proxy */
function ex41() {
  // Transparent proxy that forwards everything via Reflect exactly
  function transparent(target) {
    return new Proxy(target, {
      get: Reflect.get,
      set: Reflect.set,
      has: Reflect.has,
      deleteProperty: Reflect.deleteProperty,
      apply: Reflect.apply,
      construct: Reflect.construct,
      ownKeys: Reflect.ownKeys,
      getOwnPropertyDescriptor: Reflect.getOwnPropertyDescriptor,
      defineProperty: Reflect.defineProperty,
      getPrototypeOf: Reflect.getPrototypeOf,
      setPrototypeOf: Reflect.setPrototypeOf,
      isExtensible: Reflect.isExtensible,
      preventExtensions: Reflect.preventExtensions,
    });
  }
  const obj = { x: 1, greet() { return `hello from ${this.x}`; } };
  const proxy = transparent(obj);
  console.log("ex41 transparent proxy:", proxy.x, proxy.greet(), proxy.y, "x" in proxy);
}

/** @example ex42 — Meta-level proxy (proxy of a proxy) */
function ex42() {
  function withTimestamps(target) {
    return new Proxy(target, {
      set(t, key, value) {
        const result = Reflect.set(t, key, value);
        Reflect.set(t, `${String(key)}UpdatedAt`, new Date("2026-01-01").toISOString());
        return result;
      },
    });
  }
  function withValidation(target) {
    return new Proxy(target, {
      set(t, key, value) {
        if (key === "age" && (typeof value !== "number" || value < 0)) throw new RangeError("age must be >= 0");
        return Reflect.set(t, key, value);
      },
    });
  }
  // Compose proxies
  const obj = withTimestamps(withValidation({}));
  obj.age = 30;
  obj.name = "Alice";
  console.log("ex42 meta-level proxy:", obj.age, obj.name, obj.nameUpdatedAt, obj.ageUpdatedAt);
}

/** @example ex43 — RPC proxy concept */
function ex43() {
  function createRPCProxy(transport) {
    return new Proxy({}, {
      get(_, method) {
        if (typeof method !== "string") return undefined;
        return function(...args) {
          return transport.call(method, args);
        };
      },
    });
  }
  // Mock transport
  const transport = {
    async call(method, args) {
      await new Promise(r => setTimeout(r, 0));
      const handlers = {
        "user.get": ([id]) => ({ id, name: "Alice", email: "alice@example.com" }),
        "user.list": () => [{ id: 1 }, { id: 2 }],
        "post.create": ([data]) => ({ id: 99, ...data }),
      };
      const handler = handlers[method];
      if (!handler) throw new Error(`Unknown RPC method: ${method}`);
      return handler(args);
    },
  };
  const api = createRPCProxy(transport);
  api["user.get"](1).then(user => console.log("ex43 RPC proxy:", user));
}

/** @example ex44 — Capability-based security */
function ex44() {
  function createCapability(resource, allowedOps) {
    const capabilities = new Set(allowedOps);
    return new Proxy(resource, {
      get(target, key, receiver) {
        const value = Reflect.get(target, key, receiver);
        if (typeof value === "function") {
          return function(...args) {
            if (!capabilities.has(String(key))) throw new Error(`Operation "${String(key)}" not in capability set`);
            return value.apply(target, args);
          };
        }
        return value;
      },
    });
  }
  const fileService = {
    read: (path) => `contents of ${path}`,
    write: (path, data) => `wrote ${data} to ${path}`,
    delete: (path) => `deleted ${path}`,
    admin: () => "admin action",
  };
  const readOnlyCap = createCapability(fileService, ["read"]);
  console.log("ex44 capability read:", readOnlyCap.read("/etc/config"));
  try { readOnlyCap.write("/etc/config", "data"); } catch (e) { console.log("ex44 capability denied:", e.message); }
}

/** @example ex45 — Mirror pattern */
function ex45() {
  function createMirror(target) {
    const mirrorLog = [];
    return {
      proxy: new Proxy(target, {
        get(t, key, r) { mirrorLog.push({ op: "get", key: String(key) }); return Reflect.get(t, key, r); },
        set(t, key, v) { mirrorLog.push({ op: "set", key: String(key), value: v }); return Reflect.set(t, key, v); },
        deleteProperty(t, key) { mirrorLog.push({ op: "delete", key: String(key) }); return Reflect.deleteProperty(t, key); },
      }),
      getLog: () => [...mirrorLog],
      clearLog: () => mirrorLog.splice(0),
      replay: (freshTarget) => {
        mirrorLog.forEach(op => {
          if (op.op === "set") freshTarget[op.key] = op.value;
          if (op.op === "delete") delete freshTarget[op.key];
        });
        return freshTarget;
      },
    };
  }
  const { proxy: mirror, getLog, replay } = createMirror({ x: 0 });
  mirror.x = 10;
  mirror.y = 20;
  delete mirror.x;
  const freshObj = replay({});
  console.log("ex45 mirror log:", getLog().map(o => o.op), "replayed:", freshObj);
}

/** @example ex46 — Proxy-based contracts */
function ex46() {
  function withContracts(obj, contracts) {
    return new Proxy(obj, {
      get(target, key, receiver) {
        const value = Reflect.get(target, key, receiver);
        if (typeof value === "function" && contracts[String(key)]) {
          const { pre, post } = contracts[String(key)];
          return function(...args) {
            if (pre && !pre(...args)) throw new Error(`Precondition failed for ${String(key)}`);
            const result = value.apply(target, args);
            if (post && !post(result, ...args)) throw new Error(`Postcondition failed for ${String(key)}`);
            return result;
          };
        }
        return value;
      },
    });
  }
  const math = withContracts(
    {
      divide: (a, b) => a / b,
      sqrt: (n) => Math.sqrt(n),
    },
    {
      divide: {
        pre: (a, b) => b !== 0,
        post: (result) => isFinite(result),
      },
      sqrt: {
        pre: (n) => n >= 0,
        post: (result) => result >= 0,
      },
    },
  );
  console.log("ex46 contracts divide:", math.divide(10, 2));
  console.log("ex46 contracts sqrt:", math.sqrt(25));
  try { math.divide(10, 0); } catch (e) { console.log("ex46 precondition:", e.message); }
  try { math.sqrt(-4); } catch (e) { console.log("ex46 sqrt precondition:", e.message); }
}

/** @example ex47 — Auto-instantiating proxy */
function ex47() {
  function autoInstantiate(classes) {
    return new Proxy({}, {
      get(_, key) {
        if (String(key) in classes) {
          return new Proxy(classes[String(key)], {
            apply(Cls, thisArg, args) { return new Cls(...args); },
            get(Cls, method) {
              if (method in Cls) return Cls[method]; // static
              return (...args) => { const inst = new Cls(); return inst[method](...args); };
            },
          });
        }
        return undefined;
      },
    });
  }
  class Point { constructor(x = 0, y = 0) { this.x = x; this.y = y; } dist() { return Math.sqrt(this.x ** 2 + this.y ** 2); } }
  class Color { constructor(r = 0, g = 0, b = 0) { this.r = r; this.g = g; this.b = b; } hex() { return `#${[this.r,this.g,this.b].map(v => v.toString(16).padStart(2,"0")).join("")}`; } }
  const factory = autoInstantiate({ Point, Color });
  const p = new factory.Point(3, 4);
  console.log("ex47 auto-instantiate:", p.dist(), "instanceof Point:", p instanceof Point);
}

/** @example ex48 — Config proxy with path access */
function ex48() {
  function createConfigProxy(data) {
    function wrap(obj, path = "") {
      if (typeof obj !== "object" || obj === null) return obj;
      return new Proxy(obj, {
        get(target, key) {
          if (key === "__path") return path;
          if (key === "__value") return target;
          const value = Reflect.get(target, key);
          const newPath = path ? `${path}.${String(key)}` : String(key);
          if (typeof value === "object" && value !== null) return wrap(value, newPath);
          return value;
        },
        set(target, key, value) {
          console.log(`ex48 config set ${path ? path + "." : ""}${String(key)}:`, value);
          return Reflect.set(target, key, value);
        },
      });
    }
    return wrap(data);
  }
  const config = createConfigProxy({ server: { host: "localhost", port: 3000, ssl: { enabled: false } } });
  console.log("ex48 config path:", config.server.host, config.server.ssl.__path);
  config.server.port = 8080;
}

/** @example ex49 — Proxy-based event delegation */
function ex49() {
  function createEventProxy(element, handlers) {
    return new Proxy(element, {
      get(target, key, receiver) {
        if (String(key).startsWith("on")) {
          const event = String(key).slice(2).toLowerCase();
          return handlers[event] || null;
        }
        return Reflect.get(target, key, receiver);
      },
      set(target, key, value) {
        if (String(key).startsWith("on")) {
          const event = String(key).slice(2).toLowerCase();
          handlers[event] = value;
          target.addEventListener(event, value);
          return true;
        }
        return Reflect.set(target, key, value);
      },
    });
  }
  // Simulate DOM-like element
  const events = {};
  const mockElement = {
    listeners: {},
    addEventListener(ev, fn) { this.listeners[ev] = fn; },
    dispatchEvent(ev) { if (this.listeners[ev.type]) this.listeners[ev.type](ev); },
  };
  const proxy = createEventProxy(mockElement, events);
  const log = [];
  proxy.onclick = (e) => log.push("clicked:" + e.target);
  mockElement.dispatchEvent({ type: "click", target: "button" });
  console.log("ex49 event delegation:", log, "has handler:", "click" in events);
}

/** @example ex50 — Full reactive system with Proxy */
function ex50() {
  let activeEffect = null;
  const effectStack = [];
  function track(deps, key) {
    if (!activeEffect) return;
    if (!deps[key]) deps[key] = new Set();
    deps[key].add(activeEffect);
  }
  function trigger(deps, key) {
    (deps[key] || new Set()).forEach(fn => fn());
  }
  function reactive(obj) {
    const deps = {};
    return new Proxy(obj, {
      get(target, key, receiver) {
        track(deps, String(key));
        const value = Reflect.get(target, key, receiver);
        return typeof value === "object" && value !== null ? reactive(value) : value;
      },
      set(target, key, value) {
        const result = Reflect.set(target, key, value);
        trigger(deps, String(key));
        return result;
      },
    });
  }
  function effect(fn) {
    const run = () => { activeEffect = run; fn(); activeEffect = null; };
    run();
    return run;
  }
  function computed(getter) {
    let value;
    let dirty = true;
    effect(() => { dirty = true; });
    return new Proxy({}, {
      get(_, key) {
        if (key === "value") {
          if (dirty) { activeEffect = null; value = getter(); dirty = false; }
          return value;
        }
      },
    });
  }
  const state = reactive({ a: 1, b: 2, multiplier: 10 });
  const log = [];
  effect(() => log.push(`a + b = ${state.a + state.b}`));
  state.a = 5;
  state.b = 3;
  const product = computed(() => state.a * state.multiplier);
  state.a = 7;
  console.log("ex50 full reactive system:", log, "product:", product.value);
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
