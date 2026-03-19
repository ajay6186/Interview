import { useState } from "react";

// ─────────────────────────────────────────
// BASIC (1–12)
// ─────────────────────────────────────────

function Ex01_Counter() {
  const [count, setCount] = useState(0);
  return <div><p>Count: {count}</p><button onClick={() => setCount(count + 1)}>+</button><button onClick={() => setCount(count - 1)}>–</button></div>;
}

function Ex02_TextInput() {
  const [text, setText] = useState("");
  return <div><input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type here" /><p>Value: {text}</p></div>;
}

function Ex03_ToggleBoolean() {
  const [on, setOn] = useState(false);
  return <div><p>Light: {on ? "ON 💡" : "OFF"}</p><button onClick={() => setOn(!on)}>Toggle</button></div>;
}

function Ex04_NumberInput() {
  const [num, setNum] = useState(0);
  return <div><input type="number" value={num} onChange={(e) => setNum(Number(e.target.value))} /><p>Double: {num * 2}</p></div>;
}

function Ex05_Checkbox() {
  const [checked, setChecked] = useState(false);
  return <label><input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} /> {checked ? "Checked ✓" : "Unchecked"}</label>;
}

function Ex06_ShowHide() {
  const [visible, setVisible] = useState(true);
  return <div><button onClick={() => setVisible(!visible)}>{visible ? "Hide" : "Show"}</button>{visible && <p>Hello! I am visible.</p>}</div>;
}

function Ex07_BackgroundColor() {
  const [color, setColor] = useState("#ffffff");
  return <div style={{ background: color, padding: 16 }}><input type="color" value={color} onChange={(e) => setColor(e.target.value)} /><p>Color: {color}</p></div>;
}

function Ex08_LikeButton() {
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const toggle = () => { setLiked(!liked); setLikes(liked ? likes - 1 : likes + 1); };
  return <button onClick={toggle} style={{ color: liked ? "red" : "gray" }}>❤️ {likes}</button>;
}

function Ex09_ScoreTracker() {
  const [score, setScore] = useState(0);
  return <div><p>Score: {score}</p><button onClick={() => setScore(score + 10)}>+10</button><button onClick={() => setScore(0)}>Reset</button></div>;
}

function Ex10_FontSize() {
  const [size, setSize] = useState(16);
  return <div><p style={{ fontSize: size }}>Sample Text</p><button onClick={() => setSize(size + 2)}>A+</button><button onClick={() => setSize(Math.max(10, size - 2))}>A-</button></div>;
}

function Ex11_PasswordToggle() {
  const [show, setShow] = useState(false);
  const [pw, setPw] = useState("");
  return <div><input type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} /><button onClick={() => setShow(!show)}>{show ? "Hide" : "Show"}</button></div>;
}

function Ex12_CharCounter() {
  const [text, setText] = useState("");
  const max = 100;
  return <div><textarea value={text} maxLength={max} onChange={(e) => setText(e.target.value)} style={{ display: "block" }} /><small>{text.length}/{max}</small></div>;
}

// ─────────────────────────────────────────
// INTERMEDIATE (13–25)
// ─────────────────────────────────────────

function Ex13_ObjectState() {
  const [user, setUser] = useState({ name: "", age: 0, city: "" });
  return (
    <div>
      <input placeholder="Name" value={user.name} onChange={(e) => setUser({ ...user, name: e.target.value })} />
      <input type="number" placeholder="Age" value={user.age} onChange={(e) => setUser({ ...user, age: +e.target.value })} />
      <input placeholder="City" value={user.city} onChange={(e) => setUser({ ...user, city: e.target.value })} />
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </div>
  );
}

function Ex14_ArrayAddItem() {
  const [items, setItems] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const add = () => { if (input.trim()) { setItems([...items, input]); setInput(""); } };
  return <div><input value={input} onChange={(e) => setInput(e.target.value)} /><button onClick={add}>Add</button><ul>{items.map((item, i) => <li key={i}>{item}</li>)}</ul></div>;
}

