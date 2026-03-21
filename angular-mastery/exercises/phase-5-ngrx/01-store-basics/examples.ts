// Phase 5 - NgRx Store Basics: 50 Examples
// Angular 17+, standalone components
// NgRx patterns are simulated with signals where full store setup isn't possible standalone.
// Actual NgRx code is shown in template <pre> blocks alongside live signal demos.

import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ─── Shared helpers (simulate NgRx primitives) ───────────────────────────────

function createAction<T extends Record<string, unknown>>(type: string) {
  return (props?: T) => ({ type, ...props });
}

function createReducer<S>(
  initialState: S,
  ...ons: Array<{ type: string; reducer: (state: S, action: any) => S }>
): (state: S, action: { type: string }) => S {
  return (state = initialState, action) => {
    const handler = ons.find(o => o.type === action.type);
    return handler ? handler.reducer(state, action) : state;
  };
}

function on<S>(actionCreator: (...args: any[]) => { type: string }, reducer: (state: S, action: any) => S) {
  const type = actionCreator().type;
  return { type, reducer };
}

// ─── Ex01 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-01',
  standalone: true,
  template: `
    <h4>Ex 01 – createAction no props</h4>
    <pre>{{ code }}</pre>
    <p>Dispatched: <strong>{{ dispatched() }}</strong></p>
    <button (click)="dispatch()">Dispatch [Counter] Increment</button>
    <hr />
  `
})
export class Ex01 {
  code = `const increment = createAction('[Counter] Increment');
dispatch(increment());
// => { type: '[Counter] Increment' }`;
  dispatched = signal('none');
  dispatch() { this.dispatched.set('[Counter] Increment'); }
}

// ─── Ex02 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-02',
  standalone: true,
  template: `
    <h4>Ex 02 – createAction with props</h4>
    <pre>{{ code }}</pre>
    <input type="number" [(ngModel)]="amount" style="width:60px" />
    <button (click)="dispatch()">Dispatch incrementBy</button>
    <p>Action: <strong>{{ action() }}</strong></p>
    <hr />
  `,
  imports: [FormsModule]
})
export class Ex02 {
  code = `const incrementBy = createAction('[Counter] Increment By', props<{ amount: number }>());
dispatch(incrementBy({ amount: 5 }));
// => { type: '[Counter] Increment By', amount: 5 }`;
  amount = 5;
  action = signal('none');
  dispatch() { this.action.set(`{ type: '[Counter] Increment By', amount: ${this.amount} }`); }
}

// ─── Ex03 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-03',
  standalone: true,
  template: `
    <h4>Ex 03 – Action type string convention</h4>
    <pre>{{ code }}</pre>
    <p>Convention: <code>[Source] Event Description</code></p>
    <ul>
      <li *ngFor="let a of actions">[{{ a.source }}] {{ a.event }}</li>
    </ul>
    <hr />
  `,
  imports: [CommonModule]
})
export class Ex03 {
  code = `// Convention: '[Source] Event'
const loadUsers    = createAction('[Users API] Load Users');
const loadSuccess  = createAction('[Users API] Load Users Success');
const loadFailure  = createAction('[Users API] Load Users Failure');
const addUser      = createAction('[User Page] Add User');`;
  actions = [
    { source: 'Users API', event: 'Load Users' },
    { source: 'Users API', event: 'Load Users Success' },
    { source: 'Users API', event: 'Load Users Failure' },
    { source: 'User Page', event: 'Add User' },
  ];
}

// ─── Ex04 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-04',
  standalone: true,
  template: `
    <h4>Ex 04 – createReducer with on()</h4>
    <pre>{{ code }}</pre>
    <p>Count: <strong>{{ count() }}</strong></p>
    <button (click)="inc()">Increment</button>
    <button (click)="dec()">Decrement</button>
    <hr />
  `
})
export class Ex04 {
  code = `const counterReducer = createReducer(
  0,
  on(increment, state => state + 1),
  on(decrement, state => state - 1),
);`;
  count = signal(0);
  inc() { this.count.update(s => s + 1); }
  dec() { this.count.update(s => s - 1); }
}

// ─── Ex05 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-05',
  standalone: true,
  template: `
    <h4>Ex 05 – Initial state object</h4>
    <pre>{{ code }}</pre>
    <p>Initial state: <code>{{ json }}</code></p>
    <hr />
  `
})
export class Ex05 {
  code = `export interface CounterState { count: number; }
const initialState: CounterState = { count: 0 };
const counterReducer = createReducer(initialState, ...);`;
  json = JSON.stringify({ count: 0 });
}

// ─── Ex06 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-06',
  standalone: true,
  template: `
    <h4>Ex 06 – Reducer pure function concept</h4>
    <pre>{{ code }}</pre>
    <p>Pure: same input → same output, no side effects.</p>
    <p>Result: {{ result }}</p>
    <hr />
  `
})
export class Ex06 {
  code = `// Pure function: (state, action) => newState
function counterReducer(state = 0, action: Action): number {
  switch (action.type) {
    case '[Counter] Increment': return state + 1;
    default: return state;
  }
}`;
  result = (() => {
    const reducer = (state = 0, action: { type: string }) =>
      action.type === '[Counter] Increment' ? state + 1 : state;
    return `reducer(5, increment()) = ${reducer(5, { type: '[Counter] Increment' })}`;
  })();
}

