// ============================================================================
// Examples 6.1 — Generators  (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================================
"use strict";

// ─── BASIC (1–13) ────────────────────────────────────────────────────────────

/** basic generator: simple yield sequence */
function ex01() {
  function* simple() {
    yield 1;
    yield 2;
    yield 3;
  }
  const gen = simple();
  const vals = [gen.next().value, gen.next().value, gen.next().value];
  console.log("Ex01 — basic generator:", vals);
}

/** yield multiple: generator with multiple yield statements */
function ex02() {
  function* greet() {
    yield "Hello";
    yield "World";
    yield "!";
  }
  const words = [...greet()];
  console.log("Ex02 — yield multiple:", words);
}

/** generator return: return value marks done=true */
function ex03() {
  function* withReturn() {
    yield "a";
    return "done";
    yield "b"; // unreachable
  }
  const gen = withReturn();
  const r1 = gen.next(); // {value:"a", done:false}
  const r2 = gen.next(); // {value:"done", done:true}
  const r3 = gen.next(); // {value:undefined, done:true}
  console.log("Ex03 — generator return:", r1.value, r2.value, r2.done, r3.value);
}

/** generator done: checking done flag on exhaustion */
function ex04() {
  function* twoItems() {
    yield 10;
    yield 20;
  }
  const gen = twoItems();
  const steps = [];
  let res;
  while (!(res = gen.next()).done) {
    steps.push(res.value);
  }
  console.log("Ex04 — generator done:", steps, "final done:", true);
}

/** next(value): sending values into a generator */
function ex05() {
  function* adder() {
    const x = yield "give me a number";
    const y = yield "give me another";
    yield x + y;
  }
  const gen = adder();
  gen.next();        // start
  gen.next(10);      // x = 10
  gen.next(20);      // y = 20
  const sum = gen.next().value; // x + y but gen is done — get it from prior step
  // redo cleanly:
  const g2 = adder();
  g2.next();
  g2.next(10);
  const r = g2.next(20); // yields x + y
  console.log("Ex05 — next(value) sum:", r.value);
}

/** generator as iterator: works with for...of */
function ex06() {
  function* countdown(n) {
    while (n > 0) yield n--;
  }
  const result = [];
  for (const v of countdown(5)) result.push(v);
  console.log("Ex06 — generator for...of:", result);
}

/** for...of with generator spread */
function ex07() {
  function* letters() {
    yield "a"; yield "b"; yield "c"; yield "d";
  }
  const arr = [...letters()];
  console.log("Ex07 — spread generator:", arr);
}

/** spread generator: use in destructuring */
function ex08() {
  function* rgb() {
    yield 255; yield 128; yield 0;
  }
  const [r, g, b] = rgb();
  console.log("Ex08 — destructure generator:", r, g, b);
}

/** Array.from generator: convert to array with transform */
function ex09() {
  function* naturals(n) {
    for (let i = 1; i <= n; i++) yield i;
  }
  const squares = Array.from(naturals(5), x => x * x);
  console.log("Ex09 — Array.from generator:", squares);
}

/** infinite counter: take first N from infinite generator */
function ex10() {
  function* counter(start = 0, step = 1) {
    while (true) { yield start; start += step; }
  }
  const result = [];
  const gen = counter(10, 5);
  for (let i = 0; i < 5; i++) result.push(gen.next().value);
  console.log("Ex10 — infinite counter:", result);
}

/** generator in Map: use generator output as Map entries */
function ex11() {
  function* pairs() {
    yield ["a", 1]; yield ["b", 2]; yield ["c", 3];
  }
  const map = new Map(pairs());
  console.log("Ex11 — generator → Map:", [...map.entries()]);
}

/** generator with parameter: parameterized range */
function ex12() {
  function* range(start, end, step = 1) {
    for (let i = start; i < end; i += step) yield i;
  }
  const evens = [...range(0, 10, 2)];
  console.log("Ex12 — range generator:", evens);
}

