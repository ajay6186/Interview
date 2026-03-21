import { Component, signal, computed, OnInit, OnDestroy, inject, DestroyRef } from '@angular/core';
import { Subject, of, from, timer, interval, fromEvent, EMPTY } from 'rxjs';
import {
  switchMap, mergeMap, concatMap, exhaustMap, catchError, tap,
  debounceTime, throttleTime, retry, timeout, takeUntil, delay,
  map, finalize, distinctUntilChanged, retryWhen, delayWhen, take,
  withLatestFrom, filter, forkJoin, scan
} from 'rxjs/operators';

// ============================================================
// Examples 7.3 — NgRx Effects (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ───────────────────────────────────────────

// 1. Effect concept: action → side effect → new action
@Component({
  selector: 'ex-01', standalone: true,
  template: `
    <pre>{{ code }}</pre>
  `
})
class Ex01 {
  code = `// NgRx Effect: action → side effect → new action
@Injectable()
export class ProductEffects {
  loadProducts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductActions.load),        // 1. filter action
      switchMap(() => this.api.get()),    // 2. side effect
      map(data => ProductActions.loadSuccess({ data })) // 3. new action
    )
  );
  constructor(private actions$: Actions, private api: ProductService) {}
}`;
}

// 2. Actions.pipe(ofType(...)) pattern
@Component({
  selector: 'ex-02', standalone: true,
  template: `<pre>{{ code }}</pre>`
})
class Ex02 {
  code = `// ofType filters only matching actions from the stream
loadProducts$ = createEffect(() =>
  this.actions$.pipe(
    ofType('[Products] Load'),       // only this action passes through
    switchMap(() => this.api.getAll()),
    map(products => ({ type: '[Products] Load Success', products }))
  )
);

// Multiple action types:
clearOrReset$ = createEffect(() =>
  this.actions$.pipe(
    ofType('[Cart] Clear', '[Session] Logout'),
    map(() => ({ type: '[Cart] Empty' }))
  )
);`;
}

// 3. switchMap in effect — cancels previous inner observable
@Component({
  selector: 'ex-03', standalone: true,
  template: `
    <button (click)="search('angular')">Search Angular</button>
    <button (click)="search('react')">Search React</button>
    <button (click)="search('vue')">Search Vue</button>
    <p>Result: {{ result() }}</p>
    <small>switchMap cancels previous — only last wins</small>
  `
})
class Ex03 {
  result = signal('');
  search$ = new Subject<string>();

  constructor() {
    this.search$.pipe(
      switchMap(term =>
        of(`Results for: ${term}`).pipe(delay(500))
      )
    ).subscribe(r => this.result.set(r));
  }

  search(term: string) {
    this.result.set('loading...');
    this.search$.next(term);
  }
}

// 4. mergeMap in effect — runs all concurrently
@Component({
  selector: 'ex-04', standalone: true,
  template: `
    <button (click)="dispatch('A')">Add A</button>
    <button (click)="dispatch('B')">Add B</button>
    <button (click)="dispatch('C')">Add C</button>
    <p>Completed: {{ results() }}</p>
    <small>mergeMap runs all concurrently</small>
  `
})
class Ex04 {
  results = signal<string[]>([]);
  action$ = new Subject<string>();

  constructor() {
    this.action$.pipe(
      mergeMap(id =>
        of(`Saved ${id}`).pipe(delay(800))
      )
    ).subscribe(r => this.results.update(v => [...v, r]));
  }

  dispatch(id: string) { this.action$.next(id); }
}

// 5. concatMap in effect — queues and executes one by one
@Component({
  selector: 'ex-05', standalone: true,
  template: `
    <button (click)="dispatch('T1')">Add T1</button>
    <button (click)="dispatch('T2')">Add T2</button>
    <button (click)="dispatch('T3')">Add T3</button>
    <p>Processed: {{ log() }}</p>
    <small>concatMap queues — sequential order guaranteed</small>
  `
})
class Ex05 {
  log = signal<string[]>([]);
  action$ = new Subject<string>();

  constructor() {
    this.action$.pipe(
      concatMap(id =>
        of(`Done: ${id}`).pipe(delay(600))
      )
    ).subscribe(r => this.log.update(v => [...v, r]));
  }

  dispatch(id: string) { this.action$.next(id); }
}

// 6. exhaustMap in effect — ignores new while busy
@Component({
  selector: 'ex-06', standalone: true,
  template: `
    <button (click)="login()">Login (exhaustMap)</button>
    <p>{{ status() }}</p>
    <small>exhaustMap ignores extra clicks while request is in flight</small>
  `
})
class Ex06 {
  status = signal('Idle');
  click$ = new Subject<void>();

  constructor() {
    this.click$.pipe(
      exhaustMap(() => {
        this.status.set('Logging in...');
        return of('Logged in!').pipe(delay(1500));
      })
    ).subscribe(r => this.status.set(r));
  }

  login() { this.click$.next(); }
}

// 7. dispatch: false effect (fire-and-forget)
@Component({
  selector: 'ex-07', standalone: true,
  template: `<pre>{{ code }}</pre>`
})
class Ex07 {
  code = `// dispatch: false — effect does NOT dispatch another action
logAction$ = createEffect(() =>
  this.actions$.pipe(
    ofType(UserActions.login),
    tap(action => console.log('User logged in:', action.userId)),
    // No map/return of action needed
  ),
  { dispatch: false }   // <-- key option
);

// Also used for: localStorage writes, analytics, router.navigate
persistToken$ = createEffect(() =>
  this.actions$.pipe(
    ofType(AuthActions.loginSuccess),
    tap(({ token }) => localStorage.setItem('token', token))
  ),
  { dispatch: false }
);`;
}

// 8. tap-only effect (logging) — RxJS demo
@Component({
  selector: 'ex-08', standalone: true,
  template: `
    <button (click)="trigger('UserLogin')">Dispatch UserLogin</button>
    <button (click)="trigger('UserLogout')">Dispatch UserLogout</button>
    <p>Log: {{ log() }}</p>
    <small>tap side effect — doesn't transform stream</small>
  `
})
class Ex08 {
  log = signal('(none)');
  action$ = new Subject<string>();

  constructor() {
    this.action$.pipe(
      tap(type => this.log.set(`[LOG] ${new Date().toLocaleTimeString()} — ${type}`))
    ).subscribe();
  }

  trigger(type: string) { this.action$.next(type); }
}

