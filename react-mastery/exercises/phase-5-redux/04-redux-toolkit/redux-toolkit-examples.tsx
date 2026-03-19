import React, { useState, useEffect, useRef } from "react";
import {
  configureStore,
  createSlice,
  createAction,
  createReducer,
  createEntityAdapter,
  PayloadAction,
  combineReducers,
} from "@reduxjs/toolkit";
import { Provider, useSelector, useDispatch } from "react-redux";

// ─── BASIC 1–12 ────────────────────────────────────────────────────────────────

// 1. createSlice basic
const slice01 = createSlice({ name: "ex01", initialState: 0, reducers: { increment: s => s + 1, decrement: s => s - 1 } });
const store01 = configureStore({ reducer: slice01.reducer });
function Ex01_Name() { return <Provider store={store01}><Ex01_Inner /></Provider>; }
function Ex01_Inner() {
  const n = useSelector((s: ReturnType<typeof store01.getState>) => s);
  const d = useDispatch();
  return <div><p>Slice name: "{slice01.name}" | value: {n}</p><button onClick={() => d(slice01.actions.increment())}>+</button><button onClick={() => d(slice01.actions.decrement())}>-</button></div>;
}

// 2. configureStore basic
const slice02 = createSlice({ name: "ex02", initialState: { message: "Hello from configureStore!" }, reducers: { setMessage: (s, a: PayloadAction<string>) => { s.message = a.payload; } } });
const store02 = configureStore({ reducer: slice02.reducer });
// configureStore auto-adds: redux-thunk middleware, DevTools extension, serializability checks
function Ex02_Name() { return <Provider store={store02}><Ex02_Inner /></Provider>; }
function Ex02_Inner() {
  const msg = useSelector((s: ReturnType<typeof store02.getState>) => s.message);
  const d = useDispatch();
  const [v, setV] = useState("");
  return <div><p>{msg}</p><input value={v} onChange={e => setV(e.target.value)} /><button onClick={() => { d(slice02.actions.setMessage(v)); setV(""); }}>Update</button></div>;
}

// 3. createSlice with initialState
interface UserState03 { name: string; email: string; role: string; lastSeen: string; }
const slice03 = createSlice({ name: "ex03", initialState: { name: "Alice", email: "alice@ex.com", role: "user", lastSeen: new Date().toISOString() } as UserState03, reducers: { setName: (s, a: PayloadAction<string>) => { s.name = a.payload; }, promote: s => { s.role = "admin"; }, touch: s => { s.lastSeen = new Date().toISOString(); } } });
const store03 = configureStore({ reducer: slice03.reducer });
function Ex03_Name() { return <Provider store={store03}><Ex03_Inner /></Provider>; }
function Ex03_Inner() {
  const u = useSelector((s: ReturnType<typeof store03.getState>) => s);
  const d = useDispatch();
  return <div><p>{u.name} ({u.role}) — {u.email}</p><p style={{ fontSize: 11 }}>Last seen: {u.lastSeen.slice(11, 19)}</p><button onClick={() => d(slice03.actions.promote())}>Promote to Admin</button><button onClick={() => d(slice03.actions.touch())}>Touch</button></div>;
}

// 4. Slice actions auto-generated
const slice04 = createSlice({ name: "ex04", initialState: { count: 0, label: "zero" }, reducers: { up: s => { s.count++; s.label = s.count > 0 ? "positive" : "zero"; }, down: s => { s.count--; s.label = s.count < 0 ? "negative" : "zero"; }, reset: () => ({ count: 0, label: "zero" }) } });
const store04 = configureStore({ reducer: slice04.reducer });
function Ex04_Name() { return <Provider store={store04}><Ex04_Inner /></Provider>; }
function Ex04_Inner() {
  const state = useSelector((s: ReturnType<typeof store04.getState>) => s);
  const d = useDispatch();
  return <div><p>{state.count} — {state.label}</p><p style={{ fontSize: 11 }}>Action types: {Object.values(slice04.actions).map((a: { type: string }) => a.type).join(", ")}</p><button onClick={() => d(slice04.actions.up())}>Up</button><button onClick={() => d(slice04.actions.down())}>Down</button><button onClick={() => d(slice04.actions.reset())}>Reset</button></div>;
}

// 5. Slice reducer
const slice05 = createSlice({ name: "ex05", initialState: { value: 10, operations: [] as string[] }, reducers: { double: s => { s.operations.push(`×2 (${s.value}→${s.value * 2})`); s.value *= 2; }, halve: s => { s.operations.push(`÷2 (${s.value}→${Math.floor(s.value / 2)})`); s.value = Math.floor(s.value / 2); }, add: (s, a: PayloadAction<number>) => { s.operations.push(`+${a.payload} (${s.value}→${s.value + a.payload})`); s.value += a.payload; } } });
const store05 = configureStore({ reducer: slice05.reducer });
function Ex05_Name() { return <Provider store={store05}><Ex05_Inner /></Provider>; }
function Ex05_Inner() {
  const { value, operations } = useSelector((s: ReturnType<typeof store05.getState>) => s);
  const d = useDispatch();
  return <div><p>Value: <strong>{value}</strong></p><button onClick={() => d(slice05.actions.double())}>×2</button><button onClick={() => d(slice05.actions.halve())}>÷2</button><button onClick={() => d(slice05.actions.add(7))}>+7</button><ul style={{ fontSize: 11 }}>{operations.slice(-5).map((o, i) => <li key={i}>{o}</li>)}</ul></div>;
}

// 6. configureStore with multiple slices
const counterSlice06 = createSlice({ name: "ex06_c", initialState: 0, reducers: { inc: s => s + 1 } });
const textSlice06 = createSlice({ name: "ex06_t", initialState: "", reducers: { set: (_s, a: PayloadAction<string>) => a.payload } });
const flagSlice06 = createSlice({ name: "ex06_f", initialState: false, reducers: { toggle: s => !s } });
const store06 = configureStore({ reducer: { counter: counterSlice06.reducer, text: textSlice06.reducer, flag: flagSlice06.reducer } });
type RS06 = ReturnType<typeof store06.getState>;
function Ex06_Name() { return <Provider store={store06}><Ex06_Inner /></Provider>; }
function Ex06_Inner() {
  const { counter, text, flag } = useSelector((s: RS06) => s);
  const d = useDispatch();
  const [v, setV] = useState("");
  return <div><p>counter:{counter} | text:"{text}" | flag:{String(flag)}</p><button onClick={() => d(counterSlice06.actions.inc())}>Inc</button><input value={v} onChange={e => setV(e.target.value)} /><button onClick={() => { d(textSlice06.actions.set(v)); setV(""); }}>Set Text</button><button onClick={() => d(flagSlice06.actions.toggle())}>Toggle Flag</button></div>;
}

// 7. createReducer (map notation)
const add07 = createAction<number>("ex07/add");
const sub07 = createAction<number>("ex07/subtract");
const mul07 = createAction<number>("ex07/multiply");
const clr07 = createAction("ex07/clear");
const reducer07 = createReducer({ value: 0, history: [] as string[] }, builder => builder
  .addCase(add07, (s, a) => { s.history.push(`+${a.payload}`); s.value += a.payload; })
  .addCase(sub07, (s, a) => { s.history.push(`-${a.payload}`); s.value -= a.payload; })
  .addCase(mul07, (s, a) => { s.history.push(`×${a.payload}`); s.value *= a.payload; })
  .addCase(clr07, s => { s.history.push("clear"); s.value = 0; })
);
const store07 = configureStore({ reducer: reducer07 });
function Ex07_Name() { return <Provider store={store07}><Ex07_Inner /></Provider>; }
function Ex07_Inner() {
  const { value, history } = useSelector((s: ReturnType<typeof store07.getState>) => s);
  const d = useDispatch();
  return <div><p>Value: {value}</p><div>{[[add07, 5], [sub07, 3], [mul07, 2]].map(([action, n]) => <button key={String((action as { type: string }).type)} onClick={() => d((action as (n: number) => { type: string; payload: number })(n as number))}>{(action as { type: string }).type.split("/")[1]} {n}</button>)}</div><button onClick={() => d(clr07())}>Clear</button><p style={{ fontSize: 11 }}>History: {history.slice(-5).join(" → ")}</p></div>;
}

// 8. createAction standalone
const setColor08 = createAction<string>("ex08/setColor");
const resetColor08 = createAction("ex08/resetColor");
const rotateColors08 = createAction<number>("ex08/rotateColors");
const reducer08 = createReducer({ color: "#3f51b5", history: [] as string[] }, builder => builder
  .addCase(setColor08, (s, a) => { s.history.push(s.color); s.color = a.payload; })
  .addCase(resetColor08, s => { s.color = "#3f51b5"; s.history = []; })
  .addCase(rotateColors08, (s, a) => { const colors = ["#f44336", "#4caf50", "#2196f3", "#ff9800", "#9c27b0"]; s.history.push(s.color); s.color = colors[a.payload % colors.length]; })
);
const store08 = configureStore({ reducer: reducer08 });
function Ex08_Name() { return <Provider store={store08}><Ex08_Inner /></Provider>; }
function Ex08_Inner() {
  const { color, history } = useSelector((s: ReturnType<typeof store08.getState>) => s);
  const d = useDispatch();
  const [idx, setIdx] = useState(0);
  return <div><div style={{ width: 60, height: 60, background: color, borderRadius: 4, margin: "4px 0" }} /><input type="color" value={color} onChange={e => d(setColor08(e.target.value))} /><button onClick={() => { d(rotateColors08(idx)); setIdx(i => i + 1); }}>Rotate</button><button onClick={() => d(resetColor08())}>Reset</button><p style={{ fontSize: 11 }}>Prev: {history.slice(-3).join(" → ")}</p></div>;
}

