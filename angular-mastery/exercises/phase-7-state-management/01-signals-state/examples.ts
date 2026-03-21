import { Component, signal, computed, effect, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Injectable } from '@angular/core';

// ─── BASIC (1–13) ───────────────────────────────────────────────────────────

// Ex01 – signal counter
@Component({
  selector: 'ex-01', standalone: true, template: `
    <h4>Ex01 – Signal Counter</h4>
    <p>Count: {{ count() }}</p>
    <button (click)="inc()">+</button>
    <button (click)="dec()">-</button>`
})
export class Ex01 {
  count = signal(0);
  inc() { this.count.update(v => v + 1); }
  dec() { this.count.update(v => v - 1); }
}

// Ex02 – signal toggle
@Component({
  selector: 'ex-02', standalone: true, template: `
    <h4>Ex02 – Signal Toggle</h4>
    <p>On: {{ on() }}</p>
    <button (click)="toggle()">Toggle</button>`
})
export class Ex02 {
  on = signal(false);
  toggle() { this.on.update(v => !v); }
}

// Ex03 – signal string
@Component({
  selector: 'ex-03', standalone: true, imports: [FormsModule], template: `
    <h4>Ex03 – Signal String</h4>
    <input [(ngModel)]="name" (ngModelChange)="name.set($event)" [ngModel]="name()" />
    <p>Hello, {{ name() }}!</p>`
})
export class Ex03 {
  name = signal('World');
}

// Ex04 – signal array
@Component({
  selector: 'ex-04', standalone: true, template: `
    <h4>Ex04 – Signal Array</h4>
    @for (item of items(); track item) { <span>{{ item }} </span> }
    <button (click)="add()">Add</button>`
})
export class Ex04 {
  items = signal<number[]>([1, 2, 3]);
  add() { this.items.update(arr => [...arr, arr.length + 1]); }
}

// Ex05 – signal object
@Component({
  selector: 'ex-05', standalone: true, template: `
    <h4>Ex05 – Signal Object</h4>
    <p>{{ user().name }} ({{ user().age }})</p>
    <button (click)="birthday()">Birthday</button>`
})
export class Ex05 {
  user = signal({ name: 'Alice', age: 30 });
  birthday() { this.user.update(u => ({ ...u, age: u.age + 1 })); }
}

// Ex06 – computed from signal
@Component({
  selector: 'ex-06', standalone: true, template: `
    <h4>Ex06 – Computed from Signal</h4>
    <p>Price: {{ price() }} | Tax: {{ tax() }} | Total: {{ total() }}</p>
    <button (click)="price.update(p => p + 10)">+10</button>`
})
export class Ex06 {
  price = signal(100);
  tax = computed(() => this.price() * 0.2);
  total = computed(() => this.price() + this.tax());
}

// Ex07 – effect on signal
@Component({
  selector: 'ex-07', standalone: true, template: `
    <h4>Ex07 – Effect on Signal</h4>
    <p>Value: {{ val() }}</p>
    <button (click)="val.update(v => v + 1)">Increment</button>
    <p>Check console for effect log.</p>`
})
export class Ex07 {
  val = signal(0);
  constructor() {
    effect(() => { console.log('[Ex07] val changed:', this.val()); });
  }
}

// Ex08 – effect with cleanup
@Component({
  selector: 'ex-08', standalone: true, template: `
    <h4>Ex08 – Effect with Cleanup</h4>
    <p>Timer: {{ tick() }}</p>
    <button (click)="active.set(!active())">Toggle</button>`
})
export class Ex08 {
  active = signal(false);
  tick = signal(0);
  constructor() {
    effect((onCleanup) => {
      if (!this.active()) return;
      const id = setInterval(() => this.tick.update(t => t + 1), 1000);
      onCleanup(() => clearInterval(id));
    });
  }
}

// Ex09 – signal .set()
@Component({
  selector: 'ex-09', standalone: true, template: `
    <h4>Ex09 – Signal .set()</h4>
    <p>Status: {{ status() }}</p>
    <button (click)="status.set('active')">Active</button>
    <button (click)="status.set('idle')">Idle</button>`
})
export class Ex09 {
  status = signal('idle');
}

