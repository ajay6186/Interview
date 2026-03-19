import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  configureStore,
  createSlice,
  createAction,
  createReducer,
  PayloadAction,
  isAction,
  createEntityAdapter,
} from "@reduxjs/toolkit";
import { Provider, useSelector, useDispatch } from "react-redux";

// ─── BASIC 1–12 ────────────────────────────────────────────────────────────────

// 1. createAction basic
const increment01 = createAction("ex01/increment");
const slice01 = createSlice({ name: "ex01", initialState: 0, reducers: {}, extraReducers: (b) => b.addCase(increment01, (s) => s + 1) });
const store01 = configureStore({ reducer: slice01.reducer });
function Ex01_Name() { return <Provider store={store01}><Ex01_Inner /></Provider>; }
function Ex01_Inner() {
  const n = useSelector((s: ReturnType<typeof store01.getState>) => s);
  const d = useDispatch();
  return <div><p>Count: {n}</p><p style={{ fontSize: 11 }}>Action type: "{increment01.type}"</p><button onClick={() => d(increment01())}>Dispatch increment</button></div>;
}

// 2. Action with payload
const addAmount02 = createAction<number>("ex02/addAmount");
const slice02 = createSlice({ name: "ex02", initialState: 0, reducers: {}, extraReducers: (b) => b.addCase(addAmount02, (s, a) => s + a.payload) });
const store02 = configureStore({ reducer: slice02.reducer });
function Ex02_Name() { return <Provider store={store02}><Ex02_Inner /></Provider>; }
function Ex02_Inner() {
  const n = useSelector((s: ReturnType<typeof store02.getState>) => s);
  const d = useDispatch();
  const [v, setV] = useState(5);
  return <div><p>Total: {n}</p><input type="number" value={v} onChange={e => setV(Number(e.target.value))} style={{ width: 60 }} /><button onClick={() => d(addAmount02(v))}>Add {v}</button></div>;
}

// 3. Action with prepare callback
const loggedAction03 = createAction("ex03/logged", (msg: string) => ({ payload: { msg, timestamp: new Date().toISOString() } }));
const slice03 = createSlice({ name: "ex03", initialState: [] as { msg: string; timestamp: string }[], reducers: {}, extraReducers: (b) => b.addCase(loggedAction03, (s, a) => { s.push(a.payload); }) });
const store03 = configureStore({ reducer: slice03.reducer });
function Ex03_Name() { return <Provider store={store03}><Ex03_Inner /></Provider>; }
function Ex03_Inner() {
  const log = useSelector((s: ReturnType<typeof store03.getState>) => s);
  const d = useDispatch();
  const [v, setV] = useState("Hello");
  return <div><input value={v} onChange={e => setV(e.target.value)} /><button onClick={() => d(loggedAction03(v))}>Log Action</button><ul style={{ fontSize: 11 }}>{log.map((l, i) => <li key={i}>{l.msg} @ {l.timestamp.slice(11, 19)}</li>)}</ul></div>;
}

// 4. Multiple action creators
const inc04 = createAction("ex04/inc");
const dec04 = createAction("ex04/dec");
const reset04 = createAction("ex04/reset");
const double04 = createAction("ex04/double");
const slice04 = createSlice({ name: "ex04", initialState: 1, reducers: {}, extraReducers: (b) => b.addCase(inc04, s => s + 1).addCase(dec04, s => s - 1).addCase(reset04, () => 1).addCase(double04, s => s * 2) });
const store04 = configureStore({ reducer: slice04.reducer });
function Ex04_Name() { return <Provider store={store04}><Ex04_Inner /></Provider>; }
function Ex04_Inner() {
  const n = useSelector((s: ReturnType<typeof store04.getState>) => s);
  const d = useDispatch();
  return <div><p>{n}</p><button onClick={() => d(inc04())}>+1</button><button onClick={() => d(dec04())}>-1</button><button onClick={() => d(double04())}>×2</button><button onClick={() => d(reset04())}>Reset</button></div>;
}

// 5. Dispatch from button click
const slice05 = createSlice({ name: "ex05", initialState: { count: 0, lastAction: "" }, reducers: { clicked: (s) => { s.count++; s.lastAction = "button clicked"; }, hovered: (s) => { s.lastAction = "button hovered"; } } });
const store05 = configureStore({ reducer: slice05.reducer });
function Ex05_Name() { return <Provider store={store05}><Ex05_Inner /></Provider>; }
function Ex05_Inner() {
  const { count, lastAction } = useSelector((s: ReturnType<typeof store05.getState>) => s);
  const d = useDispatch();
  return <div><p>Clicks: {count}</p><p>Last: {lastAction}</p><button onClick={() => d(slice05.actions.clicked())} onMouseEnter={() => d(slice05.actions.hovered())}>Click Me</button></div>;
}

// 6. Dispatch from input change
const slice06 = createSlice({ name: "ex06", initialState: { value: "", charCount: 0, wordCount: 0 }, reducers: { change: (s, a: PayloadAction<string>) => { s.value = a.payload; s.charCount = a.payload.length; s.wordCount = a.payload.trim() ? a.payload.trim().split(/\s+/).length : 0; } } });
const store06 = configureStore({ reducer: slice06.reducer });
function Ex06_Name() { return <Provider store={store06}><Ex06_Inner /></Provider>; }
function Ex06_Inner() {
  const { value, charCount, wordCount } = useSelector((s: ReturnType<typeof store06.getState>) => s);
  const d = useDispatch();
  return <div><textarea value={value} onChange={e => d(slice06.actions.change(e.target.value))} rows={3} cols={30} /><p>Chars: {charCount} | Words: {wordCount}</p></div>;
}

// 7. Dispatch on mount (useEffect + dispatch)
const slice07 = createSlice({ name: "ex07", initialState: { loaded: false, data: "" as string }, reducers: { load: (s, a: PayloadAction<string>) => { s.loaded = true; s.data = a.payload; } } });
const store07 = configureStore({ reducer: slice07.reducer });
function Ex07_Name() { return <Provider store={store07}><Ex07_Inner /></Provider>; }
function Ex07_Inner() {
  const { loaded, data } = useSelector((s: ReturnType<typeof store07.getState>) => s);
  const d = useDispatch();
  useEffect(() => { setTimeout(() => d(slice07.actions.load("Data loaded from useEffect!")), 500); }, [d]);
  return <div><p>{loaded ? data : "Loading..."}</p></div>;
}

// 8. Action type string
const myAction08 = createAction<{ id: number; name: string }>("entities/user/created");
const slice08 = createSlice({ name: "ex08", initialState: [] as string[], reducers: {}, extraReducers: (b) => b.addCase(myAction08, (s, a) => { s.push(`Created: ${a.payload.name} (${a.payload.id})`); }) });
const store08 = configureStore({ reducer: slice08.reducer });
function Ex08_Name() { return <Provider store={store08}><Ex08_Inner /></Provider>; }
function Ex08_Inner() {
  const log = useSelector((s: ReturnType<typeof store08.getState>) => s);
  const d = useDispatch();
  const [nextId, setNextId] = useState(1);
  return <div><p>Action type: <code>"{myAction08.type}"</code></p><button onClick={() => { d(myAction08({ id: nextId, name: `User${nextId}` })); setNextId(n => n + 1); }}>Dispatch</button><ul>{log.map((l, i) => <li key={i}>{l}</li>)}</ul></div>;
}

// 9. Action matching (isAction check)
const slice09 = createSlice({ name: "ex09", initialState: { dispatched: [] as string[], count: 0 }, reducers: { track: (s, a: PayloadAction<unknown>) => { if (isAction(a.payload)) { s.dispatched.push(`Action: ${(a.payload as { type: string }).type}`); s.count++; } } } });
const store09 = configureStore({ reducer: slice09.reducer });
const known09 = createAction("ex09/known");
const other09 = createAction<number>("ex09/withPayload");
function Ex09_Name() { return <Provider store={store09}><Ex09_Inner /></Provider>; }
function Ex09_Inner() {
  const { dispatched, count } = useSelector((s: ReturnType<typeof store09.getState>) => s);
  const d = useDispatch();
  const track = (action: unknown) => { d(slice09.actions.track(action)); };
  return <div><p>Tracked: {count}</p><button onClick={() => { d(known09()); track(known09()); }}>Dispatch known</button><button onClick={() => { d(other09(42)); track(other09(42)); }}>Dispatch with payload</button><ul style={{ fontSize: 11 }}>{dispatched.slice(-5).map((s, i) => <li key={i}>{s}</li>)}</ul></div>;
}

// 10. Batch dispatch (multiple dispatches)
const slice10 = createSlice({ name: "ex10", initialState: { a: 0, b: 0, c: 0, renders: 0 }, reducers: { setA: (s, a: PayloadAction<number>) => { s.a = a.payload; }, setB: (s, a: PayloadAction<number>) => { s.b = a.payload; }, setC: (s, a: PayloadAction<number>) => { s.c = a.payload; } } });
const store10 = configureStore({ reducer: slice10.reducer });
function Ex10_Name() { return <Provider store={store10}><Ex10_Inner /></Provider>; }
function Ex10_Inner() {
  const state = useSelector((s: ReturnType<typeof store10.getState>) => s);
  const d = useDispatch();
  const renders = useRef(0); renders.current++;
  const dispatchAll = () => {
    // RTK 2.x / React 18 batch automatically
    d(slice10.actions.setA(Math.random() * 100 | 0));
    d(slice10.actions.setB(Math.random() * 100 | 0));
    d(slice10.actions.setC(Math.random() * 100 | 0));
  };
  return <div><p>a:{state.a} b:{state.b} c:{state.c}</p><p style={{ fontSize: 11 }}>Component renders: {renders.current}</p><button onClick={dispatchAll}>Dispatch 3 Actions</button></div>;
}

