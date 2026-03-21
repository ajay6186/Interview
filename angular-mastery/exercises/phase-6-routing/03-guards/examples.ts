import { Component, signal, computed } from '@angular/core';

// ============================================================
// Examples 6.3 — Route Guards (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ───────────────────────────────────────────

// 1. CanActivateFn concept — code display in <pre>
@Component({
  selector: 'ex-01', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
import {{ '{' }} CanActivateFn {{ '}' }} from '@angular/router';

export const myGuard: CanActivateFn = (route, state) => {{ '{' }}
  return true; // allow navigation
{{ '}' }};
    </pre>
    <p style="color:#555;font-size:13px">CanActivateFn is a functional guard that returns boolean | UrlTree | Observable | Promise.</p>
  `
})
class Ex01 {}

// 2. CanActivateFn returns true — simulated demo component
@Component({
  selector: 'ex-02', standalone: true,
  template: `
    <div style="padding:10px;border:1px solid #4caf50;border-radius:6px">
      <p style="margin:0;color:#388e3c">Guard returned <strong>true</strong> — navigation allowed!</p>
      <button (click)="simulate()" style="margin-top:8px;padding:6px 12px;background:#4caf50;color:#fff;border:none;border-radius:4px;cursor:pointer">
        Simulate Guard Check
      </button>
      <p *ngIf="false" style="display:none"></p>
      @if (result()) {
        <p style="color:#388e3c;font-weight:bold;margin-top:8px">✓ Access Granted</p>
      }
    </div>
  `
})
class Ex02 {
  result = signal(false);
  simulate() { this.result.set(true); setTimeout(() => this.result.set(false), 2000); }
}

// 3. CanActivateFn returns false — blocked message display
@Component({
  selector: 'ex-03', standalone: true,
  template: `
    <div style="padding:10px;border:1px solid #f44336;border-radius:6px">
      <p style="margin:0;color:#c62828">Guard returned <strong>false</strong> — navigation blocked!</p>
      <button (click)="simulate()" style="margin-top:8px;padding:6px 12px;background:#f44336;color:#fff;border:none;border-radius:4px;cursor:pointer">
        Try Navigate (Blocked)
      </button>
      @if (blocked()) {
        <p style="color:#c62828;font-weight:bold;margin-top:8px">✗ Access Denied — redirected to home</p>
      }
    </div>
  `
})
class Ex03 {
  blocked = signal(false);
  simulate() { this.blocked.set(true); setTimeout(() => this.blocked.set(false), 2000); }
}

// 4. CanActivateFn with auth signal check — signal isLoggedIn demo
@Component({
  selector: 'ex-04', standalone: true,
  template: `
    <div style="padding:10px;border:1px solid #2196f3;border-radius:6px">
      <p style="margin:0">Auth guard with signal: isLoggedIn = <strong>{{ isLoggedIn() }}</strong></p>
      <div style="margin-top:8px;display:flex;gap:8px">
        <button (click)="isLoggedIn.set(true)" style="padding:6px 12px;background:#4caf50;color:#fff;border:none;border-radius:4px;cursor:pointer">Login</button>
        <button (click)="isLoggedIn.set(false)" style="padding:6px 12px;background:#f44336;color:#fff;border:none;border-radius:4px;cursor:pointer">Logout</button>
        <button (click)="check()" style="padding:6px 12px;background:#2196f3;color:#fff;border:none;border-radius:4px;cursor:pointer">Check Guard</button>
      </div>
      @if (guardResult()) {
        <p [style.color]="isLoggedIn() ? '#388e3c' : '#c62828'" style="margin-top:8px;font-weight:bold">
          {{ isLoggedIn() ? '✓ Guard passes — welcome!' : '✗ Guard blocks — redirecting to /login' }}
        </p>
      }
    </div>
  `
})
class Ex04 {
  isLoggedIn = signal(false);
  guardResult = signal(false);
  check() { this.guardResult.set(true); setTimeout(() => this.guardResult.set(false), 2500); }
}

// 5. CanActivateFn redirect to /login — code display (UrlTree)
@Component({
  selector: 'ex-05', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
import {{ '{' }} CanActivateFn, Router {{ '}' }} from '@angular/router';
import {{ '{' }} inject {{ '}' }} from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {{ '{' }}
  const router = inject(Router);
  const isLoggedIn = inject(AuthService).isLoggedIn();

  if (isLoggedIn) return true;

  // Returns a UrlTree — Angular navigates there instead
  return router.createUrlTree(['/login'], {{ '{' }}
    queryParams: {{ '{' }} returnUrl: state.url {{ '}' }}
  {{ '}' }});
{{ '}' }};
    </pre>
  `
})
class Ex05 {}

// 6. CanDeactivateFn always true — code display
@Component({
  selector: 'ex-06', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
import {{ '{' }} CanDeactivateFn {{ '}' }} from '@angular/router';

// Always allows leaving the route
export const alwaysLeaveGuard: CanDeactivateFn&lt;unknown&gt; =
  (component, currentRoute, currentState, nextState) => {{ '{' }}
    return true;
  {{ '}' }};

// In route config:
// {{ '{' }} path: 'edit', component: EditComponent, canDeactivate: [alwaysLeaveGuard] {{ '}' }}
    </pre>
  `
})
class Ex06 {}

// 7. CanDeactivateFn with confirm() — signal-based confirmation demo
@Component({
  selector: 'ex-07', standalone: true,
  template: `
    <div style="padding:10px;border:1px solid #ff9800;border-radius:6px">
      <p style="margin:0">Simulates <code>CanDeactivateFn</code> using a confirm dialog.</p>
      <p style="font-size:13px;color:#555">hasUnsavedChanges = <strong>{{ hasChanges() }}</strong></p>
      <div style="display:flex;gap:8px;margin-top:8px">
        <button (click)="hasChanges.set(true)" style="padding:6px 12px;background:#ff9800;color:#fff;border:none;border-radius:4px;cursor:pointer">Make Changes</button>
        <button (click)="tryLeave()" style="padding:6px 12px;background:#607d8b;color:#fff;border:none;border-radius:4px;cursor:pointer">Try Navigate Away</button>
      </div>
      @if (message()) {
        <p style="margin-top:8px;font-weight:bold;color:#555">{{ message() }}</p>
      }
    </div>
  `
})
class Ex07 {
  hasChanges = signal(false);
  message = signal('');
  tryLeave() {
    if (this.hasChanges()) {
      const ok = window.confirm('You have unsaved changes. Leave anyway?');
      this.message.set(ok ? 'Guard returned true — navigating away.' : 'Guard returned false — staying on page.');
      if (ok) this.hasChanges.set(false);
    } else {
      this.message.set('No changes — guard returns true immediately.');
    }
    setTimeout(() => this.message.set(''), 3000);
  }
}

// 8. CanDeactivateFn checking form.dirty signal
@Component({
  selector: 'ex-08', standalone: true,
  template: `
    <div style="padding:10px;border:1px solid #9c27b0;border-radius:6px">
      <p style="margin:0;font-weight:bold">Form dirty guard demo</p>
      <input (input)="isDirty.set(true)" placeholder="Type something..." style="margin-top:8px;padding:6px;border:1px solid #ccc;border-radius:4px;width:100%;box-sizing:border-box">
      <p style="font-size:13px;margin-top:6px">form.isDirty = <strong [style.color]="isDirty() ? '#c62828' : '#388e3c'">{{ isDirty() }}</strong></p>
      <pre style="background:#f5f5f5;font-size:11px;padding:8px;border-radius:4px;margin-top:8px">
canDeactivate: (component) => {{ '{' }}
  return !component.form.isDirty() ||
    confirm('Unsaved changes. Leave?');
{{ '}' }}
      </pre>
      <button (click)="isDirty.set(false)" style="padding:4px 10px;background:#9c27b0;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px">Save &amp; Reset</button>
    </div>
  `
})
class Ex08 {
  isDirty = signal(false);
}

// 9. CanMatchFn basic gate — code display
@Component({
  selector: 'ex-09', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
import {{ '{' }} CanMatchFn {{ '}' }} from '@angular/router';
import {{ '{' }} inject {{ '}' }} from '@angular/core';

// CanMatchFn controls whether a route definition is
// even considered during URL matching (before activation)
export const featureMatchGuard: CanMatchFn = (route, segments) => {{ '{' }}
  const featureService = inject(FeatureService);
  return featureService.isEnabled('new-dashboard');
{{ '}' }};

// Route config:
// {{ '{' }} path: 'dashboard', canMatch: [featureMatchGuard], loadComponent: () => import('./new-dashboard') {{ '}' }},
// {{ '{' }} path: 'dashboard', loadComponent: () => import('./old-dashboard') {{ '}' }}  // fallback
    </pre>
  `
})
class Ex09 {}

