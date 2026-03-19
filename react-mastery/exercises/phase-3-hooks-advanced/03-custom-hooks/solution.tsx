import React, { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// Solution: Custom Hooks — Reusable Stateful Logic
// ============================================================

// -------------------------------------------------------
// Hook 1: useLocalStorage
// -------------------------------------------------------
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Write to localStorage whenever the value changes
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch {
      // Storage full or blocked — silently ignore
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

// -------------------------------------------------------
// Hook 2: useFetch (simulated with setTimeout)
// -------------------------------------------------------
interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useFetch<T = unknown>(url: string): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    setState({ data: null, loading: true, error: null });

    // Simulate a network request with a 1-second delay
    const timeoutId = setTimeout(() => {
      if (url.includes("error")) {
        setState({ data: null, loading: false, error: `Failed to fetch: ${url}` });
      } else {
        // Fake response data
        const fakeData = {
          id: 1,
          name: `Response from ${url}`,
          timestamp: new Date().toISOString(),
        } as unknown as T;
        setState({ data: fakeData, loading: false, error: null });
      }
    }, 1000);

    // Cleanup: cancel if url changes before timeout fires
    return () => clearTimeout(timeoutId);
  }, [url]);

  return state;
}

// -------------------------------------------------------
// Hook 3: useDebounce
// -------------------------------------------------------
function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}

// -------------------------------------------------------
// Hook 4: useToggle
// -------------------------------------------------------
function useToggle(
  initialValue: boolean = false
): [boolean, () => void, (v: boolean) => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => setValue((v) => !v), []);
  const setDirectly = useCallback((v: boolean) => setValue(v), []);

  return [value, toggle, setDirectly];
}

// -------------------------------------------------------
// Hook 5: useWindowSize
// -------------------------------------------------------
function useWindowSize(): { width: number; height: number } {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    function handleResize() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return size;
}

// -------------------------------------------------------
// Demo Components
// -------------------------------------------------------

function LocalStorageDemo() {
  const [username, setUsername] = useLocalStorage<string>("demo-username", "");
  const [mounted, setMounted] = useState(true);

  return (
    <section style={{ padding: 16, marginBottom: 16, border: "1px solid #ddd" }}>
      <h2>useLocalStorage</h2>
      {mounted ? (
        <div>
          <label>
            Username:{" "}
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Type a name..."
              style={{ padding: 4 }}
            />
          </label>
          <p>
            Stored value: <strong>{username || "(empty)"}</strong>
          </p>
        </div>
      ) : (
        <p style={{ color: "#888" }}>(component unmounted)</p>
      )}
      <button onClick={() => setMounted((m) => !m)}>
        {mounted ? "Unmount" : "Remount"} — value persists!
      </button>
    </section>
  );
}

function FetchDemo() {
  const [url, setUrl] = useState("/api/users");
  const { data, loading, error } = useFetch<{ id: number; name: string; timestamp: string }>(url);

  return (
    <section style={{ padding: 16, marginBottom: 16, border: "1px solid #ddd" }}>
      <h2>useFetch</h2>
      <div>
        <button onClick={() => setUrl("/api/users")}>Fetch Users</button>
        <button onClick={() => setUrl("/api/posts")}>Fetch Posts</button>
        <button onClick={() => setUrl("/api/error")}>Simulate Error</button>
      </div>
      <p>URL: {url}</p>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {data && (
        <pre style={{ background: "#f5f5f5", padding: 8 }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </section>
  );
}

function DebounceDemo() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);

  return (
    <section style={{ padding: 16, marginBottom: 16, border: "1px solid #ddd" }}>
      <h2>useDebounce</h2>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type quickly..."
        style={{ padding: 4, width: 300 }}
      />
      <p>
        Raw value: <strong>{query}</strong>
      </p>
      <p>
        Debounced (500ms): <strong>{debouncedQuery}</strong>
      </p>
      <p style={{ fontSize: 12, color: "#888" }}>
        The debounced value updates 500ms after you stop typing.
      </p>
    </section>
  );
}

function ToggleDemo() {
  const [darkMode, toggleDark, setDarkMode] = useToggle(false);

  return (
    <section
      style={{
        padding: 16,
        marginBottom: 16,
        border: "1px solid #ddd",
        background: darkMode ? "#222" : "#fff",
        color: darkMode ? "#eee" : "#000",
      }}
    >
      <h2>useToggle</h2>
      <p>Dark mode: {darkMode ? "ON" : "OFF"}</p>
      <button onClick={toggleDark}>Toggle</button>
      <button onClick={() => setDarkMode(true)}>Force ON</button>
      <button onClick={() => setDarkMode(false)}>Force OFF</button>
    </section>
  );
}

function WindowSizeDemo() {
  const { width, height } = useWindowSize();

  return (
    <section style={{ padding: 16, marginBottom: 16, border: "1px solid #ddd" }}>
      <h2>useWindowSize</h2>
      <p>
        Window: <strong>{width}</strong> x <strong>{height}</strong>
      </p>
      <p style={{ fontSize: 12, color: "#888" }}>
        Resize the browser window to see values update in real-time.
      </p>
    </section>
  );
}

// -------------------------------------------------------
// App — uses all five custom hooks via demo components
// -------------------------------------------------------
export function App() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: 16 }}>
      <h1>Solution: Custom Hooks</h1>
      <LocalStorageDemo />
      <FetchDemo />
      <DebounceDemo />
      <ToggleDemo />
      <WindowSizeDemo />
    </div>
  );
}
