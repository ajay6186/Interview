// ============================================================================
// Examples 3.4 — Event Loop  (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================================

"use strict";

// ─── BASIC (1–13) ────────────────────────────────────────────────────────────

/** Synchronous code runs first */
async function ex01() {
  const log = [];
  log.push("A");
  log.push("B");
  log.push("C");
  console.log("Ex01 — sync order:", log.join(""));
}

/** Promise microtask runs after current sync block */
async function ex02() {
  const log = [];
  Promise.resolve().then(() => log.push("micro"));
  log.push("sync");
  await Promise.resolve(); // drain microtasks
  console.log("Ex02 — order:", log.join(", "));
}

/** setTimeout is a macrotask (runs after microtasks) */
async function ex03() {
  const log = [];
  setTimeout(() => log.push("macro"), 0);
  Promise.resolve().then(() => log.push("micro"));
  log.push("sync");
  await new Promise(r => setTimeout(r, 10));
  console.log("Ex03 — order:", log.join(", ")); // sync, micro, macro
}

/** Combined order: sync → Promise microtask → setTimeout */
async function ex04() {
  const log = [];
  setTimeout(() => log.push("timeout"), 0);
  Promise.resolve().then(() => log.push("promise"));
  log.push("synchronous");
  await new Promise(r => setTimeout(r, 10));
  console.log("Ex04 —", log.join(" -> "));
}

/** queueMicrotask behaves like Promise.then */
async function ex05() {
  const log = [];
  queueMicrotask(() => log.push("queueMicrotask"));
  Promise.resolve().then(() => log.push("promise.then"));
  log.push("sync");
  await Promise.resolve(); await Promise.resolve();
  console.log("Ex05 — micro queue:", log.join(", "));
}

/** process.nextTick (Node.js) runs before Promise microtasks */
async function ex06() {
  const log = [];
  process.nextTick(() => log.push("nextTick"));
  Promise.resolve().then(() => log.push("promise"));
  log.push("sync");
  await new Promise(r => setTimeout(r, 0));
  console.log("Ex06 — nextTick first:", log.join(", "));
}

/** Nested setTimeout — inner fires later */
async function ex07() {
  const log = [];
  setTimeout(() => {
    log.push("outer");
    setTimeout(() => log.push("inner"), 0);
  }, 0);
  await new Promise(r => setTimeout(r, 20));
  console.log("Ex07 — nested timeout:", log.join(", "));
}

/** clearTimeout prevents callback */
async function ex08() {
  let fired = false;
  const id = setTimeout(() => { fired = true; }, 50);
  clearTimeout(id);
  await new Promise(r => setTimeout(r, 100));
  console.log("Ex08 — clearTimeout prevented:", !fired);
}

/** setInterval fires repeatedly */
async function ex09() {
  let count = 0;
  await new Promise(resolve => {
    const id = setInterval(() => {
      count++;
      if (count >= 3) { clearInterval(id); resolve(); }
    }, 5);
  });
  console.log("Ex09 — interval fired:", count, "times");
}

/** clearInterval stops interval */
async function ex10() {
  let count = 0;
  await new Promise(resolve => {
    const id = setInterval(() => count++, 1);
    setTimeout(() => { clearInterval(id); resolve(); }, 15);
  });
  console.log("Ex10 — interval stopped, count >= 1:", count >= 1);
}

/** Microtask queue drains fully before next macrotask */
async function ex11() {
  const log = [];
  setTimeout(() => log.push("macro"), 0);
  Promise.resolve()
    .then(() => log.push("micro1"))
    .then(() => log.push("micro2"))
    .then(() => log.push("micro3"));
  await new Promise(r => setTimeout(r, 10));
  console.log("Ex11 — all micros before macro:", log.join(", "));
}

/** async/await order — await suspends at microtask level */
async function ex12() {
  const log = [];
  async function inner() { log.push("before await"); await Promise.resolve(); log.push("after await"); }
  inner();
  log.push("sync after call");
  await Promise.resolve(); await Promise.resolve();
  console.log("Ex12 — async order:", log.join(", "));
}

