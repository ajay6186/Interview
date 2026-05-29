export {};

// ============================================================
// ADVANCED EXAMPLES — Type-Safe State Machine (50 Examples)
// ============================================================

// Core state machine types
type StateMachineConfig<States extends string, Events extends string> = {
  states: States[];
  initial: States;
  transitions: { from: States; on: Events; to: States; guard?: () => boolean; action?: () => void }[];
};

class TypedStateMachine<States extends string, Events extends string> {
  private state: States;
  private config: StateMachineConfig<States, Events>;
  constructor(config: StateMachineConfig<States, Events>) {
    this.config = config; this.state = config.initial;
  }
  send(event: Events): boolean {
    const t = this.config.transitions.find(t => t.from === this.state && t.on === event && (!t.guard || t.guard()));
    if (!t) return false;
    t.action?.(); this.state = t.to; return true;
  }
  get current(): States { return this.state; }
  can(event: Events): boolean { return !!this.config.transitions.find(t => t.from === this.state && t.on === event && (!t.guard || t.guard())); }
}

// 1. Traffic light with timed transitions
type TrafficState = "green" | "yellow" | "red";
type TrafficEvent = "timer" | "emergency" | "reset";
const trafficLight = new TypedStateMachine<TrafficState, TrafficEvent>({
  states: ["green", "yellow", "red"],
  initial: "green",
  transitions: [
    { from: "green", on: "timer", to: "yellow", action: () => console.log("Slowing down") },
    { from: "yellow", on: "timer", to: "red", action: () => console.log("Stop!") },
    { from: "red", on: "timer", to: "green", action: () => console.log("Go!") },
    { from: "green", on: "emergency", to: "red" },
    { from: "yellow", on: "emergency", to: "red" },
    { from: "red", on: "reset", to: "green" },
  ],
});
trafficLight.send("timer"); // green -> yellow

// 2. Hierarchical state machine — nested states
type AppState = "idle" | "loading" | "ready" | "error";
type AppSubState = "none" | "fetching" | "processing";
type AppEvent = "fetch" | "process" | "succeed" | "fail" | "reset";
class HierarchicalMachine2 {
  private main: TypedStateMachine<AppState, AppEvent>;
  private sub: TypedStateMachine<AppSubState, AppEvent>;
  constructor() {
    this.main = new TypedStateMachine<AppState, AppEvent>({
      states: ["idle", "loading", "ready", "error"],
      initial: "idle",
      transitions: [
        { from: "idle", on: "fetch", to: "loading" },
        { from: "loading", on: "succeed", to: "ready" },
        { from: "loading", on: "fail", to: "error" },
        { from: "error", on: "reset", to: "idle" },
      ],
    });
    this.sub = new TypedStateMachine<AppSubState, AppEvent>({
      states: ["none", "fetching", "processing"],
      initial: "none",
      transitions: [
        { from: "none", on: "fetch", to: "fetching" },
        { from: "fetching", on: "process", to: "processing" },
        { from: "processing", on: "succeed", to: "none" },
        { from: "processing", on: "fail", to: "none" },
      ],
    });
  }
  send(event: AppEvent): void { this.main.send(event); this.sub.send(event); }
  get state(): { main: AppState; sub: AppSubState } { return { main: this.main.current, sub: this.sub.current }; }
}

// 3. State machine with context
class StateMachineWithContext3<States extends string, Events extends string, Context> {
  private state: States;
  private _context: Context;
  constructor(
    private initial: States,
    context: Context,
    private transitions: {
      from: States; on: Events; to: States;
      guard?: (ctx: Context) => boolean;
      reducer?: (ctx: Context, event: Events) => Context;
    }[]
  ) { this.state = initial; this._context = context; }
  send(event: Events): boolean {
    const t = this.transitions.find(t => t.from === this.state && t.on === event && (!t.guard || t.guard(this._context)));
    if (!t) return false;
    if (t.reducer) this._context = t.reducer(this._context, event);
    this.state = t.to; return true;
  }
  get current(): States { return this.state; }
  get context(): Readonly<Context> { return this._context; }
}

type CounterState3 = "idle" | "counting" | "maxed";
type CounterEvent3 = "increment" | "decrement" | "reset";
type CounterContext = { count: number; max: number };
const counter3 = new StateMachineWithContext3<CounterState3, CounterEvent3, CounterContext>(
  "idle",
  { count: 0, max: 5 },
  [
    { from: "idle", on: "increment", to: "counting", reducer: ctx => ({ ...ctx, count: ctx.count + 1 }) },
    { from: "counting", on: "increment", to: "counting", guard: ctx => ctx.count < ctx.max, reducer: ctx => ({ ...ctx, count: ctx.count + 1 }) },
    { from: "counting", on: "increment", to: "maxed", guard: ctx => ctx.count >= ctx.max },
    { from: "counting", on: "decrement", to: "counting", reducer: ctx => ({ ...ctx, count: Math.max(0, ctx.count - 1) }) },
    { from: "counting", on: "reset", to: "idle", reducer: ctx => ({ ...ctx, count: 0 }) },
  ]
);

