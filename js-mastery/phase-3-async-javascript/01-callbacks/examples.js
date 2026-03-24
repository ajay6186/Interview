// ============================================================================
// Examples 3.1 — Callbacks  (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================================

"use strict";

// ─── BASIC (1–13) ────────────────────────────────────────────────────────────

/** Sync forEach callback */
function ex01() {
  function forEach(arr, fn) { for (let i = 0; i < arr.length; i++) fn(arr[i], i); }
  const out = [];
  forEach([10, 20, 30], (v, i) => out.push(`${i}=${v}`));
  console.log("Ex01 —", out.join(", "));
}

/** Sync map callback */
function ex02() {
  function map(arr, fn) { return arr.map(fn); }
  const squares = map([1, 2, 3, 4, 5], x => x * x);
  console.log("Ex02 —", squares.join(", "));
}

/** Sync filter callback */
function ex03() {
  function filter(arr, fn) { return arr.filter(fn); }
  const evens = filter([1, 2, 3, 4, 5, 6], x => x % 2 === 0);
  console.log("Ex03 —", evens.join(", "));
}

/** Sort with custom comparator callback */
function ex04() {
  const people = [{ name: "Charlie" }, { name: "Alice" }, { name: "Bob" }];
  people.sort((a, b) => a.name.localeCompare(b.name));
  console.log("Ex04 —", people.map(p => p.name).join(", "));
}

/** Callback as parameter (strategy pattern) */
function ex05() {
  function applyOp(a, b, op) { return op(a, b); }
  console.log("Ex05 — add:", applyOp(3, 4, (a, b) => a + b),
    "mul:", applyOp(3, 4, (a, b) => a * b));
}

/** setTimeout as async callback */
function ex06() {
  setTimeout(() => console.log("Ex06 — setTimeout fired"), 0);
}

/** setInterval — basic (cancelled after 3 ticks) */
function ex07() {
  let count = 0;
  const id = setInterval(() => {
    count++;
    if (count === 3) {
      clearInterval(id);
      console.log("Ex07 — interval ran 3 times, count:", count);
    }
  }, 0);
}

/** clearTimeout before it fires */
function ex08() {
  const id = setTimeout(() => console.log("Ex08 — should NOT print"), 100);
  clearTimeout(id);
  console.log("Ex08 — timeout cleared, nothing extra printed");
}

/** Error-first callback — success case */
function ex09() {
  function readValue(succeed, cb) {
    if (succeed) cb(null, 42);
    else cb(new Error("failed"));
  }
  readValue(true, (err, val) => {
    console.log("Ex09 —", err ? "error:" + err.message : "value:" + val);
  });
}

/** Error-first callback — error case */
function ex10() {
  function parseNumber(str, cb) {
    const n = Number(str);
    if (isNaN(n)) cb(new Error("not a number: " + str));
    else cb(null, n);
  }
  parseNumber("abc", (err, val) => {
    console.log("Ex10 —", err ? "caught: " + err.message : val);
  });
}

/** Multiple arguments to callback */
function ex11() {
  function divide(a, b, cb) {
    if (b === 0) return cb(new Error("division by zero"));
    cb(null, Math.floor(a / b), a % b);
  }
  divide(10, 3, (err, quotient, remainder) => {
    console.log("Ex11 — quotient:", quotient, "remainder:", remainder);
  });
}

/** Callback called with index context */
function ex12() {
  function eachWithContext(arr, ctx, fn) { arr.forEach((v, i) => fn.call(ctx, v, i)); }
  const ctx = { prefix: "item" };
  const out = [];
  eachWithContext([7, 8, 9], ctx, function (v, i) { out.push(`${this.prefix}[${i}]=${v}`); });
  console.log("Ex12 —", out.join(", "));
}

/** Callback for reduce */
function ex13() {
  function myReduce(arr, fn, init) { let acc = init; arr.forEach(v => { acc = fn(acc, v); }); return acc; }
  const sum = myReduce([1, 2, 3, 4, 5], (acc, v) => acc + v, 0);
  console.log("Ex13 — sum:", sum);
}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────────────────────

/** Async series — run tasks one after another */
function ex14() {
  function series(tasks, done) {
    function run(i, res) {
      if (i >= tasks.length) return done(null, res);
      tasks[i]((err, r) => { if (err) return done(err); run(i + 1, r); });
    }
    run(0, undefined);
  }
  const tasks = [
    cb => setTimeout(() => cb(null, 1), 0),
    cb => setTimeout(() => cb(null, 2), 0),
    cb => setTimeout(() => cb(null, 3), 0),
  ];
  series(tasks, (err, last) => console.log("Ex14 — last result:", last));
}