// 9. catchError dispatching failure action
@Component({
  selector: 'ex-09', standalone: true,
  template: `<pre>{{ code }}</pre>`
})
class Ex09 {
  code = `// catchError INSIDE switchMap so stream doesn't terminate
loadProducts$ = createEffect(() =>
  this.actions$.pipe(
    ofType(ProductActions.load),
    switchMap(() =>
      this.api.getAll().pipe(
        map(products => ProductActions.loadSuccess({ products })),
        catchError(error =>
          of(ProductActions.loadFailure({ error: error.message }))
          // of() returns observable — keeps outer stream alive
        )
      )
    )
  )
);`;
}

// 10. success/failure action pair
@Component({
  selector: 'ex-10', standalone: true,
  template: `<pre>{{ code }}</pre>`
})
class Ex10 {
  code = `// Convention: define success + failure action pairs
export const ProductActions = createActionGroup({
  source: 'Products',
  events: {
    'Load':         emptyProps(),
    'Load Success': props<{ products: Product[] }>(),
    'Load Failure': props<{ error: string }>(),
    'Create':         props<{ product: Omit<Product,'id'> }>(),
    'Create Success': props<{ product: Product }>(),
    'Create Failure': props<{ error: string }>(),
  }
});

// Effect handles load → success | failure
loadProducts$ = createEffect(() =>
  this.actions$.pipe(
    ofType(ProductActions.load),
    switchMap(() =>
      this.api.getAll().pipe(
        map(p => ProductActions.loadSuccess({ products: p })),
        catchError(e => of(ProductActions.loadFailure({ error: e.message })))
      )
    )
  )
);`;
}

// 11. HTTP GET effect simulation — Subject + switchMap
@Component({
  selector: 'ex-11', standalone: true,
  template: `
    <button (click)="load()">Load Users</button>
    <button (click)="load()">Load Again (cancels prev)</button>
    <p>Status: {{ status() }}</p>
    <ul>@for (u of users(); track u) { <li>{{ u }}</li> }</ul>
    <small>Simulates HTTP GET with switchMap</small>
  `
})
class Ex11 {
  status = signal('idle');
  users = signal<string[]>([]);
  load$ = new Subject<void>();

  constructor() {
    this.load$.pipe(
      switchMap(() => {
        this.status.set('loading...');
        return of(['Alice', 'Bob', 'Carol']).pipe(delay(700));
      })
    ).subscribe(users => {
      this.users.set(users);
      this.status.set('loaded');
    });
  }

  load() { this.load$.next(); }
}

// 12. HTTP POST effect simulation — Subject + mergeMap
@Component({
  selector: 'ex-12', standalone: true,
  template: `
    <button (click)="create('Item ' + counter)">Create Item</button>
    <p>Created: {{ created() }}</p>
    <small>mergeMap — each POST runs independently</small>
  `
})
class Ex12 {
  counter = 1;
  created = signal<string[]>([]);
  create$ = new Subject<string>();

  constructor() {
    this.create$.pipe(
      mergeMap(name =>
        of({ id: Math.random().toString(36).slice(2), name }).pipe(delay(500))
      )
    ).subscribe(item => {
      this.created.update(v => [...v, `${item.name} (${item.id})`]);
    });
  }

  create(name: string) { this.counter++; this.create$.next(name); }
}

// 13. Effect with router navigate — code display
@Component({
  selector: 'ex-13', standalone: true,
  template: `<pre>{{ code }}</pre>`
})
class Ex13 {
  code = `// After login success → navigate to dashboard
loginSuccess$ = createEffect(() =>
  this.actions$.pipe(
    ofType(AuthActions.loginSuccess),
    tap(() => this.router.navigate(['/dashboard']))
  ),
  { dispatch: false }
);

// After delete → navigate back to list
deleteSuccess$ = createEffect(() =>
  this.actions$.pipe(
    ofType(ProductActions.deleteSuccess),
    tap(({ id }) => {
      console.log('Deleted:', id);
      this.router.navigate(['/products']);
    })
  ),
  { dispatch: false }
);

constructor(
  private actions$: Actions,
  private router: Router
) {}`;
}

// ─── INTERMEDIATE (14–26) ───────────────────────────────────

// 14. Error handling with retry(3) — RxJS demo
@Component({
  selector: 'ex-14', standalone: true,
  template: `
    <button (click)="fetch()">Fetch (fails 2x, succeeds 3rd)</button>
    <p>{{ status() }}</p>
    <small>retry(3) re-subscribes up to 3 times on error</small>
  `
})
class Ex14 {
  status = signal('idle');
  trigger$ = new Subject<void>();
  attempt = 0;

  constructor() {
    this.trigger$.pipe(
      switchMap(() => {
        this.attempt = 0;
        return of(null).pipe(
          switchMap(() => {
            this.attempt++;
            if (this.attempt < 3) return from(Promise.reject(new Error(`Fail #${this.attempt}`)));
            return of('Success on attempt 3!');
          }),
          retry(3),
          catchError(e => of(`Failed after 3 retries: ${e.message}`))
        );
      })
    ).subscribe(r => this.status.set(r as string));
  }

  fetch() { this.status.set('loading...'); this.trigger$.next(); }
}

// 15. Timeout on HTTP — RxJS demo
@Component({
  selector: 'ex-15', standalone: true,
  template: `
    <button (click)="load('fast')">Fast Request (200ms)</button>
    <button (click)="load('slow')">Slow Request (2000ms)</button>
    <p>{{ status() }}</p>
    <small>timeout(500) cancels requests taking too long</small>
  `
})
class Ex15 {
  status = signal('idle');
  req$ = new Subject<'fast' | 'slow'>();

  constructor() {
    this.req$.pipe(
      switchMap(speed =>
        of('Data received!').pipe(
          delay(speed === 'fast' ? 200 : 2000),
          timeout(500),
          catchError(() => of('Request timed out after 500ms'))
        )
      )
    ).subscribe(r => this.status.set(r));
  }

  load(speed: 'fast' | 'slow') { this.status.set('loading...'); this.req$.next(speed); }
}

// 16. Loading action before + after HTTP — signal demo
@Component({
  selector: 'ex-16', standalone: true,
  template: `
    <button (click)="load()">Load</button>
    @if (isLoading()) { <p>Loading...</p> }
    @if (data()) { <p>Data: {{ data() }}</p> }
    @if (error()) { <p style="color:red">Error: {{ error() }}</p> }
  `
})
class Ex16 {
  isLoading = signal(false);
  data = signal('');
  error = signal('');
  trigger$ = new Subject<void>();

