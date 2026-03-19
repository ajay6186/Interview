import { useState, useRef } from "react";

// ─────────────────────────────────────────
// BASIC (1–10)
// ─────────────────────────────────────────

function Ex01_StringList() {
  const fruits = ["Apple", "Banana", "Cherry"];
  return <ul>{fruits.map((fruit) => <li key={fruit}>{fruit}</li>)}</ul>;
}

function Ex02_Numbers() {
  const nums = [1, 2, 3, 4, 5];
  return <div>{nums.map((n) => <p key={n}>{n}</p>)}</div>;
}

function Ex03_WithIndex() {
  return (
    <div>
      {["a", "b", "c"].map((letter, i) => (
        <p key={i}>{i}: {letter}</p>
      ))}
    </div>
  );
}

function Ex04_ObjectProperty() {
  const users = [{ name: "Ali" }, { name: "Sara" }];
  return <div>{users.map((user) => <p key={user.name}>{user.name}</p>)}</div>;
}

function Ex05_MultipleFields() {
  const people = [
    { name: "Ali", age: 25 },
    { name: "Sara", age: 30 },
  ];
  return (
    <div>
      {people.map((p) => (
        <p key={p.name}>{p.name} - {p.age}</p>
      ))}
    </div>
  );
}

function Ex06_Buttons() {
  return (
    <div>
      {["Save", "Delete", "Edit"].map((label) => (
        <button key={label}>{label}</button>
      ))}
    </div>
  );
}

function Ex07_Images() {
  const urls = ["https://via.placeholder.com/50", "https://via.placeholder.com/60"];
  return (
    <div>
      {urls.map((url) => <img key={url} src={url} alt="placeholder" />)}
    </div>
  );
}

function Ex08_Headings() {
  return (
    <div>
      {["H1", "H2", "H3"].map((t, i) => (
        <h3 key={i}>Heading {i + 1}: {t}</h3>
      ))}
    </div>
  );
}

function Ex09_WithKey() {
  const items = [{ id: 1, name: "A" }, { id: 2, name: "B" }];
  return <ul>{items.map((item) => <li key={item.id}>{item.name}</li>)}</ul>;
}

function Ex10_TableRows() {
  const scores = [90, 80, 70];
  return (
    <table border={1}>
      <tbody>
        {scores.map((s, i) => (
          <tr key={i}><td>{i + 1}</td><td>{s}</td></tr>
        ))}
      </tbody>
    </table>
  );
}

// ─────────────────────────────────────────
// INTERMEDIATE (11–25)
// ─────────────────────────────────────────

function Ex11_ConditionalRender() {
  const items = ["apple", "banana", "cherry"];
  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item === "banana" ? "🍌 Banana" : item}</li>
      ))}
    </ul>
  );
}

function Ex12_FilterThenMap() {
  const nums = [1, 2, 3, 4, 5];
  return (
    <div>
      {nums.filter((n) => n % 2 === 0).map((n) => <p key={n}>{n}</p>)}
    </div>
  );
}

function Ex13_ComputeValue() {
  const prices = [10, 20, 30];
  return (
    <div>
      {prices.map((p) => <p key={p}>Price with tax: {(p * 1.1).toFixed(2)}</p>)}
    </div>
  );
}

function UserCard({ name }: { name: string }) {
  return <div style={{ border: "1px solid #ccc", padding: 8 }}>{name}</div>;
}

function Ex14_ComponentPerItem() {
  const names = ["Ali", "Sara"];
  return <div>{names.map((name) => <UserCard key={name} name={name} />)}</div>;
}

function Ex15_OnClickPerItem() {
  const items = ["One", "Two", "Three"];
  return (
    <div>
      {items.map((item) => (
        <button key={item} onClick={() => alert(item)}>{item}</button>
      ))}
    </div>
  );
}

function Ex16_NestedObject() {
  const users = [{ name: "Ali", address: { city: "Cairo" } }];
  return (
    <div>
      {users.map((u) => <p key={u.name}>{u.name} - {u.address.city}</p>)}
    </div>
  );
}

function Ex17_ClassNameByValue() {
  const statuses = ["active", "inactive", "pending"];
  return (
    <div>
      {statuses.map((s) => (
        <span key={s} style={{ color: s === "active" ? "green" : "red", marginRight: 8 }}>
          {s}
        </span>
      ))}
    </div>
  );
}

