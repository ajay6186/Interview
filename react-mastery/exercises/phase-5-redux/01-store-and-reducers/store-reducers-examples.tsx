import React, { useState } from "react";
import {
  configureStore,
  createSlice,
  createReducer,
  createAction,
  createEntityAdapter,
  combineReducers,
  PayloadAction,
} from "@reduxjs/toolkit";
import { Provider, useSelector, useDispatch } from "react-redux";

// ─── BASIC 1–12 ────────────────────────────────────────────────────────────────

// 1. Simple number state reducer
const slice01 = createSlice({ name: "ex01", initialState: 0, reducers: { increment: (s) => s + 1, decrement: (s) => s - 1 } });
const store01 = configureStore({ reducer: slice01.reducer });
function Ex01_Name() { return <Provider store={store01}><Ex01_Inner /></Provider>; }
function Ex01_Inner() {
  const n = useSelector((s: ReturnType<typeof store01.getState>) => s);
  const d = useDispatch();
  return <div><p>Count: {n}</p><button onClick={() => d(slice01.actions.increment())}>+</button><button onClick={() => d(slice01.actions.decrement())}>-</button></div>;
}

// 2. Boolean toggle reducer
const slice02 = createSlice({ name: "ex02", initialState: false, reducers: { toggle: (s) => !s } });
const store02 = configureStore({ reducer: slice02.reducer });
function Ex02_Name() { return <Provider store={store02}><Ex02_Inner /></Provider>; }
function Ex02_Inner() {
  const on = useSelector((s: ReturnType<typeof store02.getState>) => s);
  const d = useDispatch();
  return <div><p>State: {on ? "ON" : "OFF"}</p><button onClick={() => d(slice02.actions.toggle())}>Toggle</button></div>;
}

// 3. String state reducer
const slice03 = createSlice({ name: "ex03", initialState: "hello", reducers: { setMessage: (_, a: PayloadAction<string>) => a.payload, clear: () => "" } });
const store03 = configureStore({ reducer: slice03.reducer });
function Ex03_Name() { return <Provider store={store03}><Ex03_Inner /></Provider>; }
function Ex03_Inner() {
  const msg = useSelector((s: ReturnType<typeof store03.getState>) => s);
  const d = useDispatch();
  const [v, setV] = useState("");
  return <div><p>Message: "{msg}"</p><input value={v} onChange={e => setV(e.target.value)} /><button onClick={() => { d(slice03.actions.setMessage(v)); setV(""); }}>Set</button><button onClick={() => d(slice03.actions.clear())}>Clear</button></div>;
}

// 4. Counter with reset
const slice04 = createSlice({ name: "ex04", initialState: 0, reducers: { inc: (s) => s + 1, dec: (s) => s - 1, reset: () => 0 } });
const store04 = configureStore({ reducer: slice04.reducer });
function Ex04_Name() { return <Provider store={store04}><Ex04_Inner /></Provider>; }
function Ex04_Inner() {
  const n = useSelector((s: ReturnType<typeof store04.getState>) => s);
  const d = useDispatch();
  return <div><p>{n}</p><button onClick={() => d(slice04.actions.inc())}>+</button><button onClick={() => d(slice04.actions.dec())}>-</button><button onClick={() => d(slice04.actions.reset())}>Reset</button></div>;
}

// 5. Reducer with multiple action types
const slice05 = createSlice({ name: "ex05", initialState: { count: 0, label: "neutral" }, reducers: { up: (s) => { s.count++; s.label = "positive"; }, down: (s) => { s.count--; s.label = "negative"; }, zero: (s) => { s.count = 0; s.label = "neutral"; } } });
const store05 = configureStore({ reducer: slice05.reducer });
function Ex05_Name() { return <Provider store={store05}><Ex05_Inner /></Provider>; }
function Ex05_Inner() {
  const { count, label } = useSelector((s: ReturnType<typeof store05.getState>) => s);
  const d = useDispatch();
  return <div><p>{count} — {label}</p><button onClick={() => d(slice05.actions.up())}>Up</button><button onClick={() => d(slice05.actions.down())}>Down</button><button onClick={() => d(slice05.actions.zero())}>Zero</button></div>;
}

// 6. Reducer with initial state
const initialState06 = { name: "Alice", age: 30, active: true };
const slice06 = createSlice({ name: "ex06", initialState: initialState06, reducers: { birthday: (s) => { s.age++; }, deactivate: (s) => { s.active = false; }, reset: () => initialState06 } });
const store06 = configureStore({ reducer: slice06.reducer });
function Ex06_Name() { return <Provider store={store06}><Ex06_Inner /></Provider>; }
function Ex06_Inner() {
  const u = useSelector((s: ReturnType<typeof store06.getState>) => s);
  const d = useDispatch();
  return <div><p>{u.name}, {u.age}, {u.active ? "active" : "inactive"}</p><button onClick={() => d(slice06.actions.birthday())}>Birthday</button><button onClick={() => d(slice06.actions.deactivate())}>Deactivate</button><button onClick={() => d(slice06.actions.reset())}>Reset</button></div>;
}

// 7. Array add/remove reducer
const slice07 = createSlice({ name: "ex07", initialState: [] as string[], reducers: { add: (s, a: PayloadAction<string>) => { s.push(a.payload); }, remove: (s, a: PayloadAction<number>) => { s.splice(a.payload, 1); } } });
const store07 = configureStore({ reducer: slice07.reducer });
function Ex07_Name() { return <Provider store={store07}><Ex07_Inner /></Provider>; }
function Ex07_Inner() {
  const items = useSelector((s: ReturnType<typeof store07.getState>) => s);
  const d = useDispatch();
  const [v, setV] = useState("");
  return <div><ul>{items.map((it, i) => <li key={i}>{it} <button onClick={() => d(slice07.actions.remove(i))}>x</button></li>)}</ul><input value={v} onChange={e => setV(e.target.value)} /><button onClick={() => { if (v) { d(slice07.actions.add(v)); setV(""); } }}>Add</button></div>;
}

// 8. Status reducer (idle/loading/done/error)
type Status = "idle" | "loading" | "done" | "error";
const slice08 = createSlice({ name: "ex08", initialState: "idle" as Status, reducers: { load: () => "loading" as Status, succeed: () => "done" as Status, fail: () => "error" as Status, reset: () => "idle" as Status } });
const store08 = configureStore({ reducer: slice08.reducer });
function Ex08_Name() { return <Provider store={store08}><Ex08_Inner /></Provider>; }
function Ex08_Inner() {
  const s = useSelector((s: ReturnType<typeof store08.getState>) => s);
  const d = useDispatch();
  return <div><p>Status: <strong>{s}</strong></p><button onClick={() => d(slice08.actions.load())}>Load</button><button onClick={() => d(slice08.actions.succeed())}>Succeed</button><button onClick={() => d(slice08.actions.fail())}>Fail</button><button onClick={() => d(slice08.actions.reset())}>Reset</button></div>;
}

// 9. Reducer returning new object
const slice09 = createSlice({ name: "ex09", initialState: { x: 0, y: 0 }, reducers: { moveRight: (s) => { s.x += 10; }, moveDown: (s) => { s.y += 10; }, moveLeft: (s) => { s.x -= 10; }, moveUp: (s) => { s.y -= 10; } } });
const store09 = configureStore({ reducer: slice09.reducer });
function Ex09_Name() { return <Provider store={store09}><Ex09_Inner /></Provider>; }
function Ex09_Inner() {
  const pos = useSelector((s: ReturnType<typeof store09.getState>) => s);
  const d = useDispatch();
  return <div><p>x:{pos.x} y:{pos.y}</p><div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", width: 120 }}><span /><button onClick={() => d(slice09.actions.moveUp())}>↑</button><span /><button onClick={() => d(slice09.actions.moveLeft())}>←</button><span /><button onClick={() => d(slice09.actions.moveRight())}>→</button><span /><button onClick={() => d(slice09.actions.moveDown())}>↓</button></div></div>;
}

// 10. Pure function reducer (no side effects)
const slice10 = createSlice({ name: "ex10", initialState: { value: 1, history: [] as number[] }, reducers: { double: (s) => { s.history.push(s.value); s.value *= 2; }, halve: (s) => { s.history.push(s.value); s.value = Math.floor(s.value / 2); }, undo: (s) => { const prev = s.history.pop(); if (prev !== undefined) s.value = prev; } } });
const store10 = configureStore({ reducer: slice10.reducer });
function Ex10_Name() { return <Provider store={store10}><Ex10_Inner /></Provider>; }
function Ex10_Inner() {
  const { value, history } = useSelector((s: ReturnType<typeof store10.getState>) => s);
  const d = useDispatch();
  return <div><p>Value: {value}</p><p>History: [{history.join(", ")}]</p><button onClick={() => d(slice10.actions.double())}>×2</button><button onClick={() => d(slice10.actions.halve())}>÷2</button><button onClick={() => d(slice10.actions.undo())}>Undo</button></div>;
}

// 11. Default case in reducer
const slice11 = createSlice({ name: "ex11", initialState: { count: 0, unknown: 0 }, reducers: { inc: (s) => { s.count++; }, trackUnknown: (s) => { s.unknown++; } } });
const store11 = configureStore({ reducer: slice11.reducer });
function Ex11_Name() { return <Provider store={store11}><Ex11_Inner /></Provider>; }
function Ex11_Inner() {
  const { count, unknown } = useSelector((s: ReturnType<typeof store11.getState>) => s);
  const d = useDispatch();
  return <div><p>Known: {count} | Unknown dispatches: {unknown}</p><button onClick={() => d(slice11.actions.inc())}>Known Action</button><button onClick={() => d(slice11.actions.trackUnknown())}>Track Unknown</button></div>;
}

