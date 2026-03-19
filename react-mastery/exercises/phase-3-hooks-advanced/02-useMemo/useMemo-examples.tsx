import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  memo,
  createContext,
  useContext,
  ReactNode,
} from "react";

// ─── BASIC (1–12) ────────────────────────────────────────────────────────────

function Ex01_Sum() {
  const [a, setA] = useState(3);
  const [b, setB] = useState(7);
  const sum = useMemo(() => a + b, [a, b]);
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input type="number" value={a} onChange={(e) => setA(Number(e.target.value))} style={{ width: 60 }} />
      <span>+</span>
      <input type="number" value={b} onChange={(e) => setB(Number(e.target.value))} style={{ width: 60 }} />
      <span>= {sum}</span>
    </div>
  );
}

function Ex02_Product() {
  const [a, setA] = useState(4);
  const [b, setB] = useState(5);
  const product = useMemo(() => a * b, [a, b]);
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input type="number" value={a} onChange={(e) => setA(Number(e.target.value))} style={{ width: 60 }} />
      <span>×</span>
      <input type="number" value={b} onChange={(e) => setB(Number(e.target.value))} style={{ width: 60 }} />
      <span>= {product}</span>
    </div>
  );
}

function Ex03_StringTransform() {
  const [text, setText] = useState("hello world");
  const transformed = useMemo(
    () =>
      text
        .trim()
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
    [text]
  );
  return (
    <div>
      <input value={text} onChange={(e) => setText(e.target.value)} style={{ width: 220 }} />
      <p>Title case: {transformed}</p>
    </div>
  );
}

function Ex04_Filter() {
  const [minAge, setMinAge] = useState(18);
  const people = useMemo(
    () => [
      { name: "Alice", age: 22 },
      { name: "Bob", age: 16 },
      { name: "Charlie", age: 30 },
      { name: "Diana", age: 15 },
    ],
    []
  );
  const adults = useMemo(() => people.filter((p) => p.age >= minAge), [people, minAge]);
  return (
    <div>
      <label>
        Min age:{" "}
        <input type="number" value={minAge} onChange={(e) => setMinAge(Number(e.target.value))} style={{ width: 60 }} />
      </label>
      <ul style={{ paddingLeft: 20, margin: "4px 0" }}>
        {adults.map((p) => <li key={p.name}>{p.name} ({p.age})</li>)}
      </ul>
    </div>
  );
}

function Ex05_Sort() {
  const [desc, setDesc] = useState(false);
  const raw = useMemo(() => [42, 7, 19, 3, 88, 55, 12], []);
  const sorted = useMemo(
    () => [...raw].sort((a, b) => (desc ? b - a : a - b)),
    [raw, desc]
  );
  return (
    <div>
      <button onClick={() => setDesc((d) => !d)}>
        Direction: {desc ? "DESC" : "ASC"}
      </button>
      <p>{sorted.join(", ")}</p>
    </div>
  );
}

function Ex06_BooleanDerived() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const isValid = useMemo(
    () => username.length >= 3 && password.length >= 6,
    [username, password]
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 220 }}>
      <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username (≥3)" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (≥6)" />
      <button disabled={!isValid} style={{ opacity: isValid ? 1 : 0.4 }}>
        Submit
      </button>
    </div>
  );
}

function Ex07_CountItems() {
  const [items, setItems] = useState(["apple", "banana", "cherry"]);
  const [draft, setDraft] = useState("");
  const count = useMemo(() => items.length, [items]);
  const charTotal = useMemo(() => items.reduce((acc, i) => acc + i.length, 0), [items]);
  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add item" />
        <button onClick={() => { if (draft.trim()) { setItems((i) => [...i, draft.trim()]); setDraft(""); } }}>Add</button>
      </div>
      <p>Count: {count} | Total chars: {charTotal}</p>
      <ul style={{ paddingLeft: 20, margin: 0 }}>{items.map((i) => <li key={i}>{i}</li>)}</ul>
    </div>
  );
}

function Ex08_MaxMin() {
  const [numbers, setNumbers] = useState([5, 2, 9, 1, 7]);
  const max = useMemo(() => Math.max(...numbers), [numbers]);
  const min = useMemo(() => Math.min(...numbers), [numbers]);
  const avg = useMemo(() => numbers.reduce((a, b) => a + b, 0) / numbers.length, [numbers]);
  return (
    <div>
      <p>Numbers: {numbers.join(", ")}</p>
      <p>Max: {max} | Min: {min} | Avg: {avg.toFixed(2)}</p>
      <button onClick={() => setNumbers((n) => [...n, Math.floor(Math.random() * 20)])}>
        Add random
      </button>
    </div>
  );
}

function Ex09_FormatDate() {
  const [timestamp, setTimestamp] = useState(Date.now());
  const formatted = useMemo(() => {
    const d = new Date(timestamp);
    return {
      date: d.toLocaleDateString(),
      time: d.toLocaleTimeString(),
      iso: d.toISOString(),
    };
  }, [timestamp]);
  return (
    <div>
      <button onClick={() => setTimestamp(Date.now())}>Refresh timestamp</button>
      <p>Date: {formatted.date}</p>
      <p>Time: {formatted.time}</p>
      <p style={{ fontSize: 12 }}>ISO: {formatted.iso}</p>
    </div>
  );
}

function Ex10_DerivedMessage() {
  const [score, setScore] = useState(50);
  const message = useMemo(() => {
    if (score >= 90) return { text: "Excellent!", color: "green" };
    if (score >= 70) return { text: "Good job!", color: "blue" };
    if (score >= 50) return { text: "Pass", color: "orange" };
    return { text: "Fail", color: "red" };
  }, [score]);
  return (
    <div>
      <input
        type="range"
        min={0}
        max={100}
        value={score}
        onChange={(e) => setScore(Number(e.target.value))}
        style={{ width: 200 }}
      />
      <span style={{ marginLeft: 12 }}>{score}</span>
      <p style={{ color: message.color, fontWeight: "bold" }}>{message.text}</p>
    </div>
  );
}

function Ex11_ObjectFromProps() {
  const [firstName, setFirstName] = useState("Jane");
  const [lastName, setLastName] = useState("Doe");
  const [age, setAge] = useState(28);
  const profile = useMemo(
    () => ({ fullName: `${firstName} ${lastName}`, age, initials: `${firstName[0]}${lastName[0]}` }),
    [firstName, lastName, age]
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: 200 }}>
      <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
      <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
      <input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} style={{ width: 80 }} />
      <pre style={{ fontSize: 12, margin: 0 }}>{JSON.stringify(profile, null, 2)}</pre>
    </div>
  );
}

