// Examples 5.3 — Iterator Pattern
"use strict";

// ─── BASIC (ex01–ex13) ────────────────────────────────────────────────────────

/** @example ex01 — Symbol.iterator on a plain object */
function ex01() {
  const range = {
    from: 1, to: 5,
    [Symbol.iterator]() {
      let n = this.from;
      return { next: () => n <= this.to ? { value: n++, done: false } : { done: true } };
    },
  };
  console.log("ex01 Symbol.iterator on object:", [...range]);
}

/** @example ex02 — Range iterator function */
function ex02() {
  function range(from, to, step = 1) {
    return {
      [Symbol.iterator]() {
        let current = from;
        return {
          next() {
            if (current <= to) { const value = current; current += step; return { value, done: false }; }
            return { value: undefined, done: true };
          },
        };
      },
    };
  }
  console.log("ex02 range with step:", [...range(0, 10, 2)]);
}

/** @example ex03 — Array-like iterator (indexed) */
function ex03() {
  function createArrayLike(data) {
    return {
      ...data,
      length: Object.keys(data).length,
      [Symbol.iterator]() {
        const keys = Object.keys(this).filter(k => !isNaN(k)).sort((a, b) => a - b);
        let i = 0;
        return { next: () => i < keys.length ? { value: this[keys[i++]], done: false } : { done: true } };
      },
    };
  }
  const al = createArrayLike({ 0: "a", 1: "b", 2: "c" });
  console.log("ex03 array-like iterator:", [...al]);
}

/** @example ex04 — String character iterator */
function ex04() {
  function* chars(str) {
    for (let i = 0; i < str.length; i++) yield str[i];
  }
  console.log("ex04 string chars:", [...chars("hello")]);
  // Demonstrate using the built-in string iterator
  const letters = [];
  for (const ch of "world") letters.push(ch);
  console.log("ex04 built-in string iter:", letters);
}

/** @example ex05 — Counter iterator */
function ex05() {
  function createCounter(start = 0, end = Infinity, step = 1) {
    return {
      [Symbol.iterator]() {
        let current = start;
        return {
          next() {
            if (current <= end) { const v = current; current += step; return { value: v, done: false }; }
            return { done: true };
          },
          [Symbol.iterator]() { return this; },
        };
      },
    };
  }
  const counter = createCounter(1, 5);
  const values = [];
  for (const n of counter) values.push(n);
  console.log("ex05 counter iterator:", values);
}

/** @example ex06 — for...of with custom iterable */
function ex06() {
  class LinkedList {
    constructor() { this.head = null; }
    push(value) { this.head = { value, next: this.head }; return this; }
    [Symbol.iterator]() {
      let node = this.head;
      return { next() { if (node) { const v = node.value; node = node.next; return { value: v, done: false }; } return { done: true }; } };
    }
  }
  const list = new LinkedList();
  list.push(3).push(2).push(1);
  const result = [];
  for (const v of list) result.push(v);
  console.log("ex06 for...of LinkedList:", result);
}

/** @example ex07 — Spread with iterable */
function ex07() {
  function* naturals() {
    let n = 1;
    while (true) yield n++;
  }
  function take(gen, n) { const r = []; for (const v of gen) { r.push(v); if (r.length >= n) break; } return r; }
  const first10 = take(naturals(), 10);
  const [a, b, ...rest] = first10;
  console.log("ex07 spread + destructure:", a, b, rest);
}

/** @example ex08 — Destructuring an iterable */
function ex08() {
  function* coordinates() {
    yield { x: 1, y: 2 };
    yield { x: 3, y: 4 };
    yield { x: 5, y: 6 };
  }
  const [p1, p2, p3] = coordinates();
  console.log("ex08 destructure iterable:", p1, p2, p3);
}

/** @example ex09 — Array.from with iterable */
function ex09() {
  function* range(from, to) { for (let i = from; i <= to; i++) yield i; }
  const arr = Array.from(range(1, 5), n => n * n);
  console.log("ex09 Array.from with map:", arr);
}

/** @example ex10 — Iterator protocol: manual next() calls */
function ex10() {
  function* gen() { yield 1; yield 2; yield 3; }
  const iter = gen();
  console.log("ex10 manual next():", iter.next(), iter.next(), iter.next(), iter.next());
}

