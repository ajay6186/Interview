// Phase 5 - Exercise 05: NgRx Signal Store
// Topics: signalStore, withState, withComputed, withMethods, withHooks, patchState
//
// Setup: npm install @ngrx/signals
// Docs: https://ngrx.io/guide/signals/signal-store

import { Component } from '@angular/core';

// ─────────────────────────────────────────────
// TODO 1: Create CounterStore using signalStore
//
// Import from '@ngrx/signals':
//   signalStore, withState, withComputed, withMethods, patchState
//
// export const CounterStore = signalStore(
//   withState({ count: 0, step: 1 }),
//
//   withComputed(({ count, step }) => ({
//     doubled:    computed(() => count() * 2),
//     canDecrement: computed(() => count() > 0),
//     nextValue:    computed(() => count() + step()),
//   })),
//
//   withMethods((store) => ({
//     increment():        void { patchState(store, s => ({ count: s.count + s.step })); },
//     decrement():        void { patchState(store, s => ({ count: s.count - s.step })); },
//     reset():            void { patchState(store, { count: 0 }); },
//     setStep(step: number): void { patchState(store, { step }); },
//   }))
// );
// ─────────────────────────────────────────────

// TODO 1: CounterStore
// export const CounterStore = signalStore(...)

// ─────────────────────────────────────────────
// TODO 2: Create TodoSignalStore with full CRUD + filtering
//
// State:
//   interface Todo { id: string; title: string; completed: boolean; }
//   interface TodoState { todos: Todo[]; filter: 'all' | 'active' | 'completed'; loading: boolean; }
//
// export const TodoSignalStore = signalStore(
//   withState<TodoState>({ todos: [], filter: 'all', loading: false }),
//
//   withComputed(({ todos, filter }) => ({
//     filteredTodos: computed(() => {
//       const f = filter();
//       if (f === 'active')    return todos().filter(t => !t.completed);
//       if (f === 'completed') return todos().filter(t =>  t.completed);
//       return todos();
//     }),
//     totalCount:     computed(() => todos().length),
//     completedCount: computed(() => todos().filter(t => t.completed).length),
//   })),
//
//   withMethods((store) => ({
//     addTodo(title: string) { ... },
//     toggleTodo(id: string) { ... },
//     deleteTodo(id: string) { ... },
//     setFilter(filter: TodoState['filter']) { patchState(store, { filter }); },
//     loadTodos() { ... },  // async
//   })),
//
//   withHooks({
//     onInit(store) { store.loadTodos(); },  // load on startup
//     onDestroy(store) { console.log('TodoStore destroyed'); },
//   })
// );
// ─────────────────────────────────────────────

// TODO 2: TodoSignalStore
// export const TodoSignalStore = signalStore(...)

// ─────────────────────────────────────────────
// TODO 3: Inject stores in components using inject()
//
// CounterComponent:
// @Component({
//   providers: [CounterStore],  ← provide locally
//   ...
// })
// export class CounterComponent {
//   store = inject(CounterStore);
//   // Access state as signals: store.count(), store.doubled()
//   // Call methods:            store.increment(), store.decrement()
// }
//
// For global access (no providers[]): add { providedIn: 'root' } to signalStore:
//   export const CounterStore = signalStore({ providedIn: 'root' }, withState(...), ...)
// ─────────────────────────────────────────────

// TODO 3: CounterComponent using inject(CounterStore)
// @Component({ ... })
// export class CounterComponent { }

// ─────────────────────────────────────────────
// TODO 4: withHooks for initialization side-effects
//
// withHooks runs Angular lifecycle methods at the store level:
//   withHooks({
//     onInit(store) {
//       // Called when the store is first created
//       // Good for: loading initial data, setting up subscriptions
//       effect(() => {
//         console.log('Count changed:', store.count());
//       });
//     },
//     onDestroy(store) {
//       // Called when the provider scope is destroyed
//       // Good for: cleanup, canceling subscriptions
//     }
//   })
//
// Create a TimerStore that:
// - Has state { elapsed: number, running: boolean }
// - withHooks.onInit: starts an interval updating elapsed every second
// - withHooks.onDestroy: clears the interval
// ─────────────────────────────────────────────

// TODO 4: TimerStore with withHooks
// export const TimerStore = signalStore(...)

// ─────────────────────────────────────────────
// TODO 5: withEntities — NgRx Signals entity adapter
//
// import { withEntities, setAll, addEntity, updateEntity, removeEntity } from '@ngrx/signals/entities';
//
// export const ProductStore = signalStore(
//   withEntities<Product>(),
//   // This adds: entities(), entityMap(), ids() computed signals + EntityState shape
//
//   withMethods((store, http = inject(HttpClient)) => ({
//     loadProducts: rxMethod<void>(
//       pipe(
//         switchMap(() => http.get<Product[]>('/api/products')),
//         tap(products => patchState(store, setAll(products)))
//       )
//     ),
//     addProduct: (p: Product) => patchState(store, addEntity(p)),
//     updateProduct: (id: string, changes: Partial<Product>) =>
//       patchState(store, updateEntity({ id, changes })),
//     removeProduct: (id: string) => patchState(store, removeEntity(id)),
//   }))
// );
// ─────────────────────────────────────────────

// TODO 5: ProductStore using withEntities
// export const ProductStore = signalStore(...)

// ─────────────────────────────────────────────
// TODO 6: Add all components to imports[] and render them in AppComponent
// ─────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO 6: import components here
  ],
  template: `
    <h1>NgRx Signal Store Exercise</h1>
    <!-- TODO 6: render components here -->
  `,
})
export class AppComponent {}
