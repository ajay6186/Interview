import { Component, signal, computed, inject, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  Subject, BehaviorSubject, ReplaySubject, AsyncSubject,
  Observable, of, interval, timer, from
} from 'rxjs';
import {
  map, filter, take, scan, debounceTime, throttleTime,
  withLatestFrom, delay, tap, distinctUntilChanged,
  observeOn, asyncScheduler, share
} from 'rxjs/operators';
import { FormsModule } from '@angular/forms';

// ============================================================
// Examples 5.5 — RxJS Subjects (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ───────────────────────────────────────────

// 1. Subject — emit and subscribe
@Component({
  selector: 'ex-01', standalone: true,
  template: `<button (click)="emit()">Emit</button><p>Received: {{ value() }}</p>`
})
class Ex01 {
  private sub$ = new Subject<string>();
  value = toSignal(this.sub$, { initialValue: 'none' });
  emit() { this.sub$.next(`value-${Date.now()}`); }
}

// 2. Subject multicast (two subscribers get same value)
@Component({
  selector: 'ex-02', standalone: true,
  template: `<button (click)="emit()">Emit</button><p>Sub1: {{ sub1() }}</p><p>Sub2: {{ sub2() }}</p>`
})
class Ex02 {
  private shared$ = new Subject<number>();
  sub1 = toSignal(this.shared$, { initialValue: 0 });
  sub2 = toSignal(this.shared$.pipe(map(n => n * 2)), { initialValue: 0 });
  private count = 0;
  emit() { this.shared$.next(++this.count); }
}

// 3. Subject as event bus
@Component({
  selector: 'ex-03', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="publish('click')">Publish click</button>
    <button (click)="publish('hover')">Publish hover</button>
    <ul>@for (e of events(); track $index) { <li>{{ e }}</li> }</ul>`
})
class Ex03 {
  private bus$ = new Subject<string>();
  events = toSignal(
    this.bus$.pipe(scan((acc: string[], v) => [...acc.slice(-4), v], [])),
    { initialValue: [] as string[] }
  );
  publish(event: string) { this.bus$.next(event); }
}

// 4. BehaviorSubject with initial value
@Component({
  selector: 'ex-04', standalone: true,
  template: `<p>BehaviorSubject: {{ value() }}</p><button (click)="update()">Update</button>`
})
class Ex04 {
  private bs$ = new BehaviorSubject<string>('initial value');
  value = toSignal(this.bs$, { initialValue: 'initial value' });
  update() { this.bs$.next(`updated at ${Date.now()}`); }
}

// 5. BehaviorSubject .getValue() / .value
@Component({
  selector: 'ex-05', standalone: true,
  template: `<p>Sync value: {{ sync() }}</p><button (click)="read()">Read Sync</button>`
})
class Ex05 {
  private bs$ = new BehaviorSubject<number>(42);
  sync = signal(42);
  read() { this.sync.set(this.bs$.getValue()); this.bs$.next(this.bs$.value + 1); }
}

// 6. BehaviorSubject as current state
@Component({
  selector: 'ex-06', standalone: true,
  template: `<p>State: {{ state() | json }}</p><button (click)="toggle()">Toggle</button>`
})
class Ex06 {
  private state$ = new BehaviorSubject<{ active: boolean; count: number }>({ active: false, count: 0 });
  state = toSignal(this.state$, { initialValue: { active: false, count: 0 } });
  toggle() { const s = this.state$.value; this.state$.next({ active: !s.active, count: s.count + 1 }); }
}

// 7. ReplaySubject(1) — late subscriber gets last value
@Component({
  selector: 'ex-07', standalone: true,
  template: `<p>Late sub gets: {{ late() }}</p><button (click)="subscribe()">Late Subscribe</button>`
})
class Ex07 implements OnInit {
  private rs$ = new ReplaySubject<string>(1);
  late = signal('not subscribed yet');
  private destroyRef = inject(DestroyRef);
  ngOnInit() { this.rs$.next('value emitted before subscription'); }
  subscribe() {
    this.rs$.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.late.set(v));
  }
}

// 8. ReplaySubject(3) — last 3 values buffered
@Component({
  selector: 'ex-08', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="emit()">Emit</button>
    <button (click)="lateSubscribe()">Late Subscribe</button>
    <p>Replayed: {{ replayed() | json }}</p>`
})
class Ex08 {
  private rs$ = new ReplaySubject<number>(3);
  replayed = signal<number[]>([]);
  private count = 0;
  private destroyRef = inject(DestroyRef);
  emit() { this.rs$.next(++this.count); }
  lateSubscribe() {
    this.replayed.set([]);
    this.rs$.pipe(take(3), takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.replayed.update(arr => [...arr, v]));
  }
}

// 9. AsyncSubject — only emits on complete
@Component({
  selector: 'ex-09', standalone: true,
  template: `<p>AsyncSubject: {{ result() }}</p><button (click)="run()">Run</button>`
})
class Ex09 {
  private as$ = new AsyncSubject<string>();
  result = signal('waiting for complete...');
  private destroyRef = inject(DestroyRef);
  run() {
    this.as$ = new AsyncSubject<string>();
    this.as$.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.result.set(v));
    this.as$.next('value 1');
    this.as$.next('value 2');
    this.as$.next('only this one emits');
    this.as$.complete();
  }
}

