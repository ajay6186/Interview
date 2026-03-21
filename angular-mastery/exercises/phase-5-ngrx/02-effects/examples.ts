// Phase 5 - NgRx Effects: 50 Examples
// Angular 17+, standalone components
// NgRx Effects patterns simulated with signals + RxJS-style descriptions.
// Actual NgRx effect code shown in <pre> blocks; live demos use signals.

import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ─── Ex01 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-01',
  standalone: true,
  template: `
    <h4>Ex 01 – createEffect basic</h4>
    <pre>{{ code }}</pre>
    <button (click)="simulate()">Simulate effect trigger</button>
    <p>{{ log() }}</p>
    <hr />
  `
})
export class Ex01 {
  code = `@Injectable()
export class CounterEffects {
  increment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(increment),
      tap(() => console.log('increment dispatched'))
    ), { dispatch: false }
  );
  constructor(private actions$: Actions) {}
}`;
  log = signal('');
  simulate() { this.log.set('Effect triggered: increment dispatched'); }
}

// ─── Ex02 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-02',
  standalone: true,
  template: `
    <h4>Ex 02 – Actions ofType filter</h4>
    <pre>{{ code }}</pre>
    <button (click)="dispatch('loadUsers')">Dispatch loadUsers</button>
    <button (click)="dispatch('increment')">Dispatch increment</button>
    <p>Handled: {{ handled() }}</p>
    <hr />
  `
})
export class Ex02 {
  code = `loadUsers$ = createEffect(() =>
  this.actions$.pipe(
    ofType(loadUsers),   // ONLY passes loadUsers actions through
    // increment, decrement, etc. are filtered out
    switchMap(() => this.userService.getAll())
  )
);`;
  handled = signal('none');
  dispatch(action: string) {
    this.handled.set(action === 'loadUsers' ? 'ofType(loadUsers) matched!' : `${action} filtered out`);
  }
}

// ─── Ex03 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-03',
  standalone: true,
  template: `
    <h4>Ex 03 – switchMap in effect</h4>
    <pre>{{ code }}</pre>
    <p>switchMap cancels previous inner observable on new emission.</p>
    <p>Best for: search, load latest (cancel stale requests)</p>
    <button (click)="search()">Trigger search (cancels previous)</button>
    <p>Status: {{ status() }}</p>
    <hr />
  `
})
export class Ex03 {
  code = `search$ = createEffect(() =>
  this.actions$.pipe(
    ofType(searchUsers),
    debounceTime(300),
    switchMap(({ query }) =>
      this.userService.search(query).pipe(
        map(users => searchSuccess({ users })),
        catchError(err => of(searchFailure({ error: err.message })))
      )
    )
  )
);`;
  private counter = 0;
  status = signal('idle');
  search() {
    this.counter++;
    const id = this.counter;
    this.status.set(`Request #${id} started (previous cancelled)`);
  }
}

// ─── Ex04 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-04',
  standalone: true,
  template: `
    <h4>Ex 04 – mergeMap in effect</h4>
    <pre>{{ code }}</pre>
    <p>mergeMap: runs all inner observables CONCURRENTLY. No cancellation.</p>
    <p>Best for: delete operations, fire-and-forget</p>
    <hr />
  `
})
export class Ex04 {
  code = `deleteUser$ = createEffect(() =>
  this.actions$.pipe(
    ofType(deleteUser),
    mergeMap(({ id }) =>                  // concurrent: multiple deletes run in parallel
      this.userService.delete(id).pipe(
        map(()  => deleteUserSuccess({ id })),
        catchError(err => of(deleteUserFailure({ id, error: err.message })))
      )
    )
  )
);`;
}

// ─── Ex05 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-05',
  standalone: true,
  template: `
    <h4>Ex 05 – concatMap in effect</h4>
    <pre>{{ code }}</pre>
    <p>concatMap: queues inner observables, runs them one at a time IN ORDER.</p>
    <p>Best for: ordered operations (e.g., sequential updates)</p>
    <hr />
  `
})
export class Ex05 {
  code = `updateUser$ = createEffect(() =>
  this.actions$.pipe(
    ofType(updateUser),
    concatMap(({ user }) =>               // sequential: waits for each to complete
      this.userService.update(user).pipe(
        map(u  => updateUserSuccess({ user: u })),
        catchError(err => of(updateUserFailure({ error: err.message })))
      )
    )
  )
);`;
}

// ─── Ex06 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-06',
  standalone: true,
  template: `
    <h4>Ex 06 – exhaustMap in effect</h4>
    <pre>{{ code }}</pre>
    <p>exhaustMap: ignores new emissions while inner observable is active.</p>
    <p>Best for: login, form submission (prevent double-submit)</p>
    <hr />
  `
})
export class Ex06 {
  code = `login$ = createEffect(() =>
  this.actions$.pipe(
    ofType(login),
    exhaustMap(({ credentials }) =>       // ignores extra login clicks while in-flight
      this.authService.login(credentials).pipe(
        map(user  => loginSuccess({ user })),
        catchError(err => of(loginFailure({ error: err.message })))
      )
    )
  )
);`;
}

// ─── Ex07 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-07',
  standalone: true,
  template: `
    <h4>Ex 07 – dispatch: false effect (side effects)</h4>
    <pre>{{ code }}</pre>
    <button (click)="simulate()">Simulate side-effect</button>
    <p>{{ log() }}</p>
    <hr />
  `
})
export class Ex07 {
  code = `// Non-dispatching effect — used for side effects (logging, storage, etc.)
logger$ = createEffect(() =>
  this.actions$.pipe(
    tap(action => console.log('[Action Log]', action.type))
  ), { dispatch: false }   // ← crucial: prevents infinite loop
);`;
  log = signal('');
  simulate() { this.log.set('[Action Log] [Counter] Increment — logged (no dispatch)'); }
}

