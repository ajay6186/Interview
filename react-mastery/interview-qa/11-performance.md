# React Performance

### Q1: How does React's rendering process work?
**A:** When state or props change, React calls the component function to produce a new virtual DOM tree (the "render" phase). It then diffs this new tree against the previous one using its reconciliation algorithm to determine the minimal set of DOM changes needed (the "commit" phase). Only actual DOM mutations are applied, making updates efficient. Rendering a component does not necessarily mean the DOM is updated.

### Q2: When does a React component re-render?
**A:** A component re-renders when: (1) its state changes via `useState`/`useReducer`, (2) its parent re-renders (props may or may not change), (3) a context value it consumes changes, or (4) a custom hook it uses triggers a state update. Notably, a parent re-rendering causes all children to re-render by default, even if their props haven't changed.

### Q3: What is `React.memo` and when should you use it?
**A:** `React.memo` is a higher-order component that memoizes a component, skipping re-renders if props haven't changed (shallow comparison by default). Use it for components that render frequently with the same props, especially expensive rendering components:
```jsx
const ExpensiveList = React.memo(function ExpensiveList({ items }) {
  return items.map(item => <ComplexItem key={item.id} item={item} />);
});
```
Don't wrap every component -- the comparison itself has a cost. Profile first to identify bottlenecks.

### Q4: What does `useMemo` do?
**A:** `useMemo` memoizes a computed value, only recalculating when its dependencies change. It avoids expensive computations on every render:
```jsx
const sortedItems = useMemo(() => {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}, [items]);
```
Use it for expensive calculations, not for every variable. The memoization itself has overhead.

### Q5: What does `useCallback` do and how does it relate to `React.memo`?
**A:** `useCallback` memoizes a function reference so it stays stable across renders unless dependencies change. It's primarily useful when passing callbacks to `React.memo`-wrapped children, because without it, a new function reference is created each render, defeating `React.memo`:
```jsx
const handleClick = useCallback((id) => {
  dispatch(deleteItem(id));
}, [dispatch]);

return <MemoizedList onDelete={handleClick} />;
```
`useCallback(fn, deps)` is equivalent to `useMemo(() => fn, deps)`.

### Q6: Why is the `key` prop important for performance?
**A:** The `key` prop helps React's reconciliation algorithm identify which items in a list have changed, been added, or removed. Without proper keys, React re-renders every item when the list changes. Using stable, unique keys (like IDs) allows React to reuse existing DOM elements and only update what actually changed. Never use array index as key if the list can be reordered, filtered, or items can be added/removed in the middle.

### Q7: What happens if you use array index as a key?
**A:** Using index as key causes bugs when the list is reordered, items are inserted/deleted from the middle, or items have local state. React associates state with the key's position, so if items shift, state gets misattributed. For example, a checked checkbox might appear on the wrong item after sorting. Always use a unique, stable identifier from your data.

### Q8: What is virtualization and why is it important?
**A:** Virtualization (windowing) renders only the items currently visible in the viewport, rather than the entire list. For a list of 10,000 items, only ~20 might be visible at once. Libraries like **react-window** and **react-virtualized** implement this by calculating which items are in view and only mounting those DOM nodes, dramatically reducing memory usage and improving scroll performance.

### Q9: How does `react-window` differ from `react-virtualized`?
**A:** `react-window` is a lighter, rewritten version by the same author (Brian Vaughn). It's smaller (~6KB vs ~33KB), faster, and covers the most common use cases (fixed/variable-size lists and grids). `react-virtualized` has more features: table support, masonry layout, auto-sizer, infinite loader. Choose `react-window` unless you need specific advanced features from `react-virtualized`.

### Q10: How does code splitting improve performance?
**A:** Code splitting reduces the initial JavaScript bundle by loading code on demand. A 2MB bundle split into route-based chunks might only load 200KB initially, reducing parse/compile time and Time to Interactive. Users only download the code they actually use. Combined with lazy loading, it significantly improves initial load performance and is especially impactful on mobile devices with slower networks.

### Q11: How do you lazy load images in React?
**A:** Use the native `loading="lazy"` attribute for simple cases, or an Intersection Observer for more control:
```jsx
// Native lazy loading
<img src="photo.jpg" loading="lazy" alt="description" />

// Intersection Observer approach
function LazyImage({ src, alt }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); }
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <img ref={ref} src={isVisible ? src : undefined} alt={alt} />;
}
```

