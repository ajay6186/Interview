import { Component, signal, computed, effect, DestroyRef, inject } from '@angular/core';

// ============================================================
// Examples 5.4 — NgRx ComponentStore (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================
// NOTE: Simulates ComponentStore patterns using signal-based classes.
// ─── BASIC (1–13) ───────────────────────────────────────────

// 1. ComponentStore class pattern — basic class with state signal
@Component({
  selector: 'ex-01', standalone: true,
  template: `
    <p><strong>ComponentStore class pattern (signal simulation):</strong></p>
    <pre>
// ComponentStore is a class-based local state manager.
// Signal simulation:
class CounterStore {{ '{' }}
  // State signal holds the full state object
  private state = signal({{ '{' }} count: 0 {{ '}' }});

  // Public read-only selector
  count = computed(() => this.state().count);

  increment() {{ '{' }} this.state.update(s => ({{ '{' }} ...s, count: s.count + 1 {{ '}' }})); {{ '}' }}
  decrement() {{ '{' }} this.state.update(s => ({{ '{' }} ...s, count: s.count - 1 {{ '}' }})); {{ '}' }}
{{ '}' }}</pre>
    <p>Count: <strong>{{ store.count() }}</strong></p>
    <button (click)="store.increment()">+</button>
    <button (click)="store.decrement()">-</button>
  `
})
class Ex01 {
  store = new class {
    private state = signal({ count: 0 });
    count = computed(() => this.state().count);
    increment() { this.state.update(s => ({ ...s, count: s.count + 1 })); }
    decrement() { this.state.update(s => ({ ...s, count: s.count - 1 })); }
  }();
}

// 2. State interface definition
@Component({
  selector: 'ex-02', standalone: true,
  template: `
    <p><strong>State interface definition:</strong></p>
    <pre>
// Always define a typed interface for your state:
interface ProductsState {{ '{' }}
  items:     Product[];
  isLoading: boolean;
  error:     string | null;
  selected:  Product | null;
  total:     number;
{{ '}' }}

// Initial state object matches the interface exactly:
const initialState: ProductsState = {{ '{' }}
  items:     [],
  isLoading: false,
  error:     null,
  selected:  null,
  total:     0,
{{ '}' }};

class ProductsStore {{ '{' }}
  private state = signal&lt;ProductsState&gt;(initialState);
{{ '}' }}</pre>
  `
})
class Ex02 {}

// 3. State signal initialization in constructor
@Component({
  selector: 'ex-03', standalone: true,
  template: `
    <p><strong>State signal initialization (constructor + optional initial override):</strong></p>
    <pre>
interface TodoState {{ '{' }} items: string[]; loading: boolean; {{ '}' }}

class TodoStore {{ '{' }}
  private state: WritableSignal&lt;TodoState&gt;;

  constructor(initialOverride?: Partial&lt;TodoState&gt;) {{ '{' }}
    this.state = signal&lt;TodoState&gt;({{ '{' }}
      items:   [],
      loading: false,
      ...initialOverride     // allows initializing with pre-loaded state
    {{ '}' }});
  {{ '}' }}
{{ '}' }}</pre>
    <p>Items: <strong>{{ items().join(', ') || '(none)' }}</strong></p>
    <button (click)="addItem()">Add Item</button>
  `
})
class Ex03 {
  private state = signal({ items: [] as string[], loading: false });
  items = computed(() => this.state().items);
  addItem() { this.state.update(s => ({ ...s, items: [...s.items, `Item ${s.items.length + 1}`] })); }
}

// 4. select() via computed signal
@Component({
  selector: 'ex-04', standalone: true,
  template: `
    <p><strong>select() — derived signals from state (computed):</strong></p>
    <pre>
class AppStore {{ '{' }}
  private state = signal({{ '{' }} users: User[], filter: string {{ '}' }});

  // select() is equivalent to computed():
  allUsers      = computed(() => this.state().users);
  filter        = computed(() => this.state().filter);
  filteredUsers = computed(() =>
    this.allUsers().filter(u => u.name.includes(this.filter()))
  );
  totalCount    = computed(() => this.allUsers().length);
  activeCount   = computed(() => this.allUsers().filter(u => u.active).length);
{{ '}' }}</pre>
    <p>Filter: <input [value]="filter()" (input)="setFilter($event)" style="padding:2px 6px" /></p>
    <p>Showing: <strong>{{ filtered() }}</strong> / {{ total() }} users</p>
  `
})
class Ex04 {
  private state = signal({ users: ['Alice', 'Bob', 'Charlie', 'Diana'], filter: '' });
  filter   = computed(() => this.state().filter);
  total    = computed(() => this.state().users.length);
  filtered = computed(() => {
    const f = this.filter().toLowerCase();
    return f ? this.state().users.filter(u => u.toLowerCase().includes(f)).length : this.total();
  });
  setFilter(e: Event) { this.state.update(s => ({ ...s, filter: (e.target as HTMLInputElement).value })); }
}

// 5. updater() — method that patches state
@Component({
  selector: 'ex-05', standalone: true,
  template: `
    <p><strong>updater() — typed method that updates state:</strong></p>
    <pre>
// In real ComponentStore:
setFilter = this.updater((state, filter: string) => ({{ '{' }} ...state, filter {{ '}' }}));
setPage   = this.updater((state, page: number)   => ({{ '{' }} ...state, page {{ '}' }}));

// Signal equivalent — typed updater methods:
class ProductsStore {{ '{' }}
  private state = signal({{ '{' }} filter: '', page: 1, sort: 'name' {{ '}' }});

  setFilter = (filter: string) => this.state.update(s => ({{ '{' }} ...s, filter, page: 1 {{ '}' }}));
  setPage   = (page: number)   => this.state.update(s => ({{ '{' }} ...s, page {{ '}' }}));
  setSort   = (sort: string)   => this.state.update(s => ({{ '{' }} ...s, sort {{ '}' }}));
{{ '}' }}</pre>
    <p>Filter: <strong>{{ filter() }}</strong> | Page: <strong>{{ page() }}</strong></p>
    <input (input)="setFilter($event)" placeholder="Set filter" style="padding:2px 6px" />
  `
})
class Ex05 {
  private state = signal({ filter: '', page: 1, sort: 'name' });
  filter = computed(() => this.state().filter);
  page   = computed(() => this.state().page);
  setFilter(e: Event) { this.state.update(s => ({ ...s, filter: (e.target as HTMLInputElement).value, page: 1 })); }
}

// 6. effect() — method with side effects
@Component({
  selector: 'ex-06', standalone: true,
  template: `
    <p><strong>effect() — side effects reacting to state changes:</strong></p>
    <pre>
// In real ComponentStore, effect() wraps an Observable.
// Signal simulation using Angular's effect():

class SearchStore {{ '{' }}
  query = signal('');
  results = signal&lt;string[]&gt;([]);
  loading = signal(false);

  constructor() {{ '{' }}
    effect(() => {{ '{' }}
      const q = this.query();
      if (!q) {{ '{' }} this.results.set([]); return; {{ '}' }}
      this.loading.set(true);
      // Simulate HTTP call
      setTimeout(() => {{ '{' }}
        this.results.set(['Result 1 for ' + q, 'Result 2 for ' + q]);
        this.loading.set(false);
      {{ '}' }}, 300);
    {{ '}' }});
  {{ '}' }}
{{ '}' }}</pre>
    <p>Log: <strong>{{ log() }}</strong></p>
    <button (click)="trigger()">Trigger Effect</button>
  `
})
class Ex06 {
  count = signal(0);
  log = signal('idle');
  constructor() {
    effect(() => {
      if (this.count() > 0) this.log.set(`Effect ran: count=${this.count()}`);
    });
  }
  trigger() { this.count.update(c => c + 1); }
}

// 7. setState() — replace full state
@Component({
  selector: 'ex-07', standalone: true,
  template: `
    <p><strong>setState() — replace the entire state object:</strong></p>
    <pre>
// In real ComponentStore: this.setState(newState)
// Signal equivalent: state.set(newState)

class FormStore {{ '{' }}
  private state = signal({{ '{' }} name: '', email: '', age: 0 {{ '}' }});

  // Replace entire state (like form reset to initial):
  setState(newState: typeof this.state) {{ '{' }}
    this.state.set(newState);
  {{ '}' }}

  reset() {{ '{' }}
    this.setState({{ '{' }} name: '', email: '', age: 0 {{ '}' }});
  {{ '}' }}
{{ '}' }}</pre>
    <p>Name: <strong>{{ name() }}</strong> | Email: <strong>{{ email() }}</strong></p>
    <button (click)="loadUser()">Load User</button>
    <button (click)="reset()">Reset (setState)</button>
  `
})
class Ex07 {
  private state = signal({ name: '', email: '', age: 0 });
  name  = computed(() => this.state().name);
  email = computed(() => this.state().email);
  loadUser() { this.state.set({ name: 'Alice', email: 'alice@example.com', age: 28 }); }
  reset()    { this.state.set({ name: '', email: '', age: 0 }); }
}

// 8. patchState() — spread partial update
@Component({
  selector: 'ex-08', standalone: true,
  template: `
    <p><strong>patchState() — partial state update (spread):</strong></p>
    <pre>
// In real ComponentStore: this.patchState({{ '{' }} isLoading: true {{ '}' }})
// Signal equivalent:
patchState(patch: Partial&lt;State&gt;) {{ '{' }}
  this.state.update(s => ({{ '{' }} ...s, ...patch {{ '}' }}));
{{ '}' }}

// Usage:
this.patchState({{ '{' }} isLoading: true {{ '}' }});          // only changes isLoading
this.patchState({{ '{' }} items: data, isLoading: false {{ '}' }}); // changes two fields
this.patchState({{ '{' }} error: 'Network error' {{ '}' }});    // only changes error</pre>
    <p>Loading: <strong>{{ loading() }}</strong> | Error: <strong>{{ error() || 'none' }}</strong></p>
    <button (click)="patch({ loading: true, error: '' })">Start Loading</button>
    <button (click)="patch({ loading: false, error: 'Failed' })">Fail</button>
    <button (click)="patch({ loading: false, error: '' })">Reset</button>
  `
})
class Ex08 {
  private state = signal({ loading: false, error: '', data: null as string | null });
  loading = computed(() => this.state().loading);
  error   = computed(() => this.state().error);
  patch(p: Partial<{ loading: boolean; error: string; data: string | null }>) {
    this.state.update(s => ({ ...s, ...p }));
  }
}

