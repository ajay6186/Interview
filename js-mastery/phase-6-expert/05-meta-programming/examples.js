// ============================================================================
// Examples 6.5 — Meta-Programming  (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================================
"use strict";

// ─── BASIC (1–13) ────────────────────────────────────────────────────────────

/** Object.defineProperty (value): add non-enumerable property */
function ex01() {
  const obj = { visible: "yes" };
  Object.defineProperty(obj, "hidden", {
    value: "secret",
    enumerable: false,
    writable: false,
    configurable: false
  });
  console.log("Ex01 — defineProperty:", obj.hidden, "keys:", Object.keys(obj));
}

/** enumerable:false: exclude from enumeration */
function ex02() {
  const person = {};
  Object.defineProperty(person, "password", { value: "hashed-pw", enumerable: false, writable: true });
  Object.defineProperty(person, "name", { value: "Alice", enumerable: true, writable: true });
  console.log("Ex02 — enumerable false:", Object.keys(person), "direct:", person.password);
}

/** writable:false: prevent value changes */
function ex03() {
  const config = {};
  Object.defineProperty(config, "VERSION", { value: "1.0.0", writable: false, enumerable: true });
  try { config.VERSION = "2.0.0"; } catch(e) { /* strict mode throws */ }
  console.log("Ex03 — writable false:", config.VERSION);
}

/** configurable:false: lock property definition */
function ex04() {
  const obj = {};
  Object.defineProperty(obj, "id", { value: 42, configurable: false, writable: false });
  let threw = false;
  try { Object.defineProperty(obj, "id", { value: 99 }); } catch { threw = true; }
  console.log("Ex04 — configurable false threw:", threw, "id still:", obj.id);
}