// 10. Subject .complete()
@Component({
  selector: 'ex-10', standalone: true,
  template: `<p>Completed: {{ done() }}</p><button (click)="complete()">Complete</button>`
})
class Ex10 {
  private sub$ = new Subject<string>();
  done = signal(false);
  private destroyRef = inject(DestroyRef);
  constructor() {
    this.sub$.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ complete: () => this.done.set(true) });
  }
  complete() { this.sub$.complete(); }
}

// 11. Subject .error()
@Component({
  selector: 'ex-11', standalone: true,
  template: `<p>Error received: {{ errorMsg() }}</p><button (click)="triggerError()">Error</button>`
})
class Ex11 {
  private sub$ = new Subject<string>();
  errorMsg = signal('none');
  private destroyRef = inject(DestroyRef);
  constructor() {
    this.sub$.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: (err: Error) => this.errorMsg.set(err.message) });
  }
  triggerError() { this.sub$.error(new Error('subject errored')); }
}

// 12. Subject late subscriber misses values
@Component({
  selector: 'ex-12', standalone: true,
  template: `<p>Early: {{ early() }}</p><p>Late (misses): {{ late() }}</p><button (click)="run()">Run</button>`
})
class Ex12 {
  early = signal('none');
  late = signal('none');
  private destroyRef = inject(DestroyRef);
  run() {
    const sub$ = new Subject<string>();
    sub$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(v => this.early.set(v));
    sub$.next('early value');
    // Late subscriber misses 'early value'
    sub$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(v => this.late.set(v));
    sub$.next('late value — both get this');
  }
}

// 13. Subject unsubscribe pattern
@Component({
  selector: 'ex-13', standalone: true,
  template: `<p>Active: {{ active() }}</p><button (click)="start()">Start</button><button (click)="stop()">Stop</button>`
})
class Ex13 {
  active = signal(false);
  private ticker$ = new Subject<number>();
  private stopSignal$ = new Subject<void>();
  private destroyRef = inject(DestroyRef);
  start() {
    this.active.set(true);
    interval(1000).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(n => this.ticker$.next(n));
  }
  stop() { this.active.set(false); this.stopSignal$.next(); }
}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────

// 14. BehaviorSubject as login/logout state
@Component({
  selector: 'ex-14', standalone: true,
  template: `
    <p>Logged in: {{ loggedIn() }}</p>
    <button (click)="login()">Login</button>
    <button (click)="logout()">Logout</button>`
})
class Ex14 {
  private auth$ = new BehaviorSubject<boolean>(false);
  loggedIn = toSignal(this.auth$, { initialValue: false });
  login() { this.auth$.next(true); }
  logout() { this.auth$.next(false); }
}

// 15. BehaviorSubject .asObservable() encapsulation
class CounterService15 {
  private _count$ = new BehaviorSubject<number>(0);
  readonly count$ = this._count$.asObservable();
  increment() { this._count$.next(this._count$.value + 1); }
  decrement() { this._count$.next(this._count$.value - 1); }
}
@Component({
  selector: 'ex-15', standalone: true,
  template: `<p>Count: {{ count() }}</p><button (click)="svc.increment()">+</button><button (click)="svc.decrement()">-</button>`
})
class Ex15 {
  svc = new CounterService15();
  count = toSignal(this.svc.count$, { initialValue: 0 });
}

// 16. ReplaySubject for notification replay
@Component({
  selector: 'ex-16', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="addNotif()">Add Notification</button>
    <button (click)="subscribeNew()">New Subscriber</button>
    <ul>@for (n of notifs(); track $index) { <li>{{ n }}</li> }</ul>`
})
class Ex16 {
  private replay$ = new ReplaySubject<string>(5);
  notifs = signal<string[]>([]);
  private destroyRef = inject(DestroyRef);
  private count = 0;
  addNotif() { this.replay$.next(`Notification #${++this.count}`); }
  subscribeNew() {
    this.notifs.set([]);
    this.replay$.pipe(take(5), takeUntilDestroyed(this.destroyRef))
      .subscribe(n => this.notifs.update(arr => [...arr, n]));
  }
}

// 17. AsyncSubject for single computed result
@Component({
  selector: 'ex-17', standalone: true,
  template: `<p>Async result: {{ result() }}</p><button (click)="compute()">Compute</button>`
})
class Ex17 {
  private async$ = new AsyncSubject<number>();
  result = signal<number | null>(null);
  private destroyRef = inject(DestroyRef);
  compute() {
    this.async$ = new AsyncSubject<number>();
    this.async$.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.result.set(v));
    for (let i = 0; i < 5; i++) this.async$.next(i * i);
    this.async$.complete();
  }
}

