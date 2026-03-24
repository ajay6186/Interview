// ============================================================================
// Examples 3.2 — Promises  (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================================

"use strict";

// ─── BASIC (1–13) ────────────────────────────────────────────────────────────

/** new Promise — resolve */
async function ex01() {
  const p = new Promise(resolve => resolve(42));
  const v = await p;
  console.log("Ex01 —", v);
}

/** new Promise — reject + catch */
async function ex02() {
  const p = new Promise((_, reject) => reject(new Error("oops")));
  const msg = await p.catch(e => e.message);
  console.log("Ex02 —", msg);
}

/** .then() transforms value */
async function ex03() {
  const result = await Promise.resolve(10).then(x => x * 3);
  console.log("Ex03 —", result);
}

/** .catch() recovers from rejection */
async function ex04() {
  const result = await Promise.reject(new Error("bad")).catch(() => "recovered");
  console.log("Ex04 —", result);
}

/** .finally() always runs */
async function ex05() {
  let fin = false;
  await Promise.resolve("ok").finally(() => { fin = true; });
  console.log("Ex05 — finally ran:", fin);
}

/** Promise.resolve() shorthand */
async function ex06() {
  const v = await Promise.resolve("hello");
  console.log("Ex06 —", v);
}

/** Promise.reject() shorthand */
async function ex07() {
  const err = await Promise.reject(new Error("rejected")).catch(e => e.message);
  console.log("Ex07 —", err);
}

/** Chaining .then() calls */
async function ex08() {
  const result = await Promise.resolve(1)
    .then(x => x + 1)
    .then(x => x * 2)
    .then(x => x + 10);
  console.log("Ex08 —", result); // (1+1)*2+10 = 14
}

/** Error propagates through chain */
async function ex09() {
  const result = await Promise.resolve(5)
    .then(x => { throw new Error("chain error at " + x); })
    .then(x => x * 10) // skipped
    .catch(e => "caught: " + e.message);
  console.log("Ex09 —", result);
}

/** Return value in .then() becomes next resolved value */
async function ex10() {
  const result = await Promise.resolve("A")
    .then(v => v + "B")
    .then(v => v + "C");
  console.log("Ex10 —", result);
}

/** Recovering in .catch() continues chain */
async function ex11() {
  const result = await Promise.reject(new Error("fail"))
    .catch(() => 0)
    .then(v => v + 100);
  console.log("Ex11 —", result);
}

/** Promise wrapping setTimeout */
async function ex12() {
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  const start = Date.now();
  await delay(10);
  const elapsed = Date.now() - start;
  console.log("Ex12 — delayed (>= 10ms):", elapsed >= 10);
}

/** Promise resolves with another promise (flattening) */
async function ex13() {
  const inner = Promise.resolve(99);
  const result = await Promise.resolve(inner);
  console.log("Ex13 —", result); // 99, not a Promise
}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────────────────────

/** Promise.all — all resolve */
async function ex14() {
  const results = await Promise.all([
    Promise.resolve(1),
    Promise.resolve(2),
    Promise.resolve(3),
  ]);
  console.log("Ex14 —", results.join(", "));
}

/** Promise.all — one rejects */
async function ex15() {
  const result = await Promise.all([
    Promise.resolve(1),
    Promise.reject(new Error("failed")),
    Promise.resolve(3),
  ]).catch(e => "caught: " + e.message);
  console.log("Ex15 —", result);
}

/** Promise.race — first to settle wins */
async function ex16() {
  const slow = new Promise(resolve => setTimeout(() => resolve("slow"), 50));
  const fast = new Promise(resolve => setTimeout(() => resolve("fast"), 0));
  const winner = await Promise.race([slow, fast]);
  console.log("Ex16 — race winner:", winner);
}

/** Promise.allSettled — all outcomes */
async function ex17() {
  const results = await Promise.allSettled([
    Promise.resolve("ok"),
    Promise.reject(new Error("no")),
    Promise.resolve(42),
  ]);
  results.forEach((r, i) =>
    console.log(`Ex17 — [${i}] ${r.status}:`, r.status === "fulfilled" ? r.value : r.reason.message)
  );
}

