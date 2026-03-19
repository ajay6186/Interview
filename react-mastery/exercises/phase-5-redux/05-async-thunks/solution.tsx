import React, { useEffect } from "react";
import {
  configureStore,
  createSlice,
  createAsyncThunk,
  PayloadAction,
} from "@reduxjs/toolkit";
import { Provider, useSelector, useDispatch } from "react-redux";

// ============================================================
// Solution: Async Thunks
// ============================================================
// Complete async data fetching with createAsyncThunk, loading
// and error states in extraReducers, and retry logic.
// ============================================================

// --- Types ---

type User = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
};

type UsersState = {
  users: User[];
  loading: boolean;
  error: string | null;
  retryCount: number;
};

// --- Fake API ---

const fakeUsers: User[] = [
  { id: 1, name: "Alice Johnson", email: "alice@example.com", role: "admin" },
  { id: 2, name: "Bob Smith", email: "bob@example.com", role: "user" },
  { id: 3, name: "Carol Williams", email: "carol@example.com", role: "user" },
  { id: 4, name: "Dave Brown", email: "dave@example.com", role: "admin" },
  { id: 5, name: "Eve Davis", email: "eve@example.com", role: "user" },
];

const fakeApi = (): Promise<User[]> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.3) {
        reject(new Error("Network error: Failed to fetch users"));
      } else {
        resolve([...fakeUsers]);
      }
    }, 1500);
  });
};

// --- Async Thunk ---

const fetchUsers = createAsyncThunk<User[], void, { rejectValue: string }>(
  "users/fetchUsers",
  async (_, thunkAPI) => {
    try {
      const users = await fakeApi();
      return users;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// --- Users Slice ---

const initialState: UsersState = {
  users: [],
  loading: false,
  error: null,
  retryCount: 0,
};

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    resetUsers() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
        state.retryCount = 0;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? action.error.message ?? "Unknown error";
        state.retryCount += 1;
      });
  },
});

const { clearError, resetUsers } = usersSlice.actions;

// --- Store ---

const store = configureStore({
  reducer: {
    users: usersSlice.reducer,
  },
});

type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;

// --- Components ---

function LoadingSpinner() {
  return (
    <div style={{ textAlign: "center", padding: "40px" }}>
      <div
        style={{
          display: "inline-block",
          width: "40px",
          height: "40px",
          border: "4px solid #e0e0e0",
          borderTopColor: "#4a90d9",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <p style={{ color: "#666", marginTop: "12px" }}>Fetching users...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorMessage() {
  const error = useSelector((state: RootState) => state.users.error);
  const retryCount = useSelector((state: RootState) => state.users.retryCount);
  const dispatch = useDispatch<AppDispatch>();

  if (!error) return null;

  return (
    <div
      style={{
        padding: "16px",
        backgroundColor: "#fdecea",
        border: "1px solid #e74c3c",
        borderRadius: "8px",
        marginBottom: "16px",
      }}
    >
      <h3 style={{ color: "#e74c3c", marginTop: 0 }}>Error</h3>
      <p>{error}</p>
      <p style={{ color: "#999", fontSize: "14px" }}>
        Retry attempts: {retryCount}
      </p>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={() => dispatch(fetchUsers())}
          style={{
            padding: "8px 16px",
            backgroundColor: "#e74c3c",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
        <button
          onClick={() => dispatch(clearError())}
          style={{
            padding: "8px 16px",
            backgroundColor: "#95a5a6",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

function UserCard({ user }: { user: User }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        padding: "12px",
        borderRadius: "8px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <h4 style={{ margin: "0 0 4px 0" }}>{user.name}</h4>
        <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
          {user.email}
        </p>
      </div>
      <span
        style={{
          padding: "4px 10px",
          borderRadius: "12px",
          fontSize: "12px",
          fontWeight: "bold",
          backgroundColor: user.role === "admin" ? "#e8d5f5" : "#d5f5e3",
          color: user.role === "admin" ? "#8e44ad" : "#27ae60",
        }}
      >
        {user.role}
      </span>
    </div>
  );
}

function UsersList() {
  const { users, loading, error } = useSelector(
    (state: RootState) => state.users
  );
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h2 style={{ margin: 0 }}>Users</h2>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => dispatch(fetchUsers())}
            disabled={loading}
            style={{
              padding: "8px 16px",
              backgroundColor: loading ? "#ccc" : "#4a90d9",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
          <button
            onClick={() => dispatch(resetUsers())}
            style={{
              padding: "8px 16px",
              backgroundColor: "#95a5a6",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <ErrorMessage />

      {loading && <LoadingSpinner />}

      {!loading && !error && users.length === 0 && (
        <p style={{ color: "#999", textAlign: "center", padding: "20px" }}>
          No users loaded. Click "Refresh" to fetch.
        </p>
      )}

      {!loading && users.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {users.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBar() {
  const { users, loading, error, retryCount } = useSelector(
    (state: RootState) => state.users
  );

  let status: string;
  let color: string;

  if (loading) {
    status = "Loading...";
    color = "#f39c12";
  } else if (error) {
    status = "Error";
    color = "#e74c3c";
  } else if (users.length > 0) {
    status = `Loaded (${users.length} users)`;
    color = "#27ae60";
  } else {
    status = "Idle";
    color = "#95a5a6";
  }

  return (
    <div
      style={{
        padding: "8px 16px",
        backgroundColor: "#f0f0f0",
        borderRadius: "4px",
        marginBottom: "16px",
        fontSize: "14px",
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <span>
        Status:{" "}
        <strong style={{ color }}>{status}</strong>
      </span>
      {retryCount > 0 && (
        <span style={{ color: "#e74c3c" }}>
          Retries: {retryCount}
        </span>
      )}
    </div>
  );
}

// --- App ---

export function App() {
  return (
    <Provider store={store}>
      <div
        style={{
          padding: "20px",
          fontFamily: "sans-serif",
          maxWidth: "600px",
        }}
      >
        <h1>Exercise: Async Thunks</h1>
        <StatusBar />
        <UsersList />
      </div>
    </Provider>
  );
}