/** @example ex11 — Returning from generator early */
function ex11() {
  function* gen() { try { yield 1; yield 2; yield 3; } finally { console.log("ex11 generator cleanup"); } }
  const iter = gen();
  console.log("ex11 first:", iter.next());
  console.log("ex11 return early:", iter.return("done"));
  console.log("ex11 after return:", iter.next()); // done
}

/** @example ex12 — Throwing into a generator */
function ex12() {
  function* safeGen() {
    try { yield 1; yield 2; } catch (e) { console.log("ex12 caught in generator:", e.message); yield -1; }
  }
  const iter = safeGen();
  console.log("ex12 next:", iter.next());
  console.log("ex12 throw:", iter.throw(new Error("external error")));
  console.log("ex12 done:", iter.next());
}

/** @example ex13 — Iterable class with state */
function ex13() {
  class CircularBuffer {
    constructor(capacity) { this.capacity = capacity; this.buffer = []; this.head = 0; }
    push(v) {
      if (this.buffer.length < this.capacity) this.buffer.push(v);
      else { this.buffer[this.head] = v; this.head = (this.head + 1) % this.capacity; }
    }
    [Symbol.iterator]() {
      const buf = this.buffer;
      const start = this.buffer.length < this.capacity ? 0 : this.head;
      let count = 0;
      return {
        next() {
          if (count >= buf.length) return { done: true };
          const v = buf[(start + count) % buf.length];
          count++;
          return { value: v, done: false };
        },
      };
    }
  }
  const cb = new CircularBuffer(4);
  [1,2,3,4,5,6].forEach(v => cb.push(v)); // overwrites 1 and 2
  console.log("ex13 circular buffer:", [...cb]);
}

// ─── INTERMEDIATE (ex14–ex26) ─────────────────────────────────────────────────

/** @example ex14 — Generator as iterator */
function ex14() {
  function* idGenerator(prefix = "id") {
    let n = 1;
    while (true) yield `${prefix}-${n++}`;
  }
  const gen = idGenerator("user");
  console.log("ex14 generator IDs:", gen.next().value, gen.next().value, gen.next().value);
}

/** @example ex15 — Infinite generator with take */
function ex15() {
  function* naturals(start = 1) { while (true) yield start++; }
  function take(iterable, n) { const r = []; for (const v of iterable) { r.push(v); if (r.length >= n) break; } return r; }
  console.log("ex15 infinite naturals take(10):", take(naturals(), 10));
}

/** @example ex16 — Fibonacci generator */
function ex16() {
  function* fibonacci() { let [a, b] = [0, 1]; while (true) { yield a; [a, b] = [b, a + b]; } }
  function take(it, n) { const r = []; for (const v of it) { r.push(v); if (r.length >= n) break; } return r; }
  console.log("ex16 fibonacci first 10:", take(fibonacci(), 10));
}

/** @example ex17 — Prime number generator */
function ex17() {
  function isPrime(n) { if (n < 2) return false; for (let i = 2; i <= Math.sqrt(n); i++) if (n % i === 0) return false; return true; }
  function* primes() { let n = 2; while (true) { if (isPrime(n)) yield n; n++; } }
  function take(it, n) { const r = []; for (const v of it) { r.push(v); if (r.length >= n) break; } return r; }
  console.log("ex17 prime generator first 10:", take(primes(), 10));
}

/** @example ex18 — Linked list iterator */
function ex18() {
  class Node { constructor(value, next = null) { this.value = value; this.next = next; } }
  function fromArray(arr) { return arr.reduceRight((acc, v) => new Node(v, acc), null); }
  function* iterateList(head) { let node = head; while (node) { yield node.value; node = node.next; } }
  const list = fromArray([10, 20, 30, 40, 50]);
  console.log("ex18 linked list iterator:", [...iterateList(list)]);
}

/** @example ex19 — Tree DFS iterator */
function ex19() {
  function* dfs(node) {
    yield node.value;
    if (node.children) for (const child of node.children) yield* dfs(child);
  }
  const tree = {
    value: 1,
    children: [
      { value: 2, children: [{ value: 4, children: [] }, { value: 5, children: [] }] },
      { value: 3, children: [{ value: 6, children: [] }] },
    ],
  };
  console.log("ex19 tree DFS:", [...dfs(tree)]);
}

