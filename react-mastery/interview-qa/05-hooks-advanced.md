# Hooks (Advanced) - Interview Q&A

---

### Q1: What is `useCallback`?
**A:** `useCallback` returns a memoized version of a callback function that only changes when its dependencies change. It is used to prevent unnecessary re-renders of child components that depend on reference equality for props (e.g., components wrapped in `React.memo`).

```jsx
const handleClick = useCallback(() => {
  setCount(prev => prev + 1);
}, []); // stable reference across renders
```

---

### Q2: When should you use `useCallback`?
**A:** Use `useCallback` when: (1) passing a callback to a memoized child component (`React.memo`) so the child does not re-render unnecessarily, (2) the callback is a dependency of `useEffect` or another hook, (3) the callback is used in a performance-critical context. Do NOT wrap every function in `useCallback` -- the memoization itself has a cost, and it is only beneficial when it actually prevents re-renders.

---

### Q3: What is `useMemo`?
**A:** `useMemo` memoizes the result of an expensive computation. It takes a function and a dependency array, recalculating only when dependencies change. It returns the cached value between renders if dependencies have not changed.

```jsx
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.name.localeCompare(b.name));
}, [items]);
```

---

### Q4: When should you use `useMemo`?
**A:** Use `useMemo` when: (1) performing expensive calculations (sorting, filtering large arrays, complex math), (2) creating objects or arrays passed as props to memoized children (to maintain referential equality), (3) the computed value is used as a dependency in another hook. Avoid premature optimization -- most computations are fast enough without memoization.

---

### Q5: What is the difference between `useMemo` and `useCallback`?
**A:** `useMemo` memoizes a *value* (the return value of a function). `useCallback` memoizes a *function* itself. `useCallback(fn, deps)` is equivalent to `useMemo(() => fn, deps)`. Use `useMemo` for expensive computed values; use `useCallback` for stable function references.

```jsx
// These are equivalent:
const memoizedFn = useCallback(() => doSomething(a), [a]);
const memoizedFn = useMemo(() => () => doSomething(a), [a]);
```

---

### Q6: What is a Custom Hook?
**A:** A custom hook is a JavaScript function whose name starts with `use` and that calls other hooks internally. Custom hooks let you extract and reuse stateful logic between components. They follow the same Rules of Hooks and can use `useState`, `useEffect`, or any other hook.

```jsx
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return width;
}

// Usage
const width = useWindowWidth();
```

---

### Q7: What makes a good Custom Hook?
**A:** A good custom hook: (1) has a clear, descriptive name starting with `use`, (2) encapsulates a single concern or behavior, (3) accepts configuration via parameters, (4) returns only what consumers need (a value, a tuple, or an object), (5) handles cleanup properly, and (6) is testable independently. Examples: `useFetch`, `useLocalStorage`, `useDebounce`, `useMediaQuery`.

---

### Q8: What is `useLayoutEffect`?
**A:** `useLayoutEffect` has the same signature as `useEffect` but fires synchronously after all DOM mutations and before the browser paints. Use it when you need to read layout from the DOM and re-render synchronously before the user sees the update (e.g., measuring element dimensions, positioning tooltips). It blocks the paint, so overuse can hurt performance.

---

### Q9: When should you use `useLayoutEffect` over `useEffect`?
**A:** Use `useLayoutEffect` when you need to: (1) measure DOM elements (width, height, position) and update state based on those measurements before the user sees a flash, (2) synchronously adjust DOM or scroll position, (3) implement animations that must calculate layout. Use `useEffect` for everything else -- data fetching, subscriptions, logging, and most side effects.

```jsx
useLayoutEffect(() => {
  const { height } = ref.current.getBoundingClientRect();
  setTooltipPosition(height); // no visual flicker
}, []);
```

---

### Q10: What is `useImperativeHandle`?
**A:** `useImperativeHandle` customizes the ref value exposed to parent components when using `forwardRef`. Instead of exposing the full DOM node, you expose a limited, controlled API. It takes a ref, a factory function returning the imperative methods, and an optional dependency array.

```jsx
const FancyInput = forwardRef((props, ref) => {
  const inputRef = useRef();
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current.focus(),
    scrollIntoView: () => inputRef.current.scrollIntoView()
  }), []);
  return <input ref={inputRef} {...props} />;
});
```

---

### Q11: How do you compose multiple custom hooks?
**A:** Custom hooks can call other custom hooks, enabling composition. Build small, focused hooks and combine them into higher-level hooks. This is similar to function composition and promotes the single responsibility principle.

```jsx
function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // ... auth logic
  return { user, loading };
}

function useProtectedResource(url) {
  const { user } = useAuth();
  const { data, error } = useFetch(user ? url : null);
  return { data, error };
}
```

---

### Q12: How do you test custom hooks?
**A:** Use the `renderHook` utility from `@testing-library/react`. It renders a hook in a test component and returns the result. Use `act()` to wrap state-updating calls. You can also test hooks indirectly by testing the component that uses them.

```jsx
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

test('should increment counter', () => {
  const { result } = renderHook(() => useCounter());
  expect(result.current.count).toBe(0);
  act(() => result.current.increment());
  expect(result.current.count).toBe(1);
});
```

