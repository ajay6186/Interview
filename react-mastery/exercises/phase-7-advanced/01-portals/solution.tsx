import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

// ============================================================
// Solution: React Portals
// ============================================================

// --- 1. ModalPortal ---
function ModalPortal({ children }: { children: React.ReactNode }) {
  return createPortal(children, document.body);
}

// --- 2. Modal ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <ModalPortal>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
      >
        {/* Dialog — stop propagation so clicking inside doesn't close */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: "#fff",
            borderRadius: 8,
            padding: 24,
            minWidth: 360,
            maxWidth: "90vw",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>{title}</h2>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
          {children}
        </div>
      </div>
    </ModalPortal>
  );
}

// --- 3. Toast system ---
type ToastType = "success" | "error" | "info";
type ToastMessage = { id: number; message: string; type: ToastType };

function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const nextId = useRef(0);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

const toastColors: Record<ToastType, string> = {
  success: "#16a34a",
  error: "#dc2626",
  info: "#2563eb",
};

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div
      style={{
        backgroundColor: toastColors[toast.type],
        color: "#fff",
        padding: "10px 16px",
        borderRadius: 6,
        marginTop: 8,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        minWidth: 240,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      }}
    >
      <span>{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", marginLeft: 12 }}
      >
        ✕
      </button>
    </div>
  );
}

function ToastContainer({ toasts, onRemove }: { toasts: ToastMessage[]; onRemove: (id: number) => void }) {
  return createPortal(
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 2000 }}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>,
    document.body
  );
}

// --- 4. Tooltip ---
function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);

  function handleMouseEnter() {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({ top: rect.top - 36, left: rect.left + rect.width / 2 });
    }
    setVisible(true);
  }

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setVisible(false)}
        style={{ borderBottom: "1px dashed #6b7280", cursor: "help" }}
      >
        {children}
      </span>
      {visible &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              transform: "translateX(-50%)",
              backgroundColor: "#1f2937",
              color: "#fff",
              padding: "4px 10px",
              borderRadius: 4,
              fontSize: 13,
              whiteSpace: "nowrap",
              zIndex: 3000,
              pointerEvents: "none",
            }}
          >
            {text}
          </div>,
          document.body
        )}
    </>
  );
}

// --- 5. EventBubblingDemo ---
function EventBubblingDemo() {
  const [log, setLog] = useState<string[]>([]);
  const addLog = (msg: string) => setLog((prev) => [...prev, msg]);

  return (
    <div
      onClick={() => addLog("React parent div clicked (event bubbled through React tree)")}
      style={{ border: "2px solid #f59e0b", padding: 16, borderRadius: 8 }}
    >
      <h3>Event Bubbling Demo</h3>
      <p>The button below is rendered in <code>document.body</code> via a portal.</p>
      <p>Click it and watch the event bubble to this React parent div.</p>
      {createPortal(
        <button
          onClick={() => addLog("Button in portal clicked")}
          style={{ padding: "8px 16px", marginBottom: 8 }}
        >
          Click me (in portal → document.body)
        </button>,
        document.body
      )}
      <div style={{ marginTop: 12, fontFamily: "monospace", fontSize: 13 }}>
        {log.map((entry, i) => (
          <div key={i} style={{ color: "#374151" }}>▶ {entry}</div>
        ))}
        {log.length > 0 && (
          <button onClick={(e) => { e.stopPropagation(); setLog([]); }} style={{ marginTop: 8 }}>
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

// --- App ---
export function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 20 }}>
      <h1>Solution: React Portals</h1>

      {/* Modal demo */}
      <section style={{ marginBottom: 32 }}>
        <h2>1. Modal Portal</h2>
        <p>The modal renders in <code>document.body</code>, outside this div's DOM tree.</p>
        <button onClick={() => setIsModalOpen(true)} style={{ padding: "8px 16px" }}>
          Open Modal
        </button>
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Portal Modal">
          <p>This modal is rendered via <code>createPortal</code> into document.body.</p>
          <p>Press <kbd>Escape</kbd> or click the backdrop to close.</p>
          <button onClick={() => setIsModalOpen(false)} style={{ padding: "8px 16px" }}>
            Close
          </button>
        </Modal>
      </section>

      {/* Toast demo */}
      <section style={{ marginBottom: 32 }}>
        <h2>2. Toast Portal</h2>
        <p>Toasts appear at the bottom-right and auto-dismiss after 3 seconds.</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => addToast("Operation succeeded!", "success")} style={{ padding: "8px 12px" }}>
            Success Toast
          </button>
          <button onClick={() => addToast("Something went wrong!", "error")} style={{ padding: "8px 12px" }}>
            Error Toast
          </button>
          <button onClick={() => addToast("FYI: here's some info.", "info")} style={{ padding: "8px 12px" }}>
            Info Toast
          </button>
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </section>

      {/* Tooltip demo */}
      <section style={{ marginBottom: 32 }}>
        <h2>3. Tooltip Portal</h2>
        <p>
          Hover over{" "}
          <Tooltip text="This tooltip renders in document.body via a portal!">
            this text
          </Tooltip>{" "}
          to see a portal-based tooltip.
        </p>
      </section>

      {/* Event bubbling demo */}
      <section style={{ marginBottom: 32 }}>
        <h2>4. Event Bubbling</h2>
        <EventBubblingDemo />
      </section>
    </div>
  );
}