// 12. Reducer with payload
const slice12 = createSlice({ name: "ex12", initialState: { items: [] as { id: number; text: string }[], nextId: 1 }, reducers: { addItem: (s, a: PayloadAction<string>) => { s.items.push({ id: s.nextId++, text: a.payload }); }, removeById: (s, a: PayloadAction<number>) => { s.items = s.items.filter(i => i.id !== a.payload); } } });
const store12 = configureStore({ reducer: slice12.reducer });
function Ex12_Name() { return <Provider store={store12}><Ex12_Inner /></Provider>; }
function Ex12_Inner() {
  const { items } = useSelector((s: ReturnType<typeof store12.getState>) => s);
  const d = useDispatch();
  const [v, setV] = useState("");
  return <div><ul>{items.map(i => <li key={i.id}>{i.id}: {i.text} <button onClick={() => d(slice12.actions.removeById(i.id))}>x</button></li>)}</ul><input value={v} onChange={e => setV(e.target.value)} /><button onClick={() => { if (v) { d(slice12.actions.addItem(v)); setV(""); } }}>Add</button></div>;
}

// ─── INTERMEDIATE 13–25 ─────────────────────────────────────────────────────────

// 13. User profile reducer
interface UserProfile { name: string; email: string; bio: string; }
const slice13 = createSlice({ name: "ex13", initialState: { name: "Alice", email: "alice@example.com", bio: "Developer" } as UserProfile, reducers: { updateName: (s, a: PayloadAction<string>) => { s.name = a.payload; }, updateEmail: (s, a: PayloadAction<string>) => { s.email = a.payload; }, updateBio: (s, a: PayloadAction<string>) => { s.bio = a.payload; } } });
const store13 = configureStore({ reducer: slice13.reducer });
function Ex13_Name() { return <Provider store={store13}><Ex13_Inner /></Provider>; }
function Ex13_Inner() {
  const u = useSelector((s: ReturnType<typeof store13.getState>) => s);
  const d = useDispatch();
  return <div><p>{u.name} | {u.email}</p><p>{u.bio}</p><input placeholder="Name" onBlur={e => d(slice13.actions.updateName(e.target.value))} /><input placeholder="Email" onBlur={e => d(slice13.actions.updateEmail(e.target.value))} /><input placeholder="Bio" onBlur={e => d(slice13.actions.updateBio(e.target.value))} /></div>;
}

// 14. Todo list reducer (CRUD)
interface Todo14 { id: number; text: string; done: boolean; }
const slice14 = createSlice({ name: "ex14", initialState: { todos: [] as Todo14[], nextId: 1 }, reducers: { add: (s, a: PayloadAction<string>) => { s.todos.push({ id: s.nextId++, text: a.payload, done: false }); }, toggle: (s, a: PayloadAction<number>) => { const t = s.todos.find(t => t.id === a.payload); if (t) t.done = !t.done; }, remove: (s, a: PayloadAction<number>) => { s.todos = s.todos.filter(t => t.id !== a.payload); } } });
const store14 = configureStore({ reducer: slice14.reducer });
function Ex14_Name() { return <Provider store={store14}><Ex14_Inner /></Provider>; }
function Ex14_Inner() {
  const { todos } = useSelector((s: ReturnType<typeof store14.getState>) => s);
  const d = useDispatch();
  const [v, setV] = useState("");
  return <div><ul>{todos.map(t => <li key={t.id} style={{ textDecoration: t.done ? "line-through" : "none" }}><span onClick={() => d(slice14.actions.toggle(t.id))}>{t.text}</span> <button onClick={() => d(slice14.actions.remove(t.id))}>x</button></li>)}</ul><input value={v} onChange={e => setV(e.target.value)} /><button onClick={() => { if (v) { d(slice14.actions.add(v)); setV(""); } }}>Add</button></div>;
}

// 15. Counter with step (payload)
const slice15 = createSlice({ name: "ex15", initialState: { count: 0, step: 1 }, reducers: { increment: (s) => { s.count += s.step; }, decrement: (s) => { s.count -= s.step; }, setStep: (s, a: PayloadAction<number>) => { s.step = a.payload; }, reset: (s) => { s.count = 0; } } });
const store15 = configureStore({ reducer: slice15.reducer });
function Ex15_Name() { return <Provider store={store15}><Ex15_Inner /></Provider>; }
function Ex15_Inner() {
  const { count, step } = useSelector((s: ReturnType<typeof store15.getState>) => s);
  const d = useDispatch();
  return <div><p>Count: {count} (step: {step})</p><button onClick={() => d(slice15.actions.decrement())}>-{step}</button><button onClick={() => d(slice15.actions.increment())}>+{step}</button><button onClick={() => d(slice15.actions.reset())}>Reset</button><br /><label>Step: <input type="number" value={step} onChange={e => d(slice15.actions.setStep(Number(e.target.value)))} style={{ width: 50 }} /></label></div>;
}

// 16. Settings reducer (nested object)
interface Settings16 { theme: "light" | "dark"; fontSize: number; language: string; notifications: boolean; }
const slice16 = createSlice({ name: "ex16", initialState: { theme: "light", fontSize: 14, language: "en", notifications: true } as Settings16, reducers: { toggleTheme: (s) => { s.theme = s.theme === "light" ? "dark" : "light"; }, setFontSize: (s, a: PayloadAction<number>) => { s.fontSize = a.payload; }, setLanguage: (s, a: PayloadAction<string>) => { s.language = a.payload; }, toggleNotifications: (s) => { s.notifications = !s.notifications; } } });
const store16 = configureStore({ reducer: slice16.reducer });
function Ex16_Name() { return <Provider store={store16}><Ex16_Inner /></Provider>; }
function Ex16_Inner() {
  const cfg = useSelector((s: ReturnType<typeof store16.getState>) => s);
  const d = useDispatch();
  return <div style={{ background: cfg.theme === "dark" ? "#333" : "#fff", color: cfg.theme === "dark" ? "#fff" : "#000", padding: 8, fontSize: cfg.fontSize }}><p>Theme: {cfg.theme} | Lang: {cfg.language} | Font: {cfg.fontSize}px | Notif: {cfg.notifications ? "on" : "off"}</p><button onClick={() => d(slice16.actions.toggleTheme())}>Toggle Theme</button><button onClick={() => d(slice16.actions.setFontSize(cfg.fontSize + 1))}>Font+</button><button onClick={() => d(slice16.actions.toggleNotifications())}>Toggle Notif</button></div>;
}

// 17. Auth reducer
interface AuthState17 { isLoggedIn: boolean; user: string | null; role: "guest" | "user" | "admin"; }
const slice17 = createSlice({ name: "ex17", initialState: { isLoggedIn: false, user: null, role: "guest" } as AuthState17, reducers: { login: (s, a: PayloadAction<{ user: string; role: "user" | "admin" }>) => { s.isLoggedIn = true; s.user = a.payload.user; s.role = a.payload.role; }, logout: (s) => { s.isLoggedIn = false; s.user = null; s.role = "guest"; } } });
const store17 = configureStore({ reducer: slice17.reducer });
function Ex17_Name() { return <Provider store={store17}><Ex17_Inner /></Provider>; }
function Ex17_Inner() {
  const auth = useSelector((s: ReturnType<typeof store17.getState>) => s);
  const d = useDispatch();
  return <div>{auth.isLoggedIn ? <div><p>Welcome {auth.user} ({auth.role})</p><button onClick={() => d(slice17.actions.logout())}>Logout</button></div> : <div><button onClick={() => d(slice17.actions.login({ user: "Alice", role: "admin" }))}>Login as Admin</button><button onClick={() => d(slice17.actions.login({ user: "Bob", role: "user" }))}>Login as User</button></div>}</div>;
}

// 18. Cart reducer
interface CartItem18 { id: number; name: string; price: number; qty: number; }
const slice18 = createSlice({ name: "ex18", initialState: [] as CartItem18[], reducers: { add: (s, a: PayloadAction<Omit<CartItem18, "qty">>) => { const ex = s.find(i => i.id === a.payload.id); if (ex) ex.qty++; else s.push({ ...a.payload, qty: 1 }); }, remove: (s, a: PayloadAction<number>) => s.filter(i => i.id !== a.payload), updateQty: (s, a: PayloadAction<{ id: number; qty: number }>) => { const i = s.find(i => i.id === a.payload.id); if (i) i.qty = a.payload.qty; } } });
const store18 = configureStore({ reducer: slice18.reducer });
const products18 = [{ id: 1, name: "Apple", price: 1.5 }, { id: 2, name: "Banana", price: 0.8 }, { id: 3, name: "Cherry", price: 3.0 }];
function Ex18_Name() { return <Provider store={store18}><Ex18_Inner /></Provider>; }
function Ex18_Inner() {
  const cart = useSelector((s: ReturnType<typeof store18.getState>) => s);
  const d = useDispatch();
  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  return <div><div>{products18.map(p => <button key={p.id} onClick={() => d(slice18.actions.add(p))}>Add {p.name}</button>)}</div><ul>{cart.map(i => <li key={i.id}>{i.name} ×{i.qty} = ${(i.price * i.qty).toFixed(2)} <button onClick={() => d(slice18.actions.remove(i.id))}>x</button></li>)}</ul><p>Total: ${total.toFixed(2)}</p></div>;
}

