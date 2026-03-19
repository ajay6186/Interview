import React, { useState, useRef, useEffect } from "react";

// ============================================================
// Exercise: useRef — DOM Access & Mutable Values
// ============================================================
// Master useRef for three purposes: accessing DOM elements,
// storing previous values across renders, and holding mutable
// instance variables that don't trigger re-renders (like timer IDs).
//
// Instructions:
// 1. Build FocusInput — ref to an input, focus on button click.
// 2. Build PreviousValue — track the previous count value.
// 3. Build RenderCounter — count renders without causing them.
// 4. Build Stopwatch — store an interval ID in a ref.
// 5. Build ScrollToSection — scroll to elements using refs.
// ============================================================

// TODO 1: FocusInput component
// - Create a ref using useRef<HTMLInputElement>(null)
// - Attach it to an <input> element via the ref prop
// - Render a "Focus Input" button that calls inputRef.current?.focus()
// - Render a "Select All" button that calls inputRef.current?.select()
// - Render a "Clear & Focus" button that clears the input value and focuses it
function FocusInput() {
  // TODO: create inputRef
  
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState("Hello, focus me!");

  const handleFocus= () => {
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
      {/* TODO: input element with ref attached */}
      <h2>Focus Input</h2>
      <input
        ref={inputRef}
        type="text"
        value= {value}
        onChange={(e) => setValue(e.target.value)}
        style = {{ padding: 8, fontSize: 16, width: "100%",
        marginBottom: 8
      }}
      />
      {/* TODO: "Focus Input" button */}
      {/* TODO: "Select All" button */}
      {/* TODO: "Clear & Focus" button */}
      <div style = {{ display: "flex", gap: 8}}>
        <button onClick={handleFocus}>Focus Input</button>
        <button onClick={handleSelectAll}>Select All</button>
        <button onClick={handleClearAndFocus}>Clear & Focus</button>
      </div>
    </div>
  );
}

// TODO 2: PreviousValue component
// - Maintain count state starting at 0
// - Create a ref prevCountRef using useRef<number>(0)
// - Use useEffect (dependency: [count]) to store the current count
//   into prevCountRef.current AFTER each render:
//     useEffect(() => { prevCountRef.current = count; }, [count])
// - During render, prevCountRef.current still holds the OLD value
//   (because the effect hasn't run yet for this render)
// - Display both current count and previous count
// - Render increment and decrement buttons
function PreviousValue() {
  // TODO: declare count state
  const [count, setCount] = useState(0);
  // TODO: create prevCountRef
  const prevCountRef = useRef<number>(0);
  // TODO: useEffect to update prevCountRef after render

  useEffect(() => {
    console.log("useEffect: updating prevCountRef.current to", count);
    prevCountRef.current = count;
  }, [count]);

  console.log("Render: count=", count, "prevCountRef.current=", prevCountRef.current);

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h2>Previous Value Tracker</h2>
      <h2>Previous Value Tracker</h2>
      <p style={{ fontSize: 20 }}>
        Current count: <strong>{count}</strong>
      </p>
      <p style={{ fontSize: 20 }}>
        Previous count: <strong>{prevCountRef.current}</strong>
      </p>
        <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => {
          console.log("Button clicked");
          setCount(count + 1);}}>Increment</button>
        <button onClick={() => setCount((c) => c - 1)}>Decrement</button>
        <button onClick={() => setCount((c) => c + 5)}>Add 5</button>
      </div>
      <p style={{ color: "#666", fontSize: 13, marginTop: 8 }}>
        The "previous" value lags one render behind because useEffect runs
        AFTER render. During render, the ref still holds the old value.
      </p>
      {/* TODO: display current count */}
      {/* TODO: display previous count from ref */}
      {/* TODO: increment and decrement buttons */}
    </div>
  );
}

