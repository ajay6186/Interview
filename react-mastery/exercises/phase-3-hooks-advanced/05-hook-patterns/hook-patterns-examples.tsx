import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useReducer,
  useTransition,
  useDeferredValue,
  useId,
  useSyncExternalStore,
  memo,
  createContext,
  useContext,
  forwardRef,
  useImperativeHandle,
  ReactNode,
} from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// BASIC (1–12)
// ═══════════════════════════════════════════════════════════════════════════════

function Ex01_UseTransitionBasic() {
  const [isPending, startTransition] = useTransition();
  const [list, setList] = useState<string[]>([]);
  const generate = () => {
    startTransition(() => {
      setList(Array.from({ length: 5000 }, (_, i) => `Item ${i + 1}`));
    });
  };
  return (
    <div>
      <button onClick={generate} disabled={isPending}>
        {isPending ? "Generating…" : "Generate 5000 items"}
      </button>
      <p style={{ fontSize: 12, color: "#888" }}>UI stays responsive (isPending: {String(isPending)})</p>
      <div style={{ height: 80, overflow: "auto", border: "1px solid #eee", padding: 4 }}>
        {list.slice(0, 20).map((i) => <div key={i} style={{ fontSize: 12 }}>{i}</div>)}
        {list.length > 20 && <div style={{ fontSize: 12, color: "#888" }}>…and {list.length - 20} more</div>}
      </div>
    </div>
  );
}

function Ex02_UseDeferredValueBasic() {
  const [input, setInput] = useState("");
  const deferred = useDeferredValue(input);
  const items = useMemo(
    () => Array.from({ length: 2000 }, (_, i) => `Result ${i + 1} for "${deferred}"`).filter((s) => s.includes(deferred) || !deferred),
    [deferred]
  );
  return (
    <div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type to search (deferred rendering)"
        style={{ width: "100%" }}
      />
      <p style={{ fontSize: 12, color: "#888" }}>
        Input: "{input}" | Deferred: "{deferred}" | {items.length} results
      </p>
      <div style={{ height: 80, overflow: "auto" }}>
        {items.slice(0, 10).map((i) => <div key={i} style={{ fontSize: 12, padding: "2px 0" }}>{i}</div>)}
      </div>
    </div>
  );
}

function Ex03_UseIdBasic() {
  const id = useId();
  const checkId = useId();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div>
        <label htmlFor={id}>Email address:</label>
        <input id={id} type="email" placeholder="you@example.com" style={{ marginLeft: 8 }} />
      </div>
      <div>
        <label htmlFor={checkId} style={{ cursor: "pointer" }}>
          <input id={checkId} type="checkbox" style={{ marginRight: 6 }} />
          I agree to the terms
        </label>
      </div>
      <p style={{ fontSize: 12, color: "#888" }}>Generated IDs: {id}, {checkId}</p>
    </div>
  );
}

// Minimal external store
function createStore<T>(initial: T) {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set: (next: T) => { state = next; listeners.forEach((l) => l()); },
    subscribe: (l: () => void) => { listeners.add(l); return () => listeners.delete(l); },
  };
}
const themeStore = createStore<"light" | "dark">("light");

function Ex04_UseSyncExternalStoreBasic() {
  const theme = useSyncExternalStore(themeStore.subscribe, themeStore.get);
  return (
    <div style={{ padding: 12, background: theme === "dark" ? "#333" : "#f8f8f8", color: theme === "dark" ? "#eee" : "#111", borderRadius: 6, transition: "all 0.2s" }}>
      <p>Theme: <strong>{theme}</strong></p>
      <button onClick={() => themeStore.set(theme === "dark" ? "light" : "dark")}>Toggle theme</button>
      <p style={{ fontSize: 12, color: "#888" }}>Synced via useSyncExternalStore — no tearing</p>
    </div>
  );
}

function useSimpleCompound() {
  const [count, setCount] = useState(0);
  const [label, setLabel] = useState("counter");
  const inc = useCallback(() => setCount((c) => c + 1), []);
  const dec = useCallback(() => setCount((c) => c - 1), []);
  const reset = useCallback(() => setCount(0), []);
  return { count, label, setLabel, inc, dec, reset };
}
function Ex05_SimpleCompoundHook() {
  const { count, label, setLabel, inc, dec, reset } = useSimpleCompound();
  return (
    <div>
      <input value={label} onChange={(e) => setLabel(e.target.value)} style={{ marginBottom: 8 }} />
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={dec}>−</button>
        <strong>{label}: {count}</strong>
        <button onClick={inc}>+</button>
        <button onClick={reset}>Reset</button>
      </div>
    </div>
  );
}

function hookFactory<T>(initial: T, label: string) {
  return function useFactoryHook() {
    const [value, setValue] = useState<T>(initial);
    const reset = useCallback(() => setValue(initial), []);
    return { value, setValue, reset, label };
  };
}
const useTemperature = hookFactory(20, "Temperature (°C)");
const useHumidity = hookFactory(50, "Humidity (%)");
function Ex06_HookFactory() {
  const temp = useTemperature();
  const humidity = useHumidity();
  return (
    <div style={{ display: "flex", gap: 24 }}>
      {[temp, humidity].map(({ value, setValue, reset, label }) => (
        <div key={label}>
          <label>{label}</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
            <input type="number" value={value as number} onChange={(e) => setValue(Number(e.target.value) as unknown as T)} style={{ width: 70 }} />
            <button onClick={reset}>Reset</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function useWithCleanup(id: string) {
  const [active, setActive] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  useEffect(() => {
    if (!active) return;
    setLog((l) => [...l, `[${id}] Effect started`]);
    const iv = setInterval(() => setLog((l) => [...l.slice(-4), `[${id}] tick ${Date.now() % 10000}`]), 800);
    return () => {
      clearInterval(iv);
      setLog((l) => [...l, `[${id}] Cleaned up`]);
    };
  }, [active, id]);
  return { active, setActive, log };
}
function Ex07_HookWithCleanup() {
  const { active, setActive, log } = useWithCleanup("hook-7");
  return (
    <div>
      <button onClick={() => setActive((a) => !a)}>{active ? "Stop" : "Start"}</button>
      <ul style={{ margin: "4px 0", paddingLeft: 20, fontSize: 12 }}>
        {log.map((l, i) => <li key={i}>{l}</li>)}
      </ul>
    </div>
  );
}

function Ex08_UseIdForms() {
  const nameId = useId();
  const emailId = useId();
  const passId = useId();
  const descId = useId();
  return (
    <form onSubmit={(e) => e.preventDefault()} style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 280 }}>
      {[
        { id: nameId, label: "Name", type: "text" },
        { id: emailId, label: "Email", type: "email" },
        { id: passId, label: "Password", type: "password" },
      ].map(({ id, label, type }) => (
        <div key={id} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <label htmlFor={id} style={{ fontSize: 13 }}>{label}</label>
          <input id={id} type={type} aria-describedby={descId} />
        </div>
      ))}
      <p id={descId} style={{ fontSize: 11, color: "#888", margin: 0 }}>
        All field IDs are unique even in SSR ({nameId})
      </p>
      <button type="submit">Submit</button>
    </form>
  );
}

function Ex09_ExternalStoreCounter() {
  const counterStore = useMemo(() => createStore(0), []);
  const count = useSyncExternalStore(counterStore.subscribe, counterStore.get);
  return (
    <div>
      <p>External store count: {count}</p>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => counterStore.set(count - 1)}>−</button>
        <button onClick={() => counterStore.set(count + 1)}>+</button>
        <button onClick={() => counterStore.set(0)}>Reset</button>
      </div>
    </div>
  );
}

function useToggleGroup(items: string[]) {
  const [active, setActive] = useState<Set<string>>(new Set());
  const toggle = useCallback((item: string) => {
    setActive((prev) => { const next = new Set(prev); next.has(item) ? next.delete(item) : next.add(item); return next; });
  }, []);
  const isActive = useCallback((item: string) => active.has(item), [active]);
  const reset = useCallback(() => setActive(new Set()), []);
  return { active: [...active], isActive, toggle, reset };
}
function Ex10_CompoundToggleGroup() {
  const options = ["Bold", "Italic", "Underline", "Strike"];
  const { isActive, toggle, reset, active } = useToggleGroup(options);
  return (
    <div>
      <div style={{ display: "flex", gap: 6 }}>
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            style={{ padding: "4px 10px", background: isActive(opt) ? "#4a90d9" : "#eee", color: isActive(opt) ? "#fff" : "#333", borderRadius: 4, border: "none", cursor: "pointer" }}
          >
            {opt}
          </button>
        ))}
        <button onClick={reset} style={{ marginLeft: 8 }}>Clear</button>
      </div>
      <p style={{ fontSize: 12 }}>Active: {active.join(", ") || "none"}</p>
    </div>
  );
}

