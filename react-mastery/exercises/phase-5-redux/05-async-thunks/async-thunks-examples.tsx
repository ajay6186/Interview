import React, { useState, useEffect, useRef } from "react";
import {
  configureStore,
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
  PayloadAction,
} from "@reduxjs/toolkit";
import { Provider, useSelector, useDispatch } from "react-redux";

// ─── HELPERS ───────────────────────────────────────────────────────────────────
const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
const fakeApi = {
  getUser: (id: number) => delay(600).then(() => ({ id, name: `User${id}`, email: `user${id}@ex.com` })),
  getList: (page: number) => delay(700).then(() => Array.from({ length: 5 }, (_, i) => ({ id: page * 5 + i + 1, title: `Item ${page * 5 + i + 1}` }))),
  create: (title: string) => delay(500).then(() => ({ id: Date.now(), title, createdAt: new Date().toISOString() })),
  remove: (id: number) => delay(400).then(() => ({ id })),
  update: (id: number, data: Record<string, unknown>) => delay(500).then(() => ({ id, ...data })),
  search: (q: string) => delay(600).then(() => ["Apple", "Banana", "Cherry", "Date"].filter(f => f.toLowerCase().includes(q.toLowerCase()))),
};
const shouldFail = (pct = 30) => Math.random() * 100 < pct;

// ─── BASIC 1–12 ────────────────────────────────────────────────────────────────

// 1. createAsyncThunk basic
const fetchData01 = createAsyncThunk("ex01/fetchData", async () => { await delay(800); return "Data loaded!"; });
const slice01 = createSlice({ name: "ex01", initialState: { data: "", status: "idle" }, reducers: {}, extraReducers: b => b.addCase(fetchData01.pending, s => { s.status = "loading"; }).addCase(fetchData01.fulfilled, (s, a) => { s.data = a.payload; s.status = "done"; }).addCase(fetchData01.rejected, s => { s.status = "error"; }) });
const store01 = configureStore({ reducer: slice01.reducer });
function Ex01_Name() { return <Provider store={store01}><Ex01_Inner /></Provider>; }
function Ex01_Inner() {
  const { data, status } = useSelector((s: ReturnType<typeof store01.getState>) => s);
  const d = useDispatch();
  return <div><p>Status: {status} | Data: {data || "none"}</p><button onClick={() => d(fetchData01())} disabled={status === "loading"}>{status === "loading" ? "Loading..." : "Fetch"}</button></div>;
}

// 2. Thunk with loading state
const fetchUser02 = createAsyncThunk("ex02/fetchUser", async (id: number) => fakeApi.getUser(id));
const slice02 = createSlice({ name: "ex02", initialState: { user: null as { id: number; name: string; email: string } | null, loading: false }, reducers: {}, extraReducers: b => b.addCase(fetchUser02.pending, s => { s.loading = true; }).addCase(fetchUser02.fulfilled, (s, a) => { s.user = a.payload; s.loading = false; }) });
const store02 = configureStore({ reducer: slice02.reducer });
function Ex02_Name() { return <Provider store={store02}><Ex02_Inner /></Provider>; }
function Ex02_Inner() {
  const { user, loading } = useSelector((s: ReturnType<typeof store02.getState>) => s);
  const d = useDispatch();
  return <div>{loading ? <p>Loading spinner...</p> : user ? <p>{user.name} — {user.email}</p> : <p>No user loaded</p>}<div>{[1, 2, 3].map(id => <button key={id} onClick={() => d(fetchUser02(id))} disabled={loading}>Load User {id}</button>)}</div></div>;
}

// 3. Thunk with success state
const fetchSuccess03 = createAsyncThunk("ex03/fetch", async () => { await delay(600); return { items: ["Alpha", "Beta", "Gamma"], total: 3 }; });
const slice03 = createSlice({ name: "ex03", initialState: { items: [] as string[], total: 0, success: false, status: "idle" }, reducers: { reset: () => ({ items: [], total: 0, success: false, status: "idle" }) }, extraReducers: b => b.addCase(fetchSuccess03.pending, s => { s.status = "loading"; s.success = false; }).addCase(fetchSuccess03.fulfilled, (s, a) => { s.items = a.payload.items; s.total = a.payload.total; s.success = true; s.status = "done"; }) });
const store03 = configureStore({ reducer: slice03.reducer });
function Ex03_Name() { return <Provider store={store03}><Ex03_Inner /></Provider>; }
function Ex03_Inner() {
  const { items, total, success, status } = useSelector((s: ReturnType<typeof store03.getState>) => s);
  const d = useDispatch();
  return <div><p>Status: {status} {success && "✓"}</p>{success && <div><p>Loaded {total} items:</p><ul>{items.map(i => <li key={i}>{i}</li>)}</ul></div>}<button onClick={() => d(fetchSuccess03())} disabled={status === "loading"}>{status === "loading" ? "Loading..." : "Fetch"}</button><button onClick={() => d(slice03.actions.reset())}>Reset</button></div>;
}

// 4. Thunk with error state
const fetchMayFail04 = createAsyncThunk("ex04/fetch", async () => { await delay(700); if (shouldFail(50)) throw new Error("Random server error"); return "Loaded successfully!"; });
const slice04 = createSlice({ name: "ex04", initialState: { data: "", error: null as string | null, status: "idle" }, reducers: { reset: () => ({ data: "", error: null, status: "idle" }) }, extraReducers: b => b.addCase(fetchMayFail04.pending, s => { s.status = "loading"; s.error = null; }).addCase(fetchMayFail04.fulfilled, (s, a) => { s.data = a.payload; s.status = "success"; }).addCase(fetchMayFail04.rejected, (s, a) => { s.error = a.error.message ?? "Unknown error"; s.status = "error"; }) });
const store04 = configureStore({ reducer: slice04.reducer });
function Ex04_Name() { return <Provider store={store04}><Ex04_Inner /></Provider>; }
function Ex04_Inner() {
  const { data, error, status } = useSelector((s: ReturnType<typeof store04.getState>) => s);
  const d = useDispatch();
  return <div><p>Status: <strong style={{ color: status === "error" ? "red" : status === "success" ? "green" : "inherit" }}>{status}</strong></p>{data && <p>{data}</p>}{error && <p style={{ color: "red" }}>Error: {error}</p>}<button onClick={() => d(fetchMayFail04())} disabled={status === "loading"}>Fetch (50% fail)</button><button onClick={() => d(slice04.actions.reset())}>Reset</button></div>;
}

// 5. Dispatch thunk from button
const fetchOnClick05 = createAsyncThunk("ex05/fetch", async (label: string) => { await delay(500); return `${label} data at ${new Date().toLocaleTimeString()}`; });
const slice05 = createSlice({ name: "ex05", initialState: { results: [] as string[], loading: false }, reducers: {}, extraReducers: b => b.addCase(fetchOnClick05.pending, s => { s.loading = true; }).addCase(fetchOnClick05.fulfilled, (s, a) => { s.results.unshift(a.payload); if (s.results.length > 5) s.results.pop(); s.loading = false; }) });
const store05 = configureStore({ reducer: slice05.reducer });
function Ex05_Name() { return <Provider store={store05}><Ex05_Inner /></Provider>; }
function Ex05_Inner() {
  const { results, loading } = useSelector((s: ReturnType<typeof store05.getState>) => s);
  const d = useDispatch();
  return <div><div>{["Alpha", "Beta", "Gamma"].map(label => <button key={label} onClick={() => d(fetchOnClick05(label))} disabled={loading}>Fetch {label}</button>)}</div>{loading && <p>Fetching...</p>}<ul>{results.map((r, i) => <li key={i}>{r}</li>)}</ul></div>;
}

// 6. Thunk with payload
const fetchById06 = createAsyncThunk("ex06/fetchById", async (payload: { id: number; include: string[] }) => { await delay(500); return { id: payload.id, name: `Item ${payload.id}`, included: payload.include.join(", ") }; });
const slice06 = createSlice({ name: "ex06", initialState: { item: null as { id: number; name: string; included: string } | null, loading: false }, reducers: {}, extraReducers: b => b.addCase(fetchById06.pending, s => { s.loading = true; }).addCase(fetchById06.fulfilled, (s, a) => { s.item = a.payload; s.loading = false; }) });
const store06 = configureStore({ reducer: slice06.reducer });
function Ex06_Name() { return <Provider store={store06}><Ex06_Inner /></Provider>; }
function Ex06_Inner() {
  const { item, loading } = useSelector((s: ReturnType<typeof store06.getState>) => s);
  const d = useDispatch();
  const [id, setId] = useState(1);
  const [include, setInclude] = useState(["tags", "meta"]);
  return <div><div><label>ID: <input type="number" value={id} onChange={e => setId(Number(e.target.value))} style={{ width: 50 }} /></label><label> Include tags: <input type="checkbox" checked={include.includes("tags")} onChange={e => setInclude(prev => e.target.checked ? [...prev, "tags"] : prev.filter(i => i !== "tags"))} /></label></div><button onClick={() => d(fetchById06({ id, include }))} disabled={loading}>Fetch</button>{loading ? <p>Loading...</p> : item && <p>id:{item.id} name:{item.name} included:{item.included}</p>}</div>;
}

// 7. Thunk with fetch (simulated with setTimeout)
const fetchPosts07 = createAsyncThunk("ex07/fetchPosts", async () => { await delay(800); return [{ id: 1, title: "First Post", author: "Alice" }, { id: 2, title: "Second Post", author: "Bob" }, { id: 3, title: "Third Post", author: "Carol" }]; });
const slice07 = createSlice({ name: "ex07", initialState: { posts: [] as { id: number; title: string; author: string }[], status: "idle" as "idle" | "loading" | "done" | "error" }, reducers: {}, extraReducers: b => b.addCase(fetchPosts07.pending, s => { s.status = "loading"; }).addCase(fetchPosts07.fulfilled, (s, a) => { s.posts = a.payload; s.status = "done"; }).addCase(fetchPosts07.rejected, s => { s.status = "error"; }) });
const store07 = configureStore({ reducer: slice07.reducer });
function Ex07_Name() { return <Provider store={store07}><Ex07_Inner /></Provider>; }
function Ex07_Inner() {
  const { posts, status } = useSelector((s: ReturnType<typeof store07.getState>) => s);
  const d = useDispatch();
  useEffect(() => { d(fetchPosts07()); }, [d]);
  if (status === "loading") return <div>Loading posts...</div>;
  if (status === "error") return <div style={{ color: "red" }}>Failed to load posts</div>;
  return <div><ul>{posts.map(p => <li key={p.id}><strong>{p.title}</strong> by {p.author}</li>)}</ul><button onClick={() => d(fetchPosts07())}>Refresh</button></div>;
}

// 8. pending/fulfilled/rejected cases
const fetchAll08 = createAsyncThunk("ex08/fetchAll", async () => { await delay(700); if (shouldFail(40)) throw new Error("Server error"); return { data: "success data", count: 42 }; });
const slice08 = createSlice({ name: "ex08", initialState: { data: "", count: 0, loading: false, error: "", attempts: 0 }, reducers: {}, extraReducers: b => b
  .addCase(fetchAll08.pending, s => { s.loading = true; s.error = ""; s.attempts++; })
  .addCase(fetchAll08.fulfilled, (s, a) => { s.loading = false; s.data = a.payload.data; s.count = a.payload.count; })
  .addCase(fetchAll08.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? "Error"; })
});
const store08 = configureStore({ reducer: slice08.reducer });
function Ex08_Name() { return <Provider store={store08}><Ex08_Inner /></Provider>; }
function Ex08_Inner() {
  const state = useSelector((s: ReturnType<typeof store08.getState>) => s);
  const d = useDispatch();
  return <div><p>Attempts: {state.attempts} | Loading: {String(state.loading)}</p>{state.data && <p>✓ {state.data} (count: {state.count})</p>}{state.error && <p style={{ color: "red" }}>✗ {state.error}</p>}<button onClick={() => d(fetchAll08())} disabled={state.loading}>Fetch (40% fail)</button></div>;
}

