import { Component, Injectable, inject, signal, computed, effect,
         Input, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';

// ============================================================
// Solution 8.1 — Full-Featured Todo App
// ============================================================

type Filter = 'all' | 'active' | 'completed';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

// TodoService with signals and localStorage persistence
@Injectable({ providedIn: 'root' })
class TodoService {
  private _items = signal<Todo[]>(
    JSON.parse(localStorage.getItem('todos') ?? '[]').map((t: Todo) => ({
      ...t, createdAt: new Date(t.createdAt)
    }))
  );
  private _filter = signal<Filter>('all');

  items     = this._items.asReadonly();
  filter    = this._filter.asReadonly();
  total     = computed(() => this._items().length);
  active    = computed(() => this._items().filter(t => !t.completed).length);
  completed = computed(() => this._items().filter(t => t.completed).length);

  filtered = computed(() => {
    const f = this._filter();
    return f === 'all' ? this._items()
      : f === 'active' ? this._items().filter(t => !t.completed)
      : this._items().filter(t => t.completed);
  });

  constructor() {
    effect(() => localStorage.setItem('todos', JSON.stringify(this._items())));
  }

  add(text: string) {
    this._items.update(items => [
      ...items, { id: crypto.randomUUID(), text, completed: false, createdAt: new Date() }
    ]);
  }
  remove(id: string)     { this._items.update(items => items.filter(t => t.id !== id)); }
  toggle(id: string)     { this._items.update(items => items.map(t => t.id === id ? { ...t, completed: !t.completed } : t)); }
  update(id: string, text: string) { this._items.update(items => items.map(t => t.id === id ? { ...t, text } : t)); }
  clearCompleted()       { this._items.update(items => items.filter(t => !t.completed)); }
  setFilter(f: Filter)   { this._filter.set(f); }
}

// AddTodoFormComponent
@Component({
  selector: 'app-add-todo-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form (ngSubmit)="submit()" style="display:flex;gap:8px;margin-bottom:16px;">
      <input [formControl]="ctrl" placeholder="What needs to be done?"
             style="flex:1;padding:8px;border:1px solid #ccc;border-radius:4px;font-size:1rem;" />
      <button type="submit" [disabled]="ctrl.invalid"
              style="padding:8px 16px;background:#007bff;color:#fff;border:none;border-radius:4px;cursor:pointer;">
        Add
      </button>
    </form>
  `,
})
class AddTodoFormComponent {
  private todos = inject(TodoService);
  ctrl = new FormControl('', [Validators.required, Validators.minLength(1)]);

  submit() {
    if (this.ctrl.valid && this.ctrl.value?.trim()) {
      this.todos.add(this.ctrl.value.trim());
      this.ctrl.reset();
    }
  }
}

// TodoItemComponent
@Component({
  selector: 'app-todo-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display:flex;align-items:center;gap:8px;padding:8px;border-bottom:1px solid #eee;">
      <input type="checkbox" [checked]="todo.completed" (change)="todos.toggle(todo.id)" />
      @if (editing) {
        <input #editInput [value]="todo.text"
               (blur)="save(editInput.value)"
               (keydown.enter)="save(editInput.value)"
               (keydown.escape)="editing = false"
               style="flex:1;padding:4px;" />
      } @else {
        <span [style.textDecoration]="todo.completed ? 'line-through' : 'none'"
              [style.color]="todo.completed ? '#999' : '#333'"
              style="flex:1;cursor:pointer;"
              (dblclick)="editing = true">
          {{ todo.text }}
        </span>
      }
      <button (click)="todos.remove(todo.id)"
              style="background:none;border:none;color:#e74c3c;cursor:pointer;font-size:1.2rem;">×</button>
    </div>
  `,
})
class TodoItemComponent {
  @Input() todo!: Todo;
  todos   = inject(TodoService);
  editing = false;

  save(text: string) {
    if (text.trim()) this.todos.update(this.todo.id, text.trim());
    this.editing = false;
  }
}

// FilterBarComponent
@Component({
  selector: 'app-filter-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display:flex;gap:8px;margin:8px 0;">
      @for (f of filters; track f) {
        <button (click)="todos.setFilter(f)"
                [style.fontWeight]="todos.filter() === f ? 'bold' : 'normal'"
                [style.borderBottom]="todos.filter() === f ? '2px solid #007bff' : '2px solid transparent'"
                style="background:none;border:none;cursor:pointer;padding:4px 8px;">
          {{ f | titlecase }}
        </button>
      }
      @if (todos.completed() > 0) {
        <button (click)="todos.clearCompleted()"
                style="margin-left:auto;background:none;border:none;color:#e74c3c;cursor:pointer;">
          Clear Completed
        </button>
      }
    </div>
  `,
})
class FilterBarComponent {
  todos   = inject(TodoService);
  filters: Filter[] = ['all', 'active', 'completed'];
}

// StatsComponent
@Component({
  selector: 'app-stats',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display:flex;gap:16px;padding:8px 0;color:#666;font-size:0.9rem;">
      <span>Total: <strong>{{ todos.total() }}</strong></span>
      <span>Active: <strong style="color:#007bff">{{ todos.active() }}</strong></span>
      <span>Completed: <strong style="color:#28a745">{{ todos.completed() }}</strong></span>
    </div>
  `,
})
class StatsComponent {
  todos = inject(TodoService);
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AddTodoFormComponent, TodoItemComponent, FilterBarComponent, StatsComponent],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color:#007bff;">Todo App</h1>
      <app-add-todo-form />
      <app-filter-bar />
      @for (todo of todos.filtered(); track todo.id) {
        <app-todo-item [todo]="todo" />
      }
      @if (!todos.filtered().length) {
        <p style="text-align:center;color:#999;padding:20px;">
          {{ todos.total() === 0 ? 'No todos yet. Add one above!' : 'No todos match this filter.' }}
        </p>
      }
      <app-stats />
    </div>
  `,
})
export class AppComponent {
  todos = inject(TodoService);
}