// 10. ResolveFn returning static data — code display
@Component({
  selector: 'ex-10', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
import {{ '{' }} ResolveFn {{ '}' }} from '@angular/router';

// ResolveFn pre-fetches data before the component activates
export const userResolver: ResolveFn&lt;User&gt; = (route, state) => {{ '{' }}
  // Return static data (or inject a service for real data)
  return {{ '{' }} id: 1, name: 'Alice', role: 'admin' {{ '}' }};
{{ '}' }};

// Route config:
// {{ '{' }} path: 'profile', resolve: {{ '{' }} user: userResolver {{ '}' }}, component: ProfileComponent {{ '}' }}

// In component:
// route.data['user'] // {{ '{' }} id: 1, name: 'Alice', role: 'admin' {{ '}' }}
    </pre>
  `
})
class Ex10 {}

// 11. Guard using inject(Router) — code display
@Component({
  selector: 'ex-11', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
import {{ '{' }} CanActivateFn, Router {{ '}' }} from '@angular/router';
import {{ '{' }} inject {{ '}' }} from '@angular/core';

export const roleGuard: CanActivateFn = (route) => {{ '{' }}
  const router = inject(Router);
  const authService = inject(AuthService);
  const requiredRole = route.data['role'] as string;

  if (authService.hasRole(requiredRole)) {{ '{' }}
    return true;
  {{ '}' }}

  // Use inject(Router) to navigate programmatically
  return router.createUrlTree(['/unauthorized']);
{{ '}' }};
    </pre>
  `
})
class Ex11 {}

// 12. Guard returning boolean from signal
@Component({
  selector: 'ex-12', standalone: true,
  template: `
    <div style="padding:10px;border:1px solid #00bcd4;border-radius:6px">
      <p style="margin:0;font-weight:bold">Guard returns signal value directly</p>
      <pre style="background:#f5f5f5;font-size:11px;padding:8px;border-radius:4px;margin-top:8px">
const isLoggedIn = signal(false);

export const signalGuard: CanActivateFn = () => {{ '{' }}
  return isLoggedIn(); // read signal value
{{ '}' }};
      </pre>
      <p style="font-size:13px;margin-top:6px">Current signal value: <strong [style.color]="isLoggedIn() ? '#388e3c' : '#c62828'">{{ isLoggedIn() }}</strong></p>
      <div style="display:flex;gap:8px">
        <button (click)="isLoggedIn.set(true)" style="padding:4px 10px;background:#4caf50;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px">Set true</button>
        <button (click)="isLoggedIn.set(false)" style="padding:4px 10px;background:#f44336;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px">Set false</button>
      </div>
    </div>
  `
})
class Ex12 {
  isLoggedIn = signal(false);
}