// 9. Thunk with cleanup
const fetchWithCleanup09 = createAsyncThunk("ex09/fetch", async (_, { signal }) => {
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, 1500);
    signal.addEventListener("abort", () => { clearTimeout(timer); reject(new Error("Cancelled")); });
  });
  return "Operation complete!";
});
const slice09 = createSlice({ name: "ex09", initialState: { result: "", status: "idle" }, reducers: { reset: () => ({ result: "", status: "idle" }) }, extraReducers: b => b.addCase(fetchWithCleanup09.pending, s => { s.status = "running"; }).addCase(fetchWithCleanup09.fulfilled, (s, a) => { s.result = a.payload; s.status = "done"; }).addCase(fetchWithCleanup09.rejected, (s, a) => { s.status = a.error.name === "AbortError" ? "cancelled" : "error"; }) });
const store09 = configureStore({ reducer: slice09.reducer });
function Ex09_Name() { return <Provider store={store09}><Ex09_Inner /></Provider>; }
function Ex09_Inner() {
  const { result, status } = useSelector((s: ReturnType<typeof store09.getState>) => s);
  const d = useDispatch();
  const thunkRef = useRef<ReturnType<typeof fetchWithCleanup09> | null>(null);
  const start = () => { thunkRef.current = d(fetchWithCleanup09()); };
  const cancel = () => { thunkRef.current?.abort(); };
  return <div><p>Status: <strong>{status}</strong></p>{result && <p>{result}</p>}<div><button onClick={start} disabled={status === "running"}>Start (1.5s)</button><button onClick={cancel} disabled={status !== "running"}>Cancel</button><button onClick={() => d(slice09.actions.reset())}>Reset</button></div></div>;
}

// 10. Thunk with argument
const searchItems10 = createAsyncThunk("ex10/search", async (query: string) => fakeApi.search(query));
const slice10 = createSlice({ name: "ex10", initialState: { query: "", results: [] as string[], loading: false }, reducers: { setQuery: (s, a: PayloadAction<string>) => { s.query = a.payload; } }, extraReducers: b => b.addCase(searchItems10.pending, s => { s.loading = true; }).addCase(searchItems10.fulfilled, (s, a) => { s.results = a.payload; s.loading = false; }) });
const store10 = configureStore({ reducer: slice10.reducer });
function Ex10_Name() { return <Provider store={store10}><Ex10_Inner /></Provider>; }
function Ex10_Inner() {
  const { query, results, loading } = useSelector((s: ReturnType<typeof store10.getState>) => s);
  const d = useDispatch();
  return <div><div style={{ display: "flex", gap: 4 }}><input value={query} onChange={e => d(slice10.actions.setQuery(e.target.value))} placeholder="Search fruits..." /><button onClick={() => d(searchItems10(query))} disabled={loading}>{loading ? "..." : "Search"}</button></div><ul>{results.map(r => <li key={r}>{r}</li>)}</ul>{results.length === 0 && !loading && query && <p>No results</p>}</div>;
}

// 11. Thunk condition (skip if already loading)
const fetchOnce11 = createAsyncThunk("ex11/fetch", async () => { await delay(1500); return `Loaded at ${new Date().toLocaleTimeString()}`; }, { condition: (_, { getState }) => { const s = (getState() as ReturnType<typeof store11.getState>); return !s.loading; } });
const slice11 = createSlice({ name: "ex11", initialState: { data: "", loading: false, skipped: 0 }, reducers: { skip: s => { s.skipped++; } }, extraReducers: b => b.addCase(fetchOnce11.pending, s => { s.loading = true; }).addCase(fetchOnce11.fulfilled, (s, a) => { s.data = a.payload; s.loading = false; }).addCase(fetchOnce11.rejected, (s, a) => { if (a.meta.condition) s.skipped++; s.loading = false; }) });
const store11 = configureStore({ reducer: slice11.reducer });
function Ex11_Name() { return <Provider store={store11}><Ex11_Inner /></Provider>; }
function Ex11_Inner() {
  const { data, loading, skipped } = useSelector((s: ReturnType<typeof store11.getState>) => s);
  const d = useDispatch();
  return <div><p>Status: {loading ? "loading..." : "idle"} | Skipped: {skipped}</p><p>{data || "No data"}</p><button onClick={() => d(fetchOnce11())}>{loading ? "Clicking won't double-fetch (condition)" : "Fetch (1.5s)"}</button><p style={{ fontSize: 11 }}>Spam the button — condition prevents duplicate requests</p></div>;
}

// 12. Thunk return value
const fetchWithReturn12 = createAsyncThunk("ex12/fetch", async (id: number) => { await delay(500); return { id, value: id * 42, label: `Result for ${id}` }; });
const slice12 = createSlice({ name: "ex12", initialState: { items: [] as { id: number; value: number; label: string }[], log: [] as string[] }, reducers: {}, extraReducers: b => b.addCase(fetchWithReturn12.fulfilled, (s, a) => { s.items.push(a.payload); s.log.push(`Fetched id=${a.payload.id} value=${a.payload.value}`); }) });
const store12 = configureStore({ reducer: slice12.reducer });
function Ex12_Name() { return <Provider store={store12}><Ex12_Inner /></Provider>; }
function Ex12_Inner() {
  const { items, log } = useSelector((s: ReturnType<typeof store12.getState>) => s);
  const d = useDispatch();
  const fetchAndUse = async (id: number) => {
    const result = await d(fetchWithReturn12(id));
    if (fetchWithReturn12.fulfilled.match(result)) {
      alert(`Thunk returned: id=${result.payload.id}, value=${result.payload.value}`);
    }
  };
  return <div><div>{[1, 2, 3].map(id => <button key={id} onClick={() => fetchAndUse(id)}>Fetch {id} (unwrap)</button>)}</div><ul style={{ fontSize: 11 }}>{log.map((l, i) => <li key={i}>{l}</li>)}</ul></div>;
}

// ─── INTERMEDIATE 13–25 ─────────────────────────────────────────────────────────

// 13. Fetch user thunk
const fetchUser13 = createAsyncThunk("ex13/fetchUser", async (id: number) => fakeApi.getUser(id));
const slice13 = createSlice({ name: "ex13", initialState: { user: null as Awaited<ReturnType<typeof fakeApi.getUser>> | null, loading: false, error: "" }, reducers: {}, extraReducers: b => b.addCase(fetchUser13.pending, s => { s.loading = true; s.error = ""; }).addCase(fetchUser13.fulfilled, (s, a) => { s.user = a.payload; s.loading = false; }).addCase(fetchUser13.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? "Error"; }) });
const store13 = configureStore({ reducer: slice13.reducer });
function Ex13_Name() { return <Provider store={store13}><Ex13_Inner /></Provider>; }
function Ex13_Inner() {
  const { user, loading, error } = useSelector((s: ReturnType<typeof store13.getState>) => s);
  const d = useDispatch();
  const [id, setId] = useState(1);
  return <div><div><input type="number" value={id} min={1} max={10} onChange={e => setId(Number(e.target.value))} style={{ width: 50 }} /><button onClick={() => d(fetchUser13(id))} disabled={loading}>Fetch User</button></div>{loading && <p>Loading...</p>}{user && <div style={{ border: "1px solid #ccc", padding: 8 }}><p><strong>{user.name}</strong></p><p>{user.email}</p></div>}{error && <p style={{ color: "red" }}>{error}</p>}</div>;
}

// 14. Fetch list thunk with loading
const fetchList14 = createAsyncThunk("ex14/fetchList", async (page: number) => fakeApi.getList(page));
const slice14 = createSlice({ name: "ex14", initialState: { items: [] as { id: number; title: string }[], page: 1, loading: false }, reducers: { setPage: (s, a: PayloadAction<number>) => { s.page = a.payload; } }, extraReducers: b => b.addCase(fetchList14.pending, s => { s.loading = true; }).addCase(fetchList14.fulfilled, (s, a) => { s.items = a.payload; s.loading = false; }) });
const store14 = configureStore({ reducer: slice14.reducer });
type RS14 = ReturnType<typeof store14.getState>;
function Ex14_Name() { return <Provider store={store14}><Ex14_Inner /></Provider>; }
function Ex14_Inner() {
  const { items, page, loading } = useSelector((s: RS14) => s);
  const d = useDispatch();
  useEffect(() => { d(fetchList14(page)); }, [d, page]);
  return <div><div><button onClick={() => d(slice14.actions.setPage(Math.max(1, page - 1)))} disabled={page === 1 || loading}>← Prev</button><span style={{ margin: "0 8px" }}>Page {page}</span><button onClick={() => d(slice14.actions.setPage(page + 1))} disabled={loading}>Next →</button></div>{loading ? <p>Loading page {page}...</p> : <ul>{items.map(i => <li key={i.id}>{i.title}</li>)}</ul>}</div>;
}

// 15. Create item thunk (POST simulation)
const createItem15 = createAsyncThunk("ex15/create", async (title: string) => fakeApi.create(title));
const slice15 = createSlice({ name: "ex15", initialState: { items: [] as { id: number; title: string; createdAt: string }[], creating: false }, reducers: {}, extraReducers: b => b.addCase(createItem15.pending, s => { s.creating = true; }).addCase(createItem15.fulfilled, (s, a) => { s.items.unshift(a.payload); s.creating = false; }) });
const store15 = configureStore({ reducer: slice15.reducer });
function Ex15_Name() { return <Provider store={store15}><Ex15_Inner /></Provider>; }
function Ex15_Inner() {
  const { items, creating } = useSelector((s: ReturnType<typeof store15.getState>) => s);
  const d = useDispatch();
  const [v, setV] = useState("");
  return <div><div style={{ display: "flex", gap: 4 }}><input value={v} onChange={e => setV(e.target.value)} placeholder="New item title..." /><button onClick={() => { if (v) { d(createItem15(v)); setV(""); } }} disabled={creating}>{creating ? "Creating..." : "Create"}</button></div><ul>{items.map(i => <li key={i.id}><strong>{i.title}</strong> <span style={{ fontSize: 10 }}>{i.createdAt.slice(11, 19)}</span></li>)}</ul></div>;
}

// 16. Delete item thunk
const deleteItem16 = createAsyncThunk("ex16/delete", async (id: number) => { await delay(400); return id; });
const slice16 = createSlice({ name: "ex16", initialState: { items: [{ id: 1, name: "Widget" }, { id: 2, name: "Gadget" }, { id: 3, name: "Doohickey" }], deleting: null as number | null }, reducers: {}, extraReducers: b => b.addCase(deleteItem16.pending, (s, a) => { s.deleting = a.meta.arg; }).addCase(deleteItem16.fulfilled, (s, a) => { s.items = s.items.filter(i => i.id !== a.payload); s.deleting = null; }) });
const store16 = configureStore({ reducer: slice16.reducer });
function Ex16_Name() { return <Provider store={store16}><Ex16_Inner /></Provider>; }
function Ex16_Inner() {
  const { items, deleting } = useSelector((s: ReturnType<typeof store16.getState>) => s);
  const d = useDispatch();
  return <div><ul>{items.map(i => <li key={i.id}>{i.name} <button onClick={() => d(deleteItem16(i.id))} disabled={deleting === i.id}>{deleting === i.id ? "Deleting..." : "Delete"}</button></li>)}</ul>{items.length === 0 && <p>All deleted!</p>}</div>;
}

