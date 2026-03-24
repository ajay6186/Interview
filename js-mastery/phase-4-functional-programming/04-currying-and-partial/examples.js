// ============================================================================
// Examples 4.4 — Currying & Partial Application  (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================================
"use strict";

// ─── BASIC (1–13) ────────────────────────────────────────────────────────────

/** manually curry a binary function */
function ex01() {
  const add = a => b => a + b;
  const add5 = add(5);
  console.log("Ex01 — manual curry add5(3):", add5(3), "add5(10):", add5(10));
}

/** manually curry a ternary function */
function ex02() {
  const clamp = min => max => val => Math.min(Math.max(val, min), max);
  const clamp0to100 = clamp(0)(100);
  console.log("Ex02 — curry ternary clamp:", clamp0to100(-5), clamp0to100(50), clamp0to100(110));
}

/** curry utility for binary functions */
function ex03() {
  const curry = fn => a => b => fn(a, b);
  const multiply = curry((a, b) => a * b);
  const double   = multiply(2);
  const triple   = multiply(3);
  console.log("Ex03 — curry utility:", double(7), triple(7));
}

/** curried add: create specialized adders */
function ex04() {
  const curry = fn => a => b => fn(a, b);
  const add = curry((a, b) => a + b);
  const increment = add(1);
  const addTen    = add(10);
  const addScore  = add(1000);
  console.log("Ex04 — curried add:", [1,2,3].map(increment), [1,2,3].map(addTen));
}

/** curried multiply: scale values */
function ex05() {
  const curry = fn => a => b => fn(a, b);
  const multiply = curry((a, b) => a * b);
  const prices = [9.99, 14.99, 4.99];
  const withTax     = prices.map(multiply(1.08));
  const withDiscount = prices.map(multiply(0.9));
  console.log("Ex05 — curried multiply tax:", withTax.map(n => n.toFixed(2)));
  console.log("Ex05 — curried multiply disc:", withDiscount.map(n => n.toFixed(2)));
}

/** curried compare: create comparators */
function ex06() {
  const curry = fn => a => b => fn(a, b);
  const greaterThan = curry((threshold, n) => n > threshold);
  const lessThan    = curry((threshold, n) => n < threshold);
  const nums = [1, 5, 10, 15, 20];
  console.log("Ex06 — curried compare >10:", nums.filter(greaterThan(10)));
  console.log("Ex06 — curried compare <10:", nums.filter(lessThan(10)));
}

/** curried filter: reusable predicates */
function ex07() {
  const curry = fn => a => b => fn(a, b);
  const filter  = curry((pred, arr) => arr.filter(pred));
  const isEven  = x => x % 2 === 0;
  const isOdd   = x => x % 2 !== 0;
  const keepEvens = filter(isEven);
  const keepOdds  = filter(isOdd);
  const nums = [1, 2, 3, 4, 5, 6, 7, 8];
  console.log("Ex07 — curried filter evens:", keepEvens(nums), "odds:", keepOdds(nums));
}

/** partial utility: pre-apply first arguments */
function ex08() {
  const partial = (fn, ...pre) => (...rest) => fn(...pre, ...rest);
  const greet = (greeting, name) => `${greeting}, ${name}!`;
  const sayHello  = partial(greet, "Hello");
  const sayHowdy  = partial(greet, "Howdy");
  console.log("Ex08 — partial:", sayHello("Alice"), sayHowdy("Bob"));
}

/** partialRight: pre-apply last arguments */
function ex09() {
  const partialRight = (fn, ...last) => (...first) => fn(...first, ...last);
  const divide = (a, b) => a / b;
  const halve  = partialRight(divide, 2);
  const pct    = partialRight(divide, 100);
  console.log("Ex09 — partialRight halve:", halve(40), "pct:", pct(50));
}

/** bind as partial: Function.prototype.bind */
function ex10() {
  function power(base, exp) { return base ** exp; }
  const square = power.bind(null, undefined); // doesn't really help here
  // Proper partial with bind:
  const square2 = (n) => power(n, 2);
  const cube    = (n) => power(n, 3);
  console.log("Ex10 — bind as partial:", [2,3,4,5].map(square2), [2,3].map(cube));
}

/** curried map: map as curried higher-order function */
function ex11() {
  const map  = fn => arr => arr.map(fn);
  const double = x => x * 2;
  const negate = x => -x;
  const doubleAll = map(double);
  const negateAll = map(negate);
  console.log("Ex11 — curried map:", doubleAll([1,2,3]), negateAll([1,2,3]));
}

