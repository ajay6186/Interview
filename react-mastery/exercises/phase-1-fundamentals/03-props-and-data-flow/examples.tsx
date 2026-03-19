import React, { useState } from "react";

// ============================================================
// Examples 1.3 — Props & Data Flow (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ============================================================
// BASIC — parent→child data, callbacks, lifting state (1–13)
// ============================================================

// 1. Passing a string down
function Ex01_Child({ message }: { message: string }) {
  return <p>{message}</p>;
}
function Ex01_Parent() {
  return <Ex01_Child message="Hello from parent!" />;
}

// 2. Passing a number down
function Ex02_PriceDisplay({ price }: { price: number }) {
  return <strong>${price.toFixed(2)}</strong>;
}
function Ex02_Shop() {
  return <p>Item cost: <Ex02_PriceDisplay price={9.99} /></p>;
}

// 3. Passing a boolean down — controls UI
function Ex03_Badge({ online }: { online: boolean }) {
  return <span style={{ color: online ? "green" : "gray" }}>{online ? "● Online" : "○ Offline"}</span>;
}
function Ex03_UserRow() {
  return <div>Alice <Ex03_Badge online={true} /></div>;
}

// 4. Passing an object down
type Point = { x: number; y: number };
function Ex04_Coords({ point }: { point: Point }) {
  return <code>({point.x}, {point.y})</code>;
}
function Ex04_Map() {
  return <p>Click at: <Ex04_Coords point={{ x: 42, y: 17 }} /></p>;
}

// 5. Passing an array down
function Ex05_TagList({ tags }: { tags: string[] }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {tags.map((t) => <span key={t} style={{ background: "#eee", padding: "2px 8px", borderRadius: 12 }}>{t}</span>)}
    </div>
  );
}
function Ex05_Post() {
  return <Ex05_TagList tags={["React", "TypeScript", "Hooks"]} />;
}

// 6. Callback prop — child calls parent on click
function Ex06_DeleteButton({ id, onDelete }: { id: number; onDelete: (id: number) => void }) {
  return <button onClick={() => onDelete(id)} style={{ color: "red" }}>Delete #{id}</button>;
}
function Ex06_Parent() {
  const handleDelete = (id: number) => alert(`Deleting ${id}`);
  return <Ex06_DeleteButton id={5} onDelete={handleDelete} />;
}

// 7. Toggle state via callback — lifted to parent
function Ex07_ToggleButton({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return <button onClick={onToggle}>{on ? "ON" : "OFF"}</button>;
}
function Ex07_Parent() {
  const [on, setOn] = useState(false);
  return (
    <div>
      <Ex07_ToggleButton on={on} onToggle={() => setOn((v) => !v)} />
      <span style={{ marginLeft: 8 }}>State: {String(on)}</span>
    </div>
  );
}

// 8. Counter controlled by parent
function Ex08_Counter({ count, onIncrement, onDecrement }: {
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <button onClick={onDecrement}>−</button>
      <span>{count}</span>
      <button onClick={onIncrement}>+</button>
    </div>
  );
}
function Ex08_App() {
  const [n, setN] = useState(0);
  return <Ex08_Counter count={n} onIncrement={() => setN((v) => v + 1)} onDecrement={() => setN((v) => v - 1)} />;
}

// 9. Controlled input — value + onChange
function Ex09_ControlledInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Type here" />;
}
function Ex09_App() {
  const [text, setText] = useState("");
  return (
    <div>
      <Ex09_ControlledInput value={text} onChange={setText} />
      <p>Echo: {text}</p>
    </div>
  );
}

// 10. Passing state down to two sibling displays
function Ex10_Display({ label, value }: { label: string; value: string }) {
  return <p><strong>{label}:</strong> {value}</p>;
}
function Ex10_App() {
  const [name, setName] = useState("Alice");
  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <Ex10_Display label="Upper" value={name.toUpperCase()} />
      <Ex10_Display label="Lower" value={name.toLowerCase()} />
    </div>
  );
}