// 17. Update item thunk
const updateItem17 = createAsyncThunk("ex17/update", async ({ id, title }: { id: number; title: string }) => { await delay(500); return { id, title }; });
const slice17 = createSlice({ name: "ex17", initialState: { items: [{ id: 1, title: "Original A" }, { id: 2, title: "Original B" }], updatingId: null as number | null }, reducers: {}, extraReducers: b => b.addCase(updateItem17.pending, (s, a) => { s.updatingId = a.meta.arg.id; }).addCase(updateItem17.fulfilled, (s, a) => { const i = s.items.find(i => i.id === a.payload.id); if (i) i.title = a.payload.title; s.updatingId = null; }) });
const store17 = configureStore({ reducer: slice17.reducer });
function Ex17_Name() { return <Provider store={store17}><Ex17_Inner /></Provider>; }
function Ex17_Inner() {
  const { items, updatingId } = useSelector((s: ReturnType<typeof store17.getState>) => s);
  const d = useDispatch();
  const [editId, setEditId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  return <div><ul>{items.map(i => <li key={i.id}>{editId === i.id ? <><input value={editText} onChange={e => setEditText(e.target.value)} /><button onClick={() => { d(updateItem17({ id: i.id, title: editText })); setEditId(null); }} disabled={updatingId === i.id}>{updatingId === i.id ? "Saving..." : "Save"}</button><button onClick={() => setEditId(null)}>Cancel</button></> : <><span>{i.title}</span><button onClick={() => { setEditId(i.id); setEditText(i.title); }}>Edit</button></>}</li>)}</ul></div>;
}

// 18. Thunk with error message
const fetchWithMsg18 = createAsyncThunk("ex18/fetch", async (_: void, { rejectWithValue }) => {
  await delay(600);
  if (shouldFail(50)) return rejectWithValue({ code: 404, message: "Resource not found", timestamp: new Date().toISOString() });
  return { data: "Success!", timestamp: new Date().toISOString() };
});
const slice18 = createSlice({ name: "ex18", initialState: { data: "", error: null as { code: number; message: string; timestamp: string } | null, status: "idle" }, reducers: { reset: () => ({ data: "", error: null, status: "idle" }) }, extraReducers: b => b.addCase(fetchWithMsg18.pending, s => { s.status = "loading"; s.error = null; }).addCase(fetchWithMsg18.fulfilled, (s, a) => { s.data = a.payload.data; s.status = "success"; }).addCase(fetchWithMsg18.rejected, (s, a) => { s.error = a.payload as { code: number; message: string; timestamp: string }; s.status = "error"; }) });
const store18 = configureStore({ reducer: slice18.reducer });
function Ex18_Name() { return <Provider store={store18}><Ex18_Inner /></Provider>; }
function Ex18_Inner() {
  const { data, error, status } = useSelector((s: ReturnType<typeof store18.getState>) => s);
  const d = useDispatch();
  return <div><p>Status: {status}</p>{data && <p style={{ color: "green" }}>{data}</p>}{error && <div style={{ background: "#ffcdd2", padding: 8 }}><p>Error {error.code}: {error.message}</p><p style={{ fontSize: 11 }}>{error.timestamp}</p></div>}<button onClick={() => d(fetchWithMsg18())} disabled={status === "loading"}>Fetch (50% fail)</button><button onClick={() => d(slice18.actions.reset())}>Reset</button></div>;
}

// 19. Retry thunk on failure
const fetchRetry19 = createAsyncThunk("ex19/fetch", async (_, { rejectWithValue }) => {
  let attempts = 0;
  while (attempts < 3) {
    attempts++;
    await delay(400);
    if (attempts < 3) { continue; } // Succeed on 3rd attempt
    return { data: "Finally succeeded!", attempts };
  }
  return rejectWithValue("Max retries exceeded");
});
const slice19 = createSlice({ name: "ex19", initialState: { data: "", attempts: 0, status: "idle" }, reducers: { reset: () => ({ data: "", attempts: 0, status: "idle" }) }, extraReducers: b => b.addCase(fetchRetry19.pending, s => { s.status = "loading"; }).addCase(fetchRetry19.fulfilled, (s, a) => { s.data = a.payload.data; s.attempts = a.payload.attempts; s.status = "success"; }).addCase(fetchRetry19.rejected, s => { s.status = "failed"; }) });
const store19 = configureStore({ reducer: slice19.reducer });
function Ex19_Name() { return <Provider store={store19}><Ex19_Inner /></Provider>; }
function Ex19_Inner() {
  const { data, attempts, status } = useSelector((s: ReturnType<typeof store19.getState>) => s);
  const d = useDispatch();
  return <div><p>Status: {status} {status === "loading" ? "(retrying internally...)" : ""}</p>{data && <p>{data} (after {attempts} attempts)</p>}<button onClick={() => d(fetchRetry19())} disabled={status === "loading"}>{status === "loading" ? "Working..." : "Fetch with retry"}</button><button onClick={() => d(slice19.actions.reset())}>Reset</button></div>;
}

// 20. Thunk with AbortController
const fetchAbortable20 = createAsyncThunk("ex20/fetch", async (_: void, { signal }) => {
  const controller = new AbortController();
  signal.addEventListener("abort", () => controller.abort());
  await new Promise<void>((res, rej) => {
    const timer = setTimeout(res, 2000);
    controller.signal.addEventListener("abort", () => { clearTimeout(timer); rej(new DOMException("Aborted", "AbortError")); });
  });
  return `Loaded at ${new Date().toLocaleTimeString()}`;
});
const slice20 = createSlice({ name: "ex20", initialState: { data: "", status: "idle", aborted: 0 }, reducers: {}, extraReducers: b => b.addCase(fetchAbortable20.pending, s => { s.status = "loading"; }).addCase(fetchAbortable20.fulfilled, (s, a) => { s.data = a.payload; s.status = "done"; }).addCase(fetchAbortable20.rejected, (s, a) => { if (a.error.name === "AbortError") { s.aborted++; s.status = "idle"; } else s.status = "error"; }) });
const store20 = configureStore({ reducer: slice20.reducer });
function Ex20_Name() { return <Provider store={store20}><Ex20_Inner /></Provider>; }
function Ex20_Inner() {
  const { data, status, aborted } = useSelector((s: ReturnType<typeof store20.getState>) => s);
  const d = useDispatch();
  const thunkRef = useRef<ReturnType<typeof fetchAbortable20> | null>(null);
  return <div><p>Status: {status} | Aborted: {aborted}x</p>{data && <p>{data}</p>}<button onClick={() => { thunkRef.current = d(fetchAbortable20()); }} disabled={status === "loading"}>Start (2s)</button><button onClick={() => thunkRef.current?.abort()} disabled={status !== "loading"}>Abort</button></div>;
}

// 21. Thunk with getState
const addWithMax21 = createAsyncThunk("ex21/addWithMax", async (value: number, { getState, rejectWithValue }) => {
  const s = getState() as ReturnType<typeof store21.getState>;
  if (s.total + value > s.max) return rejectWithValue(`Would exceed max (${s.max}). Current: ${s.total}, Adding: ${value}`);
  await delay(300);
  return value;
});
const slice21 = createSlice({ name: "ex21", initialState: { items: [] as number[], total: 0, max: 100, error: "" }, reducers: { setMax: (s, a: PayloadAction<number>) => { s.max = a.payload; } }, extraReducers: b => b.addCase(addWithMax21.fulfilled, (s, a) => { s.items.push(a.payload); s.total += a.payload; s.error = ""; }).addCase(addWithMax21.rejected, (s, a) => { s.error = a.payload as string; }) });
const store21 = configureStore({ reducer: slice21.reducer });
function Ex21_Name() { return <Provider store={store21}><Ex21_Inner /></Provider>; }
function Ex21_Inner() {
  const { items, total, max, error } = useSelector((s: ReturnType<typeof store21.getState>) => s);
  const d = useDispatch();
  const [v, setV] = useState(10);
  return <div><p>Total: {total}/{max}</p><div style={{ background: "#eee", height: 10, borderRadius: 5 }}><div style={{ background: "#4caf50", height: "100%", width: `${Math.min(100, (total / max) * 100)}%`, borderRadius: 5 }} /></div>{error && <p style={{ color: "red", fontSize: 11 }}>{error}</p>}<input type="number" value={v} onChange={e => setV(Number(e.target.value))} style={{ width: 60 }} /><button onClick={() => d(addWithMax21(v))}>Add {v} (checks max via getState)</button><button onClick={() => d(slice21.actions.setMax(max === 100 ? 50 : 100))}>Toggle max ({max}→{max === 100 ? 50 : 100})</button></div>;
}

// 22. Thunk with dispatch (nested dispatch)
const initApp22 = createAsyncThunk("ex22/init", async (_, { dispatch }) => {
  dispatch(slice22.actions.setStep("auth"));
  await delay(500);
  dispatch(slice22.actions.setStep("user"));
  await delay(500);
  dispatch(slice22.actions.setStep("data"));
  await delay(500);
  return "App initialized!";
});
const slice22 = createSlice({ name: "ex22", initialState: { step: "idle", result: "" }, reducers: { setStep: (s, a: PayloadAction<string>) => { s.step = a.payload; }, reset: () => ({ step: "idle", result: "" }) }, extraReducers: b => b.addCase(initApp22.fulfilled, (s, a) => { s.result = a.payload; s.step = "done"; }) });
const store22 = configureStore({ reducer: slice22.reducer });
function Ex22_Name() { return <Provider store={store22}><Ex22_Inner /></Provider>; }
function Ex22_Inner() {
  const { step, result } = useSelector((s: ReturnType<typeof store22.getState>) => s);
  const d = useDispatch();
  const steps = ["idle", "auth", "user", "data", "done"];
  return <div><div style={{ display: "flex", gap: 4 }}>{steps.map(s => <span key={s} style={{ padding: "2px 6px", background: step === s ? "#4caf50" : "#eee", color: step === s ? "#fff" : "#333", borderRadius: 4, fontSize: 12 }}>{s}</span>)}</div><p>{result || `Current: ${step}`}</p><button onClick={() => d(initApp22())} disabled={step !== "idle" && step !== "done"}>Initialize App</button><button onClick={() => d(slice22.actions.reset())}>Reset</button></div>;
}

// 23. Sequential thunks
const fetchStep23 = createAsyncThunk("ex23/step", async (step: number) => { await delay(400); return `Step ${step} complete at ${new Date().toLocaleTimeString()}`; });
const slice23 = createSlice({ name: "ex23", initialState: { log: [] as string[], running: false, step: 0 }, reducers: { setRunning: (s, a: PayloadAction<boolean>) => { s.running = a.payload; s.step = 0; if (!a.payload) s.log = []; } }, extraReducers: b => b.addCase(fetchStep23.fulfilled, (s, a) => { s.log.push(a.payload); s.step++; }) });
const store23 = configureStore({ reducer: slice23.reducer });
function Ex23_Name() { return <Provider store={store23}><Ex23_Inner /></Provider>; }
function Ex23_Inner() {
  const { log, running } = useSelector((s: ReturnType<typeof store23.getState>) => s);
  const d = useDispatch();
  const runSequence = async () => {
    d(slice23.actions.setRunning(true));
    for (let i = 1; i <= 4; i++) await d(fetchStep23(i));
    d(slice23.actions.setRunning(false));
  };
  return <div><button onClick={runSequence} disabled={running}>{running ? "Running..." : "Run Sequential Steps"}</button><ul style={{ fontSize: 12 }}>{log.map((l, i) => <li key={i}>{l}</li>)}</ul></div>;
}

// 24. Thunk with pagination
const fetchPage24 = createAsyncThunk("ex24/fetchPage", async (page: number) => fakeApi.getList(page));
const slice24 = createSlice({ name: "ex24", initialState: { items: [] as { id: number; title: string }[][], loading: false, page: 0, hasMore: true }, reducers: {}, extraReducers: b => b.addCase(fetchPage24.pending, s => { s.loading = true; }).addCase(fetchPage24.fulfilled, (s, a) => { s.items.push(a.payload); s.loading = false; s.page++; s.hasMore = a.payload.length === 5; }) });
const store24 = configureStore({ reducer: slice24.reducer });
function Ex24_Name() { return <Provider store={store24}><Ex24_Inner /></Provider>; }
function Ex24_Inner() {
  const { items, loading, page, hasMore } = useSelector((s: ReturnType<typeof store24.getState>) => s);
  const d = useDispatch();
  const flat = items.flat();
  return <div><ul>{flat.map(i => <li key={i.id}>{i.title}</li>)}</ul><p>{flat.length} items loaded | Page: {page}</p>{hasMore ? <button onClick={() => d(fetchPage24(page))} disabled={loading}>{loading ? "Loading..." : "Load More"}</button> : <p>No more items</p>}</div>;
}

// 25. Thunk with search/filter params
const search25 = createAsyncThunk("ex25/search", async (params: { q: string; sort: "asc" | "desc"; limit: number }) => {
  await delay(600);
  const words = ["Apple", "Banana", "Cherry", "Date", "Elderberry", "Fig", "Grape"];
  return words.filter(w => w.toLowerCase().includes(params.q.toLowerCase())).sort((a, b) => params.sort === "asc" ? a.localeCompare(b) : b.localeCompare(a)).slice(0, params.limit);
});
const slice25 = createSlice({ name: "ex25", initialState: { results: [] as string[], params: { q: "", sort: "asc" as "asc" | "desc", limit: 5 }, loading: false }, reducers: { setParams: (s, a: PayloadAction<Partial<{ q: string; sort: "asc" | "desc"; limit: number }>>) => { Object.assign(s.params, a.payload); } }, extraReducers: b => b.addCase(search25.pending, s => { s.loading = true; }).addCase(search25.fulfilled, (s, a) => { s.results = a.payload; s.loading = false; }) });
const store25 = configureStore({ reducer: slice25.reducer });
type RS25 = ReturnType<typeof store25.getState>;
function Ex25_Name() { return <Provider store={store25}><Ex25_Inner /></Provider>; }
function Ex25_Inner() {
  const { results, params, loading } = useSelector((s: RS25) => s);
  const d = useDispatch();
  return <div><div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}><input value={params.q} onChange={e => d(slice25.actions.setParams({ q: e.target.value }))} placeholder="Search..." /><select value={params.sort} onChange={e => d(slice25.actions.setParams({ sort: e.target.value as "asc" | "desc" }))}><option value="asc">A→Z</option><option value="desc">Z→A</option></select><input type="number" value={params.limit} min={1} max={10} onChange={e => d(slice25.actions.setParams({ limit: Number(e.target.value) }))} style={{ width: 40 }} /><button onClick={() => d(search25(params))} disabled={loading}>{loading ? "..." : "Search"}</button></div><ul>{results.map(r => <li key={r}>{r}</li>)}</ul></div>;
}

