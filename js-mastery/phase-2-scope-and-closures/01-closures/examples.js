// ============================================================================
// Examples 2.1 — Closures  (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================================

"use strict";

// ─── BASIC (1–13) ────────────────────────────────────────────────────────────

/** Simple closure returning inner value */
function ex01() {
  function outer() { const x = 10; return () => x; }
  console.log("Ex01 —", outer()());
}

/** Counter factory */
function ex02() {
  function makeCounter() { let n = 0; return { inc: () => ++n, get: () => n }; }
  const c = makeCounter();
  c.inc(); c.inc(); c.inc();
  console.log("Ex02 —", c.get());
}

/** Adder factory */
function ex03() {
  const makeAdder = n => x => x + n;
  const add10 = makeAdder(10);
  console.log("Ex03 —", add10(5), add10(20));
}

/** Multiplier factory */
function ex04() {
  const multiplier = n => x => x * n;
  const double = multiplier(2), triple = multiplier(3);
  console.log("Ex04 —", double(5), triple(5));
}

/** Greeting factory */
function ex05() {
  function greetWith(greeting) { return name => `${greeting}, ${name}!`; }
  const hello = greetWith("Hello"), hi = greetWith("Hi");
  console.log("Ex05 —", hello("Alice"), hi("Bob"));
}

/** Toggle factory */
function ex06() {
  function makeToggle(a, b) { let state = a; return () => (state = state === a ? b : a); }
  const toggle = makeToggle("on", "off");
  console.log("Ex06 —", toggle(), toggle(), toggle());
}

/** Once factory */
function ex07() {
  function once(fn) { let done = false, result; return (...a) => done ? result : (done = true, result = fn(...a)); }
  let n = 0;
  const init = once(() => ++n);
  init(); init(); init();
  console.log("Ex07 — called once:", n);
}

/** After(n) — only executes after n calls */
function ex08() {
  function after(n, fn) { let count = 0; return (...a) => ++count >= n ? fn(...a) : undefined; }
  const log3 = after(3, x => `fired: ${x}`);
  console.log("Ex08 —", log3(1), log3(2), log3(3));
}

/** Before(n) — only executes for the first n calls */
function ex09() {
  function before(n, fn) { let count = 0; return (...a) => count < n ? (count++, fn(...a)) : undefined; }
  const log2 = before(2, x => `called: ${x}`);
  console.log("Ex09 —", log2(1), log2(2), log2(3));
}

/** Accumulator */
function ex10() {
  function makeAccumulator(init = 0) {
    let total = init;
    return n => { total += n; return total; };
  }
  const acc = makeAccumulator();
  console.log("Ex10 —", acc(5), acc(3), acc(10));
}

/** Logger with prefix */
function ex11() {
  function makeLogger(prefix) { return msg => `[${prefix}] ${msg}`; }
  const info = makeLogger("INFO"), error = makeLogger("ERROR");
  console.log("Ex11 —", info("started"), error("failed"));
}

/** Flag holder */
function ex12() {
  function makeFlag(initial = false) {
    let flag = initial;
    return { set: () => { flag = true; }, clear: () => { flag = false; }, check: () => flag };
  }
  const f = makeFlag();
  f.set();
  console.log("Ex12 —", f.check());
  f.clear();
  console.log("Ex12 — cleared:", f.check());
}

/** Partial application via closure */
function ex13() {
  function partial(fn, ...a) { return (...b) => fn(...a, ...b); }
  const add = (x, y, z) => x + y + z;
  const add5 = partial(add, 5);
  console.log("Ex13 —", add5(3, 2));
}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────────────────────

/** Private counter with history */
function ex14() {
  function makeHistory() {
    let val = 0; const log = [];
    return {
      set(n) { log.push(val); val = n; return this; },
      undo() { if (log.length) val = log.pop(); return this; },
      get value() { return val; }
    };
  }
  const h = makeHistory();
  h.set(5).set(10).set(20).undo();
  console.log("Ex14 —", h.value);
}

/** Bank account */
function ex15() {
  function account(balance) {
    return {
      deposit: n => (balance += n, balance),
      withdraw: n => { if (n > balance) throw new Error("NSF"); return (balance -= n, balance); },
      get balance() { return balance; }
    };
  }
  const a = account(100);
  console.log("Ex15 —", a.deposit(50), a.withdraw(30));
}

/** Loop closure fix with let */
function ex16() {
  const fns = [];
  for (let i = 0; i < 5; i++) fns.push(() => i); // let creates new binding per iteration
  console.log("Ex16 — with let:", fns.map(f => f()));
}

