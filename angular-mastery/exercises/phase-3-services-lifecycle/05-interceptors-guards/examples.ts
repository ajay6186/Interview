import {
  Component,
  inject,
  signal,
  computed,
} from '@angular/core';
import {
  HttpClient,
  HttpRequest,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpResponse,
  HttpErrorResponse,
  withInterceptors,
  provideHttpClient,
} from '@angular/common/http';
import {
  CanActivateFn,
  CanDeactivateFn,
  CanMatchFn,
  CanActivateChildFn,
  ResolveFn,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
  Routes,
} from '@angular/router';
import {
  Observable,
  of,
  throwError,
  timer,
  forkJoin,
  EMPTY,
} from 'rxjs';
import {
  tap,
  catchError,
  retry,
  timeout,
  delay,
  map,
  switchMap,
  shareReplay,
  finalize,
} from 'rxjs/operators';
import { Injectable } from '@angular/core';

// ============================================================
// Examples 3.5 — HTTP Interceptors & Route Guards (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ───────────────────────────────────────────

// 1. Simple logging interceptor (tap request URL)
const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('[LOG] Request:', req.url);
  return next(req);
};

@Component({
  selector: 'ex-01',
  standalone: true,
  template: `
    <div style="background:#e3f2fd;padding:8px;border-radius:4px;font-size:13px">
      <strong>loggingInterceptor</strong>
      <pre style="margin:4px 0;font-size:11px">const loggingInterceptor: HttpInterceptorFn = (req, next) => {{ '{' }}
  console.log('[LOG] Request:', req.url);
  return next(req);
{{ '}' }};</pre>
    </div>
  `,
})
class Ex01 {}

// 2. Auth token interceptor (clone + add header)
const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const token = 'my-jwt-token';
  const authReq = req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) });
  return next(authReq);
};

@Component({
  selector: 'ex-02',
  standalone: true,
  template: `
    <div style="background:#e8f5e9;padding:8px;border-radius:4px;font-size:13px">
      <strong>authTokenInterceptor</strong>
      <pre style="margin:4px 0;font-size:11px">req.clone({{ '{' }} headers: req.headers.set('Authorization', 'Bearer ' + token) {{ '}' }})</pre>
    </div>
  `,
})
class Ex02 {}

// 3. Error interceptor (catchError display)
const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      console.error('[ERROR]', err.status, err.message);
      return throwError(() => err);
    })
  );
};

@Component({
  selector: 'ex-03',
  standalone: true,
  template: `
    <div style="background:#ffebee;padding:8px;border-radius:4px;font-size:13px">
      <strong>errorInterceptor</strong>
      <pre style="margin:4px 0;font-size:11px">catchError((err: HttpErrorResponse) => {{ '{' }}
  console.error('[ERROR]', err.status);
  return throwError(() => err);
{{ '}' }})</pre>
    </div>
  `,
})
class Ex03 {}

// 4. Request clone pattern (req.clone({...}))
const clonePatternInterceptor: HttpInterceptorFn = (req, next) => {
  const cloned = req.clone({
    headers: req.headers.set('X-Custom', 'value'),
    url: req.url,
  });
  return next(cloned);
};

@Component({
  selector: 'ex-04',
  standalone: true,
  template: `
    <div style="background:#fff9c4;padding:8px;border-radius:4px;font-size:13px">
      <strong>clonePatternInterceptor</strong>
      <pre style="margin:4px 0;font-size:11px">const cloned = req.clone({{ '{' }}
  headers: req.headers.set('X-Custom', 'value')
{{ '}' }});</pre>
    </div>
  `,
})
class Ex04 {}

// 5. Response tap interceptor (log status)
const responseTapInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse) {
        console.log('[RESPONSE]', event.status);
      }
    })
  );
};

@Component({
  selector: 'ex-05',
  standalone: true,
  template: `
    <div style="background:#f3e5f5;padding:8px;border-radius:4px;font-size:13px">
      <strong>responseTapInterceptor</strong>
      <pre style="margin:4px 0;font-size:11px">tap(event => {{ '{' }}
  if (event instanceof HttpResponse) console.log(event.status);
{{ '}' }})</pre>
    </div>
  `,
})
class Ex05 {}

// 6. Interceptor chain (next.handle(req))
const chainDemoInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('[CHAIN] Before next');
  return next(req).pipe(tap(() => console.log('[CHAIN] After next')));
};

@Component({
  selector: 'ex-06',
  standalone: true,
  template: `
    <div style="background:#e0f2f1;padding:8px;border-radius:4px;font-size:13px">
      <strong>chainDemoInterceptor</strong>
      <pre style="margin:4px 0;font-size:11px">console.log('Before next');
return next(req).pipe(tap(() => console.log('After next')));</pre>
    </div>
  `,
})
class Ex06 {}

// 7. CanActivateFn always returns true
const alwaysAllowGuard: CanActivateFn = () => true;

@Component({
  selector: 'ex-07',
  standalone: true,
  template: `
    <div style="background:#e8f5e9;padding:8px;border-radius:4px;font-size:13px">
      <strong>alwaysAllowGuard: CanActivateFn</strong>
      <pre style="margin:4px 0;font-size:11px">const alwaysAllowGuard: CanActivateFn = () => true;</pre>
      <span style="color:green">✔ Route always accessible</span>
    </div>
  `,
})
class Ex07 {}

// 8. CanActivateFn returns false (blocks)
const alwaysBlockGuard: CanActivateFn = () => false;

@Component({
  selector: 'ex-08',
  standalone: true,
  template: `
    <div style="background:#ffebee;padding:8px;border-radius:4px;font-size:13px">
      <strong>alwaysBlockGuard: CanActivateFn</strong>
      <pre style="margin:4px 0;font-size:11px">const alwaysBlockGuard: CanActivateFn = () => false;</pre>
      <span style="color:red">✖ Route always blocked</span>
    </div>
  `,
})
class Ex08 {}

// 9. CanActivateFn redirects to /login (UrlTree)
const redirectToLoginGuard: CanActivateFn = (): UrlTree => {
  const router = inject(Router);
  return router.createUrlTree(['/login']);
};

