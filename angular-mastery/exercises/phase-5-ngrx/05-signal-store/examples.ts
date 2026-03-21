import { Component, signal, computed } from '@angular/core';

// ============================================================
// Examples 5.5 — NgRx Signal Store (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ───────────────────────────────────────────

// 1. signalStore concept — what it replaces and why
@Component({
  selector: 'ex-01',
  standalone: true,
  template: `
    <div style="background:#e8f4f8;padding:12px;border-radius:6px">
      <strong>signalStore concept</strong>
      <p style="margin:4px 0">NgRx Signal Store replaces ComponentStore with fine-grained reactivity.</p>
      <ul style="margin:4px 0">
        <li>withState — defines reactive state slices</li>
        <li>withComputed — memoized derived signals</li>
        <li>withMethods — state mutation methods</li>
        <li>withHooks — lifecycle callbacks</li>
      </ul>
    </div>
  `,
})
class Ex01 {}

// 2. withState — defining initial state shape
@Component({
  selector: 'ex-02',
  standalone: true,
  template: `
    <div style="background:#f0f4e8;padding:12px;border-radius:6px">
      <strong>withState — initial state</strong>
      <p>State slice: <code>{{ stateJson() }}</code></p>
      <p>count: <strong>{{ count() }}</strong> | name: <strong>{{ name() }}</strong></p>
    </div>
  `,
})
class Ex02 {
  // Simulating withState
  count = signal(0);
  name = signal('Alice');
  stateJson = computed(() => JSON.stringify({ count: this.count(), name: this.name() }));
}

// 3. withComputed — derived memoized signals
@Component({
  selector: 'ex-03',
  standalone: true,
  template: `
    <div style="background:#f8f0e8;padding:12px;border-radius:6px">
      <strong>withComputed — memoized derived state</strong>
      <p>price: {{ price() }} | qty: {{ qty() }}</p>
      <p>total (computed): <strong>{{ total() }}</strong></p>
      <p>formatted (computed): <strong>{{ formatted() }}</strong></p>
      <button (click)="inc()">+ Qty</button>
    </div>
  `,
})
class Ex03 {
  price = signal(9.99);
  qty = signal(3);
  total = computed(() => +(this.price() * this.qty()).toFixed(2));
  formatted = computed(() => `$${this.total().toFixed(2)}`);
  inc() { this.qty.update(q => q + 1); }
}

// 4. withMethods — state mutation methods
@Component({
  selector: 'ex-04',
  standalone: true,
  template: `
    <div style="background:#e8e8f8;padding:12px;border-radius:6px">
      <strong>withMethods — state mutations</strong>
      <p>count: <strong>{{ count() }}</strong></p>
      <button (click)="increment()">increment()</button>
      <button (click)="decrement()" style="margin-left:8px">decrement()</button>
      <button (click)="reset()" style="margin-left:8px">reset()</button>
    </div>
  `,
})
class Ex04 {
  count = signal(0);
  increment() { this.count.update(c => c + 1); }
  decrement() { this.count.update(c => c - 1); }
  reset() { this.count.set(0); }
}

// 5. Read-only slices — exposing state as read-only
@Component({
  selector: 'ex-05',
  standalone: true,
  template: `
    <div style="background:#f8e8f0;padding:12px;border-radius:6px">
      <strong>Read-only slices</strong>
      <p>Store exposes signals but hides the writer:</p>
      <p>user: <strong>{{ user() }}</strong> | role: <strong>{{ role() }}</strong></p>
      <button (click)="promote()">promote()</button>
    </div>
  `,
})
class Ex05 {
  private _user = signal('Bob');
  private _role = signal('viewer');
  // public read-only
  user = this._user.asReadonly();
  role = this._role.asReadonly();
  promote() { this._role.set('admin'); }
}

// 6. Updaters — patchState pattern
@Component({
  selector: 'ex-06',
  standalone: true,
  template: `
    <div style="background:#e8f8e8;padding:12px;border-radius:6px">
      <strong>Updaters — patchState pattern</strong>
      <p>{{ firstName() }} {{ lastName() }}</p>
      <button (click)="patchFirst('Jane')">Set Jane</button>
      <button (click)="patchLast('Smith')" style="margin-left:8px">Set Smith</button>
    </div>
  `,
})
class Ex06 {
  firstName = signal('John');
  lastName = signal('Doe');
  patchFirst(v: string) { this.firstName.set(v); }
  patchLast(v: string) { this.lastName.set(v); }
}

// 7. Derived state — chained computed signals
@Component({
  selector: 'ex-07',
  standalone: true,
  template: `
    <div style="background:#f8f8e8;padding:12px;border-radius:6px">
      <strong>Derived state — chained computed</strong>
      <p>items: {{ items() | json }}</p>
      <p>count: {{ itemCount() }} | total: {{ total() }}</p>
      <button (click)="add()">Add Item</button>
    </div>
  `,
})
class Ex07 {
  items = signal([{ name: 'A', price: 10 }, { name: 'B', price: 20 }]);
  itemCount = computed(() => this.items().length);
  total = computed(() => this.items().reduce((s, i) => s + i.price, 0));
  add() { this.items.update(arr => [...arr, { name: `Item${arr.length + 1}`, price: 15 }]); }
}

// 8. Store injection — providing store via constructor
@Component({
  selector: 'ex-08',
  standalone: true,
  template: `
    <div style="background:#e8f4f8;padding:12px;border-radius:6px">
      <strong>Store injection pattern</strong>
      <p>In real NgRx: <code>private store = inject(MyStore)</code></p>
      <p>Injected count: <strong>{{ store.count() }}</strong></p>
      <button (click)="store.inc()">inc</button>
    </div>
  `,
})
class Ex08 {
  // Simulating inject(CounterStore) inline
  store = {
    count: signal(0),
    inc() { this.count.update(c => c + 1); },
  };
}

// 9. Simple counter store
@Component({
  selector: 'ex-09',
  standalone: true,
  template: `
    <div style="background:#f0e8f8;padding:12px;border-radius:6px">
      <strong>Counter Store</strong>
      <p style="font-size:2rem;text-align:center">{{ count() }}</p>
      <div style="text-align:center">
        <button (click)="dec()">−</button>
        <button (click)="reset()" style="margin:0 8px">0</button>
        <button (click)="inc()">+</button>
      </div>
    </div>
  `,
})
class Ex09 {
  count = signal(0);
  inc() { this.count.update(c => c + 1); }
  dec() { this.count.update(c => c - 1); }
  reset() { this.count.set(0); }
}