// ─── Ex07 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-07',
  standalone: true,
  template: `
    <h4>Ex 07 – Store.dispatch() demo</h4>
    <pre>{{ code }}</pre>
    <p>Count: <strong>{{ count() }}</strong></p>
    <button (click)="dispatch({type:'[Counter] Increment'})">Dispatch Increment</button>
    <button (click)="dispatch({type:'[Counter] Decrement'})">Dispatch Decrement</button>
    <hr />
  `
})
export class Ex07 {
  code = `// In component constructor:
// constructor(private store: Store) {}
//
// ngOnInit() {
//   this.store.dispatch(increment());
// }`;
  count = signal(0);
  dispatch(action: { type: string }) {
    if (action.type === '[Counter] Increment') this.count.update(s => s + 1);
    if (action.type === '[Counter] Decrement') this.count.update(s => s - 1);
  }
}

// ─── Ex08 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-08',
  standalone: true,
  template: `
    <h4>Ex 08 – Store.select() demo</h4>
    <pre>{{ code }}</pre>
    <p>Selected count: <strong>{{ count() }}</strong></p>
    <button (click)="count.update(s => s + 1)">+1</button>
    <hr />
  `
})
export class Ex08 {
  code = `// store.select(selectCount) returns Observable<number>
// this.count$ = this.store.select(selectCount);
// Template: {{ count$ | async }}`;
  count = signal(0);
}

// ─── Ex09 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-09',
  standalone: true,
  template: `
    <h4>Ex 09 – createSelector basics</h4>
    <pre>{{ code }}</pre>
    <p>Feature count: {{ count() }}, doubled: {{ doubled() }}</p>
    <button (click)="count.update(s => s + 1)">+1</button>
    <hr />
  `
})
export class Ex09 {
  code = `const selectCounter = createFeatureSelector<CounterState>('counter');
const selectCount   = createSelector(selectCounter, s => s.count);
const selectDoubled = createSelector(selectCount, c => c * 2);`;
  count = signal(0);
  doubled = computed(() => this.count() * 2);
}

// ─── Ex10 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-10',
  standalone: true,
  template: `
    <h4>Ex 10 – MemoizedSelector</h4>
    <pre>{{ code }}</pre>
    <p>Calls: {{ calls() }} (only recalculates when input changes)</p>
    <button (click)="count.update(s=>s+1)">Change count (recalculates)</button>
    <button (click)="other.update(s=>s+1)">Change other (no recalc)</button>
    <p>Doubled: {{ doubled() }}</p>
    <hr />
  `
})
export class Ex10 {
  code = `// createSelector memoizes: if input doesn't change, projector not re-run
const selectDoubled = createSelector(selectCount, count => {
  console.log('projector ran'); // only when count changes
  return count * 2;
});`;
  count = signal(0);
  other = signal(0);
  calls = signal(0);
  doubled = computed(() => { this.calls.update(s => s + 1); return this.count() * 2; });
}

// ─── Ex11 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-11',
  standalone: true,
  template: `
    <h4>Ex 11 – select with pipe async</h4>
    <pre>{{ code }}</pre>
    <p>In real NgRx: use <code>async</code> pipe in template.</p>
    <p>Simulated value: {{ count() }}</p>
    <button (click)="count.update(s=>s+1)">+1</button>
    <hr />
  `
})
export class Ex11 {
  code = `// count$ = this.store.select(selectCount);
// Template: {{ count$ | async }}
//
// Or with toSignal():
// count = toSignal(this.store.select(selectCount), { initialValue: 0 });`;
  count = signal(0);
}

// ─── Ex12 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-12',
  standalone: true,
  template: `
    <h4>Ex 12 – Action creator type inference</h4>
    <pre>{{ code }}</pre>
    <p>TypeScript infers the action type automatically.</p>
    <hr />
  `
})
export class Ex12 {
  code = `const incrementBy = createAction('[Counter] Increment By', props<{ amount: number }>());
// Type is automatically: ActionCreator<'[Counter] Increment By', (props: { amount: number }) => { amount: number } & TypedAction<...>>
const action = incrementBy({ amount: 5 }); // TS knows action.amount: number`;
}

// ─── Ex13 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-13',
  standalone: true,
  template: `
    <h4>Ex 13 – props&lt;{id: number}&gt;()</h4>
    <pre>{{ code }}</pre>
    <input type="number" [(ngModel)]="id" style="width:60px" />
    <button (click)="dispatch()">Dispatch deleteUser</button>
    <p>{{ result() }}</p>
    <hr />
  `,
  imports: [FormsModule]
})
export class Ex13 {
  code = `const deleteUser = createAction('[Users Page] Delete User', props<{ id: number }>());
dispatch(deleteUser({ id: 42 }));
// => { type: '[Users Page] Delete User', id: 42 }`;
  id = 1;
  result = signal('');
  dispatch() { this.result.set(`{ type: '[Users Page] Delete User', id: ${this.id} }`); }
}

