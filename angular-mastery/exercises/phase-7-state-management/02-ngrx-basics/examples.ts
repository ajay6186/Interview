import { Component, signal, computed, inject, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ─── Minimal NgRx-like simulation helpers ─────────────────────────────────────

function createAction<P = void>(type: string) {
  return (props?: P) => ({ type, payload: props });
}

function createReducer<S>(initial: S, ...ons: Array<{ matcher: (a: any) => boolean; reducer: (s: S, a: any) => S }>) {
  return (state: S = initial, action: any): S => {
    for (const o of ons) {
      if (o.matcher(action)) return o.reducer(state, action);
    }
    return state;
  };
}

function on<S, P>(actionCreator: (p?: P) => any, reducer: (s: S, a: any) => S) {
  const type = actionCreator().type;
  return { matcher: (a: any) => a.type === type, reducer };
}

function createSelector<S, R>(selector: (s: S) => R) {
  return selector;
}

function createFeatureSelector<S>(key: string) {
  return (appState: any) => appState[key] as S;
}

// Tiny signal-based Store simulation
class MiniStore<S extends object> {
  private _state = signal<S>({} as S);
  readonly state = this._state.asReadonly();
  constructor(initial: S) { this._state.set(initial); }
  dispatch(action: any) {
    console.log('[MiniStore] dispatch', action);
  }
  select<R>(selector: (s: S) => R) {
    return computed(() => selector(this._state()));
  }
  setState(s: S) { this._state.set(s); }
  patchState(partial: Partial<S>) { this._state.update(cur => ({ ...cur, ...partial })); }
}

// ─── BASIC (1–13) ─────────────────────────────────────────────────────────────

// Ex01 – createAction
const increment01 = createAction('[Counter] Increment');
const decrement01 = createAction('[Counter] Decrement');

@Component({
  selector: 'ex-01', standalone: true, template: `
    <h4>Ex01 – createAction</h4>
    <p>Action: {{ action | json }}</p>
    <button (click)="dispatch()">Dispatch Increment</button>`
})
export class Ex01 {
  action: any = null;
  dispatch() { this.action = increment01(); console.log(this.action); }
}

// Ex02 – props<>()
interface IncrementByProps { amount: number; }
const incrementBy = createAction<IncrementByProps>('[Counter] IncrementBy');

@Component({
  selector: 'ex-02', standalone: true, template: `
    <h4>Ex02 – props&lt;&gt;()</h4>
    <p>Action payload: {{ action | json }}</p>
    <button (click)="dispatch()">Dispatch +5</button>`
})
export class Ex02 {
  action: any = null;
  dispatch() { this.action = incrementBy({ amount: 5 }); }
}

// Ex03 – createReducer
interface CounterState03 { count: number; }
const inc03 = createAction('[Ex03] Inc');
const dec03 = createAction('[Ex03] Dec');
const reducer03 = createReducer<CounterState03>(
  { count: 0 },
  on(inc03, s => ({ ...s, count: s.count + 1 })),
  on(dec03, s => ({ ...s, count: s.count - 1 }))
);

@Component({
  selector: 'ex-03', standalone: true, template: `
    <h4>Ex03 – createReducer</h4>
    <p>Count: {{ state.count }}</p>
    <button (click)="dispatch(inc)">+</button>
    <button (click)="dispatch(dec)">-</button>`
})
export class Ex03 {
  state: CounterState03 = { count: 0 };
  inc = inc03; dec = dec03;
  dispatch(ac: () => any) { this.state = reducer03(this.state, ac()); }
}

// Ex04 – on() handler
const reset04 = createAction('[Ex04] Reset');
interface Ex04State { value: number; }
const reducer04 = createReducer<Ex04State>(
  { value: 10 },
  on(reset04, () => ({ value: 0 }))
);

@Component({
  selector: 'ex-04', standalone: true, template: `
    <h4>Ex04 – on() Handler</h4>
    <p>Value: {{ state.value }}</p>
    <button (click)="dispatch()">Reset to 0</button>`
})
export class Ex04 {
  state: Ex04State = { value: 10 };
  dispatch() { this.state = reducer04(this.state, reset04()); }
}

// Ex05 – createSelector
interface Ex05State { count: number; }
const selectCount05 = createSelector<Ex05State, number>(s => s.count);
const selectDouble05 = createSelector<Ex05State, number>(s => selectCount05(s) * 2);

@Component({
  selector: 'ex-05', standalone: true, template: `
    <h4>Ex05 – createSelector</h4>
    <p>Count: {{ count }}, Double: {{ double }}</p>
    <button (click)="inc()">+</button>`
})
export class Ex05 {
  state: Ex05State = { count: 1 };
  get count() { return selectCount05(this.state); }
  get double() { return selectDouble05(this.state); }
  inc() { this.state = { count: this.state.count + 1 }; }
}

// Ex06 – createFeatureSelector
interface AppState06 { counter: { count: number }; }
const selectCounterFeature06 = createFeatureSelector<{ count: number }>('counter');

@Component({
  selector: 'ex-06', standalone: true, template: `
    <h4>Ex06 – createFeatureSelector</h4>
    <p>Feature slice: {{ feature | json }}</p>`
})
export class Ex06 {
  appState: AppState06 = { counter: { count: 42 } };
  get feature() { return selectCounterFeature06(this.appState); }
}

// Ex07 – Action type string
@Component({
  selector: 'ex-07', standalone: true, template: `
    <h4>Ex07 – Action Type String</h4>
    <p>Type: {{ actionType }}</p>`
})
export class Ex07 {
  actionType = increment01().type;
}

// Ex08 – Reducer pure function
interface Ex08State { items: string[]; }
const addItem08 = createAction<{ item: string }>('[Ex08] AddItem');
const reducer08 = createReducer<Ex08State>(
  { items: [] },
  on(addItem08, (s, a) => ({ items: [...s.items, a.payload.item] }))
);

@Component({
  selector: 'ex-08', standalone: true, template: `
    <h4>Ex08 – Reducer Pure Function</h4>
    @for (i of state.items; track i) { <span>{{ i }} </span> }
    <button (click)="add()">Add</button>`
})
export class Ex08 {
  state: Ex08State = { items: [] };
  add() { this.state = reducer08(this.state, addItem08({ item: `item${this.state.items.length + 1}` })); }
}

// Ex09 – Initial state
interface AppState09 { loading: boolean; data: any; error: string | null; }
const initialState09: AppState09 = { loading: false, data: null, error: null };

@Component({
  selector: 'ex-09', standalone: true, template: `
    <h4>Ex09 – Initial State</h4>
    <pre>{{ state | json }}</pre>`
})
export class Ex09 {
  state = { ...initialState09 };
}

// Ex10 – Store.dispatch simulation
@Injectable({ providedIn: 'root' })
export class MiniCounterStore10 {
  private store = new MiniStore({ count: 0 });
  count = this.store.select(s => s.count);
  dispatch(action: any) {
    if (action.type === '[Ex10] Inc') this.store.patchState({ count: this.store.state().count + 1 });
    if (action.type === '[Ex10] Dec') this.store.patchState({ count: this.store.state().count - 1 });
  }
}

const inc10 = createAction('[Ex10] Inc');
const dec10 = createAction('[Ex10] Dec');

@Component({
  selector: 'ex-10', standalone: true, template: `
    <h4>Ex10 – Store.dispatch Simulation</h4>
    <p>Count: {{ svc.count() }}</p>
    <button (click)="svc.dispatch(inc())">+</button>
    <button (click)="svc.dispatch(dec())">-</button>`
})
export class Ex10 {
  svc = inject(MiniCounterStore10);
  inc = inc10; dec = dec10;
}

// Ex11 – Store.select simulation
@Injectable({ providedIn: 'root' })
export class UserStore11 {
  private store = new MiniStore({ name: 'Alice', age: 30, role: 'admin' });
  name = this.store.select(s => s.name);
  role = this.store.select(s => s.role);
}

@Component({
  selector: 'ex-11', standalone: true, template: `
    <h4>Ex11 – Store.select Simulation</h4>
    <p>Name: {{ svc.name() }}, Role: {{ svc.role() }}</p>`
})
export class Ex11 {
  svc = inject(UserStore11);
}

// Ex12 – MemoizedSelector
function memoize<S, R>(fn: (s: S) => R): (s: S) => R {
  let lastArg: S; let lastResult: R; let called = false;
  return (s: S) => {
    if (called && s === lastArg) return lastResult;
    called = true; lastArg = s; lastResult = fn(s);
    return lastResult;
  };
}

@Component({
  selector: 'ex-12', standalone: true, template: `
    <h4>Ex12 – MemoizedSelector</h4>
    <p>Expensive (memoized): {{ result }}</p>
    <button (click)="compute()">Compute</button>`
})
export class Ex12 {
  state = { items: [1, 2, 3, 4, 5] };
  expensiveSelector = memoize((s: typeof this.state) => s.items.reduce((a, b) => a + b, 0));
  result = 0;
  compute() { this.result = this.expensiveSelector(this.state); }
}

// Ex13 – Action namespace
const AuthActions = {
  login: createAction<{ username: string }>('[Auth] Login'),
  logout: createAction('[Auth] Logout'),
  loginSuccess: createAction<{ token: string }>('[Auth] Login Success'),
  loginFailure: createAction<{ error: string }>('[Auth] Login Failure'),
};

@Component({
  selector: 'ex-13', standalone: true, template: `
    <h4>Ex13 – Action Namespace</h4>
    @for (a of actions; track a) { <p>{{ a }}</p> }`
})
export class Ex13 {
  actions = Object.values(AuthActions).map(a => (a as any)().type);
}

// ─── INTERMEDIATE (14–26) ─────────────────────────────────────────────────────

// Ex14 – Counter actions/reducer/selectors
interface CounterState14 { count: number; step: number; }
const incBy14 = createAction<{ amount: number }>('[Ex14] IncBy');
const decBy14 = createAction<{ amount: number }>('[Ex14] DecBy');
const setStep14 = createAction<{ step: number }>('[Ex14] SetStep');

@Component({
  selector: 'ex-14', standalone: true, template: `
    <h4>Ex14 – Counter Actions/Reducer/Selectors</h4>
    <p>Count: {{ state.count }} | Step: {{ state.step }}</p>
    <button (click)="inc()">+</button>
    <button (click)="dec()">-</button>
    <button (click)="state.step = 5">Step=5</button>`
})
export class Ex14 {
  state: CounterState14 = { count: 0, step: 1 };
  inc() { this.state = { ...this.state, count: this.state.count + this.state.step }; }
  dec() { this.state = { ...this.state, count: this.state.count - this.state.step }; }
}

// Ex15 – Todo actions/reducer/selectors
interface TodoItem15 { id: number; text: string; done: boolean; }
interface TodoState15 { todos: TodoItem15[]; filter: 'all' | 'active' | 'done'; }

const addTodo15 = createAction<{ text: string }>('[Ex15] Add');
const toggleTodo15 = createAction<{ id: number }>('[Ex15] Toggle');

@Injectable({ providedIn: 'root' })
export class TodoStore15 {
  private _state = signal<TodoState15>({ todos: [], filter: 'all' });
  todos = computed(() => this._state().todos);
  filter = computed(() => this._state().filter);
  visible = computed(() => {
    const f = this.filter();
    return this.todos().filter(t => f === 'all' ? true : f === 'done' ? t.done : !t.done);
  });
  dispatch(action: any) {
    if (action.type === '[Ex15] Add') {
      this._state.update(s => ({ ...s, todos: [...s.todos, { id: Date.now(), text: action.payload.text, done: false }] }));
    }
    if (action.type === '[Ex15] Toggle') {
      this._state.update(s => ({ ...s, todos: s.todos.map((t: TodoItem15) => t.id === action.payload.id ? { ...t, done: !t.done } : t) }));
    }
  }
  setFilter(f: 'all' | 'active' | 'done') { this._state.update(s => ({ ...s, filter: f })); }
}

@Component({
  selector: 'ex-15', standalone: true, imports: [FormsModule], template: `
    <h4>Ex15 – Todo Actions/Reducer/Selectors</h4>
    <input #inp placeholder="New todo" />
    <button (click)="add(inp.value); inp.value=''">Add</button>
    <button (click)="store.setFilter('all')">All</button>
    <button (click)="store.setFilter('active')">Active</button>
    <button (click)="store.setFilter('done')">Done</button>
    @for (t of store.visible(); track t.id) {
      <p (click)="store.dispatch(toggle(t.id))"
         [style.text-decoration]="t.done ? 'line-through' : ''">{{ t.text }}</p>
    }`
})
export class Ex15 {
  store = inject(TodoStore15);
  add(text: string) { if (text) this.store.dispatch(addTodo15({ text })); }
  toggle(id: number) { return toggleTodo15({ id }); }
}

// Ex16 – Auth actions/reducer/selectors
interface AuthState16 { user: string | null; token: string | null; loading: boolean; }

@Injectable({ providedIn: 'root' })
export class AuthStore16 {
  private _state = signal<AuthState16>({ user: null, token: null, loading: false });
  user = computed(() => this._state().user);
  isLoggedIn = computed(() => !!this._state().token);
  loading = computed(() => this._state().loading);
  login(u: string) {
    this._state.update(s => ({ ...s, loading: true }));
    setTimeout(() => this._state.set({ user: u, token: 'tok123', loading: false }), 500);
  }
  logout() { this._state.set({ user: null, token: null, loading: false }); }
}

@Component({
  selector: 'ex-16', standalone: true, template: `
    <h4>Ex16 – Auth Actions/Reducer/Selectors</h4>
    @if (store.loading()) { <p>Logging in...</p> }
    @else if (store.isLoggedIn()) {
      <p>Welcome {{ store.user() }}</p>
      <button (click)="store.logout()">Logout</button>
    } @else {
      <button (click)="store.login('alice')">Login as Alice</button>
    }`
})
export class Ex16 {
  store = inject(AuthStore16);
}

// Ex17 – Feature state slice
interface ProductsState17 { items: string[]; loaded: boolean; }
interface CartState17 { cartItems: string[]; }
interface AppState17 { products: ProductsState17; cart: CartState17; }

const selectProducts17 = (s: AppState17) => s.products;
const selectCart17 = (s: AppState17) => s.cart;
const selectAllProducts17 = (s: AppState17) => selectProducts17(s).items;

@Component({
  selector: 'ex-17', standalone: true, template: `
    <h4>Ex17 – Feature State Slice</h4>
    <p>Products: {{ products }}</p>
    <p>Cart items: {{ cartCount }}</p>
    <button (click)="addToCart()">Add to Cart</button>`
})
export class Ex17 {
  state: AppState17 = {
    products: { items: ['Apple', 'Banana', 'Cherry'], loaded: true },
    cart: { cartItems: [] }
  };
  get products() { return selectAllProducts17(this.state).join(', '); }
  get cartCount() { return selectCart17(this.state).cartItems.length; }
  addToCart() { this.state.cart.cartItems.push('Apple'); this.state = { ...this.state }; }
}

// Ex18 – Selector composition
interface Ex18State { a: number; b: number; }
const selectA18 = (s: Ex18State) => s.a;
const selectB18 = (s: Ex18State) => s.b;
const selectSum18 = (s: Ex18State) => selectA18(s) + selectB18(s);
const selectProduct18 = (s: Ex18State) => selectA18(s) * selectB18(s);

@Component({
  selector: 'ex-18', standalone: true, template: `
    <h4>Ex18 – Selector Composition</h4>
    <p>a={{ a }}, b={{ b }}, sum={{ sum }}, product={{ product }}</p>
    <button (click)="state = {a: state.a+1, b: state.b}">a++</button>
    <button (click)="state = {a: state.a, b: state.b+1}">b++</button>`
})
export class Ex18 {
  state: Ex18State = { a: 3, b: 4 };
  get a() { return selectA18(this.state); }
  get b() { return selectB18(this.state); }
  get sum() { return selectSum18(this.state); }
  get product() { return selectProduct18(this.state); }
}

// Ex19 – Selector with multiple inputs
interface Ex19State { items: number[]; multiplier: number; }
const selectFiltered19 = (s: Ex19State) => s.items.filter(i => i % 2 === 0);
const selectTransformed19 = (s: Ex19State) => selectFiltered19(s).map(i => i * s.multiplier);

@Component({
  selector: 'ex-19', standalone: true, template: `
    <h4>Ex19 – Selector with Multiple Inputs</h4>
    <p>Even × {{ state.multiplier }}: {{ result }}</p>
    <button (click)="state = {...state, multiplier: state.multiplier + 1}">+Multiplier</button>`
})
export class Ex19 {
  state: Ex19State = { items: [1, 2, 3, 4, 5, 6], multiplier: 2 };
  get result() { return selectTransformed19(this.state).join(', '); }
}

// Ex20 – Action with error payload
const loadFail20 = createAction<{ message: string; code: number }>('[Ex20] Load Fail');

@Component({
  selector: 'ex-20', standalone: true, template: `
    <h4>Ex20 – Action with Error Payload</h4>
    <p>Error: {{ error | json }}</p>
    <button (click)="simulate()">Simulate Error</button>`
})
export class Ex20 {
  error: any = null;
  simulate() { this.error = loadFail20({ message: 'Not Found', code: 404 }).payload; }
}

// Ex21 – Reducer with immer pattern simulation
interface Ex21State { nested: { count: number; tags: string[] }; }
function immerLike<S>(s: S, fn: (draft: S) => void): S {
  const draft = JSON.parse(JSON.stringify(s));
  fn(draft);
  return draft;
}

@Component({
  selector: 'ex-21', standalone: true, template: `
    <h4>Ex21 – Reducer with Immer Pattern Simulation</h4>
    <p>Count: {{ state.nested.count }}, Tags: {{ state.nested.tags.join(', ') }}</p>
    <button (click)="update()">Update</button>`
})
export class Ex21 {
  state: Ex21State = { nested: { count: 0, tags: ['initial'] } };
  update() {
    this.state = immerLike(this.state, d => {
      d.nested.count++;
      d.nested.tags.push(`tag${d.nested.count}`);
    });
  }
}

// Ex22 – Feature module registration (simulated)
interface FeatureRegistry { [key: string]: any; }
const registry: FeatureRegistry = {};
function registerFeature(key: string, initialState: any) {
  registry[key] = initialState;
}

@Component({
  selector: 'ex-22', standalone: true, template: `
    <h4>Ex22 – Feature Module Registration</h4>
    <p>Registered features: {{ features }}</p>
    <button (click)="add()">Register Feature</button>`
})
export class Ex22 {
  features = Object.keys(registry).join(', ') || '(none)';
  add() {
    registerFeature('newFeature' + Date.now(), { loaded: false });
    this.features = Object.keys(registry).join(', ');
  }
  constructor() { registerFeature('auth', { user: null }); registerFeature('cart', { items: [] }); this.features = Object.keys(registry).join(', '); }
}

// Ex23 – Combined reducers
interface Ex23App { counter: { n: number }; flag: { on: boolean }; }
function combineReducers<S extends object>(map: { [K in keyof S]: (s: S[K], a: any) => S[K] }) {
  return (state: Partial<S> = {}, action: any): S => {
    const next: any = {};
    for (const key in map) { next[key] = map[key](state[key] as any, action); }
    return next;
  };
}

const root23 = combineReducers<Ex23App>({
  counter: (s = { n: 0 }, a) => a.type === '[23] inc' ? { n: s.n + 1 } : s,
  flag: (s = { on: false }, a) => a.type === '[23] toggle' ? { on: !s.on } : s,
});

@Component({
  selector: 'ex-23', standalone: true, template: `
    <h4>Ex23 – Combined Reducers</h4>
    <p>n={{ state.counter.n }}, flag={{ state.flag.on }}</p>
    <button (click)="dispatch('[23] inc')">+n</button>
    <button (click)="dispatch('[23] toggle')">Toggle</button>`
})
export class Ex23 {
  state = root23(undefined, { type: '@@INIT' });
  dispatch(type: string) { this.state = root23(this.state, { type }); }
}

// Ex24 – State reset
interface Ex24State { count: number; filter: string; }
const initialState24: Ex24State = { count: 0, filter: 'all' };

@Component({
  selector: 'ex-24', standalone: true, template: `
    <h4>Ex24 – State Reset</h4>
    <p>{{ state | json }}</p>
    <button (click)="state = {...state, count: state.count + 1}">+Count</button>
    <button (click)="state = {...initialState}">Reset</button>`
})
export class Ex24 {
  state: Ex24State = { ...initialState24 };
  initialState = initialState24;
}

// Ex25 – Selector with default value
interface Ex25State { name: string | null; }
const selectName25 = (s: Ex25State) => s.name ?? 'Anonymous';

@Component({
  selector: 'ex-25', standalone: true, template: `
    <h4>Ex25 – Selector with Default Value</h4>
    <p>Name: {{ name }}</p>
    <button (click)="toggle()">Toggle null/name</button>`
})
export class Ex25 {
  state: Ex25State = { name: null };
  get name() { return selectName25(this.state); }
  toggle() { this.state = { name: this.state.name ? null : 'Alice' }; }
}

// Ex26 – Selector factory pattern
function createByIdSelector<T extends { id: number }>(getAll: (s: any) => T[]) {
  return (id: number) => (s: any) => getAll(s).find((e: T) => e.id === id);
}

@Component({
  selector: 'ex-26', standalone: true, template: `
    <h4>Ex26 – Selector Factory Pattern</h4>
    <p>Selected: {{ selected | json }}</p>
    <button (click)="selectId(1)">Select 1</button>
    <button (click)="selectId(2)">Select 2</button>`
})
export class Ex26 {
  state = { users: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }] };
  selectUser = createByIdSelector((s: typeof this.state) => s.users);
  selected: any = null;
  selectId(id: number) { this.selected = this.selectUser(id)(this.state); }
}