// 10. Todo signal store
@Component({
  selector: 'ex-10',
  standalone: true,
  template: `
    <div style="background:#f8f0e8;padding:12px;border-radius:6px">
      <strong>Todo Signal Store</strong>
      <ul style="margin:4px 0">
        @for (t of todos(); track t.id) {
          <li [style.text-decoration]="t.done ? 'line-through' : 'none'" (click)="toggle(t.id)" style="cursor:pointer">
            {{ t.title }}
          </li>
        }
      </ul>
      <p>Done: {{ doneCount() }} / {{ todos().length }}</p>
    </div>
  `,
})
class Ex10 {
  todos = signal([
    { id: 1, title: 'Learn NgRx', done: false },
    { id: 2, title: 'Build store', done: false },
    { id: 3, title: 'Ship it', done: false },
  ]);
  doneCount = computed(() => this.todos().filter(t => t.done).length);
  toggle(id: number) {
    this.todos.update(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }
}

// 11. User profile store
@Component({
  selector: 'ex-11',
  standalone: true,
  template: `
    <div style="background:#e8f8f0;padding:12px;border-radius:6px">
      <strong>User Profile Store</strong>
      <p>Name: {{ profile().name }} | Age: {{ profile().age }}</p>
      <p>Display: <em>{{ displayName() }}</em></p>
      <button (click)="birthday()">🎂 Birthday</button>
    </div>
  `,
})
class Ex11 {
  profile = signal({ name: 'Alice', age: 28, role: 'dev' });
  displayName = computed(() => `${this.profile().name} (${this.profile().role})`);
  birthday() { this.profile.update(p => ({ ...p, age: p.age + 1 })); }
}

// 12. Shopping cart store
@Component({
  selector: 'ex-12',
  standalone: true,
  template: `
    <div style="background:#fff8e8;padding:12px;border-radius:6px">
      <strong>Shopping Cart Store</strong>
      @for (item of cart(); track item.id) {
        <div style="display:flex;justify-content:space-between">
          <span>{{ item.name }}</span>
          <span>{{ item.qty }} × ${{ item.price }}</span>
        </div>
      }
      <hr style="margin:6px 0"/>
      <strong>Total: ${{ cartTotal() }}</strong>
      <br/><button (click)="addItem()" style="margin-top:6px">Add Widget</button>
    </div>
  `,
})
class Ex12 {
  cart = signal([
    { id: 1, name: 'Widget', qty: 2, price: 9.99 },
    { id: 2, name: 'Gadget', qty: 1, price: 24.99 },
  ]);
  cartTotal = computed(() =>
    +this.cart().reduce((s, i) => s + i.qty * i.price, 0).toFixed(2)
  );
  addItem() {
    this.cart.update(c => [...c, { id: Date.now(), name: 'Widget', qty: 1, price: 9.99 }]);
  }
}

// 13. Loading/error state
@Component({
  selector: 'ex-13',
  standalone: true,
  template: `
    <div style="background:#f8e8e8;padding:12px;border-radius:6px">
      <strong>Loading / Error State</strong>
      @if (loading()) {
        <p style="color:#888">⏳ Loading...</p>
      } @else if (error()) {
        <p style="color:red">Error: {{ error() }}</p>
      } @else {
        <p style="color:green">Data: {{ data() }}</p>
      }
      <button (click)="fetch()">Fetch</button>
      <button (click)="fail()" style="margin-left:8px">Fail</button>
      <button (click)="reset()" style="margin-left:8px">Reset</button>
    </div>
  `,
})
class Ex13 {
  loading = signal(false);
  error = signal<string | null>(null);
  data = signal<string | null>(null);
  fetch() {
    this.loading.set(true); this.error.set(null);
    setTimeout(() => { this.loading.set(false); this.data.set('{"users":[1,2,3]}'); }, 800);
  }
  fail() {
    this.loading.set(true); this.error.set(null);
    setTimeout(() => { this.loading.set(false); this.error.set('Network timeout'); }, 800);
  }
  reset() { this.loading.set(false); this.error.set(null); this.data.set(null); }
}

// ─── INTERMEDIATE (14–26) ───────────────────────────────────

// 14. Optimistic updates
@Component({
  selector: 'ex-14',
  standalone: true,
  template: `
    <div style="background:#e8f4f8;padding:12px;border-radius:6px">
      <strong>Optimistic Updates</strong>
      <p>Likes: <strong>{{ likes() }}</strong> {{ pending() ? '(saving...)' : '' }}</p>
      <button (click)="like()">👍 Like</button>
    </div>
  `,
})
class Ex14 {
  likes = signal(42);
  pending = signal(false);
  like() {
    this.likes.update(l => l + 1); // optimistic
    this.pending.set(true);
    setTimeout(() => this.pending.set(false), 600); // simulate save
  }
}

// 15. Undo/redo
@Component({
  selector: 'ex-15',
  standalone: true,
  template: `
    <div style="background:#f0f4e8;padding:12px;border-radius:6px">
      <strong>Undo / Redo</strong>
      <p>Value: <strong>{{ current() }}</strong></p>
      <input #inp placeholder="new value" style="width:120px"/>
      <button (click)="set(inp.value); inp.value=''">Set</button>
      <button (click)="undo()" [disabled]="!canUndo()" style="margin-left:8px">Undo</button>
      <button (click)="redo()" [disabled]="!canRedo()" style="margin-left:4px">Redo</button>
    </div>
  `,
})
class Ex15 {
  private history = signal<string[]>(['initial']);
  private pointer = signal(0);
  current = computed(() => this.history()[this.pointer()]);
  canUndo = computed(() => this.pointer() > 0);
  canRedo = computed(() => this.pointer() < this.history().length - 1);
  set(v: string) {
    if (!v) return;
    const h = this.history().slice(0, this.pointer() + 1);
    this.history.set([...h, v]);
    this.pointer.update(p => p + 1);
  }
  undo() { if (this.canUndo()) this.pointer.update(p => p - 1); }
  redo() { if (this.canRedo()) this.pointer.update(p => p + 1); }
}

// 16. Pagination state
@Component({
  selector: 'ex-16',
  standalone: true,
  template: `
    <div style="background:#f8f0e8;padding:12px;border-radius:6px">
      <strong>Pagination State</strong>
      <p>Page {{ page() }} of {{ totalPages() }} ({{ total() }} items)</p>
      @for (item of pageItems(); track item) {
        <span style="display:inline-block;margin:2px;padding:2px 6px;background:#ddd;border-radius:3px">{{ item }}</span>
      }
      <br/>
      <button (click)="prev()" [disabled]="page() === 1">Prev</button>
      <button (click)="next()" [disabled]="page() === totalPages()" style="margin-left:8px">Next</button>
    </div>
  `,
})
class Ex16 {
  allItems = signal(Array.from({ length: 23 }, (_, i) => `Item ${i + 1}`));
  pageSize = signal(5);
  page = signal(1);
  total = computed(() => this.allItems().length);
  totalPages = computed(() => Math.ceil(this.total() / this.pageSize()));
  pageItems = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.allItems().slice(start, start + this.pageSize());
  });
  prev() { this.page.update(p => Math.max(1, p - 1)); }
  next() { this.page.update(p => Math.min(this.totalPages(), p + 1)); }
}