// ─── Ex08 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-08',
  standalone: true,
  template: `
    <h4>Ex 08 – tap-only effect</h4>
    <pre>{{ code }}</pre>
    <button (click)="simulate()">Simulate toast show</button>
    <p>{{ log() }}</p>
    <hr />
  `
})
export class Ex08 {
  code = `showSuccessToast$ = createEffect(() =>
  this.actions$.pipe(
    ofType(saveUserSuccess),
    tap(() => this.toastService.success('User saved!'))
  ), { dispatch: false }
);`;
  log = signal('');
  simulate() { this.log.set('Toast shown: "User saved!"'); }
}

// ─── Ex09 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-09',
  standalone: true,
  template: `
    <h4>Ex 09 – catchError in effect</h4>
    <pre>{{ code }}</pre>
    <button (click)="simulateError()">Simulate HTTP error</button>
    <p>{{ result() }}</p>
    <hr />
  `
})
export class Ex09 {
  code = `loadUsers$ = createEffect(() =>
  this.actions$.pipe(
    ofType(loadUsers),
    switchMap(() =>
      this.http.get<User[]>('/api/users').pipe(
        map(users => loadUsersSuccess({ users })),
        catchError(error =>
          of(loadUsersFailure({ error: error.message }))  // dispatch failure action
        )
      )
    )
  )
);
// NOTE: catchError INSIDE switchMap keeps the effect alive`;
  result = signal('');
  simulateError() { this.result.set('Dispatched: loadUsersFailure({ error: "404 Not Found" })'); }
}

// ─── Ex10 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-10',
  standalone: true,
  template: `
    <h4>Ex 10 – success/failure action pair</h4>
    <pre>{{ code }}</pre>
    <hr />
  `
})
export class Ex10 {
  code = `// Pattern: one trigger action → two outcome actions
export const loadUsers        = createAction('[Users API] Load Users');
export const loadUsersSuccess = createAction('[Users API] Load Users Success', props<{ users: User[] }>());
export const loadUsersFailure = createAction('[Users API] Load Users Failure', props<{ error: string }>());

// Effect maps to one of the two outcomes:
switchMap(() => this.http.get<User[]>('/api/users').pipe(
  map(users => loadUsersSuccess({ users })),
  catchError(e => of(loadUsersFailure({ error: e.message })))
))`;
}

// ─── Ex11 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-11',
  standalone: true,
  template: `
    <h4>Ex 11 – HTTP GET effect</h4>
    <pre>{{ code }}</pre>
    <button (click)="simulate()">Simulate loadUsers effect</button>
    <p>{{ status() }}</p>
    <ul>
      <li *ngFor="let u of users()">{{ u }}</li>
    </ul>
    <hr />
  `,
  imports: [CommonModule]
})
export class Ex11 {
  code = `loadUsers$ = createEffect(() =>
  this.actions$.pipe(
    ofType(loadUsers),
    switchMap(() =>
      this.http.get<User[]>('/api/users').pipe(
        map(users => loadUsersSuccess({ users })),
        catchError(e => of(loadUsersFailure({ error: e.message })))
      )
    )
  )
);`;
  status = signal('idle');
  users  = signal<string[]>([]);
  simulate() {
    this.status.set('loading...');
    setTimeout(() => {
      this.users.set(['Alice', 'Bob', 'Carol']);
      this.status.set('loadUsersSuccess dispatched');
    }, 600);
  }
}

// ─── Ex12 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-12',
  standalone: true,
  template: `
    <h4>Ex 12 – HTTP POST effect</h4>
    <pre>{{ code }}</pre>
    <input [(ngModel)]="name" placeholder="user name" />
    <button (click)="simulate()">Simulate createUser effect</button>
    <p>{{ log() }}</p>
    <hr />
  `,
  imports: [FormsModule]
})
export class Ex12 {
  code = `createUser$ = createEffect(() =>
  this.actions$.pipe(
    ofType(createUser),
    concatMap(({ user }) =>
      this.http.post<User>('/api/users', user).pipe(
        map(created  => createUserSuccess({ user: created })),
        catchError(e => of(createUserFailure({ error: e.message })))
      )
    )
  )
);`;
  name = '';
  log  = signal('');
  simulate() {
    this.log.set(`Dispatched: createUserSuccess({ user: { id: 99, name: '${this.name}' } })`);
  }
}

// ─── Ex13 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-13',
  standalone: true,
  template: `
    <h4>Ex 13 – Effect with Router navigation</h4>
    <pre>{{ code }}</pre>
    <button (click)="simulate()">Simulate loginSuccess → navigate</button>
    <p>{{ log() }}</p>
    <hr />
  `
})
export class Ex13 {
  code = `@Injectable()
export class AuthEffects {
  navigateOnLogin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loginSuccess),
      tap(() => this.router.navigate(['/dashboard']))
    ), { dispatch: false }
  );
  constructor(private actions$: Actions, private router: Router) {}
}`;
  log = signal('');
  simulate() { this.log.set('router.navigate(["/dashboard"]) called'); }
}

// ─── Ex14 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-14',
  standalone: true,
  template: `
    <h4>Ex 14 – Effect error handling pattern</h4>
    <pre>{{ code }}</pre>
    <hr />
  `
})
export class Ex14 {
  code = `// WRONG ❌: catchError outside inner observable kills the effect
loadUsers$ = createEffect(() =>
  this.actions$.pipe(
    ofType(loadUsers),
    switchMap(() => this.http.get('/api/users')),
    catchError(e => of(loadUsersFailure({ error: e.message }))) // effect dies after error!
  )
);

// CORRECT ✅: catchError inside switchMap keeps effect alive
loadUsers$ = createEffect(() =>
  this.actions$.pipe(
    ofType(loadUsers),
    switchMap(() =>
      this.http.get('/api/users').pipe(
        map(users => loadUsersSuccess({ users })),
        catchError(e => of(loadUsersFailure({ error: e.message }))) // inner only
      )
    )
  )
);`;
}