// 11. Conditional dispatch
const slice11 = createSlice({ name: "ex11", initialState: { balance: 100, log: [] as string[] }, reducers: { withdraw: (s, a: PayloadAction<number>) => { if (s.balance >= a.payload) { s.balance -= a.payload; s.log.push(`Withdrew $${a.payload}`); } else { s.log.push(`Rejected: insufficient funds ($${a.payload} > $${s.balance})`); } }, deposit: (s, a: PayloadAction<number>) => { s.balance += a.payload; s.log.push(`Deposited $${a.payload}`); } } });
const store11 = configureStore({ reducer: slice11.reducer });
function Ex11_Name() { return <Provider store={store11}><Ex11_Inner /></Provider>; }
function Ex11_Inner() {
  const { balance, log } = useSelector((s: ReturnType<typeof store11.getState>) => s);
  const d = useDispatch();
  const [amount, setAmount] = useState(30);
  return <div><p>Balance: ${balance}</p><input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} style={{ width: 60 }} /><button onClick={() => d(slice11.actions.withdraw(amount))}>Withdraw</button><button onClick={() => d(slice11.actions.deposit(amount))}>Deposit</button><ul style={{ fontSize: 11 }}>{log.slice(-4).map((l, i) => <li key={i}>{l}</li>)}</ul></div>;
}

// 12. Dispatch with callback
const slice12 = createSlice({ name: "ex12", initialState: { items: [] as string[], saving: false }, reducers: { startSave: (s) => { s.saving = true; }, endSave: (s, a: PayloadAction<string>) => { s.saving = false; s.items.push(a.payload); } } });
const store12 = configureStore({ reducer: slice12.reducer });
function Ex12_Name() { return <Provider store={store12}><Ex12_Inner /></Provider>; }
function Ex12_Inner() {
  const { items, saving } = useSelector((s: ReturnType<typeof store12.getState>) => s);
  const d = useDispatch();
  const [v, setV] = useState("");
  const handleSave = (text: string, onDone: (result: string) => void) => {
    d(slice12.actions.startSave());
    setTimeout(() => { d(slice12.actions.endSave(text)); onDone(`Saved: ${text}`); }, 800);
  };
  const [msg, setMsg] = useState("");
  return <div><input value={v} onChange={e => setV(e.target.value)} /><button disabled={saving} onClick={() => { if (v) { handleSave(v, setMsg); setV(""); } }}>{saving ? "Saving..." : "Save"}</button>{msg && <p style={{ color: "green" }}>{msg}</p>}<ul>{items.map((i, idx) => <li key={idx}>{i}</li>)}</ul></div>;
}

// ─── INTERMEDIATE 13–25 ─────────────────────────────────────────────────────────

// 13. createSlice actions (auto-generated)
const slice13 = createSlice({ name: "ex13", initialState: { name: "", age: 0, email: "" }, reducers: { setName: (s, a: PayloadAction<string>) => { s.name = a.payload; }, setAge: (s, a: PayloadAction<number>) => { s.age = a.payload; }, setEmail: (s, a: PayloadAction<string>) => { s.email = a.payload; }, reset: () => ({ name: "", age: 0, email: "" }) } });
const store13 = configureStore({ reducer: slice13.reducer });
function Ex13_Name() { return <Provider store={store13}><Ex13_Inner /></Provider>; }
function Ex13_Inner() {
  const state = useSelector((s: ReturnType<typeof store13.getState>) => s);
  const d = useDispatch();
  return <div><p>Auto-generated action types:</p><ul style={{ fontSize: 11 }}>{Object.entries(slice13.actions).map(([k, v]) => <li key={k}><code>{(v as { type: string }).type}</code></li>)}</ul><input placeholder="name" onBlur={e => d(slice13.actions.setName(e.target.value))} /><input type="number" placeholder="age" onBlur={e => d(slice13.actions.setAge(Number(e.target.value)))} /><p>{state.name}, {state.age}</p></div>;
}

// 14. Action creator with typed payload
interface UserAction14 { id: number; name: string; role: "admin" | "user" | "guest"; }
const slice14 = createSlice({ name: "ex14", initialState: { users: [] as UserAction14[], selected: null as UserAction14 | null }, reducers: { addUser: (s, a: PayloadAction<UserAction14>) => { s.users.push(a.payload); }, selectUser: (s, a: PayloadAction<number>) => { s.selected = s.users.find(u => u.id === a.payload) ?? null; }, removeUser: (s, a: PayloadAction<number>) => { s.users = s.users.filter(u => u.id !== a.payload); if (s.selected?.id === a.payload) s.selected = null; } } });
const store14 = configureStore({ reducer: slice14.reducer });
function Ex14_Name() { return <Provider store={store14}><Ex14_Inner /></Provider>; }
function Ex14_Inner() {
  const { users, selected } = useSelector((s: ReturnType<typeof store14.getState>) => s);
  const d = useDispatch();
  const [nextId, setNextId] = useState(1);
  const roles: ("admin" | "user" | "guest")[] = ["admin", "user", "guest"];
  return <div><div>{roles.map(r => <button key={r} onClick={() => { d(slice14.actions.addUser({ id: nextId, name: `${r}${nextId}`, role: r })); setNextId(n => n + 1); }}>Add {r}</button>)}</div><ul>{users.map(u => <li key={u.id} style={{ cursor: "pointer", fontWeight: selected?.id === u.id ? "bold" : "normal" }} onClick={() => d(slice14.actions.selectUser(u.id))}>{u.name} ({u.role}) <button onClick={e => { e.stopPropagation(); d(slice14.actions.removeUser(u.id)); }}>x</button></li>)}</ul>{selected && <p>Selected: {selected.name}</p>}</div>;
}

// 15. Dispatch in event handler
const slice15 = createSlice({ name: "ex15", initialState: { x: 0, y: 0, clicks: 0 }, reducers: { recordClick: (s, a: PayloadAction<{ x: number; y: number }>) => { s.x = a.payload.x; s.y = a.payload.y; s.clicks++; } } });
const store15 = configureStore({ reducer: slice15.reducer });
function Ex15_Name() { return <Provider store={store15}><Ex15_Inner /></Provider>; }
function Ex15_Inner() {
  const { x, y, clicks } = useSelector((s: ReturnType<typeof store15.getState>) => s);
  const d = useDispatch();
  return <div><div style={{ width: 200, height: 100, background: "#f0f0f0", cursor: "crosshair", position: "relative" }} onClick={e => { const rect = e.currentTarget.getBoundingClientRect(); d(slice15.actions.recordClick({ x: Math.round(e.clientX - rect.left), y: Math.round(e.clientY - rect.top) })); }}><span style={{ position: "absolute", top: y, left: x, transform: "translate(-50%,-50%)" }}>●</span></div><p>x:{x} y:{y} clicks:{clicks}</p></div>;
}

// 16. Dispatch from child component
const slice16 = createSlice({ name: "ex16", initialState: { messages: [] as string[] }, reducers: { addMessage: (s, a: PayloadAction<string>) => { s.messages.push(a.payload); } } });
const store16 = configureStore({ reducer: slice16.reducer });
function Ex16_Name() { return <Provider store={store16}><Ex16_Parent /></Provider>; }
function Ex16_Parent() {
  const messages = useSelector((s: ReturnType<typeof store16.getState>) => s.messages);
  return <div><p>Messages from children:</p><ul>{messages.map((m, i) => <li key={i}>{m}</li>)}</ul><Ex16_Child name="Child A" /><Ex16_Child name="Child B" /></div>;
}
function Ex16_Child({ name }: { name: string }) {
  const d = useDispatch();
  const [v, setV] = useState("");
  return <div style={{ border: "1px solid #ccc", padding: 4, margin: 4 }}><strong>{name}: </strong><input value={v} onChange={e => setV(e.target.value)} /><button onClick={() => { if (v) { d(slice16.actions.addMessage(`${name}: ${v}`)); setV(""); } }}>Send</button></div>;
}

// 17. Action with metadata
const metaAction17 = createAction("ex17/metaAction", (payload: string, userId: number) => ({ payload, meta: { userId, timestamp: Date.now(), source: "UI" } }));
const slice17 = createSlice({ name: "ex17", initialState: [] as { text: string; meta: { userId: number; timestamp: number; source: string } }[], reducers: {}, extraReducers: (b) => b.addCase(metaAction17, (s, a) => { s.push({ text: a.payload, meta: (a as { meta: { userId: number; timestamp: number; source: string } }).meta }); }) });
const store17 = configureStore({ reducer: slice17.reducer });
function Ex17_Name() { return <Provider store={store17}><Ex17_Inner /></Provider>; }
function Ex17_Inner() {
  const items = useSelector((s: ReturnType<typeof store17.getState>) => s);
  const d = useDispatch();
  const [v, setV] = useState("");
  return <div><input value={v} onChange={e => setV(e.target.value)} /><button onClick={() => { if (v) { d(metaAction17(v, 42)); setV(""); } }}>Dispatch with Meta</button><ul style={{ fontSize: 11 }}>{items.map((i, idx) => <li key={idx}>"{i.text}" user:{i.meta.userId} src:{i.meta.source}</li>)}</ul></div>;
}