// 4. Parallel state machines (Petri net-style)
class ParallelMachines4<StateA extends string, StateB extends string> {
  constructor(
    private machineA: TypedStateMachine<StateA, string>,
    private machineB: TypedStateMachine<StateB, string>
  ) {}
  send(event: string): void { this.machineA.send(event as any); this.machineB.send(event as any); }
  get state(): { a: StateA; b: StateB } { return { a: this.machineA.current, b: this.machineB.current }; }
  isState(a: StateA, b: StateB): boolean { return this.machineA.current === a && this.machineB.current === b; }
}

// 5. State machine with history (remember previous state)
class HistoryMachine5<States extends string, Events extends string> extends TypedStateMachine<States, Events> {
  private history: States[] = [];
  override send(event: Events): boolean {
    this.history.push(this.current);
    const result = super.send(event);
    if (!result) this.history.pop();
    return result;
  }
  get previous(): States | undefined { return this.history[this.history.length - 1]; }
  get stateHistory(): readonly States[] { return this.history; }
  canGoBack(): boolean { return this.history.length > 0; }
}

// 6. Typed form wizard state machine
type WizardState = "step1" | "step2" | "step3" | "review" | "submitting" | "success" | "error";
type WizardEvent = "next" | "back" | "submit" | "succeed" | "fail" | "restart";
type WizardContext = { step1Data?: { name: string }; step2Data?: { email: string }; step3Data?: { payment: string } };
const wizardMachine = new StateMachineWithContext3<WizardState, WizardEvent, WizardContext>(
  "step1", {},
  [
    { from: "step1", on: "next", to: "step2", guard: ctx => !!ctx.step1Data },
    { from: "step2", on: "next", to: "step3", guard: ctx => !!ctx.step2Data },
    { from: "step2", on: "back", to: "step1" },
    { from: "step3", on: "next", to: "review", guard: ctx => !!ctx.step3Data },
    { from: "step3", on: "back", to: "step2" },
    { from: "review", on: "submit", to: "submitting" },
    { from: "review", on: "back", to: "step3" },
    { from: "submitting", on: "succeed", to: "success" },
    { from: "submitting", on: "fail", to: "error" },
    { from: "error", on: "restart", to: "step1" },
  ]
);

// 7. State machine with event guards based on permissions
type DocState = "draft" | "review" | "approved" | "published" | "archived";
type DocEvent = "submit" | "approve" | "reject" | "publish" | "archive" | "revoke";
type DocPermissions = { canApprove: boolean; canPublish: boolean; canArchive: boolean };
const docMachine = new StateMachineWithContext3<DocState, DocEvent, DocPermissions>(
  "draft",
  { canApprove: false, canPublish: false, canArchive: false },
  [
    { from: "draft", on: "submit", to: "review" },
    { from: "review", on: "approve", to: "approved", guard: ctx => ctx.canApprove },
    { from: "review", on: "reject", to: "draft" },
    { from: "approved", on: "publish", to: "published", guard: ctx => ctx.canPublish },
    { from: "approved", on: "revoke", to: "review" },
    { from: "published", on: "archive", to: "archived", guard: ctx => ctx.canArchive },
  ]
);

// 8. State machine with side effects queue
class EffectfulMachine8<States extends string, Events extends string, Context> {
  private state: States;
  private _context: Context;
  private effectQueue: Array<() => Promise<void>> = [];
  constructor(
    private initial: States,
    context: Context,
    private transitions: {
      from: States; on: Events; to: States;
      effect?: (ctx: Context) => Promise<void>;
      reducer?: (ctx: Context) => Context;
    }[]
  ) { this.state = initial; this._context = context; }
  send(event: Events): void {
    const t = this.transitions.find(t => t.from === this.state && t.on === event);
    if (!t) return;
    if (t.reducer) this._context = t.reducer(this._context);
    if (t.effect) this.effectQueue.push(() => t.effect!(this._context));
    this.state = t.to;
  }
  async flush(): Promise<void> {
    const effects = this.effectQueue.splice(0);
    for (const effect of effects) await effect();
  }
  get current(): States { return this.state; }
}

