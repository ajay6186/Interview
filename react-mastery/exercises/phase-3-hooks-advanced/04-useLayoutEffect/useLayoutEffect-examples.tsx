import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useMemo,
  memo,
  ReactNode,
} from "react";

// ─── BASIC (1–12) ────────────────────────────────────────────────────────────

function Ex01_MeasureDOM() {
  const ref = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    if (ref.current) {
      const { width, height } = ref.current.getBoundingClientRect();
      setDims({ w: Math.round(width), h: Math.round(height) });
    }
  }, []);
  return (
    <div>
      <div ref={ref} style={{ padding: 16, background: "#eef", display: "inline-block", borderRadius: 4 }}>
        Measured element
      </div>
      <p>Size: {dims.w} × {dims.h} px</p>
    </div>
  );
}

function Ex02_SetStyleBeforePaint() {
  const ref = useRef<HTMLDivElement>(null);
  const [color, setColor] = useState("#4a90d9");
  useLayoutEffect(() => {
    // Applied synchronously before browser paints — no flash
    if (ref.current) {
      ref.current.style.backgroundColor = color;
      ref.current.style.transform = `scale(${color === "#4a90d9" ? 1 : 1.05})`;
      ref.current.style.transition = "all 0.2s";
    }
  }, [color]);
  return (
    <div>
      <div ref={ref} style={{ width: 80, height: 80, borderRadius: 8, marginBottom: 8 }} />
      <div style={{ display: "flex", gap: 8 }}>
        {["#4a90d9", "#5cb85c", "#d9534f", "#f0ad4e"].map((c) => (
          <button key={c} onClick={() => setColor(c)} style={{ background: c, color: "#fff", border: "none", padding: "4px 10px", borderRadius: 4, cursor: "pointer" }}>
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

function Ex03_SyncScroll() {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const left = leftRef.current;
    const right = rightRef.current;
    if (!left || !right) return;
    const syncL = () => { right.scrollTop = left.scrollTop; };
    const syncR = () => { left.scrollTop = right.scrollTop; };
    left.addEventListener("scroll", syncL);
    right.addEventListener("scroll", syncR);
    return () => { left.removeEventListener("scroll", syncL); right.removeEventListener("scroll", syncR); };
  }, []);
  const content = useMemo(() => Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`), []);
  return (
    <div style={{ display: "flex", gap: 12 }}>
      {[leftRef, rightRef].map((ref, idx) => (
        <div key={idx} ref={ref} style={{ height: 100, overflow: "auto", flex: 1, border: "1px solid #ccc", padding: 8 }}>
          {content.map((line) => <div key={line}>{idx === 0 ? "Left: " : "Right: "}{line}</div>)}
        </div>
      ))}
    </div>
  );
}

function Ex04_ReadComputedStyle() {
  const ref = useRef<HTMLDivElement>(null);
  const [computed, setComputed] = useState<Record<string, string>>({});
  useLayoutEffect(() => {
    if (!ref.current) return;
    const style = window.getComputedStyle(ref.current);
    setComputed({
      fontSize: style.fontSize,
      color: style.color,
      padding: style.padding,
      borderRadius: style.borderRadius,
    });
  }, []);
  return (
    <div>
      <div ref={ref} style={{ padding: 12, background: "#fffde7", borderRadius: 8, fontSize: 15, color: "#333", marginBottom: 8 }}>
        Inspect my computed styles
      </div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12 }}>
        {Object.entries(computed).map(([k, v]) => <li key={k}>{k}: {v}</li>)}
      </ul>
    </div>
  );
}

function Ex05_GetBoundingClientRect() {
  const ref = useRef<HTMLButtonElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const measure = useCallback(() => {
    if (ref.current) setRect(ref.current.getBoundingClientRect());
  }, []);
  useLayoutEffect(() => { measure(); }, [measure]);
  return (
    <div>
      <button ref={ref} onClick={measure}>Measure me</button>
      {rect && (
        <pre style={{ fontSize: 11, margin: "8px 0 0", background: "#f5f5f5", padding: 8, borderRadius: 4 }}>
          {JSON.stringify({ top: rect.top.toFixed(0), left: rect.left.toFixed(0), width: rect.width.toFixed(0), height: rect.height.toFixed(0) }, null, 2)}
        </pre>
      )}
    </div>
  );
}

function Ex06_MeasureTextWidth() {
  const ref = useRef<HTMLSpanElement>(null);
  const [text, setText] = useState("Measure this text");
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    if (ref.current) setWidth(Math.round(ref.current.getBoundingClientRect().width));
  }, [text]);
  return (
    <div>
      <input value={text} onChange={(e) => setText(e.target.value)} style={{ width: 260 }} />
      <p>
        <span ref={ref} style={{ display: "inline-block", whiteSpace: "nowrap" }}>{text}</span>
      </p>
      <p style={{ fontSize: 12 }}>Text width: {width}px (measured before paint via useLayoutEffect)</p>
    </div>
  );
}

function Ex07_SetCSSVariable() {
  const ref = useRef<HTMLDivElement>(null);
  const [hue, setHue] = useState(200);
  useLayoutEffect(() => {
    if (ref.current) {
      ref.current.style.setProperty("--accent-hue", String(hue));
    }
  }, [hue]);
  return (
    <div ref={ref} style={{ padding: 16, background: `hsl(var(--accent-hue, 200), 60%, 90%)`, borderRadius: 8 } as React.CSSProperties}>
      <label>
        Hue:{" "}
        <input type="range" min={0} max={360} value={hue} onChange={(e) => setHue(Number(e.target.value))} style={{ width: 160 }} />
        {hue}°
      </label>
      <p>CSS variable --accent-hue={hue} applied synchronously</p>
    </div>
  );
}

function Ex08_CompareWithUseEffect() {
  const layoutRef = useRef<HTMLDivElement>(null);
  const effectRef = useRef<HTMLDivElement>(null);
  const [layoutColor, setLayoutColor] = useState("transparent");
  const [effectColor, setEffectColor] = useState("transparent");

  useLayoutEffect(() => {
    // Runs synchronously after DOM mutations, before paint
    setLayoutColor("#d4edda");
  }, []);

  useEffect(() => {
    // Runs asynchronously after paint
    setEffectColor("#d1ecf1");
  }, []);

  return (
    <div style={{ display: "flex", gap: 12 }}>
      <div ref={layoutRef} style={{ flex: 1, padding: 12, background: layoutColor, borderRadius: 6, border: "1px solid #ccc" }}>
        <strong>useLayoutEffect</strong>
        <p style={{ fontSize: 12 }}>Color set synchronously — no flash</p>
      </div>
      <div ref={effectRef} style={{ flex: 1, padding: 12, background: effectColor, borderRadius: 6, border: "1px solid #ccc" }}>
        <strong>useEffect</strong>
        <p style={{ fontSize: 12 }}>Color set asynchronously — may briefly flash</p>
      </div>
    </div>
  );
}

function Ex09_AutoFocusOnMount() {
  const ref = useRef<HTMLInputElement>(null);
  const [visible, setVisible] = useState(false);
  useLayoutEffect(() => {
    if (visible && ref.current) ref.current.focus();
  }, [visible]);
  return (
    <div>
      <button onClick={() => setVisible((v) => !v)}>{visible ? "Hide" : "Show"} input</button>
      {visible && (
        <div style={{ marginTop: 8 }}>
          <input ref={ref} placeholder="Auto-focused via useLayoutEffect" style={{ width: 260 }} />
        </div>
      )}
    </div>
  );
}

function Ex10_MeasureOnResize() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(Math.round(el.getBoundingClientRect().width));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ resize: "horizontal", overflow: "auto", minWidth: 100, maxWidth: 400, padding: 12, background: "#eef", borderRadius: 6 }}>
      <strong>Resize me →</strong>
      <p style={{ fontSize: 12 }}>Current width: {width}px</p>
    </div>
  );
}

function Ex11_ScrollToBottom() {
  const [messages, setMessages] = useState(["Hello!", "How are you?"]);
  const listRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);
  return (
    <div>
      <div ref={listRef} style={{ height: 100, overflow: "auto", border: "1px solid #ccc", padding: 8 }}>
        {messages.map((m, i) => <div key={i}>{m}</div>)}
      </div>
      <button
        onClick={() => setMessages((prev) => [...prev, `Message ${prev.length + 1}`])}
        style={{ marginTop: 8 }}
      >
        Add message (auto-scroll)
      </button>
    </div>
  );
}

function Ex12_PatchWidthBeforePaint() {
  const ref = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("Short");
  useLayoutEffect(() => {
    if (ref.current) {
      // Force equal width to the parent — measured and applied before paint
      const parent = ref.current.parentElement;
      if (parent) ref.current.style.width = `${parent.clientWidth - 32}px`;
    }
  }, [label]);
  return (
    <div style={{ padding: 16, border: "1px solid #ccc", borderRadius: 6 }}>
      <div ref={ref} style={{ background: "#4a90d9", color: "#fff", padding: 8, borderRadius: 4 }}>
        {label}
      </div>
      <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
        {["Short", "A much longer label that takes more space"].map((l) => (
          <button key={l} onClick={() => setLabel(l)}>{l.slice(0, 12)}…</button>
        ))}
      </div>
    </div>
  );
}

// ─── INTERMEDIATE (13–25) ─────────────────────────────────────────────────────

function Ex13_TooltipPositioning() {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!tooltip || !tooltipRef.current) return;
    const el = tooltipRef.current;
    const rect = el.getBoundingClientRect();
    // Prevent overflow off right edge
    if (rect.right > window.innerWidth) {
      el.style.left = `${tooltip.x - rect.width}px`;
    }
  }, [tooltip]);
  const items = ["Hover me", "And me", "Also me"];
  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", gap: 8 }}>
        {items.map((item) => (
          <span
            key={item}
            onMouseEnter={(e) => {
              const r = (e.target as HTMLElement).getBoundingClientRect();
              setTooltip({ x: r.left, y: r.bottom + 4, text: `Tooltip: ${item}` });
            }}
            onMouseLeave={() => setTooltip(null)}
            style={{ padding: "4px 10px", background: "#eee", borderRadius: 4, cursor: "default" }}
          >
            {item}
          </span>
        ))}
      </div>
      {tooltip && (
        <div
          ref={tooltipRef}
          style={{ position: "fixed", top: tooltip.y, left: tooltip.x, background: "#333", color: "#fff", padding: "4px 10px", borderRadius: 4, fontSize: 12, zIndex: 1000, pointerEvents: "none" }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}

function Ex14_StickyHeader() {
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const header = headerRef.current;
    const content = contentRef.current;
    if (!header || !content) return;
    const height = header.getBoundingClientRect().height;
    content.style.paddingTop = `${height}px`;
  }, []);
  return (
    <div style={{ position: "relative", height: 120, overflow: "auto", border: "1px solid #ccc" }}>
      <div ref={headerRef} style={{ position: "sticky", top: 0, background: "#4a90d9", color: "#fff", padding: 8, fontWeight: "bold", zIndex: 1 }}>
        Sticky Header
      </div>
      <div ref={contentRef}>
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} style={{ padding: 8, borderBottom: "1px solid #eee" }}>Content row {i + 1}</div>
        ))}
      </div>
    </div>
  );
}

function Ex15_ModalCentering() {
  const [open, setOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!open || !modalRef.current) return;
    const el = modalRef.current;
    const { width, height } = el.getBoundingClientRect();
    el.style.marginLeft = `-${width / 2}px`;
    el.style.marginTop = `-${height / 2}px`;
  }, [open]);
  return (
    <div>
      <button onClick={() => setOpen(true)}>Open modal</button>
      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div ref={modalRef} style={{ background: "#fff", padding: 24, borderRadius: 8, minWidth: 200 }}>
            <p>Centered via useLayoutEffect</p>
            <button onClick={() => setOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Ex16_DropdownPositioning() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !dropdownRef.current) return;
    const tr = triggerRef.current.getBoundingClientRect();
    const dd = dropdownRef.current;
    dd.style.top = `${tr.bottom + window.scrollY}px`;
    dd.style.left = `${tr.left + window.scrollX}px`;
    dd.style.minWidth = `${tr.width}px`;
  }, [open]);
  return (
    <div style={{ position: "relative", height: 120 }}>
      <button ref={triggerRef} onClick={() => setOpen((o) => !o)}>Dropdown</button>
      {open && (
        <div
          ref={dropdownRef}
          style={{ position: "absolute", background: "#fff", border: "1px solid #ccc", borderRadius: 4, zIndex: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
        >
          {["Option A", "Option B", "Option C"].map((opt) => (
            <div key={opt} onClick={() => setOpen(false)} style={{ padding: "8px 12px", cursor: "pointer", whiteSpace: "nowrap" }}>
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Ex17_AutoResizeTextarea() {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState("Type here…");
  useLayoutEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = "auto";
    ref.current.style.height = `${ref.current.scrollHeight}px`;
  }, [value]);
  return (
    <div>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{ width: "100%", resize: "none", overflow: "hidden", padding: 8, fontFamily: "inherit", fontSize: 14 }}
      />
      <p style={{ fontSize: 12, color: "#888" }}>Height auto-adjusts via useLayoutEffect before paint</p>
    </div>
  );
}

function Ex18_HighlightText() {
  const ref = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("React");
  const text = "React is a JavaScript library for building user interfaces. React makes it painless to create interactive UIs.";
  useLayoutEffect(() => {
    if (!ref.current) return;
    if (!query.trim()) { ref.current.innerHTML = text; return; }
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    ref.current.innerHTML = text.replace(new RegExp(escaped, "gi"), (m) => `<mark style="background:#ffe58f">${m}</mark>`);
  }, [query, text]);
  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Highlight query" style={{ marginBottom: 8 }} />
      <div ref={ref} style={{ lineHeight: 1.6 }} />
    </div>
  );
}

function Ex19_MeasureAndReport() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [measurements, setMeasurements] = useState<{ label: string; value: string }[]>([]);
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    setMeasurements([
      { label: "Width", value: `${rect.width.toFixed(1)}px` },
      { label: "Height", value: `${rect.height.toFixed(1)}px` },
      { label: "Top (viewport)", value: `${rect.top.toFixed(1)}px` },
      { label: "Line height", value: style.lineHeight },
      { label: "Font size", value: style.fontSize },
      { label: "Box sizing", value: style.boxSizing },
    ]);
  }, []);
  return (
    <div>
      <div ref={containerRef} style={{ padding: 12, background: "#fffde7", borderRadius: 6, lineHeight: 1.8, fontSize: 15 }}>
        Measured element
      </div>
      <ul style={{ margin: "8px 0 0", paddingLeft: 20, fontSize: 12 }}>
        {measurements.map((m) => <li key={m.label}>{m.label}: {m.value}</li>)}
      </ul>
    </div>
  );
}

function Ex20_FocusManagement() {
  const [step, setStep] = useState(0);
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  useLayoutEffect(() => {
    refs[step]?.current?.focus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);
  return (
    <div>
      <p style={{ fontSize: 12, color: "#888" }}>useLayoutEffect auto-focuses the current step input</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 220 }}>
        {["Name", "Email", "Message"].map((label, i) => (
          <div key={label} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ width: 60, fontSize: 13 }}>{label}</label>
            <input
              ref={refs[i]}
              placeholder={label}
              style={{ flex: 1, outline: i === step ? "2px solid #4a90d9" : undefined }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>Back</button>
        <button onClick={() => setStep((s) => Math.min(2, s + 1))} disabled={step === 2}>Next</button>
      </div>
    </div>
  );
}

function Ex21_EqualColumnHeights() {
  const refs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  const [equalized, setEqualized] = useState(false);
  useLayoutEffect(() => {
    if (!equalized) { refs.forEach((r) => { if (r.current) r.current.style.height = "auto"; }); return; }
    const heights = refs.map((r) => r.current?.getBoundingClientRect().height ?? 0);
    const max = Math.max(...heights);
    refs.forEach((r) => { if (r.current) r.current.style.height = `${max}px`; });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equalized]);
  const contents = ["Short content", "A bit longer content here that wraps to multiple lines", "Medium content here"];
  return (
    <div>
      <label>
        <input type="checkbox" checked={equalized} onChange={(e) => setEqualized(e.target.checked)} />
        {" "}Equalize column heights
      </label>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        {contents.map((c, i) => (
          <div key={i} ref={refs[i]} style={{ flex: 1, padding: 8, background: "#eef", borderRadius: 4, fontSize: 13 }}>
            {c}
          </div>
        ))}
      </div>
    </div>
  );
}

function Ex22_OverflowDetection() {
  const ref = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  const [text, setText] = useState("Short text");
  useLayoutEffect(() => {
    if (ref.current) setOverflowing(ref.current.scrollWidth > ref.current.clientWidth);
  }, [text]);
  return (
    <div>
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type long text…" style={{ width: "100%", marginBottom: 8 }} />
      <div ref={ref} style={{ width: 200, overflow: "hidden", whiteSpace: "nowrap", padding: 8, background: overflowing ? "#f8d7da" : "#d4edda", borderRadius: 4, fontSize: 13 }}>
        {text}
      </div>
      <p style={{ fontSize: 12 }}>{overflowing ? "Overflowing!" : "Fits"}</p>
    </div>
  );
}

function Ex23_PreventLayoutShift() {
  const ref = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState(["Alpha", "Beta", "Gamma"]);
  useLayoutEffect(() => {
    // Preserve scroll position during list prepend
    if (ref.current) {
      const prev = ref.current.scrollHeight - ref.current.scrollTop;
      ref.current.scrollTop = ref.current.scrollHeight - prev;
    }
  }, [items]);
  return (
    <div>
      <button onClick={() => setItems((i) => [`New item ${Date.now() % 1000}`, ...i])}>
        Prepend item
      </button>
      <div ref={ref} style={{ height: 100, overflow: "auto", border: "1px solid #ccc", marginTop: 8 }}>
        {items.map((item, i) => <div key={i} style={{ padding: 6, borderBottom: "1px solid #eee" }}>{item}</div>)}
      </div>
    </div>
  );
}

function Ex24_DynamicFontSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("Fit me!");
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let size = 32;
    el.style.fontSize = `${size}px`;
    while (el.scrollWidth > el.clientWidth && size > 8) {
      size -= 1;
      el.style.fontSize = `${size}px`;
    }
  }, [text]);
  return (
    <div>
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type text to auto-fit" />
      <div style={{ width: 200, border: "1px solid #ccc", overflow: "hidden", marginTop: 8 }}>
        <div ref={ref} style={{ whiteSpace: "nowrap", fontWeight: "bold" }}>{text}</div>
      </div>
      <p style={{ fontSize: 12 }}>Font shrinks to fit 200px container</p>
    </div>
  );
}

function Ex25_ResizablePanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const [splitPct, setSplitPct] = useState(50);
  useLayoutEffect(() => {
    if (leftRef.current) leftRef.current.style.flex = `0 0 ${splitPct}%`;
  }, [splitPct]);
  return (
    <div>
      <label>
        Split:{" "}
        <input type="range" min={20} max={80} value={splitPct} onChange={(e) => setSplitPct(Number(e.target.value))} style={{ width: 160 }} />
        {splitPct}%
      </label>
      <div ref={containerRef} style={{ display: "flex", height: 80, border: "1px solid #ccc", marginTop: 8, borderRadius: 4, overflow: "hidden" }}>
        <div ref={leftRef} style={{ background: "#4a90d9", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12 }}>
          Left {splitPct}%
        </div>
        <div style={{ flex: 1, background: "#eef", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
          Right {100 - splitPct}%
        </div>
      </div>
    </div>
  );
}

// ─── NESTED (26–37) ───────────────────────────────────────────────────────────

function Ex26_MultipleLayoutEffects() {
  const boxRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState(100);
  const [log, setLog] = useState<string[]>([]);
  // First layout effect: size the box
  useLayoutEffect(() => {
    if (boxRef.current) {
      boxRef.current.style.width = `${size}px`;
      boxRef.current.style.height = `${size}px`;
    }
    setLog((l) => [...l.slice(-3), `Effect 1: box ${size}px`]);
  }, [size]);
  // Second layout effect: measure box and update label
  useLayoutEffect(() => {
    if (boxRef.current && labelRef.current) {
      const rect = boxRef.current.getBoundingClientRect();
      labelRef.current.textContent = `${Math.round(rect.width)}×${Math.round(rect.height)}`;
    }
    setLog((l) => [...l.slice(-3), "Effect 2: label updated"]);
  }, [size]);
  return (
    <div>
      <label>
        Size:{" "}
        <input type="range" min={50} max={200} value={size} onChange={(e) => setSize(Number(e.target.value))} style={{ width: 120 }} />
        {size}px
      </label>
      <div ref={boxRef} style={{ background: "#4a90d9", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 8, borderRadius: 4 }}>
        <span ref={labelRef} style={{ color: "#fff", fontSize: 12 }} />
      </div>
      <ul style={{ fontSize: 11, paddingLeft: 20, margin: "4px 0" }}>
        {log.map((l, i) => <li key={i}>{l}</li>)}
      </ul>
    </div>
  );
}

function Ex27_WithResizeObserver() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ w: Math.round(width), h: Math.round(height) });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ resize: "both", overflow: "auto", minWidth: 100, minHeight: 60, maxWidth: 350, padding: 12, background: "#fffde7", borderRadius: 6 }}>
      <strong>Resize me (drag corner)</strong>
      <p style={{ fontSize: 12 }}>ResizeObserver inside useLayoutEffect: {size.w}×{size.h}px</p>
    </div>
  );
}

function Ex28_LayoutEffectAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !playing) return;
    // Reset position synchronously, then animate
    el.style.transition = "none";
    el.style.transform = "translateX(0)";
    // Force reflow
    void el.offsetWidth;
    el.style.transition = "transform 1s ease-in-out";
    el.style.transform = "translateX(200px)";
    const id = setTimeout(() => setPlaying(false), 1000);
    return () => clearTimeout(id);
  }, [playing]);
  return (
    <div style={{ overflow: "hidden", padding: 16, background: "#f5f5f5", borderRadius: 6 }}>
      <div ref={ref} style={{ display: "inline-block", padding: "8px 16px", background: "#4a90d9", color: "#fff", borderRadius: 4 }}>
        Box
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={() => setPlaying(true)} disabled={playing}>Animate</button>
      </div>
    </div>
  );
}

function Ex29_LayoutEffectFocusTrap() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!open || !dialogRef.current) return;
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>("button, input, a, [tabindex]");
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last?.focus(); } }
      else { if (document.activeElement === last) { e.preventDefault(); first?.focus(); } }
    };
    document.addEventListener("keydown", trap);
    return () => document.removeEventListener("keydown", trap);
  }, [open]);
  return (
    <div>
      <button onClick={() => setOpen(true)}>Open focus-trapped dialog</button>
      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div ref={dialogRef} style={{ background: "#fff", padding: 24, borderRadius: 8, width: 280 }}>
            <h3 style={{ margin: "0 0 12px" }}>Focus-trapped dialog</h3>
            <input placeholder="Tab cycles here" style={{ marginBottom: 8, display: "block", width: "100%" }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button>Action</button>
              <button onClick={() => setOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Ex30_NestedMeasure() {
  const parentRef = useRef<HTMLDivElement>(null);
  const childRef = useRef<HTMLDivElement>(null);
  const [info, setInfo] = useState({ parent: { w: 0, h: 0 }, child: { w: 0, h: 0 }, relative: { x: 0, y: 0 } });
  useLayoutEffect(() => {
    if (!parentRef.current || !childRef.current) return;
    const pr = parentRef.current.getBoundingClientRect();
    const cr = childRef.current.getBoundingClientRect();
    setInfo({
      parent: { w: Math.round(pr.width), h: Math.round(pr.height) },
      child: { w: Math.round(cr.width), h: Math.round(cr.height) },
      relative: { x: Math.round(cr.left - pr.left), y: Math.round(cr.top - pr.top) },
    });
  }, []);
  return (
    <div>
      <div ref={parentRef} style={{ padding: 16, background: "#eef", borderRadius: 6, position: "relative" }}>
        Parent
        <div ref={childRef} style={{ display: "inline-block", marginLeft: 20, padding: 8, background: "#4a90d9", color: "#fff", borderRadius: 4 }}>
          Child
        </div>
      </div>
      <p style={{ fontSize: 12 }}>Parent: {info.parent.w}×{info.parent.h} | Child: {info.child.w}×{info.child.h} | Offset: ({info.relative.x},{info.relative.y})</p>
    </div>
  );
}

function useMeasure<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  useLayoutEffect(() => {
    if (ref.current) setRect(ref.current.getBoundingClientRect());
  }, []);
  return { ref, rect };
}
function Ex31_CustomUseMeasure() {
  const { ref, rect } = useMeasure<HTMLDivElement>();
  const { ref: btnRef, rect: btnRect } = useMeasure<HTMLButtonElement>();
  return (
    <div>
      <div ref={ref} style={{ padding: 16, background: "#fffde7", borderRadius: 6, marginBottom: 8 }}>
        Measured div
      </div>
      <button ref={btnRef as React.RefObject<HTMLButtonElement>} style={{ marginBottom: 8 }}>
        Measured button
      </button>
      <ul style={{ paddingLeft: 20, margin: 0, fontSize: 12 }}>
        <li>Div: {rect ? `${rect.width.toFixed(0)}×${rect.height.toFixed(0)}` : "?"}</li>
        <li>Button: {btnRect ? `${btnRect.width.toFixed(0)}×${btnRect.height.toFixed(0)}` : "?"}</li>
      </ul>
    </div>
  );
}

const CollapsePanel = memo(function CollapsePanel({ children, open }: { children: ReactNode; open: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    if (open) {
      el.style.height = "auto";
      const h = el.getBoundingClientRect().height;
      el.style.height = "0";
      void el.offsetHeight;
      el.style.transition = "height 0.3s ease";
      el.style.height = `${h}px`;
    } else {
      el.style.transition = "height 0.3s ease";
      el.style.height = "0";
    }
  }, [open]);
  return (
    <div ref={ref} style={{ overflow: "hidden", height: open ? "auto" : 0 }}>
      <div style={{ padding: 12 }}>{children}</div>
    </div>
  );
});
function Ex32_CollapseAnimation() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: "1px solid #ccc", borderRadius: 6, overflow: "hidden" }}>
      <button onClick={() => setOpen((o) => !o)} style={{ width: "100%", padding: 10, textAlign: "left", background: "#eee", border: "none", cursor: "pointer" }}>
        {open ? "▼ " : "▶ "} Accordion section
      </button>
      <CollapsePanel open={open}>
        <p>Content animated with useLayoutEffect measuring natural height before collapsing.</p>
        <p>This prevents flash of wrong height during animation.</p>
      </CollapsePanel>
    </div>
  );
}

function Ex33_PortalPositioning() {
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!anchor || !popupRef.current) return;
    const el = popupRef.current;
    el.style.top = `${anchor.bottom + 4}px`;
    el.style.left = `${anchor.left}px`;
  }, [anchor]);
  return (
    <div>
      <button
        onClick={(e) => {
          const r = (e.target as HTMLElement).getBoundingClientRect();
          setAnchor((prev) => (prev ? null : r));
        }}
      >
        Toggle popup
      </button>
      {anchor && (
        <div
          ref={popupRef}
          style={{ position: "fixed", background: "#fff", border: "1px solid #ccc", borderRadius: 6, padding: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 1000 }}
        >
          Positioned popup via useLayoutEffect
          <button onClick={() => setAnchor(null)} style={{ marginLeft: 8, fontSize: 11 }}>✕</button>
        </div>
      )}
    </div>
  );
}

// ─── ADVANCED (38–50) ─────────────────────────────────────────────────────────

function Ex34_CanvasSetup() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState("#4a90d9");
  const [size, setSize] = useState(40);
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Canvas", w / 2, h / 2);
  }, [color, size]);
  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
        <label>Color: <input type="color" value={color} onChange={(e) => setColor(e.target.value)} /></label>
        <label>Size: <input type="range" min={10} max={80} value={size} onChange={(e) => setSize(Number(e.target.value))} style={{ width: 100 }} /></label>
      </div>
      <canvas ref={canvasRef} style={{ width: "100%", height: 100, background: "#f8f8f8", borderRadius: 6, display: "block" }} />
    </div>
  );
}

function Ex35_PreventFlashOfContent() {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (ref.current) {
      // Hide during async load — applied synchronously before paint
      ref.current.style.visibility = loaded ? "visible" : "hidden";
    }
  }, [loaded]);
  useEffect(() => {
    const id = setTimeout(() => setLoaded(true), 800);
    return () => clearTimeout(id);
  }, []);
  return (
    <div>
      <div ref={ref} style={{ padding: 12, background: "#d4edda", borderRadius: 6 }}>
        Content loaded at {new Date().toLocaleTimeString()} — no flash!
      </div>
      {!loaded && <p style={{ fontSize: 12, color: "#888" }}>Loading (0.8s delay)…</p>}
    </div>
  );
}

declare global {
  interface Window { _chartLib?: { render: (el: HTMLDivElement, data: number[]) => void } }
}
function Ex36_ThirdPartyLibIntegration() {
  const ref = useRef<HTMLDivElement>(null);
  const [data, setData] = useState([10, 40, 20, 80, 50]);
  useLayoutEffect(() => {
    if (!ref.current) return;
    // Simulate third-party chart library initialisation
    const el = ref.current;
    el.innerHTML = "";
    const maxVal = Math.max(...data);
    data.forEach((v) => {
      const bar = document.createElement("div");
      bar.style.cssText = `display:inline-block;width:${100 / data.length - 2}%;height:${(v / maxVal) * 80}px;background:#4a90d9;margin:1%;vertical-align:bottom;border-radius:3px 3px 0 0`;
      el.appendChild(bar);
    });
  }, [data]);
  return (
    <div>
      <div ref={ref} style={{ height: 90, border: "1px solid #eee", background: "#fafafa", borderRadius: 4 }} />
      <button onClick={() => setData(data.map(() => Math.floor(Math.random() * 100) + 5))} style={{ marginTop: 8 }}>
        Randomize
      </button>
    </div>
  );
}

