import React, { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// Solution: API Integration
// ============================================================
// A complete data-fetching UI using a custom useFetch hook with
// loading/error/data states, race condition handling via
// AbortController, retry, and refresh capabilities.
// ============================================================

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

const FAKE_USERS: User[] = [
  { id: 1, name: "Alice Johnson", email: "alice@example.com", role: "Admin" },
  { id: 2, name: "Bob Smith", email: "bob@example.com", role: "Editor" },
  { id: 3, name: "Carol Williams", email: "carol@example.com", role: "Viewer" },
  { id: 4, name: "Dave Brown", email: "dave@example.com", role: "Editor" },
  { id: 5, name: "Eve Davis", email: "eve@example.com", role: "Admin" },
  { id: 6, name: "Frank Miller", email: "frank@example.com", role: "Viewer" },
  { id: 7, name: "Grace Lee", email: "grace@example.com", role: "Editor" },
  { id: 8, name: "Hank Wilson", email: "hank@example.com", role: "Viewer" },
];

// 1. Fake API call with abort support
function fakeApiCall(shouldFail = false, signal?: AbortSignal): Promise<User[]> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      if (shouldFail) {
        reject(new Error("Network error: Failed to fetch users"));
      } else {
        resolve(FAKE_USERS);
      }
    }, 1500);

    // Handle abort signal for race condition prevention
    if (signal) {
      signal.addEventListener("abort", () => {
        clearTimeout(timeoutId);
        reject(new Error("Aborted"));
      });
    }
  });
}

// 2. Custom useFetch hook with race condition handling
function useFetch(url: string, shouldFail = false) {
  const [data, setData] = useState<User[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchCount, setFetchCount] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(() => {
    // Abort any in-flight request to prevent race conditions
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    setFetchCount((c) => c + 1);

    fakeApiCall(shouldFail, controller.signal)
      .then((users) => {
        // Only update state if this request was not aborted
        if (!controller.signal.aborted) {
          setData(users);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        // Ignore abort errors — they are intentional
        if (err.message !== "Aborted") {
          setError(err.message);
          setLoading(false);
        }
      });
  }, [url, shouldFail]);

  useEffect(() => {
    fetchData();
    return () => {
      // Cleanup: abort on unmount or dependency change
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData, fetchCount };
}

// 3. Loading spinner
function LoadingSpinner() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px",
        color: "#666",
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          border: "4px solid #e0e0e0",
          borderTop: "4px solid #3b82f6",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
      <p style={{ marginTop: "12px" }}>Fetching data...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// 4. Error display with retry
function ErrorDisplay({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#fef2f2",
        border: "1px solid #fca5a5",
        borderRadius: "8px",
        textAlign: "center",
      }}
    >
      <p style={{ color: "#dc2626", fontWeight: "bold", margin: "0 0 8px 0" }}>
        Error
      </p>
      <p style={{ color: "#991b1b", margin: "0 0 16px 0" }}>{message}</p>
      <button
        onClick={onRetry}
        style={{
          padding: "8px 20px",
          backgroundColor: "#dc2626",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "14px",
        }}
      >
        Retry
      </button>
    </div>
  );
}

// 5. User list display
function UserList({ users }: { users: User[] }) {
  return (
    <div style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid #e0e0e0" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 2fr 1fr",
          padding: "12px 16px",
          backgroundColor: "#f1f5f9",
          fontWeight: "bold",
          fontSize: "14px",
          color: "#475569",
        }}
      >
        <span>Name</span>
        <span>Email</span>
        <span>Role</span>
      </div>
      {users.map((user, index) => (
        <div
          key={user.id}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr 1fr",
            padding: "10px 16px",
            backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8fafc",
            borderTop: "1px solid #e0e0e0",
            fontSize: "14px",
          }}
        >
          <span style={{ fontWeight: 500 }}>{user.name}</span>
          <span style={{ color: "#3b82f6" }}>{user.email}</span>
          <span>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: "12px",
                fontSize: "12px",
                backgroundColor:
                  user.role === "Admin"
                    ? "#dbeafe"
                    : user.role === "Editor"
                    ? "#dcfce7"
                    : "#f3e8ff",
                color:
                  user.role === "Admin"
                    ? "#1e40af"
                    : user.role === "Editor"
                    ? "#166534"
                    : "#6b21a8",
              }}
            >
              {user.role}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

// 6. Simulate error toggle
function SimulateErrorToggle({
  simulateError,
  onToggle,
}: {
  simulateError: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "14px",
        color: "#666",
        cursor: "pointer",
      }}
    >
      <input type="checkbox" checked={simulateError} onChange={onToggle} />
      Simulate network error on next fetch
    </label>
  );
}

// 7. App wiring everything together
export function App() {
  const [simulateError, setSimulateError] = useState(false);
  const { data, loading, error, refetch, fetchCount } = useFetch(
    "/api/users",
    simulateError
  );

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: "800px" }}>
      <h1>Exercise: API Integration</h1>
      <p style={{ color: "#666", marginBottom: "20px" }}>
        A custom <code>useFetch</code> hook with loading, error, retry, and race condition
        handling.
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            onClick={refetch}
            disabled={loading}
            style={{
              padding: "8px 20px",
              backgroundColor: loading ? "#94a3b8" : "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "14px",
            }}
          >
            {loading ? "Fetching..." : "Refresh"}
          </button>
          <span style={{ fontSize: "13px", color: "#888" }}>
            Fetch count: {fetchCount}
          </span>
        </div>
        <SimulateErrorToggle
          simulateError={simulateError}
          onToggle={() => setSimulateError((s) => !s)}
        />
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorDisplay message={error} onRetry={refetch} />}
      {!loading && !error && data && <UserList users={data} />}
    </div>
  );
}