// Ex10 – signal .update()
@Component({
  selector: 'ex-10', standalone: true, template: `
    <h4>Ex10 – Signal .update()</h4>
    <p>Score: {{ score() }}</p>
    <button (click)="score.update(s => s * 2)">Double</button>
    <button (click)="score.set(1)">Reset</button>`
})
export class Ex10 {
  score = signal(1);
}

// Ex11 – signal in service
@Injectable({ providedIn: 'root' })
export class CounterService {
  private _count = signal(0);
  count = this._count.asReadonly();
  increment() { this._count.update(c => c + 1); }
}

@Component({
  selector: 'ex-11', standalone: true, template: `
    <h4>Ex11 – Signal in Service</h4>
    <p>Count: {{ svc.count() }}</p>
    <button (click)="svc.increment()">+</button>`
})
export class Ex11 {
  svc = inject(CounterService);
}

// Ex12 – shared signal service
@Injectable({ providedIn: 'root' })
export class SharedThemeService {
  theme = signal<'light' | 'dark'>('light');
  toggle() { this.theme.update(t => t === 'light' ? 'dark' : 'light'); }
}

@Component({
  selector: 'ex-12', standalone: true, template: `
    <h4>Ex12 – Shared Signal Service</h4>
    <p>Theme: {{ svc.theme() }}</p>
    <button (click)="svc.toggle()">Toggle</button>`
})
export class Ex12 {
  svc = inject(SharedThemeService);
}

// Ex13 – signal with localStorage
@Component({
  selector: 'ex-13', standalone: true, template: `
    <h4>Ex13 – Signal with localStorage</h4>
    <p>Saved: {{ saved() }}</p>
    <button (click)="save('foo')">Save "foo"</button>
    <button (click)="save('bar')">Save "bar"</button>`
})
export class Ex13 {
  saved = signal(localStorage.getItem('ex13') ?? '(none)');
  save(val: string) {
    localStorage.setItem('ex13', val);
    this.saved.set(val);
  }
}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────────────────────

// Ex14 – Shopping cart signal store
interface CartItem { id: number; name: string; qty: number; price: number; }
@Component({
  selector: 'ex-14', standalone: true, template: `
    <h4>Ex14 – Shopping Cart Signal Store</h4>
    @for (item of cart(); track item.id) {
      <p>{{ item.name }} x{{ item.qty }} = ${{ item.qty * item.price }}</p>
    }
    <p><strong>Total: ${{ total() }}</strong></p>
    <button (click)="addItem()">Add Item</button>`
})
export class Ex14 {
  cart = signal<CartItem[]>([
    { id: 1, name: 'Apple', qty: 1, price: 1.5 },
    { id: 2, name: 'Bread', qty: 2, price: 2.0 }
  ]);
  total = computed(() => this.cart().reduce((s, i) => s + i.qty * i.price, 0));
  addItem() {
    this.cart.update(c => [...c, { id: Date.now(), name: 'Item', qty: 1, price: 3.0 }]);
  }
}

// Ex15 – User auth signal state
@Component({
  selector: 'ex-15', standalone: true, template: `
    <h4>Ex15 – User Auth Signal State</h4>
    @if (user()) {
      <p>Logged in as: {{ user()!.name }}</p>
      <button (click)="logout()">Logout</button>
    } @else {
      <button (click)="login()">Login</button>
    }`
})
export class Ex15 {
  user = signal<{ name: string } | null>(null);
  login() { this.user.set({ name: 'Alice' }); }
  logout() { this.user.set(null); }
}

// Ex16 – Theme signal state
@Component({
  selector: 'ex-16', standalone: true, template: `
    <h4>Ex16 – Theme Signal State</h4>
    <div [style.background]="bg()" [style.color]="fg()" style="padding:8px">
      Theme: {{ theme() }}
    </div>
    <button (click)="cycle()">Cycle</button>`
})
export class Ex16 {
  themes = ['light', 'dark', 'solarized'];
  idx = signal(0);
  theme = computed(() => this.themes[this.idx()]);
  bg = computed(() => this.idx() === 1 ? '#222' : this.idx() === 2 ? '#fdf6e3' : '#fff');
  fg = computed(() => this.idx() === 1 ? '#fff' : '#333');
  cycle() { this.idx.update(i => (i + 1) % this.themes.length); }
}

