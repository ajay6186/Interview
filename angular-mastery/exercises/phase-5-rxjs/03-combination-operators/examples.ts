import { Component, signal, computed, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  combineLatest, forkJoin, merge, concat, zip, race,
  of, timer, interval, Subject, BehaviorSubject, EMPTY,
  Observable, from
} from 'rxjs';
import {
  map, startWith, endWith, pairwise, withLatestFrom,
  combineLatestWith, mergeWith, concatWith, debounceTime,
  distinctUntilChanged, catchError, retry, delay, take,
  switchMap, shareReplay, throttleTime, scan
} from 'rxjs/operators';
import { FormsModule } from '@angular/forms';

// ============================================================
// Examples 5.3 — RxJS Combination Operators (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ───────────────────────────────────────────

// 1. combineLatest([a$, b$]) — emit both latest values
@Component({
  selector: 'ex-01', standalone: true,
  template: `<p>combineLatest: {{ result() | json }}</p>`
})
class Ex01 implements OnInit {
  result = signal<number[]>([]);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    const a$ = of(1, 2, 3);
    const b$ = of('A', 'B', 'C');
    combineLatest([a$, b$]).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(val => this.result.set(val as any));
  }
}

// 2. forkJoin([a$, b$]) — wait for both to complete
@Component({
  selector: 'ex-02', standalone: true,
  template: `<p>forkJoin result: {{ result() | json }}</p>`
})
class Ex02 implements OnInit {
  result = signal<any[]>([]);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    forkJoin([of(42).pipe(delay(100)), of('done').pipe(delay(200))])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(val => this.result.set(val));
  }
}

// 3. merge(a$, b$) — merge two streams
@Component({
  selector: 'ex-03', standalone: true,
  template: `<p>merge emissions: {{ values() | json }}</p>`
})
class Ex03 implements OnInit {
  values = signal<number[]>([]);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    merge(of(1, 2, 3), of(10, 20, 30))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.values.update(arr => [...arr, v]));
  }
}

// 4. concat(a$, b$) — sequential streams
@Component({
  selector: 'ex-04', standalone: true,
  template: `<p>concat sequence: {{ values() | json }}</p>`
})
class Ex04 implements OnInit {
  values = signal<string[]>([]);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    concat(of('first', 'second'), of('third', 'fourth'))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.values.update(arr => [...arr, v]));
  }
}

// 5. zip([a$, b$]) — pair values by index
@Component({
  selector: 'ex-05', standalone: true,
  template: `<p>zip pairs: {{ pairs() | json }}</p>`
})
class Ex05 implements OnInit {
  pairs = signal<any[][]>([]);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    zip([of('Alice', 'Bob', 'Carol'), of(90, 85, 92)])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(pair => this.pairs.update(arr => [...arr, pair]));
  }
}

// 6. race([a$, b$]) — first to emit wins
@Component({
  selector: 'ex-06', standalone: true,
  template: `<p>race winner: {{ winner() }}</p>`
})
class Ex06 implements OnInit {
  winner = signal<string>('waiting...');
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    const fast$ = of('fast').pipe(delay(100));
    const slow$ = of('slow').pipe(delay(500));
    race([fast$, slow$]).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.winner.set(v));
  }
}

// 7. startWith(value) — prepend initial value
@Component({
  selector: 'ex-07', standalone: true,
  template: `<p>startWith: {{ values() | json }}</p>`
})
class Ex07 implements OnInit {
  values = signal<any[]>([]);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    of(1, 2, 3).pipe(startWith(0), takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.values.update(arr => [...arr, v]));
  }
}

// 8. endWith(value) — append final value
@Component({
  selector: 'ex-08', standalone: true,
  template: `<p>endWith: {{ values() | json }}</p>`
})
class Ex08 implements OnInit {
  values = signal<any[]>([]);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    of(1, 2, 3).pipe(endWith(99), takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.values.update(arr => [...arr, v]));
  }
}

// 9. pairwise() — emit [prev, current] pairs
@Component({
  selector: 'ex-09', standalone: true,
  template: `<p>pairwise: {{ pairs() | json }}</p>`
})
class Ex09 implements OnInit {
  pairs = signal<any[][]>([]);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    of(10, 20, 30, 40).pipe(pairwise(), takeUntilDestroyed(this.destroyRef))
      .subscribe(pair => this.pairs.update(arr => [...arr, pair]));
  }
}