// 13. Guard code pattern — full example in <pre>
@Component({
  selector: 'ex-13', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Full guard pattern — auth + role + redirect
import {{ '{' }} CanActivateFn, Router, ActivatedRouteSnapshot {{ '}' }} from '@angular/router';
import {{ '{' }} inject {{ '}' }} from '@angular/core';

export const fullGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state) => {{ '{' }}
  const router   = inject(Router);
  const auth     = inject(AuthService);
  const required = route.data['roles'] as string[];

  if (!auth.isLoggedIn()) {{ '{' }}
    return router.createUrlTree(['/login'], {{ '{' }} queryParams: {{ '{' }} returnUrl: state.url {{ '}' }} {{ '}' }});
  {{ '}' }}

  if (required?.length && !required.some(r => auth.hasRole(r))) {{ '{' }}
    return router.createUrlTree(['/forbidden']);
  {{ '}' }}

  return true;
{{ '}' }};

// Usage:
// {{ '{' }} path: 'admin', canActivate: [fullGuard], data: {{ '{' }} roles: ['admin'] {{ '}' }} {{ '}' }}
    </pre>
  `
})
class Ex13 {}

// ─── INTERMEDIATE (14–26) ───────────────────────────────────

// 14. Auth guard with token signal — demo with login/logout toggle
@Component({
  selector: 'ex-14', standalone: true,
  template: `
    <div style="padding:10px;border:1px solid #3f51b5;border-radius:6px">
      <p style="margin:0;font-weight:bold">Auth Guard — Token Signal Demo</p>
      <p style="font-size:13px;margin-top:6px">token = <code>{{ token() || 'null' }}</code></p>
      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
        <button (click)="login()" style="padding:6px 12px;background:#3f51b5;color:#fff;border:none;border-radius:4px;cursor:pointer">Login (set token)</button>
        <button (click)="token.set(null)" style="padding:6px 12px;background:#f44336;color:#fff;border:none;border-radius:4px;cursor:pointer">Logout</button>
        <button (click)="navigate()" style="padding:6px 12px;background:#607d8b;color:#fff;border:none;border-radius:4px;cursor:pointer">Navigate to /dashboard</button>
      </div>
      @if (navResult()) {
        <p [style.color]="token() ? '#388e3c' : '#c62828'" style="margin-top:8px;font-weight:bold">{{ navResult() }}</p>
      }
    </div>
  `
})
class Ex14 {
  token = signal<string | null>(null);
  navResult = signal('');
  login() { this.token.set('eyJhbGciOiJIUzI1NiJ9.abc123'); }
  navigate() {
    this.navResult.set(this.token() ? '✓ Token found — /dashboard activated' : '✗ No token — redirecting to /login');
    setTimeout(() => this.navResult.set(''), 2500);
  }
}

// 15. Role guard checking user.role signal — admin/user demo
@Component({
  selector: 'ex-15', standalone: true,
  template: `
    <div style="padding:10px;border:1px solid #ff5722;border-radius:6px">
      <p style="margin:0;font-weight:bold">Role Guard Demo</p>
      <p style="font-size:13px;margin-top:6px">Current role: <strong>{{ role() }}</strong></p>
      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
        <button (click)="role.set('admin')" style="padding:5px 10px;background:#ff5722;color:#fff;border:none;border-radius:4px;cursor:pointer">Set Admin</button>
        <button (click)="role.set('user')" style="padding:5px 10px;background:#607d8b;color:#fff;border:none;border-radius:4px;cursor:pointer">Set User</button>
        <button (click)="check('admin')" style="padding:5px 10px;background:#333;color:#fff;border:none;border-radius:4px;cursor:pointer">Check /admin route</button>
      </div>
      @if (result()) {
        <p [style.color]="role() === 'admin' ? '#388e3c' : '#c62828'" style="margin-top:8px;font-weight:bold">{{ result() }}</p>
      }
    </div>
  `
})
class Ex15 {
  role = signal('user');
  result = signal('');
  check(required: string) {
    this.result.set(this.role() === required ? `✓ Role '${required}' confirmed — access granted` : `✗ Role '${this.role()}' insufficient — redirecting to /forbidden`);
    setTimeout(() => this.result.set(''), 2500);
  }
}

// 16. Feature flag guard — isFeatureEnabled signal
@Component({
  selector: 'ex-16', standalone: true,
  template: `
    <div style="padding:10px;border:1px solid #009688;border-radius:6px">
      <p style="margin:0;font-weight:bold">Feature Flag Guard</p>
      <p style="font-size:13px;margin-top:6px">Feature "new-dashboard" enabled: <strong [style.color]="enabled() ? '#388e3c' : '#c62828'">{{ enabled() }}</strong></p>
      <div style="display:flex;gap:8px;margin-top:8px">
        <button (click)="enabled.set(!enabled())" style="padding:6px 12px;background:#009688;color:#fff;border:none;border-radius:4px;cursor:pointer">Toggle Feature Flag</button>
        <button (click)="tryRoute()" style="padding:6px 12px;background:#607d8b;color:#fff;border:none;border-radius:4px;cursor:pointer">Navigate to /new-dashboard</button>
      </div>
      @if (msg()) {
        <p [style.color]="enabled() ? '#388e3c' : '#c62828'" style="margin-top:8px;font-weight:bold">{{ msg() }}</p>
      }
    </div>
  `
})
class Ex16 {
  enabled = signal(false);
  msg = signal('');
  tryRoute() {
    this.msg.set(this.enabled() ? '✓ Feature enabled — new dashboard loaded' : '✗ Feature disabled — falling back to old dashboard');
    setTimeout(() => this.msg.set(''), 2500);
  }
}

// 17. Admin-only guard — redirect if not admin
@Component({
  selector: 'ex-17', standalone: true,
  template: `
    <div style="padding:10px;border:1px solid #e91e63;border-radius:6px">
      <p style="margin:0;font-weight:bold">Admin-Only Guard</p>
      <pre style="background:#f5f5f5;font-size:11px;padding:8px;border-radius:4px;margin-top:8px">
export const adminGuard: CanActivateFn = () => {{ '{' }}
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.role() === 'admin'
    ? true
    : router.createUrlTree(['/forbidden']);
{{ '}' }};
      </pre>
      <p style="font-size:13px;color:#555">Only users with role === 'admin' can activate the route. All others are redirected to /forbidden.</p>
    </div>
  `
})
class Ex17 {}

// 18. Guest-only guard — redirect if already logged in
@Component({
  selector: 'ex-18', standalone: true,
  template: `
    <div style="padding:10px;border:1px solid #795548;border-radius:6px">
      <p style="margin:0;font-weight:bold">Guest-Only Guard (e.g., /login page)</p>
      <pre style="background:#f5f5f5;font-size:11px;padding:8px;border-radius:4px;margin-top:8px">
// Redirect to /home if already authenticated
export const guestGuard: CanActivateFn = () => {{ '{' }}
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isLoggedIn()
    ? router.createUrlTree(['/home'])  // already in — go home
    : true;                            // not logged in — show login
{{ '}' }};
      </pre>
    </div>
  `
})
class Ex18 {}

// 19. Unsaved changes guard — form.isDirty signal demo
@Component({
  selector: 'ex-19', standalone: true,
  template: `
    <div style="padding:10px;border:1px solid #ff9800;border-radius:6px">
      <p style="margin:0;font-weight:bold">Unsaved Changes Guard</p>
      <textarea (input)="dirty.set(true)" placeholder="Edit something..." style="width:100%;margin-top:8px;padding:6px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box;height:60px"></textarea>
      <p style="font-size:13px">isDirty signal: <strong [style.color]="dirty() ? '#c62828' : '#388e3c'">{{ dirty() }}</strong></p>
      <div style="display:flex;gap:8px">
        <button (click)="trySave()" style="padding:5px 10px;background:#4caf50;color:#fff;border:none;border-radius:4px;cursor:pointer">Save</button>
        <button (click)="tryLeave()" style="padding:5px 10px;background:#ff9800;color:#fff;border:none;border-radius:4px;cursor:pointer">Leave page</button>
      </div>
      @if (msg()) { <p style="margin-top:8px;font-weight:bold;color:#555">{{ msg() }}</p> }
    </div>
  `
})
class Ex19 {
  dirty = signal(false);
  msg = signal('');
  trySave() { this.dirty.set(false); this.msg.set('Saved! Guard now returns true.'); setTimeout(() => this.msg.set(''), 2000); }
  tryLeave() {
    if (this.dirty()) {
      const ok = window.confirm('Unsaved changes! Leave anyway?');
      this.msg.set(ok ? 'Leaving page...' : 'Stayed on page.');
    } else {
      this.msg.set('No changes — canDeactivate returns true.');
    }
    setTimeout(() => this.msg.set(''), 2000);
  }
}

// 20. Data resolver with simulated delay — loading state demo
@Component({
  selector: 'ex-20', standalone: true,
  template: `
    <div style="padding:10px;border:1px solid #2196f3;border-radius:6px">
      <p style="margin:0;font-weight:bold">Resolver with Simulated Delay</p>
      <button (click)="resolve()" style="margin-top:8px;padding:6px 12px;background:#2196f3;color:#fff;border:none;border-radius:4px;cursor:pointer">Simulate Route Activation</button>
      @if (loading()) {
        <p style="margin-top:8px;color:#1565c0">⏳ Resolver fetching data...</p>
      }
      @if (data()) {
        <pre style="background:#e3f2fd;font-size:12px;padding:8px;border-radius:4px;margin-top:8px">{{ data() }}</pre>
      }
    </div>
  `
})
class Ex20 {
  loading = signal(false);
  data = signal('');
  resolve() {
    this.loading.set(true);
    this.data.set('');
    setTimeout(() => {
      this.loading.set(false);
      this.data.set(JSON.stringify({ id: 42, name: 'Alice', role: 'admin' }, null, 2));
    }, 1500);
  }
}

// 21. Resolver with catchError fallback — error handling demo
@Component({
  selector: 'ex-21', standalone: true,
  template: `
    <div style="padding:10px;border:1px solid #f44336;border-radius:6px">
      <p style="margin:0;font-weight:bold">Resolver with Error Fallback</p>
      <pre style="background:#f5f5f5;font-size:11px;padding:8px;border-radius:4px;margin-top:8px">
export const safeResolver: ResolveFn&lt;User | null&gt; = (route) => {{ '{' }}
  return inject(UserService).getUser(route.params['id']).pipe(
    catchError(err => {{ '{' }}
      console.error('Resolver failed:', err);
      return of(null); // fallback: navigate with null data
    {{ '}' }})
  );
{{ '}' }};
      </pre>
      <button (click)="simulate()" style="margin-top:8px;padding:6px 12px;background:#f44336;color:#fff;border:none;border-radius:4px;cursor:pointer">Simulate Error</button>
      @if (msg()) { <p style="margin-top:8px;font-weight:bold;color:#c62828">{{ msg() }}</p> }
    </div>
  `
})
class Ex21 {
  msg = signal('');
  simulate() {
    this.msg.set('⚠ HTTP 404 — resolver caught error, returned null fallback.');
    setTimeout(() => this.msg.set(''), 2500);
  }
}

// 22. Resolver with forkJoin — multiple data sources
@Component({
  selector: 'ex-22', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
import {{ '{' }} forkJoin {{ '}' }} from 'rxjs';

// Resolve multiple observables in parallel before activation
export const dashboardResolver: ResolveFn&lt;DashboardData&gt; =
  (route) => {{ '{' }}
    const users    = inject(UserService).getAll();
    const products = inject(ProductService).getAll();
    const stats    = inject(StatsService).getSummary();

    return forkJoin({{ '{' }} users, products, stats {{ '}' }});
    // Result: {{ '{' }} users: [...], products: [...], stats: {{ '{' }}...{{ '}' }} {{ '}' }}
  {{ '}' }};

// Route:
// {{ '{' }} path: 'dashboard', resolve: {{ '{' }} data: dashboardResolver {{ '}' }}, component: DashboardComponent {{ '}' }}
    </pre>
  `
})
class Ex22 {}