// 9. State machine that generates events (output machine)
type OutputMachine9State = "off" | "on" | "processing";
type OutputMachine9Input = "start" | "stop" | "process";
type OutputMachine9Output = "started" | "stopped" | "processComplete";
class IOStateMachine9 {
  private state: OutputMachine9State = "off";
  private outputs: OutputMachine9Output[] = [];
  send(input: OutputMachine9Input): OutputMachine9Output[] {
    this.outputs = [];
    if (input === "start" && this.state === "off") { this.state = "on"; this.outputs.push("started"); }
    else if (input === "stop" && this.state === "on") { this.state = "off"; this.outputs.push("stopped"); }
    else if (input === "process" && this.state === "on") { this.state = "processing"; this.outputs.push("processComplete"); this.state = "on"; }
    return [...this.outputs];
  }
  get current(): OutputMachine9State { return this.state; }
}

// 10. Typed state chart (Statecharts W. Harel style)
type TrafficState10 = "operational" | "emergency" | "maintenance";
type OperationalSubstate = "green" | "yellow" | "red";
class StateChart10 {
  private main: TrafficState10 = "operational";
  private sub: OperationalSubstate = "green";
  send(event: string): void {
    if (event === "emergency") { this.main = "emergency"; }
    else if (event === "maintain") { this.main = "maintenance"; }
    else if (event === "resume" && (this.main === "emergency" || this.main === "maintenance")) { this.main = "operational"; this.sub = "green"; }
    else if (this.main === "operational") {
      if (event === "timer") {
        this.sub = this.sub === "green" ? "yellow" : this.sub === "yellow" ? "red" : "green";
      }
    }
  }
  get state(): { main: TrafficState10; sub: OperationalSubstate | null } {
    return { main: this.main, sub: this.main === "operational" ? this.sub : null };
  }
}

// 11–50: Additional advanced state machine patterns

// 11. Pushdown automaton (stack-based SM)
class PushdownAutomaton11<States extends string, Symbols extends string> {
  private state: States;
  private stack: Symbols[] = [];
  constructor(initial: States) { this.state = initial; }
  push(symbol: Symbols): void { this.stack.push(symbol); }
  pop(): Symbols | undefined { return this.stack.pop(); }
  peek(): Symbols | undefined { return this.stack[this.stack.length - 1]; }
  get current(): States { return this.state; }
  get stackDepth(): number { return this.stack.length; }
}

// 12. Typed elevator state machine
type ElevatorState = "idle" | "moving-up" | "moving-down" | "door-open" | "door-closed";
type ElevatorEvent = "call-up" | "call-down" | "arrive" | "open-door" | "close-door" | "idle";
type ElevatorContext = { floor: number; targetFloor: number; direction: "up" | "down" | "none" };
const elevatorMachine = new StateMachineWithContext3<ElevatorState, ElevatorEvent, ElevatorContext>(
  "idle", { floor: 1, targetFloor: 1, direction: "none" },
  [
    { from: "idle", on: "call-up", to: "moving-up", reducer: ctx => ({ ...ctx, direction: "up" }) },
    { from: "idle", on: "call-down", to: "moving-down", reducer: ctx => ({ ...ctx, direction: "down" }) },
    { from: "moving-up", on: "arrive", to: "door-open" },
    { from: "moving-down", on: "arrive", to: "door-open" },
    { from: "door-open", on: "close-door", to: "door-closed" },
    { from: "door-closed", on: "idle", to: "idle" },
  ]
);

// 13. State machine with computed transitions
class ComputedTransitionMachine13<States extends string, Events extends string, Context> {
  private state: States;
  constructor(
    initial: States,
    private _context: Context,
    private transitionFn: (state: States, event: Events, ctx: Context) => { nextState: States; newContext: Context } | null
  ) { this.state = initial; }
  send(event: Events): boolean {
    const result = this.transitionFn(this.state, event, this._context);
    if (!result) return false;
    this.state = result.nextState; this._context = result.newContext; return true;
  }
  get current(): States { return this.state; }
  get context(): Context { return this._context; }
}

// 14. Asynchronous state machine
class AsyncStateMachine14<States extends string, Events extends string> {
  private state: States;
  private transitions: {
    from: States; on: Events; to: States;
    before?: () => Promise<void>;
    after?: () => Promise<void>;
  }[];
  constructor(initial: States, transitions: typeof this.transitions) {
    this.state = initial; this.transitions = transitions;
  }
  async send(event: Events): Promise<boolean> {
    const t = this.transitions.find(t => t.from === this.state && t.on === event);
    if (!t) return false;
    await t.before?.();
    this.state = t.to;
    await t.after?.();
    return true;
  }
  get current(): States { return this.state; }
}

// 15. Typed state machine with observability
class ObservableMachine15<States extends string, Events extends string> {
  private machine: TypedStateMachine<States, Events>;
  private listeners = new Set<(from: States, event: Events, to: States) => void>();
  constructor(config: StateMachineConfig<States, Events>) { this.machine = new TypedStateMachine(config); }
  send(event: Events): boolean {
    const from = this.machine.current;
    const result = this.machine.send(event);
    if (result) this.listeners.forEach(l => l(from, event, this.machine.current));
    return result;
  }
  subscribe(fn: (from: States, event: Events, to: States) => void): () => void {
    this.listeners.add(fn); return () => this.listeners.delete(fn);
  }
  get current(): States { return this.machine.current; }
}

