import React, { useState, useEffect, useRef, useCallback } from "react";

// =============================================================
// EXERCISE 7: Build 3 Custom Hooks
// =============================================================
// WHAT YOU WILL PRACTICE:
//   - Extracting reusable logic into custom hooks
//   - Custom hooks can use other hooks (useState, useEffect, useRef)
//   - Custom hooks follow the "use" naming convention
//   - Each hook is just a function — test it independently
//
// BUILD THESE 3 HOOKS:
//   1. useLocalStorage<T>(key, initialValue)
//      → Syncs state with localStorage automatically
//
//   2. useDebounce<T>(value, delay)
//      → Returns a debounced version of a value
//        (waits until the user stops typing for `delay` ms)
//
//   3. useWindowSize()
//      → Returns { width, height } and updates on resize
// =============================================================

// =============================================================
// HOOK 1: useLocalStorage<T>(key: string, initialValue: T)
// =============================================================
// Returns: [storedValue, setValue]  (same API as useState)
//
// HOW IT WORKS:
//   - On init: try to read from localStorage.getItem(key)
//              if found, JSON.parse it; otherwise use initialValue
//   - setValue: update state AND write to localStorage (JSON.stringify)
//
// TODO:
//   a) Initialize state by reading from localStorage (inside useState initializer fn)
//   b) Return [storedValue, setValue] where setValue also calls localStorage.setItem
//
// HINT: Use the lazy initializer form of useState:
//   const [state, setState] = useState(() => {
//     try {
//       const item = window.localStorage.getItem(key);
//       return item ? JSON.parse(item) : initialValue;
//     } catch { return initialValue; }
//   });
// =============================================================
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // TODO: implement useLocalStorage here
  throw new Error("Not implemented");
}

// =============================================================
// HOOK 2: useDebounce<T>(value: T, delay: number): T
// =============================================================
// Returns: the debounced value (only updates after `delay` ms of no changes)
//
// HOW IT WORKS:
//   - Store a debouncedValue in state (starts as value)
//   - useEffect: set a timeout to update debouncedValue after `delay` ms
//   - Cleanup: clear the timeout if value or delay changes
//     (this is the key — clearing the timeout resets the countdown)
//
// COMMON USE CASE: search input — don't fire API calls on every keystroke
//
// TODO:
//   a) Create state for debouncedValue
//   b) useEffect with setTimeout that updates debouncedValue
//   c) Return cleanup that calls clearTimeout
//   d) Dependency array: [value, delay]
// =============================================================
function useDebounce<T>(value: T, delay: number): T {
  // TODO: implement useDebounce here
  throw new Error("Not implemented");
}

// =============================================================
// HOOK 3: useWindowSize(): { width: number; height: number }
// =============================================================
// Returns: current window dimensions, updated on resize
//
// HOW IT WORKS:
//   - State: { width: window.innerWidth, height: window.innerHeight }
//   - useEffect: add a resize event listener
//   - On resize: update state with new window dimensions
//   - Cleanup: remove the event listener
//
// TODO:
//   a) Create state initialized to { width: window.innerWidth, height: window.innerHeight }
//   b) useEffect: addEventListener("resize", handler)
//   c) Cleanup: removeEventListener
//   d) Dependency array: []  (only run once)
// =============================================================
function useWindowSize(): { width: number; height: number } {
  // TODO: implement useWindowSize here
  throw new Error("Not implemented");
}

// =============================================================
// Demo App — tests all 3 hooks (do not modify)
// =============================================================
export function App() {
  // --- Test useLocalStorage ---
  const [name, setName] = useLocalStorage("user-name", "");

  // --- Test useDebounce ---
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

  // --- Test useWindowSize ---
  const { width, height } = useWindowSize();

  return (
    <div style={{ maxWidth: 600, margin: "32px auto", fontFamily: "sans-serif", padding: "0 16px" }}>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Custom Hooks Demo</h1>

      {/* Hook 1: useLocalStorage */}
      <section style={styles.section}>
        <h2 style={styles.hookTitle}>Hook 1: useLocalStorage</h2>
        <p style={styles.desc}>
          Type your name — it will persist across page refreshes.
        </p>
        <input
          style={styles.input}
          type="text"
          placeholder="Your name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {name && <p style={styles.result}>Stored: <strong>{name}</strong></p>}
      </section>

      {/* Hook 2: useDebounce */}
      <section style={styles.section}>
        <h2 style={styles.hookTitle}>Hook 2: useDebounce (500ms)</h2>
        <p style={styles.desc}>
          Type quickly — the search only fires 500ms after you stop typing.
        </p>
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

      {/* Hook 3: useWindowSize */}
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

const styles: Record<string, React.CSSProperties> = {
  section: { background: "#f9fafb", borderRadius: 10, padding: "20px", marginBottom: 20, border: "1px solid #e5e7eb" },
  hookTitle: { margin: "0 0 6px", fontSize: 17, color: "#111827" },
  desc: { margin: "0 0 12px", fontSize: 14, color: "#6b7280" },
  input: { width: "100%", padding: "9px 14px", fontSize: 15, borderRadius: 8, border: "1px solid #d1d5db", boxSizing: "border-box" },
  result: { margin: "8px 0 0", fontSize: 14, color: "#374151" },
  log: { marginTop: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "10px 14px" },
  sizeDisplay: { display: "flex", gap: 24, fontSize: 15, color: "#374151" },
};
