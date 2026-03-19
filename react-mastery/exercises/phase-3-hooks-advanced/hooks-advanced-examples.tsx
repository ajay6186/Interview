import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useLayoutEffect,
  useTransition,
  useDeferredValue,
  useId,
  useReducer,
  createContext,
  useContext,
  ReactNode,
  memo,
} from "react";

// ─────────────────────────────────────────
// useCallback  (1–10)
// ─────────────────────────────────────────

function Ex01_BasicCallback() {
  const [count, setCount] = useState(0);
  const increment = useCallback(() => setCount((c) => c + 1), []);
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+ (stable ref)</button>
    </div>
  );
}

const ChildButton = memo(({ onClick, label }: { onClick: () => void; label: string }) => {
  const renders = useRef(0);
  renders.current += 1;
  return <button onClick={onClick}>{label} (renders: {renders.current})</button>;
});

function Ex02_PreventChildRerender() {
  const [count, setCount] = useState(0);
  const [other, setOther] = useState(0);
  // Without useCallback, ChildButton would re-render when `other` changes
  const increment = useCallback(() => setCount((c) => c + 1), []);
  return (
    <div>
      <p>Count: {count} | Other: {other}</p>
      <ChildButton onClick={increment} label="Increment count" />
      <button onClick={() => setOther((o) => o + 1)}>Change other (child won't re-render)</button>
    </div>
  );
}

function Ex03_CallbackWithDep() {
  const [multiplier, setMultiplier] = useState(2);
  const [value, setValue] = useState(5);
  const compute = useCallback(() => value * multiplier, [value, multiplier]);
  return (
    <div>
      <p>Result: {compute()}</p>
      <button onClick={() => setMultiplier((m) => m + 1)}>Multiplier: {multiplier}</button>
      <button onClick={() => setValue((v) => v + 1)}>Value: {value}</button>
    </div>
  );
}

function Ex04_CallbackForFetch() {
  const [userId, setUserId] = useState(1);
  const [title, setTitle] = useState("");
  const fetchUser = useCallback(() => {
    fetch(`https://jsonplaceholder.typicode.com/todos/${userId}`)
      .then((r) => r.json())
      .then((d) => setTitle(d.title));
  }, [userId]);
  useEffect(() => { fetchUser(); }, [fetchUser]);
  return (
    <div>
      <p>{title}</p>
      <button onClick={() => setUserId((id) => id + 1)}>Next todo (id: {userId})</button>
    </div>
  );
}

function Ex05_CallbackInList() {
  const [items] = useState(["A", "B", "C"]);
  const [selected, setSelected] = useState("");
  const handleSelect = useCallback((item: string) => setSelected(item), []);
  return (
    <div>
      {items.map((item) => (
        <button key={item} onClick={() => handleSelect(item)}>{item}</button>
      ))}
      <p>Selected: {selected}</p>
    </div>
  );
}

function Ex06_FormSubmitCallback() {
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState("");
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(name);
  }, [name]);
  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
      <button type="submit">Submit</button>
      {submitted && <p>Submitted: {submitted}</p>}
    </form>
  );
}

function Ex07_CallbackWithRef() {
  const countRef = useRef(0);
  const [display, setDisplay] = useState(0);
  // Stable callback reads latest ref value without re-creating
  const increment = useCallback(() => { countRef.current += 1; }, []);
  return (
    <div>
      <button onClick={increment}>Increment (no re-render)</button>
      <button onClick={() => setDisplay(countRef.current)}>Show: {display}</button>
    </div>
  );
}

function Ex08_StableEventHandler() {
  const [log, setLog] = useState<string[]>([]);
  const handleKey = useCallback((e: KeyboardEvent) => {
    setLog((prev) => [...prev.slice(-4), `Key: ${e.key}`]);
  }, []);
  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);
  return (
    <div>
      <p>Press any key:</p>
      {log.map((entry, i) => <p key={i}>{entry}</p>)}
    </div>
  );
}

function Ex09_CallbackVsInline() {
  const [count, setCount] = useState(0);
  const renders = useRef({ inline: 0, callback: 0 });
  const InlineChild = memo(() => { renders.current.inline += 1; return <span>Inline renders: {renders.current.inline}</span>; });
  const CallbackChild = memo(({ fn }: { fn: () => void }) => { renders.current.callback += 1; return <button onClick={fn}>Callback renders: {renders.current.callback}</button>; });
  const stableFn = useCallback(() => setCount((c) => c + 1), []);
  return (
    <div>
      <InlineChild />
      <CallbackChild fn={stableFn} />
      <button onClick={() => setCount((c) => c + 1)}>Parent re-render ({count})</button>
    </div>
  );
}