/** Promise.any — first fulfilled */
async function ex18() {
  const result = await Promise.any([
    Promise.reject(new Error("a")),
    Promise.resolve("b"),
    Promise.resolve("c"),
  ]);
  console.log("Ex18 — any first:", result);
}

/** Chained transforms (pipeline) */
async function ex19() {
  const process = val =>
    Promise.resolve(val)
      .then(v => v.trim())
      .then(v => v.toUpperCase())
      .then(v => `[${v}]`);
  const result = await process("  hello  ");
  console.log("Ex19 —", result);
}

/** Flat chain (no nesting) */
async function ex20() {
  function step(n) { return Promise.resolve(n + 1); }
  const result = await step(0).then(step).then(step).then(step);
  console.log("Ex20 — flat chain result:", result);
}

/** Error recovery in chain */
async function ex21() {
  const result = await Promise.reject(new Error("initial error"))
    .catch(() => 10)
    .then(v => v * 5);
  console.log("Ex21 — recovered and continued:", result);
}

/** Retry a promise-returning function */
async function ex22() {
  let attempts = 0;
  async function retryPromise(fn, times) {
    for (let i = 0; i < times; i++) {
      try { return await fn(); } catch (e) { if (i === times - 1) throw e; }
    }
  }
  const result = await retryPromise(async () => {
    attempts++;
    if (attempts < 3) throw new Error("not yet");
    return "success";
  }, 5);
  console.log("Ex22 — retry result:", result, "attempts:", attempts);
}

/** Delay/sleep promise */
async function ex23() {
  function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
  const t = Date.now();
  await sleep(10);
  console.log("Ex23 — slept (>= 10ms):", Date.now() - t >= 10);
}

/** Timeout race */
async function ex24() {
  function timeoutRace(p, ms) {
    const timer = new Promise((_, reject) => setTimeout(() => reject(new Error("timed out")), ms));
    return Promise.race([p, timer]);
  }
  const fast = Promise.resolve("done");
  const result = await timeoutRace(fast, 100);
  console.log("Ex24 — timeout race:", result);
}

/** Promise memoize */
async function ex25() {
  const cache = {};
  function memoize(fn) {
    return (key) => {
      if (!cache[key]) cache[key] = fn(key);
      return cache[key];
    };
  }
  let n = 0;
  const fetch = memoize(key => Promise.resolve(++n));
  await fetch("a"); await fetch("a"); await fetch("b");
  console.log("Ex25 — memoize calls (expect 2):", n);
}

/** Promise-based validator */
async function ex26() {
  async function validate(value) {
    if (typeof value !== "string") throw new Error("must be string");
    if (value.length < 3) throw new Error("too short");
    return value.toUpperCase();
  }
  const ok = await validate("hello");
  console.log("Ex26 — valid:", ok);
  const err = await validate("ab").catch(e => "error: " + e.message);
  console.log("Ex26 — invalid:", err);
}

// ─── NESTED (27–38) ──────────────────────────────────────────────────────────

/** Sequential (series) with reduce */
async function ex27() {
  const tasks = [1, 2, 3, 4, 5].map(n => () => Promise.resolve(n * 2));
  const results = [];
  await tasks.reduce((chain, task) =>
    chain.then(() => task().then(v => results.push(v))),
    Promise.resolve()
  );
  console.log("Ex27 — sequential results:", results.join(", "));
}

/** Parallel with mapping */
async function ex28() {
  const ids = [1, 2, 3, 4, 5];
  const users = await Promise.all(ids.map(id =>
    Promise.resolve({ id, name: "User" + id })
  ));
  console.log("Ex28 — parallel users:", users.map(u => u.name).join(", "));
}

/** Cancellable promise (manual cancel token) */
async function ex29() {
  function cancellable(fn) {
    let cancelled = false;
    const promise = new Promise((resolve, reject) => {
      fn(resolve, reject, () => cancelled);
    });
    return {
      promise,
      cancel() { cancelled = true; },
    };
  }
  const { promise, cancel } = cancellable((resolve, reject, isCancelled) => {
    setTimeout(() => {
      if (isCancelled()) reject(new Error("cancelled"));
      else resolve("done");
    }, 0);
  });
  const result = await promise;
  console.log("Ex29 — cancellable (not cancelled):", result);
}