// ─── NESTED (27–38) ───────────────────────────────────────────────────────────

// Ex27 – Multi-feature state
interface Ex27App {
  users: { list: string[]; loading: boolean };
  products: { list: string[]; loading: boolean };
  ui: { sidebarOpen: boolean };
}

@Component({
  selector: 'ex-27', standalone: true, template: `
    <h4>Ex27 – Multi-Feature State</h4>
    <p>Users: {{ state.users.list.join(', ') }}</p>
    <p>Products: {{ state.products.list.join(', ') }}</p>
    <p>Sidebar: {{ state.ui.sidebarOpen }}</p>
    <button (click)="state = {...state, ui: {...state.ui, sidebarOpen: !state.ui.sidebarOpen}}">Toggle Sidebar</button>`
})
export class Ex27 {
  state: Ex27App = {
    users: { list: ['Alice', 'Bob'], loading: false },
    products: { list: ['Apple', 'Bread'], loading: false },
    ui: { sidebarOpen: false }
  };
}

// Ex28 – Cross-feature selectors
interface Ex28App {
  auth: { userId: number | null };
  users: { entities: Record<number, { id: number; name: string }> };
}

const selectCurrentUser28 = (s: Ex28App) =>
  s.auth.userId != null ? s.users.entities[s.auth.userId] : null;

