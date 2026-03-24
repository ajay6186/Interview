// ============================================================================
// Examples 4.3 — Composition & Pipe  (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================================
"use strict";

// ─── BASIC (1–13) ────────────────────────────────────────────────────────────

/** compose two functions: f(g(x)) */
function ex01() {
  const compose = (f, g) => x => f(g(x));
  const double  = x => x * 2;
  const addOne  = x => x + 1;
  const doubleThenAdd = compose(addOne, double);
  console.log("Ex01 — compose addOne(double(5)):", doubleThenAdd(5)); // 11
}

/** pipe two functions: g(f(x)) — left to right */
function ex02() {
  const pipe = (f, g) => x => g(f(x));
  const trim  = s => s.trim();
  const upper = s => s.toUpperCase();
  const cleanUpper = pipe(trim, upper);
  console.log("Ex02 — pipe trim→upper:", cleanUpper("  hello  "));
}

/** identity function: compose with identity is identity */
function ex03() {
  const identity = x => x;
  const double   = x => x * 2;
  const compose  = (f, g) => x => f(g(x));
  const same     = compose(identity, double);
  console.log("Ex03 — identity compose:", same(7), "=== double(7):", double(7));
}

/** constant function: always returns same value */
function ex04() {
  const constant = val => () => val;
  const alwaysZero = constant(0);
  const alwaysHi   = constant("hi");
  console.log("Ex04 — constant:", alwaysZero(), alwaysZero(99), alwaysHi(), alwaysHi("ignored"));
}

/** flip: reverse argument order of binary function */
function ex05() {
  const flip = fn => (a, b) => fn(b, a);
  const sub  = (a, b) => a - b;
  const flipped = flip(sub);
  console.log("Ex05 — flip sub(10,3):", sub(10, 3), "flipped(10,3):", flipped(10, 3));
}

/** always (alias for constant): return first arg regardless */
function ex06() {
  const always = val => _ => val;
  const arr = [1, 2, 3, 4, 5];
  const allSeven = arr.map(always(7));
  console.log("Ex06 — always:", allSeven);
}

/** tap: perform side effect and return original value */
function ex07() {
  const tap = fn => x => { fn(x); return x; };
  const pipe = (...fns) => x => fns.reduce((v, fn) => fn(v), x);
  const result = pipe(
    x => x * 2,
    tap(x => { /* side effect: logging */ }),
    x => x + 1
  )(5);
  console.log("Ex07 — tap result (11):", result);
}

/** trace: log intermediate value in a pipeline */
function ex08() {
  const trace = label => x => { console.log(`Ex08 — trace [${label}]:`, x); return x; };
  const pipe = (...fns) => x => fns.reduce((v, fn) => fn(v), x);
  pipe(
    x => x * 3,
    trace("after *3"),
    x => x - 1,
    trace("after -1")
  )(4);
}

/** compose arrow functions inline */
function ex09() {
  const compose = (f, g) => x => f(g(x));
  const transform = compose(
    arr => arr.join(", "),
    arr => arr.filter(x => x > 0)
  );
  console.log("Ex09 — compose arrow:", transform([-1, 2, -3, 4, 5]));
}

/** pipe string transformations */
function ex10() {
  const pipe = (...fns) => x => fns.reduce((v, fn) => fn(v), x);
  const slugify = pipe(
    s => s.trim(),
    s => s.toLowerCase(),
    s => s.replace(/[^a-z0-9\s-]/g, ""),
    s => s.replace(/\s+/g, "-"),
    s => s.replace(/-+/g, "-")
  );
  console.log("Ex10 — slugify:", slugify("  Hello, World! (2026)  "));
}

/** compose with arity-1 arrow functions */
function ex11() {
  const double  = x => x * 2;
  const square  = x => x * x;
  const negate  = x => -x;
  const compose = (...fns) => x => fns.reduceRight((v, fn) => fn(v), x);
  const f = compose(negate, square, double); // negate(square(double(x)))
  console.log("Ex11 — compose negate(square(double(3))):", f(3)); // negate(square(6)) = negate(36) = -36
}

