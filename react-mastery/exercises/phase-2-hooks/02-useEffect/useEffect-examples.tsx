import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────
// BASIC (1–12)
// ─────────────────────────────────────────

function Ex01_LogOnMount() {
  useEffect(() => { console.log("Mounted"); return () => console.log("Unmounted"); }, []);
  return <p>Check console — logs on mount & unmount</p>;
}

function Ex02_DocumentTitle() {
  const [count, setCount] = useState(0);
  useEffect(() => { document.title = `Count: ${count}`; }, [count]);
  return <div><p>Count: {count} (check tab title)</p><button onClick={() => setCount(count + 1)}>+</button></div>;
}

function Ex03_RunEveryRender() {
  const [val, setVal] = useState(0);
  useEffect(() => { console.log("Effect ran, val =", val); }); // no deps = every render
  return <div><p>Val: {val}</p><button onClick={() => setVal(val + 1)}>+</button></div>;
}

function Ex04_RunOnce() {
  const [data, setData] = useState("");
  useEffect(() => {
    setData("Loaded on mount only");
  }, []); // empty deps = once
  return <p>{data}</p>;
}

// very very important
function Ex05_CleanupTimeout() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1000);
    return () => clearTimeout(t); // cleanup on unmount
  }, []);
  return <p>{visible ? "Appeared after 1s!" : "Waiting 1 second..."}</p>;
}

function Ex06_CleanupInterval() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setCount((c) => c + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return <p>Seconds elapsed: {count}</p>;
}

function Ex07_WindowResize() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return <p>Window width: {width}px (resize browser)</p>;
}

// Bad me krna he
function Ex08_MousePosition() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);
  return <p>Mouse: {pos.x}, {pos.y}</p>;
}

function Ex09_OnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  return <p style={{ color: online ? "green" : "red" }}>{online ? "Online ✅" : "Offline ❌"}</p>;
}

function Ex10_KeyPress() {
  const [key, setKey] = useState("");
  useEffect(() => {
    const handler = (e: KeyboardEvent) => setKey(e.key);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  return <p>Last key pressed: <b>{key || "none"}</b> (press a key)</p>;
}

function Ex11_PageVisibility() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const handler = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);
  return <p>Page is: {visible ? "Visible 👀" : "Hidden"}</p>;
}

function Ex12_ScrollPosition() {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);
  return <p>Scroll Y: {scrollY}px</p>;
}

// ─────────────────────────────────────────
// INTERMEDIATE (13–25)
// ─────────────────────────────────────────

function Ex13_FetchOnMount() {
  const [post, setPost] = useState<{ title: string } | null>(null);
  useEffect(() => {
    fetch("https://jsonplaceholder.typicode.com/posts/1").then((r) => r.json()).then(setPost);
  }, []);
  return <p>{post ? post.title : "Loading..."}</p>;
}

function Ex14_FetchWithId() {
  const [id, setId] = useState(1);
  const [post, setPost] = useState<{ title: string } | null>(null);
  useEffect(() => {
    setPost(null);
    fetch(`https://jsonplaceholder.typicode.com/posts/${id}`).then((r) => r.json()).then(setPost);
  }, [id]);
  return (
    <div>
      <button disabled={id === 1} onClick={() => setId(id - 1)}>Prev</button>
      <span> Post #{id} </span>
      <button onClick={() => setId(id + 1)}>Next</button>
      <p>{post ? post.title : "Loading..."}</p>
    </div>
  );
}

function Ex15_LoadingState() {
  const [data, setData] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    fetch("https://jsonplaceholder.typicode.com/posts/1")
      .then((r) => r.json())
      .then((d) => { setData(d.title); setLoading(false); });
  }, []);
  return <p>{loading ? "⏳ Loading..." : data}</p>;
}

function Ex16_ErrorHandling() {
  const [data, setData] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("https://jsonplaceholder.typicode.com/posts/1")
      .then((r) => { if (!r.ok) throw new Error("Failed"); return r.json(); })
      .then((d) => setData(d.title))
      .catch((e) => setError(e.message));
  }, []);
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
  return <p>{data || "Loading..."}</p>;
}

function Ex17_Debounce() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState("");
  useEffect(() => {
    if (!query) return;
    const t = setTimeout(() => setResult(`Searched: "${query}"`), 500);
    return () => clearTimeout(t);
  }, [query]);
  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type to search..." />
      <p>{result}</p>
    </div>
  );
}