// 23. CanActivateChild guard — code display
@Component({
  selector: 'ex-23', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// CanActivateChild runs for every child route activation
import {{ '{' }} CanActivateChildFn {{ '}' }} from '@angular/router';

export const childAuthGuard: CanActivateChildFn = (childRoute, state) => {{ '{' }}
  const auth = inject(AuthService);
  return auth.isLoggedIn()
    ? true
    : inject(Router).createUrlTree(['/login']);
{{ '}' }};

// Route config:
const routes = [
  {{ '{' }}
    path: 'admin',
    canActivateChild: [childAuthGuard],  // guards ALL children
    children: [
      {{ '{' }} path: 'users', component: UsersComponent {{ '}' }},
      {{ '{' }} path: 'posts', component: PostsComponent {{ '}' }},
    ]
  {{ '}' }}
];
    </pre>
  `
})
class Ex23 {}

// 24. CanMatchFn for lazy route gating — code display
@Component({
  selector: 'ex-24', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// CanMatchFn prevents route even being considered
// (useful for A/B testing or feature flags on lazy routes)
export const betaMatchGuard: CanMatchFn = (route, segments) => {{ '{' }}
  return inject(FeatureFlagService).isBetaUser();
{{ '}' }};

const routes: Routes = [
  // Beta users get new component
  {{ '{' }}
    path: 'products',
    canMatch: [betaMatchGuard],
    loadComponent: () => import('./products-v2.component')
  {{ '}' }},
  // Everyone else gets old component (fallback)
  {{ '{' }}
    path: 'products',
    loadComponent: () => import('./products.component')
  {{ '}' }}
];
    </pre>
  `
})
class Ex24 {}

// 25. Guard factory function — parametrized guard creator
@Component({
  selector: 'ex-25', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Factory function that creates a guard with a specific role
function requireRole(role: string): CanActivateFn {{ '{' }}
  return () => {{ '{' }}
    const auth   = inject(AuthService);
    const router = inject(Router);
    return auth.hasRole(role)
      ? true
      : router.createUrlTree(['/forbidden']);
  {{ '}' }};
{{ '}' }}

// Usage in routes:
const routes: Routes = [
  {{ '{' }} path: 'admin',    canActivate: [requireRole('admin')]   {{ '}' }},
  {{ '{' }} path: 'editor',   canActivate: [requireRole('editor')]  {{ '}' }},
  {{ '{' }} path: 'settings', canActivate: [requireRole('manager')] {{ '}' }},
];
    </pre>
  `
})
class Ex25 {}

// 26. Guard with analytics tracking side effect
@Component({
  selector: 'ex-26', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Guard that tracks route access attempts
export const analyticsGuard: CanActivateFn = (route, state) => {{ '{' }}
  const analytics = inject(AnalyticsService);
  const auth      = inject(AuthService);

  // Side effect: track every navigation attempt
  analytics.track('route_access_attempt', {{ '{' }}
    url:       state.url,
    userId:    auth.userId(),
    timestamp: Date.now(),
  {{ '}' }});

  if (!auth.isLoggedIn()) {{ '{' }}
    analytics.track('auth_redirect', {{ '{' }} from: state.url {{ '}' }});
    return inject(Router).createUrlTree(['/login']);
  {{ '}' }}

  return true;
{{ '}' }};
    </pre>
  `
})
class Ex26 {}

// ─── NESTED (27–38) ─────────────────────────────────────────

// 27. Auth guard + Role guard combined — code display
@Component({
  selector: 'ex-27', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Combining multiple guards on one route
// Angular runs them in order — first false/UrlTree wins

export const isAuthGuard: CanActivateFn = () =>
  inject(AuthService).isLoggedIn()
    || inject(Router).createUrlTree(['/login']);

export const isAdminGuard: CanActivateFn = () =>
  inject(AuthService).hasRole('admin')
    || inject(Router).createUrlTree(['/forbidden']);

// Route config — BOTH guards must pass:
{{ '{' }}
  path: 'admin-panel',
  canActivate: [isAuthGuard, isAdminGuard],
  component: AdminPanelComponent
{{ '}' }}
    </pre>
  `
})
class Ex27 {}

// 28. Guard + Resolver on same route — code display
@Component({
  selector: 'ex-28', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Guard runs FIRST. If it passes, resolver runs NEXT.
// Component activates only after both succeed.

const routes: Routes = [
  {{ '{' }}
    path: 'user/:id',
    canActivate: [authGuard],           // 1. Auth check
    resolve: {{ '{' }}
      user: userResolver,               // 2. Pre-fetch user data
      perms: permissionsResolver,       // 3. Pre-fetch permissions
    {{ '}' }},
    component: UserDetailComponent,     // 4. Component activates
  {{ '}' }}
];

// In UserDetailComponent:
// readonly data = inject(ActivatedRoute).data;
// readonly user = toSignal(this.data.pipe(map(d => d['user'])));
    </pre>
  `
})
class Ex28 {}