// 11. Lifting state up — two children share one parent state
function Ex11_Input({ value, onInput }: { value: string; onInput: (v: string) => void }) {
  return <input value={value} onChange={(e) => onInput(e.target.value)} />;
}
function Ex11_Preview({ value }: { value: string }) {
  return <p style={{ fontStyle: "italic" }}>{value || "No input yet"}</p>;
}
function Ex11_App() {
  const [text, setText] = useState("");
  return (
    <div>
      <Ex11_Input value={text} onInput={setText} />
      <Ex11_Preview value={text} />
    </div>
  );
}

// 12. Sibling communication via shared parent
function Ex12_Sender({ onSend }: { onSend: (msg: string) => void }) {
  return <button onClick={() => onSend("ping!")}>Send</button>;
}
function Ex12_Receiver({ lastMsg }: { lastMsg: string }) {
  return <p>Received: {lastMsg}</p>;
}
function Ex12_App() {
  const [msg, setMsg] = useState("");
  return <div><Ex12_Sender onSend={setMsg} /><Ex12_Receiver lastMsg={msg} /></div>;
}

// 13. Prop drilling — 2 levels deep
function Ex13_Deep({ theme }: { theme: string }) {
  return <p style={{ color: theme === "dark" ? "#eee" : "#333" }}>I'm deep: {theme}</p>;
}
function Ex13_Middle({ theme }: { theme: string }) {
  return <div><Ex13_Deep theme={theme} /></div>;
}
function Ex13_App() {
  const [theme] = useState("dark");
  return <Ex13_Middle theme={theme} />;
}

// ============================================================
// INTERMEDIATE — render props, children patterns, callbacks (14–26)
// ============================================================

// 14. Prop drilling — 3 levels deep
function Ex14_Level3({ label }: { label: string }) { return <span>{label}</span>; }
function Ex14_Level2({ label }: { label: string }) { return <Ex14_Level3 label={label} />; }
function Ex14_Level1({ label }: { label: string }) { return <Ex14_Level2 label={label} />; }
function Ex14_App() { return <Ex14_Level1 label="Drilled" />; }

// 15. children prop as composition slot
function Ex15_Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid #ccc", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ background: "#f5f5f5", padding: "8px 12px", fontWeight: "bold" }}>{title}</div>
      <div style={{ padding: 12 }}>{children}</div>
    </div>
  );
}
function Ex15_App() {
  return (
    <Ex15_Panel title="Settings">
      <p>Theme: Dark</p>
      <p>Language: EN</p>
    </Ex15_Panel>
  );
}

// 16. Named slot pattern via multiple children props
function Ex16_Dialog({
  headerSlot,
  bodySlot,
  footerSlot,
}: {
  headerSlot: React.ReactNode;
  bodySlot: React.ReactNode;
  footerSlot?: React.ReactNode;
}) {
  return (
    <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16, maxWidth: 400 }}>
      <div style={{ borderBottom: "1px solid #eee", paddingBottom: 8, marginBottom: 8 }}>{headerSlot}</div>
      <div>{bodySlot}</div>
      {footerSlot && <div style={{ borderTop: "1px solid #eee", paddingTop: 8, marginTop: 8 }}>{footerSlot}</div>}
    </div>
  );
}

// 17. Render prop pattern
function Ex17_DataFetcher<T>({
  data,
  render,
}: {
  data: T[];
  render: (item: T, index: number) => React.ReactNode;
}) {
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {data.map((item, i) => <li key={i}>{render(item, i)}</li>)}
    </ul>
  );
}
function Ex17_App() {
  return (
    <Ex17_DataFetcher
      data={["React", "Vue", "Svelte"]}
      render={(fw, i) => <strong>{i + 1}. {fw}</strong>}
    />
  );
}