function Ex18_LocalStorageSync() {
  const [name, setName] = useState(() => localStorage.getItem("ex18") ?? "");
  useEffect(() => { localStorage.setItem("ex18", name); }, [name]);
  return <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Synced to localStorage" />;
}

function Ex19_CountdownTimer() {
  const [seconds, setSeconds] = useState(10);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running || seconds <= 0) return;
    const id = setTimeout(() => setSeconds(seconds - 1), 1000);
    return () => clearTimeout(id);
  }, [running, seconds]);
  return (
    <div>
      <p style={{ fontSize: 32 }}>{seconds}s</p>
      <button onClick={() => setRunning(!running)}>{running ? "Pause" : "Start"}</button>
      <button onClick={() => { setRunning(false); setSeconds(10); }}>Reset</button>
    </div>
  );
}

function Ex20_SkipFirstRender() {
  const [count, setCount] = useState(0);
  const isMounted = useRef(false);
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return; }
    console.log("Effect skipped first render, count:", count);
  }, [count]);
  return <div><p>Count: {count}</p><button onClick={() => setCount(count + 1)}>+ (logs after first click)</button></div>;
}

function Ex21_MultipleDeps() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  useEffect(() => {
    setLog((prev) => [...prev.slice(-3), `a=${a}, b=${b}`]);
  }, [a, b]);
  return (
    <div>
      <button onClick={() => setA(a + 1)}>A: {a}</button>
      <button onClick={() => setB(b + 1)}>B: {b}</button>
      <ul>{log.map((l, i) => <li key={i}>{l}</li>)}</ul>
    </div>
  );
}

function Ex22_AutoFocus() {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  return <input ref={inputRef} placeholder="Auto-focused on mount" />;
}

function Ex23_Polling() {
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(id);
  }, []);
  return <p>Current time: {time}</p>;
}

function Ex24_DependencyArray() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState("");
  useEffect(() => {
    console.log("Only runs when count changes:", count);
  }, [count]); // text changes don't trigger this
  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Count: {count} (triggers effect)</button>
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Does NOT trigger effect" />
    </div>
  );
}

function Ex25_ExternalScript() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    // Simulate dynamic script loading
    const timer = setTimeout(() => setLoaded(true), 500);
    return () => clearTimeout(timer);
  }, []);
  return <p>External resource: {loaded ? "✅ Loaded" : "⏳ Loading..."}</p>;
}

// ─────────────────────────────────────────
// NESTED (26–37)
// ─────────────────────────────────────────

function Ex26_ChainedEffects() {
  const [step, setStep] = useState(0);
  const [result, setResult] = useState("");
  useEffect(() => { if (step === 1) setTimeout(() => setStep(2), 500); }, [step]);
  useEffect(() => { if (step === 2) setTimeout(() => setStep(3), 500); }, [step]);
  useEffect(() => { if (step === 3) setResult("All done!"); }, [step]);
  return (
    <div>
      <button onClick={() => setStep(1)} disabled={step > 0}>Start chain</button>
      <p>Step: {step} {result && `— ${result}`}</p>
    </div>
  );
}

function Ex27_ConditionalEffect() {
  const [enabled, setEnabled] = useState(false);
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => setCount((c) => c + 1), 1000);
    return () => clearInterval(id);
  }, [enabled]);
  return (
    <div>
      <label><input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> Enable timer</label>
      <p>Count: {count}</p>
    </div>
  );
}

function Ex28_EffectWithReducedState() {
  const [posts, setPosts] = useState<{ id: number; title: string }[]>([]);
  const [userId, setUserId] = useState(1);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    fetch(`https://jsonplaceholder.typicode.com/posts?userId=${userId}&_limit=3`)
      .then((r) => r.json())
      .then((d) => { setPosts(d); setLoading(false); });
  }, [userId]);
  return (
    <div>
      <select value={userId} onChange={(e) => setUserId(+e.target.value)}>
        {[1, 2, 3].map((id) => <option key={id} value={id}>User {id}</option>)}
      </select>
      {loading ? <p>Loading...</p> : <ul>{posts.map((p) => <li key={p.id}>{p.title}</li>)}</ul>}
    </div>
  );
}

