import { Component, signal, computed, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

// ============================================================
// Examples 4.3 — Lazy Loading Routes (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ───────────────────────────────────────────

// 1. loadComponent syntax shown (code display)
@Component({
  selector: 'ex-01', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">loadComponent syntax</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex01 {
  code = `// app.routes.ts
export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.component')
        .then(m => m.DashboardComponent)
  }
];`;
}

// 2. loadChildren with routes array (code display)
@Component({
  selector: 'ex-02', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">loadChildren with routes array</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex02 {
  code = `// app.routes.ts
export const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () =>
      import('./admin/admin.routes')
        .then(m => m.ADMIN_ROUTES)
  }
];

// admin/admin.routes.ts
export const ADMIN_ROUTES: Routes = [
  { path: '', component: AdminHomeComponent },
  { path: 'users', component: AdminUsersComponent }
];`;
}

// 3. Lazy route config structure (code display)
@Component({
  selector: 'ex-03', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">Lazy route config structure</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex03 {
  code = `export const routes: Routes = [
  // Eager (loaded immediately)
  { path: '', component: HomeComponent },

  // Lazy (loaded on demand)
  {
    path: 'profile',
    loadComponent: () =>
      import('./profile/profile.component')
        .then(m => m.ProfileComponent),
    title: 'Profile',
    data: { preload: true }
  }
];`;
}

// 4. Default export component for lazy
@Component({
  selector: 'ex-04', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">Default export component for lazy</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex04 {
  code = `// feature.component.ts (default export)
@Component({ ... })
export default class FeatureComponent {}

// app.routes.ts — shorter syntax with default export
{
  path: 'feature',
  loadComponent: () => import('./feature/feature.component')
  // Angular auto-uses the default export
}`;
}

// 5. Named export component for lazy
@Component({
  selector: 'ex-05', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">Named export component for lazy</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex05 {
  code = `// feature.component.ts (named export)
@Component({ ... })
export class FeatureComponent {}

// app.routes.ts — must use .then(m => m.FeatureComponent)
{
  path: 'feature',
  loadComponent: () =>
    import('./feature/feature.component')
      .then(m => m.FeatureComponent)
}`;
}

// 6. Simulated lazy load (dynamic import simulation with signal)
@Component({
  selector: 'ex-06', standalone: true,
  template: `
    <div>
      <button (click)="load()" [disabled]="loading()">
        {{ loading() ? 'Loading...' : 'Simulate Lazy Load' }}
      </button>
      @if (loaded()) {
        <div style="background:#e8f5e9;padding:8px;border-radius:4px;margin-top:8px">
          Lazy component loaded! Content: {{ content() }}
        </div>
      }
    </div>`
})
class Ex06 {
  loading = signal(false);
  loaded = signal(false);
  content = signal('');
  load() {
    this.loading.set(true);
    setTimeout(() => {
      this.loaded.set(true);
      this.content.set('DashboardComponent rendered');
      this.loading.set(false);
    }, 800);
  }
}

// 7. Lazy route with title property
@Component({
  selector: 'ex-07', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">Lazy route with title property</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex07 {
  code = `export const routes: Routes = [
  {
    path: 'about',
    loadComponent: () =>
      import('./about/about.component')
        .then(m => m.AboutComponent),
    title: 'About Us'  // Sets document.title
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./contact/contact.component')
        .then(m => m.ContactComponent),
    title: 'Contact'
  }
];`;
}

// 8. Lazy route with data property
@Component({
  selector: 'ex-08', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">Lazy route with data property</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex08 {
  code = `export const routes: Routes = [
  {
    path: 'admin',
    loadComponent: () =>
      import('./admin/admin.component')
        .then(m => m.AdminComponent),
    data: {
      breadcrumb: 'Admin',
      requiredRole: 'ADMIN',
      preload: true
    }
  }
];

// Access in component:
route = inject(ActivatedRoute);
data = this.route.snapshot.data;
// data['breadcrumb'] === 'Admin'`;
}

// 9. Lazy route with canActivate (code display)
@Component({
  selector: 'ex-09', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">Lazy route with canActivate guard</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex09 {
  code = `export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.component')
        .then(m => m.DashboardComponent),
    canActivate: [authGuard]
    // Guard runs BEFORE the component is lazily loaded
  }
];

// auth.guard.ts
export const authGuard = () => {
  const auth = inject(AuthService);
  return auth.isLoggedIn() ? true : inject(Router).createUrlTree(['/login']);
};`;
}

// 10. Lazy route with resolve (code display)
@Component({
  selector: 'ex-10', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">Lazy route with resolve</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex10 {
  code = `export const routes: Routes = [
  {
    path: 'user/:id',
    loadComponent: () =>
      import('./user/user.component')
        .then(m => m.UserComponent),
    resolve: {
      user: userResolver
    }
  }
];

// user.resolver.ts
export const userResolver: ResolveFn<User> = (route) => {
  return inject(UserService).getUser(route.paramMap.get('id')!);
};`;
}

// 11. Feature routes array export pattern
@Component({
  selector: 'ex-11', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">Feature routes array export pattern</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex11 {
  code = `// features/shop/shop.routes.ts
import { Routes } from '@angular/router';

export const SHOP_ROUTES: Routes = [
  { path: '', component: ShopHomeComponent },
  { path: 'products', component: ProductListComponent },
  { path: 'products/:id', component: ProductDetailComponent },
  { path: 'cart', component: CartComponent }
];

// app.routes.ts
export const routes: Routes = [
  {
    path: 'shop',
    loadChildren: () =>
      import('./features/shop/shop.routes')
        .then(m => m.SHOP_ROUTES)
  }
];`;
}

// 12. Route config: eager vs lazy comparison
@Component({
  selector: 'ex-12', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">Eager vs Lazy comparison</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex12 {
  code = `// EAGER — component bundled in main chunk, loads immediately
{ path: 'home', component: HomeComponent }

// LAZY (loadComponent) — separate chunk, loads on navigation
{
  path: 'dashboard',
  loadComponent: () => import('./dashboard.component')
    .then(m => m.DashboardComponent)
}

// LAZY (loadChildren) — separate chunk for entire feature
{
  path: 'admin',
  loadChildren: () => import('./admin/admin.routes')
    .then(m => m.ADMIN_ROUTES)
}

// Bundle impact:
// Eager  → included in main.js (always downloaded)
// Lazy   → chunk-name.js (downloaded on demand)`;
}

// 13. Lazy loading indicator pattern (signal isLoading)
@Component({
  selector: 'ex-13', standalone: true,
  template: `
    <div>
      <button (click)="navigate()">Navigate to lazy route</button>
      @if (isLoading()) {
        <div style="display:flex;align-items:center;gap:8px;margin-top:8px;color:#3f51b5">
          <span style="display:inline-block;width:16px;height:16px;border:2px solid #3f51b5;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite"></span>
          Loading feature...
        </div>
      }
      @if (loaded()) {
        <div style="color:green;margin-top:8px">Feature loaded successfully!</div>
      }
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    </div>`
})
class Ex13 {
  isLoading = signal(false);
  loaded = signal(false);
  navigate() {
    this.isLoading.set(true);
    this.loaded.set(false);
    setTimeout(() => { this.isLoading.set(false); this.loaded.set(true); }, 1000);
  }
}

// ─── INTERMEDIATE (14–26) ───────────────────────────────────

// 14. Lazy feature with nested child routes (code display)
@Component({
  selector: 'ex-14', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">Lazy feature with nested child routes</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex14 {
  code = `// admin/admin.routes.ts
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,  // layout with <router-outlet>
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'users', component: AdminUsersComponent },
      {
        path: 'reports',
        loadComponent: () => import('./reports/reports.component')
          .then(m => m.ReportsComponent)
      }
    ]
  }
];`;
}

// 15. PreloadAllModules strategy (code display)
@Component({
  selector: 'ex-15', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">PreloadAllModules strategy</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex15 {
  code = `// app.config.ts
import { PreloadAllModules } from '@angular/router';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withPreloading(PreloadAllModules)
      // After initial load, Angular preloads ALL lazy modules in background
    )
  ]
};`;
}

// 16. NoPreloading strategy (code display)
@Component({
  selector: 'ex-16', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">NoPreloading strategy (default)</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex16 {
  code = `import { NoPreloading } from '@angular/router';

// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withPreloading(NoPreloading)
      // Default: lazy routes are NOT preloaded
      // They only load when the user navigates to them
    )
  ]
};`;
}

// 17. Custom preload strategy (SelectivePreloading)
@Component({
  selector: 'ex-17', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">Custom preload strategy (SelectivePreloading)</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex17 {
  code = `// selective-preload.strategy.ts
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SelectivePreloadStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    // Only preload routes with data.preload = true
    return route.data?.['preload'] ? load() : of(null);
  }
}

// app.config.ts
provideRouter(routes, withPreloading(SelectivePreloadStrategy))

// Route config:
{
  path: 'dashboard',
  loadComponent: () => import('./dashboard.component').then(m => m.DashboardComponent),
  data: { preload: true }  // will be preloaded
}`;
}

// 18. Lazy with shared service (providedIn: 'root')
@Component({
  selector: 'ex-18', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">Lazy with shared service (providedIn: 'root')</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex18 {
  code = `// shared/user.service.ts
@Injectable({ providedIn: 'root' })  // singleton, shared globally
export class UserService {
  private user = signal<User | null>(null);
  getUser() { return this.user; }
}

// lazy-feature/feature.component.ts
@Component({ standalone: true })
export class FeatureComponent {
  userService = inject(UserService);
  // Gets the SAME singleton instance as the rest of the app
  // Even though this component is lazily loaded
}`;
}

// 19. loadComponent with resolver (code display)
@Component({
  selector: 'ex-19', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">loadComponent with resolver</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex19 {
  code = `export const routes: Routes = [
  {
    path: 'product/:id',
    loadComponent: () =>
      import('./product/product.component')
        .then(m => m.ProductComponent),
    resolve: {
      product: (route: ActivatedRouteSnapshot) =>
        inject(ProductService).getProduct(route.params['id'])
    },
    // Component receives resolved data:
    // inject(ActivatedRoute).snapshot.data['product']
  }
];`;
}

// 20. loadComponent with guard (code display)
@Component({
  selector: 'ex-20', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">loadComponent with functional guard</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex20 {
  code = `export const routes: Routes = [
  {
    path: 'admin',
    canActivate: [
      () => {
        const auth = inject(AuthService);
        const router = inject(Router);
        if (auth.isAdmin()) return true;
        return router.createUrlTree(['/unauthorized']);
      }
    ],
    loadComponent: () =>
      import('./admin/admin.component')
        .then(m => m.AdminComponent)
  }
];`;
}

// 21. Prefetch on hover pattern (mouseenter + import())
@Component({
  selector: 'ex-21', standalone: true,
  template: `
    <div>
      <button
        (mouseenter)="prefetch()"
        (click)="navigate()"
        style="padding:8px 16px">
        {{ status() }}
      </button>
      <p style="font-size:12px;color:#666">Hover to prefetch, click to navigate</p>
    </div>`
})
class Ex21 {
  status = signal('Hover to prefetch Dashboard');
  prefetched = false;
  prefetch() {
    if (this.prefetched) return;
    this.status.set('Prefetching...');
    setTimeout(() => {
      this.prefetched = true;
      this.status.set('Prefetched! Click to navigate');
    }, 400);
  }
  navigate() {
    this.status.set(this.prefetched ? 'Navigating (instant!)' : 'Loading then navigating...');
  }
}

// 22. Lazy error handling (catch on import())
@Component({
  selector: 'ex-22', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">Lazy error handling</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
      <button (click)="simulate()">Simulate load failure</button>
      @if (error()) { <p style="color:red">{{ error() }}</p> }
      @if (retry()) { <p style="color:green">Retrying...</p> }
    </div>`
})
class Ex22 {
  error = signal('');
  retry = signal(false);
  code = `// Wrapping loadComponent with error handling
{
  path: 'feature',
  loadComponent: () =>
    import('./feature.component')
      .then(m => m.FeatureComponent)
      .catch(err => {
        console.error('Failed to load feature:', err);
        return import('./error-fallback.component')
          .then(m => m.ErrorFallbackComponent);
      })
}`;
  simulate() {
    this.error.set('ChunkLoadError: Loading chunk failed.');
    this.retry.set(false);
    setTimeout(() => { this.retry.set(true); this.error.set(''); }, 1500);
  }
}

// 23. Lazy loading progress indicator
@Component({
  selector: 'ex-23', standalone: true,
  template: `
    <div>
      <button (click)="start()" [disabled]="loading()">Load Feature</button>
      @if (loading()) {
        <div style="margin-top:8px">
          <div style="background:#e0e0e0;border-radius:4px;height:6px;width:200px">
            <div [style.width]="progress() + '%'" style="background:#3f51b5;height:100%;border-radius:4px;transition:width 0.1s"></div>
          </div>
          <p style="font-size:12px;color:#666">{{ progress() }}%</p>
        </div>
      }
      @if (done()) { <p style="color:green">Feature loaded!</p> }
    </div>`
})
class Ex23 {
  loading = signal(false);
  progress = signal(0);
  done = signal(false);
  start() {
    this.loading.set(true); this.done.set(false); this.progress.set(0);
    const interval = setInterval(() => {
      this.progress.update(p => Math.min(p + 10, 100));
      if (this.progress() >= 100) {
        clearInterval(interval);
        this.loading.set(false);
        this.done.set(true);
      }
    }, 80);
  }
}

// 24. Route chunk naming (webpackChunkName comment)
@Component({
  selector: 'ex-24', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">Webpack chunk naming for lazy routes</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex24 {
  code = `export const routes: Routes = [
  {
    path: 'admin',
    loadComponent: () =>
      import(
        /* webpackChunkName: "admin" */
        './admin/admin.component'
      ).then(m => m.AdminComponent)
  },
  {
    path: 'shop',
    loadChildren: () =>
      import(
        /* webpackChunkName: "shop-feature" */
        './shop/shop.routes'
      ).then(m => m.SHOP_ROUTES)
  }
];

// Output bundles:
// admin.js     (named chunk)
// shop-feature.js  (named chunk)
// vs default: src_app_admin_admin_component_ts.js`;
}

// 25. Lazy feature with component-level providers
@Component({
  selector: 'ex-25', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">Lazy feature with component-level providers</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex25 {
  code = `// feature.component.ts
@Component({
  standalone: true,
  providers: [
    // These services are scoped to this component and children
    FeatureStateService,
    { provide: CONFIG_TOKEN, useValue: { theme: 'dark' } }
  ],
  template: \`<router-outlet />\`
})
export class FeatureComponent {}

// Route:
{
  path: 'feature',
  loadComponent: () =>
    import('./feature.component').then(m => m.FeatureComponent),
  children: [...]
  // Child components get FeatureStateService instance scoped to this route
}`;
}

// 26. Lazy with provideRouter subset
@Component({
  selector: 'ex-26', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">Lazy with provideRouter subset</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex26 {
  code = `// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withPreloading(SelectivePreloadStrategy),
      withComponentInputBinding(),   // queryParams as @Input
      withViewTransitions(),         // page transitions
      withHashLocation(),            // use hash routing
      withDebugTracing()             // log route events (dev only)
    )
  ]
};`;
}

// ─── NESTED (27–38) ─────────────────────────────────────────

// 27. Lazy feature containing lazy sub-feature
@Component({
  selector: 'ex-27', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">Lazy feature containing lazy sub-feature</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex27 {
  code = `// app.routes.ts
{
  path: 'shop',
  loadChildren: () => import('./shop/shop.routes').then(m => m.SHOP_ROUTES)
}

// shop/shop.routes.ts
export const SHOP_ROUTES: Routes = [
  { path: '', component: ShopHomeComponent },
  {
    path: 'checkout',
    // Nested lazy — only loads if user enters checkout flow
    loadChildren: () =>
      import('./checkout/checkout.routes')
        .then(m => m.CHECKOUT_ROUTES)
  }
];

// shop/checkout/checkout.routes.ts
export const CHECKOUT_ROUTES: Routes = [
  { path: 'cart', component: CartComponent },
  { path: 'payment', component: PaymentComponent },
  { path: 'confirm', component: ConfirmComponent }
];`;
}

// 28. Lazy admin + lazy user separate features
@Component({
  selector: 'ex-28', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">Lazy admin + lazy user separate features</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex28 {
  code = `export const routes: Routes = [
  { path: '', component: LandingComponent },
  {
    path: 'user',
    canActivate: [userGuard],
    loadChildren: () =>
      import('./features/user/user.routes').then(m => m.USER_ROUTES)
    // Chunk: user-feature.js
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadChildren: () =>
      import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
    // Chunk: admin-feature.js
    // Users never download admin chunk unless they are admins
  }
];`;
}

// 29. Lazy dashboard with lazy widget components
@Component({
  selector: 'ex-29', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">Lazy dashboard with deferred widgets</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex29 {
  code = `// dashboard.component.ts
@Component({
  standalone: true,
  template: \`
    <!-- Widgets load only when visible (Angular 17+ @defer) -->
    @defer (on viewport) {
      <analytics-widget />
    }
    @defer (on viewport) {
      <revenue-chart />
    }
    @defer (on interaction) {
      <activity-feed />
    }
  \`
})
export class DashboardComponent {}

// Route:
{
  path: 'dashboard',
  loadComponent: () => import('./dashboard.component')
    .then(m => m.DashboardComponent)
}`;
}

// 30. Lazy auth module with redirect after load
@Component({
  selector: 'ex-30', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">Lazy auth with redirect after load</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex30 {
  code = `// auth guard redirects to lazy login route
export const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) return true;

  // This triggers lazy loading of the auth feature
  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: inject(Router).url }
  });
};

// auth/auth.routes.ts
export const AUTH_ROUTES: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent }
];`;
}

// 31. Lazy settings with tab-based sub-routes
@Component({
  selector: 'ex-31', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">Lazy settings with tab sub-routes</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex31 {
  code = `// settings/settings.routes.ts
export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    component: SettingsLayoutComponent,  // tabs UI
    children: [
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      { path: 'profile', component: ProfileSettingsComponent },
      {
        path: 'security',
        loadComponent: () =>
          import('./security/security.component')
            .then(m => m.SecurityComponent)
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./notifications/notifications.component')
            .then(m => m.NotificationsComponent)
      }
    ]
  }
];`;
}

// 32. Lazy module with shared lazy service
@Component({
  selector: 'ex-32', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">Lazy module with route-scoped service</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex32 {
  code = `// shop.routes.ts — provide service at route level
export const SHOP_ROUTES: Routes = [
  {
    path: '',
    providers: [
      // ShopCartService scoped to /shop and its children
      // Destroyed when user leaves /shop
      ShopCartService,
      ShopStateService
    ],
    component: ShopLayoutComponent,
    children: [
      { path: 'products', component: ProductListComponent },
      { path: 'cart', component: CartComponent }
    ]
  }
];`;
}

// 33. Lazy with breadcrumb data resolver
@Component({
  selector: 'ex-33', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">Lazy with breadcrumb data resolver</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex33 {
  code = `export const routes: Routes = [
  {
    path: 'products',
    loadComponent: () =>
      import('./products/products.component')
        .then(m => m.ProductsComponent),
    data: { breadcrumb: 'Products' },
    children: [
      {
        path: ':id',
        loadComponent: () =>
          import('./product-detail/product-detail.component')
            .then(m => m.ProductDetailComponent),
        resolve: {
          product: productResolver,
          breadcrumb: (route) =>
            inject(ProductService)
              .getProduct(route.params['id'])
              .pipe(map(p => p.name))
        }
      }
    ]
  }
];`;
}

// 34. Lazy with title strategy
@Component({
  selector: 'ex-34', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">Lazy with custom TitleStrategy</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex34 {
  code = `// title.strategy.ts
@Injectable()
export class AppTitleStrategy extends TitleStrategy {
  updateTitle(snapshot: RouterStateSnapshot): void {
    const title = this.buildTitle(snapshot);
    document.title = title ? \`\${title} | MyApp\` : 'MyApp';
  }
}

// app.config.ts
providers: [
  provideRouter(routes),
  { provide: TitleStrategy, useClass: AppTitleStrategy }
]

// Lazy route:
{
  path: 'dashboard',
  title: 'Dashboard',  // → "Dashboard | MyApp"
  loadComponent: () => import('./dashboard.component')
    .then(m => m.DashboardComponent)
}`;
}

// 35. Lazy with SEO meta resolver
@Component({
  selector: 'ex-35', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">Lazy with SEO meta resolver pattern</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex35 {
  code = `// seo.resolver.ts
export const seoResolver: ResolveFn<void> = (route) => {
  const meta = inject(Meta);
  const seo = route.data['seo'];
  if (seo) {
    meta.updateTag({ name: 'description', content: seo.description });
    meta.updateTag({ property: 'og:title', content: seo.title });
  }
};

// Route:
{
  path: 'about',
  data: {
    seo: { title: 'About Us', description: 'Learn about our company' }
  },
  resolve: { _seo: seoResolver },
  loadComponent: () => import('./about.component').then(m => m.AboutComponent)
}`;
}

// 36. Bundle analyzer — how to check lazy chunk sizes
@Component({
  selector: 'ex-36', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">Bundle analysis for lazy chunks</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex36 {
  code = `# 1. Build with stats
ng build --stats-json

# 2. Analyze with webpack-bundle-analyzer
npx webpack-bundle-analyzer dist/my-app/stats.json

# 3. Or use source-map-explorer
npx source-map-explorer 'dist/my-app/**/*.js'

# 4. Angular esbuild stats (Angular 17+)
ng build --configuration production
# Check dist/ for named chunk files

# Key things to look for:
# - Large third-party libs in lazy chunks
# - Shared code duplicated across chunks
# - Unexpected eager loading`;
}

// 37. Lazy component deferred (@defer combo)
@Component({
  selector: 'ex-37', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">loadComponent + @defer combo (Angular 17+)</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex37 {
  code = `// Route lazy loads the page component
{
  path: 'dashboard',
  loadComponent: () =>
    import('./dashboard/dashboard.component')
      .then(m => m.DashboardComponent)
}

// Inside DashboardComponent — @defer for sub-sections
@Component({
  template: \`
    <!-- Heavy chart only loads when user scrolls to it -->
    @defer (on viewport) {
      <heavy-chart />
    } @loading {
      <chart-skeleton />
    } @error {
      <p>Chart failed to load</p>
    }
  \`
})
export class DashboardComponent {}
// Two-level code splitting: route chunk + defer block`;
}

// 38. Full app route config with strategic lazy splitting
@Component({
  selector: 'ex-38', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">Full app route config — strategic lazy splitting</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex38 {
  code = `export const routes: Routes = [
  // Eager: landing page (fast initial load)
  { path: '', component: HomeComponent },

  // Lazy: auth feature (only for unauthenticated users)
  { path: 'auth', loadChildren: () =>
    import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES) },

  // Lazy: main app (protected, large)
  { path: 'app', canActivate: [authGuard],
    loadChildren: () =>
      import('./features/main/main.routes').then(m => m.MAIN_ROUTES) },

  // Lazy: admin (very few users, heavy features)
  { path: 'admin', canActivate: [adminGuard],
    loadChildren: () =>
      import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES) },

  // Eager: simple 404 (small, no loading delay)
  { path: '**', component: NotFoundComponent }
];`;
}

// ─── ADVANCED (39–50) ────────────────────────────────────────

// 39. Dynamic import with condition (if feature flag)
@Component({
  selector: 'ex-39', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">Conditional lazy load based on feature flag</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex39 {
  code = `// feature-flag.guard.ts
export const featureFlagGuard = (flag: string) => () => {
  const flags = inject(FeatureFlagService);
  return flags.isEnabled(flag);
};

// app.routes.ts
{
  path: 'new-checkout',
  canActivate: [featureFlagGuard('new-checkout')],
  loadComponent: () =>
    import('./checkout-v2/checkout-v2.component')
      .then(m => m.CheckoutV2Component)
},
{
  path: 'checkout',  // fallback route
  loadComponent: () =>
    import('./checkout/checkout.component')
      .then(m => m.CheckoutComponent)
}`;
}

// 40. Prefetch on idle (requestIdleCallback + import())
@Component({
  selector: 'ex-40', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">Prefetch on idle (requestIdleCallback)</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex40 {
  code = `// idle-preload.strategy.ts
@Injectable({ providedIn: 'root' })
export class IdlePreloadStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    return new Observable(observer => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          load().subscribe(observer);
        });
      } else {
        // Fallback: setTimeout
        setTimeout(() => load().subscribe(observer), 2000);
      }
    });
  }
}

// app.config.ts
provideRouter(routes, withPreloading(IdlePreloadStrategy))`;
}

// 41. Retry on lazy load failure
@Component({
  selector: 'ex-41', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">Retry on lazy load failure</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex41 {
  code = `// retry-lazy.ts
function retryImport<T>(importFn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  return importFn().catch(err => {
    if (retries <= 0) throw err;
    return new Promise(resolve => setTimeout(resolve, delay))
      .then(() => retryImport(importFn, retries - 1, delay));
  });
}

// Usage in route:
{
  path: 'dashboard',
  loadComponent: () =>
    retryImport(() =>
      import('./dashboard/dashboard.component')
        .then(m => m.DashboardComponent)
    )
}`;
}

// 42. withComponentInputBinding for lazy components
@Component({
  selector: 'ex-42', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">withComponentInputBinding — queryParams as @Input</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex42 {
  code = `// app.config.ts
provideRouter(routes, withComponentInputBinding())

// product-detail.component.ts
@Component({ standalone: true, ... })
export class ProductDetailComponent {
  // Route params auto-bound as @Input
  @Input() id!: string;           // from :id
  @Input() tab?: string;          // from ?tab=reviews
  @Input() sort?: string;         // from ?sort=price
}

// Route: /products/123?tab=reviews
// → id = '123', tab = 'reviews'
// No inject(ActivatedRoute) needed!`;
}

// 43. withViewTransitions with lazy routes
@Component({
  selector: 'ex-43', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">withViewTransitions with lazy routes</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex43 {
  code = `// app.config.ts
provideRouter(routes, withViewTransitions())

// CSS for smooth lazy route transitions:
@keyframes slide-in {
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0); }
}

:root { view-transition-name: page; }

::view-transition-new(page) {
  animation: slide-in 0.3s ease;
}

// The transition plays even for lazy-loaded routes
// Angular waits for component to load, then transitions`;
}

// 44. Lazy with SSR (TransferState concept)
@Component({
  selector: 'ex-44', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">Lazy with SSR and TransferState</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex44 {
  code = `// In a lazy-loaded component using TransferState:
@Component({ standalone: true, ... })
export class LazyProductsComponent {
  private transferState = inject(TransferState);
  private http = inject(HttpClient);
  private PRODUCTS_KEY = makeStateKey<Product[]>('products');

  products = signal<Product[]>([]);

  ngOnInit() {
    if (this.transferState.hasKey(this.PRODUCTS_KEY)) {
      // Reuse server-fetched data (no HTTP call on client)
      this.products.set(this.transferState.get(this.PRODUCTS_KEY, []));
      this.transferState.remove(this.PRODUCTS_KEY);
    } else {
      this.http.get<Product[]>('/api/products').subscribe(p => {
        this.products.set(p);
      });
    }
  }
}`;
}

// 45. Lazy + standalone providers array
@Component({
  selector: 'ex-45', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">Lazy route with providers array (route-scoped DI)</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex45 {
  code = `export const routes: Routes = [
  {
    path: 'shop',
    loadComponent: () =>
      import('./shop/shop-layout.component')
        .then(m => m.ShopLayoutComponent),
    providers: [
      // These are ONLY available within /shop route tree
      ShopCartService,
      ShopSearchService,
      { provide: SHOP_CONFIG, useValue: { currency: 'USD' } },
      importProvidersFrom(SomeModule)
    ],
    children: [
      { path: 'products', component: ProductListComponent },
      { path: 'cart', component: CartComponent }
    ]
  }
];`;
}

// 46. Route-level error boundary for lazy
@Component({
  selector: 'ex-46', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">Route-level error boundary for lazy failures</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex46 {
  code = `// app.component.ts — listen for chunk load errors
@Component({ standalone: true, ... })
export class AppComponent implements OnInit {
  router = inject(Router);

  ngOnInit() {
    this.router.events.pipe(
      filter(e => e instanceof NavigationError)
    ).subscribe((e: NavigationError) => {
      if (e.error?.name === 'ChunkLoadError') {
        // Reload page to get fresh chunks after deployment
        window.location.assign(e.url);
      } else {
        this.router.navigate(['/error'], {
          state: { message: e.error?.message }
        });
      }
    });
  }
}`;
}

// 47. Lazy chunk preload priority service
@Component({
  selector: 'ex-47', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">Lazy chunk preload priority service</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex47 {
  code = `// preload-priority.strategy.ts
@Injectable({ providedIn: 'root' })
export class PriorityPreloadStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    const priority = route.data?.['preloadPriority'];

    if (priority === 'high') return load();  // immediate
    if (priority === 'low') {
      return timer(3000).pipe(mergeMap(() => load())); // 3s delay
    }
    return of(null);  // no preload
  }
}

// Routes:
{ path: 'dashboard', data: { preloadPriority: 'high' }, loadComponent: ... },
{ path: 'reports',   data: { preloadPriority: 'low'  }, loadComponent: ... },
{ path: 'archive',                                        loadComponent: ... }`;
}

// 48. Lazy with Angular CDK overlay
@Component({
  selector: 'ex-48', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">Lazy component + CDK Overlay pattern</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex48 {
  code = `// Lazily create an overlay panel with dynamic component
async openPanel() {
  const overlay = inject(Overlay);
  const overlayRef = overlay.create({
    positionStrategy: overlay.position().global().centerHorizontally()
  });

  // Lazy load the panel component
  const { PanelComponent } = await import('./panel/panel.component');

  const portal = new ComponentPortal(PanelComponent);
  const ref = overlayRef.attach(portal);

  ref.instance.data = this.selectedItem;
  ref.instance.close.subscribe(() => overlayRef.dispose());
}`;
}

// 49. Lazy component + portal service
@Component({
  selector: 'ex-49', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">Lazy component via Portal service</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:12px">{{ code }}</pre>
    </div>`
})
class Ex49 {
  code = `// portal.service.ts
@Injectable({ providedIn: 'root' })
export class PortalService {
  async openModal(modalName: string): Promise<void> {
    let Component: Type<unknown>;

    switch (modalName) {
      case 'user-edit':
        ({ UserEditModalComponent: Component } =
          await import('./modals/user-edit.modal'));
        break;
      case 'confirm':
        ({ ConfirmModalComponent: Component } =
          await import('./modals/confirm.modal'));
        break;
    }

    // Dynamically create component in overlay
    const viewContainerRef = this.getRootViewContainer();
    viewContainerRef.createComponent(Component);
  }
}`;
}

// 50. Full lazy-loaded feature architecture (code display)
@Component({
  selector: 'ex-50', standalone: true,
  template: `
    <div>
      <p style="font-weight:bold">Full lazy-loaded feature architecture</p>
      <pre style="background:#f5f5f5;padding:8px;font-size:11px;overflow-x:auto">{{ code }}</pre>
    </div>`
})
class Ex50 {
  code = `src/
├── app/
│   ├── app.component.ts        (shell, eager)
│   ├── app.config.ts           (router setup)
│   ├── app.routes.ts           (top-level routes)
│   └── features/
│       ├── auth/               (chunk: auth)
│       │   ├── auth.routes.ts
│       │   ├── login/login.component.ts
│       │   └── register/register.component.ts
│       ├── dashboard/          (chunk: dashboard)
│       │   ├── dashboard.component.ts
│       │   └── widgets/
│       │       ├── analytics.widget.ts   (@defer)
│       │       └── revenue.widget.ts     (@defer)
│       ├── shop/               (chunk: shop)
│       │   ├── shop.routes.ts
│       │   ├── product-list/
│       │   ├── product-detail/
│       │   └── checkout/       (nested chunk: checkout)
│       │       └── checkout.routes.ts
│       └── admin/              (chunk: admin)
│           ├── admin.routes.ts
│           └── ...

// app.routes.ts
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'auth', loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES) },
  { path: 'dashboard', canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'shop', loadChildren: () => import('./features/shop/shop.routes').then(m => m.SHOP_ROUTES) },
  { path: 'admin', canActivate: [adminGuard],
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES) },
  { path: '**', component: NotFoundComponent }
];`;
}

@Component({
  selector: 'app-root', standalone: true,
  imports: [
    Ex01, Ex02, Ex03, Ex04, Ex05, Ex06, Ex07, Ex08, Ex09, Ex10,
    Ex11, Ex12, Ex13, Ex14, Ex15, Ex16, Ex17, Ex18, Ex19, Ex20,
    Ex21, Ex22, Ex23, Ex24, Ex25, Ex26, Ex27, Ex28, Ex29, Ex30,
    Ex31, Ex32, Ex33, Ex34, Ex35, Ex36, Ex37, Ex38, Ex39, Ex40,
    Ex41, Ex42, Ex43, Ex44, Ex45, Ex46, Ex47, Ex48, Ex49, Ex50
  ],
  template: `
    <div style="font-family:sans-serif;max-width:700px;margin:0 auto;padding:20px">
      <h1>Examples 4.3 — Lazy Loading Routes</h1>
      <h4>1. loadComponent syntax shown (code display)</h4><ex-01 /><hr />
      <h4>2. loadChildren with routes array (code display)</h4><ex-02 /><hr />
      <h4>3. Lazy route config structure (code display)</h4><ex-03 /><hr />
      <h4>4. Default export component for lazy</h4><ex-04 /><hr />
      <h4>5. Named export component for lazy</h4><ex-05 /><hr />
      <h4>6. Simulated lazy load (dynamic import simulation with signal)</h4><ex-06 /><hr />
      <h4>7. Lazy route with title property</h4><ex-07 /><hr />
      <h4>8. Lazy route with data property</h4><ex-08 /><hr />
      <h4>9. Lazy route with canActivate (code display)</h4><ex-09 /><hr />
      <h4>10. Lazy route with resolve (code display)</h4><ex-10 /><hr />
      <h4>11. Feature routes array export pattern</h4><ex-11 /><hr />
      <h4>12. Route config: eager vs lazy comparison</h4><ex-12 /><hr />
      <h4>13. Lazy loading indicator pattern (signal isLoading)</h4><ex-13 /><hr />
      <h4>14. Lazy feature with nested child routes (code display)</h4><ex-14 /><hr />
      <h4>15. PreloadAllModules strategy (code display)</h4><ex-15 /><hr />
      <h4>16. NoPreloading strategy (code display)</h4><ex-16 /><hr />
      <h4>17. Custom preload strategy (SelectivePreloading)</h4><ex-17 /><hr />
      <h4>18. Lazy with shared service (providedIn: 'root')</h4><ex-18 /><hr />
      <h4>19. loadComponent with resolver (code display)</h4><ex-19 /><hr />
      <h4>20. loadComponent with guard (code display)</h4><ex-20 /><hr />
      <h4>21. Prefetch on hover pattern (mouseenter + import())</h4><ex-21 /><hr />
      <h4>22. Lazy error handling (catch on import())</h4><ex-22 /><hr />
      <h4>23. Lazy loading progress indicator</h4><ex-23 /><hr />
      <h4>24. Route chunk naming (webpackChunkName comment)</h4><ex-24 /><hr />
      <h4>25. Lazy feature with component-level providers</h4><ex-25 /><hr />
      <h4>26. Lazy with provideRouter subset</h4><ex-26 /><hr />
      <h4>27. Lazy feature containing lazy sub-feature</h4><ex-27 /><hr />
      <h4>28. Lazy admin + lazy user separate features</h4><ex-28 /><hr />
      <h4>29. Lazy dashboard with lazy widget components</h4><ex-29 /><hr />
      <h4>30. Lazy auth module with redirect after load</h4><ex-30 /><hr />
      <h4>31. Lazy settings with tab-based sub-routes</h4><ex-31 /><hr />
      <h4>32. Lazy module with shared lazy service</h4><ex-32 /><hr />
      <h4>33. Lazy with breadcrumb data resolver</h4><ex-33 /><hr />
      <h4>34. Lazy with title strategy</h4><ex-34 /><hr />
      <h4>35. Lazy with SEO meta resolver</h4><ex-35 /><hr />
      <h4>36. Bundle analyzer — how to check lazy chunk sizes</h4><ex-36 /><hr />
      <h4>37. Lazy component deferred (loadComponent + @defer combo)</h4><ex-37 /><hr />
      <h4>38. Full app route config with strategic lazy splitting</h4><ex-38 /><hr />
      <h4>39. Dynamic import with condition (if feature flag)</h4><ex-39 /><hr />
      <h4>40. Prefetch on idle (requestIdleCallback + import())</h4><ex-40 /><hr />
      <h4>41. Retry on lazy load failure</h4><ex-41 /><hr />
      <h4>42. withComponentInputBinding for lazy components</h4><ex-42 /><hr />
      <h4>43. withViewTransitions with lazy routes</h4><ex-43 /><hr />
      <h4>44. Lazy with SSR (TransferState concept)</h4><ex-44 /><hr />
      <h4>45. Lazy + standalone providers array</h4><ex-45 /><hr />
      <h4>46. Route-level error boundary for lazy</h4><ex-46 /><hr />
      <h4>47. Lazy chunk preload priority service</h4><ex-47 /><hr />
      <h4>48. Lazy with Angular CDK overlay</h4><ex-48 /><hr />
      <h4>49. Lazy component + portal service</h4><ex-49 /><hr />
      <h4>50. Full lazy-loaded feature architecture (code display)</h4><ex-50 /><hr />
    </div>`
})
export class AppComponent {}