// 10. withLatestFrom(b$) — snapshot b when a emits
@Component({
  selector: 'ex-10', standalone: true,
  template: `<p>withLatestFrom: {{ result() | json }}</p><button (click)="trigger()">Trigger</button>`
})
class Ex10 implements OnInit {
  result = signal<any[]>([]);
  private trigger$ = new Subject<void>();
  private counter$ = new BehaviorSubject<number>(0);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    setInterval(() => this.counter$.next(this.counter$.value + 1), 1000);
    this.trigger$.pipe(
      withLatestFrom(this.counter$),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(([, count]) => this.result.set([count]));
  }
  trigger() { this.trigger$.next(); }
}

// 11. combineLatestWith(b$) — pipeable combineLatest
@Component({
  selector: 'ex-11', standalone: true,
  template: `<p>combineLatestWith: {{ result() | json }}</p>`
})
class Ex11 implements OnInit {
  result = signal<any>([]);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    of('X', 'Y').pipe(
      combineLatestWith(of(1, 2)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => this.result.set(v));
  }
}

// 12. mergeWith(b$) — pipeable merge
@Component({
  selector: 'ex-12', standalone: true,
  template: `<p>mergeWith: {{ values() | json }}</p>`
})
class Ex12 implements OnInit {
  values = signal<any[]>([]);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    of('a', 'b').pipe(
      mergeWith(of('c', 'd')),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => this.values.update(arr => [...arr, v]));
  }
}

// 13. concatWith(b$) — pipeable concat
@Component({
  selector: 'ex-13', standalone: true,
  template: `<p>concatWith: {{ values() | json }}</p>`
})
class Ex13 implements OnInit {
  values = signal<any[]>([]);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    of('first').pipe(
      concatWith(of('second'), of('third')),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => this.values.update(arr => [...arr, v]));
  }
}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────

// 14. combineLatest for two sliders displaying sum
@Component({
  selector: 'ex-14', standalone: true, imports: [FormsModule, CommonModule],
  template: `
    <div>A: <input type="range" min="0" max="100" [(ngModel)]="sliderA" (ngModelChange)="updateA($event)" /></div>
    <div>B: <input type="range" min="0" max="100" [(ngModel)]="sliderB" (ngModelChange)="updateB($event)" /></div>
    <p>Sum: {{ sum() }}</p>`
})
class Ex14 {
  sliderA = 50; sliderB = 50;
  private a$ = new BehaviorSubject<number>(50);
  private b$ = new BehaviorSubject<number>(50);
  sum = toSignal(combineLatest([this.a$, this.b$]).pipe(map(([a, b]) => a + b)), { initialValue: 100 });
  updateA(v: number) { this.a$.next(+v); }
  updateB(v: number) { this.b$.next(+v); }
}

// 15. forkJoin for parallel simulated API calls
@Component({
  selector: 'ex-15', standalone: true, imports: [CommonModule],
  template: `
    <p>forkJoin parallel results:</p>
    @if (loading()) { <p>Loading...</p> }
    @if (!loading()) { <p>Users: {{ result()?.users }}, Posts: {{ result()?.posts }}</p> }`
})
class Ex15 implements OnInit {
  loading = signal(true);
  result = signal<any>(null);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    forkJoin({
      users: of(['Alice', 'Bob']).pipe(delay(200)),
      posts: of(['Post1', 'Post2']).pipe(delay(300))
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => { this.result.set(res); this.loading.set(false); });
  }
}

// 16. merge for two button click streams
@Component({
  selector: 'ex-16', standalone: true,
  template: `
    <button (click)="btnA$.next('A clicked')">Button A</button>
    <button (click)="btnB$.next('B clicked')">Button B</button>
    <p>Last: {{ last() }}</p>`
})
class Ex16 {
  btnA$ = new Subject<string>();
  btnB$ = new Subject<string>();
  last = toSignal(merge(this.btnA$, this.btnB$), { initialValue: 'none' });
}

// 17. concat for sequential messages
@Component({
  selector: 'ex-17', standalone: true,
  template: `<p>Sequential: {{ messages() | json }}</p><button (click)="run()">Run</button>`
})
class Ex17 {
  messages = signal<string[]>([]);
  private destroyRef = inject(DestroyRef);
  run() {
    this.messages.set([]);
    concat(
      of('Step 1').pipe(delay(100)),
      of('Step 2').pipe(delay(100)),
      of('Step 3').pipe(delay(100))
    ).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(m => this.messages.update(arr => [...arr, m]));
  }
}