  constructor() {
    this.trigger$.pipe(
      tap(() => { this.isLoading.set(true); this.error.set(''); }),
      switchMap(() =>
        of('Users loaded!').pipe(
          delay(800),
          finalize(() => this.isLoading.set(false))
        )
      )
    ).subscribe({
      next: d => this.data.set(d),
      error: e => this.error.set(e.message)
    });
  }

  load() { this.trigger$.next(); }
}

// 17. Optimistic update effect — code display
@Component({
  selector: 'ex-17', standalone: true,
  template: `<pre>{{ code }}</pre>`
})
class Ex17 {
  code = `// Optimistic: update store immediately, rollback on failure
updateProduct$ = createEffect(() =>
  this.actions$.pipe(
    ofType(ProductActions.update),
    // optimistic update already dispatched before this effect
    mergeMap(({ product }) =>
      this.api.update(product).pipe(
        map(() => ProductActions.updateSuccess({ product })),
        catchError(error =>
          of(
            ProductActions.updateFailure({ error }),
            ProductActions.rollback({ previousProduct: product })
          )
        )
      )
    )
  )
);

// Reducer handles rollback:
// on(ProductActions.rollback, (state, { previousProduct }) =>
//   adapter.setOne(previousProduct, state)
// )`;
}

// 18. Effect dispatching multiple actions — code display
@Component({
  selector: 'ex-18', standalone: true,
  template: `<pre>{{ code }}</pre>`
})
class Ex18 {
  code = `// Use mergeMap + from([]) to dispatch multiple actions
loginSuccess$ = createEffect(() =>
  this.actions$.pipe(
    ofType(AuthActions.loginSuccess),
    mergeMap(({ user }) =>
      from([
        UserActions.setUser({ user }),
        CartActions.loadCart({ userId: user.id }),
        NotificationActions.show({ msg: 'Welcome back!' })
      ])
    )
  )
);

// Or return an array with EMPTY to terminate:
import { of, from } from 'rxjs';

singleEffect$ = createEffect(() =>
  this.actions$.pipe(
    ofType(SomeAction.trigger),
    switchMap(() =>
      from([ActionA(), ActionB(), ActionC()])
    )
  )
);`;
}

// 19. Debounced search effect — debounceTime demo
@Component({
  selector: 'ex-19', standalone: true,
  template: `
    <input (input)="search($event)" placeholder="Search..." style="width:100%" />
    <p>Searching for: {{ query() }}</p>
    <p>Result: {{ result() }}</p>
    <small>debounceTime(400) — waits 400ms after last keystroke</small>
  `
})
class Ex19 {
  query = signal('');
  result = signal('');
  input$ = new Subject<string>();

  constructor() {
    this.input$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(q => {
        this.query.set(q);
        if (!q) return of('');
        return of(`Found 5 results for "${q}"`).pipe(delay(300));
      })
    ).subscribe(r => this.result.set(r));
  }

  search(e: Event) { this.input$.next((e.target as HTMLInputElement).value); }
}

// 20. Throttled event effect — throttleTime demo
@Component({
  selector: 'ex-20', standalone: true,
  template: `
    <button (click)="click()">Click rapidly!</button>
    <p>Processed: {{ count() }} times</p>
    <p>Clicked: {{ raw() }} times</p>
    <small>throttleTime(1000) — at most once per second</small>
  `
})
class Ex20 {
  count = signal(0);
  raw = signal(0);
  click$ = new Subject<void>();

  constructor() {
    this.click$.pipe(
      throttleTime(1000)
    ).subscribe(() => this.count.update(v => v + 1));
  }

  click() { this.raw.update(v => v + 1); this.click$.next(); }
}

// 21. fromEvent-based effect — RxJS demo
@Component({
  selector: 'ex-21', standalone: true,
  template: `
    <p>Window width: {{ width() }}px</p>
    <p>Key pressed: {{ key() }}</p>
    <small>fromEvent listens to DOM events as Observable</small>
  `
})
class Ex21 implements OnInit, OnDestroy {
  width = signal(window.innerWidth);
  key = signal('(none)');
  destroy$ = new Subject<void>();

  ngOnInit() {
    fromEvent<UIEvent>(window, 'resize').pipe(
      takeUntil(this.destroy$),
      throttleTime(200)
    ).subscribe(() => this.width.set(window.innerWidth));

    fromEvent<KeyboardEvent>(document, 'keydown').pipe(
      takeUntil(this.destroy$)
    ).subscribe(e => this.key.set(e.key));
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }
}

// 22. Effect cleanup (takeUntilDestroyed concept) — demo
@Component({
  selector: 'ex-22', standalone: true,
  template: `
    <p>Tick: {{ tick() }}</p>
    <small>DestroyRef auto-cancels subscriptions on component destroy</small>
    <pre>{{ code }}</pre>
  `
})
class Ex22 {
  tick = signal(0);
  code = `// In Angular 16+: inject(DestroyRef)
const destroyRef = inject(DestroyRef);
const { takeUntilDestroyed } = rxInterop;

interval(1000).pipe(
  takeUntilDestroyed(destroyRef)
).subscribe(n => this.tick.set(n));

// Effect pattern:
loadData$ = createEffect(() =>
  this.actions$.pipe(
    ofType(DataActions.load),
    switchMap(() => this.api.get().pipe(
      takeUntilDestroyed(this.destroyRef)
    )),
    map(data => DataActions.success({ data }))
  )
);`;

  destroyRef = inject(DestroyRef);

  constructor() {
    interval(1000).pipe(
      take(100),
      takeUntil(new Subject<void>())
    ).subscribe(n => this.tick.set(n));
  }
}

// 23. concatLatestFrom operator pattern — code display
@Component({
  selector: 'ex-23', standalone: true,
  template: `<pre>{{ code }}</pre>`
})
class Ex23 {
  code = `// concatLatestFrom: like withLatestFrom but lazy (NgRx v12+)
import { concatLatestFrom } from '@ngrx/effects';

saveItem$ = createEffect(() =>
  this.actions$.pipe(
    ofType(ItemActions.save),
    concatLatestFrom(() => this.store.select(selectCurrentUser)),
    // [action, user] tuple
    mergeMap(([action, user]) =>
      this.api.save({ ...action.item, createdBy: user.id }).pipe(
        map(item => ItemActions.saveSuccess({ item })),
        catchError(e => of(ItemActions.saveFailure({ error: e })))
      )
    )
  )
);

// vs withLatestFrom (eager — subscribes immediately):
// concatLatestFrom is preferred in effects — subscribes lazily`;
}

