import React, { useState, useContext, createContext, useEffect, useRef } from "react";

// ============================================================
// Solution: Compound Components Pattern
// ============================================================

// ==================== 1. TABS ====================

interface TabsCtx {
  activeTab: string;
  setActiveTab: (id: string) => void;
}
const TabsContext = createContext<TabsCtx | null>(null);

function Tabs({ children, defaultTab }: { children: React.ReactNode; defaultTab: string }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
}

function Tab({ id, label }: { id: string; label: string }) {
  const ctx = useContext(TabsContext)!;
  const isActive = ctx.activeTab === id;
  return (
    <button
      onClick={() => ctx.setActiveTab(id)}
      style={{
        padding: "8px 16px",
        borderBottom: isActive ? "2px solid #2563eb" : "2px solid transparent",
        fontWeight: isActive ? "bold" : "normal",
        color: isActive ? "#2563eb" : "#374151",
        background: "none",
        border: "none",
        borderBottom: isActive ? "2px solid #2563eb" : "2px solid transparent",
        cursor: "pointer",
        fontSize: 15,
      }}
    >
      {label}
    </button>
  );
}

function TabPanel({ id, children }: { id: string; children: React.ReactNode }) {
  const ctx = useContext(TabsContext)!;
  if (ctx.activeTab !== id) return null;
  return <div style={{ padding: "12px 0" }}>{children}</div>;
}

// ==================== 2. ACCORDION ====================

interface AccordionCtx {
  openId: string | null;
  toggle: (id: string) => void;
}
const AccordionContext = createContext<AccordionCtx | null>(null);
const AccordionItemContext = createContext<{ id: string } | null>(null);

function Accordion({ children }: { children: React.ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const toggle = (id: string) => setOpenId((prev) => (prev === id ? null : id));
  return (
    <AccordionContext.Provider value={{ openId, toggle }}>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

function AccordionItem({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <AccordionItemContext.Provider value={{ id }}>
      <div style={{ borderBottom: "1px solid #e5e7eb" }}>{children}</div>
    </AccordionItemContext.Provider>
  );
}

function AccordionHeader({ children }: { children: React.ReactNode }) {
  const { id } = useContext(AccordionItemContext)!;
  const { openId, toggle } = useContext(AccordionContext)!;
  const isOpen = openId === id;
  return (
    <button
      onClick={() => toggle(id)}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "14px 16px",
        background: isOpen ? "#f0f9ff" : "#fff",
        border: "none",
        cursor: "pointer",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 15,
        fontWeight: isOpen ? "bold" : "normal",
      }}
    >
      {children}
      <span>{isOpen ? "▼" : "▶"}</span>
    </button>
  );
}

function AccordionPanel({ children }: { children: React.ReactNode }) {
  const { id } = useContext(AccordionItemContext)!;
  const { openId } = useContext(AccordionContext)!;
  if (openId !== id) return null;
  return (
    <div style={{ padding: "12px 16px", backgroundColor: "#f9fafb", borderTop: "1px solid #e5e7eb" }}>
      {children}
    </div>
  );
}

// ==================== 3. CUSTOM SELECT ====================

interface SelectCtx {
  value: string;
  onChange: (val: string) => void;
  isOpen: boolean;
  setIsOpen: (b: boolean) => void;
}
const SelectContext = createContext<SelectCtx | null>(null);

interface SelectProps {
  value: string;
  onChange: (val: string) => void;
  children: React.ReactNode;
  placeholder?: string;
}

function Select({ value, onChange, children, placeholder = "Select..." }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <SelectContext.Provider value={{ value, onChange, isOpen, setIsOpen }}>
      <div ref={containerRef} style={{ position: "relative", display: "inline-block", minWidth: 200 }}>
        <button
          onClick={() => setIsOpen((o) => !o)}
          style={{
            padding: "8px 16px",
            width: "100%",
            textAlign: "left",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            background: "#fff",
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>{value || placeholder}</span>
          <span>{isOpen ? "▲" : "▼"}</span>
        </button>
        {isOpen && (
          <ul
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              backgroundColor: "#fff",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              margin: "4px 0 0",
              padding: 0,
              listStyle: "none",
              boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
              zIndex: 100,
            }}
          >
            {children}
          </ul>
        )}
      </div>
    </SelectContext.Provider>
  );
}

function SelectOption({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = useContext(SelectContext)!;
  const isSelected = ctx.value === value;
  return (
    <li
      onClick={() => {
        ctx.onChange(value);
        ctx.setIsOpen(false);
      }}
      style={{
        padding: "8px 16px",
        cursor: "pointer",
        backgroundColor: isSelected ? "#dbeafe" : "transparent",
        color: isSelected ? "#1d4ed8" : "#374151",
        fontWeight: isSelected ? "bold" : "normal",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = "#f3f4f6";
      }}
      onMouseLeave={(e) => {
        if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
      }}
    >
      {children}
    </li>
  );
}

// ==================== App ====================

export function App() {
  const [selectedFruit, setSelectedFruit] = useState("");

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Solution: Compound Components</h1>

      {/* 1. Tabs */}
      <section style={{ marginBottom: 40 }}>
        <h2>Tabs</h2>
        <Tabs defaultTab="react">
          <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #e5e7eb", marginBottom: 4 }}>
            <Tab id="react" label="React" />
            <Tab id="typescript" label="TypeScript" />
            <Tab id="nodejs" label="Node.js" />
          </div>
          <TabPanel id="react"><p>React is a UI library by Meta for building component-based interfaces.</p></TabPanel>
          <TabPanel id="typescript"><p>TypeScript adds static types to JavaScript for safer code.</p></TabPanel>
          <TabPanel id="nodejs"><p>Node.js runs JavaScript on the server using the V8 engine.</p></TabPanel>
        </Tabs>
      </section>

      {/* 2. Accordion */}
      <section style={{ marginBottom: 40 }}>
        <h2>Accordion</h2>
        <Accordion>
          <AccordionItem id="q1">
            <AccordionHeader>What is React?</AccordionHeader>
            <AccordionPanel>React is a JavaScript library for building user interfaces declaratively.</AccordionPanel>
          </AccordionItem>
          <AccordionItem id="q2">
            <AccordionHeader>What is a compound component?</AccordionHeader>
            <AccordionPanel>Components that share implicit state via Context, enabling flexible composition.</AccordionPanel>
          </AccordionItem>
          <AccordionItem id="q3">
            <AccordionHeader>Why use compound components?</AccordionHeader>
            <AccordionPanel>They eliminate prop drilling while keeping the API expressive and composable.</AccordionPanel>
          </AccordionItem>
        </Accordion>
      </section>

      {/* 3. Custom Select */}
      <section style={{ marginBottom: 40 }}>
        <h2>Custom Select</h2>
        <p>Selected: <strong>{selectedFruit || "(none)"}</strong></p>
        <Select value={selectedFruit} onChange={setSelectedFruit} placeholder="Choose a fruit...">
          <SelectOption value="apple">Apple</SelectOption>
          <SelectOption value="banana">Banana</SelectOption>
          <SelectOption value="cherry">Cherry</SelectOption>
          <SelectOption value="mango">Mango</SelectOption>
        </Select>
      </section>
    </div>
  );
}