function useDeferredSearch(items: string[]) {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const results = useMemo(
    () => items.filter((i) => i.toLowerCase().includes(deferred.toLowerCase())),
    [items, deferred]
  );
  const isStale = query !== deferred;
  return { query, setQuery, results, isStale };
}
function Ex11_DeferredSearchHook() {
  const items = useMemo(() => Array.from({ length: 500 }, (_, i) => `Product #${i + 1} — ${["Alpha", "Beta", "Gamma"][i % 3]}`), []);
  const { query, setQuery, results, isStale } = useDeferredSearch(items);
  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search 500 products…" style={{ opacity: isStale ? 0.6 : 1 }} />
      <p style={{ fontSize: 12, color: isStale ? "orange" : "#888" }}>
        {isStale ? "Updating…" : `${results.length} results`}
      </p>
      <div style={{ height: 80, overflow: "auto" }}>
        {results.slice(0, 10).map((r) => <div key={r} style={{ fontSize: 12, padding: "2px 0" }}>{r}</div>)}
      </div>
    </div>
  );
}

function useTransitionList() {
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState<string[]>([]);
  const [filter, setFilter] = useState("");
  const all = useMemo(() => Array.from({ length: 10000 }, (_, i) => `Entry ${i + 1}`), []);
  const handleFilter = useCallback(
    (q: string) => {
      setFilter(q);
      startTransition(() => {
        setItems(all.filter((e) => e.includes(q)));
      });
    },
    [all, startTransition]
  );
  return { items, filter, handleFilter, isPending };
}
function Ex12_UseTransitionList() {
  const { items, filter, handleFilter, isPending } = useTransitionList();
  return (
    <div>
      <input value={filter} onChange={(e) => handleFilter(e.target.value)} placeholder="Filter 10k items (non-blocking)…" />
      <p style={{ fontSize: 12 }}>
        {isPending ? <span style={{ color: "orange" }}>Pending…</span> : `${items.length} matches`}
      </p>
      <div style={{ height: 80, overflow: "auto" }}>
        {items.slice(0, 15).map((i) => <div key={i} style={{ fontSize: 12, padding: "1px 0" }}>{i}</div>)}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERMEDIATE (13–25)
// ═══════════════════════════════════════════════════════════════════════════════

const HeavyList = memo(function HeavyList({ query }: { query: string }) {
  const items = useMemo(
    () => Array.from({ length: 4000 }, (_, i) => `Result ${i + 1} for "${query}"`),
    [query]
  );
  return (
    <div style={{ height: 80, overflow: "auto" }}>
      {items.slice(0, 20).map((i) => <div key={i} style={{ fontSize: 12, padding: "1px 0" }}>{i}</div>)}
    </div>
  );
});
function Ex13_UseTransitionWithList() {
  const [query, setQuery] = useState("");
  const [deferredQuery, setDeferredQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  return (
    <div>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          startTransition(() => setDeferredQuery(e.target.value));
        }}
        placeholder="Search (transition)…"
      />
      <p style={{ fontSize: 12, color: isPending ? "orange" : "#888" }}>
        {isPending ? "Transitioning…" : "Ready"}
      </p>
      <HeavyList query={deferredQuery} />
    </div>
  );
}

function Ex14_UseDeferredSearch() {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const isStale = query !== deferred;
  const results = useMemo(
    () =>
      Array.from({ length: 3000 }, (_, i) => `Item ${i + 1}`).filter((i) =>
        i.toLowerCase().includes(deferred.toLowerCase())
      ),
    [deferred]
  );
  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type to filter (deferred)…" />
      <p style={{ fontSize: 12, opacity: isStale ? 0.5 : 1 }}>
        {results.length} results {isStale && <span style={{ color: "orange" }}>(stale)</span>}
      </p>
      <div style={{ height: 80, overflow: "auto" }}>
        {results.slice(0, 15).map((r) => (
          <div key={r} style={{ fontSize: 12, opacity: isStale ? 0.5 : 1 }}>{r}</div>
        ))}
      </div>
    </div>
  );
}

function Ex15_UseIdForms2() {
  const fields = [
    { name: "firstName", label: "First name", type: "text" },
    { name: "lastName", label: "Last name", type: "text" },
    { name: "dob", label: "Date of birth", type: "date" },
  ] as const;
  const baseId = useId();
  return (
    <form onSubmit={(e) => e.preventDefault()} style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 280 }}>
      {fields.map((f) => (
        <div key={f.name}>
          <label htmlFor={`${baseId}-${f.name}`} style={{ fontSize: 13, display: "block" }}>{f.label}</label>
          <input id={`${baseId}-${f.name}`} type={f.type} style={{ width: "100%" }} />
        </div>
      ))}
      <p style={{ fontSize: 11, color: "#888" }}>Base ID: {baseId}</p>
    </form>
  );
}

type CountAction = { type: "inc" | "dec" | "reset" };
type CountState = { count: number; history: number[] };
const CountCtx = createContext<{ state: CountState; dispatch: React.Dispatch<CountAction> }>({
  state: { count: 0, history: [] },
  dispatch: () => {},
});
function countReducer(state: CountState, action: CountAction): CountState {
  switch (action.type) {
    case "inc": return { count: state.count + 1, history: [...state.history.slice(-4), state.count + 1] };
    case "dec": return { count: state.count - 1, history: [...state.history.slice(-4), state.count - 1] };
    case "reset": return { count: 0, history: [] };
  }
}
function CounterConsumer() {
  const { state, dispatch } = useContext(CountCtx);
  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => dispatch({ type: "dec" })}>−</button>
        <strong>{state.count}</strong>
        <button onClick={() => dispatch({ type: "inc" })}>+</button>
        <button onClick={() => dispatch({ type: "reset" })}>Reset</button>
      </div>
      <p style={{ fontSize: 12 }}>History: {state.history.join(", ")}</p>
    </div>
  );
}
function Ex16_ReducerContextPattern() {
  const [state, dispatch] = useReducer(countReducer, { count: 0, history: [] });
  const ctx = useMemo(() => ({ state, dispatch }), [state]);
  return (
    <CountCtx.Provider value={ctx}>
      <CounterConsumer />
    </CountCtx.Provider>
  );
}