function Ex10_CallbackDebounce() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const search = useCallback((q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setResult(`Results for: "${q}"`), 500);
  }, []);
  return (
    <div>
      <input value={query} onChange={(e) => { setQuery(e.target.value); search(e.target.value); }} placeholder="Type to search" />
      <p>{result}</p>
    </div>
  );
}

// ─────────────────────────────────────────
// useMemo  (11–20)
// ─────────────────────────────────────────

function Ex11_BasicMemo() {
  const [n, setN] = useState(10);
  const sum = useMemo(() => {
    let total = 0;
    for (let i = 1; i <= n; i++) total += i;
    return total;
  }, [n]);
  return (
    <div>
      <p>Sum 1..{n} = {sum}</p>
      <button onClick={() => setN((v) => v + 1)}>+</button>
    </div>
  );
}

function Ex12_ExpensiveComputation() {
  const [num, setNum] = useState(30);
  const [other, setOther] = useState(0);
  const fib = useMemo(() => {
    const f = (n: number): number => (n <= 1 ? n : f(n - 1) + f(n - 2));
    return f(num);
  }, [num]);
  return (
    <div>
      <p>fib({num}) = {fib}</p>
      <button onClick={() => setNum((n) => Math.min(n + 1, 35))}>Harder</button>
      <button onClick={() => setOther((o) => o + 1)}>Other: {other} (no recompute)</button>
    </div>
  );
}

function Ex13_MemoizedFilter() {
  const [query, setQuery] = useState("");
  const [other, setOther] = useState(0);
  const all = ["Alice", "Bob", "Charlie", "Dave", "Eve"];
  const filtered = useMemo(
    () => all.filter((n) => n.toLowerCase().includes(query.toLowerCase())),
    [query]
  );
  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter" />
      <button onClick={() => setOther((o) => o + 1)}>Other: {other}</button>
      <ul>{filtered.map((n) => <li key={n}>{n}</li>)}</ul>
    </div>
  );
}

function Ex14_MemoizedSort() {
  const [asc, setAsc] = useState(true);
  const [items] = useState([5, 2, 8, 1, 9, 3]);
  const sorted = useMemo(() => [...items].sort((a, b) => asc ? a - b : b - a), [items, asc]);
  return (
    <div>
      <button onClick={() => setAsc(!asc)}>Sort: {asc ? "ASC" : "DESC"}</button>
      <p>{sorted.join(", ")}</p>
    </div>
  );
}

function Ex15_MemoizedObject() {
  const [name, setName] = useState("Ajay");
  const [count, setCount] = useState(0);
  // Without useMemo, this object is new every render
  const config = useMemo(() => ({ name, role: "admin" }), [name]);
  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={() => setCount((c) => c + 1)}>Rerender: {count}</button>
      <p>Config: {JSON.stringify(config)}</p>
    </div>
  );
}

function Ex16_DerivedState() {
  const [cart] = useState([{ name: "Shoes", price: 50, qty: 2 }, { name: "Hat", price: 20, qty: 1 }]);
  const total = useMemo(() => cart.reduce((sum, i) => sum + i.price * i.qty, 0), [cart]);
  const itemCount = useMemo(() => cart.reduce((sum, i) => sum + i.qty, 0), [cart]);
  return (
    <div>
      <p>Items: {itemCount} | Total: ${total}</p>
      {cart.map((i) => <p key={i.name}>{i.name} x{i.qty}</p>)}
    </div>
  );
}

function Ex17_MemoWithDeps() {
  const [a, setA] = useState(3);
  const [b, setB] = useState(4);
  const hypotenuse = useMemo(() => Math.sqrt(a * a + b * b).toFixed(2), [a, b]);
  return (
    <div>
      <p>√(a²+b²) = {hypotenuse}</p>
      <button onClick={() => setA((v) => v + 1)}>a: {a}</button>
      <button onClick={() => setB((v) => v + 1)}>b: {b}</button>
    </div>
  );
}