// 18. Callback with event object
function Ex18_Form({ onSubmit }: { onSubmit: (e: React.FormEvent) => void }) {
  return (
    <form onSubmit={onSubmit}>
      <input name="search" placeholder="Search…" />
      <button type="submit">Go</button>
    </form>
  );
}
function Ex18_App() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("submitted");
  };
  return <Ex18_Form onSubmit={handleSubmit} />;
}

// 19. Callback with multiple arguments
function Ex19_RatingPicker({
  label,
  onRate,
}: {
  label: string;
  onRate: (label: string, stars: number) => void;
}) {
  return (
    <div>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onRate(label, n)}>{"★".repeat(n)}</button>
      ))}
    </div>
  );
}
function Ex19_App() {
  const [result, setResult] = useState("");
  return (
    <div>
      <Ex19_RatingPicker label="Movie" onRate={(l, s) => setResult(`${l}: ${s}★`)} />
      <p>{result}</p>
    </div>
  );
}

// 20. Optional callback with guard
function Ex20_Card({
  title,
  onEdit,
}: {
  title: string;
  onEdit?: () => void;
}) {
  return (
    <div>
      <strong>{title}</strong>
      {onEdit && <button onClick={onEdit} style={{ marginLeft: 8 }}>Edit</button>}
    </div>
  );
}

// 21. Default noop callback
function Ex21_Button({
  label,
  onClick = () => {},
}: {
  label: string;
  onClick?: () => void;
}) {
  return <button onClick={onClick}>{label}</button>;
}

// 22. Callback carrying typed payload
type SelectionPayload = { id: number; label: string };
function Ex22_OptionList({
  options,
  onSelect,
}: {
  options: SelectionPayload[];
  onSelect: (item: SelectionPayload) => void;
}) {
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {options.map((opt) => (
        <li key={opt.id}>
          <button onClick={() => onSelect(opt)}>{opt.label}</button>
        </li>
      ))}
    </ul>
  );
}
function Ex22_App() {
  const [selected, setSelected] = useState<SelectionPayload | null>(null);
  return (
    <div>
      <Ex22_OptionList
        options={[{ id: 1, label: "Alpha" }, { id: 2, label: "Beta" }]}
        onSelect={setSelected}
      />
      <p>Selected: {selected?.label ?? "none"}</p>
    </div>
  );
}

// 23. Prevent default inside callback
function Ex23_LinkButton({ href, label, onClick }: { href: string; label: string; onClick: (e: React.MouseEvent) => void }) {
  return <a href={href} onClick={onClick}>{label}</a>;
}
function Ex23_App() {
  return (
    <Ex23_LinkButton
      href="/logout"
      label="Logout"
      onClick={(e) => { e.preventDefault(); alert("custom logout"); }}
    />
  );
}

// 24. Children as a function (render prop via children)
function Ex24_Toggler({
  children,
}: {
  children: (on: boolean, toggle: () => void) => React.ReactNode;
}) {
  const [on, setOn] = useState(false);
  return <>{children(on, () => setOn((v) => !v))}</>;
}
function Ex24_App() {
  return (
    <Ex24_Toggler>
      {(on, toggle) => (
        <div>
          <button onClick={toggle}>{on ? "Hide" : "Show"}</button>
          {on && <p>Revealed content!</p>}
        </div>
      )}
    </Ex24_Toggler>
  );
}

// 25. Passing setState directly as a prop
function Ex25_Input({ setValue }: { setValue: React.Dispatch<React.SetStateAction<string>> }) {
  return <input onChange={(e) => setValue(e.target.value)} placeholder="Direct dispatch" />;
}
function Ex25_App() {
  const [val, setValue] = useState("");
  return (
    <div>
      <Ex25_Input setValue={setValue} />
      <p>{val}</p>
    </div>
  );
}

// 26. Status bar receiving derived data
function Ex26_StatusBar({ total, done }: { total: number; done: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div style={{ background: "#f0f0f0", borderRadius: 4, height: 16, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: "#27ae60", transition: "width 0.3s" }} />
    </div>
  );
}