function Ex37_PortalComplexPositioning() {
  const [anchors, setAnchors] = useState<{ id: number; rect: DOMRect; text: string }[]>([]);
  const items = useMemo(() => ["Item A", "Item B", "Item C"], []);
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {items.map((item, i) => (
        <div key={item} style={{ position: "relative" }}>
          <button
            onClick={(e) => {
              const rect = (e.target as HTMLElement).getBoundingClientRect();
              setAnchors((prev) => prev.some((a) => a.id === i) ? prev.filter((a) => a.id !== i) : [...prev, { id: i, rect, text: item }]);
            }}
          >
            {item}
          </button>
        </div>
      ))}
      {anchors.map(({ id, rect, text }) => (
        <FloatingLabel key={id} rect={rect} text={text} />
      ))}
    </div>
  );
}
function FloatingLabel({ rect, text }: { rect: DOMRect; text: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    el.style.top = `${rect.bottom + 6}px`;
    el.style.left = `${rect.left + rect.width / 2}px`;
    el.style.transform = "translateX(-50%)";
  }, [rect]);
  return (
    <div ref={ref} style={{ position: "fixed", background: "#333", color: "#fff", padding: "3px 8px", borderRadius: 4, fontSize: 12, zIndex: 100 }}>
      {text}
    </div>
  );
}

