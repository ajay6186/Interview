import { Component, signal, computed } from '@angular/core';

// ============================================================
// Examples 4.2 — Route Guards (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// NOTE: Guards are demonstrated as code patterns and interactive simulations
// using signals. Actual guards run in the router pipeline.
// ============================================================

// ─── BASIC (1–13) ────────────────────────────────────────────

// 1. Simple CanActivateFn — always true
@Component({
  selector: 'ex-01', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Simplest guard — always allows navigation.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <div style="padding:6px;background:#d4edda;color:#155724;border-radius:4px;font-size:12px">Guard returns: true ✓</div>
  `
})
class Ex01 {
  code = `export const alwaysAllowGuard: CanActivateFn = () => true;

// Route config:
{ path: 'home', component: HomeComponent, canActivate: [alwaysAllowGuard] }`;
}

// 2. CanActivateFn checking a signal
@Component({
  selector: 'ex-02', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Guard reads a signal from an injected service.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <label style="font-size:12px">
      <input type="checkbox" [checked]="isAuth()" (change)="isAuth.set(!isAuth())" /> isAuthenticated signal
    </label>
    <div style="margin-top:6px;padding:6px;border-radius:4px;font-size:12px"
         [style.background]="isAuth() ? '#d4edda' : '#f8d7da'"
         [style.color]="isAuth() ? '#155724' : '#721c24'">
      Guard result: {{ isAuth() ? 'true — allow' : 'false — block' }}
    </div>
  `
})
class Ex02 {
  isAuth = signal(false);
  code = `export const signalGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated(); // signal read
};`;
}

// 3. Redirect to /login in guard
@Component({
  selector: 'ex-03', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Guard returns a UrlTree to redirect instead of blocking.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <label style="font-size:12px">
      <input type="checkbox" [checked]="loggedIn()" (change)="loggedIn.set(!loggedIn())" /> Logged in
    </label>
    <p style="font-size:12px;margin-top:6px">Result: <strong>{{ loggedIn() ? 'Allow to /dashboard' : 'Redirect → /login' }}</strong></p>
  `
})
class Ex03 {
  loggedIn = signal(false);
  code = `export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn()
    ? true
    : router.createUrlTree(['/login']);
};`;
}

// 4. CanDeactivateFn — always true
@Component({
  selector: 'ex-04', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">CanDeactivateFn prevents leaving a route. Always-true allows leaving freely.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <div style="padding:6px;background:#d4edda;color:#155724;border-radius:4px;font-size:12px">Can always deactivate ✓</div>
  `
})
class Ex04 {
  code = `export const canAlwaysLeave: CanDeactivateFn<unknown> = () => true;

{ path: 'form', component: FormComponent, canDeactivate: [canAlwaysLeave] }`;
}

// 5. CanDeactivateFn with confirm dialog
@Component({
  selector: 'ex-05', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Guard asks user to confirm before leaving a dirty form.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <label style="font-size:12px">
      <input type="checkbox" [checked]="isDirty()" (change)="isDirty.set(!isDirty())" /> Form is dirty
    </label>
    <button style="margin-left:8px;font-size:12px" (click)="tryLeave()">Try to leave route</button>
    <p style="font-size:12px;margin-top:4px">{{ result() }}</p>
  `
})
class Ex05 {
  isDirty = signal(true);
  result = signal('');
  code = `export const unsavedChangesGuard: CanDeactivateFn<FormComponent> =
  (component) =>
    component.isDirty() ? confirm('Discard unsaved changes?') : true;`;
  tryLeave() {
    if (this.isDirty()) {
      this.result.set('Guard: "Discard unsaved changes?" → would show window.confirm()');
    } else {
      this.result.set('Guard: form is clean — navigation allowed');
    }
  }
}

// 6. CanMatchFn basic
@Component({
  selector: 'ex-06', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">CanMatchFn controls whether a route config matches at all (before activation).</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <p style="font-size:12px">CanMatch runs before route matching — can skip loading the lazy chunk entirely.</p>
  `
})
class Ex06 {
  code = `export const featureFlagGuard: CanMatchFn = () => {
  const features = inject(FeatureFlagService);
  return features.isEnabled('new-dashboard');
};

{ path: 'dashboard', loadComponent: () => import('./dashboard'), canMatch: [featureFlagGuard] }`;
}

// 7. ResolveFn basic
@Component({
  selector: 'ex-07', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">ResolveFn pre-fetches data before the component activates.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <p style="font-size:12px">Data is available in component via ActivatedRoute.snapshot.data['product']</p>
  `
})
class Ex07 {
  code = `export const productResolver: ResolveFn<Product> =
  (route) => inject(ProductService).getById(+route.paramMap.get('id')!);

{ path: 'product/:id', component: ProductComponent, resolve: { product: productResolver } }`;
}

// 8. Guard returning boolean
@Component({
  selector: 'ex-08', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Guard can return a plain boolean synchronously.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
  `
})
class Ex08 {
  code = `export const syncGuard: CanActivateFn = (route, state) => {
  const token = localStorage.getItem('token');
  return token !== null; // boolean
};`;
}

