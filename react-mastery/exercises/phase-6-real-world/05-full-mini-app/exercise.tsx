import React, { useState, useEffect, useCallback, useMemo } from "react";

// ============================================================
// Exercise: Full Mini App - Todo Application
// ============================================================
// Build a complete, polished Todo application that combines
// everything you have learned: state management, effects,
// memoization, component composition, and localStorage
// persistence. This is the capstone exercise.
//
// Instructions:
// 1. Define the Todo type
// 2. Build a TodoInput component for adding new todos
// 3. Build a TodoItem component with toggle, delete, and edit
// 4. Build a TodoList component to render all todos
// 5. Build a TodoFilter component (all, active, completed)
// 6. Build a TodoStats component showing counts
// 7. Wire everything together in App with useState
// 8. Persist todos to localStorage
// ============================================================

// TODO 1: Define the Todo type
// - id: string (use Date.now().toString() for simplicity)
// - text: string
// - completed: boolean
// - createdAt: number (timestamp)
type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
};

// TODO 2: Create a useTodos custom hook for localStorage persistence
// - Initialize state by reading from localStorage key "react-mastery-todos"
// - If nothing in localStorage, start with an empty array
// - Whenever todos change, write them to localStorage
// - Return [todos, setTodos]
function useTodos(): [Todo[], React.Dispatch<React.SetStateAction<Todo[]>>] {
  const [todos, setTodos] = useState<Todo[]>([]);

  // TODO: Read from localStorage on mount

  // TODO: Write to localStorage when todos change

  return [todos, setTodos];
}

// TODO 3: Create a TodoInput component
// - Controlled text input + "Add" button
// - Pressing Enter or clicking "Add" should add a new todo
// - Clear the input after adding
// - Don't allow adding empty todos (trim whitespace)
// - Accept prop: onAdd (text: string) => void
function TodoInput({ onAdd }: { onAdd: (text: string) => void }) {
  return (
    <div>
      <input type="text" placeholder="Add a new todo..." />
      <button>Add</button>
    </div>
  );
}

// TODO 4: Create a TodoItem component
// - Display the todo text with a checkbox for completion
// - Completed todos should have strikethrough text
// - "Delete" button to remove the todo
// - "Edit" button that toggles inline editing mode
// - In edit mode: show an input pre-filled with todo text + "Save"/"Cancel" buttons
// - Accept props:
//   todo: Todo
//   onToggle: (id: string) => void
//   onDelete: (id: string) => void
//   onEdit: (id: string, newText: string) => void
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
  return (
    <div>
      <input type="checkbox" />
      <span>{todo.text}</span>
      <button>Edit</button>
      <button>Delete</button>
    </div>
  );
}

// TODO 5: Create a TodoList component
// - Accept props: todos (Todo[]), onToggle, onDelete, onEdit
// - Render a TodoItem for each todo
// - Show a message when there are no todos
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
  return <div>Todo list placeholder</div>;
}

// TODO 6: Create a TodoFilter component
// - Accept props: filter ("all" | "active" | "completed"), onFilterChange
// - Render three buttons: All, Active, Completed
// - Highlight the currently active filter
type FilterType = "all" | "active" | "completed";

function TodoFilter({
  filter,
  onFilterChange,
}: {
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}) {
  return (
    <div>
      <button>All</button>
      <button>Active</button>
      <button>Completed</button>
    </div>
  );
}

// TODO 7: Create a TodoStats component
// - Accept props: todos (Todo[])
// - Display: total count, active count, completed count
// - Show a progress bar for completion percentage
function TodoStats({ todos }: { todos: Todo[] }) {
  return <div>Stats placeholder</div>;
}

// TODO 8: Wire everything together in App
// - Use the useTodos hook for state + persistence
// - Manage filter state
// - Implement handler functions: addTodo, toggleTodo, deleteTodo, editTodo
// - Use useMemo to compute filtered todos based on the active filter
// - Add a "Clear Completed" button
// - Render all components in a clean layout
export function App() {
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Exercise: Full Mini App - Todo</h1>
      <p>Build a complete Todo application combining all React concepts.</p>
    </div>
  );
}
