import React, { useState, useRef, useEffect } from "react";

// ============================================================
// Solution: useRef — DOM Access & Mutable Values
// ============================================================

function FocusInput() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("Hello, focus me!");

  const handleFocus = () => {
    inputRef.current?.focus();
  };

  const handleSelectAll = () => {
    inputRef.current?.focus();
    inputRef.current?.select();
  };

  const handleClearAndFocus = () => {
    setValue("");
    inputRef.current?.focus();
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h2>Focus Input</h2>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{ padding: 8, fontSize: 16, width: "100%", marginBottom: 8 }}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleFocus}>Focus Input</button>
        <button onClick={handleSelectAll}>Select All</button>
        <button onClick={handleClearAndFocus}>Clear & Focus</button>
      </div>
    </div>
  );
}

function PreviousValue() {
  const [count, setCount] = useState(0);
  const prevCountRef = useRef<number>(0);

  // After each render where count changed, store the current count.
  // During the NEXT render, prevCountRef.current will hold the old value
  // because this effect hasn't run yet for that render.
  useEffect(() => {
    prevCountRef.current = count;
  }, [count]);

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h2>Previous Value Tracker</h2>
      <p style={{ fontSize: 20 }}>
        Current count: <strong>{count}</strong>
      </p>
      <p style={{ fontSize: 20 }}>
        Previous count: <strong>{prevCountRef.current}</strong>
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setCount((c) => c + 1)}>Increment</button>
        <button onClick={() => setCount((c) => c - 1)}>Decrement</button>
        <button onClick={() => setCount((c) => c + 5)}>Add 5</button>
      </div>
      <p style={{ color: "#666", fontSize: 13, marginTop: 8 }}>
        The "previous" value lags one render behind because useEffect runs
        AFTER render. During render, the ref still holds the old value.
      </p>
    </div>
  );
}

function RenderCounter() {
  const renderCount = useRef<number>(0);

  // Increment on every render — directly in the component body.
  // This does NOT trigger a re-render because ref mutations are silent.
  renderCount.current += 1;

  const [name, setName] = useState("");
  const [count, setCount] = useState(0);

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h2>Render Counter</h2>
      <p
        style={{
          fontSize: 18,
          background: "#e8f5e9",
          padding: 8,
          borderRadius: 4,
        }}
      >
        This component has rendered <strong>{renderCount.current}</strong> time(s).
      </p>
      <div style={{ marginBottom: 8 }}>
        <label>
          Name:{" "}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Type to trigger re-renders..."
            style={{ padding: 4 }}
          />
        </label>
      </div>
      <div>
        <span>Count: {count} </span>
        <button onClick={() => setCount((c) => c + 1)}>Increment</button>
      </div>
      <p style={{ color: "#666", fontSize: 13, marginTop: 8 }}>
        Every keystroke and every button click triggers a re-render, incrementing
        the counter. Using useRef instead of useState avoids infinite render loops.
      </p>
    </div>
  );
}

function Stopwatch() {
  const [time, setTime] = useState(0); // centiseconds (1/100s)
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const start = () => {
    if (isRunning) return;
    setIsRunning(true);
    intervalRef.current = window.setInterval(() => {
      setTime((prev) => prev + 1);
    }, 10);
  };

  const stop = () => {
    if (!isRunning) return;
    setIsRunning(false);
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const reset = () => {
    stop();
    setTime(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const formatTime = (cs: number): string => {
    const minutes = Math.floor(cs / 6000);
    const seconds = Math.floor((cs % 6000) / 100);
    const centiseconds = cs % 100;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h2>Stopwatch</h2>
      <p
        style={{
          fontSize: 48,
          fontFamily: "monospace",
          margin: "8px 0",
          letterSpacing: 2,
        }}
      >
        {formatTime(time)}
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        {!isRunning ? (
          <button
            onClick={start}
            style={{ padding: "8px 20px", fontSize: 16, color: "green" }}
          >
            Start
          </button>
        ) : (
          <button
            onClick={stop}
            style={{ padding: "8px 20px", fontSize: 16, color: "orange" }}
          >
            Stop
          </button>
        )}
        <button
          onClick={reset}
          style={{ padding: "8px 20px", fontSize: 16, color: "red" }}
        >
          Reset
        </button>
      </div>
      <p style={{ color: "#666", fontSize: 13, marginTop: 8 }}>
        The interval ID is stored in a ref so we can clear it without
        re-rendering. The ref persists across renders but doesn't cause them.
      </p>
    </div>
  );
}

function ScrollToSection() {
  const section1Ref = useRef<HTMLDivElement>(null);
  const section2Ref = useRef<HTMLDivElement>(null);
  const section3Ref = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sectionStyle = (color: string): React.CSSProperties => ({
    minHeight: 300,
    padding: 20,
    backgroundColor: color,
    borderRadius: 4,
    marginBottom: 8,
  });

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h2>Scroll to Section</h2>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          position: "sticky",
          top: 0,
          background: "white",
          padding: "8px 0",
          zIndex: 1,
        }}
      >
        <button onClick={() => scrollTo(section1Ref)}>Go to Section 1</button>
        <button onClick={() => scrollTo(section2Ref)}>Go to Section 2</button>
        <button onClick={() => scrollTo(section3Ref)}>Go to Section 3</button>
      </div>
      <div
        style={{
          maxHeight: 300,
          overflowY: "auto",
          border: "1px solid #eee",
          borderRadius: 4,
        }}
      >
        <div ref={section1Ref} style={sectionStyle("#e3f2fd")}>
          <h3>Section 1 - Introduction</h3>
          <p>
            useRef gives you a mutable object that persists for the full
            lifetime of the component. Unlike state, mutating a ref does not
            trigger a re-render.
          </p>
          <p>
            The most common use is to hold a reference to a DOM element, but you
            can store any mutable value: timer IDs, previous values, render
            counts, etc.
          </p>
          <p style={{ marginTop: 100 }}>Scroll down for more sections...</p>
        </div>
        <div ref={section2Ref} style={sectionStyle("#e8f5e9")}>
          <h3>Section 2 - DOM References</h3>
          <p>
            When you pass a ref to a JSX element via the <code>ref</code> prop,
            React sets <code>ref.current</code> to the actual DOM node after
            mounting.
          </p>
          <p>
            This lets you imperatively interact with the DOM: focusing inputs,
            scrolling, measuring dimensions, or integrating with third-party
            libraries.
          </p>
          <p style={{ marginTop: 100 }}>Keep scrolling...</p>
        </div>
        <div ref={section3Ref} style={sectionStyle("#fff3e0")}>
          <h3>Section 3 - Mutable Values</h3>
          <p>
            Refs are also perfect for values that need to persist across renders
            but should NOT trigger re-renders when changed — like interval IDs,
            animation frame handles, or WebSocket connections.
          </p>
          <p>
            Think of refs as "instance variables" for function components,
            similar to how you would use <code>this.something</code> in a class
            component.
          </p>
          <p style={{ marginTop: 100 }}>End of scroll content.</p>
        </div>
      </div>
    </div>
  );
}

export function App() {
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Exercise: useRef</h1>
      <FocusInput />
      <PreviousValue />
      <RenderCounter />
      <Stopwatch />
      <ScrollToSection />
    </div>
  );
}