// 9. Guard returning UrlTree
@Component({
  selector: 'ex-09', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">UrlTree returned from a guard performs a redirect — preferred over imperative navigate().</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
  `
})
class Ex09 {
  code = `export const roleGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.hasRole('admin')) return true;
  if (auth.isLoggedIn()) return router.createUrlTree(['/forbidden']);
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: router.url } });
};`;
}

// 10. Guard using inject(Router)
@Component({
  selector: 'ex-10', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">inject() works inside functional guards to access any provider.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
  `
})
class Ex10 {
  code = `export const myGuard: CanActivateFn = (route) => {
  const router = inject(Router);       // Router
  const auth   = inject(AuthService);  // Custom service
  const store  = inject(Store);        // NgRx Store
  const http   = inject(HttpClient);   // HttpClient

  return auth.check() ?? router.createUrlTree(['/login']);
};`;
}

// 11. Guard using inject() service
@Component({
  selector: 'ex-11', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Guards commonly inject a service that holds auth/permission state.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
  `
})
class Ex11 {
  code = `@Injectable({ providedIn: 'root' })
class AuthService {
  private _user = signal<User | null>(null);
  isLoggedIn = computed(() => this._user() !== null);
  hasRole = (role: string) => computed(() => this._user()?.roles.includes(role) ?? false);
}

export const authGuard: CanActivateFn = () => inject(AuthService).isLoggedIn();`;
}

// 12. Guard returning Observable<boolean>
@Component({
  selector: 'ex-12', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Guards can return Observable&lt;boolean&gt; for async checks (e.g., HTTP token validation).</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
  `
})
class Ex12 {
  code = `export const tokenGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.validateToken().pipe(
    map(valid => valid ? true : inject(Router).createUrlTree(['/login'])),
    catchError(() => of(inject(Router).createUrlTree(['/error'])))
  );
};`;
}

// 13. Guard returning Promise<boolean>
@Component({
  selector: 'ex-13', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Guards can return Promise&lt;boolean&gt; for async/await style checks.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
  `
})
class Ex13 {
  code = `export const asyncAuthGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  try {
    const user = await auth.getCurrentUser();
    return user ? true : router.createUrlTree(['/login']);
  } catch {
    return router.createUrlTree(['/error']);
  }
};`;
}

// ─── INTERMEDIATE (14–26) ─────────────────────────────────────

// 14. Auth guard with token check
@Component({
  selector: 'ex-14', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Real-world auth guard checking JWT token presence and expiry.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <div style="display:flex;gap:8px;margin-top:6px">
      <label style="font-size:12px"><input type="checkbox" [checked]="hasToken()" (change)="hasToken.set(!hasToken())" /> Has token</label>
      <label style="font-size:12px"><input type="checkbox" [checked]="expired()" (change)="expired.set(!expired())" /> Token expired</label>
    </div>
    <p style="font-size:12px;margin-top:4px">{{ result() }}</p>
  `
})
class Ex14 {
  hasToken = signal(true);
  expired = signal(false);
  result = computed(() => {
    if (!this.hasToken()) return '→ redirect /login (no token)';
    if (this.expired()) return '→ redirect /login?expired=true';
    return '→ allow navigation';
  });
  code = `export const authGuard: CanActivateFn = () => {
  const token = localStorage.getItem('access_token');
  if (!token) return router.createUrlTree(['/login']);
  const decoded = jwtDecode(token);
  if (decoded.exp < Date.now() / 1000) return router.createUrlTree(['/login'], { queryParams: { expired: true } });
  return true;
};`;
}

// 15. Role guard with permission check
@Component({
  selector: 'ex-15', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Role guard factory that accepts the required role as a parameter.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">
      @for (role of roles; track role) {
        <span (click)="userRole.set(role)"
              [style.background]="userRole() === role ? 'royalblue' : '#eee'"
              [style.color]="userRole() === role ? 'white' : 'inherit'"
              style="padding:2px 10px;border-radius:10px;cursor:pointer;font-size:12px">{{ role }}</span>
      }
    </div>
    <p style="font-size:12px;margin-top:4px">Admin route: <strong>{{ userRole() === 'admin' ? 'allowed' : 'blocked → /forbidden' }}</strong></p>
  `
})
class Ex15 {
  roles = ['guest', 'user', 'editor', 'admin'];
  userRole = signal('user');
  code = `export const roleGuard = (requiredRole: string): CanActivateFn => () => {
  const auth = inject(AuthService);
  return auth.hasRole(requiredRole) ? true : inject(Router).createUrlTree(['/forbidden']);
};
{ path: 'admin', canActivate: [roleGuard('admin')], ... }`;
}

// 16. Feature flag guard
@Component({
  selector: 'ex-16', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Guard checks a feature flag before allowing access to a route.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <label style="font-size:12px">
      <input type="checkbox" [checked]="flagEnabled()" (change)="flagEnabled.set(!flagEnabled())" /> Feature flag: new-ui
    </label>
    <p style="font-size:12px;margin-top:4px">{{ flagEnabled() ? 'Access granted to /new-ui' : 'Redirected to /home' }}</p>
  `
})
class Ex16 {
  flagEnabled = signal(false);
  code = `export const featureGuard = (flag: string): CanActivateFn => () => {
  const flags = inject(FeatureFlagService);
  const router = inject(Router);
  return flags.isEnabled(flag) ? true : router.createUrlTree(['/home']);
};
{ path: 'new-ui', canActivate: [featureGuard('new-ui')], loadComponent: ... }`;
}