@Component({
  selector: 'ex-09',
  standalone: true,
  template: `
    <div style="background:#fff3e0;padding:8px;border-radius:4px;font-size:13px">
      <strong>redirectToLoginGuard: CanActivateFn</strong>
      <pre style="margin:4px 0;font-size:11px">const router = inject(Router);
return router.createUrlTree(['/login']);</pre>
    </div>
  `,
})
class Ex09 {}

// 10. CanDeactivateFn always true
interface CanDeactivateComponent { canDeactivate?: () => boolean; }
const alwaysDeactivateGuard: CanDeactivateFn<CanDeactivateComponent> = () => true;

@Component({
  selector: 'ex-10',
  standalone: true,
  template: `
    <div style="background:#e3f2fd;padding:8px;border-radius:4px;font-size:13px">
      <strong>alwaysDeactivateGuard: CanDeactivateFn</strong>
      <pre style="margin:4px 0;font-size:11px">const alwaysDeactivateGuard: CanDeactivateFn&lt;T&gt; = () => true;</pre>
    </div>
  `,
})
class Ex10 {}

// 11. CanDeactivateFn with window.confirm
const confirmLeaveGuard: CanDeactivateFn<CanDeactivateComponent> = () => {
  return window.confirm('Leave page? Unsaved changes will be lost.');
};

@Component({
  selector: 'ex-11',
  standalone: true,
  template: `
    <div style="background:#fce4ec;padding:8px;border-radius:4px;font-size:13px">
      <strong>confirmLeaveGuard: CanDeactivateFn</strong>
      <pre style="margin:4px 0;font-size:11px">return window.confirm('Leave page?');</pre>
    </div>
  `,
})
class Ex11 {}

// 12. ResolveFn returns static data
const staticDataResolver: ResolveFn<{ title: string }> = () => {
  return of({ title: 'Static Page Title' });
};

@Component({
  selector: 'ex-12',
  standalone: true,
  template: `
    <div style="background:#e8f5e9;padding:8px;border-radius:4px;font-size:13px">
      <strong>staticDataResolver: ResolveFn</strong>
      <pre style="margin:4px 0;font-size:11px">const staticDataResolver: ResolveFn&lt;{{ '{' }}title: string{{ '}' }}&gt; = () =>
  of({{ '{' }} title: 'Static Page Title' {{ '}' }});</pre>
    </div>
  `,
})
class Ex12 {}

// 13. Guard using inject(Router)
const injectRouterGuard: CanActivateFn = () => {
  const router = inject(Router);
  console.log('[GUARD] Current URL:', router.url);
  return true;
};

@Component({
  selector: 'ex-13',
  standalone: true,
  template: `
    <div style="background:#f3e5f5;padding:8px;border-radius:4px;font-size:13px">
      <strong>injectRouterGuard — inject(Router)</strong>
      <pre style="margin:4px 0;font-size:11px">const router = inject(Router);
console.log('[GUARD] Current URL:', router.url);
return true;</pre>
    </div>
  `,
})
class Ex13 {}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────

// 14. Auth interceptor with Bearer token from service
@Injectable({ providedIn: 'root' })
class AuthService14 {
  token = signal('secret-jwt-abc123');
  isLoggedIn = computed(() => !!this.token());
}

const bearerAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService14);
  const cloned = req.clone({ headers: req.headers.set('Authorization', `Bearer ${auth.token()}`) });
  return next(cloned);
};

@Component({
  selector: 'ex-14',
  standalone: true,
  template: `
    <div style="background:#e3f2fd;padding:8px;border-radius:4px;font-size:13px">
      <strong>bearerAuthInterceptor — token from AuthService signal</strong>
      <pre style="margin:4px 0;font-size:11px">const auth = inject(AuthService);
req.clone({{ '{' }} headers: req.headers.set('Authorization', 'Bearer ' + auth.token()) {{ '}' }})</pre>
      <span>Token: <code>{{ authSvc.token() }}</code></span>
    </div>
  `,
})
class Ex14 {
  authSvc = inject(AuthService14);
}

// 15. Retry interceptor (retry(3) on error)
const retryInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(retry(3));
};

@Component({
  selector: 'ex-15',
  standalone: true,
  template: `
    <div style="background:#fff9c4;padding:8px;border-radius:4px;font-size:13px">
      <strong>retryInterceptor — retry(3)</strong>
      <pre style="margin:4px 0;font-size:11px">return next(req).pipe(retry(3));</pre>
    </div>
  `,
})
class Ex15 {}

// 16. Timeout interceptor (timeout operator)
const timeoutInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(timeout(5000));
};

@Component({
  selector: 'ex-16',
  standalone: true,
  template: `
    <div style="background:#fce4ec;padding:8px;border-radius:4px;font-size:13px">
      <strong>timeoutInterceptor — timeout(5000)</strong>
      <pre style="margin:4px 0;font-size:11px">return next(req).pipe(timeout(5000));</pre>
      <span style="font-size:11px;color:#999">Throws TimeoutError if response takes &gt;5s</span>
    </div>
  `,
})
class Ex16 {}

// 17. Cache interceptor (Map-based simple cache)
const httpCache = new Map<string, HttpResponse<unknown>>();
const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET') return next(req);
  const cached = httpCache.get(req.url);
  if (cached) return of(cached);
  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse) httpCache.set(req.url, event);
    })
  );
};

@Component({
  selector: 'ex-17',
  standalone: true,
  template: `
    <div style="background:#e0f2f1;padding:8px;border-radius:4px;font-size:13px">
      <strong>cacheInterceptor — Map-based GET cache</strong>
      <pre style="margin:4px 0;font-size:11px">const cached = httpCache.get(req.url);
if (cached) return of(cached);
return next(req).pipe(tap(evt => httpCache.set(req.url, evt)));</pre>
    </div>
  `,
})
class Ex17 {}

// 18. Loading state interceptor (signal increment/decrement)
const loadingCount = signal(0);
const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  loadingCount.update(c => c + 1);
  return next(req).pipe(finalize(() => loadingCount.update(c => c - 1)));
};

