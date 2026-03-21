import { Component, signal, computed } from '@angular/core';

// ============================================================
// Examples 6.4 — Lazy Loading (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ───────────────────────────────────────────

// 1. loadComponent syntax — code display
@Component({
  selector: 'ex-01', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// loadComponent lazily loads a standalone component
const routes: Routes = [
  {{ '{' }}
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.component')
        .then(m => m.DashboardComponent)
  {{ '}' }}
];
// The chunk is only downloaded when the user navigates to /dashboard
    </pre>
  `
})
class Ex01 {}

// 2. loadChildren with routes array — code display
@Component({
  selector: 'ex-02', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// loadChildren lazily loads an entire routes array (feature module)
const routes: Routes = [
  {{ '{' }}
    path: 'admin',
    loadChildren: () =>
      import('./admin/admin.routes')
        .then(m => m.ADMIN_ROUTES)
  {{ '}' }}
];

// admin.routes.ts:
export const ADMIN_ROUTES: Routes = [
  {{ '{' }} path: '',      component: AdminHomeComponent  {{ '}' }},
  {{ '{' }} path: 'users', component: AdminUsersComponent {{ '}' }},
];
    </pre>
  `
})
class Ex02 {}

// 3. Feature routes export pattern — code display
@Component({
  selector: 'ex-03', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Recommended pattern: named export from a routes file
// feature/feature.routes.ts
import {{ '{' }} Routes {{ '}' }} from '@angular/router';

export const FEATURE_ROUTES: Routes = [
  {{ '{' }} path: '',       component: FeatureHomeComponent  {{ '}' }},
  {{ '{' }} path: 'detail', component: FeatureDetailComponent {{ '}' }},
  {{ '{' }} path: 'edit',   component: FeatureEditComponent  {{ '}' }},
];

// app.routes.ts
const appRoutes: Routes = [
  {{ '{' }}
    path: 'feature',
    loadChildren: () =>
      import('./feature/feature.routes')
        .then(m => m.FEATURE_ROUTES)
  {{ '}' }}
];
    </pre>
  `
})
class Ex03 {}

// 4. Default export for lazy component — code display
@Component({
  selector: 'ex-04', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Using default export — no .then() needed
// home.component.ts
@Component({{ '{' }} selector: 'app-home', standalone: true, template: '...' {{ '}' }})
export default class HomeComponent {{ '{' }} {{ '}' }}

// app.routes.ts — shorthand with default export:
const routes: Routes = [
  {{ '{' }}
    path: 'home',
    loadComponent: () => import('./home/home.component')
    // Angular auto-uses the default export
  {{ '}' }}
];
    </pre>
  `
})
class Ex04 {}

// 5. Named export for lazy component — code display
@Component({
  selector: 'ex-05', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Named export — requires .then() to pick the class
// about.component.ts
@Component({{ '{' }} selector: 'app-about', standalone: true, template: '...' {{ '}' }})
export class AboutComponent {{ '{' }} {{ '}' }}  // named export

// app.routes.ts
const routes: Routes = [
  {{ '{' }}
    path: 'about',
    loadComponent: () =>
      import('./about/about.component')
        .then(m => m.AboutComponent)  // pick named export
  {{ '}' }}
];
    </pre>
  `
})
class Ex05 {}

// 6. Lazy loading simulation (dynamic import with signal)
@Component({
  selector: 'ex-06', standalone: true,
  template: `
    <div style="padding:10px;border:1px solid #2196f3;border-radius:6px">
      <p style="margin:0;font-weight:bold">Dynamic Import Simulation</p>
      <button (click)="load()" style="margin-top:8px;padding:6px 12px;background:#2196f3;color:#fff;border:none;border-radius:4px;cursor:pointer">Navigate to /dashboard</button>
      @if (loading()) {
        <p style="margin-top:8px;color:#1565c0">⏳ Downloading dashboard chunk...</p>
      }
      @if (loaded()) {
        <div style="margin-top:8px;padding:8px;background:#e3f2fd;border-radius:4px">
          <p style="margin:0;color:#1565c0;font-weight:bold">✓ dashboard.component chunk loaded (12.4 KB)</p>
          <p style="margin:4px 0 0;font-size:12px;color:#555">DashboardComponent activated</p>
        </div>
      }
    </div>
  `
})
class Ex06 {
  loading = signal(false);
  loaded = signal(false);
  load() {
    this.loading.set(true); this.loaded.set(false);
    setTimeout(() => { this.loading.set(false); this.loaded.set(true); }, 1200);
  }
}

// 7. Lazy route with title property — code display
@Component({
  selector: 'ex-07', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// title property sets the browser tab title on navigation
const routes: Routes = [
  {{ '{' }}
    path: 'products',
    title: 'Product Catalog',          // static string
    loadComponent: () => import('./products.component')
  {{ '}' }},
  {{ '{' }}
    path: 'product/:id',
    title: ProductTitleResolver,        // dynamic via resolver
    loadComponent: () => import('./product-detail.component')
  {{ '}' }},
];

// Dynamic title resolver:
export const ProductTitleResolver: ResolveFn&lt;string&gt; =
  (route) => inject(ProductService)
    .getById(route.params['id'])
    .pipe(map(p => p.name + ' — MyShop'));
    </pre>
  `
})
class Ex07 {}