function Ex18_MemoForChartData() {
  const [range, setRange] = useState(5);
  const data = useMemo(() =>
    Array.from({ length: range }, (_, i) => ({ x: i + 1, y: Math.pow(i + 1, 2) })),
    [range]
  );
  return (
    <div>
      <button onClick={() => setRange((r) => r + 1)}>Range: {range}</button>
      <table>
        <tbody>{data.map((d) => <tr key={d.x}><td>{d.x}</td><td>{d.y}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

function Ex19_MemoVsState() {
  const [items] = useState(["c", "a", "b", "e", "d"]);
  // Derived: sorted version — no need for separate useState
  const sorted = useMemo(() => [...items].sort(), [items]);
  const upper = useMemo(() => sorted.map((s) => s.toUpperCase()), [sorted]);
  return (
    <div>
      <p>Original: {items.join(", ")}</p>
      <p>Sorted: {sorted.join(", ")}</p>
      <p>Upper: {upper.join(", ")}</p>
    </div>
  );
}

function Ex20_MemoComponent() {
  const [theme, setTheme] = useState("light");
  const [count, setCount] = useState(0);
  const style = useMemo(() => ({
    background: theme === "dark" ? "#333" : "#fff",
    color: theme === "dark" ? "#fff" : "#000",
    padding: 8,
  }), [theme]);
  return (
    <div style={style}>
      <button onClick={() => setTheme(t => t === "light" ? "dark" : "light")}>Toggle theme</button>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
    </div>
  );
}

// ─────────────────────────────────────────
// CUSTOM HOOKS  (21–35)
// ─────────────────────────────────────────

function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try { return JSON.parse(localStorage.getItem(key) ?? "") as T; } catch { return initial; }
  });
  const set = (v: T) => { setValue(v); localStorage.setItem(key, JSON.stringify(v)); };
  return [value, set] as const;
}

function Ex21_UseLocalStorage() {
  const [name, setName] = useLocalStorage("ex21_name", "");
  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Persisted name" />
      <p>Saved: {name}</p>
    </div>
  );
}

function useDebounce<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function Ex22_UseDebounce() {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 500);
  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type..." />
      <p>Debounced (500ms): {debounced}</p>
    </div>
  );
}

function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    setLoading(true);
    fetch(url)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [url]);
  return { data, loading, error };
}

function Ex23_UseFetch() {
  const { data, loading } = useFetch<{ title: string }>("https://jsonplaceholder.typicode.com/todos/3");
  return <p>{loading ? "Loading..." : data?.title}</p>;
}

function useToggle(initial = false) {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue((v) => !v), []);
  return [value, toggle] as const;
}

function Ex24_UseToggle() {
  const [on, toggle] = useToggle(false);
  return (
    <div>
      <p>{on ? "ON" : "OFF"}</p>
      <button onClick={toggle}>Toggle</button>
    </div>
  );
}

function useCounter(initial = 0, step = 1) {
  const [count, setCount] = useState(initial);
  const inc = useCallback(() => setCount((c) => c + step), [step]);
  const dec = useCallback(() => setCount((c) => c - step), [step]);
  const reset = useCallback(() => setCount(initial), [initial]);
  return { count, inc, dec, reset };
}

function Ex25_UseCounter() {
  const { count, inc, dec, reset } = useCounter(0, 5);
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={inc}>+5</button>
      <button onClick={dec}>-5</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}

function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return size;
}

function Ex26_UseWindowSize() {
  const { width, height } = useWindowSize();
  return <p>Window: {width} x {height} (resize browser)</p>;
}

function usePrevious<T>(value: T) {
  const ref = useRef<T>(value);
  useEffect(() => { ref.current = value; });
  return ref.current;
}

function Ex27_UsePrevious() {
  const [count, setCount] = useState(0);
  const prev = usePrevious(count);
  return (
    <div>
      <p>Current: {count} | Previous: {prev}</p>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
    </div>
  );
}

function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);
  useEffect(() => { savedCallback.current = callback; });
  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

function Ex28_UseInterval() {
  const [count, setCount] = useState(0);
  const [running, setRunning] = useState(true);
  useInterval(() => setCount((c) => c + 1), running ? 1000 : null);
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setRunning(!running)}>{running ? "Pause" : "Resume"}</button>
    </div>
  );
}

