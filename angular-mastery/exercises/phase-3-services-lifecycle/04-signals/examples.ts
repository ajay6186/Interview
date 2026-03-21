import {
  Component, Injectable, inject, signal, computed, effect, untracked,
  OnInit, DestroyRef, input, output, model, linkedSignal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal, toObservable } from '@angular/core/rxjs-interop';
import { interval, Subject, BehaviorSubject } from 'rxjs';
import { map, debounceTime } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';

// ============================================================
// Examples 3.4 — Signals (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ────────────────────────────────────────────

// 1. signal() basics — create and read
@Component({ selector: 'ex-01', standalone: true, template: `<p>Name: {{ name() }}</p>` })
class Ex01 { name = signal('Angular'); }

// 2. Reading signal with ()
@Component({ selector: 'ex-02', standalone: true, template: `<p>{{ count() }}</p>` })
class Ex02 { count = signal(42); }

// 3. Updating with .set()
@Component({ selector: 'ex-03', standalone: true, template: `<p>{{ val() }}</p><button (click)="val.set(99)">Set 99</button>` })
class Ex03 { val = signal(0); }

// 4. Updating with .update()
@Component({ selector: 'ex-04', standalone: true, template: `<p>{{ n() }}</p><button (click)="n.update(v => v + 1)">+1</button>` })
class Ex04 { n = signal(0); }

// 5. .update() for objects — immutable update
@Component({
  selector: 'ex-05', standalone: true,
  template: `<p>{{ user().name }} ({{ user().age }})</p><button (click)="birthday()">Birthday</button>`
})
class Ex05 {
  user = signal({ name: 'Alice', age: 30 });
  birthday() { this.user.update(u => ({ ...u, age: u.age + 1 })); }
}

// 6. computed() basics
@Component({ selector: 'ex-06', standalone: true, template: `<p>{{ doubled() }}</p><button (click)="n.update(v => v + 1)">+1</button>` })
class Ex06 { n = signal(5); doubled = computed(() => this.n() * 2); }

// 7. computed with math
@Component({ selector: 'ex-07', standalone: true, template: `<p>Area: {{ area() }}cm²</p>` })
class Ex07 { w = signal(10); h = signal(5); area = computed(() => this.w() * this.h()); }

// 8. computed with string
@Component({ selector: 'ex-08', standalone: true, template: `<p>{{ fullName() }}</p>` })
class Ex08 {
  first = signal('Jane'); last = signal('Doe');
  fullName = computed(() => `${this.first()} ${this.last()}`);
}

// 9. computed with boolean
@Component({ selector: 'ex-09', standalone: true, template: `<p>{{ canSubmit() ? 'Ready' : 'Fill in name' }}</p>` })
class Ex09 { name = signal(''); canSubmit = computed(() => this.name().trim().length > 0); }

// 10. computed with array
@Component({ selector: 'ex-10', standalone: true, template: `<p>Total: {{ total() }} | Count: {{ count() }}</p>` })
class Ex10 {
  prices = signal([10, 20, 30]);
  total = computed(() => this.prices().reduce((s, p) => s + p, 0));
  count = computed(() => this.prices().length);
}

// 11. signal boolean — toggle
@Component({ selector: 'ex-11', standalone: true, template: `<p>{{ flag() ? 'ON' : 'OFF' }}</p><button (click)="flag.update(b => !b)">Toggle</button>` })
class Ex11 { flag = signal(false); }

// 12. signal with null / undefined handling
@Component({ selector: 'ex-12', standalone: true, template: `<p>{{ label() ?? 'no label' }}</p><button (click)="label.set(null)">Clear</button><button (click)="label.set('Active')">Set</button>` })
class Ex12 { label = signal<string | null>('Active'); }

// 13. signal with array — push pattern
@Component({
  selector: 'ex-13', standalone: true,
  template: `
    <ul>@for (item of items(); track item) { <li>{{ item }}</li> }</ul>
    <button (click)="add()">Add</button>
  `
})
class Ex13 {
  items = signal<string[]>([]);
  add() { this.items.update(arr => [...arr, `Item ${arr.length + 1}`]); }
}

// ─── INTERMEDIATE (14–26) ─────────────────────────────────────

