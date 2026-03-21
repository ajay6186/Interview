// Phase 5 - Exercise 03: NgRx Entity Adapter
// Topics: EntityState, createEntityAdapter, adapter.getSelectors(),
//         adapter.addOne/upsertOne/removeOne/setAll
//
// Setup: npm install @ngrx/entity
// Docs: https://ngrx.io/guide/entity

import { Component } from '@angular/core';

// ─────────────────────────────────────────────
// TODO 1: Define Todo entity + TodoState using EntityAdapter
//
// Import EntityState, createEntityAdapter from '@ngrx/entity'
//
// Define:
//   export interface Todo {
//     id: string;         // required — used as entity ID
//     title: string;
//     completed: boolean;
//     priority: 'low' | 'medium' | 'high';
//   }
//
//   export interface TodoState extends EntityState<Todo> {
//     loading: boolean;
//     error: string | null;
//     selectedId: string | null;
//   }
//
//   export const adapter = createEntityAdapter<Todo>();
//   // Optional: custom selectId and sortComparer:
//   // createEntityAdapter<Todo>({
//   //   selectId: (todo) => todo.id,
//   //   sortComparer: (a, b) => a.title.localeCompare(b.title),
//   // })
//
//   export const initialTodoState: TodoState = adapter.getInitialState({
//     loading: false, error: null, selectedId: null
//   });
// ─────────────────────────────────────────────

// TODO 1: Todo interface + adapter + initial state

// ─────────────────────────────────────────────
// TODO 2: Define Todo actions
//
// CRUD + async variants:
// - loadTodos             (no payload)
// - loadTodosSuccess      ({ todos: Todo[] })
// - loadTodosFailure      ({ error: string })
// - addTodo               ({ title: string; priority: Todo['priority'] })
// - addTodoSuccess        ({ todo: Todo })
// - updateTodo            ({ id: string; changes: Partial<Todo> })
// - updateTodoSuccess     ({ todo: Update<Todo> })  ← Update from '@ngrx/entity'
// - deleteTodo            ({ id: string })
// - deleteTodoSuccess     ({ id: string })
// - selectTodo            ({ id: string })
// ─────────────────────────────────────────────

// TODO 2: Todo actions

// ─────────────────────────────────────────────
// TODO 3: TodoReducer using adapter methods
//
// Use adapter methods inside createReducer:
//   on(loadTodosSuccess, (state, { todos }) => adapter.setAll(todos, { ...state, loading: false }))
//   on(addTodoSuccess,   (state, { todo  }) => adapter.addOne(todo, state))
//   on(updateTodoSuccess,(state, { todo  }) => adapter.updateOne(todo, state))
//   on(deleteTodoSuccess,(state, { id   }) => adapter.removeOne(id, state))
//
// Other useful adapter methods:
//   adapter.upsertOne(todo, state)       — add or replace
//   adapter.upsertMany(todos, state)     — bulk upsert
//   adapter.removeMany([id1, id2], state)
//   adapter.removeAll(state)
//   adapter.map(updateFn, state)         — transform all entities
// ─────────────────────────────────────────────

// TODO 3: todoReducer

// ─────────────────────────────────────────────
// TODO 4: TodoSelectors using adapter.getSelectors()
//
// const { selectAll, selectEntities, selectIds, selectTotal } = adapter.getSelectors();
//
// const selectTodoState = createFeatureSelector<TodoState>('todos');
//
// export const selectAllTodos    = createSelector(selectTodoState, selectAll);
// export const selectTodoEntities= createSelector(selectTodoState, selectEntities);
// export const selectTodoCount   = createSelector(selectTodoState, selectTotal);
// export const selectLoading     = createSelector(selectTodoState, s => s.loading);
// export const selectError       = createSelector(selectTodoState, s => s.error);
// export const selectSelectedTodo = createSelector(
//   selectTodoEntities,
//   createSelector(selectTodoState, s => s.selectedId),
//   (entities, id) => id ? entities[id] : null
// );
// export const selectCompletedTodos = createSelector(
//   selectAllTodos, todos => todos.filter(t => t.completed)
// );
// ─────────────────────────────────────────────

// TODO 4: Todo selectors

// ─────────────────────────────────────────────
// TODO 5: TodoListComponent — full CRUD
//
// - Inject Store
// - On init: dispatch loadTodos()
// - Display list of todos with checkboxes and delete buttons
// - Add form to create new todo (title + priority select)
// - Clicking checkbox → dispatch updateTodo({ id, changes: { completed: !current } })
// - Clicking delete  → dispatch deleteTodo({ id })
// - Show todo count and completed count in header
// - Use @for with trackBy
// ─────────────────────────────────────────────

// TODO 5: TodoListComponent
// @Component({ ... })
// export class TodoListComponent { }

// ─────────────────────────────────────────────
// TODO 6: Add TodoListComponent to AppComponent
// ─────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO 6: import TodoListComponent
  ],
  template: `
    <h1>NgRx Entity Adapter Exercise</h1>
    <!-- TODO 6: render TodoListComponent -->
  `,
})
export class AppComponent {}
