import { useReducer, useState } from "react";

// ─────────────────────────────────────────
// BASIC (1–12)
// ─────────────────────────────────────────

function Ex01_SimpleCounter() {
  const [count, dispatch] = useReducer((s: number, a: "inc" | "dec" | "reset") =>
    a === "inc" ? s + 1 : a === "dec" ? s - 1 : 0, 0);
  return <div><p>Count: {count}</p><button onClick={() => dispatch("inc")}>+</button><button onClick={() => dispatch("dec")}>–</button><button onClick={() => dispatch("reset")}>Reset</button></div>;
}

function Ex02_Toggle() {
  const [on, dispatch] = useReducer((s: boolean) => !s, false);
  return <div><p>{on ? "ON 💡" : "OFF"}</p><button onClick={dispatch}>Toggle</button></div>;
}

function Ex03_ActionTypes() {
  type A = { type: "INCREMENT" } | { type: "DECREMENT" } | { type: "RESET" } | { type: "SET"; value: number };
  const [n, dispatch] = useReducer((s: number, a: A) => {
    switch (a.type) {
      case "INCREMENT": return s + 1;
      case "DECREMENT": return s - 1;
      case "RESET":     return 0;
      case "SET":       return a.value;
      default:          return s;
    }
  }, 0);
  return <div><p>n: {n}</p><button onClick={() => dispatch({ type: "INCREMENT" })}>+</button><button onClick={() => dispatch({ type: "DECREMENT" })}>–</button><button onClick={() => dispatch({ type: "SET", value: 100 })}>Set 100</button><button onClick={() => dispatch({ type: "RESET" })}>Reset</button></div>;
}

function Ex04_StringState() {
  const [text, dispatch] = useReducer((s: string, a: { type: "set"; val: string } | { type: "clear" }) =>
    a.type === "set" ? a.val : "", "");
  return <div><input value={text} onChange={(e) => dispatch({ type: "set", val: e.target.value })} /><button onClick={() => dispatch({ type: "clear" })}>Clear</button><p>Length: {text.length}</p></div>;
}

function Ex05_BooleanFlags() {
  type S = { loading: boolean; error: boolean; success: boolean };
  type A = { type: "start" } | { type: "success" } | { type: "fail" } | { type: "reset" };
  const [state, dispatch] = useReducer((s: S, a: A): S => {
    if (a.type === "start")   return { loading: true,  error: false, success: false };
    if (a.type === "success") return { loading: false, error: false, success: true };
    if (a.type === "fail")    return { loading: false, error: true,  success: false };
    return { loading: false, error: false, success: false };
  }, { loading: false, error: false, success: false });
  return (
    <div>
      <button onClick={() => { dispatch({ type: "start" }); setTimeout(() => dispatch({ type: "success" }), 800); }}>Fetch</button>
      <button onClick={() => dispatch({ type: "fail" })}>Fail</button>
      <button onClick={() => dispatch({ type: "reset" })}>Reset</button>
      {state.loading && <p>⏳ Loading...</p>}
      {state.success && <p>✅ Success!</p>}
      {state.error   && <p>❌ Error!</p>}
    </div>
  );
}

function Ex06_CounterWithStep() {
  type S = { count: number; step: number };
  type A = { type: "inc" } | { type: "dec" } | { type: "setStep"; step: number } | { type: "reset" };
  const [s, dispatch] = useReducer((state: S, action: A): S => {
    if (action.type === "inc")     return { ...state, count: state.count + state.step };
    if (action.type === "dec")     return { ...state, count: state.count - state.step };
    if (action.type === "setStep") return { ...state, step: action.step };
    return { count: 0, step: state.step };
  }, { count: 0, step: 1 });
  return (
    <div>
      <p>Count: {s.count} (step: {s.step})</p>
      <button onClick={() => dispatch({ type: "inc" })}>+</button>
      <button onClick={() => dispatch({ type: "dec" })}>–</button>
      <input type="number" value={s.step} min="1" onChange={(e) => dispatch({ type: "setStep", step: +e.target.value })} style={{ width: 60 }} />
    </div>
  );
}

function Ex07_FetchStatus() {
  type S = { status: "idle" | "loading" | "done" | "error"; data: string };
  type A = { type: "fetch" } | { type: "resolve"; data: string } | { type: "reject" };
  const [s, dispatch] = useReducer((state: S, action: A): S => {
    if (action.type === "fetch")   return { status: "loading", data: "" };
    if (action.type === "resolve") return { status: "done", data: action.data };
    if (action.type === "reject")  return { status: "error", data: "" };
    return state;
  }, { status: "idle", data: "" });
  const load = () => { dispatch({ type: "fetch" }); setTimeout(() => dispatch({ type: "resolve", data: "Hello data!" }), 1000); };
  return (
    <div>
      <button onClick={load} disabled={s.status === "loading"}>Load</button>
      <p>Status: {s.status}</p>
      {s.data && <p>Data: {s.data}</p>}
    </div>
  );
}

function Ex08_LightSwitch() {
  type Color = "red" | "yellow" | "green";
  const next: Record<Color, Color> = { red: "green", green: "yellow", yellow: "red" };
  const [color, dispatch] = useReducer((c: Color) => next[c], "red");
  const bg = { red: "#ef4444", yellow: "#f59e0b", green: "#10b981" };
  return <div><div style={{ width: 50, height: 50, borderRadius: "50%", background: bg[color] }} /><button onClick={dispatch}>Next</button></div>;
}

function Ex09_TabState() {
  const tabs = ["Home", "Profile", "Settings"];
  const [tab, dispatch] = useReducer((_: string, action: { type: "switch"; tab: string }) => action.tab, "Home");
  return (
    <div>
      <div style={{ display: "flex", gap: 4 }}>{tabs.map((t) => <button key={t} style={{ fontWeight: tab === t ? "bold" : "normal" }} onClick={() => dispatch({ type: "switch", tab: t })}>{t}</button>)}</div>
      <p>Active: {tab}</p>
    </div>
  );
}

function Ex10_ModalState() {
  type A = { type: "open"; content: string } | { type: "close" };
  const [modal, dispatch] = useReducer((s: { open: boolean; content: string }, a: A) =>
    a.type === "open" ? { open: true, content: a.content } : { open: false, content: "" },
    { open: false, content: "" });
  return (
    <div>
      <button onClick={() => dispatch({ type: "open", content: "Modal content!" })}>Open Modal</button>
      {modal.open && (
        <div style={{ border: "1px solid #ccc", padding: 16, marginTop: 8 }}>
          <p>{modal.content}</p><button onClick={() => dispatch({ type: "close" })}>Close</button>
        </div>
      )}
    </div>
  );
}

function Ex11_VisibilityMap() {
  type A = { type: "toggle"; id: string };
  const items = ["item1", "item2", "item3"];
  const [visible, dispatch] = useReducer((s: Record<string, boolean>, a: A) =>
    ({ ...s, [a.id]: !s[a.id] }), { item1: true, item2: false, item3: true });
  return (
    <div>
      {items.map((id) => (
        <div key={id}>
          <button onClick={() => dispatch({ type: "toggle", id })}>{id}: {visible[id] ? "Visible" : "Hidden"}</button>
          {visible[id] && <span style={{ marginLeft: 8 }}>• Content</span>}
        </div>
      ))}
    </div>
  );
}

function Ex12_PasswordStrength() {
  type A = { type: "change"; val: string };
  const getStrength = (v: string) => v.length < 6 ? "Weak" : v.length < 10 ? "Medium" : "Strong";
  const [s, dispatch] = useReducer((state: { value: string; strength: string }, a: A) =>
    ({ value: a.val, strength: getStrength(a.val) }), { value: "", strength: "" });
  const colors: Record<string, string> = { Weak: "red", Medium: "orange", Strong: "green" };
  return (
    <div>
      <input type="password" value={s.value} onChange={(e) => dispatch({ type: "change", val: e.target.value })} placeholder="Enter password" />
      {s.value && <p style={{ color: colors[s.strength] }}>Strength: {s.strength}</p>}
    </div>
  );
}

// ─────────────────────────────────────────
// INTERMEDIATE (13–25)
// ─────────────────────────────────────────

