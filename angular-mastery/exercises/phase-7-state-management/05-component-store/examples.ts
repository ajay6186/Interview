import { Component, signal, computed, inject, DestroyRef, OnInit, OnDestroy } from '@angular/core';
import { Subject, of, interval, fromEvent } from 'rxjs';
import { delay, tap, switchMap, map, takeUntil, take, debounceTime, catchError } from 'rxjs/operators';

// ============================================================
// Examples 7.5 — NgRx ComponentStore (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ───────────────────────────────────────────

// 1. ComponentStore class — basic signal state class
@Component({
  selector: 'ex-01', standalone: true,
  template: `
    <p>Count: {{ store.count() }}</p>
    <button (click)="store.increment()">+</button>
    <button (click)="store.decrement()">-</button>
    <small>ComponentStore: encapsulates state + logic in a class</small>
  `
})
class Ex01 {
  store = new CounterStore();
}

class CounterStore {
  private _count = signal(0);
  count = this._count.asReadonly();
  increment() { this._count.update(n => n + 1); }
  decrement() { this._count.update(n => n - 1); }
}

// 2. State interface definition
@Component({
  selector: 'ex-02', standalone: true,
  template: `<pre>{{ code }}</pre>`
})
class Ex02 {
  code = `// Define a typed state interface — single source of truth
interface UserState {
  users: User[];
  selectedId: string | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  page: number;
  pageSize: number;
}

// ComponentStore holds one State object
@Injectable()
export class UserStore extends ComponentStore<UserState> {
  constructor() {
    super({              // initialState
      users: [],
      selectedId: null,
      isLoading: false,
      error: null,
      searchQuery: '',
      page: 0,
      pageSize: 10
    });
  }
}`;
}

// 3. State signal initialization
@Component({
  selector: 'ex-03', standalone: true,
  template: `
    <p>Name: {{ store.name() }}</p>
    <p>Count: {{ store.count() }}</p>
    <p>Active: {{ store.active() }}</p>
    <small>Signal state initialized with defaults</small>
  `
})
class Ex03 {
  store = new SimpleStore();
}

class SimpleStore {
  readonly name = signal('Angular');
  readonly count = signal(0);
  readonly active = signal(true);
}

// 4. select() — computed signal from state
@Component({
  selector: 'ex-04', standalone: true,
  template: `
    <p>Full name: {{ store.fullName() }}</p>
    <p>Summary: {{ store.summary() }}</p>
    <small>select() = computed() derived from state signals</small>
  `
})
class Ex04 {
  store = new ProfileStore();
}

class ProfileStore {
  private _first = signal('John');
  private _last = signal('Doe');
  private _age = signal(30);
  // select() equivalent: computed() derived signals
  fullName = computed(() => `${this._first()} ${this._last()}`);
  summary = computed(() => `${this.fullName()}, age ${this._age()}`);
}

// 5. updater() — method that updates state
@Component({
  selector: 'ex-05', standalone: true,
  template: `
    <p>{{ store.item() }}</p>
    <button (click)="store.setName('Widget')">Set Widget</button>
    <button (click)="store.setPrice(42)">Set Price $42</button>
    <small>updater() = method that patches specific state slice</small>
  `
})
class Ex05 {
  store = new ItemStore();
}

class ItemStore {
  private _name = signal('(none)');
  private _price = signal(0);
  item = computed(() => `${this._name()} — $${this._price()}`);
  // updater() equivalents: typed setter methods
  setName(name: string) { this._name.set(name); }
  setPrice(price: number) { this._price.set(price); }
}

// 6. effect() — method with RxJS side effects
@Component({
  selector: 'ex-06', standalone: true,
  template: `
    <button (click)="store.loadUser('u1')">Load User</button>
    <p>{{ store.status() }}</p>
    <small>effect() = method that runs RxJS side effects and patches state</small>
  `
})
class Ex06 {
  store = new UserLoadStore();
}

class UserLoadStore {
  private _status = signal('idle');
  status = this._status.asReadonly();

  loadUser(id: string) {
    this._status.set('loading...');
    of({ id, name: 'Alice', email: 'alice@test.com' })
      .pipe(delay(600))
      .subscribe(user => this._status.set(`Loaded: ${user.name}`));
  }
}

// 7. setState() — replace full state object
@Component({
  selector: 'ex-07', standalone: true,
  template: `
    <button (click)="store.setFull()">setState (full replace)</button>
    <button (click)="store.reset()">Reset</button>
    <p>{{ store.display() }}</p>
    <small>setState replaces the entire state object at once</small>
  `
})
class Ex07 {
  store = new FullStateStore();
}

interface FullState { name: string; score: number; active: boolean; }

class FullStateStore {
  private _state = signal<FullState>({ name: 'initial', score: 0, active: false });
  display = computed(() => `${this._state().name} | score:${this._state().score} | active:${this._state().active}`);

  setFull() { this._state.set({ name: 'updated', score: 99, active: true }); }
  reset() { this._state.set({ name: 'initial', score: 0, active: false }); }
}

// 8. patchState() — spread partial state update
@Component({
  selector: 'ex-08', standalone: true,
  template: `
    <button (click)="store.patchName('Bob')">Patch name</button>
    <button (click)="store.patchScore(100)">Patch score</button>
    <p>{{ store.display() }}</p>
    <small>patchState merges partial updates — other fields unchanged</small>
  `
})
class Ex08 {
  store = new PatchStore();
}

class PatchStore {
  private _state = signal({ name: 'Alice', score: 0, active: true });
  display = computed(() => JSON.stringify(this._state()));

  patchName(name: string) { this._state.update(s => ({ ...s, name })); }
  patchScore(score: number) { this._state.update(s => ({ ...s, score })); }
}

// 9. View model (vm) — combined computed signal
@Component({
  selector: 'ex-09', standalone: true,
  template: `
    <button (click)="store.load()">Load</button>
    @if (store.vm().isLoading) { <p>Loading...</p> }
    @if (store.vm().error) { <p style="color:red">{{ store.vm().error }}</p> }
    @if (!store.vm().isLoading) {
      <p>Items: {{ store.vm().itemCount }}</p>
      <p>Query: "{{ store.vm().query }}"</p>
    }
  `
})
class Ex09 {
  store = new VmStore();
}

class VmStore {
  private _items = signal<string[]>([]);
  private _query = signal('');
  private _loading = signal(false);
  private _error = signal('');
  // vm = single computed that exposes all UI-relevant state
  vm = computed(() => ({
    items: this._items(),
    itemCount: this._items().length,
    query: this._query(),
    isLoading: this._loading(),
    error: this._error()
  }));

  load() {
    this._loading.set(true);
    of(['Angular', 'React', 'Vue']).pipe(delay(500)).subscribe(items => {
      this._items.set(items);
      this._loading.set(false);
    });
  }
}

// 10. tapResponse — success + error handler pattern
@Component({
  selector: 'ex-10', standalone: true,
  template: `
    <button (click)="load(false)">Load (success)</button>
    <button (click)="load(true)">Load (error)</button>
    <p>{{ store.status() }}</p>
    <small>tapResponse: clean success+error handler (like .subscribe with guard)</small>
  `
})
class Ex10 {
  store = new TapResponseStore();
}

class TapResponseStore {
  private _status = signal('idle');
  status = this._status.asReadonly();

  load(fail: boolean) {
    this._status.set('loading...');
    of(null).pipe(
      delay(400),
      switchMap(() => fail
        ? new Subject<string>() // never emits — timeout
        : of('Users loaded: 5 items')
      ),
      tap({ error: () => {} })
    ).subscribe({
      next: (msg: string) => this._status.set(msg),
      error: (e: Error) => this._status.set(`Error: ${e.message}`)
    });
    if (fail) setTimeout(() => this._status.set('Error: Network timeout'), 500);
  }
}

// 11. Store provided in component providers
@Component({
  selector: 'ex-11', standalone: true,
  template: `
    <p>{{ store.value() }}</p>
    <button (click)="store.set('hello from component!')">Update</button>
    <small>Store provided at component level — scoped to component tree</small>
  `,
  providers: [ComponentScopedStore]
})
class Ex11 {
  store = inject(ComponentScopedStore);
}

class ComponentScopedStore {
  private _value = signal('initial value');
  value = this._value.asReadonly();
  set(v: string) { this._value.set(v); }
}