function Ex38_VsUseEffect_OrderDemo() {
  const [count, setCount] = useState(0);
  const log = useRef<string[]>([]);
  log.current = [];
  log.current.push(`Render #${count}`);
  useLayoutEffect(() => { log.current.push("useLayoutEffect (sync)"); });
  useEffect(() => { log.current.push("useEffect (async)"); });
  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>+1 (check console)</button>
      <p style={{ fontSize: 12 }}>Execution order (visible in console):</p>
      <ol style={{ paddingLeft: 20, margin: 0, fontSize: 12 }}>
        <li>Render (synchronous)</li>
        <li>useLayoutEffect (synchronous, before paint)</li>
        <li>Browser paints</li>
        <li>useEffect (asynchronous, after paint)</li>
      </ol>
    </div>
  );
}

function Ex39_StickyLabel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const container = containerRef.current;
    const label = labelRef.current;
    if (!container || !label) return;
    const onScroll = () => {
      const rect = container.getBoundingClientRect();
      label.style.opacity = rect.top < 0 ? "1" : "0";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div ref={containerRef} style={{ position: "relative", height: 80, overflow: "auto", border: "1px solid #ccc" }}>
      <div ref={labelRef} style={{ position: "sticky", top: 0, background: "#4a90d9", color: "#fff", padding: 4, opacity: 0, transition: "opacity 0.2s", fontSize: 12, zIndex: 1 }}>
        Scrolled past header
      </div>
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} style={{ padding: 6, borderBottom: "1px solid #eee" }}>Row {i + 1}</div>
      ))}
    </div>
  );
}

