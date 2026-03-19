import React, { useState } from "react";

// ============================================================
// Exercise 5: Lists and Keys (SOLUTION)
// ============================================================

type Priority = "low" | "medium" | "high";

type Task = {
  id: number;
  title: string;
  category: string;
  priority: Priority;
  completed: boolean;
};

type SortField = "title" | "priority" | "category";
type SortDirection = "asc" | "desc";
type FilterMode = "all" | "active" | "completed";

const initialTasks: Task[] = [
  { id: 1, title: "Set up React project", category: "Development", priority: "high", completed: true },
  { id: 2, title: "Design component hierarchy", category: "Development", priority: "high", completed: false },
  { id: 3, title: "Write unit tests", category: "Testing", priority: "medium", completed: false },
  { id: 4, title: "Review pull requests", category: "Development", priority: "medium", completed: false },
  { id: 5, title: "Update documentation", category: "Documentation", priority: "low", completed: true },
  { id: 6, title: "Fix CSS layout issues", category: "Development", priority: "high", completed: false },
  { id: 7, title: "Write integration tests", category: "Testing", priority: "medium", completed: false },
  { id: 8, title: "Create API docs", category: "Documentation", priority: "low", completed: false },
];

const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

const priorityColor: Record<Priority, string> = {
  high: "#e74c3c",
  medium: "#f39c12",
  low: "#27ae60",
};

// SOLUTION 1: TaskItem with proper key-friendly structure
function TaskItem({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <li
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 0",
        borderBottom: "1px solid #eee",
      }}
    >
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
      />
      <span
        style={{
          flex: 1,
          textDecoration: task.completed ? "line-through" : "none",
          color: task.completed ? "#999" : "#000",
        }}
      >
        {task.title}
      </span>
      <span
        style={{
          background: priorityColor[task.priority],
          color: "white",
          borderRadius: 4,
          padding: "2px 6px",
          fontSize: 11,
          textTransform: "uppercase",
          fontWeight: "bold",
        }}
      >
        {task.priority}
      </span>
      <span style={{ color: "gray", fontSize: 13 }}>({task.category})</span>
      <button
        onClick={() => onDelete(task.id)}
        style={{
          background: "#e74c3c",
          color: "white",
          border: "none",
          borderRadius: 4,
          padding: "4px 8px",
          cursor: "pointer",
          fontSize: 12,
        }}
      >
        Remove
      </button>
    </li>
  );
}