function useHover() {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const on = () => setHovered(true);
    const off = () => setHovered(false);
    el.addEventListener("mouseenter", on);
    el.addEventListener("mouseleave", off);
    return () => { el.removeEventListener("mouseenter", on); el.removeEventListener("mouseleave", off); };
  }, []);
  return [ref, hovered] as const;
}

function Ex29_UseHover() {
  const [ref, hovered] = useHover();
  return (
    <div ref={ref} style={{ padding: 16, background: hovered ? "yellow" : "#eee" }}>
      {hovered ? "Hovering!" : "Hover me"}
    </div>
  );
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

function Ex30_UseMediaQuery() {
  const isMobile = useMediaQuery("(max-width: 600px)");
  return <p>Layout: {isMobile ? "Mobile" : "Desktop"} (resize window)</p>;
}

function useForm<T extends Record<string, string>>(initial: T) {
  const [values, setValues] = useState(initial);
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);
  const reset = useCallback(() => setValues(initial), [initial]);
  return { values, handleChange, reset };
}

function Ex31_UseForm() {
  const { values, handleChange, reset } = useForm({ name: "", email: "" });
  return (
    <div>
      <input name="name" value={values.name} onChange={handleChange} placeholder="Name" />
      <input name="email" value={values.email} onChange={handleChange} placeholder="Email" />
      <button onClick={reset}>Reset</button>
      <pre>{JSON.stringify(values, null, 2)}</pre>
    </div>
  );
}

function useClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), timeout);
    });
  }, [timeout]);
  return { copied, copy };
}

function Ex32_UseClipboard() {
  const { copied, copy } = useClipboard();
  return (
    <div>
      <button onClick={() => copy("Hello from clipboard!")}>
        {copied ? "Copied!" : "Copy text"}
      </button>
    </div>
  );
}

function useOnline() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  return online;
}

function Ex33_UseOnline() {
  const online = useOnline();
  return <p style={{ color: online ? "green" : "red" }}>{online ? "Online" : "Offline"}</p>;
}

function useKeyPress(targetKey: string) {
  const [pressed, setPressed] = useState(false);
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.key === targetKey) setPressed(true); };
    const up = (e: KeyboardEvent) => { if (e.key === targetKey) setPressed(false); };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [targetKey]);
  return pressed;
}

function Ex34_UseKeyPress() {
  const enterPressed = useKeyPress("Enter");
  const spacePressed = useKeyPress(" ");
  return (
    <div>
      <p>Enter: {enterPressed ? "Pressed" : "Not pressed"}</p>
      <p>Space: {spacePressed ? "Pressed" : "Not pressed"}</p>
    </div>
  );
}

function useCountdown(from: number) {
  const [count, setCount] = useState(from);
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (!active || count <= 0) return;
    const id = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [active, count]);
  return { count, start: () => setActive(true), stop: () => setActive(false), reset: () => { setActive(false); setCount(from); } };
}

function Ex35_UseCountdown() {
  const { count, start, stop, reset } = useCountdown(10);
  return (
    <div>
      <p style={{ fontSize: 24 }}>{count}s</p>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}

// ─────────────────────────────────────────
// useLayoutEffect  (36–40)
// ─────────────────────────────────────────

function Ex36_MeasureBeforePaint() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    // Runs synchronously after DOM update, before browser paints
    setWidth(ref.current?.offsetWidth ?? 0);
  }, []);
  return (
    <div>
      <div ref={ref} style={{ padding: 20, background: "#eee" }}>Measured element</div>
      <p>Width (before paint): {width}px</p>
    </div>
  );
}

function Ex37_SyncScrollPosition() {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  });
  return (
    <div ref={ref} style={{ height: 100, overflow: "auto", border: "1px solid #ccc" }}>
      {Array.from({ length: 10 }, (_, i) => <p key={i}>Message {i + 1}</p>)}
    </div>
  );
}

function Ex38_TooltipPosition() {
  const [show, setShow] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (show && tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        tooltipRef.current.style.left = "auto";
        tooltipRef.current.style.right = "0";
      }
    }
  }, [show]);
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>Hover</button>
      {show && (
        <div ref={tooltipRef} style={{ position: "absolute", top: "100%", left: 0, background: "#333", color: "#fff", padding: "4px 8px", whiteSpace: "nowrap" }}>
          Tooltip text
        </div>
      )}
    </div>
  );
}

