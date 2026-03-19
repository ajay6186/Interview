import React from "react";
import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Provider, useSelector, useDispatch } from "react-redux";

// ============================================================
// Exercise: Store and Reducers
// ============================================================
// Learn the fundamentals of Redux Toolkit: creating slices with
// typed state, defining reducers, configuring a store, and
// connecting React components via Provider, useSelector, and
// useDispatch.
//
// Instructions:
// 1. Define a CounterState type with `value` (number) and
//    `lastAction` (string) fields
// 2. Create a counterSlice using createSlice with initialState
//    and four reducers: increment, decrement, reset, and
//    incrementByAmount
// 3. Configure a Redux store using configureStore
// 4. Derive RootState and AppDispatch types from the store
// 5. Build a Counter component that reads state with useSelector
//    and dispatches actions with useDispatch
// 6. Wrap the app in a Provider with the store
// ============================================================

// TODO 1: Define a CounterState type
// It should have:
//   - value: number
//   - lastAction: string (tracks which action was last dispatched)

type CounterState = {
  value: number;
  lastAction: string;
};

// TODO 2: Create the initial state object conforming to CounterState
// value should start at 0, lastAction should be "none"

const initialState: CounterState = {
  value: 0,
  lastAction: "none",
}

// TODO 3: Create a counterSlice using createSlice
// - name: "counter"
// - initialState: your initial state object
// - reducers:
//   a) increment: adds 1 to value, sets lastAction to "increment"
//   b) decrement: subtracts 1 from value, sets lastAction to "decrement"
//   c) reset: sets value back to 0, sets lastAction to "reset"
//   d) incrementByAmount: uses PayloadAction<number> to add a custom amount,
//      sets lastAction to "incrementByAmount(N)" where N is the amount

const counterSlice = createSlice({
  name: "counter",
  initialState,
  reducers: {
    increment(state) {
      state.value += 1;
      state.lastAction = "increment";
    },
    decrement(state) {
      state.value -= 1;
      state.lastAction = "decrement";
    },
    reset(state) {
      state.value = 0;
      state.lastAction = "reset";
    },
    incrementByAmount(state, action: PayloadAction<number>) {
      state.value += action.payload;
      state.lastAction = `incrementByAmount(${action.payload})`;
    },
  }
});

// TODO 4: Export the action creators from the slice
// const { increment, decrement, reset, incrementByAmount } = counterSlice.actions;

const { increment, decrement, reset, incrementByAmount } = counterSlice.actions;

// TODO 5: Configure the store using configureStore
// - reducer: { counter: counterSlice.reducer }
// const store = configureStore({ ... });

const store = configureStore({
  reducer: {
    counter: counterSlice.reducer,
  }
})

// TODO 6: Derive the RootState and AppDispatch types from the store
// type RootState = ReturnType<typeof store.getState>;
// type AppDispatch = typeof store.dispatch;
type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;

// TODO 7: Build the Counter component
// - Use useSelector to read state.counter.value and state.counter.lastAction
// - Use useDispatch to get the dispatch function
// - Render the current count value in an <h2>
// - Render the lastAction in a <p>
// - Add buttons for: +1, -1, Reset, +5 (using incrementByAmount)
function Counter() {
  return (
    <div>
      <h2>Count: ???</h2>
      <p>Last action: ???</p>
      <div style={{ display: "flex", gap: "8px" }}>
        {/* TODO: Add buttons that dispatch actions */}
        <button>+1</button>
        <button>-1</button>
        <button>Reset</button>
        <button>+5</button>
      </div>
    </div>
  );
}

// TODO 8: Wrap the App in a <Provider store={store}>
export function App() {
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Exercise: Store and Reducers</h1>
      {/* TODO: Wrap Counter in Provider */}
      <Counter />
    </div>
  );
}
