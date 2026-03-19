import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  memo,
  createContext,
  useContext,
  ReactNode,
} from "react";

// ─── BASIC (1–12) ────────────────────────────────────────────────────────────

function Ex01_BasicUseCallback() {
  const [count, setCount] = useState(0);
  const increment = useCallback(() => setCount((c) => c + 1), []);
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}

function Ex02_StableRef() {
  const [tick, setTick] = useState(0);
  const renderCount = useRef(0);
  renderCount.current++;
  const stableHandler = useCallback(() => alert("Stable handler called!"), []);
  return (
    <div>
      <p>Renders: {renderCount.current} | Tick: {tick}</p>
      <button onClick={() => setTick((t) => t + 1)}>Re-render parent</button>
      <button onClick={stableHandler}>Stable action</button>
    </div>
  );
}

function Ex03_WithDeps() {
  const [multiplier, setMultiplier] = useState(2);
  const [value, setValue] = useState(5);
  const compute = useCallback(() => value * multiplier, [value, multiplier]);
  return (
    <div>
      <label>
        Multiplier:{" "}
        <input
          type="number"
          value={multiplier}
          onChange={(e) => setMultiplier(Number(e.target.value))}
          style={{ width: 60 }}
        />
      </label>{" "}
      <label>
        Value:{" "}
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          style={{ width: 60 }}
        />
      </label>
      <p>Result: {compute()}</p>
    </div>
  );
}

function Ex04_NoDeps() {
  const [log, setLog] = useState<string[]>([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const logTime = useCallback(() => {
    setLog((prev) => [...prev, new Date().toLocaleTimeString()]);
  }, []);
  return (
    <div>
      <button onClick={logTime}>Log Time</button>
      <ul style={{ margin: "4px 0", paddingLeft: 20 }}>
        {log.map((t, i) => <li key={i}>{t}</li>)}
      </ul>
    </div>
  );
}

const MemoButton = memo(({ onClick, label }: { onClick: () => void; label: string }) => {
  const rc = useRef(0);
  rc.current++;
  return (
    <button onClick={onClick}>
      {label} (renders: {rc.current})
    </button>
  );
});

function Ex05_OnClick() {
  const [count, setCount] = useState(0);
  const handleClick = useCallback(() => setCount((c) => c + 1), []);
  return (
    <div>
      <p>Count: {count}</p>
      <MemoButton onClick={handleClick} label="Click me" />
    </div>
  );
}

function Ex06_OnChange() {
  const [text, setText] = useState("");
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setText(e.target.value),
    []
  );
  return (
    <div>
      <input placeholder="Type here…" onChange={handleChange} />
      <p>Value: "{text}"</p>
    </div>
  );
}

function Ex07_OnSubmit() {
  const [submitted, setSubmitted] = useState("");
  const [draft, setDraft] = useState("");
  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setSubmitted(draft);
      setDraft("");
    },
    [draft]
  );
  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Enter value"
      />
      <button type="submit">Submit</button>
      {submitted && <span>Submitted: {submitted}</span>}
    </form>
  );
}