@Component({
  selector: 'ex-28', standalone: true, template: `
    <h4>Ex28 – Cross-Feature Selectors</h4>
    <p>Current user: {{ currentUser | json }}</p>
    <button (click)="state = {...state, auth: {userId: 1}}">Login as 1</button>
    <button (click)="state = {...state, auth: {userId: null}}">Logout</button>`
})
export class Ex28 {
  state: Ex28App = {
    auth: { userId: null },
    users: { entities: { 1: { id: 1, name: 'Alice' }, 2: { id: 2, name: 'Bob' } } }
  };
  get currentUser() { return selectCurrentUser28(this.state); }
}

// Ex29 – State shape normalization
interface NormalizedState29 {
  ids: number[];
  entities: Record<number, { id: number; name: string }>;
}

function normalize29(items: { id: number; name: string }[]): NormalizedState29 {
  return {
    ids: items.map(i => i.id),
    entities: Object.fromEntries(items.map(i => [i.id, i]))
  };
}

@Component({
  selector: 'ex-29', standalone: true, template: `
    <h4>Ex29 – State Shape Normalization</h4>
    <p>IDs: {{ state.ids | json }}</p>
    <p>Alice: {{ state.entities[1] | json }}</p>`
})
export class Ex29 {
  state = normalize29([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]);
}

