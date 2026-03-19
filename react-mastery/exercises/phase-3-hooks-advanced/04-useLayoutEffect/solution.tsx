import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react";

// ============================================================
// Solution: useLayoutEffect — Synchronous DOM Measurement
// ============================================================

// -------------------------------------------------------
// 1. Tooltip — positions itself using useLayoutEffect
// -------------------------------------------------------
function Tooltip({
  children,
  text,
}: {
  children: React.ReactNode;
  text: string;
}) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Measure after DOM update but BEFORE paint so the tooltip
  // never appears in the wrong position.
  useLayoutEffect(() => {
    if (visible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      setCoords({
        top: triggerRect.top - tooltipRect.height - 8,
        left: triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2,
      });
    }
  }, [visible]);

  return (
    <span
      ref={triggerRef}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      style={{ position: "relative", display: "inline-block" }}
    >
      {children}
      {visible && (
        <div
          ref={tooltipRef}
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            background: "#333",
            color: "#fff",
            padding: "4px 8px",
            borderRadius: 4,
            fontSize: 12,
            whiteSpace: "nowrap",
            zIndex: 1000,
            pointerEvents: "none",
          }}
        >
          {text}
        </div>
      )}
    </span>
  );
}

function TooltipDemo() {
  return (
    <section style={{ padding: 16, marginBottom: 16, border: "1px solid #ddd" }}>
      <h2>1. Tooltip (useLayoutEffect positioning)</h2>
      <p>Hover over the buttons to see tooltips positioned above them:</p>
      <div style={{ display: "flex", gap: 16 }}>
        <Tooltip text="Save your work">
          <button>Save</button>
        </Tooltip>
        <Tooltip text="Delete this item permanently">
          <button>Delete</button>
        </Tooltip>
        <Tooltip text="Edit the current document">
          <button>Edit</button>
        </Tooltip>
      </div>
    </section>
  );
}

// -------------------------------------------------------
// 2. Flicker Comparison: useEffect vs useLayoutEffect
// -------------------------------------------------------
function FlickerComparison() {
  const [resetKey, setResetKey] = useState(0);

  return (
    <section style={{ padding: 16, marginBottom: 16, border: "1px solid #ddd" }}>
      <h2>2. Flicker Comparison</h2>
      <p style={{ fontSize: 12, color: "#888" }}>
        Click "Reset" and watch closely. The useEffect box may flicker
        (appears at left:0, then jumps). The useLayoutEffect box doesn't.
      </p>
      <button onClick={() => setResetKey((k) => k + 1)}>Reset</button>
      <div style={{ display: "flex", gap: 32, marginTop: 12 }}>
        <EffectBox key={`effect-${resetKey}`} label="useEffect" hookType="effect" />
        <LayoutEffectBox
          key={`layout-${resetKey}`}
          label="useLayoutEffect"
          hookType="layoutEffect"
        />
      </div>
    </section>
  );
}

function EffectBox({ label }: { label: string; hookType: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [left, setLeft] = useState(0);

  // useEffect: runs AFTER paint -> may cause visible jump
  useEffect(() => {
    if (ref.current) {
      const width = ref.current.offsetWidth;
      setLeft(width + 20);
    }
  }, []);

  return (
    <div style={{ position: "relative", height: 60, width: 300, background: "#f0f0f0" }}>
      <div
        ref={ref}
        style={{
          position: "absolute",
          left,
          top: 10,
          padding: "8px 12px",
          background: "#e74c3c",
          color: "#fff",
          borderRadius: 4,
          transition: "none",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function LayoutEffectBox({ label }: { label: string; hookType: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [left, setLeft] = useState(0);

  // useLayoutEffect: runs BEFORE paint -> no visible jump
  useLayoutEffect(() => {
    if (ref.current) {
      const width = ref.current.offsetWidth;
      setLeft(width + 20);
    }
  }, []);

  return (
    <div style={{ position: "relative", height: 60, width: 300, background: "#f0f0f0" }}>
      <div
        ref={ref}
        style={{
          position: "absolute",
          left,
          top: 10,
          padding: "8px 12px",
          background: "#2ecc71",
          color: "#fff",
          borderRadius: 4,
          transition: "none",
        }}
      >
        {label}
      </div>
    </div>
  );
}

// -------------------------------------------------------
// 3. AutoScrollMessages — scrolls to bottom before paint
// -------------------------------------------------------
function AutoScrollMessages() {
  const [messages, setMessages] = useState<string[]>([
    "Hello!",
    "Welcome to the chat.",
  ]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom synchronously before the browser paints
  // so the user never sees the list without being scrolled down.
  useLayoutEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages.length]);

  const addMessage = () => {
    setMessages((prev) => [
      ...prev,
      `Message #${prev.length + 1} at ${new Date().toLocaleTimeString()}`,
    ]);
  };

  return (
    <section style={{ padding: 16, marginBottom: 16, border: "1px solid #ddd" }}>
      <h2>3. Auto-Scroll Messages (useLayoutEffect)</h2>
      <div
        ref={containerRef}
        style={{
          height: 150,
          overflowY: "auto",
          border: "1px solid #ccc",
          padding: 8,
          marginBottom: 8,
        }}
      >
        {messages.map((msg, i) => (
          <div key={i} style={{ padding: "4px 0", borderBottom: "1px solid #eee" }}>
            {msg}
          </div>
        ))}
      </div>
      <button onClick={addMessage}>Add Message</button>
      <p style={{ fontSize: 12, color: "#888" }}>
        New messages appear at the bottom and the container is already scrolled
        down before you see the update (no flash of un-scrolled content).
      </p>
    </section>
  );
}

// -------------------------------------------------------
// 4. MeasureElement — reads DOM dimensions synchronously
// -------------------------------------------------------
function MeasureElement() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const measure = useCallback(() => {
    if (textareaRef.current) {
      setDimensions({
        width: textareaRef.current.offsetWidth,
        height: textareaRef.current.offsetHeight,
      });
    }
  }, []);

  // Measure on mount and whenever the window resizes
  useLayoutEffect(() => {
    measure();

    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  // Also re-measure when the user drags the textarea resize handle.
  // We use a ResizeObserver for this.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => {
      measure();
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, [measure]);

  return (
    <section style={{ padding: 16, marginBottom: 16, border: "1px solid #ddd" }}>
      <h2>4. Measure Element (useLayoutEffect)</h2>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <textarea
          ref={textareaRef}
          defaultValue="Drag the corner to resize me!"
          style={{ width: 250, height: 100, resize: "both", padding: 8 }}
        />
        <div style={{ padding: 8, background: "#f5f5f5", borderRadius: 4 }}>
          <p>
            Width: <strong>{dimensions.width}px</strong>
          </p>
          <p>
            Height: <strong>{dimensions.height}px</strong>
          </p>
          <p style={{ fontSize: 12, color: "#888" }}>
            Values update synchronously via useLayoutEffect + ResizeObserver.
          </p>
        </div>
      </div>
    </section>
  );
}

// -------------------------------------------------------
// App
// -------------------------------------------------------
export function App() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: 16 }}>
      <h1>Solution: useLayoutEffect</h1>
      <TooltipDemo />
      <FlickerComparison />
      <AutoScrollMessages />
      <MeasureElement />
    </div>
  );
}