function Ex08_ArrayHandler() {
  const [items, setItems] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const addItem = useCallback(() => {
    if (!draft.trim()) return;
    setItems((prev) => [...prev, draft.trim()]);
    setDraft("");
  }, [draft]);
  const removeItem = useCallback((idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }, []);
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="New item" />
        <button onClick={addItem}>Add</button>
      </div>
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        {items.map((item, i) => (
          <li key={i}>
            {item}{" "}
            <button onClick={() => removeItem(i)} style={{ marginLeft: 4 }}>
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Ex09_Toggle() {
  const [on, setOn] = useState(false);
  const toggle = useCallback(() => setOn((v) => !v), []);
  return (
    <div>
      <button onClick={toggle}>{on ? "ON" : "OFF"}</button>
      <span style={{ marginLeft: 12, color: on ? "green" : "red" }}>
        {on ? "Active" : "Inactive"}
      </span>
    </div>
  );
}

function Ex10_SimpleFetch() {
  const [data, setData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fetchData = useCallback(async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setData(`Fetched at ${new Date().toLocaleTimeString()}`);
    setLoading(false);
  }, []);
  return (
    <div>
      <button onClick={fetchData} disabled={loading}>
        {loading ? "Loading…" : "Fetch"}
      </button>
      {data && <p>{data}</p>}
    </div>
  );
}

function Ex11_Reset() {
  const [value, setValue] = useState(42);
  const reset = useCallback(() => setValue(42), []);
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <button onClick={() => setValue((v) => v + 1)}>+1</button>
      <span>{value}</span>
      <button onClick={() => setValue((v) => v - 1)}>−1</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}

function Ex12_Increment() {
  const [step, setStep] = useState(1);
  const [count, setCount] = useState(0);
  const increment = useCallback(() => setCount((c) => c + step), [step]);
  const decrement = useCallback(() => setCount((c) => c - step), [step]);
  return (
    <div>
      <label>
        Step:{" "}
        <input
          type="number"
          value={step}
          min={1}
          onChange={(e) => setStep(Number(e.target.value))}
          style={{ width: 60 }}
        />
      </label>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={decrement}>−{step}</button>
        <strong>{count}</strong>
        <button onClick={increment}>+{step}</button>
      </div>
    </div>
  );
}

// ─── INTERMEDIATE (13–25) ─────────────────────────────────────────────────────

const ExpensiveChild = memo(
  ({
    onAction,
    label,
  }: {
    onAction: () => void;
    label: string;
  }) => {
    const rc = useRef(0);
    rc.current++;
    return (
      <div style={{ padding: 8, background: "#f0f0f0", borderRadius: 4 }}>
        <span>
          {label} — renders: {rc.current}
        </span>{" "}
        <button onClick={onAction}>Do it</button>
      </div>
    );
  }
);

function Ex13_PreventChildRerender() {
  const [parentTick, setParentTick] = useState(0);
  const [childCount, setChildCount] = useState(0);
  const stableAction = useCallback(() => setChildCount((c) => c + 1), []);
  return (
    <div>
      <p>Parent renders: {parentTick + 1} | Child action count: {childCount}</p>
      <button onClick={() => setParentTick((t) => t + 1)}>Re-render parent</button>
      <ExpensiveChild onAction={stableAction} label="Memoized child" />
    </div>
  );
}

function Ex14_UseCallbackUseEffectDep() {
  const [userId, setUserId] = useState(1);
  const [profile, setProfile] = useState<string | null>(null);
  const loadProfile = useCallback(async () => {
    setProfile(null);
    await new Promise((r) => setTimeout(r, 400));
    setProfile(`User #${userId} — loaded at ${new Date().toLocaleTimeString()}`);
  }, [userId]);
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);
  return (
    <div>
      <label>
        User ID:{" "}
        <input
          type="number"
          value={userId}
          min={1}
          onChange={(e) => setUserId(Number(e.target.value))}
          style={{ width: 60 }}
        />
      </label>
      <p>{profile ?? "Loading…"}</p>
    </div>
  );
}

function Ex15_EventListeners() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const handleMouseMove = useCallback((e: MouseEvent) => {
    setPos({ x: e.clientX, y: e.clientY });
  }, []);
  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);
  return (
    <div style={{ padding: 12, background: "#eef", borderRadius: 4 }}>
      Mouse: {pos.x}, {pos.y}
    </div>
  );
}

function Ex16_DebounceWithUseCallback() {
  const [raw, setRaw] = useState("");
  const [debounced, setDebounced] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setRaw(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebounced(v), 400);
  }, []);
  return (
    <div>
      <input onChange={handleChange} placeholder="Type to debounce…" />
      <p>Raw: "{raw}"</p>
      <p>Debounced (400 ms): "{debounced}"</p>
    </div>
  );
}

function Ex17_StableSort() {
  const [desc, setDesc] = useState(false);
  const [items] = useState([5, 2, 8, 1, 9, 3]);
  const sorted = useMemo(
    () => [...items].sort((a, b) => (desc ? b - a : a - b)),
    [items, desc]
  );
  const toggleSort = useCallback(() => setDesc((d) => !d), []);
  return (
    <div>
      <button onClick={toggleSort}>Sort: {desc ? "DESC" : "ASC"}</button>
      <p>{sorted.join(", ")}</p>
    </div>
  );
}

function Ex18_Filter() {
  const [query, setQuery] = useState("");
  const allItems = useMemo(() => ["apple", "banana", "cherry", "date", "elderberry"], []);
  const handleQuery = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);
  const filtered = useMemo(
    () => allItems.filter((i) => i.includes(query.toLowerCase())),
    [allItems, query]
  );
  return (
    <div>
      <input value={query} onChange={handleQuery} placeholder="Filter fruits…" />
      <ul style={{ margin: "4px 0", paddingLeft: 20 }}>
        {filtered.map((f) => <li key={f}>{f}</li>)}
      </ul>
    </div>
  );
}

function Ex19_Paginate() {
  const allItems = useMemo(() => Array.from({ length: 30 }, (_, i) => `Item ${i + 1}`), []);
  const [page, setPage] = useState(0);
  const pageSize = 5;
  const pageItems = useMemo(
    () => allItems.slice(page * pageSize, (page + 1) * pageSize),
    [allItems, page]
  );
  const goNext = useCallback(() => setPage((p) => Math.min(p + 1, Math.floor(allItems.length / pageSize) - 1)), [allItems.length]);
  const goPrev = useCallback(() => setPage((p) => Math.max(p - 1, 0)), []);
  return (
    <div>
      <ul style={{ margin: "0 0 8px", paddingLeft: 20 }}>
        {pageItems.map((i) => <li key={i}>{i}</li>)}
      </ul>
      <button onClick={goPrev} disabled={page === 0}>
        Prev
      </button>{" "}
      <span>Page {page + 1}</span>{" "}
      <button onClick={goNext} disabled={(page + 1) * pageSize >= allItems.length}>
        Next
      </button>
    </div>
  );
}

