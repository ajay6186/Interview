// ============================================================================
// Solution 5.2 — Type-Safe State Machine
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// State machine configs
// ---------------------------------------------------------------------------

type TrafficLightConfig = {
  green: "yellow";
  yellow: "red";
  red: "green";
};

type OrderConfig = {
  draft: "submitted";
  submitted: "processing" | "cancelled";
  processing: "shipped" | "cancelled";
  shipped: "delivered";
  delivered: never;
  cancelled: never;
};

// ---------------------------------------------------------------------------
// StateMachine implementation
// ---------------------------------------------------------------------------

class StateMachine<
  Config extends Record<string, string | never>,
  Current extends keyof Config & string = keyof Config & string
> {
  constructor(private state: Current) {}

  getState(): Current {
    return this.state;
  }

  transition<Next extends Config[Current] & string>(
    next: Next
  ): StateMachine<Config, Next> {
    return new StateMachine<Config, Next>(next);
  }
}

// ---------------------------------------------------------------------------
// Runtime tests
// ---------------------------------------------------------------------------

const light = new StateMachine<TrafficLightConfig>("green");
console.assert(light.getState() === "green", "initial state");

const yellow = light.transition("yellow");
console.assert(yellow.getState() === "yellow", "green → yellow");

const red = yellow.transition("red");
console.assert(red.getState() === "red", "yellow → red");

const green = red.transition("green");
console.assert(green.getState() === "green", "red → green");

// Compile errors (uncomment to verify):
// light.transition("red");    // Error!
// red.transition("yellow");   // Error!

const order = new StateMachine<OrderConfig>("draft");
const submitted = order.transition("submitted");
const processing = submitted.transition("processing");
const shipped = processing.transition("shipped");
const delivered = shipped.transition("delivered");
console.assert(delivered.getState() === "delivered", "order delivered");

// Can also cancel:
const cancelled = submitted.transition("cancelled");
console.assert(cancelled.getState() === "cancelled", "order cancelled");

console.log("Solution 5.2 — All assertions passed!");

export {};
