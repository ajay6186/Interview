// Phase 5 - Solution 03: NgRx Entity Adapter
// Topics: EntityState, createEntityAdapter, adapter.getSelectors(),
//         adapter.addOne/upsertOne/removeOne/setAll

import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Todo entity + TodoState + adapter
// ─────────────────────────────────────────────────────────────────────────────

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

/*
// REAL NgRx Entity setup:
import { EntityState, createEntityAdapter } from '@ngrx/entity';

export interface TodoState extends EntityState<Todo> {
  loading:    boolean;
  error:      string | null;
  selectedId: string | null;
}

export const adapter = createEntityAdapter<Todo>({
  selectId:     (todo) => todo.id,
  sortComparer: (a, b) => {
    const priority = { high: 0, medium: 1, low: 2 };
    return priority[a.priority] - priority[b.priority];
  },
});

// EntityState shape after adapter:
// { ids: string[], entities: Record<string, Todo>, loading, error, selectedId }

export const initialTodoState: TodoState = adapter.getInitialState({
  loading: false, error: null, selectedId: null
});
*/

// ─── Shim entity state (replaces EntityState + adapter in demo) ──────────────
interface TodoEntityState {
  ids:        string[];
  entities:   Record<string, Todo>;
  loading:    boolean;
  error:      string | null;
  selectedId: string | null;
}

const initialTodoState: TodoEntityState = {
  ids: [], entities: {}, loading: false, error: null, selectedId: null,
};

// Adapter-equivalent helper functions
const adapterAddOne = (todo: Todo, state: TodoEntityState): TodoEntityState => ({
  ...state,
  ids:      [...state.ids, todo.id],
  entities: { ...state.entities, [todo.id]: todo },
});

const adapterSetAll = (todos: Todo[], state: TodoEntityState): TodoEntityState => ({
  ...state,
  ids:      todos.map(t => t.id),
  entities: Object.fromEntries(todos.map(t => [t.id, t])),
});

const adapterUpdateOne = (id: string, changes: Partial<Todo>, state: TodoEntityState): TodoEntityState => ({
  ...state,
  entities: { ...state.entities, [id]: { ...state.entities[id], ...changes } },
});

