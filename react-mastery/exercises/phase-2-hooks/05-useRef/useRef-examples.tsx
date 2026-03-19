import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";

// ─────────────────────────────────────────
// BASIC (1–12)
// ─────────────────────────────────────────

function Ex01_FocusInput() {
  const ref = useRef<HTMLInputElement>(null);
  return <div><input ref={ref} placeholder="Click button to focus" /><button onClick={() => ref.current?.focus()}>Focus</button></div>;
}

function Ex02_MutableValue() {
  const count = useRef(0); // doesn't trigger re-render
  const [display, setDisplay] = useState(0);
  return <div><button onClick={() => { count.current += 1; }}>Click (no re-render)</button><button onClick={() => setDisplay(count.current)}>Show: {display}</button></div>;
}

function Ex03_PreviousValue() {
  const [val, setVal] = useState(0);
  const prev = useRef(val);
  useEffect(() => { prev.current = val; });
  return <div><p>Current: {val} | Previous: {prev.current}</p><button onClick={() => setVal(val + 1)}>+</button></div>;
}

function Ex04_CountRenders() {
  const [val, setVal] = useState("");
  const renders = useRef(0);
  renders.current += 1;
  return <div><input value={val} onChange={(e) => setVal(e.target.value)} placeholder="Type here" /><p>Render count: {renders.current}</p></div>;
}

function Ex05_StoreTimeout() {
  const [msg, setMsg] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMsg("Waiting...");
    timerRef.current = setTimeout(() => setMsg("Done! ✅"), 2000);
  };
  const cancel = () => { if (timerRef.current) { clearTimeout(timerRef.current); setMsg("Cancelled"); } };
  return <div><button onClick={start}>Start 2s timer</button><button onClick={cancel}>Cancel</button><p>{msg}</p></div>;
}

function Ex06_DOMStyle() {
  const boxRef = useRef<HTMLDivElement>(null);
  const highlight = () => { if (boxRef.current) boxRef.current.style.background = "yellow"; };
  const reset = () => { if (boxRef.current) boxRef.current.style.background = ""; };
  return <div><div ref={boxRef} style={{ padding: 16, border: "1px solid #ccc" }}>Box element</div><button onClick={highlight}>Highlight</button><button onClick={reset}>Reset</button></div>;
}

function Ex07_ScrollToRef() {
  const bottomRef = useRef<HTMLDivElement>(null);
  return (
    <div>
      <button onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}>Scroll to bottom</button>
      <div style={{ height: 150, overflow: "auto", border: "1px solid #ccc" }}>
        {Array.from({ length: 20 }, (_, i) => <p key={i}>Line {i + 1}</p>)}
        <div ref={bottomRef}>⬆ Bottom</div>
      </div>
    </div>
  );
}

function Ex08_StoreInterval() {
  const [count, setCount] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const start = () => { setRunning(true); intervalRef.current = setInterval(() => setCount((c) => c + 1), 1000); };
  const stop = () => { setRunning(false); if (intervalRef.current) clearInterval(intervalRef.current); };
  return <div><p>{count}s</p><button onClick={start} disabled={running}>Start</button><button onClick={stop} disabled={!running}>Stop</button></div>;
}

function Ex09_ReadInputValue() {
  // Uncontrolled input — read value via ref when needed
  const inputRef = useRef<HTMLInputElement>(null);
  const [submitted, setSubmitted] = useState("");
  return (
    <div>
      <input ref={inputRef} defaultValue="" placeholder="Uncontrolled input" />
      <button onClick={() => setSubmitted(inputRef.current?.value ?? "")}>Submit</button>
      {submitted && <p>Submitted: {submitted}</p>}
    </div>
  );
}

function Ex10_VideoRef() {
  const videoRef = useRef<HTMLVideoElement>(null);
  return (
    <div>
      <video ref={videoRef} style={{ width: "100%", maxWidth: 200 }} src="https://www.w3schools.com/html/mov_bbb.mp4" />
      <div style={{ display: "flex", gap: 4 }}>
        <button onClick={() => videoRef.current?.play()}>▶ Play</button>
        <button onClick={() => videoRef.current?.pause()}>⏸ Pause</button>
        <button onClick={() => { if (videoRef.current) videoRef.current.currentTime = 0; }}>⏮ Reset</button>
      </div>
    </div>
  );
}

function Ex11_FocusOnMount() {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return <input ref={ref} placeholder="Auto-focused on mount ✅" />;
}

function Ex12_MeasureWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  return (
    <div>
      <div ref={ref} style={{ padding: 16, background: "#eee", resize: "horizontal", overflow: "auto", minWidth: 100 }}>Resize me →</div>
      <button onClick={() => setWidth(ref.current?.offsetWidth ?? 0)}>Measure width</button>
      <p>Width: {width}px</p>
    </div>
  );
}

