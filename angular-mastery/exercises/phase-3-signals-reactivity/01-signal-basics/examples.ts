import {
  Component, signal, computed, effect, untracked,
  inject, DestroyRef, input, model, OnInit,
  ChangeDetectionStrategy, Injectable
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

// ── Ex01 – signal() creation & reading ─────────────────────────────────────
@Component({
  selector: 'ex-01', standalone: true, template: `
    <p>Name: {{ name() }}</p>
    <button (click)="name.set('Angular')">Set to Angular</button>
  `
})
export class Ex01 { name = signal('World'); }

// ── Ex02 – signal.set() ─────────────────────────────────────────────────────
@Component({
  selector: 'ex-02', standalone: true, template: `
    <p>Count: {{ count() }}</p>
    <button (click)="count.set(0)">Reset</button>
    <button (click)="count.set(count() + 1)">Set +1</button>
  `
})
export class Ex02 { count = signal(0); }

// ── Ex03 – signal.update() ──────────────────────────────────────────────────
@Component({
  selector: 'ex-03', standalone: true, template: `
    <p>Value: {{ val() }}</p>
    <button (click)="val.update(v => v * 2)">Double</button>
    <button (click)="val.update(v => v - 1)">-1</button>
  `
})
export class Ex03 { val = signal(5); }

// ── Ex04 – computed() ───────────────────────────────────────────────────────
@Component({
  selector: 'ex-04', standalone: true, template: `
    <p>Price: {{ price() }} | Tax: {{ tax() }} | Total: {{ total() }}</p>
    <button (click)="price.update(p => p + 10)">+10</button>
  `
})
export class Ex04 {
  price = signal(100);
  tax = computed(() => +(this.price() * 0.1).toFixed(2));
  total = computed(() => this.price() + this.tax());
}

// ── Ex05 – effect() ─────────────────────────────────────────────────────────
@Component({
  selector: 'ex-05', standalone: true, template: `
    <p>Theme: {{ theme() }}</p>
    <button (click)="toggle()">Toggle Theme</button>
  `
})
export class Ex05 {
  theme = signal<'light' | 'dark'>('light');
  constructor() {
    effect(() => console.log('[Ex05] theme =>', this.theme()));
  }
  toggle() { this.theme.update(t => t === 'light' ? 'dark' : 'light'); }
}

// ── Ex06 – signal with object ────────────────────────────────────────────────
@Component({
  selector: 'ex-06', standalone: true, template: `
    <p>{{ user().name }} ({{ user().age }})</p>
    <button (click)="birthday()">Birthday</button>
  `
})
export class Ex06 {
  user = signal({ name: 'Alice', age: 30 });
  birthday() { this.user.update(u => ({ ...u, age: u.age + 1 })); }
}

// ── Ex07 – signal with array ─────────────────────────────────────────────────
@Component({
  selector: 'ex-07', standalone: true, imports: [CommonModule], template: `
    @for (item of items(); track item) { <span>{{ item }} </span> }
    <button (click)="add()">Add</button>
  `
})
export class Ex07 {
  items = signal<string[]>(['a', 'b']);
  add() { this.items.update(arr => [...arr, String.fromCharCode(97 + arr.length)]); }
}

// ── Ex08 – signal with boolean ───────────────────────────────────────────────
@Component({
  selector: 'ex-08', standalone: true, template: `
    <p>Visible: {{ visible() }}</p>
    <button (click)="visible.update(v => !v)">Toggle</button>
    @if (visible()) { <span>Hello!</span> }
  `
})
export class Ex08 { visible = signal(true); }

// ── Ex09 – signal counter ────────────────────────────────────────────────────
@Component({
  selector: 'ex-09', standalone: true, template: `
    <button (click)="dec()">−</button>
    <strong> {{ count() }} </strong>
    <button (click)="inc()">+</button>
    <button (click)="reset()">Reset</button>
  `
})
export class Ex09 {
  count = signal(0);
  inc() { this.count.update(c => c + 1); }
  dec() { this.count.update(c => c - 1); }
  reset() { this.count.set(0); }
}

// ── Ex10 – signal toggle ─────────────────────────────────────────────────────
@Component({
  selector: 'ex-10', standalone: true, template: `
    <button (click)="on.update(v => !v)">
      {{ on() ? 'ON' : 'OFF' }}
    </button>
  `
})
export class Ex10 { on = signal(false); }

// ── Ex11 – signal history ────────────────────────────────────────────────────
@Component({
  selector: 'ex-11', standalone: true, imports: [CommonModule], template: `
    <p>Current: {{ current() }}</p>
    <input #inp (keyup.enter)="push(inp.value); inp.value=''" placeholder="Type & Enter">
    <ul>@for (h of history(); track h) { <li>{{ h }}</li> }</ul>
  `
})
export class Ex11 {
  current = signal('');
  history = signal<string[]>([]);
  push(v: string) {
    this.current.set(v);
    this.history.update(h => [v, ...h].slice(0, 5));
  }
}

// ── Ex12 – computed chains ───────────────────────────────────────────────────
@Component({
  selector: 'ex-12', standalone: true, template: `
    <p>Celsius: {{ c() }} | F: {{ f() }} | K: {{ k() }}</p>
    <input type="range" min="-50" max="150" [value]="c()" (input)="c.set(+$any($event.target).value)">
  `
})
export class Ex12 {
  c = signal(0);
  f = computed(() => +(this.c() * 9 / 5 + 32).toFixed(1));
  k = computed(() => +(this.c() + 273.15).toFixed(2));
}

// ── Ex13 – effect with cleanup ───────────────────────────────────────────────
@Component({
  selector: 'ex-13', standalone: true, template: `
    <p>Tick: {{ tick() }}</p>
    <button (click)="active.update(v => !v)">{{ active() ? 'Stop' : 'Start' }}</button>
  `
})
export class Ex13 {
  tick = signal(0);
  active = signal(false);
  constructor() {
    effect((onCleanup) => {
      if (!this.active()) return;
      const id = setInterval(() => this.tick.update(t => t + 1), 1000);
      onCleanup(() => clearInterval(id));
    });
  }
}

// ── Ex14 – untracked() ───────────────────────────────────────────────────────
@Component({
  selector: 'ex-14', standalone: true, template: `
    <p>A: {{ a() }} | B: {{ b() }}</p>
    <button (click)="a.update(v => v + 1)">+A</button>
    <button (click)="b.update(v => v + 1)">+B</button>
    <p>Sum (only tracks A): {{ sum() }}</p>
  `
})
export class Ex14 {
  a = signal(1);
  b = signal(10);
  sum = computed(() => this.a() + untracked(() => this.b()));
}

// ── Ex15 – signal comparison (equal option) ───────────────────────────────────
@Component({
  selector: 'ex-15', standalone: true, template: `
    <p>Renders: {{ renders }}</p>
    <button (click)="set()">Set same value</button>
  `
})
export class Ex15 {
  renders = 0;
  val = signal(42, { equal: (a, b) => a === b });
  result = computed(() => { this.renders++; return this.val() * 2; });
  set() { this.val.set(42); }
}

// ── Ex16 – computed memoization ──────────────────────────────────────────────
@Component({
  selector: 'ex-16', standalone: true, template: `
    <p>Computed runs: {{ runs }}</p>
    <p>Squared: {{ squared() }}</p>
    <button (click)="n.update(v => v + 1)">+1</button>
    <button (click)="trigger.update(v => v + 1)">Trigger (no change)</button>
  `
})
export class Ex16 {
  runs = 0;
  n = signal(4);
  trigger = signal(0);
  squared = computed(() => { this.runs++; return this.n() ** 2; });
}

// ── Ex17 – input() signal API ────────────────────────────────────────────────
@Component({
  selector: 'ex-17-inner', standalone: true, template: `<p>Hello, {{ name() }}!</p>`
})
export class Ex17Inner { name = input.required<string>(); }

@Component({
  selector: 'ex-17', standalone: true, imports: [Ex17Inner], template: `
    <input #inp [value]="val" (input)="val = $any($event.target).value">
    <ex-17-inner [name]="val" />
  `
})
export class Ex17 { val = 'Angular'; }

// ── Ex18 – model() two-way signal ────────────────────────────────────────────
@Component({
  selector: 'ex-18-input', standalone: true, imports: [FormsModule], template: `
    <input [(ngModel)]="value" placeholder="type…">
  `
})
export class Ex18Input { value = model(''); }

@Component({
  selector: 'ex-18', standalone: true, imports: [Ex18Input], template: `
    <ex-18-input [(value)]="text" />
    <p>Parent sees: {{ text() }}</p>
  `
})
export class Ex18 { text = signal('hello'); }

// ── Ex19 – linkedSignal() ────────────────────────────────────────────────────
@Component({
  selector: 'ex-19', standalone: true, imports: [CommonModule], template: `
    <select (change)="category.set($any($event.target).value)">
      @for (c of categories; track c) { <option>{{ c }}</option> }
    </select>
    <p>Default item: {{ defaultItem() }}</p>
    <input [value]="defaultItem()" (input)="defaultItem.set($any($event.target).value)">
  `
})
export class Ex19 {
  categories = ['Fruits', 'Veggies', 'Grains'];
  category = signal('Fruits');
  // linkedSignal resets when category changes, but can be overridden
  defaultItem = signal('');
  constructor() {
    effect(() => {
      const c = this.category();
      this.defaultItem.set(c === 'Fruits' ? 'Apple' : c === 'Veggies' ? 'Carrot' : 'Rice');
    });
  }
}

// ── Ex20 – toSignal() ────────────────────────────────────────────────────────
@Component({
  selector: 'ex-20', standalone: true, template: `
    <p>Tick: {{ tick() }}</p>
  `
})
export class Ex20 {
  tick = toSignal(interval(1000), { initialValue: 0 });
}

// ── Ex21 – toObservable() ────────────────────────────────────────────────────
@Component({
  selector: 'ex-21', standalone: true, imports: [CommonModule], template: `
    <input (input)="query.set($any($event.target).value)" placeholder="search…">
    <p>Observable emitted: {{ latest() }}</p>
  `
})
export class Ex21 {
  query = signal('');
  query$ = toObservable(this.query);
  latest = toSignal(this.query$, { initialValue: '' });
}

// ── Ex22 – signal in service ─────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class CounterService22 {
  count = signal(0);
  inc() { this.count.update(c => c + 1); }
}
@Component({
  selector: 'ex-22', standalone: true, template: `
    <p>Service count: {{ svc.count() }}</p>
    <button (click)="svc.inc()">+1</button>
  `
})
export class Ex22 { svc = inject(CounterService22); }