// 18. Subject as action dispatcher (dispatch + ofType filter)
interface Action18 { type: string; payload?: any; }
@Component({
  selector: 'ex-18', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="dispatch({type:'ADD',payload:'item-' + count++})">Add</button>
    <button (click)="dispatch({type:'CLEAR'})">Clear</button>
    <ul>@for (item of items(); track $index) { <li>{{ item }}</li> }</ul>`
})
class Ex18 {
  private dispatch$ = new Subject<Action18>();
  items = toSignal(
    this.dispatch$.pipe(
      scan((state: string[], action) => {
        if (action.type === 'ADD') return [...state, action.payload];
        if (action.type === 'CLEAR') return [];
        return state;
      }, [])
    ), { initialValue: [] as string[] }
  );
  count = 1;
  dispatch(action: Action18) { this.dispatch$.next(action); }
}

// 19. Subject in service as event bus
class EventBusService {
  private bus$ = new Subject<{ type: string; data: any }>();
  readonly events$ = this.bus$.asObservable();
  emit(type: string, data: any) { this.bus$.next({ type, data }); }
}
@Component({
  selector: 'ex-19', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="bus.emit('nav','/home')">Nav Home</button>
    <button (click)="bus.emit('nav','/about')">Nav About</button>
    <ul>@for (e of eventsLog(); track $index) { <li>{{ e }}</li> }</ul>`
})
class Ex19 {
  bus = new EventBusService();
  eventsLog = toSignal(
    this.bus.events$.pipe(
      map(e => `${e.type}: ${e.data}`),
      scan((acc: string[], v) => [...acc.slice(-4), v], [])
    ), { initialValue: [] as string[] }
  );
}

// 20. Subject for sibling component communication
const siblingBus$ = new Subject<string>();
@Component({ selector: 'ex-20-sender', standalone: true, template: `<button (click)="send()">Send to sibling</button>` })
class Ex20Sender { send() { siblingBus$.next(`msg-${Date.now()}`); } }
@Component({ selector: 'ex-20-receiver', standalone: true, template: `<p>Received: {{ msg() }}</p>` })
class Ex20Receiver {
  msg = toSignal(siblingBus$, { initialValue: 'waiting...' });
}
@Component({
  selector: 'ex-20', standalone: true, imports: [Ex20Sender, Ex20Receiver],
  template: `<ex-20-sender /><ex-20-receiver />`
})
class Ex20 {}

// 21. BehaviorSubject + toSignal bridge
@Component({
  selector: 'ex-21', standalone: true, imports: [FormsModule],
  template: `<input [(ngModel)]="inputVal" (ngModelChange)="bs$.next($event)" /><p>Signal: {{ sig() }}</p>`
})
class Ex21 {
  inputVal = 'hello';
  bs$ = new BehaviorSubject<string>('hello');
  sig = toSignal(this.bs$, { initialValue: 'hello' });
}

// 22. ReplaySubject undo buffer (3 states)
@Component({
  selector: 'ex-22', standalone: true, imports: [FormsModule, CommonModule],
  template: `
    <input [(ngModel)]="text" (ngModelChange)="save($event)" placeholder="Type..." />
    <button (click)="undo()">Undo</button>
    <p>Current: {{ current() }}</p>
    <p>History: {{ history() | json }}</p>`
})
class Ex22 {
  text = '';
  current = signal('');
  history = signal<string[]>([]);
  private replay$ = new ReplaySubject<string>(3);
  private destroyRef = inject(DestroyRef);
  constructor() {
    this.replay$.pipe(
      scan((acc: string[], v) => [...acc.slice(-3), v], []),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(h => { this.history.set(h); this.current.set(h[h.length - 1] || ''); });
  }
  save(v: string) { this.replay$.next(v); }
  undo() {
    const h = this.history();
    if (h.length > 1) { this.current.set(h[h.length - 2]); this.text = h[h.length - 2]; this.history.update(arr => arr.slice(0, -1)); }
  }
}

// 23. Subject with map/filter operators
@Component({
  selector: 'ex-23', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="emit(n++)" *ngFor="let n of [1,2,3,4,5]; let n = index">Emit {{n+1}}</button>
    <p>Even only: {{ evens() | json }}</p>`
})
class Ex23 {
  private nums$ = new Subject<number>();
  evens = toSignal(
    this.nums$.pipe(
      filter(n => n % 2 === 0),
      map(n => n * n),
      scan((acc: number[], v) => [...acc, v], [])
    ), { initialValue: [] as number[] }
  );
  private n = 0;
  emit(val: number) { this.nums$.next(val + 1); }
}

// 24. Subject with takeUntilDestroyed cleanup
@Component({
  selector: 'ex-24', standalone: true,
  template: `<p>Ticks: {{ ticks() }}</p><p>(auto-cleaned on destroy)</p>`
})
class Ex24 implements OnInit {
  ticks = signal(0);
  private tick$ = new Subject<number>();
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    interval(1000).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(n => this.tick$.next(n));
    this.tick$.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(n => this.ticks.set(n));
  }
}

// 25. Subject hot observable behavior
@Component({
  selector: 'ex-25', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="emit()">Emit</button>
    <button (click)="subscribe()">Add Subscriber</button>
    <p>Subscribers: {{ subCount() }}</p>
    <ul>@for (log of logs(); track $index) { <li>{{ log }}</li> }</ul>`
})
class Ex25 {
  private hot$ = new Subject<string>();
  subCount = signal(0);
  logs = signal<string[]>([]);
  private count = 0;
  private destroyRef = inject(DestroyRef);
  subscribe() {
    const id = ++this.subCount();
    this.subCount.set(id);
    this.hot$.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.logs.update(arr => [...arr.slice(-4), `Sub${id}: ${v}`]));
  }
  emit() { this.hot$.next(`event-${++this.count}`); }
}