// 14. effect() basics — logs on change
@Component({ selector: 'ex-14', standalone: true, template: `<p>{{ count() }}</p><button (click)="count.update(n => n + 1)">+1</button>` })
class Ex14 {
  count = signal(0);
  constructor() { effect(() => { console.log('Ex14 effect: count =', this.count()); }); }
}

// 15. effect with cleanup
@Component({ selector: 'ex-15', standalone: true, template: `<p>Tick: {{ tick() }}</p><button (click)="stop()">Stop</button>` })
class Ex15 {
  tick = signal(0);
  private stopped = signal(false);
  constructor() {
    effect(onCleanup => {
      if (this.stopped()) return;
      const id = setInterval(() => this.tick.update(n => n + 1), 1000);
      onCleanup(() => clearInterval(id));
    }, { allowSignalWrites: true });
  }
  stop() { this.stopped.set(true); }
}

// 16. effect logging — debug pattern
@Component({ selector: 'ex-16', standalone: true, template: `<input [value]="search()" (input)="search.set($any($event).target.value)" placeholder="Search..." /><p>Query: {{ search() }}</p>` })
class Ex16 {
  search = signal('');
  constructor() { effect(() => { console.log('Ex16: search query =', this.search()); }); }
}

// 17. effect syncing to localStorage
@Component({
  selector: 'ex-17', standalone: true,
  template: `<p>Theme: {{ theme() }}</p><button (click)="theme.set('dark')">Dark</button><button (click)="theme.set('light')">Light</button>`
})
class Ex17 {
  theme = signal(localStorage.getItem('ex17-theme') ?? 'light');
  constructor() { effect(() => { localStorage.setItem('ex17-theme', this.theme()); }); }
}

// 18. nested computed — a → b → c
@Component({ selector: 'ex-18', standalone: true, template: `<p>Base: {{ base() }} | Doubled: {{ doubled() }} | Quadrupled: {{ quad() }}</p><button (click)="base.update(n => n + 1)">+1</button>` })
class Ex18 {
  base = signal(1);
  doubled = computed(() => this.base() * 2);
  quad = computed(() => this.doubled() * 2);
}

// 19. computed from multiple signals
@Component({
  selector: 'ex-19', standalone: true,
  template: `
    <p>{{ summary() }}</p>
    <button (click)="qty.update(n => n + 1)">+Qty</button>
    <button (click)="price.update(n => n + 5)">+Price</button>
  `
})
class Ex19 {
  qty = signal(2); price = signal(25);
  summary = computed(() => `${this.qty()} × $${this.price()} = $${this.qty() * this.price()}`);
}

// 20. signal with @if
@Component({
  selector: 'ex-20', standalone: true,
  template: `
    @if (loggedIn()) { <p>Welcome back!</p> }
    @else { <p>Please log in</p> }
    <button (click)="loggedIn.update(b => !b)">Toggle Auth</button>
  `
})
class Ex20 { loggedIn = signal(false); }

// 21. signal with @for
@Component({
  selector: 'ex-21', standalone: true,
  template: `
    <ul>@for (tag of tags(); track tag) { <li>{{ tag }}</li> }</ul>
    <button (click)="add()">Add Tag</button>
    <button (click)="clear()">Clear</button>
  `
})
class Ex21 {
  tags = signal(['Angular', 'TypeScript']);
  add() { this.tags.update(t => [...t, `Tag${t.length + 1}`]); }
  clear() { this.tags.set([]); }
}

// 22. signal array add/remove
@Component({
  selector: 'ex-22', standalone: true,
  template: `
    <ul>@for (item of items(); track item.id) {
      <li>{{ item.name }} <button (click)="remove(item.id)">x</button>
    </li> }</ul>
    <button (click)="add()">Add</button>
  `
})
class Ex22 {
  private nextId = 1;
  items = signal<{ id: number; name: string }[]>([]);
  add() { this.items.update(arr => [...arr, { id: this.nextId++, name: `Item ${this.nextId - 1}` }]); }
  remove(id: number) { this.items.update(arr => arr.filter(i => i.id !== id)); }
}

// 23. signal object update — partial
@Component({
  selector: 'ex-23', standalone: true,
  template: `<p>{{ profile().username }} | {{ profile().email }}</p><button (click)="updateEmail()">Change Email</button>`
})
class Ex23 {
  profile = signal({ username: 'alice', email: 'alice@example.com', role: 'admin' });
  updateEmail() { this.profile.update(p => ({ ...p, email: 'new@example.com' })); }
}