// ── Ex23 – signal with localStorage ──────────────────────────────────────────
@Component({
  selector: 'ex-23', standalone: true, template: `
    <input [value]="stored()" (input)="save($any($event.target).value)" placeholder="Persisted…">
    <p>Stored: {{ stored() }}</p>
  `
})
export class Ex23 {
  stored = signal(localStorage.getItem('ex23') ?? '');
  save(v: string) { this.stored.set(v); localStorage.setItem('ex23', v); }
}

// ── Ex24 – batch update pattern ──────────────────────────────────────────────
@Component({
  selector: 'ex-24', standalone: true, template: `
    <p>First: {{ first() }} | Last: {{ last() }} | Full: {{ full() }}</p>
    <button (click)="updateBoth()">Update Both</button>
  `
})
export class Ex24 {
  first = signal('Jane');
  last = signal('Doe');
  full = computed(() => `${this.first()} ${this.last()}`);
  updateBoth() {
    // Angular batches signal writes automatically within event handlers
    this.first.set('John');
    this.last.set('Smith');
  }
}

// ── Ex25 – signal-based undo/redo ─────────────────────────────────────────────
@Component({
  selector: 'ex-25', standalone: true, template: `
    <input [value]="text()" (input)="push($any($event.target).value)">
    <button (click)="undo()" [disabled]="past().length === 0">Undo</button>
    <button (click)="redo()" [disabled]="future().length === 0">Redo</button>
    <p>{{ text() }}</p>
  `
})
export class Ex25 {
  text = signal('');
  past = signal<string[]>([]);
  future = signal<string[]>([]);
  push(v: string) {
    this.past.update(p => [...p, this.text()]);
    this.future.set([]);
    this.text.set(v);
  }
  undo() {
    const p = this.past();
    if (!p.length) return;
    this.future.update(f => [this.text(), ...f]);
    this.text.set(p[p.length - 1]);
    this.past.update(arr => arr.slice(0, -1));
  }
  redo() {
    const f = this.future();
    if (!f.length) return;
    this.past.update(p => [...p, this.text()]);
    this.text.set(f[0]);
    this.future.update(arr => arr.slice(1));
  }
}

