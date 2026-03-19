import {
  useState,
  useEffect,
  useContext,
  useReducer,
  useRef,
  createContext,
  ReactNode,
} from "react";

// ─────────────────────────────────────────
// CONTEXTS (used by useContext examples)
// ─────────────────────────────────────────

const ThemeCtx = createContext<{ theme: string; toggle: () => void }>({
  theme: "light",
  toggle: () => {},
});

const UserCtx = createContext<{ name: string }>({ name: "Guest" });

const LangCtx = createContext<{ lang: string; setLang: (l: string) => void }>({
  lang: "EN",
  setLang: () => {},
});

// ─────────────────────────────────────────
// useState  (1–15)
// ─────────────────────────────────────────

function Ex01_Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(count - 1)}>–</button>
    </div>
  );
}

function Ex02_TextInput() {
  const [text, setText] = useState("");
  return (
    <div>
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type here" />
      <p>You typed: {text}</p>
    </div>
  );
}

function Ex03_ToggleBoolean() {
  const [on, setOn] = useState(false);
  return (
    <div>
      <p>Light is: {on ? "ON" : "OFF"}</p>
      <button onClick={() => setOn(!on)}>Toggle</button>
    </div>
  );
}

function Ex04_ObjectState() {
  const [user, setUser] = useState({ name: "", age: 0 });
  return (
    <div>
      <input
        placeholder="Name"
        value={user.name}
        onChange={(e) => setUser({ ...user, name: e.target.value })}
      />
      <input
        type="number"
        placeholder="Age"
        value={user.age}
        onChange={(e) => setUser({ ...user, age: Number(e.target.value) })}
      />
      <p>{user.name}, {user.age}</p>
    </div>
  );
}

function Ex05_ArrayAddItem() {
  const [items, setItems] = useState<string[]>([]);
  const [input, setInput] = useState("");
  return (
    <div>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={() => { if (input) { setItems([...items, input]); setInput(""); } }}>Add</button>
      <ul>{items.map((item, i) => <li key={i}>{item}</li>)}</ul>
    </div>
  );
}

function Ex06_ArrayRemoveItem() {
  const [items, setItems] = useState(["Apple", "Banana", "Cherry"]);
  return (
    <ul>
      {items.map((item, i) => (
        <li key={i}>
          {item}
          <button onClick={() => setItems(items.filter((_, j) => j !== i))}>✕</button>
        </li>
      ))}
    </ul>
  );
}

function Ex07_ArrayUpdateItem() {
  const [items, setItems] = useState(["React", "Vue", "Angular"]);
  return (
    <ul>
      {items.map((item, i) => (
        <li key={i}>
          <input
            value={item}
            onChange={(e) => setItems(items.map((v, j) => (j === i ? e.target.value : v)))}
          />
        </li>
      ))}
    </ul>
  );
}

function Ex08_MultipleStates() {
  const [name, setName] = useState("");
  const [age, setAge] = useState(0);
  const [city, setCity] = useState("");
  return (
    <div>
      <input placeholder="Name" onChange={(e) => setName(e.target.value)} />
      <input type="number" placeholder="Age" onChange={(e) => setAge(+e.target.value)} />
      <input placeholder="City" onChange={(e) => setCity(e.target.value)} />
      <p>{name}, {age}, {city}</p>
    </div>
  );
}

function Ex09_LazyInitialState() {
  // Lazy init: function runs only once on mount
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem("ex09");
    return saved ?? "default";
  });
  return (
    <div>
      <input value={value} onChange={(e) => { setValue(e.target.value); localStorage.setItem("ex09", e.target.value); }} />
      <p>Saved: {value}</p>
    </div>
  );
}

function Ex10_PreviousValue() {
  const [count, setCount] = useState(0);
  // Using functional update to always have latest value
  return (
    <div>
      <p>Count: {count}</p>
      {/* Functional update — safe for batched updates */}
      <button onClick={() => setCount((prev) => prev + 1)}>+ (functional)</button>
      <button onClick={() => setCount((prev) => prev - 1)}>– (functional)</button>
    </div>
  );
}