// 24. signal counter with history
@Component({
  selector: 'ex-24', standalone: true,
  template: `
    <p>Current: {{ current() }}</p>
    <p>History: {{ history().join(' → ') }}</p>
    <button (click)="step(1)">+1</button>
    <button (click)="step(-1)">-1</button>
  `
})
class Ex24 {
  current = signal(0);
  history = signal<number[]>([0]);
  step(n: number) {
    this.current.update(v => v + n);
    this.history.update(h => [...h, this.current()]);
  }
}

// 25. computed as derived list
@Component({
  selector: 'ex-25', standalone: true,
  template: `
    <input [value]="filter()" (input)="filter.set($any($event).target.value)" placeholder="Filter..." />
    <ul>@for (item of filtered(); track item) { <li>{{ item }}</li> }</ul>
  `
})
class Ex25 {
  items = signal(['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry', 'Fig']);
  filter = signal('');
  filtered = computed(() => {
    const q = this.filter().toLowerCase();
    return q ? this.items().filter(i => i.toLowerCase().includes(q)) : this.items();
  });
}

// 26. signal with @switch
@Component({
  selector: 'ex-26', standalone: true,
  template: `
    @switch (status()) {
      @case ('idle') { <p>Ready</p> }
      @case ('loading') { <p>Loading...</p> }
      @case ('success') { <p style="color:green">Done!</p> }
      @case ('error') { <p style="color:red">Failed</p> }
    }
    <button (click)="next()">Next State</button>
  `
})
class Ex26 {
  private states: ('idle' | 'loading' | 'success' | 'error')[] = ['idle', 'loading', 'success', 'error'];
  private idx = signal(0);
  status = computed(() => this.states[this.idx() % this.states.length]);
  next() { this.idx.update(n => n + 1); }
}

// ─── NESTED (27–38) ───────────────────────────────────────────

// 27. Multiple components sharing service signals
@Injectable({ providedIn: 'root' })
class SharedCounterService { count = signal(0); inc() { this.count.update(n => n + 1); } reset() { this.count.set(0); } }

@Component({ selector: 'ex-27-a', standalone: true, template: `<p>Viewer A: {{ svc.count() }}</p>` })
class Ex27A { svc = inject(SharedCounterService); }

@Component({ selector: 'ex-27-b', standalone: true, template: `<button (click)="svc.inc()">+1</button><button (click)="svc.reset()">Reset</button>` })
class Ex27B { svc = inject(SharedCounterService); }

@Component({ selector: 'ex-27', standalone: true, imports: [Ex27A, Ex27B], template: `<ex-27-a /><ex-27-b />` })
class Ex27 {}

// 28. computed chains (a → b → c → d)
@Component({
  selector: 'ex-28', standalone: true,
  template: `<p>{{ a() }} → {{ b() }} → {{ c() }} → {{ d() }}</p><button (click)="a.update(n => n + 1)">+1 to a</button>`
})
class Ex28 {
  a = signal(1);
  b = computed(() => this.a() * 2);
  c = computed(() => this.b() + 10);
  d = computed(() => `Result: ${this.c()}`);
}

// 29. effect triggering via signal change
@Component({
  selector: 'ex-29', standalone: true,
  template: `<p>Count: {{ count() }} | Log: {{ log() }}</p><button (click)="count.update(n => n + 1)">+1</button>`
})
class Ex29 {
  count = signal(0);
  log = signal('');
  constructor() {
    effect(() => { this.log.set(`Count changed to ${this.count()}`); }, { allowSignalWrites: true });
  }
}

// 30. signal input() — new API
@Component({ selector: 'ex-30-child', standalone: true, template: `<p>Received: {{ title() }}</p>` })
class Ex30Child { title = input<string>('default'); }

@Component({
  selector: 'ex-30', standalone: true, imports: [Ex30Child],
  template: `<ex-30-child [title]="value()" /><button (click)="value.set('Updated')">Change</button><button (click)="value.set('Hello')">Reset</button>`
})
class Ex30 { value = signal('Hello'); }

// 31. signal output() — new API
@Component({
  selector: 'ex-31-child', standalone: true,
  template: `<button (click)="clicked.emit('from child')">Emit</button>`
})
class Ex31Child { clicked = output<string>(); }