// ─── Ex15 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-15',
  standalone: true,
  template: `
    <h4>Ex 15 – Effect with retry</h4>
    <pre>{{ code }}</pre>
    <button (click)="simulate()">Simulate with retry</button>
    <p>{{ log() }}</p>
    <hr />
  `
})
export class Ex15 {
  code = `loadUsers$ = createEffect(() =>
  this.actions$.pipe(
    ofType(loadUsers),
    switchMap(() =>
      this.http.get<User[]>('/api/users').pipe(
        retry(3),  // retry up to 3 times before catchError
        map(users => loadUsersSuccess({ users })),
        catchError(e => of(loadUsersFailure({ error: e.message })))
      )
    )
  )
);`;
  attempt = 0;
  log     = signal('');
  simulate() {
    this.attempt++;
    this.log.set(this.attempt <= 3 ? `Attempt ${this.attempt}/3 (retrying...)` : 'Success after retries');
    if (this.attempt > 3) this.attempt = 0;
  }
}

// ─── Ex16 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-16',
  standalone: true,
  template: `
    <h4>Ex 16 – Effect with loading action dispatch</h4>
    <pre>{{ code }}</pre>
    <button (click)="simulate()">Simulate load flow</button>
    <p>Actions: {{ actions() | json }}</p>
    <hr />
  `,
  imports: [CommonModule]
})
export class Ex16 {
  code = `// Effect can dispatch multiple actions via mergeMap + of():
loadWithSpinner$ = createEffect(() =>
  this.actions$.pipe(
    ofType(loadUsers),
    mergeMap(() =>
      concat(
        of(setLoading({ loading: true })),
        this.http.get<User[]>('/api/users').pipe(
          map(users => loadUsersSuccess({ users })),
          catchError(e => of(loadUsersFailure({ error: e.message }))),
          finalize(() => /* dispatched by outer */ undefined)
        ),
        of(setLoading({ loading: false }))
      )
    )
  )
);`;
  actions = signal<string[]>([]);
  simulate() {
    this.actions.set(['setLoading({loading:true})']);
    setTimeout(() => this.actions.update(a => [...a, 'loadUsersSuccess({users})']), 400);
    setTimeout(() => this.actions.update(a => [...a, 'setLoading({loading:false})']), 500);
  }
}

// ─── Ex17 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-17',
  standalone: true,
  template: `
    <h4>Ex 17 – Optimistic update effect</h4>
    <pre>{{ code }}</pre>
    <hr />
  `
})
export class Ex17 {
  code = `// 1. Reducer handles optimistic action immediately (remove from UI)
// 2. Effect makes HTTP call
// 3. On success: dispatch success (confirm)
// 4. On failure: dispatch rollback (restore original)
deleteUser$ = createEffect(() =>
  this.actions$.pipe(
    ofType(deleteUserOptimistic),
    mergeMap(({ id, user }) =>
      this.http.delete(\`/api/users/\${id}\`).pipe(
        map(()  => deleteUserConfirmed({ id })),
        catchError(() => of(deleteUserRollback({ user }))) // restore on error
      )
    )
  )
);`;
}

// ─── Ex18 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-18',
  standalone: true,
  template: `
    <h4>Ex 18 – Effect that dispatches multiple actions</h4>
    <pre>{{ code }}</pre>
    <button (click)="simulate()">Simulate</button>
    <p>{{ log() | json }}</p>
    <hr />
  `,
  imports: [CommonModule]
})
export class Ex18 {
  code = `// Use mergeMap + of() to dispatch multiple actions from one effect:
loginSuccess$ = createEffect(() =>
  this.actions$.pipe(
    ofType(loginSuccess),
    mergeMap(({ user }) =>
      of(
        setCurrentUser({ user }),
        loadUserPermissions({ userId: user.id }),
        showNotification({ message: \`Welcome, \${user.name}!\` })
      )
    )
  )
);`;
  log = signal<string[]>([]);
  simulate() {
    this.log.set(['setCurrentUser({user})', 'loadUserPermissions({userId:1})', 'showNotification({message:"Welcome!"})']);
  }
}

// ─── Ex19 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-19',
  standalone: true,
  template: `
    <h4>Ex 19 – Effect with debounce</h4>
    <pre>{{ code }}</pre>
    <input [(ngModel)]="query" (ngModelChange)="search($event)" placeholder="Search..." />
    <p>Queries fired: {{ fires() }} (debounced 300ms)</p>
    <hr />
  `,
  imports: [FormsModule]
})
export class Ex19 {
  code = `search$ = createEffect(() =>
  this.actions$.pipe(
    ofType(searchQueryChanged),
    debounceTime(300),            // wait 300ms after last keystroke
    distinctUntilChanged(),       // skip if query didn't change
    switchMap(({ query }) =>
      this.http.get(\`/api/search?q=\${query}\`).pipe(
        map(results => searchSuccess({ results })),
        catchError(e => of(searchFailure({ error: e.message })))
      )
    )
  )
);`;
  query   = '';
  fires   = signal(0);
  private timer: any;
  search(q: string) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => { if (q) this.fires.update(f => f + 1); }, 300);
  }
}

// ─── Ex20 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-20',
  standalone: true,
  template: `
    <h4>Ex 20 – Effect with throttle</h4>
    <pre>{{ code }}</pre>
    <button (click)="click()">Rapid click (throttled)</button>
    <p>Actions processed: {{ count() }}</p>
    <hr />
  `
})
export class Ex20 {
  code = `buttonClick$ = createEffect(() =>
  this.actions$.pipe(
    ofType(buttonClicked),
    throttleTime(1000),         // max one action per second
    switchMap(() => this.http.post('/api/action', {}).pipe(
      map(() => actionSuccess()),
      catchError(e => of(actionFailure({ error: e.message })))
    ))
  )
);`;
  count     = signal(0);
  private last = 0;
  click() {
    const now = Date.now();
    if (now - this.last > 1000) { this.count.update(c => c + 1); this.last = now; }
  }
}