/** @example ex20 — Tree BFS iterator */
function ex20() {
  function* bfs(root) {
    const queue = [root];
    while (queue.length) {
      const node = queue.shift();
      yield node.value;
      if (node.children) queue.push(...node.children);
    }
  }
  const tree = {
    value: 1,
    children: [
      { value: 2, children: [{ value: 4, children: [] }, { value: 5, children: [] }] },
      { value: 3, children: [{ value: 6, children: [] }] },
    ],
  };
  console.log("ex20 tree BFS:", [...bfs(tree)]);
}

/** @example ex21 — Lazy map iterator */
function ex21() {
  function* lazyMap(iterable, fn) { for (const v of iterable) yield fn(v); }
  // No array created until consumed
  const mapped = lazyMap([1,2,3,4,5], n => ({ original: n, squared: n * n }));
  for (const item of mapped) console.log("ex21 lazy map item:", item);
}

/** @example ex22 — Lazy filter iterator */
function ex22() {
  function* lazyFilter(iterable, pred) { for (const v of iterable) if (pred(v)) yield v; }
  function* naturals() { let n = 1; while (true) yield n++; }
  function take(it, n) { const r = []; for (const v of it) { r.push(v); if (r.length >= n) break; } return r; }
  const divisibleBy3 = lazyFilter(naturals(), n => n % 3 === 0);
  console.log("ex22 lazy filter (first 5 divisible by 3):", take(divisibleBy3, 5));
}

/** @example ex23 — Lazy chain: map + filter without intermediate arrays */
function ex23() {
  function* map(it, fn) { for (const v of it) yield fn(v); }
  function* filter(it, pred) { for (const v of it) if (pred(v)) yield v; }
  function take(it, n) { const r = []; for (const v of it) { r.push(v); if (r.length >= n) break; } return r; }
  function* range(n) { for (let i = 1; i <= n; i++) yield i; }
  // chain: range -> filter evens -> map square -> take 4
  const pipeline = take(map(filter(range(20), n => n % 2 === 0), n => n * n), 4);
  console.log("ex23 lazy chain (even squares):", pipeline);
}

/** @example ex24 — zip iterator */
function ex24() {
  function* zip(...iterables) {
    const iters = iterables.map(it => it[Symbol.iterator]());
    while (true) {
      const nexts = iters.map(it => it.next());
      if (nexts.some(n => n.done)) return;
      yield nexts.map(n => n.value);
    }
  }
  const a = [1, 2, 3], b = ["a", "b", "c"], c = [true, false, true];
  console.log("ex24 zip iterator:", [...zip(a, b, c)]);
}

/** @example ex25 — product (cartesian product) iterator */
function ex25() {
  function* product(...arrays) {
    function* helper(index, current) {
      if (index === arrays.length) { yield [...current]; return; }
      for (const v of arrays[index]) { current.push(v); yield* helper(index + 1, current); current.pop(); }
    }
    yield* helper(0, []);
  }
  console.log("ex25 cartesian product:", [...product([1,2], ["a","b"])]);
}

/** @example ex26 — permutations generator */
function ex26() {
  function* permutations(arr) {
    if (arr.length <= 1) { yield arr; return; }
    for (let i = 0; i < arr.length; i++) {
      const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
      for (const perm of permutations(rest)) yield [arr[i], ...perm];
    }
  }
  console.log("ex26 permutations of [1,2,3]:", [...permutations([1, 2, 3])]);
}

// ─── NESTED (ex27–ex38) ───────────────────────────────────────────────────────

/** @example ex27 — combinations generator */
function ex27() {
  function* combinations(arr, k) {
    if (k === 0) { yield []; return; }
    for (let i = 0; i <= arr.length - k; i++) {
      for (const rest of combinations(arr.slice(i + 1), k - 1)) {
        yield [arr[i], ...rest];
      }
    }
  }
  console.log("ex27 combinations C(5,2):", [...combinations([1,2,3,4,5], 2)]);
}