/** Loop closure problem with var (for comparison) */
function ex17() {
  const fns = [];
  for (var i = 0; i < 5; i++) { const j = i; fns.push(() => j); }
  console.log("Ex17 — var + const capture:", fns.map(f => f()));
}

/** Memoize basic */
function ex18() {
  function memoize(fn) {
    const cache = new Map();
    return n => { if (!cache.has(n)) cache.set(n, fn(n)); return cache.get(n); };
  }
  let calls = 0;
  const sq = memoize(n => { calls++; return n * n; });
  sq(4); sq(4); sq(5); sq(4);
  console.log("Ex18 — calls:", calls); // 2
}

/** Module pattern with closure */
function ex19() {
  const Counter = (() => {
    let _count = 0;
    return {
      increment() { _count++; },
      decrement() { _count--; },
      get value() { return _count; }
    };
  })();
  Counter.increment(); Counter.increment(); Counter.decrement();
  console.log("Ex19 —", Counter.value);
}

/** Debounce using closure */
function ex20() {
  function debounce(fn, ms) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  }
  const db = debounce(x => console.log("debounced:", x), 100);
  console.log("Ex20 — debounce is function:", typeof db === "function");
}

/** Rate limiter using closure */
function ex21() {
  function rateLimit(fn, maxCalls) {
    let calls = 0;
    return (...args) => {
      if (calls >= maxCalls) return "rate limited";
      calls++;
      return fn(...args);
    };
  }
  const limited = rateLimit(x => x * 2, 3);
  console.log("Ex21 —", limited(1), limited(2), limited(3), limited(4));
}

/** Lazy value using closure */
function ex22() {
  function lazy(fn) { let computed = false, val; return () => { if (!computed) { val = fn(); computed = true; } return val; }; }
  let n = 0;
  const expensive = lazy(() => { n++; return 42; });
  console.log("Ex22 —", expensive(), expensive(), "n:", n);
}

/** Closure for environment capture */
function ex23() {
  function withConfig(config) {
    return {
      getTimeout: () => config.timeout,
      getHost: () => config.host,
    };
  }
  const svc = withConfig({ timeout: 5000, host: "localhost" });
  console.log("Ex23 —", svc.getTimeout(), svc.getHost());
}

/** Closure returning closure */
function ex24() {
  const multiply = a => b => c => a * b * c;
  console.log("Ex24 —", multiply(2)(3)(4));
}

/** Accumulate sum using reduce-like closure */
function ex25() {
  function sumStream() {
    let total = 0;
    const add = n => { total += n; return add; };
    add.valueOf = () => total;
    return add;
  }
  const s = sumStream();
  s(1)(2)(3)(4)(5);
  console.log("Ex25 — total:", +s);
}

/** Closure as event handler factory */
function ex26() {
  function makeHandler(action) {
    return event => `Handled '${event}' with action '${action}'`;
  }
  const onClick = makeHandler("navigate");
  console.log("Ex26 —", onClick("click"), onClick("keypress"));
}

// ─── NESTED (27–38) ──────────────────────────────────────────────────────────

/** Nested closures */
function ex27() {
  function outer(x) {
    return function middle(y) {
      return function inner(z) { return x + y + z; };
    };
  }
  console.log("Ex27 —", outer(1)(2)(3));
}

/** Closure composition */
function ex28() {
  const compose = (...fns) => x => fns.reduceRight((v, f) => f(v), x);
  const add1 = x => x + 1;
  const double = x => x * 2;
  const square = x => x * x;
  console.log("Ex28 —", compose(square, double, add1)(3));  // ((3+1)*2)^2 = 64
}

/** State machine via closure */
function ex29() {
  function trafficLight() {
    const states = { red: "green", green: "yellow", yellow: "red" };
    let current = "red";
    return {
      next() { current = states[current]; return this; },
      get state() { return current; }
    };
  }
  const light = trafficLight();
  light.next().next().next();
  console.log("Ex29 —", light.state); // back to red
}

/** Observer pattern via closure */
function ex30() {
  function makeObservable(initial) {
    let val = initial; const subs = [];
    return {
      subscribe: fn => { subs.push(fn); return () => subs.splice(subs.indexOf(fn), 1); },
      set(v) { const old = val; val = v; subs.forEach(fn => fn(v, old)); },
      get value() { return val; }
    };
  }
  const obs = makeObservable(0);
  const unsub = obs.subscribe((n, o) => console.log(`Ex30 — changed: ${o} → ${n}`));
  obs.set(5); obs.set(10);
  unsub();
  obs.set(99); // no log
}

