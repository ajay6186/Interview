export {};

// ============================================================
// NESTED EXAMPLES — State Machine (50 Examples)
// ============================================================

// 1. Nested/hierarchical state definition
type TrafficState = "red" | "yellow" | "green";
type PedestrianState = "walk" | "wait" | "blink";
type IntersectionState = { traffic: TrafficState; pedestrian: PedestrianState };

// 2. Hierarchical machine with multiple regions
class IntersectionMachine {
  state: IntersectionState = { traffic: "red", pedestrian: "walk" };
  tick(): void {
    if (this.state.traffic === "red") {
      this.state = { traffic: "green", pedestrian: "wait" };
    } else if (this.state.traffic === "green") {
      this.state = { traffic: "yellow", pedestrian: "wait" };
    } else {
      this.state = { traffic: "red", pedestrian: "blink" };
      setTimeout(() => { if (this.state.traffic === "red") this.state = { ...this.state, pedestrian: "walk" }; }, 2000);
    }
  }
}

// 3. Compound states — state with sub-states encoded in type
type CheckoutState =
  | "browsing"
  | "cart.empty" | "cart.has_items"
  | "checkout.address" | "checkout.payment" | "checkout.review"
  | "order.processing" | "order.confirmed" | "order.failed";

// 4. Compound state machine — encoded as nested literals
type CheckoutEvent = "add_item" | "remove_all" | "next" | "back" | "submit" | "confirm" | "retry";

const checkoutTransitions: Partial<Record<CheckoutState, Partial<Record<CheckoutEvent, CheckoutState>>>> = {
  "browsing": { add_item: "cart.has_items" },
  "cart.empty": { add_item: "cart.has_items" },
  "cart.has_items": { remove_all: "cart.empty", next: "checkout.address" },
  "checkout.address": { next: "checkout.payment", back: "cart.has_items" },
  "checkout.payment": { next: "checkout.review", back: "checkout.address" },
  "checkout.review": { submit: "order.processing", back: "checkout.payment" },
  "order.processing": { confirm: "order.confirmed", retry: "order.failed" },
  "order.failed": { retry: "order.processing" },
};

// 5. Actor model — machines sending messages to each other
interface Actor<M> { receive(msg: M): void; }
type ActorMessage<T> = { type: string; payload: T };

class ActorMachine<S extends string, E extends string, M> {
  private state: S;
  constructor(
    initial: S,
    private transitions: Partial<Record<S, Partial<Record<E, S>>>>,
    private messageHandlers: Partial<Record<S, (msg: M) => E | null>> = {}
  ) { this.state = initial; }
  receive(msg: M): void {
    const handler = this.messageHandlers[this.state];
    if (!handler) return;
    const event = handler(msg);
    if (event) this.send(event);
  }
  private send(event: E): void {
    const next = this.transitions[this.state]?.[event];
    if (next) this.state = next;
  }
  getState(): S { return this.state; }
}

// 6. XState-inspired service interpretation
interface MachineService<S extends string, E extends string, C> {
  state: S;
  context: C;
  send(event: E | { type: E; [key: string]: unknown }): void;
  subscribe(listener: (state: S, ctx: C) => void): () => void;
}

// 7. Full-featured machine with guards, actions, and services
interface XStateLikeDef<S extends string, E extends string, C> {
  initial: S;
  context: C;
  states: {
    [State in S]: {
      on?: Partial<Record<E, { target: S; guard?: (ctx: C) => boolean; action?: (ctx: C, event: E) => Partial<C> }>>;
      entry?: (ctx: C) => Partial<C>;
      exit?: (ctx: C) => void;
      type?: "final";
    };
  };
}