// 9. Slice with prepare reducer
const slice09 = createSlice({ name: "ex09", initialState: [] as { id: string; text: string; priority: number; created: string }[], reducers: { addTask: { reducer(s, a: PayloadAction<{ id: string; text: string; priority: number; created: string }>) { s.push(a.payload); }, prepare(text: string, priority: number) { return { payload: { id: `${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, text, priority, created: new Date().toLocaleTimeString() } }; } }, remove: (s, a: PayloadAction<string>) => s.filter(t => t.id !== a.payload) } });
const store09 = configureStore({ reducer: slice09.reducer });
function Ex09_Name() { return <Provider store={store09}><Ex09_Inner /></Provider>; }
function Ex09_Inner() {
  const tasks = useSelector((s: ReturnType<typeof store09.getState>) => [...s].sort((a, b) => b.priority - a.priority));
  const d = useDispatch();
  const [v, setV] = useState("");
  const [p, setP] = useState(1);
  return <div><input value={v} onChange={e => setV(e.target.value)} placeholder="Task name" /><select value={p} onChange={e => setP(Number(e.target.value))}><option value={1}>Low</option><option value={2}>Medium</option><option value={3}>High</option></select><button onClick={() => { if (v) { d(slice09.actions.addTask(v, p)); setV(""); } }}>Add</button><ul>{tasks.map(t => <li key={t.id}>P{t.priority}: {t.text} <span style={{ fontSize: 10 }}>{t.created}</span> <button onClick={() => d(slice09.actions.remove(t.id))}>x</button></li>)}</ul></div>;
}

// 10. Slice extraReducers (builder notation)
const globalReset10 = createAction("global/reset");
const counterSlice10 = createSlice({ name: "ex10_counter", initialState: { count: 0, resets: 0 }, reducers: { inc: s => { s.count++; }, dec: s => { s.count--; } }, extraReducers: b => b.addCase(globalReset10, s => { s.count = 0; s.resets++; }) });
const textSlice10 = createSlice({ name: "ex10_text", initialState: { text: "hello", resets: 0 }, reducers: { set: (s, a: PayloadAction<string>) => { s.text = a.payload; } }, extraReducers: b => b.addCase(globalReset10, s => { s.text = "hello"; s.resets++; }) });
const store10 = configureStore({ reducer: { counter: counterSlice10.reducer, text: textSlice10.reducer } });
type RS10 = ReturnType<typeof store10.getState>;
function Ex10_Name() { return <Provider store={store10}><Ex10_Inner /></Provider>; }
function Ex10_Inner() {
  const { counter, text } = useSelector((s: RS10) => s);
  const d = useDispatch();
  const [v, setV] = useState("");
  return <div><p>Counter: {counter.count} (resets: {counter.resets}) | Text: "{text.text}" (resets: {text.resets})</p><button onClick={() => d(counterSlice10.actions.inc())}>+</button><button onClick={() => d(counterSlice10.actions.dec())}>-</button><input value={v} onChange={e => setV(e.target.value)} /><button onClick={() => { d(textSlice10.actions.set(v)); setV(""); }}>Set</button><button onClick={() => d(globalReset10())} style={{ background: "#f44336", color: "#fff" }}>Global Reset</button></div>;
}

// 11. createSlice with complex state type
interface GameState11 { players: { id: number; name: string; hp: number; maxHp: number; status: "alive" | "dead" }[]; round: number; phase: "setup" | "battle" | "end"; winner: string | null; }
const slice11 = createSlice({ name: "ex11", initialState: { players: [{ id: 1, name: "Hero", hp: 100, maxHp: 100, status: "alive" }, { id: 2, name: "Boss", hp: 80, maxHp: 80, status: "alive" }], round: 1, phase: "setup", winner: null } as GameState11, reducers: { startBattle: s => { s.phase = "battle"; }, attack: (s, a: PayloadAction<{ attackerId: number; targetId: number; dmg: number }>) => { const target = s.players.find(p => p.id === a.payload.targetId); if (target) { target.hp = Math.max(0, target.hp - a.payload.dmg); if (target.hp === 0) { target.status = "dead"; s.winner = s.players.find(p => p.id !== target.id)?.name ?? null; s.phase = "end"; } } s.round++; } } });
const store11 = configureStore({ reducer: slice11.reducer });
function Ex11_Name() { return <Provider store={store11}><Ex11_Inner /></Provider>; }
function Ex11_Inner() {
  const { players, round, phase, winner } = useSelector((s: ReturnType<typeof store11.getState>) => s);
  const d = useDispatch();
  const hpBar = (hp: number, max: number) => <div style={{ background: "#eee", height: 8, width: 100, borderRadius: 4 }}><div style={{ background: hp / max > 0.5 ? "#4caf50" : "#f44336", height: "100%", width: `${(hp / max) * 100}%`, borderRadius: 4 }} /></div>;
  return <div><p>Round {round} — Phase: {phase}</p>{players.map(p => <div key={p.id}>{p.name}: {p.hp}/{p.maxHp}{hpBar(p.hp, p.maxHp)}</div>)}{phase === "setup" && <button onClick={() => d(slice11.actions.startBattle())}>Start Battle</button>}{phase === "battle" && <div><button onClick={() => d(slice11.actions.attack({ attackerId: 1, targetId: 2, dmg: Math.floor(Math.random() * 20) + 5 }))}>Hero Attacks Boss</button><button onClick={() => d(slice11.actions.attack({ attackerId: 2, targetId: 1, dmg: Math.floor(Math.random() * 15) + 5 }))}>Boss Attacks Hero</button></div>}{phase === "end" && <p><strong>{winner} wins!</strong></p>}</div>;
}

// 12. configureStore with middleware
const timingMiddleware12 = (_: unknown) => (next: (a: unknown) => unknown) => (action: unknown) => {
  const start = performance.now();
  const result = next(action);
  const duration = performance.now() - start;
  if (process.env.NODE_ENV !== "production") console.log(`[Timing] ${(action as { type: string }).type}: ${duration.toFixed(2)}ms`);
  return result;
};
const slice12 = createSlice({ name: "ex12", initialState: { items: [] as number[], sum: 0 }, reducers: { add: (s, a: PayloadAction<number>) => { s.items.push(a.payload); s.sum = s.items.reduce((a, b) => a + b, 0); }, clear: s => { s.items = []; s.sum = 0; } } });
const store12 = configureStore({ reducer: slice12.reducer, middleware: gDM => gDM().concat(timingMiddleware12 as ReturnType<typeof gDM>[number]) });
function Ex12_Name() { return <Provider store={store12}><Ex12_Inner /></Provider>; }
function Ex12_Inner() {
  const { items, sum } = useSelector((s: ReturnType<typeof store12.getState>) => s);
  const d = useDispatch();
  return <div><p>Items: [{items.slice(-8).join(", ")}] | Sum: {sum}</p><button onClick={() => { for (let i = 0; i < 5; i++) d(slice12.actions.add(Math.floor(Math.random() * 100))); }}>Add 5 Random</button><button onClick={() => d(slice12.actions.clear())}>Clear</button><p style={{ fontSize: 11 }}>Check console for timing logs</p></div>;
}

// ─── INTERMEDIATE 13–25 ─────────────────────────────────────────────────────────

// 13. Counter slice (full CRUD)
const slice13 = createSlice({ name: "ex13", initialState: { count: 0, step: 1, min: -Infinity, max: Infinity, history: [] as number[] }, reducers: { inc: s => { const next = s.count + s.step; if (next <= s.max) { s.history.push(s.count); s.count = next; } }, dec: s => { const next = s.count - s.step; if (next >= s.min) { s.history.push(s.count); s.count = next; } }, setStep: (s, a: PayloadAction<number>) => { s.step = Math.max(1, a.payload); }, setBounds: (s, a: PayloadAction<{ min: number; max: number }>) => { s.min = a.payload.min; s.max = a.payload.max; s.count = Math.min(Math.max(s.count, s.min), s.max); }, undo: s => { const prev = s.history.pop(); if (prev !== undefined) s.count = prev; }, reset: s => { s.history.push(s.count); s.count = 0; } } });
const store13 = configureStore({ reducer: slice13.reducer });
function Ex13_Name() { return <Provider store={store13}><Ex13_Inner /></Provider>; }
function Ex13_Inner() {
  const { count, step, min, max, history } = useSelector((s: ReturnType<typeof store13.getState>) => s);
  const d = useDispatch();
  return <div><p>Count: {count} (step:{step} min:{isFinite(min) ? min : "-∞"} max:{isFinite(max) ? max : "+∞"})</p><button onClick={() => d(slice13.actions.dec())} disabled={count - step < min}>-{step}</button><button onClick={() => d(slice13.actions.inc())} disabled={count + step > max}>+{step}</button><button onClick={() => d(slice13.actions.undo())} disabled={!history.length}>Undo</button><button onClick={() => d(slice13.actions.reset())}>Reset</button><div><label>Step: <input type="number" value={step} onChange={e => d(slice13.actions.setStep(Number(e.target.value)))} style={{ width: 40 }} /></label> <button onClick={() => d(slice13.actions.setBounds({ min: -10, max: 10 }))}>Set ±10 bounds</button></div></div>;
}

// 14. Todo slice (add/toggle/remove/edit)
interface Todo14 { id: number; text: string; done: boolean; editing: boolean; priority: "low" | "med" | "high"; }
const slice14 = createSlice({ name: "ex14", initialState: { todos: [] as Todo14[], filter: "all" as "all" | "active" | "done", nextId: 1 }, reducers: { add: (s, a: PayloadAction<{ text: string; priority: Todo14["priority"] }>) => { s.todos.push({ id: s.nextId++, text: a.payload.text, done: false, editing: false, priority: a.payload.priority }); }, toggle: (s, a: PayloadAction<number>) => { const t = s.todos.find(t => t.id === a.payload); if (t) t.done = !t.done; }, remove: (s, a: PayloadAction<number>) => { s.todos = s.todos.filter(t => t.id !== a.payload); }, startEdit: (s, a: PayloadAction<number>) => { s.todos.forEach(t => { t.editing = t.id === a.payload; }); }, commitEdit: (s, a: PayloadAction<{ id: number; text: string }>) => { const t = s.todos.find(t => t.id === a.payload.id); if (t) { t.text = a.payload.text; t.editing = false; } }, setFilter: (s, a: PayloadAction<typeof s.filter>) => { s.filter = a.payload; }, clearDone: s => { s.todos = s.todos.filter(t => !t.done); } } });
const store14 = configureStore({ reducer: slice14.reducer });
const prioColors14: Record<string, string> = { low: "#c8e6c9", med: "#fff9c4", high: "#ffcdd2" };
function Ex14_Name() { return <Provider store={store14}><Ex14_Inner /></Provider>; }
function Ex14_Inner() {
  const { todos, filter } = useSelector((s: ReturnType<typeof store14.getState>) => s);
  const d = useDispatch();
  const [v, setV] = useState("");
  const [p, setP] = useState<Todo14["priority"]>("med");
  const [editText, setEditText] = useState("");
  const visible = todos.filter(t => filter === "all" ? true : filter === "active" ? !t.done : t.done);
  return <div><div style={{ display: "flex", gap: 4 }}>{(["all", "active", "done"] as const).map(f => <button key={f} onClick={() => d(slice14.actions.setFilter(f))} style={{ fontWeight: filter === f ? "bold" : "normal" }}>{f}</button>)}<button onClick={() => d(slice14.actions.clearDone())}>Clear done</button></div><ul>{visible.map(t => <li key={t.id} style={{ background: prioColors14[t.priority], padding: 4, marginTop: 2 }}>{t.editing ? <><input value={editText || t.text} onChange={e => setEditText(e.target.value)} /><button onClick={() => d(slice14.actions.commitEdit({ id: t.id, text: editText || t.text }))}>Save</button></> : <><span style={{ textDecoration: t.done ? "line-through" : "none", cursor: "pointer" }} onClick={() => d(slice14.actions.toggle(t.id))}>{t.text}</span><button onClick={() => { d(slice14.actions.startEdit(t.id)); setEditText(t.text); }}>✎</button><button onClick={() => d(slice14.actions.remove(t.id))}>x</button></>}</li>)}</ul><div style={{ display: "flex", gap: 4 }}><input value={v} onChange={e => setV(e.target.value)} placeholder="New todo..." /><select value={p} onChange={e => setP(e.target.value as Todo14["priority"])}><option value="low">Low</option><option value="med">Med</option><option value="high">High</option></select><button onClick={() => { if (v) { d(slice14.actions.add({ text: v, priority: p })); setV(""); } }}>Add</button></div></div>;
}

// 15. Auth slice (login/logout/profile)
interface AuthState15 { user: null | { id: number; name: string; email: string; role: string; token: string }; loading: boolean; error: string | null; }
const slice15 = createSlice({ name: "ex15", initialState: { user: null, loading: false, error: null } as AuthState15, reducers: { loginStart: s => { s.loading = true; s.error = null; }, loginSuccess: (s, a: PayloadAction<AuthState15["user"]>) => { s.user = a.payload; s.loading = false; }, loginFailure: (s, a: PayloadAction<string>) => { s.error = a.payload; s.loading = false; }, logout: s => { s.user = null; }, updateProfile: (s, a: PayloadAction<{ name?: string; email?: string }>) => { if (s.user) Object.assign(s.user, a.payload); } } });
const store15 = configureStore({ reducer: slice15.reducer });
function Ex15_Name() { return <Provider store={store15}><Ex15_Inner /></Provider>; }
function Ex15_Inner() {
  const { user, loading, error } = useSelector((s: ReturnType<typeof store15.getState>) => s);
  const d = useDispatch();
  const [creds, setCreds] = useState({ email: "alice@ex.com", pw: "pass123" });
  const handleLogin = () => {
    d(slice15.actions.loginStart());
    setTimeout(() => {
      if (creds.email === "alice@ex.com" && creds.pw === "pass123") d(slice15.actions.loginSuccess({ id: 1, name: "Alice", email: creds.email, role: "admin", token: "tok_abc123" }));
      else d(slice15.actions.loginFailure("Invalid credentials"));
    }, 800);
  };
  if (user) return <div><p>Welcome {user.name} ({user.role})</p><p style={{ fontSize: 11 }}>Token: {user.token}</p><button onClick={() => d(slice15.actions.updateProfile({ name: "Alice Updated" }))}>Update Name</button><button onClick={() => d(slice15.actions.logout())}>Logout</button></div>;
  return <div><input value={creds.email} onChange={e => setCreds(p => ({ ...p, email: e.target.value }))} placeholder="Email" style={{ display: "block" }} /><input type="password" value={creds.pw} onChange={e => setCreds(p => ({ ...p, pw: e.target.value }))} placeholder="Password" style={{ display: "block" }} /><button onClick={handleLogin} disabled={loading}>{loading ? "Logging in..." : "Login"}</button>{error && <p style={{ color: "red" }}>{error}</p>}</div>;
}

// 16. Cart slice (full shopping cart)
interface CartItem16 { id: number; name: string; price: number; qty: number; }
const slice16 = createSlice({ name: "ex16", initialState: { items: [] as CartItem16[], coupon: "" as string, couponDiscount: 0 }, reducers: { addItem: (s, a: PayloadAction<Omit<CartItem16, "qty">>) => { const ex = s.items.find(i => i.id === a.payload.id); if (ex) ex.qty++; else s.items.push({ ...a.payload, qty: 1 }); }, removeItem: (s, a: PayloadAction<number>) => { s.items = s.items.filter(i => i.id !== a.payload); }, updateQty: (s, a: PayloadAction<{ id: number; qty: number }>) => { const i = s.items.find(i => i.id === a.payload.id); if (i) { if (a.payload.qty <= 0) s.items = s.items.filter(i => i.id !== a.payload.id); else i.qty = a.payload.qty; } }, applyCoupon: (s, a: PayloadAction<string>) => { const map: Record<string, number> = { SAVE10: 10, VIP20: 20, HALF: 50 }; s.coupon = a.payload; s.couponDiscount = map[a.payload] ?? 0; }, clearCart: s => { s.items = []; s.coupon = ""; s.couponDiscount = 0; } } });
const store16 = configureStore({ reducer: slice16.reducer });
const shop16 = [{ id: 1, name: "Widget", price: 25 }, { id: 2, name: "Gadget", price: 50 }, { id: 3, name: "Doohickey", price: 15 }];
function Ex16_Name() { return <Provider store={store16}><Ex16_Inner /></Provider>; }
function Ex16_Inner() {
  const { items, coupon, couponDiscount } = useSelector((s: ReturnType<typeof store16.getState>) => s);
  const d = useDispatch();
  const [code, setCode] = useState("");
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const total = subtotal * (1 - couponDiscount / 100);
  return <div><div style={{ display: "flex", gap: 4, marginBottom: 8 }}>{shop16.map(p => <button key={p.id} onClick={() => d(slice16.actions.addItem(p))}>{p.name} ${p.price}</button>)}</div>{items.length > 0 && <><ul>{items.map(i => <li key={i.id}>{i.name} ×<input type="number" min={0} value={i.qty} onChange={e => d(slice16.actions.updateQty({ id: i.id, qty: Number(e.target.value) }))} style={{ width: 40 }} /> = ${(i.price * i.qty).toFixed(2)} <button onClick={() => d(slice16.actions.removeItem(i.id))}>x</button></li>)}</ul><p>Subtotal: ${subtotal.toFixed(2)}</p><div><input value={code} onChange={e => setCode(e.target.value)} placeholder="Coupon (SAVE10/VIP20/HALF)" /><button onClick={() => d(slice16.actions.applyCoupon(code))}>Apply</button></div>{couponDiscount > 0 && <p>Discount ({coupon}): {couponDiscount}%</p>}<p><strong>Total: ${total.toFixed(2)}</strong></p><button onClick={() => d(slice16.actions.clearCart())}>Clear Cart</button></>}</div>;
}

// 17. UI slice (modals/toasts/loading)
interface UIState17 { loading: Record<string, boolean>; modals: Record<string, boolean>; toasts: { id: number; msg: string; type: string }[]; nextToastId: number; }
const slice17 = createSlice({ name: "ex17", initialState: { loading: {}, modals: {}, toasts: [], nextToastId: 1 } as UIState17, reducers: { setLoading: (s, a: PayloadAction<{ key: string; val: boolean }>) => { s.loading[a.payload.key] = a.payload.val; }, openModal: (s, a: PayloadAction<string>) => { s.modals[a.payload] = true; }, closeModal: (s, a: PayloadAction<string>) => { s.modals[a.payload] = false; }, addToast: (s, a: PayloadAction<{ msg: string; type: string }>) => { s.toasts.push({ id: s.nextToastId++, ...a.payload }); }, removeToast: (s, a: PayloadAction<number>) => { s.toasts = s.toasts.filter(t => t.id !== a.payload); } } });
const store17 = configureStore({ reducer: slice17.reducer });
type RS17 = ReturnType<typeof store17.getState>;
function Ex17_Name() { return <Provider store={store17}><Ex17_Inner /></Provider>; }
function Ex17_Inner() {
  const ui = useSelector((s: RS17) => s);
  const d = useDispatch();
  const simulate = (key: string) => { d(slice17.actions.setLoading({ key, val: true })); setTimeout(() => { d(slice17.actions.setLoading({ key, val: false })); d(slice17.actions.addToast({ msg: `${key} done!`, type: "success" })); }, 1200); };
  return <div><div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}><button onClick={() => simulate("fetchUsers")} disabled={ui.loading["fetchUsers"]}>{ui.loading["fetchUsers"] ? "Loading..." : "Fetch Users"}</button><button onClick={() => simulate("saveData")} disabled={ui.loading["saveData"]}>{ui.loading["saveData"] ? "Saving..." : "Save Data"}</button><button onClick={() => d(slice17.actions.openModal("confirm"))}>Open Modal</button></div>{ui.modals["confirm"] && <div style={{ border: "2px solid #333", padding: 8, marginTop: 8 }}><p>Confirm action?</p><button onClick={() => { d(slice17.actions.closeModal("confirm")); d(slice17.actions.addToast({ msg: "Confirmed!", type: "info" })); }}>Yes</button><button onClick={() => d(slice17.actions.closeModal("confirm"))}>No</button></div>}<div style={{ position: "relative", marginTop: 8 }}>{ui.toasts.map(t => <div key={t.id} style={{ background: t.type === "success" ? "#c8e6c9" : "#bbdefb", padding: 4, marginTop: 2 }}>{t.msg} <button onClick={() => d(slice17.actions.removeToast(t.id))}>x</button></div>)}</div></div>;
}

// 18. Filter slice (search/sort/category/page)
const slice18 = createSlice({ name: "ex18", initialState: { search: "", sort: "name" as "name" | "price", sortDir: "asc" as "asc" | "desc", category: "all", page: 1, pageSize: 3 }, reducers: { setSearch: (s, a: PayloadAction<string>) => { s.search = a.payload; s.page = 1; }, setSort: (s, a: PayloadAction<"name" | "price">) => { if (s.sort === a.payload) s.sortDir = s.sortDir === "asc" ? "desc" : "asc"; else { s.sort = a.payload; s.sortDir = "asc"; } }, setCategory: (s, a: PayloadAction<string>) => { s.category = a.payload; s.page = 1; }, setPage: (s, a: PayloadAction<number>) => { s.page = a.payload; }, reset: () => ({ search: "", sort: "name" as const, sortDir: "asc" as const, category: "all", page: 1, pageSize: 3 }) } });
const store18 = configureStore({ reducer: slice18.reducer });
const catalog18 = [{ name: "Apple", price: 1.2, cat: "fruit" }, { name: "Banana", price: 0.5, cat: "fruit" }, { name: "Carrot", price: 0.8, cat: "veg" }, { name: "Daikon", price: 2.1, cat: "veg" }, { name: "Elderberry", price: 5.0, cat: "fruit" }, { name: "Fennel", price: 3.0, cat: "veg" }];
type RS18 = ReturnType<typeof store18.getState>;
function Ex18_Name() { return <Provider store={store18}><Ex18_Inner /></Provider>; }
function Ex18_Inner() {
  const f = useSelector((s: RS18) => s);
  const d = useDispatch();
  const processed = catalog18.filter(i => (f.category === "all" || i.cat === f.category) && i.name.toLowerCase().includes(f.search.toLowerCase())).sort((a, b) => (f.sortDir === "asc" ? 1 : -1) * (a[f.sort] > b[f.sort] ? 1 : -1));
  const paged = processed.slice((f.page - 1) * f.pageSize, f.page * f.pageSize);
  const totalPages = Math.ceil(processed.length / f.pageSize);
  return <div><input value={f.search} onChange={e => d(slice18.actions.setSearch(e.target.value))} placeholder="Search..." /><select value={f.category} onChange={e => d(slice18.actions.setCategory(e.target.value))}><option value="all">All</option><option value="fruit">Fruit</option><option value="veg">Veg</option></select><div>{(["name", "price"] as const).map(k => <button key={k} onClick={() => d(slice18.actions.setSort(k))}>{k}{f.sort === k ? (f.sortDir === "asc" ? "↑" : "↓") : ""}</button>)}<button onClick={() => d(slice18.actions.reset())}>Reset</button></div><ul>{paged.map(i => <li key={i.name}>{i.name} — ${i.price} [{i.cat}]</li>)}</ul><div>{Array.from({ length: totalPages }, (_, i) => <button key={i} onClick={() => d(slice18.actions.setPage(i + 1))} style={{ fontWeight: f.page === i + 1 ? "bold" : "normal" }}>{i + 1}</button>)}</div></div>;
}

// 19. Theme slice
type Theme19 = "light" | "dark" | "solarized" | "high-contrast";
const themes19: Record<Theme19, { bg: string; fg: string; accent: string; border: string }> = { light: { bg: "#fff", fg: "#333", accent: "#2196f3", border: "#ddd" }, dark: { bg: "#121212", fg: "#eee", accent: "#90caf9", border: "#444" }, solarized: { bg: "#fdf6e3", fg: "#657b83", accent: "#268bd2", border: "#93a1a1" }, "high-contrast": { bg: "#000", fg: "#fff", accent: "#ff0", border: "#fff" } };
const slice19 = createSlice({ name: "ex19", initialState: { theme: "light" as Theme19, fontSize: 14, compact: false }, reducers: { setTheme: (s, a: PayloadAction<Theme19>) => { s.theme = a.payload; }, setFontSize: (s, a: PayloadAction<number>) => { s.fontSize = Math.max(10, Math.min(24, a.payload)); }, toggleCompact: s => { s.compact = !s.compact; } } });
const store19 = configureStore({ reducer: slice19.reducer });
type RS19 = ReturnType<typeof store19.getState>;
function Ex19_Name() { return <Provider store={store19}><Ex19_Inner /></Provider>; }
function Ex19_Inner() {
  const { theme, fontSize, compact } = useSelector((s: RS19) => s);
  const d = useDispatch();
  const t = themes19[theme];
  return <div style={{ background: t.bg, color: t.fg, border: `1px solid ${t.border}`, padding: compact ? 4 : 12, fontSize }}><p>Theme: <strong style={{ color: t.accent }}>{theme}</strong> | Font: {fontSize}px | Compact: {String(compact)}</p><div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{(Object.keys(themes19) as Theme19[]).map(th => <button key={th} onClick={() => d(slice19.actions.setTheme(th))} style={{ fontWeight: theme === th ? "bold" : "normal" }}>{th}</button>)}</div><div><button onClick={() => d(slice19.actions.setFontSize(fontSize - 1))}>A-</button><button onClick={() => d(slice19.actions.setFontSize(fontSize + 1))}>A+</button><button onClick={() => d(slice19.actions.toggleCompact())}>Compact</button></div></div>;
}

// 20. Notification slice
interface Notif20 { id: number; title: string; body: string; type: "info" | "success" | "warning" | "error"; read: boolean; time: string; }
const slice20 = createSlice({ name: "ex20", initialState: { notifications: [] as Notif20[], unread: 0, nextId: 1 }, reducers: { add: (s, a: PayloadAction<Pick<Notif20, "title" | "body" | "type">>) => { s.notifications.unshift({ ...a.payload, id: s.nextId++, read: false, time: new Date().toLocaleTimeString() }); s.unread++; }, markRead: (s, a: PayloadAction<number>) => { const n = s.notifications.find(n => n.id === a.payload); if (n && !n.read) { n.read = true; s.unread--; } }, markAllRead: s => { s.notifications.forEach(n => { n.read = true; }); s.unread = 0; }, remove: (s, a: PayloadAction<number>) => { const n = s.notifications.find(n => n.id === a.payload); if (n && !n.read) s.unread--; s.notifications = s.notifications.filter(n => n.id !== a.payload); } } });
const store20 = configureStore({ reducer: slice20.reducer });
const notifColors20: Record<string, string> = { info: "#bbdefb", success: "#c8e6c9", warning: "#fff9c4", error: "#ffcdd2" };
function Ex20_Name() { return <Provider store={store20}><Ex20_Inner /></Provider>; }
function Ex20_Inner() {
  const { notifications, unread } = useSelector((s: ReturnType<typeof store20.getState>) => s);
  const d = useDispatch();
  const types: Notif20["type"][] = ["info", "success", "warning", "error"];
  return <div><div style={{ display: "flex", justifyContent: "space-between" }}><span>Notifications {unread > 0 && <span style={{ background: "red", color: "#fff", borderRadius: "50%", padding: "0 6px", fontSize: 11 }}>{unread}</span>}</span><button onClick={() => d(slice20.actions.markAllRead())}>Mark all read</button></div><div style={{ display: "flex", gap: 4, marginBottom: 8 }}>{types.map(t => <button key={t} onClick={() => d(slice20.actions.add({ title: t.toUpperCase(), body: `A ${t} notification`, type: t }))}>{t}</button>)}</div><ul>{notifications.map(n => <li key={n.id} style={{ background: notifColors20[n.type], padding: 4, marginTop: 2, opacity: n.read ? 0.6 : 1 }} onClick={() => d(slice20.actions.markRead(n.id))}><strong>{n.title}</strong> {n.body} <span style={{ fontSize: 10 }}>{n.time}</span><button onClick={e => { e.stopPropagation(); d(slice20.actions.remove(n.id)); }}>x</button>{!n.read && <span style={{ fontSize: 10 }}> ●</span>}</li>)}</ul></div>;
}

// 21. createEntityAdapter basic
interface User21 { id: number; name: string; email: string; }
const adapter21 = createEntityAdapter<User21>();
const slice21 = createSlice({ name: "ex21", initialState: adapter21.getInitialState(), reducers: { addUser: adapter21.addOne, removeUser: adapter21.removeOne, updateUser: adapter21.updateOne, setAll: adapter21.setAll } });
const store21 = configureStore({ reducer: slice21.reducer });
type RS21 = ReturnType<typeof store21.getState>;
const selectors21 = adapter21.getSelectors((s: RS21) => s);
function Ex21_Name() { return <Provider store={store21}><Ex21_Inner /></Provider>; }
function Ex21_Inner() {
  const all = useSelector(selectors21.selectAll);
  const total = useSelector(selectors21.selectTotal);
  const d = useDispatch();
  const [nextId, setNextId] = useState(1);
  useEffect(() => { d(slice21.actions.setAll([{ id: 1, name: "Alice", email: "alice@ex.com" }, { id: 2, name: "Bob", email: "bob@ex.com" }])); setNextId(3); }, [d]);
  return <div><p>Total: {total} users</p><ul>{all.map(u => <li key={u.id}>{u.name} ({u.email}) <button onClick={() => d(slice21.actions.removeUser(u.id))}>x</button></li>)}</ul><button onClick={() => { d(slice21.actions.addUser({ id: nextId, name: `User${nextId}`, email: `u${nextId}@ex.com` })); setNextId(n => n + 1); }}>Add User</button></div>;
}

// 22. createEntityAdapter CRUD operations
interface Post22 { id: string; title: string; body: string; likes: number; }
const adapter22 = createEntityAdapter<Post22>();
const slice22 = createSlice({ name: "ex22", initialState: adapter22.getInitialState(), reducers: { addPost: adapter22.addOne, addPosts: adapter22.addMany, updatePost: adapter22.updateOne, upsertPost: adapter22.upsertOne, removePost: adapter22.removeOne, removeAll: adapter22.removeAll, like: (s, a: PayloadAction<string>) => { const p = s.entities[a.payload]; if (p) p.likes++; } } });
const store22 = configureStore({ reducer: slice22.reducer });
type RS22 = ReturnType<typeof store22.getState>;
const sel22 = adapter22.getSelectors((s: RS22) => s);
function Ex22_Name() { return <Provider store={store22}><Ex22_Inner /></Provider>; }
function Ex22_Inner() {
  const posts = useSelector(sel22.selectAll);
  const d = useDispatch();
  const [nextNum, setNextNum] = useState(1);
  useEffect(() => { d(slice22.actions.addPosts([{ id: "p1", title: "First Post", body: "Hello world", likes: 0 }, { id: "p2", title: "Second Post", body: "Another day", likes: 5 }])); }, [d]);
  return <div><ul>{posts.map(p => <li key={p.id}><strong>{p.title}</strong> ❤ {p.likes}<button onClick={() => d(slice22.actions.like(p.id))}>Like</button><button onClick={() => d(slice22.actions.updatePost({ id: p.id, changes: { title: `${p.title} (edited)` } }))}>Edit</button><button onClick={() => d(slice22.actions.removePost(p.id))}>Del</button></li>)}</ul><button onClick={() => { d(slice22.actions.addPost({ id: `p${nextNum + 2}`, title: `Post ${nextNum}`, body: "Content", likes: 0 })); setNextNum(n => n + 1); }}>Add Post</button><button onClick={() => d(slice22.actions.removeAll())}>Clear All</button></div>;
}

// 23. createEntityAdapter selectors
interface Product23 { id: number; name: string; price: number; category: string; }
const adapter23 = createEntityAdapter<Product23>({ sortComparer: (a, b) => a.price - b.price });
const slice23 = createSlice({ name: "ex23", initialState: adapter23.getInitialState({ selectedId: null as number | null }), reducers: { setAll: adapter23.setAll, select: (s, a: PayloadAction<number>) => { s.selectedId = a.payload; } } });
const store23 = configureStore({ reducer: slice23.reducer });
type RS23 = ReturnType<typeof store23.getState>;
const sel23 = adapter23.getSelectors((s: RS23) => s);
function Ex23_Name() { return <Provider store={store23}><Ex23_Inner /></Provider>; }
function Ex23_Inner() {
  const all = useSelector(sel23.selectAll);
  const ids = useSelector(sel23.selectIds);
  const total = useSelector(sel23.selectTotal);
  const { selectedId } = useSelector((s: RS23) => ({ selectedId: s.selectedId }));
  const selected = useSelector((s: RS23) => selectedId ? sel23.selectById(s, selectedId) : undefined);
  const d = useDispatch();
  useEffect(() => { d(slice23.actions.setAll([{ id: 1, name: "Widget", price: 20, category: "tools" }, { id: 2, name: "Gadget", price: 50, category: "tools" }, { id: 3, name: "Apple", price: 1.5, category: "food" }])); }, [d]);
  return <div><p>Total: {total} | IDs: [{ids.join(", ")}]</p><ul>{all.map(p => <li key={p.id} onClick={() => d(slice23.actions.select(p.id))} style={{ cursor: "pointer", fontWeight: p.id === selectedId ? "bold" : "normal" }}>{p.name} ${p.price} [{p.category}]</li>)}</ul>{selected && <p>Selected: {selected.name} — ${selected.price}</p>}<p style={{ fontSize: 11 }}>Sorted by price (adapter sortComparer)</p></div>;
}

// 24. Slice with computed initial state
const loadInitialTodos24 = () => {
  const stored = typeof localStorage !== "undefined" ? localStorage.getItem("todos24") : null;
  return stored ? JSON.parse(stored) as { id: number; text: string; done: boolean }[] : [{ id: 1, text: "Buy milk", done: false }, { id: 2, text: "Write code", done: true }];
};
const slice24 = createSlice({ name: "ex24", initialState: { todos: loadInitialTodos24(), nextId: 10 }, reducers: { add: (s, a: PayloadAction<string>) => { s.todos.push({ id: s.nextId++, text: a.payload, done: false }); try { localStorage.setItem("todos24", JSON.stringify(s.todos)); } catch {} }, toggle: (s, a: PayloadAction<number>) => { const t = s.todos.find(t => t.id === a.payload); if (t) { t.done = !t.done; try { localStorage.setItem("todos24", JSON.stringify(s.todos)); } catch {} } } } });
const store24 = configureStore({ reducer: slice24.reducer });
function Ex24_Name() { return <Provider store={store24}><Ex24_Inner /></Provider>; }
function Ex24_Inner() {
  const { todos } = useSelector((s: ReturnType<typeof store24.getState>) => s);
  const d = useDispatch();
  const [v, setV] = useState("");
  return <div><ul>{todos.map(t => <li key={t.id} onClick={() => d(slice24.actions.toggle(t.id))} style={{ textDecoration: t.done ? "line-through" : "none", cursor: "pointer" }}>{t.text}</li>)}</ul><input value={v} onChange={e => setV(e.target.value)} /><button onClick={() => { if (v) { d(slice24.actions.add(v)); setV(""); } }}>Add</button><p style={{ fontSize: 11 }}>Initial state computed from localStorage</p></div>;
}

// 25. Multiple slices with configureStore
const s25a = createSlice({ name: "ex25_users", initialState: [] as { id: number; name: string }[], reducers: { add: (s, a: PayloadAction<string>) => { s.push({ id: Date.now(), name: a.payload }); }, remove: (s, a: PayloadAction<number>) => s.filter(u => u.id !== a.payload) } });
const s25b = createSlice({ name: "ex25_posts", initialState: [] as { id: number; title: string; authorId: number }[], reducers: { add: (s, a: PayloadAction<{ title: string; authorId: number }>) => { s.push({ id: Date.now(), ...a.payload }); } } });
const s25c = createSlice({ name: "ex25_settings", initialState: { theme: "light", lang: "en" }, reducers: { toggle: s => { s.theme = s.theme === "light" ? "dark" : "light"; } } });
const store25 = configureStore({ reducer: { users: s25a.reducer, posts: s25b.reducer, settings: s25c.reducer } });
type RS25 = ReturnType<typeof store25.getState>;
function Ex25_Name() { return <Provider store={store25}><Ex25_Inner /></Provider>; }
function Ex25_Inner() {
  const { users, posts, settings } = useSelector((s: RS25) => s);
  const d = useDispatch();
  const [n, setN] = useState("");
  return <div><p>Theme: {settings.theme} | Users: {users.length} | Posts: {posts.length}</p><div><input value={n} onChange={e => setN(e.target.value)} placeholder="Username" /><button onClick={() => { if (n) { d(s25a.actions.add(n)); setN(""); } }}>Add User</button></div>{users.length > 0 && <div><button onClick={() => d(s25b.actions.add({ title: `Post by ${users[0].name}`, authorId: users[0].id }))}>Add Post for {users[0]?.name}</button></div>}<button onClick={() => d(s25c.actions.toggle())}>Toggle Theme</button></div>;
}

// ─── NESTED 26–37 ───────────────────────────────────────────────────────────────

// 26. Slice with nested object state (Immer mutations)
const slice26 = createSlice({ name: "ex26", initialState: { company: { name: "Acme Corp", founded: 2010, address: { street: "123 Main", city: "NYC", zip: "10001" }, departments: { eng: { headcount: 50, budget: 1000000 }, design: { headcount: 10, budget: 300000 } } } }, reducers: {
  // RTK uses Immer: we mutate directly, Immer creates new references
  relocate: (s, a: PayloadAction<{ city: string; zip: string }>) => { s.company.address.city = a.payload.city; s.company.address.zip = a.payload.zip; },
  hire: (s, a: PayloadAction<"eng" | "design">) => { s.company.departments[a.payload].headcount++; },
  setBudget: (s, a: PayloadAction<{ dept: "eng" | "design"; amount: number }>) => { s.company.departments[a.payload.dept].budget = a.payload.amount; }
} });
const store26 = configureStore({ reducer: slice26.reducer });
function Ex26_Name() { return <Provider store={store26}><Ex26_Inner /></Provider>; }
function Ex26_Inner() {
  const { company } = useSelector((s: ReturnType<typeof store26.getState>) => s);
  const d = useDispatch();
  return <div><p>{company.name} (est. {company.founded})</p><p>{company.address.street}, {company.address.city} {company.address.zip}</p>{Object.entries(company.departments).map(([k, v]) => <p key={k}>{k}: {v.headcount} people | ${v.budget.toLocaleString()}<button onClick={() => d(slice26.actions.hire(k as "eng" | "design"))}>Hire</button></p>)}<button onClick={() => d(slice26.actions.relocate({ city: "San Francisco", zip: "94102" }))}>Move to SF</button></div>;
}

// 27. Slice for normalized entities (createEntityAdapter)
interface Article27 { id: number; title: string; authorId: number; tags: string[]; views: number; }
const adapter27 = createEntityAdapter<Article27>({ sortComparer: (a, b) => b.views - a.views });
const slice27 = createSlice({ name: "ex27", initialState: adapter27.getInitialState(), reducers: { addArticles: adapter27.addMany, view: (s, a: PayloadAction<number>) => { const a2 = s.entities[a.payload]; if (a2) a2.views++; }, addTag: (s, a: PayloadAction<{ id: number; tag: string }>) => { const art = s.entities[a.payload.id]; if (art && !art.tags.includes(a.payload.tag)) art.tags.push(a.payload.tag); } } });
const store27 = configureStore({ reducer: slice27.reducer });
type RS27 = ReturnType<typeof store27.getState>;
const sel27 = adapter27.getSelectors((s: RS27) => s);
function Ex27_Name() { return <Provider store={store27}><Ex27_Inner /></Provider>; }
function Ex27_Inner() {
  const articles = useSelector(sel27.selectAll);
  const d = useDispatch();
  useEffect(() => { d(slice27.actions.addArticles([{ id: 1, title: "Redux Guide", authorId: 1, tags: ["redux"], views: 120 }, { id: 2, title: "React Hooks", authorId: 2, tags: ["react"], views: 85 }, { id: 3, title: "TypeScript Tips", authorId: 1, tags: ["ts"], views: 200 }])); }, [d]);
  return <div><ul>{articles.map(a => <li key={a.id}><strong>{a.title}</strong> ({a.views} views) [{a.tags.join(", ")}]<button onClick={() => d(slice27.actions.view(a.id))}>View</button><button onClick={() => d(slice27.actions.addTag({ id: a.id, tag: "popular" }))}>+Tag</button></li>)}</ul><p style={{ fontSize: 11 }}>Sorted by views desc (adapter sortComparer)</p></div>;
}

// 28. Slice with extraReducers (responding to other slice actions)
const authSlice28 = createSlice({ name: "ex28_auth", initialState: { user: null as string | null }, reducers: { login: (s, a: PayloadAction<string>) => { s.user = a.payload; }, logout: s => { s.user = null; } } });
const dataSlice28 = createSlice({ name: "ex28_data", initialState: { items: [] as string[], status: "idle", owner: null as string | null }, reducers: { addItem: (s, a: PayloadAction<string>) => { s.items.push(a.payload); } }, extraReducers: b => b.addCase(authSlice28.actions.login, (s, a) => { s.status = "ready"; s.owner = a.payload; s.items = [`Welcome data for ${a.payload}!`]; }).addCase(authSlice28.actions.logout, s => { s.status = "idle"; s.owner = null; s.items = []; }) });
const store28 = configureStore({ reducer: { auth: authSlice28.reducer, data: dataSlice28.reducer } });
type RS28 = ReturnType<typeof store28.getState>;
function Ex28_Name() { return <Provider store={store28}><Ex28_Inner /></Provider>; }
function Ex28_Inner() {
  const { auth, data } = useSelector((s: RS28) => s);
  const d = useDispatch();
  return <div><p>Auth: {auth.user ?? "none"} | Data status: {data.status} | Owner: {data.owner ?? "none"}</p><ul>{data.items.map((i, idx) => <li key={idx}>{i}</li>)}</ul>{auth.user ? <><button onClick={() => d(dataSlice28.actions.addItem(`Item ${data.items.length + 1}`))}>Add Item</button><button onClick={() => d(authSlice28.actions.logout())}>Logout (clears data)</button></> : <button onClick={() => d(authSlice28.actions.login("Alice"))}>Login</button>}</div>;
}

// 29. Cross-slice communication
const profileSlice29 = createSlice({ name: "ex29_profile", initialState: { name: "Alice", points: 0, level: 1 }, reducers: { addPoints: (s, a: PayloadAction<number>) => { s.points += a.payload; s.level = Math.floor(s.points / 100) + 1; } } });
const leaderboardSlice29 = createSlice({ name: "ex29_leaderboard", initialState: [] as { name: string; points: number; timestamp: string }[], reducers: { addEntry: (s, a: PayloadAction<{ name: string; points: number }>) => { s.unshift({ ...a.payload, timestamp: new Date().toLocaleTimeString() }); if (s.length > 5) s.pop(); } } });
const store29 = configureStore({ reducer: { profile: profileSlice29.reducer, leaderboard: leaderboardSlice29.reducer } });
type RS29 = ReturnType<typeof store29.getState>;
function Ex29_Name() { return <Provider store={store29}><Ex29_Inner /></Provider>; }
function Ex29_Inner() {
  const { profile, leaderboard } = useSelector((s: RS29) => s);
  const d = useDispatch();
  const score = (pts: number) => {
    d(profileSlice29.actions.addPoints(pts));
    // Cross-slice: profile action triggers leaderboard update
    const state = store29.getState();
    d(leaderboardSlice29.actions.addEntry({ name: state.profile.name, points: state.profile.points + pts }));
  };
  return <div><p>{profile.name} — Level {profile.level} — {profile.points} pts</p><div>{[10, 25, 50].map(p => <button key={p} onClick={() => score(p)}>+{p} pts</button>)}</div><p>Leaderboard entries:</p><ol style={{ fontSize: 11 }}>{leaderboard.map((e, i) => <li key={i}>{e.points} pts @ {e.timestamp}</li>)}</ol></div>;
}

// 30. RTK entity adapter with custom selectors
interface Task30 { id: number; title: string; status: "todo" | "doing" | "done"; assignee: string; }
const adapter30 = createEntityAdapter<Task30>();
const slice30 = createSlice({ name: "ex30", initialState: adapter30.getInitialState(), reducers: { addTask: adapter30.addOne, updateStatus: (s, a: PayloadAction<{ id: number; status: Task30["status"] }>) => { const t = s.entities[a.payload.id]; if (t) t.status = a.payload.status; }, setAll: adapter30.setAll } });
const store30 = configureStore({ reducer: slice30.reducer });
type RS30 = ReturnType<typeof store30.getState>;
const baseSel30 = adapter30.getSelectors((s: RS30) => s);
const selectByStatus30 = (status: Task30["status"]) => (s: RS30) => baseSel30.selectAll(s).filter(t => t.status === status);
function Ex30_Name() { return <Provider store={store30}><Ex30_Inner /></Provider>; }
function Ex30_Inner() {
  const todo = useSelector(selectByStatus30("todo"));
  const doing = useSelector(selectByStatus30("doing"));
  const done = useSelector(selectByStatus30("done"));
  const d = useDispatch();
  useEffect(() => { d(slice30.actions.setAll([{ id: 1, title: "Design DB", status: "done", assignee: "Alice" }, { id: 2, title: "Write API", status: "doing", assignee: "Bob" }, { id: 3, title: "Write tests", status: "todo", assignee: "Carol" }, { id: 4, title: "Deploy", status: "todo", assignee: "Alice" }])); }, [d]);
  const nextStatus: Record<Task30["status"], Task30["status"]> = { todo: "doing", doing: "done", done: "todo" };
  const statusLabel: Record<Task30["status"], string> = { todo: "→ Start", doing: "→ Done", done: "↺ Reset" };
  const cols: [string, Task30[]][] = [["Todo", todo], ["Doing", doing], ["Done", done]];
  return <div style={{ display: "flex", gap: 8 }}>{cols.map(([label, tasks]) => <div key={label} style={{ flex: 1, border: "1px solid #ccc", padding: 4 }}><strong>{label} ({tasks.length})</strong>{tasks.map(t => <div key={t.id} style={{ background: "#f5f5f5", margin: 2, padding: 4 }}>{t.title}<button onClick={() => d(slice30.actions.updateStatus({ id: t.id, status: nextStatus[t.status] }))} style={{ fontSize: 10 }}>{statusLabel[t.status]}</button></div>)}</div>)}</div>;
}

// 31. Slice for tree data with Immer
interface TreeNode31 { id: number; label: string; children: TreeNode31[]; collapsed: boolean; }
const findNode31 = (nodes: TreeNode31[], id: number): TreeNode31 | null => { for (const n of nodes) { if (n.id === id) return n; const found = findNode31(n.children, id); if (found) return found; } return null; };
const slice31 = createSlice({ name: "ex31", initialState: { tree: [{ id: 1, label: "Root", collapsed: false, children: [{ id: 2, label: "Child A", collapsed: false, children: [{ id: 4, label: "Leaf A1", collapsed: false, children: [] }] }, { id: 3, label: "Child B", collapsed: true, children: [{ id: 5, label: "Leaf B1", collapsed: false, children: [] }] }] }] as TreeNode31[], nextId: 6 }, reducers: { toggle: (s, a: PayloadAction<number>) => { const n = findNode31(s.tree, a.payload); if (n) n.collapsed = !n.collapsed; }, addChild: (s, a: PayloadAction<number>) => { const n = findNode31(s.tree, a.payload); if (n) { n.children.push({ id: s.nextId++, label: `Node ${s.nextId}`, collapsed: false, children: [] }); n.collapsed = false; } } } });
const store31 = configureStore({ reducer: slice31.reducer });
function Ex31_Name() { return <Provider store={store31}><Ex31_Inner /></Provider>; }
function Ex31_Inner() {
  const { tree } = useSelector((s: ReturnType<typeof store31.getState>) => s);
  const d = useDispatch();
  const render = (nodes: TreeNode31[], depth = 0): React.ReactNode => nodes.map(n => <div key={n.id} style={{ marginLeft: depth * 16 }}><span style={{ cursor: "pointer" }} onClick={() => d(slice31.actions.toggle(n.id))}>{n.children.length ? (n.collapsed ? "▶" : "▼") : "•"} {n.label}</span><button onClick={() => d(slice31.actions.addChild(n.id))} style={{ fontSize: 10, marginLeft: 4 }}>+</button>{!n.collapsed && render(n.children, depth + 1)}</div>);
  return <div>{render(tree)}</div>;
}

// 32. Slice with complex array operations (Immer)
const slice32 = createSlice({ name: "ex32", initialState: { items: ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"] }, reducers: { insert: (s, a: PayloadAction<{ idx: number; item: string }>) => { s.items.splice(a.payload.idx, 0, a.payload.item); }, remove: (s, a: PayloadAction<number>) => { s.items.splice(a.payload, 1); }, swap: (s, a: PayloadAction<{ i: number; j: number }>) => { [s.items[a.payload.i], s.items[a.payload.j]] = [s.items[a.payload.j], s.items[a.payload.i]]; }, reverse: s => { s.items.reverse(); }, sort: s => { s.items.sort(); }, duplicate: (s, a: PayloadAction<number>) => { s.items.splice(a.payload + 1, 0, `${s.items[a.payload]}_copy`); } } });
const store32 = configureStore({ reducer: slice32.reducer });
function Ex32_Name() { return <Provider store={store32}><Ex32_Inner /></Provider>; }
function Ex32_Inner() {
  const { items } = useSelector((s: ReturnType<typeof store32.getState>) => s);
  const d = useDispatch();
  return <div><ul>{items.map((it, i) => <li key={i}>{i}: {it} <button onClick={() => d(slice32.actions.remove(i))}>x</button><button onClick={() => d(slice32.actions.duplicate(i))}>dup</button>{i > 0 && <button onClick={() => d(slice32.actions.swap({ i, j: i - 1 }))}>↑</button>}</li>)}</ul><button onClick={() => d(slice32.actions.insert({ idx: 0, item: "Zeta" }))}>Insert at 0</button><button onClick={() => d(slice32.actions.reverse())}>Reverse</button><button onClick={() => d(slice32.actions.sort())}>Sort</button></div>;
}

// 33. Slice with undo history
interface UndoState33 { items: string[]; past: string[][]; future: string[][]; }
const slice33 = createSlice({ name: "ex33", initialState: { items: ["start"], past: [], future: [] } as UndoState33, reducers: { mutate: (s, a: PayloadAction<string>) => { s.past.push([...s.items]); if (a.payload === "add") s.items.push(`item${s.items.length + 1}`); if (a.payload === "remove") s.items.pop(); if (a.payload === "clear") s.items = []; s.future = []; }, undo: s => { if (s.past.length) { s.future.unshift([...s.items]); s.items = s.past.pop()!; } }, redo: s => { if (s.future.length) { s.past.push([...s.items]); s.items = s.future.shift()!; } } } });
const store33 = configureStore({ reducer: slice33.reducer });
function Ex33_Name() { return <Provider store={store33}><Ex33_Inner /></Provider>; }
function Ex33_Inner() {
  const { items, past, future } = useSelector((s: ReturnType<typeof store33.getState>) => s);
  const d = useDispatch();
  return <div><p>[{items.join(", ")}]</p><div><button onClick={() => d(slice33.actions.mutate("add"))}>Add</button><button onClick={() => d(slice33.actions.mutate("remove"))}>Remove</button><button onClick={() => d(slice33.actions.mutate("clear"))}>Clear</button></div><div><button onClick={() => d(slice33.actions.undo())} disabled={!past.length}>Undo ({past.length})</button><button onClick={() => d(slice33.actions.redo())} disabled={!future.length}>Redo ({future.length})</button></div></div>;
}

// 34. Builder pattern in createReducer
type CalcState34 = { display: string; memory: number; history: string[] };
const digit34 = createAction<string>("ex34/digit");
const op34 = createAction<string>("ex34/op");
const eq34 = createAction("ex34/equals");
const clr34 = createAction("ex34/clear");
const mem34 = createAction<"store" | "recall" | "clear">("ex34/memory");
const calcReducer34 = createReducer({ display: "0", memory: 0, history: [] } as CalcState34, b => b
  .addCase(digit34, (s, a) => { s.display = s.display === "0" ? a.payload : s.display + a.payload; })
  .addCase(op34, (s, a) => { s.display += ` ${a.payload} `; })
  .addCase(eq34, s => { try { const result = String(Function(`"use strict"; return (${s.display.replace(/×/g, "*").replace(/÷/g, "/")})`)() as number); s.history.push(`${s.display}= ${result}`); s.display = result; } catch { s.display = "Error"; } })
  .addCase(clr34, s => { s.display = "0"; })
  .addCase(mem34, (s, a) => { if (a.payload === "store") s.memory = Number(s.display); if (a.payload === "recall") s.display = String(s.memory); if (a.payload === "clear") s.memory = 0; })
);
const store34 = configureStore({ reducer: calcReducer34 });
function Ex34_Name() { return <Provider store={store34}><Ex34_Inner /></Provider>; }
function Ex34_Inner() {
  const { display, memory, history } = useSelector((s: ReturnType<typeof store34.getState>) => s);
  const d = useDispatch();
  return <div><div style={{ background: "#222", color: "#0f0", fontFamily: "monospace", padding: "4px 8px", fontSize: 16, textAlign: "right" }}>{display}</div><div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 2, marginTop: 4 }}>{["7","8","9","÷","4","5","6","×","1","2","3","-","0",".","=","+"].map(k => <button key={k} onClick={() => k === "=" ? d(eq34()) : ["÷","×","-","+"].includes(k) ? d(op34(k)) : d(digit34(k))}>{k}</button>)}<button onClick={() => d(clr34())}>C</button><button onClick={() => d(mem34("store"))}>MS</button><button onClick={() => d(mem34("recall"))}>MR</button><button onClick={() => d(mem34("clear"))}>MC</button></div><p style={{ fontSize: 10 }}>M: {memory} | History: {history.slice(-2).join(", ")}</p></div>;
}

// 35. RTK Query-like manual cache slice
interface CacheEntry35 { data: unknown; timestamp: number; loading: boolean; error: string | null; }
const slice35 = createSlice({ name: "ex35", initialState: { cache: {} as Record<string, CacheEntry35> }, reducers: { startFetch: (s, a: PayloadAction<string>) => { s.cache[a.payload] = { data: null, timestamp: 0, loading: true, error: null }; }, setData: (s, a: PayloadAction<{ key: string; data: unknown }>) => { s.cache[a.payload.key] = { data: a.payload.data, timestamp: Date.now(), loading: false, error: null }; }, setError: (s, a: PayloadAction<{ key: string; error: string }>) => { if (s.cache[a.payload.key]) { s.cache[a.payload.key].loading = false; s.cache[a.payload.key].error = a.payload.error; } }, invalidate: (s, a: PayloadAction<string>) => { delete s.cache[a.payload]; } } });
const store35 = configureStore({ reducer: slice35.reducer });
type RS35 = ReturnType<typeof store35.getState>;
const fakeApis35: Record<string, () => Promise<unknown>> = {
  users: () => new Promise(r => setTimeout(() => r([{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }]), 800)),
  posts: () => new Promise(r => setTimeout(() => r([{ id: 1, title: "Hello" }]), 600)),
};
function Ex35_Name() { return <Provider store={store35}><Ex35_Inner /></Provider>; }
function Ex35_Inner() {
  const cache = useSelector((s: RS35) => s.cache);
  const d = useDispatch();
  const fetch35 = (key: string) => {
    if (cache[key]?.loading) return;
    const age = cache[key] ? Date.now() - cache[key].timestamp : Infinity;
    if (age < 5000) return; // 5s cache
    d(slice35.actions.startFetch(key));
    fakeApis35[key]().then(data => d(slice35.actions.setData({ key, data }))).catch(() => d(slice35.actions.setError({ key, error: "Failed" })));
  };
  return <div>{Object.keys(fakeApis35).map(k => <div key={k} style={{ marginBottom: 8 }}><div style={{ display: "flex", gap: 4 }}><button onClick={() => fetch35(k)}>Fetch {k}</button><button onClick={() => d(slice35.actions.invalidate(k))}>Invalidate</button></div>{cache[k]?.loading && <p>Loading...</p>}{cache[k]?.error && <p style={{ color: "red" }}>{cache[k].error}</p>}{cache[k]?.data && <pre style={{ fontSize: 10 }}>{JSON.stringify(cache[k].data, null, 2)}</pre>}</div>)}</div>;
}

// 36. Slice with optimistic updates
interface ListItem36 { id: number; text: string; status: "confirmed" | "pending" | "error"; }
const slice36 = createSlice({ name: "ex36", initialState: { items: [] as ListItem36[], nextId: 1 }, reducers: { addOptimistic: (s, a: PayloadAction<string>) => { s.items.push({ id: s.nextId++, text: a.payload, status: "pending" }); }, confirm: (s, a: PayloadAction<number>) => { const i = s.items.find(i => i.id === a.payload); if (i) i.status = "confirmed"; }, fail: (s, a: PayloadAction<number>) => { const i = s.items.find(i => i.id === a.payload); if (i) i.status = "error"; }, remove: (s, a: PayloadAction<number>) => { s.items = s.items.filter(i => i.id !== a.payload); } } });
const store36 = configureStore({ reducer: slice36.reducer });
const statusBg36: Record<string, string> = { confirmed: "#c8e6c9", pending: "#fff9c4", error: "#ffcdd2" };
function Ex36_Name() { return <Provider store={store36}><Ex36_Inner /></Provider>; }
function Ex36_Inner() {
  const { items } = useSelector((s: ReturnType<typeof store36.getState>) => s);
  const d = useDispatch();
  const [v, setV] = useState("");
  const handleAdd = () => {
    if (!v) return;
    d(slice36.actions.addOptimistic(v));
    const id = store36.getState().items.at(-1)!.id;
    const ok = Math.random() > 0.35;
    setTimeout(() => d(ok ? slice36.actions.confirm(id) : slice36.actions.fail(id)), 1000);
    setV("");
  };
  return <div><input value={v} onChange={e => setV(e.target.value)} placeholder="New item (65% success)" /><button onClick={handleAdd}>Add</button><ul>{items.map(i => <li key={i.id} style={{ background: statusBg36[i.status], padding: 4, marginTop: 2 }}>{i.text} [{i.status}]{i.status === "error" && <button onClick={() => d(slice36.actions.remove(i.id))}>Remove</button>}</li>)}</ul></div>;
}

// 37. Slice with rollback on failure
const slice37 = createSlice({ name: "ex37", initialState: { data: { name: "Alice", score: 100 }, snapshot: null as { name: string; score: number } | null, saving: false, lastError: "" }, reducers: { beginUpdate: (s, a: PayloadAction<Partial<{ name: string; score: number }>>) => { s.snapshot = { ...s.data }; Object.assign(s.data, a.payload); s.saving = true; s.lastError = ""; }, commitUpdate: s => { s.snapshot = null; s.saving = false; }, rollback: s => { if (s.snapshot) { s.data = s.snapshot; s.snapshot = null; } s.saving = false; s.lastError = "Server rejected update"; } } });
const store37 = configureStore({ reducer: slice37.reducer });
function Ex37_Name() { return <Provider store={store37}><Ex37_Inner /></Provider>; }
function Ex37_Inner() {
  const { data, saving, lastError, snapshot } = useSelector((s: ReturnType<typeof store37.getState>) => s);
  const d = useDispatch();
  const [v, setV] = useState("Alice");
  const update = () => {
    d(slice37.actions.beginUpdate({ name: v, score: data.score + 10 }));
    const ok = Math.random() > 0.4;
    setTimeout(() => d(ok ? slice37.actions.commitUpdate() : slice37.actions.rollback()), 1000);
  };
  return <div><p>name: {data.name} | score: {data.score} {saving ? "(saving...)" : ""}</p>{snapshot && <p style={{ fontSize: 11, color: "#999" }}>Snapshot: {snapshot.name} / {snapshot.score}</p>}{lastError && <p style={{ color: "red" }}>{lastError}</p>}<input value={v} onChange={e => setV(e.target.value)} /><button onClick={update} disabled={saving}>Update (60% success)</button></div>;
}

// ─── ADVANCED 38–50 ─────────────────────────────────────────────────────────────

// 38. RTK listener middleware
// Note: @reduxjs/toolkit exports createListenerMiddleware
// Simulating the pattern with a custom approach since we can't import addListener directly
const slice38 = createSlice({ name: "ex38", initialState: { count: 0, sideEffectLog: [] as string[] }, reducers: { inc: s => { s.count++; }, addLog: (s, a: PayloadAction<string>) => { s.sideEffectLog.unshift(a.payload); if (s.sideEffectLog.length > 5) s.sideEffectLog.pop(); } } });
const listenerLog38: string[] = [];
const listenerMiddleware38 = (store: { getState: () => ReturnType<typeof store38.getState>; dispatch: typeof store38.dispatch }) => (next: (a: unknown) => unknown) => (action: unknown) => {
  const result = next(action);
  if ((action as { type: string }).type === "ex38/inc") {
    const { count } = store.getState();
    const msg = count % 5 === 0 ? `Milestone: ${count}!` : count % 2 === 0 ? `Even: ${count}` : "";
    if (msg) setTimeout(() => store.dispatch(slice38.actions.addLog(msg)), 0);
  }
  return result;
};
const store38 = configureStore({ reducer: slice38.reducer, middleware: gDM => gDM().concat(listenerMiddleware38 as ReturnType<typeof gDM>[number]) });
function Ex38_Name() { return <Provider store={store38}><Ex38_Inner /></Provider>; }
function Ex38_Inner() {
  const { count, sideEffectLog } = useSelector((s: ReturnType<typeof store38.getState>) => s);
  const d = useDispatch();
  return <div><p>Count: {count}</p><button onClick={() => d(slice38.actions.inc())}>+1</button><p style={{ fontSize: 11 }}>Listener fires on milestones (5) and even numbers:</p><ul style={{ fontSize: 11 }}>{sideEffectLog.map((l, i) => <li key={i}>{l}</li>)}</ul></div>;
}

// 39. createEntityAdapter with pagination
const adapter39 = createEntityAdapter<{ id: number; name: string; value: number }>();
const slice39 = createSlice({ name: "ex39", initialState: adapter39.getInitialState({ page: 1, pageSize: 4 }), reducers: { setAll: adapter39.setAll, setPage: (s, a: PayloadAction<number>) => { s.page = a.payload; }, setPageSize: (s, a: PayloadAction<number>) => { s.pageSize = a.payload; s.page = 1; } } });
const store39 = configureStore({ reducer: slice39.reducer });
type RS39 = ReturnType<typeof store39.getState>;
const baseSel39 = adapter39.getSelectors((s: RS39) => s);
const selectPaged39 = (s: RS39) => { const all = baseSel39.selectAll(s); const start = (s.page - 1) * s.pageSize; return { items: all.slice(start, start + s.pageSize), total: all.length, totalPages: Math.ceil(all.length / s.pageSize), page: s.page, pageSize: s.pageSize }; };
function Ex39_Name() { return <Provider store={store39}><Ex39_Inner /></Provider>; }
function Ex39_Inner() {
  const { items, total, totalPages, page, pageSize } = useSelector(selectPaged39);
  const d = useDispatch();
  useEffect(() => { d(slice39.actions.setAll(Array.from({ length: 15 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}`, value: (i + 1) * 7 })))); }, [d]);
  return <div><p>Showing {items.length} of {total} | Page {page}/{totalPages}</p><ul>{items.map(i => <li key={i.id}>{i.name}: {i.value}</li>)}</ul><div><button onClick={() => d(slice39.actions.setPage(page - 1))} disabled={page === 1}>Prev</button><button onClick={() => d(slice39.actions.setPage(page + 1))} disabled={page === totalPages}>Next</button><select value={pageSize} onChange={e => d(slice39.actions.setPageSize(Number(e.target.value)))}>{[4, 6, 8].map(n => <option key={n}>{n}</option>)}</select></div></div>;
}