/** @example ex28 — flatten generator */
function ex28() {
  function* flatten(iterable, depth = Infinity) {
    for (const item of iterable) {
      if (depth > 0 && item != null && typeof item[Symbol.iterator] === "function" && typeof item !== "string") {
        yield* flatten(item, depth - 1);
      } else {
        yield item;
      }
    }
  }
  const nested = [1, [2, [3, [4, [5]]]]];
  console.log("ex28 flatten deep:", [...flatten(nested)]);
  console.log("ex28 flatten depth 1:", [...flatten(nested, 1)]);
}

/** @example ex29 — chunk generator */
function ex29() {
  function* chunk(iterable, size) {
    let batch = [];
    for (const item of iterable) {
      batch.push(item);
      if (batch.length >= size) { yield batch; batch = []; }
    }
    if (batch.length > 0) yield batch;
  }
  console.log("ex29 chunk:", [...chunk([1,2,3,4,5,6,7], 3)]);
}

/** @example ex30 — sliding window generator */
function ex30() {
  function* slidingWindow(iterable, size) {
    const buffer = [];
    for (const item of iterable) {
      buffer.push(item);
      if (buffer.length > size) buffer.shift();
      if (buffer.length === size) yield [...buffer];
    }
  }
  console.log("ex30 sliding window size=3:", [...slidingWindow([1,2,3,4,5,6], 3)]);
}

/** @example ex31 — interleave iterators */
function ex31() {
  function* interleave(...iterables) {
    const iters = iterables.map(it => it[Symbol.iterator]());
    let active = iters.length;
    while (active > 0) {
      for (let i = 0; i < iters.length; i++) {
        if (!iters[i]) continue;
        const { value, done } = iters[i].next();
        if (done) { iters[i] = null; active--; }
        else yield value;
      }
    }
  }
  console.log("ex31 interleave:", [...interleave([1,3,5], [2,4,6])]);
}

/** @example ex32 — round-robin iterator */
function ex32() {
  function* roundRobin(...iterables) {
    const iters = iterables.map(it => it[Symbol.iterator]());
    while (iters.length > 0) {
      for (let i = iters.length - 1; i >= 0; i--) {
        const { value, done } = iters[i].next();
        if (done) iters.splice(i, 1);
        else yield value;
      }
    }
  }
  console.log("ex32 round-robin:", [...roundRobin([1,2,3], ["a","b"], [true])]);
}

/** @example ex33 — async iterator (Symbol.asyncIterator) */
function ex33() {
  async function processAsyncIter() {
    const asyncRange = {
      from: 1, to: 4,
      [Symbol.asyncIterator]() {
        let n = this.from;
        return {
          async next() {
            await new Promise(r => setTimeout(r, 0));
            if (n <= this.to) return { value: n++, done: false };
            return { done: true };
          },
          to: this.to,
        };
      },
    };
    const results = [];
    for await (const v of asyncRange) results.push(v);
    console.log("ex33 async iterator:", results);
  }
  processAsyncIter();
}

/** @example ex34 — async generator */
function ex34() {
  async function* asyncGen(max) {
    for (let i = 1; i <= max; i++) {
      await new Promise(r => setTimeout(r, 0));
      yield i * i;
    }
  }
  async function run() {
    const results = [];
    for await (const v of asyncGen(5)) results.push(v);
    console.log("ex34 async generator:", results);
  }
  run();
}

/** @example ex35 — for await...of with async generator */
function ex35() {
  async function* paginator(total, pageSize) {
    let page = 1;
    while ((page - 1) * pageSize < total) {
      await new Promise(r => setTimeout(r, 0));
      const start = (page - 1) * pageSize + 1;
      const end = Math.min(page * pageSize, total);
      yield { page, items: Array.from({ length: end - start + 1 }, (_, i) => start + i) };
      page++;
    }
  }
  async function run() {
    const pages = [];
    for await (const page of paginator(10, 3)) pages.push(page.page);
    console.log("ex35 for await...of paginator, pages:", pages);
  }
  run();
}

/** @example ex36 — Pipeline via generators */
function ex36() {
  function pipeline(source, ...transforms) {
    return transforms.reduce((current, transform) => transform(current), source);
  }
  function* range(n) { for (let i = 1; i <= n; i++) yield i; }
  function* map(fn) { return function*(it) { for (const v of it) yield fn(v); }; }
  const mapFn = (fn) => function*(it) { for (const v of it) yield fn(v); };
  const filterFn = (pred) => function*(it) { for (const v of it) if (pred(v)) yield v; };
  const result = [...pipeline(
    range(10),
    filterFn(n => n % 2 === 0),
    mapFn(n => n * n),
  )];
  console.log("ex36 generator pipeline:", result);
}