// ============================================================
// NESTED — deep drilling, compound callbacks, data-down actions-up (27–38)
// ============================================================

// 27. 4-level prop drilling
function Ex27_L4({ color }: { color: string }) { return <div style={{ background: color, width: 40, height: 40 }} />; }
function Ex27_L3({ color }: { color: string }) { return <Ex27_L4 color={color} />; }
function Ex27_L2({ color }: { color: string }) { return <Ex27_L3 color={color} />; }
function Ex27_L1({ color }: { color: string }) { return <Ex27_L2 color={color} />; }
function Ex27_App() {
  const [color, setColor] = useState("#3498db");
  return <div><input type="color" value={color} onChange={(e) => setColor(e.target.value)} /><Ex27_L1 color={color} /></div>;
}

// 28. Full data-down / actions-up todo pattern
type Todo = { id: number; text: string; done: boolean };
function Ex28_TodoItem({ todo, onToggle, onDelete }: {
  todo: Todo; onToggle: (id: number) => void; onDelete: (id: number) => void;
}) {
  return (
    <li style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input type="checkbox" checked={todo.done} onChange={() => onToggle(todo.id)} />
      <span style={{ textDecoration: todo.done ? "line-through" : "none", flex: 1 }}>{todo.text}</span>
      <button onClick={() => onDelete(todo.id)}>✕</button>
    </li>
  );
}
function Ex28_TodoList({ todos, onToggle, onDelete }: { todos: Todo[]; onToggle: (id: number) => void; onDelete: (id: number) => void }) {
  if (todos.length === 0) return <p style={{ color: "gray" }}>No todos.</p>;
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {todos.map((t) => <Ex28_TodoItem key={t.id} todo={t} onToggle={onToggle} onDelete={onDelete} />)}
    </ul>
  );
}
function Ex28_TodoInput({ onAdd }: { onAdd: (text: string) => void }) {
  const [text, setText] = useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) { onAdd(text.trim()); setText(""); } }} style={{ display: "flex", gap: 8 }}>
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="New todo…" style={{ flex: 1 }} />
      <button type="submit">Add</button>
    </form>
  );
}
function Ex28_App() {
  const [todos, setTodos] = useState<Todo[]>([{ id: 1, text: "Learn React", done: false }]);
  const add = (text: string) => setTodos((p) => [...p, { id: Date.now(), text, done: false }]);
  const toggle = (id: number) => setTodos((p) => p.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  const del = (id: number) => setTodos((p) => p.filter((t) => t.id !== id));
  const done = todos.filter((t) => t.done).length;
  return (
    <div style={{ maxWidth: 400 }}>
      <Ex28_TodoInput onAdd={add} />
      <Ex26_StatusBar total={todos.length} done={done} />
      <Ex28_TodoList todos={todos} onToggle={toggle} onDelete={del} />
    </div>
  );
}

// 29. Component injecting props into its children via cloneElement
function Ex29_RadioGroup({ name, children }: { name: string; children: React.ReactElement[] }) {
  return (
    <fieldset>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { name })
      )}
    </fieldset>
  );
}
function Ex29_RadioOption({ value, label, name }: { value: string; label: string; name?: string }) {
  return <label style={{ display: "block" }}><input type="radio" name={name} value={value} /> {label}</label>;
}

// 30. Render prop with state
function Ex30_HoverTracker({ render }: { render: (hovered: boolean) => React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {render(hovered)}
    </div>
  );
}
function Ex30_App() {
  return (
    <Ex30_HoverTracker
      render={(h) => (
        <div style={{ background: h ? "#dff0d8" : "#f8f8f8", padding: 12, transition: "background 0.2s" }}>
          {h ? "Hovering!" : "Hover me"}
        </div>
      )}
    />
  );
}

