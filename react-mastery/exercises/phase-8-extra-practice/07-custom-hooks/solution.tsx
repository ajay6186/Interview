import React, { useState, useEffect, useRef } from "react";

// =============================================================
// SOLUTION 7: 3 Custom Hooks
// =============================================================

// =============================================================
// HOOK 1 ✅: useLocalStorage
// =============================================================
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // Lazy initializer — runs once on mount
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // setValue updates both React state AND localStorage
  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      console.error("useLocalStorage: failed to save value");
    }
  };

  return [storedValue, setValue];
}

// =============================================================
// HOOK 2 ✅: useDebounce
// =============================================================
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set a timeout to update debouncedValue after `delay` ms
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: if value changes before the timeout fires, reset the clock
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// =============================================================
// HOOK 3 ✅: useWindowSize
// =============================================================
function useWindowSize(): { width: number; height: number } {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener("resize", handleResize);

    // Cleanup: remove listener when component unmounts
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array: only register the listener once

  return size;
}

// =============================================================
// Demo App
// =============================================================
export function App() {
  const [name, setName] = useLocalStorage("user-name", "");

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);
  const [searchLog, setSearchLog] = useState<string[]>([]);
  const prevDebounced = useRef("");

  useEffect(() => {
    if (debouncedSearch !== prevDebounced.current) {
      prevDebounced.current = debouncedSearch;
      if (debouncedSearch) {
        setSearchLog((prev) => [`Searched: "${debouncedSearch}"`, ...prev.slice(0, 4)]);
      }
    }
  }, [debouncedSearch]);

  const { width, height } = useWindowSize();

  return (
    <div style={{ maxWidth: 600, margin: "32px auto", fontFamily: "sans-serif", padding: "0 16px" }}>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Custom Hooks Demo</h1>

      <section style={styles.section}>
        <h2 style={styles.hookTitle}>Hook 1: useLocalStorage</h2>
        <p style={styles.desc}>Type your name — it will persist across page refreshes.</p>
        <input
          style={styles.input}
          type="text"
          placeholder="Your name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {name && <p style={styles.result}>Stored: <strong>{name}</strong></p>}
      </section>

      <section style={styles.section}>
        <h2 style={styles.hookTitle}>Hook 2: useDebounce (500ms)</h2>
        <p style={styles.desc}>Type quickly — the search only fires 500ms after you stop typing.</p>
        <input
          style={styles.input}
          type="text"
          placeholder="Type to search..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <p style={styles.result}>Raw value: <strong>{searchInput}</strong></p>
        <p style={styles.result}>Debounced: <strong>{debouncedSearch}</strong></p>
        {searchLog.length > 0 && (
          <div style={styles.log}>
            <p style={{ margin: "0 0 4px", fontSize: 12, color: "#6b7280" }}>Search history:</p>
            {searchLog.map((entry, i) => <p key={i} style={{ margin: "2px 0", fontSize: 13 }}>{entry}</p>)}
          </div>
        )}
      </section>

      <section style={styles.section}>
        <h2 style={styles.hookTitle}>Hook 3: useWindowSize</h2>
        <p style={styles.desc}>Try resizing the browser window.</p>
        <div style={styles.sizeDisplay}>
          <span>Width: <strong>{width}px</strong></span>
          <span>Height: <strong>{height}px</strong></span>
          <span style={{ color: width < 600 ? "#ef4444" : "#22c55e" }}>
            {width < 600 ? "Mobile" : width < 1024 ? "Tablet" : "Desktop"}
          </span>
        </div>
      </section>
    </div>
  );
}

// --- KEY CONCEPTS ---
// 1. Custom hooks start with "use" and can call other hooks
//
// 2. useLocalStorage — lazy useState initializer:
//    useState(() => expensiveComputation())
//    The function only runs ONCE on mount, not on every render
//
// 3. useDebounce — the cleanup is the key insight:
//    Every time `value` changes, the old timeout is cleared and a new one starts
//    The value only updates when the timeout fires without being cleared
//
// 4. useWindowSize — addEventListener + removeEventListener pattern:
//    Always remove event listeners in cleanup to prevent memory leaks
//
// 5. Custom hooks SHARE LOGIC, not state:
//    Two components calling useWindowSize() each get their OWN state
//    (but they'll both be updated by the same resize event)

const styles: Record<string, React.CSSProperties> = {
  section: { background: "#f9fafb", borderRadius: 10, padding: "20px", marginBottom: 20, border: "1px solid #e5e7eb" },
  hookTitle: { margin: "0 0 6px", fontSize: 17, color: "#111827" },
  desc: { margin: "0 0 12px", fontSize: 14, color: "#6b7280" },
  input: { width: "100%", padding: "9px 14px", fontSize: 15, borderRadius: 8, border: "1px solid #d1d5db", boxSizing: "border-box" },
  result: { margin: "8px 0 0", fontSize: 14, color: "#374151" },
  log: { marginTop: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "10px 14px" },
  sizeDisplay: { display: "flex", gap: 24, fontSize: 15, color: "#374151" },
};
