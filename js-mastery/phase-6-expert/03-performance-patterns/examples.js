// ============================================================================
// Examples 6.3 — Performance Patterns  (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================================
"use strict";

// ─── BASIC (1–13) ────────────────────────────────────────────────────────────

/** memoize basic: cache single-argument function results */
function ex01() {
  function memoize(fn) {
    const cache = new Map();
    return function(x) {
      if (cache.has(x)) return cache.get(x);
      const result = fn(x);
      cache.set(x, result);
      return result;
    };
  }
  let callCount = 0;
  const square = memoize(n => { callCount++; return n * n; });
  square(5); square(5); square(10); square(5);
  console.log("Ex01 — memoize basic:", square(5), "calls:", callCount);
}

/** memoize fibonacci: exponential → linear via memoization */
function ex02() {
  function memoize(fn) {
    const cache = new Map();
    return function(n) {
      if (cache.has(n)) return cache.get(n);
      const r = fn(n); cache.set(n, r); return r;
    };
  }
  const fib = memoize(function(n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
  });
  console.log("Ex02 — memoize fibonacci:", fib(10), fib(20), fib(30));
}

/** memoize with args hash: multi-argument memoization */
function ex03() {
  function memoize(fn) {
    const cache = new Map();
    return function(...args) {
      const key = JSON.stringify(args);
      if (cache.has(key)) return cache.get(key);
      const r = fn(...args); cache.set(key, r); return r;
    };
  }
  let calls = 0;
  const add = memoize((a, b) => { calls++; return a + b; });
  add(1, 2); add(1, 2); add(3, 4); add(1, 2);
  console.log("Ex03 — memoize multi-arg:", add(1, 2), "unique calls:", calls);
}

/** debounce basic: delay invocation until quiet period */
function ex04() {
  function debounce(fn, ms) {
    let timer = null;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  }
  let callCount = 0;
  const debounced = debounce(() => callCount++, 50);
  debounced(); debounced(); debounced();
  setTimeout(() => console.log("Ex04 — debounce calls (should be 1):", callCount), 100);
}

/** throttle basic: rate-limit to once per interval */
function ex05() {
  function throttle(fn, ms) {
    let lastCall = 0;
    return function(...args) {
      const now = Date.now();
      if (now - lastCall >= ms) { lastCall = now; return fn(...args); }
    };
  }
  let callCount = 0;
  const throttled = throttle(() => { callCount++; return callCount; }, 100);
  throttled(); throttled(); throttled();
  console.log("Ex05 — throttle calls (should be 1):", callCount);
}

/** lazy thunk: defer computation */
function ex06() {
  function lazy(fn) {
    let computed = false, value;
    return () => { if (!computed) { value = fn(); computed = true; } return value; };
  }
  let calls = 0;
  const expensiveData = lazy(() => { calls++; return Array.from({length: 100}, (_, i) => i).reduce((a, b) => a + b, 0); });
  expensiveData(); expensiveData(); expensiveData();
  console.log("Ex06 — lazy thunk:", expensiveData(), "computed times:", calls);
}

/** thunk evaluation: understand eager vs lazy */
function ex07() {
  // Eager: computed immediately
  const eagerStart = Date.now();
  const eagerVal = (() => { let s = 0; for (let i = 0; i < 1e5; i++) s += i; return s; })();
  const eagerTime = Date.now() - eagerStart;

  // Lazy: deferred until needed
  let lazyVal;
  const lazyThunk = () => {
    if (lazyVal === undefined) { let s = 0; for (let i = 0; i < 1e5; i++) s += i; lazyVal = s; }
    return lazyVal;
  };

  console.log("Ex07 — eager:", eagerVal, "lazy (on demand):", lazyThunk());
}

/** eager vs lazy: compare Array.from (eager) vs generator (lazy) */
function ex08() {
  // Eager: materialize all values
  const eager = Array.from({length: 1000000}, (_, i) => i * 2);
  const eagerFirst5 = eager.slice(0, 5);

  // Lazy: only compute what's needed
  function* lazyDoubles() { let i = 0; while (true) yield (i++) * 2; }
  const gen = lazyDoubles();
  const lazyFirst5 = Array.from({length: 5}, () => gen.next().value);

  console.log("Ex08 — eager first 5:", eagerFirst5, "lazy first 5:", lazyFirst5);
}

/** cache invalidation: TTL-based cache */
function ex09() {
  function createTTLCache(ttlMs) {
    const cache = new Map();
    return {
      get(key) {
        const entry = cache.get(key);
        if (!entry) return undefined;
        if (Date.now() - entry.timestamp > ttlMs) { cache.delete(key); return undefined; }
        return entry.value;
      },
      set(key, value) { cache.set(key, { value, timestamp: Date.now() }); }
    };
  }
  const ttlCache = createTTLCache(1000);
  ttlCache.set("key1", "value1");
  console.log("Ex09 — TTL cache get:", ttlCache.get("key1"), "miss:", ttlCache.get("key2"));
}