// 8. Lazy route with data property — code display
@Component({
  selector: 'ex-08', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// data property passes static values to the activated component
const routes: Routes = [
  {{ '{' }}
    path: 'admin',
    data: {{ '{' }}
      breadcrumb: 'Admin Panel',
      requiredRole: 'admin',
      showSidebar: true,
    {{ '}' }},
    loadComponent: () => import('./admin.component')
  {{ '}' }}
];

// In AdminComponent:
// readonly route = inject(ActivatedRoute);
// readonly breadcrumb = toSignal(
//   this.route.data.pipe(map(d => d['breadcrumb']))
// );
    </pre>
  `
})
class Ex08 {}

// 9. Eager vs lazy comparison — explainer component
@Component({
  selector: 'ex-09', standalone: true,
  template: `
    <div style="padding:10px;border:1px solid #607d8b;border-radius:6px">
      <p style="margin:0;font-weight:bold">Eager vs Lazy Loading</p>
      <table style="width:100%;border-collapse:collapse;margin-top:10px;font-size:13px">
        <thead>
          <tr style="background:#607d8b;color:#fff">
            <th style="padding:6px 10px;text-align:left">Aspect</th>
            <th style="padding:6px 10px;text-align:left">Eager</th>
            <th style="padding:6px 10px;text-align:left">Lazy</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background:#f5f5f5"><td style="padding:6px 10px">Load time</td><td style="padding:6px 10px">At startup</td><td style="padding:6px 10px">On navigate</td></tr>
          <tr><td style="padding:6px 10px">Bundle</td><td style="padding:6px 10px">main.js</td><td style="padding:6px 10px">chunk-xxx.js</td></tr>
          <tr style="background:#f5f5f5"><td style="padding:6px 10px">Initial load</td><td style="padding:6px 10px">Slower</td><td style="padding:6px 10px">Faster</td></tr>
          <tr><td style="padding:6px 10px">Navigation</td><td style="padding:6px 10px">Instant</td><td style="padding:6px 10px">Slight delay</td></tr>
          <tr style="background:#f5f5f5"><td style="padding:6px 10px">Best for</td><td style="padding:6px 10px">Core routes</td><td style="padding:6px 10px">Feature routes</td></tr>
        </tbody>
      </table>
    </div>
  `
})
class Ex09 {}

// 10. Lazy loading indicator (isLoading signal)
@Component({
  selector: 'ex-10', standalone: true,
  template: `
    <div style="padding:10px;border:1px solid #9c27b0;border-radius:6px">
      <p style="margin:0;font-weight:bold">Router Loading Indicator</p>
      <pre style="background:#f5f5f5;font-size:11px;padding:8px;border-radius:4px;margin-top:8px">
// AppComponent listens to Router events
readonly isLoading = signal(false);
constructor() {{ '{' }}
  inject(Router).events.subscribe(event => {{ '{' }}
    if (event instanceof NavigationStart)  this.isLoading.set(true);
    if (event instanceof NavigationEnd)    this.isLoading.set(false);
    if (event instanceof NavigationCancel) this.isLoading.set(false);
    if (event instanceof NavigationError)  this.isLoading.set(false);
  {{ '}' }});
{{ '}' }}
      </pre>
      <button (click)="simulate()" style="margin-top:8px;padding:6px 12px;background:#9c27b0;color:#fff;border:none;border-radius:4px;cursor:pointer">Simulate Navigation</button>
      @if (loading()) {
        <div style="margin-top:8px;height:4px;background:#e1bee7;border-radius:2px;overflow:hidden">
          <div style="height:100%;width:60%;background:#9c27b0;animation:slide 1s infinite"></div>
        </div>
      }
    </div>
    <style>@keyframes slide {{ '{' }} 0%{{ '{' }}transform:translateX(-100%){{ '}' }} 100%{{ '{' }}transform:translateX(300%){{ '}' }} {{ '}' }}</style>
  `
})
class Ex10 {
  loading = signal(false);
  simulate() {
    this.loading.set(true);
    setTimeout(() => this.loading.set(false), 1500);
  }
}

// 11. Lazy error simulation (catch on import)
@Component({
  selector: 'ex-11', standalone: true,
  template: `
    <div style="padding:10px;border:1px solid #f44336;border-radius:6px">
      <p style="margin:0;font-weight:bold">Lazy Load Error Handling</p>
      <pre style="background:#f5f5f5;font-size:11px;padding:8px;border-radius:4px;margin-top:8px">
{{ '{' }}
  path: 'dashboard',
  loadComponent: () =>
    import('./dashboard.component')
      .catch(err => {{ '{' }}
        console.error('Failed to load chunk:', err);
        // Redirect to error page or show fallback
        return import('./error-fallback.component');
      {{ '}' }})
{{ '}' }}
      </pre>
      <button (click)="simulate()" style="margin-top:8px;padding:6px 12px;background:#f44336;color:#fff;border:none;border-radius:4px;cursor:pointer">Simulate Chunk Error</button>
      @if (error()) { <p style="margin-top:8px;color:#c62828;font-weight:bold">✗ ChunkLoadError — loaded fallback component</p> }
    </div>
  `
})
class Ex11 {
  error = signal(false);
  simulate() { this.error.set(true); setTimeout(() => this.error.set(false), 2500); }
}

// 12. Basic lazy route config structure — code display
@Component({
  selector: 'ex-12', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Minimal lazy route configuration
import {{ '{' }} Routes {{ '}' }} from '@angular/router';

export const routes: Routes = [
  {{ '{' }} path: '',        redirectTo: 'home', pathMatch: 'full' {{ '}' }},
  {{ '{' }} path: 'home',    loadComponent: () => import('./home.component')       {{ '}' }},
  {{ '{' }} path: 'about',   loadComponent: () => import('./about.component')      {{ '}' }},
  {{ '{' }} path: 'contact', loadComponent: () => import('./contact.component')    {{ '}' }},
  {{ '{' }} path: 'blog',    loadChildren: () => import('./blog/blog.routes')
                               .then(m => m.BLOG_ROUTES) {{ '}' }},
  {{ '{' }} path: '**',      loadComponent: () => import('./not-found.component')  {{ '}' }},
];
    </pre>
  `
})
class Ex12 {}

