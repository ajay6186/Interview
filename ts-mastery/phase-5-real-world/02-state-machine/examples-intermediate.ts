export {};

// ============================================================
// INTERMEDIATE EXAMPLES — State Machine (50 Examples)
// ============================================================

// 1. Generic state machine with typed transitions
type Transitions<S extends string, E extends string> = {
  [State in S]?: {
    [Event in E]?: S;
  };
};

// 2. Generic state machine class
class StateMachine<S extends string, E extends string> {
  private _state: S;
  private listeners: ((from: S, event: E, to: S) => void)[] = [];
  constructor(
    initial: S,
    private transitions: Transitions<S, E>
  ) { this._state = initial; }
  get state(): S { return this._state; }
  send(event: E): boolean {
    const next = this.transitions[this._state]?.[event];
    if (!next) return false;
    const from = this._state;
    this._state = next;
    this.listeners.forEach(fn => fn(from, event, this._state));
    return true;
  }
  onTransition(fn: (from: S, event: E, to: S) => void): () => void {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }
}

// 3. Order machine definition
type OrderState = "pending" | "processing" | "fulfilled" | "cancelled" | "refunded";
type OrderEvent = "process" | "fulfill" | "cancel" | "refund";

const orderMachine = new StateMachine<OrderState, OrderEvent>("pending", {
  pending:    { process: "processing", cancel: "cancelled" },
  processing: { fulfill: "fulfilled",  cancel: "cancelled" },
  fulfilled:  { refund: "refunded" },
});

// 4. State machine with context (data alongside state)
interface StateMachineContext<S extends string, C> {
  state: S;
  context: C;
}

// 5. Context-aware traffic machine
interface TrafficContext { cycleCount: number; duration: number; }
type TrafficState = "red" | "yellow" | "green";
type TrafficEvent = "timer" | "emergency";

class TrafficMachine {
  private sm: StateMachine<TrafficState, TrafficEvent>;
  context: TrafficContext = { cycleCount: 0, duration: 0 };
  constructor() {
    this.sm = new StateMachine<TrafficState, TrafficEvent>("red", {
      red:    { timer: "green", emergency: "red" },
      green:  { timer: "yellow" },
      yellow: { timer: "red" },
    });
    this.sm.onTransition((from, _, to) => {
      if (to === "red" && from === "yellow") this.context.cycleCount++;
    });
  }
  get state(): TrafficState { return this.sm.state; }
  tick(durationMs: number): void {
    this.context.duration += durationMs;
    this.sm.send("timer");
  }
}

// 6. State machine with actions (side effects on transitions)
interface TransitionAction<S extends string, E extends string, C> {
  from: S;
  event: E;
  to: S;
  action: (context: C) => C;
}

// 7. State machine with typed context mutations
class ActionMachine<S extends string, E extends string, C> {
  private _state: S;
  constructor(
    initial: S,
    public context: C,
    private transitions: Transitions<S, E>,
    private actions: TransitionAction<S, E, C>[] = []
  ) { this._state = initial; }
  get state(): S { return this._state; }
  send(event: E): void {
    const next = this.transitions[this._state]?.[event];
    if (!next) return;
    const action = this.actions.find(a => a.from === this._state && a.event === event && a.to === next);
    this._state = next;
    if (action) this.context = action.action(this.context);
  }
}

// 8. Traffic machine with action example
interface LightContext { currentLight: string; switchCount: number; }
const trafficWithActions = new ActionMachine<TrafficState, TrafficEvent, LightContext>(
  "red",
  { currentLight: "red", switchCount: 0 },
  { red: { timer: "green" }, green: { timer: "yellow" }, yellow: { timer: "red" } },
  [
    { from: "red", event: "timer", to: "green", action: ctx => ({ ...ctx, currentLight: "green", switchCount: ctx.switchCount + 1 }) },
    { from: "green", event: "timer", to: "yellow", action: ctx => ({ ...ctx, currentLight: "yellow", switchCount: ctx.switchCount + 1 }) },
    { from: "yellow", event: "timer", to: "red", action: ctx => ({ ...ctx, currentLight: "red", switchCount: ctx.switchCount + 1 }) },
  ]
);