function Ex13_TodoList() {
  type Todo = { id: number; text: string; done: boolean };
  type A = { type: "add"; text: string } | { type: "toggle"; id: number } | { type: "remove"; id: number };
  const [todos, dispatch] = useReducer((s: Todo[], a: A): Todo[] => {
    if (a.type === "add")    return [...s, { id: Date.now(), text: a.text, done: false }];
    if (a.type === "toggle") return s.map((t) => t.id === a.id ? { ...t, done: !t.done } : t);
    if (a.type === "remove") return s.filter((t) => t.id !== a.id);
    return s;
  }, []);
  const [input, setInput] = useState("");
  return (
    <div>
      <input value={input} onChange={(e) => setInput(e.target.value)} /><button onClick={() => { dispatch({ type: "add", text: input }); setInput(""); }}>Add</button>
      <ul>{todos.map((t) => <li key={t.id} style={{ textDecoration: t.done ? "line-through" : "none" }}>{t.text}<button onClick={() => dispatch({ type: "toggle", id: t.id })}>✓</button><button onClick={() => dispatch({ type: "remove", id: t.id })}>✕</button></li>)}</ul>
    </div>
  );
}

function Ex14_FormReducer() {
  type S = { name: string; email: string; errors: Record<string, string> };
  type A = { type: "set"; field: string; value: string } | { type: "validate" } | { type: "reset" };
  const [state, dispatch] = useReducer((s: S, a: A): S => {
    if (a.type === "set") return { ...s, [a.field]: a.value, errors: {} };
    if (a.type === "validate") {
      const errors: Record<string, string> = {};
      if (!s.name) errors.name = "Required";
      if (!s.email.includes("@")) errors.email = "Invalid email";
      return { ...s, errors };
    }
    return { name: "", email: "", errors: {} };
  }, { name: "", email: "", errors: {} });
  return (
    <form onSubmit={(e) => { e.preventDefault(); dispatch({ type: "validate" }); }}>
      <div><input placeholder="Name" value={state.name} onChange={(e) => dispatch({ type: "set", field: "name", value: e.target.value })} />{state.errors.name && <span style={{ color: "red" }}>{state.errors.name}</span>}</div>
      <div><input placeholder="Email" value={state.email} onChange={(e) => dispatch({ type: "set", field: "email", value: e.target.value })} />{state.errors.email && <span style={{ color: "red" }}>{state.errors.email}</span>}</div>
      <button type="submit">Validate</button><button type="button" onClick={() => dispatch({ type: "reset" })}>Reset</button>
    </form>
  );
}

function Ex15_ShoppingCart() {
  type Item = { id: number; name: string; price: number; qty: number };
  type A = { type: "add"; item: Omit<Item, "qty"> } | { type: "remove"; id: number } | { type: "inc"; id: number } | { type: "dec"; id: number } | { type: "clear" };
  const [cart, dispatch] = useReducer((s: Item[], a: A): Item[] => {
    if (a.type === "add") {
      const exists = s.find((i) => i.id === a.item.id);
      return exists ? s.map((i) => i.id === a.item.id ? { ...i, qty: i.qty + 1 } : i) : [...s, { ...a.item, qty: 1 }];
    }
    if (a.type === "remove") return s.filter((i) => i.id !== a.id);
    if (a.type === "inc") return s.map((i) => i.id === a.id ? { ...i, qty: i.qty + 1 } : i);
    if (a.type === "dec") return s.map((i) => i.id === a.id ? { ...i, qty: Math.max(1, i.qty - 1) } : i);
    return [];
  }, []);
  const products = [{ id: 1, name: "Shoes", price: 50 }, { id: 2, name: "Hat", price: 20 }];
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  return (
    <div>
      {products.map((p) => <button key={p.id} onClick={() => dispatch({ type: "add", item: p })}>{p.name} ${p.price}</button>)}
      <hr />
      {cart.map((i) => <div key={i.id}>{i.name} x{i.qty} = ${i.price * i.qty}<button onClick={() => dispatch({ type: "inc", id: i.id })}>+</button><button onClick={() => dispatch({ type: "dec", id: i.id })}>–</button><button onClick={() => dispatch({ type: "remove", id: i.id })}>✕</button></div>)}
      <p><b>Total: ${total}</b></p>
      <button onClick={() => dispatch({ type: "clear" })}>Clear cart</button>
    </div>
  );
}

function Ex16_AuthReducer() {
  type S = { user: string | null; role: string | null; loggedIn: boolean };
  type A = { type: "login"; user: string; role: string } | { type: "logout" } | { type: "updateRole"; role: string };
  const [s, dispatch] = useReducer((state: S, action: A): S => {
    if (action.type === "login")      return { user: action.user, role: action.role, loggedIn: true };
    if (action.type === "logout")     return { user: null, role: null, loggedIn: false };
    if (action.type === "updateRole") return { ...state, role: action.role };
    return state;
  }, { user: null, role: null, loggedIn: false });
  return (
    <div>
      {s.loggedIn
        ? <><p>User: {s.user} | Role: {s.role}</p><select onChange={(e) => dispatch({ type: "updateRole", role: e.target.value })} value={s.role ?? ""}><option value="admin">Admin</option><option value="user">User</option></select><button onClick={() => dispatch({ type: "logout" })}>Logout</button></>
        : <button onClick={() => dispatch({ type: "login", user: "Ajay", role: "admin" })}>Login</button>}
    </div>
  );
}

function Ex17_UndoRedo() {
  type S = { past: number[]; present: number; future: number[] };
  type A = { type: "change"; value: number } | { type: "undo" } | { type: "redo" };
  const [s, dispatch] = useReducer((state: S, action: A): S => {
    if (action.type === "change") return { past: [...state.past, state.present], present: action.value, future: [] };
    if (action.type === "undo")   return { past: state.past.slice(0, -1), present: state.past[state.past.length - 1] ?? 0, future: [state.present, ...state.future] };
    if (action.type === "redo")   return { past: [...state.past, state.present], present: state.future[0] ?? state.present, future: state.future.slice(1) };
    return state;
  }, { past: [], present: 0, future: [] });
  return (
    <div>
      <p>Value: {s.present}</p>
      <button onClick={() => dispatch({ type: "change", value: s.present + 1 })}>+1</button>
      <button onClick={() => dispatch({ type: "change", value: s.present + 10 })}>+10</button>
      <button onClick={() => dispatch({ type: "undo" })} disabled={!s.past.length}>Undo</button>
      <button onClick={() => dispatch({ type: "redo" })} disabled={!s.future.length}>Redo</button>
      <p>Past: [{s.past.join(",")}] Future: [{s.future.join(",")}]</p>
    </div>
  );
}

function Ex18_NotificationList() {
  type Notif = { id: number; msg: string; type: "info" | "success" | "error" };
  type A = { type: "add"; msg: string; kind: Notif["type"] } | { type: "remove"; id: number } | { type: "clear" };
  const [notifs, dispatch] = useReducer((s: Notif[], a: A): Notif[] => {
    if (a.type === "add")    return [...s, { id: Date.now(), msg: a.msg, type: a.kind }];
    if (a.type === "remove") return s.filter((n) => n.id !== a.id);
    return [];
  }, []);
  const colors: Record<string, string> = { info: "#dbeafe", success: "#d1fae5", error: "#fee2e2" };
  return (
    <div>
      <button onClick={() => dispatch({ type: "add", msg: "Info!", kind: "info" })}>Info</button>
      <button onClick={() => dispatch({ type: "add", msg: "Success!", kind: "success" })}>Success</button>
      <button onClick={() => dispatch({ type: "add", msg: "Error!", kind: "error" })}>Error</button>
      <button onClick={() => dispatch({ type: "clear" })}>Clear all</button>
      <div>{notifs.map((n) => <div key={n.id} style={{ background: colors[n.type], padding: 8, marginTop: 4 }}>{n.msg}<button onClick={() => dispatch({ type: "remove", id: n.id })}>✕</button></div>)}</div>
    </div>
  );
}

function Ex19_Pagination() {
  type A = { type: "next" } | { type: "prev" } | { type: "goto"; page: number };
  const total = 20;
  const [page, dispatch] = useReducer((s: number, a: A) => {
    if (a.type === "next") return Math.min(s + 1, total);
    if (a.type === "prev") return Math.max(s - 1, 1);
    if (a.type === "goto") return a.page;
    return s;
  }, 1);
  return (
    <div>
      <button disabled={page === 1} onClick={() => dispatch({ type: "prev" })}>Prev</button>
      <span> Page {page} of {total} </span>
      <button disabled={page === total} onClick={() => dispatch({ type: "next" })}>Next</button>
      <br />
      {[1, 5, 10, 15, 20].map((p) => <button key={p} onClick={() => dispatch({ type: "goto", page: p })} style={{ fontWeight: page === p ? "bold" : "normal" }}>{p}</button>)}
    </div>
  );
}

