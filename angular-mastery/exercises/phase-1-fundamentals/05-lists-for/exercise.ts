import { Component } from '@angular/core';

// ============================================================
// Exercise 1.5 — Lists & @for
// ============================================================
// Topics:
//   • @for (item of items; track item.id) { }   — new control flow
//   • track expression — required, like React's key prop
//   • Loop context variables: $index $first $last $even $odd $count
//   • @empty block — shown when array is empty
//   • *ngFor="let item of items; trackBy: fn"    — classic directive
//   • Nested @for — grouped/hierarchical lists
//   • Filtering, sorting and deriving display arrays
// ============================================================

type Priority = 'low' | 'medium' | 'high';
type Task = {
  id: number;
  title: string;
  category: string;
  priority: Priority;
  completed: boolean;
};

const initialTasks: Task[] = [
  { id: 1, title: 'Set up Angular project',    category: 'Dev',  priority: 'high',   completed: true  },
  { id: 2, title: 'Design component tree',     category: 'Dev',  priority: 'high',   completed: false },
  { id: 3, title: 'Write unit tests',          category: 'Test', priority: 'medium', completed: false },
  { id: 4, title: 'Review pull requests',      category: 'Dev',  priority: 'medium', completed: false },
  { id: 5, title: 'Update documentation',      category: 'Docs', priority: 'low',    completed: true  },
  { id: 6, title: 'Fix CSS layout issues',     category: 'Dev',  priority: 'high',   completed: false },
  { id: 7, title: 'Write integration tests',   category: 'Test', priority: 'medium', completed: false },
  { id: 8, title: 'Create API docs',           category: 'Docs', priority: 'low',    completed: false },
];

// ---------------------------------------------------------------------------
// TODO 1: TaskItemComponent
// ---------------------------------------------------------------------------
// Create selector='app-task-item'.
// @Input({ required: true }) task!: Task
// @Output() toggled = new EventEmitter<number>()
// @Output() deleted = new EventEmitter<number>()
// Template: flex row with checkbox, task title (strike-through if completed),
//   a priority badge (colour from priorityColor record), and a Remove button.

// ---------------------------------------------------------------------------
// TODO 2: TaskStatsComponent
// ---------------------------------------------------------------------------
// Create selector='app-task-stats'.
// @Input() tasks: Task[] = []
// Compute in the class: total, completed, highCount, mediumCount, lowCount
// Template: a flex row of stat boxes.

// ---------------------------------------------------------------------------
// TODO 3: TaskInputFormComponent
// ---------------------------------------------------------------------------
// Create selector='app-task-input'.
// Local state: title = '', category = 'Dev', priority: Priority = 'medium'
// @Output() added = new EventEmitter<{ title: string; category: string; priority: Priority }>()
// Template: a form (ngSubmit) with text input, two selects, and an Add button.
// Import FormsModule for [(ngModel)].

// ---------------------------------------------------------------------------
// TODO 4: GroupedTaskListComponent
// ---------------------------------------------------------------------------
// Create selector='app-grouped-task-list'.
// @Input() tasks: Task[] = []
// @Output() toggled = new EventEmitter<number>()
// @Output() deleted = new EventEmitter<number>()
// In the class, group tasks by category using reduce().
// Template: nested @for — outer loop over category keys,
//   inner loop renders <app-task-item> for each task.

// ---------------------------------------------------------------------------
// TODO 5: FilterBarComponent
// ---------------------------------------------------------------------------
// Create selector='app-filter-bar'.
// @Input()  filter: 'all' | 'active' | 'done' = 'all'
// @Output() filterChange = new EventEmitter<'all' | 'active' | 'done'>()
// Template: three buttons (All / Active / Done) styled as tabs.

// ---------------------------------------------------------------------------
// ROOT COMPONENT
// ---------------------------------------------------------------------------
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  template: `
    <div style="font-family: sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 1.5 — Lists &amp; @for</h1>
      <!-- TODO 6: add all components, manage state (tasks, filter),
           derive filteredTasks from tasks + filter, render everything. -->
    </div>
  `,
})
export class AppComponent {}
