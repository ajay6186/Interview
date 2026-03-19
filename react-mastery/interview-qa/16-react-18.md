# React 18 & Concurrent Features - Interview Q&A

---

### Q1: What are the major new features in React 18?
**A:**
1. **Automatic batching** — all state updates are batched by default (including in setTimeout, Promises, native events).
2. **Concurrent rendering** — React can interrupt, pause, and resume renders.
3. **`useTransition`** — mark state updates as non-urgent.
4. **`useDeferredValue`** — defer re-renders triggered by a value.
5. **`useId`** — generate unique IDs that are stable across server/client.
6. **`useSyncExternalStore`** — safe way to subscribe to external stores.
7. **Streaming SSR** — stream HTML in chunks with `<Suspense>` boundaries.
8. **`createRoot`** — required for all React 18 features (replaces `ReactDOM.render`).

---

### Q2: What is the difference between `useTransition` and `useDeferredValue`?
**A:**
- **`useTransition`** — wraps a state **setter call** to mark it as non-urgent. You control when the transition starts. Best when you own the state update.
- **`useDeferredValue`** — defers re-renders caused by a **value** changing. Best when you receive a value as a prop (you don't control the setter).

```tsx
// useTransition — you own the state
const [isPending, startTransition] = useTransition();
startTransition(() => setFilteredList(expensiveFilter(input)));

// useDeferredValue — you received the value from outside
function SearchResults({ query }: { query: string }) {
  const deferredQuery = useDeferredValue(query);
  const results = computeExpensiveSearch(deferredQuery);
  return <ResultList results={results} />;
}
```

During the deferred period, the previous value is used, preventing janky UI.

---

### Q3: What is `useId` and what problem does it solve?
**A:** `useId` generates a unique, stable ID that is consistent between the server render and client hydration. Before `useId`, developers used `Math.random()` or counters for IDs — these cause hydration mismatches (server and client produce different values).

```tsx
function FormField({ label }: { label: string }) {
  const id = useId(); // e.g., ":r0:"
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input id={id} />
    </>
  );
}
```

Do not use `useId` for list keys — use the data's own ID.

---

### Q4: What is `useSyncExternalStore`?
**A:** A hook for safely subscribing to external (non-React) data stores, ensuring tearing doesn't occur in concurrent renders. Libraries like Redux, Zustand, and Jotai use it internally.

```tsx
function useWindowWidth() {
  return useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("resize", onStoreChange);
      return () => window.removeEventListener("resize", onStoreChange);
    },
    () => window.innerWidth,        // client snapshot
    () => 1024,                     // server snapshot
  );
}
```

---

### Q5: What changed with `createRoot` in React 18?
**A:** `ReactDOM.render` is deprecated. React 18 requires `createRoot` to opt in to concurrent features:

```tsx
// React 17 (deprecated)
ReactDOM.render(<App />, document.getElementById("root"));

// React 18
import { createRoot } from "react-dom/client";
const root = createRoot(document.getElementById("root")!);
root.render(<App />);
```

Using `ReactDOM.render` with React 18 still works but opts out of all concurrent features.

---

### Q6: What is Streaming SSR in React 18?
**A:** Instead of waiting for the entire page to render on the server, React can stream HTML in chunks. Suspense boundaries act as "flush points" — the server sends already-computed HTML immediately, and deferred sections (wrapped in Suspense) stream in later as their data resolves.

Benefits: faster Time to First Byte (TTFB), faster First Contentful Paint (FCP), progressive loading. Works with Next.js App Router out of the box.

---

### Q7: What is Concurrent Mode and what does "interruptible rendering" mean?
**A:** Concurrent Mode is a set of new behind-the-scenes rendering capabilities in React 18. Previously, React's render was synchronous — once started, it ran to completion. In Concurrent Mode, React can:
- **Interrupt** a render in progress to handle a higher-priority update (e.g., user typing).
- **Pause and resume** a render.
- **Discard** a stale render if it's no longer needed.

This is invisible to most component code — React handles scheduling internally. You opt into it by using `useTransition` or `useDeferredValue`.

---

### Q8: What is the Suspense for data fetching pattern?
**A:** With React Query v5+ or Next.js RSC, components can suspend while data is loading. The nearest Suspense boundary shows a fallback. This eliminates manual `isLoading` checks:

```tsx
// With React Query (suspense mode)
function UserProfile({ id }: { id: number }) {
  const { data } = useSuspenseQuery({ // throws Promise if loading
    queryKey: ["user", id],
    queryFn: () => fetchUser(id),
  });
  return <div>{data.name}</div>; // data is guaranteed to be available
}

function App() {
  return (
    <Suspense fallback={<Skeleton />}>
      <UserProfile id={1} />
    </Suspense>
  );
}
```

---

### Q9: What is the `useOptimistic` hook (React 19 preview)?
**A:** `useOptimistic` is a hook that provides an optimistic state value — a temporary, immediately-applied version of the state while an async action (like a server mutation) is in flight. If the action fails, the optimistic state is discarded and the real state reverts.

```tsx
const [optimisticLikes, addOptimisticLike] = useOptimistic(
  likes,
  (state, amount: number) => state + amount
);

async function handleLike() {
  addOptimisticLike(1); // immediate UI update
  await saveLikeToServer(); // real update
}
```

---

### Q10: How does React 18 handle double-invocation in development with `StrictMode`?
**A:** In React 18 + StrictMode, effects are intentionally mounted, unmounted, and remounted once extra in development. This reveals bugs where effects don't properly clean up. The sequence is: `mount → effect runs → unmount → cleanup runs → remount → effect runs again`. This does NOT happen in production. If your app breaks in StrictMode, you likely have a cleanup bug in a `useEffect`.

---

### Q11: What is `flushSync` and when do you use it?
**A:** `flushSync` forces React to flush state updates synchronously and synchronously re-render before returning. It's an escape hatch for integrating with non-React code that needs immediate DOM updates:

```tsx
import { flushSync } from "react-dom";

function handleClick() {
  flushSync(() => setCount(c => c + 1)); // DOM is updated synchronously here
  // Now you can safely read the updated DOM:
  inputRef.current?.focus();
}
```

Use sparingly — it bypasses React's batching and concurrent optimizations.

---

### Q12: What are React Actions (React 19)?
**A:** React 19 introduces Actions — async functions that handle form submissions and mutations. Combined with `useActionState` (formerly `useFormState`) and `useFormStatus`, they create a first-class pattern for handling server mutations, pending states, and optimistic updates.

```tsx
async function submitAction(formData: FormData) {
  "use server"; // Server Action (Next.js)
  await saveToDatabase(formData.get("name"));
}

function Form() {
  const [state, action, isPending] = useActionState(submitAction, null);
  return (
    <form action={action}>
      <input name="name" />
      <button disabled={isPending}>{isPending ? "Saving..." : "Save"}</button>
    </form>
  );
}
```