// 17. Search + filter state
@Component({
  selector: 'ex-17',
  standalone: true,
  template: `
    <div style="background:#e8e8f8;padding:12px;border-radius:6px">
      <strong>Search + Filter State</strong>
      <input [value]="query()" (input)="query.set($any($event.target).value)" placeholder="Search..." style="width:150px"/>
      <select (change)="category.set($any($event.target).value)" style="margin-left:8px">
        <option value="">All</option>
        <option value="fruit">Fruit</option>
        <option value="veggie">Veggie</option>
      </select>
      <p>Results: {{ filtered().length }}</p>
      <ul style="margin:0">
        @for (i of filtered(); track i.name) { <li>{{ i.name }} ({{ i.cat }})</li> }
      </ul>
    </div>
  `,
})
class Ex17 {
  all = signal([
    { name: 'Apple', cat: 'fruit' }, { name: 'Banana', cat: 'fruit' },
    { name: 'Carrot', cat: 'veggie' }, { name: 'Avocado', cat: 'fruit' },
    { name: 'Broccoli', cat: 'veggie' }, { name: 'Apricot', cat: 'fruit' },
  ]);
  query = signal('');
  category = signal('');
  filtered = computed(() =>
    this.all().filter(i =>
      i.name.toLowerCase().includes(this.query().toLowerCase()) &&
      (this.category() === '' || i.cat === this.category())
    )
  );
}

// 18. Authenticated user store
@Component({
  selector: 'ex-18',
  standalone: true,
  template: `
    <div style="background:#f8e8f0;padding:12px;border-radius:6px">
      <strong>Auth User Store</strong>
      @if (isLoggedIn()) {
        <p>Welcome, <strong>{{ user()!.name }}</strong> [{{ user()!.role }}]</p>
        <button (click)="logout()">Logout</button>
      } @else {
        <p>Not logged in</p>
        <button (click)="login()">Login as Admin</button>
      }
    </div>
  `,
})
class Ex18 {
  user = signal<{ name: string; role: string } | null>(null);
  isLoggedIn = computed(() => this.user() !== null);
  login() { this.user.set({ name: 'Alice', role: 'admin' }); }
  logout() { this.user.set(null); }
}

// 19. Theme store
@Component({
  selector: 'ex-19',
  standalone: true,
  template: `
    <div [style.background]="bg()" [style.color]="fg()" style="padding:12px;border-radius:6px;transition:all 0.3s">
      <strong>Theme Store</strong>
      <p>Current theme: {{ theme() }}</p>
      <button (click)="toggle()" [style.background]="fg()" [style.color]="bg()" style="padding:4px 12px;border-radius:4px;border:none;cursor:pointer">Toggle Theme</button>
    </div>
  `,
})
class Ex19 {
  theme = signal<'light' | 'dark'>('light');
  bg = computed(() => this.theme() === 'light' ? '#ffffff' : '#1a1a2e');
  fg = computed(() => this.theme() === 'light' ? '#1a1a2e' : '#ffffff');
  toggle() { this.theme.update(t => t === 'light' ? 'dark' : 'light'); }
}

// 20. Notification store
@Component({
  selector: 'ex-20',
  standalone: true,
  template: `
    <div style="background:#f8f8e8;padding:12px;border-radius:6px">
      <strong>Notification Store</strong>
      <button (click)="add('info')">Info</button>
      <button (click)="add('success')" style="margin-left:6px">Success</button>
      <button (click)="add('error')" style="margin-left:6px">Error</button>
      @for (n of notifications(); track n.id) {
        <div [style.background]="colors[n.type]" style="padding:4px 8px;margin:4px 0;border-radius:4px;display:flex;justify-content:space-between">
          {{ n.msg }}
          <span (click)="dismiss(n.id)" style="cursor:pointer">✕</span>
        </div>
      }
    </div>
  `,
})
class Ex20 {
  colors: Record<string, string> = { info: '#bee3f8', success: '#c6f6d5', error: '#fed7d7' };
  notifications = signal<{ id: number; type: string; msg: string }[]>([]);
  add(type: string) {
    const id = Date.now();
    this.notifications.update(ns => [...ns, { id, type, msg: `${type.toUpperCase()} message` }]);
    setTimeout(() => this.dismiss(id), 3000);
  }
  dismiss(id: number) { this.notifications.update(ns => ns.filter(n => n.id !== id)); }
}

// 21. Debounced search simulation
@Component({
  selector: 'ex-21',
  standalone: true,
  template: `
    <div style="background:#e8f4f8;padding:12px;border-radius:6px">
      <strong>Debounced Search</strong>
      <input (input)="onInput($any($event.target).value)" placeholder="Type to search..." style="width:180px"/>
      <p>Searching: {{ searching() ? '⏳' : '' }} Query: "{{ committed() }}"</p>
      <p>Results: {{ results() }}</p>
    </div>
  `,
})
class Ex21 {
  committed = signal('');
  searching = signal(false);
  results = signal(0);
  private timer: any;
  onInput(v: string) {
    this.searching.set(true);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.committed.set(v);
      this.results.set(Math.floor(Math.random() * 20));
      this.searching.set(false);
    }, 400);
  }
}