// 18. Reset action
const slice18 = createSlice({ name: "ex18", initialState: { count: 0, text: "initial", items: [] as string[] }, reducers: { increment: (s) => { s.count++; }, setText: (s, a: PayloadAction<string>) => { s.text = a.payload; }, addItem: (s, a: PayloadAction<string>) => { s.items.push(a.payload); }, reset: () => ({ count: 0, text: "initial", items: [] }) } });
const store18 = configureStore({ reducer: slice18.reducer });
function Ex18_Name() { return <Provider store={store18}><Ex18_Inner /></Provider>; }
function Ex18_Inner() {
  const state = useSelector((s: ReturnType<typeof store18.getState>) => s);
  const d = useDispatch();
  return <div><p>count:{state.count} text:"{state.text}" items:[{state.items.join(",")}]</p><button onClick={() => d(slice18.actions.increment())}>Inc</button><button onClick={() => d(slice18.actions.setText("changed"))}>Set Text</button><button onClick={() => d(slice18.actions.addItem(`item${state.items.length + 1}`))}>Add Item</button><button onClick={() => d(slice18.actions.reset())} style={{ background: "#f44336", color: "#fff" }}>Reset All</button></div>;
}

// 19. Toggle action
const slice19 = createSlice({ name: "ex19", initialState: { darkMode: false, sidebar: true, notifications: true, compactView: false }, reducers: { toggle: (s, a: PayloadAction<keyof typeof s>) => { (s as Record<string, boolean>)[a.payload] = !(s as Record<string, boolean>)[a.payload]; } } });
const store19 = configureStore({ reducer: slice19.reducer });
type ToggleKey19 = keyof ReturnType<typeof store19.getState>;
function Ex19_Name() { return <Provider store={store19}><Ex19_Inner /></Provider>; }
function Ex19_Inner() {
  const state = useSelector((s: ReturnType<typeof store19.getState>) => s);
  const d = useDispatch();
  return <div>{(Object.keys(state) as ToggleKey19[]).map(k => <div key={k}><label><input type="checkbox" checked={state[k]} onChange={() => d(slice19.actions.toggle(k))} /> {k}</label></div>)}</div>;
}

// 20. Increment/decrement with bounds
const slice20 = createSlice({ name: "ex20", initialState: { value: 50, min: 0, max: 100 }, reducers: { increment: (s, a: PayloadAction<number | undefined>) => { s.value = Math.min(s.max, s.value + (a.payload ?? 1)); }, decrement: (s, a: PayloadAction<number | undefined>) => { s.value = Math.max(s.min, s.value - (a.payload ?? 1)); }, setMin: (s, a: PayloadAction<number>) => { s.min = a.payload; }, setMax: (s, a: PayloadAction<number>) => { s.max = a.payload; } } });
const store20 = configureStore({ reducer: slice20.reducer });
function Ex20_Name() { return <Provider store={store20}><Ex20_Inner /></Provider>; }
function Ex20_Inner() {
  const { value, min, max } = useSelector((s: ReturnType<typeof store20.getState>) => s);
  const d = useDispatch();
  const pct = ((value - min) / (max - min)) * 100;
  return <div><div style={{ background: "#eee", height: 16, borderRadius: 8 }}><div style={{ background: "#4caf50", height: "100%", width: `${pct}%`, borderRadius: 8, transition: "width 0.2s" }} /></div><p>{value} (min:{min} max:{max})</p><button onClick={() => d(slice20.actions.decrement())} disabled={value <= min}>-1</button><button onClick={() => d(slice20.actions.decrement(10))} disabled={value <= min}>-10</button><button onClick={() => d(slice20.actions.increment())} disabled={value >= max}>+1</button><button onClick={() => d(slice20.actions.increment(10))} disabled={value >= max}>+10</button></div>;
}

// 21. Select action (radio group)
const slice21 = createSlice({ name: "ex21", initialState: { selected: "option1", options: ["option1", "option2", "option3", "option4"] }, reducers: { select: (s, a: PayloadAction<string>) => { if (s.options.includes(a.payload)) s.selected = a.payload; } } });
const store21 = configureStore({ reducer: slice21.reducer });
function Ex21_Name() { return <Provider store={store21}><Ex21_Inner /></Provider>; }
function Ex21_Inner() {
  const { selected, options } = useSelector((s: ReturnType<typeof store21.getState>) => s);
  const d = useDispatch();
  return <div>{options.map(o => <label key={o} style={{ display: "block" }}><input type="radio" name="ex21" value={o} checked={selected === o} onChange={() => d(slice21.actions.select(o))} /> {o}</label>)}<p>Selected: <strong>{selected}</strong></p></div>;
}

// 22. Dispatch in form submit
const slice22 = createSlice({ name: "ex22", initialState: { submissions: [] as { name: string; email: string; msg: string }[] }, reducers: { submit: (s, a: PayloadAction<{ name: string; email: string; msg: string }>) => { s.submissions.push(a.payload); } } });
const store22 = configureStore({ reducer: slice22.reducer });
function Ex22_Name() { return <Provider store={store22}><Ex22_Inner /></Provider>; }
function Ex22_Inner() {
  const submissions = useSelector((s: ReturnType<typeof store22.getState>) => s.submissions);
  const d = useDispatch();
  const [form, setForm] = useState({ name: "", email: "", msg: "" });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name && form.email) {
      d(slice22.actions.submit(form));
      setForm({ name: "", email: "", msg: "" });
    }
  };
  return <div><form onSubmit={handleSubmit}>{(["name", "email", "msg"] as const).map(f => <input key={f} placeholder={f} value={form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} style={{ display: "block", margin: "4px 0" }} />)}<button type="submit">Submit</button></form><ul>{submissions.map((s, i) => <li key={i}>{s.name} ({s.email})</li>)}</ul></div>;
}

// 23. Action logging middleware pattern
const actionLog23: string[] = [];
const loggingMiddleware23 = (_: unknown) => (next: (a: unknown) => unknown) => (action: unknown) => {
  if (isAction(action)) actionLog23.push(action.type);
  return next(action);
};
const slice23 = createSlice({ name: "ex23", initialState: 0, reducers: { inc: s => s + 1, dec: s => s - 1, reset: () => 0 } });
const store23 = configureStore({ reducer: slice23.reducer, middleware: (gDM) => gDM().concat(loggingMiddleware23 as ReturnType<typeof gDM>[number]) });
function Ex23_Name() { return <Provider store={store23}><Ex23_Inner /></Provider>; }
function Ex23_Inner() {
  const n = useSelector((s: ReturnType<typeof store23.getState>) => s);
  const d = useDispatch();
  const [, forceUpdate] = useState(0);
  return <div><p>Count: {n}</p><button onClick={() => { d(slice23.actions.inc()); forceUpdate(x => x + 1); }}>+</button><button onClick={() => { d(slice23.actions.dec()); forceUpdate(x => x + 1); }}>-</button><button onClick={() => { d(slice23.actions.reset()); forceUpdate(x => x + 1); }}>Reset</button><ul style={{ fontSize: 11 }}>{actionLog23.slice(-6).map((t, i) => <li key={i}>{t}</li>)}</ul></div>;
}

// 24. Action batching pattern
const slice24 = createSlice({ name: "ex24", initialState: { values: [] as number[], sum: 0, avg: 0 }, reducers: { batchAdd: (s, a: PayloadAction<number[]>) => { s.values.push(...a.payload); s.sum = s.values.reduce((a, b) => a + b, 0); s.avg = s.sum / s.values.length; }, clear: (s) => { s.values = []; s.sum = 0; s.avg = 0; } } });
const store24 = configureStore({ reducer: slice24.reducer });
function Ex24_Name() { return <Provider store={store24}><Ex24_Inner /></Provider>; }
function Ex24_Inner() {
  const { values, sum, avg } = useSelector((s: ReturnType<typeof store24.getState>) => s);
  const d = useDispatch();
  const generateBatch = () => Array.from({ length: 5 }, () => Math.floor(Math.random() * 100));
  return <div><p>Values: [{values.slice(-10).join(", ")}{values.length > 10 ? "..." : ""}]</p><p>Sum: {sum} | Avg: {avg.toFixed(1)} | Count: {values.length}</p><button onClick={() => d(slice24.actions.batchAdd(generateBatch()))}>Add Batch of 5</button><button onClick={() => d(slice24.actions.clear())}>Clear</button></div>;
}

// 25. Dispatch chain (sequential actions)
const slice25 = createSlice({ name: "ex25", initialState: { stage: "idle", log: [] as string[] }, reducers: { startProcess: (s) => { s.stage = "started"; s.log.push("→ Process started"); }, validate: (s) => { s.stage = "validating"; s.log.push("→ Validating..."); }, process: (s) => { s.stage = "processing"; s.log.push("→ Processing data..."); }, complete: (s) => { s.stage = "done"; s.log.push("→ Complete!"); }, reset: () => ({ stage: "idle", log: [] }) } });
const store25 = configureStore({ reducer: slice25.reducer });
function Ex25_Name() { return <Provider store={store25}><Ex25_Inner /></Provider>; }
function Ex25_Inner() {
  const { stage, log } = useSelector((s: ReturnType<typeof store25.getState>) => s);
  const d = useDispatch();
  const runChain = () => {
    d(slice25.actions.startProcess());
    setTimeout(() => d(slice25.actions.validate()), 300);
    setTimeout(() => d(slice25.actions.process()), 700);
    setTimeout(() => d(slice25.actions.complete()), 1200);
  };
  return <div><p>Stage: <strong>{stage}</strong></p><ul style={{ fontSize: 11 }}>{log.map((l, i) => <li key={i}>{l}</li>)}</ul>{stage === "idle" || stage === "done" ? <button onClick={runChain}>Run Chain</button> : <span>Running...</span>}<button onClick={() => d(slice25.actions.reset())}>Reset</button></div>;
}

// ─── NESTED 26–37 ───────────────────────────────────────────────────────────────