// SOLUTION 2: TaskInputForm with local state
function TaskInputForm({
  onAdd,
}: {
  onAdd: (title: string, category: string, priority: Priority) => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Development");
  const [priority, setPriority] = useState<Priority>("medium");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed, category, priority);
    setTitle("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}
    >
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title..."
        style={{ flex: 1, minWidth: 200, padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        style={{ padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
      >
        <option value="Development">Development</option>
        <option value="Testing">Testing</option>
        <option value="Documentation">Documentation</option>
      </select>
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value as Priority)}
        style={{ padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <button
        type="submit"
        style={{
          padding: "8px 16px",
          background: "#3498db",
          color: "white",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
        }}
      >
        Add Task
      </button>
    </form>
  );
}

// SOLUTION 3: FilterBar with filter buttons and sort controls
function FilterBar({
  filterMode,
  onFilterChange,
  sortField,
  onSortFieldChange,
  sortDirection,
  onToggleSortDirection,
}: {
  filterMode: FilterMode;
  onFilterChange: (mode: FilterMode) => void;
  sortField: SortField;
  onSortFieldChange: (field: SortField) => void;
  sortDirection: SortDirection;
  onToggleSortDirection: () => void;
}) {
  const filterOptions: { mode: FilterMode; label: string }[] = [
    { mode: "all", label: "All" },
    { mode: "active", label: "Active" },
    { mode: "completed", label: "Completed" },
  ];

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        flexWrap: "wrap",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", gap: 4 }}>
        {filterOptions.map(({ mode, label }) => (
          <button
            key={mode}
            onClick={() => onFilterChange(mode)}
            style={{
              padding: "6px 12px",
              border: "1px solid #ccc",
              borderRadius: 4,
              background: filterMode === mode ? "#3498db" : "#fff",
              color: filterMode === mode ? "#fff" : "#333",
              cursor: "pointer",
              fontWeight: filterMode === mode ? "bold" : "normal",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "#666" }}>Sort by:</span>
        <select
          value={sortField}
          onChange={(e) => onSortFieldChange(e.target.value as SortField)}
          style={{ padding: 6, borderRadius: 4, border: "1px solid #ccc" }}
        >
          <option value="title">Title</option>
          <option value="priority">Priority</option>
          <option value="category">Category</option>
        </select>
        <button
          onClick={onToggleSortDirection}
          style={{
            padding: "6px 10px",
            border: "1px solid #ccc",
            borderRadius: 4,
            background: "#fff",
            cursor: "pointer",
            fontSize: 16,
          }}
        >
          {sortDirection === "asc" ? "\u2191" : "\u2193"}
        </button>
      </div>
    </div>
  );
}

// SOLUTION 4: Grouped (nested) list rendering
function GroupedTaskList({
  tasks,
  onToggle,
  onDelete,
}: {
  tasks: Task[];
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const grouped = tasks.reduce<Record<string, Task[]>>((acc, task) => {
    if (!acc[task.category]) {
      acc[task.category] = [];
    }
    acc[task.category].push(task);
    return acc;
  }, {});

  const categories = Object.keys(grouped).sort();

  return (
    <div>
      {categories.map((category) => (
        <div key={category} style={{ marginBottom: 16 }}>
          <h3 style={{ borderBottom: "2px solid #3498db", paddingBottom: 4 }}>
            {category} ({grouped[category].length})
          </h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {grouped[category].map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={onToggle}
                onDelete={onDelete}
              />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// SOLUTION 5: TaskStats component
function TaskStats({ tasks }: { tasks: Task[] }) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const highCount = tasks.filter((t) => t.priority === "high").length;
  const mediumCount = tasks.filter((t) => t.priority === "medium").length;
  const lowCount = tasks.filter((t) => t.priority === "low").length;

  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        marginBottom: 16,
        padding: 12,
        background: "#f8f9fa",
        borderRadius: 8,
        flexWrap: "wrap",
      }}
    >
      <div>
        <strong>Total:</strong> {total}
      </div>
      <div>
        <strong>Completed:</strong> {completed}/{total}
      </div>
      <div>
        <span style={{ color: priorityColor.high }}>High: {highCount}</span>
      </div>
      <div>
        <span style={{ color: priorityColor.medium }}>Medium: {mediumCount}</span>
      </div>
      <div>
        <span style={{ color: priorityColor.low }}>Low: {lowCount}</span>
      </div>
    </div>
  );
}

// SOLUTION 6 & 7: App with state, filtering, sorting, and full rendering
export function App() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [sortField, setSortField] = useState<SortField>("priority");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Derive filtered list
  const filteredTasks = tasks.filter((task) => {
    if (filterMode === "active") return !task.completed;
    if (filterMode === "completed") return task.completed;
    return true;
  });

  // Derive sorted list
  const processedTasks = [...filteredTasks].sort((a, b) => {
    let comparison: number;

    if (sortField === "priority") {
      comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
    } else if (sortField === "title") {
      comparison = a.title.localeCompare(b.title);
    } else {
      comparison = a.category.localeCompare(b.category);
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  const handleAdd = (title: string, category: string, priority: Priority) => {
    setTasks((prev) => [
      ...prev,
      { id: Date.now(), title, category, priority, completed: false },
    ]);
  };

  const handleToggle = (id: number) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleDelete = (id: number) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 700, margin: "0 auto", padding: 20 }}>
      <h1>Exercise 5: Lists and Keys</h1>

      <TaskStats tasks={tasks} />

      <TaskInputForm onAdd={handleAdd} />

      <FilterBar
        filterMode={filterMode}
        onFilterChange={setFilterMode}
        sortField={sortField}
        onSortFieldChange={setSortField}
        sortDirection={sortDirection}
        onToggleSortDirection={toggleSortDirection}
      />

      <h2>Flat List ({processedTasks.length} tasks)</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {processedTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        ))}
      </ul>

      <hr />

      <h2>Grouped by Category</h2>
      <GroupedTaskList
        tasks={processedTasks}
        onToggle={handleToggle}
        onDelete={handleDelete}
      />
    </div>
  );
}