function Ex39_CompareEffects() {
  const [count, setCount] = useState(0);
  const layoutRef = useRef<string[]>([]);
  const effectRef = useRef<string[]>([]);
  useLayoutEffect(() => { layoutRef.current.push(`layout: ${count}`); });
  useEffect(() => { effectRef.current.push(`effect: ${count}`); });
  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>Count: {count}</button>
      <p>useLayoutEffect runs synchronously before paint</p>
      <p>useEffect runs asynchronously after paint</p>
    </div>
  );
}

function Ex40_AnimationStart() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useLayoutEffect(() => {
    if (visible && ref.current) {
      ref.current.style.opacity = "0";
      ref.current.style.transition = "opacity 0.5s";
      requestAnimationFrame(() => { if (ref.current) ref.current.style.opacity = "1"; });
    }
  }, [visible]);
  return (
    <div>
      <button onClick={() => setVisible((v) => !v)}>Toggle</button>
      {visible && <div ref={ref} style={{ padding: 16, background: "lightblue", marginTop: 8 }}>Fade in</div>}
    </div>
  );
}

// ─────────────────────────────────────────
// HOOK PATTERNS  (41–50)
// ─────────────────────────────────────────

// 41: Reducer + Context pattern (global state)
type CountState = { count: number };
type CountAction = { type: "inc" } | { type: "dec" };
const CountCtx = createContext<{ state: CountState; dispatch: React.Dispatch<CountAction> } | null>(null);
function CountProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    (s: CountState, a: CountAction) => a.type === "inc" ? { count: s.count + 1 } : { count: s.count - 1 },
    { count: 0 }
  );
  return <CountCtx.Provider value={{ state, dispatch }}>{children}</CountCtx.Provider>;
}
function useCount() {
  const ctx = useContext(CountCtx);
  if (!ctx) throw new Error("useCount must be inside CountProvider");
  return ctx;
}
function Ex41_ReducerContext() {
  return (
    <CountProvider>
      <CountDisplay />
      <CountControls />
    </CountProvider>
  );
}
function CountDisplay() { const { state } = useCount(); return <p>Count: {state.count}</p>; }
function CountControls() {
  const { dispatch } = useCount();
  return (
    <>
      <button onClick={() => dispatch({ type: "inc" })}>+</button>
      <button onClick={() => dispatch({ type: "dec" })}>–</button>
    </>
  );
}

// 42: State machine hook
type TrafficLight = "red" | "yellow" | "green";
function useTrafficLight() {
  const [light, setLight] = useState<TrafficLight>("red");
  const next = useCallback(() => {
    setLight((l) => l === "red" ? "green" : l === "green" ? "yellow" : "red");
  }, []);
  return { light, next };
}
function Ex42_StateMachine() {
  const { light, next } = useTrafficLight();
  const colors: Record<TrafficLight, string> = { red: "#f00", yellow: "#ff0", green: "#0f0" };
  return (
    <div>
      <div style={{ width: 40, height: 40, borderRadius: "50%", background: colors[light] }} />
      <button onClick={next}>Next</button>
    </div>
  );
}

// 43: Composing custom hooks
function useSearchFilter(items: string[]) {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 300);
  const results = useMemo(() => items.filter((i) => i.toLowerCase().includes(debounced.toLowerCase())), [items, debounced]);
  return { query, setQuery, results };
}
function Ex43_HookComposition() {
  const { query, setQuery, results } = useSearchFilter(["Apple", "Banana", "Blueberry", "Cherry", "Avocado"]);
  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search fruits" />
      <ul>{results.map((r) => <li key={r}>{r}</li>)}</ul>
    </div>
  );
}

// 44: useTransition
function Ex44_UseTransition() {
  const [isPending, startTransition] = useTransition();
  const [list, setList] = useState<number[]>([]);
  const generate = () => {
    startTransition(() => {
      setList(Array.from({ length: 10000 }, (_, i) => i));
    });
  };
  return (
    <div>
      <button onClick={generate}>{isPending ? "Generating..." : "Generate 10k items"}</button>
      <p>Items: {list.length}</p>
    </div>
  );
}

// 45: useDeferredValue
function Ex45_UseDeferredValue() {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const items = useMemo(() =>
    Array.from({ length: 1000 }, (_, i) => `Item ${i}`).filter((i) => i.includes(deferred)),
    [deferred]
  );
  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter 1000 items" />
      <p>{items.length} results</p>
    </div>
  );
}