// Ex17 – Search filter signal state
@Component({
  selector: 'ex-17', standalone: true, imports: [FormsModule], template: `
    <h4>Ex17 – Search Filter Signal State</h4>
    <input [ngModel]="query()" (ngModelChange)="query.set($event)" placeholder="Search..." />
    @for (item of filtered(); track item) { <p>{{ item }}</p> }`
})
export class Ex17 {
  items = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];
  query = signal('');
  filtered = computed(() =>
    this.items.filter(i => i.toLowerCase().includes(this.query().toLowerCase()))
  );
}

// Ex18 – Pagination signal state
@Component({
  selector: 'ex-18', standalone: true, template: `
    <h4>Ex18 – Pagination Signal State</h4>
    @for (item of page(); track item) { <p>{{ item }}</p> }
    <button (click)="prev()" [disabled]="pageNum() === 0">Prev</button>
    <span> Page {{ pageNum() + 1 }} / {{ totalPages() }} </span>
    <button (click)="next()" [disabled]="pageNum() === totalPages() - 1">Next</button>`
})
export class Ex18 {
  all = Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`);
  pageSize = 5;
  pageNum = signal(0);
  totalPages = computed(() => Math.ceil(this.all.length / this.pageSize));
  page = computed(() => this.all.slice(this.pageNum() * this.pageSize, (this.pageNum() + 1) * this.pageSize));
  prev() { this.pageNum.update(p => Math.max(0, p - 1)); }
  next() { this.pageNum.update(p => Math.min(this.totalPages() - 1, p + 1)); }
}

// Ex19 – Form signal state
@Component({
  selector: 'ex-19', standalone: true, imports: [FormsModule], template: `
    <h4>Ex19 – Form Signal State</h4>
    <input [ngModel]="form().name" (ngModelChange)="patch('name', $event)" placeholder="Name" />
    <input [ngModel]="form().email" (ngModelChange)="patch('email', $event)" placeholder="Email" />
    <p>Valid: {{ valid() }}</p>`
})
export class Ex19 {
  form = signal({ name: '', email: '' });
  valid = computed(() => this.form().name.length > 0 && this.form().email.includes('@'));
  patch(key: 'name' | 'email', val: string) { this.form.update(f => ({ ...f, [key]: val })); }
}

// Ex20 – Todo list signal state
interface Todo { id: number; text: string; done: boolean; }
@Component({
  selector: 'ex-20', standalone: true, imports: [FormsModule], template: `
    <h4>Ex20 – Todo List Signal State</h4>
    <input [ngModel]="draft()" (ngModelChange)="draft.set($event)" placeholder="New todo" />
    <button (click)="add()">Add</button>
    @for (t of todos(); track t.id) {
      <p [style.text-decoration]="t.done ? 'line-through' : ''"
         (click)="toggle(t.id)">{{ t.text }}</p>
    }
    <p>Remaining: {{ remaining() }}</p>`
})
export class Ex20 {
  todos = signal<Todo[]>([]);
  draft = signal('');
  remaining = computed(() => this.todos().filter(t => !t.done).length);
  add() {
    if (!this.draft()) return;
    this.todos.update(ts => [...ts, { id: Date.now(), text: this.draft(), done: false }]);
    this.draft.set('');
  }
  toggle(id: number) {
    this.todos.update(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }
}

// Ex21 – Notification signal state
interface Notification { id: number; msg: string; type: string; }
@Component({
  selector: 'ex-21', standalone: true, template: `
    <h4>Ex21 – Notification Signal State</h4>
    <button (click)="push('info')">Info</button>
    <button (click)="push('error')">Error</button>
    @for (n of notes(); track n.id) {
      <p [style.color]="n.type === 'error' ? 'red' : 'blue'">{{ n.msg }}
        <button (click)="dismiss(n.id)">x</button></p>
    }`
})
export class Ex21 {
  notes = signal<Notification[]>([]);
  push(type: string) {
    this.notes.update(ns => [...ns, { id: Date.now(), msg: `${type} message`, type }]);
  }
  dismiss(id: number) { this.notes.update(ns => ns.filter(n => n.id !== id)); }
}

// Ex22 – Timer signal state
@Component({
  selector: 'ex-22', standalone: true, template: `
    <h4>Ex22 – Timer Signal State</h4>
    <p>Elapsed: {{ elapsed() }}s</p>
    <button (click)="start()">Start</button>
    <button (click)="stop()">Stop</button>
    <button (click)="reset()">Reset</button>`
})
export class Ex22 implements OnDestroy {
  elapsed = signal(0);
  private id: any = null;
  start() {
    if (this.id) return;
    this.id = setInterval(() => this.elapsed.update(t => t + 1), 1000);
  }
  stop() { clearInterval(this.id); this.id = null; }
  reset() { this.stop(); this.elapsed.set(0); }
  ngOnDestroy() { this.stop(); }
}

// Ex23 – Settings signal state
@Component({
  selector: 'ex-23', standalone: true, imports: [FormsModule], template: `
    <h4>Ex23 – Settings Signal State</h4>
    <label><input type="checkbox" [ngModel]="settings().notifications"
      (ngModelChange)="patch('notifications', $event)" /> Notifications</label>
    <label><input type="checkbox" [ngModel]="settings().darkMode"
      (ngModelChange)="patch('darkMode', $event)" /> Dark Mode</label>
    <pre>{{ settings() | json }}</pre>`
})
export class Ex23 {
  settings = signal({ notifications: true, darkMode: false, lang: 'en' });
  patch(key: string, val: any) { this.settings.update(s => ({ ...s, [key]: val })); }
}

// Ex24 – History/undo signal state
@Component({
  selector: 'ex-24', standalone: true, template: `
    <h4>Ex24 – History/Undo Signal State</h4>
    <p>Value: {{ current() }}</p>
    <button (click)="push(current() + 1)">+1</button>
    <button (click)="undo()" [disabled]="history().length < 2">Undo</button>`
})
export class Ex24 {
  history = signal([0]);
  current = computed(() => this.history()[this.history().length - 1]);
  push(val: number) { this.history.update(h => [...h, val]); }
  undo() { this.history.update(h => h.length > 1 ? h.slice(0, -1) : h); }
}

// Ex25 – Signal with debounce effect
@Component({
  selector: 'ex-25', standalone: true, imports: [FormsModule], template: `
    <h4>Ex25 – Signal with Debounce Effect</h4>
    <input [ngModel]="raw()" (ngModelChange)="raw.set($event)" placeholder="Type..." />
    <p>Debounced: {{ debounced() }}</p>`
})
export class Ex25 {
  raw = signal('');
  debounced = signal('');
  private timer: any = null;
  constructor() {
    effect(() => {
      const v = this.raw();
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.debounced.set(v), 400);
    });
  }
}

// Ex26 – Signal with validation computed
@Component({
  selector: 'ex-26', standalone: true, imports: [FormsModule], template: `
    <h4>Ex26 – Signal with Validation Computed</h4>
    <input [ngModel]="password()" (ngModelChange)="password.set($event)" placeholder="Password" />
    <p [style.color]="errors().length ? 'red' : 'green'">
      {{ errors().length ? errors().join(', ') : 'Valid!' }}
    </p>`
})
export class Ex26 {
  password = signal('');
  errors = computed(() => {
    const p = this.password();
    const errs: string[] = [];
    if (p.length < 8) errs.push('min 8 chars');
    if (!/[A-Z]/.test(p)) errs.push('needs uppercase');
    if (!/[0-9]/.test(p)) errs.push('needs digit');
    return errs;
  });
}

// ─── NESTED (27–38) ──────────────────────────────────────────────────────────

// Ex27 – Multi-store composition
@Injectable({ providedIn: 'root' })
export class UserStore27 { user = signal({ name: 'Bob' }); }
@Injectable({ providedIn: 'root' })
export class CartStore27 { items = signal<string[]>([]); }

@Component({
  selector: 'ex-27', standalone: true, template: `
    <h4>Ex27 – Multi-Store Composition</h4>
    <p>User: {{ userStore.user().name }}</p>
    <p>Cart items: {{ cartStore.items().length }}</p>
    <button (click)="cartStore.items.update(i => [...i, 'item'])">Add to cart</button>`
})
export class Ex27 {
  userStore = inject(UserStore27);
  cartStore = inject(CartStore27);
}

// Ex28 – Signal store with HTTP (toSignal simulation)
import { toSignal } from '@angular/core/rxjs-interop';
import { of, delay } from 'rxjs';

@Component({
  selector: 'ex-28', standalone: true, template: `
    <h4>Ex28 – Signal Store with HTTP (toSignal)</h4>
    @if (data()) { <p>Loaded: {{ data() | json }}</p> }
    @else { <p>Loading...</p> }`
})
export class Ex28 {
  data = toSignal(of({ id: 1, name: 'Post' }).pipe(delay(500)));
}

// Ex29 – Signal store parent-child sharing
@Injectable()
export class SharedStore29 {
  count = signal(0);
  inc() { this.count.update(c => c + 1); }
}

@Component({
  selector: 'ex-29-child', standalone: true, template: `
    <button (click)="store.inc()">Child +1 ({{ store.count() }})</button>`
})
export class Ex29Child {
  store = inject(SharedStore29);
}

@Component({
  selector: 'ex-29', standalone: true,
  imports: [Ex29Child],
  providers: [SharedStore29],
  template: `
    <h4>Ex29 – Signal Store Parent-Child Sharing</h4>
    <p>Parent sees: {{ store.count() }}</p>
    <ex-29-child /><ex-29-child />`
})
export class Ex29 {
  store = inject(SharedStore29);
}

// Ex30 – Signal store with router sync (simulated)
@Component({
  selector: 'ex-30', standalone: true, template: `
    <h4>Ex30 – Signal Store with Router Sync</h4>
    <p>Current "route": {{ route() }}</p>
    <button (click)="navigate('home')">Home</button>
    <button (click)="navigate('about')">About</button>
    <button (click)="navigate('contact')">Contact</button>`
})
export class Ex30 {
  route = signal('home');
  navigate(path: string) {
    this.route.set(path);
    history.pushState({}, '', '/' + path);
  }
}

// Ex31 – Signal cascading (a→b→c→display)
@Component({
  selector: 'ex-31', standalone: true, template: `
    <h4>Ex31 – Signal Cascading (a→b→c→display)</h4>
    <p>a={{ a() }}, b={{ b() }}, c={{ c() }}, display={{ display() }}</p>
    <button (click)="a.update(v => v + 1)">Increment a</button>`
})
export class Ex31 {
  a = signal(1);
  b = computed(() => this.a() * 2);
  c = computed(() => this.b() + 10);
  display = computed(() => `Result: ${this.c()}`);
}

// Ex32 – Signal store with optimistic update
@Component({
  selector: 'ex-32', standalone: true, template: `
    <h4>Ex32 – Signal Store with Optimistic Update</h4>
    @for (item of items(); track item.id) {
      <p [style.opacity]="item.pending ? '0.5' : '1'">{{ item.name }}</p>
    }
    <button (click)="addOptimistic()">Add (optimistic)</button>`
})
export class Ex32 {
  items = signal<{ id: number; name: string; pending: boolean }[]>([
    { id: 1, name: 'Real Item', pending: false }
  ]);
  addOptimistic() {
    const id = Date.now();
    this.items.update(i => [...i, { id, name: 'Pending Item', pending: true }]);
    setTimeout(() => {
      this.items.update(i => i.map(item => item.id === id ? { ...item, pending: false, name: 'Confirmed Item' } : item));
    }, 1000);
  }
}

// Ex33 – Cross-store dependencies (cart + inventory)
@Injectable({ providedIn: 'root' })
export class InventoryStore {
  stock = signal<Record<string, number>>({ apple: 5, bread: 3 });
}
@Injectable({ providedIn: 'root' })
export class CartStore33 {
  items = signal<string[]>([]);
}

@Component({
  selector: 'ex-33', standalone: true, template: `
    <h4>Ex33 – Cross-Store Dependencies (Cart + Inventory)</h4>
    <p>Stock: {{ inv.stock() | json }}</p>
    <p>Cart: {{ cart.items() | json }}</p>
    <button (click)="addToCart('apple')" [disabled]="inv.stock()['apple'] === 0">
      Add Apple ({{ inv.stock()['apple'] }} left)
    </button>`
})
export class Ex33 {
  inv = inject(InventoryStore);
  cart = inject(CartStore33);
  addToCart(item: string) {
    if ((this.inv.stock()[item] ?? 0) > 0) {
      this.cart.items.update(c => [...c, item]);
      this.inv.stock.update(s => ({ ...s, [item]: (s[item] ?? 0) - 1 }));
    }
  }
}

// Ex34 – Signal store with persistence
@Component({
  selector: 'ex-34', standalone: true, template: `
    <h4>Ex34 – Signal Store with Persistence</h4>
    <p>Visits: {{ visits() }}</p>`
})
export class Ex34 {
  visits = signal(+(localStorage.getItem('ex34-visits') ?? 0));
  constructor() {
    this.visits.update(v => v + 1);
    effect(() => { localStorage.setItem('ex34-visits', String(this.visits())); });
  }
}

// Ex35 – Signal store error + loading
@Component({
  selector: 'ex-35', standalone: true, template: `
    <h4>Ex35 – Signal Store Error + Loading</h4>
    @if (loading()) { <p>Loading...</p> }
    @else if (error()) { <p style="color:red">Error: {{ error() }}</p> }
    @else { <p>Data: {{ data() | json }}</p> }
    <button (click)="load(true)">Load OK</button>
    <button (click)="load(false)">Load Error</button>`
})
export class Ex35 {
  loading = signal(false);
  error = signal<string | null>(null);
  data = signal<any>(null);
  load(success: boolean) {
    this.loading.set(true);
    this.error.set(null);
    setTimeout(() => {
      this.loading.set(false);
      if (success) this.data.set({ result: 'ok' });
      else this.error.set('Network error');
    }, 600);
  }
}

// Ex36 – Full dashboard signal state
@Component({
  selector: 'ex-36', standalone: true, template: `
    <h4>Ex36 – Full Dashboard Signal State</h4>
    <p>User: {{ user().name }} | Notifs: {{ notifications().length }} | Theme: {{ theme() }}</p>
    <button (click)="addNotif()">Add Notification</button>
    <button (click)="theme.update(t => t === 'light' ? 'dark' : 'light')">Toggle Theme</button>`
})
export class Ex36 {
  user = signal({ name: 'Admin', role: 'admin' });
  notifications = signal<string[]>([]);
  theme = signal<'light' | 'dark'>('light');
  stats = computed(() => ({ notifCount: this.notifications().length }));
  addNotif() { this.notifications.update(n => [...n, `Notif #${n.length + 1}`]); }
}