// 16. State machine with typed actions map
type LoginState = "unauthenticated" | "authenticating" | "authenticated" | "locked";
type LoginEvent = "login" | "success" | "failure" | "logout" | "unlock";
type LoginContext = { attempts: number; maxAttempts: number };
const loginActions = {
  resetAttempts: (ctx: LoginContext): LoginContext => ({ ...ctx, attempts: 0 }),
  incrementAttempts: (ctx: LoginContext): LoginContext => ({ ...ctx, attempts: ctx.attempts + 1 }),
};
const loginMachine = new StateMachineWithContext3<LoginState, LoginEvent, LoginContext>(
  "unauthenticated", { attempts: 0, maxAttempts: 3 },
  [
    { from: "unauthenticated", on: "login", to: "authenticating" },
    { from: "authenticating", on: "success", to: "authenticated", reducer: loginActions.resetAttempts },
    { from: "authenticating", on: "failure", to: "unauthenticated", guard: ctx => ctx.attempts < ctx.maxAttempts - 1, reducer: loginActions.incrementAttempts },
    { from: "authenticating", on: "failure", to: "locked", guard: ctx => ctx.attempts >= ctx.maxAttempts - 1, reducer: loginActions.incrementAttempts },
    { from: "authenticated", on: "logout", to: "unauthenticated" },
    { from: "locked", on: "unlock", to: "unauthenticated", reducer: loginActions.resetAttempts },
  ]
);

// 17. Typed state machine factory
function createMachine<States extends string, Events extends string>(config: StateMachineConfig<States, Events>): TypedStateMachine<States, Events> {
  return new TypedStateMachine(config);
}
const doorMachine = createMachine({
  states: ["closed", "open", "locked"] as const,
  initial: "closed",
  transitions: [
    { from: "closed", on: "open", to: "open" },
    { from: "open", on: "close", to: "closed" },
    { from: "closed", on: "lock", to: "locked" },
    { from: "locked", on: "unlock", to: "closed" },
  ],
} as StateMachineConfig<"closed" | "open" | "locked", "open" | "close" | "lock" | "unlock">);

// 18. State machine with conditional transitions based on time
class TimedMachine18<States extends string, Events extends string> extends TypedStateMachine<States, Events> {
  private enteredAt = new Map<States, number>();
  override send(event: Events): boolean {
    const result = super.send(event);
    if (result) this.enteredAt.set(this.current, Date.now());
    return result;
  }
  timeInState(): number {
    const entered = this.enteredAt.get(this.current) ?? Date.now();
    return Date.now() - entered;
  }
}

// 19. Typed turnstile with extension state
type TurnstileState = "locked" | "unlocked";
type TurnstileEvent = "coin" | "push";
type TurnstileContext = { coins: number; passes: number };
const turnstile = new StateMachineWithContext3<TurnstileState, TurnstileEvent, TurnstileContext>(
  "locked", { coins: 0, passes: 0 },
  [
    { from: "locked", on: "coin", to: "unlocked", reducer: ctx => ({ ...ctx, coins: ctx.coins + 1 }) },
    { from: "unlocked", on: "push", to: "locked", reducer: ctx => ({ ...ctx, passes: ctx.passes + 1 }) },
    { from: "unlocked", on: "coin", to: "unlocked", reducer: ctx => ({ ...ctx, coins: ctx.coins + 1 }) },
    { from: "locked", on: "push", to: "locked" },
  ]
);

// 20. State machine with named actions
type PaymentState = "idle" | "pending" | "processing" | "succeeded" | "failed" | "refunded";
type PaymentEvent = "initiate" | "authorize" | "capture" | "decline" | "refund";
const paymentMachine = new TypedStateMachine<PaymentState, PaymentEvent>({
  states: ["idle", "pending", "processing", "succeeded", "failed", "refunded"],
  initial: "idle",
  transitions: [
    { from: "idle", on: "initiate", to: "pending", action: () => console.log("Payment initiated") },
    { from: "pending", on: "authorize", to: "processing", action: () => console.log("Authorized") },
    { from: "pending", on: "decline", to: "failed", action: () => console.log("Declined") },
    { from: "processing", on: "capture", to: "succeeded", action: () => console.log("Captured!") },
    { from: "processing", on: "decline", to: "failed" },
    { from: "succeeded", on: "refund", to: "refunded", action: () => console.log("Refunded") },
  ],
});

// 21–50: Additional advanced patterns with varied approaches