function Ex12_ArraySlice() {
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(5);
  const source = useMemo(() => Array.from({ length: 20 }, (_, i) => i + 1), []);
  const slice = useMemo(() => source.slice(start, end), [source, start, end]);
  return (
    <div>
      <label>
        Start:{" "}
        <input type="number" value={start} min={0} max={19} onChange={(e) => setStart(Number(e.target.value))} style={{ width: 50 }} />
      </label>{" "}
      <label>
        End:{" "}
        <input type="number" value={end} min={1} max={20} onChange={(e) => setEnd(Number(e.target.value))} style={{ width: 50 }} />
      </label>
      <p>Slice [{start}:{end}]: [{slice.join(", ")}]</p>
    </div>
  );
}

// ─── INTERMEDIATE (13–25) ─────────────────────────────────────────────────────

function fib(n: number): number {
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) { const t = a + b; a = b; b = t; }
  return b;
}
function Ex13_ExpensiveFibonacci() {
  const [n, setN] = useState(10);
  const [tick, setTick] = useState(0);
  const result = useMemo(() => {
    const start = performance.now();
    const val = fib(n);
    const ms = (performance.now() - start).toFixed(3);
    return { val, ms };
  }, [n]);
  return (
    <div>
      <label>
        n:{" "}
        <input type="number" value={n} min={0} max={40} onChange={(e) => setN(Number(e.target.value))} style={{ width: 60 }} />
      </label>
      <p>fib({n}) = {result.val} (computed in {result.ms} ms)</p>
      <button onClick={() => setTick((t) => t + 1)}>Re-render (tick: {tick}) — memo not recomputed</button>
    </div>
  );
}

function Ex14_SearchFilter() {
  const [query, setQuery] = useState("");
  const items = useMemo(
    () =>
      Array.from({ length: 200 }, (_, i) => ({
        id: i,
        name: `Item ${i + 1}`,
        category: i % 3 === 0 ? "A" : i % 3 === 1 ? "B" : "C",
      })),
    []
  );
  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      ),
    [items, query]
  );
  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search items…" />
      <p>{filtered.length} results</p>
      <ul style={{ height: 100, overflow: "auto", paddingLeft: 20, margin: 0 }}>
        {filtered.slice(0, 20).map((i) => <li key={i.id}>{i.name} [{i.category}]</li>)}
      </ul>
    </div>
  );
}

function Ex15_SortedListToggle() {
  const [asc, setAsc] = useState(true);
  const [items] = useState(["mango", "apple", "kiwi", "banana", "grape"]);
  const sorted = useMemo(
    () => [...items].sort((a, b) => (asc ? a.localeCompare(b) : b.localeCompare(a))),
    [items, asc]
  );
  return (
    <div>
      <button onClick={() => setAsc((v) => !v)}>
        Sort: {asc ? "A → Z" : "Z → A"}
      </button>
      <ol style={{ paddingLeft: 20, margin: "4px 0" }}>
        {sorted.map((i) => <li key={i}>{i}</li>)}
      </ol>
    </div>
  );
}

function Ex16_ChartData() {
  const [scale, setScale] = useState(1);
  const raw = useMemo(() => [10, 25, 13, 40, 28, 55, 32], []);
  const chartData = useMemo(
    () => raw.map((v) => ({ value: v * scale, height: `${v * scale * 2}px` })),
    [raw, scale]
  );
  return (
    <div>
      <label>
        Scale:{" "}
        <input
          type="range"
          min={0.5}
          max={3}
          step={0.5}
          value={scale}
          onChange={(e) => setScale(Number(e.target.value))}
          style={{ width: 120 }}
        />
        {scale}×
      </label>
      <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 80, marginTop: 8 }}>
        {chartData.map((d, i) => (
          <div
            key={i}
            style={{
              width: 24,
              height: d.height,
              maxHeight: "100%",
              background: "#4a90d9",
              borderRadius: 3,
              title: String(d.value),
            }}
            title={String(d.value)}
          />
        ))}
      </div>
    </div>
  );
}

function Ex17_CartTotal() {
  const [cart, setCart] = useState([
    { id: 1, name: "Widget", price: 9.99, qty: 2 },
    { id: 2, name: "Gadget", price: 24.99, qty: 1 },
    { id: 3, name: "Doohickey", price: 4.49, qty: 5 },
  ]);
  const subtotal = useMemo(() => cart.reduce((acc, i) => acc + i.price * i.qty, 0), [cart]);
  const tax = useMemo(() => subtotal * 0.08, [subtotal]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);
  return (
    <div>
      <ul style={{ paddingLeft: 20, margin: "0 0 8px" }}>
        {cart.map((item) => (
          <li key={item.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {item.name} × {item.qty} = ${(item.price * item.qty).toFixed(2)}
            <button onClick={() => setCart((c) => c.map((i) => i.id === item.id ? { ...i, qty: i.qty + 1 } : i))}>+</button>
          </li>
        ))}
      </ul>
      <p>Subtotal: ${subtotal.toFixed(2)} | Tax (8%): ${tax.toFixed(2)} | Total: ${total.toFixed(2)}</p>
    </div>
  );
}

function Ex18_MemoizedStyles() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [accent, setAccent] = useState("#4a90d9");
  const containerStyle = useMemo<React.CSSProperties>(
    () => ({
      background: theme === "dark" ? "#222" : "#fff",
      color: theme === "dark" ? "#eee" : "#111",
      border: `2px solid ${accent}`,
      padding: 12,
      borderRadius: 6,
    }),
    [theme, accent]
  );
  return (
    <div style={containerStyle}>
      <label>
        Theme:{" "}
        <select value={theme} onChange={(e) => setTheme(e.target.value as "light" | "dark")}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>{" "}
      <label>
        Accent: <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} />
      </label>
      <p>Themed content with memoized style object</p>
    </div>
  );
}

function Ex19_MultipleDeps() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(3);
  const [op, setOp] = useState<"+" | "*" | "**">("+");
  const result = useMemo(() => {
    switch (op) {
      case "+": return a + b;
      case "*": return a * b;
      case "**": return Math.pow(a, b);
    }
  }, [a, b, op]);
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input type="number" value={a} onChange={(e) => setA(Number(e.target.value))} style={{ width: 60 }} />
      <select value={op} onChange={(e) => setOp(e.target.value as "+" | "*" | "**")}>
        <option value="+">+</option>
        <option value="*">×</option>
        <option value="**">^</option>
      </select>
      <input type="number" value={b} onChange={(e) => setB(Number(e.target.value))} style={{ width: 60 }} />
      <span>= {result}</span>
    </div>
  );
}

function Ex20_ConditionalMemo() {
  const [enabled, setEnabled] = useState(true);
  const [n, setN] = useState(5);
  // When disabled, memo still runs but returns early-ish (shows pattern)
  const computedValue = useMemo(() => {
    if (!enabled) return null;
    return Array.from({ length: n }, (_, i) => (i + 1) * (i + 1));
  }, [enabled, n]);
  return (
    <div>
      <label>
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> Enable computation
      </label>{" "}
      <label>
        n:{" "}
        <input type="number" value={n} min={1} max={20} onChange={(e) => setN(Number(e.target.value))} style={{ width: 60 }} />
      </label>
      <p>{computedValue ? `Squares: ${computedValue.join(", ")}` : "Computation disabled"}</p>
    </div>
  );
}

