// ============================================================================
// Examples 3.3 — Async/Await  (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================================

"use strict";

// ─── BASIC (1–13) ────────────────────────────────────────────────────────────

/** Basic async function returning a value */
async function ex01() {
  async function greet(name) { return `Hello, ${name}!`; }
  const msg = await greet("Alice");
  console.log("Ex01 —", msg);
}

/** await a Promise */
async function ex02() {
  const val = await Promise.resolve(42);
  console.log("Ex02 —", val);
}

/** Return from async is always a Promise */
async function ex03() {
  async function getNumber() { return 99; }
  const p = getNumber();
  console.log("Ex03 — is Promise:", p instanceof Promise);
  console.log("Ex03 — value:", await p);
}

/** try/catch for async errors */
async function ex04() {
  async function fail() { throw new Error("async error"); }
  try {
    await fail();
  } catch (e) {
    console.log("Ex04 — caught:", e.message);
  }
}

/** finally always runs in async */
async function ex05() {
  let fin = false;
  try {
    await Promise.resolve("ok");
  } finally {
    fin = true;
  }
  console.log("Ex05 — finally ran:", fin);
}

/** Async IIFE */
async function ex06() {
  const result = await (async () => {
    const a = await Promise.resolve(10);
    const b = await Promise.resolve(20);
    return a + b;
  })();
  console.log("Ex06 — IIFE result:", result);
}

/** await Promise.resolve() */
async function ex07() {
  const v = await Promise.resolve("immediate");
  console.log("Ex07 —", v);
}

/** Async error propagation through await */
async function ex08() {
  async function inner() { throw new Error("inner error"); }
  async function outer() { return await inner(); }
  try {
    await outer();
  } catch (e) {
    console.log("Ex08 — propagated:", e.message);
  }
}

/** Async function + .then() chaining */
async function ex09() {
  async function double(x) { return x * 2; }
  double(21).then(v => console.log("Ex09 —", v));
}

/** Top-level await concept (wrapped in async fn here) */
async function ex10() {
  // Simulates top-level await: const data = await fetch(url);
  async function fetchData() { return [1, 2, 3]; }
  const data = await fetchData();
  console.log("Ex10 — data:", data.join(", "));
}

/** Await in a loop (sequential) */
async function ex11() {
  async function double(x) { return x * 2; }
  const results = [];
  for (const n of [1, 2, 3, 4]) {
    results.push(await double(n));
  }
  console.log("Ex11 — sequential loop:", results.join(", "));
}

/** Await with conditional */
async function ex12() {
  async function classify(n) {
    if (n > 0) return "positive";
    if (n < 0) return "negative";
    return "zero";
  }
  const labels = await Promise.all([3, -1, 0].map(classify));
  console.log("Ex12 —", labels.join(", "));
}

/** Async getter pattern */
async function ex13() {
  function createStore(initial) {
    let value = initial;
    return {
      async get() { return value; },
      async set(v) { value = v; },
    };
  }
  const store = createStore(10);
  await store.set(42);
  const v = await store.get();
  console.log("Ex13 — store value:", v);
}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────────────────────

/** Sequential await (one by one) */
async function ex14() {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const results = [];
  for (const ms of [0, 0, 0]) {
    await sleep(ms);
    results.push("done");
  }
  console.log("Ex14 — sequential:", results.join(", "));
}

/** Parallel await with Promise.all */
async function ex15() {
  const sleep = (ms, v) => new Promise(r => setTimeout(() => r(v), ms));
  const [a, b, c] = await Promise.all([sleep(0, 1), sleep(0, 2), sleep(0, 3)]);
  console.log("Ex15 — parallel:", a, b, c);
}

/** Async input validation */
async function ex16() {
  async function validateEmail(email) {
    if (!email.includes("@")) throw new Error("invalid email");
    return email.toLowerCase();
  }
  const ok = await validateEmail("Alice@Example.com");
  console.log("Ex16 — valid:", ok);
  const err = await validateEmail("notanemail").catch(e => "error: " + e.message);
  console.log("Ex16 — invalid:", err);
}