/** Multiple microtask sources interleave by insertion order */
async function ex13() {
  const log = [];
  Promise.resolve().then(() => log.push("p1"));
  queueMicrotask(() => log.push("qm1"));
  Promise.resolve().then(() => log.push("p2"));
  queueMicrotask(() => log.push("qm2"));
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  console.log("Ex13 — interleaved:", log.join(", "));
}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────────────────────

/** Microtask queue depth — deep chain still before macro */
async function ex14() {
  const log = [];
  setTimeout(() => log.push("macro"), 0);
  let p = Promise.resolve();
  for (let i = 0; i < 5; i++) p = p.then(() => log.push("micro" + i));
  await new Promise(r => setTimeout(r, 20));
  console.log("Ex14 — deep micro chain before macro:", log[log.length - 2] === "micro4" && log[log.length - 1] === "macro");
}

/** Promise chain ordering with values */
async function ex15() {
  const result = await Promise.resolve(1)
    .then(x => x + 1)
    .then(x => x * 3)
    .then(x => `value:${x}`);
  console.log("Ex15 — promise chain:", result);
}

/** async/await execution order in detail */
async function ex16() {
  const log = [];
  async function fn() {
    log.push("1");
    const x = await Promise.resolve(2);
    log.push("3:" + x);
    return x + 1;
  }
  log.push("0");
  const p = fn();
  log.push("2");
  const v = await p;
  log.push("4:" + v);
  console.log("Ex16 — async order:", log.join(", "));
}

/** Promise.resolve().then().then() — each .then is a separate microtask turn */
async function ex17() {
  const log = [];
  Promise.resolve()
    .then(() => { log.push("t1"); })
    .then(() => { log.push("t2"); })
    .then(() => { log.push("t3"); });
  Promise.resolve().then(() => log.push("other"));
  await new Promise(r => setTimeout(r, 10));
  console.log("Ex17 — interleaved .then:", log.join(", ")); // t1, other, t2, t3
}

/** Task yielding with setTimeout(0) */
async function ex18() {
  function yieldToEventLoop() { return new Promise(r => setTimeout(r, 0)); }
  let interrupted = false;
  setTimeout(() => { interrupted = true; }, 0);
  // Before yielding, interrupt hasn't run
  const before = interrupted;
  await yieldToEventLoop();
  const after = interrupted;
  console.log("Ex18 — before yield:", before, "after yield:", after);
}

/** Microtask flood — many microtasks before macrotask */
async function ex19() {
  const log = [];
  setTimeout(() => log.push("macro"), 0);
  let p = Promise.resolve();
  for (let i = 0; i < 100; i++) p = p.then(() => {});
  p.then(() => log.push("last micro"));
  await new Promise(r => setTimeout(r, 50));
  console.log("Ex19 — last micro before macro:", log[0] === "last micro" && log[1] === "macro");
}

/** setTimeout(0) for deferral to next tick */
async function ex20() {
  const log = [];
  function deferLog(msg) { setTimeout(() => log.push(msg), 0); }
  log.push("sync1");
  deferLog("deferred1");
  log.push("sync2");
  deferLog("deferred2");
  await new Promise(r => setTimeout(r, 10));
  console.log("Ex20 — deferred:", log.join(", "));
}

/** requestAnimationFrame concept (using setTimeout as stand-in) */
async function ex21() {
  function raf(fn) { return setTimeout(fn, 16); } // ~60fps
  const log = [];
  raf(() => log.push("frame1"));
  raf(() => log.push("frame2"));
  await new Promise(r => setTimeout(r, 50));
  console.log("Ex21 — raf frames:", log.join(", "));
}

/** MessageChannel concept — microtask-like scheduling */
async function ex22() {
  // MessageChannel posts tasks as microtasks in browsers; in Node use process.nextTick
  const log = [];
  process.nextTick(() => log.push("nextTick1"));
  process.nextTick(() => log.push("nextTick2"));
  Promise.resolve().then(() => log.push("promise"));
  await new Promise(r => setTimeout(r, 0));
  console.log("Ex22 — nextTick before promise:", log.join(", "));
}