/** Lazy promise — only executes when .then() called */
async function ex30() {
  function lazy(fn) {
    let p = null;
    return {
      then(onFulfilled, onRejected) {
        if (!p) p = fn();
        return p.then(onFulfilled, onRejected);
      },
    };
  }
  let n = 0;
  const lz = lazy(() => { n++; return Promise.resolve("lazy value"); });
  await lz;
  await lz; // same promise reused
  console.log("Ex30 — lazy executed times:", n); // 1
}

/** Deferred promise */
async function ex31() {
  function deferred() {
    let resolve, reject;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
  }
  const d = deferred();
  setTimeout(() => d.resolve(77), 0);
  const v = await d.promise;
  console.log("Ex31 — deferred resolved:", v);
}

/** Memoized promise (cache per key) */
async function ex32() {
  function memoizePromise(fn) {
    const map = new Map();
    return (key) => {
      if (!map.has(key)) map.set(key, fn(key));
      return map.get(key);
    };
  }
  let calls = 0;
  const lookup = memoizePromise(k => { calls++; return Promise.resolve(k.toUpperCase()); });
  const [a, b, c] = await Promise.all([lookup("x"), lookup("x"), lookup("y")]);
  console.log("Ex32 — memo results:", a, b, c, "calls:", calls); // calls=2
}

/** Waterfall via async/await */
async function ex33() {
  async function waterfall(fns, init) {
    let acc = init;
    for (const fn of fns) acc = await fn(acc);
    return acc;
  }
  const result = await waterfall(
    [v => Promise.resolve(v + 1), v => Promise.resolve(v * 2), v => Promise.resolve(v - 3)],
    5
  );
  console.log("Ex33 — waterfall result:", result); // (5+1)*2-3 = 9
}

/** Conditional chain */
async function ex34() {
  async function conditionalChain(value, condition, ifTrue, ifFalse) {
    return condition(value) ? ifTrue(value) : ifFalse(value);
  }
  const r1 = await conditionalChain(10, v => v > 5, v => Promise.resolve("big: " + v), v => Promise.resolve("small: " + v));
  const r2 = await conditionalChain(3, v => v > 5, v => Promise.resolve("big: " + v), v => Promise.resolve("small: " + v));
  console.log("Ex34 —", r1, "|", r2);
}

/** Promise pool — limit concurrency */
async function ex35() {
  async function promisePool(tasks, concurrency) {
    const results = [];
    const executing = [];
    for (const task of tasks) {
      const p = Promise.resolve().then(() => task());
      results.push(p);
      if (concurrency <= tasks.length) {
        const e = p.then(() => executing.splice(executing.indexOf(e), 1));
        executing.push(e);
        if (executing.length >= concurrency) await Promise.race(executing);
      }
    }
    return Promise.all(results);
  }
  const results = await promisePool(
    [1, 2, 3, 4, 5].map(n => () => Promise.resolve(n * 10)),
    2
  );
  console.log("Ex35 — promise pool:", results.join(", "));
}

/** Promisify Node-style callback fn */
async function ex36() {
  function promisify(fn) {
    return (...args) => new Promise((res, rej) =>
      fn(...args, (err, val) => err ? rej(err) : res(val))
    );
  }
  function addCb(a, b, cb) { setTimeout(() => cb(null, a + b), 0); }
  const addP = promisify(addCb);
  const sum = await addP(3, 7);
  console.log("Ex36 — promisified add:", sum);
}

/** Async retry with backoff */
async function ex37() {
  async function retryBackoff(fn, attempts, baseDelay = 0) {
    for (let i = 0; i < attempts; i++) {
      try { return await fn(); }
      catch (e) {
        if (i === attempts - 1) throw e;
        await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, i)));
      }
    }
  }
  let tries = 0;
  const result = await retryBackoff(async () => {
    if (++tries < 3) throw new Error("not ready");
    return "ok after " + tries;
  }, 5);
  console.log("Ex37 — retry backoff:", result);
}