// ── Ex26 – signal store pattern ──────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class TodoStore {
  private _todos = signal<{ id: number; text: string; done: boolean }[]>([]);
  todos = this._todos.asReadonly();
  done = computed(() => this._todos().filter(t => t.done).length);
  add(text: string) { this._todos.update(ts => [...ts, { id: Date.now(), text, done: false }]); }
  toggle(id: number) { this._todos.update(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t)); }
}
@Component({
  selector: 'ex-26', standalone: true, imports: [CommonModule], template: `
    <input #inp (keyup.enter)="store.add(inp.value); inp.value=''">
    <p>Done: {{ store.done() }} / {{ store.todos().length }}</p>
    @for (t of store.todos(); track t.id) {
      <div (click)="store.toggle(t.id)" [style.text-decoration]="t.done ? 'line-through' : ''">
        {{ t.text }}
      </div>
    }
  `
})
export class Ex26 { store = inject(TodoStore); }

// ── Ex27 – resource() pattern (simulated) ────────────────────────────────────
@Component({
  selector: 'ex-27', standalone: true, template: `
    <p>User ID: {{ userId() }}</p>
    <p>Name: {{ userName() }}</p>
    <button (click)="userId.update(id => (id % 3) + 1)">Next User</button>
  `
})
export class Ex27 {
  userId = signal(1);
  userName = computed(() => ['Alice', 'Bob', 'Carol'][this.userId() - 1]);
}

