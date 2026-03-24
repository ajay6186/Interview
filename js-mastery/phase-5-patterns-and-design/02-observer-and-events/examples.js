// Examples 5.2 — Observer & Events
"use strict";

// ─── BASIC (ex01–ex13) ────────────────────────────────────────────────────────

/** @example ex01 — Basic EventEmitter class */
function ex01() {
  class EventEmitter {
    constructor() { this._events = {}; }
    on(e, fn) { (this._events[e] = this._events[e] || []).push(fn); return this; }
    emit(e, ...args) { (this._events[e] || []).forEach(fn => fn(...args)); }
  }
  const em = new EventEmitter();
  const log = [];
  em.on("data", (d) => log.push(d));
  em.emit("data", 1); em.emit("data", 2);
  console.log("ex01 basic EventEmitter:", log);
}

/** @example ex02 — on / emit / off */
function ex02() {
  class EventEmitter {
    constructor() { this._events = {}; }
    on(e, fn) { (this._events[e] = this._events[e] || []).push(fn); return this; }
    off(e, fn) { if (this._events[e]) this._events[e] = this._events[e].filter(f => f !== fn); return this; }
    emit(e, ...args) { (this._events[e] || []).forEach(fn => fn(...args)); }
  }
  const em = new EventEmitter();
  const log = [];
  const fn = (v) => log.push(v);
  em.on("x", fn);
  em.emit("x", "a"); em.emit("x", "b");
  em.off("x", fn);
  em.emit("x", "c");
  console.log("ex02 on/emit/off:", log);
}

/** @example ex03 — Multiple listeners on one event */
function ex03() {
  class EventEmitter {
    constructor() { this._events = {}; }
    on(e, fn) { (this._events[e] = this._events[e] || []).push(fn); return this; }
    emit(e, ...args) { (this._events[e] || []).forEach(fn => fn(...args)); }
  }
  const em = new EventEmitter();
  const log = [];
  em.on("tick", () => log.push("A")).on("tick", () => log.push("B")).on("tick", () => log.push("C"));
  em.emit("tick");
  console.log("ex03 multiple listeners:", log);
}

/** @example ex04 — once() — fires handler exactly once */
function ex04() {
  class EventEmitter {
    constructor() { this._events = {}; }
    on(e, fn) { (this._events[e] = this._events[e] || []).push(fn); return this; }
    off(e, fn) { if (this._events[e]) this._events[e] = this._events[e].filter(f => f !== fn); return this; }
    emit(e, ...args) { (this._events[e] || []).forEach(fn => fn(...args)); }
    once(e, fn) { const w = (...a) => { fn(...a); this.off(e, w); }; return this.on(e, w); }
  }
  const em = new EventEmitter();
  const log = [];
  em.once("init", () => log.push("initialized"));
  em.emit("init"); em.emit("init"); em.emit("init");
  console.log("ex04 once():", log);
}

/** @example ex05 — emit with multiple data arguments */
function ex05() {
  class EventEmitter {
    constructor() { this._events = {}; }
    on(e, fn) { (this._events[e] = this._events[e] || []).push(fn); return this; }
    emit(e, ...args) { (this._events[e] || []).forEach(fn => fn(...args)); }
  }
  const em = new EventEmitter();
  em.on("move", (x, y, z) => console.log("ex05 emit with args:", { x, y, z }));
  em.emit("move", 10, 20, 5);
}

/** @example ex06 — error event convention */
function ex06() {
  class EventEmitter {
    constructor() { this._events = {}; }
    on(e, fn) { (this._events[e] = this._events[e] || []).push(fn); return this; }
    emit(e, ...args) {
      if (e === "error" && !(this._events[e] || []).length) throw args[0] || new Error("Unhandled error");
      (this._events[e] || []).forEach(fn => fn(...args));
    }
  }
  const em = new EventEmitter();
  const errors = [];
  em.on("error", (err) => errors.push(err.message));
  em.emit("error", new Error("connection refused"));
  console.log("ex06 error event:", errors);
}

/** @example ex07 — listener count */
function ex07() {
  class EventEmitter {
    constructor() { this._events = {}; }
    on(e, fn) { (this._events[e] = this._events[e] || []).push(fn); return this; }
    off(e, fn) { if (this._events[e]) this._events[e] = this._events[e].filter(f => f !== fn); return this; }
    listenerCount(e) { return (this._events[e] || []).length; }
  }
  const em = new EventEmitter();
  const f1 = () => {}, f2 = () => {}, f3 = () => {};
  em.on("data", f1).on("data", f2).on("data", f3);
  console.log("ex07 listener count before:", em.listenerCount("data"));
  em.off("data", f2);
  console.log("ex07 listener count after:", em.listenerCount("data"));
}

/** @example ex08 — removeAllListeners */
function ex08() {
  class EventEmitter {
    constructor() { this._events = {}; }
    on(e, fn) { (this._events[e] = this._events[e] || []).push(fn); return this; }
    emit(e, ...args) { (this._events[e] || []).forEach(fn => fn(...args)); }
    removeAllListeners(e) { if (e) delete this._events[e]; else this._events = {}; return this; }
  }
  const em = new EventEmitter();
  const log = [];
  em.on("a", () => log.push("a")).on("b", () => log.push("b")).on("a", () => log.push("a2"));
  em.removeAllListeners("a");
  em.emit("a"); em.emit("b");
  console.log("ex08 removeAllListeners:", log);
}

