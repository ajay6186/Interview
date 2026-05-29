export {};

// ============================================================
// BASIC EXAMPLES — State Machine (50 Examples)
// ============================================================

// 1. Simple traffic light states
type TrafficLight = "red" | "yellow" | "green";

// 2. Current state holder
let trafficState: TrafficLight = "red";

// 3. Transition function
function nextLight(state: TrafficLight): TrafficLight {
  if (state === "red") return "green";
  if (state === "green") return "yellow";
  return "red";
}

// 4. Order status states
type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

// 5. Order state transition map
const orderTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

// 6. Check if transition is valid
function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return orderTransitions[from].includes(to);
}

// 7. Perform order transition
function transitionOrder(current: OrderStatus, next: OrderStatus): OrderStatus {
  if (!canTransition(current, next)) throw new Error(`Cannot go from ${current} to ${next}`);
  return next;
}

// 8. Door states
type DoorState = "open" | "closed" | "locked";

// 9. Door events
type DoorEvent = "open" | "close" | "lock" | "unlock";

// 10. Door transition table
function doorTransition(state: DoorState, event: DoorEvent): DoorState {
  if (state === "closed" && event === "open") return "open";
  if (state === "open" && event === "close") return "closed";
  if (state === "closed" && event === "lock") return "locked";
  if (state === "locked" && event === "unlock") return "closed";
  return state;
}

// 11. State machine action callback
type StateAction = () => void;

// 12. State entry actions map
const onEntry: Partial<Record<OrderStatus, StateAction>> = {
  confirmed: () => console.log("Order confirmed! Preparing shipment."),
  shipped: () => console.log("Package on the way!"),
  delivered: () => console.log("Order complete."),
};

// 13. Run entry action
function runEntry(state: OrderStatus): void {
  onEntry[state]?.();
}

// 14. Simple state machine interface
interface StateMachine<S extends string, E extends string> {
  state: S;
  send(event: E): void;
}

// 15. Toggle machine states
type ToggleState = "on" | "off";
type ToggleEvent = "toggle";

// 16. Toggle machine implementation
class ToggleMachine implements StateMachine<ToggleState, ToggleEvent> {
  state: ToggleState = "off";
  send(event: ToggleEvent): void {
    if (event === "toggle") this.state = this.state === "off" ? "on" : "off";
  }
}

// 17. State history tracking
class TrafficLightMachine {
  state: TrafficLight = "red";
  history: TrafficLight[] = ["red"];
  next(): void {
    this.state = nextLight(this.state);
    this.history.push(this.state);
  }
}

// 18. State machine with guards
type AccountState = "active" | "suspended" | "closed";
type AccountEvent = "suspend" | "reactivate" | "close";

function accountTransition(state: AccountState, event: AccountEvent, balance: number): AccountState {
  if (state === "active" && event === "suspend") return "suspended";
  if (state === "suspended" && event === "reactivate" && balance >= 0) return "active";
  if (state !== "closed" && event === "close") return "closed";
  return state;
}

// 19. Player states in a video game
type PlayerState = "idle" | "running" | "jumping" | "falling" | "dead";

// 20. Player event types
type PlayerEvent = "move" | "jump" | "land" | "fall" | "die";

// 21. Player transitions
function playerTransition(state: PlayerState, event: PlayerEvent): PlayerState {
  const map: Partial<Record<PlayerState, Partial<Record<PlayerEvent, PlayerState>>>> = {
    idle: { move: "running", jump: "jumping", fall: "falling", die: "dead" },
    running: { jump: "jumping", fall: "falling", die: "dead" },
    jumping: { land: "idle", fall: "falling", die: "dead" },
    falling: { land: "idle", die: "dead" },
  };
  return map[state]?.[event] ?? state;
}

// 22. Entry/exit callback types
interface StateCallbacks<S extends string> {
  onEnter?: Partial<Record<S, () => void>>;
  onExit?: Partial<Record<S, () => void>>;
}

// 23. State machine with callbacks
class CallbackMachine<S extends string, E extends string> {
  constructor(
    public state: S,
    private transition: (s: S, e: E) => S,
    private callbacks: StateCallbacks<S> = {}
  ) {}
  send(event: E): void {
    this.callbacks.onExit?.[this.state]?.();
    this.state = this.transition(this.state, event);
    this.callbacks.onEnter?.[this.state]?.();
  }
}

// 24. Fan power states
type FanState = "off" | "low" | "medium" | "high";
type FanEvent = "increase" | "decrease" | "off";

function fanTransition(state: FanState, event: FanEvent): FanState {
  if (event === "off") return "off";
  if (event === "increase") {
    if (state === "off") return "low";
    if (state === "low") return "medium";
    if (state === "medium") return "high";
  }
  if (event === "decrease") {
    if (state === "high") return "medium";
    if (state === "medium") return "low";
    if (state === "low") return "off";
  }
  return state;
}

// 25. Subscription lifecycle
type SubState = "trial" | "active" | "past_due" | "cancelled";

// 26. Subscription transitions
const subTransitionMap: Record<SubState, SubState[]> = {
  trial: ["active", "cancelled"],
  active: ["past_due", "cancelled"],
  past_due: ["active", "cancelled"],
  cancelled: [],
};

// 27. Check subscription transition
function canSubTransition(from: SubState, to: SubState): boolean {
  return subTransitionMap[from].includes(to);
}