function Ex11_ControlledCheckbox() {
  const [checked, setChecked] = useState(false);
  return (
    <label>
      <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
      {checked ? "Checked" : "Unchecked"}
    </label>
  );
}

function Ex12_RadioGroup() {
  const [selected, setSelected] = useState("A");
  return (
    <div>
      {["A", "B", "C"].map((opt) => (
        <label key={opt} style={{ marginRight: 8 }}>
          <input type="radio" value={opt} checked={selected === opt} onChange={() => setSelected(opt)} />
          {opt}
        </label>
      ))}
      <p>Selected: {selected}</p>
    </div>
  );
}

function Ex13_SelectDropdown() {
  const [val, setVal] = useState("react");
  return (
    <div>
      <select value={val} onChange={(e) => setVal(e.target.value)}>
        {["react", "vue", "angular"].map((f) => <option key={f} value={f}>{f}</option>)}
      </select>
      <p>Chosen: {val}</p>
    </div>
  );
}

function Ex14_CharacterCounter() {
  const [text, setText] = useState("");
  const max = 50;
  return (
    <div>
      <textarea
        value={text}
        maxLength={max}
        onChange={(e) => setText(e.target.value)}
        style={{ display: "block" }}
      />
      <small>{text.length}/{max}</small>
    </div>
  );
}

function Ex15_PasswordToggle() {
  const [show, setShow] = useState(false);
  const [pw, setPw] = useState("");
  return (
    <div>
      <input type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} />
      <button onClick={() => setShow(!show)}>{show ? "Hide" : "Show"}</button>
    </div>
  );
}

// ─────────────────────────────────────────
// useEffect  (16–25)
// ─────────────────────────────────────────

function Ex16_LogOnMount() {
  useEffect(() => {
    console.log("Ex16 mounted");
    return () => console.log("Ex16 unmounted");
  }, []);
  return <p>Check console — logs on mount/unmount</p>;
}

function Ex17_DocumentTitle() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    document.title = `Count: ${count}`;
  }, [count]);
  return (
    <div>
      <p>Count: {count} (check browser tab title)</p>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  );
}

function Ex18_FetchOnMount() {
  const [data, setData] = useState<{ id: number; title: string } | null>(null);
  useEffect(() => {
    fetch("https://jsonplaceholder.typicode.com/todos/1")
      .then((r) => r.json())
      .then(setData);
  }, []);
  return <p>{data ? data.title : "Loading..."}</p>;
}

function Ex19_Interval() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setCount((c) => c + 1), 1000);
    return () => clearInterval(id); // cleanup
  }, []);
  return <p>Seconds: {count}</p>;
}

function Ex20_EventListener() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);
  return <p>Mouse: {pos.x}, {pos.y}</p>;
}

function Ex21_EffectWithDep() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState("");
  useEffect(() => {
    if (!query) return;
    const t = setTimeout(() => setResult(`Result for: ${query}`), 500);
    return () => clearTimeout(t); // debounce
  }, [query]);
  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" />
      <p>{result}</p>
    </div>
  );
}

function Ex22_SkipOnFirstRender() {
  const [count, setCount] = useState(0);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    console.log("count changed to", count);
  }, [count]);
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+ (logs after first change)</button>
    </div>
  );
}

function Ex23_MultipleDeps() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  useEffect(() => {
    console.log("a or b changed:", a, b);
  }, [a, b]);
  return (
    <div>
      <button onClick={() => setA(a + 1)}>A: {a}</button>
      <button onClick={() => setB(b + 1)}>B: {b}</button>
    </div>
  );
}

function Ex24_LocalStorageSync() {
  const [name, setName] = useState(() => localStorage.getItem("ex24") ?? "");
  useEffect(() => {
    localStorage.setItem("ex24", name);
  }, [name]);
  return (
    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Saved to localStorage" />
  );
}

function Ex25_AbortFetch() {
  const [data, setData] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("https://jsonplaceholder.typicode.com/todos/2", { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => setData(d.title))
      .catch(() => {}); // ignore abort error
    return () => controller.abort(); // cancel if unmounted
  }, []);
  return <p>{data || "Fetching..."}</p>;
}