// 8. Interpreter for the XState-like definition
class XStateInterpreter<S extends string, E extends string, C> implements MachineService<S, E, C> {
  state: S;
  context: C;
  private listeners: ((s: S, c: C) => void)[] = [];
  constructor(private def: XStateLikeDef<S, E, C>) {
    this.state = def.initial;
    this.context = { ...def.context };
    this.runEntry(this.state);
  }
  private runEntry(state: S): void {
    const entry = this.def.states[state].entry;
    if (entry) this.context = { ...this.context, ...entry(this.context) };
  }
  send(event: E | { type: E; [key: string]: unknown }): void {
    const type = typeof event === "string" ? event : event.type;
    const transition = this.def.states[this.state].on?.[type];
    if (!transition) return;
    if (transition.guard && !transition.guard(this.context)) return;
    this.def.states[this.state].exit?.(this.context);
    if (transition.action) this.context = { ...this.context, ...transition.action(this.context, type) };
    this.state = transition.target;
    this.runEntry(this.state);
    this.listeners.forEach(fn => fn(this.state, this.context));
  }
  subscribe(fn: (s: S, c: C) => void): () => void {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }
}

// 9. Spawning child machines from a parent
class ParentMachine<S extends string, E extends string> {
  private _state: S;
  private children: Map<string, { state: string; send: (e: string) => void }> = new Map();
  constructor(initial: S, private transitions: Partial<Record<S, Partial<Record<E, { target: S; spawn?: string }>>>>) {
    this._state = initial;
  }
  get state(): S { return this._state; }
  spawn(id: string, child: { state: string; send: (e: string) => void }): void { this.children.set(id, child); }
  send(event: E): void {
    const transition = this.transitions[this._state]?.[event];
    if (!transition) return;
    this._state = transition.target;
  }
  getChild(id: string): { state: string; send: (e: string) => void } | undefined { return this.children.get(id); }
}

// 10. Machine with delayed transitions (via promises)
class DelayedMachine<S extends string, E extends string> {
  private _state: S;
  private pending: ReturnType<typeof setTimeout>[] = [];
  constructor(
    initial: S,
    private transitions: Partial<Record<S, Partial<Record<E, S>>>>,
    private delays: Partial<Record<S, { event: E; ms: number }>> = {}
  ) {
    this._state = initial;
    this.scheduleDelay(initial);
  }
  private scheduleDelay(state: S): void {
    const d = this.delays[state];
    if (d) {
      const id = setTimeout(() => this.send(d.event), d.ms);
      this.pending.push(id);
    }
  }
  get state(): S { return this._state; }
  send(event: E): void {
    const next = this.transitions[this._state]?.[event];
    if (!next) return;
    this._state = next;
    this.scheduleDelay(next);
  }
  dispose(): void { this.pending.forEach(clearTimeout); }
}

// 11. Machine composition — wrap machine with additional behavior
class MachineDecorator<S extends string, E extends string> {
  constructor(protected machine: { state: S; send(e: E): void }) {}
  get state(): S { return this.machine.state; }
  send(event: E): void { this.machine.send(event); }
}

class LoggedMachine<S extends string, E extends string> extends MachineDecorator<S, E> {
  log: Array<{ event: E; from: S; to: S; ts: number }> = [];
  send(event: E): void {
    const from = this.state;
    super.send(event);
    this.log.push({ event, from, to: this.state, ts: Date.now() });
  }
}

// 12. Nested machine factory with config
interface MachineConfig<S extends string, E extends string, C> {
  id: string;
  initial: S;
  context: C;
  states: XStateLikeDef<S, E, C>["states"];
}
function createMachine<S extends string, E extends string, C>(
  config: MachineConfig<S, E, C>
): XStateInterpreter<S, E, C> {
  return new XStateInterpreter<S, E, C>({ initial: config.initial, context: config.context, states: config.states });
}

// 13. Nested checkout machine with typed context
type CheckoutEvent2 = "ADD_ITEM" | "REMOVE_ITEM" | "NEXT" | "BACK" | "SUBMIT" | "PAYMENT_OK" | "PAYMENT_FAIL";
type CheckoutState2 = "idle" | "cart" | "address" | "payment" | "review" | "processing" | "success" | "failure";
interface CheckoutContext { items: string[]; address?: string; paymentMethod?: string; orderId?: string; error?: string; }