// 18. zip pairing names with scores
@Component({
  selector: 'ex-18', standalone: true, imports: [CommonModule],
  template: `<ul>@for (p of pairs(); track p[0]) { <li>{{ p[0] }}: {{ p[1] }}</li> }</ul>`
})
class Ex18 implements OnInit {
  pairs = signal<any[][]>([]);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    zip([of('Alice', 'Bob', 'Carol'), of(95, 87, 91)])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(pair => this.pairs.update(arr => [...arr, pair]));
  }
}

// 19. withLatestFrom getting snapshot of counter
@Component({
  selector: 'ex-19', standalone: true,
  template: `<button (click)="snap()">Snapshot Counter</button><p>Counter at click: {{ snapped() }}</p>`
})
class Ex19 implements OnInit {
  snapped = signal<number>(0);
  private click$ = new Subject<void>();
  private counter$ = new BehaviorSubject<number>(0);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    interval(1000).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(n => this.counter$.next(n));
    this.click$.pipe(
      withLatestFrom(this.counter$),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(([, n]) => this.snapped.set(n));
  }
  snap() { this.click$.next(); }
}

// 20. combineLatest with map to derived display
@Component({
  selector: 'ex-20', standalone: true, imports: [FormsModule],
  template: `
    First: <input [(ngModel)]="firstName" (ngModelChange)="fn$.next($event)" />
    Last: <input [(ngModel)]="lastName" (ngModelChange)="ln$.next($event)" />
    <p>Full: {{ fullName() }}</p>`
})
class Ex20 {
  firstName = 'John'; lastName = 'Doe';
  fn$ = new BehaviorSubject<string>('John');
  ln$ = new BehaviorSubject<string>('Doe');
  fullName = toSignal(
    combineLatest([this.fn$, this.ln$]).pipe(map(([f, l]) => `${f} ${l}`)),
    { initialValue: 'John Doe' }
  );
}

// 21. forkJoin with error handling (catchError per stream)
@Component({
  selector: 'ex-21', standalone: true,
  template: `<p>forkJoin safe: {{ result() | json }}</p>`
})
class Ex21 implements OnInit {
  result = signal<any>(null);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    forkJoin({
      safe: of('ok').pipe(delay(100)),
      risky: of(null).pipe(delay(100), switchMap(() => { throw new Error('fail'); }), catchError(() => of('fallback')))
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(r => this.result.set(r));
  }
}

// 22. merge with debounce on each stream
@Component({
  selector: 'ex-22', standalone: true,
  template: `<input (input)="a$.next($any($event.target).value)" placeholder="A" />
             <input (input)="b$.next($any($event.target).value)" placeholder="B" />
             <p>Debounced merge: {{ last() }}</p>`
})
class Ex22 {
  a$ = new Subject<string>();
  b$ = new Subject<string>();
  last = toSignal(
    merge(this.a$.pipe(debounceTime(300)), this.b$.pipe(debounceTime(300))),
    { initialValue: '' }
  );
}

// 23. combineLatest with @if (show when all ready)
@Component({
  selector: 'ex-23', standalone: true, imports: [CommonModule],
  template: `
    @if (ready()) { <p>Both ready: {{ data() | json }}</p> }
    @if (!ready()) { <p>Waiting...</p> }`
})
class Ex23 implements OnInit {
  ready = signal(false);
  data = signal<any>(null);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    combineLatest([of('user').pipe(delay(200)), of('config').pipe(delay(300))])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([user, config]) => { this.data.set({ user, config }); this.ready.set(true); });
  }
}

// 24. forkJoin loading state pattern
@Component({
  selector: 'ex-24', standalone: true, imports: [CommonModule],
  template: `
    @if (loading()) { <p>Loading page data...</p> }
    @if (!loading()) { <p>{{ data() | json }}</p> }`
})
class Ex24 implements OnInit {
  loading = signal(true);
  data = signal<any>(null);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    forkJoin({ profile: of({ name: 'Alice' }).pipe(delay(200)), settings: of({ theme: 'dark' }).pipe(delay(150)) })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(d => { this.data.set(d); this.loading.set(false); });
  }
}

// 25. zip alignment demo (different rates)
@Component({
  selector: 'ex-25', standalone: true, imports: [CommonModule],
  template: `<p>zip aligned: @for (p of pairs(); track $index) { [{{ p[0] }},{{ p[1] }}] } </p>`
})
class Ex25 implements OnInit {
  pairs = signal<any[][]>([]);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    zip([of(1, 2, 3, 4), of('A', 'B', 'C')])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(pair => this.pairs.update(arr => [...arr, pair]));
  }
}