// 29. Guard with loading overlay signal
@Component({
  selector: 'ex-29', standalone: true,
  template: `
    <div style="padding:10px;border:1px solid #607d8b;border-radius:6px">
      <p style="margin:0;font-weight:bold">Guard with Loading Overlay</p>
      <button (click)="runGuard()" style="margin-top:8px;padding:6px 12px;background:#607d8b;color:#fff;border:none;border-radius:4px;cursor:pointer">Activate Route</button>
      @if (loading()) {
        <div style="margin-top:10px;padding:12px;background:rgba(0,0,0,0.7);color:#fff;border-radius:6px;text-align:center">
          ⏳ Checking permissions...
        </div>
      }
      @if (result()) {
        <p style="margin-top:8px;font-weight:bold;color:#388e3c">{{ result() }}</p>
      }
    </div>
  `
})
class Ex29 {
  loading = signal(false);
  result = signal('');
  runGuard() {
    this.loading.set(true);
    this.result.set('');
    setTimeout(() => {
      this.loading.set(false);
      this.result.set('✓ Guard passed — component activated');
      setTimeout(() => this.result.set(''), 2000);
    }, 1800);
  }
}

// 30. Guard with A/B test flag signal
@Component({
  selector: 'ex-30', standalone: true,
  template: `
    <div style="padding:10px;border:1px solid #673ab7;border-radius:6px">
      <p style="margin:0;font-weight:bold">A/B Test Guard via CanMatchFn</p>
      <p style="font-size:13px;margin-top:6px">Variant: <strong [style.color]="variant() === 'B' ? '#673ab7' : '#607d8b'">{{ variant() }}</strong></p>
      <button (click)="toggleVariant()" style="margin-top:8px;padding:6px 12px;background:#673ab7;color:#fff;border:none;border-radius:4px;cursor:pointer">Switch Variant</button>
      <p style="font-size:13px;margin-top:8px;color:#555">
        @if (variant() === 'B') {
          CanMatchFn returns true → loads <code>home-v2.component</code>
        } @else {
          CanMatchFn returns false → falls back to <code>home.component</code>
        }
      </p>
    </div>
  `
})
class Ex30 {
  variant = signal<'A' | 'B'>('A');
  toggleVariant() { this.variant.set(this.variant() === 'A' ? 'B' : 'A'); }
}

// 31. Resolver with cache (shareReplay) — code display
@Component({
  selector: 'ex-31', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
import {{ '{' }} shareReplay {{ '}' }} from 'rxjs/operators';

// Cache resolver result to avoid re-fetching on revisit
@Injectable({{ '{' }} providedIn: 'root' {{ '}' }})
export class UserCacheService {{ '{' }}
  private cache$: Observable&lt;User[]&gt; | null = null;

  getUsers(): Observable&lt;User[]&gt; {{ '{' }}
    if (!this.cache$) {{ '{' }}
      this.cache$ = this.http.get&lt;User[]&gt;('/api/users').pipe(
        shareReplay(1)  // cache latest emission
      );
    {{ '}' }}
    return this.cache$;
  {{ '}' }}
{{ '}' }}

export const usersResolver: ResolveFn&lt;User[]&gt; = () =>
  inject(UserCacheService).getUsers();
    </pre>
  `
})
class Ex31 {}

// 32. Resolver reading parent route data — code display
@Component({
  selector: 'ex-32', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Child resolver reading parent resolved data
export const commentResolver: ResolveFn&lt;Comment[]&gt; =
  (route, state) => {{ '{' }}
    // Access parent route's resolved data
    const postId = route.parent?.data['post']?.id;
    return inject(CommentService).getByPost(postId);
  {{ '}' }};

const routes: Routes = [
  {{ '{' }}
    path: 'post/:id',
    resolve: {{ '{' }} post: postResolver {{ '}' }},
    children: [
      {{ '{' }}
        path: 'comments',
        resolve: {{ '{' }} comments: commentResolver {{ '}' }},  // uses parent's post
        component: CommentsComponent
      {{ '}' }}
    ]
  {{ '}' }}
];
    </pre>
  `
})
class Ex32 {}

// 33. Guard hierarchy (parent + child) — code display
@Component({
  selector: 'ex-33', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Parent guard runs first, then child guard
const routes: Routes = [
  {{ '{' }}
    path: 'app',
    canActivate: [isAuthGuard],          // 1st: is user logged in?
    canActivateChild: [sessionGuard],    // 2nd: is session still valid?
    children: [
      {{ '{' }}
        path: 'admin',
        canActivate: [isAdminGuard],     // 3rd: is user admin?
        children: [
          {{ '{' }}
            path: 'users',
            canActivate: [superAdminGuard], // 4th: is super-admin?
            component: UsersComponent
          {{ '}' }}
        ]
      {{ '}' }}
    ]
  {{ '}' }}
];
// Order: isAuth → session → isAdmin → superAdmin
    </pre>
  `
})
class Ex33 {}

// 34. Multiple resolvers per route — code display
@Component({
  selector: 'ex-34', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Multiple resolvers run in PARALLEL (Promise.all behavior)
const routes: Routes = [
  {{ '{' }}
    path: 'dashboard',
    resolve: {{ '{' }}
      user:         userResolver,
      notifications: notificationResolver,
      stats:        statsResolver,
      config:       configResolver,
    {{ '}' }},
    component: DashboardComponent
  {{ '}' }}
];

// In DashboardComponent:
@Component({{ '{' }}...{{ '}' }})
class DashboardComponent {{ '{' }}
  private route = inject(ActivatedRoute);
  user          = toSignal(this.route.data.pipe(map(d => d['user'])));
  notifications = toSignal(this.route.data.pipe(map(d => d['notifications'])));
  stats         = toSignal(this.route.data.pipe(map(d => d['stats'])));
{{ '}' }}
    </pre>
  `
})
class Ex34 {}

