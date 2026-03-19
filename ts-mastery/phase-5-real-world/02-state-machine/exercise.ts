// ============================================================================
// Exercise 5.2 — Type-Safe State Machine
// ============================================================================
// Build a state machine where valid transitions are enforced at compile time.
//
// Instructions: Fill in every TODO so the file compiles and all assertions pass.
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// State machine definition
// ---------------------------------------------------------------------------

// TODO: Define the state machine config type
// A config maps each state to its allowed transitions (target states)

// Example: traffic light
// "green" → can go to "yellow"
// "yellow" → can go to "red"
// "red" → can go to "green"

interface TrafficLightConfig {
  green: "yellow";
  yellow: "red";
  red: "green";
}

// Example: order workflow
interface OrderConfig {
  draft: "submitted";
  submitted: "processing" | "cancelled";
  processing: "shipped" | "cancelled";
  shipped: "delivered";
  delivered: never;
  cancelled: never;
}

// ---------------------------------------------------------------------------
// TODO: Implement StateMachine class
// ---------------------------------------------------------------------------

// The machine should:
// - Track current state
// - Only allow valid transitions at the type level
// - Have a `transition` method that moves to a valid next state
// - Have a `getState` method returning the current state

// Hint: This is challenging! You may need to use a simpler runtime approach
// with type-level validation on the transition method.

class StateMachine<
  Config extends Record<string, string | never>,
  Current extends keyof Config = keyof Config
> {
  // TODO: implement constructor(private state: Current)

  // TODO: implement getState(): Current

  // TODO: implement transition(next): StateMachine<Config, next>
  // The `next` parameter should only accept Config[Current]
}

// ---------------------------------------------------------------------------
// Runtime tests (uncomment after implementing)
// ---------------------------------------------------------------------------

/*
const light = new StateMachine<TrafficLightConfig>("green");
console.assert(light.getState() === "green", "initial state");

const yellow = light.transition("yellow");
console.assert(yellow.getState() === "yellow", "green → yellow");

const red = yellow.transition("red");
console.assert(red.getState() === "red", "yellow → red");

const green = red.transition("green");
console.assert(green.getState() === "green", "red → green");

// These should cause compile errors:
// light.transition("red");    // Error: can't go green → red
// red.transition("yellow");   // Error: can't go red → yellow

const order = new StateMachine<OrderConfig>("draft");
const submitted = order.transition("submitted");
const processing = submitted.transition("processing");
const shipped = processing.transition("shipped");
console.assert(shipped.getState() === "shipped", "order shipped");
*/

console.log("Exercise 5.2 — All assertions passed!");

export {};