// ── Ex28 – signal with @for track ────────────────────────────────────────────
@Component({
  selector: 'ex-28', standalone: true, template: `
    @for (item of items(); track item.id) {
      <div>{{ item.id }}: {{ item.label }}</div>
    }
    <button (click)="shuffle()">Shuffle</button>
  `
})
export class Ex28 {
  items = signal([
    { id: 1, label: 'Alpha' }, { id: 2, label: 'Beta' }, { id: 3, label: 'Gamma' }
  ]);
  shuffle() { this.items.update(arr => [...arr].sort(() => Math.random() - 0.5)); }
}

// ── Ex29 – signal in effect writing (allowSignalWrites) ───────────────────────
@Component({
  selector: 'ex-29', standalone: true, template: `
    <p>Source: {{ source() }} | Mirror: {{ mirror() }}</p>
    <button (click)="source.update(v => v + 1)">+1</button>
  `
})
export class Ex29 {
  source = signal(0);
  mirror = signal(0);
  constructor() {
    effect(() => {
      this.mirror.set(this.source() * 10);
    }, { allowSignalWrites: true });
  }
}

// ── Ex30 – cross-signal dependencies ─────────────────────────────────────────
@Component({
  selector: 'ex-30', standalone: true, template: `
    <input type="range" min="1" max="10" [value]="qty()" (input)="qty.set(+$any($event.target).value)">
    <input type="number" [value]="price()" (input)="price.set(+$any($event.target).value)">
    <p>Qty: {{ qty() }} × Price: {{ price() }} = Total: {{ total() }}</p>
  `
})
export class Ex30 {
  qty = signal(1);
  price = signal(9.99);
  total = computed(() => +(this.qty() * this.price()).toFixed(2));
}