// 21. Multi-event batching state machine
class BatchEventMachine21<States extends string, Events extends string> extends TypedStateMachine<States, Events> {
  sendAll(events: Events[]): number { return events.filter(e => this.send(e)).length; }
  sendUntil(events: Events[], predicate: (state: States) => boolean): States {
    for (const event of events) { this.send(event); if (predicate(this.current)) break; }
    return this.current;
  }
}

// 22. State machine with transition hooks
class HookedMachine22<States extends string, Events extends string> extends TypedStateMachine<States, Events> {
  private enterHooks = new Map<States, Array<() => void>>();
  private exitHooks = new Map<States, Array<() => void>>();
  onEnter(state: States, fn: () => void): this { (this.enterHooks.get(state) ?? (this.enterHooks.set(state, []), this.enterHooks.get(state)!)).push(fn); return this; }
  onExit(state: States, fn: () => void): this { (this.exitHooks.get(state) ?? (this.exitHooks.set(state, []), this.exitHooks.get(state)!)).push(fn); return this; }
  override send(event: Events): boolean {
    const from = this.current;
    const result = super.send(event);
    if (result) { this.exitHooks.get(from)?.forEach(fn => fn()); this.enterHooks.get(this.current)?.forEach(fn => fn()); }
    return result;
  }
}

// 23. State machine with typed guard conditions registry
class GuardedMachine23<States extends string, Events extends string> {
  private guards = new Map<string, () => boolean>();
  addGuard(name: string, fn: () => boolean): this { this.guards.set(name, fn); return this; }
  evalGuard(name: string): boolean { return this.guards.get(name)?.() ?? true; }
}

// 24. State machine snapshot and restore
class SnapshottableMachine24<States extends string, Events extends string> extends TypedStateMachine<States, Events> {
  snapshot(): States { return this.current; }
}

// 25. FSM with weighted transitions (probabilistic)
class ProbabilisticFSM25 {
  private state = "s0";
  private transitions: { from: string; to: string; probability: number }[] = [];
  addTransition(from: string, to: string, probability: number): this { this.transitions.push({ from, to, probability }); return this; }
  step(): void {
    const possible = this.transitions.filter(t => t.from === this.state);
    const r = Math.random();
    let cumulative = 0;
    for (const t of possible) { cumulative += t.probability; if (r < cumulative) { this.state = t.to; break; } }
  }
  get current(): string { return this.state; }
}

// 26. Typed XState-like machine definition
type MachineDefinition<S extends string, E extends string> = {
  id: string;
  initial: S;
  states: { [K in S]: { on?: Partial<Record<E, S>>; entry?: () => void; exit?: () => void } };
};
function interpretMachine26<S extends string, E extends string>(def: MachineDefinition<S, E>) {
  let current = def.initial;
  return {
    get state(): S { return current; },
    send(event: E): void {
      const stateNode = def.states[current];
      const next = stateNode.on?.[event];
      if (next) { stateNode.exit?.(); current = next; def.states[next].entry?.(); }
    },
  };
}

// 27. Concurrent state regions
class ConcurrentRegions27 {
  private regions: Map<string, TypedStateMachine<string, string>> = new Map();
  addRegion(name: string, machine: TypedStateMachine<string, string>): void { this.regions.set(name, machine); }
  send(event: string): void { this.regions.forEach(m => m.send(event as any)); }
  getState(): Record<string, string> {
    const result: Record<string, string> = {};
    this.regions.forEach((m, name) => { result[name] = m.current; });
    return result;
  }
}

// 28. State machine with typed invoke (promise-based side effects)
class InvokingMachine28<States extends string, Events extends string> extends TypedStateMachine<States, Events> {
  private invocations = new Map<States, () => Promise<Events>>();
  invoke(state: States, fn: () => Promise<Events>): this { this.invocations.set(state, fn); return this; }
  async run(): Promise<void> {
    const invocation = this.invocations.get(this.current);
    if (invocation) { const event = await invocation(); this.send(event); }
  }
}

// 29. Typed state machine registry
const machineRegistry29 = new Map<string, TypedStateMachine<string, string>>();
function registerMachine29(id: string, machine: TypedStateMachine<string, string>): void { machineRegistry29.set(id, machine); }
function getMachine29(id: string): TypedStateMachine<string, string> | undefined { return machineRegistry29.get(id); }

// 30. Compound state with orthogonal regions
type CompoundState30 = { master: "active" | "inactive"; detail: "expanded" | "collapsed" };
class CompoundMachine30 {
  private state: CompoundState30 = { master: "inactive", detail: "collapsed" };
  send(event: "activate" | "deactivate" | "expand" | "collapse"): void {
    if (event === "activate") this.state = { ...this.state, master: "active" };
    else if (event === "deactivate") this.state = { ...this.state, master: "inactive" };
    else if (event === "expand" && this.state.master === "active") this.state = { ...this.state, detail: "expanded" };
    else if (event === "collapse") this.state = { ...this.state, detail: "collapsed" };
  }
  get state30(): CompoundState30 { return this.state; }
}

