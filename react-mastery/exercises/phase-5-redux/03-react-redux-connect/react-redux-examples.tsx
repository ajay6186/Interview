import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  configureStore,
  createSlice,
  createEntityAdapter,
  PayloadAction,
} from "@reduxjs/toolkit";
import { Provider, useSelector, useDispatch, shallowEqual } from "react-redux";

// ─── BASIC 1–12 ────────────────────────────────────────────────────────────────

// 1. useSelector basic
const slice01 = createSlice({ name: "ex01", initialState: 42, reducers: { increment: s => s + 1 } });
const store01 = configureStore({ reducer: slice01.reducer });
function Ex01_Name() { return <Provider store={store01}><Ex01_Inner /></Provider>; }
function Ex01_Inner() {
  const value = useSelector((s: ReturnType<typeof store01.getState>) => s);
  const d = useDispatch();
  return <div><p>Value from store: <strong>{value}</strong></p><button onClick={() => d(slice01.actions.increment())}>Increment</button></div>;
}

// 2. useDispatch basic
const slice02 = createSlice({ name: "ex02", initialState: { text: "Click a button", color: "#333" }, reducers: { setRed: s => { s.text = "Red!"; s.color = "red"; }, setBlue: s => { s.text = "Blue!"; s.color = "blue"; }, setGreen: s => { s.text = "Green!"; s.color = "green"; } } });
const store02 = configureStore({ reducer: slice02.reducer });
function Ex02_Name() { return <Provider store={store02}><Ex02_Inner /></Provider>; }
function Ex02_Inner() {
  const { text, color } = useSelector((s: ReturnType<typeof store02.getState>) => s);
  const dispatch = useDispatch();
  return <div><p style={{ color }}>{text}</p><button onClick={() => dispatch(slice02.actions.setRed())}>Red</button><button onClick={() => dispatch(slice02.actions.setBlue())}>Blue</button><button onClick={() => dispatch(slice02.actions.setGreen())}>Green</button></div>;
}

// 3. Provider setup
const slice03 = createSlice({ name: "ex03", initialState: { count: 0, color: "black" }, reducers: { inc: s => { s.count++; s.color = s.count % 2 === 0 ? "black" : "purple"; } } });
const store03 = configureStore({ reducer: slice03.reducer });
function Ex03_Name() {
  return (
    <Provider store={store03}>
      <div style={{ border: "2px dashed #9c27b0", padding: 8 }}>
        <p style={{ fontSize: 11, color: "#9c27b0" }}>Provider boundary</p>
        <Ex03_Inner />
      </div>
    </Provider>
  );
}
function Ex03_Inner() {
  const { count, color } = useSelector((s: ReturnType<typeof store03.getState>) => s);
  const d = useDispatch();
  return <div><p style={{ color }}>Count: {count}</p><button onClick={() => d(slice03.actions.inc())}>Increment</button></div>;
}

// 4. Select primitive value
const slice04 = createSlice({ name: "ex04", initialState: { name: "Alice", age: 30, score: 95.5, active: true }, reducers: { birthday: s => { s.age++; }, toggleActive: s => { s.active = !s.active; }, addScore: (s, a: PayloadAction<number>) => { s.score += a.payload; } } });
const store04 = configureStore({ reducer: slice04.reducer });
type RS04 = ReturnType<typeof store04.getState>;
function Ex04_Name() { return <Provider store={store04}><Ex04_Inner /></Provider>; }
function Ex04_Inner() {
  const name = useSelector((s: RS04) => s.name);
  const age = useSelector((s: RS04) => s.age);
  const score = useSelector((s: RS04) => s.score);
  const active = useSelector((s: RS04) => s.active);
  const d = useDispatch();
  return <div><p>name: {name} | age: {age} | score: {score.toFixed(1)} | active: {String(active)}</p><button onClick={() => d(slice04.actions.birthday())}>Birthday</button><button onClick={() => d(slice04.actions.toggleActive())}>Toggle</button><button onClick={() => d(slice04.actions.addScore(5.5))}>+5.5 score</button></div>;
}

// 5. Select object from state
const slice05 = createSlice({ name: "ex05", initialState: { user: { id: 1, name: "Bob", email: "bob@example.com", role: "user" }, settings: { theme: "light", lang: "en" } }, reducers: { updateUser: (s, a: PayloadAction<Partial<typeof s.user>>) => { Object.assign(s.user, a.payload); }, updateSettings: (s, a: PayloadAction<Partial<typeof s.settings>>) => { Object.assign(s.settings, a.payload); } } });
const store05 = configureStore({ reducer: slice05.reducer });
type RS05 = ReturnType<typeof store05.getState>;
function Ex05_Name() { return <Provider store={store05}><Ex05_Inner /></Provider>; }
function Ex05_Inner() {
  const user = useSelector((s: RS05) => s.user);
  const settings = useSelector((s: RS05) => s.settings);
  const d = useDispatch();
  return <div><p>User: {user.name} ({user.role}) — {user.email}</p><p>Settings: {settings.theme} / {settings.lang}</p><button onClick={() => d(slice05.actions.updateUser({ role: "admin" }))}>Make Admin</button><button onClick={() => d(slice05.actions.updateSettings({ theme: settings.theme === "light" ? "dark" : "light" }))}>Toggle Theme</button></div>;
}

// 6. Select array from state
const slice06 = createSlice({ name: "ex06", initialState: { todos: ["Buy groceries", "Write code", "Go for a walk"], filter: "all" as "all" | "short" | "long" }, reducers: { add: (s, a: PayloadAction<string>) => { s.todos.push(a.payload); }, remove: (s, a: PayloadAction<number>) => { s.todos.splice(a.payload, 1); }, setFilter: (s, a: PayloadAction<"all" | "short" | "long">) => { s.filter = a.payload; } } });
const store06 = configureStore({ reducer: slice06.reducer });
type RS06 = ReturnType<typeof store06.getState>;
function Ex06_Name() { return <Provider store={store06}><Ex06_Inner /></Provider>; }
function Ex06_Inner() {
  const todos = useSelector((s: RS06) => s.todos);
  const filter = useSelector((s: RS06) => s.filter);
  const d = useDispatch();
  const [v, setV] = useState("");
  const visible = todos.filter(t => filter === "all" ? true : filter === "short" ? t.length <= 10 : t.length > 10);
  return <div><div>{(["all", "short", "long"] as const).map(f => <button key={f} onClick={() => d(slice06.actions.setFilter(f))} style={{ fontWeight: filter === f ? "bold" : "normal" }}>{f}</button>)}</div><ul>{visible.map((t, i) => <li key={i}>{t} <button onClick={() => d(slice06.actions.remove(todos.indexOf(t)))}>x</button></li>)}</ul><input value={v} onChange={e => setV(e.target.value)} /><button onClick={() => { if (v) { d(slice06.actions.add(v)); setV(""); } }}>Add</button></div>;
}

// 7. Derived/computed selector
const slice07 = createSlice({ name: "ex07", initialState: { prices: [12.5, 8.0, 45.0, 3.25, 99.99], taxRate: 0.1 }, reducers: { setTax: (s, a: PayloadAction<number>) => { s.taxRate = a.payload / 100; }, addPrice: (s, a: PayloadAction<number>) => { s.prices.push(a.payload); } } });
const store07 = configureStore({ reducer: slice07.reducer });
type RS07 = ReturnType<typeof store07.getState>;
function Ex07_Name() { return <Provider store={store07}><Ex07_Inner /></Provider>; }
function Ex07_Inner() {
  const prices = useSelector((s: RS07) => s.prices);
  const taxRate = useSelector((s: RS07) => s.taxRate);
  // Derived computations inside selector
  const summary = useSelector((s: RS07) => {
    const sum = s.prices.reduce((a, b) => a + b, 0);
    return { sum, tax: sum * s.taxRate, total: sum * (1 + s.taxRate), avg: sum / s.prices.length, max: Math.max(...s.prices), min: Math.min(...s.prices) };
  });
  const d = useDispatch();
  const [p, setP] = useState(10);
  return <div><p>Prices: [{prices.map(p => p.toFixed(2)).join(", ")}]</p><p>Sum: ${summary.sum.toFixed(2)} | Tax ({(taxRate * 100).toFixed(0)}%): ${summary.tax.toFixed(2)} | Total: ${summary.total.toFixed(2)}</p><p>Avg: ${summary.avg.toFixed(2)} | Min: ${summary.min} | Max: ${summary.max}</p><input type="number" value={p} onChange={e => setP(Number(e.target.value))} style={{ width: 60 }} /><button onClick={() => d(slice07.actions.addPrice(p))}>Add Price</button><button onClick={() => d(slice07.actions.setTax(15))}>Set 15% Tax</button></div>;
}

// 8. Dispatch action on button click
const slice08 = createSlice({ name: "ex08", initialState: { clicks: 0, doubleClicks: 0, rightClicks: 0 }, reducers: { click: s => { s.clicks++; }, dblClick: s => { s.doubleClicks++; }, rightClick: s => { s.rightClicks++; } } });
const store08 = configureStore({ reducer: slice08.reducer });
function Ex08_Name() { return <Provider store={store08}><Ex08_Inner /></Provider>; }
function Ex08_Inner() {
  const state = useSelector((s: ReturnType<typeof store08.getState>) => s);
  const d = useDispatch();
  return <div><button onClick={() => d(slice08.actions.click())} onDoubleClick={() => d(slice08.actions.dblClick())} onContextMenu={e => { e.preventDefault(); d(slice08.actions.rightClick()); }}>Click / Double-click / Right-click me</button><p>Clicks: {state.clicks} | Double: {state.doubleClicks} | Right: {state.rightClicks}</p></div>;
}

// 9. Dispatch action on input change
const slice09 = createSlice({ name: "ex09", initialState: { raw: "", slug: "", upper: "", reversed: "" }, reducers: { updateText: (s, a: PayloadAction<string>) => { s.raw = a.payload; s.slug = a.payload.toLowerCase().replace(/\s+/g, "-"); s.upper = a.payload.toUpperCase(); s.reversed = a.payload.split("").reverse().join(""); } } });
const store09 = configureStore({ reducer: slice09.reducer });
function Ex09_Name() { return <Provider store={store09}><Ex09_Inner /></Provider>; }
function Ex09_Inner() {
  const state = useSelector((s: ReturnType<typeof store09.getState>) => s);
  const d = useDispatch();
  return <div><input value={state.raw} onChange={e => d(slice09.actions.updateText(e.target.value))} placeholder="Type something..." style={{ width: 200 }} /><p>Slug: {state.slug}</p><p>Upper: {state.upper}</p><p>Reversed: {state.reversed}</p></div>;
}