// TODO 3: RenderCounter component
// - Create a ref renderCount using useRef<number>(0)
// - On every render, increment renderCount.current by 1
//   (do this directly in the component body, NOT in useEffect)
// - Maintain a name state with a text input (to trigger re-renders)
// - Maintain a count state with an increment button
// - Display renderCount.current — it should increase on EVERY re-render
//   regardless of which state changed
// - Key insight: updating a ref does NOT cause a re-render
function RenderCounter() {
  // TODO: create renderCount ref
  // TODO: increment it on each render (directly in component body)
  // TODO: declare name state
  // TODO: declare count state
  const renderCount = useRef<number>(0);

  renderCount.current += 1

  const [name, setName] = useState("");
  const [count, setCount] = useState(0);

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h2>Render Counter</h2>
      {/* TODO: display render count */}
      <p
        style={{
          fontSize: 18,
          // background: "#e8f5e9",
          padding: 8,
          borderRadius: 4,
        }}
      >
        This component has rendered <strong>
        {renderCount.current}
        </strong> time(s).
      </p>
      {/* TODO: name input */}
      <div style={{ marginBottom: 8}}>
        <label>
          Name: {" "}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Type to trigger re-renders..."
            style={{ padding: 4}}
          />
        </label>
      </div>
      {/* TODO: count display and increment button */}
      <div>
        <span>Count: {count}</span>
        <button onClick = {() => setCount((c) => c+1)}>Increment</button>

      <p>
        Every keystroke and every button click triggers a re-render, incrementing
        the counter. Using useRef instead of useState avoids infinite render loops
      </p>
      </div>
    </div>
  );
}

// TODO 4: Stopwatch component
// - Maintain time state (number, in centiseconds — 1/100th of a second)
// - Maintain isRunning state
// - Create intervalRef using useRef<number | null>(null)
//   (this stores the interval ID without triggering re-renders)
// - "Start" button: set up a setInterval that increments time every 10ms,
//   store the interval ID in intervalRef.current
// - "Stop" button: clearInterval using intervalRef.current, set to null
// - "Reset" button: stop the interval if running, reset time to 0
// - Display time formatted as MM:SS.cc (minutes:seconds.centiseconds)
// - Use useEffect cleanup to clear interval on unmount
function Stopwatch() {
  // TODO: declare time state (centiseconds)
  const [time, setTime] = useState(0); // centiseconds (1/100s)
  
  // TODO: declare isRunning state
  const [isRunning, setIsRunning] = useState(false);

  // TODO: create intervalRef
  const intervalRef = useRef<number | null>(null);

  // TODO: start, stop, reset handlers

  const start = () => {
    if (isRunning) return;
    setIsRunning(true);
    intervalRef.current = window.setInterval
    (() => {
      setTime((prev) => prev + 1)
    }, 10);
  }

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

  // TODO: useEffect cleanup on unmount

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // TODO: format time helper

  const formatTime = (cs: number): string => {
    const minutes = Math.floor(cs / 6000);
    const seconds = Math.floor((cs % 6000) / 100);
    const centiseconds = cs % 100;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
  };


  // const formatTime = (cs: number) => { ... }

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

// TODO 5: ScrollToSection component
// - Create three refs for three section divs: section1Ref, section2Ref, section3Ref
//   using useRef<HTMLDivElement>(null)
// - Render three buttons at the top: "Go to Section 1/2/3"
// - Each button calls sectionRef.current?.scrollIntoView({ behavior: "smooth" })
// - Render three tall sections (with enough height to be scrollable)
//   each with the ref attached
function ScrollToSection() {
  // TODO: create three section refs
  const section1Ref = useRef<HTMLDivElement>(null);
  const section2Ref = useRef<HTMLDivElement>(null);
  const section3Ref = useRef<HTMLDivElement>(null);

  // TODO: create scroll handler
  // const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => { ... }

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({behavior: "smooth"});
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
      {/* TODO: render all five components */}
      {/* <FocusInput/> */}
      {/* <PreviousValue/> */}
      {/* <RenderCounter/> */}
      {/* <Stopwatch/> */}
      <ScrollToSection/>
    </div>
  );
}
