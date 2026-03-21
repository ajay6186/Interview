import { Component, signal, inject, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  of, throwError, EMPTY, Subject, BehaviorSubject, Observable, timer, interval
} from 'rxjs';
import {
  catchError, retry, retryWhen, finalize, tap, delay, switchMap,
  map, take, debounceTime, distinctUntilChanged, scan
} from 'rxjs/operators';

// ============================================================
// Examples 5.4 — RxJS Error Handling (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ───────────────────────────────────────────

// 1. catchError returning of(fallback)
@Component({
  selector: 'ex-01', standalone: true,
  template: `<p>catchError fallback: {{ value() }}</p>`
})
class Ex01 implements OnInit {
  value = signal('');
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    throwError(() => new Error('oops')).pipe(
      catchError(() => of('fallback value')),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => this.value.set(v));
  }
}

// 2. catchError returning EMPTY
@Component({
  selector: 'ex-02', standalone: true,
  template: `<p>catchError EMPTY — emitted: {{ count() }} values, completed: {{ done() }}</p>`
})
class Ex02 implements OnInit {
  count = signal(0);
  done = signal(false);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    throwError(() => new Error('fail')).pipe(
      catchError(() => EMPTY),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({ next: () => this.count.update(n => n + 1), complete: () => this.done.set(true) });
  }
}

// 3. catchError re-throwing error
@Component({
  selector: 'ex-03', standalone: true,
  template: `<p>Re-thrown error caught: {{ errorMsg() }}</p>`
})
class Ex03 implements OnInit {
  errorMsg = signal('');
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    throwError(() => new Error('original')).pipe(
      catchError(err => throwError(() => new Error(`wrapped: ${err.message}`))),
      catchError(err => of(`caught: ${err.message}`)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => this.errorMsg.set(v));
  }
}

// 4. throwError(() => new Error('msg'))
@Component({
  selector: 'ex-04', standalone: true,
  template: `<p>throwError: {{ message() }}</p>`
})
class Ex04 implements OnInit {
  message = signal('');
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    throwError(() => new Error('Something went wrong')).pipe(
      catchError(err => of(`Error: ${err.message}`)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => this.message.set(v));
  }
}

// 5. retry(3) on failure
@Component({
  selector: 'ex-05', standalone: true,
  template: `<p>retry result: {{ result() }}</p><p>attempts: {{ attempts() }}</p>`
})
class Ex05 implements OnInit {
  result = signal('');
  attempts = signal(0);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    let count = 0;
    new Observable<string>(obs => {
      this.attempts.update(n => n + 1);
      count++;
      if (count < 3) obs.error(new Error(`fail ${count}`));
      else { obs.next('success on 3rd'); obs.complete(); }
    }).pipe(
      retry(3),
      catchError(err => of(`gave up: ${err.message}`)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => this.result.set(v));
  }
}

// 6. Error shown in subscribe error callback
@Component({
  selector: 'ex-06', standalone: true,
  template: `<p>subscribe error: {{ errorMsg() }}</p>`
})
class Ex06 implements OnInit {
  errorMsg = signal('none');
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    throwError(() => new Error('subscribe-level error')).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {},
      error: (err: Error) => this.errorMsg.set(err.message)
    });
  }
}

// 7. finalize() always runs
@Component({
  selector: 'ex-07', standalone: true,
  template: `<p>finalize ran: {{ finalized() }}</p><p>value: {{ value() }}</p>`
})
class Ex07 implements OnInit {
  finalized = signal(false);
  value = signal('');
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    of('hello').pipe(
      finalize(() => this.finalized.set(true)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => this.value.set(v));
  }
}

// 8. tap({ error: e => log(e) })
@Component({
  selector: 'ex-08', standalone: true,
  template: `<p>tap logged error: {{ tapped() }}</p>`
})
class Ex08 implements OnInit {
  tapped = signal('');
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    throwError(() => new Error('tap error')).pipe(
      tap({ error: (err: Error) => this.tapped.set(`tapped: ${err.message}`) }),
      catchError(() => EMPTY),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }
}

// 9. catchError with error message display
@Component({
  selector: 'ex-09', standalone: true,
  template: `
    <button (click)="load()">Load</button>
    @if (error()) { <p style="color:red">{{ error() }}</p> }
    @if (data()) { <p>{{ data() }}</p> }`
})
class Ex09 {
  error = signal('');
  data = signal('');
  private destroyRef = inject(DestroyRef);
  load() {
    this.error.set(''); this.data.set('');
    throwError(() => new Error('Not Found')).pipe(
      catchError(err => { this.error.set(err.message); return EMPTY; }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => this.data.set(v as string));
  }
}

// 10. Error recovery with default value
@Component({
  selector: 'ex-10', standalone: true,
  template: `<p>Recovered value: {{ value() }}</p>`
})
class Ex10 implements OnInit {
  value = signal<number[]>([]);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    throwError(() => new Error('empty')).pipe(
      catchError(() => of([0, 0, 0])),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => this.value.set(v));
  }
}