// 10. Component reads + writes store
const slice10 = createSlice({ name: "ex10", initialState: { note: "", savedAt: null as string | null, saveCount: 0 }, reducers: { update: (s, a: PayloadAction<string>) => { s.note = a.payload; }, save: (s) => { s.savedAt = new Date().toLocaleTimeString(); s.saveCount++; } } });
const store10 = configureStore({ reducer: slice10.reducer });
function Ex10_Name() { return <Provider store={store10}><Ex10_Inner /></Provider>; }
function Ex10_Inner() {
  const { note, savedAt, saveCount } = useSelector((s: ReturnType<typeof store10.getState>) => s);
  const d = useDispatch();
  return <div><textarea value={note} onChange={e => d(slice10.actions.update(e.target.value))} rows={3} cols={30} placeholder="Type a note..." /><div><button onClick={() => d(slice10.actions.save())}>Save</button>{savedAt && <span style={{ fontSize: 11 }}> Saved at {savedAt} (×{saveCount})</span>}</div></div>;
}

// 11. Multiple useSelector calls
const slice11 = createSlice({ name: "ex11", initialState: { firstName: "John", lastName: "Doe", age: 25, city: "Boston", country: "USA", occupation: "Engineer" }, reducers: { update: (s, a: PayloadAction<Partial<typeof s>>) => { Object.assign(s, a.payload); } } });
const store11 = configureStore({ reducer: slice11.reducer });
type RS11 = ReturnType<typeof store11.getState>;
function Ex11_Name() { return <Provider store={store11}><Ex11_Inner /></Provider>; }
function Ex11_Inner() {
  // Multiple independent useSelector calls — each re-renders only on its slice change
  const fullName = useSelector((s: RS11) => `${s.firstName} ${s.lastName}`);
  const location = useSelector((s: RS11) => `${s.city}, ${s.country}`);
  const details = useSelector((s: RS11) => `${s.age}yo ${s.occupation}`);
  const d = useDispatch();
  return <div><p><strong>{fullName}</strong></p><p>{location}</p><p>{details}</p><button onClick={() => d(slice11.actions.update({ city: "Seattle", country: "USA" }))}>Move to Seattle</button><button onClick={() => d(slice11.actions.update({ age: 26 }))}>Birthday</button></div>;
}

// 12. Selector with argument (memoized)
const slice12 = createSlice({ name: "ex12", initialState: { users: [{ id: 1, name: "Alice", dept: "eng" }, { id: 2, name: "Bob", dept: "design" }, { id: 3, name: "Carol", dept: "eng" }, { id: 4, name: "Dave", dept: "pm" }] }, reducers: { add: (s, a: PayloadAction<{ name: string; dept: string }>) => { s.users.push({ id: Date.now(), ...a.payload }); } } });
const store12 = configureStore({ reducer: slice12.reducer });
type RS12 = ReturnType<typeof store12.getState>;
function Ex12_Name() { return <Provider store={store12}><Ex12_Inner /></Provider>; }
function Ex12_Inner() {
  const [dept, setDept] = useState("eng");
  // Selector factory — creates a new selector per dept value
  const selectByDept = useCallback((d: string) => (s: RS12) => s.users.filter(u => u.dept === d), []);
  const users = useSelector(selectByDept(dept));
  const d = useDispatch();
  return <div><select value={dept} onChange={e => setDept(e.target.value)}>{["eng", "design", "pm"].map(d => <option key={d}>{d}</option>)}</select><ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul><button onClick={() => d(slice12.actions.add({ name: `New ${dept}`, dept }))}>Add to {dept}</button></div>;
}

// ─── INTERMEDIATE 13–25 ─────────────────────────────────────────────────────────