// 9. Guard conditions on transitions
type Guard<S extends string, E extends string, C> = {
  from: S; event: E; guard: (ctx: C) => boolean;
};

// 10. Guarded machine
class GuardedMachine<S extends string, E extends string, C> {
  private _state: S;
  constructor(
    initial: S,
    public context: C,
    private transitions: Transitions<S, E>,
    private guards: Guard<S, E, C>[] = []
  ) { this._state = initial; }
  get state(): S { return this._state; }
  send(event: E): boolean {
    const next = this.transitions[this._state]?.[event];
    if (!next) return false;
    const guard = this.guards.find(g => g.from === this._state && g.event === event);
    if (guard && !guard.guard(this.context)) return false;
    this._state = next;
    return true;
  }
}

// 11. Subscription machine with credit context
type SubscriptionState = "trial" | "active" | "past_due" | "cancelled";
type SubscriptionEvent = "activate" | "charge_fail" | "charge_ok" | "cancel";
interface SubscriptionContext { credits: number; failCount: number; }

const subscriptionMachine = new GuardedMachine<SubscriptionState, SubscriptionEvent, SubscriptionContext>(
  "trial",
  { credits: 0, failCount: 0 },
  {
    trial:    { activate: "active" },
    active:   { charge_fail: "past_due", cancel: "cancelled" },
    past_due: { charge_ok: "active", cancel: "cancelled" },
  },
  [{ from: "past_due", event: "charge_ok", guard: ctx => ctx.failCount < 3 }]
);

// 12. State machine history — track all visited states
class HistoryMachine<S extends string, E extends string> extends StateMachine<S, E> {
  history: S[] = [];
  constructor(initial: S, transitions: Transitions<S, E>) {
    super(initial, transitions);
    this.history.push(initial);
    this.onTransition((_, __, to) => this.history.push(to));
  }
  canUndo(): boolean { return this.history.length > 1; }
}

// 13. Parallel state machine — multiple independent regions
class ParallelMachine<T extends Record<string, StateMachine<string, string>>> {
  constructor(public regions: T) {}
  sendAll(event: string): void {
    for (const region of Object.values(this.regions)) {
      (region as StateMachine<string, string>).send(event);
    }
  }
  get states(): { [K in keyof T]: ReturnType<T[K]["state"]["toString"]> } {
    return Object.fromEntries(
      Object.entries(this.regions).map(([k, m]) => [k, m.state])
    ) as { [K in keyof T]: ReturnType<T[K]["state"]["toString"]> };
  }
}

// 14. Declarative machine definition with DSL
interface MachineDefinition<S extends string, E extends string> {
  initial: S;
  states: {
    [State in S]: {
      on?: { [Event in E]?: S };
      type?: "final";
    };
  };
}

// 15. Create machine from definition
function createMachine<S extends string, E extends string>(
  def: MachineDefinition<S, E>
): StateMachine<S, E> {
  const transitions: Transitions<S, E> = {};
  for (const [state, config] of Object.entries(def.states) as [S, MachineDefinition<S, E>["states"][S]][]) {
    if (config.on) transitions[state] = config.on as Transitions<S, E>[S];
  }
  return new StateMachine<S, E>(def.initial, transitions);
}

// 16. Vending machine definition
type VendingState = "idle" | "has_money" | "dispensing" | "change";
type VendingEvent = "insert_coin" | "select_item" | "dispense" | "return_change";
const vendingDef: MachineDefinition<VendingState, VendingEvent> = {
  initial: "idle",
  states: {
    idle:       { on: { insert_coin: "has_money" } },
    has_money:  { on: { select_item: "dispensing", return_change: "idle" } },
    dispensing: { on: { dispense: "change" } },
    change:     { on: { return_change: "idle" } },
  },
};
const vendingMachine = createMachine(vendingDef);

// 17. State machine serialization
interface SerializedMachine<S> { state: S; timestamp: number; }
function serializeMachine<S extends string, E extends string>(
  machine: StateMachine<S, E>
): SerializedMachine<S> {
  return { state: machine.state, timestamp: Date.now() };
}

