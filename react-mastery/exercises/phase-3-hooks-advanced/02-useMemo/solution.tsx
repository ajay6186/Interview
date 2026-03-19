import React, { useState, useMemo, useRef, memo } from "react";

// ============================================================
// Solution: useMemo — Expensive Computations & Stable References
// ============================================================

// --- Helper: find all primes up to max (trial division) ---
function findPrimes(max: number): number[] {
  const primes: number[] = [];
  for (let n = 2; n <= max; n++) {
    let isPrime = true;
    for (let d = 2; d * d <= n; d++) {
      if (n % d === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) primes.push(n);
  }
  return primes;
}

// --- 1. Without useMemo: recomputes every render ---
function UnmemoizedPrimes() {
  const [max, setMax] = useState(20000);
  const [color, setColor] = useState("black");

  const start = performance.now();
  const primes = findPrimes(max);
  const elapsed = (performance.now() - start).toFixed(2);

  return (
    <section style={{ padding: 16, marginBottom: 16, color }}>
      <h2>1. Without useMemo</h2>
      <p>
        Primes up to {max}: <strong>{primes.length}</strong> found in{" "}
        <strong>{elapsed} ms</strong>
      </p>
      <button onClick={() => setMax((m) => m + 5000)}>Increase max (+5k)</button>
      <button onClick={() => setMax((m) => Math.max(2, m - 5000))}>
        Decrease max (-5k)
      </button>
      <button
        onClick={() => setColor((c) => (c === "black" ? "blue" : "black"))}
      >
        Toggle Color (unrelated re-render)
      </button>
      <p style={{ fontSize: 12, color: "#888" }}>
        Toggling color re-runs findPrimes even though max didn't change.
      </p>
    </section>
  );
}

// --- 2. With useMemo: only recomputes when max changes ---
function MemoizedPrimes() {
  const [max, setMax] = useState(20000);
  const [color, setColor] = useState("black");

  const { primes, elapsed } = useMemo(() => {
    const t0 = performance.now();
    const result = findPrimes(max);
    const t1 = performance.now();
    return { primes: result, elapsed: (t1 - t0).toFixed(2) };
  }, [max]);

  return (
    <section style={{ padding: 16, marginBottom: 16, color }}>
      <h2>2. With useMemo</h2>
      <p>
        Primes up to {max}: <strong>{primes.length}</strong> found in{" "}
        <strong>{elapsed} ms</strong>
      </p>
      <button onClick={() => setMax((m) => m + 5000)}>Increase max (+5k)</button>
      <button onClick={() => setMax((m) => Math.max(2, m - 5000))}>
        Decrease max (-5k)
      </button>
      <button
        onClick={() => setColor((c) => (c === "black" ? "blue" : "black"))}
      >
        Toggle Color (unrelated re-render)
      </button>
      <p style={{ fontSize: 12, color: "#888" }}>
        Toggling color does NOT re-run findPrimes — elapsed stays the same.
      </p>
    </section>
  );
}

// --- 3. Filtered List ---
function FilteredList() {
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(false);

  // Generate a large list once (empty deps = mount only)
  const items = useMemo(() => {
    const arr: string[] = [];
    const words = ["react", "hooks", "memo", "state", "effect", "reducer", "context", "ref", "callback", "layout"];
    for (let i = 0; i < 10000; i++) {
      arr.push(`${words[i % words.length]}-item-${i}`);
    }
    return arr;
  }, []);

  // Filtered results only recompute when query or items change
  const filtered = useMemo(() => {
    if (!query) return items.slice(0, 20);
    return items.filter((item) =>
      item.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, items]);

  return (
    <section style={{ padding: 16, marginBottom: 16 }}>
      <h2>3. Filtered List (useMemo)</h2>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search 10,000 items..."
        style={{ padding: 4, width: 300 }}
      />
      <button onClick={() => setHighlight((h) => !h)} style={{ marginLeft: 8 }}>
        Toggle Highlight (unrelated)
      </button>
      <p>
        Showing {Math.min(filtered.length, 20)} of {filtered.length} matches
      </p>
      <ul style={{ background: highlight ? "#ffffcc" : "transparent" }}>
        {filtered.slice(0, 20).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

// --- 4. Stable Object Reference ---
interface Config {
  theme: "light" | "dark";
  fontSize: number;
}

const ConfigDisplay = memo(function ConfigDisplay({ config }: { config: Config }) {
  const renderCount = useRef(0);
  renderCount.current += 1;

  return (
    <div
      style={{
        padding: 12,
        margin: 8,
        border: "1px solid #ccc",
        background: config.theme === "dark" ? "#333" : "#fff",
        color: config.theme === "dark" ? "#eee" : "#000",
        fontSize: config.fontSize,
      }}
    >
      <p>Theme: {config.theme} | Font: {config.fontSize}px</p>
      <p style={{ fontSize: 12, color: "#888" }}>
        ConfigDisplay renders: {renderCount.current}
      </p>
    </div>
  );
});

function StableReference() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [fontSize, setFontSize] = useState(16);
  const [unrelated, setUnrelated] = useState(0);

  // Without useMemo: { theme, fontSize } is a NEW object each render,
  // so ConfigDisplay (even with React.memo) would re-render every time.
  // With useMemo: the reference stays stable unless theme/fontSize change.
  const config = useMemo<Config>(
    () => ({ theme, fontSize }),
    [theme, fontSize]
  );

  return (
    <section style={{ padding: 16, marginBottom: 16 }}>
      <h2>4. Stable Object Reference (useMemo)</h2>
      <button onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}>
        Toggle Theme
      </button>
      <button onClick={() => setFontSize((s) => (s === 16 ? 20 : 16))}>
        Toggle Font Size
      </button>
      <button onClick={() => setUnrelated((n) => n + 1)}>
        Unrelated Update ({unrelated})
      </button>
      <p style={{ fontSize: 12, color: "#888" }}>
        "Unrelated Update" does NOT cause ConfigDisplay to re-render because
        the config object reference is stable (useMemo).
      </p>
      <ConfigDisplay config={config} />
    </section>
  );
}

export function App() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: 16 }}>
      <h1>Solution: useMemo</h1>
      <UnmemoizedPrimes />
      <MemoizedPrimes />
      <FilteredList />
      <StableReference />
    </div>
  );
}