### Q12: How do you implement debouncing and throttling in React?
**A:** **Debouncing** delays execution until a pause in events (good for search inputs). **Throttling** limits execution to once per interval (good for scroll/resize). Implement with `useEffect` cleanup or utility functions:
```jsx
// Debounce with useEffect
useEffect(() => {
  const timer = setTimeout(() => search(query), 300);
  return () => clearTimeout(timer);
}, [query]);

// Throttle with useRef
const lastRun = useRef(0);
const handleScroll = () => {
  if (Date.now() - lastRun.current > 100) {
    lastRun.current = Date.now();
    updatePosition();
  }
};
```

### Q13: What is the React Profiler and how do you use it?
**A:** The React Profiler (in React DevTools) records rendering information: which components rendered, why they rendered, how long each render took, and the commit timeline. Use it to identify unnecessary re-renders and performance bottlenecks. You can also use the `<Profiler>` component programmatically:
```jsx
<Profiler id="sidebar" onRender={(id, phase, actualDuration) => {
  console.log(`${id} ${phase} render: ${actualDuration}ms`);
}}>
  <Sidebar />
</Profiler>
```

### Q14: What common patterns cause unnecessary re-renders?
**A:** (1) Creating new objects/arrays inline as props: `style={{ color: 'red' }}` creates a new object each render. (2) Defining functions inline: `onClick={() => doSomething()}` creates new references. (3) Spreading new objects as props. (4) Not memoizing context values. (5) Using index as key causing full list re-renders. (6) Updating state at too high a level in the component tree. Fix these by lifting state down, memoizing values, or using `React.memo`.

### Q15: How do you avoid re-renders from context?
**A:** Context causes all consumers to re-render when its value changes, even if they only use part of it. Strategies: (1) Split context into smaller, focused contexts. (2) Memoize the context value with `useMemo`. (3) Use a state management library instead. (4) Create selector-based consumers:
```jsx
// Memoize the value
const value = useMemo(() => ({ user, theme }), [user, theme]);
return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
```

### Q16: What is the children pattern for avoiding re-renders?
**A:** Passing components as children or props prevents them from re-rendering when the parent's state changes, because they were created in a higher scope:
```jsx
// Slow: ChildComponent re-renders when count changes
function Parent() {
  const [count, setCount] = useState(0);
  return <div><ChildComponent /><button onClick={() => setCount(c+1)} /></div>;
}

// Fast: ChildComponent was created outside, doesn't re-render
function App() {
  return <Parent><ChildComponent /></Parent>;
}
function Parent({ children }) {
  const [count, setCount] = useState(0);
  return <div>{children}<button onClick={() => setCount(c+1)} /></div>;
}
```

### Q17: How does React batch state updates?
**A:** In React 18, all state updates are automatically batched, whether they occur in event handlers, `setTimeout`, promises, or native event listeners. Multiple `setState` calls in the same synchronous block result in a single re-render. In React 17 and earlier, batching only occurred in React event handlers. To force a synchronous flush in React 18, use `flushSync()`.

### Q18: [BONUS] What is the React Compiler (React Forget)?
**A:** The React Compiler is an automatic optimization tool that analyzes your component code at build time and inserts memoization (equivalent to `useMemo`, `useCallback`, `React.memo`) automatically where beneficial. It understands React's rules and the dependency relationships in your code. The goal is to eliminate the need for manual memoization, reducing developer burden while improving or matching hand-optimized performance. It shipped experimentally with React 19.

### Q19: [BONUS] What is `useTransition` and how does it improve perceived performance?
**A:** `useTransition` marks a state update as non-urgent (a "transition"), allowing React to keep the current UI interactive while rendering the new state in the background. If a more urgent update occurs (like typing), React can interrupt the transition:
```jsx
const [isPending, startTransition] = useTransition();

const handleSearch = (query) => {
  startTransition(() => {
    setSearchResults(filterLargeList(query));
  });
};
// isPending can show a loading indicator without blocking the input
```

### Q20: [BONUS] What is `useDeferredValue` and how does it differ from `useTransition`?
**A:** `useDeferredValue` returns a deferred version of a value that "lags behind" the current value during urgent updates. It's useful when you don't control the state update (e.g., it comes from a parent) but want to defer expensive rendering:
```jsx
const deferredQuery = useDeferredValue(query);
const results = useMemo(() => filterLargeList(deferredQuery), [deferredQuery]);
```
`useTransition` wraps the state update itself; `useDeferredValue` wraps the consumption of a value. Use `useTransition` when you own the update, `useDeferredValue` when you don't.