/** pipe with array operations */
function ex12() {
  const pipe = (...fns) => x => fns.reduce((v, fn) => fn(v), x);
  const process = pipe(
    arr => arr.filter(x => x % 2 === 0),
    arr => arr.map(x => x * x),
    arr => arr.reduce((sum, x) => sum + x, 0)
  );
  console.log("Ex12 — pipe array ops on [1..10]:", process([1,2,3,4,5,6,7,8,9,10]));
}

/** compose boolean predicates */
function ex13() {
  const compose = (f, g) => x => f(g(x));
  const not = fn => x => !fn(x);
  const isEven = x => x % 2 === 0;
  const isOdd = not(isEven);
  const isPositive = x => x > 0;
  const and = (f, g) => x => f(x) && g(x);
  const isPositiveOdd = and(isPositive, isOdd);
  console.log("Ex13 — predicate compose:", [-3,-2,-1,0,1,2,3].filter(isPositiveOdd));
}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────────────────────

/** composeN: right-to-left N-function composition */
function ex14() {
  const composeN = (...fns) => x => fns.reduceRight((acc, fn) => fn(acc), x);
  const trim    = s => s.trim();
  const upper   = s => s.toUpperCase();
  const exclaim = s => s + "!";
  const wrap    = s => `<<${s}>>`;
  const transform = composeN(wrap, exclaim, upper, trim); // right-to-left
  console.log("Ex14 — composeN:", transform("  hello world  "));
}

/** pipeN: left-to-right N-function composition */
function ex15() {
  const pipeN = (...fns) => x => fns.reduce((acc, fn) => fn(acc), x);
  const parse    = s => parseInt(s, 10);
  const double   = n => n * 2;
  const toString = n => `Result: ${n}`;
  const transform = pipeN(parse, double, toString);
  console.log("Ex15 — pipeN:", transform("21"));
}

/** point-free style: define functions without mentioning arguments */
function ex16() {
  const pipeN = (...fns) => x => fns.reduce((acc, fn) => fn(acc), x);
  const map    = fn => arr => arr.map(fn);
  const filter = pred => arr => arr.filter(pred);
  const reduce = (fn, init) => arr => arr.reduce(fn, init);

  const sumOfSquaredEvens = pipeN(
    filter(x => x % 2 === 0),
    map(x => x * x),
    reduce((a, b) => a + b, 0)
  );
  console.log("Ex16 — point-free:", sumOfSquaredEvens([1,2,3,4,5,6,7,8]));
}

/** partial + pipe: partial application combined with pipe */
function ex17() {
  const partial = (fn, ...args) => (...rest) => fn(...args, ...rest);
  const pipeN   = (...fns) => x => fns.reduce((acc, fn) => fn(acc), x);
  const multiply = (factor, x) => x * factor;
  const add      = (n, x) => x + n;
  const transform = pipeN(
    partial(multiply, 3),
    partial(add, 10),
    partial(multiply, 2)
  );
  console.log("Ex17 — partial+pipe transform(5):", transform(5)); // (5*3+10)*2 = 50
}

/** curry + compose: point-free with curried functions */
function ex18() {
  const curry = fn => a => b => fn(a, b);
  const compose = (...fns) => x => fns.reduceRight((acc, fn) => fn(acc), x);
  const add      = curry((a, b) => a + b);
  const multiply = curry((a, b) => a * b);
  const sub      = curry((a, b) => b - a); // note: b - a for point-free use

  const transform = compose(multiply(2), add(3), sub(1)); // (x-1+3)*2
  console.log("Ex18 — curry+compose transform(10):", transform(10)); // (10-1+3)*2=24
}

/** async pipe: left-to-right async composition */
async function ex19() {
  const asyncPipe = (...fns) => async x => {
    let result = x;
    for (const fn of fns) result = await fn(result);
    return result;
  };
  const delay = ms => val => new Promise(res => setTimeout(() => res(val), ms));
  const double = async x => x * 2;
  const addOne = async x => x + 1;
  const process = asyncPipe(double, delay(0), addOne);
  const result = await process(5);
  console.log("Ex19 — asyncPipe:", result);
}