// Ex30 – Complex reducer (nested updates)
interface Ex30State {
  users: { id: number; profile: { name: string; verified: boolean } }[];
}

@Component({
  selector: 'ex-30', standalone: true, template: `
    <h4>Ex30 – Complex Reducer (Nested Updates)</h4>
    @for (u of state.users; track u.id) {
      <p>{{ u.profile.name }} - verified: {{ u.profile.verified }}
        <button (click)="verify(u.id)">Verify</button></p>
    }`
})
export class Ex30 {
  state: Ex30State = {
    users: [
      { id: 1, profile: { name: 'Alice', verified: false } },
      { id: 2, profile: { name: 'Bob', verified: false } }
    ]
  };
  verify(id: number) {
    this.state = {
      ...this.state,
      users: this.state.users.map(u =>
        u.id === id ? { ...u, profile: { ...u.profile, verified: true } } : u
      )
    };
  }
}

// Ex31 – Selector memoization chain
let callCount31 = 0;
const selectBase31 = (s: { n: number }) => s.n;
const selectExpensive31 = memoize((s: { n: number }) => { callCount31++; return s.n * s.n; });

@Component({
  selector: 'ex-31', standalone: true, template: `
    <h4>Ex31 – Selector Memoization Chain</h4>
    <p>n²={{ result }}, calls={{ calls }}</p>
    <button (click)="same()">Same state</button>
    <button (click)="change()">Change n</button>`
})
export class Ex31 {
  state = { n: 5 };
  result = 0; calls = 0;
  same() { this.result = selectExpensive31(this.state); this.calls = callCount31; }
  change() { this.state = { n: this.state.n + 1 }; this.result = selectExpensive31(this.state); this.calls = callCount31; }
}