/** generator in Set: deduplicate via generator */
function ex13() {
  function* withDupes() {
    yield 1; yield 2; yield 2; yield 3; yield 1; yield 4;
  }
  const unique = [...new Set(withDupes())];
  console.log("Ex13 — generator → Set dedup:", unique);
}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────────────────────

/** fibonacci generator: infinite fibonacci sequence */
function ex14() {
  function* fibonacci() {
    let [a, b] = [0, 1];
    while (true) {
      yield a;
      [a, b] = [b, a + b];
    }
  }
  function take(gen, n) {
    const r = []; for (const v of gen) { r.push(v); if (r.length === n) break; } return r;
  }
  console.log("Ex14 — fibonacci:", take(fibonacci(), 10));
}

/** range generator: parameterized range with step */
function ex15() {
  function* range(start, end, step = 1) {
    for (let i = start; step > 0 ? i < end : i > end; i += step) yield i;
  }
  const countdown = [...range(10, 0, -2)];
  console.log("Ex15 — range countdown:", countdown);
}

/** take(): utility to collect N from any iterable */
function ex16() {
  function take(iterable, n) {
    const result = [];
    for (const val of iterable) {
      result.push(val);
      if (result.length === n) break;
    }
    return result;
  }
  function* powers(base) {
    let exp = 0;
    while (true) { yield base ** exp++; }
  }
  console.log("Ex16 — take powers of 2:", take(powers(2), 8));
}

/** lazy map generator: transform without materializing */
function ex17() {
  function* lazyMap(iterable, fn) {
    for (const x of iterable) yield fn(x);
  }
  function* naturals() { let n = 1; while (true) yield n++; }
  function take(gen, n) {
    const r = []; for (const v of gen) { r.push(v); if (r.length === n) break; } return r;
  }
  const cubes = take(lazyMap(naturals(), x => x ** 3), 6);
  console.log("Ex17 — lazy map cubes:", cubes);
}

/** lazy filter generator: filter without materializing */
function ex18() {
  function* lazyFilter(iterable, pred) {
    for (const x of iterable) { if (pred(x)) yield x; }
  }
  function* naturals() { let n = 1; while (true) yield n++; }
  function take(gen, n) {
    const r = []; for (const v of gen) { r.push(v); if (r.length === n) break; } return r;
  }
  const primes = take(lazyFilter(naturals(), n => {
    if (n < 2) return false;
    for (let i = 2; i <= Math.sqrt(n); i++) if (n % i === 0) return false;
    return true;
  }), 10);
  console.log("Ex18 — lazy filter primes:", primes);
}

/** zip generators: pair elements from two iterables */
function ex19() {
  function* zip(a, b) {
    const ia = a[Symbol.iterator](), ib = b[Symbol.iterator]();
    while (true) {
      const { value: va, done: da } = ia.next();
      const { value: vb, done: db } = ib.next();
      if (da || db) return;
      yield [va, vb];
    }
  }
  const keys = ["x", "y", "z"];
  const values = [10, 20, 30];
  console.log("Ex19 — zip:", [...zip(keys, values)]);
}

/** yield* delegation: compose generators */
function ex20() {
  function* inner() { yield 3; yield 4; yield 5; }
  function* outer() {
    yield 1; yield 2;
    yield* inner();
    yield 6;
  }
  console.log("Ex20 — yield* delegation:", [...outer()]);
}

/** return from generator: .return() terminates generator */
function ex21() {
  function* infinite() { let n = 0; while (true) yield n++; }
  const gen = infinite();
  gen.next(); gen.next(); gen.next();
  const ret = gen.return("terminated");
  console.log("Ex21 — generator.return():", ret, "next:", gen.next().done);
}

/** throw into generator: inject error into generator */
function ex22() {
  function* safeGen() {
    try {
      yield "first";
      yield "second";
    } catch (e) {
      yield "caught: " + e.message;
    }
  }
  const gen = safeGen();
  gen.next(); // advance to first yield
  const res = gen.throw(new Error("oops"));
  console.log("Ex22 — generator.throw():", res.value);
}

