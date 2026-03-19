import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useReducer,
  ReactNode,
} from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── BASIC hooks (1–12) ───────────────────────────────────────────────────────

function useToggle(initial = false): [boolean, () => void, (v: boolean) => void] {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue((v) => !v), []);
  return [value, toggle, setValue];
}

function useCounter(initial = 0, step = 1) {
  const [count, setCount] = useState(initial);
  const inc = useCallback(() => setCount((c) => c + step), [step]);
  const dec = useCallback(() => setCount((c) => c - step), [step]);
  const reset = useCallback(() => setCount(initial), [initial]);
  return { count, inc, dec, reset, setCount };
}

function useInput(initial = "") {
  const [value, setValue] = useState(initial);
  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value), []);
  const reset = useCallback(() => setValue(initial), [initial]);
  return { value, onChange, reset };
}

function useBoolean(initial = false) {
  const [value, setValue] = useState(initial);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  const toggle = useCallback(() => setValue((v) => !v), []);
  return { value, setTrue, setFalse, toggle };
}

function useString(initial = "") {
  const [value, setValue] = useState(initial);
  const upper = useMemo(() => value.toUpperCase(), [value]);
  const lower = useMemo(() => value.toLowerCase(), [value]);
  const reversed = useMemo(() => value.split("").reverse().join(""), [value]);
  const clear = useCallback(() => setValue(""), []);
  return { value, setValue, upper, lower, reversed, clear };
}

function useArray<T>(initial: T[] = []) {
  const [array, setArray] = useState<T[]>(initial);
  const push = useCallback((item: T) => setArray((a) => [...a, item]), []);
  const remove = useCallback((index: number) => setArray((a) => a.filter((_, i) => i !== index)), []);
  const clear = useCallback(() => setArray([]), []);
  const update = useCallback((index: number, item: T) => setArray((a) => a.map((v, i) => (i === index ? item : v))), []);
  return { array, push, remove, clear, update, setArray };
}

function useNumber(initial = 0) {
  const [value, setValue] = useState(initial);
  const inc = useCallback(() => setValue((v) => v + 1), []);
  const dec = useCallback(() => setValue((v) => v - 1), []);
  const reset = useCallback(() => setValue(initial), [initial]);
  return { value, setValue, inc, dec, reset };
}

function useLocalStorage<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void, () => void] {
  const [stored, setStored] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initial;
    } catch {
      return initial;
    }
  });
  const setValue = useCallback(
    (v: T | ((prev: T) => T)) => {
      setStored((prev) => {
        const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
        try { window.localStorage.setItem(key, JSON.stringify(next)); } catch {}
        return next;
      });
    },
    [key]
  );
  const clear = useCallback(() => {
    try { window.localStorage.removeItem(key); } catch {}
    setStored(initial);
  }, [key, initial]);
  return [stored, setValue, clear];
}

function useSessionStorage<T>(key: string, initial: T): [T, (v: T) => void] {
  const [stored, setStored] = useState<T>(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initial;
    } catch {
      return initial;
    }
  });
  const setValue = useCallback(
    (v: T) => {
      try { window.sessionStorage.setItem(key, JSON.stringify(v)); } catch {}
      setStored(v);
    },
    [key]
  );
  return [stored, setValue];
}

function useDefault<T>(value: T | undefined | null, defaultValue: T): T {
  return useMemo(() => (value ?? defaultValue), [value, defaultValue]);
}

// ─── INTERMEDIATE hooks (13–25) ──────────────────────────────────────────────

interface FetchState<T> { data: T | null; loading: boolean; error: string | null }
function useFetch<T>(url: string) {
  const [state, setState] = useState<FetchState<T>>({ data: null, loading: false, error: null });
  const refetch = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: T = await res.json();
      setState({ data, loading: false, error: null });
    } catch (e) {
      setState({ data: null, loading: false, error: (e as Error).message });
    }
  }, [url]);
  useEffect(() => { refetch(); }, [refetch]);
  return { ...state, refetch };
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function useThrottle<T>(value: T, interval: number): T {
  const [throttled, setThrottled] = useState(value);
  const lastUpdated = useRef(Date.now());
  useEffect(() => {
    const now = Date.now();
    if (now - lastUpdated.current >= interval) {
      lastUpdated.current = now;
      setThrottled(value);
    } else {
      const id = setTimeout(() => { lastUpdated.current = Date.now(); setThrottled(value); }, interval);
      return () => clearTimeout(id);
    }
  }, [value, interval]);
  return throttled;
}

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => { ref.current = value; });
  return ref.current;
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

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

function useHover(): [React.RefObject<HTMLElement | null>, boolean] {
  const ref = useRef<HTMLElement | null>(null);
  const [hovered, setHovered] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const enter = () => setHovered(true);
    const leave = () => setHovered(false);
    el.addEventListener("mouseenter", enter);
    el.addEventListener("mouseleave", leave);
    return () => { el.removeEventListener("mouseenter", enter); el.removeEventListener("mouseleave", leave); };
  }, []);
  return [ref, hovered];
}

function useClickOutside(callback: () => void): React.RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) callback();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [callback]);
  return ref;
}

function useOnline(): boolean {
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

function useKeyPress(targetKey: string): boolean {
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

function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);
  useEffect(() => { savedCallback.current = callback; });
  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

function useTimeout(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);
  useEffect(() => { savedCallback.current = callback; });
  useEffect(() => {
    if (delay === null) return;
    const id = setTimeout(() => savedCallback.current(), delay);
    return () => clearTimeout(id);
  }, [delay]);
}

// ─── NESTED hooks (26–37) ─────────────────────────────────────────────────────

interface FormValues { [key: string]: string }
interface FormErrors { [key: string]: string }
type Validator = (values: FormValues) => FormErrors;
function useForm(initialValues: FormValues, validate?: Validator) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const handleChange = useCallback((field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const v = e.target.value;
    setValues((prev) => ({ ...prev, [field]: v }));
    if (validate) setErrors(validate({ ...values, [field]: v }));
  }, [values, validate]);
  const handleBlur = useCallback((field: string) => () => setTouched((t) => ({ ...t, [field]: true })), []);
  const reset = useCallback(() => { setValues(initialValues); setErrors({}); setTouched({}); }, [initialValues]);
  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);
  return { values, errors, touched, handleChange, handleBlur, reset, isValid };
}