// 26. Actions for nested state update
const slice26 = createSlice({ name: "ex26", initialState: { profile: { name: "Alice", address: { street: "123 Main St", city: "NYC" }, social: { twitter: "@alice", github: "alice" } } }, reducers: { updateStreet: (s, a: PayloadAction<string>) => { s.profile.address.street = a.payload; }, updateCity: (s, a: PayloadAction<string>) => { s.profile.address.city = a.payload; }, updateTwitter: (s, a: PayloadAction<string>) => { s.profile.social.twitter = a.payload; } } });
const store26 = configureStore({ reducer: slice26.reducer });
function Ex26_Name() { return <Provider store={store26}><Ex26_Inner /></Provider>; }
function Ex26_Inner() {
  const { profile } = useSelector((s: ReturnType<typeof store26.getState>) => s);
  const d = useDispatch();
  return <div><p>{profile.name}</p><p>{profile.address.street}, {profile.address.city}</p><p>Twitter: {profile.social.twitter} | GitHub: {profile.social.github}</p><input placeholder="Street" onBlur={e => d(slice26.actions.updateStreet(e.target.value))} /><input placeholder="City" onBlur={e => d(slice26.actions.updateCity(e.target.value))} /><input placeholder="Twitter" onBlur={e => d(slice26.actions.updateTwitter(e.target.value))} /></div>;
}

// 27. Actions for array manipulation (add/remove/move)
const slice27 = createSlice({ name: "ex27", initialState: ["Alpha", "Beta", "Gamma", "Delta"], reducers: { add: (s, a: PayloadAction<string>) => { s.push(a.payload); }, remove: (s, a: PayloadAction<number>) => { s.splice(a.payload, 1); }, moveUp: (s, a: PayloadAction<number>) => { if (a.payload > 0) [s[a.payload], s[a.payload - 1]] = [s[a.payload - 1], s[a.payload]]; }, moveDown: (s, a: PayloadAction<number>) => { if (a.payload < s.length - 1) [s[a.payload], s[a.payload + 1]] = [s[a.payload + 1], s[a.payload]]; } } });
const store27 = configureStore({ reducer: slice27.reducer });
function Ex27_Name() { return <Provider store={store27}><Ex27_Inner /></Provider>; }
function Ex27_Inner() {
  const items = useSelector((s: ReturnType<typeof store27.getState>) => s);
  const d = useDispatch();
  const [v, setV] = useState("");
  return <div><ul>{items.map((it, i) => <li key={i}>{it} <button onClick={() => d(slice27.actions.moveUp(i))} disabled={i === 0}>↑</button><button onClick={() => d(slice27.actions.moveDown(i))} disabled={i === items.length - 1}>↓</button><button onClick={() => d(slice27.actions.remove(i))}>x</button></li>)}</ul><input value={v} onChange={e => setV(e.target.value)} /><button onClick={() => { if (v) { d(slice27.actions.add(v)); setV(""); } }}>Add</button></div>;
}

// 28. Actions for normalized entities
interface Post28 { id: number; title: string; authorId: number; }
interface Author28 { id: number; name: string; }
const slice28 = createSlice({ name: "ex28", initialState: { posts: { byId: {} as Record<number, Post28>, allIds: [] as number[] }, authors: { byId: { 1: { id: 1, name: "Alice" }, 2: { id: 2, name: "Bob" } } as Record<number, Author28>, allIds: [1, 2] }, nextPostId: 1 }, reducers: { addPost: (s, a: PayloadAction<{ title: string; authorId: number }>) => { const id = s.nextPostId++; s.posts.byId[id] = { id, ...a.payload }; s.posts.allIds.push(id); }, removePost: (s, a: PayloadAction<number>) => { delete s.posts.byId[a.payload]; s.posts.allIds = s.posts.allIds.filter(id => id !== a.payload); } } });
const store28 = configureStore({ reducer: slice28.reducer });
function Ex28_Name() { return <Provider store={store28}><Ex28_Inner /></Provider>; }
function Ex28_Inner() {
  const { posts, authors } = useSelector((s: ReturnType<typeof store28.getState>) => s);
  const d = useDispatch();
  const [title, setTitle] = useState("");
  const [authorId, setAuthorId] = useState(1);
  return <div><div><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Post title" /><select value={authorId} onChange={e => setAuthorId(Number(e.target.value))}>{authors.allIds.map(id => <option key={id} value={id}>{authors.byId[id].name}</option>)}</select><button onClick={() => { if (title) { d(slice28.actions.addPost({ title, authorId })); setTitle(""); } }}>Add Post</button></div><ul>{posts.allIds.map(id => { const p = posts.byId[id]; return <li key={id}>"{p.title}" by {authors.byId[p.authorId]?.name} <button onClick={() => d(slice28.actions.removePost(id))}>x</button></li>; })}</ul></div>;
}

// 29. Multi-slice coordinated dispatch
const userSlice29 = createSlice({ name: "ex29_user", initialState: { name: "Alice", points: 0 }, reducers: { earnPoints: (s, a: PayloadAction<number>) => { s.points += a.payload; } } });
const achieveSlice29 = createSlice({ name: "ex29_achieve", initialState: [] as string[], reducers: { unlock: (s, a: PayloadAction<string>) => { if (!s.includes(a.payload)) s.push(a.payload); } } });
const store29 = configureStore({ reducer: { user: userSlice29.reducer, achievements: achieveSlice29.reducer } });
type RS29 = ReturnType<typeof store29.getState>;
function Ex29_Name() { return <Provider store={store29}><Ex29_Inner /></Provider>; }
function Ex29_Inner() {
  const user = useSelector((s: RS29) => s.user);
  const achievements = useSelector((s: RS29) => s.achievements);
  const d = useDispatch();
  const earnAndCheck = (pts: number) => {
    d(userSlice29.actions.earnPoints(pts));
    const newTotal = store29.getState().user.points + pts;
    if (newTotal >= 10) d(achieveSlice29.actions.unlock("Beginner"));
    if (newTotal >= 50) d(achieveSlice29.actions.unlock("Intermediate"));
    if (newTotal >= 100) d(achieveSlice29.actions.unlock("Expert"));
  };
  return <div><p>{user.name}: {user.points} pts</p><div>{[1, 5, 10, 25].map(p => <button key={p} onClick={() => earnAndCheck(p)}>+{p}</button>)}</div><p>Achievements: {achievements.length ? achievements.join(", ") : "None"}</p></div>;
}

// 30. Actions with relations (parent/child entities)
const slice30 = createSlice({ name: "ex30", initialState: { categories: [{ id: 1, name: "Electronics" }, { id: 2, name: "Food" }] as { id: number; name: string }[], products: [] as { id: number; name: string; categoryId: number }[], nextId: 1 }, reducers: { addProduct: (s, a: PayloadAction<{ name: string; categoryId: number }>) => { s.products.push({ id: s.nextId++, ...a.payload }); }, removeCategory: (s, a: PayloadAction<number>) => { s.categories = s.categories.filter(c => c.id !== a.payload); s.products = s.products.filter(p => p.categoryId !== a.payload); } } });
const store30 = configureStore({ reducer: slice30.reducer });
function Ex30_Name() { return <Provider store={store30}><Ex30_Inner /></Provider>; }
function Ex30_Inner() {
  const { categories, products } = useSelector((s: ReturnType<typeof store30.getState>) => s);
  const d = useDispatch();
  const [name, setName] = useState("");
  const [catId, setCatId] = useState(1);
  return <div>{categories.map(c => <div key={c.id} style={{ border: "1px solid #ccc", margin: 4, padding: 4 }}><strong>{c.name}</strong> <button onClick={() => d(slice30.actions.removeCategory(c.id))} style={{ color: "red" }}>Delete (cascades)</button><ul>{products.filter(p => p.categoryId === c.id).map(p => <li key={p.id}>{p.name}</li>)}</ul></div>)}<div><input value={name} onChange={e => setName(e.target.value)} placeholder="Product name" /><select value={catId} onChange={e => setCatId(Number(e.target.value))}>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><button onClick={() => { if (name) { d(slice30.actions.addProduct({ name, categoryId: catId })); setName(""); } }}>Add Product</button></div></div>;
}

// 31. Action payload transformation
const slice31 = createSlice({ name: "ex31", initialState: [] as { id: number; original: string; transformed: string; wordCount: number; charCount: number }[], reducers: { processText: { reducer(s, a: PayloadAction<{ id: number; original: string; transformed: string; wordCount: number; charCount: number }>) { s.push(a.payload); }, prepare(text: string) { return { payload: { id: Date.now(), original: text, transformed: text.trim().toLowerCase().replace(/\s+/g, " "), wordCount: text.trim().split(/\s+/).length, charCount: text.length } }; } }, remove: (s, a: PayloadAction<number>) => s.filter(i => i.id !== a.payload) } });
const store31 = configureStore({ reducer: slice31.reducer });
function Ex31_Name() { return <Provider store={store31}><Ex31_Inner /></Provider>; }
function Ex31_Inner() {
  const items = useSelector((s: ReturnType<typeof store31.getState>) => s);
  const d = useDispatch();
  const [v, setV] = useState("  Hello   World  ");
  return <div><textarea value={v} onChange={e => setV(e.target.value)} rows={2} cols={30} /><button onClick={() => d(slice31.actions.processText(v))}>Process</button><ul style={{ fontSize: 11 }}>{items.map(i => <li key={i.id}>"{i.transformed}" w:{i.wordCount} c:{i.charCount} <button onClick={() => d(slice31.actions.remove(i.id))}>x</button></li>)}</ul></div>;
}