// 17. Subscription guard (paid feature)
@Component({
  selector: 'ex-17', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Guard redirects free-tier users away from premium routes.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">
      @for (plan of plans; track plan) {
        <span (click)="plan$.set(plan)"
              [style.background]="plan$() === plan ? 'royalblue' : '#eee'"
              [style.color]="plan$() === plan ? 'white' : 'inherit'"
              style="padding:2px 10px;border-radius:10px;cursor:pointer;font-size:12px">{{ plan }}</span>
      }
    </div>
    <p style="font-size:12px;margin-top:4px">Premium access: <strong>{{ plan$() === 'pro' || plan$() === 'enterprise' ? 'allowed' : 'upgrade required → /upgrade' }}</strong></p>
  `
})
class Ex17 {
  plans = ['free', 'pro', 'enterprise'];
  plan$ = signal('free');
  code = `export const subscriptionGuard: CanActivateFn = () => {
  const billing = inject(BillingService);
  const router = inject(Router);
  return billing.isPremium() ? true : router.createUrlTree(['/upgrade']);
};`;
}

// 18. Admin-only guard
@Component({
  selector: 'ex-18', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Strict admin guard — checks both authentication and admin role.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <div style="display:flex;gap:8px">
      <label style="font-size:12px"><input type="checkbox" [checked]="auth()" (change)="auth.set(!auth())" /> Authenticated</label>
      <label style="font-size:12px"><input type="checkbox" [checked]="isAdmin()" (change)="isAdmin.set(!isAdmin())" /> Admin role</label>
    </div>
    <p style="font-size:12px;margin-top:4px">{{ outcome() }}</p>
  `
})
class Ex18 {
  auth = signal(false);
  isAdmin = signal(false);
  outcome = computed(() => {
    if (!this.auth()) return '→ redirect /login';
    if (!this.isAdmin()) return '→ redirect /forbidden';
    return '→ allow /admin';
  });
  code = `export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);
  if (!auth.hasRole('admin')) return router.createUrlTree(['/forbidden']);
  return true;
};`;
}

// 19. Guest-only guard (redirect if logged in)
@Component({
  selector: 'ex-19', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Guest guard prevents authenticated users from accessing /login or /register.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <label style="font-size:12px">
      <input type="checkbox" [checked]="loggedIn()" (change)="loggedIn.set(!loggedIn())" /> Already logged in
    </label>
    <p style="font-size:12px;margin-top:4px">{{ loggedIn() ? '→ redirect /dashboard (already authenticated)' : '→ allow /login' }}</p>
  `
})
class Ex19 {
  loggedIn = signal(false);
  code = `export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn()
    ? router.createUrlTree(['/dashboard'])
    : true;
};
{ path: 'login', canActivate: [guestGuard], component: LoginComponent }`;
}

// 20. Unsaved changes guard with form dirty
@Component({
  selector: 'ex-20', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">CanDeactivate guard protects against losing unsaved form data.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <div style="border:1px solid #eee;padding:8px;border-radius:4px;font-size:12px">
      <input [value]="formValue()" (input)="formValue.set($any($event).target.value)" placeholder="Type to dirty form" style="width:100%;box-sizing:border-box" />
      <p style="margin:4px 0">Form dirty: <strong>{{ isDirty() }}</strong></p>
      <button (click)="tryLeave()">Try leave route</button>
      <p>{{ leaveResult() }}</p>
    </div>
  `
})
class Ex20 {
  formValue = signal('');
  isDirty = computed(() => this.formValue().length > 0);
  leaveResult = signal('');
  code = `export const dirtyGuard: CanDeactivateFn<EditComponent> =
  (component) => component.isDirty()
    ? confirm('You have unsaved changes. Leave?')
    : true;`;
  tryLeave() {
    this.leaveResult.set(this.isDirty() ? 'Guard blocked — form has unsaved changes' : 'Guard allowed — form is clean');
  }
}

// 21. Data resolver with HTTP
@Component({
  selector: 'ex-21', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Resolver pre-fetches data via HTTP before component renders.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <button (click)="simulate()">Simulate resolve</button>
    <div style="margin-top:6px;font-size:12px">
      @if (loading()) { <span style="color:royalblue">Resolving...</span> }
      @else if (data()) { <span style="color:green">Resolved: {{ data() }}</span> }
    </div>
  `
})
class Ex21 {
  loading = signal(false);
  data = signal<string | null>(null);
  code = `export const productResolver: ResolveFn<Product> = (route) =>
  inject(HttpClient).get<Product>('/api/products/' + route.paramMap.get('id'));`;
  simulate() {
    this.loading.set(true);
    this.data.set(null);
    setTimeout(() => { this.loading.set(false); this.data.set('{ id: 42, name: "Widget Pro", price: 99 }'); }, 800);
  }
}

// 22. Resolver with error handling
@Component({
  selector: 'ex-22', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Resolver with catchError redirects on failure instead of crashing the route.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
  `
})
class Ex22 {
  code = `export const safeProductResolver: ResolveFn<Product | null> = (route) => {
  const http = inject(HttpClient);
  const router = inject(Router);
  return http.get<Product>('/api/products/' + route.paramMap.get('id')).pipe(
    catchError(err => {
      console.error('Resolve failed', err);
      router.navigate(['/not-found']);
      return of(null);
    })
  );
};`;
}