// ─────────────────────────────────────────
// useContext  (26–30)
// ─────────────────────────────────────────

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState("light");
  return (
    <ThemeCtx.Provider value={{ theme, toggle: () => setTheme((t) => (t === "light" ? "dark" : "light")) }}>
      {children}
    </ThemeCtx.Provider>
  );
}

function Ex26_ThemeContext() {
  const { theme, toggle } = useContext(ThemeCtx);
  return (
    <div style={{ background: theme === "dark" ? "#333" : "#fff", color: theme === "dark" ? "#fff" : "#000", padding: 8 }}>
      Theme: {theme}
      <button onClick={toggle} style={{ marginLeft: 8 }}>Toggle</button>
    </div>
  );
}

function Ex27_UserContext() {
  return (
    <UserCtx.Provider value={{ name: "Ajay" }}>
      <UserConsumer />
    </UserCtx.Provider>
  );
}
function UserConsumer() {
  const { name } = useContext(UserCtx);
  return <p>Logged in as: {name}</p>;
}

function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState("EN");
  return <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>;
}
function Ex28_LanguageContext() {
  return (
    <LangProvider>
      <LangSwitcher />
      <LangDisplay />
    </LangProvider>
  );
}
function LangSwitcher() {
  const { setLang } = useContext(LangCtx);
  return (
    <div>
      {["EN", "AR", "FR"].map((l) => <button key={l} onClick={() => setLang(l)}>{l}</button>)}
    </div>
  );
}
function LangDisplay() {
  const { lang } = useContext(LangCtx);
  return <p>Language: {lang}</p>;
}

function Ex29_MultipleContexts() {
  return (
    <ThemeProvider>
      <UserCtx.Provider value={{ name: "Sara" }}>
        <MultiCtxConsumer />
      </UserCtx.Provider>
    </ThemeProvider>
  );
}
function MultiCtxConsumer() {
  const { theme } = useContext(ThemeCtx);
  const { name } = useContext(UserCtx);
  return <p style={{ background: theme === "dark" ? "#333" : "#eee" }}>User: {name}, Theme: {theme}</p>;
}

function Ex30_ContextWithDefault() {
  // No provider — uses default value from createContext
  const { name } = useContext(UserCtx);
  return <p>Default user: {name}</p>;
}

// ─────────────────────────────────────────
// useReducer  (31–40)
// ─────────────────────────────────────────

function Ex31_SimpleCounter() {
  type Action = { type: "inc" } | { type: "dec" } | { type: "reset" };
  const reducer = (state: number, action: Action) => {
    if (action.type === "inc") return state + 1;
    if (action.type === "dec") return state - 1;
    return 0;
  };
  const [count, dispatch] = useReducer(reducer, 0);
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => dispatch({ type: "inc" })}>+</button>
      <button onClick={() => dispatch({ type: "dec" })}>–</button>
      <button onClick={() => dispatch({ type: "reset" })}>Reset</button>
    </div>
  );
}

