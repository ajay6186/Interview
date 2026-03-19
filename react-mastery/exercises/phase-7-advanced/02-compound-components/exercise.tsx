import React, { useState, useContext, createContext } from "react";

// ============================================================
// Exercise: Compound Components Pattern
// ============================================================
// Compound components share implicit state through Context.
// The parent manages state; child components consume it via
// useContext. This gives consumers a flexible, expressive API.
//
// You will build:
//   1. <Tabs> + <Tab> + <TabPanel> — a tabbed UI
//   2. <Accordion> + <AccordionItem> + <AccordionHeader> + <AccordionPanel>
//   3. <Select> + <SelectOption> — a custom dropdown
//
// Instructions:
// 1. Create the Tabs compound component set.
// 2. Create the Accordion compound component set.
// 3. Create the Select compound component set.
// 4. Use all three in the App component.
// ============================================================

// ==================== 1. TABS ====================

// TODO 1: Create TabsContext
// The context value should be:
//   { activeTab: string; setActiveTab: (id: string) => void }
//
// const TabsContext = createContext<...>(null);

// TODO 2: Create Tabs component
// - Manages activeTab state (default to first tab id or empty string)
// - Wraps children in TabsContext.Provider
//
// function Tabs({ children, defaultTab }: { children: React.ReactNode; defaultTab: string }) { ... }

// TODO 3: Create Tab component
// - Props: { id: string; label: string }
// - Reads context (activeTab, setActiveTab)
// - Renders a <button> that calls setActiveTab(id) on click
// - Apply bold font weight or underline when id === activeTab
//
// function Tab({ id, label }: { id: string; label: string }) { ... }

// TODO 4: Create TabPanel component
// - Props: { id: string; children: React.ReactNode }
// - Reads context (activeTab)
// - Only renders children when id === activeTab
//
// function TabPanel({ id, children }: { id: string; children: React.ReactNode }) { ... }

// ==================== 2. ACCORDION ====================

// TODO 5: Create AccordionContext
// The context value should be:
//   { openId: string | null; toggle: (id: string) => void }
//
// const AccordionContext = createContext<...>(null);

// TODO 6: Create Accordion component
// - Manages openId state (null = all closed)
// - toggle: if openId === id, set to null; else set to id
//
// function Accordion({ children }: { children: React.ReactNode }) { ... }

// TODO 7: Create AccordionItemContext
// Each item needs to know its own id:
//   { id: string }
//
// const AccordionItemContext = createContext<{ id: string } | null>(null);

// TODO 8: Create AccordionItem component
// - Props: { id: string; children: React.ReactNode }
// - Provides AccordionItemContext with the id
//
// function AccordionItem({ id, children }: { id: string; children: React.ReactNode }) { ... }

// TODO 9: Create AccordionHeader component
// - Reads AccordionItemContext for the id
// - Reads AccordionContext for openId and toggle
// - Renders a <button> that calls toggle(id) on click
// - Shows ▼ when open, ▶ when closed (based on openId === id)
//
// function AccordionHeader({ children }: { children: React.ReactNode }) { ... }

// TODO 10: Create AccordionPanel component
// - Reads AccordionItemContext for the id
// - Reads AccordionContext for openId
// - Only renders children when openId === id
//
// function AccordionPanel({ children }: { children: React.ReactNode }) { ... }

// ==================== 3. CUSTOM SELECT ====================

// TODO 11: Create SelectContext
// The context value should be:
//   { value: string; onChange: (val: string) => void; isOpen: boolean; setIsOpen: (b: boolean) => void }
//
// const SelectContext = createContext<...>(null);

// TODO 12: Create Select component
// - Props: { value: string; onChange: (val: string) => void; children: React.ReactNode; placeholder?: string }
// - Manages isOpen state
// - Renders a trigger button showing current value or placeholder
// - Renders children (the options) when isOpen is true
// - Close when clicking outside (useEffect + mousedown listener on document)
//
// function Select({ value, onChange, children, placeholder = "Select..." }: SelectProps) { ... }

// TODO 13: Create SelectOption component
// - Props: { value: string; children: React.ReactNode }
// - Reads context (value, onChange, setIsOpen)
// - Renders a <li> that:
//   - Calls onChange(own_value) and setIsOpen(false) on click
//   - Highlights if context.value === own_value
//
// function SelectOption({ value, children }: { value: string; children: React.ReactNode }) { ... }

export function App() {
  const [selectedFruit, setSelectedFruit] = useState("");

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Exercise: Compound Components</h1>
      <p style={{ color: "gray" }}>Complete the TODOs to see compound components in action.</p>

      {/* TODO 14: Use the Tabs compound component
          <section style={{ marginBottom: 32 }}>
            <h2>Tabs</h2>
            <Tabs defaultTab="react">
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <Tab id="react" label="React" />
                <Tab id="typescript" label="TypeScript" />
                <Tab id="nodejs" label="Node.js" />
              </div>
              <TabPanel id="react"><p>React is a UI library by Meta.</p></TabPanel>
              <TabPanel id="typescript"><p>TypeScript adds static types to JavaScript.</p></TabPanel>
              <TabPanel id="nodejs"><p>Node.js runs JavaScript on the server.</p></TabPanel>
            </Tabs>
          </section>
      */}

      {/* TODO 15: Use the Accordion compound component
          <section style={{ marginBottom: 32 }}>
            <h2>Accordion</h2>
            <Accordion>
              <AccordionItem id="q1">
                <AccordionHeader>What is React?</AccordionHeader>
                <AccordionPanel>React is a JavaScript library for building UIs.</AccordionPanel>
              </AccordionItem>
              <AccordionItem id="q2">
                <AccordionHeader>What is a compound component?</AccordionHeader>
                <AccordionPanel>Components that share implicit state via Context.</AccordionPanel>
              </AccordionItem>
              <AccordionItem id="q3">
                <AccordionHeader>Why use compound components?</AccordionHeader>
                <AccordionPanel>They allow flexible composition without prop drilling.</AccordionPanel>
              </AccordionItem>
            </Accordion>
          </section>
      */}

      {/* TODO 16: Use the Select compound component
          <section style={{ marginBottom: 32 }}>
            <h2>Custom Select</h2>
            <p>Selected: {selectedFruit || "(none)"}</p>
            <Select value={selectedFruit} onChange={setSelectedFruit} placeholder="Choose a fruit...">
              <SelectOption value="apple">Apple</SelectOption>
              <SelectOption value="banana">Banana</SelectOption>
              <SelectOption value="cherry">Cherry</SelectOption>
              <SelectOption value="mango">Mango</SelectOption>
            </Select>
          </section>
      */}
    </div>
  );
}