// 23. Resolver with multiple resources (forkJoin)
@Component({
  selector: 'ex-23', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Resolver using forkJoin to resolve multiple HTTP calls in parallel.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <p style="font-size:12px">Both requests run in parallel — route activates only when both complete.</p>
  `
})
class Ex23 {
  code = `export const dashboardResolver: ResolveFn<DashboardData> = (route) => {
  const http = inject(HttpClient);
  const id = route.paramMap.get('id')!;
  return forkJoin({
    user: http.get<User>('/api/users/' + id),
    stats: http.get<Stats>('/api/users/' + id + '/stats'),
    posts: http.get<Post[]>('/api/users/' + id + '/posts'),
  });
};`;
}

// 24. CanActivateChild guard
@Component({
  selector: 'ex-24', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">canActivateChild runs on every child route under a parent — single guard covers all children.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <p style="font-size:12px">Different from canActivate: canActivateChild fires each time a child route changes.</p>
  `
})
class Ex24 {
  code = `{
  path: 'admin',
  component: AdminLayoutComponent,
  canActivateChild: [adminGuard],
  children: [
    { path: 'users', component: UsersComponent },     // guarded
    { path: 'reports', component: ReportsComponent }, // guarded
    { path: 'settings', component: SettingsComponent } // guarded
  ]
}`;
}

// 25. CanMatch for lazy module guard
@Component({
  selector: 'ex-25', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">canMatch prevents the lazy route from even matching — no chunk download if guard fails.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <p style="font-size:12px;color:green">Advantage: the JS bundle is never downloaded if canMatch returns false.</p>
  `
})
class Ex25 {
  code = `export const premiumGuard: CanMatchFn = () => inject(BillingService).isPremium();

{
  path: 'premium',
  canMatch: [premiumGuard],              // checked BEFORE loading chunk
  loadComponent: () => import('./premium/premium.component')
}`;
}

// 26. Guard composition (multiple guards)
@Component({
  selector: 'ex-26', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Multiple guards in canActivate array — ALL must pass (AND logic).</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <div style="font-size:12px;display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">
      <label><input type="checkbox" [checked]="g1()" (change)="g1.set(!g1())" /> authGuard</label>
      <label><input type="checkbox" [checked]="g2()" (change)="g2.set(!g2())" /> roleGuard</label>
      <label><input type="checkbox" [checked]="g3()" (change)="g3.set(!g3())" /> featureGuard</label>
    </div>
    <p style="font-size:12px;margin-top:4px">Access: <strong>{{ g1() && g2() && g3() ? 'granted' : 'denied' }}</strong></p>
  `
})
class Ex26 {
  g1 = signal(true); g2 = signal(true); g3 = signal(false);
  code = `{ path: 'admin-beta',
  canActivate: [authGuard, roleGuard('admin'), featureGuard('beta-admin')],
  loadComponent: () => import('./admin-beta') }`;
}

// ─── NESTED (27–38) ───────────────────────────────────────────

// 27. Guard + Resolver on same route
@Component({
  selector: 'ex-27', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Route with both guard and resolver — guard runs first, then resolver.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <div style="font-size:12px">
      <label><input type="checkbox" [checked]="auth()" (change)="auth.set(!auth())" /> Auth guard passes</label>
    </div>
    <button style="margin-top:6px;font-size:12px" (click)="simulate()">Simulate route activation</button>
    <p style="font-size:12px;margin-top:4px">{{ step() }}</p>
  `
})
class Ex27 {
  auth = signal(true);
  step = signal('');
  code = `{
  path: 'product/:id',
  canActivate: [authGuard],
  resolve: { product: productResolver },
  component: ProductDetailComponent
}`;
  simulate() {
    if (!this.auth()) { this.step.set('1. authGuard → false → redirect /login'); return; }
    this.step.set('1. authGuard → true → 2. productResolver fetching... → 3. Component activates');
  }
}

// 28. Guard that checks parent route data
@Component({
  selector: 'ex-28', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Guard can inspect parent route's snapshot data and params.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
  `
})
class Ex28 {
  code = `export const childGuard: CanActivateFn = (route) => {
  // Access parent route snapshot
  const parentData = route.parent?.data;
  const parentParams = route.parent?.paramMap;
  const orgId = parentParams?.get('orgId');
  const auth = inject(AuthService);
  return auth.canAccessOrg(orgId ?? '');
};`;
}

// 29. Child guard inheriting parent context
@Component({
  selector: 'ex-29', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">canActivateChild on parent applies to all descendants, injecting full route context.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
  `
})
class Ex29 {
  code = `export const orgGuard: CanActivateChild = (childRoute, state) => {
  const orgId = childRoute.paramMap.get('orgId')
               ?? childRoute.parent?.paramMap.get('orgId');
  return inject(OrgService).isMember(orgId!);
};

{
  path: 'org/:orgId',
  canActivateChild: [orgGuard],
  children: [
    { path: 'dashboard', component: OrgDashboard },
    { path: 'members',   component: OrgMembers }
  ]
}`;
}

// 30. Guard accessing current route snapshot
@Component({
  selector: 'ex-30', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">ActivatedRouteSnapshot exposes params, data, queryParams inside a guard.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
  `
})
class Ex30 {
  code = `export const myGuard: CanActivateFn = (route, state) => {
  const id        = route.paramMap.get('id');       // :id param
  const tab       = route.queryParamMap.get('tab'); // ?tab=overview
  const required  = route.data['requiredRole'];     // route data
  const fullUrl   = state.url;                      // full URL string
  return inject(AuthService).canAccess(id, required);
};`;
}