// 26. Multiple subjects coordinating in service
class CoordinatorService {
  private search$ = new BehaviorSubject<string>('');
  private page$ = new BehaviorSubject<number>(1);
  private sort$ = new BehaviorSubject<string>('asc');
  readonly query$ = new BehaviorSubject<{ q: string; page: number; sort: string }>({ q: '', page: 1, sort: 'asc' });
  setSearch(q: string) { this.search$.next(q); this.sync(); }
  setPage(p: number) { this.page$.next(p); this.sync(); }
  setSort(s: string) { this.sort$.next(s); this.sync(); }
  private sync() { this.query$.next({ q: this.search$.value, page: this.page$.value, sort: this.sort$.value }); }
}
@Component({
  selector: 'ex-26', standalone: true, imports: [FormsModule],
  template: `
    <input [(ngModel)]="q" (ngModelChange)="svc.setSearch($event)" placeholder="Search" />
    <button (click)="svc.setPage(svc.query$.value.page + 1)">Next Page</button>
    <p>Query: {{ query() | json }}</p>`
})
class Ex26 {
  svc = new CoordinatorService();
  q = '';
  query = toSignal(this.svc.query$, { initialValue: { q: '', page: 1, sort: 'asc' } });
}

// ─── NESTED (27–38) ──────────────────────────────────────────

// 27. BehaviorSubject shared state between two components
const sharedState$ = new BehaviorSubject<number>(0);
@Component({ selector: 'ex-27-a', standalone: true, template: `<button (click)="sharedState$.next(sharedState$.value+1)">Increment</button>` })
class Ex27A { sharedState$ = sharedState$; }
@Component({ selector: 'ex-27-b', standalone: true, template: `<p>Shared count: {{ count() }}</p>` })
class Ex27B { count = toSignal(sharedState$, { initialValue: 0 }); }
@Component({ selector: 'ex-27', standalone: true, imports: [Ex27A, Ex27B], template: `<ex-27-a /><ex-27-b />` })
class Ex27 {}

// 28. Subject event bus in service consumed by many components
const eventBus28$ = new Subject<{ type: string }>();
@Component({ selector: 'ex-28-btn', standalone: true, template: `<button (click)="fire()">Fire Event</button>` })
class Ex28Btn { fire() { eventBus28$.next({ type: 'FIRE' }); } }
@Component({ selector: 'ex-28-log', standalone: true, imports: [CommonModule], template: `<ul>@for (e of events(); track $index) { <li>{{ e }}</li> }</ul>` })
class Ex28Log {
  events = toSignal(
    eventBus28$.pipe(map(e => e.type), scan((acc: string[], v) => [...acc.slice(-4), v], [])),
    { initialValue: [] as string[] }
  );
}
@Component({ selector: 'ex-28', standalone: true, imports: [Ex28Btn, Ex28Log], template: `<ex-28-btn /><ex-28-log />` })
class Ex28 {}

// 29. Multiple components subscribing to one BehaviorSubject
const theme29$ = new BehaviorSubject<'light' | 'dark'>('light');
@Component({ selector: 'ex-29-toggle', standalone: true, template: `<button (click)="toggle()">Toggle Theme</button>` })
class Ex29Toggle { toggle() { theme29$.next(theme29$.value === 'light' ? 'dark' : 'light'); } }
@Component({ selector: 'ex-29-display', standalone: true, template: `<p [style.color]="theme() === 'dark' ? 'white' : 'black'" [style.background]="theme() === 'dark' ? '#333' : '#eee'">Theme: {{ theme() }}</p>` })
class Ex29Display { theme = toSignal(theme29$, { initialValue: 'light' as 'light' | 'dark' }); }
@Component({ selector: 'ex-29', standalone: true, imports: [Ex29Toggle, Ex29Display], template: `<ex-29-toggle /><ex-29-display /><ex-29-display />` })
class Ex29 {}

// 30. Subject chained: subject1 → map → subject2
@Component({
  selector: 'ex-30', standalone: true,
  template: `<button (click)="input$.next(inputVal++)">Send Number</button><p>Doubled: {{ doubled() }}</p>`
})
class Ex30 implements OnInit {
  input$ = new Subject<number>();
  output$ = new Subject<number>();
  doubled = toSignal(this.output$, { initialValue: 0 });
  inputVal = 1;
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    this.input$.pipe(map(n => n * 2), takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.output$.next(v));
  }
}

// 31. BehaviorSubject + computed signal combo
@Component({
  selector: 'ex-31', standalone: true, imports: [FormsModule],
  template: `
    <input type="number" [(ngModel)]="price" (ngModelChange)="price$.next(+$event)" />
    <input type="number" [(ngModel)]="qty" (ngModelChange)="qty$.next(+$event)" />
    <p>Total: {{ total() }}</p><p>Tax (20%): {{ tax() }}</p>`
})
class Ex31 {
  price = 10; qty = 3;
  price$ = new BehaviorSubject<number>(10);
  qty$ = new BehaviorSubject<number>(3);
  total = toSignal(
    this.price$.pipe(
      map(p => p * this.qty$.value)
    ), { initialValue: 30 }
  );
  tax = computed(() => +(this.total() * 0.2).toFixed(2));
}