/** Promise queue with concurrency limit */
async function ex38() {
  class PromiseQueue {
    constructor(concurrency) {
      this.concurrency = concurrency;
      this.running = 0;
      this.queue = [];
    }
    add(task) {
      return new Promise((resolve, reject) => {
        this.queue.push({ task, resolve, reject });
        this._run();
      });
    }
    _run() {
      while (this.running < this.concurrency && this.queue.length) {
        const { task, resolve, reject } = this.queue.shift();
        this.running++;
        task().then(resolve, reject).finally(() => { this.running--; this._run(); });
      }
    }
  }
  const pq = new PromiseQueue(2);
  const order = [];
  await Promise.all([1, 2, 3, 4].map(n =>
    pq.add(() => Promise.resolve(order.push(n)))
  ));
  console.log("Ex38 — queue order:", order.join(", "));
}

// ─── ADVANCED (39–50) ────────────────────────────────────────────────────────

/** Custom thenable object */
async function ex39() {
  const customThenable = {
    then(onFulfilled) {
      setTimeout(() => onFulfilled("custom thenable value"), 0);
    },
  };
  const result = await customThenable;
  console.log("Ex39 —", result);
}

/** Monadic promise chain (bind pattern) */
async function ex40() {
  function bind(p, f) { return p.then(f); }
  const result = await bind(
    bind(Promise.resolve(3), x => Promise.resolve(x + 2)),
    x => Promise.resolve(x * 4)
  );
  console.log("Ex40 — monadic bind:", result); // 20
}

/** Promisified EventEmitter-like (one-time event) */
async function ex41() {
  function once(emitter, event) {
    return new Promise(resolve => {
      function handler(...args) {
        emitter.off(event, handler);
        resolve(args.length === 1 ? args[0] : args);
      }
      emitter.on(event, handler);
    });
  }
  // Minimal emitter stub
  const listeners = {};
  const emitter = {
    on(e, fn) { (listeners[e] = listeners[e] || []).push(fn); },
    off(e, fn) { listeners[e] = (listeners[e] || []).filter(h => h !== fn); },
    emit(e, ...args) { (listeners[e] || []).forEach(h => h(...args)); },
  };
  const p = once(emitter, "ready");
  emitter.emit("ready", 42);
  const val = await p;
  console.log("Ex41 — once event:", val);
}

/** Async retry with exponential backoff (real delays=0 for tests) */
async function ex42() {
  async function withRetry(fn, { maxAttempts = 3, delay = 0 } = {}) {
    let lastErr;
    for (let i = 0; i < maxAttempts; i++) {
      try { return await fn(i); }
      catch (e) { lastErr = e; if (i < maxAttempts - 1) await new Promise(r => setTimeout(r, delay)); }
    }
    throw lastErr;
  }
  let n = 0;
  const r = await withRetry(async (attempt) => {
    n++;
    if (attempt < 2) throw new Error("not yet");
    return "succeeded on attempt " + attempt;
  }, { maxAttempts: 5, delay: 0 });
  console.log("Ex42 —", r, "(n=" + n + ")");
}

/** Circuit breaker pattern */
async function ex43() {
  function circuitBreaker(fn, { threshold = 3, resetAfter = 100 } = {}) {
    let failures = 0;
    let open = false;
    return async (...args) => {
      if (open) throw new Error("circuit open");
      try {
        const result = await fn(...args);
        failures = 0;
        return result;
      } catch (e) {
        failures++;
        if (failures >= threshold) {
          open = true;
          setTimeout(() => { open = false; failures = 0; }, resetAfter);
        }
        throw e;
      }
    };
  }
  let calls = 0;
  const breaker = circuitBreaker(async () => { calls++; throw new Error("service down"); }, { threshold: 2 });
  const results = [];
  for (let i = 0; i < 4; i++) {
    results.push(await breaker().catch(e => e.message));
  }
  console.log("Ex43 — circuit breaker:", results.join(", "));
}