// 31. Guard with secondary outlet
@Component({
  selector: 'ex-31', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Guards apply to named outlet routes the same way as primary outlet routes.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
  `
})
class Ex31 {
  code = `{
  path: 'chat',
  outlet: 'sidebar',
  component: ChatPanelComponent,
  canActivate: [authGuard]  // guards named outlet just like primary
}

// Navigation to named outlet:
router.navigate([{ outlets: { sidebar: ['chat'] } }])`;
}

// 32. Resolver passing data to component
@Component({
  selector: 'ex-32', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Resolved data is accessed via ActivatedRoute.snapshot.data or route.data Observable.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <p style="font-size:12px">With withComponentInputBinding(): @Input() product maps to resolved data directly.</p>
  `
})
class Ex32 {
  code = `// Route: { path: 'product/:id', resolve: { product: productResolver }, ... }

// In component — snapshot:
class ProductComponent {
  private route = inject(ActivatedRoute);
  product = this.route.snapshot.data['product'] as Product;
}

// With withComponentInputBinding():
class ProductComponent {
  @Input() product!: Product; // auto-injected from resolve
}`;
}

// 33. Guard with animation trigger
@Component({
  selector: 'ex-33', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Guard can set loading state used to trigger enter/leave animations.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <button (click)="simulate()">Simulate guarded nav</button>
    <div [style.opacity]="checking() ? 0.5 : 1" style="padding:8px;background:#e8f0fe;border-radius:4px;margin-top:6px;transition:opacity .3s;font-size:12px">
      {{ checking() ? 'Checking guard...' : 'Route content' }}
    </div>
  `
})
class Ex33 {
  checking = signal(false);
  code = `export const animGuard: CanActivateFn = () => {
  const ui = inject(UiStateService);
  ui.setChecking(true);
  return inject(AuthService).check().pipe(
    tap(() => ui.setChecking(false))
  );
};`;
  simulate() { this.checking.set(true); setTimeout(() => this.checking.set(false), 800); }
}

// 34. Multi-guard priority order
@Component({
  selector: 'ex-34', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Guards in canActivate array run in order — first false/UrlTree wins.</p>
    <div style="font-size:12px">
      @for (g of guards; track g.name; let i = $index) {
        <div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid #f0f0f0">
          <span style="width:20px;color:#aaa">{{ i + 1 }}.</span>
          <label style="flex:1"><input type="checkbox" [checked]="g.pass" (change)="g.pass = !g.pass" /> {{ g.name }}</label>
          <span [style.color]="g.pass ? 'green' : 'crimson'">{{ g.pass ? 'pass' : 'FAIL → stop' }}</span>
        </div>
      }
    </div>
    <p style="font-size:12px;margin-top:6px">Final: <strong>{{ finalResult() }}</strong></p>
  `
})
class Ex34 {
  guards = [
    { name: 'authGuard', pass: true },
    { name: 'roleGuard', pass: true },
    { name: 'featureGuard', pass: false },
  ];
  finalResult() {
    const fail = this.guards.find(g => !g.pass);
    return fail ? `Blocked by ${fail.name}` : 'All guards pass — route activated';
  }
}

// 35. Guard reading query params
@Component({
  selector: 'ex-35', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Guard reads query params from RouterStateSnapshot or route.queryParamMap.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <input [value]="token()" (input)="token.set($any($event).target.value)" placeholder="?token=..." style="font-size:12px;width:200px" />
    <p style="font-size:12px;margin-top:4px">{{ token().length > 6 ? 'Token valid → allowed' : 'Token missing/short → blocked' }}</p>
  `
})
class Ex35 {
  token = signal('');
  code = `export const tokenQueryGuard: CanActivateFn = (route) => {
  const token = route.queryParamMap.get('token');
  return token ? inject(TokenService).validate(token) : false;
};`;
}

// 36. Guard with role from JWT
@Component({
  selector: 'ex-36', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Guard decodes JWT to extract roles without additional HTTP calls.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
  `
})
class Ex36 {
  code = `export const jwtRoleGuard = (role: string): CanActivateFn => () => {
  const token = localStorage.getItem('token');
  if (!token) return inject(Router).createUrlTree(['/login']);
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return (payload.roles as string[]).includes(role)
      ? true
      : inject(Router).createUrlTree(['/forbidden']);
  } catch {
    return inject(Router).createUrlTree(['/login']);
  }
};`;
}