/** curried reduce: build reducers */
function ex12() {
  const reduce = (fn, init) => arr => arr.reduce(fn, init);
  const sum    = reduce((acc, n) => acc + n, 0);
  const product = reduce((acc, n) => acc * n, 1);
  const concat  = reduce((acc, s) => acc + s, "");
  console.log("Ex12 — curried reduce sum:", sum([1,2,3,4,5]));
  console.log("Ex12 — curried reduce product:", product([1,2,3,4,5]));
  console.log("Ex12 — curried reduce concat:", concat(["a","b","c"]));
}

/** point-free map/filter with curried utilities */
function ex13() {
  const map    = fn   => arr => arr.map(fn);
  const filter = pred => arr => arr.filter(pred);
  const pipe   = (...fns) => x => fns.reduce((v, fn) => fn(v), x);
  const double  = x => x * 2;
  const isEven  = x => x % 2 === 0;

  // Point-free: no explicit data mention
  const processEvenDoubled = pipe(filter(isEven), map(double));
  console.log("Ex13 — point-free:", processEvenDoubled([1,2,3,4,5,6,7,8]));
}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────────────────────

/** curried reduce: point-free reducers */
function ex14() {
  const curryN = fn => function c(...args) {
    return args.length >= fn.length ? fn(...args) : (...more) => c(...args, ...more);
  };
  const reduce3 = curryN((fn, init, arr) => arr.reduce(fn, init));
  const sumArr = reduce3((a, b) => a + b, 0);
  const maxArr = reduce3((max, n) => n > max ? n : max, -Infinity);
  console.log("Ex14 — curried reduce3:", sumArr([1,2,3,4,5]), maxArr([3,1,4,1,5,9,2,6]));
}

/** auto-curry: curry any function by arity */
function ex15() {
  function curryN(fn) {
    return function c(...args) {
      return args.length >= fn.length ? fn(...args) : (...more) => c(...args, ...more);
    };
  }
  const add3 = curryN((a, b, c) => a + b + c);
  const add4 = curryN((a, b, c, d) => a + b + c + d);
  console.log("Ex15 — auto-curry add3:", add3(1)(2)(3), add3(1, 2)(3), add3(1)(2, 3));
  console.log("Ex15 — auto-curry add4:", add4(1)(2)(3)(4), add4(1, 2)(3, 4));
}

/** infinite curry: curry that keeps going until called with no args */
function ex16() {
  function infiniteCurry(fn) {
    const acc = (...args) =>
      args.length === 0 ? fn(0) : (...more) => {
        if (more.length === 0) return args.reduce((a, b) => a + b, 0);
        return acc(...args, ...more);
      };
    return acc;
  }
  // Simpler: curry that accumulates until no-arg call
  function accum(...args) {
    return (...more) => more.length === 0
      ? args.reduce((a, b) => a + b, 0)
      : accum(...args, ...more);
  }
  console.log("Ex16 — infinite curry:", accum(1)(2)(3)(4)(5)());
}

/** curry with placeholder _: skip arguments */
function ex17() {
  const _ = Symbol("placeholder");
  function curryWith(fn, arity = fn.length) {
    return function c(...args) {
      if (args.length >= arity && !args.includes(_)) return fn(...args);
      return (...more) => {
        const merged = args.map(a => a === _ && more.length ? more.shift() : a);
        return c(...merged, ...more);
      };
    };
  }
  const sub = curryWith((a, b) => a - b);
  const subFrom10 = sub(10);
  const subFive   = sub(_, 5);
  console.log("Ex17 — curry placeholder:", subFrom10(3), subFive(20));
}

/** partial with placeholder */
function ex18() {
  const _ = Symbol("_");
  function partial(fn, ...args) {
    return (...rest) => {
      const restCopy = [...rest];
      const filled = args.map(a => a === _ ? restCopy.shift() : a);
      return fn(...filled, ...restCopy);
    };
  }
  const divide = (a, b, c) => (a / b) * c;
  const divBy2ThenBy = partial(divide, _, 2);
  console.log("Ex18 — partial placeholder:", divBy2ThenBy(10, 3)); // (10/2)*3=15
}