// 9. View model (vm) computed signal
@Component({
  selector: 'ex-09', standalone: true,
  template: `
    <p><strong>View model (vm$) pattern — combined computed signal:</strong></p>
    <pre>
// In real ComponentStore: vm$ = combineLatest([...])
// Signal equivalent: one combined computed for the template

class ProductsStore {{ '{' }}
  private state = signal({{ '{' }} items: [], loading: false, error: null, page: 1 {{ '}' }});
  vm = computed(() => ({{ '{' }}
    items:    this.state().items,
    loading:  this.state().loading,
    error:    this.state().error,
    isEmpty:  this.state().items.length === 0 &amp;&amp; !this.state().loading,
    page:     this.state().page,
  {{ '}' }}));
{{ '}' }}

// Template: bind once to vm() and destructure
// &#64;if (vm().loading) {{ '{' }} ... {{ '}' }}
// &#64;for (item of vm().items; ...</pre>
    <p>vm: items={{ vm().count }}, loading={{ vm().loading }}, empty={{ vm().empty }}</p>
    <button (click)="toggle()">Toggle Loading</button>
  `
})
class Ex09 {
  private state = signal({ count: 3, loading: false });
  vm = computed(() => ({
    count:   this.state().count,
    loading: this.state().loading,
    empty:   this.state().count === 0,
  }));
  toggle() { this.state.update(s => ({ ...s, loading: !s.loading })); }
}

// 10. tapResponse pattern (success + error handlers)
@Component({
  selector: 'ex-10', standalone: true,
  template: `
    <p><strong>tapResponse pattern — handle success and error:</strong></p>
    <pre>
// Real ComponentStore uses tapResponse() operator:
loadProducts = this.effect((trigger$: Observable&lt;void&gt;) =>
  trigger$.pipe(
    switchMap(() => this.productService.getAll().pipe(
      tapResponse(
        (products) => this.patchState({{ '{' }} products, loading: false {{ '}' }}),
        (error)    => this.patchState({{ '{' }} error: error.message, loading: false {{ '}' }})
      )
    ))
  )
);

// Signal simulation — same success/error split:
async load() {{ '{' }}
  this.patchState({{ '{' }} loading: true, error: null {{ '}' }});
  try {{ '{' }}
    const items = await this.api.getAll();       // success path
    this.patchState({{ '{' }} items, loading: false {{ '}' }});
  {{ '}' }} catch(e: any) {{ '{' }}
    this.patchState({{ '{' }} error: e.message, loading: false {{ '}' }}); // error path
  {{ '}' }}
{{ '}' }}</pre>
    <p>Status: <strong>{{ status() }}</strong></p>
    <button (click)="simulateSuccess()">Load (success)</button>
    <button (click)="simulateError()">Load (error)</button>
  `
})
class Ex10 {
  private state = signal({ loading: false, error: '', items: [] as string[] });
  status = computed(() => {
    if (this.state().loading) return 'Loading...';
    if (this.state().error)   return `Error: ${this.state().error}`;
    return this.state().items.length ? `Loaded ${this.state().items.length} items` : 'Idle';
  });
  simulateSuccess() {
    this.state.update(s => ({ ...s, loading: true, error: '' }));
    setTimeout(() => this.state.update(s => ({ ...s, loading: false, items: ['Item A', 'Item B'] })), 500);
  }
  simulateError() {
    this.state.update(s => ({ ...s, loading: true, error: '' }));
    setTimeout(() => this.state.update(s => ({ ...s, loading: false, error: 'Network error' })), 500);
  }
}

// 11. Store provided in component providers array
@Component({
  selector: 'ex-11', standalone: true,
  template: `
    <p><strong>ComponentStore provided in component — scoped to component tree:</strong></p>
    <pre>
// Store class:
@Injectable()
class TodoStore {{ '{' }}
  private state = signal({{ '{' }} items: [] as string[] {{ '}' }});
  items = computed(() => this.state().items);
  add(item: string) {{ '{' }} this.state.update(s => ({{ '{' }} ...s, items: [...s.items, item] {{ '}' }})); {{ '}' }}
{{ '}' }}

// Component: provide store here — each instance gets its OWN store
@Component({{ '{' }}
  selector: 'todo-feature',
  providers: [TodoStore],   // &lt;— scoped store instance
  template: \`...\`
{{ '}' }})
class TodoFeatureComponent {{ '{' }}
  store = inject(TodoStore);
{{ '}' }}</pre>
    <p>The store is destroyed when this component is destroyed — automatic cleanup.</p>
  `
})
class Ex11 {}

// 12. Store as singleton service
@Component({
  selector: 'ex-12', standalone: true,
  template: `
    <p><strong>ComponentStore as singleton (providedIn: 'root'):</strong></p>
    <pre>
// Singleton — shared across the entire app:
@Injectable({{ '{' }} providedIn: 'root' {{ '}' }})
class GlobalCartStore {{ '{' }}
  private state = signal({{ '{' }} items: [], total: 0 {{ '}' }});
  items  = computed(() => this.state().items);
  total  = computed(() => this.state().total);
{{ '}' }}

// Scoped to a route/feature:
@Injectable()
class FeatureStore {{ '{' }} ... {{ '}' }}
// Provide in route:
{{ '{' }} path: 'feature', component: FeatureComponent,
  providers: [FeatureStore] {{ '}' }}

// Guideline:
// - Use root singleton for global state (cart, auth, theme)
// - Use component providers for feature-local state</pre>
  `
})
class Ex12 {}

// 13. Destroy cleanup with DestroyRef
@Component({
  selector: 'ex-13', standalone: true,
  template: `
    <p><strong>Cleanup on destroy using DestroyRef:</strong></p>
    <pre>
@Injectable()
class PollingStore {{ '{' }}
  private destroyRef = inject(DestroyRef);
  data = signal&lt;string[]&gt;([]);
  private intervalId?: ReturnType&lt;typeof setInterval&gt;;

  constructor() {{ '{' }}
    this.startPolling();
    // Register cleanup — runs when parent component is destroyed
    this.destroyRef.onDestroy(() => {{ '{' }}
      clearInterval(this.intervalId);
      console.log('Store cleaned up');
    {{ '}' }});
  {{ '}' }}

  private startPolling() {{ '{' }}
    this.intervalId = setInterval(() => this.refresh(), 5000);
  {{ '}' }}
  private refresh() {{ '{' }} /* fetch data */ {{ '}' }}
{{ '}' }}</pre>
    <p>Timer: <strong>{{ ticks() }}</strong> ticks (auto-stops on destroy)</p>
  `
})
class Ex13 {
  ticks = signal(0);
  private destroyRef = inject(DestroyRef);
  private timer: ReturnType<typeof setInterval>;
  constructor() {
    this.timer = setInterval(() => this.ticks.update(t => t + 1), 1000);
    this.destroyRef.onDestroy(() => clearInterval(this.timer));
  }
}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────

// 14. Loading state (isLoading signal)
@Component({
  selector: 'ex-14', standalone: true,
  template: `
    <p><strong>Loading state management in ComponentStore:</strong></p>
    <div style="font-size:13px">
      <div style="margin-bottom:8px">
        Status: <strong>{{ status() }}</strong>
        @if (isLoading()) { <span style="color:#4299e1"> ⟳ Loading...</span> }
        @if (error()) { <span style="color:#f56565"> ✗ {{ error() }}</span> }
      </div>
      @if (!isLoading() && items().length) {
        <ul style="margin:0;padding-left:20px">
          @for (item of items(); track item) { <li>{{ item }}</li> }
        </ul>
      }
      <div style="margin-top:8px;display:flex;gap:6px">
        <button (click)="load()">Load Data</button>
        <button (click)="fail()">Simulate Error</button>
        <button (click)="reset()">Reset</button>
      </div>
    </div>
  `
})
class Ex14 {
  private state = signal({ items: [] as string[], isLoading: false, error: '' });
  isLoading = computed(() => this.state().isLoading);
  error     = computed(() => this.state().error);
  items     = computed(() => this.state().items);
  status    = computed(() => this.isLoading() ? 'loading' : this.error() ? 'error' : this.items().length ? 'loaded' : 'idle');
  load() {
    this.state.update(s => ({ ...s, isLoading: true, error: '' }));
    setTimeout(() => this.state.update(s => ({ ...s, isLoading: false, items: ['Apple', 'Banana', 'Cherry'] })), 800);
  }
  fail() {
    this.state.update(s => ({ ...s, isLoading: true, error: '' }));
    setTimeout(() => this.state.update(s => ({ ...s, isLoading: false, error: '500 Server Error' })), 600);
  }
  reset() { this.state.set({ items: [], isLoading: false, error: '' }); }
}

// 15. Error state (error signal)
@Component({
  selector: 'ex-15', standalone: true,
  template: `
    <p><strong>Error state handling with retry:</strong></p>
    <div style="font-size:13px">
      @if (error()) {
        <div style="background:#fff5f5;border:1px solid #fed7d7;padding:8px;border-radius:4px;margin-bottom:8px">
          <strong style="color:#f56565">Error:</strong> {{ error() }}
          <button (click)="clearError()" style="margin-left:8px">Dismiss</button>
          <button (click)="retry()" style="margin-left:4px">Retry</button>
        </div>
      }
      <p>Attempts: {{ attempts() }} | Last result: {{ result() }}</p>
      <button (click)="tryLoad()">Try Load (50% chance of error)</button>
    </div>
  `
})
class Ex15 {
  private state = signal({ error: '', attempts: 0, result: '' });
  error    = computed(() => this.state().error);
  attempts = computed(() => this.state().attempts);
  result   = computed(() => this.state().result);
  tryLoad() {
    this.state.update(s => ({ ...s, attempts: s.attempts + 1, error: '' }));
    if (Math.random() > 0.5) {
      this.state.update(s => ({ ...s, result: 'Success!' }));
    } else {
      this.state.update(s => ({ ...s, error: 'Random failure — please retry', result: '' }));
    }
  }
  clearError() { this.state.update(s => ({ ...s, error: '' })); }
  retry()      { this.tryLoad(); }
}

// 16. CRUD state (items signal + add/update/delete)
@Component({
  selector: 'ex-16', standalone: true,
  template: `
    <p><strong>CRUD operations in ComponentStore:</strong></p>
    <div style="font-size:13px">
      <div style="display:flex;gap:6px;margin-bottom:8px">
        <input [value]="newName()" (input)="newName.set(getVal($event))"
          placeholder="Item name" style="padding:3px 6px" />
        <button (click)="add()">Add</button>
      </div>
      @for (item of items(); track item.id) {
        <div style="display:flex;gap:6px;align-items:center;padding:3px 0;border-bottom:1px solid #e2e8f0">
          <span style="flex:1">{{ item.name }}</span>
          <button (click)="update(item.id)">Rename</button>
          <button (click)="remove(item.id)">Delete</button>
        </div>
      }
      @if (!items().length) { <p style="color:#a0aec0">No items</p> }
    </div>
  `
})
class Ex16 {
  private nextId = 1;
  private state  = signal({ items: [] as { id: number; name: string }[] });
  items   = computed(() => this.state().items);
  newName = signal('');
  getVal(e: Event) { return (e.target as HTMLInputElement).value; }
  add() {
    if (!this.newName().trim()) return;
    this.state.update(s => ({ items: [...s.items, { id: this.nextId++, name: this.newName() }] }));
    this.newName.set('');
  }
  update(id: number) {
    const name = prompt('New name:') || '';
    if (name) this.state.update(s => ({ items: s.items.map(i => i.id === id ? { ...i, name } : i) }));
  }
  remove(id: number) { this.state.update(s => ({ items: s.items.filter(i => i.id !== id) })); }
}