// 37. Guard for route history
@Component({
  selector: 'ex-37', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Guard records route history for "back to previous page" functionality.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <div style="font-size:12px">History: {{ history().join(' → ') || '(empty)' }}</div>
    <button style="margin-top:4px;font-size:12px" (click)="add()">Add route visit</button>
    <button style="margin-top:4px;font-size:12px;margin-left:6px" (click)="back()">← Back</button>
  `
})
class Ex37 {
  history = signal<string[]>(['/home']);
  routes = ['/about', '/products', '/dashboard', '/settings'];
  idx = 0;
  add() { this.idx = (this.idx + 1) % this.routes.length; this.history.update(h => [...h, this.routes[this.idx]]); }
  back() { this.history.update(h => h.length > 1 ? h.slice(0, -1) : h); }
  code = `export const historyGuard: CanActivateFn = (route, state) => {
  inject(RouteHistoryService).push(state.url);
  return true; // always allows — just records
};`;
}

// 38. Guard with A/B testing flag
@Component({
  selector: 'ex-38', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Guard routes users to different components based on A/B test assignment.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <div style="display:flex;gap:4px;margin-top:4px">
      <span (click)="group.set('A')" [style.background]="group() === 'A' ? 'royalblue' : '#eee'" [style.color]="group() === 'A' ? 'white' : 'inherit'" style="padding:2px 10px;border-radius:10px;cursor:pointer;font-size:12px">Group A</span>
      <span (click)="group.set('B')" [style.background]="group() === 'B' ? 'royalblue' : '#eee'" [style.color]="group() === 'B' ? 'white' : 'inherit'" style="padding:2px 10px;border-radius:10px;cursor:pointer;font-size:12px">Group B</span>
    </div>
    <p style="font-size:12px;margin-top:4px">{{ group() === 'B' ? '→ redirect /checkout-v2 (experiment)' : '→ allow /checkout (control)' }}</p>
  `
})
class Ex38 {
  group = signal('A');
  code = `export const abTestGuard: CanActivateFn = () => {
  const ab = inject(AbTestService);
  const router = inject(Router);
  return ab.getGroup('checkout') === 'B'
    ? router.createUrlTree(['/checkout-v2'])
    : true;
};`;
}

// ─── ADVANCED (39–50) ─────────────────────────────────────────

// 39. Functional guard factory
@Component({
  selector: 'ex-39', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Factory function creates reusable parameterized guards.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <p style="font-size:12px">Usage: canActivate: [requirePermission('invoices:write')]</p>
  `
})
class Ex39 {
  code = `// Generic permission guard factory
export const requirePermission = (permission: string): CanActivateFn =>
  () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    return auth.hasPermission(permission)
      ? true
      : router.createUrlTree(['/forbidden'], {
          queryParams: { missing: permission }
        });
  };

// Usage:
{ path: 'invoices/new', canActivate: [requirePermission('invoices:write')], ... }
{ path: 'admin/roles',  canActivate: [requirePermission('roles:manage')], ... }`;
}

// 40. Guard with signal-based auth state
@Component({
  selector: 'ex-40', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Modern Angular: guard reads a signal directly — no Observable pipe needed.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <label style="font-size:12px">
      <input type="checkbox" [checked]="user()" (change)="user.set(user() ? null : ({ name: 'Alice', role: 'admin' } as any))" />
      User logged in
    </label>
    <p style="font-size:12px;margin-top:4px">{{ user() ? 'Guard allows: ' + (user() as any)?.name : 'Guard blocks → /login' }}</p>
  `
})
class Ex40 {
  user = signal<{ name: string; role: string } | null>(null);
  code = `@Injectable({ providedIn: 'root' })
class AuthService {
  user = signal<User | null>(null);
  isLoggedIn = computed(() => this.user() !== null);
}

export const signalAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  // Signal read — synchronous, no subscribe
  return auth.isLoggedIn() ? true : router.createUrlTree(['/login']);
};`;
}

// 41. Guard with RxJS auth state
@Component({
  selector: 'ex-41', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Guard subscribes to an Observable auth stream (e.g., Firebase Auth).</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
  `
})
class Ex41 {
  code = `export const observableAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.user$.pipe(
    take(1), // complete after first emission
    map(user => user ? true : router.createUrlTree(['/login']))
  );
};`;
}

// 42. Guard that pre-fetches data
@Component({
  selector: 'ex-42', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Guard can pre-fetch and cache data into a service before activation (alternative to resolver).</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
  `
})
class Ex42 {
  code = `export const prefetchGuard: CanActivateFn = (route) => {
  const store = inject(ProductStore);
  const id = +route.paramMap.get('id')!;
  return store.loadIfNeeded(id).pipe(
    map(() => true),
    catchError(() => of(inject(Router).createUrlTree(['/not-found'])))
  );
};`;
}