// 24. Effect with timer delay — RxJS demo
@Component({
  selector: 'ex-24', standalone: true,
  template: `
    <button (click)="trigger()">Show Notification (auto-dismiss in 2s)</button>
    @if (visible()) { <p style="background:#4caf50;color:white;padding:8px">Saved successfully!</p> }
    <small>timer(2000) creates delayed dismiss effect</small>
  `
})
class Ex24 {
  visible = signal(false);
  trigger$ = new Subject<void>();

  constructor() {
    this.trigger$.pipe(
      tap(() => this.visible.set(true)),
      switchMap(() => timer(2000))
    ).subscribe(() => this.visible.set(false));
  }

  trigger() { this.trigger$.next(); }
}

// 25. LocalStorage persistence effect — demo
@Component({
  selector: 'ex-25', standalone: true,
  template: `
    <input [(ngModel)]="themeName" placeholder="Theme name" />
    <button (click)="save()">Save Theme</button>
    <p>Stored: {{ stored() }}</p>
    <small>Side effect: persists to localStorage on action</small>
  `,
  imports: []
})
class Ex25 {
  themeName = 'dark';
  stored = signal(localStorage.getItem('theme') ?? '(none)');
  save$ = new Subject<string>();

  constructor() {
    this.save$.pipe(
      tap(theme => {
        localStorage.setItem('theme', theme);
        this.stored.set(theme);
      })
    ).subscribe();
  }

  save() { this.save$.next(this.themeName); }
}

// 26. Analytics tracking effect — demo
@Component({
  selector: 'ex-26', standalone: true,
  template: `
    <button (click)="track('button_click', 'home')">Click (tracked)</button>
    <button (click)="track('page_view', 'about')">View About (tracked)</button>
    <ul>@for (e of events(); track e) { <li>{{ e }}</li> }</ul>
    <small>Simulates analytics side-effect (dispatch: false)</small>
  `
})
class Ex26 {
  events = signal<string[]>([]);
  track$ = new Subject<{ name: string; page: string }>();

  constructor() {
    this.track$.pipe(
      tap(({ name, page }) => {
        const entry = `[Analytics] ${name} on ${page} at ${new Date().toLocaleTimeString()}`;
        this.events.update(v => [entry, ...v].slice(0, 5));
      })
    ).subscribe();
  }

  track(name: string, page: string) { this.track$.next({ name, page }); }
}

// ─── NESTED (27–38) ─────────────────────────────────────────

// 27. Chained effects: success triggers next — code display
@Component({
  selector: 'ex-27', standalone: true,
  template: `<pre>{{ code }}</pre>`
})
class Ex27 {
  code = `// Effect A dispatches success → Effect B listens to it
// Effect A: load order
loadOrder$ = createEffect(() =>
  this.actions$.pipe(
    ofType(OrderActions.load),
    switchMap(({ id }) =>
      this.api.getOrder(id).pipe(
        map(order => OrderActions.loadSuccess({ order })),
        catchError(e => of(OrderActions.loadFailure({ error: e })))
      )
    )
  )
);

// Effect B: triggered by A's success → load related products
loadOrderProducts$ = createEffect(() =>
  this.actions$.pipe(
    ofType(OrderActions.loadSuccess),           // listens to A's output
    switchMap(({ order }) =>
      this.api.getProducts(order.productIds).pipe(
        map(products => ProductActions.loadSuccess({ products })),
        catchError(e => of(ProductActions.loadFailure({ error: e })))
      )
    )
  )
);`;
}

// 28. Effect pipeline with multiple operators — RxJS demo
@Component({
  selector: 'ex-28', standalone: true,
  template: `
    <button (click)="run()">Run Pipeline</button>
    <ul>@for (s of steps(); track s) { <li>{{ s }}</li> }</ul>
    <small>Multi-operator pipeline: filter→map→delay→tap→finalize</small>
  `
})
class Ex28 {
  steps = signal<string[]>([]);
  run$ = new Subject<number>();
  counter = 0;

  constructor() {
    this.run$.pipe(
      filter(n => n % 2 === 0),
      tap(n => this.steps.update(v => [...v, `filter: ${n} is even`])),
      map(n => n * 10),
      tap(n => this.steps.update(v => [...v, `map: ×10 = ${n}`])),
      delay(300),
      tap(n => this.steps.update(v => [...v, `after delay: ${n}`])),
      finalize(() => this.steps.update(v => [...v, 'finalized']))
    ).subscribe();
  }

  run() { this.steps.set([]); this.run$.next(this.counter++ % 4 === 0 ? 2 : 3); }
}

// 29. Effect with forkJoin parallel calls — RxJS demo
@Component({
  selector: 'ex-29', standalone: true,
  template: `
    <button (click)="loadAll()">Load All (parallel)</button>
    <p>{{ status() }}</p>
    <small>forkJoin waits for ALL observables to complete</small>
  `
})
class Ex29 {
  status = signal('idle');
  trigger$ = new Subject<void>();

  constructor() {
    this.trigger$.pipe(
      switchMap(() => {
        this.status.set('loading...');
        return forkJoin({
          users: of(['Alice', 'Bob']).pipe(delay(400)),
          products: of(['Widget', 'Gadget']).pipe(delay(600)),
          orders: of([{ id: 1 }, { id: 2 }]).pipe(delay(200))
        });
      })
    ).subscribe(({ users, products, orders }) => {
      this.status.set(`Loaded: ${users.length} users, ${products.length} products, ${orders.length} orders`);
    });
  }

  loadAll() { this.trigger$.next(); }
}

// 30. Effect with conditional dispatch — code display
@Component({
  selector: 'ex-30', standalone: true,
  template: `<pre>{{ code }}</pre>`
})
class Ex30 {
  code = `// Conditionally dispatch based on store state or action payload
conditionalEffect$ = createEffect(() =>
  this.actions$.pipe(
    ofType(CartActions.checkout),
    concatLatestFrom(() => this.store.select(selectIsLoggedIn)),
    mergeMap(([action, isLoggedIn]) => {
      if (!isLoggedIn) {
        // redirect to login instead
        return of(RouterActions.navigate({ path: '/login' }));
      }
      return this.api.checkout(action.cart).pipe(
        map(order => OrderActions.createSuccess({ order })),
        catchError(e => of(OrderActions.createFailure({ error: e })))
      );
    })
  )
);`;
}

// 31. Error effect → notification signal update — demo
@Component({
  selector: 'ex-31', standalone: true,
  template: `
    <button (click)="fail()">Trigger Failing Request</button>
    <button (click)="succeed()">Trigger Successful Request</button>
    @if (notification()) {
      <p [style.color]="notifColor()">{{ notification() }}</p>
    }
  `
})
class Ex31 {
  notification = signal('');
  notifColor = computed(() => this.notification().startsWith('Error') ? 'red' : 'green');
  action$ = new Subject<boolean>();