// ─────────────────────────────────────────
// INTERMEDIATE (13–25)
// ─────────────────────────────────────────

function Ex13_StableCallback() {
  const [count, setCount] = useState(0);
  const latestCount = useRef(count);
  latestCount.current = count;
  useEffect(() => {
    const id = setInterval(() => {
      // latestCount.current always has the latest value without re-creating the effect
      console.log("Latest count:", latestCount.current);
    }, 2000);
    return () => clearInterval(id);
  }, []); // empty deps — no stale closure
  return <div><p>Count: {count} (check console every 2s)</p><button onClick={() => setCount(count + 1)}>+</button></div>;
}

function Ex14_Stopwatch() {
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const startRef = useRef(0);
  const frameRef = useRef(0);
  const tick = () => { setTime(Date.now() - startRef.current); frameRef.current = requestAnimationFrame(tick); };
  const start = () => { setRunning(true); startRef.current = Date.now() - time; frameRef.current = requestAnimationFrame(tick); };
  const stop = () => { setRunning(false); cancelAnimationFrame(frameRef.current); };
  const reset = () => { stop(); setTime(0); };
  return (
    <div>
      <p style={{ fontSize: 28 }}>{(time / 1000).toFixed(2)}s</p>
      <button onClick={running ? stop : start}>{running ? "Stop" : "Start"}</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}

function Ex15_DebounceRef() {
  const [value, setValue] = useState("");
  const [debounced, setDebounced] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleChange = (val: string) => {
    setValue(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebounced(val), 500);
  };
  return (
    <div>
      <input onChange={(e) => handleChange(e.target.value)} placeholder="Type (500ms debounce)" />
      <p>Live: {value}</p>
      <p>Debounced: {debounced}</p>
    </div>
  );
}

function Ex16_PreviousProps() {
  const [name, setName] = useState("Alice");
  const prevName = useRef(name);
  useEffect(() => { prevName.current = name; }, [name]);
  return (
    <div>
      <select value={name} onChange={(e) => setName(e.target.value)}>
        {["Alice", "Bob", "Charlie"].map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
      <p>Current: {name} | Previous: {prevName.current}</p>
    </div>
  );
}

function Ex17_ChatAutoScroll() {
  const [messages, setMessages] = useState(["Hello!", "How are you?"]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  return (
    <div>
      <div style={{ height: 100, overflow: "auto", border: "1px solid #ccc", padding: 8 }}>
        {messages.map((m, i) => <p key={i}>{m}</p>)}
        <div ref={bottomRef} />
      </div>
      <input value={input} onChange={(e) => setInput(e.target.value)} /><button onClick={() => { setMessages([...messages, input]); setInput(""); }}>Send</button>
    </div>
  );
}

function Ex18_DragPosition() {
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const handleMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };
  useEffect(() => {
    const move = (e: MouseEvent) => { if (dragging.current) setPos({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y }); };
    const up = () => { dragging.current = false; };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, []);
  return (
    <div style={{ position: "relative", height: 150, border: "1px solid #ccc", overflow: "hidden" }}>
      <div onMouseDown={handleMouseDown} style={{ position: "absolute", left: pos.x, top: pos.y, width: 40, height: 40, background: "#4f46e5", borderRadius: "50%", cursor: "grab", userSelect: "none" }} />
      <p style={{ position: "absolute", bottom: 4, left: 4, fontSize: 11 }}>x:{Math.round(pos.x)} y:{Math.round(pos.y)}</p>
    </div>
  );
}

function Ex19_AnimationRef() {
  const [x, setX] = useState(0);
  const rafRef = useRef(0);
  const isRunning = useRef(false);
  const tick = () => { setX((v) => (v + 2) % 280); rafRef.current = requestAnimationFrame(tick); };
  const toggle = () => {
    if (isRunning.current) { cancelAnimationFrame(rafRef.current); isRunning.current = false; }
    else { isRunning.current = true; rafRef.current = requestAnimationFrame(tick); }
  };
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);
  return (
    <div>
      <button onClick={toggle}>Toggle Animation</button>
      <div style={{ position: "relative", height: 30, background: "#f3f4f6" }}>
        <div style={{ position: "absolute", left: x, width: 20, height: 20, background: "#4f46e5", borderRadius: "50%", top: 5 }} />
      </div>
    </div>
  );
}

function Ex20_FormReset() {
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [submitted, setSubmitted] = useState<{ name: string; email: string } | null>(null);
  const handleSubmit = () => {
    setSubmitted({ name: nameRef.current?.value ?? "", email: emailRef.current?.value ?? "" });
    if (nameRef.current) nameRef.current.value = "";
    if (emailRef.current) emailRef.current.value = "";
  };
  return (
    <div>
      <input ref={nameRef} defaultValue="" placeholder="Name (uncontrolled)" />
      <input ref={emailRef} defaultValue="" placeholder="Email (uncontrolled)" />
      <button onClick={handleSubmit}>Submit & Reset</button>
      {submitted && <pre>{JSON.stringify(submitted, null, 2)}</pre>}
    </div>
  );
}

function Ex21_HoverDuration() {
  const [duration, setDuration] = useState(0);
  const startTime = useRef<number | null>(null);
  const hoverRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = hoverRef.current;
    if (!el) return;
    const enter = () => { startTime.current = Date.now(); };
    const leave = () => { if (startTime.current) setDuration(Date.now() - startTime.current); startTime.current = null; };
    el.addEventListener("mouseenter", enter);
    el.addEventListener("mouseleave", leave);
    return () => { el.removeEventListener("mouseenter", enter); el.removeEventListener("mouseleave", leave); };
  }, []);
  return (
    <div>
      <div ref={hoverRef} style={{ padding: 24, background: "#eee", cursor: "default" }}>Hover here</div>
      <p>Last hover: {duration}ms</p>
    </div>
  );
}

