import React, { useState, useEffect, useCallback, useMemo } from "react";

// ============================================================
// Solution: Full Mini App - Todo Application
// ============================================================
// A complete, polished Todo app combining state management,
// effects, memoization, component composition, and localStorage
// persistence. The capstone of the React Mastery course.
// ============================================================

// 1. Todo type
type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
};

type FilterType = "all" | "active" | "completed";

const STORAGE_KEY = "react-mastery-todos";

// 2. Custom hook for localStorage persistence
function useTodos(): [Todo[], React.Dispatch<React.SetStateAction<Todo[]>>] {
  const [todos, setTodos] = useState<Todo[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch {
      // Silently fail if localStorage is full
    }
  }, [todos]);

  return [todos, setTodos];
}

// 3. TodoInput component
function TodoInput({ onAdd }: { onAdd: (text: string) => void }) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (trimmed) {
      onAdd(trimmed);
      setText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="What needs to be done?"
        style={{
          flex: 1,
          padding: "12px 16px",
          border: "2px solid #e2e8f0",
          borderRadius: "8px",
          fontSize: "16px",
          outline: "none",
          transition: "border-color 0.2s",
        }}
      />
      <button
        onClick={handleSubmit}
        disabled={!text.trim()}
        style={{
          padding: "12px 24px",
          backgroundColor: text.trim() ? "#3b82f6" : "#94a3b8",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "16px",
          cursor: text.trim() ? "pointer" : "not-allowed",
          fontWeight: "bold",
        }}
      >
        Add
      </button>
    </div>
  );
}

// 4. TodoItem component with toggle, delete, and inline edit
function TodoItem({
  todo,
  onToggle,
  onDelete,
  onEdit,
}: {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newText: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);

  const handleSave = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== todo.text) {
      onEdit(todo.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(todo.text);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  };

  const timeAgo = getTimeAgo(todo.createdAt);

  if (isEditing) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 14px",
          backgroundColor: "#fffbeb",
          borderRadius: "8px",
          border: "1px solid #fde68a",
        }}
      >
        <input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          style={{
            flex: 1,
            padding: "6px 10px",
            border: "1px solid #fbbf24",
            borderRadius: "6px",
            fontSize: "14px",
            outline: "none",
          }}
        />
        <button onClick={handleSave} style={smallBtn("#16a34a")}>
          Save
        </button>
        <button onClick={handleCancel} style={smallBtn("#6b7280")}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 14px",
        backgroundColor: todo.completed ? "#f8fafc" : "white",
        borderRadius: "8px",
        border: "1px solid #e2e8f0",
        transition: "background-color 0.2s",
      }}
    >
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        style={{ width: "18px", height: "18px", cursor: "pointer" }}
      />
      <div style={{ flex: 1 }}>
        <span
          style={{
            fontSize: "15px",
            textDecoration: todo.completed ? "line-through" : "none",
            color: todo.completed ? "#9ca3af" : "#1f2937",
          }}
        >
          {todo.text}
        </span>
        <span style={{ fontSize: "11px", color: "#9ca3af", marginLeft: "8px" }}>
          {timeAgo}
        </span>
      </div>
      <button
        onClick={() => {
          setEditText(todo.text);
          setIsEditing(true);
        }}
        style={smallBtn("#f59e0b")}
      >
        Edit
      </button>
      <button onClick={() => onDelete(todo.id)} style={smallBtn("#ef4444")}>
        Delete
      </button>
    </div>
  );
}

// 5. TodoList component
function TodoList({
  todos,
  onToggle,
  onDelete,
  onEdit,
}: {
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newText: string) => void;
}) {
  if (todos.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "40px 20px",
          color: "#9ca3af",
          fontSize: "15px",
        }}
      >
        <div style={{ fontSize: "40px", marginBottom: "8px" }}>No todos yet</div>
        <p>Add a todo above to get started.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}