// 32. Shopping cart BehaviorSubject (add/remove items)
interface CartItem { id: number; name: string; price: number; }
@Component({
  selector: 'ex-32', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="add({id:Date.now(),name:'Item '+cart().length,price:9.99})">Add Item</button>
    <ul>@for (item of cart(); track item.id) { <li>{{ item.name }} ${{ item.price }} <button (click)="remove(item.id)">X</button></li> }</ul>
    <p>Total: ${{ total() }}</p>`
})
class Ex32 {
  private cart$ = new BehaviorSubject<CartItem[]>([]);
  cart = toSignal(this.cart$, { initialValue: [] as CartItem[] });
  total = computed(() => +this.cart().reduce((s, i) => s + i.price, 0).toFixed(2));
  add(item: CartItem) { this.cart$.next([...this.cart$.value, item]); }
  remove(id: number) { this.cart$.next(this.cart$.value.filter(i => i.id !== id)); }
}

// 33. Auth BehaviorSubject (login/logout user object)
interface User33 { name: string; role: string; }
@Component({
  selector: 'ex-33', standalone: true,
  template: `
    @if (user()) { <p>{{ user()!.name }} ({{ user()!.role }})</p><button (click)="logout()">Logout</button> }
    @else { <button (click)="login()">Login as Admin</button> }`
})
class Ex33 {
  private user$ = new BehaviorSubject<User33 | null>(null);
  user = toSignal(this.user$, { initialValue: null as User33 | null });
  login() { this.user$.next({ name: 'Alice', role: 'admin' }); }
  logout() { this.user$.next(null); }
}

// 34. Theme BehaviorSubject (dark/light)
const globalTheme$ = new BehaviorSubject<'light' | 'dark'>('light');
@Component({
  selector: 'ex-34', standalone: true,
  template: `
    <div [style.background]="theme() === 'dark' ? '#222' : '#fff'" [style.color]="theme() === 'dark' ? '#fff' : '#222'" [style.padding]="'8px'">
      Theme: {{ theme() }}
      <button (click)="toggle()">Toggle</button>
    </div>`
})
class Ex34 {
  theme = toSignal(globalTheme$, { initialValue: 'light' as 'light' | 'dark' });
  toggle() { globalTheme$.next(globalTheme$.value === 'light' ? 'dark' : 'light'); }
}

// 35. Notification Subject (push + display)
@Component({
  selector: 'ex-35', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="push('Info: ' + Date.now())">Push Notification</button>
    <button (click)="clear()">Clear</button>
    <ul>@for (n of notifs(); track $index) { <li>{{ n }}</li> }</ul>`
})
class Ex35 {
  private notif$ = new Subject<string>();
  notifs = toSignal(
    this.notif$.pipe(scan((acc: string[], v) => [...acc.slice(-4), v], [])),
    { initialValue: [] as string[] }
  );
  private clearSig = new Subject<void>();
  stored = signal<string[]>([]);
  constructor() {
    this.notif$.pipe(scan((acc: string[], v) => [...acc, v], []))
      .subscribe(ns => this.stored.set(ns));
  }
  push(msg: string) { this.notif$.next(msg); }
  clear() { this.stored.set([]); }
}

// 36. WebSocket simulation with Subject
@Component({
  selector: 'ex-36', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="connect()">Connect</button>
    <button (click)="send()">Send Message</button>
    <p>Status: {{ status() }}</p>
    <ul>@for (m of messages(); track $index) { <li>{{ m }}</li> }</ul>`
})
class Ex36 {
  private ws$ = new Subject<string>();
  status = signal('disconnected');
  messages = toSignal(
    this.ws$.pipe(scan((acc: string[], v) => [...acc.slice(-4), v], [])),
    { initialValue: [] as string[] }
  );
  private msgCount = 0;
  connect() { this.status.set('connected'); this.ws$.next('[connected]'); }
  send() { if (this.status() === 'connected') this.ws$.next(`msg-${++this.msgCount}: ${new Date().toLocaleTimeString()}`); }
}

// 37. Action stream Subject with scan for state
interface AppState37 { items: string[]; selected: string | null; }
@Component({
  selector: 'ex-37', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="dispatch('ADD','item-'+state().items.length)">Add</button>
    <button (click)="dispatch('SELECT',state().items[0])">Select First</button>
    <button (click)="dispatch('CLEAR',null)">Clear</button>
    <p>Items: {{ state().items | json }}</p>
    <p>Selected: {{ state().selected }}</p>`
})
class Ex37 {
  private action$ = new Subject<{ type: string; payload: any }>();
  state = toSignal(
    this.action$.pipe(
      scan((s: AppState37, a) => {
        if (a.type === 'ADD') return { ...s, items: [...s.items, a.payload] };
        if (a.type === 'SELECT') return { ...s, selected: a.payload };
        if (a.type === 'CLEAR') return { items: [], selected: null };
        return s;
      }, { items: [], selected: null })
    ), { initialValue: { items: [], selected: null } as AppState37 }
  );
  dispatch(type: string, payload: any) { this.action$.next({ type, payload }); }
}