/** @example ex09 — eventNames() */
function ex09() {
  class EventEmitter {
    constructor() { this._events = {}; }
    on(e, fn) { (this._events[e] = this._events[e] || []).push(fn); return this; }
    eventNames() { return Object.keys(this._events); }
  }
  const em = new EventEmitter();
  em.on("click", () => {}).on("hover", () => {}).on("focus", () => {});
  console.log("ex09 eventNames:", em.eventNames());
}

/** @example ex10 — wildcard concept via namespace */
function ex10() {
  class WildcardEmitter {
    constructor() { this._events = {}; }
    on(pattern, fn) { (this._events[pattern] = this._events[pattern] || []).push(fn); return this; }
    emit(event, ...args) {
      Object.keys(this._events).forEach(pattern => {
        const regex = new RegExp("^" + pattern.replace("*", ".*") + "$");
        if (regex.test(event)) this._events[pattern].forEach(fn => fn(event, ...args));
      });
    }
  }
  const em = new WildcardEmitter();
  const log = [];
  em.on("user:*", (event, data) => log.push({ event, data }));
  em.emit("user:login", { id: 1 });
  em.emit("user:logout", { id: 1 });
  em.emit("order:create", { id: 99 }); // no match
  console.log("ex10 wildcard events:", log);
}

/** @example ex11 — Typed event emitter (with string enums) */
function ex11() {
  const Events = Object.freeze({ CONNECT: "connect", DISCONNECT: "disconnect", DATA: "data" });
  class TypedEmitter {
    constructor() { this._events = {}; }
    on(e, fn) { (this._events[e] = this._events[e] || []).push(fn); return this; }
    emit(e, ...args) { (this._events[e] || []).forEach(fn => fn(...args)); }
  }
  const em = new TypedEmitter();
  const log = [];
  em.on(Events.DATA, (payload) => log.push(payload));
  em.emit(Events.DATA, { bytes: 1024 });
  console.log("ex11 typed emitter:", log);
}

/** @example ex12 — Async event listener */
function ex12() {
  class AsyncEmitter {
    constructor() { this._events = {}; }
    on(e, fn) { (this._events[e] = this._events[e] || []).push(fn); return this; }
    async emitAsync(e, ...args) {
      const listeners = this._events[e] || [];
      for (const fn of listeners) await fn(...args);
    }
  }
  const em = new AsyncEmitter();
  const log = [];
  em.on("task", async (name) => { await new Promise(r => setTimeout(r, 0)); log.push(`done:${name}`); });
  em.on("task", async (name) => { log.push(`started:${name}`); });
  em.emitAsync("task", "process").then(() => console.log("ex12 async emitter:", log));
}

/** @example ex13 — Event emitter with max listeners warning */
function ex13() {
  class SafeEmitter {
    constructor(maxListeners = 10) { this._events = {}; this._max = maxListeners; }
    on(e, fn) {
      const listeners = (this._events[e] = this._events[e] || []);
      if (listeners.length >= this._max) console.warn(`ex13 Warning: MaxListeners exceeded for "${e}"`);
      listeners.push(fn);
      return this;
    }
    emit(e, ...args) { (this._events[e] || []).forEach(fn => fn(...args)); }
  }
  const em = new SafeEmitter(2);
  em.on("data", () => {}).on("data", () => {}).on("data", () => {}); // third triggers warning
  console.log("ex13 safe emitter with max listeners check done");
}

// ─── INTERMEDIATE (ex14–ex26) ─────────────────────────────────────────────────

/** @example ex14 — Pub/Sub pattern */
function ex14() {
  function createPubSub() {
    const topics = {};
    return {
      subscribe(topic, fn) { (topics[topic] = topics[topic] || []).push(fn); return () => { topics[topic] = topics[topic].filter(f => f !== fn); }; },
      publish(topic, data) { (topics[topic] || []).forEach(fn => fn(data)); },
    };
  }
  const ps = createPubSub();
  const log = [];
  const unsub = ps.subscribe("stock", (price) => log.push(price));
  ps.publish("stock", 150); ps.publish("stock", 152);
  unsub();
  ps.publish("stock", 148); // not received
  console.log("ex14 pub/sub:", log);
}

/** @example ex15 — Topic-based pub/sub with namespaces */
function ex15() {
  function createTopicPubSub() {
    const subscriptions = new Map();
    return {
      on(topic, fn) { if (!subscriptions.has(topic)) subscriptions.set(topic, new Set()); subscriptions.get(topic).add(fn); },
      off(topic, fn) { subscriptions.get(topic)?.delete(fn); },
      emit(topic, payload) { (subscriptions.get(topic) || new Set()).forEach(fn => fn(payload)); },
    };
  }
  const bus = createTopicPubSub();
  const log = [];
  bus.on("order.created", (o) => log.push(`created:${o.id}`));
  bus.on("order.cancelled", (o) => log.push(`cancelled:${o.id}`));
  bus.emit("order.created", { id: 1 });
  bus.emit("order.cancelled", { id: 1 });
  console.log("ex15 topic-based pub/sub:", log);
}

/** @example ex16 — Filtered subscription */
function ex16() {
  function createFilteredPubSub() {
    const subscriptions = [];
    return {
      subscribe(fn, filter = () => true) { subscriptions.push({ fn, filter }); },
      publish(data) { subscriptions.forEach(sub => { if (sub.filter(data)) sub.fn(data); }); },
    };
  }
  const ps = createFilteredPubSub();
  const highPriority = [], lowPriority = [];
  ps.subscribe((e) => highPriority.push(e.id), (e) => e.priority === "high");
  ps.subscribe((e) => lowPriority.push(e.id), (e) => e.priority === "low");
  ps.publish({ id: 1, priority: "high" });
  ps.publish({ id: 2, priority: "low" });
  ps.publish({ id: 3, priority: "high" });
  console.log("ex16 filtered subscription, high:", highPriority, "low:", lowPriority);
}