// 13. useSelector with equality function
const slice13 = createSlice({ name: "ex13", initialState: { a: 1, b: 2, c: 3, tick: 0 }, reducers: { tick: s => { s.tick++; }, updateA: (s, a: PayloadAction<number>) => { s.a = a.payload; } } });
const store13 = configureStore({ reducer: slice13.reducer });
type RS13 = ReturnType<typeof store13.getState>;
function Ex13_Name() { return <Provider store={store13}><Ex13_Inner /></Provider>; }
function Ex13_Inner() {
  const renders = useRef(0); renders.current++;
  // shallowEqual prevents re-render when tick changes but a/b/c don't
  const { a, b } = useSelector((s: RS13) => ({ a: s.a, b: s.b }), shallowEqual);
  const d = useDispatch();
  return <div><p>a: {a} | b: {b}</p><p style={{ fontSize: 11 }}>Renders: {renders.current} (tick updates don't cause re-render)</p><button onClick={() => d(slice13.actions.tick())}>Tick (no re-render)</button><button onClick={() => d(slice13.actions.updateA(a + 1))}>Update a (re-renders)</button></div>;
}

// 14. Selector composition
const slice14 = createSlice({ name: "ex14", initialState: { items: [{ id: 1, name: "Widget", price: 20, qty: 2, discount: 0 }, { id: 2, name: "Gadget", price: 50, qty: 1, discount: 10 }] }, reducers: { setQty: (s, a: PayloadAction<{ id: number; qty: number }>) => { const i = s.items.find(i => i.id === a.payload.id); if (i) i.qty = a.payload.qty; } } });
const store14 = configureStore({ reducer: slice14.reducer });
type RS14 = ReturnType<typeof store14.getState>;
const selectItems14 = (s: RS14) => s.items;
const selectSubtotals14 = (s: RS14) => selectItems14(s).map(i => ({ ...i, subtotal: i.price * i.qty * (1 - i.discount / 100) }));
const selectTotal14 = (s: RS14) => selectSubtotals14(s).reduce((sum, i) => sum + i.subtotal, 0);
function Ex14_Name() { return <Provider store={store14}><Ex14_Inner /></Provider>; }
function Ex14_Inner() {
  const subtotals = useSelector(selectSubtotals14);
  const total = useSelector(selectTotal14);
  const d = useDispatch();
  return <div><ul>{subtotals.map(i => <li key={i.id}>{i.name}: ${i.price} ×<input type="number" value={i.qty} min={1} onChange={e => d(slice14.actions.setQty({ id: i.id, qty: Number(e.target.value) }))} style={{ width: 40 }} /> {i.discount > 0 ? `(-${i.discount}%)` : ""} = ${i.subtotal.toFixed(2)}</li>)}</ul><p><strong>Total: ${total.toFixed(2)}</strong></p></div>;
}

// 15. useDispatch in child component
const slice15 = createSlice({ name: "ex15", initialState: { items: [] as string[], count: 0 }, reducers: { addItem: (s, a: PayloadAction<string>) => { s.items.push(a.payload); s.count++; }, clear: s => { s.items = []; s.count = 0; } } });
const store15 = configureStore({ reducer: slice15.reducer });
type RS15 = ReturnType<typeof store15.getState>;
function Ex15_Name() { return <Provider store={store15}><Ex15_Parent /></Provider>; }
function Ex15_Parent() {
  const count = useSelector((s: RS15) => s.count);
  const d = useDispatch();
  return <div><p>Total items: {count}</p><button onClick={() => d(slice15.actions.clear())}>Clear (parent)</button><Ex15_Child source="Panel A" /><Ex15_Child source="Panel B" /></div>;
}
function Ex15_Child({ source }: { source: string }) {
  const items = useSelector((s: RS15) => s.items.filter(i => i.startsWith(source)));
  const d = useDispatch();
  return <div style={{ border: "1px solid #ccc", padding: 4, margin: 4 }}><strong>{source}</strong> ({items.length})<button onClick={() => d(slice15.actions.addItem(`${source} item${items.length + 1}`))}>Add</button></div>;
}

// 16. Container + presentational pattern
const slice16 = createSlice({ name: "ex16", initialState: { weather: { city: "NYC", temp: 22, condition: "sunny", humidity: 60 } }, reducers: { setWeather: (s, a: PayloadAction<Partial<typeof s.weather>>) => { Object.assign(s.weather, a.payload); } } });
const store16 = configureStore({ reducer: slice16.reducer });
type RS16 = ReturnType<typeof store16.getState>;
// Presentational: no Redux awareness
function WeatherCard16({ city, temp, condition, humidity, onRefresh }: { city: string; temp: number; condition: string; humidity: number; onRefresh: () => void }) {
  return <div style={{ border: "1px solid #2196f3", padding: 8, borderRadius: 4 }}><h4>{city}</h4><p>{temp}°C — {condition}</p><p>Humidity: {humidity}%</p><button onClick={onRefresh}>Refresh</button></div>;
}
// Container: connects to Redux
function Ex16_Name() { return <Provider store={store16}><Ex16_Container /></Provider>; }
function Ex16_Container() {
  const weather = useSelector((s: RS16) => s.weather);
  const d = useDispatch();
  const refresh = () => d(slice16.actions.setWeather({ temp: Math.round(15 + Math.random() * 20), humidity: Math.round(40 + Math.random() * 40), condition: ["sunny", "cloudy", "rainy"][Math.floor(Math.random() * 3)] }));
  return <WeatherCard16 {...weather} onRefresh={refresh} />;
}

// 17. Custom useAppSelector + useAppDispatch hooks
const slice17 = createSlice({ name: "ex17", initialState: { theme: "light", user: "Alice", notifs: 3 }, reducers: { toggleTheme: s => { s.theme = s.theme === "light" ? "dark" : "light"; }, addNotif: s => { s.notifs++; }, clearNotifs: s => { s.notifs = 0; } } });
const store17 = configureStore({ reducer: slice17.reducer });
type RS17 = ReturnType<typeof store17.getState>;
type Dispatch17 = typeof store17.dispatch;
// Custom hooks
const useAppSelector17 = <T>(selector: (s: RS17) => T) => useSelector<RS17, T>(selector);
const useAppDispatch17 = () => useDispatch<Dispatch17>();
function Ex17_Name() { return <Provider store={store17}><Ex17_Inner /></Provider>; }
function Ex17_Inner() {
  const theme = useAppSelector17(s => s.theme);
  const user = useAppSelector17(s => s.user);
  const notifs = useAppSelector17(s => s.notifs);
  const d = useAppDispatch17();
  return <div style={{ background: theme === "dark" ? "#333" : "#fff", color: theme === "dark" ? "#fff" : "#333", padding: 8 }}><p>User: {user} | Notifs: {notifs} | Theme: {theme}</p><button onClick={() => d(slice17.actions.toggleTheme())}>Toggle Theme</button><button onClick={() => d(slice17.actions.addNotif())}>+Notif</button><button onClick={() => d(slice17.actions.clearNotifs())}>Clear Notifs</button></div>;
}

// 18. Selector for filtered list
const slice18 = createSlice({ name: "ex18", initialState: { products: [{ id: 1, name: "Apple", cat: "fruit", price: 1.2 }, { id: 2, name: "Carrot", cat: "veg", price: 0.8 }, { id: 3, name: "Banana", cat: "fruit", price: 0.5 }, { id: 4, name: "Spinach", cat: "veg", price: 2.1 }], activeCategory: "all" }, reducers: { setCategory: (s, a: PayloadAction<string>) => { s.activeCategory = a.payload; } } });
const store18 = configureStore({ reducer: slice18.reducer });
type RS18 = ReturnType<typeof store18.getState>;
const selectFiltered18 = (s: RS18) => s.products.filter(p => s.activeCategory === "all" || p.cat === s.activeCategory);
function Ex18_Name() { return <Provider store={store18}><Ex18_Inner /></Provider>; }
function Ex18_Inner() {
  const filtered = useSelector(selectFiltered18);
  const activeCategory = useSelector((s: RS18) => s.activeCategory);
  const d = useDispatch();
  return <div><div>{["all", "fruit", "veg"].map(c => <button key={c} onClick={() => d(slice18.actions.setCategory(c))} style={{ fontWeight: activeCategory === c ? "bold" : "normal" }}>{c}</button>)}</div><ul>{filtered.map(p => <li key={p.id}>{p.name} — ${p.price}</li>)}</ul><p>{filtered.length} items shown</p></div>;
}

// 19. Selector for sorted list
const slice19 = createSlice({ name: "ex19", initialState: { employees: [{ id: 1, name: "Charlie", salary: 65000 }, { id: 2, name: "Alice", salary: 85000 }, { id: 3, name: "Bob", salary: 72000 }, { id: 4, name: "Diana", salary: 91000 }], sortBy: "name" as "name" | "salary", sortDir: "asc" as "asc" | "desc" }, reducers: { setSort: (s, a: PayloadAction<"name" | "salary">) => { if (s.sortBy === a.payload) s.sortDir = s.sortDir === "asc" ? "desc" : "asc"; else { s.sortBy = a.payload; s.sortDir = "asc"; } } } });
const store19 = configureStore({ reducer: slice19.reducer });
type RS19 = ReturnType<typeof store19.getState>;
const selectSorted19 = (s: RS19) => [...s.employees].sort((a, b) => { const m = s.sortDir === "asc" ? 1 : -1; return m * (a[s.sortBy] > b[s.sortBy] ? 1 : -1); });
function Ex19_Name() { return <Provider store={store19}><Ex19_Inner /></Provider>; }
function Ex19_Inner() {
  const sorted = useSelector(selectSorted19);
  const { sortBy, sortDir } = useSelector((s: RS19) => ({ sortBy: s.sortBy, sortDir: s.sortDir }));
  const d = useDispatch();
  return <div><table><thead><tr>{(["name", "salary"] as const).map(k => <th key={k} onClick={() => d(slice19.actions.setSort(k))} style={{ cursor: "pointer" }}>{k} {sortBy === k ? (sortDir === "asc" ? "↑" : "↓") : ""}</th>)}</tr></thead><tbody>{sorted.map(e => <tr key={e.id}><td>{e.name}</td><td>${e.salary.toLocaleString()}</td></tr>)}</tbody></table></div>;
}

// 20. Selector for pagination
const slice20 = createSlice({ name: "ex20", initialState: { allItems: Array.from({ length: 30 }, (_, i) => `Item ${i + 1}`), page: 1, pageSize: 5 }, reducers: { setPage: (s, a: PayloadAction<number>) => { s.page = a.payload; }, setPageSize: (s, a: PayloadAction<number>) => { s.pageSize = a.payload; s.page = 1; } } });
const store20 = configureStore({ reducer: slice20.reducer });
type RS20 = ReturnType<typeof store20.getState>;
const selectPage20 = (s: RS20) => ({ items: s.allItems.slice((s.page - 1) * s.pageSize, s.page * s.pageSize), totalPages: Math.ceil(s.allItems.length / s.pageSize), current: s.page });
function Ex20_Name() { return <Provider store={store20}><Ex20_Inner /></Provider>; }
function Ex20_Inner() {
  const { items, totalPages, current } = useSelector(selectPage20);
  const { pageSize } = useSelector((s: RS20) => ({ pageSize: s.pageSize }));
  const d = useDispatch();
  return <div><ul>{items.map(i => <li key={i}>{i}</li>)}</ul><div><button onClick={() => d(slice20.actions.setPage(current - 1))} disabled={current === 1}>Prev</button><span> Page {current}/{totalPages} </span><button onClick={() => d(slice20.actions.setPage(current + 1))} disabled={current === totalPages}>Next</button></div><select value={pageSize} onChange={e => d(slice20.actions.setPageSize(Number(e.target.value)))}>{[5, 10, 15].map(n => <option key={n}>{n}</option>)}</select> per page</div>;
}

// 21. Conditional rendering from store state
const slice21 = createSlice({ name: "ex21", initialState: { isLoggedIn: false, isAdmin: false, loading: false, hasError: false, data: null as string | null }, reducers: { login: (s, a: PayloadAction<boolean>) => { s.isLoggedIn = true; s.isAdmin = a.payload; }, logout: s => { s.isLoggedIn = false; s.isAdmin = false; s.data = null; }, fetchStart: s => { s.loading = true; s.hasError = false; }, fetchSuccess: (s, a: PayloadAction<string>) => { s.loading = false; s.data = a.payload; }, fetchError: s => { s.loading = false; s.hasError = true; } } });
const store21 = configureStore({ reducer: slice21.reducer });
function Ex21_Name() { return <Provider store={store21}><Ex21_Inner /></Provider>; }
function Ex21_Inner() {
  const state = useSelector((s: ReturnType<typeof store21.getState>) => s);
  const d = useDispatch();
  const fetch = () => { d(slice21.actions.fetchStart()); setTimeout(() => Math.random() > 0.3 ? d(slice21.actions.fetchSuccess("Here is your data!")) : d(slice21.actions.fetchError()), 800); };
  if (!state.isLoggedIn) return <div><button onClick={() => d(slice21.actions.login(false))}>Login as User</button><button onClick={() => d(slice21.actions.login(true))}>Login as Admin</button></div>;
  return <div><p>Logged in {state.isAdmin ? "(Admin)" : "(User)"}</p>{state.isAdmin && <button onClick={fetch}>Fetch Admin Data</button>}{state.loading && <p>Loading...</p>}{state.hasError && <p style={{ color: "red" }}>Error!</p>}{state.data && <p style={{ color: "green" }}>{state.data}</p>}<button onClick={() => d(slice21.actions.logout())}>Logout</button></div>;
}

// 22. Form controlled by Redux state
const slice22 = createSlice({ name: "ex22", initialState: { form: { name: "", email: "", bio: "", agree: false }, dirty: false, saved: false }, reducers: { updateField: (s, a: PayloadAction<{ field: string; value: string | boolean }>) => { (s.form as Record<string, string | boolean>)[a.payload.field] = a.payload.value; s.dirty = true; s.saved = false; }, save: s => { s.dirty = false; s.saved = true; }, reset: s => { s.form = { name: "", email: "", bio: "", agree: false }; s.dirty = false; s.saved = false; } } });
const store22 = configureStore({ reducer: slice22.reducer });
type RS22 = ReturnType<typeof store22.getState>;
function Ex22_Name() { return <Provider store={store22}><Ex22_Inner /></Provider>; }
function Ex22_Inner() {
  const { form, dirty, saved } = useSelector((s: RS22) => s);
  const d = useDispatch();
  const set = (field: string, value: string | boolean) => d(slice22.actions.updateField({ field, value }));
  return <div><input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Name" style={{ display: "block", margin: "4px 0" }} /><input value={form.email} onChange={e => set("email", e.target.value)} placeholder="Email" style={{ display: "block", margin: "4px 0" }} /><textarea value={form.bio} onChange={e => set("bio", e.target.value)} placeholder="Bio" rows={2} style={{ display: "block", margin: "4px 0" }} /><label><input type="checkbox" checked={form.agree} onChange={e => set("agree", e.target.checked)} /> I agree</label><div><button onClick={() => d(slice22.actions.save())} disabled={!dirty || !form.agree}>Save</button><button onClick={() => d(slice22.actions.reset())}>Reset</button></div>{saved && <p style={{ color: "green" }}>Saved!</p>}{dirty && <p style={{ color: "orange" }}>Unsaved changes</p>}</div>;
}

// 23. Optimistic UI with Redux
const slice23 = createSlice({ name: "ex23", initialState: { items: [{ id: 1, text: "Existing item", status: "saved" as "saved" | "saving" | "error" }], nextId: 2 }, reducers: { addOptimistic: (s, a: PayloadAction<string>) => { s.items.push({ id: s.nextId++, text: a.payload, status: "saving" }); }, confirm: (s, a: PayloadAction<number>) => { const i = s.items.find(i => i.id === a.payload); if (i) i.status = "saved"; }, markError: (s, a: PayloadAction<number>) => { const i = s.items.find(i => i.id === a.payload); if (i) i.status = "error"; }, removeItem: (s, a: PayloadAction<number>) => { s.items = s.items.filter(i => i.id !== a.payload); } } });
const store23 = configureStore({ reducer: slice23.reducer });
const statusStyle23: Record<string, React.CSSProperties> = { saved: { background: "#c8e6c9" }, saving: { background: "#fff9c4" }, error: { background: "#ffcdd2" } };
function Ex23_Name() { return <Provider store={store23}><Ex23_Inner /></Provider>; }
function Ex23_Inner() {
  const { items } = useSelector((s: ReturnType<typeof store23.getState>) => s);
  const d = useDispatch();
  const [v, setV] = useState("");
  const handleAdd = () => {
    if (!v) return;
    d(slice23.actions.addOptimistic(v));
    const id = store23.getState().items.at(-1)!.id;
    setTimeout(() => d(Math.random() > 0.3 ? slice23.actions.confirm(id) : slice23.actions.markError(id)), 1000);
    setV("");
  };
  return <div><input value={v} onChange={e => setV(e.target.value)} /><button onClick={handleAdd}>Add (70% success)</button><ul>{items.map(i => <li key={i.id} style={{ ...statusStyle23[i.status], padding: 4, marginTop: 2 }}>{i.text} [{i.status}]{i.status === "error" && <button onClick={() => d(slice23.actions.removeItem(i.id))}>Remove</button>}</li>)}</ul></div>;
}

// 24. Component reset via dispatch
const slice24 = createSlice({ name: "ex24", initialState: { score: 0, level: 1, lives: 3, gameOver: false }, reducers: { scorePoint: s => { s.score += s.level * 10; if (s.score >= s.level * 50) s.level++; }, loseLife: s => { s.lives--; if (s.lives <= 0) s.gameOver = true; }, reset: () => ({ score: 0, level: 1, lives: 3, gameOver: false }) } });
const store24 = configureStore({ reducer: slice24.reducer });
function Ex24_Name() { return <Provider store={store24}><Ex24_Inner /></Provider>; }
function Ex24_Inner() {
  const state = useSelector((s: ReturnType<typeof store24.getState>) => s);
  const d = useDispatch();
  if (state.gameOver) return <div><p>Game Over! Final score: {state.score}</p><button onClick={() => d(slice24.actions.reset())}>Play Again</button></div>;
  return <div><p>Score: {state.score} | Level: {state.level} | Lives: {"❤".repeat(state.lives)}</p><button onClick={() => d(slice24.actions.scorePoint())}>Score Point (+{state.level * 10})</button><button onClick={() => d(slice24.actions.loseLife())}>Lose Life</button><button onClick={() => d(slice24.actions.reset())}>Reset</button></div>;
}

// 25. Multiple components sharing same store slice
const slice25 = createSlice({ name: "ex25", initialState: { count: 0, history: [] as number[] }, reducers: { inc: s => { s.count++; s.history.push(s.count); }, dec: s => { s.count--; s.history.push(s.count); } } });
const store25 = configureStore({ reducer: slice25.reducer });
type RS25 = ReturnType<typeof store25.getState>;
function Ex25_Display({ label }: { label: string }) {
  const count = useSelector((s: RS25) => s.count);
  const renders = useRef(0); renders.current++;
  return <div style={{ border: "1px solid #4caf50", padding: 4, margin: 4 }}><strong>{label}</strong>: {count} <span style={{ fontSize: 10 }}>(r:{renders.current})</span></div>;
}
function Ex25_Controls() {
  const d = useDispatch();
  return <div><button onClick={() => d(slice25.actions.dec())}>-</button><button onClick={() => d(slice25.actions.inc())}>+</button></div>;
}
function Ex25_History() {
  const history = useSelector((s: RS25) => s.history.slice(-8));
  return <p style={{ fontSize: 11 }}>History: [{history.join(", ")}]</p>;
}
function Ex25_Name() { return <Provider store={store25}><Ex25_Display label="Component A" /><Ex25_Display label="Component B" /><Ex25_Display label="Component C" /><Ex25_Controls /><Ex25_History /></Provider>; }

// ─── NESTED 26–37 ───────────────────────────────────────────────────────────────

// 26. Deep selector (nested object)
const slice26 = createSlice({ name: "ex26", initialState: { company: { name: "Acme", departments: { eng: { head: "Alice", budget: 500000, headcount: 20 }, design: { head: "Bob", budget: 200000, headcount: 8 } } } }, reducers: { setBudget: (s, a: PayloadAction<{ dept: "eng" | "design"; amount: number }>) => { s.company.departments[a.payload.dept].budget = a.payload.amount; } } });
const store26 = configureStore({ reducer: slice26.reducer });
type RS26 = ReturnType<typeof store26.getState>;
const selectEngBudget26 = (s: RS26) => s.company.departments.eng.budget;
const selectTotalBudget26 = (s: RS26) => Object.values(s.company.departments).reduce((sum, d) => sum + d.budget, 0);
function Ex26_Name() { return <Provider store={store26}><Ex26_Inner /></Provider>; }
function Ex26_Inner() {
  const { company } = useSelector((s: RS26) => s);
  const engBudget = useSelector(selectEngBudget26);
  const totalBudget = useSelector(selectTotalBudget26);
  const d = useDispatch();
  return <div><p>{company.name}</p>{Object.entries(company.departments).map(([k, dept]) => <p key={k}>{k}: {dept.head} — ${dept.budget.toLocaleString()} ({dept.headcount} people)</p>)}<p>Total budget: ${totalBudget.toLocaleString()} | Eng: ${engBudget.toLocaleString()}</p><button onClick={() => d(slice26.actions.setBudget({ dept: "eng", amount: engBudget + 50000 }))}>+$50k to Eng</button></div>;
}

// 27. Selector for normalized data (denormalize)
const slice27 = createSlice({ name: "ex27", initialState: { posts: { 1: { id: 1, title: "Hello Redux", authorId: 10 }, 2: { id: 2, title: "RTK Guide", authorId: 11 } } as Record<number, { id: number; title: string; authorId: number }>, users: { 10: { id: 10, name: "Alice" }, 11: { id: 11, name: "Bob" } } as Record<number, { id: number; name: string }> }, reducers: {} });
const store27 = configureStore({ reducer: slice27.reducer });
type RS27 = ReturnType<typeof store27.getState>;
const selectDenormalized27 = (s: RS27) => Object.values(s.posts).map(p => ({ ...p, author: s.users[p.authorId]?.name ?? "Unknown" }));
function Ex27_Name() { return <Provider store={store27}><Ex27_Inner /></Provider>; }
function Ex27_Inner() {
  const posts = useSelector(selectDenormalized27);
  return <div><ul>{posts.map(p => <li key={p.id}><strong>{p.title}</strong> by {p.author}</li>)}</ul><p style={{ fontSize: 11 }}>Denormalized from separate posts + users maps</p></div>;
}

// 28. Component tree all connected to store
const slice28 = createSlice({ name: "ex28", initialState: { headerTitle: "My App", sidebarItems: ["Home", "About", "Contact"], mainContent: "Welcome!", footerText: "© 2024" }, reducers: { setTitle: (s, a: PayloadAction<string>) => { s.headerTitle = a.payload; }, setContent: (s, a: PayloadAction<string>) => { s.mainContent = a.payload; } } });
const store28 = configureStore({ reducer: slice28.reducer });
type RS28 = ReturnType<typeof store28.getState>;
function Header28() { const title = useSelector((s: RS28) => s.headerTitle); return <header style={{ background: "#333", color: "#fff", padding: 8 }}>{title}</header>; }
function Sidebar28() { const items = useSelector((s: RS28) => s.sidebarItems); const d = useDispatch(); return <nav style={{ background: "#f0f0f0", padding: 8, width: 100 }}>{items.map(i => <div key={i} style={{ cursor: "pointer", padding: 4 }} onClick={() => d(slice28.actions.setContent(`Content for: ${i}`))}>{i}</div>)}</nav>; }
function Main28() { const content = useSelector((s: RS28) => s.mainContent); return <main style={{ flex: 1, padding: 8 }}>{content}</main>; }
function Footer28() { const text = useSelector((s: RS28) => s.footerText); return <footer style={{ background: "#eee", padding: 4, fontSize: 11 }}>{text}</footer>; }
function Ex28_Name() { return <Provider store={store28}><div><Header28 /><div style={{ display: "flex" }}><Sidebar28 /><Main28 /></div><Footer28 /></div></Provider>; }

// 29. Parent reads store, passes to child via props
const slice29 = createSlice({ name: "ex29", initialState: { users: [{ id: 1, name: "Alice", email: "alice@ex.com", avatar: "A" }, { id: 2, name: "Bob", email: "bob@ex.com", avatar: "B" }] }, reducers: { updateUser: (s, a: PayloadAction<{ id: number; email: string }>) => { const u = s.users.find(u => u.id === a.payload.id); if (u) u.email = a.payload.email; } } });
const store29 = configureStore({ reducer: slice29.reducer });
type RS29 = ReturnType<typeof store29.getState>;
type User29 = ReturnType<typeof store29.getState>["users"][number];
function UserCard29({ user, onUpdate }: { user: User29; onUpdate: (email: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState(user.email);
  return <div style={{ border: "1px solid #ccc", padding: 4, margin: 4 }}><span style={{ background: "#4caf50", color: "#fff", borderRadius: "50%", padding: "2px 6px" }}>{user.avatar}</span> <strong>{user.name}</strong>{editing ? <><input value={email} onChange={e => setEmail(e.target.value)} /><button onClick={() => { onUpdate(email); setEditing(false); }}>Save</button></> : <span> {user.email} <button onClick={() => setEditing(true)}>Edit</button></span>}</div>;
}
function Ex29_Name() { return <Provider store={store29}><Ex29_Parent /></Provider>; }
function Ex29_Parent() {
  const users = useSelector((s: RS29) => s.users);
  const d = useDispatch();
  return <div>{users.map(u => <UserCard29 key={u.id} user={u} onUpdate={email => d(slice29.actions.updateUser({ id: u.id, email }))} />)}</div>;
}

// 30. Sibling components both connected
const slice30 = createSlice({ name: "ex30", initialState: { cart: [] as { id: number; name: string; price: number }[], wishlist: [] as { id: number; name: string; price: number }[] }, reducers: { addToCart: (s, a: PayloadAction<{ id: number; name: string; price: number }>) => { if (!s.cart.find(i => i.id === a.payload.id)) s.cart.push(a.payload); }, addToWishlist: (s, a: PayloadAction<{ id: number; name: string; price: number }>) => { if (!s.wishlist.find(i => i.id === a.payload.id)) s.wishlist.push(a.payload); }, moveToCart: (s, a: PayloadAction<number>) => { const i = s.wishlist.find(i => i.id === a.payload); if (i) { s.cart.push(i); s.wishlist = s.wishlist.filter(w => w.id !== a.payload); } } } });
const store30 = configureStore({ reducer: slice30.reducer });
const products30 = [{ id: 1, name: "Laptop", price: 999 }, { id: 2, name: "Phone", price: 699 }, { id: 3, name: "Watch", price: 299 }];
type RS30 = ReturnType<typeof store30.getState>;
function CartPanel30() { const cart = useSelector((s: RS30) => s.cart); return <div style={{ border: "1px solid #4caf50", padding: 8, flex: 1 }}><strong>Cart ({cart.length})</strong><ul>{cart.map(i => <li key={i.id}>{i.name} ${i.price}</li>)}</ul></div>; }
function WishlistPanel30() { const wishlist = useSelector((s: RS30) => s.wishlist); const d = useDispatch(); return <div style={{ border: "1px solid #ff9800", padding: 8, flex: 1 }}><strong>Wishlist ({wishlist.length})</strong><ul>{wishlist.map(i => <li key={i.id}>{i.name} <button onClick={() => d(slice30.actions.moveToCart(i.id))}>→Cart</button></li>)}</ul></div>; }
function Ex30_Name() { return <Provider store={store30}><div><div style={{ display: "flex", gap: 4 }}>{products30.map(p => <button key={p.id} onClick={() => store30.dispatch(slice30.actions.addToCart(p))}>Add {p.name}</button>)}<button onClick={() => store30.dispatch(slice30.actions.addToWishlist(products30[0]))}>Wishlist Laptop</button></div><div style={{ display: "flex", gap: 8, marginTop: 8 }}><CartPanel30 /><WishlistPanel30 /></div></div></Provider>; }

// 31. List + detail (master/detail)
const slice31 = createSlice({ name: "ex31", initialState: { articles: [{ id: 1, title: "Redux Basics", content: "Redux manages global state...", tags: ["redux", "state"] }, { id: 2, title: "RTK Guide", content: "Redux Toolkit simplifies Redux...", tags: ["rtk", "redux"] }, { id: 3, title: "React Hooks", content: "Hooks allow functional components...", tags: ["react", "hooks"] }], selectedId: null as number | null }, reducers: { select: (s, a: PayloadAction<number>) => { s.selectedId = a.payload; } } });
const store31 = configureStore({ reducer: slice31.reducer });
type RS31 = ReturnType<typeof store31.getState>;
function ArticleList31() { const articles = useSelector((s: RS31) => s.articles); const selectedId = useSelector((s: RS31) => s.selectedId); const d = useDispatch(); return <ul style={{ width: 120, borderRight: "1px solid #ccc", paddingRight: 8 }}>{articles.map(a => <li key={a.id} onClick={() => d(slice31.actions.select(a.id))} style={{ cursor: "pointer", fontWeight: selectedId === a.id ? "bold" : "normal", padding: 4 }}>{a.title}</li>)}</ul>; }
function ArticleDetail31() { const article = useSelector((s: RS31) => s.articles.find(a => a.id === s.selectedId)); if (!article) return <div style={{ flex: 1, padding: 8, color: "#999" }}>Select an article</div>; return <div style={{ flex: 1, padding: 8 }}><h3>{article.title}</h3><p>{article.content}</p><p>{article.tags.map(t => <span key={t} style={{ background: "#e0e0e0", borderRadius: 4, padding: "0 4px", marginRight: 4 }}>{t}</span>)}</p></div>; }
function Ex31_Name() { return <Provider store={store31}><div style={{ display: "flex" }}><ArticleList31 /><ArticleDetail31 /></div></Provider>; }

// 32. Connected form with validation state in store
const slice32 = createSlice({ name: "ex32", initialState: { fields: { username: "", password: "", confirm: "" }, errors: {} as Record<string, string>, touched: {} as Record<string, boolean>, valid: false }, reducers: { setField: (s, a: PayloadAction<{ name: string; value: string }>) => { (s.fields as Record<string, string>)[a.payload.name] = a.payload.value; (s.touched as Record<string, boolean>)[a.payload.name] = true; const e: Record<string, string> = {}; if (!s.fields.username || s.fields.username.length < 3) e.username = "Min 3 chars"; if (!s.fields.password || s.fields.password.length < 6) e.password = "Min 6 chars"; if (s.fields.confirm !== s.fields.password) e.confirm = "Passwords don't match"; s.errors = e; s.valid = Object.keys(e).length === 0; } } });
const store32 = configureStore({ reducer: slice32.reducer });
type RS32 = ReturnType<typeof store32.getState>;
function Ex32_Name() { return <Provider store={store32}><Ex32_Inner /></Provider>; }
function Ex32_Inner() {
  const { fields, errors, touched, valid } = useSelector((s: RS32) => s);
  const d = useDispatch();
  const Field32 = ({ name }: { name: "username" | "password" | "confirm" }) => <div><input type={name !== "username" ? "password" : "text"} placeholder={name} value={fields[name]} onChange={e => d(slice32.actions.setField({ name, value: e.target.value }))} />{touched[name] && errors[name] && <span style={{ color: "red", fontSize: 11 }}> {errors[name]}</span>}</div>;
  return <div><Field32 name="username" /><Field32 name="password" /><Field32 name="confirm" /><button disabled={!valid} style={{ background: valid ? "#4caf50" : "#ccc", color: "#fff" }}>Register</button></div>;
}

// 33. Connected table with sort/filter/pagination in store
const slice33 = createSlice({ name: "ex33", initialState: { data: Array.from({ length: 15 }, (_, i) => ({ id: i + 1, name: `User ${i + 1}`, email: `user${i + 1}@ex.com`, score: Math.floor(Math.random() * 100) })), filter: "", sortCol: "id" as "id" | "name" | "score", sortDir: "asc" as "asc" | "desc", page: 1, pageSize: 5 }, reducers: { setFilter: (s, a: PayloadAction<string>) => { s.filter = a.payload; s.page = 1; }, toggleSort: (s, a: PayloadAction<"id" | "name" | "score">) => { if (s.sortCol === a.payload) s.sortDir = s.sortDir === "asc" ? "desc" : "asc"; else { s.sortCol = a.payload; s.sortDir = "asc"; } }, setPage: (s, a: PayloadAction<number>) => { s.page = a.payload; } } });
const store33 = configureStore({ reducer: slice33.reducer });
type RS33 = ReturnType<typeof store33.getState>;
const selectTableData33 = (s: RS33) => {
  const filtered = s.data.filter(r => r.name.toLowerCase().includes(s.filter.toLowerCase()));
  const sorted = [...filtered].sort((a, b) => (s.sortDir === "asc" ? 1 : -1) * (a[s.sortCol] > b[s.sortCol] ? 1 : -1));
  return { rows: sorted.slice((s.page - 1) * s.pageSize, s.page * s.pageSize), total: filtered.length, totalPages: Math.ceil(filtered.length / s.pageSize) };
};
function Ex33_Name() { return <Provider store={store33}><Ex33_Inner /></Provider>; }
function Ex33_Inner() {
  const { rows, total, totalPages } = useSelector(selectTableData33);
  const { filter, sortCol, sortDir, page } = useSelector((s: RS33) => ({ filter: s.filter, sortCol: s.sortCol, sortDir: s.sortDir, page: s.page }));
  const d = useDispatch();
  const cols: ("id" | "name" | "score")[] = ["id", "name", "score"];
  return <div><input value={filter} onChange={e => d(slice33.actions.setFilter(e.target.value))} placeholder="Filter by name..." /><p style={{ fontSize: 11 }}>Showing {rows.length} of {total}</p><table><thead><tr>{cols.map(c => <th key={c} onClick={() => d(slice33.actions.toggleSort(c))} style={{ cursor: "pointer" }}>{c}{sortCol === c ? (sortDir === "asc" ? "↑" : "↓") : ""}</th>)}</tr></thead><tbody>{rows.map(r => <tr key={r.id}><td>{r.id}</td><td>{r.name}</td><td>{r.score}</td></tr>)}</tbody></table><div>{Array.from({ length: totalPages }, (_, i) => <button key={i} onClick={() => d(slice33.actions.setPage(i + 1))} style={{ fontWeight: page === i + 1 ? "bold" : "normal" }}>{i + 1}</button>)}</div></div>;
}

// 34. Multi-slice component (reads from 2 slices)
const profileSlice34 = createSlice({ name: "ex34_profile", initialState: { name: "Alice", avatar: "👩" }, reducers: { setName: (s, a: PayloadAction<string>) => { s.name = a.payload; } } });
const cartSlice34 = createSlice({ name: "ex34_cart", initialState: { items: [] as string[], total: 0 }, reducers: { add: (s, a: PayloadAction<string>) => { s.items.push(a.payload); s.total += 10; }, clear: s => { s.items = []; s.total = 0; } } });
const store34 = configureStore({ reducer: { profile: profileSlice34.reducer, cart: cartSlice34.reducer } });
type RS34 = ReturnType<typeof store34.getState>;
function Ex34_Name() { return <Provider store={store34}><Ex34_Inner /></Provider>; }
function Ex34_Inner() {
  const profile = useSelector((s: RS34) => s.profile);
  const cart = useSelector((s: RS34) => s.cart);
  const d = useDispatch();
  return <div><div style={{ display: "flex", justifyContent: "space-between", background: "#f5f5f5", padding: 8 }}><span>{profile.avatar} {profile.name}</span><span>Cart: {cart.items.length} items (${cart.total})</span></div><div style={{ padding: 8 }}><button onClick={() => d(cartSlice34.actions.add("Item"))}>Add to Cart</button><button onClick={() => d(cartSlice34.actions.clear())}>Clear Cart</button><button onClick={() => d(profileSlice34.actions.setName("Bob"))}>Change Name</button></div></div>;
}

// 35. Shared selector used by multiple components
const slice35 = createSlice({ name: "ex35", initialState: { inventory: [{ id: 1, name: "Widget", stock: 5, price: 20 }, { id: 2, name: "Gadget", stock: 0, price: 50 }, { id: 3, name: "Thing", stock: 2, price: 15 }] }, reducers: { sell: (s, a: PayloadAction<number>) => { const i = s.inventory.find(i => i.id === a.payload); if (i && i.stock > 0) i.stock--; }, restock: (s, a: PayloadAction<number>) => { const i = s.inventory.find(i => i.id === a.payload); if (i) i.stock += 5; } } });
const store35 = configureStore({ reducer: slice35.reducer });
type RS35 = ReturnType<typeof store35.getState>;
// Shared selectors — defined once, used by multiple components
const selectAvailable35 = (s: RS35) => s.inventory.filter(i => i.stock > 0);
const selectOutOfStock35 = (s: RS35) => s.inventory.filter(i => i.stock === 0);
function AvailablePanel35() { const items = useSelector(selectAvailable35); const d = useDispatch(); return <div style={{ border: "1px solid #4caf50", padding: 4 }}><strong>In Stock ({items.length})</strong><ul>{items.map(i => <li key={i.id}>{i.name} ({i.stock}) <button onClick={() => d(slice35.actions.sell(i.id))}>Sell</button></li>)}</ul></div>; }
function OutOfStockPanel35() { const items = useSelector(selectOutOfStock35); const d = useDispatch(); return <div style={{ border: "1px solid #f44336", padding: 4 }}><strong>Out of Stock ({items.length})</strong><ul>{items.map(i => <li key={i.id}>{i.name} <button onClick={() => d(slice35.actions.restock(i.id))}>Restock</button></li>)}</ul></div>; }
function Ex35_Name() { return <Provider store={store35}><div style={{ display: "flex", gap: 8 }}><AvailablePanel35 /><OutOfStockPanel35 /></div></Provider>; }

// 36. Component subscribes to specific slice of array
const slice36 = createSlice({ name: "ex36", initialState: { messages: [] as { id: number; channel: string; text: string; time: string }[], activeChannel: "general", nextId: 1 }, reducers: { send: (s, a: PayloadAction<{ text: string }>) => { s.messages.push({ id: s.nextId++, channel: s.activeChannel, text: a.payload.text, time: new Date().toLocaleTimeString() }); }, setChannel: (s, a: PayloadAction<string>) => { s.activeChannel = a.payload; } } });
const store36 = configureStore({ reducer: slice36.reducer });
type RS36 = ReturnType<typeof store36.getState>;
function Ex36_Name() { return <Provider store={store36}><Ex36_Inner /></Provider>; }
function Ex36_Inner() {
  const activeChannel = useSelector((s: RS36) => s.activeChannel);
  // Only re-renders when messages in the active channel change
  const channelMessages = useSelector((s: RS36) => s.messages.filter(m => m.channel === activeChannel));
  const d = useDispatch();
  const [v, setV] = useState("");
  const channels = ["general", "random", "help"];
  return <div><div style={{ display: "flex", gap: 4 }}>{channels.map(c => <button key={c} onClick={() => d(slice36.actions.setChannel(c))} style={{ fontWeight: c === activeChannel ? "bold" : "normal" }}>#{c}</button>)}</div><ul style={{ maxHeight: 100, overflowY: "auto", fontSize: 12 }}>{channelMessages.map(m => <li key={m.id}>{m.time} {m.text}</li>)}</ul><input value={v} onChange={e => setV(e.target.value)} /><button onClick={() => { if (v) { d(slice36.actions.send({ text: v })); setV(""); } }}>Send to #{activeChannel}</button></div>;
}

// 37. Connected search with results
const slice37 = createSlice({ name: "ex37", initialState: { query: "", results: [] as { id: number; title: string; type: string }[], searching: false, searched: false }, reducers: { setQuery: (s, a: PayloadAction<string>) => { s.query = a.payload; }, startSearch: s => { s.searching = true; s.searched = false; }, setResults: (s, a: PayloadAction<typeof s.results>) => { s.results = a.payload; s.searching = false; s.searched = true; } } });
const store37 = configureStore({ reducer: slice37.reducer });
const db37 = [{ id: 1, title: "Redux Basics", type: "article" }, { id: 2, title: "React Hooks", type: "article" }, { id: 3, title: "TypeScript Guide", type: "guide" }, { id: 4, title: "Redux Toolkit", type: "guide" }, { id: 5, title: "State Management", type: "video" }];
function Ex37_Name() { return <Provider store={store37}><Ex37_Inner /></Provider>; }
function Ex37_Inner() {
  const { query, results, searching, searched } = useSelector((s: ReturnType<typeof store37.getState>) => s);
  const d = useDispatch();
  const handleSearch = () => {
    d(slice37.actions.startSearch());
    setTimeout(() => d(slice37.actions.setResults(db37.filter(r => r.title.toLowerCase().includes(query.toLowerCase())))), 600);
  };
  return <div><div style={{ display: "flex", gap: 4 }}><input value={query} onChange={e => d(slice37.actions.setQuery(e.target.value))} onKeyDown={e => e.key === "Enter" && handleSearch()} placeholder="Search..." /><button onClick={handleSearch} disabled={searching}>{searching ? "..." : "Search"}</button></div>{searching && <p>Searching...</p>}{searched && <p style={{ fontSize: 11 }}>{results.length} results for "{query}"</p>}<ul>{results.map(r => <li key={r.id}>[{r.type}] {r.title}</li>)}</ul></div>;
}

// ─── ADVANCED 38–50 ─────────────────────────────────────────────────────────────

// 38. createSelector (memoized selector)
const slice38 = createSlice({ name: "ex38", initialState: { orders: [{ id: 1, product: "A", qty: 3, price: 20, status: "pending" }, { id: 2, product: "B", qty: 1, price: 50, status: "shipped" }, { id: 3, product: "C", qty: 2, price: 15, status: "pending" }], filter: "all" }, reducers: { setFilter: (s, a: PayloadAction<string>) => { s.filter = a.payload; }, addOrder: (s) => { s.orders.push({ id: s.orders.length + 1, product: "D", qty: 1, price: 30, status: "pending" }); } } });
const store38 = configureStore({ reducer: slice38.reducer });
type RS38 = ReturnType<typeof store38.getState>;
// Manual memoized selector (createSelector equivalent using useMemo)
function Ex38_Name() { return <Provider store={store38}><Ex38_Inner /></Provider>; }
function Ex38_Inner() {
  const { orders, filter } = useSelector((s: RS38) => s);
  const d = useDispatch();
  const renderCount = useRef(0); renderCount.current++;
  // useMemo acts like createSelector — only recomputes when deps change
  const { filtered, total } = useMemo(() => {
    const filtered = orders.filter(o => filter === "all" || o.status === filter);
    const total = filtered.reduce((s, o) => s + o.qty * o.price, 0);
    return { filtered, total };
  }, [orders, filter]);
  return <div><div>{["all", "pending", "shipped"].map(f => <button key={f} onClick={() => d(slice38.actions.setFilter(f))} style={{ fontWeight: filter === f ? "bold" : "normal" }}>{f}</button>)}</div><ul>{filtered.map(o => <li key={o.id}>{o.product} ×{o.qty} @ ${o.price} [{o.status}]</li>)}</ul><p>Total: ${total} | Renders: {renderCount.current}</p><button onClick={() => d(slice38.actions.addOrder())}>Add Order</button></div>;
}

// 39. reselect-like pattern with useMemo
const slice39 = createSlice({ name: "ex39", initialState: { students: Array.from({ length: 8 }, (_, i) => ({ id: i + 1, name: `Student ${i + 1}`, grade: Math.floor(Math.random() * 40) + 60, subject: i % 2 === 0 ? "Math" : "Science" })), selectedSubject: "all" }, reducers: { setSubject: (s, a: PayloadAction<string>) => { s.selectedSubject = a.payload; }, updateGrade: (s, a: PayloadAction<{ id: number; grade: number }>) => { const s2 = s.students.find(s => s.id === a.payload.id); if (s2) s2.grade = a.payload.grade; } } });
const store39 = configureStore({ reducer: slice39.reducer });
type RS39 = ReturnType<typeof store39.getState>;
function Ex39_Name() { return <Provider store={store39}><Ex39_Inner /></Provider>; }
function Ex39_Inner() {
  const students = useSelector((s: RS39) => s.students);
  const selectedSubject = useSelector((s: RS39) => s.selectedSubject);
  const d = useDispatch();
  // Reselect-like: two derived computations chained
  const filtered = useMemo(() => students.filter(s => selectedSubject === "all" || s.subject === selectedSubject), [students, selectedSubject]);
  const stats = useMemo(() => {
    if (!filtered.length) return { avg: 0, highest: 0, lowest: 0 };
    const grades = filtered.map(s => s.grade);
    return { avg: grades.reduce((a, b) => a + b, 0) / grades.length, highest: Math.max(...grades), lowest: Math.min(...grades) };
  }, [filtered]);
  return <div><select value={selectedSubject} onChange={e => d(slice39.actions.setSubject(e.target.value))}><option value="all">All</option><option>Math</option><option>Science</option></select><p>Avg: {stats.avg.toFixed(1)} | High: {stats.highest} | Low: {stats.lowest}</p><ul>{filtered.map(s => <li key={s.id}>{s.name} ({s.subject}): {s.grade} <button onClick={() => d(slice39.actions.updateGrade({ id: s.id, grade: s.grade + 5 }))}>+5</button></li>)}</ul></div>;
}

// 40. Selector factories
const slice40 = createSlice({ name: "ex40", initialState: { tasks: [{ id: 1, name: "Write tests", priority: "high", done: false }, { id: 2, name: "Review PR", priority: "medium", done: true }, { id: 3, name: "Deploy", priority: "high", done: false }, { id: 4, name: "Docs", priority: "low", done: false }] }, reducers: { toggle: (s, a: PayloadAction<number>) => { const t = s.tasks.find(t => t.id === a.payload); if (t) t.done = !t.done; } } });
const store40 = configureStore({ reducer: slice40.reducer });
type RS40 = ReturnType<typeof store40.getState>;
// Selector factory — returns a new selector for a given priority
const makeSelectByPriority40 = (priority: string) => (s: RS40) => s.tasks.filter(t => priority === "all" || t.priority === priority);
function TaskList40({ priority }: { priority: string }) {
  const tasks = useSelector(makeSelectByPriority40(priority));
  const d = useDispatch();
  return <div style={{ border: "1px solid #ccc", padding: 4, flex: 1 }}><strong>{priority}</strong><ul>{tasks.map(t => <li key={t.id} style={{ textDecoration: t.done ? "line-through" : "none", cursor: "pointer" }} onClick={() => d(slice40.actions.toggle(t.id))}>{t.name}</li>)}</ul></div>;
}
function Ex40_Name() { return <Provider store={store40}><div style={{ display: "flex", gap: 4 }}><TaskList40 priority="high" /><TaskList40 priority="medium" /><TaskList40 priority="low" /></div></Provider>; }

// 41. useSelector performance (reference equality)
const slice41 = createSlice({ name: "ex41", initialState: { items: ["alpha", "beta", "gamma"], noise: 0 }, reducers: { tickNoise: s => { s.noise++; }, addItem: (s, a: PayloadAction<string>) => { s.items.push(a.payload); } } });
const store41 = configureStore({ reducer: slice41.reducer });
type RS41 = ReturnType<typeof store41.getState>;
function ChildA41() {
  const renders = useRef(0); renders.current++;
  // Returns new array every time → always re-renders (bad)
  const items = useSelector((s: RS41) => [...s.items]);
  return <div style={{ border: "1px solid red", padding: 4 }}>ComponentA (new ref): {items.length} items | renders: {renders.current}</div>;
}
function ChildB41() {
  const renders = useRef(0); renders.current++;
  // Returns same reference if unchanged → only re-renders when items change (good)
  const items = useSelector((s: RS41) => s.items);
  return <div style={{ border: "1px solid green", padding: 4 }}>ComponentB (stable ref): {items.length} items | renders: {renders.current}</div>;
}
function Ex41_Name() { return <Provider store={store41}><ChildA41 /><ChildB41 /><button onClick={() => store41.dispatch(slice41.actions.tickNoise())}>Tick Noise (no item change)</button><button onClick={() => store41.dispatch(slice41.actions.addItem(`item${Date.now() % 100}`))}>Add Item</button></Provider>; }

// 42. Batch updates with unstable_batchedUpdates
const slice42 = createSlice({ name: "ex42", initialState: { x: 0, y: 0, z: 0, renderCount: 0 }, reducers: { setX: (s, a: PayloadAction<number>) => { s.x = a.payload; }, setY: (s, a: PayloadAction<number>) => { s.y = a.payload; }, setZ: (s, a: PayloadAction<number>) => { s.z = a.payload; } } });
const store42 = configureStore({ reducer: slice42.reducer });
function Ex42_Name() { return <Provider store={store42}><Ex42_Inner /></Provider>; }
function Ex42_Inner() {
  const state = useSelector((s: ReturnType<typeof store42.getState>) => s);
  const d = useDispatch();
  const renders = useRef(0); renders.current++;
  // In React 18, all dispatches are automatically batched in event handlers
  const updateAll = () => {
    d(slice42.actions.setX(Math.random() * 100 | 0));
    d(slice42.actions.setY(Math.random() * 100 | 0));
    d(slice42.actions.setZ(Math.random() * 100 | 0));
  };
  return <div><p>x:{state.x} y:{state.y} z:{state.z}</p><p style={{ fontSize: 11 }}>Renders: {renders.current} (React 18 auto-batches all 3 dispatches)</p><button onClick={updateAll}>Update All 3</button></div>;
}

// 43. Connected modal system
const slice43 = createSlice({ name: "ex43", initialState: { modals: {} as Record<string, { open: boolean; props?: Record<string, unknown> }> }, reducers: { openModal: (s, a: PayloadAction<{ id: string; props?: Record<string, unknown> }>) => { s.modals[a.payload.id] = { open: true, props: a.payload.props }; }, closeModal: (s, a: PayloadAction<string>) => { if (s.modals[a.payload]) s.modals[a.payload].open = false; } } });
const store43 = configureStore({ reducer: slice43.reducer });
type RS43 = ReturnType<typeof store43.getState>;
function Modal43({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  const isOpen = useSelector((s: RS43) => s.modals[id]?.open ?? false);
  const d = useDispatch();
  if (!isOpen) return null;
  return <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}><div style={{ background: "#fff", padding: 16, borderRadius: 4, minWidth: 200 }}><h3>{title}</h3>{children}<button onClick={() => d(slice43.actions.closeModal(id))}>Close</button></div></div>;
}
function Ex43_Name() { return <Provider store={store43}><Ex43_Inner /></Provider>; }
function Ex43_Inner() {
  const d = useDispatch();
  return <div><button onClick={() => d(slice43.actions.openModal({ id: "confirm", props: { message: "Are you sure?" } }))}>Open Confirm Modal</button><button onClick={() => d(slice43.actions.openModal({ id: "info" }))}>Open Info Modal</button><Modal43 id="confirm" title="Confirm"><p>Are you sure you want to proceed?</p></Modal43><Modal43 id="info" title="Information"><p>Redux-connected modal system!</p></Modal43></div>;
}

// 44. Connected toast/notification system
const slice44 = createSlice({ name: "ex44", initialState: { toasts: [] as { id: number; message: string; type: "success" | "error" | "info"; }[], nextId: 1 }, reducers: { addToast: (s, a: PayloadAction<{ message: string; type: "success" | "error" | "info" }>) => { s.toasts.push({ id: s.nextId++, ...a.payload }); }, removeToast: (s, a: PayloadAction<number>) => { s.toasts = s.toasts.filter(t => t.id !== a.payload); } } });
const store44 = configureStore({ reducer: slice44.reducer });
const toastColors44: Record<string, string> = { success: "#4caf50", error: "#f44336", info: "#2196f3" };
type RS44 = ReturnType<typeof store44.getState>;
function ToastContainer44() {
  const toasts = useSelector((s: RS44) => s.toasts);
  const d = useDispatch();
  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => d(slice44.actions.removeToast(toasts[0].id)), 3000);
      return () => clearTimeout(timer);
    }
  }, [toasts, d]);
  return <div style={{ position: "fixed", bottom: 16, right: 16 }}>{toasts.map(t => <div key={t.id} style={{ background: toastColors44[t.type], color: "#fff", padding: "8px 16px", borderRadius: 4, marginTop: 4, display: "flex", gap: 8 }}>{t.message}<span onClick={() => d(slice44.actions.removeToast(t.id))} style={{ cursor: "pointer" }}>×</span></div>)}</div>;
}
function Ex44_Name() { return <Provider store={store44}><Ex44_Inner /></Provider>; }
function Ex44_Inner() {
  const d = useDispatch();
  return <div><div style={{ display: "flex", gap: 4 }}>{(["success", "error", "info"] as const).map(t => <button key={t} onClick={() => d(slice44.actions.addToast({ message: `${t} toast!`, type: t }))}>{t}</button>)}</div><ToastContainer44 /></div>;
}

// 45. Connected theme system
const slice45 = createSlice({ name: "ex45", initialState: { theme: "light" as "light" | "dark" | "blue", fontSize: 14, fontFamily: "sans-serif" }, reducers: { setTheme: (s, a: PayloadAction<"light" | "dark" | "blue">) => { s.theme = a.payload; }, setFontSize: (s, a: PayloadAction<number>) => { s.fontSize = a.payload; } } });
const store45 = configureStore({ reducer: slice45.reducer });
const themes45 = { light: { bg: "#fff", text: "#333", border: "#ccc" }, dark: { bg: "#1a1a2e", text: "#eee", border: "#444" }, blue: { bg: "#e3f2fd", text: "#0d47a1", border: "#90caf9" } };
type RS45 = ReturnType<typeof store45.getState>;
function ThemedCard45({ title, body }: { title: string; body: string }) {
  const { theme, fontSize, fontFamily } = useSelector((s: RS45) => s);
  const colors = themes45[theme];
  return <div style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, padding: 12, borderRadius: 4, fontSize, fontFamily }}><h4 style={{ margin: "0 0 4px" }}>{title}</h4><p style={{ margin: 0 }}>{body}</p></div>;
}
function Ex45_Name() { return <Provider store={store45}><Ex45_Inner /></Provider>; }
function Ex45_Inner() {
  const { theme, fontSize } = useSelector((s: RS45) => s);
  const d = useDispatch();
  return <div><div style={{ display: "flex", gap: 4, marginBottom: 8 }}>{(["light", "dark", "blue"] as const).map(t => <button key={t} onClick={() => d(slice45.actions.setTheme(t))} style={{ fontWeight: theme === t ? "bold" : "normal" }}>{t}</button>)}<button onClick={() => d(slice45.actions.setFontSize(fontSize + 1))}>A+</button><button onClick={() => d(slice45.actions.setFontSize(fontSize - 1))}>A-</button></div><ThemedCard45 title="Redux Theme System" body="This card is styled from the Redux store!" /><ThemedCard45 title="Another Card" body="All cards share the same theme state." /></div>;
}

