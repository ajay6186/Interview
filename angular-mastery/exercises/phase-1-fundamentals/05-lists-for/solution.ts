import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

// ============================================================
// Solution 1.5 — Lists & @for
// ============================================================

type Priority      = 'low' | 'medium' | 'high';
type Task          = { id: number; title: string; category: string; priority: Priority; completed: boolean };
type FilterMode    = 'all' | 'active' | 'done';

const initialTasks: Task[] = [
  { id: 1, title: 'Set up Angular project',  category: 'Dev',  priority: 'high',   completed: true  },
  { id: 2, title: 'Design component tree',   category: 'Dev',  priority: 'high',   completed: false },
  { id: 3, title: 'Write unit tests',        category: 'Test', priority: 'medium', completed: false },
  { id: 4, title: 'Review pull requests',    category: 'Dev',  priority: 'medium', completed: false },
  { id: 5, title: 'Update documentation',    category: 'Docs', priority: 'low',    completed: true  },
  { id: 6, title: 'Fix CSS layout issues',   category: 'Dev',  priority: 'high',   completed: false },
  { id: 7, title: 'Write integration tests', category: 'Test', priority: 'medium', completed: false },
  { id: 8, title: 'Create API docs',         category: 'Docs', priority: 'low',    completed: false },
];

const priorityColor: Record<Priority, string> = {
  high: '#e74c3c', medium: '#f39c12', low: '#27ae60',
};
const priorityRank: Record<Priority, number> = {
  high: 0, medium: 1, low: 2,
};

// SOLUTION 1: TaskItem using @for context variables
@Component({
  selector: 'app-task-item',
  standalone: true,
  template: `
    <li style="display: flex; align-items: center; gap: 8px; padding: 8px 0;
               border-bottom: 1px solid #eee; list-style: none;">
      <input type="checkbox" [checked]="task.completed"
             (change)="toggled.emit(task.id)" />
      <span style="flex: 1;"
            [style.textDecoration]="task.completed ? 'line-through' : 'none'"
            [style.color]="task.completed ? '#999' : '#000'">
        {{ task.title }}
      </span>
      <span [style.background]="priorityColor[task.priority]"
            style="color: white; border-radius: 4px; padding: 2px 6px;
                   font-size: 11px; text-transform: uppercase; font-weight: bold;">
        {{ task.priority }}
      </span>
      <span style="color: gray; font-size: 13px;">({{ task.category }})</span>
      <button (click)="deleted.emit(task.id)"
              style="background: #e74c3c; color: white; border: none;
                     border-radius: 4px; padding: 3px 8px; cursor: pointer; font-size: 12px;">
        Remove
      </button>
    </li>
  `,
})
class TaskItemComponent {
  @Input({ required: true }) task!: Task;
  @Output() toggled = new EventEmitter<number>();
  @Output() deleted = new EventEmitter<number>();
  priorityColor = priorityColor;
}

// SOLUTION 2: TaskStats
@Component({
  selector: 'app-task-stats',
  standalone: true,
  template: `
    <div style="display: flex; gap: 16px; flex-wrap: wrap; padding: 12px;
                background: #f8f9fa; border-radius: 8px; margin-bottom: 16px;">
      <div><strong>Total:</strong> {{ total }}</div>
      <div><strong>Done:</strong> {{ completed }}/{{ total }}</div>
      <div [style.color]="priorityColor.high"><strong>High:</strong> {{ high }}</div>
      <div [style.color]="priorityColor.medium"><strong>Medium:</strong> {{ medium }}</div>
      <div [style.color]="priorityColor.low"><strong>Low:</strong> {{ low }}</div>
    </div>
  `,
})
class TaskStatsComponent {
  @Input() tasks: Task[] = [];
  priorityColor = priorityColor;
  get total()     { return this.tasks.length; }
  get completed() { return this.tasks.filter((t) => t.completed).length; }
  get high()      { return this.tasks.filter((t) => t.priority === 'high').length; }
  get medium()    { return this.tasks.filter((t) => t.priority === 'medium').length; }
  get low()       { return this.tasks.filter((t) => t.priority === 'low').length; }
}

// SOLUTION 3: TaskInputForm
@Component({
  selector: 'app-task-input',
  standalone: true,
  imports: [FormsModule],
  template: `
    <form (ngSubmit)="submit()" style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;">
      <input [(ngModel)]="title" name="title" placeholder="Task title…"
             style="flex: 1; min-width: 180px; padding: 8px; border-radius: 4px; border: 1px solid #ccc;" />
      <select [(ngModel)]="category" name="category"
              style="padding: 8px; border-radius: 4px; border: 1px solid #ccc;">
        <option value="Dev">Dev</option>
        <option value="Test">Test</option>
        <option value="Docs">Docs</option>
      </select>
      <select [(ngModel)]="priority" name="priority"
              style="padding: 8px; border-radius: 4px; border: 1px solid #ccc;">
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <button type="submit"
              style="padding: 8px 16px; background: #3498db; color: white;
                     border: none; border-radius: 4px; cursor: pointer;">
        Add Task
      </button>
    </form>
  `,
})
class TaskInputFormComponent {
  @Output() added = new EventEmitter<{ title: string; category: string; priority: Priority }>();
  title    = '';
  category = 'Dev';
  priority: Priority = 'medium';