/** Task prioritization — nextTick > promise microtask > setTimeout */
async function ex23() {
  const log = [];
  setTimeout(() => log.push("setTimeout"), 0);
  Promise.resolve().then(() => log.push("promise"));
  process.nextTick(() => log.push("nextTick"));
  queueMicrotask(() => log.push("queueMicrotask"));
  await new Promise(r => setTimeout(r, 10));
  console.log("Ex23 — priority:", log.join(", "));
}

/** Nested microtask scheduling */
async function ex24() {
  const log = [];
  Promise.resolve().then(() => {
    log.push("outer");
    Promise.resolve().then(() => log.push("inner")); // added to microtask queue
  });
  Promise.resolve().then(() => log.push("sibling"));
  await new Promise(r => setTimeout(r, 10));
  console.log("Ex24 — nested microtask:", log.join(", ")); // outer, sibling, inner
}

/** async function before/after sync code */
async function ex25() {
  const log = [];
  async function doWork() {
    await null; // suspends here
    log.push("async resumed");
    return 42;
  }
  log.push("before call");
  const p = doWork();
  log.push("after call");
  const result = await p;
  log.push("awaited: " + result);
  console.log("Ex25 —", log.join(", "));
}

/** Concurrent async functions share event loop */
async function ex26() {
  const log = [];
  async function taskA() { log.push("A1"); await null; log.push("A2"); }
  async function taskB() { log.push("B1"); await null; log.push("B2"); }
  const [, ] = await Promise.all([taskA(), taskB()]);
  console.log("Ex26 — interleaved tasks:", log.join(", ")); // A1, B1, A2, B2
}

// ─── NESTED (27–38) ──────────────────────────────────────────────────────────

/** Interleaved promises and timeouts */
async function ex27() {
  const log = [];
  setTimeout(() => log.push("t1"), 0);
  Promise.resolve().then(() => log.push("p1"));
  setTimeout(() => log.push("t2"), 0);
  Promise.resolve().then(() => log.push("p2"));
  await new Promise(r => setTimeout(r, 20));
  console.log("Ex27 — interleaved:", log.join(", ")); // p1, p2, t1, t2
}

/** Recursive microtask — careful, can starve macrotasks */
async function ex28() {
  function scheduleMicrotasks(count) {
    return new Promise(resolve => {
      let n = 0;
      function step() {
        n++;
        if (n >= count) resolve(n);
        else queueMicrotask(step);
      }
      queueMicrotask(step);
    });
  }
  const result = await scheduleMicrotasks(5);
  console.log("Ex28 — recursive microtasks:", result);
}

/** Concurrent tasks ordering */
async function ex29() {
  async function taskWithLog(name, log) {
    log.push(name + ":start");
    await Promise.resolve();
    log.push(name + ":end");
  }
  const log = [];
  await Promise.all([taskWithLog("A", log), taskWithLog("B", log), taskWithLog("C", log)]);
  console.log("Ex29 — concurrent tasks:", log.join(", "));
}

/** Event batching concept */
async function ex30() {
  function batchEvents(handler) {
    let batch = [];
    let scheduled = false;
    return function enqueue(event) {
      batch.push(event);
      if (!scheduled) {
        scheduled = true;
        queueMicrotask(() => {
          handler([...batch]);
          batch = [];
          scheduled = false;
        });
      }
    };
  }
  const received = [];
  const emit = batchEvents(events => received.push(...events));
  emit("a"); emit("b"); emit("c");
  await Promise.resolve();
  console.log("Ex30 — batched events:", received.join(", "));
}

/** Debounce using event loop */
async function ex31() {
  function debounce(fn, ms) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  }
  let count = 0;
  const inc = debounce(() => count++, 10);
  inc(); inc(); inc();
  await new Promise(r => setTimeout(r, 30));
  console.log("Ex31 — debounce count (expect 1):", count);
}