function Ex40_ElementQueryPattern() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<"sm" | "md" | "lg">("md");
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const w = el.getBoundingClientRect().width;
      setSize(w < 200 ? "sm" : w < 350 ? "md" : "lg");
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const bgMap = { sm: "#f8d7da", md: "#fffde7", lg: "#d4edda" };
  return (
    <div ref={ref} style={{ resize: "horizontal", overflow: "auto", minWidth: 100, maxWidth: 500, padding: 16, background: bgMap[size], borderRadius: 6 }}>
      <strong>Size: {size}</strong>
      <p style={{ fontSize: 12 }}>Drag to resize. Layout changes based on element width.</p>
      {size === "lg" && <p style={{ fontSize: 12 }}>Extra content shown at lg breakpoint</p>}
    </div>
  );
}

function Ex41_PreciseScrollRestoration() {
  const ref = useRef<HTMLDivElement>(null);
  const savedScroll = useRef(0);
  const [items, setItems] = useState(() => Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`));
  const prepend = useCallback(() => {
    if (ref.current) savedScroll.current = ref.current.scrollTop + ref.current.scrollHeight;
    setItems((prev) => [`New item ${Date.now() % 1000}`, ...prev]);
  }, []);
  useLayoutEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = savedScroll.current - ref.current.scrollHeight;
    }
  }, [items]);
  return (
    <div>
      <button onClick={prepend}>Prepend (scroll preserved)</button>
      <div ref={ref} style={{ height: 120, overflow: "auto", border: "1px solid #ccc", marginTop: 8 }}>
        {items.map((item, i) => <div key={i} style={{ padding: 6, borderBottom: "1px solid #eee" }}>{item}</div>)}
      </div>
    </div>
  );
}

function Ex42_CompareEffectOrdering() {
  const order = useRef<string[]>([]);
  const [render, setRender] = useState(0);
  if (order.current.length === 0 || render > 0) order.current = [];
  order.current.push("1. render body");
  useLayoutEffect(() => { order.current.push("2. useLayoutEffect"); });
  useLayoutEffect(() => { order.current.push("3. second useLayoutEffect"); });
  useEffect(() => { order.current.push("4. useEffect"); });
  useEffect(() => { order.current.push("5. second useEffect"); });
  return (
    <div>
      <button onClick={() => setRender((r) => r + 1)}>Re-render #{render}</button>
      <p style={{ fontSize: 12, color: "#888" }}>Execution order (each render):</p>
      <ol style={{ paddingLeft: 20, fontSize: 12 }}>
        {order.current.map((s, i) => <li key={i}>{s}</li>)}
      </ol>
    </div>
  );
}

function Ex43_DeferredPaint() {
  const ref = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("initial");
  useLayoutEffect(() => {
    if (!ref.current) return;
    // Heavy synchronous work before paint (demonstrates blocking nature)
    let sum = 0;
    for (let i = 0; i < 1_000_000; i++) sum += i;
    ref.current.dataset.sum = String(sum % 1000);
  }, [text]);
  return (
    <div>
      <div ref={ref} style={{ padding: 12, background: "#fffde7", borderRadius: 6 }}>
        useLayoutEffect blocks paint: {text}
      </div>
      <button onClick={() => setText(`update-${Date.now() % 1000}`)} style={{ marginTop: 8 }}>
        Update (heavy layoutEffect)
      </button>
      <p style={{ fontSize: 12, color: "#888" }}>Note: heavy work in useLayoutEffect blocks paint. Prefer useEffect for non-visual tasks.</p>
    </div>
  );
}

function Ex44_ComplexAnimationSystem() {
  const ref = useRef<HTMLDivElement>(null);
  const animRef = useRef<Animation | null>(null);
  const [state, setState] = useState<"idle" | "playing" | "paused">("idle");
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (state === "playing") {
      animRef.current = el.animate(
        [{ transform: "translateX(0) rotate(0deg)", opacity: 1 }, { transform: "translateX(180px) rotate(360deg)", opacity: 0.6 }, { transform: "translateX(0) rotate(720deg)", opacity: 1 }],
        { duration: 2000, easing: "ease-in-out", fill: "forwards" }
      );
      animRef.current.onfinish = () => setState("idle");
    } else if (state === "paused") {
      animRef.current?.pause();
    } else {
      animRef.current?.cancel();
    }
    return () => { if (state === "idle") animRef.current?.cancel(); };
  }, [state]);
  return (
    <div style={{ padding: 16, background: "#f5f5f5", borderRadius: 6, overflow: "hidden" }}>
      <div ref={ref} style={{ display: "inline-block", padding: "8px 16px", background: "#4a90d9", color: "#fff", borderRadius: 4 }}>
        Animated box
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button onClick={() => setState("playing")} disabled={state === "playing"}>Play</button>
        <button onClick={() => setState("paused")} disabled={state !== "playing"}>Pause</button>
        <button onClick={() => setState("idle")}>Reset</button>
      </div>
    </div>
  );
}

function Ex45_ImageLoadFlash() {
  const imgRef = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  useLayoutEffect(() => {
    if (!imgRef.current) return;
    imgRef.current.style.opacity = src ? "1" : "0";
    imgRef.current.style.transition = src ? "opacity 0.4s" : "none";
  }, [src]);
  const load = useCallback(() => {
    setLoading(true);
    setSrc(null);
    setTimeout(() => {
      setSrc(`https://picsum.photos/seed/${Date.now() % 100}/300/120`);
      setLoading(false);
    }, 600);
  }, []);
  return (
    <div>
      <button onClick={load} disabled={loading}>{loading ? "Loading…" : "Load image"}</button>
      <div ref={imgRef} style={{ marginTop: 8, minHeight: 40 }}>
        {src && <img src={src} alt="random" style={{ borderRadius: 6, display: "block", width: "100%", maxWidth: 300 }} />}
      </div>
    </div>
  );
}

