import React, { useReducer, useState } from "react";

// ============================================================
// Exercise: useReducer — Counter with Action History
// ============================================================
// Build a fully-typed counter using useReducer with a
// discriminated union for actions, configurable step size,
// and an action history log that records every dispatch.
//
// Instructions:
// 1. Define the State and Action types.
// 2. Write the reducer function.
// 3. Build the counter UI with useReducer.
// 4. Add a configurable step size via SET_STEP action.
// 5. Add an action history panel showing every dispatched action.
// ============================================================

// TODO 1: Define the State type
// - count: number
// - step: number (the increment/decrement amount)
// - history: Array<{ action: string; resultingCount: number; timestamp: string }>
//
// interface State { ... }

// TODO 2: Define the Action type as a discriminated union
// Each action has a `type` field. Some have payloads:
// - { type: "INCREMENT" }              — increase count by step
// - { type: "DECREMENT" }              — decrease count by step
// - { type: "RESET" }                  — reset count to 0 and step to 1
// - { type: "SET_STEP"; payload: number } — change the step size
// - { type: "SET_COUNT"; payload: number } — set count to a specific value
//
// type Action = ...

// TODO 3: Define the initial state
// - count: 0, step: 1, history: []
//
// const initialState: State = ...

// TODO 4: Write the reducer function
// - Handle each action type
// - For every action, push a new entry onto the history array containing:
//     action: a descriptive string like "INCREMENT by 1" or "RESET"
//     resultingCount: the new count after the action
//     timestamp: new Date().toLocaleTimeString()
// - Remember: never mutate state — always return a new object
//
// function reducer(state: State, action: Action): State { ... }

// TODO 5: CounterDisplay component
// - Use useReducer(reducer, initialState)
// - Render the current count in large text
// - Render the current step size
// - Render Increment and Decrement buttons that dispatch their actions
// - Render a Reset button
function CounterDisplay() {
  // TODO: call useReducer

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h2>Counter</h2>
      {/* TODO: display count */}
      {/* TODO: display step size */}
      {/* TODO: increment, decrement, and reset buttons */}
    </div>
  );
}

// TODO 6: StepControl component
// - Accept dispatch as a prop (you'll need to type it)
// - Accept the current step value as a prop
// - Render a number input for step size
// - Render preset buttons for step 1, 5, 10
// - Dispatching SET_STEP with the new value
//
// Hint for typing dispatch: React.Dispatch<Action>

function StepControl({
  dispatch,
  step,
}: {
  dispatch: any; // TODO: type this properly as React.Dispatch<Action>
  step: number;
}) {
  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h2>Step Control</h2>
      {/* TODO: number input for custom step size */}
      {/* TODO: preset buttons for step 1, 5, 10 */}
    </div>
  );
}

// TODO 7: ActionHistory component
// - Accept history array as a prop
// - Render a scrollable list of all actions that have been dispatched
// - Show the action name, resulting count, and timestamp for each entry
// - Show total action count
// - If history is empty, show "No actions dispatched yet"

function ActionHistory({
  history,
}: {
  history: Array<{ action: string; resultingCount: number; timestamp: string }>;
}) {
  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h2>Action History</h2>
      {/* TODO: display total actions count */}
      {/* TODO: render the history list */}
      {/* TODO: handle empty history state */}
    </div>
  );
}

// TODO 8: SetCountForm component
// - Maintain local input state for a specific count value
// - On submit, dispatch SET_COUNT with the entered number
// - This demonstrates combining local state with reducer dispatch

function SetCountForm({ dispatch }: { dispatch: any }) {
  // TODO: local input state
  // TODO: handle form submission

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h2>Set Count Directly</h2>
      {/* TODO: number input and submit button */}
    </div>
  );
}

export function App() {
  // Note: In a real solution, useReducer is called here (or in CounterDisplay)
  // and state/dispatch are passed down. For the exercise, students must decide
  // where to lift state.

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Exercise: useReducer</h1>
      {/* TODO: Initialize useReducer here and pass state/dispatch to children */}
      {/* TODO: Render CounterDisplay */}
      {/* TODO: Render StepControl */}
      {/* TODO: Render SetCountForm */}
      {/* TODO: Render ActionHistory */}
    </div>
  );
}