const checkoutMachine = createMachine<CheckoutState2, CheckoutEvent2, CheckoutContext>({
  id: "checkout",
  initial: "idle",
  context: { items: [] },
  states: {
    idle: { on: { ADD_ITEM: { target: "cart", action: (ctx, _) => ({ items: [...ctx.items, "item"] }) } } },
    cart: {
      on: {
        ADD_ITEM: { target: "cart", action: (ctx) => ({ items: [...ctx.items, "item"] }) },
        NEXT: { target: "address", guard: ctx => ctx.items.length > 0 },
      }
    },
    address: {
      on: {
        NEXT: { target: "payment" },
        BACK: { target: "cart" },
      }
    },
    payment: { on: { NEXT: { target: "review" }, BACK: { target: "address" } } },
    review: { on: { SUBMIT: { target: "processing" }, BACK: { target: "payment" } } },
    processing: {
      on: {
        PAYMENT_OK: { target: "success", action: (ctx) => ({ orderId: "ORD-" + Date.now() }) },
        PAYMENT_FAIL: { target: "failure", action: (_, e) => ({ error: "Payment failed" }) },
      }
    },
    success: { type: "final" },
    failure: { on: { BACK: { target: "payment" } } },
  }
});

// 14. Machine event bus — publish machine transitions to global bus
type EventBusHandler = (event: { machine: string; from: string; to: string; event: string }) => void;
class MachineEventBus {
  private handlers: EventBusHandler[] = [];
  on(fn: EventBusHandler): () => void {
    this.handlers.push(fn);
    return () => { this.handlers = this.handlers.filter(h => h !== fn); };
  }
  publish(event: Parameters<EventBusHandler>[0]): void { this.handlers.forEach(h => h(event)); }
  connect<S extends string, E extends string>(name: string, machine: XStateInterpreter<S, E, unknown>): void {
    machine.subscribe((to, _) => this.publish({ machine: name, from: "", to, event: "" }));
  }
}

// 15. Nested machine — promise-based event emitter
class PromiseMachine<S extends string, E extends string> {
  private _state: S;
  private waiters = new Map<S, Array<(s: S) => void>>();
  constructor(initial: S, private transitions: Partial<Record<S, Partial<Record<E, S>>>>) {
    this._state = initial;
  }
  get state(): S { return this._state; }
  send(event: E): void {
    const next = this.transitions[this._state]?.[event];
    if (!next) return;
    this._state = next;
    const waitingForState = this.waiters.get(next) ?? [];
    waitingForState.forEach(fn => fn(next));
    this.waiters.delete(next);
  }
  waitFor(state: S): Promise<S> {
    if (this._state === state) return Promise.resolve(state);
    return new Promise(resolve => {
      const existing = this.waiters.get(state) ?? [];
      this.waiters.set(state, [...existing, resolve]);
    });
  }
}

// 16. Machine with validation on context change
class ValidatedContextMachine<S extends string, E extends string, C> {
  private _state: S;
  constructor(
    initial: S,
    public context: C,
    private transitions: Partial<Record<S, Partial<Record<E, { target: S; mutate?: (ctx: C) => Partial<C> }>>>> ,
    private validate?: (ctx: C) => boolean
  ) { this._state = initial; }
  get state(): S { return this._state; }
  send(event: E): boolean {
    const t = this.transitions[this._state]?.[event];
    if (!t) return false;
    const newCtx = t.mutate ? { ...this.context, ...t.mutate(this.context) } : this.context;
    if (this.validate && !this.validate(newCtx)) return false;
    this.context = newCtx;
    this._state = t.target;
    return true;
  }
}

// 17. Nested machine — combining multiple regions (statechart parallel)
type MusicPlayerState = "playback" | "shuffle" | "repeat";
interface RegionState<S> { state: S; send(e: string): void; }