type FSMState = "idle" | "loading" | "success" | "error";
type FSMEvent = "FETCH" | "RESOLVE" | "REJECT" | "RESET";
const transitions: Record<FSMState, Partial<Record<FSMEvent, FSMState>>> = {
  idle: { FETCH: "loading" },
  loading: { RESOLVE: "success", REJECT: "error" },
  success: { FETCH: "loading", RESET: "idle" },
  error: { FETCH: "loading", RESET: "idle" },
};
function useStateMachine(initial: FSMState) {
  const [state, setState] = useState<FSMState>(initial);
  const send = useCallback((event: FSMEvent) => {
    setState((s) => transitions[s][event] ?? s);
  }, []);
  return { state, send };
}
function Ex17_StateMachineHook() {
  const { state, send } = useStateMachine("idle");
  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        {(["FETCH", "RESOLVE", "REJECT", "RESET"] as FSMEvent[]).map((ev) => {
          const possible = Object.keys(transitions[state]);
          return (
            <button key={ev} onClick={() => send(ev)} disabled={!possible.includes(ev)} style={{ opacity: possible.includes(ev) ? 1 : 0.3 }}>
              {ev}
            </button>
          );
        })}
      </div>
      <p>State: <strong style={{ color: { idle: "#888", loading: "orange", success: "green", error: "red" }[state] }}>{state}</strong></p>
    </div>
  );
}

type Observer<T> = (value: T) => void;
function createObservable<T>(initial: T) {
  let value = initial;
  const observers = new Set<Observer<T>>();
  return {
    get: () => value,
    set: (v: T) => { value = v; observers.forEach((o) => o(v)); },
    subscribe: (o: Observer<T>) => { observers.add(o); return () => observers.delete(o); },
  };
}
function useObservable<T>(observable: ReturnType<typeof createObservable<T>>): T {
  const [value, setValue] = useState<T>(() => observable.get());
  useEffect(() => observable.subscribe(setValue), [observable]);
  return value;
}
const colorObs = createObservable("#4a90d9");
function Ex18_ObserverHook() {
  const color = useObservable(colorObs);
  return (
    <div>
      <label>
        Pick color:{" "}
        <input type="color" value={color} onChange={(e) => colorObs.set(e.target.value)} />
      </label>
      <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
        {[1, 2, 3].map((i) => (
          <Observer18 key={i} id={i} />
        ))}
      </div>
    </div>
  );
}
function Observer18({ id }: { id: number }) {
  const color = useObservable(colorObs);
  return (
    <div style={{ width: 60, height: 60, background: color, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12 }}>
      #{id}
    </div>
  );
}

type EventMap = { [key: string]: unknown };
function createEventEmitter<T extends EventMap>() {
  const listeners = new Map<keyof T, Set<(payload: unknown) => void>>();
  return {
    on<K extends keyof T>(event: K, fn: (payload: T[K]) => void) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(fn as (p: unknown) => void);
      return () => listeners.get(event)?.delete(fn as (p: unknown) => void);
    },
    emit<K extends keyof T>(event: K, payload: T[K]) {
      listeners.get(event)?.forEach((fn) => fn(payload));
    },
  };
}
type AppEvents = { message: string; count: number };
const emitter = createEventEmitter<AppEvents>();
function useEventEmitter() {
  const [messages, setMessages] = useState<string[]>([]);
  const [count, setCount] = useState(0);
  useEffect(() => {
    const off1 = emitter.on("message", (msg) => setMessages((m) => [...m.slice(-3), msg]));
    const off2 = emitter.on("count", (c) => setCount(c));
    return () => { off1(); off2(); };
  }, []);
  return { messages, count };
}
function Ex19_EventEmitterHook() {
  const { messages, count } = useEventEmitter();
  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => emitter.emit("message", `Msg at ${Date.now() % 10000}`)}>Emit message</button>
        <button onClick={() => emitter.emit("count", count + 1)}>Emit count ({count})</button>
      </div>
      <ul style={{ margin: "4px 0", paddingLeft: 20, fontSize: 12 }}>
        {messages.map((m, i) => <li key={i}>{m}</li>)}
      </ul>
    </div>
  );
}

function useSyncStore<T>(store: ReturnType<typeof createStore<T>>) {
  return useSyncExternalStore(store.subscribe, store.get);
}
const settingsStore = createStore({ darkMode: false, fontSize: 14, lang: "en" });
function Ex20_UseSyncExternalStoreSettings() {
  const settings = useSyncStore(settingsStore);
  return (
    <div style={{ padding: 12, background: settings.darkMode ? "#333" : "#f8f8f8", color: settings.darkMode ? "#eee" : "#111", borderRadius: 6 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label>
          <input type="checkbox" checked={settings.darkMode} onChange={(e) => settingsStore.set({ ...settings, darkMode: e.target.checked })} />{" "}
          Dark mode
        </label>
        <label>
          Font size:{" "}
          <input type="range" min={10} max={22} value={settings.fontSize} onChange={(e) => settingsStore.set({ ...settings, fontSize: Number(e.target.value) })} style={{ width: 100 }} />
          {settings.fontSize}px
        </label>
        <label>
          Lang:{" "}
          <select value={settings.lang} onChange={(e) => settingsStore.set({ ...settings, lang: e.target.value })}>
            <option value="en">English</option>
            <option value="es">Spanish</option>
          </select>
        </label>
      </div>
      <p style={{ fontSize: settings.fontSize, marginTop: 8 }}>Preview text at {settings.fontSize}px</p>
    </div>
  );
}

function Ex21_DeferredWithTransition() {
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [committed, setCommitted] = useState("");
  const deferred = useDeferredValue(committed);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    startTransition(() => setCommitted(e.target.value));
  };
  const results = useMemo(
    () => Array.from({ length: 2000 }, (_, i) => `Entry ${i + 1} — ${deferred}`).filter((e) => e.includes(deferred) || !deferred),
    [deferred]
  );
  return (
    <div>
      <input value={input} onChange={handleChange} placeholder="useTransition + useDeferredValue combo" style={{ width: "100%" }} />
      <p style={{ fontSize: 12, color: isPending ? "orange" : "#888" }}>
        {isPending ? "Transitioning…" : `${results.length} results for "${deferred}"`}
      </p>
      <div style={{ height: 60, overflow: "auto" }}>
        {results.slice(0, 8).map((r) => <div key={r} style={{ fontSize: 12 }}>{r}</div>)}
      </div>
    </div>
  );
}

type TabsCtx = { activeTab: string; setTab: (t: string) => void };
const TabsContext = createContext<TabsCtx>({ activeTab: "", setTab: () => {} });
function TabList({ children }: { children: ReactNode }) {
  return <div style={{ display: "flex", gap: 4, borderBottom: "2px solid #eee", marginBottom: 12 }}>{children}</div>;
}
function Tab({ value, children }: { value: string; children: ReactNode }) {
  const { activeTab, setTab } = useContext(TabsContext);
  const active = activeTab === value;
  return (
    <button
      onClick={() => setTab(value)}
      style={{ padding: "6px 14px", background: active ? "#4a90d9" : "transparent", color: active ? "#fff" : "#333", border: "none", cursor: "pointer", borderRadius: "4px 4px 0 0" }}
    >
      {children}
    </button>
  );
}
function TabPanel({ value, children }: { value: string; children: ReactNode }) {
  const { activeTab } = useContext(TabsContext);
  return activeTab === value ? <div>{children}</div> : null;
}
function Ex22_CompoundTabs() {
  const [activeTab, setActiveTab] = useState("overview");
  const ctx = useMemo(() => ({ activeTab, setTab: setActiveTab }), [activeTab]);
  return (
    <TabsContext.Provider value={ctx}>
      <TabList>
        <Tab value="overview">Overview</Tab>
        <Tab value="details">Details</Tab>
        <Tab value="settings">Settings</Tab>
      </TabList>
      <TabPanel value="overview"><p>Overview content</p></TabPanel>
      <TabPanel value="details"><p>Details content</p></TabPanel>
      <TabPanel value="settings"><p>Settings content</p></TabPanel>
    </TabsContext.Provider>
  );
}

function useFormWithTransition(fields: string[]) {
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(fields.map((f) => [f, ""])));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const handleChange = useCallback(
    (field: string, value: string) => {
      setValues((v) => ({ ...v, [field]: value }));
      startTransition(() => {
        const errs: Record<string, string> = {};
        if (value.length < 2) errs[field] = "Too short";
        setErrors((e) => ({ ...e, ...errs, ...(value.length >= 2 ? { [field]: "" } : {}) }));
      });
    },
    [startTransition]
  );
  return { values, errors, handleChange, isPending };
}
function Ex23_TransitionForm() {
  const { values, errors, handleChange, isPending } = useFormWithTransition(["username", "bio"]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 280 }}>
      {["username", "bio"].map((field) => (
        <div key={field}>
          <input
            value={values[field]}
            onChange={(e) => handleChange(field, e.target.value)}
            placeholder={field}
          />
          {errors[field] && <span style={{ color: "red", fontSize: 12 }}>{errors[field]}</span>}
        </div>
      ))}
      {isPending && <p style={{ fontSize: 12, color: "orange" }}>Validating…</p>}
    </div>
  );
}