// ─── Ex21 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-21',
  standalone: true,
  template: `
    <h4>Ex 21 – Effect with fromEvent</h4>
    <pre>{{ code }}</pre>
    <p>Online: {{ online() }}</p>
    <hr />
  `
})
export class Ex21 {
  code = `// Non-actions$ effect: use fromEvent for DOM events
networkStatus$ = createEffect(() =>
  merge(
    fromEvent(window, 'online').pipe(map(() => setOnline({ online: true }))),
    fromEvent(window, 'offline').pipe(map(() => setOnline({ online: false })))
  )
);
// This effect doesn't start from actions$ — still valid createEffect usage`;
  online = signal(navigator.onLine);
  constructor() {
    window.addEventListener('online',  () => this.online.set(true));
    window.addEventListener('offline', () => this.online.set(false));
  }
}

// ─── Ex22 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-22',
  standalone: true,
  template: `
    <h4>Ex 22 – Effect cleanup with takeUntil</h4>
    <pre>{{ code }}</pre>
    <hr />
  `
})
export class Ex22 {
  code = `// Polling effect that stops when a stop action is dispatched:
poll$ = createEffect(() =>
  this.actions$.pipe(
    ofType(startPolling),
    switchMap(() =>
      interval(5000).pipe(
        takeUntil(this.actions$.pipe(ofType(stopPolling))), // cleanup on stop action
        switchMap(() =>
          this.http.get('/api/status').pipe(
            map(data => pollSuccess({ data })),
            catchError(() => EMPTY)
          )
        )
      )
    )
  )
);`;
}

// ─── Ex23 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-23',
  standalone: true,
  template: `
    <h4>Ex 23 – Effect with inject(HttpClient)</h4>
    <pre>{{ code }}</pre>
    <hr />
  `
})
export class Ex23 {
  code = `// Modern NgRx: functional effects with inject() — no class needed
export const loadUsersEffect = createEffect(
  (actions$ = inject(Actions), http = inject(HttpClient)) =>
    actions$.pipe(
      ofType(loadUsers),
      switchMap(() =>
        http.get<User[]>('/api/users').pipe(
          map(users => loadUsersSuccess({ users })),
          catchError(e => of(loadUsersFailure({ error: e.message })))
        )
      )
    ),
  { functional: true }
);`;
}

// ─── Ex24 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-24',
  standalone: true,
  template: `
    <h4>Ex 24 – Effect with inject(Router)</h4>
    <pre>{{ code }}</pre>
    <button (click)="simulate()">Simulate logout → navigate</button>
    <p>{{ log() }}</p>
    <hr />
  `
})
export class Ex24 {
  code = `// Functional effect with inject(Router):
export const logoutEffect = createEffect(
  (actions$ = inject(Actions), router = inject(Router)) =>
    actions$.pipe(
      ofType(logout),
      tap(() => router.navigate(['/login'])),
    ),
  { functional: true, dispatch: false }
);`;
  log = signal('');
  simulate() { this.log.set('router.navigate(["/login"]) — user logged out'); }
}

// ─── Ex25 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-25',
  standalone: true,
  template: `
    <h4>Ex 25 – Effect with delay (timer)</h4>
    <pre>{{ code }}</pre>
    <button (click)="simulate()">Show notification (auto-dismiss after 3s)</button>
    <p *ngIf="visible()">Notification visible!</p>
    <hr />
  `,
  imports: [CommonModule]
})
export class Ex25 {
  code = `autoDismiss$ = createEffect(() =>
  this.actions$.pipe(
    ofType(showNotification),
    mergeMap(({ id }) =>
      timer(3000).pipe(           // wait 3 seconds
        map(() => dismissNotification({ id }))
      )
    )
  )
);`;
  visible = signal(false);
  simulate() {
    this.visible.set(true);
    setTimeout(() => this.visible.set(false), 3000);
  }
}

// ─── Ex26 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-26',
  standalone: true,
  template: `
    <h4>Ex 26 – Effect for localStorage persistence</h4>
    <pre>{{ code }}</pre>
    <input [(ngModel)]="theme" placeholder="theme" />
    <button (click)="save()">Save theme</button>
    <button (click)="load()">Load from storage</button>
    <p>Loaded: {{ loaded() }}</p>
    <hr />
  `,
  imports: [FormsModule]
})
export class Ex26 {
  code = `persistTheme$ = createEffect(() =>
  this.actions$.pipe(
    ofType(setTheme),
    tap(({ theme }) => localStorage.setItem('theme', theme))
  ), { dispatch: false }
);
hydrateTheme$ = createEffect(() =>
  of(localStorage.getItem('theme')).pipe(
    filter(Boolean),
    map(theme => setTheme({ theme }))
  )
);`;
  theme  = 'dark';
  loaded = signal('');
  save() { localStorage.setItem('ngrx-ex26-theme', this.theme); }
  load() { this.loaded.set(localStorage.getItem('ngrx-ex26-theme') ?? '(not set)'); }
}

// ─── Ex27 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-27',
  standalone: true,
  template: `
    <h4>Ex 27 – Chained effects (success of one triggers another)</h4>
    <pre>{{ code }}</pre>
    <button (click)="simulate()">Start chain</button>
    <p>{{ chain() | json }}</p>
    <hr />
  `,
  imports: [CommonModule]
})
export class Ex27 {
  code = `// Effect A: loadUser$ dispatches loadUserSuccess
// Effect B: listens to loadUserSuccess and dispatches loadUserPosts
loadUserPosts$ = createEffect(() =>
  this.actions$.pipe(
    ofType(loadUserSuccess),          // triggered by Effect A's output
    switchMap(({ user }) =>
      this.http.get(\`/api/users/\${user.id}/posts\`).pipe(
        map(posts => loadUserPostsSuccess({ posts })),
        catchError(e => of(loadUserPostsFailure({ error: e.message })))
      )
    )
  )
);`;
  chain = signal<string[]>([]);
  simulate() {
    this.chain.set(['loadUser dispatched']);
    setTimeout(() => this.chain.update(c => [...c, 'loadUserSuccess → triggers loadUserPosts effect']), 400);
    setTimeout(() => this.chain.update(c => [...c, 'loadUserPostsSuccess dispatched']), 800);
  }
}