class ParallelStatechart {
  regions: Map<string, RegionState<string>> = new Map();
  addRegion(name: string, region: RegionState<string>): void { this.regions.set(name, region); }
  sendAll(event: string): void { this.regions.forEach(r => r.send(event)); }
  getState(): Record<string, string> {
    return Object.fromEntries([...this.regions.entries()].map(([k, r]) => [k, r.state]));
  }
}

// 18. Machine to React state hook adapter (simulation)
interface ReactLikeMachineHook<S extends string, E extends string, C> {
  state: S;
  context: C;
  send: (event: E) => void;
}
function useMachine<S extends string, E extends string, C>(
  interpreter: XStateInterpreter<S, E, C>
): ReactLikeMachineHook<S, E, C> {
  return {
    get state() { return interpreter.state; },
    get context() { return interpreter.context; },
    send: (e) => interpreter.send(e),
  };
}

// 19. Machine serialization for persistence
interface SerializedMachineState<S, C> { state: S; context: C; version: number; savedAt: number; }
function saveMachine<S extends string, E extends string, C>(
  machine: XStateInterpreter<S, E, C>,
  version: number
): SerializedMachineState<S, C> {
  return { state: machine.state, context: machine.context, version, savedAt: Date.now() };
}

// 20. Machine state assertion for tests
function assertMachineState<S extends string>(
  machine: { state: S },
  expectedState: S,
  message?: string
): void {
  if (machine.state !== expectedState) {
    throw new Error(message ?? `Expected state '${expectedState}', got '${machine.state}'`);
  }
}

// 21. State machine — traffic light with pedestrian button interaction
type TrafficEvent = "timer" | "pedestrian_button" | "emergency";
class AdvancedTrafficMachine {
  private state: TrafficState = "red";
  private pedestrianRequest = false;
  send(event: TrafficEvent): void {
    if (event === "pedestrian_button") { this.pedestrianRequest = true; return; }
    if (event === "emergency") { this.state = "red"; this.pedestrianRequest = false; return; }
    if (event === "timer") {
      if (this.state === "red") this.state = "green";
      else if (this.state === "green") this.state = "yellow";
      else {
        this.state = "red";
        if (this.pedestrianRequest) { this.pedestrianRequest = false; }
      }
    }
  }
  getState(): { traffic: TrafficState; pedestrianRequest: boolean } {
    return { traffic: this.state, pedestrianRequest: this.pedestrianRequest };
  }
}

// 22. Machine with computed derived state
class DerivedStateMachine<S extends string, E extends string, C, D> {
  constructor(
    private machine: XStateInterpreter<S, E, C>,
    private derive: (state: S, ctx: C) => D
  ) {}
  get state(): S { return this.machine.state; }
  get context(): C { return this.machine.context; }
  get derived(): D { return this.derive(this.machine.state, this.machine.context); }
  send(event: E): void { this.machine.send(event); }
}

// 23. Machine orchestrator — sequence of machines
class MachineOrchestrator {
  private machines: Array<{ machine: { state: string }; isFinal: (s: string) => boolean }> = [];
  private current = 0;
  add(machine: { state: string }, isFinal: (s: string) => boolean): this {
    this.machines.push({ machine, isFinal });
    return this;
  }
  advance(): boolean {
    if (this.current >= this.machines.length) return false;
    const { machine, isFinal } = this.machines[this.current];
    if (isFinal(machine.state)) { this.current++; return true; }
    return false;
  }
  isDone(): boolean { return this.current >= this.machines.length; }
}