// ─── Ex14 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-14',
  standalone: true,
  template: `
    <h4>Ex 14 – Counter reducer (increment/decrement/reset)</h4>
    <pre>{{ code }}</pre>
    <p>Count: <strong>{{ count() }}</strong></p>
    <button (click)="inc()">+</button>
    <button (click)="dec()">-</button>
    <button (click)="reset()">Reset</button>
    <hr />
  `
})
export class Ex14 {
  code = `const counterReducer = createReducer(
  0,
  on(increment, state => state + 1),
  on(decrement, state => state - 1),
  on(reset,     _     => 0),
);`;
  count = signal(0);
  inc()   { this.count.update(s => s + 1); }
  dec()   { this.count.update(s => s - 1); }
  reset() { this.count.set(0); }
}

// ─── Ex15 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-15',
  standalone: true,
  template: `
    <h4>Ex 15 – Feature state slice</h4>
    <pre>{{ code }}</pre>
    <p>users feature: {{ state() | json }}</p>
    <button (click)="addUser()">Add User</button>
    <hr />
  `,
  imports: [CommonModule]
})
export class Ex15 {
  code = `// Feature state is a slice of the global AppState
export interface UsersState {
  users: User[];
  loading: boolean;
}
const initialState: UsersState = { users: [], loading: false };
// Registered as: provideState('users', usersReducer)`;
  state = signal({ users: [] as string[], loading: false });
  addUser() { this.state.update(s => ({ ...s, users: [...s.users, `User${s.users.length + 1}`] })); }
}

// ─── Ex16 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-16',
  standalone: true,
  template: `
    <h4>Ex 16 – createFeatureSelector</h4>
    <pre>{{ code }}</pre>
    <p>Feature key: <code>users</code></p>
    <hr />
  `
})
export class Ex16 {
  code = `// createFeatureSelector creates a typed selector for a feature slice
const selectUsersFeature = createFeatureSelector<UsersState>('users');
// selectUsersFeature selects state.users from the global store
// Then compose with createSelector:
const selectAllUsers = createSelector(selectUsersFeature, s => s.users);`;
}

// ─── Ex17 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-17',
  standalone: true,
  template: `
    <h4>Ex 17 – createSelector composition</h4>
    <pre>{{ code }}</pre>
    <p>Count: {{ count() }}, doubled: {{ doubled() }}, isEven: {{ isEven() }}</p>
    <button (click)="count.update(s=>s+1)">+1</button>
    <hr />
  `
})
export class Ex17 {
  code = `const selectCount   = createSelector(selectCounter, s => s.count);
const selectDoubled = createSelector(selectCount, c => c * 2);
const selectIsEven  = createSelector(selectCount, c => c % 2 === 0);
// Selectors compose to build derived state`;
  count   = signal(0);
  doubled = computed(() => this.count() * 2);
  isEven  = computed(() => this.count() % 2 === 0);
}

// ─── Ex18 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-18',
  standalone: true,
  template: `
    <h4>Ex 18 – select with map</h4>
    <pre>{{ code }}</pre>
    <p>Users count: {{ users().length }}, names: {{ names() }}</p>
    <button (click)="users.update(u=>[...u,'User'+(u.length+1)])">Add</button>
    <hr />
  `
})
export class Ex18 {
  code = `this.userCount$ = this.store.select(selectAllUsers).pipe(
  map(users => users.length)
);
// Or with createSelector:
const selectUserCount = createSelector(selectAllUsers, users => users.length);`;
  users = signal<string[]>([]);
  names = computed(() => this.users().join(', ') || 'none');
}

// ─── Ex19 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-19',
  standalone: true,
  template: `
    <h4>Ex 19 – Action group pattern</h4>
    <pre>{{ code }}</pre>
    <p>Action groups organize related actions under a source.</p>
    <hr />
  `
})
export class Ex19 {
  code = `import { createActionGroup, emptyProps } from '@ngrx/store';
export const UsersActions = createActionGroup({
  source: 'Users',
  events: {
    'Load Users':         emptyProps(),
    'Load Users Success': props<{ users: User[] }>(),
    'Load Users Failure': props<{ error: string }>(),
    'Add User':           props<{ user: User }>(),
  }
});
// Usage: dispatch(UsersActions.loadUsers())
//        dispatch(UsersActions.loadUsersSuccess({ users }))`;
}

// ─── Ex20 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-20',
  standalone: true,
  template: `
    <h4>Ex 20 – Action with multiple props</h4>
    <pre>{{ code }}</pre>
    <button (click)="dispatch()">Dispatch updateUser</button>
    <p>{{ result() }}</p>
    <hr />
  `
})
export class Ex20 {
  code = `const updateUser = createAction(
  '[Users Page] Update User',
  props<{ id: number; name: string; email: string }>()
);
dispatch(updateUser({ id: 1, name: 'Alice', email: 'alice@ex.com' }));`;
  result = signal('');
  dispatch() { this.result.set(`{ type: '[Users Page] Update User', id: 1, name: 'Alice', email: 'alice@ex.com' }`); }
}

// ─── Ex21 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-21',
  standalone: true,
  template: `
    <h4>Ex 21 – Reducer with switch (pre-createReducer style)</h4>
    <pre>{{ code }}</pre>
    <p>Count: {{ count() }}</p>
    <button (click)="dispatch('[Counter] Increment')">Inc</button>
    <button (click)="dispatch('[Counter] Decrement')">Dec</button>
    <hr />
  `
})
export class Ex21 {
  code = `// Old Angular/NgRx style (still valid):
function counterReducer(state = 0, action: Action): number {
  switch (action.type) {
    case '[Counter] Increment': return state + 1;
    case '[Counter] Decrement': return state - 1;
    default: return state;
  }
}
// Prefer createReducer + on() in modern NgRx`;
  count = signal(0);
  dispatch(type: string) {
    if (type === '[Counter] Increment') this.count.update(s => s + 1);
    if (type === '[Counter] Decrement') this.count.update(s => s - 1);
  }
}