/** Async factory function */
async function ex17() {
  async function createUser(name) {
    const id = Math.floor(Math.random() * 1000);
    return { id, name, createdAt: new Date().toISOString().slice(0, 10) };
  }
  const user = await createUser("Bob");
  console.log("Ex17 — created user:", user.name, "id:", typeof user.id);
}

/** Async class method */
async function ex18() {
  class DataService {
    constructor(data) { this.data = data; }
    async findById(id) {
      return this.data.find(item => item.id === id) || null;
    }
  }
  const svc = new DataService([{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }]);
  const user = await svc.findById(2);
  console.log("Ex18 — found:", user.name);
}

/** Async filter */
async function ex19() {
  async function asyncFilter(arr, predicate) {
    const results = await Promise.all(arr.map(item => predicate(item)));
    return arr.filter((_, i) => results[i]);
  }
  const evens = await asyncFilter([1, 2, 3, 4, 5, 6], async x => x % 2 === 0);
  console.log("Ex19 — async filter:", evens.join(", "));
}

/** Async map */
async function ex20() {
  async function asyncMap(arr, fn) {
    return Promise.all(arr.map(fn));
  }
  const doubled = await asyncMap([1, 2, 3, 4], async x => x * 2);
  console.log("Ex20 — async map:", doubled.join(", "));
}

/** Async reduce */
async function ex21() {
  async function asyncReduce(arr, fn, init) {
    let acc = init;
    for (const item of arr) acc = await fn(acc, item);
    return acc;
  }
  const sum = await asyncReduce([1, 2, 3, 4, 5], async (acc, v) => acc + v, 0);
  console.log("Ex21 — async reduce:", sum);
}

/** Error wrapping with context */
async function ex22() {
  async function withContext(fn, context) {
    try {
      return await fn();
    } catch (e) {
      throw new Error(`[${context}] ${e.message}`);
    }
  }
  const err = await withContext(async () => { throw new Error("db error"); }, "UserService")
    .catch(e => e.message);
  console.log("Ex22 — contextual error:", err);
}

/** Async timeout wrapper */
async function ex23() {
  function withTimeout(p, ms) {
    const timer = new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms));
    return Promise.race([p, timer]);
  }
  const result = await withTimeout(Promise.resolve("fast"), 100);
  console.log("Ex23 — timeout wrapper:", result);
  const timedOut = await withTimeout(new Promise(() => {}), 10).catch(e => e.message);
  console.log("Ex23 — timed out:", timedOut);
}

/** Async pipeline with transforms */
async function ex24() {
  async function pipeline(value, ...fns) {
    for (const fn of fns) value = await fn(value);
    return value;
  }
  const result = await pipeline(
    "  hello world  ",
    async s => s.trim(),
    async s => s.split(" ").map(w => w[0].toUpperCase() + w.slice(1)).join(" "),
    async s => `<b>${s}</b>`,
  );
  console.log("Ex24 —", result);
}

/** Async memoize */
async function ex25() {
  function asyncMemo(fn) {
    const cache = new Map();
    return async (key) => {
      if (!cache.has(key)) cache.set(key, await fn(key));
      return cache.get(key);
    };
  }
  let n = 0;
  const expensive = asyncMemo(async k => { n++; return k.toUpperCase(); });
  await expensive("foo"); await expensive("foo"); await expensive("bar");
  console.log("Ex25 — memo calls (expect 2):", n);
}

/** Async function composition */
async function ex26() {
  function composeAsync(...fns) {
    return async (x) => {
      let result = x;
      for (const fn of fns) result = await fn(result);
      return result;
    };
  }
  const transform = composeAsync(
    async x => x + 1,
    async x => x * 2,
    async x => x - 3,
  );
  const result = await transform(5); // (5+1)*2-3 = 9
  console.log("Ex26 — composed async:", result);
}