// 46. Connected auth guard (show/hide based on store)
const slice46 = createSlice({ name: "ex46", initialState: { user: null as { name: string; role: "admin" | "user" } | null }, reducers: { login: (s, a: PayloadAction<{ name: string; role: "admin" | "user" }>) => { s.user = a.payload; }, logout: s => { s.user = null; } } });
const store46 = configureStore({ reducer: slice46.reducer });
type RS46 = ReturnType<typeof store46.getState>;
function AuthGuard46({ requiredRole, children }: { requiredRole?: "admin" | "user"; children: React.ReactNode }) {
  const user = useSelector((s: RS46) => s.user);
  if (!user) return <p style={{ color: "red" }}>Please log in to view this content.</p>;
  if (requiredRole === "admin" && user.role !== "admin") return <p style={{ color: "orange" }}>Admin access required.</p>;
  return <>{children}</>;
}
function Ex46_Name() { return <Provider store={store46}><Ex46_Inner /></Provider>; }
function Ex46_Inner() {
  const user = useSelector((s: RS46) => s.user);
  const d = useDispatch();
  return <div><div><button onClick={() => d(slice46.actions.login({ name: "Alice", role: "user" }))}>Login as User</button><button onClick={() => d(slice46.actions.login({ name: "Bob", role: "admin" }))}>Login as Admin</button><button onClick={() => d(slice46.actions.logout())}>Logout</button>{user && <span> ({user.name})</span>}</div><AuthGuard46><div style={{ background: "#c8e6c9", padding: 4 }}>User content (requires login)</div></AuthGuard46><AuthGuard46 requiredRole="admin"><div style={{ background: "#bbdefb", padding: 4 }}>Admin panel (requires admin role)</div></AuthGuard46></div>;
}