/** memoize in pipe: cache expensive steps */
function ex20() {
  const memoize = fn => {
    const cache = new Map();
    return x => {
      if (!cache.has(x)) cache.set(x, fn(x));
      return cache.get(x);
    };
  };
  const pipeN = (...fns) => x => fns.reduce((acc, fn) => fn(acc), x);
  let calls = 0;
  const expensiveDouble = memoize(x => { calls++; return x * 2; });
  const process = pipeN(expensiveDouble, x => x + 1);
  process(5); process(5); process(6);
  console.log("Ex20 — memoize in pipe calls (expected 2):", calls);
}

/** Either in pipe: short-circuit on failure */
function ex21() {
  const Right = v => ({ ok: true,  value: v });
  const Left  = e => ({ ok: false, error: e });
  const pipeEither = (...fns) => x =>
    fns.reduce((acc, fn) => acc.ok ? fn(acc.value) : acc, Right(x));

  const parseNum    = s => isNaN(Number(s)) ? Left(`Not a number: "${s}"`) : Right(Number(s));
  const requirePos  = n => n > 0 ? Right(n) : Left(`Must be positive: ${n}`);
  const squareRoot  = n => Right(Math.sqrt(n));

  const process = pipeEither(parseNum, requirePos, squareRoot);
  console.log("Ex21 — Either pipe '16':", process("16"));
  console.log("Ex21 — Either pipe '-4':", process("-4"));
  console.log("Ex21 — Either pipe 'abc':", process("abc"));
}

/** flatPipe: pipe for functions returning arrays (flatMap chain) */
function ex22() {
  const flatPipe = (...fns) => arr =>
    fns.reduce((acc, fn) => acc.flatMap(fn), arr);

  const expand      = x => [x, x * 10];
  const filterSmall = x => x > 5 ? [x] : [];
  const stringify   = x => [`val:${x}`];

  const process = flatPipe(expand, filterSmall, stringify);
  console.log("Ex22 — flatPipe [1,2,3]:", process([1, 2, 3]));
}

/** compose validation: combine validators */
function ex23() {
  const pipeN = (...fns) => x => fns.reduce((acc, fn) => fn(acc), x);
  const validate = pred => msg => value => pred(value) ? { ok: true, value } : { ok: false, error: msg };
  const chain    = fn => result => result.ok ? fn(result.value) : result;

  const validateEmail = pipeN(
    chain(validate(s => typeof s === "string")("Must be string")),
    chain(validate(s => s.length > 0)("Cannot be empty")),
    chain(validate(s => s.includes("@"))("Must contain @")),
    chain(validate(s => s.includes("."))("Must contain ."))
  );
  console.log("Ex23 — compose validation:", validateEmail({ ok: true, value: "alice@example.com" }));
  console.log("Ex23 — compose validation:", validateEmail({ ok: true, value: "not-an-email" }));
}

/** pipe with object transformations */
function ex24() {
  const pipeN = (...fns) => x => fns.reduce((acc, fn) => fn(acc), x);
  const addFullName   = u => ({ ...u, fullName: `${u.firstName} ${u.lastName}` });
  const addAge        = u => ({ ...u, age: new Date().getFullYear() - u.birthYear });
  const addInitials   = u => ({ ...u, initials: `${u.firstName[0]}${u.lastName[0]}` });
  const formatDisplay = u => ({ ...u, display: `${u.fullName} (${u.initials}), age ${u.age}` });

  const enrichUser = pipeN(addFullName, addAge, addInitials, formatDisplay);
  const user = { firstName: "Alice", lastName: "Smith", birthYear: 1995 };
  const enriched = enrichUser(user);
  console.log("Ex24 — pipe object transforms:", enriched.display);
}

/** converge + pipe: apply different pipes and combine */
function ex25() {
  const converge = (combine, fns) => x => combine(...fns.map(fn => fn(x)));
  const pipeN    = (...fns) => x => fns.reduce((acc, fn) => fn(acc), x);
  const nums = [3, 1, 4, 1, 5, 9, 2, 6];

  const stats = converge(
    (min, max, sum) => ({ min, max, sum, avg: sum / nums.length }),
    [
      arr => Math.min(...arr),
      arr => Math.max(...arr),
      arr => arr.reduce((a, b) => a + b, 0)
    ]
  );
  console.log("Ex25 — converge+pipe stats:", stats(nums));
}