// 18. Restore machine from serialized state
function restoreMachine<S extends string, E extends string>(
  serialized: SerializedMachine<S>,
  transitions: Transitions<S, E>
): StateMachine<S, E> {
  return new StateMachine<S, E>(serialized.state, transitions);
}

// 19. Event queue for batched state updates
class EventQueue<S extends string, E extends string> {
  private queue: E[] = [];
  constructor(private machine: StateMachine<S, E>) {}
  enqueue(...events: E[]): this { this.queue.push(...events); return this; }
  flush(): void {
    for (const event of this.queue) this.machine.send(event);
    this.queue = [];
  }
}

// 20. Async state machine with async actions
class AsyncMachine<S extends string, E extends string, C> {
  private _state: S;
  constructor(
    initial: S,
    public context: C,
    private transitions: Transitions<S, E>,
    private asyncActions: Partial<Record<S, (ctx: C) => Promise<C>>> = {}
  ) { this._state = initial; }
  get state(): S { return this._state; }
  async send(event: E): Promise<void> {
    const next = this.transitions[this._state]?.[event];
    if (!next) return;
    this._state = next;
    const action = this.asyncActions[next];
    if (action) this.context = await action(this.context);
  }
}

// 21. State machine with conditional transitions (multiple guards)
type ConditionalTransition<S, C> = { target: S; guard?: (ctx: C) => boolean };
type ConditionalTransitions<S extends string, E extends string, C> = {
  [State in S]?: { [Event in E]?: ConditionalTransition<S, C>[] };
};

// 22. Priority-based conditional machine
class ConditionalMachine<S extends string, E extends string, C> {
  private _state: S;
  constructor(
    initial: S,
    public context: C,
    private transitions: ConditionalTransitions<S, E, C>
  ) { this._state = initial; }
  get state(): S { return this._state; }
  send(event: E): boolean {
    const options = this.transitions[this._state]?.[event] ?? [];
    for (const opt of options) {
      if (!opt.guard || opt.guard(this.context)) {
        this._state = opt.target;
        return true;
      }
    }
    return false;
  }
}

// 23. Form wizard with validation context
type WizardState = "step1" | "step2" | "step3" | "submitted";
type WizardEvent = "next" | "back" | "submit";
interface WizardContext { name: string; email: string; confirmed: boolean; }

const wizardMachine = new ConditionalMachine<WizardState, WizardEvent, WizardContext>(
  "step1",
  { name: "", email: "", confirmed: false },
  {
    step1: { next: [{ target: "step2", guard: ctx => ctx.name.length > 0 }] },
    step2: { next: [{ target: "step3", guard: ctx => ctx.email.includes("@") }], back: [{ target: "step1" }] },
    step3: { submit: [{ target: "submitted", guard: ctx => ctx.confirmed }], back: [{ target: "step2" }] },
  }
);

// 24. Machine with timeout — auto-transition after delay
class TimedMachine<S extends string, E extends string> {
  private _state: S;
  private timers: ReturnType<typeof setTimeout>[] = [];
  constructor(
    initial: S,
    private transitions: Transitions<S, E>,
    private timeouts: Partial<Record<S, { event: E; ms: number }>> = {}
  ) {
    this._state = initial;
    this.scheduleTimeout(initial);
  }
  private scheduleTimeout(state: S): void {
    const cfg = this.timeouts[state];
    if (!cfg) return;
    const timer = setTimeout(() => this.send(cfg.event), cfg.ms);
    this.timers.push(timer);
  }
  get state(): S { return this._state; }
  send(event: E): void {
    const next = this.transitions[this._state]?.[event];
    if (!next) return;
    this._state = next;
    this.scheduleTimeout(next);
  }
  dispose(): void { this.timers.forEach(t => clearTimeout(t)); }
}