// 40. createEntityAdapter with sorting
const adapter40 = createEntityAdapter<{ id: number; name: string; score: number; team: string }>();
const slice40 = createSlice({ name: "ex40", initialState: adapter40.getInitialState({ sortBy: "score" as "name" | "score", sortDir: "desc" as "asc" | "desc" }), reducers: { setAll: adapter40.setAll, updateScore: (s, a: PayloadAction<{ id: number; delta: number }>) => { const e = s.entities[a.payload.id]; if (e) e.score += a.payload.delta; }, setSort: (s, a: PayloadAction<"name" | "score">) => { if (s.sortBy === a.payload) s.sortDir = s.sortDir === "asc" ? "desc" : "asc"; else { s.sortBy = a.payload; s.sortDir = a.payload === "score" ? "desc" : "asc"; } } } });
const store40 = configureStore({ reducer: slice40.reducer });
type RS40 = ReturnType<typeof store40.getState>;
const baseSel40 = adapter40.getSelectors((s: RS40) => s);
const selectSorted40 = (s: RS40) => [...baseSel40.selectAll(s)].sort((a, b) => (s.sortDir === "asc" ? 1 : -1) * (a[s.sortBy] > b[s.sortBy] ? 1 : -1));
function Ex40_Name() { return <Provider store={store40}><Ex40_Inner /></Provider>; }
function Ex40_Inner() {
  const items = useSelector(selectSorted40);
  const { sortBy, sortDir } = useSelector((s: RS40) => ({ sortBy: s.sortBy, sortDir: s.sortDir }));
  const d = useDispatch();
  useEffect(() => { d(slice40.actions.setAll([{ id: 1, name: "Alice", score: 95, team: "A" }, { id: 2, name: "Bob", score: 80, team: "B" }, { id: 3, name: "Carol", score: 110, team: "A" }, { id: 4, name: "Dave", score: 75, team: "B" }])); }, [d]);
  return <div><div>{(["name", "score"] as const).map(k => <button key={k} onClick={() => d(slice40.actions.setSort(k))}>{k}{sortBy === k ? (sortDir === "asc" ? "↑" : "↓") : ""}</button>)}</div><ol>{items.map(i => <li key={i.id}>{i.name} ({i.team}): {i.score} <button onClick={() => d(slice40.actions.updateScore({ id: i.id, delta: 10 }))}>+10</button></li>)}</ol></div>;
}

