import React from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { increment, decrement, reset, incrementByAmount } from "./counterSlice";
import {
  selectCounterValue,
  selectLastAction,
  selectDoubleValue,
  selectIsNegative,
} from "./counterSelectors";
import { selectAuthUser } from "../auth/authSelectors";
import { logout } from "../auth/authSlice";

export function Counter() {
  const dispatch     = useAppDispatch();
  const value        = useAppSelector(selectCounterValue);
  const lastAction   = useAppSelector(selectLastAction);
  const doubleValue  = useAppSelector(selectDoubleValue);
  const isNegative   = useAppSelector(selectIsNegative);
  const user         = useAppSelector(selectAuthUser);

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Header: user info + logout */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Counter</h1>
            <p style={styles.welcome}>
              Logged in as <strong>{user?.username}</strong>
              <span style={{ color: "#888", fontWeight: 400 }}> · {user?.email}</span>
            </p>
          </div>
          <button style={styles.logoutBtn} onClick={() => dispatch(logout())}>
            Logout
          </button>
        </div>

        {/* Value display */}
        <div style={styles.valueBox}>
          <span
            style={{
              ...styles.value,
              color: isNegative ? "#dc2626" : "#4f46e5",
            }}
          >
            {value}
          </span>
          <span style={styles.derived}>× 2 = {doubleValue}</span>
        </div>

        {/* Last action badge */}
        <p style={styles.lastAction}>
          Last action: <code style={styles.code}>{lastAction}</code>
        </p>

        {/* Buttons */}
        <div style={styles.buttons}>
          <button style={styles.btn} onClick={() => dispatch(decrement())}>−1</button>
          <button style={{ ...styles.btn, background: "#6b7280" }} onClick={() => dispatch(reset())}>
            Reset
          </button>
          <button style={styles.btn} onClick={() => dispatch(increment())}>+1</button>
          <button style={{ ...styles.btn, background: "#7c3aed" }} onClick={() => dispatch(incrementByAmount(5))}>
            +5
          </button>
        </div>

      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "#f0f2f5",
    fontFamily: "system-ui, sans-serif",
  },
  card: {
    background: "#fff",
    padding: "2.5rem",
    borderRadius: "12px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: "440px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1.75rem",
  },
  title: {
    margin: 0,
    fontSize: "1.9rem",
    fontWeight: 800,
    color: "#111",
  },
  welcome: {
    margin: "0.3rem 0 0",
    fontSize: "0.875rem",
    color: "#374151",
  },
  logoutBtn: {
    padding: "0.4rem 0.9rem",
    background: "transparent",
    border: "1.5px solid #d1d5db",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.875rem",
    color: "#374151",
    fontWeight: 500,
  },
  valueBox: {
    textAlign: "center",
    marginBottom: "0.75rem",
  },
  value: {
    display: "block",
    fontSize: "6rem",
    fontWeight: 900,
    lineHeight: 1,
    transition: "color 0.2s",
  },
  derived: {
    display: "block",
    marginTop: "0.4rem",
    fontSize: "1rem",
    color: "#9ca3af",
  },
  lastAction: {
    textAlign: "center",
    fontSize: "0.875rem",
    color: "#6b7280",
    marginBottom: "1.75rem",
  },
  code: {
    background: "#f3f4f6",
    padding: "0.1rem 0.4rem",
    borderRadius: "4px",
    fontSize: "0.85rem",
  },
  buttons: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "0.6rem",
  },
  btn: {
    padding: "0.75rem",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: 700,
    cursor: "pointer",
  },
};
