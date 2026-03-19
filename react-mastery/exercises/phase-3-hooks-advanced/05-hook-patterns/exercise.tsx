import React, {
  useState,
  useEffect,
  useReducer,
  useContext,
  useCallback,
  createContext,
} from "react";

// ============================================================
// Exercise: Hook Patterns — Composition & Best Practices
// ============================================================
// This exercise covers advanced patterns for combining hooks:
//   1. Rules of Hooks (what NOT to do)
//   2. useState + useEffect for data fetching
//   3. useReducer + useContext for global state
//   4. useAsync: a custom hook composing useState + useEffect
//   5. Hook factory: createResourceHook(url) => usable hook
//
// Instructions:
// Implement each section below. Read the Rules of Hooks
// comments carefully — those are "don't do this" examples.
// ============================================================

// ============================================================
// SECTION 1: Rules of Hooks (READ ONLY — do NOT uncomment)
// ============================================================
// The Rules of Hooks exist so React can track hook state
// between renders by relying on call ORDER.
//
// RULE 1: Only call hooks at the top level
// BAD — conditional hook:
//   function Bad1({ show }: { show: boolean }) {
//     if (show) {
//       const [val, setVal] = useState(0); // WRONG
//     }
//     return <div />;
//   }
//
// BAD — hook inside a loop:
//   function Bad2({ items }: { items: string[] }) {
//     for (const item of items) {
//       useEffect(() => console.log(item), []); // WRONG
//     }
//     return <div />;
//   }
//
// BAD — hook after early return:
//   function Bad3({ ready }: { ready: boolean }) {
//     if (!ready) return <div>Loading</div>;
//     const [data, setData] = useState(null); // WRONG
//     return <div>{data}</div>;
//   }
//
// RULE 2: Only call hooks from React functions
// BAD — hook in a regular function:
//   function helperNotAHook() {
//     const [x] = useState(0); // WRONG — not a component or hook
//     return x;
//   }
//
// GOOD — extract into a custom hook (name starts with "use"):
//   function useHelper() {
//     const [x] = useState(0); // OK — this IS a hook
//     return x;
//   }
// ============================================================

// ============================================================
// SECTION 2: useState + useEffect Data Fetching Pattern
// ============================================================

// TODO 1: Create a DataFetcher component
// - Props: { url: string }
// - State: data (any | null), loading (boolean), error (string | null)
// - useEffect that:
//     a) Sets loading = true, error = null
//     b) Uses setTimeout (1s delay) to simulate a fetch
//     c) If url contains "error", set error state
//     d) Otherwise, set data to { url, fetchedAt: Date.now() }
//     e) Cleanup: cancel timeout if url changes
// - Render: show loading spinner, error message, or data
// function DataFetcher({ url }: { url: string }) { ... }

// TODO 2: Create DataFetcherDemo that renders DataFetcher
// with buttons to switch between URLs
// function DataFetcherDemo() { ... }

// ============================================================
// SECTION 3: useReducer + useContext for Global State
// ============================================================

// TODO 3: Define the state shape and action types
// interface AppState {
//   user: string | null;
//   notifications: string[];
//   theme: "light" | "dark";
// }
// type AppAction =
//   | { type: "SET_USER"; payload: string }
//   | { type: "LOGOUT" }
//   | { type: "ADD_NOTIFICATION"; payload: string }
//   | { type: "CLEAR_NOTIFICATIONS" }
//   | { type: "TOGGLE_THEME" };

// TODO 4: Write the reducer function
// function appReducer(state: AppState, action: AppAction): AppState { ... }

// TODO 5: Create a context that holds { state, dispatch }
// const AppStateContext = createContext<{
//   state: AppState;
//   dispatch: React.Dispatch<AppAction>;
// } | null>(null);

// TODO 6: Create a provider component that wraps useReducer
// function AppStateProvider({ children }: { children: React.ReactNode }) { ... }

// TODO 7: Create a custom hook useAppState() that consumes
// the context (and throws if used outside the provider)
// function useAppState() { ... }

// TODO 8: Create child components that use the global state
// - UserPanel: shows logged-in user, login/logout buttons
// - NotificationPanel: shows notifications, add/clear buttons
// - ThemeToggle: toggle light/dark theme
// function UserPanel() { ... }
// function NotificationPanel() { ... }
// function ThemeToggle() { ... }

// TODO 9: Create GlobalStateDemo that wraps children in the provider
// function GlobalStateDemo() { ... }

// ============================================================
// SECTION 4: useAsync — Composing Hooks
// ============================================================

// TODO 10: Create useAsync<T>(asyncFn: () => Promise<T>, deps: any[])
// - State: { data: T | null; loading: boolean; error: Error | null }
// - useEffect that calls asyncFn(), handles the promise, and
//   updates state accordingly
// - Handle cleanup: use a `cancelled` flag so that if deps
//   change before the promise resolves, we don't set stale state
// - Return { data, loading, error, refetch }
//   where refetch re-triggers the effect
// function useAsync<T>(asyncFn: () => Promise<T>, deps: any[]) { ... }

// TODO 11: Create AsyncDemo that uses useAsync
// - Simulate an API call with a promise that resolves after 1s
// - Show loading, error, and data states
// - Provide a "Refetch" button
// function AsyncDemo() { ... }

// ============================================================
// SECTION 5: Hook Factory Pattern
// ============================================================

// TODO 12: Create createResourceHook(baseUrl: string)
// - Returns a custom hook: useResource(id: string)
// - The returned hook calls useAsync internally to "fetch"
//   the resource at `${baseUrl}/${id}`
// - Simulates a fetch with setTimeout + Promise
// function createResourceHook(baseUrl: string) { ... }

// TODO 13: Use the factory to create two hooks:
// const useUser = createResourceHook("/api/users");
// const usePost = createResourceHook("/api/posts");

// TODO 14: Create FactoryDemo that uses both useUser and usePost
// - Input fields for userId and postId
// - Display the fetched data for each
// function FactoryDemo() { ... }

// TODO 15: Wire everything together
export function App() {
  return (
    <div>
      <h1>Exercise: Hook Patterns</h1>
      {/* TODO: Render DataFetcherDemo */}
      {/* TODO: Render GlobalStateDemo */}
      {/* TODO: Render AsyncDemo */}
      {/* TODO: Render FactoryDemo */}
    </div>
  );
}