// 26. race demo (fastest wins)
@Component({
  selector: 'ex-26', standalone: true,
  template: `<p>Race winner: {{ winner() }}</p><button (click)="run()">Run Race</button>`
})
class Ex26 {
  winner = signal('not started');
  private destroyRef = inject(DestroyRef);
  run() {
    this.winner.set('racing...');
    race([
      of('Server A').pipe(delay(Math.random() * 400 + 100)),
      of('Server B').pipe(delay(Math.random() * 400 + 100)),
      of('Server C').pipe(delay(Math.random() * 400 + 100))
    ]).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(w => this.winner.set(w));
  }
}

// ─── NESTED (27–38) ──────────────────────────────────────────

// 27. combineLatest of 3 signals converted to observables
@Component({
  selector: 'ex-27', standalone: true, imports: [FormsModule],
  template: `
    <input type="number" [(ngModel)]="a" (ngModelChange)="a$.next(+$event)" />
    <input type="number" [(ngModel)]="b" (ngModelChange)="b$.next(+$event)" />
    <input type="number" [(ngModel)]="c" (ngModelChange)="c$.next(+$event)" />
    <p>Sum of 3: {{ total() }}</p>`
})
class Ex27 {
  a = 1; b = 2; c = 3;
  a$ = new BehaviorSubject<number>(1);
  b$ = new BehaviorSubject<number>(2);
  c$ = new BehaviorSubject<number>(3);
  total = toSignal(
    combineLatest([this.a$, this.b$, this.c$]).pipe(map(([a, b, c]) => a + b + c)),
    { initialValue: 6 }
  );
}