// 31. Multi-step form — each step reports up via onNext
function Ex31_Step1({ onNext }: { onNext: (name: string) => void }) {
  const [name, setName] = useState("");
  return (
    <div>
      <label>Name: <input value={name} onChange={(e) => setName(e.target.value)} /></label>
      <button onClick={() => onNext(name)} disabled={!name}>Next →</button>
    </div>
  );
}
function Ex31_Step2({ name, onNext }: { name: string; onNext: (age: number) => void }) {
  const [age, setAge] = useState(18);
  return (
    <div>
      <p>Hi {name}!</p>
      <label>Age: <input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} /></label>
      <button onClick={() => onNext(age)}>Submit</button>
    </div>
  );
}
function Ex31_App() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  if (step === 1) return <Ex31_Step1 onNext={(n) => { setName(n); setStep(2); }} />;
  if (step === 2) return <Ex31_Step2 name={name} onNext={(a) => { setSummary(`${name}, age ${a}`); setStep(3); }} />;
  return <p>Done: {summary}</p>;
}

// 32. Accordion — each item reports open/close to parent
function Ex32_AccordionItem({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{ border: "1px solid #ccc", borderRadius: 4, marginBottom: 4 }}>
      <button onClick={onToggle} style={{ width: "100%", textAlign: "left", padding: "8px 12px", background: "none", border: "none", cursor: "pointer", fontWeight: "bold" }}>
        {open ? "▼" : "▶"} {title}
      </button>
      {open && <div style={{ padding: "8px 12px" }}>{children}</div>}
    </div>
  );
}
function Ex32_App() {
  const [openId, setOpenId] = useState<number | null>(null);
  const items = [{ id: 1, title: "Section A", body: "Content A" }, { id: 2, title: "Section B", body: "Content B" }];
  return (
    <div>
      {items.map((item) => (
        <Ex32_AccordionItem key={item.id} title={item.title} open={openId === item.id} onToggle={() => setOpenId(openId === item.id ? null : item.id)}>
          <p>{item.body}</p>
        </Ex32_AccordionItem>
      ))}
    </div>
  );
}

// 33. Tab panel — active tab controlled by parent
function Ex33_Tabs({ tabs, active, onSelect }: { tabs: string[]; active: string; onSelect: (t: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 4, borderBottom: "2px solid #eee" }}>
      {tabs.map((t) => (
        <button key={t} onClick={() => onSelect(t)} style={{ padding: "6px 12px", border: "none", background: "none", fontWeight: active === t ? "bold" : "normal", borderBottom: active === t ? "2px solid #3498db" : "2px solid transparent", cursor: "pointer" }}>
          {t}
        </button>
      ))}
    </div>
  );
}
function Ex33_App() {
  const tabs = ["Overview", "Details", "Reviews"];
  const [active, setActive] = useState("Overview");
  return (
    <div>
      <Ex33_Tabs tabs={tabs} active={active} onSelect={setActive} />
      <div style={{ padding: 16 }}><p>{active} content</p></div>
    </div>
  );
}

// 34. Theme toggle flowing down
type Theme = "light" | "dark";
function Ex34_ThemeButton({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  return <button onClick={onToggle}>Switch to {theme === "light" ? "Dark" : "Light"}</button>;
}
function Ex34_ThemedCard({ theme, children }: { theme: Theme; children: React.ReactNode }) {
  return (
    <div style={{ background: theme === "dark" ? "#222" : "#fff", color: theme === "dark" ? "#eee" : "#222", padding: 16, borderRadius: 8 }}>
      {children}
    </div>
  );
}
function Ex34_App() {
  const [theme, setTheme] = useState<Theme>("light");
  return (
    <Ex34_ThemedCard theme={theme}>
      <p>Current theme: {theme}</p>
      <Ex34_ThemeButton theme={theme} onToggle={() => setTheme((t) => t === "light" ? "dark" : "light")} />
    </Ex34_ThemedCard>
  );
}

// 35. Quantity selector — localises increment/decrement, reports final value up
function Ex35_Qty({ max, onChange }: { max: number; onChange: (n: number) => void }) {
  const [qty, setQty] = useState(1);
  const update = (n: number) => { setQty(n); onChange(n); };
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <button onClick={() => update(Math.max(1, qty - 1))}>−</button>
      <span>{qty}</span>
      <button onClick={() => update(Math.min(max, qty + 1))}>+</button>
    </div>
  );
}
function Ex35_App() {
  const [qty, setQty] = useState(1);
  return <div><Ex35_Qty max={10} onChange={setQty} /><p>In cart: {qty}</p></div>;
}