function Ex15_ArrayRemoveItem() {
  const [items, setItems] = useState(["React", "Vue", "Angular"]);
  return <ul>{items.map((item, i) => <li key={i}>{item} <button onClick={() => setItems(items.filter((_, j) => j !== i))}>✕</button></li>)}</ul>;
}

function Ex16_ArrayUpdateItem() {
  const [items, setItems] = useState(["First", "Second", "Third"]);
  return <ul>{items.map((item, i) => <li key={i}><input value={item} onChange={(e) => setItems(items.map((v, j) => j === i ? e.target.value : v))} /></li>)}</ul>;
}

function Ex17_MultipleStates() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [agree, setAgree] = useState(false);
  return (
    <div>
      <input placeholder="Name" onChange={(e) => setName(e.target.value)} />
      <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <label><input type="checkbox" onChange={(e) => setAgree(e.target.checked)} /> Agree</label>
      <p>Ready: {name && email && agree ? "✅" : "❌"}</p>
    </div>
  );
}

function Ex18_RadioGroup() {
  const [selected, setSelected] = useState("react");
  return (
    <div>
      {["react", "vue", "angular"].map((f) => (
        <label key={f} style={{ marginRight: 8 }}>
          <input type="radio" value={f} checked={selected === f} onChange={() => setSelected(f)} /> {f}
        </label>
      ))}
      <p>Selected: {selected}</p>
    </div>
  );
}

function Ex19_SelectDropdown() {
  const [val, setVal] = useState("beginner");
  return (
    <div>
      <select value={val} onChange={(e) => setVal(e.target.value)}>
        {["beginner", "intermediate", "advanced"].map((l) => <option key={l} value={l}>{l}</option>)}
      </select>
      <p>Level: {val}</p>
    </div>
  );
}

function Ex20_StarRating() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  return (
    <div>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ fontSize: 24, cursor: "pointer", color: s <= (hover || rating) ? "gold" : "#ccc" }}
          onClick={() => setRating(s)} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}>★</span>
      ))}
      <p>Rating: {rating}/5</p>
    </div>
  );
}

function Ex21_StepWizard() {
  const steps = ["Personal", "Address", "Payment", "Review"];
  const [step, setStep] = useState(0);
  return (
    <div>
      <p>Step {step + 1}: {steps[step]}</p>
      <div>{steps.map((s, i) => <span key={i} style={{ marginRight: 4, fontWeight: i === step ? "bold" : "normal" }}>{s}</span>)}</div>
      <button disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button>
      <button disabled={step === steps.length - 1} onClick={() => setStep(step + 1)}>Next</button>
    </div>
  );
}

function Ex22_TabUI() {
  const tabs = ["Profile", "Settings", "Notifications"];
  const [active, setActive] = useState("Profile");
  return (
    <div>
      <div style={{ display: "flex", gap: 4 }}>{tabs.map((t) => <button key={t} style={{ fontWeight: active === t ? "bold" : "normal" }} onClick={() => setActive(t)}>{t}</button>)}</div>
      <div style={{ padding: 12 }}>Content of: {active}</div>
    </div>
  );
}

function Ex23_Accordion() {
  const [open, setOpen] = useState<number | null>(null);
  const items = [{ q: "What is React?", a: "A UI library." }, { q: "What is JSX?", a: "JS + HTML." }];
  return (
    <div>
      {items.map((item, i) => (
        <div key={i}>
          <button onClick={() => setOpen(open === i ? null : i)}>{item.q}</button>
          {open === i && <p>{item.a}</p>}
        </div>
      ))}
    </div>
  );
}

function Ex24_SearchFilter() {
  const [query, setQuery] = useState("");
  const names = ["Alice", "Bob", "Charlie", "Dave", "Eve"];
  const filtered = names.filter((n) => n.toLowerCase().includes(query.toLowerCase()));
  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" />
      <ul>{filtered.map((n) => <li key={n}>{n}</li>)}</ul>
    </div>
  );
}

