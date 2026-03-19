import React, { useState } from "react";

// ============================================================
// Examples 1.5 — Lists & Keys (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ============================================================
// BASIC — simple lists, keys, list item components (1–13)
// ============================================================

// 1. Static string array
const langs = ["TypeScript", "Python", "Rust", "Go"];
function Ex01_StringList() {
  return <ul>{langs.map((l) => <li key={l}>{l}</li>)}</ul>;
}

// 2. Number list
function Ex02_NumberList() {
  const nums = [1, 2, 3, 4, 5];
  return <ol>{nums.map((n) => <li key={n}>{n * n}</li>)}</ol>;
}

// 3. Object list with id as key
type User = { id: number; name: string; email: string };
const users: User[] = [
  { id: 1, name: "Alice", email: "alice@ex.com" },
  { id: 2, name: "Bob",   email: "bob@ex.com" },
  { id: 3, name: "Carol", email: "carol@ex.com" },
];
function Ex03_UserList() {
  return (
    <ul>
      {users.map((u) => <li key={u.id}>{u.name} — {u.email}</li>)}
    </ul>
  );
}

// 4. Email as key (when email is unique)
function Ex04_EmailKey() {
  return <ul>{users.map((u) => <li key={u.email}>{u.name}</li>)}</ul>;
}

// 5. Empty list fallback
function Ex05_EmptyFallback({ items }: { items: string[] }) {
  if (items.length === 0) return <p style={{ color: "gray" }}>Nothing here yet.</p>;
  return <ul>{items.map((i) => <li key={i}>{i}</li>)}</ul>;
}

// 6. Inline numbered list item (index for display only, not as key)
function Ex06_NumberedItems() {
  return (
    <ul>
      {langs.map((l, i) => (
        <li key={l}>{i + 1}. {l}</li>
      ))}
    </ul>
  );
}

// 7. Dedicated list item component
function Ex07_UserItem({ user }: { user: User }) {
  return (
    <li style={{ display: "flex", gap: 8, padding: "4px 0", borderBottom: "1px solid #eee" }}>
      <strong>{user.name}</strong>
      <span style={{ color: "gray" }}>{user.email}</span>
    </li>
  );
}
function Ex07_UserList() {
  return <ul style={{ listStyle: "none", padding: 0 }}>{users.map((u) => <Ex07_UserItem key={u.id} user={u} />)}</ul>;
}

// 8. Ordered list
function Ex08_Steps() {
  const steps = ["Install Node", "Create project", "Install deps", "Start dev server"];
  return <ol>{steps.map((s) => <li key={s}>{s}</li>)}</ol>;
}

// 9. Inline tags list (horizontal chips)
function Ex09_TagChips({ tags }: { tags: string[] }) {
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {tags.map((t) => (
        <span key={t} style={{ background: "#e0e0e0", padding: "2px 10px", borderRadius: 12, fontSize: 13 }}>{t}</span>
      ))}
    </div>
  );
}