function useMultiStep(steps: string[]) {
  const [currentStep, setCurrentStep] = useState(0);
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const next = useCallback(() => setCurrentStep((s) => Math.min(s + 1, steps.length - 1)), [steps.length]);
  const prev = useCallback(() => setCurrentStep((s) => Math.max(s - 1, 0)), []);
  const goTo = useCallback((i: number) => setCurrentStep(Math.max(0, Math.min(i, steps.length - 1))), [steps.length]);
  return { currentStep, step: steps[currentStep], isFirst, isLast, next, prev, goTo };
}

function useUndoRedo<T>(initial: T) {
  const [history, setHistory] = useState<T[]>([initial]);
  const [cursor, setCursor] = useState(0);
  const current = history[cursor];
  const canUndo = cursor > 0;
  const canRedo = cursor < history.length - 1;
  const set = useCallback((value: T) => {
    setHistory((h) => [...h.slice(0, cursor + 1), value]);
    setCursor((c) => c + 1);
  }, [cursor]);
  const undo = useCallback(() => { if (canUndo) setCursor((c) => c - 1); }, [canUndo]);
  const redo = useCallback(() => { if (canRedo) setCursor((c) => c + 1); }, [canRedo]);
  return { current, set, undo, redo, canUndo, canRedo };
}

function useList<T>(initial: T[] = []) {
  const [list, setList] = useState<T[]>(initial);
  const add = useCallback((item: T) => setList((l) => [...l, item]), []);
  const remove = useCallback((predicate: (item: T) => boolean) => setList((l) => l.filter((i) => !predicate(i))), []);
  const update = useCallback((predicate: (item: T) => boolean, updater: (item: T) => T) =>
    setList((l) => l.map((i) => (predicate(i) ? updater(i) : i))), []);
  const clear = useCallback(() => setList([]), []);
  const move = useCallback((from: number, to: number) => setList((l) => {
    const next = [...l];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  }), []);
  return { list, add, remove, update, clear, move };
}

function usePagination<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(items.length / pageSize);
  const pageItems = useMemo(() => items.slice((page - 1) * pageSize, page * pageSize), [items, page, pageSize]);
  const goNext = useCallback(() => setPage((p) => Math.min(p + 1, totalPages)), [totalPages]);
  const goPrev = useCallback(() => setPage((p) => Math.max(p - 1, 1)), []);
  const goTo = useCallback((p: number) => setPage(Math.max(1, Math.min(p, totalPages))), [totalPages]);
  return { page, pageItems, totalPages, goNext, goPrev, goTo };
}

function useSearch<T>(items: T[], predicate: (item: T, q: string) => boolean) {
  const [query, setQuery] = useState("");
  const results = useMemo(
    () => (query.trim() ? items.filter((i) => predicate(i, query)) : items),
    [items, query, predicate]
  );
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value), []);
  return { query, handleChange, results, setQuery };
}

function useSort<T>(items: T[], key: keyof T) {
  const [ascending, setAscending] = useState(true);
  const [sortKey, setSortKey] = useState<keyof T>(key);
  const sorted = useMemo(
    () =>
      [...items].sort((a, b) => {
        const va = a[sortKey];
        const vb = b[sortKey];
        const cmp = va < vb ? -1 : va > vb ? 1 : 0;
        return ascending ? cmp : -cmp;
      }),
    [items, sortKey, ascending]
  );
  const toggle = useCallback((k: keyof T) => {
    if (k === sortKey) setAscending((a) => !a);
    else { setSortKey(k); setAscending(true); }
  }, [sortKey]);
  return { sorted, sortKey, ascending, toggle };
}

function useFilter<T>(items: T[], filterFn: (item: T, filters: Record<string, string>) => boolean) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const filtered = useMemo(() => items.filter((i) => filterFn(i, filters)), [items, filters, filterFn]);
  const setFilter = useCallback((key: string, value: string) => setFilters((f) => ({ ...f, [key]: value })), []);
  const clearFilter = useCallback((key: string) => setFilters((f) => { const next = { ...f }; delete next[key]; return next; }), []);
  const clearAll = useCallback(() => setFilters({}), []);
  return { filtered, filters, setFilter, clearFilter, clearAll };
}

function useSelect<T>(items: T[], getKey: (item: T) => string) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const isSelected = useCallback((item: T) => selectedKeys.has(getKey(item)), [selectedKeys, getKey]);
  const toggle = useCallback((item: T) => {
    const key = getKey(item);
    setSelectedKeys((prev) => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; });
  }, [getKey]);
  const selectAll = useCallback(() => setSelectedKeys(new Set(items.map(getKey))), [items, getKey]);
  const deselectAll = useCallback(() => setSelectedKeys(new Set()), []);
  const selected = useMemo(() => items.filter((i) => selectedKeys.has(getKey(i))), [items, selectedKeys, getKey]);
  return { selected, isSelected, toggle, selectAll, deselectAll };
}

function useCheckboxGroup(options: string[]) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const toggle = useCallback((opt: string) => {
    setChecked((prev) => { const next = new Set(prev); next.has(opt) ? next.delete(opt) : next.add(opt); return next; });
  }, []);
  const checkAll = useCallback(() => setChecked(new Set(options)), [options]);
  const uncheckAll = useCallback(() => setChecked(new Set()), []);
  const isChecked = useCallback((opt: string) => checked.has(opt), [checked]);
  return { checked: [...checked], isChecked, toggle, checkAll, uncheckAll };
}

// ─── ADVANCED hooks (38–50) ───────────────────────────────────────────────────