  constructor() {
    this.action$.pipe(
      switchMap(shouldFail =>
        of(shouldFail).pipe(
          delay(400),
          switchMap(fail => fail
            ? from(Promise.reject(new Error('Server error 500')))
            : of('Data saved successfully')
          ),
          catchError(e => of(`Error: ${e.message}`))
        )
      )
    ).subscribe(msg => {
      this.notification.set(msg);
      setTimeout(() => this.notification.set(''), 3000);
    });
  }

  fail() { this.action$.next(true); }
  succeed() { this.action$.next(false); }
}

// 32. CRUD effects set — code display
@Component({
  selector: 'ex-32', standalone: true,
  template: `<pre>{{ code }}</pre>`
})
class Ex32 {
  code = `// Full CRUD effects
@Injectable()
export class ItemEffects {
  load$ = createEffect(() => this.actions$.pipe(
    ofType(ItemActions.load),
    switchMap(() => this.api.getAll().pipe(
      map(items => ItemActions.loadSuccess({ items })),
      catchError(e => of(ItemActions.loadFailure({ error: e.message })))
    ))
  ));

  create$ = createEffect(() => this.actions$.pipe(
    ofType(ItemActions.create),
    mergeMap(({ item }) => this.api.create(item).pipe(
      map(created => ItemActions.createSuccess({ item: created })),
      catchError(e => of(ItemActions.createFailure({ error: e.message })))
    ))
  ));

  update$ = createEffect(() => this.actions$.pipe(
    ofType(ItemActions.update),
    mergeMap(({ id, changes }) => this.api.update(id, changes).pipe(
      map(item => ItemActions.updateSuccess({ item })),
      catchError(e => of(ItemActions.updateFailure({ error: e.message })))
    ))
  ));

  delete$ = createEffect(() => this.actions$.pipe(
    ofType(ItemActions.delete),
    mergeMap(({ id }) => this.api.delete(id).pipe(
      map(() => ItemActions.deleteSuccess({ id })),
      catchError(e => of(ItemActions.deleteFailure({ error: e.message })))
    ))
  ));
}`;
}

// 33. Auth token refresh on 401 — code display
@Component({
  selector: 'ex-33', standalone: true,
  template: `<pre>{{ code }}</pre>`
})
class Ex33 {
  code = `// Intercept 401 → refresh token → retry original request
@Injectable()
export class AuthEffects {
  refreshOn401$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApiActions.failure),
      filter(({ error }) => error.status === 401),
      exhaustMap(() =>
        this.auth.refreshToken().pipe(
          map(token => AuthActions.tokenRefreshed({ token })),
          catchError(() => of(AuthActions.logout()))
        )
      )
    )
  );

  retryAfterRefresh$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.tokenRefreshed),
      concatLatestFrom(() => this.store.select(selectLastFailedAction)),
      map(([_, action]) => action)  // re-dispatch original action
    )
  );
}`;
}

// 34. WebSocket messages simulation — Subject demo
@Component({
  selector: 'ex-34', standalone: true,
  template: `
    <button (click)="start()">Connect</button>
    <button (click)="stop()">Disconnect</button>
    <p>Status: {{ status() }}</p>
    <ul>@for (m of messages(); track m) { <li>{{ m }}</li> }</ul>
    <small>Simulates WebSocket stream with interval</small>
  `
})
class Ex34 {
  status = signal('disconnected');
  messages = signal<string[]>([]);
  stop$ = new Subject<void>();
  ws$ = new Subject<boolean>();

  constructor() {
    this.ws$.pipe(
      switchMap(connect => {
        if (!connect) { this.status.set('disconnected'); return EMPTY; }
        this.status.set('connected');
        return interval(1000).pipe(
          takeUntil(this.stop$),
          map(n => `msg_${n}: ${['ping', 'data update', 'heartbeat'][n % 3]}`),
          tap(msg => this.messages.update(v => [msg, ...v].slice(0, 6)))
        );
      })
    ).subscribe();
  }

  start() { this.messages.set([]); this.ws$.next(true); }
  stop() { this.stop$.next(); this.ws$.next(false); }
}

// 35. Page title update effect — demo
@Component({
  selector: 'ex-35', standalone: true,
  template: `
    <button (click)="setPage('Home')">Go Home</button>
    <button (click)="setPage('Products')">Go Products</button>
    <button (click)="setPage('About')">Go About</button>
    <p>Title set to: {{ title() }}</p>
    <small>Side-effect: updates document.title (dispatch: false pattern)</small>
  `
})
class Ex35 {
  title = signal('');
  nav$ = new Subject<string>();

  constructor() {
    this.nav$.pipe(
      map(page => `MyApp — ${page}`),
      tap(t => {
        document.title = t;
        this.title.set(t);
      })
    ).subscribe();
  }

  setPage(page: string) { this.nav$.next(page); }
}

// 36. Effect coordination pattern — code display
@Component({
  selector: 'ex-36', standalone: true,
  template: `<pre>{{ code }}</pre>`
})
class Ex36 {
  code = `// Coordinator effect: waits for multiple effects to finish
initApp$ = createEffect(() =>
  this.actions$.pipe(
    ofType(AppActions.init),
    switchMap(() =>
      forkJoin([
        this.store.select(selectUser).pipe(first(u => !!u)),
        this.store.select(selectConfig).pipe(first(c => !!c)),
      ])
    ),
    map(([user, config]) => AppActions.ready({ user, config }))
  )
);

// Dispatching sequence:
// 1. AppActions.init  → triggers loadUser + loadConfig effects in parallel
// 2. Both succeed     → initApp$ sees both selectors emit
// 3. AppActions.ready → app shell renders`;
}

// 37. Multi-step async effect — RxJS demo
@Component({
  selector: 'ex-37', standalone: true,
  template: `
    <button (click)="run()">Run Multi-step</button>
    <ul>@for (s of steps(); track s) { <li>{{ s }}</li> }</ul>
  `
})
class Ex37 {
  steps = signal<string[]>([]);
  run$ = new Subject<void>();

  constructor() {
    this.run$.pipe(
      switchMap(() => {
        this.steps.set([]);
        return of('step1').pipe(
          delay(300),
          tap(s => this.steps.update(v => [...v, `1. Validated: ${s}`])),
          switchMap(() => of('step2').pipe(delay(400))),
          tap(s => this.steps.update(v => [...v, `2. Saved: ${s}`])),
          switchMap(() => of('step3').pipe(delay(300))),
          tap(s => this.steps.update(v => [...v, `3. Notified: ${s}`])),
          map(() => 'Complete!')
        );
      })
    ).subscribe(final => this.steps.update(v => [...v, final]));
  }

