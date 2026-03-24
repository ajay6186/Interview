// ============================================================================
// Solution 5.2 — Observer & Events
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. EventEmitter
// ---------------------------------------------------------------------------

class EventEmitter {
  constructor() {
    this._events = Object.create(null);
  }

  on(event, fn) {
    if (!this._events[event]) this._events[event] = [];
    this._events[event].push(fn);
    return this;
  }

  off(event, fn) {
    if (!this._events[event]) return this;
    this._events[event] = this._events[event].filter(f => f !== fn);
    return this;
  }

  emit(event, ...args) {
    if (!this._events[event]) return false;
    [...this._events[event]].forEach(fn => fn(...args));
    return true;
  }

  once(event, fn) {
    const wrapper = (...args) => {
      fn(...args);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }
}

// ---------------------------------------------------------------------------
// 2. PubSub
// ---------------------------------------------------------------------------

const PubSub = (() => {
  const topics = Object.create(null);

  function subscribe(topic, fn) {
    if (!topics[topic]) topics[topic] = [];
    topics[topic].push(fn);
    return function unsubscribe() {
      topics[topic] = topics[topic].filter(f => f !== fn);
    };
  }

  function publish(topic, data) {
    if (!topics[topic]) return;
    topics[topic].forEach(fn => fn(data));
  }

  function unsubscribe(topic, fn) {
    if (!topics[topic]) return;
    topics[topic] = topics[topic].filter(f => f !== fn);
  }

  return { subscribe, publish, unsubscribe };
})();

// ---------------------------------------------------------------------------
// Runtime assertions
// ---------------------------------------------------------------------------

const em = new EventEmitter();
const results = [];
const handler = x => results.push(x);
em.on("test", handler);
em.emit("test", 1);
em.emit("test", 2);
em.off("test", handler);
em.emit("test", 3); // should not reach handler
console.assert(JSON.stringify(results) === "[1,2]", "EventEmitter: on/off/emit");

const onceResults = [];
em.once("once", x => onceResults.push(x));
em.emit("once", "a");
em.emit("once", "b"); // should not fire
console.assert(JSON.stringify(onceResults) === '["a"]', "EventEmitter: once");

const pubResults = [];
PubSub.subscribe("news", msg => pubResults.push(msg));
PubSub.publish("news", "headline 1");
PubSub.publish("news", "headline 2");
console.assert(pubResults.length === 2, "PubSub: subscribe and publish");

console.log("Solution 5.2 — All assertions passed!");