const AccordionCtx = createContext<{ openId: string | null; toggle: (id: string) => void }>({ openId: null, toggle: () => {} });
function AccordionItem({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  const { openId, toggle } = useContext(AccordionCtx);
  const isOpen = openId === id;
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 4, marginBottom: 4 }}>
      <button
        onClick={() => toggle(id)}
        style={{ width: "100%", padding: "8px 12px", textAlign: "left", background: isOpen ? "#4a90d9" : "#f8f8f8", color: isOpen ? "#fff" : "#333", border: "none", cursor: "pointer" }}
      >
        {isOpen ? "▼ " : "▶ "}{title}
      </button>
      {isOpen && <div style={{ padding: 12 }}>{children}</div>}
    </div>
  );
}
function Ex24_CompoundAccordion() {
  const [openId, setOpenId] = useState<string | null>("item1");
  const toggle = useCallback((id: string) => setOpenId((prev) => (prev === id ? null : id)), []);
  const ctx = useMemo(() => ({ openId, toggle }), [openId, toggle]);
  return (
    <AccordionCtx.Provider value={ctx}>
      <AccordionItem id="item1" title="Section 1">Content for section 1.</AccordionItem>
      <AccordionItem id="item2" title="Section 2">Content for section 2.</AccordionItem>
      <AccordionItem id="item3" title="Section 3">Content for section 3.</AccordionItem>
    </AccordionCtx.Provider>
  );
}

function useIdGroup(count: number) {
  const baseId = useId();
  return useMemo(() => Array.from({ length: count }, (_, i) => `${baseId}-${i}`), [baseId, count]);
}
function Ex25_UseIdGroup() {
  const ids = useIdGroup(4);
  const labels = ["Username", "Email", "Phone", "Website"];
  return (
    <form onSubmit={(e) => e.preventDefault()} style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 280 }}>
      {ids.map((id, i) => (
        <div key={id}>
          <label htmlFor={id} style={{ fontSize: 13, display: "block" }}>{labels[i]}</label>
          <input id={id} placeholder={labels[i]} style={{ width: "100%" }} />
        </div>
      ))}
      <p style={{ fontSize: 11, color: "#888" }}>IDs: {ids.join(", ")}</p>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NESTED (26–37)
// ═══════════════════════════════════════════════════════════════════════════════

function useCounter26(initial = 0) {
  const [count, setCount] = useState(initial);
  return { count, inc: () => setCount((c) => c + 1), dec: () => setCount((c) => c - 1) };
}
function useDoubled(n: number) { return useMemo(() => n * 2, [n]); }
function useSquared(n: number) { return useMemo(() => n * n, [n]); }
function Ex26_ComposedHooks() {
  const counter = useCounter26(5);
  const doubled = useDoubled(counter.count);
  const squared = useSquared(counter.count);
  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={counter.dec}>−</button>
        <strong>{counter.count}</strong>
        <button onClick={counter.inc}>+</button>
      </div>
      <p>×2 = {doubled} | ² = {squared}</p>
    </div>
  );
}

type ServiceLocator = { log: (msg: string) => void; format: (n: number) => string };
const ServiceCtx = createContext<ServiceLocator>({ log: () => {}, format: (n) => String(n) });
function useService() { return useContext(ServiceCtx); }
function ServiceConsumer27() {
  const { log, format } = useService();
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => { setCount((c) => c + 1); log(`Count: ${count + 1}`); }}>
        Increment
      </button>
      <p>Formatted: {format(count)}</p>
    </div>
  );
}
function Ex27_DependencyInjection() {
  const [log, setLog] = useState<string[]>([]);
  const services = useMemo<ServiceLocator>(
    () => ({
      log: (msg) => setLog((l) => [...l.slice(-3), msg]),
      format: (n) => `$${n.toFixed(2)}`,
    }),
    []
  );
  return (
    <ServiceCtx.Provider value={services}>
      <ServiceConsumer27 />
      <ul style={{ margin: "4px 0", paddingLeft: 20, fontSize: 12 }}>
        {log.map((l, i) => <li key={i}>{l}</li>)}
      </ul>
    </ServiceCtx.Provider>
  );
}

const ThemeCtx28 = createContext<string>("light");
const FontCtx28 = createContext<number>(14);
const LangCtx28 = createContext<string>("en");
function TripleConsumer28() {
  const theme = useContext(ThemeCtx28);
  const font = useContext(FontCtx28);
  const lang = useContext(LangCtx28);
  return (
    <div style={{ padding: 12, background: theme === "dark" ? "#333" : "#f8f8f8", color: theme === "dark" ? "#eee" : "#111", fontSize: font, borderRadius: 4 }}>
      Theme: {theme} | Font: {font}px | Lang: {lang}
    </div>
  );
}
function Ex28_MultiProvider() {
  const [theme, setTheme] = useState("light");
  const [font, setFont] = useState(14);
  const [lang, setLang] = useState("en");
  return (
    <ThemeCtx28.Provider value={theme}>
      <FontCtx28.Provider value={font}>
        <LangCtx28.Provider value={lang}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
            <button onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}>Toggle theme</button>
            <button onClick={() => setFont((f) => (f === 14 ? 18 : 14))}>Toggle font</button>
            <button onClick={() => setLang((l) => (l === "en" ? "es" : "en"))}>Toggle lang</button>
          </div>
          <TripleConsumer28 />
        </LangCtx28.Provider>
      </FontCtx28.Provider>
    </ThemeCtx28.Provider>
  );
}

function useNestedCounters(depth: number): { count: number; inc: () => void; children: ReturnType<typeof useNestedCounters> | null } {
  const [count, setCount] = useState(0);
  const inc = useCallback(() => setCount((c) => c + 1), []);
  // Can't actually call hooks conditionally; simulate with explicit nesting
  return { count, inc, children: null };
}
function NestedCounter({ depth, max }: { depth: number; max: number }) {
  const [count, setCount] = useState(0);
  return (
    <div style={{ paddingLeft: depth * 12, borderLeft: depth > 0 ? "2px solid #ddd" : "none", marginLeft: depth > 0 ? 8 : 0 }}>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#888" }}>Level {depth}:</span>
        <button onClick={() => setCount((c) => c + 1)}>+</button>
        <strong>{count}</strong>
      </div>
      {depth < max && <NestedCounter depth={depth + 1} max={max} />}
    </div>
  );
}
function Ex29_RecursiveHookUsage() {
  return (
    <div>
      <p style={{ fontSize: 12, color: "#888" }}>Each level has its own useState</p>
      <NestedCounter depth={0} max={3} />
    </div>
  );
}

