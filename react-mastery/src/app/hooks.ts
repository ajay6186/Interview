// ============================================================
// Typed hooks — use these everywhere instead of the raw
// useDispatch / useSelector so you never need to pass
// RootState or AppDispatch as generics in components.
// ============================================================
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./store";

export const useAppDispatch = () => useDispatch<AppDispatch>();

export const useAppSelector = <T>(selector: (state: RootState) => T): T =>
  useSelector(selector);