/** Async parallel — manual counter */
function ex15() {
  function parallel(tasks, done) {
    const results = new Array(tasks.length);
    let remaining = tasks.length;
    if (remaining === 0) return done(null, results);
    tasks.forEach((task, i) => {
      task((err, result) => {
        if (err) return done(err);
        results[i] = result;
        if (--remaining === 0) done(null, results);
      });
    });
  }
  const tasks = [
    cb => setTimeout(() => cb(null, "a"), 0),
    cb => setTimeout(() => cb(null, "b"), 0),
    cb => setTimeout(() => cb(null, "c"), 0),
  ];
  parallel(tasks, (err, results) => console.log("Ex15 — parallel results:", results.join(", ")));
}

/** Promisify utility */
function ex16() {
  function promisify(fn) {
    return (...args) => new Promise((res, rej) => {
      fn(...args, (err, val) => err ? rej(err) : res(val));
    });
  }
  function delayedDouble(n, cb) { setTimeout(() => cb(null, n * 2), 0); }
  const delayedDoubleP = promisify(delayedDouble);
  delayedDoubleP(21).then(v => console.log("Ex16 — promisified result:", v));
}

/** Debounce via callbacks */
function ex17() {
  function debounce(fn, wait) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
  }
  let callCount = 0;
  const debounced = debounce(() => { callCount++; console.log("Ex17 — debounced fired, count:", callCount); }, 10);
  debounced(); debounced(); debounced();
}

/** Throttle via callbacks */
function ex18() {
  function throttle(fn, limit) {
    let inThrottle = false;
    return function (...args) {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => { inThrottle = false; }, limit);
      }
    };
  }
  let count = 0;
  const throttled = throttle(() => count++, 50);
  throttled(); throttled(); throttled();
  console.log("Ex18 — throttle count (expect 1):", count);
}

/** Callback once — only fires on first call */
function ex19() {
  function once(fn) {
    let called = false, result;
    return (...args) => {
      if (!called) { called = true; result = fn(...args); }
      return result;
    };
  }
  let n = 0;
  const init = once(() => ++n);
  init(); init(); init();
  console.log("Ex19 — once result (expect 1):", n);
}

/** after(n) — fires only after n calls */
function ex20() {
  function after(n, fn) {
    let count = 0;
    return (...args) => { if (++count >= n) fn(...args); };
  }
  let fired = false;
  const done = after(3, () => { fired = true; });
  done(); done(); done();
  console.log("Ex20 — after(3) fired:", fired);
}

/** before(n) — fires only the first n-1 calls */
function ex21() {
  function before(n, fn) {
    let count = 0;
    return (...args) => { if (++count < n) return fn(...args); };
  }
  const results = [];
  const limited = before(3, x => results.push(x));
  limited(1); limited(2); limited(3); limited(4);
  console.log("Ex21 — before(3) results:", results.join(", "));
}

/** Error-first with validation */
function ex22() {
  function validateAge(age, cb) {
    if (typeof age !== "number") return cb(new Error("age must be a number"));
    if (age < 0 || age > 150) return cb(new Error("age out of range"));
    cb(null, age);
  }
  validateAge(25, (err, v) => console.log("Ex22 — valid age:", v));
  validateAge(-5, (err) => console.log("Ex22 — error:", err.message));
}

/** Callback aggregator — collect N results then call done */
function ex23() {
  function aggregator(n, done) {
    const results = [];
    return function collect(err, val) {
      if (err) return done(err);
      results.push(val);
      if (results.length >= n) done(null, results);
    };
  }
  const collect = aggregator(3, (err, all) => console.log("Ex23 — aggregated:", all.join(", ")));
  setTimeout(() => collect(null, "x"), 0);
  setTimeout(() => collect(null, "y"), 0);
  setTimeout(() => collect(null, "z"), 0);
}

/** Callback with timeout guard */
function ex24() {
  function withTimeout(fn, ms, cb) {
    let done = false;
    const timer = setTimeout(() => {
      if (!done) { done = true; cb(new Error("timeout")); }
    }, ms);
    fn((err, val) => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        cb(err, val);
      }
    });
  }
  withTimeout(cb => setTimeout(() => cb(null, "ok"), 0), 100, (err, val) => {
    console.log("Ex24 — result:", err ? err.message : val);
  });
}