function useOptimistic<T>(initial: T, reducer: (state: T, action: T) => T) {
  const [actual, setActual] = useState<T>(initial);
  const [optimistic, setOptimistic] = useState<T>(initial);
  const [pending, setPending] = useState(false);
  const apply = useCallback(
    async (action: T, asyncFn: () => Promise<T>) => {
      setOptimistic((s) => reducer(s, action));
      setPending(true);
      try {
        const result = await asyncFn();
        setActual(result);
        setOptimistic(result);
      } catch {
        setOptimistic(actual);
      } finally {
        setPending(false);
      }
    },
    [actual, reducer]
  );
  return { value: optimistic, actual, pending, apply };
}
function Ex30_OptimisticUpdate() {
  const reducer = useCallback((state: number[], action: number) => [...state, action], []);
  const { value, pending, apply } = useOptimistic<number[]>([], reducer);
  const addItem = useCallback(() => {
    const next = value.length + 1;
    apply(next, () => new Promise<number[]>((res, rej) => setTimeout(() => Math.random() > 0.2 ? res([...value, next]) : rej(), 700)));
  }, [value, apply]);
  return (
    <div>
      <button onClick={addItem} disabled={pending}>{pending ? "Saving…" : "Add item (optimistic)"}</button>
      <ul style={{ paddingLeft: 20, margin: "4px 0" }}>
        {value.map((v) => <li key={v} style={{ opacity: pending && v === value[value.length - 1] ? 0.5 : 1 }}>Item {v}</li>)}
      </ul>
    </div>
  );
}

type WizardCtx = { step: number; data: Record<string, string>; next: (d?: Record<string, string>) => void; back: () => void };
const WizardContext = createContext<WizardCtx>({ step: 0, data: {}, next: () => {}, back: () => {} });
function WizardStep({ title, fields }: { title: string; fields: string[] }) {
  const { next, back, step, data } = useContext(WizardContext);
  const [values, setValues] = useState<Record<string, string>>(data);
  const ids = fields.map(() => useId()); // eslint-disable-line react-hooks/rules-of-hooks
  return (
    <div>
      <h3 style={{ margin: "0 0 8px", fontSize: 14 }}>Step {step + 1}: {title}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {fields.map((f, i) => (
          <div key={f}>
            <label htmlFor={ids[i]} style={{ fontSize: 12 }}>{f}</label>
            <input id={ids[i]} value={values[f] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [f]: e.target.value }))} placeholder={f} style={{ display: "block", marginTop: 2 }} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={back} disabled={step === 0}>Back</button>
        <button onClick={() => next(values)}>Next</button>
      </div>
    </div>
  );
}
function Ex31_NestedWizardHook() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Record<string, string>>({});
  const next = useCallback((d?: Record<string, string>) => {
    if (d) setData((prev) => ({ ...prev, ...d }));
    setStep((s) => s + 1);
  }, []);
  const back = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);
  const ctx = useMemo(() => ({ step, data, next, back }), [step, data, next, back]);
  const steps = [
    { title: "Personal", fields: ["Name", "Email"] },
    { title: "Address", fields: ["City", "ZIP"] },
    { title: "Done", fields: [] },
  ];
  return (
    <WizardContext.Provider value={ctx}>
      {step < steps.length - 1 ? (
        <WizardStep title={steps[step].title} fields={steps[step].fields} />
      ) : (
        <div>
          <p style={{ color: "green" }}>Complete! Data:</p>
          <pre style={{ fontSize: 12 }}>{JSON.stringify(data, null, 2)}</pre>
          <button onClick={() => { setStep(0); setData({}); }}>Restart</button>
        </div>
      )}
    </WizardContext.Provider>
  );
}

function useAsync32<T>(fn: () => Promise<T>) {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string | null }>({ data: null, loading: false, error: null });
  const run = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await fn();
      setState({ data, loading: false, error: null });
    } catch (e) {
      setState({ data: null, loading: false, error: (e as Error).message });
    }
  }, [fn]);
  return { ...state, run };
}
function Ex32_NestedAsyncHooks() {
  const userFetch = useAsync32(useCallback(async () => {
    await new Promise((r) => setTimeout(r, 400));
    return { name: "Alice", id: 42 };
  }, []));
  const postFetch = useAsync32(useCallback(async () => {
    await new Promise((r) => setTimeout(r, 600));
    return [{ title: "Hello world" }, { title: "React tips" }];
  }, []));
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button onClick={userFetch.run} disabled={userFetch.loading}>Fetch user</button>
        <button onClick={postFetch.run} disabled={postFetch.loading}>Fetch posts</button>
      </div>
      {userFetch.loading && <p>User loading…</p>}
      {userFetch.data && <p>User: {userFetch.data.name} (#{userFetch.data.id})</p>}
      {postFetch.loading && <p>Posts loading…</p>}
      {postFetch.data && <ul style={{ paddingLeft: 20, margin: 0 }}>{postFetch.data.map((p) => <li key={p.title}>{p.title}</li>)}</ul>}
    </div>
  );
}

type LogLevel = "info" | "warn" | "error";
const LogCtx = createContext<(level: LogLevel, msg: string) => void>(() => {});
function useLog() { return useContext(LogCtx); }
function LoggingChild() {
  const log = useLog();
  const [count, setCount] = useState(0);
  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => { setCount((c) => c + 1); log("info", `Click #${count + 1}`); }}>Info log</button>
        <button onClick={() => log("warn", "Warning!")}>Warn log</button>
        <button onClick={() => log("error", "Error!")}>Error log</button>
      </div>
    </div>
  );
}
function Ex33_HookWithLogContext() {
  const [entries, setEntries] = useState<{ level: LogLevel; msg: string }[]>([]);
  const log = useCallback((level: LogLevel, msg: string) => {
    setEntries((e) => [...e.slice(-4), { level, msg }]);
  }, []);
  const colors: Record<LogLevel, string> = { info: "#4a90d9", warn: "orange", error: "red" };
  return (
    <LogCtx.Provider value={log}>
      <LoggingChild />
      <ul style={{ margin: "8px 0 0", paddingLeft: 20, fontSize: 12 }}>
        {entries.map((e, i) => <li key={i} style={{ color: colors[e.level] }}>[{e.level}] {e.msg}</li>)}
      </ul>
    </LogCtx.Provider>
  );
}

function Ex34_NestedStores() {
  const userStore = useMemo(() => createStore({ name: "Alice" }), []);
  const cartStore = useMemo(() => createStore<string[]>([]), []);
  const user = useSyncExternalStore(userStore.subscribe, userStore.get);
  const cart = useSyncExternalStore(cartStore.subscribe, cartStore.get);
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input value={user.name} onChange={(e) => userStore.set({ name: e.target.value })} placeholder="User name" style={{ width: 140 }} />
        <button onClick={() => cartStore.set([...cart, `Item ${cart.length + 1}`])}>Add to cart</button>
        <button onClick={() => cartStore.set(cart.slice(0, -1))}>Remove last</button>
      </div>
      <p>User: {user.name} | Cart: {cart.length} items</p>
      <ul style={{ paddingLeft: 20, margin: 0, fontSize: 12 }}>
        {cart.map((i) => <li key={i}>{i}</li>)}
      </ul>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADVANCED (38–50)
// ═══════════════════════════════════════════════════════════════════════════════

interface DialogHandle { open: () => void; close: () => void; isOpen: boolean }
const Dialog = forwardRef<DialogHandle, { title: string; children: ReactNode }>(function Dialog({ title, children }, ref) {
  const [open, setOpen] = useState(false);
  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
    close: () => setOpen(false),
    get isOpen() { return open; },
  }), [open]);
  return (
    <>
      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ background: "#fff", padding: 24, borderRadius: 8, minWidth: 220 }}>
            <h3 style={{ margin: "0 0 12px" }}>{title}</h3>
            {children}
            <button onClick={() => setOpen(false)} style={{ marginTop: 12 }}>Close</button>
          </div>
        </div>
      )}
    </>
  );
});
function Ex38_UseImperativeHandle() {
  const dialogRef = useRef<DialogHandle>(null);
  return (
    <div>
      <button onClick={() => dialogRef.current?.open()}>Open dialog (imperative)</button>
      <Dialog ref={dialogRef} title="Imperative Dialog">
        <p>Controlled via ref.open() / ref.close()</p>
      </Dialog>
    </div>
  );
}