function Ex29_EffectAndCallback() {
  const [messages, setMessages] = useState<string[]>([]);
  const addMessage = (msg: string) => setMessages((prev) => [...prev.slice(-4), msg]);
  useEffect(() => {
    addMessage("Component mounted");
    return () => addMessage("Component unmounting...");
  }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => addMessage(`Key: ${e.key}`);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  return <div><p>Event log:</p>{messages.map((m, i) => <p key={i}>• {m}</p>)}</div>;
}

function Ex30_NestedFetch() {
  const [userId, setUserId] = useState(1);
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [posts, setPosts] = useState<{ id: number; title: string }[]>([]);
  useEffect(() => {
    setUser(null); setPosts([]);
    fetch(`https://jsonplaceholder.typicode.com/users/${userId}`)
      .then((r) => r.json()).then(setUser);
    fetch(`https://jsonplaceholder.typicode.com/posts?userId=${userId}&_limit=2`)
      .then((r) => r.json()).then(setPosts);
  }, [userId]);
  return (
    <div>
      <select value={userId} onChange={(e) => setUserId(+e.target.value)}>
        {[1, 2, 3].map((id) => <option key={id} value={id}>User {id}</option>)}
      </select>
      <p>User: {user?.name ?? "Loading..."}</p>
      <ul>{posts.map((p) => <li key={p.id}>{p.title}</li>)}</ul>
    </div>
  );
}

function Ex31_PrevVsCurrentEffect() {
  const [count, setCount] = useState(0);
  const prevRef = useRef(0);
  useEffect(() => {
    console.log(`Changed from ${prevRef.current} to ${count}`);
    prevRef.current = count;
  }, [count]);
  return <div><p>Count: {count} | Prev: {prevRef.current}</p><button onClick={() => setCount(count + 1)}>+</button></div>;
}

function Ex32_EffectWithAbort() {
  const [id, setId] = useState(1);
  const [data, setData] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setData("Loading...");
    fetch(`https://jsonplaceholder.typicode.com/todos/${id}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => setData(d.title))
      .catch(() => setData("Aborted or error"));
    return () => controller.abort();
  }, [id]);
  return (
    <div>
      <button onClick={() => setId(id + 1)}>Next (id: {id})</button>
      <p>{data}</p>
    </div>
  );
}

function Ex33_SideEffectWithDOM() {
  const [text, setText] = useState("Hello");
  const divRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (divRef.current) {
      divRef.current.style.color = text.length > 5 ? "red" : "green";
    }
  }, [text]);
  return (
    <div>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <div ref={divRef}>{text}</div>
    </div>
  );
}

function Ex34_IntersectionObserver() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div>
      <div style={{ height: 80, overflow: "auto", border: "1px solid #ccc" }}>
        <div style={{ height: 120 }}>Scroll down</div>
        <div ref={ref} style={{ padding: 8, background: visible ? "#d1fae5" : "#fee2e2" }}>
          {visible ? "Visible ✅" : "Not visible ❌"}
        </div>
      </div>
    </div>
  );
}

function Ex35_ResizeObserver() {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      setSize({ w: Math.round(entry.contentRect.width), h: Math.round(entry.contentRect.height) });
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ padding: 16, background: "#eee", resize: "both", overflow: "auto", minWidth: 100, minHeight: 60 }}>
      {size.w} × {size.h}px — resize me
    </div>
  );
}

function Ex36_BroadcastChannel() {
  const [msg, setMsg] = useState("");
  useEffect(() => {
    const channel = new BroadcastChannel("ex36");
    channel.onmessage = (e) => setMsg(e.data);
    return () => channel.close();
  }, []);
  return (
    <div>
      <button onClick={() => new BroadcastChannel("ex36").postMessage("Hello from tab!")}>Send to other tabs</button>
      <p>Received: {msg || "none"}</p>
    </div>
  );
}

function Ex37_MultiStepEffect() {
  const [phase, setPhase] = useState<"idle" | "init" | "ready">("idle");
  useEffect(() => {
    if (phase !== "init") return;
    const t = setTimeout(() => setPhase("ready"), 800);
    return () => clearTimeout(t);
  }, [phase]);
  return (
    <div>
      <button onClick={() => setPhase("init")} disabled={phase !== "idle"}>Initialize</button>
      <p>Phase: {phase}</p>
      {phase === "ready" && <button onClick={() => setPhase("idle")}>Reset</button>}
    </div>
  );
}

// ─────────────────────────────────────────
// ADVANCED (38–50)
// ─────────────────────────────────────────

function Ex38_RaceCondition() {
  const [id, setId] = useState(1);
  const [data, setData] = useState("");
  useEffect(() => {
    let cancelled = false;
    setData("Loading...");
    fetch(`https://jsonplaceholder.typicode.com/todos/${id}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setData(d.title); });
    return () => { cancelled = true; }; // prevent stale state
  }, [id]);
  return (
    <div>
      <p>Race condition prevention — click fast:</p>
      <button onClick={() => setId(id + 1)}>Next (id: {id})</button>
      <p>{data}</p>
    </div>
  );
}