/** getter via defineProperty: computed property */
function ex05() {
  const circle = { radius: 5 };
  Object.defineProperty(circle, "circumference", {
    get() { return 2 * Math.PI * this.radius; },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(circle, "area", {
    get() { return Math.PI * this.radius ** 2; },
    enumerable: true
  });
  console.log("Ex05 — getter:", circle.circumference.toFixed(4), circle.area.toFixed(4));
}

/** setter via defineProperty: validate on set */
function ex06() {
  const obj = { _age: 0 };
  Object.defineProperty(obj, "age", {
    get() { return this._age; },
    set(val) {
      if (typeof val !== "number" || val < 0 || val > 150) throw new RangeError("Invalid age");
      this._age = val;
    },
    enumerable: true,
    configurable: true
  });
  obj.age = 30;
  try { obj.age = -5; } catch(e) { console.log("Ex06 — setter validation:", e.message); }
  console.log("Ex06 — setter age:", obj.age);
}

/** getOwnPropertyDescriptor: inspect property metadata */
function ex07() {
  const obj = { name: "Alice" };
  Object.defineProperty(obj, "ssn", { value: "123-45-6789", enumerable: false, writable: false, configurable: false });
  const nameDesc = Object.getOwnPropertyDescriptor(obj, "name");
  const ssnDesc = Object.getOwnPropertyDescriptor(obj, "ssn");
  console.log("Ex07 — name descriptor:", nameDesc);
  console.log("Ex07 — ssn descriptor:", ssnDesc);
}

/** getOwnPropertyNames: includes non-enumerable */
function ex08() {
  const obj = { a: 1 };
  Object.defineProperty(obj, "b", { value: 2, enumerable: false });
  Object.defineProperty(obj, "c", { value: 3, enumerable: false });
  console.log("Ex08 — Object.keys:", Object.keys(obj));
  console.log("Ex08 — getOwnPropertyNames:", Object.getOwnPropertyNames(obj));
}

/** defineProperties: define multiple at once */
function ex09() {
  const obj = {};
  Object.defineProperties(obj, {
    x: { value: 10, enumerable: true, writable: true },
    y: { value: 20, enumerable: true, writable: true },
    magnitude: {
      get() { return Math.sqrt(this.x ** 2 + this.y ** 2); },
      enumerable: true
    }
  });
  console.log("Ex09 — defineProperties:", obj.x, obj.y, obj.magnitude.toFixed(4));
}

/** getOwnPropertySymbols: see symbol-keyed properties */
function ex10() {
  const TYPE = Symbol("type");
  const ID = Symbol("id");
  const obj = { name: "Widget", [TYPE]: "product", [ID]: 42 };
  const symbols = Object.getOwnPropertySymbols(obj);
  console.log("Ex10 — getOwnPropertySymbols count:", symbols.length, symbols.map(s => obj[s]));
}

/** Object.create with descriptors: prototype + properties together */
function ex11() {
  const animalProto = {
    speak() { return `${this.name} makes a sound`; }
  };
  const dog = Object.create(animalProto, {
    name: { value: "Rex", writable: true, enumerable: true },
    breed: { value: "Labrador", writable: true, enumerable: true },
    bark: { value: function() { return `${this.name} says: Woof!`; }, enumerable: true }
  });
  console.log("Ex11 — Object.create:", dog.speak(), dog.bark());
}

/** Object.setPrototypeOf: change prototype chain */
function ex12() {
  const swimmer = { swim() { return `${this.name} swims`; } };
  const flyer = { fly() { return `${this.name} flies`; } };
  const duck = { name: "Donald" };
  Object.setPrototypeOf(duck, swimmer);
  console.log("Ex12 — before:", duck.swim(), typeof duck.fly);
  Object.setPrototypeOf(duck, flyer);
  console.log("Ex12 — after setPrototypeOf:", duck.fly(), typeof duck.swim);
}

/** Object.freeze vs Object.seal: immutability levels */
function ex13() {
  const frozen = Object.freeze({ x: 1, y: 2 });
  const sealed = Object.seal({ x: 1, y: 2 });

  try { frozen.x = 99; } catch {}
  try { frozen.z = 3; } catch {}
  sealed.x = 99; // ok to change value
  try { sealed.z = 3; } catch {} // cannot add

  console.log("Ex13 — frozen:", frozen.x, Object.isFrozen(frozen));
  console.log("Ex13 — sealed:", sealed.x, Object.isSealed(sealed), sealed.z);
}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────────────────────

/** Object.create with descriptors: full prototype chain */
function ex14() {
  const vehicle = {
    get type() { return "vehicle"; },
    describe() { return `${this.type}: ${this.name}`; }
  };
  const car = Object.create(vehicle, {
    name: { value: "Tesla", writable: true, enumerable: true },
    type: { get() { return "car"; }, enumerable: true, configurable: true }
  });
  console.log("Ex14 — Object.create chain:", car.describe(), Object.getPrototypeOf(car) === vehicle);
}

/** Reflect.defineProperty: like Object.defineProperty but returns bool */
function ex15() {
  const obj = {};
  const success = Reflect.defineProperty(obj, "x", { value: 42, enumerable: true });
  const fail = Reflect.defineProperty(Object.freeze({}), "y", { value: 1 });
  console.log("Ex15 — Reflect.defineProperty:", success, obj.x, "fail:", fail);
}

/** Reflect.deleteProperty: delete with success indicator */
function ex16() {
  const obj = { a: 1, b: 2 };
  Object.defineProperty(obj, "c", { value: 3, configurable: false });
  const delA = Reflect.deleteProperty(obj, "a");
  const delC = Reflect.deleteProperty(obj, "c"); // non-configurable
  console.log("Ex16 — Reflect.deleteProperty:", delA, "a gone:", !("a" in obj), "delC:", delC);
}

/** Reflect.get with receiver: use different 'this' for getter */
function ex17() {
  const obj = {
    _x: 10,
    get x() { return this._x * 2; }
  };
  const otherThis = { _x: 99 };
  const normal = Reflect.get(obj, "x", obj);
  const withReceiver = Reflect.get(obj, "x", otherThis);
  console.log("Ex17 — Reflect.get receiver:", normal, withReceiver);
}

/** Reflect.set with receiver: set on receiver */
function ex18() {
  const proto = {
    set x(val) { this._x = val * 2; }
  };
  const obj = Object.create(proto);
  const receiver = {};
  Reflect.set(proto, "x", 5, receiver);
  console.log("Ex18 — Reflect.set receiver:", receiver._x, "obj._x:", obj._x);
}

/** Reflect.has: like 'in' operator */
function ex19() {
  const obj = { a: 1 };
  const child = Object.create(obj);
  child.b = 2;
  console.log("Ex19 — Reflect.has own:", Reflect.has(child, "b"), "inherited:", Reflect.has(child, "a"), "missing:", Reflect.has(child, "c"));
}

/** Reflect.ownKeys: all keys including symbols and non-enumerable */
function ex20() {
  const SYM = Symbol("hidden");
  const obj = { visible: 1 };
  Object.defineProperty(obj, "nonEnum", { value: 2, enumerable: false });
  obj[SYM] = 3;
  const allKeys = Reflect.ownKeys(obj);
  console.log("Ex20 — Reflect.ownKeys:", allKeys.filter(k => typeof k === "string"), "symbols:", allKeys.filter(k => typeof k === "symbol").length);
}

/** Reflect.getPrototypeOf: get prototype safely */
function ex21() {
  class Animal {}
  class Dog extends Animal {}
  const d = new Dog();
  const proto1 = Reflect.getPrototypeOf(d);
  const proto2 = Reflect.getPrototypeOf(proto1);
  console.log("Ex21 — Reflect.getPrototypeOf:", proto1 === Dog.prototype, proto2 === Animal.prototype);
}

/** Reflect.setPrototypeOf: set prototype returns bool */
function ex22() {
  const proto = { greet() { return "Hello from proto"; } };
  const obj = {};
  const ok = Reflect.setPrototypeOf(obj, proto);
  console.log("Ex22 — Reflect.setPrototypeOf:", ok, obj.greet());
}

/** Reflect.apply: call function with explicit this and args */
function ex23() {
  function greet(greeting, punctuation) {
    return `${greeting}, ${this.name}${punctuation}`;
  }
  const person = { name: "Alice" };
  const result = Reflect.apply(greet, person, ["Hello", "!"]);
  console.log("Ex23 — Reflect.apply:", result);
}

/** Reflect.construct: call constructor as function */
function ex24() {
  class Point {
    constructor(x, y) { this.x = x; this.y = y; }
    toString() { return `(${this.x}, ${this.y})`; }
  }
  const p = Reflect.construct(Point, [3, 4]);
  console.log("Ex24 — Reflect.construct:", p.toString(), p instanceof Point);
}

/** Proxy + Reflect.get: transparent forwarding proxy */
function ex25() {
  function createLoggingProxy(target, name) {
    return new Proxy(target, {
      get(t, key, receiver) {
        if (typeof t[key] === "function") {
          return function(...args) {
            console.log(`Ex25 — [${name}] call ${String(key)}(${args})`);
            return Reflect.apply(t[key], t, args);
          };
        }
        console.log(`Ex25 — [${name}] get ${String(key)}`);
        return Reflect.get(t, key, receiver);
      }
    });
  }
  const arr = createLoggingProxy([1, 2, 3], "Array");
  arr.push(4);
  console.log("Ex25 — after push:", arr.length);
}

/** Proxy + Reflect.set: validation proxy */
function ex26() {
  function createTypedProxy(target, schema) {
    return new Proxy(target, {
      set(t, key, val, receiver) {
        if (schema[key]) {
          const { type, min, max } = schema[key];
          if (typeof val !== type) throw new TypeError(`${key} must be ${type}`);
          if (min !== undefined && val < min) throw new RangeError(`${key} must be >= ${min}`);
          if (max !== undefined && val > max) throw new RangeError(`${key} must be <= ${max}`);
        }
        return Reflect.set(t, key, val, receiver);
      }
    });
  }
  const user = createTypedProxy({}, {
    name: { type: "string" },
    age: { type: "number", min: 0, max: 150 }
  });
  user.name = "Alice";
  user.age = 30;
  try { user.age = 200; } catch(e) { console.log("Ex26 — typed proxy error:", e.message); }
  console.log("Ex26 — typed proxy:", user.name, user.age);
}

// ─── NESTED (27–38) ──────────────────────────────────────────────────────────

/** Reflect.apply: implement Function.prototype.call without .call */
function ex27() {
  function sum(...nums) { return nums.reduce((a, b) => a + b, this.initial || 0); }
  const ctx = { initial: 100 };
  const result = Reflect.apply(sum, ctx, [1, 2, 3, 4, 5]);
  console.log("Ex27 — Reflect.apply sum:", result);
}

/** Reflect.construct: new.target forwarding */
function ex28() {
  class Base {
    constructor(type) { this.type = type; }
  }
  class Derived extends Base {
    constructor() { super("derived"); this.extra = true; }
  }
  // Use Base constructor but set new.target to Derived
  const instance = Reflect.construct(Base, ["custom-type"], Derived);
  console.log("Ex28 — Reflect.construct new.target:", instance instanceof Derived, instance.type);
}

/** Proxy all traps template: trap every possible operation */
function ex29() {
  const operationLog = [];
  const handler = {
    get(t, k, r) { operationLog.push(`get:${String(k)}`); return Reflect.get(t, k, r); },
    set(t, k, v, r) { operationLog.push(`set:${String(k)}`); return Reflect.set(t, k, v, r); },
    has(t, k) { operationLog.push(`has:${String(k)}`); return Reflect.has(t, k); },
    deleteProperty(t, k) { operationLog.push(`delete:${String(k)}`); return Reflect.deleteProperty(t, k); },
    ownKeys(t) { operationLog.push("ownKeys"); return Reflect.ownKeys(t); },
    getPrototypeOf(t) { operationLog.push("getProto"); return Reflect.getPrototypeOf(t); }
  };
  const proxy = new Proxy({ x: 1, y: 2 }, handler);
  proxy.x;
  proxy.z = 3;
  "y" in proxy;
  Object.keys(proxy);
  console.log("Ex29 — all traps log:", operationLog);
}

/** computed class fields: dynamic property names */
function ex30() {
  const METHODS = ["greet", "farewell", "ask"];
  const responses = { greet: "Hello!", farewell: "Goodbye!", ask: "Hmm?" };

  class Bot {
    constructor(name) { this.name = name; }
  }
  METHODS.forEach(method => {
    Object.defineProperty(Bot.prototype, method, {
      value: function() { return `${this.name}: ${responses[method]}`; },
      enumerable: true, configurable: true, writable: true
    });
  });

  const bot = new Bot("Alice-Bot");
  console.log("Ex30 — computed class fields:", bot.greet(), bot.farewell(), bot.ask());
}

/** class static blocks: initialization with side effects */
function ex31() {
  class Registry {
    static #entries = new Map();
    static {
      // Initialize with defaults
      ["admin", "user", "guest"].forEach((role, i) => {
        Registry.#entries.set(role, { id: i + 1, permissions: i === 0 ? ["all"] : [`level-${i}`] });
      });
    }
    static get(role) { return Registry.#entries.get(role); }
    static has(role) { return Registry.#entries.has(role); }
  }
  console.log("Ex31 — static blocks:", Registry.get("admin"), Registry.has("guest"));
}

/** decorator pattern (manual): enhance methods without modifying class */
function ex32() {
  function readonly(target, key, descriptor) {
    descriptor.writable = false;
    return descriptor;
  }
  function logMethod(target, key, descriptor) {
    const original = descriptor.value;
    descriptor.value = function(...args) {
      console.log(`Ex32 — calling ${key}(${args})`);
      return original.apply(this, args);
    };
    return descriptor;
  }
  class Calculator {
    add(a, b) { return a + b; }
  }
  // Manual decorator application
  const desc = Object.getOwnPropertyDescriptor(Calculator.prototype, "add");
  Object.defineProperty(Calculator.prototype, "add", logMethod(Calculator.prototype, "add", desc));

  const calc = new Calculator();
  console.log("Ex32 — decorator result:", calc.add(3, 4));
}

/** property decorator concept: validate property on set */
function ex33() {
  function range(min, max) {
    return function(target, key) {
      let val;
      Object.defineProperty(target, key, {
        get() { return val; },
        set(newVal) {
          if (newVal < min || newVal > max) throw new RangeError(`${key} must be ${min}-${max}`);
          val = newVal;
        },
        enumerable: true, configurable: true
      });
    };
  }
  // Apply range decorator manually
  class Temperature {
    constructor(celsius) {
      this.celsius = celsius;
    }
  }
  range(-273, 1000)(Temperature.prototype, "celsius");
  const t = new Temperature(25);
  t.celsius = 100;
  try { t.celsius = 2000; } catch(e) { console.log("Ex33 — range decorator error:", e.message); }
  console.log("Ex33 — celsius:", t.celsius);
}

/** method decorator concept: timing decorator */
function ex34() {
  function timed(label) {
    return function(target, key, descriptor) {
      const original = descriptor.value;
      descriptor.value = function(...args) {
        const start = Date.now();
        const result = original.apply(this, args);
        const duration = Date.now() - start;
        console.log(`Ex34 — ${label || key} took ${duration}ms`);
        return result;
      };
      return descriptor;
    };
  }
  class DataProcessor {
    processLarge(n) {
      let sum = 0;
      for (let i = 0; i < n; i++) sum += i;
      return sum;
    }
  }
  const desc = Object.getOwnPropertyDescriptor(DataProcessor.prototype, "processLarge");
  Object.defineProperty(DataProcessor.prototype, "processLarge", timed("processLarge")(DataProcessor.prototype, "processLarge", desc));
  const dp = new DataProcessor();
  console.log("Ex34 — timed result:", dp.processLarge(100000));
}

/** mixin via meta-programming: compose behaviors */
function ex35() {
  function mixin(Base, ...mixins) {
    class Mixed extends Base {}
    mixins.forEach(mixin => {
      Object.getOwnPropertyNames(mixin.prototype).forEach(key => {
        if (key !== "constructor") {
          Object.defineProperty(Mixed.prototype, key, Object.getOwnPropertyDescriptor(mixin.prototype, key));
        }
      });
    });
    return Mixed;
  }
  class Serializable {
    serialize() { return JSON.stringify(this); }
  }
  class Validatable {
    validate() { return Object.values(this).every(v => v !== null && v !== undefined); }
  }
  class User {
    constructor(name, email) { this.name = name; this.email = email; }
  }
  const EnhancedUser = mixin(User, Serializable, Validatable);
  const u = new EnhancedUser("Alice", "alice@example.com");
  console.log("Ex35 — mixin:", u.serialize(), u.validate());
}

/** trait application: add behaviors conditionally */
function ex36() {
  function applyTrait(target, trait) {
    const descs = {};
    Object.getOwnPropertyNames(trait).forEach(key => {
      if (key === "constructor") return;
      descs[key] = Object.getOwnPropertyDescriptor(trait, key);
    });
    Object.defineProperties(target, descs);
    return target;
  }
  const Loggable = {
    log(message) { return `[${this.constructor.name}] ${message}`; },
    error(message) { return `[ERROR:${this.constructor.name}] ${message}`; }
  };
  const Cacheable = {
    cache: null,
    getCached(key) { return this.cache && this.cache.get(key); },
    setCached(key, value) { if (!this.cache) this.cache = new Map(); this.cache.set(key, value); }
  };
  class Service {}
  applyTrait(Service.prototype, Loggable);
  applyTrait(Service.prototype, Cacheable);
  const svc = new Service();
  console.log("Ex36 — trait application:", svc.log("started"), svc.error("oops"));
}

/** capability pattern: object capabilities for security */
function ex37() {
  function createCapabilityObject(data) {
    const _data = { ...data };
    const readers = new Set();
    const writers = new Set();
    return {
      grantRead(token) { readers.add(token); },
      grantWrite(token) { readers.add(token); writers.add(token); },
      createAccessor(token) {
        return new Proxy({}, {
          get(_, key) {
            if (!readers.has(token)) throw new Error("Read access denied");
            return _data[key];
          },
          set(_, key, val) {
            if (!writers.has(token)) throw new Error("Write access denied");
            _data[key] = val; return true;
          }
        });
      }
    };
  }
  const cap = createCapabilityObject({ name: "Alice", age: 30 });
  const readToken = Symbol("read");
  const writeToken = Symbol("write");
  cap.grantRead(readToken);
  cap.grantWrite(writeToken);
  const reader = cap.createAccessor(readToken);
  const writer = cap.createAccessor(writeToken);
  writer.age = 31;
  console.log("Ex37 — capability reader:", reader.name, reader.age);
  try { reader.age = 99; } catch(e) { console.log("Ex37 — write denied:", e.message); }
}

/** membrane via Proxy+Reflect: security boundary */
function ex38() {
  function createMembrane(target) {
    const wrapped = new WeakMap();
    function wrap(obj) {
      if (typeof obj !== "object" || obj === null) return obj;
      if (wrapped.has(obj)) return wrapped.get(obj);
      const proxy = new Proxy(obj, {
        get(t, key, receiver) {
          const val = Reflect.get(t, key, t);
          return typeof val === "object" && val !== null ? wrap(val) : val;
        },
        set(t, key, val) {
          return Reflect.set(t, key, val, t);
        }
      });
      wrapped.set(obj, proxy);
      return proxy;
    }
    return wrap(target);
  }
  const data = { user: { name: "Bob", address: { city: "LA" } } };
  const membrane = createMembrane(data);
  console.log("Ex38 — membrane:", membrane.user.name, membrane.user.address.city);
}

// ─── ADVANCED (39–50) ────────────────────────────────────────────────────────

/** transparent proxy wrapper: forward all operations */
function ex39() {
  function createTransparentProxy(target) {
    return new Proxy(target, {
      get: Reflect.get,
      set: Reflect.set,
      has: Reflect.has,
      deleteProperty: Reflect.deleteProperty,
      ownKeys: Reflect.ownKeys,
      getOwnPropertyDescriptor: Reflect.getOwnPropertyDescriptor,
      defineProperty: Reflect.defineProperty,
      getPrototypeOf: Reflect.getPrototypeOf,
      setPrototypeOf: Reflect.setPrototypeOf,
      isExtensible: Reflect.isExtensible,
      preventExtensions: Reflect.preventExtensions,
      apply: Reflect.apply,
      construct: Reflect.construct
    });
  }
  const obj = { x: 1, y: 2 };
  const proxy = createTransparentProxy(obj);
  proxy.z = 3;
  console.log("Ex39 — transparent proxy:", proxy.x, proxy.y, proxy.z, Object.keys(proxy));
}

/** virtual class concept: class from schema */
function ex40() {
  function createClass(name, schema) {
    const ctor = function(...args) {
      const keys = Object.keys(schema);
      keys.forEach((key, i) => { this[key] = args[i] !== undefined ? args[i] : schema[key].default; });
    };
    Object.defineProperty(ctor, "name", { value: name });
    // Add getters for computed fields
    Object.entries(schema).forEach(([key, def]) => {
      if (def.computed) {
        Object.defineProperty(ctor.prototype, key, { get: def.computed, enumerable: true });
      }
    });
    ctor.prototype.toString = function() {
      return `${name}(${Object.keys(schema).filter(k => !schema[k].computed).map(k => `${k}=${this[k]}`).join(", ")})`;
    };
    return ctor;
  }
  const Point = createClass("Point", {
    x: { default: 0 },
    y: { default: 0 },
    magnitude: { computed() { return Math.sqrt(this.x ** 2 + this.y ** 2); } }
  });
  const p = new Point(3, 4);
  console.log("Ex40 — virtual class:", p.toString(), "magnitude:", p.magnitude);
}

/** dynamic method generation: create methods at runtime */
function ex41() {
  function generateMethods(target, specs) {
    specs.forEach(({ name, impl }) => {
      Object.defineProperty(target.prototype, name, {
        value: impl,
        enumerable: true, writable: true, configurable: true
      });
    });
    return target;
  }
  class Collection {
    constructor(items) { this._items = [...items]; }
  }
  generateMethods(Collection, [
    { name: "first", impl: function() { return this._items[0]; } },
    { name: "last", impl: function() { return this._items[this._items.length - 1]; } },
    { name: "count", impl: function() { return this._items.length; } },
    { name: "contains", impl: function(x) { return this._items.includes(x); } }
  ]);
  const coll = new Collection([10, 20, 30, 40]);
  console.log("Ex41 — dynamic methods:", coll.first(), coll.last(), coll.count(), coll.contains(20));
}

/** meta-object protocol concept: intercept method calls */
function ex42() {
  function createMOP(target) {
    const before = new Map();
    const after = new Map();
    return {
      before(method, fn) { before.set(method, fn); },
      after(method, fn) { after.set(method, fn); },
      proxy: new Proxy(target, {
        get(t, key) {
          const val = t[key];
          if (typeof val !== "function") return val;
          return function(...args) {
            if (before.has(key)) before.get(key).call(t, ...args);
            const result = val.apply(t, args);
            if (after.has(key)) after.get(key).call(t, result, ...args);
            return result;
          };
        }
      })
    };
  }
  const obj = { add(a, b) { return a + b; } };
  const log = [];
  const mop = createMOP(obj);
  mop.before("add", (a, b) => log.push(`before add(${a}, ${b})`));
  mop.after("add", (result) => log.push(`after add → ${result}`));
  const result = mop.proxy.add(3, 4);
  console.log("Ex42 — MOP:", result, log);
}

/** object extension points: open/closed via defineProperty */
function ex43() {
  function createExtensible(base) {
    const extensions = new Map();
    return new Proxy(base, {
      get(target, key) {
        if (extensions.has(key)) return extensions.get(key).bind(target);
        return Reflect.get(target, key);
      },
      set(target, key, value) {
        if (typeof value === "function" && !Reflect.has(target, key)) {
          extensions.set(key, value); return true;
        }
        return Reflect.set(target, key, value);
      }
    });
  }
  const obj = { x: 10, y: 20 };
  const ext = createExtensible(obj);
  ext.magnitude = function() { return Math.sqrt(this.x ** 2 + this.y ** 2); };
  ext.toString = function() { return `(${this.x}, ${this.y})`; };
  console.log("Ex43 — extension points:", ext.magnitude(), ext.toString(), ext.x);
}

/** revocable capability: revoke access at any time */
function ex44() {
  function createRevocable(target) {
    const { proxy, revoke } = Proxy.revocable(target, {
      get: Reflect.get,
      set: Reflect.set
    });
    return { proxy, revoke };
  }
  const secret = { data: "top secret", value: 42 };
  const { proxy, revoke } = createRevocable(secret);
  console.log("Ex44 — before revoke:", proxy.data, proxy.value);
  revoke();
  let error = null;
  try { proxy.data; } catch(e) { error = e.message; }
  console.log("Ex44 — after revoke error:", error ? "TypeError (revoked)" : "no error");
}

/** auto-serialization proxy: track dirty state */
function ex45() {
  function createDirtyTracker(initial) {
    let dirty = false;
    const proxy = new Proxy({ ...initial }, {
      set(target, key, value) {
        if (target[key] !== value) dirty = true;
        return Reflect.set(target, key, value);
      }
    });
    return {
      proxy,
      isDirty() { return dirty; },
      clean() { dirty = false; },
      snapshot() { return { ...proxy }; }
    };
  }
  const tracker = createDirtyTracker({ name: "Alice", age: 30 });
  console.log("Ex45 — initially dirty:", tracker.isDirty());
  tracker.proxy.age = 31;
  console.log("Ex45 — after mutation:", tracker.isDirty(), tracker.snapshot());
  tracker.clean();
  console.log("Ex45 — after clean:", tracker.isDirty());
}

/** lazy evaluation proxy: defer property computation */
function ex46() {
  function createLazyObject(computations) {
    const cache = {};
    return new Proxy({}, {
      get(target, key) {
        if (!(key in cache)) {
          if (!(key in computations)) return undefined;
          console.log(`Ex46 — computing ${String(key)}...`);
          cache[key] = computations[key]();
        }
        return cache[key];
      },
      has(target, key) { return key in computations; }
    });
  }
  const lazy = createLazyObject({
    primes: () => {
      const sieve = new Array(50).fill(true);
      sieve[0] = sieve[1] = false;
      for (let i = 2; i < 50; i++) if (sieve[i]) for (let j = i*2; j < 50; j += i) sieve[j] = false;
      return sieve.map((v, i) => v ? i : null).filter(Boolean);
    },
    factorial10: () => { let r = 1; for (let i = 2; i <= 10; i++) r *= i; return r; }
  });
  console.log("Ex46 — lazy primes first 5:", lazy.primes.slice(0, 5), "factorial10:", lazy.factorial10);
  console.log("Ex46 — cached:", lazy.factorial10);
}

/** observable properties: track all changes */
function ex47() {
  function observable(initial) {
    const listeners = new Map();
    const proxy = new Proxy({ ...initial }, {
      set(target, key, value) {
        const old = target[key];
        Reflect.set(target, key, value);
        if (old !== value) {
          (listeners.get(key) || []).forEach(fn => fn(value, old, key));
          (listeners.get("*") || []).forEach(fn => fn(value, old, key));
        }
        return true;
      }
    });
    return {
      data: proxy,
      watch(key, fn) {
        if (!listeners.has(key)) listeners.set(key, []);
        listeners.get(key).push(fn);
        return () => listeners.set(key, listeners.get(key).filter(f => f !== fn));
      }
    };
  }
  const { data, watch } = observable({ count: 0, name: "Alice" });
  const log = [];
  watch("count", (newVal, oldVal) => log.push(`count: ${oldVal} → ${newVal}`));
  watch("*", (newVal, oldVal, key) => log.push(`any[${key}]: ${newVal}`));
  data.count = 1; data.count = 2; data.name = "Bob";
  console.log("Ex47 — observable:", log);
}

/** structural typing via Proxy: duck-typing enforcer */
function ex48() {
  function requireInterface(obj, methods) {
    const missing = methods.filter(m => typeof obj[m] !== "function");
    if (missing.length) throw new TypeError(`Missing methods: ${missing.join(", ")}`);
    return new Proxy(obj, {
      get(target, key) {
        const val = Reflect.get(target, key);
        if (methods.includes(key) && typeof val !== "function") {
          throw new TypeError(`${key} must be a function`);
        }
        return val;
      }
    });
  }
  const ITERABLE_INTERFACE = [Symbol.iterator.toString()]; // just demonstrate concept
  const repo = {
    findById(id) { return { id, name: "Alice" }; },
    save(entity) { return { ...entity, saved: true }; },
    delete(id) { return true; }
  };
  try {
    const checked = requireInterface(repo, ["findById", "save", "delete"]);
    console.log("Ex48 — structural typing:", checked.findById(1));
  } catch(e) {
    console.log("Ex48 — interface error:", e.message);
  }
}

/** meta-programming with symbols: protocol implementation check */
function ex49() {
  const IMPLEMENTS = Symbol("implements");
  const ITERABLE_PROTOCOL = Symbol("Iterable");
  const COMPARABLE_PROTOCOL = Symbol("Comparable");

  function implement(cls, ...protocols) {
    cls[IMPLEMENTS] = protocols;
    return cls;
  }
  function implements_(obj, protocol) {
    const cls = obj.constructor;
    return cls[IMPLEMENTS] && cls[IMPLEMENTS].includes(protocol);
  }

  class SortedList {
    constructor(items) { this._items = [...items].sort((a, b) => a - b); }
    [Symbol.iterator]() { return this._items[Symbol.iterator](); }
    compareTo(other) { return this._items.length - other._items.length; }
  }
  implement(SortedList, ITERABLE_PROTOCOL, COMPARABLE_PROTOCOL);

  const list = new SortedList([3, 1, 4, 1, 5, 9, 2, 6]);
  console.log("Ex49 — protocol check iterable:", implements_(list, ITERABLE_PROTOCOL));
  console.log("Ex49 — protocol check comparable:", implements_(list, COMPARABLE_PROTOCOL));
  console.log("Ex49 — spread:", [...list]);
}

/** full metaprogramming: observable + typed + validated class factory */
function ex50() {
  function createModel(schema) {
    return class Model {
      constructor(data) {
        const proxy = new Proxy(this, {
          set(target, key, value) {
            const def = schema[key];
            if (!def) { Reflect.set(target, key, value); return true; }
            if (def.type && typeof value !== def.type) throw new TypeError(`${key}: expected ${def.type}`);
            if (def.validate && !def.validate(value)) throw new Error(`${key}: validation failed`);
            Reflect.set(target, key, value);
            return true;
          },
          get(target, key) {
            if (key === "toJSON") return () => {
              const result = {};
              Object.keys(schema).forEach(k => { if (target[k] !== undefined) result[k] = target[k]; });
              return result;
            };
            return Reflect.get(target, key);
          }
        });
        Object.assign(proxy, data);
        return proxy;
      }
    };
  }

  const User = createModel({
    name: { type: "string", validate: v => v.length >= 2 },
    age: { type: "number", validate: v => v >= 0 && v <= 150 },
    email: { type: "string", validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) }
  });

  const user = new User({ name: "Alice", age: 30, email: "alice@example.com" });
  console.log("Ex50 — model:", JSON.stringify(user));

  let err = null;
  try { new User({ name: "A", age: 30, email: "alice@example.com" }); } catch(e) { err = e.message; }
  console.log("Ex50 — validation error:", err);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

function main() {
  console.log("=== BASIC (1–13) ===");
  ex01(); ex02(); ex03(); ex04(); ex05(); ex06(); ex07(); ex08(); ex09(); ex10();
  ex11(); ex12(); ex13();
  console.log("=== INTERMEDIATE (14–26) ===");
  ex14(); ex15(); ex16(); ex17(); ex18(); ex19(); ex20(); ex21(); ex22(); ex23();
  ex24(); ex25(); ex26();
  console.log("=== NESTED (27–38) ===");
  ex27(); ex28(); ex29(); ex30(); ex31(); ex32(); ex33(); ex34(); ex35(); ex36();
  ex37(); ex38();
  console.log("=== ADVANCED (39–50) ===");
  ex39(); ex40(); ex41(); ex42(); ex43(); ex44(); ex45(); ex46(); ex47(); ex48();
  ex49(); ex50();
}

main();