function Ex46_SynchronousDOMPatch() {
  const ref = useRef<HTMLUListElement>(null);
  const [items, setItems] = useState(["Alpha", "Beta", "Gamma"]);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const children = ref.current.querySelectorAll("li");
    children.forEach((li, i) => {
      li.style.animationDelay = `${i * 80}ms`;
      li.style.animation = "none";
      void li.offsetHeight;
      li.style.animation = "fadeSlide 0.3s ease forwards";
    });
  }, [items]);
  return (
    <div>
      <style>{`@keyframes fadeSlide { from { opacity:0;transform:translateY(-8px) } to { opacity:1;transform:none } }`}</style>
      <button onClick={() => setItems((i) => [`New ${Date.now() % 1000}`, ...i.slice(0, 4)])}>
        Prepend item
      </button>
      <ul ref={ref} style={{ paddingLeft: 20, margin: "8px 0" }}>
        {items.map((item, i) => <li key={`${item}-${i}`} style={{ marginBottom: 4 }}>{item}</li>)}
      </ul>
    </div>
  );
}

function Ex47_VirtualScrollLayout() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const itemHeight = 32;
  const totalItems = 1000;
  useLayoutEffect(() => {
    if (containerRef.current) setContainerHeight(containerRef.current.clientHeight);
  }, []);
  const startIdx = Math.floor(scrollTop / itemHeight);
  const visibleCount = Math.ceil(containerHeight / itemHeight) + 2;
  const endIdx = Math.min(startIdx + visibleCount, totalItems);
  return (
    <div
      ref={containerRef}
      style={{ height: 150, overflow: "auto", border: "1px solid #ccc", position: "relative" }}
      onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop)}
    >
      <div style={{ height: totalItems * itemHeight, position: "relative" }}>
        {Array.from({ length: endIdx - startIdx }, (_, i) => startIdx + i).map((idx) => (
          <div
            key={idx}
            style={{ position: "absolute", top: idx * itemHeight, height: itemHeight, left: 0, right: 0, padding: "0 12px", display: "flex", alignItems: "center", borderBottom: "1px solid #eee", background: idx % 2 === 0 ? "#fafafa" : "#fff", fontSize: 13 }}
          >
            Row {idx + 1} of {totalItems}
          </div>
        ))}
      </div>
    </div>
  );
}

