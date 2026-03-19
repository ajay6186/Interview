# Hooks (Basic) - Interview Q&A

---

### Q1: What are React Hooks?
**A:** Hooks are functions introduced in React 16.8 that let you use state, lifecycle, context, and other React features inside functional components. Before hooks, these features were only available in class components. Hooks enable cleaner code, better logic reuse via custom hooks, and eliminate the need for class components in most cases.

---

### Q2: Why were Hooks introduced?
**A:** Hooks were introduced to solve three main problems: (1) **Reusing stateful logic** was hard -- HOCs and render props created wrapper hell, (2) **Complex components** became hard to understand because related logic was split across multiple lifecycle methods, (3) **Classes confuse** both people and machines (`this` binding, verbose syntax, poor minification). Hooks let you organize code by concern rather than by lifecycle method.

---

### Q3: What are the Rules of Hooks?
**A:** Two essential rules: (1) **Only call hooks at the top level** -- never inside loops, conditions, or nested functions. This ensures hooks are called in the same order every render, which React relies on to correctly associate state with hooks. (2) **Only call hooks from React functions** -- either functional components or custom hooks, not from regular JavaScript functions.

---

### Q4: Why can't hooks be called conditionally?
**A:** React identifies hooks by their call order on each render. If a hook is inside a condition, its position in the call order could shift between renders, causing React to associate the wrong state with the wrong hook. The `eslint-plugin-react-hooks` enforces this rule statically.

```jsx
// BAD - conditional hook
if (loggedIn) {
  const [user, setUser] = useState(null); // breaks Rules of Hooks
}

// GOOD - conditional logic inside the hook
const [user, setUser] = useState(null);
// use user conditionally in JSX
```

---

### Q5: What is `useState`?
**A:** `useState` is a hook that adds local state to a functional component. It returns a pair: the current state value and a function to update it. The argument to `useState` is the initial state (used only on the first render). State updates trigger a re-render of the component.

```jsx
const [count, setCount] = useState(0);
// setCount(5) -- replace state
// setCount(prev => prev + 1) -- updater function (preferred for derived updates)
```

---

### Q6: What is the difference between `setState(value)` and `setState(prevState => newState)`?
**A:** Passing a value directly (`setCount(5)`) replaces the state. Passing a function (`setCount(prev => prev + 1)`) computes the new state from the previous state. The updater function form is essential when the new state depends on the old state, especially in event handlers or effects where closures may have stale values.

---

### Q7: Is `useState` synchronous or asynchronous?
**A:** State updates with `useState` are not applied immediately -- they are batched and processed asynchronously. React batches multiple `setState` calls into a single re-render for performance. You cannot read the updated state immediately after calling the setter. If you need the previous value, use the updater function form `setState(prev => ...)`.

---

### Q8: Can you pass a function to `useState` as initial state?
**A:** Yes, this is called **lazy initialization**. If your initial state is expensive to compute, pass a function instead of a value. React will call it only on the first render, not on subsequent re-renders.

```jsx
// Expensive: runs every render (but only initial value is used)
const [data, setData] = useState(expensiveComputation());

// Lazy: runs only on first render
const [data, setData] = useState(() => expensiveComputation());
```

---

### Q9: What is `useEffect`?
**A:** `useEffect` is a hook for performing side effects in functional components -- data fetching, subscriptions, DOM manipulation, timers, and logging. It runs after React has committed changes to the DOM. It combines the functionality of `componentDidMount`, `componentDidUpdate`, and `componentWillUnmount` from class components.

```jsx
useEffect(() => {
  document.title = `Count: ${count}`;
}, [count]);
```

---

### Q10: What is the dependencies array in `useEffect`?
**A:** The second argument to `useEffect` is an array of values that the effect depends on. React re-runs the effect only when one of these values changes (shallow comparison). An empty array `[]` means the effect runs only once on mount. Omitting the array entirely means the effect runs after every render.

```jsx
useEffect(() => { ... }, []);      // runs once (mount only)
useEffect(() => { ... }, [a, b]);  // runs when a or b changes
useEffect(() => { ... });          // runs after every render
```

---

### Q11: What is a cleanup function in `useEffect`?
**A:** The function returned from `useEffect` is the cleanup function. React calls it before re-running the effect (when dependencies change) and when the component unmounts. It is used to undo side effects -- removing event listeners, clearing timers, cancelling subscriptions, or aborting fetch requests.

```jsx
useEffect(() => {
  const timer = setInterval(() => tick(), 1000);
  return () => clearInterval(timer); // cleanup
}, []);
```

---

### Q12: What happens if you omit the dependencies array?
**A:** The effect runs after every single render (initial and all subsequent). This is rarely what you want and can cause performance issues or infinite loops (if the effect updates state that triggers another render). Always specify dependencies unless you intentionally need the effect on every render.

---

### Q13: What is `useContext`?
**A:** `useContext` is a hook that reads the value from a React context without nesting Consumer components. You pass it the context object (created by `React.createContext`), and it returns the current context value from the nearest matching `Provider` above in the tree.

```jsx
const ThemeContext = React.createContext('light');

function ThemedButton() {
  const theme = useContext(ThemeContext);
  return <button className={theme}>Click me</button>;
}

// Wrap somewhere above:
<ThemeContext.Provider value="dark">
  <ThemedButton />
</ThemeContext.Provider>
```

---

### Q14: What is the downside of `useContext` for state management?
**A:** When the context value changes, *every* component that calls `useContext` for that context re-renders, even if it only uses a portion of the value. This can cause unnecessary re-renders. Solutions include: splitting context into smaller pieces, memoizing the context value, using `useMemo` to derive values, or using dedicated state management libraries (Zustand, Jotai) for high-frequency updates.