interface VideoPlayerHandle { play: () => void; pause: () => void; seek: (time: number) => void; currentTime: number }
const VideoPlayer = forwardRef<VideoPlayerHandle, Record<string, never>>(function VideoPlayer(_, ref) {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const ivRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useImperativeHandle(ref, () => ({
    play: () => { setPlaying(true); ivRef.current = setInterval(() => setTime((t) => Math.min(t + 1, 60)), 1000); },
    pause: () => { setPlaying(false); if (ivRef.current) clearInterval(ivRef.current); },
    seek: (t) => setTime(Math.max(0, Math.min(t, 60))),
    get currentTime() { return time; },
  }), [time]);
  return (
    <div style={{ padding: 12, background: "#111", color: "#eee", borderRadius: 6 }}>
      <div style={{ height: 6, background: "#333", borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
        <div style={{ height: "100%", width: `${(time / 60) * 100}%`, background: "#4a90d9" }} />
      </div>
      <p style={{ margin: 0, fontSize: 12 }}>{playing ? "▶ Playing" : "⏸ Paused"} — {time}s / 60s</p>
    </div>
  );
});
function Ex39_ImperativeVideoPlayer() {
  const playerRef = useRef<VideoPlayerHandle>(null);
  return (
    <div>
      <VideoPlayer ref={playerRef} />
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={() => playerRef.current?.play()}>Play</button>
        <button onClick={() => playerRef.current?.pause()}>Pause</button>
        <button onClick={() => playerRef.current?.seek(0)}>Reset</button>
        <button onClick={() => playerRef.current?.seek(30)}>→ 30s</button>
      </div>
    </div>
  );
}

type MachineState = "idle" | "running" | "paused" | "completed" | "error";
type MachineEvent = "START" | "PAUSE" | "RESUME" | "COMPLETE" | "FAIL" | "RESET";
const machineTrans: Record<MachineState, Partial<Record<MachineEvent, MachineState>>> = {
  idle: { START: "running" },
  running: { PAUSE: "paused", COMPLETE: "completed", FAIL: "error" },
  paused: { RESUME: "running", RESET: "idle" },
  completed: { RESET: "idle" },
  error: { RESET: "idle" },
};
function useComplexStateMachine() {
  const [state, setState] = useState<MachineState>("idle");
  const [history, setHistory] = useState<MachineState[]>(["idle"]);
  const send = useCallback((event: MachineEvent) => {
    setState((s) => {
      const next = machineTrans[s][event] ?? s;
      if (next !== s) setHistory((h) => [...h, next]);
      return next;
    });
  }, []);
  const canSend = useCallback((event: MachineEvent) => Boolean(machineTrans[state][event]), [state]);
  return { state, history, send, canSend };
}
function Ex40_ComplexStateMachine() {
  const { state, history, send, canSend } = useComplexStateMachine();
  const events: MachineEvent[] = ["START", "PAUSE", "RESUME", "COMPLETE", "FAIL", "RESET"];
  const stateColors: Record<MachineState, string> = { idle: "#888", running: "green", paused: "orange", completed: "#4a90d9", error: "red" };
  return (
    <div>
      <p>State: <strong style={{ color: stateColors[state] }}>{state}</strong></p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {events.map((ev) => (
          <button key={ev} onClick={() => send(ev)} disabled={!canSend(ev)} style={{ opacity: canSend(ev) ? 1 : 0.3 }}>
            {ev}
          </button>
        ))}
      </div>
      <p style={{ fontSize: 12, marginTop: 8 }}>History: {history.join(" → ")}</p>
    </div>
  );
}

type ESEvent = { type: string; payload: unknown; timestamp: number };
function useEventSourcing<S>(initial: S, reducer: (state: S, event: ESEvent) => S) {
  const [events, setEvents] = useState<ESEvent[]>([]);
  const state = useMemo(() => events.reduce(reducer, initial), [events, reducer, initial]);
  const dispatch = useCallback((type: string, payload: unknown) => {
    setEvents((prev) => [...prev, { type, payload, timestamp: Date.now() }]);
  }, []);
  const replay = useCallback((upTo: number) => events.slice(0, upTo).reduce(reducer, initial), [events, reducer, initial]);
  return { state, events, dispatch, replay };
}
function Ex41_EventSourcingHook() {
  const initial = { count: 0, total: 0 };
  const reducer = useCallback((state: typeof initial, event: ESEvent) => {
    switch (event.type) {
      case "INC": return { ...state, count: state.count + 1, total: state.total + 1 };
      case "DEC": return { ...state, count: state.count - 1, total: state.total + 1 };
      case "RESET": return { count: 0, total: state.total + 1 };
      default: return state;
    }
  }, []);
  const { state, events, dispatch } = useEventSourcing(initial, reducer);
  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => dispatch("DEC", null)}>−</button>
        <strong>{state.count}</strong>
        <button onClick={() => dispatch("INC", null)}>+</button>
        <button onClick={() => dispatch("RESET", null)}>Reset</button>
      </div>
      <p>Total events: {events.length} | Total ops: {state.total}</p>
      <div style={{ height: 60, overflow: "auto", fontSize: 11, background: "#f5f5f5", padding: 4, borderRadius: 4 }}>
        {events.map((e, i) => <div key={i}>[{i + 1}] {e.type} at {new Date(e.timestamp).toLocaleTimeString()}</div>)}
      </div>
    </div>
  );
}

function useOptimisticList<T extends { id: number }>(initial: T[]) {
  const [items, setItems] = useState(initial);
  const [pending, setPending] = useState<Set<number>>(new Set());
  const addOptimistic = useCallback(async (item: T, saveFn: () => Promise<T>) => {
    setItems((prev) => [...prev, item]);
    setPending((p) => new Set([...p, item.id]));
    try {
      const saved = await saveFn();
      setItems((prev) => prev.map((i) => i.id === item.id ? saved : i));
    } catch {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } finally {
      setPending((p) => { const next = new Set(p); next.delete(item.id); return next; });
    }
  }, []);
  const isPending = useCallback((id: number) => pending.has(id), [pending]);
  return { items, addOptimistic, isPending };
}
function Ex42_OptimisticListHook() {
  const { items, addOptimistic, isPending } = useOptimisticList<{ id: number; text: string }>([]);
  const idRef = useRef(0);
  const add = useCallback(() => {
    idRef.current++;
    const item = { id: idRef.current, text: `Task ${idRef.current}` };
    addOptimistic(item, () => new Promise((res, rej) => setTimeout(() => Math.random() > 0.2 ? res(item) : rej(), 800)));
  }, [addOptimistic]);
  return (
    <div>
      <button onClick={add}>Add task (optimistic, 20% fail)</button>
      <ul style={{ paddingLeft: 20, margin: "4px 0" }}>
        {items.map((item) => (
          <li key={item.id} style={{ opacity: isPending(item.id) ? 0.5 : 1, fontStyle: isPending(item.id) ? "italic" : "normal" }}>
            {item.text} {isPending(item.id) && <span style={{ fontSize: 11, color: "orange" }}>(saving…)</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface InputHandle { focus: () => void; clear: () => void; value: string }
const SmartInput = forwardRef<InputHandle, { placeholder?: string }>(function SmartInput({ placeholder }, ref) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    clear: () => setValue(""),
    get value() { return value; },
  }), [value]);
  return <input ref={inputRef} value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} style={{ width: 180 }} />;
});
function Ex43_ImperativeInput() {
  const inputRef = useRef<InputHandle>(null);
  const [log, setLog] = useState<string[]>([]);
  return (
    <div>
      <SmartInput ref={inputRef} placeholder="Controlled via ref" />
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={() => inputRef.current?.focus()}>Focus</button>
        <button onClick={() => { setLog((l) => [...l, inputRef.current?.value ?? ""]); inputRef.current?.clear(); }}>
          Capture & Clear
        </button>
      </div>
      <ul style={{ paddingLeft: 20, margin: "4px 0", fontSize: 12 }}>
        {log.map((l, i) => <li key={i}>Captured: "{l}"</li>)}
      </ul>
    </div>
  );
}

function usePerfMonitor(label: string) {
  const renderCount = useRef(0);
  const renderTimes = useRef<number[]>([]);
  renderCount.current++;
  const now = performance.now();
  renderTimes.current.push(now);
  if (renderTimes.current.length > 10) renderTimes.current.shift();
  const avgInterval = renderTimes.current.length > 1
    ? ((renderTimes.current[renderTimes.current.length - 1] - renderTimes.current[0]) / (renderTimes.current.length - 1)).toFixed(1)
    : "N/A";
  return { renders: renderCount.current, avgInterval, label };
}
function Ex44_HookTestingPatterns() {
  const { renders, avgInterval } = usePerfMonitor("Ex44");
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>Increment ({count})</button>
      <p style={{ fontSize: 12 }}>Renders: {renders} | Avg interval: {avgInterval}ms</p>
    </div>
  );
}