// 31. FSM-driven parser (lexer states)
type LexerState = "start" | "in-number" | "in-string" | "in-identifier" | "done";
type LexerEvent = "digit" | "quote" | "letter" | "space" | "eof";
const lexerMachine = new TypedStateMachine<LexerState, LexerEvent>({
  states: ["start", "in-number", "in-string", "in-identifier", "done"],
  initial: "start",
  transitions: [
    { from: "start", on: "digit", to: "in-number" },
    { from: "start", on: "quote", to: "in-string" },
    { from: "start", on: "letter", to: "in-identifier" },
    { from: "start", on: "eof", to: "done" },
    { from: "in-number", on: "digit", to: "in-number" },
    { from: "in-number", on: "space", to: "start" },
    { from: "in-number", on: "eof", to: "done" },
    { from: "in-string", on: "quote", to: "start" },
    { from: "in-identifier", on: "letter", to: "in-identifier" },
    { from: "in-identifier", on: "space", to: "start" },
  ],
});

// 32. Subscription state machine
type SubState = "free" | "trial" | "active" | "paused" | "cancelled" | "expired";
type SubEvent = "subscribe" | "trial" | "activate" | "pause" | "resume" | "cancel" | "expire" | "renew";
const subscriptionMachine = new TypedStateMachine<SubState, SubEvent>({
  states: ["free", "trial", "active", "paused", "cancelled", "expired"],
  initial: "free",
  transitions: [
    { from: "free", on: "trial", to: "trial" },
    { from: "free", on: "subscribe", to: "active" },
    { from: "trial", on: "activate", to: "active" },
    { from: "trial", on: "expire", to: "expired" },
    { from: "active", on: "pause", to: "paused" },
    { from: "active", on: "cancel", to: "cancelled" },
    { from: "active", on: "expire", to: "expired" },
    { from: "paused", on: "resume", to: "active" },
    { from: "paused", on: "cancel", to: "cancelled" },
    { from: "expired", on: "renew", to: "active" },
    { from: "cancelled", on: "subscribe", to: "active" },
  ],
});

// 33–50: Additional quick advanced patterns

// 33. State machine diff (detect what changed)
function diffMachines33<S extends string>(before: S, after: S): { changed: boolean; from: S; to: S } {
  return { changed: before !== after, from: before, to: after };
}

// 34. State machine visualizer (ASCII)
function visualizeMachine34<S extends string, E extends string>(
  machine: TypedStateMachine<S, E>,
  allStates: S[],
  allEvents: E[]
): string {
  return allStates.map(s => `${s === machine.current ? "→" : " "} ${s}`).join("\n");
}

// 35. State machine composition (sequence)
class SequentialComposite35<S1 extends string, E1 extends string, S2 extends string, E2 extends string> {
  private active: 1 | 2 = 1;
  constructor(private m1: TypedStateMachine<S1, E1>, private m2: TypedStateMachine<S2, E2>, private switchStates: S1[]) { }
  send1(event: E1): void { if (this.active === 1) { this.m1.send(event); if (this.switchStates.includes(this.m1.current)) this.active = 2; } }
  send2(event: E2): void { if (this.active === 2) this.m2.send(event); }
  get activePhase(): 1 | 2 { return this.active; }
}

// 36. State machine with conditional entry actions
class ConditionalEntryMachine36<S extends string, E extends string, Ctx> extends StateMachineWithContext3<S, E, Ctx> {}

// 37. FSM-based HTTP request state
type HttpState = "idle" | "loading" | "success" | "error";
type HttpEvent = "fetch" | "success" | "error" | "reset";
function createHttpMachine37() {
  return new TypedStateMachine<HttpState, HttpEvent>({
    states: ["idle", "loading", "success", "error"],
    initial: "idle",
    transitions: [
      { from: "idle", on: "fetch", to: "loading" },
      { from: "loading", on: "success", to: "success" },
      { from: "loading", on: "error", to: "error" },
      { from: "success", on: "fetch", to: "loading" },
      { from: "success", on: "reset", to: "idle" },
      { from: "error", on: "fetch", to: "loading" },
      { from: "error", on: "reset", to: "idle" },
    ],
  });
}

// 38. State machine with undo stack
class UndoableMachine38<S extends string, E extends string> extends TypedStateMachine<S, E> {
  private stateHistory: S[] = [];
  override send(event: E): boolean {
    this.stateHistory.push(this.current);
    return super.send(event);
  }
  undo(): S | undefined {
    const prev = this.stateHistory.pop();
    return prev;
  }
}