// Ex32 – Action creator groups
const BookActions = {
  load: createAction('[Books] Load'),
  loadSuccess: createAction<{ books: string[] }>('[Books] Load Success'),
  loadFailure: createAction<{ error: string }>('[Books] Load Failure'),
  add: createAction<{ title: string }>('[Books] Add'),
  remove: createAction<{ id: number }>('[Books] Remove'),
};

@Component({
  selector: 'ex-32', standalone: true, template: `
    <h4>Ex32 – Action Creator Groups</h4>
    @for (a of actionTypes; track a) { <p>{{ a }}</p> }`
})
export class Ex32 {
  actionTypes = Object.values(BookActions).map((c: any) => c().type);
}

// Ex33 – Action tagging for debugging
function taggedAction<P>(type: string, source: string) {
  return (payload?: P) => ({ type, payload, _meta: { source, ts: Date.now() } });
}

const trackedLogin33 = taggedAction<{ user: string }>('[Auth] Login', 'LoginComponent');

@Component({
  selector: 'ex-33', standalone: true, template: `
    <h4>Ex33 – Action Tagging for Debugging</h4>
    <pre>{{ action | json }}</pre>
    <button (click)="dispatch()">Dispatch</button>`
})
export class Ex33 {
  action: any = null;
  dispatch() { this.action = trackedLogin33({ user: 'alice' }); }
}

// Ex34 – State with loading/error metadata
interface AsyncState34<T> { data: T | null; loading: boolean; error: string | null; loaded: boolean; }
function initialAsync34<T>(): AsyncState34<T> { return { data: null, loading: false, error: null, loaded: false }; }

@Component({
  selector: 'ex-34', standalone: true, template: `
    <h4>Ex34 – State with Loading/Error Metadata</h4>
    <p>loading={{ state.loading }}, loaded={{ state.loaded }}, error={{ state.error }}</p>
    <p>data={{ state.data | json }}</p>
    <button (click)="load(true)">Load OK</button>
    <button (click)="load(false)">Load Error</button>`
})
export class Ex34 {
  state = initialAsync34<string[]>();
  load(ok: boolean) {
    this.state = { ...this.state, loading: true, error: null };
    setTimeout(() => {
      this.state = ok
        ? { data: ['a', 'b'], loading: false, error: null, loaded: true }
        : { data: null, loading: false, error: 'Failed', loaded: false };
    }, 500);
  }
}

// Ex35 – Optimistic update pattern
interface Post35 { id: number; title: string; }