// ─── Ex28 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-28',
  standalone: true,
  template: `
    <h4>Ex 28 – Effect pipeline with multiple operators</h4>
    <pre>{{ code }}</pre>
    <hr />
  `
})
export class Ex28 {
  code = `search$ = createEffect(() =>
  this.actions$.pipe(
    ofType(searchChanged),
    map(a => a.query.trim()),           // 1. transform
    filter(q => q.length >= 2),         // 2. filter short queries
    debounceTime(300),                   // 3. debounce
    distinctUntilChanged(),             // 4. skip if same
    switchMap(query =>                  // 5. cancel previous, start new
      this.http.get(\`/api/search?q=\${query}\`).pipe(
        map(r  => searchSuccess({ results: r })),
        catchError(e => of(searchFailure({ error: e.message })))
      )
    )
  )
);`;
}

// ─── Ex29 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-29',
  standalone: true,
  template: `
    <h4>Ex 29 – Effect with inner observable switchMap</h4>
    <pre>{{ code }}</pre>
    <hr />
  `
})
export class Ex29 {
  code = `// switchMap creates an inner observable per outer emission
// Unsubscribes from previous inner observable when new action arrives
loadUserDetail$ = createEffect(() =>
  this.actions$.pipe(
    ofType(selectUser),
    switchMap(({ userId }) =>
      // Each new selectUser action cancels the previous HTTP request
      combineLatest([
        this.http.get<User>(\`/api/users/\${userId}\`),
        this.http.get<Post[]>(\`/api/users/\${userId}/posts\`)
      ]).pipe(
        map(([user, posts]) => loadUserDetailSuccess({ user, posts })),
        catchError(e => of(loadUserDetailFailure({ error: e.message })))
      )
    )
  )
);`;
}

// ─── Ex30 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-30',
  standalone: true,
  template: `
    <h4>Ex 30 – Effect with forkJoin</h4>
    <pre>{{ code }}</pre>
    <button (click)="simulate()">Simulate parallel loads</button>
    <p>{{ status() }}</p>
    <hr />
  `
})
export class Ex30 {
  code = `loadDashboard$ = createEffect(() =>
  this.actions$.pipe(
    ofType(loadDashboard),
    switchMap(() =>
      forkJoin({                        // run all in parallel, emit when ALL complete
        users:  this.http.get<User[]>('/api/users'),
        posts:  this.http.get<Post[]>('/api/posts'),
        stats:  this.http.get<Stats>('/api/stats'),
      }).pipe(
        map(data => loadDashboardSuccess(data)),
        catchError(e => of(loadDashboardFailure({ error: e.message })))
      )
    )
  )
);`;
  status = signal('idle');
  simulate() {
    this.status.set('forkJoin: loading users, posts, stats in parallel...');
    setTimeout(() => this.status.set('loadDashboardSuccess dispatched — all 3 loaded'), 700);
  }
}

// ─── Ex31 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-31',
  standalone: true,
  template: `
    <h4>Ex 31 – Effect dispatching to multiple reducers</h4>
    <pre>{{ code }}</pre>
    <hr />
  `
})
export class Ex31 {
  code = `// A single action can be handled by multiple reducers:
// users reducer:
on(loadUsersSuccess, (state, { users }) => ({ ...state, users })),
// loading reducer:
on(loadUsersSuccess, state => ({ ...state, usersLoaded: true })),
// notifications reducer:
on(loadUsersSuccess, state => ({ ...state, lastSync: Date.now() })),
// All three reducers respond to the same loadUsersSuccess action`;
}

// ─── Ex32 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-32',
  standalone: true,
  template: `
    <h4>Ex 32 – Effect with conditional dispatch</h4>
    <pre>{{ code }}</pre>
    <button (click)="simulate(true)">Simulate (cache HIT)</button>
    <button (click)="simulate(false)">Simulate (cache MISS)</button>
    <p>{{ log() }}</p>
    <hr />
  `
})
export class Ex32 {
  code = `loadUserIfNeeded$ = createEffect(() =>
  this.actions$.pipe(
    ofType(loadUserIfNeeded),
    concatLatestFrom(() => this.store.select(selectUserLoaded)),
    filter(([, loaded]) => !loaded),     // skip if already in store
    map(([action]) => loadUser({ id: action.id }))
  )
);`;
  log = signal('');
  simulate(hit: boolean) {
    this.log.set(hit ? 'Cache HIT — effect skipped (already in store)' : 'Cache MISS — loadUser dispatched');
  }
}

// ─── Ex33 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-33',
  standalone: true,
  template: `
    <h4>Ex 33 – Effect reading from store (concatLatestFrom)</h4>
    <pre>{{ code }}</pre>
    <hr />
  `
})
export class Ex33 {
  code = `import { concatLatestFrom } from '@ngrx/effects';
// concatLatestFrom: like withLatestFrom but doesn't subscribe until action arrives
savePost$ = createEffect(() =>
  this.actions$.pipe(
    ofType(savePost),
    concatLatestFrom(() => this.store.select(selectCurrentUser)), // read store
    switchMap(([action, currentUser]) =>
      this.http.post('/api/posts', { ...action.post, authorId: currentUser.id }).pipe(
        map(post  => savePostSuccess({ post })),
        catchError(e => of(savePostFailure({ error: e.message })))
      )
    )
  )
);`;
}

// ─── Ex34 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-34',
  standalone: true,
  template: `
    <h4>Ex 34 – Effect with withLatestFrom selector</h4>
    <pre>{{ code }}</pre>
    <hr />
  `
})
export class Ex34 {
  code = `// withLatestFrom: combine action with latest store value
export$ = createEffect(() =>
  this.actions$.pipe(
    ofType(exportData),
    withLatestFrom(
      this.store.select(selectAllUsers),
      this.store.select(selectDateRange)
    ),
    map(([, users, dateRange]) =>
      exportDataReady({ users, dateRange })
    )
  )
);
// Note: concatLatestFrom from @ngrx/effects is preferred (avoids subscription timing issues)`;
}