function Ex20_SearchHandler() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const db = useMemo(() => ["React", "Redux", "TypeScript", "Next.js", "Vite", "Zustand"], []);
  const search = useCallback(
    (q: string) => {
      setResults(db.filter((item) => item.toLowerCase().includes(q.toLowerCase())));
    },
    [db]
  );
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
      search(e.target.value);
    },
    [search]
  );
  return (
    <div>
      <input value={query} onChange={handleChange} placeholder="Search…" />
      <ul style={{ margin: "4px 0", paddingLeft: 20 }}>
        {results.map((r) => <li key={r}>{r}</li>)}
      </ul>
    </div>
  );
}

function Ex21_MultipleCallbacks() {
  const [count, setCount] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const inc = useCallback(() => setCount((c) => c + 1), []);
  const dec = useCallback(() => setCount((c) => c - 1), []);
  const addLog = useCallback(
    (msg: string) => setLog((l) => [...l.slice(-4), msg]),
    []
  );
  const handleInc = useCallback(() => { inc(); addLog("incremented"); }, [inc, addLog]);
  const handleDec = useCallback(() => { dec(); addLog("decremented"); }, [dec, addLog]);
  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleDec}>−</button>
        <strong>{count}</strong>
        <button onClick={handleInc}>+</button>
      </div>
      <ul style={{ margin: "4px 0", paddingLeft: 20, fontSize: 12 }}>
        {log.map((l, i) => <li key={i}>{l}</li>)}
      </ul>
    </div>
  );
}

function Ex22_FormValidationCallback() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const validate = useCallback((val: string) => {
    if (!val.includes("@")) return "Missing @";
    if (!val.includes(".")) return "Missing domain";
    return "";
  }, []);
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEmail(e.target.value);
      setError(validate(e.target.value));
    },
    [validate]
  );
  return (
    <div>
      <input value={email} onChange={handleChange} placeholder="Email" style={{ width: 200 }} />
      {error && <span style={{ color: "red", marginLeft: 8 }}>{error}</span>}
      {!error && email && <span style={{ color: "green", marginLeft: 8 }}>Valid</span>}
    </div>
  );
}

function Ex23_AsyncWithCancel() {
  const [status, setStatus] = useState("idle");
  const abortRef = useRef<AbortController | null>(null);
  const start = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setStatus("loading");
    try {
      await new Promise<void>((res, rej) => {
        const t = setTimeout(res, 1500);
        abortRef.current!.signal.addEventListener("abort", () => {
          clearTimeout(t);
          rej(new DOMException("Aborted", "AbortError"));
        });
      });
      setStatus("done");
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") setStatus("cancelled");
    }
  }, []);
  const cancel = useCallback(() => abortRef.current?.abort(), []);
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <button onClick={start} disabled={status === "loading"}>Start (1.5 s)</button>
      <button onClick={cancel} disabled={status !== "loading"}>Cancel</button>
      <span>Status: {status}</span>
    </div>
  );
}

function Ex24_ThrottleCallback() {
  const [count, setCount] = useState(0);
  const lastCall = useRef(0);
  const throttled = useCallback(() => {
    const now = Date.now();
    if (now - lastCall.current >= 500) {
      lastCall.current = now;
      setCount((c) => c + 1);
    }
  }, []);
  return (
    <div>
      <p>Clicks registered (throttled 500 ms): {count}</p>
      <button onClick={throttled}>Click fast!</button>
    </div>
  );
}

function Ex25_StableCallbackInReducer() {
  const [history, setHistory] = useState<number[]>([]);
  const [value, setValue] = useState(0);
  const apply = useCallback((fn: (v: number) => number) => {
    setValue((v) => {
      const next = fn(v);
      setHistory((h) => [...h.slice(-4), next]);
      return next;
    });
  }, []);
  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => apply((v) => v + 1)}>+1</button>
        <button onClick={() => apply((v) => v * 2)}>×2</button>
        <button onClick={() => apply(() => 0)}>Reset</button>
        <strong>{value}</strong>
      </div>
      <p style={{ fontSize: 12 }}>History: {history.join(" → ")}</p>
    </div>
  );
}

// ─── NESTED (26–37) ───────────────────────────────────────────────────────────

type CBCtxType = { onAction: (msg: string) => void };
const CBCtx = createContext<CBCtxType>({ onAction: () => {} });

function DeepChild26() {
  const { onAction } = useContext(CBCtx);
  return <button onClick={() => onAction("Deep child clicked!")}>Deep click</button>;
}
function Middle26({ children }: { children: ReactNode }) {
  return <div style={{ padding: 8, border: "1px dashed #aaa" }}>{children}</div>;
}
function Ex26_CallbackInContext() {
  const [msg, setMsg] = useState("");
  const onAction = useCallback((m: string) => setMsg(m), []);
  return (
    <CBCtx.Provider value={{ onAction }}>
      <Middle26>
        <DeepChild26 />
      </Middle26>
      {msg && <p>Message: {msg}</p>}
    </CBCtx.Provider>
  );
}