// ─── NESTED 26–37 ───────────────────────────────────────────────────────────────

// 26. Fetch + normalize entities thunk
const fetchNormalized26 = createAsyncThunk("ex26/fetch", async () => {
  await delay(700);
  const raw = [{ id: 1, name: "Alice", deptId: 10 }, { id: 2, name: "Bob", deptId: 11 }, { id: 3, name: "Carol", deptId: 10 }];
  const depts = [{ id: 10, name: "Engineering" }, { id: 11, name: "Design" }];
  const byId: Record<number, typeof raw[number]> = {};
  raw.forEach(u => { byId[u.id] = u; });
  return { users: { byId, allIds: raw.map(u => u.id) }, depts };
});
const slice26 = createSlice({ name: "ex26", initialState: { users: { byId: {} as Record<number, { id: number; name: string; deptId: number }>, allIds: [] as number[] }, depts: [] as { id: number; name: string }[], loading: false }, reducers: {}, extraReducers: b => b.addCase(fetchNormalized26.pending, s => { s.loading = true; }).addCase(fetchNormalized26.fulfilled, (s, a) => { s.users = a.payload.users; s.depts = a.payload.depts; s.loading = false; }) });
const store26 = configureStore({ reducer: slice26.reducer });
function Ex26_Name() { return <Provider store={store26}><Ex26_Inner /></Provider>; }
function Ex26_Inner() {
  const { users, depts, loading } = useSelector((s: ReturnType<typeof store26.getState>) => s);
  const d = useDispatch();
  return <div>{loading ? <p>Fetching...</p> : <ul>{users.allIds.map(id => { const u = users.byId[id]; const dept = depts.find(dep => dep.id === u.deptId); return <li key={id}>{u.name} — {dept?.name}</li>; })}</ul>}<button onClick={() => d(fetchNormalized26())} disabled={loading}>Fetch &amp; Normalize</button></div>;
}

// 27. Thunk that dispatches multiple actions
const bulkLoad27 = createAsyncThunk("ex27/bulkLoad", async (_, { dispatch }) => {
  dispatch(slice27.actions.setStatus("loading users"));
  await delay(400);
  dispatch(slice27.actions.setUsers(["Alice", "Bob", "Carol"]));
  dispatch(slice27.actions.setStatus("loading posts"));
  await delay(400);
  dispatch(slice27.actions.setPosts(["Post 1", "Post 2"]));
  dispatch(slice27.actions.setStatus("done"));
  return true;
});
const slice27 = createSlice({ name: "ex27", initialState: { users: [] as string[], posts: [] as string[], status: "idle" }, reducers: { setStatus: (s, a: PayloadAction<string>) => { s.status = a.payload; }, setUsers: (s, a: PayloadAction<string[]>) => { s.users = a.payload; }, setPosts: (s, a: PayloadAction<string[]>) => { s.posts = a.payload; }, reset: () => ({ users: [], posts: [], status: "idle" }) } });
const store27 = configureStore({ reducer: slice27.reducer });
function Ex27_Name() { return <Provider store={store27}><Ex27_Inner /></Provider>; }
function Ex27_Inner() {
  const { users, posts, status } = useSelector((s: ReturnType<typeof store27.getState>) => s);
  const d = useDispatch();
  return <div><p>Status: <strong>{status}</strong></p>{users.length > 0 && <p>Users: {users.join(", ")}</p>}{posts.length > 0 && <p>Posts: {posts.join(", ")}</p>}<button onClick={() => d(bulkLoad27())} disabled={status !== "idle" && status !== "done"}>Bulk Load</button><button onClick={() => d(slice27.actions.reset())}>Reset</button></div>;
}

// 28. Optimistic update thunk (optimistic → confirm/rollback)
const saveItem28 = createAsyncThunk("ex28/save", async ({ id, text }: { id: number; text: string }, { rejectWithValue }) => {
  await delay(1000);
  if (shouldFail(40)) return rejectWithValue({ id, originalText: "Original" });
  return { id, text };
});
const slice28 = createSlice({ name: "ex28", initialState: { items: [{ id: 1, text: "Original", status: "saved" as "saved" | "saving" | "error" }] }, reducers: { applyOptimistic: (s, a: PayloadAction<{ id: number; text: string }>) => { const i = s.items.find(i => i.id === a.payload.id); if (i) { i.text = a.payload.text; i.status = "saving"; } }, rollback: (s, a: PayloadAction<{ id: number; originalText: string }>) => { const i = s.items.find(i => i.id === a.payload.id); if (i) { i.text = a.payload.originalText; i.status = "error"; } }, confirm: (s, a: PayloadAction<number>) => { const i = s.items.find(i => i.id === a.payload); if (i) i.status = "saved"; } } });
const store28 = configureStore({ reducer: slice28.reducer });
const statusBg28: Record<string, string> = { saved: "#c8e6c9", saving: "#fff9c4", error: "#ffcdd2" };
function Ex28_Name() { return <Provider store={store28}><Ex28_Inner /></Provider>; }
function Ex28_Inner() {
  const { items } = useSelector((s: ReturnType<typeof store28.getState>) => s);
  const d = useDispatch();
  const [v, setV] = useState("Updated text");
  const handleSave = () => {
    const id = 1;
    d(slice28.actions.applyOptimistic({ id, text: v }));
    d(saveItem28({ id, text: v })).then(result => {
      if (saveItem28.fulfilled.match(result)) d(slice28.actions.confirm(id));
      else d(slice28.actions.rollback({ id, originalText: "Original" }));
    });
  };
  return <div><ul>{items.map(i => <li key={i.id} style={{ background: statusBg28[i.status], padding: 4 }}>{i.text} [{i.status}]</li>)}</ul><input value={v} onChange={e => setV(e.target.value)} /><button onClick={handleSave} disabled={items[0]?.status === "saving"}>Save (60% success)</button></div>;
}

// 29. Thunk with dependent requests (fetch user then posts)
const fetchUserAndPosts29 = createAsyncThunk("ex29/fetchBoth", async (userId: number) => {
  const user = await fakeApi.getUser(userId);
  await delay(300);
  const posts = [{ id: 1, title: `${user.name}'s first post` }, { id: 2, title: `${user.name}'s second post` }];
  return { user, posts };
});
const slice29 = createSlice({ name: "ex29", initialState: { user: null as { id: number; name: string; email: string } | null, posts: [] as { id: number; title: string }[], loading: false }, reducers: {}, extraReducers: b => b.addCase(fetchUserAndPosts29.pending, s => { s.loading = true; }).addCase(fetchUserAndPosts29.fulfilled, (s, a) => { s.user = a.payload.user; s.posts = a.payload.posts; s.loading = false; }) });
const store29 = configureStore({ reducer: slice29.reducer });
function Ex29_Name() { return <Provider store={store29}><Ex29_Inner /></Provider>; }
function Ex29_Inner() {
  const { user, posts, loading } = useSelector((s: ReturnType<typeof store29.getState>) => s);
  const d = useDispatch();
  const [id, setId] = useState(1);
  return <div><div><input type="number" value={id} onChange={e => setId(Number(e.target.value))} style={{ width: 50 }} /><button onClick={() => d(fetchUserAndPosts29(id))} disabled={loading}>{loading ? "Loading..." : "Fetch User + Posts"}</button></div>{user && <div><p><strong>{user.name}</strong> ({user.email})</p><ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul></div>}</div>;
}

// 30. Parallel thunks (Promise.all)
const fetchParallel30 = createAsyncThunk("ex30/parallel", async () => {
  const [users, posts] = await Promise.all([
    delay(700).then(() => [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }]),
    delay(500).then(() => [{ id: 1, title: "Post A" }, { id: 2, title: "Post B" }, { id: 3, title: "Post C" }])
  ]);
  return { users, posts };
});
const slice30 = createSlice({ name: "ex30", initialState: { users: [] as { id: number; name: string }[], posts: [] as { id: number; title: string }[], loading: false, loadTime: 0 }, reducers: {}, extraReducers: b => b.addCase(fetchParallel30.pending, s => { s.loading = true; }).addCase(fetchParallel30.fulfilled, (s, a) => { s.users = a.payload.users; s.posts = a.payload.posts; s.loading = false; }) });
const store30 = configureStore({ reducer: slice30.reducer });
function Ex30_Name() { return <Provider store={store30}><Ex30_Inner /></Provider>; }
function Ex30_Inner() {
  const { users, posts, loading } = useSelector((s: ReturnType<typeof store30.getState>) => s);
  const d = useDispatch();
  const [elapsed, setElapsed] = useState(0);
  const fetch30 = async () => { const start = Date.now(); await d(fetchParallel30()); setElapsed(Date.now() - start); };
  return <div><button onClick={fetch30} disabled={loading}>{loading ? "Fetching in parallel..." : "Fetch (parallel)"}</button>{elapsed > 0 && <p style={{ fontSize: 11 }}>Completed in ~{elapsed}ms (max of 500ms+700ms)</p>}<div style={{ display: "flex", gap: 8 }}><div><strong>Users:</strong><ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul></div><div><strong>Posts:</strong><ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul></div></div></div>;
}