// 17. Selected item state
@Component({
  selector: 'ex-17', standalone: true,
  template: `
    <p><strong>Selected item state pattern:</strong></p>
    <div style="font-size:13px;display:flex;gap:12px">
      <div style="flex:1">
        @for (item of items; track item.id) {
          <div style="padding:4px 8px;cursor:pointer;border-radius:4px;margin:2px 0"
            [style.background]="selectedId() === item.id ? '#ebf8ff' : '#f7fafc'"
            [style.borderLeft]="selectedId() === item.id ? '3px solid #4299e1' : '3px solid transparent'"
            (click)="select(item.id)">
            {{ item.name }}
          </div>
        }
      </div>
      <div style="flex:1;padding:8px;background:#f7fafc;border-radius:4px">
        @if (selected()) {
          <strong>{{ selected()!.name }}</strong>
          <p>ID: {{ selected()!.id }} | Role: {{ selected()!.role }}</p>
        } @else {
          <p style="color:#a0aec0">Select an item</p>
        }
      </div>
    </div>
  `
})
class Ex17 {
  items = [
    { id: 1, name: 'Alice', role: 'Admin' },
    { id: 2, name: 'Bob',   role: 'Editor' },
    { id: 3, name: 'Carol', role: 'Viewer' },
  ];
  selectedId = signal<number | null>(null);
  selected   = computed(() => this.items.find(i => i.id === this.selectedId()) ?? null);
  select(id: number) { this.selectedId.set(this.selectedId() === id ? null : id); }
}

// 18. Pagination state (page + pageSize + total)
@Component({
  selector: 'ex-18', standalone: true,
  template: `
    <p><strong>Pagination state in ComponentStore:</strong></p>
    <div style="font-size:13px">
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px">
        <button (click)="setPage(page() - 1)" [disabled]="page() === 1">‹ Prev</button>
        <span>Page <strong>{{ page() }}</strong> of <strong>{{ totalPages() }}</strong></span>
        <button (click)="setPage(page() + 1)" [disabled]="page() === totalPages()">Next ›</button>
        <select (change)="setPageSize($event)">
          @for (s of [5, 10, 20]; track s) { <option [value]="s" [selected]="pageSize() === s">{{ s }} / page</option> }
        </select>
      </div>
      <p>Items {{ start() }}–{{ end() }} of {{ total }}</p>
    </div>
  `
})
class Ex18 {
  total    = 85;
  private state = signal({ page: 1, pageSize: 10 });
  page     = computed(() => this.state().page);
  pageSize = computed(() => this.state().pageSize);
  totalPages = computed(() => Math.ceil(this.total / this.pageSize()));
  start    = computed(() => (this.page() - 1) * this.pageSize() + 1);
  end      = computed(() => Math.min(this.page() * this.pageSize(), this.total));
  setPage(p: number) { this.state.update(s => ({ ...s, page: Math.max(1, Math.min(p, this.totalPages())) })); }
  setPageSize(e: Event) {
    this.state.update(s => ({ ...s, pageSize: +(e.target as HTMLSelectElement).value, page: 1 }));
  }
}

// 19. Search filter state (query signal)
@Component({
  selector: 'ex-19', standalone: true,
  template: `
    <p><strong>Search filter state:</strong></p>
    <div style="font-size:13px">
      <input [value]="query()" (input)="query.set(getVal($event))"
        placeholder="Search items..." style="padding:4px 8px;width:200px;margin-bottom:8px" />
      <div>
        @for (item of filtered(); track item) {
          <div style="padding:2px 0;border-bottom:1px solid #e2e8f0">{{ item }}</div>
        }
        @if (!filtered().length) { <p style="color:#a0aec0">No results for "{{ query() }}"</p> }
      </div>
      <p style="color:#718096;font-size:11px">{{ filtered().length }} of {{ all.length }} shown</p>
    </div>
  `
})
class Ex19 {
  all      = ['Angular', 'React', 'Vue', 'Svelte', 'TypeScript', 'JavaScript', 'Node.js', 'GraphQL'];
  query    = signal('');
  filtered = computed(() => {
    const q = this.query().toLowerCase();
    return q ? this.all.filter(i => i.toLowerCase().includes(q)) : this.all;
  });
  getVal(e: Event) { return (e.target as HTMLInputElement).value; }
}

// 20. Sort state (field + direction signals)
@Component({
  selector: 'ex-20', standalone: true,
  template: `
    <p><strong>Sort state (field + direction):</strong></p>
    <div style="font-size:13px">
      <div style="display:flex;gap:8px;margin-bottom:6px">
        @for (col of columns; track col.key) {
          <button style="padding:3px 8px;border:1px solid #cbd5e0;border-radius:4px;cursor:pointer"
            [style.fontWeight]="sortField() === col.key ? 'bold' : 'normal'"
            (click)="toggleSort(col.key)">
            {{ col.label }} {{ sortField() === col.key ? (sortDir() === 'asc' ? '↑' : '↓') : '↕' }}
          </button>
        }
      </div>
      @for (row of sorted(); track row.id) {
        <div style="display:flex;gap:12px;padding:3px 0;border-bottom:1px solid #e2e8f0">
          <span style="width:30px">{{ row.id }}</span>
          <span style="flex:1">{{ row.name }}</span>
          <span>{{ row.score }}</span>
        </div>
      }
    </div>
  `
})
class Ex20 {
  columns = [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'score', label: 'Score' }];
  rows = [{ id: 1, name: 'Bob', score: 80 }, { id: 2, name: 'Alice', score: 95 }, { id: 3, name: 'Carol', score: 72 }];
  sortField = signal('id');
  sortDir   = signal<'asc'|'desc'>('asc');
  sorted = computed(() => {
    const f = this.sortField() as 'id'|'name'|'score';
    const d = this.sortDir() === 'asc' ? 1 : -1;
    return [...this.rows].sort((a, b) => (a[f] > b[f] ? 1 : a[f] < b[f] ? -1 : 0) * d);
  });
  toggleSort(field: string) {
    if (this.sortField() === field) this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    else { this.sortField.set(field); this.sortDir.set('asc'); }
  }
}

// 21. Optimistic update (apply + rollback on error)
@Component({
  selector: 'ex-21', standalone: true,
  template: `
    <p><strong>Optimistic update with rollback on error:</strong></p>
    <div style="font-size:13px">
      @for (item of items(); track item.id) {
        <div style="display:flex;gap:8px;align-items:center;padding:3px 0;border-bottom:1px solid #e2e8f0"
          [style.opacity]="item.optimistic ? '0.5' : '1'">
          <span style="flex:1">{{ item.name }} {{ item.optimistic ? '(saving...)' : '' }}</span>
          <button (click)="toggleLike(item.id)">
            {{ item.liked ? '♥' : '♡' }} {{ item.likes }}
          </button>
        </div>
      }
      <p style="color:#718096;font-size:11px">Likes update instantly; 30% chance of server failure → rollback</p>
    </div>
  `
})
class Ex21 {
  private state = signal({
    items: [
      { id: 1, name: 'Post Alpha', liked: false, likes: 10, optimistic: false },
      { id: 2, name: 'Post Beta',  liked: true,  likes: 25, optimistic: false },
    ]
  });
  items = computed(() => this.state().items);
  toggleLike(id: number) {
    // Save original state for rollback
    const original = this.state().items;
    // Apply optimistically
    this.state.update(s => ({
      items: s.items.map(i => i.id === id
        ? { ...i, liked: !i.liked, likes: i.likes + (i.liked ? -1 : 1), optimistic: true }
        : i)
    }));
    // Simulate API call (30% failure)
    setTimeout(() => {
      if (Math.random() < 0.3) {
        this.state.update(s => ({ items: original })); // rollback
      } else {
        this.state.update(s => ({ items: s.items.map(i => i.id === id ? { ...i, optimistic: false } : i) }));
      }
    }, 700);
  }
}

// 22. Retry on error pattern
@Component({
  selector: 'ex-22', standalone: true,
  template: `
    <p><strong>Retry on error with max attempts:</strong></p>
    <div style="font-size:13px">
      <p>Attempts: <strong>{{ attempts() }}</strong>/3 | Status: <strong>{{ status() }}</strong></p>
      @if (error() && attempts() < 3) {
        <p style="color:#f56565">{{ error() }} — <button (click)="load()">Retry</button></p>
      }
      @if (attempts() >= 3 && error()) {
        <p style="color:#f56565">Max retries reached. <button (click)="reset()">Start over</button></p>
      }
      @if (!error() && attempts() > 0 && status() === 'success') {
        <p style="color:#48bb78">Loaded successfully!</p>
      }
      @if (status() === 'idle') {
        <button (click)="load()">Load (60% fail rate)</button>
      }
    </div>
  `
})
class Ex22 {
  private state = signal({ attempts: 0, status: 'idle', error: '' });
  attempts = computed(() => this.state().attempts);
  status   = computed(() => this.state().status);
  error    = computed(() => this.state().error);
  load() {
    this.state.update(s => ({ ...s, status: 'loading', error: '' }));
    setTimeout(() => {
      if (Math.random() < 0.6) {
        this.state.update(s => ({ ...s, status: 'error', error: 'Server error', attempts: s.attempts + 1 }));
      } else {
        this.state.update(s => ({ ...s, status: 'success', error: '', attempts: s.attempts + 1 }));
      }
    }, 500);
  }
  reset() { this.state.set({ attempts: 0, status: 'idle', error: '' }); }
}

// 23. HTTP load simulation (with delay)
@Component({
  selector: 'ex-23', standalone: true,
  template: `
    <p><strong>HTTP load simulation (with artificial delay):</strong></p>
    <div style="font-size:13px">
      @if (isLoading()) {
        <div style="padding:12px;text-align:center;color:#718096">⟳ Fetching data...</div>
      } @else if (error()) {
        <div style="color:#f56565">{{ error() }}</div>
      } @else {
        @for (user of users(); track user) {
          <div style="padding:3px 0;border-bottom:1px solid #e2e8f0">{{ user }}</div>
        }
      }
      <button (click)="loadUsers()" [disabled]="isLoading()" style="margin-top:8px">
        {{ isLoading() ? 'Loading...' : 'Reload Users' }}
      </button>
    </div>
  `
})
class Ex23 {
  private state = signal({ users: [] as string[], isLoading: false, error: '' });
  users     = computed(() => this.state().users);
  isLoading = computed(() => this.state().isLoading);
  error     = computed(() => this.state().error);
  loadUsers() {
    this.state.update(s => ({ ...s, isLoading: true, error: '' }));
    setTimeout(() => {
      this.state.update(s => ({
        ...s, isLoading: false,
        users: ['Alice Johnson', 'Bob Smith', 'Carol White', 'Dave Brown']
      }));
    }, 1000);
  }
}

