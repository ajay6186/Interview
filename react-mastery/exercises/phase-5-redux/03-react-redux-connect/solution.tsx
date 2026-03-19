import React from "react";
import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  Provider,
  useSelector,
  useDispatch,
  connect,
  ConnectedProps,
  TypedUseSelectorHook,
} from "react-redux";

// ============================================================
// Solution: React-Redux Connect (Hooks vs Legacy)
// ============================================================
// Demonstrates both the modern hooks API and the legacy connect()
// HOC pattern side by side, with typed hooks and multiple slices.
// ============================================================

// --- Counter Slice ---

type CounterState = {
  count: number;
  step: number;
};

const counterSlice = createSlice({
  name: "counter",
  initialState: { count: 0, step: 1 } as CounterState,
  reducers: {
    increment(state) {
      state.count += state.step;
    },
    decrement(state) {
      state.count -= state.step;
    },
    setStep(state, action: PayloadAction<number>) {
      state.step = action.payload;
    },
  },
});

const { increment, decrement, setStep } = counterSlice.actions;

// --- User Slice ---

type UserState = {
  name: string;
  email: string;
  isLoggedIn: boolean;
};

const userInitialState: UserState = {
  name: "Guest",
  email: "",
  isLoggedIn: false,
};

const userSlice = createSlice({
  name: "user",
  initialState: userInitialState,
  reducers: {
    login(state, action: PayloadAction<{ name: string; email: string }>) {
      state.name = action.payload.name;
      state.email = action.payload.email;
      state.isLoggedIn = true;
    },
    logout() {
      return userInitialState;
    },
  },
});

const { login, logout } = userSlice.actions;

// --- Store ---

const store = configureStore({
  reducer: {
    counter: counterSlice.reducer,
    user: userSlice.reducer,
  },
});

type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;

// --- Typed Hooks (recommended pattern) ---

const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
const useAppDispatch: () => AppDispatch = useDispatch;

// --- Modern Hooks Approach ---

function CounterWithHooks() {
  const count = useAppSelector((state) => state.counter.count);
  const step = useAppSelector((state) => state.counter.step);
  const dispatch = useAppDispatch();

  return (
    <div
      style={{
        border: "2px solid #4a90d9",
        padding: "16px",
        borderRadius: "8px",
      }}
    >
      <h3>Counter (Hooks API - Modern)</h3>
      <p>
        Count: <strong>{count}</strong>
      </p>
      <div style={{ marginBottom: "8px" }}>
        <label>
          Step:{" "}
          <input
            type="number"
            value={step}
            min={1}
            onChange={(e) => dispatch(setStep(Number(e.target.value)))}
            style={{ width: "60px", padding: "4px" }}
          />
        </label>
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={() => dispatch(increment())}>+ {step}</button>
        <button onClick={() => dispatch(decrement())}>- {step}</button>
      </div>
    </div>
  );
}

// --- Legacy connect() Approach ---

// mapStateToProps: extracts data from the store
const mapStateToProps = (state: RootState) => ({
  count: state.counter.count,
  step: state.counter.step,
});

// mapDispatchToProps: object shorthand binds action creators
const mapDispatchToProps = {
  increment,
  decrement,
  setStep,
};

// Create the connector and derive props type
const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

// The base component receives everything via props
function CounterWithConnectBase({
  count,
  step,
  increment,
  decrement,
  setStep,
}: PropsFromRedux) {
  return (
    <div
      style={{
        border: "2px solid #e67e22",
        padding: "16px",
        borderRadius: "8px",
      }}
    >
      <h3>Counter (connect HOC - Legacy)</h3>
      <p>
        Count: <strong>{count}</strong>
      </p>
      <div style={{ marginBottom: "8px" }}>
        <label>
          Step:{" "}
          <input
            type="number"
            value={step}
            min={1}
            onChange={(e) => setStep(Number(e.target.value))}
            style={{ width: "60px", padding: "4px" }}
          />
        </label>
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={() => increment()}>+ {step}</button>
        <button onClick={() => decrement()}>- {step}</button>
      </div>
      <p style={{ fontSize: "12px", color: "#888", marginTop: "8px" }}>
        This component uses connect() HOC. Prefer hooks for new code.
      </p>
    </div>
  );
}

// Wrap the base component with connect()
const CounterWithConnect = connector(CounterWithConnectBase);

// --- User Profile (Hooks) ---

function UserProfile() {
  const user = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();

  return (
    <div
      style={{
        border: "2px solid #27ae60",
        padding: "16px",
        borderRadius: "8px",
      }}
    >
      <h3>User Profile</h3>
      {user.isLoggedIn ? (
        <>
          <p>
            Name: <strong>{user.name}</strong>
          </p>
          <p>
            Email: <strong>{user.email}</strong>
          </p>
          <button onClick={() => dispatch(logout())}>Logout</button>
        </>
      ) : (
        <>
          <p>Not logged in</p>
          <button
            onClick={() =>
              dispatch(
                login({ name: "Jane Doe", email: "jane@example.com" })
              )
            }
          >
            Login as Jane
          </button>
        </>
      )}
    </div>
  );
}

// --- App ---

export function App() {
  return (
    <Provider store={store}>
      <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
        <h1>Exercise: React-Redux Connect</h1>
        <p style={{ color: "#666", marginBottom: "16px" }}>
          Both counters share the same Redux store. Changing one updates the
          other.
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            maxWidth: "400px",
          }}
        >
          <CounterWithHooks />
          <CounterWithConnect />
          <UserProfile />
        </div>
      </div>
    </Provider>
  );
}
