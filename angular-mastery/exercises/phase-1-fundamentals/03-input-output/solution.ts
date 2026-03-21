import { Component, Input, Output, EventEmitter } from '@angular/core';

// ============================================================
// Solution 1.3 — @Input / @Output (Data Flow)
// ============================================================

type Theme = 'light' | 'dark';
type Todo  = { id: number; text: string; done: boolean };
type User  = { id: number; name: string; email: string };

const initialTodos: Todo[] = [
  { id: 1, text: 'Learn Angular templates', done: true  },
  { id: 2, text: 'Practice @Input/@Output', done: false },
  { id: 3, text: 'Build a real project',    done: false },
];

const users: User[] = [
  { id: 1, name: 'Alice Johnson', email: 'alice@ex.com' },
  { id: 2, name: 'Bob Smith',     email: 'bob@ex.com'   },
  { id: 3, name: 'Carol W.',      email: 'carol@ex.com' },
];

// SOLUTION 1: StatusBar — receives data from parent
@Component({
  selector: 'app-status-bar',
  standalone: true,
  template: `
    <div [style.background]="theme === 'dark' ? '#333' : '#f0f0f0'"
         [style.color]="theme === 'dark' ? '#fff' : '#000'"
         style="padding: 10px 14px; border-radius: 4px; margin-bottom: 12px;">
      <strong>{{ count }}</strong> tasks remaining
    </div>
  `,
})
class StatusBarComponent {
  @Input() count: number = 0;
  @Input() theme: Theme  = 'light';
}

// SOLUTION 2: TodoItem — receives todo, emits events up
@Component({
  selector: 'app-todo-item',
  standalone: true,
  template: `
    <li style="display: flex; align-items: center; gap: 8px; padding: 6px 0; list-style: none;">
      <input type="checkbox" [checked]="todo.done" (change)="toggled.emit(todo.id)" />
      <span [style.textDecoration]="todo.done ? 'line-through' : 'none'"
            [style.color]="todo.done ? '#999' : 'inherit'" style="flex: 1;">
        {{ todo.text }}
      </span>
      <button (click)="deleted.emit(todo.id)"
              style="background: #e74c3c; color: white; border: none; border-radius: 4px;
                     padding: 3px 8px; cursor: pointer;">
        Delete
      </button>
    </li>
  `,
})
class TodoItemComponent {
  @Input({ required: true }) todo!: Todo;
  @Output() toggled = new EventEmitter<number>();
  @Output() deleted = new EventEmitter<number>();
}

// SOLUTION 3: ThemeToggle — child communicates theme choice to parent
@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  template: `
    <button (click)="themeChange.emit(theme === 'light' ? 'dark' : 'light')"
            [style.background]="theme === 'dark' ? '#fff' : '#333'"
            [style.color]="theme === 'dark' ? '#333' : '#fff'"
            style="border: none; border-radius: 4px; padding: 8px 16px; cursor: pointer;">
      Switch to {{ theme === 'light' ? 'Dark' : 'Light' }}
    </button>
  `,
})
class ThemeToggleComponent {
  @Input()  theme: Theme = 'light';
  @Output() themeChange = new EventEmitter<Theme>();
}

// SOLUTION 4: CounterChild — two-way binding pattern
@Component({
  selector: 'app-counter-child',
  standalone: true,
  template: `
    <div style="display: flex; align-items: center; gap: 8px;">
      <button (click)="valueChange.emit(value - 1)" style="width: 32px;">−</button>
      <span style="min-width: 32px; text-align: center; font-size: 1.2rem;">{{ value }}</span>
      <button (click)="valueChange.emit(value + 1)" style="width: 32px;">+</button>
    </div>
  `,
})
class CounterChildComponent {
  @Input()  value: number = 0;
  @Output() valueChange = new EventEmitter<number>();
}

// SOLUTION 5: UserList — emits selected user
@Component({
  selector: 'app-user-list',
  standalone: true,
  template: `
    <ul style="list-style: none; padding: 0;">
      @for (user of users; track user.id) {
        <li>
          <button (click)="userSelected.emit(user)"
                  style="display: block; width: 100%; text-align: left; background: none;
                         border: 1px solid #ddd; border-radius: 4px; padding: 8px 12px;
                         margin-bottom: 4px; cursor: pointer;">
            <strong>{{ user.name }}</strong> — {{ user.email }}
          </button>
        </li>
      }
    </ul>
  `,
})
class UserListComponent {
  users = users;
  @Output() userSelected = new EventEmitter<User>();
}

// ROOT COMPONENT — holds all state, wires everything together
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    StatusBarComponent,
    TodoItemComponent,
    ThemeToggleComponent,
    CounterChildComponent,
    UserListComponent,
  ],
  template: `
    <div [style.background]="theme === 'dark' ? '#1a1a2e' : '#fff'"
         [style.color]="theme === 'dark' ? '#eee' : '#333'"
         style="font-family: sans-serif; max-width: 600px; margin: 0 auto;
                padding: 20px; min-height: 100vh;">

      <h1>Solution 1.3 — @Input / @Output</h1>

      <app-theme-toggle [theme]="theme" (themeChange)="theme = $event" />

      <h2>Todo List</h2>
      <app-status-bar [count]="remaining" [theme]="theme" />
      <ul style="padding: 0;">
        @for (todo of todos; track todo.id) {
          <app-todo-item
            [todo]="todo"
            (toggled)="onToggle($event)"
            (deleted)="onDelete($event)" />
        }
      </ul>

      <hr />
      <h2>Two-Way Counter</h2>
      <p>Value: {{ counterVal }}</p>
      <app-counter-child [value]="counterVal" (valueChange)="counterVal = $event" />

      <hr />
      <h2>User Selection</h2>
      <app-user-list (userSelected)="selectedUser = $event" />
      @if (selectedUser) {
        <p>Selected: <strong>{{ selectedUser.name }}</strong> ({{ selectedUser.email }})</p>
      }
    </div>
  `,
})
export class AppComponent {
  theme: Theme   = 'light';
  todos: Todo[]  = [...initialTodos];
  counterVal     = 0;
  selectedUser: User | null = null;

  get remaining() { return this.todos.filter((t) => !t.done).length; }

  onToggle(id: number) {
    this.todos = this.todos.map((t) => t.id === id ? { ...t, done: !t.done } : t);
  }
  onDelete(id: number) {
    this.todos = this.todos.filter((t) => t.id !== id);
  }
}