// 13. Lazy component minimal example — code display
@Component({
  selector: 'ex-13', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Minimal standalone component suitable for lazy loading
import {{ '{' }} Component {{ '}' }} from '@angular/core';

@Component({{ '{' }}
  selector: 'app-products',
  standalone: true,
  imports: [],
  template: \`&lt;h2&gt;Products&lt;/h2&gt;\`,
{{ '}' }})
export default class ProductsComponent {{ '{' }} {{ '}' }}

// Route:
// {{ '{' }} path: 'products', loadComponent: () => import('./products.component') {{ '}' }}
// ↑ Angular detects the default export automatically
    </pre>
  `
})
class Ex13 {}

// ─── INTERMEDIATE (14–26) ───────────────────────────────────

// 14. Lazy feature with nested children routes — code display
@Component({
  selector: 'ex-14', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// blog/blog.routes.ts — lazy feature with children
export const BLOG_ROUTES: Routes = [
  {{ '{' }}
    path: '',
    component: BlogLayoutComponent,
    children: [
      {{ '{' }} path: '',           component: BlogListComponent   {{ '}' }},
      {{ '{' }} path: ':slug',      component: BlogPostComponent   {{ '}' }},
      {{ '{' }} path: ':slug/edit', component: BlogEditComponent,
                canActivate: [authGuard]                        {{ '}' }},
    ]
  {{ '}' }}
];

// app.routes.ts:
{{ '{' }} path: 'blog', loadChildren: () => import('./blog/blog.routes')
               .then(m => m.BLOG_ROUTES) {{ '}' }}
    </pre>
  `
})
class Ex14 {}

// 15. PreloadAllModules strategy — code display
@Component({
  selector: 'ex-15', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// PreloadAllModules: loads all lazy chunks after initial page load
import {{ '{' }} provideRouter, withPreloading, PreloadAllModules {{ '}' }} from '@angular/router';

// app.config.ts
export const appConfig: ApplicationConfig = {{ '{' }}
  providers: [
    provideRouter(
      routes,
      withPreloading(PreloadAllModules)  // ← preloads all lazy chunks
    ),
  ]
{{ '}' }};

// Behavior:
// 1. App loads → main bundle executes
// 2. User sees home page
// 3. Browser idles → Angular preloads ALL lazy chunks in background
// 4. Navigation to lazy route is now instant
    </pre>
  `
})
class Ex15 {}

// 16. NoPreloading strategy — code display
@Component({
  selector: 'ex-16', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// NoPreloading (default): chunks only load on demand
import {{ '{' }} provideRouter, withPreloading, NoPreloading {{ '}' }} from '@angular/router';

export const appConfig: ApplicationConfig = {{ '{' }}
  providers: [
    provideRouter(
      routes,
      withPreloading(NoPreloading)  // ← default, explicit opt-in
    ),
  ]
{{ '}' }};

// Use when:
// - App has many rarely-visited routes
// - Users are on slow/metered connections
// - You want full control with a custom strategy
    </pre>
  `
})
class Ex16 {}

// 17. Custom selective preload strategy — class code display
@Component({
  selector: 'ex-17', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Preload only routes marked with data.preload = true
import {{ '{' }} PreloadingStrategy, Route {{ '}' }} from '@angular/router';
import {{ '{' }} Observable, of {{ '}' }} from 'rxjs';

@Injectable({{ '{' }} providedIn: 'root' {{ '}' }})
export class SelectivePreloadStrategy implements PreloadingStrategy {{ '{' }}
  preload(route: Route, load: () => Observable&lt;any&gt;): Observable&lt;any&gt; {{ '{' }}
    return route.data?.['preload'] === true ? load() : of(null);
  {{ '}' }}
{{ '}' }}

// In routes:
{{ '{' }} path: 'dashboard', data: {{ '{' }} preload: true  {{ '}' }}, loadComponent: () => import('./dashboard') {{ '}' }},
{{ '{' }} path: 'settings',  data: {{ '{' }} preload: false {{ '}' }}, loadComponent: () => import('./settings')  {{ '}' }},

// In config:
withPreloading(SelectivePreloadStrategy)
    </pre>
  `
})
class Ex17 {}

// 18. Lazy with canActivate guard — code display
@Component({
  selector: 'ex-18', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Guard runs BEFORE the lazy chunk is downloaded
// (chunk is only fetched if guard passes)
const routes: Routes = [
  {{ '{' }}
    path: 'admin',
    canActivate: [authGuard, adminGuard],  // evaluated first
    loadComponent: () =>                   // then chunk loads
      import('./admin/admin.component')
  {{ '}' }},
  {{ '{' }}
    path: 'billing',
    canActivate: [authGuard, billingGuard],
    loadChildren: () =>
      import('./billing/billing.routes').then(m => m.BILLING_ROUTES)
  {{ '}' }}
];
// Unauthenticated users never trigger the dynamic import
    </pre>
  `
})
class Ex18 {}

// 19. Lazy with resolver — code display
@Component({
  selector: 'ex-19', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Combining lazy loading with a resolver
const routes: Routes = [
  {{ '{' }}
    path: 'user/:id',
    loadComponent: () =>
      import('./user-detail/user-detail.component'),
    resolve: {{ '{' }}
      user: userResolver,     // runs after chunk loads, before activation
    {{ '}' }},
    canActivate: [authGuard], // runs before chunk loads
  {{ '}' }}
];

// Timeline:
// 1. Guard runs → passes
// 2. Chunk downloads (user-detail chunk)
// 3. Resolver runs → fetches user data
// 4. Component activates with resolved data
    </pre>
  `
))
class Ex19 {}

// 20. Lazy with component-level providers — code display
@Component({
  selector: 'ex-20', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Lazy route with its own service providers (scoped to route)
const routes: Routes = [
  {{ '{' }}
    path: 'checkout',
    loadComponent: () => import('./checkout.component'),
    providers: [
      CheckoutService,          // scoped to this route subtree
      PaymentService,
      {{ '{' }} provide: CART_TOKEN, useClass: CartService {{ '}' }},
    ]
  {{ '}' }}
];

// Providers are destroyed when user leaves the route
// Perfect for feature-scoped state management
    </pre>
  `
})
class Ex20 {}

// 21. Dynamic import with condition — code display
@Component({
  selector: 'ex-21', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Conditionally load different components (e.g., mobile vs desktop)
const routes: Routes = [
  {{ '{' }}
    path: 'home',
    loadComponent: () => {{ '{' }}
      const isMobile = window.innerWidth &lt; 768;
      return isMobile
        ? import('./home-mobile.component')
        : import('./home-desktop.component');
    {{ '}' }}
  {{ '}' }}
];

// Or via CanMatchFn with two route definitions:
{{ '{' }} path: 'home', canMatch: [mobileGuard], loadComponent: () => import('./home-mobile') {{ '}' }},
{{ '{' }} path: 'home',                          loadComponent: () => import('./home-desktop') {{ '}' }},
    </pre>
  `
})
class Ex21 {}

// 22. Prefetch on hover — mouseenter trigger simulation
@Component({
  selector: 'ex-22', standalone: true,
  template: `
    <div style="padding:10px;border:1px solid #ff9800;border-radius:6px">
      <p style="margin:0;font-weight:bold">Prefetch on Hover</p>
      <p style="font-size:13px;margin-top:6px">Hover the link to prefetch the chunk:</p>
      <a (mouseenter)="prefetch()" (click)="nav()" style="display:inline-block;padding:8px 16px;background:#ff9800;color:#fff;border-radius:4px;text-decoration:none;cursor:pointer">Go to Dashboard</a>
      @if (prefetched()) { <p style="margin-top:8px;font-size:13px;color:#388e3c">✓ Chunk prefetched on hover — navigation will be instant</p> }
      @if (navMsg()) { <p style="margin-top:4px;font-size:13px;color:#1565c0">{{ navMsg() }}</p> }
    </div>
  `
})
class Ex22 {
  prefetched = signal(false);
  navMsg = signal('');
  prefetch() {
    if (!this.prefetched()) {
      setTimeout(() => this.prefetched.set(true), 400);
    }
  }
  nav() {
    this.navMsg.set(this.prefetched() ? '⚡ Instant navigation (chunk cached)' : '⏳ Loading chunk...');
    setTimeout(() => this.navMsg.set(''), 2000);
  }
}

// 23. Prefetch on idle — requestIdleCallback simulation
@Component({
  selector: 'ex-23', standalone: true,
  template: `
    <div style="padding:10px;border:1px solid #8bc34a;border-radius:6px">
      <p style="margin:0;font-weight:bold">Prefetch on Idle (requestIdleCallback)</p>
      <pre style="background:#f5f5f5;font-size:11px;padding:8px;border-radius:4px;margin-top:8px">
// Custom preloading strategy using requestIdleCallback
@Injectable({{ '{' }} providedIn: 'root' {{ '}' }})
export class IdlePreloadStrategy implements PreloadingStrategy {{ '{' }}
  preload(route: Route, load: () => Observable&lt;any&gt;): Observable&lt;any&gt; {{ '{' }}
    return new Observable(obs => {{ '{' }}
      if ('requestIdleCallback' in window) {{ '{' }}
        requestIdleCallback(() => {{ '{' }}
          load().subscribe(obs);
        {{ '}' }});
      {{ '}' }} else {{ '{' }}
        setTimeout(() => load().subscribe(obs), 2000);
      {{ '}' }}
    {{ '}' }});
  {{ '}' }}
{{ '}' }}
      </pre>
    </div>
  `
})
class Ex23 {}

// 24. Lazy retry on failure — code display
@Component({
  selector: 'ex-24', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Retry dynamic import on failure (network blip)
function lazyWithRetry&lt;T&gt;(
  importFn: () => Promise&lt;T&gt;,
  retries = 3
): () => Promise&lt;T&gt; {{ '{' }}
  return () => {{ '{' }}
    const attempt = (n: number): Promise&lt;T&gt; =>
      importFn().catch(err => {{ '{' }}
        if (n &lt;= 0) throw err;
        console.warn(\`Chunk load failed, retrying (\${{ '{' }}n{{ '}' }} left)\`);
        return new Promise(resolve => setTimeout(resolve, 1000))
          .then(() => attempt(n - 1));
      {{ '}' }});
    return attempt(retries);
  {{ '}' }};
{{ '}' }}

// Usage:
{{ '{' }} path: 'reports', loadComponent: lazyWithRetry(() => import('./reports.component')) {{ '}' }}
    </pre>
  `
})
class Ex24 {}

// 25. withPreloading provider setup — code display
@Component({
  selector: 'ex-25', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Full app.config.ts with preloading setup
import {{ '{' }}
  provideRouter, withPreloading, withDebugTracing,
  withComponentInputBinding, PreloadAllModules
{{ '}' }} from '@angular/router';

export const appConfig: ApplicationConfig = {{ '{' }}
  providers: [
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),   // preload strategy
      withComponentInputBinding(),         // route params → @Input()
      // withDebugTracing(),               // uncomment for dev tracing
    ),
    provideHttpClient(),
    provideAnimations(),
  ]
{{ '}' }};
    </pre>
  `
})
class Ex25 {}

// 26. Bundle chunk naming (webpackChunkName) — code display
@Component({
  selector: 'ex-26', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Name lazy chunks with webpack magic comments
const routes: Routes = [
  {{ '{' }}
    path: 'admin',
    loadComponent: () =>
      import(/* webpackChunkName: "admin" */ './admin.component')
  {{ '}' }},
  {{ '{' }}
    path: 'dashboard',
    loadChildren: () =>
      import(/* webpackChunkName: "dashboard" */ './dashboard/routes')
        .then(m => m.DASHBOARD_ROUTES)
  {{ '}' }},
  {{ '{' }}
    path: 'reports',
    loadComponent: () =>
      import(/* webpackChunkName: "reports", webpackPrefetch: true */
             './reports.component')
  {{ '}' }},
];
// Produces: admin.js, dashboard.js, reports.js instead of chunk-abc123.js
    </pre>
  `
})
class Ex26 {}

// ─── NESTED (27–38) ─────────────────────────────────────────

// 27. Lazy feature with lazy sub-feature — code display
@Component({
  selector: 'ex-27', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Two-level lazy loading: app → feature → sub-feature
// app.routes.ts
{{ '{' }} path: 'shop', loadChildren: () => import('./shop/shop.routes')
              .then(m => m.SHOP_ROUTES) {{ '}' }}

// shop/shop.routes.ts
export const SHOP_ROUTES: Routes = [
  {{ '{' }} path: '',        component: ShopHomeComponent {{ '}' }},
  {{ '{' }} path: 'products', component: ProductsComponent {{ '}' }},
  {{ '{' }}
    path: 'checkout',
    loadChildren: () =>           // nested lazy load
      import('./checkout/checkout.routes')
        .then(m => m.CHECKOUT_ROUTES)
  {{ '}' }},
];

// checkout/checkout.routes.ts
export const CHECKOUT_ROUTES: Routes = [
  {{ '{' }} path: '',       component: CartComponent    {{ '}' }},
  {{ '{' }} path: 'payment', component: PaymentComponent {{ '}' }},
  {{ '{' }} path: 'confirm', component: ConfirmComponent {{ '}' }},
];
    </pre>
  `
})
class Ex27 {}

// 28. Lazy admin + lazy user separate features — code display
@Component({
  selector: 'ex-28', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Separate lazy bundles for admin and user portals
const routes: Routes = [
  // User portal — ~50KB chunk
  {{ '{' }}
    path: 'app',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./user-portal/portal.routes').then(m => m.PORTAL_ROUTES)
  {{ '}' }},

  // Admin portal — ~80KB chunk (only admins download this)
  {{ '{' }}
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadChildren: () =>
      import('./admin-portal/admin.routes').then(m => m.ADMIN_ROUTES)
  {{ '}' }},
];
// Regular users never download the admin bundle
    </pre>
  `
})
class Ex28 {}

// 29. Lazy dashboard with lazy widgets — code display
@Component({
  selector: 'ex-29', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Dashboard component with @defer for widget lazy loading
@Component({{ '{' }}
  selector: 'app-dashboard',
  standalone: true,
  template: \`
    &lt;!-- Dashboard layout —&gt;
    @defer (on viewport) {{ '{' }}
      &lt;app-analytics-widget /&gt;
    {{ '}' }} @placeholder {{ '{' }} &lt;div&gt;Loading analytics...&lt;/div&gt; {{ '}' }}

    @defer (on idle) {{ '{' }}
      &lt;app-notifications-widget /&gt;
    {{ '}' }} @placeholder {{ '{' }} &lt;div&gt;Loading notifications...&lt;/div&gt; {{ '}' }}

    @defer (on interaction) {{ '{' }}
      &lt;app-reports-widget /&gt;
    {{ '}' }} @placeholder {{ '{' }} &lt;button&gt;Load Reports&lt;/button&gt; {{ '}' }}
  \`,
{{ '}' }})
export default class DashboardComponent {{ '{' }} {{ '}' }}
    </pre>
  `
})
class Ex29 {}

// 30. Lazy auth with post-login redirect — code display
@Component({
  selector: 'ex-30', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Auth module with post-login return URL
// auth/auth.routes.ts
export const AUTH_ROUTES: Routes = [
  {{ '{' }} path: 'login',  component: LoginComponent  {{ '}' }},
  {{ '{' }} path: 'signup', component: SignupComponent {{ '}' }},
  {{ '{' }} path: 'reset',  component: ResetComponent  {{ '}' }},
];

// In LoginComponent after successful login:
@Component({{ '{' }} standalone: true {{ '}' }})
class LoginComponent {{ '{' }}
  private auth   = inject(AuthService);
  private router = inject(Router);

  async login(creds: Credentials) {{ '{' }}
    await this.auth.login(creds);
    // Read returnUrl from query params set by authGuard
    const returnUrl = inject(ActivatedRoute)
      .snapshot.queryParams['returnUrl'] ?? '/dashboard';
    this.router.navigateByUrl(returnUrl);
  {{ '}' }}
{{ '}' }}
    </pre>
  `
})
class Ex30 {}

// 31. Lazy settings with child routes — code display
@Component({
  selector: 'ex-31', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// settings/settings.routes.ts
export const SETTINGS_ROUTES: Routes = [
  {{ '{' }}
    path: '',
    component: SettingsLayoutComponent,  // shell with side nav
    children: [
      {{ '{' }} path: '',          redirectTo: 'profile', pathMatch: 'full' {{ '}' }},
      {{ '{' }} path: 'profile',   component: ProfileSettingsComponent  {{ '}' }},
      {{ '{' }} path: 'security',  component: SecuritySettingsComponent {{ '}' }},
      {{ '{' }} path: 'billing',   component: BillingSettingsComponent  {{ '}' }},
      {{ '{' }} path: 'notif',     component: NotifSettingsComponent    {{ '}' }},
      {{ '{' }} path: 'danger',    component: DangerZoneComponent,
                canActivate: [confirmGuard]                              {{ '}' }},
    ]
  {{ '}' }}
];
    </pre>
  `
})
class Ex31 {}

// 32. Lazy with shared singleton service — code display
@Component({
  selector: 'ex-32', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Singleton service shared across lazy features
// shared/cart.service.ts
@Injectable({{ '{' }} providedIn: 'root' {{ '}' }})  // ← root-level singleton
export class CartService {{ '{' }}
  readonly items = signal&lt;CartItem[]&gt;([]);
  readonly count = computed(() => this.items().length);
  add(item: CartItem) {{ '{' }} this.items.update(items => [...items, item]); {{ '}' }}
{{ '}' }}

// Both lazy features share the SAME CartService instance
// shop chunk: inject(CartService)  → same instance
// header chunk: inject(CartService) → same instance
// cart chunk: inject(CartService)   → same instance

// Don't add CartService to route-level providers[] or it creates a new scope
    </pre>
  `
})
class Ex32 {}

// 33. Lazy breadcrumb data — code display
@Component({
  selector: 'ex-33', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Using route data for breadcrumb generation
const routes: Routes = [
  {{ '{' }}
    path: 'shop',
    data: {{ '{' }} breadcrumb: 'Shop' {{ '}' }},
    loadChildren: () => import('./shop/shop.routes').then(m => m.SHOP_ROUTES),
  {{ '}' }}
];

export const SHOP_ROUTES: Routes = [
  {{ '{' }} path: 'products', data: {{ '{' }} breadcrumb: 'Products' {{ '}' }}, component: ProductsComponent {{ '}' }},
  {{ '{' }} path: 'products/:id', data: {{ '{' }} breadcrumb: 'Product Detail' {{ '}' }}, component: DetailComponent {{ '}' }},
];

// BreadcrumbService builds trail by traversing ActivatedRoute hierarchy:
// Home > Shop > Products > Product Detail
    </pre>
  `
))
class Ex33 {}

// 34. Lazy title strategy — code display
@Component({
  selector: 'ex-34', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Custom title strategy with app name suffix
import {{ '{' }} TitleStrategy, RouterStateSnapshot {{ '}' }} from '@angular/router';

@Injectable({{ '{' }} providedIn: 'root' {{ '}' }})
export class AppTitleStrategy extends TitleStrategy {{ '{' }}
  constructor(private title: Title) {{ '{' }} super(); {{ '}' }}

  override updateTitle(snapshot: RouterStateSnapshot): void {{ '{' }}
    const routeTitle = this.buildTitle(snapshot);
    this.title.setTitle(
      routeTitle ? \`\${{ '{' }}routeTitle{{ '}' }} — MyApp\` : 'MyApp'
    );
  {{ '}' }}
{{ '}' }}

// Provide:
// {{ '{' }} provide: TitleStrategy, useClass: AppTitleStrategy {{ '}' }}

// Route:
// {{ '{' }} path: 'products', title: 'Products', loadComponent: () => ... {{ '}' }}
// → Tab shows: "Products — MyApp"
    </pre>
  `
})
class Ex34 {}

// 35. Lazy SEO meta resolver — code display
@Component({
  selector: 'ex-35', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Resolver that sets SEO meta tags from API data
export const seoResolver: ResolveFn&lt;void&gt; = (route) => {{ '{' }}
  const meta = inject(Meta);
  const slug = route.params['slug'];

  return inject(BlogService).getPost(slug).pipe(
    tap(post => {{ '{' }}
      meta.updateTag({{ '{' }} name: 'description', content: post.excerpt {{ '}' }});
      meta.updateTag({{ '{' }} property: 'og:title',       content: post.title   {{ '}' }});
      meta.updateTag({{ '{' }} property: 'og:description', content: post.excerpt {{ '}' }});
      meta.updateTag({{ '{' }} property: 'og:image',       content: post.image   {{ '}' }});
    {{ '}' }})
  );
{{ '}' }};

// Route:
// {{ '{' }} path: ':slug', resolve: {{ '{' }} _seo: seoResolver {{ '}' }},
//   loadComponent: () => import('./post.component') {{ '}' }}
    </pre>
  `
})
class Ex35 {}

// 36. Lazy with view transitions — code display
@Component({
  selector: 'ex-36', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// View Transitions API with lazy loading (Angular 17+)
import {{ '{' }} provideRouter, withViewTransitions {{ '}' }} from '@angular/router';

export const appConfig: ApplicationConfig = {{ '{' }}
  providers: [
    provideRouter(
      routes,
      withViewTransitions({{ '{' }}
        onViewTransitionCreated: ({{ '{' }} transition {{ '}' }}) => {{ '{' }}
          // Customize or cancel specific transitions
          if (inject(MediaQuery).prefersReducedMotion) {{ '{' }}
            transition.skipTransition();
          {{ '}' }}
        {{ '}' }}
      {{ '}' }})
    ),
  ]
{{ '}' }};

// CSS:
// ::view-transition-old(root) {{ '{' }} animation: fade-out 0.3s ease {{ '}' }}
// ::view-transition-new(root) {{ '{' }} animation: fade-in  0.3s ease {{ '}' }}
    </pre>
  `
})
class Ex36 {}

// 37. Lazy + @defer combination — code display
@Component({
  selector: 'ex-37', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Combining route-level lazy loading with @defer within components
// Route loads dashboard chunk lazily, then @defer within it:

@Component({{ '{' }}
  standalone: true,
  template: \`
    &lt;!-- Immediately visible —&gt;
    &lt;app-header /&gt;
    &lt;app-stats-bar /&gt;

    &lt;!-- Defer heavy chart library until viewport —&gt;
    @defer (on viewport; prefetch on idle) {{ '{' }}
      &lt;app-analytics-chart /&gt;
    {{ '}' }} @placeholder {{ '{' }}
      &lt;div class="chart-skeleton"&gt;&lt;/div&gt;
    {{ '}' }} @loading {{ '{' }}
      &lt;app-spinner /&gt;
    {{ '}' }}

    &lt;!-- Defer table until user scrolls —&gt;
    @defer (on viewport) {{ '{' }}
      &lt;app-data-table /&gt;
    {{ '}' }} @placeholder {{ '{' }}
      &lt;div class="table-skeleton"&gt;&lt;/div&gt;
    {{ '}' }}
  \`
{{ '}' }})
export default class DashboardComponent {{ '{' }} {{ '}' }}
    </pre>
  `
})
class Ex37 {}

// 38. Full app lazy architecture overview — code display
@Component({
  selector: 'ex-38', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Enterprise lazy loading architecture
// main bundle: ~80KB (core + auth + home)
const routes: Routes = [
  // Eagerly loaded (always needed)
  {{ '{' }} path: '',     component: HomeComponent {{ '}' }},
  {{ '{' }} path: 'login', canActivate: [guestGuard], component: LoginComponent {{ '}' }},

  // Lazy feature modules (separate chunks)
  {{ '{' }} path: 'shop',      canActivate: [authGuard],
    loadChildren: () => import('./shop/shop.routes')         {{ '}' }},    // ~120KB
  {{ '{' }} path: 'dashboard', canActivate: [authGuard],
    loadChildren: () => import('./dashboard/dashboard.routes') {{ '}' }},  // ~95KB
  {{ '{' }} path: 'profile',   canActivate: [authGuard],
    loadComponent: () => import('./profile.component')       {{ '}' }},    // ~30KB

  // Heavy admin panel (only for admins, rarely visited)
  {{ '{' }} path: 'admin',     canActivate: [authGuard, adminGuard],
    loadChildren: () => import('./admin/admin.routes')       {{ '}' }},    // ~200KB

  // Fallback
  {{ '{' }} path: '**', loadComponent: () => import('./not-found.component') {{ '}' }},
];
// Total initial download: ~80KB → fast first paint
// Features load on demand: ship faster, pay per visit
    </pre>
  `
})
class Ex38 {}

// ─── ADVANCED (39–50) ───────────────────────────────────────

// 39. withComponentInputBinding for lazy — code display
@Component({
  selector: 'ex-39', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// withComponentInputBinding maps route params/data → @Input() signals
import {{ '{' }} provideRouter, withComponentInputBinding {{ '}' }} from '@angular/router';

export const appConfig: ApplicationConfig = {{ '{' }}
  providers: [
    provideRouter(routes, withComponentInputBinding()),
  ]
{{ '}' }};

// Now route params auto-bind to @Input() in lazy-loaded components:
@Component({{ '{' }} standalone: true, template: '...' {{ '}' }})
export default class UserDetailComponent {{ '{' }}
  // Automatically receives :id from URL /users/:id
  @Input() id = '';                    // from route params
  @Input() tab = 'profile';            // from query params
  @Input() user?: User;                // from resolved data
{{ '}' }}

// Route:
// {{ '{' }} path: 'users/:id', resolve: {{ '{' }} user: userResolver {{ '}' }},
//   loadComponent: () => import('./user-detail.component') {{ '}' }}
    </pre>
  `
})
class Ex39 {}

// 40. withViewTransitions for lazy navigation — code display
@Component({
  selector: 'ex-40', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Smooth transitions between lazy-loaded routes
// app.config.ts
provideRouter(routes, withViewTransitions());

// styles.scss — animate between routes:
@keyframes fade-in  {{ '{' }} from {{ '{' }} opacity: 0; transform: translateY(10px) {{ '}' }} {{ '}' }}
@keyframes fade-out {{ '{' }} to   {{ '{' }} opacity: 0; transform: translateY(-10px) {{ '}' }} {{ '}' }}

::view-transition-old(root) {{ '{' }}
  animation: fade-out 200ms ease forwards;
{{ '}' }}
::view-transition-new(root) {{ '{' }}
  animation: fade-in 200ms ease forwards;
{{ '}' }}

// Per-element named transitions (Hero animation):
// In source component: style="view-transition-name: hero-img"
// In destination:      style="view-transition-name: hero-img"
// Browser morphs between the two automatically
    </pre>
  `
})
class Ex40 {}

// 41. Lazy with SSR transfer state — code display
@Component({
  selector: 'ex-41', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// SSR + lazy loading with TransferState to avoid double fetch
import {{ '{' }} TransferState, makeStateKey {{ '}' }} from '@angular/core';

const PRODUCTS_KEY = makeStateKey&lt;Product[]&gt;('products');

@Injectable({{ '{' }} providedIn: 'root' {{ '}' }})
export class ProductService {{ '{' }}
  private state = inject(TransferState);
  private http  = inject(HttpClient);

  getAll(): Observable&lt;Product[]&gt; {{ '{' }}
    const cached = this.state.get(PRODUCTS_KEY, null);
    if (cached) {{ '{' }}
      this.state.remove(PRODUCTS_KEY);
      return of(cached);  // use SSR-fetched data, no HTTP call
    {{ '}' }}
    return this.http.get&lt;Product[]&gt;('/api/products').pipe(
      tap(data => this.state.set(PRODUCTS_KEY, data))
    );
  {{ '}' }}
{{ '}' }}
    </pre>
  `
})
class Ex41 {}

// 42. Lazy + standalone providers array — code display
@Component({
  selector: 'ex-42', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Route-level providers create a scoped injector for the lazy feature
const routes: Routes = [
  {{ '{' }}
    path: 'checkout',
    loadChildren: () => import('./checkout/checkout.routes')
      .then(m => m.CHECKOUT_ROUTES),
    providers: [
      // These are only available within the checkout sub-tree
      CheckoutSessionService,
      {{ '{' }} provide: PAYMENT_GATEWAY, useClass: StripeGateway {{ '}' }},
      provideHttpClient(withInterceptors([authInterceptor])),
    ]
  {{ '}' }}
];

// checkout.routes.ts — can inject CheckoutSessionService without providing again
export const CHECKOUT_ROUTES: Routes = [
  {{ '{' }} path: '',       component: CartComponent    {{ '}' }},
  {{ '{' }} path: 'pay',    component: PaymentComponent {{ '}' }},
  {{ '{' }} path: 'thanks', component: ThanksComponent  {{ '}' }},
];
    </pre>
  `
})
class Ex42 {}

// 43. Route-level error boundary for lazy — code display
@Component({
  selector: 'ex-43', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Wrap lazy route activation with error handling
// Using Router.events to catch NavigationError
@Component({{ '{' }} standalone: true {{ '}' }})
export class AppComponent {{ '{' }}
  private router = inject(Router);

  constructor() {{ '{' }}
    this.router.events.pipe(
      filter(e => e instanceof NavigationError)
    ).subscribe((event: NavigationError) => {{ '{' }}
      if (event.error?.name === 'ChunkLoadError') {{ '{' }}
        // Chunk failed — reload the page once to get fresh manifest
        const hasReloaded = sessionStorage.getItem('chunk_reload');
        if (!hasReloaded) {{ '{' }}
          sessionStorage.setItem('chunk_reload', '1');
          window.location.assign(event.url);
        {{ '}' }} else {{ '{' }}
          this.router.navigate(['/error']);
        {{ '}' }}
      {{ '}' }}
    {{ '}' }});
  {{ '}' }}
{{ '}' }}
    </pre>
  `
})
class Ex43 {}

// 44. Lazy chunk preload priority service — code display
@Component({
  selector: 'ex-44', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Priority-based preloading — preload high-priority routes first
@Injectable({{ '{' }} providedIn: 'root' {{ '}' }})
export class PriorityPreloadStrategy implements PreloadingStrategy {{ '{' }}
  private queue$ = new Subject&lt;{{ '{' }} load: () => Observable&lt;any&gt; {{ '}' }}&gt;();

  constructor() {{ '{' }}
    // Process high priority immediately, then low priority on idle
    this.queue$.pipe(
      concatMap({{ '{' }} load {{ '}' }} => timer(0).pipe(switchMap(() => load())))
    ).subscribe();
  {{ '}' }}

  preload(route: Route, load: () => Observable&lt;any&gt;): Observable&lt;any&gt; {{ '{' }}
    const priority = route.data?.['preloadPriority'] ?? 0;
    if (priority &gt;= 10) return load();          // high: immediate
    if (priority &gt;= 5)  {{ '{' }} this.queue$.next({{ '{' }} load {{ '}' }}); return of(null); {{ '}' }}
    return of(null);                             // low: skip
  {{ '}' }}
{{ '}' }}
    </pre>
  `
})
class Ex44 {}

// 45. Retry-with-progress on lazy fail — code display
@Component({
  selector: 'ex-45', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Show retry progress when lazy chunk fails to load
@Injectable({{ '{' }} providedIn: 'root' {{ '}' }})
export class LazyLoadingService {{ '{' }}
  readonly retryCount = signal(0);
  readonly isRetrying = signal(false);

  loadWithRetry&lt;T&gt;(importFn: () => Promise&lt;T&gt;): Promise&lt;T&gt; {{ '{' }}
    this.retryCount.set(0);
    const attempt = (): Promise&lt;T&gt; =>
      importFn().catch(err => {{ '{' }}
        const current = this.retryCount();
        if (current &gt;= 3) {{ '{' }} this.isRetrying.set(false); throw err; {{ '}' }}
        this.retryCount.set(current + 1);
        this.isRetrying.set(true);
        return new Promise&lt;T&gt;(res =>
          setTimeout(() => attempt().then(res), 1000 * (current + 1))
        );
      {{ '}' }});
    return attempt();
  {{ '}' }}
{{ '}' }}
    </pre>
  `
})
class Ex45 {}

// 46. Lazy + preconnect hints — code display
@Component({
  selector: 'ex-46', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Preconnect to CDN serving lazy chunks for faster downloads
// index.html — add before app bundle:
// &lt;link rel="preconnect" href="https://cdn.myapp.com"&gt;
// &lt;link rel="dns-prefetch" href="https://cdn.myapp.com"&gt;

// angular.json — output hashing for cache busting:
// "outputHashing": "all"

// angular.json — deploy chunks to CDN:
// "deployUrl": "https://cdn.myapp.com/assets/"

// Component-level prefetch link hint injection:
@Component({{ '{' }} standalone: true {{ '}' }})
class HoverPrefetchDirective {{ '{' }}
  @HostListener('mouseenter')
  prefetch() {{ '{' }}
    const link = document.createElement('link');
    link.rel  = 'prefetch';
    link.href = '/chunk-reports.js';
    document.head.appendChild(link);
  {{ '}' }}
{{ '}' }}
    </pre>
  `
})
class Ex46 {}

// 47. Lazy + service worker prefetch — code display
@Component({
  selector: 'ex-47', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// ngsw-config.json — precache specific lazy chunks
{{ '{' }}
  "assetGroups": [
    {{ '{' }}
      "name": "core",
      "installMode": "prefetch",
      "resources": {{ '{' }}
        "files": ["/index.html", "/*.css", "/main-*.js"]
      {{ '}' }}
    {{ '}' }},
    {{ '{' }}
      "name": "lazy-features",
      "installMode": "lazy",    // download on first request
      "updateMode": "prefetch", // eagerly update on SW refresh
      "resources": {{ '{' }}
        "files": ["/dashboard-*.js", "/admin-*.js"]
      {{ '}' }}
    {{ '}' }}
  ]
{{ '}' }}

// provideServiceWorker in app.config.ts:
// provideServiceWorker('ngsw-worker.js', {{ '{' }}
//   enabled: !isDevMode(),
//   registrationStrategy: 'registerWhenStable:30000'
// {{ '}' }})
    </pre>
  `
})
class Ex47 {}

// 48. Lazy component portal — code display
@Component({
  selector: 'ex-48', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Lazy-load a component into a CDK Portal (outside router)
import {{ '{' }} ComponentPortal {{ '}' }} from '@angular/cdk/portal';

@Injectable({{ '{' }} providedIn: 'root' {{ '}' }})
export class ModalService {{ '{' }}
  async openModal(type: string): Promise&lt;void&gt; {{ '{' }}
    let componentClass: Type&lt;any&gt;;

    switch (type) {{ '{' }}
      case 'confirm':
        componentClass = (await import('./confirm-modal.component')).default;
        break;
      case 'image':
        componentClass = (await import('./image-modal.component')).default;
        break;
      default: return;
    {{ '}' }}

    const portal = new ComponentPortal(componentClass);
    this.overlayRef.attach(portal);
  {{ '}' }}
{{ '}' }}
// Lazy modals are only downloaded when first opened
    </pre>
  `
})
class Ex48 {}

// 49. Lazy + Angular CDK overlay — code display
@Component({
  selector: 'ex-49', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// CDK Overlay with lazily loaded panel component
import {{ '{' }} Overlay, OverlayRef {{ '}' }} from '@angular/cdk/overlay';
import {{ '{' }} ComponentPortal {{ '}' }} from '@angular/cdk/portal';

@Component({{ '{' }} standalone: true, imports: [/* no heavy imports upfront */] {{ '}' }})
export class TriggerComponent {{ '{' }}
  private overlay  = inject(Overlay);
  private injector = inject(Injector);
  private ref?: OverlayRef;

  async open() {{ '{' }}
    // Lazy-load the panel only when first opened
    const {{ '{' }} default: PanelComponent {{ '}' }} =
      await import('./heavy-panel/heavy-panel.component');

    this.ref = this.overlay.create({{ '{' }}
      positionStrategy: this.overlay.position().global().centerHorizontally()
    {{ '}' }});

    const portal = new ComponentPortal(
      PanelComponent, null,
      Injector.create({{ '{' }} providers: [{{ '{' }} provide: OVERLAY_REF, useValue: this.ref {{ '}' }}], parent: this.injector {{ '}' }})
    );
    this.ref.attach(portal);
  {{ '}' }}
{{ '}' }}
    </pre>
  `
})
class Ex49 {}

// 50. Full enterprise lazy loading strategy — code display
@Component({
  selector: 'ex-50', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Enterprise lazy loading: all best practices combined
// app.config.ts
export const appConfig: ApplicationConfig = {{ '{' }}
  providers: [
    provideRouter(
      routes,
      withPreloading(SelectivePreloadStrategy),  // data.preload = true routes
      withComponentInputBinding(),               // params → @Input()
      withViewTransitions(),                     // smooth transitions
      withRouterConfig({{ '{' }} paramsInheritanceStrategy: 'always' {{ '}' }})
    ),
    provideHttpClient(withInterceptors([authInterceptor, cacheInterceptor])),
    provideServiceWorker('ngsw-worker.js', {{ '{' }} enabled: !isDevMode() {{ '}' }}),
  ]
{{ '}' }};

// app.routes.ts — tiered lazy loading
export const routes: Routes = [
  // Shell (always loaded ~40KB)
  {{ '{' }} path: '', component: ShellComponent, children: [
    {{ '{' }} path: 'home', data: {{ '{' }} preload: true {{ '}' }},   // preload immediately
      loadComponent: () => import('./home') {{ '}' }},
    {{ '{' }} path: 'shop', data: {{ '{' }} preload: true {{ '}' }},   // preload after home
      loadChildren: () => import('./shop/shop.routes') {{ '}' }},
    {{ '{' }} path: 'admin', canActivate: [adminGuard],        // never preload
      loadChildren: () => import('./admin/admin.routes') {{ '}' }},
    {{ '{' }} path: 'settings',                                // on-demand
      loadChildren: () => import('./settings/settings.routes') {{ '}' }},
  ]{{ '}' }},
  {{ '{' }} path: '**', loadComponent: () => import('./not-found') {{ '}' }},
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
      <h1>Examples 6.4 — Lazy Loading</h1>
      <h4>1. loadComponent syntax</h4><ex-01 /><hr />
      <h4>2. loadChildren with routes array</h4><ex-02 /><hr />
      <h4>3. Feature routes export pattern</h4><ex-03 /><hr />
      <h4>4. Default export for lazy component</h4><ex-04 /><hr />
      <h4>5. Named export for lazy component</h4><ex-05 /><hr />
      <h4>6. Lazy loading simulation</h4><ex-06 /><hr />
      <h4>7. Lazy route with title property</h4><ex-07 /><hr />
      <h4>8. Lazy route with data property</h4><ex-08 /><hr />
      <h4>9. Eager vs lazy comparison</h4><ex-09 /><hr />
      <h4>10. Lazy loading indicator</h4><ex-10 /><hr />
      <h4>11. Lazy error simulation</h4><ex-11 /><hr />
      <h4>12. Basic lazy route config structure</h4><ex-12 /><hr />
      <h4>13. Lazy component minimal example</h4><ex-13 /><hr />
      <h4>14. Lazy feature with nested children routes</h4><ex-14 /><hr />
      <h4>15. PreloadAllModules strategy</h4><ex-15 /><hr />
      <h4>16. NoPreloading strategy</h4><ex-16 /><hr />
      <h4>17. Custom selective preload strategy</h4><ex-17 /><hr />
      <h4>18. Lazy with canActivate guard</h4><ex-18 /><hr />
      <h4>19. Lazy with resolver</h4><ex-19 /><hr />
      <h4>20. Lazy with component-level providers</h4><ex-20 /><hr />
      <h4>21. Dynamic import with condition</h4><ex-21 /><hr />
      <h4>22. Prefetch on hover</h4><ex-22 /><hr />
      <h4>23. Prefetch on idle</h4><ex-23 /><hr />
      <h4>24. Lazy retry on failure</h4><ex-24 /><hr />
      <h4>25. withPreloading provider setup</h4><ex-25 /><hr />
      <h4>26. Bundle chunk naming</h4><ex-26 /><hr />
      <h4>27. Lazy feature with lazy sub-feature</h4><ex-27 /><hr />
      <h4>28. Lazy admin + lazy user separate features</h4><ex-28 /><hr />
      <h4>29. Lazy dashboard with lazy widgets</h4><ex-29 /><hr />
      <h4>30. Lazy auth with post-login redirect</h4><ex-30 /><hr />
      <h4>31. Lazy settings with child routes</h4><ex-31 /><hr />
      <h4>32. Lazy with shared singleton service</h4><ex-32 /><hr />
      <h4>33. Lazy breadcrumb data</h4><ex-33 /><hr />
      <h4>34. Lazy title strategy</h4><ex-34 /><hr />
      <h4>35. Lazy SEO meta resolver</h4><ex-35 /><hr />
      <h4>36. Lazy with view transitions</h4><ex-36 /><hr />
      <h4>37. Lazy + @defer combination</h4><ex-37 /><hr />
      <h4>38. Full app lazy architecture overview</h4><ex-38 /><hr />
      <h4>39. withComponentInputBinding for lazy</h4><ex-39 /><hr />
      <h4>40. withViewTransitions for lazy navigation</h4><ex-40 /><hr />
      <h4>41. Lazy with SSR transfer state</h4><ex-41 /><hr />
      <h4>42. Lazy + standalone providers array</h4><ex-42 /><hr />
      <h4>43. Route-level error boundary for lazy</h4><ex-43 /><hr />
      <h4>44. Lazy chunk preload priority service</h4><ex-44 /><hr />
      <h4>45. Retry-with-progress on lazy fail</h4><ex-45 /><hr />
      <h4>46. Lazy + preconnect hints</h4><ex-46 /><hr />
      <h4>47. Lazy + service worker prefetch</h4><ex-47 /><hr />
      <h4>48. Lazy component portal</h4><ex-48 /><hr />
      <h4>49. Lazy + Angular CDK overlay</h4><ex-49 /><hr />
      <h4>50. Full enterprise lazy loading strategy</h4><ex-50 /><hr />
    </div>
  `,
})
export class AppComponent {}