// 6. TodoFilter component
function TodoFilter({
  filter,
  onFilterChange,
  counts,
}: {
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  counts: { all: number; active: number; completed: number };
}) {
  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: `All (${counts.all})` },
    { key: "active", label: `Active (${counts.active})` },
    { key: "completed", label: `Completed (${counts.completed})` },
  ];

  return (
    <div style={{ display: "flex", gap: "6px" }}>
      {filters.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onFilterChange(key)}
          style={{
            padding: "6px 16px",
            border: "1px solid",
            borderColor: filter === key ? "#3b82f6" : "#d1d5db",
            borderRadius: "20px",
            backgroundColor: filter === key ? "#3b82f6" : "white",
            color: filter === key ? "white" : "#4b5563",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: filter === key ? "bold" : "normal",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// 7. TodoStats component
function TodoStats({ todos }: { todos: Todo[] }) {
  const total = todos.length;
  const completed = todos.filter((t) => t.completed).length;
  const active = total - completed;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "20px",
        padding: "14px 20px",
        backgroundColor: "#f8fafc",
        borderRadius: "8px",
        border: "1px solid #e2e8f0",
      }}
    >
      <StatBadge label="Total" value={total} color="#3b82f6" />
      <StatBadge label="Active" value={active} color="#f59e0b" />
      <StatBadge label="Done" value={completed} color="#16a34a" />
      <div style={{ flex: 1 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "12px",
            color: "#6b7280",
            marginBottom: "4px",
          }}
        >
          <span>Progress</span>
          <span>{percentage}%</span>
        </div>
        <div
          style={{
            height: "8px",
            backgroundColor: "#e2e8f0",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${percentage}%`,
              backgroundColor: "#16a34a",
              borderRadius: "4px",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "22px", fontWeight: "bold", color }}>{value}</div>
      <div style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase" }}>
        {label}
      </div>
    </div>
  );
}

// Utility: relative time
function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Utility: small button style
function smallBtn(bg: string): React.CSSProperties {
  return {
    padding: "4px 12px",
    backgroundColor: bg,
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
  };
}

// 8. App component - wires everything together
export function App() {
  const [todos, setTodos] = useTodos();
  const [filter, setFilter] = useState<FilterType>("all");

  const addTodo = useCallback((text: string) => {
    const newTodo: Todo = {
      id: Date.now().toString(),
      text,
      completed: false,
      createdAt: Date.now(),
    };
    setTodos((prev) => [newTodo, ...prev]);
  }, [setTodos]);

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }, [setTodos]);

  const deleteTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }, [setTodos]);

  const editTodo = useCallback((id: string, newText: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, text: newText } : todo
      )
    );
  }, [setTodos]);

  const clearCompleted = useCallback(() => {
    setTodos((prev) => prev.filter((todo) => !todo.completed));
  }, [setTodos]);

  const counts = useMemo(
    () => ({
      all: todos.length,
      active: todos.filter((t) => !t.completed).length,
      completed: todos.filter((t) => t.completed).length,
    }),
    [todos]
  );

  const filteredTodos = useMemo(() => {
    switch (filter) {
      case "active":
        return todos.filter((t) => !t.completed);
      case "completed":
        return todos.filter((t) => t.completed);
      default:
        return todos;
    }
  }, [todos, filter]);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: "650px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <h1 style={{ margin: "0 0 4px 0", fontSize: "28px", color: "#1e293b" }}>
          Todo App
        </h1>
        <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
          React Mastery Capstone - Phase 6
        </p>
      </div>

      <TodoInput onAdd={addTodo} />
      <TodoStats todos={todos} />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          margin: "16px 0",
        }}
      >
        <TodoFilter filter={filter} onFilterChange={setFilter} counts={counts} />
        {counts.completed > 0 && (
          <button
            onClick={clearCompleted}
            style={{
              padding: "6px 14px",
              backgroundColor: "white",
              color: "#ef4444",
              border: "1px solid #fca5a5",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            Clear completed ({counts.completed})
          </button>
        )}
      </div>

      <TodoList
        todos={filteredTodos}
        onToggle={toggleTodo}
        onDelete={deleteTodo}
        onEdit={editTodo}
      />

      <div
        style={{
          marginTop: "24px",
          padding: "12px",
          backgroundColor: "#f0f9ff",
          border: "1px solid #bae6fd",
          borderRadius: "8px",
          fontSize: "12px",
          color: "#0369a1",
          textAlign: "center",
        }}
      >
        Todos are automatically saved to localStorage. Refresh the page to verify persistence.
      </div>
    </div>
  );
}
