# Advanced React Patterns - Interview Q&A

---

### Q1: What is the Compound Component pattern?
**A:** Compound components are a set of components that work together to form a cohesive UI unit, sharing implicit state through Context. The parent manages shared state and provides it via Context; child components consume it. This gives users flexible composition while hiding internal wiring.

```tsx
const TabsContext = React.createContext<{ active: string; setActive: (id: string) => void } | null>(null);

function Tabs({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState("tab1");
  return <TabsContext.Provider value={{ active, setActive }}>{children}</TabsContext.Provider>;
}

function Tab({ id, label }: { id: string; label: string }) {
  const ctx = useContext(TabsContext)!;
  return <button onClick={() => ctx.setActive(id)} style={{ fontWeight: ctx.active === id ? "bold" : "normal" }}>{label}</button>;
}

function TabPanel({ id, children }: { id: string; children: React.ReactNode }) {
  const ctx = useContext(TabsContext)!;
  return ctx.active === id ? <div>{children}</div> : null;
}

// Usage:
<Tabs>
  <Tab id="tab1" label="Profile" />
  <Tab id="tab2" label="Settings" />
  <TabPanel id="tab1">Profile content</TabPanel>
  <TabPanel id="tab2">Settings content</TabPanel>
</Tabs>
```

---

### Q2: What is the Render Props pattern?
**A:** A render prop is a function prop that a component uses to know what to render. The component provides data (state, callbacks) via the function argument; the consumer decides the UI. It solves the same problem as HOCs (logic sharing) but with more explicit data flow.

```tsx
function MouseTracker({ render }: { render: (pos: { x: number; y: number }) => React.ReactNode }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <div onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}>
      {render(pos)}
    </div>
  );
}

// Usage:
<MouseTracker render={({ x, y }) => <p>Mouse at {x}, {y}</p>} />
```

Custom hooks have largely replaced render props, but render props are still useful when you need component composition rather than just logic sharing.

---

### Q3: What is a Higher-Order Component (HOC)?
**A:** A HOC is a function that takes a component and returns a new component with enhanced behavior. It's a pattern for cross-cutting concerns like authentication checks, logging, or adding props.

```tsx
function withAuth<P extends object>(WrappedComponent: React.ComponentType<P>) {
  return function AuthGuard(props: P) {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" />;
    return <WrappedComponent {...props} />;
  };
}

const ProtectedDashboard = withAuth(Dashboard);
```

**Limitations:** HOCs can cause "wrapper hell", prop name collisions, and make debugging harder (component name is lost). Custom hooks are usually preferred for logic reuse.

---

### Q4: What is the Provider Pattern?
**A:** The Provider Pattern uses React Context to inject dependencies (services, configuration, state) into a component tree without prop drilling. A `Provider` component wraps the tree and supplies values; consumers access them via `useContext`.

Common uses: theme providers, auth providers, i18n providers, router providers. Many libraries (Redux, React Router, React Query) expose a `Provider` component you wrap your app with.

---

### Q5: What are React Portals and when do you use them?
**A:** Portals render a child component into a different DOM node than the parent. The React event system (bubbling) still works as if the portal is inside the parent tree — only the DOM position changes.

```tsx
import { createPortal } from "react-dom";

function Modal({ children }: { children: React.ReactNode }) {
  return createPortal(
    <div className="modal-overlay">{children}</div>,
    document.body // render directly into <body>
  );
}
```

Use cases: modals, tooltips, dropdown menus, toasts — anything that needs to visually escape a parent with `overflow: hidden` or `z-index` stacking context issues.

---

### Q6: What is the Controlled Prop (aka Inversion of Control) pattern?
**A:** A component can be "controlled" when the parent manages its state externally. The component accepts both a value prop and an `onChange` callback. This is the same idea as controlled inputs but applied to custom components.

```tsx
// Can be both uncontrolled (manages own state) and controlled (parent drives state)
function Accordion({ open, onOpenChange, defaultOpen = false }: AccordionProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const handleToggle = () => {
    if (!isControlled) setInternalOpen(o => !o);
    onOpenChange?.(!isOpen);
  };
  return <div onClick={handleToggle}>{isOpen && children}</div>;
}
```

---

### Q7: What is the Container/Presentational pattern?
**A:** Separate components into:
- **Container (Smart)** — fetches data, manages state, handles business logic. No markup.
- **Presentational (Dumb)** — receives data via props, renders UI. No logic or side effects.

This improves testability (presentational components are pure functions of their props) and reusability. With custom hooks, the separation is now typically between a hook (the container logic) and a component (the presentation). The pattern is less rigidly applied today but the underlying principle of separating concerns remains important.

---

### Q8: What is the Observer/Pub-Sub pattern in React?
**A:** An event bus or pub/sub system lets components communicate without being in the same tree. One component publishes events; others subscribe. This is an escape hatch — prefer React state and Context for most cases. Use pub/sub only for truly decoupled scenarios (e.g., analytics events, cross-microfrontend communication).

---

### Q9: What are React Suspense boundaries and how do they work?
**A:** `<Suspense fallback={<Spinner />}>` catches "suspended" components — components that throw a Promise (used by `React.lazy`, data-fetching libraries with Suspense support). While the Promise is pending, Suspense renders the `fallback`. When it resolves, the component renders.

```tsx
const LazyPage = React.lazy(() => import("./Page"));

function App() {
  return (
    <Suspense fallback={<div>Loading page...</div>}>
      <LazyPage />
    </Suspense>
  );
}
```

---

### Q10: What is memoization in React and what are the three tools for it?
**A:**
1. **`React.memo(Component)`** — prevents re-rendering a component if its props haven't changed (shallow comparison).
2. **`useMemo(() => value, [deps])`** — memoizes a computed value; recomputes only when deps change.
3. **`useCallback(() => fn, [deps])`** — memoizes a function reference; returns a stable reference if deps haven't changed.

**Rule:** only memoize when you have a measured performance problem. Premature memoization adds complexity and can even hurt performance (the comparison itself has a cost).

---

### Q11: What is the Flux architecture?
**A:** Flux is a unidirectional data flow pattern: **Action → Dispatcher → Store → View → (Action)**. Data flows in one direction, making state changes predictable and traceable. Redux is the most popular implementation of Flux ideas. The core benefits are debuggability (every state change has an action) and predictability (pure reducers, no hidden mutations).

---

### Q12: What are React Fragments and why were they introduced?
**A:** Fragments (`<>...</>` or `<React.Fragment>`) allow returning multiple elements from a component without adding an extra DOM node. They were introduced because JSX requires a single root element. Wrapping in a `<div>` adds unnecessary DOM nodes that can break CSS flex/grid layouts and add accessibility noise. Use `<React.Fragment key={...}>` when you need to pass a `key` prop (e.g., in a list).