interface AsyncState<T> { data: T | null; loading: boolean; error: Error | null }
function useAsync<T>(asyncFn: () => Promise<T>, deps: React.DependencyList = []) {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fn = useCallback(asyncFn, deps);
  useEffect(() => {
    let cancelled = false;
    setState({ data: null, loading: true, error: null });
    fn()
      .then((data) => { if (!cancelled) setState({ data, loading: false, error: null }); })
      .catch((error) => { if (!cancelled) setState({ data: null, loading: false, error }); });
    return () => { cancelled = true; };
  }, [fn]);
  return state;
}

interface SSEState { data: string | null; status: "idle" | "connecting" | "open" | "closed" | "error" }
function useEventSource(url: string | null) {
  const [state, setState] = useState<SSEState>({ data: null, status: "idle" });
  useEffect(() => {
    if (!url) return;
    setState({ data: null, status: "connecting" });
    // Simulate SSE with a timer (browser EventSource needs a real server)
    setState((s) => ({ ...s, status: "open" }));
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setState({ data: `event-${i} at ${new Date().toLocaleTimeString()}`, status: "open" });
      if (i >= 5) { clearInterval(iv); setState((s) => ({ ...s, status: "closed" })); }
    }, 600);
    return () => { clearInterval(iv); setState((s) => ({ ...s, status: "closed" })); };
  }, [url]);
  return state;
}

function useIntersectionObserver(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(([e]) => setEntry(e), options);
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [options]);
  return { ref, entry, isVisible: entry?.isIntersecting ?? false };
}

function useResizeObserver() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width: Math.round(width), height: Math.round(height) });
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, size };
}

interface GeoState { position: GeolocationPosition | null; error: string | null; loading: boolean }
function useGeolocation() {
  const [state, setState] = useState<GeoState>({ position: null, error: null, loading: false });
  const getPosition = useCallback(() => {
    if (!navigator.geolocation) { setState((s) => ({ ...s, error: "Geolocation not supported" })); return; }
    setState({ position: null, error: null, loading: true });
    navigator.geolocation.getCurrentPosition(
      (pos) => setState({ position: pos, error: null, loading: false }),
      (err) => setState({ position: null, error: err.message, loading: false })
    );
  }, []);
  return { ...state, getPosition };
}

interface BatteryState { level: number | null; charging: boolean | null; supported: boolean }
function useBattery() {
  const [state, setState] = useState<BatteryState>({ level: null, charging: null, supported: false });
  useEffect(() => {
    if (!("getBattery" in navigator)) return;
    (navigator as unknown as { getBattery: () => Promise<{ level: number; charging: boolean }> }).getBattery().then((battery) => {
      setState({ level: battery.level, charging: battery.charging, supported: true });
    }).catch(() => {});
  }, []);
  return state;
}

function useClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), timeout);
    } catch {}
  }, [timeout]);
  return { copied, copy };
}

function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);
  useInterval(() => {
    setRemaining((r) => {
      if (r <= 1) { setRunning(false); return 0; }
      return r - 1;
    });
  }, running ? 1000 : null);
  const start = useCallback(() => { setRemaining(seconds); setRunning(true); }, [seconds]);
  const pause = useCallback(() => setRunning((r) => !r), []);
  const reset = useCallback(() => { setRunning(false); setRemaining(seconds); }, [seconds]);
  return { remaining, running, start, pause, reset };
}

function useLatestCallback<T extends (...args: unknown[]) => unknown>(fn: T): T {
  const ref = useRef<T>(fn);
  useEffect(() => { ref.current = fn; });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(((...args) => ref.current(...args)) as T, []);
}

function useStableCallback<T extends (...args: unknown[]) => unknown>(fn: T): T {
  const ref = useRef<T>(fn);
  ref.current = fn;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(((...args) => ref.current(...args)) as T, []);
}

function useEventCallback<T extends (...args: unknown[]) => unknown>(fn: T): T {
  const ref = useRef<T>(fn);
  useEffect(() => { ref.current = fn; });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(((...args) => ref.current(...args)) as T, []);
}

function useIsFirstRender(): boolean {
  const isFirst = useRef(true);
  if (isFirst.current) { isFirst.current = false; return true; }
  return false;
}

function useUpdateEffect(effect: React.EffectCallback, deps: React.DependencyList) {
  const isFirst = useRef(true);
  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    return effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEMO COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── BASIC (1–12) ────────────────────────────────────────────────────────────

function Ex01_UseToggle() {
  const [on, toggle] = useToggle(false);
  return (
    <div>
      <button onClick={toggle}>{on ? "ON" : "OFF"}</button>
      <span style={{ marginLeft: 12, color: on ? "green" : "gray" }}>State: {String(on)}</span>
    </div>
  );
}

function Ex02_UseCounter() {
  const { count, inc, dec, reset } = useCounter(0, 5);
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <button onClick={dec}>−5</button>
      <strong>{count}</strong>
      <button onClick={inc}>+5</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}

function Ex03_UseInput() {
  const name = useInput("World");
  return (
    <div>
      <input {...{ value: name.value, onChange: name.onChange }} placeholder="Your name" />
      <button onClick={name.reset} style={{ marginLeft: 8 }}>Reset</button>
      <p>Hello, {name.value || "…"}!</p>
    </div>
  );
}

function Ex04_UseBoolean() {
  const modal = useBoolean(false);
  return (
    <div>
      <button onClick={modal.setTrue}>Open</button>
      {modal.value && (
        <div style={{ border: "1px solid #ccc", padding: 12, marginTop: 8, borderRadius: 6 }}>
          <strong>Modal</strong>
          <button onClick={modal.setFalse} style={{ marginLeft: 12 }}>Close</button>
        </div>
      )}
    </div>
  );
}

function Ex05_UseString() {
  const str = useString("Hello React");
  return (
    <div>
      <input value={str.value} onChange={(e) => str.setValue(e.target.value)} />
      <button onClick={str.clear} style={{ marginLeft: 8 }}>Clear</button>
      <p>Upper: {str.upper}</p>
      <p>Lower: {str.lower}</p>
      <p>Reversed: {str.reversed}</p>
    </div>
  );
}

function Ex06_UseArray() {
  const { array, push, remove, clear } = useArray<string>([]);
  const [draft, setDraft] = useState("");
  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="New item" />
        <button onClick={() => { push(draft); setDraft(""); }} disabled={!draft}>Add</button>
        <button onClick={clear}>Clear</button>
      </div>
      <ul style={{ paddingLeft: 20, margin: "4px 0" }}>
        {array.map((item, i) => (
          <li key={i}>{item} <button onClick={() => remove(i)}>✕</button></li>
        ))}
      </ul>
    </div>
  );
}