/** Throttle using event loop */
async function ex32() {
  function throttle(fn, ms) {
    let last = 0;
    return function (...args) {
      const now = Date.now();
      if (now - last >= ms) { last = now; fn(...args); }
    };
  }
  let count = 0;
  const inc = throttle(() => count++, 20);
  inc(); inc(); inc();
  console.log("Ex32 — throttle count (expect 1):", count);
}

/** Cooperative scheduler — yield every N ops */
async function ex33() {
  async function cooperativeWork(items, processItem, yieldEvery = 5) {
    const results = [];
    for (let i = 0; i < items.length; i++) {
      results.push(processItem(items[i]));
      if ((i + 1) % yieldEvery === 0) {
        await new Promise(r => setTimeout(r, 0));
      }
    }
    return results;
  }
  const items = Array.from({ length: 20 }, (_, i) => i + 1);
  const results = await cooperativeWork(items, x => x * 2, 5);
  console.log("Ex33 — cooperative work:", results.slice(0, 5).join(", "), "...", results[19]);
}

/** Task chunking — break large work into pieces */
async function ex34() {
  async function processInChunks(data, fn, size) {
    const results = [];
    for (let i = 0; i < data.length; i += size) {
      const chunk = data.slice(i, i + size);
      results.push(...chunk.map(fn));
      await new Promise(r => setTimeout(r, 0)); // yield
    }
    return results;
  }
  const data = Array.from({ length: 30 }, (_, i) => i);
  const results = await processInChunks(data, x => x * x, 10);
  console.log("Ex34 — chunked (first 3):", results.slice(0, 3).join(", "), "length:", results.length);
}

/** Async coordination — barrier pattern */
async function ex35() {
  function createBarrier(n) {
    let count = 0;
    let resolve;
    const promise = new Promise(r => { resolve = r; });
    return {
      arrive() { if (++count >= n) resolve(); },
      wait() { return promise; },
    };
  }
  const barrier = createBarrier(3);
  const log = [];
  async function participant(id) {
    log.push(`${id}:working`);
    await Promise.resolve();
    barrier.arrive();
    log.push(`${id}:arrived`);
    await barrier.wait();
    log.push(`${id}:released`);
  }
  await Promise.all([participant(1), participant(2), participant(3)]);
  console.log("Ex35 — barrier events:", log.length);
}

/** Async scheduling with priority queues */
async function ex36() {
  class PriorityScheduler {
    constructor() { this.queues = { high: [], normal: [], low: [] }; }
    schedule(priority, fn) {
      return new Promise(resolve => {
        (this.queues[priority] || this.queues.normal).push(() => fn().then(resolve));
      });
    }
    async flush() {
      for (const key of ["high", "normal", "low"]) {
        for (const task of this.queues[key]) await task();
        this.queues[key] = [];
      }
    }
  }
  const sched = new PriorityScheduler();
  const log = [];
  sched.schedule("low", async () => log.push("low"));
  sched.schedule("high", async () => log.push("high"));
  sched.schedule("normal", async () => log.push("normal"));
  await sched.flush();
  console.log("Ex36 — priority flush:", log.join(", "));
}

/** setImmediate vs setTimeout(0) concept (using nested setTimeout) */
async function ex37() {
  // In Node.js: setImmediate fires after I/O, before setTimeout(0) in some cases
  // Here we simulate using back-to-back timeouts
  const log = [];
  setTimeout(() => log.push("timeout1"), 0);
  setTimeout(() => log.push("timeout2"), 0);
  await new Promise(r => setTimeout(r, 20));
  console.log("Ex37 — sequential timeouts:", log.join(", "));
}

/** Event loop monitoring — detect stalls */
async function ex38() {
  let lastTick = Date.now();
  let maxGap = 0;
  const monitor = setInterval(() => {
    const now = Date.now();
    maxGap = Math.max(maxGap, now - lastTick);
    lastTick = now;
  }, 1);
  // Simulate some async work
  await new Promise(r => setTimeout(r, 30));
  clearInterval(monitor);
  console.log("Ex38 — max gap (ms, should be small):", maxGap < 50);
}

// ─── ADVANCED (39–50) ────────────────────────────────────────────────────────