// 35. Guard reading query params — code display
@Component({
  selector: 'ex-35', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Guard that reads query params (e.g., invite token)
export const inviteGuard: CanActivateFn = (route, state) => {{ '{' }}
  const token  = route.queryParams['token'];
  const router = inject(Router);

  if (!token) {{ '{' }}
    return router.createUrlTree(['/error'], {{ '{' }}
      queryParams: {{ '{' }} message: 'Invalid invite link' {{ '}' }}
    {{ '}' }});
  {{ '}' }}

  const inviteService = inject(InviteService);

  // Validate token — returns Observable&lt;boolean&gt;
  return inviteService.validateToken(token).pipe(
    map(valid => valid || router.createUrlTree(['/expired']))
  );
{{ '}' }};

// URL: /accept-invite?token=abc123
    </pre>
  `
})
class Ex35 {}

// 36. Guard with complex permission matrix signal
@Component({
  selector: 'ex-36', standalone: true,
  template: `
    <div style="padding:10px;border:1px solid #00897b;border-radius:6px">
      <p style="margin:0;font-weight:bold">Permission Matrix Guard</p>
      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
        @for (r of roles; track r) {
          <button (click)="role.set(r)" [style.background]="role() === r ? '#00897b' : '#ccc'" style="padding:5px 10px;color:#fff;border:none;border-radius:4px;cursor:pointer">{{ r }}</button>
        }
      </div>
      <p style="font-size:13px;margin-top:8px">Role <strong>{{ role() }}</strong> can access:</p>
      <ul style="margin:4px 0;padding-left:20px;font-size:13px">
        @for (route of accessibleRoutes(); track route) {
          <li style="color:#388e3c">✓ {{ route }}</li>
        }
      </ul>
    </div>
  `
})
class Ex36 {
  roles = ['guest', 'user', 'editor', 'admin'];
  role = signal('guest');
  permissions: Record<string, string[]> = {
    guest: ['/home', '/about'],
    user: ['/home', '/about', '/profile', '/dashboard'],
    editor: ['/home', '/about', '/profile', '/dashboard', '/editor', '/posts'],
    admin: ['/home', '/about', '/profile', '/dashboard', '/editor', '/posts', '/admin', '/users'],
  };
  accessibleRoutes = computed(() => this.permissions[this.role()] ?? []);
}

// 37. Resolver with optimistic data + background refresh
@Component({
  selector: 'ex-37', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Show cached data immediately, refresh in background
export const optimisticResolver: ResolveFn&lt;Post[]&gt; = (route) => {{ '{' }}
  const posts   = inject(PostService);
  const cache   = inject(CacheService);
  const cached  = cache.get&lt;Post[]&gt;('posts');

  if (cached) {{ '{' }}
    // Start background refresh (don't await)
    posts.getAll().subscribe(fresh => cache.set('posts', fresh));
    return cached; // resolve immediately with cached data
  {{ '}' }}

  // No cache — fetch and cache, then resolve
  return posts.getAll().pipe(
    tap(data => cache.set('posts', data))
  );
{{ '}' }};
    </pre>
  `
})
class Ex37 {}

// 38. Full auth flow: guard + redirect + resolver — code display
@Component({
  selector: 'ex-38', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Complete auth flow configuration
const routes: Routes = [
  {{ '{' }}
    path: 'login',
    canActivate: [guestGuard],         // redirect if already logged in
    component: LoginComponent
  {{ '}' }},
  {{ '{' }}
    path: 'dashboard',
    canActivate: [authGuard],          // redirect to login if not authed
    resolve: {{ '{' }}
      user:  userResolver,             // pre-fetch user profile
      notif: notificationResolver,     // pre-fetch notifications
    {{ '}' }},
    component: DashboardComponent
  {{ '}' }},
  {{ '{' }}
    path: 'admin',
    canActivate: [authGuard, adminGuard], // must be authed AND admin
    resolve: {{ '{' }} data: adminDataResolver {{ '}' }},
    component: AdminComponent
  {{ '}' }},
  {{ '{' }} path: '**', redirectTo: '/dashboard' {{ '}' }}
];
    </pre>
  `
})
class Ex38 {}

// ─── ADVANCED (39–50) ───────────────────────────────────────

// 39. Signal-based reactive auth guard — code display
@Component({
  selector: 'ex-39', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Fully signal-based auth service + guard
@Injectable({{ '{' }} providedIn: 'root' {{ '}' }})
export class AuthStore {{ '{' }}
  readonly token    = signal&lt;string | null&gt;(localStorage.getItem('token'));
  readonly isAuthed = computed(() => !!this.token());

  login(token: string) {{ '{' }} this.token.set(token); localStorage.setItem('token', token); {{ '}' }}
  logout()             {{ '{' }} this.token.set(null);  localStorage.removeItem('token');      {{ '}' }}
{{ '}' }}

export const signalAuthGuard: CanActivateFn = () => {{ '{' }}
  const store  = inject(AuthStore);
  const router = inject(Router);

  // Computed from signal — always up to date
  return store.isAuthed()
    ? true
    : router.createUrlTree(['/login']);
{{ '}' }};
    </pre>
  `
})
class Ex39 {}

// 40. Guard with RxJS Observable auth state — code display
@Component({
  selector: 'ex-40', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Guard returning Observable — Angular handles subscription
export const observableAuthGuard: CanActivateFn = (route, state) => {{ '{' }}
  const auth   = inject(AuthService);
  const router = inject(Router);

  return auth.user$.pipe(        // Observable&lt;User | null&gt;
    take(1),                     // complete after first emission
    map(user => {{ '{' }}
      if (user) return true;
      return router.createUrlTree(['/login'], {{ '{' }}
        queryParams: {{ '{' }} returnUrl: state.url {{ '}' }}
      {{ '}' }});
    {{ '}' }})
  );
{{ '}' }};

// auth.user$ could be a BehaviorSubject or toObservable(signal)
    </pre>
  `
})
class Ex40 {}

// 41. Guard that pre-fetches before allowing — code display
@Component({
  selector: 'ex-41', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Guard that validates AND pre-fetches data before continuing
export const prefetchGuard: CanActivateFn = (route) => {{ '{' }}
  const api    = inject(ApiService);
  const store  = inject(DataStore);
  const router = inject(Router);
  const id     = route.params['id'];

  return api.getItem(id).pipe(
    take(1),
    tap(item => store.setCurrentItem(item)),  // store before activating
    map(item => item
      ? true
      : router.createUrlTree(['/not-found'])
    ),
    catchError(() => of(router.createUrlTree(['/error'])))
  );
{{ '}' }};
// Component can synchronously read store.currentItem() on init
    </pre>
  `
})
class Ex41 {}

// 42. Guard with retry on service failure — code display
@Component({
  selector: 'ex-42', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
import {{ '{' }} retry, catchError {{ '}' }} from 'rxjs/operators';

// Guard retries the auth check up to 3 times before failing
export const resilientGuard: CanActivateFn = (route, state) => {{ '{' }}
  const auth   = inject(AuthService);
  const router = inject(Router);

  return auth.verifyToken().pipe(   // Observable&lt;boolean&gt;
    retry({{ '{' }} count: 3, delay: 1000 {{ '}' }}),  // retry 3x with 1s delay
    map(valid => valid
      ? true
      : router.createUrlTree(['/login'])
    ),
    catchError(() => {{ '{' }}
      // After 3 retries, treat as unauthorized
      return of(router.createUrlTree(['/login']));
    {{ '}' }})
  );
{{ '}' }};
    </pre>
  `
})
class Ex42 {}

// 43. Functional guard composition utility — code display
@Component({
  selector: 'ex-43', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Utility to compose guards with AND/OR logic
type GuardFn = CanActivateFn;

// All guards must pass (AND)
function allOf(...guards: GuardFn[]): CanActivateFn {{ '{' }}
  return (route, state) => {{ '{' }}
    const injector = inject(EnvironmentInjector);
    for (const guard of guards) {{ '{' }}
      const result = runInInjectionContext(injector, () => guard(route, state));
      if (result !== true) return result;
    {{ '}' }}
    return true;
  {{ '}' }};
{{ '}' }}

// Any guard passing is enough (OR)
function anyOf(...guards: GuardFn[]): CanActivateFn {{ '{' }}
  return (route, state) => {{ '{' }}
    const injector = inject(EnvironmentInjector);
    for (const guard of guards) {{ '{' }}
      const result = runInInjectionContext(injector, () => guard(route, state));
      if (result === true) return true;
    {{ '}' }}
    return inject(Router).createUrlTree(['/forbidden']);
  {{ '}' }};
{{ '}' }}

// Usage:
canActivate: [allOf(authGuard, anyOf(adminGuard, editorGuard))]
    </pre>
  `
})
class Ex43 {}