// ─── Ex22 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-22',
  standalone: true,
  template: `
    <h4>Ex 22 – Immutable update (immer-like)</h4>
    <pre>{{ code }}</pre>
    <p>State: {{ state() | json }}</p>
    <button (click)="updateName()">Update Name</button>
    <hr />
  `,
  imports: [CommonModule]
})
export class Ex22 {
  code = `// Spread operator for immutable updates in reducer:
on(updateUser, (state, { id, name }) => ({
  ...state,
  users: state.users.map(u => u.id === id ? { ...u, name } : u)
}))
// With immer: use produce() from 'immer' library`;
  state = signal({ users: [{ id: 1, name: 'Alice' }] });
  updateName() { this.state.update(s => ({ ...s, users: s.users.map(u => ({ ...u, name: 'Bob' })) })); }
}

// ─── Ex23 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-23',
  standalone: true,
  template: `
    <h4>Ex 23 – provideStore config</h4>
    <pre>{{ code }}</pre>
    <p>Store is configured in <code>main.ts</code> or <code>app.config.ts</code>.</p>
    <hr />
  `
})
export class Ex23 {
  code = `// app.config.ts:
export const appConfig: ApplicationConfig = {
  providers: [
    provideStore({
      counter: counterReducer,
      users:   usersReducer,
    }),
    // Or use provideStore() with feature reducers via provideState()
  ]
};`;
}

// ─── Ex24 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-24',
  standalone: true,
  template: `
    <h4>Ex 24 – Feature state registration</h4>
    <pre>{{ code }}</pre>
    <hr />
  `
})
export class Ex24 {
  code = `// Lazy feature registration (preferred in modern NgRx):
// In a route's providers array:
{
  path: 'users',
  loadComponent: () => import('./users/users.component'),
  providers: [
    provideState('users', usersReducer),
    provideEffects(UsersEffects),
  ]
}
// Or via NgModule: StoreModule.forFeature('users', usersReducer)`;
}

// ─── Ex25 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-25',
  standalone: true,
  template: `
    <h4>Ex 25 – State shape design</h4>
    <pre>{{ code }}</pre>
    <hr />
  `
})
export class Ex25 {
  code = `// Good state shape: normalize, keep flat
export interface AppState {
  router: RouterReducerState;
  users:  UsersState;  // { ids: number[], entities: Record<number,User>, loading, error }
  posts:  PostsState;
}
// Avoid deeply nested state — use entity adapter for collections
// Keep UI state close to the component (ComponentStore or signals)`;
}

// ─── Ex26 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-26',
  standalone: true,
  template: `
    <h4>Ex 26 – Selector with arguments (factory)</h4>
    <pre>{{ code }}</pre>
    <input type="number" [(ngModel)]="id" style="width:60px" />
    <p>User {{ id }}: {{ user() | json }}</p>
    <hr />
  `,
  imports: [CommonModule, FormsModule]
})
export class Ex26 {
  code = `// Factory selector pattern (replaces deprecated props):
const selectUserById = (id: number) =>
  createSelector(selectAllUsers, users => users.find(u => u.id === id));

// Usage in component:
this.user$ = this.store.select(selectUserById(this.userId));`;
  id = 1;
  private users = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
  user = computed(() => this.users.find(u => u.id === +this.id) ?? null);
}

// ─── Ex27 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-27',
  standalone: true,
  template: `
    <h4>Ex 27 – Entity-like state (ids + entities)</h4>
    <pre>{{ code }}</pre>
    <p>ids: {{ ids() | json }}</p>
    <p>entities: {{ entities() | json }}</p>
    <button (click)="add()">Add Entity</button>
    <hr />
  `,
  imports: [CommonModule]
})
export class Ex27 {
  code = `// Normalized entity state shape:
interface EntityState<T> {
  ids: number[];
  entities: Record<number, T>;
}
// Benefit: O(1) lookup by id, no duplicates`;
  private next = signal(1);
  ids      = signal<number[]>([]);
  entities = signal<Record<number, { id: number; name: string }>>({});
  add() {
    const id = this.next();
    this.next.update(n => n + 1);
    this.ids.update(ids => [...ids, id]);
    this.entities.update(e => ({ ...e, [id]: { id, name: `Item ${id}` } }));
  }
}

// ─── Ex28 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-28',
  standalone: true,
  template: `
    <h4>Ex 28 – Normalized state shape</h4>
    <pre>{{ code }}</pre>
    <p>posts reference users by userId (no duplication)</p>
    <p>Users: {{ users | json }}</p>
    <p>Posts: {{ posts | json }}</p>
    <hr />
  `,
  imports: [CommonModule]
})
export class Ex28 {
  code = `// Normalized: entities reference each other by ID
interface AppState {
  users: { ids: number[]; entities: Record<number, User> };
  posts: { ids: number[]; entities: Record<number, Post> };
}
// Post.userId refers to a user — no embedded user object`;
  users = { 1: { id: 1, name: 'Alice' } };
  posts = { 1: { id: 1, title: 'Hello', userId: 1 } };
}