/** middleware compose: Express-like middleware chaining */
function ex26() {
  function composeMiddleware(...middlewares) {
    return function composed(ctx, finalNext) {
      let index = -1;
      function dispatch(i) {
        if (i <= index) return;
        index = i;
        const fn = i === middlewares.length ? finalNext : middlewares[i];
        fn(ctx, () => dispatch(i + 1));
      }
      dispatch(0);
    };
  }
  const ctx = { log: [] };
  const logger   = (ctx, next) => { ctx.log.push("logger");   next(); };
  const auth     = (ctx, next) => { ctx.log.push("auth");     next(); };
  const compress = (ctx, next) => { ctx.log.push("compress"); next(); };
  const handler  = (ctx, next) => { ctx.log.push("handler");  next(); };

  const chain = composeMiddleware(logger, auth, compress);
  chain(ctx, () => handler(ctx, () => {}));
  console.log("Ex26 — middleware compose:", ctx.log);
}

// ─── NESTED (27–38) ──────────────────────────────────────────────────────────

/** full data transformation pipeline: parse → validate → transform → format */
function ex27() {
  const pipeN = (...fns) => x => fns.reduce((acc, fn) => fn(acc), x);
  const parse    = raw => raw.split(",").map(s => s.trim());
  const validate = arr => arr.filter(s => s.length > 0 && !isNaN(Number(s)));
  const toNums   = arr => arr.map(Number);
  const transform = nums => nums.map(n => n * n);
  const format   = nums => `[${nums.join(", ")}]`;

  const pipeline = pipeN(parse, validate, toNums, transform, format);
  console.log("Ex27 — full pipeline:", pipeline("1, 2, abc, 3, , 4"));
}

/** reducer compose: combine multiple reducers */
function ex28() {
  function combineReducers(reducers) {
    return (state = {}, action) =>
      Object.fromEntries(
        Object.entries(reducers).map(([key, reducer]) => [key, reducer(state[key], action)])
      );
  }
  const countReducer = (state = 0, action) =>
    action.type === "INC" ? state + 1 : action.type === "DEC" ? state - 1 : state;
  const nameReducer = (state = "guest", action) =>
    action.type === "SET_NAME" ? action.name : state;

  const rootReducer = combineReducers({ count: countReducer, name: nameReducer });
  let s = rootReducer(undefined, {});
  s = rootReducer(s, { type: "INC" });
  s = rootReducer(s, { type: "INC" });
  s = rootReducer(s, { type: "SET_NAME", name: "Alice" });
  console.log("Ex28 — combineReducers:", s);
}

/** lens compose: drill into nested state */
function ex29() {
  const lens = (get, set) => ({ get, set });
  const composeLens = (outer, inner) => lens(
    obj => inner.get(outer.get(obj)),
    (val, obj) => outer.set(inner.set(val, outer.get(obj)), obj)
  );
  const over  = (l, fn, obj) => l.set(fn(l.get(obj)), obj);

  const settingsLens = lens(s => s.settings, (v, s) => ({ ...s, settings: v }));
  const themeLens    = lens(s => s.theme,    (v, s) => ({ ...s, theme: v    }));
  const appThemeLens = composeLens(settingsLens, themeLens);

  const state = { user: "Alice", settings: { theme: "dark", fontSize: 14 } };
  const next  = over(appThemeLens, t => t === "dark" ? "light" : "dark", state);
  console.log("Ex29 — lens compose:", state.settings.theme, "->", next.settings.theme);
}

/** selector compose: derive computed state (Reselect-like) */
function ex30() {
  const createSelector = (...fns) => {
    const selectors = fns.slice(0, -1);
    const resultFn  = fns[fns.length - 1];
    let lastArgs, lastResult;
    return state => {
      const args = selectors.map(s => s(state));
      if (lastArgs && args.every((a, i) => a === lastArgs[i])) return lastResult;
      lastArgs = args;
      lastResult = resultFn(...args);
      return lastResult;
    };
  };

  const getItems    = s => s.cart.items;
  const getDiscount = s => s.cart.discount;
  const getTotal    = createSelector(getItems, getDiscount, (items, disc) =>
    items.reduce((sum, i) => sum + i.price, 0) * (1 - disc)
  );

  const state = { cart: { items: [{price:10},{price:20},{price:30}], discount: 0.1 } };
  console.log("Ex30 — selector compose total:", getTotal(state));
}