@Component({
  selector: 'ex-35', standalone: true, template: `
    <h4>Ex35 – Optimistic Update Pattern</h4>
    @for (p of posts; track p.id) { <p>{{ p.title }}</p> }
    <button (click)="update(1)">Optimistic Update #1</button>`
})
export class Ex35 {
  posts: Post35[] = [{ id: 1, title: 'Original' }, { id: 2, title: 'Second' }];
  snapshot: Post35[] = [];
  update(id: number) {
    this.snapshot = [...this.posts];
    this.posts = this.posts.map(p => p.id === id ? { ...p, title: 'Optimistic' } : p);
    setTimeout(() => {
      // simulate failure → rollback
      this.posts = this.snapshot;
    }, 1500);
  }
}

// Ex36 – CRUD state (list + selected + loading)
interface Ex36Item { id: number; name: string; }
interface Ex36State { items: Ex36Item[]; selected: Ex36Item | null; loading: boolean; }

@Component({
  selector: 'ex-36', standalone: true, template: `
    <h4>Ex36 – CRUD State (list + selected + loading)</h4>
    @for (i of state.items; track i.id) {
      <p (click)="select(i)" style="cursor:pointer"
         [style.font-weight]="state.selected?.id === i.id ? 'bold' : 'normal'">
        {{ i.name }} <button (click)="del(i.id)">del</button></p>
    }
    <p>Selected: {{ state.selected?.name ?? 'none' }}</p>
    <button (click)="add()">Add</button>`
})
export class Ex36 {
  state: Ex36State = {
    items: [{ id: 1, name: 'Item A' }, { id: 2, name: 'Item B' }],
    selected: null, loading: false
  };
  add() { this.state = { ...this.state, items: [...this.state.items, { id: Date.now(), name: `Item ${this.state.items.length + 1}` }] }; }
  select(i: Ex36Item) { this.state = { ...this.state, selected: i }; }
  del(id: number) { this.state = { ...this.state, items: this.state.items.filter(i => i.id !== id), selected: null }; }
}

// ─── ADVANCED (37–50) ─────────────────────────────────────────────────────────

// Ex37 – Entity-like state without adapter
interface Ex37Entity { id: number; name: string; }
interface EntityLikeState37 { ids: number[]; entities: Record<number, Ex37Entity>; }

function entityAdd37(state: EntityLikeState37, entity: Ex37Entity): EntityLikeState37 {
  return { ids: [...state.ids, entity.id], entities: { ...state.entities, [entity.id]: entity } };
}
function entityRemove37(state: EntityLikeState37, id: number): EntityLikeState37 {
  const { [id]: _, ...rest } = state.entities;
  return { ids: state.ids.filter(i => i !== id), entities: rest };
}

@Component({
  selector: 'ex-37', standalone: true, template: `
    <h4>Ex37 – Entity-Like State Without Adapter</h4>
    @for (id of state.ids; track id) {
      <p>{{ state.entities[id].name }}
        <button (click)="del(id)">del</button></p>
    }
    <button (click)="add()">Add</button>`
})
export class Ex37 {
  state: EntityLikeState37 = { ids: [], entities: {} };
  add() { const id = Date.now(); this.state = entityAdd37(this.state, { id, name: `Entity ${this.state.ids.length + 1}` }); }
  del(id: number) { this.state = entityRemove37(this.state, id); }
}

// Ex38 – Full counter app simulation
interface Ex38State { count: number; history: number[]; }

@Component({
  selector: 'ex-38', standalone: true, template: `
    <h4>Ex38 – Full Counter App Simulation</h4>
    <p>Count: {{ state.count }}</p>
    <p>History: {{ state.history.join(' → ') }}</p>
    <button (click)="dispatch('inc')">+1</button>
    <button (click)="dispatch('dec')">-1</button>
    <button (click)="dispatch('x2')">×2</button>
    <button (click)="dispatch('reset')">Reset</button>`
})
export class Ex38 {
  state: Ex38State = { count: 0, history: [0] };
  dispatch(type: string) {
    let count = this.state.count;
    if (type === 'inc') count++;
    else if (type === 'dec') count--;
    else if (type === 'x2') count *= 2;
    else count = 0;
    this.state = { count, history: [...this.state.history, count] };
  }
}

// Ex39 – Typed state with generics
interface AsyncSlice39<T> { data: T | null; status: 'idle' | 'loading' | 'success' | 'error'; }
function createAsyncSlice39<T>(data: T | null = null): AsyncSlice39<T> {
  return { data, status: 'idle' };
}

@Component({
  selector: 'ex-39', standalone: true, template: `
    <h4>Ex39 – Typed State with Generics</h4>
    <p>Users: {{ usersSlice.status }} - {{ usersSlice.data | json }}</p>
    <p>Config: {{ configSlice.status }} - {{ configSlice.data | json }}</p>
    <button (click)="loadUsers()">Load Users</button>`
})
export class Ex39 {
  usersSlice = createAsyncSlice39<string[]>();
  configSlice = createAsyncSlice39<{ theme: string }>({ theme: 'light' });
  loadUsers() {
    this.usersSlice = { ...this.usersSlice, status: 'loading' };
    setTimeout(() => { this.usersSlice = { data: ['Alice', 'Bob'], status: 'success' }; }, 500);
  }
}

// Ex40 – State serialization
interface Ex40State { count: number; items: string[]; }

@Component({
  selector: 'ex-40', standalone: true, template: `
    <h4>Ex40 – State Serialization</h4>
    <p>{{ state | json }}</p>
    <button (click)="save()">Save to LS</button>
    <button (click)="load()">Load from LS</button>
    <button (click)="state.count++">Mutate</button>`
})
export class Ex40 {
  state: Ex40State = { count: 0, items: ['a', 'b'] };
  save() { localStorage.setItem('ex40', JSON.stringify(this.state)); }
  load() {
    const s = localStorage.getItem('ex40');
    if (s) this.state = JSON.parse(s);
  }
}