// ─── Ex29 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-29',
  standalone: true,
  template: `
    <h4>Ex 29 – Selector composition chain (3 selectors)</h4>
    <pre>{{ code }}</pre>
    <p>Active users with post count: {{ result() | json }}</p>
    <hr />
  `,
  imports: [CommonModule]
})
export class Ex29 {
  code = `const selectUsers      = createSelector(selectUsersFeature, s => s.users);
const selectActiveUsers = createSelector(selectUsers, users => users.filter(u => u.active));
const selectActiveWithPosts = createSelector(
  selectActiveUsers, selectAllPosts,
  (users, posts) => users.map(u => ({
    ...u, postCount: posts.filter(p => p.userId === u.id).length
  }))
);`;
  result = computed(() => [
    { id: 1, name: 'Alice', active: true, postCount: 2 },
    { id: 2, name: 'Bob',   active: true, postCount: 1 },
  ]);
}

// ─── Ex30 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-30',
  standalone: true,
  template: `
    <h4>Ex 30 – Multiple feature states</h4>
    <pre>{{ code }}</pre>
    <p>users.count: {{ usersCount() }} | posts.count: {{ postsCount() }}</p>
    <hr />
  `
})
export class Ex30 {
  code = `// Each feature has its own reducer registered with provideState():
provideState('users', usersReducer),
provideState('posts', postsReducer),
// Global state shape: { users: UsersState, posts: PostsState }`;
  usersCount = signal(3);
  postsCount = signal(7);
}

// ─── Ex31 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-31',
  standalone: true,
  template: `
    <h4>Ex 31 – Cross-feature selector</h4>
    <pre>{{ code }}</pre>
    <p>Enriched posts: {{ enriched() | json }}</p>
    <hr />
  `,
  imports: [CommonModule]
})
export class Ex31 {
  code = `// Combine two feature selectors:
const selectEnrichedPosts = createSelector(
  selectAllPosts,     // from posts feature
  selectUserEntities, // from users feature
  (posts, userEntities) =>
    posts.map(p => ({ ...p, author: userEntities[p.userId]?.name }))
);`;
  enriched = computed(() => [
    { id: 1, title: 'Hello', author: 'Alice' },
    { id: 2, title: 'World', author: 'Bob' },
  ]);
}

// ─── Ex32 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-32',
  standalone: true,
  template: `
    <h4>Ex 32 – State with loading/error/data shape</h4>
    <pre>{{ code }}</pre>
    <p>loading: {{ state().loading }} | error: {{ state().error }} | data count: {{ state().data.length }}</p>
    <button (click)="load()">Simulate Load</button>
    <hr />
  `
})
export class Ex32 {
  code = `interface DataState<T> {
  data:    T[];
  loading: boolean;
  error:   string | null;
}
on(loadUsers,         s => ({ ...s, loading: true, error: null })),
on(loadUsersSuccess,  (s, { users }) => ({ data: users, loading: false, error: null })),
on(loadUsersFailure,  (s, { error }) => ({ ...s, loading: false, error })),`;
  state = signal({ loading: false, error: null as string | null, data: [] as string[] });
  load() {
    this.state.set({ loading: true, error: null, data: [] });
    setTimeout(() => this.state.set({ loading: false, error: null, data: ['Alice', 'Bob'] }), 800);
  }
}

// ─── Ex33 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-33',
  standalone: true,
  template: `
    <h4>Ex 33 – Action for optimistic update</h4>
    <pre>{{ code }}</pre>
    <p>Items: {{ items() | json }}</p>
    <button (click)="optimisticDelete(1)">Optimistic Delete id=1</button>
    <hr />
  `,
  imports: [CommonModule]
})
export class Ex33 {
  code = `// Optimistic update: update state immediately, rollback on error
on(deleteUserOptimistic, (state, { id }) => ({
  ...state,
  users: state.users.filter(u => u.id !== id)   // remove immediately
})),
on(deleteUserFailure, (state, { user }) => ({
  ...state,
  users: [...state.users, user]                  // restore on failure
})),`;
  items = signal([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]);
  optimisticDelete(id: number) { this.items.update(items => items.filter(i => i.id !== id)); }
}

// ─── Ex34 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-34',
  standalone: true,
  template: `
    <h4>Ex 34 – Reducer for CRUD operations</h4>
    <pre>{{ code }}</pre>
    <p>Items: {{ items() | json }}</p>
    <button (click)="add()">Add</button>
    <button (click)="update()">Update id=1</button>
    <button (click)="remove()">Remove id=1</button>
    <hr />
  `,
  imports: [CommonModule]
})
export class Ex34 {
  code = `const itemsReducer = createReducer(
  initialState,
  on(addItem,    (s, { item })      => ({ ...s, items: [...s.items, item] })),
  on(updateItem, (s, { id, patch }) => ({ ...s, items: s.items.map(i => i.id===id ? {...i,...patch} : i) })),
  on(removeItem, (s, { id })        => ({ ...s, items: s.items.filter(i => i.id !== id) })),
);`;
  private next = 3;
  items = signal([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]);
  add()    { this.items.update(s => [...s, { id: this.next++, name: `User${this.next}` }]); }
  update() { this.items.update(s => s.map(i => i.id === 1 ? { ...i, name: 'Alice (updated)' } : i)); }
  remove() { this.items.update(s => s.filter(i => i.id !== 1)); }
}