@Component({
  selector: 'ex-31', standalone: true, imports: [Ex31Child],
  template: `<ex-31-child (clicked)="onClicked($event)" /><p>{{ msg }}</p>`
})
class Ex31 { msg = ''; onClicked(v: string) { this.msg = `Got: ${v}`; } }

// 32. model() two-way binding
@Component({
  selector: 'ex-32-child', standalone: true,
  template: `<input [value]="value()" (input)="value.set($any($event).target.value)" />`
})
class Ex32Child { value = model<string>(''); }

@Component({
  selector: 'ex-32', standalone: true, imports: [Ex32Child],
  template: `<ex-32-child [(value)]="text" /><p>Parent sees: {{ text }}</p>`
})
class Ex32 { text = 'hello'; }

// 33. signal in @for track
@Component({
  selector: 'ex-33', standalone: true,
  template: `
    <ul>@for (item of items(); track item.id) { <li>{{ item.label }}</li> }</ul>
    <button (click)="shuffle()">Shuffle</button>
  `
})
class Ex33 {
  items = signal([
    { id: 1, label: 'Alpha' }, { id: 2, label: 'Beta' }, { id: 3, label: 'Gamma' },
  ]);
  shuffle() {
    this.items.update(arr => [...arr].sort(() => Math.random() - 0.5));
  }
}

// 34. cross-component signal sync via service
@Injectable({ providedIn: 'root' })
class SelectedService { selected = signal<number | null>(null); select(id: number) { this.selected.set(id); } }

@Component({ selector: 'ex-34-list', standalone: true, template: `<ul>@for (id of ids; track id) { <li (click)="svc.select(id)" [style.fontWeight]="svc.selected() === id ? 'bold' : 'normal'" style="cursor:pointer">Item {{ id }}</li> }</ul>` })
class Ex34List { ids = [1, 2, 3, 4]; svc = inject(SelectedService); }

@Component({ selector: 'ex-34-detail', standalone: true, template: `<p>Selected: {{ svc.selected() ?? 'none' }}</p>` })
class Ex34Detail { svc = inject(SelectedService); }

@Component({ selector: 'ex-34', standalone: true, imports: [Ex34List, Ex34Detail], template: `<ex-34-list /><ex-34-detail />` })
class Ex34 {}

// 35. Parent passes signal value as input to child
@Component({ selector: 'ex-35-child', standalone: true, template: `<p>Color: {{ color() }}</p>` })
class Ex35Child { color = input<string>('black'); }

@Component({
  selector: 'ex-35', standalone: true, imports: [Ex35Child],
  template: `
    <ex-35-child [color]="currentColor()" />
    <button (click)="toggle()">Toggle Color</button>
  `
})
class Ex35 {
  currentColor = signal('blue');
  toggle() { this.currentColor.update(c => c === 'blue' ? 'crimson' : 'blue'); }
}

// 36. effect reading untracked signal
@Component({
  selector: 'ex-36', standalone: true,
  template: `<p>A: {{ a() }} | B: {{ b() }}</p><button (click)="a.update(n => n + 1)">+A</button><button (click)="b.update(n => n + 1)">+B</button>`
})
class Ex36 {
  a = signal(0); b = signal(0);
  constructor() {
    effect(() => {
      const aVal = this.a();
      const bVal = untracked(() => this.b());
      console.log('Ex36 effect: a =', aVal, 'b (untracked) =', bVal);
    });
  }
}

// 37. signal with @for + computed count
@Component({
  selector: 'ex-37', standalone: true,
  template: `
    <p>Total: {{ total() }} | Done: {{ doneCount() }}</p>
    <ul>@for (t of tasks(); track t.id) {
      <li>
        <input type="checkbox" [checked]="t.done" (change)="toggle(t.id)" />
        {{ t.label }}
      </li>
    }</ul>
  `
})
class Ex37 {
  tasks = signal([
    { id: 1, label: 'Buy groceries', done: false },
    { id: 2, label: 'Write tests', done: true },
    { id: 3, label: 'Deploy app', done: false },
  ]);
  total = computed(() => this.tasks().length);
  doneCount = computed(() => this.tasks().filter(t => t.done).length);
  toggle(id: number) { this.tasks.update(arr => arr.map(t => t.id === id ? { ...t, done: !t.done } : t)); }
}