// 41. Slice middleware (custom)
const rateLimiter41 = (() => { const counts: Record<string, { count: number; reset: number }> = {}; return (store: unknown) => (next: (a: unknown) => unknown) => (action: unknown) => {
  const type = (action as { type: string }).type;
  const now = Date.now();
  if (!counts[type] || counts[type].reset < now) counts[type] = { count: 0, reset: now + 2000 };
  counts[type].count++;
  if (counts[type].count > 5) { store; return next({ type: "ex41/rateLimited", payload: type }); }
  return next(action);
}; })();
const slice41 = createSlice({ name: "ex41", initialState: { count: 0, blocked: 0, log: [] as string[] }, reducers: { inc: s => { s.count++; }, rateLimited: (s, a: PayloadAction<string>) => { s.blocked++; s.log.unshift(`Rate limited: ${a.payload}`); } } });
const store41 = configureStore({ reducer: slice41.reducer, middleware: gDM => gDM().concat(rateLimiter41 as ReturnType<typeof gDM>[number]) });
function Ex41_Name() { return <Provider store={store41}><Ex41_Inner /></Provider>; }
function Ex41_Inner() {
  const { count, blocked, log } = useSelector((s: ReturnType<typeof store41.getState>) => s);
  const d = useDispatch();
  return <div><p>Count: {count} | Blocked: {blocked}</p><p style={{ fontSize: 11 }}>Rate limit: 5 per 2 seconds per action type</p><button onClick={() => d(slice41.actions.inc())}>Inc (spam me!)</button><ul style={{ fontSize: 11 }}>{log.slice(0, 4).map((l, i) => <li key={i}>{l}</li>)}</ul></div>;
}

