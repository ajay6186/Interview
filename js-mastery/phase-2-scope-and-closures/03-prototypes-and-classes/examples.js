// ============================================================================
// Examples 2.3 — Prototypes & Classes  (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================================

"use strict";

function ex01() {
  const proto = { greet() { return `Hi, ${this.name}`; } };
  const obj = Object.create(proto);
  obj.name = "Alice";
  console.log("Ex01 —", obj.greet());
}
function ex02() {
  function Person(name) { this.name = name; }
  Person.prototype.greet = function() { return `Hello, ${this.name}`; };
  console.log("Ex02 —", new Person("Bob").greet());
}
function ex03() {
  function Foo() {}
  const f = new Foo();
  console.log("Ex03 — instanceof:", f instanceof Foo, "proto:", Object.getPrototypeOf(f) === Foo.prototype);
}
function ex04() {
  class Animal {
    constructor(name) { this.name = name; }
    speak() { return `${this.name} makes a noise`; }
  }
  console.log("Ex04 —", new Animal("Lion").speak());
}
function ex05() {
  class Dog extends Animal {
    speak() { return `${this.name} barks`; }
  }
  class Animal { constructor(name) { this.name = name; } }
  // redefine properly
  class A2 { constructor(n) { this.name = n; } }
  class D2 extends A2 { speak() { return `${this.name} barks`; } }
  console.log("Ex05 —", new D2("Rex").speak());
}
function ex06() {
  class Shape {
    constructor(color) { this.color = color; }
    describe() { return `${this.color} shape`; }
  }
  class Circle extends Shape {
    constructor(color, r) { super(color); this.radius = r; }
    area() { return Math.PI * this.radius ** 2; }
    describe() { return `${super.describe()} (circle r=${this.radius})`; }
  }
  const c = new Circle("red", 5);
  console.log("Ex06 —", c.describe(), c.area().toFixed(2));
}
function ex07() {
  class MathUtils {
    static add(a, b) { return a + b; }
    static PI = 3.14159;
  }
  console.log("Ex07 —", MathUtils.add(3, 4), MathUtils.PI);
}
function ex08() {
  class Counter {
    #count = 0;
    inc() { return ++this.#count; }
    get value() { return this.#count; }
  }
  const c = new Counter();
  c.inc(); c.inc();
  console.log("Ex08 —", c.value);
}
function ex09() {
  class Person {
    #name;
    constructor(n) { this.#name = n; }
    get name() { return this.#name; }
    set name(v) { this.#name = v.trim(); }
  }
  const p = new Person(" Alice ");
  console.log("Ex09 — name:", p.name);
  p.name = "  Bob  ";
  console.log("Ex09 — updated:", p.name);
}
function ex10() {
  class Singleton {
    static #instance = null;
    constructor(v) { this.value = v; }
    static getInstance(v) { return (Singleton.#instance ??= new Singleton(v)); }
  }
  const a = Singleton.getInstance(1), b = Singleton.getInstance(2);
  console.log("Ex10 — same?", a === b, "value:", a.value);
}
function ex11() {
  // hasOwnProperty vs in
  function Animal(n) { this.name = n; }
  Animal.prototype.speak = function() {};
  const a = new Animal("Cat");
  console.log("Ex11 — own name:", Object.hasOwn(a, "name"), "proto speak:", "speak" in a && !Object.hasOwn(a, "speak"));
}
function ex12() {
  // __proto__ vs prototype
  function Foo() {}
  const f = new Foo();
  console.log("Ex12 —", Object.getPrototypeOf(f) === Foo.prototype);
}
function ex13() {
  // instanceof check
  class A {}; class B extends A {}; class C extends B {}
  const c = new C();
  console.log("Ex13 —", c instanceof C, c instanceof B, c instanceof A);
}
function ex14() {
  // Mixin pattern
  const Serializable = (S) => class extends S { serialize() { return JSON.stringify(this); } };
  class Base { constructor(d) { Object.assign(this, d); } }
  class Model extends Serializable(Base) {}
  console.log("Ex14 —", new Model({ x: 1, y: 2 }).serialize());
}
function ex15() {
  // Abstract-like base class
  class AbstractShape {
    area() { throw new Error("area() must be implemented"); }
    describe() { return `Area: ${this.area().toFixed(2)}`; }
  }
  class Square extends AbstractShape {
    constructor(side) { super(); this.side = side; }
    area() { return this.side ** 2; }
  }
  console.log("Ex15 —", new Square(4).describe());
}
function ex16() {
  // Symbol.iterator in class
  class Range {
    constructor(start, end) { this.start = start; this.end = end; }
    [Symbol.iterator]() {
      let cur = this.start, end = this.end;
      return { next() { return cur <= end ? { value: cur++, done: false } : { done: true }; } };
    }
  }
  console.log("Ex16 —", [...new Range(1, 5)]);
}
function ex17() {
  // Class with Symbol.toPrimitive
  class Money {
    constructor(amount, currency) { this.amount = amount; this.currency = currency; }
    [Symbol.toPrimitive](hint) {
      if (hint === "number") return this.amount;
      return `${this.amount} ${this.currency}`;
    }
  }
  const m = new Money(42, "USD");
  console.log("Ex17 —", +m, `${m}`);
}
function ex18() {
  // toString override
  class Point {
    constructor(x, y) { this.x = x; this.y = y; }
    toString() { return `(${this.x}, ${this.y})`; }
  }
  console.log("Ex18 —", String(new Point(3, 4)));
}
function ex19() {
  // valueOf override
  class Vector {
    constructor(x, y) { this.x = x; this.y = y; }
    valueOf() { return Math.sqrt(this.x ** 2 + this.y ** 2); }
    toString() { return `Vector(${this.x}, ${this.y})`; }
  }
  const v = new Vector(3, 4);
  console.log("Ex19 — magnitude:", +v, "string:", String(v));
}
function ex20() {
  // Class expression
  const Greeter = class {
    constructor(greeting) { this.greeting = greeting; }
    greet(name) { return `${this.greeting}, ${name}!`; }
  };
  console.log("Ex20 —", new Greeter("Hello").greet("World"));
}
function ex21() {
  // Static block (ES2022)
  class Config {
    static host;
    static port;
    static {
      Config.host = "localhost";
      Config.port = 3000;
    }
  }
  console.log("Ex21 —", Config.host, Config.port);
}
function ex22() {
  // Chained class extension (multi-level)
  class A { methodA() { return "A"; } }
  class B extends A { methodB() { return "B"; } }
  class C extends B { methodC() { return "C"; } }
  const c = new C();
  console.log("Ex22 —", c.methodA(), c.methodB(), c.methodC());
}
function ex23() {
  // Class factory (function returning a class)
  function makeClass(defaults) {
    return class {
      constructor(opts) { Object.assign(this, defaults, opts); }
    };
  }
  const Widget = makeClass({ color: "blue", size: 10 });
  const w = new Widget({ color: "red" });
  console.log("Ex23 —", w.color, w.size);
}
function ex24() {
  // Composition over inheritance
  const canFly = { fly() { return `${this.name} flies`; } };
  const canSwim = { swim() { return `${this.name} swims`; } };
  class Duck {
    constructor(name) { this.name = name; Object.assign(this, canFly, canSwim); }
  }
  const d = new Duck("Donald");
  console.log("Ex24 —", d.fly(), d.swim());
}
function ex25() {
  // Prototype chain lookup
  const grandparent = { level: "grandparent" };
  const parent = Object.create(grandparent);
  parent.level = "parent";
  const child = Object.create(parent);
  console.log("Ex25 — child.level:", child.level);
  console.log("Ex25 — grandparent.level:", Object.getPrototypeOf(Object.getPrototypeOf(child)).level);
}
function ex26() {
  // setPrototypeOf (avoid in hot paths)
  const base = { greet() { return "hi from base"; } };
  const obj = { name: "test" };
  Object.setPrototypeOf(obj, base);
  console.log("Ex26 —", obj.greet(), Object.getPrototypeOf(obj) === base);
}
function ex27() {
  // Private static
  class IdGen {
    static #next = 1;
    static generate() { return IdGen.#next++; }
  }
  console.log("Ex27 —", IdGen.generate(), IdGen.generate(), IdGen.generate());
}
function ex28() {
  // Abstract method enforcement
  class Plugin {
    execute() { throw new TypeError(`${this.constructor.name} must implement execute()`); }
  }
  class LogPlugin extends Plugin {
    execute(msg) { return `LOG: ${msg}`; }
  }
  console.log("Ex28 —", new LogPlugin().execute("hello"));
}
function ex29() {
  // Decorator pattern (manual)
  class Logger {
    constructor(service) { this._svc = service; }
    process(data) { const r = this._svc.process(data); console.log(`Ex29 — logged`); return r; }
  }
  class DataService { process(d) { return d.toUpperCase(); } }
  console.log("Ex29 —", new Logger(new DataService()).process("hello"));
}
function ex30() {
  // Proxy-based class interception
  class User { constructor(n) { this.name = n; } }
  const TrackedUser = new Proxy(User, {
    construct(target, args) {
      console.log("Ex30 — creating user:", args[0]);
      return new target(...args);
    }
  });
  const u = new TrackedUser("Alice");
  console.log("Ex30 —", u.name);
}
function ex31() {
  // Symbol.hasInstance
  class Even {
    static [Symbol.hasInstance](n) { return typeof n === "number" && n % 2 === 0; }
  }
  console.log("Ex31 —", 4 instanceof Even, 3 instanceof Even);
}
function ex32() {
  // Symbol.species
  class MyArray extends Array {
    static get [Symbol.species]() { return Array; }
  }
  const a = new MyArray(1, 2, 3);
  const mapped = a.map(x => x * 2);
  console.log("Ex32 — is MyArray:", mapped instanceof MyArray, "is Array:", mapped instanceof Array);
}
function ex33() {
  // Method chaining with clone
  class Builder {
    #data = {};
    set(key, val) { return Object.assign(new Builder(), this, { _data: { ...this.#data, [key]: val } }); }
    build() { return this.#data; }
  }
  // simpler version
  class QB {
    constructor(q = {}) { this.q = q; }
    where(k, v) { return new QB({ ...this.q, [k]: v }); }
    build() { return this.q; }
  }
  console.log("Ex33 —", new QB().where("age", 18).where("active", true).build());
}
function ex34() {
  // Lazy initialization
  class LazyService {
    get connection() {
      const conn = this._connect();
      Object.defineProperty(this, "connection", { value: conn });
      return conn;
    }
    _connect() { return { status: "connected" }; }
  }
  const svc = new LazyService();
  console.log("Ex34 —", svc.connection.status);
}
function ex35() {
  // Class with WeakMap for private data (pre-#fields pattern)
  const _data = new WeakMap();
  class Secret {
    constructor(v) { _data.set(this, { value: v }); }
    get value() { return _data.get(this).value; }
  }
  const s = new Secret(42);
  console.log("Ex35 —", s.value);
}
function ex36() {
  // Sealed class pattern
  class Point {
    constructor(x, y) { this.x = x; this.y = y; Object.seal(this); }
  }
  const p = new Point(1, 2);
  try { p.z = 3; } catch(e) {}
  p.x = 99;
  console.log("Ex36 — sealed:", p.x, Object.isSealed(p));
}
function ex37() {
  // Iterable class (linked list)
  class LinkedList {
    #head = null;
    push(v) { this.#head = { v, next: this.#head }; return this; }
    [Symbol.iterator]() {
      let node = this.#head;
      return { next() { if (!node) return { done: true }; const v = node.v; node = node.next; return { value: v, done: false }; } };
    }
  }
  const list = new LinkedList().push(3).push(2).push(1);
  console.log("Ex37 —", [...list]);
}
function ex38() {
  // toString and Symbol.toStringTag
  class Collection {
    get [Symbol.toStringTag]() { return "Collection"; }
  }
  const c = new Collection();
  console.log("Ex38 —", Object.prototype.toString.call(c));
}
function ex39() {
  // Immutable value object
  class Coordinate {
    #x; #y;
    constructor(x, y) { this.#x = x; this.#y = y; Object.freeze(this); }
    get x() { return this.#x; }
    get y() { return this.#y; }
    translate(dx, dy) { return new Coordinate(this.#x + dx, this.#y + dy); }
    toString() { return `(${this.#x},${this.#y})`; }
  }
  const p = new Coordinate(1, 2);
  const q = p.translate(3, 4);
  console.log("Ex39 —", String(p), String(q));
}
function ex40() {
  // Abstract factory via class
  class ButtonFactory {
    static create(type) {
      const types = { primary: PrimaryButton, secondary: SecondaryButton };
      const T = types[type];
      if (!T) throw new Error(`Unknown type: ${type}`);
      return new T();
    }
  }
  class PrimaryButton { render() { return "<button class='primary'>"; } }
  class SecondaryButton { render() { return "<button class='secondary'>"; } }
  console.log("Ex40 —", ButtonFactory.create("primary").render());
}
function ex41() {
  // Lazy singleton
  class Database {
    static #inst = null;
    #connected = false;
    connect() { this.#connected = true; return this; }
    static get instance() { return (Database.#inst ??= new Database().connect()); }
  }
  console.log("Ex41 — same instance:", Database.instance === Database.instance);
}
function ex42() {
  // Template method pattern
  class DataProcessor {
    process(data) { return this.transform(this.validate(data)); }
    validate(data) { return data; }
    transform(data) { throw new Error("implement transform"); }
  }
  class UpperCaseProcessor extends DataProcessor {
    transform(data) { return data.toUpperCase(); }
  }
  console.log("Ex42 —", new UpperCaseProcessor().process("hello"));
}
function ex43() {
  // Proxy-based reactive class
  function reactive(obj) {
    return new Proxy(obj, {
      set(t, k, v) { t[k] = v; console.log(`Ex43 — ${k} = ${v}`); return true; }
    });
  }
  class Model { constructor(d) { return reactive(Object.assign(this, d)); } }
  const m = new Model({ name: "Alice" });
  m.name = "Bob";
}
function ex44() {
  // Role-based class
  class User {
    #roles;
    constructor(name, roles) { this.name = name; this.#roles = new Set(roles); }
    can(action) { return this.#roles.has(action); }
    toString() { return `${this.name}[${[...this.#roles].join(",")}]`; }
  }
  const admin = new User("Alice", ["read", "write", "delete"]);
  console.log("Ex44 —", admin.can("delete"), admin.can("admin"), String(admin));
}
function ex45() {
  // Event-driven class
  class EventEmitter {
    #handlers = new Map();
    on(e, fn) { (this.#handlers.get(e) || this.#handlers.set(e, []).get(e)).push(fn); return this; }
    emit(e, ...args) { (this.#handlers.get(e) || []).forEach(fn => fn(...args)); return this; }
  }
  class Button extends EventEmitter {
    click() { this.emit("click", "Button was clicked"); return this; }
  }
  new Button().on("click", msg => console.log("Ex45 —", msg)).click();
}
function ex46() {
  // Class with generator method
  class NumberRange {
    constructor(s, e) { this.s = s; this.e = e; }
    *[Symbol.iterator]() { for (let i = this.s; i <= this.e; i++) yield i; }
  }
  console.log("Ex46 —", [...new NumberRange(1, 5)]);
}
function ex47() {
  // Branded class
  class UserId {
    #id;
    constructor(id) { if (typeof id !== "number") throw new TypeError("id must be a number"); this.#id = id; }
    equals(other) { return other instanceof UserId && other.#id === this.#id; }
    valueOf() { return this.#id; }
    toString() { return `UserId(${this.#id})`; }
  }
  const a = new UserId(1), b = new UserId(1), c = new UserId(2);
  console.log("Ex47 —", a.equals(b), a.equals(c), String(a));
}
function ex48() {
  // Class with async method
  class ApiClient {
    constructor(baseUrl) { this.baseUrl = baseUrl; }
    async fetch(path) { return `${this.baseUrl}${path}`; }
  }
  new ApiClient("https://api.example.com").fetch("/users").then(u => console.log("Ex48 —", u));
}
function ex49() {
  // Object.create with property descriptors
  const prototype = {
    greet() { return `Hi, I'm ${this.name}`; }
  };
  function createUser(name, age) {
    const user = Object.create(prototype, {
      name: { value: name, writable: true, enumerable: true },
      age: { value: age, writable: true, enumerable: true }
    });
    return user;
  }
  console.log("Ex49 —", createUser("Alice", 30).greet());
}
function ex50() {
  // Full class toolkit
  class Stack {
    #items = [];
    push(v) { this.#items.push(v); return this; }
    pop() { return this.#items.pop(); }
    peek() { return this.#items.at(-1); }
    get size() { return this.#items.length; }
    get isEmpty() { return this.#items.length === 0; }
    [Symbol.iterator]() { return this.#items[Symbol.iterator](); }
    toString() { return `Stack[${this.#items.join(",")}]`; }
  }
  const s = new Stack().push(1).push(2).push(3);
  console.log("Ex50 —", String(s), "peek:", s.peek(), "pop:", s.pop(), "size:", s.size);
}

function main() {
  console.log("=".repeat(60));
  console.log("Examples 2.3 — Prototypes & Classes");
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