// ─── Ex35 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-35',
  standalone: true,
  template: `
    <h4>Ex 35 – Selector memoization demo</h4>
    <pre>{{ code }}</pre>
    <p>Projector ran: <strong>{{ runs() }}</strong> times (stays same if other state changes)</p>
    <button (click)="count.update(s=>s+1)">Change count (triggers rerun)</button>
    <button (click)="unrelated.update(s=>s+1)">Change unrelated (no rerun)</button>
    <p>Doubled: {{ doubled() }}</p>
    <hr />
  `
})
export class Ex35 {
  code = `// Memoization: projector only re-runs when its INPUT selector results change
const selectDoubled = createSelector(selectCount, count => {
  // This only runs when count changes, not when other state changes
  return count * 2;
});`;
  count     = signal(0);
  unrelated = signal(0);
  runs      = signal(0);
  doubled   = computed(() => { this.runs.update(r => r + 1); return this.count() * 2; });
}

// ─── Ex36 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-36',
  standalone: true,
  template: `
    <h4>Ex 36 – State reset action</h4>
    <pre>{{ code }}</pre>
    <p>State: {{ state() | json }}</p>
    <button (click)="add()">Add item</button>
    <button (click)="reset()">Reset state</button>
    <hr />
  `,
  imports: [CommonModule]
})
export class Ex36 {
  code = `const resetState = createAction('[App] Reset State');
const usersReducer = createReducer(
  initialState,
  on(resetState, () => initialState), // return fresh initial state
  // ... other handlers
);`;
  initialState = { items: [] as string[] };
  state = signal({ items: [] as string[] });
  add()   { this.state.update(s => ({ items: [...s.items, `Item${s.items.length + 1}`] })); }
  reset() { this.state.set({ items: [] }); }
}

// ─── Ex37 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-37',
  standalone: true,
  template: `
    <h4>Ex 37 – Batch actions pattern</h4>
    <pre>{{ code }}</pre>
    <p>log: {{ log() | json }}</p>
    <button (click)="batch()">Dispatch batch</button>
    <hr />
  `,
  imports: [CommonModule]
})
export class Ex37 {
  code = `// Dispatch multiple actions in sequence (each triggers change detection):
store.dispatch(setLoading({ loading: true }));
store.dispatch(clearErrors());
store.dispatch(loadUsers());
// Or create a single compound action:
const initializeDashboard = createAction('[Dashboard] Initialize');
// reducer handles it with multiple state mutations in one on() handler`;
  log = signal<string[]>([]);
  batch() {
    this.log.set(['setLoading({loading:true})', 'clearErrors()', 'loadUsers()']);
  }
}

// ─── Ex38 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-38',
  standalone: true,
  template: `
    <h4>Ex 38 – Complex state update in reducer</h4>
    <pre>{{ code }}</pre>
    <p>State: {{ state() | json }}</p>
    <button (click)="toggle(1)">Toggle user 1 active</button>
    <hr />
  `,
  imports: [CommonModule]
})
export class Ex38 {
  code = `on(toggleUserActive, (state, { id }) => ({
  ...state,
  users: {
    ...state.users,
    entities: {
      ...state.users.entities,
      [id]: {
        ...state.users.entities[id],
        active: !state.users.entities[id].active,
      }
    }
  }
}))`;
  state = signal({ users: { 1: { id: 1, name: 'Alice', active: true } } as Record<number, { id: number; name: string; active: boolean }> });
  toggle(id: number) {
    this.state.update(s => ({ users: { ...s.users, [id]: { ...s.users[id], active: !s.users[id].active } } }));
  }
}

// ─── Ex39 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-39',
  standalone: true,
  template: `
    <h4>Ex 39 – Action metadata</h4>
    <pre>{{ code }}</pre>
    <hr />
  `
})
export class Ex39 {
  code = `// Actions can carry metadata for effects, reducers, or DevTools
const loadUserWithMeta = createAction(
  '[Users API] Load User',
  props<{ id: number; correlationId: string; timestamp: number }>()
);
dispatch(loadUserWithMeta({
  id: 42,
  correlationId: crypto.randomUUID(),
  timestamp: Date.now(),
}));`;
}

// ─── Ex40 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-40',
  standalone: true,
  template: `
    <h4>Ex 40 – Action source tagging</h4>
    <pre>{{ code }}</pre>
    <hr />
  `
})
export class Ex40 {
  code = `// Source tagging: the '[Source]' prefix in action type string
// Tells you WHERE an action originated:
// '[Users Page]'   = dispatched from UI component
// '[Users API]'    = dispatched from an Effect after HTTP
// '[Router]'       = dispatched by router integration
// '[LocalStorage]' = dispatched from storage effect
// Helps in DevTools to trace action flows`;
}

// ─── Ex41 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-41',
  standalone: true,
  template: `
    <h4>Ex 41 – Factory selector (replaces deprecated selector with props)</h4>
    <pre>{{ code }}</pre>
    <input type="number" [(ngModel)]="id" style="width:60px" />
    <p>Selected: {{ selected() | json }}</p>
    <hr />
  `,
  imports: [CommonModule, FormsModule]
})
export class Ex41 {
  code = `// Deprecated (NgRx < 12):
// const selectUser = createSelector(selectUsers, (users, props) => users[props.id]);
// store.select(selectUser, { id: 1 })

// Modern replacement — factory selector:
const selectUserById = (id: number) =>
  createSelector(selectUserEntities, entities => entities[id]);
// Usage: this.store.select(selectUserById(this.userId))`;
  id   = 1;
  data = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
  selected = computed(() => this.data.find(u => u.id === +this.id) ?? null);
}

