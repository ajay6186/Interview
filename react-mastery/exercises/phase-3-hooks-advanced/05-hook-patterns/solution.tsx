import React, {
  useState,
  useEffect,
  useReducer,
  useContext,
  useCallback,
  useRef,
  createContext,
} from "react";

// ============================================================
// Solution: Hook Patterns — Composition & Best Practices
// ============================================================

// ============================================================
// SECTION 1: Rules of Hooks (comments only — see exercise.tsx)
// ============================================================
// See the exercise file for the "what NOT to do" examples.
// The key takeaways:
//   - Hooks must be called in the SAME ORDER every render
//   - Never put hooks inside conditions, loops, or after returns
//   - Only call hooks from React components or custom hooks

// ============================================================
// SECTION 2: useState + useEffect Data Fetching Pattern
// ============================================================

function DataFetcher({ url }: { url: string }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setData(null);

    const timeoutId = setTimeout(() => {
      if (url.includes("error")) {
        setError(`Failed to fetch: ${url}`);
        setLoading(false);
      } else {
        setData({ url, fetchedAt: new Date().toISOString() });
        setLoading(false);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [url]);

  return (
    <div style={{ padding: 8, margin: 8, background: "#f9f9f9", borderRadius: 4 }}>
      <p>
        Fetching: <code>{url}</code>
      </p>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {data && (
        <pre style={{ background: "#eee", padding: 8 }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

function DataFetcherDemo() {
  const [url, setUrl] = useState("/api/users");

  return (
    <section style={{ padding: 16, marginBottom: 16, border: "1px solid #ddd" }}>
      <h2>1. useState + useEffect Data Fetching</h2>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setUrl("/api/users")}>Users</button>
        <button onClick={() => setUrl("/api/posts")}>Posts</button>
        <button onClick={() => setUrl("/api/error")}>Trigger Error</button>
      </div>
      <DataFetcher url={url} />
    </section>
  );
}

// ============================================================
// SECTION 3: useReducer + useContext for Global State
// ============================================================

interface AppState {
  user: string | null;
  notifications: string[];
  theme: "light" | "dark";
}

type AppAction =
  | { type: "SET_USER"; payload: string }
  | { type: "LOGOUT" }
  | { type: "ADD_NOTIFICATION"; payload: string }
  | { type: "CLEAR_NOTIFICATIONS" }
  | { type: "TOGGLE_THEME" };

const initialState: AppState = {
  user: null,
  notifications: [],
  theme: "light",
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload };
    case "LOGOUT":
      return { ...state, user: null };
    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };
    case "CLEAR_NOTIFICATIONS":
      return { ...state, notifications: [] };
    case "TOGGLE_THEME":
      return {
        ...state,
        theme: state.theme === "light" ? "dark" : "light",
      };
    default:
      return state;
  }
}

const AppStateContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
}

function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
}

function UserPanel() {
  const { state, dispatch } = useAppState();
  const [name, setName] = useState("");

  return (
    <div style={{ padding: 8, marginBottom: 8, border: "1px solid #ccc" }}>
      <h3>User Panel</h3>
      {state.user ? (
        <>
          <p>
            Logged in as: <strong>{state.user}</strong>
          </p>
          <button onClick={() => dispatch({ type: "LOGOUT" })}>Logout</button>
        </>
      ) : (
        <>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter username"
            style={{ padding: 4, marginRight: 8 }}
          />
          <button
            onClick={() => {
              if (name.trim()) {
                dispatch({ type: "SET_USER", payload: name.trim() });
                setName("");
              }
            }}
          >
            Login
          </button>
        </>
      )}
    </div>
  );
}

function NotificationPanel() {
  const { state, dispatch } = useAppState();

  return (
    <div style={{ padding: 8, marginBottom: 8, border: "1px solid #ccc" }}>
      <h3>Notifications ({state.notifications.length})</h3>
      {state.notifications.length === 0 ? (
        <p style={{ color: "#888" }}>No notifications</p>
      ) : (
        <ul>
          {state.notifications.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      )}
      <button
        onClick={() =>
          dispatch({
            type: "ADD_NOTIFICATION",
            payload: `Alert at ${new Date().toLocaleTimeString()}`,
          })
        }
      >
        Add Notification
      </button>
      <button
        onClick={() => dispatch({ type: "CLEAR_NOTIFICATIONS" })}
        style={{ marginLeft: 8 }}
      >
        Clear All
      </button>
    </div>
  );
}

function ThemeToggle() {
  const { state, dispatch } = useAppState();

  return (
    <div style={{ padding: 8, marginBottom: 8, border: "1px solid #ccc" }}>
      <h3>Theme</h3>
      <p>
        Current: <strong>{state.theme}</strong>
      </p>
      <button onClick={() => dispatch({ type: "TOGGLE_THEME" })}>
        Toggle Theme
      </button>
    </div>
  );
}

function GlobalStateDemo() {
  return (
    <section style={{ padding: 16, marginBottom: 16, border: "1px solid #ddd" }}>
      <h2>2. useReducer + useContext Global State</h2>
      <AppStateProvider>
        <GlobalStateContent />
      </AppStateProvider>
    </section>
  );
}

function GlobalStateContent() {
  const { state } = useAppState();
  return (
    <div
      style={{
        background: state.theme === "dark" ? "#333" : "#fff",
        color: state.theme === "dark" ? "#eee" : "#000",
        padding: 12,
        borderRadius: 4,
      }}
    >
      <UserPanel />
      <NotificationPanel />
      <ThemeToggle />
    </div>
  );
}

// ============================================================
// SECTION 4: useAsync — Composing Hooks
// ============================================================

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

function useAsync<T>(
  asyncFn: () => Promise<T>,
  deps: React.DependencyList
): AsyncState<T> & { refetch: () => void } {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  // Keep a ref to a "trigger" counter so refetch can re-run the effect
  const [trigger, setTrigger] = useState(0);

  // Store asyncFn in a ref to avoid re-running when the function
  // reference changes (callers typically pass inline arrow functions)
  const fnRef = useRef(asyncFn);
  fnRef.current = asyncFn;

  useEffect(() => {
    let cancelled = false;
    setState({ data: null, loading: true, error: null });

    fnRef
      .current()
      .then((data) => {
        if (!cancelled) {
          setState({ data, loading: false, error: null });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err : new Error(String(err)),
          });
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, ...deps]);

  const refetch = useCallback(() => setTrigger((t) => t + 1), []);

  return { ...state, refetch };
}

function AsyncDemo() {
  const [shouldError, setShouldError] = useState(false);

  const { data, loading, error, refetch } = useAsync<{
    id: number;
    message: string;
  }>(() => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (shouldError) {
          reject(new Error("Simulated async error!"));
        } else {
          resolve({
            id: Math.floor(Math.random() * 1000),
            message: `Fetched at ${new Date().toLocaleTimeString()}`,
          });
        }
      }, 1000);
    });
  }, [shouldError]);

  return (
    <section style={{ padding: 16, marginBottom: 16, border: "1px solid #ddd" }}>
      <h2>3. useAsync (composed hook)</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button onClick={refetch}>Refetch</button>
        <label>
          <input
            type="checkbox"
            checked={shouldError}
            onChange={(e) => setShouldError(e.target.checked)}
          />
          Simulate error
        </label>
      </div>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}
      {data && (
        <pre style={{ background: "#f5f5f5", padding: 8 }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </section>
  );
}

// ============================================================
// SECTION 5: Hook Factory Pattern
// ============================================================

function createResourceHook(baseUrl: string) {
  // Returns a custom hook that fetches a resource by ID
  return function useResource(id: string) {
    return useAsync<{ id: string; url: string; data: string }>(() => {
      const fullUrl = `${baseUrl}/${id}`;
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (id === "0" || id === "") {
            reject(new Error(`Invalid ID: "${id}"`));
          } else {
            resolve({
              id,
              url: fullUrl,
              data: `Resource data for ${fullUrl} (fetched at ${new Date().toLocaleTimeString()})`,
            });
          }
        }, 800);
      });
    }, [id]);
  };
}

