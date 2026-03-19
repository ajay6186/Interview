import React, { useState, useEffect, useRef } from "react";

// ============================================================
// Exercise: useEffect Fundamentals
// ============================================================
// Learn the useEffect hook by building components that perform
// side effects: updating the document title, running code on
// mount, reacting to state changes, cleaning up timers, and
// simulating data fetching.
//
// Instructions:
// 1. Build a DocumentTitle component that syncs the tab title.
// 2. Build a MountLogger that logs only on mount.
// 3. Build a DependencyTracker that runs an effect when count changes.
// 4. Build a Timer that sets up and cleans up an interval.
// 5. Build a DataFetcher that simulates async data loading.
// ============================================================

// TODO 1: DocumentTitle component
// - Maintain a count state starting at 0
// - Use useEffect (NO dependency array) to set document.title to
//   `"Count: ${count}"` on EVERY render
// - Also render a <p> showing "Render count effect runs every render"
// - Render increment button
function DocumentTitle() {
  // TODO: declare count state
  const [count, setCount] = useState(0)
  // TODO: useEffect that updates document.title on every render

    useEffect(() => {
      document.title = `Count: ${count}`;
    });


  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h2>Document Title Sync</h2>
      {/* TODO: display count */}
      <p style={{ fontSize: 24 }}>Count: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
      {/* TODO: increment button */}
      <p style={{ color: "#666" }}>
        Check the browser tab title — it should update on every render.
      </p>
    </div>
  );
}

function Timer1Inner() {
  useEffect(() => {
    // START the timer when component mounts
    const interval = setInterval(() => {
      console.log("tick...");
    }, 1000);

    // STOP the timer when component unmounts
    // Without this cleanup, the timer keeps running even after
    // the component is gone → memory leak!
    return () => {
      clearInterval(interval);
      console.log("Timer stopped!");
    };
  }, []);

  return <p>Timer is running... (check console)</p>;
}

function Timer1() {
  const [show, setShow] = useState(true);

  return (
    <div>
      <button onClick={() => setShow(false)}>Hide Timer</button>
      {show && <Timer1Inner />}  {/* when show=false, Timer1Inner is REMOVED → cleanup runs */}
    </div>
  );
}

// TODO 2: MountLogger component
// - Use useEffect with an EMPTY dependency array [] to log
//   "MountLogger: Component mounted!" to the console on mount
// - Return a cleanup function that logs
//   "MountLogger: Component unmounted!" on unmount
// - Maintain a count state and an increment button to prove
//   the effect does NOT re-run on re-renders
// - Render a <p> telling the user to check the console
function MountLogger() {
  // TODO: declare count state
  const [count, setCount] = useState(0)
  // TODO: useEffect with empty deps that logs on mount and cleans up on unmount
    useEffect(() => {
      console.log("MountLogger: Component mounted!");
      return () => {
        console.log("MountLogger: Component unmounted!");
      };
    }, []);

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h2>Mount Logger</h2>
      {/* TODO: display count and increment button */}
      <p style={{ fontSize: 24 }}>Count: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
      <p style={{ color: "#666" }}>
        Open the console. "Mounted" should appear once. Incrementing should NOT
        re-log.
      </p>
    </div>
  );
}