// 42. RTK serializability check config
const slice42 = createSlice({ name: "ex42", initialState: { value: 0, config: { ignoredField: "ok" } }, reducers: { inc: s => { s.value++; }, setConfig: (s, a: PayloadAction<{ ignoredField: string }>) => { s.config = a.payload; } } });
const store42 = configureStore({ reducer: slice42.reducer, middleware: gDM => gDM({ serializableCheck: { ignoredActions: ["ex42/setConfig"], ignoredPaths: ["config.ignoredField"] } }) });
function Ex42_Name() { return <Provider store={store42}><Ex42_Inner /></Provider>; }
function Ex42_Inner() {
  const { value } = useSelector((s: ReturnType<typeof store42.getState>) => s);
  const d = useDispatch();
  return <div><p>Value: {value}</p><button onClick={() => d(slice42.actions.inc())}>Inc</button><button onClick={() => d(slice42.actions.setConfig({ ignoredField: "custom" }))}>Set Non-serializable Config</button><p style={{ fontSize: 11 }}>serializableCheck configured to ignore certain paths/actions — no console errors</p></div>;
}

// 43. Store enhancer
const monitorEnhancer43 = (createStore: (...args: unknown[]) => unknown) => (...args: unknown[]) => {
  const store = (createStore as (...a: unknown[]) => { dispatch: (a: unknown) => unknown; getState: () => unknown; subscribe: (l: () => void) => () => void })(...args);
  let actionCount = 0;
  return { ...store, dispatch: (action: unknown) => { actionCount++; console.log(`[Monitor #${actionCount}]`, (action as { type: string }).type); return store.dispatch(action); } };
};
const slice43 = createSlice({ name: "ex43", initialState: { count: 0 }, reducers: { inc: s => { s.count++; }, dec: s => { s.count--; } } });
const store43 = configureStore({ reducer: slice43.reducer, enhancers: (gDE) => gDE().concat(monitorEnhancer43 as Parameters<typeof gDE>[0] extends undefined ? never : never) });
function Ex43_Name() { return <Provider store={store43}><Ex43_Inner /></Provider>; }
function Ex43_Inner() {
  const { count } = useSelector((s: ReturnType<typeof store43.getState>) => s);
  const d = useDispatch();
  return <div><p>Count: {count}</p><button onClick={() => d(slice43.actions.inc())}>+</button><button onClick={() => d(slice43.actions.dec())}>-</button><p style={{ fontSize: 11 }}>Check console — custom store enhancer logs every dispatch</p></div>;
}