// 19. Notification reducer
interface Notif19 { id: number; msg: string; type: "info" | "warn" | "error"; }
const slice19 = createSlice({ name: "ex19", initialState: { notifs: [] as Notif19[], nextId: 1 }, reducers: { add: (s, a: PayloadAction<Omit<Notif19, "id">>) => { s.notifs.push({ ...a.payload, id: s.nextId++ }); }, dismiss: (s, a: PayloadAction<number>) => { s.notifs = s.notifs.filter(n => n.id !== a.payload); }, clear: (s) => { s.notifs = []; } } });
const store19 = configureStore({ reducer: slice19.reducer });
function Ex19_Name() { return <Provider store={store19}><Ex19_Inner /></Provider>; }
function Ex19_Inner() {
  const { notifs } = useSelector((s: ReturnType<typeof store19.getState>) => s);
  const d = useDispatch();
  const colors: Record<string, string> = { info: "#d0e8ff", warn: "#fff3cd", error: "#f8d7da" };
  return <div><div>{(["info", "warn", "error"] as const).map(t => <button key={t} onClick={() => d(slice19.actions.add({ msg: `A ${t} message`, type: t }))}>Add {t}</button>)}</div><button onClick={() => d(slice19.actions.clear())}>Clear All</button><ul>{notifs.map(n => <li key={n.id} style={{ background: colors[n.type], padding: 4, marginTop: 4 }}>{n.msg} <button onClick={() => d(slice19.actions.dismiss(n.id))}>x</button></li>)}</ul></div>;
}

// 20. Pagination reducer
const slice20 = createSlice({ name: "ex20", initialState: { page: 1, pageSize: 5, total: 47 }, reducers: { nextPage: (s) => { if (s.page < Math.ceil(s.total / s.pageSize)) s.page++; }, prevPage: (s) => { if (s.page > 1) s.page--; }, setPage: (s, a: PayloadAction<number>) => { s.page = a.payload; }, setPageSize: (s, a: PayloadAction<number>) => { s.pageSize = a.payload; s.page = 1; } } });
const store20 = configureStore({ reducer: slice20.reducer });
function Ex20_Name() { return <Provider store={store20}><Ex20_Inner /></Provider>; }
function Ex20_Inner() {
  const { page, pageSize, total } = useSelector((s: ReturnType<typeof store20.getState>) => s);
  const d = useDispatch();
  const totalPages = Math.ceil(total / pageSize);
  return <div><p>Page {page} of {totalPages} ({total} items, {pageSize}/page)</p><button onClick={() => d(slice20.actions.prevPage())} disabled={page === 1}>Prev</button><button onClick={() => d(slice20.actions.nextPage())} disabled={page === totalPages}>Next</button><select value={pageSize} onChange={e => d(slice20.actions.setPageSize(Number(e.target.value)))}><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option></select></div>;
}

// 21. Filter reducer
const slice21 = createSlice({ name: "ex21", initialState: { search: "", sort: "asc" as "asc" | "desc", category: "all" }, reducers: { setSearch: (s, a: PayloadAction<string>) => { s.search = a.payload; }, setSort: (s, a: PayloadAction<"asc" | "desc">) => { s.sort = a.payload; }, setCategory: (s, a: PayloadAction<string>) => { s.category = a.payload; }, reset: () => ({ search: "", sort: "asc" as const, category: "all" }) } });
const store21 = configureStore({ reducer: slice21.reducer });
function Ex21_Name() { return <Provider store={store21}><Ex21_Inner /></Provider>; }
function Ex21_Inner() {
  const f = useSelector((s: ReturnType<typeof store21.getState>) => s);
  const d = useDispatch();
  const items = ["Apple", "Banana", "Cherry", "Date", "Elderberry"].filter(i => i.toLowerCase().includes(f.search.toLowerCase())).sort((a, b) => f.sort === "asc" ? a.localeCompare(b) : b.localeCompare(a));
  return <div><input placeholder="Search" value={f.search} onChange={e => d(slice21.actions.setSearch(e.target.value))} /><select value={f.sort} onChange={e => d(slice21.actions.setSort(e.target.value as "asc" | "desc"))}><option value="asc">A→Z</option><option value="desc">Z→A</option></select><button onClick={() => d(slice21.actions.reset())}>Reset</button><ul>{items.map(i => <li key={i}>{i}</li>)}</ul></div>;
}

// 22. Tab/navigation reducer
const slice22 = createSlice({ name: "ex22", initialState: { activeTab: "home", history: ["home"] as string[] }, reducers: { navigate: (s, a: PayloadAction<string>) => { s.activeTab = a.payload; s.history.push(a.payload); }, back: (s) => { if (s.history.length > 1) { s.history.pop(); s.activeTab = s.history[s.history.length - 1]; } } } });
const store22 = configureStore({ reducer: slice22.reducer });
const tabs22 = ["home", "profile", "settings", "help"];
function Ex22_Name() { return <Provider store={store22}><Ex22_Inner /></Provider>; }
function Ex22_Inner() {
  const { activeTab, history } = useSelector((s: ReturnType<typeof store22.getState>) => s);
  const d = useDispatch();
  const content: Record<string, string> = { home: "Home Content", profile: "Your Profile", settings: "App Settings", help: "Help & Support" };
  return <div><div style={{ display: "flex", gap: 4 }}>{tabs22.map(t => <button key={t} onClick={() => d(slice22.actions.navigate(t))} style={{ fontWeight: activeTab === t ? "bold" : "normal" }}>{t}</button>)}</div><div style={{ border: "1px solid #ccc", padding: 8 }}>{content[activeTab]}</div><button onClick={() => d(slice22.actions.back())} disabled={history.length <= 1}>← Back</button></div>;
}