// 31. Thunk with polling
const pollData31 = createAsyncThunk("ex31/poll", async () => { await delay(1000); return { value: Math.floor(Math.random() * 100), time: new Date().toLocaleTimeString() }; });
const slice31 = createSlice({ name: "ex31", initialState: { current: null as { value: number; time: string } | null, history: [] as { value: number; time: string }[], polling: false }, reducers: { setPolling: (s, a: PayloadAction<boolean>) => { s.polling = a.payload; } }, extraReducers: b => b.addCase(pollData31.fulfilled, (s, a) => { s.current = a.payload; s.history.unshift(a.payload); if (s.history.length > 6) s.history.pop(); }) });
const store31 = configureStore({ reducer: slice31.reducer });
function Ex31_Name() { return <Provider store={store31}><Ex31_Inner /></Provider>; }
function Ex31_Inner() {
  const { current, history, polling } = useSelector((s: ReturnType<typeof store31.getState>) => s);
  const d = useDispatch();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const start = () => { d(slice31.actions.setPolling(true)); d(pollData31()); intervalRef.current = setInterval(() => d(pollData31()), 2000); };
  const stop = () => { clearInterval(intervalRef.current); d(slice31.actions.setPolling(false)); };
  useEffect(() => () => clearInterval(intervalRef.current), []);
  return <div><button onClick={start} disabled={polling}>Start Polling (2s)</button><button onClick={stop} disabled={!polling}>Stop</button>{current && <p>Current: <strong>{current.value}</strong> @ {current.time}</p>}<ul style={{ fontSize: 11 }}>{history.map((h, i) => <li key={i}>{h.value} @ {h.time}</li>)}</ul></div>;
}

// 32. Thunk with cache check (skip if data exists)
const fetchCached32 = createAsyncThunk("ex32/fetch", async (key: string, { getState, rejectWithValue }) => {
  const s = getState() as ReturnType<typeof store32.getState>;
  if (s.cache[key]) return rejectWithValue(`cache hit: ${key}`);
  await delay(800);
  return { key, value: `Data for ${key} at ${new Date().toLocaleTimeString()}` };
}, { condition: (key, { getState }) => !(getState() as ReturnType<typeof store32.getState>).loading[key] });
const slice32 = createSlice({ name: "ex32", initialState: { cache: {} as Record<string, string>, loading: {} as Record<string, boolean>, hits: 0 }, reducers: { invalidate: (s, a: PayloadAction<string>) => { delete s.cache[a.payload]; } }, extraReducers: b => b.addCase(fetchCached32.pending, (s, a) => { s.loading[a.meta.arg] = true; }).addCase(fetchCached32.fulfilled, (s, a) => { s.cache[a.payload.key] = a.payload.value; delete s.loading[a.payload.key]; }).addCase(fetchCached32.rejected, (s, a) => { if ((a.payload as string)?.startsWith("cache hit")) s.hits++; delete s.loading[a.meta.arg]; }) });
const store32 = configureStore({ reducer: slice32.reducer });
type RS32 = ReturnType<typeof store32.getState>;
function Ex32_Name() { return <Provider store={store32}><Ex32_Inner /></Provider>; }
function Ex32_Inner() {
  const { cache, loading, hits } = useSelector((s: RS32) => s);
  const d = useDispatch();
  const keys = ["user", "settings", "dashboard"];
  return <div><p>Cache hits: {hits}</p><div style={{ display: "flex", gap: 4 }}>{keys.map(k => <div key={k}><button onClick={() => d(fetchCached32(k))} disabled={!!loading[k]}>{loading[k] ? "..." : `Fetch ${k}`}</button>{cache[k] && <button onClick={() => d(slice32.actions.invalidate(k))}>✗</button>}</div>)}</div><ul style={{ fontSize: 11 }}>{Object.entries(cache).map(([k, v]) => <li key={k}>[{k}]: {v}</li>)}</ul></div>;
}

// 33. Thunk with request deduplication
const pendingRequests33: Record<string, Promise<unknown>> = {};
const fetchDedup33 = createAsyncThunk("ex33/dedup", async (key: string) => {
  if (pendingRequests33[key]) { await pendingRequests33[key]; return { key, deduped: true }; }
  pendingRequests33[key] = delay(1000).then(() => ({ key, value: Math.random() }));
  const result = await pendingRequests33[key] as { key: string; value: number };
  delete pendingRequests33[key];
  return { key, value: result.value, deduped: false };
});
const slice33 = createSlice({ name: "ex33", initialState: { results: {} as Record<string, { value?: number; deduped: boolean }>, log: [] as string[] }, reducers: {}, extraReducers: b => b.addCase(fetchDedup33.fulfilled, (s, a) => { s.results[a.payload.key] = { value: (a.payload as { value?: number }).value, deduped: a.payload.deduped }; s.log.unshift(`${a.payload.key}: ${a.payload.deduped ? "deduped" : `fresh (${((a.payload as { value?: number }).value ?? 0).toFixed(3)})`}`); if (s.log.length > 6) s.log.pop(); }) });
const store33 = configureStore({ reducer: slice33.reducer });
function Ex33_Name() { return <Provider store={store33}><Ex33_Inner /></Provider>; }
function Ex33_Inner() {
  const { log } = useSelector((s: ReturnType<typeof store33.getState>) => s);
  const d = useDispatch();
  return <div><div style={{ display: "flex", gap: 4 }}>{["alpha", "beta"].map(k => <div key={k}><button onClick={() => d(fetchDedup33(k))}>Fetch {k}</button><button onClick={() => d(fetchDedup33(k))}>Fetch {k} again</button></div>)}</div><ul style={{ fontSize: 11 }}>{log.map((l, i) => <li key={i}>{l}</li>)}</ul><p style={{ fontSize: 11 }}>Spam the buttons — concurrent requests to same key are deduplicated</p></div>;
}

// 34. Thunk with loading skeleton state
const fetchWithSkeleton34 = createAsyncThunk("ex34/fetch", async () => { await delay(1200); return Array.from({ length: 4 }, (_, i) => ({ id: i + 1, name: `Product ${i + 1}`, price: (i + 1) * 15 })); });
const slice34 = createSlice({ name: "ex34", initialState: { items: [] as { id: number; name: string; price: number }[], skeleton: false }, reducers: {}, extraReducers: b => b.addCase(fetchWithSkeleton34.pending, s => { s.skeleton = true; }).addCase(fetchWithSkeleton34.fulfilled, (s, a) => { s.items = a.payload; s.skeleton = false; }) });
const store34 = configureStore({ reducer: slice34.reducer });
function Skeleton34() { return <div style={{ background: "linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)", backgroundSize: "200% 100%", height: 40, borderRadius: 4, marginTop: 4 }} />; }
function Ex34_Name() { return <Provider store={store34}><Ex34_Inner /></Provider>; }
function Ex34_Inner() {
  const { items, skeleton } = useSelector((s: ReturnType<typeof store34.getState>) => s);
  const d = useDispatch();
  return <div><button onClick={() => d(fetchWithSkeleton34())} disabled={skeleton}>{skeleton ? "Loading..." : "Fetch Products"}</button><div>{skeleton ? Array.from({ length: 4 }, (_, i) => <Skeleton34 key={i} />) : <ul>{items.map(i => <li key={i.id}>{i.name} — ${i.price}</li>)}</ul>}</div></div>;
}

// 35. Thunk for file upload simulation
const uploadFile35 = createAsyncThunk("ex35/upload", async (file: { name: string; size: number }, { dispatch }) => {
  for (let progress = 10; progress <= 100; progress += 10) {
    await delay(150);
    dispatch(slice35.actions.setProgress(progress));
  }
  return { url: `https://cdn.example.com/${file.name}`, size: file.size };
});
const slice35 = createSlice({ name: "ex35", initialState: { progress: 0, uploading: false, result: null as { url: string; size: number } | null, error: "" }, reducers: { setProgress: (s, a: PayloadAction<number>) => { s.progress = a.payload; }, reset: () => ({ progress: 0, uploading: false, result: null, error: "" }) }, extraReducers: b => b.addCase(uploadFile35.pending, s => { s.uploading = true; s.progress = 0; s.result = null; }).addCase(uploadFile35.fulfilled, (s, a) => { s.result = a.payload; s.uploading = false; }).addCase(uploadFile35.rejected, (s, a) => { s.error = a.error.message ?? "Upload failed"; s.uploading = false; }) });
const store35 = configureStore({ reducer: slice35.reducer });
function Ex35_Name() { return <Provider store={store35}><Ex35_Inner /></Provider>; }
function Ex35_Inner() {
  const { progress, uploading, result } = useSelector((s: ReturnType<typeof store35.getState>) => s);
  const d = useDispatch();
  const files = [{ name: "photo.jpg", size: 2048000 }, { name: "video.mp4", size: 50000000 }];
  return <div>{files.map(f => <button key={f.name} onClick={() => d(uploadFile35(f))} disabled={uploading}>Upload {f.name}</button>)}{uploading && <div><div style={{ background: "#eee", height: 12, borderRadius: 6 }}><div style={{ background: "#4caf50", height: "100%", width: `${progress}%`, borderRadius: 6, transition: "width 0.1s" }} /></div><p style={{ fontSize: 11 }}>{progress}%</p></div>}{result && <div><p style={{ color: "green" }}>Uploaded!</p><p style={{ fontSize: 11 }}>URL: {result.url}</p><button onClick={() => d(slice35.actions.reset())}>Reset</button></div>}</div>;
}

// 36. Thunk with progress tracking
const processData36 = createAsyncThunk("ex36/process", async (items: string[], { dispatch }) => {
  const results: string[] = [];
  for (let i = 0; i < items.length; i++) {
    await delay(300);
    results.push(items[i].toUpperCase());
    dispatch(slice36.actions.setProgress({ current: i + 1, total: items.length, item: items[i] }));
  }
  return results;
});
const slice36 = createSlice({ name: "ex36", initialState: { results: [] as string[], progress: { current: 0, total: 0, item: "" }, processing: false }, reducers: { setProgress: (s, a: PayloadAction<{ current: number; total: number; item: string }>) => { s.progress = a.payload; }, reset: () => ({ results: [], progress: { current: 0, total: 0, item: "" }, processing: false }) }, extraReducers: b => b.addCase(processData36.pending, s => { s.processing = true; }).addCase(processData36.fulfilled, (s, a) => { s.results = a.payload; s.processing = false; }) });
const store36 = configureStore({ reducer: slice36.reducer });
function Ex36_Name() { return <Provider store={store36}><Ex36_Inner /></Provider>; }
function Ex36_Inner() {
  const { results, progress, processing } = useSelector((s: ReturnType<typeof store36.getState>) => s);
  const d = useDispatch();
  const items = ["apple", "banana", "cherry", "date", "elderberry"];
  const pct = progress.total ? (progress.current / progress.total) * 100 : 0;
  return <div><button onClick={() => d(processData36(items))} disabled={processing}>{processing ? "Processing..." : "Process Items"}</button>{processing && <div><div style={{ background: "#eee", height: 12, borderRadius: 6 }}><div style={{ background: "#2196f3", height: "100%", width: `${pct}%`, borderRadius: 6, transition: "width 0.2s" }} /></div><p style={{ fontSize: 11 }}>Processing: {progress.item} ({progress.current}/{progress.total})</p></div>}{results.length > 0 && <ul>{results.map(r => <li key={r}>{r}</li>)}</ul>}<button onClick={() => d(slice36.actions.reset())} disabled={processing}>Reset</button></div>;
}

// 37. Thunk with undo support
const applyChange37 = createAsyncThunk("ex37/apply", async ({ change }: { change: string }, { getState }) => {
  const s = getState() as ReturnType<typeof store37.getState>;
  await delay(400);
  return { change, before: s.text };
});
const slice37 = createSlice({ name: "ex37", initialState: { text: "initial text", history: [] as { change: string; before: string }[], applying: false }, reducers: { undo: s => { const last = s.history.pop(); if (last) s.text = last.before; } }, extraReducers: b => b.addCase(applyChange37.pending, s => { s.applying = true; }).addCase(applyChange37.fulfilled, (s, a) => { s.history.push({ change: a.payload.change, before: a.payload.before }); s.text = a.payload.change; s.applying = false; }) });
const store37 = configureStore({ reducer: slice37.reducer });
function Ex37_Name() { return <Provider store={store37}><Ex37_Inner /></Provider>; }
function Ex37_Inner() {
  const { text, history, applying } = useSelector((s: ReturnType<typeof store37.getState>) => s);
  const d = useDispatch();
  const [v, setV] = useState("new text");
  return <div><p>Text: "<strong>{text}</strong>"</p><div><input value={v} onChange={e => setV(e.target.value)} /><button onClick={() => d(applyChange37({ change: v }))} disabled={applying}>{applying ? "Applying..." : "Apply"}</button><button onClick={() => d(slice37.actions.undo())} disabled={!history.length || applying}>Undo ({history.length})</button></div></div>;
}