  run() { this.run$.next(); }
}

// 38. Full optimistic CRUD with effects — code display
@Component({
  selector: 'ex-38', standalone: true,
  template: `<pre>{{ code }}</pre>`
})
class Ex38 {
  code = `// Full optimistic CRUD pattern in NgRx Effects
@Injectable()
export class TodoEffects {
  // Optimistic add: reducer adds immediately, effect confirms/rolls back
  add$ = createEffect(() => this.actions$.pipe(
    ofType(TodoActions.add),
    mergeMap(({ todo }) =>
      this.api.create(todo).pipe(
        map(saved => TodoActions.addConfirmed({ tempId: todo.id, saved })),
        catchError(() => of(TodoActions.addRolledBack({ id: todo.id })))
      )
    )
  ));

  // Optimistic delete: remove immediately, restore on failure
  delete$ = createEffect(() => this.actions$.pipe(
    ofType(TodoActions.delete),
    mergeMap(({ todo }) =>
      this.api.delete(todo.id).pipe(
        map(() => TodoActions.deleteConfirmed({ id: todo.id })),
        catchError(() => of(TodoActions.deleteRolledBack({ todo })))
      )
    )
  ));
}`;
}

// ─── ADVANCED (39–50) ───────────────────────────────────────

// 39. Exponential backoff retry — RxJS operator demo
@Component({
  selector: 'ex-39', standalone: true,
  template: `
    <button (click)="fetch()">Fetch with Backoff</button>
    <p>{{ status() }}</p>
    <ul>@for (a of attempts(); track a) { <li>{{ a }}</li> }</ul>
    <small>Exponential backoff: 1s → 2s → 4s delays between retries</small>
  `
})
class Ex39 {
  status = signal('idle');
  attempts = signal<string[]>([]);
  trigger$ = new Subject<void>();
  tryCount = 0;

  constructor() {
    this.trigger$.pipe(
      switchMap(() => {
        this.tryCount = 0;
        this.attempts.set([]);
        return of(null).pipe(
          switchMap(() => {
            this.tryCount++;
            this.attempts.update(v => [...v, `Attempt #${this.tryCount} at ${new Date().toLocaleTimeString()}`]);
            if (this.tryCount < 4) return from(Promise.reject(new Error(`Error ${this.tryCount}`)));
            return of('Success!');
          }),
          retryWhen(errors =>
            errors.pipe(
              scan((acc) => acc + 1, 0),
              take(3),
              delayWhen(n => timer(Math.pow(2, n) * 500))
            )
          ),
          catchError(e => of(`Failed after backoff: ${e.message}`))
        );
      })
    ).subscribe(r => this.status.set(r as string));
  }

  fetch() { this.status.set('loading...'); this.trigger$.next(); }
}

// 40. Circuit breaker pattern — RxJS demo
@Component({
  selector: 'ex-40', standalone: true,
  template: `
    <button (click)="request()">Make Request</button>
    <p>Circuit: <strong>{{ circuit() }}</strong></p>
    <p>{{ status() }}</p>
    <small>Open circuit blocks requests for 5s after 3 failures</small>
  `
})
class Ex40 {
  circuit = signal<'CLOSED' | 'OPEN'>('CLOSED');
  status = signal('idle');
  failures = 0;
  openUntil = 0;

  request() {
    if (this.circuit() === 'OPEN') {
      if (Date.now() < this.openUntil) {
        this.status.set('Circuit OPEN — blocked');
        return;
      }
      this.circuit.set('CLOSED');
      this.failures = 0;
    }

    of(null).pipe(
      delay(200),
      switchMap(() => {
        if (Math.random() > 0.4) return from(Promise.reject(new Error('Service down')));
        return of('200 OK');
      }),
      catchError(e => {
        this.failures++;
        if (this.failures >= 3) {
          this.circuit.set('OPEN');
          this.openUntil = Date.now() + 5000;
          this.status.set('Circuit OPEN for 5s');
        } else {
          this.status.set(`Error (${this.failures}/3): ${e.message}`);
        }
        return EMPTY;
      })
    ).subscribe(r => {
      this.failures = 0;
      this.status.set(`Success: ${r}`);
    });
  }
}

// 41. Request deduplication — distinctUntilChanged demo
@Component({
  selector: 'ex-41', standalone: true,
  template: `
    <button (click)="dispatch('users')">Load Users</button>
    <button (click)="dispatch('users')">Load Users (dup)</button>
    <button (click)="dispatch('products')">Load Products</button>
    <p>Actual requests made: {{ requestCount() }}</p>
    <p>Last: {{ last() }}</p>
    <small>distinctUntilChanged drops duplicate consecutive requests</small>
  `
})
class Ex41 {
  requestCount = signal(0);
  last = signal('');
  action$ = new Subject<string>();

  constructor() {
    this.action$.pipe(
      distinctUntilChanged(),
      switchMap(resource => {
        this.requestCount.update(v => v + 1);
        return of(`Loaded ${resource}`).pipe(delay(200));
      })
    ).subscribe(r => this.last.set(r));
  }

  dispatch(r: string) { this.action$.next(r); }
}

// 42. Optimistic UI + rollback — signal demo
@Component({
  selector: 'ex-42', standalone: true,
  template: `
    <button (click)="add('Item ' + counter)">Add Item (optimistic)</button>
    <ul>@for (i of items(); track i.id) {
      <li [style.color]="i.pending ? 'gray' : 'black'">
        {{ i.name }} {{ i.pending ? '(saving...)' : '✓' }}
      </li>
    }</ul>
    <button (click)="toggleFail()">Fail next: {{ willFail() }}</button>
  `
})
class Ex42 {
  counter = 1;
  items = signal<{ id: string; name: string; pending: boolean }[]>([]);
  willFail = signal(false);
  add$ = new Subject<{ id: string; name: string }>();

  constructor() {
    this.add$.pipe(
      mergeMap(item => {
        this.items.update(v => [...v, { ...item, pending: true }]);
        const shouldFail = this.willFail();
        return of(shouldFail).pipe(
          delay(800),
          switchMap(fail => fail
            ? from(Promise.reject(new Error('Save failed')))
            : of(item)
          ),
          catchError(() => {
            this.items.update(v => v.filter(i => i.id !== item.id));
            return EMPTY;
          })
        );
      })
    ).subscribe(item => {
      this.items.update(v => v.map(i => i.id === item.id ? { ...i, pending: false } : i));
    });
  }