// ─── NESTED (27–38) ──────────────────────────────────────────────────────────

/** Async pipeline with error handling at each step */
async function ex27() {
  async function safePipeline(value, steps) {
    let current = value;
    for (const [name, fn] of steps) {
      try {
        current = await fn(current);
      } catch (e) {
        return { ok: false, step: name, error: e.message };
      }
    }
    return { ok: true, result: current };
  }
  const result = await safePipeline("hello", [
    ["trim", async s => s.trim()],
    ["upper", async s => s.toUpperCase()],
    ["wrap", async s => `[${s}]`],
  ]);
  console.log("Ex27 —", JSON.stringify(result));
}

/** Async retry with max attempts */
async function ex28() {
  async function retry(fn, maxAttempts) {
    for (let i = 0; i < maxAttempts; i++) {
      try { return await fn(); }
      catch (e) { if (i === maxAttempts - 1) throw e; }
    }
  }
  let n = 0;
  const result = await retry(async () => {
    if (++n < 3) throw new Error("not ready");
    return "ready after " + n;
  }, 5);
  console.log("Ex28 — retry:", result);
}

/** Async memoize with cache invalidation */
async function ex29() {
  function asyncMemoTTL(fn, ttl) {
    const cache = new Map();
    return async (key) => {
      const entry = cache.get(key);
      if (entry && Date.now() - entry.ts < ttl) return entry.value;
      const value = await fn(key);
      cache.set(key, { value, ts: Date.now() });
      return value;
    };
  }
  let n = 0;
  const lookup = asyncMemoTTL(async k => { n++; return k + "_result"; }, 1000);
  await lookup("a"); await lookup("a"); await lookup("b");
  console.log("Ex29 — TTL memo calls:", n); // 2
}

/** Async semaphore */
async function ex30() {
  function asyncSemaphore(permits) {
    let available = permits;
    const queue = [];
    return {
      async acquire() {
        if (available > 0) { available--; return; }
        await new Promise(resolve => queue.push(resolve));
        available--;
      },
      release() {
        available++;
        if (queue.length) { queue.shift()(); }
      },
    };
  }
  const sem = asyncSemaphore(2);
  const log = [];
  async function task(id) {
    await sem.acquire();
    log.push(`start:${id}`);
    await Promise.resolve();
    log.push(`end:${id}`);
    sem.release();
  }
  await Promise.all([task(1), task(2), task(3)]);
  console.log("Ex30 — semaphore tasks:", log.length, "events");
}

/** Async queue (FIFO, serial) */
async function ex31() {
  function asyncQueue() {
    let tail = Promise.resolve();
    return function enqueue(fn) {
      tail = tail.then(() => fn());
      return tail;
    };
  }
  const q = asyncQueue();
  const results = [];
  await Promise.all([
    q(() => Promise.resolve(results.push(1))),
    q(() => Promise.resolve(results.push(2))),
    q(() => Promise.resolve(results.push(3))),
  ]);
  console.log("Ex31 — async queue:", results.join(", "));
}

/** Async event listener (one-shot) */
async function ex32() {
  function waitFor(emitter, event) {
    return new Promise(resolve => {
      function handler(data) {
        emitter.off(event, handler);
        resolve(data);
      }
      emitter.on(event, handler);
    });
  }
  const listeners = {};
  const emitter = {
    on(e, fn) { (listeners[e] = listeners[e] || []).push(fn); },
    off(e, fn) { listeners[e] = (listeners[e] || []).filter(h => h !== fn); },
    emit(e, data) { (listeners[e] || []).forEach(h => h(data)); },
  };
  const p = waitFor(emitter, "data");
  emitter.emit("data", 123);
  const val = await p;
  console.log("Ex32 — event listener:", val);
}