function Ex22_IntersectionRef() {
  const [visible, setVisible] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.5 });
    if (boxRef.current) observer.observe(boxRef.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div style={{ height: 120, overflow: "auto", border: "1px solid #ccc" }}>
      <div style={{ height: 80 }}>Scroll down ↓</div>
      <div ref={boxRef} style={{ padding: 16, background: visible ? "#d1fae5" : "#fee2e2" }}>{visible ? "Visible ✅" : "Hidden ❌"}</div>
      <div style={{ height: 40 }} />
    </div>
  );
}

function Ex23_ClickOutside() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  return (
    <div ref={menuRef} style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => setOpen(!open)}>Menu ▼</button>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, background: "#fff", border: "1px solid #ccc", padding: 8, zIndex: 10 }}>
          <p>Item 1</p><p>Item 2</p><p>Item 3</p>
          <small>(Click outside to close)</small>
        </div>
      )}
    </div>
  );
}

function Ex24_ResizeObserverRef() {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setSize({ w: Math.round(entry.contentRect.width), h: Math.round(entry.contentRect.height) }));
    if (boxRef.current) observer.observe(boxRef.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={boxRef} style={{ padding: 16, background: "#eee", resize: "both", overflow: "auto", minWidth: 100, minHeight: 60 }}>
      {size.w} × {size.h}px — resize me
    </div>
  );
}

function Ex25_CopyToClipboard() {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [copied, setCopied] = useState(false);
  const copy = () => {
    const text = textRef.current?.textContent ?? "";
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <div>
      <p ref={textRef}>This is the text that will be copied to clipboard.</p>
      <button onClick={copy}>{copied ? "Copied! ✅" : "Copy text"}</button>
    </div>
  );
}

// ─────────────────────────────────────────
// NESTED (26–37)
// ─────────────────────────────────────────

function Ex26_MultipleRefs() {
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const focusNext = (i: number) => refs[i + 1]?.current?.focus();
  return (
    <div>
      <p>Press Enter to move to next field:</p>
      {refs.map((ref, i) => (
        <input key={i} ref={ref} onKeyDown={(e) => e.key === "Enter" && focusNext(i)} placeholder={`Field ${i + 1}`} style={{ display: "block", marginBottom: 4 }} />
      ))}
    </div>
  );
}

function Ex27_RefArray() {
  const items = ["Alpha", "Beta", "Gamma", "Delta"];
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const scrollTo = (i: number) => itemRefs.current[i]?.scrollIntoView({ behavior: "smooth" });
  return (
    <div>
      <div style={{ display: "flex", gap: 4 }}>{items.map((_, i) => <button key={i} onClick={() => scrollTo(i)}>Go {i + 1}</button>)}</div>
      <ul style={{ height: 80, overflow: "auto", border: "1px solid #ccc" }}>
        {items.map((item, i) => <li key={i} ref={(el) => { itemRefs.current[i] = el; }} style={{ padding: 16 }}>{item}</li>)}
      </ul>
    </div>
  );
}

function Ex28_NestedForwardRef() {
  type InputHandle = { focus: () => void; clear: () => void; getValue: () => string };
  const SmartInput = forwardRef<InputHandle, { placeholder?: string }>((props, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      clear: () => { if (inputRef.current) inputRef.current.value = ""; },
      getValue: () => inputRef.current?.value ?? "",
    }));
    return <input ref={inputRef} {...props} />;
  });
  SmartInput.displayName = "SmartInput";
  const smartRef = useRef<InputHandle>(null);
  const [val, setVal] = useState("");
  return (
    <div>
      <SmartInput ref={smartRef} placeholder="forwardRef input" />
      <button onClick={() => smartRef.current?.focus()}>Focus</button>
      <button onClick={() => smartRef.current?.clear()}>Clear</button>
      <button onClick={() => setVal(smartRef.current?.getValue() ?? "")}>Get: {val}</button>
    </div>
  );
}