/** Memoize with callback */
function ex25() {
  function memoizeCb(fn) {
    const cache = {};
    return (key, cb) => {
      if (key in cache) return cb(null, cache[key]);
      fn(key, (err, val) => {
        if (!err) cache[key] = val;
        cb(err, val);
      });
    };
  }
  function expensiveOp(key, cb) { setTimeout(() => cb(null, key.toUpperCase()), 0); }
  const memoized = memoizeCb(expensiveOp);
  memoized("hello", (err, v) => {
    console.log("Ex25 — first call:", v);
    memoized("hello", (err2, v2) => console.log("Ex25 — cached call:", v2));
  });
}

/** Retry with callback */
function ex26() {
  function retry(fn, times, cb) {
    function attempt(n) {
      fn((err, val) => {
        if (!err) return cb(null, val);
        if (n <= 1) return cb(err);
        attempt(n - 1);
      });
    }
    attempt(times);
  }
  let tries = 0;
  function flakyOp(cb) {
    tries++;
    if (tries < 3) cb(new Error("not yet"));
    else cb(null, "success");
  }
  retry(flakyOp, 5, (err, val) => console.log("Ex26 — retry result:", val, "after tries:", tries));
}

// ─── NESTED (27–38) ──────────────────────────────────────────────────────────

/** Waterfall pattern */
function ex27() {
  function waterfall(tasks, done) {
    function run(i, prev) {
      if (i >= tasks.length) return done(null, prev);
      const next = (err, result) => { if (err) return done(err); run(i + 1, result); };
      i === 0 ? tasks[i](next) : tasks[i](prev, next);
    }
    run(0, undefined);
  }
  waterfall([
    (next) => setTimeout(() => next(null, 10), 0),
    (v, next) => setTimeout(() => next(null, v * 2), 0),
    (v, next) => setTimeout(() => next(null, v + 5), 0),
  ], (err, result) => console.log("Ex27 — waterfall result:", result));
}

/** Parallel with counter */
function ex28() {
  function parallelAll(fns, done) {
    const out = new Array(fns.length);
    let pending = fns.length;
    fns.forEach((fn, i) => fn((err, val) => {
      if (err) return done(err);
      out[i] = val;
      if (--pending === 0) done(null, out);
    }));
  }
  parallelAll([
    cb => setTimeout(() => cb(null, 1), 5),
    cb => setTimeout(() => cb(null, 2), 2),
    cb => setTimeout(() => cb(null, 3), 8),
  ], (err, results) => console.log("Ex28 — parallel results:", results.join(", ")));
}

/** Async queue with concurrency limit */
function ex29() {
  function asyncQueue(concurrency) {
    const queue = [];
    let running = 0;
    const results = [];
    function run() {
      while (running < concurrency && queue.length) {
        running++;
        const { task, index } = queue.shift();
        task((err, val) => {
          results[index] = val;
          running--;
          run();
        });
      }
    }
    return {
      push(task, index) { queue.push({ task, index }); run(); },
      getResults() { return results; },
    };
  }
  const q = asyncQueue(2);
  let completed = 0;
  const expected = 3;
  [10, 20, 30].forEach((v, i) => {
    q.push(cb => setTimeout(() => {
      cb(null, v * 2);
      completed++;
      if (completed === expected) console.log("Ex29 — queue results:", q.getResults().join(", "));
    }, 0), i);
  });
}

/** Callback middleware chain */
function ex30() {
  function compose(middlewares) {
    return function execute(ctx, done) {
      function next(i) {
        if (i >= middlewares.length) return done(null, ctx);
        middlewares[i](ctx, (err) => { if (err) return done(err); next(i + 1); });
      }
      next(0);
    };
  }
  const chain = compose([
    (ctx, next) => { ctx.step1 = true; next(); },
    (ctx, next) => { ctx.step2 = true; next(); },
    (ctx, next) => { ctx.step3 = true; next(); },
  ]);
  chain({}, (err, ctx) => console.log("Ex30 — middleware ctx:", JSON.stringify(ctx)));
}

/** Retry with exponential backoff (simulated) */
function ex31() {
  function retryBackoff(fn, maxTries, cb) {
    let attempt = 0;
    function tryIt() {
      fn((err, val) => {
        attempt++;
        if (!err) return cb(null, val);
        if (attempt >= maxTries) return cb(err);
        setTimeout(tryIt, 0); // real impl: 2^attempt * baseDelay
      });
    }
    tryIt();
  }
  let n = 0;
  retryBackoff(cb => { n++; n < 3 ? cb(new Error("fail")) : cb(null, "done"); }, 5, (err, v) => {
    console.log("Ex31 — backoff result:", v, "attempts:", n);
  });
}