@Component({
  selector: 'ex-18',
  standalone: true,
  template: `
    <div style="background:#e8eaf6;padding:8px;border-radius:4px;font-size:13px">
      <strong>loadingInterceptor — signal-based loading counter</strong>
      <pre style="margin:4px 0;font-size:11px">loadingCount.update(c => c + 1);
return next(req).pipe(finalize(() => loadingCount.update(c => c - 1)));</pre>
      <div style="display:flex;align-items:center;gap:6px">
        Active requests: <strong>{{ loading() }}</strong>
        @if (loading() > 0) { <span style="font-size:11px;color:#673AB7">Loading...</span> }
      </div>
    </div>
  `,
})
class Ex18 {
  loading = loadingCount;
}

// 19. CSRF token interceptor
const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  const csrfToken = document.cookie.split(';').find(c => c.trim().startsWith('XSRF-TOKEN='))?.split('=')[1] ?? '';
  const cloned = req.clone({ headers: req.headers.set('X-XSRF-TOKEN', csrfToken) });
  return next(cloned);
};

@Component({
  selector: 'ex-19',
  standalone: true,
  template: `
    <div style="background:#fff3e0;padding:8px;border-radius:4px;font-size:13px">
      <strong>csrfInterceptor — X-XSRF-TOKEN header</strong>
      <pre style="margin:4px 0;font-size:11px">const token = document.cookie...find('XSRF-TOKEN');
req.clone({{ '{' }} headers: req.headers.set('X-XSRF-TOKEN', token) {{ '}' }})</pre>
    </div>
  `,
})
class Ex19 {}

// 20. Base URL interceptor
const BASE_URL = 'https://api.example.com';
const baseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith('http')) return next(req);
  const apiReq = req.clone({ url: `${BASE_URL}${req.url}` });
  return next(apiReq);
};

@Component({
  selector: 'ex-20',
  standalone: true,
  template: `
    <div style="background:#fce4ec;padding:8px;border-radius:4px;font-size:13px">
      <strong>baseUrlInterceptor — prepend base URL</strong>
      <pre style="margin:4px 0;font-size:11px">req.clone({{ '{' }} url: 'https://api.example.com' + req.url {{ '}' }})</pre>
    </div>
  `,
})
class Ex20 {}

// 21. Role guard checking user.role signal
@Injectable({ providedIn: 'root' })
class UserService21 {
  role = signal<'admin' | 'user' | null>('admin');
}

const adminRoleGuard: CanActivateFn = (): boolean | UrlTree => {
  const user = inject(UserService21);
  const router = inject(Router);
  return user.role() === 'admin' ? true : router.createUrlTree(['/unauthorized']);
};

@Component({
  selector: 'ex-21',
  standalone: true,
  template: `
    <div style="background:#e8f5e9;padding:8px;border-radius:4px;font-size:13px">
      <strong>adminRoleGuard — checks user.role() signal</strong>
      <pre style="margin:4px 0;font-size:11px">return user.role() === 'admin' ? true : router.createUrlTree(['/unauthorized']);</pre>
      <span>Current role: <code>{{ userSvc.role() }}</code> → Guard: <span style="color:green">PASS</span></span>
    </div>
  `,
})
class Ex21 {
  userSvc = inject(UserService21);
}

// 22. Feature flag guard
const featureFlags = signal({ newDashboard: true, betaCheckout: false });
const featureFlagGuard = (flag: keyof ReturnType<typeof featureFlags>): CanActivateFn => () => {
  return featureFlags()[flag];
};

@Component({
  selector: 'ex-22',
  standalone: true,
  template: `
    <div style="background:#e3f2fd;padding:8px;border-radius:4px;font-size:13px">
      <strong>featureFlagGuard — checks feature flag signal</strong>
      <pre style="margin:4px 0;font-size:11px">const featureFlagGuard = (flag) => () => featureFlags()[flag];</pre>
      <div>newDashboard: <strong style="color:green">{{ flags().newDashboard }}</strong></div>
      <div>betaCheckout: <strong style="color:red">{{ flags().betaCheckout }}</strong></div>
    </div>
  `,
})
class Ex22 {
  flags = featureFlags;
}

// 23. Guest-only guard (redirect if logged in)
@Injectable({ providedIn: 'root' })
class AuthService23 {
  isLoggedIn = signal(false);
}

const guestOnlyGuard: CanActivateFn = (): boolean | UrlTree => {
  const auth = inject(AuthService23);
  const router = inject(Router);
  return auth.isLoggedIn() ? router.createUrlTree(['/dashboard']) : true;
};

@Component({
  selector: 'ex-23',
  standalone: true,
  template: `
    <div style="background:#f3e5f5;padding:8px;border-radius:4px;font-size:13px">
      <strong>guestOnlyGuard — redirect logged-in users away</strong>
      <pre style="margin:4px 0;font-size:11px">return auth.isLoggedIn() ? router.createUrlTree(['/dashboard']) : true;</pre>
      <span>isLoggedIn: <code>{{ auth.isLoggedIn() }}</code> → Guest guard: <span style="color:green">PASS</span></span>
    </div>
  `,
})
class Ex23 {
  auth = inject(AuthService23);
}

// 24. Unsaved changes guard with form.dirty signal
const formDirty = signal(false);
const unsavedChangesGuard: CanDeactivateFn<unknown> = (): boolean => {
  if (formDirty()) return window.confirm('You have unsaved changes. Leave?');
  return true;
};

@Component({
  selector: 'ex-24',
  standalone: true,
  template: `
    <div style="background:#fff9c4;padding:8px;border-radius:4px;font-size:13px">
      <strong>unsavedChangesGuard — CanDeactivateFn with form.dirty signal</strong>
      <pre style="margin:4px 0;font-size:11px">if (formDirty()) return window.confirm('Leave?');
return true;</pre>
      <label style="display:flex;align-items:center;gap:6px">
        <input type="checkbox" [checked]="dirty()" (change)="dirty.set(!dirty())" />
        Simulate form dirty
      </label>
    </div>
  `,
})
class Ex24 {
  dirty = formDirty;
}