function Ex29_RafLoop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const angle = useRef(0);
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, 100, 100);
    ctx.beginPath();
    ctx.arc(50 + Math.cos(angle.current) * 30, 50 + Math.sin(angle.current) * 30, 10, 0, Math.PI * 2);
    ctx.fillStyle = "#4f46e5";
    ctx.fill();
    angle.current += 0.05;
    rafRef.current = requestAnimationFrame(draw);
  };
  useEffect(() => { rafRef.current = requestAnimationFrame(draw); return () => cancelAnimationFrame(rafRef.current); }, []);
  return <canvas ref={canvasRef} width={100} height={100} style={{ border: "1px solid #ccc" }} />;
}

function Ex30_WebAudioRef() {
  const audioCtx = useRef<AudioContext | null>(null);
  const playBeep = (freq: number) => {
    if (!audioCtx.current) audioCtx.current = new AudioContext();
    const osc = audioCtx.current.createOscillator();
    const gain = audioCtx.current.createGain();
    osc.connect(gain); gain.connect(audioCtx.current.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, audioCtx.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + 0.3);
    osc.start(); osc.stop(audioCtx.current.currentTime + 0.3);
  };
  return (
    <div>
      {[261, 329, 392].map((f) => <button key={f} onClick={() => playBeep(f)}>Beep {f}Hz</button>)}
    </div>
  );
}

function Ex31_FormFieldRefs() {
  const fields = ["firstName", "lastName", "email", "phone"];
  const refs = useRef<Record<string, HTMLInputElement | null>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const validate = () => {
    const empty = fields.filter((f) => !refs.current[f]?.value);
    setErrors(empty);
    if (empty.length > 0) refs.current[empty[0]]?.focus();
  };
  return (
    <div>
      {fields.map((f) => (
        <div key={f}>
          <input ref={(el) => { refs.current[f] = el; }} placeholder={f} style={{ borderColor: errors.includes(f) ? "red" : undefined }} />
          {errors.includes(f) && <span style={{ color: "red", fontSize: 12 }}>Required</span>}
        </div>
      ))}
      <button onClick={validate}>Validate</button>
    </div>
  );
}

function Ex32_SpeechRef() {
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const [text, setText] = useState("Hello from useRef!");
  const [speaking, setSpeaking] = useState(false);
  const speak = () => {
    if (!("speechSynthesis" in window)) return;
    synthRef.current = window.speechSynthesis;
    const utt = new SpeechSynthesisUtterance(text);
    utt.onend = () => setSpeaking(false);
    setSpeaking(true);
    synthRef.current.speak(utt);
  };
  const stop = () => { synthRef.current?.cancel(); setSpeaking(false); };
  return (
    <div>
      <input value={text} onChange={(e) => setText(e.target.value)} style={{ width: "100%" }} />
      <button onClick={speak} disabled={speaking}>🔊 Speak</button>
      <button onClick={stop} disabled={!speaking}>⏹ Stop</button>
    </div>
  );
}

function Ex33_PinInput() {
  const SIZE = 4;
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [pin, setPin] = useState(Array(SIZE).fill(""));
  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...pin];
    next[i] = val.slice(-1);
    setPin(next);
    if (val && i < SIZE - 1) inputRefs.current[i + 1]?.focus();
  };
  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[i] && i > 0) inputRefs.current[i - 1]?.focus();
  };
  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        {pin.map((v, i) => (
          <input key={i} ref={(el) => { inputRefs.current[i] = el; }} value={v} onChange={(e) => handleChange(i, e.target.value)} onKeyDown={(e) => handleKeyDown(i, e)} maxLength={1} style={{ width: 40, height: 40, textAlign: "center", fontSize: 18 }} />
        ))}
      </div>
      <p>PIN: {pin.join("")}</p>
    </div>
  );
}

function Ex34_SortableRefList() {
  const [items, setItems] = useState(["React", "Vue", "Angular", "Svelte"]);
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);
  const handleDragStart = (i: number) => { dragItem.current = i; };
  const handleDragEnter = (i: number) => { dragOver.current = i; };
  const handleDrop = () => {
    if (dragItem.current === null || dragOver.current === null) return;
    const next = [...items];
    const [moved] = next.splice(dragItem.current, 1);
    next.splice(dragOver.current, 0, moved);
    setItems(next);
    dragItem.current = null; dragOver.current = null;
  };
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {items.map((item, i) => (
        <li key={item} draggable onDragStart={() => handleDragStart(i)} onDragEnter={() => handleDragEnter(i)} onDragEnd={handleDrop}
          style={{ padding: 8, margin: 4, background: "#e5e7eb", cursor: "grab", borderRadius: 4 }}>
          ⠿ {item}
        </li>
      ))}
    </ul>
  );
}