// ─── ADVANCED 38–50 ─────────────────────────────────────────────────────────────

// 38. createAsyncThunk with TypedThunkAPI
interface AppState38 { user: { id: number | null; name: string }; data: { items: string[]; loading: boolean; error: string } }
const slice38u = createSlice({ name: "ex38_user", initialState: { id: 1, name: "Alice" } as { id: number | null; name: string }, reducers: {} });
const fetchUserData38 = createAsyncThunk<string[], void, { state: AppState38; rejectValue: { message: string; code: number } }>(
  "ex38/fetchUserData",
  async (_, { getState, rejectWithValue }) => {
    const { user } = getState();
    if (!user.id) return rejectWithValue({ message: "No user", code: 401 });
    await delay(600);
    return [`${user.name}'s item 1`, `${user.name}'s item 2`];
  }
);
const slice38d = createSlice({ name: "ex38_data", initialState: { items: [] as string[], loading: false, error: "" }, reducers: {}, extraReducers: b => b.addCase(fetchUserData38.pending, s => { s.loading = true; s.error = ""; }).addCase(fetchUserData38.fulfilled, (s, a) => { s.items = a.payload; s.loading = false; }).addCase(fetchUserData38.rejected, (s, a) => { s.error = a.payload?.message ?? "Error"; s.loading = false; }) });
const store38 = configureStore({ reducer: { user: slice38u.reducer, data: slice38d.reducer } });
type RS38 = ReturnType<typeof store38.getState>;
function Ex38_Name() { return <Provider store={store38}><Ex38_Inner /></Provider>; }
function Ex38_Inner() {
  const user = useSelector((s: RS38) => s.user);
  const data = useSelector((s: RS38) => s.data);
  const d = useDispatch();
  return <div><p>User: {user.name} (id: {user.id})</p>{data.loading ? <p>Loading...</p> : <ul>{data.items.map(i => <li key={i}>{i}</li>)}</ul>}{data.error && <p style={{ color: "red" }}>{data.error}</p>}<button onClick={() => d(fetchUserData38())} disabled={data.loading}>Fetch User Data (TypedThunkAPI)</button></div>;
}

// 39. Thunk factory (generates thunks dynamically)
function makeEntityThunk39<T extends { id: number }>(entityName: string, fetcher: (id: number) => Promise<T>) {
  return createAsyncThunk(`ex39/${entityName}/fetch`, async (id: number) => fetcher(id));
}
const fetchUser39 = makeEntityThunk39("user", (id) => delay(500).then(() => ({ id, name: `User${id}`, email: `u${id}@ex.com` })));
const fetchProduct39 = makeEntityThunk39("product", (id) => delay(400).then(() => ({ id, name: `Product${id}`, price: id * 10 })));
const slice39 = createSlice({ name: "ex39", initialState: { user: null as { id: number; name: string; email: string } | null, product: null as { id: number; name: string; price: number } | null, loading: { user: false, product: false } }, reducers: {}, extraReducers: b => b.addCase(fetchUser39.pending, s => { s.loading.user = true; }).addCase(fetchUser39.fulfilled, (s, a) => { s.user = a.payload; s.loading.user = false; }).addCase(fetchProduct39.pending, s => { s.loading.product = true; }).addCase(fetchProduct39.fulfilled, (s, a) => { s.product = a.payload; s.loading.product = false; }) });
const store39 = configureStore({ reducer: slice39.reducer });
function Ex39_Name() { return <Provider store={store39}><Ex39_Inner /></Provider>; }
function Ex39_Inner() {
  const { user, product, loading } = useSelector((s: ReturnType<typeof store39.getState>) => s);
  const d = useDispatch();
  return <div><div><button onClick={() => d(fetchUser39(1))} disabled={loading.user}>{loading.user ? "..." : "Fetch User"}</button>{user && <p>User: {user.name} ({user.email})</p>}</div><div><button onClick={() => d(fetchProduct39(5))} disabled={loading.product}>{loading.product ? "..." : "Fetch Product"}</button>{product && <p>Product: {product.name} ${product.price}</p>}</div><p style={{ fontSize: 11 }}>makeEntityThunk39 factory creates typed thunks dynamically</p></div>;
}

// 40. Infinite scroll thunk
const loadMore40 = createAsyncThunk("ex40/loadMore", async (cursor: number) => {
  await delay(600);
  const items = Array.from({ length: 5 }, (_, i) => ({ id: cursor + i + 1, text: `Item ${cursor + i + 1}`, cursor: cursor + i + 1 }));
  return { items, nextCursor: cursor + 5, hasMore: cursor < 20 };
});
const slice40 = createSlice({ name: "ex40", initialState: { items: [] as { id: number; text: string; cursor: number }[], cursor: 0, hasMore: true, loading: false }, reducers: {}, extraReducers: b => b.addCase(loadMore40.pending, s => { s.loading = true; }).addCase(loadMore40.fulfilled, (s, a) => { s.items.push(...a.payload.items); s.cursor = a.payload.nextCursor; s.hasMore = a.payload.hasMore; s.loading = false; }) });
const store40 = configureStore({ reducer: slice40.reducer });
function Ex40_Name() { return <Provider store={store40}><Ex40_Inner /></Provider>; }
function Ex40_Inner() {
  const { items, cursor, hasMore, loading } = useSelector((s: ReturnType<typeof store40.getState>) => s);
  const d = useDispatch();
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!bottomRef.current) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting && hasMore && !loading) d(loadMore40(cursor)); }, { threshold: 1 });
    observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, cursor, d]);
  return <div><ul style={{ maxHeight: 200, overflowY: "auto" }}>{items.map(i => <li key={i.id}>{i.text}</li>)}{hasMore && <li ref={bottomRef} style={{ padding: 4, color: "#999" }}>{loading ? "Loading more..." : "Scroll to load"}</li>}{!hasMore && <li style={{ color: "#999" }}>All loaded ({items.length} items)</li>}</ul><button onClick={() => d(loadMore40(cursor))} disabled={!hasMore || loading}>Load More</button></div>;
}

// 41. Realtime sync thunk (polling with interval)
const syncData41 = createAsyncThunk("ex41/sync", async (_, { getState }) => {
  const s = getState() as ReturnType<typeof store41.getState>;
  await delay(800);
  return { value: Math.floor(Math.random() * 1000), version: s.version + 1, syncedAt: new Date().toLocaleTimeString() };
});
const slice41 = createSlice({ name: "ex41", initialState: { value: 0, version: 0, syncedAt: "", syncing: false, syncCount: 0 }, reducers: { startSync: s => { s.syncing = true; }, stopSync: s => { s.syncing = false; } }, extraReducers: b => b.addCase(syncData41.fulfilled, (s, a) => { s.value = a.payload.value; s.version = a.payload.version; s.syncedAt = a.payload.syncedAt; s.syncCount++; }) });
const store41 = configureStore({ reducer: slice41.reducer });
function Ex41_Name() { return <Provider store={store41}><Ex41_Inner /></Provider>; }
function Ex41_Inner() {
  const { value, version, syncedAt, syncing, syncCount } = useSelector((s: ReturnType<typeof store41.getState>) => s);
  const d = useDispatch();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const start = () => { d(slice41.actions.startSync()); d(syncData41()); intervalRef.current = setInterval(() => d(syncData41()), 3000); };
  const stop = () => { clearInterval(intervalRef.current); d(slice41.actions.stopSync()); };
  useEffect(() => () => clearInterval(intervalRef.current), []);
  return <div><p>Value: <strong>{value}</strong> v{version} | Syncs: {syncCount}</p>{syncedAt && <p style={{ fontSize: 11 }}>Last sync: {syncedAt}</p>}<div style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: syncing ? "#4caf50" : "#ccc", marginRight: 8 }} /><button onClick={start} disabled={syncing}>Start Sync</button><button onClick={stop} disabled={!syncing}>Stop</button></div>;
}

// 42. Thunk with exponential backoff retry
const fetchWithBackoff42 = createAsyncThunk("ex42/fetch", async (_, { dispatch }) => {
  let attempt = 0;
  const maxAttempts = 4;
  while (attempt < maxAttempts) {
    attempt++;
    await delay(Math.pow(2, attempt - 1) * 200);
    dispatch(slice42.actions.setAttempt(attempt));
    if (attempt < maxAttempts) continue; // Force failure until last attempt
    return { data: "Eventually succeeded!", attempts: attempt };
  }
  throw new Error("Max retries exceeded");
});
const slice42 = createSlice({ name: "ex42", initialState: { data: "", attempt: 0, status: "idle", backoffMs: [] as number[] }, reducers: { setAttempt: (s, a: PayloadAction<number>) => { s.attempt = a.payload; const backoff = Math.pow(2, a.payload - 1) * 200; s.backoffMs.push(backoff); }, reset: () => ({ data: "", attempt: 0, status: "idle", backoffMs: [] }) }, extraReducers: b => b.addCase(fetchWithBackoff42.pending, s => { s.status = "retrying"; s.backoffMs = []; }).addCase(fetchWithBackoff42.fulfilled, (s, a) => { s.data = a.payload.data; s.status = "success"; }).addCase(fetchWithBackoff42.rejected, s => { s.status = "failed"; }) });
const store42 = configureStore({ reducer: slice42.reducer });
function Ex42_Name() { return <Provider store={store42}><Ex42_Inner /></Provider>; }
function Ex42_Inner() {
  const { data, attempt, status, backoffMs } = useSelector((s: ReturnType<typeof store42.getState>) => s);
  const d = useDispatch();
  return <div><p>Status: {status} | Attempt: {attempt}/4</p>{data && <p style={{ color: "green" }}>{data}</p>}<p style={{ fontSize: 11 }}>Backoff: {backoffMs.map(ms => `${ms}ms`).join(" → ")}</p><button onClick={() => d(fetchWithBackoff42())} disabled={status === "retrying"}>Fetch with Backoff</button><button onClick={() => d(slice42.actions.reset())}>Reset</button></div>;
}

// 43. Thunk with request queue
const queue43: Array<() => Promise<void>> = [];
let processing43 = false;
const processQueue43 = async (dispatch: (a: unknown) => void) => {
  if (processing43 || queue43.length === 0) return;
  processing43 = true;
  while (queue43.length > 0) { const task = queue43.shift(); await task?.(); }
  processing43 = false;
  dispatch(slice43.actions.setProcessing(false));
};
const enqueueRequest43 = createAsyncThunk("ex43/enqueue", async (task: string, { dispatch }) => {
  return new Promise<string>(resolve => {
    queue43.push(async () => { dispatch(slice43.actions.addLog(`Processing: ${task}`)); await delay(500); dispatch(slice43.actions.addLog(`Done: ${task}`)); resolve(task); });
    if (!processing43) { dispatch(slice43.actions.setProcessing(true)); processQueue43(dispatch); }
  });
});
const slice43 = createSlice({ name: "ex43", initialState: { log: [] as string[], processing: false, queueLength: 0 }, reducers: { addLog: (s, a: PayloadAction<string>) => { s.log.unshift(a.payload); if (s.log.length > 8) s.log.pop(); }, setProcessing: (s, a: PayloadAction<boolean>) => { s.processing = a.payload; } } });
const store43 = configureStore({ reducer: slice43.reducer });
function Ex43_Name() { return <Provider store={store43}><Ex43_Inner /></Provider>; }
function Ex43_Inner() {
  const { log, processing } = useSelector((s: ReturnType<typeof store43.getState>) => s);
  const d = useDispatch();
  const tasks = ["Task A", "Task B", "Task C"];
  return <div><div style={{ display: "flex", gap: 4 }}>{tasks.map(t => <button key={t} onClick={() => d(enqueueRequest43(t))}>{t}</button>)}</div>{processing && <p>Queue processing... ({queue43.length} remaining)</p>}<ul style={{ fontSize: 11 }}>{log.map((l, i) => <li key={i}>{l}</li>)}</ul></div>;
}