// ─── ADVANCED (37–50) ────────────────────────────────────────────────────────

// Ex37 – linkedSignal()
import { linkedSignal } from '@angular/core';

@Component({
  selector: 'ex-37', standalone: true, template: `
    <h4>Ex37 – linkedSignal()</h4>
    <p>Source: {{ source() }} | Linked: {{ linked() }}</p>
    <button (click)="source.update(v => v + 1)">Inc Source</button>
    <button (click)="linked.set(99)">Override Linked</button>`
})
export class Ex37 {
  source = signal(1);
  linked = linkedSignal(() => this.source() * 10);
}

// Ex38 – resource() API
import { resource } from '@angular/core';

@Component({
  selector: 'ex-38', standalone: true, template: `
    <h4>Ex38 – resource() API</h4>
    <p>Status: {{ userRes.status() }}</p>
    @if (userRes.value()) { <p>{{ userRes.value() | json }}</p> }
    <button (click)="userId.update(id => id + 1)">Next User</button>`
})
export class Ex38 {
  userId = signal(1);
  userRes = resource({
    request: () => ({ id: this.userId() }),
    loader: ({ request }) =>
      fetch(`https://jsonplaceholder.typicode.com/users/${request.id}`)
        .then(r => r.json())
  });
}

// Ex39 – toSignal with error handling
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of as rxOf } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'ex-39', standalone: true, template: `
    <h4>Ex39 – toSignal with Error Handling</h4>
    <p>{{ data() | json }}</p>`
})
export class Ex39 {
  private http = inject(HttpClient);
  data = toSignal(
    this.http.get('https://jsonplaceholder.typicode.com/todos/1').pipe(
      catchError(() => rxOf({ error: true }))
    ),
    { initialValue: null }
  );
}