/** async pipeline: compose async operations */
async function ex31() {
  const asyncPipe = (...fns) => async x => {
    let result = x;
    for (const fn of fns) result = await fn(result);
    return result;
  };
  const fetchUser   = async id => ({ id, name: "Alice", score: id * 10 });
  const enrichScore = async u  => ({ ...u, grade: u.score > 80 ? "A" : "B" });
  const serialize   = async u  => JSON.stringify(u);

  const pipeline = asyncPipe(fetchUser, enrichScore, serialize);
  const result   = await pipeline(9);
  console.log("Ex31 — async pipeline:", result);
}

/** generator pipeline: lazy evaluation with generators */
function ex32() {
  function* mapGen(iter, fn) { for (const x of iter) yield fn(x); }
  function* filterGen(iter, pred) { for (const x of iter) if (pred(x)) yield x; }
  function* takeGen(iter, n) { let i = 0; for (const x of iter) { if (i++ >= n) break; yield x; } }
  function* range(start, end) { for (let i = start; i < end; i++) yield i; }

  const pipeline = takeGen(
    filterGen(
      mapGen(range(1, 1000), x => x * x),
      x => x % 3 === 0
    ),
    5
  );
  console.log("Ex32 — generator pipeline:", [...pipeline]);
}

/** schema compose: compose validation schemas */
function ex33() {
  const pipeN = (...fns) => x => fns.reduce((acc, fn) => fn(acc), x);
  const schema = {
    string:  () => v => typeof v === "string"  ? { ok: true, v } : { ok: false, error: "not string" },
    minLen:  n  => r => r.ok && r.v.length >= n ? r : { ok: false, error: `minLen ${n}` },
    maxLen:  n  => r => r.ok && r.v.length <= n ? r : { ok: false, error: `maxLen ${n}` },
    pattern: re => r => r.ok && re.test(r.v)    ? r : { ok: false, error: `pattern ${re}` }
  };
  const validateUsername = pipeN(
    schema.string(),
    schema.minLen(3),
    schema.maxLen(20),
    schema.pattern(/^[a-z0-9_]+$/)
  );
  console.log("Ex33 — schema compose 'alice_99':", validateUsername("alice_99"));
  console.log("Ex33 — schema compose 'Hi':", validateUsername("Hi"));
}