// 25. Named machine registry
class MachineRegistry {
  private machines = new Map<string, StateMachine<string, string>>();
  register<S extends string, E extends string>(name: string, machine: StateMachine<S, E>): void {
    this.machines.set(name, machine as StateMachine<string, string>);
  }
  get<S extends string, E extends string>(name: string): StateMachine<S, E> | undefined {
    return this.machines.get(name) as StateMachine<S, E> | undefined;
  }
}

// 26. Machine snapshot for time-travel debugging
interface Snapshot<S, C> { state: S; context: C; event: string; time: number; }
class SnapshotMachine<S extends string, E extends string, C> {
  snapshots: Snapshot<S, C>[] = [];
  constructor(
    private machine: ActionMachine<S, E, C>
  ) { this.snapshots.push({ state: machine.state, context: { ...machine.context }, event: "", time: Date.now() }); }
  send(event: E): void {
    this.machine.send(event);
    this.snapshots.push({ state: this.machine.state, context: { ...this.machine.context }, event, time: Date.now() });
  }
  travelTo(index: number): void {
    const snap = this.snapshots[index];
    if (snap) {
      (this.machine as { _state: S })["_state" as keyof typeof this.machine] = snap.state as never;
      this.machine.context = { ...snap.context };
    }
  }
}

// 27. State machine metrics
interface MachineMetrics<S extends string, E extends string> {
  transitionCounts: Partial<Record<S, Partial<Record<E, number>>>>;
  totalTransitions: number;
  timeInState: Partial<Record<S, number>>;
}

// 28. Machine with metrics tracking
class MetricsMachine<S extends string, E extends string> {
  private sm: StateMachine<S, E>;
  metrics: MachineMetrics<S, E> = { transitionCounts: {}, totalTransitions: 0, timeInState: {} };
  private stateEnteredAt = Date.now();
  constructor(initial: S, transitions: Transitions<S, E>) {
    this.sm = new StateMachine<S, E>(initial, transitions);
    this.sm.onTransition((from, event, to) => {
      const now = Date.now();
      this.metrics.timeInState[from] = ((this.metrics.timeInState[from] ?? 0) + now - this.stateEnteredAt);
      this.stateEnteredAt = now;
      this.metrics.totalTransitions++;
      if (!this.metrics.transitionCounts[from]) this.metrics.transitionCounts[from] = {};
      const counts = this.metrics.transitionCounts[from]!;
      counts[event] = (counts[event] ?? 0) + 1;
    });
  }
  get state(): S { return this.sm.state; }
  send(event: E): boolean { return this.sm.send(event); }
}

// 29. State machine with subscribers (pub/sub)
class ObservableMachine<S extends string, E extends string> {
  private subscribers = new Set<(state: S) => void>();
  constructor(private machine: StateMachine<S, E>) {
    this.machine.onTransition((_, __, to) => this.subscribers.forEach(fn => fn(to)));
  }
  subscribe(fn: (state: S) => void): () => void {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }
  send(event: E): boolean { return this.machine.send(event); }
  get state(): S { return this.machine.state; }
}

// 30. Traffic machine as observable
const trafficSm = new StateMachine<TrafficState, TrafficEvent>("red", {
  red: { timer: "green" }, green: { timer: "yellow" }, yellow: { timer: "red" },
});
const observable = new ObservableMachine(trafficSm);
const unsub = observable.subscribe(s => console.log("State:", s));

// 31. Machine factory with named states
function machineFactory<S extends string, E extends string>(config: {
  id: string;
  initial: S;
  states: Record<S, Record<E, S>>;
}): StateMachine<S, E> {
  return new StateMachine<S, E>(config.initial, config.states as Transitions<S, E>);
}

// 32. Typed machine event creator
type EventCreator<E extends string> = { type: E };
function createEvent<E extends string>(type: E): EventCreator<E> { return { type }; }
const timerEvent = createEvent<TrafficEvent>("timer");

// 33. Machine with before/after hooks
class HookedMachine<S extends string, E extends string> {
  constructor(
    private machine: StateMachine<S, E>,
    private hooks: {
      before?: (state: S, event: E) => boolean;
      after?: (from: S, event: E, to: S) => void;
    } = {}
  ) {}
  send(event: E): boolean {
    if (this.hooks.before && !this.hooks.before(this.machine.state, event)) return false;
    const from = this.machine.state;
    const ok = this.machine.send(event);
    if (ok) this.hooks.after?.(from, event, this.machine.state);
    return ok;
  }
  get state(): S { return this.machine.state; }
}

