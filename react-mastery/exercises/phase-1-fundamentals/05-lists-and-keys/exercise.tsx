import React, { useState } from "react";

// ============================================================
// Exercise 5: Lists and Keys
// ============================================================
// In this exercise you will learn about rendering lists with
// .map(), the importance of key props, nested lists, filtering,
// sorting, and dynamically adding/removing items.
//
// Instructions:
// 1. Render an array of items using .map() with keys
// 2. Render nested (grouped) lists
// 3. Filter a list based on criteria
// 4. Sort a list and update dynamically
// 5. Add and remove items from a list
// ============================================================

// --- Types ---
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

// --- Initial Data ---
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

// --- Helper ---
const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

const priorityColor: Record<Priority, string> = {
  high: "#e74c3c",
  medium: "#f39c12",
  low: "#27ae60",
};

// TODO 1: Create a TaskItem component.
// Props: { task: Task; onToggle: (id: number) => void; onDelete: (id: number) => void }
// It should render an <li> containing:
//   - A checkbox: <input type="checkbox" checked={task.completed} onChange={...} />
//   - A <span> showing the task title with line-through if completed
//   - A priority badge: <span> with background from priorityColor, white text,
//     borderRadius 4, padding "2px 6px", fontSize 11, showing task.priority uppercase
//   - A <span> showing the category in parentheses, gray color
//   - A <button> "Remove" that calls onDelete
// Use a key-friendly structure (key will be set by the parent).
// function TaskItem({ task, onToggle, onDelete }: ...) { ... }

// TODO 2: Create a TaskInputForm component.
// Props: { onAdd: (title: string, category: string, priority: Priority) => void }
// It should manage local state for title (string), category (string), and priority (Priority).
// Render a <form> with:
//   - <input> for title (placeholder "Task title...")
//   - <select> for category with options: "Development", "Testing", "Documentation"
//   - <select> for priority with options: "low", "medium", "high"
//   - <button type="submit">Add Task</button>
// On submit: prevent default, validate title is not empty, call onAdd, reset title.
// function TaskInputForm({ onAdd }: ...) { ... }

// TODO 3: Create a FilterBar component.
// Props: {
//   filterMode: FilterMode;
//   onFilterChange: (mode: FilterMode) => void;
//   sortField: SortField;
//   onSortFieldChange: (field: SortField) => void;
//   sortDirection: SortDirection;
//   onToggleSortDirection: () => void;
// }
// Render a <div> with two groups:
//   Filter group: 3 buttons for "All", "Active", "Completed" - highlight the active one
//     with a different background color.
//   Sort group: a <select> with options "title", "priority", "category"
//     and a <button> showing the direction arrow (sortDirection === "asc" ? "↑" : "↓")
// function FilterBar({ ... }: ...) { ... }

// TODO 4: Create a GroupedTaskList component that renders nested lists.
// Props: { tasks: Task[]; onToggle: (id: number) => void; onDelete: (id: number) => void }
// Group the tasks by category (use a reduce or a Map).
// For each group, render:
//   <div key={category}>
//     <h3>{category} ({tasksInGroup.length})</h3>
//     <ul>
//       {tasksInGroup.map(task => <TaskItem key={task.id} ... />)}
//     </ul>
//   </div>
// function GroupedTaskList({ tasks, onToggle, onDelete }: ...) { ... }

// TODO 5: Create a TaskStats component.
// Props: { tasks: Task[] }
// Calculate and display:
//   - Total tasks
//   - Completed tasks
//   - Tasks by priority (count of high, medium, low)
// Render as a simple stats bar with inline styles.
// function TaskStats({ tasks }: { tasks: Task[] }) { ... }

export function App() {
  // TODO 6: Set up state:
  //   const [tasks, setTasks] = useState<Task[]>(initialTasks);
  //   const [filterMode, setFilterMode] = useState<FilterMode>("all");
  //   const [sortField, setSortField] = useState<SortField>("priority");
  //   const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  //
  // Create derived data (filter then sort):
  //   1. Filter tasks based on filterMode:
  //      "all" -> all tasks, "active" -> !completed, "completed" -> completed
  //   2. Sort the filtered tasks by sortField and sortDirection:
  //      - For "title" and "category": use localeCompare
  //      - For "priority": use priorityOrder mapping
  //      - Reverse for "desc"
  //
  // Create handler functions:
  //   handleAdd(title, category, priority) -> adds new task with id = Date.now()
  //   handleToggle(id) -> toggles completed on the matching task
  //   handleDelete(id) -> removes the matching task
  //   toggleSortDirection() -> flips between "asc" and "desc"

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 700, margin: "0 auto", padding: 20 }}>
      <h1>Exercise 5: Lists and Keys</h1>

      {/* TODO 7: Render the full task manager:
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
            {processedTasks.map(task => (
              <TaskItem key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} />
            ))}
          </ul>
          <hr />
          <h2>Grouped by Category</h2>
          <GroupedTaskList tasks={processedTasks} onToggle={handleToggle} onDelete={handleDelete} />
      */}
      <p style={{ color: "gray" }}>Complete the TODOs to see the results here.</p>
    </div>
  );
}