// 46: useId for accessible form labels
function Ex46_UseId() {
  const id = useId();
  return (
    <div>
      <label htmlFor={id}>Email</label>
      <input id={id} type="email" placeholder="email@example.com" />
      <small>Generated id: {id}</small>
    </div>
  );
}

// 47: Multiple useId in one component
function Ex47_MultipleUseId() {
  const nameId = useId();
  const emailId = useId();
  return (
    <form>
      <div><label htmlFor={nameId}>Name</label><input id={nameId} /></div>
      <div><label htmlFor={emailId}>Email</label><input id={emailId} /></div>
    </form>
  );
}

// 48: Custom hook with cleanup pattern
function useEventSource(url: string) {
  const [messages, setMessages] = useState<string[]>([]);
  useEffect(() => {
    // Simulate SSE with interval
    const id = setInterval(() => {
      setMessages((prev) => [...prev.slice(-4), `msg @ ${new Date().toLocaleTimeString()}`]);
    }, 2000);
    return () => clearInterval(id);
  }, [url]);
  return messages;
}
function Ex48_UseEventSource() {
  const messages = useEventSource("/stream");
  return (
    <div>
      <p>Live messages (every 2s):</p>
      {messages.map((m, i) => <p key={i}>{m}</p>)}
    </div>
  );
}

// 49: useRef as imperative API
function Ex49_ImperativeRef() {
  const inputRef = useRef<HTMLInputElement>(null);
  const clear = () => { if (inputRef.current) { inputRef.current.value = ""; inputRef.current.focus(); } };
  return (
    <div>
      <input ref={inputRef} defaultValue="Hello" />
      <button onClick={clear}>Clear & Focus</button>
    </div>
  );
}

// 50: All advanced hooks together — live search dashboard
function Ex50_AllTogether() {
  const [query, setQuery] = useState("");
  const [sortAsc, toggleSort] = useToggle(true);
  const { copied, copy } = useClipboard();
  const online = useOnline();
  const deferredQuery = useDeferredValue(query);
  const [isPending, startTransition] = useTransition();

  const allItems = ["React", "Vue", "Angular", "Svelte", "Solid", "Qwik", "Ember", "Backbone"];
  const results = useMemo(() => {
    const filtered = allItems.filter((i) => i.toLowerCase().includes(deferredQuery.toLowerCase()));
    return sortAsc ? [...filtered].sort() : [...filtered].sort().reverse();
  }, [deferredQuery, sortAsc]);

  return (
    <div style={{ border: "1px solid #ccc", padding: 12 }}>
      <p style={{ color: online ? "green" : "red" }}>{online ? "● Online" : "● Offline"}</p>
      <input
        value={query}
        onChange={(e) => startTransition(() => setQuery(e.target.value))}
        placeholder="Search frameworks"
      />
      <button onClick={toggleSort}>Sort: {sortAsc ? "A→Z" : "Z→A"}</button>
      <button onClick={() => copy(results.join(", "))}>{copied ? "Copied!" : "Copy results"}</button>
      {isPending && <span> updating...</span>}
      <ul>{results.map((r) => <li key={r}>{r}</li>)}</ul>
    </div>
  );
}

// ─────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────