// 28. Elevator states
type ElevatorState = "idle" | "moving_up" | "moving_down" | "doors_open";

// 29. Elevator events
type ElevatorEvent = "go_up" | "go_down" | "stop" | "open_doors" | "close_doors";

// 30. Elevator transition
function elevatorTransition(state: ElevatorState, event: ElevatorEvent): ElevatorState {
  if (state === "idle" && event === "go_up") return "moving_up";
  if (state === "idle" && event === "go_down") return "moving_down";
  if ((state === "moving_up" || state === "moving_down") && event === "stop") return "idle";
  if (state === "idle" && event === "open_doors") return "doors_open";
  if (state === "doors_open" && event === "close_doors") return "idle";
  return state;
}

// 31. State machine event log entry
interface EventLog<S, E> { from: S; event: E; to: S; timestamp: Date; }

// 32. State machine with event logging
class LoggedMachine<S extends string, E extends string> {
  state: S;
  log: EventLog<S, E>[] = [];
  constructor(initial: S, private transition: (s: S, e: E) => S) {
    this.state = initial;
  }
  send(event: E): void {
    const from = this.state;
    this.state = this.transition(this.state, event);
    this.log.push({ from, event, to: this.state, timestamp: new Date() });
  }
}

// 33. HTTP request lifecycle states
type FetchState = "idle" | "loading" | "success" | "error";

// 34. Fetch machine events
type FetchEvent = "fetch" | "resolve" | "reject" | "reset";

// 35. Fetch machine transition
function fetchTransition(state: FetchState, event: FetchEvent): FetchState {
  if (state === "idle" && event === "fetch") return "loading";
  if (state === "loading" && event === "resolve") return "success";
  if (state === "loading" && event === "reject") return "error";
  if ((state === "success" || state === "error") && event === "reset") return "idle";
  return state;
}

// 36. Auth states
type AuthState = "unauthenticated" | "authenticating" | "authenticated" | "error";

// 37. Auth events
type AuthEvent = "login" | "success" | "failure" | "logout";

// 38. Auth machine
function authTransition(state: AuthState, event: AuthEvent): AuthState {
  if (state === "unauthenticated" && event === "login") return "authenticating";
  if (state === "authenticating" && event === "success") return "authenticated";
  if (state === "authenticating" && event === "failure") return "error";
  if (state === "authenticated" && event === "logout") return "unauthenticated";
  if (state === "error" && event === "login") return "authenticating";
  return state;
}

// 39. Media player states
type MediaState = "stopped" | "playing" | "paused" | "buffering";

// 40. Media events
type MediaEvent = "play" | "pause" | "stop" | "buffer" | "ready";

// 41. Media player transition
function mediaTransition(state: MediaState, event: MediaEvent): MediaState {
  if (state === "stopped" && event === "play") return "playing";
  if (state === "playing" && event === "pause") return "paused";
  if (state === "playing" && event === "stop") return "stopped";
  if (state === "playing" && event === "buffer") return "buffering";
  if (state === "buffering" && event === "ready") return "playing";
  if (state === "paused" && event === "play") return "playing";
  if (state === "paused" && event === "stop") return "stopped";
  return state;
}

// 42. Form wizard states
type WizardState = "step1" | "step2" | "step3" | "review" | "submitted";

// 43. Wizard navigation events
type WizardEvent = "next" | "back" | "submit" | "reset";

// 44. Wizard machine
function wizardTransition(state: WizardState, event: WizardEvent): WizardState {
  if (event === "reset") return "step1";
  if (event === "next") {
    if (state === "step1") return "step2";
    if (state === "step2") return "step3";
    if (state === "step3") return "review";
  }
  if (event === "back") {
    if (state === "step2") return "step1";
    if (state === "step3") return "step2";
    if (state === "review") return "step3";
  }
  if (state === "review" && event === "submit") return "submitted";
  return state;
}

// 45. Connection states
type ConnectionState = "disconnected" | "connecting" | "connected" | "reconnecting";

// 46. Connection events
type ConnectionEvent = "connect" | "connected" | "disconnect" | "error";

// 47. Connection transition
function connectionTransition(state: ConnectionState, event: ConnectionEvent): ConnectionState {
  if (state === "disconnected" && event === "connect") return "connecting";
  if (state === "connecting" && event === "connected") return "connected";
  if (state === "connecting" && event === "error") return "disconnected";
  if (state === "connected" && event === "disconnect") return "disconnected";
  if (state === "connected" && event === "error") return "reconnecting";
  if (state === "reconnecting" && event === "connected") return "connected";
  if (state === "reconnecting" && event === "error") return "disconnected";
  return state;
}

// 48. Final state check
function isFinalState(state: OrderStatus): boolean {
  return orderTransitions[state].length === 0;
}

// 49. Get all reachable states via BFS
function reachableStates<S extends string>(
  initial: S,
  transitions: Record<S, S[]>
): S[] {
  const visited = new Set<S>();
  const queue: S[] = [initial];
  while (queue.length) {
    const s = queue.shift()!;
    if (visited.has(s)) continue;
    visited.add(s);
    transitions[s].forEach(t => queue.push(t));
  }
  return [...visited];
}

// 50. State machine context — holds data alongside state
interface OrderContext { status: OrderStatus; total: number; updatedAt: Date; }
function createOrderContext(total: number): OrderContext {
  return { status: "pending", total, updatedAt: new Date() };
}
