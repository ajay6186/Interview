 ---                                                                                                                                                                      
  Basic (1–10)                                                                                                                                                                
  1. Render a list of strings                                                                                                                                              
  const fruits = ["Apple", "Banana", "Cherry"];
  fruits.map((fruit) => <li>{fruit}</li>)

  2. Render numbers
  const nums = [1, 2, 3, 4, 5];
  nums.map((n) => <p>{n}</p>)

  3. Render with index
  ["a", "b", "c"].map((letter, i) => <p>{i}: {letter}</p>)

  4. Render object properties
  const users = [{ name: "Ali" }, { name: "Sara" }];
  users.map((user) => <p>{user.name}</p>)

  5. Render multiple object fields
  const people = [{ name: "Ali", age: 25 }, { name: "Sara", age: 30 }];
  people.map((p) => <p>{p.name} - {p.age}</p>)

  6. Render buttons
  ["Save", "Delete", "Edit"].map((label) => <button>{label}</button>)

  7. Render images
  const urls = ["img1.png", "img2.png"];
  urls.map((url) => <img src={url} alt={url} />)

  8. Render headings
  ["H1", "H2", "H3"].map((t, i) => <h1>Heading {i + 1}: {t}</h1>)

  9. Render with key (correct usage)
  const items = [{ id: 1, name: "A" }, { id: 2, name: "B" }];
  items.map((item) => <li key={item.id}>{item.name}</li>)

  10. Render a table row
  const scores = [90, 80, 70];
  scores.map((s, i) => <tr><td>{i + 1}</td><td>{s}</td></tr>)

  ---
  Intermediate (11–25)

  11. Conditional render inside map
  const items = ["apple", "banana", "cherry"];
  items.map((item) => <li>{item === "banana" ? "🍌 Banana" : item}</li>)

  12. Filter then map
  const nums = [1, 2, 3, 4, 5];
  nums.filter((n) => n % 2 === 0).map((n) => <p>{n}</p>)

  13. Map to compute a value
  const prices = [10, 20, 30];
  prices.map((p) => <p>Price with tax: {p * 1.1}</p>)

  14. Render a component per item
  const names = ["Ali", "Sara"];
  names.map((name) => <UserCard key={name} name={name} />)

  15. Map with onClick per item
  const items = ["One", "Two", "Three"];
  items.map((item, i) => <button onClick={() => alert(item)}>{item}</button>)

  16. Map nested object
  const users = [{ name: "Ali", address: { city: "Cairo" } }];
  users.map((u) => <p>{u.name} - {u.address.city}</p>)

  17. Map with className based on value
  const statuses = ["active", "inactive", "pending"];
  statuses.map((s) => <span className={s === "active" ? "green" : "red"}>{s}</span>)

  18. Map to build select options
  const options = ["React", "Vue", "Angular"];
  options.map((opt) => <option value={opt}>{opt}</option>)

  19. Map with index as key (when no id)
  const tags = ["js", "ts", "react"];
  tags.map((tag, i) => <span key={i}>#{tag}</span>)

  20. Map to render checkboxes
  const tasks = ["Task A", "Task B", "Task C"];
  tasks.map((task) => <label><input type="checkbox" />{task}</label>)

  21. Map over an array of JSX elements
  const elements = [<b>Bold</b>, <i>Italic</i>, <u>Underline</u>];
  elements.map((el, i) => <div key={i}>{el}</div>)

  22. Render a grid
  const cols = [1, 2, 3];
  cols.map((c) => <div style={{ width: "33%" }}>Col {c}</div>)

  23. Reverse then map
  const steps = ["Step 1", "Step 2", "Step 3"];
  [...steps].reverse().map((s) => <p>{s}</p>)

  24. Sort then map
  const names = ["Charlie", "Alice", "Bob"];
  [...names].sort().map((n) => <li>{n}</li>)

  25. Map with destructuring
  const users = [{ id: 1, name: "Ali" }, { id: 2, name: "Sara" }];
  users.map(({ id, name }) => <li key={id}>{name}</li>)

  ---
  Nested Map (26–35)

  26. Nested map (2D array)
  const matrix = [[1, 2], [3, 4], [5, 6]];
  matrix.map((row, i) => (
    <div key={i}>{row.map((cell, j) => <span key={j}>{cell} </span>)}</div>
  ))

  27. Render categories with items
  const data = [
    { category: "Fruits", items: ["Apple", "Banana"] },
    { category: "Vegs", items: ["Carrot", "Pea"] },
  ];
  data.map((group) => (
    <div key={group.category}>
      <h4>{group.category}</h4>
      {group.items.map((item) => <li key={item}>{item}</li>)}
    </div>
  ))

  28. Render a menu with submenus
  const menu = [
    { label: "File", sub: ["New", "Open", "Save"] },
    { label: "Edit", sub: ["Cut", "Copy", "Paste"] },
  ];
  menu.map((m) => (
    <div key={m.label}>
      <b>{m.label}</b>
      <ul>{m.sub.map((s) => <li key={s}>{s}</li>)}</ul>
    </div>
  ))

  29. Map to build a table
  const data = [{ name: "Ali", score: 90 }, { name: "Sara", score: 85 }];
  data.map((row) => (
    <tr key={row.name}>
      <td>{row.name}</td>
      <td>{row.score}</td>
    </tr>
  ))

  30. Map tags array inside a card
  const cards = [
    { title: "Post 1", tags: ["react", "js"] },
    { title: "Post 2", tags: ["css", "html"] },
  ];
  cards.map((card) => (
    <div key={card.title}>
      <h3>{card.title}</h3>
      {card.tags.map((tag) => <span key={tag}>#{tag} </span>)}
    </div>
  ))

  31. Accordion list
  const faqs = [
    { q: "What is React?", a: "A UI library." },
    { q: "What is JSX?", a: "JS + HTML syntax." },
  ];
  faqs.map(({ q, a }) => (
    <details key={q}>
      <summary>{q}</summary>
      <p>{a}</p>
    </details>
  ))

  32. Map to render progress bars
  const skills = [{ name: "React", level: 80 }, { name: "CSS", level: 60 }];
  skills.map((s) => (
    <div key={s.name}>
      <span>{s.name}</span>
      <div style={{ width: `${s.level}%`, background: "blue", height: 10 }} />
    </div>
  ))

  33. Map to render a timeline
  const events = [
    { year: 2020, event: "Started coding" },
    { year: 2022, event: "First job" },
  ];
  events.map((e) => <div key={e.year}><b>{e.year}</b>: {e.event}</div>)

  34. Map to render star ratings
  const products = [{ name: "Shoes", stars: 4 }, { name: "Hat", stars: 3 }];
  products.map((p) => (
    <div key={p.name}>
      {p.name}: {"⭐".repeat(p.stars)}
    </div>
  ))

  35. Map list of links
  const links = [{ label: "Home", href: "/" }, { label: "About", href: "/about" }];
  links.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)

  ---
  With State & Events (36–45)

  36. Toggle item selection
  const [selected, setSelected] = useState(null);
  const items = ["A", "B", "C"];
  items.map((item) => (
    <div
      key={item}
      style={{ background: selected === item ? "yellow" : "white" }}
      onClick={() => setSelected(item)}
    >
      {item}
    </div>
  ))

  37. Delete item from list
  const [items, setItems] = useState(["X", "Y", "Z"]);
  items.map((item, i) => (
    <li key={i}>
      {item}
      <button onClick={() => setItems(items.filter((_, idx) => idx !== i))}>Delete</button>
    </li>
  ))

  38. Increment individual counters
  const [counts, setCounts] = useState([0, 0, 0]);
  counts.map((c, i) => (
    <div key={i}>
      {c}
      <button onClick={() => setCounts(counts.map((v, j) => j === i ? v + 1 : v))}>+</button>
    </div>
  ))

  39. Mark todo as done
  const [todos, setTodos] = useState([
    { text: "Learn React", done: false },
    { text: "Build app", done: false },
  ]);
  todos.map((todo, i) => (
    <li key={i} style={{ textDecoration: todo.done ? "line-through" : "none" }}>
      {todo.text}
      <button onClick={() => setTodos(todos.map((t, j) => j === i ? { ...t, done: true } : t))}>
        Done
      </button>
    </li>
  ))

  40. Edit item inline
  const [items, setItems] = useState(["First", "Second"]);
  items.map((item, i) => (
    <input
      key={i}
      value={item}
      onChange={(e) => setItems(items.map((v, j) => j === i ? e.target.value : v))}
    />
  ))

  41. Highlight hovered item
  const [hovered, setHovered] = useState(null);
  const items = ["One", "Two", "Three"];
  items.map((item) => (
    <div
      key={item}
      style={{ background: hovered === item ? "#eee" : "white" }}
      onMouseEnter={() => setHovered(item)}
      onMouseLeave={() => setHovered(null)}
    >
      {item}
    </div>
  ))

  42. Multi-select with array of booleans
  const labels = ["A", "B", "C"];
  const [checked, setChecked] = useState([false, false, false]);
  labels.map((label, i) => (
    <label key={i}>
      <input
        type="checkbox"
        checked={checked[i]}
        onChange={() => setChecked(checked.map((v, j) => j === i ? !v : v))}
      />
      {label}
    </label>
  ))

  43. Reorder items (move up)
  const [items, setItems] = useState(["A", "B", "C"]);
  const moveUp = (i) => {
    if (i === 0) return;
    const next = [...items];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    setItems(next);
  };
  items.map((item, i) => (
    <div key={i}>
      {item} <button onClick={() => moveUp(i)}>↑</button>
    </div>
  ))

  44. Map with search filter
  const [query, setQuery] = useState("");
  const names = ["Alice", "Bob", "Charlie", "Dave"];
  <>
    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" />
    {names.filter((n) => n.toLowerCase().includes(query.toLowerCase()))
          .map((n) => <li key={n}>{n}</li>)}
  </>

  45. Map with pagination
  const [page, setPage] = useState(0);
  const all = [1,2,3,4,5,6,7,8,9,10];
  const perPage = 3;
  const visible = all.slice(page * perPage, page * perPage + perPage);
  <>
    {visible.map((n) => <p key={n}>{n}</p>)}
    <button onClick={() => setPage(page + 1)}>Next</button>
  </>

  ---
  Advanced Patterns (46–50)

  46. Map to build form fields dynamically
  const fields = ["username", "email", "password"];
  const [form, setForm] = useState({});
  fields.map((field) => (
    <input
      key={field}
      placeholder={field}
      value={form[field] || ""}
      onChange={(e) => setForm({ ...form, [field]: e.target.value })}
    />
  ))

  47. Map to render different components by type
  const blocks = [
    { type: "text", content: "Hello" },
    { type: "image", content: "photo.png" },
  ];
  blocks.map((block, i) => {
    if (block.type === "text") return <p key={i}>{block.content}</p>;
    if (block.type === "image") return <img key={i} src={block.content} alt="" />;
  })

  48. Map to render a breadcrumb
  const crumbs = ["Home", "Products", "Shoes"];
  crumbs.map((crumb, i) => (
    <span key={i}>
      {crumb}
      {i < crumbs.length - 1 && " > "}
    </span>
  ))

  49. Map with useRef per item
  const items = ["A", "B", "C"];
  const refs = items.map(() => useRef(null));  // Note: works only at top level
  items.map((item, i) => <div key={i} ref={refs[i]}>{item}</div>)

  50. Map to build tab UI
  const tabs = ["Profile", "Settings", "Notifications"];
  const [activeTab, setActiveTab] = useState("Profile");
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
    <div>Showing: {activeTab}</div>
  </>

  ---
  Key rules to remember:
  - Always add a unique key prop — prefer IDs over indexes
  - map returns a new array — never mutate the original
  - For filtering + mapping: .filter().map(), not map with if returning null
  - Never call map in a loop or nested hook context