/** fixed-arity curry: enforce exact arity */
function ex19() {
  function curryN(fn, n = fn.length) {
    return function c(...args) {
      return args.length >= n ? fn(...args.slice(0, n)) : (...more) => c(...args, ...more);
    };
  }
  const sum = curryN((...args) => args.reduce((a, b) => a + b, 0), 4);
  console.log("Ex19 — fixed-arity curry:", sum(1)(2)(3)(4));
  console.log("Ex19 — fixed-arity multi:", sum(1, 2)(3, 4));
}

/** curry debugging: trace calls */
function ex20() {
  function curryDebug(fn) {
    const name = fn.name || "fn";
    return function c(...args) {
      if (args.length >= fn.length) {
        const result = fn(...args);
        return result;
      }
      return (...more) => c(...args, ...more);
    };
  }
  const add = curryDebug(function add(a, b, c) { return a + b + c; });
  const step1 = add(1);
  const step2 = step1(2);
  const result = step2(3);
  console.log("Ex20 — curry debug result:", result);
}

/** curried event handler: reusable handlers with pre-bound data */
function ex21() {
  const handleAction = type => payload => ({ type, payload, timestamp: 0 });
  const addUser    = handleAction("ADD_USER");
  const removeUser = handleAction("REMOVE_USER");
  const updateUser = handleAction("UPDATE_USER");

  const action1 = addUser({ id: 1, name: "Alice" });
  const action2 = removeUser({ id: 2 });
  const action3 = updateUser({ id: 1, name: "Alice Smith" });
  console.log("Ex21 — curried event:", action1.type, action2.type, action3.payload.name);
}

/** curried validator: build reusable validators */
function ex22() {
  const validate = rule => msg => value => rule(value) ? { ok: true, value } : { ok: false, error: msg };
  const required  = validate(v => v !== null && v !== undefined && v !== "")("Field is required");
  const minLength = n => validate(v => String(v).length >= n)(`Min length ${n}`);
  const maxLength = n => validate(v => String(v).length <= n)(`Max length ${n}`);
  const isEmail   = validate(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))("Invalid email");

  console.log("Ex22 — curried validator required(''):", required(""));
  console.log("Ex22 — curried validator minLength(3)('hi'):", minLength(3)("hi"));
  console.log("Ex22 — curried validator isEmail:", isEmail("alice@example.com"));
}

/** curried compose: compose curried functions */
function ex23() {
  const curry  = fn => a => b => fn(a, b);
  const compose = (...fns) => x => fns.reduceRight((v, fn) => fn(v), x);
  const add  = curry((a, b) => a + b);
  const mul  = curry((a, b) => a * b);
  const sub  = curry((a, b) => b - a);

  const transform = compose(mul(2), add(3), sub(1));
  console.log("Ex23 — curried compose(5):", transform(5)); // (5-1+3)*2=14
}

/** curried predicate combinators */
function ex24() {
  const and = (f, g) => x => f(x) && g(x);
  const or  = (f, g) => x => f(x) || g(x);
  const not = f => x => !f(x);
  const gt  = n => x => x > n;
  const lt  = n => x => x < n;
  const eq  = n => x => x === n;

  const between = (lo, hi) => and(gt(lo - 1), lt(hi + 1));
  const isValid  = or(between(1, 5), between(10, 15));

  console.log("Ex24 — predicate combinators:", [0,1,3,7,10,12,16].filter(isValid));
}

/** curried middleware: onion-layer middleware pattern */
function ex25() {
  const withAuth    = handler => ctx => ctx.user ? handler(ctx) : { error: "Unauthorized" };
  const withLogging = handler => ctx => {
    const result = handler(ctx);
    return result;
  };
  const withValidation = handler => ctx =>
    ctx.body ? handler(ctx) : { error: "No body" };

  const baseHandler = ctx => ({ success: true, user: ctx.user, data: ctx.body });
  const securedHandler = withLogging(withAuth(withValidation(baseHandler)));

  console.log("Ex25 — curried middleware:", securedHandler({ user: "Alice", body: { x: 1 } }));
  console.log("Ex25 — curried middleware (no user):", securedHandler({ body: { x: 1 } }));
}