// 10. Description list (term + definition pairs)
const glossary = [
  { term: "JSX", def: "JavaScript XML" },
  { term: "Props", def: "Read-only component inputs" },
  { term: "State", def: "Mutable component data" },
];
function Ex10_GlossaryList() {
  return (
    <dl>
      {glossary.map(({ term, def }) => (
        <React.Fragment key={term}>
          <dt style={{ fontWeight: "bold" }}>{term}</dt>
          <dd>{def}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

// 11. List with add (state)
function Ex11_DynamicList() {
  const [items, setItems] = useState(["Item 1"]);
  return (
    <div>
      <button onClick={() => setItems((p) => [...p, `Item ${p.length + 1}`])}>Add</button>
      <ul>{items.map((i) => <li key={i}>{i}</li>)}</ul>
    </div>
  );
}

// 12. List with remove
function Ex12_RemovableList() {
  const [items, setItems] = useState(["Alpha", "Beta", "Gamma"]);
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {items.map((item) => (
        <li key={item} style={{ display: "flex", gap: 8 }}>
          <span style={{ flex: 1 }}>{item}</span>
          <button onClick={() => setItems((p) => p.filter((i) => i !== item))}>✕</button>
        </li>
      ))}
    </ul>
  );
}

// 13. Spreading item props onto component
type Product = { id: number; name: string; price: number; inStock: boolean };
function Ex13_ProductCard({ name, price, inStock }: Product) {
  return (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
      <strong>{name}</strong>
      <p>${price.toFixed(2)} {!inStock && <span style={{ color: "red" }}>(Out of stock)</span>}</p>
    </div>
  );
}
const products: Product[] = [
  { id: 1, name: "Keyboard", price: 79.99, inStock: true },
  { id: 2, name: "Mouse",    price: 39.99, inStock: false },
];
function Ex13_ProductGrid() {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      {products.map((p) => <Ex13_ProductCard key={p.id} {...p} />)}
    </div>
  );
}

// ============================================================
// INTERMEDIATE — filter, sort, reduce, pagination, stats (14–26)
// ============================================================

// 14. .filter() — show active only
function Ex14_FilterActive({ items }: { items: { id: number; label: string; active: boolean }[] }) {
  return (
    <ul>
      {items.filter((i) => i.active).map((i) => <li key={i.id}>{i.label}</li>)}
    </ul>
  );
}

// 15. .sort() — alphabetically
function Ex15_SortedList({ items }: { items: string[] }) {
  const sorted = [...items].sort((a, b) => a.localeCompare(b));
  return <ul>{sorted.map((i) => <li key={i}>{i}</li>)}</ul>;
}

// 16. .sort() with priority order
type Priority = "high" | "medium" | "low";
const priorityRank: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
type Task = { id: number; title: string; priority: Priority; done: boolean };
const priorityColor: Record<Priority, string> = { high: "#e74c3c", medium: "#f39c12", low: "#27ae60" };

function Ex16_PrioritySorted({ tasks }: { tasks: Task[] }) {
  const sorted = [...tasks].sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {sorted.map((t) => (
        <li key={t.id} style={{ display: "flex", gap: 8, padding: "4px 0" }}>
          <span style={{ background: priorityColor[t.priority], color: "#fff", borderRadius: 4, padding: "1px 6px", fontSize: 11, textTransform: "uppercase" }}>{t.priority}</span>
          <span>{t.title}</span>
        </li>
      ))}
    </ul>
  );
}

// 17. .reduce() to count by category
function Ex17_CategoryCounts({ tasks }: { tasks: Task[] }) {
  const counts = tasks.reduce<Record<Priority, number>>(
    (acc, t) => ({ ...acc, [t.priority]: (acc[t.priority] ?? 0) + 1 }),
    { high: 0, medium: 0, low: 0 }
  );
  return (
    <div style={{ display: "flex", gap: 12 }}>
      {(Object.entries(counts) as [Priority, number][]).map(([p, n]) => (
        <span key={p} style={{ color: priorityColor[p] }}>{p}: {n}</span>
      ))}
    </div>
  );
}

// 18. .flatMap() — flatten nested arrays
function Ex18_FlatMap() {
  const matrix = [[1, 2], [3, 4], [5, 6]];
  const flat = matrix.flatMap((row) => row);
  return <p>{flat.join(" · ")}</p>;
}

// 19. .slice() for pagination
function Ex19_PagedList({ items, pageSize = 3 }: { items: string[]; pageSize?: number }) {
  const [page, setPage] = useState(0);
  const visible = items.slice(page * pageSize, (page + 1) * pageSize);
  const total = Math.ceil(items.length / pageSize);
  return (
    <div>
      <ul>{visible.map((i) => <li key={i}>{i}</li>)}</ul>
      <div style={{ display: "flex", gap: 4 }}>
        {Array.from({ length: total }, (_, i) => (
          <button key={i} onClick={() => setPage(i)} style={{ fontWeight: i === page ? "bold" : "normal" }}>{i + 1}</button>
        ))}
      </div>
    </div>
  );
}

// 20. .find() to highlight selected
function Ex20_SelectableList({ items }: { items: { id: number; label: string }[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {items.map((item) => (
        <li
          key={item.id}
          onClick={() => setSelected(item.id)}
          style={{ padding: "6px 8px", background: item.id === selected ? "#dbeafe" : "transparent", cursor: "pointer", borderRadius: 4 }}
        >
          {item.id === selected && "▶ "}
          {item.label}
        </li>
      ))}
    </ul>
  );
}

// 21. Composite key (date + type)
const events = [
  { date: "2024-01-01", type: "login",  user: "Alice" },
  { date: "2024-01-01", type: "logout", user: "Alice" },
  { date: "2024-01-02", type: "login",  user: "Bob" },
];
function Ex21_CompositeKey() {
  return (
    <ul>
      {events.map((e) => (
        <li key={`${e.date}-${e.type}-${e.user}`}>{e.date} {e.type} by {e.user}</li>
      ))}
    </ul>
  );
}

// 22. List with toggle (checkbox)
function Ex22_CheckList() {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const toggle = (id: number) =>
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {users.map((u) => (
        <li key={u.id} style={{ display: "flex", gap: 8, cursor: "pointer" }} onClick={() => toggle(u.id)}>
          <input type="checkbox" readOnly checked={checked.has(u.id)} />
          <span style={{ textDecoration: checked.has(u.id) ? "line-through" : "none" }}>{u.name}</span>
        </li>
      ))}
    </ul>
  );
}

// 23. List with inline edit
function Ex23_EditableList() {
  const [items, setItems] = useState([{ id: 1, label: "Item A" }, { id: 2, label: "Item B" }]);
  const [editId, setEditId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {items.map((item) => (
        <li key={item.id} style={{ display: "flex", gap: 8, padding: "4px 0" }}>
          {editId === item.id ? (
            <>
              <input value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus />
              <button onClick={() => { setItems((p) => p.map((i) => i.id === item.id ? { ...i, label: draft } : i)); setEditId(null); }}>Save</button>
            </>
          ) : (
            <>
              <span style={{ flex: 1 }}>{item.label}</span>
              <button onClick={() => { setEditId(item.id); setDraft(item.label); }}>Edit</button>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

// 24. .some() / .every() for list statistics
function Ex24_ListStats({ tasks }: { tasks: Task[] }) {
  const allDone = tasks.every((t) => t.done);
  const anyHigh = tasks.some((t) => t.priority === "high");
  return (
    <p>
      {allDone ? "✓ All complete" : "In progress"}{" "}
      {anyHigh && <span style={{ color: "red" }}>· High priority items present</span>}
    </p>
  );
}

// 25. Filter mode (all / active / done)
type FilterMode = "all" | "active" | "done";
function Ex25_FilteredTaskList({ tasks }: { tasks: Task[] }) {
  const [mode, setMode] = useState<FilterMode>("all");
  const filtered = tasks.filter((t) =>
    mode === "all" ? true : mode === "done" ? t.done : !t.done
  );
  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {(["all", "active", "done"] as FilterMode[]).map((m) => (
          <button key={m} onClick={() => setMode(m)} style={{ fontWeight: m === mode ? "bold" : "normal" }}>{m}</button>
        ))}
      </div>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {filtered.map((t) => (
          <li key={t.id} style={{ textDecoration: t.done ? "line-through" : "none", color: t.done ? "#999" : "#000" }}>{t.title}</li>
        ))}
      </ul>
    </div>
  );
}

// 26. Searchable list
function Ex26_SearchList({ items }: { items: string[] }) {
  const [q, setQ] = useState("");
  const filtered = items.filter((i) => i.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" style={{ marginBottom: 8, width: "100%", padding: 6 }} />
      {filtered.length === 0
        ? <p style={{ color: "gray" }}>No results for "{q}"</p>
        : <ul>{filtered.map((i) => <li key={i}>{i}</li>)}</ul>
      }
    </div>
  );
}

// ============================================================
// NESTED — grouped lists, trees, tables, timelines (27–38)
// ============================================================

// 27. .reduce() to group by category
function Ex27_GroupedByCategory({ tasks }: { tasks: Task[] }) {
  const grouped = tasks.reduce<Record<string, Task[]>>((acc, t) => {
    const key = t.priority;
    return { ...acc, [key]: [...(acc[key] ?? []), t] };
  }, {});
  return (
    <div>
      {Object.entries(grouped).map(([priority, group]) => (
        <div key={priority} style={{ marginBottom: 12 }}>
          <h4 style={{ color: priorityColor[priority as Priority], borderBottom: `2px solid ${priorityColor[priority as Priority]}`, paddingBottom: 4 }}>
            {priority.toUpperCase()} ({group.length})
          </h4>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {group.map((t) => <li key={t.id}>{t.title}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}

// 28. Grouped by first letter (alphabetical sections)
function Ex28_AlphaGroups({ names }: { names: string[] }) {
  const groups = names.reduce<Record<string, string[]>>((acc, n) => {
    const letter = n[0].toUpperCase();
    return { ...acc, [letter]: [...(acc[letter] ?? []), n] };
  }, {});
  return (
    <div>
      {Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([letter, group]) => (
        <div key={letter}>
          <h4 style={{ background: "#3498db", color: "#fff", padding: "2px 8px", display: "inline-block", borderRadius: 4 }}>{letter}</h4>
          <ul>{group.map((n) => <li key={n}>{n}</li>)}</ul>
        </div>
      ))}
    </div>
  );
}

// 29. Tree structure (recursive)
type TreeNode = { id: number; label: string; children?: TreeNode[] };
function Ex29_TreeList({ nodes, depth = 0 }: { nodes: TreeNode[]; depth?: number }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, paddingLeft: depth * 16 }}>
      {nodes.map((node) => (
        <li key={node.id}>
          <span>{node.label}</span>
          {node.children && node.children.length > 0 && (
            <Ex29_TreeList nodes={node.children} depth={depth + 1} />
          )}
        </li>
      ))}
    </ul>
  );
}

// 30. Expandable tree (toggle open/close per node)
function Ex30_ExpandableNode({ node }: { node: TreeNode }) {
  const [open, setOpen] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  return (
    <li style={{ listStyle: "none" }}>
      <span
        onClick={() => hasChildren && setOpen((v) => !v)}
        style={{ cursor: hasChildren ? "pointer" : "default", userSelect: "none" }}
      >
        {hasChildren ? (open ? "▼ " : "▶ ") : "  · "}
        {node.label}
      </span>
      {open && node.children && (
        <ul style={{ paddingLeft: 16 }}>
          {node.children.map((child) => <Ex30_ExpandableNode key={child.id} node={child} />)}
        </ul>
      )}
    </li>
  );
}

// 31. Data table with sorting
type SortDir = "asc" | "desc";
function Ex31_SortableTable({ rows }: { rows: User[] }) {
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const sorted = [...rows].sort((a, b) => {
    const cmp = a.name.localeCompare(b.name);
    return sortDir === "asc" ? cmp : -cmp;
  });
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th onClick={() => setSortDir((d) => d === "asc" ? "desc" : "asc")} style={{ cursor: "pointer", textAlign: "left" }}>
            Name {sortDir === "asc" ? "↑" : "↓"}
          </th>
          <th style={{ textAlign: "left" }}>Email</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((u) => (
          <tr key={u.id}>
            <td>{u.name}</td>
            <td>{u.email}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// 32. Multi-select list with bulk actions
function Ex32_MultiSelectList({ items }: { items: { id: number; label: string }[] }) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const toggleAll = () =>
    setSelected(selected.size === items.length ? new Set() : new Set(items.map((i) => i.id)));
  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  return (
    <div>
      <div style={{ marginBottom: 8, display: "flex", gap: 8, alignItems: "center" }}>
        <input type="checkbox" checked={selected.size === items.length} onChange={toggleAll} />
        <span>Select all</span>
        {selected.size > 0 && <button onClick={() => setSelected(new Set())}>Delete {selected.size}</button>}
      </div>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {items.map((item) => (
          <li key={item.id} style={{ display: "flex", gap: 8, padding: "4px 0" }}>
            <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggle(item.id)} />
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// 33. Timeline / activity feed
type TimelineEvent = { id: number; time: string; actor: string; action: string };
function Ex33_Timeline({ events: evs }: { events: TimelineEvent[] }) {
  return (
    <ol style={{ listStyle: "none", padding: 0, borderLeft: "2px solid #3498db", marginLeft: 8 }}>
      {evs.map((ev) => (
        <li key={ev.id} style={{ paddingLeft: 16, marginBottom: 12, position: "relative" }}>
          <span style={{ position: "absolute", left: -7, top: 2, width: 12, height: 12, background: "#3498db", borderRadius: "50%", display: "block" }} />
          <small style={{ color: "gray" }}>{ev.time}</small>
          <p style={{ margin: "2px 0 0" }}><strong>{ev.actor}</strong> {ev.action}</p>
        </li>
      ))}
    </ol>
  );
}

// 34. Chat message list (different alignment per sender)
type Message = { id: number; text: string; fromMe: boolean };
function Ex34_ChatList({ messages }: { messages: Message[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {messages.map((msg) => (
        <div
          key={msg.id}
          style={{
            alignSelf: msg.fromMe ? "flex-end" : "flex-start",
            background: msg.fromMe ? "#3498db" : "#f0f0f0",
            color: msg.fromMe ? "#fff" : "#000",
            padding: "6px 12px",
            borderRadius: 16,
            maxWidth: "70%",
          }}
        >
          {msg.text}
        </div>
      ))}
    </div>
  );
}

// 35. Nested list with independent expand state per group
function Ex35_CollapsibleGroups() {
  const groups = [
    { id: "dev", label: "Development", items: ["React", "TypeScript", "Node.js"] },
    { id: "tools", label: "Tools", items: ["Vite", "ESLint", "Prettier"] },
  ];
  const [open, setOpen] = useState<Set<string>>(new Set(["dev"]));
  const toggle = (id: string) =>
    setOpen((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  return (
    <div>
      {groups.map((g) => (
        <div key={g.id} style={{ marginBottom: 8 }}>
          <button onClick={() => toggle(g.id)} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: 14 }}>
            {open.has(g.id) ? "▼" : "▶"} {g.label}
          </button>
          {open.has(g.id) && (
            <ul>
              {g.items.map((i) => <li key={i}>{i}</li>)}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

// 36. List with reorder (move up/down)
function Ex36_ReorderableList() {
  const [items, setItems] = useState(["Alpha", "Beta", "Gamma", "Delta"]);
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
  };
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {items.map((item, i) => (
        <li key={item} style={{ display: "flex", gap: 8, padding: "4px 0", alignItems: "center" }}>
          <button onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
          <button onClick={() => move(i, 1)} disabled={i === items.length - 1}>↓</button>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// 37. Virtualisation-ready flat list (renders only visible window)
function Ex37_WindowedList({ items, itemHeight = 40, visibleCount = 5 }: { items: string[]; itemHeight?: number; visibleCount?: number }) {
  const [offset, setOffset] = useState(0);
  const visible = items.slice(offset, offset + visibleCount);
  return (
    <div>
      <div style={{ height: itemHeight * visibleCount, overflow: "hidden" }}>
        {visible.map((item, i) => (
          <div key={item} style={{ height: itemHeight, display: "flex", alignItems: "center", background: (offset + i) % 2 === 0 ? "#f9f9f9" : "#fff", padding: "0 8px" }}>
            #{offset + i + 1} {item}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
        <button onClick={() => setOffset((o) => Math.max(0, o - visibleCount))}>Prev</button>
        <button onClick={() => setOffset((o) => Math.min(items.length - visibleCount, o + visibleCount))}>Next</button>
        <span style={{ lineHeight: "28px", fontSize: 13 }}>{offset + 1}–{Math.min(offset + visibleCount, items.length)} of {items.length}</span>
      </div>
    </div>
  );
}

// 38. Table with grouped rows (rowspan concept via separate header rows)
type CategoryGroup = { category: string; tasks: Task[] };
function Ex38_GroupedTable({ groups }: { groups: CategoryGroup[] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead><tr><th>Title</th><th>Priority</th><th>Done</th></tr></thead>
      <tbody>
        {groups.map((g) => (
          <React.Fragment key={g.category}>
            <tr style={{ background: "#f0f4f8" }}>
              <td colSpan={3} style={{ padding: "4px 8px", fontWeight: "bold" }}>{g.category} ({g.tasks.length})</td>
            </tr>
            {g.tasks.map((t) => (
              <tr key={t.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "4px 8px", textDecoration: t.done ? "line-through" : "none" }}>{t.title}</td>
                <td style={{ padding: "4px 8px", color: priorityColor[t.priority] }}>{t.priority}</td>
                <td style={{ padding: "4px 8px" }}>{t.done ? "✓" : "○"}</td>
              </tr>
            ))}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
}

// ============================================================
// ADVANCED — normalised state, key strategies, generic list, optimistic update (39–50)
// ============================================================

// 39. Generic list component with keyFn + renderItem
function Ex39_GenericList<T>({
  items,
  keyFn,
  renderItem,
  emptyState,
}: {
  items: T[];
  keyFn: (item: T) => string | number;
  renderItem: (item: T, index: number) => React.ReactNode;
  emptyState?: React.ReactNode;
}) {
  if (items.length === 0) return <>{emptyState ?? <p style={{ color: "gray" }}>Empty</p>}</>;
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {items.map((item, i) => (
        <li key={keyFn(item)} style={{ padding: "4px 0", borderBottom: "1px solid #f0f0f0" }}>
          {renderItem(item, i)}
        </li>
      ))}
    </ul>
  );
}

// 40. Stable key strategy — use crypto-like id on creation
function Ex40_StableKeys() {
  const [items, setItems] = useState<{ id: string; text: string }[]>([
    { id: "a1b2", text: "Existing item" },
  ]);
  const addItem = () =>
    setItems((p) => [...p, { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, text: `New ${p.length + 1}` }]);
  return (
    <div>
      <button onClick={addItem}>Add (stable ID)</button>
      <ul>{items.map((i) => <li key={i.id}>{i.text}</li>)}</ul>
    </div>
  );
}

// 41. Normalised list state (ids array + entities map)
type NormalisedState<T> = { ids: number[]; entities: Record<number, T> };
function Ex41_NormalisedList() {
  const [state, setState] = useState<NormalisedState<{ id: number; name: string }>>({
    ids: [1, 2, 3],
    entities: { 1: { id: 1, name: "Alpha" }, 2: { id: 2, name: "Beta" }, 3: { id: 3, name: "Gamma" } },
  });
  const remove = (id: number) =>
    setState((p) => ({ ids: p.ids.filter((i) => i !== id), entities: Object.fromEntries(Object.entries(p.entities).filter(([k]) => Number(k) !== id)) }));
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {state.ids.map((id) => (
        <li key={id} style={{ display: "flex", gap: 8 }}>
          <span style={{ flex: 1 }}>{state.entities[id].name}</span>
          <button onClick={() => remove(id)}>✕</button>
        </li>
      ))}
    </ul>
  );
}

// 42. Optimistic update — remove item immediately, restore on failure
function Ex42_OptimisticList() {
  const [items, setItems] = useState(["Alpha", "Beta", "Gamma"]);
  const optimisticDelete = (item: string) => {
    setItems((p) => p.filter((i) => i !== item));
    // Simulate async failure for "Beta"
    if (item === "Beta") {
      setTimeout(() => {
        alert(`Failed to delete ${item}, restoring.`);
        setItems((p) => [...p, item].sort());
      }, 800);
    }
  };
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {items.map((item) => (
        <li key={item} style={{ display: "flex", gap: 8 }}>
          <span style={{ flex: 1 }}>{item}</span>
          <button onClick={() => optimisticDelete(item)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}

// 43. Sorted + filtered + paginated pipeline
function Ex43_FullPipeline({ tasks }: { tasks: Task[] }) {
  const [filter, setFilter] = useState<"all" | Priority>("all");
  const [page, setPage] = useState(0);
  const PAGE = 3;

  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.priority === filter);
  const sorted = [...filtered].sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
  const paged = sorted.slice(page * PAGE, (page + 1) * PAGE);
  const totalPages = Math.ceil(sorted.length / PAGE);

  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {(["all", "high", "medium", "low"] as const).map((f) => (
          <button key={f} onClick={() => { setFilter(f); setPage(0); }} style={{ fontWeight: filter === f ? "bold" : "normal" }}>{f}</button>
        ))}
      </div>
      <Ex16_PrioritySorted tasks={paged} />
      <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
        {Array.from({ length: totalPages }, (_, i) => (
          <button key={i} onClick={() => setPage(i)} style={{ fontWeight: i === page ? "bold" : "normal" }}>{i + 1}</button>
        ))}
      </div>
    </div>
  );
}

// 44. List with drag handle (visual only, no drag API)
function Ex44_DragHandleList() {
  const [items, setItems] = useState(["Item A", "Item B", "Item C", "Item D"]);
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [removed] = next.splice(from, 1);
    next.splice(to, 0, removed);
    setItems(next);
  };
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {items.map((item, i) => (
        <li key={item} style={{ display: "flex", gap: 8, padding: "4px 0", background: "#f9f9f9", marginBottom: 2, borderRadius: 4 }}>
          <span style={{ cursor: "grab", padding: "0 8px", color: "#999" }}>⠿</span>
          <span style={{ flex: 1 }}>{item}</span>
          <button onClick={() => move(i, i - 1)} disabled={i === 0} style={{ padding: "2px 6px" }}>↑</button>
          <button onClick={() => move(i, i + 1)} disabled={i === items.length - 1} style={{ padding: "2px 6px" }}>↓</button>
        </li>
      ))}
    </ul>
  );
}

// 45. List with column header sort (multi-column)
type SortField = "name" | "id";
function Ex45_MultiColumnSort({ rows }: { rows: User[] }) {
  const [field, setField] = useState<SortField>("name");
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  const sortBy = (f: SortField) => {
    if (f === field) setDir((d) => d === "asc" ? "desc" : "asc");
    else { setField(f); setDir("asc"); }
  };
  const sorted = [...rows].sort((a, b) => {
    const v = field === "name" ? a.name.localeCompare(b.name) : a.id - b.id;
    return dir === "asc" ? v : -v;
  });
  const arrow = (f: SortField) => field === f ? (dir === "asc" ? " ↑" : " ↓") : "";
  return (
    <table style={{ borderCollapse: "collapse", width: "100%" }}>
      <thead>
        <tr>
          <th onClick={() => sortBy("id")} style={{ cursor: "pointer", textAlign: "left", padding: "4px 8px" }}>ID{arrow("id")}</th>
          <th onClick={() => sortBy("name")} style={{ cursor: "pointer", textAlign: "left", padding: "4px 8px" }}>Name{arrow("name")}</th>
          <th style={{ textAlign: "left", padding: "4px 8px" }}>Email</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((u) => (
          <tr key={u.id} style={{ borderBottom: "1px solid #eee" }}>
            <td style={{ padding: "4px 8px" }}>{u.id}</td>
            <td style={{ padding: "4px 8px" }}>{u.name}</td>
            <td style={{ padding: "4px 8px" }}>{u.email}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// 46. Infinite scroll structure (load more pattern)
function Ex46_LoadMore() {
  const allItems = Array.from({ length: 50 }, (_, i) => `Item ${i + 1}`);
  const [limit, setLimit] = useState(10);
  const visible = allItems.slice(0, limit);
  return (
    <div>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {visible.map((item) => <li key={item} style={{ padding: "4px 0", borderBottom: "1px solid #f0f0f0" }}>{item}</li>)}
      </ul>
      {limit < allItems.length && (
        <button onClick={() => setLimit((n) => Math.min(n + 10, allItems.length))} style={{ width: "100%", padding: 8, marginTop: 8 }}>
          Load more ({allItems.length - limit} remaining)
        </button>
      )}
    </div>
  );
}

// 47. Keyed transition hint (key change forces remount = animation reset)
function Ex47_KeyedTransition() {
  const items = ["Red", "Green", "Blue", "Yellow"];
  const [active, setActive] = useState(0);
  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {items.map((item, i) => (
          <button key={item} onClick={() => setActive(i)}>{item}</button>
        ))}
      </div>
      {/* Changing key forces React to remount this element */}
      <div key={active} style={{ padding: 12, background: "#f0f4f8", borderRadius: 8, transition: "opacity 0.3s" }}>
        Now showing: <strong>{items[active]}</strong>
      </div>
    </div>
  );
}

// 48. List diff visualisation (added/removed highlighting)
function Ex48_DiffList({ before, after }: { before: string[]; after: string[] }) {
  const added   = after.filter((i) => !before.includes(i));
  const removed = before.filter((i) => !after.includes(i));
  const kept    = after.filter((i) => before.includes(i));
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {removed.map((i) => <li key={`rem-${i}`} style={{ color: "red",   textDecoration: "line-through" }}>− {i}</li>)}
      {kept.map((i)    => <li key={`kep-${i}`} style={{ color: "#333"  }}>  {i}</li>)}
      {added.map((i)   => <li key={`add-${i}`} style={{ color: "green" }}>+ {i}</li>)}
    </ul>
  );
}

// 49. Bi-directional list navigation with keyboard
function Ex49_KeyboardNav({ items }: { items: string[] }) {
  const [active, setActive] = useState(0);
  return (
    <ul
      style={{ listStyle: "none", padding: 0, outline: "none" }}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown") setActive((i) => Math.min(i + 1, items.length - 1));
        if (e.key === "ArrowUp")   setActive((i) => Math.max(i - 1, 0));
      }}
    >
      {items.map((item, i) => (
        <li
          key={item}
          style={{ padding: "4px 8px", background: i === active ? "#dbeafe" : "transparent", borderRadius: 4, cursor: "pointer" }}
          onClick={() => setActive(i)}
        >
          {i === active && "▶ "}{item}
        </li>
      ))}
      <li style={{ color: "gray", fontSize: 11, marginTop: 4 }}>↑↓ to navigate</li>
    </ul>
  );
}

// 50. Full showcase
const sampleTasks: Task[] = [
  { id: 1, title: "Set up project",         priority: "high",   done: true  },
  { id: 2, title: "Design data model",       priority: "high",   done: false },
  { id: 3, title: "Write unit tests",        priority: "medium", done: false },
  { id: 4, title: "Update docs",             priority: "low",    done: true  },
  { id: 5, title: "Fix CSS layout",          priority: "high",   done: false },
  { id: 6, title: "Integration tests",       priority: "medium", done: false },
  { id: 7, title: "Create API docs",         priority: "low",    done: false },
  { id: 8, title: "Review pull requests",    priority: "medium", done: false },
];
const sampleGroups: CategoryGroup[] = [
  { category: "Development", tasks: sampleTasks.filter((_, i) => i % 2 === 0) },
  { category: "Testing",     tasks: sampleTasks.filter((_, i) => i % 2 !== 0) },
];
const treeData: TreeNode = {
  id: 0, label: "root",
  children: [
    { id: 1, label: "src", children: [{ id: 2, label: "App.tsx" }, { id: 3, label: "main.tsx" }] },
    { id: 4, label: "public", children: [{ id: 5, label: "index.html" }] },
  ],
};
const timelineData = [
  { id: 1, time: "09:00", actor: "Alice", action: "pushed to main" },
  { id: 2, time: "09:15", actor: "Bob",   action: "opened PR #42" },
  { id: 3, time: "10:00", actor: "Alice", action: "approved PR #42" },
];
const chatData: Message[] = [
  { id: 1, text: "Hey, got a minute?", fromMe: false },
  { id: 2, text: "Sure, what's up?",   fromMe: true  },
  { id: 3, text: "Can you review my PR?", fromMe: false },
  { id: 4, text: "On it!",             fromMe: true  },
];

export function App() {
  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 700, margin: "0 auto", padding: 20 }}>
      <h1>Examples 1.5 — Lists &amp; Keys</h1>

      <h2>Basic</h2>
      <Ex01_StringList />
      <Ex05_EmptyFallback items={[]} />
      <Ex09_TagChips tags={["React", "TS", "CSS"]} />
      <Ex10_GlossaryList />
      <Ex11_DynamicList />
      <Ex12_RemovableList />
      <Ex13_ProductGrid />

      <h2>Intermediate</h2>
      <Ex15_SortedList items={["Mango", "Apple", "Cherry", "Banana"]} />
      <Ex16_PrioritySorted tasks={sampleTasks} />
      <Ex17_CategoryCounts tasks={sampleTasks} />
      <Ex20_SelectableList items={[{ id: 1, label: "Alpha" }, { id: 2, label: "Beta" }, { id: 3, label: "Gamma" }]} />
      <Ex22_CheckList />
      <Ex23_EditableList />
      <Ex24_ListStats tasks={sampleTasks} />
      <Ex25_FilteredTaskList tasks={sampleTasks} />
      <Ex26_SearchList items={["Apple", "Apricot", "Banana", "Blueberry", "Cherry"]} />

      <h2>Nested</h2>
      <Ex27_GroupedByCategory tasks={sampleTasks} />
      <Ex28_AlphaGroups names={["Alice", "Bob", "Carol", "Dave", "Eve", "Frank", "Anna"]} />
      <ul style={{ listStyle: "none", padding: 0 }}>
        <Ex30_ExpandableNode node={treeData} />
      </ul>
      <Ex31_SortableTable rows={users} />
      <Ex32_MultiSelectList items={[{ id: 1, label: "Task A" }, { id: 2, label: "Task B" }, { id: 3, label: "Task C" }]} />
      <Ex33_Timeline events={timelineData} />
      <Ex34_ChatList messages={chatData} />
      <Ex35_CollapsibleGroups />
      <Ex36_ReorderableList />
      <Ex38_GroupedTable groups={sampleGroups} />

      <h2>Advanced</h2>
      <Ex39_GenericList
        items={sampleTasks}
        keyFn={(t) => t.id}
        renderItem={(t) => <span style={{ textDecoration: t.done ? "line-through" : "none" }}>{t.title}</span>}
        emptyState={<p>No tasks.</p>}
      />
      <Ex40_StableKeys />
      <Ex41_NormalisedList />
      <Ex42_OptimisticList />
      <Ex43_FullPipeline tasks={sampleTasks} />
      <Ex44_DragHandleList />
      <Ex45_MultiColumnSort rows={users} />
      <Ex46_LoadMore />
      <Ex47_KeyedTransition />
      <Ex48_DiffList before={["Apple", "Banana", "Cherry"]} after={["Banana", "Cherry", "Durian"]} />
      <Ex49_KeyboardNav items={["React", "Vue", "Svelte", "Angular"]} />
      <Ex37_WindowedList items={Array.from({ length: 100 }, (_, i) => `Row ${i + 1}`)} />
    </div>
  );
}