  add(name: string) {
    this.add$.next({ id: Date.now().toString(), name });
    this.counter++;
  }
  toggleFail() { this.willFail.update(v => !v); }
}

// 43. Performance tracking effect — demo
@Component({
  selector: 'ex-43', standalone: true,
  template: `
    <button (click)="track('loadUsers')">Simulate loadUsers</button>
    <button (click)="track('saveOrder')">Simulate saveOrder</button>
    <ul>@for (m of metrics(); track m) { <li>{{ m }}</li> }</ul>
    <small>Tracks action duration for performance monitoring</small>
  `
})
class Ex43 {
  metrics = signal<string[]>([]);
  action$ = new Subject<string>();

  constructor() {
    this.action$.pipe(
      mergeMap(name => {
        const start = performance.now();
        return of(name).pipe(
          delay(Math.random() * 600 + 100),
          tap(() => {
            const duration = (performance.now() - start).toFixed(1);
            this.metrics.update(v =>
              [`${name}: ${duration}ms`, ...v].slice(0, 6)
            );
          })
        );
      })
    ).subscribe();
  }

  track(name: string) { this.action$.next(name); }
}

// 44. Higher-order effect concept — code display
@Component({
  selector: 'ex-44', standalone: true,
  template: `<pre>{{ code }}</pre>`
})
class Ex44 {
  code = `// Higher-order effect: effect factory that creates effects dynamically
function createLoadEffect<T>(
  action: ActionCreator,
  apiFn: () => Observable<T>,
  successAction: (data: T) => Action,
  failureAction: (error: string) => Action
) {
  return createEffect((actions$ = inject(Actions), api = inject(ApiService)) =>
    actions$.pipe(
      ofType(action),
      switchMap(() =>
        apiFn().pipe(
          map(data => successAction(data)),
          catchError(e => of(failureAction(e.message)))
        )
      )
    )
  );
}

// Usage — zero boilerplate per entity:
export const loadUsersEffect = createLoadEffect(
  UserActions.load,
  () => inject(UserService).getAll(),
  users => UserActions.loadSuccess({ users }),
  error => UserActions.loadFailure({ error })
);`;
}

// 45. Effect testing with marbles concept — code display
@Component({
  selector: 'ex-45', standalone: true,
  template: `<pre>{{ code }}</pre>`
})
class Ex45 {
  code = `// Marble testing NgRx Effects
import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { TestScheduler } from 'rxjs/testing';

describe('ProductEffects', () => {
  let actions$: Observable<Action>;
  let effects: ProductEffects;
  let scheduler: TestScheduler;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProductEffects,
        provideMockActions(() => actions$),
        { provide: ProductService, useValue: { getAll: () => of([]) } }
      ]
    });
    effects = TestBed.inject(ProductEffects);
    scheduler = new TestScheduler((a, b) => expect(a).toEqual(b));
  });

  it('should load products', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      // a = load action, b = success action
      actions$ = hot('-a', { a: ProductActions.load() });
      const api = TestBed.inject(ProductService);
      spyOn(api, 'getAll').and.returnValue(cold('-b|', { b: [] }));
      expectObservable(effects.loadProducts$).toBe('--b', {
        b: ProductActions.loadSuccess({ products: [] })
      });
    });
  });
});`;
}

// 46. Non-dispatching effect for DOM — demo
@Component({
  selector: 'ex-46', standalone: true,
  template: `
    <button (click)="notify('Item saved!')">Save</button>
    <button (click)="notify('Deleted')">Delete</button>
    <p>{{ toast() }}</p>
    <small>dispatch: false — side effect only, no new action</small>
  `
})
class Ex46 {
  toast = signal('');
  notify$ = new Subject<string>();

  constructor() {
    this.notify$.pipe(
      tap(msg => this.toast.set(msg)),
      switchMap(msg => timer(2000).pipe(map(() => msg)))
    ).subscribe(() => this.toast.set(''));
  }

  notify(msg: string) { this.notify$.next(msg); }
}

// 47. Effect factory pattern — code display
@Component({
  selector: 'ex-47', standalone: true,
  template: `<pre>{{ code }}</pre>`
})
class Ex47 {
  code = `// Effect factory: generates CRUD effects for any resource
function crudEffectFactory<T extends { id: string }>(
  resource: string,
  actions: CrudActions<T>,
  apiService: Type<CrudService<T>>
) {
  return {
    load: createEffect((actions$ = inject(Actions), api = inject(apiService)) =>
      actions$.pipe(
        ofType(actions.load),
        switchMap(() => api.getAll().pipe(
          map(items => actions.loadSuccess({ items })),
          catchError(e => of(actions.loadFailure({ error: e.message })))
        ))
      )
    ),
    create: createEffect((actions$ = inject(Actions), api = inject(apiService)) =>
      actions$.pipe(
        ofType(actions.create),
        mergeMap(({ item }) => api.create(item).pipe(
          map(created => actions.createSuccess({ item: created })),
          catchError(e => of(actions.createFailure({ error: e.message })))
        ))
      )
    ),
    // ... update, delete
  };
}

// Usage:
export const UserEffects = crudEffectFactory('users', UserActions, UserService);`;
}

// 48. Effect with progressive loading — demo
@Component({
  selector: 'ex-48', standalone: true,
  template: `
    <button (click)="load()">Load Progressively</button>
    <p>Progress: {{ progress() }}%</p>
    <div style="background:#eee;height:10px;width:100%">
      <div [style.width.%]="progress()" style="background:#4caf50;height:10px;transition:width .3s"></div>
    </div>
    <ul>@for (item of loaded(); track item) { <li>{{ item }}</li> }</ul>
  `
})
class Ex48 {
  progress = signal(0);
  loaded = signal<string[]>([]);
  trigger$ = new Subject<void>();
  batches = [
    ['User 1', 'User 2', 'User 3'],
    ['User 4', 'User 5', 'User 6'],
    ['User 7', 'User 8', 'User 9'],
    ['User 10']
  ];

  constructor() {
    this.trigger$.pipe(
      switchMap(() => {
        this.progress.set(0);
        this.loaded.set([]);
        const total = this.batches.length;
        return from(this.batches).pipe(
          concatMap((batch, i) =>
            of(batch).pipe(
              delay(500),
              tap(() => {
                this.loaded.update(v => [...v, ...batch]);
                this.progress.set(Math.round(((i + 1) / total) * 100));
              })
            )
          )
        );
      })
    ).subscribe();
  }