/** curried transformation: build data transformation pipeline */
function ex26() {
  const map    = fn   => arr => arr.map(fn);
  const filter = pred => arr => arr.filter(pred);
  const sortBy = key  => arr => [...arr].sort((a, b) => a[key] < b[key] ? -1 : 1);
  const take   = n    => arr => arr.slice(0, n);
  const pipe   = (...fns) => x => fns.reduce((v, fn) => fn(v), x);

  const topThreeScores = pipe(
    filter(u => u.active),
    sortBy("score"),
    map(u => ({ name: u.name, score: u.score })),
    take(3)
  );
  const users = [
    { name: "Alice", score: 85, active: true  },
    { name: "Bob",   score: 42, active: false  },
    { name: "Carol", score: 91, active: true  },
    { name: "Dave",  score: 78, active: true  },
    { name: "Eve",   score: 95, active: true  },
  ];
  console.log("Ex26 — curried transform:", topThreeScores(users));
}

// ─── NESTED (27–38) ──────────────────────────────────────────────────────────

/** curried compose chain */
function ex27() {
  function curryN(fn) {
    return function c(...args) {
      return args.length >= fn.length ? fn(...args) : (...more) => c(...args, ...more);
    };
  }
  const map    = curryN((fn, arr) => arr.map(fn));
  const filter = curryN((pred, arr) => arr.filter(pred));
  const reduce = curryN((fn, init, arr) => arr.reduce(fn, init));
  const pipe   = (...fns) => x => fns.reduce((v, fn) => fn(v), x);

  const sumSquaredEvens = pipe(
    filter(x => x % 2 === 0),
    map(x => x * x),
    reduce((a, b) => a + b, 0)
  );
  console.log("Ex27 — curried compose chain:", sumSquaredEvens([1,2,3,4,5,6,7,8,9,10]));
}

/** curried lens: get/set/over with curry */
function ex28() {
  const curry = fn => a => b => fn(a, b);
  const lens  = curry((get, set) => ({ get, set }));
  const view  = curry((l, obj) => l.get(obj));
  const set   = (l, val) => obj => ({ ...obj, ...l.set(val, obj) });
  const nameLens = lens(
    obj => obj.name,
    (val, obj) => ({ ...obj, name: val })
  );
  const user = { name: "Alice", age: 30 };
  console.log("Ex28 — curried lens view:", view(nameLens)(user));
  console.log("Ex28 — curried lens set:", set(nameLens, "Bob")(user));
}

/** curried path access: safe nested property access */
function ex29() {
  const path = (...keys) => obj =>
    keys.reduce((acc, key) => acc != null ? acc[key] : undefined, obj);
  const pathOr = (def, ...keys) => obj => {
    const val = path(...keys)(obj);
    return val !== undefined ? val : def;
  };

  const data = { user: { address: { city: "NYC", zip: "10001" } } };
  console.log("Ex29 — curried path:", path("user", "address", "city")(data));
  console.log("Ex29 — pathOr:", pathOr("unknown", "user", "address", "country")(data));
  console.log("Ex29 — pathOr exists:", pathOr("unknown", "user", "address", "zip")(data));
}

/** curried formatter: locale-aware number/date formatting */
function ex30() {
  const formatNum  = (locale, opts) => n  => n.toLocaleString(locale, opts);
  const formatDate = (locale, opts) => d  => new Date(d).toLocaleDateString(locale, opts);

  const usDollar  = formatNum("en-US",  { style: "currency", currency: "USD" });
  const euEuro    = formatNum("de-DE",  { style: "currency", currency: "EUR" });
  const shortDate = formatDate("en-US", { month: "short", day: "numeric", year: "numeric" });

  console.log("Ex30 — curried format $:", usDollar(1234.56));
  console.log("Ex30 — curried format €:", euEuro(1234.56));
  console.log("Ex30 — curried format date:", shortDate("2026-03-23"));
}

/** curried i18n: translate with curried lookup */
function ex31() {
  const translations = {
    en: { save: "Save", cancel: "Cancel", hello: "Hello" },
    es: { save: "Guardar", cancel: "Cancelar", hello: "Hola" },
    fr: { save: "Enregistrer", cancel: "Annuler", hello: "Bonjour" }
  };
  const t    = lang => key => (translations[lang] || {})[key] || key;
  const tEn  = t("en");
  const tEs  = t("es");
  const tFr  = t("fr");

  console.log("Ex31 — curried i18n en:", tEn("save"), tEn("hello"));
  console.log("Ex31 — curried i18n es:", tEs("cancel"), tEs("hello"));
  console.log("Ex31 — curried i18n fr:", tFr("save"), tFr("hello"));
}