/** Middleware chain via closure */
function ex31() {
  function pipeline(...fns) {
    return x => fns.reduce((v, f) => f(v), x);
  }
  const process = pipeline(
    x => x.trim(),
    x => x.toUpperCase(),
    x => `[${x}]`
  );
  console.log("Ex31 —", process("  hello  "));
}

/** Retry logic via closure */
function ex32() {
  function makeRetry(fn, maxTries) {
    return function(...args) {
      let tries = 0;
      while (tries < maxTries) {
        try { return fn(...args); } catch { tries++; }
      }
      throw new Error(`Failed after ${maxTries} tries`);
    };
  }
  let attempt = 0;
  const unreliable = () => { if (attempt++ < 2) throw new Error("fail"); return "ok"; };
  const safe = makeRetry(unreliable, 5);
  console.log("Ex32 —", safe());
}

/** Memoize with WeakMap (for objects) */
function ex33() {
  function memoizeWeak(fn) {
    const cache = new WeakMap();
    return obj => { if (!cache.has(obj)) cache.set(obj, fn(obj)); return cache.get(obj); };
  }
  const getName = memoizeWeak(o => o.name.toUpperCase());
  const u = { name: "alice" };
  console.log("Ex33 —", getName(u), getName(u));
}

/** Async semaphore via closure */
function ex34() {
  function semaphore(limit) {
    let running = 0;
    const queue = [];
    function next() {
      if (queue.length && running < limit) {
        running++;
        const { fn, resolve, reject } = queue.shift();
        Promise.resolve(fn()).then(resolve, reject).finally(() => { running--; next(); });
      }
    }
    return fn => new Promise((resolve, reject) => { queue.push({ fn, resolve, reject }); next(); });
  }
  const run = semaphore(2);
  Promise.all([
    run(() => Promise.resolve(1)),
    run(() => Promise.resolve(2)),
    run(() => Promise.resolve(3)),
  ]).then(r => console.log("Ex34 — semaphore results:", r));
}

/** Counter with per-key storage */
function ex35() {
  function makeMultiCounter() {
    const counts = {};
    return {
      inc(key) { counts[key] = (counts[key] || 0) + 1; return counts[key]; },
      get(key) { return counts[key] || 0; }
    };
  }
  const mc = makeMultiCounter();
  mc.inc("a"); mc.inc("a"); mc.inc("b");
  console.log("Ex35 — a:", mc.get("a"), "b:", mc.get("b"));
}

/** Event aggregator */
function ex36() {
  function makeEventBus() {
    const handlers = {};
    return {
      on(event, fn) { (handlers[event] = handlers[event] || []).push(fn); },
      emit(event, data) { (handlers[event] || []).forEach(fn => fn(data)); },
      off(event, fn) { handlers[event] = (handlers[event] || []).filter(f => f !== fn); }
    };
  }
  const bus = makeEventBus();
  bus.on("log", msg => console.log("Ex36 — event:", msg));
  bus.emit("log", "Hello from bus");
}

/** Scope chain visualization */
function ex37() {
  let a = 1;
  function outer() {
    let b = 2;
    function inner() {
      let c = 3;
      return a + b + c; // accesses all three scopes
    }
    return inner();
  }
  console.log("Ex37 — scope chain:", outer());
}

/** Closure-based private class alternative */
function ex38() {
  function createPerson(name, age) {
    let _name = name, _age = age;
    return {
      getName: () => _name,
      getAge: () => _age,
      birthday: () => { _age++; return _age; },
      toString: () => `${_name} (${_age})`
    };
  }
  const p = createPerson("Alice", 29);
  p.birthday(); p.birthday();
  console.log("Ex38 —", p.toString());
}

// ─── ADVANCED (39–50) ────────────────────────────────────────────────────────

/** Transducer via closures */
function ex39() {
  const map = fn => reducer => (acc, val) => reducer(acc, fn(val));
  const filter = pred => reducer => (acc, val) => pred(val) ? reducer(acc, val) : acc;
  const append = (acc, val) => [...acc, val];
  const xform = filter(x => x % 2 === 0)(map(x => x * 10)(append));
  console.log("Ex39 —", [1,2,3,4,5,6].reduce(xform, []));
}

/** Continuation passing style */
function ex40() {
  const addCPS = (a, b, k) => k(a + b);
  const mulCPS = (a, b, k) => k(a * b);
  addCPS(3, 4, sum => mulCPS(sum, 2, result => console.log("Ex40 — CPS:", result)));
}

/** Church numerals via closures */
function ex41() {
  const zero = f => x => x;
  const succ = n => f => x => f(n(f)(x));
  const toInt = n => n(x => x + 1)(0);
  const one = succ(zero), two = succ(one), three = succ(two);
  console.log("Ex41 — church:", toInt(three));
}