function Ex07_UseNumber() {
  const { value, inc, dec, reset } = useNumber(10);
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <button onClick={dec}>−1</button>
      <strong>{value}</strong>
      <button onClick={inc}>+1</button>
      <button onClick={reset}>Reset (10)</button>
    </div>
  );
}

function Ex08_UseLocalStorage() {
  const [name, setName, clearName] = useLocalStorage("demo_name", "");
  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (persisted)" />
      <button onClick={clearName} style={{ marginLeft: 8 }}>Clear storage</button>
      <p style={{ fontSize: 12 }}>Value is persisted in localStorage under "demo_name"</p>
    </div>
  );
}

function Ex09_UseSessionStorage() {
  const [token, setToken] = useSessionStorage("demo_token", "");
  return (
    <div>
      <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Session value" />
      <p style={{ fontSize: 12 }}>Stored in sessionStorage — clears on tab close</p>
    </div>
  );
}

function Ex10_UseDefault() {
  const [raw, setRaw] = useState<string | undefined>(undefined);
  const value = useDefault(raw, "Default value");
  return (
    <div>
      <button onClick={() => setRaw("Custom!")}>Set value</button>{" "}
      <button onClick={() => setRaw(undefined)}>Clear (use default)</button>
      <p>Result: {value}</p>
    </div>
  );
}

function Ex11_UseToggleAdvanced() {
  const [dark, toggleDark, setDark] = useToggle(false);
  return (
    <div style={{ background: dark ? "#333" : "#f8f8f8", color: dark ? "#eee" : "#111", padding: 12, borderRadius: 6 }}>
      <button onClick={toggleDark}>Toggle theme</button>{" "}
      <button onClick={() => setDark(false)}>Force light</button>{" "}
      <button onClick={() => setDark(true)}>Force dark</button>
      <p>{dark ? "Dark mode" : "Light mode"}</p>
    </div>
  );
}

function Ex12_UseCounterMultiple() {
  const a = useCounter(0, 1);
  const b = useCounter(100, 10);
  return (
    <div style={{ display: "flex", gap: 24 }}>
      <div>
        <strong>Counter A (step 1)</strong>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={a.dec}>−</button><span>{a.count}</span><button onClick={a.inc}>+</button><button onClick={a.reset}>R</button>
        </div>
      </div>
      <div>
        <strong>Counter B (step 10)</strong>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={b.dec}>−</button><span>{b.count}</span><button onClick={b.inc}>+</button><button onClick={b.reset}>R</button>
        </div>
      </div>
    </div>
  );
}

// ─── INTERMEDIATE (13–25) ─────────────────────────────────────────────────────

function Ex13_UseFetch() {
  const { data, loading, error, refetch } = useFetch<{ id: number; title: string }>(
    "https://jsonplaceholder.typicode.com/todos/1"
  );
  return (
    <div>
      <button onClick={refetch}>Refetch</button>
      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {data && <p>#{data.id}: {data.title}</p>}
    </div>
  );
}

function Ex14_UseDebounce() {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 500);
  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type to debounce…" />
      <p>Raw: "{query}"</p>
      <p>Debounced (500 ms): "{debounced}"</p>
    </div>
  );
}

function Ex15_UseThrottle() {
  const [raw, setRaw] = useState(0);
  const throttled = useThrottle(raw, 500);
  return (
    <div>
      <button onClick={() => setRaw((r) => r + 1)}>Increment (click fast)</button>
      <p>Raw: {raw}</p>
      <p>Throttled (500 ms): {throttled}</p>
    </div>
  );
}

function Ex16_UsePrevious() {
  const [count, setCount] = useState(0);
  const prev = usePrevious(count);
  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>+1</button>
      <p>Current: {count} | Previous: {prev ?? "none"}</p>
    </div>
  );
}

function Ex17_UseWindowSize() {
  const { width, height } = useWindowSize();
  return (
    <div style={{ padding: 8, background: "#eef", borderRadius: 4 }}>
      Window: {width} × {height} px (resize browser to see update)
    </div>
  );
}

function Ex18_UseMediaQuery() {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const prefersLight = useMediaQuery("(prefers-color-scheme: light)");
  return (
    <div>
      <p>Mobile (≤640px): <strong>{String(isMobile)}</strong></p>
      <p>Prefers light: <strong>{String(prefersLight)}</strong></p>
    </div>
  );
}

function Ex19_UseHover() {
  const [ref, hovered] = useHover();
  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      style={{ padding: 16, background: hovered ? "#4a90d9" : "#eee", color: hovered ? "#fff" : "#333", borderRadius: 6, cursor: "default", transition: "all 0.2s" }}
    >
      {hovered ? "Hovering!" : "Hover over me"}
    </div>
  );
}

function Ex20_UseClickOutside() {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => setOpen((o) => !o)}>Toggle dropdown</button>
      {open && (
        <div
          ref={ref}
          style={{ position: "absolute", top: "100%", left: 0, background: "#fff", border: "1px solid #ccc", borderRadius: 4, padding: 8, zIndex: 10, minWidth: 120 }}
        >
          <p style={{ margin: 0 }}>Click outside to close</p>
          <p style={{ margin: 0 }}>Item 1</p>
          <p style={{ margin: 0 }}>Item 2</p>
        </div>
      )}
    </div>
  );
}

function Ex21_UseOnline() {
  const online = useOnline();
  return (
    <div style={{ padding: 8, background: online ? "#d4edda" : "#f8d7da", borderRadius: 4 }}>
      Status: <strong>{online ? "Online" : "Offline"}</strong> (toggle network in DevTools to see change)
    </div>
  );
}