/** generator from iterable: wrap any iterable */
function ex23() {
  function* fromIterable(it) { yield* it; }
  const str = "hello";
  const chars = [...fromIterable(str)];
  console.log("Ex23 — generator from string:", chars);
}

/** generator as coroutine: ping-pong message passing */
function ex24() {
  function* ping(partner) {
    let msg = "ping";
    for (let i = 0; i < 3; i++) {
      console.log("Ex24 — ping sends:", msg);
      msg = partner.next(msg).value;
    }
  }
  function* pong() {
    let msg = yield;
    while (true) {
      console.log("Ex24 — pong receives:", msg);
      msg = yield "pong";
    }
  }
  const pongGen = pong();
  pongGen.next(); // prime pong
  const pingGen = ping(pongGen);
  pingGen.next(); // start ping
}

/** generator state machine: traffic light */
function ex25() {
  function* trafficLight() {
    const states = ["green", "yellow", "red"];
    let i = 0;
    while (true) {
      yield states[i % states.length];
      i++;
    }
  }
  const light = trafficLight();
  const sequence = Array.from({length: 6}, () => light.next().value);
  console.log("Ex25 — traffic light:", sequence);
}

/** generator with index: enumerate */
function ex26() {
  function* enumerate(iterable, start = 0) {
    let i = start;
    for (const val of iterable) yield [i++, val];
  }
  const fruits = ["apple", "banana", "cherry"];
  const indexed = [...enumerate(fruits)];
  console.log("Ex26 — enumerate:", indexed);
}

// ─── NESTED (27–38) ──────────────────────────────────────────────────────────

/** coroutine concept: cooperative multitasking simulation */
function ex27() {
  function* taskA() {
    console.log("Ex27 — taskA: step 1");
    yield;
    console.log("Ex27 — taskA: step 2");
    yield;
    console.log("Ex27 — taskA: step 3");
  }
  function* taskB() {
    console.log("Ex27 — taskB: step 1");
    yield;
    console.log("Ex27 — taskB: step 2");
  }
  function scheduler(tasks) {
    const gens = tasks.map(t => t());
    let active = gens.filter(g => !g.next().done);
    while (active.length) {
      active = active.filter(g => !g.next().done);
    }
  }
  scheduler([taskA, taskB]);
}

/** generator middleware: pipeline of transforms */
function ex28() {
  function* pipeline(...transforms) {
    return function*(source) {
      let gen = source;
      for (const transform of transforms) {
        gen = transform(gen);
      }
      yield* gen;
    };
  }
  function* double(it) { for (const x of it) yield x * 2; }
  function* addTen(it) { for (const x of it) yield x + 10; }
  function* source() { yield 1; yield 2; yield 3; }

  let gen = source();
  gen = double(gen);
  gen = addTen(gen);
  console.log("Ex28 — generator pipeline:", [...gen]);
}

/** async-like with generator: simulate async/await pattern */
function ex29() {
  function run(genFn) {
    const gen = genFn();
    function step(value) {
      const { value: result, done } = gen.next(value);
      if (done) return result;
      if (result && typeof result.then === "function") {
        return result.then(step);
      }
      return step(result);
    }
    return step();
  }
  function fakeAsync(val, ms) {
    return new Promise(resolve => setTimeout(() => resolve(val), ms));
  }
  function* workflow() {
    const a = yield fakeAsync(10, 1);
    const b = yield fakeAsync(20, 1);
    yield a + b;
  }
  run(workflow);
  console.log("Ex29 — async-like generator: running (async result logged separately)");
}

/** generator saga: sequence of async-like steps */
function ex30() {
  // Simplified synchronous saga for demonstration
  function* fetchUser(id) {
    const users = { 1: "Alice", 2: "Bob" };
    yield { type: "FETCH_USER", id };
    yield { type: "RECEIVE_USER", user: users[id] };
  }
  const saga = fetchUser(1);
  const step1 = saga.next().value;
  const step2 = saga.next().value;
  console.log("Ex30 — generator saga:", step1, step2);
}