// 11. onErrorResumeNextWith([fallback$])
@Component({
  selector: 'ex-11', standalone: true, imports: [CommonModule],
  template: `<p>onErrorResumeNext: {{ values() | json }}</p>`
})
class Ex11 implements OnInit {
  values = signal<any[]>([]);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    import('rxjs').then(({ onErrorResumeNext }) => {
      onErrorResumeNext(
        throwError(() => new Error('ignored')),
        of('fallback A', 'fallback B')
      ).pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(v => this.values.update(arr => [...arr, v]));
    });
  }
}

// 12. catchError in inner observable
@Component({
  selector: 'ex-12', standalone: true, imports: [CommonModule],
  template: `<p>inner error caught: {{ results() | json }}</p>`
})
class Ex12 implements OnInit {
  results = signal<string[]>([]);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    of(1, 2, 3).pipe(
      switchMap(n => n === 2
        ? throwError(() => new Error('bad 2')).pipe(catchError(() => of('recovered')))
        : of(`ok ${n}`)
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => this.results.update(arr => [...arr, v]));
  }
}

// 13. Error boundary pattern (catch + recover signal)
@Component({
  selector: 'ex-13', standalone: true,
  template: `
    <button (click)="run()">Run</button>
    <p [style.color]="hasError() ? 'red' : 'green'">{{ status() }}</p>`
})
class Ex13 {
  status = signal('idle');
  hasError = signal(false);
  private destroyRef = inject(DestroyRef);
  run() {
    this.hasError.set(false); this.status.set('loading...');
    throwError(() => new Error('boundary hit')).pipe(
      catchError(err => { this.hasError.set(true); this.status.set(err.message); return EMPTY; }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.status.set('done'));
  }
}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────

// 14. retry with count and delay (timer)
@Component({
  selector: 'ex-14', standalone: true,
  template: `<button (click)="run()">Run</button><p>{{ result() }}</p><p>Attempts: {{ attempts() }}</p>`
})
class Ex14 {
  result = signal('idle');
  attempts = signal(0);
  private destroyRef = inject(DestroyRef);
  run() {
    this.attempts.set(0); this.result.set('trying...');
    let count = 0;
    new Observable<string>(obs => {
      this.attempts.update(n => n + 1); count++;
      if (count < 3) obs.error(new Error(`fail ${count}`));
      else { obs.next('success!'); obs.complete(); }
    }).pipe(
      retry({ count: 3, delay: 500 }),
      catchError(err => of(`failed: ${err.message}`)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => this.result.set(v));
  }
}

// 15. retryWhen with delay (deprecated but shown)
@Component({
  selector: 'ex-15', standalone: true,
  template: `<p>retryWhen (legacy): {{ result() }}</p><button (click)="run()">Run</button>`
})
class Ex15 {
  result = signal('idle');
  private destroyRef = inject(DestroyRef);
  run() {
    this.result.set('retrying...');
    let count = 0;
    new Observable<string>(obs => {
      count++;
      if (count < 2) obs.error(new Error('retry needed'));
      else { obs.next(`ok after ${count} tries`); obs.complete(); }
    }).pipe(
      retryWhen(errors$ => errors$.pipe(delay(300), take(3))),
      catchError(err => of(`gave up: ${err.message}`)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => this.result.set(v));
  }
}

// 16. catchError + retry combo
@Component({
  selector: 'ex-16', standalone: true,
  template: `<button (click)="run()">Run</button><p>{{ result() }}</p>`
})
class Ex16 {
  result = signal('idle');
  private destroyRef = inject(DestroyRef);
  run() {
    let attempts = 0;
    new Observable<string>(obs => {
      attempts++;
      if (attempts < 2) obs.error(new Error('need retry'));
      else { obs.next('recovered'); obs.complete(); }
    }).pipe(
      retry(2),
      catchError(() => of('final fallback')),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => this.result.set(v));
  }
}

// 17. HTTP 404 fallback to empty array
@Component({
  selector: 'ex-17', standalone: true, imports: [CommonModule],
  template: `<p>404 fallback: {{ items() | json }}</p>`
})
class Ex17 implements OnInit {
  items = signal<string[]>([]);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    const http404$ = throwError(() => ({ status: 404, message: 'Not Found' }));
    http404$.pipe(
      catchError(err => err.status === 404 ? of([]) : throwError(() => err)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => this.items.set(v as string[]));
  }
}

// 18. HTTP 500 show retry button
@Component({
  selector: 'ex-18', standalone: true,
  template: `
    <button (click)="load()">Load</button>
    @if (error500()) { <div><p style="color:red">Server Error 500</p><button (click)="load()">Retry</button></div> }
    @if (data()) { <p>{{ data() }}</p> }`
})
class Ex18 {
  error500 = signal(false);
  data = signal('');
  private destroyRef = inject(DestroyRef);
  load() {
    this.error500.set(false); this.data.set('');
    throwError(() => ({ status: 500, message: 'Internal Server Error' })).pipe(
      catchError(err => { if (err.status === 500) this.error500.set(true); return EMPTY; }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => this.data.set(v as string));
  }
}

// 19. Network error detection and display
@Component({
  selector: 'ex-19', standalone: true,
  template: `<button (click)="fetch()">Fetch</button><p>{{ statusMsg() }}</p>`
})
class Ex19 {
  statusMsg = signal('ready');
  private destroyRef = inject(DestroyRef);
  fetch() {
    this.statusMsg.set('loading...');
    throwError(() => new TypeError('Failed to fetch')).pipe(
      catchError(err => {
        const isNetwork = err instanceof TypeError;
        this.statusMsg.set(isNetwork ? 'Network error — check your connection' : `Error: ${err.message}`);
        return EMPTY;
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }
}

// 20. catchError in switchMap inner stream
@Component({
  selector: 'ex-20', standalone: true, imports: [CommonModule],
  template: `<button (click)="search()">Search</button><p>{{ result() | json }}</p>`
})
class Ex20 {
  result = signal<any[]>([]);
  private search$ = new Subject<void>();
  private destroyRef = inject(DestroyRef);
  constructor() {
    this.search$.pipe(
      switchMap(() => throwError(() => new Error('search failed')).pipe(
        catchError(() => of(['default result']))
      )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(r => this.result.set(r as any[]));
  }
  search() { this.search$.next(); }
}

// 21. catchError restoring the outer stream
@Component({
  selector: 'ex-21', standalone: true, imports: [CommonModule],
  template: `<p>outer continues: {{ values() | json }}</p>`
})
class Ex21 implements OnInit {
  values = signal<string[]>([]);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    of('ok1', 'ok2').pipe(
      switchMap(v => v === 'ok2'
        ? throwError(() => new Error('inner fail')).pipe(catchError(() => of('recovered')))
        : of(v)
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => this.values.update(arr => [...arr, v]));
  }
}

// 22. Error type narrowing (HttpErrorResponse-like)
interface AppHttpError { status: number; message: string; url?: string; }
@Component({
  selector: 'ex-22', standalone: true,
  template: `<p>Error type: {{ msg() }}</p>`
})
class Ex22 implements OnInit {
  msg = signal('');
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    const err: AppHttpError = { status: 401, message: 'Unauthorized', url: '/api/data' };
    throwError(() => err).pipe(
      catchError((e: AppHttpError) => {
        if (e.status === 401) return of('Redirect to login');
        if (e.status === 403) return of('Access denied');
        return of(`Unknown: ${e.message}`);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => this.msg.set(v));
  }
}

// 23. Multiple error types handled differently
@Component({
  selector: 'ex-23', standalone: true, imports: [CommonModule],
  template: `<ul>@for (m of messages(); track $index) { <li>{{ m }}</li> }</ul>`
})
class Ex23 implements OnInit {
  messages = signal<string[]>([]);
  private destroyRef = inject(DestroyRef);
  private handleError(code: number) {
    return throwError(() => ({ status: code, message: `HTTP ${code}` })).pipe(
      catchError((e: AppHttpError) => {
        const msg = e.status >= 500 ? `Server error: ${e.status}` : `Client error: ${e.status}`;
        return of(msg);
      })
    );
  }
  ngOnInit() {
    [400, 404, 500, 503].forEach(code => {
      this.handleError(code).pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(m => this.messages.update(arr => [...arr, m]));
    });
  }
}

// 24. Error logging service with tap
class ErrorLogger { log(err: any) { /* console.error('[LOG]', err) */ } }
@Component({
  selector: 'ex-24', standalone: true,
  template: `<p>Logged & handled: {{ result() }}</p>`
})
class Ex24 implements OnInit {
  result = signal('');
  private logger = new ErrorLogger();
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    throwError(() => new Error('log me')).pipe(
      tap({ error: err => this.logger.log(err) }),
      catchError(err => of(`caught after log: ${err.message}`)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => this.result.set(v));
  }
}

// 25. Global error handler concept
@Component({
  selector: 'ex-25', standalone: true,
  template: `<p>Global handler: {{ handled() }}</p>`
})
class Ex25 implements OnInit {
  handled = signal('');
  private destroyRef = inject(DestroyRef);
  private globalHandle(err: Error): Observable<string> {
    return of(`[GLOBAL] ${err.message} handled at ${new Date().toISOString().slice(11, 19)}`);
  }
  ngOnInit() {
    throwError(() => new Error('critical failure')).pipe(
      catchError(err => this.globalHandle(err)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => this.handled.set(v));
  }
}

// 26. Error with user-friendly message mapping
const ERROR_MAP: Record<number, string> = {
  400: 'Bad request — please check your input',
  401: 'Please log in to continue',
  403: 'You do not have permission',
  404: 'Resource not found',
  500: 'Server error — please try later'
};
@Component({
  selector: 'ex-26', standalone: true,
  template: `<p>User message: {{ userMsg() }}</p>`
})
class Ex26 implements OnInit {
  userMsg = signal('');
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    throwError(() => ({ status: 403 })).pipe(
      catchError((e: { status: number }) => of(ERROR_MAP[e.status] || 'An unexpected error occurred')),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => this.userMsg.set(v));
  }
}

// ─── NESTED (27–38) ──────────────────────────────────────────

// 27. Error in nested switchMap handled locally
@Component({
  selector: 'ex-27', standalone: true, imports: [CommonModule],
  template: `<button (click)="trigger()">Trigger</button><p>{{ results() | json }}</p>`
})
class Ex27 {
  results = signal<string[]>([]);
  private action$ = new Subject<number>();
  private destroyRef = inject(DestroyRef);
  constructor() {
    this.action$.pipe(
      switchMap(n => (n % 2 === 0
        ? throwError(() => new Error(`bad ${n}`))
        : of(`ok ${n}`)
      ).pipe(catchError(err => of(`recovered: ${err.message}`)))),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => this.results.update(arr => [...arr, v]));
  }
  private counter = 0;
  trigger() { this.action$.next(++this.counter); }
}

// 28. Error recovery in service, component shows state
class DataService28 {
  getData(): Observable<string> {
    return throwError(() => new Error('service error')).pipe(
      catchError(() => of('service fallback'))
    );
  }
}
@Component({
  selector: 'ex-28', standalone: true,
  template: `<p>From service: {{ data() }}</p>`
})
class Ex28 implements OnInit {
  data = signal('');
  private svc = new DataService28();
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    this.svc.getData().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(v => this.data.set(v));
  }
}

// 29. Component error boundary with retry button
@Component({
  selector: 'ex-29', standalone: true,
  template: `
    @if (loading()) { <p>Loading...</p> }
    @if (error()) { <p style="color:red">{{ error() }}</p><button (click)="load()">Retry</button> }
    @if (data() && !error()) { <p style="color:green">{{ data() }}</p> }`
})
class Ex29 {
  loading = signal(false);
  error = signal('');
  data = signal('');
  private destroyRef = inject(DestroyRef);
  load() {
    this.loading.set(true); this.error.set(''); this.data.set('');
    throwError(() => new Error('load failed')).pipe(
      catchError(err => { this.error.set(err.message); return EMPTY; }),
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => this.data.set(v as string));
  }
}

// 30. Error with undo (restore previous signal state)
@Component({
  selector: 'ex-30', standalone: true,
  template: `
    <p>State: {{ state() | json }}</p>
    <button (click)="tryUpdate()">Try Update</button>`
})
class Ex30 {
  state = signal({ count: 0, name: 'original' });
  private destroyRef = inject(DestroyRef);
  tryUpdate() {
    const prev = this.state();
    this.state.set({ count: 99, name: 'optimistic' });
    throwError(() => new Error('update failed')).pipe(
      catchError(err => { this.state.set(prev); return of(`rolled back: ${err.message}`); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }
}

// 31. HTTP error + exponential backoff retry
@Component({
  selector: 'ex-31', standalone: true,
  template: `<button (click)="run()">Run with backoff</button><p>{{ result() }}</p><p>Attempt: {{ attempt() }}</p>`
})
class Ex31 {
  result = signal('idle');
  attempt = signal(0);
  private destroyRef = inject(DestroyRef);
  run() {
    let count = 0;
    this.attempt.set(0); this.result.set('trying...');
    new Observable<string>(obs => {
      count++;
      this.attempt.set(count);
      if (count < 3) obs.error(new Error(`attempt ${count} failed`));
      else { obs.next(`success on attempt ${count}`); obs.complete(); }
    }).pipe(
      retry({ count: 3, delay: (_, i) => timer(Math.pow(2, i) * 100) }),
      catchError(err => of(`gave up: ${err.message}`)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => this.result.set(v));
  }
}

// 32. Error in forkJoin (partial success pattern)
@Component({
  selector: 'ex-32', standalone: true, imports: [CommonModule],
  template: `<p>partial: {{ result() | json }}</p>`
})
class Ex32 implements OnInit {
  result = signal<any>(null);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    forkJoin({
      a: of('success A').pipe(delay(50)),
      b: throwError(() => new Error('B failed')).pipe(catchError(() => of(null))),
      c: of('success C').pipe(delay(80))
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(r => this.result.set(r));
  }
}

// 33. Error in combineLatest (recover one stream)
@Component({
  selector: 'ex-33', standalone: true,
  template: `<p>combineLatest recovered: {{ result() | json }}</p>`
})
class Ex33 implements OnInit {
  result = signal<any[]>([]);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    import('rxjs').then(({ combineLatest }) => {
      combineLatest([
        of('ok stream'),
        throwError(() => new Error('bad stream')).pipe(catchError(() => of('recovered stream')))
      ]).pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(v => this.result.set(v));
    });
  }
}

// 34. Error with notification service call
class NotificationService34 { messages = signal<string[]>([]); notify(m: string) { this.messages.update(arr => [...arr, m]); } }
@Component({
  selector: 'ex-34', standalone: true, imports: [CommonModule],
  template: `<button (click)="run()">Run</button><ul>@for (m of notif.messages(); track $index) { <li>{{ m }}</li> }</ul>`
})
class Ex34 {
  notif = new NotificationService34();
  private destroyRef = inject(DestroyRef);
  run() {
    throwError(() => new Error('something broke')).pipe(
      tap({ error: err => this.notif.notify(`Error: ${err.message}`) }),
      catchError(() => EMPTY),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }
}

// 35. Error with router redirect (simulated)
@Component({
  selector: 'ex-35', standalone: true,
  template: `<button (click)="load()">Load Protected</button><p>{{ nav() }}</p>`
})
class Ex35 {
  nav = signal('idle');
  private destroyRef = inject(DestroyRef);
  load() {
    throwError(() => ({ status: 401 })).pipe(
      catchError((err: { status: number }) => {
        if (err.status === 401) { this.nav.set('[Navigating to /login]'); }
        return EMPTY;
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }
}

// 36. Loading/Error/Data state machine (signal)
type State36 = 'idle' | 'loading' | 'error' | 'success';
@Component({
  selector: 'ex-36', standalone: true,
  template: `
    <button (click)="load(true)">Load Success</button>
    <button (click)="load(false)">Load Error</button>
    <p>State: {{ state() }}</p>
    @if (state() === 'success') { <p style="color:green">{{ data() }}</p> }
    @if (state() === 'error') { <p style="color:red">{{ errorMsg() }}</p> }`
})
class Ex36 {
  state = signal<State36>('idle');
  data = signal('');
  errorMsg = signal('');
  private destroyRef = inject(DestroyRef);
  load(succeed: boolean) {
    this.state.set('loading');
    (succeed ? of('Loaded!').pipe(delay(300)) : throwError(() => new Error('failed'))).pipe(
      catchError(err => { this.state.set('error'); this.errorMsg.set(err.message); return EMPTY; }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => { this.data.set(v); this.state.set('success'); });
  }
}

// 37. Retry-with-feedback component (count shown)
@Component({
  selector: 'ex-37', standalone: true,
  template: `<button (click)="run()">Run</button><p>{{ result() }}</p><p>Retry count: {{ retries() }}</p>`
})
class Ex37 {
  result = signal('idle');
  retries = signal(0);
  private destroyRef = inject(DestroyRef);
  run() {
    this.retries.set(0); this.result.set('trying...');
    let count = 0;
    new Observable<string>(obs => {
      count++;
      if (count <= 2) { this.retries.set(count); obs.error(new Error(`fail ${count}`)); }
      else { obs.next('success!'); obs.complete(); }
    }).pipe(
      retry(3),
      catchError(err => of(`gave up: ${err.message}`)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => this.result.set(v));
  }
}

// 38. Full resilient HTTP call component
@Component({
  selector: 'ex-38', standalone: true,
  template: `
    <button (click)="load()">Fetch Data</button>
    <p>Status: {{ status() }}</p>
    @if (data()) { <p style="color:green">{{ data() }}</p> }
    @if (errMsg()) { <p style="color:red">{{ errMsg() }}</p><button (click)="load()">Retry</button> }`
})
class Ex38 {
  status = signal('idle');
  data = signal('');
  errMsg = signal('');
  private attempts = 0;
  private destroyRef = inject(DestroyRef);
  load() {
    this.status.set('loading...'); this.data.set(''); this.errMsg.set('');
    this.attempts = 0;
    new Observable<string>(obs => {
      this.attempts++;
      if (this.attempts < 3) obs.error(new Error(`HTTP 503 attempt ${this.attempts}`));
      else { obs.next('{ "data": "loaded" }'); obs.complete(); }
    }).pipe(
      retry({ count: 3, delay: 400 }),
      catchError(err => { this.errMsg.set(err.message); return EMPTY; }),
      finalize(() => { if (!this.data()) this.status.set('failed'); else this.status.set('done'); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => this.data.set(v));
  }
}

// ─── ADVANCED (39–50) ────────────────────────────────────────

// 39. Custom exponential backoff operator
function exponentialBackoff<T>(maxRetries: number, baseDelay: number) {
  return (source$: Observable<T>): Observable<T> =>
    source$.pipe(
      retry({ count: maxRetries, delay: (_, i) => timer(baseDelay * Math.pow(2, i - 1)) })
    );
}
@Component({
  selector: 'ex-39', standalone: true,
  template: `<button (click)="run()">Run Backoff</button><p>{{ result() }}</p>`
})
class Ex39 {
  result = signal('idle');
  private destroyRef = inject(DestroyRef);
  run() {
    let count = 0;
    new Observable<string>(obs => {
      count++;
      if (count < 3) obs.error(new Error(`attempt ${count}`));
      else { obs.next(`ok after ${count}`); obs.complete(); }
    }).pipe(
      exponentialBackoff(3, 100),
      catchError(err => of(`gave up: ${err.message}`)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => this.result.set(v));
  }
}

// 40. Circuit breaker pattern
@Component({
  selector: 'ex-40', standalone: true,
  template: `<button (click)="call()">Call API</button><p>Circuit: {{ circuit() }}</p><p>{{ result() }}</p>`
})
class Ex40 {
  circuit = signal<'closed' | 'open'>('closed');
  result = signal('');
  private failCount = 0;
  private destroyRef = inject(DestroyRef);
  call() {
    if (this.circuit() === 'open') { this.result.set('Circuit open — rejected'); return; }
    throwError(() => new Error('downstream failure')).pipe(
      catchError(err => {
        this.failCount++;
        if (this.failCount >= 3) this.circuit.set('open');
        return of(`fail #${this.failCount}: ${err.message}`);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => this.result.set(v));
  }
}

// 41. Error type discrimination (domain vs network vs auth)
type ErrorKind = 'domain' | 'network' | 'auth' | 'unknown';
function classifyError(err: any): ErrorKind {
  if (err.kind === 'domain') return 'domain';
  if (err instanceof TypeError) return 'network';
  if (err.status === 401 || err.status === 403) return 'auth';
  return 'unknown';
}
@Component({
  selector: 'ex-41', standalone: true, imports: [CommonModule],
  template: `<ul>@for (e of errors(); track $index) { <li>{{ e }}</li> }</ul>`
})
class Ex41 implements OnInit {
  errors = signal<string[]>([]);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    const cases = [
      { kind: 'domain', message: 'invalid input' },
      new TypeError('fetch failed'),
      { status: 401 },
      { status: 999 }
    ];
    cases.forEach(err => {
      throwError(() => err).pipe(
        catchError(e => of(`[${classifyError(e)}] handled`)),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(v => this.errors.update(arr => [...arr, v]));
    });
  }
}

// 42. GlobalErrorHandler with signal
const globalErrors = signal<string[]>([]);
function globalHandle(err: any) { globalErrors.update(arr => [...arr.slice(-4), String(err.message || err)]); }
@Component({
  selector: 'ex-42', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="trigger()">Trigger Global Error</button>
    <ul>@for (e of globalErrors(); track $index) { <li>{{ e }}</li> }</ul>`
})
class Ex42 {
  globalErrors = globalErrors;
  private destroyRef = inject(DestroyRef);
  trigger() {
    throwError(() => new Error(`error at ${Date.now()}`)).pipe(
      tap({ error: globalHandle }),
      catchError(() => EMPTY),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }
}

// 43. Error serialization for logging
interface SerializedError { message: string; stack?: string; timestamp: string; code?: number; }
function serializeError(err: any): SerializedError {
  return { message: err.message || String(err), timestamp: new Date().toISOString(), code: err.status };
}
@Component({
  selector: 'ex-43', standalone: true,
  template: `<p>Serialized: {{ serialized() }}</p>`
})
class Ex43 implements OnInit {
  serialized = signal('');
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    throwError(() => ({ status: 500, message: 'server meltdown' })).pipe(
      tap({ error: err => this.serialized.set(JSON.stringify(serializeError(err))) }),
      catchError(() => EMPTY),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }
}

// 44. Error with correlation ID
@Component({
  selector: 'ex-44', standalone: true,
  template: `<button (click)="run()">Run</button><p>{{ logEntry() }}</p>`
})
class Ex44 {
  logEntry = signal('');
  private destroyRef = inject(DestroyRef);
  run() {
    const correlationId = `req-${Math.random().toString(36).slice(2, 9)}`;
    throwError(() => new Error('operation failed')).pipe(
      catchError(err => of(`[${correlationId}] ${err.message} — fallback`)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => this.logEntry.set(v));
  }
}

// 45. Partial success/failure display (some succeeded)
@Component({
  selector: 'ex-45', standalone: true, imports: [CommonModule],
  template: `
    @for (item of results(); track item.id) {
      <p [style.color]="item.ok ? 'green' : 'red'">{{ item.id }}: {{ item.value }}</p>
    }`
})
class Ex45 implements OnInit {
  results = signal<{ id: number; ok: boolean; value: string }[]>([]);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    [1, 2, 3, 4].forEach(id => {
      (id % 2 === 0 ? throwError(() => new Error(`fail ${id}`)) : of(`data-${id}`)).pipe(
        map((v): { id: number; ok: boolean; value: string } => ({ id, ok: true, value: v as string })),
        catchError(err => of<{ id: number; ok: boolean; value: string }>({ id, ok: false, value: err.message })),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(r => this.results.update(arr => [...arr, r]));
    });
  }
}

// 46. Error with optimistic rollback
@Component({
  selector: 'ex-46', standalone: true, imports: [CommonModule],
  template: `
    <p>Items: {{ items() | json }}</p>
    <button (click)="addOptimistic()">Add (optimistic)</button>`
})
class Ex46 {
  items = signal<string[]>(['item1', 'item2']);
  private destroyRef = inject(DestroyRef);
  addOptimistic() {
    const prev = [...this.items()];
    this.items.update(arr => [...arr, 'new-item (pending)']);
    throwError(() => new Error('save failed')).pipe(
      catchError(err => { this.items.set(prev); return of(`rolled back: ${err.message}`); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }
}

// 47. Unhandled error prevention strategies
@Component({
  selector: 'ex-47', standalone: true,
  template: `<p>Safe zone: {{ msg() }}</p>`
})
class Ex47 implements OnInit {
  msg = signal('');
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    of(null).pipe(
      switchMap(() => throwError(() => new Error('unhandled risk')).pipe(
        catchError(err => of(`prevented unhandled: ${err.message}`))
      )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => this.msg.set(v as string));
  }
}

// 48. Error boundary + lazy component
@Component({
  selector: 'ex-48', standalone: true,
  template: `
    <button (click)="loadComponent()">Load Component</button>
    <p>{{ status() }}</p>`
})
class Ex48 {
  status = signal('ready');
  private destroyRef = inject(DestroyRef);
  loadComponent() {
    this.status.set('loading component...');
    of(null).pipe(
      delay(200),
      switchMap(() => throwError(() => new Error('lazy load failed'))),
      catchError(err => { this.status.set(`boundary caught: ${err.message}`); return EMPTY; }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.status.set('component loaded'));
  }
}

// 49. Error with retry + progress indicator
@Component({
  selector: 'ex-49', standalone: true,
  template: `
    <button (click)="run()">Run with Progress</button>
    <p>Progress: {{ progress() }}/3</p>
    <p>{{ result() }}</p>`
})
class Ex49 {
  progress = signal(0);
  result = signal('idle');
  private destroyRef = inject(DestroyRef);
  run() {
    this.progress.set(0); this.result.set('starting...');
    let count = 0;
    new Observable<string>(obs => {
      count++;
      this.progress.set(count);
      if (count < 3) obs.error(new Error(`attempt ${count}`));
      else { obs.next('done!'); obs.complete(); }
    }).pipe(
      retry(3),
      catchError(err => of(`failed: ${err.message}`)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => this.result.set(v));
  }
}

// 50. Full resilient service: retry + fallback + notify + log
@Component({
  selector: 'ex-50', standalone: true, imports: [CommonModule],
  template: `
    <button (click)="fetch()">Fetch (Resilient)</button>
    <p>Status: {{ status() }}</p>
    @if (data()) { <p style="color:green">{{ data() }}</p> }
    @if (logs().length) {
      <div>
        <strong>Log:</strong>
        <ul>@for (l of logs(); track $index) { <li>{{ l }}</li> }</ul>
      </div>
    }`
})
class Ex50 {
  status = signal('idle');
  data = signal('');
  logs = signal<string[]>([]);
  private destroyRef = inject(DestroyRef);
  private log(msg: string) { this.logs.update(arr => [...arr, msg]); }
  fetch() {
    this.status.set('loading'); this.data.set(''); this.logs.set([]);
    let count = 0;
    new Observable<string>(obs => {
      count++;
      this.log(`Attempt ${count}`);
      if (count < 3) obs.error(new Error(`503 Service Unavailable`));
      else { obs.next('{ "users": 42 }'); obs.complete(); }
    }).pipe(
      tap({ error: err => this.log(`Error: ${err.message}`) }),
      retry({ count: 3, delay: 300 }),
      catchError(err => {
        this.log(`All retries exhausted: ${err.message}`);
        this.status.set('using fallback');
        return of('{ "users": 0 } (fallback)');
      }),
      finalize(() => { if (this.status() === 'loading') this.status.set('done'); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => { this.data.set(v); this.status.set('done'); });
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
      <h1>Examples 5.4 — RxJS Error Handling</h1>
      <h4>1. catchError returning of(fallback)</h4><ex-01 /><hr />
      <h4>2. catchError returning EMPTY</h4><ex-02 /><hr />
      <h4>3. catchError re-throwing error</h4><ex-03 /><hr />
      <h4>4. throwError(() => new Error('msg'))</h4><ex-04 /><hr />
      <h4>5. retry(3) on failure</h4><ex-05 /><hr />
      <h4>6. Error shown in subscribe error callback</h4><ex-06 /><hr />
      <h4>7. finalize() always runs</h4><ex-07 /><hr />
      <h4>8. tap error observer</h4><ex-08 /><hr />
      <h4>9. catchError with error message display</h4><ex-09 /><hr />
      <h4>10. Error recovery with default value</h4><ex-10 /><hr />
      <h4>11. onErrorResumeNextWith([fallback$])</h4><ex-11 /><hr />
      <h4>12. catchError in inner observable</h4><ex-12 /><hr />
      <h4>13. Error boundary pattern</h4><ex-13 /><hr />
      <h4>14. retry with count and delay</h4><ex-14 /><hr />
      <h4>15. retryWhen with delay (deprecated)</h4><ex-15 /><hr />
      <h4>16. catchError + retry combo</h4><ex-16 /><hr />
      <h4>17. HTTP 404 fallback to empty array</h4><ex-17 /><hr />
      <h4>18. HTTP 500 show retry button</h4><ex-18 /><hr />
      <h4>19. Network error detection and display</h4><ex-19 /><hr />
      <h4>20. catchError in switchMap inner stream</h4><ex-20 /><hr />
      <h4>21. catchError restoring the outer stream</h4><ex-21 /><hr />
      <h4>22. Error type narrowing (HttpErrorResponse)</h4><ex-22 /><hr />
      <h4>23. Multiple error types handled differently</h4><ex-23 /><hr />
      <h4>24. Error logging service with tap</h4><ex-24 /><hr />
      <h4>25. Global error handler concept</h4><ex-25 /><hr />
      <h4>26. Error with user-friendly message mapping</h4><ex-26 /><hr />
      <h4>27. Error in nested switchMap handled locally</h4><ex-27 /><hr />
      <h4>28. Error recovery in service, component shows state</h4><ex-28 /><hr />
      <h4>29. Component error boundary with retry button</h4><ex-29 /><hr />
      <h4>30. Error with undo (restore previous signal state)</h4><ex-30 /><hr />
      <h4>31. HTTP error + exponential backoff retry</h4><ex-31 /><hr />
      <h4>32. Error in forkJoin (partial success pattern)</h4><ex-32 /><hr />
      <h4>33. Error in combineLatest (recover one stream)</h4><ex-33 /><hr />
      <h4>34. Error with notification service call</h4><ex-34 /><hr />
      <h4>35. Error with router redirect</h4><ex-35 /><hr />
      <h4>36. Loading/Error/Data state machine</h4><ex-36 /><hr />
      <h4>37. Retry-with-feedback component</h4><ex-37 /><hr />
      <h4>38. Full resilient HTTP call component</h4><ex-38 /><hr />
      <h4>39. Custom exponential backoff operator</h4><ex-39 /><hr />
      <h4>40. Circuit breaker pattern</h4><ex-40 /><hr />
      <h4>41. Error type discrimination</h4><ex-41 /><hr />
      <h4>42. GlobalErrorHandler with signal</h4><ex-42 /><hr />
      <h4>43. Error serialization for logging</h4><ex-43 /><hr />
      <h4>44. Error with correlation ID</h4><ex-44 /><hr />
      <h4>45. Partial success/failure display</h4><ex-45 /><hr />
      <h4>46. Error with optimistic rollback</h4><ex-46 /><hr />
      <h4>47. Unhandled error prevention strategies</h4><ex-47 /><hr />
      <h4>48. Error boundary + lazy component</h4><ex-48 /><hr />
      <h4>49. Error with retry + progress indicator</h4><ex-49 /><hr />
      <h4>50. Full resilient service: retry + fallback + notify + log</h4><ex-50 /><hr />
    </div>`
})
export class AppComponent {}