// 24. Nested machine — workflow engine with typed steps
interface WorkflowStep<S extends string, E extends string, C> {
  id: S;
  execute: (ctx: C) => Promise<{ event: E; context: Partial<C> }>;
}
class WorkflowEngine<S extends string, E extends string, C> {
  private machine: XStateInterpreter<S, E, C>;
  constructor(def: XStateLikeDef<S, E, C>, private steps: WorkflowStep<S, E, C>[]) {
    this.machine = new XStateInterpreter(def);
  }
  async run(): Promise<C> {
    while (this.def.states[this.machine.state].type !== "final") {
      const step = this.steps.find(s => s.id === this.machine.state);
      if (!step) break;
      const { event, context } = await step.execute(this.machine.context);
      this.machine.context = { ...this.machine.context, ...context };
      this.machine.send(event);
    }
    return this.machine.context;
  }
  private get def(): XStateLikeDef<S, E, C> { return (this.machine as unknown as { def: XStateLikeDef<S, E, C> }).def; }
}

// 25. Machine transition middleware (intercept before/after transition)
type TransitionMiddleware<S extends string, E extends string, C> =
  (from: S, event: E, to: S, ctx: C, next: () => void) => void;

// 26. Machine with transition middleware pipeline
class MiddlewareMachine<S extends string, E extends string, C> {
  private middlewares: TransitionMiddleware<S, E, C>[] = [];
  constructor(private machine: XStateInterpreter<S, E, C>) {
    this.machine.subscribe((to, ctx) => this.runMiddlewares("" as S, "" as E, to, ctx));
  }
  use(mw: TransitionMiddleware<S, E, C>): this { this.middlewares.push(mw); return this; }
  private runMiddlewares(from: S, event: E, to: S, ctx: C): void {
    let i = 0;
    const next = () => { if (i < this.middlewares.length) this.middlewares[i++](from, event, to, ctx, next); };
    next();
  }
  send(event: E): void { this.machine.send(event); }
  get state(): S { return this.machine.state; }
}

// 27. Hierarchical state matching
function isInState<S extends string>(currentState: S, parent: string): boolean {
  return currentState === parent || currentState.startsWith(`${parent}.`);
}

// 28. Machine state path (for compound states)
function getStatePath(state: string): string[] {
  return state.split(".");
}
function getParentState(state: string): string | null {
  const parts = getStatePath(state);
  return parts.length > 1 ? parts.slice(0, -1).join(".") : null;
}

// 29. Cross-machine communication via shared event bus
const globalBus = new MachineEventBus();
class ConnectedMachine<S extends string, E extends string, C> {
  constructor(private machine: XStateInterpreter<S, E, C>, name: string) {
    globalBus.connect(name, machine as unknown as XStateInterpreter<string, string, unknown>);
  }
  send(event: E): void { this.machine.send(event); }
  get state(): S { return this.machine.state; }
}

// 30. Nested machine — saga/side-effect runner
type Saga<S extends string, E extends string, C> = (state: S, ctx: C, send: (e: E) => void) => Promise<void>;
class SagaMachine<S extends string, E extends string, C> {
  constructor(
    private machine: XStateInterpreter<S, E, C>,
    private sagas: Partial<Record<S, Saga<S, E, C>>>
  ) {
    this.machine.subscribe(async (state, ctx) => {
      const saga = this.sagas[state];
      if (saga) await saga(state, ctx, (e) => this.machine.send(e));
    });
  }
  send(event: E): void { this.machine.send(event); }
  get state(): S { return this.machine.state; }
}

// 31-50: Additional nested patterns follow similar complexity level

// 31. Machine state persistence in localStorage
class PersistentMachine<S extends string, E extends string, C> {
  constructor(
    private machine: XStateInterpreter<S, E, C>,
    private key: string
  ) {
    machine.subscribe((state, ctx) => localStorage.setItem(this.key, JSON.stringify({ state, ctx })));
  }
  static restore<S extends string, E extends string, C>(
    key: string,
    def: XStateLikeDef<S, E, C>
  ): XStateInterpreter<S, E, C> {
    const saved = localStorage.getItem(key);
    if (saved) {
      const { state, ctx } = JSON.parse(saved);
      const machine = new XStateInterpreter({ ...def, initial: state, context: ctx });
      return machine;
    }
    return new XStateInterpreter(def);
  }
}

