import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";

// ── Base selectors ────────────────────────────────────────────
export const selectCounterValue = (state: RootState) => state.counter.value;
export const selectLastAction   = (state: RootState) => state.counter.lastAction;

// ── Derived / memoized selectors ──────────────────────────────
// createSelector caches the result — only recomputes when value changes.
export const selectDoubleValue = createSelector(
  selectCounterValue,
  (value) => value * 2
);

export const selectIsNegative = createSelector(
  selectCounterValue,
  (value) => value < 0
);