// 43. Guard with loading state indicator
@Component({
  selector: 'ex-43', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Guard sets a loading signal while async validation runs.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <button (click)="simulate()">Simulate async guard</button>
    <div style="margin-top:6px;height:4px;background:#eee;border-radius:2px;overflow:hidden">
      <div [style.width]="loading() ? '100%' : '0'" style="height:100%;background:royalblue;transition:width 0.8s"></div>
    </div>
    <p style="font-size:12px">{{ loading() ? 'Guard checking...' : status() }}</p>
  `
})
class Ex43 {
  loading = signal(false);
  status = signal('idle');
  code = `export const loadingGuard: CanActivateFn = () => {
  const ui = inject(LoadingService);
  ui.start();
  return inject(AuthService).verify().pipe(
    finalize(() => ui.stop()),
    map(ok => ok || inject(Router).createUrlTree(['/login']))
  );
};`;
  simulate() {
    this.loading.set(true);
    this.status.set('idle');
    setTimeout(() => { this.loading.set(false); this.status.set('Guard resolved — allowed'); }, 900);
  }
}

// 44. Guard with retry
@Component({
  selector: 'ex-44', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Guard retries failed async operations before blocking navigation.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
  `
})
class Ex44 {
  code = `export const resilientGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.validateSession().pipe(
    retry({ count: 3, delay: 1000 }),
    map(valid => valid ? true : router.createUrlTree(['/login'])),
    catchError(() => of(router.createUrlTree(['/error'])))
  );
};`;
}

// 45. Resolver with cache (shareReplay)
@Component({
  selector: 'ex-45', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Resolver uses a service with shareReplay to avoid duplicate HTTP requests.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <p style="font-size:12px">Second navigation to same product ID uses cached data.</p>
  `
})
class Ex45 {
  code = `@Injectable({ providedIn: 'root' })
class ProductCacheService {
  private cache = new Map<number, Observable<Product>>();
  get(id: number) {
    if (!this.cache.has(id)) {
      this.cache.set(id, this.http.get<Product>('/api/products/' + id).pipe(shareReplay(1)));
    }
    return this.cache.get(id)!;
  }
}

export const cachedProductResolver: ResolveFn<Product> = (route) =>
  inject(ProductCacheService).get(+route.paramMap.get('id')!);`;
}

// 46. Resolver with optimistic data
@Component({
  selector: 'ex-46', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Optimistic resolver returns cached data immediately, then updates in background.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
  `
})
class Ex46 {
  code = `export const optimisticResolver: ResolveFn<Product | null> = (route) => {
  const cache = inject(ProductCacheService);
  const id = +route.paramMap.get('id')!;
  const cached = cache.getSync(id); // sync cache hit
  if (cached) {
    // Background refresh
    cache.refresh(id).subscribe();
    return cached; // immediately return
  }
  return inject(HttpClient).get<Product>('/api/products/' + id); // cold fetch
};`;
}

// 47. Guard with complex permission matrix
@Component({
  selector: 'ex-47', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Guard evaluates a permission matrix: resource × action × scope.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <table style="font-size:11px;border-collapse:collapse;width:100%;margin-top:6px">
      @for (row of matrix; track row.role) {
        <tr [style.background]="row.role === userRole() ? '#e8f0fe' : 'transparent'">
          <td style="padding:3px 6px;font-weight:bold">{{ row.role }}</td>
          <td style="padding:3px 6px">{{ row.perms.join(', ') }}</td>
        </tr>
      }
    </table>
    <div style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap">
      @for (r of ['viewer','editor','admin','superadmin']; track r) {
        <span (click)="userRole.set(r)" [style.background]="userRole() === r ? 'royalblue' : '#eee'" [style.color]="userRole() === r ? 'white' : 'inherit'" style="padding:2px 8px;border-radius:10px;cursor:pointer;font-size:11px">{{ r }}</span>
      }
    </div>
  `
})
class Ex47 {
  userRole = signal('editor');
  matrix = [
    { role: 'viewer', perms: ['read'] },
    { role: 'editor', perms: ['read', 'write'] },
    { role: 'admin', perms: ['read', 'write', 'delete'] },
    { role: 'superadmin', perms: ['read', 'write', 'delete', 'admin'] },
  ];
  code = `export const permissionGuard = (resource: string, action: string): CanActivateFn => () => {
  const auth = inject(AuthService);
  return auth.can(action, resource) ? true : inject(Router).createUrlTree(['/forbidden']);
};`;
}

// 48. Guard unit-test-friendly pattern
@Component({
  selector: 'ex-48', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Functional guards are easily unit-tested with TestBed.runInInjectionContext.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
  `
})
class Ex48 {
  code = `// Guard:
export const authGuard: CanActivateFn = () =>
  inject(AuthService).isLoggedIn() || inject(Router).createUrlTree(['/login']);

// Spec:
describe('authGuard', () => {
  it('allows when logged in', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isLoggedIn: () => true } }
      ]
    });
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any)
    );
    expect(result).toBe(true);
  });
});`;
}