// Ex40 – toObservable bridge
import { toObservable } from '@angular/core/rxjs-interop';

@Component({
  selector: 'ex-40', standalone: true, template: `
    <h4>Ex40 – toObservable Bridge</h4>
    <p>Signal: {{ count() }}</p>
    <p>Observable log in console</p>
    <button (click)="count.update(c => c + 1)">+</button>`
})
export class Ex40 implements OnInit {
  count = signal(0);
  count$ = toObservable(this.count);
  ngOnInit() { this.count$.subscribe(v => console.log('[Ex40] count$:', v)); }
}

// Ex41 – Signal store class pattern
class SignalStore41<T extends object> {
  private state = signal<T>({} as T);
  readonly select = this.state.asReadonly();
  setState(partial: Partial<T>) { this.state.update(s => ({ ...s, ...partial })); }
}

@Component({
  selector: 'ex-41', standalone: true, template: `
    <h4>Ex41 – Signal Store Class Pattern</h4>
    <p>{{ store.select() | json }}</p>
    <button (click)="store.setState({ count: (store.select()['count'] ?? 0) + 1 })">+</button>`
})
export class Ex41 {
  store = new SignalStore41<{ count: number }>();
  constructor() { this.store.setState({ count: 0 }); }
}

// Ex42 – Signal store with generics
class EntityStore<T extends { id: number }> {
  items = signal<T[]>([]);
  add(item: T) { this.items.update(i => [...i, item]); }
  remove(id: number) { this.items.update(i => i.filter(e => e.id !== id)); }
  getById(id: number) { return computed(() => this.items().find(e => e.id === id)); }
}