// 25. Data resolver with simulated HTTP (of() with delay)
const pageDataResolver: ResolveFn<{ heading: string; count: number }> = () => {
  return of({ heading: 'Welcome Back', count: 42 }).pipe(delay(300));
};

@Component({
  selector: 'ex-25',
  standalone: true,
  template: `
    <div style="background:#e0f2f1;padding:8px;border-radius:4px;font-size:13px">
      <strong>pageDataResolver — ResolveFn with of() + delay(300)</strong>
      <pre style="margin:4px 0;font-size:11px">return of({{ '{' }} heading: 'Welcome Back', count: 42 {{ '}' }}).pipe(delay(300));</pre>
      <span>Resolved data available in route snapshot</span>
    </div>
  `,
})
class Ex25 {}

// 26. CanMatchFn for lazy route gating
const premiumUserMatchFn: CanMatchFn = (): boolean => {
  const isPremium = true; // would come from a service
  return isPremium;
};

@Component({
  selector: 'ex-26',
  standalone: true,
  template: `
    <div style="background:#fce4ec;padding:8px;border-radius:4px;font-size:13px">
      <strong>premiumUserMatchFn: CanMatchFn — lazy route gating</strong>
      <pre style="margin:4px 0;font-size:11px">const premiumUserMatchFn: CanMatchFn = () => isPremium;
// Route: {{ '{' }} path: 'premium', canMatch: [premiumUserMatchFn], loadChildren: () => ... {{ '}' }}</pre>
    </div>
  `,
})
class Ex26 {}

// ─── NESTED (27–38) ──────────────────────────────────────────

// 27. Auth + Role guards combined on one route
const combinedGuardRoute = `{
  path: 'admin',
  canActivate: [authGuard, adminRoleGuard],
  component: AdminComponent
}`;

@Component({
  selector: 'ex-27',
  standalone: true,
  template: `
    <div style="background:#e8eaf6;padding:8px;border-radius:4px;font-size:13px">
      <strong>Auth + Role guards combined (canActivate array)</strong>
      <pre style="margin:4px 0;font-size:11px">{{ '{' }}
  path: 'admin',
  canActivate: [authGuard, adminRoleGuard],
  component: AdminComponent
{{ '}' }}</pre>
      <span style="font-size:11px;color:#555">Both guards must pass. Angular evaluates them sequentially.</span>
    </div>
  `,
})
class Ex27 {}

// 28. Guard + Resolver combination
@Component({
  selector: 'ex-28',
  standalone: true,
  template: `
    <div style="background:#e3f2fd;padding:8px;border-radius:4px;font-size:13px">
      <strong>Guard + Resolver combination on one route</strong>
      <pre style="margin:4px 0;font-size:11px">{{ '{' }}
  path: 'profile/:id',
  canActivate: [authGuard],
  resolve: {{ '{' }} user: userResolver {{ '}' }},
  component: ProfileComponent
{{ '}' }}</pre>
      <span style="font-size:11px">Guard runs first; resolver runs after guard passes.</span>
    </div>
  `,
})
class Ex28 {}

// 29. Interceptor calling next twice (retry logic)
const retryOnceInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError(() => next(req)) // retry once on any error
  );
};

@Component({
  selector: 'ex-29',
  standalone: true,
  template: `
    <div style="background:#fff9c4;padding:8px;border-radius:4px;font-size:13px">
      <strong>retryOnceInterceptor — calls next twice on error</strong>
      <pre style="margin:4px 0;font-size:11px">return next(req).pipe(
  catchError(() => next(req)) // retry once
);</pre>
    </div>
  `,
})
class Ex29 {}

// 30. Resolver with forkJoin (multiple data sources)
const multiDataResolver: ResolveFn<{ users: unknown[]; posts: unknown[] }> = () => {
  return forkJoin({
    users: of([{ id: 1, name: 'Alice' }]).pipe(delay(100)),
    posts: of([{ id: 1, title: 'Hello' }]).pipe(delay(150)),
  });
};

@Component({
  selector: 'ex-30',
  standalone: true,
  template: `
    <div style="background:#e8f5e9;padding:8px;border-radius:4px;font-size:13px">
      <strong>multiDataResolver — forkJoin two data sources</strong>
      <pre style="margin:4px 0;font-size:11px">return forkJoin({{ '{' }}
  users: http.get('/users'),
  posts: http.get('/posts')
{{ '}' }});</pre>
    </div>
  `,
})
class Ex30 {}

// 31. Auth guard reading signal store state
@Injectable({ providedIn: 'root' })
class SignalAuthStore {
  private _authenticated = signal(true);
  isAuthenticated = this._authenticated.asReadonly();
}

const signalStoreGuard: CanActivateFn = (): boolean => {
  return inject(SignalAuthStore).isAuthenticated();
};

@Component({
  selector: 'ex-31',
  standalone: true,
  template: `
    <div style="background:#f3e5f5;padding:8px;border-radius:4px;font-size:13px">
      <strong>signalStoreGuard — reads signal store state</strong>
      <pre style="margin:4px 0;font-size:11px">const signalStoreGuard: CanActivateFn = () =>
  inject(SignalAuthStore).isAuthenticated();</pre>
      <span>Store authenticated: <code>{{ store.isAuthenticated() }}</code></span>
    </div>
  `,
})
class Ex31 {
  store = inject(SignalAuthStore);
}

// 32. Guard with loading overlay trigger
const overlayVisible = signal(false);
const overlayGuard: CanActivateFn = (): Observable<boolean> => {
  overlayVisible.set(true);
  return of(true).pipe(
    delay(500),
    tap(() => overlayVisible.set(false))
  );
};