// 49. provide-level guard configuration
@Component({
  selector: 'ex-49', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Guards can be configured differently per environment via DI tokens.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
  `
})
class Ex49 {
  code = `// Guard config token
const GUARD_CONFIG = new InjectionToken<{ strict: boolean }>('GUARD_CONFIG');

export const configurableGuard: CanActivateFn = () => {
  const config = inject(GUARD_CONFIG, { optional: true }) ?? { strict: false };
  const auth = inject(AuthService);
  if (config.strict) return auth.hasStrongAuth();
  return auth.isLoggedIn();
};

// In providers:
{ provide: GUARD_CONFIG, useValue: { strict: true } }`;
}

// 50. Full protected route with guard + resolver + redirect
@Component({
  selector: 'ex-50', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Complete production-ready protected route configuration.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px;overflow:auto">{{ code }}</pre>
    <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
      @for (feat of features; track feat) {
        <span style="padding:2px 8px;background:#fff3cd;border-radius:10px;font-size:11px;color:#856404">{{ feat }}</span>
      }
    </div>
  `
})
class Ex50 {
  features = ['CanActivate', 'CanDeactivate', 'Resolve', 'CanMatch', 'Lazy'];
  code = `export const appRoutes: Routes = [
  {
    path: 'admin',
    canMatch: [adminCanMatchGuard],      // prevents loading chunk for non-admins
    loadComponent: () => import('./admin/admin.component'),
    canActivate: [authGuard, adminGuard],// both must pass
    canDeactivate: [unsavedChangesGuard],// warn on dirty form
    resolve: {
      user: currentUserResolver,         // pre-fetch current user
      stats: adminStatsResolver          // pre-fetch stats
    },
    data: { title: 'Admin Panel', requiredRole: 'admin' }
  },
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  }
];`;
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
    <div style="font-family:sans-serif;max-width:800px;margin:0 auto;padding:20px">
      <h1>Examples 4.2 — Route Guards</h1>
      <h4>1. Simple CanActivateFn (always true)</h4><ex-01 /><hr />
      <h4>2. CanActivateFn checking a signal</h4><ex-02 /><hr />
      <h4>3. Redirect to /login in guard</h4><ex-03 /><hr />
      <h4>4. CanDeactivateFn always true</h4><ex-04 /><hr />
      <h4>5. CanDeactivateFn with confirm dialog</h4><ex-05 /><hr />
      <h4>6. CanMatchFn basic</h4><ex-06 /><hr />
      <h4>7. ResolveFn basic</h4><ex-07 /><hr />
      <h4>8. Guard returning boolean</h4><ex-08 /><hr />
      <h4>9. Guard returning UrlTree</h4><ex-09 /><hr />
      <h4>10. Guard using inject(Router)</h4><ex-10 /><hr />
      <h4>11. Guard using inject() service</h4><ex-11 /><hr />
      <h4>12. Guard returning Observable&lt;boolean&gt;</h4><ex-12 /><hr />
      <h4>13. Guard returning Promise&lt;boolean&gt;</h4><ex-13 /><hr />
      <h4>14. Auth guard with token check</h4><ex-14 /><hr />
      <h4>15. Role guard with permission check</h4><ex-15 /><hr />
      <h4>16. Feature flag guard</h4><ex-16 /><hr />
      <h4>17. Subscription guard (paid feature)</h4><ex-17 /><hr />
      <h4>18. Admin-only guard</h4><ex-18 /><hr />
      <h4>19. Guest-only guard (redirect if logged in)</h4><ex-19 /><hr />
      <h4>20. Unsaved changes guard with form dirty</h4><ex-20 /><hr />
      <h4>21. Data resolver with HTTP</h4><ex-21 /><hr />
      <h4>22. Resolver with error handling</h4><ex-22 /><hr />
      <h4>23. Resolver with multiple resources (forkJoin)</h4><ex-23 /><hr />
      <h4>24. CanActivateChild guard</h4><ex-24 /><hr />
      <h4>25. CanMatch for lazy module guard</h4><ex-25 /><hr />
      <h4>26. Guard composition (multiple guards)</h4><ex-26 /><hr />
      <h4>27. Guard + Resolver on same route</h4><ex-27 /><hr />
      <h4>28. Guard that checks parent route data</h4><ex-28 /><hr />
      <h4>29. Child guard inheriting parent context</h4><ex-29 /><hr />
      <h4>30. Guard accessing current route snapshot</h4><ex-30 /><hr />
      <h4>31. Guard with secondary outlet</h4><ex-31 /><hr />
      <h4>32. Resolver passing data to component</h4><ex-32 /><hr />
      <h4>33. Guard with animation trigger</h4><ex-33 /><hr />
      <h4>34. Multi-guard priority order</h4><ex-34 /><hr />
      <h4>35. Guard reading query params</h4><ex-35 /><hr />
      <h4>36. Guard with role from JWT</h4><ex-36 /><hr />
      <h4>37. Guard for route history</h4><ex-37 /><hr />
      <h4>38. Guard with A/B testing flag</h4><ex-38 /><hr />
      <h4>39. Functional guard factory</h4><ex-39 /><hr />
      <h4>40. Guard with signal-based auth state</h4><ex-40 /><hr />
      <h4>41. Guard with RxJS auth state</h4><ex-41 /><hr />
      <h4>42. Guard that pre-fetches data</h4><ex-42 /><hr />
      <h4>43. Guard with loading state indicator</h4><ex-43 /><hr />
      <h4>44. Guard with retry</h4><ex-44 /><hr />
      <h4>45. Resolver with cache (shareReplay)</h4><ex-45 /><hr />
      <h4>46. Resolver with optimistic data</h4><ex-46 /><hr />
      <h4>47. Guard with complex permission matrix</h4><ex-47 /><hr />
      <h4>48. Guard unit-test-friendly pattern</h4><ex-48 /><hr />
      <h4>49. provide-level guard configuration</h4><ex-49 /><hr />
      <h4>50. Full protected route with guard+resolver+redirect</h4><ex-50 /><hr />
    </div>
  `,
})
export class AppComponent {}