  load() { this.trigger$.next(); }
}

// 49. Full resilient API effects pattern — code display
@Component({
  selector: 'ex-49', standalone: true,
  template: `<pre>{{ code }}</pre>`
})
class Ex49 {
  code = `// Production-grade resilient effect with all patterns combined
loadData$ = createEffect(() =>
  this.actions$.pipe(
    ofType(DataActions.load),
    debounceTime(100),                    // debounce rapid dispatches
    distinctUntilChanged((a, b) =>        // skip duplicate requests
      a.resourceId === b.resourceId
    ),
    tap(() => this.store.dispatch(UIActions.showLoader())),
    switchMap(({ resourceId }) =>
      this.api.get(resourceId).pipe(
        timeout(10_000),                  // 10s timeout
        retry({
          count: 3,
          delay: (_, retryIndex) =>       // exponential backoff
            timer(Math.pow(2, retryIndex) * 1000)
        }),
        map(data => DataActions.loadSuccess({ data })),
        catchError(error => of(
          DataActions.loadFailure({ error: error.message }),
          UIActions.showError({ message: error.message })
        )),
        finalize(() =>
          this.store.dispatch(UIActions.hideLoader())
        )
      )
    )
  )
);`;
}

// 50. Effect migration to signals pattern — code display
@Component({
  selector: 'ex-50', standalone: true,
  template: `<pre>{{ code }}</pre>`
})
class Ex50 {
  code = `// Before: NgRx Effect + reducer for async load
// EFFECT:
loadUsers$ = createEffect(() =>
  this.actions$.pipe(
    ofType(UserActions.load),
    switchMap(() => this.api.getAll().pipe(
      map(users => UserActions.loadSuccess({ users })),
      catchError(e => of(UserActions.loadFailure({ error: e.message })))
    ))
  )
);
// REDUCER: on(loadSuccess) → set users; on(loadFailure) → set error

// ─────────────────────────────────────────────
// After: resource() signal (Angular 19+)
// resource() replaces the entire effect + reducer for simple loads
import { resource } from '@angular/core';

@Component({ ... })
class UserListComponent {
  private api = inject(UserService);

  users = resource({
    loader: () => this.api.getAll()
  });
  // users.value() → data
  // users.isLoading() → boolean
  // users.error() → error
  // users.reload() → re-trigger
  // No store, no effect, no reducer needed!
}`;
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
      <h1>Examples 7.3 — NgRx Effects (50 examples)</h1>

      <h4>1. Effect concept: action → side effect → new action</h4><ex-01 /><hr />
      <h4>2. Actions.pipe(ofType(...)) pattern</h4><ex-02 /><hr />
      <h4>3. switchMap in effect</h4><ex-03 /><hr />
      <h4>4. mergeMap in effect</h4><ex-04 /><hr />
      <h4>5. concatMap in effect</h4><ex-05 /><hr />
      <h4>6. exhaustMap in effect</h4><ex-06 /><hr />
      <h4>7. dispatch: false effect (fire-and-forget)</h4><ex-07 /><hr />
      <h4>8. tap-only effect (logging)</h4><ex-08 /><hr />
      <h4>9. catchError dispatching failure action</h4><ex-09 /><hr />
      <h4>10. success/failure action pair</h4><ex-10 /><hr />
      <h4>11. HTTP GET effect simulation</h4><ex-11 /><hr />
      <h4>12. HTTP POST effect simulation</h4><ex-12 /><hr />
      <h4>13. Effect with router navigate</h4><ex-13 /><hr />

      <h4>14. Error handling with retry(3)</h4><ex-14 /><hr />
      <h4>15. Timeout on HTTP</h4><ex-15 /><hr />
      <h4>16. Loading action before + after HTTP</h4><ex-16 /><hr />
      <h4>17. Optimistic update effect</h4><ex-17 /><hr />
      <h4>18. Effect dispatching multiple actions</h4><ex-18 /><hr />
      <h4>19. Debounced search effect</h4><ex-19 /><hr />
      <h4>20. Throttled event effect</h4><ex-20 /><hr />
      <h4>21. fromEvent-based effect</h4><ex-21 /><hr />
      <h4>22. Effect cleanup (takeUntilDestroyed)</h4><ex-22 /><hr />
      <h4>23. concatLatestFrom operator pattern</h4><ex-23 /><hr />
      <h4>24. Effect with timer delay</h4><ex-24 /><hr />
      <h4>25. LocalStorage persistence effect</h4><ex-25 /><hr />
      <h4>26. Analytics tracking effect</h4><ex-26 /><hr />

      <h4>27. Chained effects: success triggers next</h4><ex-27 /><hr />
      <h4>28. Effect pipeline with multiple operators</h4><ex-28 /><hr />
      <h4>29. Effect with forkJoin parallel calls</h4><ex-29 /><hr />
      <h4>30. Effect with conditional dispatch</h4><ex-30 /><hr />
      <h4>31. Error effect → notification signal update</h4><ex-31 /><hr />
      <h4>32. CRUD effects set</h4><ex-32 /><hr />
      <h4>33. Auth token refresh on 401</h4><ex-33 /><hr />
      <h4>34. WebSocket messages simulation</h4><ex-34 /><hr />
      <h4>35. Page title update effect</h4><ex-35 /><hr />
      <h4>36. Effect coordination pattern</h4><ex-36 /><hr />
      <h4>37. Multi-step async effect</h4><ex-37 /><hr />
      <h4>38. Full optimistic CRUD with effects</h4><ex-38 /><hr />

      <h4>39. Exponential backoff retry</h4><ex-39 /><hr />
      <h4>40. Circuit breaker pattern</h4><ex-40 /><hr />
      <h4>41. Request deduplication</h4><ex-41 /><hr />
      <h4>42. Optimistic UI + rollback</h4><ex-42 /><hr />
      <h4>43. Performance tracking effect</h4><ex-43 /><hr />
      <h4>44. Higher-order effect concept</h4><ex-44 /><hr />
      <h4>45. Effect testing with marbles concept</h4><ex-45 /><hr />
      <h4>46. Non-dispatching effect for DOM</h4><ex-46 /><hr />
      <h4>47. Effect factory pattern</h4><ex-47 /><hr />
      <h4>48. Effect with progressive loading</h4><ex-48 /><hr />
      <h4>49. Full resilient API effects pattern</h4><ex-49 /><hr />
      <h4>50. Effect migration to signals pattern</h4><ex-50 /><hr />
    </div>
  `
})
export class AppComponent {}