/** Timeout wrapper for async callbacks */
function ex32() {
  function timeoutWrap(fn, ms) {
    return function (cb) {
      let settled = false;
      const guard = (err, val) => { if (!settled) { settled = true; cb(err, val); } };
      const timer = setTimeout(() => guard(new Error("timed out")), ms);
      fn((err, val) => { clearTimeout(timer); guard(err, val); });
    };
  }
  const fast = timeoutWrap(cb => setTimeout(() => cb(null, "fast!"), 5), 50);
  fast((err, val) => console.log("Ex32 — timeout wrap:", err ? err.message : val));
}

/** CPS (Continuation-Passing Style) factorial */
function ex33() {
  function factCPS(n, k) {
    if (n <= 1) return k(1);
    factCPS(n - 1, result => k(n * result));
  }
  factCPS(6, result => console.log("Ex33 — CPS factorial(6):", result));
}

/** Async map with callbacks */
function ex34() {
  function asyncMap(arr, fn, done) {
    const results = new Array(arr.length);
    let pending = arr.length;
    if (!pending) return done(null, results);
    arr.forEach((item, i) => {
      fn(item, (err, val) => {
        if (err) return done(err);
        results[i] = val;
        if (--pending === 0) done(null, results);
      });
    });
  }
  asyncMap([1, 2, 3, 4], (x, cb) => setTimeout(() => cb(null, x * x), 0), (err, results) => {
    console.log("Ex34 — async map squares:", results.join(", "));
  });
}

/** Async filter with callbacks */
function ex35() {
  function asyncFilter(arr, predicate, done) {
    const results = [];
    let pending = arr.length;
    if (!pending) return done(null, results);
    const checks = new Array(arr.length);
    arr.forEach((item, i) => {
      predicate(item, (err, pass) => {
        if (err) return done(err);
        checks[i] = pass ? item : undefined;
        if (--pending === 0) done(null, checks.filter(v => v !== undefined));
      });
    });
  }
  asyncFilter([1, 2, 3, 4, 5, 6], (x, cb) => setTimeout(() => cb(null, x % 2 === 0), 0), (err, evens) => {
    console.log("Ex35 — async filter evens:", evens.join(", "));
  });
}

/** Callback-based event emitter */
function ex36() {
  function createEmitter() {
    const listeners = {};
    return {
      on(event, fn) { (listeners[event] = listeners[event] || []).push(fn); },
      emit(event, ...args) { (listeners[event] || []).forEach(fn => fn(...args)); },
    };
  }
  const emitter = createEmitter();
  emitter.on("data", val => console.log("Ex36 — event data:", val));
  emitter.on("data", val => console.log("Ex36 — event data (2):", val * 2));
  emitter.emit("data", 21);
}

/** Pipeline of async transforms */
function ex37() {
  function pipeline(value, transforms, done) {
    function step(i, current) {
      if (i >= transforms.length) return done(null, current);
      transforms[i](current, (err, next) => {
        if (err) return done(err);
        step(i + 1, next);
      });
    }
    step(0, value);
  }
  pipeline(
    5,
    [
      (v, next) => setTimeout(() => next(null, v * 2), 0),
      (v, next) => setTimeout(() => next(null, v + 3), 0),
      (v, next) => setTimeout(() => next(null, v * v), 0),
    ],
    (err, result) => console.log("Ex37 — pipeline result:", result) // (5*2+3)^2 = 169
  );
}

/** Batch processor with callbacks */
function ex38() {
  function batchProcess(items, batchSize, processor, done) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    const allResults = [];
    function runBatch(bi) {
      if (bi >= batches.length) return done(null, allResults);
      processor(batches[bi], (err, results) => {
        if (err) return done(err);
        allResults.push(...results);
        runBatch(bi + 1);
      });
    }
    runBatch(0);
  }
  batchProcess(
    [1, 2, 3, 4, 5, 6, 7],
    3,
    (batch, cb) => setTimeout(() => cb(null, batch.map(x => x * 10)), 0),
    (err, results) => console.log("Ex38 — batch results:", results.join(", "))
  );
}

// ─── ADVANCED (39–50) ────────────────────────────────────────────────────────