// 38. Reactive form-like with signals
@Component({
  selector: 'ex-38', standalone: true,
  template: `
    <input [value]="name()" (input)="name.set($any($event).target.value)" placeholder="Name" />
    <input [value]="email()" (input)="email.set($any($event).target.value)" placeholder="Email" />
    <p>Valid: {{ isValid() }}</p>
    <p>Preview: {{ name() }} &lt;{{ email() }}&gt;</p>
  `
})
class Ex38 {
  name = signal('');
  email = signal('');
  isValid = computed(() => this.name().trim().length > 0 && this.email().includes('@'));
}

// ─── ADVANCED (39–50) ─────────────────────────────────────────

// 39. linkedSignal() — derived with override capability
@Component({
  selector: 'ex-39', standalone: true,
  template: `
    <p>Source: {{ source() }} | Linked: {{ linked() }}</p>
    <button (click)="source.update(n => n + 1)">+Source</button>
    <button (click)="linked.set(999)">Override Linked</button>
  `
})
class Ex39 {
  source = signal(10);
  linked = linkedSignal(() => this.source() * 3);
}

// 40. toSignal() from Observable
@Component({
  selector: 'ex-40', standalone: true,
  template: `<p>Timer: {{ timer() }}</p>`
})
class Ex40 {
  timer = toSignal(interval(1000).pipe(map(n => `${n}s elapsed`)), { initialValue: '0s elapsed' });
}

// 41. toObservable() from signal
@Component({
  selector: 'ex-41', standalone: true,
  template: `<p>Signal: {{ count() }} | Observable emissions: {{ emissions }}</p><button (click)="count.update(n => n + 1)">+1</button>`
})
class Ex41 {
  count = signal(0);
  emissions = 0;
  private dr = inject(DestroyRef);
  constructor() {
    toObservable(this.count).pipe(takeUntilDestroyed(this.dr)).subscribe(() => this.emissions++);
  }
}

// 42. signal with RxJS interop — debounce search
@Component({
  selector: 'ex-42', standalone: true,
  template: `<input [value]="query()" (input)="query.set($any($event).target.value)" placeholder="Type to search..." /><p>Debounced: {{ debounced() }}</p>`
})
class Ex42 {
  query = signal('');
  debounced = toSignal(
    toObservable(this.query).pipe(debounceTime(400)),
    { initialValue: '' }
  );
}

// 43. effect cleanup with DestroyRef
@Component({
  selector: 'ex-43', standalone: true,
  template: `<p>Ticks: {{ ticks() }}</p>`
})
class Ex43 {
  ticks = signal(0);
  private dr = inject(DestroyRef);
  constructor() {
    const id = setInterval(() => this.ticks.update(n => n + 1), 1000);
    this.dr.onDestroy(() => clearInterval(id));
  }
}

// 44. untracked() — read signal without tracking
@Component({
  selector: 'ex-44', standalone: true,
  template: `<p>A: {{ a() }} | B: {{ b() }}</p><button (click)="a.update(n=>n+1)">+A (triggers effect)</button><button (click)="b.update(n=>n+1)">+B (untracked)</button>`
})
class Ex44 {
  a = signal(0); b = signal(0);
  logEntry = signal('');
  constructor() {
    effect(() => {
      const av = this.a();
      const bv = untracked(() => this.b());
      this.logEntry.set(`a=${av}, b=${bv} (effect ran)`);
    }, { allowSignalWrites: true });
  }
}

// 45. effect with allowSignalWrites — syncing two signals
@Component({
  selector: 'ex-45', standalone: true,
  template: `
    <p>Celsius: {{ celsius() }} | Fahrenheit: {{ fahrenheit() }}</p>
    <button (click)="celsius.update(n => n + 10)">+10°C</button>
  `
})
class Ex45 {
  celsius = signal(0);
  fahrenheit = signal(32);
  constructor() {
    effect(() => {
      this.fahrenheit.set(this.celsius() * 9 / 5 + 32);
    }, { allowSignalWrites: true });
  }
}

// 46. batch updates via sequential .set() — signals batch automatically
@Component({
  selector: 'ex-46', standalone: true,
  template: `<p>{{ x() }} {{ y() }} {{ z() }}</p><button (click)="update()">Batch Update</button>`
})
class Ex46 {
  x = signal('A'); y = signal('B'); z = signal('C');
  combined = computed(() => `${this.x()}+${this.y()}+${this.z()}`);
  update() {
    // Angular signals batch automatically — all three trigger one CD cycle
    this.x.set('X'); this.y.set('Y'); this.z.set('Z');
  }
}