// 44. Custom comparator for useSelector
const slice44 = createSlice({ name: "ex44", initialState: { users: [{ id: 1, name: "Alice", score: 95 }, { id: 2, name: "Bob", score: 80 }], noiseCounter: 0 }, reducers: { noise: s => { s.noiseCounter++; }, addScore: (s, a: PayloadAction<number>) => { s.users.forEach(u => { u.score += a.payload; }); } } });
const store44 = configureStore({ reducer: slice44.reducer });
type RS44 = ReturnType<typeof store44.getState>;
function Ex44_Name() { return <Provider store={store44}><Ex44_Inner /></Provider>; }
function Ex44_Inner() {
  const d = useDispatch();
  const renders = useRef(0); renders.current++;
  // Without custom equality — re-renders on noise
  const allState = useSelector((s: RS44) => s);
  // With custom equality — only re-renders when scores change
  const totalScore = useSelector((s: RS44) => s.users.reduce((sum, u) => sum + u.score, 0), (a, b) => a === b);
  return <div><p>All state renders: {renders.current} | noise: {allState.noiseCounter}</p><p>Total score (stable): {totalScore}</p><button onClick={() => d(slice44.actions.noise())}>Noise (increments noiseCounter)</button><button onClick={() => d(slice44.actions.addScore(5))}>+5 to all scores</button></div>;
}