function Ex35_TextareaAutoResize() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState("");
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [value]);
  return (
    <div>
      <textarea ref={textareaRef} value={value} onChange={(e) => setValue(e.target.value)} placeholder="Auto-resizing textarea..." style={{ width: "100%", resize: "none", overflow: "hidden", minHeight: 40 }} />
      <p>{value.length} chars</p>
    </div>
  );
}

function Ex36_AbortControllerRef() {
  const abortRef = useRef<AbortController | null>(null);
  const [data, setData] = useState("");
  const [loading, setLoading] = useState(false);
  const fetch_ = async (id: number) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true); setData("");
    try {
      const res = await fetch(`https://jsonplaceholder.typicode.com/todos/${id}`, { signal: abortRef.current.signal });
      const d = await res.json();
      setData(d.title);
    } catch { setData("Aborted or error"); }
    finally { setLoading(false); }
  };
  return (
    <div>
      {[1, 2, 3, 4].map((id) => <button key={id} onClick={() => fetch_(id)}>Fetch #{id}</button>)}
      <p>{loading ? "Loading..." : data}</p>
    </div>
  );
}

function Ex37_PreviousArrayRef() {
  const [items, setItems] = useState<string[]>([]);
  const prevItems = useRef<string[]>([]);
  const [diff, setDiff] = useState<string[]>([]);
  useEffect(() => {
    const added = items.filter((i) => !prevItems.current.includes(i));
    const removed = prevItems.current.filter((i) => !items.includes(i));
    setDiff([...added.map((a) => `+ ${a}`), ...removed.map((r) => `- ${r}`)]);
    prevItems.current = [...items];
  }, [items]);
  const [inp, setInp] = useState("");
  return (
    <div>
      <input value={inp} onChange={(e) => setInp(e.target.value)} /><button onClick={() => { setItems([...items, inp]); setInp(""); }}>Add</button>
      <ul>{items.map((i, idx) => <li key={idx}>{i} <button onClick={() => setItems(items.filter((_, j) => j !== idx))}>✕</button></li>)}</ul>
      <p>Changes: {diff.join(", ") || "none"}</p>
    </div>
  );
}

// ─────────────────────────────────────────
// ADVANCED (38–50)
// ─────────────────────────────────────────

function Ex38_ImperativeHandle() {
  type AlertHandle = { show: (msg: string) => void; hide: () => void };
  const CustomAlert = forwardRef<AlertHandle>((_, ref) => {
    const [msg, setMsg] = useState<string | null>(null);
    useImperativeHandle(ref, () => ({ show: (m) => setMsg(m), hide: () => setMsg(null) }));
    if (!msg) return null;
    return <div style={{ padding: 12, background: "#fef3c7", border: "1px solid #fbbf24", borderRadius: 4 }}>{msg} <button onClick={() => setMsg(null)}>✕</button></div>;
  });
  CustomAlert.displayName = "CustomAlert";
  const alertRef = useRef<AlertHandle>(null);
  return (
    <div>
      <button onClick={() => alertRef.current?.show("Custom alert via ref!")}>Show Alert</button>
      <button onClick={() => alertRef.current?.hide()}>Hide Alert</button>
      <CustomAlert ref={alertRef} />
    </div>
  );
}

function Ex39_VirtualScrollRef() {
  const all = Array.from({ length: 1000 }, (_, i) => `Item ${i + 1}`);
  const containerRef = useRef<HTMLDivElement>(null);
  const [startIndex, setStartIndex] = useState(0);
  const itemHeight = 30;
  const visibleCount = 5;
  const handleScroll = () => {
    const scrollTop = containerRef.current?.scrollTop ?? 0;
    setStartIndex(Math.floor(scrollTop / itemHeight));
  };
  const visible = all.slice(startIndex, startIndex + visibleCount);
  return (
    <div ref={containerRef} onScroll={handleScroll} style={{ height: visibleCount * itemHeight, overflowY: "auto", border: "1px solid #ccc" }}>
      <div style={{ height: all.length * itemHeight, position: "relative" }}>
        <div style={{ position: "absolute", top: startIndex * itemHeight }}>
          {visible.map((item, i) => <div key={startIndex + i} style={{ height: itemHeight, lineHeight: `${itemHeight}px`, borderBottom: "1px solid #eee" }}>{item}</div>)}
        </div>
      </div>
    </div>
  );
}

function Ex40_WebWorkerRef() {
  const workerRef = useRef<Worker | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const run = () => {
    // Simulate heavy work with setTimeout (Web Workers not easily inlined)
    setRunning(true);
    const id = setTimeout(() => {
      let sum = 0;
      for (let i = 0; i < 10000000; i++) sum += i;
      setResult(sum);
      setRunning(false);
    }, 0);
    workerRef.current = { terminate: () => clearTimeout(id) } as unknown as Worker;
  };
  return (
    <div>
      <button onClick={run} disabled={running}>Run heavy task {running ? "(running...)" : ""}</button>
      {result !== null && <p>Sum 0..10M = {result}</p>}
    </div>
  );
}

function Ex41_CanvasDrawRef() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => { drawing.current = true; lastPos.current = getPos(e); };
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(pos.x, pos.y); ctx.stroke();
    lastPos.current = pos;
  };
  return (
    <div>
      <canvas ref={canvasRef} width={200} height={120} onMouseDown={startDraw} onMouseMove={draw} onMouseUp={() => { drawing.current = false; }} style={{ border: "1px solid #ccc", cursor: "crosshair" }} />
      <button onClick={() => { const ctx = canvasRef.current?.getContext("2d"); ctx?.clearRect(0, 0, 200, 120); }}>Clear</button>
    </div>
  );
}