/** @example ex17 — Async subscriber */
function ex17() {
  function createAsyncPubSub() {
    const topics = {};
    return {
      subscribe(topic, fn) { (topics[topic] = topics[topic] || []).push(fn); },
      async publishAsync(topic, data) {
        const listeners = topics[topic] || [];
        await Promise.all(listeners.map(fn => Promise.resolve(fn(data))));
      },
    };
  }
  const ps = createAsyncPubSub();
  const results = [];
  ps.subscribe("compute", async (n) => { await new Promise(r => setTimeout(r, 0)); results.push(n * 2); });
  ps.subscribe("compute", async (n) => { results.push(n * 3); });
  ps.publishAsync("compute", 5).then(() => console.log("ex17 async subscriber:", results));
}

/** @example ex18 — Event aggregator */
function ex18() {
  class EventAggregator {
    constructor() { this._channels = new Map(); }
    getChannel(name) {
      if (!this._channels.has(name)) {
        const listeners = new Set();
        this._channels.set(name, {
          subscribe: (fn) => listeners.add(fn),
          unsubscribe: (fn) => listeners.delete(fn),
          publish: (...args) => listeners.forEach(fn => fn(...args)),
        });
      }
      return this._channels.get(name);
    }
  }
  const agg = new EventAggregator();
  const userChannel = agg.getChannel("users");
  const log = [];
  userChannel.subscribe((u) => log.push(u.name));
  userChannel.publish({ name: "Alice" }); userChannel.publish({ name: "Bob" });
  console.log("ex18 event aggregator:", log);
}

/** @example ex19 — Event bus (global singleton) */
function ex19() {
  const EventBus = (() => {
    const listeners = new Map();
    return {
      on(event, fn) { if (!listeners.has(event)) listeners.set(event, []); listeners.get(event).push(fn); },
      off(event, fn) { if (listeners.has(event)) listeners.set(event, listeners.get(event).filter(f => f !== fn)); },
      emit(event, ...args) { (listeners.get(event) || []).forEach(fn => fn(...args)); },
    };
  })();
  const log = [];
  EventBus.on("navigate", (path) => log.push(`navigated to ${path}`));
  EventBus.emit("navigate", "/home");
  EventBus.emit("navigate", "/about");
  console.log("ex19 event bus:", log);
}

/** @example ex20 — Mediator pattern */
function ex20() {
  function createMediator() {
    const colleagues = new Map();
    return {
      register(name, colleague) { colleagues.set(name, colleague); colleague.mediator = this; },
      send(from, to, message) {
        const recipient = colleagues.get(to);
        if (recipient) recipient.receive(from, message);
      },
      broadcast(from, message) {
        colleagues.forEach((colleague, name) => { if (name !== from) colleague.receive(from, message); });
      },
    };
  }
  const mediator = createMediator();
  const log = [];
  const alice = { receive: (from, msg) => log.push(`Alice got from ${from}: ${msg}`) };
  const bob = { receive: (from, msg) => log.push(`Bob got from ${from}: ${msg}`) };
  mediator.register("alice", alice);
  mediator.register("bob", bob);
  mediator.send("alice", "bob", "hello");
  mediator.broadcast("alice", "hi everyone");
  console.log("ex20 mediator:", log);
}

/** @example ex21 — Event sourcing basics */
function ex21() {
  function createEventStore() {
    const events = [];
    const handlers = {};
    return {
      on(type, fn) { (handlers[type] = handlers[type] || []).push(fn); },
      dispatch(event) {
        events.push({ ...event, timestamp: Date.now() });
        (handlers[event.type] || []).forEach(fn => fn(event));
      },
      replay() { return [...events]; },
      project(fn) { return events.reduce(fn, {}); },
    };
  }
  const store = createEventStore();
  let balance = 0;
  store.on("DEPOSIT", (e) => { balance += e.amount; });
  store.on("WITHDRAW", (e) => { balance -= e.amount; });
  store.dispatch({ type: "DEPOSIT", amount: 100 });
  store.dispatch({ type: "DEPOSIT", amount: 50 });
  store.dispatch({ type: "WITHDRAW", amount: 30 });
  console.log("ex21 event sourcing, balance:", balance, "events:", store.replay().length);
}

/** @example ex22 — Domain events */
function ex22() {
  class DomainEvent {
    constructor(type, payload) {
      this.type = type;
      this.payload = payload;
      this.occurredAt = new Date("2026-01-01");
    }
  }
  class OrderCreated extends DomainEvent {
    constructor(orderId, customerId) { super("ORDER_CREATED", { orderId, customerId }); }
  }
  class OrderShipped extends DomainEvent {
    constructor(orderId, trackingId) { super("ORDER_SHIPPED", { orderId, trackingId }); }
  }
  const events = [new OrderCreated(1, 42), new OrderShipped(1, "TRACK123")];
  console.log("ex22 domain events:", events.map(e => ({ type: e.type, payload: e.payload })));
}

/** @example ex23 — Integration events (serializable) */
function ex23() {
  function createIntegrationEvent(type, payload) {
    return Object.freeze({
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type,
      payload,
      version: 1,
      timestamp: new Date("2026-01-01").toISOString(),
      serialize() { return JSON.stringify({ id: this.id, type: this.type, payload: this.payload, version: this.version }); },
    });
  }
  const evt = createIntegrationEvent("USER_REGISTERED", { userId: 123, email: "alice@example.com" });
  const serialized = evt.serialize();
  console.log("ex23 integration event type:", evt.type, "serialized length:", serialized.length);
}