// 44. Guard with route-level error boundary — code display
@Component({
  selector: 'ex-44', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Guard that catches unexpected errors and routes to error page
export const safeGuard: CanActivateFn = (route, state) => {{ '{' }}
  const router = inject(Router);

  try {{ '{' }}
    const auth = inject(AuthService);
    if (!auth.isLoggedIn()) {{ '{' }}
      return router.createUrlTree(['/login']);
    {{ '}' }}

    const perms = inject(PermissionService);
    return perms.canAccess(route.data['resource']);

  {{ '}' }} catch (err) {{ '{' }}
    console.error('Guard threw:', err);
    return router.createUrlTree(['/error'], {{ '{' }}
      queryParams: {{ '{' }} code: 'GUARD_ERROR' {{ '}' }}
    {{ '}' }});
  {{ '}' }}
{{ '}' }};
    </pre>
  `
})
class Ex44 {}

// 45. Resolver with loading state broadcaster — code display
@Component({
  selector: 'ex-45', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Resolver that broadcasts loading state via a shared signal service
@Injectable({{ '{' }} providedIn: 'root' {{ '}' }})
export class LoadingService {{ '{' }}
  readonly isLoading = signal(false);
  show() {{ '{' }} this.isLoading.set(true);  {{ '}' }}
  hide() {{ '{' }} this.isLoading.set(false); {{ '}' }}
{{ '}' }}

export const loadingResolver: ResolveFn&lt;Data&gt; = (route) => {{ '{' }}
  const loading = inject(LoadingService);
  const api     = inject(ApiService);

  loading.show();

  return api.getData(route.params['id']).pipe(
    finalize(() => loading.hide()),  // always hide on complete/error
    take(1)
  );
{{ '}' }};
// AppComponent shows spinner based on loadingService.isLoading()
    </pre>
  `
})
class Ex45 {}