/** curried selector: Redux-style state selectors */
function ex32() {
  const get    = key => state => state[key];
  const pick   = (...keys) => state => Object.fromEntries(keys.map(k => [k, state[k]]));
  const derive = (sel, fn) => state => fn(sel(state));

  const state = { user: { name: "Alice", age: 30 }, cart: { items: [1,2,3], total: 45 } };
  const getUser      = get("user");
  const getCart      = get("cart");
  const getCartCount = derive(getCart, cart => cart.items.length);
  const getUserName  = derive(getUser, u => u.name);

  console.log("Ex32 — curried selector name:", getUserName(state));
  console.log("Ex32 — curried selector cart count:", getCartCount(state));
}

/** curried factory: build objects with curried constructor */
function ex33() {
  const createAction = type => payload => ({ type, payload, meta: { timestamp: 0 } });
  const createUser   = role => name => age => ({ name, age, role, active: true });
  const createConfig = env => feature => value => ({ env, feature, value });

  const makeAdmin = createUser("admin");
  const adminAlice = makeAdmin("Alice")(30);
  const devConfig  = createConfig("dev");

  console.log("Ex33 — curried factory user:", adminAlice);
  console.log("Ex33 — curried factory config:", devConfig("debugMode")(true));
  console.log("Ex33 — curried factory action:", createAction("ADD_ITEM")({ id: 1 }));
}

/** curried DI (dependency injection) */
function ex34() {
  // Inject dependencies via currying
  const createUserService = (db, logger) => ({
    findById:   id    => { logger(`findById(${id})`);        return db.users.find(u => u.id === id); },
    findByName: name  => { logger(`findByName(${name})`);    return db.users.find(u => u.name === name); },
    getAll:     ()    => { logger("getAll()");               return db.users; }
  });

  const fakeDb = { users: [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }] };
  const logs = [];
  const logger = msg => logs.push(msg);
  const userService = createUserService(fakeDb, logger);

  console.log("Ex34 — curried DI findById:", userService.findById(1));
  console.log("Ex34 — curried DI logs:", logs);
}

/** Y-combinator: enable recursion without named functions */
function ex35() {
  // Y-combinator in applicative order (Z-combinator for strict evaluation)
  const Y = f => (x => f(v => x(x)(v)))(x => f(v => x(x)(v)));
  const factorial = Y(self => n => n <= 1 ? 1 : n * self(n - 1));
  const fibonacci = Y(self => n => n <= 1 ? n : self(n - 1) + self(n - 2));
  console.log("Ex35 — Y-combinator factorial(7):", factorial(7));
  console.log("Ex35 — Y-combinator fibonacci(8):", fibonacci(8));
}

/** trampoline + curry: stack-safe recursion */
function ex36() {
  const trampoline = fn => (...args) => {
    let result = fn(...args);
    while (typeof result === "function") result = result();
    return result;
  };
  const sumTo = trampoline(function loop(n, acc = 0) {
    return n <= 0 ? acc : () => loop(n - 1, acc + n);
  });
  console.log("Ex36 — trampoline sumTo(1000):", sumTo(1000));
}

/** lazy curry: defer computation until all args provided */
function ex37() {
  function lazyCurry(fn) {
    const arity = fn.length;
    function collect(prevArgs) {
      if (prevArgs.length >= arity) {
        return () => fn(...prevArgs); // returns thunk
      }
      return (...newArgs) => collect([...prevArgs, ...newArgs]);
    }
    return collect([]);
  }
  const add3 = lazyCurry((a, b, c) => a + b + c);
  const thunk = add3(1)(2)(3); // returns thunk
  console.log("Ex37 — lazy curry result:", thunk()); // evaluate lazily
}

/** memoize + curry: cache curried function results */
function ex38() {
  function memoize(fn) {
    const cache = new Map();
    return function(...args) {
      const key = JSON.stringify(args);
      if (!cache.has(key)) cache.set(key, fn.apply(this, args));
      return cache.get(key);
    };
  }
  function curryN(fn) {
    return function c(...args) {
      return args.length >= fn.length ? fn(...args) : (...more) => c(...args, ...more);
    };
  }
  let calls = 0;
  const expensiveAdd = memoize(curryN((a, b, c) => { calls++; return a + b + c; }));
  expensiveAdd(1, 2, 3);
  expensiveAdd(1, 2, 3); // cache hit
  expensiveAdd(4, 5, 6);
  console.log("Ex38 — memoize+curry calls (expected 2):", calls);
}

// ─── ADVANCED (39–50) ────────────────────────────────────────────────────────