/** @example ex24 — Reactive stream concept */
function ex24() {
  function createStream(producer) {
    const subscribers = new Set();
    return {
      subscribe(fn) { subscribers.add(fn); return () => subscribers.delete(fn); },
      map(fn) {
        return createStream((emit) => {
          const unsub = this.subscribe((val) => emit(fn(val)));
          return unsub;
        });
      },
      filter(pred) {
        return createStream((emit) => {
          const unsub = this.subscribe((val) => { if (pred(val)) emit(val); });
          return unsub;
        });
      },
      _emit(val) { subscribers.forEach(fn => fn(val)); },
    };
  }
  const source = createStream(() => {});
  const doubled = source.map(x => x * 2).filter(x => x > 4);
  const log = [];
  doubled.subscribe(v => log.push(v));
  [1, 2, 3, 4, 5].forEach(n => source._emit(n));
  console.log("ex24 reactive stream (map+filter):", log);
}

/** @example ex25 — Signal/slot concept */
function ex25() {
  function createSignal(initialValue) {
    let value = initialValue;
    const slots = new Set();
    const signal = function(newValue) {
      if (arguments.length === 0) return value;
      value = newValue;
      slots.forEach(fn => fn(value));
    };
    signal.connect = (fn) => { slots.add(fn); return () => slots.delete(fn); };
    signal.disconnect = (fn) => slots.delete(fn);
    return signal;
  }
  const count = createSignal(0);
  const log = [];
  count.connect(v => log.push(`count is ${v}`));
  count(1); count(2); count(3);
  console.log("ex25 signal/slot:", log, "current:", count());
}

/** @example ex26 — Redux-like store */
function ex26() {
  function createStore(reducer, initialState) {
    let state = initialState;
    const listeners = new Set();
    return {
      getState() { return state; },
      dispatch(action) { state = reducer(state, action); listeners.forEach(fn => fn(state)); },
      subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    };
  }
  function counterReducer(state = { count: 0 }, action) {
    switch (action.type) {
      case "INCREMENT": return { count: state.count + (action.by || 1) };
      case "DECREMENT": return { count: state.count - (action.by || 1) };
      case "RESET": return { count: 0 };
      default: return state;
    }
  }
  const store = createStore(counterReducer, { count: 0 });
  const log = [];
  store.subscribe(s => log.push(s.count));
  store.dispatch({ type: "INCREMENT" });
  store.dispatch({ type: "INCREMENT", by: 5 });
  store.dispatch({ type: "DECREMENT" });
  console.log("ex26 redux-like store, log:", log, "state:", store.getState());
}

// ─── NESTED (ex27–ex38) ───────────────────────────────────────────────────────

/** @example ex27 — Action dispatch with middleware */
function ex27() {
  function createDispatcher(middlewares = []) {
    const handlers = new Map();
    function dispatch(action) {
      let index = 0;
      function next(act) {
        if (index < middlewares.length) { const mw = middlewares[index++]; mw(act, next, dispatch); }
        else { const handler = handlers.get(act.type); if (handler) handler(act); }
      }
      next(action);
    }
    return {
      on(type, handler) { handlers.set(type, handler); },
      dispatch,
    };
  }
  const log = [];
  const dispatcher = createDispatcher([
    (action, next) => { log.push(`before:${action.type}`); next(action); log.push(`after:${action.type}`); },
  ]);
  dispatcher.on("SAVE", (a) => log.push(`saving:${a.data}`));
  dispatcher.dispatch({ type: "SAVE", data: "user" });
  console.log("ex27 action dispatch with middleware:", log);
}

/** @example ex28 — Middleware in events */
function ex28() {
  class MiddlewareEmitter {
    constructor() { this._middlewares = []; this._events = {}; }
    use(fn) { this._middlewares.push(fn); return this; }
    on(e, fn) { (this._events[e] = this._events[e] || []).push(fn); return this; }
    emit(e, data) {
      const middlewares = [...this._middlewares];
      let i = 0;
      const next = (d) => {
        if (i < middlewares.length) middlewares[i++](e, d, next);
        else (this._events[e] || []).forEach(fn => fn(d));
      };
      next(data);
    }
  }
  const em = new MiddlewareEmitter();
  const log = [];
  em.use((e, data, next) => { log.push(`[mw1] ${e}`); next({ ...data, mw1: true }); });
  em.use((e, data, next) => { log.push(`[mw2] ${e}`); next({ ...data, mw2: true }); });
  em.on("request", (data) => log.push(`handler: mw1=${data.mw1} mw2=${data.mw2}`));
  em.emit("request", {});
  console.log("ex28 middleware in events:", log);
}

/** @example ex29 — Event replay */
function ex29() {
  class ReplayableEmitter {
    constructor(bufferSize = 5) {
      this._events = {};
      this._buffer = {};
      this._bufferSize = bufferSize;
    }
    on(e, fn) {
      (this._events[e] = this._events[e] || []).push(fn);
      // replay buffered events to new subscriber
      (this._buffer[e] || []).forEach(args => fn(...args));
      return this;
    }
    emit(e, ...args) {
      if (!this._buffer[e]) this._buffer[e] = [];
      this._buffer[e].push(args);
      if (this._buffer[e].length > this._bufferSize) this._buffer[e].shift();
      (this._events[e] || []).forEach(fn => fn(...args));
    }
  }
  const em = new ReplayableEmitter(3);
  em.emit("msg", "a"); em.emit("msg", "b"); em.emit("msg", "c"); em.emit("msg", "d");
  const received = [];
  em.on("msg", (m) => received.push(m)); // replays last 3
  console.log("ex29 event replay (last 3):", received);
}