// 38. Full pub-sub system with Subject
interface PubSubEvent { channel: string; data: any; }
class PubSubService {
  private channel$ = new Subject<PubSubEvent>();
  publish(channel: string, data: any) { this.channel$.next({ channel, data }); }
  subscribe(channel: string) { return this.channel$.pipe(filter(e => e.channel === channel), map(e => e.data)); }
}
@Component({
  selector: 'ex-38', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="ps.publish('news','Breaking: '+count++)">Publish News</button>
    <button (click)="ps.publish('alerts','Alert '+count++)">Publish Alert</button>
    <p>News: {{ news() }}</p><p>Alert: {{ alert() }}</p>`
})
class Ex38 {
  ps = new PubSubService();
  count = 1;
  news = toSignal(this.ps.subscribe('news'), { initialValue: 'none' });
  alert = toSignal(this.ps.subscribe('alerts'), { initialValue: 'none' });
}

// ─── ADVANCED (39–50) ────────────────────────────────────────

// 39. Subject vs BehaviorSubject vs ReplaySubject vs AsyncSubject side-by-side
@Component({
  selector: 'ex-39', standalone: true,
  template: `
    <button (click)="run()">Demonstrate All</button>
    <p>Subject (late): {{ subVal() }}</p>
    <p>BehaviorSubject (late): {{ bsVal() }}</p>
    <p>ReplaySubject (late): {{ rsVal() }}</p>
    <p>AsyncSubject (on complete): {{ asVal() }}</p>`
})
class Ex39 {
  subVal = signal('missed');
  bsVal = signal('');
  rsVal = signal('');
  asVal = signal('');
  private destroyRef = inject(DestroyRef);
  run() {
    const sub$ = new Subject<string>(); sub$.next('early'); sub$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(v => this.subVal.set(v));
    const bs$ = new BehaviorSubject<string>('initial'); bs$.next('latest'); bs$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(v => this.bsVal.set(v));
    const rs$ = new ReplaySubject<string>(1); rs$.next('replayed'); rs$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(v => this.rsVal.set(v));
    const as$ = new AsyncSubject<string>(); as$.next('async val'); as$.complete(); as$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(v => this.asVal.set(v));
  }
}

// 40. SubjectLike<T> interface
interface SubjectLike40<T> { next(v: T): void; subscribe(obs: any): any; }
class SimpleSubject40<T> implements SubjectLike40<T> {
  private obs: ((v: T) => void)[] = [];
  next(v: T) { this.obs.forEach(o => o(v)); }
  subscribe(observer: { next: (v: T) => void }) { this.obs.push(observer.next.bind(observer)); return { unsubscribe: () => {} }; }
}
@Component({
  selector: 'ex-40', standalone: true,
  template: `<button (click)="emit()">Emit (SubjectLike)</button><p>{{ val() }}</p>`
})
class Ex40 {
  private s = new SimpleSubject40<string>();
  val = signal('none');
  constructor() { this.s.subscribe({ next: (v: string) => this.val.set(v) }); }
  emit() { this.s.next(`custom-${Date.now()}`); }
}

// 41. observeOn(asyncScheduler) with Subject
@Component({
  selector: 'ex-41', standalone: true,
  template: `<button (click)="emit()">Emit Async</button><p>{{ val() }}</p><p>Order: {{ order() | json }}</p>`
})
class Ex41 {
  private sub$ = new Subject<string>();
  val = signal('none');
  order = signal<string[]>([]);
  private destroyRef = inject(DestroyRef);
  constructor() {
    this.sub$.pipe(observeOn(asyncScheduler), takeUntilDestroyed(this.destroyRef))
      .subscribe(v => { this.val.set(v); this.order.update(arr => [...arr, `async: ${v}`]); });
  }
  emit() {
    this.order.update(arr => [...arr, 'before emit']);
    this.sub$.next('value');
    this.order.update(arr => [...arr, 'after emit (before async)']);
  }
}

// 42. Subject with throttleTime for rapid events
@Component({
  selector: 'ex-42', standalone: true,
  template: `
    <button (click)="click$.next()">Rapid Click</button>
    <p>Raw: {{ raw() }} | Throttled: {{ throttled() }}</p>`
})
class Ex42 {
  click$ = new Subject<void>();
  raw = signal(0);
  throttled = toSignal(
    this.click$.pipe(tap(() => this.raw.update(n => n + 1)), throttleTime(500), map(() => 1), scan((acc: number, v) => acc + v, 0)),
    { initialValue: 0 }
  );
}

// 43. Subject for debounced autosave
@Component({
  selector: 'ex-43', standalone: true, imports: [FormsModule],
  template: `
    <input [(ngModel)]="text" (ngModelChange)="change$.next($event)" placeholder="Type to autosave..." />
    <p>Saved: {{ saved() }}</p><p>Status: {{ saveStatus() }}</p>`
})
class Ex43 {
  text = '';
  change$ = new Subject<string>();
  saved = signal('');
  saveStatus = signal('idle');
  private destroyRef = inject(DestroyRef);
  constructor() {
    this.change$.pipe(
      debounceTime(800),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => { this.saved.set(v); this.saveStatus.set(`saved at ${new Date().toLocaleTimeString()}`); });
  }
}

// 44. Subject as action stream (Redux-like reducer pattern with scan)
type Action44 = { type: 'INC' } | { type: 'DEC' } | { type: 'RESET' };
interface CounterState44 { count: number; history: number[]; }
@Component({
  selector: 'ex-44', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="dispatch({type:'INC'})">+</button>
    <button (click)="dispatch({type:'DEC'})">-</button>
    <button (click)="dispatch({type:'RESET'})">Reset</button>
    <p>Count: {{ state().count }}</p>
    <p>History: {{ state().history | json }}</p>`
})
class Ex44 {
  private action$ = new Subject<Action44>();
  state = toSignal(
    this.action$.pipe(
      scan((s: CounterState44, a) => {
        const next = a.type === 'INC' ? s.count + 1 : a.type === 'DEC' ? s.count - 1 : 0;
        return { count: next, history: [...s.history.slice(-4), next] };
      }, { count: 0, history: [] })
    ), { initialValue: { count: 0, history: [] } as CounterState44 }
  );
  dispatch(a: Action44) { this.action$.next(a); }
}