const ListItemChild = memo(
  ({ label, onRemove }: { label: string; onRemove: () => void }) => {
    const rc = useRef(0);
    rc.current++;
    return (
      <li>
        {label} (renders:{rc.current}){" "}
        <button onClick={onRemove}>✕</button>
      </li>
    );
  }
);
function Ex27_CallbackInList() {
  const [items, setItems] = useState(["Alpha", "Beta", "Gamma", "Delta"]);
  const makeRemove = useCallback(
    (label: string) => () => setItems((prev) => prev.filter((i) => i !== label)),
    []
  );
  return (
    <ul style={{ paddingLeft: 20 }}>
      {items.map((item) => (
        <ListItemChild key={item} label={item} onRemove={makeRemove(item)} />
      ))}
    </ul>
  );
}

function Ex28_ComposedCallbacks() {
  const [log, setLog] = useState<string[]>([]);
  const addLog = useCallback((msg: string) => setLog((l) => [...l.slice(-4), msg]), []);
  const logA = useCallback(() => addLog("A fired"), [addLog]);
  const logB = useCallback(() => addLog("B fired"), [addLog]);
  const logBoth = useCallback(() => { logA(); logB(); }, [logA, logB]);
  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={logA}>A</button>
        <button onClick={logB}>B</button>
        <button onClick={logBoth}>Both</button>
      </div>
      <ul style={{ margin: "4px 0", paddingLeft: 20, fontSize: 12 }}>
        {log.map((l, i) => <li key={i}>{l}</li>)}
      </ul>
    </div>
  );
}

function Ex29_CallbackChain() {
  const [result, setResult] = useState<number | null>(null);
  const double = useCallback((n: number) => n * 2, []);
  const addTen = useCallback((n: number) => n + 10, []);
  const square = useCallback((n: number) => n * n, []);
  const runChain = useCallback(
    (n: number) => setResult(square(addTen(double(n)))),
    [double, addTen, square]
  );
  return (
    <div>
      <p>Chain: n → ×2 → +10 → ²</p>
      {[1, 2, 3, 5].map((n) => (
        <button key={n} onClick={() => runChain(n)} style={{ marginRight: 4 }}>
          n={n}
        </button>
      ))}
      {result !== null && <p>Result: {result}</p>}
    </div>
  );
}

type Level3Props = { onFire: () => void };
function Level3_30({ onFire }: Level3Props) {
  return <button onClick={onFire}>Level 3 button</button>;
}
function Level2_30({ onFire }: Level3Props) {
  const wrapped = useCallback(() => { console.log("level2 wrap"); onFire(); }, [onFire]);
  return <Level3_30 onFire={wrapped} />;
}
function Level1_30({ onFire }: Level3Props) {
  const wrapped = useCallback(() => { console.log("level1 wrap"); onFire(); }, [onFire]);
  return <Level2_30 onFire={wrapped} />;
}
function Ex30_MultiLevelPassing() {
  const [count, setCount] = useState(0);
  const root = useCallback(() => setCount((c) => c + 1), []);
  return (
    <div>
      <Level1_30 onFire={root} />
      <p>Fired: {count}</p>
    </div>
  );
}

function Ex31_CallbackWithRef() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const focusAndClear = useCallback(() => {
    setValue("");
    inputRef.current?.focus();
  }, []);
  return (
    <div>
      <input ref={inputRef} value={value} onChange={(e) => setValue(e.target.value)} placeholder="Type here" />
      <button onClick={focusAndClear} style={{ marginLeft: 8 }}>Clear & Focus</button>
    </div>
  );
}

function useStableLogger(prefix: string) {
  const log = useCallback((msg: string) => console.log(`[${prefix}]`, msg), [prefix]);
  return log;
}
function Ex32_CallbackInCustomHook() {
  const log = useStableLogger("Ex32");
  const [count, setCount] = useState(0);
  const handleClick = useCallback(() => {
    setCount((c) => c + 1);
    log("button clicked");
  }, [log]);
  return (
    <div>
      <button onClick={handleClick}>Click (check console)</button>
      <p>Count: {count}</p>
    </div>
  );
}

function Ex33_NestedFormCallbacks() {
  const [form, setForm] = useState({ name: "", email: "" });
  const makeHandler = useCallback(
    (field: keyof typeof form) =>
      (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((f) => ({ ...f, [field]: e.target.value })),
    []
  );
  const handleReset = useCallback(() => setForm({ name: "", email: "" }), []);
  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <input value={form.name} onChange={makeHandler("name")} placeholder="Name" />
        <input value={form.email} onChange={makeHandler("email")} placeholder="Email" />
        <div>
          <button type="button" onClick={handleReset}>Reset</button>
        </div>
        <pre style={{ fontSize: 12, margin: 0 }}>{JSON.stringify(form, null, 2)}</pre>
      </div>
    </form>
  );
}