// 32. Actions for undo/redo
const slice32 = createSlice({ name: "ex32", initialState: { past: [] as string[][], present: ["item1"], future: [] as string[][] }, reducers: { add: (s, a: PayloadAction<string>) => { s.past.push([...s.present]); s.present.push(a.payload); s.future = []; }, remove: (s, a: PayloadAction<number>) => { s.past.push([...s.present]); s.present.splice(a.payload, 1); s.future = []; }, undo: (s) => { if (s.past.length) { s.future.unshift([...s.present]); s.present = s.past.pop()!; } }, redo: (s) => { if (s.future.length) { s.past.push([...s.present]); s.present = s.future.shift()!; } } } });
const store32 = configureStore({ reducer: slice32.reducer });
function Ex32_Name() { return <Provider store={store32}><Ex32_Inner /></Provider>; }
function Ex32_Inner() {
  const { past, present, future } = useSelector((s: ReturnType<typeof store32.getState>) => s);
  const d = useDispatch();
  const [v, setV] = useState("");
  return <div><div style={{ display: "flex", gap: 4 }}><button onClick={() => d(slice32.actions.undo())} disabled={!past.length}>Undo</button><button onClick={() => d(slice32.actions.redo())} disabled={!future.length}>Redo</button></div><ul>{present.map((it, i) => <li key={i}>{it} <button onClick={() => d(slice32.actions.remove(i))}>x</button></li>)}</ul><input value={v} onChange={e => setV(e.target.value)} /><button onClick={() => { if (v) { d(slice32.actions.add(v)); setV(""); } }}>Add</button><p style={{ fontSize: 11 }}>past:{past.length} future:{future.length}</p></div>;
}

// 33. Actions for multi-step wizard
const slice33 = createSlice({ name: "ex33", initialState: { step: 0, steps: ["Welcome", "Personal Info", "Preferences", "Review", "Done"], data: {} as Record<string, string>, visited: [] as number[] }, reducers: { goTo: (s, a: PayloadAction<number>) => { if (!s.visited.includes(s.step)) s.visited.push(s.step); s.step = a.payload; }, setField: (s, a: PayloadAction<{ key: string; value: string }>) => { s.data[a.payload.key] = a.payload.value; }, complete: (s) => { s.step = s.steps.length - 1; } } });
const store33 = configureStore({ reducer: slice33.reducer });
function Ex33_Name() { return <Provider store={store33}><Ex33_Inner /></Provider>; }
function Ex33_Inner() {
  const { step, steps, data, visited } = useSelector((s: ReturnType<typeof store33.getState>) => s);
  const d = useDispatch();
  return <div><div style={{ display: "flex", gap: 4 }}>{steps.map((s, i) => <button key={i} onClick={() => d(slice33.actions.goTo(i))} style={{ fontWeight: step === i ? "bold" : "normal", background: visited.includes(i) ? "#c8e6c9" : "#eee" }}>{i + 1}</button>)}</div><div style={{ padding: 8, border: "1px solid #ccc", margin: "8px 0" }}><h4>{steps[step]}</h4>{step === 1 && <input placeholder="Name" value={data.name ?? ""} onChange={e => d(slice33.actions.setField({ key: "name", value: e.target.value }))} />}{step === 2 && <select value={data.theme ?? "light"} onChange={e => d(slice33.actions.setField({ key: "theme", value: e.target.value }))}><option>light</option><option>dark</option></select>}{step === 3 && <p>Name: {data.name}, Theme: {data.theme}</p>}</div><div><button onClick={() => d(slice33.actions.goTo(Math.max(0, step - 1)))} disabled={step === 0}>Back</button><button onClick={() => step < steps.length - 2 ? d(slice33.actions.goTo(step + 1)) : d(slice33.actions.complete())} disabled={step === steps.length - 1}>{step < steps.length - 2 ? "Next" : "Finish"}</button></div></div>;
}

// 34. Actions for drag-and-drop reorder
const slice34 = createSlice({ name: "ex34", initialState: ["Task Alpha", "Task Beta", "Task Gamma", "Task Delta", "Task Epsilon"], reducers: { reorder: (s, a: PayloadAction<{ from: number; to: number }>) => { const [item] = s.splice(a.payload.from, 1); s.splice(a.payload.to, 0, item); } } });
const store34 = configureStore({ reducer: slice34.reducer });
function Ex34_Name() { return <Provider store={store34}><Ex34_Inner /></Provider>; }
function Ex34_Inner() {
  const items = useSelector((s: ReturnType<typeof store34.getState>) => s);
  const d = useDispatch();
  const [dragging, setDragging] = useState<number | null>(null);
  return <div><ul style={{ listStyle: "none", padding: 0 }}>{items.map((item, i) => <li key={item} draggable style={{ padding: 8, margin: 4, background: dragging === i ? "#bbdefb" : "#f0f0f0", border: "1px solid #ccc", cursor: "grab" }} onDragStart={() => setDragging(i)} onDragOver={e => e.preventDefault()} onDrop={() => { if (dragging !== null && dragging !== i) { d(slice34.actions.reorder({ from: dragging, to: i })); setDragging(null); } }}>{item}</li>)}</ul><p style={{ fontSize: 11 }}>Drag items to reorder</p></div>;
}