function Ex18_SelectOptions() {
  const options = ["React", "Vue", "Angular"];
  return (
    <select>
      {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  );
}

function Ex19_IndexAsKey() {
  const tags = ["js", "ts", "react"];
  return <div>{tags.map((tag, i) => <span key={i}>#{tag} </span>)}</div>;
}

function Ex20_Checkboxes() {
  const tasks = ["Task A", "Task B", "Task C"];
  return (
    <div>
      {tasks.map((task) => (
        <label key={task} style={{ display: "block" }}>
          <input type="checkbox" /> {task}
        </label>
      ))}
    </div>
  );
}

function Ex21_JSXElements() {
  const elements = [<b>Bold</b>, <i>Italic</i>, <u>Underline</u>];
  return <div>{elements.map((el, i) => <div key={i}>{el}</div>)}</div>;
}

function Ex22_Grid() {
  const cols = [1, 2, 3];
  return (
    <div style={{ display: "flex" }}>
      {cols.map((c) => (
        <div key={c} style={{ width: "33%", border: "1px solid #ccc" }}>Col {c}</div>
      ))}
    </div>
  );
}

function Ex23_ReverseThenMap() {
  const steps = ["Step 1", "Step 2", "Step 3"];
  return <div>{[...steps].reverse().map((s, i) => <p key={i}>{s}</p>)}</div>;
}

function Ex24_SortThenMap() {
  const names = ["Charlie", "Alice", "Bob"];
  return <ul>{[...names].sort().map((n) => <li key={n}>{n}</li>)}</ul>;
}

function Ex25_Destructuring() {
  const users = [{ id: 1, name: "Ali" }, { id: 2, name: "Sara" }];
  return <ul>{users.map(({ id, name }) => <li key={id}>{name}</li>)}</ul>;
}

// ─────────────────────────────────────────
// NESTED MAP (26–35)
// ─────────────────────────────────────────

function Ex26_2DArray() {
  const matrix = [[1, 2], [3, 4], [5, 6]];
  return (
    <div>
      {matrix.map((row, i) => (
        <div key={i}>{row.map((cell, j) => <span key={j}>{cell} </span>)}</div>
      ))}
    </div>
  );
}

function Ex27_CategoriesWithItems() {
  const data = [
    { category: "Fruits", items: ["Apple", "Banana"] },
    { category: "Vegs", items: ["Carrot", "Pea"] },
  ];
  return (
    <div>
      {data.map((group) => (
        <div key={group.category}>
          <h4>{group.category}</h4>
          <ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      ))}
    </div>
  );
}

function Ex28_MenuWithSubmenus() {
  const menu = [
    { label: "File", sub: ["New", "Open", "Save"] },
    { label: "Edit", sub: ["Cut", "Copy", "Paste"] },
  ];
  return (
    <div>
      {menu.map((m) => (
        <div key={m.label}>
          <b>{m.label}</b>
          <ul>{m.sub.map((s) => <li key={s}>{s}</li>)}</ul>
        </div>
      ))}
    </div>
  );
}

function Ex29_Table() {
  const data = [{ name: "Ali", score: 90 }, { name: "Sara", score: 85 }];
  return (
    <table border={1}>
      <thead><tr><th>Name</th><th>Score</th></tr></thead>
      <tbody>
        {data.map((row) => (
          <tr key={row.name}><td>{row.name}</td><td>{row.score}</td></tr>
        ))}
      </tbody>
    </table>
  );
}

function Ex30_CardsWithTags() {
  const cards = [
    { title: "Post 1", tags: ["react", "js"] },
    { title: "Post 2", tags: ["css", "html"] },
  ];
  return (
    <div>
      {cards.map((card) => (
        <div key={card.title} style={{ border: "1px solid #ccc", padding: 8, marginBottom: 8 }}>
          <h3>{card.title}</h3>
          {card.tags.map((tag) => <span key={tag} style={{ marginRight: 4 }}>#{tag}</span>)}
        </div>
      ))}
    </div>
  );
}

function Ex31_Accordion() {
  const faqs = [
    { q: "What is React?", a: "A UI library." },
    { q: "What is JSX?", a: "JS + HTML syntax." },
  ];
  return (
    <div>
      {faqs.map(({ q, a }) => (
        <details key={q}>
          <summary>{q}</summary>
          <p>{a}</p>
        </details>
      ))}
    </div>
  );
}

function Ex32_ProgressBars() {
  const skills = [{ name: "React", level: 80 }, { name: "CSS", level: 60 }];
  return (
    <div>
      {skills.map((s) => (
        <div key={s.name} style={{ marginBottom: 8 }}>
          <span>{s.name}</span>
          <div style={{ width: `${s.level}%`, background: "blue", height: 10 }} />
        </div>
      ))}
    </div>
  );
}

function Ex33_Timeline() {
  const events = [
    { year: 2020, event: "Started coding" },
    { year: 2022, event: "First job" },
  ];
  return (
    <div>
      {events.map((e) => (
        <div key={e.year}><b>{e.year}</b>: {e.event}</div>
      ))}
    </div>
  );
}

function Ex34_StarRatings() {
  const products = [{ name: "Shoes", stars: 4 }, { name: "Hat", stars: 3 }];
  return (
    <div>
      {products.map((p) => (
        <div key={p.name}>{p.name}: {"⭐".repeat(p.stars)}</div>
      ))}
    </div>
  );
}

function Ex35_Links() {
  const links = [{ label: "Home", href: "#" }, { label: "About", href: "#" }];
  return (
    <nav>
      {links.map((l) => <a key={l.label} href={l.href} style={{ marginRight: 8 }}>{l.label}</a>)}
    </nav>
  );
}

// ─────────────────────────────────────────
// WITH STATE & EVENTS (36–45)
// ─────────────────────────────────────────

function Ex36_ToggleSelection() {
  const [selected, setSelected] = useState<string | null>(null);
  const items = ["A", "B", "C"];
  return (
    <div>
      {items.map((item) => (
        <div
          key={item}
          style={{ background: selected === item ? "yellow" : "white", cursor: "pointer", padding: 4 }}
          onClick={() => setSelected(item)}
        >
          {item}
        </div>
      ))}
    </div>
  );
}

function Ex37_DeleteItem() {
  const [items, setItems] = useState(["X", "Y", "Z"]);
  return (
    <ul>
      {items.map((item, i) => (
        <li key={i}>
          {item}
          <button onClick={() => setItems(items.filter((_, idx) => idx !== i))}>Delete</button>
        </li>
      ))}
    </ul>
  );
}

function Ex38_IndividualCounters() {
  const [counts, setCounts] = useState([0, 0, 0]);
  return (
    <div>
      {counts.map((c, i) => (
        <div key={i}>
          Count {i + 1}: {c}
          <button onClick={() => setCounts(counts.map((v, j) => (j === i ? v + 1 : v)))}>+</button>
        </div>
      ))}
    </div>
  );
}

function Ex39_MarkAsDone() {
  const [todos, setTodos] = useState([
    { text: "Learn React", done: false },
    { text: "Build app", done: false },
  ]);
  return (
    <ul>
      {todos.map((todo, i) => (
        <li key={i} style={{ textDecoration: todo.done ? "line-through" : "none" }}>
          {todo.text}
          <button onClick={() => setTodos(todos.map((t, j) => (j === i ? { ...t, done: true } : t)))}>
            Done
          </button>
        </li>
      ))}
    </ul>
  );
}

function Ex40_InlineEdit() {
  const [items, setItems] = useState(["First", "Second"]);
  return (
    <div>
      {items.map((item, i) => (
        <input
          key={i}
          value={item}
          onChange={(e) => setItems(items.map((v, j) => (j === i ? e.target.value : v)))}
          style={{ display: "block", marginBottom: 4 }}
        />
      ))}
    </div>
  );
}

function Ex41_HoverHighlight() {
  const [hovered, setHovered] = useState<string | null>(null);
  const items = ["One", "Two", "Three"];
  return (
    <div>
      {items.map((item) => (
        <div
          key={item}
          style={{ background: hovered === item ? "#eee" : "white", padding: 4 }}
          onMouseEnter={() => setHovered(item)}
          onMouseLeave={() => setHovered(null)}
        >
          {item}
        </div>
      ))}
    </div>
  );
}

function Ex42_MultiCheckbox() {
  const labels = ["A", "B", "C"];
  const [checked, setChecked] = useState([false, false, false]);
  return (
    <div>
      {labels.map((label, i) => (
        <label key={i} style={{ display: "block" }}>
          <input
            type="checkbox"
            checked={checked[i]}
            onChange={() => setChecked(checked.map((v, j) => (j === i ? !v : v)))}
          />
          {label}
        </label>
      ))}
    </div>
  );
}

function Ex43_ReorderItems() {
  const [items, setItems] = useState(["A", "B", "C"]);
  const moveUp = (i: number) => {
    if (i === 0) return;
    const next = [...items];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    setItems(next);
  };
  return (
    <div>
      {items.map((item, i) => (
        <div key={i}>
          {item} <button onClick={() => moveUp(i)}>↑</button>
        </div>
      ))}
    </div>
  );
}

function Ex44_SearchFilter() {
  const [query, setQuery] = useState("");
  const names = ["Alice", "Bob", "Charlie", "Dave"];
  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" />
      <ul>
        {names
          .filter((n) => n.toLowerCase().includes(query.toLowerCase()))
          .map((n) => <li key={n}>{n}</li>)}
      </ul>
    </>
  );
}

function Ex45_Pagination() {
  const [page, setPage] = useState(0);
  const all = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const perPage = 3;
  const visible = all.slice(page * perPage, page * perPage + perPage);
  return (
    <>
      {visible.map((n) => <p key={n}>{n}</p>)}
      <button disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</button>
      <button disabled={(page + 1) * perPage >= all.length} onClick={() => setPage(page + 1)}>Next</button>
    </>
  );
}

// ─────────────────────────────────────────
// ADVANCED PATTERNS (46–50)
// ─────────────────────────────────────────

function Ex46_DynamicForm() {
  const fields = ["username", "email", "password"];
  const [form, setForm] = useState<Record<string, string>>({});
  return (
    <div>
      {fields.map((field) => (
        <input
          key={field}
          type={field === "password" ? "password" : "text"}
          placeholder={field}
          value={form[field] || ""}
          onChange={(e) => setForm({ ...form, [field]: e.target.value })}
          style={{ display: "block", marginBottom: 4 }}
        />
      ))}
    </div>
  );
}

function Ex47_ComponentByType() {
  const blocks = [
    { type: "text", content: "Hello World" },
    { type: "image", content: "https://via.placeholder.com/80" },
  ];
  return (
    <div>
      {blocks.map((block, i) => {
        if (block.type === "text") return <p key={i}>{block.content}</p>;
        if (block.type === "image") return <img key={i} src={block.content} alt="" />;
        return null;
      })}
    </div>
  );
}

function Ex48_Breadcrumb() {
  const crumbs = ["Home", "Products", "Shoes"];
  return (
    <nav>
      {crumbs.map((crumb, i) => (
        <span key={i}>
          {crumb}
          {i < crumbs.length - 1 && " > "}
        </span>
      ))}
    </nav>
  );
}

function Ex49_RefPerItem() {
  const items = ["A", "B", "C"];
  const refs = items.map(() => useRef<HTMLDivElement>(null));
  const focusItem = (i: number) => {
    refs[i].current?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <>
      {items.map((item, i) => (
        <button key={i} onClick={() => focusItem(i)} style={{ marginRight: 4 }}>
          Focus {item}
        </button>
      ))}
      {items.map((item, i) => (
        <div key={i} ref={refs[i]} style={{ padding: 20, background: "#f5f5f5", marginTop: 8 }}>
          Section {item}
        </div>
      ))}
    </>
  );
}

function Ex50_TabUI() {
  const tabs = ["Profile", "Settings", "Notifications"];
  const [activeTab, setActiveTab] = useState("Profile");
  return (
    <>
      <div style={{ display: "flex", gap: 8 }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            style={{ fontWeight: activeTab === tab ? "bold" : "normal" }}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div style={{ padding: 16 }}>Showing: {activeTab}</div>
    </>
  );
}

// ─────────────────────────────────────────
// MAIN APP — renders all 50 examples
// ─────────────────────────────────────────

const examples: { label: string; component: JSX.Element }[] = [
  { label: "01 – String List",            component: <Ex01_StringList /> },
  { label: "02 – Numbers",                component: <Ex02_Numbers /> },
  { label: "03 – With Index",             component: <Ex03_WithIndex /> },
  { label: "04 – Object Property",        component: <Ex04_ObjectProperty /> },
  { label: "05 – Multiple Fields",        component: <Ex05_MultipleFields /> },
  { label: "06 – Buttons",               component: <Ex06_Buttons /> },
  { label: "07 – Images",                component: <Ex07_Images /> },
  { label: "08 – Headings",              component: <Ex08_Headings /> },
  { label: "09 – With Key",              component: <Ex09_WithKey /> },
  { label: "10 – Table Rows",            component: <Ex10_TableRows /> },
  { label: "11 – Conditional Render",    component: <Ex11_ConditionalRender /> },
  { label: "12 – Filter then Map",       component: <Ex12_FilterThenMap /> },
  { label: "13 – Compute Value",         component: <Ex13_ComputeValue /> },
  { label: "14 – Component Per Item",    component: <Ex14_ComponentPerItem /> },
  { label: "15 – onClick Per Item",      component: <Ex15_OnClickPerItem /> },
  { label: "16 – Nested Object",         component: <Ex16_NestedObject /> },
  { label: "17 – ClassName by Value",    component: <Ex17_ClassNameByValue /> },
  { label: "18 – Select Options",        component: <Ex18_SelectOptions /> },
  { label: "19 – Index as Key",          component: <Ex19_IndexAsKey /> },
  { label: "20 – Checkboxes",            component: <Ex20_Checkboxes /> },
  { label: "21 – JSX Elements",          component: <Ex21_JSXElements /> },
  { label: "22 – Grid",                  component: <Ex22_Grid /> },
  { label: "23 – Reverse then Map",      component: <Ex23_ReverseThenMap /> },
  { label: "24 – Sort then Map",         component: <Ex24_SortThenMap /> },
  { label: "25 – Destructuring",         component: <Ex25_Destructuring /> },
  { label: "26 – 2D Array",             component: <Ex26_2DArray /> },
  { label: "27 – Categories + Items",    component: <Ex27_CategoriesWithItems /> },
  { label: "28 – Menu + Submenus",       component: <Ex28_MenuWithSubmenus /> },
  { label: "29 – Table",                 component: <Ex29_Table /> },
  { label: "30 – Cards with Tags",       component: <Ex30_CardsWithTags /> },
  { label: "31 – Accordion",             component: <Ex31_Accordion /> },
  { label: "32 – Progress Bars",         component: <Ex32_ProgressBars /> },
  { label: "33 – Timeline",              component: <Ex33_Timeline /> },
  { label: "34 – Star Ratings",          component: <Ex34_StarRatings /> },
  { label: "35 – Links",                 component: <Ex35_Links /> },
  { label: "36 – Toggle Selection",      component: <Ex36_ToggleSelection /> },
  { label: "37 – Delete Item",           component: <Ex37_DeleteItem /> },
  { label: "38 – Individual Counters",   component: <Ex38_IndividualCounters /> },
  { label: "39 – Mark as Done",          component: <Ex39_MarkAsDone /> },
  { label: "40 – Inline Edit",           component: <Ex40_InlineEdit /> },
  { label: "41 – Hover Highlight",       component: <Ex41_HoverHighlight /> },
  { label: "42 – Multi Checkbox",        component: <Ex42_MultiCheckbox /> },
  { label: "43 – Reorder Items",         component: <Ex43_ReorderItems /> },
  { label: "44 – Search Filter",         component: <Ex44_SearchFilter /> },
  { label: "45 – Pagination",            component: <Ex45_Pagination /> },
  { label: "46 – Dynamic Form",          component: <Ex46_DynamicForm /> },
  { label: "47 – Component by Type",     component: <Ex47_ComponentByType /> },
  { label: "48 – Breadcrumb",            component: <Ex48_Breadcrumb /> },
  { label: "49 – Ref Per Item",          component: <Ex49_RefPerItem /> },
  { label: "50 – Tab UI",                component: <Ex50_TabUI /> },
];

export default function MapExamples() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: 24 }}>
      <h1>50 React map() Examples</h1>
      {examples.map(({ label, component }) => (
        <section
          key={label}
          style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 24 }}
        >
          <h2 style={{ marginTop: 0, fontSize: 16, color: "#555" }}>{label}</h2>
          {component}
        </section>
      ))}
    </div>
  );
}
