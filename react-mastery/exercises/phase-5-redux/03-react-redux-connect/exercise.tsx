import React from "react";
import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  Provider,
  useSelector,
  useDispatch,
  connect,
  ConnectedProps,
} from "react-redux";

// ============================================================
// Exercise: React-Redux Connect (Hooks vs Legacy)
// ============================================================
// Learn both the modern hooks API (useSelector/useDispatch) and
// the legacy connect() HOC pattern. In interviews you should
// know both, but always recommend hooks for new code.
//
// Instructions:
// 1. Create two slices: counterSlice and userSlice
// 2. Configure the store with both reducers
// 3. Create typed hooks (useAppSelector, useAppDispatch)
// 4. Build a CounterWithHooks component using the modern API
// 5. Build a CounterWithConnect component using connect() HOC
// 6. Build a UserProfile component that reads from the user slice
// 7. Show both approaches side by side
// ============================================================

// --- Counter Slice ---

// TODO 1: Define CounterState type
// - count: number
// - step: number (the increment/decrement amount)

// TODO 2: Create counterSlice
// name: "counter"
// initialState: { count: 0, step: 1 }
// reducers:
//   a) increment: add `step` to count
//   b) decrement: subtract `step` from count
//   c) setStep: PayloadAction<number> - set the step value

// --- User Slice ---

// TODO 3: Define UserState type
// - name: string
// - email: string
// - isLoggedIn: boolean

// TODO 4: Create userSlice
// name: "user"
// initialState: { name: "Guest", email: "", isLoggedIn: false }
// reducers:
//   a) login: PayloadAction<{ name: string; email: string }> -
//      set name, email, and isLoggedIn to true
//   b) logout: reset to initial state

// --- Store ---

// TODO 5: Configure the store with both slice reducers
// const store = configureStore({
//   reducer: { counter: counterSlice.reducer, user: userSlice.reducer },
// });

// TODO 6: Derive RootState and AppDispatch types

// TODO 7: Create typed hooks
// export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
// export const useAppDispatch: () => AppDispatch = useDispatch;
// (You'll need to import TypedUseSelectorHook from react-redux)

// --- Modern Hooks Approach ---

// TODO 8: Build CounterWithHooks component
// - Use useAppSelector to read count and step
// - Use useAppDispatch to dispatch increment, decrement, setStep
// - Render count, step controls, and +/- buttons
function CounterWithHooks() {
  return (
    <div style={{ border: "2px solid #4a90d9", padding: "16px", borderRadius: "8px" }}>
      <h3>Counter (Hooks API)</h3>
      <p>Count: ???</p>
      <p>Step: ???</p>
      {/* TODO: Add step input and increment/decrement buttons */}
    </div>
  );
}

// --- Legacy connect() Approach ---

// TODO 9: Define mapStateToProps function
// Maps state.counter.count and state.counter.step to props

// TODO 10: Define mapDispatchToProps object
// Maps increment, decrement, setStep action creators to props

// TODO 11: Use ConnectedProps to derive props type from connector
// const connector = connect(mapStateToProps, mapDispatchToProps);
// type PropsFromRedux = ConnectedProps<typeof connector>;

// TODO 12: Build the base CounterWithConnectBase component
// - Receives count, step, increment, decrement, setStep as props
// - Same UI as CounterWithHooks but props-driven
function CounterWithConnectBase(props: { count: number; step: number }) {
  return (
    <div style={{ border: "2px solid #e67e22", padding: "16px", borderRadius: "8px" }}>
      <h3>Counter (connect HOC - Legacy)</h3>
      <p>Count: {props.count}</p>
      <p>Step: {props.step}</p>
      {/* TODO: Same UI, but using props from connect() */}
    </div>
  );
}

// TODO 13: Wrap with connector
// const CounterWithConnect = connector(CounterWithConnectBase);

// --- User Profile (Hooks) ---

// TODO 14: Build UserProfile component
// - Use useAppSelector to read user state
// - If logged in, show name, email, and a logout button
// - If not logged in, show a login button (hardcode a name/email)
function UserProfile() {
  return (
    <div style={{ border: "2px solid #27ae60", padding: "16px", borderRadius: "8px" }}>
      <h3>User Profile</h3>
      <p>Not implemented yet</p>
    </div>
  );
}

// TODO 15: Wrap App in Provider
export function App() {
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Exercise: React-Redux Connect</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "400px" }}>
        <CounterWithHooks />
        {/* TODO: Render CounterWithConnect here */}
        <UserProfile />
      </div>
    </div>
  );
}