/** Async middleware composition */
async function ex33() {
  function compose(middlewares) {
    return async function dispatch(ctx, index = 0) {
      if (index >= middlewares.length) return ctx;
      return middlewares[index](ctx, () => dispatch(ctx, index + 1));
    };
  }
  const chain = compose([
    async (ctx, next) => { ctx.a = 1; return next(); },
    async (ctx, next) => { ctx.b = 2; return next(); },
    async (ctx, next) => { ctx.c = 3; return next(); },
  ]);
  const ctx = await chain({});
  console.log("Ex33 — middleware ctx:", JSON.stringify(ctx));
}

/** Async state machine */
async function ex34() {
  async function createFSM(initial, handlers) {
    let state = initial;
    return {
      async dispatch(action) {
        const handler = handlers[`${state}:${action}`];
        if (!handler) throw new Error(`No handler: ${state} + ${action}`);
        state = await handler(state);
        return state;
      },
      getState() { return state; },
    };
  }
  const fsm = await createFSM("idle", {
    "idle:init": async () => "loading",
    "loading:done": async () => "ready",
    "ready:reset": async () => "idle",
  });
  await fsm.dispatch("init");
  await fsm.dispatch("done");
  console.log("Ex34 — FSM state:", fsm.getState());
}

/** Async resource pool */
async function ex35() {
  function createPool(createResource, size) {
    const resources = Array.from({ length: size }, (_, i) => ({ id: i, busy: false }));
    const waiters = [];
    async function acquire() {
      const available = resources.find(r => !r.busy);
      if (available) { available.busy = true; return available; }
      return new Promise(resolve => waiters.push(resolve));
    }
    function release(resource) {
      resource.busy = false;
      if (waiters.length) {
        resource.busy = true;
        waiters.shift()(resource);
      }
    }
    return { acquire, release };
  }
  const pool = createPool(null, 2);
  const used = [];
  async function useResource(name) {
    const r = await pool.acquire();
    used.push(name);
    await Promise.resolve();
    pool.release(r);
  }
  await Promise.all(["a", "b", "c"].map(useResource));
  console.log("Ex35 — pool tasks done:", used.length);
}

/** Async observable (pull-based) */
async function ex36() {
  async function* observable(values, delayMs = 0) {
    for (const v of values) {
      await new Promise(r => setTimeout(r, delayMs));
      yield v;
    }
  }
  const results = [];
  for await (const v of observable([10, 20, 30])) {
    results.push(v);
  }
  console.log("Ex36 — async observable:", results.join(", "));
}

/** Structured error handling with async */
async function ex37() {
  class AppError extends Error {
    constructor(message, code) {
      super(message);
      this.code = code;
      this.name = "AppError";
    }
  }
  async function fetchResource(id) {
    if (id < 0) throw new AppError("Invalid ID", "INVALID_ID");
    if (id === 0) throw new AppError("Not found", "NOT_FOUND");
    return { id, data: "resource_" + id };
  }
  const results = await Promise.all(
    [1, 0, -1].map(id => fetchResource(id).catch(e => ({ error: e.code })))
  );
  results.forEach((r, i) =>
    console.log(`Ex37 — [${i}]:`, r.data || r.error)
  );
}

/** Async dependency chain */
async function ex38() {
  async function getConfig() { return { host: "localhost", port: 5432 }; }
  async function getConnection(config) { return { url: `${config.host}:${config.port}` }; }
  async function getRepository(conn) { return { find: (id) => `${conn.url}/records/${id}` }; }

  const config = await getConfig();
  const conn = await getConnection(config);
  const repo = await getRepository(conn);
  console.log("Ex38 — repo.find(42):", repo.find(42));
}

// ─── ADVANCED (39–50) ────────────────────────────────────────────────────────

/** Async generator */
async function ex39() {
  async function* generateSequence(start, end) {
    for (let i = start; i <= end; i++) {
      await new Promise(r => setTimeout(r, 0));
      yield i;
    }
  }
  const nums = [];
  for await (const n of generateSequence(1, 5)) nums.push(n);
  console.log("Ex39 — async gen:", nums.join(", "));
}