// 32. Machine with typed effects registry
type Effect<C> = (ctx: C) => Promise<void>;
type EffectsMap<S extends string, C> = Partial<Record<S, Effect<C>[]>>;
class EffectfulMachine<S extends string, E extends string, C> {
  constructor(private machine: XStateInterpreter<S, E, C>, private effects: EffectsMap<S, C>) {
    this.machine.subscribe(async (state, ctx) => {
      const stateEffects = this.effects[state] ?? [];
      await Promise.all(stateEffects.map(fn => fn(ctx)));
    });
  }
  send(event: E): void { this.machine.send(event); }
  get state(): S { return this.machine.state; }
}

// 33. Machine test runner
interface MachineTestCase<S extends string, E extends string, C> {
  name: string;
  events: E[];
  expectedState: S;
  expectedContext?: Partial<C>;
}
function runMachineTests<S extends string, E extends string, C>(
  def: XStateLikeDef<S, E, C>,
  cases: MachineTestCase<S, E, C>[]
): { passed: string[]; failed: { name: string; reason: string }[] } {
  const passed: string[] = [];
  const failed: { name: string; reason: string }[] = [];
  for (const tc of cases) {
    const m = new XStateInterpreter(def);
    for (const e of tc.events) m.send(e);
    if (m.state !== tc.expectedState) {
      failed.push({ name: tc.name, reason: `Expected state ${tc.expectedState}, got ${m.state}` });
    } else {
      passed.push(tc.name);
    }
  }
  return { passed, failed };
}

// 34. Machine with schema validation on context
type ContextSchema<C> = { [K in keyof C]: (v: unknown) => boolean };
function withContextValidation<S extends string, E extends string, C>(
  machine: XStateInterpreter<S, E, C>,
  schema: ContextSchema<C>
): XStateInterpreter<S, E, C> {
  const proxy = new Proxy(machine, {
    get(target, prop) {
      if (prop === "send") {
        return (event: E) => {
          target.send(event);
          for (const [key, validate] of Object.entries(schema)) {
            if (!validate(target.context[key as keyof C])) throw new Error(`Invalid context.${key}`);
          }
        };
      }
      return (target as unknown as Record<string, unknown>)[String(prop)];
    }
  });
  return proxy;
}

// 35. Machine with event batching
class BatchingMachine<S extends string, E extends string> {
  private batch: E[] = [];
  constructor(private machine: { state: S; send(e: E): void }) {}
  queue(event: E): void { this.batch.push(event); }
  flush(): void { this.batch.forEach(e => this.machine.send(e)); this.batch = []; }
  get state(): S { return this.machine.state; }
}

// 36. Machine with conditional event routing
function routeEvent<S extends string, E extends string>(
  event: E,
  routes: Array<{ condition: (s: S) => boolean; machine: { state: S; send(e: E): void } }>
): void {
  for (const route of routes) {
    if (route.condition(route.machine.state)) { route.machine.send(event); return; }
  }
}

// 37. Machine context immutability guard
class ImmutableContextMachine<S extends string, E extends string, C extends object> {
  constructor(private machine: XStateInterpreter<S, E, C>) {
    machine.subscribe((_, ctx) => Object.freeze(ctx));
  }
  send(event: E): void { this.machine.send(event); }
  get state(): S { return this.machine.state; }
  get context(): Readonly<C> { return this.machine.context; }
}

// 38. Machine middleware that logs to remote service
type RemoteLogger = { log(entry: object): Promise<void> };
function remoteLoggingMiddleware<S extends string, E extends string, C>(
  machine: XStateInterpreter<S, E, C>,
  logger: RemoteLogger
): void {
  machine.subscribe((state, ctx) => logger.log({ state, ctx, ts: Date.now() }));
}