---

### Q15: What is `useReducer`?
**A:** `useReducer` is a hook for managing complex state logic. It accepts a reducer function `(state, action) => newState` and an initial state, returning the current state and a `dispatch` function. It is similar to Redux's pattern and is preferred over `useState` when state transitions depend on the previous state or involve multiple sub-values.

```jsx
function reducer(state, action) {
  switch (action.type) {
    case 'increment': return { count: state.count + 1 };
    case 'decrement': return { count: state.count - 1 };
    default: throw new Error();
  }
}

const [state, dispatch] = useReducer(reducer, { count: 0 });
dispatch({ type: 'increment' });
```

---

### Q16: When should you use `useReducer` over `useState`?
**A:** Prefer `useReducer` when: (1) state logic is complex with multiple sub-values, (2) the next state depends on the previous state in non-trivial ways, (3) you want to centralize state transitions for better readability and testing, or (4) you need to pass `dispatch` down to deeply nested components (it has a stable identity, unlike setter functions recreated inline).

---

### Q17: What is `useRef`?
**A:** `useRef` returns a mutable ref object with a `.current` property that persists across renders. It has two main uses: (1) **Accessing DOM elements** by passing the ref to a JSX element's `ref` attribute, and (2) **Storing mutable values** that do not trigger re-renders when changed (like timers, previous values, or instance variables).

```jsx
const inputRef = useRef(null);
const renderCount = useRef(0);

useEffect(() => {
  renderCount.current += 1; // does NOT trigger re-render
});

return <input ref={inputRef} />;
// inputRef.current is the DOM node
```

---

### Q18: What is the difference between `useRef` and `useState`?
**A:** `useState` triggers a re-render when the value changes; `useRef` does not. `useRef` returns a mutable object whose `.current` property can be changed directly without causing a re-render. Use `useState` for data that affects the UI; use `useRef` for values that need to persist across renders but should not trigger updates (DOM refs, timers, previous values).

---

### Q19: What are stale closures in hooks?
**A:** A stale closure occurs when a callback or effect captures an outdated value of a variable because the closure was created in a previous render. This is common in `useEffect`, `setTimeout`, or event handlers. Fix stale closures by including the variable in the dependency array or using a ref to always read the latest value.

```jsx
// Stale closure problem
const [count, setCount] = useState(0);
useEffect(() => {
  const id = setInterval(() => {
    console.log(count); // always 0 (stale)
  }, 1000);
  return () => clearInterval(id);
}, []); // count not in deps

// Fix: use updater function
setInterval(() => setCount(prev => prev + 1), 1000);
```

---

### Q20: How do you fetch data with `useEffect`?
**A:** Call `useEffect` with a function that performs the fetch. Since the effect callback cannot be `async` directly, define an async function inside it. Use the cleanup function to handle race conditions (e.g., with an `AbortController` or a boolean flag).

```jsx
useEffect(() => {
  const controller = new AbortController();
  async function fetchData() {
    try {
      const res = await fetch(`/api/user/${id}`, {
        signal: controller.signal
      });
      const data = await res.json();
      setUser(data);
    } catch (e) {
      if (e.name !== 'AbortError') setError(e);
    }
  }
  fetchData();
  return () => controller.abort();
}, [id]);
```

---

### Q21: What is the `exhaustive-deps` ESLint rule?
**A:** The `react-hooks/exhaustive-deps` rule (from `eslint-plugin-react-hooks`) warns when a dependency is missing from the `useEffect`, `useCallback`, or `useMemo` dependency array. It helps prevent stale closures and bugs. You should almost always fix the warning rather than suppress it -- missing dependencies are a common source of subtle bugs.

---

### Q22: Can you have multiple `useEffect` calls in one component?
**A:** Yes, and this is encouraged. Use separate `useEffect` calls for unrelated side effects. This keeps each effect focused on one concern, makes the code more readable, and ensures each effect has its own correct dependency array.

```jsx
useEffect(() => {
  // Effect 1: fetch user data
}, [userId]);

useEffect(() => {
  // Effect 2: set up analytics
}, []);

useEffect(() => {
  // Effect 3: update document title
}, [title]);
```

---

### [BONUS] Q23: What is `useId`?
**A:** `useId` (React 18) generates a unique, stable ID that is consistent between server and client rendering. It is designed for accessibility attributes like `htmlFor`/`id` pairs, `aria-describedby`, etc. It should NOT be used as a key in lists.

```jsx
function FormField() {
  const id = useId();
  return (
    <>
      <label htmlFor={id}>Name</label>
      <input id={id} type="text" />
    </>
  );
}
```

---

### [BONUS] Q24: What is `useSyncExternalStore`?
**A:** `useSyncExternalStore` (React 18) is a hook for subscribing to external stores (like Redux, Zustand, or browser APIs) in a way that is safe for concurrent rendering. It takes a `subscribe` function and a `getSnapshot` function, ensuring the component re-renders when the store changes and handles tearing (inconsistent reads during concurrent renders).

```jsx
const width = useSyncExternalStore(
  (callback) => {
    window.addEventListener('resize', callback);
    return () => window.removeEventListener('resize', callback);
  },
  () => window.innerWidth
);
```

---

### [BONUS] Q25: What is `useInsertionEffect`?
**A:** `useInsertionEffect` (React 18) fires synchronously before all DOM mutations, even before `useLayoutEffect`. It is designed exclusively for CSS-in-JS libraries (like Emotion, styled-components) to inject `<style>` tags before any layout effects read the DOM. Application code should almost never use this hook -- it is a library-level escape hatch for style injection timing.