// 22. Multi-entity store
@Component({
  selector: 'ex-22',
  standalone: true,
  template: `
    <div style="background:#f0f4e8;padding:12px;border-radius:6px">
      <strong>Multi-entity Store</strong>
      <p>Users: {{ users().length }} | Posts: {{ posts().length }} | Comments: {{ comments().length }}</p>
      <p>User posts: {{ userPostCount() }} | Avg comments/post: {{ avgComments() }}</p>
      <button (click)="addPost()">Add Post</button>
    </div>
  `,
})
class Ex22 {
  users = signal([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]);
  posts = signal([{ id: 1, userId: 1, title: 'Post A' }, { id: 2, userId: 1, title: 'Post B' }]);
  comments = signal([{ id: 1, postId: 1 }, { id: 2, postId: 1 }, { id: 3, postId: 2 }]);
  userPostCount = computed(() => this.posts().filter(p => p.userId === 1).length);
  avgComments = computed(() =>
    this.posts().length ? +(this.comments().length / this.posts().length).toFixed(1) : 0
  );
  addPost() {
    this.posts.update(ps => [...ps, { id: Date.now(), userId: 2, title: 'New Post' }]);
  }
}

// 23. Feature stores composition
@Component({
  selector: 'ex-23',
  standalone: true,
  template: `
    <div style="background:#f8f0e8;padding:12px;border-radius:6px">
      <strong>Feature Store Composition</strong>
      <p>Auth: {{ authStore.userName() }} | Cart: {{ cartStore.itemCount() }} items</p>
      <p>UI: {{ uiStore.sidebarOpen() ? 'Sidebar open' : 'Sidebar closed' }}</p>
      <button (click)="uiStore.toggleSidebar()">Toggle Sidebar</button>
      <button (click)="cartStore.addItem()" style="margin-left:8px">Add to cart</button>
    </div>
  `,
})
class Ex23 {
  authStore = { userName: signal('Alice') };
  cartStore = {
    items: signal<string[]>([]),
    itemCount: computed(() => this.cartStore.items().length),
    addItem: () => this.cartStore.items.update(i => [...i, 'item']),
  };
  uiStore = {
    sidebarOpen: signal(false),
    toggleSidebar: () => this.uiStore.sidebarOpen.update(v => !v),
  };
}

// 24. Store with RxJS interop simulation
@Component({
  selector: 'ex-24',
  standalone: true,
  template: `
    <div style="background:#e8e8f8;padding:12px;border-radius:6px">
      <strong>Store + RxJS Interop</strong>
      <p>In NgRx: <code>toSignal(observable$)</code> and <code>toObservable(signal)</code></p>
      <p>Live tick: <strong>{{ tick() }}</strong></p>
      <p>Doubled (computed from signal): <strong>{{ doubled() }}</strong></p>
    </div>
  `,
})
class Ex24 {
  tick = signal(0);
  doubled = computed(() => this.tick() * 2);
  constructor() {
    setInterval(() => this.tick.update(t => t + 1), 1000);
  }
}

// 25. Derived collections
@Component({
  selector: 'ex-25',
  standalone: true,
  template: `
    <div style="background:#f8e8f0;padding:12px;border-radius:6px">
      <strong>Derived Collections</strong>
      <p>Active users: {{ activeUsers().length }} | Admins: {{ admins().length }}</p>
      <ul style="margin:4px 0">
        @for (u of admins(); track u.id) { <li>{{ u.name }} ★</li> }
      </ul>
      <button (click)="toggleAdmin(1)">Toggle Admin #1</button>
    </div>
  `,
})
class Ex25 {
  users = signal([
    { id: 1, name: 'Alice', active: true, admin: true },
    { id: 2, name: 'Bob', active: true, admin: false },
    { id: 3, name: 'Carol', active: false, admin: false },
  ]);
  activeUsers = computed(() => this.users().filter(u => u.active));
  admins = computed(() => this.users().filter(u => u.admin));
  toggleAdmin(id: number) {
    this.users.update(us => us.map(u => u.id === id ? { ...u, admin: !u.admin } : u));
  }
}

// 26. Store reset
@Component({
  selector: 'ex-26',
  standalone: true,
  template: `
    <div style="background:#e8f8f0;padding:12px;border-radius:6px">
      <strong>Store Reset</strong>
      <p>count: {{ count() }} | name: {{ name() }} | items: {{ items().length }}</p>
      <button (click)="mutate()">Mutate</button>
      <button (click)="resetAll()" style="margin-left:8px">Reset All</button>
    </div>
  `,
})
class Ex26 {
  readonly initial = { count: 0, name: 'Default', items: [] as string[] };
  count = signal(this.initial.count);
  name = signal(this.initial.name);
  items = signal<string[]>([...this.initial.items]);
  mutate() {
    this.count.update(c => c + 5);
    this.name.set('Modified');
    this.items.update(i => [...i, 'new']);
  }
  resetAll() {
    this.count.set(this.initial.count);
    this.name.set(this.initial.name);
    this.items.set([]);
  }
}

// ─── NESTED (27–38) ─────────────────────────────────────────

// 27. Store in service pattern
@Component({
  selector: 'ex-27',
  standalone: true,
  template: `
    <div style="background:#e8f4f8;padding:12px;border-radius:6px">
      <strong>Store-as-Service Pattern</strong>
      <p>In NgRx: <code>@Injectable() export class CounterStore extends signalStore(...)</code></p>
      <p>count: {{ svc.count() }} | doubled: {{ svc.doubled() }}</p>
      <button (click)="svc.inc()">inc</button>
    </div>
  `,
})
class Ex27 {
  // Inline service simulation
  svc = (() => {
    const count = signal(0);
    const doubled = computed(() => count() * 2);
    return { count, doubled, inc: () => count.update(c => c + 1) };
  })();
}

// 28. Combined stores — root aggregator
@Component({
  selector: 'ex-28',
  standalone: true,
  template: `
    <div style="background:#f0f4e8;padding:12px;border-radius:6px">
      <strong>Combined Stores</strong>
      <p>App state summary:</p>
      <ul style="margin:4px 0">
        <li>User: {{ rootState().user }}</li>
        <li>Cart items: {{ rootState().cartItems }}</li>
        <li>Notifications: {{ rootState().notifications }}</li>
      </ul>
    </div>
  `,
})
class Ex28 {
  userStore = { name: signal('Alice') };
  cartStore = { count: signal(3) };
  notifStore = { count: signal(2) };
  rootState = computed(() => ({
    user: this.userStore.name(),
    cartItems: this.cartStore.count(),
    notifications: this.notifStore.count(),
  }));
}