// Create two resource hooks using the factory
const useUser = createResourceHook("/api/users");
const usePost = createResourceHook("/api/posts");

function UserResource({ userId }: { userId: string }) {
  const { data, loading, error, refetch } = useUser(userId);

  return (
    <div style={{ padding: 8, margin: 4, background: "#f0f8ff", borderRadius: 4 }}>
      <h4>User Resource (ID: {userId})</h4>
      {loading && <p>Loading user...</p>}
      {error && <p style={{ color: "red" }}>{error.message}</p>}
      {data && <pre style={{ fontSize: 12 }}>{JSON.stringify(data, null, 2)}</pre>}
      <button onClick={refetch}>Refetch</button>
    </div>
  );
}

function PostResource({ postId }: { postId: string }) {
  const { data, loading, error, refetch } = usePost(postId);

  return (
    <div style={{ padding: 8, margin: 4, background: "#fff0f5", borderRadius: 4 }}>
      <h4>Post Resource (ID: {postId})</h4>
      {loading && <p>Loading post...</p>}
      {error && <p style={{ color: "red" }}>{error.message}</p>}
      {data && <pre style={{ fontSize: 12 }}>{JSON.stringify(data, null, 2)}</pre>}
      <button onClick={refetch}>Refetch</button>
    </div>
  );
}

function FactoryDemo() {
  const [userId, setUserId] = useState("42");
  const [postId, setPostId] = useState("7");

  return (
    <section style={{ padding: 16, marginBottom: 16, border: "1px solid #ddd" }}>
      <h2>4. Hook Factory Pattern</h2>
      <p style={{ fontSize: 12, color: "#888" }}>
        <code>createResourceHook(baseUrl)</code> returns a reusable hook.
        Each hook instance independently fetches its resource.
      </p>
      <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
        <label>
          User ID:{" "}
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={{ width: 60, padding: 4 }}
          />
        </label>
        <label>
          Post ID:{" "}
          <input
            value={postId}
            onChange={(e) => setPostId(e.target.value)}
            style={{ width: 60, padding: 4 }}
          />
        </label>
      </div>
      <div style={{ display: "flex", gap: 16 }}>
        <UserResource userId={userId} />
        <PostResource postId={postId} />
      </div>
    </section>
  );
}

// ============================================================
// App
// ============================================================
export function App() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: 16 }}>
      <h1>Solution: Hook Patterns</h1>
      <DataFetcherDemo />
      <GlobalStateDemo />
      <AsyncDemo />
      <FactoryDemo />
    </div>
  );
}