// 36. Search field reporting query upward with debounce hint
function Ex36_SearchInput({ onSearch }: { onSearch: (q: string) => void }) {
  return (
    <input
      type="search"
      placeholder="Search…"
      onChange={(e) => onSearch(e.target.value)}
      style={{ padding: 8, borderRadius: 4, border: "1px solid #ccc", width: "100%" }}
    />
  );
}
function Ex36_App() {
  const [q, setQ] = useState("");
  const results = ["Apple", "Banana", "Cherry"].filter((f) => f.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <Ex36_SearchInput onSearch={setQ} />
      <ul>{results.map((r) => <li key={r}>{r}</li>)}</ul>
    </div>
  );
}

// 37. Pagination — current page controlled by parent
function Ex37_Pager({ page, total, onPage }: { page: number; total: number; onPage: (p: number) => void }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {Array.from({ length: total }, (_, i) => i + 1).map((p) => (
        <button key={p} onClick={() => onPage(p)} style={{ fontWeight: p === page ? "bold" : "normal", background: p === page ? "#3498db" : "#fff", color: p === page ? "#fff" : "#333", border: "1px solid #ccc", borderRadius: 4, padding: "4px 8px", cursor: "pointer" }}>
          {p}
        </button>
      ))}
    </div>
  );
}
function Ex37_App() {
  const [page, setPage] = useState(1);
  return <div><Ex37_Pager page={page} total={5} onPage={setPage} /><p>Page {page}</p></div>;
}

// 38. Nested callbacks — item action bubbles up through list to app
function Ex38_Item({ item, onAction }: { item: { id: number; label: string }; onAction: (id: number, action: "star" | "archive") => void }) {
  return (
    <li style={{ display: "flex", gap: 8, padding: "4px 0" }}>
      <span style={{ flex: 1 }}>{item.label}</span>
      <button onClick={() => onAction(item.id, "star")}>★</button>
      <button onClick={() => onAction(item.id, "archive")}>📁</button>
    </li>
  );
}
function Ex38_List({ items, onAction }: { items: { id: number; label: string }[]; onAction: (id: number, action: "star" | "archive") => void }) {
  return <ul style={{ listStyle: "none", padding: 0 }}>{items.map((i) => <Ex38_Item key={i.id} item={i} onAction={onAction} />)}</ul>;
}
function Ex38_App() {
  const [log, setLog] = useState<string[]>([]);
  const items = [{ id: 1, label: "Email from Alice" }, { id: 2, label: "Meeting invite" }];
  return (
    <div>
      <Ex38_List items={items} onAction={(id, action) => setLog((p) => [`${action} #${id}`, ...p])} />
      <ul>{log.map((l, i) => <li key={i}>{l}</li>)}</ul>
    </div>
  );
}

// ============================================================
// ADVANCED — generic data props, typed render props, inversion of control (39–50)
// ============================================================

// 39. Generic data prop with typed render prop
function Ex39_GenericList<T>({
  items,
  keyFn,
  renderItem,
  emptyState,
}: {
  items: T[];
  keyFn: (item: T) => string | number;
  renderItem: (item: T) => React.ReactNode;
  emptyState?: React.ReactNode;
}) {
  if (items.length === 0) return <>{emptyState ?? <p>No items.</p>}</>;
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {items.map((item) => <li key={keyFn(item)}>{renderItem(item)}</li>)}
    </ul>
  );
}
function Ex39_App() {
  return (
    <Ex39_GenericList
      items={[{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }]}
      keyFn={(u) => u.id}
      renderItem={(u) => <span>👤 {u.name}</span>}
      emptyState={<p>No users.</p>}
    />
  );
}