// 45. withLatestFrom BehaviorSubject
@Component({
  selector: 'ex-45', standalone: true, imports: [FormsModule],
  template: `
    <input type="number" [(ngModel)]="multiplier" (ngModelChange)="mult$.next(+$event)" />
    <button (click)="click$.next()">Compute</button>
    <p>Result: {{ result() }}</p>`
})
class Ex45 {
  multiplier = 5;
  mult$ = new BehaviorSubject<number>(5);
  click$ = new Subject<void>();
  result = toSignal(
    this.click$.pipe(withLatestFrom(this.mult$), map(([, m]) => `${m} × 10 = ${m * 10}`)),
    { initialValue: '' }
  );
}

// 46. scan with Subject for state accumulation
@Component({
  selector: 'ex-46', standalone: true, imports: [CommonModule],
  template: `
    <input (keyup.enter)="add($any($event.target).value); $any($event.target).value=''" placeholder="Add tag + Enter" />
    <button (click)="remove$.next(null)">Remove Last</button>
    <p>Tags: {{ tags() | json }}</p>`
})
class Ex46 {
  private add$ = new Subject<string>();
  remove$ = new Subject<null>();
  private destroyRef = inject(DestroyRef);
  tags = signal<string[]>([]);
  constructor() {
    this.add$.pipe(
      scan((acc: string[], v) => [...acc, v], []),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(t => this.tags.set(t));
    this.remove$.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.tags.update(arr => arr.slice(0, -1)));
  }
  add(v: string) { if (v.trim()) this.add$.next(v.trim()); }
}

// 47. ConnectableObservable via Subject
@Component({
  selector: 'ex-47', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="connect()">Connect</button>
    <p>Sub1: {{ sub1() | json }}</p>
    <p>Sub2: {{ sub2() | json }}</p>`
})
class Ex47 {
  private source$ = new Subject<number>();
  private shared$ = this.source$.pipe(share());
  sub1 = toSignal(this.shared$.pipe(scan((acc: number[], v) => [...acc, v], [])), { initialValue: [] as number[] });
  sub2 = toSignal(this.shared$.pipe(map(n => n * 2), scan((acc: number[], v) => [...acc, v], [])), { initialValue: [] as number[] });
  connect() { [1, 2, 3].forEach(n => this.source$.next(n)); }
}

// 48. multicast() deprecated → share() migration
@Component({
  selector: 'ex-48', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="run()">Run shared$</button>
    <p>A: {{ a() }}</p><p>B (×2): {{ b() }}</p>`
})
class Ex48 {
  private trigger$ = new Subject<void>();
  private shared$ = this.trigger$.pipe(map(() => Math.random()), share());
  a = toSignal(this.shared$.pipe(map(n => n.toFixed(4))), { initialValue: '' });
  b = toSignal(this.shared$.pipe(map(n => (n * 2).toFixed(4))), { initialValue: '' });
  run() { this.trigger$.next(); }
}

// 49. Subject memory leak prevention (takeUntilDestroyed)
@Component({
  selector: 'ex-49', standalone: true,
  template: `<p>Ticks (auto-cleanup): {{ ticks() }}</p><p>Destroyed: {{ destroyed() }}</p>`
})
class Ex49 implements OnInit {
  ticks = signal(0);
  destroyed = signal(false);
  private ticker$ = new Subject<number>();
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    interval(500).pipe(
      take(5),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(n => this.ticker$.next(n));
    this.ticker$.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(n => this.ticks.set(n));
    this.destroyRef.onDestroy(() => this.destroyed.set(true));
  }
}

// 50. Full signal store backed by BehaviorSubject
interface StoreState50 { users: { id: number; name: string }[]; loading: boolean; filter: string; }
class SignalStore50 {
  private state$ = new BehaviorSubject<StoreState50>({ users: [], loading: false, filter: '' });
  readonly state = toSignal(this.state$, { initialValue: { users: [], loading: false, filter: '' } as StoreState50, injector: undefined as any });
  patch(partial: Partial<StoreState50>) { this.state$.next({ ...this.state$.value, ...partial }); }
  loadUsers() {
    this.patch({ loading: true });
    of([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }, { id: 3, name: 'Carol' }]).pipe(delay(500))
      .subscribe(users => this.patch({ users, loading: false }));
  }
}
@Component({
  selector: 'ex-50', standalone: true, imports: [CommonModule, FormsModule],
  template: `
    <button (click)="store.loadUsers()">Load Users</button>
    <input [(ngModel)]="filter" (ngModelChange)="store.patch({filter:$event})" placeholder="Filter..." />
    @if (store.state().loading) { <p>Loading...</p> }
    <ul>@for (u of filtered(); track u.id) { <li>{{ u.name }}</li> }</ul>`
})
class Ex50 {
  store = new SignalStore50();
  filter = '';
  filtered = computed(() => {
    const { users, filter } = this.store.state();
    return filter ? users.filter(u => u.name.toLowerCase().includes(filter.toLowerCase())) : users;
  });
}