function Ex22_UseKeyPress() {
  const spacePressed = useKeyPress(" ");
  const enterPressed = useKeyPress("Enter");
  return (
    <div style={{ padding: 12, border: "1px solid #ccc", borderRadius: 4 }}>
      <p>Press Space or Enter</p>
      <p>Space: <strong style={{ color: spacePressed ? "green" : "gray" }}>{spacePressed ? "HELD" : "released"}</strong></p>
      <p>Enter: <strong style={{ color: enterPressed ? "green" : "gray" }}>{enterPressed ? "HELD" : "released"}</strong></p>
    </div>
  );
}

function Ex23_UseInterval() {
  const [count, setCount] = useState(0);
  const [active, setActive] = useState(false);
  useInterval(() => setCount((c) => c + 1), active ? 1000 : null);
  return (
    <div>
      <button onClick={() => setActive((a) => !a)}>{active ? "Pause" : "Start"}</button>{" "}
      <button onClick={() => setCount(0)}>Reset</button>
      <p>Ticks: {count}</p>
    </div>
  );
}

function Ex24_UseTimeout() {
  const [triggered, setTriggered] = useState(false);
  const [running, setRunning] = useState(false);
  useTimeout(() => { setTriggered(true); setRunning(false); }, running ? 2000 : null);
  return (
    <div>
      <button onClick={() => { setRunning(true); setTriggered(false); }}>
        Start 2s timeout
      </button>
      <p>{triggered ? "Timeout fired!" : running ? "Waiting…" : "Not started"}</p>
    </div>
  );
}

function Ex25_UseDebounceVsThrottle() {
  const [input, setInput] = useState("");
  const debounced = useDebounce(input, 400);
  const throttled = useThrottle(input, 400);
  return (
    <div>
      <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type rapidly…" style={{ width: 220 }} />
      <p>Raw: "{input}"</p>
      <p>Debounced (400ms): "{debounced}"</p>
      <p>Throttled (400ms): "{throttled}"</p>
    </div>
  );
}

// ─── NESTED (26–37) ───────────────────────────────────────────────────────────

function Ex26_UseForm() {
  const validate = useCallback((v: FormValues): FormErrors => {
    const errs: FormErrors = {};
    if (!v.name || v.name.length < 2) errs.name = "Name too short";
    if (!v.email || !v.email.includes("@")) errs.email = "Invalid email";
    return errs;
  }, []);
  const { values, errors, touched, handleChange, handleBlur, reset, isValid } = useForm(
    { name: "", email: "" },
    validate
  );
  return (
    <form onSubmit={(e) => e.preventDefault()} style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 240 }}>
      <input value={values.name} onChange={handleChange("name")} onBlur={handleBlur("name")} placeholder="Name" />
      {touched.name && errors.name && <span style={{ color: "red", fontSize: 12 }}>{errors.name}</span>}
      <input value={values.email} onChange={handleChange("email")} onBlur={handleBlur("email")} placeholder="Email" />
      {touched.email && errors.email && <span style={{ color: "red", fontSize: 12 }}>{errors.email}</span>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" disabled={!isValid}>Submit</button>
        <button type="button" onClick={reset}>Reset</button>
      </div>
    </form>
  );
}

function Ex27_UseMultiStep() {
  const steps = ["Personal Info", "Address", "Payment", "Review"];
  const { step, currentStep, isFirst, isLast, next, prev } = useMultiStep(steps);
  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {steps.map((s, i) => (
          <span key={s} style={{ padding: "2px 8px", borderRadius: 4, background: i === currentStep ? "#4a90d9" : "#eee", color: i === currentStep ? "#fff" : "#333", fontSize: 12 }}>
            {s}
          </span>
        ))}
      </div>
      <p>Step {currentStep + 1}/{steps.length}: <strong>{step}</strong></p>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={prev} disabled={isFirst}>Back</button>
        <button onClick={next} disabled={isLast}>Next</button>
      </div>
    </div>
  );
}

function Ex28_UseUndoRedo() {
  const { current, set, undo, redo, canUndo, canRedo } = useUndoRedo("");
  const [draft, setDraft] = useState("");
  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type then commit" />
        <button onClick={() => { set(draft); setDraft(""); }} disabled={!draft}>Commit</button>
      </div>
      <p>Current: "{current}"</p>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={undo} disabled={!canUndo}>Undo</button>
        <button onClick={redo} disabled={!canRedo}>Redo</button>
      </div>
    </div>
  );
}

