import React, { useState } from "react";

// ============================================================
// Exercise 3: Props and Data Flow
// ============================================================
// In this exercise you will learn about unidirectional data flow,
// passing data and callbacks through props, props drilling,
// children props, and the render prop pattern.
//
// Instructions:
// 1. Pass data from parent to child via props
// 2. Pass callbacks to enable child-to-parent communication
// 3. Drill props through intermediate components
// 4. Use children to compose components
// 5. Implement a basic render prop pattern
// ============================================================

// --- Types ---
type Theme = "light" | "dark";

type Todo = {
  id: number;
  text: string;
  done: boolean;
};

// TODO 1: Create a StatusBar component.
// Props: { count: number; theme: Theme }
// It should render a <div> with:
//   - Background: theme === "dark" ? "#333" : "#f0f0f0"
//   - Color: theme === "dark" ? "#fff" : "#000"
//   - Padding: 12
// Inside, render: <strong>{count}</strong> items remaining
// function StatusBar({ count, theme }: { count: number; theme: Theme }) { ... }

// TODO 2: Create a TodoItem component.
// Props: { todo: Todo; onToggle: (id: number) => void; onDelete: (id: number) => void }
// It should render an <li> containing:
//   - A <input type="checkbox"> checked={todo.done}, onChange calls onToggle(todo.id)
//   - A <span> with the todo text, struck-through if done (textDecoration: todo.done ? "line-through" : "none")
//   - A <button> "Delete" that calls onDelete(todo.id)
// function TodoItem({ todo, onToggle, onDelete }: ...) { ... }

// TODO 3: Create a TodoList component that drills props down to TodoItem.
// Props: { todos: Todo[]; onToggle: (id: number) => void; onDelete: (id: number) => void; theme: Theme }
// It should render:
//   - <StatusBar> with count = number of todos that are NOT done, and the theme
//   - A <ul> mapping over todos and rendering <TodoItem> for each
// This demonstrates props drilling: App -> TodoList -> TodoItem
// function TodoList({ todos, onToggle, onDelete, theme }: ...) { ... }

// TODO 4: Create a Card component that uses props.children.
// Props: { title: string; children: React.ReactNode }
// It should render:
//   <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16, marginBottom: 16 }}>
//     <h3 style={{ marginTop: 0 }}>{title}</h3>
//     {children}
//   </div>
// function Card({ title, children }: { title: string; children: React.ReactNode }) { ... }

// TODO 5: Create a ThemeToggle component.
// Props: { theme: Theme; onToggleTheme: () => void }
// It should render a <button> that shows "Switch to Dark" if theme is light,
// or "Switch to Light" if theme is dark. Clicking it calls onToggleTheme.
// function ThemeToggle({ theme, onToggleTheme }: ...) { ... }

// TODO 6: Create a DataRenderer component that uses the render prop pattern.
// Props: { data: T[]; render: (item: T, index: number) => React.ReactNode }
// Since we can't use generics directly in JSX easily, type data as any[].
// Props: { data: any[]; render: (item: any, index: number) => React.ReactNode }
// It should render a <ul> where each item is wrapped in an <li> and rendered
// by calling props.render(item, index). Use index as the key.
// function DataRenderer({ data, render }: ...) { ... }

// TODO 7: Create a TodoInput component.
// Props: { onAdd: (text: string) => void }
// It should manage its own local state for the input text (useState).
// Render a <form> with onSubmit that:
//   - Prevents default
//   - Calls onAdd with the trimmed text if not empty
//   - Clears the input
// Inside the form: <input> and <button type="submit">Add</button>
// function TodoInput({ onAdd }: { onAdd: (text: string) => void }) { ... }

export function App() {
  // TODO 8: Set up state in App:
  //   const [todos, setTodos] = useState<Todo[]>(initialTodos)  (define initialTodos with 3 sample items)
  //   const [theme, setTheme] = useState<Theme>("light")
  //
  // Create handler functions:
  //   handleToggle(id: number) - toggles the done property of the matching todo
  //   handleDelete(id: number) - removes the todo with the matching id
  //   handleAdd(text: string)  - adds a new todo with id = Date.now(), text, done: false
  //   toggleTheme()            - switches theme between "light" and "dark"

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Exercise 3: Props and Data Flow</h1>
      {/* TODO 9: Render the following structure:
          <ThemeToggle theme={theme} onToggleTheme={toggleTheme} />
          <Card title="Todo List">
            <TodoInput onAdd={handleAdd} />
            <TodoList todos={todos} onToggle={handleToggle} onDelete={handleDelete} theme={theme} />
          </Card>
          <Card title="Render Props Demo">
            <p>Skills rendered via render prop:</p>
            <DataRenderer
              data={["React", "TypeScript", "CSS"]}
              render={(skill, i) => <span style={{ fontWeight: "bold" }}>{i + 1}. {skill}</span>}
            />
          </Card>
      */}
      <p style={{ color: "gray" }}>Complete the TODOs to see the results here.</p>
    </div>
  );
}