/** @example ex37 — Coroutine via generator */
function ex37() {
  function coroutine(generatorFn) {
    const gen = generatorFn();
    gen.next(); // prime the generator
    return function(value) { return gen.next(value); };
  }
  function* logger() {
    const lines = [];
    while (true) {
      const msg = yield;
      if (msg === null) { console.log("ex37 coroutine logged:", lines); return; }
      lines.push(`[LOG] ${msg}`);
    }
  }
  const log = coroutine(logger);
  log("first message");
  log("second message");
  log(null); // trigger flush
}

/** @example ex38 — CSP concept via generators */
function ex38() {
  function createChannel() {
    const buffer = [];
    const receivers = [];
    return {
      send(value) {
        if (receivers.length > 0) receivers.shift()(value);
        else buffer.push(value);
      },
      receive() {
        return new Promise(resolve => {
          if (buffer.length > 0) resolve(buffer.shift());
          else receivers.push(resolve);
        });
      },
    };
  }
  const ch = createChannel();
  ch.send(1); ch.send(2); ch.send(3);
  Promise.all([ch.receive(), ch.receive(), ch.receive()]).then(values => {
    console.log("ex38 CSP channel:", values);
  });
}

// ─── ADVANCED (ex39–ex50) ─────────────────────────────────────────────────────

/** @example ex39 — Structured concurrency with generators */
function ex39() {
  function* task(name, steps) {
    for (const step of steps) {
      yield { task: name, step };
    }
    return `${name} completed`;
  }
  function* coordinator(...tasks) {
    const active = tasks.map(t => ({ gen: t, done: false, result: null }));
    while (active.some(t => !t.done)) {
      for (const t of active) {
        if (t.done) continue;
        const { value, done } = t.gen.next();
        if (done) { t.done = true; t.result = value; }
        else yield value;
      }
    }
    return active.map(t => t.result);
  }
  const coord = coordinator(
    task("A", ["A1", "A2"]),
    task("B", ["B1", "B2", "B3"]),
  );
  const events = [];
  let result = coord.next();
  while (!result.done) { events.push(result.value); result = coord.next(); }
  console.log("ex39 structured concurrency events:", events);
}

/** @example ex40 — Lazy evaluation via iterators */
function ex40() {
  class LazySeq {
    constructor(iterable) { this._iterable = iterable; }
    map(fn) { const src = this._iterable; return new LazySeq(function*() { for (const v of src) yield fn(v); }()); }
    filter(pred) { const src = this._iterable; return new LazySeq(function*() { for (const v of src) if (pred(v)) yield v; }()); }
    take(n) { const src = this._iterable; return new LazySeq(function*() { let i = 0; for (const v of src) { if (i++ >= n) return; yield v; } }()); }
    toArray() { return [...this._iterable]; }
    static from(iterable) { return new LazySeq(iterable); }
    static range(from, to) { return new LazySeq(function*() { for (let i = from; i <= to; i++) yield i; }()); }
  }
  const result = LazySeq.range(1, 100)
    .filter(n => n % 3 === 0)
    .map(n => n * n)
    .take(5)
    .toArray();
  console.log("ex40 lazy sequence:", result);
}

/** @example ex41 — Iterator chaining (fluent API) */
function ex41() {
  function iter(iterable) {
    const self = {
      _it: iterable,
      map(fn) { const src = self._it; return iter(function*() { for (const v of src) yield fn(v); }()); },
      filter(pred) { const src = self._it; return iter(function*() { for (const v of src) if (pred(v)) yield v; }()); },
      take(n) { const src = self._it; return iter(function*() { let i = 0; for (const v of src) { if (i++ >= n) break; yield v; } }()); },
      reduce(fn, init) { let acc = init; for (const v of self._it) acc = fn(acc, v); return acc; },
      toArray() { return [...self._it]; },
    };
    return self;
  }
  function* range(n) { for (let i = 1; i <= n; i++) yield i; }
  const sum = iter(range(100))
    .filter(n => n % 2 === 0)
    .map(n => n * 3)
    .take(10)
    .reduce((a, b) => a + b, 0);
  console.log("ex41 iterator chaining, sum:", sum);
}

