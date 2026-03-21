import { Component } from '@angular/core';

// ============================================================
// Exercise 7.4 — NgRx Entity
// ============================================================
// Topics:
//   • EntityState<T>
//   • createEntityAdapter
//   • adapter.addOne / removeOne / updateOne / setAll
//   • adapter.getSelectors()
//   • Memoized selectors for filtered views
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: Todo Entity Adapter
// ---------------------------------------------------------------------------
// Define a Todo interface and create an entity adapter:
//   interface Todo { id: string; text: string; completed: boolean; }
//   const adapter = createEntityAdapter<Todo>();
//   export interface TodosState extends EntityState<Todo> { filter: 'all' | 'active' | 'completed' }
//   const initialState = adapter.getInitialState({ filter: 'all' })
//
// import { EntityState, createEntityAdapter } from '@ngrx/entity';

// ---------------------------------------------------------------------------
// TODO 2: Todos Reducer
// ---------------------------------------------------------------------------
// Create actions: addTodo, removeTodo, toggleTodo, setFilter.
// Create todosReducer using adapter methods:
//   - addTodo: adapter.addOne(action.todo, state)
//   - removeTodo: adapter.removeOne(action.id, state)
//   - toggleTodo: adapter.updateOne({ id, changes: { completed: !current } }, state)
//   - setFilter: set state.filter
//
// export const todosReducer = createReducer(initialState, ...);

// ---------------------------------------------------------------------------
// TODO 3: Selectors with adapter.getSelectors()
// ---------------------------------------------------------------------------
// Use adapter.getSelectors() to generate:
//   - selectAll — all todos
//   - selectTotal — count of todos
//   - selectById — select by id
// Create additional selectors:
//   - selectActiveTodos — filter completed: false
//   - selectCompletedTodos — filter completed: true
//
// const { selectAll, selectTotal } = adapter.getSelectors(selectTodosState);

// ---------------------------------------------------------------------------
// TODO 4: TodosComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-todos'.
// Inject Store. Use selectors with toSignal().
// Show input to add a todo.
// List all todos with a checkbox to toggle and a delete button.
// Dispatch actions on user interaction.
//
// @Component({ selector: 'app-todos', standalone: true, ... })
// export class TodosComponent { ... }

// ---------------------------------------------------------------------------
// TODO 5: FilteredTodosComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-filtered-todos'.
// Inject Store.
// Show filter buttons: All / Active / Completed.
// Dispatch setFilter action.
// Display the filtered todo count using memoized selectors.
//
// @Component({ selector: 'app-filtered-todos', standalone: true, ... })
// export class FilteredTodosComponent { ... }

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO: Add TodosComponent and FilteredTodosComponent
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 7.4 — NgRx Entity</h1>
      <!-- TODO: render components -->
    </div>
  `,
})
export class AppComponent {}