function Ex39_RetryFetch() {
  const [data, setData] = useState("");
  const [retries, setRetries] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => {
    setError(""); setData("Loading...");
    fetch("https://jsonplaceholder.typicode.com/todos/1")
      .then((r) => r.json())
      .then((d) => setData(d.title))
      .catch(() => setError("Failed. Click retry."));
  }, [retries]);
  return (
    <div>
      {error ? <><p style={{ color: "red" }}>{error}</p><button onClick={() => setRetries(retries + 1)}>Retry ({retries})</button></> : <p>{data}</p>}
    </div>
  );
}

function Ex40_WebSocket() {
  const [messages, setMessages] = useState<string[]>([]);
  useEffect(() => {
    // Simulated websocket with setInterval
    const id = setInterval(() => {
      setMessages((prev) => [...prev.slice(-4), `WS message @ ${new Date().toLocaleTimeString()}`]);
    }, 2000);
    return () => clearInterval(id);
  }, []);
  return <div>{messages.map((m, i) => <p key={i}>• {m}</p>)}</div>;
}

function Ex41_SyncStateToURL() {
  const [tab, setTab] = useState(() => new URLSearchParams(window.location.search).get("tab") ?? "home");
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url);
  }, [tab]);
  return (
    <div>
      {["home", "about", "contact"].map((t) => <button key={t} style={{ fontWeight: tab === t ? "bold" : "normal" }} onClick={() => setTab(t)}>{t}</button>)}
      <p>Active: {tab} (check URL bar)</p>
    </div>
  );
}

function Ex42_AnimationFrame() {
  const [x, setX] = useState(0);
  const rafRef = useRef(0);
  const running = useRef(false);
  const tick = () => {
    setX((v) => (v + 1) % 300);
    rafRef.current = requestAnimationFrame(tick);
  };
  const toggle = () => {
    if (running.current) { cancelAnimationFrame(rafRef.current); running.current = false; }
    else { running.current = true; rafRef.current = requestAnimationFrame(tick); }
  };
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);
  return (
    <div>
      <div style={{ position: "relative", height: 20 }}>
        <div style={{ position: "absolute", left: x, width: 20, height: 20, background: "blue", borderRadius: "50%" }} />
      </div>
      <button onClick={toggle}>Toggle Animation</button>
    </div>
  );
}

function Ex43_InfiniteScroll() {
  const [items, setItems] = useState(Array.from({ length: 10 }, (_, i) => `Item ${i + 1}`));
  const loaderRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setItems((prev) => [...prev, ...Array.from({ length: 5 }, (_, i) => `Item ${prev.length + i + 1}`)]);
      }
    });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [items]);
  return (
    <div style={{ height: 150, overflow: "auto", border: "1px solid #ccc" }}>
      {items.map((item) => <p key={item}>{item}</p>)}
      <div ref={loaderRef}>Loading more...</div>
    </div>
  );
}

function Ex44_MediaQuery() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 600px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return <p>Layout: {isMobile ? "📱 Mobile" : "🖥️ Desktop"} (resize window)</p>;
}

function Ex45_IdleDetection() {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => { setIdle(false); clearTimeout(timer); timer = setTimeout(() => setIdle(true), 3000); };
    window.addEventListener("mousemove", reset);
    window.addEventListener("keydown", reset);
    reset();
    return () => { clearTimeout(timer); window.removeEventListener("mousemove", reset); window.removeEventListener("keydown", reset); };
  }, []);
  return <p style={{ color: idle ? "orange" : "green" }}>{idle ? "😴 Idle (3s no activity)" : "👋 Active"}</p>;
}