function Ex29_UseList() {
  const { list, add, remove, move } = useList<{ id: number; text: string }>([]);
  const idRef = useRef(0);
  return (
    <div>
      <button onClick={() => { idRef.current++; add({ id: idRef.current, text: `Task ${idRef.current}` }); }}>
        Add task
      </button>
      <ul style={{ paddingLeft: 20, margin: "4px 0" }}>
        {list.map((item, i) => (
          <li key={item.id} style={{ display: "flex", gap: 8 }}>
            {item.text}
            <button onClick={() => remove((t) => t.id === item.id)}>✕</button>
            {i > 0 && <button onClick={() => move(i, i - 1)}>↑</button>}
            {i < list.length - 1 && <button onClick={() => move(i, i + 1)}>↓</button>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Ex30_UsePagination() {
  const items = useMemo(() => Array.from({ length: 25 }, (_, i) => `Item ${i + 1}`), []);
  const { page, pageItems, totalPages, goNext, goPrev } = usePagination(items, 5);
  return (
    <div>
      <ul style={{ paddingLeft: 20, margin: "0 0 8px" }}>
        {pageItems.map((i) => <li key={i}>{i}</li>)}
      </ul>
      <button onClick={goPrev} disabled={page === 1}>Prev</button>{" "}
      <span>Page {page}/{totalPages}</span>{" "}
      <button onClick={goNext} disabled={page === totalPages}>Next</button>
    </div>
  );
}

function Ex31_UseSearch() {
  const items = useMemo(() => ["React", "Vue", "Angular", "Svelte", "Solid", "Next.js", "Remix", "Astro"], []);
  const predicate = useCallback((item: string, q: string) => item.toLowerCase().includes(q.toLowerCase()), []);
  const { query, handleChange, results } = useSearch(items, predicate);
  return (
    <div>
      <input value={query} onChange={handleChange} placeholder="Search frameworks…" />
      <ul style={{ paddingLeft: 20, margin: "4px 0" }}>
        {results.map((r) => <li key={r}>{r}</li>)}
      </ul>
    </div>
  );
}

function Ex32_UseSort() {
  const items = useMemo(
    () => [
      { name: "Banana", price: 1.5 },
      { name: "Apple", price: 2.0 },
      { name: "Cherry", price: 4.5 },
      { name: "Date", price: 3.2 },
    ],
    []
  );
  const { sorted, sortKey, ascending, toggle } = useSort(items, "name");
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        {(["name", "price"] as const).map((k) => (
          <button key={k} onClick={() => toggle(k)}>
            {k} {sortKey === k ? (ascending ? "↑" : "↓") : ""}
          </button>
        ))}
      </div>
      <ul style={{ paddingLeft: 20, margin: 0 }}>
        {sorted.map((i) => <li key={i.name}>{i.name} — ${i.price}</li>)}
      </ul>
    </div>
  );
}

function Ex33_UseFilter() {
  const items = useMemo(
    () => [
      { name: "T-Shirt", category: "clothing", inStock: true },
      { name: "Laptop", category: "electronics", inStock: true },
      { name: "Jeans", category: "clothing", inStock: false },
      { name: "Phone", category: "electronics", inStock: true },
      { name: "Hat", category: "clothing", inStock: true },
    ],
    []
  );
  const filterFn = useCallback(
    (item: (typeof items)[0], filters: Record<string, string>) => {
      if (filters.category && item.category !== filters.category) return false;
      if (filters.inStock === "true" && !item.inStock) return false;
      return true;
    },
    []
  );
  const { filtered, filters, setFilter, clearAll } = useFilter(items, filterFn);
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <select value={filters.category ?? ""} onChange={(e) => setFilter("category", e.target.value)}>
          <option value="">All categories</option>
          <option value="clothing">Clothing</option>
          <option value="electronics">Electronics</option>
        </select>
        <label>
          <input type="checkbox" checked={filters.inStock === "true"} onChange={(e) => setFilter("inStock", e.target.checked ? "true" : "")} />
          {" "}In stock only
        </label>
        <button onClick={clearAll}>Clear</button>
      </div>
      <ul style={{ paddingLeft: 20, margin: 0 }}>
        {filtered.map((i) => <li key={i.name}>{i.name} {!i.inStock && <span style={{ color: "red" }}>(out of stock)</span>}</li>)}
      </ul>
    </div>
  );
}

function Ex34_UseSelect() {
  const items = useMemo(() => [
    { id: "1", name: "Alice" },
    { id: "2", name: "Bob" },
    { id: "3", name: "Charlie" },
    { id: "4", name: "Diana" },
  ], []);
  const getKey = useCallback((i: { id: string }) => i.id, []);
  const { selected, isSelected, toggle, selectAll, deselectAll } = useSelect(items, getKey);
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button onClick={selectAll}>Select all</button>
        <button onClick={deselectAll}>Deselect all</button>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {items.map((item) => (
          <span
            key={item.id}
            onClick={() => toggle(item)}
            style={{ padding: "4px 10px", borderRadius: 4, cursor: "pointer", background: isSelected(item) ? "#4a90d9" : "#eee", color: isSelected(item) ? "#fff" : "#333" }}
          >
            {item.name}
          </span>
        ))}
      </div>
      <p style={{ fontSize: 12 }}>Selected: {selected.map((i) => i.name).join(", ") || "none"}</p>
    </div>
  );
}

function Ex35_UseCheckboxGroup() {
  const options = ["React", "Vue", "Angular", "Svelte"];
  const { checked, isChecked, toggle, checkAll, uncheckAll } = useCheckboxGroup(options);
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button onClick={checkAll}>All</button>
        <button onClick={uncheckAll}>None</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {options.map((opt) => (
          <label key={opt} style={{ display: "flex", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={isChecked(opt)} onChange={() => toggle(opt)} />
            {opt}
          </label>
        ))}
      </div>
      <p style={{ fontSize: 12 }}>Checked: {checked.join(", ") || "none"}</p>
    </div>
  );
}

function Ex36_UseFormMultiField() {
  const validate = useCallback((v: FormValues): FormErrors => {
    const e: FormErrors = {};
    if (!v.username || v.username.length < 3) e.username = "Too short";
    if (!v.password || v.password.length < 6) e.password = "Min 6 chars";
    if (v.confirm !== v.password) e.confirm = "Passwords don't match";
    return e;
  }, []);
  const { values, errors, touched, handleChange, handleBlur, reset, isValid } = useForm(
    { username: "", password: "", confirm: "" },
    validate
  );
  return (
    <form onSubmit={(e) => e.preventDefault()} style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 240 }}>
      {(["username", "password", "confirm"] as const).map((field) => (
        <div key={field}>
          <input
            type={field !== "username" ? "password" : "text"}
            value={values[field]}
            onChange={handleChange(field)}
            onBlur={handleBlur(field)}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
          />
          {touched[field] && errors[field] && <div style={{ color: "red", fontSize: 11 }}>{errors[field]}</div>}
        </div>
      ))}
      <div style={{ display: "flex", gap: 8 }}>
        <button disabled={!isValid}>Register</button>
        <button type="button" onClick={reset}>Reset</button>
      </div>
    </form>
  );
}

function Ex37_ComposedHooks() {
  const searchItems = useMemo(() => Array.from({ length: 50 }, (_, i) => `Product ${i + 1}`), []);
  const predicate = useCallback((item: string, q: string) => item.toLowerCase().includes(q.toLowerCase()), []);
  const { query, handleChange: handleSearch, results } = useSearch(searchItems, predicate);
  const { page, pageItems, totalPages, goNext, goPrev } = usePagination(results, 5);
  const debounced = useDebounce(query, 300);
  return (
    <div>
      <input value={query} onChange={handleSearch} placeholder="Search + paginate (debounced)" />
      <p style={{ fontSize: 12 }}>Debounced query: "{debounced}" | {results.length} results</p>
      <ul style={{ paddingLeft: 20, margin: "4px 0" }}>
        {pageItems.map((i) => <li key={i}>{i}</li>)}
      </ul>
      <button onClick={goPrev} disabled={page === 1}>Prev</button>{" "}
      <span>Page {page}/{totalPages || 1}</span>{" "}
      <button onClick={goNext} disabled={page >= totalPages}>Next</button>
    </div>
  );
}

// ─── ADVANCED (38–50) ─────────────────────────────────────────────────────────

function Ex38_UseAsync() {
  const [id, setId] = useState(1);
  const { data, loading, error } = useAsync<{ id: number; title: string }>(
    () => fetch(`https://jsonplaceholder.typicode.com/todos/${id}`).then((r) => r.json()),
    [id]
  );
  return (
    <div>
      <label>
        ID:{" "}
        <input type="number" value={id} min={1} max={200} onChange={(e) => setId(Number(e.target.value))} style={{ width: 60 }} />
      </label>
      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}
      {data && <p>#{data.id}: {data.title}</p>}
    </div>
  );
}

function Ex39_UseEventSource() {
  const [active, setActive] = useState(false);
  const { data, status } = useEventSource(active ? "simulated" : null);
  return (
    <div>
      <button onClick={() => setActive((a) => !a)}>{active ? "Stop" : "Start"} SSE</button>
      <p>Status: {status}</p>
      {data && <p>Last event: {data}</p>}
    </div>
  );
}

function Ex40_UseIntersectionObserver() {
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.5 });
  return (
    <div>
      <p style={{ color: "#888", fontSize: 12 }}>Scroll to see the box below enter view</p>
      <div style={{ height: 60, overflow: "auto", border: "1px solid #ccc" }}>
        <div style={{ height: 40 }} />
        <div
          ref={ref}
          style={{ height: 40, background: isVisible ? "#d4edda" : "#f8d7da", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.3s" }}
        >
          {isVisible ? "Visible!" : "Not visible"}
        </div>
        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}

function Ex41_UseResizeObserver() {
  const { ref, size } = useResizeObserver();
  const [width, setWidth] = useState(200);
  return (
    <div>
      <label>
        Width:{" "}
        <input type="range" min={100} max={400} value={width} onChange={(e) => setWidth(Number(e.target.value))} style={{ width: 120 }} />
        {width}px
      </label>
      <div ref={ref} style={{ width, padding: 12, background: "#eef", borderRadius: 4, marginTop: 8 }}>
        Observed: {size.width}×{size.height} px
      </div>
    </div>
  );
}

function Ex42_UseGeolocation() {
  const { position, error, loading, getPosition } = useGeolocation();
  return (
    <div>
      <button onClick={getPosition} disabled={loading}>
        {loading ? "Getting location…" : "Get my location"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {position && (
        <p>
          Lat: {position.coords.latitude.toFixed(4)} |
          Lon: {position.coords.longitude.toFixed(4)}
        </p>
      )}
    </div>
  );
}

function Ex43_UseBattery() {
  const { level, charging, supported } = useBattery();
  if (!supported) return <p style={{ color: "#888" }}>Battery API not supported in this browser.</p>;
  return (
    <div>
      <p>Level: {level !== null ? `${(level * 100).toFixed(0)}%` : "unknown"}</p>
      <p>Charging: {charging !== null ? String(charging) : "unknown"}</p>
    </div>
  );
}

function Ex44_UseClipboard() {
  const { copied, copy } = useClipboard();
  const [text, setText] = useState("Hello, clipboard!");
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <input value={text} onChange={(e) => setText(e.target.value)} style={{ flex: 1 }} />
      <button onClick={() => copy(text)}>{copied ? "Copied!" : "Copy"}</button>
    </div>
  );
}

function Ex45_UseCountdown() {
  const { remaining, running, start, pause, reset } = useCountdown(30);
  const pct = (remaining / 30) * 100;
  return (
    <div>
      <div style={{ height: 8, background: "#eee", borderRadius: 4, marginBottom: 8 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: remaining > 10 ? "#4a90d9" : "red", borderRadius: 4, transition: "width 1s linear" }} />
      </div>
      <p>{remaining}s remaining</p>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={start} disabled={running}>Start</button>
        <button onClick={pause} disabled={remaining === 30}>{running ? "Pause" : "Resume"}</button>
        <button onClick={reset}>Reset</button>
      </div>
    </div>
  );
}

function Ex46_UseLatestCallback() {
  const [count, setCount] = useState(0);
  const getCount = useLatestCallback(() => count);
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>+1</button>{" "}
      <button onClick={() => alert(`Latest count: ${getCount()}`)}>Alert latest (stable ref)</button>
    </div>
  );
}

function Ex47_UseStableCallback() {
  const [value, setValue] = useState(0);
  const logValue = useStableCallback(() => console.log("Value:", value));
  useEffect(() => {
    const id = setTimeout(logValue, 1000);
    return () => clearTimeout(id);
    // logValue is stable — effect only runs once
  }, [logValue]);
  return (
    <div>
      <p>Value: {value} (check console in 1s after mount)</p>
      <button onClick={() => setValue((v) => v + 1)}>+1</button>
    </div>
  );
}

function Ex48_UseEventCallback() {
  const [count, setCount] = useState(0);
  const handler = useEventCallback(() => {
    console.log("handler sees count:", count);
    setCount((c) => c + 1);
  });
  useEffect(() => {
    window.addEventListener("click", handler as EventListener);
    return () => window.removeEventListener("click", handler as EventListener);
    // handler is stable
  }, [handler]);
  return (
    <div style={{ padding: 12, background: "#eef", borderRadius: 4 }}>
      <p>Count: {count}</p>
      <p style={{ fontSize: 12, color: "#888" }}>Click anywhere on the page</p>
    </div>
  );
}

function Ex49_UseIsFirstRender() {
  const isFirst = useIsFirstRender();
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>Is first render: <strong>{String(isFirst)}</strong></p>
      <p>Render count proxy (click to re-render): {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>Re-render</button>
    </div>
  );
}

function Ex50_UseUpdateEffect() {
  const [query, setQuery] = useState("");
  const [log, setLog] = useState<string[]>([]);
  useUpdateEffect(() => {
    setLog((l) => [...l.slice(-4), `Query changed to: "${query}"`]);
  }, [query]);
  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type to trigger update effect" />
      <p style={{ fontSize: 12, color: "#888" }}>Effect skips first render — only fires on updates</p>
      <ul style={{ paddingLeft: 20, margin: "4px 0", fontSize: 12 }}>
        {log.map((l, i) => <li key={i}>{l}</li>)}
      </ul>
    </div>
  );
}

// ─── Examples registry ────────────────────────────────────────────────────────

const examples: { label: string; component: JSX.Element }[] = [
  { label: "01 [Basic] useToggle", component: <Ex01_UseToggle /> },
  { label: "02 [Basic] useCounter", component: <Ex02_UseCounter /> },
  { label: "03 [Basic] useInput", component: <Ex03_UseInput /> },
  { label: "04 [Basic] useBoolean", component: <Ex04_UseBoolean /> },
  { label: "05 [Basic] useString", component: <Ex05_UseString /> },
  { label: "06 [Basic] useArray", component: <Ex06_UseArray /> },
  { label: "07 [Basic] useNumber", component: <Ex07_UseNumber /> },
  { label: "08 [Basic] useLocalStorage", component: <Ex08_UseLocalStorage /> },
  { label: "09 [Basic] useSessionStorage", component: <Ex09_UseSessionStorage /> },
  { label: "10 [Basic] useDefault", component: <Ex10_UseDefault /> },
  { label: "11 [Basic] useToggle (advanced — set/force)", component: <Ex11_UseToggleAdvanced /> },
  { label: "12 [Basic] useCounter (multiple instances)", component: <Ex12_UseCounterMultiple /> },
  { label: "13 [Intermediate] useFetch", component: <Ex13_UseFetch /> },
  { label: "14 [Intermediate] useDebounce", component: <Ex14_UseDebounce /> },
  { label: "15 [Intermediate] useThrottle", component: <Ex15_UseThrottle /> },
  { label: "16 [Intermediate] usePrevious", component: <Ex16_UsePrevious /> },
  { label: "17 [Intermediate] useWindowSize", component: <Ex17_UseWindowSize /> },
  { label: "18 [Intermediate] useMediaQuery", component: <Ex18_UseMediaQuery /> },
  { label: "19 [Intermediate] useHover", component: <Ex19_UseHover /> },
  { label: "20 [Intermediate] useClickOutside", component: <Ex20_UseClickOutside /> },
  { label: "21 [Intermediate] useOnline", component: <Ex21_UseOnline /> },
  { label: "22 [Intermediate] useKeyPress", component: <Ex22_UseKeyPress /> },
  { label: "23 [Intermediate] useInterval", component: <Ex23_UseInterval /> },
  { label: "24 [Intermediate] useTimeout", component: <Ex24_UseTimeout /> },
  { label: "25 [Intermediate] useDebounce vs useThrottle", component: <Ex25_UseDebounceVsThrottle /> },
  { label: "26 [Nested] useForm (single field validation)", component: <Ex26_UseForm /> },
  { label: "27 [Nested] useMultiStep", component: <Ex27_UseMultiStep /> },
  { label: "28 [Nested] useUndoRedo", component: <Ex28_UseUndoRedo /> },
  { label: "29 [Nested] useList (add/remove/reorder)", component: <Ex29_UseList /> },
  { label: "30 [Nested] usePagination", component: <Ex30_UsePagination /> },
  { label: "31 [Nested] useSearch", component: <Ex31_UseSearch /> },
  { label: "32 [Nested] useSort", component: <Ex32_UseSort /> },
  { label: "33 [Nested] useFilter", component: <Ex33_UseFilter /> },
  { label: "34 [Nested] useSelect (multi-select)", component: <Ex34_UseSelect /> },
  { label: "35 [Nested] useCheckboxGroup", component: <Ex35_UseCheckboxGroup /> },
  { label: "36 [Nested] useForm (multi-field + confirm password)", component: <Ex36_UseFormMultiField /> },
  { label: "37 [Nested] Composed hooks (search + paginate + debounce)", component: <Ex37_ComposedHooks /> },
  { label: "38 [Advanced] useAsync", component: <Ex38_UseAsync /> },
  { label: "39 [Advanced] useEventSource (SSE simulation)", component: <Ex39_UseEventSource /> },
  { label: "40 [Advanced] useIntersectionObserver", component: <Ex40_UseIntersectionObserver /> },
  { label: "41 [Advanced] useResizeObserver", component: <Ex41_UseResizeObserver /> },
  { label: "42 [Advanced] useGeolocation", component: <Ex42_UseGeolocation /> },
  { label: "43 [Advanced] useBattery", component: <Ex43_UseBattery /> },
  { label: "44 [Advanced] useClipboard", component: <Ex44_UseClipboard /> },
  { label: "45 [Advanced] useCountdown", component: <Ex45_UseCountdown /> },
  { label: "46 [Advanced] useLatestCallback", component: <Ex46_UseLatestCallback /> },
  { label: "47 [Advanced] useStableCallback", component: <Ex47_UseStableCallback /> },
  { label: "48 [Advanced] useEventCallback", component: <Ex48_UseEventCallback /> },
  { label: "49 [Advanced] useIsFirstRender", component: <Ex49_UseIsFirstRender /> },
  { label: "50 [Advanced] useUpdateEffect", component: <Ex50_UseUpdateEffect /> },
];

export default function CustomHooksExamples() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: 24 }}>
      <h1>50 Custom Hook Examples — Basic · Intermediate · Nested · Advanced</h1>
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