---

### Q13: What are common hook pitfalls?
**A:** Common pitfalls include: (1) **Stale closures** -- effects and callbacks capturing outdated values, (2) **Missing dependencies** -- ignoring the `exhaustive-deps` rule, (3) **Infinite loops** -- updating state in `useEffect` without proper dependencies, (4) **Object/array dependencies** -- creating new references every render, causing effects to re-run, (5) **Premature optimization** -- wrapping everything in `useMemo`/`useCallback` without measuring.

---

### Q14: How do you avoid infinite loops with `useEffect`?
**A:** Infinite loops happen when `useEffect` updates state that is in its own dependency array. Solutions: (1) use the state updater function (`setState(prev => ...)`) and remove the state variable from deps, (2) move the state update to a condition that will eventually be false, (3) use `useRef` for values that should not trigger re-renders, (4) memoize objects/arrays in deps with `useMemo`.

```jsx
// INFINITE LOOP
useEffect(() => {
  setData({ ...data, loaded: true }); // data changes -> effect reruns
}, [data]);

// FIX: updater function
useEffect(() => {
  setData(prev => ({ ...prev, loaded: true }));
}, []); // no dependency on data
```

---

### Q15: How do you share logic between hooks without code duplication?
**A:** Extract the shared logic into a custom hook. If multiple hooks need the same subscription, data-fetching pattern, or state management logic, create a reusable custom hook. You can also create hook factories -- functions that return configured hooks.

```jsx
function createResourceHook(resource) {
  return function useResource(id) {
    const [data, setData] = useState(null);
    useEffect(() => {
      fetch(`/api/${resource}/${id}`)
        .then(r => r.json())
        .then(setData);
    }, [id]);
    return data;
  };
}

const useUser = createResourceHook('users');
const usePost = createResourceHook('posts');
```

---

### Q16: What is the `useDebugValue` hook?
**A:** `useDebugValue` adds a label to custom hooks in React DevTools. It is purely a developer experience tool and has no effect on behavior. Use it in reusable custom hooks to display meaningful information.

```jsx
function useOnlineStatus() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot);
  useDebugValue(isOnline ? 'Online' : 'Offline');
  return isOnline;
}
```

---

### Q17: Can hooks replace Redux or other state management libraries?
**A:** Hooks (`useState`, `useReducer`, `useContext`) can replace Redux for many use cases, especially small-to-medium apps. However, for large apps with complex state, frequent updates, or need for middleware, time-travel debugging, or devtools, dedicated libraries (Redux, Zustand, Jotai) still provide significant advantages. Context + `useReducer` does not have built-in performance optimizations like selector-based re-rendering.

---

### [BONUS] Q18: What is the `use()` hook in React 19?
**A:** `use()` is a new hook in React 19 that can read the value of a Promise or Context. Unlike other hooks, `use()` can be called conditionally and inside loops. When used with a Promise, it integrates with Suspense -- the component suspends until the Promise resolves. When used with Context, it replaces `useContext` with a more flexible API.

```jsx
function UserProfile({ userPromise }) {
  const user = use(userPromise); // suspends until resolved
  return <h1>{user.name}</h1>;
}

// With context (conditional)
function Theme({ show }) {
  if (show) {
    const theme = use(ThemeContext);
    return <div className={theme}>...</div>;
  }
  return null;
}
```

---

### [BONUS] Q19: What is `useOptimistic`?
**A:** `useOptimistic` (React 19) lets you optimistically update the UI while an async action (like a server mutation) is in progress. It takes the current state and a merge function, returning the optimistic state and a function to trigger optimistic updates. When the action completes, the state reverts to the actual server response.

```jsx
const [optimisticMessages, addOptimistic] = useOptimistic(
  messages,
  (state, newMessage) => [...state, { ...newMessage, sending: true }]
);

async function sendMessage(formData) {
  addOptimistic({ text: formData.get('message'), sending: true });
  await submitToServer(formData);
}
```

---

### [BONUS] Q20: What is `useFormStatus`?
**A:** `useFormStatus` (React 19, from `react-dom`) provides the pending status of the parent `<form>` action. It must be called from a component rendered inside a `<form>`. It returns an object with `pending`, `data`, `method`, and `action` properties. This is useful for showing loading states on submit buttons.

```jsx
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Submitting...' : 'Submit'}
    </button>
  );
}
```

---

### [BONUS] Q21: What is `useActionState`?
**A:** `useActionState` (React 19) manages state that is updated by a form action. It wraps a server or client action function and provides the current state, a bound action, and a pending boolean. It is designed for progressive enhancement -- the form works even before JavaScript loads.

```jsx
import { useActionState } from 'react';

async function submitAction(prevState, formData) {
  const result = await saveToServer(formData);
  return result.error ? { error: result.error } : { success: true };
}

function MyForm() {
  const [state, formAction, isPending] = useActionState(submitAction, {});
  return (
    <form action={formAction}>
      <input name="email" />
      <button disabled={isPending}>Submit</button>
      {state.error && <p>{state.error}</p>}
    </form>
  );
}
```