function Ex21_WordFrequency() {
  const [text, setText] = useState("the quick brown fox jumps over the lazy dog the fox");
  const freq = useMemo(() => {
    const words = text.toLowerCase().trim().split(/\s+/);
    return words.reduce<Record<string, number>>((acc, w) => ({ ...acc, [w]: (acc[w] ?? 0) + 1 }), {});
  }, [text]);
  const sorted = useMemo(
    () => Object.entries(freq).sort((a, b) => b[1] - a[1]),
    [freq]
  );
  return (
    <div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} style={{ width: "100%", height: 50 }} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
        {sorted.slice(0, 8).map(([w, c]) => (
          <span key={w} style={{ background: "#eee", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>
            {w}: {c}
          </span>
        ))}
      </div>
    </div>
  );
}

function Ex22_MemoWithCallback() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const data = useMemo(() => Array.from({ length: 100 }, (_, i) => `Entry ${i + 1}`), []);
  const filtered = useMemo(
    () => data.filter((d) => d.toLowerCase().includes(query.toLowerCase())),
    [data, query]
  );
  const paginated = useMemo(() => filtered.slice((page - 1) * 8, page * 8), [filtered, page]);
  const handleQuery = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setPage(1);
  }, []);
  return (
    <div>
      <input value={query} onChange={handleQuery} placeholder="Filter…" />
      <ul style={{ paddingLeft: 20, margin: "4px 0" }}>
        {paginated.map((d) => <li key={d}>{d}</li>)}
      </ul>
      <span style={{ fontSize: 12 }}>{filtered.length} results | page {page}</span>{" "}
      <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>{" "}
      <button onClick={() => setPage((p) => p + 1)} disabled={page * 8 >= filtered.length}>Next</button>
    </div>
  );
}

function Ex23_MemoAsEffectDep() {
  const [ids, setIds] = useState([1, 2, 3]);
  const [loaded, setLoaded] = useState<Record<number, string>>({});
  // Memoized params object — only changes when ids changes
  const params = useMemo(() => ({ ids: [...ids].sort().join(",") }), [ids]);
  useEffect(() => {
    setLoaded({});
    const timer = setTimeout(() => {
      const result: Record<number, string> = {};
      ids.forEach((id) => { result[id] = `Data for ID ${id}`; });
      setLoaded(result);
    }, 400);
    return () => clearTimeout(timer);
  }, [params, ids]);
  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        {[1, 2, 3, 4, 5].map((id) => (
          <button
            key={id}
            onClick={() =>
              setIds((prev) =>
                prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
              )
            }
            style={{ fontWeight: ids.includes(id) ? "bold" : "normal" }}
          >
            ID {id}
          </button>
        ))}
      </div>
      <ul style={{ paddingLeft: 20, margin: "4px 0" }}>
        {Object.entries(loaded).map(([id, val]) => <li key={id}>{val}</li>)}
      </ul>
    </div>
  );
}