// 44. Thunk condition + idempotency
const idempotentFetch44 = createAsyncThunk("ex44/fetch", async (key: string) => { await delay(700); return { key, value: `${key}_${Date.now()}` }; }, {
  condition: (key, { getState }) => {
    const s = getState() as ReturnType<typeof store44.getState>;
    return !s.data[key] && !s.loading[key]; // Don't fetch if already loaded or loading
  }
});
const slice44 = createSlice({ name: "ex44", initialState: { data: {} as Record<string, string>, loading: {} as Record<string, boolean>, skips: 0 }, reducers: { clear: (s, a: PayloadAction<string>) => { delete s.data[a.payload]; } }, extraReducers: b => b.addCase(idempotentFetch44.pending, (s, a) => { s.loading[a.meta.arg] = true; }).addCase(idempotentFetch44.fulfilled, (s, a) => { s.data[a.payload.key] = a.payload.value; delete s.loading[a.payload.key]; }).addCase(idempotentFetch44.rejected, (s, a) => { if (a.meta.condition === false) s.skips++; delete s.loading[a.meta.arg]; }) });
const store44 = configureStore({ reducer: slice44.reducer });
type RS44 = ReturnType<typeof store44.getState>;
function Ex44_Name() { return <Provider store={store44}><Ex44_Inner /></Provider>; }
function Ex44_Inner() {
  const { data, loading, skips } = useSelector((s: RS44) => s);
  const d = useDispatch();
  const keys = ["users", "settings", "dashboard"];
  return <div><p>Skips (idempotency): {skips}</p><div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{keys.map(k => <div key={k}><button onClick={() => d(idempotentFetch44(k))} disabled={!!loading[k]}>{loading[k] ? `Loading ${k}...` : `Fetch ${k} (idempotent)`}</button>{data[k] && <button onClick={() => d(slice44.actions.clear(k))}>Clear</button>}</div>)}</div><ul style={{ fontSize: 11 }}>{Object.entries(data).map(([k, v]) => <li key={k}>{k}: {v.slice(-8)}</li>)}</ul></div>;
}

// 45. Thunk with cancellation token
const fetchWithToken45 = createAsyncThunk("ex45/fetch", async (token: string, { signal }) => {
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, 1500);
    signal.addEventListener("abort", () => { clearTimeout(timer); reject(new DOMException("Cancelled", "AbortError")); });
  });
  return `Token ${token}: completed`;
});
const slice45 = createSlice({ name: "ex45", initialState: { results: [] as string[], active: {} as Record<string, boolean>, cancelled: 0 }, reducers: { addResult: (s, a: PayloadAction<string>) => { s.results.unshift(a.payload); }, cancel: (s, a: PayloadAction<string>) => { delete s.active[a.payload]; s.cancelled++; } }, extraReducers: b => b.addCase(fetchWithToken45.pending, (s, a) => { s.active[a.meta.arg] = true; }).addCase(fetchWithToken45.fulfilled, (s, a) => { delete s.active[a.meta.arg]; s.results.unshift(a.payload); }).addCase(fetchWithToken45.rejected, (s, a) => { delete s.active[a.meta.arg]; if (a.error.name === "AbortError") s.cancelled++; }) });
const store45 = configureStore({ reducer: slice45.reducer });
function Ex45_Name() { return <Provider store={store45}><Ex45_Inner /></Provider>; }
function Ex45_Inner() {
  const { results, active, cancelled } = useSelector((s: ReturnType<typeof store45.getState>) => s);
  const d = useDispatch();
  const thunks: Record<string, ReturnType<typeof fetchWithToken45>> = {};
  const start = (token: string) => { thunks[token] = d(fetchWithToken45(token)); };
  const cancel = (token: string) => { thunks[token]?.abort(); d(slice45.actions.cancel(token)); };
  const tokens = ["req-A", "req-B", "req-C"];
  return <div><p>Cancelled: {cancelled}</p><div>{tokens.map(t => <div key={t} style={{ display: "flex", gap: 4, marginTop: 2 }}><button onClick={() => start(t)} disabled={!!active[t]}>Start {t}</button><button onClick={() => cancel(t)} disabled={!active[t]}>Cancel {t}</button>{active[t] && <span>running...</span>}</div>)}</div><ul style={{ fontSize: 11 }}>{results.slice(0, 5).map((r, i) => <li key={i}>{r}</li>)}</ul></div>;
}

// 46. Mutation thunk with optimistic rollback
const mutateData46 = createAsyncThunk("ex46/mutate", async ({ id, changes }: { id: number; changes: Record<string, unknown> }, { rejectWithValue }) => {
  await delay(1000);
  if (shouldFail(40)) return rejectWithValue({ id, reason: "Conflict detected" });
  return { id, ...changes, updatedAt: new Date().toISOString() };
});
const slice46 = createSlice({ name: "ex46", initialState: { records: [{ id: 1, name: "Alice", score: 90 }, { id: 2, name: "Bob", score: 75 }] as { id: number; name: string; score: number }[], snapshots: {} as Record<number, unknown>, errors: {} as Record<number, string> }, reducers: { optimistic: (s, a: PayloadAction<{ id: number; changes: Record<string, unknown> }>) => { const r = s.records.find(r => r.id === a.payload.id); if (r) { s.snapshots[a.payload.id] = { ...r }; Object.assign(r, a.payload.changes); } }, rollback: (s, a: PayloadAction<{ id: number; reason: string }>) => { const snap = s.snapshots[a.payload.id]; if (snap) { const r = s.records.find(r => r.id === a.payload.id); if (r) Object.assign(r, snap); delete s.snapshots[a.payload.id]; } s.errors[a.payload.id] = a.payload.reason; }, commit: (s, a: PayloadAction<number>) => { delete s.snapshots[a.payload]; delete s.errors[a.payload]; } } });
const store46 = configureStore({ reducer: slice46.reducer });
function Ex46_Name() { return <Provider store={store46}><Ex46_Inner /></Provider>; }
function Ex46_Inner() {
  const { records, snapshots, errors } = useSelector((s: ReturnType<typeof store46.getState>) => s);
  const d = useDispatch();
  const update = (id: number) => {
    const changes = { score: Math.floor(Math.random() * 100) };
    d(slice46.actions.optimistic({ id, changes }));
    d(mutateData46({ id, changes })).then(result => {
      if (mutateData46.fulfilled.match(result)) d(slice46.actions.commit(id));
      else d(slice46.actions.rollback({ id, reason: (result.payload as { reason: string }).reason }));
    });
  };
  return <div><ul>{records.map(r => <li key={r.id} style={{ background: snapshots[r.id] ? "#fff9c4" : errors[r.id] ? "#ffcdd2" : "#c8e6c9", padding: 4, marginTop: 2 }}>{r.name}: {r.score} {snapshots[r.id] ? "(saving...)" : errors[r.id] ? `(error: ${errors[r.id]})` : "(saved)"} <button onClick={() => update(r.id)} disabled={!!snapshots[r.id]}>Update (60% success)</button></li>)}</ul></div>;
}

// 47. Thunk with WebSocket simulation
const connectWS47 = createAsyncThunk("ex47/connect", async (_, { dispatch, signal }) => {
  dispatch(slice47.actions.setConnected(true));
  const users = ["Alice", "Bob", "Carol"];
  const msgs = ["Hello!", "Anyone there?", "Just deployed!", "Found a bug", "Fixed it!"];
  const interval = setInterval(() => {
    dispatch(slice47.actions.receive({ user: users[Math.floor(Math.random() * users.length)], text: msgs[Math.floor(Math.random() * msgs.length)], time: new Date().toLocaleTimeString() }));
  }, 1500);
  await new Promise<void>(resolve => signal.addEventListener("abort", () => { clearInterval(interval); resolve(); }));
  dispatch(slice47.actions.setConnected(false));
  return "disconnected";
});
const slice47 = createSlice({ name: "ex47", initialState: { connected: false, messages: [] as { user: string; text: string; time: string }[] }, reducers: { setConnected: (s, a: PayloadAction<boolean>) => { s.connected = a.payload; }, receive: (s, a: PayloadAction<{ user: string; text: string; time: string }>) => { s.messages.unshift(a.payload); if (s.messages.length > 8) s.messages.pop(); } } });
const store47 = configureStore({ reducer: slice47.reducer });
function Ex47_Name() { return <Provider store={store47}><Ex47_Inner /></Provider>; }
function Ex47_Inner() {
  const { connected, messages } = useSelector((s: ReturnType<typeof store47.getState>) => s);
  const d = useDispatch();
  const wsRef = useRef<ReturnType<typeof connectWS47> | null>(null);
  const connect = () => { wsRef.current = d(connectWS47()); };
  const disconnect = () => { wsRef.current?.abort(); };
  return <div><div style={{ display: "flex", gap: 4, alignItems: "center" }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: connected ? "#4caf50" : "#ccc" }} /><span>{connected ? "Connected" : "Disconnected"}</span><button onClick={connect} disabled={connected}>Connect</button><button onClick={disconnect} disabled={!connected}>Disconnect</button></div><ul style={{ maxHeight: 120, overflowY: "auto", fontSize: 12 }}>{messages.map((m, i) => <li key={i}><strong>{m.user}</strong>: {m.text} <span style={{ fontSize: 10, color: "#999" }}>{m.time}</span></li>)}</ul></div>;
}

// 48. Complex async flow (auth → fetch user → fetch data)
const fullFlow48 = createAsyncThunk("ex48/fullFlow", async (creds: { user: string; pass: string }, { dispatch, rejectWithValue }) => {
  // Step 1: Auth
  dispatch(slice48.actions.setStep("Authenticating..."));
  await delay(500);
  if (creds.pass !== "pass123") return rejectWithValue("Invalid credentials");
  // Step 2: Fetch user
  dispatch(slice48.actions.setStep("Fetching user profile..."));
  await delay(500);
  const user = { id: 1, name: creds.user, role: "admin" };
  // Step 3: Fetch data
  dispatch(slice48.actions.setStep("Loading dashboard data..."));
  await delay(700);
  const data = ["Widget Analytics", "Revenue Chart", "User Growth"];
  return { user, data };
});
const slice48 = createSlice({ name: "ex48", initialState: { step: "", user: null as { id: number; name: string; role: string } | null, data: [] as string[], loading: false, error: "" }, reducers: { setStep: (s, a: PayloadAction<string>) => { s.step = a.payload; }, reset: () => ({ step: "", user: null, data: [], loading: false, error: "" }) }, extraReducers: b => b.addCase(fullFlow48.pending, s => { s.loading = true; s.error = ""; }).addCase(fullFlow48.fulfilled, (s, a) => { s.user = a.payload.user; s.data = a.payload.data; s.loading = false; s.step = "Done!"; }).addCase(fullFlow48.rejected, (s, a) => { s.error = a.payload as string; s.loading = false; s.step = ""; }) });
const store48 = configureStore({ reducer: slice48.reducer });
function Ex48_Name() { return <Provider store={store48}><Ex48_Inner /></Provider>; }
function Ex48_Inner() {
  const { step, user, data, loading, error } = useSelector((s: ReturnType<typeof store48.getState>) => s);
  const d = useDispatch();
  const [creds, setCreds] = useState({ user: "alice", pass: "pass123" });
  if (user) return <div><p>Welcome {user.name} ({user.role})</p><ul>{data.map(d2 => <li key={d2}>{d2}</li>)}</ul><button onClick={() => d(slice48.actions.reset())}>Logout</button></div>;
  return <div>{loading && <p>Step: {step}</p>}{error && <p style={{ color: "red" }}>{error}</p>}<input value={creds.user} onChange={e => setCreds(p => ({ ...p, user: e.target.value }))} placeholder="Username" style={{ display: "block", margin: "4px 0" }} /><input type="password" value={creds.pass} onChange={e => setCreds(p => ({ ...p, pass: e.target.value }))} placeholder="Password (pass123)" style={{ display: "block", margin: "4px 0" }} /><button onClick={() => d(fullFlow48(creds))} disabled={loading}>{loading ? "..." : "Login"}</button></div>;
}

