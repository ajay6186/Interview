import React, { useState, useEffect } from "react";

// =============================================================
// SOLUTION 2: Data Fetching with useEffect
// =============================================================

interface User {
  id: number;
  name: string;
  email: string;
  address: { city: string };
  company: { name: string };
}

export function App() {
  // TODO 1 ✅ — four pieces of state
  const [userId, setUserId] = useState(1);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO 2 ✅ — useEffect with fetch + AbortController cleanup
  useEffect(() => {
    const controller = new AbortController(); // ← prevents stale data

    setLoading(true);
    setError(null);
    setUser(null);

    fetch(`https://jsonplaceholder.typicode.com/users/${userId}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        return res.json();
      })
      .then((data: User) => {
        setUser(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return; // Ignore cancelled requests
        setError(err.message || "Something went wrong");
        setLoading(false);
      });

    // Cleanup: cancel the fetch if userId changes before it finishes
    return () => controller.abort();
  }, [userId]); // Re-run whenever userId changes

  // TODO 3 ✅ — navigation helpers
  const prevUser = () => setUserId((id) => Math.max(1, id - 1));
  const nextUser = () => setUserId((id) => Math.min(10, id + 1));

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>User Viewer</h1>

      {/* --- NAVIGATION --- */}
      <div style={styles.nav}>
        <button style={styles.btn} disabled={userId === 1} onClick={prevUser}>
          ← Prev
        </button>
        <span style={styles.userId}>User #{userId}</span>
        <button style={styles.btn} disabled={userId === 10} onClick={nextUser}>
          Next →
        </button>
      </div>

      {/* --- STATES --- */}
      {loading && <p style={styles.loading}>Loading...</p>}

      {error && (
        <div style={styles.error}>
          <p>⚠️ {error}</p>
          <button onClick={() => setUserId(userId)}>Retry</button>
        </div>
      )}

      {!loading && !error && user && (
        <div style={styles.card}>
          <h2 style={styles.name}>{user.name}</h2>
          <p style={styles.detail}>📧 {user.email}</p>
          <p style={styles.detail}>🏙️ {user.address.city}</p>
          <p style={styles.detail}>🏢 {user.company.name}</p>
        </div>
      )}
    </div>
  );
}

// --- KEY CONCEPTS ---
// 1. useEffect dependency array: [userId] → re-runs every time userId changes
// 2. Loading state: always set loading = true at the START of a fetch
// 3. Error state: catch both network errors and non-ok HTTP responses
// 4. AbortController: cancel in-flight fetch when component re-renders
//    This prevents a slow request from overwriting a newer result
// 5. Cleanup function: return () => controller.abort()
//    React calls this before the next effect run or when component unmounts

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