/** LRU concept: Map-based LRU Cache */
function ex10() {
  function LRUCache(capacity) {
    const map = new Map();
    return {
      get(key) {
        if (!map.has(key)) return -1;
        const val = map.get(key); map.delete(key); map.set(key, val); return val;
      },
      put(key, val) {
        if (map.has(key)) map.delete(key);
        else if (map.size >= capacity) map.delete(map.keys().next().value);
        map.set(key, val);
      },
      keys() { return [...map.keys()]; }
    };
  }
  const lru = LRUCache(3);
  lru.put("a", 1); lru.put("b", 2); lru.put("c", 3);
  lru.get("a"); // access a → b is now LRU
  lru.put("d", 4); // evicts b
  console.log("Ex10 — LRU cache keys:", lru.keys(), "b:", lru.get("b"));
}

/** object pool concept: reuse expensive objects */
function ex11() {
  function createPool(factory, reset, maxSize = 10) {
    const pool = [];
    return {
      acquire() { return pool.length ? reset(pool.pop()) : factory(); },
      release(obj) { if (pool.length < maxSize) pool.push(obj); },
      size() { return pool.length; }
    };
  }
  const bufferPool = createPool(
    () => new Array(1024).fill(0),
    buf => { buf.fill(0); return buf; }
  );
  const buf = bufferPool.acquire();
  buf[0] = 42;
  bufferPool.release(buf);
  const buf2 = bufferPool.acquire();
  console.log("Ex11 — object pool reuse:", buf2[0], "pool size:", bufferPool.size());
}

/** batch updates: coalesce multiple updates into one */
function ex12() {
  function createBatcher(flushFn, delay = 0) {
    const batch = [];
    let timer = null;
    return function(item) {
      batch.push(item);
      if (!timer) timer = setTimeout(() => { flushFn([...batch]); batch.length = 0; timer = null; }, delay);
    };
  }
  const flushed = [];
  const add = createBatcher(items => flushed.push(...items), 10);
  add(1); add(2); add(3);
  setTimeout(() => console.log("Ex12 — batched updates:", flushed), 50);
}

/** string intern pool: deduplicate string objects */
function ex13() {
  function createStringPool() {
    const pool = new Map();
    return {
      intern(str) {
        if (!pool.has(str)) pool.set(str, str);
        return pool.get(str);
      },
      size() { return pool.size; }
    };
  }
  const pool = createStringPool();
  const s1 = pool.intern("hello");
  const s2 = pool.intern("hello");
  const s3 = pool.intern("world");
  console.log("Ex13 — string pool:", s1 === s2, "pool size:", pool.size());
}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────────────────────

/** debounce leading/trailing: configurable debounce */
function ex14() {
  function debounce(fn, ms, { leading = false, trailing = true } = {}) {
    let timer = null, lastArgs = null;
    return function(...args) {
      if (leading && !timer) fn(...args);
      lastArgs = args;
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (trailing && lastArgs) fn(...lastArgs);
        timer = null; lastArgs = null;
      }, ms);
    };
  }
  let callLog = [];
  const d = debounce(x => callLog.push(x), 50, { leading: true, trailing: true });
  d("first"); d("second"); d("third");
  setTimeout(() => console.log("Ex14 — debounce leading+trailing log:", callLog), 100);
}

/** throttle leading/trailing: configurable throttle */
function ex15() {
  function throttle(fn, ms, { leading = true, trailing = true } = {}) {
    let lastCall = 0, timer = null;
    return function(...args) {
      const now = Date.now();
      const remaining = ms - (now - lastCall);
      if (leading && remaining <= 0) {
        lastCall = now; fn(...args);
      } else if (trailing) {
        clearTimeout(timer);
        timer = setTimeout(() => { lastCall = Date.now(); fn(...args); }, remaining > 0 ? remaining : ms);
      }
    };
  }
  let count = 0;
  const th = throttle(() => count++, 100);
  th(); th(); th();
  setTimeout(() => console.log("Ex15 — throttle count:", count), 150);
}

/** rAF throttle concept: throttle to animation frames */
function ex16() {
  // Simulate rAF with setTimeout(fn, 16) in Node
  function rafThrottle(fn) {
    let pending = false;
    return function(...args) {
      if (!pending) {
        pending = true;
        setTimeout(() => { fn(...args); pending = false; }, 16);
      }
    };
  }
  let renderCount = 0;
  const render = rafThrottle(() => renderCount++);
  render(); render(); render(); render(); render();
  setTimeout(() => console.log("Ex16 — rAF throttle renders:", renderCount), 50);
}