// ─── Ex42 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-42',
  standalone: true,
  template: `
    <h4>Ex 42 – Custom memoization function</h4>
    <pre>{{ code }}</pre>
    <hr />
  `
})
export class Ex42 {
  code = `import { createSelectorFactory, defaultMemoize } from '@ngrx/store';

// Custom: memoize last N results (not just last 1):
function memoizeN(n: number) {
  const cache = new Map<string, any>();
  return (fn: Function) => (...args: any[]) => {
    const key = JSON.stringify(args);
    if (!cache.has(key)) {
      if (cache.size >= n) cache.delete(cache.keys().next().value);
      cache.set(key, fn(...args));
    }
    return cache.get(key);
  };
}
const selectWithMemoN = createSelectorFactory(memoizeN(3));`;
}

// ─── Ex43 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-43',
  standalone: true,
  template: `
    <h4>Ex 43 – State migration pattern</h4>
    <pre>{{ code }}</pre>
    <hr />
  `
})
export class Ex43 {
  code = `// State migrations for persisted state (e.g., localStorage hydration)
// v1 state: { count: number }
// v2 state: { count: number; label: string }
function migrateState(stored: any): AppState {
  if (!stored.version || stored.version < 2) {
    return { ...stored, label: 'default', version: 2 };
  }
  return stored;
}
// Apply on hydration:
const hydratedState = migrateState(JSON.parse(localStorage.getItem('state') ?? '{}'));`;
}

// ─── Ex44 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-44',
  standalone: true,
  template: `
    <h4>Ex 44 – State serialization check</h4>
    <pre>{{ code }}</pre>
    <hr />
  `
})
export class Ex44 {
  code = `// NgRx StoreDevtools warns when state/actions are not serializable
// Enable runtime checks:
provideStore({}, {
  runtimeChecks: {
    strictStateSerializability:   true,
    strictActionSerializability:  true,
    strictActionWithinNgZone:     true,
    strictStateImmutability:      true,
    strictActionImmutability:     true,
  }
})
// Avoid: Date, Map, Set, class instances in state — use plain objects/primitives`;
}

// ─── Ex45 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-45',
  standalone: true,
  template: `
    <h4>Ex 45 – DevTools integration concept</h4>
    <pre>{{ code }}</pre>
    <hr />
  `
})
export class Ex45 {
  code = `import { provideStoreDevtools } from '@ngrx/store-devtools';
// app.config.ts:
provideStoreDevtools({
  maxAge: 25,              // retain last 25 states
  logOnly: !isDevMode(),  // restrict extension to log-only in production
  autoPause: true,         // pauses recording actions when devtools window is not open
  trace: false,            // adds stack trace to every dispatched action
  traceLimit: 75,
})
// Install Redux DevTools browser extension to use`;
}

// ─── Ex46 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-46',
  standalone: true,
  template: `
    <h4>Ex 46 – Time-travel debugging concept</h4>
    <pre>{{ code }}</pre>
    <hr />
  `
})
export class Ex46 {
  code = `// Time-travel debugging = replaying past actions to any point
// Possible because:
// 1. State is immutable (every action creates new state object)
// 2. Reducers are pure (same action + state always = same result)
// 3. All actions are logged in DevTools
//
// Redux DevTools lets you:
// - Slide the action slider backward/forward
// - Jump to any specific action
// - Skip/replay individual actions
// - Export/import action logs`;
}

// ─── Ex47 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-47',
  standalone: true,
  template: `
    <h4>Ex 47 – State hydration from localStorage</h4>
    <pre>{{ code }}</pre>
    <p>Hydrated: {{ hydrated() | json }}</p>
    <button (click)="save()">Save to localStorage</button>
    <button (click)="hydrate()">Hydrate from localStorage</button>
    <hr />
  `,
  imports: [CommonModule]
})
export class Ex47 {
  code = `// In app.config.ts, pass initial state to provideStore:
const savedState = localStorage.getItem('appState');
const initialState = savedState ? JSON.parse(savedState) : {};
provideStore({ counter: counterReducer }, { initialState })

// Effect to persist on changes:
persistState$ = createEffect(() =>
  this.store.pipe(
    tap(state => localStorage.setItem('appState', JSON.stringify(state)))
  ), { dispatch: false }
);`;
  hydrated = signal<Record<string, unknown> | null>(null);
  save()    { localStorage.setItem('ngrx-ex47', JSON.stringify({ count: 42 })); }
  hydrate() { const s = localStorage.getItem('ngrx-ex47'); this.hydrated.set(s ? JSON.parse(s) : null); }
}