// 28. forkJoin of 3+ simulated HTTP calls
@Component({
  selector: 'ex-28', standalone: true, imports: [CommonModule],
  template: `
    @if (loading()) { <p>Loading 3 APIs...</p> }
    @if (!loading()) { <p>{{ result() | json }}</p> }`
})
class Ex28 implements OnInit {
  loading = signal(true);
  result = signal<any>(null);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    forkJoin({
      users: of([{ id: 1, name: 'Alice' }]).pipe(delay(100)),
      posts: of([{ id: 1, title: 'Hello' }]).pipe(delay(200)),
      comments: of([{ id: 1, text: 'Nice' }]).pipe(delay(150))
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(r => { this.result.set(r); this.loading.set(false); });
  }
}

// 29. nested combineLatest (outer combines two combineLatests)
@Component({
  selector: 'ex-29', standalone: true, imports: [FormsModule],
  template: `
    Left: <input type="number" [(ngModel)]="l1" (ngModelChange)="l1$.next(+$event)" />
    + <input type="number" [(ngModel)]="l2" (ngModelChange)="l2$.next(+$event)" />
    Right: <input type="number" [(ngModel)]="r1" (ngModelChange)="r1$.next(+$event)" />
    + <input type="number" [(ngModel)]="r2" (ngModelChange)="r2$.next(+$event)" />
    <p>Grand Total: {{ grandTotal() }}</p>`
})
class Ex29 {
  l1 = 1; l2 = 2; r1 = 3; r2 = 4;
  l1$ = new BehaviorSubject(1); l2$ = new BehaviorSubject(2);
  r1$ = new BehaviorSubject(3); r2$ = new BehaviorSubject(4);
  left$ = combineLatest([this.l1$, this.l2$]).pipe(map(([a, b]) => a + b));
  right$ = combineLatest([this.r1$, this.r2$]).pipe(map(([a, b]) => a + b));
  grandTotal = toSignal(
    combineLatest([this.left$, this.right$]).pipe(map(([l, r]) => l + r)),
    { initialValue: 10 }
  );
}

// 30. combineLatest inside switchMap
@Component({
  selector: 'ex-30', standalone: true,
  template: `<button (click)="load()">Load</button><p>{{ result() }}</p>`
})
class Ex30 {
  result = signal('idle');
  private load$ = new Subject<void>();
  private destroyRef = inject(DestroyRef);
  constructor() {
    this.load$.pipe(
      switchMap(() => combineLatest([
        of('user data').pipe(delay(100)),
        of('config data').pipe(delay(150))
      ]).pipe(map(([u, c]) => `${u} + ${c}`))),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(r => this.result.set(r));
  }
  load() { this.load$.next(); }
}

// 31. forkJoin with retry per individual stream
@Component({
  selector: 'ex-31', standalone: true,
  template: `<p>forkJoin retry: {{ result() | json }}</p>`
})
class Ex31 implements OnInit {
  result = signal<any>(null);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    let attempts = 0;
    const unstable$ = new Observable<string>(obs => {
      attempts++;
      if (attempts < 2) { obs.error('fail'); } else { obs.next('success'); obs.complete(); }
    });
    forkJoin({
      stable: of('ok').pipe(delay(100)),
      unstable: unstable$.pipe(retry(3), catchError(() => of('fallback')))
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(r => this.result.set(r));
  }
}

// 32. merge of multiple event type streams
@Component({
  selector: 'ex-32', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="click$.next('click')">Click</button>
    <button (click)="hover$.next('hover')">Hover</button>
    <ul>@for (e of events(); track $index) { <li>{{ e }}</li> }</ul>`
})
class Ex32 {
  click$ = new Subject<string>();
  hover$ = new Subject<string>();
  timer$ = timer(2000, 3000).pipe(map(i => `timer-${i}`), take(3));
  events = toSignal(
    merge(this.click$, this.hover$, this.timer$).pipe(
      scan((acc: string[], v) => [...acc.slice(-4), v], [])
    ), { initialValue: [] as string[] }
  );
}

// 33. zip with transform map
@Component({
  selector: 'ex-33', standalone: true, imports: [CommonModule],
  template: `<ul>@for (item of items(); track item.name) { <li>{{ item.name }} — ${{ item.price }}</li> }</ul>`
})
class Ex33 implements OnInit {
  items = signal<{ name: string; price: number }[]>([]);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    zip([of('Apple', 'Banana', 'Cherry'), of(1.2, 0.5, 3.0)])
      .pipe(
        map(([name, price]) => ({ name: name as string, price: price as number })),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(item => this.items.update(arr => [...arr, item]));
  }
}

// 34. combineLatest for form field dependencies
@Component({
  selector: 'ex-34', standalone: true, imports: [FormsModule],
  template: `
    Country: <select [(ngModel)]="country" (ngModelChange)="country$.next($event)">
      <option>US</option><option>UK</option></select>
    Currency: <select [(ngModel)]="currency" (ngModelChange)="currency$.next($event)">
      <option>USD</option><option>GBP</option></select>
    Amount: <input type="number" [(ngModel)]="amount" (ngModelChange)="amount$.next(+$event)" />
    <p>{{ summary() }}</p>`
})
class Ex34 {
  country = 'US'; currency = 'USD'; amount = 100;
  country$ = new BehaviorSubject('US');
  currency$ = new BehaviorSubject('USD');
  amount$ = new BehaviorSubject(100);
  summary = toSignal(
    combineLatest([this.country$, this.currency$, this.amount$])
      .pipe(map(([c, cur, amt]) => `${c}: ${amt} ${cur}`)),
    { initialValue: 'US: 100 USD' }
  );
}

// 35. Combination in service, displayed in component
class DashboardService {
  readonly data$ = forkJoin({
    stats: of({ visits: 1200, sales: 45 }).pipe(delay(200)),
    user: of({ name: 'Admin' }).pipe(delay(100))
  });
}
@Component({
  selector: 'ex-35', standalone: true, imports: [CommonModule],
  template: `
    @if (loading()) { <p>Loading dashboard...</p> }
    @if (!loading()) { <p>{{ data() | json }}</p> }`
})
class Ex35 implements OnInit {
  private svc = new DashboardService();
  loading = signal(true);
  data = signal<any>(null);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    this.svc.data$.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(d => { this.data.set(d); this.loading.set(false); });
  }
}

// 36. Dashboard combining multiple data observables
@Component({
  selector: 'ex-36', standalone: true, imports: [CommonModule],
  template: `
    @if (ready()) {
      <div>Users: {{ dash().users }} | Posts: {{ dash().posts }} | Score: {{ dash().score }}</div>
    } @else { <p>Loading dashboard...</p> }`
})
class Ex36 implements OnInit {
  ready = signal(false);
  dash = signal<any>({});
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    combineLatest({
      users: of(42).pipe(delay(100)),
      posts: of(123).pipe(delay(150)),
      score: of(98.5).pipe(delay(80))
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(d => { this.dash.set(d); this.ready.set(true); });
  }
}

// 37. Real-time display combining user + stats + messages
@Component({
  selector: 'ex-37', standalone: true, imports: [CommonModule],
  template: `
    @if (data()) {
      <p>User: {{ data().user.name }} | Msgs: {{ data().messages.length }} | Score: {{ data().stats.score }}</p>
    } @else { <p>Loading...</p> }`
})
class Ex37 implements OnInit {
  data = signal<any>(null);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    combineLatest({
      user: of({ name: 'Alice' }).pipe(delay(100)),
      stats: of({ score: 95 }).pipe(delay(120)),
      messages: of(['Hello', 'World']).pipe(delay(80))
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(d => this.data.set(d));
  }
}

// 38. forkJoin for page initialization data
@Component({
  selector: 'ex-38', standalone: true, imports: [CommonModule],
  template: `
    @if (pageReady()) {
      <p>Profile: {{ pageData().profile.name }} | Prefs: {{ pageData().prefs.theme }}</p>
    } @else { <p>Initializing page...</p> }`
})
class Ex38 implements OnInit {
  pageReady = signal(false);
  pageData = signal<any>({});
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    forkJoin({
      profile: of({ name: 'Bob', email: 'bob@example.com' }).pipe(delay(200)),
      prefs: of({ theme: 'dark', lang: 'en' }).pipe(delay(150)),
      permissions: of(['read', 'write']).pipe(delay(100))
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(d => { this.pageData.set(d); this.pageReady.set(true); });
  }
}

// ─── ADVANCED (39–50) ────────────────────────────────────────

// 39. combineLatest with distinctUntilChanged + debounce
@Component({
  selector: 'ex-39', standalone: true, imports: [FormsModule],
  template: `
    <input [(ngModel)]="q" (ngModelChange)="q$.next($event)" placeholder="Search" />
    <input type="number" [(ngModel)]="page" (ngModelChange)="p$.next(+$event)" />
    <p>Debounced query: "{{ result() }}"</p>`
})
class Ex39 {
  q = ''; page = 1;
  q$ = new BehaviorSubject('');
  p$ = new BehaviorSubject(1);
  result = toSignal(
    combineLatest([
      this.q$.pipe(debounceTime(300), distinctUntilChanged()),
      this.p$.pipe(distinctUntilChanged())
    ]).pipe(map(([q, p]) => `${q} page:${p}`)),
    { initialValue: ' page:1' }
  );
}

// 40. Custom combination operator
function combineAndLabel<T>(label: string) {
  return (source$: Observable<T>) =>
    source$.pipe(map(v => `[${label}] ${v}`));
}
@Component({
  selector: 'ex-40', standalone: true, imports: [CommonModule],
  template: `<ul>@for (v of values(); track $index) { <li>{{ v }}</li> }</ul>`
})
class Ex40 implements OnInit {
  values = signal<string[]>([]);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    merge(
      of('alpha').pipe(combineAndLabel('A')),
      of('beta').pipe(combineAndLabel('B'))
    ).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.values.update(arr => [...arr, v]));
  }
}

// 41. forkJoin typed as {users, posts, comments}
interface PageData { users: string[]; posts: string[]; comments: string[]; }
@Component({
  selector: 'ex-41', standalone: true, imports: [CommonModule],
  template: `@if (data()) { <p>{{ data()!.users.length }} users, {{ data()!.posts.length }} posts</p> }`
})
class Ex41 implements OnInit {
  data = signal<PageData | null>(null);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    forkJoin({
      users: of(['Alice', 'Bob']).pipe(delay(100)),
      posts: of(['Post1', 'Post2', 'Post3']).pipe(delay(150)),
      comments: of(['Comment1']).pipe(delay(80))
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((d: PageData) => this.data.set(d));
  }
}

// 42. zipWith (RxJS 7+ pipeable)
@Component({
  selector: 'ex-42', standalone: true, imports: [CommonModule],
  template: `<p>zipWith pairs: @for (p of pairs(); track $index) { {{ p | json }} } </p>`
})
class Ex42 implements OnInit {
  pairs = signal<any[][]>([]);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    import('rxjs').then(({ zip: zipOp }) => {
      zipOp(of(1, 2, 3), of('one', 'two', 'three'))
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(pair => this.pairs.update(arr => [...arr, pair]));
    });
  }
}

// 43. combineLatestAll (higher-order)
@Component({
  selector: 'ex-43', standalone: true,
  template: `<p>combineLatestAll: {{ result() | json }}</p>`
})
class Ex43 implements OnInit {
  result = signal<any[]>([]);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    const streams$ = of(
      new BehaviorSubject(1),
      new BehaviorSubject(2),
      new BehaviorSubject(3)
    );
    streams$.pipe(
      map(s => s.asObservable())
    ).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
    combineLatest([of(10), of(20), of(30)])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.result.set(v));
  }
}

// 44. mergeAll (higher-order)
@Component({
  selector: 'ex-44', standalone: true, imports: [CommonModule],
  template: `<p>mergeAll values: {{ values() | json }}</p>`
})
class Ex44 implements OnInit {
  values = signal<number[]>([]);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    from([of(1, 2), of(3, 4), of(5, 6)]).pipe(
      (source$) => source$.pipe(switchMap(inner => inner)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => this.values.update(arr => [...arr, v]));
  }
}

// 45. concatAll (higher-order)
@Component({
  selector: 'ex-45', standalone: true, imports: [CommonModule],
  template: `<p>concatAll sequence: {{ values() | json }}</p>`
})
class Ex45 implements OnInit {
  values = signal<string[]>([]);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    from([
      of('A').pipe(delay(50)),
      of('B').pipe(delay(50)),
      of('C').pipe(delay(50))
    ]).pipe(
      (source$) => new Observable<string>(observer => {
        const obs: Observable<string>[] = [];
        source$.subscribe({
          next: inner => obs.push(inner as Observable<string>),
          complete: () => concat(...obs).subscribe(observer)
        });
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => this.values.update(arr => [...arr, v]));
  }
}

// 46. switchAll (higher-order)
@Component({
  selector: 'ex-46', standalone: true,
  template: `<button (click)="emit()">Emit Inner</button><p>switchAll latest: {{ latest() }}</p>`
})
class Ex46 {
  latest = signal('none');
  private outer$ = new Subject<Observable<string>>();
  private destroyRef = inject(DestroyRef);
  constructor() {
    this.outer$.pipe(
      switchMap(inner$ => inner$),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => this.latest.set(v));
  }
  emit() { this.outer$.next(of(`value-${Date.now()}`)); }
}

// 47. forkJoin with retry + fallback per stream
@Component({
  selector: 'ex-47', standalone: true,
  template: `<p>resilient forkJoin: {{ result() | json }}</p>`
})
class Ex47 implements OnInit {
  result = signal<any>(null);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    let attempts = 0;
    const flaky$ = new Observable<string>(obs => {
      if (++attempts < 3) obs.error('err'); else { obs.next('ok after retry'); obs.complete(); }
    });
    forkJoin({
      primary: flaky$.pipe(retry(3), catchError(() => of('fallback'))),
      secondary: of('always ok').pipe(delay(50))
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(r => this.result.set(r));
  }
}

// 48. combineLatest with shareReplay
@Component({
  selector: 'ex-48', standalone: true, imports: [CommonModule],
  template: `<p>shared combo: {{ result() | json }}</p><p>second: {{ result2() | json }}</p>`
})
class Ex48 implements OnInit {
  result = signal<any[]>([]);
  result2 = signal<any[]>([]);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    const shared$ = combineLatest([of('A', 'B'), of(1, 2)]).pipe(shareReplay(1));
    shared$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(v => this.result.set(v));
    setTimeout(() => {
      shared$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(v => this.result2.set(v));
    }, 100);
  }
}

// 49. Hot observable combination
@Component({
  selector: 'ex-49', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="send('hot-A')">Emit A</button>
    <button (click)="send('hot-B')">Emit B</button>
    <p>Hot combined: {{ values() | json }}</p>`
})
class Ex49 {
  private subjectA$ = new BehaviorSubject<string>('A0');
  private subjectB$ = new BehaviorSubject<string>('B0');
  values = toSignal(
    combineLatest([this.subjectA$, this.subjectB$]).pipe(map(([a, b]) => [a, b])),
    { initialValue: ['A0', 'B0'] }
  );
  send(src: string) {
    if (src === 'hot-A') this.subjectA$.next(`A-${Date.now()}`);
    else this.subjectB$.next(`B-${Date.now()}`);
  }
}

// 50. Full data aggregation pipeline
@Component({
  selector: 'ex-50', standalone: true, imports: [CommonModule],
  template: `
    @if (loading()) { <p>Aggregating data pipeline...</p> }
    @if (!loading()) {
      <div>
        <p>Users: {{ summary().totalUsers }} | Active: {{ summary().activeUsers }}</p>
        <p>Posts: {{ summary().totalPosts }} | Avg score: {{ summary().avgScore }}</p>
      </div>
    }`
})
class Ex50 implements OnInit {
  loading = signal(true);
  summary = signal<any>({});
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    forkJoin({
      users: of([{ id: 1, active: true }, { id: 2, active: false }, { id: 3, active: true }]).pipe(delay(100)),
      posts: of([{ id: 1, score: 80 }, { id: 2, score: 90 }, { id: 3, score: 70 }]).pipe(delay(150))
    }).pipe(
      map(({ users, posts }) => ({
        totalUsers: users.length,
        activeUsers: users.filter((u: any) => u.active).length,
        totalPosts: posts.length,
        avgScore: posts.reduce((s: number, p: any) => s + p.score, 0) / posts.length
      })),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(s => { this.summary.set(s); this.loading.set(false); });
  }
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
      <h1>Examples 5.3 — RxJS Combination Operators</h1>
      <h4>1. combineLatest([a$, b$]) — emit both latest values</h4><ex-01 /><hr />
      <h4>2. forkJoin([a$, b$]) — wait for both to complete</h4><ex-02 /><hr />
      <h4>3. merge(a$, b$) — merge two streams</h4><ex-03 /><hr />
      <h4>4. concat(a$, b$) — sequential streams</h4><ex-04 /><hr />
      <h4>5. zip([a$, b$]) — pair values by index</h4><ex-05 /><hr />
      <h4>6. race([a$, b$]) — first to emit wins</h4><ex-06 /><hr />
      <h4>7. startWith(value) — prepend initial value</h4><ex-07 /><hr />
      <h4>8. endWith(value) — append final value</h4><ex-08 /><hr />
      <h4>9. pairwise() — emit [prev, current] pairs</h4><ex-09 /><hr />
      <h4>10. withLatestFrom(b$) — snapshot b when a emits</h4><ex-10 /><hr />
      <h4>11. combineLatestWith(b$) — pipeable combineLatest</h4><ex-11 /><hr />
      <h4>12. mergeWith(b$) — pipeable merge</h4><ex-12 /><hr />
      <h4>13. concatWith(b$) — pipeable concat</h4><ex-13 /><hr />
      <h4>14. combineLatest for two sliders displaying sum</h4><ex-14 /><hr />
      <h4>15. forkJoin for parallel simulated API calls</h4><ex-15 /><hr />
      <h4>16. merge for two button click streams</h4><ex-16 /><hr />
      <h4>17. concat for sequential messages</h4><ex-17 /><hr />
      <h4>18. zip pairing names with scores</h4><ex-18 /><hr />
      <h4>19. withLatestFrom getting snapshot of counter</h4><ex-19 /><hr />
      <h4>20. combineLatest with map to derived display</h4><ex-20 /><hr />
      <h4>21. forkJoin with error handling (catchError per stream)</h4><ex-21 /><hr />
      <h4>22. merge with debounce on each stream</h4><ex-22 /><hr />
      <h4>23. combineLatest with @if (show when all ready)</h4><ex-23 /><hr />
      <h4>24. forkJoin loading state pattern</h4><ex-24 /><hr />
      <h4>25. zip alignment demo (different rates)</h4><ex-25 /><hr />
      <h4>26. race demo (fastest wins)</h4><ex-26 /><hr />
      <h4>27. combineLatest of 3 signals converted to observables</h4><ex-27 /><hr />
      <h4>28. forkJoin of 3+ simulated HTTP calls</h4><ex-28 /><hr />
      <h4>29. nested combineLatest (outer combines two combineLatests)</h4><ex-29 /><hr />
      <h4>30. combineLatest inside switchMap</h4><ex-30 /><hr />
      <h4>31. forkJoin with retry per individual stream</h4><ex-31 /><hr />
      <h4>32. merge of multiple event type streams</h4><ex-32 /><hr />
      <h4>33. zip with transform map</h4><ex-33 /><hr />
      <h4>34. combineLatest for form field dependencies</h4><ex-34 /><hr />
      <h4>35. Combination in service, displayed in component</h4><ex-35 /><hr />
      <h4>36. Dashboard combining multiple data observables</h4><ex-36 /><hr />
      <h4>37. Real-time display combining user + stats + messages</h4><ex-37 /><hr />
      <h4>38. forkJoin for page initialization data</h4><ex-38 /><hr />
      <h4>39. combineLatest with distinctUntilChanged + debounce</h4><ex-39 /><hr />
      <h4>40. Custom combination operator</h4><ex-40 /><hr />
      <h4>41. forkJoin typed as {users, posts, comments}</h4><ex-41 /><hr />
      <h4>42. zipWith (RxJS 7+ pipeable)</h4><ex-42 /><hr />
      <h4>43. combineLatestAll (higher-order)</h4><ex-43 /><hr />
      <h4>44. mergeAll (higher-order)</h4><ex-44 /><hr />
      <h4>45. concatAll (higher-order)</h4><ex-45 /><hr />
      <h4>46. switchAll (higher-order)</h4><ex-46 /><hr />
      <h4>47. forkJoin with retry + fallback per stream</h4><ex-47 /><hr />
      <h4>48. combineLatest with shareReplay</h4><ex-48 /><hr />
      <h4>49. Hot observable combination</h4><ex-49 /><hr />
      <h4>50. Full data aggregation pipeline</h4><ex-50 /><hr />
    </div>`
})
export class AppComponent {}