// 29. Store with effects simulation
@Component({
  selector: 'ex-29',
  standalone: true,
  template: `
    <div style="background:#f8f0e8;padding:12px;border-radius:6px">
      <strong>Store with Effects Simulation</strong>
      <p>userId: {{ userId() }} | status: {{ status() }}</p>
      @if (userData()) { <p>User: {{ userData()!.name }}</p> }
      <button (click)="loadUser(1)">Load User 1</button>
      <button (click)="loadUser(2)" style="margin-left:8px">Load User 2</button>
    </div>
  `,
})
class Ex29 {
  userId = signal<number | null>(null);
  status = signal<'idle' | 'loading' | 'done'>('idle');
  userData = signal<{ name: string } | null>(null);
  loadUser(id: number) {
    this.userId.set(id); this.status.set('loading'); this.userData.set(null);
    setTimeout(() => {
      this.userData.set({ name: id === 1 ? 'Alice' : 'Bob' });
      this.status.set('done');
    }, 600);
  }
}

// 30. Store with router state simulation
@Component({
  selector: 'ex-30',
  standalone: true,
  template: `
    <div style="background:#e8e8f8;padding:12px;border-radius:6px">
      <strong>Store with Router State</strong>
      <p>Route: <strong>{{ route() }}</strong> | Params: {{ params() | json }}</p>
      <button (click)="navigate('/users', {id: 1})">Users/1</button>
      <button (click)="navigate('/products', {cat: 'books'})" style="margin-left:8px">Products</button>
    </div>
  `,
})
class Ex30 {
  route = signal('/home');
  params = signal<Record<string, any>>({});
  navigate(path: string, p: Record<string, any>) {
    this.route.set(path);
    this.params.set(p);
  }
}

// 31. Store with form sync
@Component({
  selector: 'ex-31',
  standalone: true,
  template: `
    <div style="background:#f8e8f0;padding:12px;border-radius:6px">
      <strong>Store with Form Sync</strong>
      <input [value]="formState().name" (input)="patch('name', $any($event.target).value)" placeholder="Name" style="display:block;margin:4px 0;width:180px"/>
      <input [value]="formState().email" (input)="patch('email', $any($event.target).value)" placeholder="Email" style="display:block;margin:4px 0;width:180px"/>
      <p>Store: {{ formState() | json }}</p>
      <p>Valid: {{ isValid() ? '✓' : '✗' }}</p>
    </div>
  `,
})
class Ex31 {
  formState = signal({ name: '', email: '' });
  isValid = computed(() => this.formState().name.length > 0 && this.formState().email.includes('@'));
  patch(field: string, value: string) {
    this.formState.update(s => ({ ...s, [field]: value }));
  }
}

// 32. Store with localStorage sync
@Component({
  selector: 'ex-32',
  standalone: true,
  template: `
    <div style="background:#fff8e8;padding:12px;border-radius:6px">
      <strong>Store + localStorage Sync</strong>
      <p>Saved value: <strong>{{ saved() }}</strong></p>
      <input #inp [value]="saved()" placeholder="Type and save" style="width:150px"/>
      <button (click)="save(inp.value)" style="margin-left:8px">Save</button>
      <button (click)="clear()" style="margin-left:4px">Clear</button>
    </div>
  `,
})
class Ex32 {
  saved = signal(localStorage.getItem('ex32_val') ?? '');
  save(v: string) {
    this.saved.set(v);
    localStorage.setItem('ex32_val', v);
  }
  clear() {
    this.saved.set('');
    localStorage.removeItem('ex32_val');
  }
}

// 33. Store with WebSocket simulation
@Component({
  selector: 'ex-33',
  standalone: true,
  template: `
    <div style="background:#e8f8e8;padding:12px;border-radius:6px">
      <strong>Store with WebSocket Simulation</strong>
      <p>Status: <span [style.color]="connected() ? 'green' : 'red'">{{ connected() ? 'Connected' : 'Disconnected' }}</span></p>
      <p>Messages: {{ messages().length }}</p>
      @for (m of messages().slice(-3); track m) { <div style="font-size:0.85rem">{{ m }}</div> }
      <button (click)="connect()">Connect</button>
      <button (click)="disconnect()" style="margin-left:8px">Disconnect</button>
    </div>
  `,
})
class Ex33 {
  connected = signal(false);
  messages = signal<string[]>([]);
  private interval: any;
  connect() {
    this.connected.set(true);
    this.interval = setInterval(() => {
      this.messages.update(ms => [...ms, `msg at ${new Date().toLocaleTimeString()}`]);
    }, 1000);
  }
  disconnect() {
    this.connected.set(false);
    clearInterval(this.interval);
  }
}

// 34. Nested state normalization
@Component({
  selector: 'ex-34',
  standalone: true,
  template: `
    <div style="background:#f8e8e8;padding:12px;border-radius:6px">
      <strong>Nested State Normalization</strong>
      <p>Normalized vs nested — normalized state is faster to update:</p>
      @for (id of postIds(); track id) {
        <div style="margin:2px 0">
          Post: {{ postsById()[id].title }} — by {{ usersById()[postsById()[id].authorId]?.name }}
        </div>
      }
    </div>
  `,
})
class Ex34 {
  usersById = signal<Record<number, { name: string }>>({ 1: { name: 'Alice' }, 2: { name: 'Bob' } });
  postsById = signal<Record<number, { title: string; authorId: number }>>({
    10: { title: 'Signals 101', authorId: 1 },
    11: { title: 'NgRx Guide', authorId: 2 },
  });
  postIds = computed(() => Object.keys(this.postsById()).map(Number));
}

// 35. Cross-store communication
@Component({
  selector: 'ex-35',
  standalone: true,
  template: `
    <div style="background:#e8f4f8;padding:12px;border-radius:6px">
      <strong>Cross-store Communication</strong>
      <p>When auth changes, cart clears:</p>
      <p>User: {{ user() ?? 'Guest' }} | Cart: {{ cart().length }} items</p>
      <button (click)="login()">Login</button>
      <button (click)="logout()" style="margin-left:8px">Logout (clears cart)</button>
      <button (click)="addToCart()" style="margin-left:8px">Add to cart</button>
    </div>
  `,
})
class Ex35 {
  user = signal<string | null>(null);
  cart = signal<string[]>([]);
  login() { this.user.set('Alice'); }
  logout() { this.user.set(null); this.cart.set([]); } // cross-store side effect
  addToCart() { if (this.user()) this.cart.update(c => [...c, 'item']); }
}