/** for await...of over async iterable */
async function ex40() {
  async function* lines(text) {
    for (const line of text.split("\n")) {
      yield line.trim();
    }
  }
  const result = [];
  for await (const line of lines("  hello\n  world\n  foo")) {
    if (line) result.push(line);
  }
  console.log("Ex40 — lines:", result.join(" | "));
}

/** Async iterator protocol */
async function ex41() {
  function asyncRange(from, to) {
    let current = from;
    return {
      [Symbol.asyncIterator]() { return this; },
      async next() {
        if (current > to) return { done: true };
        return { value: current++, done: false };
      },
    };
  }
  const values = [];
  for await (const n of asyncRange(1, 5)) values.push(n);
  console.log("Ex41 — async iterator:", values.join(", "));
}

/** Async transducer concept */
async function ex42() {
  async function transduce(source, ...fns) {
    let result = source;
    for (const fn of fns) {
      result = await Promise.all(result.map(fn));
    }
    return result;
  }
  const result = await transduce(
    [1, 2, 3, 4, 5],
    async x => x * 2,
    async x => x + 1,
  );
  console.log("Ex42 — transducer:", result.join(", "));
}

/** Async monad-like chain */
async function ex43() {
  class AsyncMaybe {
    constructor(value) { this._value = value; }
    static of(value) { return new AsyncMaybe(Promise.resolve(value)); }
    map(fn) {
      return new AsyncMaybe(this._value.then(v => v == null ? v : fn(v)));
    }
    async unwrap() { return this._value; }
  }
  const result = await AsyncMaybe.of(5)
    .map(x => x * 2)
    .map(x => x + 3)
    .unwrap();
  console.log("Ex43 — async maybe:", result); // 13

  const nullResult = await AsyncMaybe.of(null)
    .map(x => x * 2)
    .unwrap();
  console.log("Ex43 — null propagated:", nullResult); // null
}

/** Streaming data processing */
async function ex44() {
  async function* generateNumbers(count) {
    for (let i = 1; i <= count; i++) yield i;
  }
  async function* mapAsync(iterable, fn) {
    for await (const item of iterable) yield fn(item);
  }
  async function* filterAsync(iterable, pred) {
    for await (const item of iterable) if (pred(item)) yield item;
  }
  async function collectAsync(iterable) {
    const result = [];
    for await (const item of iterable) result.push(item);
    return result;
  }
  const result = await collectAsync(
    filterAsync(
      mapAsync(generateNumbers(10), x => x * x),
      x => x % 2 === 0
    )
  );
  console.log("Ex44 — stream pipeline:", result.join(", "));
}

/** Saga-like pattern (async step coordinator) */
async function ex45() {
  async function runSaga(saga) {
    const effects = [];
    const iterator = saga();
    let next = iterator.next();
    while (!next.done) {
      const effect = next.value;
      const result = await effect;
      effects.push(result);
      next = iterator.next(result);
    }
    return effects;
  }
  function* orderSaga() {
    const user = yield Promise.resolve({ id: 1, name: "Alice" });
    const inventory = yield Promise.resolve({ available: true });
    const order = yield Promise.resolve({ orderId: 42, userId: user.id });
    return order;
  }
  const effects = await runSaga(orderSaga);
  console.log("Ex45 — saga effects:", effects.length, "orderId:", effects[2].orderId);
}

/** Async cancellation with AbortController concept */
async function ex46() {
  function createAbortController() {
    let aborted = false;
    const listeners = [];
    return {
      signal: {
        get aborted() { return aborted; },
        addEventListener(_, fn) { listeners.push(fn); },
      },
      abort() {
        aborted = true;
        listeners.forEach(fn => fn());
      },
    };
  }
  async function cancellableTask(signal) {
    for (let i = 0; i < 5; i++) {
      if (signal.aborted) throw new Error("aborted at step " + i);
      await new Promise(r => setTimeout(r, 0));
    }
    return "completed";
  }
  const ctrl = createAbortController();
  const p = cancellableTask(ctrl.signal);
  ctrl.abort();
  const result = await p.catch(e => e.message);
  console.log("Ex46 — abort:", result);
}