/** Async iterator via callbacks */
function ex39() {
  function createAsyncIterator(items) {
    let index = 0;
    return {
      next(cb) {
        if (index >= items.length) return cb(null, { done: true });
        const value = items[index++];
        setTimeout(() => cb(null, { value, done: false }), 0);
      },
    };
  }
  const iter = createAsyncIterator([10, 20, 30]);
  const collected = [];
  function consume() {
    iter.next((err, item) => {
      if (item.done) return console.log("Ex39 — async iterator:", collected.join(", "));
      collected.push(item.value);
      consume();
    });
  }
  consume();
}

/** Trampoline for callback-heavy recursion */
function ex40() {
  function trampoline(fn) {
    return function (...args) {
      let result = fn(...args);
      while (typeof result === "function") result = result();
      return result;
    };
  }
  // CPS-style sum using trampoline to avoid stack overflow
  function sumTo(n, acc = 0) {
    if (n <= 0) return acc;
    return () => sumTo(n - 1, acc + n);
  }
  const trampolined = trampoline(sumTo);
  console.log("Ex40 — trampoline sum(100):", trampolined(100));
}

/** Priority queue for async tasks */
function ex41() {
  function priorityQueue() {
    const tasks = [];
    return {
      push(priority, task) {
        tasks.push({ priority, task });
        tasks.sort((a, b) => b.priority - a.priority);
      },
      run(done) {
        const results = [];
        function next() {
          if (!tasks.length) return done(null, results);
          const { task } = tasks.shift();
          task((err, val) => {
            if (err) return done(err);
            results.push(val);
            next();
          });
        }
        next();
      },
    };
  }
  const pq = priorityQueue();
  pq.push(1, cb => cb(null, "low"));
  pq.push(3, cb => cb(null, "high"));
  pq.push(2, cb => cb(null, "medium"));
  pq.run((err, results) => console.log("Ex41 — priority queue:", results.join(", ")));
}

/** Cancel token for callbacks */
function ex42() {
  function createCancelToken() {
    let cancelled = false;
    return {
      cancel() { cancelled = true; },
      get isCancelled() { return cancelled; },
    };
  }
  function cancellableDelay(ms, val, token, cb) {
    const timer = setTimeout(() => {
      if (token.isCancelled) return cb(new Error("cancelled"));
      cb(null, val);
    }, ms);
    return () => { clearTimeout(timer); };
  }
  const token = createCancelToken();
  cancellableDelay(50, "hello", token, (err, val) => {
    console.log("Ex42 — cancelled op:", err ? err.message : val);
  });
  token.cancel();
  // Immediate non-cancelled
  const token2 = createCancelToken();
  cancellableDelay(0, "world", token2, (err, val) => {
    console.log("Ex42 — normal op:", err ? err.message : val);
  });
}

/** Semaphore via callbacks */
function ex43() {
  function createSemaphore(max) {
    let running = 0;
    const waiting = [];
    function release() {
      running--;
      if (waiting.length) {
        running++;
        const next = waiting.shift();
        next();
      }
    }
    return function acquire(fn, cb) {
      function start() {
        fn((err, val) => { release(); cb(err, val); });
      }
      if (running < max) { running++; start(); }
      else waiting.push(start);
    };
  }
  const semaphore = createSemaphore(2);
  const order = [];
  [1, 2, 3, 4].forEach(i => {
    semaphore(
      cb => setTimeout(() => { order.push(i); cb(null, i); }, 0),
      (err, val) => {
        if (order.length === 4) console.log("Ex43 — semaphore order:", order.join(", "));
      }
    );
  });
}

/** Callback-based state machine */
function ex44() {
  function createStateMachine(initial, transitions) {
    let state = initial;
    return {
      getState() { return state; },
      transition(event, cb) {
        const key = `${state}:${event}`;
        if (!transitions[key]) return cb(new Error(`No transition from ${state} on ${event}`));
        const nextState = transitions[key];
        state = nextState;
        cb(null, state);
      },
    };
  }
  const fsm = createStateMachine("idle", {
    "idle:start": "running",
    "running:pause": "paused",
    "paused:resume": "running",
    "running:stop": "idle",
  });
  fsm.transition("start", (err, s) => console.log("Ex44 — state:", s));
  fsm.transition("pause", (err, s) => console.log("Ex44 — state:", s));
  fsm.transition("resume", (err, s) => console.log("Ex44 — state:", s));
  fsm.transition("stop", (err, s) => console.log("Ex44 — state:", s));
}

