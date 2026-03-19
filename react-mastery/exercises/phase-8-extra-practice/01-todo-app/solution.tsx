import React, { useState } from "react";

// =============================================================
// SOLUTION 1: Todo App
// =============================================================

type FilterType = "all" | "active" | "completed";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export function App() {
  // TODO 1 ✅ — three pieces of state
  const [inputValue, setInputValue] = useState("");
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, text: "Learn React hooks", completed: true },
    { id: 2, text: "Build a todo app", completed: false },
    { id: 3, text: "Practice every day", completed: false },
  ]);
  const [filter, setFilter] = useState<FilterType>("all");

  // TODO 2 ✅ — addTodo: ignore empty, create new object, spread into array
  function addTodo() {
    const text = inputValue.trim();
    if (!text) return;
    setTodos((prev) => [...prev, { id: Date.now(), text, completed: false }]);
    setInputValue("");
  }

  // TODO 3 ✅ — toggleTodo: map over todos, flip the matching one
  function toggleTodo(id: number) {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }

  // TODO 4 ✅ — deleteTodo: filter out the matching id
  function deleteTodo(id: number) {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }

  // TODO 5 ✅ — filteredTodos: derived from todos + filter
  const filteredTodos = todos.filter((todo) => {
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true; // "all"
  });

  // TODO 6 ✅ — remainingCount: todos not yet completed
  const remainingCount = todos.filter((t) => !t.completed).length;

  // Allow pressing Enter to add a todo
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") addTodo();
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Todo App</h1>

      {/* --- INPUT ROW --- */}
      <div style={styles.inputRow}>
        <input
          style={styles.input}
          type="text"
          placeholder="What needs to be done?"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button style={styles.addBtn} onClick={addTodo}>
          Add
        </button>
      </div>

      {/* --- FILTER BUTTONS --- */}
      <div style={styles.filterRow}>
        {(["all", "active", "completed"] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              ...styles.filterBtn,
              fontWeight: filter === f ? "bold" : "normal",
              background: filter === f ? "#e0e7ff" : "#f9fafb",
              borderColor: filter === f ? "#4f46e5" : "#ccc",
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* --- TODO LIST --- */}
      <ul style={styles.list}>
        {filteredTodos.length === 0 && (
          <p style={{ color: "#9ca3af", textAlign: "center", padding: 20 }}>
            No todos here!
          </p>
        )}
        {filteredTodos.map((todo) => (
          <li key={todo.id} style={styles.todoItem}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
              style={{ cursor: "pointer", width: 18, height: 18 }}
            />
            <span
              style={{
                ...styles.todoText,
                textDecoration: todo.completed ? "line-through" : "none",
                color: todo.completed ? "#9ca3af" : "#111827",
              }}
            >
              {todo.text}
            </span>
            <button style={styles.deleteBtn} onClick={() => deleteTodo(todo.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>

      {/* --- FOOTER --- */}
      <p style={styles.counter}>
        <strong>{remainingCount}</strong> task{remainingCount !== 1 ? "s" : ""} remaining
      </p>
    </div>
  );
}

// --- KEY CONCEPTS ---
// 1. Never mutate state directly:   setTodos(prev => [...prev, newItem])
// 2. Update by mapping:             prev.map(t => t.id === id ? {...t, completed: !t.completed} : t)
// 3. Delete by filtering:           prev.filter(t => t.id !== id)
// 4. Derived values (filteredTodos, remainingCount) are computed from state — no extra state needed!
// 5. Controlled input: value={inputValue} + onChange={e => setInputValue(e.target.value)}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 480, margin: "40px auto", fontFamily: "sans-serif", padding: "0 16px" },
  title: { textAlign: "center", fontSize: 28, marginBottom: 20 },
  inputRow: { display: "flex", gap: 8, marginBottom: 12 },
  input: { flex: 1, padding: "8px 12px", fontSize: 15, borderRadius: 6, border: "1px solid #ccc" },
  addBtn: { padding: "8px 16px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 15 },
  filterRow: { display: "flex", gap: 8, marginBottom: 16 },
  filterBtn: { flex: 1, padding: "6px 0", border: "1px solid #ccc", borderRadius: 6, cursor: "pointer", fontSize: 14 },
  list: { listStyle: "none", padding: 0, margin: 0 },
  todoItem: { display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #f0f0f0" },
  todoText: { flex: 1, fontSize: 15 },
  deleteBtn: { padding: "4px 10px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 13 },
  counter: { textAlign: "right", color: "#6b7280", fontSize: 13, marginTop: 12 },
};