function Ex48_DOMDiffPatch() {
  const ref = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<"a" | "b">("a");
  useLayoutEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    el.style.transition = "none";
    el.style.transform = "scale(0.95) translateY(-4px)";
    el.style.opacity = "0.4";
    void el.offsetHeight;
    el.style.transition = "all 0.25s ease";
    el.style.transform = "none";
    el.style.opacity = "1";
  }, [theme]);
  const configs = {
    a: { bg: "#dbeafe", accent: "#2563eb", label: "Theme A" },
    b: { bg: "#dcfce7", accent: "#16a34a", label: "Theme B" },
  };
  const { bg, accent, label } = configs[theme];
  return (
    <div>
      <button onClick={() => setTheme((t) => (t === "a" ? "b" : "a"))}>Toggle theme</button>
      <div ref={ref} style={{ marginTop: 8, padding: 16, background: bg, borderLeft: `4px solid ${accent}`, borderRadius: 4 }}>
        <strong style={{ color: accent }}>{label}</strong> — transitioned via useLayoutEffect
      </div>
    </div>
  );
}

function Ex49_LayoutWithIntersection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        // Synchronously apply class/style for layout calculations
        el.style.outline = entry.isIntersecting ? "2px solid #4a90d9" : "none";
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div style={{ height: 100, overflow: "auto", border: "1px solid #ccc" }}>
      <div style={{ height: 60, background: "#f8f8f8", display: "flex", alignItems: "center", paddingLeft: 12, fontSize: 12 }}>Scroll down</div>
      <div ref={ref} style={{ height: 60, padding: 12, background: visible ? "#e8f5e9" : "#fff", transition: "background 0.3s", display: "flex", alignItems: "center", fontSize: 13 }}>
        {visible ? "I am visible!" : "Scroll down to see me"}
      </div>
      <div style={{ height: 40 }} />
    </div>
  );
}

