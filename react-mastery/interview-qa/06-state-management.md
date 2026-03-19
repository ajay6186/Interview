# State Management - Interview Q&A

---

### Q1: What is the difference between local state, global state, and server state?
**A:**
- **Local state** — lives inside a single component (`useState`, `useReducer`). Only that component and its children (via props) can access it. Best for UI-specific state like form inputs, toggles, modal open/close.
- **Global state** — shared across many components regardless of tree position. Examples: current user, theme, shopping cart. Managed with Context, Redux, Zustand, Jotai, etc.
- **Server state** — data that originates on the server and must be fetched, cached, and synchronized. Examples: a list of users from an API. Managed with React Query, SWR, or Redux Thunk/Saga.

---

### Q2: What is prop drilling and why is it a problem?
**A:** Prop drilling occurs when data is passed through many layers of components as props even though the intermediate layers don't need it — they only pass it down to children. Problems: (1) Components become unnecessarily coupled, (2) Refactoring is painful — adding a new prop requires updating every layer, (3) Components are harder to test and reuse in isolation. Solutions: Context API, global state libraries, component composition.

---

### Q3: How does the Context API solve prop drilling?
**A:** Context provides a way to share values between components without explicitly passing props through every level. You create a context with `React.createContext()`, wrap the relevant tree in a `<Provider value={...}>`, and any descendant component can consume the value via `useContext(ctx)`. This decouples the producer from the consumer — intermediate components are completely unaware of the data.

```jsx
const ThemeContext = React.createContext<"light" | "dark">("light");

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Page />
    </ThemeContext.Provider>
  );
}

function DeepButton() {
  const theme = useContext(ThemeContext); // no prop drilling needed
  return <button className={theme}>Click</button>;
}
```

---

### Q4: What are the limitations of Context API?
**A:** (1) **Performance** — every component consuming a context re-renders when the context value changes, even if only a portion of the value changed. (2) **No built-in devtools** — debugging is harder than Redux with Redux DevTools. (3) **No middleware** — no built-in support for side effects, async actions, or middleware. (4) **Not designed for high-frequency updates** — e.g., mouse position, live timers. For these, use Zustand, Jotai, or Redux.

---

### Q5: How do you optimize Context to avoid unnecessary re-renders?
**A:** Strategies:
1. **Split contexts** — separate frequently-changing values from stable ones. Use `<UserContext>` for user data and `<ThemeContext>` for theme.
2. **Memoize the value** — `useMemo` to stabilize the object reference:
   ```jsx
   const value = useMemo(() => ({ user, login, logout }), [user]);
   ```
3. **Use `memo` on consumers** — `React.memo` can prevent child re-renders if props don't change, but context consumers always re-render.
4. **Use a state management library** — Zustand and Jotai only re-render components subscribed to the specific slice of state that changed.

---

### Q6: When should you use Context vs Redux?
**A:**
| Situation | Choose |
|---|---|
| Simple, low-frequency data (theme, locale, current user) | Context |
| Complex state logic with many actions | Redux |
| Cross-cutting state with frequent updates | Redux / Zustand |
| Small-to-medium apps | Context |
| Large team, time-travel debugging needed | Redux + DevTools |
| Async side effects need coordination | Redux Thunk / Saga |

**Rule of thumb:** Context for "who am I / what's my theme", Redux for "what data does the app have and how does it change".

---

### Q7: What is Zustand and how does it differ from Redux?
**A:** Zustand is a small, lightweight state management library. Differences:
- **Boilerplate** — Zustand needs almost none; Redux requires actions, reducers, store setup.
- **Immutability** — Zustand uses Immer under the hood optionally; Redux requires pure reducers.
- **Subscriptions** — Zustand components only re-render when the specific slice they subscribe to changes.
- **DevTools** — Both support Redux DevTools.
- **Learning curve** — Zustand is far simpler.

```js
// Zustand
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

---

### Q8: What is the `useReducer` hook and when should you prefer it over `useState`?
**A:** `useReducer(reducer, initialState)` is an alternative to `useState` for managing complex state with multiple sub-values or when the next state depends on complex logic. Prefer `useReducer` when:
- State transitions involve multiple sub-values (like a form object).
- The next state depends heavily on the previous state.
- You want to co-locate state logic in a single `reducer` function (easier to test in isolation).
- State changes from many different event types.

```jsx
function reducer(state, action) {
  switch (action.type) {
    case "increment": return { ...state, count: state.count + 1 };
    case "reset": return { count: 0 };
    default: return state;
  }
}
const [state, dispatch] = useReducer(reducer, { count: 0 });
```

---

### Q9: What is the difference between controlled and uncontrolled state?
**A:**
- **Controlled** — React controls the value. The component's `value` prop is bound to state, and `onChange` updates state. React is the single source of truth. Good for validation, conditional disabling, instant feedback.
- **Uncontrolled** — The DOM controls the value. You use a `ref` to read it when needed (e.g., on submit). Simpler for simple forms but harder to validate in real time.

```jsx
// Controlled
const [val, setVal] = useState("");
<input value={val} onChange={e => setVal(e.target.value)} />

// Uncontrolled
const ref = useRef<HTMLInputElement>(null);
<input ref={ref} defaultValue="initial" />
```

---

### Q10: What is state colocation and why does it matter?
**A:** State colocation means keeping state as close as possible to where it is used. Instead of lifting all state to the top of the tree, keep state local to the component (or small subtree) that needs it. Benefits: (1) Re-renders are scoped to a smaller subtree, (2) Components are easier to reason about and test, (3) Refactoring is safer. Only lift state up when two components genuinely need to share it.

---

### Q11: How does React's state batching work in React 18?
**A:** In React 18, **all** state updates are batched automatically — even those inside `setTimeout`, `Promise.then`, and native event handlers. Before React 18, batching only applied inside React event handlers. This means fewer re-renders. If you need to force a synchronous update without batching (rare), use `flushSync` from `react-dom`.

```jsx
import { flushSync } from "react-dom";
flushSync(() => setA(1)); // triggers a re-render immediately
flushSync(() => setB(2)); // triggers another re-render immediately
```

---

### Q12: What is the difference between `useState` initializer function and direct value?
**A:** Passing a function to `useState` is called **lazy initialization**. The function runs only once on mount, not on every render. Use it when computing initial state is expensive (e.g., parsing localStorage, running a heavy computation).

```jsx
// Runs on every render (bad if expensive):
const [data, setData] = useState(heavyComputation());

// Runs only once on mount (correct):
const [data, setData] = useState(() => heavyComputation());
```