// 45. RTK entity upsert/upsertMany
interface Record45 { id: number; key: string; value: string; version: number; }
const adapter45 = createEntityAdapter<Record45>();
const slice45 = createSlice({ name: "ex45", initialState: adapter45.getInitialState(), reducers: { upsert: adapter45.upsertOne, upsertMany: adapter45.upsertMany, remove: adapter45.removeOne, clear: adapter45.removeAll } });
const store45 = configureStore({ reducer: slice45.reducer });
type RS45 = ReturnType<typeof store45.getState>;
const sel45 = adapter45.getSelectors((s: RS45) => s);
function Ex45_Name() { return <Provider store={store45}><Ex45_Inner /></Provider>; }
function Ex45_Inner() {
  const all = useSelector(sel45.selectAll);
  const d = useDispatch();
  const [counter, setCounter] = useState(1);
  const upsertBatch = () => {
    d(slice45.actions.upsertMany([{ id: 1, key: "config.theme", value: "dark", version: counter }, { id: 2, key: "config.lang", value: "en", version: counter }, { id: counter, key: `dynamic.key${counter}`, value: `val${counter}`, version: 1 }]));
    setCounter(c => c + 1);
  };
  return <div><button onClick={upsertBatch}>Upsert Batch (updates existing, inserts new)</button><button onClick={() => d(slice45.actions.clear())}>Clear</button><ul style={{ fontSize: 11 }}>{all.map(r => <li key={r.id}>id:{r.id} {r.key}={r.value} v:{r.version} <button onClick={() => d(slice45.actions.remove(r.id))}>x</button></li>)}</ul></div>;
}

// 46. Slice with reset action
const slice46 = createSlice({ name: "ex46", initialState: { count: 0, items: [] as string[], user: { name: "default", score: 0 } }, reducers: { inc: s => { s.count++; }, addItem: (s, a: PayloadAction<string>) => { s.items.push(a.payload); }, setScore: (s, a: PayloadAction<number>) => { s.user.score = a.payload; }, resetCount: s => { s.count = 0; }, resetItems: s => { s.items = []; }, resetAll: () => ({ count: 0, items: [], user: { name: "default", score: 0 } }) } });
const store46 = configureStore({ reducer: slice46.reducer });
function Ex46_Name() { return <Provider store={store46}><Ex46_Inner /></Provider>; }
function Ex46_Inner() {
  const { count, items, user } = useSelector((s: ReturnType<typeof store46.getState>) => s);
  const d = useDispatch();
  return <div><p>Count: {count} | Items: {items.length} | Score: {user.score}</p><div><button onClick={() => d(slice46.actions.inc())}>+Count</button><button onClick={() => d(slice46.actions.addItem(`i${items.length + 1}`))}>+Item</button><button onClick={() => d(slice46.actions.setScore(user.score + 10))}>+Score</button></div><div><button onClick={() => d(slice46.actions.resetCount())}>Reset Count</button><button onClick={() => d(slice46.actions.resetItems())}>Reset Items</button><button onClick={() => d(slice46.actions.resetAll())} style={{ background: "#f44336", color: "#fff" }}>Reset ALL</button></div></div>;
}