@Component({
  selector: 'ex-42', standalone: true, template: `
    <h4>Ex42 – Signal Store with Generics</h4>
    @for (p of store.items(); track p.id) {
      <p>{{ p.name }} <button (click)="store.remove(p.id)">del</button></p>
    }
    <button (click)="add()">Add Product</button>`
})
export class Ex42 {
  store = new EntityStore<{ id: number; name: string }>();
  add() { this.store.add({ id: Date.now(), name: `Product ${this.store.items().length + 1}` }); }
}

// Ex43 – Signal store with plugins concept
type Plugin<T> = (store: { state: ReturnType<typeof signal<T>> }) => void;

function withLogging<T>(label: string): Plugin<T> {
  return ({ state }) => {
    effect(() => console.log(`[${label}]`, state()));
  };
}

@Component({
  selector: 'ex-43', standalone: true, template: `
    <h4>Ex43 – Signal Store with Plugins Concept</h4>
    <p>State: {{ state() }}</p>
    <button (click)="state.update(s => s + 1)">+</button>`
})
export class Ex43 {
  state = signal(0);
  constructor() { withLogging<number>('Ex43')({ state: this.state as any }); }
}

// Ex44 – Zoneless signal component
@Component({
  selector: 'ex-44', standalone: true,
  template: `
    <h4>Ex44 – Zoneless Signal Component</h4>
    <p>Count: {{ count() }}</p>
    <button (click)="count.update(c => c + 1)">+</button>
    <small>(Works without Zone.js via signals)</small>`
})
export class Ex44 {
  count = signal(0);
}