  submit() {
    if (!this.title.trim()) return;
    this.added.emit({ title: this.title.trim(), category: this.category, priority: this.priority });
    this.title = '';
  }
}

// SOLUTION 4: GroupedTaskList — nested @for
@Component({
  selector: 'app-grouped-task-list',
  standalone: true,
  imports: [TaskItemComponent],
  template: `
    <div>
      @for (entry of groupEntries; track entry.category) {
        <div style="margin-bottom: 16px;">
          <h3 style="border-bottom: 2px solid #3498db; padding-bottom: 4px;">
            {{ entry.category }} ({{ entry.tasks.length }})
          </h3>
          <ul style="padding: 0;">
            @for (task of entry.tasks; track task.id) {
              <app-task-item [task]="task"
                             (toggled)="toggled.emit($event)"
                             (deleted)="deleted.emit($event)" />
            } @empty {
              <p style="color: gray;">No tasks in this category.</p>
            }
          </ul>
        </div>
      }
    </div>
  `,
})
class GroupedTaskListComponent {
  @Input()  tasks: Task[] = [];
  @Output() toggled = new EventEmitter<number>();
  @Output() deleted = new EventEmitter<number>();

  get groupEntries() {
    const map = this.tasks.reduce<Record<string, Task[]>>((acc, t) => {
      acc[t.category] = acc[t.category] ? [...acc[t.category], t] : [t];
      return acc;
    }, {});
    return Object.keys(map).sort().map((cat) => ({ category: cat, tasks: map[cat] }));
  }
}

// SOLUTION 5: FilterBar
@Component({
  selector: 'app-filter-bar',
  standalone: true,
  template: `
    <div style="display: flex; gap: 4px; margin-bottom: 16px;">
      @for (mode of modes; track mode.value) {
        <button (click)="filterChange.emit(mode.value)"
                [style.background]="filter === mode.value ? '#3498db' : '#fff'"
                [style.color]="filter === mode.value ? '#fff' : '#333'"
                [style.fontWeight]="filter === mode.value ? 'bold' : 'normal'"
                style="padding: 6px 14px; border: 1px solid #ccc;
                       border-radius: 4px; cursor: pointer;">
          {{ mode.label }}
        </button>
      }
    </div>
  `,
})
class FilterBarComponent {
  @Input()  filter: FilterMode = 'all';
  @Output() filterChange = new EventEmitter<FilterMode>();
  modes = [
    { value: 'all'    as FilterMode, label: 'All'    },
    { value: 'active' as FilterMode, label: 'Active' },
    { value: 'done'   as FilterMode, label: 'Done'   },
  ];
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    TaskItemComponent,
    TaskStatsComponent,
    TaskInputFormComponent,
    GroupedTaskListComponent,
    FilterBarComponent,
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
      <h1>Solution 1.5 — Lists &amp; @for</h1>

      <app-task-stats [tasks]="tasks" />
      <app-task-input (added)="onAdd($event)" />
      <app-filter-bar [filter]="filter" (filterChange)="filter = $event" />

      <h2>Flat List ({{ displayTasks.length }} tasks)</h2>
      <ul style="padding: 0;">
        @for (task of displayTasks; track task.id) {
          <app-task-item [task]="task"
                         (toggled)="onToggle($event)"
                         (deleted)="onDelete($event)" />
        } @empty {
          <p style="color: gray;">No tasks match the current filter.</p>
        }
      </ul>

      <hr />
      <h2>Grouped by Category</h2>
      <app-grouped-task-list [tasks]="displayTasks"
                             (toggled)="onToggle($event)"
                             (deleted)="onDelete($event)" />
    </div>
  `,
})
export class AppComponent {
  tasks: Task[]  = [...initialTasks];
  filter: FilterMode = 'all';

  get displayTasks(): Task[] {
    const filtered = this.tasks.filter((t) =>
      this.filter === 'all' ? true : this.filter === 'done' ? t.completed : !t.completed
    );
    return [...filtered].sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
  }

  onAdd({ title, category, priority }: { title: string; category: string; priority: Priority }) {
    this.tasks = [...this.tasks, { id: Date.now(), title, category, priority, completed: false }];
  }
  onToggle(id: number) {
    this.tasks = this.tasks.map((t) => t.id === id ? { ...t, completed: !t.completed } : t);
  }
  onDelete(id: number) {
    this.tasks = this.tasks.filter((t) => t.id !== id);
  }
}
