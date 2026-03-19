import React, { useEffect } from "react";
import {
  configureStore,
  createSlice,
  createAsyncThunk,
  PayloadAction,
} from "@reduxjs/toolkit";
import { Provider, useSelector, useDispatch } from "react-redux";

// ============================================================
// Exercise: Async Thunks
// ============================================================
// Learn how to handle asynchronous operations in Redux using
// createAsyncThunk. Simulate API calls, handle loading/error
// states, and implement retry logic.
//
// Instructions:
// 1. Define User type and UsersState type (with loading, error fields)
// 2. Create a fake API function that returns users after a delay
// 3. Create an async thunk with createAsyncThunk
// 4. Create a usersSlice with extraReducers for pending/fulfilled/rejected
// 5. Build a UsersList component with loading/error/data states
// 6. Implement a retry mechanism
// ============================================================

// TODO 1: Define a User type
// - id: number
// - name: string
// - email: string
// - role: "admin" | "user"

// TODO 2: Define a UsersState type
// - users: User[]
// - loading: boolean
// - error: string | null
// - retryCount: number

// TODO 3: Create a fake API function
// It should return a Promise<User[]> that resolves after 1500ms
// with a hardcoded array of users.
// Make it fail ~30% of the time to test error handling:
//   if (Math.random() < 0.3) reject(new Error("Network error: Failed to fetch users"));
//   else resolve(users);
// const fakeApi = (): Promise<User[]> => { ... };

// TODO 4: Create an async thunk using createAsyncThunk
// - typePrefix: "users/fetchUsers"
// - The payloadCreator should call fakeApi() and return the result
// - Handle errors by using try/catch and thunkAPI.rejectWithValue(message)
// const fetchUsers = createAsyncThunk("users/fetchUsers", async (_, thunkAPI) => { ... });

// TODO 5: Create a usersSlice
// name: "users"
// initialState: { users: [], loading: false, error: null, retryCount: 0 }
// reducers:
//   a) clearError: set error to null
//   b) resetUsers: reset to initial state
// extraReducers: (builder) => {
//   handle fetchUsers.pending:
//     - set loading to true, error to null
//   handle fetchUsers.fulfilled:
//     - set loading to false, users to action.payload, retryCount to 0
//   handle fetchUsers.rejected:
//     - set loading to false
//     - set error to action.payload (string) or action.error.message
//     - increment retryCount
// }

// TODO 6: Export action creators

// TODO 7: Configure the store

// TODO 8: Derive RootState and AppDispatch types

// --- Components ---

// TODO 9: Build a LoadingSpinner component
// Show a spinning indicator or "Loading..." text
function LoadingSpinner() {
  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      {/* TODO: Style a loading indicator */}
      <p>Loading...</p>
    </div>
  );
}

// TODO 10: Build an ErrorMessage component
// - Show the error message
// - Show the retry count
// - "Retry" button that dispatches fetchUsers again
// - "Clear Error" button that dispatches clearError
function ErrorMessage() {
  return (
    <div
      style={{
        padding: "16px",
        backgroundColor: "#fdecea",
        border: "1px solid #e74c3c",
        borderRadius: "8px",
      }}
    >
      <h3 style={{ color: "#e74c3c" }}>Error</h3>
      <p>Something went wrong (implement ErrorMessage)</p>
      <button>Retry</button>
    </div>
  );
}

// TODO 11: Build a UserCard component
// - Receives a user prop
// - Shows name, email, and role badge
function UserCard(props: { user: any }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        padding: "12px",
        borderRadius: "8px",
      }}
    >
      <h4>User Name</h4>
      <p>email@example.com</p>
      <span>Role: ???</span>
    </div>
  );
}

// TODO 12: Build a UsersList component
// - Use useSelector to read users, loading, error, retryCount
// - Use useDispatch to dispatch fetchUsers
// - Use useEffect to dispatch fetchUsers on mount
// - Conditionally render:
//   a) LoadingSpinner when loading
//   b) ErrorMessage when there's an error
//   c) List of UserCards when data is loaded
// - Show a "Refresh" button to re-fetch
function UsersList() {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>Users</h2>
        <button>Refresh</button>
      </div>
      <p>No users loaded (implement UsersList)</p>
    </div>
  );
}

// TODO 13: Build a StatusBar component
// - Shows current state: idle, loading, loaded (N users), or error
// - Shows retry count if > 0
function StatusBar() {
  return (
    <div
      style={{
        padding: "8px 16px",
        backgroundColor: "#f0f0f0",
        borderRadius: "4px",
        marginBottom: "16px",
        fontSize: "14px",
      }}
    >
      Status: idle | Retries: 0
    </div>
  );
}

// TODO 14: Wrap App in Provider
export function App() {
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: "600px" }}>
      <h1>Exercise: Async Thunks</h1>
      <StatusBar />
      <UsersList />
    </div>
  );
}