// 49. Thunk with entity adapter integration
const fetchEntities49 = createAsyncThunk("ex49/fetchAll", async () => { await delay(700); return [{ id: 1, name: "Entity A", value: 10, active: true }, { id: 2, name: "Entity B", value: 20, active: false }, { id: 3, name: "Entity C", value: 30, active: true }]; });
const updateEntity49 = createAsyncThunk("ex49/update", async ({ id, value }: { id: number; value: number }) => { await delay(400); return { id, value }; });
const adapter49 = createEntityAdapter<{ id: number; name: string; value: number; active: boolean }>();
const slice49 = createSlice({ name: "ex49", initialState: adapter49.getInitialState({ loading: false, updatingId: null as number | null }), reducers: {}, extraReducers: b => b.addCase(fetchEntities49.pending, s => { s.loading = true; }).addCase(fetchEntities49.fulfilled, (s, a) => { adapter49.setAll(s, a.payload); s.loading = false; }).addCase(updateEntity49.pending, (s, a) => { s.updatingId = a.meta.arg.id; }).addCase(updateEntity49.fulfilled, (s, a) => { adapter49.updateOne(s, { id: a.payload.id, changes: { value: a.payload.value } }); s.updatingId = null; }) });
const store49 = configureStore({ reducer: slice49.reducer });
type RS49 = ReturnType<typeof store49.getState>;
const sel49 = adapter49.getSelectors((s: RS49) => s);
function Ex49_Name() { return <Provider store={store49}><Ex49_Inner /></Provider>; }
function Ex49_Inner() {
  const entities = useSelector(sel49.selectAll);
  const { loading, updatingId } = useSelector((s: RS49) => ({ loading: s.loading, updatingId: s.updatingId }));
  const d = useDispatch();
  return <div><button onClick={() => d(fetchEntities49())} disabled={loading}>{loading ? "Loading..." : "Fetch Entities"}</button><ul>{entities.map(e => <li key={e.id} style={{ color: e.active ? "inherit" : "#999" }}>{e.name}: {e.value} <button onClick={() => d(updateEntity49({ id: e.id, value: e.value + 5 }))} disabled={updatingId === e.id}>{updatingId === e.id ? "..." : "+5"}</button></li>)}</ul></div>;
}

// 50. Full async app (CRUD with loading/error/success, pagination, search)
const adapter50 = createEntityAdapter<{ id: number; title: string; category: string; done: boolean }>();
const fetchItems50 = createAsyncThunk("ex50/fetch", async ({ page, search }: { page: number; search: string }) => {
  await delay(700);
  const all = Array.from({ length: 20 }, (_, i) => ({ id: i + 1, title: `Task ${i + 1}`, category: i % 3 === 0 ? "work" : i % 3 === 1 ? "personal" : "shopping", done: i % 4 === 0 }));
  const filtered = all.filter(i => i.title.toLowerCase().includes(search.toLowerCase()) || i.category.includes(search.toLowerCase()));
  const pageSize = 5;
  return { items: filtered.slice((page - 1) * pageSize, page * pageSize), total: filtered.length, pageSize };
});
const createItem50 = createAsyncThunk("ex50/create", async (title: string) => { await delay(400); return { id: Date.now(), title, category: "personal", done: false }; });
const toggleItem50 = createAsyncThunk("ex50/toggle", async (id: number, { getState }) => { await delay(300); const s = (getState() as ReturnType<typeof store50.getState>); const item = s.entities[id]; return { id, done: !item?.done }; });
const slice50 = createSlice({ name: "ex50", initialState: adapter50.getInitialState({ loading: false, creating: false, page: 1, search: "", total: 0, pageSize: 5, togglingId: null as number | null, lastError: "" }), reducers: { setPage: (s, a: PayloadAction<number>) => { s.page = a.payload; }, setSearch: (s, a: PayloadAction<string>) => { s.search = a.payload; s.page = 1; } }, extraReducers: b => b
  .addCase(fetchItems50.pending, s => { s.loading = true; s.lastError = ""; })
  .addCase(fetchItems50.fulfilled, (s, a) => { adapter50.setAll(s, a.payload.items); s.total = a.payload.total; s.loading = false; })
  .addCase(fetchItems50.rejected, (s, a) => { s.loading = false; s.lastError = a.error.message ?? "Error"; })
  .addCase(createItem50.pending, s => { s.creating = true; })
  .addCase(createItem50.fulfilled, (s, a) => { adapter50.addOne(s, a.payload); s.total++; s.creating = false; })
  .addCase(toggleItem50.pending, (s, a) => { s.togglingId = a.meta.arg; })
  .addCase(toggleItem50.fulfilled, (s, a) => { adapter50.updateOne(s, { id: a.payload.id, changes: { done: a.payload.done } }); s.togglingId = null; })
});
const store50 = configureStore({ reducer: slice50.reducer });
type RS50 = ReturnType<typeof store50.getState>;
const sel50 = adapter50.getSelectors((s: RS50) => s);
function Ex50_Name() { return <Provider store={store50}><Ex50_Inner /></Provider>; }
function Ex50_Inner() {
  const entities = useSelector(sel50.selectAll);
  const { loading, creating, page, search, total, pageSize, togglingId, lastError } = useSelector((s: RS50) => ({ loading: s.loading, creating: s.creating, page: s.page, search: s.search, total: s.total, pageSize: s.pageSize, togglingId: s.togglingId, lastError: s.lastError }));
  const d = useDispatch();
  const [newTitle, setNewTitle] = useState("");
  const totalPages = Math.ceil(total / pageSize);
  useEffect(() => { d(fetchItems50({ page, search })); }, [d, page, search]);
  return <div style={{ fontFamily: "sans-serif" }}><div style={{ display: "flex", gap: 4, marginBottom: 8 }}><input value={search} onChange={e => d(slice50.actions.setSearch(e.target.value))} placeholder="Search tasks..." /><input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="New task..." /><button onClick={() => { if (newTitle) { d(createItem50(newTitle)); setNewTitle(""); } }} disabled={creating}>{creating ? "Adding..." : "Add"}</button></div>{lastError && <p style={{ color: "red" }}>{lastError}</p>}{loading ? <p>Loading...</p> : <ul>{entities.map(e => <li key={e.id} style={{ textDecoration: e.done ? "line-through" : "none", color: e.done ? "#999" : "inherit", padding: 4, borderBottom: "1px solid #eee" }}><span onClick={() => d(toggleItem50(e.id))} style={{ cursor: "pointer" }}>{togglingId === e.id ? "..." : e.done ? "✓" : "○"} {e.title}</span> <span style={{ fontSize: 10, background: "#e0e0e0", borderRadius: 4, padding: "0 4px" }}>{e.category}</span></li>)}</ul>}<div style={{ display: "flex", gap: 4, marginTop: 8 }}><button onClick={() => d(slice50.actions.setPage(page - 1))} disabled={page === 1}>Prev</button><span>Page {page}/{totalPages || "?"} ({total} total)</span><button onClick={() => d(slice50.actions.setPage(page + 1))} disabled={page >= totalPages}>Next</button></div></div>;
}

// ─── EXPORT ────────────────────────────────────────────────────────────────────

export default function AsyncThunksExamples() {
  const sections = [
    { label: "BASIC", examples: [{ n: "01", C: Ex01_Name, title: "createAsyncThunk basic" }, { n: "02", C: Ex02_Name, title: "Loading state" }, { n: "03", C: Ex03_Name, title: "Success state" }, { n: "04", C: Ex04_Name, title: "Error state" }, { n: "05", C: Ex05_Name, title: "Dispatch from button" }, { n: "06", C: Ex06_Name, title: "Thunk with payload" }, { n: "07", C: Ex07_Name, title: "Simulated fetch" }, { n: "08", C: Ex08_Name, title: "pending/fulfilled/rejected" }, { n: "09", C: Ex09_Name, title: "Thunk with cleanup" }, { n: "10", C: Ex10_Name, title: "Thunk with argument" }, { n: "11", C: Ex11_Name, title: "Condition (skip if loading)" }, { n: "12", C: Ex12_Name, title: "Thunk return value" }] },
    { label: "INTERMEDIATE", examples: [{ n: "13", C: Ex13_Name, title: "Fetch user" }, { n: "14", C: Ex14_Name, title: "Fetch list + loading" }, { n: "15", C: Ex15_Name, title: "Create item (POST)" }, { n: "16", C: Ex16_Name, title: "Delete item" }, { n: "17", C: Ex17_Name, title: "Update item" }, { n: "18", C: Ex18_Name, title: "Error with rejectWithValue" }, { n: "19", C: Ex19_Name, title: "Retry thunk" }, { n: "20", C: Ex20_Name, title: "AbortController" }, { n: "21", C: Ex21_Name, title: "getState in thunk" }, { n: "22", C: Ex22_Name, title: "Nested dispatch" }, { n: "23", C: Ex23_Name, title: "Sequential thunks" }, { n: "24", C: Ex24_Name, title: "Pagination thunk" }, { n: "25", C: Ex25_Name, title: "Search/filter params" }] },
    { label: "NESTED", examples: [{ n: "26", C: Ex26_Name, title: "Fetch + normalize" }, { n: "27", C: Ex27_Name, title: "Multi-action dispatch" }, { n: "28", C: Ex28_Name, title: "Optimistic + rollback" }, { n: "29", C: Ex29_Name, title: "Dependent requests" }, { n: "30", C: Ex30_Name, title: "Parallel (Promise.all)" }, { n: "31", C: Ex31_Name, title: "Polling thunk" }, { n: "32", C: Ex32_Name, title: "Cache check" }, { n: "33", C: Ex33_Name, title: "Request deduplication" }, { n: "34", C: Ex34_Name, title: "Loading skeleton" }, { n: "35", C: Ex35_Name, title: "File upload simulation" }, { n: "36", C: Ex36_Name, title: "Progress tracking" }, { n: "37", C: Ex37_Name, title: "Thunk with undo" }] },
    { label: "ADVANCED", examples: [{ n: "38", C: Ex38_Name, title: "TypedThunkAPI" }, { n: "39", C: Ex39_Name, title: "Thunk factory" }, { n: "40", C: Ex40_Name, title: "Infinite scroll" }, { n: "41", C: Ex41_Name, title: "Realtime polling sync" }, { n: "42", C: Ex42_Name, title: "Exponential backoff" }, { n: "43", C: Ex43_Name, title: "Request queue" }, { n: "44", C: Ex44_Name, title: "Condition + idempotency" }, { n: "45", C: Ex45_Name, title: "Cancellation token" }, { n: "46", C: Ex46_Name, title: "Mutation + rollback" }, { n: "47", C: Ex47_Name, title: "WebSocket simulation" }, { n: "48", C: Ex48_Name, title: "Complex auth flow" }, { n: "49", C: Ex49_Name, title: "Entity adapter integration" }, { n: "50", C: Ex50_Name, title: "Full async CRUD app" }] },
  ];
  return (
    <div style={{ fontFamily: "sans-serif", padding: 16 }}>
      <h1>Async Thunks — 50 Examples</h1>
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