// 35. Actions for filter + sort + paginate
const slice35 = createSlice({ name: "ex35", initialState: { items: Array.from({ length: 20 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}`, value: Math.floor(Math.random() * 100) })), filter: "", sort: "id" as "id" | "name" | "value", sortDir: "asc" as "asc" | "desc", page: 1, pageSize: 5 }, reducers: { setFilter: (s, a: PayloadAction<string>) => { s.filter = a.payload; s.page = 1; }, setSort: (s, a: PayloadAction<"id" | "name" | "value">) => { if (s.sort === a.payload) s.sortDir = s.sortDir === "asc" ? "desc" : "asc"; else { s.sort = a.payload; s.sortDir = "asc"; } }, setPage: (s, a: PayloadAction<number>) => { s.page = a.payload; } } });
const store35 = configureStore({ reducer: slice35.reducer });
type RS35 = ReturnType<typeof store35.getState>;
function Ex35_Name() { return <Provider store={store35}><Ex35_Inner /></Provider>; }
function Ex35_Inner() {
  const state = useSelector((s: RS35) => s);
  const d = useDispatch();
  const filtered = state.items.filter(i => i.name.toLowerCase().includes(state.filter.toLowerCase())).sort((a, b) => { const mul = state.sortDir === "asc" ? 1 : -1; return mul * (a[state.sort] > b[state.sort] ? 1 : -1); });
  const paginated = filtered.slice((state.page - 1) * state.pageSize, state.page * state.pageSize);
  const totalPages = Math.ceil(filtered.length / state.pageSize);
  return <div><input placeholder="Filter..." value={state.filter} onChange={e => d(slice35.actions.setFilter(e.target.value))} /><table><thead><tr>{(["id", "name", "value"] as const).map(k => <th key={k} onClick={() => d(slice35.actions.setSort(k))} style={{ cursor: "pointer" }}>{k}{state.sort === k ? (state.sortDir === "asc" ? "↑" : "↓") : ""}</th>)}</tr></thead><tbody>{paginated.map(i => <tr key={i.id}><td>{i.id}</td><td>{i.name}</td><td>{i.value}</td></tr>)}</tbody></table><div>{Array.from({ length: totalPages }, (_, i) => <button key={i} onClick={() => d(slice35.actions.setPage(i + 1))} style={{ fontWeight: state.page === i + 1 ? "bold" : "normal" }}>{i + 1}</button>)}</div></div>;
}

// 36. Actions for tree operations (expand/collapse/add/remove)
interface TreeNode36 { id: number; label: string; children: number[]; }
const slice36 = createSlice({ name: "ex36", initialState: { nodes: { 1: { id: 1, label: "Root", children: [2, 3] }, 2: { id: 2, label: "Node A", children: [] }, 3: { id: 3, label: "Node B", children: [4] }, 4: { id: 4, label: "Node B.1", children: [] } } as Record<number, TreeNode36>, expanded: [1] as number[], nextId: 5 }, reducers: { toggle: (s, a: PayloadAction<number>) => { const idx = s.expanded.indexOf(a.payload); idx >= 0 ? s.expanded.splice(idx, 1) : s.expanded.push(a.payload); }, addChild: (s, a: PayloadAction<{ parentId: number; label: string }>) => { const id = s.nextId++; s.nodes[id] = { id, label: a.payload.label, children: [] }; s.nodes[a.payload.parentId].children.push(id); s.expanded.push(a.payload.parentId); }, removeNode: (s, a: PayloadAction<number>) => { const remove = (id: number) => { s.nodes[id].children.forEach(c => remove(c)); delete s.nodes[id]; }; const parent = Object.values(s.nodes).find(n => n.children.includes(a.payload)); if (parent) parent.children = parent.children.filter(c => c !== a.payload); remove(a.payload); } } });
const store36 = configureStore({ reducer: slice36.reducer });
function Ex36_Name() { return <Provider store={store36}><Ex36_Inner /></Provider>; }
function Ex36_Inner() {
  const { nodes, expanded } = useSelector((s: ReturnType<typeof store36.getState>) => s);
  const d = useDispatch();
  const render = (id: number, depth = 0): React.ReactNode => {
    const node = nodes[id]; if (!node) return null;
    const isExpanded = expanded.includes(id);
    return <div key={id} style={{ marginLeft: depth * 16 }}><span style={{ cursor: "pointer" }} onClick={() => d(slice36.actions.toggle(id))}>{node.children.length ? (isExpanded ? "▼" : "▶") : "•"} {node.label}</span>{id !== 1 && <button onClick={() => d(slice36.actions.removeNode(id))} style={{ fontSize: 10, marginLeft: 4 }}>x</button>}<button onClick={() => d(slice36.actions.addChild({ parentId: id, label: `Child of ${node.label}` }))} style={{ fontSize: 10, marginLeft: 4 }}>+</button>{isExpanded && node.children.map(c => render(c, depth + 1))}</div>;
  };
  return <div>{render(1)}</div>;
}

// 37. Actions for real-time updates (insert at position)
const slice37 = createSlice({ name: "ex37", initialState: { feed: [] as { id: number; text: string; time: string; pinned: boolean }[], paused: false, nextId: 1 }, reducers: { insertAt: (s, a: PayloadAction<{ position: number; text: string }>) => { if (!s.paused) s.feed.splice(a.payload.position, 0, { id: s.nextId++, text: a.payload.text, time: new Date().toLocaleTimeString(), pinned: false }); }, pin: (s, a: PayloadAction<number>) => { const i = s.feed.find(i => i.id === a.payload); if (i) i.pinned = !i.pinned; }, togglePause: (s) => { s.paused = !s.paused; }, trimFeed: (s) => { const pinned = s.feed.filter(i => i.pinned); const unpinned = s.feed.filter(i => !i.pinned).slice(0, 5); s.feed = [...pinned, ...unpinned]; } } });
const store37 = configureStore({ reducer: slice37.reducer });
function Ex37_Name() { return <Provider store={store37}><Ex37_Inner /></Provider>; }
function Ex37_Inner() {
  const { feed, paused } = useSelector((s: ReturnType<typeof store37.getState>) => s);
  const d = useDispatch();
  const events = ["User joined", "Comment posted", "Item sold", "Price updated", "Alert triggered"];
  useEffect(() => {
    const t = setInterval(() => { d(slice37.actions.insertAt({ position: 0, text: events[Math.floor(Math.random() * events.length)] })); }, 2000);
    return () => clearInterval(t);
  }, [d]);
  return <div><div style={{ display: "flex", gap: 4 }}><button onClick={() => d(slice37.actions.togglePause())}>{paused ? "Resume" : "Pause"}</button><button onClick={() => d(slice37.actions.trimFeed())}>Trim</button></div><ul style={{ maxHeight: 150, overflowY: "auto", fontSize: 12 }}>{feed.map(i => <li key={i.id} style={{ background: i.pinned ? "#fff9c4" : "transparent" }}>{i.time} — {i.text} <button onClick={() => d(slice37.actions.pin(i.id))} style={{ fontSize: 10 }}>{i.pinned ? "unpin" : "pin"}</button></li>)}</ul></div>;
}

// ─── ADVANCED 38–50 ─────────────────────────────────────────────────────────────

// 38. prepare callback for complex payload
const createEvent38 = createAction("ex38/event", (type: string, data: Record<string, unknown>) => ({
  payload: { type, data, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, timestamp: new Date().toISOString(), version: 1 }
}));
const slice38 = createSlice({ name: "ex38", initialState: [] as ReturnType<typeof createEvent38>["payload"][], reducers: {}, extraReducers: b => b.addCase(createEvent38, (s, a) => { s.unshift(a.payload); if (s.length > 5) s.pop(); }) });
const store38 = configureStore({ reducer: slice38.reducer });
function Ex38_Name() { return <Provider store={store38}><Ex38_Inner /></Provider>; }
function Ex38_Inner() {
  const events = useSelector((s: ReturnType<typeof store38.getState>) => s);
  const d = useDispatch();
  const types = ["click", "submit", "navigate", "error"];
  return <div><div>{types.map(t => <button key={t} onClick={() => d(createEvent38(t, { page: "home", value: Math.random() | 0 }))}>Fire {t}</button>)}</div><ul style={{ fontSize: 10 }}>{events.map(e => <li key={e.id}>{e.timestamp.slice(11, 19)} [{e.type}] id:{e.id.slice(-5)}</li>)}</ul></div>;
}

// 39. Action creator factories
function makeCounterActions39(prefix: string) {
  return { inc: createAction(`${prefix}/inc`), dec: createAction(`${prefix}/dec`), reset: createAction(`${prefix}/reset`) };
}
const actionsA39 = makeCounterActions39("counterA");
const actionsB39 = makeCounterActions39("counterB");
const reducerA39 = createReducer(0, b => b.addCase(actionsA39.inc, s => s + 1).addCase(actionsA39.dec, s => s - 1).addCase(actionsA39.reset, () => 0));
const reducerB39 = createReducer(0, b => b.addCase(actionsB39.inc, s => s + 5).addCase(actionsB39.dec, s => s - 5).addCase(actionsB39.reset, () => 0));
const store39 = configureStore({ reducer: { a: reducerA39, b: reducerB39 } });
type RS39 = ReturnType<typeof store39.getState>;
function Ex39_Name() { return <Provider store={store39}><Ex39_Inner /></Provider>; }
function Ex39_Inner() {
  const { a, b } = useSelector((s: RS39) => s);
  const d = useDispatch();
  return <div><p>Counter A (step 1): {a}</p><div><button onClick={() => d(actionsA39.dec())}>-</button><button onClick={() => d(actionsA39.inc())}>+</button><button onClick={() => d(actionsA39.reset())}>Reset</button></div><p>Counter B (step 5): {b}</p><div><button onClick={() => d(actionsB39.dec())}>-</button><button onClick={() => d(actionsB39.inc())}>+</button><button onClick={() => d(actionsB39.reset())}>Reset</button></div></div>;
}

// 40. Type-safe action matching
const login40 = createAction<{ user: string; role: string }>("ex40/login");
const logout40 = createAction("ex40/logout");
const updateProfile40 = createAction<{ email: string }>("ex40/updateProfile");
const slice40 = createSlice({ name: "ex40", initialState: { user: null as string | null, role: "", email: "", eventLog: [] as string[] }, reducers: {}, extraReducers: b => b.addCase(login40, (s, a) => { s.user = a.payload.user; s.role = a.payload.role; s.eventLog.push(`Logged in as ${a.payload.user}`); }).addCase(logout40, (s) => { s.eventLog.push(`Logged out: ${s.user}`); s.user = null; s.role = ""; }).addCase(updateProfile40, (s, a) => { s.email = a.payload.email; s.eventLog.push(`Email updated to ${a.payload.email}`); }) });
const store40 = configureStore({ reducer: slice40.reducer });
function Ex40_Name() { return <Provider store={store40}><Ex40_Inner /></Provider>; }
function Ex40_Inner() {
  const state = useSelector((s: ReturnType<typeof store40.getState>) => s);
  const d = useDispatch();
  return <div><p>{state.user ? `${state.user} (${state.role})` : "Not logged in"} {state.email && `| ${state.email}`}</p><button onClick={() => d(login40({ user: "Alice", role: "admin" }))}>Login</button><button onClick={() => d(logout40())} disabled={!state.user}>Logout</button><button onClick={() => d(updateProfile40({ email: "alice@example.com" }))} disabled={!state.user}>Update Email</button><ul style={{ fontSize: 11 }}>{state.eventLog.slice(-4).map((l, i) => <li key={i}>{l}</li>)}</ul></div>;
}

// 41. Dispatch with optimistic update + rollback
const slice41 = createSlice({ name: "ex41", initialState: { items: [{ id: 1, name: "Original Item" }] as { id: number; name: string }[], pendingRollback: null as { id: number; name: string }[] | null }, reducers: { optimisticUpdate: (s, a: PayloadAction<{ id: number; name: string }>) => { s.pendingRollback = JSON.parse(JSON.stringify(s.items)); const i = s.items.find(i => i.id === a.payload.id); if (i) i.name = a.payload.name; }, commitUpdate: (s) => { s.pendingRollback = null; }, rollbackUpdate: (s) => { if (s.pendingRollback) { s.items = s.pendingRollback; s.pendingRollback = null; } } } });
const store41 = configureStore({ reducer: slice41.reducer });
function Ex41_Name() { return <Provider store={store41}><Ex41_Inner /></Provider>; }
function Ex41_Inner() {
  const { items, pendingRollback } = useSelector((s: ReturnType<typeof store41.getState>) => s);
  const d = useDispatch();
  const [v, setV] = useState("Updated Item");
  const handleUpdate = () => {
    d(slice41.actions.optimisticUpdate({ id: 1, name: v }));
    const succeed = Math.random() > 0.4;
    setTimeout(() => { d(succeed ? slice41.actions.commitUpdate() : slice41.actions.rollbackUpdate()); }, 1000);
  };
  return <div><p>Item: {items[0]?.name} {pendingRollback ? "(saving...)" : ""}</p><input value={v} onChange={e => setV(e.target.value)} /><button onClick={handleUpdate} disabled={!!pendingRollback}>Update (60% success)</button><p style={{ fontSize: 11 }}>Will auto-commit or rollback after 1s</p></div>;
}

// 42. Event-driven action dispatch
const slice42 = createSlice({ name: "ex42", initialState: { events: [] as { type: string; data: string }[], listeners: [] as string[] }, reducers: { recordEvent: (s, a: PayloadAction<{ type: string; data: string }>) => { s.events.unshift(a.payload); if (s.events.length > 8) s.events.pop(); } } });
const store42 = configureStore({ reducer: slice42.reducer });
function Ex42_Name() { return <Provider store={store42}><Ex42_Inner /></Provider>; }
function Ex42_Inner() {
  const { events } = useSelector((s: ReturnType<typeof store42.getState>) => s);
  const d = useDispatch();
  useEffect(() => {
    const handlers: Record<string, EventListener> = {
      click: () => d(slice42.actions.recordEvent({ type: "click", data: `at ${Date.now() % 1000}` })),
      keydown: (e) => d(slice42.actions.recordEvent({ type: "keydown", data: (e as KeyboardEvent).key })),
    };
    Object.entries(handlers).forEach(([evt, h]) => document.addEventListener(evt, h));
    return () => Object.entries(handlers).forEach(([evt, h]) => document.removeEventListener(evt, h));
  }, [d]);
  return <div><p>Listening to window click & keydown events</p><p style={{ fontSize: 11 }}>Click anywhere or press a key</p><ul style={{ fontSize: 11 }}>{events.map((e, i) => <li key={i}>[{e.type}] {e.data}</li>)}</ul></div>;
}

// 43. Keyboard shortcut dispatch
const slice43 = createSlice({ name: "ex43", initialState: { count: 0, lastKey: "", actions: [] as string[] }, reducers: { handleShortcut: (s, a: PayloadAction<string>) => { s.lastKey = a.payload; if (a.payload === "ArrowUp") { s.count++; s.actions.push("+1"); } if (a.payload === "ArrowDown") { s.count--; s.actions.push("-1"); } if (a.payload === "r") { s.count = 0; s.actions.push("reset"); } } } });
const store43 = configureStore({ reducer: slice43.reducer });
function Ex43_Name() { return <Provider store={store43}><Ex43_Inner /></Provider>; }
function Ex43_Inner() {
  const { count, lastKey, actions } = useSelector((s: ReturnType<typeof store43.getState>) => s);
  const d = useDispatch();
  const divRef = useRef<HTMLDivElement>(null);
  return <div ref={divRef} tabIndex={0} onKeyDown={e => d(slice43.actions.handleShortcut(e.key))} style={{ outline: "2px solid #4caf50", padding: 8 }} onClick={() => divRef.current?.focus()}><p>Count: {count} | Last key: {lastKey || "none"}</p><p style={{ fontSize: 11 }}>Click here then use ↑↓ keys or 'r' to reset</p><p style={{ fontSize: 11 }}>[{actions.slice(-5).join(", ")}]</p></div>;
}

// 44. Debounced dispatch
const slice44 = createSlice({ name: "ex44", initialState: { searchTerm: "", results: [] as string[], callCount: 0 }, reducers: { setSearch: (s, a: PayloadAction<string>) => { s.searchTerm = a.payload; s.callCount++; const fruits = ["Apple", "Apricot", "Banana", "Blueberry", "Cherry", "Cranberry", "Date", "Elderberry"]; s.results = fruits.filter(f => f.toLowerCase().startsWith(a.payload.toLowerCase())); } } });
const store44 = configureStore({ reducer: slice44.reducer });
function Ex44_Name() { return <Provider store={store44}><Ex44_Inner /></Provider>; }
function Ex44_Inner() {
  const { searchTerm, results, callCount } = useSelector((s: ReturnType<typeof store44.getState>) => s);
  const d = useDispatch();
  const [inputVal, setInputVal] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const handleChange = (v: string) => { setInputVal(v); clearTimeout(timerRef.current); timerRef.current = setTimeout(() => d(slice44.actions.setSearch(v)), 400); };
  return <div><input value={inputVal} onChange={e => handleChange(e.target.value)} placeholder="Type to search (debounced 400ms)" style={{ width: 220 }} /><p style={{ fontSize: 11 }}>Dispatched: {callCount} times | Term: "{searchTerm}"</p><ul>{results.map(r => <li key={r}>{r}</li>)}</ul></div>;
}

// 45. Throttled dispatch
const slice45 = createSlice({ name: "ex45", initialState: { position: 0, moves: 0, throttledMoves: 0 }, reducers: { rawMove: (s, a: PayloadAction<number>) => { s.position = a.payload; s.moves++; }, throttledMove: (s, a: PayloadAction<number>) => { s.position = a.payload; s.throttledMoves++; } } });
const store45 = configureStore({ reducer: slice45.reducer });
function Ex45_Name() { return <Provider store={store45}><Ex45_Inner /></Provider>; }
function Ex45_Inner() {
  const { position, moves, throttledMoves } = useSelector((s: ReturnType<typeof store45.getState>) => s);
  const d = useDispatch();
  const lastThrottle = useRef(0);
  const handleMove = (x: number) => {
    d(slice45.actions.rawMove(x));
    const now = Date.now();
    if (now - lastThrottle.current > 200) { lastThrottle.current = now; d(slice45.actions.throttledMove(x)); }
  };
  return <div><div style={{ width: 300, height: 40, background: "#eee", position: "relative", cursor: "crosshair" }} onMouseMove={e => { const rect = e.currentTarget.getBoundingClientRect(); handleMove(Math.round(e.clientX - rect.left)); }}><div style={{ position: "absolute", top: "50%", left: position, transform: "translateY(-50%)", width: 8, height: 8, background: "#4caf50", borderRadius: "50%" }} /></div><p style={{ fontSize: 11 }}>Raw moves: {moves} | Throttled dispatches: {throttledMoves} | x: {position}</p></div>;
}

// 46. Action replay pattern
const slice46 = createSlice({ name: "ex46", initialState: { count: 0, recording: [] as string[], replaying: false }, reducers: { inc: (s) => { s.count++; if (!s.replaying) s.recording.push("inc"); }, dec: (s) => { s.count--; if (!s.replaying) s.recording.push("dec"); }, dbl: (s) => { s.count *= 2; if (!s.replaying) s.recording.push("dbl"); }, reset: (s) => { s.count = 0; s.recording = []; s.replaying = false; }, setReplaying: (s, a: PayloadAction<boolean>) => { s.replaying = a.payload; } } });
const store46 = configureStore({ reducer: slice46.reducer });
function Ex46_Name() { return <Provider store={store46}><Ex46_Inner /></Provider>; }
function Ex46_Inner() {
  const { count, recording, replaying } = useSelector((s: ReturnType<typeof store46.getState>) => s);
  const d = useDispatch();
  const replay = () => {
    const rec = [...recording];
    d(slice46.actions.reset());
    d(slice46.actions.setReplaying(true));
    rec.forEach((action, i) => setTimeout(() => {
      if (action === "inc") d(slice46.actions.inc());
      if (action === "dec") d(slice46.actions.dec());
      if (action === "dbl") d(slice46.actions.dbl());
      if (i === rec.length - 1) setTimeout(() => d(slice46.actions.setReplaying(false)), 100);
    }, i * 300));
  };
  return <div><p>Count: {count} {replaying ? "(replaying...)" : ""}</p><div><button onClick={() => d(slice46.actions.inc())}>+1</button><button onClick={() => d(slice46.actions.dec())}>-1</button><button onClick={() => d(slice46.actions.dbl())}>×2</button></div><p style={{ fontSize: 11 }}>Recording: [{recording.join("→")}]</p><button onClick={replay} disabled={!recording.length || replaying}>Replay</button><button onClick={() => d(slice46.actions.reset())}>Reset</button></div>;
}

// 47. Cross-slice action handling (extraReducers)
const authSlice47 = createSlice({ name: "ex47_auth", initialState: { user: null as string | null }, reducers: { login: (s, a: PayloadAction<string>) => { s.user = a.payload; }, logout: (s) => { s.user = null; } } });
const dataSlice47 = createSlice({ name: "ex47_data", initialState: { items: [] as string[], status: "idle" }, reducers: { addItem: (s, a: PayloadAction<string>) => { s.items.push(a.payload); } }, extraReducers: b => b.addCase(authSlice47.actions.login, (s) => { s.status = "authenticated"; s.items = ["Welcome data!"]; }).addCase(authSlice47.actions.logout, (s) => { s.status = "idle"; s.items = []; }) });
const store47 = configureStore({ reducer: { auth: authSlice47.reducer, data: dataSlice47.reducer } });
type RS47 = ReturnType<typeof store47.getState>;
function Ex47_Name() { return <Provider store={store47}><Ex47_Inner /></Provider>; }
function Ex47_Inner() {
  const { auth, data } = useSelector((s: RS47) => s);
  const d = useDispatch();
  return <div><p>Auth: {auth.user ?? "none"} | Data status: {data.status}</p><p>Items: {data.items.length ? data.items.join(", ") : "empty"}</p>{auth.user ? <><button onClick={() => d(dataSlice47.actions.addItem(`item${data.items.length + 1}`))}>Add Item</button><button onClick={() => d(authSlice47.actions.logout())}>Logout</button></> : <button onClick={() => d(authSlice47.actions.login("Alice"))}>Login</button>}<p style={{ fontSize: 11 }}>Logout clears data slice via extraReducers</p></div>;
}

// 48. Action middleware (transform before reducer)
const transformMiddleware48 = (_: unknown) => (next: (a: unknown) => unknown) => (action: unknown) => {
  if (isAction(action) && action.type === "ex48/addText") {
    const a = action as { type: string; payload: string };
    return next({ ...a, payload: a.payload.trim().toUpperCase() });
  }
  return next(action);
};
const slice48 = createSlice({ name: "ex48", initialState: [] as string[], reducers: { addText: (s, a: PayloadAction<string>) => { s.push(a.payload); } } });
const store48 = configureStore({ reducer: slice48.reducer, middleware: gDM => gDM().concat(transformMiddleware48 as ReturnType<typeof gDM>[number]) });
function Ex48_Name() { return <Provider store={store48}><Ex48_Inner /></Provider>; }
function Ex48_Inner() {
  const items = useSelector((s: ReturnType<typeof store48.getState>) => s);
  const d = useDispatch();
  const [v, setV] = useState("  hello world  ");
  return <div><input value={v} onChange={e => setV(e.target.value)} style={{ width: 200 }} /><button onClick={() => { d(slice48.actions.addText(v)); setV(""); }}>Add (middleware trims+uppercases)</button><ul>{items.map((i, idx) => <li key={idx}>{i}</li>)}</ul></div>;
}

// 49. Action analytics/tracking
interface AnalyticsEvent49 { action: string; count: number; lastSeen: string; }
const analyticsSlice49 = createSlice({ name: "ex49_analytics", initialState: {} as Record<string, AnalyticsEvent49>, reducers: { track: (s, a: PayloadAction<string>) => { if (!s[a.payload]) s[a.payload] = { action: a.payload, count: 0, lastSeen: "" }; s[a.payload].count++; s[a.payload].lastSeen = new Date().toLocaleTimeString(); } } });
const appSlice49 = createSlice({ name: "ex49_app", initialState: { page: "home", darkMode: false, count: 0 }, reducers: { navigate: (s, a: PayloadAction<string>) => { s.page = a.payload; }, toggleDark: (s) => { s.darkMode = !s.darkMode; }, increment: (s) => { s.count++; } } });
const analyticsMiddleware49 = (store: { dispatch: (a: unknown) => unknown }) => (next: (a: unknown) => unknown) => (action: unknown) => {
  if (isAction(action)) store.dispatch(analyticsSlice49.actions.track(action.type));
  return next(action);
};
const store49 = configureStore({ reducer: { app: appSlice49.reducer, analytics: analyticsSlice49.reducer }, middleware: gDM => gDM().concat(analyticsMiddleware49 as ReturnType<typeof gDM>[number]) });
type RS49 = ReturnType<typeof store49.getState>;
function Ex49_Name() { return <Provider store={store49}><Ex49_Inner /></Provider>; }
function Ex49_Inner() {
  const { app, analytics } = useSelector((s: RS49) => s);
  const d = useDispatch();
  return <div><p>Page: {app.page} | Dark: {String(app.darkMode)} | Count: {app.count}</p><div><button onClick={() => d(appSlice49.actions.navigate("about"))}>Go About</button><button onClick={() => d(appSlice49.actions.toggleDark())}>Toggle Dark</button><button onClick={() => d(appSlice49.actions.increment())}>Increment</button></div><h4 style={{ fontSize: 12 }}>Analytics:</h4><ul style={{ fontSize: 11 }}>{Object.values(analytics).filter(e => !e.action.includes("track")).map(e => <li key={e.action}>{e.action}: {e.count}x @ {e.lastSeen}</li>)}</ul></div>;
}

// 50. Full dispatch system (keyboard + mouse + timer driven)
const slice50 = createSlice({ name: "ex50", initialState: { score: 0, streak: 0, events: [] as { source: string; action: string; time: string }[], mousePos: { x: 0, y: 0 }, timerTick: 0, combo: 1 }, reducers: { keyAction: (s, a: PayloadAction<string>) => { const t = new Date().toLocaleTimeString(); if (a.payload === "Space") { s.score += 10 * s.combo; s.streak++; s.combo = Math.min(5, Math.ceil(s.streak / 3)); s.events.unshift({ source: "keyboard", action: "+10pts (combo x" + s.combo + ")", time: t }); } if (a.payload === "r") { s.score = 0; s.streak = 0; s.combo = 1; s.events.unshift({ source: "keyboard", action: "reset", time: t }); } if (s.events.length > 8) s.events.pop(); }, mouseClick: (s, a: PayloadAction<{ x: number; y: number }>) => { s.mousePos = a.payload; s.score += 1; s.events.unshift({ source: "mouse", action: `+1pt at (${a.payload.x},${a.payload.y})`, time: new Date().toLocaleTimeString() }); if (s.events.length > 8) s.events.pop(); }, timerTick: (s) => { s.timerTick++; if (s.timerTick % 10 === 0) { s.score = Math.max(0, s.score - 1); } }, breakStreak: (s) => { s.streak = 0; s.combo = 1; } } });
const store50 = configureStore({ reducer: slice50.reducer });
function Ex50_Name() { return <Provider store={store50}><Ex50_Inner /></Provider>; }
function Ex50_Inner() {
  const state = useSelector((s: ReturnType<typeof store50.getState>) => s);
  const d = useDispatch();
  const areaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = setInterval(() => d(slice50.actions.timerTick()), 100);
    const onKey = (e: KeyboardEvent) => { if (e.code === "Space" || e.key === "r") { e.preventDefault(); d(slice50.actions.keyAction(e.code === "Space" ? "Space" : "r")); } };
    window.addEventListener("keydown", onKey);
    return () => { clearInterval(t); window.removeEventListener("keydown", onKey); };
  }, [d]);
  const handleClick = (e: React.MouseEvent) => { const rect = e.currentTarget.getBoundingClientRect(); d(slice50.actions.mouseClick({ x: Math.round(e.clientX - rect.left), y: Math.round(e.clientY - rect.top) })); };
  return <div ref={areaRef} tabIndex={0} style={{ border: "2px solid #4caf50", padding: 8, userSelect: "none" }} onClick={handleClick} onMouseLeave={() => d(slice50.actions.breakStreak())}><p><strong>Score: {state.score}</strong> | Streak: {state.streak} | Combo: x{state.combo} | Tick: {state.timerTick}</p><div style={{ height: 80, background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "crosshair" }}><span style={{ fontSize: 12, color: "#999" }}>Click here (+1pt) | Press Space (+10pt) | Press R to reset</span></div><ul style={{ fontSize: 11, maxHeight: 100, overflowY: "auto" }}>{state.events.map((e, i) => <li key={i}>[{e.source}] {e.action} @ {e.time}</li>)}</ul></div>;
}

// ─── EXPORT ────────────────────────────────────────────────────────────────────

export default function ActionsDispatchExamples() {
  const sections = [
    { label: "BASIC", examples: [{ n: "01", C: Ex01_Name, title: "createAction basic" }, { n: "02", C: Ex02_Name, title: "Action with payload" }, { n: "03", C: Ex03_Name, title: "Action with prepare callback" }, { n: "04", C: Ex04_Name, title: "Multiple action creators" }, { n: "05", C: Ex05_Name, title: "Dispatch from button click" }, { n: "06", C: Ex06_Name, title: "Dispatch from input change" }, { n: "07", C: Ex07_Name, title: "Dispatch on mount" }, { n: "08", C: Ex08_Name, title: "Action type string" }, { n: "09", C: Ex09_Name, title: "Action matching" }, { n: "10", C: Ex10_Name, title: "Batch dispatch" }, { n: "11", C: Ex11_Name, title: "Conditional dispatch" }, { n: "12", C: Ex12_Name, title: "Dispatch with callback" }] },
    { label: "INTERMEDIATE", examples: [{ n: "13", C: Ex13_Name, title: "createSlice auto actions" }, { n: "14", C: Ex14_Name, title: "Typed payload" }, { n: "15", C: Ex15_Name, title: "Event handler dispatch" }, { n: "16", C: Ex16_Name, title: "Dispatch from child" }, { n: "17", C: Ex17_Name, title: "Action with metadata" }, { n: "18", C: Ex18_Name, title: "Reset action" }, { n: "19", C: Ex19_Name, title: "Toggle action" }, { n: "20", C: Ex20_Name, title: "Bounded inc/dec" }, { n: "21", C: Ex21_Name, title: "Select action" }, { n: "22", C: Ex22_Name, title: "Form submit dispatch" }, { n: "23", C: Ex23_Name, title: "Action logging middleware" }, { n: "24", C: Ex24_Name, title: "Action batching" }, { n: "25", C: Ex25_Name, title: "Dispatch chain" }] },
    { label: "NESTED", examples: [{ n: "26", C: Ex26_Name, title: "Nested state update" }, { n: "27", C: Ex27_Name, title: "Array manipulation" }, { n: "28", C: Ex28_Name, title: "Normalized entities" }, { n: "29", C: Ex29_Name, title: "Multi-slice dispatch" }, { n: "30", C: Ex30_Name, title: "Parent/child relations" }, { n: "31", C: Ex31_Name, title: "Payload transformation" }, { n: "32", C: Ex32_Name, title: "Undo/redo actions" }, { n: "33", C: Ex33_Name, title: "Multi-step wizard" }, { n: "34", C: Ex34_Name, title: "Drag-and-drop reorder" }, { n: "35", C: Ex35_Name, title: "Filter+sort+paginate" }, { n: "36", C: Ex36_Name, title: "Tree operations" }, { n: "37", C: Ex37_Name, title: "Real-time feed insert" }] },
    { label: "ADVANCED", examples: [{ n: "38", C: Ex38_Name, title: "prepare callback complex" }, { n: "39", C: Ex39_Name, title: "Action creator factories" }, { n: "40", C: Ex40_Name, title: "Type-safe matching" }, { n: "41", C: Ex41_Name, title: "Optimistic + rollback" }, { n: "42", C: Ex42_Name, title: "Event-driven dispatch" }, { n: "43", C: Ex43_Name, title: "Keyboard shortcuts" }, { n: "44", C: Ex44_Name, title: "Debounced dispatch" }, { n: "45", C: Ex45_Name, title: "Throttled dispatch" }, { n: "46", C: Ex46_Name, title: "Action replay" }, { n: "47", C: Ex47_Name, title: "Cross-slice extraReducers" }, { n: "48", C: Ex48_Name, title: "Transform middleware" }, { n: "49", C: Ex49_Name, title: "Analytics tracking" }, { n: "50", C: Ex50_Name, title: "Full dispatch system" }] },
  ];
  return (
    <div style={{ fontFamily: "sans-serif", padding: 16 }}>
      <h1>Actions &amp; Dispatch — 50 Examples</h1>
      {sections.map(sec => (
        <div key={sec.label}>
          <h2 style={{ background: "#333", color: "#fff", padding: "4px 8px" }}>{sec.label}</h2>
          {sec.examples.map(({ n, C, title }) => (
            <div key={n} style={{ border: "1px solid #ddd", margin: "8px 0", padding: 12 }}>
              <h3 style={{ margin: "0 0 8px" }}>#{n} — {title}</h3>
              <C />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