/** generator state machine: parser states */
function ex31() {
  function* csvParser(input) {
    let current = "";
    for (const char of input) {
      if (char === ",") {
        yield current.trim();
        current = "";
      } else if (char === "\n") {
        yield current.trim();
        current = "";
        yield null; // row separator
      } else {
        current += char;
      }
    }
    if (current.trim()) yield current.trim();
  }
  const csv = "Alice,30,Eng\nBob,25,HR";
  const tokens = [...csvParser(csv)];
  console.log("Ex31 — CSV parser generator:", tokens);
}

/** generator pipeline: compose lazy operations */
function ex32() {
  function* naturals() { let n = 1; while (true) yield n++; }
  function* lazyFilter(it, pred) { for (const x of it) if (pred(x)) yield x; }
  function* lazyMap(it, fn) { for (const x of it) yield fn(x); }
  function* lazyTake(it, n) { let i = 0; for (const x of it) { yield x; if (++i >= n) return; } }

  const result = [
    ...lazyTake(
      lazyMap(
        lazyFilter(naturals(), n => n % 3 === 0),
        n => n * n
      ),
      5
    )
  ];
  console.log("Ex32 — generator pipeline (squares of multiples of 3):", result);
}

/** memoized generator: cache generator outputs */
function ex33() {
  function memoizeGen(genFn) {
    const cache = [];
    let gen;
    return function*(n) {
      if (!gen) gen = genFn();
      for (let i = 0; i < n; i++) {
        if (i < cache.length) {
          yield cache[i];
        } else {
          const { value } = gen.next();
          cache.push(value);
          yield value;
        }
      }
    };
  }
  function* expensiveFib() {
    let [a, b] = [0, 1];
    while (true) { yield a; [a, b] = [b, a + b]; }
  }
  const memoFib = memoizeGen(expensiveFib);
  const first8 = [...memoFib(8)];
  const first8Again = [...memoFib(8)];
  console.log("Ex33 — memoized generator:", first8, "same:", JSON.stringify(first8) === JSON.stringify(first8Again));
}

/** generator with WeakMap: associate private data with generator instances */
function ex34() {
  const metadata = new WeakMap();
  function* trackedGen(id) {
    metadata.set(gen, { id, startTime: Date.now(), steps: 0 });
    while (true) {
      const meta = metadata.get(gen);
      meta.steps++;
      yield meta.steps;
    }
  }
  const gen = trackedGen("worker-1");
  gen.next(); gen.next(); gen.next();
  console.log("Ex34 — generator with WeakMap steps:", metadata.get(gen).steps);
}

/** recursive generator (tree): depth-first tree traversal */
function ex35() {
  function* traverseTree(node) {
    if (!node) return;
    yield node.value;
    yield* traverseTree(node.left);
    yield* traverseTree(node.right);
  }
  const tree = {
    value: 1,
    left: { value: 2, left: { value: 4, left: null, right: null }, right: { value: 5, left: null, right: null } },
    right: { value: 3, left: null, right: { value: 6, left: null, right: null } }
  };
  const preOrder = [...traverseTree(tree)];
  console.log("Ex35 — tree traversal (pre-order):", preOrder);
}

/** generator with channels concept: producer/consumer */
function ex36() {
  function* producer(channel) {
    for (let i = 1; i <= 5; i++) {
      channel.push(i * 10);
      yield;
    }
  }
  function* consumer(channel) {
    const results = [];
    while (true) {
      if (channel.length) {
        results.push(channel.shift() + 1);
      }
      if (results.length >= 5) { console.log("Ex36 — channel consumer results:", results); return; }
      yield;
    }
  }
  const channel = [];
  const prod = producer(channel);
  const cons = consumer(channel);
  for (let i = 0; i < 15; i++) {
    prod.next();
    cons.next();
  }
}

/** generator flatMap: flatten nested generators */
function ex37() {
  function* flatMap(iterable, fn) {
    for (const x of iterable) yield* fn(x);
  }
  const words = ["hello world", "foo bar baz"];
  const chars = [...flatMap(words, w => w.split(" "))];
  console.log("Ex37 — generator flatMap:", chars);
}