function Ex25_Pagination() {
  const all = Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`);
  const [page, setPage] = useState(0);
  const perPage = 5;
  const visible = all.slice(page * perPage, page * perPage + perPage);
  return (
    <div>
      <ul>{visible.map((item) => <li key={item}>{item}</li>)}</ul>
      <button disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</button>
      <span> Page {page + 1} </span>
      <button disabled={(page + 1) * perPage >= all.length} onClick={() => setPage(page + 1)}>Next</button>
    </div>
  );
}

// ─────────────────────────────────────────
// NESTED (26–37)
// ─────────────────────────────────────────

function Ex26_NestedObject() {
  const [user, setUser] = useState({ name: "Ali", address: { city: "Cairo", zip: "12345" } });
  return (
    <div>
      <input value={user.name} onChange={(e) => setUser({ ...user, name: e.target.value })} placeholder="Name" />
      <input value={user.address.city} onChange={(e) => setUser({ ...user, address: { ...user.address, city: e.target.value } })} placeholder="City" />
      <input value={user.address.zip} onChange={(e) => setUser({ ...user, address: { ...user.address, zip: e.target.value } })} placeholder="ZIP" />
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </div>
  );
}

function Ex27_ArrayOfObjects() {
  const [todos, setTodos] = useState([{ id: 1, text: "Learn React", done: false }, { id: 2, text: "Build app", done: false }]);
  const toggle = (id: number) => setTodos(todos.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  return (
    <ul>
      {todos.map((t) => (
        <li key={t.id} style={{ textDecoration: t.done ? "line-through" : "none" }}>
          {t.text} <button onClick={() => toggle(t.id)}>✓</button>
        </li>
      ))}
    </ul>
  );
}

function Ex28_NestedArrayUpdate() {
  const [board, setBoard] = useState([["X", "O", "X"], ["O", "X", "O"], ["X", "O", "X"]]);
  const toggle = (r: number, c: number) => {
    setBoard(board.map((row, ri) => ri === r ? row.map((cell, ci) => ci === c ? (cell === "X" ? "O" : "X") : cell) : row));
  };
  return (
    <table>
      <tbody>
        {board.map((row, r) => (
          <tr key={r}>{row.map((cell, c) => <td key={c} style={{ padding: 8, cursor: "pointer", border: "1px solid #ccc" }} onClick={() => toggle(r, c)}>{cell}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}

function Ex29_ShoppingCart() {
  const [cart, setCart] = useState<{ name: string; qty: number; price: number }[]>([]);
  const products = [{ name: "Shoes", price: 50 }, { name: "Hat", price: 20 }, { name: "Bag", price: 35 }];
  const addToCart = (p: { name: string; price: number }) => {
    const exists = cart.find((i) => i.name === p.name);
    if (exists) setCart(cart.map((i) => i.name === p.name ? { ...i, qty: i.qty + 1 } : i));
    else setCart([...cart, { ...p, qty: 1 }]);
  };
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  return (
    <div>
      {products.map((p) => <button key={p.name} onClick={() => addToCart(p)}>{p.name} ${p.price}</button>)}
      <hr />
      {cart.map((i) => <p key={i.name}>{i.name} × {i.qty} = ${i.price * i.qty}</p>)}
      <b>Total: ${total}</b>
    </div>
  );
}

function Ex30_NestedFormState() {
  const [form, setForm] = useState({ personal: { name: "", email: "" }, preferences: { theme: "light", lang: "EN" } });
  const set = (section: "personal" | "preferences", field: string, value: string) =>
    setForm({ ...form, [section]: { ...form[section], [field]: value } });
  return (
    <div>
      <h4>Personal</h4>
      <input placeholder="Name" value={form.personal.name} onChange={(e) => set("personal", "name", e.target.value)} />
      <input placeholder="Email" value={form.personal.email} onChange={(e) => set("personal", "email", e.target.value)} />
      <h4>Preferences</h4>
      <select value={form.preferences.theme} onChange={(e) => set("preferences", "theme", e.target.value)}>
        <option value="light">Light</option><option value="dark">Dark</option>
      </select>
      <pre>{JSON.stringify(form, null, 2)}</pre>
    </div>
  );
}

function Ex31_TreeNodeToggle() {
  type Node = { id: number; label: string; expanded: boolean; children: Node[] };
  const [tree, setTree] = useState<Node[]>([
    { id: 1, label: "Folder A", expanded: false, children: [{ id: 3, label: "File 1", expanded: false, children: [] }, { id: 4, label: "File 2", expanded: false, children: [] }] },
    { id: 2, label: "Folder B", expanded: false, children: [{ id: 5, label: "File 3", expanded: false, children: [] }] },
  ]);
  const toggle = (nodes: Node[], id: number): Node[] =>
    nodes.map((n) => n.id === id ? { ...n, expanded: !n.expanded } : { ...n, children: toggle(n.children, id) });
  const render = (nodes: Node[], depth = 0): JSX.Element => (
    <ul style={{ paddingLeft: depth * 16 }}>
      {nodes.map((n) => (
        <li key={n.id}>
          {n.children.length > 0 && <button onClick={() => setTree(toggle(tree, n.id))}>{n.expanded ? "▼" : "▶"}</button>}
          {n.label}
          {n.expanded && render(n.children, depth + 1)}
        </li>
      ))}
    </ul>
  );
  return render(tree);
}

function Ex32_CommentsWithReplies() {
  const [comments, setComments] = useState([
    { id: 1, text: "Great post!", replies: ["Thanks!", "Agreed!"] },
    { id: 2, text: "Very helpful.", replies: [] },
  ]);
  const [inputs, setInputs] = useState<Record<number, string>>({});
  const addReply = (id: number) => {
    setComments(comments.map((c) => c.id === id ? { ...c, replies: [...c.replies, inputs[id] || ""] } : c));
    setInputs({ ...inputs, [id]: "" });
  };
  return (
    <div>
      {comments.map((c) => (
        <div key={c.id} style={{ marginBottom: 12 }}>
          <p><b>{c.text}</b></p>
          <ul>{c.replies.map((r, i) => <li key={i}>↳ {r}</li>)}</ul>
          <input value={inputs[c.id] || ""} onChange={(e) => setInputs({ ...inputs, [c.id]: e.target.value })} placeholder="Reply..." />
          <button onClick={() => addReply(c.id)}>Reply</button>
        </div>
      ))}
    </div>
  );
}

function Ex33_GridState() {
  const [grid, setGrid] = useState(() => Array.from({ length: 5 }, () => Array(5).fill(false)));
  const toggle = (r: number, c: number) =>
    setGrid(grid.map((row, ri) => ri === r ? row.map((cell: boolean, ci: number) => ci === c ? !cell : cell) : row));
  return (
    <table>
      <tbody>
        {grid.map((row: boolean[], r: number) => (
          <tr key={r}>
            {row.map((cell: boolean, c: number) => (
              <td key={c} onClick={() => toggle(r, c)}
                style={{ width: 30, height: 30, background: cell ? "#333" : "#eee", cursor: "pointer", border: "1px solid #ccc" }} />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Ex34_TodoWithSubtasks() {
  const [todos, setTodos] = useState([
    { id: 1, title: "Project setup", subtasks: [{ id: 1, text: "Init repo", done: false }, { id: 2, text: "Install deps", done: false }] },
    { id: 2, title: "Build feature", subtasks: [{ id: 3, text: "Write code", done: false }] },
  ]);
  const toggleSub = (todoId: number, subId: number) =>
    setTodos(todos.map((t) => t.id === todoId ? { ...t, subtasks: t.subtasks.map((s) => s.id === subId ? { ...s, done: !s.done } : s) } : t));
  return (
    <div>
      {todos.map((t) => (
        <div key={t.id}>
          <b>{t.title}</b>
          <ul>{t.subtasks.map((s) => <li key={s.id} style={{ textDecoration: s.done ? "line-through" : "none" }}><input type="checkbox" checked={s.done} onChange={() => toggleSub(t.id, s.id)} />{s.text}</li>)}</ul>
        </div>
      ))}
    </div>
  );
}

function Ex35_DragSortList() {
  const [items, setItems] = useState(["Alpha", "Beta", "Gamma", "Delta"]);
  const move = (from: number, to: number) => {
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setItems(next);
  };
  return (
    <ul>
      {items.map((item, i) => (
        <li key={item} style={{ marginBottom: 4 }}>
          {item}
          <button disabled={i === 0} onClick={() => move(i, i - 1)}>↑</button>
          <button disabled={i === items.length - 1} onClick={() => move(i, i + 1)}>↓</button>
        </li>
      ))}
    </ul>
  );
}

function Ex36_MultiSelectTags() {
  const all = ["React", "TypeScript", "CSS", "Node", "GraphQL"];
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (tag: string) =>
    setSelected(selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag]);
  return (
    <div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {all.map((tag) => (
          <span key={tag} onClick={() => toggle(tag)}
            style={{ padding: "4px 10px", borderRadius: 16, cursor: "pointer", background: selected.includes(tag) ? "#4f46e5" : "#e5e7eb", color: selected.includes(tag) ? "#fff" : "#000" }}>
            {tag}
          </span>
        ))}
      </div>
      <p>Selected: {selected.join(", ") || "none"}</p>
    </div>
  );
}

function Ex37_KanbanBoard() {
  type Card = { id: number; text: string };
  const [board, setBoard] = useState<Record<string, Card[]>>({
    todo: [{ id: 1, text: "Design UI" }, { id: 2, text: "Write tests" }],
    inProgress: [{ id: 3, text: "Build API" }],
    done: [{ id: 4, text: "Setup repo" }],
  });
  const move = (card: Card, from: string, to: string) => {
    setBoard({ ...board, [from]: board[from].filter((c) => c.id !== card.id), [to]: [...board[to], card] });
  };
  const cols = ["todo", "inProgress", "done"];
  return (
    <div style={{ display: "flex", gap: 12 }}>
      {cols.map((col) => (
        <div key={col} style={{ flex: 1, padding: 8, background: "#f3f4f6", borderRadius: 8 }}>
          <b>{col}</b>
          {board[col].map((card) => (
            <div key={card.id} style={{ background: "#fff", padding: 8, marginTop: 4, borderRadius: 4 }}>
              {card.text}
              <div style={{ display: "flex", gap: 2, marginTop: 4 }}>
                {cols.filter((c) => c !== col).map((c) => <button key={c} onClick={() => move(card, col, c)}>→{c}</button>)}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// ADVANCED (38–50)
// ─────────────────────────────────────────

function Ex38_LazyInit() {
  // Function only runs once on mount (not on every re-render)
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem("ex38");
    return saved ?? "default value";
  });
  return (
    <div>
      <input value={value} onChange={(e) => { setValue(e.target.value); localStorage.setItem("ex38", e.target.value); }} />
      <p>Persisted: {value}</p>
    </div>
  );
}

function Ex39_FunctionalUpdate() {
  const [count, setCount] = useState(0);
  // Safe for async/batched updates — always gets latest state
  const addThree = () => {
    setCount((c) => c + 1);
    setCount((c) => c + 1);
    setCount((c) => c + 1);
  };
  return <div><p>Count: {count}</p><button onClick={addThree}>+3 (functional)</button></div>;
}

function Ex40_StateMachine() {
  type Status = "idle" | "loading" | "success" | "error";
  const transitions: Record<Status, Status> = { idle: "loading", loading: "success", success: "idle", error: "idle" };
  const [status, setStatus] = useState<Status>("idle");
  const colors: Record<Status, string> = { idle: "#e5e7eb", loading: "#fef3c7", success: "#d1fae5", error: "#fee2e2" };
  return (
    <div>
      <div style={{ padding: 16, background: colors[status], borderRadius: 8 }}>Status: {status}</div>
      <button onClick={() => setStatus(transitions[status])}>Next state</button>
      <button onClick={() => setStatus("error")}>Error</button>
    </div>
  );
}

function Ex41_UndoHistory() {
  const [history, setHistory] = useState<string[]>([""]);
  const [index, setIndex] = useState(0);
  const current = history[index];
  const handleChange = (val: string) => {
    const newHistory = [...history.slice(0, index + 1), val];
    setHistory(newHistory);
    setIndex(newHistory.length - 1);
  };
  return (
    <div>
      <textarea value={current} onChange={(e) => handleChange(e.target.value)} />
      <button disabled={index === 0} onClick={() => setIndex(index - 1)}>Undo</button>
      <button disabled={index === history.length - 1} onClick={() => setIndex(index + 1)}>Redo</button>
      <p>History: {history.length} steps</p>
    </div>
  );
}

function Ex42_OptimisticUpdate() {
  const [items, setItems] = useState(["Existing item"]);
  const [input, setInput] = useState("");
  const add = () => {
    const newItem = input;
    setInput("");
    setItems((prev) => [...prev, `${newItem} (saving...)`]); // optimistic
    setTimeout(() => {
      setItems((prev) => prev.map((i) => i === `${newItem} (saving...)` ? newItem : i)); // confirm
    }, 1500);
  };
  return (
    <div>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={add}>Add</button>
      <ul>{items.map((item, i) => <li key={i}>{item}</li>)}</ul>
    </div>
  );
}

function Ex43_FormValidation() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.email.includes("@")) e.email = "Invalid email";
    if (form.password.length < 6) e.password = "Min 6 chars";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const handleSubmit = (ev: React.FormEvent) => { ev.preventDefault(); if (validate()) setSubmitted(true); };
  if (submitted) return <p>✅ Submitted!</p>;
  return (
    <form onSubmit={handleSubmit}>
      <div><input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />{errors.email && <span style={{ color: "red" }}>{errors.email}</span>}</div>
      <div><input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />{errors.password && <span style={{ color: "red" }}>{errors.password}</span>}</div>
      <button type="submit">Submit</button>
    </form>
  );
}

function Ex44_DebouncedState() {
  const [immediate, setImmediate] = useState("");
  const [debounced, setDebounced] = useState("");
  const handleChange = (val: string) => {
    setImmediate(val);
    clearTimeout((window as unknown as Record<string, unknown>)._debounceTimer as number);
    (window as unknown as Record<string, unknown>)._debounceTimer = setTimeout(() => setDebounced(val), 500) as unknown;
  };
  return (
    <div>
      <input onChange={(e) => handleChange(e.target.value)} placeholder="Type fast..." />
      <p>Immediate: {immediate}</p>
      <p>Debounced (500ms): {debounced}</p>
    </div>
  );
}

function Ex45_NormalizedState() {
  const [byId, setById] = useState<Record<number, { id: number; name: string; done: boolean }>>({
    1: { id: 1, name: "Task A", done: false },
    2: { id: 2, name: "Task B", done: false },
  });
  const [allIds] = useState([1, 2]);
  const toggle = (id: number) => setById({ ...byId, [id]: { ...byId[id], done: !byId[id].done } });
  return (
    <ul>
      {allIds.map((id) => (
        <li key={id} style={{ textDecoration: byId[id].done ? "line-through" : "none" }}>
          {byId[id].name} <button onClick={() => toggle(id)}>✓</button>
        </li>
      ))}
    </ul>
  );
}

function Ex46_InfiniteList() {
  const [items, setItems] = useState(Array.from({ length: 10 }, (_, i) => `Item ${i + 1}`));
  const loadMore = () => {
    const next = Array.from({ length: 10 }, (_, i) => `Item ${items.length + i + 1}`);
    setItems([...items, ...next]);
  };
  return (
    <div>
      <ul style={{ maxHeight: 150, overflow: "auto" }}>{items.map((item) => <li key={item}>{item}</li>)}</ul>
      <button onClick={loadMore}>Load more ({items.length} loaded)</button>
    </div>
  );
}

function Ex47_BatchedUpdates() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [c, setC] = useState(0);
  // React 18 batches all setState calls in event handlers automatically
  const update = () => { setA((v) => v + 1); setB((v) => v + 1); setC((v) => v + 1); };
  return <div><p>A:{a} B:{b} C:{c}</p><button onClick={update}>Batch update all</button></div>;
}

function Ex48_ConditionalState() {
  const [mode, setMode] = useState<"list" | "grid">("list");
  const [items] = useState(["A", "B", "C", "D", "E", "F"]);
  return (
    <div>
      <button onClick={() => setMode("list")}>List</button>
      <button onClick={() => setMode("grid")}>Grid</button>
      {mode === "list"
        ? <ul>{items.map((i) => <li key={i}>{i}</li>)}</ul>
        : <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>{items.map((i) => <div key={i} style={{ padding: 8, background: "#eee" }}>{i}</div>)}</div>}
    </div>
  );
}

function Ex49_SyncWithLocalStorage() {
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    (localStorage.getItem("ex49_theme") as "light" | "dark") ?? "light"
  );
  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("ex49_theme", next);
  };
  return (
    <div style={{ background: theme === "dark" ? "#222" : "#fff", color: theme === "dark" ? "#fff" : "#000", padding: 16 }}>
      Theme: {theme}
      <button onClick={toggle} style={{ marginLeft: 8 }}>Toggle</button>
    </div>
  );
}

function Ex50_ComplexDashboard() {
  const [users] = useState([{ id: 1, name: "Alice", role: "admin" }, { id: 2, name: "Bob", role: "user" }, { id: 3, name: "Charlie", role: "user" }]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const visible = users.filter((u) => (filter === "all" || u.role === filter) && u.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users" />
      <select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All</option><option value="admin">Admin</option><option value="user">User</option></select>
      <ul>{visible.map((u) => <li key={u.id} onClick={() => setSelected(u.id)} style={{ cursor: "pointer", fontWeight: selected === u.id ? "bold" : "normal" }}>{u.name} ({u.role})</li>)}</ul>
      {selected && <p>Selected: {users.find((u) => u.id === selected)?.name}</p>}
    </div>
  );
}

// ─────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────

const examples: { label: string; component: JSX.Element }[] = [
  // BASIC
  { label: "01 [Basic] Counter",                  component: <Ex01_Counter /> },
  { label: "02 [Basic] Text Input",               component: <Ex02_TextInput /> },
  { label: "03 [Basic] Toggle Boolean",           component: <Ex03_ToggleBoolean /> },
  { label: "04 [Basic] Number Input",             component: <Ex04_NumberInput /> },
  { label: "05 [Basic] Checkbox",                 component: <Ex05_Checkbox /> },
  { label: "06 [Basic] Show/Hide",                component: <Ex06_ShowHide /> },
  { label: "07 [Basic] Background Color",         component: <Ex07_BackgroundColor /> },
  { label: "08 [Basic] Like Button",              component: <Ex08_LikeButton /> },
  { label: "09 [Basic] Score Tracker",            component: <Ex09_ScoreTracker /> },
  { label: "10 [Basic] Font Size",                component: <Ex10_FontSize /> },
  { label: "11 [Basic] Password Toggle",          component: <Ex11_PasswordToggle /> },
  { label: "12 [Basic] Char Counter",             component: <Ex12_CharCounter /> },
  // INTERMEDIATE
  { label: "13 [Intermediate] Object State",      component: <Ex13_ObjectState /> },
  { label: "14 [Intermediate] Array Add",         component: <Ex14_ArrayAddItem /> },
  { label: "15 [Intermediate] Array Remove",      component: <Ex15_ArrayRemoveItem /> },
  { label: "16 [Intermediate] Array Update",      component: <Ex16_ArrayUpdateItem /> },
  { label: "17 [Intermediate] Multiple States",   component: <Ex17_MultipleStates /> },
  { label: "18 [Intermediate] Radio Group",       component: <Ex18_RadioGroup /> },
  { label: "19 [Intermediate] Select Dropdown",   component: <Ex19_SelectDropdown /> },
  { label: "20 [Intermediate] Star Rating",       component: <Ex20_StarRating /> },
  { label: "21 [Intermediate] Step Wizard",       component: <Ex21_StepWizard /> },
  { label: "22 [Intermediate] Tab UI",            component: <Ex22_TabUI /> },
  { label: "23 [Intermediate] Accordion",         component: <Ex23_Accordion /> },
  { label: "24 [Intermediate] Search Filter",     component: <Ex24_SearchFilter /> },
  { label: "25 [Intermediate] Pagination",        component: <Ex25_Pagination /> },
  // NESTED
  { label: "26 [Nested] Nested Object",           component: <Ex26_NestedObject /> },
  { label: "27 [Nested] Array of Objects",        component: <Ex27_ArrayOfObjects /> },
  { label: "28 [Nested] 2D Array (Board)",        component: <Ex28_NestedArrayUpdate /> },
  { label: "29 [Nested] Shopping Cart",           component: <Ex29_ShoppingCart /> },
  { label: "30 [Nested] Nested Form",             component: <Ex30_NestedFormState /> },
  { label: "31 [Nested] Tree Node Toggle",        component: <Ex31_TreeNodeToggle /> },
  { label: "32 [Nested] Comments + Replies",      component: <Ex32_CommentsWithReplies /> },
  { label: "33 [Nested] Grid State",              component: <Ex33_GridState /> },
  { label: "34 [Nested] Todo + Subtasks",         component: <Ex34_TodoWithSubtasks /> },
  { label: "35 [Nested] Drag Sort List",          component: <Ex35_DragSortList /> },
  { label: "36 [Nested] Multi-Select Tags",       component: <Ex36_MultiSelectTags /> },
  { label: "37 [Nested] Kanban Board",            component: <Ex37_KanbanBoard /> },
  // ADVANCED
  { label: "38 [Advanced] Lazy Init",             component: <Ex38_LazyInit /> },
  { label: "39 [Advanced] Functional Update",     component: <Ex39_FunctionalUpdate /> },
  { label: "40 [Advanced] State Machine",         component: <Ex40_StateMachine /> },
  { label: "41 [Advanced] Undo History",          component: <Ex41_UndoHistory /> },
  { label: "42 [Advanced] Optimistic Update",     component: <Ex42_OptimisticUpdate /> },
  { label: "43 [Advanced] Form Validation",       component: <Ex43_FormValidation /> },
  { label: "44 [Advanced] Debounced State",       component: <Ex44_DebouncedState /> },
  { label: "45 [Advanced] Normalized State",      component: <Ex45_NormalizedState /> },
  { label: "46 [Advanced] Infinite List",         component: <Ex46_InfiniteList /> },
  { label: "47 [Advanced] Batched Updates",       component: <Ex47_BatchedUpdates /> },
  { label: "48 [Advanced] Conditional State",     component: <Ex48_ConditionalState /> },
  { label: "49 [Advanced] Sync localStorage",     component: <Ex49_SyncWithLocalStorage /> },
  { label: "50 [Advanced] Complex Dashboard",     component: <Ex50_ComplexDashboard /> },
];

export default function UseStateExamples() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: 24 }}>
      <h1>50 useState Examples — Basic · Intermediate · Nested · Advanced</h1>
      {examples.map(({ label, component }) => (
        <section key={label} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <h2 style={{ marginTop: 0, fontSize: 14, color: "#555" }}>{label}</h2>
          {component}
        </section>
      ))}
    </div>
  );
}