function Ex50_FullLayoutOrchestration() {
  const headerRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [headerH, setHeaderH] = useState(0);
  useLayoutEffect(() => {
    const header = headerRef.current;
    const sidebar = sidebarRef.current;
    const content = contentRef.current;
    if (!header || !sidebar || !content) return;
    const hh = header.getBoundingClientRect().height;
    setHeaderH(hh);
    sidebar.style.top = `${hh}px`;
    sidebar.style.height = `calc(100% - ${hh}px)`;
    content.style.paddingLeft = collapsed ? "0" : `${sidebar.getBoundingClientRect().width}px`;
    content.style.paddingTop = `${hh}px`;
  }, [collapsed]);
  return (
    <div style={{ position: "relative", height: 180, overflow: "hidden", border: "1px solid #ccc", borderRadius: 6 }}>
      <div ref={headerRef} style={{ position: "absolute", top: 0, left: 0, right: 0, background: "#4a90d9", color: "#fff", padding: 8, zIndex: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>App Header (h={Math.round(headerH)}px)</span>
        <button onClick={() => setCollapsed((c) => !c)} style={{ color: "#fff", background: "transparent", border: "1px solid #fff", cursor: "pointer", padding: "2px 8px", borderRadius: 3 }}>
          {collapsed ? "Show" : "Hide"} sidebar
        </button>
      </div>
      {!collapsed && (
        <div ref={sidebarRef} style={{ position: "absolute", left: 0, width: 100, background: "#eef", zIndex: 1, padding: 8, fontSize: 12 }}>
          Sidebar<br />Nav 1<br />Nav 2<br />Nav 3
        </div>
      )}
      <div ref={contentRef} style={{ height: "100%", padding: 8, fontSize: 13, overflow: "auto" }}>
        Main content — padding adjusted via useLayoutEffect based on sidebar width and header height.
      </div>
    </div>
  );
}

// ─── Examples registry ────────────────────────────────────────────────────────

const examples: { label: string; component: JSX.Element }[] = [
  { label: "01 [Basic] Measure DOM element", component: <Ex01_MeasureDOM /> },
  { label: "02 [Basic] Set style before paint", component: <Ex02_SetStyleBeforePaint /> },
  { label: "03 [Basic] Sync scroll (two panels)", component: <Ex03_SyncScroll /> },
  { label: "04 [Basic] Read computed style", component: <Ex04_ReadComputedStyle /> },
  { label: "05 [Basic] getBoundingClientRect", component: <Ex05_GetBoundingClientRect /> },
  { label: "06 [Basic] Measure text width", component: <Ex06_MeasureTextWidth /> },
  { label: "07 [Basic] Set CSS variable before paint", component: <Ex07_SetCSSVariable /> },
  { label: "08 [Basic] Compare useLayoutEffect vs useEffect", component: <Ex08_CompareWithUseEffect /> },
  { label: "09 [Basic] Auto-focus on mount", component: <Ex09_AutoFocusOnMount /> },
  { label: "10 [Basic] Measure on resize (ResizeObserver)", component: <Ex10_MeasureOnResize /> },
  { label: "11 [Basic] Scroll-to-bottom on message add", component: <Ex11_ScrollToBottom /> },
  { label: "12 [Basic] Patch element width to parent before paint", component: <Ex12_PatchWidthBeforePaint /> },
  { label: "13 [Intermediate] Tooltip positioning", component: <Ex13_TooltipPositioning /> },
  { label: "14 [Intermediate] Sticky header height compensation", component: <Ex14_StickyHeader /> },
  { label: "15 [Intermediate] Modal centering", component: <Ex15_ModalCentering /> },
  { label: "16 [Intermediate] Dropdown positioning", component: <Ex16_DropdownPositioning /> },
  { label: "17 [Intermediate] Auto-resize textarea", component: <Ex17_AutoResizeTextarea /> },
  { label: "18 [Intermediate] Highlight text in DOM", component: <Ex18_HighlightText /> },
  { label: "19 [Intermediate] Measure and report element metrics", component: <Ex19_MeasureAndReport /> },
  { label: "20 [Intermediate] Focus management (wizard steps)", component: <Ex20_FocusManagement /> },
  { label: "21 [Intermediate] Equalize column heights", component: <Ex21_EqualColumnHeights /> },
  { label: "22 [Intermediate] Overflow detection", component: <Ex22_OverflowDetection /> },
  { label: "23 [Intermediate] Prevent layout shift on prepend", component: <Ex23_PreventLayoutShift /> },
  { label: "24 [Intermediate] Dynamic font size (fit container)", component: <Ex24_DynamicFontSize /> },
  { label: "25 [Intermediate] Resizable panel split", component: <Ex25_ResizablePanel /> },
  { label: "26 [Nested] Multiple layout effects (sequenced)", component: <Ex26_MultipleLayoutEffects /> },
  { label: "27 [Nested] useLayoutEffect + ResizeObserver", component: <Ex27_WithResizeObserver /> },
  { label: "28 [Nested] Layout effect + FLIP animation", component: <Ex28_LayoutEffectAnimation /> },
  { label: "29 [Nested] Focus trap in dialog", component: <Ex29_LayoutEffectFocusTrap /> },
  { label: "30 [Nested] Nested element measurement", component: <Ex30_NestedMeasure /> },
  { label: "31 [Nested] Custom useMeasure hook", component: <Ex31_CustomUseMeasure /> },
  { label: "32 [Nested] Collapse/expand animation", component: <Ex32_CollapseAnimation /> },
  { label: "33 [Nested] Portal-style popup positioning", component: <Ex33_PortalPositioning /> },
  { label: "34 [Advanced] Canvas setup (device pixel ratio)", component: <Ex34_CanvasSetup /> },
  { label: "35 [Advanced] Prevent flash of content", component: <Ex35_PreventFlashOfContent /> },
  { label: "36 [Advanced] Third-party lib DOM integration", component: <Ex36_ThirdPartyLibIntegration /> },
  { label: "37 [Advanced] Portal complex multi-anchor positioning", component: <Ex37_PortalComplexPositioning /> },
  { label: "38 [Advanced] Effect ordering demonstration", component: <Ex38_VsUseEffect_OrderDemo /> },
  { label: "39 [Advanced] Sticky label on scroll", component: <Ex39_StickyLabel /> },
  { label: "40 [Advanced] Element query (container queries)", component: <Ex40_ElementQueryPattern /> },
  { label: "41 [Advanced] Precise scroll restoration on prepend", component: <Ex41_PreciseScrollRestoration /> },
  { label: "42 [Advanced] Compare multiple effect ordering", component: <Ex42_CompareEffectOrdering /> },
  { label: "43 [Advanced] Blocking paint (heavy layoutEffect warning)", component: <Ex43_DeferredPaint /> },
  { label: "44 [Advanced] Complex animation system (Web Animations API)", component: <Ex44_ComplexAnimationSystem /> },
  { label: "45 [Advanced] Image load flash prevention", component: <Ex45_ImageLoadFlash /> },
  { label: "46 [Advanced] Synchronous DOM patch + staggered animation", component: <Ex46_SynchronousDOMPatch /> },
  { label: "47 [Advanced] Virtual scroll layout measurement", component: <Ex47_VirtualScrollLayout /> },
  { label: "48 [Advanced] DOM diff + transition patch", component: <Ex48_DOMDiffPatch /> },
  { label: "49 [Advanced] Layout effect + IntersectionObserver", component: <Ex49_LayoutWithIntersection /> },
  { label: "50 [Advanced] Full layout orchestration (header+sidebar+content)", component: <Ex50_FullLayoutOrchestration /> },
];

export default function UseLayoutEffectExamples() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: 24 }}>
      <h1>50 useLayoutEffect Examples — Basic · Intermediate · Nested · Advanced</h1>
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
