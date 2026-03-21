import {
  Component, signal, inject, OnInit, OnDestroy, DestroyRef
} from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  of, from, interval, timer, Subject, BehaviorSubject, ReplaySubject, AsyncSubject,
  Observable, EMPTY, combineLatest, forkJoin, merge, zip,
  throwError
} from 'rxjs';
import {
  map, filter, tap, take, first, skip, debounceTime, distinctUntilChanged,
  switchMap, mergeMap, concatMap, exhaustMap, withLatestFrom, startWith,
  scan, reduce, catchError, retry, share, shareReplay
} from 'rxjs/operators';

// ── Ex01 – of() ─────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-01', standalone: true, imports: [CommonModule], template: `
    <p>Values from of(): {{ values | json }}</p>
  `
})
export class Ex01 implements OnInit {
  values: number[] = [];
  ngOnInit() { of(1, 2, 3, 4, 5).subscribe(v => this.values.push(v)); }
}

// ── Ex02 – from() ────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-02', standalone: true, imports: [CommonModule], template: `
    <p>from(array): {{ items | json }}</p>
  `
})
export class Ex02 implements OnInit {
  items: string[] = [];
  ngOnInit() { from(['Angular', 'RxJS', 'Signals']).subscribe(v => this.items.push(v)); }
}

// ── Ex03 – interval() ────────────────────────────────────────────────────────
@Component({
  selector: 'ex-03', standalone: true, template: `
    <p>Tick: {{ tick() }}</p>
  `
})
export class Ex03 {
  tick = toSignal(interval(1000).pipe(take(60)), { initialValue: 0 });
}

// ── Ex04 – timer() ───────────────────────────────────────────────────────────
@Component({
  selector: 'ex-04', standalone: true, template: `
    <p>{{ message() }}</p>
  `
})
export class Ex04 {
  message = toSignal(
    timer(2000).pipe(map(() => 'Timer fired after 2s!')),
    { initialValue: 'Waiting…' }
  );
}

// ── Ex05 – Subject ───────────────────────────────────────────────────────────
@Component({
  selector: 'ex-05', standalone: true, imports: [CommonModule], template: `
    <button (click)="emit()">Emit</button>
    <p>Last: {{ last }}</p>
  `
})
export class Ex05 implements OnInit, OnDestroy {
  subject = new Subject<number>();
  last = 0;
  ngOnInit() { this.subject.subscribe(v => (this.last = v)); }
  emit() { this.subject.next(Date.now() % 1000); }
  ngOnDestroy() { this.subject.complete(); }
}

// ── Ex06 – BehaviorSubject ───────────────────────────────────────────────────
@Component({
  selector: 'ex-06', standalone: true, imports: [AsyncPipe], template: `
    <p>Current: {{ bs$ | async }}</p>
    <button (click)="bs$.next(bs$.value + 1)">+1</button>
  `
})
export class Ex06 { bs$ = new BehaviorSubject(0); }

// ── Ex07 – ReplaySubject ──────────────────────────────────────────────────────
@Component({
  selector: 'ex-07', standalone: true, imports: [CommonModule], template: `
    <button (click)="push()">Emit</button>
    <button (click)="subscribe()">Late Subscribe</button>
    <p>Replayed: {{ replayed | json }}</p>
  `
})
export class Ex07 {
  rs = new ReplaySubject<number>(3);
  replayed: number[] = [];
  push() { this.rs.next(Date.now() % 100); }
  subscribe() { this.rs.subscribe(v => this.replayed.push(v)); }
}

// ── Ex08 – AsyncSubject ───────────────────────────────────────────────────────
@Component({
  selector: 'ex-08', standalone: true, template: `
    <button (click)="emit()">Emit</button>
    <button (click)="complete()">Complete</button>
    <p>Value: {{ val }}</p>
  `
})
export class Ex08 implements OnInit {
  as = new AsyncSubject<number>();
  val: number | null = null;
  ngOnInit() { this.as.subscribe(v => (this.val = v)); }
  emit() { this.as.next(Date.now() % 100); }
  complete() { this.as.complete(); }
}

// ── Ex09 – subscribe / unsubscribe ───────────────────────────────────────────
@Component({
  selector: 'ex-09', standalone: true, template: `
    <button (click)="start()">Start</button>
    <button (click)="stop()">Stop</button>
    <p>Tick: {{ tick }}</p>
  `
})
export class Ex09 implements OnDestroy {
  tick = 0;
  private sub = interval(500).subscribe(v => (this.tick = v));
  start() { if (this.sub.closed) this.sub = interval(500).subscribe(v => (this.tick = v)); }
  stop() { this.sub.unsubscribe(); }
  ngOnDestroy() { this.sub.unsubscribe(); }
}

// ── Ex10 – async pipe ────────────────────────────────────────────────────────
@Component({
  selector: 'ex-10', standalone: true, imports: [AsyncPipe], template: `
    <p>Async: {{ obs$ | async }}</p>
  `
})
export class Ex10 {
  obs$ = interval(1000).pipe(map(i => `tick ${i}`), take(10));
}

// ── Ex11 – takeUntilDestroyed ─────────────────────────────────────────────────
@Component({
  selector: 'ex-11', standalone: true, template: `<p>Tick: {{ tick }}</p>`
})
export class Ex11 {
  tick = 0;
  constructor() {
    interval(1000).pipe(takeUntilDestroyed()).subscribe(v => (this.tick = v));
  }
}

// ── Ex12 – map ────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-12', standalone: true, imports: [CommonModule], template: `
    <p>Mapped: {{ values | json }}</p>
  `
})
export class Ex12 implements OnInit {
  values: string[] = [];
  ngOnInit() {
    of(1, 2, 3).pipe(map(n => `Item ${n}`)).subscribe(v => this.values.push(v));
  }
}

// ── Ex13 – filter ─────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-13', standalone: true, imports: [CommonModule], template: `
    <p>Evens: {{ evens | json }}</p>
  `
})
export class Ex13 implements OnInit {
  evens: number[] = [];
  ngOnInit() {
    of(1, 2, 3, 4, 5, 6).pipe(filter(n => n % 2 === 0)).subscribe(v => this.evens.push(v));
  }
}

// ── Ex14 – tap ────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-14', standalone: true, imports: [CommonModule], template: `
    <p>Values: {{ vals | json }}</p>
  `
})
export class Ex14 implements OnInit {
  vals: number[] = [];
  ngOnInit() {
    of(10, 20, 30)
      .pipe(tap(v => console.log('[Ex14 tap]', v)))
      .subscribe(v => this.vals.push(v));
  }
}

// ── Ex15 – take ───────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-15', standalone: true, template: `<p>Count: {{ count }}</p>`
})
export class Ex15 implements OnInit {
  count = 0;
  ngOnInit() { of(1, 2, 3, 4, 5).pipe(take(3)).subscribe(v => (this.count += v)); }
}

// ── Ex16 – first ──────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-16', standalone: true, template: `<p>First even: {{ val }}</p>`
})
export class Ex16 implements OnInit {
  val = 0;
  ngOnInit() {
    of(1, 3, 4, 5, 6).pipe(first(n => n % 2 === 0)).subscribe(v => (this.val = v));
  }
}

// ── Ex17 – skip ───────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-17', standalone: true, imports: [CommonModule], template: `
    <p>After skip(2): {{ vals | json }}</p>
  `
})
export class Ex17 implements OnInit {
  vals: number[] = [];
  ngOnInit() { of(1, 2, 3, 4, 5).pipe(skip(2)).subscribe(v => this.vals.push(v)); }
}

// ── Ex18 – debounceTime ───────────────────────────────────────────────────────
@Component({
  selector: 'ex-18', standalone: true, template: `
    <input (input)="subject.next($any($event.target).value)" placeholder="Type…">
    <p>Debounced: {{ debounced() }}</p>
  `
})
export class Ex18 {
  subject = new Subject<string>();
  debounced = toSignal(this.subject.pipe(debounceTime(400)), { initialValue: '' });
}

// ── Ex19 – distinctUntilChanged ───────────────────────────────────────────────
@Component({
  selector: 'ex-19', standalone: true, imports: [CommonModule], template: `
    <button (click)="emit(1)">Emit 1</button>
    <button (click)="emit(2)">Emit 2</button>
    <p>Distinct log: {{ log | json }}</p>
  `
})
export class Ex19 {
  private s = new Subject<number>();
  log: number[] = [];
  constructor() { this.s.pipe(distinctUntilChanged()).subscribe(v => this.log.push(v)); }
  emit(v: number) { this.s.next(v); }
}

// ── Ex20 – switchMap ──────────────────────────────────────────────────────────
@Component({
  selector: 'ex-20', standalone: true, template: `
    <input (input)="query.next($any($event.target).value)" placeholder="Search…">
    <p>Result: {{ result() }}</p>
  `
})
export class Ex20 {
  query = new Subject<string>();
  result = toSignal(
    this.query.pipe(
      debounceTime(300),
      switchMap(q => of(`Results for "${q}"`).pipe(take(1)))
    ),
    { initialValue: '' }
  );
}

// ── Ex21 – mergeMap ───────────────────────────────────────────────────────────
@Component({
  selector: 'ex-21', standalone: true, imports: [CommonModule], template: `
    <button (click)="click$.next()">Click (mergeMap)</button>
    <p>Results: {{ results | json }}</p>
  `
})
export class Ex21 {
  click$ = new Subject<void>();
  results: string[] = [];
  constructor() {
    this.click$.pipe(
      mergeMap(() => timer(500).pipe(map(() => `done at ${Date.now() % 10000}`)))
    ).subscribe(r => this.results.push(r));
  }
}

// ── Ex22 – concatMap ──────────────────────────────────────────────────────────
@Component({
  selector: 'ex-22', standalone: true, imports: [CommonModule], template: `
    <button (click)="click$.next()">Click (concatMap)</button>
    <p>Queue: {{ log | json }}</p>
  `
})
export class Ex22 {
  click$ = new Subject<void>();
  log: string[] = [];
  private n = 0;
  constructor() {
    this.click$.pipe(
      concatMap(() => {
        const id = ++this.n;
        return timer(600).pipe(map(() => `task ${id} done`));
      })
    ).subscribe(r => this.log.push(r));
  }
}

// ── Ex23 – exhaustMap ─────────────────────────────────────────────────────────
@Component({
  selector: 'ex-23', standalone: true, imports: [CommonModule], template: `
    <button (click)="click$.next()">Submit (exhaustMap)</button>
    <p>Log: {{ log | json }}</p>
  `
})
export class Ex23 {
  click$ = new Subject<void>();
  log: string[] = [];
  constructor() {
    this.click$.pipe(
      exhaustMap(() => timer(1000).pipe(map(() => 'submitted')))
    ).subscribe(r => this.log.push(r));
  }
}

// ── Ex24 – combineLatest ─────────────────────────────────────────────────────
@Component({
  selector: 'ex-24', standalone: true, imports: [AsyncPipe], template: `
    <input #a value="3" (input)="a$.next(+a.value)" placeholder="A">
    <input #b value="5" (input)="b$.next(+b.value)" placeholder="B">
    <p>Sum: {{ sum$ | async }}</p>
  `
})
export class Ex24 {
  a$ = new BehaviorSubject(3);
  b$ = new BehaviorSubject(5);
  sum$ = combineLatest([this.a$, this.b$]).pipe(map(([a, b]) => a + b));
}

// ── Ex25 – forkJoin ───────────────────────────────────────────────────────────
@Component({
  selector: 'ex-25', standalone: true, imports: [AsyncPipe, CommonModule], template: `
    <p>{{ result$ | async | json }}</p>
    <button (click)="run()">Run forkJoin</button>
  `
})
export class Ex25 {
  result$ = new Subject<unknown>();
  run() {
    forkJoin({
      a: of('Alpha').pipe(take(1)),
      b: of(42).pipe(take(1))
    }).subscribe(r => this.result$.next(r));
  }
}

// ── Ex26 – merge ──────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-26', standalone: true, imports: [CommonModule], template: `
    <p>Merged: {{ vals | json }}</p>
  `
})
export class Ex26 implements OnInit {
  vals: string[] = [];
  ngOnInit() {
    merge(
      of('A').pipe(take(1)),
      timer(300).pipe(map(() => 'B'), take(1)),
      timer(100).pipe(map(() => 'C'), take(1))
    ).subscribe(v => this.vals.push(v));
  }
}

// ── Ex27 – zip ────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-27', standalone: true, imports: [CommonModule], template: `
    <p>Zipped: {{ pairs | json }}</p>
  `
})
export class Ex27 implements OnInit {
  pairs: [string, number][] = [];
  ngOnInit() {
    zip(of('a', 'b', 'c'), of(1, 2, 3))
      .subscribe(pair => this.pairs.push(pair as [string, number]));
  }
}

// ── Ex28 – withLatestFrom ────────────────────────────────────────────────────
@Component({
  selector: 'ex-28', standalone: true, imports: [CommonModule], template: `
    <button (click)="click$.next()">Click</button>
    <button (click)="timer$.next(Date.now()%100)">Update Timer</button>
    <p>Results: {{ results | json }}</p>
  `
})
export class Ex28 {
  click$ = new Subject<void>();
  timer$ = new BehaviorSubject(0);
  results: number[] = [];
  constructor() {
    this.click$.pipe(
      withLatestFrom(this.timer$),
      map(([, t]) => t)
    ).subscribe(v => this.results.push(v));
  }
}

// ── Ex29 – startWith ─────────────────────────────────────────────────────────
@Component({
  selector: 'ex-29', standalone: true, imports: [AsyncPipe], template: `
    <p>{{ val$ | async }}</p>
    <button (click)="s$.next('Clicked!')">Click</button>
  `
})
export class Ex29 {
  s$ = new Subject<string>();
  val$ = this.s$.pipe(startWith('Waiting for click…'));
}

// ── Ex30 – scan ───────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-30', standalone: true, imports: [AsyncPipe], template: `
    <button (click)="click$.next(1)">+1</button>
    <button (click)="click$.next(-1)">-1</button>
    <p>Total: {{ total$ | async }}</p>
  `
})
export class Ex30 {
  click$ = new Subject<number>();
  total$ = this.click$.pipe(scan((acc, v) => acc + v, 0), startWith(0));
}

// ── Ex31 – reduce ─────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-31', standalone: true, template: `<p>Sum: {{ sum }}</p>`
})
export class Ex31 implements OnInit {
  sum = 0;
  ngOnInit() {
    of(1, 2, 3, 4, 5).pipe(reduce((acc, v) => acc + v, 0)).subscribe(v => (this.sum = v));
  }
}

// ── Ex32 – catchError ────────────────────────────────────────────────────────
@Component({
  selector: 'ex-32', standalone: true, imports: [AsyncPipe], template: `
    <p>{{ val$ | async }}</p>
  `
})
export class Ex32 {
  val$ = throwError(() => new Error('Oops')).pipe(
    catchError(err => of(`Caught: ${err.message}`))
  );
}

// ── Ex33 – retry ─────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-33', standalone: true, template: `
    <button (click)="run()">Run with retry</button>
    <p>{{ status }}</p>
  `
})
export class Ex33 {
  status = '';
  attempts = 0;
  run() {
    this.attempts = 0;
    new Observable<string>(obs => {
      this.attempts++;
      if (this.attempts < 3) { obs.error('fail'); } else { obs.next('success'); obs.complete(); }
    }).pipe(retry(3), catchError(e => of(`Failed after retries: ${e}`))).subscribe(v => (this.status = v));
  }
}

// ── Ex34 – throwError ────────────────────────────────────────────────────────
@Component({
  selector: 'ex-34', standalone: true, template: `<p>{{ msg }}</p>`
})
export class Ex34 implements OnInit {
  msg = '';
  ngOnInit() {
    throwError(() => new Error('Custom Error')).pipe(
      catchError(e => of(`Handled: ${e.message}`))
    ).subscribe(v => (this.msg = v));
  }
}

// ── Ex35 – EMPTY ─────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-35', standalone: true, template: `<p>EMPTY completed: {{ done }}</p>`
})
export class Ex35 implements OnInit {
  done = false;
  ngOnInit() { EMPTY.subscribe({ complete: () => (this.done = true) }); }
}

// ── Ex36 – share ─────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-36', standalone: true, imports: [AsyncPipe], template: `
    <p>A: {{ a$ | async }}</p>
    <p>B: {{ b$ | async }}</p>
  `
})
export class Ex36 {
  private shared$ = interval(1000).pipe(take(5), share());
  a$ = this.shared$.pipe(map(v => `A: ${v}`));
  b$ = this.shared$.pipe(map(v => `B: ${v * 2}`));
}

// ── Ex37 – shareReplay ───────────────────────────────────────────────────────
@Component({
  selector: 'ex-37', standalone: true, template: `
    <p>{{ val }}</p>
    <button (click)="lateSubscribe()">Late Subscribe</button>
  `
})
export class Ex37 {
  val = '';
  private source$ = of('cached value').pipe(tap(() => console.log('[Ex37] source!')), shareReplay(1));
  constructor() { this.source$.subscribe(v => (this.val = v)); }
  lateSubscribe() { this.source$.subscribe(v => alert(`Late got: ${v}`)); }
}

// ── Ex38 – toSignal with observable ─────────────────────────────────────────
@Component({
  selector: 'ex-38', standalone: true, template: `<p>Signal from obs: {{ val() }}</p>`
})
export class Ex38 {
  val = toSignal(interval(1000).pipe(map(i => `tick ${i}`), take(10)), { initialValue: 'start' });
}

// ── Ex39 – toObservable usage ────────────────────────────────────────────────
@Component({
  selector: 'ex-39', standalone: true, imports: [AsyncPipe], template: `
    <button (click)="count.update(c => c + 1)">+</button>
    <p>Obs via async pipe: {{ count$_signal | async }}</p>
  `
})
export class Ex39 {
  count = signal(0);
  // Expose the observable version for async pipe usage
  count$_signal = new BehaviorSubject(0);
  constructor() {
    // We derive an observable from the signal using effect
    effect(() => this.count$_signal.next(this.count()));
  }
}

// ── Ex40 – fromEvent (simulated) ─────────────────────────────────────────────
@Component({
  selector: 'ex-40', standalone: true, template: `
    <button #btn (click)="click$.next($event)">Click me</button>
    <p>Clicks: {{ clicks }}</p>
  `
})
export class Ex40 {
  click$ = new Subject<MouseEvent>();
  clicks = 0;
  constructor() { this.click$.subscribe(() => this.clicks++); }
}

// ── Ex41 – interval + takeUntil ──────────────────────────────────────────────
@Component({
  selector: 'ex-41', standalone: true, template: `
    <p>Tick: {{ tick }}</p>
    <button (click)="stop$.next()">Stop</button>
  `
})
export class Ex41 implements OnInit {
  tick = 0;
  stop$ = new Subject<void>();
  ngOnInit() {
    interval(500).pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(v => (this.tick = v));
  }
}

// ── Ex42 – timer + poll pattern ──────────────────────────────────────────────
@Component({
  selector: 'ex-42', standalone: true, template: `<p>Poll result: {{ result() }}</p>`
})
export class Ex42 {
  result = toSignal(
    timer(0, 2000).pipe(
      switchMap(() => of(`Polled at ${new Date().toLocaleTimeString()}`)),
      take(10)
    ),
    { initialValue: 'Polling…' }
  );
}

// ── Ex43 – multicasting with Subject ─────────────────────────────────────────
@Component({
  selector: 'ex-43', standalone: true, imports: [CommonModule], template: `
    <button (click)="broadcast()">Broadcast</button>
    <p>Sub1: {{ log1 | json }}</p>
    <p>Sub2: {{ log2 | json }}</p>
  `
})
export class Ex43 {
  channel$ = new Subject<string>();
  log1: string[] = [];
  log2: string[] = [];
  constructor() {
    this.channel$.subscribe(v => this.log1.push(`[S1] ${v}`));
    this.channel$.subscribe(v => this.log2.push(`[S2] ${v}`));
  }
  broadcast() { this.channel$.next(`msg-${Date.now() % 1000}`); }
}

// ── Ex44 – hot vs cold ───────────────────────────────────────────────────────
@Component({
  selector: 'ex-44', standalone: true, imports: [CommonModule], template: `
    <button (click)="subscribeCold()">Subscribe Cold</button>
    <button (click)="subscribeHot()">Subscribe Hot</button>
    <p>Cold: {{ cold | json }}</p>
    <p>Hot: {{ hot | json }}</p>
  `
})
export class Ex44 {
  cold: number[] = [];
  hot: number[] = [];
  private hotSource$ = new BehaviorSubject(0);
  subscribeCold() {
    of(1, 2, 3).subscribe(v => this.cold.push(v));
  }
  subscribeHot() {
    this.hotSource$.next(this.hotSource$.value + 1);
    this.hotSource$.subscribe(v => this.hot.push(v));
  }
}

// ── Ex45 – custom operator ────────────────────────────────────────────────────
@Component({
  selector: 'ex-45', standalone: true, imports: [CommonModule], template: `
    <p>Results: {{ results | json }}</p>
  `
})
export class Ex45 implements OnInit {
  results: string[] = [];
  doubleAndStringify = <T extends number>(source: Observable<T>) =>
    source.pipe(map(v => `${v * 2}`));
  ngOnInit() {
    of(1, 2, 3).pipe(this.doubleAndStringify).subscribe(v => this.results.push(v));
  }
}

// ── Ex46 – pipeable operator composition ─────────────────────────────────────
@Component({
  selector: 'ex-46', standalone: true, imports: [CommonModule], template: `
    <p>Pipeline result: {{ vals | json }}</p>
  `
})
export class Ex46 implements OnInit {
  vals: string[] = [];
  ngOnInit() {
    of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
      .pipe(
        filter(n => n % 2 === 0),
        map(n => n * n),
        map(n => `sq:${n}`)
      )
      .subscribe(v => this.vals.push(v));
  }
}

// ── Ex47 – ReplaySubject buffer ───────────────────────────────────────────────
@Component({
  selector: 'ex-47', standalone: true, imports: [CommonModule], template: `
    <button (click)="emit()">Emit</button>
    <button (click)="lateJoin()">Late Join (gets last 3)</button>
    <p>Replay buffer log: {{ log | json }}</p>
  `
})
export class Ex47 {
  rs = new ReplaySubject<number>(3);
  log: string[] = [];
  emit() { this.rs.next(Date.now() % 1000); }
  lateJoin() { this.rs.subscribe(v => this.log.push(`late: ${v}`)); }
}

// ── Ex48 – BehaviorSubject as state ───────────────────────────────────────────
@Component({
  selector: 'ex-48', standalone: true, imports: [AsyncPipe, CommonModule], template: `
    <p>State: {{ state$ | async | json }}</p>
    <button (click)="setLoading()">Loading</button>
    <button (click)="setData()">Set Data</button>
  `
})
export class Ex48 {
  state$ = new BehaviorSubject<{ loading: boolean; data: string | null }>({ loading: false, data: null });
  setLoading() { this.state$.next({ loading: true, data: null }); }
  setData() { this.state$.next({ loading: false, data: 'Fetched!' }); }
}

// ── Ex49 – observable error + complete lifecycle ──────────────────────────────
@Component({
  selector: 'ex-49', standalone: true, template: `<p>{{ status }}</p><button (click)="run()">Run</button>`
})
export class Ex49 {
  status = '';
  run() {
    new Observable<number>(obs => {
      obs.next(1);
      obs.next(2);
      obs.complete();
    }).subscribe({
      next: v => (this.status += `${v} `),
      error: e => (this.status = `Error: ${e}`),
      complete: () => (this.status += '✓')
    });
  }
}

// ── Ex50 – observable + signal integration summary ───────────────────────────
@Component({
  selector: 'ex-50', standalone: true, imports: [AsyncPipe], template: `
    <p>Signal-driven obs: {{ display$ | async }}</p>
    <button (click)="word.update(w => w + '!')">Add !</button>
  `
})
export class Ex50 {
  word = signal('Hello');
  private bs = new BehaviorSubject('Hello');
  display$ = this.bs.asObservable().pipe(map(w => `Value: ${w}`));
  constructor() {
    effect(() => this.bs.next(this.word()));
  }
}

// ── AppComponent ─────────────────────────────────────────────────────────────
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
      <h1>Phase 3 – RxJS Observables Examples</h1>

      <h4>Ex01 – of()</h4><ex-01 /><hr />
      <h4>Ex02 – from()</h4><ex-02 /><hr />
      <h4>Ex03 – interval()</h4><ex-03 /><hr />
      <h4>Ex04 – timer()</h4><ex-04 /><hr />
      <h4>Ex05 – Subject</h4><ex-05 /><hr />
      <h4>Ex06 – BehaviorSubject</h4><ex-06 /><hr />
      <h4>Ex07 – ReplaySubject</h4><ex-07 /><hr />
      <h4>Ex08 – AsyncSubject</h4><ex-08 /><hr />
      <h4>Ex09 – subscribe / unsubscribe</h4><ex-09 /><hr />
      <h4>Ex10 – async pipe</h4><ex-10 /><hr />
      <h4>Ex11 – takeUntilDestroyed</h4><ex-11 /><hr />
      <h4>Ex12 – map</h4><ex-12 /><hr />
      <h4>Ex13 – filter</h4><ex-13 /><hr />
      <h4>Ex14 – tap</h4><ex-14 /><hr />
      <h4>Ex15 – take</h4><ex-15 /><hr />
      <h4>Ex16 – first</h4><ex-16 /><hr />
      <h4>Ex17 – skip</h4><ex-17 /><hr />
      <h4>Ex18 – debounceTime</h4><ex-18 /><hr />
      <h4>Ex19 – distinctUntilChanged</h4><ex-19 /><hr />
      <h4>Ex20 – switchMap</h4><ex-20 /><hr />
      <h4>Ex21 – mergeMap</h4><ex-21 /><hr />
      <h4>Ex22 – concatMap</h4><ex-22 /><hr />
      <h4>Ex23 – exhaustMap</h4><ex-23 /><hr />
      <h4>Ex24 – combineLatest</h4><ex-24 /><hr />
      <h4>Ex25 – forkJoin</h4><ex-25 /><hr />
      <h4>Ex26 – merge</h4><ex-26 /><hr />
      <h4>Ex27 – zip</h4><ex-27 /><hr />
      <h4>Ex28 – withLatestFrom</h4><ex-28 /><hr />
      <h4>Ex29 – startWith</h4><ex-29 /><hr />
      <h4>Ex30 – scan</h4><ex-30 /><hr />
      <h4>Ex31 – reduce</h4><ex-31 /><hr />
      <h4>Ex32 – catchError</h4><ex-32 /><hr />
      <h4>Ex33 – retry</h4><ex-33 /><hr />
      <h4>Ex34 – throwError</h4><ex-34 /><hr />
      <h4>Ex35 – EMPTY</h4><ex-35 /><hr />
      <h4>Ex36 – share</h4><ex-36 /><hr />
      <h4>Ex37 – shareReplay</h4><ex-37 /><hr />
      <h4>Ex38 – toSignal</h4><ex-38 /><hr />
      <h4>Ex39 – toObservable</h4><ex-39 /><hr />
      <h4>Ex40 – fromEvent</h4><ex-40 /><hr />
      <h4>Ex41 – interval + takeUntil</h4><ex-41 /><hr />
      <h4>Ex42 – timer + poll pattern</h4><ex-42 /><hr />
      <h4>Ex43 – multicasting</h4><ex-43 /><hr />
      <h4>Ex44 – hot vs cold</h4><ex-44 /><hr />
      <h4>Ex45 – custom operator</h4><ex-45 /><hr />
      <h4>Ex46 – pipeable operator</h4><ex-46 /><hr />
      <h4>Ex47 – ReplaySubject buffer</h4><ex-47 /><hr />
      <h4>Ex48 – BehaviorSubject as state</h4><ex-48 /><hr />
      <h4>Ex49 – observable lifecycle</h4><ex-49 /><hr />
      <h4>Ex50 – observable + signal integration</h4><ex-50 /><hr />
    </div>
  `
})
export class AppComponent {}