function Ex32_TodoReducer() {
  type Todo = { id: number; text: string; done: boolean };
  type Action =
    | { type: "add"; text: string }
    | { type: "toggle"; id: number }
    | { type: "remove"; id: number };
  const reducer = (state: Todo[], action: Action): Todo[] => {
    if (action.type === "add") return [...state, { id: Date.now(), text: action.text, done: false }];
    if (action.type === "toggle") return state.map((t) => t.id === action.id ? { ...t, done: !t.done } : t);
    if (action.type === "remove") return state.filter((t) => t.id !== action.id);
    return state;
  };
  const [todos, dispatch] = useReducer(reducer, []);
  const [input, setInput] = useState("");
  return (
    <div>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={() => { dispatch({ type: "add", text: input }); setInput(""); }}>Add</button>
      <ul>
        {todos.map((t) => (
          <li key={t.id} style={{ textDecoration: t.done ? "line-through" : "none" }}>
            {t.text}
            <button onClick={() => dispatch({ type: "toggle", id: t.id })}>✓</button>
            <button onClick={() => dispatch({ type: "remove", id: t.id })}>✕</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Ex33_FormReducer() {
  type State = { name: string; email: string; submitted: boolean };
  type Action = { type: "set"; field: string; value: string } | { type: "submit" } | { type: "reset" };
  const reducer = (state: State, action: Action): State => {
    if (action.type === "set") return { ...state, [action.field]: action.value };
    if (action.type === "submit") return { ...state, submitted: true };
    return { name: "", email: "", submitted: false };
  };
  const [state, dispatch] = useReducer(reducer, { name: "", email: "", submitted: false });
  if (state.submitted) return <p>Submitted: {state.name} ({state.email}) <button onClick={() => dispatch({ type: "reset" })}>Reset</button></p>;
  return (
    <div>
      <input placeholder="Name" value={state.name} onChange={(e) => dispatch({ type: "set", field: "name", value: e.target.value })} />
      <input placeholder="Email" value={state.email} onChange={(e) => dispatch({ type: "set", field: "email", value: e.target.value })} />
      <button onClick={() => dispatch({ type: "submit" })}>Submit</button>
    </div>
  );
}

function Ex34_LoadingState() {
  type State = { loading: boolean; data: string; error: string };
  type Action = { type: "fetch" } | { type: "success"; data: string } | { type: "error"; msg: string };
  const reducer = (state: State, action: Action): State => {
    if (action.type === "fetch") return { loading: true, data: "", error: "" };
    if (action.type === "success") return { loading: false, data: action.data, error: "" };
    if (action.type === "error") return { loading: false, data: "", error: action.msg };
    return state;
  };
  const [state, dispatch] = useReducer(reducer, { loading: false, data: "", error: "" });
  const fetchData = () => {
    dispatch({ type: "fetch" });
    setTimeout(() => dispatch({ type: "success", data: "Hello from API!" }), 1000);
  };
  return (
    <div>
      <button onClick={fetchData}>Fetch</button>
      {state.loading && <p>Loading...</p>}
      {state.data && <p>{state.data}</p>}
      {state.error && <p style={{ color: "red" }}>{state.error}</p>}
    </div>
  );
}

function Ex35_ShoppingCart() {
  type Item = { name: string; qty: number; price: number };
  type Action = { type: "add"; item: Item } | { type: "remove"; name: string } | { type: "clear" };
  const reducer = (state: Item[], action: Action): Item[] => {
    if (action.type === "add") {
      const exists = state.find((i) => i.name === action.item.name);
      if (exists) return state.map((i) => i.name === action.item.name ? { ...i, qty: i.qty + 1 } : i);
      return [...state, action.item];
    }
    if (action.type === "remove") return state.filter((i) => i.name !== action.name);
    return [];
  };
  const [cart, dispatch] = useReducer(reducer, []);
  const products = [{ name: "Shoes", price: 50 }, { name: "Hat", price: 20 }];
  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  return (
    <div>
      {products.map((p) => (
        <button key={p.name} onClick={() => dispatch({ type: "add", item: { ...p, qty: 1 } })}>{p.name} ${p.price}</button>
      ))}
      <hr />
      {cart.map((i) => <p key={i.name}>{i.name} x{i.qty} = ${i.price * i.qty} <button onClick={() => dispatch({ type: "remove", name: i.name })}>✕</button></p>)}
      <b>Total: ${total}</b>
      <button onClick={() => dispatch({ type: "clear" })}>Clear</button>
    </div>
  );
}

function Ex36_UndoRedo() {
  type State = { history: number[]; index: number };
  type Action = { type: "add"; value: number } | { type: "undo" } | { type: "redo" };
  const reducer = (state: State, action: Action): State => {
    if (action.type === "add") {
      const newHistory = [...state.history.slice(0, state.index + 1), action.value];
      return { history: newHistory, index: newHistory.length - 1 };
    }
    if (action.type === "undo") return { ...state, index: Math.max(0, state.index - 1) };
    if (action.type === "redo") return { ...state, index: Math.min(state.history.length - 1, state.index + 1) };
    return state;
  };
  const [state, dispatch] = useReducer(reducer, { history: [0], index: 0 });
  const current = state.history[state.index];
  return (
    <div>
      <p>Value: {current}</p>
      <button onClick={() => dispatch({ type: "add", value: current + 1 })}>+1</button>
      <button onClick={() => dispatch({ type: "undo" })} disabled={state.index === 0}>Undo</button>
      <button onClick={() => dispatch({ type: "redo" })} disabled={state.index === state.history.length - 1}>Redo</button>
    </div>
  );
}

function Ex37_TabReducer() {
  type Action = { type: "switch"; tab: string };
  const [active, dispatch] = useReducer(
    (_: string, action: Action) => action.tab,
    "Home"
  );
  return (
    <div>
      <div style={{ display: "flex", gap: 4 }}>
        {["Home", "Profile", "Settings"].map((tab) => (
          <button key={tab} style={{ fontWeight: active === tab ? "bold" : "normal" }} onClick={() => dispatch({ type: "switch", tab })}>
            {tab}
          </button>
        ))}
      </div>
      <p>Active: {active}</p>
    </div>
  );
}

function Ex38_AuthReducer() {
  type State = { user: string | null; loggedIn: boolean };
  type Action = { type: "login"; user: string } | { type: "logout" };
  const reducer = (state: State, action: Action): State => {
    if (action.type === "login") return { user: action.user, loggedIn: true };
    return { user: null, loggedIn: false };
  };
  const [state, dispatch] = useReducer(reducer, { user: null, loggedIn: false });
  return (
    <div>
      {state.loggedIn
        ? <><p>Welcome, {state.user}</p><button onClick={() => dispatch({ type: "logout" })}>Logout</button></>
        : <button onClick={() => dispatch({ type: "login", user: "Ajay" })}>Login as Ajay</button>}
    </div>
  );
}

function Ex39_NestedStateReducer() {
  type State = { profile: { name: string; bio: string }; settings: { darkMode: boolean } };
  type Action = { type: "updateName"; name: string } | { type: "toggleDark" };
  const reducer = (state: State, action: Action): State => {
    if (action.type === "updateName") return { ...state, profile: { ...state.profile, name: action.name } };
    if (action.type === "toggleDark") return { ...state, settings: { darkMode: !state.settings.darkMode } };
    return state;
  };
  const [state, dispatch] = useReducer(reducer, { profile: { name: "", bio: "" }, settings: { darkMode: false } });
  return (
    <div style={{ background: state.settings.darkMode ? "#222" : "#fff", color: state.settings.darkMode ? "#fff" : "#000", padding: 8 }}>
      <input placeholder="Name" value={state.profile.name} onChange={(e) => dispatch({ type: "updateName", name: e.target.value })} />
      <label><input type="checkbox" checked={state.settings.darkMode} onChange={() => dispatch({ type: "toggleDark" })} /> Dark Mode</label>
    </div>
  );
}

function Ex40_StepWizardReducer() {
  const steps = ["Step 1: Info", "Step 2: Address", "Step 3: Review"];
  type Action = { type: "next" } | { type: "prev" };
  const reducer = (step: number, action: Action) => {
    if (action.type === "next") return Math.min(step + 1, steps.length - 1);
    if (action.type === "prev") return Math.max(step - 1, 0);
    return step;
  };
  const [step, dispatch] = useReducer(reducer, 0);
  return (
    <div>
      <p>{steps[step]}</p>
      <button disabled={step === 0} onClick={() => dispatch({ type: "prev" })}>Back</button>
      <button disabled={step === steps.length - 1} onClick={() => dispatch({ type: "next" })}>Next</button>
    </div>
  );
}

// ─────────────────────────────────────────
// useRef  (41–50)
// ─────────────────────────────────────────

function Ex41_FocusInput() {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <input ref={inputRef} placeholder="Click button to focus" />
      <button onClick={() => inputRef.current?.focus()}>Focus</button>
    </div>
  );
}

function Ex42_PreviousValue() {
  const [count, setCount] = useState(0);
  const prevRef = useRef(0);
  useEffect(() => { prevRef.current = count; });
  return (
    <div>
      <p>Current: {count} | Previous: {prevRef.current}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  );
}

function Ex43_CountRenders() {
  const [val, setVal] = useState("");
  const renderCount = useRef(0);
  renderCount.current += 1;
  return (
    <div>
      <input value={val} onChange={(e) => setVal(e.target.value)} />
      <p>Renders: {renderCount.current}</p>
    </div>
  );
}

function Ex44_IntervalRef() {
  const [running, setRunning] = useState(false);
  const [count, setCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const start = () => {
    if (running) return;
    setRunning(true);
    intervalRef.current = setInterval(() => setCount((c) => c + 1), 1000);
  };
  const stop = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={start} disabled={running}>Start</button>
      <button onClick={stop} disabled={!running}>Stop</button>
    </div>
  );
}

function Ex45_ScrollToElement() {
  const bottomRef = useRef<HTMLDivElement>(null);
  return (
    <div>
      <button onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}>
        Scroll to Bottom
      </button>
      <div style={{ height: 200, overflow: "auto", border: "1px solid #ccc" }}>
        {Array.from({ length: 20 }, (_, i) => <p key={i}>Line {i + 1}</p>)}
        <div ref={bottomRef}>⬆ Bottom</div>
      </div>
    </div>
  );
}

function Ex46_MeasureElement() {
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const measure = () => {
    if (boxRef.current) {
      setSize({ w: boxRef.current.offsetWidth, h: boxRef.current.offsetHeight });
    }
  };
  return (
    <div>
      <div ref={boxRef} style={{ padding: 16, background: "#eee", resize: "both", overflow: "auto" }}>
        Resize me
      </div>
      <button onClick={measure}>Measure</button>
      <p>{size.w} x {size.h}</p>
    </div>
  );
}

function Ex47_TimeoutRef() {
  const [msg, setMsg] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setMsg("Done!"), 2000);
    setMsg("Waiting 2s...");
  };
  return (
    <div>
      <button onClick={start}>Start</button>
      <p>{msg}</p>
    </div>
  );
}

function Ex48_MutableValueNoRerender() {
  const clickCount = useRef(0);
  const [shown, setShown] = useState(0);
  return (
    <div>
      <button onClick={() => { clickCount.current += 1; }}>
        Click (no re-render)
      </button>
      <button onClick={() => setShown(clickCount.current)}>
        Show click count: {shown}
      </button>
    </div>
  );
}

function Ex49_StopwatchRefState() {
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const startTime = useRef(0);
  const frameRef = useRef(0);
  const tick = () => {
    setTime(Date.now() - startTime.current);
    frameRef.current = requestAnimationFrame(tick);
  };
  const start = () => { setRunning(true); startTime.current = Date.now() - time; frameRef.current = requestAnimationFrame(tick); };
  const stop = () => { setRunning(false); cancelAnimationFrame(frameRef.current); };
  const reset = () => { stop(); setTime(0); };
  return (
    <div>
      <p>{(time / 1000).toFixed(2)}s</p>
      <button onClick={running ? stop : start}>{running ? "Stop" : "Start"}</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}

function Ex50_RefWithEffect() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  useEffect(() => {
    // Auto-focus on mount
    inputRef.current?.focus();
  }, []);
  return (
    <div>
      <input ref={inputRef} value={value} onChange={(e) => setValue(e.target.value)} placeholder="Auto-focused on mount" />
      <p>{value}</p>
    </div>
  );
}

// ─────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────

const examples: { label: string; component: JSX.Element }[] = [
  // useState
  { label: "01 – useState: Counter",              component: <Ex01_Counter /> },
  { label: "02 – useState: Text Input",           component: <Ex02_TextInput /> },
  { label: "03 – useState: Toggle Boolean",       component: <Ex03_ToggleBoolean /> },
  { label: "04 – useState: Object State",         component: <Ex04_ObjectState /> },
  { label: "05 – useState: Array Add",            component: <Ex05_ArrayAddItem /> },
  { label: "06 – useState: Array Remove",         component: <Ex06_ArrayRemoveItem /> },
  { label: "07 – useState: Array Update",         component: <Ex07_ArrayUpdateItem /> },
  { label: "08 – useState: Multiple States",      component: <Ex08_MultipleStates /> },
  { label: "09 – useState: Lazy Init",            component: <Ex09_LazyInitialState /> },
  { label: "10 – useState: Functional Update",    component: <Ex10_PreviousValue /> },
  { label: "11 – useState: Checkbox",             component: <Ex11_ControlledCheckbox /> },
  { label: "12 – useState: Radio Group",          component: <Ex12_RadioGroup /> },
  { label: "13 – useState: Select",               component: <Ex13_SelectDropdown /> },
  { label: "14 – useState: Char Counter",         component: <Ex14_CharacterCounter /> },
  { label: "15 – useState: Password Toggle",      component: <Ex15_PasswordToggle /> },
  // useEffect
  { label: "16 – useEffect: Log on Mount",        component: <Ex16_LogOnMount /> },
  { label: "17 – useEffect: Document Title",      component: <Ex17_DocumentTitle /> },
  { label: "18 – useEffect: Fetch on Mount",      component: <Ex18_FetchOnMount /> },
  { label: "19 – useEffect: Interval",            component: <Ex19_Interval /> },
  { label: "20 – useEffect: Event Listener",      component: <Ex20_EventListener /> },
  { label: "21 – useEffect: Dep + Debounce",      component: <Ex21_EffectWithDep /> },
  { label: "22 – useEffect: Skip First Render",   component: <Ex22_SkipOnFirstRender /> },
  { label: "23 – useEffect: Multiple Deps",       component: <Ex23_MultipleDeps /> },
  { label: "24 – useEffect: LocalStorage Sync",   component: <Ex24_LocalStorageSync /> },
  { label: "25 – useEffect: Abort Fetch",         component: <Ex25_AbortFetch /> },
  // useContext
  { label: "26 – useContext: Theme",              component: <ThemeProvider><Ex26_ThemeContext /></ThemeProvider> },
  { label: "27 – useContext: User",               component: <Ex27_UserContext /> },
  { label: "28 – useContext: Language",           component: <Ex28_LanguageContext /> },
  { label: "29 – useContext: Multiple",           component: <Ex29_MultipleContexts /> },
  { label: "30 – useContext: Default Value",      component: <Ex30_ContextWithDefault /> },
  // useReducer
  { label: "31 – useReducer: Counter",            component: <Ex31_SimpleCounter /> },
  { label: "32 – useReducer: Todo List",          component: <Ex32_TodoReducer /> },
  { label: "33 – useReducer: Form",               component: <Ex33_FormReducer /> },
  { label: "34 – useReducer: Loading State",      component: <Ex34_LoadingState /> },
  { label: "35 – useReducer: Shopping Cart",      component: <Ex35_ShoppingCart /> },
  { label: "36 – useReducer: Undo/Redo",          component: <Ex36_UndoRedo /> },
  { label: "37 – useReducer: Tab Switch",         component: <Ex37_TabReducer /> },
  { label: "38 – useReducer: Auth",               component: <Ex38_AuthReducer /> },
  { label: "39 – useReducer: Nested State",       component: <Ex39_NestedStateReducer /> },
  { label: "40 – useReducer: Step Wizard",        component: <Ex40_StepWizardReducer /> },
  // useRef
  { label: "41 – useRef: Focus Input",            component: <Ex41_FocusInput /> },
  { label: "42 – useRef: Previous Value",         component: <Ex42_PreviousValue /> },
  { label: "43 – useRef: Count Renders",          component: <Ex43_CountRenders /> },
  { label: "44 – useRef: Interval Ref",           component: <Ex44_IntervalRef /> },
  { label: "45 – useRef: Scroll to Element",      component: <Ex45_ScrollToElement /> },
  { label: "46 – useRef: Measure Element",        component: <Ex46_MeasureElement /> },
  { label: "47 – useRef: Timeout Ref",            component: <Ex47_TimeoutRef /> },
  { label: "48 – useRef: Mutable No Rerender",    component: <Ex48_MutableValueNoRerender /> },
  { label: "49 – useRef: Stopwatch",              component: <Ex49_StopwatchRefState /> },
  { label: "50 – useRef + useEffect: Auto Focus", component: <Ex50_RefWithEffect /> },
];

export default function HooksExamples() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: 24 }}>
      <h1>50 React Hooks Examples (useState · useEffect · useContext · useReducer · useRef)</h1>
      {examples.map(({ label, component }) => (
        <section key={label} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 24 }}>
          <h2 style={{ marginTop: 0, fontSize: 15, color: "#555" }}>{label}</h2>
          {component}
        </section>
      ))}
    </div>
  );
}