@Component({
  selector: 'ex-32',
  standalone: true,
  template: `
    <div style="background:#e0f7fa;padding:8px;border-radius:4px;font-size:13px">
      <strong>overlayGuard — shows loading overlay during guard resolution</strong>
      <pre style="margin:4px 0;font-size:11px">overlayVisible.set(true);
return of(true).pipe(delay(500), tap(() => overlayVisible.set(false)));</pre>
      <span>Overlay visible: <code>{{ overlayVisible() }}</code></span>
    </div>
  `,
})
class Ex32 {
  overlayVisible = overlayVisible;
}

// 33. Resolver error handling (catchError fallback)
const safeResolver: ResolveFn<{ data: string }> = () => {
  return of({ data: 'real data' }).pipe(
    switchMap(() => throwError(() => new Error('Simulated error'))),
    catchError(() => of({ data: 'fallback data' }))
  );
};

@Component({
  selector: 'ex-33',
  standalone: true,
  template: `
    <div style="background:#fff3e0;padding:8px;border-radius:4px;font-size:13px">
      <strong>safeResolver — catchError fallback data</strong>
      <pre style="margin:4px 0;font-size:11px">return http.get(url).pipe(
  catchError(() => of({{ '{' }} data: 'fallback data' {{ '}' }}))
);</pre>
    </div>
  `,
})
class Ex33 {}

// 34. Interceptor that enriches request + handles response
const enrichInterceptor: HttpInterceptorFn = (req, next) => {
  const enriched = req.clone({
    headers: req.headers
      .set('X-App-Version', '2.4.0')
      .set('X-Request-Id', Math.random().toString(36).slice(2)),
  });
  return next(enriched).pipe(
    tap(event => {
      if (event instanceof HttpResponse) {
        console.log('[ENRICH] Response status:', event.status);
      }
    })
  );
};

@Component({
  selector: 'ex-34',
  standalone: true,
  template: `
    <div style="background:#fce4ec;padding:8px;border-radius:4px;font-size:13px">
      <strong>enrichInterceptor — enriches request headers + logs response</strong>
      <pre style="margin:4px 0;font-size:11px">req.clone({{ '{' }} headers: headers.set('X-App-Version','2.4.0').set('X-Request-Id', uuid) {{ '}' }})
.pipe(tap(event => console.log(event.status)))</pre>
    </div>
  `,
})
class Ex34 {}

// 35. Multiple interceptors order demonstration
@Component({
  selector: 'ex-35',
  standalone: true,
  template: `
    <div style="background:#e8eaf6;padding:8px;border-radius:4px;font-size:13px">
      <strong>Multiple interceptors order in withInterceptors([])</strong>
      <pre style="margin:4px 0;font-size:11px">provideHttpClient(
  withInterceptors([
    loggingInterceptor,   // runs 1st
    authTokenInterceptor, // runs 2nd
    errorInterceptor,     // runs 3rd
  ])
)</pre>
      <span style="font-size:11px;color:#555">Interceptors apply in array order (request direction). Response is reversed.</span>
    </div>
  `,
})
class Ex35 {}

// 36. Guard hierarchy (parent + child guards)
@Component({
  selector: 'ex-36',
  standalone: true,
  template: `
    <div style="background:#e3f2fd;padding:8px;border-radius:4px;font-size:13px">
      <strong>Guard hierarchy — parent canActivate + child canActivateChild</strong>
      <pre style="margin:4px 0;font-size:11px">{{ '{' }}
  path: 'admin',
  canActivate: [authGuard],
  canActivateChild: [adminRoleGuard],
  children: [
    {{ '{' }} path: 'users', component: UsersComponent {{ '}' }},
    {{ '{' }} path: 'settings', component: SettingsComponent {{ '}' }}
  ]
{{ '}' }}</pre>
    </div>
  `,
})
class Ex36 {}

// 37. Resolver with cache (shareReplay pattern)
const cachedUserData$ = of({ user: 'Alice', role: 'admin' }).pipe(
  delay(200),
  shareReplay(1)
);

const cachedResolver: ResolveFn<{ user: string; role: string }> = () => cachedUserData$;

@Component({
  selector: 'ex-37',
  standalone: true,
  template: `
    <div style="background:#e0f2f1;padding:8px;border-radius:4px;font-size:13px">
      <strong>cachedResolver — shareReplay(1) so data is fetched once</strong>
      <pre style="margin:4px 0;font-size:11px">const cachedData$ = http.get('/user').pipe(shareReplay(1));
const cachedResolver: ResolveFn&lt;User&gt; = () => cachedData$;</pre>
    </div>
  `,
})
class Ex37 {}

// 38. Full auth interceptor + auth guard system
@Injectable({ providedIn: 'root' })
class AuthSystem38 {
  token = signal<string | null>('valid-token-xyz');
  isAuthenticated = computed(() => !!this.token());
  login(t: string) { this.token.set(t); }
  logout() { this.token.set(null); }
}

const fullAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthSystem38);
  if (!auth.token()) return next(req);
  return next(req.clone({ headers: req.headers.set('Authorization', `Bearer ${auth.token()}`) }));
};