// 47. Connected data table (full CRUD)
interface Row47 { id: number; name: string; email: string; status: string; }
const adapter47 = createEntityAdapter<Row47>();
const slice47 = createSlice({ name: "ex47", initialState: adapter47.getInitialState({ editing: null as number | null }), reducers: { addRow: adapter47.addOne, updateRow: adapter47.updateOne, removeRow: adapter47.removeOne, setEditing: (s, a: PayloadAction<number | null>) => { s.editing = a.payload; } } });
const store47 = configureStore({ reducer: slice47.reducer });
type RS47 = ReturnType<typeof store47.getState>;
const sel47 = adapter47.getSelectors((s: RS47) => s);
function Ex47_Name() { return <Provider store={store47}><Ex47_Inner /></Provider>; }
function Ex47_Inner() {
  const rows = useSelector(sel47.selectAll);
  const { editing } = useSelector((s: RS47) => ({ editing: s.editing }));
  const d = useDispatch();
  const [nextId, setNextId] = useState(1);
  const [editData, setEditData] = useState<Partial<Row47>>({});
  useEffect(() => { d(slice47.actions.addRow({ id: nextId, name: "Alice", email: "alice@ex.com", status: "active" })); setNextId(2); }, []);
  return <div><button onClick={() => { d(slice47.actions.addRow({ id: nextId, name: `User${nextId}`, email: `user${nextId}@ex.com`, status: "active" })); setNextId(n => n + 1); }}>Add Row</button><table><thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map(r => editing === r.id ? <tr key={r.id}><td><input value={editData.name ?? r.name} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))} /></td><td><input value={editData.email ?? r.email} onChange={e => setEditData(p => ({ ...p, email: e.target.value }))} /></td><td>{r.status}</td><td><button onClick={() => { d(slice47.actions.updateRow({ id: r.id, changes: editData })); d(slice47.actions.setEditing(null)); setEditData({}); }}>Save</button><button onClick={() => d(slice47.actions.setEditing(null))}>Cancel</button></td></tr> : <tr key={r.id}><td>{r.name}</td><td>{r.email}</td><td>{r.status}</td><td><button onClick={() => d(slice47.actions.setEditing(r.id))}>Edit</button><button onClick={() => d(slice47.actions.removeRow(r.id))}>Del</button></td></tr>)}</tbody></table></div>;
}