function Ex46_BatteryStatus() {
  const [info, setInfo] = useState("Checking...");
  useEffect(() => {
    if (!("getBattery" in navigator)) { setInfo("Battery API not supported"); return; }
    (navigator as Navigator & { getBattery: () => Promise<{ level: number; charging: boolean }> })
      .getBattery().then((b) => setInfo(`Battery: ${Math.round(b.level * 100)}% ${b.charging ? "⚡ charging" : ""}`));
  }, []);
  return <p>{info}</p>;
}

function Ex47_GeolocationOnce() {
  const [loc, setLoc] = useState("");
  useEffect(() => {
    if (!navigator.geolocation) { setLoc("Geolocation not supported"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLoc(`Lat: ${pos.coords.latitude.toFixed(2)}, Lon: ${pos.coords.longitude.toFixed(2)}`),
      () => setLoc("Permission denied")
    );
  }, []);
  return <div><p>{loc || "Requesting location..."}</p></div>;
}

function Ex48_CSSVariableSync() {
  const [hue, setHue] = useState(200);
  useEffect(() => { document.documentElement.style.setProperty("--brand-color", `hsl(${hue}, 70%, 50%)`); }, [hue]);
  return (
    <div>
      <input type="range" min="0" max="360" value={hue} onChange={(e) => setHue(+e.target.value)} />
      <div style={{ background: `hsl(${hue}, 70%, 50%)`, padding: 12, color: "#fff" }}>Hue: {hue}°</div>
    </div>
  );
}

function Ex49_StorageEvent() {
  const [value, setValue] = useState(localStorage.getItem("ex49_shared") ?? "");
  useEffect(() => {
    const handler = (e: StorageEvent) => { if (e.key === "ex49_shared") setValue(e.newValue ?? ""); };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);
  return (
    <div>
      <input value={value} onChange={(e) => { setValue(e.target.value); localStorage.setItem("ex49_shared", e.target.value); }} placeholder="Shared across tabs" />
      <p>Value: {value}</p>
    </div>
  );
}

function Ex50_ComplexLifecycle() {
  const [phase, setPhase] = useState("idle");
  const [log, setLog] = useState<string[]>([]);
  const add = (msg: string) => setLog((prev) => [...prev.slice(-5), `${new Date().toLocaleTimeString()}: ${msg}`]);
  useEffect(() => { add("Component mounted"); return () => add("Component unmounted"); }, []);
  useEffect(() => { if (phase !== "idle") add(`Phase changed → ${phase}`); }, [phase]);
  useEffect(() => {
    if (phase !== "running") return;
    const id = setInterval(() => add("Tick"), 1000);
    return () => { clearInterval(id); add("Timer cleared"); };
  }, [phase]);
  return (
    <div>
      <div style={{ display: "flex", gap: 4 }}>
        {["idle", "running", "paused"].map((p) => <button key={p} onClick={() => setPhase(p)} style={{ fontWeight: phase === p ? "bold" : "normal" }}>{p}</button>)}
      </div>
      <div style={{ marginTop: 8, fontSize: 12 }}>{log.map((l, i) => <p key={i}>{l}</p>)}</div>
    </div>
  );
}

// ─────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────

const examples: { label: string; component: JSX.Element }[] = [
  // BASIC
  { label: "01 [Basic] Log on Mount",              component: <Ex01_LogOnMount /> },
  { label: "02 [Basic] Document Title",            component: <Ex02_DocumentTitle /> },
  { label: "03 [Basic] Run Every Render",          component: <Ex03_RunEveryRender /> },
  { label: "04 [Basic] Run Once",                  component: <Ex04_RunOnce /> },
  { label: "05 [Basic] Cleanup Timeout",           component: <Ex05_CleanupTimeout /> },
  { label: "06 [Basic] Cleanup Interval",          component: <Ex06_CleanupInterval /> },
  { label: "07 [Basic] Window Resize",             component: <Ex07_WindowResize /> },
  { label: "08 [Basic] Mouse Position",            component: <Ex08_MousePosition /> },
  { label: "09 [Basic] Online Status",             component: <Ex09_OnlineStatus /> },
  { label: "10 [Basic] Key Press",                 component: <Ex10_KeyPress /> },
  { label: "11 [Basic] Page Visibility",           component: <Ex11_PageVisibility /> },
  { label: "12 [Basic] Scroll Position",           component: <Ex12_ScrollPosition /> },
  // INTERMEDIATE
  { label: "13 [Intermediate] Fetch on Mount",     component: <Ex13_FetchOnMount /> },
  { label: "14 [Intermediate] Fetch with ID",      component: <Ex14_FetchWithId /> },
  { label: "15 [Intermediate] Loading State",      component: <Ex15_LoadingState /> },
  { label: "16 [Intermediate] Error Handling",     component: <Ex16_ErrorHandling /> },
  { label: "17 [Intermediate] Debounce",           component: <Ex17_Debounce /> },
  { label: "18 [Intermediate] LocalStorage Sync",  component: <Ex18_LocalStorageSync /> },
  { label: "19 [Intermediate] Countdown Timer",    component: <Ex19_CountdownTimer /> },
  { label: "20 [Intermediate] Skip First Render",  component: <Ex20_SkipFirstRender /> },
  { label: "21 [Intermediate] Multiple Deps",      component: <Ex21_MultipleDeps /> },
  { label: "22 [Intermediate] Auto Focus",         component: <Ex22_AutoFocus /> },
  { label: "23 [Intermediate] Polling",            component: <Ex23_Polling /> },
  { label: "24 [Intermediate] Dependency Array",   component: <Ex24_DependencyArray /> },
  { label: "25 [Intermediate] External Script",    component: <Ex25_ExternalScript /> },
  // NESTED
  { label: "26 [Nested] Chained Effects",          component: <Ex26_ChainedEffects /> },
  { label: "27 [Nested] Conditional Effect",       component: <Ex27_ConditionalEffect /> },
  { label: "28 [Nested] Effect + Select Fetch",    component: <Ex28_EffectWithReducedState /> },
  { label: "29 [Nested] Effect + Callbacks",       component: <Ex29_EffectAndCallback /> },
  { label: "30 [Nested] Nested Fetch",             component: <Ex30_NestedFetch /> },
  { label: "31 [Nested] Prev vs Current",          component: <Ex31_PrevVsCurrentEffect /> },
  { label: "32 [Nested] Fetch with Abort",         component: <Ex32_EffectWithAbort /> },
  { label: "33 [Nested] DOM Manipulation",         component: <Ex33_SideEffectWithDOM /> },
  { label: "34 [Nested] Intersection Observer",    component: <Ex34_IntersectionObserver /> },
  { label: "35 [Nested] Resize Observer",          component: <Ex35_ResizeObserver /> },
  { label: "36 [Nested] Broadcast Channel",        component: <Ex36_BroadcastChannel /> },
  { label: "37 [Nested] Multi-Step Effect",        component: <Ex37_MultiStepEffect /> },
  // ADVANCED
  { label: "38 [Advanced] Race Condition Fix",     component: <Ex38_RaceCondition /> },
  { label: "39 [Advanced] Retry Fetch",            component: <Ex39_RetryFetch /> },
  { label: "40 [Advanced] WebSocket Sim",          component: <Ex40_WebSocket /> },
  { label: "41 [Advanced] Sync State to URL",      component: <Ex41_SyncStateToURL /> },
  { label: "42 [Advanced] Animation Frame",        component: <Ex42_AnimationFrame /> },
  { label: "43 [Advanced] Infinite Scroll",        component: <Ex43_InfiniteScroll /> },
  { label: "44 [Advanced] Media Query",            component: <Ex44_MediaQuery /> },
  { label: "45 [Advanced] Idle Detection",         component: <Ex45_IdleDetection /> },
  { label: "46 [Advanced] Battery Status",         component: <Ex46_BatteryStatus /> },
  { label: "47 [Advanced] Geolocation",            component: <Ex47_GeolocationOnce /> },
  { label: "48 [Advanced] CSS Variable Sync",      component: <Ex48_CSSVariableSync /> },
  { label: "49 [Advanced] Storage Event",          component: <Ex49_StorageEvent /> },
  { label: "50 [Advanced] Complex Lifecycle",      component: <Ex50_ComplexLifecycle /> },
];

export default function UseEffectExamples() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: 24 }}>
      <h1>50 useEffect Examples — Basic · Intermediate · Nested · Advanced</h1>
      {examples.map(({ label, component }) => (
        <section key={label} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <h2 style={{ marginTop: 0, fontSize: 14, color: "#555" }}>{label}</h2>
          {component}
        </section>
      ))}
    </div>
  );
}