/** debounce input: simulate search-as-you-type */
function ex17() {
  function debounce(fn, ms) {
    let timer = null;
    return function(...args) { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
  }
  const searchLog = [];
  const search = debounce(query => searchLog.push("searching: " + query), 30);
  const inputs = ["j", "ja", "jav", "java", "javas", "javasc", "javascr", "javascript"];
  inputs.forEach((val, i) => setTimeout(() => search(val), i * 10));
  setTimeout(() => console.log("Ex17 — debounce search (only last):", searchLog), 200);
}

/** batch updates: group DOM-like updates */
function ex18() {
  function createUpdateBatcher() {
    const pending = new Set();
    let scheduled = false;
    return {
      scheduleUpdate(id) {
        pending.add(id);
        if (!scheduled) {
          scheduled = true;
          setTimeout(() => {
            console.log("Ex18 — batch flush ids:", [...pending]);
            pending.clear(); scheduled = false;
          }, 0);
        }
      }
    };
  }
  const batcher = createUpdateBatcher();
  batcher.scheduleUpdate("comp-1");
  batcher.scheduleUpdate("comp-2");
  batcher.scheduleUpdate("comp-1"); // deduplicated
  batcher.scheduleUpdate("comp-3");
}

/** virtual scrolling concept: only render visible items */
function ex19() {
  function virtualScroll(items, itemHeight, viewportHeight) {
    return function(scrollTop) {
      const startIdx = Math.floor(scrollTop / itemHeight);
      const visibleCount = Math.ceil(viewportHeight / itemHeight);
      const endIdx = Math.min(startIdx + visibleCount + 1, items.length);
      return {
        visibleItems: items.slice(startIdx, endIdx),
        startIdx,
        totalHeight: items.length * itemHeight,
        offsetY: startIdx * itemHeight
      };
    };
  }
  const items = Array.from({length: 10000}, (_, i) => `Item ${i}`);
  const scroll = virtualScroll(items, 40, 400);
  const viewport = scroll(1600);
  console.log("Ex19 — virtual scroll startIdx:", viewport.startIdx, "visible:", viewport.visibleItems.length);
}

/** time slicing concept: break long work into chunks */
function ex20() {
  function timeSlice(items, processFn, chunkSize, onDone) {
    let i = 0;
    function processChunk() {
      const end = Math.min(i + chunkSize, items.length);
      while (i < end) processFn(items[i++]);
      if (i < items.length) setTimeout(processChunk, 0);
      else onDone();
    }
    processChunk();
  }
  const results = [];
  const data = Array.from({length: 50}, (_, i) => i);
  timeSlice(data, x => results.push(x * 2), 10, () => {
    console.log("Ex20 — time sliced:", results.slice(0, 5), "...", results.length, "total");
  });
}

/** task scheduler: priority queue for tasks */
function ex21() {
  function createScheduler() {
    const queues = { high: [], normal: [], low: [] };
    return {
      add(task, priority = "normal") { queues[priority].push(task); },
      runAll() {
        const results = [];
        for (const level of ["high", "normal", "low"]) {
          while (queues[level].length) results.push(queues[level].shift()());
        }
        return results;
      }
    };
  }
  const sched = createScheduler();
  sched.add(() => "low-1", "low");
  sched.add(() => "high-1", "high");
  sched.add(() => "normal-1", "normal");
  sched.add(() => "high-2", "high");
  console.log("Ex21 — task scheduler:", sched.runAll());
}

/** memoize with WeakMap: for object arguments (avoids memory leaks) */
function ex22() {
  function memoizeWeak(fn) {
    const cache = new WeakMap();
    return function(obj) {
      if (cache.has(obj)) return cache.get(obj);
      const result = fn(obj);
      cache.set(obj, result);
      return result;
    };
  }
  let calls = 0;
  const getSize = memoizeWeak(obj => { calls++; return Object.keys(obj).length; });
  const o1 = { a: 1, b: 2, c: 3 };
  const o2 = { x: 10 };
  getSize(o1); getSize(o1); getSize(o2);
  console.log("Ex22 — WeakMap memoize:", getSize(o1), "calls:", calls);
}

/** LRU cache implementation: full LRU with order tracking */
function ex23() {
  class LRUCache {
    constructor(cap) { this.cap = cap; this.map = new Map(); }
    get(key) {
      if (!this.map.has(key)) return -1;
      const v = this.map.get(key); this.map.delete(key); this.map.set(key, v); return v;
    }
    put(key, val) {
      if (this.map.has(key)) this.map.delete(key);
      else if (this.map.size >= this.cap) this.map.delete(this.map.keys().next().value);
      this.map.set(key, val);
    }
    get order() { return [...this.map.keys()]; }
  }
  const lru = new LRUCache(3);
  ["a","b","c"].forEach((k, i) => lru.put(k, i + 1));
  lru.get("a"); // a is now MRU
  lru.put("d", 4); // evicts b (LRU)
  console.log("Ex23 — LRU order:", lru.order, "b:", lru.get("b"));
}

/** LFU cache concept: Least Frequently Used eviction */
function ex24() {
  class LFUCache {
    constructor(cap) {
      this.cap = cap; this.minFreq = 0;
      this.keyMap = new Map(); // key → {value, freq}
      this.freqMap = new Map(); // freq → Set of keys
    }
    _incrementFreq(key) {
      const { value, freq } = this.keyMap.get(key);
      this.freqMap.get(freq).delete(key);
      if (!this.freqMap.get(freq).size && freq === this.minFreq) this.minFreq++;
      const newFreq = freq + 1;
      if (!this.freqMap.has(newFreq)) this.freqMap.set(newFreq, new Set());
      this.freqMap.get(newFreq).add(key);
      this.keyMap.set(key, { value, freq: newFreq });
    }
    get(key) {
      if (!this.keyMap.has(key)) return -1;
      this._incrementFreq(key);
      return this.keyMap.get(key).value;
    }
    put(key, value) {
      if (!this.cap) return;
      if (this.keyMap.has(key)) { this.keyMap.get(key).value = value; this._incrementFreq(key); return; }
      if (this.keyMap.size >= this.cap) {
        const evictSet = this.freqMap.get(this.minFreq);
        const evict = evictSet.values().next().value;
        evictSet.delete(evict); this.keyMap.delete(evict);
      }
      this.keyMap.set(key, { value, freq: 1 });
      if (!this.freqMap.has(1)) this.freqMap.set(1, new Set());
      this.freqMap.get(1).add(key);
      this.minFreq = 1;
    }
  }
  const lfu = new LFUCache(2);
  lfu.put("a", 1); lfu.put("b", 2);
  lfu.get("a"); lfu.get("a"); // a freq = 3
  lfu.put("c", 3); // evicts b (freq=1)
  console.log("Ex24 — LFU cache b:", lfu.get("b"), "a:", lfu.get("a"), "c:", lfu.get("c"));
}

/** connection pool concept: limit concurrent connections */
function ex25() {
  function createConnectionPool(maxSize, createConn) {
    const free = [];
    const waiting = [];
    let total = 0;
    return {
      acquire() {
        return new Promise(resolve => {
          if (free.length) { resolve(free.pop()); return; }
          if (total < maxSize) { total++; resolve(createConn(total)); return; }
          waiting.push(resolve);
        });
      },
      release(conn) {
        if (waiting.length) { waiting.shift()(conn); }
        else free.push(conn);
      },
      stats() { return { free: free.length, total, waiting: waiting.length }; }
    };
  }
  const pool = createConnectionPool(3, id => ({ id, query: (sql) => `result of "${sql}" from conn ${id}` }));
  Promise.all([pool.acquire(), pool.acquire()]).then(([c1, c2]) => {
    console.log("Ex25 — connection pool:", c1.query("SELECT 1"), pool.stats());
    pool.release(c1); pool.release(c2);
  });
}

/** flyweight with pool: share common state */
function ex26() {
  function createFlyweightFactory() {
    const pool = new Map();
    return function(key, factory) {
      if (!pool.has(key)) pool.set(key, factory());
      return pool.get(key);
    };
  }
  const flyweight = createFlyweightFactory();
  const treeType = (name, color) => flyweight(`${name}-${color}`, () => ({ name, color, render: (x, y) => `${name}(${color}) at (${x},${y})` }));

  const oak = treeType("oak", "green");
  const oak2 = treeType("oak", "green");
  const pine = treeType("pine", "dark-green");
  console.log("Ex26 — flyweight shared:", oak === oak2, oak.render(10, 20), pine.render(30, 40));
}

// ─── NESTED (27–38) ──────────────────────────────────────────────────────────

/** incremental computation: only recompute changed parts */
function ex27() {
  function createIncrementalComputer() {
    const cache = new Map();
    return {
      compute(key, deps, fn) {
        const depsKey = JSON.stringify(deps);
        const cached = cache.get(key);
        if (cached && cached.depsKey === depsKey) return cached.value;
        const value = fn();
        cache.set(key, { value, depsKey });
        return value;
      }
    };
  }
  const computer = createIncrementalComputer();
  let computeCount = 0;
  const compute = (a, b) => computer.compute("sum", [a, b], () => { computeCount++; return a + b; });
  compute(1, 2); compute(1, 2); compute(3, 4); compute(1, 2);
  console.log("Ex27 — incremental sum:", compute(1, 2), "recomputes:", computeCount);
}

/** computed properties with deps: dependency tracking */
function ex28() {
  function createComputed(deps, fn) {
    let cached = null;
    let lastDepsSnapshot = null;
    return {
      get value() {
        const snapshot = deps.map(d => d());
        if (!lastDepsSnapshot || !snapshot.every((v, i) => v === lastDepsSnapshot[i])) {
          cached = fn(...snapshot);
          lastDepsSnapshot = snapshot;
        }
        return cached;
      }
    };
  }
  let a = 3, b = 4;
  const hypotenuse = createComputed([() => a, () => b], (x, y) => Math.sqrt(x*x + y*y));
  console.log("Ex28 — computed:", hypotenuse.value);
  a = 5;
  console.log("Ex28 — after a=5:", hypotenuse.value);
}

/** reactive computed: simple reactive system */
function ex29() {
  function reactive(initial) {
    let value = initial;
    const subscribers = new Set();
    return {
      get() { return value; },
      set(newVal) { value = newVal; subscribers.forEach(fn => fn(newVal)); },
      subscribe(fn) { subscribers.add(fn); return () => subscribers.delete(fn); }
    };
  }
  const count = reactive(0);
  const log = [];
  const unsub = count.subscribe(v => log.push(v));
  count.set(1); count.set(2); count.set(3);
  unsub();
  count.set(4); // no more subscription
  console.log("Ex29 — reactive:", log);
}

/** change detection: dirty checking */
function ex30() {
  function createChangeDetector(getState) {
    let lastState = JSON.stringify(getState());
    return {
      check() {
        const currentState = JSON.stringify(getState());
        const changed = currentState !== lastState;
        lastState = currentState;
        return changed;
      }
    };
  }
  const state = { items: [1, 2, 3], total: 6 };
  const detector = createChangeDetector(() => state);
  console.log("Ex30 — no change:", detector.check());
  state.items.push(4); state.total = 10;
  console.log("Ex30 — after mutation:", detector.check());
  console.log("Ex30 — no further change:", detector.check());
}

/** structural sharing: immutable update with shared structure */
function ex31() {
  function updatePath(obj, path, value) {
    const keys = path.split(".");
    if (keys.length === 1) return { ...obj, [keys[0]]: value };
    return { ...obj, [keys[0]]: updatePath(obj[keys[0]] || {}, keys.slice(1).join("."), value) };
  }
  const original = { user: { name: "Alice", address: { city: "NYC", zip: "10001" } } };
  const updated = updatePath(original, "user.address.city", "LA");
  console.log("Ex31 — structural sharing:", updated.user.address.city, original.user.address.city);
  console.log("Ex31 — shared ref:", original.user === updated.user, "top:", original === updated);
}

/** immutable data perf: use Object.freeze for perf guarantees */
function ex32() {
  function deepFreeze(obj) {
    Object.getOwnPropertyNames(obj).forEach(name => {
      const value = obj[name];
      if (typeof value === "object" && value !== null) deepFreeze(value);
    });
    return Object.freeze(obj);
  }
  const config = deepFreeze({ db: { host: "localhost", port: 5432 }, cache: { ttl: 300 } });
  let threw = false;
  try { config.db.host = "remotehost"; } catch(e) { threw = true; }
  console.log("Ex32 — deep freeze immutable:", config.db.host, "threw in strict mode:", threw);
}

/** virtual DOM diffing concept: minimal update finding */
function ex33() {
  function diff(oldTree, newTree) {
    const patches = [];
    function walk(oldNode, newNode, path) {
      if (oldNode === newNode) return;
      if (typeof oldNode !== typeof newNode || oldNode === null || newNode === null) {
        patches.push({ type: "REPLACE", path, node: newNode }); return;
      }
      if (typeof oldNode !== "object") {
        patches.push({ type: "TEXT", path, text: newNode }); return;
      }
      if (oldNode.tag !== newNode.tag) {
        patches.push({ type: "REPLACE", path, node: newNode }); return;
      }
      // Props diff
      const allProps = new Set([...Object.keys(oldNode.props || {}), ...Object.keys(newNode.props || {})]);
      allProps.forEach(k => {
        if ((oldNode.props || {})[k] !== (newNode.props || {})[k]) {
          patches.push({ type: "PROP", path, key: k, value: (newNode.props || {})[k] });
        }
      });
      const maxLen = Math.max((oldNode.children || []).length, (newNode.children || []).length);
      for (let i = 0; i < maxLen; i++) {
        walk((oldNode.children || [])[i], (newNode.children || [])[i], `${path}[${i}]`);
      }
    }
    walk(oldTree, newTree, "root");
    return patches;
  }
  const v1 = { tag: "div", props: { class: "container" }, children: [{ tag: "p", props: {}, children: ["Hello"] }] };
  const v2 = { tag: "div", props: { class: "box" }, children: [{ tag: "p", props: {}, children: ["World"] }] };
  const patches = diff(v1, v2);
  console.log("Ex33 — vdom diff patches:", patches.length, patches.map(p => p.type));
}

/** reconciliation concept: list key-based reconciliation */
function ex34() {
  function reconcile(oldList, newList) {
    const oldMap = new Map(oldList.map(item => [item.key, item]));
    const newMap = new Map(newList.map(item => [item.key, item]));
    const ops = [];
    newList.forEach(item => {
      if (!oldMap.has(item.key)) ops.push({ op: "INSERT", key: item.key, value: item.value });
      else if (oldMap.get(item.key).value !== item.value) ops.push({ op: "UPDATE", key: item.key, value: item.value });
    });
    oldList.forEach(item => { if (!newMap.has(item.key)) ops.push({ op: "DELETE", key: item.key }); });
    return ops;
  }
  const old = [{ key: "a", value: 1 }, { key: "b", value: 2 }, { key: "c", value: 3 }];
  const next = [{ key: "a", value: 1 }, { key: "b", value: 99 }, { key: "d", value: 4 }];
  console.log("Ex34 — reconcile:", reconcile(old, next));
}

/** fiber scheduling concept: cooperative task scheduling */
function ex35() {
  function createFiberScheduler(timeSlice = 5) {
    const queue = [];
    let running = false;
    function workLoop(deadline) {
      while (queue.length && (Date.now() - deadline < timeSlice)) {
        const task = queue.shift();
        task();
      }
      if (queue.length) setTimeout(() => workLoop(Date.now()), 0);
      else running = false;
    }
    return {
      schedule(task) {
        queue.push(task);
        if (!running) { running = true; setTimeout(() => workLoop(Date.now()), 0); }
      },
      get pending() { return queue.length; }
    };
  }
  const scheduler = createFiberScheduler();
  const done = [];
  for (let i = 1; i <= 5; i++) scheduler.schedule(() => done.push(i));
  setTimeout(() => console.log("Ex35 — fiber scheduler done:", done), 50);
}

/** time complexity helpers: measure operation complexity */
function ex36() {
  function measureTime(fn, ...args) {
    const start = Date.now();
    const result = fn(...args);
    return { result, ms: Date.now() - start };
  }
  // O(n) linear search
  function linearSearch(arr, target) { return arr.findIndex(x => x === target); }
  // O(log n) binary search
  function binarySearch(arr, target) {
    let lo = 0, hi = arr.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (arr[mid] === target) return mid;
      else if (arr[mid] < target) lo = mid + 1;
      else hi = mid - 1;
    }
    return -1;
  }
  const sorted = Array.from({length: 100000}, (_, i) => i * 2);
  const linearResult = measureTime(linearSearch, sorted, 99998);
  const binaryResult = measureTime(binarySearch, sorted, 99998);
  console.log("Ex36 — linear idx:", linearResult.result, "binary idx:", binaryResult.result);
}

