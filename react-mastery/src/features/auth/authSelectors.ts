import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";

// ── Base selectors (simple field reads) ───────────────────────
export const selectAuthUser   = (state: RootState) => state.auth.user;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectAuthError  = (state: RootState) => state.auth.error;

// ── Derived selectors (memoized with createSelector) ──────────
// These only recompute when their input selector result changes.

export const selectIsLoggedIn = createSelector(
  selectAuthUser,
  (user) => user !== null
);

export const selectIsLoading = createSelector(
  selectAuthStatus,
  (status) => status === "loading"
);
