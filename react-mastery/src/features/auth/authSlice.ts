import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fakeLogin, fakeLogout, type User } from "../../api/fakeAuth";

// ── State shape ──────────────────────────────────────────────
type AuthState = {
  user: User | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
};

const initialState: AuthState = {
  user: null,
  status: "idle",
  error: null,
};

// ── Async thunks ─────────────────────────────────────────────
// createAsyncThunk auto-dispatches:
//   auth/login/pending   → while the promise is running
//   auth/login/fulfilled → when it resolves
//   auth/login/rejected  → when it throws

export const login = createAsyncThunk(
  "auth/login",
  async (
    credentials: { username: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      return await fakeLogin(credentials.username, credentials.password);
    } catch (err) {
      // rejectWithValue puts the error into action.payload (not action.error)
      return rejectWithValue((err as Error).message);
    }
  }
);

export const logout = createAsyncThunk("auth/logout", async () => {
  await fakeLogout();
});

// ── Slice ─────────────────────────────────────────────────────
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // synchronous reducers go here (none needed for auth)
  },
  extraReducers: (builder) => {
    builder
      // login lifecycle
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      // logout lifecycle
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.status = "idle";
        state.error = null;
      });
  },
});

export default authSlice.reducer;