// ── Ex31 – signal debugging ───────────────────────────────────────────────────
@Component({
  selector: 'ex-31', standalone: true, template: `
    <p>Value: {{ val() }}</p>
    <button (click)="val.update(v => v + 1)">Increment</button>
  `
})
export class Ex31 {
  val = signal(0);
  constructor() {
    effect(() => {
      console.log('[Ex31 debug] val changed to', this.val());
    });
  }
}

// ── Ex32 – signal type inference ─────────────────────────────────────────────
@Component({
  selector: 'ex-32', standalone: true, template: `
    <p>Status: {{ status() }}</p>
    <button (click)="status.set('loading')">Loading</button>
    <button (click)="status.set('success')">Success</button>
    <button (click)="status.set('error')">Error</button>
  `
})
export class Ex32 {
  status = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
}

// ── Ex33 – readonly signal ────────────────────────────────────────────────────
@Component({
  selector: 'ex-33', standalone: true, template: `
    <p>Read-only value: {{ readonlyCount() }}</p>
    <button (click)="inc()">Inc (via method)</button>
  `
})
export class Ex33 {
  private _count = signal(0);
  readonlyCount = this._count.asReadonly();
  inc() { this._count.update(c => c + 1); }
}

// ── Ex34 – signal with generics ───────────────────────────────────────────────
@Component({
  selector: 'ex-34', standalone: true, imports: [CommonModule], template: `
    <p>Stack: {{ stack() | json }}</p>
    <button (click)="push(Date.now())">Push</button>
    <button (click)="pop()">Pop</button>
  `
})
export class Ex34 {
  stack = signal<number[]>([]);
  push(v: number) { this.stack.update(s => [...s, v]); }
  pop() { this.stack.update(s => s.slice(0, -1)); }
}

// ── Ex35 – signal array push pattern ─────────────────────────────────────────
@Component({
  selector: 'ex-35', standalone: true, imports: [CommonModule], template: `
    @for (msg of messages(); track msg) { <p>{{ msg }}</p> }
    <button (click)="addMsg()">Add Message</button>
  `
})
export class Ex35 {
  messages = signal<string[]>([]);
  addMsg() {
    const ts = new Date().toLocaleTimeString();
    this.messages.update(arr => [...arr, `Message at ${ts}`]);
  }
}

// ── Ex36 – signal object spread update ───────────────────────────────────────
@Component({
  selector: 'ex-36', standalone: true, imports: [CommonModule], template: `
    <p>{{ profile() | json }}</p>
    <button (click)="updateEmail()">Change Email</button>
    <button (click)="updateCity()">Change City</button>
  `
})
export class Ex36 {
  profile = signal({ name: 'Alice', email: 'a@x.com', city: 'NYC' });
  updateEmail() { this.profile.update(p => ({ ...p, email: 'new@x.com' })); }
  updateCity() { this.profile.update(p => ({ ...p, city: 'LA' })); }
}

// ── Ex37 – signal with DestroyRef effect cleanup ──────────────────────────────
@Component({
  selector: 'ex-37', standalone: true, template: `
    <p>Tick: {{ tick() }}</p>
  `
})
export class Ex37 {
  tick = signal(0);
  constructor() {
    const destroyRef = inject(DestroyRef);
    const id = setInterval(() => this.tick.update(t => t + 1), 1000);
    destroyRef.onDestroy(() => clearInterval(id));
  }
}

// ── Ex38 – effect allowSignalWrites advanced ─────────────────────────────────
@Component({
  selector: 'ex-38', standalone: true, template: `
    <p>Input: {{ input() }} | Uppercase: {{ upper() }}</p>
    <input (input)="input.set($any($event.target).value)">
  `
})
export class Ex38 {
  input = signal('');
  upper = signal('');
  constructor() {
    effect(() => {
      this.upper.set(this.input().toUpperCase());
    }, { allowSignalWrites: true });
  }
}