@Component({
  selector: 'app-root', standalone: true,
  imports: [
    CommonModule,
    Ex01, Ex02, Ex03, Ex04, Ex05, Ex06, Ex07, Ex08, Ex09, Ex10,
    Ex11, Ex12, Ex13, Ex14, Ex15, Ex16, Ex17, Ex18, Ex19, Ex20,
    Ex21, Ex22, Ex23, Ex24, Ex25, Ex26, Ex27, Ex28, Ex29, Ex30,
    Ex31, Ex32, Ex33, Ex34, Ex35, Ex36, Ex37, Ex38, Ex39, Ex40,
    Ex41, Ex42, Ex43, Ex44, Ex45, Ex46, Ex47, Ex48, Ex49, Ex50
  ],
  template: `
    <div style="font-family:sans-serif;max-width:700px;margin:0 auto;padding:20px">
      <h1>Examples 5.5 — RxJS Subjects</h1>
      <h4>1. Subject — emit and subscribe</h4><ex-01 /><hr />
      <h4>2. Subject multicast (two subscribers)</h4><ex-02 /><hr />
      <h4>3. Subject as event bus</h4><ex-03 /><hr />
      <h4>4. BehaviorSubject with initial value</h4><ex-04 /><hr />
      <h4>5. BehaviorSubject .getValue() / .value</h4><ex-05 /><hr />
      <h4>6. BehaviorSubject as current state</h4><ex-06 /><hr />
      <h4>7. ReplaySubject(1) — late subscriber gets last value</h4><ex-07 /><hr />
      <h4>8. ReplaySubject(3) — last 3 values buffered</h4><ex-08 /><hr />
      <h4>9. AsyncSubject — only emits on complete</h4><ex-09 /><hr />
      <h4>10. Subject .complete()</h4><ex-10 /><hr />
      <h4>11. Subject .error()</h4><ex-11 /><hr />
      <h4>12. Subject late subscriber misses values</h4><ex-12 /><hr />
      <h4>13. Subject unsubscribe pattern</h4><ex-13 /><hr />
      <h4>14. BehaviorSubject as login/logout state</h4><ex-14 /><hr />
      <h4>15. BehaviorSubject .asObservable() encapsulation</h4><ex-15 /><hr />
      <h4>16. ReplaySubject for notification replay</h4><ex-16 /><hr />
      <h4>17. AsyncSubject for single computed result</h4><ex-17 /><hr />
      <h4>18. Subject as action dispatcher</h4><ex-18 /><hr />
      <h4>19. Subject in service as event bus</h4><ex-19 /><hr />
      <h4>20. Subject for sibling component communication</h4><ex-20 /><hr />
      <h4>21. BehaviorSubject + toSignal bridge</h4><ex-21 /><hr />
      <h4>22. ReplaySubject undo buffer (3 states)</h4><ex-22 /><hr />
      <h4>23. Subject with map/filter operators</h4><ex-23 /><hr />
      <h4>24. Subject with takeUntilDestroyed cleanup</h4><ex-24 /><hr />
      <h4>25. Subject hot observable behavior</h4><ex-25 /><hr />
      <h4>26. Multiple subjects coordinating in service</h4><ex-26 /><hr />
      <h4>27. BehaviorSubject shared state between two components</h4><ex-27 /><hr />
      <h4>28. Subject event bus in service consumed by many components</h4><ex-28 /><hr />
      <h4>29. Multiple components subscribing to one BehaviorSubject</h4><ex-29 /><hr />
      <h4>30. Subject chained: subject1 → map → subject2</h4><ex-30 /><hr />
      <h4>31. BehaviorSubject + computed signal combo</h4><ex-31 /><hr />
      <h4>32. Shopping cart BehaviorSubject</h4><ex-32 /><hr />
      <h4>33. Auth BehaviorSubject (login/logout user object)</h4><ex-33 /><hr />
      <h4>34. Theme BehaviorSubject (dark/light)</h4><ex-34 /><hr />
      <h4>35. Notification Subject</h4><ex-35 /><hr />
      <h4>36. WebSocket simulation with Subject</h4><ex-36 /><hr />
      <h4>37. Action stream Subject with scan for state</h4><ex-37 /><hr />
      <h4>38. Full pub-sub system with Subject</h4><ex-38 /><hr />
      <h4>39. Subject vs BehaviorSubject vs ReplaySubject vs AsyncSubject</h4><ex-39 /><hr />
      <h4>40. SubjectLike&lt;T&gt; interface</h4><ex-40 /><hr />
      <h4>41. observeOn(asyncScheduler) with Subject</h4><ex-41 /><hr />
      <h4>42. Subject with throttleTime for rapid events</h4><ex-42 /><hr />
      <h4>43. Subject for debounced autosave</h4><ex-43 /><hr />
      <h4>44. Subject as action stream (Redux-like reducer)</h4><ex-44 /><hr />
      <h4>45. withLatestFrom BehaviorSubject</h4><ex-45 /><hr />
      <h4>46. scan with Subject for state accumulation</h4><ex-46 /><hr />
      <h4>47. ConnectableObservable via Subject</h4><ex-47 /><hr />
      <h4>48. multicast() deprecated → share() migration</h4><ex-48 /><hr />
      <h4>49. Subject memory leak prevention (takeUntilDestroyed)</h4><ex-49 /><hr />
      <h4>50. Full signal store backed by BehaviorSubject</h4><ex-50 /><hr />
    </div>`
})
export class AppComponent {}