// 12. Store as root singleton service
@Component({
  selector: 'ex-12', standalone: true,
  template: `
    <p>Root counter: {{ store.count() }}</p>
    <button (click)="store.inc()">+ (root-scoped)</button>
    <small>Root store persists across components — all share state</small>
    <pre>{{ code }}</pre>
  `,
  providers: [RootLikeStore]
})
class Ex12 {
  store = inject(RootLikeStore);
  code = `// @Injectable({ providedIn: 'root' })
// export class AppStore extends ComponentStore<AppState> {}
// Then inject anywhere — singleton across entire app`;
}

class RootLikeStore {
  private _count = signal(0);
  count = this._count.asReadonly();
  inc() { this._count.update(n => n + 1); }
}

// 13. Cleanup with DestroyRef.onDestroy
@Component({
  selector: 'ex-13', standalone: true,
  template: `
    <p>Tick: {{ tick() }}</p>
    <small>Subscription auto-cancelled when component destroyed via DestroyRef</small>
    <pre>{{ code }}</pre>
  `
})
class Ex13 implements OnDestroy {
  tick = signal(0);
  destroy$ = new Subject<void>();
  code = `// Modern pattern with DestroyRef:
constructor() {
  const destroyRef = inject(DestroyRef);
  interval(1000).pipe(
    takeUntilDestroyed(destroyRef)
  ).subscribe(n => this.tick.set(n));
}`;

  constructor() {
    interval(1000).pipe(
      take(60),
      takeUntil(this.destroy$)
    ).subscribe(n => this.tick.set(n));
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }
}

// ─── INTERMEDIATE (14–26) ───────────────────────────────────

// 14. Loading state (isLoading signal)
@Component({
  selector: 'ex-14', standalone: true,
  template: `
    <button (click)="store.load()" [disabled]="store.isLoading()">
      {{ store.isLoading() ? 'Loading...' : 'Load Data' }}
    </button>
    @if (store.data()) { <p>{{ store.data() }}</p> }
  `
})
class Ex14 {
  store = new LoadingStore();
}

class LoadingStore {
  private _isLoading = signal(false);
  private _data = signal('');
  isLoading = this._isLoading.asReadonly();
  data = this._data.asReadonly();

  load() {
    this._isLoading.set(true);
    of('Server response: 200 OK').pipe(delay(800)).subscribe(d => {
      this._data.set(d);
      this._isLoading.set(false);
    });
  }
}

// 15. Error state (errorMessage signal)
@Component({
  selector: 'ex-15', standalone: true,
  template: `
    <button (click)="store.load(false)">Load (success)</button>
    <button (click)="store.load(true)">Load (error)</button>
    @if (store.isLoading()) { <p>Loading...</p> }
    @if (store.error()) { <p style="color:red">{{ store.error() }}</p> }
    @if (store.data() && !store.error()) { <p>{{ store.data() }}</p> }
  `
})
class Ex15 {
  store = new ErrorStore();
}

class ErrorStore {
  private _isLoading = signal(false);
  private _error = signal('');
  private _data = signal('');
  isLoading = this._isLoading.asReadonly();
  error = this._error.asReadonly();
  data = this._data.asReadonly();

  load(fail: boolean) {
    this._isLoading.set(true);
    this._error.set('');
    of(fail).pipe(delay(600)).subscribe(shouldFail => {
      this._isLoading.set(false);
      if (shouldFail) this._error.set('Error 500: Internal server error');
      else this._data.set('Data loaded successfully');
    });
  }
}

// 16. CRUD state (items + add + update + delete)
@Component({
  selector: 'ex-16', standalone: true,
  template: `
    <input #inp placeholder="Item name" />
    <button (click)="store.add(inp.value); inp.value=''">Add</button>
    @for (item of store.items(); track item.id) {
      <p>{{ item.name }}
        <button (click)="store.rename(item.id, item.name + '!')">Edit</button>
        <button (click)="store.remove(item.id)">Del</button>
      </p>
    }
  `
})
class Ex16 {
  store = new CrudStore();
}

class CrudStore {
  private _items = signal<{ id: string; name: string }[]>([]);
  private counter = 1;
  items = this._items.asReadonly();

  add(name: string) {
    if (!name.trim()) return;
    this._items.update(items => [...items, { id: `i${this.counter++}`, name }]);
  }

  rename(id: string, name: string) {
    this._items.update(items => items.map(i => i.id === id ? { ...i, name } : i));
  }

  remove(id: string) {
    this._items.update(items => items.filter(i => i.id !== id));
  }
}

// 17. Selected item tracking (selectedId signal)
@Component({
  selector: 'ex-17', standalone: true,
  template: `
    <button (click)="store.init()">Init</button>
    @for (u of store.users(); track u.id) {
      <p [style.fontWeight]="store.selectedId() === u.id ? 'bold' : 'normal'"
         (click)="store.select(u.id)" style="cursor:pointer">
        {{ u.name }}
      </p>
    }
    @if (store.selected()) { <p>Selected: {{ store.selected()!.name }}</p> }
  `
})
class Ex17 {
  store = new SelectionStore();
}

class SelectionStore {
  private _users = signal<{ id: string; name: string }[]>([]);
  private _selectedId = signal('');
  users = this._users.asReadonly();
  selectedId = this._selectedId.asReadonly();
  selected = computed(() => this._users().find(u => u.id === this._selectedId()) ?? null);

  init() { this._users.set(['Alice', 'Bob', 'Carol'].map((n, i) => ({ id: `u${i + 1}`, name: n }))); }
  select(id: string) { this._selectedId.set(id); }
}

// 18. Pagination state (page + pageSize + total)
@Component({
  selector: 'ex-18', standalone: true,
  template: `
    <button (click)="store.init()">Load 10 items</button>
    <button (click)="store.prev()" [disabled]="store.page() === 0">Prev</button>
    Page {{ store.page() + 1 }} / {{ store.totalPages() }}
    <button (click)="store.next()" [disabled]="store.page() >= store.totalPages() - 1">Next</button>
    <ul>@for (i of store.pageItems(); track i) { <li>{{ i }}</li> }</ul>
  `
})
class Ex18 {
  store = new PaginationStore();
}

class PaginationStore {
  private _all = signal<string[]>([]);
  private _page = signal(0);
  private _pageSize = signal(3);
  page = this._page.asReadonly();
  totalPages = computed(() => Math.ceil(this._all().length / this._pageSize()));
  pageItems = computed(() => this._all().slice(this._page() * this._pageSize(), (this._page() + 1) * this._pageSize()));

  init() { this._all.set(Array.from({ length: 10 }, (_, i) => `Item ${i + 1}`)); }
  prev() { this._page.update(p => Math.max(0, p - 1)); }
  next() { this._page.update(p => Math.min(this.totalPages() - 1, p + 1)); }
}

// 19. Search filter (query signal + filtered computed)
@Component({
  selector: 'ex-19', standalone: true,
  template: `
    <button (click)="store.init()">Init</button>
    <input (input)="store.setQuery($any($event.target).value)" placeholder="Search..." />
    <p>{{ store.filtered().length }} results</p>
    <ul>@for (item of store.filtered(); track item) { <li>{{ item }}</li> }</ul>
  `
})
class Ex19 {
  store = new SearchStore();
}

class SearchStore {
  private _items = signal<string[]>([]);
  private _query = signal('');
  filtered = computed(() => {
    const q = this._query().toLowerCase();
    return q ? this._items().filter(i => i.toLowerCase().includes(q)) : this._items();
  });

  init() { this._items.set(['Angular', 'React', 'Vue', 'Svelte', 'Solid', 'Ember', 'Alpine']); }
  setQuery(q: string) { this._query.set(q); }
}

// 20. Sort state (field + direction + sorted computed)
@Component({
  selector: 'ex-20', standalone: true,
  template: `
    <button (click)="store.init()">Init</button>
    <button (click)="store.setSort('name')">Sort by Name</button>
    <button (click)="store.setSort('age')">Sort by Age</button>
    <button (click)="store.toggleDir()">Direction: {{ store.dir() }}</button>
    <ul>@for (u of store.sorted(); track u.id) { <li>{{ u.name }} ({{ u.age }})</li> }</ul>
  `
})
class Ex20 {
  store = new SortStore();
}