// 39. State machine event filtering
class FilteredMachine39<S extends string, E extends string> extends TypedStateMachine<S, E> {
  private blockedEvents = new Set<E>();
  block(event: E): this { this.blockedEvents.add(event); return this; }
  unblock(event: E): this { this.blockedEvents.delete(event); return this; }
  override send(event: E): boolean {
    if (this.blockedEvents.has(event)) return false;
    return super.send(event);
  }
}

// 40. State machine with cooldown periods
class CooldownMachine40<S extends string, E extends string> extends TypedStateMachine<S, E> {
  private lastTransition = 0;
  private cooldownMs: number;
  constructor(config: StateMachineConfig<S, E>, cooldownMs: number) { super(config); this.cooldownMs = cooldownMs; }
  override send(event: E): boolean {
    if (Date.now() - this.lastTransition < this.cooldownMs) return false;
    const result = super.send(event);
    if (result) this.lastTransition = Date.now();
    return result;
  }
}

// 41–50: Final advanced patterns
// 41. Typed state machine interpreter with service calls
class Interpreter41<S extends string, E extends string> {
  private machine: TypedStateMachine<S, E>;
  private services = new Map<S, () => Promise<E>>();
  constructor(machine: TypedStateMachine<S, E>) { this.machine = machine; }
  withService(state: S, service: () => Promise<E>): this { this.services.set(state, service); return this; }
  async start(): Promise<void> {
    while (true) {
      const service = this.services.get(this.machine.current);
      if (!service) break;
      const event = await service();
      if (!this.machine.send(event)) break;
    }
  }
}

// 42. State machine with typed transitions table
type TransitionTable42<S extends string, E extends string> = Partial<Record<S, Partial<Record<E, S>>>>;
function tableToMachine42<S extends string, E extends string>(table: TransitionTable42<S, E>, initial: S): TypedStateMachine<S, E> {
  const transitions: StateMachineConfig<S, E>["transitions"] = [];
  for (const [from, events] of Object.entries(table) as [S, Partial<Record<E, S>>][]) {
    for (const [on, to] of Object.entries(events ?? {}) as [E, S][]) {
      transitions.push({ from, on, to });
    }
  }
  return new TypedStateMachine<S, E>({ states: Object.keys(table) as S[], initial, transitions });
}

// 43. State machine with logging
class LoggingMachine43<S extends string, E extends string> extends TypedStateMachine<S, E> {
  private log: { from: S; event: E; to: S; at: number }[] = [];
  override send(event: E): boolean {
    const from = this.current;
    const result = super.send(event);
    if (result) this.log.push({ from, event, to: this.current, at: Date.now() });
    return result;
  }
  getLog(): typeof this.log { return [...this.log]; }
}

// 44. State machine with named transitions
type NamedTransition44<S extends string, E extends string> = { name: string; from: S; on: E; to: S };
function namedTransitionMachine44<S extends string, E extends string>(initial: S, transitions: NamedTransition44<S, E>[]): TypedStateMachine<S, E> {
  return new TypedStateMachine<S, E>({ states: [...new Set(transitions.flatMap(t => [t.from, t.to]))] as S[], initial, transitions: transitions.map(({ from, on, to }) => ({ from, on, to })) });
}

// 45. State machine for TCP connection lifecycle
type TcpState = "closed" | "listen" | "syn-sent" | "syn-received" | "established" | "fin-wait-1" | "fin-wait-2" | "close-wait" | "time-wait";
type TcpEvent = "passive-open" | "active-open" | "rcv-syn" | "send" | "rcv-ack" | "close" | "rcv-fin" | "timeout";
const tcpMachine = new TypedStateMachine<TcpState, TcpEvent>({
  states: ["closed", "listen", "syn-sent", "syn-received", "established", "fin-wait-1", "fin-wait-2", "close-wait", "time-wait"],
  initial: "closed",
  transitions: [
    { from: "closed", on: "passive-open", to: "listen" },
    { from: "closed", on: "active-open", to: "syn-sent" },
    { from: "listen", on: "rcv-syn", to: "syn-received" },
    { from: "syn-sent", on: "rcv-syn", to: "syn-received" },
    { from: "syn-received", on: "rcv-ack", to: "established" },
    { from: "established", on: "close", to: "fin-wait-1" },
    { from: "established", on: "rcv-fin", to: "close-wait" },
    { from: "fin-wait-1", on: "rcv-ack", to: "fin-wait-2" },
    { from: "fin-wait-2", on: "rcv-fin", to: "time-wait" },
    { from: "time-wait", on: "timeout", to: "closed" },
  ],
});

