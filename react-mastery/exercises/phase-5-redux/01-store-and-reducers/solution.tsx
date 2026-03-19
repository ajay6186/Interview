import React from "react";
import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Provider, useSelector, useDispatch } from "react-redux";

// ============================================================
// Solution: Store and Reducers
// ============================================================
// A complete counter app demonstrating Redux Toolkit fundamentals:
// typed state, createSlice, configureStore, Provider, useSelector,
// and useDispatch.
// ============================================================

// 1. Define the CounterState type
type CounterState = {
  value: number;
  lastAction: string;
};

// 2. Create the initial state
const initialState: CounterState = {
  value: 0,
  lastAction: "none",
};

// 3. Create the counter slice
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
  },
});

// 4. Export action creators
const { increment, decrement, reset, incrementByAmount } =
  counterSlice.actions;

// 5. Configure the store
const store = configureStore({
  reducer: {
    counter: counterSlice.reducer,
  },
});

// 6. Derive types from the store
type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;

// 7. Counter component using hooks
function Counter() {
  const value = useSelector((state: RootState) => state.counter.value);
  const lastAction = useSelector(
    (state: RootState) => state.counter.lastAction
  );
  const dispatch = useDispatch<AppDispatch>();

  return (
    <div>
      <h2>Count: {value}</h2>
      <p>
        Last action: <code>{lastAction}</code>
      </p>
      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={() => dispatch(increment())}>+1</button>
        <button onClick={() => dispatch(decrement())}>-1</button>
        <button onClick={() => dispatch(reset())}>Reset</button>
        <button onClick={() => dispatch(incrementByAmount(5))}>+5</button>
      </div>
    </div>
  );
}

// 8. App wrapped in Provider
export function App() {
  return (
    <Provider store={store}>
      <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
        <h1>Exercise: Store and Reducers</h1>
        <Counter />
      </div>
    </Provider>
  );
}