/** generator reduce: accumulate with generator */
function ex38() {
  function genReduce(iterable, fn, initial) {
    let acc = initial;
    for (const val of iterable) acc = fn(acc, val);
    return acc;
  }
  function* range(start, end) { for (let i = start; i < end; i++) yield i; }
  const sum = genReduce(range(1, 11), (acc, n) => acc + n, 0);
  const product = genReduce(range(1, 6), (acc, n) => acc * n, 1);
  console.log("Ex38 — generator reduce sum:", sum, "product:", product);
}

// ─── ADVANCED (39–50) ────────────────────────────────────────────────────────

/** async generator: yields values asynchronously */
async function ex39() {
  async function* asyncRange(start, end) {
    for (let i = start; i < end; i++) {
      await new Promise(r => setTimeout(r, 0));
      yield i;
    }
  }
  const results = [];
  for await (const val of asyncRange(1, 6)) results.push(val);
  console.log("Ex39 — async generator:", results);
}

/** for await...of: consume async iterable */
async function ex40() {
  async function* delayedValues(vals) {
    for (const v of vals) {
      await new Promise(r => setTimeout(r, 0));
      yield v;
    }
  }
  const collected = [];
  for await (const v of delayedValues([10, 20, 30])) collected.push(v);
  console.log("Ex40 — for await...of:", collected);
}

/** async range: async generator producing a range */
async function ex41() {
  async function* asyncCountdown(n) {
    while (n > 0) {
      yield n;
      n--;
      await new Promise(r => setTimeout(r, 0));
    }
  }
  const nums = [];
  for await (const n of asyncCountdown(5)) nums.push(n);
  console.log("Ex41 — async range countdown:", nums);
}

/** async paginator: simulate paginated API */
async function ex42() {
  async function* paginate(data, pageSize) {
    for (let i = 0; i < data.length; i += pageSize) {
      await new Promise(r => setTimeout(r, 0));
      yield data.slice(i, i + pageSize);
    }
  }
  const allData = Array.from({length: 10}, (_, i) => i + 1);
  const pages = [];
  for await (const page of paginate(allData, 3)) pages.push(page);
  console.log("Ex42 — async paginator:", pages);
}

/** async stream transform: pipe transform over async source */
async function ex43() {
  async function* asyncSource(items) {
    for (const item of items) {
      await new Promise(r => setTimeout(r, 0));
      yield item;
    }
  }
  async function* asyncMap(source, fn) {
    for await (const val of source) yield fn(val);
  }
  const source = asyncSource([1, 2, 3, 4, 5]);
  const doubled = asyncMap(source, x => x * 2);
  const result = [];
  for await (const v of doubled) result.push(v);
  console.log("Ex43 — async stream transform:", result);
}

/** async generator pipeline: chain async transforms */
async function ex44() {
  async function* asyncFilter(source, pred) {
    for await (const val of source) if (pred(val)) yield val;
  }
  async function* asyncMap(source, fn) {
    for await (const val of source) yield fn(val);
  }
  async function* source() {
    for (let i = 1; i <= 10; i++) { await new Promise(r => setTimeout(r, 0)); yield i; }
  }
  const result = [];
  for await (const v of asyncMap(asyncFilter(source(), x => x % 2 === 0), x => x ** 2)) {
    result.push(v);
  }
  console.log("Ex44 — async generator pipeline:", result);
}

/** cancellable async generator: early termination via return() */
async function ex45() {
  async function* ticker() {
    let i = 0;
    while (true) {
      await new Promise(r => setTimeout(r, 0));
      yield i++;
    }
  }
  const gen = ticker();
  const values = [];
  for await (const v of gen) {
    values.push(v);
    if (v >= 4) break; // triggers gen.return()
  }
  console.log("Ex45 — cancellable async generator:", values);
}

