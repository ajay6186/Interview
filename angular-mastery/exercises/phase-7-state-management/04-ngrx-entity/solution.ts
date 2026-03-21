import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { EntityState, createEntityAdapter } from '@ngrx/entity';
import { createAction, createReducer, createSelector, createFeatureSelector,
         on, props, Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';

// ============================================================
// Solution 7.4 — NgRx Entity
// ============================================================

// SOLUTION 1: Entity adapter
interface Todo { id: string; text: string; completed: boolean; }

const adapter = createEntityAdapter<Todo>();

export interface TodosState extends EntityState<Todo> {
  filter: 'all' | 'active' | 'completed';
}

const initialState: TodosState = adapter.getInitialState({ filter: 'all' });

// SOLUTION 2: Actions & Reducer
export const addTodo    = createAction('[Todos] Add',    props<{ todo: Todo }>());
export const removeTodo = createAction('[Todos] Remove', props<{ id: string }>());
export const toggleTodo = createAction('[Todos] Toggle', props<{ id: string }>());
export const setFilter  = createAction('[Todos] Set Filter', props<{ filter: 'all' | 'active' | 'completed' }>());

export const todosReducer = createReducer(
  initialState,
  on(addTodo,    (state, { todo })     => adapter.addOne(todo, state)),
  on(removeTodo, (state, { id })       => adapter.removeOne(id, state)),
  on(toggleTodo, (state, { id }) => {
    const existing = state.entities[id];
    if (!existing) return state;
    return adapter.updateOne({ id, changes: { completed: !existing.completed } }, state);
  }),
  on(setFilter, (state, { filter }) => ({ ...state, filter })),
);

// SOLUTION 3: Selectors
const selectTodosState = createFeatureSelector<TodosState>('todos');
const { selectAll, selectTotal } = adapter.getSelectors(selectTodosState);
const selectFilter          = createSelector(selectTodosState, s => s.filter);
const selectActiveTodos     = createSelector(selectAll, todos => todos.filter(t => !t.completed));
const selectCompletedTodos  = createSelector(selectAll, todos => todos.filter(t => t.completed));
const selectFilteredTodos   = createSelector(selectAll, selectFilter, (todos, filter) =>
  filter === 'all' ? todos : filter === 'active' ? todos.filter(t => !t.completed) : todos.filter(t => t.completed)
);

// SOLUTION 4: TodosComponent
@Component({
  selector: 'app-todos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>NgRx Entity — Todos</h3>
      <input #inp placeholder="New todo..." (keydown.enter)="add(inp.value); inp.value=''" />
      <button (click)="add(inp.value); inp.value=''">Add</button>
      @for (todo of todos(); track todo.id) {
        <div style="display:flex;align-items:center;gap:8px;padding:4px 0;">
          <input type="checkbox" [checked]="todo.completed" (change)="toggle(todo.id)" />
          <span [style.textDecoration]="todo.completed ? 'line-through' : 'none'">{{ todo.text }}</span>
          <button (click)="remove(todo.id)">×</button>
        </div>
      }
      <p>Total: {{ total() }}</p>
    </section>
  `,
})
class TodosComponent {
  store = inject(Store);
  todos = toSignal(this.store.select(selectFilteredTodos), { initialValue: [] as Todo[] });
  total = toSignal(this.store.select(selectTotal), { initialValue: 0 });

  add(text: string) {
    if (!text.trim()) return;
    this.store.dispatch(addTodo({ todo: { id: crypto.randomUUID(), text: text.trim(), completed: false } }));
  }
  toggle(id: string) { this.store.dispatch(toggleTodo({ id })); }
  remove(id: string) { this.store.dispatch(removeTodo({ id })); }
}

// SOLUTION 5: FilteredTodosComponent
@Component({
  selector: 'app-filtered-todos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Filter Todos</h3>
      @for (f of filters; track f) {
        <button (click)="setFilter(f)"
                [style.fontWeight]="filter() === f ? 'bold' : 'normal'"
                style="margin-right:8px">
          {{ f | titlecase }}
        </button>
      }
      <p>Active: {{ activeTodos().length }} | Completed: {{ completedTodos().length }}</p>
    </section>
  `,
})
class FilteredTodosComponent {
  store          = inject(Store);
  filters        = ['all', 'active', 'completed'] as const;
  filter         = toSignal(this.store.select(selectFilter),         { initialValue: 'all' as const });
  activeTodos    = toSignal(this.store.select(selectActiveTodos),    { initialValue: [] as Todo[] });
  completedTodos = toSignal(this.store.select(selectCompletedTodos), { initialValue: [] as Todo[] });

  setFilter(f: 'all' | 'active' | 'completed') { this.store.dispatch(setFilter({ filter: f })); }
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TodosComponent, FilteredTodosComponent],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Solution 7.4 — NgRx Entity</h1>
      <p><em>Requires: provideStore(&#123; todos: todosReducer &#125;) in main.ts</em></p>
      <app-filtered-todos />
      <app-todos />
    </div>
  `,
})
export class AppComponent {}
