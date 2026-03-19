// ============================================================================
// Solution 4.3 — Type-Safe Event Emitter
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// Event map
// ---------------------------------------------------------------------------

interface AppEvents {
  login: { userId: string; timestamp: number };
  logout: { userId: string };
  error: { message: string; code: number };
  message: { from: string; text: string };
}

// ---------------------------------------------------------------------------
// Type-safe EventEmitter
// ---------------------------------------------------------------------------

class TypedEventEmitter<Events extends Record<string, any>> {
  private handlers = new Map<keyof Events, Set<Function>>();

  on<K extends keyof Events>(event: K, handler: (payload: Events[K]) => void): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  off<K extends keyof Events>(event: K, handler: (payload: Events[K]) => void): void {
    this.handlers.get(event)?.delete(handler);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    this.handlers.get(event)?.forEach((handler) => handler(payload));
  }
}

// ---------------------------------------------------------------------------
// Runtime tests
// ---------------------------------------------------------------------------
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

console.log("Solution 4.3 — All assertions passed!");

export {};