// 47. signal store pattern
@Injectable({ providedIn: 'root' })
class UserSignalStore {
  private _users = signal<{ id: number; name: string; active: boolean }[]>([]);
  readonly users = this._users.asReadonly();
  readonly activeUsers = computed(() => this._users().filter(u => u.active));
  readonly count = computed(() => this._users().length);

  load() {
    this._users.set([
      { id: 1, name: 'Alice', active: true },
      { id: 2, name: 'Bob', active: false },
      { id: 3, name: 'Carol', active: true },
    ]);
  }
  toggle(id: number) {
    this._users.update(list => list.map(u => u.id === id ? { ...u, active: !u.active } : u));
  }
}

@Component({
  selector: 'ex-47', standalone: true,
  template: `
    <p>Total: {{ store.count() }} | Active: {{ store.activeUsers().length }}</p>
    <ul>@for (u of store.users(); track u.id) {
      <li [style.opacity]="u.active ? 1 : 0.4" (click)="store.toggle(u.id)" style="cursor:pointer">
        {{ u.name }}
      </li>
    }</ul>
    <button (click)="store.load()">Load Users</button>
  `
})
class Ex47 { store = inject(UserSignalStore); }

// 48. signal-based undo/redo
@Component({
  selector: 'ex-48', standalone: true,
  template: `
    <p>Value: {{ current() }}</p>
    <button (click)="set(current() + 1)">+1</button>
    <button (click)="undo()" [disabled]="past().length === 0">Undo</button>
    <button (click)="redo()" [disabled]="future().length === 0">Redo</button>
  `
})
class Ex48 {
  current = signal(0);
  past = signal<number[]>([]);
  future = signal<number[]>([]);

  set(val: number) {
    this.past.update(p => [...p, this.current()]);
    this.future.set([]);
    this.current.set(val);
  }
  undo() {
    const prev = this.past();
    if (!prev.length) return;
    this.future.update(f => [this.current(), ...f]);
    this.current.set(prev[prev.length - 1]);
    this.past.update(p => p.slice(0, -1));
  }
  redo() {
    const next = this.future();
    if (!next.length) return;
    this.past.update(p => [...p, this.current()]);
    this.current.set(next[0]);
    this.future.update(f => f.slice(1));
  }
}

// 49. signal input() with required and transform
@Component({ selector: 'ex-49-child', standalone: true, template: `<p>Price: ${{ price() }}</p>` })
class Ex49Child { price = input.required<number>(); }

@Component({
  selector: 'ex-49', standalone: true, imports: [Ex49Child],
  template: `<ex-49-child [price]="amount()" /><button (click)="amount.update(n => n + 9.99)">+$9.99</button>`
})
class Ex49 { amount = signal(9.99); }

// 50. Full signal component — list manager with filter, sort, add, remove, stats
@Component({
  selector: 'ex-50', standalone: true,
  template: `
    <input [value]="filter()" (input)="filter.set($any($event).target.value)" placeholder="Filter..." style="margin-right:8px"/>
    <button (click)="add()">Add</button>
    <p>Total: {{ total() }} | Showing: {{ filtered().length }}</p>
    <ul>
      @for (item of filtered(); track item.id) {
        <li>
          <strong>{{ item.name }}</strong> — {{ item.score }}pts
          <button (click)="remove(item.id)">x</button>
          <button (click)="boost(item.id)">+5</button>
        </li>
      }
    </ul>
    <p>Top scorer: {{ topScorer()?.name ?? 'none' }} ({{ topScorer()?.score ?? 0 }}pts)</p>
  `
})
class Ex50 {
  private nextId = 1;
  items = signal<{ id: number; name: string; score: number }[]>([
    { id: this.nextId++, name: 'Alice', score: 42 },
    { id: this.nextId++, name: 'Bob', score: 17 },
  ]);
  filter = signal('');
  filtered = computed(() => {
    const q = this.filter().toLowerCase();
    return q ? this.items().filter(i => i.name.toLowerCase().includes(q)) : this.items();
  });
  total = computed(() => this.items().length);
  topScorer = computed(() => [...this.items()].sort((a, b) => b.score - a.score)[0] ?? null);