/** Y-combinator */
function ex42() {
  const Y = f => (x => f(v => x(x)(v)))(x => f(v => x(x)(v)));
  const fib = Y(self => n => n <= 1 ? n : self(n - 1) + self(n - 2));
  console.log("Ex42 — Y fib(8):", fib(8));
}

/** Monad-like Maybe via closure */
function ex43() {
  const Maybe = val => ({
    map: fn => val == null ? Maybe(null) : Maybe(fn(val)),
    getOrElse: def => val == null ? def : val,
    toString: () => val == null ? "Nothing" : `Just(${val})`
  });
  const result = Maybe(5).map(x => x * 2).map(x => x + 1).getOrElse(0);
  const empty = Maybe(null).map(x => x * 2).getOrElse(-1);
  console.log("Ex43 —", result, empty);
}

/** Reactive variable */
function ex44() {
  function signal(init) {
    let val = init; const subs = new Set();
    return {
      get() { return val; },
      set(v) { val = v; subs.forEach(fn => fn(v)); },
      subscribe(fn) { subs.add(fn); return () => subs.delete(fn); }
    };
  }
  const s = signal(0);
  s.subscribe(v => console.log("Ex44 — signal:", v));
  s.set(1); s.set(2);
}

/** Computed property */
function ex45() {
  function computed(deps, fn) {
    const subs = new Set();
    let cached;
    const recompute = () => { cached = fn(...deps.map(d => d.get())); subs.forEach(f => f(cached)); };
    deps.forEach(d => d.subscribe(recompute));
    recompute();
    return { get: () => cached, subscribe: fn => subs.add(fn) };
  }
  function signal(v) {
    let val = v; const subs = new Set();
    return { get: () => val, set: nv => { val = nv; subs.forEach(f => f(nv)); }, subscribe: f => subs.add(f) };
  }
  const a = signal(2), b = signal(3);
  const sum = computed([a, b], (x, y) => x + y);
  console.log("Ex45 — sum:", sum.get());
  a.set(10);
  console.log("Ex45 — after a=10:", sum.get());
}

/** Dependency tracker */
function ex46() {
  const deps = new Set();
  function track(fn) { return fn(); } // simplified
  function computed(fn) {
    const result = fn();
    return { value: result };
  }
  const x = { value: 5 };
  const doubled = computed(() => x.value * 2);
  console.log("Ex46 — computed:", doubled.value);
}

/** Closure-based event system */
function ex47() {
  function createEventEmitter() {
    const events = new Map();
    return {
      on(e, fn) { if (!events.has(e)) events.set(e, []); events.get(e).push(fn); return this; },
      emit(e, ...args) { (events.get(e) || []).forEach(fn => fn(...args)); return this; },
      once(e, fn) {
        const wrapper = (...args) => { fn(...args); this.off(e, wrapper); };
        return this.on(e, wrapper);
      },
      off(e, fn) { if (events.has(e)) events.set(e, events.get(e).filter(f => f !== fn)); return this; }
    };
  }
  const em = createEventEmitter();
  em.on("test", x => console.log("Ex47 — event:", x));
  em.emit("test", "hello");
}

/** Memoize recursive with closure */
function ex48() {
  function memoRec(fn) {
    const cache = {};
    const memoized = n => { if (!(n in cache)) cache[n] = fn(memoized)(n); return cache[n]; };
    return memoized;
  }
  const fib = memoRec(self => n => n <= 1 ? n : self(n-1) + self(n-2));
  console.log("Ex48 — memo fib(30):", fib(30));
}

/** Closure abuse detection */
function ex49() {
  // Common mistake: closing over mutable variable in async code
  const results = [];
  for (let i = 0; i < 5; i++) {
    results.push(((n) => () => n)(i)); // IIFE captures i correctly
  }
  console.log("Ex49 — captured:", results.map(f => f()));
}

/** Full closure toolkit */
function ex50() {
  const identity = x => x;
  const constant = x => () => x;
  const flip = fn => (a, b) => fn(b, a);
  const compose = (f, g) => x => f(g(x));
  const pipe = (f, g) => x => g(f(x));
  const memoize = fn => { const m = new Map(); return x => m.has(x) ? m.get(x) : (m.set(x, fn(x)), m.get(x)); };

  const double = x => x * 2;
  const addOne = x => x + 1;
  console.log("Ex50 —",
    identity(42),
    constant(99)(),
    flip((a,b) => a - b)(3, 10),
    compose(addOne, double)(5),
    pipe(double, addOne)(5),
    memoize(x => x * x)(7)
  );
}

function main() {
  console.log("=".repeat(60));
  console.log("Examples 2.1 — Closures");
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