/** cache warming: pre-populate cache for anticipated requests */
function ex37() {
  function createWarmableCache(fetchFn) {
    const cache = new Map();
    return {
      async warm(keys) {
        await Promise.all(keys.map(async k => cache.set(k, await fetchFn(k))));
      },
      async get(key) {
        if (!cache.has(key)) cache.set(key, await fetchFn(key));
        return cache.get(key);
      },
      has(key) { return cache.has(key); }
    };
  }
  const fetchFn = async key => `data-for-${key}`;
  const wc = createWarmableCache(fetchFn);
  wc.warm(["user:1", "user:2", "user:3"]).then(() => {
    wc.get("user:1").then(v => console.log("Ex37 — warmed cache:", v, "hit:", wc.has("user:2")));
  });
}

/** stampede prevention: single-flight pattern */
function ex38() {
  function singleFlight(fn) {
    const inflight = new Map();
    return function(key) {
      if (inflight.has(key)) return inflight.get(key);
      const promise = fn(key).finally(() => inflight.delete(key));
      inflight.set(key, promise);
      return promise;
    };
  }
  let fetchCount = 0;
  const fetch = singleFlight(async key => { fetchCount++; await new Promise(r => setTimeout(r, 10)); return `value-${key}`; });
  Promise.all([fetch("x"), fetch("x"), fetch("x")]).then(results => {
    console.log("Ex38 — single-flight results:", results, "fetches:", fetchCount);
  });
}