// ─── Ex35 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-35',
  standalone: true,
  template: `
    <h4>Ex 35 – Error effect with notification</h4>
    <pre>{{ code }}</pre>
    <button (click)="simulate()">Simulate error</button>
    <p *ngIf="notification()">{{ notification() }}</p>
    <hr />
  `,
  imports: [CommonModule]
})
export class Ex35 {
  code = `showError$ = createEffect(() =>
  this.actions$.pipe(
    ofType(loadUsersFailure, createUserFailure, deleteUserFailure),
    tap(({ error }) => this.snackBar.open(error, 'Close', { duration: 5000 }))
  ), { dispatch: false }
);`;
  notification = signal('');
  simulate() {
    this.notification.set('Error: Failed to load users');
    setTimeout(() => this.notification.set(''), 5000);
  }
}

// ─── Ex36 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-36',
  standalone: true,
  template: `
    <h4>Ex 36 – Effect for page title update</h4>
    <pre>{{ code }}</pre>
    <button (click)="simulate('Dashboard')">Simulate navigate to Dashboard</button>
    <button (click)="simulate('Profile')">Simulate navigate to Profile</button>
    <p>Title would be: {{ title() }}</p>
    <hr />
  `
})
export class Ex36 {
  code = `@Injectable()
export class TitleEffects {
  updateTitle$ = createEffect(() =>
    this.actions$.pipe(
      ofType(routerNavigatedAction),
      map(action => action.payload.routerState.data?.['title'] ?? 'App'),
      tap(title => this.titleService.setTitle(title))
    ), { dispatch: false }
  );
}`;
  title = signal('App');
  simulate(page: string) { this.title.set(page); }
}

// ─── Ex37 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-37',
  standalone: true,
  template: `
    <h4>Ex 37 – Effect for analytics tracking</h4>
    <pre>{{ code }}</pre>
    <button (click)="track('Button Clicked')">Track event</button>
    <p>Tracked: {{ events() | json }}</p>
    <hr />
  `,
  imports: [CommonModule]
})
export class Ex37 {
  code = `analytics$ = createEffect(() =>
  this.actions$.pipe(
    ofType(trackEvent),
    tap(({ eventName, properties }) =>
      this.analyticsService.track(eventName, properties)
    )
  ), { dispatch: false }
);
// Dispatch from anywhere:
// store.dispatch(trackEvent({ eventName: 'Button Clicked', properties: { id: 1 } }))`;
  events = signal<string[]>([]);
  track(name: string) { this.events.update(e => [...e, name]); }
}

// ─── Ex38 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-38',
  standalone: true,
  template: `
    <h4>Ex 38 – Full CRUD effects</h4>
    <pre>{{ code }}</pre>
    <button (click)="sim('load')">Load All</button>
    <button (click)="sim('create')">Create</button>
    <button (click)="sim('update')">Update</button>
    <button (click)="sim('delete')">Delete</button>
    <p>{{ log() }}</p>
    <hr />
  `
})
export class Ex38 {
  code = `@Injectable()
export class UsersEffects {
  loadAll$ = createEffect(() => this.actions$.pipe(
    ofType(loadUsers), switchMap(() => this.http.get<User[]>('/api/users').pipe(
      map(users => loadUsersSuccess({ users })), catchError(e => of(loadUsersFailure({ error: e.message })))))));
  create$  = createEffect(() => this.actions$.pipe(
    ofType(createUser), concatMap(({ user }) => this.http.post<User>('/api/users', user).pipe(
      map(u => createUserSuccess({ user: u })), catchError(e => of(createUserFailure({ error: e.message })))))));
  update$  = createEffect(() => this.actions$.pipe(
    ofType(updateUser), concatMap(({ user }) => this.http.put<User>(\`/api/users/\${user.id}\`, user).pipe(
      map(u => updateUserSuccess({ user: u })), catchError(e => of(updateUserFailure({ error: e.message })))))));
  delete$  = createEffect(() => this.actions$.pipe(
    ofType(deleteUser), mergeMap(({ id }) => this.http.delete(\`/api/users/\${id}\`).pipe(
      map(() => deleteUserSuccess({ id })), catchError(e => of(deleteUserFailure({ error: e.message })))))));
}`;
  log = signal('');
  sim(op: string) {
    const map: Record<string, string> = {
      load: 'loadUsersSuccess dispatched', create: 'createUserSuccess dispatched',
      update: 'updateUserSuccess dispatched', delete: 'deleteUserSuccess dispatched'
    };
    this.log.set(map[op]);
  }
}

// ─── Ex39 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-39',
  standalone: true,
  template: `
    <h4>Ex 39 – Effect testing pattern (marbles)</h4>
    <pre>{{ code }}</pre>
    <hr />
  `
})
export class Ex39 {
  code = `// Testing effects with jasmine-marbles:
it('should dispatch loadUsersSuccess', () => {
  const users = [{ id: 1, name: 'Alice' }];
  const action   = loadUsers();
  const outcome  = loadUsersSuccess({ users });
  actions$ = hot('-a', { a: action });
  const response = cold('-b|', { b: users });
  httpSpy.get.and.returnValue(response);
  const expected = cold('--c', { c: outcome });
  expect(effects.loadUsers$).toBeObservable(expected);
});`;
}

// ─── Ex40 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-40',
  standalone: true,
  template: `
    <h4>Ex 40 – Non-dispatching effect for DOM</h4>
    <pre>{{ code }}</pre>
    <button (click)="simulate()">Simulate scroll to top</button>
    <p>{{ log() }}</p>
    <hr />
  `
})
export class Ex40 {
  code = `scrollToTop$ = createEffect(() =>
  this.actions$.pipe(
    ofType(routerNavigatedAction),
    tap(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  ), { dispatch: false }
);
// dispatch: false — never dispatches; just scrolls DOM on navigation`;
  log = signal('');
  simulate() { this.log.set('window.scrollTo({top:0}) called'); }
}