function useMemoBenchmark<T>(compute: () => T, deps: React.DependencyList, label: string) {
  const callsRef = useRef(0);
  const totalTimeRef = useRef(0);
  const value = useMemo(() => {
    const start = performance.now();
    const result = compute();
    const elapsed = performance.now() - start;
    callsRef.current++;
    totalTimeRef.current += elapsed;
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { value, calls: callsRef.current, avgTime: callsRef.current > 0 ? (totalTimeRef.current / callsRef.current).toFixed(4) : "0", label };
}
function Ex45_PerformanceComparisonHooks() {
  const [n, setN] = useState(20);
  const [tick, setTick] = useState(0);
  function fibSlow(n: number): number { if (n <= 1) return n; return fibSlow(n - 1) + fibSlow(n - 2); }
  const memo1 = useMemoBenchmark(() => fibSlow(n), [n], "fib(n)");
  const memo2 = useMemoBenchmark(() => n * n, [n], "n²");
  return (
    <div>
      <label>
        n:{" "}
        <input type="number" value={n} min={0} max={30} onChange={(e) => setN(Number(e.target.value))} style={{ width: 60 }} />
      </label>{" "}
      <button onClick={() => setTick((t) => t + 1)}>Re-render (tick: {tick})</button>
      <ul style={{ paddingLeft: 20, margin: "8px 0", fontSize: 12 }}>
        {[memo1, memo2].map((m) => (
          <li key={m.label}>{m.label}: {m.value} (calls: {m.calls}, avg: {m.avgTime}ms)</li>
        ))}
      </ul>
    </div>
  );
}

function useResettableState<T>(initial: T): [T, React.Dispatch<React.SetStateAction<T>>, () => void] {
  const [value, setValue] = useState(initial);
  const reset = useCallback(() => setValue(initial), [initial]);
  return [value, setValue, reset];
}
function Ex46_ResettableState() {
  const [name, setName, resetName] = useResettableState("Alice");
  const [score, setScore, resetScore] = useResettableState(0);
  const resetAll = useCallback(() => { resetName(); resetScore(); }, [resetName, resetScore]);
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} />
        <button onClick={resetName}>Reset name</button>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button onClick={() => setScore((s) => s + 10)}>+10</button>
        <strong>{score}</strong>
        <button onClick={resetScore}>Reset score</button>
      </div>
      <button onClick={resetAll}>Reset all</button>
    </div>
  );
}

type PluginFn<T> = (value: T) => T;
function usePluginPipeline<T>(initial: T) {
  const [value, setValue] = useState(initial);
  const plugins = useRef<PluginFn<T>[]>([]);
  const register = useCallback((fn: PluginFn<T>) => {
    plugins.current = [...plugins.current, fn];
    return () => { plugins.current = plugins.current.filter((p) => p !== fn); };
  }, []);
  const process = useCallback((input: T) => {
    const result = plugins.current.reduce((acc, fn) => fn(acc), input);
    setValue(result);
    return result;
  }, []);
  return { value, register, process };
}
function Ex47_PluginPatternHook() {
  const { value, register, process } = usePluginPipeline<string>("");
  const [draft, setDraft] = useState("");
  useEffect(() => {
    const un1 = register((s) => s.trim());
    const un2 = register((s) => s.toUpperCase());
    const un3 = register((s) => s.replace(/\s+/g, "_"));
    return () => { un1(); un2(); un3(); };
  }, [register]);
  return (
    <div>
      <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type here" />
      <button onClick={() => process(draft)} style={{ marginLeft: 8 }}>Process</button>
      <p>Result: <strong>{value || "—"}</strong></p>
      <p style={{ fontSize: 12, color: "#888" }}>Pipeline: trim → uppercase → spaces → underscores</p>
    </div>
  );
}

function useCommandPattern() {
  const [state, setState] = useState({ count: 0, text: "" });
  const undoStack = useRef<Array<typeof state>>([]);
  const redoStack = useRef<Array<typeof state>>([]);
  const execute = useCallback((updater: (s: typeof state) => typeof state) => {
    setState((prev) => {
      undoStack.current.push(prev);
      redoStack.current = [];
      return updater(prev);
    });
  }, []);
  const undo = useCallback(() => {
    if (!undoStack.current.length) return;
    setState((current) => {
      const prev = undoStack.current.pop()!;
      redoStack.current.push(current);
      return prev;
    });
  }, []);
  const redo = useCallback(() => {
    if (!redoStack.current.length) return;
    setState((current) => {
      const next = redoStack.current.pop()!;
      undoStack.current.push(current);
      return next;
    });
  }, []);
  return { state, execute, undo, redo, canUndo: undoStack.current.length > 0, canRedo: redoStack.current.length > 0 };
}
function Ex48_CommandPattern() {
  const { state, execute, undo, redo } = useCommandPattern();
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button onClick={() => execute((s) => ({ ...s, count: s.count + 1 }))}>+1</button>
        <strong>{state.count}</strong>
        <button onClick={() => execute((s) => ({ ...s, count: s.count - 1 }))}>−1</button>
      </div>
      <input value={state.text} onChange={(e) => execute((s) => ({ ...s, text: e.target.value }))} placeholder="Type with undo…" />
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={undo}>Undo</button>
        <button onClick={redo}>Redo</button>
      </div>
    </div>
  );
}

function useSelectorStore<S, T>(store: ReturnType<typeof createStore<S>>, selector: (state: S) => T): T {
  const getSnapshot = useCallback(() => selector(store.get()), [store, selector]);
  return useSyncExternalStore(store.subscribe, getSnapshot);
}
type AppState = { user: { name: string; role: string }; notifications: number };
const appStore = createStore<AppState>({ user: { name: "Alice", role: "admin" }, notifications: 3 });
function Ex49_SelectorWithSyncStore() {
  const userName = useSelectorStore(appStore, useCallback((s: AppState) => s.user.name, []));
  const notifications = useSelectorStore(appStore, useCallback((s: AppState) => s.notifications, []));
  return (
    <div>
      <p>User: {userName} | Notifications: {notifications}</p>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => appStore.set({ ...appStore.get(), user: { ...appStore.get().user, name: userName === "Alice" ? "Bob" : "Alice" } })}>
          Toggle user
        </button>
        <button onClick={() => appStore.set({ ...appStore.get(), notifications: appStore.get().notifications + 1 })}>
          +1 notification
        </button>
      </div>
    </div>
  );
}