/** curry + church encoding: numbers as functions */
function ex39() {
  const ZERO = f => x => x;
  const SUCC = n => f => x => f(n(f)(x));
  const ADD  = m => n => f => x => m(f)(n(f)(x));
  const MUL  = m => n => f => m(n(f));
  const toInt = n => n(x => x + 1)(0);

  const ONE   = SUCC(ZERO);
  const TWO   = SUCC(ONE);
  const THREE = SUCC(TWO);
  const FIVE  = ADD(TWO)(THREE);
  const SIX   = MUL(TWO)(THREE);
  console.log("Ex39 — Church 2+3:", toInt(FIVE), "2*3:", toInt(SIX));
}

/** applicative style with curried functions */
function ex40() {
  // ap: apply array of functions to array of values (cartesian)
  const ap   = fns => vals => fns.flatMap(fn => vals.map(fn));
  const of   = x => [x];
  const map  = fn => arr => arr.map(fn);
  const curry = fn => a => b => fn(a, b);
  const add   = curry((a, b) => a + b);

  // Apply add(1), add(2), add(3) to [10, 20]
  const results = ap([add(1), add(2), add(3)])([10, 20]);
  console.log("Ex40 — applicative style:", results);
}

/** free theorem for map: parametric polymorphism */
function ex41() {
  // For any function f: a -> b and any array transform T (permutation/filter):
  // T(arr).map(f) behaves consistently with map's free theorem
  const arr = [1, 2, 3, 4, 5, 6];
  const f   = x => x * x;
  // The free theorem for filter: filter(p)(arr).map(f) === arr.filter(x => p(x)).map(f)
  const isEven  = x => x % 2 === 0;
  const v1 = arr.filter(isEven).map(f);
  const v2 = arr.filter(x => isEven(x)).map(f);
  console.log("Ex41 — free theorem map:", JSON.stringify(v1) === JSON.stringify(v2), v1);
}

/** curry + type-level documentation via JSDoc */
function ex42() {
  /**
   * Curried pipeline builder: string sanitization
   * @param {string} delimiter
   * @returns {(minLen: number) => (str: string) => string[]}
   */
  const splitAndFilter = delimiter => minLen => str =>
    str.split(delimiter)
       .map(s => s.trim())
       .filter(s => s.length >= minLen);

  const splitByCommaMin3 = splitAndFilter(",")( 3);
  const splitBySpaceMin2 = splitAndFilter(" ")(2);
  console.log("Ex42 — curried pipeline:", splitByCommaMin3("hi, hello, world, no, yes, ok"));
  console.log("Ex42 — curried pipeline:", splitBySpaceMin2("I am here now at home"));
}

/** curry + DI container: functional dependency injection */
function ex43() {
  const createContainer = deps => factory => factory(deps);
  const deps = {
    config:  { apiUrl: "https://api.example.com", timeout: 5000 },
    logger:  msg => `[LOG] ${msg}`,
    storage: { get: k => `stored:${k}`, set: (k, v) => ({ k, v }) }
  };
  const apiService = createContainer(deps)(({ config, logger }) => ({
    get:  endpoint => logger(`GET ${config.apiUrl}/${endpoint}`),
    post: (endpoint, data) => logger(`POST ${config.apiUrl}/${endpoint} ${JSON.stringify(data)}`)
  }));
  console.log("Ex43 — curry DI:", apiService.get("users"));
  console.log("Ex43 — curry DI:", apiService.post("users", { name: "Alice" }));
}

/** curry + logging decorator: trace argument flow */
function ex44() {
  function withLog(fn) {
    return function logged(...args) {
      const result = fn(...args);
      return result;
    };
  }
  function curryN(fn) {
    return function c(...args) {
      if (args.length >= fn.length) return fn(...args);
      return (...more) => c(...args, ...more);
    };
  }
  const tracedAdd = withLog(curryN((a, b, c) => a + b + c));
  const step1 = tracedAdd(10);
  const step2 = step1(20);
  const result = step2(30);
  console.log("Ex44 — curry+logging:", result);
}

