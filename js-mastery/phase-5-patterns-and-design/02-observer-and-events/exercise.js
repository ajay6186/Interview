// ============================================================================
// Exercise 5.2 — Observer & Events
// ============================================================================
// Implement the Observer pattern: an EventEmitter with on/off/emit/once,
// and a separate PubSub for decoupled message passing.
//
// Instructions: Fill in every TODO so the file runs and all assertions pass.
// Run with: node exercise.js
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// 1. EventEmitter
// ---------------------------------------------------------------------------

// TODO: Implement EventEmitter class with:
//       - on(event, fn)    — subscribe fn to event
//       - off(event, fn)   — unsubscribe fn from event
//       - emit(event, ...args) — call all listeners with args
//       - once(event, fn)  — subscribe fn but remove it after first call
class EventEmitter {
  constructor() {
    // TODO: initialize this._events
  }

  on(event, fn) {
    // TODO: implement
  }

  off(event, fn) {
    // TODO: implement
  }

  emit(event, ...args) {
    // TODO: implement
  }

  once(event, fn) {
    // TODO: wrap fn in a one-time wrapper that calls off after firing
  }
}

// ---------------------------------------------------------------------------
// 2. PubSub
// ---------------------------------------------------------------------------

// TODO: Implement PubSub module (IIFE) with:
//       - subscribe(topic, fn)   — register fn for topic
//       - publish(topic, data)   — call all subscribers with data
//       - unsubscribe(topic, fn) — remove fn from topic
const PubSub = (() => {
  // TODO: private const topics = {}; return { subscribe, publish, unsubscribe }
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

console.log("Exercise 5.2 — All assertions passed!");