/** @example ex30 — Event versioning */
function ex30() {
  class VersionedEmitter {
    constructor() { this._handlers = new Map(); }
    on(event, version, fn) {
      const key = `${event}@${version}`;
      (this._handlers.get(key) || this._handlers.set(key, []).get(key)).push(fn);
    }
    emit(event, version, data) {
      const key = `${event}@${version}`;
      (this._handlers.get(key) || []).forEach(fn => fn(data));
      // Also fire handlers for older compatible versions
      this._handlers.forEach((fns, k) => {
        const [e, v] = k.split("@");
        if (e === event && Number(v) < Number(version)) fns.forEach(fn => fn(data));
      });
    }
  }
  const em = new VersionedEmitter();
  const log = [];
  em.on("user.updated", "1", (d) => log.push(`v1: ${d.name}`));
  em.on("user.updated", "2", (d) => log.push(`v2: ${d.name} (email: ${d.email})`));
  em.emit("user.updated", "2", { name: "Alice", email: "alice@example.com" });
  console.log("ex30 event versioning:", log);
}

/** @example ex31 — Saga with events */
function ex31() {
  function createSaga(steps) {
    const compensations = [];
    return {
      async execute(context) {
        for (const step of steps) {
          try {
            const result = await step.execute(context);
            Object.assign(context, result || {});
            if (step.compensate) compensations.unshift(() => step.compensate(context));
          } catch (err) {
            for (const compensate of compensations) await compensate();
            throw new Error(`Saga failed at step ${step.name}: ${err.message}`);
          }
        }
        return context;
      },
    };
  }
  const saga = createSaga([
    { name: "reserve", execute: async (ctx) => { return { reserved: true, orderId: 123 }; }, compensate: async () => {} },
    { name: "charge", execute: async (ctx) => { return { charged: true, amount: 99 }; }, compensate: async () => {} },
    { name: "confirm", execute: async (ctx) => { return { confirmed: true }; } },
  ]);
  saga.execute({}).then(ctx => console.log("ex31 saga result:", ctx));
}

/** @example ex32 — Process manager */
function ex32() {
  function createProcessManager() {
    const processes = new Map();
    const eventLog = [];
    return {
      startProcess(id, data) {
        processes.set(id, { id, state: "started", data, events: [] });
        eventLog.push({ id, event: "STARTED" });
      },
      handleEvent(id, event, payload) {
        const proc = processes.get(id);
        if (!proc) return;
        proc.events.push({ event, payload });
        eventLog.push({ id, event });
        if (event === "COMPLETED") { proc.state = "completed"; }
        if (event === "FAILED") { proc.state = "failed"; }
      },
      getState(id) { return processes.get(id)?.state; },
      getLog() { return [...eventLog]; },
    };
  }
  const pm = createProcessManager();
  pm.startProcess("order-1", { items: 3 });
  pm.handleEvent("order-1", "PAYMENT_OK", { amount: 100 });
  pm.handleEvent("order-1", "COMPLETED", {});
  console.log("ex32 process manager:", pm.getState("order-1"), "log:", pm.getLog().map(e => e.event));
}

/** @example ex33 — Command bus */
function ex33() {
  function createCommandBus() {
    const handlers = new Map();
    const middlewares = [];
    return {
      use(fn) { middlewares.push(fn); return this; },
      register(command, handler) { handlers.set(command, handler); return this; },
      async execute(command) {
        const handler = handlers.get(command.type);
        if (!handler) throw new Error(`No handler for: ${command.type}`);
        let i = 0;
        const next = async (cmd) => {
          if (i < middlewares.length) return middlewares[i++](cmd, next);
          return handler(cmd);
        };
        return next(command);
      },
    };
  }
  const bus = createCommandBus();
  const log = [];
  bus.use(async (cmd, next) => { log.push(`before:${cmd.type}`); const r = await next(cmd); log.push(`after:${cmd.type}`); return r; });
  bus.register("CREATE_USER", async (cmd) => { return { id: 1, name: cmd.name }; });
  bus.execute({ type: "CREATE_USER", name: "Alice" }).then(result => {
    console.log("ex33 command bus:", result, "log:", log);
  });
}

/** @example ex34 — RxJS-like Observable concept */
function ex34() {
  class Observable {
    constructor(subscriber) { this._subscriber = subscriber; }
    subscribe(observer) {
      const obs = typeof observer === "function" ? { next: observer } : observer;
      let completed = false;
      this._subscriber({
        next: (v) => { if (!completed && obs.next) obs.next(v); },
        error: (e) => { if (!completed && obs.error) obs.error(e); completed = true; },
        complete: () => { if (!completed && obs.complete) obs.complete(); completed = true; },
      });
      return { unsubscribe: () => { completed = true; } };
    }
    static of(...values) { return new Observable(obs => { values.forEach(v => obs.next(v)); obs.complete(); }); }
    map(fn) { return new Observable(obs => this.subscribe({ next: (v) => obs.next(fn(v)), error: obs.error, complete: obs.complete })); }
    filter(pred) { return new Observable(obs => this.subscribe({ next: (v) => { if (pred(v)) obs.next(v); }, error: obs.error, complete: obs.complete })); }
  }
  const results = [];
  Observable.of(1, 2, 3, 4, 5)
    .filter(n => n % 2 === 0)
    .map(n => n * 10)
    .subscribe({ next: v => results.push(v), complete: () => console.log("ex34 Observable:", results) });
}

