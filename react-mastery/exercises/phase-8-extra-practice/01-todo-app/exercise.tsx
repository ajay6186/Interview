import React, { useState } from "react";

// =============================================================
// EXERCISE 1: Todo App (useState — CRUD on arrays)
// =============================================================
// WHAT YOU WILL PRACTICE:
//   - useState with arrays of objects
//   - Adding, deleting, and updating items in state
//   - Filtering a list based on a value
//   - Controlled inputs
//
// GOAL: Build a working Todo app with:
//   1. An input + button to ADD a new todo
//   2. A list that shows all todos
//   3. A checkbox on each todo to mark it COMPLETE / INCOMPLETE
//   4. A delete button on each todo
//   5. Filter buttons: "All" | "Active" | "Completed"
//   6. A counter: "X tasks remaining"
// =============================================================

// --- Types (do not change) ---
type FilterType = "all" | "active" | "completed";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

// =============================================================
// TODO 1: Set up state
//   - inputValue: string  (controlled input)
//   - todos: Todo[]       (list of todo objects)
//   - filter: FilterType  (which filter is active)
// =============================================================

// =============================================================
// TODO 2: Write addTodo()
//   - Ignore empty strings (trim the input first)
//   - Create a new Todo: { id: Date.now(), text, completed: false }
//   - Add it to the todos array WITHOUT mutating the old array
//   - Clear the input after adding
// =============================================================

// =============================================================
// TODO 3: Write toggleTodo(id: number)
//   - Find the todo with the matching id
//   - Flip its `completed` boolean
//   - Return a new array (do NOT mutate)
// =============================================================

// =============================================================
// TODO 4: Write deleteTodo(id: number)
//   - Return a new array with that todo removed
// =============================================================

// =============================================================
// TODO 5: Derive filteredTodos
//   - "all"       → show everything
//   - "active"    → show only completed === false
//   - "completed" → show only completed === true
// =============================================================

// =============================================================
// TODO 6: Derive remainingCount
//   - Count todos where completed === false
// =============================================================

export function App() {
  // TODO 1: declare state here

  // TODO 2: addTodo function

  // TODO 3: toggleTodo function

  // TODO 4: deleteTodo function

  // TODO 5: filteredTodos (derived value)

  // TODO 6: remainingCount (derived value)

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Todo App</h1>

      {/* --- INPUT ROW --- */}
      <div style={styles.inputRow}>
        <input
          style={styles.input}
          type="text"
          placeholder="What needs to be done?"
          // TODO: bind value and onChange
        />
        {/* TODO: call addTodo on click */}
        <button style={styles.addBtn}>Add</button>
      </div>

      {/* --- FILTER BUTTONS --- */}
      <div style={styles.filterRow}>
        {(["all", "active", "completed"] as FilterType[]).map((f) => (
          <button
            key={f}
            // TODO: highlight the active filter and set filter on click
            style={{
              ...styles.filterBtn,
              // fontWeight: filter === f ? "bold" : "normal",
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* --- TODO LIST --- */}
      <ul style={styles.list}>
        {/* TODO: map over filteredTodos and render each item */}
        {/* Each item should have:
              - a checkbox (checked = todo.completed, onChange = toggleTodo)
              - the todo text (strike-through when completed)
              - a Delete button (onClick = deleteTodo)
        */}
      </ul>

      {/* --- FOOTER --- */}
      <p style={styles.counter}>
        {/* TODO: show remainingCount */}
        tasks remaining
      </p>
    </div>
  );
}

// --- Styles (already done for you) ---
const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 480,
    margin: "40px auto",
    fontFamily: "sans-serif",
    padding: "0 16px",
  },
  title: { textAlign: "center", fontSize: 28, marginBottom: 20 },
  inputRow: { display: "flex", gap: 8, marginBottom: 12 },
  input: { flex: 1, padding: "8px 12px", fontSize: 15, borderRadius: 6, border: "1px solid #ccc" },
  addBtn: { padding: "8px 16px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 15 },
  filterRow: { display: "flex", gap: 8, marginBottom: 16 },
  filterBtn: { flex: 1, padding: "6px 0", border: "1px solid #ccc", borderRadius: 6, cursor: "pointer", background: "#f9fafb", fontSize: 14 },
  list: { listStyle: "none", padding: 0, margin: 0 },
  todoItem: { display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #f0f0f0" },
  todoText: { flex: 1, fontSize: 15 },
  deleteBtn: { padding: "4px 10px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 13 },
  counter: { textAlign: "right", color: "#6b7280", fontSize: 13, marginTop: 12 },
};