class SortStore {
  private _items = signal<{ id: string; name: string; age: number }[]>([]);
  private _field = signal<'name' | 'age'>('name');
  private _dir = signal<'asc' | 'desc'>('asc');
  dir = this._dir.asReadonly();
  sorted = computed(() => {
    const d = this._dir() === 'asc' ? 1 : -1;
    return [...this._items()].sort((a, b) => {
      const f = this._field();
      return typeof a[f] === 'string'
        ? (a[f] as string).localeCompare(b[f] as string) * d
        : ((a[f] as number) - (b[f] as number)) * d;
    });
  });

  init() { this._items.set([{ id: '1', name: 'Zara', age: 25 }, { id: '2', name: 'Alice', age: 30 }, { id: '3', name: 'Mike', age: 22 }]); }
  setSort(f: 'name' | 'age') { this._field.set(f); }
  toggleDir() { this._dir.update(d => d === 'asc' ? 'desc' : 'asc'); }
}

// 21. Optimistic update (apply immediately + rollback)
@Component({
  selector: 'ex-21', standalone: true,
  template: `
    <button (click)="store.init()">Init</button>
    <button (click)="store.toggleFail()">Fail next: {{ store.willFail() }}</button>
    @for (item of store.items(); track item.id) {
      <p [style.opacity]="item.pending ? '0.5' : '1'">
        {{ item.name }} {{ item.pending ? '(saving...)' : '' }}
        <button (click)="store.rename(item.id)">Rename (optimistic)</button>
      </p>
    }
    @if (store.msg()) { <p [style.color]="store.isError() ? 'red' : 'green'">{{ store.msg() }}</p> }
  `
})
class Ex21 {
  store = new OptimisticStore();
}

class OptimisticStore {
  private _items = signal<{ id: string; name: string; pending: boolean }[]>([]);
  private _willFail = signal(false);
  private _msg = signal('');
  items = this._items.asReadonly();
  willFail = this._willFail.asReadonly();
  msg = this._msg.asReadonly();
  isError = computed(() => this._msg().startsWith('Error'));

  init() { this._items.set(['Alpha', 'Beta'].map((n, i) => ({ id: `i${i + 1}`, name: n, pending: false }))); }
  toggleFail() { this._willFail.update(v => !v); }

  rename(id: string) {
    const prev = this._items().find(i => i.id === id)!;
    this._items.update(items => items.map(i => i.id === id ? { ...i, name: i.name + '*', pending: true } : i));
    of(this._willFail()).pipe(delay(700)).subscribe(fail => {
      if (fail) {
        this._items.update(items => items.map(i => i.id === id ? { ...prev, pending: false } : i));
        this._msg.set('Error: rolled back');
      } else {
        this._items.update(items => items.map(i => i.id === id ? { ...i, pending: false } : i));
        this._msg.set('Saved!');
      }
      setTimeout(() => this._msg.set(''), 2000);
    });
  }
}

// 22. Retry on error (retryCount signal)
@Component({
  selector: 'ex-22', standalone: true,
  template: `
    <button (click)="store.fetch()">Fetch (retries up to 3x)</button>
    <p>{{ store.status() }}</p>
    <p>Retry count: {{ store.retryCount() }}</p>
  `
})
class Ex22 {
  store = new RetryStore();
}

class RetryStore {
  private _status = signal('idle');
  private _retryCount = signal(0);
  status = this._status.asReadonly();
  retryCount = this._retryCount.asReadonly();

  fetch() {
    this._retryCount.set(0);
    this._attempt(0);
  }

  private _attempt(n: number) {
    this._status.set(`Attempting #${n + 1}...`);
    of(n < 2 ? 'error' : 'success').pipe(delay(400)).subscribe(result => {
      if (result === 'error' && n < 3) {
        this._retryCount.set(n + 1);
        this._attempt(n + 1);
      } else if (result === 'success') {
        this._status.set('Success after retries!');
      } else {
        this._status.set('Failed after 3 retries');
      }
    });
  }
}

// 23. HTTP load simulation with delay
@Component({
  selector: 'ex-23', standalone: true,
  template: `
    <button (click)="store.loadUsers()">Load Users</button>
    @if (store.isLoading()) { <p>Fetching from server...</p> }
    <ul>@for (u of store.users(); track u.id) { <li>{{ u.name }} — {{ u.email }}</li> }</ul>
  `
})
class Ex23 {
  store = new HttpSimStore();
}

interface UserItem { id: string; name: string; email: string; }

class HttpSimStore {
  private _users = signal<UserItem[]>([]);
  private _isLoading = signal(false);
  users = this._users.asReadonly();
  isLoading = this._isLoading.asReadonly();

  loadUsers() {
    this._isLoading.set(true);
    of([
      { id: 'u1', name: 'Alice', email: 'alice@api.com' },
      { id: 'u2', name: 'Bob', email: 'bob@api.com' },
      { id: 'u3', name: 'Carol', email: 'carol@api.com' }
    ]).pipe(delay(700)).subscribe(users => {
      this._users.set(users);
      this._isLoading.set(false);
    });
  }
}

// 24. Router params sync (activatedRoute signal)
@Component({
  selector: 'ex-24', standalone: true,
  template: `
    <button (click)="store.setId('u1')">Route: /users/u1</button>
    <button (click)="store.setId('u2')">Route: /users/u2</button>
    <button (click)="store.setId('u3')">Route: /users/u3</button>
    @if (store.isLoading()) { <p>Loading user {{ store.routeId() }}...</p> }
    @if (store.user()) { <p>User: {{ store.user()!.name }}</p> }
    <small>Simulates ActivatedRoute params → store.load(id) pattern</small>
  `
})
class Ex24 {
  store = new RouteParamStore();
}

class RouteParamStore {
  private _routeId = signal('');
  private _user = signal<UserItem | null>(null);
  private _isLoading = signal(false);
  routeId = this._routeId.asReadonly();
  user = this._user.asReadonly();
  isLoading = this._isLoading.asReadonly();
  private load$ = new Subject<string>();

  constructor() {
    this.load$.pipe(
      switchMap(id => {
        this._isLoading.set(true);
        const names: Record<string, string> = { u1: 'Alice', u2: 'Bob', u3: 'Carol' };
        return of({ id, name: names[id] ?? 'Unknown', email: `${id}@test.com` }).pipe(delay(500));
      })
    ).subscribe(u => { this._user.set(u); this._isLoading.set(false); });
  }

  setId(id: string) { this._routeId.set(id); this.load$.next(id); }
}

// 25. Timer polling (interval refresh)
@Component({
  selector: 'ex-25', standalone: true,
  template: `
    <button (click)="store.start()">Start Polling (2s)</button>
    <button (click)="store.stop()">Stop</button>
    <p>Last updated: {{ store.lastUpdated() }}</p>
    <p>Value: {{ store.value() }}</p>
  `
})
class Ex25 implements OnDestroy {
  store = new PollingStore();
  ngOnDestroy() { this.store.stop(); }
}

class PollingStore {
  private _value = signal('(not started)');
  private _lastUpdated = signal('');
  private stop$ = new Subject<void>();
  value = this._value.asReadonly();
  lastUpdated = this._lastUpdated.asReadonly();

  start() {
    this.stop$.next();
    interval(2000).pipe(takeUntil(this.stop$)).subscribe(() => {
      this._value.set(`Server data at tick ${Date.now()}`);
      this._lastUpdated.set(new Date().toLocaleTimeString());
    });
  }

  stop() { this.stop$.next(); }
}

// 26. Form sync (formValue → patchState)
@Component({
  selector: 'ex-26', standalone: true,
  template: `
    <input (input)="store.setName($any($event.target).value)" [value]="store.name()" placeholder="Name" />
    <input (input)="store.setEmail($any($event.target).value)" [value]="store.email()" placeholder="Email" />
    <p>State: {{ store.formState() }}</p>
    <small>Form input → patchState keeps form and store in sync</small>
  `
})
class Ex26 {
  store = new FormSyncStore();
}

class FormSyncStore {
  private _name = signal('');
  private _email = signal('');
  name = this._name.asReadonly();
  email = this._email.asReadonly();
  formState = computed(() => `name="${this._name()}" email="${this._email()}"`);

  setName(name: string) { this._name.set(name); }
  setEmail(email: string) { this._email.set(email); }
}