/** Custom task scheduler with FIFO queue */
async function ex39() {
  class TaskScheduler {
    constructor() {
      this.queue = [];
      this.running = false;
    }
    add(fn) {
      return new Promise((resolve, reject) => {
        this.queue.push({ fn, resolve, reject });
        if (!this.running) this._run();
      });
    }
    async _run() {
      this.running = true;
      while (this.queue.length) {
        const { fn, resolve, reject } = this.queue.shift();
        try { resolve(await fn()); } catch (e) { reject(e); }
      }
      this.running = false;
    }
  }
  const sched = new TaskScheduler();
  const results = await Promise.all([
    sched.add(async () => "A"),
    sched.add(async () => "B"),
    sched.add(async () => "C"),
  ]);
  console.log("Ex39 — scheduler:", results.join(", "));
}

/** Work stealing concept (simplified) */
async function ex40() {
  function createWorkerPool(size) {
    const queues = Array.from({ length: size }, () => []);
    let round = 0;
    return {
      submit(fn) {
        const worker = round++ % size;
        return new Promise((res, rej) => {
          queues[worker].push({ fn, res, rej });
        });
      },
      async run() {
        const all = queues.flatMap((q, wi) =>
          q.map(({ fn, res, rej }) =>
            fn().then(res).catch(rej)
          )
        );
        await Promise.all(all);
      },
    };
  }
  const pool = createWorkerPool(3);
  const results = [];
  for (let i = 1; i <= 6; i++) pool.submit(async () => results.push(i));
  await pool.run();
  console.log("Ex40 — work pool tasks:", results.length);
}

/** Fiber-like cooperative scheduling */
async function ex41() {
  class Fiber {
    constructor(fn) { this.gen = fn(); }
    async run() {
      const results = [];
      for await (const v of this.gen) results.push(v);
      return results;
    }
  }
  async function* workload() {
    for (let i = 1; i <= 5; i++) {
      await new Promise(r => setTimeout(r, 0)); // yield to event loop
      yield i * i;
    }
  }
  const fiber = new Fiber(workload);
  const results = await fiber.run();
  console.log("Ex41 — fiber results:", results.join(", "));
}

/** Idle callback concept — defer low-priority work */
async function ex42() {
  // requestIdleCallback concept: run work when event loop is idle
  function requestIdleTask(fn, timeout = 50) {
    return new Promise(resolve => {
      setTimeout(() => resolve(fn()), timeout);
    });
  }
  const result = await requestIdleTask(() => "idle work done", 10);
  console.log("Ex42 — idle task:", result);
}

/** Shared state coordination with async */
async function ex43() {
  function createSharedState(initial) {
    let state = initial;
    const subscribers = [];
    return {
      get() { return state; },
      set(val) {
        state = val;
        subscribers.forEach(fn => fn(val));
      },
      subscribe(fn) { subscribers.push(fn); },
      waitForValue(predicate) {
        return new Promise(resolve => {
          if (predicate(state)) return resolve(state);
          function check(val) { if (predicate(val)) { subscribers.splice(subscribers.indexOf(check), 1); resolve(val); } }
          subscribers.push(check);
        });
      },
    };
  }
  const shared = createSharedState(0);
  const p = shared.waitForValue(v => v >= 3);
  shared.set(1); shared.set(2); shared.set(3);
  const result = await p;
  console.log("Ex43 — shared state reached:", result);
}

/** Backpressure concept — slow consumer */
async function ex44() {
  async function* producer(n) {
    for (let i = 0; i < n; i++) yield i;
  }
  async function consume(gen, capacity) {
    const buffer = [];
    for await (const item of gen) {
      buffer.push(item);
      if (buffer.length > capacity) {
        await new Promise(r => setTimeout(r, 0)); // simulate slow consumer
      }
    }
    return buffer;
  }
  const result = await consume(producer(10), 3);
  console.log("Ex44 — backpressure consumed:", result.length, "items");
}

