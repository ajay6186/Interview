import React, { useState } from "react";
import {
  configureStore,
  createSlice,
  PayloadAction,
  nanoid,
} from "@reduxjs/toolkit";
import { Provider, useSelector, useDispatch } from "react-redux";

// ============================================================
// Exercise: Actions and Dispatch
// ============================================================
// Build a full-featured todo list using Redux Toolkit. Practice
// using PayloadAction for typed actions, prepare callbacks for
// auto-generating IDs, and dispatching from UI event handlers.
//
// Instructions:
// 1. Define Todo and TodosState types
// 2. Create a todosSlice with addTodo (with prepare callback),
//    toggleTodo, removeTodo, and clearCompleted reducers
// 3. Configure the store and derive types
// 4. Build a TodoInput component for adding todos
// 5. Build a TodoList component with filter tabs (all, active,
//    completed) and action buttons
// 6. Wire everything up with Provider
// ============================================================

// TODO 1: Define a Todo type
// - id: string
// - text: string
// - completed: boolean
// - createdAt: string (ISO date string)

// TODO 2: Define TodosState type
// - todos: Todo[]
// - filter: "all" | "active" | "completed"

// TODO 3: Create initialState for the todos slice
// - todos: empty array
// - filter: "all"

// TODO 4: Create a todosSlice using createSlice
// name: "todos"
// reducers:
//   a) addTodo: Use a prepare callback to accept just a `text` string,
//      then return { payload: { id: nanoid(), text, completed: false, createdAt: new Date().toISOString() } }
//      The reducer itself pushes the prepared payload onto state.todos
//   b) toggleTodo: PayloadAction<string> (the id)
//      Find the todo by id and flip its `completed` boolean
//   c) removeTodo: PayloadAction<string> (the id)
//      Filter out the todo with the matching id
//   d) clearCompleted: no payload
//      Filter out all todos where completed === true
//   e) setFilter: PayloadAction<"all" | "active" | "completed">
//      Set state.filter to the payload

// TODO 5: Export action creators from the slice

// TODO 6: Configure the store
// const store = configureStore({ reducer: { todos: todosSlice.reducer } });

// TODO 7: Derive RootState and AppDispatch types

// TODO 8: Build a TodoInput component
// - Local state for the input text
// - On submit, dispatch addTodo(text) and clear the input
// - Don't allow adding empty todos
function TodoInput() {
  return (
    <form style={{ marginBottom: "16px" }}>
      <input
        type="text"
        placeholder="Add a todo..."
        style={{ padding: "8px", width: "250px" }}
      />
      <button type="submit" style={{ marginLeft: "8px", padding: "8px 16px" }}>
        Add
      </button>
    </form>
  );
}

// TODO 9: Build a FilterTabs component
// - Three buttons: All, Active, Completed
// - Highlight the active filter
// - Dispatch setFilter on click
function FilterTabs() {
  return (
    <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
      <button>All</button>
      <button>Active</button>
      <button>Completed</button>
    </div>
  );
}

// TODO 10: Build a TodoList component
// - useSelector to get todos and the current filter
// - Filter todos based on the current filter value
// - Render each todo with:
//   a) A checkbox or click handler to dispatch toggleTodo
//   b) The text (with line-through style if completed)
//   c) A delete button to dispatch removeTodo
// - A "Clear Completed" button that dispatches clearCompleted
// - Show a count of remaining active todos
function TodoList() {
  return (
    <div>
      <p>No todos to display (implement TodoList)</p>
    </div>
  );
}

// TODO 11: Wrap in Provider
export function App() {
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Exercise: Actions and Dispatch</h1>
      <TodoInput />
      <FilterTabs />
      <TodoList />
    </div>
  );
}
