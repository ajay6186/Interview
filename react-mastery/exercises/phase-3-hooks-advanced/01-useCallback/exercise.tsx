import React, { useState, useCallback, useRef, memo } from "react";

// ============================================================
// Exercise: useCallback — Preventing Unnecessary Re-renders
// ============================================================
// useCallback memoizes a function reference so that child
// components wrapped in React.memo can skip re-rendering when
// their props haven't truly changed.
//
// Instructions:
// 1. Build a RenderCounter component that tracks how many
//    times it has rendered using useRef.
// 2. Build a ChildButton wrapped in React.memo that accepts
//    an onClick handler and a label. It should display its
//    render count.
// 3. In App, create a counter (useState) and a separate
//    "theme" toggle so you have a reason to re-render the
//    parent without changing the child's props.
// 4. Pass an INLINE handler to one ChildButton (no
//    useCallback) — observe it re-renders every time.
// 5. Pass a useCallback-memoized handler to a second
//    ChildButton — observe it does NOT re-render when
//    unrelated state changes.
// 6. Create a third ChildButton whose memoized handler
//    depends on the counter value (dependency array) so it
//    only re-renders when counter changes.
// ============================================================

// TODO 1: Create a RenderCounter component
// It should use useRef to keep a mutable render count that
// increments every render and display: "Renders: X"
// function RenderCounter() { ... }

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
    <div style={{ padding: 8, margin: 4, border:  "1px solid #ccc"}}>
      <button onClick={onClick}>{label}</button>
      <span style={{ marginLeft: 8, color: "#888" }}>
        Renders: {renderCount.current}
      </span>
    </div>
  );
});

// TODO 2: Create ChildButton wrapped in React.memo
// Props: { onClick: () => void; label: string }
// Inside, use the RenderCounter concept (useRef) to show
// how many times THIS child has rendered.
// const ChildButton = memo(function ChildButton(...) { ... });

// TODO 3: Create InlineHandlerDemo
// - useState for a counter
// - useState for a theme toggle (light/dark) — just to
//   cause parent re-renders unrelated to the child
// - Render a ChildButton with an INLINE onClick handler
//   (a new arrow function each render)
// - Render buttons to increment counter and toggle theme
// function InlineHandlerDemo() { ... }

function InlineHandlerDemo(){
  const [counter, setCounter] = useState(0);
  const [theme, setTheme] = useState<"light" | "dark">("light");

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
// TODO 4: Create MemoizedHandlerDemo
// - Same setup as above (counter + theme toggle)
// - Use useCallback to memoize the onClick handler with
//   an EMPTY dependency array (handler doesn't use counter)
// - Render a ChildButton with the memoized handler
// - Toggling theme should NOT cause ChildButton to re-render
// function MemoizedHandlerDemo() { ... }

function MemoizedHandlerDemo() { 
  const [counter, setCounter] = useState(0);
  const [theme, setTheme] = useState<"light" | "dark">("light");

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


// TODO 5: Create DependencyDemo
// - counter state + theme toggle state
// - useCallback handler that LOGS the current counter value
//   (so counter must be in the dependency array)
// - Render a ChildButton with this handler
// - Changing counter re-renders child (dependency changed)
// - Changing theme does NOT re-render child
// function DependencyDemo() { ... }

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

// TODO 6: Wire everything together in App
export function App() {
  return (
    <div>
      <h1>Exercise: useCallback</h1>
      {/* TODO: Render InlineHandlerDemo */}
      <InlineHandlerDemo/>
      {/* TODO: Render MemoizedHandlerDemo */}
      {/* TODO: Render DependencyDemo */}
      <MemoizedHandlerDemo/>
      <DependencyDemo />
    </div>
  );
}
