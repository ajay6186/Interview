import React, { useState, useEffect } from "react";

// =============================================================
// EXERCISE 2: Data Fetching with useEffect
// =============================================================
// WHAT YOU WILL PRACTICE:
//   - useEffect for side effects (API calls)
//   - Loading state while waiting for data
//   - Error state when fetch fails
//   - Cleanup to prevent "state update on unmounted component"
//   - Re-fetching when a dependency changes
//
// GOAL: Build a User Card viewer that:
//   1. Shows a loading spinner while fetching
//   2. Shows an error message if the fetch fails
//   3. Displays user info (name, email, city, company) when loaded
//   4. Has "Prev" / "Next" buttons to load a different user (IDs 1–10)
//
// API: https://jsonplaceholder.typicode.com/users/{id}
//   Returns: { id, name, email, address: { city }, company: { name } }
// =============================================================

// --- Types (do not change) ---
interface User {
  id: number;
  name: string;
  email: string;
  address: { city: string };
  company: { name: string };
}

// =============================================================
// TODO 1: Set up state
//   - userId: number  (start at 1)
//   - user: User | null
//   - loading: boolean
//   - error: string | null
// =============================================================

// =============================================================
// TODO 2: Write a useEffect that:
//   a) Sets loading = true and clears any previous error
//   b) Fetches from `https://jsonplaceholder.typicode.com/users/${userId}`
//   c) If ok, parses JSON and sets the user
//   d) If error, sets the error message
//   e) Always sets loading = false when done
//   f) Runs whenever userId changes
//
// BONUS: Add an AbortController so the fetch is cancelled
//        if userId changes before the previous fetch finishes.
//        (This prevents stale data from showing up)
// =============================================================

// =============================================================
// TODO 3: Write prevUser() and nextUser() helpers
//   - prevUser: userId > 1  → userId - 1
//   - nextUser: userId < 10 → userId + 1
// =============================================================

export function App() {
  // TODO 1: state here

  // TODO 2: useEffect here

  // TODO 3: navigation helpers here

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>User Viewer</h1>

      {/* --- NAVIGATION --- */}
      <div style={styles.nav}>
        {/* TODO: disable Prev when userId === 1 */}
        <button style={styles.btn} /* disabled={...} onClick={prevUser} */>
          ← Prev
        </button>
        <span style={styles.userId}>User #{/* userId */}</span>
        {/* TODO: disable Next when userId === 10 */}
        <button style={styles.btn} /* disabled={...} onClick={nextUser} */>
          Next →
        </button>
      </div>

      {/* --- STATES --- */}
      {/* TODO: show a loading spinner when loading is true */}
      {/* TODO: show an error message when error is not null */}
      {/* TODO: show the user card when user is loaded */}

      {/* User Card template (use this when you have a user):
        <div style={styles.card}>
          <h2 style={styles.name}>{user.name}</h2>
          <p style={styles.detail}>📧 {user.email}</p>
          <p style={styles.detail}>🏙️ {user.address.city}</p>
          <p style={styles.detail}>🏢 {user.company.name}</p>
        </div>
      */}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 400, margin: "40px auto", fontFamily: "sans-serif", padding: "0 16px" },
  title: { textAlign: "center", fontSize: 26, marginBottom: 24 },
  nav: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  btn: { padding: "8px 18px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 },
  userId: { fontSize: 16, fontWeight: "bold", color: "#374151" },
  card: { background: "#f9fafb", borderRadius: 12, padding: "24px 28px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  name: { margin: "0 0 14px", fontSize: 22, color: "#111827" },
  detail: { margin: "6px 0", fontSize: 15, color: "#4b5563" },
  loading: { textAlign: "center", padding: 40, fontSize: 18, color: "#6b7280" },
  error: { textAlign: "center", padding: 20, color: "#ef4444", fontSize: 15 },
};