// ── Ex39 – computed with conditional logic ────────────────────────────────────
@Component({
  selector: 'ex-39', standalone: true, template: `
    <p>Score: {{ score() }} → Grade: {{ grade() }}</p>
    <input type="range" min="0" max="100" [value]="score()" (input)="score.set(+$any($event.target).value)">
  `
})
export class Ex39 {
  score = signal(75);
  grade = computed(() => {
    const s = this.score();
    if (s >= 90) return 'A';
    if (s >= 80) return 'B';
    if (s >= 70) return 'C';
    return 'F';
  });
}

// ── Ex40 – multiple signals combined in computed ──────────────────────────────
@Component({
  selector: 'ex-40', standalone: true, template: `
    <p>{{ summary() }}</p>
    <button (click)="items.update(n => n + 1)">+Item</button>
    <button (click)="price.update(p => p + 5)">+Price</button>
  `
})
export class Ex40 {
  items = signal(2);
  price = signal(10);
  discount = signal(0.1);
  summary = computed(() => {
    const raw = this.items() * this.price();
    const final = raw * (1 - this.discount());
    return `${this.items()} items × $${this.price()} − ${this.discount() * 100}% = $${final.toFixed(2)}`;
  });
}

// ── Ex41 – signal-driven tab UI ───────────────────────────────────────────────
@Component({
  selector: 'ex-41', standalone: true, template: `
    @for (tab of tabs; track tab) {
      <button (click)="active.set(tab)" [style.font-weight]="active() === tab ? 'bold' : 'normal'">
        {{ tab }}
      </button>
    }
    <p>Content: {{ active() }} panel</p>
  `
})
export class Ex41 {
  tabs = ['Home', 'Profile', 'Settings'];
  active = signal('Home');
}

// ── Ex42 – signal-driven accordion ───────────────────────────────────────────
@Component({
  selector: 'ex-42', standalone: true, template: `
    @for (item of items; track item.title) {
      <div>
        <strong (click)="toggle(item.title)" style="cursor:pointer">{{ item.title }}</strong>
        @if (open() === item.title) { <p>{{ item.body }}</p> }
      </div>
    }
  `
})
export class Ex42 {
  open = signal('');
  items = [
    { title: 'Section 1', body: 'Content A' },
    { title: 'Section 2', body: 'Content B' },
    { title: 'Section 3', body: 'Content C' }
  ];
  toggle(t: string) { this.open.update(o => o === t ? '' : t); }
}