/** @example ex42 — Stateful iterator with cleanup */
function ex42() {
  function createFileIterator(lines) {
    let index = 0;
    let closed = false;
    return {
      next() {
        if (closed) return { done: true };
        if (index >= lines.length) { this.return(); return { done: true }; }
        return { value: lines[index++], done: false };
      },
      return(value) { if (!closed) { closed = true; console.log("ex42 file iterator closed"); } return { value, done: true }; },
      [Symbol.iterator]() { return this; },
    };
  }
  const fileIter = createFileIterator(["line 1", "line 2", "line 3"]);
  const lines = [];
  for (const line of fileIter) { lines.push(line); if (lines.length >= 2) break; } // closes early
  console.log("ex42 stateful iterator lines read:", lines);
}

/** @example ex43 — Recursive generator (yield*) */
function ex43() {
  function* walkTree(node) {
    if (!node) return;
    yield node.value;
    yield* walkTree(node.left);
    yield* walkTree(node.right);
  }
  const bst = {
    value: 4,
    left: { value: 2, left: { value: 1, left: null, right: null }, right: { value: 3, left: null, right: null } },
    right: { value: 6, left: { value: 5, left: null, right: null }, right: { value: 7, left: null, right: null } },
  };
  console.log("ex43 BST preorder (yield*):", [...walkTree(bst)]);
}

/** @example ex44 — Bidirectional generator (send values in) */
function ex44() {
  function* accumulator() {
    let total = 0;
    while (true) {
      const n = yield total;
      if (n === null) return total;
      total += n;
    }
  }
  const acc = accumulator();
  acc.next(); // prime
  console.log("ex44 send 10:", acc.next(10).value);
  console.log("ex44 send 20:", acc.next(20).value);
  console.log("ex44 send 5:", acc.next(5).value);
  console.log("ex44 finalize:", acc.next(null).value);
}

/** @example ex45 — Generator-based state machine */
function ex45() {
  function* trafficLight() {
    while (true) {
      yield "red";
      yield "green";
      yield "yellow";
    }
  }
  const light = trafficLight();
  const sequence = [];
  for (let i = 0; i < 7; i++) sequence.push(light.next().value);
  console.log("ex45 generator state machine:", sequence);
}

/** @example ex46 — Unfold generator (anamorphism) */
function ex46() {
  function* unfold(seed, fn) {
    let state = seed;
    while (true) {
      const result = fn(state);
      if (result === null) return;
      yield result.value;
      state = result.next;
    }
  }
  function take(it, n) { const r = []; for (const v of it) { r.push(v); if (r.length >= n) break; } return r; }
  // Powers of 2
  const powersOf2 = unfold(1, (n) => n <= 1024 ? { value: n, next: n * 2 } : null);
  console.log("ex46 unfold (powers of 2):", [...powersOf2]);
}

/** @example ex47 — Memoized generator */
function ex47() {
  function memoizeGenerator(genFn) {
    const cache = [];
    let gen = null;
    let done = false;
    return {
      [Symbol.iterator]() {
        let index = 0;
        return {
          next() {
            if (index < cache.length) return { value: cache[index++], done: false };
            if (done) return { done: true };
            if (!gen) gen = genFn();
            const result = gen.next();
            if (result.done) { done = true; return { done: true }; }
            cache.push(result.value);
            index++;
            return { value: result.value, done: false };
          },
        };
      },
    };
  }
  function* expensiveFib() { let [a, b] = [0, 1]; while (true) { yield a; [a, b] = [b, a + b]; } }
  const memoFib = memoizeGenerator(expensiveFib);
  function take(it, n) { const r = []; for (const v of it) { r.push(v); if (r.length >= n) break; } return r; }
  console.log("ex47 memoized gen first run:", take(memoFib, 8));
  console.log("ex47 memoized gen second run:", take(memoFib, 8)); // from cache
}