const adapterRemoveOne = (id: string, state: TodoEntityState): TodoEntityState => ({
  ...state,
  ids:      state.ids.filter(i => i !== id),
  entities: Object.fromEntries(Object.entries(state.entities).filter(([k]) => k !== id)),
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Actions (shim)
// ─────────────────────────────────────────────────────────────────────────────

/*
// REAL NgRx actions with @ngrx/entity Update type:
import { Update } from '@ngrx/entity';

export const loadTodos        = createAction('[Todos] Load');
export const loadTodosSuccess = createAction('[Todos] Load Success', props<{ todos: Todo[] }>());
export const loadTodosFailure = createAction('[Todos] Load Failure', props<{ error: string }>());
export const addTodo          = createAction('[Todos] Add',          props<{ title: string; priority: Todo['priority'] }>());
export const addTodoSuccess   = createAction('[Todos] Add Success',  props<{ todo: Todo }>());
export const updateTodo       = createAction('[Todos] Update',       props<{ id: string; changes: Partial<Todo> }>());
export const deleteTodo       = createAction('[Todos] Delete',       props<{ id: string }>());
export const deleteTodoSuccess= createAction('[Todos] Delete Success',props<{ id: string }>());
export const selectTodo       = createAction('[Todos] Select',       props<{ id: string }>());
*/

type TodoAction =
  | { type: 'LOAD_TODOS' }
  | { type: 'LOAD_SUCCESS'; todos: Todo[] }
  | { type: 'LOAD_FAILURE'; error: string }
  | { type: 'ADD';          title: string; priority: Todo['priority'] }
  | { type: 'UPDATE';       id: string;    changes: Partial<Todo> }
  | { type: 'DELETE';       id: string }
  | { type: 'SELECT';       id: string };

// ─────────────────────────────────────────────────────────────────────────────
// 3. Reducer using adapter methods
// ─────────────────────────────────────────────────────────────────────────────

/*
// REAL NgRx reducer:
export const todoReducer = createReducer(
  initialTodoState,
  on(loadTodos,        state          => ({ ...state, loading: true, error: null })),
  on(loadTodosSuccess, (state, { todos }) => adapter.setAll(todos, { ...state, loading: false })),
  on(loadTodosFailure, (state, { error }) => ({ ...state, loading: false, error })),
  on(addTodoSuccess,   (state, { todo })  => adapter.addOne(todo, state)),
  on(updateTodo,       (state, { id, changes }) => adapter.updateOne({ id, changes }, state)),
  on(deleteTodoSuccess,(state, { id }) => adapter.removeOne(id, state)),
  on(selectTodo,       (state, { id }) => ({ ...state, selectedId: id })),
);
*/

function todoReducer(state: TodoEntityState = initialTodoState, action: TodoAction): TodoEntityState {
  switch (action.type) {
    case 'LOAD_TODOS':  return { ...state, loading: true, error: null };
    case 'LOAD_SUCCESS': return adapterSetAll((action as { todos: Todo[] }).todos, { ...state, loading: false });
    case 'LOAD_FAILURE': return { ...state, loading: false, error: (action as { error: string }).error };
    case 'ADD': {
      const a = action as { title: string; priority: Todo['priority'] };
      const todo: Todo = { id: Date.now().toString(), title: a.title, completed: false, priority: a.priority };
      return adapterAddOne(todo, state);
    }
    case 'UPDATE': {
      const a = action as { id: string; changes: Partial<Todo> };
      return adapterUpdateOne(a.id, a.changes, state);
    }
    case 'DELETE':
      return adapterRemoveOne((action as { id: string }).id, state);
    case 'SELECT':
      return { ...state, selectedId: (action as { id: string }).id };
    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Selectors
// ─────────────────────────────────────────────────────────────────────────────

/*
// REAL NgRx selectors:
const { selectAll, selectEntities, selectIds, selectTotal } = adapter.getSelectors();
// adapter.getSelectors() returns memoized selectors that operate on EntityState slice

const selectTodoState = createFeatureSelector<TodoState>('todos');

export const selectAllTodos      = createSelector(selectTodoState, selectAll);
export const selectTodoEntities  = createSelector(selectTodoState, selectEntities);
export const selectTodoCount     = createSelector(selectTodoState, selectTotal);
export const selectLoading       = createSelector(selectTodoState, s => s.loading);
export const selectError         = createSelector(selectTodoState, s => s.error);
export const selectCompletedTodos= createSelector(selectAllTodos, todos => todos.filter(t => t.completed));
export const selectSelectedTodo  = createSelector(
  selectTodoEntities,
  createSelector(selectTodoState, s => s.selectedId),
  (entities, id) => id ? entities[id] ?? null : null
);
*/

// ─────────────────────────────────────────────────────────────────────────────
// Simulated store
// ─────────────────────────────────────────────────────────────────────────────

class SimulatedTodoStore {
  private _state = signal<TodoEntityState>(initialTodoState);
  get state() { return this._state; }

  dispatch(action: TodoAction) {
    this._state.set(todoReducer(this._state(), action));
  }

  selectAll = computed(() => this._state().ids.map(id => this._state().entities[id]));
  selectLoading = computed(() => this._state().loading);
  selectError   = computed(() => this._state().error);
  selectTotal   = computed(() => this._state().ids.length);
  selectCompleted = computed(() => this.selectAll().filter(t => t.completed));
}

const todoStore = new SimulatedTodoStore();

// Seed with some todos
[
  { title: 'Learn NgRx Entity',     priority: 'high'   as const },
  { title: 'Build a Todo App',      priority: 'medium' as const },
  { title: 'Write unit tests',      priority: 'low'    as const },
].forEach(t => todoStore.dispatch({ type: 'ADD', ...t }));

// ─────────────────────────────────────────────────────────────────────────────
// 5. TodoListComponent — full CRUD
// ─────────────────────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  high: '#c62828', medium: '#e65100', low: '#2e7d32',
};

@Component({
  selector: 'app-todo-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="padding:1.5rem; background:#e8f5e9; border-radius:8px; margin-bottom:1rem">
      <h2>Todos
        <small style="font-size:0.75rem; font-weight:normal; margin-left:0.5rem; color:#555">
          ({{ todos().length }} total, {{ completed().length }} done)
        </small>
      </h2>

      <!-- Add todo form -->
      <div style="display:flex; gap:0.5rem; margin-bottom:1rem; flex-wrap:wrap">
        <input [(ngModel)]="newTitle" placeholder="New todo..."
               (keyup.enter)="addTodo()"
               style="flex:1; min-width:180px; padding:0.4rem; border:1px solid #a5d6a7; border-radius:4px" />
        <select [(ngModel)]="newPriority"
                style="padding:0.4rem; border:1px solid #a5d6a7; border-radius:4px">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button (click)="addTodo()"
                style="padding:0.4rem 0.75rem; background:#2e7d32; color:white; border:none; border-radius:4px; cursor:pointer">
          Add
        </button>
      </div>

      <!-- Todo list -->
      <ul style="list-style:none; padding:0; display:flex; flex-direction:column; gap:0.4rem">
        @for (todo of todos(); track todo.id) {
          <li style="display:flex; align-items:center; gap:0.75rem; background:white;
                     padding:0.6rem 0.75rem; border-radius:4px;
                     border-left:4px solid {{ priorityColor(todo.priority) }}">
            <input type="checkbox"
                   [checked]="todo.completed"
                   (change)="toggleComplete(todo)"
                   style="cursor:pointer; width:16px; height:16px" />
            <span [style.text-decoration]="todo.completed ? 'line-through' : 'none'"
                  [style.color]="todo.completed ? '#9e9e9e' : 'inherit'"
                  style="flex:1">
              {{ todo.title }}
            </span>
            <span [style.color]="priorityColor(todo.priority)"
                  style="font-size:0.75rem; font-weight:bold; text-transform:uppercase">
              {{ todo.priority }}
            </span>
            <button (click)="deleteTodo(todo.id)"
                    style="background:#ef5350; color:white; border:none; border-radius:3px;
                           padding:0.2rem 0.5rem; cursor:pointer; font-size:0.8rem">
              Delete
            </button>
          </li>
        }
      </ul>

      @if (todos().length === 0) {
        <p style="text-align:center; color:#888; padding:1rem">No todos yet. Add one above!</p>
      }

      <!-- NgRx Entity reference -->
      <div style="margin-top:1rem; background:#f1f8e9; padding:0.75rem; border-radius:4px; font-size:0.85rem">
        <strong>EntityState shape:</strong>
        <code style="display:block; margin-top:0.25rem; font-size:0.8rem; white-space:pre">{{ entityShape }}</code>
      </div>
    </div>
  `,
})
export class TodoListComponent implements OnInit {
  todos     = todoStore.selectAll;
  completed = todoStore.selectCompleted;
  newTitle    = '';
  newPriority: Todo['priority'] = 'medium';

  entityShape = `{
  ids: ['1', '2', '3'],            // ordered array of keys
  entities: {                      // normalized map
    '1': { id:'1', title:'...', completed:false, priority:'high' },
    '2': { id:'2', title:'...', completed:true,  priority:'low'  },
  },
  loading: false,
  error: null,
}`;

  ngOnInit() {
    // Real: this.store.dispatch(loadTodos());
    // Effects would handle the HTTP call and dispatch loadTodosSuccess/Failure
  }

  addTodo() {
    if (this.newTitle.trim()) {
      todoStore.dispatch({ type: 'ADD', title: this.newTitle.trim(), priority: this.newPriority });
      this.newTitle = '';
    }
  }

  toggleComplete(todo: Todo) {
    todoStore.dispatch({ type: 'UPDATE', id: todo.id, changes: { completed: !todo.completed } });
  }

  deleteTodo(id: string) {
    todoStore.dispatch({ type: 'DELETE', id });
  }

  priorityColor(p: string): string { return PRIORITY_COLORS[p] ?? '#666'; }
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, TodoListComponent],
  template: `
    <div style="font-family:sans-serif; max-width:700px; margin:2rem auto; padding:0 1rem">
      <h1>Phase 5 – NgRx Entity Adapter</h1>
      <app-todo-list />
      <div style="padding:1rem; background:#f5f5f5; border-radius:8px; font-size:0.85rem">
        <strong>NgRx Entity Cheat Sheet:</strong>
        <ul>
          <li><code>createEntityAdapter&lt;T&gt;()</code> — creates adapter with helper methods</li>
          <li><code>adapter.getInitialState(extra)</code> — initial state with ids/entities + extras</li>
          <li><code>adapter.addOne(entity, state)</code> — add one entity</li>
          <li><code>adapter.setAll(entities, state)</code> — replace all entities</li>
          <li><code>adapter.updateOne(&#123;id, changes&#125;, state)</code> — partial update</li>
          <li><code>adapter.upsertOne(entity, state)</code> — add or replace</li>
          <li><code>adapter.removeOne(id, state)</code> — delete by id</li>
          <li><code>adapter.getSelectors()</code> — returns selectAll, selectEntities, selectIds, selectTotal</li>
          <li>Normalized state avoids array scanning — O(1) entity lookup by id</li>
        </ul>
      </div>
    </div>
  `,
})
export class AppComponent {}