const fullAuthGuard: CanActivateFn = (): boolean | UrlTree => {
  const auth = inject(AuthSystem38);
  const router = inject(Router);
  return auth.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

@Component({
  selector: 'ex-38',
  standalone: true,
  template: `
    <div style="background:#e8f5e9;padding:8px;border-radius:4px;font-size:13px">
      <strong>Full auth system: AuthService signal + interceptor + guard</strong>
      <div style="margin:4px 0">Token: <code>{{ auth.token() }}</code></div>
      <div>isAuthenticated: <code>{{ auth.isAuthenticated() }}</code></div>
      <div style="display:flex;gap:6px;margin-top:6px">
        <button (click)="auth.login('new-token')" style="font-size:11px;padding:2px 8px">Login</button>
        <button (click)="auth.logout()" style="font-size:11px;padding:2px 8px">Logout</button>
      </div>
    </div>
  `,
})
class Ex38 {
  auth = inject(AuthSystem38);
}

// ─── ADVANCED (39–50) ────────────────────────────────────────

// 39. Functional interceptor factory (parameterized)
const createHeaderInterceptor = (headerName: string, getValue: () => string): HttpInterceptorFn =>
  (req, next) => next(req.clone({ headers: req.headers.set(headerName, getValue()) }));

const appVersionInterceptor = createHeaderInterceptor('X-App-Version', () => '3.0.0');

@Component({
  selector: 'ex-39',
  standalone: true,
  template: `
    <div style="background:#e8eaf6;padding:8px;border-radius:4px;font-size:13px">
      <strong>createHeaderInterceptor — factory-parameterized interceptor</strong>
      <pre style="margin:4px 0;font-size:11px">const createHeaderInterceptor = (name, getValue) =>
  (req, next) => next(req.clone({{ '{' }} headers: req.headers.set(name, getValue()) {{ '}' }}));

const appVersionInterceptor = createHeaderInterceptor('X-App-Version', () => '3.0.0');</pre>
    </div>
  `,
})
class Ex39 {}

// 40. withInterceptors([...]) provider setup shown
@Component({
  selector: 'ex-40',
  standalone: true,
  template: `
    <div style="background:#e3f2fd;padding:8px;border-radius:4px;font-size:13px">
      <strong>withInterceptors([...]) — Angular 15+ functional interceptor setup</strong>
      <pre style="margin:4px 0;font-size:11px">// app.config.ts
export const appConfig: ApplicationConfig = {{ '{' }}
  providers: [
    provideHttpClient(
      withInterceptors([
        loggingInterceptor,
        bearerAuthInterceptor,
        errorInterceptor,
        cacheInterceptor,
      ])
    )
  ]
{{ '}' }};</pre>
    </div>
  `,
})
class Ex40 {}

// 41. Interceptor for request deduplication
const pendingRequests = new Map<string, Observable<unknown>>();
const deduplicateInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET') return next(req);
  const key = req.urlWithParams;
  let pending = pendingRequests.get(key);
  if (!pending) {
    pending = next(req).pipe(
      finalize(() => pendingRequests.delete(key)),
      shareReplay(1)
    ) as Observable<unknown>;
    pendingRequests.set(key, pending);
  }
  return pending as ReturnType<HttpHandlerFn>;
};

@Component({
  selector: 'ex-41',
  standalone: true,
  template: `
    <div style="background:#fff9c4;padding:8px;border-radius:4px;font-size:13px">
      <strong>deduplicateInterceptor — share in-flight GET requests</strong>
      <pre style="margin:4px 0;font-size:11px">const key = req.urlWithParams;
if (!pending) {{ '{' }}
  pending = next(req).pipe(shareReplay(1));
  pendingRequests.set(key, pending);
{{ '}' }}
return pending;</pre>
    </div>
  `,
})
class Ex41 {}

// 42. Interceptor for progressive retry with backoff
const backoffRetryInterceptor: HttpInterceptorFn = (req, next) => {
  const retryWithBackoff = (retries: number, delayMs: number): Observable<unknown> =>
    next(req).pipe(
      catchError(err =>
        retries > 0
          ? timer(delayMs).pipe(switchMap(() => retryWithBackoff(retries - 1, delayMs * 2)))
          : throwError(() => err)
      )
    );
  return retryWithBackoff(3, 500) as ReturnType<HttpHandlerFn>;
};

@Component({
  selector: 'ex-42',
  standalone: true,
  template: `
    <div style="background:#e8f5e9;padding:8px;border-radius:4px;font-size:13px">
      <strong>backoffRetryInterceptor — exponential backoff retry</strong>
      <pre style="margin:4px 0;font-size:11px">retryWithBackoff(3, 500): delays 500ms → 1000ms → 2000ms
catchError(err =>
  retries > 0 ? timer(delayMs).pipe(switchMap(() => retry(retries-1, delay*2)))
              : throwError(() => err)
)</pre>
    </div>
  `,
})
class Ex42 {}

// 43. Interceptor for response transformation
const transformResponseInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    map(event => {
      if (event instanceof HttpResponse && event.body && typeof event.body === 'object') {
        return event.clone({ body: { ...event.body as object, _transformed: true, _ts: Date.now() } });
      }
      return event;
    })
  );
};

@Component({
  selector: 'ex-43',
  standalone: true,
  template: `
    <div style="background:#f3e5f5;padding:8px;border-radius:4px;font-size:13px">
      <strong>transformResponseInterceptor — mutates response body</strong>
      <pre style="margin:4px 0;font-size:11px">map(event =>
  event instanceof HttpResponse
    ? event.clone({{ '{' }} body: {{ '{' }} ...body, _transformed: true {{ '}' }} {{ '}' }})
    : event
)</pre>
    </div>
  `,
})
class Ex43 {}

// 44. Interceptor for upload progress tracking
const uploadProgressInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method === 'POST') {
    const tracked = req.clone({ reportProgress: true });
    return next(tracked);
  }
  return next(req);
};

@Component({
  selector: 'ex-44',
  standalone: true,
  template: `
    <div style="background:#e0f7fa;padding:8px;border-radius:4px;font-size:13px">
      <strong>uploadProgressInterceptor — enable reportProgress on POST</strong>
      <pre style="margin:4px 0;font-size:11px">if (req.method === 'POST') {{ '{' }}
  const tracked = req.clone({{ '{' }} reportProgress: true {{ '}' }});
  return next(tracked);
{{ '}' }}</pre>
      <span style="font-size:11px;color:#555">Combines with HttpEventType.UploadProgress events</span>
    </div>
  `,
})
class Ex44 {}

// 45. Signal-based auth guard (reactive)
@Injectable({ providedIn: 'root' })
class ReactiveAuthService {
  isAuthenticated = signal(true);
  toggle() { this.isAuthenticated.update(v => !v); }
}

