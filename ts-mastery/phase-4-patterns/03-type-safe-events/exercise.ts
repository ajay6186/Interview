// ============================================================================
// Exercise 4.3 — Type-Safe Event Emitter
// ============================================================================
// Build an event emitter where event names and their payloads are type-checked.
//
// Instructions: Fill in every TODO so the file compiles and all assertions pass.
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// Event map — maps event names to their payload types
// ---------------------------------------------------------------------------

interface AppEvents {
  login: { userId: string; timestamp: number };
  logout: { userId: string };
  error: { message: string; code: number };
  message: { from: string; text: string };
}

// ---------------------------------------------------------------------------
// TODO: Implement a type-safe EventEmitter class
// ---------------------------------------------------------------------------

// The emitter should be generic over an event map like AppEvents
// Methods:
//   on<K>(event: K, handler: (payload) => void): void
//   off<K>(event: K, handler: (payload) => void): void
//   emit<K>(event: K, payload): void

class TypedEventEmitter<Events extends Record<string, any>> {
  // TODO: private storage for handlers

  // TODO: on — register a handler for an event

  // TODO: off — remove a handler for an event

  // TODO: emit — fire an event with the correct payload
}

// ---------------------------------------------------------------------------
// Runtime tests
// ---------------------------------------------------------------------------

/*
const emitter = new TypedEventEmitter<AppEvents>();

const results: string[] = [];

const loginHandler = (payload: AppEvents["login"]) => {
  results.push(`login:${payload.userId}`);
};

emitter.on("login", loginHandler);
emitter.on("error", (payload) => {
  results.push(`error:${payload.code}`);
});

emitter.emit("login", { userId: "alice", timestamp: Date.now() });
emitter.emit("error", { message: "Not Found", code: 404 });

console.assert(results[0] === "login:alice", "login event");
console.assert(results[1] === "error:404", "error event");

emitter.off("login", loginHandler);
emitter.emit("login", { userId: "bob", timestamp: Date.now() });
console.assert(results.length === 2, "login handler removed");
*/

console.log("Exercise 4.3 — All assertions passed!");

export {};