// ─── ADVANCED (39–50) ────────────────────────────────────────────────────────

/** incremental computation: memoize based on structural equality */
function ex39() {
  function shallowEqual(a, b) {
    if (a === b) return true;
    if (typeof a !== "object" || typeof b !== "object") return false;
    const ka = Object.keys(a), kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every(k => a[k] === b[k]);
  }
  function createSelector(inputFns, resultFn) {
    let lastInputs = null, lastResult = null;
    return function(...args) {
      const inputs = inputFns.map(fn => fn(...args));
      if (lastInputs && inputs.every((v, i) => shallowEqual(v, lastInputs[i]))) return lastResult;
      lastInputs = inputs; lastResult = resultFn(...inputs); return lastResult;
    };
  }
  const state = { items: [1, 2, 3, 4, 5], filter: "all" };
  const selectItems = createSelector([s => s.items], items => items.reduce((sum, x) => sum + x, 0));
  console.log("Ex39 — selector:", selectItems(state), selectItems(state));
}

/** computed properties with deps: Vue-like computed */
function ex40() {
  function computed(fn) {
    let dirty = true, value;
    return {
      get() { if (dirty) { value = fn(); dirty = false; } return value; },
      invalidate() { dirty = true; }
    };
  }
  let x = 5, y = 10;
  const sum = computed(() => x + y);
  console.log("Ex40 — computed first:", sum.get()); // 15
  sum.invalidate(); x = 20;
  console.log("Ex40 — after invalidate:", sum.get()); // 30
}