// 46. Interceptor + guard coordination (401 refresh) — code display
@Component({
  selector: 'ex-46', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// HttpInterceptor refreshes token on 401 — guard stays clean
export const tokenRefreshInterceptor: HttpInterceptorFn =
  (req, next) => {{ '{' }}
    const auth = inject(AuthService);

    return next(req).pipe(
      catchError(err => {{ '{' }}
        if (err.status === 401 && !req.url.includes('/refresh')) {{ '{' }}
          return auth.refreshToken().pipe(
            switchMap(newToken => {{ '{' }}
              auth.token.set(newToken);
              return next(req.clone({{ '{' }}
                setHeaders: {{ '{' }} Authorization: \`Bearer \${{ '{' }}newToken{{ '}' }}\` {{ '}' }}
              {{ '}' }}));
            {{ '}' }}),
            catchError(() => {{ '{' }}
              auth.logout();
              return EMPTY; // guard will block next navigation
            {{ '}' }})
          );
        {{ '}' }}
        return throwError(() => err);
      {{ '}' }})
    );
  {{ '}' }};
    </pre>
  `
})
class Ex46 {}

// 47. Guard unit-test-friendly factory — code display
@Component({
  selector: 'ex-47', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Testable guard via factory injection
export function createAuthGuard(
  authService: AuthService,
  router: Router
): CanActivateFn {{ '{' }}
  return (route, state) => {{ '{' }}
    return authService.isLoggedIn()
      ? true
      : router.createUrlTree(['/login']);
  {{ '}' }};
{{ '}' }}

// Provide in app:
// {{ '{' }} provide: AUTH_GUARD, useFactory: (a, r) => createAuthGuard(a, r),
//   deps: [AuthService, Router] {{ '}' }}

// In unit tests:
it('should redirect unauthenticated users', () => {{ '{' }}
  const mockAuth   = {{ '{' }} isLoggedIn: () => false {{ '}' }} as any;
  const mockRouter = {{ '{' }} createUrlTree: jasmine.createSpy() {{ '}' }} as any;
  const guard      = createAuthGuard(mockAuth, mockRouter);
  guard(mockRoute, mockState);
  expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login']);
{{ '}' }});
    </pre>
  `
})
class Ex47 {}

// 48. Guard with CanActivateChild vs CanActivate nesting — code display
@Component({
  selector: 'ex-48', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// CanActivate: runs when navigating TO the route
// CanActivateChild: runs when navigating TO any CHILD route

const routes: Routes = [
  {{ '{' }}
    path: 'admin',
    canActivate: [authGuard],         // runs when going to /admin itself
    canActivateChild: [sessionGuard], // runs for /admin/users, /admin/posts etc.
    component: AdminLayoutComponent,
    children: [
      {{ '{' }} path: 'users',  component: UsersComponent  {{ '}' }},
      {{ '{' }} path: 'posts',  component: PostsComponent  {{ '}' }},
      {{ '{' }} path: 'config', canActivate: [superAdminGuard], // extra guard for this child only
                component: ConfigComponent  {{ '}' }},
    ]
  {{ '}' }}
];

// Navigation to /admin        → authGuard runs
// Navigation to /admin/users  → authGuard + sessionGuard run
// Navigation to /admin/config → authGuard + sessionGuard + superAdminGuard run
    </pre>
  `
})
class Ex48 {}

// 49. Guard with navigationExtras.state passing data — code display
@Component({
  selector: 'ex-49', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Pass state data when redirecting from a guard
export const authGuardWithState: CanActivateFn = (route, state) => {{ '{' }}
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {{ '{' }}
    // Navigate to login AND pass state data
    router.navigate(['/login'], {{ '{' }}
      state: {{ '{' }}
        returnUrl:    state.url,
        reason:       'Session expired',
        attemptedAt:  Date.now(),
      {{ '}' }}
    {{ '}' }});
    return false;
  {{ '}' }}
  return true;
{{ '}' }};

// In LoginComponent:
// const nav = inject(Router);
// const state = nav.getCurrentNavigation()?.extras.state;
// const returnUrl = state?.['returnUrl'] ?? '/home';
    </pre>
  `
})
class Ex49 {}

// 50. Full protected app pattern: auth + role + resolver + redirect — code display
@Component({
  selector: 'ex-50', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Complete enterprise guard + resolver pattern
export const appRoutes: Routes = [
  // Public routes
  {{ '{' }} path: '',        redirectTo: 'home', pathMatch: 'full' {{ '}' }},
  {{ '{' }} path: 'home',    component: HomeComponent {{ '}' }},
  {{ '{' }} path: 'login',   canActivate: [guestGuard], component: LoginComponent {{ '}' }},
  {{ '{' }} path: 'signup',  canActivate: [guestGuard], component: SignupComponent {{ '}' }},

  // Authenticated routes
  {{ '{' }}
    path: 'app',
    canActivate: [authGuard],
    canActivateChild: [sessionGuard],
    resolve: {{ '{' }} config: appConfigResolver {{ '}' }},
    children: [
      {{ '{' }} path: 'dashboard', resolve: {{ '{' }} data: dashboardResolver {{ '}' }}, component: DashboardComponent {{ '}' }},
      {{ '{' }} path: 'profile',   resolve: {{ '{' }} user: userResolver {{ '}' }},      component: ProfileComponent    {{ '}' }},
      {{ '{' }}
        path: 'admin',
        canActivate: [requireRole('admin')],
        resolve: {{ '{' }} stats: adminStatsResolver {{ '}' }},
        children: [
          {{ '{' }} path: 'users',    component: UsersAdminComponent    {{ '}' }},
          {{ '{' }} path: 'settings', component: SettingsAdminComponent {{ '}' }},
        ]
      {{ '}' }},
    ]
  {{ '}' }},

  // Fallbacks
  {{ '{' }} path: 'login',        component: LoginComponent {{ '}' }},
  {{ '{' }} path: 'forbidden',    component: ForbiddenComponent {{ '}' }},
  {{ '{' }} path: 'not-found',    component: NotFoundComponent {{ '}' }},
  {{ '{' }} path: '**',           redirectTo: 'not-found' {{ '}' }},
];
    </pre>
  `
})
class Ex50 {}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Ex01, Ex02, Ex03, Ex04, Ex05, Ex06, Ex07, Ex08, Ex09, Ex10,
            Ex11, Ex12, Ex13, Ex14, Ex15, Ex16, Ex17, Ex18, Ex19, Ex20,
            Ex21, Ex22, Ex23, Ex24, Ex25, Ex26, Ex27, Ex28, Ex29, Ex30,
            Ex31, Ex32, Ex33, Ex34, Ex35, Ex36, Ex37, Ex38, Ex39, Ex40,
            Ex41, Ex42, Ex43, Ex44, Ex45, Ex46, Ex47, Ex48, Ex49, Ex50],
  template: `
    <div style="font-family:sans-serif;max-width:700px;margin:0 auto;padding:20px">
      <h1>Examples 6.3 — Route Guards</h1>
      <h4>1. CanActivateFn concept</h4><ex-01 /><hr />
      <h4>2. CanActivateFn returns true</h4><ex-02 /><hr />
      <h4>3. CanActivateFn returns false</h4><ex-03 /><hr />
      <h4>4. CanActivateFn with auth signal check</h4><ex-04 /><hr />
      <h4>5. CanActivateFn redirect to /login</h4><ex-05 /><hr />
      <h4>6. CanDeactivateFn always true</h4><ex-06 /><hr />
      <h4>7. CanDeactivateFn with confirm()</h4><ex-07 /><hr />
      <h4>8. CanDeactivateFn checking form.dirty signal</h4><ex-08 /><hr />
      <h4>9. CanMatchFn basic gate</h4><ex-09 /><hr />
      <h4>10. ResolveFn returning static data</h4><ex-10 /><hr />
      <h4>11. Guard using inject(Router)</h4><ex-11 /><hr />
      <h4>12. Guard returning boolean from signal</h4><ex-12 /><hr />
      <h4>13. Guard code pattern — full example</h4><ex-13 /><hr />
      <h4>14. Auth guard with token signal</h4><ex-14 /><hr />
      <h4>15. Role guard checking user.role signal</h4><ex-15 /><hr />
      <h4>16. Feature flag guard</h4><ex-16 /><hr />
      <h4>17. Admin-only guard</h4><ex-17 /><hr />
      <h4>18. Guest-only guard</h4><ex-18 /><hr />
      <h4>19. Unsaved changes guard</h4><ex-19 /><hr />
      <h4>20. Data resolver with simulated delay</h4><ex-20 /><hr />
      <h4>21. Resolver with catchError fallback</h4><ex-21 /><hr />
      <h4>22. Resolver with forkJoin</h4><ex-22 /><hr />
      <h4>23. CanActivateChild guard</h4><ex-23 /><hr />
      <h4>24. CanMatchFn for lazy route gating</h4><ex-24 /><hr />
      <h4>25. Guard factory function</h4><ex-25 /><hr />
      <h4>26. Guard with analytics tracking</h4><ex-26 /><hr />
      <h4>27. Auth guard + Role guard combined</h4><ex-27 /><hr />
      <h4>28. Guard + Resolver on same route</h4><ex-28 /><hr />
      <h4>29. Guard with loading overlay signal</h4><ex-29 /><hr />
      <h4>30. Guard with A/B test flag signal</h4><ex-30 /><hr />
      <h4>31. Resolver with cache (shareReplay)</h4><ex-31 /><hr />
      <h4>32. Resolver reading parent route data</h4><ex-32 /><hr />
      <h4>33. Guard hierarchy (parent + child)</h4><ex-33 /><hr />
      <h4>34. Multiple resolvers per route</h4><ex-34 /><hr />
      <h4>35. Guard reading query params</h4><ex-35 /><hr />
      <h4>36. Guard with complex permission matrix signal</h4><ex-36 /><hr />
      <h4>37. Resolver with optimistic data + background refresh</h4><ex-37 /><hr />
      <h4>38. Full auth flow: guard + redirect + resolver</h4><ex-38 /><hr />
      <h4>39. Signal-based reactive auth guard</h4><ex-39 /><hr />
      <h4>40. Guard with RxJS Observable auth state</h4><ex-40 /><hr />
      <h4>41. Guard that pre-fetches before allowing</h4><ex-41 /><hr />
      <h4>42. Guard with retry on service failure</h4><ex-42 /><hr />
      <h4>43. Functional guard composition utility</h4><ex-43 /><hr />
      <h4>44. Guard with route-level error boundary</h4><ex-44 /><hr />
      <h4>45. Resolver with loading state broadcaster</h4><ex-45 /><hr />
      <h4>46. Interceptor + guard coordination (401 refresh)</h4><ex-46 /><hr />
      <h4>47. Guard unit-test-friendly factory</h4><ex-47 /><hr />
      <h4>48. Guard with CanActivateChild vs CanActivate nesting</h4><ex-48 /><hr />
      <h4>49. Guard with navigationExtras.state passing data</h4><ex-49 /><hr />
      <h4>50. Full protected app pattern</h4><ex-50 /><hr />
    </div>
  `,
})
export class AppComponent {}