/** async generator with AbortController: cooperative cancellation */
async function ex46() {
  async function* cancellableSource(signal) {
    let i = 0;
    while (!signal.aborted) {
      await new Promise(r => setTimeout(r, 0));
      yield i++;
    }
  }
  const controller = new AbortController();
  const values = [];
  const gen = cancellableSource(controller.signal);
  setTimeout(() => controller.abort(), 5);
  for await (const v of gen) {
    values.push(v);
    if (values.length >= 3) break;
  }
  console.log("Ex46 — AbortController async generator:", values);
}

/** structured concurrency via generators: join multiple async generators */
async function ex47() {
  async function* gen1() { yield 1; yield 2; yield 3; }
  async function* gen2() { yield "a"; yield "b"; yield "c"; }
  async function mergeAll(...gens) {
    const results = await Promise.all(
      gens.map(async g => { const r = []; for await (const v of g()) r.push(v); return r; })
    );
    return results;
  }
  const [nums, letters] = await mergeAll(gen1, gen2);
  console.log("Ex47 — structured concurrency:", nums, letters);
}

/** effect system via generators: yield effects, interpret separately */
async function ex48() {
  // Generators yield "effect descriptors"; an interpreter runs them
  function* program() {
    const result = yield { type: "add", a: 10, b: 20 };
    const doubled = yield { type: "multiply", a: result, b: 2 };
    return doubled;
  }
  function interpret(gen) {
    function step(value) {
      const { value: effect, done } = gen.next(value);
      if (done) return effect;
      if (effect.type === "add") return step(effect.a + effect.b);
      if (effect.type === "multiply") return step(effect.a * effect.b);
    }
    return step();
  }
  const result = interpret(program());
  console.log("Ex48 — effect system via generators:", result);
}

/** generator-based retry: retry async op with generator control flow */
async function ex49() {
  async function* retryGen(fn, maxRetries) {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        const result = await fn(attempt);
        yield { success: true, result, attempt };
        return;
      } catch (e) {
        attempt++;
        yield { success: false, error: e.message, attempt };
      }
    }
  }
  let callCount = 0;
  async function flakyOp(attempt) {
    callCount++;
    if (attempt < 2) throw new Error("temporary failure");
    return "success on attempt " + attempt;
  }
  const outcomes = [];
  for await (const outcome of retryGen(flakyOp, 5)) outcomes.push(outcome);
  console.log("Ex49 — generator retry:", outcomes);
}

/** generator-based observable: push values to subscribers */
function ex50() {
  function createObservable(genFn) {
    return {
      subscribe(observer) {
        const gen = genFn(observer);
        function pump() {
          const { done } = gen.next();
          if (!done) setImmediate ? setImmediate(pump) : setTimeout(pump, 0);
        }
        pump();
        return { unsubscribe: () => gen.return() };
      }
    };
  }
  const received = [];
  const observable = createObservable(function*(observer) {
    observer.next(1); yield;
    observer.next(2); yield;
    observer.next(3); yield;
    observer.complete();
  });
  const sub = observable.subscribe({
    next: v => received.push(v),
    complete: () => console.log("Ex50 — generator observable received:", received)
  });
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== BASIC (1–13) ===");
  ex01(); ex02(); ex03(); ex04(); ex05(); ex06(); ex07(); ex08(); ex09(); ex10();
  ex11(); ex12(); ex13();
  console.log("=== INTERMEDIATE (14–26) ===");
  ex14(); ex15(); ex16(); ex17(); ex18(); ex19(); ex20(); ex21(); ex22(); ex23();
  ex24(); ex25(); ex26();
  console.log("=== NESTED (27–38) ===");
  ex27(); ex28(); ex29(); ex30(); ex31(); ex32(); ex33(); ex34(); ex35(); ex36();
  ex37(); ex38();
  console.log("=== ADVANCED (39–50) ===");
  await ex39(); await ex40(); await ex41(); await ex42(); await ex43(); await ex44();
  await ex45(); await ex46(); await ex47(); await ex48(); await ex49(); ex50();
}

main();