// Ex45 – Signal-based finite state machine
type FSMState = 'idle' | 'loading' | 'success' | 'error';
type FSMEvent = 'fetch' | 'resolve' | 'reject' | 'reset';

const fsm45Transitions: Record<FSMState, Partial<Record<FSMEvent, FSMState>>> = {
  idle: { fetch: 'loading' },
  loading: { resolve: 'success', reject: 'error' },
  success: { reset: 'idle', fetch: 'loading' },
  error: { reset: 'idle', fetch: 'loading' }
};

@Component({
  selector: 'ex-45', standalone: true, template: `
    <h4>Ex45 – Signal-based Finite State Machine</h4>
    <p>State: <strong>{{ fsmState() }}</strong></p>
    <button (click)="send('fetch')">Fetch</button>
    <button (click)="send('resolve')">Resolve</button>
    <button (click)="send('reject')">Reject</button>
    <button (click)="send('reset')">Reset</button>`
})
export class Ex45 {
  fsmState = signal<FSMState>('idle');
  send(event: FSMEvent) {
    const next = fsm45Transitions[this.fsmState()][event];
    if (next) this.fsmState.set(next);
  }
}

// Ex46 – Signal with WebSocket
@Component({
  selector: 'ex-46', standalone: true, template: `
    <h4>Ex46 – Signal with WebSocket</h4>
    <p>Status: {{ status() }}</p>
    <p>Messages: {{ messages().length }}</p>
    <button (click)="connect()">Connect (simulated)</button>
    <button (click)="disconnect()">Disconnect</button>`
})
export class Ex46 implements OnDestroy {
  status = signal('disconnected');
  messages = signal<string[]>([]);
  private ws: WebSocket | null = null;
  connect() {
    this.status.set('connected (simulated)');
    const id = setInterval(() => {
      this.messages.update(m => [...m.slice(-9), `msg-${Date.now()}`]);
    }, 1000);
    (this as any)._id = id;
  }
  disconnect() {
    clearInterval((this as any)._id);
    this.status.set('disconnected');
  }
  ngOnDestroy() { this.disconnect(); }
}