// 24. Router params sync to store state
@Component({
  selector: 'ex-24', standalone: true,
  template: `
    <p><strong>Router param → ComponentStore state sync (pattern):</strong></p>
    <pre>
// On component init, sync route params to store:
@Component({{ '{' }} ... {{ '}' }})
class ProductDetailComponent {{ '{' }}
  private route = inject(ActivatedRoute);
  private store = inject(ProductStore);

  constructor() {{ '{' }}
    // Load product whenever :id route param changes
    toSignal(
      this.route.params.pipe(
        map(p => +p['id']),
        switchMap(id => this.store.loadProduct(id))
      )
    );
  {{ '}' }}
{{ '}' }}</pre>
    <p>Simulated: <strong>Product #{{ productId() }}</strong> loaded</p>
    <div style="display:flex;gap:6px">
      @for (id of [1, 2, 3]; track id) {
        <button (click)="productId.set(id)">Load #{{ id }}</button>
      }
    </div>
  `
})
class Ex24 {
  productId = signal(1);
}

// 25. Timer polling (interval-based refresh)
@Component({
  selector: 'ex-25', standalone: true,
  template: `
    <p><strong>Timer polling — auto-refresh state on interval:</strong></p>
    <div style="font-size:13px">
      <p>Last refreshed: <strong>{{ lastRefresh() }}</strong></p>
      <p>Refresh count: <strong>{{ refreshCount() }}</strong></p>
      <p>Data: {{ data() }}</p>
      <div style="display:flex;gap:8px">
        <button (click)="start()" [disabled]="polling()">Start Polling (1s)</button>
        <button (click)="stop()"  [disabled]="!polling()">Stop</button>
      </div>
    </div>
  `
})
class Ex25 {
  private state = signal({ refreshCount: 0, lastRefresh: 'never', data: 'no data', polling: false });
  refreshCount = computed(() => this.state().refreshCount);
  lastRefresh  = computed(() => this.state().lastRefresh);
  data         = computed(() => this.state().data);
  polling      = computed(() => this.state().polling);
  private timer?: ReturnType<typeof setInterval>;
  private destroyRef = inject(DestroyRef);
  constructor() { this.destroyRef.onDestroy(() => this.stop()); }
  start() {
    this.state.update(s => ({ ...s, polling: true }));
    this.timer = setInterval(() => {
      this.state.update(s => ({
        ...s,
        refreshCount: s.refreshCount + 1,
        lastRefresh: new Date().toLocaleTimeString(),
        data: `value=${Math.floor(Math.random() * 100)}`,
      }));
    }, 1000);
  }
  stop() { clearInterval(this.timer); this.state.update(s => ({ ...s, polling: false })); }
}

// 26. Form sync (form values → store state)
@Component({
  selector: 'ex-26', standalone: true,
  template: `
    <p><strong>Form values synced to ComponentStore state:</strong></p>
    <div style="font-size:13px">
      <div style="display:flex;flex-direction:column;gap:6px;max-width:280px;margin-bottom:8px">
        <input [value]="name()" (input)="update('name', getVal($event))"
          placeholder="Name" style="padding:4px 6px" />
        <input [value]="email()" (input)="update('email', getVal($event))"
          placeholder="Email" style="padding:4px 6px" />
        <input [value]="age()" type="number" (input)="update('age', getVal($event))"
          placeholder="Age" style="padding:4px 6px" />
      </div>
      <div style="background:#f7fafc;padding:8px;border-radius:4px">
        <strong>Store state:</strong>
        <pre style="margin:4px 0">{{ stateJson() }}</pre>
      </div>
    </div>
  `
})
class Ex26 {
  private state = signal({ name: '', email: '', age: '' });
  name  = computed(() => this.state().name);
  email = computed(() => this.state().email);
  age   = computed(() => this.state().age);
  stateJson = computed(() => JSON.stringify(this.state(), null, 2));
  update(field: string, val: string) { this.state.update(s => ({ ...s, [field]: val })); }
  getVal(e: Event) { return (e.target as HTMLInputElement).value; }
}

// ─── NESTED (27–38) ──────────────────────────────────────────

// 27. Parent-provided store used by child siblings
@Component({
  selector: 'ex-27', standalone: true,
  template: `
    <p><strong>Parent-provided store shared by child components:</strong></p>
    <div style="font-size:13px;border:1px solid #e2e8f0;padding:8px;border-radius:4px">
      <p style="color:#718096;font-size:11px">Parent provides store; both children share state</p>
      <div style="display:flex;gap:12px">
        <div style="flex:1;background:#f0fff4;padding:8px;border-radius:4px">
          <strong>Child A (Counter)</strong>
          <p>Count: {{ count() }}</p>
          <button (click)="inc()">+1</button>
          <button (click)="dec()">-1</button>
        </div>
        <div style="flex:1;background:#ebf8ff;padding:8px;border-radius:4px">
          <strong>Child B (Display)</strong>
          <p>Same count: <strong>{{ count() }}</strong></p>
          <p>Doubled: <strong>{{ doubled() }}</strong></p>
        </div>
      </div>
    </div>
  `
})
class Ex27 {
  private state = signal({ count: 0 });
  count   = computed(() => this.state().count);
  doubled = computed(() => this.state().count * 2);
  inc() { this.state.update(s => ({ count: s.count + 1 })); }
  dec() { this.state.update(s => ({ count: s.count - 1 })); }
}

// 28. Entity-like store (items as Map by id)
@Component({
  selector: 'ex-28', standalone: true,
  template: `
    <p><strong>Entity-like store — items stored as Map for O(1) lookup:</strong></p>
    <div style="font-size:13px">
      <div style="display:flex;gap:6px;margin-bottom:8px">
        <input [value]="newName()" (input)="newName.set(getVal($event))"
          placeholder="Name" style="padding:3px 6px" />
        <button (click)="add()">Add</button>
      </div>
      @for (item of itemsList(); track item.id) {
        <div style="display:flex;gap:8px;padding:3px 0;border-bottom:1px solid #e2e8f0">
          <span style="width:24px;color:#718096">{{ item.id }}</span>
          <span style="flex:1">{{ item.name }}</span>
          <button (click)="remove(item.id)">✕</button>
        </div>
      }
      <p style="color:#718096;font-size:11px">{{ itemsList().length }} entities stored in Map</p>
    </div>
  `
})
class Ex28 {
  private nextId = 1;
  private entities = signal(new Map<number, { id: number; name: string }>());
  newName  = signal('');
  itemsList = computed(() => Array.from(this.entities().values()));
  add() {
    if (!this.newName().trim()) return;
    const id = this.nextId++;
    this.entities.update(m => new Map(m).set(id, { id, name: this.newName() }));
    this.newName.set('');
  }
  remove(id: number) {
    this.entities.update(m => { const n = new Map(m); n.delete(id); return n; });
  }
  getVal(e: Event) { return (e.target as HTMLInputElement).value; }
}

// 29. Dialog state store (isOpen + data + result)
@Component({
  selector: 'ex-29', standalone: true,
  template: `
    <p><strong>Dialog state store (isOpen + payload + result):</strong></p>
    <div style="font-size:13px;position:relative">
      <button (click)="open('Delete Item #42', 'confirm')">Open Confirm Dialog</button>
      <button (click)="open('Edit User Profile', 'edit')" style="margin-left:8px">Open Edit Dialog</button>
      @if (isOpen()) {
        <div style="position:absolute;top:30px;left:0;background:#fff;border:2px solid #4299e1;padding:16px;border-radius:6px;z-index:10;min-width:220px;box-shadow:0 4px 12px rgba(0,0,0,0.1)">
          <strong>{{ dialogData().title }}</strong>
          <p style="color:#718096">Type: {{ dialogData().type }}</p>
          <div style="display:flex;gap:8px;margin-top:8px">
            <button (click)="confirm()">Confirm</button>
            <button (click)="close()">Cancel</button>
          </div>
        </div>
      }
      @if (lastResult()) {
        <p style="margin-top:8px;color:#48bb78">Result: {{ lastResult() }}</p>
      }
    </div>
  `
})
class Ex29 {
  private state = signal({ isOpen: false, data: { title: '', type: '' }, result: '' });
  isOpen     = computed(() => this.state().isOpen);
  dialogData = computed(() => this.state().data);
  lastResult = computed(() => this.state().result);
  open(title: string, type: string) { this.state.update(s => ({ ...s, isOpen: true, data: { title, type }, result: '' })); }
  confirm() { this.state.update(s => ({ ...s, isOpen: false, result: `Confirmed: ${s.data.title}` })); }
  close()   { this.state.update(s => ({ ...s, isOpen: false, result: 'Cancelled' })); }
}

// 30. Accordion state store (openIndex signal)
@Component({
  selector: 'ex-30', standalone: true,
  template: `
    <p><strong>Accordion state store:</strong></p>
    <div style="font-size:13px">
      @for (item of items; track item.id; let i = $index) {
        <div style="border:1px solid #e2e8f0;border-radius:4px;margin-bottom:4px">
          <div style="padding:8px 10px;cursor:pointer;background:#f7fafc;display:flex;justify-content:space-between"
            (click)="toggle(i)">
            <strong>{{ item.title }}</strong>
            <span>{{ openIndex() === i ? '▲' : '▼' }}</span>
          </div>
          @if (openIndex() === i) {
            <div style="padding:8px 10px">{{ item.content }}</div>
          }
        </div>
      }
    </div>
  `
})
class Ex30 {
  items = [
    { id: 1, title: 'What is ComponentStore?', content: 'A service for managing local/component-level state using reactive patterns.' },
    { id: 2, title: 'When to use it?',          content: 'When component state is complex enough to need selectors and effects.' },
    { id: 3, title: 'vs NgRx Store?',           content: 'ComponentStore is local; NgRx Store is global. Use ComponentStore for feature-isolated state.' },
  ];
  openIndex = signal<number | null>(null);
  toggle(i: number) { this.openIndex.update(v => v === i ? null : i); }
}

