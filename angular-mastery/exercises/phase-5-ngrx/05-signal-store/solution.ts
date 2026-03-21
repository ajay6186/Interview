// Phase 5 - Solution 05: NgRx Signal Store
// Topics: signalStore, withState, withComputed, withMethods, withHooks, patchState

import { Component, signal, computed, inject, Injectable, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ─────────────────────────────────────────────────────────────────────────────
// NOTE: Real imports from '@ngrx/signals':
// import {
//   signalStore, withState, withComputed, withMethods, withHooks, patchState
// } from '@ngrx/signals';
// import { withEntities, setAll, addEntity, updateEntity, removeEntity } from '@ngrx/signals/entities';
// import { rxMethod } from '@ngrx/signals/rxjs-interop';
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// 1. CounterStore
// ─────────────────────────────────────────────────────────────────────────────

/*
// REAL @ngrx/signals CounterStore:
export const CounterStore = signalStore(
  { providedIn: 'root' },     // ← optional: makes it globally available

  withState({ count: 0, step: 1 }),

  withComputed(({ count, step }) => ({
    doubled:      computed(() => count() * 2),
    canDecrement: computed(() => count() > 0),
    nextValue:    computed(() => count() + step()),
  })),

  withMethods(store => ({
    increment():           void { patchState(store, s => ({ count: s.count + s.step })); },
    decrement():           void { patchState(store, s => ({ count: s.count - s.step })); },
    reset():               void { patchState(store, { count: 0 }); },
    setStep(step: number): void { patchState(store, { step }); },
  }))
);
// Usage: const store = inject(CounterStore); → store.count(), store.increment()
*/

// Simulated CounterStore
@Injectable()
export class CounterStore {
  private _count = signal(0);
  private _step  = signal(1);

  readonly count       = this._count.asReadonly();
  readonly step        = this._step.asReadonly();
  readonly doubled     = computed(() => this._count() * 2);
  readonly canDecrement= computed(() => this._count() > 0);
  readonly nextValue   = computed(() => this._count() + this._step());

  increment()           { this._count.update(c => c + this._step()); }
  decrement()           { this._count.update(c => c - this._step()); }
  reset()               { this._count.set(0); }
  setStep(step: number) { this._step.set(step); }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. TodoSignalStore
// ─────────────────────────────────────────────────────────────────────────────

interface TodoItem { id: string; title: string; completed: boolean; }
type TodoFilter = 'all' | 'active' | 'completed';

/*
// REAL @ngrx/signals TodoSignalStore:
export const TodoSignalStore = signalStore(
  withState<{ todos: TodoItem[]; filter: TodoFilter; loading: boolean }>({
    todos: [], filter: 'all', loading: false,
  }),

  withComputed(({ todos, filter }) => ({
    filteredTodos:  computed(() => {
      const f = filter();
      if (f === 'active')    return todos().filter(t => !t.completed);
      if (f === 'completed') return todos().filter(t =>  t.completed);
      return todos();
    }),
    totalCount:     computed(() => todos().length),
    completedCount: computed(() => todos().filter(t => t.completed).length),
    activeCount:    computed(() => todos().filter(t => !t.completed).length),
  })),

  withMethods(store => ({
    addTodo(title: string) {
      patchState(store, s => ({
        todos: [...s.todos, { id: Date.now().toString(), title, completed: false }],
      }));
    },
    toggleTodo(id: string) {
      patchState(store, s => ({
        todos: s.todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t),
      }));
    },
    deleteTodo(id: string) {
      patchState(store, s => ({ todos: s.todos.filter(t => t.id !== id) }));
    },
    setFilter(filter: TodoFilter) { patchState(store, { filter }); },
    async loadTodos() {
      patchState(store, { loading: true });
      // await http.get(...)
      patchState(store, { loading: false });
    },
  })),

  withHooks({
    onInit(store) {
      store.loadTodos();
      effect(() => console.log('Active todos:', store.activeCount()));
    },
    onDestroy(_store) { console.log('TodoStore destroyed'); },
  })
);
*/

@Injectable()
export class TodoSignalStore {
  private _todos  = signal<TodoItem[]>([
    { id: '1', title: 'Learn NgRx Signals', completed: false },
    { id: '2', title: 'Build Signal Store', completed: true  },
    { id: '3', title: 'Write tests',         completed: false },
  ]);
  private _filter  = signal<TodoFilter>('all');
  private _loading = signal(false);

  readonly todos         = this._todos.asReadonly();
  readonly filter        = this._filter.asReadonly();
  readonly loading       = this._loading.asReadonly();
  readonly filteredTodos = computed(() => {
    const f = this._filter();
    if (f === 'active')    return this._todos().filter(t => !t.completed);
    if (f === 'completed') return this._todos().filter(t =>  t.completed);
    return this._todos();
  });
  readonly totalCount     = computed(() => this._todos().length);
  readonly completedCount = computed(() => this._todos().filter(t =>  t.completed).length);
  readonly activeCount    = computed(() => this._todos().filter(t => !t.completed).length);

  addTodo(title: string) {
    this._todos.update(todos => [...todos, { id: Date.now().toString(), title, completed: false }]);
  }

  toggleTodo(id: string) {
    this._todos.update(todos => todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  }

  deleteTodo(id: string) {
    this._todos.update(todos => todos.filter(t => t.id !== id));
  }

  setFilter(filter: TodoFilter) { this._filter.set(filter); }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3 & 1. CounterComponent using inject(CounterStore)
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-counter-signal',
  standalone: true,
  providers: [CounterStore],   // scoped to this component tree
  imports: [FormsModule],
  template: `
    <div style="padding:1.5rem; background:#e8f5e9; border-radius:8px; margin-bottom:1rem">
      <h3>CounterStore (NgRx Signals)</h3>

      <div style="font-size:3rem; font-weight:bold; text-align:center; margin:0.75rem 0;
                  color:#1b5e20">{{ store.count() }}</div>

      <div style="display:flex; gap:0.5rem; justify-content:center; margin-bottom:1rem; flex-wrap:wrap">
        <button (click)="store.decrement()"
                [disabled]="!store.canDecrement()"
                style="padding:0.4rem 1rem; background:#c62828; color:white; border:none; border-radius:4px; cursor:pointer">
          −{{ store.step() }}
        </button>
        <button (click)="store.increment()"
                style="padding:0.4rem 1rem; background:#2e7d32; color:white; border:none; border-radius:4px; cursor:pointer">
          +{{ store.step() }}
        </button>
        <button (click)="store.reset()"
                style="padding:0.4rem 1rem; background:#555; color:white; border:none; border-radius:4px; cursor:pointer">
          Reset
        </button>
      </div>

      <div style="display:flex; align-items:center; gap:0.5rem; justify-content:center; margin-bottom:0.75rem">
        <label>Step:</label>
        <input type="range" min="1" max="10" [value]="store.step()"
               (input)="store.setStep(+$any($event.target).value)"
               style="width:120px" />
        <span>{{ store.step() }}</span>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; font-size:0.9rem">
        <div style="background:white; padding:0.4rem; border-radius:4px">Doubled: <strong>{{ store.doubled() }}</strong></div>
        <div style="background:white; padding:0.4rem; border-radius:4px">Next: <strong>{{ store.nextValue() }}</strong></div>
      </div>
    </div>
  `,
})
export class CounterSignalComponent {
  store = inject(CounterStore);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. TodoSignalComponent
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-todo-signal',
  standalone: true,
  providers: [TodoSignalStore],
  imports: [FormsModule, CommonModule],
  template: `
    <div style="padding:1.5rem; background:#e3f2fd; border-radius:8px; margin-bottom:1rem">
      <h3>TodoSignalStore</h3>

      <div style="display:flex; gap:0.5rem; margin-bottom:0.75rem">
        <input [(ngModel)]="newTitle" placeholder="New todo..."
               (keyup.enter)="addTodo()"
               style="flex:1; padding:0.4rem; border:1px solid #90caf9; border-radius:4px" />
        <button (click)="addTodo()"
                style="padding:0.4rem 0.75rem; background:#1565c0; color:white; border:none; border-radius:4px; cursor:pointer">
          Add
        </button>
      </div>

      <!-- Filter buttons -->
      <div style="display:flex; gap:0.4rem; margin-bottom:0.75rem">
        @for (f of filters; track f) {
          <button (click)="store.setFilter(f)"
                  [style.background]="store.filter() === f ? '#1565c0' : '#e0e0e0'"
                  [style.color]="store.filter() === f ? 'white' : '#333'"
                  style="padding:0.25rem 0.6rem; border:none; border-radius:3px; cursor:pointer; font-size:0.85rem">
            {{ f }} ({{ getCount(f) }})
          </button>
        }
      </div>

      <!-- Todo list -->
      <ul style="list-style:none; padding:0; display:flex; flex-direction:column; gap:0.4rem">
        @for (todo of store.filteredTodos(); track todo.id) {
          <li style="display:flex; align-items:center; gap:0.5rem; background:white;
                     padding:0.5rem 0.75rem; border-radius:4px">
            <input type="checkbox" [checked]="todo.completed"
                   (change)="store.toggleTodo(todo.id)" style="cursor:pointer" />
            <span [style.text-decoration]="todo.completed ? 'line-through' : 'none'"
                  [style.color]="todo.completed ? '#9e9e9e' : 'inherit'" style="flex:1">
              {{ todo.title }}
            </span>
            <button (click)="store.deleteTodo(todo.id)"
                    style="background:#ef5350; color:white; border:none; border-radius:3px;
                           padding:0.2rem 0.5rem; cursor:pointer; font-size:0.8rem">
              Delete
            </button>
          </li>
        }
      </ul>

      @if (store.filteredTodos().length === 0) {
        <p style="color:#888; font-style:italic; text-align:center">No todos here!</p>
      }

      <p style="font-size:0.85rem; color:#666; margin-top:0.5rem">
        {{ store.activeCount() }} active · {{ store.completedCount() }} done · {{ store.totalCount() }} total
      </p>
    </div>
  `,
})
export class TodoSignalComponent {
  store    = inject(TodoSignalStore);
  newTitle = '';
  filters: TodoFilter[] = ['all', 'active', 'completed'];

  addTodo() {
    if (this.newTitle.trim()) {
      this.store.addTodo(this.newTitle.trim());
      this.newTitle = '';
    }
  }

  getCount(f: TodoFilter): number {
    if (f === 'all')       return this.store.totalCount();
    if (f === 'active')    return this.store.activeCount();
    return this.store.completedCount();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. TimerStore with withHooks
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class TimerStore implements OnDestroy {
  private _elapsed = signal(0);
  private _running = signal(false);
  private _intervalId: ReturnType<typeof setInterval> | null = null;

  readonly elapsed = this._elapsed.asReadonly();
  readonly running = this._running.asReadonly();

  start() {
    if (!this._running()) {
      this._running.set(true);
      this._intervalId = setInterval(() => this._elapsed.update(e => e + 1), 1000);
    }
  }

  stop() {
    if (this._running() && this._intervalId) {
      clearInterval(this._intervalId);
      this._running.set(false);
      this._intervalId = null;
    }
  }

  reset() {
    this.stop();
    this._elapsed.set(0);
  }

  ngOnDestroy() {
    // Equivalent to withHooks.onDestroy
    if (this._intervalId) clearInterval(this._intervalId);
  }
}

@Component({
  selector: 'app-timer',
  standalone: true,
  providers: [TimerStore],
  template: `
    <div style="padding:1.5rem; background:#fce4ec; border-radius:8px; margin-bottom:1rem">
      <h3>TimerStore (withHooks demo)</h3>
      <div style="font-size:2.5rem; font-weight:bold; text-align:center; margin:0.75rem 0; font-family:monospace">
        {{ formatTime(store.elapsed()) }}
      </div>
      <div style="display:flex; gap:0.5rem; justify-content:center">
        <button (click)="store.start()" [disabled]="store.running()"
                style="padding:0.4rem 0.75rem; background:#2e7d32; color:white; border:none; border-radius:4px; cursor:pointer">
          Start
        </button>
        <button (click)="store.stop()" [disabled]="!store.running()"
                style="padding:0.4rem 0.75rem; background:#c62828; color:white; border:none; border-radius:4px; cursor:pointer">
          Stop
        </button>
        <button (click)="store.reset()"
                style="padding:0.4rem 0.75rem; background:#555; color:white; border:none; border-radius:4px; cursor:pointer">
          Reset
        </button>
      </div>
      <p style="font-size:0.85rem; color:#666; text-align:center; margin-top:0.5rem">
        Real: use <code>withHooks.onInit</code> to start interval; <code>onDestroy</code> to clear it.
      </p>
    </div>
  `,
})
export class TimerComponent {
  store = inject(TimerStore);
  formatTime(s: number): string {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, CounterSignalComponent, TodoSignalComponent, TimerComponent],
  template: `
    <div style="font-family:sans-serif; max-width:800px; margin:2rem auto; padding:0 1rem">
      <h1>Phase 5 – NgRx Signal Store</h1>
      <app-counter-signal />
      <app-todo-signal />
      <app-timer />
      <div style="padding:1rem; background:#f5f5f5; border-radius:8px; font-size:0.85rem">
        <strong>NgRx Signal Store Cheat Sheet:</strong>
        <ul>
          <li><code>signalStore(withState(&#123;&#125;), withComputed(...), withMethods(...), withHooks(...))</code></li>
          <li><code>patchState(store, &#123; key: value &#125;)</code> — partial state update</li>
          <li><code>patchState(store, s => &#123; count: s.count + 1 &#125;)</code> — updater function</li>
          <li>State properties are exposed as computed signals: <code>store.count()</code></li>
          <li><code>withHooks.onInit(store)</code> — runs when store is first injected</li>
          <li><code>withHooks.onDestroy(store)</code> — cleanup when component/injector destroyed</li>
          <li><code>withEntities&lt;T&gt;()</code> — normalized entity state (like NgRx Entity)</li>
          <li><code>&#123; providedIn: 'root' &#125;</code> as first arg → global singleton store</li>
          <li>No <code>providers:[Store]</code> — <code>inject()</code> the store class directly</li>
        </ul>
      </div>
    </div>
  `,
})
export class AppComponent {}