function Ex34_ConditionalCallback() {
  const [locked, setLocked] = useState(false);
  const [count, setCount] = useState(0);
  const handleAction = useCallback(() => {
    if (!locked) setCount((c) => c + 1);
  }, [locked]);
  return (
    <div>
      <button onClick={handleAction}>Action (count: {count})</button>{" "}
      <button onClick={() => setLocked((l) => !l)}>
        {locked ? "Unlock" : "Lock"}
      </button>
      <span style={{ marginLeft: 8, color: locked ? "red" : "green" }}>
        {locked ? "Locked" : "Unlocked"}
      </span>
    </div>
  );
}

function Ex35_CallbackWithCleanup() {
  const [active, setActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const start = useCallback(() => {
    if (intervalRef.current) return;
    setActive(true);
    intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }, []);
  const stop = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setActive(false);
  }, []);
  const reset = useCallback(() => { stop(); setElapsed(0); }, [stop]);
  return (
    <div>
      <p>Elapsed: {elapsed}s</p>
      <button onClick={start} disabled={active}>Start</button>{" "}
      <button onClick={stop} disabled={!active}>Stop</button>{" "}
      <button onClick={reset}>Reset</button>
    </div>
  );
}

type CtxB = { greet: (name: string) => string; farewell: (name: string) => string };
const CtxB36 = createContext<CtxB>({ greet: () => "", farewell: () => "" });
function GreetWidget() {
  const { greet, farewell } = useContext(CtxB36);
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={() => alert(greet("World"))}>Greet</button>
      <button onClick={() => alert(farewell("World"))}>Farewell</button>
    </div>
  );
}
function Ex36_CallbackContext() {
  const [lang, setLang] = useState<"en" | "es">("en");
  const greet = useCallback(
    (name: string) => (lang === "en" ? `Hello, ${name}!` : `¡Hola, ${name}!`),
    [lang]
  );
  const farewell = useCallback(
    (name: string) => (lang === "en" ? `Goodbye, ${name}!` : `¡Adiós, ${name}!`),
    [lang]
  );
  return (
    <CtxB36.Provider value={{ greet, farewell }}>
      <label>
        Lang:{" "}
        <select value={lang} onChange={(e) => setLang(e.target.value as "en" | "es")}>
          <option value="en">English</option>
          <option value="es">Spanish</option>
        </select>
      </label>
      <GreetWidget />
    </CtxB36.Provider>
  );
}

function Ex37_CallbackDependencyChain() {
  const [base, setBase] = useState(2);
  const [steps, setSteps] = useState(3);
  const double = useCallback((n: number) => n * 2, []);
  const applySteps = useCallback(
    (start: number) => {
      let v = start;
      for (let i = 0; i < steps; i++) v = double(v);
      return v;
    },
    [steps, double]
  );
  const compute = useCallback(() => applySteps(base), [applySteps, base]);
  return (
    <div>
      <label>
        Base:{" "}
        <input type="number" value={base} onChange={(e) => setBase(Number(e.target.value))} style={{ width: 60 }} />
      </label>{" "}
      <label>
        Steps:{" "}
        <input type="number" value={steps} min={0} max={10} onChange={(e) => setSteps(Number(e.target.value))} style={{ width: 60 }} />
      </label>
      <p>
        {base} doubled {steps} times = {compute()}
      </p>
    </div>
  );
}

// ─── ADVANCED (38–50) ─────────────────────────────────────────────────────────

function Ex38_VsInlineBenchmark() {
  const [count, setCount] = useState(0);
  const stableRenders = useRef(0);
  const inlineRenders = useRef(0);
  const stable = useCallback(() => setCount((c) => c + 1), []);
  const StableChild = memo(({ onClick }: { onClick: () => void }) => {
    stableRenders.current++;
    return <button onClick={onClick}>Stable ({stableRenders.current} renders)</button>;
  });
  const InlineChild = memo(({ onClick }: { onClick: () => void }) => {
    inlineRenders.current++;
    return <button onClick={onClick}>Inline ({inlineRenders.current} renders)</button>;
  });
  return (
    <div>
      <p>Parent re-renders on count change: {count}</p>
      <div style={{ display: "flex", gap: 8 }}>
        <StableChild onClick={stable} />
        <InlineChild onClick={() => setCount((c) => c + 1)} />
      </div>
      <p style={{ fontSize: 12, color: "#888" }}>
        Stable child doesn't re-render; inline child does on every parent render.
      </p>
    </div>
  );
}

