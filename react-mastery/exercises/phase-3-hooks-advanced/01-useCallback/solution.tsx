import React, { useState, useCallback, useRef, memo } from "react";

// ============================================================
// Solution: useCallback — Preventing Unnecessary Re-renders
// ============================================================

// ChildButton is wrapped in React.memo so it only re-renders
// when its props actually change (shallow comparison).
const ChildButton = memo(function ChildButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  const renderCount = useRef(0);
  renderCount.current += 1;

  return (
    <div style={{ padding: 8, margin: 4, border: "1px solid #ccc" }}>
      <button onClick={onClick}>{label}</button>
      <span style={{ marginLeft: 8, color: "#888" }}>
        Renders: {renderCount.current}
      </span>
    </div>
  );
});

// --- Demo 1: Inline handler (new reference every render) ---
function InlineHandlerDemo() {
  const [counter, setCounter] = useState(0);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Every render creates a brand-new arrow function, so React.memo
  // sees a different `onClick` prop and re-renders the child.
  return (
    <section
      style={{
        padding: 16,
        marginBottom: 16,
        background: theme === "dark" ? "#333" : "#fff",
        color: theme === "dark" ? "#fff" : "#000",
      }}
    >
      <h2>1. Inline Handler (child re-renders every time)</h2>
      <p>Counter: {counter}</p>
      <button onClick={() => setCounter((c) => c + 1)}>Increment</button>
      <button onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}>
        Toggle Theme
      </button>

      <ChildButton
        onClick={() => console.log("clicked (inline)")}
        label="Inline Handler"
      />
    </section>
  );
}

// --- Demo 2: Memoized handler with empty deps ---
function MemoizedHandlerDemo() {
  const [counter, setCounter] = useState(0);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // useCallback with [] means the function reference is stable
  // across renders — React.memo will skip re-rendering the child.
  const handleClick = useCallback(() => {
    console.log("clicked (memoized, no deps)");
  }, []);

  return (
    <section
      style={{
        padding: 16,
        marginBottom: 16,
        background: theme === "dark" ? "#333" : "#fff",
        color: theme === "dark" ? "#fff" : "#000",
      }}
    >
      <h2>2. Memoized Handler (child does NOT re-render on theme toggle)</h2>
      <p>Counter: {counter}</p>
      <button onClick={() => setCounter((c) => c + 1)}>Increment</button>
      <button onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}>
        Toggle Theme
      </button>

      <ChildButton onClick={handleClick} label="Memoized Handler" />
    </section>
  );
}

// --- Demo 3: Memoized handler WITH dependency on counter ---
function DependencyDemo() {
  const [counter, setCounter] = useState(0);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // This handler closes over `counter`, so counter must be in deps.
  // Child re-renders when counter changes (new function ref) but
  // NOT when theme changes.
  const handleClick = useCallback(() => {
    console.log(`clicked — counter is ${counter}`);
  }, [counter]);

  return (
    <section
      style={{
        padding: 16,
        marginBottom: 16,
        background: theme === "dark" ? "#333" : "#fff",
        color: theme === "dark" ? "#fff" : "#000",
      }}
    >
      <h2>3. Memoized Handler with Dependency</h2>
      <p>Counter: {counter}</p>
      <p style={{ fontSize: 12, color: "#888" }}>
        Child re-renders when counter changes (dependency) but NOT on theme toggle.
      </p>
      <button onClick={() => setCounter((c) => c + 1)}>Increment</button>
      <button onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}>
        Toggle Theme
      </button>

      <ChildButton onClick={handleClick} label="Dep Handler" />
    </section>
  );
}

export function App() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: 16 }}>
      <h1>Solution: useCallback</h1>
      <InlineHandlerDemo />
      <MemoizedHandlerDemo />
      <DependencyDemo />
    </div>
  );
}