// 36. Store with history tracking
@Component({
  selector: 'ex-36',
  standalone: true,
  template: `
    <div style="background:#f0f4e8;padding:12px;border-radius:6px">
      <strong>Store with History</strong>
      <p>Current: <strong>{{ current() }}</strong></p>
      <p style="font-size:0.8rem">History: {{ history().join(' → ') }}</p>
      <button (click)="transition('B')">→B</button>
      <button (click)="transition('C')" style="margin-left:4px">→C</button>
      <button (click)="transition('A')" style="margin-left:4px">→A</button>
    </div>
  `,
})
class Ex36 {
  history = signal<string[]>(['A']);
  current = computed(() => this.history()[this.history().length - 1]);
  transition(state: string) {
    this.history.update(h => [...h.slice(-4), state]);
  }
}

// 37. Store selector memoization
@Component({
  selector: 'ex-37',
  standalone: true,
  template: `
    <div style="background:#f8f0e8;padding:12px;border-radius:6px">
      <strong>Selector Memoization</strong>
      <p>Computed only recalculates when dependencies change:</p>
      <p>Items: {{ items().length }} | Expensive compute runs: {{ computeCount }}</p>
      <p>Filtered (active): {{ activeItems().length }}</p>
      <button (click)="addInactive()">Add inactive (no recompute of active)</button>
    </div>
  `,
})
class Ex37 {
  computeCount = 0;
  items = signal([{ id: 1, active: true }, { id: 2, active: false }]);
  activeItems = computed(() => {
    this.computeCount++;
    return this.items().filter(i => i.active);
  });
  addInactive() { this.items.update(i => [...i, { id: Date.now(), active: false }]); }
}

// 38. Reactive store patterns — effect-like
@Component({
  selector: 'ex-38',
  standalone: true,
  template: `
    <div style="background:#e8e8f8;padding:12px;border-radius:6px">
      <strong>Reactive Store Patterns</strong>
      <p>Auto-save simulation: count changes trigger persistence</p>
      <p>count: {{ count() }} | saves: {{ saveCount() }} | lastSaved: {{ lastSaved() }}</p>
      <button (click)="inc()">inc</button>
    </div>
  `,
})
class Ex38 {
  count = signal(0);
  saveCount = signal(0);
  lastSaved = signal<string>('never');
  inc() {
    this.count.update(c => c + 1);
    // simulate effect on change
    this.saveCount.update(s => s + 1);
    this.lastSaved.set(new Date().toLocaleTimeString());
  }
}

// ─── ADVANCED (39–50) ────────────────────────────────────────

// 39. withHooks lifecycle
@Component({
  selector: 'ex-39',
  standalone: true,
  template: `
    <div style="background:#e8f4f8;padding:12px;border-radius:6px">
      <strong>withHooks lifecycle</strong>
      <p>onInit: runs when store is created (injected)</p>
      <p>onDestroy: cleanup subscriptions, timers</p>
      <pre style="background:#f0f0f0;padding:8px;font-size:0.8rem;margin:4px 0">{{hooksCode}}</pre>
    </div>
  `,
})
class Ex39 {
  hooksCode = `const Store = signalStore(
  withState({ data: null }),
  withHooks({
    onInit(store) {
      store.loadData(); // auto-load
    },
    onDestroy(store) {
      store.cleanup(); // unsubscribe
    },
  })
);`;
}

// 40. Entity adapter in signal store
@Component({
  selector: 'ex-40',
  standalone: true,
  template: `
    <div style="background:#f0f4e8;padding:12px;border-radius:6px">
      <strong>Entity Adapter in Signal Store</strong>
      <p>ids: {{ ids().join(', ') }}</p>
      @for (id of ids(); track id) {
        <div style="display:flex;justify-content:space-between;padding:2px 0">
          <span>{{ entities()[id].name }}</span>
          <button (click)="remove(id)" style="font-size:0.75rem">✕</button>
        </div>
      }
      <button (click)="add()" style="margin-top:6px">Add Entity</button>
    </div>
  `,
})
class Ex40 {
  entities = signal<Record<number, { id: number; name: string }>>({
    1: { id: 1, name: 'Entity A' },
    2: { id: 2, name: 'Entity B' },
  });
  ids = computed(() => Object.keys(this.entities()).map(Number));
  add() {
    const id = Date.now();
    this.entities.update(e => ({ ...e, [id]: { id, name: `Entity ${this.ids().length + 1}` } }));
  }
  remove(id: number) {
    this.entities.update(e => { const n = { ...e }; delete n[id]; return n; });
  }
}

// 41. Optimistic mutation with rollback
@Component({
  selector: 'ex-41',
  standalone: true,
  template: `
    <div style="background:#f8f0e8;padding:12px;border-radius:6px">
      <strong>Optimistic Mutation + Rollback</strong>
      <p>Name: <strong>{{ name() }}</strong> {{ saving() ? '(saving...)' : '' }}</p>
      <button (click)="saveName('New Name')">Save (success)</button>
      <button (click)="saveNameFail('Bad Name')" style="margin-left:8px">Save (fail)</button>
      @if (error()) { <p style="color:red">{{ error() }}</p> }
    </div>
  `,
})
class Ex41 {
  name = signal('Original Name');
  saving = signal(false);
  error = signal<string | null>(null);
  saveName(newName: string) {
    const prev = this.name();
    this.name.set(newName); // optimistic
    this.saving.set(true); this.error.set(null);
    setTimeout(() => this.saving.set(false), 700);
  }
  saveNameFail(newName: string) {
    const prev = this.name();
    this.name.set(newName); // optimistic
    this.saving.set(true); this.error.set(null);
    setTimeout(() => {
      this.name.set(prev); // rollback
      this.saving.set(false);
      this.error.set('Server rejected update');
    }, 700);
  }
}

// 42. Immer-like immutable updates
@Component({
  selector: 'ex-42',
  standalone: true,
  template: `
    <div style="background:#e8e8f8;padding:12px;border-radius:6px">
      <strong>Immer-like Immutable Updates</strong>
      <p>Deep nested state update without mutation:</p>
      <p>{{ state() | json }}</p>
      <button (click)="updateNested()">Update nested</button>
    </div>
  `,
})
class Ex42 {
  state = signal({
    user: { profile: { name: 'Alice', settings: { theme: 'light' } } }
  });
  updateNested() {
    this.state.update(s => ({
      ...s,
      user: {
        ...s.user,
        profile: {
          ...s.user.profile,
          settings: { ...s.user.profile.settings, theme: s.user.profile.settings.theme === 'light' ? 'dark' : 'light' }
        }
      }
    }));
  }
}