// ─── Ex41 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-41',
  standalone: true,
  template: `
    <h4>Ex 41 – Effect with Web Worker</h4>
    <pre>{{ code }}</pre>
    <hr />
  `
})
export class Ex41 {
  code = `processData$ = createEffect(() =>
  this.actions$.pipe(
    ofType(processHeavyData),
    mergeMap(({ data }) =>
      new Observable(observer => {
        const worker = new Worker(new URL('./data.worker', import.meta.url));
        worker.postMessage(data);
        worker.onmessage = ({ data: result }) => {
          observer.next(processDataSuccess({ result }));
          observer.complete();
          worker.terminate();
        };
        worker.onerror = err => {
          observer.error(err);
          worker.terminate();
        };
        return () => worker.terminate();
      }).pipe(
        catchError(e => of(processDataFailure({ error: e.message })))
      )
    )
  )
);`;
}

// ─── Ex42 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-42',
  standalone: true,
  template: `
    <h4>Ex 42 – Effect for WebSocket</h4>
    <pre>{{ code }}</pre>
    <p>Messages: {{ messages() | json }}</p>
    <hr />
  `,
  imports: [CommonModule]
})
export class Ex42 {
  code = `wsConnect$ = createEffect(() =>
  this.actions$.pipe(
    ofType(connectWebSocket),
    switchMap(() => {
      const ws$ = new Observable<MessageEvent>(obs => {
        const socket = new WebSocket('wss://api.example.com/ws');
        socket.onmessage = e => obs.next(e);
        socket.onerror   = e => obs.error(e);
        socket.onclose   = ()  => obs.complete();
        return () => socket.close();
      });
      return ws$.pipe(
        map(event => wsMessageReceived({ data: JSON.parse(event.data) })),
        takeUntil(this.actions$.pipe(ofType(disconnectWebSocket))),
        catchError(e => of(wsError({ error: e.message })))
      );
    })
  )
);`;
  messages = signal(['(simulated) ping', '(simulated) data: {count:42}']);
}

// ─── Ex43 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-43',
  standalone: true,
  template: `
    <h4>Ex 43 – Effect with SSE (Server-Sent Events)</h4>
    <pre>{{ code }}</pre>
    <hr />
  `
})
export class Ex43 {
  code = `listenSSE$ = createEffect(() =>
  this.actions$.pipe(
    ofType(startSSE),
    switchMap(() =>
      new Observable<string>(observer => {
        const eventSource = new EventSource('/api/events');
        eventSource.onmessage = e => observer.next(e.data);
        eventSource.onerror   = ()  => observer.error('SSE error');
        return () => eventSource.close();
      }).pipe(
        map(data => sseMessageReceived({ data: JSON.parse(data) })),
        takeUntil(this.actions$.pipe(ofType(stopSSE))),
        catchError(e => of(sseError({ error: e.toString() })))
      )
    )
  )
);`;
}

// ─── Ex44 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-44',
  standalone: true,
  template: `
    <h4>Ex 44 – Effect for auth token refresh</h4>
    <pre>{{ code }}</pre>
    <hr />
  `
})
export class Ex44 {
  code = `// Intercept 401 errors, refresh token, retry original request
httpError$ = createEffect(() =>
  this.actions$.pipe(
    ofType(httpError),
    filter(({ status }) => status === 401),
    exhaustMap(() =>
      this.authService.refreshToken().pipe(
        map(token  => tokenRefreshed({ token })),
        catchError(() => of(logout()))          // refresh also failed — logout
      )
    )
  )
);
// After tokenRefreshed, a separate effect retries the original failed request`;
}

// ─── Ex45 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-45',
  standalone: true,
  template: `
    <h4>Ex 45 – Effect coordination pattern</h4>
    <pre>{{ code }}</pre>
    <hr />
  `
})
export class Ex45 {
  code = `// Coordinate two parallel loads and proceed only when BOTH complete:
loadBothResources$ = createEffect(() =>
  this.actions$.pipe(
    ofType(initApp),
    switchMap(() =>
      combineLatest([
        this.actions$.pipe(ofType(loadUsersSuccess), take(1)),
        this.actions$.pipe(ofType(loadPostsSuccess),  take(1)),
      ]).pipe(
        map(() => appReady()),
        take(1)
      )
    )
  )
);`;
}

// ─── Ex46 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-46',
  standalone: true,
  template: `
    <h4>Ex 46 – Effect with circuit breaker</h4>
    <pre>{{ code }}</pre>
    <p>Failures: {{ failures() }} | Circuit: {{ circuit() }}</p>
    <button (click)="fail()">Simulate failure</button>
    <button (click)="reset()">Reset circuit</button>
    <hr />
  `
})
export class Ex46 {
  code = `// Circuit breaker: stop trying after N consecutive failures
let consecutiveFailures = 0;
const MAX_FAILURES = 3;

load$ = createEffect(() =>
  this.actions$.pipe(
    ofType(loadData),
    filter(() => consecutiveFailures < MAX_FAILURES),   // circuit check
    switchMap(() =>
      this.http.get('/api/data').pipe(
        tap(() => consecutiveFailures = 0),              // success: reset
        map(data => loadDataSuccess({ data })),
        catchError(e => {
          consecutiveFailures++;
          return of(loadDataFailure({ error: e.message }));
        })
      )
    )
  )
);`;
  failures = signal(0);
  circuit  = computed(() => this.failures() >= 3 ? 'OPEN (blocking)' : 'CLOSED (passing)');
  fail()   { this.failures.update(f => Math.min(f + 1, 5)); }
  reset()  { this.failures.set(0); }
}

// ─── Ex47 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-47',
  standalone: true,
  template: `
    <h4>Ex 47 – Effect with exponential retry</h4>
    <pre>{{ code }}</pre>
    <button (click)="simulate()">Simulate retries</button>
    <p>{{ log() | json }}</p>
    <hr />
  `,
  imports: [CommonModule]
})
export class Ex47 {
  code = `// Exponential backoff: 1s, 2s, 4s, 8s...
load$ = createEffect(() =>
  this.actions$.pipe(
    ofType(loadData),
    switchMap(() =>
      this.http.get('/api/data').pipe(
        retryWhen(errors =>
          errors.pipe(
            scan((retryCount, err) => {
              if (retryCount >= 4) throw err;
              return retryCount + 1;
            }, 0),
            delayWhen(retryCount => timer(Math.pow(2, retryCount) * 1000))
          )
        ),
        map(data => loadDataSuccess({ data })),
        catchError(e => of(loadDataFailure({ error: e.message })))
      )
    )
  )
);`;
  log = signal<string[]>([]);
  simulate() {
    this.log.set(['Attempt 1 (0ms delay)', 'Attempt 2 (1000ms delay)', 'Attempt 3 (2000ms delay)', 'Attempt 4 (4000ms delay)']);
  }
}