// 40. Inversion of control — consumer controls render entirely
function Ex40_Headless<T>({
  items,
  children,
}: {
  items: T[];
  children: (item: T, index: number, all: T[]) => React.ReactNode;
}) {
  return <>{items.map((item, i, all) => children(item, i, all))}</>;
}
function Ex40_App() {
  const data = [{ id: 1, score: 95 }, { id: 2, score: 70 }];
  return (
    <div>
      <Ex40_Headless items={data}>
        {(item) => (
          <div key={item.id} style={{ color: item.score >= 80 ? "green" : "orange" }}>
            #{item.id}: {item.score}
          </div>
        )}
      </Ex40_Headless>
    </div>
  );
}

// 41. Controlled vs uncontrolled pattern — accepts both
function Ex41_FlexInput({
  value,
  defaultValue,
  onChange,
}: {
  value?: string;
  defaultValue?: string;
  onChange?: (v: string) => void;
}) {
  const [internal, setInternal] = useState(defaultValue ?? "");
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;
  const handleChange = (v: string) => {
    if (!isControlled) setInternal(v);
    onChange?.(v);
  };
  return <input value={current} onChange={(e) => handleChange(e.target.value)} />;
}

// 42. Component accepting a "slots" object
type CardSlots = {
  header?: React.ReactNode;
  default: React.ReactNode;
  footer?: React.ReactNode;
};
function Ex42_SlottedCard({ slots }: { slots: CardSlots }) {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8 }}>
      {slots.header && <div style={{ padding: "8px 12px", background: "#f5f5f5" }}>{slots.header}</div>}
      <div style={{ padding: 12 }}>{slots.default}</div>
      {slots.footer && <div style={{ padding: "8px 12px", borderTop: "1px solid #eee" }}>{slots.footer}</div>}
    </div>
  );
}

// 43. Component that forwards all props to its child via cloneElement
function Ex43_Tooltip({ tip, children }: { tip: string; children: React.ReactElement }) {
  return React.cloneElement(children, { title: tip } as object);
}

// 44. Compound callback — aggregates child events into one
type FieldValues = { username: string; password: string };
function Ex44_LoginForm({ onSubmit }: { onSubmit: (values: FieldValues) => void }) {
  const [values, setValues] = useState<FieldValues>({ username: "", password: "" });
  const set = (key: keyof FieldValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((p) => ({ ...p, [key]: e.target.value }));
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(values); }}>
      <input placeholder="Username" value={values.username} onChange={set("username")} />
      <input type="password" placeholder="Password" value={values.password} onChange={set("password")} />
      <button type="submit">Login</button>
    </form>
  );
}
function Ex44_App() {
  const [user, setUser] = useState<FieldValues | null>(null);
  return (
    <div>
      <Ex44_LoginForm onSubmit={setUser} />
      {user && <p>Logged in as: {user.username}</p>}
    </div>
  );
}

// 45. onX naming — explicit typed handler map prop
type ButtonEventMap = {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  onMouseEnter?: React.MouseEventHandler<HTMLButtonElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLButtonElement>;
};
function Ex45_TrackableButton({ label, events }: { label: string; events?: ButtonEventMap }) {
  return <button {...events}>{label}</button>;
}

// 46. Prop type that mirrors a hook's return
type UseCounterReturn = { count: number; increment: () => void; reset: () => void };
function Ex46_CounterView({ counter }: { counter: UseCounterReturn }) {
  return (
    <div>
      <span>{counter.count}</span>
      <button onClick={counter.increment}>+</button>
      <button onClick={counter.reset}>Reset</button>
    </div>
  );
}
function useCounter(initial = 0): UseCounterReturn {
  const [count, setCount] = useState(initial);
  return { count, increment: () => setCount((n) => n + 1), reset: () => setCount(initial) };
}
function Ex46_App() {
  const counter = useCounter(10);
  return <Ex46_CounterView counter={counter} />;
}