  add() { this.items.update(arr => [...arr, { id: this.nextId++, name: `Player${this.nextId - 1}`, score: 0 }]); }
  remove(id: number) { this.items.update(arr => arr.filter(i => i.id !== id)); }
  boost(id: number) { this.items.update(arr => arr.map(i => i.id === id ? { ...i, score: i.score + 5 } : i)); }
}

// ─── App Root ─────────────────────────────────────────────────

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
      <h1>Examples 3.4 — Signals</h1>
      <h4>1. signal() basics — create and read</h4><ex-01 /><hr />
      <h4>2. Reading signal with ()</h4><ex-02 /><hr />
      <h4>3. Updating with .set()</h4><ex-03 /><hr />
      <h4>4. Updating with .update()</h4><ex-04 /><hr />
      <h4>5. .update() for objects</h4><ex-05 /><hr />
      <h4>6. computed() basics</h4><ex-06 /><hr />
      <h4>7. computed with math</h4><ex-07 /><hr />
      <h4>8. computed with string</h4><ex-08 /><hr />
      <h4>9. computed with boolean</h4><ex-09 /><hr />
      <h4>10. computed with array</h4><ex-10 /><hr />
      <h4>11. signal boolean — toggle</h4><ex-11 /><hr />
      <h4>12. signal with null handling</h4><ex-12 /><hr />
      <h4>13. signal array — push pattern</h4><ex-13 /><hr />
      <h4>14. effect() basics — logs on change</h4><ex-14 /><hr />
      <h4>15. effect with cleanup</h4><ex-15 /><hr />
      <h4>16. effect logging — debug pattern</h4><ex-16 /><hr />
      <h4>17. effect syncing to localStorage</h4><ex-17 /><hr />
      <h4>18. nested computed — a → b → c</h4><ex-18 /><hr />
      <h4>19. computed from multiple signals</h4><ex-19 /><hr />
      <h4>20. signal with @if</h4><ex-20 /><hr />
      <h4>21. signal with @for</h4><ex-21 /><hr />
      <h4>22. signal array add/remove</h4><ex-22 /><hr />
      <h4>23. signal object update — partial</h4><ex-23 /><hr />
      <h4>24. signal counter with history</h4><ex-24 /><hr />
      <h4>25. computed as derived list</h4><ex-25 /><hr />
      <h4>26. signal with @switch</h4><ex-26 /><hr />
      <h4>27. Multiple components sharing service signals</h4><ex-27 /><hr />
      <h4>28. computed chains (a → b → c → d)</h4><ex-28 /><hr />
      <h4>29. effect triggering via signal change</h4><ex-29 /><hr />
      <h4>30. signal input() — new API</h4><ex-30 /><hr />
      <h4>31. signal output() — new API</h4><ex-31 /><hr />
      <h4>32. model() two-way binding</h4><ex-32 /><hr />
      <h4>33. signal in @for track</h4><ex-33 /><hr />
      <h4>34. cross-component signal sync via service</h4><ex-34 /><hr />
      <h4>35. Parent passes signal value as input</h4><ex-35 /><hr />
      <h4>36. effect reading untracked signal</h4><ex-36 /><hr />
      <h4>37. signal with @for + computed count</h4><ex-37 /><hr />
      <h4>38. Reactive form-like with signals</h4><ex-38 /><hr />
      <h4>39. linkedSignal() — derived with override</h4><ex-39 /><hr />
      <h4>40. toSignal() from Observable</h4><ex-40 /><hr />
      <h4>41. toObservable() from signal</h4><ex-41 /><hr />
      <h4>42. signal + RxJS interop — debounce search</h4><ex-42 /><hr />
      <h4>43. effect cleanup with DestroyRef</h4><ex-43 /><hr />
      <h4>44. untracked() — read without tracking</h4><ex-44 /><hr />
      <h4>45. effect with allowSignalWrites</h4><ex-45 /><hr />
      <h4>46. batch updates via sequential .set()</h4><ex-46 /><hr />
      <h4>47. signal store pattern</h4><ex-47 /><hr />
      <h4>48. signal-based undo/redo</h4><ex-48 /><hr />
      <h4>49. signal input() with required</h4><ex-49 /><hr />
      <h4>50. Full signal — list manager with filter, stats, undo</h4><ex-50 /><hr />
    </div>
  `,
})
export class AppComponent {}