// 48. Real-time store updates (simulated WebSocket)
const slice48 = createSlice({ name: "ex48", initialState: { connected: false, messages: [] as { id: number; user: string; text: string; time: string }[], onlineUsers: [] as string[], nextId: 1 }, reducers: { connect: s => { s.connected = true; }, disconnect: s => { s.connected = false; s.onlineUsers = []; }, receiveMessage: (s, a: PayloadAction<{ user: string; text: string }>) => { s.messages.unshift({ id: s.nextId++, ...a.payload, time: new Date().toLocaleTimeString() }); if (s.messages.length > 8) s.messages.pop(); }, setOnlineUsers: (s, a: PayloadAction<string[]>) => { s.onlineUsers = a.payload; } } });
const store48 = configureStore({ reducer: slice48.reducer });
const users48 = ["Alice", "Bob", "Carol", "Dave"];
const msgs48 = ["Hello!", "How's it going?", "Just updated the PR", "LGTM!", "Deploying now..."];
function Ex48_Name() { return <Provider store={store48}><Ex48_Inner /></Provider>; }
function Ex48_Inner() {
  const { connected, messages, onlineUsers } = useSelector((s: ReturnType<typeof store48.getState>) => s);
  const d = useDispatch();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const startWS = () => {
    d(slice48.actions.connect());
    d(slice48.actions.setOnlineUsers(users48.slice(0, 2)));
    intervalRef.current = setInterval(() => {
      d(slice48.actions.receiveMessage({ user: users48[Math.floor(Math.random() * users48.length)], text: msgs48[Math.floor(Math.random() * msgs48.length)] }));
    }, 1500);
  };
  const stopWS = () => { clearInterval(intervalRef.current); d(slice48.actions.disconnect()); };
  useEffect(() => () => clearInterval(intervalRef.current), []);
  return <div><div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: connected ? "green" : "gray" }}>● {connected ? "Connected" : "Disconnected"}</span><span style={{ fontSize: 11 }}>Online: {onlineUsers.join(", ") || "none"}</span></div><div><button onClick={startWS} disabled={connected}>Connect</button><button onClick={stopWS} disabled={!connected}>Disconnect</button></div><ul style={{ maxHeight: 120, overflowY: "auto", fontSize: 12 }}>{messages.map(m => <li key={m.id}><strong>{m.user}</strong>: {m.text} <span style={{ fontSize: 10, color: "#999" }}>{m.time}</span></li>)}</ul></div>;
}