/** Async DI container */
async function ex47() {
  async function buildContainer(definitions) {
    const singletons = {};
    async function get(name) {
      if (!(name in singletons)) {
        const factory = definitions[name];
        if (!factory) throw new Error("Unknown: " + name);
        singletons[name] = await factory(get);
      }
      return singletons[name];
    }
    return get;
  }
  const get = await buildContainer({
    config: async () => ({ port: 8080 }),
    logger: async (get) => {
      const cfg = await get("config");
      return { log: (msg) => `[port:${cfg.port}] ${msg}` };
    },
    server: async (get) => {
      const logger = await get("logger");
      return { start: () => logger.log("Server started") };
    },
  });
  const server = await get("server");
  console.log("Ex47 —", server.start());
}

/** Async concurrency limiter */
async function ex48() {
  async function withConcurrency(tasks, limit) {
    const results = [];
    const executing = new Set();
    for (const task of tasks) {
      const p = task().then(r => { results.push(r); executing.delete(p); });
      executing.add(p);
      if (executing.size >= limit) await Promise.race(executing);
    }
    await Promise.all(executing);
    return results;
  }
  const order = [];
  await withConcurrency(
    [1, 2, 3, 4, 5].map(i => async () => { order.push(i); return i; }),
    2
  );
  console.log("Ex48 — concurrency limit 2, tasks:", order.length);
}

/** Async observable with operators */
async function ex49() {
  class AsyncStream {
    constructor(gen) { this._gen = gen; }
    static from(values) {
      return new AsyncStream(async function* () { for (const v of values) yield v; });
    }
    map(fn) {
      const src = this._gen;
      return new AsyncStream(async function* () { for await (const v of src()) yield fn(v); });
    }
    filter(pred) {
      const src = this._gen;
      return new AsyncStream(async function* () { for await (const v of src()) if (pred(v)) yield v; });
    }
    async toArray() {
      const result = [];
      for await (const v of this._gen()) result.push(v);
      return result;
    }
  }
  const result = await AsyncStream.from([1, 2, 3, 4, 5, 6])
    .filter(x => x % 2 === 0)
    .map(x => x * x)
    .toArray();
  console.log("Ex49 — async stream:", result.join(", "));
}

/** Structured concurrency — all or nothing group */
async function ex50() {
  async function taskGroup(tasks) {
    const ac = { cancelled: false };
    try {
      return await Promise.all(
        tasks.map(task => task(ac))
      );
    } catch (e) {
      ac.cancelled = true;
      throw e;
    }
  }
  const results = await taskGroup([
    async (ctx) => { if (ctx.cancelled) throw new Error("cancelled"); return "task1"; },
    async (ctx) => { if (ctx.cancelled) throw new Error("cancelled"); return "task2"; },
    async (ctx) => { if (ctx.cancelled) throw new Error("cancelled"); return "task3"; },
  ]);
  console.log("Ex50 — task group:", results.join(", "));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  await ex01(); await ex02(); await ex03(); await ex04(); await ex05();
  await ex06(); await ex07(); await ex08(); await ex09(); await ex10();
  await ex11(); await ex12(); await ex13();
  await ex14(); await ex15(); await ex16(); await ex17(); await ex18();
  await ex19(); await ex20(); await ex21(); await ex22(); await ex23();
  await ex24(); await ex25(); await ex26();
  await ex27(); await ex28(); await ex29(); await ex30(); await ex31();
  await ex32(); await ex33(); await ex34(); await ex35(); await ex36();
  await ex37(); await ex38();
  await ex39(); await ex40(); await ex41(); await ex42(); await ex43();
  await ex44(); await ex45(); await ex46(); await ex47(); await ex48();
  await ex49(); await ex50();
}

main().catch(e => console.error("Error:", e));
