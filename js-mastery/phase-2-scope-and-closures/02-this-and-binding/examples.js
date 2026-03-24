// ============================================================================
// Examples 2.2 — This & Binding  (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================================

"use strict";

function ex01() {
  const obj = { name: "Alice", greet() { return `Hi, I'm ${this.name}`; } };
  console.log("Ex01 —", obj.greet());
}
function ex02() {
  function Person(name) { this.name = name; }
  const p = new Person("Bob");
  console.log("Ex02 —", p.name);
}
function ex03() {
  const obj = { x: 10 };
  function getX() { return this.x; }
  console.log("Ex03 — call:", getX.call(obj));
}
function ex04() {
  function sum(a, b) { return (this.base || 0) + a + b; }
  console.log("Ex04 — apply:", sum.apply({ base: 10 }, [3, 4]));
}
function ex05() {
  const obj = { x: 42 };
  function getX() { return this.x; }
  const bound = getX.bind(obj);
  console.log("Ex05 — bind:", bound());
}
function ex06() {
  const obj = {
    value: 0,
    add(n) { this.value += n; return this; },
    result() { return this.value; }
  };
  console.log("Ex06 — chain:", obj.add(5).add(3).result());
}
function ex07() {
  const timer = {
    count: 0,
    tick() { this.count++; return this; }
  };
  timer.tick().tick().tick();
  console.log("Ex07 — tick:", timer.count);
}
function ex08() {
  const outer = {
    name: "outer",
    inner: {
      name: "inner",
      greet() { return this.name; }
    }
  };
  console.log("Ex08 —", outer.inner.greet());
}
function ex09() {
  class Counter {
    #n = 0;
    inc() { this.#n++; return this; }
    get value() { return this.#n; }
  }
  console.log("Ex09 —", new Counter().inc().inc().value);
}
function ex10() {
  function greet() { return `Hello from ${this.name || "unknown"}`; }
  const alice = { name: "Alice" };
  const bob = { name: "Bob" };
  console.log("Ex10 —", greet.call(alice), greet.call(bob));
}
function ex11() {
  function f(a, b, c) { return this.x + a + b + c; }
  console.log("Ex11 — apply array:", f.apply({ x: 10 }, [1, 2, 3]));
}
function ex12() {
  function add(a, b) { return a + b; }
  const add5 = add.bind(null, 5); // partial via bind
  console.log("Ex12 — bind partial:", add5(3), add5(10));
}
function ex13() {
  const arr = { 0: "a", 1: "b", 2: "c", length: 3 };
  const result = Array.prototype.slice.call(arr);
  console.log("Ex13 — borrow slice:", result);
}
function ex14() {
  // Arrow function captures `this` from enclosing scope
  class Timer {
    constructor() { this.ticks = 0; }
    start() {
      const tick = () => { this.ticks++; }; // arrow — no own `this`
      tick(); tick(); tick();
    }
  }
  const t = new Timer();
  t.start();
  console.log("Ex14 — arrow this:", t.ticks);
}
function ex15() {
  // Arrow vs regular method — this loss problem
  const obj = {
    name: "Alice",
    regularGreet: function() { return `Hi ${this.name}`; },
    arrowGreet: () => `Hi ${undefined}` // arrow has no own this in object literal
  };
  console.log("Ex15 — regular:", obj.regularGreet());
}
function ex16() {
  function Person(name) {
    this.name = name;
    this.greet = () => `Hi, ${this.name}`; // arrow captures constructor's this
  }
  const p = new Person("Alice");
  const { greet } = p; // extracted — but still works because arrow captured this
  console.log("Ex16 — extracted arrow:", greet());
}
function ex17() {
  // bind for event-handler-like patterns
  class Button {
    constructor(label) { this.label = label; this.handleClick = this.handleClick.bind(this); }
    handleClick() { return `${this.label} clicked`; }
  }
  const btn = new Button("Submit");
  const handler = btn.handleClick; // extracted
  console.log("Ex17 — bound handler:", handler());
}
function ex18() {
  // Method borrowing — use Array methods on array-like
  function args() {
    return Array.from(arguments).map(x => x * 2);
  }
  console.log("Ex18 — borrowed map:", args(1, 2, 3, 4));
}
function ex19() {
  // call with null/undefined this (strict mode)
  function double(n) { return n * 2; }
  console.log("Ex19 — call null:", double.call(null, 21));
}
function ex20() {
  // Reflect.apply
  function sum(a, b) { return a + b; }
  console.log("Ex20 — Reflect.apply:", Reflect.apply(sum, null, [3, 4]));
}
function ex21() {
  // this in class static vs instance
  class Config {
    static defaultTimeout = 5000;
    constructor(t) { this.timeout = t; }
    describe() { return `timeout: ${this.timeout}`; }
  }
  console.log("Ex21 — static:", Config.defaultTimeout, "instance:", new Config(1000).describe());
}
function ex22() {
  // bind preserves original function name
  function greet() {}
  const bound = greet.bind({});
  console.log("Ex22 — bound name:", bound.name);
}
function ex23() {
  // call polyfill concept
  Function.prototype.myCall = function(ctx, ...args) {
    const sym = Symbol();
    ctx = ctx || globalThis;
    ctx[sym] = this;
    const result = ctx[sym](...args);
    delete ctx[sym];
    return result;
  };
  function getX() { return this.x; }
  console.log("Ex23 — myCall:", getX.myCall({ x: 99 }));
  delete Function.prototype.myCall;
}
function ex24() {
  // apply polyfill concept
  Function.prototype.myApply = function(ctx, args = []) {
    const sym = Symbol();
    ctx = ctx || globalThis;
    ctx[sym] = this;
    const result = ctx[sym](...args);
    delete ctx[sym];
    return result;
  };
  function sum(a, b) { return (this.n || 0) + a + b; }
  console.log("Ex24 — myApply:", sum.myApply({ n: 10 }, [3, 4]));
  delete Function.prototype.myApply;
}
function ex25() {
  // bind polyfill concept
  Function.prototype.myBind = function(ctx, ...preset) {
    const fn = this;
    return function(...args) { return fn.apply(ctx, [...preset, ...args]); };
  };
  const obj = { n: 5 };
  function add(a) { return this.n + a; }
  const addN = add.myBind(obj);
  console.log("Ex25 — myBind:", addN(10));
  delete Function.prototype.myBind;
}
function ex26() {
  // thisArg in Array methods
  const multiplier = { factor: 3 };
  const result = [1, 2, 3, 4].map(function(x) { return x * this.factor; }, multiplier);
  console.log("Ex26 — thisArg in map:", result);
}
function ex27() {
  // Fluent interface via `this` chaining
  class StringBuilder {
    #parts = [];
    append(s) { this.#parts.push(s); return this; }
    prepend(s) { this.#parts.unshift(s); return this; }
    toString() { return this.#parts.join(""); }
  }
  const s = new StringBuilder().append("World").prepend("Hello, ").append("!").toString();
  console.log("Ex27 —", s);
}
function ex28() {
  // Mixin via call
  function Serializable() {
    this.serialize = () => JSON.stringify(this);
  }
  function User(name) {
    this.name = name;
    Serializable.call(this);
  }
  const u = new User("Alice");
  console.log("Ex28 —", u.serialize());
}
function ex29() {
  // this in getter/setter
  class Temperature {
    #celsius;
    constructor(c) { this.#celsius = c; }
    get fahrenheit() { return this.#celsius * 9/5 + 32; }
    set fahrenheit(f) { this.#celsius = (f - 32) * 5/9; }
    get celsius() { return this.#celsius; }
  }
  const t = new Temperature(0);
  t.fahrenheit = 212;
  console.log("Ex29 — celsius:", t.celsius);
}
function ex30() {
  // Hard binding pattern
  function hardBind(fn, ctx) {
    return function() { return fn.apply(ctx, arguments); };
  }
  const obj = { v: 42 };
  const getV = hardBind(function() { return this.v; }, obj);
  console.log("Ex30 —", getV.call({ v: 0 })); // still 42
}
function ex31() {
  // new binding
  function Point(x, y) { this.x = x; this.y = y; }
  const p = new Point(3, 4);
  console.log("Ex31 — new:", p.x, p.y, p instanceof Point);
}
function ex32() {
  // Prototype method this
  function Animal(name) { this.name = name; }
  Animal.prototype.speak = function() { return `${this.name} speaks`; };
  const a = new Animal("Cat");
  console.log("Ex32 —", a.speak());
}
function ex33() {
  // super in class
  class Shape {
    constructor(color) { this.color = color; }
    describe() { return `${this.color} shape`; }
  }
  class Circle extends Shape {
    constructor(color, r) { super(color); this.radius = r; }
    describe() { return `${super.describe()}, radius ${this.radius}`; }
  }
  console.log("Ex33 —", new Circle("red", 5).describe());
}
function ex34() {
  // this priority: new > explicit > implicit > default
  function f() { return this && this.x; }
  const obj = { x: 42, f };
  console.log("Ex34 — implicit:", obj.f());
  console.log("Ex34 — explicit:", f.call({ x: 99 }));
}
function ex35() {
  // Arrow in class fields
  class EventHandler {
    name = "handler";
    handle = () => `handled by ${this.name}`;
  }
  const h = new EventHandler();
  const { handle } = h;
  console.log("Ex35 —", handle());
}
function ex36() {
  // Detached method problem and fix
  const obj = { val: 10, getVal() { return this.val; } };
  const { getVal } = obj;
  const fixed = getVal.bind(obj);
  console.log("Ex36 — fixed:", fixed());
}
function ex37() {
  // Function.prototype.toString
  function hello() { return "hi"; }
  console.log("Ex37 — fn.toString starts with 'function':", hello.toString().startsWith("function"));
}
function ex38() {
  // call with array-like: String methods borrowed
  const result = String.prototype.repeat.call("ab", 3);
  console.log("Ex38 — borrowed repeat:", result);
}
function ex39() {
  // bind + partial application
  function multiply(a, b, c) { return a * b * c; }
  const double = multiply.bind(null, 2);
  const quadruple = multiply.bind(null, 2, 2);
  console.log("Ex39 —", double(3, 4), quadruple(5));
}
function ex40() {
  // Proxy to trap `this`
  const handler = { get(target, key) { const val = target[key]; return typeof val === "function" ? val.bind(target) : val; } };
  const obj = { x: 5, getX() { return this.x; } };
  const p = new Proxy(obj, handler);
  const { getX } = p;
  console.log("Ex40 — proxy bound:", getX());
}
function ex41() {
  // Reflect.apply vs Function.call
  function add(a, b) { return (this.n || 0) + a + b; }
  console.log("Ex41 —", Reflect.apply(add, { n: 10 }, [3, 4]));
}
function ex42() {
  // thisArg in forEach
  const nums = [1, 2, 3];
  const results = [];
  nums.forEach(function(x) { results.push(x * this.factor); }, { factor: 10 });
  console.log("Ex42 —", results);
}
function ex43() {
  // Arrow function vs class method for callbacks
  class Timer {
    constructor() { this.elapsed = 0; }
    run(steps) { Array.from({length: steps}).forEach(() => this.elapsed++); }
  }
  const t = new Timer(); t.run(5);
  console.log("Ex43 —", t.elapsed);
}
function ex44() {
  // Getter with this in prototype
  const base = { _x: 0, get x() { return this._x; }, set x(v) { this._x = v; } };
  const derived = Object.create(base);
  derived.x = 42;
  console.log("Ex44 — inherited setter:", derived.x, "base._x:", base._x);
}
function ex45() {
  // Mixins with call
  const Flyable = (sup) => class extends sup { fly() { return `${this.name} flies`; } };
  const Swimmable = (sup) => class extends sup { swim() { return `${this.name} swims`; } };
  class Animal { constructor(n) { this.name = n; } }
  class Duck extends Flyable(Swimmable(Animal)) {}
  const d = new Duck("Donald");
  console.log("Ex45 —", d.fly(), d.swim());
}
function ex46() {
  // this in Symbol.toPrimitive
  const obj = {
    n: 42,
    [Symbol.toPrimitive](hint) {
      if (hint === "number") return this.n;
      if (hint === "string") return String(this.n);
      return this.n;
    }
  };
  console.log("Ex46 —", +obj, `${obj}`, obj + 1);
}
function ex47() {
  // new.target
  function Foo() {
    if (!new.target) throw new Error("must use new");
    this.x = 1;
  }
  const f = new Foo();
  console.log("Ex47 — new.target:", f.x);
}
function ex48() {
  // Class static this
  class Registry {
    static #instances = [];
    static add(name) { Registry.#instances.push(name); return this; }
    static count() { return Registry.#instances.length; }
  }
  Registry.add("a").add("b").add("c");
  console.log("Ex48 — count:", Registry.count());
}
function ex49() {
  // Object.create and this
  function createAnimal(name) {
    const animal = Object.create({
      speak() { return `${this.name} speaks`; }
    });
    animal.name = name;
    return animal;
  }
  console.log("Ex49 —", createAnimal("Cat").speak());
}
function ex50() {
  // Full this binding precedence demo
  function f() { return this?.tag || "global"; }
  const obj = { tag: "obj", f };
  console.log("Ex50 — default:", f.call(undefined));
  console.log("Ex50 — implicit:", obj.f());
  console.log("Ex50 — call:", f.call({ tag: "explicit" }));
  console.log("Ex50 — bind:", f.bind({ tag: "bound" })());
}

function main() {
  console.log("=".repeat(60));
  console.log("Examples 2.2 — This & Binding");
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