// ─── NESTED (27–38) ─────────────────────────────────────────

// 27. Parent-provided store used by child siblings
@Component({
  selector: 'ex-27-parent',
  standalone: true,
  imports: [],
  template: `
    <div style="border:1px solid #aaa;padding:8px">
      <strong>Parent:</strong>
      <p>Shared count: {{ store.count() }}</p>
    </div>
  `
})
class Ex27Parent {
  store = inject(SharedCountStore);
}

@Component({
  selector: 'ex-27-child',
  standalone: true,
  imports: [],
  template: `<button (click)="store.inc()">Child: Inc Shared Count</button>`
})
class Ex27Child {
  store = inject(SharedCountStore);
}

class SharedCountStore {
  private _count = signal(0);
  count = this._count.asReadonly();
  inc() { this._count.update(n => n + 1); }
}

@Component({
  selector: 'ex-27', standalone: true,
  imports: [Ex27Parent, Ex27Child],
  providers: [SharedCountStore],
  template: `
    <ex-27-parent />
    <ex-27-child />
    <ex-27-child />
    <small>Store provided at parent — both children share same instance</small>
  `
})
class Ex27 {}

// 28. Entity-like store (Map<id, item> signal)
@Component({
  selector: 'ex-28', standalone: true,
  template: `
    <button (click)="store.add()">Add</button>
    @for (item of store.all(); track item.id) {
      <p>{{ item.name }} <button (click)="store.remove(item.id)">Del</button></p>
    }
    <small>Map-based entity store: O(1) lookup by id</small>
  `
})
class Ex28 {
  store = new MapEntityStore();
}

class MapEntityStore {
  private _map = signal(new Map<string, { id: string; name: string }>());
  private counter = 1;
  all = computed(() => [...this._map().values()]);

  add() {
    const id = `i${this.counter}`;
    this._map.update(m => new Map([...m, [id, { id, name: `Item ${this.counter++}` }]]));
  }
  remove(id: string) {
    this._map.update(m => { const n = new Map(m); n.delete(id); return n; });
  }
}

// 29. Dialog state store (isOpen + dialogData + result)
@Component({
  selector: 'ex-29', standalone: true,
  template: `
    <button (click)="store.open({ title: 'Delete item?', confirmLabel: 'Delete' })">Open Dialog</button>
    @if (store.isOpen()) {
      <div style="border:2px solid #333;padding:12px;background:#fff">
        <p>{{ store.data()?.title }}</p>
        <button (click)="store.confirm()">{{ store.data()?.confirmLabel }}</button>
        <button (click)="store.cancel()">Cancel</button>
      </div>
    }
    @if (store.result()) { <p>Result: {{ store.result() }}</p> }
  `
})
class Ex29 {
  store = new DialogStore();
}

class DialogStore {
  private _isOpen = signal(false);
  private _data = signal<{ title: string; confirmLabel: string } | null>(null);
  private _result = signal('');
  isOpen = this._isOpen.asReadonly();
  data = this._data.asReadonly();
  result = this._result.asReadonly();

  open(data: { title: string; confirmLabel: string }) {
    this._data.set(data);
    this._isOpen.set(true);
    this._result.set('');
  }
  confirm() { this._result.set('confirmed'); this._isOpen.set(false); }
  cancel() { this._result.set('cancelled'); this._isOpen.set(false); }
}

// 30. Accordion state store (openPanels Set signal)
@Component({
  selector: 'ex-30', standalone: true,
  template: `
    @for (panel of panels; track panel.id) {
      <div>
        <button (click)="store.toggle(panel.id)" style="width:100%;text-align:left">
          {{ store.isOpen(panel.id) ? '▾' : '▸' }} {{ panel.title }}
        </button>
        @if (store.isOpen(panel.id)) {
          <p style="padding:8px;background:#f9f9f9">{{ panel.body }}</p>
        }
      </div>
    }
  `
})
class Ex30 {
  store = new AccordionStore();
  panels = [
    { id: 'p1', title: 'What is ComponentStore?', body: 'A lightweight local state manager.' },
    { id: 'p2', title: 'When to use it?', body: 'Complex component state, shared between siblings.' },
    { id: 'p3', title: 'How to inject?', body: 'Provide in component providers and inject via constructor.' }
  ];
}