// ─── Ex48 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-48',
  standalone: true,
  template: `
    <h4>Ex 48 – createEffect functional style</h4>
    <pre>{{ code }}</pre>
    <hr />
  `
})
export class Ex48 {
  code = `// NgRx 16+: functional effects (no class, no @Injectable decorator)
// Register in providers array or provideEffects()

export const loadUsersEffect = createEffect(
  (
    actions$ = inject(Actions),
    http     = inject(HttpClient),
    store    = inject(Store),
  ) =>
    actions$.pipe(
      ofType(loadUsers),
      concatLatestFrom(() => store.select(selectUsersLoaded)),
      filter(([, loaded]) => !loaded),
      switchMap(() =>
        http.get<User[]>('/api/users').pipe(
          map(users => loadUsersSuccess({ users })),
          catchError(e => of(loadUsersFailure({ error: e.message })))
        )
      )
    ),
  { functional: true }
);`;
}

// ─── Ex49 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-49',
  standalone: true,
  template: `
    <h4>Ex 49 – Non-dispatching effect for DOM</h4>
    <pre>{{ code }}</pre>
    <button (click)="simulate()">Simulate form reset</button>
    <p>{{ log() }}</p>
    <hr />
  `
})
export class Ex49 {
  code = `// Full optimistic CRUD with effects:
// 1. Component dispatches optimistic action
// 2. Reducer immediately updates UI state
// 3. Effect makes HTTP call
// 4. On success: dispatch confirmAction (optional cleanup)
// 5. On failure: dispatch rollbackAction (restore previous state)
deleteOptimistic$ = createEffect(() =>
  this.actions$.pipe(
    ofType(deleteUserOptimistic),
    mergeMap(({ id, snapshot }) =>    // snapshot = previous entity state
      this.http.delete(\`/api/users/\${id}\`).pipe(
        map(() => deleteUserConfirmed({ id })),
        catchError(() => of(deleteUserRollback({ user: snapshot })))
      )
    )
  )
);`;
  log = signal('');
  simulate() { this.log.set('Optimistic delete → HTTP call → rollback on error'); }
}

// ─── Ex50 ─────────────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-50',
  standalone: true,
  template: `
    <h4>Ex 50 – Full optimistic CRUD with effects</h4>
    <pre>{{ code }}</pre>
    <p>Items: {{ items() | json }}</p>
    <button (click)="optimisticAdd()">Optimistic Add</button>
    <button (click)="simulateRollback()">Simulate Rollback</button>
    <hr />
  `,
  imports: [CommonModule]
})
export class Ex50 {
  code = `// Full pattern:
// actions: addOptimistic, addConfirmed, addRollback
// reducer: on(addOptimistic, add to state with tempId)
//          on(addConfirmed, replace tempId with real id)
//          on(addRollback, remove from state)
// effect:
add$ = createEffect(() =>
  this.actions$.pipe(
    ofType(addItemOptimistic),
    mergeMap(({ item, tempId }) =>
      this.http.post<Item>('/api/items', item).pipe(
        map(saved => addItemConfirmed({ tempId, item: saved })),
        catchError(() => of(addItemRollback({ tempId })))
      )
    )
  )
);`;
  private next = 1;
  items = signal<{ id: string; name: string; pending?: boolean }[]>([]);
  optimisticAdd() {
    const tempId = `temp-${this.next++}`;
    this.items.update(i => [...i, { id: tempId, name: `Item ${this.next}`, pending: true }]);
    setTimeout(() => {
      this.items.update(i => i.map(x => x.id === tempId ? { ...x, id: String(this.next), pending: false } : x));
    }, 500);
  }
  simulateRollback() {
    const tempId = `temp-rollback`;
    this.items.update(i => [...i, { id: tempId, name: 'Will rollback', pending: true }]);
    setTimeout(() => this.items.update(i => i.filter(x => x.id !== tempId)), 500);
  }
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
  ],
  template: `
    <h2>NgRx Effects – 50 Examples</h2>
    <ex-01 /><hr /><ex-02 /><hr /><ex-03 /><hr /><ex-04 /><hr /><ex-05 />
    <hr /><ex-06 /><hr /><ex-07 /><hr /><ex-08 /><hr /><ex-09 /><hr /><ex-10 />
    <hr /><ex-11 /><hr /><ex-12 /><hr /><ex-13 /><hr /><ex-14 /><hr /><ex-15 />
    <hr /><ex-16 /><hr /><ex-17 /><hr /><ex-18 /><hr /><ex-19 /><hr /><ex-20 />
    <hr /><ex-21 /><hr /><ex-22 /><hr /><ex-23 /><hr /><ex-24 /><hr /><ex-25 />
    <hr /><ex-26 /><hr /><ex-27 /><hr /><ex-28 /><hr /><ex-29 /><hr /><ex-30 />
    <hr /><ex-31 /><hr /><ex-32 /><hr /><ex-33 /><hr /><ex-34 /><hr /><ex-35 />
    <hr /><ex-36 /><hr /><ex-37 /><hr /><ex-38 /><hr /><ex-39 /><hr /><ex-40 />
    <hr /><ex-41 /><hr /><ex-42 /><hr /><ex-43 /><hr /><ex-44 /><hr /><ex-45 />
    <hr /><ex-46 /><hr /><ex-47 /><hr /><ex-48 /><hr /><ex-49 /><hr /><ex-50 />
  `
})
export class AppComponent {}