/** @example ex35 — Subject (hot observable) */
function ex35() {
  class Subject {
    constructor() { this._observers = new Set(); }
    subscribe(fn) {
      const obs = typeof fn === "function" ? { next: fn } : fn;
      this._observers.add(obs);
      return { unsubscribe: () => this._observers.delete(obs) };
    }
    next(value) { this._observers.forEach(obs => obs.next && obs.next(value)); }
    complete() { this._observers.forEach(obs => obs.complete && obs.complete()); }
    error(err) { this._observers.forEach(obs => obs.error && obs.error(err)); }
  }
  const subject = new Subject();
  const log1 = [], log2 = [];
  subject.subscribe(v => log1.push(v));
  subject.next(1); // only log1
  const sub2 = subject.subscribe(v => log2.push(v));
  subject.next(2); subject.next(3); // both
  sub2.unsubscribe();
  subject.next(4); // only log1 again
  console.log("ex35 Subject (hot):", "log1:", log1, "log2:", log2);
}

/** @example ex36 — BehaviorSubject */
function ex36() {
  class BehaviorSubject {
    constructor(initialValue) {
      this._value = initialValue;
      this._observers = new Set();
    }
    get value() { return this._value; }
    subscribe(fn) {
      const obs = typeof fn === "function" ? { next: fn } : fn;
      obs.next && obs.next(this._value); // emit current value immediately
      this._observers.add(obs);
      return { unsubscribe: () => this._observers.delete(obs) };
    }
    next(value) { this._value = value; this._observers.forEach(obs => obs.next && obs.next(value)); }
  }
  const bs = new BehaviorSubject(10);
  const log = [];
  bs.subscribe(v => log.push(`A:${v}`));
  bs.next(20);
  bs.subscribe(v => log.push(`B:${v}`)); // gets current 20 immediately
  bs.next(30);
  console.log("ex36 BehaviorSubject:", log);
}

/** @example ex37 — ReplaySubject */
function ex37() {
  class ReplaySubject {
    constructor(bufferSize = Infinity) {
      this._buffer = [];
      this._bufferSize = bufferSize;
      this._observers = new Set();
    }
    subscribe(fn) {
      const obs = typeof fn === "function" ? { next: fn } : fn;
      this._buffer.forEach(v => obs.next && obs.next(v));
      this._observers.add(obs);
      return { unsubscribe: () => this._observers.delete(obs) };
    }
    next(value) {
      this._buffer.push(value);
      if (this._buffer.length > this._bufferSize) this._buffer.shift();
      this._observers.forEach(obs => obs.next && obs.next(value));
    }
  }
  const rs = new ReplaySubject(3);
  rs.next(1); rs.next(2); rs.next(3); rs.next(4);
  const log = [];
  rs.subscribe(v => log.push(v)); // replays last 3
  console.log("ex37 ReplaySubject (last 3):", log);
}

/** @example ex38 — Cold vs hot observable */
function ex38() {
  // Cold: each subscriber gets own execution
  function coldObservable() {
    return {
      subscribe(fn) {
        const values = [1, 2, 3];
        values.forEach(v => fn(v));
      },
    };
  }
  // Hot: shared execution
  function hotObservable() {
    const observers = new Set();
    let count = 0;
    const interval = setInterval(() => {
      count++;
      if (count > 3) { clearInterval(interval); return; }
      observers.forEach(fn => fn(count));
    }, 0);
    return { subscribe: (fn) => { observers.add(fn); return () => observers.delete(fn); } };
  }
  const cold = coldObservable();
  const log1 = [], log2 = [];
  cold.subscribe(v => log1.push(v));
  cold.subscribe(v => log2.push(v));
  console.log("ex38 cold (each gets own):", log1, log2);
  const hot = hotObservable();
  const hotLog = [];
  const unsub = hot.subscribe(v => hotLog.push(v));
  setTimeout(() => console.log("ex38 hot (shared):", hotLog), 10);
}

// ─── ADVANCED (ex39–ex50) ─────────────────────────────────────────────────────

/** @example ex39 — Operator concept: map/filter on stream */
function ex39() {
  class Stream {
    constructor(subscribe) { this._subscribe = subscribe; }
    subscribe(fn) { this._subscribe(fn); }
    pipe(...operators) { return operators.reduce((stream, op) => op(stream), this); }
    static from(iterable) {
      return new Stream(fn => { for (const v of iterable) fn(v); });
    }
  }
  const map = (fn) => (stream) => new Stream(sink => stream.subscribe(v => sink(fn(v))));
  const filter = (pred) => (stream) => new Stream(sink => stream.subscribe(v => { if (pred(v)) sink(v); }));
  const take = (n) => (stream) => new Stream(sink => { let count = 0; stream.subscribe(v => { if (count < n) { sink(v); count++; } }); });
  const results = [];
  Stream.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    .pipe(filter(n => n % 2 === 0), map(n => n * n), take(3))
    .subscribe(v => results.push(v));
  console.log("ex39 stream operators:", results);
}