function Ex39_WithAbortController() {
  const [results, setResults] = useState<string[]>([]);
  const [status, setStatus] = useState("idle");
  const abortRef = useRef<AbortController | null>(null);
  const fetchWithAbort = useCallback(async (query: string) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setStatus("loading");
    setResults([]);
    try {
      await new Promise<void>((res, rej) => {
        const t = setTimeout(res, 800);
        abortRef.current!.signal.addEventListener("abort", () => { clearTimeout(t); rej(new DOMException("aborted")); });
      });
      setResults([`Result for "${query}" #1`, `Result for "${query}" #2`]);
      setStatus("done");
    } catch {
      setStatus("cancelled");
    }
  }, []);
  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        {["React", "Vue", "Angular"].map((q) => (
          <button key={q} onClick={() => fetchWithAbort(q)}>
            Search {q}
          </button>
        ))}
        <button onClick={() => abortRef.current?.abort()}>Cancel</button>
      </div>
      <p>Status: {status}</p>
      <ul style={{ paddingLeft: 20, margin: 0 }}>
        {results.map((r) => <li key={r}>{r}</li>)}
      </ul>
    </div>
  );
}

function Ex40_WithUseRef() {
  const [value, setValue] = useState(0);
  const prevRef = useRef(0);
  const updateWithHistory = useCallback((fn: (v: number) => number) => {
    setValue((v) => {
      prevRef.current = v;
      return fn(v);
    });
  }, []);
  return (
    <div>
      <p>Previous: {prevRef.current} | Current: {value}</p>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => updateWithHistory((v) => v + 1)}>+1</button>
        <button onClick={() => updateWithHistory((v) => v * 2)}>×2</button>
        <button onClick={() => updateWithHistory(() => 0)}>Reset</button>
      </div>
    </div>
  );
}

function useCallbackFactory<T extends unknown[]>(fn: (...args: T) => void, deps: React.DependencyList) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(fn, deps);
}
function Ex41_InCustomHook() {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1);
  const increment = useCallbackFactory((amount: number) => setCount((c) => c + amount), []);
  return (
    <div>
      <label>
        Step:{" "}
        <input type="number" value={step} min={1} onChange={(e) => setStep(Number(e.target.value))} style={{ width: 60 }} />
      </label>
      <button onClick={() => increment(step)} style={{ marginLeft: 8 }}>
        +{step}
      </button>
      <span style={{ marginLeft: 12 }}>Count: {count}</span>
    </div>
  );
}

function Ex42_WebSocketHandler() {
  const [messages, setMessages] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<{ close: () => void } | null>(null);
  const handleMessage = useCallback((msg: string) => {
    setMessages((prev) => [...prev.slice(-4), msg]);
  }, []);
  const connect = useCallback(() => {
    setConnected(true);
    let i = 0;
    const iv = setInterval(() => {
      i++;
      handleMessage(`Server message #${i} at ${new Date().toLocaleTimeString()}`);
      if (i >= 5) { clearInterval(iv); setConnected(false); }
    }, 500);
    wsRef.current = { close: () => { clearInterval(iv); setConnected(false); } };
  }, [handleMessage]);
  const disconnect = useCallback(() => wsRef.current?.close(), []);
  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={connect} disabled={connected}>Connect</button>
        <button onClick={disconnect} disabled={!connected}>Disconnect</button>
        <span>{connected ? "Connected" : "Disconnected"}</span>
      </div>
      <ul style={{ margin: "4px 0", paddingLeft: 20, fontSize: 12 }}>
        {messages.map((m, i) => <li key={i}>{m}</li>)}
      </ul>
    </div>
  );
}

function Ex43_VsUseMemo() {
  const [n, setN] = useState(10);
  // useMemo: returns the value
  const memoValue = useMemo(() => n * n, [n]);
  // useCallback: returns the function
  const callbackFn = useCallback(() => n * n, [n]);
  return (
    <div>
      <label>
        n:{" "}
        <input type="number" value={n} onChange={(e) => setN(Number(e.target.value))} style={{ width: 60 }} />
      </label>
      <p>useMemo result (eager): {memoValue}</p>
      <p>useCallback result (lazy): <button onClick={() => alert(callbackFn())}>Compute</button></p>
    </div>
  );
}

function Ex44_RetryCallback() {
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState("idle");
  const fetchWithRetry = useCallback(async (maxRetries: number) => {
    for (let i = 1; i <= maxRetries; i++) {
      setAttempt(i);
      setStatus(`Attempt ${i}…`);
      await new Promise((r) => setTimeout(r, 400));
      if (Math.random() > 0.5) { setStatus(`Success on attempt ${i}`); return; }
    }
    setStatus("Failed after all retries");
  }, []);
  return (
    <div>
      <button onClick={() => fetchWithRetry(4)}>Fetch (max 4 retries)</button>
      <p>Attempt: {attempt} | {status}</p>
    </div>
  );
}

function Ex45_MemoizedEventMap() {
  const [log, setLog] = useState<string[]>([]);
  const addLog = useCallback((msg: string) => setLog((l) => [...l.slice(-4), msg]), []);
  const handlers = useMemo(
    () => ({
      onClick: () => addLog("click"),
      onMouseEnter: () => addLog("mouseenter"),
      onFocus: () => addLog("focus"),
      onBlur: () => addLog("blur"),
    }),
    [addLog]
  );
  return (
    <div>
      <input {...handlers} placeholder="Interact with me" style={{ width: 200 }} />
      <ul style={{ margin: "4px 0", paddingLeft: 20, fontSize: 12 }}>
        {log.map((l, i) => <li key={i}>{l}</li>)}
      </ul>
    </div>
  );
}