// 43. Store performance optimization
@Component({
  selector: 'ex-43',
  standalone: true,
  template: `
    <div style="background:#f8e8f0;padding:12px;border-radius:6px">
      <strong>Store Performance Optimization</strong>
      <ul style="font-size:0.85rem;margin:4px 0">
        <li>Use fine-grained signals — not one big object signal</li>
        <li>computed() is lazy and memoized</li>
        <li>Split store into feature stores</li>
        <li>Avoid large arrays in single signal</li>
      </ul>
      <p>Separate signals: {{ a() + b() + c() }}</p>
      <button (click)="a.update(v=>v+1)">+a (only a rerenders)</button>
    </div>
  `,
})
class Ex43 {
  a = signal(1);
  b = signal(2);
  c = signal(3);
}

// 44. Large collection slicing
@Component({
  selector: 'ex-44',
  standalone: true,
  template: `
    <div style="background:#fff8e8;padding:12px;border-radius:6px">
      <strong>Large Collection Slicing</strong>
      <p>Total: {{ allItems().length }} | Showing: {{ visible().length }}</p>
      @for (item of visible(); track item) {
        <span style="display:inline-block;margin:2px;padding:1px 5px;background:#eee;border-radius:3px;font-size:0.8rem">{{ item }}</span>
      }
      <br/>
      <button (click)="loadMore()" [disabled]="offset() >= allItems().length" style="margin-top:6px">Load More</button>
    </div>
  `,
})
class Ex44 {
  allItems = signal(Array.from({ length: 100 }, (_, i) => `Item ${i + 1}`));
  offset = signal(10);
  visible = computed(() => this.allItems().slice(0, this.offset()));
  loadMore() { this.offset.update(o => Math.min(o + 10, this.allItems().length)); }
}

// 45. Real-time collaboration store simulation
@Component({
  selector: 'ex-45',
  standalone: true,
  template: `
    <div style="background:#e8f8f0;padding:12px;border-radius:6px">
      <strong>Real-time Collaboration Store</strong>
      <p>Online users: {{ onlineUsers().join(', ') }}</p>
      <p>Shared doc version: {{ docVersion() }}</p>
      @for (op of ops().slice(-3); track op) { <div style="font-size:0.8rem">{{ op }}</div> }
      <button (click)="simulateEdit()">Simulate remote edit</button>
    </div>
  `,
})
class Ex45 {
  onlineUsers = signal(['Alice', 'Bob']);
  docVersion = signal(1);
  ops = signal<string[]>([]);
  simulateEdit() {
    const user = Math.random() > 0.5 ? 'Alice' : 'Bob';
    this.docVersion.update(v => v + 1);
    this.ops.update(o => [...o, `${user} edited @ v${this.docVersion()}`]);
  }
}

// 46. Store testing patterns
@Component({
  selector: 'ex-46',
  standalone: true,
  template: `
    <div style="background:#f8e8e8;padding:12px;border-radius:6px">
      <strong>Store Testing Patterns</strong>
      <pre style="background:#f0f0f0;padding:8px;font-size:0.75rem;margin:4px 0;overflow:auto">{{testCode}}</pre>
    </div>
  `,
})
class Ex46 {
  testCode = `it('should increment', () => {
  TestBed.configureTestingModule({
    providers: [CounterStore],
  });
  const store = TestBed.inject(CounterStore);
  expect(store.count()).toBe(0);
  store.increment();
  expect(store.count()).toBe(1);
});`;
}

// 47. Migration from NgRx to signal store
@Component({
  selector: 'ex-47',
  standalone: true,
  template: `
    <div style="background:#e8f4f8;padding:12px;border-radius:6px">
      <strong>Migration: NgRx → Signal Store</strong>
      <table style="font-size:0.8rem;border-collapse:collapse;width:100%">
        <tr style="background:#ddd"><th style="padding:3px 6px;text-align:left">NgRx</th><th style="padding:3px 6px;text-align:left">Signal Store</th></tr>
        @for (row of migrations; track row.from) {
          <tr style="border-bottom:1px solid #eee">
            <td style="padding:3px 6px;font-family:monospace">{{ row.from }}</td>
            <td style="padding:3px 6px;font-family:monospace">{{ row.to }}</td>
          </tr>
        }
      </table>
    </div>
  `,
})
class Ex47 {
  migrations = [
    { from: 'createAction', to: 'withMethods' },
    { from: 'createReducer', to: 'withState' },
    { from: 'createSelector', to: 'withComputed' },
    { from: 'createEffect', to: 'withHooks / rxMethod' },
    { from: 'Store.select()', to: 'store.slice()' },
  ];
}

// 48. Full e-commerce store
@Component({
  selector: 'ex-48',
  standalone: true,
  template: `
    <div style="background:#f0f4e8;padding:12px;border-radius:6px">
      <strong>Full E-commerce Store</strong>
      <p>User: {{ user() }} | Cart: {{ cartCount() }} | Total: ${{ cartTotal() }}</p>
      @for (p of products(); track p.id) {
        <div style="display:flex;justify-content:space-between;align-items:center;margin:2px 0">
          <span>{{ p.name }} — ${{ p.price }}</span>
          <button (click)="addToCart(p)" style="font-size:0.75rem">Add</button>
        </div>
      }
      <button (click)="checkout()" style="margin-top:6px;background:#4CAF50;color:white;border:none;padding:4px 12px;border-radius:4px;cursor:pointer">Checkout</button>
      @if (checkoutMsg()) { <p style="color:green">{{ checkoutMsg() }}</p> }
    </div>
  `,
})
class Ex48 {
  user = signal('Alice');
  products = signal([{ id: 1, name: 'Widget', price: 9.99 }, { id: 2, name: 'Gadget', price: 24.99 }]);
  cart = signal<{ id: number; name: string; price: number }[]>([]);
  cartCount = computed(() => this.cart().length);
  cartTotal = computed(() => +this.cart().reduce((s, i) => s + i.price, 0).toFixed(2));
  checkoutMsg = signal('');
  addToCart(p: { id: number; name: string; price: number }) { this.cart.update(c => [...c, p]); }
  checkout() {
    if (!this.cart().length) return;
    this.checkoutMsg.set(`Order placed! $${this.cartTotal()}`);
    this.cart.set([]);
  }
}