const examples: { label: string; component: JSX.Element }[] = [
  // useCallback
  { label: "01 – useCallback: Basic",                component: <Ex01_BasicCallback /> },
  { label: "02 – useCallback: Prevent Child Rerender",component: <Ex02_PreventChildRerender /> },
  { label: "03 – useCallback: With Dependency",      component: <Ex03_CallbackWithDep /> },
  { label: "04 – useCallback: Fetch on Dep Change",  component: <Ex04_CallbackForFetch /> },
  { label: "05 – useCallback: In List",              component: <Ex05_CallbackInList /> },
  { label: "06 – useCallback: Form Submit",          component: <Ex06_FormSubmitCallback /> },
  { label: "07 – useCallback: With Ref",             component: <Ex07_CallbackWithRef /> },
  { label: "08 – useCallback: Stable Event Handler", component: <Ex08_StableEventHandler /> },
  { label: "09 – useCallback: vs Inline",            component: <Ex09_CallbackVsInline /> },
  { label: "10 – useCallback: Debounce",             component: <Ex10_CallbackDebounce /> },
  // useMemo
  { label: "11 – useMemo: Basic Sum",                component: <Ex11_BasicMemo /> },
  { label: "12 – useMemo: Fibonacci",                component: <Ex12_ExpensiveComputation /> },
  { label: "13 – useMemo: Filter",                   component: <Ex13_MemoizedFilter /> },
  { label: "14 – useMemo: Sort",                     component: <Ex14_MemoizedSort /> },
  { label: "15 – useMemo: Object",                   component: <Ex15_MemoizedObject /> },
  { label: "16 – useMemo: Derived State",            component: <Ex16_DerivedState /> },
  { label: "17 – useMemo: Hypotenuse",               component: <Ex17_MemoWithDeps /> },
  { label: "18 – useMemo: Chart Data",               component: <Ex18_MemoForChartData /> },
  { label: "19 – useMemo: Chained Transforms",       component: <Ex19_MemoVsState /> },
  { label: "20 – useMemo: Style Object",             component: <Ex20_MemoComponent /> },
  // Custom Hooks
  { label: "21 – Custom: useLocalStorage",           component: <Ex21_UseLocalStorage /> },
  { label: "22 – Custom: useDebounce",               component: <Ex22_UseDebounce /> },
  { label: "23 – Custom: useFetch",                  component: <Ex23_UseFetch /> },
  { label: "24 – Custom: useToggle",                 component: <Ex24_UseToggle /> },
  { label: "25 – Custom: useCounter",                component: <Ex25_UseCounter /> },
  { label: "26 – Custom: useWindowSize",             component: <Ex26_UseWindowSize /> },
  { label: "27 – Custom: usePrevious",               component: <Ex27_UsePrevious /> },
  { label: "28 – Custom: useInterval",               component: <Ex28_UseInterval /> },
  { label: "29 – Custom: useHover",                  component: <Ex29_UseHover /> },
  { label: "30 – Custom: useMediaQuery",             component: <Ex30_UseMediaQuery /> },
  { label: "31 – Custom: useForm",                   component: <Ex31_UseForm /> },
  { label: "32 – Custom: useClipboard",              component: <Ex32_UseClipboard /> },
  { label: "33 – Custom: useOnline",                 component: <Ex33_UseOnline /> },
  { label: "34 – Custom: useKeyPress",               component: <Ex34_UseKeyPress /> },
  { label: "35 – Custom: useCountdown",              component: <Ex35_UseCountdown /> },
  // useLayoutEffect
  { label: "36 – useLayoutEffect: Measure",          component: <Ex36_MeasureBeforePaint /> },
  { label: "37 – useLayoutEffect: Sync Scroll",      component: <Ex37_SyncScrollPosition /> },
  { label: "38 – useLayoutEffect: Tooltip",          component: <Ex38_TooltipPosition /> },
  { label: "39 – useLayoutEffect: vs useEffect",     component: <Ex39_CompareEffects /> },
  { label: "40 – useLayoutEffect: Animation",        component: <Ex40_AnimationStart /> },
  // Hook Patterns
  { label: "41 – Pattern: Reducer + Context",        component: <Ex41_ReducerContext /> },
  { label: "42 – Pattern: State Machine",            component: <Ex42_StateMachine /> },
  { label: "43 – Pattern: Hook Composition",         component: <Ex43_HookComposition /> },
  { label: "44 – Pattern: useTransition",            component: <Ex44_UseTransition /> },
  { label: "45 – Pattern: useDeferredValue",         component: <Ex45_UseDeferredValue /> },
  { label: "46 – Pattern: useId (single)",           component: <Ex46_UseId /> },
  { label: "47 – Pattern: useId (multiple)",         component: <Ex47_MultipleUseId /> },
  { label: "48 – Pattern: Custom Cleanup Hook",      component: <Ex48_UseEventSource /> },
  { label: "49 – Pattern: Imperative Ref API",       component: <Ex49_ImperativeRef /> },
  { label: "50 – Pattern: All Together",             component: <Ex50_AllTogether /> },
];

export default function HooksAdvancedExamples() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: 24 }}>
      <h1>50 Advanced Hooks Examples (useCallback · useMemo · Custom Hooks · useLayoutEffect · Patterns)</h1>
      {examples.map(({ label, component }) => (
        <section key={label} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 24 }}>
          <h2 style={{ marginTop: 0, fontSize: 15, color: "#555" }}>{label}</h2>
          {component}
        </section>
      ))}
    </div>
  );
}