// Ex41 – State migration
interface V1State41 { name: string; }
interface V2State41 { firstName: string; lastName: string; version: 2; }

function migrate41(raw: any): V2State41 {
  if (!raw.version || raw.version < 2) {
    const [firstName, ...rest] = (raw.name ?? '').split(' ');
    return { firstName, lastName: rest.join(' ') || 'Unknown', version: 2 };
  }
  return raw as V2State41;
}

@Component({
  selector: 'ex-41', standalone: true, template: `
    <h4>Ex41 – State Migration</h4>
    <p>Migrated: {{ migrated | json }}</p>`
})
export class Ex41 {
  v1: V1State41 = { name: 'Alice Wonderland' };
  migrated = migrate41(this.v1);
}

// Ex42 – DevTools integration concept
const devToolsLog: any[] = [];
function withDevTools<S>(reducer: (s: S, a: any) => S) {
  return (s: S, a: any): S => {
    const next = reducer(s, a);
    devToolsLog.push({ action: a, state: next, ts: Date.now() });
    return next;
  };
}

interface Ex42State { count: number; }
const rawReducer42 = (s: Ex42State = { count: 0 }, a: any): Ex42State =>
  a.type === '[42] inc' ? { count: s.count + 1 } : s;
const devReducer42 = withDevTools(rawReducer42);

@Component({
  selector: 'ex-42', standalone: true, template: `
    <h4>Ex42 – DevTools Integration Concept</h4>
    <p>Count: {{ state.count }}</p>
    <p>Log entries: {{ logLen }}</p>
    <button (click)="dispatch()">Dispatch</button>`
})
export class Ex42 {
  state: Ex42State = { count: 0 };
  logLen = 0;
  dispatch() {
    this.state = devReducer42(this.state, { type: '[42] inc' });
    this.logLen = devToolsLog.length;
  }
}

// Ex43 – Action metadata/source
function actionWithMeta(type: string, source: string, payload?: any) {
  return { type, payload, _meta: { source, timestamp: new Date().toISOString(), version: 1 } };
}

@Component({
  selector: 'ex-43', standalone: true, template: `
    <h4>Ex43 – Action Metadata/Source</h4>
    <pre>{{ action | json }}</pre>
    <button (click)="dispatch()">Dispatch with Meta</button>`
})
export class Ex43 {
  action: any = null;
  dispatch() { this.action = actionWithMeta('[User] Update', 'ProfileComponent', { name: 'Alice' }); }
}

// Ex44 – Selector benchmarking
@Component({
  selector: 'ex-44', standalone: true, template: `
    <h4>Ex44 – Selector Benchmarking</h4>
    <p>Memoized calls: {{ memo }}, Non-memo calls: {{ nonMemo }}</p>
    <button (click)="bench()">Run Bench (×100)</button>`
})
export class Ex44 {
  memo = 0; nonMemo = 0;
  state = { items: Array.from({ length: 1000 }, (_, i) => i) };
  memoizedSum = memoize((s: typeof this.state) => s.items.reduce((a, b) => a + b, 0));
  rawSum(s: typeof this.state) { return s.items.reduce((a, b) => a + b, 0); }
  bench() {
    let m = 0, n = 0;
    for (let i = 0; i < 100; i++) { this.memoizedSum(this.state); m++; }
    for (let i = 0; i < 100; i++) { this.rawSum(this.state); n++; }
    this.memo = m; this.nonMemo = n;
  }
}

// Ex45 – State hydration
@Component({
  selector: 'ex-45', standalone: true, template: `
    <h4>Ex45 – State Hydration</h4>
    <p>Hydrated from server: {{ state | json }}</p>
    <button (click)="hydrate()">Hydrate</button>`
})
export class Ex45 {
  state: any = null;
  hydrate() {
    const serverState = '{"user":"Alice","prefs":{"theme":"dark"},"version":1}';
    this.state = JSON.parse(serverState);
  }
}

// Ex46 – Meta-reducers concept
type MetaReducer46<S> = (reducer: (s: S, a: any) => S) => (s: S, a: any) => S;
const logger46: MetaReducer46<any> = (reducer) => (state, action) => {
  console.log('[Meta] before:', state);
  const next = reducer(state, action);
  console.log('[Meta] after:', next);
  return next;
};
const freezer46: MetaReducer46<any> = (reducer) => (state, action) => {
  return Object.freeze(reducer(state, action));
};

function composeMetaReducers46<S>(...metas: MetaReducer46<S>[]) {
  return (reducer: (s: S, a: any) => S) => metas.reduce((r, m) => m(r), reducer);
}

@Component({
  selector: 'ex-46', standalone: true, template: `
    <h4>Ex46 – Meta-Reducers Concept</h4>
    <p>State: {{ state | json }}</p>
    <button (click)="dispatch()">Dispatch (check console)</button>`
})
export class Ex46 {
  baseReducer = (s: any = { n: 0 }, a: any) => a.type === '[46]' ? { n: s.n + 1 } : s;
  reducer = composeMetaReducers46(logger46)(this.baseReducer);
  state: any = { n: 0 };
  dispatch() { this.state = this.reducer(this.state, { type: '[46]' }); }
}

// Ex47 – State versioning
interface VersionedState47 { data: any; _v: number; _updatedAt: string; }
function versionedUpdate47(state: VersionedState47, patch: any): VersionedState47 {
  return { ...state, ...patch, _v: state._v + 1, _updatedAt: new Date().toISOString() };
}