// 31. Stepper state store (currentStep + steps array)
@Component({
  selector: 'ex-31', standalone: true,
  template: `
    <p><strong>Stepper state store:</strong></p>
    <div style="font-size:13px">
      <div style="display:flex;gap:0;margin-bottom:12px">
        @for (step of steps; track step.id; let i = $index) {
          <div style="flex:1;text-align:center;padding:6px 4px;position:relative">
            <div style="width:24px;height:24px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold"
              [style.background]="current() > i ? '#48bb78' : current() === i ? '#4299e1' : '#e2e8f0'"
              [style.color]="current() >= i ? '#fff' : '#718096'">
              {{ current() > i ? '✓' : step.id }}
            </div>
            <div style="font-size:11px;margin-top:2px">{{ step.label }}</div>
          </div>
        }
      </div>
      <div style="padding:10px;background:#f7fafc;border-radius:4px;margin-bottom:8px">
        <strong>{{ steps[current()].label }}</strong>
        <p>{{ steps[current()].content }}</p>
      </div>
      <div style="display:flex;gap:8px">
        <button (click)="prev()" [disabled]="current() === 0">← Back</button>
        <button (click)="next()" [disabled]="current() === steps.length - 1">Next →</button>
      </div>
    </div>
  `
})
class Ex31 {
  steps = [
    { id: 1, label: 'Account', content: 'Enter your email and password.' },
    { id: 2, label: 'Profile', content: 'Add your name and avatar.' },
    { id: 3, label: 'Confirm', content: 'Review and submit your profile.' },
  ];
  current = signal(0);
  next() { this.current.update(c => Math.min(c + 1, this.steps.length - 1)); }
  prev() { this.current.update(c => Math.max(c - 1, 0)); }
}

// 32. Data table store (rows + sort + pagination)
@Component({
  selector: 'ex-32', standalone: true,
  template: `
    <p><strong>Data table store (rows + sort + pagination):</strong></p>
    <div style="font-size:12px">
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#edf2f7">
            @for (col of columns; track col.key) {
              <th style="padding:5px 8px;border:1px solid #cbd5e0;cursor:pointer"
                (click)="toggleSort(col.key)">
                {{ col.label }} {{ sortField() === col.key ? (sortDir() === 'asc' ? '↑' : '↓') : '' }}
              </th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of pageRows(); track row.id) {
            <tr [style.background]="row.id % 2 === 0 ? '#f7fafc' : '#fff'">
              <td style="padding:4px 8px;border:1px solid #e2e8f0">{{ row.id }}</td>
              <td style="padding:4px 8px;border:1px solid #e2e8f0">{{ row.name }}</td>
              <td style="padding:4px 8px;border:1px solid #e2e8f0">{{ row.score }}</td>
            </tr>
          }
        </tbody>
      </table>
      <div style="display:flex;gap:8px;margin-top:6px;align-items:center">
        <button (click)="page.update(p => Math.max(1, p-1))" [disabled]="page() === 1">‹</button>
        <span>Page {{ page() }}/{{ totalPages() }}</span>
        <button (click)="page.update(p => Math.min(totalPages(), p+1))" [disabled]="page() === totalPages()">›</button>
      </div>
    </div>
  `
})
class Ex32 {
  columns = [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'score', label: 'Score' }];
  allRows = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1, name: ['Alice','Bob','Carol','Dave','Eve','Frank','Grace','Henry','Iris','Jake','Kim','Leo'][i], score: 50 + i * 4
  }));
  sortField = signal('id');
  sortDir   = signal<'asc'|'desc'>('asc');
  page      = signal(1);
  pageSize  = 5;
  sorted    = computed(() => {
    const f = this.sortField() as 'id'|'name'|'score';
    const d = this.sortDir() === 'asc' ? 1 : -1;
    return [...this.allRows].sort((a, b) => (a[f] > b[f] ? 1 : a[f] < b[f] ? -1 : 0) * d);
  });
  totalPages = computed(() => Math.ceil(this.allRows.length / this.pageSize));
  pageRows  = computed(() => this.sorted().slice((this.page() - 1) * this.pageSize, this.page() * this.pageSize));
  toggleSort(field: string) {
    if (this.sortField() === field) this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    else { this.sortField.set(field); this.sortDir.set('asc'); }
    this.page.set(1);
  }
}

// 33. Infinite scroll store (items + hasMore + loading)
@Component({
  selector: 'ex-33', standalone: true,
  template: `
    <p><strong>Infinite scroll store:</strong></p>
    <div style="font-size:13px">
      <div style="max-height:150px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:4px;padding:4px" #scrollEl>
        @for (item of items(); track item) {
          <div style="padding:3px 6px;border-bottom:1px solid #f0f0f0">{{ item }}</div>
        }
        @if (isLoading()) {
          <div style="padding:8px;text-align:center;color:#718096">Loading more...</div>
        }
      </div>
      <div style="margin-top:6px;display:flex;gap:8px;align-items:center">
        <button (click)="loadMore()" [disabled]="isLoading() || !hasMore()">
          {{ hasMore() ? 'Load More' : 'All Loaded' }}
        </button>
        <span style="color:#718096;font-size:11px">{{ items().length }} items | hasMore: {{ hasMore() }}</span>
      </div>
    </div>
  `
})
class Ex33 {
  private totalItems = 25;
  private state = signal({ items: [] as string[], isLoading: false, page: 0 });
  items     = computed(() => this.state().items);
  isLoading = computed(() => this.state().isLoading);
  hasMore   = computed(() => this.state().items.length < this.totalItems);
  constructor() { this.loadMore(); }
  loadMore() {
    if (this.isLoading() || !this.hasMore()) return;
    this.state.update(s => ({ ...s, isLoading: true }));
    setTimeout(() => {
      this.state.update(s => {
        const start = s.page * 5;
        const newItems = Array.from({ length: 5 }, (_, i) => `Item ${start + i + 1}`).filter((_, i) => s.items.length + i < this.totalItems);
        return { items: [...s.items, ...newItems], isLoading: false, page: s.page + 1 };
      });
    }, 600);
  }
}