function Ex42_PollingRef() {
  const [data, setData] = useState<{ title: string } | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [active, setActive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idRef = useRef(1);
  const poll = () => {
    fetch(`https://jsonplaceholder.typicode.com/todos/${idRef.current}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setPollCount((c) => c + 1); idRef.current = (idRef.current % 5) + 1; });
  };
  const start = () => { setActive(true); intervalRef.current = setInterval(poll, 3000); poll(); };
  const stop = () => { setActive(false); if (intervalRef.current) clearInterval(intervalRef.current); };
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);
  return (
    <div>
      <button onClick={active ? stop : start}>{active ? "Stop polling" : "Start polling (3s)"}</button>
      <p>Polls: {pollCount}</p>
      {data && <p>{data.title}</p>}
    </div>
  );
}

function Ex43_PortalRef() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const showTooltip = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setTooltipPos({ top: rect.bottom + 4, left: rect.left });
    setOpen(true);
  };
  return (
    <div>
      <button ref={triggerRef} onMouseEnter={showTooltip} onMouseLeave={() => setOpen(false)}>Hover for tooltip</button>
      {open && <div style={{ position: "fixed", top: tooltipPos.top, left: tooltipPos.left, background: "#333", color: "#fff", padding: "4px 8px", borderRadius: 4, fontSize: 12, zIndex: 9999 }}>Tooltip via ref position!</div>}
    </div>
  );
}

function Ex44_PersistentFormRef() {
  const savedData = useRef<Record<string, string>>({});
  const [fields] = useState(["name", "email", "phone"]);
  const refs = useRef<Record<string, HTMLInputElement | null>>({});
  const save = () => {
    fields.forEach((f) => { savedData.current[f] = refs.current[f]?.value ?? ""; });
    alert("Saved! " + JSON.stringify(savedData.current));
  };
  const restore = () => {
    fields.forEach((f) => { if (refs.current[f]) refs.current[f]!.value = savedData.current[f] ?? ""; });
  };
  return (
    <div>
      {fields.map((f) => <input key={f} ref={(el) => { refs.current[f] = el; }} defaultValue="" placeholder={f} style={{ display: "block", marginBottom: 4 }} />)}
      <button onClick={save}>Save (no re-render)</button>
      <button onClick={restore}>Restore</button>
    </div>
  );
}

function Ex45_LatestCallbackRef() {
  const [count, setCount] = useState(0);
  const callbackRef = useRef(() => {}); // stores latest callback without re-creating effect
  callbackRef.current = () => console.log("Latest count is", count);
  useEffect(() => {
    const id = setInterval(() => callbackRef.current(), 2000);
    return () => clearInterval(id);
  }, []); // runs once — never stale
  return <div><p>Count: {count} (check console every 2s for latest value)</p><button onClick={() => setCount(count + 1)}>+</button></div>;
}

function Ex46_SmoothCounter() {
  const [target, setTarget] = useState(0);
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(0);
  const currentRef = useRef(0);
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    const animate = () => {
      const diff = target - currentRef.current;
      if (Math.abs(diff) < 0.5) { currentRef.current = target; setDisplay(target); return; }
      currentRef.current += diff * 0.1;
      setDisplay(Math.round(currentRef.current));
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target]);
  return (
    <div>
      <p style={{ fontSize: 32 }}>{display}</p>
      {[100, 500, 1000, 0].map((v) => <button key={v} onClick={() => setTarget(v)}>{v}</button>)}
    </div>
  );
}

function Ex47_FocusTrap() {
  const [open, setOpen] = useState(false);
  const trapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open || !trapRef.current) return;
    const focusable = trapRef.current.querySelectorAll<HTMLElement>("button, input, a");
    const first = focusable[0]; const last = focusable[focusable.length - 1];
    first.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
      else { if (document.activeElement === last) { e.preventDefault(); first.focus(); } }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);
  return (
    <div>
      <button onClick={() => setOpen(true)}>Open dialog (Tab trapped)</button>
      {open && (
        <div ref={trapRef} role="dialog" style={{ border: "2px solid #4f46e5", padding: 16, marginTop: 8 }}>
          <p>Focus is trapped here. Tab between elements.</p>
          <input placeholder="Name" /><input placeholder="Email" />
          <button onClick={() => setOpen(false)}>Close</button>
        </div>
      )}
    </div>
  );
}

function Ex48_ImagePreviewRef() {
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const url = URL.createObjectURL(file); setPreview(url); }
  };
  return (
    <div>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleChange} />
      {preview && <img ref={imgRef} src={preview} style={{ maxWidth: 200, marginTop: 8, display: "block" }} alt="Preview" />}
      <button onClick={() => { setPreview(null); if (fileRef.current) fileRef.current.value = ""; }}>Clear</button>
    </div>
  );
}

function Ex49_SpeakingTimer() {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef(0);
  const [running, setRunning] = useState(false);
  const tick = () => {
    if (startRef.current !== null) setElapsed(Date.now() - startRef.current);
    rafRef.current = requestAnimationFrame(tick);
  };
  const start = () => { setRunning(true); startRef.current = Date.now() - elapsed; rafRef.current = requestAnimationFrame(tick); };
  const stop = () => { setRunning(false); cancelAnimationFrame(rafRef.current); };
  const reset = () => { stop(); setElapsed(0); startRef.current = null; };
  const ms = elapsed % 1000; const s = Math.floor(elapsed / 1000) % 60; const m = Math.floor(elapsed / 60000);
  return (
    <div>
      <p style={{ fontSize: 28, fontFamily: "monospace" }}>{String(m).padStart(2,"0")}:{String(s).padStart(2,"0")}.{String(ms).padStart(3,"0")}</p>
      <button onClick={running ? stop : start}>{running ? "Stop" : "Start"}</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}

function Ex50_FullRefApp() {
  // Combines: DOM ref, mutable ref, forwardRef-like pattern, interval ref, RAF ref
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scoreRef = useRef(0); scoreRef.current = score;
  const logRef = useRef<HTMLDivElement>(null);
  const addLog = (msg: string) => setLog((prev) => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${msg}`]);
  const startGame = () => {
    setRunning(true); addLog("Game started");
    intervalRef.current = setInterval(() => {
      const gained = Math.floor(Math.random() * 10) + 1;
      setScore((s) => s + gained);
      addLog(`+${gained} points (total: ${scoreRef.current + gained})`);
    }, 1000);
    setTimeout(() => buttonRef.current?.focus(), 50);
  };
  const stopGame = () => { setRunning(false); addLog("Game stopped"); if (intervalRef.current) clearInterval(intervalRef.current); };
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);
  useEffect(() => { logRef.current?.scrollIntoView({ behavior: "smooth" }); }, [log]);
  return (
    <div style={{ border: "1px solid #ddd", padding: 12 }}>
      <p style={{ fontSize: 24 }}>Score: {score}</p>
      <button ref={buttonRef} onClick={running ? stopGame : startGame} style={{ background: running ? "#ef4444" : "#10b981", color: "#fff", padding: "8px 16px" }}>
        {running ? "Stop" : "Start"} Game
      </button>
      <div style={{ marginTop: 8, fontSize: 12 }}>
        {log.map((l, i) => <p key={i}>{l}</p>)}
        <div ref={logRef} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────

const examples: { label: string; component: JSX.Element }[] = [
  { label: "01 [Basic] Focus Input",              component: <Ex01_FocusInput /> },
  { label: "02 [Basic] Mutable Value (no rerender)", component: <Ex02_MutableValue /> },
  { label: "03 [Basic] Previous Value",           component: <Ex03_PreviousValue /> },
  { label: "04 [Basic] Count Renders",            component: <Ex04_CountRenders /> },
  { label: "05 [Basic] Store Timeout",            component: <Ex05_StoreTimeout /> },
  { label: "06 [Basic] DOM Style",                component: <Ex06_DOMStyle /> },
  { label: "07 [Basic] Scroll To",                component: <Ex07_ScrollToRef /> },
  { label: "08 [Basic] Store Interval",           component: <Ex08_StoreInterval /> },
  { label: "09 [Basic] Uncontrolled Input",       component: <Ex09_ReadInputValue /> },
  { label: "10 [Basic] Video Control",            component: <Ex10_VideoRef /> },
  { label: "11 [Basic] Focus on Mount",           component: <Ex11_FocusOnMount /> },
  { label: "12 [Basic] Measure Width",            component: <Ex12_MeasureWidth /> },
  { label: "13 [Intermediate] Stable Callback",   component: <Ex13_StableCallback /> },
  { label: "14 [Intermediate] Stopwatch",         component: <Ex14_Stopwatch /> },
  { label: "15 [Intermediate] Debounce Ref",      component: <Ex15_DebounceRef /> },
  { label: "16 [Intermediate] Previous Props",    component: <Ex16_PreviousProps /> },
  { label: "17 [Intermediate] Chat Auto Scroll",  component: <Ex17_ChatAutoScroll /> },
  { label: "18 [Intermediate] Drag Position",     component: <Ex18_DragPosition /> },
  { label: "19 [Intermediate] Animation RAF",     component: <Ex19_AnimationRef /> },
  { label: "20 [Intermediate] Uncontrolled Form", component: <Ex20_FormReset /> },
  { label: "21 [Intermediate] Hover Duration",    component: <Ex21_HoverDuration /> },
  { label: "22 [Intermediate] Intersection Ref",  component: <Ex22_IntersectionRef /> },
  { label: "23 [Intermediate] Click Outside",     component: <Ex23_ClickOutside /> },
  { label: "24 [Intermediate] Resize Observer",   component: <Ex24_ResizeObserverRef /> },
  { label: "25 [Intermediate] Copy to Clipboard", component: <Ex25_CopyToClipboard /> },
  { label: "26 [Nested] Multiple Refs",           component: <Ex26_MultipleRefs /> },
  { label: "27 [Nested] Ref Array",               component: <Ex27_RefArray /> },
  { label: "28 [Nested] forwardRef + useImperativeHandle", component: <Ex28_NestedForwardRef /> },
  { label: "29 [Nested] RAF Canvas Loop",         component: <Ex29_RafLoop /> },
  { label: "30 [Nested] Web Audio Ref",           component: <Ex30_WebAudioRef /> },
  { label: "31 [Nested] Form Field Refs",         component: <Ex31_FormFieldRefs /> },
  { label: "32 [Nested] Speech Synthesis Ref",    component: <Ex32_SpeechRef /> },
  { label: "33 [Nested] PIN Input",               component: <Ex33_PinInput /> },
  { label: "34 [Nested] Sortable Drag List",      component: <Ex34_SortableRefList /> },
  { label: "35 [Nested] Textarea Auto-Resize",    component: <Ex35_TextareaAutoResize /> },
  { label: "36 [Nested] AbortController Ref",     component: <Ex36_AbortControllerRef /> },
  { label: "37 [Nested] Previous Array Diff",     component: <Ex37_PreviousArrayRef /> },
  { label: "38 [Advanced] useImperativeHandle",   component: <Ex38_ImperativeHandle /> },
  { label: "39 [Advanced] Virtual Scroll",        component: <Ex39_VirtualScrollRef /> },
  { label: "40 [Advanced] Heavy Task Ref",        component: <Ex40_WebWorkerRef /> },
  { label: "41 [Advanced] Canvas Draw",           component: <Ex41_CanvasDrawRef /> },
  { label: "42 [Advanced] Polling Ref",           component: <Ex42_PollingRef /> },
  { label: "43 [Advanced] Tooltip via Ref",       component: <Ex43_PortalRef /> },
  { label: "44 [Advanced] Persistent Form Ref",   component: <Ex44_PersistentFormRef /> },
  { label: "45 [Advanced] Latest Callback Ref",   component: <Ex45_LatestCallbackRef /> },
  { label: "46 [Advanced] Smooth Counter",        component: <Ex46_SmoothCounter /> },
  { label: "47 [Advanced] Focus Trap",            component: <Ex47_FocusTrap /> },
  { label: "48 [Advanced] Image Preview Ref",     component: <Ex48_ImagePreviewRef /> },
  { label: "49 [Advanced] Precision Stopwatch",   component: <Ex49_SpeakingTimer /> },
  { label: "50 [Advanced] Full Ref App",          component: <Ex50_FullRefApp /> },
];

export default function UseRefExamples() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: 24 }}>
      <h1>50 useRef Examples — Basic · Intermediate · Nested · Advanced</h1>
      {examples.map(({ label, component }) => (
        <section key={label} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <h2 style={{ marginTop: 0, fontSize: 14, color: "#555" }}>{label}</h2>
          {component}
        </section>
      ))}
    </div>
  );
}