// 34. Multi-step approval machine
type ApprovalState = "draft" | "submitted" | "review" | "approved" | "rejected";
type ApprovalEvent = "submit" | "start_review" | "approve" | "reject" | "revise";
const approvalMachine = new StateMachine<ApprovalState, ApprovalEvent>("draft", {
  draft:     { submit: "submitted" },
  submitted: { start_review: "review" },
  review:    { approve: "approved", reject: "rejected" },
  rejected:  { revise: "draft" },
});

// 35. Typed machine actions registry
type ActionRegistry<S extends string, C> = Partial<Record<S, (ctx: C) => void>>;
function applyEntryAction<S extends string, C>(state: S, ctx: C, registry: ActionRegistry<S, C>): void {
  registry[state]?.(ctx);
}

// 36. Machine state as discriminated union
type OrderMachineState =
  | { status: "pending"; createdAt: Date }
  | { status: "processing"; startedAt: Date }
  | { status: "shipped"; trackingId: string }
  | { status: "delivered"; deliveredAt: Date };

// 37. Order machine with rich state
class RichOrderMachine {
  state: OrderMachineState = { status: "pending", createdAt: new Date() };
  process(): void {
    if (this.state.status === "pending") this.state = { status: "processing", startedAt: new Date() };
  }
  ship(trackingId: string): void {
    if (this.state.status === "processing") this.state = { status: "shipped", trackingId };
  }
  deliver(): void {
    if (this.state.status === "shipped") this.state = { status: "delivered", deliveredAt: new Date() };
  }
}

// 38. Machine reachability analysis
function getReachableStates<S extends string, E extends string>(
  machine: { state: S },
  transitions: Transitions<S, E>
): Set<S> {
  const visited = new Set<S>([machine.state]);
  const queue = [machine.state];
  while (queue.length) {
    const s = queue.shift()!;
    for (const next of Object.values(transitions[s] ?? {}) as S[]) {
      if (!visited.has(next)) { visited.add(next); queue.push(next); }
    }
  }
  return visited;
}

// 39. Event replay machine
class ReplayMachine<S extends string, E extends string> {
  constructor(private machine: StateMachine<S, E>) {}
  replay(events: E[]): S {
    for (const event of events) this.machine.send(event);
    return this.machine.state;
  }
}

// 40. Machine with max retries guard
class RetryMachine<S extends string, E extends string> {
  private attempts: Partial<Record<E, number>> = {};
  constructor(private machine: StateMachine<S, E>, private maxRetries: Partial<Record<E, number>> = {}) {}
  send(event: E): boolean {
    const max = this.maxRetries[event] ?? Infinity;
    const count = this.attempts[event] ?? 0;
    if (count >= max) return false;
    const ok = this.machine.send(event);
    if (!ok) this.attempts[event] = count + 1;
    else this.attempts[event] = 0;
    return ok;
  }
  get state(): S { return this.machine.state; }
}

// 41. State machine persistence interface
interface MachinePersistence<S> { save(id: string, state: S): Promise<void>; load(id: string): Promise<S | null>; }
class LocalStoragePersistence<S extends string> implements MachinePersistence<S> {
  async save(id: string, state: S): Promise<void> { localStorage.setItem(id, state); }
  async load(id: string): Promise<S | null> { return (localStorage.getItem(id) as S) ?? null; }
}

// 42. Machine event bus integration
type EventBus = { emit(event: string, data: unknown): void };
function connectMachineToEventBus<S extends string, E extends string>(
  machine: StateMachine<S, E>,
  bus: EventBus,
  prefix = "machine"
): void {
  machine.onTransition((from, event, to) => bus.emit(`${prefix}.transition`, { from, event, to }));
}

