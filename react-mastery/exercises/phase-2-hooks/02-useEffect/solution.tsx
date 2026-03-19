import React, { useState, useEffect, useRef } from "react";

// ============================================================
// Solution: useEffect Fundamentals
// ============================================================

function DocumentTitle() {
  const [count, setCount] = useState(0);

  // No dependency array = runs after EVERY render
  useEffect(() => {
    document.title = `Count: ${count}`;
  });

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h2>Document Title Sync</h2>
      <p style={{ fontSize: 24 }}>Count: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
      <p style={{ color: "#666" }}>
        Check the browser tab title — it should update on every render.
      </p>
    </div>
  );
}

function MountLogger() {
  const [count, setCount] = useState(0);

  // Empty dependency array = runs ONLY on mount, cleanup on unmount
  useEffect(() => {
    console.log("MountLogger: Component mounted!");
    return () => {
      console.log("MountLogger: Component unmounted!");
    };
  }, []);

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h2>Mount Logger</h2>
      <p>Count: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>
        Increment (won't re-log)
      </button>
      <p style={{ color: "#666" }}>
        Open the console. "Mounted" should appear once. Incrementing should NOT
        re-log.
      </p>
    </div>
  );
}

function DependencyTracker() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState("");
  const [effectLog, setEffectLog] = useState<string[]>([]);

  // Dependency on [count] — only fires when count changes, NOT when name changes
  useEffect(() => {
    const message = `Count changed to: ${count} (at ${new Date().toLocaleTimeString()})`;
    console.log(message);
    setEffectLog((prev) => [...prev, message]);
  }, [count]);

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h2>Dependency Tracker</h2>
      <p>Count: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>
        Increment (triggers effect)
      </button>
      <div style={{ marginTop: 8 }}>
        <label>
          Name:{" "}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Type here — effect won't fire"
          />
        </label>
        <p>Name: {name}</p>
      </div>
      <div
        style={{
          marginTop: 8,
          background: "#f9f9f9",
          padding: 8,
          borderRadius: 4,
          maxHeight: 150,
          overflowY: "auto",
        }}
      >
        <strong>Effect Log:</strong>
        {effectLog.length === 0 && <p style={{ color: "#999" }}>No runs yet.</p>}
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {effectLog.map((entry, i) => (
            <li key={i} style={{ fontSize: 13 }}>
              {entry}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Timer() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;

    const intervalId = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    // Cleanup: clear the interval when isRunning changes or component unmounts
    return () => {
      clearInterval(intervalId);
    };
  }, [isRunning]);

  const handleReset = () => {
    setIsRunning(false);
    setSeconds(0);
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h2>Timer with Cleanup</h2>
      <p style={{ fontSize: 48, fontFamily: "monospace", margin: "8px 0" }}>
        {String(Math.floor(seconds / 60)).padStart(2, "0")}:
        {String(seconds % 60).padStart(2, "0")}
      </p>
      <button onClick={() => setIsRunning((r) => !r)}>
        {isRunning ? "Stop" : "Start"}
      </button>{" "}
      <button onClick={handleReset}>Reset</button>
    </div>
  );
}

interface FetchState {
  data: string | null;
  loading: boolean;
  error: string | null;
}

function DataFetcher() {
  const [query, setQuery] = useState("user-1");
  const [fetchState, setFetchState] = useState<FetchState>({
    data: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!query.trim()) {
      setFetchState({ data: null, loading: false, error: null });
      return;
    }

    setFetchState({ data: null, loading: true, error: null });

    const timeoutId = setTimeout(() => {
      if (query.toLowerCase() === "error") {
        setFetchState({
          data: null,
          loading: false,
          error: "Failed to fetch data",
        });
      } else {
        setFetchState({
          data: `Result for '${query}': { id: 42, name: "Mock Data", query: "${query}" }`,
          loading: false,
          error: null,
        });
      }
    }, 1500);

    // Cleanup: cancel the timeout if query changes before it resolves
    return () => {
      clearTimeout(timeoutId);
    };
  }, [query]);

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h2>Data Fetcher (Simulated)</h2>
      <label>
        Query:{" "}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ padding: 8, fontSize: 16 }}
        />
      </label>

      <div style={{ marginTop: 12, minHeight: 40 }}>
        {fetchState.loading && (
          <p style={{ color: "blue" }}>Loading...</p>
        )}
        {fetchState.error && (
          <p style={{ color: "red", fontWeight: "bold" }}>
            Error: {fetchState.error}
          </p>
        )}
        {fetchState.data && (
          <pre
            style={{
              background: "#f0f0f0",
              padding: 12,
              borderRadius: 4,
              whiteSpace: "pre-wrap",
            }}
          >
            {fetchState.data}
          </pre>
        )}
      </div>

      <p style={{ color: "#666" }}>
        Try typing "error" to simulate a failed request.
      </p>
    </div>
  );
}

export function App() {
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Exercise: useEffect Fundamentals</h1>
      <DocumentTitle />
      <MountLogger />
      <DependencyTracker />
      <Timer />
      <DataFetcher />
    </div>
  );
}
