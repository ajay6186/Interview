import React, {
  useState,
  useTransition,
  useDeferredValue,
  useId,
  useRef,
  Suspense,
  lazy,
} from "react";

// ============================================================
// Solution: React 18 Features
// ============================================================

// Shared slow list component
function SlowList({ query }: { query: string }) {
  const items = Array.from({ length: 1_000 }, (_, i) => `Item ${i + 1}`).filter((item) =>
    item.toLowerCase().includes(query.toLowerCase())
  );

  const start = performance.now();
  while (performance.now() - start < 15) { /* intentional blocking */ }

  return (
    <ul style={{ height: 200, overflowY: "auto", margin: 0, padding: "0 0 0 20px" }}>
      {items.slice(0, 100).map((item, i) => (
        <li key={i}>
          {item} {query && <mark>{query}</mark>}
        </li>
      ))}
      {items.length > 100 && <li>... and {items.length - 100} more</li>}
    </ul>
  );
}

// --- 1. useTransition ---
function SearchWithTransition() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setInput(value); // urgent: update text field immediately
    startTransition(() => {
      setQuery(value); // non-urgent: update filtered list
    });
  }

  return (
    <div>
      <input
        value={input}
        onChange={handleChange}
        placeholder="Type to filter 1,000 items..."
        style={{ padding: "8px 12px", width: "100%", boxSizing: "border-box", marginBottom: 8 }}
      />
      {isPending && (
        <p style={{ color: "#6b7280", fontStyle: "italic" }}>Updating list...</p>
      )}
      <div style={{ opacity: isPending ? 0.6 : 1, transition: "opacity 0.2s" }}>
        <SlowList query={query} />
      </div>
    </div>
  );
}

// --- 2. useDeferredValue ---
function SearchWithDeferred() {
  const [input, setInput] = useState("");
  const deferredInput = useDeferredValue(input);
  const isStale = input !== deferredInput;

  return (
    <div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type to filter (deferred)..."
        style={{ padding: "8px 12px", width: "100%", boxSizing: "border-box", marginBottom: 8 }}
      />
      <p style={{ fontSize: 12, color: "#6b7280" }}>
        Input: <code>{input || "(empty)"}</code> | Deferred: <code>{deferredInput || "(empty)"}</code>
        {isStale ? " — list is catching up..." : " — in sync"}
      </p>
      <div style={{ opacity: isStale ? 0.5 : 1, transition: "opacity 0.3s" }}>
        <SlowList query={deferredInput} />
      </div>
    </div>
  );
}

// --- 3. useId for accessible forms ---
function FormField({ label, type = "text" }: { label: string; type?: string }) {
  const id = useId();
  return (
    <div style={{ marginBottom: 12 }}>
      <label htmlFor={id} style={{ display: "block", fontWeight: "bold", marginBottom: 4 }}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={`Enter ${label.toLowerCase()}`}
        style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 4, width: "100%", boxSizing: "border-box" }}
      />
    </div>
  );
}

function AccessibleForm() {
  return (
    <form>
      <FormField label="Name" />
      <FormField label="Email" type="email" />
      <FormField label="Password" type="password" />
      <p style={{ fontSize: 12, color: "#6b7280" }}>
        Inspect the DOM — each label's <code>htmlFor</code> matches its input's <code>id</code>,
        generated stably by <code>useId()</code>.
      </p>
    </form>
  );
}

// --- 4. Suspense + lazy ---
const HeavyComponent = lazy(
  () =>
    new Promise<{ default: React.ComponentType }>((resolve) => {
      setTimeout(
        () =>
          resolve({
            default: () => (
              <div style={{ padding: 16, backgroundColor: "#d1fae5", borderRadius: 8 }}>
                Heavy component loaded after 1 second!
              </div>
            ),
          }),
        1000
      );
    })
);

function LazyDemo() {
  const [show, setShow] = useState(false);

  return (
    <div>
      <button onClick={() => setShow(true)} disabled={show} style={{ padding: "8px 16px" }}>
        {show ? "Loading..." : "Load Heavy Component"}
      </button>
      {show && (
        <div style={{ marginTop: 12 }}>
          <Suspense
            fallback={
              <p style={{ color: "#6b7280", fontStyle: "italic" }}>
                Loading heavy component...
              </p>
            }
          >
            <HeavyComponent />
          </Suspense>
        </div>
      )}
    </div>
  );
}

// --- 5. Batching demo ---
function BatchingDemo() {
  const [countA, setCountA] = useState(0);
  const [countB, setCountB] = useState(0);
  const [countC, setCountC] = useState(0);
  const renderCount = useRef(0);
  renderCount.current++;

  function updateAll() {
    // React 18: all three setStates are batched → ONE re-render
    setCountA((a) => a + 1);
    setCountB((b) => b + 1);
    setCountC((c) => c + 1);
  }

  return (
    <div>
      <p>
        <strong>Render count:</strong> {renderCount.current} (should increase by 1 per button click, not 3)
      </p>
      <p>
        A: {countA} | B: {countB} | C: {countC}
      </p>
      <button onClick={updateAll} style={{ padding: "8px 16px" }}>
        Update A, B, and C (React 18 batches all three)
      </button>
      <p style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
        In React 17, calling three setStates in a setTimeout would cause 3 re-renders.
        React 18 batches all updates by default — only 1 re-render happens.
      </p>
    </div>
  );
}

// --- App ---
const sectionStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 20,
  marginBottom: 32,
};

export function App() {
  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 20 }}>
      <h1>Solution: React 18 Features</h1>

      <section style={sectionStyle}>
        <h2>1. useTransition</h2>
        <p>The input stays responsive; the slow list update is marked non-urgent.</p>
        <SearchWithTransition />
      </section>

      <section style={sectionStyle}>
        <h2>2. useDeferredValue</h2>
        <p>The deferred value lags behind the input, keeping the UI responsive.</p>
        <SearchWithDeferred />
      </section>

      <section style={sectionStyle}>
        <h2>3. useId — Accessible Forms</h2>
        <AccessibleForm />
      </section>

      <section style={sectionStyle}>
        <h2>4. Suspense + React.lazy</h2>
        <LazyDemo />
      </section>

      <section style={sectionStyle}>
        <h2>5. Automatic Batching</h2>
        <BatchingDemo />
      </section>
    </div>
  );
}