// 43. Compound state — states with sub-states
type RunningSubState = "accelerating" | "cruising" | "braking";
type CarTopState = "parked" | "starting" | `running:${RunningSubState}` | "stopped";
type CarEvent = "start" | "accelerate" | "cruise" | "brake" | "stop" | "park";

const carMachine = new StateMachine<CarTopState, CarEvent>("parked", {
  parked:              { start: "starting" },
  starting:            { accelerate: "running:accelerating" },
  "running:accelerating": { cruise: "running:cruising", brake: "running:braking", stop: "stopped" },
  "running:cruising":  { accelerate: "running:accelerating", brake: "running:braking", stop: "stopped" },
  "running:braking":   { stop: "stopped" },
  stopped:             { park: "parked", start: "starting" },
});

// 44. Machine with transition validation
type ValidationFn<S, E, C> = (from: S, event: E, to: S, ctx: C) => string | null;
class ValidatedMachine<S extends string, E extends string, C> {
  constructor(private machine: GuardedMachine<S, E, C>, private validators: ValidationFn<S, E, C, C>[] = []) {}
  send(event: E): string[] {
    const errors: string[] = [];
    const from = this.machine.state;
    const transitioned = this.machine.send(event);
    if (transitioned) {
      for (const v of this.validators) {
        const err = v(from, event, this.machine.state, this.machine.context);
        if (err) errors.push(err);
      }
    }
    return errors;
  }
  get state(): S { return this.machine.state; }
}

// 45. Machine with event logging to console
function withLogging<S extends string, E extends string>(machine: StateMachine<S, E>): StateMachine<S, E> {
  machine.onTransition((from, event, to) => console.log(`[SM] ${from} --[${event}]--> ${to}`));
  return machine;
}

// 46. Finite state interpreter — run until final state
async function interpret<S extends string, E extends string>(
  machine: StateMachine<S, E>,
  eventSource: AsyncIterable<E>,
  isFinal: (s: S) => boolean
): Promise<S> {
  for await (const event of eventSource) {
    machine.send(event);
    if (isFinal(machine.state)) break;
  }
  return machine.state;
}

// 47. Machine configuration validator
function validateMachineConfig<S extends string, E extends string>(
  config: Transitions<S, E>,
  knownStates: S[]
): string[] {
  const errors: string[] = [];
  for (const [state, events] of Object.entries(config) as [S, Record<E, S>][]) {
    if (!knownStates.includes(state)) errors.push(`Unknown state: ${state}`);
    for (const target of Object.values(events) as S[]) {
      if (!knownStates.includes(target)) errors.push(`Unknown target state: ${target} from ${state}`);
    }
  }
  return errors;
}

// 48. Machine to mermaid diagram
function toMermaid<S extends string, E extends string>(transitions: Transitions<S, E>): string {
  const lines = ["stateDiagram-v2"];
  for (const [state, events] of Object.entries(transitions) as [S, Record<E, S>][]) {
    for (const [event, target] of Object.entries(events ?? {}) as [E, S][]) {
      lines.push(`  ${state} --> ${target} : ${event}`);
    }
  }
  return lines.join("\n");
}

// 49. Machine with optimistic updates
class OptimisticMachine<S extends string, E extends string> {
  private rollbackState?: S;
  constructor(private machine: StateMachine<S, E>) {}
  sendOptimistic(event: E): void {
    this.rollbackState = this.machine.state;
    this.machine.send(event);
  }
  commit(): void { this.rollbackState = undefined; }
  rollback(): void {
    if (this.rollbackState) {
      (this.machine as unknown as { _state: S })["_state" as keyof typeof this.machine] = this.rollbackState as never;
      this.rollbackState = undefined;
    }
  }
  get state(): S { return this.machine.state; }
}

// 50. State machine test helper
function testMachine<S extends string, E extends string>(
  machine: StateMachine<S, E>,
  steps: { send: E; expect: S }[]
): boolean {
  for (const { send, expect } of steps) {
    machine.send(send);
    if (machine.state !== expect) {
      console.error(`Expected ${expect}, got ${machine.state} after ${send}`);
      return false;
    }
  }
  return true;
}