/** reactive computed: derived state with auto-invalidation */
function ex41() {
  const effects = new Set();
  let currentEffect = null;
  function reactive(val) {
    const deps = new Set();
    return {
      get() { if (currentEffect) deps.add(currentEffect); return val; },
      set(newVal) { val = newVal; deps.forEach(fn => fn()); }
    };
  }
  function watchEffect(fn) {
    currentEffect = fn;
    fn();
    currentEffect = null;
    return () => {};
  }
  const count = reactive(0);
  const log = [];
  watchEffect(() => log.push(count.get()));
  count.set(1); count.set(2); count.set(3);
  console.log("Ex41 — reactive effects log:", log);
}

/** change detection: zone-based change detection */
function ex42() {
  function createZone(onStable) {
    let pendingMicrotasks = 0;
    return {
      run(fn) {
        pendingMicrotasks++;
        try { return fn(); } finally {
          pendingMicrotasks--;
          if (pendingMicrotasks === 0) onStable();
        }
      }
    };
  }
  const renders = [];
  const zone = createZone(() => renders.push("stable"));
  zone.run(() => { /* simulated work */ });
  zone.run(() => { /* more work */ });
  console.log("Ex42 — zone stability events:", renders);
}

/** structural sharing for perf: persistent data structures */
function ex43() {
  // Persistent stack: each push creates new version sharing tail
  function emptyStack() { return null; }
  function push(stack, value) { return { value, tail: stack, size: (stack ? stack.size : 0) + 1 }; }
  function pop(stack) { return stack ? stack.tail : null; }
  function peek(stack) { return stack ? stack.value : undefined; }

  const s0 = emptyStack();
  const s1 = push(s0, 1);
  const s2 = push(s1, 2);
  const s3 = push(s2, 3);
  const s2b = pop(s3); // shares s1 tail with s2
  console.log("Ex43 — persistent stack:", peek(s3), peek(s2b), s2b === s2, s2b.tail === s1);
}