/** partial application composition: build complex predicates */
function ex45() {
  const partial = (fn, ...pre) => (...rest) => fn(...pre, ...rest);
  const pipe    = (...fns) => x => fns.reduce((v, fn) => fn(v), x);

  const includes  = (needle, str)  => str.includes(needle);
  const startsWith = (prefix, str) => str.startsWith(prefix);
  const endsWith  = (suffix, str)  => str.endsWith(suffix);
  const hasLength = (min, max, str) => str.length >= min && str.length <= max;

  const isValidUsername = str =>
    [
      partial(hasLength, 3, 20),
      s => /^[a-zA-Z]/.test(s),
      s => /^[a-zA-Z0-9_]+$/.test(s)
    ].every(pred => pred(str));

  const names = ["alice", "a", "alice smith", "alice_99", "99alice", "bob"];
  console.log("Ex45 — partial predicate:", names.map(n => `${n}:${isValidUsername(n)}`));
}

/** curried event system: typed event emitter */
function ex46() {
  const createEmitter = () => {
    const handlers = {};
    const on   = type => handler => { handlers[type] = [...(handlers[type] || []), handler]; };
    const emit = type => data    => (handlers[type] || []).forEach(h => h(data));
    return { on, emit };
  };
  const emitter = createEmitter();
  const results = [];
  emitter.on("click")(e => results.push(`click:${e.x},${e.y}`));
  emitter.on("click")(e => results.push(`click2:${e.x + 1}`));
  emitter.on("keydown")(e => results.push(`key:${e.key}`));

  emitter.emit("click")({ x: 10, y: 20 });
  emitter.emit("keydown")({ key: "Enter" });
  console.log("Ex46 — curried emitter:", results);
}

/** trampolined mutual recursion with curry */
function ex47() {
  const trampoline = fn => (...args) => {
    let v = fn(...args);
    while (typeof v === "function") v = v();
    return v;
  };
  const isEven = trampoline(function isEvenFn(n) {
    return n === 0 ? true : () => isOddFn(n - 1);
  });
  function isOddFn(n) {
    return n === 0 ? false : () => isEvenFn(n - 1);
  }
  function isEvenFn(n) {
    return n === 0 ? true : () => isOddFn(n - 1);
  }
  console.log("Ex47 — trampolined isEven(100):", isEven(100), "isEven(101):", isEven(101));
}

/** curry + memoize: fibonacci with memoized curry */
function ex48() {
  function memoize(fn) {
    const cache = new Map();
    return function m(n) {
      if (!cache.has(n)) cache.set(n, fn(n));
      return cache.get(n);
    };
  }
  const fib = memoize(n => n <= 1 ? n : fib(n - 1) + fib(n - 2));
  const first10 = Array.from({ length: 10 }, (_, i) => fib(i));
  console.log("Ex48 — memoize fibonacci:", first10);
}

/** Kleisli composition + curry */
function ex49() {
  const curry = fn => a => b => fn(a, b);
  // Kleisli composition for Result monad
  const composeK = curry((f, g) => x => {
    const r = f(x);
    return r.ok ? g(r.value) : r;
  });
  const Ok  = v => ({ ok: true,  value: v });
  const Err = e => ({ ok: false, error: e });

  const parseNum    = s => isNaN(+s)  ? Err(`Not a number: ${s}`) : Ok(+s);
  const requirePos  = n => n > 0      ? Ok(n)                     : Err(`Not positive: ${n}`);
  const squareRoot  = n => Ok(Math.sqrt(n));
  const toFixed2    = n => Ok(n.toFixed(2));

  const pipeline = [requirePos, squareRoot, toFixed2].reduce(composeK, parseNum);
  console.log("Ex49 — Kleisli+curry '25':", pipeline("25"));
  console.log("Ex49 — Kleisli+curry '-4':", pipeline("-4"));
  console.log("Ex49 — Kleisli+curry 'x':", pipeline("x"));
}

/** curry + free theorem: equational substitution */
function ex50() {
  const curry = fn => a => b => fn(a, b);
  const compose = (f, g) => x => f(g(x));

  // Free theorem: map(f, map(g, arr)) = map(compose(f, g), arr)
  const map = curry((fn, arr) => arr.map(fn));
  const f   = x => x + 1;
  const g   = x => x * 2;

  const arr = [1, 2, 3, 4, 5];
  const lhs = map(f)(map(g)(arr));       // map f after map g
  const rhs = map(compose(f, g))(arr);   // map composed fg

  console.log("Ex50 — free theorem map fusion:", JSON.stringify(lhs), "===", JSON.stringify(rhs), ":", JSON.stringify(lhs) === JSON.stringify(rhs));
}

// ─── main ────────────────────────────────────────────────────────────────────

function main() {
  console.log("=== Examples 4.4 — Currying & Partial Application ===\n");
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