class AccordionStore {
  private _open = signal(new Set<string>());
  isOpen(id: string) { return this._open().has(id); }
  toggle(id: string) {
    this._open.update(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
}

// 31. Stepper state store (currentStep + totalSteps + data)
@Component({
  selector: 'ex-31', standalone: true,
  template: `
    <p>Step {{ store.step() + 1 }} of {{ store.total() }}: {{ store.stepTitle() }}</p>
    <p>Collected: {{ store.formSummary() }}</p>
    <button (click)="store.prev()" [disabled]="store.step() === 0">Back</button>
    <button (click)="store.next()" [disabled]="store.step() >= store.total() - 1">Next</button>
    @if (store.step() === store.total() - 1) { <button (click)="store.submit()">Submit</button> }
    @if (store.done()) { <p style="color:green">Form submitted!</p> }
  `
})
class Ex31 {
  store = new StepperStore();
}

class StepperStore {
  steps = ['Personal Info', 'Contact', 'Review'];
  private _step = signal(0);
  private _formData = signal<Record<number, string>>({});
  private _done = signal(false);
  total = computed(() => this.steps.length);
  step = this._step.asReadonly();
  done = this._done.asReadonly();
  stepTitle = computed(() => this.steps[this._step()]);
  formSummary = computed(() => JSON.stringify(this._formData()));

  prev() { this._step.update(s => Math.max(0, s - 1)); }
  next() {
    this._formData.update(d => ({ ...d, [this._step()]: `step${this._step() + 1}_data` }));
    this._step.update(s => Math.min(this.steps.length - 1, s + 1));
  }
  submit() { this._done.set(true); }
}

// 32. Data table store (rows + sortField + page + pageSize)
@Component({
  selector: 'ex-32', standalone: true,
  template: `
    <button (click)="store.init()">Load</button>
    <table style="width:100%;border-collapse:collapse">
      <tr>
        <th (click)="store.sort('name')" style="cursor:pointer">Name {{ store.field()==='name' ? store.dir() : '' }}</th>
        <th (click)="store.sort('age')" style="cursor:pointer">Age {{ store.field()==='age' ? store.dir() : '' }}</th>
      </tr>
      @for (row of store.page(); track row.id) {
        <tr><td>{{ row.name }}</td><td>{{ row.age }}</td></tr>
      }
    </table>
    <button (click)="store.prev()">Prev</button>
    Page {{ store.pageNum() + 1 }}
    <button (click)="store.next()">Next</button>
  `
})
class Ex32 {
  store = new DataTableStore();
}

class DataTableStore {
  private _rows = signal<{ id: string; name: string; age: number }[]>([]);
  private _field = signal<'name' | 'age'>('name');
  private _dir = signal<'asc' | 'desc'>('asc');
  private _page = signal(0);
  private _pageSize = 3;
  field = this._field.asReadonly();
  dir = this._dir.asReadonly();
  pageNum = this._page.asReadonly();
  sorted = computed(() => {
    const d = this._dir() === 'asc' ? 1 : -1;
    const f = this._field();
    return [...this._rows()].sort((a, b) =>
      typeof a[f] === 'string' ? (a[f] as string).localeCompare(b[f] as string) * d : ((a[f] as number) - (b[f] as number)) * d
    );
  });
  page = computed(() => this.sorted().slice(this._page() * this._pageSize, (this._page() + 1) * this._pageSize));
  totalPages = computed(() => Math.ceil(this._rows().length / this._pageSize));

  init() { this._rows.set([{ id: '1', name: 'Zara', age: 25 }, { id: '2', name: 'Alice', age: 30 }, { id: '3', name: 'Mike', age: 22 }, { id: '4', name: 'Bob', age: 28 }, { id: '5', name: 'Carol', age: 35 }]); }
  sort(f: 'name' | 'age') {
    if (this._field() === f) this._dir.update(d => d === 'asc' ? 'desc' : 'asc');
    else { this._field.set(f); this._dir.set('asc'); }
  }
  prev() { this._page.update(p => Math.max(0, p - 1)); }
  next() { this._page.update(p => Math.min(this.totalPages() - 1, p + 1)); }
}

// 33. Infinite scroll store (items array + page + hasMore)
@Component({
  selector: 'ex-33', standalone: true,
  template: `
    <ul style="max-height:200px;overflow-y:auto">
      @for (item of store.items(); track item) { <li>{{ item }}</li> }
    </ul>
    @if (store.isLoading()) { <p>Loading more...</p> }
    @if (store.hasMore()) { <button (click)="store.loadMore()">Load More</button> }
    @if (!store.hasMore()) { <p>All items loaded ({{ store.items().length }})</p> }
  `
})
class Ex33 {
  store = new InfiniteScrollStore();
  constructor() { this.store.loadMore(); }
}

class InfiniteScrollStore {
  private _items = signal<string[]>([]);
  private _page = signal(0);
  private _hasMore = signal(true);
  private _isLoading = signal(false);
  items = this._items.asReadonly();
  hasMore = this._hasMore.asReadonly();
  isLoading = this._isLoading.asReadonly();

  loadMore() {
    const page = this._page();
    if (!this._hasMore() || this._isLoading()) return;
    this._isLoading.set(true);
    const newItems = Array.from({ length: 5 }, (_, i) => `Item ${page * 5 + i + 1}`);
    of(newItems).pipe(delay(500)).subscribe(items => {
      this._items.update(prev => [...prev, ...items]);
      this._page.update(p => p + 1);
      if (this._page() >= 3) this._hasMore.set(false);
      this._isLoading.set(false);
    });
  }
}

// 34. Drag-and-drop list store (reorder by index)
@Component({
  selector: 'ex-34', standalone: true,
  template: `
    <ul>
      @for (item of store.items(); track item; let i = $index) {
        <li>
          {{ item }}
          <button (click)="store.moveUp(i)" [disabled]="i === 0">↑</button>
          <button (click)="store.moveDown(i)" [disabled]="i === store.items().length - 1">↓</button>
        </li>
      }
    </ul>
    <small>Simulates drag-to-reorder with move up/down</small>
  `
})
class Ex34 {
  store = new ReorderStore();
}

class ReorderStore {
  private _items = signal(['Angular', 'React', 'Vue', 'Svelte']);
  items = this._items.asReadonly();

  moveUp(i: number) {
    if (i <= 0) return;
    this._items.update(arr => {
      const a = [...arr];
      [a[i - 1], a[i]] = [a[i], a[i - 1]];
      return a;
    });
  }

  moveDown(i: number) {
    this._items.update(arr => {
      if (i >= arr.length - 1) return arr;
      const a = [...arr];
      [a[i], a[i + 1]] = [a[i + 1], a[i]];
      return a;
    });
  }
}

// 35. Multi-select store (selectedIds Set + toggleSelect)
@Component({
  selector: 'ex-35', standalone: true,
  template: `
    <button (click)="store.init()">Init</button>
    <button (click)="store.selectAll()">Select All</button>
    <button (click)="store.clearAll()">Clear All</button>
    @for (item of store.items(); track item.id) {
      <p>
        <label>
          <input type="checkbox" [checked]="store.isSelected(item.id)" (change)="store.toggle(item.id)" />
          {{ item.name }}
        </label>
      </p>
    }
    <p>Selected: {{ store.selectedCount() }} / {{ store.totalCount() }}</p>
  `
})
class Ex35 {
  store = new MultiSelectStore();
}

class MultiSelectStore {
  private _items = signal<{ id: string; name: string }[]>([]);
  private _selected = signal(new Set<string>());
  items = this._items.asReadonly();
  selectedCount = computed(() => this._selected().size);
  totalCount = computed(() => this._items().length);

  init() { this._items.set(['Alpha', 'Beta', 'Gamma', 'Delta'].map((n, i) => ({ id: `i${i}`, name: n }))); }
  isSelected(id: string) { return this._selected().has(id); }
  toggle(id: string) {
    this._selected.update(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  selectAll() { this._selected.set(new Set(this._items().map(i => i.id))); }
  clearAll() { this._selected.set(new Set()); }
}

// 36. Search + results store (query + results + isLoading)
@Component({
  selector: 'ex-36', standalone: true,
  template: `
    <input (input)="store.search($any($event.target).value)" placeholder="Search users..." style="width:100%" />
    @if (store.isLoading()) { <p>Searching...</p> }
    @for (r of store.results(); track r) { <p>{{ r }}</p> }
    @if (!store.isLoading() && store.query() && store.results().length === 0) { <p>No results</p> }
  `
})
class Ex36 {
  store = new SearchResultsStore();
}

class SearchResultsStore {
  private _query = signal('');
  private _results = signal<string[]>([]);
  private _isLoading = signal(false);
  private _search$ = new Subject<string>();
  query = this._query.asReadonly();
  results = this._results.asReadonly();
  isLoading = this._isLoading.asReadonly();

  private db = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Alice Admin'];

  constructor() {
    this._search$.pipe(
      debounceTime(300),
      switchMap(q => {
        if (!q) return of([]);
        this._isLoading.set(true);
        return of(this.db.filter(n => n.toLowerCase().includes(q.toLowerCase()))).pipe(delay(300));
      })
    ).subscribe(results => {
      this._results.set(results);
      this._isLoading.set(false);
    });
  }

  search(q: string) { this._query.set(q); this._search$.next(q); }
}

// 37. Form wizard store (steps + formData + currentStep)
@Component({
  selector: 'ex-37', standalone: true,
  template: `
    <p>Step {{ store.current() + 1 }}/{{ store.steps.length }}: {{ store.steps[store.current()] }}</p>
    <input (input)="store.setField($any($event.target).value)" [value]="store.currentValue()" [placeholder]="'Enter ' + store.steps[store.current()]" />
    <br />
    <button (click)="store.back()" [disabled]="store.current() === 0">Back</button>
    <button (click)="store.forward()">{{ store.current() === store.steps.length - 1 ? 'Submit' : 'Next' }}</button>
    @if (store.submitted()) { <p style="color:green">Submitted: {{ store.summary() }}</p> }
  `
})
class Ex37 {
  store = new WizardStore();
}

class WizardStore {
  steps = ['Name', 'Email', 'Phone'];
  private _current = signal(0);
  private _data = signal<Record<number, string>>({});
  private _submitted = signal(false);
  current = this._current.asReadonly();
  submitted = this._submitted.asReadonly();
  currentValue = computed(() => this._data()[this._current()] ?? '');
  summary = computed(() => this.steps.map((s, i) => `${s}: ${this._data()[i] ?? ''}`).join(' | '));

  setField(v: string) { this._data.update(d => ({ ...d, [this._current()]: v })); }
  back() { this._current.update(c => Math.max(0, c - 1)); }
  forward() {
    if (this._current() < this.steps.length - 1) this._current.update(c => c + 1);
    else this._submitted.set(true);
  }
}

// 38. Full CRUD feature store (list + create + read + update + delete)
@Component({
  selector: 'ex-38', standalone: true,
  template: `
    <button (click)="store.load()">Load</button>
    <input #inp placeholder="New item" />
    <button (click)="store.create(inp.value); inp.value=''">Create</button>
    @if (store.isLoading()) { <p>Loading...</p> }
    @for (item of store.items(); track item.id) {
      <p [style.background]="store.selectedId() === item.id ? '#e3f2fd' : ''" (click)="store.select(item.id)">
        {{ item.name }}
        <button (click)="store.update(item.id, item.name + '!')">Edit</button>
        <button (click)="store.delete(item.id)">Del</button>
      </p>
    }
    @if (store.selected()) { <p>Detail: {{ store.selected()!.name }}</p> }
  `
})
class Ex38 {
  store = new FeatureStore();
}

class FeatureStore {
  private _items = signal<{ id: string; name: string }[]>([]);
  private _selectedId = signal('');
  private _isLoading = signal(false);
  private counter = 1;
  items = this._items.asReadonly();
  selectedId = this._selectedId.asReadonly();
  isLoading = this._isLoading.asReadonly();
  selected = computed(() => this._items().find(i => i.id === this._selectedId()) ?? null);

  load() {
    this._isLoading.set(true);
    of(['Alpha', 'Beta', 'Gamma'].map((n, i) => ({ id: `i${i + 1}`, name: n }))).pipe(delay(500))
      .subscribe(items => { this._items.set(items); this._isLoading.set(false); this.counter = items.length + 1; });
  }
  create(name: string) { if (name) this._items.update(arr => [...arr, { id: `i${this.counter++}`, name }]); }
  select(id: string) { this._selectedId.set(id); }
  update(id: string, name: string) { this._items.update(arr => arr.map(i => i.id === id ? { ...i, name } : i)); }
  delete(id: string) { this._items.update(arr => arr.filter(i => i.id !== id)); if (this._selectedId() === id) this._selectedId.set(''); }
}

// ─── ADVANCED (39–50) ───────────────────────────────────────

// 39. Generic typed store class<State, T>
@Component({
  selector: 'ex-39', standalone: true,
  template: `
    <button (click)="store.add({ id: 'u1', name: 'Alice', email: '' })">Add Alice</button>
    <button (click)="store.add({ id: 'u2', name: 'Bob', email: '' })">Add Bob</button>
    <button (click)="store.remove('u1')">Remove Alice</button>
    <p>Total: {{ store.total() }}</p>
    <ul>@for (u of store.all(); track u.id) { <li>{{ u.name }}</li> }</ul>
    <small>Generic TypedStore&lt;T extends {id:string}&gt;</small>
  `
})
class Ex39 {
  store = new TypedStore<{ id: string; name: string; email: string }>();
}

class TypedStore<T extends { id: string }> {
  private _items = signal<T[]>([]);
  all = computed(() => this._items());
  total = computed(() => this._items().length);

  add(item: T) { this._items.update(arr => arr.some(i => i.id === item.id) ? arr : [...arr, item]); }
  remove(id: string) { this._items.update(arr => arr.filter(i => i.id !== id)); }
  update(id: string, changes: Partial<T>) {
    this._items.update(arr => arr.map(i => i.id === id ? { ...i, ...changes } : i));
  }
  getById(id: string) { return computed(() => this._items().find(i => i.id === id) ?? null); }
}

// 40. OnPush component + store selectSignal pattern
@Component({
  selector: 'ex-40', standalone: true,
  template: `
    <button (click)="store.inc()">Increment</button>
    <button (click)="store.setMsg('hello')">Set Message</button>
    <p>Count: {{ vm().count }}</p>
    <p>Doubled: {{ vm().doubled }}</p>
    <p>Msg: {{ vm().msg }}</p>
    <small>ChangeDetectionStrategy.OnPush + computed vm() only re-renders on signal changes</small>
  `
})
class Ex40 {
  store = new OnPushStore();
  vm = this.store.vm;
}

class OnPushStore {
  private _count = signal(0);
  private _msg = signal('initial');
  vm = computed(() => ({
    count: this._count(),
    doubled: this._count() * 2,
    msg: this._msg()
  }));
  inc() { this._count.update(n => n + 1); }
  setMsg(m: string) { this._msg.set(m); }
}

// 41. State machine store (status: 'idle'|'loading'|'success'|'error')
@Component({
  selector: 'ex-41', standalone: true,
  template: `
    <p>Status: <strong>{{ store.status() }}</strong></p>
    @switch (store.status()) {
      @case ('idle') { <button (click)="store.fetch()">Fetch</button> }
      @case ('loading') { <p>Loading...</p> }
      @case ('success') { <p style="color:green">{{ store.data() }}</p> <button (click)="store.reset()">Reset</button> }
      @case ('error') { <p style="color:red">{{ store.error() }}</p> <button (click)="store.reset()">Retry</button> }
    }
  `
})
class Ex41 {
  store = new StateMachineStore();
}

type LoadStatus = 'idle' | 'loading' | 'success' | 'error';

class StateMachineStore {
  private _status = signal<LoadStatus>('idle');
  private _data = signal('');
  private _error = signal('');
  status = this._status.asReadonly();
  data = this._data.asReadonly();
  error = this._error.asReadonly();

  fetch() {
    if (this._status() !== 'idle') return;
    this._status.set('loading');
    const ok = Math.random() > 0.4;
    of(ok).pipe(delay(700)).subscribe(success => {
      if (success) { this._data.set('Loaded 42 records'); this._status.set('success'); }
      else { this._error.set('Error 503: Service unavailable'); this._status.set('error'); }
    });
  }
  reset() { this._status.set('idle'); this._data.set(''); this._error.set(''); }
}

// 42. WebSocket simulation store (messages array signal)
@Component({
  selector: 'ex-42', standalone: true,
  template: `
    <button (click)="store.connect()">Connect</button>
    <button (click)="store.disconnect()">Disconnect</button>
    <p>{{ store.status() }}</p>
    <ul style="max-height:150px;overflow-y:auto">
      @for (m of store.messages(); track m) { <li>{{ m }}</li> }
    </ul>
  `
})
class Ex42 implements OnDestroy {
  store = new WsStore();
  ngOnDestroy() { this.store.disconnect(); }
}

class WsStore {
  private _messages = signal<string[]>([]);
  private _status = signal('disconnected');
  private stop$ = new Subject<void>();
  messages = this._messages.asReadonly();
  status = this._status.asReadonly();

  connect() {
    this.stop$.next();
    this._status.set('connected');
    this._messages.set([]);
    let n = 0;
    interval(1000).pipe(takeUntil(this.stop$)).subscribe(() => {
      n++;
      const types = ['update', 'heartbeat', 'notification'];
      this._messages.update(msgs => [`[${new Date().toLocaleTimeString()}] ${types[n % 3]} #${n}`, ...msgs].slice(0, 10));
    });
  }

  disconnect() { this.stop$.next(); this._status.set('disconnected'); }
}

// 43. SSE simulation store (events array signal)
@Component({
  selector: 'ex-43', standalone: true,
  template: `
    <button (click)="store.start()">Subscribe to SSE</button>
    <button (click)="store.stop()">Unsubscribe</button>
    <p>{{ store.connected() ? 'Streaming...' : 'Disconnected' }}</p>
    <ul>@for (e of store.events(); track e) { <li>{{ e }}</li> }</ul>
    <small>Simulates Server-Sent Events stream</small>
  `
})
class Ex43 implements OnDestroy {
  store = new SseStore();
  ngOnDestroy() { this.store.stop(); }
}

class SseStore {
  private _events = signal<string[]>([]);
  private _connected = signal(false);
  private stop$ = new Subject<void>();
  events = this._events.asReadonly();
  connected = this._connected.asReadonly();

  start() {
    this.stop$.next();
    this._connected.set(true);
    this._events.set([]);
    let i = 0;
    interval(1500).pipe(takeUntil(this.stop$)).subscribe(() => {
      i++;
      const data = [`data: score=${Math.floor(Math.random() * 100)}`, `data: user_count=${i * 7}`, `data: heartbeat`][i % 3];
      this._events.update(es => [`event:${i} ${data}`, ...es].slice(0, 8));
    });
  }

  stop() { this.stop$.next(); this._connected.set(false); }
}

// 44. Signal + RxJS interop (toObservable from state signal)
@Component({
  selector: 'ex-44', standalone: true,
  template: `
    <input (input)="store.setQuery($any($event.target).value)" placeholder="Type to search..." />
    <p>Query: {{ store.query() }}</p>
    <p>Debounced result: {{ store.result() }}</p>
    <small>toObservable(signal) bridges signals → RxJS pipeline</small>
    <pre>{{ code }}</pre>
  `
})
class Ex44 {
  store = new InteropStore();
  code = `// toObservable converts signal to Observable:
import { toObservable } from '@angular/core/rxjs-interop';

const query$ = toObservable(this.querySignal);
query$.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(q => this.api.search(q))
).subscribe(results => this.results.set(results));`;
}

class InteropStore {
  private _query = signal('');
  private _result = signal('');
  private _input$ = new Subject<string>();
  query = this._query.asReadonly();
  result = this._result.asReadonly();

  constructor() {
    this._input$.pipe(
      debounceTime(400),
      switchMap(q => of(q ? `Results for: "${q}"` : '').pipe(delay(200)))
    ).subscribe(r => this._result.set(r));
  }

  setQuery(q: string) { this._query.set(q); this._input$.next(q); }
}

// 45. Migration to plain signals (before/after comparison)
@Component({
  selector: 'ex-45', standalone: true,
  template: `<pre>{{ code }}</pre>`
})
class Ex45 {
  code = `// BEFORE — NgRx ComponentStore
@Injectable()
export class UserStore extends ComponentStore<UserState> {
  readonly users$ = this.select(s => s.users);
  readonly isLoading$ = this.select(s => s.loading);

  readonly loadUsers = this.effect((trigger$: Observable<void>) =>
    trigger$.pipe(
      tap(() => this.patchState({ loading: true })),
      switchMap(() => this.api.getAll().pipe(
        tapResponse(
          users => this.patchState({ users, loading: false }),
          err => this.patchState({ error: err.message, loading: false })
        )
      ))
    )
  );
}

// AFTER — Plain signals (Angular 17+)
@Injectable()
export class UserStore {
  private _users = signal<User[]>([]);
  private _loading = signal(false);
  private _error = signal('');

  users = this._users.asReadonly();
  isLoading = this._loading.asReadonly();

  loadUsers() {
    this._loading.set(true);
    this.api.getAll().subscribe({
      next: users => { this._users.set(users); this._loading.set(false); },
      error: e => { this._error.set(e.message); this._loading.set(false); }
    });
  }
}`;
}

// 46. Undo/redo store (history stack + currentIndex)
@Component({
  selector: 'ex-46', standalone: true,
  template: `
    <input (input)="store.set($any($event.target).value)" [value]="store.value()" placeholder="Type..." />
    <button (click)="store.undo()" [disabled]="!store.canUndo()">Undo</button>
    <button (click)="store.redo()" [disabled]="!store.canRedo()">Redo</button>
    <p>{{ store.value() }}</p>
    <small>History: {{ store.historyIndex() + 1 }} / {{ store.historyLength() }}</small>
  `
})
class Ex46 {
  store = new UndoRedoStore();
}

class UndoRedoStore {
  private _history = signal<string[]>(['']);
  private _index = signal(0);
  value = computed(() => this._history()[this._index()]);
  historyIndex = this._index.asReadonly();
  historyLength = computed(() => this._history().length);
  canUndo = computed(() => this._index() > 0);
  canRedo = computed(() => this._index() < this._history().length - 1);

  set(v: string) {
    const hist = this._history().slice(0, this._index() + 1);
    this._history.set([...hist, v]);
    this._index.update(i => i + 1);
  }
  undo() { if (this.canUndo()) this._index.update(i => i - 1); }
  redo() { if (this.canRedo()) this._index.update(i => i + 1); }
}

// 47. Optimistic + rollback store (pending + committed state)
@Component({
  selector: 'ex-47', standalone: true,
  template: `
    <button (click)="store.init()">Init</button>
    <button (click)="store.toggleFail()">Fail next: {{ store.willFail() }}</button>
    @for (u of store.users(); track u.id) {
      <p [style.background]="store.isPending(u.id) ? '#fff3cd' : ''"
         [style.opacity]="store.isPending(u.id) ? '0.7' : '1'">
        {{ u.name }} {{ store.isPending(u.id) ? '(pending)' : '✓' }}
        <button (click)="store.optimisticUpdate(u.id)">Update</button>
      </p>
    }
    @if (store.msg()) { <p [style.color]="store.isErr() ? 'red' : 'green'">{{ store.msg() }}</p> }
  `
})
class Ex47 {
  store = new OptRollbackStore();
}

class OptRollbackStore {
  private _committed = signal<{ id: string; name: string }[]>([]);
  private _pending = signal(new Map<string, string>());
  private _willFail = signal(false);
  private _msg = signal('');
  willFail = this._willFail.asReadonly();
  msg = this._msg.asReadonly();
  isErr = computed(() => this._msg().startsWith('Error'));
  isPending(id: string) { return this._pending().has(id); }
  users = computed(() =>
    this._committed().map(u => this._pending().has(u.id) ? { ...u, name: this._pending().get(u.id)! } : u)
  );

  init() { this._committed.set(['Alpha', 'Beta', 'Gamma'].map((n, i) => ({ id: `u${i + 1}`, name: n }))); }
  toggleFail() { this._willFail.update(v => !v); }

  optimisticUpdate(id: string) {
    const original = this._committed().find(u => u.id === id)!;
    const newName = original.name + '*';
    this._pending.update(m => new Map([...m, [id, newName]]));

    of(this._willFail()).pipe(delay(700)).subscribe(fail => {
      if (fail) {
        this._pending.update(m => { const n = new Map(m); n.delete(id); return n; });
        this._msg.set('Error: rolled back to committed state');
      } else {
        this._committed.update(us => us.map(u => u.id === id ? { ...u, name: newName } : u));
        this._pending.update(m => { const n = new Map(m); n.delete(id); return n; });
        this._msg.set('Update committed');
      }
      setTimeout(() => this._msg.set(''), 2000);
    });
  }
}

// 48. Derived computed views (multiple selectors composed)
@Component({
  selector: 'ex-48', standalone: true,
  template: `
    <button (click)="store.init()">Init</button>
    <p>Total: {{ store.total() }}</p>
    <p>Active: {{ store.activeCount() }}</p>
    <p>Avg age: {{ store.avgAge() }}</p>
    <p>Top 3 names: {{ store.top3Names() }}</p>
    <small>Multiple computed selectors composed from base signals</small>
  `
})
class Ex48 {
  store = new DerivedSelectorsStore();
}

class DerivedSelectorsStore {
  private _users = signal<{ id: string; name: string; age: number; active: boolean }[]>([]);
  total = computed(() => this._users().length);
  activeCount = computed(() => this._users().filter(u => u.active).length);
  avgAge = computed(() => {
    const us = this._users();
    return us.length ? (us.reduce((s, u) => s + u.age, 0) / us.length).toFixed(1) : '0';
  });
  top3Names = computed(() =>
    [...this._users()].sort((a, b) => b.age - a.age).slice(0, 3).map(u => u.name).join(', ')
  );

  init() {
    this._users.set([
      { id: '1', name: 'Alice', age: 30, active: true },
      { id: '2', name: 'Bob', age: 25, active: false },
      { id: '3', name: 'Carol', age: 35, active: true },
      { id: '4', name: 'Dave', age: 28, active: true }
    ]);
  }
}

// 49. Store composition (inner store + outer store combined)
@Component({
  selector: 'ex-49', standalone: true,
  template: `
    <button (click)="store.init()">Init</button>
    <p>Filter: <button (click)="store.ui.toggleFilter()">{{ store.ui.filter() }}</button></p>
    <p>Page: {{ store.ui.page() }} <button (click)="store.ui.nextPage()">Next</button></p>
    <p>Items visible: {{ store.visibleItems().length }}</p>
    <ul>@for (i of store.visibleItems(); track i.id) { <li>{{ i.name }} ({{ i.status }})</li> }</ul>
    <small>Composed: DataStore + UIStore → combined view</small>
  `
})
class Ex49 {
  store = new ComposedStore();
}

class UIStateStore {
  private _filter = signal<'all' | 'active'>('all');
  private _page = signal(0);
  filter = this._filter.asReadonly();
  page = this._page.asReadonly();
  toggleFilter() { this._filter.update(f => f === 'all' ? 'active' : 'all'); }
  nextPage() { this._page.update(p => p + 1); }
}

class ComposedStore {
  ui = new UIStateStore();
  private _items = signal<{ id: string; name: string; status: string }[]>([]);

  visibleItems = computed(() => {
    const items = this._items();
    const f = this.ui.filter();
    const filtered = f === 'all' ? items : items.filter(i => i.status === 'active');
    return filtered.slice(0, 3 + this.ui.page() * 2);
  });

  init() {
    this._items.set(
      ['A', 'B', 'C', 'D', 'E', 'F'].map((n, i) => ({ id: `i${i}`, name: `Item ${n}`, status: i % 2 === 0 ? 'active' : 'inactive' }))
    );
  }
}

// 50. Full production store: search + filter + sort + CRUD + undo + redo
@Component({
  selector: 'ex-50', standalone: true,
  template: `
    <div>
      <input (input)="store.setQuery($any($event.target).value)" placeholder="Search..." />
      <select (change)="store.setFilter($any($event.target).value)">
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
      <button (click)="store.setSort('name')">Sort Name</button>
      <button (click)="store.setSort('status')">Sort Status</button>
      <button (click)="store.undo()" [disabled]="!store.canUndo()">Undo</button>
      <button (click)="store.redo()" [disabled]="!store.canRedo()">Redo</button>
    </div>
    <input #inp placeholder="Add item" />
    <button (click)="store.add(inp.value); inp.value=''">Add</button>
    <p>Showing {{ store.visible().length }} of {{ store.total() }}</p>
    @for (item of store.visible(); track item.id) {
      <p>{{ item.name }} [{{ item.status }}]
        <button (click)="store.toggleStatus(item.id)">Toggle</button>
        <button (click)="store.remove(item.id)">Del</button>
      </p>
    }
  `
})
class Ex50 {
  store = new ProductionStore();
  constructor() { this.store.init(); }
}

class ProductionStore {
  private _items = signal<{ id: string; name: string; status: 'active' | 'inactive' }[]>([]);
  private _query = signal('');
  private _filter = signal<'all' | 'active' | 'inactive'>('all');
  private _sortField = signal<'name' | 'status'>('name');
  private _history = signal<typeof this._items['__signal__'][]>([]);
  private _histIndex = signal(-1);
  private counter = 1;

  total = computed(() => this._items().length);
  canUndo = computed(() => this._histIndex() > 0);
  canRedo = computed(() => this._histIndex() < (this._history() as any[]).length - 1);

  visible = computed(() => {
    const q = this._query().toLowerCase();
    const f = this._filter();
    const sf = this._sortField();
    return [...this._items()]
      .filter(i => (!q || i.name.toLowerCase().includes(q)) && (f === 'all' || i.status === f))
      .sort((a, b) => a[sf].localeCompare(b[sf]));
  });

  private pushHistory() {
    const current = this._items();
    const hist = (this._history() as any[]).slice(0, this._histIndex() + 1);
    this._history.set([...hist, current] as any);
    this._histIndex.update(i => i + 1);
  }

  init() {
    const data = ['Alpha', 'Beta', 'Gamma', 'Delta'].map((n, i) => ({ id: `i${i + 1}`, name: n, status: (i % 2 === 0 ? 'active' : 'inactive') as 'active' | 'inactive' }));
    this._items.set(data);
    this.counter = data.length + 1;
    this._history.set([data] as any);
    this._histIndex.set(0);
  }

  add(name: string) {
    if (!name.trim()) return;
    this.pushHistory();
    this._items.update(arr => [...arr, { id: `i${this.counter++}`, name, status: 'active' }]);
  }

  remove(id: string) {
    this.pushHistory();
    this._items.update(arr => arr.filter(i => i.id !== id));
  }

  toggleStatus(id: string) {
    this.pushHistory();
    this._items.update(arr => arr.map(i => i.id === id ? { ...i, status: i.status === 'active' ? 'inactive' : 'active' } : i));
  }

  undo() {
    if (!this.canUndo()) return;
    this._histIndex.update(i => i - 1);
    this._items.set((this._history() as any[])[this._histIndex()]);
  }

  redo() {
    if (!this.canRedo()) return;
    this._histIndex.update(i => i + 1);
    this._items.set((this._history() as any[])[this._histIndex()]);
  }

  setQuery(q: string) { this._query.set(q); }
  setFilter(f: 'all' | 'active' | 'inactive') { this._filter.set(f); }
  setSort(f: 'name' | 'status') { this._sortField.set(f); }
}

// ─── AppComponent ────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    Ex01, Ex02, Ex03, Ex04, Ex05, Ex06, Ex07, Ex08, Ex09, Ex10,
    Ex11, Ex12, Ex13, Ex14, Ex15, Ex16, Ex17, Ex18, Ex19, Ex20,
    Ex21, Ex22, Ex23, Ex24, Ex25, Ex26, Ex27, Ex28, Ex29, Ex30,
    Ex31, Ex32, Ex33, Ex34, Ex35, Ex36, Ex37, Ex38, Ex39, Ex40,
    Ex41, Ex42, Ex43, Ex44, Ex45, Ex46, Ex47, Ex48, Ex49, Ex50
  ],
  template: `
    <div style="font-family:sans-serif;max-width:700px;margin:0 auto;padding:20px">
      <h1>Examples 7.5 — NgRx ComponentStore (50 examples)</h1>

      <h4>1. ComponentStore class — basic signal state class</h4><ex-01 /><hr />
      <h4>2. State interface definition</h4><ex-02 /><hr />
      <h4>3. State signal initialization</h4><ex-03 /><hr />
      <h4>4. select() — computed signal from state</h4><ex-04 /><hr />
      <h4>5. updater() — method that updates state</h4><ex-05 /><hr />
      <h4>6. effect() — method with RxJS side effects</h4><ex-06 /><hr />
      <h4>7. setState() — replace full state object</h4><ex-07 /><hr />
      <h4>8. patchState() — spread partial state update</h4><ex-08 /><hr />
      <h4>9. View model (vm) — combined computed signal</h4><ex-09 /><hr />
      <h4>10. tapResponse — success + error handler</h4><ex-10 /><hr />
      <h4>11. Store provided in component providers</h4><ex-11 /><hr />
      <h4>12. Store as root singleton service</h4><ex-12 /><hr />
      <h4>13. Cleanup with DestroyRef.onDestroy</h4><ex-13 /><hr />

      <h4>14. Loading state (isLoading signal)</h4><ex-14 /><hr />
      <h4>15. Error state (errorMessage signal)</h4><ex-15 /><hr />
      <h4>16. CRUD state (items + add + update + delete)</h4><ex-16 /><hr />
      <h4>17. Selected item tracking (selectedId signal)</h4><ex-17 /><hr />
      <h4>18. Pagination state (page + pageSize + total)</h4><ex-18 /><hr />
      <h4>19. Search filter (query signal + filtered computed)</h4><ex-19 /><hr />
      <h4>20. Sort state (field + direction + sorted computed)</h4><ex-20 /><hr />
      <h4>21. Optimistic update (apply immediately + rollback)</h4><ex-21 /><hr />
      <h4>22. Retry on error (retryCount signal)</h4><ex-22 /><hr />
      <h4>23. HTTP load simulation with delay</h4><ex-23 /><hr />
      <h4>24. Router params sync (activatedRoute signal)</h4><ex-24 /><hr />
      <h4>25. Timer polling (interval refresh)</h4><ex-25 /><hr />
      <h4>26. Form sync (formValue → patchState)</h4><ex-26 /><hr />

      <h4>27. Parent-provided store used by child siblings</h4><ex-27 /><hr />
      <h4>28. Entity-like store (Map&lt;id, item&gt; signal)</h4><ex-28 /><hr />
      <h4>29. Dialog state store</h4><ex-29 /><hr />
      <h4>30. Accordion state store</h4><ex-30 /><hr />
      <h4>31. Stepper state store</h4><ex-31 /><hr />
      <h4>32. Data table store</h4><ex-32 /><hr />
      <h4>33. Infinite scroll store</h4><ex-33 /><hr />
      <h4>34. Drag-and-drop list store</h4><ex-34 /><hr />
      <h4>35. Multi-select store</h4><ex-35 /><hr />
      <h4>36. Search + results store</h4><ex-36 /><hr />
      <h4>37. Form wizard store</h4><ex-37 /><hr />
      <h4>38. Full CRUD feature store</h4><ex-38 /><hr />

      <h4>39. Generic typed store class&lt;T&gt;</h4><ex-39 /><hr />
      <h4>40. OnPush component + store selectSignal pattern</h4><ex-40 /><hr />
      <h4>41. State machine store (idle|loading|success|error)</h4><ex-41 /><hr />
      <h4>42. WebSocket simulation store</h4><ex-42 /><hr />
      <h4>43. SSE simulation store</h4><ex-43 /><hr />
      <h4>44. Signal + RxJS interop (toObservable)</h4><ex-44 /><hr />
      <h4>45. Migration to plain signals (before/after)</h4><ex-45 /><hr />
      <h4>46. Undo/redo store</h4><ex-46 /><hr />
      <h4>47. Optimistic + rollback store</h4><ex-47 /><hr />
      <h4>48. Derived computed views (multiple selectors)</h4><ex-48 /><hr />
      <h4>49. Store composition (inner + outer combined)</h4><ex-49 /><hr />
      <h4>50. Full production store: search + filter + sort + CRUD + undo + redo</h4><ex-50 /><hr />
    </div>
  `
})
export class AppComponent {}