// ── Ex43 – signal pagination ──────────────────────────────────────────────────
@Component({
  selector: 'ex-43', standalone: true, imports: [CommonModule], template: `
    <p>Page {{ page() }} of {{ totalPages() }}</p>
    @for (item of pageItems(); track item) { <div>{{ item }}</div> }
    <button (click)="page.update(p => Math.max(1, p - 1))">Prev</button>
    <button (click)="page.update(p => Math.min(totalPages(), p + 1))">Next</button>
  `
})
export class Ex43 {
  all = Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`);
  page = signal(1);
  pageSize = 4;
  totalPages = computed(() => Math.ceil(this.all.length / this.pageSize));
  pageItems = computed(() => this.all.slice((this.page() - 1) * this.pageSize, this.page() * this.pageSize));
}

// ── Ex44 – signal-based search filter ────────────────────────────────────────
@Component({
  selector: 'ex-44', standalone: true, imports: [CommonModule], template: `
    <input (input)="query.set($any($event.target).value)" placeholder="Search…">
    @for (item of filtered(); track item) { <div>{{ item }}</div> }
  `
})
export class Ex44 {
  query = signal('');
  data = ['Angular', 'React', 'Vue', 'Svelte', 'Solid', 'Qwik'];
  filtered = computed(() => this.data.filter(d => d.toLowerCase().includes(this.query().toLowerCase())));
}

// ── Ex45 – signal notification queue ─────────────────────────────────────────
@Component({
  selector: 'ex-45', standalone: true, imports: [CommonModule], template: `
    @for (n of notifications(); track n.id) {
      <div style="background:#eef; padding:4px; margin:2px">
        {{ n.msg }} <button (click)="dismiss(n.id)">×</button>
      </div>
    }
    <button (click)="add()">Add Notification</button>
  `
})
export class Ex45 {
  notifications = signal<{ id: number; msg: string }[]>([]);
  add() {
    const id = Date.now();
    this.notifications.update(ns => [...ns, { id, msg: `Notification ${id}` }]);
  }
  dismiss(id: number) {
    this.notifications.update(ns => ns.filter(n => n.id !== id));
  }
}

// ── Ex46 – signal stepper / wizard ───────────────────────────────────────────
@Component({
  selector: 'ex-46', standalone: true, template: `
    <p>Step {{ step() }} of {{ steps.length }}: {{ steps[step() - 1] }}</p>
    <button (click)="step.update(s => Math.max(1, s - 1))">Back</button>
    <button (click)="step.update(s => Math.min(steps.length, s + 1))">Next</button>
  `
})
export class Ex46 {
  steps = ['Personal Info', 'Address', 'Payment', 'Review'];
  step = signal(1);
}

// ── Ex47 – signal with derived boolean flags ──────────────────────────────────
@Component({
  selector: 'ex-47', standalone: true, template: `
    <p>Age: {{ age() }}</p>
    <p>Minor: {{ isMinor() }} | Senior: {{ isSenior() }}</p>
    <input type="range" min="0" max="100" [value]="age()" (input)="age.set(+$any($event.target).value)">
  `
})
export class Ex47 {
  age = signal(25);
  isMinor = computed(() => this.age() < 18);
  isSenior = computed(() => this.age() >= 65);
}

// ── Ex48 – signal multi-select ────────────────────────────────────────────────
@Component({
  selector: 'ex-48', standalone: true, imports: [CommonModule], template: `
    @for (opt of options; track opt) {
      <label>
        <input type="checkbox" [checked]="selected().has(opt)" (change)="toggle(opt)"> {{ opt }}
      </label>
    }
    <p>Selected: {{ Array.from(selected()).join(', ') }}</p>
  `
})
export class Ex48 {
  Array = Array;
  options = ['TypeScript', 'Angular', 'RxJS', 'NgRx', 'Signals'];
  selected = signal<Set<string>>(new Set());
  toggle(opt: string) {
    this.selected.update(s => {
      const copy = new Set(s);
      copy.has(opt) ? copy.delete(opt) : copy.add(opt);
      return copy;
    });
  }
}

// ── Ex49 – signal-based loading state ────────────────────────────────────────
@Component({
  selector: 'ex-49', standalone: true, template: `
    <button (click)="load()" [disabled]="loading()">
      {{ loading() ? 'Loading…' : 'Fetch Data' }}
    </button>
    @if (data()) { <p>Data: {{ data() }}</p> }
    @if (error()) { <p style="color:red">{{ error() }}</p> }
  `
})
export class Ex49 {
  loading = signal(false);
  data = signal('');
  error = signal('');
  load() {
    this.loading.set(true);
    this.data.set('');
    this.error.set('');
    setTimeout(() => {
      this.loading.set(false);
      this.data.set('Fetched at ' + new Date().toLocaleTimeString());
    }, 1200);
  }
}

// ── Ex50 – signal reactive form sync ─────────────────────────────────────────
@Component({
  selector: 'ex-50', standalone: true, imports: [CommonModule], template: `
    <p>Signal value: {{ signalVal() }}</p>
    <button (click)="signalVal.set('reset')">Reset Signal</button>
    <button (click)="push()">Push from Signal</button>
    <p>Log: {{ log() | json }}</p>
  `
})
export class Ex50 {
  signalVal = signal('initial');
  log = signal<string[]>([]);
  constructor() {
    effect(() => {
      this.log.update(l => [...l, `changed: ${this.signalVal()}`]);
    }, { allowSignalWrites: true });
  }
  push() { this.signalVal.set('pushed at ' + Date.now()); }
}

// ── AppComponent ──────────────────────────────────────────────────────────────
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
    <div style="font-family:sans-serif;max-width:800px;margin:0 auto;padding:20px">
      <h1>Phase 3 – Signal Basics Examples</h1>

      <h4>Ex01 – signal() creation & reading</h4><ex-01 /><hr />
      <h4>Ex02 – signal.set()</h4><ex-02 /><hr />
      <h4>Ex03 – signal.update()</h4><ex-03 /><hr />
      <h4>Ex04 – computed()</h4><ex-04 /><hr />
      <h4>Ex05 – effect()</h4><ex-05 /><hr />
      <h4>Ex06 – signal with object</h4><ex-06 /><hr />
      <h4>Ex07 – signal with array</h4><ex-07 /><hr />
      <h4>Ex08 – signal with boolean</h4><ex-08 /><hr />
      <h4>Ex09 – signal counter</h4><ex-09 /><hr />
      <h4>Ex10 – signal toggle</h4><ex-10 /><hr />
      <h4>Ex11 – signal history</h4><ex-11 /><hr />
      <h4>Ex12 – computed chains</h4><ex-12 /><hr />
      <h4>Ex13 – effect with cleanup</h4><ex-13 /><hr />
      <h4>Ex14 – untracked()</h4><ex-14 /><hr />
      <h4>Ex15 – signal comparison (equal option)</h4><ex-15 /><hr />
      <h4>Ex16 – computed memoization</h4><ex-16 /><hr />
      <h4>Ex17 – input() signal API</h4><ex-17 /><hr />
      <h4>Ex18 – model() two-way signal</h4><ex-18 /><hr />
      <h4>Ex19 – linkedSignal()</h4><ex-19 /><hr />
      <h4>Ex20 – toSignal()</h4><ex-20 /><hr />
      <h4>Ex21 – toObservable()</h4><ex-21 /><hr />
      <h4>Ex22 – signal in service</h4><ex-22 /><hr />
      <h4>Ex23 – signal with localStorage</h4><ex-23 /><hr />
      <h4>Ex24 – batch update pattern</h4><ex-24 /><hr />
      <h4>Ex25 – signal-based undo/redo</h4><ex-25 /><hr />
      <h4>Ex26 – signal store pattern</h4><ex-26 /><hr />
      <h4>Ex27 – resource() pattern</h4><ex-27 /><hr />
      <h4>Ex28 – signal with @for track</h4><ex-28 /><hr />
      <h4>Ex29 – signal in effect writing</h4><ex-29 /><hr />
      <h4>Ex30 – cross-signal dependencies</h4><ex-30 /><hr />
      <h4>Ex31 – signal debugging</h4><ex-31 /><hr />
      <h4>Ex32 – signal type inference</h4><ex-32 /><hr />
      <h4>Ex33 – readonly signal</h4><ex-33 /><hr />
      <h4>Ex34 – signal with generics</h4><ex-34 /><hr />
      <h4>Ex35 – signal array push pattern</h4><ex-35 /><hr />
      <h4>Ex36 – signal object spread update</h4><ex-36 /><hr />
      <h4>Ex37 – signal with DestroyRef cleanup</h4><ex-37 /><hr />
      <h4>Ex38 – effect allowSignalWrites advanced</h4><ex-38 /><hr />
      <h4>Ex39 – computed with conditional logic</h4><ex-39 /><hr />
      <h4>Ex40 – multiple signals in computed</h4><ex-40 /><hr />
      <h4>Ex41 – signal-driven tab UI</h4><ex-41 /><hr />
      <h4>Ex42 – signal-driven accordion</h4><ex-42 /><hr />
      <h4>Ex43 – signal pagination</h4><ex-43 /><hr />
      <h4>Ex44 – signal-based search filter</h4><ex-44 /><hr />
      <h4>Ex45 – signal notification queue</h4><ex-45 /><hr />
      <h4>Ex46 – signal stepper / wizard</h4><ex-46 /><hr />
      <h4>Ex47 – signal derived boolean flags</h4><ex-47 /><hr />
      <h4>Ex48 – signal multi-select</h4><ex-48 /><hr />
      <h4>Ex49 – signal-based loading state</h4><ex-49 /><hr />
      <h4>Ex50 – signal reactive form sync</h4><ex-50 /><hr />
    </div>
  `
})
export class AppComponent {}