/** Promise-based pub/sub */
async function ex44() {
  function promisePubSub() {
    const subscribers = {};
    return {
      subscribe(topic) {
        let resolve;
        const p = new Promise(r => { resolve = r; });
        (subscribers[topic] = subscribers[topic] || []).push(resolve);
        return p;
      },
      publish(topic, data) {
        (subscribers[topic] || []).forEach(r => r(data));
        subscribers[topic] = [];
      },
    };
  }
  const ps = promisePubSub();
  const p1 = ps.subscribe("news");
  const p2 = ps.subscribe("news");
  ps.publish("news", "breaking!");
  const [a, b] = await Promise.all([p1, p2]);
  console.log("Ex44 — pub/sub:", a, b);
}

/** Async semaphore */
async function ex45() {
  function semaphore(n) {
    let count = 0;
    const waiting = [];
    function release() {
      count--;
      if (waiting.length) { count++; waiting.shift()(); }
    }
    return async function acquire(fn) {
      await new Promise(resolve => {
        if (count < n) { count++; resolve(); }
        else waiting.push(resolve);
      });
      try { return await fn(); }
      finally { release(); }
    };
  }
  const sem = semaphore(2);
  const order = [];
  await Promise.all([1, 2, 3, 4].map(i =>
    sem(() => Promise.resolve(order.push(i)))
  ));
  console.log("Ex45 — semaphore tasks completed:", order.length);
}

/** Async mutex */
async function ex46() {
  function createMutex() {
    let locked = false;
    const queue = [];
    return async function withLock(fn) {
      await new Promise(resolve => {
        if (!locked) { locked = true; resolve(); }
        else queue.push(resolve);
      });
      try { return await fn(); }
      finally {
        if (queue.length) { queue.shift()(); }
        else locked = false;
      }
    };
  }
  const mutex = createMutex();
  let counter = 0;
  await Promise.all(Array.from({ length: 5 }, () =>
    mutex(async () => { const c = counter; counter = c + 1; })
  ));
  console.log("Ex46 — mutex counter:", counter); // 5 (no race conditions)
}

/** Promise streaming (chunk by chunk) */
async function ex47() {
  async function* streamChunks(data, chunkSize) {
    for (let i = 0; i < data.length; i += chunkSize) {
      yield data.slice(i, i + chunkSize);
    }
  }
  const chunks = [];
  for await (const chunk of streamChunks("Hello, World!", 4)) {
    chunks.push(chunk);
  }
  console.log("Ex47 — streamed chunks:", chunks.join("|"));
}

/** Promise-based state machine */
async function ex48() {
  function promiseFSM(initial, transitions) {
    let state = initial;
    return {
      async send(event) {
        const key = `${state}:${event}`;
        if (!transitions[key]) throw new Error(`No transition: ${state} + ${event}`);
        state = await Promise.resolve(transitions[key](state));
        return state;
      },
      getState() { return state; },
    };
  }
  const fsm = promiseFSM("idle", {
    "idle:start": () => "running",
    "running:finish": () => "done",
    "done:reset": () => "idle",
  });
  await fsm.send("start");
  await fsm.send("finish");
  await fsm.send("reset");
  console.log("Ex48 — FSM final state:", fsm.getState()); // idle
}

/** Async generator consuming promise stream */
async function ex49() {
  async function* range(start, end, delayMs = 0) {
    for (let i = start; i <= end; i++) {
      await new Promise(r => setTimeout(r, delayMs));
      yield i;
    }
  }
  const results = [];
  for await (const n of range(1, 5)) {
    results.push(n * n);
  }
  console.log("Ex49 — async range squares:", results.join(", "));
}

/** Async dependency injection */
async function ex50() {
  async function createContainer(factories) {
    const instances = {};
    async function resolve(name) {
      if (instances[name]) return instances[name];
      if (!factories[name]) throw new Error("Unknown dependency: " + name);
      instances[name] = await factories[name](resolve);
      return instances[name];
    }
    return resolve;
  }
  const container = await createContainer({
    config: async () => ({ dbUrl: "localhost", port: 3000 }),
    db: async (resolve) => { const cfg = await resolve("config"); return { url: cfg.dbUrl }; },
    service: async (resolve) => { const db = await resolve("db"); return { query: () => `querying ${db.url}` }; },
  });
  const service = await container("service");
  console.log("Ex50 — DI result:", service.query());
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