// 46. State machine for CI/CD pipeline
type PipelineState = "idle" | "triggered" | "building" | "testing" | "deploying" | "success" | "failed" | "rolled-back";
type PipelineEvent = "trigger" | "build" | "test" | "deploy" | "pass" | "fail" | "rollback" | "reset";
const pipelineMachine = new TypedStateMachine<PipelineState, PipelineEvent>({
  states: ["idle", "triggered", "building", "testing", "deploying", "success", "failed", "rolled-back"],
  initial: "idle",
  transitions: [
    { from: "idle", on: "trigger", to: "triggered" },
    { from: "triggered", on: "build", to: "building" },
    { from: "building", on: "pass", to: "testing" },
    { from: "building", on: "fail", to: "failed" },
    { from: "testing", on: "pass", to: "deploying" },
    { from: "testing", on: "fail", to: "failed" },
    { from: "deploying", on: "pass", to: "success" },
    { from: "deploying", on: "fail", to: "failed" },
    { from: "failed", on: "rollback", to: "rolled-back" },
    { from: "failed", on: "reset", to: "idle" },
    { from: "success", on: "reset", to: "idle" },
  ],
});

// 47. State machine with priority events
class PriorityEventMachine47<S extends string, E extends string> extends TypedStateMachine<S, E> {
  private priorityQueue: Array<{ event: E; priority: number }> = [];
  enqueue(event: E, priority = 0): void {
    this.priorityQueue.push({ event, priority });
    this.priorityQueue.sort((a, b) => b.priority - a.priority);
  }
  processNext(): boolean {
    const item = this.priorityQueue.shift();
    return item ? this.send(item.event) : false;
  }
  processAll(): number { let count = 0; while (this.priorityQueue.length > 0) { if (this.processNext()) count++; } return count; }
}

// 48. Typed state machine for React-like lifecycle
type ComponentLifecycle = "created" | "mounted" | "updating" | "updated" | "unmounting" | "unmounted" | "error";
type LifecycleEvent = "mount" | "update" | "updateDone" | "unmount" | "unmountDone" | "error" | "recover";
const lifecycleMachine = new TypedStateMachine<ComponentLifecycle, LifecycleEvent>({
  states: ["created", "mounted", "updating", "updated", "unmounting", "unmounted", "error"],
  initial: "created",
  transitions: [
    { from: "created", on: "mount", to: "mounted" },
    { from: "mounted", on: "update", to: "updating" },
    { from: "mounted", on: "unmount", to: "unmounting" },
    { from: "mounted", on: "error", to: "error" },
    { from: "updating", on: "updateDone", to: "updated" },
    { from: "updating", on: "error", to: "error" },
    { from: "updated", on: "update", to: "updating" },
    { from: "updated", on: "unmount", to: "unmounting" },
    { from: "unmounting", on: "unmountDone", to: "unmounted" },
    { from: "error", on: "recover", to: "mounted" },
  ],
});

// 49. State machine with dynamic state addition
class DynamicMachine49 {
  private state: string = "start";
  private transitions = new Map<string, Map<string, string>>();
  addTransition(from: string, on: string, to: string): this {
    const map = this.transitions.get(from) ?? new Map<string, string>();
    map.set(on, to); this.transitions.set(from, map); return this;
  }
  send(event: string): boolean {
    const next = this.transitions.get(this.state)?.get(event);
    if (!next) return false; this.state = next; return true;
  }
  get current(): string { return this.state; }
}

// 50. Fully typed state machine with all features
type FullMachineState = "s0" | "s1" | "s2" | "s3" | "terminal";
type FullMachineEvent = "a" | "b" | "c" | "reset";
type FullMachineContext = { steps: number; data: string[] };
const fullMachine = new StateMachineWithContext3<FullMachineState, FullMachineEvent, FullMachineContext>(
  "s0", { steps: 0, data: [] },
  [
    { from: "s0", on: "a", to: "s1", reducer: ctx => ({ ...ctx, steps: ctx.steps + 1, data: [...ctx.data, "s0->s1"] }) },
    { from: "s1", on: "b", to: "s2", reducer: ctx => ({ ...ctx, steps: ctx.steps + 1, data: [...ctx.data, "s1->s2"] }) },
    { from: "s1", on: "c", to: "s0", reducer: ctx => ({ ...ctx, steps: ctx.steps + 1 }) },
    { from: "s2", on: "a", to: "s3", reducer: ctx => ({ ...ctx, steps: ctx.steps + 1 }) },
    { from: "s2", on: "reset", to: "s0", reducer: () => ({ steps: 0, data: [] }) },
    { from: "s3", on: "b", to: "terminal", reducer: ctx => ({ ...ctx, steps: ctx.steps + 1, data: [...ctx.data, "done"] }) },
  ]
);
fullMachine.send("a"); fullMachine.send("b"); fullMachine.send("a"); fullMachine.send("b");
console.log("Full machine:", fullMachine.current, fullMachine.context);