function Ex46_DynamicCallbackRegistry() {
  type Handler = () => void;
  const [registry] = useState<Map<string, Handler>>(new Map());
  const [log, setLog] = useState<string[]>([]);
  const register = useCallback((name: string, fn: Handler) => {
    registry.set(name, fn);
  }, [registry]);
  const fire = useCallback((name: string) => {
    const fn = registry.get(name);
    if (fn) fn();
    else setLog((l) => [...l, `Unknown: ${name}`]);
  }, [registry]);
  useEffect(() => {
    register("greet", () => setLog((l) => [...l, "Hello!"]));
    register("bye", () => setLog((l) => [...l, "Goodbye!"]));
  }, [register]);
  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => fire("greet")}>Fire greet</button>
        <button onClick={() => fire("bye")}>Fire bye</button>
        <button onClick={() => fire("unknown")}>Fire unknown</button>
      </div>
      <ul style={{ margin: "4px 0", paddingLeft: 20, fontSize: 12 }}>
        {log.map((l, i) => <li key={i}>{l}</li>)}
      </ul>
    </div>
  );
}

function Ex47_LatestCallback() {
  // Pattern: always call the latest version of a callback without re-subscribing effects
  const [count, setCount] = useState(0);
  const latestCount = useRef(count);
  latestCount.current = count;
  const reportLatest = useCallback(() => {
    alert(`Latest count at call time: ${latestCount.current}`);
  }, []);
  useEffect(() => {
    const id = setTimeout(reportLatest, 2000);
    return () => clearTimeout(id);
    // reportLatest is stable — won't re-run effect
  }, [reportLatest]);
  return (
    <div>
      <p>Count: {count} (auto-reports latest in 2s)</p>
      <button onClick={() => setCount((c) => c + 1)}>+1</button>
    </div>
  );
}

function Ex48_CallbackWithBatching() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [c, setC] = useState(0);
  const incrementAll = useCallback(() => {
    // React 18 automatically batches these
    setA((x) => x + 1);
    setB((x) => x + 1);
    setC((x) => x + 1);
  }, []);
  return (
    <div>
      <p>A: {a} | B: {b} | C: {c}</p>
      <button onClick={incrementAll}>Increment all (batched)</button>
    </div>
  );
}

function useSafeCallback<T extends unknown[], R>(
  fn: (...args: T) => R,
  deps: React.DependencyList
): (...args: T) => R {
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback((...args: T): R => {
    if (!mountedRef.current) throw new Error("Called after unmount");
    return fn(...args);
  }, deps);
}
function Ex49_SafeCallback() {
  const [count, setCount] = useState(0);
  const safeIncrement = useSafeCallback(() => setCount((c) => c + 1), []);
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={safeIncrement}>Safe increment</button>
      <p style={{ fontSize: 12, color: "#888" }}>useSafeCallback guards against post-unmount calls</p>
    </div>
  );
}

function Ex50_FullPipeline() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const db = useMemo(
    () => Array.from({ length: 50 }, (_, i) => `Record ${i + 1}`),
    []
  );
  const search = useCallback(
    async (q: string, p: number) => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 300));
      const filtered = db.filter((r) => r.toLowerCase().includes(q.toLowerCase()));
      const pageSize = 5;
      setResults(filtered.slice((p - 1) * pageSize, p * pageSize));
      setLoading(false);
    },
    [db]
  );
  const handleQuery = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
      setPage(1);
      search(e.target.value, 1);
    },
    [search]
  );
  const handlePage = useCallback(
    (delta: number) => {
      setPage((p) => {
        const next = p + delta;
        search(query, next);
        return next;
      });
    },
    [search, query]
  );
  return (
    <div>
      <input value={query} onChange={handleQuery} placeholder="Search records…" />
      {loading ? (
        <p>Loading…</p>
      ) : (
        <ul style={{ paddingLeft: 20, margin: "4px 0" }}>
          {results.map((r) => <li key={r}>{r}</li>)}
        </ul>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => handlePage(-1)} disabled={page <= 1}>Prev</button>
        <span>Page {page}</span>
        <button onClick={() => handlePage(1)} disabled={results.length < 5}>Next</button>
      </div>
    </div>
  );
}

// ─── Examples registry ────────────────────────────────────────────────────────

