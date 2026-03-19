import React, { useState } from "react";

// ============================================================
// Exercise 3: Props and Data Flow (SOLUTION)
// ============================================================

type Theme = "light" | "dark";

type Todo = {
  id: number;
  text: string;
  done: boolean;
};

const initialTodos: Todo[] = [
  { id: 1, text: "Learn React fundamentals", done: true },
  { id: 2, text: "Practice props and data flow", done: false },
  { id: 3, text: "Build a real project", done: false },
];

// SOLUTION 1: StatusBar - receives data via props
function StatusBar({ count, theme }: { count: number; theme: Theme }) {
  return (
    <div
      style={{
        background: theme === "dark" ? "#333" : "#f0f0f0",
        color: theme === "dark" ? "#fff" : "#000",
        padding: 12,
        borderRadius: 4,
        marginBottom: 12,
      }}
    >
      <strong>{count}</strong> items remaining
    </div>
  );
}

// SOLUTION 2: TodoItem - receives callbacks for child-to-parent communication
function TodoItem({
  todo,
  onToggle,
  onDelete,
}: {
  todo: Todo;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <li style={{ listStyle: "none", padding: "8px 0", display: "flex", alignItems: "center", gap: 8 }}>
      <input
        type="checkbox"
        checked={todo.done}
        onChange={() => onToggle(todo.id)}
      />
      <span style={{ textDecoration: todo.done ? "line-through" : "none", flex: 1 }}>
        {todo.text}
      </span>
      <button
        onClick={() => onDelete(todo.id)}
        style={{ background: "#e74c3c", color: "white", border: "none", borderRadius: 4, padding: "4px 8px", cursor: "pointer" }}
      >
        Delete
      </button>
    </li>
  );
}

// SOLUTION 3: TodoList - drills props down to TodoItem
function TodoList({
  todos,
  onToggle,
  onDelete,
  theme,
}: {
  todos: Todo[];
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  theme: Theme;
}) {
  const remainingCount = todos.filter((t) => !t.done).length;

  return (
    <div>
      <StatusBar count={remainingCount} theme={theme} />
      <ul style={{ padding: 0 }}>
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </div>
  );
}

// SOLUTION 4: Card - uses props.children for composition
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16, marginBottom: 16 }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {children}
    </div>
  );
}

// SOLUTION 5: ThemeToggle - child communicates to parent via callback
function ThemeToggle({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  return (
    <button
      onClick={onToggleTheme}
      style={{
        marginBottom: 16,
        padding: "8px 16px",
        background: theme === "dark" ? "#fff" : "#333",
        color: theme === "dark" ? "#333" : "#fff",
        border: "none",
        borderRadius: 4,
        cursor: "pointer",
        fontSize: 14,
      }}
    >
      Switch to {theme === "light" ? "Dark" : "Light"}
    </button>
  );
}

// SOLUTION 6: DataRenderer - render prop pattern
function DataRenderer({
  data,
  render,
}: {
  data: any[];
  render: (item: any, index: number) => React.ReactNode;
}) {
  return (
    <ul style={{ padding: 0, listStyle: "none" }}>
      {data.map((item, index) => (
        <li key={index}>{render(item, index)}</li>
      ))}
    </ul>
  );
}

// SOLUTION 7: TodoInput - manages local state, communicates up via onAdd
function TodoInput({ onAdd }: { onAdd: (text: string) => void }) {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (trimmed) {
      onAdd(trimmed);
      setText("");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a new todo..."
        style={{ flex: 1, padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
      />
      <button
        type="submit"
        style={{ padding: "8px 16px", background: "#3498db", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}
      >
        Add
      </button>
    </form>
  );
}

// SOLUTION 8 & 9: App with state and full composition
export function App() {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [theme, setTheme] = useState<Theme>("light");

  const handleToggle = (id: number) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, done: !todo.done } : todo
      )
    );
  };

  const handleDelete = (id: number) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  const handleAdd = (text: string) => {
    setTodos((prev) => [...prev, { id: Date.now(), text, done: false }]);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <div
      style={{
        fontFamily: "sans-serif",
        maxWidth: 600,
        margin: "0 auto",
        padding: 20,
        background: theme === "dark" ? "#1a1a2e" : "#fff",
        color: theme === "dark" ? "#eee" : "#000",
        minHeight: "100vh",
      }}
    >
      <h1>Exercise 3: Props and Data Flow</h1>

      <ThemeToggle theme={theme} onToggleTheme={toggleTheme} />

      <Card title="Todo List">
        <TodoInput onAdd={handleAdd} />
        <TodoList
          todos={todos}
          onToggle={handleToggle}
          onDelete={handleDelete}
          theme={theme}
        />
      </Card>

      <Card title="Render Props Demo">
        <p>Skills rendered via render prop:</p>
        <DataRenderer
          data={["React", "TypeScript", "CSS"]}
          render={(skill, i) => (
            <span style={{ fontWeight: "bold" }}>
              {i + 1}. {skill}
            </span>
          )}
        />
      </Card>
    </div>
  );
}