// TODO 3: DependencyTracker component
// - Maintain count state (number) and name state (string)
// - Use useEffect with [count] as dependency to log
//   `"Count changed to: ${count}"` — this should NOT run when name changes
// - Render both values, an increment button, and a text input for name
// - Render a log of all effect runs stored in a ref or state
function DependencyTracker() {
  
  
  // TODO: declare count state
  const [count, setCount] = useState(0);
  // TODO: declare name state
  const [name, setName] = useState('');
  // TODO: declare effectLog state (string[]) to track when the effect fires
  const [effectLog, setEffectLog] = useState<string[]>([])

  // TODO: useEffect with [count] dependency that appends to effectLog

  useEffect(() => {
      const message = `Count changed to: ${count} (at ${new Date().toLocaleTimeString()})`;
      console.log(message);
      setEffectLog((prev) => [...prev, message]);
    }, [count]);

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h2>Dependency Tracker</h2>
      <br/>
      {/* TODO: display count and increment button */}
      <p>Count: {count}</p>
      <br/>
      <button
      onClick={(e) => setCount((c) => c+1)}
      >Increment</button>
      {/* TODO: name input */}
      <br/>
      <br/>
      <label>
        Name:{" "}
        <input
        type='text'
        value={name}
        onChange = {(e) => setName(e.target.value)}
        placeholder="Type here — effect won't fire">
        </input>

      </label>

      {/* TODO: render effectLog entries to show when the effect ran */}
        
      <strong>Effect Log:</strong>
      {effectLog.length === 0 && <p style={{ color: "#999" }}>No runs yet.</p>}
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        {effectLog.map((entry, i) => (
          <li key={i} style={{ fontSize: 13 }}>
            {entry}
          </li>
        ))}
      </ul>

    </div>
  );
}

// TODO 4: Timer component
// - Maintain seconds state starting at 0
// - Maintain isRunning state starting at false
// - useEffect with [isRunning] dependency:
//     - If isRunning is true, set up a setInterval that increments seconds every 1000ms
//     - Return a cleanup function that calls clearInterval
//     - If isRunning is false, do nothing (but still return cleanup)
// - Render current seconds, Start/Stop toggle button, and a Reset button
function Timer() {
  // TODO: declare seconds state
  const [seconds, setSeconds] = useState(0)
  // TODO: declare isRunning state
  const [isRunning, setIsRunning] = useState(false)
  // TODO: useEffect that sets up / tears down an interval based on isRunning

  useEffect(() => {
      if (!isRunning) return;
  
      const intervalId = setInterval(() => {
        console.log("----> mount test");
        setSeconds((prev) => prev + 1);
      }, 1000);
  
      // Cleanup: clear the interval when isRunning changes or component unmounts
      return () => {
        clearInterval(intervalId);
        console.log("----> unmount test")
      };
    }, [isRunning]);
  
    const handleReset = () => {
      setIsRunning(false);
      setSeconds(0);
    };

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h2>Timer with Cleanup</h2>
      {/* TODO: display seconds in large text */}
      <h2>{seconds}</h2>
      <p style={{ fontSize: 48, fontFamily: "monospace", margin: "8px 0" }}>
        {String(Math.floor(seconds / 60)).padStart(2, "0")}:
        {String(seconds % 60).padStart(2, "0")}
      </p>
      {/* TODO: start/stop toggle button */}
      {/* TODO: reset button (also stops the timer) */}
      <button onClick={() => setIsRunning((r) => !r)}>
        {isRunning ? "Stop" : "Start"}
      </button>{" "}
      <button onClick={handleReset}>Reset</button>
    </div>
  );
}

// TODO 5: DataFetcher component
// - Maintain data state (string | null), loading state (boolean), error state (string | null)
// - Maintain a query state (string) with an input — e.g. a user ID
// - useEffect with [query] dependency that:
//     a) sets loading to true, error to null
//     b) uses setTimeout (1.5s delay) to simulate a fetch
//     c) if query is "error", set error to "Failed to fetch data"
//        otherwise set data to `"Result for '${query}': some data here"`
//     d) sets loading to false
//     e) returns a cleanup that clears the timeout (to avoid state updates on unmounted component)
// - Render loading spinner text, error message, or data
interface FetchState {
  data: string | null;
  loading: boolean;
  error: string | null;
}

