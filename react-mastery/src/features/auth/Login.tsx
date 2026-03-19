import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { login } from "./authSlice";
import { selectAuthError, selectIsLoading } from "./authSelectors";

export function Login() {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectIsLoading);
  const error     = useAppSelector(selectAuthError);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    dispatch(login({ username, password }));
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        <h1 style={styles.title}>Sign In</h1>

        <div style={styles.hint}>
          <p style={{ margin: 0, fontWeight: 600 }}>Demo credentials</p>
          <ul style={{ margin: "0.4rem 0 0", paddingLeft: "1.2rem", lineHeight: 1.8 }}>
            <li><code>admin</code> / <code>password123</code></li>
            <li><code>alice</code> / <code>alice123</code></li>
            <li><code>bob</code> / <code>bob123</code></li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              autoComplete="username"
              disabled={isLoading}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              autoComplete="current-password"
              disabled={isLoading}
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.button} type="submit" disabled={isLoading}>
            {isLoading ? "Signing in…" : "Sign In"}
          </button>
        </form>
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
    maxWidth: "400px",
  },
  title: {
    margin: "0 0 1.25rem",
    fontSize: "1.9rem",
    fontWeight: 800,
    color: "#111",
  },
  hint: {
    background: "#f5f3ff",
    border: "1px solid #e0d9ff",
    borderRadius: "8px",
    padding: "0.75rem 1rem",
    marginBottom: "1.5rem",
    fontSize: "0.85rem",
    color: "#4f46e5",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "0.3rem",
  },
  label: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#374151",
  },
  input: {
    padding: "0.65rem 0.85rem",
    borderRadius: "8px",
    border: "1.5px solid #d1d5db",
    fontSize: "1rem",
    outline: "none",
    transition: "border-color 0.2s",
  },
  error: {
    margin: 0,
    padding: "0.6rem 0.85rem",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    color: "#dc2626",
    fontSize: "0.875rem",
  },
  button: {
    marginTop: "0.25rem",
    padding: "0.75rem",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.01em",
  },
};