// 23. Score/leaderboard reducer
interface Player23 { id: number; name: string; score: number; }
const slice23 = createSlice({ name: "ex23", initialState: [{ id: 1, name: "Alice", score: 100 }, { id: 2, name: "Bob", score: 80 }, { id: 3, name: "Carol", score: 90 }] as Player23[], reducers: { addScore: (s, a: PayloadAction<{ id: number; pts: number }>) => { const p = s.find(p => p.id === a.payload.id); if (p) p.score += a.payload.pts; }, reset: (s) => { s.forEach(p => { p.score = 0; }); } } });
const store23 = configureStore({ reducer: slice23.reducer });
function Ex23_Name() { return <Provider store={store23}><Ex23_Inner /></Provider>; }
function Ex23_Inner() {
  const players = useSelector((s: ReturnType<typeof store23.getState>) => [...s].sort((a, b) => b.score - a.score));
  const d = useDispatch();
  return <div><ol>{players.map((p, i) => <li key={p.id}>#{i + 1} {p.name}: {p.score} <button onClick={() => d(slice23.actions.addScore({ id: p.id, pts: 10 }))}>+10</button></li>)}</ol><button onClick={() => d(slice23.actions.reset())}>Reset Scores</button></div>;
}

// 24. Form state reducer
interface FormState24 { name: string; email: string; password: string; errors: Record<string, string>; submitted: boolean; }
const slice24 = createSlice({ name: "ex24", initialState: { name: "", email: "", password: "", errors: {}, submitted: false } as FormState24, reducers: { setField: (s, a: PayloadAction<{ field: keyof Omit<FormState24, "errors" | "submitted">; value: string }>) => { (s as Record<string, unknown>)[a.payload.field] = a.payload.value; }, setError: (s, a: PayloadAction<{ field: string; msg: string }>) => { s.errors[a.payload.field] = a.payload.msg; }, clearError: (s, a: PayloadAction<string>) => { delete s.errors[a.payload]; }, submit: (s) => { s.submitted = true; }, reset: () => ({ name: "", email: "", password: "", errors: {}, submitted: false }) } });
const store24 = configureStore({ reducer: slice24.reducer });
function Ex24_Name() { return <Provider store={store24}><Ex24_Inner /></Provider>; }
function Ex24_Inner() {
  const form = useSelector((s: ReturnType<typeof store24.getState>) => s);
  const d = useDispatch();
  const handleSubmit = () => {
    let valid = true;
    if (!form.name) { d(slice24.actions.setError({ field: "name", msg: "Required" })); valid = false; }
    if (!form.email.includes("@")) { d(slice24.actions.setError({ field: "email", msg: "Invalid email" })); valid = false; }
    if (form.password.length < 6) { d(slice24.actions.setError({ field: "password", msg: "Min 6 chars" })); valid = false; }
    if (valid) d(slice24.actions.submit());
  };
  if (form.submitted) return <div><p>Submitted! Hello {form.name}</p><button onClick={() => d(slice24.actions.reset())}>Reset</button></div>;
  return <div>{(["name", "email", "password"] as const).map(f => <div key={f}><input type={f === "password" ? "password" : "text"} placeholder={f} value={form[f]} onChange={e => { d(slice24.actions.setField({ field: f, value: e.target.value })); d(slice24.actions.clearError(f)); }} />{form.errors[f] && <span style={{ color: "red" }}> {form.errors[f]}</span>}</div>)}<button onClick={handleSubmit}>Submit</button></div>;
}

// 25. Accordion state reducer
const slice25 = createSlice({ name: "ex25", initialState: { openId: null as number | null, items: [{ id: 1, title: "Section 1", body: "Content for section one." }, { id: 2, title: "Section 2", body: "Content for section two." }, { id: 3, title: "Section 3", body: "Content for section three." }] }, reducers: { toggle: (s, a: PayloadAction<number>) => { s.openId = s.openId === a.payload ? null : a.payload; }, closeAll: (s) => { s.openId = null; } } });
const store25 = configureStore({ reducer: slice25.reducer });
function Ex25_Name() { return <Provider store={store25}><Ex25_Inner /></Provider>; }
function Ex25_Inner() {
  const { openId, items } = useSelector((s: ReturnType<typeof store25.getState>) => s);
  const d = useDispatch();
  return <div>{items.map(item => <div key={item.id} style={{ border: "1px solid #ccc", marginBottom: 4 }}><div style={{ padding: 8, cursor: "pointer", background: "#f0f0f0" }} onClick={() => d(slice25.actions.toggle(item.id))}>{item.title} {openId === item.id ? "▲" : "▼"}</div>{openId === item.id && <div style={{ padding: 8 }}>{item.body}</div>}</div>)}<button onClick={() => d(slice25.actions.closeAll())}>Close All</button></div>;
}

// ─── NESTED 26–37 ───────────────────────────────────────────────────────────────

// 26. Nested object reducer (user + address + preferences)
interface NestedUser26 { personal: { name: string; age: number }; address: { city: string; country: string }; preferences: { theme: string; newsletter: boolean }; }
const slice26 = createSlice({ name: "ex26", initialState: { personal: { name: "Alice", age: 28 }, address: { city: "NYC", country: "US" }, preferences: { theme: "light", newsletter: true } } as NestedUser26, reducers: { updatePersonal: (s, a: PayloadAction<Partial<NestedUser26["personal"]>>) => { Object.assign(s.personal, a.payload); }, updateAddress: (s, a: PayloadAction<Partial<NestedUser26["address"]>>) => { Object.assign(s.address, a.payload); }, updatePreferences: (s, a: PayloadAction<Partial<NestedUser26["preferences"]>>) => { Object.assign(s.preferences, a.payload); } } });
const store26 = configureStore({ reducer: slice26.reducer });
function Ex26_Name() { return <Provider store={store26}><Ex26_Inner /></Provider>; }
function Ex26_Inner() {
  const u = useSelector((s: ReturnType<typeof store26.getState>) => s);
  const d = useDispatch();
  return <div><p>{u.personal.name}, {u.personal.age} | {u.address.city}, {u.address.country} | {u.preferences.theme}</p><button onClick={() => d(slice26.actions.updatePersonal({ age: u.personal.age + 1 }))}>Birthday</button><button onClick={() => d(slice26.actions.updateAddress({ city: "London", country: "UK" }))}>Move to London</button><button onClick={() => d(slice26.actions.updatePreferences({ theme: u.preferences.theme === "light" ? "dark" : "light" }))}>Toggle Theme</button></div>;
}

// 27. Array of objects reducer (todos with subtasks)
interface SubTask27 { id: number; text: string; done: boolean; }
interface TodoWithSubs27 { id: number; text: string; done: boolean; subtasks: SubTask27[]; }
const slice27 = createSlice({ name: "ex27", initialState: { todos: [{ id: 1, text: "Parent Task", done: false, subtasks: [{ id: 1, text: "Sub 1", done: false }] }] as TodoWithSubs27[], nextId: 2 }, reducers: { addTodo: (s, a: PayloadAction<string>) => { s.todos.push({ id: s.nextId++, text: a.payload, done: false, subtasks: [] }); }, addSubtask: (s, a: PayloadAction<{ parentId: number; text: string }>) => { const t = s.todos.find(t => t.id === a.payload.parentId); if (t) t.subtasks.push({ id: s.nextId++, text: a.payload.text, done: false }); }, toggleSubtask: (s, a: PayloadAction<{ parentId: number; subId: number }>) => { const t = s.todos.find(t => t.id === a.payload.parentId); const sub = t?.subtasks.find(s => s.id === a.payload.subId); if (sub) sub.done = !sub.done; } } });
const store27 = configureStore({ reducer: slice27.reducer });
function Ex27_Name() { return <Provider store={store27}><Ex27_Inner /></Provider>; }
function Ex27_Inner() {
  const { todos } = useSelector((s: ReturnType<typeof store27.getState>) => s);
  const d = useDispatch();
  const [v, setV] = useState("");
  return <div><ul>{todos.map(t => <li key={t.id}><strong>{t.text}</strong><ul>{t.subtasks.map(s => <li key={s.id} style={{ textDecoration: s.done ? "line-through" : "none", cursor: "pointer" }} onClick={() => d(slice27.actions.toggleSubtask({ parentId: t.id, subId: s.id }))}>{s.text}</li>)}</ul><button onClick={() => d(slice27.actions.addSubtask({ parentId: t.id, text: "New Sub" }))}>+ Sub</button></li>)}</ul><input value={v} onChange={e => setV(e.target.value)} /><button onClick={() => { if (v) { d(slice27.actions.addTodo(v)); setV(""); } }}>Add Todo</button></div>;
}

// 28. Normalized state reducer (byId + allIds)
interface Entity28 { id: string; name: string; value: number; }
interface NormState28 { byId: Record<string, Entity28>; allIds: string[]; }
const slice28 = createSlice({ name: "ex28", initialState: { byId: { "1": { id: "1", name: "Alpha", value: 10 } }, allIds: ["1"] } as NormState28, reducers: { addEntity: (s, a: PayloadAction<Entity28>) => { s.byId[a.payload.id] = a.payload; s.allIds.push(a.payload.id); }, updateEntity: (s, a: PayloadAction<Partial<Entity28> & { id: string }>) => { if (s.byId[a.payload.id]) Object.assign(s.byId[a.payload.id], a.payload); }, removeEntity: (s, a: PayloadAction<string>) => { delete s.byId[a.payload]; s.allIds = s.allIds.filter(id => id !== a.payload); } } });
const store28 = configureStore({ reducer: slice28.reducer });
function Ex28_Name() { return <Provider store={store28}><Ex28_Inner /></Provider>; }
function Ex28_Inner() {
  const { byId, allIds } = useSelector((s: ReturnType<typeof store28.getState>) => s);
  const d = useDispatch();
  const [nextId, setNextId] = useState(2);
  return <div><ul>{allIds.map(id => <li key={id}>{byId[id].name}: {byId[id].value} <button onClick={() => d(slice28.actions.updateEntity({ id, value: byId[id].value + 1 }))}>+1</button><button onClick={() => d(slice28.actions.removeEntity(id))}>x</button></li>)}</ul><button onClick={() => { d(slice28.actions.addEntity({ id: String(nextId), name: `Entity${nextId}`, value: nextId * 5 })); setNextId(n => n + 1); }}>Add Entity</button></div>;
}

// 29. Kanban board reducer
interface KanbanCard29 { id: number; text: string; }
interface KanbanState29 { columns: Record<string, KanbanCard29[]>; order: string[]; nextId: number; }
const slice29 = createSlice({ name: "ex29", initialState: { columns: { todo: [{ id: 1, text: "Task A" }], inProgress: [], done: [] }, order: ["todo", "inProgress", "done"], nextId: 2 } as KanbanState29, reducers: { addCard: (s, a: PayloadAction<{ col: string; text: string }>) => { s.columns[a.payload.col].push({ id: s.nextId++, text: a.payload.text }); }, moveCard: (s, a: PayloadAction<{ cardId: number; fromCol: string; toCol: string }>) => { const from = s.columns[a.payload.fromCol]; const idx = from.findIndex(c => c.id === a.payload.cardId); if (idx >= 0) { const [card] = from.splice(idx, 1); s.columns[a.payload.toCol].push(card); } } } });
const store29 = configureStore({ reducer: slice29.reducer });
function Ex29_Name() { return <Provider store={store29}><Ex29_Inner /></Provider>; }
function Ex29_Inner() {
  const { columns, order } = useSelector((s: ReturnType<typeof store29.getState>) => s);
  const d = useDispatch();
  const cols = order as string[];
  const nextCols: Record<string, string> = { todo: "inProgress", inProgress: "done" };
  return <div style={{ display: "flex", gap: 8 }}>{cols.map(col => <div key={col} style={{ flex: 1, border: "1px solid #ccc", padding: 4 }}><strong>{col}</strong>{columns[col].map(c => <div key={c.id} style={{ background: "#f9f9f9", margin: 2, padding: 4 }}>{c.text}{nextCols[col] && <button onClick={() => d(slice29.actions.moveCard({ cardId: c.id, fromCol: col, toCol: nextCols[col] }))}>→</button>}</div>)}<button onClick={() => d(slice29.actions.addCard({ col, text: `Card ${Date.now() % 1000}` }))}>+</button></div>)}</div>;
}

// 30. Tree structure reducer
interface TreeNode30 { id: number; label: string; children: number[]; expanded: boolean; }
const slice30 = createSlice({ name: "ex30", initialState: { nodes: { 1: { id: 1, label: "Root", children: [2, 3], expanded: true }, 2: { id: 2, label: "Child A", children: [4], expanded: false }, 3: { id: 3, label: "Child B", children: [], expanded: false }, 4: { id: 4, label: "Grandchild", children: [], expanded: false } } as Record<number, TreeNode30>, rootId: 1 }, reducers: { toggle: (s, a: PayloadAction<number>) => { s.nodes[a.payload].expanded = !s.nodes[a.payload].expanded; } } });
const store30 = configureStore({ reducer: slice30.reducer });
function Ex30_Name() { return <Provider store={store30}><Ex30_Inner /></Provider>; }
function Ex30_Inner() {
  const { nodes, rootId } = useSelector((s: ReturnType<typeof store30.getState>) => s);
  const d = useDispatch();
  const renderNode = (id: number, depth = 0): React.ReactNode => {
    const node = nodes[id];
    return <div key={id} style={{ marginLeft: depth * 16 }}><span style={{ cursor: "pointer" }} onClick={() => d(slice30.actions.toggle(id))}>{node.children.length > 0 ? (node.expanded ? "▼" : "▶") : "•"} {node.label}</span>{node.expanded && node.children.map(cid => renderNode(cid, depth + 1))}</div>;
  };
  return <div>{renderNode(rootId)}</div>;
}

// 31. Multi-step form reducer
interface WizardState31 { step: number; data: { name: string; email: string; plan: string; confirmed: boolean }; }
const slice31 = createSlice({ name: "ex31", initialState: { step: 1, data: { name: "", email: "", plan: "free", confirmed: false } } as WizardState31, reducers: { next: (s) => { if (s.step < 4) s.step++; }, prev: (s) => { if (s.step > 1) s.step--; }, setData: (s, a: PayloadAction<Partial<WizardState31["data"]>>) => { Object.assign(s.data, a.payload); }, reset: () => ({ step: 1, data: { name: "", email: "", plan: "free", confirmed: false } }) } });
const store31 = configureStore({ reducer: slice31.reducer });
function Ex31_Name() { return <Provider store={store31}><Ex31_Inner /></Provider>; }
function Ex31_Inner() {
  const { step, data } = useSelector((s: ReturnType<typeof store31.getState>) => s);
  const d = useDispatch();
  return <div><p>Step {step}/4</p>{step === 1 && <div><input placeholder="Name" value={data.name} onChange={e => d(slice31.actions.setData({ name: e.target.value }))} /></div>}{step === 2 && <div><input placeholder="Email" value={data.email} onChange={e => d(slice31.actions.setData({ email: e.target.value }))} /></div>}{step === 3 && <div><select value={data.plan} onChange={e => d(slice31.actions.setData({ plan: e.target.value }))}><option value="free">Free</option><option value="pro">Pro</option></select></div>}{step === 4 && <div><p>Confirm: {data.name}, {data.email}, {data.plan}</p></div>}<button onClick={() => d(slice31.actions.prev())} disabled={step === 1}>Back</button><button onClick={() => d(slice31.actions.next())} disabled={step === 4}>Next</button><button onClick={() => d(slice31.actions.reset())}>Reset</button></div>;
}

// 32. Shopping cart with discount codes
interface CartState32 { items: { id: number; name: string; price: number; qty: number }[]; discountCode: string; discountPct: number; }
const slice32 = createSlice({ name: "ex32", initialState: { items: [{ id: 1, name: "Widget", price: 20, qty: 1 }], discountCode: "", discountPct: 0 } as CartState32, reducers: { addItem: (s, a: PayloadAction<{ id: number; name: string; price: number }>) => { const ex = s.items.find(i => i.id === a.payload.id); if (ex) ex.qty++; else s.items.push({ ...a.payload, qty: 1 }); }, applyDiscount: (s, a: PayloadAction<string>) => { const codes: Record<string, number> = { SAVE10: 10, HALF: 50, VIP: 25 }; s.discountCode = a.payload; s.discountPct = codes[a.payload] ?? 0; }, removeDiscount: (s) => { s.discountCode = ""; s.discountPct = 0; } } });
const store32 = configureStore({ reducer: slice32.reducer });
function Ex32_Name() { return <Provider store={store32}><Ex32_Inner /></Provider>; }
function Ex32_Inner() {
  const { items, discountCode, discountPct } = useSelector((s: ReturnType<typeof store32.getState>) => s);
  const d = useDispatch();
  const [code, setCode] = useState("");
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const total = subtotal * (1 - discountPct / 100);
  return <div><ul>{items.map(i => <li key={i.id}>{i.name} ×{i.qty} = ${(i.price * i.qty).toFixed(2)} <button onClick={() => d(slice32.actions.addItem(i))}>+1</button></li>)}</ul><p>Subtotal: ${subtotal.toFixed(2)}</p>{discountPct > 0 ? <p>Discount ({discountCode}): -{discountPct}% → <strong>${total.toFixed(2)}</strong> <button onClick={() => d(slice32.actions.removeDiscount())}>Remove</button></p> : <div><input value={code} onChange={e => setCode(e.target.value)} placeholder="SAVE10 / HALF / VIP" /><button onClick={() => { d(slice32.actions.applyDiscount(code)); setCode(""); }}>Apply</button></div>}</div>;
}

// 33. Media player state reducer
interface MediaState33 { track: string; playing: boolean; volume: number; progress: number; shuffle: boolean; }
const slice33 = createSlice({ name: "ex33", initialState: { track: "Song A", playing: false, volume: 70, progress: 0, shuffle: false } as MediaState33, reducers: { play: (s) => { s.playing = true; }, pause: (s) => { s.playing = false; }, setVolume: (s, a: PayloadAction<number>) => { s.volume = a.payload; }, seek: (s, a: PayloadAction<number>) => { s.progress = a.payload; }, toggleShuffle: (s) => { s.shuffle = !s.shuffle; }, nextTrack: (s) => { s.track = s.track === "Song A" ? "Song B" : s.track === "Song B" ? "Song C" : "Song A"; s.progress = 0; } } });
const store33 = configureStore({ reducer: slice33.reducer });
function Ex33_Name() { return <Provider store={store33}><Ex33_Inner /></Provider>; }
function Ex33_Inner() {
  const m = useSelector((s: ReturnType<typeof store33.getState>) => s);
  const d = useDispatch();
  return <div style={{ border: "1px solid #ccc", padding: 8, borderRadius: 4 }}><p>♪ {m.track} {m.shuffle ? "🔀" : ""}</p><div><button onClick={() => d(m.playing ? slice33.actions.pause() : slice33.actions.play())}>{m.playing ? "⏸" : "▶"}</button><button onClick={() => d(slice33.actions.nextTrack())}>⏭</button><button onClick={() => d(slice33.actions.toggleShuffle())}>Shuffle</button></div><div>Vol: <input type="range" min={0} max={100} value={m.volume} onChange={e => d(slice33.actions.setVolume(Number(e.target.value)))} /></div><div>Pos: <input type="range" min={0} max={100} value={m.progress} onChange={e => d(slice33.actions.seek(Number(e.target.value)))} /></div></div>;
}

// 34. Survey/quiz reducer
interface QuizState34 { questions: { id: number; text: string; options: string[]; correct: number }[]; answers: Record<number, number>; submitted: boolean; }
const slice34 = createSlice({ name: "ex34", initialState: { questions: [{ id: 0, text: "2 + 2?", options: ["3", "4", "5", "6"], correct: 1 }, { id: 1, text: "Capital of France?", options: ["London", "Berlin", "Paris", "Rome"], correct: 2 }], answers: {} as Record<number, number>, submitted: false }, reducers: { answer: (s, a: PayloadAction<{ qId: number; optIdx: number }>) => { s.answers[a.payload.qId] = a.payload.optIdx; }, submit: (s) => { s.submitted = true; }, reset: (s) => { s.answers = {}; s.submitted = false; } } });
const store34 = configureStore({ reducer: slice34.reducer });
function Ex34_Name() { return <Provider store={store34}><Ex34_Inner /></Provider>; }
function Ex34_Inner() {
  const { questions, answers, submitted } = useSelector((s: ReturnType<typeof store34.getState>) => s);
  const d = useDispatch();
  const score = submitted ? questions.filter(q => answers[q.id] === q.correct).length : 0;
  return <div>{questions.map(q => <div key={q.id} style={{ marginBottom: 8 }}><p>{q.text}</p>{q.options.map((o, i) => <label key={i} style={{ display: "block", background: submitted ? (i === q.correct ? "#c8e6c9" : answers[q.id] === i ? "#ffcdd2" : "transparent") : "transparent" }}><input type="radio" name={`q${q.id}`} checked={answers[q.id] === i} onChange={() => !submitted && d(slice34.actions.answer({ qId: q.id, optIdx: i }))} /> {o}</label>)}</div>)}{submitted ? <p>Score: {score}/{questions.length} <button onClick={() => d(slice34.actions.reset())}>Retry</button></p> : <button onClick={() => d(slice34.actions.submit())} disabled={Object.keys(answers).length < questions.length}>Submit</button>}</div>;
}

// 35. Playlist reducer
interface Track35 { id: number; title: string; artist: string; duration: number; }
const slice35 = createSlice({ name: "ex35", initialState: { tracks: [{ id: 1, title: "Bohemian Rhapsody", artist: "Queen", duration: 354 }, { id: 2, title: "Hotel California", artist: "Eagles", duration: 391 }] as Track35[], currentIdx: 0, nextId: 3 }, reducers: { addTrack: (s, a: PayloadAction<Omit<Track35, "id">>) => { s.tracks.push({ ...a.payload, id: s.nextId++ }); }, removeTrack: (s, a: PayloadAction<number>) => { const idx = s.tracks.findIndex(t => t.id === a.payload); if (idx >= 0) { s.tracks.splice(idx, 1); if (s.currentIdx >= s.tracks.length) s.currentIdx = 0; } }, selectTrack: (s, a: PayloadAction<number>) => { s.currentIdx = a.payload; }, moveUp: (s, a: PayloadAction<number>) => { if (a.payload > 0) { [s.tracks[a.payload], s.tracks[a.payload - 1]] = [s.tracks[a.payload - 1], s.tracks[a.payload]]; } } } });
const store35 = configureStore({ reducer: slice35.reducer });
function Ex35_Name() { return <Provider store={store35}><Ex35_Inner /></Provider>; }
function Ex35_Inner() {
  const { tracks, currentIdx } = useSelector((s: ReturnType<typeof store35.getState>) => s);
  const d = useDispatch();
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  return <div><p>Now: {tracks[currentIdx]?.title}</p><ol>{tracks.map((t, i) => <li key={t.id} style={{ fontWeight: i === currentIdx ? "bold" : "normal", cursor: "pointer" }} onClick={() => d(slice35.actions.selectTrack(i))}>{t.title} — {t.artist} ({fmt(t.duration)}) {i > 0 && <button onClick={e => { e.stopPropagation(); d(slice35.actions.moveUp(i)); }}>↑</button>}<button onClick={e => { e.stopPropagation(); d(slice35.actions.removeTrack(t.id)); }}>x</button></li>)}</ol></div>;
}

// 36. Config/settings panel reducer
interface ConfigState36 { general: { siteName: string; timezone: string }; display: { darkMode: boolean; compactView: boolean; itemsPerPage: number }; security: { twoFactor: boolean; sessionTimeout: number }; }
const slice36 = createSlice({ name: "ex36", initialState: { general: { siteName: "MyApp", timezone: "UTC" }, display: { darkMode: false, compactView: false, itemsPerPage: 10 }, security: { twoFactor: false, sessionTimeout: 30 } } as ConfigState36, reducers: { updateGeneral: (s, a: PayloadAction<Partial<ConfigState36["general"]>>) => { Object.assign(s.general, a.payload); }, updateDisplay: (s, a: PayloadAction<Partial<ConfigState36["display"]>>) => { Object.assign(s.display, a.payload); }, updateSecurity: (s, a: PayloadAction<Partial<ConfigState36["security"]>>) => { Object.assign(s.security, a.payload); } } });
const store36 = configureStore({ reducer: slice36.reducer });
function Ex36_Name() { return <Provider store={store36}><Ex36_Inner /></Provider>; }
function Ex36_Inner() {
  const cfg = useSelector((s: ReturnType<typeof store36.getState>) => s);
  const d = useDispatch();
  return <div><p><strong>General:</strong> {cfg.general.siteName} | {cfg.general.timezone}</p><p><strong>Display:</strong> Dark:{cfg.display.darkMode ? "on" : "off"} Compact:{cfg.display.compactView ? "on" : "off"} Items:{cfg.display.itemsPerPage}</p><p><strong>Security:</strong> 2FA:{cfg.security.twoFactor ? "on" : "off"} Timeout:{cfg.security.sessionTimeout}min</p><button onClick={() => d(slice36.actions.updateDisplay({ darkMode: !cfg.display.darkMode }))}>Toggle Dark</button><button onClick={() => d(slice36.actions.updateSecurity({ twoFactor: !cfg.security.twoFactor }))}>Toggle 2FA</button><button onClick={() => d(slice36.actions.updateDisplay({ itemsPerPage: cfg.display.itemsPerPage + 5 }))}>More Items</button></div>;
}

// 37. Invoice line items reducer
interface LineItem37 { id: number; description: string; qty: number; unitPrice: number; }
const slice37 = createSlice({ name: "ex37", initialState: { items: [{ id: 1, description: "Widget", qty: 2, unitPrice: 15 }] as LineItem37[], nextId: 2, taxRate: 0.1 }, reducers: { addLine: (s) => { s.items.push({ id: s.nextId++, description: "New Item", qty: 1, unitPrice: 0 }); }, updateLine: (s, a: PayloadAction<Partial<LineItem37> & { id: number }>) => { const i = s.items.find(i => i.id === a.payload.id); if (i) Object.assign(i, a.payload); }, removeLine: (s, a: PayloadAction<number>) => { s.items = s.items.filter(i => i.id !== a.payload); }, setTaxRate: (s, a: PayloadAction<number>) => { s.taxRate = a.payload; } } });
const store37 = configureStore({ reducer: slice37.reducer });
function Ex37_Name() { return <Provider store={store37}><Ex37_Inner /></Provider>; }
function Ex37_Inner() {
  const { items, taxRate } = useSelector((s: ReturnType<typeof store37.getState>) => s);
  const d = useDispatch();
  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  return <div><table><tbody>{items.map(i => <tr key={i.id}><td><input value={i.description} onChange={e => d(slice37.actions.updateLine({ id: i.id, description: e.target.value }))} style={{ width: 120 }} /></td><td><input type="number" value={i.qty} onChange={e => d(slice37.actions.updateLine({ id: i.id, qty: Number(e.target.value) }))} style={{ width: 50 }} /></td><td><input type="number" value={i.unitPrice} onChange={e => d(slice37.actions.updateLine({ id: i.id, unitPrice: Number(e.target.value) }))} style={{ width: 70 }} /></td><td>${(i.qty * i.unitPrice).toFixed(2)}</td><td><button onClick={() => d(slice37.actions.removeLine(i.id))}>x</button></td></tr>)}</tbody></table><button onClick={() => d(slice37.actions.addLine())}>+ Line</button><p>Subtotal: ${subtotal.toFixed(2)} | Tax ({(taxRate * 100).toFixed(0)}%): ${(subtotal * taxRate).toFixed(2)} | Total: ${(subtotal * (1 + taxRate)).toFixed(2)}</p></div>;
}

// ─── ADVANCED 38–50 ─────────────────────────────────────────────────────────────

// 38. Immer-style nested update (RTK uses Immer)
interface DeepState38 { users: { alice: { scores: number[]; metadata: { lastLogin: string } }; bob: { scores: number[]; metadata: { lastLogin: string } } }; }
const slice38 = createSlice({ name: "ex38", initialState: { users: { alice: { scores: [90, 85, 92], metadata: { lastLogin: "2024-01-01" } }, bob: { scores: [70, 75], metadata: { lastLogin: "2024-01-02" } } } } as DeepState38, reducers: { addScore: (s, a: PayloadAction<{ user: "alice" | "bob"; score: number }>) => { s.users[a.payload.user].scores.push(a.payload.score); s.users[a.payload.user].metadata.lastLogin = new Date().toISOString().slice(0, 10); } } });
const store38 = configureStore({ reducer: slice38.reducer });
function Ex38_Name() { return <Provider store={store38}><Ex38_Inner /></Provider>; }
function Ex38_Inner() {
  const { users } = useSelector((s: ReturnType<typeof store38.getState>) => s);
  const d = useDispatch();
  return <div>{(["alice", "bob"] as const).map(u => <div key={u}><strong>{u}</strong>: [{users[u].scores.join(", ")}] last:{users[u].metadata.lastLogin}<button onClick={() => d(slice38.actions.addScore({ user: u, score: Math.floor(Math.random() * 30) + 70 }))}>+Score</button></div>)}</div>;
}

// 39. Combining multiple reducers (combineReducers via RTK)
const counterSlice39 = createSlice({ name: "ex39_counter", initialState: 0, reducers: { inc: (s) => s + 1 } });
const msgSlice39 = createSlice({ name: "ex39_msg", initialState: "hello", reducers: { set: (_s, a: PayloadAction<string>) => a.payload } });
const rootReducer39 = combineReducers({ counter: counterSlice39.reducer, message: msgSlice39.reducer });
const store39 = configureStore({ reducer: rootReducer39 });
type RS39 = ReturnType<typeof store39.getState>;
function Ex39_Name() { return <Provider store={store39}><Ex39_Inner /></Provider>; }
function Ex39_Inner() {
  const counter = useSelector((s: RS39) => s.counter);
  const message = useSelector((s: RS39) => s.message);
  const d = useDispatch();
  const [v, setV] = useState("");
  return <div><p>Counter: {counter}</p><button onClick={() => d(counterSlice39.actions.inc())}>Inc</button><p>Message: {message}</p><input value={v} onChange={e => setV(e.target.value)} /><button onClick={() => { d(msgSlice39.actions.set(v)); setV(""); }}>Set</button></div>;
}

// 40. Reducer composition pattern
const baseCounterReducer40 = createReducer(0, builder => builder.addCase(createAction<number>("ex40/add"), (s, a) => s + a.payload).addCase(createAction("ex40/reset"), () => 0));
const add40 = createAction<number>("ex40/add");
const reset40 = createAction("ex40/reset");
const store40 = configureStore({ reducer: baseCounterReducer40 });
function Ex40_Name() { return <Provider store={store40}><Ex40_Inner /></Provider>; }
function Ex40_Inner() {
  const n = useSelector((s: ReturnType<typeof store40.getState>) => s);
  const d = useDispatch();
  return <div><p>Value: {n}</p>{[1, 5, 10].map(v => <button key={v} onClick={() => d(add40(v))}>+{v}</button>)}<button onClick={() => d(reset40())}>Reset</button></div>;
}

// 41. Undo/redo reducer
interface UndoState41 { past: number[][]; present: number[]; future: number[][]; }
const slice41 = createSlice({ name: "ex41", initialState: { past: [], present: [1, 2, 3], future: [] } as UndoState41, reducers: { addItem: (s, a: PayloadAction<number>) => { s.past.push([...s.present]); s.present.push(a.payload); s.future = []; }, undo: (s) => { if (s.past.length > 0) { s.future.unshift([...s.present]); s.present = s.past.pop()!; } }, redo: (s) => { if (s.future.length > 0) { s.past.push([...s.present]); s.present = s.future.shift()!; } } } });
const store41 = configureStore({ reducer: slice41.reducer });
function Ex41_Name() { return <Provider store={store41}><Ex41_Inner /></Provider>; }
function Ex41_Inner() {
  const { past, present, future } = useSelector((s: ReturnType<typeof store41.getState>) => s);
  const d = useDispatch();
  return <div><p>Present: [{present.join(", ")}]</p><p>Past steps: {past.length} | Future steps: {future.length}</p><button onClick={() => d(slice41.actions.addItem(Math.floor(Math.random() * 100)))}>Add Random</button><button onClick={() => d(slice41.actions.undo())} disabled={past.length === 0}>Undo</button><button onClick={() => d(slice41.actions.redo())} disabled={future.length === 0}>Redo</button></div>;
}

// 42. Normalized entities reducer
const adapter42 = createEntityAdapter<{ id: number; name: string; score: number }>();
const slice42 = createSlice({ name: "ex42", initialState: adapter42.getInitialState(), reducers: { addOne: adapter42.addOne, removeOne: adapter42.removeOne, updateOne: adapter42.updateOne, addMany: adapter42.addMany } });
const store42 = configureStore({ reducer: slice42.reducer });
type RS42 = ReturnType<typeof store42.getState>;
const selectors42 = adapter42.getSelectors((s: RS42) => s);
function Ex42_Name() { return <Provider store={store42}><Ex42_Inner /></Provider>; }
function Ex42_Inner() {
  const all = useSelector(selectors42.selectAll);
  const d = useDispatch();
  const [nextId, setNextId] = useState(1);
  return <div><ul>{all.map(e => <li key={e.id}>{e.name}: {e.score} <button onClick={() => d(slice42.actions.updateOne({ id: e.id, changes: { score: e.score + 10 } }))}>+10</button><button onClick={() => d(slice42.actions.removeOne(e.id))}>x</button></li>)}</ul><button onClick={() => { d(slice42.actions.addOne({ id: nextId, name: `Player${nextId}`, score: 0 })); setNextId(n => n + 1); }}>Add Player</button></div>;
}

// 43. Middleware logger pattern
const loggerMiddleware43 = (store: { getState: () => unknown }) => (next: (a: unknown) => unknown) => (action: unknown) => {
  const prev = store.getState();
  const result = next(action);
  const next_ = store.getState();
  console.log("[Logger]", { action, prev, next: next_ });
  return result;
};
const slice43 = createSlice({ name: "ex43", initialState: { count: 0, log: [] as string[] }, reducers: { inc: (s) => { s.count++; s.log.push(`Incremented to ${s.count + 1}`); }, dec: (s) => { s.count--; s.log.push(`Decremented to ${s.count - 1}`); } } });
const store43 = configureStore({ reducer: slice43.reducer, middleware: (gDM) => gDM().concat(loggerMiddleware43 as Parameters<typeof gDM>[0] extends undefined ? never : never) });
function Ex43_Name() { return <Provider store={store43}><Ex43_Inner /></Provider>; }
function Ex43_Inner() {
  const { count, log } = useSelector((s: ReturnType<typeof store43.getState>) => s);
  const d = useDispatch();
  return <div><p>Count: {count}</p><button onClick={() => d(slice43.actions.inc())}>+</button><button onClick={() => d(slice43.actions.dec())}>-</button><p style={{ fontSize: 11 }}>Check console for logs</p></div>;
}

// 44. Selector pattern with store
const slice44 = createSlice({ name: "ex44", initialState: { products: [{ id: 1, name: "A", price: 10, cat: "tools" }, { id: 2, name: "B", price: 25, cat: "tools" }, { id: 3, name: "C", price: 5, cat: "food" }], filter: "all", minPrice: 0 }, reducers: { setFilter: (s, a: PayloadAction<string>) => { s.filter = a.payload; }, setMinPrice: (s, a: PayloadAction<number>) => { s.minPrice = a.payload; } } });
const store44 = configureStore({ reducer: slice44.reducer });
type RS44 = ReturnType<typeof store44.getState>;
const selectFiltered44 = (s: RS44) => s.products.filter(p => (s.filter === "all" || p.cat === s.filter) && p.price >= s.minPrice);
function Ex44_Name() { return <Provider store={store44}><Ex44_Inner /></Provider>; }
function Ex44_Inner() {
  const filtered = useSelector(selectFiltered44);
  const { filter, minPrice } = useSelector((s: RS44) => ({ filter: s.filter, minPrice: s.minPrice }));
  const d = useDispatch();
  return <div><select value={filter} onChange={e => d(slice44.actions.setFilter(e.target.value))}><option value="all">All</option><option value="tools">Tools</option><option value="food">Food</option></select><label> Min $<input type="number" value={minPrice} onChange={e => d(slice44.actions.setMinPrice(Number(e.target.value)))} style={{ width: 50 }} /></label><ul>{filtered.map(p => <li key={p.id}>{p.name} ${p.price} [{p.cat}]</li>)}</ul></div>;
}

// 45. Optimistic update reducer
interface OptItem45 { id: number; text: string; status: "saved" | "saving" | "error"; }
const slice45 = createSlice({ name: "ex45", initialState: { items: [] as OptItem45[], nextId: 1 }, reducers: { optimisticAdd: (s, a: PayloadAction<string>) => { s.items.push({ id: s.nextId++, text: a.payload, status: "saving" }); }, confirmSave: (s, a: PayloadAction<number>) => { const i = s.items.find(i => i.id === a.payload); if (i) i.status = "saved"; }, failSave: (s, a: PayloadAction<number>) => { const i = s.items.find(i => i.id === a.payload); if (i) i.status = "error"; }, remove: (s, a: PayloadAction<number>) => { s.items = s.items.filter(i => i.id !== a.payload); } } });
const store45 = configureStore({ reducer: slice45.reducer });
function Ex45_Name() { return <Provider store={store45}><Ex45_Inner /></Provider>; }
function Ex45_Inner() {
  const { items } = useSelector((s: ReturnType<typeof store45.getState>) => s);
  const d = useDispatch();
  const [v, setV] = useState("");
  const handleAdd = () => {
    if (!v) return;
    d(slice45.actions.optimisticAdd(v));
    const id = store45.getState().items[store45.getState().items.length - 1].id;
    const succeed = Math.random() > 0.3;
    setTimeout(() => d(succeed ? slice45.actions.confirmSave(id) : slice45.actions.failSave(id)), 1000);
    setV("");
  };
  const statusColor: Record<string, string> = { saved: "#c8e6c9", saving: "#fff9c4", error: "#ffcdd2" };
  return <div><input value={v} onChange={e => setV(e.target.value)} /><button onClick={handleAdd}>Add (70% success)</button><ul>{items.map(i => <li key={i.id} style={{ background: statusColor[i.status], padding: 4, marginTop: 2 }}>{i.text} — {i.status}{i.status === "error" && <button onClick={() => d(slice45.actions.remove(i.id))}>Remove</button>}</li>)}</ul></div>;
}

// 46. Event sourcing reducer
interface Event46 { type: string; payload: unknown; timestamp: string; }
const slice46 = createSlice({ name: "ex46", initialState: { events: [] as Event46[], state: { balance: 1000 } }, reducers: { applyEvent: (s, a: PayloadAction<{ type: "deposit" | "withdraw"; amount: number }>) => { const evt: Event46 = { ...a.payload, timestamp: new Date().toISOString() }; s.events.push(evt); if (a.payload.type === "deposit") s.state.balance += a.payload.amount; else if (a.payload.type === "withdraw" && s.state.balance >= a.payload.amount) s.state.balance -= a.payload.amount; }, replayEvents: (s) => { const balance = s.events.reduce((b, e) => { const ev = e as { type: string; amount: number }; return ev.type === "deposit" ? b + ev.amount : b - ev.amount; }, 1000); s.state.balance = balance; } } });
const store46 = configureStore({ reducer: slice46.reducer });
function Ex46_Name() { return <Provider store={store46}><Ex46_Inner /></Provider>; }
function Ex46_Inner() {
  const { events, state } = useSelector((s: ReturnType<typeof store46.getState>) => s);
  const d = useDispatch();
  return <div><p>Balance: ${state.balance}</p><button onClick={() => d(slice46.actions.applyEvent({ type: "deposit", amount: 100 }))}>Deposit $100</button><button onClick={() => d(slice46.actions.applyEvent({ type: "withdraw", amount: 50 }))}>Withdraw $50</button><p>Events: {events.length}</p><ul style={{ maxHeight: 80, overflowY: "auto", fontSize: 11 }}>{events.map((e, i) => { const ev = e as { type: string; amount: number; timestamp: string }; return <li key={i}>{ev.type} ${ev.amount}</li>; })}</ul></div>;
}

// 47. Command pattern reducer
interface Command47 { id: number; name: string; execute: () => void; }
const slice47 = createSlice({ name: "ex47", initialState: { history: [] as string[], counter: 0 }, reducers: { executeCommand: (s, a: PayloadAction<string>) => { s.history.push(a.payload); if (a.payload === "increment") s.counter++; if (a.payload === "decrement") s.counter--; if (a.payload === "double") s.counter *= 2; if (a.payload === "reset") s.counter = 0; }, undoLast: (s) => { const last = s.history.pop(); if (last === "increment") s.counter--; if (last === "decrement") s.counter++; if (last === "double") s.counter = Math.round(s.counter / 2); } } });
const store47 = configureStore({ reducer: slice47.reducer });
const commands47: Command47[] = [{ id: 1, name: "increment", execute: () => {} }, { id: 2, name: "decrement", execute: () => {} }, { id: 3, name: "double", execute: () => {} }, { id: 4, name: "reset", execute: () => {} }];
function Ex47_Name() { return <Provider store={store47}><Ex47_Inner /></Provider>; }
function Ex47_Inner() {
  const { history, counter } = useSelector((s: ReturnType<typeof store47.getState>) => s);
  const d = useDispatch();
  return <div><p>Counter: {counter}</p><div>{commands47.map(c => <button key={c.id} onClick={() => d(slice47.actions.executeCommand(c.name))}>{c.name}</button>)}</div><button onClick={() => d(slice47.actions.undoLast())} disabled={history.length === 0}>Undo</button><p style={{ fontSize: 11 }}>History: [{history.slice(-5).join(", ")}]</p></div>;
}

// 48. State machine reducer
type TrafficLight48 = "red" | "yellow" | "green";
const transitions48: Record<TrafficLight48, TrafficLight48> = { red: "green", green: "yellow", yellow: "red" };
const slice48 = createSlice({ name: "ex48", initialState: { light: "red" as TrafficLight48, count: 0, auto: false }, reducers: { next: (s) => { s.light = transitions48[s.light]; s.count++; }, toggleAuto: (s) => { s.auto = !s.auto; } } });
const store48 = configureStore({ reducer: slice48.reducer });
const colors48: Record<TrafficLight48, string> = { red: "#f44336", yellow: "#ffeb3b", green: "#4caf50" };
function Ex48_Name() { return <Provider store={store48}><Ex48_Inner /></Provider>; }
function Ex48_Inner() {
  const { light, count } = useSelector((s: ReturnType<typeof store48.getState>) => s);
  const d = useDispatch();
  React.useEffect(() => {
    const interval = setInterval(() => d(slice48.actions.next()), 2000);
    return () => clearInterval(interval);
  }, [d]);
  return <div><div style={{ width: 60, height: 60, borderRadius: "50%", background: colors48[light], margin: "8px auto" }} /><p>{light.toUpperCase()} (changed {count} times)</p><button onClick={() => d(slice48.actions.next())}>Next</button></div>;
}

// 49. Entity adapter reducer
interface Product49 { id: number; name: string; price: number; inStock: boolean; }
const adapter49 = createEntityAdapter<Product49>();
const slice49 = createSlice({ name: "ex49", initialState: adapter49.getInitialState({ selectedId: null as number | null }), reducers: { addProduct: adapter49.addOne, updateProduct: adapter49.updateOne, removeProduct: adapter49.removeOne, setAll: adapter49.setAll, select: (s, a: PayloadAction<number>) => { s.selectedId = a.payload; }, toggleStock: (s, a: PayloadAction<number>) => { const p = s.entities[a.payload]; if (p) p.inStock = !p.inStock; } } });
const store49 = configureStore({ reducer: slice49.reducer });
type RS49 = ReturnType<typeof store49.getState>;
const sel49 = adapter49.getSelectors((s: RS49) => s);
function Ex49_Name() { return <Provider store={store49}><Ex49_Inner /></Provider>; }
function Ex49_Inner() {
  const all = useSelector(sel49.selectAll);
  const { selectedId } = useSelector((s: RS49) => ({ selectedId: s.selectedId }));
  const d = useDispatch();
  React.useEffect(() => { d(slice49.actions.setAll([{ id: 1, name: "Laptop", price: 999, inStock: true }, { id: 2, name: "Mouse", price: 29, inStock: true }, { id: 3, name: "Keyboard", price: 79, inStock: false }])); }, [d]);
  return <div><ul>{all.map(p => <li key={p.id} style={{ fontWeight: p.id === selectedId ? "bold" : "normal", cursor: "pointer" }} onClick={() => d(slice49.actions.select(p.id))}>{p.name} ${p.price} {p.inStock ? "✓" : "✗"}<button onClick={e => { e.stopPropagation(); d(slice49.actions.toggleStock(p.id)); }}>Toggle Stock</button></li>)}</ul>{selectedId && <p>Selected: {all.find(p => p.id === selectedId)?.name}</p>}</div>;
}

// 50. Full app store (auth + cart + ui slices combined)
const authSlice50 = createSlice({ name: "ex50_auth", initialState: { user: null as string | null }, reducers: { login: (s, a: PayloadAction<string>) => { s.user = a.payload; }, logout: (s) => { s.user = null; } } });
const cartSlice50 = createSlice({ name: "ex50_cart", initialState: { items: [] as { name: string; qty: number }[] }, reducers: { add: (s, a: PayloadAction<string>) => { const ex = s.items.find(i => i.name === a.payload); if (ex) ex.qty++; else s.items.push({ name: a.payload, qty: 1 }); }, clear: (s) => { s.items = []; } } });
const uiSlice50 = createSlice({ name: "ex50_ui", initialState: { modalOpen: false, sidebarOpen: true }, reducers: { toggleModal: (s) => { s.modalOpen = !s.modalOpen; }, toggleSidebar: (s) => { s.sidebarOpen = !s.sidebarOpen; } } });
const store50 = configureStore({ reducer: { auth: authSlice50.reducer, cart: cartSlice50.reducer, ui: uiSlice50.reducer } });
type RS50 = ReturnType<typeof store50.getState>;
function Ex50_Name() { return <Provider store={store50}><Ex50_Inner /></Provider>; }
function Ex50_Inner() {
  const { auth, cart, ui } = useSelector((s: RS50) => s);
  const d = useDispatch();
  const products = ["Apple", "Banana", "Cherry"];
  return <div style={{ fontFamily: "sans-serif" }}><div style={{ display: "flex", justifyContent: "space-between", background: "#333", color: "#fff", padding: 8 }}><span>MyApp {ui.sidebarOpen ? "[sidebar on]" : ""}</span><div>{auth.user ? <span>{auth.user} <button onClick={() => d(authSlice50.actions.logout())}>Logout</button></span> : <button onClick={() => d(authSlice50.actions.login("Alice"))}>Login</button>}<button onClick={() => d(uiSlice50.actions.toggleModal())}>Cart ({cart.items.length})</button><button onClick={() => d(uiSlice50.actions.toggleSidebar())}>☰</button></div></div>{auth.user && <div style={{ display: "flex" }}>{ui.sidebarOpen && <div style={{ width: 120, background: "#f0f0f0", padding: 8 }}>{products.map(p => <div key={p}><button onClick={() => d(cartSlice50.actions.add(p))}>{p}</button></div>)}</div>}<div style={{ flex: 1, padding: 8 }}><p>Welcome {auth.user}! Select products from the sidebar.</p></div></div>}{ui.modalOpen && <div style={{ position: "fixed", top: "20%", left: "30%", background: "#fff", border: "1px solid #ccc", padding: 16, zIndex: 999 }}><h3>Cart</h3><ul>{cart.items.map(i => <li key={i.name}>{i.name} ×{i.qty}</li>)}</ul><button onClick={() => d(cartSlice50.actions.clear())}>Clear</button><button onClick={() => d(uiSlice50.actions.toggleModal())}>Close</button></div>}</div>;
}

// ─── EXPORT ────────────────────────────────────────────────────────────────────

export default function StoreReducersExamples() {
  const sections = [
    { label: "BASIC", examples: [{ n: "01", C: Ex01_Name, title: "Simple Number Reducer" }, { n: "02", C: Ex02_Name, title: "Boolean Toggle" }, { n: "03", C: Ex03_Name, title: "String State" }, { n: "04", C: Ex04_Name, title: "Counter with Reset" }, { n: "05", C: Ex05_Name, title: "Multiple Action Types" }, { n: "06", C: Ex06_Name, title: "Initial State" }, { n: "07", C: Ex07_Name, title: "Array Add/Remove" }, { n: "08", C: Ex08_Name, title: "Status Reducer" }, { n: "09", C: Ex09_Name, title: "Returning New Object" }, { n: "10", C: Ex10_Name, title: "Pure Function Reducer" }, { n: "11", C: Ex11_Name, title: "Default Case" }, { n: "12", C: Ex12_Name, title: "Reducer with Payload" }] },
    { label: "INTERMEDIATE", examples: [{ n: "13", C: Ex13_Name, title: "User Profile" }, { n: "14", C: Ex14_Name, title: "Todo CRUD" }, { n: "15", C: Ex15_Name, title: "Counter with Step" }, { n: "16", C: Ex16_Name, title: "Settings (Nested)" }, { n: "17", C: Ex17_Name, title: "Auth Reducer" }, { n: "18", C: Ex18_Name, title: "Cart Reducer" }, { n: "19", C: Ex19_Name, title: "Notifications" }, { n: "20", C: Ex20_Name, title: "Pagination" }, { n: "21", C: Ex21_Name, title: "Filter/Sort" }, { n: "22", C: Ex22_Name, title: "Tab Navigation" }, { n: "23", C: Ex23_Name, title: "Leaderboard" }, { n: "24", C: Ex24_Name, title: "Form State" }, { n: "25", C: Ex25_Name, title: "Accordion" }] },
    { label: "NESTED", examples: [{ n: "26", C: Ex26_Name, title: "Nested User Object" }, { n: "27", C: Ex27_Name, title: "Todos with Subtasks" }, { n: "28", C: Ex28_Name, title: "Normalized State" }, { n: "29", C: Ex29_Name, title: "Kanban Board" }, { n: "30", C: Ex30_Name, title: "Tree Structure" }, { n: "31", C: Ex31_Name, title: "Multi-step Wizard" }, { n: "32", C: Ex32_Name, title: "Cart + Discounts" }, { n: "33", C: Ex33_Name, title: "Media Player" }, { n: "34", C: Ex34_Name, title: "Quiz/Survey" }, { n: "35", C: Ex35_Name, title: "Playlist" }, { n: "36", C: Ex36_Name, title: "Config Panel" }, { n: "37", C: Ex37_Name, title: "Invoice Line Items" }] },
    { label: "ADVANCED", examples: [{ n: "38", C: Ex38_Name, title: "Immer Nested Update" }, { n: "39", C: Ex39_Name, title: "combineReducers" }, { n: "40", C: Ex40_Name, title: "Reducer Composition" }, { n: "41", C: Ex41_Name, title: "Undo/Redo" }, { n: "42", C: Ex42_Name, title: "Normalized Entities" }, { n: "43", C: Ex43_Name, title: "Middleware Logger" }, { n: "44", C: Ex44_Name, title: "Selector Pattern" }, { n: "45", C: Ex45_Name, title: "Optimistic Update" }, { n: "46", C: Ex46_Name, title: "Event Sourcing" }, { n: "47", C: Ex47_Name, title: "Command Pattern" }, { n: "48", C: Ex48_Name, title: "State Machine" }, { n: "49", C: Ex49_Name, title: "Entity Adapter" }, { n: "50", C: Ex50_Name, title: "Full App Store" }] },
  ];
  return (
    <div style={{ fontFamily: "sans-serif", padding: 16 }}>
      <h1>Store &amp; Reducers — 50 Examples</h1>
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