// 47. Callback that returns a value (sync computation)
function Ex47_ExpressionField({
  evaluate,
}: {
  evaluate: (expr: string) => string;
}) {
  const [expr, setExpr] = useState("");
  return (
    <div>
      <input value={expr} onChange={(e) => setExpr(e.target.value)} placeholder="e.g. 2+2" />
      <p>= {expr ? evaluate(expr) : "?"}</p>
    </div>
  );
}
function Ex47_App() {
  return (
    <Ex47_ExpressionField
      evaluate={(expr) => {
        try { return String(Function(`"use strict"; return (${expr})`)()) }
        catch { return "Error" }
      }}
    />
  );
}

// 48. immer-style updater callback (receives draft)
function Ex48_Editor<T extends object>({
  value,
  onChange,
  fields,
}: {
  value: T;
  onChange: (updater: (prev: T) => T) => void;
  fields: (keyof T)[];
}) {
  return (
    <div>
      {fields.map((f) => (
        <div key={String(f)}>
          <label>{String(f)}: </label>
          <input
            value={String(value[f])}
            onChange={(e) => onChange((prev) => ({ ...prev, [f]: e.target.value }))}
          />
        </div>
      ))}
    </div>
  );
}
function Ex48_App() {
  const [form, setForm] = useState({ name: "Alice", email: "alice@ex.com" });
  return (
    <div>
      <Ex48_Editor value={form} onChange={(up) => setForm(up)} fields={["name", "email"]} />
      <code>{JSON.stringify(form)}</code>
    </div>
  );
}

// 49. Event delegation — single handler for all list items
function Ex49_ActionableList({ items }: { items: { id: string; label: string }[] }) {
  const handleClick = (e: React.MouseEvent<HTMLUListElement>) => {
    const target = e.target as HTMLElement;
    const id = target.closest("[data-id]")?.getAttribute("data-id");
    const action = target.dataset.action;
    if (id && action) alert(`${action} → ${id}`);
  };
  return (
    <ul onClick={handleClick} style={{ listStyle: "none", padding: 0 }}>
      {items.map((item) => (
        <li key={item.id} data-id={item.id} style={{ display: "flex", gap: 8, padding: "4px 0" }}>
          <span style={{ flex: 1 }}>{item.label}</span>
          <button data-action="edit">Edit</button>
          <button data-action="delete">Delete</button>
        </li>
      ))}
    </ul>
  );
}

// 50. Full showcase
export function App() {
  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 700, margin: "0 auto", padding: 20 }}>
      <h1>Examples 1.3 — Props &amp; Data Flow</h1>

      <h2>Basic</h2>
      <Ex01_Parent /><Ex02_Shop /><Ex03_UserRow />
      <Ex07_Parent /><Ex08_App /><Ex09_App /><Ex11_App /><Ex12_App />

      <h2>Intermediate</h2>
      <Ex15_App /><Ex17_App /><Ex18_App /><Ex19_App /><Ex22_App />
      <Ex24_App /><Ex25_App />

      <h2>Nested</h2>
      <Ex28_App /><Ex30_App /><Ex31_App /><Ex32_App />
      <Ex33_App /><Ex34_App /><Ex35_App /><Ex36_App />
      <Ex37_App /><Ex38_App />

      <h2>Advanced</h2>
      <Ex39_App /><Ex40_App />
      <Ex41_FlexInput defaultValue="uncontrolled" />
      <Ex42_SlottedCard slots={{ header: <strong>Title</strong>, default: <p>Body text</p>, footer: <small>Footer</small> }} />
      <Ex44_App /><Ex46_App /><Ex47_App /><Ex48_App />
      <Ex49_ActionableList items={[{ id: "a", label: "Alpha" }, { id: "b", label: "Beta" }]} />
    </div>
  );
}