function Ex20_FilterSort() {
  type S = { filter: string; sort: "asc" | "desc"; search: string };
  type A = { type: "setFilter"; value: string } | { type: "toggleSort" } | { type: "setSearch"; value: string } | { type: "reset" };
  const [s, dispatch] = useReducer((state: S, action: A): S => {
    if (action.type === "setFilter") return { ...state, filter: action.value };
    if (action.type === "toggleSort") return { ...state, sort: state.sort === "asc" ? "desc" : "asc" };
    if (action.type === "setSearch") return { ...state, search: action.value };
    return { filter: "all", sort: "asc", search: "" };
  }, { filter: "all", sort: "asc", search: "" });
  const users = [{ name: "Alice", role: "admin" }, { name: "Bob", role: "user" }, { name: "Charlie", role: "admin" }];
  const visible = users
    .filter((u) => s.filter === "all" || u.role === s.filter)
    .filter((u) => u.name.toLowerCase().includes(s.search.toLowerCase()))
    .sort((a, b) => s.sort === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
  return (
    <div>
      <input value={s.search} onChange={(e) => dispatch({ type: "setSearch", value: e.target.value })} placeholder="Search" />
      <select value={s.filter} onChange={(e) => dispatch({ type: "setFilter", value: e.target.value })}><option value="all">All</option><option value="admin">Admin</option><option value="user">User</option></select>
      <button onClick={() => dispatch({ type: "toggleSort" })}>Sort: {s.sort}</button>
      <button onClick={() => dispatch({ type: "reset" })}>Reset</button>
      <ul>{visible.map((u) => <li key={u.name}>{u.name} ({u.role})</li>)}</ul>
    </div>
  );
}

function Ex21_AccordionReducer() {
  const items = [{ title: "React", body: "A UI library" }, { title: "Vue", body: "Progressive framework" }, { title: "Angular", body: "Full framework" }];
  const [open, dispatch] = useReducer((s: number | null, a: { type: "toggle"; index: number }) =>
    s === a.index ? null : a.index, null);
  return (
    <div>
      {items.map((item, i) => (
        <div key={i}>
          <button onClick={() => dispatch({ type: "toggle", index: i })}>{open === i ? "▼" : "▶"} {item.title}</button>
          {open === i && <p style={{ padding: "4px 16px" }}>{item.body}</p>}
        </div>
      ))}
    </div>
  );
}

function Ex22_StepWizard() {
  const steps = ["Personal Info", "Address", "Payment", "Confirmation"];
  type A = { type: "next" } | { type: "prev" } | { type: "jump"; step: number };
  const [step, dispatch] = useReducer((s: number, a: A) => {
    if (a.type === "next") return Math.min(s + 1, steps.length - 1);
    if (a.type === "prev") return Math.max(s - 1, 0);
    if (a.type === "jump") return a.step;
    return s;
  }, 0);
  return (
    <div>
      <div style={{ display: "flex", gap: 4 }}>{steps.map((s, i) => <span key={i} style={{ padding: "4px 8px", background: i === step ? "#4f46e5" : "#e5e7eb", color: i === step ? "#fff" : "#000", borderRadius: 4, cursor: "pointer" }} onClick={() => dispatch({ type: "jump", step: i })}>{i + 1}</span>)}</div>
      <p style={{ marginTop: 12, padding: 12, background: "#f3f4f6" }}>Step {step + 1}: {steps[step]}</p>
      <button disabled={step === 0} onClick={() => dispatch({ type: "prev" })}>Back</button>
      <button disabled={step === steps.length - 1} onClick={() => dispatch({ type: "next" })}>Next</button>
    </div>
  );
}

function Ex23_DiceGame() {
  type S = { dice: number[]; rolls: number; total: number };
  type A = { type: "roll" } | { type: "reset" };
  const [s, dispatch] = useReducer((state: S, action: A): S => {
    if (action.type === "roll") {
      const dice = Array.from({ length: 3 }, () => Math.ceil(Math.random() * 6));
      return { dice, rolls: state.rolls + 1, total: state.total + dice.reduce((a, b) => a + b, 0) };
    }
    return { dice: [], rolls: 0, total: 0 };
  }, { dice: [], rolls: 0, total: 0 });
  return (
    <div>
      <button onClick={() => dispatch({ type: "roll" })}>Roll 🎲</button>
      <button onClick={() => dispatch({ type: "reset" })}>Reset</button>
      <p>Dice: {s.dice.join(", ") || "–"}</p>
      <p>Rolls: {s.rolls} | Total: {s.total}</p>
    </div>
  );
}

function Ex24_MultiTabReducer() {
  type Tab = "profile" | "settings" | "notifications";
  type S = { activeTab: Tab; dirty: boolean };
  type A = { type: "switchTab"; tab: Tab } | { type: "markDirty" } | { type: "save" };
  const [s, dispatch] = useReducer((state: S, action: A): S => {
    if (action.type === "switchTab") return { ...state, activeTab: action.tab, dirty: false };
    if (action.type === "markDirty") return { ...state, dirty: true };
    return { ...state, dirty: false };
  }, { activeTab: "profile", dirty: false });
  return (
    <div>
      <div style={{ display: "flex", gap: 4 }}>
        {(["profile", "settings", "notifications"] as Tab[]).map((t) => <button key={t} style={{ fontWeight: s.activeTab === t ? "bold" : "normal" }} onClick={() => dispatch({ type: "switchTab", tab: t })}>{t}</button>)}
      </div>
      <p>Tab: {s.activeTab} {s.dirty ? "(unsaved changes)" : ""}</p>
      <button onClick={() => dispatch({ type: "markDirty" })}>Make change</button>
      {s.dirty && <button onClick={() => dispatch({ type: "save" })}>Save</button>}
    </div>
  );
}

function Ex25_BankAccount() {
  type A = { type: "deposit"; amount: number } | { type: "withdraw"; amount: number } | { type: "reset" };
  type S = { balance: number; transactions: string[] };
  const [s, dispatch] = useReducer((state: S, action: A): S => {
    if (action.type === "deposit")  return { balance: state.balance + action.amount, transactions: [...state.transactions, `+$${action.amount}`] };
    if (action.type === "withdraw") return state.balance >= action.amount ? { balance: state.balance - action.amount, transactions: [...state.transactions, `-$${action.amount}`] } : state;
    return { balance: 0, transactions: [] };
  }, { balance: 1000, transactions: [] });
  return (
    <div>
      <p>Balance: ${s.balance}</p>
      {[10, 50, 100].map((a) => <button key={a} onClick={() => dispatch({ type: "deposit", amount: a })}>+${a}</button>)}
      {[10, 50, 100].map((a) => <button key={a} onClick={() => dispatch({ type: "withdraw", amount: a })}>-${a}</button>)}
      <button onClick={() => dispatch({ type: "reset" })}>Reset</button>
      <ul style={{ maxHeight: 80, overflowY: "auto" }}>{s.transactions.map((t, i) => <li key={i}>{t}</li>)}</ul>
    </div>
  );
}

// ─────────────────────────────────────────
// NESTED (26–37)
// ─────────────────────────────────────────

function Ex26_NestedObjectReducer() {
  type S = { user: { name: string; email: string }; settings: { theme: "light" | "dark"; lang: string } };
  type A = { type: "setUser"; field: "name" | "email"; val: string } | { type: "toggleTheme" } | { type: "setLang"; lang: string };
  const [s, dispatch] = useReducer((state: S, action: A): S => {
    if (action.type === "setUser")   return { ...state, user: { ...state.user, [action.field]: action.val } };
    if (action.type === "toggleTheme") return { ...state, settings: { ...state.settings, theme: state.settings.theme === "light" ? "dark" : "light" } };
    if (action.type === "setLang")   return { ...state, settings: { ...state.settings, lang: action.lang } };
    return state;
  }, { user: { name: "", email: "" }, settings: { theme: "light", lang: "EN" } });
  return (
    <div style={{ background: s.settings.theme === "dark" ? "#222" : "#eee", padding: 12, color: s.settings.theme === "dark" ? "#fff" : "#000" }}>
      <input placeholder="Name" value={s.user.name} onChange={(e) => dispatch({ type: "setUser", field: "name", val: e.target.value })} />
      <input placeholder="Email" value={s.user.email} onChange={(e) => dispatch({ type: "setUser", field: "email", val: e.target.value })} />
      <button onClick={() => dispatch({ type: "toggleTheme" })}>Theme: {s.settings.theme}</button>
      <select value={s.settings.lang} onChange={(e) => dispatch({ type: "setLang", lang: e.target.value })}>{["EN","AR","FR"].map((l) => <option key={l} value={l}>{l}</option>)}</select>
      <pre style={{ fontSize: 11 }}>{JSON.stringify(s, null, 2)}</pre>
    </div>
  );
}

function Ex27_TodoWithSubtasks() {
  type Subtask = { id: number; text: string; done: boolean };
  type Todo = { id: number; title: string; subtasks: Subtask[] };
  type A = { type: "addTodo"; title: string } | { type: "addSub"; todoId: number; text: string } | { type: "toggleSub"; todoId: number; subId: number };
  const [todos, dispatch] = useReducer((s: Todo[], a: A): Todo[] => {
    if (a.type === "addTodo") return [...s, { id: Date.now(), title: a.title, subtasks: [] }];
    if (a.type === "addSub")  return s.map((t) => t.id === a.todoId ? { ...t, subtasks: [...t.subtasks, { id: Date.now(), text: a.text, done: false }] } : t);
    if (a.type === "toggleSub") return s.map((t) => t.id === a.todoId ? { ...t, subtasks: t.subtasks.map((s) => s.id === a.subId ? { ...s, done: !s.done } : s) } : t);
    return s;
  }, []);
  const [inp, setInp] = useState("");
  const [subInp, setSubInp] = useState<Record<number, string>>({});
  return (
    <div>
      <input value={inp} onChange={(e) => setInp(e.target.value)} /><button onClick={() => { dispatch({ type: "addTodo", title: inp }); setInp(""); }}>Add Todo</button>
      {todos.map((t) => (
        <div key={t.id} style={{ marginTop: 8, paddingLeft: 8, borderLeft: "2px solid #ccc" }}>
          <b>{t.title}</b>
          <ul>{t.subtasks.map((s) => <li key={s.id} style={{ textDecoration: s.done ? "line-through" : "none" }}><input type="checkbox" checked={s.done} onChange={() => dispatch({ type: "toggleSub", todoId: t.id, subId: s.id })} />{s.text}</li>)}</ul>
          <input value={subInp[t.id] ?? ""} onChange={(e) => setSubInp({ ...subInp, [t.id]: e.target.value })} placeholder="Add subtask" />
          <button onClick={() => { dispatch({ type: "addSub", todoId: t.id, text: subInp[t.id] ?? "" }); setSubInp({ ...subInp, [t.id]: "" }); }}>+ Sub</button>
        </div>
      ))}
    </div>
  );
}

function Ex28_KanbanReducer() {
  type Card = { id: number; text: string };
  type S = Record<string, Card[]>;
  type A = { type: "add"; col: string; text: string } | { type: "move"; id: number; from: string; to: string } | { type: "remove"; id: number; col: string };
  const cols = ["Todo", "In Progress", "Done"];
  const [board, dispatch] = useReducer((s: S, a: A): S => {
    if (a.type === "add")    return { ...s, [a.col]: [...s[a.col], { id: Date.now(), text: a.text }] };
    if (a.type === "move")   { const card = s[a.from].find((c) => c.id === a.id)!; return { ...s, [a.from]: s[a.from].filter((c) => c.id !== a.id), [a.to]: [...s[a.to], card] }; }
    if (a.type === "remove") return { ...s, [a.col]: s[a.col].filter((c) => c.id !== a.id) };
    return s;
  }, { Todo: [{ id: 1, text: "Design" }], "In Progress": [{ id: 2, text: "Build" }], Done: [] });
  const [inp, setInp] = useState<Record<string, string>>({});
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {cols.map((col) => (
        <div key={col} style={{ flex: 1, background: "#f3f4f6", padding: 8, borderRadius: 8 }}>
          <b>{col}</b>
          <div><input value={inp[col] ?? ""} onChange={(e) => setInp({ ...inp, [col]: e.target.value })} style={{ width: "60%" }} /><button onClick={() => { dispatch({ type: "add", col, text: inp[col] ?? "" }); setInp({ ...inp, [col]: "" }); }}>+</button></div>
          {board[col].map((card) => (
            <div key={card.id} style={{ background: "#fff", padding: 4, marginTop: 4 }}>
              {card.text}
              {cols.filter((c) => c !== col).map((c) => <button key={c} style={{ fontSize: 10 }} onClick={() => dispatch({ type: "move", id: card.id, from: col, to: c })}>→{c}</button>)}
              <button style={{ fontSize: 10 }} onClick={() => dispatch({ type: "remove", id: card.id, col })}>✕</button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function Ex29_TreeReducer() {
  type Node = { id: number; label: string; expanded: boolean; children: Node[] };
  type A = { type: "toggle"; id: number } | { type: "add"; parentId: number; label: string };
  const toggleNode = (nodes: Node[], id: number): Node[] =>
    nodes.map((n) => n.id === id ? { ...n, expanded: !n.expanded } : { ...n, children: toggleNode(n.children, id) });
  const addNode = (nodes: Node[], parentId: number, label: string): Node[] =>
    nodes.map((n) => n.id === parentId ? { ...n, children: [...n.children, { id: Date.now(), label, expanded: false, children: [] }] } : { ...n, children: addNode(n.children, parentId, label) });
  const [tree, dispatch] = useReducer((s: Node[], a: A): Node[] => {
    if (a.type === "toggle") return toggleNode(s, a.id);
    if (a.type === "add")    return addNode(s, a.parentId, a.label);
    return s;
  }, [{ id: 1, label: "Root", expanded: true, children: [{ id: 2, label: "Child A", expanded: false, children: [] }] }]);
  const renderTree = (nodes: Node[], depth = 0): JSX.Element => (
    <ul style={{ paddingLeft: depth * 16 }}>
      {nodes.map((n) => (
        <li key={n.id}>
          <button onClick={() => dispatch({ type: "toggle", id: n.id })}>{n.expanded ? "▼" : "▶"}</button> {n.label}
          {n.expanded && <><button onClick={() => dispatch({ type: "add", parentId: n.id, label: `Child ${Date.now() % 100}` })}>+ Child</button>{renderTree(n.children, depth + 1)}</>}
        </li>
      ))}
    </ul>
  );
  return renderTree(tree);
}

function Ex30_FormBuilderReducer() {
  type Field = { id: number; label: string; type: "text" | "number" | "checkbox"; value: string | boolean };
  type A = { type: "add"; fieldType: Field["type"] } | { type: "update"; id: number; value: string | boolean } | { type: "remove"; id: number };
  const [fields, dispatch] = useReducer((s: Field[], a: A): Field[] => {
    if (a.type === "add")    return [...s, { id: Date.now(), label: `Field ${s.length + 1}`, type: a.fieldType, value: a.fieldType === "checkbox" ? false : "" }];
    if (a.type === "update") return s.map((f) => f.id === a.id ? { ...f, value: a.value } : f);
    if (a.type === "remove") return s.filter((f) => f.id !== a.id);
    return s;
  }, []);
  return (
    <div>
      <div style={{ display: "flex", gap: 4 }}>
        <button onClick={() => dispatch({ type: "add", fieldType: "text" })}>+ Text</button>
        <button onClick={() => dispatch({ type: "add", fieldType: "number" })}>+ Number</button>
        <button onClick={() => dispatch({ type: "add", fieldType: "checkbox" })}>+ Checkbox</button>
      </div>
      {fields.map((f) => (
        <div key={f.id} style={{ marginTop: 4 }}>
          <label>{f.label}:
            {f.type === "checkbox"
              ? <input type="checkbox" checked={f.value as boolean} onChange={(e) => dispatch({ type: "update", id: f.id, value: e.target.checked })} />
              : <input type={f.type} value={f.value as string} onChange={(e) => dispatch({ type: "update", id: f.id, value: e.target.value })} />}
          </label>
          <button onClick={() => dispatch({ type: "remove", id: f.id })}>✕</button>
        </div>
      ))}
      <pre style={{ fontSize: 11, marginTop: 8 }}>{JSON.stringify(fields.map((f) => ({ [f.label]: f.value })), null, 2)}</pre>
    </div>
  );
}

function Ex31_CommentsReducer() {
  type Comment = { id: number; text: string; likes: number; replies: { id: number; text: string }[] };
  type A = { type: "add"; text: string } | { type: "like"; id: number } | { type: "reply"; id: number; text: string };
  const [comments, dispatch] = useReducer((s: Comment[], a: A): Comment[] => {
    if (a.type === "add")   return [...s, { id: Date.now(), text: a.text, likes: 0, replies: [] }];
    if (a.type === "like")  return s.map((c) => c.id === a.id ? { ...c, likes: c.likes + 1 } : c);
    if (a.type === "reply") return s.map((c) => c.id === a.id ? { ...c, replies: [...c.replies, { id: Date.now(), text: a.text }] } : c);
    return s;
  }, [{ id: 1, text: "Great post!", likes: 0, replies: [] }]);
  const [inp, setInp] = useState("");
  const [replyInp, setReplyInp] = useState<Record<number, string>>({});
  return (
    <div>
      <div><input value={inp} onChange={(e) => setInp(e.target.value)} /><button onClick={() => { dispatch({ type: "add", text: inp }); setInp(""); }}>Comment</button></div>
      {comments.map((c) => (
        <div key={c.id} style={{ marginTop: 8, borderLeft: "2px solid #ccc", paddingLeft: 8 }}>
          <p>{c.text} <button onClick={() => dispatch({ type: "like", id: c.id })}>❤️ {c.likes}</button></p>
          <ul>{c.replies.map((r) => <li key={r.id}>↳ {r.text}</li>)}</ul>
          <input value={replyInp[c.id] ?? ""} onChange={(e) => setReplyInp({ ...replyInp, [c.id]: e.target.value })} placeholder="Reply..." style={{ fontSize: 12 }} />
          <button onClick={() => { dispatch({ type: "reply", id: c.id, text: replyInp[c.id] ?? "" }); setReplyInp({ ...replyInp, [c.id]: "" }); }}>Reply</button>
        </div>
      ))}
    </div>
  );
}

function Ex32_MatrixReducer() {
  type A = { type: "toggle"; r: number; c: number } | { type: "fill"; color: string } | { type: "clear" };
  const SIZE = 4;
  const [grid, dispatch] = useReducer((s: string[][], a: A): string[][] => {
    if (a.type === "toggle") return s.map((row, r) => row.map((cell, c) => r === a.r && c === a.c ? (cell ? "" : "#4f46e5") : cell));
    if (a.type === "fill")   return s.map((row) => row.map(() => a.color));
    if (a.type === "clear")  return Array.from({ length: SIZE }, () => Array(SIZE).fill(""));
    return s;
  }, Array.from({ length: SIZE }, () => Array(SIZE).fill("")));
  return (
    <div>
      <button onClick={() => dispatch({ type: "fill", color: "#4f46e5" })}>Fill</button>
      <button onClick={() => dispatch({ type: "clear" })}>Clear</button>
      <table><tbody>
        {grid.map((row, r) => (
          <tr key={r}>{row.map((cell, c) => (
            <td key={c} onClick={() => dispatch({ type: "toggle", r, c })}
              style={{ width: 30, height: 30, background: cell || "#eee", border: "1px solid #ccc", cursor: "pointer" }} />
          ))}</tr>
        ))}
      </tbody></table>
    </div>
  );
}

function Ex33_PlaylistReducer() {
  type Song = { id: number; title: string; duration: number };
  type A = { type: "add"; title: string; duration: number } | { type: "remove"; id: number } | { type: "move"; from: number; to: number } | { type: "shuffle" };
  const [songs, dispatch] = useReducer((s: Song[], a: A): Song[] => {
    if (a.type === "add")    return [...s, { id: Date.now(), title: a.title, duration: a.duration }];
    if (a.type === "remove") return s.filter((sg) => sg.id !== a.id);
    if (a.type === "move")   { const next = [...s]; const [m] = next.splice(a.from, 1); next.splice(a.to, 0, m); return next; }
    if (a.type === "shuffle") return [...s].sort(() => Math.random() - 0.5);
    return s;
  }, [{ id: 1, title: "Song A", duration: 180 }, { id: 2, title: "Song B", duration: 240 }]);
  const total = songs.reduce((s, sg) => s + sg.duration, 0);
  return (
    <div>
      <button onClick={() => dispatch({ type: "add", title: `Song ${songs.length + 1}`, duration: Math.floor(Math.random() * 300) + 60 })}>Add song</button>
      <button onClick={() => dispatch({ type: "shuffle" })}>Shuffle 🔀</button>
      <p>Total: {Math.floor(total / 60)}:{String(total % 60).padStart(2, "0")}</p>
      <ol>{songs.map((sg, i) => (
        <li key={sg.id}>{sg.title} ({sg.duration}s)
          <button disabled={i === 0} onClick={() => dispatch({ type: "move", from: i, to: i - 1 })}>↑</button>
          <button disabled={i === songs.length - 1} onClick={() => dispatch({ type: "move", from: i, to: i + 1 })}>↓</button>
          <button onClick={() => dispatch({ type: "remove", id: sg.id })}>✕</button>
        </li>
      ))}</ol>
    </div>
  );
}

function Ex34_ConfigPanel() {
  type S = { ui: { sidebar: boolean; header: boolean; footer: boolean }; features: { analytics: boolean; notifications: boolean; darkMode: boolean }; api: { url: string; timeout: number } };
  type A = { type: "toggleUI"; key: keyof S["ui"] } | { type: "toggleFeature"; key: keyof S["features"] } | { type: "setApi"; field: keyof S["api"]; value: string | number };
  const [config, dispatch] = useReducer((s: S, a: A): S => {
    if (a.type === "toggleUI")      return { ...s, ui: { ...s.ui, [a.key]: !s.ui[a.key] } };
    if (a.type === "toggleFeature") return { ...s, features: { ...s.features, [a.key]: !s.features[a.key] } };
    if (a.type === "setApi")        return { ...s, api: { ...s.api, [a.field]: a.value } };
    return s;
  }, { ui: { sidebar: true, header: true, footer: false }, features: { analytics: false, notifications: true, darkMode: false }, api: { url: "https://api.example.com", timeout: 5000 } });
  return (
    <div style={{ fontSize: 13 }}>
      <b>UI:</b> {(Object.keys(config.ui) as Array<keyof S["ui"]>).map((k) => <label key={k} style={{ marginRight: 8 }}><input type="checkbox" checked={config.ui[k]} onChange={() => dispatch({ type: "toggleUI", key: k })} /> {k}</label>)}<br />
      <b>Features:</b> {(Object.keys(config.features) as Array<keyof S["features"]>).map((k) => <label key={k} style={{ marginRight: 8 }}><input type="checkbox" checked={config.features[k]} onChange={() => dispatch({ type: "toggleFeature", key: k })} /> {k}</label>)}<br />
      <b>API URL:</b> <input value={config.api.url} onChange={(e) => dispatch({ type: "setApi", field: "url", value: e.target.value })} style={{ width: 200 }} />
    </div>
  );
}

function Ex35_InvoiceReducer() {
  type LineItem = { id: number; description: string; qty: number; price: number };
  type A = { type: "addLine" } | { type: "updateLine"; id: number; field: keyof LineItem; value: string | number } | { type: "removeLine"; id: number };
  const [lines, dispatch] = useReducer((s: LineItem[], a: A): LineItem[] => {
    if (a.type === "addLine")    return [...s, { id: Date.now(), description: "Item", qty: 1, price: 0 }];
    if (a.type === "updateLine") return s.map((l) => l.id === a.id ? { ...l, [a.field]: a.value } : l);
    if (a.type === "removeLine") return s.filter((l) => l.id !== a.id);
    return s;
  }, []);
  const total = lines.reduce((s, l) => s + l.qty * l.price, 0);
  return (
    <div>
      <button onClick={() => dispatch({ type: "addLine" })}>+ Add line</button>
      <table><tbody>
        <tr><th>Description</th><th>Qty</th><th>Price</th><th>Total</th><th></th></tr>
        {lines.map((l) => (
          <tr key={l.id}>
            <td><input value={l.description} onChange={(e) => dispatch({ type: "updateLine", id: l.id, field: "description", value: e.target.value })} /></td>
            <td><input type="number" value={l.qty} style={{ width: 50 }} onChange={(e) => dispatch({ type: "updateLine", id: l.id, field: "qty", value: +e.target.value })} /></td>
            <td><input type="number" value={l.price} style={{ width: 70 }} onChange={(e) => dispatch({ type: "updateLine", id: l.id, field: "price", value: +e.target.value })} /></td>
            <td>${(l.qty * l.price).toFixed(2)}</td>
            <td><button onClick={() => dispatch({ type: "removeLine", id: l.id })}>✕</button></td>
          </tr>
        ))}
      </tbody></table>
      <p><b>Total: ${total.toFixed(2)}</b></p>
    </div>
  );
}

function Ex36_VideoPlayerReducer() {
  type S = { playing: boolean; volume: number; time: number; speed: number; muted: boolean };
  type A = { type: "play" } | { type: "pause" } | { type: "seek"; time: number } | { type: "setVolume"; vol: number } | { type: "setSpeed"; speed: number } | { type: "toggleMute" };
  const [s, dispatch] = useReducer((state: S, action: A): S => {
    if (action.type === "play")       return { ...state, playing: true };
    if (action.type === "pause")      return { ...state, playing: false };
    if (action.type === "seek")       return { ...state, time: action.time };
    if (action.type === "setVolume")  return { ...state, volume: action.vol };
    if (action.type === "setSpeed")   return { ...state, speed: action.speed };
    if (action.type === "toggleMute") return { ...state, muted: !state.muted };
    return state;
  }, { playing: false, volume: 80, time: 0, speed: 1, muted: false });
  return (
    <div style={{ border: "1px solid #ccc", padding: 12 }}>
      <div style={{ background: "#000", height: 80, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>{s.playing ? "▶ Playing..." : "⏸ Paused"}</div>
      <input type="range" min="0" max="120" value={s.time} onChange={(e) => dispatch({ type: "seek", time: +e.target.value })} style={{ width: "100%" }} />
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
        <button onClick={() => dispatch({ type: s.playing ? "pause" : "play" })}>{s.playing ? "⏸" : "▶"}</button>
        <button onClick={() => dispatch({ type: "toggleMute" })}>{s.muted ? "🔇" : "🔊"}</button>
        <input type="range" min="0" max="100" value={s.volume} onChange={(e) => dispatch({ type: "setVolume", vol: +e.target.value })} style={{ width: 80 }} />
        <select value={s.speed} onChange={(e) => dispatch({ type: "setSpeed", speed: +e.target.value })}>
          {[0.5, 1, 1.5, 2].map((sp) => <option key={sp} value={sp}>{sp}x</option>)}
        </select>
      </div>
    </div>
  );
}

function Ex37_SurveyReducer() {
  type Q = { id: number; text: string; options: string[] };
  type S = { answers: Record<number, string>; step: number; submitted: boolean };
  type A = { type: "answer"; qId: number; val: string } | { type: "next" } | { type: "prev" } | { type: "submit" };
  const questions: Q[] = [
    { id: 1, text: "How did you hear about us?", options: ["Google", "Friend", "Social media"] },
    { id: 2, text: "How satisfied are you?", options: ["Very", "Somewhat", "Not at all"] },
    { id: 3, text: "Would you recommend us?", options: ["Yes", "Maybe", "No"] },
  ];
  const [s, dispatch] = useReducer((state: S, action: A): S => {
    if (action.type === "answer") return { ...state, answers: { ...state.answers, [action.qId]: action.val } };
    if (action.type === "next")   return { ...state, step: Math.min(state.step + 1, questions.length - 1) };
    if (action.type === "prev")   return { ...state, step: Math.max(state.step - 1, 0) };
    if (action.type === "submit") return { ...state, submitted: true };
    return state;
  }, { answers: {}, step: 0, submitted: false });
  if (s.submitted) return <div><p>✅ Survey submitted!</p><pre>{JSON.stringify(s.answers, null, 2)}</pre></div>;
  const q = questions[s.step];
  return (
    <div>
      <p>Q{s.step + 1}/{questions.length}: {q.text}</p>
      {q.options.map((o) => <label key={o} style={{ display: "block" }}><input type="radio" value={o} checked={s.answers[q.id] === o} onChange={() => dispatch({ type: "answer", qId: q.id, val: o })} /> {o}</label>)}
      <div style={{ marginTop: 8 }}>
        <button disabled={s.step === 0} onClick={() => dispatch({ type: "prev" })}>Back</button>
        {s.step < questions.length - 1
          ? <button onClick={() => dispatch({ type: "next" })}>Next</button>
          : <button onClick={() => dispatch({ type: "submit" })}>Submit</button>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// ADVANCED (38–50)
// ─────────────────────────────────────────

function Ex38_Middleware() {
  type A = { type: string; payload?: unknown };
  const logger = (reducer: (s: number, a: A) => number) => (state: number, action: A) => {
    const next = reducer(state, action);
    console.log(`[${action.type}] ${state} → ${next}`);
    return next;
  };
  const baseReducer = (s: number, a: A) => a.type === "INC" ? s + 1 : a.type === "DEC" ? s - 1 : s;
  const [count, dispatch] = useReducer(logger(baseReducer), 0);
  return <div><p>Count: {count} (check console)</p><button onClick={() => dispatch({ type: "INC" })}>+</button><button onClick={() => dispatch({ type: "DEC" })}>–</button></div>;
}

function Ex39_ImmerLikeReducer() {
  // Manual immutable nested update (Immer-style thinking)
  type S = { profile: { name: string; address: { city: string; zip: string } }; active: boolean };
  type A = { type: "setCity"; city: string } | { type: "setName"; name: string } | { type: "toggle" };
  const [s, dispatch] = useReducer((state: S, action: A): S => {
    if (action.type === "setCity") return { ...state, profile: { ...state.profile, address: { ...state.profile.address, city: action.city } } };
    if (action.type === "setName") return { ...state, profile: { ...state.profile, name: action.name } };
    if (action.type === "toggle")  return { ...state, active: !state.active };
    return state;
  }, { profile: { name: "", address: { city: "", zip: "" } }, active: true });
  return (
    <div>
      <input placeholder="Name" value={s.profile.name} onChange={(e) => dispatch({ type: "setName", name: e.target.value })} />
      <input placeholder="City" value={s.profile.address.city} onChange={(e) => dispatch({ type: "setCity", city: e.target.value })} />
      <label><input type="checkbox" checked={s.active} onChange={() => dispatch({ type: "toggle" })} /> Active</label>
      <pre style={{ fontSize: 11 }}>{JSON.stringify(s, null, 2)}</pre>
    </div>
  );
}

function Ex40_NormalizedState() {
  type User = { id: number; name: string; age: number };
  type S = { byId: Record<number, User>; allIds: number[] };
  type A = { type: "add"; user: User } | { type: "update"; id: number; changes: Partial<User> } | { type: "remove"; id: number };
  const [s, dispatch] = useReducer((state: S, action: A): S => {
    if (action.type === "add")    return { byId: { ...state.byId, [action.user.id]: action.user }, allIds: [...state.allIds, action.user.id] };
    if (action.type === "update") return { ...state, byId: { ...state.byId, [action.id]: { ...state.byId[action.id], ...action.changes } } };
    if (action.type === "remove") return { byId: Object.fromEntries(Object.entries(state.byId).filter(([id]) => +id !== action.id)), allIds: state.allIds.filter((id) => id !== action.id) };
    return state;
  }, { byId: { 1: { id: 1, name: "Alice", age: 25 } }, allIds: [1] });
  const nextId = Math.max(0, ...s.allIds) + 1;
  return (
    <div>
      <button onClick={() => dispatch({ type: "add", user: { id: nextId, name: `User${nextId}`, age: 20 + nextId } })}>Add user</button>
      <ul>{s.allIds.map((id) => <li key={id}>{s.byId[id].name} (age: {s.byId[id].age})<button onClick={() => dispatch({ type: "update", id, changes: { age: s.byId[id].age + 1 } })}>+age</button><button onClick={() => dispatch({ type: "remove", id })}>✕</button></li>)}</ul>
    </div>
  );
}

function Ex41_CommandPattern() {
  type Cmd = { execute: (s: number) => number; undo: (s: number) => number; desc: string };
  type S = { value: number; history: Cmd[] };
  type A = { type: "execute"; cmd: Cmd } | { type: "undo" };
  const [s, dispatch] = useReducer((state: S, action: A): S => {
    if (action.type === "execute") return { value: action.cmd.execute(state.value), history: [...state.history, action.cmd] };
    if (action.type === "undo")    { const prev = state.history.slice(0, -1); const last = state.history[state.history.length - 1]; return { value: last?.undo(state.value) ?? state.value, history: prev }; }
    return state;
  }, { value: 0, history: [] });
  const commands: Cmd[] = [
    { execute: (v) => v + 10, undo: (v) => v - 10, desc: "+10" },
    { execute: (v) => v * 2,  undo: (v) => v / 2,  desc: "×2"  },
    { execute: (v) => v - 5,  undo: (v) => v + 5,  desc: "-5"  },
  ];
  return (
    <div>
      <p>Value: {s.value}</p>
      {commands.map((cmd) => <button key={cmd.desc} onClick={() => dispatch({ type: "execute", cmd })}>{cmd.desc}</button>)}
      <button onClick={() => dispatch({ type: "undo" })} disabled={!s.history.length}>Undo</button>
      <p>History: {s.history.map((c) => c.desc).join(" → ")}</p>
    </div>
  );
}

function Ex42_EventSourcing() {
  type Event = { type: string; timestamp: number; payload: unknown };
  type S = { events: Event[]; state: { count: number; name: string } };
  type A = { type: "emit"; event: Event };
  const [s, dispatch] = useReducer((state: S, action: A): S => {
    const events = [...state.events, action.event];
    const computedState = events.reduce((acc, e) => {
      if (e.type === "INCREMENT") return { ...acc, count: acc.count + 1 };
      if (e.type === "SET_NAME")  return { ...acc, name: e.payload as string };
      return acc;
    }, { count: 0, name: "" });
    return { events, state: computedState };
  }, { events: [], state: { count: 0, name: "" } });
  const emit = (type: string, payload?: unknown) => dispatch({ type: "emit", event: { type, timestamp: Date.now(), payload } });
  return (
    <div>
      <button onClick={() => emit("INCREMENT")}>Increment</button>
      <button onClick={() => emit("SET_NAME", `User${Date.now() % 100}`)}>Set name</button>
      <p>Count: {s.state.count} | Name: {s.state.name}</p>
      <p>Events: {s.events.length}</p>
    </div>
  );
}

function Ex43_FiniteStateMachine() {
  type State = "idle" | "loading" | "success" | "error";
  type Event = "FETCH" | "RESOLVE" | "REJECT" | "RESET";
  const transitions: Record<State, Partial<Record<Event, State>>> = {
    idle:    { FETCH: "loading" },
    loading: { RESOLVE: "success", REJECT: "error" },
    success: { RESET: "idle" },
    error:   { RESET: "idle", FETCH: "loading" },
  };
  const [state, dispatch] = useReducer((current: State, event: Event): State =>
    transitions[current][event] ?? current, "idle");
  const bg: Record<State, string> = { idle: "#e5e7eb", loading: "#fef3c7", success: "#d1fae5", error: "#fee2e2" };
  return (
    <div>
      <div style={{ padding: 12, background: bg[state], borderRadius: 8 }}>State: {state}</div>
      <div style={{ marginTop: 8, display: "flex", gap: 4 }}>
        {(["FETCH", "RESOLVE", "REJECT", "RESET"] as Event[]).map((e) => (
          <button key={e} onClick={() => dispatch(e)} disabled={!transitions[state][e]}>{e}</button>
        ))}
      </div>
    </div>
  );
}

function Ex44_OptimisticUI() {
  type Item = { id: number; text: string; status: "saved" | "saving" | "error" };
  type A = { type: "add"; text: string } | { type: "confirm"; id: number } | { type: "fail"; id: number };
  const [items, dispatch] = useReducer((s: Item[], a: A): Item[] => {
    if (a.type === "add")     return [...s, { id: Date.now(), text: a.text, status: "saving" }];
    if (a.type === "confirm") return s.map((i) => i.id === a.id ? { ...i, status: "saved" } : i);
    if (a.type === "fail")    return s.map((i) => i.id === a.id ? { ...i, status: "error" } : i);
    return s;
  }, []);
  const [inp, setInp] = useState("");
  const add = () => {
    const id = Date.now();
    dispatch({ type: "add", text: inp });
    setInp("");
    setTimeout(() => dispatch({ type: "confirm", id }), 1000);
  };
  const colors: Record<string, string> = { saving: "#fef3c7", saved: "#d1fae5", error: "#fee2e2" };
  return (
    <div>
      <input value={inp} onChange={(e) => setInp(e.target.value)} /><button onClick={add}>Add (optimistic)</button>
      <ul>{items.map((i) => <li key={i.id} style={{ background: colors[i.status], padding: 4, marginTop: 2 }}>{i.text} ({i.status})</li>)}</ul>
    </div>
  );
}

function Ex45_CompoundReducer() {
  // Combine multiple reducers into one
  type CountS = { count: number };
  type TextS = { text: string };
  type AppS = { counter: CountS; text: TextS };
  type A = { type: "INC" } | { type: "DEC" } | { type: "SET_TEXT"; val: string };
  const counterReducer = (s: CountS, a: A): CountS => a.type === "INC" ? { count: s.count + 1 } : a.type === "DEC" ? { count: s.count - 1 } : s;
  const textReducer = (s: TextS, a: A): TextS => a.type === "SET_TEXT" ? { text: a.val } : s;
  const rootReducer = (s: AppS, a: A): AppS => ({ counter: counterReducer(s.counter, a), text: textReducer(s.text, a) });
  const [state, dispatch] = useReducer(rootReducer, { counter: { count: 0 }, text: { text: "" } });
  return (
    <div>
      <p>Count: {state.counter.count}</p>
      <button onClick={() => dispatch({ type: "INC" })}>+</button>
      <button onClick={() => dispatch({ type: "DEC" })}>–</button>
      <input value={state.text.text} onChange={(e) => dispatch({ type: "SET_TEXT", val: e.target.value })} placeholder="Text state" />
      <p>Text: {state.text.text}</p>
    </div>
  );
}

function Ex46_LazyInit() {
  type S = { items: string[]; filter: string };
  type A = { type: "add"; item: string } | { type: "setFilter"; val: string };
  const [s, dispatch] = useReducer(
    (state: S, action: A): S => {
      if (action.type === "add") return { ...state, items: [...state.items, action.item] };
      if (action.type === "setFilter") return { ...state, filter: action.val };
      return state;
    },
    undefined,
    () => {
      // Lazy initialization — compute initial state once
      const saved = JSON.parse(localStorage.getItem("ex46") ?? "null");
      return saved ?? { items: ["Default item"], filter: "" };
    }
  );
  const [inp, setInp] = useState("");
  return (
    <div>
      <input value={inp} onChange={(e) => setInp(e.target.value)} /><button onClick={() => { dispatch({ type: "add", item: inp }); setInp(""); }}>Add</button>
      <input value={s.filter} onChange={(e) => dispatch({ type: "setFilter", val: e.target.value })} placeholder="Filter" />
      <ul>{s.items.filter((i) => i.includes(s.filter)).map((i, idx) => <li key={idx}>{i}</li>)}</ul>
    </div>
  );
}

function Ex47_DevtoolsReducer() {
  type A = { type: string; payload?: unknown };
  const withLogger = (reducer: (s: number, a: A) => number) => (state: number, action: A) => {
    const next = reducer(state, action);
    console.group(`%c${action.type}`, "color: #4f46e5");
    console.log("Previous:", state); console.log("Action:", action); console.log("Next:", next);
    console.groupEnd();
    return next;
  };
  const [count, dispatch] = useReducer(
    withLogger((s: number, a: A) => a.type === "INC" ? s + 1 : a.type === "DEC" ? s - 1 : s),
    0
  );
  return <div><p>Count: {count} (open DevTools console)</p><button onClick={() => dispatch({ type: "INC" })}>+</button><button onClick={() => dispatch({ type: "DEC" })}>–</button></div>;
}

function Ex48_ActionCreators() {
  type A = { type: "SET_NAME"; name: string } | { type: "SET_AGE"; age: number } | { type: "RESET" };
  // Action creators — functions that return action objects
  const actions = {
    setName: (name: string): A => ({ type: "SET_NAME", name }),
    setAge: (age: number): A => ({ type: "SET_AGE", age }),
    reset: (): A => ({ type: "RESET" }),
  };
  const [s, dispatch] = useReducer((state: { name: string; age: number }, action: A) => {
    if (action.type === "SET_NAME") return { ...state, name: action.name };
    if (action.type === "SET_AGE")  return { ...state, age: action.age };
    return { name: "", age: 0 };
  }, { name: "", age: 0 });
  return (
    <div>
      <input value={s.name} onChange={(e) => dispatch(actions.setName(e.target.value))} placeholder="Name" />
      <input type="number" value={s.age} onChange={(e) => dispatch(actions.setAge(+e.target.value))} />
      <button onClick={() => dispatch(actions.reset())}>Reset</button>
      <p>{s.name}, {s.age}</p>
    </div>
  );
}

function Ex49_ReducerWithRef() {
  // useRef stores mutable "outside" state; reducer handles pure state updates
  type A = { type: "start" } | { type: "stop" } | { type: "reset" };
  type S = { running: boolean; elapsed: number };
  const [s, dispatch] = useReducer((state: S, action: A): S => {
    if (action.type === "start") return { ...state, running: true };
    if (action.type === "stop")  return { ...state, running: false };
    return { running: false, elapsed: 0 };
  }, { running: false, elapsed: 0 });
  const startTime = useRef(0);
  const [display, setDisplay] = useState(0);
  useState(() => {
    if (!s.running) return;
    startTime.current = Date.now();
    const id = setInterval(() => setDisplay(Date.now() - startTime.current), 100);
    return () => clearInterval(id);
  });
  return (
    <div>
      <p>{(display / 1000).toFixed(1)}s</p>
      <button onClick={() => dispatch({ type: s.running ? "stop" : "start" })}>{s.running ? "Stop" : "Start"}</button>
      <button onClick={() => { dispatch({ type: "reset" }); setDisplay(0); }}>Reset</button>
    </div>
  );
}

function Ex50_FullAppReducer() {
  type User = { id: number; name: string };
  type Product = { id: number; name: string; price: number };
  type CartItem = { product: Product; qty: number };
  type AppS = { user: User | null; cart: CartItem[]; ui: { loading: boolean; modal: boolean } };
  type AppA =
    | { type: "LOGIN"; user: User }
    | { type: "LOGOUT" }
    | { type: "ADD_TO_CART"; product: Product }
    | { type: "REMOVE_FROM_CART"; id: number }
    | { type: "SET_LOADING"; val: boolean }
    | { type: "TOGGLE_MODAL" };
  const [s, dispatch] = useReducer((state: AppS, action: AppA): AppS => {
    switch (action.type) {
      case "LOGIN":         return { ...state, user: action.user };
      case "LOGOUT":        return { ...state, user: null, cart: [] };
      case "ADD_TO_CART": {
        const idx = state.cart.findIndex((i) => i.product.id === action.product.id);
        if (idx >= 0) { const cart = [...state.cart]; cart[idx] = { ...cart[idx], qty: cart[idx].qty + 1 }; return { ...state, cart }; }
        return { ...state, cart: [...state.cart, { product: action.product, qty: 1 }] };
      }
      case "REMOVE_FROM_CART": return { ...state, cart: state.cart.filter((i) => i.product.id !== action.id) };
      case "SET_LOADING":   return { ...state, ui: { ...state.ui, loading: action.val } };
      case "TOGGLE_MODAL":  return { ...state, ui: { ...state.ui, modal: !state.ui.modal } };
      default: return state;
    }
  }, { user: null, cart: [], ui: { loading: false, modal: false } });
  const products: Product[] = [{ id: 1, name: "Shoes", price: 50 }, { id: 2, name: "Hat", price: 20 }];
  const total = s.cart.reduce((sum, i) => sum + i.product.price * i.qty, 0);
  return (
    <div style={{ border: "1px solid #ddd", padding: 12 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        {s.user ? <><span>👤 {s.user.name}</span><button onClick={() => dispatch({ type: "LOGOUT" })}>Logout</button></> : <button onClick={() => dispatch({ type: "LOGIN", user: { id: 1, name: "Ajay" } })}>Login</button>}
        <button onClick={() => dispatch({ type: "TOGGLE_MODAL" })}>🛒 Cart ({s.cart.length}) ${total}</button>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {products.map((p) => <button key={p.id} onClick={() => dispatch({ type: "ADD_TO_CART", product: p })}>{p.name} ${p.price}</button>)}
      </div>
      {s.ui.modal && (
        <div style={{ marginTop: 8, border: "1px solid #ccc", padding: 8 }}>
          <b>Cart</b>
          {s.cart.map((i) => <p key={i.product.id}>{i.product.name} x{i.qty} <button onClick={() => dispatch({ type: "REMOVE_FROM_CART", id: i.product.id })}>✕</button></p>)}
          <b>Total: ${total}</b>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────

const examples: { label: string; component: JSX.Element }[] = [
  { label: "01 [Basic] Simple Counter",            component: <Ex01_SimpleCounter /> },
  { label: "02 [Basic] Toggle",                    component: <Ex02_Toggle /> },
  { label: "03 [Basic] Action Types (switch)",     component: <Ex03_ActionTypes /> },
  { label: "04 [Basic] String State",              component: <Ex04_StringState /> },
  { label: "05 [Basic] Boolean Flags",             component: <Ex05_BooleanFlags /> },
  { label: "06 [Basic] Counter with Step",         component: <Ex06_CounterWithStep /> },
  { label: "07 [Basic] Fetch Status",              component: <Ex07_FetchStatus /> },
  { label: "08 [Basic] Light Switch",              component: <Ex08_LightSwitch /> },
  { label: "09 [Basic] Tab State",                 component: <Ex09_TabState /> },
  { label: "10 [Basic] Modal State",               component: <Ex10_ModalState /> },
  { label: "11 [Basic] Visibility Map",            component: <Ex11_VisibilityMap /> },
  { label: "12 [Basic] Password Strength",         component: <Ex12_PasswordStrength /> },
  { label: "13 [Intermediate] Todo List",          component: <Ex13_TodoList /> },
  { label: "14 [Intermediate] Form + Validation",  component: <Ex14_FormReducer /> },
  { label: "15 [Intermediate] Shopping Cart",      component: <Ex15_ShoppingCart /> },
  { label: "16 [Intermediate] Auth Reducer",       component: <Ex16_AuthReducer /> },
  { label: "17 [Intermediate] Undo/Redo",          component: <Ex17_UndoRedo /> },
  { label: "18 [Intermediate] Notifications",      component: <Ex18_NotificationList /> },
  { label: "19 [Intermediate] Pagination",         component: <Ex19_Pagination /> },
  { label: "20 [Intermediate] Filter + Sort",      component: <Ex20_FilterSort /> },
  { label: "21 [Intermediate] Accordion",          component: <Ex21_AccordionReducer /> },
  { label: "22 [Intermediate] Step Wizard",        component: <Ex22_StepWizard /> },
  { label: "23 [Intermediate] Dice Game",          component: <Ex23_DiceGame /> },
  { label: "24 [Intermediate] Multi-Tab",          component: <Ex24_MultiTabReducer /> },
  { label: "25 [Intermediate] Bank Account",       component: <Ex25_BankAccount /> },
  { label: "26 [Nested] Nested Object",            component: <Ex26_NestedObjectReducer /> },
  { label: "27 [Nested] Todo + Subtasks",          component: <Ex27_TodoWithSubtasks /> },
  { label: "28 [Nested] Kanban Board",             component: <Ex28_KanbanReducer /> },
  { label: "29 [Nested] Tree Reducer",             component: <Ex29_TreeReducer /> },
  { label: "30 [Nested] Form Builder",             component: <Ex30_FormBuilderReducer /> },
  { label: "31 [Nested] Comments + Replies",       component: <Ex31_CommentsReducer /> },
  { label: "32 [Nested] Matrix / Grid",            component: <Ex32_MatrixReducer /> },
  { label: "33 [Nested] Playlist",                 component: <Ex33_PlaylistReducer /> },
  { label: "34 [Nested] Config Panel",             component: <Ex34_ConfigPanel /> },
  { label: "35 [Nested] Invoice Builder",          component: <Ex35_InvoiceReducer /> },
  { label: "36 [Nested] Video Player",             component: <Ex36_VideoPlayerReducer /> },
  { label: "37 [Nested] Survey Wizard",            component: <Ex37_SurveyReducer /> },
  { label: "38 [Advanced] Middleware (Logger)",    component: <Ex38_Middleware /> },
  { label: "39 [Advanced] Immer-Like Nested",      component: <Ex39_ImmerLikeReducer /> },
  { label: "40 [Advanced] Normalized State",       component: <Ex40_NormalizedState /> },
  { label: "41 [Advanced] Command Pattern",        component: <Ex41_CommandPattern /> },
  { label: "42 [Advanced] Event Sourcing",         component: <Ex42_EventSourcing /> },
  { label: "43 [Advanced] Finite State Machine",   component: <Ex43_FiniteStateMachine /> },
  { label: "44 [Advanced] Optimistic UI",          component: <Ex44_OptimisticUI /> },
  { label: "45 [Advanced] Compound Reducer",       component: <Ex45_CompoundReducer /> },
  { label: "46 [Advanced] Lazy Initialization",    component: <Ex46_LazyInit /> },
  { label: "47 [Advanced] DevTools Logger",        component: <Ex47_DevtoolsReducer /> },
  { label: "48 [Advanced] Action Creators",        component: <Ex48_ActionCreators /> },
  { label: "49 [Advanced] Reducer + useRef",       component: <Ex49_ReducerWithRef /> },
  { label: "50 [Advanced] Full App Reducer",       component: <Ex50_FullAppReducer /> },
];

export default function UseReducerExamples() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: 24 }}>
      <h1>50 useReducer Examples — Basic · Intermediate · Nested · Advanced</h1>
      {examples.map(({ label, component }) => (
        <section key={label} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <h2 style={{ marginTop: 0, fontSize: 14, color: "#555" }}>{label}</h2>
          {component}
        </section>
      ))}
    </div>
  );
}