// ─── Ex48 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-48',
  standalone: true,
  template: `
    <h4>Ex 48 – Performance with distinctUntilChanged</h4>
    <pre>{{ code }}</pre>
    <p>Renders: {{ renders() }} (only increases when selected value actually changes)</p>
    <button (click)="count.update(s=>s+1)">Change count (triggers render)</button>
    <button (click)="other.update(s=>s+1)">Change other field (no render)</button>
    <hr />
  `
})
export class Ex48 {
  code = `// Store.select() already applies distinctUntilChanged internally
// So components only re-render when THEIR selected slice actually changes
this.count$ = this.store.select(selectCount); // already distinct
// Manual:
this.count$ = this.store.pipe(
  select(selectCount),
  distinctUntilChanged()
);`;
  count   = signal(0);
  other   = signal(0);
  renders = signal(0);
  constructor() {
    // Only track count changes
    const _ = computed(() => { this.count(); this.renders.update(r => r + 1); });
    _(); // initialize
  }
}

// ─── Ex49 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-49',
  standalone: true,
  template: `
    <h4>Ex 49 – Selector with runtime params</h4>
    <pre>{{ code }}</pre>
    <select [(ngModel)]="status">
      <option>active</option><option>inactive</option><option>pending</option>
    </select>
    <p>Filtered: {{ filtered() | json }}</p>
    <hr />
  `,
  imports: [CommonModule, FormsModule]
})
export class Ex49 {
  code = `// Runtime param via factory + combineLatest:
const selectByStatus = (status: string) =>
  createSelector(selectAllUsers, users => users.filter(u => u.status === status));

// Reactive factory:
this.filtered$ = this.statusFilter$.pipe(
  switchMap(status => this.store.select(selectByStatus(status)))
);`;
  status = 'active';
  private allUsers = [
    { id: 1, name: 'Alice', status: 'active' },
    { id: 2, name: 'Bob',   status: 'inactive' },
    { id: 3, name: 'Carol', status: 'pending' },
    { id: 4, name: 'Dave',  status: 'active' },
  ];
  filtered = computed(() => this.allUsers.filter(u => u.status === this.status));
}

// ─── Ex50 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-50',
  standalone: true,
  template: `
    <h4>Ex 50 – Full counter app NgRx pattern</h4>
    <pre>{{ code }}</pre>
    <p>Count: <strong>{{ count() }}</strong> | doubled: {{ doubled() }} | isPositive: {{ isPositive() }}</p>
    <button (click)="inc()">Increment</button>
    <button (click)="dec()">Decrement</button>
    <button (click)="incBy(5)">+5</button>
    <button (click)="reset()">Reset</button>
    <hr />
  `
})
export class Ex50 {
  code = `// Full NgRx counter pattern:
// actions.ts: increment, decrement, reset, incrementBy
// reducer.ts: createReducer(0, on(increment, s=>s+1), ...)
// selectors.ts: selectCount, selectDoubled, selectIsPositive
// component.ts: store.dispatch(increment()); count$ = store.select(selectCount);
// app.config.ts: provideStore({ counter: counterReducer })`;
  count      = signal(0);
  doubled    = computed(() => this.count() * 2);
  isPositive = computed(() => this.count() > 0);
  inc()         { this.count.update(s => s + 1); }
  dec()         { this.count.update(s => s - 1); }
  incBy(n: number) { this.count.update(s => s + n); }
  reset()       { this.count.set(0); }
}

// ─── AppComponent ─────────────────────────────────────────────────────────────
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    Ex01, Ex02, Ex03, Ex04, Ex05, Ex06, Ex07, Ex08, Ex09, Ex10,
    Ex11, Ex12, Ex13, Ex14, Ex15, Ex16, Ex17, Ex18, Ex19, Ex20,
    Ex21, Ex22, Ex23, Ex24, Ex25, Ex26, Ex27, Ex28, Ex29, Ex30,
    Ex31, Ex32, Ex33, Ex34, Ex35, Ex36, Ex37, Ex38, Ex39, Ex40,
    Ex41, Ex42, Ex43, Ex44, Ex45, Ex46, Ex47, Ex48, Ex49, Ex50,
  ],
  template: `
    <h2>NgRx Store Basics – 50 Examples</h2>
    <ex-01 /><hr /><ex-02 /><hr /><ex-03 /><hr /><ex-04 /><hr /><ex-05 />
    <hr /><ex-06 /><hr /><ex-07 /><hr /><ex-08 /><hr /><ex-09 /><hr /><ex-10 />
    <hr /><ex-11 /><hr /><ex-12 /><hr /><ex-13 /><hr /><ex-14 /><hr /><ex-15 />
    <hr /><ex-16 /><hr /><ex-17 /><hr /><ex-18 /><hr /><ex-19 /><hr /><ex-20 />
    <hr /><ex-21 /><hr /><ex-22 /><hr /><ex-23 /><hr /><ex-24 /><hr /><ex-25 />
    <hr /><ex-26 /><hr /><ex-27 /><hr /><ex-28 /><hr /><ex-29 /><hr /><ex-30 />
    <hr /><ex-31 /><hr /><ex-32 /><hr /><ex-33 /><hr /><ex-34 /><hr /><ex-35 />
    <hr /><ex-36 /><hr /><ex-37 /><hr /><ex-38 /><hr /><ex-39 /><hr /><ex-40 />
    <hr /><ex-41 /><hr /><ex-42 /><hr /><ex-43 /><hr /><ex-44 /><hr /><ex-45 />
    <hr /><ex-46 /><hr /><ex-47 /><hr /><ex-48 /><hr /><ex-49 /><hr /><ex-50 />
  `
})
export class AppComponent {}