// 49. Store persistence (localStorage sync)
const loadState49 = (): { count: number; notes: string[] } => { try { const s = localStorage.getItem("ex49_state"); return s ? JSON.parse(s) : { count: 0, notes: [] }; } catch { return { count: 0, notes: [] }; } };
const slice49 = createSlice({ name: "ex49", initialState: loadState49(), reducers: { increment: s => { s.count++; }, addNote: (s, a: PayloadAction<string>) => { s.notes.push(a.payload); }, clear: () => ({ count: 0, notes: [] }) } });
const store49 = configureStore({ reducer: slice49.reducer });
store49.subscribe(() => { try { localStorage.setItem("ex49_state", JSON.stringify(store49.getState())); } catch {} });
function Ex49_Name() { return <Provider store={store49}><Ex49_Inner /></Provider>; }
function Ex49_Inner() {
  const { count, notes } = useSelector((s: ReturnType<typeof store49.getState>) => s);
  const d = useDispatch();
  const [v, setV] = useState("");
  return <div><p>Count: {count} (persisted in localStorage)</p><button onClick={() => d(slice49.actions.increment())}>+1</button><div><input value={v} onChange={e => setV(e.target.value)} /><button onClick={() => { if (v) { d(slice49.actions.addNote(v)); setV(""); } }}>Add Note</button></div><ul>{notes.map((n, i) => <li key={i}>{n}</li>)}</ul><button onClick={() => { d(slice49.actions.clear()); localStorage.removeItem("ex49_state"); }}>Clear All</button><p style={{ fontSize: 11 }}>State persists across page refreshes</p></div>;
}