// 34. Drag-and-drop list store (reorder)
@Component({
  selector: 'ex-34', standalone: true,
  template: `
    <p><strong>Drag-and-drop reorder store (keyboard simulation):</strong></p>
    <div style="font-size:13px">
      <p style="color:#718096;font-size:11px">Select an item, then use ↑/↓ buttons to reorder:</p>
      @for (item of items(); track item.id; let i = $index) {
        <div style="display:flex;gap:6px;align-items:center;padding:4px 8px;margin:2px 0;border:1px solid #e2e8f0;border-radius:4px;cursor:pointer"
          [style.background]="selectedIdx() === i ? '#ebf8ff' : '#fff'"
          (click)="selectedIdx.set(i)">
          <span style="color:#a0aec0;user-select:none">⋮⋮</span>
          <span style="flex:1">{{ item.name }}</span>
        </div>
      }
      <div style="display:flex;gap:6px;margin-top:6px">
        <button (click)="moveUp()"   [disabled]="selectedIdx() === null || selectedIdx() === 0">↑ Up</button>
        <button (click)="moveDown()" [disabled]="selectedIdx() === null || selectedIdx() === items().length - 1">↓ Down</button>
      </div>
    </div>
  `
})
class Ex34 {
  private state = signal({
    items: [
      { id: 1, name: 'First Task' }, { id: 2, name: 'Second Task' },
      { id: 3, name: 'Third Task' }, { id: 4, name: 'Fourth Task' },
    ]
  });
  items       = computed(() => this.state().items);
  selectedIdx = signal<number | null>(null);
  moveUp() {
    const i = this.selectedIdx();
    if (i === null || i === 0) return;
    this.state.update(s => {
      const arr = [...s.items];
      [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
      return { items: arr };
    });
    this.selectedIdx.set(i - 1);
  }
  moveDown() {
    const i = this.selectedIdx();
    if (i === null || i >= this.items().length - 1) return;
    this.state.update(s => {
      const arr = [...s.items];
      [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
      return { items: arr };
    });
    this.selectedIdx.set(i + 1);
  }
}

// 35. Multi-select store (selectedIds Set signal)
@Component({
  selector: 'ex-35', standalone: true,
  template: `
    <p><strong>Multi-select store using Set signal:</strong></p>
    <div style="font-size:13px">
      <div style="margin-bottom:6px;display:flex;gap:6px">
        <button (click)="selectAll()">Select All</button>
        <button (click)="clearAll()" [disabled]="selectedIds().size === 0">Clear</button>
        <span style="color:#718096">{{ selectedIds().size }} selected</span>
      </div>
      @for (item of items; track item.id) {
        <div style="display:flex;gap:8px;align-items:center;padding:3px 0;border-bottom:1px solid #e2e8f0">
          <input type="checkbox" [checked]="selectedIds().has(item.id)"
            (change)="toggle(item.id)" />
          <span>{{ item.name }}</span>
        </div>
      }
      @if (selectedIds().size > 0) {
        <div style="margin-top:6px;padding:6px;background:#ebf8ff;border-radius:4px">
          Selected IDs: {{ Array.from(selectedIds()).join(', ') }}
        </div>
      }
    </div>
  `
})
class Ex35 {
  Array = Array;
  items = [
    { id: 1, name: 'Item Alpha' }, { id: 2, name: 'Item Beta' },
    { id: 3, name: 'Item Gamma' }, { id: 4, name: 'Item Delta' },
  ];
  selectedIds = signal(new Set<number>());
  toggle(id: number) {
    this.selectedIds.update(s => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  selectAll() { this.selectedIds.set(new Set(this.items.map(i => i.id))); }
  clearAll()  { this.selectedIds.set(new Set()); }
}

// 36. Search + results store (query + results + loading)
@Component({
  selector: 'ex-36', standalone: true,
  template: `
    <p><strong>Search + results ComponentStore:</strong></p>
    <div style="font-size:13px">
      <div style="display:flex;gap:6px;margin-bottom:8px">
        <input [value]="query()" (input)="setQuery($event)"
          placeholder="Search..." style="padding:4px 8px;flex:1" />
        <button (click)="search()" [disabled]="isLoading()">
          {{ isLoading() ? 'Searching...' : 'Search' }}
        </button>
      </div>
      @if (isLoading()) { <p style="color:#718096">Searching for "{{ query() }}"...</p> }
      @else {
        @for (r of results(); track r) {
          <div style="padding:3px 6px;border-bottom:1px solid #e2e8f0">{{ r }}</div>
        }
        @if (!results().length && query()) { <p style="color:#a0aec0">No results for "{{ query() }}"</p> }
      }
    </div>
  `
})
class Ex36 {
  private db = ['Angular Signals', 'NgRx ComponentStore', 'Signal Store', 'RxJS Observables', 'TypeScript Generics'];
  private state = signal({ query: '', results: [] as string[], isLoading: false });
  query     = computed(() => this.state().query);
  results   = computed(() => this.state().results);
  isLoading = computed(() => this.state().isLoading);
  setQuery(e: Event) { this.state.update(s => ({ ...s, query: (e.target as HTMLInputElement).value })); }
  search() {
    this.state.update(s => ({ ...s, isLoading: true, results: [] }));
    setTimeout(() => {
      const q = this.query().toLowerCase();
      this.state.update(s => ({
        ...s, isLoading: false,
        results: q ? this.db.filter(i => i.toLowerCase().includes(q)) : this.db
      }));
    }, 500);
  }
}

// 37. Form wizard store (steps + formData + currentStep)
@Component({
  selector: 'ex-37', standalone: true,
  template: `
    <p><strong>Form wizard store:</strong></p>
    <div style="font-size:13px">
      <div style="display:flex;gap:4px;margin-bottom:8px">
        @for (s of steps; track s.id) {
          <div style="flex:1;text-align:center;padding:4px;border-radius:3px;font-size:11px"
            [style.background]="stepNum() === s.id ? '#4299e1' : stepNum() > s.id ? '#48bb78' : '#e2e8f0'"
            [style.color]="stepNum() >= s.id ? '#fff' : '#718096'">
            {{ s.label }}
          </div>
        }
      </div>
      @if (stepNum() === 1) {
        <div>
          <label>Name: <input [value]="formData().name" (input)="patch('name', getVal($event))" style="padding:3px 6px;margin-left:8px" /></label>
        </div>
      }
      @if (stepNum() === 2) {
        <div>
          <label>Email: <input [value]="formData().email" (input)="patch('email', getVal($event))" style="padding:3px 6px;margin-left:8px" /></label>
        </div>
      }
      @if (stepNum() === 3) {
        <div style="background:#f7fafc;padding:8px;border-radius:4px">
          <strong>Review:</strong> {{ formData().name }} — {{ formData().email }}
          @if (!formData().name || !formData().email) { <p style="color:#f56565;font-size:11px">Please fill all fields!</p> }
        </div>
      }
      <div style="display:flex;gap:6px;margin-top:8px">
        <button (click)="prev()" [disabled]="stepNum() === 1">← Back</button>
        @if (stepNum() < 3) { <button (click)="next()">Next →</button> }
        @if (stepNum() === 3) { <button (click)="submit()" [disabled]="!formData().name || !formData().email">Submit</button> }
      </div>
      @if (submitted()) { <p style="color:#48bb78;margin-top:6px">Submitted!</p> }
    </div>
  `
})
class Ex37 {
  steps = [{ id: 1, label: 'Name' }, { id: 2, label: 'Email' }, { id: 3, label: 'Review' }];
  private state = signal({ step: 1, formData: { name: '', email: '' }, submitted: false });
  stepNum   = computed(() => this.state().step);
  formData  = computed(() => this.state().formData);
  submitted = computed(() => this.state().submitted);
  next()     { this.state.update(s => ({ ...s, step: Math.min(s.step + 1, 3) })); }
  prev()     { this.state.update(s => ({ ...s, step: Math.max(s.step - 1, 1) })); }
  submit()   { this.state.update(s => ({ ...s, submitted: true })); }
  patch(field: string, val: string) {
    this.state.update(s => ({ ...s, formData: { ...s.formData, [field]: val } }));
  }
  getVal(e: Event) { return (e.target as HTMLInputElement).value; }
}

// 38. Full CRUD feature with ComponentStore
@Component({
  selector: 'ex-38', standalone: true,
  template: `
    <p><strong>Full CRUD feature with ComponentStore:</strong></p>
    <div style="font-size:13px">
      <div style="display:flex;gap:6px;margin-bottom:8px">
        <input [value]="newTitle()" (input)="newTitle.set(getVal($event))"
          placeholder="New todo..." style="padding:4px 6px;flex:1" />
        <button (click)="add()" [disabled]="!newTitle().trim()">Add</button>
      </div>
      <div style="margin-bottom:6px">
        <select (change)="filter.set(getVal($event))">
          @for (f of ['all','active','done']; track f) { <option [value]="f">{{ f }}</option> }
        </select>
        <span style="margin-left:8px;color:#718096;font-size:11px">{{ visible().length }} shown / {{ items().length }} total</span>
      </div>
      @for (item of visible(); track item.id) {
        <div style="display:flex;gap:8px;align-items:center;padding:4px 0;border-bottom:1px solid #e2e8f0">
          <input type="checkbox" [checked]="item.done" (change)="toggle(item.id)" />
          <span style="flex:1" [style.textDecoration]="item.done ? 'line-through' : 'none'"
                [style.color]="item.done ? '#a0aec0' : '#2d3748'">{{ item.title }}</span>
          <button (click)="remove(item.id)">✕</button>
        </div>
      }
    </div>
  `
})
class Ex38 {
  private nextId = 1;
  private state  = signal({ items: [] as { id: number; title: string; done: boolean }[] });
  items    = computed(() => this.state().items);
  newTitle = signal('');
  filter   = signal('all');
  visible  = computed(() => {
    const f = this.filter();
    return this.items().filter(i => f === 'all' ? true : f === 'done' ? i.done : !i.done);
  });
  add() {
    if (!this.newTitle().trim()) return;
    this.state.update(s => ({ items: [...s.items, { id: this.nextId++, title: this.newTitle(), done: false }] }));
    this.newTitle.set('');
  }
  toggle(id: number) { this.state.update(s => ({ items: s.items.map(i => i.id === id ? { ...i, done: !i.done } : i) })); }
  remove(id: number) { this.state.update(s => ({ items: s.items.filter(i => i.id !== id) })); }
  getVal(e: Event)   { return (e.target as HTMLInputElement | HTMLSelectElement).value; }
}

// ─── ADVANCED (39–50) ────────────────────────────────────────

// 39. Generic typed store class<T>
@Component({
  selector: 'ex-39', standalone: true,
  template: `
    <p><strong>Generic typed store class&lt;T&gt;:</strong></p>
    <pre>
// Generic base store — reusable for any entity type:
class EntityStore&lt;T extends {{ '{' }} id: number {{ '}' }}&gt; {{ '{' }}
  private state = signal&lt;{{ '{' }} items: T[]; selected: T | null {{ '}' }}&gt;({{ '{' }}
    items: [], selected: null
  {{ '}' }});

  items    = computed(() => this.state().items);
  selected = computed(() => this.state().selected);

  setAll(items: T[])    {{ '{' }} this.state.update(s => ({{ '{' }} ...s, items {{ '}' }})); {{ '}' }}
  add(item: T)          {{ '{' }} this.state.update(s => ({{ '{' }} ...s, items: [...s.items, item] {{ '}' }})); {{ '}' }}
  remove(id: number)    {{ '{' }} this.state.update(s => ({{ '{' }} ...s, items: s.items.filter(i => i.id !== id) {{ '}' }})); {{ '}' }}
  select(item: T | null){{ '{' }} this.state.update(s => ({{ '{' }} ...s, selected: item {{ '}' }})); {{ '}' }}
{{ '}' }}

// Usage:
class UserStore extends EntityStore&lt;User&gt; {{ '{' }}
  fullNames = computed(() => this.items().map(u => u.firstName + ' ' + u.lastName));
{{ '}' }}</pre>
  `
})
class Ex39 {}

// 40. OnPush + store selectSignal pattern
@Component({
  selector: 'ex-40', standalone: true,
  template: `
    <p><strong>OnPush change detection + signal store:</strong></p>
    <pre>
import {{ '{' }} ChangeDetectionStrategy {{ '}' }} from '@angular/core';

// With OnPush, Angular only re-renders when:
// 1. An @Input reference changes
// 2. An event fires within the component
// 3. A signal used in the template changes ← this is the key!

@Component({{ '{' }}
  selector: 'products-list',
  changeDetection: ChangeDetectionStrategy.OnPush,  // &lt;— enable OnPush
  template: \`
    &lt;!-- Signal reads are automatically tracked —
         component re-renders ONLY when these signals change --&gt;
    &#64;for (product of store.filteredProducts(); track product.id) {{ '{' }} ... {{ '}' }}
    &#64;if (store.isLoading()) {{ '{' }} ... {{ '}' }}
  \`
{{ '}' }})
class ProductsListComponent {{ '{' }}
  store = inject(ProductsStore);
{{ '}' }}
// Result: zero unnecessary re-renders — maximum performance.</pre>
  `
})
class Ex40 {}

// 41. State machine store (status: 'idle'|'loading'|'success'|'error')
@Component({
  selector: 'ex-41', standalone: true,
  template: `
    <p><strong>State machine store — explicit status transitions:</strong></p>
    <div style="font-size:13px">
      <div style="display:flex;gap:6px;margin-bottom:8px">
        @for (s of statuses; track s) {
          <div style="padding:4px 8px;border-radius:12px;font-size:11px;font-weight:bold"
            [style.background]="status() === s ? statusColor() : '#e2e8f0'"
            [style.color]="status() === s ? '#fff' : '#718096'">
            {{ s }}
          </div>
        }
      </div>
      <div style="padding:8px;background:#f7fafc;border-radius:4px;margin-bottom:8px">
        @if (status() === 'idle')    { <span>Press Load to start</span> }
        @if (status() === 'loading') { <span style="color:#4299e1">⟳ Fetching data...</span> }
        @if (status() === 'success') { <span style="color:#48bb78">✓ {{ data() }}</span> }
        @if (status() === 'error')   { <span style="color:#f56565">✗ {{ error() }}</span> }
      </div>
      <div style="display:flex;gap:6px">
        <button (click)="load(true)"  [disabled]="status() === 'loading'">Load (success)</button>
        <button (click)="load(false)" [disabled]="status() === 'loading'">Load (error)</button>
        <button (click)="reset()" [disabled]="status() === 'idle'">Reset</button>
      </div>
    </div>
  `
})
class Ex41 {
  statuses = ['idle', 'loading', 'success', 'error'];
  private state = signal({ status: 'idle' as 'idle'|'loading'|'success'|'error', data: '', error: '' });
  status = computed(() => this.state().status);
  data   = computed(() => this.state().data);
  error  = computed(() => this.state().error);
  statusColor = computed(() => ({ idle: '#a0aec0', loading: '#4299e1', success: '#48bb78', error: '#f56565' }[this.status()]));
  load(succeed: boolean) {
    this.state.update(s => ({ ...s, status: 'loading', data: '', error: '' }));
    setTimeout(() => {
      if (succeed) this.state.update(s => ({ ...s, status: 'success', data: 'Loaded 42 items.' }));
      else         this.state.update(s => ({ ...s, status: 'error',   error: 'Network timeout.' }));
    }, 700);
  }
  reset() { this.state.set({ status: 'idle', data: '', error: '' }); }
}

// 42. WebSocket simulation store (messages signal)
@Component({
  selector: 'ex-42', standalone: true,
  template: `
    <p><strong>WebSocket simulation store:</strong></p>
    <div style="font-size:13px">
      <div style="display:flex;gap:6px;margin-bottom:6px;align-items:center">
        <div style="width:8px;height:8px;border-radius:50%"
          [style.background]="connected() ? '#48bb78' : '#f56565'"></div>
        <span>{{ connected() ? 'Connected' : 'Disconnected' }}</span>
        <button (click)="toggle()">{{ connected() ? 'Disconnect' : 'Connect' }}</button>
      </div>
      <div style="height:100px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:4px;padding:6px;font-family:monospace;font-size:11px;background:#1a202c;color:#a0aec0">
        @for (msg of messages(); track msg) {
          <div>{{ msg }}</div>
        }
        @if (!messages().length) { <span>No messages yet...</span> }
      </div>
    </div>
  `
})
class Ex42 {
  private state = signal({ connected: false, messages: [] as string[] });
  connected = computed(() => this.state().connected);
  messages  = computed(() => this.state().messages);
  private timer?: ReturnType<typeof setInterval>;
  private destroyRef = inject(DestroyRef);
  constructor() { this.destroyRef.onDestroy(() => this.disconnect()); }
  toggle() { this.connected() ? this.disconnect() : this.connect(); }
  connect() {
    this.state.update(s => ({ ...s, connected: true }));
    const events = ['ping', 'data:{"count":42}', 'update:user', 'heartbeat', 'data:{"price":99.5}'];
    let i = 0;
    this.timer = setInterval(() => {
      this.state.update(s => ({
        ...s, messages: [...s.messages.slice(-9), `[${new Date().toLocaleTimeString()}] ${events[i++ % events.length]}`]
      }));
    }, 1000);
  }
  disconnect() {
    clearInterval(this.timer);
    this.state.update(s => ({ ...s, connected: false }));
  }
}

// 43. SSE simulation store (events signal)
@Component({
  selector: 'ex-43', standalone: true,
  template: `
    <p><strong>Server-Sent Events (SSE) simulation store:</strong></p>
    <div style="font-size:13px">
      <div style="display:flex;gap:6px;margin-bottom:6px">
        <button (click)="start()" [disabled]="active()">Start SSE Stream</button>
        <button (click)="stop()"  [disabled]="!active()">Stop</button>
        <span style="color:#718096;font-size:11px">{{ events().length }} events received</span>
      </div>
      <div style="height:80px;overflow-y:auto;background:#f7fafc;border-radius:4px;padding:6px;font-size:11px">
        @for (evt of events(); track evt) {
          <div>{{ evt }}</div>
        }
        @if (!events().length) { <span style="color:#a0aec0">Waiting for events...</span> }
      </div>
    </div>
  `
})
class Ex43 {
  private state = signal({ events: [] as string[], active: false });
  events = computed(() => this.state().events);
  active = computed(() => this.state().active);
  private timer?: ReturnType<typeof setInterval>;
  private destroyRef = inject(DestroyRef);
  constructor() { this.destroyRef.onDestroy(() => this.stop()); }
  start() {
    this.state.update(s => ({ ...s, active: true }));
    const types = ['update', 'insert', 'delete', 'refresh'];
    let i = 0;
    this.timer = setInterval(() => {
      this.state.update(s => ({
        ...s, events: [...s.events.slice(-7), `event:${types[i++ % 4]} data:id=${Math.floor(Math.random() * 100)}`]
      }));
    }, 800);
  }
  stop() { clearInterval(this.timer); this.state.update(s => ({ ...s, active: false })); }
}

// 44. Signal + RxJS interop (toObservable from store signal)
@Component({
  selector: 'ex-44', standalone: true,
  template: `
    <p><strong>Signal ↔ RxJS interop pattern:</strong></p>
    <pre>
import {{ '{' }} toObservable, toSignal {{ '}' }} from '@angular/core/rxjs-interop';

@Injectable()
class ProductStore {{ '{' }}
  private querySignal = signal('');

  // Signal → Observable (so we can use RxJS operators)
  private query$ = toObservable(this.querySignal);

  // Use debounceTime, switchMap etc. on the observable
  private results$ = this.query$.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(q => this.api.search(q))
  );

  // Observable → Signal (back to signal-world for template)
  results = toSignal(this.results$, {{ '{' }} initialValue: [] {{ '}' }});

  setQuery(q: string) {{ '{' }} this.querySignal.set(q); {{ '}' }}
{{ '}' }}</pre>
    <p>Counter (signal → Observable → back to signal): <strong>{{ count() }}</strong></p>
    <button (click)="count.update(c => c + 1)">Increment</button>
  `
})
class Ex44 {
  count = signal(0);
}

// 45. Store migration to plain signals (comparison)
@Component({
  selector: 'ex-45', standalone: true,
  template: `
    <p><strong>ComponentStore vs plain signals — comparison:</strong></p>
    <table style="border-collapse:collapse;font-size:11px;width:100%">
      <tr style="background:#edf2f7">
        <th style="padding:4px 8px;border:1px solid #cbd5e0">Feature</th>
        <th style="padding:4px 8px;border:1px solid #cbd5e0">ComponentStore</th>
        <th style="padding:4px 8px;border:1px solid #cbd5e0">Plain Signals</th>
      </tr>
      @for (row of rows; track row.feature) {
        <tr>
          <td style="padding:4px 8px;border:1px solid #cbd5e0;font-weight:500">{{ row.feature }}</td>
          <td style="padding:4px 8px;border:1px solid #cbd5e0">{{ row.cs }}</td>
          <td style="padding:4px 8px;border:1px solid #cbd5e0">{{ row.ps }}</td>
        </tr>
      }
    </table>
  `
})
class Ex45 {
  rows = [
    { feature: 'State shape',     cs: 'Single state object',      ps: 'Multiple signals or one' },
    { feature: 'RxJS support',    cs: 'Built-in (effect/tapResponse)', ps: 'Via toObservable/toSignal' },
    { feature: 'Dependency',      cs: '@ngrx/component-store',    ps: 'Zero dependencies' },
    { feature: 'Boilerplate',     cs: 'Moderate',                  ps: 'Minimal' },
    { feature: 'Dev experience',  cs: 'Familiar to NgRx users',    ps: 'Idiomatic Angular 16+' },
  ];
}

// 46. Undo/redo store (history stack signal)
@Component({
  selector: 'ex-46', standalone: true,
  template: `
    <p><strong>Undo/redo store with history stack:</strong></p>
    <div style="font-size:13px">
      <div style="margin-bottom:8px">
        <input [value]="text()" (input)="setText(getVal($event))"
          placeholder="Type something..." style="padding:4px 8px;width:200px" />
      </div>
      <div style="display:flex;gap:6px;margin-bottom:8px">
        <button (click)="undo()" [disabled]="!canUndo()">↩ Undo ({{ pastLen() }})</button>
        <button (click)="redo()" [disabled]="!canRedo()">↪ Redo ({{ futureLen() }})</button>
      </div>
      <p>Current: "<strong>{{ text() }}</strong>"</p>
    </div>
  `
})
class Ex46 {
  private past    = signal<string[]>([]);
  private present = signal('');
  private future  = signal<string[]>([]);
  text       = computed(() => this.present());
  canUndo    = computed(() => this.past().length > 0);
  canRedo    = computed(() => this.future().length > 0);
  pastLen    = computed(() => this.past().length);
  futureLen  = computed(() => this.future().length);
  setText(val: string) {
    this.past.update(p => [...p, this.present()]);
    this.present.set(val);
    this.future.set([]);
  }
  undo() {
    if (!this.canUndo()) return;
    const newPast = this.past().slice(0, -1);
    const prev = this.past()[this.past().length - 1];
    this.future.update(f => [this.present(), ...f]);
    this.present.set(prev);
    this.past.set(newPast);
  }
  redo() {
    if (!this.canRedo()) return;
    this.past.update(p => [...p, this.present()]);
    this.present.set(this.future()[0]);
    this.future.update(f => f.slice(1));
  }
  getVal(e: Event) { return (e.target as HTMLInputElement).value; }
}

// 47. Optimistic + rollback store
@Component({
  selector: 'ex-47', standalone: true,
  template: `
    <p><strong>Optimistic update + rollback pattern (full implementation):</strong></p>
    <div style="font-size:13px">
      @for (item of items(); track item.id) {
        <div style="display:flex;gap:8px;align-items:center;padding:4px;border-bottom:1px solid #e2e8f0"
          [style.opacity]="item.saving ? '0.6' : '1'">
          <input type="checkbox" [checked]="item.done" (change)="toggle(item.id)" [disabled]="item.saving" />
          <span [style.textDecoration]="item.done ? 'line-through' : 'none'" style="flex:1">{{ item.text }}</span>
          @if (item.saving) { <span style="font-size:10px;color:#718096">saving...</span> }
          @if (item.error)  { <span style="font-size:10px;color:#f56565">failed — <button (click)="retry(item.id)">retry</button></span> }
        </div>
      }
      <p style="color:#718096;font-size:11px">Toggle updates instantly; 40% server failure → rollback</p>
    </div>
  `
})
class Ex47 {
  private state = signal({
    items: [
      { id: 1, text: 'Buy groceries', done: false, saving: false, error: false },
      { id: 2, text: 'Write tests',   done: true,  saving: false, error: false },
      { id: 3, text: 'Deploy app',    done: false, saving: false, error: false },
    ]
  });
  items = computed(() => this.state().items);
  toggle(id: number) {
    const original = this.state().items.map(i => ({ ...i }));
    this.state.update(s => ({
      items: s.items.map(i => i.id === id ? { ...i, done: !i.done, saving: true, error: false } : i)
    }));
    setTimeout(() => {
      if (Math.random() < 0.4) {
        this.state.update(s => ({ items: original.map(i => i.id === id ? { ...i, error: true, saving: false } : i) }));
      } else {
        this.state.update(s => ({ items: s.items.map(i => i.id === id ? { ...i, saving: false } : i) }));
      }
    }, 700);
  }
  retry(id: number) {
    this.state.update(s => ({ items: s.items.map(i => i.id === id ? { ...i, error: false } : i) }));
    this.toggle(id);
  }
}

// 48. Derived computed views (multiple computed from state)
@Component({
  selector: 'ex-48', standalone: true,
  template: `
    <p><strong>Multiple derived computed signals from a single state:</strong></p>
    <div style="font-size:13px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
        <div style="background:#f0fff4;padding:8px;border-radius:4px">
          <div style="font-size:11px;color:#718096">Total Items</div>
          <div style="font-size:20px;font-weight:bold">{{ total() }}</div>
        </div>
        <div style="background:#ebf8ff;padding:8px;border-radius:4px">
          <div style="font-size:11px;color:#718096">Active</div>
          <div style="font-size:20px;font-weight:bold">{{ active() }}</div>
        </div>
        <div style="background:#fefcbf;padding:8px;border-radius:4px">
          <div style="font-size:11px;color:#718096">Avg Price</div>
          <div style="font-size:20px;font-weight:bold">\${{ avgPrice() }}</div>
        </div>
        <div style="background:#fff5f5;padding:8px;border-radius:4px">
          <div style="font-size:11px;color:#718096">Total Value</div>
          <div style="font-size:20px;font-weight:bold">\${{ totalValue() }}</div>
        </div>
      </div>
      <button (click)="addItem()">Add Random Item</button>
    </div>
  `
})
class Ex48 {
  private state = signal({
    items: [
      { id: 1, name: 'A', active: true,  price: 10 },
      { id: 2, name: 'B', active: false, price: 25 },
      { id: 3, name: 'C', active: true,  price: 15 },
    ]
  });
  private items = computed(() => this.state().items);
  total      = computed(() => this.items().length);
  active     = computed(() => this.items().filter(i => i.active).length);
  avgPrice   = computed(() => this.total() ? (this.items().reduce((s, i) => s + i.price, 0) / this.total()).toFixed(2) : '0');
  totalValue = computed(() => this.items().reduce((s, i) => s + i.price, 0));
  addItem() {
    const id = this.state().items.length + 1;
    this.state.update(s => ({
      items: [...s.items, { id, name: String.fromCharCode(64 + id), active: Math.random() > 0.5, price: Math.floor(Math.random() * 50) + 5 }]
    }));
  }
}

// 49. Store composition (combine two stores)
@Component({
  selector: 'ex-49', standalone: true,
  template: `
    <p><strong>Store composition — combine two stores:</strong></p>
    <div style="font-size:13px">
      <div style="display:flex;gap:12px">
        <div style="flex:1;background:#f0fff4;padding:8px;border-radius:4px">
          <strong>Auth Store</strong>
          <p>User: {{ user() || 'not logged in' }}</p>
          <button (click)="toggleAuth()">{{ user() ? 'Logout' : 'Login' }}</button>
        </div>
        <div style="flex:1;background:#ebf8ff;padding:8px;border-radius:4px">
          <strong>Cart Store</strong>
          <p>Items: {{ cartCount() }} | Total: \${{ cartTotal() }}</p>
          <button (click)="addToCart()" [disabled]="!user()">Add Item</button>
        </div>
      </div>
      <div style="margin-top:8px;padding:8px;background:#fefcbf;border-radius:4px">
        <strong>Combined View</strong>
        <p>{{ composedView() }}</p>
      </div>
    </div>
  `
})
class Ex49 {
  // Auth store
  private authState = signal({ user: '' });
  user = computed(() => this.authState().user);
  // Cart store
  private cartState = signal({ items: [] as number[] });
  cartCount = computed(() => this.cartState().items.length);
  cartTotal = computed(() => this.cartState().items.reduce((s, p) => s + p, 0));
  // Composed view from both stores
  composedView = computed(() => {
    if (!this.user()) return 'Please login to view cart.';
    return `${this.user()} has ${this.cartCount()} item(s) totaling $${this.cartTotal()}`;
  });
  toggleAuth() {
    this.authState.update(s => ({ user: s.user ? '' : 'Alice' }));
    if (!this.user()) this.cartState.set({ items: [] });
  }
  addToCart() {
    const price = Math.floor(Math.random() * 50) + 5;
    this.cartState.update(s => ({ items: [...s.items, price] }));
  }
}

// 50. Full production store: search + filter + sort + CRUD + undo
@Component({
  selector: 'ex-50', standalone: true,
  template: `
    <p><strong>Full production ComponentStore — search + filter + sort + CRUD + undo:</strong></p>
    <div style="font-size:12px">
      <div style="display:flex;gap:6px;flex-wrap:wrap;padding:6px;background:#f7fafc;border-radius:4px;margin-bottom:6px">
        <input [value]="q()" (input)="q.set(getVal($event))" placeholder="Search..." style="padding:3px 6px;width:100px" />
        <select (change)="filterStatus.set(getVal($event))">
          @for (s of ['all','active','done']; track s) { <option [value]="s">{{ s }}</option> }
        </select>
        <button (click)="toggleSort()">Sort {{ sortDir() === 'asc' ? '↑' : '↓' }}</button>
        <button (click)="undo()" [disabled]="!canUndo()">↩ Undo</button>
        <span style="margin-left:auto;color:#718096">{{ visible().length }}/{{ items().length }}</span>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:6px">
        <input [value]="newTitle()" (input)="newTitle.set(getVal($event))"
          placeholder="New item..." style="padding:3px 6px;flex:1" />
        <button (click)="add()" [disabled]="!newTitle().trim()">Add</button>
      </div>
      @for (item of visible(); track item.id) {
        <div style="display:flex;gap:6px;align-items:center;padding:3px 0;border-bottom:1px solid #e2e8f0">
          <input type="checkbox" [checked]="item.done" (change)="toggle(item.id)" />
          <span style="flex:1" [style.textDecoration]="item.done ? 'line-through' : 'none'"
            [style.color]="item.done ? '#a0aec0' : '#2d3748'">{{ item.title }}</span>
          <button (click)="remove(item.id)">✕</button>
        </div>
      }
    </div>
  `
})
class Ex50 {
  private nextId = 1;
  private history = signal<{id:number;title:string;done:boolean}[][]>([]);
  private state   = signal({ items: [{id:0, title:'Buy milk', done:false},{id:1,title:'Read docs',done:true}] as {id:number;title:string;done:boolean}[] });
  items        = computed(() => this.state().items);
  q            = signal('');
  filterStatus = signal('all');
  sortDir      = signal<'asc'|'desc'>('asc');
  newTitle     = signal('');
  canUndo      = computed(() => this.history().length > 0);
  visible = computed(() => {
    let r = this.items().filter(i => i.title.toLowerCase().includes(this.q().toLowerCase()));
    if (this.filterStatus() !== 'all') r = r.filter(i => this.filterStatus() === 'done' ? i.done : !i.done);
    return [...r].sort((a, b) => this.sortDir() === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title));
  });
  private save() { this.history.update(h => [...h.slice(-9), this.state().items.map(i => ({ ...i }))]); }
  add() {
    if (!this.newTitle().trim()) return;
    this.save();
    this.state.update(s => ({ items: [...s.items, { id: this.nextId++, title: this.newTitle(), done: false }] }));
    this.newTitle.set('');
  }
  toggle(id: number) { this.save(); this.state.update(s => ({ items: s.items.map(i => i.id === id ? { ...i, done: !i.done } : i) })); }
  remove(id: number) { this.save(); this.state.update(s => ({ items: s.items.filter(i => i.id !== id) })); }
  undo() { if (!this.canUndo()) return; const prev = this.history()[this.history().length - 1]; this.state.set({ items: prev }); this.history.update(h => h.slice(0, -1)); }
  toggleSort() { this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc'); }
  getVal(e: Event) { return (e.target as HTMLInputElement | HTMLSelectElement).value; }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Ex01, Ex02, Ex03, Ex04, Ex05, Ex06, Ex07, Ex08, Ex09, Ex10,
            Ex11, Ex12, Ex13, Ex14, Ex15, Ex16, Ex17, Ex18, Ex19, Ex20,
            Ex21, Ex22, Ex23, Ex24, Ex25, Ex26, Ex27, Ex28, Ex29, Ex30,
            Ex31, Ex32, Ex33, Ex34, Ex35, Ex36, Ex37, Ex38, Ex39, Ex40,
            Ex41, Ex42, Ex43, Ex44, Ex45, Ex46, Ex47, Ex48, Ex49, Ex50],
  template: `
    <div style="font-family:sans-serif;max-width:700px;margin:0 auto;padding:20px">
      <h1>Examples 5.4 — NgRx ComponentStore</h1>
      <h4>1. ComponentStore class pattern</h4><ex-01 /><hr />
      <h4>2. State interface definition</h4><ex-02 /><hr />
      <h4>3. State signal initialization</h4><ex-03 /><hr />
      <h4>4. select() via computed signal</h4><ex-04 /><hr />
      <h4>5. updater() — method that patches state</h4><ex-05 /><hr />
      <h4>6. effect() — method with side effects</h4><ex-06 /><hr />
      <h4>7. setState() — replace full state</h4><ex-07 /><hr />
      <h4>8. patchState() — spread partial update</h4><ex-08 /><hr />
      <h4>9. View model (vm) computed signal</h4><ex-09 /><hr />
      <h4>10. tapResponse pattern</h4><ex-10 /><hr />
      <h4>11. Store provided in component providers</h4><ex-11 /><hr />
      <h4>12. Store as singleton service</h4><ex-12 /><hr />
      <h4>13. Destroy cleanup with DestroyRef</h4><ex-13 /><hr />
      <h4>14. Loading state</h4><ex-14 /><hr />
      <h4>15. Error state with retry</h4><ex-15 /><hr />
      <h4>16. CRUD state</h4><ex-16 /><hr />
      <h4>17. Selected item state</h4><ex-17 /><hr />
      <h4>18. Pagination state</h4><ex-18 /><hr />
      <h4>19. Search filter state</h4><ex-19 /><hr />
      <h4>20. Sort state (field + direction)</h4><ex-20 /><hr />
      <h4>21. Optimistic update (apply + rollback)</h4><ex-21 /><hr />
      <h4>22. Retry on error pattern</h4><ex-22 /><hr />
      <h4>23. HTTP load simulation</h4><ex-23 /><hr />
      <h4>24. Router params sync to store</h4><ex-24 /><hr />
      <h4>25. Timer polling</h4><ex-25 /><hr />
      <h4>26. Form sync to store state</h4><ex-26 /><hr />
      <h4>27. Parent-provided store shared by children</h4><ex-27 /><hr />
      <h4>28. Entity-like store (Map by id)</h4><ex-28 /><hr />
      <h4>29. Dialog state store</h4><ex-29 /><hr />
      <h4>30. Accordion state store</h4><ex-30 /><hr />
      <h4>31. Stepper state store</h4><ex-31 /><hr />
      <h4>32. Data table store</h4><ex-32 /><hr />
      <h4>33. Infinite scroll store</h4><ex-33 /><hr />
      <h4>34. Drag-and-drop list store</h4><ex-34 /><hr />
      <h4>35. Multi-select store (Set signal)</h4><ex-35 /><hr />
      <h4>36. Search + results store</h4><ex-36 /><hr />
      <h4>37. Form wizard store</h4><ex-37 /><hr />
      <h4>38. Full CRUD feature with ComponentStore</h4><ex-38 /><hr />
      <h4>39. Generic typed store class&lt;T&gt;</h4><ex-39 /><hr />
      <h4>40. OnPush + store selectSignal pattern</h4><ex-40 /><hr />
      <h4>41. State machine store</h4><ex-41 /><hr />
      <h4>42. WebSocket simulation store</h4><ex-42 /><hr />
      <h4>43. SSE simulation store</h4><ex-43 /><hr />
      <h4>44. Signal + RxJS interop</h4><ex-44 /><hr />
      <h4>45. Store migration to plain signals (comparison)</h4><ex-45 /><hr />
      <h4>46. Undo/redo store</h4><ex-46 /><hr />
      <h4>47. Optimistic + rollback store</h4><ex-47 /><hr />
      <h4>48. Derived computed views</h4><ex-48 /><hr />
      <h4>49. Store composition (combine two stores)</h4><ex-49 /><hr />
      <h4>50. Full production store: search + filter + sort + CRUD + undo</h4><ex-50 /><hr />
    </div>
  `,
})
export class AppComponent {}