// 47. RTK immer mutations (array push/splice)
const slice47 = createSlice({ name: "ex47", initialState: { matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] as number[][], selected: [] as [number, number][] }, reducers: { set: (s, a: PayloadAction<{ row: number; col: number; val: number }>) => { s.matrix[a.payload.row][a.payload.col] = a.payload.val; }, toggleSelect: (s, a: PayloadAction<[number, number]>) => { const [r, c] = a.payload; const idx = s.selected.findIndex(([sr, sc]) => sr === r && sc === c); if (idx >= 0) s.selected.splice(idx, 1); else s.selected.push([r, c]); }, clearSelect: s => { s.selected.splice(0, s.selected.length); }, shuffle: s => { s.matrix.forEach(row => { for (let i = row.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [row[i], row[j]] = [row[j], row[i]]; } }); } } });
const store47 = configureStore({ reducer: slice47.reducer });
function Ex47_Name() { return <Provider store={store47}><Ex47_Inner /></Provider>; }
function Ex47_Inner() {
  const { matrix, selected } = useSelector((s: ReturnType<typeof store47.getState>) => s);
  const d = useDispatch();
  const isSelected = (r: number, c: number) => selected.some(([sr, sc]) => sr === r && sc === c);
  return <div><div style={{ display: "inline-grid", gridTemplateColumns: "repeat(3,40px)", gap: 2 }}>{matrix.map((row, r) => row.map((val, c) => <div key={`${r}-${c}`} onClick={() => d(slice47.actions.toggleSelect([r, c]))} style={{ width: 40, height: 40, background: isSelected(r, c) ? "#2196f3" : "#eee", color: isSelected(r, c) ? "#fff" : "#333", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>{val}</div>))}</div><p style={{ fontSize: 11 }}>Selected: {selected.map(([r, c]) => `[${r},${c}]`).join(", ")}</p><div><button onClick={() => d(slice47.actions.shuffle())}>Shuffle Rows</button><button onClick={() => d(slice47.actions.clearSelect())}>Clear Select</button></div></div>;
}

// 48. Multi-store setup
const storeA48 = configureStore({ reducer: createSlice({ name: "storeA", initialState: { value: 0 }, reducers: { inc: s => { s.value++; } } }).reducer });
const storeB48 = configureStore({ reducer: createSlice({ name: "storeB", initialState: { text: "Store B" }, reducers: { append: (s, a: PayloadAction<string>) => { s.text += ` ${a.payload}`; } } }).reducer });
const sliceA48 = createSlice({ name: "storeA", initialState: { value: 0 }, reducers: { inc: s => { s.value++; } } });
const sliceB48 = createSlice({ name: "storeB", initialState: { text: "Store B" }, reducers: { append: (s, a: PayloadAction<string>) => { s.text += ` ${a.payload}`; } } });
function PanelA48() { const v = useSelector((s: ReturnType<typeof storeA48.getState>) => s.value); const d = useDispatch(); return <div style={{ border: "1px solid blue", padding: 8 }}><strong>Store A</strong>: {v}<button onClick={() => d(sliceA48.actions.inc())}>+</button></div>; }
function PanelB48() { const t = useSelector((s: ReturnType<typeof storeB48.getState>) => s.text); const d = useDispatch(); return <div style={{ border: "1px solid green", padding: 8 }}><strong>Store B</strong>: {t}<button onClick={() => d(sliceB48.actions.append("!"))}>"!"</button></div>; }
function Ex48_Name() { return <div><Provider store={storeA48}><PanelA48 /></Provider><Provider store={storeB48}><PanelB48 /></Provider></div>; }

// 49. Slice action creators for complex payloads
const slice49 = createSlice({ name: "ex49", initialState: { events: [] as { id: string; type: string; user: string; data: Record<string, unknown>; timestamp: string; severity: number }[] }, reducers: { logEvent: { reducer(s, a: PayloadAction<{ id: string; type: string; user: string; data: Record<string, unknown>; timestamp: string; severity: number }>) { s.events.unshift(a.payload); if (s.events.length > 10) s.events.pop(); }, prepare(type: string, user: string, data: Record<string, unknown> = {}, severity = 1) { return { payload: { id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`, type, user, data, timestamp: new Date().toISOString(), severity } }; } } } });
const store49 = configureStore({ reducer: slice49.reducer });
const severityColor49: Record<number, string> = { 1: "#c8e6c9", 2: "#fff9c4", 3: "#ffcdd2" };
function Ex49_Name() { return <Provider store={store49}><Ex49_Inner /></Provider>; }
function Ex49_Inner() {
  const { events } = useSelector((s: ReturnType<typeof store49.getState>) => s);
  const d = useDispatch();
  return <div><div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}><button onClick={() => d(slice49.actions.logEvent("login", "alice", { ip: "127.0.0.1" }, 1))}>Login event</button><button onClick={() => d(slice49.actions.logEvent("error", "system", { code: 500 }, 3))}>Error event</button><button onClick={() => d(slice49.actions.logEvent("update", "bob", { field: "email" }, 2))}>Update event</button></div><ul style={{ fontSize: 11 }}>{events.map(e => <li key={e.id} style={{ background: severityColor49[e.severity], padding: 2, marginTop: 2 }}>[{e.type}] {e.user} @ {e.timestamp.slice(11, 19)} severity:{e.severity}</li>)}</ul></div>;
}

// 50. Full RTK app (5 slices + entity adapter + configureStore)
const usersAdapter50 = createEntityAdapter<{ id: number; name: string; role: string }>();
const authSlice50 = createSlice({ name: "s50_auth", initialState: { userId: null as number | null }, reducers: { setUser: (s, a: PayloadAction<number | null>) => { s.userId = a.payload; } } });
const usersSlice50 = createSlice({ name: "s50_users", initialState: usersAdapter50.getInitialState(), reducers: { addUser: usersAdapter50.addOne, setAll: usersAdapter50.setAll } });
const cartSlice50 = createSlice({ name: "s50_cart", initialState: { items: [] as { name: string; qty: number }[] }, reducers: { add: (s, a: PayloadAction<string>) => { const ex = s.items.find(i => i.name === a.payload); if (ex) ex.qty++; else s.items.push({ name: a.payload, qty: 1 }); }, clear: s => { s.items = []; } } });
const uiSlice50 = createSlice({ name: "s50_ui", initialState: { darkMode: false, sidebarOpen: true }, reducers: { toggleDark: s => { s.darkMode = !s.darkMode; }, toggleSidebar: s => { s.sidebarOpen = !s.sidebarOpen; } } });
const notifSlice50 = createSlice({ name: "s50_notif", initialState: [] as { id: number; msg: string }[], reducers: { add: (s, a: PayloadAction<string>) => { s.push({ id: Date.now(), msg: a.payload }); }, remove: (s, a: PayloadAction<number>) => s.filter(n => n.id !== a.payload) } });
const store50 = configureStore({ reducer: { auth: authSlice50.reducer, users: usersSlice50.reducer, cart: cartSlice50.reducer, ui: uiSlice50.reducer, notifs: notifSlice50.reducer } });
type RS50 = ReturnType<typeof store50.getState>;
const userSel50 = usersAdapter50.getSelectors((s: RS50) => s.users);
function Ex50_Name() { return <Provider store={store50}><Ex50_Inner /></Provider>; }
function Ex50_Inner() {
  const auth = useSelector((s: RS50) => s.auth);
  const ui = useSelector((s: RS50) => s.ui);
  const cart = useSelector((s: RS50) => s.cart);
  const notifs = useSelector((s: RS50) => s.notifs);
  const allUsers = useSelector(userSel50.selectAll);
  const currentUser = useSelector((s: RS50) => auth.userId ? userSel50.selectById(s, auth.userId) : undefined);
  const d = useDispatch();
  useEffect(() => { d(usersSlice50.actions.setAll([{ id: 1, name: "Alice", role: "admin" }, { id: 2, name: "Bob", role: "user" }])); }, [d]);
  const bg = ui.darkMode ? "#1a1a2e" : "#f5f5f5";
  const fg = ui.darkMode ? "#eee" : "#333";
  return <div style={{ background: bg, color: fg, fontFamily: "sans-serif", minHeight: 200 }}><div style={{ background: ui.darkMode ? "#333" : "#3f51b5", color: "#fff", padding: "6px 12px", display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}><span><button onClick={() => d(uiSlice50.actions.toggleSidebar())} style={{ background: "none", color: "#fff", border: "none" }}>☰</button> Full RTK App</span><div style={{ display: "flex", gap: 6, fontSize: 12 }}>{allUsers.map(u => <button key={u.id} onClick={() => { d(authSlice50.actions.setUser(auth.userId === u.id ? null : u.id)); d(notifSlice50.actions.add(`${auth.userId === u.id ? "Logged out" : "Logged in as"} ${u.name}`)); }} style={{ background: auth.userId === u.id ? "#fff" : "transparent", color: auth.userId === u.id ? "#333" : "#fff", border: "1px solid #fff", padding: "2px 6px" }}>{u.name}</button>)}<button onClick={() => d(uiSlice50.actions.toggleDark())} style={{ background: "none", color: "#fff", border: "none" }}>{ui.darkMode ? "☀" : "🌙"}</button></div></div><div style={{ display: "flex" }}>{ui.sidebarOpen && <div style={{ width: 100, borderRight: "1px solid #ccc", padding: 8 }}><p style={{ margin: 0, fontSize: 11 }}>User: {currentUser?.name ?? "none"}</p><button onClick={() => { d(cartSlice50.actions.add("Widget")); d(notifSlice50.actions.add("Added Widget to cart")); }} style={{ margin: "4px 0", display: "block", fontSize: 12 }}>Add Widget</button><button onClick={() => { d(cartSlice50.actions.clear()); }} style={{ fontSize: 12 }}>Clear Cart</button></div>}<div style={{ flex: 1, padding: 8 }}><p>Cart: {cart.items.map(i => `${i.name}×${i.qty}`).join(", ") || "empty"}</p><div style={{ maxHeight: 80, overflowY: "auto" }}>{notifs.map(n => <div key={n.id} style={{ fontSize: 11, background: ui.darkMode ? "#333" : "#e3f2fd", padding: 2, marginTop: 2 }}>{n.msg} <button onClick={() => d(notifSlice50.actions.remove(n.id))} style={{ fontSize: 10 }}>x</button></div>)}</div></div></div></div>;
}

// ─── EXPORT ────────────────────────────────────────────────────────────────────

export default function ReduxToolkitExamples() {
  const sections = [
    { label: "BASIC", examples: [{ n: "01", C: Ex01_Name, title: "createSlice basic" }, { n: "02", C: Ex02_Name, title: "configureStore basic" }, { n: "03", C: Ex03_Name, title: "createSlice initialState" }, { n: "04", C: Ex04_Name, title: "Slice actions auto-generated" }, { n: "05", C: Ex05_Name, title: "Slice reducer" }, { n: "06", C: Ex06_Name, title: "configureStore multiple slices" }, { n: "07", C: Ex07_Name, title: "createReducer builder" }, { n: "08", C: Ex08_Name, title: "createAction standalone" }, { n: "09", C: Ex09_Name, title: "Slice prepare reducer" }, { n: "10", C: Ex10_Name, title: "extraReducers builder" }, { n: "11", C: Ex11_Name, title: "Complex state type" }, { n: "12", C: Ex12_Name, title: "configureStore middleware" }] },
    { label: "INTERMEDIATE", examples: [{ n: "13", C: Ex13_Name, title: "Counter slice full" }, { n: "14", C: Ex14_Name, title: "Todo slice CRUD" }, { n: "15", C: Ex15_Name, title: "Auth slice" }, { n: "16", C: Ex16_Name, title: "Cart slice" }, { n: "17", C: Ex17_Name, title: "UI slice" }, { n: "18", C: Ex18_Name, title: "Filter slice" }, { n: "19", C: Ex19_Name, title: "Theme slice" }, { n: "20", C: Ex20_Name, title: "Notification slice" }, { n: "21", C: Ex21_Name, title: "createEntityAdapter basic" }, { n: "22", C: Ex22_Name, title: "Entity adapter CRUD" }, { n: "23", C: Ex23_Name, title: "Entity adapter selectors" }, { n: "24", C: Ex24_Name, title: "Computed initialState" }, { n: "25", C: Ex25_Name, title: "Multiple slices" }] },
    { label: "NESTED", examples: [{ n: "26", C: Ex26_Name, title: "Nested object (Immer)" }, { n: "27", C: Ex27_Name, title: "Normalized + entity adapter" }, { n: "28", C: Ex28_Name, title: "extraReducers cross-slice" }, { n: "29", C: Ex29_Name, title: "Cross-slice communication" }, { n: "30", C: Ex30_Name, title: "Entity adapter custom selectors" }, { n: "31", C: Ex31_Name, title: "Tree data with Immer" }, { n: "32", C: Ex32_Name, title: "Complex array ops (Immer)" }, { n: "33", C: Ex33_Name, title: "Slice with undo history" }, { n: "34", C: Ex34_Name, title: "Builder pattern createReducer" }, { n: "35", C: Ex35_Name, title: "Manual cache slice" }, { n: "36", C: Ex36_Name, title: "Optimistic updates" }, { n: "37", C: Ex37_Name, title: "Rollback on failure" }] },
    { label: "ADVANCED", examples: [{ n: "38", C: Ex38_Name, title: "Listener middleware" }, { n: "39", C: Ex39_Name, title: "Entity adapter pagination" }, { n: "40", C: Ex40_Name, title: "Entity adapter sorting" }, { n: "41", C: Ex41_Name, title: "Custom slice middleware" }, { n: "42", C: Ex42_Name, title: "Serializability config" }, { n: "43", C: Ex43_Name, title: "Store enhancer" }, { n: "44", C: Ex44_Name, title: "Custom selector comparator" }, { n: "45", C: Ex45_Name, title: "Entity upsert/upsertMany" }, { n: "46", C: Ex46_Name, title: "Partial + full reset" }, { n: "47", C: Ex47_Name, title: "Immer array mutations" }, { n: "48", C: Ex48_Name, title: "Multi-store setup" }, { n: "49", C: Ex49_Name, title: "Complex payload creators" }, { n: "50", C: Ex50_Name, title: "Full RTK app (5 slices)" }] },
  ];
  return (
    <div style={{ fontFamily: "sans-serif", padding: 16 }}>
      <h1>Redux Toolkit — 50 Examples</h1>
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
