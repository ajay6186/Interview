import React, { useState } from "react";
import {
  configureStore,
  createSlice,
  PayloadAction,
  nanoid,
} from "@reduxjs/toolkit";
import { Provider, useSelector, useDispatch } from "react-redux";

// ============================================================
// Solution: Actions and Dispatch
// ============================================================
// A full-featured todo list using Redux Toolkit with typed
// PayloadAction, prepare callbacks for ID generation, and
// filtered views.
// ============================================================

// 1. Define types
type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
};

type FilterValue = "all" | "active" | "completed";

type TodosState = {
  todos: Todo[];
  filter: FilterValue;
};

// 2. Initial state
const initialState: TodosState = {
  todos: [],
  filter: "all",
};

// 3. Create the todos slice
const todosSlice = createSlice({
  name: "todos",
  initialState,
  reducers: {
    addTodo: {
      reducer(state, action: PayloadAction<Todo>) {
        state.todos.push(action.payload);
      },
      prepare(text: string) {
        return {
          payload: {
            id: nanoid(),
            text,
            completed: false,
            createdAt: new Date().toISOString(),
          },
        };
      },
    },
    toggleTodo(state, action: PayloadAction<string>) {
      const todo = state.todos.find((t) => t.id === action.payload);
      if (todo) {
        todo.completed = !todo.completed;
      }
    },
    removeTodo(state, action: PayloadAction<string>) {
      state.todos = state.todos.filter((t) => t.id !== action.payload);
    },
    clearCompleted(state) {
      state.todos = state.todos.filter((t) => !t.completed);
    },
    setFilter(state, action: PayloadAction<FilterValue>) {
      state.filter = action.payload;
    },
  },
});

// 4. Export action creators
const { addTodo, toggleTodo, removeTodo, clearCompleted, setFilter } =
  todosSlice.actions;

// 5. Configure the store
const store = configureStore({
  reducer: {
    todos: todosSlice.reducer,
  },
});

// 6. Derive types
type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;

// 7. TodoInput component
function TodoInput() {
  const [text, setText] = useState("");
  const dispatch = useDispatch<AppDispatch>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (trimmed) {
      dispatch(addTodo(trimmed));
      setText("");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "16px" }}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a todo..."
        style={{ padding: "8px", width: "250px" }}
      />
      <button type="submit" style={{ marginLeft: "8px", padding: "8px 16px" }}>
        Add
      </button>
    </form>
  );
}

// 8. FilterTabs component
function FilterTabs() {
  const currentFilter = useSelector((state: RootState) => state.todos.filter);
  const dispatch = useDispatch<AppDispatch>();

  const filters: FilterValue[] = ["all", "active", "completed"];

  return (
    <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
      {filters.map((f) => (
        <button
          key={f}
          onClick={() => dispatch(setFilter(f))}
          style={{
            padding: "6px 14px",
            fontWeight: currentFilter === f ? "bold" : "normal",
            backgroundColor: currentFilter === f ? "#4a90d9" : "#e0e0e0",
            color: currentFilter === f ? "#fff" : "#333",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {f.charAt(0).toUpperCase() + f.slice(1)}
        </button>
      ))}
    </div>
  );
}

// 9. TodoList component
function TodoList() {
  const todos = useSelector((state: RootState) => state.todos.todos);
  const filter = useSelector((state: RootState) => state.todos.filter);
  const dispatch = useDispatch<AppDispatch>();

  const filteredTodos = todos.filter((todo) => {
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  });

  const activeCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <div>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {filteredTodos.map((todo) => (
          <li
            key={todo.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "8px 0",
              borderBottom: "1px solid #eee",
            }}
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => dispatch(toggleTodo(todo.id))}
            />
            <span
              style={{
                flex: 1,
                textDecoration: todo.completed ? "line-through" : "none",
                color: todo.completed ? "#999" : "#333",
              }}
            >
              {todo.text}
            </span>
            <button
              onClick={() => dispatch(removeTodo(todo.id))}
              style={{
                background: "#e74c3c",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                padding: "4px 10px",
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      {filteredTodos.length === 0 && (
        <p style={{ color: "#999" }}>No todos to show.</p>
      )}

      <div
        style={{
          marginTop: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>
          {activeCount} active, {completedCount} completed
        </span>
        {completedCount > 0 && (
          <button
            onClick={() => dispatch(clearCompleted())}
            style={{
              padding: "6px 14px",
              background: "#e67e22",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Clear Completed
          </button>
        )}
      </div>
    </div>
  );
}

// 10. App wrapped in Provider
export function App() {
  return (
    <Provider store={store}>
      <div style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: "500px" }}>
        <h1>Exercise: Actions and Dispatch</h1>
        <TodoInput />
        <FilterTabs />
        <TodoList />
      </div>
    </Provider>
  );
}