/** @example ex48 — Transducer with iterators */
function ex48() {
  function transduce(iterable, ...transducers) {
    function map(fn) { return function*(it) { for (const v of it) yield fn(v); }; }
    function filter(pred) { return function*(it) { for (const v of it) if (pred(v)) yield v; }; }
    const transforms = transducers.map(t => t.type === "map" ? map(t.fn) : filter(t.fn));
    let result = iterable;
    for (const transform of transforms) result = transform(result);
    return result;
  }
  function* range(n) { for (let i = 1; i <= n; i++) yield i; }
  const result = [...transduce(
    range(20),
    { type: "filter", fn: n => n % 2 === 0 },
    { type: "map", fn: n => n * n },
    { type: "filter", fn: n => n > 50 },
  )];
  console.log("ex48 transducer:", result);
}

/** @example ex49 — Cursor pattern with iterators */
function ex49() {
  function createCursor(data) {
    let position = 0;
    return {
      hasNext() { return position < data.length; },
      hasPrev() { return position > 0; },
      next() { if (!this.hasNext()) return null; return data[position++]; },
      prev() { if (!this.hasPrev()) return null; return data[--position]; },
      peek() { return this.hasNext() ? data[position] : null; },
      get position() { return position; },
      [Symbol.iterator]() {
        return {
          next: () => {
            if (position < data.length) return { value: data[position++], done: false };
            return { done: true };
          },
        };
      },
    };
  }
  const cursor = createCursor(["a", "b", "c", "d", "e"]);
  console.log("ex49 cursor next:", cursor.next(), cursor.next());
  console.log("ex49 cursor prev:", cursor.prev());
  console.log("ex49 cursor peek:", cursor.peek());
  const rest = [];
  for (const v of cursor) rest.push(v);
  console.log("ex49 cursor iterate rest:", rest);
}

/** @example ex50 — Full iterator pipeline with lazy evaluation */
function ex50() {
  // Fully lazy pipeline: source → transforms → sink, no intermediate arrays
  class Iter {
    constructor(source) { this._source = source; }
    static of(...vals) { return new Iter(vals[Symbol.iterator]()); }
    static range(from, to, step = 1) {
      return new Iter(function*() { for (let i = from; i <= to; i += step) yield i; }());
    }
    map(fn) { const src = this._source; return new Iter(function*() { for (const v of src) yield fn(v); }()); }
    filter(pred) { const src = this._source; return new Iter(function*() { for (const v of src) if (pred(v)) yield v; }()); }
    take(n) { const src = this._source; return new Iter(function*() { let i = 0; for (const v of src) { if (i++ >= n) return; yield v; } }()); }
    zip(other) {
      const a = this._source, b = other._source || other[Symbol.iterator]();
      return new Iter(function*() {
        const ia = a[Symbol.iterator] ? a[Symbol.iterator]() : a;
        const ib = b[Symbol.iterator] ? b[Symbol.iterator]() : b;
        while (true) { const na = ia.next(), nb = ib.next(); if (na.done || nb.done) return; yield [na.value, nb.value]; }
      }());
    }
    reduce(fn, init) { let acc = init; for (const v of this._source) acc = fn(acc, v); return acc; }
    forEach(fn) { for (const v of this._source) fn(v); }
    toArray() { return [...this._source]; }
  }
  const result = Iter.range(1, 50)
    .filter(n => n % 3 === 0 || n % 5 === 0)
    .map(n => ({ n, label: n % 15 === 0 ? "FizzBuzz" : n % 3 === 0 ? "Fizz" : "Buzz" }))
    .take(10)
    .toArray();
  console.log("ex50 full lazy iterator pipeline:", result);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function main() {
  console.log("=== BASIC (ex01–ex13) ===");
  ex01(); ex02(); ex03(); ex04(); ex05(); ex06(); ex07();
  ex08(); ex09(); ex10(); ex11(); ex12(); ex13();

  console.log("\n=== INTERMEDIATE (ex14–ex26) ===");
  ex14(); ex15(); ex16(); ex17(); ex18(); ex19(); ex20();
  ex21(); ex22(); ex23(); ex24(); ex25(); ex26();

  console.log("\n=== NESTED (ex27–ex38) ===");
  ex27(); ex28(); ex29(); ex30(); ex31(); ex32(); ex33();
  ex34(); ex35(); ex36(); ex37(); ex38();

  console.log("\n=== ADVANCED (ex39–ex50) ===");
  ex39(); ex40(); ex41(); ex42(); ex43(); ex44(); ex45();
  ex46(); ex47(); ex48(); ex49(); ex50();
}

main();