// Ex47 – Signal store undo/redo stack
@Component({
  selector: 'ex-47', standalone: true, template: `
    <h4>Ex47 – Signal Store Undo/Redo Stack</h4>
    <p>Current: {{ current() }}</p>
    <button (click)="push(current() + 1)">+1</button>
    <button (click)="undo()" [disabled]="past().length === 0">Undo</button>
    <button (click)="redo()" [disabled]="future().length === 0">Redo</button>`
})
export class Ex47 {
  past = signal<number[]>([]);
  present = signal(0);
  future = signal<number[]>([]);
  current = this.present.asReadonly();
  push(val: number) {
    this.past.update(p => [...p, this.present()]);
    this.present.set(val);
    this.future.set([]);
  }
  undo() {
    if (!this.past().length) return;
    this.future.update(f => [this.present(), ...f]);
    const prev = this.past()[this.past().length - 1];
    this.past.update(p => p.slice(0, -1));
    this.present.set(prev);
  }
  redo() {
    if (!this.future().length) return;
    this.past.update(p => [...p, this.present()]);
    const next = this.future()[0];
    this.future.update(f => f.slice(1));
    this.present.set(next);
  }
}

// Ex48 – Full signal store app
@Injectable({ providedIn: 'root' })
export class AppStore48 {
  private _users = signal<{ id: number; name: string }[]>([]);
  private _selected = signal<number | null>(null);
  readonly users = this._users.asReadonly();
  readonly selected = computed(() => this._users().find(u => u.id === this._selected()) ?? null);
  addUser(name: string) { this._users.update(u => [...u, { id: Date.now(), name }]); }
  selectUser(id: number) { this._selected.set(id); }
  removeUser(id: number) { this._users.update(u => u.filter(x => x.id !== id)); }
}

@Component({
  selector: 'ex-48', standalone: true, template: `
    <h4>Ex48 – Full Signal Store App</h4>
    <p>Selected: {{ store.selected()?.name ?? 'none' }}</p>
    @for (u of store.users(); track u.id) {
      <p (click)="store.selectUser(u.id)" style="cursor:pointer">
        {{ u.name }} <button (click)="store.removeUser(u.id)">del</button>
      </p>
    }
    <button (click)="store.addUser('User ' + store.users().length)">Add User</button>`
})
export class Ex48 {
  store = inject(AppStore48);
}

// Ex49 – linkedSignal with reset pattern
@Component({
  selector: 'ex-49', standalone: true, template: `
    <h4>Ex49 – linkedSignal Reset Pattern</h4>
    <p>Category: {{ category() }}</p>
    <p>Item (resets on category change): {{ item() }}</p>
    <button (click)="category.set('A')">Cat A</button>
    <button (click)="category.set('B')">Cat B</button>
    <button (click)="item.set('custom')">Override Item</button>`
})
export class Ex49 {
  category = signal('A');
  item = linkedSignal(() => `${this.category()}-default`);
}

// Ex50 – Signal store with real-time computed dashboard
@Injectable({ providedIn: 'root' })
export class DashboardStore50 {
  orders = signal<{ id: number; amount: number; status: string }[]>([]);
  revenue = computed(() => this.orders().filter(o => o.status === 'paid').reduce((s, o) => s + o.amount, 0));
  pending = computed(() => this.orders().filter(o => o.status === 'pending').length);
  addOrder(amount: number, status: string) {
    this.orders.update(o => [...o, { id: Date.now(), amount, status }]);
  }
}

@Component({
  selector: 'ex-50', standalone: true, template: `
    <h4>Ex50 – Signal Store Real-Time Dashboard</h4>
    <p>Revenue: ${{ store.revenue() }} | Pending: {{ store.pending() }}</p>
    <button (click)="store.addOrder(100, 'paid')">Add Paid $100</button>
    <button (click)="store.addOrder(50, 'pending')">Add Pending $50</button>`
})
export class Ex50 {
  store = inject(DashboardStore50);
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
    <h2>Phase 7 – Signals State Management</h2>
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