// 50. Full connected app (navbar + sidebar + content + modals all from store)
const appSlice50 = createSlice({ name: "ex50", initialState: { nav: { currentPage: "home", sidebarOpen: true }, user: null as { name: string } | null, modal: { open: false, type: "" as string }, content: { pages: { home: "Welcome to the app!", about: "About this app.", contact: "Contact us here." } as Record<string, string> }, theme: "light" as "light" | "dark" }, reducers: { navigate: (s, a: PayloadAction<string>) => { s.nav.currentPage = a.payload; }, toggleSidebar: s => { s.nav.sidebarOpen = !s.nav.sidebarOpen; }, login: (s, a: PayloadAction<string>) => { s.user = { name: a.payload }; }, logout: s => { s.user = null; }, openModal: (s, a: PayloadAction<string>) => { s.modal = { open: true, type: a.payload }; }, closeModal: s => { s.modal.open = false; }, toggleTheme: s => { s.theme = s.theme === "light" ? "dark" : "light"; } } });
const store50 = configureStore({ reducer: appSlice50.reducer });
type RS50 = ReturnType<typeof store50.getState>;
function Ex50_Name() { return <Provider store={store50}><Ex50_App /></Provider>; }
function Ex50_App() {
  const { nav, user, modal, content, theme } = useSelector((s: RS50) => s);
  const d = useDispatch();
  const bg = theme === "dark" ? "#1a1a2e" : "#f5f5f5";
  const fg = theme === "dark" ? "#eee" : "#333";
  return <div style={{ background: bg, color: fg, fontFamily: "sans-serif" }}><div style={{ background: theme === "dark" ? "#333" : "#3f51b5", color: "#fff", padding: "8px 12px", display: "flex", justifyContent: "space-between" }}><div><button onClick={() => d(appSlice50.actions.toggleSidebar())} style={{ background: "transparent", color: "#fff", border: "none" }}>☰</button> <strong>My App</strong></div><div style={{ fontSize: 12 }}>{user ? <><span>{user.name}</span><button onClick={() => d(appSlice50.actions.logout())} style={{ background: "transparent", color: "#fff", border: "1px solid #fff", marginLeft: 8 }}>Logout</button></> : <button onClick={() => d(appSlice50.actions.login("Alice"))} style={{ background: "transparent", color: "#fff", border: "1px solid #fff" }}>Login</button>}<button onClick={() => d(appSlice50.actions.toggleTheme())} style={{ background: "transparent", color: "#fff", border: "none", marginLeft: 8 }}>{theme === "dark" ? "☀" : "🌙"}</button></div></div><div style={{ display: "flex" }}>{nav.sidebarOpen && <div style={{ width: 100, borderRight: "1px solid #ccc", padding: 8 }}>{Object.keys(content.pages).map(p => <div key={p} onClick={() => d(appSlice50.actions.navigate(p))} style={{ padding: 4, cursor: "pointer", fontWeight: nav.currentPage === p ? "bold" : "normal" }}>{p}</div>)}<div onClick={() => d(appSlice50.actions.openModal("settings"))} style={{ padding: 4, cursor: "pointer" }}>Settings</div></div>}<div style={{ flex: 1, padding: 12 }}>{user ? <p>{content.pages[nav.currentPage]}</p> : <p style={{ color: "#999" }}>Please login to view content.</p>}</div></div>{modal.open && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ background: "#fff", color: "#333", padding: 16, borderRadius: 4 }}><h3>{modal.type}</h3><p>Modal content for {modal.type}</p><button onClick={() => d(appSlice50.actions.closeModal())}>Close</button></div></div>}</div>;
}

// ─── EXPORT ────────────────────────────────────────────────────────────────────

export default function ReactReduxExamples() {
  const sections = [
    { label: "BASIC", examples: [{ n: "01", C: Ex01_Name, title: "useSelector basic" }, { n: "02", C: Ex02_Name, title: "useDispatch basic" }, { n: "03", C: Ex03_Name, title: "Provider setup" }, { n: "04", C: Ex04_Name, title: "Select primitive" }, { n: "05", C: Ex05_Name, title: "Select object" }, { n: "06", C: Ex06_Name, title: "Select array" }, { n: "07", C: Ex07_Name, title: "Derived selector" }, { n: "08", C: Ex08_Name, title: "Dispatch on click" }, { n: "09", C: Ex09_Name, title: "Dispatch on input" }, { n: "10", C: Ex10_Name, title: "Read + write store" }, { n: "11", C: Ex11_Name, title: "Multiple useSelector" }, { n: "12", C: Ex12_Name, title: "Selector with arg" }] },
    { label: "INTERMEDIATE", examples: [{ n: "13", C: Ex13_Name, title: "shallowEqual" }, { n: "14", C: Ex14_Name, title: "Selector composition" }, { n: "15", C: Ex15_Name, title: "Child useDispatch" }, { n: "16", C: Ex16_Name, title: "Container/presentational" }, { n: "17", C: Ex17_Name, title: "Custom hooks" }, { n: "18", C: Ex18_Name, title: "Filtered list" }, { n: "19", C: Ex19_Name, title: "Sorted list" }, { n: "20", C: Ex20_Name, title: "Pagination selector" }, { n: "21", C: Ex21_Name, title: "Conditional render" }, { n: "22", C: Ex22_Name, title: "Redux-controlled form" }, { n: "23", C: Ex23_Name, title: "Optimistic UI" }, { n: "24", C: Ex24_Name, title: "Component reset" }, { n: "25", C: Ex25_Name, title: "Shared store slice" }] },
    { label: "NESTED", examples: [{ n: "26", C: Ex26_Name, title: "Deep selector" }, { n: "27", C: Ex27_Name, title: "Denormalize" }, { n: "28", C: Ex28_Name, title: "Full component tree" }, { n: "29", C: Ex29_Name, title: "Parent→child props" }, { n: "30", C: Ex30_Name, title: "Sibling components" }, { n: "31", C: Ex31_Name, title: "Master/detail" }, { n: "32", C: Ex32_Name, title: "Form + validation" }, { n: "33", C: Ex33_Name, title: "Connected data table" }, { n: "34", C: Ex34_Name, title: "Multi-slice component" }, { n: "35", C: Ex35_Name, title: "Shared selectors" }, { n: "36", C: Ex36_Name, title: "Array slice subscription" }, { n: "37", C: Ex37_Name, title: "Connected search" }] },
    { label: "ADVANCED", examples: [{ n: "38", C: Ex38_Name, title: "createSelector (useMemo)" }, { n: "39", C: Ex39_Name, title: "Reselect-like chaining" }, { n: "40", C: Ex40_Name, title: "Selector factories" }, { n: "41", C: Ex41_Name, title: "Reference equality perf" }, { n: "42", C: Ex42_Name, title: "Auto-batching (React 18)" }, { n: "43", C: Ex43_Name, title: "Modal system" }, { n: "44", C: Ex44_Name, title: "Toast system" }, { n: "45", C: Ex45_Name, title: "Theme system" }, { n: "46", C: Ex46_Name, title: "Auth guard" }, { n: "47", C: Ex47_Name, title: "Full CRUD table" }, { n: "48", C: Ex48_Name, title: "Real-time WebSocket sim" }, { n: "49", C: Ex49_Name, title: "localStorage persistence" }, { n: "50", C: Ex50_Name, title: "Full connected app" }] },
  ];
  return (
    <div style={{ fontFamily: "sans-serif", padding: 16 }}>
      <h1>React-Redux Connect — 50 Examples</h1>
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