// 49. Store DevTools integration simulation
@Component({
  selector: 'ex-49',
  standalone: true,
  template: `
    <div style="background:#f8f0e8;padding:12px;border-radius:6px">
      <strong>Store DevTools Integration</strong>
      <p>Action log (last 5):</p>
      @for (entry of log().slice(-5); track entry.ts) {
        <div style="font-size:0.8rem;font-family:monospace;padding:1px 0">
          [{{ entry.ts }}] {{ entry.action }} → {{ entry.stateSnap }}
        </div>
      }
      <button (click)="dispatch('INCREMENT')">increment</button>
      <button (click)="dispatch('RESET')" style="margin-left:8px">reset</button>
    </div>
  `,
})
class Ex49 {
  count = signal(0);
  log = signal<{ ts: string; action: string; stateSnap: string }[]>([]);
  dispatch(action: string) {
    if (action === 'INCREMENT') this.count.update(c => c + 1);
    if (action === 'RESET') this.count.set(0);
    this.log.update(l => [...l, {
      ts: new Date().toLocaleTimeString(),
      action,
      stateSnap: `{count:${this.count()}}`,
    }]);
  }
}

// 50. Production signal store architecture
@Component({
  selector: 'ex-50',
  standalone: true,
  template: `
    <div style="background:#e8e8f8;padding:12px;border-radius:6px">
      <strong>Production Signal Store Architecture</strong>
      <ul style="font-size:0.85rem;margin:4px 0">
        @for (point of points; track point) { <li>{{ point }}</li> }
      </ul>
      <p style="font-size:0.8rem;color:#666">Pattern: feature-scoped stores, providedIn: root for global</p>
    </div>
  `,
})
class Ex50 {
  points = [
    'Provide global stores in app.config.ts with provideState()',
    'Feature stores: lazy-loaded via route providers',
    'Expose only read signals via asReadonly()',
    'Use withHooks for init/destroy side effects',
    'rxMethod() bridges RxJS observables into store',
    'withEntities() for normalized CRUD collections',
    'tapResponse() for safe effect error handling',
    'DevTools: withDevtools() from @angular-architects/ngrx-toolkit',
  ];
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
    Ex41, Ex42, Ex43, Ex44, Ex45, Ex46, Ex47, Ex48, Ex49, Ex50,
  ],
  template: `
    <div style="font-family:sans-serif;max-width:700px;margin:0 auto;padding:20px">
      <h1>Examples 5.5 — NgRx Signal Store</h1>

      <h4>1. signalStore concept</h4><ex-01 /><hr />
      <h4>2. withState — initial state</h4><ex-02 /><hr />
      <h4>3. withComputed — memoized derived signals</h4><ex-03 /><hr />
      <h4>4. withMethods — state mutations</h4><ex-04 /><hr />
      <h4>5. Read-only slices</h4><ex-05 /><hr />
      <h4>6. Updaters — patchState</h4><ex-06 /><hr />
      <h4>7. Derived state — chained computed</h4><ex-07 /><hr />
      <h4>8. Store injection pattern</h4><ex-08 /><hr />
      <h4>9. Simple counter store</h4><ex-09 /><hr />
      <h4>10. Todo signal store</h4><ex-10 /><hr />
      <h4>11. User profile store</h4><ex-11 /><hr />
      <h4>12. Shopping cart store</h4><ex-12 /><hr />
      <h4>13. Loading/error state</h4><ex-13 /><hr />

      <h4>14. Optimistic updates</h4><ex-14 /><hr />
      <h4>15. Undo / Redo</h4><ex-15 /><hr />
      <h4>16. Pagination state</h4><ex-16 /><hr />
      <h4>17. Search + filter state</h4><ex-17 /><hr />
      <h4>18. Authenticated user store</h4><ex-18 /><hr />
      <h4>19. Theme store</h4><ex-19 /><hr />
      <h4>20. Notification store</h4><ex-20 /><hr />
      <h4>21. Debounced search</h4><ex-21 /><hr />
      <h4>22. Multi-entity store</h4><ex-22 /><hr />
      <h4>23. Feature stores composition</h4><ex-23 /><hr />
      <h4>24. Store with RxJS interop</h4><ex-24 /><hr />
      <h4>25. Derived collections</h4><ex-25 /><hr />
      <h4>26. Store reset</h4><ex-26 /><hr />

      <h4>27. Store-as-service pattern</h4><ex-27 /><hr />
      <h4>28. Combined stores</h4><ex-28 /><hr />
      <h4>29. Store with effects simulation</h4><ex-29 /><hr />
      <h4>30. Store with router state</h4><ex-30 /><hr />
      <h4>31. Store with form sync</h4><ex-31 /><hr />
      <h4>32. Store + localStorage sync</h4><ex-32 /><hr />
      <h4>33. Store with WebSocket simulation</h4><ex-33 /><hr />
      <h4>34. Nested state normalization</h4><ex-34 /><hr />
      <h4>35. Cross-store communication</h4><ex-35 /><hr />
      <h4>36. Store with history tracking</h4><ex-36 /><hr />
      <h4>37. Selector memoization</h4><ex-37 /><hr />
      <h4>38. Reactive store patterns</h4><ex-38 /><hr />

      <h4>39. withHooks lifecycle</h4><ex-39 /><hr />
      <h4>40. Entity adapter in signal store</h4><ex-40 /><hr />
      <h4>41. Optimistic mutation + rollback</h4><ex-41 /><hr />
      <h4>42. Immer-like immutable updates</h4><ex-42 /><hr />
      <h4>43. Store performance optimization</h4><ex-43 /><hr />
      <h4>44. Large collection slicing</h4><ex-44 /><hr />
      <h4>45. Real-time collaboration store</h4><ex-45 /><hr />
      <h4>46. Store testing patterns</h4><ex-46 /><hr />
      <h4>47. Migration: NgRx → Signal Store</h4><ex-47 /><hr />
      <h4>48. Full e-commerce store</h4><ex-48 /><hr />
      <h4>49. Store DevTools integration</h4><ex-49 /><hr />
      <h4>50. Production signal store architecture</h4><ex-50 />
    </div>
  `,
})
export class AppComponent {}