/** Async debounce with callback */
function ex45() {
  function asyncDebounce(fn, wait) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      return new Promise(resolve => {
        timer = setTimeout(() => fn(...args).then(resolve), wait);
      });
    };
  }
  const asyncOp = async (x) => x * 3;
  const debouncedOp = asyncDebounce(asyncOp, 10);
  debouncedOp(5);
  debouncedOp(7);
  debouncedOp(9).then(v => console.log("Ex45 — async debounce result:", v));
}

/** Callback memoize with TTL */
function ex46() {
  function memoizeTTL(fn, ttlMs) {
    const cache = {};
    return (key, cb) => {
      const now = Date.now();
      if (cache[key] && now - cache[key].timestamp < ttlMs) {
        return cb(null, cache[key].value);
      }
      fn(key, (err, val) => {
        if (!err) cache[key] = { value: val, timestamp: Date.now() };
        cb(err, val);
      });
    };
  }
  function expensiveLookup(id, cb) { setTimeout(() => cb(null, `result_${id}`), 0); }
  const cached = memoizeTTL(expensiveLookup, 1000);
  cached("abc", (err, v) => {
    console.log("Ex46 — first fetch:", v);
    cached("abc", (err2, v2) => console.log("Ex46 — cached fetch:", v2));
  });
}

/** Event-driven callbacks with off() */
function ex47() {
  function eventBus() {
    const handlers = {};
    return {
      on(event, fn) {
        (handlers[event] = handlers[event] || []).push(fn);
        return () => { handlers[event] = handlers[event].filter(h => h !== fn); };
      },
      emit(event, ...args) { (handlers[event] || []).forEach(h => h(...args)); },
    };
  }
  const bus = eventBus();
  const log = (msg) => console.log("Ex47 — event:", msg);
  const off = bus.on("msg", log);
  bus.emit("msg", "hello");
  off();
  bus.emit("msg", "should not print");
  console.log("Ex47 — unsubscribed successfully");
}

/** Async reduce with callbacks */
function ex48() {
  function asyncReduce(arr, fn, init, done) {
    function step(i, acc) {
      if (i >= arr.length) return done(null, acc);
      fn(acc, arr[i], (err, next) => {
        if (err) return done(err);
        step(i + 1, next);
      });
    }
    step(0, init);
  }
  asyncReduce([1, 2, 3, 4, 5], (acc, v, cb) => setTimeout(() => cb(null, acc + v), 0), 0, (err, total) => {
    console.log("Ex48 — async reduce sum:", total);
  });
}

/** Callback-based pub/sub with topics */
function ex49() {
  function pubSub() {
    const topics = {};
    return {
      subscribe(topic, fn) { (topics[topic] = topics[topic] || []).push(fn); },
      publish(topic, data) { (topics[topic] || []).forEach(fn => fn(data)); },
      unsubscribe(topic, fn) {
        if (topics[topic]) topics[topic] = topics[topic].filter(h => h !== fn);
      },
    };
  }
  const ps = pubSub();
  const messages = [];
  const handler = (data) => messages.push(data);
  ps.subscribe("news", handler);
  ps.publish("news", "Event A");
  ps.publish("news", "Event B");
  ps.unsubscribe("news", handler);
  ps.publish("news", "Event C");
  console.log("Ex49 — received messages:", messages.join(", "));
}

/** Cascading fallback callbacks */
function ex50() {
  function fallback(sources, cb) {
    function tryNext(i) {
      if (i >= sources.length) return cb(new Error("all sources failed"));
      sources[i]((err, val) => {
        if (!err) return cb(null, val);
        tryNext(i + 1);
      });
    }
    tryNext(0);
  }
  fallback([
    cb => cb(new Error("source 1 failed")),
    cb => cb(new Error("source 2 failed")),
    cb => cb(null, "source 3 succeeded"),
  ], (err, val) => console.log("Ex50 — fallback result:", err ? err.message : val));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Sync examples — call directly
  ex01(); ex02(); ex03(); ex04(); ex05();
  ex06(); ex07(); ex08(); ex09(); ex10();
  ex11(); ex12(); ex13();
  // Intermediate (mostly async via setTimeout — fire and forget; output appears async)
  ex14(); ex15(); ex16(); ex17(); ex18();
  ex19(); ex20(); ex21(); ex22(); ex23();
  ex24(); ex25(); ex26();
  // Nested
  ex27(); ex28(); ex29(); ex30(); ex31();
  ex32(); ex33(); ex34(); ex35(); ex36();
  ex37(); ex38();
  // Advanced
  ex39(); ex40(); ex41(); ex42(); ex43();
  ex44(); ex45(); ex46(); ex47(); ex48();
  ex49(); ex50();
}

main();