// 39. Machine-based form field validation
type FieldState = "pristine" | "dirty" | "valid" | "invalid" | "validating";
type FieldEvent = "change" | "blur" | "validate_start" | "validate_ok" | "validate_fail" | "reset";
interface FieldContext { value: string; error?: string; }

const fieldMachine = createMachine<FieldState, FieldEvent, FieldContext>({
  id: "field",
  initial: "pristine",
  context: { value: "" },
  states: {
    pristine: { on: { change: { target: "dirty", action: (ctx, _) => ({ value: "" }) }, reset: { target: "pristine" } } },
    dirty: { on: { blur: { target: "validating" }, change: { target: "dirty" } } },
    validating: { on: { validate_ok: { target: "valid" }, validate_fail: { target: "invalid" } } },
    valid: { on: { change: { target: "dirty" }, reset: { target: "pristine" } } },
    invalid: { on: { change: { target: "dirty" }, reset: { target: "pristine" } } },
  }
});

// 40. Machine step executor with async guards
async function executeWithGuard<S extends string, E extends string, C>(
  machine: XStateInterpreter<S, E, C>,
  event: E,
  asyncGuard: (ctx: C) => Promise<boolean>
): Promise<boolean> {
  const allowed = await asyncGuard(machine.context);
  if (allowed) machine.send(event);
  return allowed;
}

// 41. Machine state coverage tracker (for testing)
class CoverageMachine<S extends string, E extends string, C> {
  visitedStates = new Set<S>();
  firedEvents = new Set<E>();
  constructor(private machine: XStateInterpreter<S, E, C>, allStates: S[]) {
    this.visitedStates.add(machine.state);
    machine.subscribe((state) => this.visitedStates.add(state));
  }
  send(event: E): void { this.firedEvents.add(event); this.machine.send(event); }
  coveragePercent(allStates: S[]): number {
    return (this.visitedStates.size / allStates.length) * 100;
  }
}

// 42. Typed machine configuration validator
function validateMachineDefinition<S extends string, E extends string, C>(
  def: XStateLikeDef<S, E, C>
): string[] {
  const errors: string[] = [];
  const states = Object.keys(def.states) as S[];
  if (!states.includes(def.initial)) errors.push(`Initial state '${def.initial}' not found`);
  for (const [state, config] of Object.entries(def.states) as [S, XStateLikeDef<S, E, C>["states"][S]][]) {
    for (const [event, transition] of Object.entries(config.on ?? {}) as [E, { target: S }][]) {
      if (!states.includes(transition.target)) {
        errors.push(`State '${state}' event '${event}' targets unknown state '${transition.target}'`);
      }
    }
  }
  return errors;
}

// 43. Machine state tag system
type Tagged<S extends string> = { state: S; tags: string[] };
type TagMap<S extends string> = Partial<Record<S, string[]>>;
function getStateTags<S extends string>(state: S, tagMap: TagMap<S>): string[] {
  return tagMap[state] ?? [];
}
function hasTag<S extends string>(state: S, tag: string, tagMap: TagMap<S>): boolean {
  return getStateTags(state, tagMap).includes(tag);
}

// 44. Machine reducer pattern (Redux-like)
type MachineReducer<S extends string, E extends string, C> = (
  state: { fsm: S; context: C },
  event: { type: E; payload?: unknown }
) => { fsm: S; context: C };

// 45. Create reducer from machine definition
function createReducer<S extends string, E extends string, C>(
  def: XStateLikeDef<S, E, C>
): MachineReducer<S, E, C> {
  const machine = new XStateInterpreter(def);
  return (state, event) => {
    (machine as { _state: S })["_state" as keyof typeof machine] = state.fsm as never;
    machine.context = state.context;
    machine.send(event.type);
    return { fsm: machine.state, context: machine.context };
  };
}