/** Structured concurrency — scope-based task management */
async function ex45() {
  async function withScope(fn) {
    const tasks = [];
    const scope = {
      spawn(task) {
        const p = task();
        tasks.push(p);
        return p;
      },
    };
    const result = await fn(scope);
    await Promise.all(tasks);
    return result;
  }
  const collected = [];
  await withScope(async (scope) => {
    scope.spawn(async () => { collected.push(1); });
    scope.spawn(async () => { collected.push(2); });
    scope.spawn(async () => { collected.push(3); });
  });
  console.log("Ex45 — structured scope tasks:", collected.length);
}

/** Web Worker communication concept */
async function ex46() {
  // In browsers, workers run in separate threads.
  // Here we simulate with async message passing.
  function createWorker(handler) {
    const inbox = [];
    const outbox = [];
    let waiting = null;
    async function processMessages() {
      while (true) {
        if (inbox.length) {
          const msg = inbox.shift();
          const result = await handler(msg);
          outbox.push(result);
          if (waiting) { waiting(); waiting = null; }
        } else {
          await new Promise(r => setTimeout(r, 0));
        }
        if (inbox.length === 0 && outbox.length >= 3) break;
      }
    }
    return {
      postMessage(msg) { inbox.push(msg); },
      getMessage() {
        return new Promise(resolve => {
          if (outbox.length) return resolve(outbox.shift());
          waiting = () => resolve(outbox.shift());
        });
      },
      start: processMessages,
    };
  }
  const worker = createWorker(async msg => msg.value * 2);
  const p = worker.start();
  worker.postMessage({ value: 5 });
  worker.postMessage({ value: 10 });
  worker.postMessage({ value: 15 });
  await p;
  console.log("Ex46 — worker concept: simulated", 3, "messages processed");
}

/** Async event loop metrics */
async function ex47() {
  function measureAsync(fn) {
    return async (...args) => {
      const start = Date.now();
      const result = await fn(...args);
      const duration = Date.now() - start;
      return { result, duration };
    };
  }
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const measured = measureAsync(async () => { await sleep(10); return 42; });
  const { result, duration } = await measured();
  console.log("Ex47 — measured result:", result, "duration >= 10ms:", duration >= 10);
}

/** Promise-based mutex for serial access */
async function ex48() {
  function createMutex() {
    let locked = Promise.resolve();
    return function withLock(fn) {
      const result = locked.then(() => fn());
      locked = result.catch(() => {});
      return result;
    };
  }
  const withLock = createMutex();
  let counter = 0;
  const increments = Array.from({ length: 5 }, () =>
    withLock(async () => { const c = counter; await null; counter = c + 1; })
  );
  await Promise.all(increments);
  console.log("Ex48 — mutex counter (expect 5):", counter);
}

/** Async event bus with wildcard topics */
async function ex49() {
  function createEventBus() {
    const handlers = {};
    return {
      on(pattern, fn) { (handlers[pattern] = handlers[pattern] || []).push(fn); },
      async emit(event, data) {
        const matched = Object.keys(handlers).filter(p => p === "*" || p === event);
        for (const p of matched) {
          await Promise.all(handlers[p].map(fn => fn(data)));
        }
      },
    };
  }
  const bus = createEventBus();
  const log = [];
  bus.on("user:login", async d => log.push("login:" + d.name));
  bus.on("*", async d => log.push("any:" + JSON.stringify(d)));
  await bus.emit("user:login", { name: "Alice" });
  console.log("Ex49 — event bus:", log.join(", "));
}

/** Event loop health check / watchdog */
async function ex50() {
  async function watchdog(fn, timeoutMs) {
    let resolved = false;
    const timer = new Promise((_, reject) =>
      setTimeout(() => { if (!resolved) reject(new Error("watchdog timeout")); }, timeoutMs)
    );
    return Promise.race([
      fn().then(r => { resolved = true; return r; }),
      timer,
    ]);
  }
  const fast = await watchdog(async () => { await null; return "healthy"; }, 100);
  console.log("Ex50 — watchdog:", fast);
  const slow = await watchdog(async () => {
    await new Promise(r => setTimeout(r, 200));
    return "slow";
  }, 50).catch(e => e.message);
  console.log("Ex50 — watchdog timeout:", slow);
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