const reactiveAuthGuard: CanActivateFn = (): boolean | UrlTree => {
  const auth = inject(ReactiveAuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

@Component({
  selector: 'ex-45',
  standalone: true,
  template: `
    <div style="background:#e8f5e9;padding:8px;border-radius:4px;font-size:13px">
      <strong>reactiveAuthGuard — signal-based, re-evaluates on change</strong>
      <pre style="margin:4px 0;font-size:11px">const reactiveAuthGuard: CanActivateFn = () =>
  inject(ReactiveAuthService).isAuthenticated()
    ? true
    : router.createUrlTree(['/login']);</pre>
      <div>Authenticated: <code>{{ auth.isAuthenticated() }}</code></div>
      <button (click)="auth.toggle()" style="margin-top:4px;font-size:11px;padding:2px 8px">Toggle</button>
    </div>
  `,
})
class Ex45 {
  auth = inject(ReactiveAuthService);
}

// 46. Guard as injectable service (for testing)
@Injectable({ providedIn: 'root' })
class TestableAuthGuard {
  private auth = inject(ReactiveAuthService);
  private router = inject(Router);

  canActivate(): boolean | UrlTree {
    return this.auth.isAuthenticated() ? true : this.router.createUrlTree(['/login']);
  }
}

const injectableGuard: CanActivateFn = () => inject(TestableAuthGuard).canActivate();

@Component({
  selector: 'ex-46',
  standalone: true,
  template: `
    <div style="background:#fff9c4;padding:8px;border-radius:4px;font-size:13px">
      <strong>TestableAuthGuard — injectable class guard (easy to unit test)</strong>
      <pre style="margin:4px 0;font-size:11px">@Injectable({{ '{' }} providedIn: 'root' {{ '}' }})
class TestableAuthGuard {{ '{' }}
  canActivate(): boolean | UrlTree {{ '{' }} ... {{ '}' }}
{{ '}' }}
const injectableGuard: CanActivateFn = () => inject(TestableAuthGuard).canActivate();</pre>
    </div>
  `,
})
class Ex46 {}

// 47. CanActivateChild for nested route protection
const childAuthGuard: CanActivateChildFn = (childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean => {
  const isAuth = true;
  console.log('[CHILD GUARD] Checking child route:', state.url);
  return isAuth;
};

@Component({
  selector: 'ex-47',
  standalone: true,
  template: `
    <div style="background:#e3f2fd;padding:8px;border-radius:4px;font-size:13px">
      <strong>childAuthGuard: CanActivateChildFn</strong>
      <pre style="margin:4px 0;font-size:11px">const childAuthGuard: CanActivateChildFn = (childRoute, state) => {{ '{' }}
  console.log('Checking child route:', state.url);
  return isAuth;
{{ '}' }};

// Route config:
{{ '{' }} path: 'app', canActivateChild: [childAuthGuard], children: [...] {{ '}' }}</pre>
    </div>
  `,
})
class Ex47 {}

// 48. Resolver with optimistic data + background refresh
const optimisticResolver: ResolveFn<{ data: string; fresh: boolean }> = () => {
  const optimistic = { data: 'Cached value (instant)', fresh: false };
  // In real code: return of(optimistic) then trigger background refresh
  return of(optimistic);
};

@Component({
  selector: 'ex-48',
  standalone: true,
  template: `
    <div style="background:#fce4ec;padding:8px;border-radius:4px;font-size:13px">
      <strong>optimisticResolver — serve stale data instantly, refresh in background</strong>
      <pre style="margin:4px 0;font-size:11px">// 1. Return cached data immediately
return of(cachedData);
// 2. Trigger background HTTP refresh
//    Update signal store when fresh data arrives</pre>
    </div>
  `,
})
class Ex48 {}

// 49. Interceptor + guard coordination (auth refresh on 401)
@Injectable({ providedIn: 'root' })
class TokenRefreshService {
  refreshToken(): Observable<string> {
    return of('refreshed-token-' + Date.now()).pipe(delay(200));
  }
}

const autoRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenSvc = inject(TokenRefreshService);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        return tokenSvc.refreshToken().pipe(
          switchMap(newToken =>
            next(req.clone({ headers: req.headers.set('Authorization', `Bearer ${newToken}`) }))
          )
        );
      }
      return throwError(() => err);
    })
  );
};

@Component({
  selector: 'ex-49',
  standalone: true,
  template: `
    <div style="background:#e0f2f1;padding:8px;border-radius:4px;font-size:13px">
      <strong>autoRefreshInterceptor — intercept 401 → refresh token → retry</strong>
      <pre style="margin:4px 0;font-size:11px">catchError((err: HttpErrorResponse) => {{ '{' }}
  if (err.status === 401) {{ '{' }}
    return tokenSvc.refreshToken().pipe(
      switchMap(newToken => next(req.clone({{ '{' }} ...newToken {{ '}' }})))
    );
  {{ '}' }}
  return throwError(() => err);
{{ '}' }})</pre>
    </div>
  `,
})
class Ex49 {}

// 50. Full resilient API layer: interceptors + guards + resolvers
@Injectable({ providedIn: 'root' })
class FullApiLayer {
  private loading = signal(false);
  private error = signal<string | null>(null);
  isLoading = this.loading.asReadonly();
  lastError = this.error.asReadonly();
  setLoading(v: boolean) { this.loading.set(v); }
  setError(e: string | null) { this.error.set(e); }
}

const fullLayerInterceptor: HttpInterceptorFn = (req, next) => {
  const api = inject(FullApiLayer);
  api.setLoading(true);
  return next(req.clone({ headers: req.headers.set('Authorization', 'Bearer token').set('X-Version', '1.0') })).pipe(
    tap(event => { if (event instanceof HttpResponse) api.setError(null); }),
    catchError((err: HttpErrorResponse) => {
      api.setError(`${err.status}: ${err.message}`);
      return throwError(() => err);
    }),
    finalize(() => api.setLoading(false))
  );
};

const fullLayerGuard: CanActivateFn = (): boolean | UrlTree => {
  const router = inject(Router);
  const isAuth = true;
  return isAuth ? true : router.createUrlTree(['/login']);
};

const fullLayerResolver: ResolveFn<{ appName: string; version: string }> = () =>
  of({ appName: 'Angular Demo', version: '17.0' }).pipe(delay(100));