const examples: { label: string; component: JSX.Element }[] = [
  { label: "01 [Basic] Basic useCallback", component: <Ex01_BasicUseCallback /> },
  { label: "02 [Basic] Stable Ref across renders", component: <Ex02_StableRef /> },
  { label: "03 [Basic] With dependencies", component: <Ex03_WithDeps /> },
  { label: "04 [Basic] No dependencies", component: <Ex04_NoDeps /> },
  { label: "05 [Basic] onClick handler", component: <Ex05_OnClick /> },
  { label: "06 [Basic] onChange handler", component: <Ex06_OnChange /> },
  { label: "07 [Basic] onSubmit handler", component: <Ex07_OnSubmit /> },
  { label: "08 [Basic] Array handler (add/remove)", component: <Ex08_ArrayHandler /> },
  { label: "09 [Basic] Toggle callback", component: <Ex09_Toggle /> },
  { label: "10 [Basic] Simple fetch callback", component: <Ex10_SimpleFetch /> },
  { label: "11 [Basic] Reset callback", component: <Ex11_Reset /> },
  { label: "12 [Basic] Increment with step", component: <Ex12_Increment /> },
  { label: "13 [Intermediate] Prevent child re-render with memo", component: <Ex13_PreventChildRerender /> },
  { label: "14 [Intermediate] useCallback as useEffect dependency", component: <Ex14_UseCallbackUseEffectDep /> },
  { label: "15 [Intermediate] Stable event listener", component: <Ex15_EventListeners /> },
  { label: "16 [Intermediate] Debounce with useCallback", component: <Ex16_DebounceWithUseCallback /> },
  { label: "17 [Intermediate] Stable sort", component: <Ex17_StableSort /> },
  { label: "18 [Intermediate] Filter callback", component: <Ex18_Filter /> },
  { label: "19 [Intermediate] Paginate callback", component: <Ex19_Paginate /> },
  { label: "20 [Intermediate] Search handler", component: <Ex20_SearchHandler /> },
  { label: "21 [Intermediate] Multiple composed callbacks", component: <Ex21_MultipleCallbacks /> },
  { label: "22 [Intermediate] Form validation callback", component: <Ex22_FormValidationCallback /> },
  { label: "23 [Intermediate] Async with cancel", component: <Ex23_AsyncWithCancel /> },
  { label: "24 [Intermediate] Throttle callback", component: <Ex24_ThrottleCallback /> },
  { label: "25 [Intermediate] Stable callback in reducer pattern", component: <Ex25_StableCallbackInReducer /> },
  { label: "26 [Nested] Callback in Context", component: <Ex26_CallbackInContext /> },
  { label: "27 [Nested] Callback in list of memoized children", component: <Ex27_CallbackInList /> },
  { label: "28 [Nested] Composed callbacks", component: <Ex28_ComposedCallbacks /> },
  { label: "29 [Nested] Callback chain (pipeline)", component: <Ex29_CallbackChain /> },
  { label: "30 [Nested] Multi-level prop passing", component: <Ex30_MultiLevelPassing /> },
  { label: "31 [Nested] Callback with useRef", component: <Ex31_CallbackWithRef /> },
  { label: "32 [Nested] Callback in custom hook", component: <Ex32_CallbackInCustomHook /> },
  { label: "33 [Nested] Nested form field callbacks", component: <Ex33_NestedFormCallbacks /> },
  { label: "34 [Nested] Conditional callback (locked/unlocked)", component: <Ex34_ConditionalCallback /> },
  { label: "35 [Nested] Callback with cleanup (timer)", component: <Ex35_CallbackWithCleanup /> },
  { label: "36 [Nested] Callback context (multilingual)", component: <Ex36_CallbackContext /> },
  { label: "37 [Nested] Callback dependency chain", component: <Ex37_CallbackDependencyChain /> },
  { label: "38 [Advanced] useCallback vs inline benchmark", component: <Ex38_VsInlineBenchmark /> },
  { label: "39 [Advanced] With AbortController", component: <Ex39_WithAbortController /> },
  { label: "40 [Advanced] With useRef (previous value)", component: <Ex40_WithUseRef /> },
  { label: "41 [Advanced] Callback factory custom hook", component: <Ex41_InCustomHook /> },
  { label: "42 [Advanced] WebSocket-style handler", component: <Ex42_WebSocketHandler /> },
  { label: "43 [Advanced] useCallback vs useMemo", component: <Ex43_VsUseMemo /> },
  { label: "44 [Advanced] Retry callback", component: <Ex44_RetryCallback /> },
  { label: "45 [Advanced] Memoized event handler map (useMemo)", component: <Ex45_MemoizedEventMap /> },
  { label: "46 [Advanced] Dynamic callback registry", component: <Ex46_DynamicCallbackRegistry /> },
  { label: "47 [Advanced] Latest-value callback pattern", component: <Ex47_LatestCallback /> },
  { label: "48 [Advanced] Callback with React 18 batching", component: <Ex48_CallbackWithBatching /> },
  { label: "49 [Advanced] useSafeCallback custom hook", component: <Ex49_SafeCallback /> },
  { label: "50 [Advanced] Full search/paginate pipeline", component: <Ex50_FullPipeline /> },
];

export default function UseCallbackExamples() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: 24 }}>
      <h1>50 useCallback Examples — Basic · Intermediate · Nested · Advanced</h1>
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