/** @example ex40 — combineLatest concept */
function ex40() {
  function combineLatest(observables) {
    const latest = new Array(observables.length).fill(undefined);
    const hasValue = new Array(observables.length).fill(false);
    const observers = new Set();
    observables.forEach((obs, i) => {
      obs.subscribe((v) => {
        latest[i] = v;
        hasValue[i] = true;
        if (hasValue.every(Boolean)) observers.forEach(fn => fn([...latest]));
      });
    });
    return { subscribe: (fn) => observers.add(fn) };
  }
  function createSubject() {
    const obs = new Set();
    return {
      subscribe: (fn) => obs.add(fn),
      next: (v) => obs.forEach(fn => fn(v)),
    };
  }
  const a = createSubject(), b = createSubject();
  const combined = combineLatest([a, b]);
  const log = [];
  combined.subscribe(vals => log.push([...vals]));
  a.next(1); b.next("x"); a.next(2); b.next("y");
  console.log("ex40 combineLatest:", log);
}

/** @example ex41 — switchMap concept */
function ex41() {
  function createSubject() {
    const obs = new Set();
    return {
      subscribe: (fn) => { obs.add(fn); return () => obs.delete(fn); },
      next: (v) => obs.forEach(fn => fn(v)),
    };
  }
  function switchMap(project) {
    return function(source) {
      const sinks = new Set();
      let innerUnsub = null;
      source.subscribe((value) => {
        if (innerUnsub) innerUnsub();
        const inner = project(value);
        innerUnsub = inner.subscribe((v) => sinks.forEach(fn => fn(v)));
      });
      return { subscribe: (fn) => sinks.add(fn) };
    };
  }
  const source = createSubject();
  const log = [];
  switchMap((id) => {
    const inner = createSubject();
    setTimeout(() => inner.next(`result-for-${id}`), 0);
    return inner;
  })(source).subscribe(v => log.push(v));
  source.next(1); source.next(2); // cancels 1
  setTimeout(() => console.log("ex41 switchMap (only last wins):", log), 10);
}

/** @example ex42 — Cancellation via unsubscribe */
function ex42() {
  function createIntervalObservable(ms) {
    return {
      subscribe(fn) {
        let count = 0;
        const id = setInterval(() => fn(count++), ms);
        return { unsubscribe: () => clearInterval(id) };
      },
    };
  }
  const interval$ = createIntervalObservable(0);
  const log = [];
  const sub = interval$.subscribe(n => log.push(n));
  setTimeout(() => {
    sub.unsubscribe();
    setTimeout(() => console.log("ex42 cancellation, received:", log.length, "values before cancel"), 10);
  }, 5);
}

/** @example ex43 — Scheduler in reactive */
function ex43() {
  function createScheduler() {
    const queue = [];
    let running = false;
    function flush() {
      if (running) return;
      running = true;
      while (queue.length) { const task = queue.shift(); task(); }
      running = false;
    }
    return {
      schedule(fn, delay = 0) {
        if (delay === 0) { queue.push(fn); flush(); }
        else setTimeout(() => { queue.push(fn); flush(); }, delay);
      },
      asap(fn) { Promise.resolve().then(() => { queue.push(fn); flush(); }); },
    };
  }
  const scheduler = createScheduler();
  const log = [];
  scheduler.schedule(() => log.push("sync-1"));
  scheduler.schedule(() => log.push("sync-2"));
  scheduler.asap(() => log.push("microtask"));
  scheduler.schedule(() => log.push("delayed"), 0);
  Promise.resolve().then(() => console.log("ex43 scheduler:", log));
}

/** @example ex44 — Event-driven FSM */
function ex44() {
  function createFSM(config) {
    let current = config.initial;
    const listeners = new Map();
    return {
      get state() { return current; },
      send(event) {
        const transitions = config.states[current];
        if (!transitions || !transitions[event]) {
          console.log(`ex44 Invalid transition: ${current} + ${event}`);
          return this;
        }
        const next = transitions[event];
        (listeners.get(`${current}:exit`) || []).forEach(fn => fn(current, event));
        current = next;
        (listeners.get(`${current}:enter`) || []).forEach(fn => fn(current, event));
        (listeners.get("transition") || []).forEach(fn => fn({ from: current === next ? current : Object.keys(config.states).find(s => config.states[s][event] === current) || "?", to: current, event }));
        return this;
      },
      on(hook, fn) { (listeners.get(hook) || listeners.set(hook, []).get(hook)).push(fn); return this; },
    };
  }
  const machine = createFSM({
    initial: "idle",
    states: {
      idle: { START: "loading" },
      loading: { SUCCESS: "success", ERROR: "error" },
      success: { RESET: "idle" },
      error: { RETRY: "loading", RESET: "idle" },
    },
  });
  const transitions = [];
  machine.on("transition", (t) => transitions.push(t.to));
  machine.send("START").send("SUCCESS").send("RESET");
  console.log("ex44 event-driven FSM:", machine.state, "transitions:", transitions);
}

/** @example ex45 — Reactive form model */
function ex45() {
  function createFormField(initial = "", validators = []) {
    let value = initial;
    const onChange = new Set();
    const onValidate = new Set();
    return {
      get value() { return value; },
      setValue(v) {
        value = v;
        const errors = validators.map(fn => fn(v)).filter(Boolean);
        onChange.forEach(fn => fn(v));
        onValidate.forEach(fn => fn(errors));
        return { value: v, errors, valid: errors.length === 0 };
      },
      onChange: (fn) => onChange.add(fn),
      onValidate: (fn) => onValidate.add(fn),
    };
  }
  const emailField = createFormField("", [
    (v) => !v ? "required" : null,
    (v) => v && !v.includes("@") ? "invalid email" : null,
  ]);
  const states = [];
  emailField.onValidate(errors => states.push({ errors }));
  emailField.setValue("not-an-email");
  emailField.setValue("user@example.com");
  console.log("ex45 reactive form:", states);
}