@Component({
  selector: 'ex-50',
  standalone: true,
  template: `
    <div style="border:2px solid #1565C0;border-radius:6px;padding:10px">
      <h4 style="margin:0 0 8px;color:#1565C0">Full Resilient API Layer</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;font-size:12px">
        <div style="background:#e3f2fd;padding:8px;border-radius:4px">
          <strong>Interceptor</strong>
          <ul style="margin:4px 0;padding-left:16px">
            <li>Auth header</li>
            <li>Version header</li>
            <li>Loading signal</li>
            <li>Error capture</li>
            <li>finalize cleanup</li>
          </ul>
        </div>
        <div style="background:#e8f5e9;padding:8px;border-radius:4px">
          <strong>Guard</strong>
          <ul style="margin:4px 0;padding-left:16px">
            <li>CanActivateFn</li>
            <li>Auth check</li>
            <li>UrlTree redirect</li>
          </ul>
        </div>
        <div style="background:#fff9c4;padding:8px;border-radius:4px">
          <strong>Resolver</strong>
          <ul style="margin:4px 0;padding-left:16px">
            <li>ResolveFn</li>
            <li>Pre-fetch data</li>
            <li>Available in route</li>
          </ul>
        </div>
      </div>
      <div style="margin-top:8px;font-size:12px">
        Loading: <code>{{ api.isLoading() }}</code> |
        Error: <code>{{ api.lastError() ?? 'none' }}</code>
      </div>
    </div>
  `,
})
class Ex50 {
  api = inject(FullApiLayer);
}

// ─── App Root ────────────────────────────────────────────────

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
      <h1>Examples 3.5 — HTTP Interceptors &amp; Route Guards</h1>

      <h4>1. Simple logging interceptor (tap request URL)</h4><ex-01 /><hr />
      <h4>2. Auth token interceptor (clone + add header)</h4><ex-02 /><hr />
      <h4>3. Error interceptor (catchError display)</h4><ex-03 /><hr />
      <h4>4. Request clone pattern (req.clone({...}))</h4><ex-04 /><hr />
      <h4>5. Response tap interceptor (log status)</h4><ex-05 /><hr />
      <h4>6. Interceptor chain (next.handle(req))</h4><ex-06 /><hr />
      <h4>7. CanActivateFn always returns true</h4><ex-07 /><hr />
      <h4>8. CanActivateFn returns false (blocks)</h4><ex-08 /><hr />
      <h4>9. CanActivateFn redirects to /login (UrlTree)</h4><ex-09 /><hr />
      <h4>10. CanDeactivateFn always true</h4><ex-10 /><hr />
      <h4>11. CanDeactivateFn with window.confirm</h4><ex-11 /><hr />
      <h4>12. ResolveFn returns static data</h4><ex-12 /><hr />
      <h4>13. Guard using inject(Router)</h4><ex-13 /><hr />
      <h4>14. Auth interceptor with Bearer token from service</h4><ex-14 /><hr />
      <h4>15. Retry interceptor (retry(3) on error)</h4><ex-15 /><hr />
      <h4>16. Timeout interceptor (timeout operator)</h4><ex-16 /><hr />
      <h4>17. Cache interceptor (Map-based simple cache)</h4><ex-17 /><hr />
      <h4>18. Loading state interceptor (signal increment/decrement)</h4><ex-18 /><hr />
      <h4>19. CSRF token interceptor</h4><ex-19 /><hr />
      <h4>20. Base URL interceptor</h4><ex-20 /><hr />
      <h4>21. Role guard checking user.role signal</h4><ex-21 /><hr />
      <h4>22. Feature flag guard</h4><ex-22 /><hr />
      <h4>23. Guest-only guard (redirect if logged in)</h4><ex-23 /><hr />
      <h4>24. Unsaved changes guard with form.dirty signal</h4><ex-24 /><hr />
      <h4>25. Data resolver with simulated HTTP (of() with delay)</h4><ex-25 /><hr />
      <h4>26. CanMatchFn for lazy route gating</h4><ex-26 /><hr />
      <h4>27. Auth + Role guards combined on one route</h4><ex-27 /><hr />
      <h4>28. Guard + Resolver combination</h4><ex-28 /><hr />
      <h4>29. Interceptor calling next twice (retry logic)</h4><ex-29 /><hr />
      <h4>30. Resolver with forkJoin (multiple data sources)</h4><ex-30 /><hr />
      <h4>31. Auth guard reading signal store state</h4><ex-31 /><hr />
      <h4>32. Guard with loading overlay trigger</h4><ex-32 /><hr />
      <h4>33. Resolver error handling (catchError fallback)</h4><ex-33 /><hr />
      <h4>34. Interceptor that enriches request + handles response</h4><ex-34 /><hr />
      <h4>35. Multiple interceptors order demonstration</h4><ex-35 /><hr />
      <h4>36. Guard hierarchy (parent + child guards)</h4><ex-36 /><hr />
      <h4>37. Resolver with cache (shareReplay pattern)</h4><ex-37 /><hr />
      <h4>38. Full auth interceptor + auth guard system</h4><ex-38 /><hr />
      <h4>39. Functional interceptor factory (parameterized)</h4><ex-39 /><hr />
      <h4>40. withInterceptors([...]) provider setup shown</h4><ex-40 /><hr />
      <h4>41. Interceptor for request deduplication</h4><ex-41 /><hr />
      <h4>42. Interceptor for progressive retry with backoff</h4><ex-42 /><hr />
      <h4>43. Interceptor for response transformation</h4><ex-43 /><hr />
      <h4>44. Interceptor for upload progress tracking</h4><ex-44 /><hr />
      <h4>45. Signal-based auth guard (reactive)</h4><ex-45 /><hr />
      <h4>46. Guard as injectable service (for testing)</h4><ex-46 /><hr />
      <h4>47. CanActivateChild for nested route protection</h4><ex-47 /><hr />
      <h4>48. Resolver with optimistic data + background refresh</h4><ex-48 /><hr />
      <h4>49. Interceptor + guard coordination (auth refresh on 401)</h4><ex-49 /><hr />
      <h4>50. Full resilient API layer: interceptors + guards + resolvers</h4><ex-50 /><hr />
    </div>
  `,
})
export class AppComponent {}