/** immutable data perf: copy-on-write collections */
function ex44() {
  class ImmutableList {
    constructor(items = []) { this._items = Object.freeze([...items]); }
    push(item) { return new ImmutableList([...this._items, item]); }
    pop() { return new ImmutableList(this._items.slice(0, -1)); }
    map(fn) { return new ImmutableList(this._items.map(fn)); }
    filter(fn) { return new ImmutableList(this._items.filter(fn)); }
    get(i) { return this._items[i]; }
    get size() { return this._items.length; }
    toArray() { return [...this._items]; }
  }
  const list1 = new ImmutableList([1, 2, 3]);
  const list2 = list1.push(4);
  const list3 = list2.map(x => x * 2);
  console.log("Ex44 — immutable list:", list1.toArray(), list2.toArray(), list3.toArray());
}

/** virtual DOM diffing concept: keyed list diffing */
function ex45() {
  function diffLists(oldList, newList, keyFn) {
    const oldKeys = new Map(oldList.map((item, i) => [keyFn(item), i]));
    const ops = [];
    let lastIdx = 0;
    newList.forEach((item, newIdx) => {
      const key = keyFn(item);
      if (oldKeys.has(key)) {
        const oldIdx = oldKeys.get(key);
        if (oldIdx < lastIdx) ops.push({ op: "MOVE", key, toIdx: newIdx });
        else lastIdx = oldIdx;
      } else {
        ops.push({ op: "INSERT", key, atIdx: newIdx });
      }
    });
    oldList.forEach(item => {
      const key = keyFn(item);
      if (!newList.find(i => keyFn(i) === key)) ops.push({ op: "REMOVE", key });
    });
    return ops;
  }
  const old = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const next = [{ id: 3 }, { id: 1 }, { id: 4 }];
  const ops = diffLists(old, next, item => item.id);
  console.log("Ex45 — keyed list diff:", ops);
}

/** reconciliation concept: tree reconciliation */
function ex46() {
  function reconcileTree(prev, next, result = { created: 0, updated: 0, deleted: 0 }) {
    if (!prev && next) { result.created++; return result; }
    if (prev && !next) { result.deleted++; return result; }
    if (!prev && !next) return result;
    if (prev.tag !== next.tag) { result.deleted++; result.created++; return result; }
    if (JSON.stringify(prev.props) !== JSON.stringify(next.props)) result.updated++;
    const maxLen = Math.max((prev.children || []).length, (next.children || []).length);
    for (let i = 0; i < maxLen; i++) {
      reconcileTree((prev.children || [])[i], (next.children || [])[i], result);
    }
    return result;
  }
  const t1 = { tag: "div", props: { id: "app" }, children: [
    { tag: "h1", props: {}, children: [] },
    { tag: "p", props: { class: "text" }, children: [] }
  ]};
  const t2 = { tag: "div", props: { id: "app" }, children: [
    { tag: "h1", props: { class: "title" }, children: [] },
    { tag: "span", props: {}, children: [] }
  ]};
  console.log("Ex46 — tree reconciliation:", reconcileTree(t1, t2));
}