/** @example ex46 — Event-driven data pipeline */
function ex46() {
  function createPipeline(...stages) {
    const emitter = (() => {
      const listeners = {};
      return {
        on: (e, fn) => { (listeners[e] = listeners[e] || []).push(fn); },
        emit: (e, ...args) => { (listeners[e] || []).forEach(fn => fn(...args)); },
      };
    })();
    return {
      process(data) {
        let result = data;
        for (const stage of stages) {
          try {
            result = stage(result);
            emitter.emit("stage", { name: stage.name, output: result });
          } catch (err) {
            emitter.emit("error", { stage: stage.name, error: err });
            throw err;
          }
        }
        emitter.emit("complete", result);
        return result;
      },
      on: emitter.on,
    };
  }
  function parse(raw) { return JSON.parse(raw); }
  function validate(data) { if (!data.name) throw new Error("name required"); return data; }
  function transform(data) { return { ...data, name: data.name.toUpperCase() }; }
  const pipeline = createPipeline(parse, validate, transform);
  const events = [];
  pipeline.on("stage", (e) => events.push(e.name));
  pipeline.on("complete", (r) => console.log("ex46 pipeline result:", r, "stages:", events));
  pipeline.process('{"name":"alice","age":30}');
}

/** @example ex47 — Event deduplication */
function ex47() {
  function createDedupEmitter(windowMs = 100) {
    const listeners = {};
    const lastEmit = {};
    return {
      on(e, fn) { (listeners[e] = listeners[e] || []).push(fn); },
      emit(e, key, ...args) {
        const dedupKey = `${e}:${key}`;
        const now = Date.now();
        if (lastEmit[dedupKey] && now - lastEmit[dedupKey] < windowMs) return;
        lastEmit[dedupKey] = now;
        (listeners[e] || []).forEach(fn => fn(key, ...args));
      },
    };
  }
  const em = createDedupEmitter(1000); // 1s window
  const log = [];
  em.on("click", (id) => log.push(id));
  em.emit("click", "btn-1"); // emitted
  em.emit("click", "btn-1"); // deduplicated
  em.emit("click", "btn-2"); // different key, emitted
  em.emit("click", "btn-1"); // still deduplicated
  console.log("ex47 event deduplication:", log);
}

/** @example ex48 — Event batching */
function ex48() {
  function createBatchingEmitter(delayMs = 0) {
    const listeners = {};
    const pending = {};
    const timers = {};
    return {
      on(e, fn) { (listeners[e] = listeners[e] || []).push(fn); },
      emit(e, data) {
        (pending[e] = pending[e] || []).push(data);
        if (!timers[e]) {
          timers[e] = setTimeout(() => {
            const batch = pending[e];
            delete pending[e];
            delete timers[e];
            (listeners[e] || []).forEach(fn => fn(batch));
          }, delayMs);
        }
      },
    };
  }
  const em = createBatchingEmitter(0);
  em.on("update", (batch) => console.log("ex48 batched updates:", batch));
  em.emit("update", { id: 1, name: "Alice" });
  em.emit("update", { id: 2, name: "Bob" });
  em.emit("update", { id: 3, name: "Charlie" });
  // All three emitted in the same tick are batched
}

/** @example ex49 — Distributed event concept */
function ex49() {
  function createEventNetwork() {
    const nodes = new Map();
    return {
      addNode(name) {
        const listeners = {};
        const node = {
          name,
          on(e, fn) { (listeners[e] = listeners[e] || []).push(fn); return this; },
          emit(e, data) {
            (listeners[e] || []).forEach(fn => fn(data));
            // Propagate to all other nodes
            nodes.forEach((n, nName) => { if (nName !== name && n._listeners[e]) n._listeners[e].forEach(fn => fn({ ...data, _origin: name })); });
          },
          _listeners: listeners,
        };
        nodes.set(name, node);
        return node;
      },
    };
  }
  const net = createEventNetwork();
  const nodeA = net.addNode("A");
  const nodeB = net.addNode("B");
  const log = [];
  nodeB.on("message", (data) => log.push({ to: "B", ...data }));
  nodeA.emit("message", { text: "hello" });
  console.log("ex49 distributed events:", log);
}

/** @example ex50 — Full reactive system */
function ex50() {
  // Miniature reactive system: store + computed + effects
  function reactive(data) {
    const deps = new Map();
    let currentEffect = null;
    function track(key) { if (currentEffect) { if (!deps.has(key)) deps.set(key, new Set()); deps.get(key).add(currentEffect); } }
    function trigger(key) { (deps.get(key) || new Set()).forEach(fn => fn()); }
    const proxy = new Proxy(data, {
      get(target, key) { track(key); return target[key]; },
      set(target, key, value) { target[key] = value; trigger(key); return true; },
    });
    function effect(fn) { currentEffect = fn; fn(); currentEffect = null; }
    function computed(fn) {
      let value;
      effect(() => { value = fn(); });
      return { get value() { return value; } };
    }
    return { proxy, effect, computed };
  }
  const { proxy: state, effect, computed } = reactive({ count: 0, multiplier: 2 });
  const doubled = computed(() => state.count * state.multiplier);
  const log = [];
  effect(() => log.push(`count=${state.count} doubled=${doubled.value}`));
  state.count = 1; state.count = 2; state.multiplier = 3;
  console.log("ex50 full reactive system effects:", log);
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