function Ex24_TableData() {
  const [sortKey, setSortKey] = useState<"name" | "age" | "score">("name");
  const [sortAsc, setSortAsc] = useState(true);
  const rawData = useMemo(
    () => [
      { name: "Alice", age: 30, score: 88 },
      { name: "Bob", age: 25, score: 74 },
      { name: "Charlie", age: 35, score: 95 },
      { name: "Diana", age: 28, score: 82 },
    ],
    []
  );
  const sorted = useMemo(
    () =>
      [...rawData].sort((a, b) => {
        const va = a[sortKey];
        const vb = b[sortKey];
        const cmp = typeof va === "string" ? va.localeCompare(String(vb)) : (va as number) - (vb as number);
        return sortAsc ? cmp : -cmp;
      }),
    [rawData, sortKey, sortAsc]
  );
  const toggleSort = (key: typeof sortKey) => {
    if (key === sortKey) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(true); }
  };
  return (
    <table style={{ borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr>
          {(["name", "age", "score"] as const).map((k) => (
            <th
              key={k}
              onClick={() => toggleSort(k)}
              style={{ cursor: "pointer", padding: "4px 12px", background: "#eee" }}
            >
              {k} {sortKey === k ? (sortAsc ? "↑" : "↓") : ""}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map((row) => (
          <tr key={row.name}>
            <td style={{ padding: "4px 12px" }}>{row.name}</td>
            <td style={{ padding: "4px 12px" }}>{row.age}</td>
            <td style={{ padding: "4px 12px" }}>{row.score}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Ex25_PipelineMemo() {
  const [input, setInput] = useState("  React is awesome!  ");
  const [reverse, setReverse] = useState(false);
  const trimmed = useMemo(() => input.trim(), [input]);
  const words = useMemo(() => trimmed.split(/\s+/), [trimmed]);
  const processed = useMemo(
    () => (reverse ? [...words].reverse() : words),
    [words, reverse]
  );
  const result = useMemo(() => processed.join(" | "), [processed]);
  return (
    <div>
      <input value={input} onChange={(e) => setInput(e.target.value)} style={{ width: "100%" }} />
      <label>
        <input type="checkbox" checked={reverse} onChange={(e) => setReverse(e.target.checked)} />{" "}
        Reverse words
      </label>
      <p style={{ fontFamily: "monospace" }}>{result}</p>
    </div>
  );
}

// ─── NESTED (26–37) ───────────────────────────────────────────────────────────

function Ex26_ChainedMemos() {
  const [n, setN] = useState(4);
  const squares = useMemo(() => Array.from({ length: n }, (_, i) => (i + 1) ** 2), [n]);
  const cubes = useMemo(() => Array.from({ length: n }, (_, i) => (i + 1) ** 3), [n]);
  const combined = useMemo(
    () => squares.map((sq, i) => ({ i: i + 1, sq, cube: cubes[i], ratio: (cubes[i] / sq).toFixed(2) })),
    [squares, cubes]
  );
  return (
    <div>
      <label>
        n:{" "}
        <input type="number" value={n} min={1} max={10} onChange={(e) => setN(Number(e.target.value))} style={{ width: 60 }} />
      </label>
      <table style={{ borderCollapse: "collapse", fontSize: 12, marginTop: 4 }}>
        <thead><tr>{["i", "i²", "i³", "ratio"].map((h) => <th key={h} style={{ padding: "2px 8px", background: "#eee" }}>{h}</th>)}</tr></thead>
        <tbody>
          {combined.map((r) => (
            <tr key={r.i}>
              <td style={{ padding: "2px 8px" }}>{r.i}</td>
              <td style={{ padding: "2px 8px" }}>{r.sq}</td>
              <td style={{ padding: "2px 8px" }}>{r.cube}</td>
              <td style={{ padding: "2px 8px" }}>{r.ratio}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Ex27_MemoOfMemoResult() {
  const [items] = useState([3, 1, 4, 1, 5, 9, 2, 6]);
  const [threshold, setThreshold] = useState(4);
  const sorted = useMemo(() => [...items].sort((a, b) => a - b), [items]);
  const filtered = useMemo(() => sorted.filter((n) => n >= threshold), [sorted, threshold]);
  const stats = useMemo(
    () => ({
      count: filtered.length,
      sum: filtered.reduce((a, b) => a + b, 0),
      avg: filtered.length ? (filtered.reduce((a, b) => a + b, 0) / filtered.length).toFixed(2) : "–",
    }),
    [filtered]
  );
  return (
    <div>
      <label>
        Threshold:{" "}
        <input
          type="range"
          min={1}
          max={10}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          style={{ width: 120 }}
        />
        {threshold}
      </label>
      <p>Sorted: [{sorted.join(", ")}]</p>
      <p>Filtered (≥{threshold}): [{filtered.join(", ")}]</p>
      <p>Count: {stats.count} | Sum: {stats.sum} | Avg: {stats.avg}</p>
    </div>
  );
}

function Ex28_NestedObjectComputation() {
  const [config, setConfig] = useState({ rows: 3, cols: 3, fill: "X" });
  const grid = useMemo(
    () =>
      Array.from({ length: config.rows }, (_, r) =>
        Array.from({ length: config.cols }, (_, c) => `${config.fill}${r}${c}`)
      ),
    [config]
  );
  const flat = useMemo(() => grid.flat(), [grid]);
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <label>Rows: <input type="number" value={config.rows} min={1} max={6} onChange={(e) => setConfig((c) => ({ ...c, rows: Number(e.target.value) }))} style={{ width: 50 }} /></label>
        <label>Cols: <input type="number" value={config.cols} min={1} max={6} onChange={(e) => setConfig((c) => ({ ...c, cols: Number(e.target.value) }))} style={{ width: 50 }} /></label>
        <label>Fill: <input value={config.fill} maxLength={2} onChange={(e) => setConfig((c) => ({ ...c, fill: e.target.value }))} style={{ width: 40 }} /></label>
      </div>
      <div>
        {grid.map((row, r) => (
          <div key={r} style={{ display: "flex", gap: 2 }}>
            {row.map((cell, c) => (
              <span key={c} style={{ padding: "2px 6px", background: "#eef", borderRadius: 3, fontSize: 12 }}>{cell}</span>
            ))}
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, marginTop: 4 }}>Total cells: {flat.length}</p>
    </div>
  );
}

type TreeNode = { id: number; name: string; children?: TreeNode[] };
function Ex29_MemoizedTreeData() {
  const [expanded, setExpanded] = useState<Set<number>>(new Set([1]));
  const tree = useMemo<TreeNode>(
    () => ({
      id: 1,
      name: "Root",
      children: [
        { id: 2, name: "Branch A", children: [{ id: 4, name: "Leaf A1" }, { id: 5, name: "Leaf A2" }] },
        { id: 3, name: "Branch B", children: [{ id: 6, name: "Leaf B1" }] },
      ],
    }),
    []
  );
  const toggle = useCallback((id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);
  function renderNode(node: TreeNode, depth = 0): JSX.Element {
    const isOpen = expanded.has(node.id);
    return (
      <div key={node.id} style={{ paddingLeft: depth * 16 }}>
        <span
          onClick={() => node.children && toggle(node.id)}
          style={{ cursor: node.children ? "pointer" : "default", userSelect: "none" }}
        >
          {node.children ? (isOpen ? "▼ " : "▶ ") : "• "}
          {node.name}
        </span>
        {isOpen && node.children?.map((c) => renderNode(c, depth + 1))}
      </div>
    );
  }
  return <div style={{ fontFamily: "monospace", fontSize: 13 }}>{renderNode(tree)}</div>;
}

function Ex30_GroupedData() {
  const [groupBy, setGroupBy] = useState<"category" | "status">("category");
  const items = useMemo(
    () => [
      { name: "Widget A", category: "Tools", status: "active" },
      { name: "Widget B", category: "Tools", status: "inactive" },
      { name: "Gadget X", category: "Electronics", status: "active" },
      { name: "Gadget Y", category: "Electronics", status: "active" },
      { name: "Part Z", category: "Parts", status: "inactive" },
    ],
    []
  );
  const grouped = useMemo(
    () =>
      items.reduce<Record<string, typeof items>>(
        (acc, item) => {
          const key = item[groupBy];
          return { ...acc, [key]: [...(acc[key] ?? []), item] };
        },
        {}
      ),
    [items, groupBy]
  );
  return (
    <div>
      <label>
        Group by:{" "}
        <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as typeof groupBy)}>
          <option value="category">Category</option>
          <option value="status">Status</option>
        </select>
      </label>
      {Object.entries(grouped).map(([key, list]) => (
        <div key={key} style={{ marginTop: 8 }}>
          <strong>{key}</strong>
          <ul style={{ margin: "2px 0", paddingLeft: 20 }}>
            {list.map((i) => <li key={i.name}>{i.name}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Ex31_MatrixOperations() {
  const [scale, setScale] = useState(2);
  const matrix = useMemo(() => [[1, 2, 3], [4, 5, 6], [7, 8, 9]], []);
  const scaled = useMemo(() => matrix.map((row) => row.map((v) => v * scale)), [matrix, scale]);
  const transposed = useMemo(
    () => scaled[0].map((_, ci) => scaled.map((row) => row[ci])),
    [scaled]
  );
  const trace = useMemo(() => scaled.reduce((sum, row, i) => sum + row[i], 0), [scaled]);
  return (
    <div>
      <label>
        Scale:{" "}
        <input type="number" value={scale} min={1} max={5} onChange={(e) => setScale(Number(e.target.value))} style={{ width: 60 }} />
      </label>
      <div style={{ display: "flex", gap: 24, marginTop: 8 }}>
        {[{ label: "Scaled", m: scaled }, { label: "Transposed", m: transposed }].map(({ label, m }) => (
          <div key={label}>
            <p style={{ margin: "0 0 4px", fontSize: 12 }}>{label}</p>
            {m.map((row, r) => (
              <div key={r} style={{ display: "flex", gap: 4 }}>
                {row.map((v, c) => (
                  <span key={c} style={{ padding: "1px 6px", background: "#eef", borderRadius: 3, fontFamily: "monospace", fontSize: 12 }}>
                    {v}
                  </span>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12 }}>Trace (scaled): {trace}</p>
    </div>
  );
}

type SelectorCtx = { items: string[]; selected: Set<string> };
const SelCtx = createContext<SelectorCtx>({ items: [], selected: new Set() });
const MemoChild32 = memo(({ item }: { item: string }) => {
  const { selected } = useContext(SelCtx);
  const isSelected = useMemo(() => selected.has(item), [selected, item]);
  return (
    <span style={{ padding: "2px 8px", borderRadius: 4, background: isSelected ? "#4a90d9" : "#eee", color: isSelected ? "#fff" : "#333", marginRight: 4 }}>
      {item}
    </span>
  );
});
function Ex32_MemoInContext() {
  const items = useMemo(() => ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"], []);
  const [selected, setSelected] = useState<Set<string>>(new Set(["Beta"]));
  const ctx = useMemo(() => ({ items, selected }), [items, selected]);
  const toggleItem = useCallback((item: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(item) ? next.delete(item) : next.add(item);
      return next;
    });
  }, []);
  return (
    <SelCtx.Provider value={ctx}>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
        {items.map((item) => (
          <span key={item} onClick={() => toggleItem(item)} style={{ cursor: "pointer" }}>
            <MemoChild32 item={item} />
          </span>
        ))}
      </div>
      <p style={{ fontSize: 12 }}>Selected: {[...selected].join(", ") || "none"}</p>
    </SelCtx.Provider>
  );
}

function Ex33_DerivedPermissions() {
  const [role, setRole] = useState<"admin" | "editor" | "viewer">("viewer");
  const [resource, setResource] = useState<"posts" | "users" | "settings">("posts");
  const permissions = useMemo<Record<string, Record<string, boolean>>>(
    () => ({
      admin: { posts: true, users: true, settings: true },
      editor: { posts: true, users: false, settings: false },
      viewer: { posts: false, users: false, settings: false },
    }),
    []
  );
  const canAccess = useMemo(
    () => permissions[role]?.[resource] ?? false,
    [permissions, role, resource]
  );
  const visibleActions = useMemo(
    () =>
      Object.entries(permissions[role] ?? {})
        .filter(([, allowed]) => allowed)
        .map(([r]) => r),
    [permissions, role]
  );
  return (
    <div>
      <label>
        Role:{" "}
        <select value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
          <option value="admin">Admin</option>
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>
      </label>{" "}
      <label>
        Resource:{" "}
        <select value={resource} onChange={(e) => setResource(e.target.value as typeof resource)}>
          <option value="posts">Posts</option>
          <option value="users">Users</option>
          <option value="settings">Settings</option>
        </select>
      </label>
      <p style={{ color: canAccess ? "green" : "red" }}>
        {canAccess ? `Access GRANTED to ${resource}` : `Access DENIED to ${resource}`}
      </p>
      <p style={{ fontSize: 12 }}>Accessible resources: {visibleActions.join(", ") || "none"}</p>
    </div>
  );
}

function Ex34_NestedMemoProviders() {
  const [multiplier, setMultiplier] = useState(2);
  const [offset, setOffset] = useState(10);
  const [values] = useState([1, 2, 3, 4, 5]);
  const multiplied = useMemo(() => values.map((v) => v * multiplier), [values, multiplier]);
  const shifted = useMemo(() => multiplied.map((v) => v + offset), [multiplied, offset]);
  const normalized = useMemo(() => {
    const min = Math.min(...shifted);
    const max = Math.max(...shifted);
    return shifted.map((v) => ((v - min) / (max - min || 1)).toFixed(3));
  }, [shifted]);
  return (
    <div>
      <div style={{ display: "flex", gap: 12 }}>
        <label>Multiplier: <input type="number" value={multiplier} min={1} max={10} onChange={(e) => setMultiplier(Number(e.target.value))} style={{ width: 60 }} /></label>
        <label>Offset: <input type="number" value={offset} onChange={(e) => setOffset(Number(e.target.value))} style={{ width: 60 }} /></label>
      </div>
      <p>Original: [{values.join(", ")}]</p>
      <p>×{multiplier}: [{multiplied.join(", ")}]</p>
      <p>+{offset}: [{shifted.join(", ")}]</p>
      <p>Normalized: [{normalized.join(", ")}]</p>
    </div>
  );
}

function Ex35_MemoizedVirtualList() {
  const [filter, setFilter] = useState("");
  const [highlight, setHighlight] = useState(false);
  const allData = useMemo(() => Array.from({ length: 500 }, (_, i) => `Row ${i + 1} — data point`), []);
  const filtered = useMemo(
    () => allData.filter((d) => d.toLowerCase().includes(filter.toLowerCase())),
    [allData, filter]
  );
  const visible = useMemo(() => filtered.slice(0, 20), [filtered]);
  const rowStyle = useMemo<React.CSSProperties>(
    () => ({ background: highlight ? "#fffde7" : "transparent", padding: "2px 0" }),
    [highlight]
  );
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter 500 rows…" />
        <label><input type="checkbox" checked={highlight} onChange={(e) => setHighlight(e.target.checked)} /> Highlight</label>
      </div>
      <div style={{ height: 120, overflow: "auto" }}>
        {visible.map((row) => <div key={row} style={rowStyle}>{row}</div>)}
      </div>
      <p style={{ fontSize: 12 }}>{filtered.length} matches, showing first 20</p>
    </div>
  );
}

type MemoCtxVal = { data: number[]; sum: number; avg: number };
const MemoCtx36 = createContext<MemoCtxVal>({ data: [], sum: 0, avg: 0 });
function StatsDisplay36() {
  const { data, sum, avg } = useContext(MemoCtx36);
  return <p>n={data.length} | sum={sum} | avg={avg.toFixed(2)}</p>;
}
function Ex36_MemoInProvider() {
  const [items, setItems] = useState([10, 20, 30]);
  const value = useMemo<MemoCtxVal>(
    () => ({
      data: items,
      sum: items.reduce((a, b) => a + b, 0),
      avg: items.reduce((a, b) => a + b, 0) / (items.length || 1),
    }),
    [items]
  );
  return (
    <MemoCtx36.Provider value={value}>
      <StatsDisplay36 />
      <button onClick={() => setItems((i) => [...i, Math.floor(Math.random() * 100)])}>Add random</button>
      <button onClick={() => setItems((i) => i.slice(0, -1))} style={{ marginLeft: 8 }}>Remove last</button>
    </MemoCtx36.Provider>
  );
}

function Ex37_SelectorPattern() {
  const [state, setState] = useState({ users: [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }], activeId: 1 });
  const activeUser = useMemo(
    () => state.users.find((u) => u.id === state.activeId) ?? null,
    [state.users, state.activeId]
  );
  const otherUsers = useMemo(
    () => state.users.filter((u) => u.id !== state.activeId),
    [state.users, state.activeId]
  );
  return (
    <div>
      <p>Active: <strong>{activeUser?.name ?? "none"}</strong></p>
      <p>Others: {otherUsers.map((u) => u.name).join(", ")}</p>
      <div style={{ display: "flex", gap: 8 }}>
        {state.users.map((u) => (
          <button
            key={u.id}
            onClick={() => setState((s) => ({ ...s, activeId: u.id }))}
            style={{ fontWeight: u.id === state.activeId ? "bold" : "normal" }}
          >
            {u.name}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── ADVANCED (38–50) ─────────────────────────────────────────────────────────

function Ex38_VsUseStateComparison() {
  const [count, setCount] = useState(0);
  const memoRenders = useRef(0);
  const stateRenders = useRef(0);
  // derived via useMemo
  const doubled = useMemo(() => { memoRenders.current++; return count * 2; }, [count]);
  // derived via useState (requires manual sync)
  const [doubledState, setDoubledState] = useState(0);
  useEffect(() => { stateRenders.current++; setDoubledState(count * 2); }, [count]);
  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>count = {count}</button>
      <p>useMemo doubled: {doubled} (memo runs: {memoRenders.current})</p>
      <p>useState doubled: {doubledState} (effect runs: {stateRenders.current})</p>
      <p style={{ fontSize: 12, color: "#888" }}>useMemo is synchronous; useEffect introduces one render lag.</p>
    </div>
  );
}

const MemoChild39 = memo(function MemoChild39({ config }: { config: { label: string; color: string } }) {
  const rc = useRef(0);
  rc.current++;
  return (
    <div style={{ padding: 8, background: config.color, borderRadius: 4, color: "#fff" }}>
      {config.label} — renders: {rc.current}
    </div>
  );
});
function Ex39_WithReactMemo() {
  const [theme, setTheme] = useState<"blue" | "green">("blue");
  const [tick, setTick] = useState(0);
  const config = useMemo(
    () => ({ label: `Theme: ${theme}`, color: theme === "blue" ? "#4a90d9" : "#5cb85c" }),
    [theme]
  );
  return (
    <div>
      <button onClick={() => setTheme((t) => (t === "blue" ? "green" : "blue"))}>Toggle theme</button>{" "}
      <button onClick={() => setTick((t) => t + 1)}>Tick ({tick}) — child won't re-render</button>
      <div style={{ marginTop: 8 }}>
        <MemoChild39 config={config} />
      </div>
    </div>
  );
}

function Ex40_MemoAPIParams() {
  const [userId, setUserId] = useState(1);
  const [includeDetails, setIncludeDetails] = useState(false);
  const [fetchCount, setFetchCount] = useState(0);
  const params = useMemo(
    () => ({ userId, include: includeDetails ? "details" : "basic" }),
    [userId, includeDetails]
  );
  useEffect(() => {
    setFetchCount((c) => c + 1);
  }, [params]);
  return (
    <div>
      <label>
        User ID:{" "}
        <input type="number" value={userId} min={1} onChange={(e) => setUserId(Number(e.target.value))} style={{ width: 60 }} />
      </label>{" "}
      <label>
        <input type="checkbox" checked={includeDetails} onChange={(e) => setIncludeDetails(e.target.checked)} /> Include details
      </label>
      <p>Fetch params: {JSON.stringify(params)}</p>
      <p>Times fetched (effect fired): {fetchCount}</p>
    </div>
  );
}

function Ex41_MemoizedHandlersObject() {
  const [log, setLog] = useState<string[]>([]);
  const addLog = useCallback((msg: string) => setLog((l) => [...l.slice(-4), msg]), []);
  const handlers = useMemo(
    () => ({
      onSave: () => addLog("save"),
      onDelete: () => addLog("delete"),
      onPublish: () => addLog("publish"),
      onArchive: () => addLog("archive"),
    }),
    [addLog]
  );
  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handlers.onSave}>Save</button>
        <button onClick={handlers.onDelete}>Delete</button>
        <button onClick={handlers.onPublish}>Publish</button>
        <button onClick={handlers.onArchive}>Archive</button>
      </div>
      <ul style={{ margin: "4px 0", paddingLeft: 20, fontSize: 12 }}>
        {log.map((l, i) => <li key={i}>{l}</li>)}
      </ul>
    </div>
  );
}

function useMemoSelector<T, R>(source: T, selector: (s: T) => R): R {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => selector(source), [source]);
}
function Ex42_CustomMemoSelector() {
  const [state] = useState({
    products: [
      { id: 1, name: "A", price: 10, inStock: true },
      { id: 2, name: "B", price: 25, inStock: false },
      { id: 3, name: "C", price: 8, inStock: true },
    ],
  });
  const inStock = useMemoSelector(state, (s) => s.products.filter((p) => p.inStock));
  const totalValue = useMemoSelector(inStock, (products) =>
    products.reduce((acc, p) => acc + p.price, 0)
  );
  return (
    <div>
      <ul style={{ paddingLeft: 20, margin: 0 }}>
        {inStock.map((p) => <li key={p.id}>{p.name} — ${p.price}</li>)}
      </ul>
      <p>Total in-stock value: ${totalValue}</p>
    </div>
  );
}

function Ex43_ComputedStyles() {
  const [fontSize, setFontSize] = useState(14);
  const [bold, setBold] = useState(false);
  const [color, setColor] = useState("#333333");
  const textStyle = useMemo<React.CSSProperties>(
    () => ({ fontSize, fontWeight: bold ? "bold" : "normal", color, lineHeight: 1.5 }),
    [fontSize, bold, color]
  );
  const containerStyle = useMemo<React.CSSProperties>(
    () => ({ border: `2px solid ${color}`, padding: 12, borderRadius: 6 }),
    [color]
  );
  return (
    <div style={containerStyle}>
      <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
        <label>Size: <input type="number" value={fontSize} min={10} max={32} onChange={(e) => setFontSize(Number(e.target.value))} style={{ width: 50 }} /></label>
        <label><input type="checkbox" checked={bold} onChange={(e) => setBold(e.target.checked)} /> Bold</label>
        <label>Color: <input type="color" value={color} onChange={(e) => setColor(e.target.value)} /></label>
      </div>
      <p style={textStyle}>The quick brown fox jumps over the lazy dog.</p>
    </div>
  );
}

function Ex44_BenchmarkMemo() {
  const [n, setN] = useState(30);
  const [tick, setTick] = useState(0);
  const memoResult = useMemo(() => fib(n), [n]);
  const [inlineResult] = useState(() => fib(n));
  const memoTime = useMemo(() => {
    const start = performance.now();
    fib(n);
    return (performance.now() - start).toFixed(4);
  }, [n]);
  return (
    <div>
      <label>
        n:{" "}
        <input type="number" value={n} min={0} max={40} onChange={(e) => setN(Number(e.target.value))} style={{ width: 60 }} />
      </label>{" "}
      <button onClick={() => setTick((t) => t + 1)}>Re-render (tick: {tick})</button>
      <p>Memoized fib({n}): {memoResult} (last compute: {memoTime} ms)</p>
      <p style={{ fontSize: 12, color: "#888" }}>useMemo skips recomputation on tick-only re-renders.</p>
      <p style={{ fontSize: 12, color: "#888" }}>Inline (at mount): {inlineResult}</p>
    </div>
  );
}

function Ex45_ReactiveDerivedState() {
  const [items, setItems] = useState([
    { id: 1, done: false, text: "Buy groceries" },
    { id: 2, done: true, text: "Read book" },
    { id: 3, done: false, text: "Exercise" },
  ]);
  const stats = useMemo(() => ({
    total: items.length,
    done: items.filter((i) => i.done).length,
    pending: items.filter((i) => !i.done).length,
    pct: items.length ? Math.round((items.filter((i) => i.done).length / items.length) * 100) : 0,
  }), [items]);
  const toggle = useCallback((id: number) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, done: !i.done } : i));
  }, []);
  return (
    <div>
      <ul style={{ paddingLeft: 20, margin: "0 0 8px" }}>
        {items.map((item) => (
          <li key={item.id} style={{ cursor: "pointer", textDecoration: item.done ? "line-through" : "none" }} onClick={() => toggle(item.id)}>
            {item.text}
          </li>
        ))}
      </ul>
      <p>Total: {stats.total} | Done: {stats.done} | Pending: {stats.pending} | {stats.pct}% complete</p>
    </div>
  );
}

function Ex46_MemoWithAsyncData() {
  const [rawData, setRawData] = useState<{ id: number; value: number }[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setRawData(Array.from({ length: 20 }, (_, i) => ({ id: i + 1, value: Math.floor(Math.random() * 100) })));
      setLoaded(true);
    }, 600);
  }, []);
  const processed = useMemo(() => {
    if (!loaded) return null;
    const sorted = [...rawData].sort((a, b) => b.value - a.value);
    const top5 = sorted.slice(0, 5);
    const sum = rawData.reduce((acc, d) => acc + d.value, 0);
    return { top5, sum, avg: (sum / rawData.length).toFixed(1) };
  }, [rawData, loaded]);
  return (
    <div>
      {!loaded ? (
        <p>Loading data…</p>
      ) : (
        <>
          <p>Sum: {processed?.sum} | Avg: {processed?.avg}</p>
          <p>Top 5: {processed?.top5.map((d) => `#${d.id}(${d.value})`).join(", ")}</p>
        </>
      )}
    </div>
  );
}

function Ex47_MemoComputedConfig() {
  const [lang, setLang] = useState<"en" | "es" | "fr">("en");
  const [darkMode, setDarkMode] = useState(false);
  const appConfig = useMemo(
    () => ({
      locale: lang,
      currency: lang === "en" ? "USD" : lang === "es" ? "EUR" : "EUR",
      dateFormat: lang === "en" ? "MM/DD/YYYY" : "DD/MM/YYYY",
      theme: darkMode ? { bg: "#222", fg: "#eee" } : { bg: "#fff", fg: "#111" },
      labels: {
        en: { hello: "Hello", bye: "Goodbye" },
        es: { hello: "Hola", bye: "Adiós" },
        fr: { hello: "Bonjour", bye: "Au revoir" },
      }[lang],
    }),
    [lang, darkMode]
  );
  return (
    <div style={{ background: appConfig.theme.bg, color: appConfig.theme.fg, padding: 12, borderRadius: 6 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <select value={lang} onChange={(e) => setLang(e.target.value as typeof lang)}>
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
        </select>
        <label><input type="checkbox" checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} /> Dark</label>
      </div>
      <p>{appConfig.labels.hello}! Currency: {appConfig.currency} | Date: {appConfig.dateFormat}</p>
    </div>
  );
}

function Ex48_MemoPreventsCascade() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState("Alice");
  // This object only changes when `name` changes, not when `count` changes
  const userConfig = useMemo(() => ({ name, greeting: `Hello, ${name}!` }), [name]);
  const ChildA = memo(({ cfg }: { cfg: { name: string; greeting: string } }) => {
    const rc = useRef(0);
    rc.current++;
    return <p style={{ fontSize: 12 }}>ChildA renders: {rc.current} | {cfg.greeting}</p>;
  });
  const ChildB = ({ tick }: { tick: number }) => {
    const rc = useRef(0);
    rc.current++;
    return <p style={{ fontSize: 12 }}>ChildB renders: {rc.current} | tick: {tick}</p>;
  };
  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />{" "}
      <button onClick={() => setCount((c) => c + 1)}>Tick ({count})</button>
      <ChildA cfg={userConfig} />
      <ChildB tick={count} />
    </div>
  );
}

function useExpensiveComputation(data: number[], threshold: number) {
  return useMemo(() => {
    const filtered = data.filter((d) => d > threshold);
    const sum = filtered.reduce((a, b) => a + b, 0);
    const avg = filtered.length ? sum / filtered.length : 0;
    return { filtered, sum, avg: avg.toFixed(2) };
  }, [data, threshold]);
}
function Ex49_InCustomHook() {
  const data = useMemo(() => Array.from({ length: 100 }, (_, i) => i), []);
  const [threshold, setThreshold] = useState(50);
  const { filtered, sum, avg } = useExpensiveComputation(data, threshold);
  return (
    <div>
      <label>
        Threshold:{" "}
        <input type="range" min={0} max={99} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} style={{ width: 160 }} />
        {threshold}
      </label>
      <p>Count: {filtered.length} | Sum: {sum} | Avg: {avg}</p>
    </div>
  );
}

function Ex50_FullDerivedDashboard() {
  const [sales] = useState(() =>
    Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      revenue: Math.floor(Math.random() * 1000) + 100,
      units: Math.floor(Math.random() * 50) + 1,
      region: i % 3 === 0 ? "North" : i % 3 === 1 ? "South" : "East",
    }))
  );
  const [region, setRegion] = useState("All");
  const [sortBy, setSortBy] = useState<"revenue" | "units">("revenue");
  const regions = useMemo(() => ["All", ...new Set(sales.map((s) => s.region))], [sales]);
  const filtered = useMemo(
    () => (region === "All" ? sales : sales.filter((s) => s.region === region)),
    [sales, region]
  );
  const sorted = useMemo(
    () => [...filtered].sort((a, b) => b[sortBy] - a[sortBy]),
    [filtered, sortBy]
  );
  const totals = useMemo(
    () => ({
      revenue: filtered.reduce((a, s) => a + s.revenue, 0),
      units: filtered.reduce((a, s) => a + s.units, 0),
      avgRevenue: (filtered.reduce((a, s) => a + s.revenue, 0) / (filtered.length || 1)).toFixed(0),
    }),
    [filtered]
  );
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <label>
          Region:{" "}
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            {regions.map((r) => <option key={r}>{r}</option>)}
          </select>
        </label>
        <label>
          Sort:{" "}
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
            <option value="revenue">Revenue</option>
            <option value="units">Units</option>
          </select>
        </label>
      </div>
      <p>Revenue: ${totals.revenue.toLocaleString()} | Units: {totals.units} | Avg/day: ${totals.avgRevenue}</p>
      <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%" }}>
        <thead>
          <tr style={{ background: "#eee" }}>
            {["Day", "Region", "Revenue", "Units"].map((h) => <th key={h} style={{ padding: "3px 8px", textAlign: "left" }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {sorted.slice(0, 8).map((s) => (
            <tr key={s.day}>
              <td style={{ padding: "2px 8px" }}>{s.day}</td>
              <td style={{ padding: "2px 8px" }}>{s.region}</td>
              <td style={{ padding: "2px 8px" }}>${s.revenue}</td>
              <td style={{ padding: "2px 8px" }}>{s.units}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Examples registry ────────────────────────────────────────────────────────

const examples: { label: string; component: JSX.Element }[] = [
  { label: "01 [Basic] Sum", component: <Ex01_Sum /> },
  { label: "02 [Basic] Product", component: <Ex02_Product /> },
  { label: "03 [Basic] String transform (title case)", component: <Ex03_StringTransform /> },
  { label: "04 [Basic] Filter list", component: <Ex04_Filter /> },
  { label: "05 [Basic] Sort with direction", component: <Ex05_Sort /> },
  { label: "06 [Basic] Boolean derived (form validity)", component: <Ex06_BooleanDerived /> },
  { label: "07 [Basic] Count items + char total", component: <Ex07_CountItems /> },
  { label: "08 [Basic] Max / Min / Avg", component: <Ex08_MaxMin /> },
  { label: "09 [Basic] Format date", component: <Ex09_FormatDate /> },
  { label: "10 [Basic] Derived message from score", component: <Ex10_DerivedMessage /> },
  { label: "11 [Basic] Object derived from props", component: <Ex11_ObjectFromProps /> },
  { label: "12 [Basic] Array slice", component: <Ex12_ArraySlice /> },
  { label: "13 [Intermediate] Expensive Fibonacci", component: <Ex13_ExpensiveFibonacci /> },
  { label: "14 [Intermediate] Search filter (200 items)", component: <Ex14_SearchFilter /> },
  { label: "15 [Intermediate] Sorted list with toggle", component: <Ex15_SortedListToggle /> },
  { label: "16 [Intermediate] Chart data with scale", component: <Ex16_ChartData /> },
  { label: "17 [Intermediate] Cart total (subtotal + tax)", component: <Ex17_CartTotal /> },
  { label: "18 [Intermediate] Memoized style object", component: <Ex18_MemoizedStyles /> },
  { label: "19 [Intermediate] Multiple deps (operator)", component: <Ex19_MultipleDeps /> },
  { label: "20 [Intermediate] Conditional memo", component: <Ex20_ConditionalMemo /> },
  { label: "21 [Intermediate] Word frequency map", component: <Ex21_WordFrequency /> },
  { label: "22 [Intermediate] useMemo + useCallback (filter+paginate)", component: <Ex22_MemoWithCallback /> },
  { label: "23 [Intermediate] useMemo as useEffect dep (API params)", component: <Ex23_MemoAsEffectDep /> },
  { label: "24 [Intermediate] Sortable table", component: <Ex24_TableData /> },
  { label: "25 [Intermediate] Multi-step memo pipeline", component: <Ex25_PipelineMemo /> },
  { label: "26 [Nested] Chained memos (squares + cubes)", component: <Ex26_ChainedMemos /> },
  { label: "27 [Nested] Memo of memo result (filter→stats)", component: <Ex27_MemoOfMemoResult /> },
  { label: "28 [Nested] Nested object → grid computation", component: <Ex28_NestedObjectComputation /> },
  { label: "29 [Nested] Memoized tree data (collapsible)", component: <Ex29_MemoizedTreeData /> },
  { label: "30 [Nested] Grouped data (group-by)", component: <Ex30_GroupedData /> },
  { label: "31 [Nested] Matrix (scale + transpose + trace)", component: <Ex31_MatrixOperations /> },
  { label: "32 [Nested] useMemo in Context + React.memo", component: <Ex32_MemoInContext /> },
  { label: "33 [Nested] Derived permissions map", component: <Ex33_DerivedPermissions /> },
  { label: "34 [Nested] Chained transformations (3 stages)", component: <Ex34_NestedMemoProviders /> },
  { label: "35 [Nested] Memoized virtual list rows + style", component: <Ex35_MemoizedVirtualList /> },
  { label: "36 [Nested] useMemo value in Provider", component: <Ex36_MemoInProvider /> },
  { label: "37 [Nested] Selector pattern", component: <Ex37_SelectorPattern /> },
  { label: "38 [Advanced] useMemo vs useState comparison", component: <Ex38_VsUseStateComparison /> },
  { label: "39 [Advanced] useMemo + React.memo (prevent re-render)", component: <Ex39_WithReactMemo /> },
  { label: "40 [Advanced] Memoized API params as effect dep", component: <Ex40_MemoAPIParams /> },
  { label: "41 [Advanced] Memoized handlers object", component: <Ex41_MemoizedHandlersObject /> },
  { label: "42 [Advanced] Custom useMemoSelector hook", component: <Ex42_CustomMemoSelector /> },
  { label: "43 [Advanced] Computed styles (3 deps)", component: <Ex43_ComputedStyles /> },
  { label: "44 [Advanced] Benchmark memo vs inline", component: <Ex44_BenchmarkMemo /> },
  { label: "45 [Advanced] Reactive derived state (todo stats)", component: <Ex45_ReactiveDerivedState /> },
  { label: "46 [Advanced] Memo with async/loaded data", component: <Ex46_MemoWithAsyncData /> },
  { label: "47 [Advanced] Computed app config (locale + theme)", component: <Ex47_MemoComputedConfig /> },
  { label: "48 [Advanced] Memo prevents cascade re-renders", component: <Ex48_MemoPreventsCascade /> },
  { label: "49 [Advanced] useMemo inside custom hook", component: <Ex49_InCustomHook /> },
  { label: "50 [Advanced] Full derived dashboard", component: <Ex50_FullDerivedDashboard /> },
];

export default function UseMemoExamples() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: 24 }}>
      <h1>50 useMemo Examples — Basic · Intermediate · Nested · Advanced</h1>
      {examples.map(({ label, component }) => (
        <section
          key={label}
          style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 20 }}
        >
          <h2 style={{ marginTop: 0, fontSize: 14, color: "#555" }}>{label}</h2>
          {component}
        </section>
      ))}
    </div>
  );
}