/** fiber scheduling concept: work with priority levels */
function ex47() {
  const ImmediatePriority = 1;
  const NormalPriority = 3;
  const LowPriority = 5;

  function createPriorityScheduler() {
    const queues = new Map([[ImmediatePriority, []], [NormalPriority, []], [LowPriority, []]]);
    return {
      schedule(task, priority = NormalPriority) {
        (queues.get(priority) || queues.get(NormalPriority)).push(task);
      },
      flush() {
        const results = [];
        for (const [, q] of [...queues.entries()].sort((a, b) => a[0] - b[0])) {
          while (q.length) results.push(q.shift()());
        }
        return results;
      }
    };
  }
  const sched = createPriorityScheduler();
  sched.schedule(() => "low-1", LowPriority);
  sched.schedule(() => "normal-1", NormalPriority);
  sched.schedule(() => "immediate-1", ImmediatePriority);
  sched.schedule(() => "immediate-2", ImmediatePriority);
  console.log("Ex47 — priority scheduler:", sched.flush());
}

/** time complexity helpers: amortized analysis */
function ex48() {
  // Dynamic array with amortized O(1) push via doubling
  class DynamicArray {
    constructor() { this._data = new Array(1); this._size = 0; this._capacity = 1; this._resizeCount = 0; }
    push(val) {
      if (this._size === this._capacity) {
        this._capacity *= 2;
        const newData = new Array(this._capacity);
        for (let i = 0; i < this._size; i++) newData[i] = this._data[i];
        this._data = newData; this._resizeCount++;
      }
      this._data[this._size++] = val;
    }
    get(i) { return this._data[i]; }
    get size() { return this._size; }
    get capacity() { return this._capacity; }
    get resizeCount() { return this._resizeCount; }
  }
  const arr = new DynamicArray();
  for (let i = 0; i < 64; i++) arr.push(i);
  console.log("Ex48 — dynamic array size:", arr.size, "capacity:", arr.capacity, "resizes:", arr.resizeCount);
}

/** wasm-like perf concept: TypedArrays for performance */
function ex49() {
  // Float32Array for SIMD-friendly numeric computation
  function dotProduct(a, b) {
    const fa = new Float32Array(a);
    const fb = new Float32Array(b);
    let sum = 0;
    for (let i = 0; i < fa.length; i++) sum += fa[i] * fb[i];
    return sum;
  }
  function matMulRow(matrix, vector) {
    return matrix.map(row => dotProduct(row, vector));
  }
  const mat = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
  const vec = [1, 0, -1];
  const result = matMulRow(mat, vec);
  console.log("Ex49 — TypedArray matrix×vector:", result);
}

/** web worker concept: structured-clone-like deep copy perf */
function ex50() {
  // Simulate structured clone (as used for worker message passing)
  function structuredClone_compat(obj) {
    // Use MessageChannel for true structured clone in browser; use JSON in Node
    return JSON.parse(JSON.stringify(obj));
  }
  // Performance comparison: JSON vs recursive clone
  function recursiveClone(obj) {
    if (obj === null || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map(recursiveClone);
    const result = {};
    for (const [k, v] of Object.entries(obj)) result[k] = recursiveClone(v);
    return result;
  }
  const data = { users: Array.from({length: 100}, (_, i) => ({ id: i, name: `User ${i}`, scores: [i, i*2, i*3] })) };
  const cloned = structuredClone_compat(data);
  const recursive = recursiveClone(data);
  console.log("Ex50 — structured clone users:", cloned.users.length, "recursive:", recursive.users.length, "same content:", cloned.users[0].name === recursive.users[0].name);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== BASIC (1–13) ===");
  ex01(); ex02(); ex03(); ex04(); ex05(); ex06(); ex07(); ex08(); ex09(); ex10();
  ex11(); ex12(); ex13();
  console.log("=== INTERMEDIATE (14–26) ===");
  ex14(); ex15(); ex16(); ex17(); ex18(); ex19(); ex20(); ex21(); ex22(); ex23();
  ex24(); await ex25(); ex26();
  console.log("=== NESTED (27–38) ===");
  ex27(); ex28(); ex29(); ex30(); ex31(); ex32(); ex33(); ex34(); ex35(); ex36();
  ex37(); ex38();
  console.log("=== ADVANCED (39–50) ===");
  ex39(); ex40(); ex41(); ex42(); ex43(); ex44(); ex45(); ex46(); ex47(); ex48();
  ex49(); ex50();
}

main();