function DataFetcher() {
  const [query, setQuery] = useState("user-1");
  const [fetchState, setFetchState] = useState<FetchState>({
    data: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!query.trim()) {
      setFetchState({ data: null, loading: false, error: null });
      return;
    }

    setFetchState({ data: null, loading: true, error: null });

    const timeoutId = setTimeout(() => {
      if (query.toLowerCase() === "error") {
        setFetchState({
          data: null,
          loading: false,
          error: "Failed to fetch data",
        });
      } else {
        setFetchState({
          data: `Result for '${query}': { id: 42, name: "Mock Data", query: "${query}" }`,
          loading: false,
          error: null,
        });
      }
    }, 1500);

    // Cleanup: cancel the timeout if query changes before it resolves
    return () => {
      clearTimeout(timeoutId);
    };
  }, [query]);

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h2>Data Fetcher (Simulated)</h2>
      <label>
        Query:{" "}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ padding: 8, fontSize: 16 }}
        />
      </label>

      <div style={{ marginTop: 12, minHeight: 40 }}>
        {fetchState.loading && (
          <p style={{ color: "blue" }}>Loading...</p>
        )}
        {fetchState.error && (
          <p style={{ color: "red", fontWeight: "bold" }}>
            Error: {fetchState.error}
          </p>
        )}
        {fetchState.data && (
          <pre
            style={{
              background: "#f0f0f0",
              padding: 12,
              borderRadius: 4,
              whiteSpace: "pre-wrap",
            }}
          >
            {fetchState.data}
          </pre>
        )}
      </div>

      <p style={{ color: "#666" }}>
        Try typing "error" to simulate a failed request.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────
// BASIC (1–12)
// ─────────────────────────────────────────

function Ex01_LogOnMount() {
  useEffect(
    () => {
      console.log("Mounted");
      return () => console.log("Unmounted");
    },
    []
  )
  return <p>Check console - logs on mount & unmount</p>;
}

function Ex02_DocumentTitle() {
  const [count, setCount] = useState(0);
  useEffect(() => { document.title = `Count: - ${count}`}, [count]);
  return (
    <div>
      <p>Count: {count} (check tab title)</p>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  )
}

function Ex03_RunEveryRender() {
  const [val, setVal] = useState(0);
  useEffect(() => {console.log("Effect ram, val =", val); });
  return (
    <div>
      <p>Val: {val}</p>
      <button onClick={() => setVal(val + 1)}>+</button>
    </div>
  )
}

function Ex04_RunOnce() {
  const [data, setData] = useState("");
  useEffect(()=> {
    setData("Loaded on mount only")
    console.log("test")
  }, [])
  return (
    <div>
      <p>{data}</p>
    </div>
  )
}

//  updated but it is very important
function Ex05_CleanupTimeout() {
  const [visible, setVisible] = useState(false);
  const [count, setCount] = useState(0);

  const timerRef = useRef(null);

  const start = () => {
    timerRef.current = setInterval(() => {
      setVisible(true);
      setCount((prev) => prev + 1);
    }, 1000);
  };

  const stop = () => {
    clearInterval(timerRef.current);
  };

  const reset = () => {
    setCount(0);
    setVisible(false);
  };

  return (
    <div>
      <p>{visible ? "Appeared after 1s!" : "Waiting 1 second..."}</p>
      <h2>Count: {count}</h2>

      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}

function Ex06_CleanupInterval() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setCount((c) => c+1), 1000);
    return () => clearInterval(id);
  }, []);
  return <p>Seconds elapsed: {count}</p>
}

function Ex07_WindowResize() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [])
  return <p>Window width: {width} px (resize browser)</p>
}

export function App() {
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Exercise: useEffect Fundamentals</h1>
      {/* TODO: render all five components below */}
      {/* <DocumentTitle/> */}
      {/* <MountLogger/> */}
      {/* <Timer1/> */}
      {/* <DependencyTracker/> */}
      {/* <Timer/> */}
      {/* <DataFetcher/> */}

      {/* BASIC (1–12) */}
      {/* <Ex01_LogOnMount/> */}
      {/* <Ex02_DocumentTitle/> */}
      {/* <Ex03_RunEveryRender/> */}
      {/* <Ex04_RunOnce/> */}
      {/* <Ex05_CleanupTimeout/> */}
      {/* <Ex06_CleanupInterval/> */}
      {/* <Ex07_WindowResize/> */}
    </div>
  );
}