/** error pipeline: accumulate errors vs short-circuit */
function ex34() {
  const validateAll = (validators, value) => {
    const errors = validators.map(v => v(value)).filter(r => !r.ok).map(r => r.error);
    return errors.length ? { ok: false, errors } : { ok: true, value };
  };
  const validators = [
    v => v.length >= 8  ? { ok: true } : { ok: false, error: "min 8 chars" },
    v => /[A-Z]/.test(v)? { ok: true } : { ok: false, error: "need uppercase" },
    v => /[0-9]/.test(v)? { ok: true } : { ok: false, error: "need digit" },
    v => /[!@#]/.test(v)? { ok: true } : { ok: false, error: "need special char" }
  ];
  console.log("Ex34 — error pipeline 'abc':", validateAll(validators, "abc"));
  console.log("Ex34 — error pipeline 'SecureP@ss1':", validateAll(validators, "SecureP@ss1"));
}

/** monad compose: Kleisli arrow composition */
function ex35() {
  // Kleisli compose: (a -> M b) and (b -> M c) => (a -> M c)
  const composeK = (f, g) => x => {
    const result = f(x);
    return result === null ? null : g(result);
  };
  const safeParseInt = s => { const n = parseInt(s, 10); return isNaN(n) ? null : n; };
  const safeSqrt     = n => n < 0 ? null : Math.sqrt(n);
  const safeRecip    = n => n === 0 ? null : 1 / n;

  const pipeline = composeK(composeK(safeParseInt, safeSqrt), safeRecip);
  console.log("Ex35 — Kleisli compose '4':", pipeline("4"));    // sqrt(4)=2, 1/2=0.5
  console.log("Ex35 — Kleisli compose '-9':", pipeline("-9"));  // sqrt fails
  console.log("Ex35 — Kleisli compose 'abc':", pipeline("abc")); // parse fails
}

/** optics compose: view/set/over nested lenses */
function ex36() {
  const lens = (get, set) => ({ get, set });
  const view = (l, s)       => l.get(s);
  const set  = (l, v, s)    => l.set(v, s);
  const over = (l, fn, s)   => set(l, fn(view(l, s)), s);
  const compose = (l1, l2)  => lens(s => l2.get(l1.get(s)), (v, s) => l1.set(l2.set(v, l1.get(s)), s));

  const addressLens = lens(u => u.address, (v, u) => ({ ...u, address: v }));
  const cityLens    = lens(a => a.city,    (v, a) => ({ ...a, city: v    }));
  const userCityLens = compose(addressLens, cityLens);

  const user = { name: "Alice", address: { city: "NYC", zip: "10001" } };
  console.log("Ex36 — optics view:", view(userCityLens, user));
  console.log("Ex36 — optics over:", over(userCityLens, c => c.toLowerCase(), user).address.city);
}

/** coroutine compose: generator-based cooperative multitasking */
function ex37() {
  function* steps(label, count) {
    for (let i = 0; i < count; i++) {
      yield `${label}:${i + 1}`;
    }
  }
  function* interleave(...gens) {
    let active = [...gens];
    while (active.length) {
      const next = [];
      for (const g of active) {
        const { value, done } = g.next();
        if (!done) { yield value; next.push(g); }
      }
      active = next;
    }
  }
  const output = [...interleave(steps("A", 3), steps("B", 3), steps("C", 2))];
  console.log("Ex37 — coroutine interleave:", output);
}

/** natural transformation: from Maybe to Array */
function ex38() {
  class Maybe {
    constructor(v) { this.v = v; }
    static of(v) { return new Maybe(v); }
    isNothing() { return this.v === null || this.v === undefined; }
    map(fn) { return this.isNothing() ? this : Maybe.of(fn(this.v)); }
  }
  // Natural transformation: Maybe -> Array
  const maybeToArray = maybe => maybe.isNothing() ? [] : [maybe.v];

  const a = maybeToArray(Maybe.of(42).map(x => x * 2));
  const b = maybeToArray(Maybe.of(null).map(x => x * 2));
  console.log("Ex38 — natural transformation:", a, b);
}

// ─── ADVANCED (39–50) ────────────────────────────────────────────────────────

/** Profunctor dimap: adapt input and output of a function */
function ex39() {
  class Fn {
    constructor(f) { this.f = f; }
    dimap(pre, post) { return new Fn(x => post(this.f(pre(x)))); }
    run(x) { return this.f(x); }
  }
  const wordCount = new Fn(s => s.split(/\s+/).length);
  const adapted   = wordCount.dimap(
    s => s.trim(),          // preprocess input
    n => `${n} words`       // postprocess output
  );
  console.log("Ex39 — Profunctor:", adapted.run("  hello world foo  "));
}

/** Kleisli composition: chain Promise-returning functions */
async function ex40() {
  const composeK = (f, g) => async x => g(await f(x));
  const fetchUser   = async id => ({ id, name: "Alice" });
  const fetchOrders = async u  => ({ user: u, orders: ["order1", "order2"] });
  const formatReport = async d => `${d.user.name}: ${d.orders.join(", ")}`;

  const pipeline = composeK(composeK(fetchUser, fetchOrders), formatReport);
  console.log("Ex40 — async Kleisli:", await pipeline(1));
}

/** free monad program as data structure */
function ex41() {
  // DSL operations as plain objects
  const Print = (msg, next) => ({ tag: "Print", msg, next });
  const Ask   = (prompt, next) => ({ tag: "Ask",   prompt, next });
  const Pure  = value => ({ tag: "Pure", value });

  // Interpreter (pure — no actual I/O)
  function interpret(program, inputMap = {}, output = []) {
    if (program.tag === "Pure")  return { value: program.value, output };
    if (program.tag === "Print") return interpret(program.next, inputMap, [...output, program.msg]);
    if (program.tag === "Ask")   return interpret(program.next(inputMap[program.prompt] || ""), inputMap, output);
  }

  const prog = Print("Hello!", Ask("name", name => Print(`Hi, ${name}!`, Pure("done"))));
  const result = interpret(prog, { name: "Alice" });
  console.log("Ex41 — free monad output:", result.output);
}

/** applicative compose: apply wrapped fns to wrapped values */
function ex42() {
  class Validation {
    constructor(value, errors = []) { this.value = value; this.errors = errors; }
    static of(v) { return new Validation(v, []); }
    isValid() { return this.errors.length === 0; }
    map(fn) { return this.isValid() ? Validation.of(fn(this.value)) : this; }
    ap(wrappedFn) {
      if (!wrappedFn.isValid()) return new Validation(null, [...this.errors, ...wrappedFn.errors]);
      return this.isValid() ? Validation.of(wrappedFn.value(this.value)) : this;
    }
  }
  const validateAge  = n => n >= 0 && n <= 150 ? Validation.of(n) : new Validation(null, ["invalid age"]);
  const validateName = s => s.length > 0 ? Validation.of(s) : new Validation(null, ["name required"]);

  const ageResult  = validateAge(25);
  const nameResult = validateName("Alice");
  console.log("Ex42 — applicative age:", ageResult.isValid(), "name:", nameResult.isValid());
}

/** monad transformer concept: combine two monads */
function ex43() {
  // MaybeIO: wraps IO that might fail
  class MaybeIO {
    constructor(fn) { this.fn = fn; }
    static of(v) { return new MaybeIO(() => v !== null && v !== undefined ? { ok: true, v } : { ok: false }); }
    map(fn) {
      return new MaybeIO(() => {
        const res = this.fn();
        return res.ok ? { ok: true, v: fn(res.v) } : res;
      });
    }
    chain(fn) {
      return new MaybeIO(() => {
        const res = this.fn();
        return res.ok ? fn(res.v).fn() : res;
      });
    }
    run() { return this.fn(); }
  }
  const result = MaybeIO.of(10)
    .map(n => n * 2)
    .chain(n => MaybeIO.of(n > 15 ? n : null))
    .map(n => `value: ${n}`)
    .run();
  console.log("Ex43 — MaybeIO transformer:", result);
}

/** effect compose: build computation from description */
function ex44() {
  // Effects as plain data, run by an interpreter
  const effects = [];
  const effect = (type, payload) => { effects.push({ type, payload }); };

  function computeWithEffects(data) {
    const processed = data.filter(x => x > 0).map(x => x * 2);
    effect("LOG", `Processed ${processed.length} items`);
    effect("METRIC", { count: processed.length, sum: processed.reduce((a, b) => a + b, 0) });
    return processed;
  }

  const result = computeWithEffects([-1, 2, -3, 4, 5]);
  console.log("Ex44 — effect compose result:", result, "effects:", effects.map(e => e.type));
}

/** category theory: functor laws verification */
function ex45() {
  class Box {
    constructor(v) { this.v = v; }
    static of(v) { return new Box(v); }
    map(fn) { return Box.of(fn(this.v)); }
    equals(other) { return this.v === other.v; }
  }
  const identity = x => x;
  const f = x => x * 2;
  const g = x => x + 1;

  const b = Box.of(5);
  // Identity law: b.map(id) === b
  const identityLaw = b.map(identity).equals(b);
  // Composition law: b.map(f).map(g) === b.map(x => g(f(x)))
  const compositionLaw = b.map(f).map(g).equals(b.map(x => g(f(x))));
  console.log("Ex45 — functor identity law:", identityLaw, "composition law:", compositionLaw);
}

/** pipe with type coercion and schema transformation */
function ex46() {
  const pipeN = (...fns) => x => fns.reduce((acc, fn) => fn(acc), x);
  const coerceTypes = obj => ({
    ...obj,
    age: Number(obj.age),
    active: obj.active === "true" || obj.active === true
  });
  const addDefaults = obj => ({ role: "user", ...obj });
  const validate = obj => {
    if (!obj.name || typeof obj.name !== "string") throw new Error("invalid name");
    return obj;
  };
  const sanitize = obj => ({ ...obj, name: obj.name.trim() });

  const processInput = pipeN(coerceTypes, addDefaults, sanitize, validate);
  const raw = { name: "  Alice  ", age: "30", active: "true" };
  console.log("Ex46 — pipe type transform:", processInput(raw));
}

/** compose decorators: log + cache + retry */
function ex47() {
  const withLogging = fn => (...args) => {
    const result = fn(...args);
    return result;
  };
  const withCache = fn => {
    const cache = new Map();
    return (...args) => {
      const key = JSON.stringify(args);
      if (!cache.has(key)) cache.set(key, fn(...args));
      return cache.get(key);
    };
  };
  const withTiming = fn => (...args) => {
    const start = Date.now();
    const result = fn(...args);
    const elapsed = Date.now() - start;
    return { result, elapsed };
  };

  const base = (n) => n * n;
  const decorated = withTiming(withCache(withLogging(base)));
  const r1 = decorated(7);
  const r2 = decorated(7); // cached
  console.log("Ex47 — compose decorators:", r1, r2);
}

/** point-free pipeline with curry */
function ex48() {
  const curry = fn => a => b => fn(a, b);
  const pipeN = (...fns) => x => fns.reduce((acc, fn) => fn(acc), x);
  const map    = curry((fn, arr) => arr.map(fn));
  const filter = curry((pred, arr) => arr.filter(pred));
  const reduce = (fn, init) => arr => arr.reduce(fn, init);
  const multiply = curry((a, b) => a * b);
  const gt       = curry((threshold, n) => n > threshold);

  // Point-free: no explicit data variable in definition
  const sumDoubledBigNumbers = pipeN(
    filter(gt(5)),
    map(multiply(2)),
    reduce((a, b) => a + b, 0)
  );
  console.log("Ex48 — point-free pipeline:", sumDoubledBigNumbers([1, 3, 6, 8, 2, 10, 4]));
}

/** transducer compose: efficient multi-step transformation */
function ex49() {
  const mapT    = fn   => reducer => (acc, x) => reducer(acc, fn(x));
  const filterT = pred => reducer => (acc, x) => pred(x) ? reducer(acc, x) : acc;
  const composeT = (...ts) => reducer => ts.reduceRight((r, t) => t(r), reducer);
  const into    = (xform, reducer, init, arr) => arr.reduce(xform(reducer), init);

  const xform = composeT(
    filterT(x => x % 2 === 0),
    mapT(x => x * x),
    filterT(x => x < 100)
  );
  const result = into(xform, (acc, x) => [...acc, x], [], [1,2,3,4,5,6,7,8,9,10]);
  console.log("Ex49 — transducer compose:", result);
}

/** applicative functor: parallel independent computations */
function ex50() {
  // Applicative for arrays: [f1,f2] ap [x1,x2] = [f1(x1),f1(x2),f2(x1),f2(x2)]
  const of  = x => [x];
  const ap  = (fns, vals) => fns.flatMap(fn => vals.map(fn));
  const map = (arr, fn) => arr.map(fn);

  const add   = a => b => a + b;
  const mul   = a => b => a * b;
  const fns   = ap(of(add(10)), [1, 2, 3]);        // [11,12,13]
  const cross = ap(map([1,2,3], add), [10, 20]);    // cross product sums
  console.log("Ex50 — applicative ap:", fns);
  console.log("Ex50 — applicative cross:", cross);
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Examples 4.3 — Composition & Pipe ===\n");
  console.log("--- BASIC (1–13) ---");
  ex01(); ex02(); ex03(); ex04(); ex05(); ex06(); ex07();
  ex08(); ex09(); ex10(); ex11(); ex12(); ex13();
  console.log("\n--- INTERMEDIATE (14–26) ---");
  ex14(); ex15(); ex16(); ex17(); ex18(); await ex19(); ex20();
  ex21(); ex22(); ex23(); ex24(); ex25(); ex26();
  console.log("\n--- NESTED (27–38) ---");
  ex27(); ex28(); ex29(); ex30(); await ex31(); ex32(); ex33();
  ex34(); ex35(); ex36(); ex37(); ex38();
  console.log("\n--- ADVANCED (39–50) ---");
  ex39(); await ex40(); ex41(); ex42(); ex43(); ex44(); ex45();
  ex46(); ex47(); ex48(); ex49(); ex50();
}

main();