function useLifecycle(options: { onMount?: () => void; onUpdate?: () => void; onUnmount?: () => void }) {
  const isFirst = useRef(true);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  useEffect(() => {
    optionsRef.current.onMount?.();
    return () => optionsRef.current.onUnmount?.();
  }, []);
  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    optionsRef.current.onUpdate?.();
  });
}
function Ex50_FullPatternShowcase() {
  const [log, setLog] = useState<string[]>([]);
  const addLog = useCallback((msg: string) => setLog((l) => [...l.slice(-7), `${new Date().toLocaleTimeString()}: ${msg}`]), []);
  const [count, setCount] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [list, setList] = useState<number[]>([]);
  const deferred = useDeferredValue(count);
  const id = useId();
  useLifecycle({
    onMount: () => addLog("Mounted"),
    onUpdate: () => addLog(`Updated (count=${count})`),
    onUnmount: () => addLog("Unmounted"),
  });
  const handleIncrement = () => {
    setCount((c) => c + 1);
    startTransition(() => setList(Array.from({ length: 1000 }, (_, i) => i + 1)));
  };
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button onClick={handleIncrement}>Increment (transition)</button>
        <span>Count: {count} | Deferred: {deferred} | {isPending ? "Pending…" : "Ready"}</span>
      </div>
      <label htmlFor={id} style={{ fontSize: 12 }}>Field ({id}): </label>
      <input id={id} placeholder="useId field" style={{ marginLeft: 4 }} />
      <div style={{ height: 60, overflow: "auto", border: "1px solid #eee", margin: "8px 0", padding: 4 }}>
        {list.slice(0, 20).map((n) => <span key={n} style={{ marginRight: 4, fontSize: 11 }}>{n}</span>)}
      </div>
      <ul style={{ fontSize: 11, paddingLeft: 20, margin: 0 }}>
        {log.map((l, i) => <li key={i}>{l}</li>)}
      </ul>
    </div>
  );
}

// ─── Examples registry ────────────────────────────────────────────────────────

const examples: { label: string; component: JSX.Element }[] = [
  { label: "01 [Basic] useTransition basic", component: <Ex01_UseTransitionBasic /> },
  { label: "02 [Basic] useDeferredValue basic", component: <Ex02_UseDeferredValueBasic /> },
  { label: "03 [Basic] useId basic (two fields)", component: <Ex03_UseIdBasic /> },
  { label: "04 [Basic] useSyncExternalStore basic (theme)", component: <Ex04_UseSyncExternalStoreBasic /> },
  { label: "05 [Basic] Simple compound hook", component: <Ex05_SimpleCompoundHook /> },
  { label: "06 [Basic] Hook factory pattern", component: <Ex06_HookFactory /> },
  { label: "07 [Basic] Hook with cleanup (interval)", component: <Ex07_HookWithCleanup /> },
  { label: "08 [Basic] useId for forms (aria)", component: <Ex08_UseIdForms /> },
  { label: "09 [Basic] External store counter", component: <Ex09_ExternalStoreCounter /> },
  { label: "10 [Basic] Compound toggle group", component: <Ex10_CompoundToggleGroup /> },
  { label: "11 [Basic] useDeferredValue search hook", component: <Ex11_DeferredSearchHook /> },
  { label: "12 [Basic] useTransition list filter", component: <Ex12_UseTransitionList /> },
  { label: "13 [Intermediate] useTransition with large list", component: <Ex13_UseTransitionWithList /> },
  { label: "14 [Intermediate] useDeferredValue search (stale indicator)", component: <Ex14_UseDeferredSearch /> },
  { label: "15 [Intermediate] useId for dynamic form fields", component: <Ex15_UseIdForms2 /> },
  { label: "16 [Intermediate] useReducer + Context pattern", component: <Ex16_ReducerContextPattern /> },
  { label: "17 [Intermediate] State machine hook (FSM)", component: <Ex17_StateMachineHook /> },
  { label: "18 [Intermediate] Observer pattern hook", component: <Ex18_ObserverHook /> },
  { label: "19 [Intermediate] Event emitter hook", component: <Ex19_EventEmitterHook /> },
  { label: "20 [Intermediate] useSyncExternalStore settings", component: <Ex20_UseSyncExternalStoreSettings /> },
  { label: "21 [Intermediate] useTransition + useDeferredValue combined", component: <Ex21_DeferredWithTransition /> },
  { label: "22 [Intermediate] Compound tabs (Context pattern)", component: <Ex22_CompoundTabs /> },
  { label: "23 [Intermediate] useTransition in form validation", component: <Ex23_TransitionForm /> },
  { label: "24 [Intermediate] Compound accordion", component: <Ex24_CompoundAccordion /> },
  { label: "25 [Intermediate] useId group hook", component: <Ex25_UseIdGroup /> },
  { label: "26 [Nested] Composed hooks (counter + derived)", component: <Ex26_ComposedHooks /> },
  { label: "27 [Nested] Hook dependency injection (service locator)", component: <Ex27_DependencyInjection /> },
  { label: "28 [Nested] Multi-provider pattern", component: <Ex28_MultiProvider /> },
  { label: "29 [Nested] Recursive hook usage (nested counters)", component: <Ex29_RecursiveHookUsage /> },
  { label: "30 [Nested] Optimistic updates hook", component: <Ex30_OptimisticUpdate /> },
  { label: "31 [Nested] Wizard with useId + Context", component: <Ex31_NestedWizardHook /> },
  { label: "32 [Nested] Nested async hooks (parallel fetch)", component: <Ex32_NestedAsyncHooks /> },
  { label: "33 [Nested] Hook with logging context", component: <Ex33_HookWithLogContext /> },
  { label: "34 [Nested] Nested useSyncExternalStore stores", component: <Ex34_NestedStores /> },
  { label: "38 [Advanced] useImperativeHandle — Dialog", component: <Ex38_UseImperativeHandle /> },
  { label: "39 [Advanced] useImperativeHandle — Video player", component: <Ex39_ImperativeVideoPlayer /> },
  { label: "40 [Advanced] Complex state machine hook", component: <Ex40_ComplexStateMachine /> },
  { label: "41 [Advanced] Event sourcing hook", component: <Ex41_EventSourcingHook /> },
  { label: "42 [Advanced] Optimistic list hook", component: <Ex42_OptimisticListHook /> },
  { label: "43 [Advanced] useImperativeHandle — SmartInput", component: <Ex43_ImperativeInput /> },
  { label: "44 [Advanced] Hook testing / perf monitor", component: <Ex44_HookTestingPatterns /> },
  { label: "45 [Advanced] Performance comparison hooks (useMemo benchmark)", component: <Ex45_PerformanceComparisonHooks /> },
  { label: "46 [Advanced] useResettableState", component: <Ex46_ResettableState /> },
  { label: "47 [Advanced] Plugin pipeline hook", component: <Ex47_PluginPatternHook /> },
  { label: "48 [Advanced] Command pattern (undo/redo)", component: <Ex48_CommandPattern /> },
  { label: "49 [Advanced] Selector + useSyncExternalStore", component: <Ex49_SelectorWithSyncStore /> },
  { label: "50 [Advanced] Full pattern showcase", component: <Ex50_FullPatternShowcase /> },
];

export default function HookPatternsExamples() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: 24 }}>
      <h1>50 Advanced Hook Pattern Examples — Basic · Intermediate · Nested · Advanced</h1>
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