// 46. Machine with URL sync (for browser state)
function syncMachineToUrl<S extends string, E extends string, C>(
  machine: XStateInterpreter<S, E, C>,
  param: string
): void {
  machine.subscribe((state) => {
    const url = new URL(window.location.href);
    url.searchParams.set(param, state);
    window.history.replaceState({}, "", url.toString());
  });
}

// 47. Machine — finite automaton acceptance
function acceptsInput<E extends string>(
  transitions: Partial<Record<string, Partial<Record<E, string>>>>,
  initial: string,
  accepting: string[],
  input: E[]
): boolean {
  let state = initial;
  for (const event of input) {
    const next = transitions[state]?.[event];
    if (!next) return false;
    state = next;
  }
  return accepting.includes(state);
}

// 48. Machine debugger — inspect transitions with breakpoints
class DebuggableMachine<S extends string, E extends string, C> {
  private breakpoints = new Set<S>();
  private paused = false;
  constructor(private machine: XStateInterpreter<S, E, C>) {}
  addBreakpoint(state: S): void { this.breakpoints.add(state); }
  send(event: E): void {
    this.machine.send(event);
    if (this.breakpoints.has(this.machine.state)) {
      this.paused = true;
      console.debug(`[BREAKPOINT] Reached state: ${this.machine.state}`);
    }
  }
  get state(): S { return this.machine.state; }
  isPaused(): boolean { return this.paused; }
  resume(): void { this.paused = false; }
}

// 49. Machine with undo/redo support
class UndoableMachine<S extends string, E extends string, C> {
  private past: Array<{ state: S; context: C }> = [];
  private future: Array<{ state: S; context: C }> = [];
  constructor(private machine: XStateInterpreter<S, E, C>) {}
  send(event: E): void {
    this.past.push({ state: this.machine.state, context: { ...this.machine.context } });
    this.future = [];
    this.machine.send(event);
  }
  undo(): void {
    const prev = this.past.pop();
    if (!prev) return;
    this.future.push({ state: this.machine.state, context: { ...this.machine.context } });
    (this.machine as { _state: S })["_state" as keyof typeof this.machine] = prev.state as never;
    this.machine.context = prev.context;
  }
  redo(): void {
    const next = this.future.pop();
    if (!next) return;
    this.past.push({ state: this.machine.state, context: { ...this.machine.context } });
    (this.machine as { _state: S })["_state" as keyof typeof this.machine] = next.state as never;
    this.machine.context = next.context;
  }
  get state(): S { return this.machine.state; }
  canUndo(): boolean { return this.past.length > 0; }
  canRedo(): boolean { return this.future.length > 0; }
}

// 50. Full workflow machine — combines all nested patterns
const authWorkflow = createMachine<
  "unauthenticated" | "authenticating" | "authenticated" | "refreshing" | "error",
  "LOGIN" | "SUCCESS" | "FAILURE" | "LOGOUT" | "REFRESH" | "REFRESH_OK" | "REFRESH_FAIL",
  { token?: string; error?: string; retries: number }
>({
  id: "auth",
  initial: "unauthenticated",
  context: { retries: 0 },
  states: {
    unauthenticated: { on: { LOGIN: { target: "authenticating" } } },
    authenticating: {
      on: {
        SUCCESS: { target: "authenticated", action: (_, __) => ({ token: "jwt-token", retries: 0 }) },
        FAILURE: { target: "error", action: (ctx) => ({ error: "Invalid credentials", retries: ctx.retries + 1 }) },
      }
    },
    authenticated: {
      on: {
        LOGOUT: { target: "unauthenticated", action: () => ({ token: undefined }) },
        REFRESH: { target: "refreshing" },
      }
    },
    refreshing: {
      on: {
        REFRESH_OK: { target: "authenticated", action: (_, __) => ({ token: "new-token" }) },
        REFRESH_FAIL: { target: "unauthenticated", action: () => ({ token: undefined }) },
      }
    },
    error: {
      on: {
        LOGIN: { target: "authenticating", guard: ctx => ctx.retries < 3 },
      }
    },
  }
});