@Component({
  selector: 'ex-47', standalone: true, template: `
    <h4>Ex47 – State Versioning</h4>
    <p>v={{ state._v }} | updatedAt={{ state._updatedAt }}</p>
    <p>data={{ state.data | json }}</p>
    <button (click)="update()">Update</button>`
})
export class Ex47 {
  state: VersionedState47 = { data: { count: 0 }, _v: 0, _updatedAt: '' };
  update() { this.state = versionedUpdate47(this.state, { data: { count: this.state.data.count + 1 } }); }
}

// Ex48 – Action bus pattern
import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ActionBus48 {
  private bus = new Subject<any>();
  dispatch(action: any) { this.bus.next(action); }
  ofType(type: string) { return this.bus.pipe(filter((a: any) => a.type === type)); }
}

@Component({
  selector: 'ex-48', standalone: true, template: `
    <h4>Ex48 – Action Bus Pattern</h4>
    <p>Received: {{ received.join(', ') }}</p>
    <button (click)="send('ping')">Ping</button>
    <button (click)="send('pong')">Pong</button>`
})
export class Ex48 {
  received: string[] = [];
  bus = inject(ActionBus48);
  constructor() {
    this.bus.ofType('[Ex48] ping').subscribe(() => this.received.push('ping'));
    this.bus.ofType('[Ex48] pong').subscribe(() => this.received.push('pong'));
  }
  send(t: string) { this.bus.dispatch({ type: `[Ex48] ${t}` }); }
}

// Ex49 – Performance-optimized selectors
@Component({
  selector: 'ex-49', standalone: true, template: `
    <h4>Ex49 – Performance-Optimized Selectors</h4>
    <p>Active users: {{ activeNames }}</p>
    <button (click)="toggle(1)">Toggle User 1</button>`
})
export class Ex49 {
  state = {
    users: [
      { id: 1, name: 'Alice', active: true },
      { id: 2, name: 'Bob', active: false },
      { id: 3, name: 'Carol', active: true }
    ]
  };
  selectActive = memoize((s: typeof this.state) => s.users.filter(u => u.active));
  selectNames = memoize((s: typeof this.state) => this.selectActive(s).map(u => u.name));
  get activeNames() { return this.selectNames(this.state).join(', '); }
  toggle(id: number) {
    this.state = { users: this.state.users.map(u => u.id === id ? { ...u, active: !u.active } : u) };
  }
}

// Ex50 – Full app state architecture
interface User50 { id: number; name: string; }
interface Order50 { id: number; userId: number; total: number; }
interface AppState50 {
  auth: { user: User50 | null; token: string | null };
  orders: { list: Order50[]; loading: boolean };
  ui: { theme: string; notifications: string[] };
}

@Injectable({ providedIn: 'root' })
export class AppStore50 {
  private _state = signal<AppState50>({
    auth: { user: null, token: null },
    orders: { list: [], loading: false },
    ui: { theme: 'light', notifications: [] }
  });
  state = this._state.asReadonly();
  currentUser = computed(() => this._state().auth.user);
  orders = computed(() => this._state().orders.list);
  totalRevenue = computed(() => this._state().orders.list.reduce((s, o) => s + o.total, 0));
  login(user: User50) { this._state.update(s => ({ ...s, auth: { user, token: 'tok' } })); }
  addOrder(o: Order50) { this._state.update(s => ({ ...s, orders: { ...s.orders, list: [...s.orders.list, o] } })); }
  notify(msg: string) { this._state.update(s => ({ ...s, ui: { ...s.ui, notifications: [...s.ui.notifications, msg] } })); }
}

@Component({
  selector: 'ex-50', standalone: true, template: `
    <h4>Ex50 – Full App State Architecture</h4>
    <p>User: {{ store.currentUser()?.name ?? 'Guest' }}</p>
    <p>Orders: {{ store.orders().length }} | Revenue: ${{ store.totalRevenue() }}</p>
    <p>Notifs: {{ store.state().ui.notifications.length }}</p>
    <button (click)="store.login({id:1, name:'Alice'})">Login</button>
    <button (click)="store.addOrder({id: store.orders().length+1, userId:1, total:50})">Add Order</button>
    <button (click)="store.notify('Hello')">Notify</button>`
})
export class Ex50 {
  store = inject(AppStore50);
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
    CommonModule
  ],
  template: `
    <h2>Phase 7 – NgRx Basics</h2>
    <ex-01 /><hr />
    <ex-02 /><hr />
    <ex-03 /><hr />
    <ex-04 /><hr />
    <ex-05 /><hr />
    <ex-06 /><hr />
    <ex-07 /><hr />
    <ex-08 /><hr />
    <ex-09 /><hr />
    <ex-10 /><hr />
    <ex-11 /><hr />
    <ex-12 /><hr />
    <ex-13 /><hr />
    <ex-14 /><hr />
    <ex-15 /><hr />
    <ex-16 /><hr />
    <ex-17 /><hr />
    <ex-18 /><hr />
    <ex-19 /><hr />
    <ex-20 /><hr />
    <ex-21 /><hr />
    <ex-22 /><hr />
    <ex-23 /><hr />
    <ex-24 /><hr />
    <ex-25 /><hr />
    <ex-26 /><hr />
    <ex-27 /><hr />
    <ex-28 /><hr />
    <ex-29 /><hr />
    <ex-30 /><hr />
    <ex-31 /><hr />
    <ex-32 /><hr />
    <ex-33 /><hr />
    <ex-34 /><hr />
    <ex-35 /><hr />
    <ex-36 /><hr />
    <ex-37 /><hr />
    <ex-38 /><hr />
    <ex-39 /><hr />
    <ex-40 /><hr />
    <ex-41 /><hr />
    <ex-42 /><hr />
    <ex-43 /><hr />
    <ex-44 /><hr />
    <ex-45 /><hr />
    <ex-46 /><hr />
    <ex-47 /><hr />
    <ex-48 /><hr />
    <ex-49 /><hr />
    <ex-50 /><hr />
  `
})
export class AppComponent {}
